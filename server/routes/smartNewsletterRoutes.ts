/**
 * Smart Newsletter Routes with MailerLite Integration
 * مسارات النشرة الإخبارية الذكية مع تكامل MailerLite
 */

import { Express } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { 
  newsletterSubscriptions,
  userDynamicInterests,
  userAffinities,
  categories,
} from '@shared/schema';
import {
  subscribeToMailerLite,
  getMailerLiteSubscriber,
  updateMailerLiteSubscriber,
  unsubscribeFromMailerLite,
  syncUserInterestsToMailerLite,
  parseMailerLiteWebhook,
  isMailerLiteConfigured,
  getMailerLiteGroups,
} from '../services/mailerlite';
import { sendNewsletterWelcomeEmail } from '../services/email';

// Subscription request schema
const subscribeSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  language: z.enum(['ar', 'en', 'ur']).default('ar'),
  interests: z.array(z.string()).optional(),
  source: z.string().optional(),
});

// Update subscription schema
const updateSubscriptionSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  language: z.enum(['ar', 'en', 'ur']).optional(),
  interests: z.array(z.string()).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export function registerSmartNewsletterRoutes(app: Express) {
  // =================================================================
  // SMART NEWSLETTER - MailerLite Integration Routes
  // =================================================================

  /**
   * POST /api/smart-newsletter/subscribe
   * Subscribe to smart newsletter with MailerLite sync
   */
  app.post('/api/smart-newsletter/subscribe', async (req: any, res) => {
    try {
      const data = subscribeSchema.parse(req.body);
      const userId = req.user?.id;

      // Check if already subscribed locally
      const [existing] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, data.email))
        .limit(1);

      let localSubscription;

      if (existing) {
        if (existing.status === 'active') {
          return res.status(400).json({ 
            success: false,
            message: 'هذا البريد مشترك بالفعل في النشرة الذكية' 
          });
        }
        // Reactivate subscription
        [localSubscription] = await db
          .update(newsletterSubscriptions)
          .set({
            status: 'active',
            language: data.language,
            userId: userId || existing.userId,
            preferences: {
              ...existing.preferences,
              categories: data.interests,
            },
            unsubscribedAt: null,
            unsubscribeReason: null,
            updatedAt: new Date(),
          })
          .where(eq(newsletterSubscriptions.id, existing.id))
          .returning();
      } else {
        // Create new local subscription
        const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];

        [localSubscription] = await db
          .insert(newsletterSubscriptions)
          .values({
            email: data.email,
            status: 'active',
            language: data.language,
            userId: userId || null,
            preferences: {
              frequency: 'weekly',
              categories: data.interests || [],
            },
            ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0] || null,
            userAgent: userAgent || null,
            source: data.source || 'smart-newsletter',
            verifiedAt: new Date(),
          })
          .returning();
      }

      // Determine persona based on interests if user is logged in
      let persona: string | undefined;
      if (userId) {
        persona = await determineUserPersona(userId);
      }

      // Sync to MailerLite
      let mailerliteResult = null;
      if (isMailerLiteConfigured()) {
        mailerliteResult = await subscribeToMailerLite({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          language: data.language,
          interests: data.interests,
          persona,
          source: data.source || 'smart-newsletter',
        });

        if (!mailerliteResult.success) {
          console.warn(`⚠️ MailerLite sync failed for ${data.email}:`, mailerliteResult.error);
        }
      }

      // Send welcome email to new subscriber
      const welcomeResult = await sendNewsletterWelcomeEmail({
        to: data.email,
        firstName: data.firstName,
        language: data.language,
        interests: data.interests,
      });
      
      if (!welcomeResult.success) {
        console.warn(`⚠️ Welcome email failed for ${data.email}:`, welcomeResult.error);
      }

      res.status(201).json({
        success: true,
        message: 'تم الاشتراك بنجاح في النشرة الذكية! ستصلك أخبار مخصصة حسب اهتماماتك.',
        subscription: {
          id: localSubscription.id,
          email: localSubscription.email,
          language: localSubscription.language,
        },
        mailerliteSynced: mailerliteResult?.success || false,
      });
    } catch (error: any) {
      console.error('Error in smart newsletter subscribe:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.errors 
        });
      }
      if (error.message?.includes('unique')) {
        return res.status(400).json({ 
          success: false,
          message: 'هذا البريد مشترك بالفعل' 
        });
      }
      res.status(500).json({ 
        success: false,
        message: 'حدث خطأ في الاشتراك، يرجى المحاولة لاحقاً' 
      });
    }
  });

  /**
   * GET /api/smart-newsletter/status/:email
   * Check subscription status
   */
  app.get('/api/smart-newsletter/status/:email', async (req: any, res) => {
    try {
      const { email } = req.params;

      // Check local subscription
      const [localSub] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, email))
        .limit(1);

      // Check MailerLite status
      let mailerliteSub = null;
      if (isMailerLiteConfigured()) {
        const mlResult = await getMailerLiteSubscriber(email);
        if (mlResult.success && mlResult.data) {
          mailerliteSub = {
            status: mlResult.data.status,
            groups: mlResult.data.groups,
            fields: mlResult.data.fields,
          };
        }
      }

      if (!localSub && !mailerliteSub) {
        return res.status(404).json({
          success: false,
          subscribed: false,
          message: 'هذا البريد غير مشترك في النشرة الذكية',
        });
      }

      res.json({
        success: true,
        subscribed: localSub?.status === 'active' || mailerliteSub?.status === 'active',
        local: localSub ? {
          status: localSub.status,
          language: localSub.language,
          preferences: localSub.preferences,
          subscribedAt: localSub.createdAt,
        } : null,
        mailerlite: mailerliteSub,
      });
    } catch (error) {
      console.error('Error checking newsletter status:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من حالة الاشتراك',
      });
    }
  });

  /**
   * PUT /api/smart-newsletter/update
   * Update subscription preferences
   */
  app.put('/api/smart-newsletter/update', async (req: any, res) => {
    try {
      const { email, ...updates } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مطلوب',
        });
      }

      const data = updateSubscriptionSchema.parse(updates);

      // Find local subscription
      const [existing] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, email))
        .limit(1);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'هذا البريد غير مشترك في النشرة',
        });
      }

      // Update local subscription
      const [updated] = await db
        .update(newsletterSubscriptions)
        .set({
          language: data.language || existing.language,
          preferences: {
            ...existing.preferences,
            frequency: data.frequency || existing.preferences?.frequency,
            categories: data.interests || existing.preferences?.categories,
          },
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscriptions.id, existing.id))
        .returning();

      // Sync updates to MailerLite
      if (isMailerLiteConfigured()) {
        const mlSub = await getMailerLiteSubscriber(email);
        if (mlSub.success && mlSub.data) {
          await updateMailerLiteSubscriber(mlSub.data.id, {
            firstName: data.firstName,
            lastName: data.lastName,
            language: data.language,
            interests: data.interests,
          });
        }
      }

      res.json({
        success: true,
        message: 'تم تحديث تفضيلاتك بنجاح',
        subscription: {
          email: updated.email,
          language: updated.language,
          preferences: updated.preferences,
        },
      });
    } catch (error: any) {
      console.error('Error updating newsletter subscription:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الاشتراك',
      });
    }
  });

  /**
   * POST /api/smart-newsletter/unsubscribe
   * Unsubscribe from newsletter
   */
  app.post('/api/smart-newsletter/unsubscribe', async (req: any, res) => {
    try {
      const { email, reason } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مطلوب',
        });
      }

      // Update local subscription
      const [existing] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.email, email))
        .limit(1);

      if (existing) {
        await db
          .update(newsletterSubscriptions)
          .set({
            status: 'unsubscribed',
            unsubscribedAt: new Date(),
            unsubscribeReason: reason || null,
            updatedAt: new Date(),
          })
          .where(eq(newsletterSubscriptions.id, existing.id));
      }

      // Unsubscribe from MailerLite
      if (isMailerLiteConfigured()) {
        const mlSub = await getMailerLiteSubscriber(email);
        if (mlSub.success && mlSub.data) {
          await unsubscribeFromMailerLite(mlSub.data.id);
        }
      }

      res.json({
        success: true,
        message: 'تم إلغاء اشتراكك بنجاح. نأسف لرؤيتك تذهب!',
      });
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إلغاء الاشتراك',
      });
    }
  });

  /**
   * POST /api/webhooks/mailerlite
   * Handle MailerLite webhook events
   */
  app.post('/api/webhooks/mailerlite', async (req: any, res) => {
    try {
      console.log('📨 Received MailerLite webhook:', JSON.stringify(req.body));

      const event = parseMailerLiteWebhook(req.body);
      if (!event) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      const { type, data } = event;

      switch (type) {
        case 'subscriber.created':
          if (data.subscriber) {
            console.log(`✅ MailerLite: New subscriber ${data.subscriber.email}`);
            // Could sync back to local DB if needed
          }
          break;

        case 'subscriber.unsubscribed':
          if (data.subscriber) {
            console.log(`🚫 MailerLite: Unsubscribed ${data.subscriber.email}`);
            // Update local subscription status
            await db
              .update(newsletterSubscriptions)
              .set({
                status: 'unsubscribed',
                unsubscribedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(newsletterSubscriptions.email, data.subscriber.email));
          }
          break;

        case 'subscriber.bounced':
          if (data.subscriber) {
            console.log(`⚠️ MailerLite: Bounced ${data.subscriber.email}`);
            // Mark as bounced
            await db
              .update(newsletterSubscriptions)
              .set({
                status: 'bounced',
                updatedAt: new Date(),
              })
              .where(eq(newsletterSubscriptions.email, data.subscriber.email));
          }
          break;

        case 'subscriber.updated':
          console.log(`📝 MailerLite: Subscriber updated`);
          break;

        case 'campaign.sent':
          console.log(`📧 MailerLite: Campaign sent - ${data.campaign?.name}`);
          break;

        default:
          console.log(`ℹ️ MailerLite: Unhandled event type ${type}`);
      }

      res.json({ success: true, received: type });
    } catch (error) {
      console.error('Error processing MailerLite webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  /**
   * POST /api/smart-newsletter/sync-interests
   * Sync user interests to MailerLite (called when behavior updates)
   */
  app.post('/api/smart-newsletter/sync-interests', async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول',
        });
      }

      // Get user email from subscription
      const [subscription] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.userId, userId))
        .limit(1);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'لم يتم العثور على اشتراك مرتبط بحسابك',
        });
      }

      // Get user dynamic interests
      const interests = await db
        .select({
          interestId: userDynamicInterests.interestId,
          interestName: userDynamicInterests.interestName,
          score: userDynamicInterests.score,
        })
        .from(userDynamicInterests)
        .where(and(
          eq(userDynamicInterests.userId, userId),
          eq(userDynamicInterests.interestType, 'category')
        ))
        .orderBy(desc(userDynamicInterests.score))
        .limit(10);

      // Determine persona
      const persona = await determineUserPersona(userId);

      // Sync to MailerLite
      if (isMailerLiteConfigured() && interests.length > 0) {
        const formattedInterests = interests.map(i => ({
          categoryId: i.interestId,
          categoryName: i.interestName || 'Unknown',
          score: i.score,
        }));

        await syncUserInterestsToMailerLite(subscription.email, formattedInterests, persona);
      }

      res.json({
        success: true,
        message: 'تم مزامنة اهتماماتك بنجاح',
        interests: interests.map(i => i.interestName),
        persona,
      });
    } catch (error) {
      console.error('Error syncing interests:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في مزامنة الاهتمامات',
      });
    }
  });

  /**
   * GET /api/smart-newsletter/groups
   * Get available MailerLite groups (admin only)
   */
  app.get('/api/smart-newsletter/groups', async (req: any, res) => {
    try {
      if (!isMailerLiteConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'MailerLite غير مُعدّ',
        });
      }

      const result = await getMailerLiteGroups();
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error,
        });
      }

      res.json({
        success: true,
        groups: result.data,
      });
    } catch (error) {
      console.error('Error fetching MailerLite groups:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المجموعات',
      });
    }
  });

  /**
   * GET /api/smart-newsletter/categories
   * Get available categories for subscription interests
   */
  app.get('/api/smart-newsletter/categories', async (req: any, res) => {
    try {
      const activeCategories = await db
        .select({
          id: categories.id,
          nameAr: categories.nameAr,
          nameEn: categories.nameEn,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
        })
        .from(categories)
        .where(eq(categories.status, 'active'))
        .orderBy(categories.displayOrder);

      res.json({
        success: true,
        categories: activeCategories,
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الأقسام',
      });
    }
  });

  console.log('✅ Smart Newsletter routes registered');
}

/**
 * Determine user persona based on their reading behavior
 */
async function determineUserPersona(userId: string): Promise<string> {
  try {
    // Get user's top interests
    const interests = await db
      .select()
      .from(userDynamicInterests)
      .where(eq(userDynamicInterests.userId, userId))
      .orderBy(desc(userDynamicInterests.score))
      .limit(5);

    if (interests.length === 0) {
      return 'explorer'; // New user, exploring
    }

    // Get category names for top interests
    const topInterests = interests.slice(0, 3);
    
    // Determine persona based on interest patterns
    // This is a simplified version - can be expanded with more sophisticated logic
    const totalScore = interests.reduce((sum, i) => sum + (i.score || 0), 0);
    const topScore = topInterests[0]?.score || 0;
    const concentration = topScore / totalScore;

    if (concentration > 0.5) {
      return 'specialist'; // Focused on specific topics
    } else if (interests.length >= 4) {
      return 'generalist'; // Broad interests
    } else {
      return 'balanced'; // Mix of focused and broad
    }
  } catch (error) {
    console.error('Error determining persona:', error);
    return 'unknown';
  }
}
