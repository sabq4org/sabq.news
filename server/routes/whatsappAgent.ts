import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { analyzeAndEditWithSabqStyle, detectLanguage, normalizeLanguageCode, generateImageAltText } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";
import { twilioClient, sendWhatsAppMessage, sendWhatsAppMessageWithDetails, extractTokenFromMessage, removeTokenFromMessage, validateTwilioSignature, updateLastInboundTime, isWithin24HourWindow } from "../services/whatsapp";
import { isKapsoConfigured, sendKapsoWhatsAppMessage, updateKapsoLastInboundTime, getKapsoStatus } from "../services/kapsoWhatsapp";
import { requireAuth, requireRole } from "../rbac";
import { insertWhatsappTokenSchema, mediaFiles, articleMediaAssets } from "@shared/schema";
import crypto from "crypto";
import { db } from "../db";
import { addMessagePart, shouldForceProcess, AGGREGATION_WINDOW_SECONDS } from "../services/whatsappMessageAggregator";
import { memoryCache } from "../memoryCache";

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

    console.log(`[WhatsApp Agent] ✅ Uploaded ${isPublic ? 'PUBLIC' : 'PRIVATE'} media: ${fullPath}`);
    
    // 🎯 Return Backend Proxy URL (Replit Object Storage doesn't allow makePublic or signed URLs)
    // The backend will stream the file from Object Storage
    if (isPublic) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://sabq.news';
      const proxyUrl = `${frontendUrl}/api/public-media/${fullPath}`;
      console.log(`[WhatsApp Agent] 🌐 Generated proxy URL: ${proxyUrl}`);
      return proxyUrl;
    }
    
    return `${objectDir}/${storedFilename}`;
  } catch (error) {
    console.error("[WhatsApp Agent] Error uploading media:", error);
    throw error;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectPath: string } {
  // Use the actual Replit bucket ID
  const bucketName = process.env.REPLIT_OBJECT_BUCKET || 'replit-objstore-3dc2325c-bbbe-4e54-9a00-e6f10b243138';
  
  // Treat the entire path (e.g., "sabq-production-bucket/public") as the object path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const objectPath = cleanPath;
  
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

// ============================================
// COMMAND TYPES FOR WHATSAPP OPERATIONS
// ============================================
type WhatsAppCommand = 
  | { type: 'create'; content: string }
  | { type: 'edit'; articleId: string; content: string }
  | { type: 'delete'; articleId: string }
  | { type: 'archive'; articleId: string }
  | { type: 'breaking'; articleId: string }
  | { type: 'help' };

// Parse command from WhatsApp message
function parseWhatsAppCommand(message: string): WhatsAppCommand {
  const trimmedMessage = message.trim();
  
  // Help command
  if (trimmedMessage === 'مساعدة' || trimmedMessage === 'help' || trimmedMessage === '?') {
    return { type: 'help' };
  }
  
  // Edit command: تعديل: [رابط أو معرف]
  // Format: تعديل: https://sabq.news/article/slug-here
  // Or: تعديل: article-id-here
  // Followed by new content
  const normalizedForEdit = trimmedMessage.replace(/\n/g, ' ');
  const editMatch = normalizedForEdit.match(/^(?:تعديل|تحديث|edit|update)[\s:]+(.+)/i);
  if (editMatch) {
    const restOfMessage = editMatch[1].trim();
    const articleId = extractArticleIdentifier(restOfMessage);
    if (articleId) {
      // Get content after the article identifier (use original message with newlines)
      const contentStartIndex = trimmedMessage.toLowerCase().indexOf(articleId.toLowerCase());
      const content = contentStartIndex >= 0 
        ? trimmedMessage.substring(contentStartIndex + articleId.length).trim()
        : restOfMessage.replace(/^(https?:\/\/[^\s]+|[a-zA-Z0-9_-]+)\s*/i, '').trim();
      return { type: 'edit', articleId, content };
    }
  }
  
  // Delete command: حذف: [رابط أو معرف]
  const normalizedForDelete = trimmedMessage.replace(/\n/g, ' ');
  const deleteMatch = normalizedForDelete.match(/^(?:حذف|delete|remove)[\s:]+(.+)/i);
  if (deleteMatch) {
    const articleId = extractArticleIdentifier(deleteMatch[1].trim());
    if (articleId) {
      return { type: 'delete', articleId };
    }
  }
  
  // Archive command: أرشفة: [رابط أو معرف]
  const normalizedForArchive = trimmedMessage.replace(/\n/g, ' ');
  const archiveMatch = normalizedForArchive.match(/^(?:أرشفة|أرشيف|archive)[\s:]+(.+)/i);
  if (archiveMatch) {
    const articleId = extractArticleIdentifier(archiveMatch[1].trim());
    if (articleId) {
      return { type: 'archive', articleId };
    }
  }
  
  // Breaking news command: عاجل: [رابط أو معرف]
  const normalizedForBreaking = trimmedMessage.replace(/\n/g, ' ');
  const breakingMatch = normalizedForBreaking.match(/^(?:عاجل|breaking|urgent)[\s:]+(.+)/i);
  if (breakingMatch) {
    const articleId = extractArticleIdentifier(breakingMatch[1].trim());
    if (articleId) {
      return { type: 'breaking', articleId };
    }
  }
  
  // Default: create new article
  return { type: 'create', content: trimmedMessage };
}

// Extract article ID from URL or direct ID
function extractArticleIdentifier(text: string): string | null {
  // Extract from URL: https://sabq.news/article/slug-here or /article/slug-here
  // Support Arabic characters in slugs: \u0600-\u06FF covers Arabic Unicode range
  const urlMatch = text.match(/(?:https?:\/\/)?(?:sabq\.news|sabq\.life)?\/article\/([a-zA-Z0-9_\u0600-\u06FF-]+)/i);
  if (urlMatch) {
    return decodeURIComponent(urlMatch[1]);
  }
  
  // Try URL-encoded format (common in copy-paste)
  const encodedMatch = text.match(/(?:https?:\/\/)?(?:sabq\.news|sabq\.life)?\/article\/([^\s]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }
  
  // Extract first word/identifier (could be slug or ID)
  const firstWord = text.split(/[\s\n]/)[0].trim();
  if (firstWord && firstWord.length > 3) {
    try {
      return decodeURIComponent(firstWord);
    } catch {
      return firstWord;
    }
  }
  
  return null;
}

// Find article by slug or ID
async function findArticleByIdentifier(identifier: string): Promise<any | null> {
  // Try to find by slug first
  let article = await storage.getArticleBySlug(identifier);
  if (article) return article;
  
  // Try to find by ID
  try {
    article = await storage.getArticleById(identifier);
    if (article) return article;
  } catch (e) {
    // ID might be invalid format, continue
  }
  
  return null;
}

// Generate help message
function getHelpMessage(): string {
  return `🤖 *أوامر واتساب سبق*

📰 *إنشاء خبر جديد:*
أرسل النص والصور مباشرة مع الرمز

✏️ *تعديل خبر:*
تعديل: [رابط الخبر]
[المحتوى الجديد]

🗑️ *حذف خبر:*
حذف: [رابط الخبر]

📁 *أرشفة خبر:*
أرشفة: [رابط الخبر]

🚨 *تحويل لخبر عاجل:*
عاجل: [رابط الخبر]

❓ *المساعدة:*
أرسل "مساعدة" أو "?"`;
}

async function downloadWhatsAppMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  try {
    console.log(`[WhatsApp Agent] 📥 Downloading media from: ${mediaUrl}`);
    
    // For Twilio-hosted media, use Basic Auth with fetch (more reliable than twilioClient.request)
    const isTwilioMedia = mediaUrl.includes('api.twilio.com') || mediaUrl.includes('media.twiliocdn.com');
    
    const headers: Record<string, string> = {
      'User-Agent': 'WhatsApp-Media-Downloader/1.0',
    };
    
    // Add Basic Auth for Twilio media
    if (isTwilioMedia) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        throw new Error("Twilio credentials not configured for media download");
      }
      
      const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
      console.log(`[WhatsApp Agent] 🔐 Using Twilio Basic Auth for media download`);
    }
    
    console.log(`[WhatsApp Agent] 🌐 Fetching media with headers...`);
    
    const response = await fetch(mediaUrl, {
      headers,
      signal: AbortSignal.timeout(60000), // 60 second timeout for large files
      redirect: 'follow', // Follow redirects
    });

    console.log(`[WhatsApp Agent] 📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`[WhatsApp Agent] 📊 Response headers: content-type=${response.headers.get('content-type')}, content-length=${response.headers.get('content-length')}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error body');
      console.error(`[WhatsApp Agent] ❌ HTTP Error: ${response.status} - ${errorText.substring(0, 200)}`);
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[WhatsApp Agent] 📦 Downloaded ${buffer.length} bytes`);
    
    // Get content type from header
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    // Clean content type (remove charset etc)
    contentType = contentType.split(';')[0].trim();
    
    // Generate filename based on content type
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'application/pdf': 'pdf',
    };
    
    const extension = extensionMap[contentType.toLowerCase()] || contentType.split('/')[1] || 'bin';
    const filename = `media-${nanoid()}.${extension}`;

    console.log(`[WhatsApp Agent] ✅ Downloaded media: ${filename}, size: ${buffer.length} bytes, type: ${contentType}`);
    
    return { buffer, contentType, filename };
  } catch (error) {
    console.error(`[WhatsApp Agent] ❌ Failed to download media from ${mediaUrl}:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(`[WhatsApp Agent] Stack:`, error.stack);
    }
    throw error;
  }
}

