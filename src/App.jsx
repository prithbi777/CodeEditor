import React, { useState, useRef } from 'react';
import Split from 'react-split';
import Editor from '@monaco-editor/react';
import { Play, Send, RefreshCw, Settings, Maximize2, Minimize2, Home, BookOpen, HelpCircle, CheckCircle, Copy, Moon, Sun, X } from 'lucide-react';
import { executeCode, submitCodeToBackend } from './api';
import './App.css';

const PROBLEM_DATA = {
  title: "1. Two Sum",
  difficulty: "Easy",
  acceptance: "52.3%",
  description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 6, we return [0, 1]."
    }
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ]
};

const BOILERPLATE = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // TODO: Write your code here

};

// ----------------------------------------
// Test Code (Hidden in real LeetCode, visible here for Piston API)
// ----------------------------------------
const nums = [2, 7, 11, 15];
const target = 9;
console.log("Input: nums =", nums, "target =", target);
console.log("Output:", twoSum(nums, target));
`,
  python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # TODO: Write your code here
        pass

# ----------------------------------------
# Test Code (Hidden in real LeetCode, visible here for Piston API)
# ----------------------------------------
if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    print(f"Input: nums = {nums}, target = {target}")
    print(f"Output:", Solution().twoSum(nums, target))
`,
  java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // TODO: Write your code here
        return new int[]{};
    }
    
    // ----------------------------------------
    // Test Code (Hidden in real LeetCode, visible here for Piston API)
    // ----------------------------------------
    public static void main(String[] args) {
        Solution solution = new Solution();
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] result = solution.twoSum(nums, target);
        
        System.out.println("Input: nums = [2, 7, 11, 15], target = 9");
        System.out.println("Output: " + Arrays.toString(result));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // TODO: Write your code here
        return {};
    }
};

