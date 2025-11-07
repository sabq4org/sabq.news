import { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  adAccounts, 
  campaigns, 
  adGroups, 
  creatives,
  inventorySlots,
  impressions,
  clicks,
  conversions,
  dailyStats,
  budgetHistory,
  aiRecommendations,
  auditLogs,
  insertAdAccountSchema,
  insertCampaignSchema,
  insertAdGroupSchema,
  insertCreativeSchema,
  insertInventorySlotSchema
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { 
  AdAccount, 
  Campaign, 
  AdGroup, 
  Creative,
  CampaignWithDetails
} from "@shared/schema";

const router = Router();

// ============================================
// MIDDLEWARE - التحقق من الصلاحيات
// ============================================

// التحقق من أن المستخدم معلن أو مشرف
function requireAdvertiser(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  
  const userRole = (req.user as any)?.role;
  const allowedRoles = ["advertiser", "admin", "superadmin"];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: "ليس لديك صلاحية الوصول إلى نظام الإعلانات" });
  }
  
  next();
}

// التحقق من أن المستخدم مشرف
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  
  const userRole = (req.user as any)?.role;
  const allowedRoles = ["admin", "superadmin"];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: "يجب أن تكون مشرفاً للقيام بهذا الإجراء" });
  }
  
  next();
}

// ============================================
// AD ACCOUNTS - حسابات المعلنين
// ============================================

// إنشاء حساب معلن جديد
router.post("/accounts", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    
    // التحقق من وجود حساب نشط للمستخدم
    const existingAccount = await db
      .select()
      .from(adAccounts)
      .where(and(
        eq(adAccounts.userId, userId),
        eq(adAccounts.status, "active")
      ))
      .limit(1);
    
    if (existingAccount.length > 0) {
      return res.status(400).json({ 
        error: "لديك حساب معلن نشط بالفعل" 
      });
    }
    
    // التحقق من البيانات
    const validation = insertAdAccountSchema.safeParse({
      ...req.body,
      userId
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: validation.error.errors 
      });
    }
    
    // إنشاء الحساب
    const [account] = await db
      .insert(adAccounts)
      .values(validation.data as typeof adAccounts.$inferInsert)
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "ad_account",
      entityId: account.id,
      action: "create",
      changes: { after: account },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(account);
  } catch (error) {
    console.error("[Ads API] خطأ في إنشاء حساب المعلن:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء الحساب" });
  }
});

// الحصول على حساب المعلن الخاص بالمستخدم
router.get("/accounts/me", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    
    const [account] = await db
      .select()
      .from(adAccounts)
      .where(eq(adAccounts.userId, userId))
      .limit(1);
    
    if (!account) {
      return res.status(404).json({ error: "لم يتم العثور على حساب معلن" });
    }
    
    res.json(account);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب حساب المعلن:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// ============================================
// CAMPAIGNS - الحملات الإعلانية
// ============================================

// إنشاء حملة جديدة
router.post("/campaigns", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    
    // الحصول على حساب المعلن
    const [account] = await db
      .select()
      .from(adAccounts)
      .where(and(
        eq(adAccounts.userId, userId),
        eq(adAccounts.status, "active")
      ))
      .limit(1);
    
    if (!account) {
      return res.status(404).json({ 
        error: "يجب إنشاء حساب معلن أولاً" 
      });
    }
    
    // التحقق من البيانات
    const validation = insertCampaignSchema.safeParse({
      ...req.body,
      accountId: account.id,
      status: "draft" // دائماً تبدأ كمسودة
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: validation.error.errors 
      });
    }
    
    // التحقق من أن الميزانية الإجمالية أكبر من اليومية
    if (validation.data.totalBudget <= validation.data.dailyBudget) {
      return res.status(400).json({ 
        error: "الميزانية الإجمالية يجب أن تكون أكبر من الميزانية اليومية" 
      });
    }
    
    // إنشاء الحملة
    const [campaign] = await db
      .insert(campaigns)
      .values(validation.data)
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "create",
      changes: { after: campaign },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(campaign);
  } catch (error) {
    console.error("[Ads API] خطأ في إنشاء الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء الحملة" });
  }
});

