/**
 * WhatsApp Message Segments Cleanup Job
 * وظيفة Cron لتنظيف أجزاء الرسائل المنتهية الصلاحية
 * يتم تشغيلها كل ساعة لحذف الأجزاء التي مر عليها أكثر من 24 ساعة
 */

import cron from "node-cron";
import { storage } from "../storage";

/**
 * جدولة وظيفة تنظيف أجزاء رسائل واتساب
 * Schedule WhatsApp message segments cleanup job
 * Runs every hour to remove expired segments
 */
export function startWhatsAppSegmentsCleanupJob() {
  // Run every hour at minute 0
  const job = cron.schedule("0 * * * *", async () => {
    try {
      console.log("[WhatsApp Segments Cleanup] 🧹 Starting cleanup of expired segments...");
      
      const deletedCount = await storage.cleanupExpiredSegments();
      
      if (deletedCount > 0) {
        console.log(`[WhatsApp Segments Cleanup] ✅ Cleaned up ${deletedCount} expired segment(s)`);
      } else {
        console.log("[WhatsApp Segments Cleanup] ✅ No expired segments to clean");
      }
      
    } catch (error) {
      console.error("[WhatsApp Segments Cleanup] ❌ Error during cleanup:", error);
    }
  });
  
  // Also run once on startup after 30 seconds
  setTimeout(async () => {
    try {
      console.log("[WhatsApp Segments Cleanup] 🚀 Running initial cleanup on startup...");
      const deletedCount = await storage.cleanupExpiredSegments();
      
      if (deletedCount > 0) {
        console.log(`[WhatsApp Segments Cleanup] ✅ Initial cleanup: removed ${deletedCount} segment(s)`);
      }
    } catch (error) {
      console.error("[WhatsApp Segments Cleanup] ❌ Initial cleanup error:", error);
    }
  }, 30000); // Wait 30 seconds after server start
  
  console.log("[WhatsApp Segments Cleanup] ⏰ Cleanup job scheduled (every hour)");
  
  return job;
}
