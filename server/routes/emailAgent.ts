import { Router, Request, Response } from "express";
import multer from "multer";
import { storage } from "../storage";
import { analyzeAndEditWithSabqStyle, detectLanguage, normalizeLanguageCode } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for file attachments
    fieldSize: 10 * 1024 * 1024, // 10MB for text/html email fields (SendGrid)
  },
});

interface SendGridAttachment {
  filename: string;
  type: string;
  content: Buffer;
}

async function uploadAttachmentToGCS(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

    const { bucketName, objectPath } = parseObjectPath(privateObjectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    
    const fileId = nanoid();
    const extension = filename.split('.').pop() || '';
    const storedFilename = `email-attachments/${fileId}.${extension}`;
    const fullPath = `${objectPath}/${storedFilename}`.replace(/\/+/g, '/');
    
    const gcsFile = bucket.file(fullPath);
    
    await gcsFile.save(file, {
      contentType,
      metadata: {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(`[Email Agent] Uploaded attachment: ${fullPath}`);
    return `${privateObjectDir}/${storedFilename}`;
  } catch (error) {
    console.error("[Email Agent] Error uploading attachment:", error);
    throw error;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectPath: string } {
  const parts = path.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid object path: ${path}`);
  }
  const bucketName = parts[0];
  const objectPath = parts.slice(1).join('/');
  return { bucketName, objectPath };
}

function extractTokenFromText(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
  
  const patterns = [
    /\[TOKEN:\s*([A-F0-9]{64})\s*\]/i,
    /TOKEN:\s*([A-F0-9]{64})/i,
    /\b([A-F0-9]{64})\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      console.log(`[Email Agent] Token extracted using pattern: ${pattern.source}`);
      return match[1].toLowerCase();
    }
  }
  
  return null;
}

function generateSlug(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Add timestamp to ensure uniqueness
  return `${baseSlug}-${Date.now()}`;
}

router.post("/webhook", upload.any(), async (req: Request, res: Response) => {
  try {
    console.log("[Email Agent] Received webhook from SendGrid");
    
    const from = req.body.from || "";
    const to = req.body.to || "";
    const subject = req.body.subject || "";
    const text = req.body.text || "";
    const html = req.body.html || "";
    const attachments = (req.files as Express.Multer.File[]) || [];

    console.log("[Email Agent] From:", from);
    console.log("[Email Agent] Subject:", subject);
    console.log("[Email Agent] Attachments:", attachments.length);
    
    // Enhanced attachment logging
    if (attachments.length > 0) {
      attachments.forEach((att, idx) => {
        console.log(`[Email Agent] Attachment ${idx + 1}:`, {
          filename: att.originalname,
          size: `${(att.size / 1024).toFixed(2)} KB`,
          type: att.mimetype,
        });
      });
    }

    const senderEmail = from.match(/<(.+)>/)?.[1] || from;
    
    const logId = nanoid();
    let webhookLog = await storage.createEmailWebhookLog({
      fromEmail: senderEmail,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "received",
    });

    const trustedSender = await storage.getTrustedSenderByEmail(senderEmail);
    
    if (!trustedSender) {
      console.log("[Email Agent] Sender not trusted:", senderEmail);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "sender_not_trusted",
        senderVerified: false,
        tokenVerified: false,
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Sender not authorized",
      });
    }

    if (trustedSender.status !== "active") {
      console.log("[Email Agent] Sender is inactive:", senderEmail);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "sender_inactive",
        senderVerified: true,
        tokenVerified: false,
        trustedSenderId: trustedSender.id,
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Sender account is inactive",
      });
    }

    const tokenInSubject = extractTokenFromText(subject);
    const tokenInBody = extractTokenFromText(text);
    const tokenInHtml = extractTokenFromText(html);
    const providedToken = tokenInSubject || tokenInBody || tokenInHtml;

    console.log("[Email Agent] Token search results:", {
      subject: tokenInSubject ? "✓ Found" : "✗ Not found",
      text: tokenInBody ? "✓ Found" : "✗ Not found",
      html: tokenInHtml ? "✓ Found" : "✗ Not found",
      providedToken: providedToken ? "✓ Present" : "✗ Missing",
    });

    const storedToken = trustedSender.token?.toLowerCase();
    const isTokenValid = providedToken && storedToken && providedToken === storedToken;

    if (!isTokenValid) {
      console.log("[Email Agent] Token validation failed:", {
        provided: providedToken ? `${providedToken.substring(0, 8)}...` : "null",
        stored: storedToken ? `${storedToken.substring(0, 8)}...` : "null",
        match: providedToken === storedToken,
      });
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "invalid_token",
        senderVerified: true,
        tokenVerified: false,
        trustedSenderId: trustedSender.id,
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Invalid token",
      });
    }

    console.log("[Email Agent] Sender verified successfully");
    
    await storage.updateEmailWebhookLog(webhookLog.id, {
      senderVerified: true,
      tokenVerified: true,
      trustedSenderId: trustedSender.id,
    });

    const systemUser = await storage.getOrCreateSystemUser();
    console.log("[Email Agent] Using system user ID:", systemUser.id);

    let emailContent = text || html.replace(/<[^>]*>/g, '');
    emailContent = emailContent.replace(/\[TOKEN:[A-F0-9]{64}\]/gi, '').trim();

    // Detect language and normalize to ensure valid code
    const detectedLang = await detectLanguage(emailContent);
    const senderLang = normalizeLanguageCode(trustedSender.language || "ar");
    const language = (trustedSender.language === "ar" || trustedSender.language === "en" || trustedSender.language === "ur") 
      ? senderLang
      : detectedLang;
    
    console.log("[Email Agent] Using language:", language);
    
    console.log("[Email Agent] Analyzing and editing with Sabq editorial style...");
    const editorialResult = await analyzeAndEditWithSabqStyle(emailContent, language);
    
    console.log("[Email Agent] Quality score:", editorialResult.qualityScore);
    console.log("[Email Agent] Language:", editorialResult.language);
    console.log("[Email Agent] Category:", editorialResult.detectedCategory);
    console.log("[Email Agent] Has news value:", editorialResult.hasNewsValue);
    console.log("[Email Agent] Issues found:", editorialResult.issues.length);

    if (editorialResult.qualityScore < 30) {
      console.log("[Email Agent] Content quality too low - rejected");
      console.log("[Email Agent] Rejection reasons:", editorialResult.issues);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "quality_too_low",
        trustedSenderId: trustedSender.id,
        aiAnalysis: {
          contentQuality: editorialResult.qualityScore,
          languageDetected: editorialResult.language,
          categoryPredicted: editorialResult.detectedCategory,
          isNewsWorthy: editorialResult.hasNewsValue,
          errors: editorialResult.issues,
          warnings: editorialResult.suggestions,
        },
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Content quality below threshold (Sabq standards)",
        qualityScore: editorialResult.qualityScore,
        issues: editorialResult.issues,
        suggestions: editorialResult.suggestions,
      });
    }

    if (!editorialResult.hasNewsValue) {
      console.log("[Email Agent] Content has no news value - rejected");
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "no_news_value",
        trustedSenderId: trustedSender.id,
        aiAnalysis: {
          contentQuality: editorialResult.qualityScore,
          languageDetected: editorialResult.language,
          categoryPredicted: editorialResult.detectedCategory,
          isNewsWorthy: false,
          errors: editorialResult.issues,
          warnings: editorialResult.suggestions,
        },
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Content has no news value",
        issues: editorialResult.issues,
      });
    }

    const uploadedAttachments: string[] = [];
    
    if (attachments.length > 0) {
      console.log("[Email Agent] Processing attachments...");
      
      for (const attachment of attachments) {
        try {
          const gcsPath = await uploadAttachmentToGCS(
            attachment.buffer,
            attachment.originalname,
            attachment.mimetype
          );
          uploadedAttachments.push(gcsPath);
        } catch (error) {
          console.error("[Email Agent] Failed to upload attachment:", error);
        }
      }
    }

    const featuredImage = uploadedAttachments.find(path => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(path)
    ) || null;

    const articleTitle = editorialResult.optimized.title || subject.replace(/\[TOKEN:[A-F0-9]{64}\]/gi, '').trim();
    const articleSlug = generateSlug(articleTitle);

    const articleData: any = {
      id: nanoid(),
      title: articleTitle,
      slug: articleSlug,
      content: editorialResult.optimized.content,
      excerpt: editorialResult.optimized.lead || "",
      authorId: systemUser.id,
      status: trustedSender.autoPublish ? "published" : "draft",
      language: editorialResult.language,
      featuredImage: featuredImage,
      seoKeywords: editorialResult.optimized.seoKeywords,
      createdAt: new Date(),
      publishedAt: trustedSender.autoPublish ? new Date() : null,
    };

    if (editorialResult.detectedCategory && trustedSender.defaultCategory) {
      articleData.categoryId = trustedSender.defaultCategory;
    }

    let article;
    
    // Use the correct table based on language
    if (editorialResult.language === "en") {
      // For English articles, use the articles table with language set to "en"
      // Note: The system currently stores all articles in the main articles table
      article = await storage.createArticle(articleData);
    } else if (editorialResult.language === "ur") {
      // For Urdu articles, use createUrArticle method
      article = await storage.createUrArticle(articleData);
    } else {
      // For Arabic (default) and any other language, use the main articles table
      article = await storage.createArticle(articleData);
    }

    console.log("[Email Agent] Article created:", article?.id);
    console.log("[Email Agent] Status:", articleData.status);

    await storage.updateEmailWebhookLog(webhookLog.id, {
      status: "processed",
      trustedSenderId: trustedSender.id,
      articleId: article?.id,
    });

    const today = new Date();
    await storage.updateEmailAgentStats(today, {
      emailsReceived: 1,
      ...(trustedSender.autoPublish ? { emailsPublished: 1 } : { emailsDrafted: 1 }),
    });

    return res.status(200).json({
      success: true,
      message: trustedSender.autoPublish 
        ? "Article published successfully (edited with Sabq style)" 
        : "Article saved as draft (edited with Sabq style)",
      article: {
        id: article?.id,
        title: articleData.title,
        status: articleData.status,
        qualityScore: editorialResult.qualityScore,
        language: editorialResult.language,
        category: editorialResult.detectedCategory,
      },
      editorial: {
        qualityScore: editorialResult.qualityScore,
        issues: editorialResult.issues,
        suggestions: editorialResult.suggestions,
      },
    });

  } catch (error: any) {
    console.error("[Email Agent] Error processing webhook:", error);
    
    const today = new Date();
    await storage.updateEmailAgentStats(today, {
      emailsReceived: 1,
      emailsFailed: 1,
    });

    return res.status(200).json({
      success: false,
      message: "Internal processing error",
      error: error.message,
    });
  }
});

// GET /api/email-agent/stats - Get email agent statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Get stats for today
    const today = new Date();
    const stats = await storage.getEmailAgentStats(today);
    
    // Get language counts from articles created via email agent
    const languageCounts = await storage.getEmailLanguageCounts();
    
    // Return combined stats
    return res.json({
      emailsReceived: stats?.emailsReceived || 0,
      emailsPublished: stats?.emailsPublished || 0,
      emailsDrafted: stats?.emailsDrafted || 0,
      emailsRejected: stats?.emailsRejected || 0,
      emailsFailed: stats?.emailsFailed || 0,
      arabicCount: languageCounts.ar || 0,
      englishCount: languageCounts.en || 0,
      urduCount: languageCounts.ur || 0,
    });
  } catch (error: any) {
    console.error("[Email Agent] Error fetching stats:", error);
    return res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// GET /api/email-agent/senders - Get all trusted senders
router.get("/senders", async (req: Request, res: Response) => {
  try {
    const senders = await storage.getTrustedSenders();
    return res.json(senders);
  } catch (error: any) {
    console.error("[Email Agent] Error fetching senders:", error);
    return res.status(500).json({
      message: "Failed to fetch trusted senders",
      error: error.message,
    });
  }
});

// GET /api/email-agent/senders/:id - Get a specific trusted sender
router.get("/senders/:id", async (req: Request, res: Response) => {
  try {
    const sender = await storage.getTrustedSenderById(req.params.id);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }
    return res.json(sender);
  } catch (error: any) {
    console.error("[Email Agent] Error fetching sender:", error);
    return res.status(500).json({
      message: "Failed to fetch sender",
      error: error.message,
    });
  }
});

// POST /api/email-agent/senders - Create a new trusted sender
router.post("/senders", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      const existingSenders = await storage.getTrustedSenders();
      if (existingSenders.length > 0) {
        return res.status(401).json({ 
          message: "Unauthorized - Authentication required to add additional senders" 
        });
      }
      
      console.log("[Email Agent] Bootstrap mode: Creating first trusted sender without authentication");
      const sender = await storage.createTrustedSender(req.body, null as any);
      console.log("[Email Agent] First trusted sender created successfully:", sender.email);
      return res.status(201).json(sender);
    }

    const sender = await storage.createTrustedSender(req.body, userId);
    return res.status(201).json(sender);
  } catch (error: any) {
    console.error("[Email Agent] Error creating sender:", error);
    return res.status(500).json({
      message: "Failed to create trusted sender",
      error: error.message,
    });
  }
});

// PUT /api/email-agent/senders/:id - Update a trusted sender
router.put("/senders/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sender = await storage.updateTrustedSender(req.params.id, req.body);
    return res.json(sender);
  } catch (error: any) {
    console.error("[Email Agent] Error updating sender:", error);
    return res.status(500).json({
      message: "Failed to update trusted sender",
      error: error.message,
    });
  }
});

// DELETE /api/email-agent/senders/:id - Delete a trusted sender
router.delete("/senders/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteTrustedSender(req.params.id);
    return res.json({ message: "Trusted sender deleted successfully" });
  } catch (error: any) {
    console.error("[Email Agent] Error deleting sender:", error);
    return res.status(500).json({
      message: "Failed to delete trusted sender",
      error: error.message,
    });
  }
});

export default router;
