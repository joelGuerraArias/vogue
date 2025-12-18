import { GoogleGenAI } from "@google/genai";
import { FileData } from '../types';

// Get API Key from localStorage or environment
const getApiKey = (): string => {
  // First try localStorage
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;
  
  // Fallback to environment variable
  const envKey = process.env.API_KEY;
  if (envKey) return envKey;
  
  throw new Error("API Key not found. Please configure your API Key.");
};

// We use a fresh instance creation inside functions to ensure we capture the latest API Key
const getAIClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

// Save API Key to localStorage
export const saveApiKey = (apiKey: string) => {
  localStorage.setItem('gemini_api_key', apiKey);
};

// Check if API Key exists
export const hasApiKey = (): boolean => {
  const storedKey = localStorage.getItem('gemini_api_key');
  const envKey = process.env.API_KEY;
  return !!(storedKey || envKey);
};

// Clear API Key
export const clearApiKey = () => {
  localStorage.removeItem('gemini_api_key');
};

// 4 different elegant poses with the SAME outfit
const ELEGANT_POSES = [
  {
    name: "Pose 1 - Frontal",
    prompt: `
    POSE: Standing straight facing the camera directly
    - Body facing forward, shoulders square to camera
    - Arms relaxed at sides or one hand on hip
    - Head straight, looking directly at camera
    - Confident and natural stance
    - Weight evenly distributed on both feet
    
    FRAMING: Full body shot - head to toes visible, centered in frame
    `
  },
  {
    name: "Pose 2 - Three Quarter",
    prompt: `
    POSE: Body turned 45 degrees, face towards camera
    - Body angled slightly to the side (3/4 view)
    - Face turned towards camera with gentle expression
    - One hand on hip or touching hair elegantly
    - Relaxed but poised posture
    - Shows outfit from a flattering angle
    
    FRAMING: Full body shot - entire person visible from head to feet, well centered
    `
  },
  {
    name: "Pose 3 - Profile",
    prompt: `
    POSE: Side profile, elegant stance
    - Body in profile (side view), head turned slightly to show face
    - One leg slightly forward for dynamic look
    - Arms in graceful position (one hand on hip or both relaxed)
    - Shows silhouette and outfit lines beautifully
    - Elegant and fashion-forward
    
    FRAMING: Full body profile - complete side view, head to feet visible
    `
  },
  {
    name: "Pose 4 - Dynamic",
    prompt: `
    POSE: Dynamic movement, walking or turning
    - Captured mid-movement (walking towards camera or turning)
    - Natural movement with energy
    - Hair and clothes showing slight motion
    - One foot forward, confident stride
    - Engaging and lively expression
    
    FRAMING: Full body shot - entire person in frame, no cropping
    `
  }
];

/**
 * Generates 4 ultra-elegant photos with different styles using Gemini Flash Image.
 */
