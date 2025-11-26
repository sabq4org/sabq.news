import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { articles, categories, users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Social Media Crawler Middleware
 * 
 * Detects crawlers from WhatsApp, Facebook, Twitter, etc. and serves
 * static HTML with proper Open Graph meta tags for proper link previews.
 * 
 * This solves the SPA problem where meta tags are generated client-side
 * but crawlers need them server-side.
 */

// User agents for social media crawlers
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',      // Facebook
  'WhatsApp',                 // WhatsApp
  'Twitterbot',               // Twitter
  'TelegramBot',              // Telegram
  'LinkedInBot',              // LinkedIn
  'Slackbot',                 // Slack
  'Discordbot',               // Discord
  'SkypeUriPreview',          // Skype
  'vkShare',                  // VK
  'pinterest',                // Pinterest
  'bot.html',                 // Generic bot detector
];

/**
 * Checks if the request is from a social media crawler
 */
function isCrawler(req: Request): boolean {
  const userAgent = req.headers['user-agent'] || '';
  return CRAWLER_USER_AGENTS.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates static HTML with Open Graph meta tags for an article
 */
function generateArticleHTML(article: any, baseUrl: string): string {
  // Extract SEO data from article.seo JSON field or fallback to article fields
  const seoData = article.seo || {};
  const seoTitle = seoData.title || article.title || 'خبر من سبق';
  // Support both camelCase and snake_case for aiSummary
  const seoDescription = seoData.description || article.excerpt || article.aiSummary || article.ai_summary || 'اقرأ المزيد';
  // Support both camelCase and snake_case for imageUrl
  const seoImage = article.imageUrl || article.image_url || `${baseUrl}/icon.png`;
  const articleUrl = `${baseUrl}/article/${article.slug}`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeArticleUrl = escapeHtml(articleUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeArticleUrl,
    image: safeSeoImage,
    type: 'article',
    baseUrl,
    publishedTime: article.published_at ? new Date(article.published_at).toISOString() : undefined,
    modifiedTime: article.updated_at ? new Date(article.updated_at).toISOString() : undefined,
    twitterSite: '@sabq',
  });
}

/**
 * Generates static HTML with Open Graph meta tags for a category
 */
function generateCategoryHTML(category: any, baseUrl: string): string {
  const seoTitle = `${category.nameAr} - صحيفة سبق الإلكترونية`;
  const seoDescription = category.description || `أخبار ${category.nameAr} على مدار الساعة من صحيفة سبق الإلكترونية`;
  // Support both camelCase and snake_case for heroImageUrl
  const seoImage = category.heroImageUrl || category.hero_image_url || `${baseUrl}/icon.png`;
  const categoryUrl = `${baseUrl}/category/${category.slug}`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeCategoryUrl = escapeHtml(categoryUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeCategoryUrl,
    image: safeSeoImage,
    type: 'website',
    baseUrl,
    twitterSite: '@sabq',
  });
}

/**
 * Generates static HTML with Open Graph meta tags for a reporter/user profile
 */
function generateReporterHTML(user: any, baseUrl: string): string {
  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;
  const seoTitle = `${fullName} - مراسل صحيفة سبق الإلكترونية`;
  const seoDescription = user.bio || `تابع أخبار ${fullName} على صحيفة سبق الإلكترونية`;
  // Support both camelCase and snake_case for profileImageUrl
  const seoImage = user.profileImageUrl || user.profile_image_url || `${baseUrl}/icon.png`;
  const reporterUrl = `${baseUrl}/reporter/${user.id}`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeReporterUrl = escapeHtml(reporterUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeReporterUrl,
    image: safeSeoImage,
    type: 'profile',
    baseUrl,
    twitterSite: '@sabq',
  });
}

/**
 * Generates static HTML with Open Graph meta tags for a writer/muqtarab profile
 */
function generateWriterHTML(user: any, baseUrl: string): string {
  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;
  const seoTitle = `${fullName} - كاتب رأي في صحيفة سبق الإلكترونية`;
  const seoDescription = user.bio || `تابع مقالات ${fullName} على صحيفة سبق الإلكترونية`;
  // Support both camelCase and snake_case for profileImageUrl
  const seoImage = user.profileImageUrl || user.profile_image_url || `${baseUrl}/icon.png`;
  const writerUrl = `${baseUrl}/muqtarab/${user.id}`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeWriterUrl = escapeHtml(writerUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeWriterUrl,
    image: safeSeoImage,
    type: 'profile',
    baseUrl,
    twitterSite: '@sabq',
  });
}

