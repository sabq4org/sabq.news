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
  const seoTitle = article.seoTitle || article.title || 'خبر من سبق';
  const seoDescription = article.seoDescription || article.excerpt || article.aiSummary || 'اقرأ المزيد';
  const seoImage = article.imageUrl || `${baseUrl}/icon.png`;
  const articleUrl = `${baseUrl}/article/${article.slug}`;
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDescription}">
  <meta property="og:image" content="${seoImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="صحيفة سبق الإلكترونية">
  <meta property="og:locale" content="ar_SA">
  ${article.publishedAt ? `<meta property="article:published_time" content="${article.publishedAt}">` : ''}
  ${article.modifiedAt ? `<meta property="article:modified_time" content="${article.modifiedAt}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${articleUrl}">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDescription}">
  <meta name="twitter:image" content="${seoImage}">
  
  <!-- Redirect to actual page after crawler reads meta tags -->
  <meta http-equiv="refresh" content="0; url=${articleUrl}">
</head>
<body>
  <h1>${seoTitle}</h1>
  <p>${seoDescription}</p>
  <p>يتم تحويلك للمقال...</p>
  <script>window.location.href = '${articleUrl}';</script>
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
