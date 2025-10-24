/**
 * Template Selector Engine
 * 
 * Intelligent template selection based on content analysis and scoring hints.
 * Evaluates multiple factors to recommend the best template for given content.
 */

import type { 
  ArticleItem, 
  TemplatesManifest, 
  PublishingTemplate,
  ContentContext,
  TemplateRecommendation,
  TemplateScoreHints
} from './types';

/**
 * Analyzes content and returns context metadata
 */
export function analyzeContent(items: ArticleItem[]): ContentContext {
  const hasImages = items.some(item => item.image);
  const hasVideo = items.some(item => item.videoUrl);
  const hasBreaking = items.some(item => item.newsType === 'breaking');
  const hasFeatured = items.some(item => item.newsType === 'featured');
  
  const avgExcerptLength = items.reduce((sum, item) => 
    sum + (item.excerpt?.length || 0), 0) / items.length;
  
  const categories = new Set(items.map(item => item.category?.id).filter(Boolean));
  
  return {
    itemCount: items.length,
    hasImages,
    hasVideo,
    hasBreaking,
    hasFeatured,
    avgExcerptLength,
    uniqueCategories: categories.size,
    isTimeSensitive: hasBreaking || items.some(item => {
      if (!item.publishedAt) return false;
      const hoursSincePublished = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
      return hoursSincePublished < 6; // Within 6 hours
    }),
  };
}

/**
 * Evaluates a template against content context and returns a score (0-100)
 */
export function scoreTemplate(
  template: PublishingTemplate,
  context: ContentContext,
  userPreferences?: { density?: 'compact' | 'cozy' | 'comfortable'; prefersVisual?: boolean }
): number {
  let score = 50; // Base score
  const hints: TemplateScoreHints = template.scoreHints as any || {};

  // Item count scoring
  if (hints.minItems && context.itemCount < hints.minItems) {
    score -= 30; // Significant penalty for too few items
  }
  if (hints.maxItems && context.itemCount > hints.maxItems) {
    score -= 20; // Penalty for too many items
  }
  if (hints.idealItems) {
    const deviation = Math.abs(context.itemCount - hints.idealItems);
    score -= deviation * 2; // Penalty proportional to deviation
  }

  // Visual content scoring
  if (hints.requiresImage && !context.hasImages) {
    score -= 40; // Major penalty if images required but missing
  }
  if (hints.requiresImage && context.hasImages) {
    score += 15; // Bonus for having required images
  }
  if (hints.prefersVideo && context.hasVideo) {
    score += 20; // Bonus for video content when preferred
  }

  // News type scoring
  if (hints.bestForBreaking && context.hasBreaking) {
    score += 25; // Strong bonus for breaking news templates
  }
  if (hints.bestForFeatured && context.hasFeatured) {
    score += 15; // Bonus for featured content
  }

  // Time sensitivity
  if (hints.timeSensitive && context.isTimeSensitive) {
    score += 20; // Bonus for time-sensitive templates
  }

  // Content depth
  if (hints.requiresExcerpt && context.avgExcerptLength < 50) {
    score -= 25; // Penalty for templates needing excerpts without them
  }
  if (hints.requiresExcerpt && context.avgExcerptLength >= 100) {
    score += 10; // Bonus for rich content
  }

  // Category diversity
  if (hints.bestForDiversity && context.uniqueCategories > 3) {
    score += 15; // Bonus for diverse content
  }

  // User preferences
  if (userPreferences?.prefersVisual && hints.requiresImage) {
    score += 10;
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Recommends templates for given content, sorted by score
 */
export function recommendTemplates(
  items: ArticleItem[],
  manifest: TemplatesManifest,
  options?: {
    category?: string; // Filter by category (e.g., 'hero', 'list', 'grid')
    limit?: number; // Max number of recommendations
    minScore?: number; // Minimum acceptable score
    userPreferences?: { density?: 'compact' | 'cozy' | 'comfortable'; prefersVisual?: boolean };
  }
): TemplateRecommendation[] {
  const context = analyzeContent(items);
  const { category, limit = 5, minScore = 40, userPreferences } = options || {};

  // Filter templates by category if specified
  const templates = category
    ? manifest.templates.filter((t: PublishingTemplate) => t.kind === category)
    : manifest.templates;

  // Score each template
  const scored: TemplateRecommendation[] = templates.map((template: PublishingTemplate) => {
    const score = scoreTemplate(template, context, userPreferences);
    
    // Determine reasoning
    const reasons: string[] = [];
    const hints: TemplateScoreHints = template.scoreHints as any || {};
    
    if (hints.idealItems && Math.abs(context.itemCount - hints.idealItems) <= 2) {
      reasons.push(`عدد العناصر مثالي (${context.itemCount})`);
    }
    if (hints.bestForBreaking && context.hasBreaking) {
      reasons.push('مناسب للأخبار العاجلة');
    }
    if (hints.bestForFeatured && context.hasFeatured) {
      reasons.push('مناسب للمحتوى المميز');
    }
    if (hints.requiresImage && context.hasImages) {
      reasons.push('يحتوي على صور');
    }
    if (hints.prefersVideo && context.hasVideo) {
      reasons.push('يحتوي على فيديو');
    }
    if (hints.timeSensitive && context.isTimeSensitive) {
      reasons.push('محتوى حساس للوقت');
    }
    if (hints.bestForDiversity && context.uniqueCategories > 3) {
      reasons.push('تنوع في الفئات');
    }

    return {
      template,
      score,
      reasoning: reasons.length > 0 ? reasons : ['متوافق مع المحتوى'],
    };
  });

  // Filter by minimum score and sort
  return scored
    .filter(rec => rec.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Gets the best template for given content
 */
export function selectBestTemplate(
  items: ArticleItem[],
  manifest: TemplatesManifest,
  options?: {
    category?: string;
    userPreferences?: { density?: 'compact' | 'cozy' | 'comfortable'; prefersVisual?: boolean };
  }
): TemplateRecommendation | null {
  const recommendations = recommendTemplates(items, manifest, {
    ...options,
    limit: 1,
  });

  return recommendations[0] || null;
}

/**
 * Auto-selects template based on content type and context
 * Used for Smart Blocks automatic template assignment
 */
export function autoSelectTemplate(
  items: ArticleItem[],
  manifest: TemplatesManifest,
  blockType: 'hero' | 'section' | 'sidebar' | 'ticker' | 'spotlight'
): string | null {
  const categoryMap: Record<typeof blockType, string> = {
    hero: 'hero',
    section: items.length <= 6 ? 'list' : 'grid',
    sidebar: 'list',
    ticker: 'ticker',
    spotlight: 'spotlight',
  };

  const category = categoryMap[blockType];
  const best = selectBestTemplate(items, manifest, { category });

  return best?.template.id || null;
}
