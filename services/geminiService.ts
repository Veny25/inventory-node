
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { APP_MODELS } from "../constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DetectedObject {
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export const detectObjectsInFrame = async (base64Image: string): Promise<DetectedObject[]> => {
  const ai = getAI();
  const prompt = `Detect prominent inventory items. Provide JSON array with: label, confidence (0-1), box_2d [ymin, xmin, ymax, xmax] (0-1000).`;

  try {
    const response = await ai.models.generateContent({
      model: APP_MODELS.IMAGE,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              box_2d: { 
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "[ymin, xmin, ymax, xmax]"
              }
            },
            required: ["label", "confidence", "box_2d"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Detection error:", e);
    return [];
  }
};

export const analyzeInventoryImage = async (base64Image: string) => {
  const ai = getAI();
  const prompt = `Analyze this inventory item. Check for barcodes/QR. 
  Return JSON: objectName, category, estimatedSpecs, likelySKU (XXX-000), barcodeValue (null if none), suggestedLocation, confidence (0-1).`;

  const response = await ai.models.generateContent({
    model: APP_MODELS.IMAGE,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objectName: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedSpecs: { type: Type.STRING },
          likelySKU: { type: Type.STRING },
          barcodeValue: { type: Type.STRING, nullable: true },
          suggestedLocation: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["objectName", "category", "likelySKU", "suggestedLocation"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * Extracts barcode or QR code values from an image using Gemini vision capabilities.
 */
export const extractBarcode = async (base64Image: string): Promise<string | null> => {
  const ai = getAI();
  const prompt = "Identify and extract the text from any barcode or QR code in this image. Return only the extracted value string. If no code is found, return 'None'.";
  try {
    const response = await ai.models.generateContent({
      model: APP_MODELS.IMAGE,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });
    const text = response.text?.trim();
    return (text && text !== 'None') ? text : null;
  } catch (e) {
    console.error("Barcode extraction error:", e);
    return null;
  }
};

/**
 * Performs advanced OCR to identify product identifiers like SKUs or serial numbers.
 */
export const performAdvancedOCR = async (base64Image: string): Promise<string | null> => {
  const ai = getAI();
  const prompt = "Perform advanced OCR to find product identifiers such as SKU, Serial Number (S/N), or Part Number (P/N). Return ONLY the identifier text. If nothing found, return 'None'.";
  try {
    const response = await ai.models.generateContent({
      model: APP_MODELS.IMAGE,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });
    const text = response.text?.trim();
    return (text && text !== 'None') ? text : null;
  } catch (e) {
    console.error("Advanced OCR error:", e);
    return null;
  }
};

export const chatWithInventoryAssistantStream = async (message: string, context: string, history: any[]) => {
  const ai = getAI();
  const systemInstruction = `You are the InventoryPro Senior Operations Intelligence Officer.
  Use the following CURRENT INVENTORY DATA to answer queries:
  ${context}
  Guidelines: Be precise, show calculations if asked, use markdown. Warn about Critical nodes (stock <= minStock).`;

  const chat = ai.chats.create({
    model: APP_MODELS.TEXT,
    config: { 
      systemInstruction,
      thinkingConfig: { thinkingBudget: 4000 } // Reduced budget for faster response in inventory chat
    },
    history: history
  });

  return await chat.sendMessageStream({ message });
};
