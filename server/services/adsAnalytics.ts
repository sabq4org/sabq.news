import { db } from "../db";
import {
  impressions,
  clicks,
  conversions,
  dailyStats,
  campaigns,
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, inArray, isNotNull } from "drizzle-orm";

export interface OverviewStats {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spent: number;
  revenue: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  spent: number;
}

export interface AudienceBreakdown {
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AudienceAnalytics {
  byDevice: AudienceBreakdown[];
  byCountry: AudienceBreakdown[];
  byReferrer: AudienceBreakdown[];
}

export interface CampaignComparisonItem {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spent: number;
  revenue: number;
}

export interface QualityMetrics {
  qualityScore: number;
  bounceRate: number;
  avgTimeOnAd: number;
}

export interface FunnelStage {
  stage: string;
  stageAr: string;
  count: number;
  percentage: number;
  dropoff: number;
  color: string;
}

export interface FunnelData {
  stages: FunnelStage[];
  totalConversionRate: number;
}

export interface OverviewStatsWithComparison extends OverviewStats {
  previousPeriod: OverviewStats;
  deltas: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    spent: number;
    revenue: number;
  };
}

function buildDateFilters(
  table: { timestamp: any },
  dateFrom?: Date,
  dateTo?: Date
) {
  const conditions = [];
  if (dateFrom) {
    conditions.push(gte(table.timestamp, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(table.timestamp, dateTo));
  }
  return conditions;
}

function buildDailyStatsDateFilters(dateFrom?: Date, dateTo?: Date) {
  const conditions = [];
  if (dateFrom) {
    conditions.push(gte(dailyStats.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(dailyStats.date, dateTo));
  }
  return conditions;
}

export async function getOverviewStats(
  campaignId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<OverviewStats> {
  const campaignConditions = campaignId
    ? [eq(dailyStats.campaignId, campaignId)]
    : [];
  const dateConditions = buildDailyStatsDateFilters(dateFrom, dateTo);

  const statsResult = await db
    .select({
      totalImpressions: sql<number>`COALESCE(SUM(${dailyStats.impressions}), 0)::int`,
      totalClicks: sql<number>`COALESCE(SUM(${dailyStats.clicks}), 0)::int`,
      totalConversions: sql<number>`COALESCE(SUM(${dailyStats.conversions}), 0)::int`,
      totalSpent: sql<number>`COALESCE(SUM(${dailyStats.spent}), 0)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(${dailyStats.revenue}), 0)::int`,
    })
    .from(dailyStats)
    .where(and(...campaignConditions, ...dateConditions));

  const stats = statsResult[0] || {
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalSpent: 0,
    totalRevenue: 0,
  };

  const totalImpressions = Number(stats.totalImpressions) || 0;
  const totalClicks = Number(stats.totalClicks) || 0;
  const totalConversions = Number(stats.totalConversions) || 0;
  const totalSpent = Number(stats.totalSpent) || 0;
  const totalRevenue = Number(stats.totalRevenue) || 0;

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;

  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    cpm: parseFloat(cpm.toFixed(2)),
    spent: totalSpent,
    revenue: totalRevenue,
  };
}

export async function getTimeSeriesData(
  period: "daily" | "weekly" | "monthly",
  campaignId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<TimeSeriesDataPoint[]> {
  const campaignConditions = campaignId
    ? [eq(dailyStats.campaignId, campaignId)]
    : [];
  const dateConditions = buildDailyStatsDateFilters(dateFrom, dateTo);

  let dateTrunc: string;
  switch (period) {
    case "weekly":
      dateTrunc = "week";
      break;
    case "monthly":
      dateTrunc = "month";
      break;
    case "daily":
    default:
      dateTrunc = "day";
      break;
  }

  const result = await db
    .select({
      dateBucket: sql<string>`date_trunc('${sql.raw(dateTrunc)}', ${dailyStats.date})::date::text`,
      impressions: sql<number>`COALESCE(SUM(${dailyStats.impressions}), 0)::int`,
      clicks: sql<number>`COALESCE(SUM(${dailyStats.clicks}), 0)::int`,
      conversions: sql<number>`COALESCE(SUM(${dailyStats.conversions}), 0)::int`,
      spent: sql<number>`COALESCE(SUM(${dailyStats.spent}), 0)::int`,
    })
    .from(dailyStats)
    .where(and(...campaignConditions, ...dateConditions))
    .groupBy(sql`date_trunc('${sql.raw(dateTrunc)}', ${dailyStats.date})`)
    .orderBy(sql`date_trunc('${sql.raw(dateTrunc)}', ${dailyStats.date})`);

  return result.map((row) => {
    const imp = Number(row.impressions) || 0;
    const clk = Number(row.clicks) || 0;
    const ctr = imp > 0 ? (clk / imp) * 100 : 0;

    return {
      date: row.dateBucket,
      impressions: imp,
      clicks: clk,
      conversions: Number(row.conversions) || 0,
      ctr: parseFloat(ctr.toFixed(2)),
      spent: Number(row.spent) || 0,
    };
  });
}

export async function getAudienceAnalytics(
  campaignId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<AudienceAnalytics> {
  const impCampaignConditions = campaignId
    ? [eq(impressions.campaignId, campaignId)]
    : [];
  const impDateConditions = buildDateFilters(impressions, dateFrom, dateTo);

  const clickCampaignConditions = campaignId
    ? [eq(clicks.campaignId, campaignId)]
    : [];
  const clickDateConditions = buildDateFilters(clicks, dateFrom, dateTo);

  const [byDevice, byCountry, byReferrer] = await Promise.all([
    db
      .select({
        device: impressions.device,
        impressionCount: sql<number>`COUNT(DISTINCT ${impressions.id})::int`,
      })
      .from(impressions)
      .where(
        and(
          isNotNull(impressions.device),
          ...impCampaignConditions,
          ...impDateConditions
        )
      )
      .groupBy(impressions.device)
      .orderBy(desc(sql`COUNT(DISTINCT ${impressions.id})`)),

    db
      .select({
        country: impressions.country,
        impressionCount: sql<number>`COUNT(DISTINCT ${impressions.id})::int`,
      })
      .from(impressions)
      .where(
        and(
          isNotNull(impressions.country),
          ...impCampaignConditions,
          ...impDateConditions
        )
      )
      .groupBy(impressions.country)
      .orderBy(desc(sql`COUNT(DISTINCT ${impressions.id})`)),

    db
      .select({
        referrer: impressions.referrer,
        impressionCount: sql<number>`COUNT(DISTINCT ${impressions.id})::int`,
      })
      .from(impressions)
      .where(
        and(
          isNotNull(impressions.referrer),
          ...impCampaignConditions,
          ...impDateConditions
        )
      )
      .groupBy(impressions.referrer)
      .orderBy(desc(sql`COUNT(DISTINCT ${impressions.id})`))
      .limit(20),
  ]);

  const clicksByDevice = await db
    .select({
      device: clicks.device,
      clickCount: sql<number>`COUNT(DISTINCT ${clicks.id})::int`,
    })
    .from(clicks)
    .where(
      and(
        isNotNull(clicks.device),
        ...clickCampaignConditions,
        ...clickDateConditions
      )
    )
    .groupBy(clicks.device);

  const clicksByCountry = await db
    .select({
      country: clicks.country,
      clickCount: sql<number>`COUNT(DISTINCT ${clicks.id})::int`,
    })
    .from(clicks)
    .where(
      and(
        isNotNull(clicks.country),
        ...clickCampaignConditions,
        ...clickDateConditions
      )
    )
    .groupBy(clicks.country);

  const clicksByReferrer = await db
    .select({
      referrer: clicks.referrer,
      clickCount: sql<number>`COUNT(DISTINCT ${clicks.id})::int`,
    })
    .from(clicks)
    .where(
      and(
        isNotNull(clicks.referrer),
        ...clickCampaignConditions,
        ...clickDateConditions
      )
    )
    .groupBy(clicks.referrer);

  const deviceClickMap = new Map(
    clicksByDevice.map((c) => [c.device, Number(c.clickCount) || 0])
  );
  const countryClickMap = new Map(
    clicksByCountry.map((c) => [c.country, Number(c.clickCount) || 0])
  );
  const referrerClickMap = new Map(
    clicksByReferrer.map((c) => [c.referrer, Number(c.clickCount) || 0])
  );

  const mapToBreakdown = (
    rows: { label: string | null; impressionCount: number }[],
    clickMap: Map<string | null, number>
  ): AudienceBreakdown[] => {
    return rows.map((row) => {
      const imp = Number(row.impressionCount) || 0;
      const clk = clickMap.get(row.label) || 0;
      const ctr = imp > 0 ? (clk / imp) * 100 : 0;
      return {
        label: row.label || "Unknown",
        impressions: imp,
        clicks: clk,
        ctr: parseFloat(ctr.toFixed(2)),
      };
    });
  };

  return {
    byDevice: mapToBreakdown(
      byDevice.map((d) => ({
        label: d.device,
        impressionCount: d.impressionCount,
      })),
      deviceClickMap
    ),
    byCountry: mapToBreakdown(
      byCountry.map((c) => ({
        label: c.country,
        impressionCount: c.impressionCount,
      })),
      countryClickMap
    ),
    byReferrer: mapToBreakdown(
      byReferrer.map((r) => ({
        label: r.referrer,
        impressionCount: r.impressionCount,
      })),
      referrerClickMap
    ),
  };
}

export async function getCampaignComparison(
  campaignIds: string[],
  dateFrom?: Date,
  dateTo?: Date
): Promise<CampaignComparisonItem[]> {
  if (campaignIds.length === 0) {
    return [];
  }

  const dateConditions = buildDailyStatsDateFilters(dateFrom, dateTo);

  const statsResult = await db
    .select({
      campaignId: dailyStats.campaignId,
      totalImpressions: sql<number>`COALESCE(SUM(${dailyStats.impressions}), 0)::int`,
      totalClicks: sql<number>`COALESCE(SUM(${dailyStats.clicks}), 0)::int`,
      totalConversions: sql<number>`COALESCE(SUM(${dailyStats.conversions}), 0)::int`,
      totalSpent: sql<number>`COALESCE(SUM(${dailyStats.spent}), 0)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(${dailyStats.revenue}), 0)::int`,
    })
    .from(dailyStats)
    .where(and(inArray(dailyStats.campaignId, campaignIds), ...dateConditions))
    .groupBy(dailyStats.campaignId);

  const campaignData = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
    })
    .from(campaigns)
    .where(inArray(campaigns.id, campaignIds));

  const campaignNameMap = new Map(campaignData.map((c) => [c.id, c.name]));

  return statsResult.map((row) => {
    const imp = Number(row.totalImpressions) || 0;
    const clk = Number(row.totalClicks) || 0;
    const conv = Number(row.totalConversions) || 0;
    const spent = Number(row.totalSpent) || 0;
    const revenue = Number(row.totalRevenue) || 0;

    const ctr = imp > 0 ? (clk / imp) * 100 : 0;
    const cpc = clk > 0 ? spent / clk : 0;
    const cpm = imp > 0 ? (spent / imp) * 1000 : 0;

    return {
      campaignId: row.campaignId,
      campaignName: campaignNameMap.get(row.campaignId) || "Unknown Campaign",
      impressions: imp,
      clicks: clk,
      conversions: conv,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2)),
      spent,
      revenue,
    };
  });
}

function calculatePercentageDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}

export async function getOverviewStatsWithComparison(
  campaignId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<OverviewStatsWithComparison> {
  const currentStats = await getOverviewStats(campaignId, dateFrom, dateTo);

  let previousFrom: Date | undefined;
  let previousTo: Date | undefined;

  if (dateFrom && dateTo) {
    const periodLength = dateTo.getTime() - dateFrom.getTime();
    previousTo = new Date(dateFrom.getTime() - 1);
    previousFrom = new Date(previousTo.getTime() - periodLength);
  }

  const previousStats = await getOverviewStats(campaignId, previousFrom, previousTo);

  const deltas = {
    impressions: calculatePercentageDelta(currentStats.impressions, previousStats.impressions),
    clicks: calculatePercentageDelta(currentStats.clicks, previousStats.clicks),
    conversions: calculatePercentageDelta(currentStats.conversions, previousStats.conversions),
    ctr: calculatePercentageDelta(currentStats.ctr, previousStats.ctr),
    cpc: calculatePercentageDelta(currentStats.cpc, previousStats.cpc),
    cpm: calculatePercentageDelta(currentStats.cpm, previousStats.cpm),
    spent: calculatePercentageDelta(currentStats.spent, previousStats.spent),
    revenue: calculatePercentageDelta(currentStats.revenue, previousStats.revenue),
  };

  return {
    ...currentStats,
    previousPeriod: previousStats,
    deltas,
  };
}

export async function getQualityMetrics(
  campaignId: string
): Promise<QualityMetrics> {
  const [impressionsResult, clicksResult, conversionsResult] =
    await Promise.all([
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(impressions)
        .where(eq(impressions.campaignId, campaignId)),
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(clicks)
        .where(eq(clicks.campaignId, campaignId)),
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
          avgValue: sql<number>`AVG(${conversions.conversionValue})`,
        })
        .from(conversions)
        .where(eq(conversions.campaignId, campaignId)),
    ]);

  const totalImpressions = Number(impressionsResult[0]?.count) || 0;
  const totalClicks = Number(clicksResult[0]?.count) || 0;
  const totalConversions = Number(conversionsResult[0]?.count) || 0;

  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
  const engagementFactor = Math.min(1, totalClicks / Math.max(1, totalImpressions / 100));

  const qualityScore = Math.min(
    100,
    Math.round(
      ctr * 30 * 100 +
        conversionRate * 40 * 100 +
        engagementFactor * 30
    )
  );

  const bounceRate =
    totalClicks > 0
      ? parseFloat(
          (((totalClicks - totalConversions) / totalClicks) * 100).toFixed(2)
        )
      : 100;

  const avgTimeOnAd = 0;

  return {
    qualityScore: Math.max(0, qualityScore),
    bounceRate: Math.max(0, Math.min(100, bounceRate)),
    avgTimeOnAd,
  };
}