/**
 * Generates static HTML with Open Graph meta tags for Deep Analysis (Omq)
 */
function generateOmqHTML(article: any, baseUrl: string): string {
  const seoTitle = article.title ? `${article.title} - عُمق` : 'تحليل عميق - عُمق';
  // Support both camelCase and snake_case for aiSummary
  const seoDescription = article.excerpt || article.aiSummary || article.ai_summary || 'تحليل عميق متعدد النماذج من آي فوكس';
  // Support both camelCase and snake_case for imageUrl
  const seoImage = article.imageUrl || article.image_url || `${baseUrl}/icon.png`;
  const omqUrl = `${baseUrl}/ai/omq/${article.id}`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeOmqUrl = escapeHtml(omqUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeOmqUrl,
    image: safeSeoImage,
    type: 'article',
    baseUrl,
    publishedTime: article.published_at ? new Date(article.published_at).toISOString() : undefined,
    twitterSite: '@sabq',
  });
}

/**
 * Generates static HTML with Open Graph meta tags for iFox AI Homepage
 */
function generateIFoxHTML(baseUrl: string): string {
  const seoTitle = 'آي فوكس - بوابة الذكاء الاصطناعي | صحيفة سبق';
  const seoDescription = 'اكتشف مستقبل الأخبار مع آي فوكس - بوابة الذكاء الاصطناعي المتطورة التي تقدم تحليلات عميقة ومحتوى مخصص بتقنيات الذكاء الاصطناعي';
  const seoImage = `${baseUrl}/icon.png`;
  const ifoxUrl = `${baseUrl}/ai/ifox`;
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  const safeSeoImage = escapeHtml(seoImage);
  const safeIfoxUrl = escapeHtml(ifoxUrl);
  
  return generateMetaHTML({
    title: safeSeoTitle,
    description: safeSeoDescription,
    url: safeIfoxUrl,
    image: safeSeoImage,
    type: 'website',
    baseUrl,
    twitterSite: '@sabq',
  });
}

/**
 * Generic function to generate meta HTML with Open Graph tags
 */
interface MetaHTMLOptions {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  baseUrl: string;
  publishedTime?: string;
  modifiedTime?: string;
  twitterSite?: string;
  twitterCreator?: string;
}

function generateMetaHTML(options: MetaHTMLOptions): string {
  const { title, description, url, image, type, baseUrl, publishedTime, modifiedTime, twitterSite, twitterCreator } = options;
  
  // Note: title, description, url, and image are already escaped by the calling functions
  // We use them directly without double-escaping
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:site_name" content="صحيفة سبق الإلكترونية">
  <meta property="og:locale" content="ar_SA">
  ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ''}
  ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}">` : ''}
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  ${twitterSite ? `<meta name="twitter:site" content="${escapeHtml(twitterSite)}">` : ''}
  ${twitterCreator ? `<meta name="twitter:creator" content="${escapeHtml(twitterCreator)}">` : ''}
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${title}">
</head>
<body style="font-family: 'Tajawal', Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background: #f5f5f5;">
  <h1 style="color: #333; font-size: 24px; margin-bottom: 12px;">${title}</h1>
  <p style="color: #666; font-size: 16px; line-height: 1.6;">${description}</p>
  <a href="${url}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">اقرأ المزيد</a>
