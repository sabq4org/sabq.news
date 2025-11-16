import { Router, Request, Response } from "express";
import multer from "multer";
import { storage } from "../storage";
import { analyzeEmailContent, improveContent, detectLanguage } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
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
  const tokenMatch = text.match(/\[TOKEN:([A-Z0-9]{32})\]/i);
  return tokenMatch ? tokenMatch[1] : null;
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
    const providedToken = tokenInSubject || tokenInBody;

    if (!providedToken || providedToken !== trustedSender.token) {
      console.log("[Email Agent] Invalid token");
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
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

    let emailContent = text || html.replace(/<[^>]*>/g, '');
    emailContent = emailContent.replace(/\[TOKEN:[A-Z0-9]{32}\]/gi, '').trim();

    const detectedLang = await detectLanguage(emailContent);
    const language = (trustedSender.language === "ar" || trustedSender.language === "en" || trustedSender.language === "ur") 
      ? trustedSender.language 
      : detectedLang;
    
    console.log("[Email Agent] Analyzing content...");
    const analysis = await analyzeEmailContent(emailContent);
    
    console.log("[Email Agent] Content quality score:", analysis.qualityScore);
    console.log("[Email Agent] Detected language:", analysis.language);
    console.log("[Email Agent] Detected category:", analysis.detectedCategory);

    if (analysis.qualityScore < 30) {
      console.log("[Email Agent] Content quality too low");
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        trustedSenderId: trustedSender.id,
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "Content quality below threshold",
        analysis,
      });
    }

    console.log("[Email Agent] Improving content...");
    const improvement = await improveContent(emailContent, language);

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

    const articleData: any = {
      id: nanoid(),
      title: improvement.suggestedTitle || subject.replace(/\[TOKEN:[A-Z0-9]{32}\]/gi, '').trim(),
      content: improvement.correctedText,
      excerpt: improvement.suggestedExcerpt || "",
      authorId: trustedSender.createdBy || "system",
      status: trustedSender.autoPublish ? "published" : "draft",
      language: language,
      featuredImage: featuredImage,
      seoKeywords: improvement.seoKeywords,
      createdAt: new Date(),
      publishedAt: trustedSender.autoPublish ? new Date() : null,
    };

    if (improvement.suggestedCategory && trustedSender.defaultCategory) {
      articleData.categoryId = trustedSender.defaultCategory;
    }

    let article;
    article = await storage.createArticle(articleData);

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
      message: trustedSender.autoPublish ? "Article published successfully" : "Article saved as draft",
      article: {
        id: article?.id,
        title: articleData.title,
        status: articleData.status,
      },
      analysis,
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

export default router;
