/**
 * Trend Cache Refresh Job
 * Refreshes trend cache every 15 minutes for daily and predictive modes
 */

import cron from "node-cron";
import { analyzeDailyPulse, analyzePredictiveTrend } from "../openai";
import { storage } from "../storage";
import { db } from "../db";
import { articles, categories, reactions, comments, enArticles, enCategories } from "@shared/schema";
import { eq, desc, gte, sql, and } from "drizzle-orm";

let isRefreshing = false;

/**
 * Refresh daily pulse cache for Arabic
 */
async function refreshArabicDailyCache() {
  try {
    console.log('[Trend Cache] 🔄 Refreshing Arabic daily pulse...');
    
    // Get recent articles with metrics (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        views: articles.views,
        publishedAt: articles.publishedAt,
        categoryNameAr: categories.nameAr,
        reactionCount: sql<number>`cast(count(distinct ${reactions.id}) as int)`,
        commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(reactions, eq(reactions.articleId, articles.id))
      .leftJoin(comments, eq(comments.articleId, articles.id))
      .where(and(
        eq(articles.status, "published"),
        gte(articles.publishedAt, twentyFourHoursAgo)
      ))
      .groupBy(articles.id, articles.title, articles.slug, articles.excerpt, articles.imageUrl, articles.views, articles.publishedAt, categories.nameAr)
      .orderBy(desc(articles.views))
      .limit(50)
      .then(rows => rows.filter(r => r.publishedAt !== null));

    if (recentArticles.length === 0) {
      console.log('[Trend Cache] ℹ️ No articles for Arabic daily pulse');
      return;
    }

    // Call AI analysis
    const aiResult = await analyzeDailyPulse(recentArticles as any, 'ar');
    
    // Build response
    const articlesMap = new Map(recentArticles.map(a => [a.id, a]));
    const trendingArticles = aiResult.trendingArticles.map(ai => {
      const article = articlesMap.get(ai.articleId);
      return article ? {
        id: ai.articleId,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        imageUrl: article.imageUrl || '',
        categoryNameAr: article.categoryNameAr || '',
        rank: ai.rank,
        score: ai.score,
        trendReason: ai.trendReason
      } : null;
    }).filter(a => a !== null);

    // Cache for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const cacheData = {
      mode: 'daily' as const,
      language: 'ar' as const,
      articles: trendingArticles as any,
      metadata: {
        pulseStatus: aiResult.pulseStatus,
        topCategory: aiResult.topCategory
      },
      generatedAt: new Date(),
      expiresAt
    };
    await storage.setTrendCache('daily', 'ar', undefined, cacheData, 15 * 60);

    console.log(`[Trend Cache] ✅ Arabic daily pulse cached (${trendingArticles.length} articles)`);
  } catch (error) {
    console.error('[Trend Cache] ❌ Error refreshing Arabic daily cache:', error);
  }
}

/**
 * Refresh predictive trends cache for Arabic
 */
async function refreshArabicPredictiveCache() {
  try {
    console.log('[Trend Cache] 🔮 Refreshing Arabic predictive trends...');
    
    // Get recent articles with content
    const recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        content: articles.content,
        views: articles.views,
        publishedAt: articles.publishedAt,
        categoryNameAr: categories.nameAr,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(30)
      .then(rows => rows.filter(r => r.publishedAt !== null));

    if (recentArticles.length === 0) {
      console.log('[Trend Cache] ℹ️ No articles for Arabic predictive trends');
      return;
    }

    // Call AI analysis
    const aiResult = await analyzePredictiveTrend(recentArticles as any, 'ar');
    
    // Build response
    const articlesMap = new Map(recentArticles.map(a => [a.id, a]));
    const predictedArticles = aiResult.predictedArticles.map(ai => {
      const article = articlesMap.get(ai.articleId);
      return article ? {
        id: ai.articleId,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        imageUrl: article.imageUrl || '',
        categoryNameAr: article.categoryNameAr || '',
        rank: ai.rank,
        score: ai.confidenceScore,
        trendReason: ai.predictionReason
      } : null;
    }).filter(a => a !== null);

    // Cache for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const cacheData = {
      mode: 'predictive' as const,
      language: 'ar' as const,
      articles: predictedArticles as any,
      metadata: {
        trendForecast: aiResult.trendForecast
      },
      generatedAt: new Date(),
      expiresAt
    };
    await storage.setTrendCache('predictive', 'ar', undefined, cacheData, 15 * 60);

    console.log(`[Trend Cache] ✅ Arabic predictive trends cached (${predictedArticles.length} articles)`);
  } catch (error) {
    console.error('[Trend Cache] ❌ Error refreshing Arabic predictive cache:', error);
  }
}

/**
 * Refresh English caches (same logic)
 */
async function refreshEnglishCaches() {
  // Similar implementation for English using enArticles, enCategories
  // Omitted for brevity - implement same pattern
  console.log('[Trend Cache] 🌐 English cache refresh not yet implemented');
}

/**
 * Main refresh function
 */
export async function refreshTrendCaches() {
  if (isRefreshing) {
    console.log('[Trend Cache] ⏭️ Skipping - already refreshing');
    return;
  }
  
  isRefreshing = true;
  try {
    console.log('[Trend Cache] 🔄 Starting cache refresh cycle...');
    
    // Refresh Arabic caches
    await Promise.all([
      refreshArabicDailyCache(),
      refreshArabicPredictiveCache(),
    ]);
    
    // Refresh English caches
    await refreshEnglishCaches();
    
    console.log('[Trend Cache] ✅ Cache refresh cycle complete');
  } catch (error) {
    console.error('[Trend Cache] ❌ Error in refresh cycle:', error);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Start job that runs every 15 minutes
 */
export function startTrendCacheJob() {
  // Run every 15 minutes
  const job = cron.schedule("*/15 * * * *", async () => {
    await refreshTrendCaches();
  });

  console.log('[Trend Cache Job] ⏰ Job scheduled (every 15 minutes)');

  // Run immediately on startup
  console.log('[Trend Cache Job] 🚀 Running initial cache refresh...');
  refreshTrendCaches().catch(err => {
    console.error('[Trend Cache Job] ❌ Initial refresh failed:', err);
  });

  return job;
}