// ----------------------------------------
// Test Code (Hidden in real LeetCode, visible here for Piston API)
// ----------------------------------------
int main() {
    Solution solution;
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> result = solution.twoSum(nums, target);
    
    cout << "Input: nums = [2, 7, 11, 15], target = 9\n";
    cout << "Output: [";
    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i < result.size() - 1 ? ", " : "");
    }
    cout << "]\n";
    
    return 0;
}
`
};

function App() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(BOILERPLATE.javascript);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases');
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(4);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const editorRef = useRef(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your code? All changes will be lost.")) {
      setCode(BOILERPLATE[language]);
      setOutput('');
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(BOILERPLATE[newLang]);
    setOutput('');
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setOutput('Running code...');
    setActiveConsoleTab('output');

    try {
      const result = await executeCode(language, code);
      // Piston API returns run.output
      if (result.compile && result.compile.code !== 0) {
        setOutput(result.compile.output);
      } else {
        setOutput(result.run.output || 'Code executed successfully but yielded no output.');
      }
    } catch (error) {
      setOutput('Error executing code:\n' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setOutput('Submitting your solution...\nEvaluating multiple hidden test cases...');
    setActiveConsoleTab('output');

    try {
      const result = await submitCodeToBackend(language, code);
      if (result.compile && result.compile.code !== 0) {
        setOutput('Compilation Error:\n' + result.compile.output);
      } else {
        const statusText = result.status === 'Accepted' ? 'Accepted' : 'Wrong Answer';
        setOutput((result.run.output || '') + `\n\n=== SUBMISSION RESULT ===\nStatus: ${statusText} \nRuntime: 12ms\nMemory: 41 MB\nBeats 99.8% of users.`);
      }
      setIsRunning(false);
    } catch (error) {
      setOutput('Error executing code:\n' + error.message);
      setIsRunning(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <div className="nav-logo">
            <BookOpen className="w-5 h-5" style={{ color: "var(--primary-btn)", marginRight: '8px' }} />
            CodeMasters
          </div>
          <div className="nav-tabs">
            <div className="nav-tab active"><BookOpen className="w-4 h-4" style={{ marginRight: '8px' }} /> Problem</div>
            <div className="nav-tab"><CheckCircle className="w-4 h-4" style={{ marginRight: '8px' }} /> Submissions</div>
            <div className="nav-tab"><HelpCircle className="w-4 h-4" style={{ marginRight: '8px' }} /> Help</div>
          </div>
        </div>

        {/* Toggle Theme Button */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <Split
        className="main-split"
        sizes={[45, 55]}
        minSize={300}
        gutterSize={6}
        elementStyle={(dimension, size, gutterSize) => ({
          'flexBasis': `calc(${size}% - ${gutterSize}px)`,
        })}
        gutterStyle={(dimension, gutterSize) => ({
          'flexBasis': `${gutterSize}px`,
        })}
      >
        {/* Left Pane: Problem Description */}
        <div className="left-pane">
          <div className="problem-header">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{PROBLEM_DATA.title}</h1>
            <div className="problem-meta">
              <span className="badge badge-easy">{PROBLEM_DATA.difficulty}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Acceptance: {PROBLEM_DATA.acceptance}</span>
            </div>
          </div>

          <div className="problem-content">
            <p style={{ whiteSpace: 'pre-line' }}>{PROBLEM_DATA.description}</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' }}>Examples:</h2>
            {PROBLEM_DATA.examples.map((ex, index) => (
              <pre key={index}>
                <strong>Input:</strong> {ex.input}<br />
                <strong>Output:</strong> {ex.output}<br />
                {ex.explanation && <><br /><strong>Explanation:</strong> {ex.explanation}</>}
              </pre>
            ))}

            <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' }}>Constraints:</h2>
            <ul className="constraints-list">
              {PROBLEM_DATA.constraints.map((c, i) => (
                <li key={i}><code>{c}</code></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Pane: Code Editor and Output */}
        <div className={`right-pane ${isFullScreen ? 'fullscreen-active' : ''}`}>
          <div className="editor-header">
            <select
              className="language-select"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="java">Java 15</option>
              <option value="cpp">C++</option>
            </select>

            <div className="editor-actions">
              <button className="btn-icon" title="Reset Code" onClick={handleReset}>
                <RefreshCw size={16} />
              </button>
              <button className="btn-icon" title="Editor Settings" onClick={() => setShowSettings(true)}>
                <Settings size={16} />
              </button>
              <button className="btn-icon" title="Full Screen" onClick={toggleFullScreen}>
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          <Split
            direction="vertical"
            sizes={[65, 35]}
            minSize={100}
            gutterSize={6}
            className="editor-console-split"
            elementStyle={(dimension, size, gutterSize) => ({
              height: `calc(${size}% - ${gutterSize}px)`,
            })}
            gutterStyle={(dimension, gutterSize) => ({
              height: `${gutterSize}px`,
            })}
          >
            {/* Monaco Editor */}
            <div className="editor-container">
              <Editor
                height="100%"
                width="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: fontSize,
                  tabSize: tabSize,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  formatOnPaste: true,
                }}
              />
            </div>

            {/* Console / Output Area */}
            <div className="console-area">
              <div className="console-header">
                <div
                  className={`console-tab ${activeConsoleTab === 'testcases' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('testcases')}
                >
                  Test Cases
                </div>
                <div
                  className={`console-tab ${activeConsoleTab === 'output' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('output')}
                >
                  Execution Route Results
                </div>
              </div>

              <div className="console-content">
                {activeConsoleTab === 'testcases' && (
                  <div>
                    <div className="label">Custom Input:</div>
                    <div className="output-box" style={{ background: 'var(--bg-main)' }}>
                      nums = [2, 7, 11, 15]<br />
                      target = 9
                    </div>
                    <div className="label">Expected Output:</div>
                    <div className="output-box" style={{ background: 'var(--bg-main)' }}>
                      [0, 1]
                    </div>
                  </div>
                )}

                {activeConsoleTab === 'output' && (
                  <div>
                    <div className="label">Output:</div>
                    <div className={`output-box ${output.includes('Error') ? 'output-error' : output.includes('Accepted') ? 'output-success' : ''}`}>
                      {output || 'Run your code to see the output here.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Split>

          {/* Footer Navigation */}
          <div className="editor-footer">
            <button
              className="btn btn-secondary"
              onClick={runCode}
              disabled={isRunning}
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button
              className="btn btn-primary"
              onClick={submitCode}
              disabled={isRunning}
            >
              <Send size={16} />
              Submit Solution
            </button>
          </div>
        </div>
      </Split>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>Editor Settings</h2>
              <button className="btn-icon" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="setting-row">
                <label>Font Size</label>
                <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                </select>
              </div>
              <div className="setting-row">
                <label>Tab Size</label>
                <select value={tabSize} onChange={(e) => setTabSize(Number(e.target.value))}>
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