// الحصول على جميع حملات المعلن
router.get("/campaigns", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    
    let query;
    
    // إذا كان مشرفاً، يرى جميع الحملات
    if (["admin", "superadmin"].includes(userRole)) {
      query = db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt));
    } else {
      // المعلن يرى حملاته فقط
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(eq(adAccounts.userId, userId))
        .limit(1);
      
      if (!account) {
        return res.json([]);
      }
      
      query = db
        .select()
        .from(campaigns)
        .where(eq(campaigns.accountId, account.id))
        .orderBy(desc(campaigns.createdAt));
    }
    
    const results = await query;
    
    res.json(results);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب الحملات:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// الحصول على تفاصيل حملة محددة
router.get("/campaigns/:id", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.id;
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    // التحقق من الصلاحية (المشرف يرى كل شيء، المعلن يرى حملاته فقط)
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية الوصول لهذه الحملة" });
      }
    }
    
    // جلب المجموعات الإعلانية
    const groups = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.campaignId, campaignId));
    
    // حساب الإحصائيات
    const stats = await db
      .select({
        totalImpressions: sql<number>`COUNT(DISTINCT ${impressions.id})::int`,
        totalClicks: sql<number>`COUNT(DISTINCT CASE WHEN ${clicks.id} IS NOT NULL THEN ${clicks.id} END)::int`,
        totalConversions: sql<number>`COUNT(DISTINCT CASE WHEN ${conversions.id} IS NOT NULL THEN ${conversions.id} END)::int`
      })
      .from(impressions)
      .leftJoin(clicks, eq(clicks.impressionId, impressions.id))
      .leftJoin(conversions, eq(conversions.clickId, clicks.id))
      .where(eq(impressions.campaignId, campaignId));
    
    const totalImpressions = stats[0]?.totalImpressions || 0;
    const totalClicks = stats[0]?.totalClicks || 0;
    const totalConversions = stats[0]?.totalConversions || 0;
    
    const ctr = totalImpressions > 0 
      ? (totalClicks / totalImpressions) * 100 
      : 0;
    const conversionRate = totalClicks > 0 
      ? (totalConversions / totalClicks) * 100 
      : 0;
    
    // جلب التوصيات
    const recommendations = await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.campaignId, campaignId))
      .orderBy(desc(aiRecommendations.createdAt))
      .limit(5);
    
    const result: CampaignWithDetails = {
      ...campaign,
      adGroups: groups,
      stats: {
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr,
        conversionRate
      },
      recommendations
    };
    
    res.json(result);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب تفاصيل الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// تحديث حملة
router.put("/campaigns/:id", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.id;
    
    // جلب الحملة الحالية
    const [existingCampaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!existingCampaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    // التحقق من الصلاحية
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, existingCampaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية تعديل هذه الحملة" });
      }
      
      // المعلن لا يمكنه تعديل الحملة بعد الموافقة عليها
      if (["active", "completed"].includes(existingCampaign.status)) {
        return res.status(403).json({ 
          error: "لا يمكن تعديل الحملة بعد الموافقة عليها أو إكمالها" 
        });
      }
    }
    
    // تحديث البيانات
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaignId,
      action: "update",
      changes: {
        before: existingCampaign,
        after: updatedCampaign
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error("[Ads API] خطأ في تحديث الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في تحديث الحملة" });
  }
});

// حذف حملة (soft delete)
router.delete("/campaigns/:id", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.id;
    
    // جلب الحملة
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    // التحقق من الصلاحية
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية حذف هذه الحملة" });
      }
    }
    
    // تعيين الحالة كـ completed بدلاً من الحذف الفعلي
    const [deletedCampaign] = await db
      .update(campaigns)
      .set({
        status: "completed",
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaignId,
      action: "delete",
      changes: {
        before: campaign,
        after: deletedCampaign
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json({ message: "تم حذف الحملة بنجاح", campaign: deletedCampaign });
  } catch (error) {
    console.error("[Ads API] خطأ في حذف الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في حذف الحملة" });
  }
});

