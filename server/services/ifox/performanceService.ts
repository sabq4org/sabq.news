/**
 * iFox Performance Service
 * 
 * خدمة تتبع أداء المحتوى
 * Tracks and analyzes performance metrics for AI-generated vs human-generated content
 */

import { storage } from "../../storage";
import type { InsertIfoxPerformanceMetric, IfoxPerformanceMetric } from "@shared/schema";

export class IfoxPerformanceService {
  /**
   * Create or update performance metrics for an article
   */
  async trackArticlePerformance(articleId: string, data: Partial<InsertIfoxPerformanceMetric>): Promise<IfoxPerformanceMetric> {
    return await storage.createOrUpdateIfoxPerformanceMetric(articleId, data);
  }

  /**
   * Get performance metrics for an article
   */
  async getArticlePerformance(articleId: string): Promise<IfoxPerformanceMetric | null> {
    const metric = await storage.getIfoxPerformanceMetric(articleId);
    return metric || null;
  }

  /**
   * List performance metrics with filters
   */
  async listPerformanceMetrics(filters?: {
    isAiGenerated?: boolean;
    publishedAtFrom?: Date;
    publishedAtTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<IfoxPerformanceMetric[]> {
    const result = await storage.listIfoxPerformanceMetrics(filters);
    return result.metrics;
  }

  /**
   * Calculate ROI for AI-generated content
   */
  calculateRoi(metric: IfoxPerformanceMetric): number {
    if (!metric.generationCost || metric.generationCost === 0) {
      return 0;
    }

    const revenue = metric.estimatedRevenue || 0;
    return ((revenue - metric.generationCost) / metric.generationCost) * 100;
  }

  /**
   * Get aggregated performance metrics for the analytics dashboard
   */
  async getPerformanceMetrics(timeRange?: 'today' | 'week' | 'month' | 'all'): Promise<{
    articlesGenerated: number;
    avgQualityScore: number;
    successRate: number;
    totalSaves: number;
    metrics: Array<{
      name: string;
      value: number | string;
      trend: number;
    }>;
  }> {
    // Calculate date range based on timeRange parameter
    let publishedAtFrom: Date | undefined;
    const now = new Date();

    if (timeRange === 'today') {
      publishedAtFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'week') {
      publishedAtFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      publishedAtFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    // If 'all', publishedAtFrom stays undefined

    // Get all AI-generated performance metrics
    const aiMetrics = await this.listPerformanceMetrics({
      isAiGenerated: true,
      publishedAtFrom,
    });

    // Calculate KPIs
    const articlesGenerated = aiMetrics.length;
    
    const avgQualityScore = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => sum + (m.qualityScore || 0), 0) / aiMetrics.length
      : 0;

    // Success rate = articles with quality score >= 70
    const successfulArticles = aiMetrics.filter(m => (m.qualityScore || 0) >= 70).length;
    const successRate = aiMetrics.length > 0
      ? (successfulArticles / aiMetrics.length) * 100
      : 0;

    const totalSaves = aiMetrics.reduce((sum, m) => sum + (m.bookmarkCount || 0), 0);

    // Calculate metrics with trends (comparing to previous period)
    const avgViews = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => sum + (m.viewCount || 0), 0) / aiMetrics.length
      : 0;

    const avgEngagement = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => {
          const engagement = (m.shareCount || 0) + (m.commentCount || 0) + (m.bookmarkCount || 0);
          return sum + engagement;
        }, 0) / aiMetrics.length
      : 0;

    const totalRevenue = aiMetrics.reduce((sum, m) => sum + (m.estimatedRevenue || 0), 0);
    
    const avgRoi = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => sum + (m.roi || 0), 0) / aiMetrics.length
      : 0;

    // For simplicity, trends are set to 0. In a real scenario, you'd compare with the previous period.
    const metrics = [
      { name: 'متوسط المشاهدات', value: Math.round(avgViews), trend: 0 },
      { name: 'متوسط التفاعل', value: Math.round(avgEngagement), trend: 0 },
      { name: 'إجمالي الإيرادات', value: `$${totalRevenue.toFixed(2)}`, trend: 0 },
      { name: 'متوسط العائد', value: `${avgRoi.toFixed(1)}%`, trend: 0 },
    ];

    return {
      articlesGenerated,
      avgQualityScore: Math.round(avgQualityScore),
      successRate: Math.round(successRate),
      totalSaves,
      metrics,
    };
  }

}

export const ifoxPerformanceService = new IfoxPerformanceService();
