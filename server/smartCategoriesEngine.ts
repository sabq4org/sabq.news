/**
 * Smart Categories Engine
 * محرك التصنيفات الذكية - يدير التصنيفات الديناميكية والموسمية تلقائياً
 */

import { db } from "./db";
import { categories, type Category } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface HijriDate {
  year: number;
  month: string;
  day: number;
}

/**
 * تحويل تاريخ ميلادي إلى هجري (تقريبي)
 * Convert Gregorian to Hijri (approximate)
 */
function gregorianToHijri(date: Date): HijriDate {
  // Simplified conversion - in production, use a proper library like moment-hijri
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  // Approximate conversion (Hijri year is ~354 days)
  const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
  
  // Hijri months (Arabic names)
  const hijriMonths = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
    "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];
  
  // Approximate month calculation
  const monthIndex = Math.floor((gregorianMonth - 1) * 0.97) % 12;
  
  return {
    year: hijriYear,
    month: hijriMonths[monthIndex],
    day: gregorianDay
  };
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
  
  const hijri = gregorianToHijri(currentDate);
  const targetMonth = seasonalRules.hijriMonth;
  const activateDaysBefore = seasonalRules.activateDaysBefore || 0;
  const deactivateDaysAfter = seasonalRules.deactivateDaysAfter || 0;
  
  // Simple check: is current Hijri month matching?
  // In production, implement proper date range checking
  if (hijri.month === targetMonth) {
    return true;
  }
  
  // Check if we should activate early (days before)
  // TODO: Implement proper Hijri date arithmetic
  
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
