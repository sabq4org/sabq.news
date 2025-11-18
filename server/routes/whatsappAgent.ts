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

// ============================================
// MESSAGE SEGMENTATION HANDLING
// ============================================

// Track pending message timeouts
const pendingMessages = new Map<string, NodeJS.Timeout>();

// Segment collection timeout (30 seconds)
const SEGMENT_TIMEOUT_MS = 30000;

async function processCompleteMessage(messageSid: string): Promise<void> {
  try {
    console.log(`[WhatsApp Segmentation] Processing complete message: ${messageSid}`);
    
    // Get all segments for this message
    const segments = await storage.getMessageSegments(messageSid);
    
    if (segments.length === 0) {
      console.log(`[WhatsApp Segmentation] No segments found for ${messageSid}`);
      return;
    }
    
    // Sort by segment index and combine content
    const sortedSegments = segments.sort((a, b) => a.segmentIndex - b.segmentIndex);
    const fullBody = sortedSegments.map(s => s.content).join('');
    const from = segments[0].from;
    const mediaUrls = segments[0].mediaUrls || [];
    const metadata = segments[0].metadata || {};
    
    console.log(`[WhatsApp Segmentation] Assembled ${segments.length} segments into message of ${fullBody.length} characters`);
    
    // Create a synthetic webhook payload
    const syntheticPayload: Record<string, any> = {
      From: `whatsapp:${from}`,
      To: process.env.TWILIO_PHONE_NUMBER || '',
      Body: fullBody,
      NumMedia: mediaUrls.length.toString(),
      MessageSid: messageSid,
      ...(metadata.twilioData ?? {}),
    };
    
    // Add media URLs to payload
    mediaUrls.forEach((url, index) => {
      syntheticPayload[`MediaUrl${index}`] = url;
      if (metadata.mediaContentTypes && metadata.mediaContentTypes[index]) {
        syntheticPayload[`MediaContentType${index}`] = metadata.mediaContentTypes[index];
      }
    });
    
    // Process the assembled message through the normal webhook handler
    // We'll call a separate processing function to avoid duplication
    await processWhatsAppMessage(syntheticPayload, true);
    
    // Clean up segments after successful processing
    await storage.deleteMessageSegments(messageSid);
    console.log(`[WhatsApp Segmentation] Cleaned up segments for ${messageSid}`);
    
  } catch (error) {
    console.error(`[WhatsApp Segmentation] Error processing message ${messageSid}:`, error);
  } finally {
    // Remove the timeout from tracking
    pendingMessages.delete(messageSid);
  }
}

function scheduleMessageProcessing(messageSid: string): void {
  // Clear existing timeout if any
  const existingTimeout = pendingMessages.get(messageSid);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  // Schedule new timeout
  const timeout = setTimeout(() => {
    processCompleteMessage(messageSid);
  }, SEGMENT_TIMEOUT_MS);
  
  pendingMessages.set(messageSid, timeout);
  
  console.log(`[WhatsApp Segmentation] Scheduled processing for ${messageSid} in ${SEGMENT_TIMEOUT_MS}ms`);
}

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
// BADGE STATISTICS ENDPOINT
// ============================================

// GET /api/whatsapp/badge-stats - Get badge notification statistics
router.get("/badge-stats", requireAuth, requireRole('admin', 'manager', 'system_admin'), async (req: Request, res: Response) => {
  try {
    // Get all logs
    const allLogs = await storage.getWhatsappWebhookLogs({ limit: 1000, offset: 0 });
    
    // Calculate today's date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Filter logs for today
    const logsToday = allLogs.logs.filter(log => new Date(log.createdAt) >= today);
    
    // Calculate badge stats
    const newMessages = logsToday.filter(log => log.status === 'received').length;
    const publishedToday = logsToday.filter(log => 
      log.status === 'processed' && log.publishStatus === 'published'
    ).length;
    const rejectedToday = logsToday.filter(log => log.status === 'rejected').length;
    
    return res.json({
      newMessages,
      publishedToday,
      rejectedToday,
    });
  } catch (error) {
    console.error('[WhatsApp Badge Stats] Error:', error);
    return res.status(500).json({ message: 'فشل في تحميل إحصائيات البادج' });
  }
});

// ============================================
// WEBHOOK HANDLER
// ============================================

