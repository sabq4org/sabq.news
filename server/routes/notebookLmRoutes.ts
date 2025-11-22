/**
 * NotebookLM API Routes
 * Handle infographic generation using Google NotebookLM
 */

import { Router, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { notebookLmService } from "../services/notebookLmService";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { mediaFiles } from "@shared/schema";

const router = Router();

/**
 * POST /api/notebooklm/generate
 * Generate infographic using NotebookLM
 */
router.post("/generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { prompt, detail, orientation, language } = req.body;
    const userId = (req.user as any)?.id;

    // Validate input
    if (!prompt) {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    // Validate options
    const validation = notebookLmService.validateOptions({
      prompt,
      detail: detail || 'standard',
      orientation: orientation || 'landscape',
      language: language || 'ar',
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid options",
        details: validation.errors,
      });
    }

    console.log(`[NotebookLM API] Generating infographic for user ${userId}`);

    // Generate infographic
    const result = await notebookLmService.generateInfographic({
      prompt,
      detail: detail || 'standard',
      orientation: orientation || 'landscape',
      language: language || 'ar',
    });

    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }

    // Save to media files
    const mediaFile = await db.insert(mediaFiles).values({
      fileName: `infographic_${Date.now()}.png`,
      originalName: `infographic_${Date.now()}.png`,
      type: 'image' as const,
      mimeType: 'image/png',
      size: 0, // Will be updated when actual file is available
      url: result.imageUrl!,
      thumbnailUrl: result.imageUrl,
      keywords: ['infographic', 'notebooklm', language],
      isAiGenerated: true,
      aiGenerationModel: 'notebooklm',
      aiGenerationPrompt: prompt,
      uploadedBy: userId,
      usedIn: ['infographic'],
    }).returning();

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      mediaFileId: mediaFile[0].id,
      message: "Infographic generated successfully",
    });
  } catch (error: any) {
    console.error("[NotebookLM API] Generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate infographic",
    });
  }
});

/**
 * GET /api/notebooklm/capabilities
 * Get NotebookLM capabilities and limits
 */
router.get("/capabilities", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const capabilities = notebookLmService.getCapabilities();
    res.json(capabilities);
  } catch (error: any) {
    console.error("[NotebookLM API] Error fetching capabilities:", error);
    res.status(500).json({
      error: "Failed to fetch capabilities",
    });
  }
});

/**
 * POST /api/notebooklm/validate
 * Validate generation options
 */
router.post("/validate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { prompt, detail, orientation, language } = req.body;
    
    const validation = notebookLmService.validateOptions({
      prompt: prompt || '',
      detail: detail || 'standard',
      orientation: orientation || 'landscape',
      language: language || 'ar',
    });

    res.json(validation);
  } catch (error: any) {
    console.error("[NotebookLM API] Validation error:", error);
    res.status(500).json({
      error: "Failed to validate options",
    });
  }
});

/**
 * GET /api/notebooklm/generations
 * Get user's NotebookLM generations
 */
router.get("/generations", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    const generations = await db
      .select()
      .from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.uploadedBy, userId),
          eq(mediaFiles.aiGenerationModel, 'notebooklm')
        )
      )
      .orderBy(desc(mediaFiles.createdAt))
      .limit(50);

    res.json({
      generations,
      total: generations.length,
    });
  } catch (error: any) {
    console.error("[NotebookLM API] Error fetching generations:", error);
    res.status(500).json({
      error: "Failed to fetch generations",
    });
  }
});

export default router;