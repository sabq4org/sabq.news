/**
 * Thumbnail Generation Routes
 * خدمة توليد الصور المصغرة للأخبار
 */

import { Router, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import {
  generateArticleThumbnail,
  generateResponsiveThumbnails,
  generateMissingThumbnails
} from "../services/thumbnailService";
import { generateArticleSmartThumbnail } from "../services/aiSmartThumbnailService";

const router = Router();

/**
 * POST /api/thumbnails/generate
 * Generate thumbnail for specific article
 * Supports multiple methods: crop (default), contain, ai-smart, ai-crop
 */
router.post("/generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { articleId, imageUrl, method = 'crop', style, title, excerpt } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        error: "imageUrl is required"
      });
    }
    
    // Validate method
    const validMethods = ['crop', 'ai-smart'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`
      });
    }
    
    // Validate style (if AI Smart method)
    if (method === 'ai-smart' && style) {
      const validStyles = ['news', 'professional', 'vibrant', 'minimal', 'modern'];
      if (!validStyles.includes(style)) {
        return res.status(400).json({
          error: `Invalid style. Must be one of: ${validStyles.join(', ')}`
        });
      }
    }
    
    console.log(`[Thumbnail API] Generating thumbnail using method: ${method}, articleId: ${articleId || 'unsaved'}`);
    
    let thumbnailUrl: string;
    
    // Choose generation method
    if (method === 'ai-smart') {
      // AI Smart Thumbnail - regenerate image professionally
      if (!articleId) {
        return res.status(400).json({
          error: "articleId is required"
        });
      }
      thumbnailUrl = await generateArticleSmartThumbnail(articleId, imageUrl, {
        title,
        excerpt,
        style: style || 'news'
      });
    } else {
      // Traditional methods (crop, contain)
      if (!articleId) {
        return res.status(400).json({
          error: "articleId is required for crop method"
        });
      }
      thumbnailUrl = await generateArticleThumbnail(articleId, imageUrl);
    }
    
    res.json({
      success: true,
      thumbnailUrl,
      method,
      message: "Thumbnail generated successfully"
    });
    
  } catch (error: any) {
    console.error("[Thumbnail API] Generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate thumbnail"
    });
  }
});

/**
 * POST /api/thumbnails/generate-responsive
 * Generate responsive thumbnails in multiple sizes
 */
router.post("/generate-responsive", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { articleId, imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        error: "imageUrl is required"
      });
    }
    
    console.log(`[Thumbnail API] Generating responsive thumbnails`);
    
    const thumbnails = await generateResponsiveThumbnails(imageUrl, articleId);
    
    res.json({
      success: true,
      thumbnails,
      message: "Responsive thumbnails generated successfully"
    });
    
  } catch (error: any) {
    console.error("[Thumbnail API] Responsive generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate responsive thumbnails"
    });
  }
});

/**
 * POST /api/thumbnails/batch-generate
 * Batch generate missing thumbnails (admin only)
 */
router.post("/batch-generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.role;
    
    if (userRole !== "admin") {
      return res.status(403).json({
        error: "Admin access required"
      });
    }
    
    console.log(`[Thumbnail API] Starting batch thumbnail generation`);
    
    // Run batch generation asynchronously
    generateMissingThumbnails().catch(error => {
      console.error("[Thumbnail API] Batch generation failed:", error);
    });
    
    res.json({
      success: true,
      message: "Batch thumbnail generation started in background"
    });
    
  } catch (error: any) {
    console.error("[Thumbnail API] Batch generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to start batch generation"
    });
  }
});

export default router;