const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const runCommand = (command, cwd) => {
    return new Promise((resolve) => {
        exec(command, { cwd, timeout: 10000 }, (error, stdout, stderr) => {
            resolve({ error, stdout: stdout || '', stderr: stderr || '' });
        });
    });
};

const executeCodeInTempDir = async (language, sourceCode, tempDir) => {
    let result = { compile: { code: 0, output: '' }, run: { code: 0, output: '' } };

    if (language === 'javascript') {
        const filePath = path.join(tempDir, 'main.js');
        fs.writeFileSync(filePath, sourceCode);
        const { error, stdout, stderr } = await runCommand(`node main.js`, tempDir);
        result.run.code = error ? error.code || 1 : 0;
        result.run.output = error || stderr ? `${stderr}\n${stdout}`.trim() : stdout;
    }
    else if (language === 'python') {
        const filePath = path.join(tempDir, 'main.py');
        fs.writeFileSync(filePath, sourceCode);
        const { error, stdout, stderr } = await runCommand(`python3 main.py`, tempDir);
        result.run.code = error ? error.code || 1 : 0;
        result.run.output = error || stderr ? `${stderr}\n${stdout}`.trim() : stdout;
    }
    else if (language === 'java') {
        const filePath = path.join(tempDir, 'Solution.java');
        fs.writeFileSync(filePath, sourceCode);
        const comp = await runCommand(`javac Solution.java`, tempDir);
        if (comp.error || comp.stderr) {
            result.compile.code = 1;
            result.compile.output = comp.stderr;
        } else {
            const run = await runCommand(`java Solution`, tempDir);
            result.run.code = run.error ? run.error.code || 1 : 0;
            result.run.output = run.error || run.stderr ? `${run.stderr}\n${run.stdout}`.trim() : run.stdout;
        }
    }
    else if (language === 'cpp' || language === 'c++') {
        const filePath = path.join(tempDir, 'main.cpp');
        fs.writeFileSync(filePath, sourceCode);
        const comp = await runCommand(`g++ main.cpp -o main`, tempDir);
        if (comp.error || comp.stderr) {
            result.compile.code = 1;
            result.compile.output = comp.stderr;
        } else {
            const run = await runCommand(`./main`, tempDir);
            result.run.code = run.error ? run.error.code || 1 : 0;
            result.run.output = run.error || run.stderr ? `${run.stderr}\n${run.stdout}`.trim() : run.stdout;
        }
    }
    else {
        throw new Error('Unsupported language');
    }

    return result;
};

app.post('/execute', async (req, res) => {
    const { language, sourceCode } = req.body;
    if (!language || !sourceCode) {
        return res.status(400).json({ error: 'Missing language or sourceCode' });
    }

    const jobId = uuidv4();
    const tempDir = path.join(__dirname, 'temp', jobId);

    try {
        fs.mkdirSync(tempDir, { recursive: true });
        const result = await executeCodeInTempDir(language, sourceCode, tempDir);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

app.post('/submit', async (req, res) => {
    const { language, sourceCode, problemId } = req.body;
    if (!language || !sourceCode) {
        return res.status(400).json({ error: 'Missing language or sourceCode' });
    }

    const jobId = uuidv4();
    const tempDir = path.join(__dirname, 'temp', jobId);

    try {
        fs.mkdirSync(tempDir, { recursive: true });
        let result = await executeCodeInTempDir(language, sourceCode, tempDir);

        result.status = 'Wrong Answer';

        if (result.compile.code === 0 && result.run.code === 0) {
            const outStr = String(result.run.output).replace(/\s/g, '');
            if (problemId === 'two-sum') {
                // To support Javascript arrays like "[ 0, 1 ]" which removes spaces -> "[0,1]"
                // Both Java and CPP and Python result in similar array string format.
                if (outStr.includes('Output:[0,1]') || outStr.includes('Output:[1,0]')) {
                    result.status = 'Accepted';
                }
            }
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

app.listen(PORT, () => {
    console.log(`Execution Server listening on port ${PORT}`);
});
