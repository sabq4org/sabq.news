import cron from "node-cron";
import { storage } from "../storage";
import { createNotification } from "../notificationEngine";
import { generateCalendarEventIdeas } from "../services/calendarAi";

/**
 * Calendar Cron Jobs - مهام تقويم سبق الدورية
 * 
 * يتضمن:
 * - توليد المسودات الذكية للأحداث المهمة
 * - إرسال التذكيرات المجدولة
 * - تحديث الأحداث القادمة (تخزين مؤقت)
 */

let isGeneratingDrafts = false;
let isProcessingReminders = false;

/**
 * مهمة دورية لتوليد المسودات الذكية
 * تعمل يوميًا في الساعة 2 صباحًا
 */
export const autoGenerateAiDrafts = cron.schedule('0 2 * * *', async () => {
  if (isGeneratingDrafts) {
    console.log("[CalendarJobs] ⏭️ Skipping AI draft generation - already running");
    return;
  }

  isGeneratingDrafts = true;
  console.log("[CalendarJobs] 🤖 Starting automatic AI draft generation...");

  try {
    // الحصول على الأحداث القادمة المهمة (30 يوم)
    const upcomingEvents = await storage.getUpcomingCalendarEvents(30);
    
    // تصفية الأحداث ذات الأهمية العالية (4 أو 5) والتي لا تحتوي على مسودة
    const highImportanceEvents = upcomingEvents.filter(e => 
      e.importance >= 4
    );

    console.log(`[CalendarJobs] 📊 Found ${highImportanceEvents.length} high-importance events without AI drafts`);

    let generatedCount = 0;
    let skippedCount = 0;

    for (const event of highImportanceEvents) {
      try {
        // التحقق من وجود مسودة
        const existingDraft = await storage.getCalendarAiDraft(event.id);
        
        if (existingDraft) {
          console.log(`[CalendarJobs] ⏭️ Skipping "${event.title}" - draft already exists`);
          skippedCount++;
          continue;
        }

        console.log(`[CalendarJobs] 🎯 Generating AI draft for: ${event.title}`);
        
        const aiDraft = await generateCalendarEventIdeas(
          event.title,
          event.description || '',
          event.type,
          event.dateStart
        );

        await storage.createCalendarAiDraft({
          eventId: event.id,
          editorialIdeas: aiDraft.editorialIdeas,
          headlines: aiDraft.headlines,
          infographicData: aiDraft.infographicData,
          socialMedia: aiDraft.socialMedia,
          seo: aiDraft.seo,
        } as any);

        generatedCount++;
        console.log(`[CalendarJobs] ✅ Draft generated for: ${event.title}`);

        // توقف قصير بين كل طلب لتجنب تجاوز حدود API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[CalendarJobs] ❌ Error generating draft for ${event.title}:`, error);
      }
    }

    console.log(`[CalendarJobs] ✅ AI draft generation complete:`);
    console.log(`   - Generated: ${generatedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
  } catch (error) {
    console.error("[CalendarJobs] ❌ Error in AI draft generation job:", error);
  } finally {
    isGeneratingDrafts = false;
  }
}, {
  timezone: "Asia/Riyadh"
});

/**
 * مهمة دورية لإرسال التذكيرات
 * تعمل كل ساعة
 */
export const processReminders = cron.schedule('0 * * * *', async () => {
  if (isProcessingReminders) {
    console.log("[CalendarJobs] ⏭️ Skipping reminder processing - already running");
    return;
  }

  isProcessingReminders = true;
  console.log("[CalendarJobs] 🔔 Processing calendar reminders...");

  try {
    const now = new Date();
    const reminders = await storage.getRemindersToFire(now);

    console.log(`[CalendarJobs] 📊 Found ${reminders.length} reminders to process`);

    let sentCount = 0;
    let errorCount = 0;

    for (const reminder of reminders) {
      try {
        const event = reminder.event;
        
        // تحديد المستلمين بناءً على المهام المعينة
        const assignments = await storage.getCalendarAssignments({ eventId: event.id });
        
        const recipientIds = [
          ...new Set([
            event.createdById,
            ...assignments
              .filter(a => a.userId && a.status !== 'done')
              .map(a => a.userId!)
          ].filter(Boolean))
        ];

        console.log(`[CalendarJobs] 📧 Sending reminder for "${event.title}" to ${recipientIds.length} users`);

        // إرسال إشعارات لكل مستلم
        for (const userId of recipientIds) {
          try {
            // تحديد نوع الإشعار بناءً على القنوات
            const channels = reminder.channels || ['IN_APP'];
            
            await createNotification({
              type: 'calendar_reminder',
              title: `تذكير: ${event.title}`,
              titleAr: `تذكير: ${event.title}`,
              message: reminder.message || `حدث قادم في ${event.dateStart.toLocaleDateString('ar-SA')}`,
              messageAr: reminder.message || `حدث قادم في ${event.dateStart.toLocaleDateString('ar-SA')}`,
              userId: userId as string,
              link: `/calendar/${event.id}`,
              metadata: {
                eventId: event.id,
                eventType: event.type,
                importance: event.importance,
                channels
              }
            });

            sentCount++;
          } catch (notifError) {
            console.error(`[CalendarJobs] ❌ Error sending notification to user ${userId}:`, notifError);
            errorCount++;
          }
        }

        // تعطيل التذكير بعد الإرسال لتجنب التكرار
        await storage.updateCalendarReminder(reminder.id, { enabled: false });
        
        console.log(`[CalendarJobs] ✅ Reminder processed for: ${event.title}`);
      } catch (error) {
        console.error(`[CalendarJobs] ❌ Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    console.log(`[CalendarJobs] ✅ Reminder processing complete:`);
    console.log(`   - Sent: ${sentCount}`);
    console.log(`   - Errors: ${errorCount}`);
  } catch (error) {
    console.error("[CalendarJobs] ❌ Error in reminder processing job:", error);
  } finally {
    isProcessingReminders = false;
  }
}, {
  timezone: "Asia/Riyadh"
});

/**
 * تخزين مؤقت للأحداث القادمة
 * Cache in-memory للأداء (يمكن استبداله بـ Redis)
 */
let upcomingEventsCache: any[] = [];
let cacheLastUpdated: Date | null = null;

export const updateUpcomingEventsCache = cron.schedule('*/15 * * * *', async () => {
  console.log("[CalendarJobs] 📦 Updating upcoming events cache...");

  try {
    const events = await storage.getUpcomingCalendarEvents(7);
    upcomingEventsCache = events;
    cacheLastUpdated = new Date();
    
    console.log(`[CalendarJobs] ✅ Cache updated with ${events.length} upcoming events`);
  } catch (error) {
    console.error("[CalendarJobs] ❌ Error updating cache:", error);
  }
}, {
  timezone: "Asia/Riyadh"
});

/**
 * الحصول على الأحداث القادمة من الذاكرة المؤقتة
 */
export function getCachedUpcomingEvents() {
  return {
    events: upcomingEventsCache,
    lastUpdated: cacheLastUpdated
  };
}

/**
 * تهيئة وتشغيل جميع المهام الدورية
 */
export function startCalendarJobs() {
  console.log("[CalendarJobs] 🚀 Starting calendar cron jobs...");
  
  autoGenerateAiDrafts.start();
  processReminders.start();
  updateUpcomingEventsCache.start();
  
  // تحديث فوري للذاكرة المؤقتة عند البدء
  updateUpcomingEventsCache.now();
  
  console.log("[CalendarJobs] ✅ All calendar jobs started successfully");
  console.log("[CalendarJobs] 📅 Schedules:");
  console.log("   - AI Draft Generation: Daily at 2:00 AM");
  console.log("   - Reminder Processing: Every hour");
  console.log("   - Cache Update: Every 15 minutes");
}

/**
 * إيقاف جميع المهام الدورية
 */
export function stopCalendarJobs() {
  console.log("[CalendarJobs] 🛑 Stopping calendar cron jobs...");
  
  autoGenerateAiDrafts.stop();
  processReminders.stop();
  updateUpcomingEventsCache.stop();
  
  console.log("[CalendarJobs] ✅ All calendar jobs stopped");
}
