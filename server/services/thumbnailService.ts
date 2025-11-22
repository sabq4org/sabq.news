/**
 * Thumbnail Generation Service
 * يقوم بإنشاء صور مصغرة بنسبة 16:9 للأخبار
 */

import sharp from 'sharp';
import { storage } from '../storage';
import { db } from '../db';
import { articles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import path from 'path';

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
  width: 640,  // عرض افتراضي للصورة المصغرة
  height: 360, // ارتفاع لنسبة 16:9
  quality: 85,
  format: 'jpeg'
};

/**
 * Convert relative paths to absolute URLs
 */
function normalizeImageUrl(url: string): string {
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path starting with /, convert to absolute URL
  if (url.startsWith('/')) {
    // Use FRONTEND_URL or REPLIT_DEV_DOMAIN for Replit environment
    // Fallback to localhost for local development
    let baseUrl = 'http://localhost:5000';
    
    if (process.env.FRONTEND_URL) {
      baseUrl = process.env.FRONTEND_URL;
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else if (process.env.NODE_ENV === 'production' && process.env.DOMAIN) {
      baseUrl = `https://${process.env.DOMAIN}`;
    }
    
    return `${baseUrl}${url}`;
  }
  
  // If it's a gs:// URL, we can't fetch it directly - it should have been converted already
  if (url.startsWith('gs://')) {
    throw new Error('gs:// URLs must be converted to public URLs before thumbnail generation');
  }
  
  return url;
}

/**
 * Validate URL for security (prevent SSRF)
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Allow only HTTPS and HTTP protocols
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return false;
    }
    
    // Build list of trusted domains dynamically
    const trustedDomains = [
      'storage.googleapis.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'replit.dev', // Replit domains
      'repl.co',
    ];
    
    // Add configured domains
    if (process.env.DOMAIN) {
      trustedDomains.push(process.env.DOMAIN);
    }
    if (process.env.REPLIT_DEV_DOMAIN) {
      trustedDomains.push(process.env.REPLIT_DEV_DOMAIN);
    }
    
    // Add additional trusted domains
    trustedDomains.push('sabq.life', 'sabq.news');
    
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check if hostname is in trusted domains or is a subdomain
    const isTrusted = trustedDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isTrusted) {
      console.warn(`[Thumbnail Service] Untrusted domain: ${hostname}`);
    }
    
    return isTrusted;
  } catch {
    return false;
  }
}

/**
 * Generate thumbnail from image URL
 * يقوم بتوليد صورة مصغرة من رابط الصورة
 */
export async function generateThumbnail(
  imageUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Normalize URL (convert relative paths to absolute URLs)
  const normalizedUrl = normalizeImageUrl(imageUrl);
  console.log(`[Thumbnail Service] Original URL: ${imageUrl}`);
  console.log(`[Thumbnail Service] Normalized URL: ${normalizedUrl}`);
  
  // Validate URL for security
  if (!isValidImageUrl(normalizedUrl)) {
    throw new Error('Invalid or untrusted image URL');
  }
  
  try {
    console.log(`[Thumbnail Service] Generating thumbnail for: ${normalizedUrl}`);
    
    // Download the image with timeout and size limits
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Sabq-Thumbnail-Service/1.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid content type: must be an image');
    }
    
    // Check content length (max 10MB)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('Image too large: maximum size is 10MB');
    }
    
    const buffer = await response.buffer();
    
    // Additional size check after download
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('Image too large: maximum size is 10MB');
    }
    
    // Process image with sharp to create thumbnail
    const thumbnail = await sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .toFormat(config.format as keyof sharp.FormatEnum, { quality: config.quality })
      .toBuffer();
    
    // Generate unique filename for thumbnail
    const timestamp = Date.now();
    const filename = `thumbnail_${timestamp}_${config.width}x${config.height}.${config.format}`;
    
    // Upload to storage (assuming GCS is configured)
    const thumbnailUrl = await uploadThumbnailToStorage(thumbnail, filename);
    
    console.log(`[Thumbnail Service] Thumbnail generated successfully: ${thumbnailUrl}`);
    return thumbnailUrl;
    
  } catch (error: any) {
    console.error('[Thumbnail Service] Error generating thumbnail:', error);
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}

/**
 * Upload thumbnail to storage service
 */
