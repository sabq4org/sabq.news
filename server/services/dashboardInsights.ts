import { db } from "../db";
import { 
  articles, users, comments, reactions, categories
} from "@shared/schema";
import type { 
  DecisionDashboardResponse, 
  ExecutiveSummary, 
  ActionRecommendation, 
  ArticlePerformance,
  TeamActivity,
  TeamMemberActivity,
  Insight,
  DailyBrief,
  MetricWithComparison
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc, count, sum, avg, lt, ne, or, isNull } from "drizzle-orm";

// حساب نسبة التغير
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// تحديد حالة المؤشر بناءً على النسبة
function getMetricStatus(percentChange: number): 'positive' | 'neutral' | 'negative' {
  if (percentChange > 5) return 'positive';
  if (percentChange < -5) return 'negative';
  return 'neutral';
}

// تحديد التحية حسب الوقت
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

export class DashboardInsightsService {
  
  // الملخص التنفيذي
  async getExecutiveSummary(): Promise<ExecutiveSummary> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // التفاعل اليوم vs أمس
    const [todayEngagement] = await db.select({
      count: count()
    }).from(reactions).where(gte(reactions.createdAt, todayStart));

    const [yesterdayEngagement] = await db.select({
      count: count()
    }).from(reactions).where(
      and(
        gte(reactions.createdAt, yesterdayStart),
        lt(reactions.createdAt, todayStart)
      )
    );

    const engagementToday = todayEngagement?.count || 0;
    const engagementYesterday = yesterdayEngagement?.count || 0;
    const engagementChange = calculatePercentChange(engagementToday, engagementYesterday);

