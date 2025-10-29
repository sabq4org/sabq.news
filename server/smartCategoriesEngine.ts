/**
 * Smart Categories Engine
 * محرك التصنيفات الذكية - يدير التصنيفات الديناميكية والموسمية تلقائياً
 */

import { db } from "./db";
import { categories, type Category } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import HijriDate, { toHijri, toGregorian } from "hijri-converter";

/**
 * الأشهر الهجرية بالأسماء العربية
 * Hijri months in Arabic names
 */
const HIJRI_MONTHS = [
  "محرم",         // 1
  "صفر",          // 2
  "ربيع الأول",   // 3
  "ربيع الآخر",   // 4
  "جمادى الأولى", // 5
  "جمادى الآخرة", // 6
  "رجب",          // 7
  "شعبان",        // 8
  "رمضان",        // 9
  "شوال",         // 10
  "ذو القعدة",    // 11
  "ذو الحجة"      // 12
];

/**
 * تحويل اسم الشهر الهجري العربي إلى رقمه
 * Convert Arabic Hijri month name to number (1-12)
 */
function getHijriMonthNumber(monthName: string): number {
  const index = HIJRI_MONTHS.indexOf(monthName);
  return index >= 0 ? index + 1 : -1;
}

/**
 * إضافة أيام إلى تاريخ ميلادي والحصول على تاريخ ميلادي جديد
 * Add days to a Gregorian date (using ISO dates for precision)
 */
function addDaysToDate(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * تحويل تاريخ هجري إلى ميلادي
 * Convert Hijri date to Gregorian Date object
 */
function hijriToDate(hy: number, hm: number, hd: number): Date {
  const greg = toGregorian(hy, hm, hd);
  return new Date(greg.gy, greg.gm - 1, greg.gd);
}

/**
 * التحقق من فعالية تصنيف موسمي بناءً على التاريخ الهجري
 * Check if seasonal category should be active based on Hijri date
 */
function shouldActivateHijriCategory(
  seasonalRules: any,
  currentDate: Date
): boolean {
  if (!seasonalRules.hijriMonth) return false;
  
  // Get target month number
  const targetMonthNumber = getHijriMonthNumber(seasonalRules.hijriMonth);
  if (targetMonthNumber === -1) {
    console.error(`[Smart Categories] Invalid Hijri month: ${seasonalRules.hijriMonth}`);
    return false;
  }
  
  // Convert current date to Hijri
  const currentHijri = toHijri(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );
  
  // Determine target year(s) to check
  const yearsToCheck: number[] = [];
  
  if (seasonalRules.hijriYear && seasonalRules.hijriYear !== "auto") {
    // Specific year provided
    yearsToCheck.push(parseInt(seasonalRules.hijriYear, 10));
  } else {
    // Auto mode: find nearest future occurrence
    // Check current year, next year, and year after (covers multi-year gaps)
    yearsToCheck.push(currentHijri.hy);
    yearsToCheck.push(currentHijri.hy + 1);
    yearsToCheck.push(currentHijri.hy + 2);
  }
  
  const activateDaysBefore = seasonalRules.activateDaysBefore || 0;
  const deactivateDaysAfter = seasonalRules.deactivateDaysAfter || 0;
  
  // Check each candidate year
  for (const targetYear of yearsToCheck) {
    // Month start in Gregorian (handles 29-30 day months correctly)
    const monthStart = hijriToDate(targetYear, targetMonthNumber, 1);
    
    // Find the last day of this Hijri month by probing
    // (Hijri months can be 29 or 30 days)
    let lastDay = 30;
    try {
      hijriToDate(targetYear, targetMonthNumber, 30);
    } catch {
      lastDay = 29;
    }
    
    const monthEnd = hijriToDate(targetYear, targetMonthNumber, lastDay);
    
    // Calculate activation window using ISO dates (precise day arithmetic)
    const activationStart = addDaysToDate(monthStart, -activateDaysBefore);
    const deactivationEnd = addDaysToDate(monthEnd, deactivateDaysAfter);
    
    // Check if current date falls within this window
    if (currentDate >= activationStart && currentDate <= deactivationEnd) {
      return true;
    }
  }
  
  return false;
}

/**
 * التحقق من فعالية تصنيف موسمي بناءً على التاريخ الميلادي
 * Check if seasonal category should be active based on Gregorian date
 */
function shouldActivateGregorianCategory(
  seasonalRules: any,
  currentDate: Date
): boolean {
  // Check by month
  if (seasonalRules.gregorianMonth) {
    const currentMonth = currentDate.getMonth() + 1;
    const targetMonth = seasonalRules.gregorianMonth;
    const activateDaysBefore = seasonalRules.activateDaysBefore || 0;
    const deactivateDaysAfter = seasonalRules.deactivateDaysAfter || 0;
    
    // Calculate date ranges
    const activationDate = new Date(currentDate.getFullYear(), targetMonth - 1, 1);
    activationDate.setDate(activationDate.getDate() - activateDaysBefore);
    
    const deactivationDate = new Date(currentDate.getFullYear(), targetMonth, 0); // Last day of target month
    deactivationDate.setDate(deactivationDate.getDate() + deactivateDaysAfter);
    
    return currentDate >= activationDate && currentDate <= deactivationDate;
  }
  
  // Check by date range
  if (seasonalRules.dateRange) {
    const startDate = new Date(seasonalRules.dateRange.start);
    const endDate = new Date(seasonalRules.dateRange.end);
    
    return currentDate >= startDate && currentDate <= endDate;
  }
  
  return false;
}

/**
 * التحقق من فعالية تصنيف موسمي
 * Check if a seasonal category should be active
 */
export function shouldCategoryBeActive(
  category: any,
  currentDate: Date = new Date()
): boolean {
  if (!category.seasonalRules) return false;
  
  const { seasonalRules } = category;
  
  // Check Hijri-based activation
  if (seasonalRules.hijriMonth) {
    return shouldActivateHijriCategory(seasonalRules, currentDate);
  }
  
  // Check Gregorian-based activation
  if (seasonalRules.gregorianMonth || seasonalRules.dateRange) {
    return shouldActivateGregorianCategory(seasonalRules, currentDate);
  }
  
  return false;
}

/**
 * تفعيل/تعطيل التصنيفات الموسمية تلقائياً
 * Activate/deactivate seasonal categories automatically
 */
export async function updateSeasonalCategories(): Promise<{
  activated: string[];
  deactivated: string[];
}> {
  try {
    const currentDate = new Date();
    
    // Fetch all seasonal categories with autoActivate enabled
    const seasonalCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.type, "seasonal"),
          eq(categories.autoActivate, true)
        )
      );
    
    const activated: string[] = [];
    const deactivated: string[] = [];
    
    for (const category of seasonalCategories) {
      const shouldBeActive = shouldCategoryBeActive(category, currentDate);
      const isCurrentlyActive = category.status === "active";
      
      // Need to activate
      if (shouldBeActive && !isCurrentlyActive) {
        await db
          .update(categories)
          .set({ status: "active" })
          .where(eq(categories.id, category.id));
        
        activated.push(category.nameAr);
        console.log(`[Smart Categories] ✅ Activated: ${category.nameAr} (${category.slug})`);
      }
      
      // Need to deactivate
      if (!shouldBeActive && isCurrentlyActive) {
        await db
          .update(categories)
          .set({ status: "inactive" })
          .where(eq(categories.id, category.id));
        
        deactivated.push(category.nameAr);
        console.log(`[Smart Categories] ⏸️ Deactivated: ${category.nameAr} (${category.slug})`);
      }
    }
    
    if (activated.length > 0 || deactivated.length > 0) {
      console.log(`[Smart Categories] 🔄 Update complete:`, {
        activated: activated.length,
        deactivated: deactivated.length,
      });
    }
    
    return { activated, deactivated };
  } catch (error) {
    console.error("[Smart Categories] ❌ Error updating seasonal categories:", error);
    throw error;
  }
}