// إرسال حملة للمراجعة
router.post("/campaigns/:id/submit", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const campaignId = req.params.id;
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    // التحقق من الملكية
    const [account] = await db
      .select()
      .from(adAccounts)
      .where(and(
        eq(adAccounts.userId, userId),
        eq(adAccounts.id, campaign.accountId)
      ))
      .limit(1);
    
    if (!account) {
      return res.status(403).json({ error: "ليس لديك صلاحية على هذه الحملة" });
    }
    
    // التحقق من أن الحملة مسودة
    if (campaign.status !== "draft") {
      return res.status(400).json({ 
        error: "يمكن إرسال المسودات فقط للمراجعة" 
      });
    }
    
    // تحديث الحالة
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        status: "pending_review",
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaignId,
      action: "submit",
      changes: {
        before: { status: campaign.status },
        after: { status: "pending_review" }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error("[Ads API] خطأ في إرسال الحملة للمراجعة:", error);
    res.status(500).json({ error: "حدث خطأ في إرسال الحملة" });
  }
});

// ============================================================
// AD GROUPS MANAGEMENT - إدارة مجموعات الإعلانات
// ============================================================

// إنشاء مجموعة إعلانات جديدة
router.post("/ad-groups", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    
    const validation = insertAdGroupSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: validation.error.errors 
      });
    }
    
    // التحقق من أن الحملة موجودة وأن المستخدم لديه صلاحية
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, validation.data.campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية على هذه الحملة" });
      }
    }
    
    const [adGroup] = await db
      .insert(adGroups)
      .values(validation.data)
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "ad_group",
      entityId: adGroup.id,
      action: "create",
      changes: { after: adGroup },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(adGroup);
  } catch (error) {
    console.error("[Ads API] خطأ في إنشاء مجموعة الإعلانات:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء المجموعة" });
  }
});

// جلب جميع مجموعات الإعلانات لحملة معينة
router.get("/campaigns/:campaignId/ad-groups", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.campaignId;
    
    // التحقق من الصلاحية
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    const groups = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.campaignId, campaignId))
      .orderBy(desc(adGroups.createdAt));
    
    res.json(groups);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب المجموعات:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// تحديث مجموعة إعلانات
router.put("/ad-groups/:id", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const adGroupId = req.params.id;
    
    const [existingGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, adGroupId))
      .limit(1);
    
    if (!existingGroup) {
      return res.status(404).json({ error: "المجموعة غير موجودة" });
    }
    
    // التحقق من الصلاحية
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, existingGroup.campaignId))
      .limit(1);
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign!.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    const [updatedGroup] = await db
      .update(adGroups)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(adGroups.id, adGroupId))
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "ad_group",
      entityId: adGroupId,
      action: "update",
      changes: {
        before: existingGroup,
        after: updatedGroup
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updatedGroup);
  } catch (error) {
    console.error("[Ads API] خطأ في تحديث المجموعة:", error);
    res.status(500).json({ error: "حدث خطأ في التحديث" });
  }
});

// ============================================================
// CREATIVES MANAGEMENT - إدارة الإعلانات الفردية
// ============================================================

// إنشاء إعلان جديد
router.post("/creatives", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    
    const validation = insertCreativeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: validation.error.errors 
      });
    }
    
    // التحقق من أن المجموعة موجودة وأن المستخدم لديه صلاحية
    const [adGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, validation.data.adGroupId))
      .limit(1);
    
    if (!adGroup) {
      return res.status(404).json({ error: "مجموعة الإعلانات غير موجودة" });
    }
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, adGroup.campaignId))
      .limit(1);
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign!.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    const [creative] = await db
      .insert(creatives)
      .values(validation.data)
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "creative",
      entityId: creative.id,
      action: "create",
      changes: { after: creative },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(creative);
  } catch (error) {
    console.error("[Ads API] خطأ في إنشاء الإعلان:", error);
    res.status(500).json({ error: "حدث خطأ في إنشاء الإعلان" });
  }
});

