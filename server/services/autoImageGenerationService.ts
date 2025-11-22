/**
 * Auto Image Generation Service
 * Automatically generates AI images for articles without hero images
 */

import { generateNewsImage } from "./visualAiService";
import { db } from "../db";
import { articles, mediaFiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Configuration
const AUTO_GENERATION_CONFIG = {
  enabled: true,
  defaultStyle: "photorealistic",
  defaultMood: "neutral",
  defaultModel: "nano-banana-pro",
  
  // Generate for these article types
  articleTypes: ["news", "opinion", "analysis", "column"],
  
  // Skip generation for these categories (can be customized)
  skipCategories: [] as string[],
  
  // Add AI disclaimer in alt text
  aiDisclaimer: {
    ar: "صورة تم إنشاؤها بواسطة الذكاء الاصطناعي",
    en: "AI-Generated Image",
    ur: "مصنوعی ذہانت سے تیار کردہ تصویر"
  }
};

export interface AutoImageGenerationRequest {
  articleId: string;
  title: string;
  content?: string;
  excerpt?: string;
  category?: string;
  language: "ar" | "en" | "ur";
  articleType?: string;
  forceGeneration?: boolean; // Force generation even if image exists
}

export interface AutoImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  altText?: string;
  mediaFileId?: string;
  message?: string;
  error?: string;
}

/**
 * Automatically generate image for article if needed
 */
export async function autoGenerateImage(
  request: AutoImageGenerationRequest,
  userId: string
): Promise<AutoImageGenerationResult> {
  try {
    // Check if auto generation is enabled
    if (!AUTO_GENERATION_CONFIG.enabled && !request.forceGeneration) {
      return {
        success: false,
        message: "Auto image generation is disabled"
      };
    }
    
    // Check if article type is eligible
    if (!request.forceGeneration && 
        request.articleType && 
        !AUTO_GENERATION_CONFIG.articleTypes.includes(request.articleType)) {
      return {
        success: false,
        message: `Auto generation not enabled for ${request.articleType} articles`
      };
    }
    
    // Check if category should be skipped
    if (!request.forceGeneration && 
        request.category && 
        AUTO_GENERATION_CONFIG.skipCategories.includes(request.category)) {
      return {
        success: false,
        message: `Auto generation skipped for category ${request.category}`
      };
    }
    
    console.log(`[Auto Image] Generating for article: ${request.articleId}`);
    
    // Generate smart prompt based on article content
    const smartPrompt = generateSmartPrompt(request);
    
    // Generate image using Visual AI service
    const generationResult = await generateNewsImage({
      articleTitle: request.title,
      articleSummary: request.excerpt || extractSummary(request.content || ""),
      category: request.category || "عام",
      language: request.language,
      style: AUTO_GENERATION_CONFIG.defaultStyle as any,
      mood: AUTO_GENERATION_CONFIG.defaultMood as any
    });
    
    if (!generationResult.success || !generationResult.imageUrl) {
      return {
        success: false,
        error: generationResult.error || "Image generation failed"
      };
    }
    
    // Create alt text with AI disclaimer
    const altText = createAltTextWithDisclaimer(
      request.title,
      request.language
    );
    
    // Save to media library
    const [savedMedia] = await db.insert(mediaFiles).values({
      fileName: `auto-generated-${request.articleId}-${Date.now()}.png`,
      originalName: `${request.title.substring(0, 50)}.png`,
      url: generationResult.imageUrl,
      thumbnailUrl: generationResult.thumbnailUrl,
      type: "image",
      mimeType: "image/png",
      size: 0, // Will be updated later if needed
      
      // Metadata with AI disclaimer
      title: request.title,
      description: `Auto-generated image for: ${request.title}`,
      altText: altText,
      caption: AUTO_GENERATION_CONFIG.aiDisclaimer[request.language],
      keywords: extractKeywords(request.title),
      
      // AI Generation tracking
      isAiGenerated: true,
      aiGenerationModel: AUTO_GENERATION_CONFIG.defaultModel,
      aiGenerationPrompt: smartPrompt,
      
      // Organization
      category: "articles",
      usedIn: [request.articleId],
      usageCount: 1,
      
      uploadedBy: userId
    }).returning();
    
    // Update article with generated image and AI metadata
    await db.update(articles)
      .set({ 
        imageUrl: generationResult.imageUrl,
        isAiGeneratedImage: true,
        aiImageModel: AUTO_GENERATION_CONFIG.defaultModel,
        aiImagePrompt: smartPrompt,
        updatedAt: new Date()
      })
      .where(eq(articles.id, request.articleId));
    
    console.log(`[Auto Image] Successfully generated for article: ${request.articleId}`);
    
    return {
      success: true,
      imageUrl: generationResult.imageUrl,
      altText: altText,
      mediaFileId: savedMedia.id,
      message: "Image generated successfully"
    };
    
  } catch (error: any) {
    console.error("[Auto Image] Generation failed:", error);
    return {
      success: false,
      error: error.message || "Auto image generation failed"
    };
  }
}

