import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';

if (!process.env.API_KEY) {
  console.error("\nERROR: The API_KEY environment variable is not set.");
  console.error("This application requires a valid Gemini API key to function.");
  console.error("Please store your key in your computer's local environment variables.");
  console.error("\nFor example:");
  console.error("  - On Linux/macOS: export API_KEY='your_gemini_api_key'");
  console.error("  - On Windows (Command Prompt): set API_KEY=your_gemini_api_key");
  console.error("  - On Windows (PowerShell): $env:API_KEY='your_gemini_api_key'");
  console.error("\nAfter setting the variable, please restart the server.\n");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const app = express();
const port = 3001; // Using a port like 3001 for the backend

// --- Constants (mirrored from frontend) ---
const CompilerPhaseName = {
  LEXICAL_ANALYSIS: "Lexical Analysis",
  SYNTAX_ANALYSIS: "Syntax Analysis",
  SEMANTIC_ANALYSIS: "Semantic Analysis",
  INTERMEDIATE_CODE_GENERATION: "Intermediate Code Generation",
  OPTIMIZATION: "Optimization",
  CODE_GENERATION: "Code Generation",
};
const compilerPhaseEnumValues = Object.values(CompilerPhaseName);

// --- Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing

// --- Gemini Logic (moved from frontend service) ---

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isValidCode: { type: Type.BOOLEAN },
    error: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        phase: { type: Type.STRING, enum: compilerPhaseEnumValues },
        message: { type: Type.STRING },
        suggestion: { type: Type.STRING },
      },
    },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, enum: compilerPhaseEnumValues },
          explanation: { type: Type.STRING },
          inputDescription: { type: Type.STRING },
          outputDescription: { type: Type.STRING },
        },
        required: ['name', 'explanation', 'inputDescription', 'outputDescription'],
      },
    },
  },
  required: ['isValidCode', 'error', 'phases'],
};