// جلب جميع الإعلانات لمجموعة معينة
router.get("/ad-groups/:adGroupId/creatives", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const adGroupId = req.params.adGroupId;
    
    // التحقق من الصلاحية
    const [adGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, adGroupId))
      .limit(1);
    
    if (!adGroup) {
      return res.status(404).json({ error: "المجموعة غير موجودة" });
    }
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, adGroup.campaignId))
      .limit(1);
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign!.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    const allCreatives = await db
      .select()
      .from(creatives)
      .where(eq(creatives.adGroupId, adGroupId))
      .orderBy(desc(creatives.createdAt));
    
    res.json(allCreatives);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب الإعلانات:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// تحديث إعلان
router.put("/creatives/:id", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const creativeId = req.params.id;
    
    const [existingCreative] = await db
      .select()
      .from(creatives)
      .where(eq(creatives.id, creativeId))
      .limit(1);
    
    if (!existingCreative) {
      return res.status(404).json({ error: "الإعلان غير موجود" });
    }
    
    // التحقق من الصلاحية
    const [adGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, existingCreative.adGroupId))
      .limit(1);
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, adGroup!.campaignId))
      .limit(1);
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign!.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    const [updatedCreative] = await db
      .update(creatives)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(creatives.id, creativeId))
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "creative",
      entityId: creativeId,
      action: "update",
      changes: {
        before: existingCreative,
        after: updatedCreative
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updatedCreative);
  } catch (error) {
    console.error("[Ads API] خطأ في تحديث الإعلان:", error);
    res.status(500).json({ error: "حدث خطأ في التحديث" });
  }
});

// ============================================================
// ADMIN APPROVAL - موافقة الإدارة
// ============================================================

// موافقة على حملة (مشرف فقط)
router.post("/campaigns/:id/approve", requireAdmin, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const campaignId = req.params.id;
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (campaign.status !== "pending_review") {
      return res.status(400).json({ 
        error: "يمكن الموافقة على الحملات قيد المراجعة فقط" 
      });
    }
    
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        status: "active",
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaignId,
      action: "approve",
      changes: {
        before: { status: campaign.status },
        after: { status: "active" }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error("[Ads API] خطأ في الموافقة على الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في الموافقة" });
  }
});

// رفض حملة (مشرف فقط)
router.post("/campaigns/:id/reject", requireAdmin, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const campaignId = req.params.id;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: "يجب تقديم سبب الرفض" });
    }
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (campaign.status !== "pending_review") {
      return res.status(400).json({ 
        error: "يمكن رفض الحملات قيد المراجعة فقط" 
      });
    }
    
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        status: "rejected",
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    await db.insert(auditLogs).values({
      userId,
      entityType: "campaign",
      entityId: campaignId,
      action: "reject",
      changes: {
        before: { status: campaign.status },
        after: { status: "rejected", reason }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json({ ...updatedCampaign, rejectionReason: reason });
  } catch (error) {
    console.error("[Ads API] خطأ في رفض الحملة:", error);
    res.status(500).json({ error: "حدث خطأ في الرفض" });
  }
});

// جلب جميع الحملات التي تحتاج مراجعة (مشرف فقط)
router.get("/pending-campaigns", requireAdmin, async (req, res) => {
  try {
    const pendingCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "pending_review"))
      .orderBy(desc(campaigns.createdAt));
    
    res.json(pendingCampaigns);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب الحملات المعلقة:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// ============================================================
// ADVANCED ANALYTICS - التحليلات المتقدمة
// ============================================================

// تحليلات الحملة التفصيلية
router.get("/campaigns/:id/analytics", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.id;
    const { startDate, endDate } = req.query;
    
    // التحقق من الصلاحية
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    // جلب الإحصائيات اليومية
    let dailyStatsQuery = db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.campaignId, campaignId))
      .orderBy(desc(dailyStats.date));
    
    if (startDate && endDate) {
      dailyStatsQuery = dailyStatsQuery.where(
        and(
          gte(dailyStats.date, new Date(startDate as string)),
          sql`${dailyStats.date} <= ${new Date(endDate as string)}`
        )
      );
    }
    
    const stats = await dailyStatsQuery.limit(30);
    
    // حساب المقاييس الإجمالية
    const totalImpressions = stats.reduce((sum, s) => sum + (s.impressions || 0), 0);
    const totalClicks = stats.reduce((sum, s) => sum + (s.clicks || 0), 0);
    const totalConversions = stats.reduce((sum, s) => sum + (s.conversions || 0), 0);
    const totalSpent = stats.reduce((sum, s) => sum + Number(s.spent || 0), 0);
    
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const avgCpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        totalBudget: campaign.totalBudget,
        dailyBudget: campaign.dailyBudget
      },
      metrics: {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpent,
        avgCtr: Math.round(avgCtr * 100) / 100,
        avgCpc: Math.round(avgCpc * 100) / 100,
        avgCpm: Math.round(avgCpm * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      dailyStats: stats,
      budgetUtilization: {
        spent: totalSpent,
        total: Number(campaign.totalBudget),
        percentage: Math.round((totalSpent / Number(campaign.totalBudget)) * 100)
      }
    });
  } catch (error) {
    console.error("[Ads API] خطأ في جلب التحليلات:", error);
    res.status(500).json({ error: "حدث خطأ في جلب التحليلات" });
  }
});

