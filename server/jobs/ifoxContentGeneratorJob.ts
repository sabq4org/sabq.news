import cron from "node-cron";
import { ifoxCalendarService } from "../services/ifox";

/**
 * iFox Content Generator Job
 * معالج تلقائي لمهام توليد المحتوى المجدولة
 * 
 * يعمل كل دقيقة للتحقق من المهام المجدولة وتنفيذها
 */

let isProcessing = false;

// Process at most 10 tasks per run to prevent worker monopolization
// This protects the system even when there's a large backlog after downtime
const MAX_BATCH_SIZE = 10;

// Maximum retry attempts before moving task to 'failed' status
const MAX_RETRY_ATTEMPTS = 3;

export const processScheduledContentTasks = cron.schedule('* * * * *', async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();
    
    // Get ALL scheduled tasks that are ready to run
    // Process all planned tasks with scheduledDate <= now (no age limit)
    // This ensures tasks are processed even after server restarts or prolonged downtime
    // Batch size limit protects against worker monopolization
    const entries = await ifoxCalendarService.listEntries({
      scheduledDateTo: now,
      status: 'planned',
    });

    if (!entries || entries.length === 0) {
      isProcessing = false;
      return;
    }

    // Limit batch size to prevent worker monopolization
    // Remaining tasks will be picked up in subsequent runs (every minute)
    const tasksToProcess = entries.slice(0, MAX_BATCH_SIZE);
    
    if (entries.length > MAX_BATCH_SIZE) {
      console.log(`[iFox Generator] ⚠️ Found ${entries.length} tasks, processing ${MAX_BATCH_SIZE} in this batch`);
      console.log(`[iFox Generator] ℹ️ Remaining ${entries.length - MAX_BATCH_SIZE} tasks will be processed in next run`);
    }

    console.log(`[iFox Generator] 🤖 Found ${tasksToProcess.length} tasks ready to process`);

    for (const entry of tasksToProcess) {
      try {
        const topicIdea = entry.topicIdea || 'محتوى جديد';
        console.log(`[iFox Generator] 🚀 Processing task: ${topicIdea}`);

        // Update status to processing
        // Use system user ID if creator is not available
        const userId = entry.createdBy || 'system';
        await ifoxCalendarService.updateEntry(entry.id, {
          status: 'in_progress',
        }, userId);

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
        }, userId);

        // TODO: When AI article generation is implemented:
        // 1. Call AI service to generate content
        // 2. Create article draft
        // 3. Link article to calendar entry
        // 4. Send notification to creator via createNotification()

        console.log(`[iFox Generator] ✅ Task completed: ${topicIdea}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[iFox Generator] ❌ Error processing task ${entry.id}:`, errorMessage);
        
        // Increment retry counter and check if we should give up
        const currentRetryCount = entry.retryCount || 0;
        const newRetryCount = currentRetryCount + 1;
        
        // Use system user ID for error handling if creator is not available
        const errorUserId = entry.createdBy || 'system';
        
        if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
          // Move to failed status after max retries
          console.error(`[iFox Generator] 💀 Task ${entry.id} failed after ${MAX_RETRY_ATTEMPTS} attempts, moving to 'failed' status`);
          try {
            await ifoxCalendarService.updateEntry(entry.id, {
              status: 'failed',
              retryCount: newRetryCount,
              lastErrorAt: new Date(),
              lastErrorReason: errorMessage,
            }, errorUserId);
          } catch (updateError) {
            console.error(`[iFox Generator] ❌ Failed to update task to failed status:`, updateError);
          }
        } else {
          // Reset to planned for retry, but increment retry counter
          console.log(`[iFox Generator] 🔄 Task ${entry.id} will retry (attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`);
          try {
            await ifoxCalendarService.updateEntry(entry.id, {
              status: 'planned',
              retryCount: newRetryCount,
              lastErrorAt: new Date(),
              lastErrorReason: errorMessage,
            }, errorUserId);
          } catch (updateError) {
            console.error(`[iFox Generator] ❌ Failed to update task status:`, updateError);
          }
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