    // المشاهدات اليوم - استخدام مجموع views من المقالات المنشورة اليوم
    const [todayViewsResult] = await db.select({
      total: sum(articles.views)
    }).from(articles).where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, todayStart)
      )
    );

    const [weekViewsResult] = await db.select({
      total: sum(articles.views)
    }).from(articles).where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, weekAgo)
      )
    );

    const viewsToday = Number(todayViewsResult?.total) || 0;
    const weekViewsTotal = Number(weekViewsResult?.total) || 0;
    const avgWeeklyViews = Math.round(weekViewsTotal / 7);
    const viewsChange = calculatePercentChange(viewsToday, avgWeeklyViews);

    // المقالات ضعيفة الأداء (أقل من 100 مشاهدة في آخر 24 ساعة رغم نشرها)
    const underperformingQuery = await db.select({
      count: count()
    }).from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, yesterdayStart),
        lt(sql`COALESCE(${articles.views}, 0)`, 100)
      )
    );
    const underperformingCount = underperformingQuery[0]?.count || 0;

    // المقال الترند (الأكثر مشاهدة اليوم)
    const trendingQuery = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views
    }).from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.views))
    .limit(1);

    const trendingArticle = trendingQuery[0] ? {
      id: trendingQuery[0].id,
      title: trendingQuery[0].title,
      views: trendingQuery[0].views || 0
    } : null;

    return {
      engagement: {
        value: engagementToday,
        previousValue: engagementYesterday,
        percentChange: engagementChange,
        status: getMetricStatus(engagementChange),
        label: "التفاعل",
        comparisonLabel: "عن أمس"
      },
      reads: {
        value: viewsToday,
        previousValue: avgWeeklyViews,
        percentChange: viewsChange,
        status: getMetricStatus(viewsChange),
        label: "القراءات",
        comparisonLabel: "عن متوسط الأسبوع"
      },
      underperformingCount,
      trendingArticle
    };
  }

  // التوصيات القابلة للتنفيذ
  async getActionRecommendations(): Promise<ActionRecommendation[]> {
    const recommendations: ActionRecommendation[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // 1. مقالات بعناوين ضعيفة (views منخفضة رغم النشر الحديث)
    const lowCTRArticles = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views
    }).from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, new Date(now.getTime() - 48 * 60 * 60 * 1000)),
        lt(sql`COALESCE(${articles.views}, 0)`, 50)
      )
    )
    .orderBy(articles.views)
    .limit(2);

    for (const article of lowCTRArticles) {
      recommendations.push({
        id: `review-${article.id}`,
        type: 'review_title',
        icon: 'Edit3',
        title: 'راجع العنوان',
        description: `مقال منشور حديثاً بمشاهدات منخفضة`,
        articleId: article.id,
        articleTitle: article.title,
        actionUrl: `/dashboard/articles/${article.id}/edit`,
        priority: 'high',
        metric: `${article.views || 0} مشاهدة فقط`
      });
    }

    // 2. فجوات المحتوى - تحقق من التصنيفات التي لم تنشر منذ 6 ساعات
    const allCategories = await db.select({
      id: categories.id,
      nameAr: categories.nameAr
    }).from(categories)
    .where(eq(categories.status, 'active'));

    for (const cat of allCategories.slice(0, 5)) {
      const recentInCategory = await db.select({
        count: count()
      }).from(articles)
      .where(
        and(
          eq(articles.categoryId, cat.id),
          eq(articles.status, 'published'),
          gte(articles.publishedAt, sixHoursAgo)
        )
      );

      if ((recentInCategory[0]?.count || 0) === 0) {
        recommendations.push({
          id: `gap-${cat.id}`,
          type: 'content_gap',
          icon: 'Clock',
          title: 'فجوة محتوى',
          description: `لا يوجد محتوى في ${cat.nameAr} منذ 6 ساعات`,
          actionUrl: `/dashboard/articles/new?category=${cat.id}`,
          priority: 'medium',
          metric: '0 مقالات منذ 6 ساعات'
        });
        break; // فقط أول فجوة
      }
    }

    // 3. تعليقات قيد المراجعة
    const [pendingComments] = await db.select({
      count: count()
    }).from(comments)
    .where(eq(comments.status, 'pending'));

    if ((pendingComments?.count || 0) > 5) {
      recommendations.push({
        id: 'moderate-comments',
        type: 'moderate',
        icon: 'MessageSquare',
        title: 'تعليقات تنتظر المراجعة',
        description: `${pendingComments.count} تعليق بحاجة للمراجعة`,
        actionUrl: '/dashboard/comments?status=pending',
        priority: 'medium',
        metric: `${pendingComments.count} تعليق`
      });
    }

    // 4. مقال ناجح يستحق إعادة النشر على السوشيال
    const successfulArticle = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views
    }).from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        gte(sql`COALESCE(${articles.views}, 0)`, 500)
      )
    )
    .orderBy(desc(articles.views))
    .limit(1);

    if (successfulArticle[0]) {
      recommendations.push({
        id: `republish-${successfulArticle[0].id}`,
        type: 'republish',
        icon: 'Share2',
        title: 'أعد النشر على السوشيال',
        description: `مقال ناجح يستحق إعادة النشر`,
        articleId: successfulArticle[0].id,
        articleTitle: successfulArticle[0].title,
        actionUrl: `/dashboard/articles/${successfulArticle[0].id}`,
        priority: 'low',
        metric: `${successfulArticle[0].views} مشاهدة`
      });
    }

    return recommendations.slice(0, 5); // أقصى 5 توصيات
  }

  // أفضل المقالات
  async getTopArticles(limit: number = 5): Promise<ArticlePerformance[]> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const topArticlesQuery = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views,
      publishedAt: articles.publishedAt,
      categoryName: categories.nameAr,
      authorFirstName: users.firstName,
      authorLastName: users.lastName
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, todayStart)
      )
    )
    .orderBy(desc(articles.views))
    .limit(limit);

    return topArticlesQuery.map(article => {
      const views = article.views || 0;
      let status: 'positive' | 'neutral' | 'negative' = 'neutral';
      let successReason = '';

      if (views > 300) {
        status = 'positive';
        successReason = 'أداء ممتاز - فوق المتوسط';
      } else if (views < 50) {
        status = 'negative';
        successReason = 'يحتاج مراجعة العنوان';
      } else {
        successReason = 'أداء طبيعي';
      }

      return {
        id: article.id,
        title: article.title,
        views,
        engagement: 0,
        publishedAt: article.publishedAt?.toISOString() || new Date().toISOString(),
        category: article.categoryName || undefined,
        author: article.authorFirstName && article.authorLastName 
          ? `${article.authorFirstName} ${article.authorLastName}` 
          : undefined,
        successReason,
        status
      };
    });
  }

  // المقالات ضعيفة الأداء
  async getUnderperformingArticles(limit: number = 3): Promise<ArticlePerformance[]> {
    const now = new Date();
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const underperformingQuery = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views,
      publishedAt: articles.publishedAt,
      categoryName: categories.nameAr,
      authorFirstName: users.firstName,
      authorLastName: users.lastName
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, yesterdayStart),
        lt(sql`COALESCE(${articles.views}, 0)`, 100)
      )
    )
    .orderBy(articles.views)
    .limit(limit);

    return underperformingQuery.map(article => ({
      id: article.id,
      title: article.title,
      views: article.views || 0,
      engagement: 0,
      publishedAt: article.publishedAt?.toISOString() || new Date().toISOString(),
      category: article.categoryName || undefined,
      author: article.authorFirstName && article.authorLastName 
        ? `${article.authorFirstName} ${article.authorLastName}` 
        : undefined,
      successReason: 'مشاهدات أقل من المتوقع',
      status: 'negative' as const
    }));
  }

  // نشاط الفريق
  async getTeamActivity(): Promise<TeamActivity> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // المقالات المنشورة اليوم حسب الكاتب
    const publishedByAuthor = await db.select({
      authorId: articles.authorId,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      count: count()
    })
    .from(articles)
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, todayStart)
      )
    )
    .groupBy(articles.authorId, users.firstName, users.lastName, users.profileImageUrl)
    .orderBy(desc(count()));

    // المقالات المعلقة (draft) حسب الكاتب
    const pendingByAuthor = await db.select({
      authorId: articles.authorId,
      count: count()
    })
    .from(articles)
    .where(eq(articles.status, 'draft'))
    .groupBy(articles.authorId);

    const pendingMap = new Map(pendingByAuthor.map(p => [p.authorId, p.count]));

    const members: TeamMemberActivity[] = publishedByAuthor.slice(0, 10).map(author => ({
      userId: author.authorId || '',
      name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'غير معروف',
      avatar: author.profileImageUrl || undefined,
      publishedToday: author.count,
      pendingArticles: pendingMap.get(author.authorId) || 0,
      avgPublishTime: undefined,
      lastActive: undefined
    }));

    const totalPublishedToday = members.reduce((sum, m) => sum + m.publishedToday, 0);
    const totalPendingArticles = Array.from(pendingMap.values()).reduce((sum, c) => sum + c, 0);

    return {
      totalPublishedToday,
      totalPendingArticles,
      avgTeamPublishTime: undefined,
      topPublisher: members[0],
      members
    };
  }

  // الفرص والمخاطر
  async getInsights(): Promise<Insight[]> {
    const insights: Insight[] = [];
    const now = new Date();

    // فرصة: تصنيف ذو تفاعل عالي
    const [topCategory] = await db.select({
      id: categories.id,
      nameAr: categories.nameAr
    })
    .from(categories)
    .where(eq(categories.status, 'active'))
    .limit(1);

    if (topCategory) {
      insights.push({
        id: 'opp-1',
        type: 'opportunity',
        icon: 'TrendingUp',
        title: 'فرصة محتوى',
        description: `تصنيف ${topCategory.nameAr} يحظى باهتمام عالي`,
        category: topCategory.nameAr,
        actionUrl: `/dashboard/articles/new?category=${topCategory.id}`
      });
    }

    // مخاطرة: تعليقات مرفوضة كثيرة
    const [rejectedComments] = await db.select({
      count: count()
    }).from(comments)
    .where(eq(comments.status, 'rejected'));

    if ((rejectedComments?.count || 0) > 10) {
      insights.push({
        id: 'risk-1',
        type: 'risk',
        icon: 'AlertTriangle',
        title: 'تحذير',
        description: `${rejectedComments.count} تعليق مرفوض - قد يشير لمشكلة في جودة التفاعل`,
        actionUrl: '/dashboard/comments?status=rejected'
      });
    }

    // مخاطرة: مقالات مسودة قديمة
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [oldDrafts] = await db.select({
      count: count()
    }).from(articles)
    .where(
      and(
        eq(articles.status, 'draft'),
        lt(articles.createdAt, weekAgo)
      )
    );

    if ((oldDrafts?.count || 0) > 5) {
      insights.push({
        id: 'risk-2',
        type: 'risk',
        icon: 'FileX',
        title: 'مسودات قديمة',
        description: `${oldDrafts.count} مسودة عمرها أكثر من أسبوع`,
        actionUrl: '/dashboard/articles?status=draft'
      });
    }

    return insights;
  }

  // البريف اليومي
  async getDailyBrief(userName?: string): Promise<DailyBrief> {
    const now = new Date();
    const greeting = getTimeBasedGreeting();
    const dateStr = now.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const insights = await this.getInsights();
    const opportunities = insights.filter(i => i.type === 'opportunity').slice(0, 3);
    const risks = insights.filter(i => i.type === 'risk').slice(0, 2);

    // مقال يستحق الدفع
    const boostQuery = await db.select({
      id: articles.id,
      title: articles.title,
      views: articles.views
    }).from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        gte(sql`COALESCE(${articles.views}, 0)`, 200)
      )
    )
    .orderBy(desc(articles.views))
    .limit(1);

    const boostCandidate = boostQuery[0] ? {
      articleId: boostQuery[0].id,
      title: boostQuery[0].title,
      reason: `حقق ${boostQuery[0].views} مشاهدة - يستحق الترويج`
    } : null;

    const summary = `لديك ${opportunities.length} فرص محتوى و${risks.length} تحذيرات${boostCandidate ? '، ومقال واحد يستحق الدفع' : ''}`;

    return {
      greeting: `${greeting} يا ${userName || 'عزيزي'}`,
      date: dateStr,
      opportunities,
      risks,
      boostCandidate,
      summary
    };
  }

  // الاستجابة الكاملة
  async getDecisionDashboard(userName?: string): Promise<DecisionDashboardResponse> {
    const [
      executiveSummary,
      actionRecommendations,
      topArticles,
      underperformingArticles,
      teamActivity,
      insights,
      dailyBrief
    ] = await Promise.all([
      this.getExecutiveSummary(),
      this.getActionRecommendations(),
      this.getTopArticles(5),
      this.getUnderperformingArticles(3),
      this.getTeamActivity(),
      this.getInsights(),
      this.getDailyBrief(userName)
    ]);

    return {
      executiveSummary,
      actionRecommendations,
      topArticles,
      underperformingArticles,
      teamActivity,
      insights,
      dailyBrief,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const dashboardInsightsService = new DashboardInsightsService();
