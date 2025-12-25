import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq, and, or, desc, gte, lte, isNull, sql } from "drizzle-orm";
import { nativeAds, nativeAdImpressions, nativeAdClicks, insertNativeAdSchema, categories } from "@shared/schema";
import { requireAuth, requireRole } from "../rbac";
import { z } from "zod";

const router = Router();

function isAdminOrEditor(req: Request, res: Response, next: NextFunction) {
  requireRole("admin", "editor", "superadmin", "chief_editor")(req, res, next);
}

function getDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(ua)) {
    if (/tablet|ipad/.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

router.get("/public", async (req: Request, res: Response) => {
  try {
    const { category, keyword, limit: limitParam } = req.query;
    const now = new Date();
    const maxLimit = Math.min(parseInt(limitParam as string) || 5, 6);

    let baseConditions = and(
      eq(nativeAds.status, "active"),
      lte(nativeAds.startDate, now),
      or(isNull(nativeAds.endDate), gte(nativeAds.endDate, now))
    );

    const deviceType = getDeviceType(req.headers["user-agent"]);
    if (deviceType !== "unknown") {
      baseConditions = and(
        baseConditions,
        or(
          eq(nativeAds.targetDevices, "all"),
          eq(nativeAds.targetDevices, deviceType)
        )
      );
    }

    let ads = await db
      .select()
      .from(nativeAds)
      .where(baseConditions)
      .orderBy(desc(nativeAds.priority), desc(nativeAds.createdAt))
      .limit(maxLimit * 2);

    if (category && typeof category === "string") {
      // Look up category by slug to get ID
      const [categoryRecord] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);
      
      const categoryId = categoryRecord?.id;
      
      ads = ads.filter(ad => 
        // Match by category ID or slug (for flexibility)
        ad.targetCategories?.includes(categoryId || category) || 
        ad.targetCategories?.includes(category) ||
        !ad.targetCategories?.length
      );
    }

    if (keyword && typeof keyword === "string") {
      const keywordLower = keyword.toLowerCase();
      ads = ads.filter(ad => 
        ad.targetKeywords?.some(k => k.toLowerCase().includes(keywordLower)) || 
        !ad.targetKeywords?.length
      );
    }

    const publicAds = ads.slice(0, maxLimit).map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      destinationUrl: ad.destinationUrl,
      callToAction: ad.callToAction,
      advertiserName: ad.advertiserName,
      advertiserLogo: ad.advertiserLogo,
      priority: ad.priority,
    }));

    res.json(publicAds);
  } catch (error) {
    console.error("[NativeAds] Error fetching public ads:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الإعلانات" });
  }
});

router.post("/:id/impression", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { articleId, sessionId } = req.body;
    const userId = (req as any).user?.id;
    const userAgent = req.headers["user-agent"];
    const deviceType = getDeviceType(userAgent);
    const ipAddress = getClientIp(req);

    const [ad] = await db.select().from(nativeAds).where(eq(nativeAds.id, id)).limit(1);
    if (!ad) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    const [impression] = await db.insert(nativeAdImpressions).values({
      nativeAdId: id,
      articleId,
      userId,
      sessionId,
      deviceType,
      userAgent,
      ipAddress,
    }).returning();

    await db
      .update(nativeAds)
      .set({ 
        impressions: sql`${nativeAds.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(nativeAds.id, id));

    res.json({ success: true, impressionId: impression.id });
  } catch (error) {
    console.error("[NativeAds] Error tracking impression:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل المشاهدة" });
  }
});

router.post("/:id/click", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { articleId, sessionId, impressionId } = req.body;
    const userId = (req as any).user?.id;
    const userAgent = req.headers["user-agent"];
    const deviceType = getDeviceType(userAgent);
    const ipAddress = getClientIp(req);

    const [ad] = await db.select().from(nativeAds).where(eq(nativeAds.id, id)).limit(1);
    if (!ad) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    await db.insert(nativeAdClicks).values({
      nativeAdId: id,
      impressionId,
      articleId,
      userId,
      sessionId,
      deviceType,
      userAgent,
      ipAddress,
    });

    await db
      .update(nativeAds)
      .set({ 
        clicks: sql`${nativeAds.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(nativeAds.id, id));

    res.json({ success: true, destinationUrl: ad.destinationUrl });
  } catch (error) {
    console.error("[NativeAds] Error tracking click:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل النقرة" });
  }
});

