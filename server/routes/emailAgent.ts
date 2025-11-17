import { Router, Request, Response } from "express";
import multer from "multer";
import { simpleParser } from "mailparser";
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
    console.log("[Email Agent] ============ WEBHOOK START ============");
    console.log("[Email Agent] Received webhook from SendGrid");
    console.log("[Email Agent] Raw req.body keys:", Object.keys(req.body));
    
    let from = "";
    let to = "";
    let subject = "";
    let text = "";
    let html = "";
    
    // Check if SendGrid sent raw email (Inbound Parse Raw mode)
    if (req.body.email) {
      console.log("[Email Agent] Detected RAW email format - parsing with mailparser");
      console.log("[Email Agent] Raw email length:", req.body.email.length);
      
      try {
        // Parse the raw email using mailparser
        const parsed = await simpleParser(req.body.email);
        
        // Use SendGrid's parsed from/to if available, otherwise extract from parsed email
        from = req.body.from || "";
        to = req.body.to || "";
        subject = parsed.subject || req.body.subject || "";
        text = parsed.text || "";
        html = typeof parsed.html === 'string' ? parsed.html : (parsed.html ? String(parsed.html) : "");
        
        console.log("[Email Agent] Parsed email successfully:");
        console.log("[Email Agent] - From:", from);
        console.log("[Email Agent] - To:", to);
        console.log("[Email Agent] - Subject:", subject);
        console.log("[Email Agent] - Text length:", text?.length || 0);
        console.log("[Email Agent] - HTML length:", html?.length || 0);
        
        if (text) {
          console.log("[Email Agent] - Text preview:", text.substring(0, 200));
        }
      } catch (parseError) {
        console.error("[Email Agent] Error parsing raw email:", parseError);
        // Fallback to direct fields
        from = req.body.from || "";
        to = req.body.to || "";
        subject = req.body.subject || "";
      }
    } else {
      // SendGrid sent parsed fields (Inbound Parse Parsed mode)
      console.log("[Email Agent] Using parsed fields from SendGrid");
      from = req.body.from || req.body.sender || "";
      to = req.body.to || req.body.recipient || "";
      subject = req.body.subject || "";
      text = req.body.text || req.body.plain || req.body.body || "";
      html = req.body.html || req.body.html_body || "";
    }
    
    // 📎 Process attachments from SendGrid
    const attachments = (req.files as Express.Multer.File[]) || [];
    
    // Log SendGrid attachment metadata (if available)
    if (req.body.attachments) {
      console.log("[Email Agent] 📎 SendGrid reported attachments count:", req.body.attachments);
    }
    
    if (req.body['attachment-info']) {
      try {
        const attachmentInfo = JSON.parse(req.body['attachment-info']);
        console.log("[Email Agent] 📎 SendGrid attachment-info:", JSON.stringify(attachmentInfo, null, 2));
      } catch (e) {
        console.log("[Email Agent] ⚠️ Could not parse attachment-info");
      }
    }

    console.log("[Email Agent] Final extracted values:");
    console.log("[Email Agent] - From:", from);
    console.log("[Email Agent] - Subject:", subject);
    console.log("[Email Agent] - Text length:", text?.length || 0);
    console.log("[Email Agent] - HTML length:", html?.length || 0);
    console.log("[Email Agent] - Multer files received:", attachments.length);
    console.log("[Email Agent] - req.files keys:", req.files ? Object.keys(req.files) : 'none');
    
    // Enhanced attachment logging
    if (attachments.length > 0) {
      console.log("[Email Agent] 📎 ============ ATTACHMENTS DETAILS ============");
      attachments.forEach((att, idx) => {
        console.log(`[Email Agent] 📎 Attachment ${idx + 1}:`, {
          fieldname: att.fieldname,
          originalname: att.originalname,
          filename: att.filename,
          size: `${(att.size / 1024).toFixed(2)} KB`,
          mimetype: att.mimetype,
          buffer: att.buffer ? 'Present' : 'Missing',
        });
      });
      console.log("[Email Agent] 📎 ==========================================");
    } else {
      console.log("[Email Agent] ⚠️ No attachments found in req.files");
      console.log("[Email Agent] ⚠️ This could mean:");
      console.log("[Email Agent]    1. Email has no attachments");
      console.log("[Email Agent]    2. SendGrid Inbound Parse not configured to send attachments");
      console.log("[Email Agent]    3. Multer configuration issue");
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

    console.log("[Email Agent] Token extraction debug:", {
      subjectLength: subject?.length || 0,
      textLength: text?.length || 0,
      htmlLength: html?.length || 0,
      subjectPreview: subject?.substring(0, 100),
      textPreview: text?.substring(0, 100),
    });

    console.log("[Email Agent] Token search results:", {
      subject: tokenInSubject ? `✓ Found: ${tokenInSubject.substring(0, 8)}...` : "✗ Not found",
      text: tokenInBody ? `✓ Found: ${tokenInBody.substring(0, 8)}...` : "✗ Not found",
      html: tokenInHtml ? `✓ Found: ${tokenInHtml.substring(0, 8)}...` : "✗ Not found",
      providedToken: providedToken ? `✓ Present: ${providedToken.substring(0, 8)}...` : "✗ Missing",
    });

    const storedToken = trustedSender.token?.toLowerCase();
    const isTokenValid = providedToken && storedToken && providedToken === storedToken;

    if (!isTokenValid) {
      console.log("[Email Agent] Token validation failed:", {
        providedToken: providedToken || "null",
        storedToken: storedToken || "null",
        providedLength: providedToken?.length || 0,
        storedLength: storedToken?.length || 0,
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
    
    // 👤 Create or get reporter user for the trusted sender
    console.log("[Email Agent] 👤 Creating/getting reporter user for sender:", trustedSender.name);
    const reporterUser = await storage.getOrCreateReporterUser(
      trustedSender.email,
      trustedSender.name
    );
    console.log("[Email Agent] ✅ Reporter user ready:", reporterUser.id, `-`, reporterUser.firstName, reporterUser.lastName);

    // Extract content from text or HTML
    let emailContent = text || (html ? html.replace(/<[^>]*>/g, '') : '');
    
    // Remove token from content (support all formats)
    emailContent = emailContent
      .replace(/\[TOKEN:\s*[A-F0-9]{64}\s*\]/gi, '')  // [TOKEN:xxx]
      .replace(/TOKEN:\s*[A-F0-9]{64}/gi, '')          // TOKEN:xxx or TOKEN: xxx
      .replace(/\b[A-F0-9]{64}\b/g, '')                // bare 64-hex
      .trim();
    
    console.log("[Email Agent] Content length after token removal:", emailContent.length);
    
    // Check if content is empty
    if (!emailContent || emailContent.length < 10) {
      console.log("[Email Agent] No content found after token removal");
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "no_content",
        trustedSenderId: trustedSender.id,
      });

      const today = new Date();
      await storage.updateEmailAgentStats(today, {
        emailsReceived: 1,
        emailsRejected: 1,
      });

      return res.status(200).json({
        success: false,
        message: "No content found in email",
      });
    }

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

    // 🖼️ Process image attachments
    const uploadedAttachments: string[] = [];
    const uploadedImages: string[] = [];
    let attachmentInfo: any = {};
    
    // Parse SendGrid attachment-info for inline image metadata
    if (req.body['attachment-info']) {
      try {
        attachmentInfo = JSON.parse(req.body['attachment-info']);
      } catch (e) {
        console.log("[Email Agent] Could not parse attachment-info");
      }
    }
    
    if (attachments.length > 0) {
      console.log("[Email Agent] 🖼️ ============ PROCESSING ATTACHMENTS ============");
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        
        try {
          // Validate image files
          const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(attachment.mimetype);
          
          if (isImage) {
            // Validate image size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (attachment.size > maxSize) {
              console.log(`[Email Agent] ⚠️ Image ${attachment.originalname} too large (${(attachment.size / 1024 / 1024).toFixed(2)}MB), skipping`);
              continue;
            }
            
            console.log(`[Email Agent] 📸 Uploading image: ${attachment.originalname} (${(attachment.size / 1024).toFixed(2)} KB)`);
            
            const gcsPath = await uploadAttachmentToGCS(
              attachment.buffer,
              attachment.originalname,
              attachment.mimetype
            );
            
            uploadedAttachments.push(gcsPath);
            uploadedImages.push(gcsPath);
            
            console.log(`[Email Agent] ✅ Image uploaded successfully: ${gcsPath}`);
          } else {
            // Non-image attachment - still upload it
            console.log(`[Email Agent] 📎 Uploading non-image: ${attachment.originalname}`);
            
            const gcsPath = await uploadAttachmentToGCS(
              attachment.buffer,
              attachment.originalname,
              attachment.mimetype
            );
            
            uploadedAttachments.push(gcsPath);
            console.log(`[Email Agent] ✅ Attachment uploaded: ${gcsPath}`);
          }
        } catch (error) {
          console.error(`[Email Agent] ❌ Failed to upload ${attachment.originalname}:`, error);
        }
      }
      
      console.log("[Email Agent] 🖼️ Upload summary:");
      console.log("[Email Agent]    - Total attachments:", attachments.length);
      console.log("[Email Agent]    - Successfully uploaded:", uploadedAttachments.length);
      console.log("[Email Agent]    - Images uploaded:", uploadedImages.length);
      console.log("[Email Agent] 🖼️ ==========================================");
    } else {
      console.log("[Email Agent] ℹ️ No attachments to process");
    }

    // Select featured image (first uploaded image)
    const featuredImage = uploadedImages[0] || null;
    
    if (featuredImage) {
      console.log("[Email Agent] 🎨 Featured image selected:", featuredImage);
    } else {
      console.log("[Email Agent] ℹ️ No featured image (no images in email)");
    }

    const articleTitle = editorialResult.optimized.title || subject.replace(/\[TOKEN:[A-F0-9]{64}\]/gi, '').trim();
    const articleSlug = generateSlug(articleTitle);

    // 🎯 Smart Category Matching System
    console.log("[Email Agent] 🎯 Starting smart category matching...");
    console.log("[Email Agent] AI detected category:", editorialResult.detectedCategory);
    
    // Fetch all active categories from database
    const allCategories = await storage.getAllCategories();
    const activeCategories = allCategories.filter(c => c.status === 'active');
    
    console.log("[Email Agent] Available categories:", activeCategories.length);
    
    // Smart category matching function
    const findMatchingCategory = (detectedName: string) => {
      if (!detectedName) return null;
      
      // Exact match (case-insensitive)
      let match = activeCategories.find(cat => 
        cat.nameAr === detectedName ||
        cat.nameEn.toLowerCase() === detectedName.toLowerCase()
      );
      
      if (match) {
        console.log("[Email Agent] ✅ Exact category match found:", match.nameAr, `(ID: ${match.id})`);
        return match;
      }
      
      // Partial match (fuzzy search)
      match = activeCategories.find(cat => 
        cat.nameAr.includes(detectedName) ||
        cat.nameEn.toLowerCase().includes(detectedName.toLowerCase()) ||
        detectedName.includes(cat.nameAr) ||
        detectedName.toLowerCase().includes(cat.nameEn.toLowerCase())
      );
      
      if (match) {
        console.log("[Email Agent] ⚡ Partial category match found:", match.nameAr, `(ID: ${match.id})`);
        return match;
      }
      
      console.log("[Email Agent] ⚠️ No category match found for:", detectedName);
      return null;
    };
    
    const aiMatchedCategory = findMatchingCategory(editorialResult.detectedCategory);
    
    // Fallback chain: AI match → Trusted sender default → First active → First overall
    let finalCategoryId = aiMatchedCategory?.id;
    
    if (!finalCategoryId && trustedSender.defaultCategory) {
      console.log("[Email Agent] 🔄 Using trusted sender default category:", trustedSender.defaultCategory);
      finalCategoryId = trustedSender.defaultCategory;
    }
    
    if (!finalCategoryId && activeCategories.length > 0) {
      console.log("[Email Agent] 🔄 Using first active category:", activeCategories[0].nameAr);
      finalCategoryId = activeCategories[0].id;
    }
    
    if (!finalCategoryId && allCategories.length > 0) {
      console.log("[Email Agent] ⚠️ Using first available category (inactive):", allCategories[0].nameAr);
      finalCategoryId = allCategories[0].id;
    }
    
    if (!finalCategoryId) {
      console.error("[Email Agent] ❌ CRITICAL: No categories available in database!");
    } else {
      console.log("[Email Agent] ✅ Final category ID selected:", finalCategoryId);
    }

    const articleData: any = {
      id: nanoid(),
      title: articleTitle,
      slug: articleSlug,
      content: editorialResult.optimized.content,
      excerpt: editorialResult.optimized.lead || "",
      authorId: reporterUser.id, // 👤 Article attributed to the reporter, not system!
      status: trustedSender.autoPublish ? "published" : "draft",
      language: editorialResult.language,
      imageUrl: featuredImage, // 🖼️ Featured image URL (first uploaded image)
      seo: {
        keywords: editorialResult.optimized.seoKeywords,
      },
      categoryId: finalCategoryId, // 🎯 Always has a valid category!
      createdAt: new Date(),
      publishedAt: trustedSender.autoPublish ? new Date() : null,
    };

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

    // Update webhook log with correct status based on publication state
    const webhookStatus = trustedSender.autoPublish ? "published" : "processed";
    await storage.updateEmailWebhookLog(webhookLog.id, {
      status: webhookStatus,
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
    // Calculate stats directly from webhook logs for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all webhook logs for today using date range query
    const todayLogs = await storage.getEmailWebhookLogsByDateRange(today, tomorrow);
    
    // Calculate stats from actual logs (already filtered by DB)
    const stats = {
      emailsReceived: todayLogs.length,
      emailsPublished: todayLogs.filter((log: any) => log.status === 'published').length,
      emailsDrafted: todayLogs.filter((log: any) => log.status === 'drafted').length,
      emailsRejected: todayLogs.filter((log: any) => log.status === 'rejected').length,
      emailsFailed: todayLogs.filter((log: any) => log.status === 'failed').length,
    };
    
    // Get language counts from AI analysis in webhook logs
    const languageCounts = {
      arabicCount: todayLogs.filter((log: any) => log.aiAnalysis?.languageDetected === 'ar').length,
      englishCount: todayLogs.filter((log: any) => log.aiAnalysis?.languageDetected === 'en').length,
      urduCount: todayLogs.filter((log: any) => log.aiAnalysis?.languageDetected === 'ur').length,
    };
    
    // Return combined stats
    return res.json({
      ...stats,
      ...languageCounts,
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
