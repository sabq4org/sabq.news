/**
 * iFox Calendar Service
 * 
 * خدمة إدارة التقويم التحريري الذكي
 * Manages editorial calendar entries for AI-generated and human-assigned content
 */

import { storage } from "../../storage";
import type { InsertIfoxEditorialCalendar, IfoxEditorialCalendar } from "@shared/schema";

export class IfoxCalendarService {
  /**
   * Create new calendar entry
   */
  async createEntry(data: InsertIfoxEditorialCalendar): Promise<IfoxEditorialCalendar> {
    return await storage.createIfoxEditorialCalendarEntry(data);
  }

  /**
   * List calendar entries with filters
   */
  async listEntries(filters?: {
    scheduledDateFrom?: Date;
    scheduledDateTo?: Date;
    status?: string;
    assignmentType?: string;
    assignedToUser?: string;
    page?: number;
    limit?: number;
  }): Promise<IfoxEditorialCalendar[]> {
    const result = await storage.listIfoxEditorialCalendar(filters);
    return result.entries;
  }

  /**
   * Get entry by ID
   */
  async getEntry(id: string): Promise<IfoxEditorialCalendar | null> {
    const entry = await storage.getIfoxEditorialCalendarEntry(id);
    return entry || null;
  }

  /**
   * Update entry
   */
  async updateEntry(id: string, data: Partial<InsertIfoxEditorialCalendar>, userId: string): Promise<IfoxEditorialCalendar> {
    return await storage.updateIfoxEditorialCalendarEntry(id, {
      ...data,
      updatedBy: userId,
    });
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: string): Promise<void> {
    await storage.deleteIfoxEditorialCalendarEntry(id);
  }

  /**
   * Update entry status and link to published article
   */
  async markAsCompleted(id: string, articleId: string): Promise<IfoxEditorialCalendar> {
    return await storage.updateIfoxEditorialCalendarStatus(id, "completed", articleId);
  }

  /**
   * Get entries for a specific date range
   */
  async getEntriesForDateRange(scheduledDateFrom: Date, scheduledDateTo: Date): Promise<IfoxEditorialCalendar[]> {
    const result = await storage.listIfoxEditorialCalendar({
      scheduledDateFrom,
      scheduledDateTo,
    });
    return result.entries;
  }

  /**
   * Get upcoming AI-assigned entries (next 7 days)
   */
  async getUpcomingAiEntries(daysAhead: number = 7): Promise<IfoxEditorialCalendar[]> {
    const scheduledDateFrom = new Date();
    const scheduledDateTo = new Date();
    scheduledDateTo.setDate(scheduledDateTo.getDate() + daysAhead);

    const result = await storage.listIfoxEditorialCalendar({
      scheduledDateFrom,
      scheduledDateTo,
      assignmentType: "ai",
      status: "planned",
    });

    return result.entries;
  }
}

export const ifoxCalendarService = new IfoxCalendarService();