// تحليلات الإعلان الفردي
router.get("/creatives/:id/performance", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const creativeId = req.params.id;
    
    const [creative] = await db
      .select()
      .from(creatives)
      .where(eq(creatives.id, creativeId))
      .limit(1);
    
    if (!creative) {
      return res.status(404).json({ error: "الإعلان غير موجود" });
    }
    
    // التحقق من الصلاحية
    const [adGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, creative.adGroupId))
      .limit(1);
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, adGroup!.campaignId))
      .limit(1);
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign!.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    // جلب الأداء
    const performanceData = await db
      .select({
        impressionsCount: sql<number>`COUNT(DISTINCT ${impressions.id})::int`,
        clicksCount: sql<number>`COUNT(DISTINCT CASE WHEN ${clicks.id} IS NOT NULL THEN ${clicks.id} END)::int`,
        conversionsCount: sql<number>`COUNT(DISTINCT CASE WHEN ${conversions.id} IS NOT NULL THEN ${conversions.id} END)::int`
      })
      .from(impressions)
      .leftJoin(clicks, eq(clicks.impressionId, impressions.id))
      .leftJoin(conversions, eq(conversions.clickId, clicks.id))
      .where(eq(impressions.creativeId, creativeId));
    
    const perf = performanceData[0];
    const ctr = perf.impressionsCount > 0 
      ? (perf.clicksCount / perf.impressionsCount) * 100 
      : 0;
    
    res.json({
      creative: {
        id: creative.id,
        name: creative.name,
        type: creative.type,
        status: creative.status
      },
      performance: {
        impressions: perf.impressionsCount,
        clicks: perf.clicksCount,
        conversions: perf.conversionsCount,
        ctr: Math.round(ctr * 100) / 100
      }
    });
  } catch (error) {
    console.error("[Ads API] خطأ في جلب أداء الإعلان:", error);
    res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
  }
});

// ============================================================
// AI RECOMMENDATIONS - التوصيات الذكية
// ============================================================

