/**
 * Sabq Data Import Script
 * Imports news data from Quintype CMS format into Sabq Platform
 * 
 * Usage: npx tsx server/scripts/import-sabq-data.ts [options]
 * Options:
 *   --file=<path>     Path to gzipped or plain JSON lines file
 *   --limit=<n>       Limit number of articles to import (default: 10)
 *   --dry-run         Preview import without writing to database
 *   --skip-images     Skip image processing
 */

import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';
import { db } from '../db';
import { articles, categories, users, articleTags, tags } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Configuration
const CONFIG = {
  defaultAuthorId: '', // Will be set from DB
  imageBaseUrl: 'https://images.sabq.org/', // Sabq CDN base URL
  batchSize: 50,
};

// Section to Category mapping
const SECTION_MAPPING: Record<string, { nameAr: string; nameEn: string; color: string }> = {
  'saudia': { nameAr: 'محليات', nameEn: 'Local', color: '#dc2626' },
  'stations': { nameAr: 'محطات', nameEn: 'Stations', color: '#9333ea' },
  'mylife': { nameAr: 'حياتنا', nameEn: 'Lifestyle', color: '#ec4899' },
  'technology': { nameAr: 'تقنية', nameEn: 'Technology', color: '#3b82f6' },
  'business': { nameAr: 'أعمال', nameEn: 'Business', color: '#16a34a' },
  'world': { nameAr: 'العالم', nameEn: 'World', color: '#0891b2' },
  'tourism': { nameAr: 'سياحة', nameEn: 'Tourism', color: '#f59e0b' },
  'articles': { nameAr: 'مقالات', nameEn: 'Articles', color: '#8b5cf6' },
  'regions': { nameAr: 'مناطق', nameEn: 'Regions', color: '#84cc16' },
  'culture': { nameAr: 'ثقافة', nameEn: 'Culture', color: '#d946ef' },
  'community': { nameAr: 'مجتمع', nameEn: 'Community', color: '#f97316' },
  'sports': { nameAr: 'رياضة', nameEn: 'Sports', color: '#22c55e' },
  'careers': { nameAr: 'وظائف', nameEn: 'Careers', color: '#6366f1' },
  'cars': { nameAr: 'سيارات', nameEn: 'Cars', color: '#ef4444' },
};

// Quintype data interfaces
interface QuintypeSection {
  id: number;
  slug: string;
  name: string;
  'external-id': string;
}

interface QuintypeAuthor {
  id: number;
  email: string;
  name: string;
  username: string;
  'external-id': string;
}

interface QuintypeTag {
  id: number;
  name: string;
  'meta-description': string | null;
  'tag-type': string;
}

interface QuintypeStoryElement {
  type: 'text' | 'image' | 'youtube-video' | 'jsembed' | 'composite' | 'title' | 'file';
  subtype?: string;
  text?: string;
  'image-s3-key'?: string;
  'image-metadata'?: {
    width: number;
    height: number;
    'mime-type': string;
    'file-size': number;
    'file-name': string;
  };
  'alt-text'?: string;
  title?: string;
  url?: string;
  'embed-js'?: string;
  description?: string;
  id: string;
  'family-id': string;
}

interface QuintypeCard {
  'story-elements': QuintypeStoryElement[];
  'card-updated-at': number;
  id: string;
}

interface QuintypeStory {
  id: string;
  headline: string;
  subheadline?: string;
  slug: string;
  'published-at': number;
  'first-published-at': number;
  'last-published-at': number;
  'updated-at': number;
  'created-at': number;
  status: string;
  'story-template': string;
  'word-count': number;
  'read-time': number;
  seo?: {
    'meta-title'?: string;
    'meta-description'?: string;
  };
  'hero-image-s3-key'?: string;
  'hero-image-metadata'?: {
    width: number;
    height: number;
  };
  'hero-image-alt-text'?: string;
  'hero-image-caption'?: string;
  'hero-image-attribution'?: string;
  sections?: QuintypeSection[];
  'author-id': number;
  'author-name': string;
  authors?: QuintypeAuthor[];
  tags?: QuintypeTag[];
  cards?: QuintypeCard[];
  summary?: string;
  'canonical-url'?: string;
}

// Stats tracking
const stats = {
  total: 0,
  imported: 0,
  skipped: 0,
  errors: 0,
  categoriesCreated: 0,
  tagsCreated: 0,
};

/**
 * Convert Quintype S3 key to accessible URL
 */
function convertImageUrl(s3Key: string | undefined): string | null {
  if (!s3Key) return null;
  // Use Sabq's CDN URL pattern
  return `${CONFIG.imageBaseUrl}${s3Key}`;
}

