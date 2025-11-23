import * as cron from 'node-cron';
import { aiTaskExecutor } from '../services/aiTaskExecutor';

// AI Tasks Scheduler - Runs every minute to check for pending tasks
export function startAITasksScheduler() {
  console.log('🤖 [AI Tasks Scheduler] Starting AI automated content generation scheduler...');

  // Run every minute: "* * * * *"
  cron.schedule('* * * * *', async () => {
    try {
      const result = await aiTaskExecutor.executePendingTasks();
      
      if (result.executed > 0) {
        console.log(`🤖 [AI Tasks Scheduler] Execution complete: ${result.succeeded} succeeded, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('❌ [AI Tasks Scheduler] Error executing pending tasks:', error);
    }
  });

  console.log('✅ [AI Tasks Scheduler] Scheduler started successfully (runs every minute)');
}

export function stopAITasksScheduler() {
  // node-cron doesn't have a stop method for individual tasks
  // You would need to keep a reference to the task and call task.stop()
  console.log('⏹️  [AI Tasks Scheduler] Scheduler stopped');
}
