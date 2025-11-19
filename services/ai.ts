import { GoogleGenAI, Type } from "@google/genai";
import { ProductRow } from '../types';

// Initialize the Gemini API client
// Note: In a production app, ensure API_KEY is handled securely (e.g., backend proxy).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProductData = async (data: ProductRow[]) => {
  // Limit data sent to avoid token limits if dataset is huge. 
  // We'll take a representative sample or the first 50 rows for this demo.
  const sampleData = data.slice(0, 50).map(({ id, processingStatus, ...rest }) => rest);
  
  const prompt = `
    Analyze the following product data (JSON format). 
    Provide a brief summary of the inventory health, identify any pricing anomalies (e.g. zero price, negative stock), 
    and give 3 actionable recommendations for the warehouse manager.
    
    Data:
    ${JSON.stringify(sampleData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Error analyzing data with Gemini:", error);
    throw error;
  }
};

export const searchProductImages = async (productName: string): Promise<string[]> => {
  const prompt = `
    Search for high-quality images of the product: "${productName}".
    Return a raw JSON array of strings containing at least 4 direct image URLs (ending in .jpg, .png, .webp, etc.) found via the search.
    Do not include any markdown formatting or explanation, just the JSON array.
  `;

  try {
    // Note: We cannot use responseMimeType: "application/json" with googleSearch tool.
    // We must parse the text manually.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "[]";
    
    // Clean up potential markdown code blocks ```json ... ```
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const urls = JSON.parse(cleanText);
      return Array.isArray(urls) ? urls : [];
    } catch (e) {
      console.warn("Failed to parse image search response as JSON, attempting regex extraction", text);
      // Fallback: Extract URLs using regex
      const urlRegex = /https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi;
      const matches = text.match(urlRegex);
      return matches ? Array.from(matches) : [];
    }
  } catch (error) {
    console.error("Error searching images:", error);
    return [];
  }
};