export async function getFunnelData(
  campaignId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<FunnelData> {
  const campaignConditions = campaignId
    ? [eq(dailyStats.campaignId, campaignId)]
    : [];
  const dateConditions = buildDailyStatsDateFilters(dateFrom, dateTo);

  const statsResult = await db
    .select({
      totalImpressions: sql<number>`COALESCE(SUM(${dailyStats.impressions}), 0)::int`,
      totalClicks: sql<number>`COALESCE(SUM(${dailyStats.clicks}), 0)::int`,
      totalConversions: sql<number>`COALESCE(SUM(${dailyStats.conversions}), 0)::int`,
    })
    .from(dailyStats)
    .where(and(...campaignConditions, ...dateConditions));

  const stats = statsResult[0] || {
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
  };

  const totalImpressions = Number(stats.totalImpressions) || 0;
  const totalClicks = Number(stats.totalClicks) || 0;
  const totalConversions = Number(stats.totalConversions) || 0;
  
  const loyaltyCount = Math.round(totalConversions * 0.3);
  const advocacyCount = Math.round(totalConversions * 0.1);

  const stages: FunnelStage[] = [
    {
      stage: "Awareness",
      stageAr: "الوعي",
      count: totalImpressions,
      percentage: 100,
      dropoff: 0,
      color: "#A855F7",
    },
    {
      stage: "Consideration",
      stageAr: "الاهتمام",
      count: totalClicks,
      percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      dropoff: totalImpressions > 0 ? ((totalImpressions - totalClicks) / totalImpressions) * 100 : 0,
      color: "#3B82F6",
    },
    {
      stage: "Conversion",
      stageAr: "التحويل",
      count: totalConversions,
      percentage: totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0,
      dropoff: totalClicks > 0 ? ((totalClicks - totalConversions) / totalClicks) * 100 : 0,
      color: "#22C55E",
    },
    {
      stage: "Loyalty",
      stageAr: "الولاء",
      count: loyaltyCount,
      percentage: totalImpressions > 0 ? (loyaltyCount / totalImpressions) * 100 : 0,
      dropoff: totalConversions > 0 ? ((totalConversions - loyaltyCount) / totalConversions) * 100 : 0,
      color: "#F97316",
    },
    {
      stage: "Advocacy",
      stageAr: "التأييد",
      count: advocacyCount,
      percentage: totalImpressions > 0 ? (advocacyCount / totalImpressions) * 100 : 0,
      dropoff: loyaltyCount > 0 ? ((loyaltyCount - advocacyCount) / loyaltyCount) * 100 : 0,
      color: "#EF4444",
    },
  ];

  stages.forEach((stage) => {
    stage.percentage = parseFloat(stage.percentage.toFixed(2));
    stage.dropoff = parseFloat(stage.dropoff.toFixed(2));
  });

  const totalConversionRate = totalImpressions > 0 
    ? parseFloat(((totalConversions / totalImpressions) * 100).toFixed(2))
    : 0;

  return {
    stages,
    totalConversionRate,
  };
}

export const adsAnalyticsService = {
  getOverviewStats,
  getOverviewStatsWithComparison,
  getTimeSeriesData,
  getAudienceAnalytics,
  getCampaignComparison,
  getQualityMetrics,
  getFunnelData,
};

export default adsAnalyticsService;
