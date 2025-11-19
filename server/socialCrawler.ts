import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { articles } from "@shared/schema";
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
 * Generates static HTML with Open Graph meta tags for an article
 */
function generateArticleHTML(article: any, baseUrl: string): string {
  // Extract SEO data from article.seo JSON field or fallback to article fields
  const seoData = article.seo || {};
  const seoTitle = seoData.title || article.title || 'خبر من سبق';
  const seoDescription = seoData.description || article.excerpt || article.aiSummary || article.ai_summary || 'اقرأ المزيد';
  // Drizzle converts snake_case to camelCase, so check both
  const seoImage = article.imageUrl || article.image_url || `${baseUrl}/icon.png`;
  const articleUrl = `${baseUrl}/article/${article.slug}`;
  
  // Escape HTML to prevent XSS
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const safeSeoTitle = escapeHtml(seoTitle);
  const safeSeoDescription = escapeHtml(seoDescription);
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSeoTitle}</title>
  <meta name="description" content="${safeSeoDescription}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${safeSeoTitle}">
  <meta property="og:description" content="${safeSeoDescription}">
  <meta property="og:image" content="${seoImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeSeoTitle}">
  <meta property="og:site_name" content="صحيفة سبق الإلكترونية">
  <meta property="og:locale" content="ar_SA">
  ${article.published_at ? `<meta property="article:published_time" content="${new Date(article.published_at).toISOString()}">` : ''}
  ${article.updated_at ? `<meta property="article:modified_time" content="${new Date(article.updated_at).toISOString()}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${articleUrl}">
  <meta name="twitter:title" content="${safeSeoTitle}">
  <meta name="twitter:description" content="${safeSeoDescription}">
  <meta name="twitter:image" content="${seoImage}">
  <meta name="twitter:image:alt" content="${safeSeoTitle}">
</head>
<body style="font-family: 'Tajawal', Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background: #f5f5f5;">
  <h1 style="color: #333; font-size: 24px; margin-bottom: 12px;">${safeSeoTitle}</h1>
  <p style="color: #666; font-size: 16px; line-height: 1.6;">${safeSeoDescription}</p>
  <a href="${articleUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">اقرأ المقال كاملاً</a>
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
  // Skip API routes - they should handle their own responses
  if (req.path.startsWith('/api/')) {
    console.log(`[SocialCrawler] Skipping API route: ${req.path}`);
    return next();
  }

  // Only process if it's a crawler
  if (!isCrawler(req)) {
    return next();
  }

  console.log(`[SocialCrawler] Detected crawler: ${req.headers['user-agent']}`);
  console.log(`[SocialCrawler] Path: ${req.path}`);

  // Handle article pages: /article/:slug
  const articleMatch = req.path.match(/^\/article\/([^\/]+)$/);
  if (articleMatch) {
    const slug = articleMatch[1];
    
    try {
      // Fetch article from database
      const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, slug))
        .limit(1);

      if (!article) {
        console.log(`[SocialCrawler] Article not found: ${slug}`);
        return next();
      }

      // Get base URL from request
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['host'] || 'sabq.news';
      const baseUrl = `${protocol}://${host}`;

      // Generate and send static HTML
      const html = generateArticleHTML(article, baseUrl);
      
      console.log(`[SocialCrawler] Serving static HTML for article: ${article.title}`);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return res.send(html);
    } catch (error) {
      console.error(`[SocialCrawler] Error fetching article:`, error);
      return next();
    }
  }

  // For homepage and other pages, let the normal flow handle it
  // The meta tags in index.html will be served
  next();
}