// جلب توصيات AI للحملة
router.get("/campaigns/:id/ai-recommendations", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    const campaignId = req.params.id;
    
    // التحقق من الصلاحية
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      return res.status(404).json({ error: "الحملة غير موجودة" });
    }
    
    if (!["admin", "superadmin"].includes(userRole)) {
      const [account] = await db
        .select()
        .from(adAccounts)
        .where(and(
          eq(adAccounts.userId, userId),
          eq(adAccounts.id, campaign.accountId)
        ))
        .limit(1);
      
      if (!account) {
        return res.status(403).json({ error: "ليس لديك صلاحية" });
      }
    }
    
    // جلب التوصيات الحالية من قاعدة البيانات
    const recommendations = await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.campaignId, campaignId))
      .orderBy(desc(aiRecommendations.createdAt))
      .limit(10);
    
    // إذا لم توجد توصيات حديثة، إنشاء توصيات جديدة
    if (recommendations.length === 0 || 
        (recommendations[0] && new Date().getTime() - new Date(recommendations[0].createdAt).getTime() > 24 * 60 * 60 * 1000)) {
      
      // جلب إحصائيات الحملة
      const stats = await db
        .select({
          totalImpressions: sql<number>`COALESCE(SUM(${dailyStats.impressions}), 0)::int`,
          totalClicks: sql<number>`COALESCE(SUM(${dailyStats.clicks}), 0)::int`,
          totalSpent: sql<number>`COALESCE(SUM(${dailyStats.spent}), 0)::numeric`,
          avgCtr: sql<number>`CASE WHEN SUM(${dailyStats.impressions}) > 0 THEN (SUM(${dailyStats.clicks})::float / SUM(${dailyStats.impressions})::float * 100) ELSE 0 END`
        })
        .from(dailyStats)
        .where(eq(dailyStats.campaignId, campaignId));
      
      const campaignStats = stats[0];
      
      // إنشاء توصيات استناداً إلى الأداء
      const newRecommendations: typeof aiRecommendations.$inferInsert[] = [];
      
      // توصية 1: تحسين CTR إذا كان منخفضاً
      if (campaignStats.avgCtr < 1.0) {
        newRecommendations.push({
          campaignId,
          type: "optimization",
          title: "تحسين معدل النقر (CTR)",
          description: "معدل النقر الحالي أقل من المتوسط. قم بتحديث نص الإعلان والصور لجعلها أكثر جاذبية.",
          priority: "high",
          expectedImpact: 25,
          implementationSteps: ["تحليل الإعلانات ذات الأداء الأفضل", "تحديث النصوص الإعلانية", "اختبار صور جديدة"]
        });
      }
      
      // توصية 2: تحسين الميزانية
      const budgetUsage = Number(campaignStats.totalSpent) / Number(campaign.totalBudget);
      if (budgetUsage > 0.8) {
        newRecommendations.push({
          campaignId,
          type: "budget",
          title: "زيادة الميزانية",
          description: `تم إنفاق ${Math.round(budgetUsage * 100)}% من الميزانية. فكر في زيادة الميزانية للحفاظ على الزخم.`,
          priority: "medium",
          expectedImpact: 20,
          implementationSteps: ["مراجعة أداء الحملة", "تحديد ميزانية إضافية", "تطبيق الزيادة"]
        });
      }
      
      // توصية 3: تحسين الاستهداف
      if (campaignStats.totalClicks > 100 && campaignStats.avgCtr < 2.0) {
        newRecommendations.push({
          campaignId,
          type: "targeting",
          title: "تحسين استهداف الجمهور",
          description: "النتائج تشير إلى إمكانية تحسين الاستهداف. قم بمراجعة معايير الجمهور المستهدف.",
          priority: "medium",
          expectedImpact: 30,
          implementationSteps: ["تحليل البيانات الديموغرافية", "تعديل معايير الاستهداف", "إنشاء جماهير مشابهة"]
        });
      }
      
      // حفظ التوصيات الجديدة
      if (newRecommendations.length > 0) {
        await db.insert(aiRecommendations).values(newRecommendations);
      }
      
      // جلب التوصيات المحدثة
      const updatedRecs = await db
        .select()
        .from(aiRecommendations)
        .where(eq(aiRecommendations.campaignId, campaignId))
        .orderBy(desc(aiRecommendations.createdAt))
        .limit(10);
      
      return res.json(updatedRecs);
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error("[Ads API] خطأ في جلب توصيات AI:", error);
    res.status(500).json({ error: "حدث خطأ في جلب التوصيات" });
  }
});

// تطبيق توصية AI
router.post("/recommendations/:id/apply", requireAdvertiser, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const recommendationId = req.params.id;
    
    const [recommendation] = await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.id, recommendationId))
      .limit(1);
    
    if (!recommendation) {
      return res.status(404).json({ error: "التوصية غير موجودة" });
    }
    
    // تحديث حالة التوصية
    const [updated] = await db
      .update(aiRecommendations)
      .set({
        status: "applied",
        appliedAt: new Date()
      })
      .where(eq(aiRecommendations.id, recommendationId))
      .returning();
    
    // تسجيل في audit log
    await db.insert(auditLogs).values({
      userId,
      entityType: "recommendation",
      entityId: recommendationId,
      action: "apply",
      changes: {
        before: { status: recommendation.status },
        after: { status: "applied" }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    
    res.json(updated);
  } catch (error) {
    console.error("[Ads API] خطأ في تطبيق التوصية:", error);
    res.status(500).json({ error: "حدث خطأ في تطبيق التوصية" });
  }
});

