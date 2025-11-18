import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { analyzeAndEditWithSabqStyle, detectLanguage, normalizeLanguageCode } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";
import { twilioClient, sendWhatsAppMessage, extractTokenFromMessage, removeTokenFromMessage, validateTwilioSignature } from "../services/whatsapp";
import { requireAuth, requireRole } from "../rbac";
import { insertWhatsappTokenSchema } from "@shared/schema";
import crypto from "crypto";

const router = Router();

async function uploadToCloudStorage(
  file: Buffer,
  filename: string,
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  try {
    const objectDir = isPublic 
      ? (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(',')[0]?.trim() || ""
      : process.env.PRIVATE_OBJECT_DIR || "";
    
    if (!objectDir) {
      throw new Error(`${isPublic ? 'PUBLIC_OBJECT_SEARCH_PATHS' : 'PRIVATE_OBJECT_DIR'} not set`);
    }

    const { bucketName, objectPath } = parseObjectPath(objectDir);
    const bucket = objectStorageClient.bucket(bucketName);
    
    const fileId = nanoid();
    const extension = filename.split('.').pop() || '';
    const storedFilename = `whatsapp-media/${fileId}.${extension}`;
    const fullPath = `${objectPath}/${storedFilename}`.replace(/\/+/g, '/');
    
    const gcsFile = bucket.file(fullPath);
    
    await gcsFile.save(file, {
      contentType,
      metadata: {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(`[WhatsApp Agent] Uploaded ${isPublic ? 'PUBLIC' : 'PRIVATE'} media: ${fullPath}`);
    
    if (isPublic) {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fullPath}`;
      console.log(`[WhatsApp Agent] 🌐 Public URL generated: ${publicUrl}`);
      return publicUrl;
    }
    
    return `${objectDir}/${storedFilename}`;
  } catch (error) {
    console.error("[WhatsApp Agent] Error uploading media:", error);
    throw error;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectPath: string } {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const parts = cleanPath.split('/');
  
  if (parts.length < 2) {
    throw new Error(`Invalid object path: ${path}`);
  }
  
  const bucketName = parts[0];
  const objectPath = parts.slice(1).join('/');
  
  console.log(`[WhatsApp Agent] 🪣 Parsed object path: bucket="${bucketName}", path="${objectPath}"`);
  return { bucketName, objectPath };
}

function generateSlug(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${baseSlug}-${Date.now()}`;
}

async function downloadWhatsAppMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  if (!twilioClient) {
    throw new Error("Twilio client not initialized");
  }

  try {
    console.log(`[WhatsApp Agent] Downloading media from: ${mediaUrl}`);
    
    const response = await twilioClient.request({
      method: 'get',
      uri: mediaUrl,
    });

    const buffer = Buffer.from(response.body);
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const extension = contentType.split('/')[1] || 'bin';
    const filename = `media-${nanoid()}.${extension}`;

    console.log(`[WhatsApp Agent] ✅ Downloaded media: ${filename}, size: ${buffer.length} bytes, type: ${contentType}`);
    
    return { buffer, contentType, filename };
  } catch (error) {
    console.error(`[WhatsApp Agent] ❌ Failed to download media from ${mediaUrl}:`, error);
    throw error;
  }
}

// ============================================
// CONFIGURATION ENDPOINT
// ============================================

// GET /api/whatsapp/config - Get WhatsApp configuration
router.get("/config", requireAuth, requireRole('admin', 'manager', 'system_admin'), async (req: Request, res: Response) => {
  try {
    const whatsappNumber = process.env.TWILIO_PHONE_NUMBER || '';
    return res.json({
      whatsappNumber: whatsappNumber || null,
      configured: !!whatsappNumber,
    });
  } catch (error) {
    console.error('[WhatsApp Config] Error:', error);
    return res.status(500).json({ message: 'فشل في تحميل الإعدادات' });
  }
});

// ============================================
// STATISTICS ENDPOINT
// ============================================

// GET /api/whatsapp/stats - Get dashboard statistics
router.get("/stats", requireAuth, requireRole('admin', 'manager', 'system_admin'), async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    // Get all logs
    const allLogs = await storage.getWhatsappWebhookLogs({ limit: 1000, offset: 0 });
    
    // Get all tokens
    const allTokens = await storage.getAllWhatsappTokens();
    
    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const logsToday = allLogs.logs.filter(log => new Date(log.createdAt) >= today);
    const successLogs = logsToday.filter(log => log.status === 'processed');
    const logsWithQuality = successLogs.filter(log => log.qualityScore !== null && log.qualityScore !== undefined);
    
    const totalToday = logsToday.length;
    const successRate = totalToday > 0 ? (successLogs.length / totalToday) * 100 : 0;
    const averageQualityScore = logsWithQuality.length > 0
      ? logsWithQuality.reduce((sum, log) => sum + (log.qualityScore || 0), 0) / logsWithQuality.length
      : 0;
    const activeTokens = allTokens.filter(t => t.isActive).length;
    
    return res.json({
      totalToday,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      averageQualityScore: Math.round(averageQualityScore * 10) / 10,
      activeTokens,
    });
  } catch (error) {
    console.error('[WhatsApp Stats] Error:', error);
    return res.status(500).json({ message: 'فشل في تحميل الإحصائيات' });
  }
});

// ============================================
// WEBHOOK HANDLER
// ============================================

router.post("/webhook", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let webhookLog: any = null;
  
  try {
    console.log("[WhatsApp Agent] ============ WEBHOOK START ============");
    
    // 🔐 SECURITY: Validate Twilio Signature
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    
    if (!twilioSignature) {
      console.error("[WhatsApp Agent] ❌ Missing Twilio signature header");
      
      // Log failed attempt
      await storage.createWhatsappWebhookLog({
        from: req.body.From || 'unknown',
        message: req.body.Body || '',
        status: 'rejected',
        reason: 'Missing Twilio signature - possible spoofing attempt',
        processingTimeMs: Date.now() - startTime,
      });
      
      // IMPORTANT: Return 200 to Twilio (prevents retry loop)
      // But reject the request internally
      return res.status(200).json({ 
        success: false, 
        error: 'Invalid request' 
      });
    }
    
    // Validate signature
    const url = `https://${req.headers.host}${req.originalUrl}`;
    const isValid = validateTwilioSignature(twilioSignature, url, req.body);
    
    if (!isValid) {
      console.error("[WhatsApp Agent] ❌ Invalid Twilio signature");
      
      await storage.createWhatsappWebhookLog({
        from: req.body.From || 'unknown',
        message: req.body.Body || '',
        status: 'rejected',
        reason: 'Invalid Twilio signature - authentication failed',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(200).json({ 
        success: false, 
        error: 'Invalid request' 
      });
    }
    
    console.log("[WhatsApp Agent] ✅ Twilio signature validated successfully");
    
    console.log("[WhatsApp Agent] Received webhook from Twilio");
    console.log("[WhatsApp Agent] Raw req.body keys:", Object.keys(req.body));
    
    const from = req.body.From || "";
    const to = req.body.To || "";
    const body = req.body.Body || "";
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    
    console.log("[WhatsApp Agent] Extracted values:");
    console.log("[WhatsApp Agent] - From:", from);
    console.log("[WhatsApp Agent] - To:", to);
    console.log("[WhatsApp Agent] - Body:", body);
    console.log("[WhatsApp Agent] - NumMedia:", numMedia);

    const phoneNumber = from.replace('whatsapp:', '');
    
    webhookLog = await storage.createWhatsappWebhookLog({
      from: phoneNumber,
      message: body,
      status: "received",
    });

    console.log(`[WhatsApp Agent] Created webhook log: ${webhookLog.id}`);

    const token = extractTokenFromMessage(body);
    
    if (!token) {
      console.log("[WhatsApp Agent] No token found in message");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "no_token_found",
      });

      return res.status(200).send('OK');
    }

    console.log(`[WhatsApp Agent] Token extracted: ${token}`);

    const whatsappToken = await storage.getWhatsappTokenByToken(token);
    
    if (!whatsappToken) {
      console.log("[WhatsApp Agent] Token not found in database");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "invalid_token",
        token: token,
      });

      return res.status(200).send('OK');
    }

    if (!whatsappToken.isActive) {
      console.log("[WhatsApp Agent] Token is inactive");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "token_inactive",
        userId: whatsappToken.userId,
        token: token,
      });

      return res.status(200).send('OK');
    }

    if (whatsappToken.expiresAt && new Date(whatsappToken.expiresAt) < new Date()) {
      console.log("[WhatsApp Agent] Token expired");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "token_expired",
        userId: whatsappToken.userId,
        token: token,
      });

      return res.status(200).send('OK');
    }

    if (whatsappToken.phoneNumber) {
      const normalizePhone = (phone: string) => phone.replace(/[\s\-\+\(\)]/g, '');
      const tokenPhone = normalizePhone(whatsappToken.phoneNumber);
      const incomingPhone = normalizePhone(phoneNumber);
      
      if (tokenPhone !== incomingPhone) {
        console.log("[WhatsApp Agent] Phone number mismatch");
        console.log(`[WhatsApp Agent] Expected: ${whatsappToken.phoneNumber} (${tokenPhone}), Got: ${phoneNumber} (${incomingPhone})`);
        
        await storage.createWhatsappWebhookLog({
          from: phoneNumber,
          message: body,
          status: "rejected",
          reason: "phone_number_mismatch",
          userId: whatsappToken.userId,
          token: token,
        });

        return res.status(200).send('OK');
      }
    }

    console.log("[WhatsApp Agent] ✅ Token validated successfully");

    const uploadedMediaUrls: string[] = [];
    const mediaMetadata: Array<{ filename: string; contentType: string; size: number; url: string }> = [];

    if (numMedia > 0) {
      console.log(`[WhatsApp Agent] 📎 Processing ${numMedia} media attachments`);
      
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaContentType = req.body[`MediaContentType${i}`];
        
        if (!mediaUrl) continue;

        try {
          console.log(`[WhatsApp Agent] 📎 Downloading media ${i + 1}/${numMedia}: ${mediaUrl}`);
          
          const { buffer, contentType, filename } = await downloadWhatsAppMedia(mediaUrl);
          
          const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(contentType);
          
          const gcsPath = await uploadToCloudStorage(
            buffer,
            filename,
            contentType,
            isImage
          );
          
          if (isImage) {
            uploadedMediaUrls.push(gcsPath);
          }
          
          mediaMetadata.push({
            filename,
            contentType,
            size: buffer.length,
            url: gcsPath,
          });
          
          console.log(`[WhatsApp Agent] ✅ Media ${i + 1} uploaded: ${gcsPath}`);
        } catch (error) {
          console.error(`[WhatsApp Agent] ❌ Failed to process media ${i + 1}:`, error);
        }
      }
      
      console.log(`[WhatsApp Agent] 📎 Uploaded ${uploadedMediaUrls.length} images, ${mediaMetadata.length} total media files`);
    }

    const cleanText = removeTokenFromMessage(body);
    console.log(`[WhatsApp Agent] Cleaned text: "${cleanText}"`);

    if (!cleanText || cleanText.trim().length < 10) {
      console.log("[WhatsApp Agent] Text too short after cleaning");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "text_too_short",
        userId: whatsappToken.userId,
        token: token,
        mediaUrls: mediaMetadata.map(m => m.url),
      });

      return res.status(200).send('OK');
    }

    const detectedLang = await detectLanguage(cleanText);
    console.log(`[WhatsApp Agent] Detected language: ${detectedLang}`);

    const categories = await storage.getAllCategories();
    const aiResult = await analyzeAndEditWithSabqStyle(cleanText, detectedLang, categories);

    console.log(`[WhatsApp Agent] AI analysis complete. Quality score: ${aiResult.qualityScore}`);

    if (aiResult.qualityScore < 10 || !aiResult.hasNewsValue) {
      console.log("[WhatsApp Agent] Quality too low or no news value");
      
      await storage.createWhatsappWebhookLog({
        from: phoneNumber,
        message: body,
        status: "rejected",
        reason: "low_quality",
        userId: whatsappToken.userId,
        token: token,
        qualityScore: aiResult.qualityScore,
        aiAnalysis: {
          detectedLanguage: aiResult.language,
          detectedCategory: aiResult.detectedCategory,
          hasNewsValue: aiResult.hasNewsValue,
          issues: aiResult.issues,
        },
        mediaUrls: mediaMetadata.map(m => m.url),
      });

      return res.status(200).send('OK');
    }

    const category = categories.find(
      c => c.nameAr === aiResult.detectedCategory || c.nameEn === aiResult.detectedCategory
    );

    const slug = generateSlug(aiResult.optimized.title);
    const articleStatus = whatsappToken.autoPublish ? 'published' : 'draft';

    const article = await storage.createArticle({
      title: aiResult.optimized.title,
      slug,
      content: aiResult.optimized.content,
      excerpt: aiResult.optimized.lead,
      imageUrl: uploadedMediaUrls[0] || null,
      categoryId: category?.id || null,
      authorId: whatsappToken.userId,
      status: articleStatus,
      publishedAt: articleStatus === 'published' ? new Date() : null,
      source: 'whatsapp',
      sourceMetadata: {
        type: 'whatsapp',
        from: phoneNumber,
        token,
        originalMessage: body,
        webhookLogId: webhookLog.id,
        mediaUrls: uploadedMediaUrls,
      },
      seoKeywords: aiResult.optimized.seoKeywords,
    });

    console.log(`[WhatsApp Agent] ✅ Article created: ${article.id}, status: ${articleStatus}`);

    await storage.updateWhatsappTokenUsage(whatsappToken.id);

    await storage.createWhatsappWebhookLog({
      from: phoneNumber,
      message: body,
      status: "processed",
      userId: whatsappToken.userId,
      token: token,
      articleId: article.id,
      qualityScore: aiResult.qualityScore,
      aiAnalysis: {
        detectedLanguage: aiResult.language,
        detectedCategory: aiResult.detectedCategory,
        hasNewsValue: aiResult.hasNewsValue,
        issues: aiResult.issues || [],
      },
      mediaUrls: uploadedMediaUrls,
    });

    const replyMessage = articleStatus === 'published'
      ? `✅ تم نشر الخبر\nhttps://sabq.life/article/${slug}`
      : `✅ تم حفظ الخبر كمسودة\nللمراجعة قبل النشر`;

    try {
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: replyMessage,
      });
      console.log(`[WhatsApp Agent] ✅ Sent reply to ${phoneNumber}`);
    } catch (error) {
      console.error(`[WhatsApp Agent] ⚠️ Failed to send reply:`, error);
    }

    console.log("[WhatsApp Agent] ============ WEBHOOK END (SUCCESS) ============");
    return res.status(200).send('OK');

  } catch (error) {
    console.error("[WhatsApp Agent] ============ WEBHOOK ERROR ============");
    console.error("[WhatsApp Agent] Error:", error);
    
    if (webhookLog) {
      try {
        await storage.createWhatsappWebhookLog({
          from: webhookLog.from || "",
          message: webhookLog.message || "",
          status: "error",
          reason: error instanceof Error ? error.message : "unknown_error",
        });
      } catch (logError) {
        console.error("[WhatsApp Agent] Failed to log error:", logError);
      }
    }

    return res.status(200).send('OK');
  }
});

