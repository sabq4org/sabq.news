/**
 * NotebookLM Service
 * Integration with Google Gemini for professional infographic generation
 * Uses Gemini 3 Pro Image for high-quality Arabic infographics
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { ObjectStorageService } from "../objectStorage";
import pRetry from "p-retry";

// Validate required environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
if (!apiKey) {
  console.error("[NotebookLM] CRITICAL: GEMINI_API_KEY or AI_INTEGRATIONS_GEMINI_API_KEY is not set!");
  console.error("[NotebookLM] Image generation will fail without valid API key");
} else {
  console.log("[NotebookLM] API key configured successfully");
}

// Initialize Gemini client
const geminiClient = new GoogleGenAI({
  apiKey: apiKey || "missing-api-key",
});

// Initialize Object Storage Service
const objectStorageService = new ObjectStorageService();

interface NotebookLMConfig {
  apiKey?: string;
  baseUrl?: string;
}

interface NotebookLMGenerationOptions {
  prompt: string;
  detail: 'concise' | 'standard' | 'detailed';
  orientation: 'square' | 'portrait' | 'landscape';
  language: string;
  colorStyle?: 'auto' | 'vibrant' | 'professional' | 'elegant' | 'modern';
}

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

// Map orientations to aspect ratios
function getAspectRatio(orientation: string): "1:1" | "16:9" | "9:16" {
  switch (orientation) {
    case 'square': return '1:1';
    case 'landscape': return '16:9';
    case 'portrait': return '9:16';
    default: return '16:9';
  }
}

class NotebookLMService {
  private config: NotebookLMConfig;

  constructor(config?: NotebookLMConfig) {
    this.config = {
      apiKey: config?.apiKey || apiKey,
      baseUrl: config?.baseUrl || 'https://generativelanguage.googleapis.com'
    };
  }

  /**
   * Generate infographic using Gemini 3 Pro Image
   */
  async generateInfographic(options: NotebookLMGenerationOptions): Promise<{
    success: boolean;
    imageUrl?: string;
    imageData?: string; // Base64
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('[NotebookLM] Generating infographic with Gemini 3 Pro Image');
      console.log(`[NotebookLM] Prompt: "${options.prompt.substring(0, 100)}..."`);
      
      // Build enhanced prompt for infographic generation
      const languageInstructions = {
        'ar': 'Create a professional Arabic infographic. Use right-to-left text layout. Include clear Arabic typography.',
        'en': 'Create a professional English infographic. Use clear typography and modern design.',
        'ur': 'Create a professional Urdu infographic. Use right-to-left text layout. Include clear Urdu typography.',
      };

      const detailInstructions = {
        'concise': 'Keep it simple with key points only.',
        'standard': 'Include main points with supporting details.',
        'detailed': 'Include comprehensive information with statistics and examples.',
      };

      // Define color palettes for different styles
      const colorPalettes: Record<string, string[]> = {
        vibrant: [
          'vibrant gradient (orange to purple) with yellow accents',
          'bold red-orange gradient with deep blue accents',
          'energetic yellow-orange with turquoise highlights',
          'bright magenta-cyan gradient with lime green highlights'
        ],
        professional: [
          'professional blue-green gradient with coral highlights',
          'corporate navy-teal with silver accents',
          'business gray-blue with gold highlights',
          'classic royal blue with charcoal and white accents'
        ],
        elegant: [
          'elegant teal-cyan with golden yellow highlights',
          'sophisticated navy-purple with rose gold accents',
          'luxurious emerald-sapphire with pearl accents',
          'refined burgundy-gold with cream highlights'
        ],
        modern: [
          'modern pink-purple gradient with mint green accents',
          'fresh green-lime gradient with sky blue highlights',
          'contemporary coral-turquoise with yellow highlights',
          'trendy neon gradient with dark background'
        ],
        auto: [
          'vibrant gradient (orange to purple) with yellow accents',
          'professional blue-green gradient with coral highlights',
          'modern pink-purple gradient with mint green accents',
          'elegant teal-cyan with golden yellow highlights',
          'bold red-orange gradient with deep blue accents',
          'fresh green-lime gradient with sky blue highlights',
          'sophisticated navy-purple with rose gold accents',
          'energetic yellow-orange with turquoise highlights'
        ]
      };
      
      // Select palette based on user preference or random
      const stylePreference = options.colorStyle || 'auto';
      const availablePalettes = colorPalettes[stylePreference] || colorPalettes.auto;
      const selectedPalette = availablePalettes[Math.floor(Math.random() * availablePalettes.length)];
      
      const enhancedPrompt = `
${languageInstructions[options.language as keyof typeof languageInstructions] || languageInstructions['ar']}

CONTENT TO VISUALIZE:
${options.prompt}

DESIGN SPECIFICATIONS:
- Creative infographic design with ${selectedPalette}
- ${detailInstructions[options.detail]}
- Use 3-4 complementary colors maximum for visual harmony
- Apply gradients and modern color transitions
- Include decorative geometric shapes and patterns
- Clear visual hierarchy with varied font sizes and weights
- Professional icons, illustrations, and vector graphics
- Charts, diagrams, or data visualizations where appropriate
- White space for breathing room and clean look
- Rounded corners and soft shadows for depth
- Modern, magazine-quality layout
- High contrast text on colored backgrounds
- Creative typography mixing Arabic/English fonts
- Visual metaphors and creative representations
- Publication-ready for social media (Instagram, Twitter, LinkedIn)

CRITICAL BRANDING RULES - DO NOT INCLUDE:
❌ NO "Sabq" branding, logo, or text watermarks
❌ NO "سبق" text or Arabic branding anywhere
❌ NO decorative patterns/motifs that could be mistaken for logos
❌ NO company-specific branding elements
✅ Create a clean, neutral, professional infographic
✅ Focus on content visualization without publisher branding
✅ Use generic design elements that work for any publication

AVOID:
- Any text or branding related to "Sabq" or "سبق"
- Decorative patterns that could be confused with logos
- Single flat colors without gradients
- Stock photos or clipart
- Cluttered or busy designs
- Low contrast color combinations
- Generic or boring layouts

Create a stunning, eye-catching, brand-neutral infographic that stands out in social media feeds and captures attention immediately.
      `.trim();

      // Build the generation request
      const contents: any[] = [{
        role: "user",
        parts: [{ text: enhancedPrompt }]
      }];
      
      // Configure generation settings
      const aspectRatio = getAspectRatio(options.orientation);
      const config: any = {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K", // High quality for infographics
          numImages: 1
        }
      };
      
      console.log(`[NotebookLM] Generating with aspect ratio: ${aspectRatio}`);
      
      // Generate with retry logic
      const response = await pRetry(
        async () => {
          try {
            return await geminiClient.models.generateContent({
              model: "gemini-3-pro-image-preview",
              contents,
              config
            });
          } catch (error: any) {
            console.error(`[NotebookLM] Generation error:`, error);
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
            console.log(`[NotebookLM] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          }
        }
      );
      
      const generationTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`[NotebookLM] Generation completed in ${generationTime}s`);
      
      // Extract image data
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
      
      if (!imagePart?.inlineData?.data) {
        throw new Error('No image data in response');
      }

      const imageBase64 = imagePart.inlineData.data;
      console.log(`[NotebookLM] Image data received (${Math.round(imageBase64.length / 1024)}KB)`);

      // Upload to Google Cloud Storage
      const timestamp = Date.now();
      const fileName = `notebooklm_infographic_${timestamp}.png`;
      const filePath = `ai-generated/${fileName}`;
      
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      
      const uploadResult = await objectStorageService.uploadFile(
        filePath,
        imageBuffer,
        "image/png",
        "public"
      );
      
      console.log(`[NotebookLM] Image uploaded to GCS:`, uploadResult.url);
      
      // Return URL through our public-objects endpoint
      const publicUrl = `/public-objects/${filePath}`;
      console.log(`[NotebookLM] Public URL: ${publicUrl}`);

      return {
        success: true,
        imageUrl: publicUrl,
        imageData: imageBase64,
      };
    } catch (error: any) {
      const generationTime = Math.round((Date.now() - startTime) / 1000);
      console.error(`[NotebookLM] Generation failed after ${generationTime}s:`, error);
      return {
        success: false,
        error: error.message || 'Failed to generate infographic',
      };
    }
  }

  /**
   * Get available features and limits
   */
  getCapabilities() {
    return {
      maxSources: 50,
      supportedFormats: ['PDF', 'TXT', 'MD', 'Google Docs', 'Google Slides', 'Audio', 'YouTube'],
      outputFormats: ['PNG'],
      languages: ['ar', 'en', 'ur', 'es', 'fr', 'de', 'zh', 'ja', 'ko'],
      detailLevels: ['concise', 'standard', 'detailed'],
      orientations: ['square', 'portrait', 'landscape'],
      features: {
        infographics: true,
        slideDecks: true,
        audioOverviews: true,
        summaries: true,
        faqs: true,
        studyGuides: true,
      },
    };
  }

  /**
   * Validate generation options
   */
  validateOptions(options: NotebookLMGenerationOptions): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!options.prompt || options.prompt.trim().length < 10) {
      errors.push('Content must be at least 10 characters');
    }

    if (options.prompt.length > 10000) {
      errors.push('Content exceeds maximum length of 10,000 characters');
    }

    const validDetails = ['concise', 'standard', 'detailed'];
    if (!validDetails.includes(options.detail)) {
      errors.push('Invalid detail level');
    }

    const validOrientations = ['square', 'portrait', 'landscape'];
    if (!validOrientations.includes(options.orientation)) {
      errors.push('Invalid orientation');
    }

    const capabilities = this.getCapabilities();
    if (!capabilities.languages.includes(options.language)) {
      errors.push('Unsupported language');
    }

    // Validate color style if provided
    if (options.colorStyle) {
      const validColorStyles = ['auto', 'vibrant', 'professional', 'elegant', 'modern'];
      if (!validColorStyles.includes(options.colorStyle)) {
        errors.push('Invalid color style');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const notebookLmService = new NotebookLMService();

// Export class for testing
export { NotebookLMService, NotebookLMGenerationOptions };