/**
 * Convert story elements to HTML content
 */
function convertCardsToHtml(cards: QuintypeCard[] | undefined): string {
  if (!cards || cards.length === 0) return '';
  
  let html = '';
  
  for (const card of cards) {
    if (!card['story-elements']) continue;
    
    for (const element of card['story-elements']) {
      switch (element.type) {
        case 'text':
          if (element.text) {
            html += element.text;
          }
          break;
          
        case 'image':
          if (element['image-s3-key']) {
            const imageUrl = convertImageUrl(element['image-s3-key']);
            const alt = element['alt-text'] || element.title || '';
            html += `<figure class="article-image"><img src="${imageUrl}" alt="${alt}" loading="lazy" /></figure>`;
          }
          break;
          
        case 'youtube-video':
          if (element.url) {
            html += `<div class="video-embed youtube-embed" data-url="${element.url}"><iframe src="${element.url}" frameborder="0" allowfullscreen></iframe></div>`;
          }
          break;
          
        case 'jsembed':
          if (element.subtype === 'tweet' && element['embed-js']) {
            html += `<div class="social-embed tweet-embed">${element['embed-js']}</div>`;
          } else if (element.subtype === 'instagram' && element['embed-js']) {
            html += `<div class="social-embed instagram-embed">${element['embed-js']}</div>`;
          }
          break;
          
        case 'title':
          if (element.text) {
            html += `<h2>${element.text}</h2>`;
          }
          break;
          
        case 'composite':
          if (element.subtype === 'image-gallery') {
            html += `<div class="image-gallery"><!-- Gallery placeholder --></div>`;
          }
          break;
      }
    }
  }
  
  return html;
}

/**
 * Map story template to article type
 */
function mapArticleType(template: string): string {
  switch (template) {
    case 'articles':
      return 'opinion';
    case 'video':
      return 'news';
    default:
      return 'news';
  }
}

/**
 * Convert Unix milliseconds to Date
 */
function convertTimestamp(ts: number | undefined): Date | null {
  if (!ts) return null;
  return new Date(ts);
}

/**
 * Ensure unique slug
 */
async function ensureUniqueSlug(baseSlug: string, id: string): Promise<string> {
  const existing = await db.select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, baseSlug))
    .limit(1);
  
  if (existing.length === 0 || existing[0].id === id) {
    return baseSlug;
  }
  
  // Add suffix to make unique
  return `${baseSlug}-${id.substring(0, 8)}`;
}

/**
 * Get or create category from section
 */
async function getOrCreateCategory(section: QuintypeSection): Promise<string> {
  const mapping = SECTION_MAPPING[section.slug] || {
    nameAr: section.name,
    nameEn: section.slug,
    color: '#6b7280'
  };
  
  // Check if category exists by slug
  const existing = await db.select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, section.slug))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new category
  const [newCategory] = await db.insert(categories)
    .values({
      nameAr: mapping.nameAr,
      nameEn: mapping.nameEn,
      slug: section.slug,
      color: mapping.color,
      status: 'active',
      displayOrder: 0,
    })
    .returning({ id: categories.id });
  
  stats.categoriesCreated++;
  console.log(`  Created category: ${mapping.nameAr} (${section.slug})`);
  
  return newCategory.id;
}

/**
 * Get or create tag
 */
async function getOrCreateTag(qtTag: QuintypeTag): Promise<string> {
  // Check if tag exists by name
  const existing = await db.select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, qtTag.name))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new tag
  const [newTag] = await db.insert(tags)
    .values({
      name: qtTag.name,
      slug: qtTag.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, ''),
    })
    .returning({ id: tags.id });
  
  stats.tagsCreated++;
  
  return newTag.id;
}

/**
 * Get default author ID
 */
async function getDefaultAuthorId(): Promise<string> {
  const [adminUser] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);
  
  if (adminUser) {
    return adminUser.id;
  }
  
  // Create system import user if needed
  const [systemUser] = await db.insert(users)
    .values({
      username: 'system_import',
      email: 'import@sabq.org',
      password: 'not-for-login',
      role: 'journalist',
      displayName: 'سبق',
    })
    .returning({ id: users.id });
  
  return systemUser.id;
}

/**
 * Import a single story
 */
