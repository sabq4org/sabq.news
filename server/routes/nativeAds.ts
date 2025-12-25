import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq, and, or, desc, gte, lte, isNull, sql } from "drizzle-orm";
import { nativeAds, nativeAdImpressions, nativeAdClicks, nativeAdDailySpend, insertNativeAdSchema, categories } from "@shared/schema";
import { requireAuth, requireRole } from "../rbac";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Ensure advertiser uploads directory exists in persistent storage
const uploadsDir = "/home/runner/workspace/uploads/advertiser-ads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log(`[NativeAds] Advertiser uploads directory: ${uploadsDir}`);

// Configure multer for advertiser uploads
const advertiserUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for advertisers
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: JPEG, PNG, WEBP, GIF'));
    }
  },
});

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

// Weighted random shuffle - higher priority ads appear more often but with randomization
function weightedRandomShuffle<T extends { priority: number }>(items: T[]): T[] {
  if (items.length <= 1) return items;
  
  const result: T[] = [];
  const remaining = [...items];
  
  while (remaining.length > 0) {
    // Calculate total weight (priority squared for stronger weighting)
    const totalWeight = remaining.reduce((sum, item) => sum + Math.pow(item.priority + 1, 2), 0);
    
    // Pick random value
    let random = Math.random() * totalWeight;
    
    // Find the item
    let selectedIndex = 0;
    for (let i = 0; i < remaining.length; i++) {
      random -= Math.pow(remaining[i].priority + 1, 2);
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }
    
    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }
  
  return result;
}

// Helper function to check and update daily spend for budget enforcement
async function checkAndUpdateDailySpend(adId: string, eventType: 'impression' | 'click', costPerClick: number): Promise<{ allowed: boolean; dailySpend: number; dailyBudget: number }> {
  // Get today's date in Saudi Arabia timezone (UTC+3)
  const now = new Date();
  const saudiOffset = 3 * 60 * 60 * 1000; // UTC+3
  const saudiTime = new Date(now.getTime() + saudiOffset);
  const today = saudiTime.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Get the ad's daily budget
  const [ad] = await db.select().from(nativeAds).where(eq(nativeAds.id, adId)).limit(1);
  if (!ad || !ad.dailyBudgetEnabled || !ad.dailyBudget) {
    return { allowed: true, dailySpend: 0, dailyBudget: 0 };
  }
  
  // Get or create today's spend record
  let [spendRecord] = await db.select().from(nativeAdDailySpend)
    .where(and(
      eq(nativeAdDailySpend.nativeAdId, adId),
      eq(nativeAdDailySpend.spendDate, today)
    )).limit(1);
  
  if (!spendRecord) {
    // Create new record for today
    [spendRecord] = await db.insert(nativeAdDailySpend).values({
      nativeAdId: adId,
      spendDate: today,
    }).returning();
  }
  
  // Calculate cost for this event (only clicks cost money in CPC model)
  const eventCost = eventType === 'click' ? (costPerClick || 0) : 0;
  const newTotal = (spendRecord.amountHalalas || 0) + eventCost;
  
  // Check if this would exceed daily budget
  if (newTotal > ad.dailyBudget) {
    // Budget exceeded - mark as capped
    await db.update(nativeAdDailySpend)
      .set({ isCapped: true, cappedAt: new Date(), updatedAt: new Date() })
      .where(eq(nativeAdDailySpend.id, spendRecord.id));
    
    await db.update(nativeAds)
      .set({ dailyBudgetExhaustedAt: new Date(), updatedAt: new Date() })
      .where(eq(nativeAds.id, adId));
    
    return { allowed: false, dailySpend: spendRecord.amountHalalas, dailyBudget: ad.dailyBudget };
  }
  
  // Update spend record
  const updates: any = { updatedAt: new Date() };
  if (eventType === 'impression') {
    updates.impressions = sql`${nativeAdDailySpend.impressions} + 1`;
  } else {
    updates.clicks = sql`${nativeAdDailySpend.clicks} + 1`;
    updates.amountHalalas = sql`${nativeAdDailySpend.amountHalalas} + ${eventCost}`;
  }
  
  await db.update(nativeAdDailySpend)
    .set(updates)
    .where(eq(nativeAdDailySpend.id, spendRecord.id));
  
  return { allowed: true, dailySpend: newTotal, dailyBudget: ad.dailyBudget };
}

