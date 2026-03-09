import axios from 'axios';

const LOCAL_API_URL = 'http://localhost:3001/execute';
const LOCAL_SUBMIT_URL = 'http://localhost:3001/submit';

export const executeCode = async (language, sourceCode, stdin = '') => {
  try {
    const response = await axios.post(LOCAL_API_URL, {
      language: language,
      sourceCode: sourceCode,
      stdin: stdin
    });

    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Execution failed');
    }
    throw new Error('Failed to connect to Local Execution Server. Make sure it is running on port 3001.');
  }
};

export const submitCodeToBackend = async (language, sourceCode, problemId = 'two-sum') => {
  try {
    const response = await axios.post(LOCAL_SUBMIT_URL, {
      language: language,
      sourceCode: sourceCode,
      problemId: problemId
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting code:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Submission failed');
    }
    throw new Error('Failed to connect to Local Execution Server.');
  }
};
