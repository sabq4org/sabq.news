import express from 'express';
import { db } from '../db';
import { eq, desc, and, or, gte, lte, ilike, inArray, isNotNull } from 'drizzle-orm';
import {
  audioNewsletters,
  audioNewsletterArticles,
  audioNewsletterListens,
  articles,
  categories,
  type AudioNewsletter,
  type InsertAudioNewsletter,
  type UpdateAudioNewsletter,
} from '@shared/schema';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  audioNewsletterService,
  NewsletterTemplate,
  ARABIC_VOICES,
  type RecurringSchedule,
  type GenerationStatus
} from '../services/audioNewsletterService';

const router = express.Router();

// Validation schemas
const createNewsletterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  template: z.nativeEnum(NewsletterTemplate),
  voicePreset: z.enum(['MALE_NEWS', 'MALE_ANALYSIS', 'FEMALE_NEWS', 'FEMALE_CONVERSATIONAL', 'CUSTOM']).optional(),
  customVoiceId: z.string().optional(),
  customVoiceSettings: z.object({
    stability: z.number().min(0).max(1).optional(),
    similarity_boost: z.number().min(0).max(1).optional(),
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional()
  }).optional(),
  articleIds: z.array(z.string()).min(1).max(50),
  scheduledFor: z.string().datetime().optional(),
  recurringSchedule: z.object({
    type: z.enum(['daily', 'weekly', 'custom']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    timezone: z.string().default('Asia/Riyadh'),
    enabled: z.boolean()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

const updateNewsletterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'processing', 'published', 'failed', 'cancelled']).optional(),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const generateAudioSchema = z.object({
  newsletterId: z.string(),
  webhookUrl: z.string().url().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  regenerate: z.boolean().optional()
});

const trackListenSchema = z.object({
  duration: z.number().min(0).optional(),
  completionRate: z.number().min(0).max(100).optional()
});

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to check admin role
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has admin or editor role
  const userRole = req.session.userRole || 'user';
  if (!['admin', 'editor', 'moderator'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  next();
};

// Get public newsletters (no auth required)
router.get('/public', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      status = 'published',
      template,
      search,
      startDate,
      endDate,
      orderBy = 'createdAt'
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Build where conditions - only published newsletters
    const whereConditions = [eq(audioNewsletters.status, 'published')];
    
    if (template) {
      whereConditions.push(eq(audioNewsletters.template, template as string));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(audioNewsletters.title, `%${search}%`),
          ilike(audioNewsletters.description, `%${search}%`)
        )
      );
    }
    
    if (startDate) {
      whereConditions.push(gte(audioNewsletters.createdAt, startDate as string));
    }
    
    if (endDate) {
      whereConditions.push(lte(audioNewsletters.createdAt, endDate as string));
    }
    
    const whereClause = and(...whereConditions);
    
    // Get newsletters
    const newsletters = await db.query.audioNewsletters.findMany({
      where: whereClause,
      orderBy: orderBy === 'listenCount' 
        ? [desc(audioNewsletters.listenCount)]
        : orderBy === 'duration'
        ? [desc(audioNewsletters.duration)]
        : [desc(audioNewsletters.createdAt)],
      limit: limitNum,
      offset
    });
    
    // Get total count
    const [{ count }] = await db
      .select({ count: db.sql`count(*)` })
      .from(audioNewsletters)
      .where(whereClause);
    
    // Get template distribution
    const categories = await db
      .select({
        template: audioNewsletters.template,
        count: db.sql`count(*)`
      })
      .from(audioNewsletters)
      .where(eq(audioNewsletters.status, 'published'))
      .groupBy(audioNewsletters.template);
    
    res.json({
      newsletters,
      total: Number(count),
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching public newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

// Get single public newsletter (no auth required)
router.get('/public/:id', async (req, res) => {
  try {
    const newsletter = await db.query.audioNewsletters.findFirst({
      where: and(
        eq(audioNewsletters.id, req.params.id),
        eq(audioNewsletters.status, 'published')
      ),
      with: {
        articles: {
          with: {
            article: {
              with: {
                category: true
              }
            }
          },
          orderBy: (articles, { asc }) => [asc(articles.orderIndex)]
        }
      }
    });
    
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json(newsletter);
  } catch (error) {
    console.error('Error fetching public newsletter:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Get all newsletters with pagination and filters
router.get('/newsletters', requireAuth, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      template,
      search,
      startDate,
      endDate
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Build where conditions
    const whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(audioNewsletters.status, status as string));
    }
    
    if (template) {
      whereConditions.push(eq(audioNewsletters.template, template as string));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(audioNewsletters.title, `%${search}%`),
          ilike(audioNewsletters.description, `%${search}%`)
        )
      );
    }
    
    if (startDate) {
      whereConditions.push(gte(audioNewsletters.createdAt, startDate as string));
    }
    
    if (endDate) {
      whereConditions.push(lte(audioNewsletters.createdAt, endDate as string));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get newsletters with articles count
    const newsletters = await db.query.audioNewsletters.findMany({
      where: whereClause,
      with: {
        generatedByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        articles: {
          columns: {
            id: true
          }
        },
        listens: {
          columns: {
            id: true
          }
        }
      },
      orderBy: [desc(audioNewsletters.createdAt)],
      limit: limitNum,
      offset
    });
    
    // Transform response
    const response = newsletters.map(newsletter => ({
      ...newsletter,
      articleCount: newsletter.articles.length,
      listenCount: newsletter.listens.length,
      articles: undefined,
      listens: undefined
    }));
    
    // Get total count
    const [{ count }] = await db
      .select({ count: db.sql`count(*)` })
      .from(audioNewsletters)
      .where(whereClause);
    
    res.json({
      newsletters: response,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

// Get single newsletter with full details
router.get('/newsletters/:id', requireAuth, async (req, res) => {
  try {
    const newsletter = await db.query.audioNewsletters.findFirst({
      where: eq(audioNewsletters.id, req.params.id),
      with: {
        generatedByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        articles: {
          with: {
            article: {
              with: {
                category: true
              }
            }
          },
          orderBy: (articles, { asc }) => [asc(articles.orderIndex)]
        },
        listens: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: (listens, { desc }) => [desc(listens.listenedAt)],
          limit: 10
        }
      }
    });
    
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    // Get analytics
    const analytics = await audioNewsletterService.getNewsletterAnalytics(req.params.id);
    
    res.json({
      newsletter,
      analytics
    });
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Create new newsletter
router.post('/newsletters', requireAdmin, async (req, res) => {
  try {
    const validatedData = createNewsletterSchema.parse(req.body);
    
    // Determine voice configuration
    let voiceId: string;
    let voiceSettings: any;
    
    if (validatedData.voicePreset && validatedData.voicePreset !== 'CUSTOM') {
      const voiceConfig = ARABIC_VOICES[validatedData.voicePreset as keyof typeof ARABIC_VOICES];
      voiceId = voiceConfig.id;
      voiceSettings = voiceConfig.settings;
    } else if (validatedData.customVoiceId) {
      voiceId = validatedData.customVoiceId;
      voiceSettings = validatedData.customVoiceSettings || {};
    } else {
      // Default to male news voice
      voiceId = ARABIC_VOICES.MALE_NEWS.id;
      voiceSettings = ARABIC_VOICES.MALE_NEWS.settings;
    }
    
    // Create newsletter
    const newsletter = await audioNewsletterService.createNewsletter({
      title: validatedData.title,
      description: validatedData.description,
      template: validatedData.template,
      voiceId,
      voiceSettings,
      articleIds: validatedData.articleIds,
      generatedBy: req.session.userId!,
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      recurringSchedule: validatedData.recurringSchedule as RecurringSchedule,
      metadata: validatedData.metadata
    });
    
    // If not scheduled, start generation immediately
    if (!validatedData.scheduledFor) {
      const job = await audioNewsletterService.generateAudio(newsletter.id);
      
      res.json({
        newsletter,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress
        }
      });
    } else {
      res.json({ newsletter });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating newsletter:', error);
    res.status(500).json({ error: 'Failed to create newsletter' });
  }
});

// Update newsletter
router.patch('/newsletters/:id', requireAdmin, async (req, res) => {
  try {
    const validatedData = updateNewsletterSchema.parse(req.body);
    
    const [updated] = await db
      .update(audioNewsletters)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(audioNewsletters.id, req.params.id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json({ newsletter: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating newsletter:', error);
    res.status(500).json({ error: 'Failed to update newsletter' });
  }
});

// Delete newsletter
router.delete('/newsletters/:id', requireAdmin, async (req, res) => {
  try {
    await db
      .delete(audioNewsletters)
      .where(eq(audioNewsletters.id, req.params.id));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    res.status(500).json({ error: 'Failed to delete newsletter' });
  }
});

// Generate or regenerate audio for newsletter
router.post('/newsletters/generate-audio', requireAdmin, async (req, res) => {
  try {
    const validatedData = generateAudioSchema.parse(req.body);
    
    // Check if newsletter exists
    const newsletter = await db.query.audioNewsletters.findFirst({
      where: eq(audioNewsletters.id, validatedData.newsletterId)
    });
    
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    // Check if already processing
    if (newsletter.status === 'processing' && !validatedData.regenerate) {
      return res.status(400).json({ error: 'Newsletter is already being processed' });
    }
    
    // Start audio generation
    const job = await audioNewsletterService.generateAudio(
      validatedData.newsletterId,
      {
        webhookUrl: validatedData.webhookUrl,
        priority: validatedData.priority
      }
    );
    
    res.json({
      job: {
        id: job.id,
        newsletterId: job.newsletterId,
        status: job.status,
        progress: job.progress
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Get job status
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  const job = audioNewsletterService.getJobStatus(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    job: {
      id: job.id,
      newsletterId: job.newsletterId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    }
  });
});

// Cancel job
router.post('/jobs/:jobId/cancel', requireAdmin, async (req, res) => {
  const cancelled = await audioNewsletterService.cancelJob(req.params.jobId);
  
  if (!cancelled) {
    return res.status(404).json({ error: 'Job not found or already completed' });
  }
  
  res.json({ success: true });
});

// Get all active jobs
router.get('/jobs', requireAdmin, async (req, res) => {
  const jobs = audioNewsletterService.getActiveJobs();
  
  res.json({
    jobs: jobs.map(job => ({
      id: job.id,
      newsletterId: job.newsletterId,
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt
    }))
  });
});

// Track listen event
router.post('/newsletters/:id/listen', requireAuth, async (req, res) => {
  try {
    const validatedData = trackListenSchema.parse(req.body);
    
    await audioNewsletterService.trackListen(
      req.params.id,
      req.session.userId!,
      validatedData.duration
    );
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error tracking listen:', error);
    res.status(500).json({ error: 'Failed to track listen' });
  }
});

// Get newsletter analytics
router.get('/newsletters/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const analytics = await audioNewsletterService.getNewsletterAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get available voices
router.get('/voices', requireAdmin, async (req, res) => {
  try {
    const elevenLabsService = await import('../services/elevenlabs').then(m => m.getElevenLabsService());
    const voices = await elevenLabsService.getVoices();
    
    // Add preset voices
    const presetVoices = Object.entries(ARABIC_VOICES).map(([key, config]) => ({
      id: config.id,
      name: config.name,
      preset: key,
      settings: config.settings,
      category: 'preset'
    }));
    
    res.json({
      presets: presetVoices,
      custom: voices.filter(v => 
        v.labels?.language === 'ar' || 
        v.labels?.accent === 'arabic' ||
        v.category === 'multilingual'
      )
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// Get newsletter templates info
router.get('/templates', async (req, res) => {
  const templates = Object.values(NewsletterTemplate).map(template => ({
    id: template,
    name: template.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase()),
    description: getTemplateDescription(template)
  }));
  
  res.json({ templates });
});

// Get latest published newsletters (public RSS feed)
router.get('/rss', async (req, res) => {
  try {
    const newsletters = await db.query.audioNewsletters.findMany({
      where: eq(audioNewsletters.status, 'published'),
      orderBy: [desc(audioNewsletters.publishedAt)],
      limit: 20,
      with: {
        generatedByUser: {
          columns: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    // Generate RSS feed
    const rss = generateRSSFeed(newsletters);
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

// Get newsletter by slug (public endpoint for sharing)
router.get('/public/:slug', async (req, res) => {
  try {
    // For now using ID as slug, but you can implement proper slugs
    const newsletter = await db.query.audioNewsletters.findFirst({
      where: and(
        eq(audioNewsletters.id, req.params.slug),
        eq(audioNewsletters.status, 'published')
      ),
      with: {
        generatedByUser: {
          columns: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    // Track anonymous listen if no session
    if (!req.session?.userId) {
      await db.update(audioNewsletters)
        .set({
          totalListens: db.sql`${audioNewsletters.totalListens} + 1`
        })
        .where(eq(audioNewsletters.id, newsletter.id));
    }
    
    res.json({
      newsletter: {
        id: newsletter.id,
        title: newsletter.title,
        description: newsletter.description,
        audioUrl: newsletter.audioUrl,
        duration: newsletter.duration,
        publishedAt: newsletter.publishedAt,
        author: newsletter.generatedByUser ? 
          `${newsletter.generatedByUser.firstName} ${newsletter.generatedByUser.lastName}` : 
          'سبق'
      }
    });
  } catch (error) {
    console.error('Error fetching public newsletter:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Helper function to get template description
function getTemplateDescription(template: NewsletterTemplate): string {
  const descriptions: Record<NewsletterTemplate, string> = {
    [NewsletterTemplate.MORNING_BRIEF]: 'نشرة صباحية مختصرة بأهم الأخبار لبداية اليوم',
    [NewsletterTemplate.EVENING_DIGEST]: 'ملخص مسائي شامل لأحداث اليوم',
    [NewsletterTemplate.WEEKLY_ANALYSIS]: 'تحليل أسبوعي معمق للأحداث المهمة',
    [NewsletterTemplate.BREAKING_NEWS]: 'نشرة عاجلة للأخبار الهامة',
    [NewsletterTemplate.TECH_UPDATE]: 'آخر أخبار التقنية والابتكار',
    [NewsletterTemplate.BUSINESS_REPORT]: 'تقرير اقتصادي بأهم أخبار الأعمال',
    [NewsletterTemplate.SPORT_HIGHLIGHTS]: 'أبرز الأحداث والنتائج الرياضية',
    [NewsletterTemplate.CUSTOM]: 'قالب مخصص حسب الاحتياجات'
  };
  
  return descriptions[template] || '';
}

// Generate RSS feed
function generateRSSFeed(newsletters: any[]): string {
  const baseUrl = process.env.BASE_URL || 'https://sabq.org';
  
  const items = newsletters.map(newsletter => {
    const author = newsletter.generatedByUser ? 
      `${newsletter.generatedByUser.firstName} ${newsletter.generatedByUser.lastName}` : 
      'سبق';
    
    return `
    <item>
      <title><![CDATA[${newsletter.title}]]></title>
      <description><![CDATA[${newsletter.description || ''}]]></description>
      <link>${baseUrl}/audio/${newsletter.id}</link>
      <guid isPermaLink="true">${baseUrl}/audio/${newsletter.id}</guid>
      <pubDate>${new Date(newsletter.publishedAt).toUTCString()}</pubDate>
      <author>${author}</author>
      <enclosure url="${baseUrl}${newsletter.audioUrl}" type="audio/mpeg" />
      <itunes:duration>${formatDuration(newsletter.duration)}</itunes:duration>
    </item>
    `;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>نشرات سبق الصوتية</title>
    <description>استمع إلى أهم الأخبار والتحليلات من سبق</description>
    <link>${baseUrl}</link>
    <language>ar</language>
    <copyright>© ${new Date().getFullYear()} سبق</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>سبق</itunes:author>
    <itunes:category text="News" />
    <itunes:explicit>no</itunes:explicit>
    ${items}
  </channel>
</rss>`;
}

// Format duration for RSS feed
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// SSE endpoint for real-time job status updates
router.get('/jobs/:jobId/stream', requireAuth, async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  const jobId = req.params.jobId;
  
  // Send initial job status
  const job = audioNewsletterService.getJobStatus(jobId);
  if (job) {
    res.write(`data: ${JSON.stringify(job)}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
    res.end();
    return;
  }
  
  // Set up event listeners
  const progressHandler = (updatedJob: any) => {
    if (updatedJob.id === jobId) {
      res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    }
  };
  
  const completedHandler = (completedJob: any) => {
    if (completedJob.id === jobId) {
      res.write(`data: ${JSON.stringify(completedJob)}\n\n`);
      cleanup();
    }
  };
  
  const failedHandler = (failedJob: any) => {
    if (failedJob.id === jobId) {
      res.write(`data: ${JSON.stringify(failedJob)}\n\n`);
      cleanup();
    }
  };
  
  const cancelledHandler = (cancelledJob: any) => {
    if (cancelledJob.id === jobId) {
      res.write(`data: ${JSON.stringify(cancelledJob)}\n\n`);
      cleanup();
    }
  };
  
  // Register event listeners
  audioNewsletterService.on('job:progress', progressHandler);
  audioNewsletterService.on('job:completed', completedHandler);
  audioNewsletterService.on('job:failed', failedHandler);
  audioNewsletterService.on('job:cancelled', cancelledHandler);
  
  // Clean up on disconnect
  const cleanup = () => {
    audioNewsletterService.off('job:progress', progressHandler);
    audioNewsletterService.off('job:completed', completedHandler);
    audioNewsletterService.off('job:failed', failedHandler);
    audioNewsletterService.off('job:cancelled', cancelledHandler);
    res.end();
  };
  
  req.on('close', cleanup);
});

export default router;