router.get("/analytics", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const { adId, startDate, endDate } = req.query;

    let query = db.select().from(nativeAds);

    if (adId && typeof adId === "string") {
      query = query.where(eq(nativeAds.id, adId)) as typeof query;
    }

    const ads = await query.orderBy(desc(nativeAds.createdAt));

    const analytics = await Promise.all(
      ads.map(async (ad) => {
        let impressionConditions = eq(nativeAdImpressions.nativeAdId, ad.id);
        let clickConditions = eq(nativeAdClicks.nativeAdId, ad.id);

        if (startDate && typeof startDate === "string") {
          const start = new Date(startDate);
          impressionConditions = and(impressionConditions, gte(nativeAdImpressions.createdAt, start)) as any;
          clickConditions = and(clickConditions, gte(nativeAdClicks.createdAt, start)) as any;
        }

        if (endDate && typeof endDate === "string") {
          const end = new Date(endDate);
          impressionConditions = and(impressionConditions, lte(nativeAdImpressions.createdAt, end)) as any;
          clickConditions = and(clickConditions, lte(nativeAdClicks.createdAt, end)) as any;
        }

        const impressionsData = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(nativeAdImpressions)
          .where(impressionConditions);

        const clicksData = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(nativeAdClicks)
          .where(clickConditions);

        const deviceBreakdown = await db
          .select({
            deviceType: nativeAdImpressions.deviceType,
            count: sql<number>`count(*)::int`,
          })
          .from(nativeAdImpressions)
          .where(impressionConditions)
          .groupBy(nativeAdImpressions.deviceType);

        const periodImpressions = impressionsData[0]?.count || 0;
        const periodClicks = clicksData[0]?.count || 0;
        const ctr = periodImpressions > 0 ? (periodClicks / periodImpressions) * 100 : 0;

        return {
          ad: {
            id: ad.id,
            title: ad.title,
            advertiserName: ad.advertiserName,
            status: ad.status,
            startDate: ad.startDate,
            endDate: ad.endDate,
          },
          totalImpressions: ad.impressions,
          totalClicks: ad.clicks,
          periodImpressions,
          periodClicks,
          ctr: Math.round(ctr * 100) / 100,
          deviceBreakdown,
          costPerClick: ad.costPerClick,
          estimatedSpend: periodClicks * (ad.costPerClick || 0),
        };
      })
    );

    const summary = {
      totalAds: ads.length,
      activeAds: ads.filter(a => a.status === "active").length,
      totalImpressions: ads.reduce((sum, a) => sum + a.impressions, 0),
      totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
      averageCtr: analytics.length > 0 
        ? Math.round((analytics.reduce((sum, a) => sum + a.ctr, 0) / analytics.length) * 100) / 100 
        : 0,
    };

    res.json({ analytics, summary });
  } catch (error) {
    console.error("[NativeAds] Error fetching analytics:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب التحليلات" });
  }
});

router.get("/", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(nativeAds);

    if (status && typeof status === "string") {
      query = query.where(eq(nativeAds.status, status)) as typeof query;
    }

    const ads = await query
      .orderBy(desc(nativeAds.priority), desc(nativeAds.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(nativeAds);

    res.json({
      ads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error("[NativeAds] Error fetching ads:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الإعلانات" });
  }
});

router.get("/:id", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [ad] = await db.select().from(nativeAds).where(eq(nativeAds.id, id)).limit(1);

    if (!ad) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    res.json(ad);
  } catch (error) {
    console.error("[NativeAds] Error fetching ad:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الإعلان" });
  }
});

router.post("/", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertNativeAdSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const [newAd] = await db.insert(nativeAds).values({
      ...validatedData,
      createdBy: userId,
    }).returning();

    res.status(201).json(newAd);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "بيانات غير صالحة", 
        errors: error.errors 
      });
    }
    console.error("[NativeAds] Error creating ad:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الإعلان" });
  }
});

router.patch("/:id", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existingAd] = await db.select().from(nativeAds).where(eq(nativeAds.id, id)).limit(1);
    if (!existingAd) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    const updateSchema = insertNativeAdSchema.partial();
    const validatedData = updateSchema.parse(req.body);

    const [updatedAd] = await db
      .update(nativeAds)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(nativeAds.id, id))
      .returning();

    res.json(updatedAd);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "بيانات غير صالحة", 
        errors: error.errors 
      });
    }
    console.error("[NativeAds] Error updating ad:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث الإعلان" });
  }
});

router.delete("/:id", requireAuth, isAdminOrEditor, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existingAd] = await db.select().from(nativeAds).where(eq(nativeAds.id, id)).limit(1);
    if (!existingAd) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    await db.delete(nativeAds).where(eq(nativeAds.id, id));

    res.json({ success: true, message: "تم حذف الإعلان بنجاح" });
  } catch (error) {
    console.error("[NativeAds] Error deleting ad:", error);
    res.status(500).json({ message: "حدث خطأ أثناء حذف الإعلان" });
  }
});

export default router;