// ============================================
// CONFIGURATION ENDPOINT
// ============================================

// GET /api/whatsapp/config - Get WhatsApp configuration
router.get("/config", requireAuth, requireRole('admin', 'manager', 'system_admin'), async (req: Request, res: Response) => {
  try {
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '';
    const kapsoStatus = getKapsoStatus();
    
    return res.json({
      whatsappNumber: twilioNumber || null,
      configured: !!twilioNumber || kapsoStatus.configured,
      providers: {
        twilio: {
          configured: !!twilioNumber,
          phoneNumber: twilioNumber || null,
        },
        kapso: {
          configured: kapsoStatus.configured,
          phoneNumberId: kapsoStatus.phoneNumberId,
        }
      }
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

router.post("/webhook", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let webhookLog: any = null;
  
  try {
    console.log("[WhatsApp Agent] ============ WEBHOOK START ============");
    console.log(`[WhatsApp Agent] 📝 Request Body Keys: ${Object.keys(req.body).join(', ')}`);
    console.log(`[WhatsApp Agent] 📝 NumMedia in body: "${req.body.NumMedia}"`);
    
    // 🔐 SECURITY: Validate Twilio Signature
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipValidation = isDevelopment && process.env.SKIP_TWILIO_VALIDATION === 'true';
    
    if (!twilioSignature && !skipValidation) {
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
    
    // Validate signature (if not skipped in development)
    let isValid = skipValidation;
    if (!skipValidation) {
      // Use FRONTEND_URL for Replit environment (Twilio uses the public URL)
      const frontendUrl = process.env.FRONTEND_URL || 'https://sabq.life';
      const url = `${frontendUrl}/api/whatsapp/webhook`;
      
      console.log(`[WhatsApp Agent] 🔐 Validating signature for URL: ${url}`);
      isValid = validateTwilioSignature(twilioSignature, url, req.body);
      
      // If it fails with frontend URL, try with the request host as fallback
      if (!isValid) {
        const fallbackUrl = `https://${req.headers.host}${req.originalUrl}`;
        console.log(`[WhatsApp Agent] 🔄 Retrying with fallback URL: ${fallbackUrl}`);
        isValid = validateTwilioSignature(twilioSignature, fallbackUrl, req.body);
      }
    }
    
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
    
    // 🔍 COMPLETE BODY DUMP FOR DEBUGGING
    console.log("[WhatsApp Agent] 🔍 COMPLETE req.body:", JSON.stringify(req.body, null, 2));
    
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
    
    // 📥 Track inbound message time for 24-hour window enforcement
    updateLastInboundTime(phoneNumber);
    console.log(`[WhatsApp Agent] ✅ Updated 24h window tracker for ${phoneNumber.substring(0, 8)}...`);
    
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

      return res.status(200).send('OK');
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

      return res.status(200).send('OK');
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

      return res.status(200).send('OK');
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

      return res.status(200).send('OK');
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

        return res.status(200).send('OK');
      }
    }

    console.log("[WhatsApp Agent] ✅ Token validated successfully");

    const uploadedMediaUrls: string[] = [];
    const mediaMetadata: Array<{ 
      filename: string; 
      contentType: string; 
      size: number; 
      url: string;
    }> = [];

    // 🔍 DETAILED LOGGING FOR MEDIA DEBUGGING
    console.log(`[WhatsApp Agent] 📎 Media debugging info:`);
    console.log(`[WhatsApp Agent] - NumMedia from body: "${req.body.NumMedia}" (parsed: ${numMedia})`);
    console.log(`[WhatsApp Agent] - MediaUrl0: ${req.body.MediaUrl0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`[WhatsApp Agent] - MediaContentType0: ${req.body.MediaContentType0 || 'MISSING'}`);
    
    if (numMedia > 0) {
      console.log(`[WhatsApp Agent] 📎 Processing ${numMedia} media attachments`);
      
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaContentType = req.body[`MediaContentType${i}`];
        
        console.log(`[WhatsApp Agent] 📎 Media ${i}: URL=${mediaUrl ? 'EXISTS' : 'MISSING'}, Type=${mediaContentType || 'MISSING'}`);
        
        if (!mediaUrl) {
          console.warn(`[WhatsApp Agent] ⚠️ Skipping media ${i} - no URL found`);
          continue;
        }

        try {
          console.log(`[WhatsApp Agent] 📎 Downloading media ${i + 1}/${numMedia}: ${mediaUrl}`);
          console.log(`[WhatsApp Agent] 📎 Twilio MediaContentType${i}: ${mediaContentType || 'MISSING'}`);
          
          const { buffer, contentType, filename } = await downloadWhatsAppMedia(mediaUrl);
          
          console.log(`[WhatsApp Agent] 🔍 Downloaded: contentType="${contentType}", filename="${filename}", size=${buffer.length}`);
          
          // 🔧 CRITICAL FIX: Always check magic bytes first, regardless of content-type
          let actualContentType = contentType;
          let actualFilename = filename;
          let detectedType = null;
          
          // Always check magic bytes for accurate type detection
          if (buffer.length > 4) {
            const magic = buffer.slice(0, 4).toString('hex');
            console.log(`[WhatsApp Agent] 🔍 Magic bytes: ${magic.toUpperCase()}`);
            
            // JPEG: FF D8 FF
            if (magic.startsWith('ffd8ff')) {
              detectedType = 'image/jpeg';
              actualContentType = 'image/jpeg';
              actualFilename = filename.replace(/\.[^.]+$/, '.jpg');
              console.log(`[WhatsApp Agent] ✅ DETECTED: JPEG from magic bytes`);
            }
            // PNG: 89 50 4E 47
            else if (magic.startsWith('89504e47')) {
              detectedType = 'image/png';
              actualContentType = 'image/png';
              actualFilename = filename.replace(/\.[^.]+$/, '.png');
              console.log(`[WhatsApp Agent] ✅ DETECTED: PNG from magic bytes`);
            }
            // GIF: 47 49 46 38
            else if (magic.startsWith('47494638')) {
              detectedType = 'image/gif';
              actualContentType = 'image/gif';
              actualFilename = filename.replace(/\.[^.]+$/, '.gif');
              console.log(`[WhatsApp Agent] ✅ DETECTED: GIF from magic bytes`);
            }
            // WebP: 52 49 46 46 (RIFF) + WebP marker at offset 8
            else if (magic.startsWith('52494646') && buffer.length > 12) {
              const webpMarker = buffer.slice(8, 12).toString();
              if (webpMarker === 'WEBP') {
                detectedType = 'image/webp';
                actualContentType = 'image/webp';
                actualFilename = filename.replace(/\.[^.]+$/, '.webp');
                console.log(`[WhatsApp Agent] ✅ DETECTED: WebP from magic bytes`);
              }
            }
          }
          
          // Decision: Use detected type if available, otherwise trust content-type
          const finalContentType = detectedType || actualContentType;
          const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(finalContentType);
          
          // Detailed logging for debugging
          console.log(`[WhatsApp Agent] 📊 Type Analysis:`);
          console.log(`  - Twilio header: ${mediaContentType || 'none'}`);
          console.log(`  - Download header: ${contentType}`);
          console.log(`  - Magic bytes detected: ${detectedType || 'none'}`);
          console.log(`  - Final content-type: ${finalContentType}`);
          console.log(`  - Is image: ${isImage}`);
          console.log(`  - Filename: ${filename} → ${actualFilename}`);
          
          if (!isImage && detectedType) {
            console.warn(`[WhatsApp Agent] ⚠️ WARNING: Magic bytes detected ${detectedType} but not classified as image!`);
          }
          
          const gcsPath = await uploadToCloudStorage(
            buffer,
            actualFilename,
            actualContentType,
            isImage
          );
          
          if (isImage) {
            uploadedMediaUrls.push(gcsPath);
            console.log(`[WhatsApp Agent] ✅ ADDED to uploadedMediaUrls (total: ${uploadedMediaUrls.length})`);
          } else {
            console.log(`[WhatsApp Agent] ❌ SKIPPED: Not an image, excluded from uploadedMediaUrls`);
            console.log(`[WhatsApp Agent] ❌ Reason: finalContentType="${finalContentType}" did not match image pattern`);
          }
          
          // Store metadata WITHOUT buffer to prevent OOM
          mediaMetadata.push({
            filename: actualFilename,
            contentType: actualContentType,
            size: buffer.length,
            url: gcsPath,
          });
          
          console.log(`[WhatsApp Agent] ✅ Media ${i + 1} uploaded to: ${gcsPath}`);
        } catch (error) {
          console.error(`[WhatsApp Agent] ❌ Failed to process media ${i + 1}:`, error);
        }
      }
      
      console.log(`[WhatsApp Agent] 📎 Uploaded ${uploadedMediaUrls.length} images, ${mediaMetadata.length} total media files`);
    }

    const cleanText = removeTokenFromMessage(body);
    console.log(`[WhatsApp Agent] Cleaned text: "${cleanText}"`);
    
    // 🎯 PARSE COMMAND FROM MESSAGE
    const command = parseWhatsAppCommand(cleanText);
    console.log(`[WhatsApp Agent] 🎯 Parsed command: ${command.type}`);
    
    // ============================================
    // HANDLE HELP COMMAND
    // ============================================
    if (command.type === 'help') {
      console.log("[WhatsApp Agent] 📖 Help command received");
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "processed",
        reason: "help_command",
        userId: whatsappToken.userId,
        token: token,
        processingTimeMs: Date.now() - startTime,
      });
      
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: getHelpMessage(),
      });
      
      return res.status(200).send('OK');
    }
    
    // ============================================
    // HANDLE EDIT COMMAND
    // ============================================
    if (command.type === 'edit') {
      console.log(`[WhatsApp Agent] ✏️ Edit command - Article: ${command.articleId}`);
      
      const existingArticle = await findArticleByIdentifier(command.articleId);
      
      if (!existingArticle) {
        console.log("[WhatsApp Agent] ❌ Article not found for editing");
        
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "article_not_found",
          userId: whatsappToken.userId,
          token: token,
          processingTimeMs: Date.now() - startTime,
        });
        
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ لم يتم العثور على الخبر\n\nتأكد من صحة الرابط أو المعرف`,
        });
        
        return res.status(200).send('OK');
      }
      
      // Check if user owns the article or has permission (isAdmin or canEditAny)
      const canEdit = existingArticle.authorId === whatsappToken.userId || 
                      whatsappToken.isAdmin || 
                      whatsappToken.canEditAny;
      
      if (!canEdit) {
        console.log("[WhatsApp Agent] ❌ User not authorized to edit this article");
        
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "not_authorized",
          userId: whatsappToken.userId,
          token: token,
          articleId: existingArticle.id,
          processingTimeMs: Date.now() - startTime,
        });
        
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ غير مصرح لك بتعديل هذا الخبر`,
        });
        
        return res.status(200).send('OK');
      }
      
      // Process edit content with AI
      const editContent = command.content || "";
      const hasNewImages = uploadedMediaUrls.length > 0;
      
      if (!editContent && !hasNewImages) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ يرجى إرسال المحتوى الجديد للتعديل`,
        });
        return res.status(200).send('OK');
      }
      
      // If there's new content, process with AI
      let updatedData: any = {};
      
      if (editContent.trim().length > 10) {
        const categories = await storage.getAllCategories();
        const aiResult = await analyzeAndEditWithSabqStyle(editContent, "ar", categories);
        
        updatedData = {
          title: aiResult.optimized.title,
          content: aiResult.optimized.content,
          excerpt: aiResult.optimized.lead,
          seo: {
            keywords: aiResult.optimized.seoKeywords || [],
          },
        };
        
        // Update category if detected
        if (aiResult.detectedCategory) {
          const category = categories.find(
            c => c.nameAr === aiResult.detectedCategory || c.nameEn === aiResult.detectedCategory
          );
          if (category) {
            updatedData.categoryId = category.id;
          }
        }
      }
      
      // Add new image if uploaded
      if (hasNewImages) {
        updatedData.imageUrl = uploadedMediaUrls[0];
      }
      
      // Update the article
      await storage.updateArticle(existingArticle.id, updatedData);
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "processed",
        reason: "article_edited",
        userId: whatsappToken.userId,
        token: token,
        articleId: existingArticle.id,
        articleLink: `https://sabq.news/article/${existingArticle.slug}`,
        processingTimeMs: Date.now() - startTime,
      });
      
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: `السلام عليكم\n✅ تم تعديل الخبر بنجاح\n\nhttps://sabq.news/article/${existingArticle.slug}`,
      });
      
      console.log(`[WhatsApp Agent] ✅ Article edited: ${existingArticle.id}`);
      return res.status(200).send('OK');
    }
    
    // ============================================
    // HANDLE DELETE COMMAND
    // ============================================
    if (command.type === 'delete') {
      console.log(`[WhatsApp Agent] 🗑️ Delete command - Article: ${command.articleId}`);
      
      const existingArticle = await findArticleByIdentifier(command.articleId);
      
      if (!existingArticle) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ لم يتم العثور على الخبر`,
        });
        return res.status(200).send('OK');
      }
      
      // Check if user owns the article or has permission (isAdmin or canDeleteAny)
      const canDelete = existingArticle.authorId === whatsappToken.userId || 
                        whatsappToken.isAdmin || 
                        whatsappToken.canDeleteAny;
      
      if (!canDelete) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ غير مصرح لك بحذف هذا الخبر`,
        });
        return res.status(200).send('OK');
      }
      
      // Soft delete - change status to deleted
      await storage.updateArticle(existingArticle.id, { status: 'deleted' });
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "processed",
        reason: "article_deleted",
        userId: whatsappToken.userId,
        token: token,
        articleId: existingArticle.id,
        processingTimeMs: Date.now() - startTime,
      });
      
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: `السلام عليكم\n🗑️ تم حذف الخبر بنجاح\n\n${existingArticle.title}`,
      });
      
      console.log(`[WhatsApp Agent] ✅ Article deleted: ${existingArticle.id}`);
      return res.status(200).send('OK');
    }
    
    // ============================================
    // HANDLE ARCHIVE COMMAND
    // ============================================
    if (command.type === 'archive') {
      console.log(`[WhatsApp Agent] 📁 Archive command - Article: ${command.articleId}`);
      
      const existingArticle = await findArticleByIdentifier(command.articleId);
      
      if (!existingArticle) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ لم يتم العثور على الخبر`,
        });
        return res.status(200).send('OK');
      }
      
      // Check if user owns the article or has permission (isAdmin or canArchiveAny)
      const canArchive = existingArticle.authorId === whatsappToken.userId || 
                         whatsappToken.isAdmin || 
                         whatsappToken.canArchiveAny;
      
      if (!canArchive) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ غير مصرح لك بأرشفة هذا الخبر`,
        });
        return res.status(200).send('OK');
      }
      
      await storage.updateArticle(existingArticle.id, { status: 'archived' });
      await storage.updateArticle(existingArticle.id, { status: 'archived' });
      
      // مسح الكاش فوراً وإشعار المتصفحات لإزالة الخبر من القوائم
      memoryCache.invalidatePatterns([
        "^homepage:",
        "^blocks:",
        "^trending:",
        "^articles:",
        "^category:"
      ]);
      console.log(`[WhatsApp Agent] Cache invalidated and SSE broadcast for article archive`);
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
      });
      
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: `السلام عليكم\n📁 تم أرشفة الخبر بنجاح\n\n${existingArticle.title}`,
      });
      
      console.log(`[WhatsApp Agent] ✅ Article archived: ${existingArticle.id}`);
      return res.status(200).send('OK');
    }
    
    // ============================================
    // HANDLE BREAKING NEWS COMMAND
    // ============================================
    if (command.type === 'breaking') {
      console.log(`[WhatsApp Agent] 🚨 Breaking command - Article: ${command.articleId}`);
      
      const existingArticle = await findArticleByIdentifier(command.articleId);
      
      if (!existingArticle) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ لم يتم العثور على الخبر`,
        });
        return res.status(200).send('OK');
      }
      
      // Check if user owns the article or has permission (isAdmin or canMarkBreaking)
      const canMarkBreaking = existingArticle.authorId === whatsappToken.userId || 
                              whatsappToken.isAdmin || 
                              whatsappToken.canMarkBreaking;
      
      if (!canMarkBreaking) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `❌ غير مصرح لك بتغيير حالة العاجل`,
        });
        return res.status(200).send('OK');
      }
      
      // Toggle breaking status
      const newNewsType = existingArticle.newsType === 'breaking' ? 'regular' : 'breaking';
      await storage.updateArticle(existingArticle.id, { newsType: newNewsType });
      
      // مسح الكاش فوراً وإشعار المتصفحات لظهور التغيير مباشرة
      memoryCache.invalidatePatterns([
        "^homepage:",
        "^blocks:",
        "^breaking:",
        "^trending:",
        "^articles:",
        "^category:"
      ]);
      console.log(`[WhatsApp Agent] Cache invalidated and SSE broadcast for breaking news change`);
      
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "processed",
        reason: newNewsType === 'breaking' ? "marked_breaking" : "unmarked_breaking",
        userId: whatsappToken.userId,
        token: token,
        articleId: existingArticle.id,
        processingTimeMs: Date.now() - startTime,
      });
      
      const message = newNewsType === 'breaking'
        ? `السلام عليكم\n🚨 تم تحويل الخبر إلى عاجل\n\nhttps://sabq.news/article/${existingArticle.slug}`
        : `السلام عليكم\n✅ تم إلغاء تصنيف العاجل\n\nhttps://sabq.news/article/${existingArticle.slug}`;
      
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: message,
      });
      
      console.log(`[WhatsApp Agent] ✅ Article breaking status changed: ${existingArticle.id} -> ${newNewsType}`);
      return res.status(200).send('OK');
    }

    // ============================================
    // HANDLE CREATE COMMAND (DEFAULT) - WITH MESSAGE AGGREGATION
    // ============================================
    const hasImages = uploadedMediaUrls.length > 0;
    const textLength = cleanText?.trim().length || 0;
    
    // Check if user wants to force processing (send command)
    const forceProcess = shouldForceProcess(cleanText);
    
    // If message is just a send command with no content, check for pending messages
    if (forceProcess && textLength < 20 && !hasImages) {
      console.log("[WhatsApp Agent] 🚀 Force process command received");
      
      const pendingMessage = await storage.getPendingWhatsappMessage(phoneNumber, token);
      
      if (pendingMessage) {
        console.log(`[WhatsApp Agent] Found pending message with ${pendingMessage.messageParts.length} parts`);
        
        // Mark webhook log as aggregation trigger
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "processed",
          reason: "aggregation_trigger",
          userId: whatsappToken.userId,
          token: token,
          processingTimeMs: Date.now() - startTime,
        });
        
        // Force process the pending message
        await addMessagePart({
          phoneNumber,
          token,
          tokenId: whatsappToken.id,
          userId: whatsappToken.userId,
          messagePart: "",
          forceProcess: true,
        });
        
        return res.status(200).send('OK');
      }
    }
    
    // If text is too short and no images, reject
    if (!hasImages && textLength < 10) {
      console.log("[WhatsApp Agent] Text too short (no images attached)");
      
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "rejected",
        reason: "text_too_short",
        userId: whatsappToken.userId,
        token: token,
        mediaUrls: mediaMetadata.map(m => m.url),
        processingTimeMs: Date.now() - startTime,
      });

      return res.status(200).send('OK');
    }
    
    console.log(`[WhatsApp Agent] Text validation passed (hasImages: ${hasImages}, textLength: ${textLength})`);
    
    // ============================================
    // MESSAGE AGGREGATION SYSTEM
    // ============================================
    // Add message to pending queue for aggregation (30 second window)
    const { pending, isFirst } = await addMessagePart({
      phoneNumber,
      token,
      tokenId: whatsappToken.id,
      userId: whatsappToken.userId,
      messagePart: cleanText,
      mediaUrls: uploadedMediaUrls,
      forceProcess: false,
    });
    
    // Update webhook log as pending for aggregation
    await storage.updateWhatsappWebhookLog(webhookLog.id, {
      status: "processed",
      reason: isFirst ? "aggregation_started" : "aggregation_part_added",
      userId: whatsappToken.userId,
      token: token,
      mediaUrls: uploadedMediaUrls,
      processingTimeMs: Date.now() - startTime,
    });
    
    // Skip confirmation message for instant publishing (AGGREGATION_WINDOW_SECONDS === 0)
    // The publication link will be sent immediately after processing
    if (AGGREGATION_WINDOW_SECONDS > 0) {
      if (isFirst) {
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `✅ تم استلام رسالتك\n📝 أرسل المزيد خلال ${AGGREGATION_WINDOW_SECONDS} ثانية أو "إرسال" للنشر`,
        });
      } else {
        const partsCount = pending.messageParts.length;
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `✅ تم إضافة الجزء ${partsCount} - أرسل "إرسال" للنشر`,
        });
      }
    }
    // For instant publishing, no need for confirmation - link will arrive shortly
    
    console.log("[WhatsApp Agent] ============ WEBHOOK END (AGGREGATION) ============");
    return res.status(200).send('OK');
    
    /* 
    // ============================================
    // LEGACY: DIRECT PROCESSING (BYPASSED BY AGGREGATION)
    // ============================================
    */
  
    // 🌐 FORCE ARABIC OUTPUT: WhatsApp Agent always publishes in Arabic
    // Regardless of source language, translate/rewrite to Arabic for consistency
    const targetLang = "ar" as const;
    
    // Detect language for logging only (with fallback to avoid blocking)
    let detectedLang = "ar";
    try {
      detectedLang = await detectLanguage(cleanText);
      console.log(`[WhatsApp Agent] Detected language: ${detectedLang}`);
    } catch (error) {
      console.warn(`[WhatsApp Agent] Language detection failed, using fallback:`, error);
    }
    
    console.log(`[WhatsApp Agent] Target language (forced): ${targetLang}`);

    const categories = await storage.getAllCategories();
    const aiResult = await analyzeAndEditWithSabqStyle(cleanText, targetLang, categories);

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
      },
      // 🔑 SEO Keywords - stored in proper seo.keywords format
      seo: {
        keywords: aiResult.optimized.seoKeywords || [],
      },
      // 🔥 Essential fields for article visibility
      articleType: "news", // Ensures article appears in homepage queries
      newsType: "regular", // Default news type (not breaking/featured)
      hideFromHomepage: false, // Article must be visible on homepage
      displayOrder: Math.floor(Date.now() / 1000), // New articles appear at top (seconds for consistency)
    } as any);

    console.log(`[WhatsApp Agent] ✅ Article created: ${article.id}, status: ${articleStatus}`);

    // 🆕 Create MediaFiles and link all uploaded images to the article
    // This happens AFTER article creation to avoid orphaned records
    const imageMedia = uploadedMediaUrls.map((url, index) => ({
      url,
      metadata: mediaMetadata.find(m => m.url === url),
      index
    })).filter(item => item.metadata);
    
    if (imageMedia.length > 0) {
      console.log(`[WhatsApp Agent] 🔗 Creating mediaFiles and linking ${imageMedia.length} images to article...`);
      
      for (const { url, metadata, index } of imageMedia) {
        if (!metadata) continue;
        
        try {
          // Generate descriptive alt text based on article context
          const titleWords = aiResult.optimized.title.split(' ').slice(0, 8).join(' ');
          const leadWords = aiResult.optimized.lead.split(' ').slice(0, 5).join(' ');
          
          const altTextTemplates = {
            ar: index === 0 
              ? `صورة ${titleWords}`
              : `${leadWords} - صورة ${index + 1}`,
            en: index === 0
              ? `Image: ${titleWords}`
              : `${leadWords} - Image ${index + 1}`,
            ur: index === 0
              ? `تصویر: ${titleWords}`
              : `${leadWords} - تصویر ${index + 1}`
          };
          
          let altText = altTextTemplates[targetLang];
          // Ensure max 125 chars for WCAG AA compliance
          if (altText.length > 125) {
            altText = altText.substring(0, 122) + "...";
          }
          
          // Use transaction to ensure atomicity (mediaFile + articleMediaAsset)
          await db.transaction(async (tx) => {
            // Create MediaFile record
            const [mediaFile] = await tx.insert(mediaFiles).values({
              fileName: metadata.filename,
              originalName: metadata.filename,
              url: metadata.url,
              type: "image",
              mimeType: metadata.contentType,
              size: metadata.size,
              category: "articles",
              uploadedBy: whatsappToken.userId,
              title: `${titleWords} - صورة ${index + 1}`,
              keywords: ["whatsapp", "auto-upload"],
              altText: altText,
            }).returning();
            
            console.log(`[WhatsApp Agent] ✅ Created mediaFile: ${mediaFile.id}`);
            
            // Link image to article via articleMediaAssets (in same transaction)
            await tx.insert(articleMediaAssets).values({
              articleId: article.id,
              mediaFileId: mediaFile.id,
              locale: targetLang,
              displayOrder: index,
              altText: altText,
              moderationStatus: "approved",
              sourceName: "WhatsApp",
            });
            
            console.log(`[WhatsApp Agent] ✅ Linked image ${index + 1} to article (altText: "${altText}")`);
          });
          
        } catch (linkError) {
          console.error(`[WhatsApp Agent] ⚠️ Failed to process image ${index + 1}:`, linkError);
          // Continue with other images even if one fails (transaction rollback for this image only)
        }
      }
      
      console.log(`[WhatsApp Agent] 🔗 Successfully processed ${imageMedia.length} images for article`);
    }

    // 🔄 INVALIDATE HOMEPAGE CACHE - New article should appear immediately
    if (articleStatus === 'published') {
      console.log(`[WhatsApp Agent] 🗑️ Invalidating homepage cache for immediate article visibility...`);
      memoryCache.invalidatePattern('^homepage:');
      console.log(`[WhatsApp Agent] ✅ Homepage cache invalidated`);
    }

    await storage.updateWhatsappTokenUsage(whatsappToken.id);

    // ✅ UPDATE THE LOG WITH SUCCESS STATUS, ARTICLE LINK, AND PUBLISH STATUS
    await storage.updateWhatsappWebhookLog(webhookLog.id, {
      status: "processed",
      userId: whatsappToken.userId,
      tokenId: whatsappToken.id,
      token: token,
      articleId: article.id,
      articleLink: `https://sabq.news/article/${slug}`,
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
      ? `السلام عليكم\n✅ تم نشر الخبر بنجاح\n\nhttps://sabq.news/article/${slug}`
      : `السلام عليكم\n📝 تم حفظ الخبر كمسودة\nسيتم مراجعته قبل النشر`;

    // 🔍 DEBUG REPLY MESSAGE DETAILS
    console.log(`[WhatsApp Agent] 📤 Preparing to send reply message:`);
    console.log(`[WhatsApp Agent]   - From: whatsapp:${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`[WhatsApp Agent]   - To: whatsapp:${phoneNumber}`);
    console.log(`[WhatsApp Agent]   - Message: ${replyMessage}`);
    console.log(`[WhatsApp Agent]   - Slug: ${slug}`);
    console.log(`[WhatsApp Agent]   - Status: ${articleStatus}`);

    try {
      // Check 24-hour window before sending
      const windowStatus = isWithin24HourWindow(phoneNumber);
      console.log(`[WhatsApp Agent] ⏰ 24h window status: ${windowStatus ? 'OPEN' : 'CLOSED'}`);
      
      console.log(`[WhatsApp Agent] 🔄 Calling sendWhatsAppMessageWithDetails...`);
      const result = await sendWhatsAppMessageWithDetails({
        to: phoneNumber,
        body: replyMessage,
      });
      
      if (result.success) {
        console.log(`[WhatsApp Agent] ✅ REPLY SENT SUCCESSFULLY`);
        console.log(`[WhatsApp Agent]   - SID: ${result.sid}`);
        console.log(`[WhatsApp Agent]   - Status: ${result.status}`);
      } else {
        console.error(`[WhatsApp Agent] ❌ REPLY FAILED`);
        console.error(`[WhatsApp Agent]   - Error: ${result.error}`);
        console.error(`[WhatsApp Agent]   - Error Code: ${result.errorCode || 'none'}`);
        console.error(`[WhatsApp Agent]   - Requires Template: ${result.requiresTemplate ? 'YES' : 'no'}`);
        
        if (result.requiresTemplate) {
          console.error(`[WhatsApp Agent] 📋 MESSAGE REQUIRES APPROVED TEMPLATE - Outside 24h window`);
        }
      }
    } catch (error) {
      console.error(`[WhatsApp Agent] ❌ EXCEPTION while sending reply:`, error instanceof Error ? error.message : error);
      if (error instanceof Error) {
        console.error(`[WhatsApp Agent] Stack trace:`, error.stack);
      }
    }

    console.log("[WhatsApp Agent] ============ WEBHOOK END (SUCCESS) ============");
    return res.status(200).send('OK');

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
    
    console.log("[WhatsApp Agent] PATCH /tokens/:id - Received updates:", JSON.stringify(updates, null, 2));
    
    delete updates.token;
    delete updates.usageCount;
    delete updates.lastUsedAt;
    delete updates.createdAt;
    
    console.log("[WhatsApp Agent] PATCH /tokens/:id - After cleanup:", JSON.stringify(updates, null, 2));
    
    const updated = await storage.updateWhatsappToken(id, updates);
    
    console.log("[WhatsApp Agent] PATCH /tokens/:id - Updated token:", JSON.stringify(updated, null, 2));
    
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
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }
    
    await storage.bulkDeleteWhatsappWebhookLogs(ids);
    
    return res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("[WhatsApp Agent] Error bulk deleting logs:", error);
    return res.status(500).json({ error: "Failed to bulk delete logs" });
  }
});

// ============================================
// KAPSO WEBHOOK HANDLER
// ============================================

// GET handler for webhook verification
router.get("/kapso-webhook", async (req: Request, res: Response) => {
  console.log("[Kapso WhatsApp] 🔍 Webhook verification request received");
  console.log("[Kapso WhatsApp] Query params:", req.query);
  
  // Kapso may send a verification challenge
  const challenge = req.query['hub.challenge'] || req.query.challenge;
  if (challenge) {
    console.log("[Kapso WhatsApp] ✅ Returning challenge:", challenge);
    return res.status(200).send(challenge);
  }
  
  // Simple ping/health check
  return res.status(200).json({ 
    status: 'ok', 
    message: 'Kapso webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
});

router.post("/kapso-webhook", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let webhookLog: any = null;
  
  try {
    console.log("[Kapso WhatsApp] ============ WEBHOOK START ============");
    console.log(`[Kapso WhatsApp] 📝 Request Body:`, JSON.stringify(req.body, null, 2));
    
    // 🔐 SECURITY: Verify Kapso webhook authenticity
    const kapsoApiKey = process.env.KAPSO_API_KEY;
    const kapsoWebhookSecret = process.env.KAPSO_WEBHOOK_SECRET;
    const kapsoSignature = req.headers['x-kapso-signature'] as string;
    const kapsoApiKeyHeader = req.headers['x-kapso-api-key'] as string;
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipValidation = isDevelopment && process.env.SKIP_KAPSO_VALIDATION === 'true';
    
    // Validate that Kapso is configured
    if (!kapsoApiKey) {
      console.error("[Kapso WhatsApp] ❌ Kapso not configured");
      
      await storage.createWhatsappWebhookLog({
        from: 'unknown',
        message: '',
        status: 'rejected',
        reason: 'Kapso not configured - webhook received but service disabled',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(200).json({ success: false, error: 'Service not configured' });
    }
    
    // Validate webhook authenticity using one of these methods:
    // 1. API key header validation
    // 2. HMAC signature validation (if webhook secret is configured)
    let isValid = skipValidation;
    
    if (!skipValidation) {
      // Method 1: Validate using API key header
      if (kapsoApiKeyHeader) {
        isValid = kapsoApiKeyHeader === kapsoApiKey;
        console.log(`[Kapso WhatsApp] 🔐 API key header validation: ${isValid ? 'PASSED' : 'FAILED'}`);
      }
      
      // Method 2: Validate using HMAC signature (if secret is configured)
      if (!isValid && kapsoWebhookSecret && kapsoSignature) {
        const expectedSignature = crypto
          .createHmac('sha256', kapsoWebhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
        
        isValid = crypto.timingSafeEqual(
          Buffer.from(kapsoSignature),
          Buffer.from(expectedSignature)
        );
        console.log(`[Kapso WhatsApp] 🔐 HMAC signature validation: ${isValid ? 'PASSED' : 'FAILED'}`);
      }
      
      // Method 3: If no secret/header, use IP whitelist or basic validation
      // For now, if Kapso is configured and request has expected structure, proceed with caution
      if (!isValid && !kapsoWebhookSecret && !kapsoApiKeyHeader) {
        // Log warning but allow processing if Kapso is configured and body has expected format
        console.warn("[Kapso WhatsApp] ⚠️ No webhook authentication configured - allowing request");
        console.warn("[Kapso WhatsApp] ⚠️ Set KAPSO_WEBHOOK_SECRET for secure webhook validation");
        isValid = true;
      }
    }
    
    if (!isValid) {
      console.error("[Kapso WhatsApp] ❌ Invalid webhook authentication");
      
      await storage.createWhatsappWebhookLog({
        from: 'unknown',
        message: '',
        status: 'rejected',
        reason: 'Invalid Kapso webhook authentication - possible spoofing attempt',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(200).json({ success: false, error: 'Invalid request' });
    }
    
    console.log("[Kapso WhatsApp] ✅ Webhook authentication validated");
    
    const payload = req.body;
    
    // Handle Kapso webhook v2 format
    // v2 sends single message object, not array
    // Format: { event: "whatsapp.message.received", message: { id, from, type, text: { body } } }
    
    let messages: any[] = [];
    
    // Check for v2 format (single message object)
    if (payload.event && payload.message) {
      console.log("[Kapso WhatsApp] Detected v2 payload format");
      messages = [payload.message];
    }
    // Check for v1 format (messages array)
    else if (payload.messages && Array.isArray(payload.messages)) {
      console.log("[Kapso WhatsApp] Detected v1 payload format");
      messages = payload.messages;
    }
    // Check for direct message object
    else if (payload.from && (payload.text || payload.body)) {
      console.log("[Kapso WhatsApp] Detected direct message format");
      messages = [payload];
    }
    
    if (messages.length === 0) {
      console.log("[Kapso WhatsApp] No messages found in webhook body");
      console.log("[Kapso WhatsApp] Payload keys:", Object.keys(payload));
      
      // Log the payload for debugging
      await storage.createWhatsappWebhookLog({
        from: 'kapso-debug',
        message: JSON.stringify(payload).substring(0, 500),
        status: 'received',
        reason: 'empty_or_unknown_format',
        processingTimeMs: Date.now() - startTime,
      });
      
      return res.status(200).json({ success: true });
    }
    
    console.log(`[Kapso WhatsApp] Processing ${messages.length} message(s)`);
    
    for (const message of messages) {
      const from = message.from || message.contact_phone || payload.contact_phone || "";
      const body = message.text?.body || message.body || message.content || "";
      const messageId = message.id || payload.message_id;
      
      console.log("[Kapso WhatsApp] Processing message:");
      console.log("[Kapso WhatsApp] - From:", from);
      console.log("[Kapso WhatsApp] - Body:", body);
      console.log("[Kapso WhatsApp] - Message ID:", messageId);
      
      // Update 24h window tracker
      updateKapsoLastInboundTime(from);
      
      // Create webhook log
      webhookLog = await storage.createWhatsappWebhookLog({
        from: from,
        message: body,
        status: "received",
      });
      
      console.log(`[Kapso WhatsApp] Created webhook log: ${webhookLog.id}`);
      
      // Extract token from message
      const token = extractTokenFromMessage(body);
      
      if (!token) {
        console.log("[Kapso WhatsApp] No token found in message");
        
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "no_token_found",
          processingTimeMs: Date.now() - startTime,
        });
        
        continue;
      }
      
      console.log(`[Kapso WhatsApp] Token extracted: ${token}`);
      
      const whatsappToken = await storage.getWhatsappTokenByToken(token);
      
      if (!whatsappToken) {
        console.log("[Kapso WhatsApp] Token not found in database");
        
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "invalid_token",
          token: token,
          processingTimeMs: Date.now() - startTime,
        });
        
        continue;
      }
      
      if (!whatsappToken.isActive) {
        console.log("[Kapso WhatsApp] Token is inactive");
        
        await storage.updateWhatsappWebhookLog(webhookLog.id, {
          status: "rejected",
          reason: "token_inactive",
          userId: whatsappToken.userId,
          token: token,
          processingTimeMs: Date.now() - startTime,
        });
        
        continue;
      }
      
      // Process the message content (similar to Twilio webhook)
      const contentWithoutToken = removeTokenFromMessage(body);
      const command = parseWhatsAppCommand(contentWithoutToken);
      
      console.log(`[Kapso WhatsApp] Command type: ${command.type}`);
      
      // Update log with processing info
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "processed",
        userId: whatsappToken.userId,
        token: token,
        processingTimeMs: Date.now() - startTime,
      });
      
      // Send confirmation via Kapso
      const confirmationMessage = `✅ تم استلام رسالتك بنجاح!\n\nنوع الأمر: ${command.type === 'create' ? 'إنشاء مقال جديد' : command.type}\n\n🔄 جاري المعالجة...`;
      
      await sendKapsoWhatsAppMessage({
        to: from,
        body: confirmationMessage
      });
    }
    
    console.log("[Kapso WhatsApp] ============ WEBHOOK END ============");
    return res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error("[Kapso WhatsApp] Webhook error:", error);
    
    if (webhookLog) {
      await storage.updateWhatsappWebhookLog(webhookLog.id, {
        status: "error",
        reason: error.message || "Unknown error",
        processingTimeMs: Date.now() - startTime,
      });
    }
    
    return res.status(200).json({ success: false, error: error.message });
  }
});

// Get Kapso status
router.get("/kapso-status", requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const status = getKapsoStatus();
    return res.json(status);
  } catch (error) {
    console.error("[Kapso WhatsApp] Error getting status:", error);
    return res.status(500).json({ error: "Failed to get Kapso status" });
  }
});

export default router;
