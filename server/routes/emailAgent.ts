import { Router, Request, Response } from "express";
import multer from "multer";
import { simpleParser } from "mailparser";
import mammoth from "mammoth";
import { storage } from "../storage";
import { analyzeAndEditWithSabqStyle, detectLanguage, normalizeLanguageCode } from "../ai/contentAnalyzer";
import { objectStorageClient } from "../objectStorage";
import { nanoid } from "nanoid";
import { isAuthenticated } from "../auth";
import { requireRole, requirePermission } from "../rbac";
import { db } from "../db";
import { mediaFiles, articleMediaAssets } from "@shared/schema";
import { memoryCache } from "../memoryCache";
import { detectUrls, isNewsUrl, containsOnlyUrl, extractArticleContent, getSourceAttribution } from "../services/urlContentExtractor";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for file attachments (SendGrid's max)
    fieldSize: 50 * 1024 * 1024, // 50MB for raw MIME email field (increased to handle large emails with attachments)
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
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  try {
    // For images, use PUBLIC directory so they can be displayed in browser
    // For other files (Word docs, PDFs), use PRIVATE directory
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

    console.log(`[Email Agent] ✅ Uploaded ${isPublic ? 'PUBLIC' : 'PRIVATE'} attachment: ${fullPath}`);
    
    // 🎯 Return Backend Proxy URL (Replit Object Storage doesn't allow makePublic or signed URLs)
    // The backend will stream the file from Object Storage
    if (isPublic) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://sabq.news';
      const proxyUrl = `${frontendUrl}/api/public-media/${fullPath}`;
      console.log(`[Email Agent] 🌐 Generated proxy URL: ${proxyUrl}`);
      return proxyUrl;
    }
    
    // For private files, return the relative path (requires proxy/download endpoint)
    return `${objectDir}/${storedFilename}`;
  } catch (error) {
    console.error("[Email Agent] Error uploading attachment:", error);
    throw error;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectPath: string } {
  // Use the actual Replit bucket ID
  const bucketName = process.env.REPLIT_OBJECT_BUCKET || 'replit-objstore-3dc2325c-bbbe-4e54-9a00-e6f10b243138';
  
  // Treat the entire path (e.g., "sabq-production-bucket/public") as the object path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const objectPath = cleanPath;
  
  console.log(`[Email Agent] 🪣 Parsed object path: bucket="${bucketName}", path="${objectPath}"`);
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

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("[Email Agent] Error extracting text from DOCX:", error);
    return "";
  }
}

