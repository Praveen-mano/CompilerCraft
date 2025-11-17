const BACKEND_URL = 'http://localhost:3001';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const analyzeCode = async (code) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error analyzing code via backend:", error);
    throw new Error(`Failed to analyze code: ${error.message}`);
  }
};

export const explainPhase = async (code, phaseName, phaseContext) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, phaseName, phaseContext }),
    });
    const data = await handleResponse(response);
    return data.explanation;
  } catch (error) {
    console.error("Error explaining phase via backend:", error);
    throw new Error(`Failed to get explanation: ${error.message}`);
  }
};

export const askFollowUpQuestion = async (code, analysis, chatHistory, question) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, analysis, chatHistory, question }),
    });
    const data = await handleResponse(response);
    return data.answer;
  } catch (error) {
    console.error("Error asking follow-up question via backend:", error);
    throw new Error(`Failed to get answer: ${error.message}`);
  }
};