// Helper to get today's date in Saudi timezone for filtering
function getSaudiToday(): string {
  const now = new Date();
  const saudiOffset = 3 * 60 * 60 * 1000; // UTC+3
  const saudiTime = new Date(now.getTime() + saudiOffset);
  return saudiTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Check if an ad's budget was exhausted today (Saudi time)
function isBudgetExhaustedToday(exhaustedAt: Date | null): boolean {
  if (!exhaustedAt) return false;
  const saudiOffset = 3 * 60 * 60 * 1000;
  const exhaustedSaudiTime = new Date(exhaustedAt.getTime() + saudiOffset);
  const exhaustedDate = exhaustedSaudiTime.toISOString().split('T')[0];
  return exhaustedDate === getSaudiToday();
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

    // Filter out ads that have exceeded their daily budget today
    ads = ads.filter(ad => {
      if (!ad.dailyBudgetEnabled) return true;
      return !isBudgetExhaustedToday(ad.dailyBudgetExhaustedAt);
    });

    // Apply weighted random rotation based on priority
    const rotatedAds = weightedRandomShuffle(ads);

    const publicAds = rotatedAds.slice(0, maxLimit).map(ad => ({
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

// Public image upload for self-serve advertisers (no auth required)
router.post("/upload", advertiserUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم اختيار ملف" });
    }

    const file = req.file;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomId}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file to local uploads directory
    fs.writeFileSync(filePath, file.buffer);

    // Return the URL that will be served via the static uploads route
    const publicUrl = `/uploads/advertiser-ads/${filename}`;
    
    console.log(`[NativeAds] Advertiser uploaded image: ${filename}`);
    
    res.json({ 
      success: true,
      url: publicUrl,
      filename: filename
    });
  } catch (error) {
    console.error("[NativeAds] Error uploading advertiser image:", error);
    res.status(500).json({ message: "فشل في رفع الصورة" });
  }
});

// Public endpoint for self-serve ad submission (no auth required)
const selfServeAdSchema = z.object({
  advertiserName: z.string().min(1, "اسم المعلن مطلوب"),
  advertiserEmail: z.string().email("البريد الإلكتروني غير صحيح"),
  advertiserPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  advertiserCompany: z.string().optional(),
  advertiserId: z.string().optional(),
  title: z.string().min(1, "عنوان الإعلان مطلوب").max(100, "العنوان طويل جداً"),
  description: z.string().max(200, "الوصف طويل جداً").optional(),
  imageUrl: z.string().min(1, "صورة الإعلان مطلوبة"),
  destinationUrl: z.string().url("رابط الوجهة غير صحيح"),
  callToAction: z.string().max(30).optional(),
  targetCategories: z.array(z.string()).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

router.post("/submit", async (req: Request, res: Response) => {
  try {
    const validatedData = selfServeAdSchema.parse(req.body);
    
    // Validate advertiserId if provided - must match session or be from valid logged-in advertiser
    let advertiserId = validatedData.advertiserId || null;
    if (advertiserId && req.session.advertiserId !== advertiserId) {
      // Prevent spoofing - if advertiserId doesn't match session, ignore it
      advertiserId = null;
    }
    
    const [newAd] = await db.insert(nativeAds).values({
      title: validatedData.title,
      description: validatedData.description || null,
      imageUrl: validatedData.imageUrl,
      destinationUrl: validatedData.destinationUrl,
      callToAction: validatedData.callToAction || "اقرأ المزيد",
      advertiserName: validatedData.advertiserName,
      advertiserEmail: validatedData.advertiserEmail,
      advertiserPhone: validatedData.advertiserPhone,
      advertiserCompany: validatedData.advertiserCompany || null,
      advertiserId: advertiserId,
      isSelfServe: true,
      targetCategories: validatedData.targetCategories || [],
      targetDevices: "all",
      startDate: validatedData.startDate,
      endDate: validatedData.endDate || null,
      priority: 5,
      status: "pending_approval",
    }).returning();

    console.log(`[NativeAds] New self-serve ad submitted: ${newAd.id} by ${validatedData.advertiserEmail}`);

    res.status(201).json({ 
      success: true, 
      message: "تم استلام طلبك بنجاح! سيتم مراجعة إعلانك والتواصل معك قريباً.",
      adId: newAd.id 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "بيانات غير صحيحة", 
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error("[NativeAds] Error submitting self-serve ad:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إرسال الطلب" });
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

    // Check daily budget (impressions don't cost money, but we still track them)
    const budgetCheck = await checkAndUpdateDailySpend(id, 'impression', ad.costPerClick || 0);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ 
        message: "تم استنفاد الميزانية اليومية لهذا الإعلان",
        dailySpend: budgetCheck.dailySpend,
        dailyBudget: budgetCheck.dailyBudget
      });
    }

    // Only include articleId if it's a valid UUID (36 chars with hyphens)
    const validArticleId = articleId && typeof articleId === 'string' && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId) 
      ? articleId : undefined;

    const [impression] = await db.insert(nativeAdImpressions).values({
      nativeAdId: id,
      articleId: validArticleId,
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

    // Check daily budget before recording click (clicks cost money in CPC model)
    const budgetCheck = await checkAndUpdateDailySpend(id, 'click', ad.costPerClick || 0);
    if (!budgetCheck.allowed) {
      console.log(`[NativeAds] Budget exceeded for ad ${id}: spent ${budgetCheck.dailySpend} halalas of ${budgetCheck.dailyBudget} daily budget`);
      return res.status(429).json({ 
        message: "تم استنفاد الميزانية اليومية لهذا الإعلان",
        dailySpend: budgetCheck.dailySpend,
        dailyBudget: budgetCheck.dailyBudget
      });
    }

    // Only include articleId if it's a valid UUID
    const validArticleId = articleId && typeof articleId === 'string' && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId) 
      ? articleId : undefined;

    await db.insert(nativeAdClicks).values({
      nativeAdId: id,
      impressionId,
      articleId: validArticleId,
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