router.post("/webhook", upload.any(), async (req: Request, res: Response) => {
  let webhookLog: any = null; // Define outside try block so it's accessible in catch
  
  try {
    console.log("[Email Agent] ============ WEBHOOK START ============");
    console.log("[Email Agent] Received webhook from SendGrid");
    console.log("[Email Agent] Raw req.body keys:", Object.keys(req.body));
    
    let from = "";
    let to = "";
    let subject = "";
    let text = "";
    let html = "";
    let parsedAttachments: any[] = [];
    
    // Check if SendGrid sent raw email (Inbound Parse Raw mode)
    if (req.body.email) {
      console.log("[Email Agent] Detected RAW email format - parsing with mailparser");
      console.log("[Email Agent] Raw email length:", req.body.email.length);
      console.log("[Email Agent] Raw email type:", typeof req.body.email);
      
      // 🔍 DIAGNOSTIC: Check for field size truncation
      const MULTER_FIELD_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
      if (req.body.email.length >= MULTER_FIELD_SIZE_LIMIT * 0.95) {
        console.warn("[Email Agent] ⚠️ WARNING: Raw email size approaching Multer fieldSize limit!");
        console.warn(`[Email Agent] Size: ${(req.body.email.length / 1024 / 1024).toFixed(2)}MB, Limit: ${(MULTER_FIELD_SIZE_LIMIT / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // 🔍 DIAGNOSTIC: Log first 500 bytes of raw MIME for inspection
      const preview = req.body.email.substring(0, 500);
      console.log("[Email Agent] 🔍 Raw MIME preview (first 500 bytes):");
      console.log(preview);
      console.log("[Email Agent] 🔍 End of preview");
      
      try {
        // Parse the raw email using mailparser
        // CRITICAL: SendGrid sends raw MIME as string, must preserve binary data for attachments
        // Using 'binary' encoding prevents corruption of base64/binary attachment data
        const emailBuffer = typeof req.body.email === 'string' 
          ? Buffer.from(req.body.email, 'binary')  // ✅ Preserve binary data (images, files)
          : req.body.email;
        
        console.log("[Email Agent] Buffer created, size:", emailBuffer.length, "bytes");
        const parsed = await simpleParser(emailBuffer);
        
        console.log("[Email Agent] 📧 Parsed email structure:");
        console.log("[Email Agent] - Has attachments array:", !!parsed.attachments);
        console.log("[Email Agent] - Attachments count:", parsed.attachments?.length || 0);
        
        // Use SendGrid's parsed from/to if available, otherwise extract from parsed email
        from = req.body.from || "";
        to = req.body.to || "";
        subject = parsed.subject || req.body.subject || "";
        text = parsed.text || "";
        html = typeof parsed.html === 'string' ? parsed.html : (parsed.html ? String(parsed.html) : "");
        
        // 📎 CRITICAL: Extract attachments from parsed email
        if (parsed.attachments && parsed.attachments.length > 0) {
          console.log(`[Email Agent] 📎 Found ${parsed.attachments.length} attachments in raw MIME`);
          parsedAttachments = parsed.attachments;
        }
        
        console.log("[Email Agent] Parsed email successfully:");
        console.log("[Email Agent] - From:", from);
        console.log("[Email Agent] - To:", to);
        console.log("[Email Agent] - Subject:", subject);
        console.log("[Email Agent] - Text length:", text?.length || 0);
        console.log("[Email Agent] - HTML length:", html?.length || 0);
        console.log("[Email Agent] - Parsed attachments:", parsedAttachments.length);
        
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
    
    // 📎 Process attachments from SendGrid (multer files OR parsed attachments from raw MIME)
    let attachments: Express.Multer.File[] = (req.files as Express.Multer.File[]) || [];
    
    // 🔧 Convert parsed attachments (from raw MIME) to Multer format
    // In "Post raw MIME" mode, req.files is always empty - we must use parsedAttachments
    if (parsedAttachments.length > 0) {
      console.log("[Email Agent] 📎 Converting parsed attachments to Multer format");
      attachments = parsedAttachments.map((att: any) => ({
        fieldname: 'attachment',
        originalname: att.filename || 'unnamed',
        encoding: '7bit',
        mimetype: att.contentType || 'application/octet-stream',
        buffer: att.content,
        size: att.content ? att.content.length : 0,
      } as Express.Multer.File));
      
      console.log(`[Email Agent] ✅ Converted ${attachments.length} attachments from raw MIME`);
    }
    
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

    // 📎 Process ALL attachments EARLY (BEFORE ANY VALIDATION)
    // SECURITY: Images are stored in memory (NOT uploaded) until after validation
    // Word docs and other files are uploaded to PRIVATE immediately for processing
    let extractedTextFromDocs = "";
    const allAttachmentsMetadata: Array<{ filename: string; contentType: string; size: number; url: string; type: 'image' | 'document' | 'other' }> = [];
    const uploadedImages: string[] = [];
    const pendingImageUploads: Array<{ buffer: Buffer; filename: string; contentType: string; size: number }> = [];
    
    if (attachments.length > 0) {
      console.log("[Email Agent] 📎 ============ PROCESSING ALL ATTACHMENTS (EARLY) ============");
      
      for (const attachment of attachments) {
        const isWordDoc = attachment.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                          attachment.originalname?.toLowerCase().endsWith('.docx');
        const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(attachment.mimetype);
        
        try {
          if (isWordDoc) {
            // 📄 Process Word Document
            console.log(`[Email Agent] 📄 Found Word document: ${attachment.originalname}`);
            
            // Extract text for AI analysis
            try {
              const extractedText = await extractTextFromDocx(attachment.buffer);
              
              if (extractedText && extractedText.length > 0) {
                console.log(`[Email Agent] ✅ Extracted text from Word: ${extractedText.length} characters`);
                extractedTextFromDocs += extractedText + "\n\n";
              } else {
                console.log(`[Email Agent] ⚠️ No text extracted from Word document`);
              }
            } catch (extractError) {
              console.error(`[Email Agent] ⚠️ Failed to extract text from Word:`, extractError);
            }
            
            // Upload original Word file to PRIVATE immediately (needed for text extraction)
            const gcsPath = await uploadAttachmentToGCS(
              attachment.buffer,
              attachment.originalname,
              attachment.mimetype,
              false  // isPublic: false - Word docs go to PRIVATE
            );
            
            // Save complete metadata
            allAttachmentsMetadata.push({
              filename: attachment.originalname,
              contentType: attachment.mimetype,
              size: attachment.size,
              url: gcsPath,
              type: 'document'
            });
            
            console.log(`[Email Agent] ✅ Word document uploaded to PRIVATE: ${gcsPath}`);
            
          } else if (isImage) {
            // 📸 Process Image - STORE IN MEMORY (DO NOT UPLOAD YET)
            console.log(`[Email Agent] 📸 DETECTED IMAGE: ${attachment.originalname}, mimetype: ${attachment.mimetype}, size: ${attachment.size} bytes`);
            
            // Validate image size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (attachment.size > maxSize) {
              console.log(`[Email Agent] ⚠️ Image ${attachment.originalname} too large (${(attachment.size / 1024 / 1024).toFixed(2)}MB), skipping`);
              continue;
            }
            
            console.log(`[Email Agent] 📸 Storing image in memory (deferred upload): ${attachment.originalname} (${(attachment.size / 1024).toFixed(2)} KB)`);
            console.log(`[Email Agent] 📸 Buffer exists: ${!!attachment.buffer}, Buffer length: ${attachment.buffer?.length || 0}`);
            
            // SECURITY FIX: Store image in memory instead of uploading to PUBLIC
            pendingImageUploads.push({
              buffer: attachment.buffer,
              filename: attachment.originalname,
              contentType: attachment.mimetype,
              size: attachment.size
            });
            
            console.log(`[Email Agent] ✅ Image stored in memory (will upload after validation)`);
            console.log(`[Email Agent] 📸 pendingImageUploads count is now: ${pendingImageUploads.length}`);
            
          } else {
            // 📎 Process Other File Types - Upload to PRIVATE immediately
            console.log(`[Email Agent] 📎 Uploading other file to PRIVATE: ${attachment.originalname}`);
            
            const gcsPath = await uploadAttachmentToGCS(
              attachment.buffer,
              attachment.originalname,
              attachment.mimetype,
              false  // isPublic: false - Other files go to PRIVATE
            );
            
            // Save metadata
            allAttachmentsMetadata.push({
              filename: attachment.originalname,
              contentType: attachment.mimetype,
              size: attachment.size,
              url: gcsPath,
              type: 'other'
            });
            
            console.log(`[Email Agent] ✅ Other file uploaded to PRIVATE: ${gcsPath}`);
          }
        } catch (error) {
          console.error(`[Email Agent] ❌ Failed to process ${attachment.originalname}:`, error);
        }
      }
      
      console.log("[Email Agent] 📎 Early processing summary:");
      console.log("[Email Agent]    - Total attachments:", attachments.length);
      console.log("[Email Agent]    - Word documents (uploaded to PRIVATE):", allAttachmentsMetadata.filter(a => a.type === 'document').length);
      console.log("[Email Agent]    - Images (pending upload):", pendingImageUploads.length);
      console.log("[Email Agent]    - Other files (uploaded to PRIVATE):", allAttachmentsMetadata.filter(a => a.type === 'other').length);
      console.log("[Email Agent] 📎 ==========================================");
    }

    // Helper function to upload pending images to PUBLIC or PRIVATE
    const uploadPendingImages = async (isPublic: boolean): Promise<void> => {
      console.log(`[Email Agent] 📸 ========== uploadPendingImages called ==========`);
      console.log(`[Email Agent] 📸 isPublic: ${isPublic}`);
      console.log(`[Email Agent] 📸 pendingImageUploads.length: ${pendingImageUploads.length}`);
      
      if (pendingImageUploads.length === 0) {
        console.log(`[Email Agent] 📸 No pending images to upload - RETURNING EARLY`);
        return;
      }

      console.log(`[Email Agent] 📸 Uploading ${pendingImageUploads.length} pending images to ${isPublic ? 'PUBLIC' : 'PRIVATE'}...`);
      console.log(`[Email Agent] 📸 Images to upload:`, pendingImageUploads.map(img => ({
        filename: img.filename,
        contentType: img.contentType,
        size: img.size,
        hasBuffer: !!img.buffer
      })));
      
      for (let i = 0; i < pendingImageUploads.length; i++) {
        const image = pendingImageUploads[i];
        console.log(`[Email Agent] 📸 Processing image ${i + 1}/${pendingImageUploads.length}: ${image.filename}`);
        
        try {
          console.log(`[Email Agent] 📸 Calling uploadAttachmentToGCS for ${image.filename}...`);
          const gcsPath = await uploadAttachmentToGCS(
            image.buffer,
            image.filename,
            image.contentType,
            isPublic
          );
          console.log(`[Email Agent] 📸 uploadAttachmentToGCS returned: ${gcsPath}`);
          
          if (isPublic) {
            uploadedImages.push(gcsPath);
            console.log(`[Email Agent] 📸 Added to uploadedImages array. Total now: ${uploadedImages.length}`);
          }
          
          // Update or add metadata
          const existingMetadata = allAttachmentsMetadata.find(m => m.filename === image.filename);
          if (existingMetadata) {
            existingMetadata.url = gcsPath;
            console.log(`[Email Agent] 📸 Updated existing metadata for ${image.filename}`);
          } else {
            allAttachmentsMetadata.push({
              filename: image.filename,
              contentType: image.contentType,
              size: image.size,
              url: gcsPath,
              type: 'image'
            });
            console.log(`[Email Agent] 📸 Added new metadata for ${image.filename}`);
          }
          
          console.log(`[Email Agent] ✅ Image uploaded to ${isPublic ? 'PUBLIC' : 'PRIVATE'}: ${gcsPath}`);
        } catch (error) {
          console.error(`[Email Agent] ❌ Failed to upload image ${image.filename}:`, error);
          console.error(`[Email Agent] ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        }
      }
      
      console.log(`[Email Agent] 📸 Finished uploading ${pendingImageUploads.length} images`);
      console.log(`[Email Agent] 📸 uploadedImages count: ${uploadedImages.length}`);
      console.log(`[Email Agent] 📸 uploadedImages:`, uploadedImages);
      console.log(`[Email Agent] 📸 ========== uploadPendingImages completed ==========`);
    };

    const senderEmail = from.match(/<(.+)>/)?.[1] || from;
    
    const logId = nanoid();
    webhookLog = await storage.createEmailWebhookLog({
      fromEmail: senderEmail,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "received",
    });

    const trustedSender = await storage.getTrustedSenderByEmail(senderEmail);
    
    if (!trustedSender) {
      console.log("[Email Agent] Sender not trusted:", senderEmail);
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "sender_not_trusted",
        senderVerified: false,
        tokenVerified: false,
        // Save all attachments even if rejected early (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "sender_inactive",
        senderVerified: true,
        tokenVerified: false,
        trustedSenderId: trustedSender.id,
        // Save all attachments even if rejected early (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "invalid_token",
        senderVerified: true,
        tokenVerified: false,
        trustedSenderId: trustedSender.id,
        // Save all attachments even if rejected early (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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
    
    // 👤 Get assigned reporter user from trusted sender
    let reporterUser;
    if (trustedSender.reporterUserId) {
      console.log("[Email Agent] 👤 Fetching assigned reporter user:", trustedSender.reporterUserId);
      reporterUser = await storage.getUser(trustedSender.reporterUserId);
      if (!reporterUser) {
        console.log("[Email Agent] ⚠️ Assigned reporter not found, falling back to system user");
        reporterUser = systemUser;
      } else {
        console.log("[Email Agent] ✅ Reporter user found:", reporterUser.id, `-`, reporterUser.firstName, reporterUser.lastName);
      }
    } else {
      console.log("[Email Agent] ℹ️ No reporter assigned to this sender, using system user");
      reporterUser = systemUser;
    }

    // Extract content from text or HTML
    let emailContent = text || (html ? html.replace(/<[^>]*>/g, '') : '');
    
    // Add extracted text from Word documents
    if (extractedTextFromDocs) {
      console.log("[Email Agent] 📄 Extracted text from Word docs:", extractedTextFromDocs.length, "chars");
      emailContent = extractedTextFromDocs + "\n\n" + emailContent;
    }
    
    // Remove token from content (support all formats)
    emailContent = emailContent
      .replace(/\[TOKEN:\s*[A-F0-9]{64}\s*\]/gi, '')  // [TOKEN:xxx]
      .replace(/TOKEN:\s*[A-F0-9]{64}/gi, '')          // TOKEN:xxx or TOKEN: xxx
      .replace(/\b[A-F0-9]{64}\b/g, '')                // bare 64-hex
      .trim();
    
    console.log("[Email Agent] Content length after token removal:", emailContent.length);
    
    // 🔗 URL CONTENT EXTRACTION: Check if email contains a news URL to extract
    let urlExtractionResult: any = null;
    let extractedFromUrl = false;
    
    // 🔗 CRITICAL FIX: Extract URLs from HTML href attributes BEFORE stripping HTML
    // This ensures we don't lose URLs that are only in anchor tags
    let htmlUrls: string[] = [];
    if (html) {
      const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const url = match[1];
        if (url && url.startsWith('http')) {
          htmlUrls.push(url);
        }
      }
      console.log("[Email Agent] 🔗 URLs extracted from HTML hrefs:", htmlUrls.length, htmlUrls);
    }
    
    // Combine URLs from both plain text content AND HTML hrefs
    const textUrls = detectUrls(emailContent);
    const combinedUrls = [...htmlUrls, ...textUrls];
    const detectedUrls = combinedUrls.filter((url, index) => combinedUrls.indexOf(url) === index); // Remove duplicates
    console.log("[Email Agent] 🔗 All detected URLs (HTML + text):", detectedUrls.length, detectedUrls);
    
    if (detectedUrls.length > 0) {
      console.log("[Email Agent] 🔗 Detected URLs in email:", detectedUrls);
      
      // Find the first news URL
      const newsUrl = detectedUrls.find(url => isNewsUrl(url));
      
      if (newsUrl) {
        console.log("[Email Agent] 🔗 Found news URL:", newsUrl);
        
        // Check if this is primarily a URL-only message
        // Cases to consider:
        // 1. Plain text content has URL only (less than 20 chars after removing URL)
        // 2. HTML has URL in href AND content is minimal (just link text like "اقرأ المقال")
        // 3. Plain text with URL AND minimal additional content (< 300 chars total) - e.g., headline + URL + source
        const textIsUrlOnly = containsOnlyUrl(emailContent);
        const htmlHasUrlAndMinimalContent = htmlUrls.length > 0 && emailContent.length < 150;
        const hasUrlWithMinimalText = textUrls.length > 0 && emailContent.length < 300;
        const isUrlOnly = textIsUrlOnly || htmlHasUrlAndMinimalContent || hasUrlWithMinimalText;
        console.log("[Email Agent] 🔗 Is URL-only message:", isUrlOnly, 
          `(textUrlOnly: ${textIsUrlOnly}, htmlUrlWithMinimalContent: ${htmlHasUrlAndMinimalContent}, hasUrlWithMinimalText: ${hasUrlWithMinimalText})`);
        
        if (isUrlOnly) {
          console.log("[Email Agent] 🌐 Extracting article content from URL...");
          
          try {
            urlExtractionResult = await extractArticleContent(newsUrl);
            
            if (urlExtractionResult.success && urlExtractionResult.article) {
              console.log("[Email Agent] ✅ URL extraction successful!");
              console.log("[Email Agent]    - Title:", urlExtractionResult.article.title);
              console.log("[Email Agent]    - Source:", urlExtractionResult.article.sourceNameAr);
              console.log("[Email Agent]    - Attribution:", urlExtractionResult.article.attribution);
              
              // Replace email content with extracted article
              emailContent = `${urlExtractionResult.article.title}\n\n${urlExtractionResult.article.content}`;
              extractedFromUrl = true;
              
              // If extracted article has an image and we don't have any uploaded images
              if (urlExtractionResult.article.imageUrl && uploadedImages.length === 0) {
                console.log("[Email Agent] 🖼️ Using image from source article:", urlExtractionResult.article.imageUrl);
                uploadedImages.push(urlExtractionResult.article.imageUrl);
              }
            } else {
              console.log("[Email Agent] ⚠️ URL extraction failed:", urlExtractionResult.error);
              // Continue with original content if extraction fails
            }
          } catch (extractError: any) {
            console.error("[Email Agent] ❌ URL extraction error:", extractError.message);
            // Continue with original content if extraction fails
          }
        } else {
          console.log("[Email Agent] 📝 Email has additional content besides URL, processing as normal");
        }
      }
    }
    
    // Check if content is empty
    if (!emailContent || emailContent.length < 10) {
      console.log("[Email Agent] No content found after token removal");
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
      await storage.updateEmailWebhookLog(webhookLog.id, {
        status: "rejected",
        rejectionReason: "no_content",
        trustedSenderId: trustedSender.id,
        // Save all attachments even if rejected (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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

    // 🌐 FORCE ARABIC OUTPUT: Email Agent always publishes in Arabic
    // Regardless of source language or sender preference, translate/rewrite to Arabic for consistency
    const language = "ar" as const;
    
    // Detect language for logging only (with fallback to avoid blocking)
    let detectedLang = "ar";
    try {
      detectedLang = await detectLanguage(emailContent);
      console.log("[Email Agent] Detected language:", detectedLang);
    } catch (error) {
      console.warn("[Email Agent] Language detection failed, using fallback:", error);
    }
    
    console.log("[Email Agent] Target language (forced):", language);
    
    // 🎯 Fetch available categories for AI to choose from
    const allCategories = await storage.getAllCategories();
    const activeCategories = allCategories.filter(c => c.status === 'active');
    const categoriesForAI = activeCategories.map(c => ({ nameAr: c.nameAr, nameEn: c.nameEn }));
    
    console.log("[Email Agent] Fetched", categoriesForAI.length, "active categories for AI");
    console.log("[Email Agent] Analyzing and editing with Sabq editorial style...");
    const editorialResult = await analyzeAndEditWithSabqStyle(emailContent, language, categoriesForAI);
    
    console.log("[Email Agent] Quality score:", editorialResult.qualityScore);
    console.log("[Email Agent] Language:", editorialResult.language);
    console.log("[Email Agent] Category:", editorialResult.detectedCategory);
    console.log("[Email Agent] Has news value:", editorialResult.hasNewsValue);
    console.log("[Email Agent] Issues found:", editorialResult.issues.length);
    console.log("[Email Agent] Extracted from URL:", extractedFromUrl);

    // 🔗 Lower threshold for URL-extracted content from trusted sources (already vetted)
    const qualityThreshold = extractedFromUrl ? 10 : 30;
    console.log("[Email Agent] Quality threshold:", qualityThreshold, extractedFromUrl ? "(lower for trusted URL source)" : "");

    if (editorialResult.qualityScore < qualityThreshold) {
      console.log("[Email Agent] Content quality too low - rejected");
      console.log("[Email Agent] Rejection reasons:", editorialResult.issues);
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
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
        // Save all attachments even if rejected (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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
      
      // SECURITY: Upload pending images to PRIVATE for editorial review
      await uploadPendingImages(false);
      
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
        // Save all attachments even if rejected (for editorial review)
        attachmentsCount: allAttachmentsMetadata.length,
        attachmentsData: allAttachmentsMetadata
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

    // ✅ SUCCESSFUL VALIDATION - Upload pending images to PUBLIC
    console.log("[Email Agent] ========================================");
    console.log("[Email Agent] ✅ Validation successful - uploading images to PUBLIC");
    console.log("[Email Agent] 📸 Pending images count BEFORE upload:", pendingImageUploads.length);
    console.log("[Email Agent] 📸 Uploaded images count BEFORE upload:", uploadedImages.length);
    console.log("[Email Agent] ========================================");
    
    try {
      await uploadPendingImages(true);
      console.log("[Email Agent] ✅ Images uploaded successfully");
      console.log("[Email Agent] 📸 Uploaded images count AFTER upload:", uploadedImages.length);
      console.log("[Email Agent] 📸 Uploaded images URLs:", uploadedImages);
    } catch (uploadError) {
      console.error("[Email Agent] ❌ Error uploading images:", uploadError);
      throw uploadError; // Re-throw to trigger catch block
    }
    
    // 🎨 Select featured image from newly-uploaded images
    console.log("[Email Agent] 🎨 Selecting featured image from uploadedImages array...");
    console.log("[Email Agent] 🎨 uploadedImages[0]:", uploadedImages[0]);
    const featuredImage = uploadedImages[0] || null;
    
    if (featuredImage) {
      console.log("[Email Agent] 🎨 ✅ Featured image selected:", featuredImage);
    } else {
      console.log("[Email Agent] ℹ️ No featured image (uploadedImages array is empty)");
      console.log("[Email Agent] ℹ️ This could mean:");
      console.log("[Email Agent]    1. Email has no image attachments");
      console.log("[Email Agent]    2. Images failed to upload");
      console.log("[Email Agent]    3. pendingImageUploads was empty");
    }

    const articleTitle = editorialResult.optimized.title || subject.replace(/\[TOKEN:[A-F0-9]{64}\]/gi, '').trim();
    const articleSlug = generateSlug(articleTitle);

    // 🎯 Smart Category Matching System
    console.log("[Email Agent] 🎯 Starting smart category matching...");
    console.log("[Email Agent] AI detected category:", editorialResult.detectedCategory);
    
    // Note: allCategories and activeCategories already fetched above for AI
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

    console.log("[Email Agent] 📝 ========== PREPARING ARTICLE DATA ==========");
    console.log("[Email Agent] 📝 Featured image to be used:", featuredImage || "NULL - NO IMAGE");
    console.log("[Email Agent] 📝 Author ID (reporter):", reporterUser.id);
    console.log("[Email Agent] 📝 Category ID:", finalCategoryId);
    
    // 🔗 Prepare source info (for URL-extracted articles, include source attribution)
    const sourceInfo = extractedFromUrl && urlExtractionResult?.article ? {
      channel: "email",
      externalSource: urlExtractionResult.article.sourceNameAr,
      externalUrl: urlExtractionResult.article.sourceUrl,
      attribution: urlExtractionResult.article.attribution,
    } : {
      channel: "email",
    };
    
    const articleData: any = {
      id: nanoid(),
      title: articleTitle,
      slug: articleSlug,
      content: editorialResult.optimized.content,
      excerpt: editorialResult.optimized.lead || "",
      authorId: reporterUser.id, // 👤 Article attributed to the reporter, not system!
      status: trustedSender.autoPublish ? "published" : "draft",
      imageUrl: featuredImage, // 🖼️ Featured image URL (first uploaded image)
      seo: {
        keywords: editorialResult.optimized.seoKeywords,
      },
      categoryId: finalCategoryId, // 🎯 Always has a valid category!
      createdAt: new Date(),
      publishedAt: trustedSender.autoPublish ? new Date() : null,
      // 🔥 Essential fields for article visibility
      articleType: "news", // Ensures article appears in homepage queries
      newsType: "regular", // Default news type (not breaking/featured)
      hideFromHomepage: false, // Article must be visible on homepage
      displayOrder: Math.floor(Date.now() / 1000), // New articles appear at top (seconds for consistency)
      source: extractedFromUrl ? "url" : "email", // 📧 Mark source: email or url
      sourceInfo: sourceInfo, // 🔗 Additional source metadata (JSON)
    };

    let article: any;
    
    console.log("[Email Agent] 📝 Creating article...");
    console.log("[Email Agent]    - Language:", editorialResult.language);
    console.log("[Email Agent]    - Status:", articleData.status);
    console.log("[Email Agent]    - Auto-publish:", trustedSender.autoPublish);
    console.log("[Email Agent]    - Image URL in articleData:", articleData.imageUrl || "NULL");
    
    try {
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

      console.log("[Email Agent] ✅ Article created successfully:", article?.id);
      console.log("[Email Agent]    - Title:", articleData.title);
      console.log("[Email Agent]    - Status:", articleData.status);
      
      // 🖼️ Link ALL images to article (not just the featured image)
      const imageAttachments = allAttachmentsMetadata.filter(a => a.type === 'image');
      if (article && imageAttachments.length > 0) {
        console.log(`[Email Agent] 🖼️ Linking ${imageAttachments.length} images to article...`);
        
        for (let i = 0; i < imageAttachments.length; i++) {
          const img = imageAttachments[i];
          try {
            const titleWords = articleData.title.split(' ').slice(0, 8).join(' ');
            let altText = i === 0 
              ? `صورة ${titleWords}`
              : `${articleData.excerpt?.split(' ').slice(0, 5).join(' ') || titleWords} - صورة ${i + 1}`;
            
            if (altText.length > 125) {
              altText = altText.substring(0, 122) + "...";
            }
            
            await db.transaction(async (tx) => {
              const [mediaFile] = await tx.insert(mediaFiles).values({
                fileName: img.filename,
                originalName: img.filename,
                url: img.url,
                type: "image",
                mimeType: img.contentType,
                size: img.size,
                category: "articles",
                uploadedBy: reporterUser.id,
                title: `${titleWords} - صورة ${i + 1}`,
                keywords: ["email", "auto-upload"],
                altText: altText,
              }).returning();
              
              await tx.insert(articleMediaAssets).values({
                articleId: article.id,
                mediaFileId: mediaFile.id,
                locale: editorialResult.language || "ar",
                displayOrder: i,
                altText: altText,
                moderationStatus: "approved",
                sourceName: "Email Agent",
              });
              
              console.log(`[Email Agent] ✅ Linked image ${i + 1}/${imageAttachments.length}: ${img.filename}`);
            });
          } catch (linkError) {
            console.error(`[Email Agent] ⚠️ Failed to link image ${i + 1}:`, linkError);
          }
        }
        console.log(`[Email Agent] 🖼️ Finished linking ${imageAttachments.length} images`);
      }
      
      // 🔄 INVALIDATE HOMEPAGE CACHE - New article should appear immediately
      if (trustedSender.autoPublish && article) {
        console.log(`[Email Agent] 🗑️ Invalidating homepage cache for immediate article visibility...`);
        memoryCache.invalidatePattern('^homepage:');
        console.log(`[Email Agent] ✅ Homepage cache invalidated`);
      }
    } catch (createError) {
      console.error("[Email Agent] ❌ Error creating article:", createError);
      throw createError; // Re-throw to trigger catch block
    }

    // Broadcast notification to staff users about new published article
    if (trustedSender.autoPublish && article) {
      try {
        console.log("[Email Agent] 📢 Broadcasting notification to staff about published article...");
        
        // Determine notification language based on detected language
        const detectedLanguage = editorialResult.language;
        let notificationTitle: string;
        let notificationBody: string;
        
        if (detectedLanguage === "en") {
          notificationTitle = "New Article Published";
          notificationBody = `A new article has been published via email: ${articleData.title}`;
        } else if (detectedLanguage === "ur") {
          notificationTitle = "نیا مضمون شائع ہوا";
          notificationBody = `ای میل کے ذریعے نیا مضمون شائع کیا گیا: ${articleData.title}`;
        } else {
          // Default to Arabic
          notificationTitle = "مقال جديد";
          notificationBody = `تم نشر مقال جديد عبر البريد الإلكتروني: ${articleData.title}`;
        }
        
        await storage.broadcastNotificationToStaff({
          type: "article_published",
          title: notificationTitle,
          body: notificationBody,
          deeplink: `/articles/${articleData.slug}`,
          metadata: {
            articleId: article.id,
            articleSlug: articleData.slug,
            language: detectedLanguage,
            articleTitle: articleData.title,
            publishedAt: new Date().toISOString(),
            reporter: {
              userId: reporterUser.id,
              name: reporterUser.firstName && reporterUser.lastName 
                ? `${reporterUser.firstName} ${reporterUser.lastName}`
                : reporterUser.email,
            },
            imageUrl: articleData.imageUrl || allAttachmentsMetadata.find(a => a.type === 'image')?.url || null,
          }
        });
        
        console.log("[Email Agent] ✅ Staff notification sent successfully");
      } catch (notificationError) {
        // Log error but don't fail the entire operation
        console.error("[Email Agent] ⚠️ Failed to send staff notification:", notificationError);
        console.error("[Email Agent] ⚠️ Article was published successfully, but notification failed");
      }
    } else {
      console.log("[Email Agent] ℹ️ Skipping staff notification (auto-publish disabled or article not created)");
    }

    // Update webhook log with correct status and attachments data (already processed early)
    const webhookStatus = trustedSender.autoPublish ? "published" : "processed";
    await storage.updateEmailWebhookLog(webhookLog.id, {
      status: webhookStatus,
      trustedSenderId: trustedSender.id,
      articleId: article?.id,
      attachmentsCount: allAttachmentsMetadata.length,
      attachmentsData: allAttachmentsMetadata,
    });
    
    console.log("[Email Agent] 📊 Webhook log updated:");
    console.log("[Email Agent]    - Attachments saved:", allAttachmentsMetadata.length);
    console.log("[Email Agent]    - Images:", allAttachmentsMetadata.filter(a => a.type === 'image').length);
    console.log("[Email Agent]    - Word docs:", allAttachmentsMetadata.filter(a => a.type === 'document').length);
    console.log("[Email Agent]    - Other files:", allAttachmentsMetadata.filter(a => a.type === 'other').length);

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
    console.error("[Email Agent] ❌ Error processing webhook:", error);
    console.error("[Email Agent] ❌ Error stack:", error.stack);
    
    // Update webhook log to "failed" status (if it was created)
    if (webhookLog?.id) {
      try {
        await storage.updateEmailWebhookLog(webhookLog.id, {
          status: "failed",
          rejectionReason: "processing_error",
          aiAnalysis: {
            errors: [error.message],
            warnings: error.stack ? [error.stack.substring(0, 500)] : [], // First 500 chars of stack trace
          },
        });
        console.log("[Email Agent] ✅ Webhook log updated to 'failed' status");
      } catch (updateError) {
        console.error("[Email Agent] ⚠️ Failed to update webhook log status:", updateError);
      }
    } else {
      console.log("[Email Agent] ⚠️ Webhook log not created yet - error occurred during email parsing");
    }
    
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

// GET /api/email-agent/stats - Get email agent statistics (admin only)
router.get("/stats", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
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

// GET /api/email-agent/badge-stats - Get badge notification statistics (admin only)
router.get("/badge-stats", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    // Calculate today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all webhook logs for today using date range query
    const todayLogs = await storage.getEmailWebhookLogsByDateRange(today, tomorrow);
    
    // Calculate badge stats
    const newMessages = todayLogs.filter((log: any) => log.status === 'received').length;
    const publishedToday = todayLogs.filter((log: any) => log.status === 'published').length;
    const rejectedToday = todayLogs.filter((log: any) => log.status === 'rejected').length;
    
    return res.json({
      newMessages,
      publishedToday,
      rejectedToday,
    });
  } catch (error: any) {
    console.error('[Email Badge Stats] Error:', error);
    return res.status(500).json({ message: 'فشل في تحميل إحصائيات البادج' });
  }
});

// GET /api/email-agent/logs - Get email webhook logs with pagination (admin only)
router.get("/logs", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;
    
    // Build filters with pagination
    const filters: { status?: string; trustedSenderId?: string; limit?: number; offset?: number } = {
      limit,
      offset,
    };
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    // Get logs with filters (returns { logs, total })
    const result = await storage.getEmailWebhookLogs(filters);
    
    return res.json({
      logs: result.logs,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error: any) {
    console.error("[Email Agent] Error fetching logs:", error);
    return res.status(500).json({
      message: "Failed to fetch email logs",
      error: error.message,
    });
  }
});

// GET /api/email-agent/logs/:id - Get a specific webhook log (admin only)
router.get("/logs/:id", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    const result = await storage.getEmailWebhookLogs();
    const log = result.logs.find((l: any) => l.id === req.params.id);
    
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    
    return res.json(log);
  } catch (error: any) {
    console.error("[Email Agent] Error fetching log:", error);
    return res.status(500).json({
      message: "Failed to fetch log",
      error: error.message,
    });
  }
});

// DELETE /api/email-agent/logs/:id - Delete a webhook log (admin only)
router.delete("/logs/:id", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    await storage.deleteEmailWebhookLog(req.params.id);
    return res.json({ message: "Log deleted successfully" });
  } catch (error: any) {
    console.error("[Email Agent] Error deleting log:", error);
    return res.status(500).json({
      message: "Failed to delete log",
      error: error.message,
    });
  }
});

// GET /api/email-agent/senders - Get all trusted senders (admin only)
router.get("/senders", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
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

// GET /api/email-agent/senders/:id - Get a specific trusted sender (admin only)
router.get("/senders/:id", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
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

// POST /api/email-agent/senders - Create a new trusted sender (admin only)
router.post("/senders", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
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

// PUT /api/email-agent/senders/:id - Update a trusted sender (admin only)
router.put("/senders/:id", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
    console.log("[Email Agent] PUT /senders/:id - Received update request");
    console.log("[Email Agent] Sender ID:", req.params.id);
    console.log("[Email Agent] Update data:", JSON.stringify(req.body));
    const sender = await storage.updateTrustedSender(req.params.id, req.body);
    console.log("[Email Agent] Updated sender status:", sender.status);
    return res.json(sender);
  } catch (error: any) {
    console.error("[Email Agent] Error updating sender:", error);
    return res.status(500).json({
      message: "Failed to update trusted sender",
      error: error.message,
    });
  }
});

// DELETE /api/email-agent/senders/:id - Delete a trusted sender (admin only)
router.delete("/senders/:id", isAuthenticated, requirePermission('admin.manage_settings'), async (req: Request, res: Response) => {
  try {
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

// 🔍 Diagnostic endpoint - Test if webhooks can reach the server (development only)
router.post("/webhook-test", async (req: Request, res: Response) => {
  // Only allow in development environment to prevent abuse in production
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_WEBHOOK_TEST) {
    return res.status(404).json({ error: "Not found" });
  }
  
  console.log("🔍 [WEBHOOK TEST] ==================== START ====================");
  console.log("🔍 [WEBHOOK TEST] Received request!");
  console.log("🔍 [WEBHOOK TEST] Method:", req.method);
  console.log("🔍 [WEBHOOK TEST] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("🔍 [WEBHOOK TEST] Body keys:", Object.keys(req.body));
  console.log("🔍 [WEBHOOK TEST] Body:", JSON.stringify(req.body, null, 2).substring(0, 500));
  console.log("🔍 [WEBHOOK TEST] ==================== END ====================");
  
  res.status(200).json({
    success: true,
    message: "Webhook test received successfully!",
    timestamp: new Date().toISOString(),
    bodyKeys: Object.keys(req.body),
    hasEmail: !!req.body.email,
    hasFrom: !!req.body.from,
    hasSubject: !!req.body.subject,
  });
});

export default router;