// ============================================================
// RTB (REAL-TIME BIDDING) - المزاد الآني
// ============================================================

// RTB Endpoint - للاستخدام الداخلي فقط
router.post("/rtb/bid-request", async (req, res) => {
  try {
    const {
      slotId,
      userContext,
      pageContext
    } = req.body;
    
    // التحقق من وجود مساحة إعلانية
    const [slot] = await db
      .select()
      .from(inventorySlots)
      .where(and(
        eq(inventorySlots.id, slotId),
        eq(inventorySlots.status, "active")
      ))
      .limit(1);
    
    if (!slot) {
      return res.status(404).json({ error: "مساحة الإعلان غير متاحة" });
    }
    
    // البحث عن الحملات النشطة المناسبة
    const activeCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.status, "active"),
        sql`${campaigns.totalBudget} > (
          SELECT COALESCE(SUM(spent), 0) 
          FROM ${dailyStats} 
          WHERE campaign_id = ${campaigns.id}
        )`
      ))
      .limit(20);
    
    if (activeCampaigns.length === 0) {
      return res.status(204).send(); // No ads to show
    }
    
    // حساب نقاط المزايدة (bidding score) لكل حملة
    const bids = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        // جلب الإعلانات النشطة للحملة
        const campaignAds = await db
          .select()
          .from(creatives)
          .innerJoin(adGroups, eq(adGroups.id, creatives.adGroupId))
          .where(and(
            eq(adGroups.campaignId, campaign.id),
            eq(creatives.status, "active")
          ))
          .limit(5);
        
        if (campaignAds.length === 0) return null;
        
        // حساب CTR المتوقع بناءً على الأداء السابق
        const perfStats = await db
          .select({
            avgCtr: sql<number>`CASE WHEN SUM(${dailyStats.impressions}) > 0 THEN (SUM(${dailyStats.clicks})::float / SUM(${dailyStats.impressions})::float) ELSE 0.01 END`
          })
          .from(dailyStats)
          .where(eq(dailyStats.campaignId, campaign.id));
        
        const predictedCtr = perfStats[0]?.avgCtr || 0.01;
        
        // حساب سعر المزايدة بناءً على نوع الهدف
        let bidAmount = 0;
        if (campaign.objective === "cpm") {
          bidAmount = Number(campaign.dailyBudget) / 1000; // CPM
        } else if (campaign.objective === "cpc") {
          bidAmount = Number(campaign.dailyBudget) * predictedCtr; // CPC * predicted CTR
        } else if (campaign.objective === "cpa") {
          bidAmount = Number(campaign.dailyBudget) * predictedCtr * 0.1; // CPA with conversion estimate
        }
        
        return {
          campaignId: campaign.id,
          creative: campaignAds[0].creatives,
          bidAmount,
          predictedCtr,
          score: bidAmount * predictedCtr * 100 // Combined score
        };
      })
    );
    
    // إزالة القيم الفارغة والترتيب حسب النقاط
    const validBids = bids
      .filter(bid => bid !== null)
      .sort((a, b) => b!.score - a!.score);
    
    if (validBids.length === 0) {
      return res.status(204).send();
    }
    
    // اختيار الفائز
    const winner = validBids[0];
    
    // تسجيل الظهور
    await db.insert(impressions).values({
      campaignId: winner!.campaignId,
      adGroupId: winner!.creative.adGroupId,
      creativeId: winner!.creative.id,
      userId: userContext?.userId || null,
      deviceType: userContext?.deviceType || "desktop",
      location: userContext?.location || null,
      cost: winner!.bidAmount
    });
    
    res.json({
      creative: winner!.creative,
      impressionCost: winner!.bidAmount
    });
  } catch (error) {
    console.error("[RTB] خطأ في معالجة طلب المزايدة:", error);
    res.status(500).json({ error: "حدث خطأ في المزايدة" });
  }
});

export default router;
