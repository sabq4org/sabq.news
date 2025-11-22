/**
 * Nano Banana Pro Image Generation Service
 * Uses Google Gemini 3 Pro Image (gemini-3-pro-image-preview) for AI image generation
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ObjectStorageService } from "../objectStorage";
import pRetry from "p-retry";

// Validate required environment variables - Try both possible key names
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
if (!apiKey) {
  console.error("[Nano Banana Pro] CRITICAL: GEMINI_API_KEY or AI_INTEGRATIONS_GEMINI_API_KEY is not set!");
  console.error("[Nano Banana Pro] Image generation will fail without valid API key");
} else {
  console.log("[Nano Banana Pro] API key configured successfully");
}

// Initialize Gemini client with custom API key
const geminiClient = new GoogleGenAI({
  apiKey: apiKey || "missing-api-key",
});

// Initialize Object Storage Service
const objectStorageService = new ObjectStorageService();

// Helper to check rate limit errors
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "1:1" | "16:9" | "4:3" | "9:16" | "21:9" | "3:4";
  imageSize?: "1K" | "2K" | "4K";
  numImages?: number;
  enableSearchGrounding?: boolean;
  enableThinking?: boolean;
  referenceImages?: string[]; // Base64 or URLs
  brandingConfig?: {
    logoUrl?: string;
    watermarkText?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageData?: string; // Base64
  generationTime: number;
  cost?: number;
  metadata?: any;
  error?: string;
}

/**
 * Generate image using Nano Banana Pro (Gemini 3 Pro Image)
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[Nano Banana Pro] Generating image with prompt: "${request.prompt.substring(0, 100)}..."`);
    
    // Build the generation request
    const contents: any[] = [{
      role: "user",
      parts: []
    }];
    
    // Add main prompt
    contents[0].parts.push({ text: request.prompt });
    
    // Add negative prompt if provided
    if (request.negativePrompt) {
      contents[0].parts.push({ 
        text: `Avoid: ${request.negativePrompt}` 
      });
    }
    
    // Add reference images if provided (max 14)
    if (request.referenceImages && request.referenceImages.length > 0) {
      const referencesToUse = request.referenceImages.slice(0, 14);
      for (const refImage of referencesToUse) {
        // Assume base64 or fetch from URL
        if (refImage.startsWith('data:')) {
          // Extract base64 data
          const matches = refImage.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            contents[0].parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }
    
    // Configure generation settings
    const config: any = {
      responseModalities: [Modality.IMAGE],
      imageConfig: {
        aspectRatio: request.aspectRatio || "16:9",
        imageSize: request.imageSize || "2K",
        numImages: request.numImages || 1
      }
    };
    
    // Add Google Search grounding if enabled
    if (request.enableSearchGrounding) {
      config.tools = [{ google_search: {} }];
    }
    
    // Generate with retry logic
    const response = await pRetry(
      async () => {
        try {
          return await geminiClient.models.generateContent({
            model: "gemini-3-pro-image-preview", // Nano Banana Pro
            contents,
            config
          });
        } catch (error: any) {
          console.error(`[Nano Banana Pro] Generation error:`, error);
          if (isRateLimitError(error)) {
            throw error; // Retry
          }
          // Don't retry non-rate-limit errors
          const abortError: any = new Error(error.message);
          abortError.name = 'AbortError';
          throw abortError;
        }
      },
      {
        retries: 5,
        minTimeout: 3000,
        maxTimeout: 30000,
        factor: 2,
        onFailedAttempt: (error) => {
          console.log(`[Nano Banana Pro] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
        }
      }
    );
    
    const generationTime = Math.round((Date.now() - startTime) / 1000);
    
    // Log full response structure for debugging
    console.log(`[Nano Banana Pro] Response structure:`, JSON.stringify({
      hasResponse: !!response,
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      responseKeys: Object.keys(response || {}),
      candidateKeys: response.candidates?.[0] ? Object.keys(response.candidates[0]) : null
    }, null, 2));
    
    // Try multiple extraction methods
    let imageBase64: string | null = null;
    let mimeType = "image/png";
    
    // Method 1: Check candidates[0].content.parts for inlineData
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
      if (imagePart?.inlineData?.data) {
        console.log(`[Nano Banana Pro] ✅ Found image in candidates[0].content.parts.inlineData`);
        imageBase64 = imagePart.inlineData.data;
        mimeType = imagePart.inlineData.mimeType || "image/png";
      }
    }
    
    // Method 2: Check direct parts array
    if (!imageBase64 && (response as any).parts) {
      const imagePart = (response as any).parts.find((part: any) => part.inlineData);
      if (imagePart?.inlineData?.data) {
        console.log(`[Nano Banana Pro] ✅ Found image in response.parts.inlineData`);
        imageBase64 = imagePart.inlineData.data;
        mimeType = imagePart.inlineData.mimeType || "image/png";
      }
    }
    
    // Method 3: Check if response itself has image data
    if (!imageBase64 && (response as any).data) {
      console.log(`[Nano Banana Pro] ✅ Found image in response.data`);
      imageBase64 = (response as any).data;
    }
    
    // Method 4: Check text response for base64 (sometimes models return it as text)
    if (!imageBase64 && candidate?.content?.parts) {
      const textPart = candidate.content.parts.find((part: any) => part.text);
      if (textPart?.text && textPart.text.includes('base64')) {
        console.log(`[Nano Banana Pro] ⚠️ Found potential base64 in text response`);
        // Try to extract base64 from text
        const base64Match = textPart.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (base64Match) {
          imageBase64 = base64Match[1];
          console.log(`[Nano Banana Pro] ✅ Extracted base64 from text response`);
        }
      }
    }
    
    if (!imageBase64) {
      console.error(`[Nano Banana Pro] ❌ No image data found. Full response:`, JSON.stringify(response, null, 2).substring(0, 2000));
      throw new Error("No image data in response - the model may not support image generation or the response format has changed");
    }
    
    console.log(`[Nano Banana Pro] ✅ Image generated successfully in ${generationTime}s (${imageBase64.length} bytes)`);
    
    // Calculate estimated cost (based on Nov 2025 pricing)
    const costPerImage = request.imageSize === "4K" ? 0.24 : 0.134;
    const totalCost = costPerImage * (request.numImages || 1);
    
    return {
      success: true,
      imageData: imageBase64,
      generationTime,
      cost: totalCost,
      metadata: {
        model: "gemini-3-pro-image-preview",
        aspectRatio: request.aspectRatio,
        imageSize: request.imageSize,
        thinking: request.enableThinking,
        searchGrounding: request.enableSearchGrounding
      }
    };
  } catch (error: any) {
    const generationTime = Math.round((Date.now() - startTime) / 1000);
    console.error(`[Nano Banana Pro] Generation failed after ${generationTime}s:`, error);
    
    return {
      success: false,
      generationTime,
      error: error.message || "Image generation failed"
    };
  }
}

/**
 * Upload generated image to Google Cloud Storage using Replit's Object Storage
 */
