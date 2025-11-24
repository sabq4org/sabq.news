import cron from 'node-cron';
import { storage } from '../storage';
import { db } from '../db';
import { aiScheduledTasks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Cleanup Job: Reset stuck AI tasks from "processing" to "failed"
 * 
 * Tasks can get stuck in "processing" if:
 * - Server crashes mid-execution
 * - Database update fails
 * - Worker process killed
 * 
 * This job runs every 5 minutes and marks tasks that have been 
 * in "processing" state for more than 10 minutes as "failed".
 */

const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

async function cleanupStuckTasks() {
  try {
    console.log('[AI Tasks Cleanup] Checking for stuck tasks...');
    
    const stuckTasks = await db
      .select()
      .from(aiScheduledTasks)
      .where(eq(aiScheduledTasks.status, 'processing'));
    
    if (stuckTasks.length === 0) {
      return;
    }

    const now = Date.now();
    let resetCount = 0;

    for (const task of stuckTasks) {
      const updatedAt = new Date(task.updatedAt).getTime();
      const elapsed = now - updatedAt;

      if (elapsed > PROCESSING_TIMEOUT_MS) {
        console.log(`[AI Tasks Cleanup] Marking stuck task ${task.id} as failed (stuck for ${Math.round(elapsed / 1000)}s)`);
        
        await storage.updateAiTaskExecution(task.id, {
          status: 'failed',
          errorMessage: `Task was stuck in processing state for ${Math.round(elapsed / 60000)} minutes and was automatically failed by cleanup job.`,
        });
        
        resetCount++;
      }
    }

    if (resetCount > 0) {
      console.log(`[AI Tasks Cleanup] Marked ${resetCount} stuck task(s) as failed`);
    }
  } catch (error) {
    console.error('[AI Tasks Cleanup] Cleanup job failed:', error);
  }
}

// Run cleanup every 5 minutes
export function startAiTasksCleanupJob() {
  cron.schedule('*/5 * * * *', cleanupStuckTasks);
  console.log('✅ [AI Tasks Cleanup] Cleanup job started (runs every 5 minutes)');
}