// ============================================
// TOKEN MANAGEMENT ENDPOINTS
// ============================================

router.get("/tokens", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const tokens = await storage.getAllWhatsappTokens();
    return res.json(tokens);
  } catch (error) {
    console.error("[WhatsApp Agent] Error fetching tokens:", error);
    return res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

router.post("/tokens", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    const validatedData = insertWhatsappTokenSchema.parse({
      ...req.body,
      userId,
    });
    
    const token = `SABQ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    const newToken = await storage.createWhatsappToken({
      ...validatedData,
      token,
    });
    
    return res.status(201).json(newToken);
  } catch (error) {
    console.error("[WhatsApp Agent] Error creating token:", error);
    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({ error: "Validation error", details: error });
    }
    return res.status(500).json({ error: "Failed to create token" });
  }
});

router.patch("/tokens/:id", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.token;
    delete updates.usageCount;
    delete updates.lastUsedAt;
    delete updates.createdAt;
    
    const updated = await storage.updateWhatsappToken(id, updates);
    
    if (!updated) {
      return res.status(404).json({ error: "Token not found" });
    }
    
    return res.json(updated);
  } catch (error) {
    console.error("[WhatsApp Agent] Error updating token:", error);
    return res.status(500).json({ error: "Failed to update token" });
  }
});

router.delete("/tokens/:id", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await storage.deleteWhatsappToken(id);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Agent] Error deleting token:", error);
    return res.status(500).json({ error: "Failed to delete token" });
  }
});

// ============================================
// WEBHOOK LOGS ENDPOINTS
// ============================================

router.get("/logs", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    
    const result = await storage.getWhatsappWebhookLogs({ limit, offset, status });
    
    return res.json(result);
  } catch (error) {
    console.error("[WhatsApp Agent] Error fetching logs:", error);
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

router.delete("/logs/:id", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await storage.deleteWhatsappWebhookLog(id);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Agent] Error deleting log:", error);
    return res.status(500).json({ error: "Failed to delete log" });
  }
});

export default router;
