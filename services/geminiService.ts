import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAIResponse = async (prompt: string, context?: string): Promise<string> => {
  try {
    const ai = getClient();
    const finalPrompt = context 
      ? `Context:\n${context}\n\nTask: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: finalPrompt,
    });
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error generating response.";
  }
};

export const generateJsonData = async (description: string): Promise<any> => {
  try {
    const ai = getClient();
    const prompt = `Generate a JSON array of objects based on this description: "${description}". 
    Ensure the root is an Array. Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("AI JSON Error:", error);
    throw error;
  }
}
