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

}

export const ifoxPerformanceService = new IfoxPerformanceService();
