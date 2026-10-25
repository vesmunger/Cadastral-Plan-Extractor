
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it in your environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to a base64 string and format for the API
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; }; }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            // This case should ideally not happen with readAsDataURL
            resolve('');
        }
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      mimeType: file.type,
      data,
    },
  };
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        metadata: {
            type: Type.OBJECT,
            properties: {
                lotNumber: { type: Type.STRING, description: "The primary lot number or identifier of the main parcel." },
                planNumber: { type: Type.STRING, description: "The official plan, survey, or file number." },
                surveyorName: { type: Type.STRING, description: "The name of the registered surveyor or firm." },
                surveyDate: { type: Type.STRING, description: "The date the survey was completed, in YYYY-MM-DD format if possible." }
            },
            required: ["lotNumber", "planNumber"]
        },
        polygon: {
            type: Type.ARRAY,
            description: "An array of {x, y} coordinate objects for the main parcel's boundary vertices. Coordinates must be normalized from 0.0 to 1.0 relative to the image's width and height.",
            items: {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.NUMBER, description: "The x-coordinate as a ratio of image width (0.0 to 1.0)." },
                    y: { type: Type.NUMBER, description: "The y-coordinate as a ratio of image height (0.0 to 1.0)." }
                },
                required: ["x", "y"]
            }
        }
    },
    required: ["metadata", "polygon"]
};


export const extractCadastralInfo = async (file: File): Promise<ExtractedData> => {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `Analyze this cadastral survey plan. Your task is to extract key metadata and the geometric polygon of the main land parcel.
    1.  **Metadata Extraction:** Identify the lot number, plan number, surveyor's name, and the survey date.
    2.  **Polygon Extraction:** Trace the boundary of the primary land parcel. Provide a list of vertex coordinates. These coordinates must be normalized, where the top-left corner of the image is (0, 0) and the bottom-right is (1, 1).
    3.  **Output:** Return the information in a valid JSON object matching the provided schema. Ensure all polygon coordinates are between 0.0 and 1.0.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: prompt },
                    imagePart,
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as ExtractedData;

        // Basic validation
        if (!parsedData.metadata || !parsedData.polygon) {
            throw new Error("AI response is missing required fields.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && error.message.includes("429")) {
             throw new Error("API rate limit exceeded. Please try again later.");
        }
        throw new Error("Failed to parse cadastral plan. The AI could not understand the document or there was a network issue.");
    }
};