</body>
</html>`;
}

/**
 * Middleware to handle social media crawlers
 */
export async function socialCrawlerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip API routes and static assets - they should handle their own responses
  if (req.path.startsWith('/api/') || req.path.startsWith('/src/') || req.path.startsWith('/@fs/') || req.path.startsWith('/assets/')) {
    return next();
  }
  
  // Only process if it's a crawler
  if (!isCrawler(req)) {
    return next();
  }

  console.log(`[SocialCrawler] Detected crawler: ${req.headers['user-agent']}`);
  console.log(`[SocialCrawler] Path: ${req.path}`);
  
  // Normalize path: decode URI components and remove trailing slash
  let normalizedPath = req.path;
  try {
    normalizedPath = decodeURIComponent(req.path);
  } catch (e) {
    console.warn(`[SocialCrawler] Failed to decode path: ${req.path}`);
  }
  normalizedPath = normalizedPath.replace(/\/$/, ''); // Remove trailing slash
  
  console.log(`[SocialCrawler] Normalized path: ${normalizedPath}`);

  // Get base URL from request (used by all handlers)
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'] || 'sabq.news';
  const baseUrl = `${protocol}://${host}`;

  try {
    // 1️⃣ Handle article pages: /article/:slug
    const articleMatch = normalizedPath.match(/^\/article\/([^\/]+)$/);
    if (articleMatch) {
      const slug = articleMatch[1];
      console.log(`[SocialCrawler] Handling article: ${slug}`);
      
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, slug))
        .limit(1);

      if (!article) {
        console.log(`[SocialCrawler] Article not found: ${slug}`);
        return next();
      }

      const html = generateArticleHTML(article, baseUrl);
      console.log(`[SocialCrawler] ✅ Serving article: ${article.title}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // 2️⃣ Handle category pages: /category/:slug
    const categoryMatch = normalizedPath.match(/^\/category\/([^\/]+)$/);
    if (categoryMatch) {
      const slug = categoryMatch[1];
      console.log(`[SocialCrawler] Handling category: ${slug}`);
      
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (!category) {
        console.log(`[SocialCrawler] Category not found: ${slug}`);
        return next();
      }

      const html = generateCategoryHTML(category, baseUrl);
      console.log(`[SocialCrawler] ✅ Serving category: ${category.nameAr}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // 3️⃣ Handle reporter pages: /reporter/:id
    const reporterMatch = normalizedPath.match(/^\/reporter\/([^\/]+)$/);
    if (reporterMatch) {
      const id = reporterMatch[1];
      console.log(`[SocialCrawler] Handling reporter: ${id}`);
      
      const [reporter] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!reporter) {
        console.log(`[SocialCrawler] Reporter not found: ${id}`);
        return next();
      }

      // Role filtering: only serve if user has reporter role
      if (reporter.role !== 'reporter') {
        console.log(`[SocialCrawler] User ${id} is not a reporter (role: ${reporter.role})`);
        return next();
      }

      const html = generateReporterHTML(reporter, baseUrl);
      const name = reporter.firstName && reporter.lastName 
        ? `${reporter.firstName} ${reporter.lastName}` 
        : reporter.email;
      console.log(`[SocialCrawler] ✅ Serving reporter: ${name}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // 4️⃣ Handle writer/muqtarab pages: /muqtarab/:id
    const writerMatch = normalizedPath.match(/^\/muqtarab\/([^\/]+)$/);
    if (writerMatch) {
      const id = writerMatch[1];
      console.log(`[SocialCrawler] Handling writer: ${id}`);
      
      const [writer] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!writer) {
        console.log(`[SocialCrawler] Writer not found: ${id}`);
        return next();
      }

      // Role filtering: only serve if user has opinion_writer role
      if (writer.role !== 'opinion_writer') {
        console.log(`[SocialCrawler] User ${id} is not an opinion writer (role: ${writer.role})`);
        return next();
      }

      const html = generateWriterHTML(writer, baseUrl);
      const name = writer.firstName && writer.lastName 
        ? `${writer.firstName} ${writer.lastName}` 
        : writer.email;
      console.log(`[SocialCrawler] ✅ Serving writer: ${name}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // 5️⃣ Handle deep analysis (Omq) pages: /ai/omq/:id
    const omqMatch = normalizedPath.match(/^\/ai\/omq\/([^\/]+)$/);
    if (omqMatch) {
      const id = omqMatch[1];
      console.log(`[SocialCrawler] Handling Omq: ${id}`);
      
      const [analysis] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, id))
        .limit(1);

      if (!analysis) {
        console.log(`[SocialCrawler] Omq analysis not found: ${id}`);
        return next();
      }

      const html = generateOmqHTML(analysis, baseUrl);
      console.log(`[SocialCrawler] ✅ Serving Omq: ${analysis.title}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // 6️⃣ Handle iFox AI homepage: /ai/ifox
    if (normalizedPath === '/ai/ifox') {
      console.log(`[SocialCrawler] Handling iFox homepage`);
      
      const html = generateIFoxHTML(baseUrl);
      console.log(`[SocialCrawler] ✅ Serving iFox homepage`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    }

    // For homepage and other pages, let the normal flow handle it
    // The meta tags in index.html will be served
    next();
  } catch (error) {
    console.error(`[SocialCrawler] Error processing request:`, error);
    return next();
  }
}
