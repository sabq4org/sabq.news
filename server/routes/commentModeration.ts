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

// Get AI moderation statistics (for dashboard)
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await storage.getAIModerationStats();
    res.json(stats);
  } catch (error) {
    console.error("[Moderation API] Stats error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الإحصائيات" });
  }
});

// Get moderation results with filters
router.get("/results", async (req: Request, res: Response) => {
  try {
    const { classification, minScore, maxScore, limit = "50" } = req.query;
    
    const results = await storage.getModerationResults({
      classification: classification as string | undefined,
      minScore: minScore ? parseInt(minScore as string, 10) : undefined,
      maxScore: maxScore ? parseInt(maxScore as string, 10) : undefined,
      limit: parseInt(limit as string, 10),
    });
    
    res.json(results);
  } catch (error) {
    console.error("[Moderation API] Results error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب النتائج" });
  }
});

// Analyze all pending comments
router.post("/analyze-all", async (req: Request, res: Response) => {
  try {
    const pendingComments = await storage.getUnanalyzedComments(50);
    
    let analyzed = 0;
    for (const comment of pendingComments) {
      try {
        const result = await moderateComment(comment.content);
        await storage.updateCommentModeration(comment.id, {
          aiModerationScore: result.score,
          aiClassification: result.classification,
          aiDetectedIssues: result.detected,
          aiModerationReason: result.reason,
          aiAnalyzedAt: new Date(),
        });
        analyzed++;
      } catch (err) {
        console.error(`[Moderation] Failed to analyze comment ${comment.id}:`, err);
      }
    }
    
    res.json({ success: true, count: analyzed });
  } catch (error) {
    console.error("[Moderation API] Analyze all error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحليل التعليقات" });
  }
});

// Analyze a single comment by ID
router.post("/analyze/:commentId", async (req: Request, res: Response) => {
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
    console.error("[Moderation API] Analyze single error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحليل التعليق" });
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

// Edit a comment with audit trail
const editCommentSchema = z.object({
  content: z.string().min(1, "يجب توفير محتوى التعليق"),
  reason: z.string().optional(),
});

router.put("/edit/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "يجب تسجيل الدخول" });
    }

    const parsed = editCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { content, reason } = parsed.data;
    
    const updatedComment = await storage.editCommentWithHistory(
      commentId, 
      content, 
      userId, 
      reason
    );

    res.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error("[Moderation API] Edit error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء تعديل التعليق";
    res.status(500).json({ error: message });
  }
});

// Delete a comment with audit trail
const deleteCommentSchema = z.object({
  reason: z.string().optional(),
});

router.delete("/delete/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "يجب تسجيل الدخول" });
    }

    const parsed = deleteCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { reason } = parsed.data;
    
    await storage.deleteCommentWithLog(commentId, userId, reason);

    res.json({ success: true });
  } catch (error) {
    console.error("[Moderation API] Delete error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء حذف التعليق";
    res.status(500).json({ error: message });
  }
});

// Get edit history for a comment
router.get("/history/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    const history = await storage.getCommentEditHistory(commentId);
    
    res.json(history);
  } catch (error) {
    console.error("[Moderation API] History error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب سجل التعديلات" });
  }
});

// Get comment with article details
router.get("/details/:commentId", async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    const result = await storage.getCommentWithArticle(commentId);
    
    if (!result) {
      return res.status(404).json({ error: "التعليق غير موجود" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("[Moderation API] Details error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب تفاصيل التعليق" });
  }
});

export default router;