/**
 * Generate smart prompt based on article content
 */
function generateSmartPrompt(request: AutoImageGenerationRequest): string {
  const { title, content, excerpt, category, language } = request;
  
  let prompt = `Professional news image for article titled: "${title}"`;
  
  if (category) {
    prompt += `\nCategory: ${category}`;
  }
  
  if (excerpt) {
    prompt += `\nSummary: ${excerpt}`;
  } else if (content) {
    // Extract key points from content
    const keyPoints = extractKeyPoints(content);
    if (keyPoints.length > 0) {
      prompt += `\nKey points: ${keyPoints.join(", ")}`;
    }
  }
  
  // Add style guidance
  prompt += `
Style requirements:
- Professional journalism quality
- Culturally appropriate for ${language === "ar" ? "Arabic" : language === "ur" ? "Urdu" : "English"} audience
- Modern, clean composition
- No text or watermarks
- Suitable for news publication
- Visually engaging and relevant to the topic`;
  
  return prompt;
}

/**
 * Extract summary from content (first 200 characters)
 */
function extractSummary(content: string): string {
  const cleanContent = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
  
  return cleanContent.substring(0, 200) + (cleanContent.length > 200 ? "..." : "");
}

/**
 * Extract key points from content
 */
function extractKeyPoints(content: string): string[] {
  const cleanContent = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
  
  // Extract sentences that might be key points
  const sentences = cleanContent.split(/[.!?]/).filter(s => s.trim().length > 20);
  
  // Return first 3 sentences as key points
  return sentences.slice(0, 3).map(s => s.trim());
}

/**
 * Extract keywords from title
 */
function extractKeywords(title: string): string[] {
  // Remove common Arabic/English stop words
  const stopWords = [
    "في", "من", "إلى", "على", "مع", "عن", "بعد", "قبل", "أن", "هذا", "هذه",
    "the", "a", "an", "in", "on", "at", "to", "from", "with", "for", "and", "or"
  ];
  
  const words = title.split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word.toLowerCase()))
    .slice(0, 5);
  
  return words;
}

/**
 * Create alt text with AI disclaimer
 */
function createAltTextWithDisclaimer(
  title: string,
  language: "ar" | "en" | "ur"
): string {
  const disclaimer = AUTO_GENERATION_CONFIG.aiDisclaimer[language];
  
  // Format: "Title - AI Generated Image"
  return `${title} - ${disclaimer}`;
}

/**
 * Check if article needs auto-generated image
 */
export async function shouldAutoGenerateImage(articleId: string): Promise<boolean> {
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId)
  });
  
  if (!article) {
    return false;
  }
  
  // Check if article already has an image
  if (article.imageUrl) {
    return false;
  }
  
  // Check if article type is eligible
  if (!AUTO_GENERATION_CONFIG.articleTypes.includes(article.articleType)) {
    return false;
  }
  
  return AUTO_GENERATION_CONFIG.enabled;
}

/**
 * Get auto generation settings
 */
export function getAutoGenerationSettings() {
  return AUTO_GENERATION_CONFIG;
}

/**
 * Update auto generation settings
 */
export function updateAutoGenerationSettings(settings: Partial<typeof AUTO_GENERATION_CONFIG>) {
  Object.assign(AUTO_GENERATION_CONFIG, settings);
}

export default {
  autoGenerateImage,
  shouldAutoGenerateImage,
  getAutoGenerationSettings,
  updateAutoGenerationSettings
};