// Main message processing function (extracted for reuse)
async function processWhatsAppMessage(reqBody: any, isSegmented: boolean = false): Promise<void> {
  const startTime = Date.now();
  let webhookLog: any = null;
  
  try {
    
    console.log("[WhatsApp Agent] Received webhook from Twilio");
    console.log("[WhatsApp Agent] Raw reqBody keys:", Object.keys(reqBody));
    
    const from = reqBody.From || "";
    const to = reqBody.To || "";
    const body = reqBody.Body || "";
    const numMedia = parseInt(reqBody.NumMedia || "0", 10);
    
    console.log("[WhatsApp Agent] Extracted values:");
    console.log("[WhatsApp Agent] - From:", from);
    console.log("[WhatsApp Agent] - To:", to);
    console.log("[WhatsApp Agent] - Body:", body);
    console.log("[WhatsApp Agent] - NumMedia:", numMedia);

    // ============================================
    // LONG MESSAGE SEGMENTATION PRE-PROCESSING
    // ============================================

    // Extract or generate messageSid
    const messageSid = reqBody.MessageSid || nanoid();

    // Check if this is a reassembled segmented message
    if (isSegmented) {
      console.log("[WhatsApp Agent] Processing reassembled segmented message");
    }

    // Check for long messages or existing segments
    const existingSegments = await storage.getMessageSegments(messageSid);
    const isLongMessage = body.length > 1500;
    const hasExistingSegments = existingSegments.length > 0;

    if (!isSegmented && (isLongMessage || hasExistingSegments)) {
      console.log(`[WhatsApp Agent] Detected segmentable message: length=${body.length}, existingSegments=${existingSegments.length}`);
      
      // Extract media URLs from reqBody
      const mediaUrls: string[] = [];
      const mediaContentTypes: string[] = [];
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = reqBody[`MediaUrl${i}`];
        const contentType = reqBody[`MediaContentType${i}`];
        if (mediaUrl) {
          mediaUrls.push(mediaUrl);
          mediaContentTypes.push(contentType || 'application/octet-stream');
        }
      }
      
      // Store this message as a segment
      const phoneNumber = from.replace('whatsapp:', '');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await storage.storeMessageSegment({
        messageSid,
        from: phoneNumber,
        segmentIndex: existingSegments.length,
        totalSegments: -1,
        content: body,
        mediaUrls,
        metadata: {
          numMedia,
          mediaContentTypes,
          twilioData: reqBody,
        },
        expiresAt,
      });
      
      console.log(`[WhatsApp Agent] Stored segment ${existingSegments.length} for message ${messageSid}`);
      
      // Schedule message processing
      scheduleMessageProcessing(messageSid);
      
      // Return early - don't process immediately
      console.log(`[WhatsApp Agent] Scheduled processing for ${messageSid}, returning early`);
      return;
    }

    const phoneNumber = from.replace('whatsapp:', '');
    
    // ✅ CREATE ONE LOG AT THE BEGINNING
    webhookLog = await storage.createWhatsappWebhookLog({
      from: phoneNumber,
      message: body,
      status: "received",
    });

    console.log(`[WhatsApp Agent] Created webhook log: ${webhookLog.id}`);

    const token = extractTokenFromMessage(body);
    
    if (!token) {
      console.log("[WhatsApp Agent] No token found in message");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "no_token_found",
        processingTimeMs: Date.now() - startTime,
      });

      return;
    }

    console.log(`[WhatsApp Agent] Token extracted: ${token}`);

    const whatsappToken = await storage.getWhatsappTokenByToken(token);
    
    if (!whatsappToken) {
      console.log("[WhatsApp Agent] Token not found in database");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "invalid_token",
        token: token,
        processingTimeMs: Date.now() - startTime,
      });

      return;
    }

    if (!whatsappToken.isActive) {
      console.log("[WhatsApp Agent] Token is inactive");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "token_inactive",
        userId: whatsappToken.userId,
        token: token,
        processingTimeMs: Date.now() - startTime,
      });

      return;
    }

    if (whatsappToken.expiresAt && new Date(whatsappToken.expiresAt) < new Date()) {
      console.log("[WhatsApp Agent] Token expired");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "token_expired",
        userId: whatsappToken.userId,
        token: token,
        processingTimeMs: Date.now() - startTime,
      });

      return;
    }

    if (whatsappToken.phoneNumber) {
      const normalizePhone = (phone: string) => phone.replace(/[\s\-\+\(\)]/g, '');
      const tokenPhone = normalizePhone(whatsappToken.phoneNumber);
      const incomingPhone = normalizePhone(phoneNumber);
      
      if (tokenPhone !== incomingPhone) {
        console.log("[WhatsApp Agent] Phone number mismatch");
        console.log(`[WhatsApp Agent] Expected: ${whatsappToken.phoneNumber} (${tokenPhone}), Got: ${phoneNumber} (${incomingPhone})`);
        
        // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "phone_number_mismatch",
          userId: whatsappToken.userId,
          token: token,
          processingTimeMs: Date.now() - startTime,
        });

        return;
      }
    }

    console.log("[WhatsApp Agent] ✅ Token validated successfully");

    const uploadedMediaUrls: string[] = [];
    const mediaMetadata: Array<{ filename: string; contentType: string; size: number; url: string }> = [];

    if (numMedia > 0) {
      console.log(`[WhatsApp Agent] 📎 Processing ${numMedia} media attachments`);
      
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = reqBody[`MediaUrl${i}`];
        const mediaContentType = reqBody[`MediaContentType${i}`];
        
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

    // ✅ IMPROVED IMAGE HANDLING: Allow short text if there are images
    const hasImages = uploadedMediaUrls.length > 0;
    const textLength = cleanText?.trim().length || 0;
    
    if (!hasImages && textLength < 10) {
      console.log("[WhatsApp Agent] Text too short (no images attached)");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "text_too_short",
        userId: whatsappToken.userId,
        token: token,
        mediaUrls: mediaMetadata.map(m => m.url),
        processingTimeMs: Date.now() - startTime,
      });

      return;
    }
    
    console.log(`[WhatsApp Agent] Text validation passed (hasImages: ${hasImages}, textLength: ${textLength})`);
  

    const detectedLang = await detectLanguage(cleanText);
    console.log(`[WhatsApp Agent] Detected language: ${detectedLang}`);

    const categories = await storage.getAllCategories();
    const aiResult = await analyzeAndEditWithSabqStyle(cleanText, detectedLang, categories);

    console.log(`[WhatsApp Agent] AI analysis complete. Quality score: ${aiResult.qualityScore}`);

    if (aiResult.qualityScore < 10 || !aiResult.hasNewsValue) {
      console.log("[WhatsApp Agent] Quality too low or no news value");
      
      // ✅ UPDATE THE LOG INSTEAD OF CREATING NEW ONE
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
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
        processingTimeMs: Date.now() - startTime,
      });

      return;
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
      },
      seoKeywords: aiResult.optimized.seoKeywords,
    } as any);

    console.log(`[WhatsApp Agent] ✅ Article created: ${article.id}, status: ${articleStatus}`);

    await storage.updateWhatsappTokenUsage(whatsappToken.id);

    // ✅ UPDATE THE LOG WITH SUCCESS STATUS, ARTICLE LINK, AND PUBLISH STATUS
    await storage.updateWhatsappWebhookLog(webhookLog.id, {
      status: "processed",
      userId: whatsappToken.userId,
      tokenId: whatsappToken.id,
      token: token,
      articleId: article.id,
      articleLink: `https://sabq.life/article/${slug}`,
      publishStatus: articleStatus,
      qualityScore: aiResult.qualityScore,
      aiAnalysis: {
        detectedLanguage: aiResult.language,
        detectedCategory: aiResult.detectedCategory,
        hasNewsValue: aiResult.hasNewsValue,
        issues: aiResult.issues || [],
      },
      mediaUrls: uploadedMediaUrls,
      processingTimeMs: Date.now() - startTime,
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

  } catch (error) {
    console.error("[WhatsApp Agent] ============ WEBHOOK ERROR ============");
    console.error("[WhatsApp Agent] Error:", error);
    
    // ✅ UPDATE THE LOG WITH ERROR STATUS INSTEAD OF CREATING NEW ONE
    if (webhookLog && webhookLog.id) {
      try {
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "error",
          reason: error instanceof Error ? error.message : "unknown_error",
          processingTimeMs: Date.now() - startTime,
        });
      } catch (logError) {
        console.error("[WhatsApp Agent] Failed to update error log:", logError);
      }
    }
  }
}

// POST /api/whatsapp/webhook - Twilio webhook endpoint
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Validate Twilio signature for security
    const signature = req.headers['x-twilio-signature'] as string;
    if (signature && !validateTwilioSignature(signature, req.body, req.protocol + '://' + req.get('host') + req.originalUrl)) {
      console.log("[WhatsApp Agent] Invalid Twilio signature");
      return res.status(403).send('Forbidden');
    }

    // Process the message asynchronously
    processWhatsAppMessage(req.body, false).catch(error => {
      console.error("[WhatsApp Agent] Async processing error:", error);
    });

    // Return 200 immediately to Twilio
    return res.status(200).send('OK');
  } catch (error) {
    console.error("[WhatsApp Agent] Webhook endpoint error:", error);
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

router.post("/logs/bulk-delete", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid ids array" });
    }
    
    await storage.deleteWhatsappWebhookLogs(ids);
    
    return res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("[WhatsApp Agent] Error bulk deleting logs:", error);
    return res.status(500).json({ error: "Failed to delete logs" });
  }
});

export default router;
