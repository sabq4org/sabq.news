import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { analyzeAndEditWithSabqStyle, detectLanguage, normalizeLanguageCode, generateImageAltText } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";
import { twilioClient, sendWhatsAppMessage, extractTokenFromMessage, removeTokenFromMessage, validateTwilioSignature } from "../services/whatsapp";
import { requireAuth, requireRole } from "../rbac";
import { insertWhatsappTokenSchema, mediaFiles, articleMediaAssets } from "@shared/schema";
import crypto from "crypto";
import { db } from "../db";

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

      return res.status(200).send('OK');
    }
    
    console.log(`[WhatsApp Agent] Text validation passed (hasImages: ${hasImages}, textLength: ${textLength})`);
  
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
      seoKeywords: aiResult.optimized.seoKeywords,
      // 🔥 Essential fields for article visibility
      articleType: "news", // Ensures article appears in homepage queries
      newsType: "regular", // Default news type (not breaking/featured)
      hideFromHomepage: false, // Article must be visible on homepage
      displayOrder: 0, // Default display order
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
      console.log(`[WhatsApp Agent] 🔄 Calling sendWhatsAppMessage...`);
      const result = await sendWhatsAppMessage({
        to: phoneNumber,
        body: replyMessage,
      });
      
      if (result) {
        console.log(`[WhatsApp Agent] ✅ REPLY SENT SUCCESSFULLY to ${phoneNumber}`);
      } else {
        console.error(`[WhatsApp Agent] ❌ sendWhatsAppMessage returned false - Twilio not configured or failed`);
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
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }
    
    await storage.bulkDeleteWhatsappWebhookLogs(ids);
    
    return res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("[WhatsApp Agent] Error bulk deleting logs:", error);
    return res.status(500).json({ error: "Failed to bulk delete logs" });
  }
});

export default router;