/**
 * الحصول على التصنيفات النشطة حسب النوع
 * Get active categories by type
 */
export async function getActiveCategories(type?: "core" | "dynamic" | "smart" | "seasonal") {
  try {
    let query = db
      .select()
      .from(categories)
      .where(eq(categories.status, "active"));
    
    if (type) {
      query = db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.status, "active"),
            eq(categories.type, type)
          )
        );
    }
    
    const results = await query;
    return results;
  } catch (error) {
    console.error("[Smart Categories] ❌ Error fetching active categories:", error);
    throw error;
  }
}

/**
 * الحصول على التصنيفات المنظمة للعرض في الواجهة
 * Get organized categories for UI display
 */
export async function getCategoriesForUI() {
  try {
    const allActive = await db
      .select()
      .from(categories)
      .where(eq(categories.status, "active"))
      .orderBy(categories.displayOrder);
    
    return {
      core: allActive.filter((c: Category) => c.type === "core"),
      dynamic: allActive.filter((c: Category) => c.type === "dynamic"),
      smart: allActive.filter((c: Category) => c.type === "smart"),
      seasonal: allActive.filter((c: Category) => c.type === "seasonal"),
      all: allActive,
    };
  } catch (error) {
    console.error("[Smart Categories] ❌ Error fetching categories for UI:", error);
    throw error;
  }
}

/**
 * تحديث محتوى التصنيفات الديناميكية (الآن، مختارات AI، إلخ)
 * Update content of dynamic categories
 */
export async function updateDynamicCategories(): Promise<void> {
  try {
    const dynamicCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.type, "dynamic"));
    
    for (const category of dynamicCategories) {
      // Logic to update dynamic content based on category slug
      switch (category.slug) {
        case "now":
          // Update "الآن" with trending/breaking news
          console.log(`[Smart Categories] 🔥 Updating "الآن" category...`);
          // TODO: Implement trending news logic
          break;
        
        case "ai-picks":
          // Update "مختارات AI" with personalized recommendations
          console.log(`[Smart Categories] ✨ Updating "مختارات AI" category...`);
          // TODO: Implement AI recommendations logic
          break;
        
        default:
          break;
      }
    }
  } catch (error) {
    console.error("[Smart Categories] ❌ Error updating dynamic categories:", error);
  }
}