export async function uploadImageToStorage(
  imageBase64: string,
  fileName: string,
  mimeType: string = "image/png"
): Promise<{ url: string; thumbnailUrl?: string }> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Upload to public directory using ObjectStorageService
    const filePath = `ai-generated/${fileName}`;
    
    // Upload file as public
    const result = await objectStorageService.uploadFile(
      filePath,
      imageBuffer,
      mimeType,
      "public" // Make it public
    );
    
    console.log(`[Nano Banana Pro] Image uploaded to GCS:`, result.url);
    
    // Return URL through our public-objects endpoint instead of direct GCS URL
    // This ensures proper access control and avoids CORS/permission issues
    const publicUrl = `/public-objects/${filePath}`;
    console.log(`[Nano Banana Pro] Public URL: ${publicUrl}`);
    
    return {
      url: publicUrl,
      thumbnailUrl: publicUrl // Same URL for now
    };
  } catch (error: any) {
    console.error(`[Nano Banana Pro] Upload failed:`, error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Generate and upload image in one operation
 */
export async function generateAndUploadImage(
  request: ImageGenerationRequest,
  userId: string
): Promise<ImageGenerationResult> {
  const result = await generateImage(request);
  
  if (!result.success || !result.imageData) {
    return result;
  }
  
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.png`;
    
    // Upload to storage
    const { url, thumbnailUrl } = await uploadImageToStorage(
      result.imageData,
      fileName,
      "image/png"
    );
    
    return {
      ...result,
      imageUrl: url,
      thumbnailUrl,
      imageData: undefined // Remove base64 to save space
    };
  } catch (error: any) {
    console.error(`[Nano Banana Pro] Upload failed:`, error);
    return {
      ...result,
      error: `Image generated but upload failed: ${error.message}`
    };
  }
}
