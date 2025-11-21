/**
 * Nano Banana Pro Image Generation Service
 * Uses Google Gemini 3 Pro Image (gemini-3-pro-image-preview) for AI image generation
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { objectStorageClient } from "../objectStorage";
import pRetry from "p-retry";

// Validate required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("[Nano Banana Pro] CRITICAL: GEMINI_API_KEY is not set!");
  console.error("[Nano Banana Pro] Image generation will fail without valid API key");
}

if (!process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID) {
  console.error("[Nano Banana Pro] CRITICAL: DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set!");
  console.error("[Nano Banana Pro] Image uploads will fail without storage bucket");
}

// Initialize Gemini client with custom API key
const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "missing-api-key",
});

// Use Replit's configured object storage client
const bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "missing-bucket";
const bucket = objectStorageClient.bucket(bucketName);

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
    
    // Extract image data
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response");
    }
    
    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    
    console.log(`[Nano Banana Pro] Image generated successfully in ${generationTime}s`);
    
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
 * Upload generated image to Google Cloud Storage
 */
export async function uploadImageToStorage(
  imageBase64: string,
  fileName: string,
  mimeType: string = "image/png"
): Promise<{ url: string; thumbnailUrl?: string }> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Upload to public directory in GCS
    const filePath = `public/ai-generated/${fileName}`;
    const file = bucket.file(filePath);
    
    // Save file with proper metadata
    await file.save(imageBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          source: "nano-banana-pro",
          generatedAt: new Date().toISOString()
        }
      }
    });
    
    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    
    console.log(`[Nano Banana Pro] Image uploaded to: ${publicUrl}`);
    
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
