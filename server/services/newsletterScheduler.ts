import * as cron from 'node-cron';
import { db } from '../db';
import { eq, desc, gte, and, isNotNull, sql } from 'drizzle-orm';
import {
  articles,
  audioNewsletters,
  audioNewsletterArticles,
  users,
  notificationsInbox,
  newsletterSubscriptions,
  type Article,
  type InsertAudioNewsletter,
  type NotificationInbox,
} from '@shared/schema';
import { nanoid } from 'nanoid';
import { audioNewsletterService, NewsletterTemplate, ARABIC_VOICES } from './audioNewsletterService';
import { sendEmailNotification, sendNewsletterEmail } from './email';
import { subHours, format } from 'date-fns';
import { generateArticleSummary, generatePersonalizedIntro } from './aiNewsletterService';

interface ScheduleConfig {
  type: 'morning_brief' | 'evening_digest' | 'weekly_roundup';
  template: NewsletterTemplate;
  title: string;
  description: string;
  articleCount: number;
  timeWindow: number; // hours to look back
  voicePreset: keyof typeof ARABIC_VOICES;
  cronSchedule: string;
  enabled: boolean;
}

// Saudi Arabia timezone
const TIMEZONE = 'Asia/Riyadh';

// Schedule configurations
const SCHEDULES: ScheduleConfig[] = [
  {
    type: 'morning_brief',
    template: NewsletterTemplate.MORNING_BRIEF,
    title: 'نشرة سبق الصباحية - {date}',
    description: 'أبرز أخبار اليوم لبداية يومك',
    articleCount: 5,
    timeWindow: 24, // Last 24 hours
    voicePreset: 'MALE_NEWS',
    cronSchedule: '0 6 * * *', // 6:00 AM every day
    enabled: true
  },
  {
    type: 'evening_digest',
    template: NewsletterTemplate.EVENING_DIGEST,
    title: 'نشرة سبق المسائية - {date}',
    description: 'ملخص أهم أحداث اليوم',
    articleCount: 5,
    timeWindow: 12, // Last 12 hours
    voicePreset: 'FEMALE_NEWS',
    cronSchedule: '0 18 * * *', // 6:00 PM every day
    enabled: true
  },
  {
    type: 'weekly_roundup',
    template: NewsletterTemplate.WEEKLY_ANALYSIS,
    title: 'النشرة الأسبوعية - أسبوع {week}',
    description: 'تحليل معمق لأبرز أحداث الأسبوع',
    articleCount: 10,
    timeWindow: 168, // Last 7 days
    voicePreset: 'MALE_ANALYSIS',
    cronSchedule: '0 10 * * 0', // 10:00 AM on Sundays
    enabled: true
  }
];

class NewsletterScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  constructor() {
    console.log('[NewsletterScheduler] Initializing scheduler service');
  }

  /**
   * Start all scheduled jobs
   */
  public start() {
    if (this.isRunning) {
      console.log('[NewsletterScheduler] Scheduler already running');
      return;
    }

    console.log('[NewsletterScheduler] Starting scheduled jobs');
    
    SCHEDULES.forEach(schedule => {
      if (schedule.enabled) {
        this.scheduleJob(schedule);
      }
    });

    this.isRunning = true;
    console.log(`[NewsletterScheduler] Started ${this.jobs.size} scheduled jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  public stop() {
    console.log('[NewsletterScheduler] Stopping all scheduled jobs');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`[NewsletterScheduler] Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(config: ScheduleConfig) {
    const jobName = `newsletter_${config.type}`;
    
    // Stop existing job if any
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName)!.stop();
    }

    // Create new scheduled job
    const job = cron.schedule(
      config.cronSchedule,
      async () => {
        await this.executeScheduledNewsletter(config);
      },
      {
        timezone: TIMEZONE
      }
    );

    this.jobs.set(jobName, job);
    console.log(`[NewsletterScheduler] Scheduled job: ${jobName} with cron: ${config.cronSchedule}`);
  }

  /**
   * Execute a scheduled newsletter generation
   */
  private async executeScheduledNewsletter(config: ScheduleConfig) {
    const jobId = `${config.type}_${Date.now()}`;
    console.log(`[NewsletterScheduler] Executing scheduled newsletter: ${jobId}`);

    try {
      // Fetch MORE articles than needed to allow per-subscriber personalization
      // Fetch 3x the required amount (or at least 15-20) for variety
      const articlesToFetch = Math.max(config.articleCount * 3, 20);
      const topArticles = await this.getTopArticles(articlesToFetch, config.timeWindow);
      
      if (topArticles.length === 0) {
        console.log(`[NewsletterScheduler] No articles found for ${config.type}, skipping`);
        return;
      }

      // Format title and description with current date
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const weekStr = format(now, 'ww/yyyy');
      
      const title = config.title
        .replace('{date}', dateStr)
        .replace('{week}', weekStr);
      
      // Get system user for automated newsletters
      const systemUser = await this.getSystemUser();
      
      // Create newsletter
      const newsletter = await audioNewsletterService.createNewsletter({
        title,
        description: config.description,
        template: config.template,
        voiceId: ARABIC_VOICES[config.voicePreset].id,
        voiceSettings: ARABIC_VOICES[config.voicePreset].settings,
        articleIds: topArticles.map(a => a.id),
        generatedBy: systemUser.id,
        metadata: {
          scheduledType: config.type,
          autoGenerated: true,
          generatedAt: now.toISOString(),
          articleSelectionCriteria: {
            timeWindow: config.timeWindow,
            count: config.articleCount
          }
        }
      });

      console.log(`[NewsletterScheduler] Created newsletter: ${newsletter.id}`);

      // Generate audio
      await audioNewsletterService.generateAudio(newsletter.id, {
        priority: 'high',
        webhookUrl: process.env.WEBHOOK_URL ? `${process.env.WEBHOOK_URL}/api/webhooks/audio-complete` : undefined
      });

      // Get the generated newsletter audio URL from database
      const [generatedNewsletter] = await db
        .select()
        .from(audioNewsletters)
        .where(eq(audioNewsletters.id, newsletter.id))
        .limit(1);
      
      // Send newsletter to all active subscribers with per-subscriber article selection
      await this.sendToSubscribers(
        config.type,
        title,
        config.description,
        generatedNewsletter?.audioUrl || undefined,
        topArticles,
        config.articleCount // Pass the target articles per subscriber
      );

      // Send notifications to admins
      await this.notifyAdmins(newsletter.id, config.type, 'success');
      
      // Reset retry counter on success
      this.retryAttempts.delete(config.type);
      
      console.log(`[NewsletterScheduler] Successfully completed ${config.type}`);
      
    } catch (error) {
      console.error(`[NewsletterScheduler] Error executing ${config.type}:`, error);
      
      // Handle retry logic
      const retryCount = this.retryAttempts.get(config.type) || 0;
      
      if (retryCount < this.maxRetries) {
        this.retryAttempts.set(config.type, retryCount + 1);
        
        // Retry after delay
        const retryDelay = Math.pow(2, retryCount) * 5 * 60 * 1000; // Exponential backoff: 5, 10, 20 minutes
        
        console.log(`[NewsletterScheduler] Retrying ${config.type} in ${retryDelay / 1000}s (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.executeScheduledNewsletter(config);
        }, retryDelay);
      } else {
        // Max retries reached, notify admins of failure
        await this.notifyAdmins('', config.type, 'failed', error as Error);
        this.retryAttempts.delete(config.type);
      }
    }
  }

  /**
   * Get top performing articles based on metrics
   */
  private async getTopArticles(limit: number, hoursBack: number): Promise<Article[]> {
    const startTime = subHours(new Date(), hoursBack);
    
    const topArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          gte(articles.createdAt, startTime),
          eq(articles.status, 'published'),
          isNotNull(articles.content)
        )
      )
      .orderBy(desc(articles.createdAt))
      .limit(limit);

    return topArticles;
  }

  /**
   * Send newsletter to all active subscribers with AI-powered personalization
   */
  private async sendToSubscribers(
    newsletterType: 'morning_brief' | 'evening_digest' | 'weekly_roundup',
    title: string,
    description: string,
    audioUrl: string | undefined,
    allArticles: Article[],
    articlesPerSubscriber: number = 5
  ) {
    try {
      // Get all active newsletter subscribers
      const subscribers = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.status, 'active'));

      if (subscribers.length === 0) {
        console.log('[NewsletterScheduler] No active subscribers to send newsletter to');
        return;
      }

      console.log(`[NewsletterScheduler] Sending personalized newsletter to ${subscribers.length} subscribers`);
      console.log(`[NewsletterScheduler] Pre-computing AI summaries for ${allArticles.length} articles`);

      // OPTIMIZATION: Pre-compute AI summaries for ALL articles ONCE before subscriber loop
      // This avoids N×M API calls (where N=subscribers, M=articles)
      const summaryCache = new Map<string, string>();
      
      await Promise.all(
        allArticles.map(async (article) => {
          try {
            const summary = await generateArticleSummary(article);
            summaryCache.set(article.id, summary);
          } catch (error) {
            console.warn(`[NewsletterScheduler] Failed to generate summary for article ${article.id}:`, error);
            summaryCache.set(article.id, article.excerpt || article.content?.substring(0, 150) + '...' || 'لا يوجد ملخص متاح');
          }
        })
      );

      console.log(`[NewsletterScheduler] Cached ${summaryCache.size} article summaries`);

      let successCount = 0;
      let failCount = 0;

      // Process each subscriber individually for personalization
      for (const subscriber of subscribers) {
        try {
          // Get subscriber's category preferences
          const subscriberCategories = subscriber.preferences?.categories || [];
          
          // TRUE PERSONALIZATION: Filter and select articles for this subscriber
          let personalizedArticles: Article[];
          
          if (subscriberCategories.length > 0) {
            // Filter articles matching subscriber's preferred categories
            const matchingArticles = allArticles.filter(article => 
              subscriberCategories.includes(article.categoryId || '')
            );
            
            // If enough matching articles, use those; otherwise, mix with general articles
            if (matchingArticles.length >= articlesPerSubscriber) {
              personalizedArticles = matchingArticles.slice(0, articlesPerSubscriber);
            } else {
              // Start with matching articles, then fill with non-matching ones
              const nonMatchingArticles = allArticles.filter(article => 
                !subscriberCategories.includes(article.categoryId || '')
              );
              personalizedArticles = [
                ...matchingArticles,
                ...nonMatchingArticles.slice(0, articlesPerSubscriber - matchingArticles.length)
              ];
            }
          } else {
            // No preferences: shuffle and pick random mix to provide variety
            const shuffled = [...allArticles].sort(() => Math.random() - 0.5);
            personalizedArticles = shuffled.slice(0, articlesPerSubscriber);
          }

          // Use pre-cached summaries instead of regenerating
          const articleSummaries = personalizedArticles.map((article) => ({
            title: article.title,
            excerpt: summaryCache.get(article.id) || article.excerpt || 'لا يوجد ملخص متاح',
            url: article.slug ? `${process.env.FRONTEND_URL || ''}/article/${article.slug}` : undefined
          }));

          // Generate personalized intro for this subscriber (this is cheap and per-subscriber)
          const personalizedIntro = await generatePersonalizedIntro(
            undefined, // We don't have subscriber name in current schema
            subscriberCategories,
            newsletterType
          );

          // Send personalized email
          const result = await sendNewsletterEmail({
            to: subscriber.email,
            newsletterTitle: title,
            newsletterDescription: description,
            audioUrl,
            articleSummaries,
            newsletterType,
            unsubscribeToken: subscriber.id,
            personalizedIntro
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.warn(`[NewsletterScheduler] Failed to send to ${subscriber.email}: ${result.error}`);
          }

          // Small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (subscriberError) {
          failCount++;
          console.error(`[NewsletterScheduler] Error processing subscriber ${subscriber.email}:`, subscriberError);
        }
      }

      console.log(`[NewsletterScheduler] Personalized newsletter sent: ${successCount} success, ${failCount} failed out of ${subscribers.length} subscribers`);
      
    } catch (error) {
      console.error('[NewsletterScheduler] Error sending to subscribers:', error);
    }
  }

  /**
   * Get or create system user for automated operations
   */
  private async getSystemUser() {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'system@sabq.sa'))
      .limit(1);
    
    if (user) {
      return user;
    }

    // Create system user if not exists
    const [newUser] = await db
      .insert(users)
      .values({
        id: 'system-newsletter',
        email: 'system@sabq.sa',
        firstName: 'نظام',
        lastName: 'سبق',
        role: 'system',
        passwordHash: ''
      })
      .returning();
    
    return newUser;
  }

  /**
   * Send notifications to admin users
   */
  private async notifyAdmins(
    newsletterId: string,
    scheduleType: string,
    status: 'success' | 'failed',
    error?: Error
  ) {
    try {
      // Get all admin users
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));
      
      const notificationTitle = status === 'success'
        ? `تم إنشاء النشرة ${this.getScheduleTypeName(scheduleType)} بنجاح`
        : `فشل إنشاء النشرة ${this.getScheduleTypeName(scheduleType)}`;
      
      const notificationBody = status === 'success'
        ? `تم إنشاء وجدولة النشرة الصوتية تلقائياً`
        : `حدث خطأ أثناء إنشاء النشرة: ${error?.message || 'خطأ غير معروف'}`;
      
      // Create notifications for all admins
      const notificationPromises = adminUsers.map(admin =>
        db.insert(notificationsInbox).values({
          userId: admin.id,
          type: status === 'success' ? 'info' : 'alert',
          title: notificationTitle,
          body: notificationBody,
          metadata: {
            newsletterId,
            scheduleType,
            status,
            error: error?.message,
            timestamp: new Date().toISOString()
          }
        })
      );
      
      await Promise.all(notificationPromises);
      
      // Send email notifications to admins (if email service is configured)
      if (process.env.SENDGRID_API_KEY) {
        const emailPromises = adminUsers.map(admin =>
          sendEmailNotification({
            to: admin.email,
            subject: notificationTitle,
            text: notificationBody,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif;">
                <h2>${notificationTitle}</h2>
                <p>${notificationBody}</p>
                ${status === 'success' && newsletterId ? `
                  <p>
                    <a href="${process.env.APP_URL}/admin/audio-newsletters/${newsletterId}" 
                       style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      عرض النشرة
                    </a>
                  </p>
                ` : ''}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                  هذا إشعار تلقائي من نظام سبق. التوقيت: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
            `
          })
        );
        
        await Promise.allSettled(emailPromises);
      }
      
    } catch (error) {
      console.error('[NewsletterScheduler] Error sending notifications:', error);
    }
  }

  /**
   * Get human-readable schedule type name
   */
  private getScheduleTypeName(type: string): string {
    switch (type) {
      case 'morning_brief':
        return 'الصباحية';
      case 'evening_digest':
        return 'المسائية';
      case 'weekly_roundup':
        return 'الأسبوعية';
      default:
        return type;
    }
  }

  /**
   * Manually trigger a scheduled newsletter (for testing)
   */
  public async triggerManual(scheduleType: string) {
    const config = SCHEDULES.find(s => s.type === scheduleType);
    
    if (!config) {
      throw new Error(`Schedule type ${scheduleType} not found`);
    }
    
    console.log(`[NewsletterScheduler] Manually triggering ${scheduleType}`);
    await this.executeScheduledNewsletter(config);
  }

  /**
   * Get scheduler status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.entries()).map(([name, job]) => ({
        name,
        // @ts-ignore - accessing private property for status
        running: job._scheduler?.running || false
      })),
      schedules: SCHEDULES.map(s => ({
        ...s,
        nextRun: this.getNextRunTime(s.cronSchedule)
      })),
      retryQueue: Array.from(this.retryAttempts.entries()).map(([type, count]) => ({
        type,
        retryCount: count,
        maxRetries: this.maxRetries
      }))
    };
  }

  /**
   * Calculate next run time for a cron schedule
   */
  private getNextRunTime(cronSchedule: string): string {
    // This is a simplified implementation
    // For production, use a proper cron parser library
    const parts = cronSchedule.split(' ');
    const hour = parseInt(parts[1]);
    const minute = parseInt(parts[0]);
    
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    
    if (next < new Date()) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
}

// Export singleton instance
export const newsletterScheduler = new NewsletterScheduler();

// Auto-start scheduler if enabled in environment
if (process.env.ENABLE_NEWSLETTER_SCHEDULER === 'true') {
  console.log('[NewsletterScheduler] Auto-starting scheduler from environment config');
  newsletterScheduler.start();
}