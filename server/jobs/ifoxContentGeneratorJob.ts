import cron from "node-cron";
import { ifoxCalendarService } from "../services/ifox";
import { createNotification } from "../notificationEngine";

/**
 * iFox Content Generator Job
 * معالج تلقائي لمهام توليد المحتوى المجدولة
 * 
 * يعمل كل دقيقة للتحقق من المهام المجدولة وتنفيذها
 */

let isProcessing = false;

export const processScheduledContentTasks = cron.schedule('* * * * *', async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();
    
    // Get scheduled tasks that are ready to run
    const entries = await ifoxCalendarService.listEntries({
      scheduledDateFrom: new Date(now.getTime() - 60000), // 1 minute ago
      scheduledDateTo: now,
      status: 'planned',
    });

    if (!entries || entries.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`[iFox Generator] 🤖 Found ${entries.length} tasks ready to process`);

    for (const entry of entries) {
      try {
        const topicIdea = entry.topicIdea || 'محتوى جديد';
        console.log(`[iFox Generator] 🚀 Processing task: ${topicIdea}`);

        // Update status to processing
        await ifoxCalendarService.updateEntry(entry.id, {
          status: 'in_progress',
        }, entry.createdBy);

        // Here you would call your AI content generation service
        // For now, we'll just mark it as completed
        // In a real implementation, you'd:
        // 1. Call AI service to generate content
        // 2. Create article draft
        // 3. Link article to calendar entry
        // 4. Send notification to creator

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark as completed
        await ifoxCalendarService.updateEntry(entry.id, {
          status: 'completed',
          actualPublishedAt: new Date(),
        }, entry.createdBy);

        // Send notification to creator (using valid type)
        try {
          await createNotification({
            type: 'NEW_ARTICLE',
            title: 'مهمة AI مكتملة',
            titleAr: 'مهمة AI مكتملة',
            message: `تم إكمال مهمة "${topicIdea}" بنجاح`,
            messageAr: `تم إكمال مهمة "${topicIdea}" بنجاح`,
            userId: entry.createdBy,
            link: `/dashboard/admin/ifox/content-generator`,
            metadata: {
              calendarEntryId: entry.id,
              taskTopic: topicIdea,
            }
          });
        } catch (notifError) {
          console.error(`[iFox Generator] ⚠️ Could not send notification:`, notifError);
        }

        console.log(`[iFox Generator] ✅ Task completed: ${topicIdea}`);
      } catch (error) {
        console.error(`[iFox Generator] ❌ Error processing task ${entry.id}:`, error);
        
        // Mark as failed (reset to planned for retry)
        try {
          await ifoxCalendarService.updateEntry(entry.id, {
            status: 'planned',
          }, entry.createdBy);
        } catch (updateError) {
          console.error(`[iFox Generator] ❌ Failed to update task status:`, updateError);
        }
      }
    }

    console.log(`[iFox Generator] ✅ Batch processing complete`);
  } catch (error) {
    console.error("[iFox Generator] ❌ Error in content generator job:", error);
  } finally {
    isProcessing = false;
  }
}, {
  timezone: "Asia/Riyadh"
});

/**
 * Start the iFox content generator job
 */
export function startIfoxContentGeneratorJob() {
  console.log("[iFox Generator] 🚀 Starting iFox content generator job...");
  processScheduledContentTasks.start();
  console.log("[iFox Generator] ✅ Job started (runs every minute)");
}

/**
 * Stop the iFox content generator job
 */
export function stopIfoxContentGeneratorJob() {
  console.log("[iFox Generator] 🛑 Stopping iFox content generator job...");
  processScheduledContentTasks.stop();
  console.log("[iFox Generator] ✅ Job stopped");
}