async function uploadThumbnailToStorage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // Check if using Google Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      // Fallback to local storage for development
      return await saveToLocalStorage(buffer, filename);
    }
    
    // Upload to GCS
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`thumbnails/${filename}`);
    
    await file.save(buffer, {
      metadata: {
        contentType: `image/${filename.split('.').pop()}`,
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Return public URL
    return `https://storage.googleapis.com/${bucketName}/thumbnails/${filename}`;
    
  } catch (error: any) {
    console.error('[Thumbnail Service] Storage upload failed:', error);
    throw error;
  }
}

/**
 * Save thumbnail to local storage (for development)
 */
async function saveToLocalStorage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const fs = await import('fs/promises');
  const uploadDir = path.join(process.cwd(), 'uploads', 'thumbnails');
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Save file
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  
  // Return local URL
  return `/uploads/thumbnails/${filename}`;
}

/**
 * Generate and save thumbnail for article
 * يقوم بتوليد وحفظ الصورة المصغرة للمقال
 */
export async function generateArticleThumbnail(
  articleId: string,
  imageUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  try {
    // Generate thumbnail
    const thumbnailUrl = await generateThumbnail(imageUrl, options);
    
    // Update article with thumbnail URL
    await db
      .update(articles)
      .set({ thumbnailUrl })
      .where(eq(articles.id, articleId));
    
    console.log(`[Thumbnail Service] Article ${articleId} thumbnail updated`);
    return thumbnailUrl;
    
  } catch (error: any) {
    console.error(`[Thumbnail Service] Failed to generate article thumbnail:`, error);
    throw error;
  }
}

/**
 * Batch generate thumbnails for articles without them
 */
export async function generateMissingThumbnails(limit: number = 10): Promise<void> {
  try {
    // Use SQL to filter articles that need thumbnails directly in the database
    // This avoids loading all articles into memory
    const { and, isNotNull, isNull, sql } = await import('drizzle-orm');
    
    // Find articles with images but no thumbnails, limited to batch size
    const articlesNeedingThumbnails = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          isNotNull(articles.imageUrl),
          isNull(articles.thumbnailUrl)
        )
      )
      .limit(limit);
    
    console.log(`[Thumbnail Service] Processing batch of ${articlesNeedingThumbnails.length} articles needing thumbnails`);
    
    // Process thumbnails in parallel with concurrency limit
    const pLimit = (await import('p-limit')).default;
    const concurrencyLimit = pLimit(3); // Process 3 at a time
    
    const promises = articlesNeedingThumbnails.map(article => 
      concurrencyLimit(async () => {
        if (article.imageUrl) {
          try {
            await generateArticleThumbnail(article.id, article.imageUrl);
            console.log(`[Thumbnail Service] Generated thumbnail for article: ${article.id}`);
          } catch (error) {
            console.error(`[Thumbnail Service] Failed for article ${article.id}:`, error);
          }
        }
      })
    );
    
    await Promise.all(promises);
    
    console.log('[Thumbnail Service] Batch thumbnail generation completed');
    
    // Check if there are more articles to process
    const remainingCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          isNotNull(articles.imageUrl),
          isNull(articles.thumbnailUrl)
        )
      );
    
    if (remainingCount[0]?.count > 0) {
      console.log(`[Thumbnail Service] ${remainingCount[0].count} articles still need thumbnails`);
    }
    
  } catch (error: any) {
    console.error('[Thumbnail Service] Batch generation failed:', error);
  }
}

/**
 * Generate optimized thumbnails for different sizes
 * يقوم بإنشاء صور مصغرة محسنة لأحجام مختلفة
 */
export async function generateResponsiveThumbnails(
  imageUrl: string,
  articleId?: string
): Promise<{
  small: string;   // 320x180
  medium: string;  // 640x360
  large: string;   // 1280x720
}> {
  const sizes = {
    small: { width: 320, height: 180 },
    medium: { width: 640, height: 360 },
    large: { width: 1280, height: 720 }
  };
  
  const thumbnails: any = {};
  
  for (const [size, dimensions] of Object.entries(sizes)) {
    try {
      thumbnails[size] = await generateThumbnail(imageUrl, dimensions);
    } catch (error) {
      console.error(`[Thumbnail Service] Failed to generate ${size} thumbnail:`, error);
      thumbnails[size] = imageUrl; // Fallback to original
    }
  }
  
  // If articleId provided, save the medium size as default
  if (articleId) {
    await db
      .update(articles)
      .set({ thumbnailUrl: thumbnails.medium })
      .where(eq(articles.id, articleId));
  }
  
  return thumbnails;
}