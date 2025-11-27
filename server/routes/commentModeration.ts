import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { moderateComment, getStatusFromClassification, ModerationResult } from "../ai/commentModeration";
import { z } from "zod";

const router = Router();

// Analyze a comment with AI
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    
    if (!comment || typeof comment !== "string") {
      return res.status(400).json({ error: "يجب توفير نص التعليق" });
    }

    const result = await moderateComment(comment);
    res.json(result);
  } catch (error) {
    console.error("[Moderation API] Error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحليل التعليق" });
  }
});

// Get moderation statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await storage.getCommentModerationStats();
    res.json(stats);
  } catch (error) {
    console.error("[Moderation API] Stats error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الإحصائيات" });
  }
});

// Get comments for moderation with filters
router.get("/comments", async (req: Request, res: Response) => {
  try {
    const { 
      classification, 
      status, 
      page = "1", 
      limit = "20",
      search 
    } = req.query;

    const filters = {
      classification: classification as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await storage.getCommentsForModeration(filters);
    res.json(result);
  } catch (error) {
    console.error("[Moderation API] Comments error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب التعليقات" });
  }
});

// Re-analyze a comment
router.post("/reanalyze/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    const comment = await storage.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "التعليق غير موجود" });
    }

    const result = await moderateComment(comment.content);
    
    await storage.updateCommentModeration(commentId, {
      aiModerationScore: result.score,
      aiClassification: result.classification,
      aiDetectedIssues: result.detected,
      aiModerationReason: result.reason,
      aiAnalyzedAt: new Date(),
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error("[Moderation API] Reanalyze error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إعادة التحليل" });
  }
});

// Approve a comment
router.post("/approve/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.id;

    await storage.updateCommentStatus(commentId, {
      status: "approved",
      moderatedBy: userId,
      moderatedAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[Moderation API] Approve error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء اعتماد التعليق" });
  }
});

// Reject a comment
router.post("/reject/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    await storage.updateCommentStatus(commentId, {
      status: "rejected",
      moderatedBy: userId,
      moderatedAt: new Date(),
      moderationReason: reason,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[Moderation API] Reject error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء رفض التعليق" });
  }
});

// Bulk actions
router.post("/bulk", async (req: Request, res: Response) => {
  try {
    const { commentIds, action, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({ error: "يجب توفير قائمة التعليقات" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "إجراء غير صالح" });
    }

    const status = action === "approve" ? "approved" : "rejected";
    
    for (const commentId of commentIds) {
      await storage.updateCommentStatus(commentId, {
        status,
        moderatedBy: userId,
        moderatedAt: new Date(),
        moderationReason: action === "reject" ? reason : undefined,
      });
    }

    res.json({ success: true, count: commentIds.length });
  } catch (error) {
    console.error("[Moderation API] Bulk error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تنفيذ الإجراء" });
  }
});

export default router;