async function importStory(story: QuintypeStory, authorId: string, dryRun: boolean): Promise<boolean> {
  try {
    // Skip if already exists
    const existing = await db.select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, story.id))
      .limit(1);
    
    if (existing.length > 0) {
      console.log(`  Skipping existing: ${story.headline.substring(0, 50)}...`);
      stats.skipped++;
      return false;
    }
    
    // Get category
    let categoryId: string | null = null;
    if (story.sections && story.sections.length > 0) {
      categoryId = await getOrCreateCategory(story.sections[0]);
    }
    
    // Convert content
    const content = convertCardsToHtml(story.cards);
    
    // Ensure unique slug
    const slug = await ensureUniqueSlug(story.slug, story.id);
    
    // Prepare article data
    const articleData = {
      id: story.id,
      title: story.headline,
      subtitle: story.subheadline || null,
      slug,
      content: content || '<p></p>',
      excerpt: story.seo?.['meta-description'] || story.summary || null,
      imageUrl: convertImageUrl(story['hero-image-s3-key']),
      categoryId,
      authorId,
      articleType: mapArticleType(story['story-template']),
      newsType: 'regular' as const,
      publishType: 'instant' as const,
      status: 'published',
      views: 0,
      isFeatured: false,
      source: 'manual' as const,
      sourceMetadata: {
        type: 'manual' as const,
        originalMessage: `Imported from Quintype - Original ID: ${story.id}`,
      },
      seo: story.seo ? {
        metaTitle: story.seo['meta-title'],
        metaDescription: story.seo['meta-description'],
        imageAltText: story['hero-image-alt-text'] || undefined,
      } : null,
      publishedAt: convertTimestamp(story['published-at']),
      createdAt: convertTimestamp(story['created-at']) || new Date(),
      updatedAt: convertTimestamp(story['updated-at']) || new Date(),
    };
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would import: ${story.headline.substring(0, 50)}...`);
      stats.imported++;
      return true;
    }
    
    // Insert article
    await db.insert(articles).values(articleData);
    
    // Insert tags
    if (story.tags && story.tags.length > 0) {
      for (const qtTag of story.tags.slice(0, 10)) { // Limit to 10 tags
        const tagId = await getOrCreateTag(qtTag);
        await db.insert(articleTags)
          .values({
            articleId: story.id,
            tagId,
          })
          .onConflictDoNothing();
      }
    }
    
    console.log(`  Imported: ${story.headline.substring(0, 50)}...`);
    stats.imported++;
    return true;
    
  } catch (error: any) {
    console.error(`  Error importing ${story.id}: ${error.message}`);
    stats.errors++;
    return false;
  }
}

/**
 * Read and parse the data file
 */
async function readDataFile(filePath: string): Promise<QuintypeStory[]> {
  const stories: QuintypeStory[] = [];
  
  const isGzipped = filePath.endsWith('.gz');
  let stream: NodeJS.ReadableStream = createReadStream(filePath);
  
  if (isGzipped) {
    stream = stream.pipe(createGunzip());
  }
  
  const rl = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  
  for await (const line of rl) {
    if (line.trim()) {
      try {
        stories.push(JSON.parse(line));
      } catch (e) {
        console.warn('Skipping invalid JSON line');
      }
    }
  }
  
  return stories;
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Sabq Data Import Tool');
  console.log('='.repeat(60));
  
  // Parse arguments
  const args = process.argv.slice(2);
  const options = {
    file: args.find(a => a.startsWith('--file='))?.split('=')[1] || '/tmp/sabq_sample.txt',
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10'),
    dryRun: args.includes('--dry-run'),
    skipImages: args.includes('--skip-images'),
  };
  
  console.log(`\nOptions:`);
  console.log(`  File: ${options.file}`);
  console.log(`  Limit: ${options.limit}`);
  console.log(`  Dry Run: ${options.dryRun}`);
  console.log(`  Skip Images: ${options.skipImages}`);
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made to database\n');
  }
  
  try {
    // Get default author
    CONFIG.defaultAuthorId = await getDefaultAuthorId();
    console.log(`\nUsing author ID: ${CONFIG.defaultAuthorId}`);
    
    // Read data file
    console.log(`\nReading data file...`);
    const allStories = await readDataFile(options.file);
    console.log(`Found ${allStories.length} stories`);
    
    // Apply limit
    const stories = allStories.slice(0, options.limit);
    stats.total = stories.length;
    
    console.log(`\nImporting ${stories.length} stories...\n`);
    
    // Import stories
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      console.log(`[${i + 1}/${stories.length}]`);
      await importStory(story, CONFIG.defaultAuthorId, options.dryRun);
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`Total processed: ${stats.total}`);
    console.log(`Imported: ${stats.imported}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Categories created: ${stats.categoriesCreated}`);
    console.log(`Tags created: ${stats.tagsCreated}`);
    
    if (options.dryRun) {
      console.log('\n✓ Dry run completed - no changes made');
    } else {
      console.log('\n✓ Import completed successfully');
    }
    
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run
main().catch(console.error);