export const generateTryOnImage = async (
  person: FileData,
  top: FileData | null,
  bottom: FileData | null,
  shoes: FileData | null,
  poseIndex: number = 0
): Promise<string> => {
  const ai = getAIClient();
  const pose = ELEGANT_POSES[poseIndex % ELEGANT_POSES.length];
  
  // Construct the prompt and parts
  const parts: any[] = [];
  let promptText = `
    🎨 ULTRA HIGH-END FASHION PHOTOGRAPHY EXPERT 🎨
    
    You are the world's most acclaimed fashion photographer and digital artist, specializing in luxury editorial photography for Vogue, Harper's Bazaar, and high-fashion runway campaigns.
    
    📸 INPUT IMAGES:
    Image 1: THE MODEL - The person who will wear the outfit
  `;
  
  parts.push({
    inlineData: {
      mimeType: person.mimeType,
      data: person.base64
    }
  });

  let imageIndex = 2;
  
  if (top) {
    promptText += `\n    Image ${imageIndex}: THE TOP - Upper body garment (shirt/dress/coat/blouse)`;
    parts.push({ inlineData: { mimeType: top.mimeType, data: top.base64 } });
    imageIndex++;
  }
  
  if (bottom) {
    promptText += `\n    Image ${imageIndex}: THE BOTTOM - Lower body garment (pants/skirt/shorts)`;
    parts.push({ inlineData: { mimeType: bottom.mimeType, data: bottom.base64 } });
    imageIndex++;
  }

  if (shoes) {
    promptText += `\n    Image ${imageIndex}: THE FOOTWEAR - Shoes/boots`;
    parts.push({ inlineData: { mimeType: shoes.mimeType, data: shoes.base64 } });
    imageIndex++;
  }

  promptText += `
    
    INSTRUCTION: This is a virtual try-on task. You must dress the person from Image 1 with the garments provided in the other images.
    
    MANDATORY REQUIREMENTS:
    
    1. SAME PERSON - CRITICAL:
       The person MUST be IDENTICAL in ALL 4 photos.
       - Use the EXACT person from Image 1 in this photo
       - DO NOT create a different person
       - DO NOT change face, body, skin color, hair, or any features
       - All 4 photos must show the SAME recognizable person
    
    2. CONSISTENT FRAMING - CRITICAL (All 4 photos MUST have the same framing):
       CAMERA DISTANCE: Keep the same distance from the person in all 4 photos
       ZOOM LEVEL: Use the exact same zoom level - the person should occupy the same amount of space in the frame
       PERSON SIZE: The person's height in the frame must be identical across all 4 photos
       PROPORTIONS: Maintain proper human body proportions - no distortion, stretching, or compression
       FULL BODY: Always show the complete person from head to feet
       CENTERING: Person centered vertically and horizontally in frame
       CONSISTENCY: If the person's head is 20% from the top in one photo, it should be 20% in all photos
       
       Think of it like this: Same camera, same lens, same distance - only the pose changes.
    
    3. USE ALL GARMENTS - CRITICAL:`;

  // Add specific instructions for each garment type
  if (top) {
    promptText += `
       TOP GARMENT: You MUST use the top/shirt/dress from the provided image.
       - Replace the person's original top completely
       - Use the exact colors and style shown`;
  }
  
  if (bottom) {
    promptText += `
       BOTTOM GARMENT: You MUST use the pants/skirt/shorts from the provided image.
       - Replace the person's original bottom completely
       - Use the exact colors and style shown`;
  }
  
  if (shoes) {
    promptText += `
       SHOES/FOOTWEAR: You MUST put the shoes from the provided image on the person's feet.
       - Replace the original shoes completely
       - The person MUST be wearing the new shoes
       - DO NOT leave the person with old shoes or no shoes
       - The shoes MUST be visible in the photo`;
  }

  promptText += `
    
    4. POSE:
       ${pose.name}
       ${pose.prompt}
       
       IMPORTANT: Only the pose changes - framing, zoom, and person size stay exactly the same.
    
    5. FULL BODY SHOT:
       - Show complete person from head to feet
       - All body parts visible (head, arms, legs, feet)
       - Person centered in frame
       - Same scale across all 4 photos
    
    6. WHITE BACKGROUND:
       - Pure white studio background
       - Professional catalog photography
       - Clean and minimal
    
    VERIFICATION BEFORE GENERATING:
    - Is this the same person from Image 1? YES/NO - MUST BE YES
    - Are ALL garments (top, bottom, shoes) being used? YES/NO - MUST BE YES
    - Is the full body visible without cropping? YES/NO - MUST BE YES
    - Is the framing and zoom consistent with the other photos? YES/NO - MUST BE YES
    - Are the proportions correct (no distortion)? YES/NO - MUST BE YES
    
    Generate the photo now following these exact instructions.
  `;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: parts
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated by the model.");
};

/**
 * Generates 4 elegant photos with different styles
 */
export const generateMultipleTryOnImages = async (
  person: FileData,
  top: FileData | null,
  bottom: FileData | null,
  shoes: FileData | null
): Promise<string[]> => {
  const images: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    const image = await generateTryOnImage(person, top, bottom, shoes, i);
    images.push(image);
  }
  
  return images;
};

/**
 * Generates a 5-second video using Veo 3 based on the generated image.
 */
export const generateFashionVideo = async (
  imageBase64: string, // This expects the raw base64 string without data prefix, or we strip it
  mimeType: string = 'image/png'
): Promise<string> => {
  const ai = getAIClient();

  // Strip prefix if present
  const cleanBase64 = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: "Cinematic fashion runway shot. The person is posing confidently and looking at the camera. Slight slow motion, high fashion lighting, 4k quality, photorealistic.",
    image: {
      imageBytes: cleanBase64,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16' // Vertical for mobile/fashion look
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation failed or returned no URI.");
  }

  // Fetch the actual video bytes using the URI and API Key
  const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
     throw new Error("Failed to download generated video.");
  }
  
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};