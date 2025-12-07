import { GoogleGenAI } from "@google/genai";
import { AIActionType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchResponse {
  text: string;
  sources: GroundingSource[];
}

export const generateStoryEnhancement = async (text: string, action: AIActionType): Promise<string> => {
  if (!text) return "";

  let prompt = "";
  
  switch (action) {
    case 'POLISH':
      prompt = `You are a professional editor. Rewrite the following text to correct grammar, improve flow, and enhance vocabulary while maintaining the original tone. Return ONLY the enhanced text.\n\nText: ${text}`;
      break;
    case 'EXPAND':
      prompt = `You are a creative writing assistant. Expand the following text by adding descriptive details and sensory depth. Keep the narrative consistent. Return ONLY the expanded text.\n\nText: ${text}`;
      break;
    case 'SUMMARIZE':
      prompt = `Summarize the following story into a concise, engaging paragraph suitable for a preview. Return ONLY the summary.\n\nText: ${text}`;
      break;
    case 'TITLE':
      prompt = `Generate a catchy, evocative title for the following story. Return ONLY the title, no quotes.\n\nStory: ${text}`;
      break;
    case 'INSIGHTS':
      prompt = `Analyze the following story and provide 3-4 deep, philosophical, or emotional insights about the themes presented. Format them as a concise paragraph or bullet points. Return ONLY the insights.\n\nStory: ${text}`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process text with AI.");
  }
};

export const suggestTags = async (text: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Suggest 3 to 5 relevant tags for the following story. Return them as a comma-separated list (e.g., "Love, Travel, Mystery"). Return ONLY the list.\n\nStory: ${text}`,
    });
    const result = response.text?.trim() || "";
    return result.split(',').map(tag => tag.trim());
  } catch (error) {
    console.error("Gemini API Error (Tags):", error);
    return [];
  }
};

export const getResearchContext = async (query: string): Promise<ResearchResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Provide a comprehensive factual summary and real-world context about: "${query}". Include key facts, dates, and interesting details to help understand the topic better.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No information found.";
    
    // Extract sources from grounding metadata
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
             title: chunk.web.title,
             uri: chunk.web.uri
          });
        }
      });
    }

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { text: "Failed to retrieve information.", sources: [] };
  }
};