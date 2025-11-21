/**
 * Nano Banana Pro API Routes
 * Handles AI image generation using Gemini 3 Pro Image
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { aiImageGenerations, insertAiImageGenerationSchema } from "../../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { 
  generateAndUploadImage, 
  type ImageGenerationRequest 
} from "../services/nanoBananaService";
import { z } from "zod";
import { requireAuth } from "../rbac";

// Request body schema (excludes userId - taken from session)
const generateImageRequestSchema = insertAiImageGenerationSchema.omit({ 
  userId: true,
  status: true,
  imageUrl: true,
  thumbnailUrl: true,
  generationTime: true,
  cost: true,
  errorMessage: true,
  metadata: true,
});

const router = Router();

// ============================================================
// NANO BANANA PRO IMAGE GENERATION ROUTES
// ============================================================

/**
 * POST /api/nano-banana/generate
 * Generate image using Nano Banana Pro
 */
router.post("/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // Validate request body (userId comes from session)
    const validatedData = generateImageRequestSchema.parse(req.body);
    
    console.log(`[API] Image generation request from user ${user.id}`);
    
    // Create pending record
    const [record] = await db
      .insert(aiImageGenerations)
      .values({
        userId: user.id,
        articleId: validatedData.articleId,
        prompt: validatedData.prompt,
        negativePrompt: validatedData.negativePrompt,
        model: validatedData.model || "gemini-3-pro-image-preview",
        aspectRatio: validatedData.aspectRatio || "16:9",
        imageSize: validatedData.imageSize || "2K",
        numImages: validatedData.numImages || 1,
        status: "processing",
        enableSearchGrounding: validatedData.enableSearchGrounding || false,
        enableThinking: validatedData.enableThinking !== false,
        referenceImages: validatedData.referenceImages as any,
        brandingConfig: validatedData.brandingConfig as any,
      })
      .returning();
    
    // Generate image
    const generationRequest: ImageGenerationRequest = {
      prompt: validatedData.prompt,
      negativePrompt: validatedData.negativePrompt,
      aspectRatio: validatedData.aspectRatio as any,
      imageSize: validatedData.imageSize as any,
      numImages: validatedData.numImages,
      enableSearchGrounding: validatedData.enableSearchGrounding,
      enableThinking: validatedData.enableThinking !== false,
      referenceImages: validatedData.referenceImages,
      brandingConfig: validatedData.brandingConfig as any,
    };
    
    const result = await generateAndUploadImage(generationRequest, user.id);
    
    // Update record
    await db
      .update(aiImageGenerations)
      .set({
        status: result.success ? "completed" : "failed",
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        generationTime: result.generationTime,
        cost: result.cost,
        metadata: result.metadata as any,
        errorMessage: result.error,
        updatedAt: new Date(),
      })
      .where(eq(aiImageGenerations.id, record.id));
    
    if (!result.success) {
      return res.status(500).json({
        message: "فشل توليد الصورة",
        error: result.error,
        generationId: record.id,
      });
    }
    
    // Return success
    res.json({
      message: "تم توليد الصورة بنجاح",
      generationId: record.id,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      generationTime: result.generationTime,
      cost: result.cost,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error("[API] Image generation error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "بيانات غير صحيحة",
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      message: "خطأ في توليد الصورة",
      error: error.message,
    });
  }
});

/**
 * GET /api/nano-banana/generations
 * Get all image generations for current user
 */
router.get("/generations", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { limit = 20, offset = 0, status, articleId } = req.query;
    
    let query = db
      .select()
      .from(aiImageGenerations)
      .where(eq(aiImageGenerations.userId, user.id))
      .$dynamic();
    
    if (status) {
      query = query.where(
        and(
          eq(aiImageGenerations.userId, user.id),
          eq(aiImageGenerations.status, status as string)
        )
      );
    }
    
    if (articleId) {
      query = query.where(
        and(
          eq(aiImageGenerations.userId, user.id),
          eq(aiImageGenerations.articleId, articleId as string)
        )
      );
    }
    
    const generations = await query
      .orderBy(desc(aiImageGenerations.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json({
      generations,
      count: generations.length,
    });
  } catch (error: any) {
    console.error("[API] Get generations error:", error);
    res.status(500).json({
      message: "خطأ في جلب الصور المولدة",
      error: error.message,
    });
  }
});

/**
 * GET /api/nano-banana/generations/:id
 * Get specific generation by ID
 */
router.get("/generations/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    
    const [generation] = await db
      .select()
      .from(aiImageGenerations)
      .where(
        and(
          eq(aiImageGenerations.id, id),
          eq(aiImageGenerations.userId, user.id)
        )
      )
      .limit(1);
    
    if (!generation) {
      return res.status(404).json({ message: "الصورة غير موجودة" });
    }
    
    res.json(generation);
  } catch (error: any) {
    console.error("[API] Get generation error:", error);
    res.status(500).json({
      message: "خطأ في جلب الصورة",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/nano-banana/generations/:id
 * Delete a generation
 */
router.delete("/generations/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    
    // Check ownership
    const [generation] = await db
      .select()
      .from(aiImageGenerations)
      .where(
        and(
          eq(aiImageGenerations.id, id),
          eq(aiImageGenerations.userId, user.id)
        )
      )
      .limit(1);
    
    if (!generation) {
      return res.status(404).json({ message: "الصورة غير موجودة" });
    }
    
    // Delete
    await db
      .delete(aiImageGenerations)
      .where(eq(aiImageGenerations.id, id));
    
    res.json({ message: "تم حذف الصورة بنجاح" });
  } catch (error: any) {
    console.error("[API] Delete generation error:", error);
    res.status(500).json({
      message: "خطأ في حذف الصورة",
      error: error.message,
    });
  }
});

/**
 * GET /api/nano-banana/stats
 * Get generation statistics for current user
 */
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    const allGenerations = await db
      .select()
      .from(aiImageGenerations)
      .where(eq(aiImageGenerations.userId, user.id));
    
    const stats = {
      total: allGenerations.length,
      completed: allGenerations.filter(g => g.status === "completed").length,
      failed: allGenerations.filter(g => g.status === "failed").length,
      processing: allGenerations.filter(g => g.status === "processing").length,
      totalCost: allGenerations
        .filter(g => g.cost)
        .reduce((sum, g) => sum + (g.cost || 0), 0),
      avgGenerationTime: allGenerations.length > 0
        ? Math.round(
            allGenerations
              .filter(g => g.generationTime)
              .reduce((sum, g) => sum + (g.generationTime || 0), 0) / 
            allGenerations.filter(g => g.generationTime).length
          )
        : 0,
    };
    
    res.json(stats);
  } catch (error: any) {
    console.error("[API] Get stats error:", error);
    res.status(500).json({
      message: "خطأ في جلب الإحصائيات",
      error: error.message,
    });
  }
});

export default router;