const analyzeCodeInternal = async (code) => {
  const systemInstruction = `You are an expert compiler design assistant. Your task is to analyze the provided source code and explain its compilation process step-by-step.
- If the code has errors, set 'isValidCode' to false, and detail the error in the 'error' object, specifying the phase, message, and a suggested fix. The 'phases' array can be empty or partially filled up to the error point.
- If the code is valid, set 'isValidCode' to true, 'error' to null, and explain all 6 phases of compilation: Lexical Analysis, Syntax Analysis, Semantic Analysis, Intermediate Code Generation, Optimization, and Code Generation.
- For each phase, provide:
  1. 'explanation': A concise description of the phase's purpose.
  2. 'inputDescription': What this phase takes as input, in the context of the provided code.
  3. 'outputDescription': The result of this phase's processing on the input.
- Specific output formats:
  - Lexical Analysis output should be a markdown table of tokens.
  - Syntax Analysis output MUST be a JSON string that can be parsed into a tree structure (e.g., {"name": "Program", "children": [{"name": "Statement"}]}). The JSON string should not be inside a markdown code block.
  - Intermediate Code Generation output should be a simple representation like Three-Address Code.
- You MUST respond ONLY with a valid JSON object matching the provided schema. Do not include any markdown formatting like \`\`\`json.`;
    
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0,
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

const explainPhaseInternal = async (code, phaseName, phaseContext) => {
  const systemInstruction = `You are an expert and friendly compiler design professor. 
Your task is to provide a detailed, easy-to-understand explanation for a specific compiler phase based on the provided source code and initial context.
- Use simple analogies to explain complex concepts.
- Break down the process for the specific code snippet provided.
- Keep the tone helpful and educational.
- Respond only with the explanation text, formatted in markdown for clarity.`;

  const prompt = `Here is the source code:
\`\`\`
${code}
\`\`\`
A user wants a more detailed explanation of the **${phaseName}** phase.
Here is the current context they have for this phase:
---
${phaseContext}
---
Please provide a more in-depth, beginner-friendly explanation. Explain what's happening step-by-step with reference to the source code. Use a simple analogy if it helps clarify the concept.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0,
    },
  });

  return response.text;
};

const askFollowUpQuestionInternal = async (code, analysis, chatHistory, question) => {
  const systemInstruction = `You are an expert and friendly compiler design professor. 
Your role is to answer a user's questions about compilers, programming languages, and code analysis.
${analysis 
  ? "You have already performed a code analysis. Use the provided context (original code, the JSON analysis, and conversation history) to give an accurate and relevant answer." 
  : "The user has not performed an analysis yet. Answer general questions. You can encourage them to analyze some code to get more specific help."}
- Keep the tone helpful, concise, and educational.
- Format your response using markdown for clarity.
- Do not re-explain an entire analysis unless asked, only answer the specific question.`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0,
    },
    history: chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  const contextPrompt = analysis 
    ? `
CONTEXT FOR THIS CONVERSATION:
---
**Original Source Code:**
\`\`\`
${code}
\`\`\`
**Full Compiler Analysis Summary:**
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`
---
Based on the context above and our conversation so far, please answer my next question.
My question is: ${question}`
    : question;

  const response = await chat.sendMessage({ message: contextPrompt });
  return response.text;
};

// --- API Endpoints ---

const saveReportToFile = async (code, result) => {
  try {
    let reportContent = '';
    reportContent += '============ PHASE 1 — RAW TEXT ============\n';
    reportContent += code + '\n\n';
    const rawTextExplanation = '   Raw text phase: the compiler reads the source file as plain text.\n   This includes preprocessor lines like #include and all comments/whitespace.\n   If the file is empty or missing, the run aborts with a helpful message.';
    reportContent += rawTextExplanation + '\n\n';

    result.phases.forEach((phase, index) => {
      const phaseNumber = index + 2;
      const phaseNameUpper = phase.name.toUpperCase();
      reportContent += `============ PHASE ${phaseNumber} — ${phaseNameUpper} ============\n`;
      let outputDescription = phase.outputDescription;
      if (phase.name === CompilerPhaseName.SYNTAX_ANALYSIS) {
        try {
          outputDescription = JSON.stringify(JSON.parse(phase.outputDescription), null, 2);
        } catch (e) { /* use raw string if not valid JSON */ }
      }
      reportContent += outputDescription + '\n\n';
      const indentedExplanation = phase.explanation.split('\n').map(line => '   ' + line).join('\n');
      reportContent += indentedExplanation + '\n\n';
    });

    // The backend script runs from the `backend` directory. We go up one level to the project root.
    const reportPath = path.join(process.cwd(), '..', 'compiler_report.txt');
    await fs.writeFile(reportPath, reportContent, 'utf-8');
    console.log('Compiler report automatically saved to compiler_report.txt in the project root.');
  } catch (error) {
    console.error('Error automatically saving report to file:', error);
    // We don't re-throw, as failing to save the report should not fail the API call.
  }
};

app.post('/api/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const result = await analyzeCodeInternal(code);

    // If analysis is successful, automatically save the report
    if (result.isValidCode) {
      await saveReportToFile(code, result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ error: error.message || 'An unknown server error occurred.' });
  }
});

app.post('/api/explain', async (req, res) => {
  try {
    const { code, phaseName, phaseContext } = req.body;
    if (!code || !phaseName || !phaseContext) {
      return res.status(400).json({ error: 'Missing required fields: code, phaseName, phaseContext' });
    }
    const explanation = await explainPhaseInternal(code, phaseName, phaseContext);
    res.json({ explanation });
  } catch (error) {
    console.error('Error in /api/explain:', error);
    res.status(500).json({ error: error.message || 'An unknown server error occurred.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { code, analysis, chatHistory, question } = req.body;
    if (!chatHistory || !question) {
      return res.status(400).json({ error: 'Missing required fields: chatHistory, question' });
    }
    const answer = await askFollowUpQuestionInternal(code, analysis, chatHistory, question);
    res.json({ answer });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'An unknown server error occurred.' });
  }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Compiler Craft backend listening at http://localhost:${port}`);
});