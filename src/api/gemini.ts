import { GoogleGenerativeAI } from "@google/generative-ai";

// For demo purposes, we usually use an environment variable.
// VITE_GEMINI_API_KEY should be set in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";


export type AlertAnalysis = {
    id: string;
    title: string;
    summary: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    suggestedAction: string;
    sender: string;
    timestamp: string;
};

export async function analyzeEmailAlerts(emailJson: string, overrideApiKey?: string): Promise<AlertAnalysis[]> {
    const activeKey = overrideApiKey || API_KEY;
    if (!activeKey) {
        throw new Error("Gemini API Key not found. Please provide one in the UI or .env file.");
    }

    const genAI = new GoogleGenerativeAI(activeKey);
    // Use Gemini 2.0 Flash-Lite - the smallest/fastest stable model for high-quota use
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `
    You are an expert security and system administrator. 
    Analyze the following JSON data which contains email alert information.
    Extract the key alerts and return them as a JSON array of objects.
    Each object must have:
    - id: A unique string identifier.
    - title: A concise title for the alert.
    - summary: A brief summary of what happened.
    - severity: One of "Low", "Medium", "High", "Critical".
    - suggestedAction: What the user should do next.
    - sender: The email sender name or address.
    - timestamp: The time of the alert.
    
    Only return alerts where the severity is "Medium" or higher.
    Return ONLY valid JSON.
    
    Input JSON:
    ${emailJson}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response in case it contains markdown code blocks
        const cleanedText = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedText) as AlertAnalysis[];
    } catch (error) {
        console.error("Error analyzing alerts:", error);
        throw error;
    }
}
