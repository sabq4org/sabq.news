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
 * Generate thumbnail from image URL
 * يقوم بتوليد صورة مصغرة من رابط الصورة
 */
export async function generateThumbnail(
  imageUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    console.log(`[Thumbnail Service] Generating thumbnail for: ${imageUrl}`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    
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
export async function generateMissingThumbnails(): Promise<void> {
  try {
    // Find articles with images but no thumbnails
    const articlesNeedingThumbnails = await db
      .select()
      .from(articles)
      .where(
        eq(articles.status, 'published')
      );
    
    const missingThumbnails = articlesNeedingThumbnails.filter(
      article => article.imageUrl && !article.thumbnailUrl
    );
    
    console.log(`[Thumbnail Service] Found ${missingThumbnails.length} articles needing thumbnails`);
    
    // Generate thumbnails in batches
    for (const article of missingThumbnails) {
      if (article.imageUrl) {
        try {
          await generateArticleThumbnail(article.id, article.imageUrl);
          console.log(`[Thumbnail Service] Generated thumbnail for article: ${article.id}`);
        } catch (error) {
          console.error(`[Thumbnail Service] Failed for article ${article.id}:`, error);
        }
      }
    }
    
    console.log('[Thumbnail Service] Batch thumbnail generation completed');
    
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