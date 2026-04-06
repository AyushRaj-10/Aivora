import { GoogleGenAI } from '@google/genai';

const API_KEY = "AIzaSyC6zGRndksCTgWkhLtx6WvubOrYezL0Ykw";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1510832198440-a52376950479?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440407876336-62333a6f010f?q=80&w=1600&auto=format&fit=crop",
];

export function generatePromptFromScene(scene) {
  const blendshapesDesc = scene.blendshapes 
    ? Object.entries(scene.blendshapes).map(([key, val]) => `${key}: ${(val * 100).toFixed(0)}%`).join(', ')
    : '';
    
  return `Cinematic movie frame, close-up portrait of character making this dialogue: "${scene.line}". Facial expression defined by: ${blendshapesDesc}. Director's note: ${scene.director_note}. Emotional subtext: ${scene.subtext}. Dramatic rim lighting, depth of field, high emotional tension, highly realistic, 8k resolution, motion blur effect to look like an active video frame.`;
}

export async function generateImageForKeyframe(prompt, index) {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error, falling back to mock:", error);
    return MOCK_IMAGES[index % MOCK_IMAGES.length];
  }
}
