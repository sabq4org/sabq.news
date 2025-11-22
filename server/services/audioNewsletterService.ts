import { Readable } from 'stream';
import { db } from '../db';
import { eq, desc, and, gte, lte, inArray, not } from 'drizzle-orm';
import {
  audioNewsletters,
  audioNewsletterArticles,
  audioNewsletterListens,
  articles,
  categories,
  type AudioNewsletter,
  type InsertAudioNewsletter,
  type UpdateAudioNewsletter,
  type AudioNewsletterArticle,
  type InsertAudioNewsletterArticle,
  type Article,
} from '@shared/schema';
import { nanoid } from 'nanoid';
import { getElevenLabsService } from './elevenlabs';
import type { ElevenLabsService, TTSOptions } from './elevenlabs';
import { EventEmitter } from 'events';

// Voice configurations for different narrators
// Using ElevenLabs Flash v2.5 model for Arabic optimization
export const ARABIC_VOICES = {
  // Male voices with Arabic language support
  MALE_NEWS: {
    id: 'onwK4e9ZLuTAKqWW03F9', // Ali - Arabic male voice
    name: 'Ali - News Anchor',
    model_id: 'eleven_flash_v2_5', // Flash v2.5 for low latency
    settings: {
      stability: 0.5, // Balanced for news content
      similarity_boost: 0.75, // Natural sounding
      style: 0.0, // Neutral for news
      use_speaker_boost: true // For clarity
    }
  },
  MALE_ANALYSIS: {
    id: 'pqHfZKP75CvOlQylNhV4', // Omar - Arabic male voice
    name: 'Omar - Deep Analysis',
    model_id: 'eleven_flash_v2_5', // Flash v2.5 for low latency
    settings: {
      stability: 0.5, // Balanced for news content
      similarity_boost: 0.75, // Natural sounding
      style: 0.0, // Neutral for news
      use_speaker_boost: true // For clarity
    }
  },
  // Female voices with Arabic language support
  FEMALE_NEWS: {
    id: 'XB0fDUnXU5powFXDhCwa', // Amira - Arabic female voice
    name: 'Amira - News Anchor',
    model_id: 'eleven_flash_v2_5', // Flash v2.5 for low latency
    settings: {
      stability: 0.5, // Balanced for news content
      similarity_boost: 0.75, // Natural sounding
      style: 0.0, // Neutral for news
      use_speaker_boost: true // For clarity
    }
  },
  FEMALE_CONVERSATIONAL: {
    id: 'LcfcDJNUP1GQjkzn1xUU', // Leila - Arabic female voice
    name: 'Leila - Conversational',
    model_id: 'eleven_flash_v2_5', // Flash v2.5 for low latency
    settings: {
      stability: 0.5, // Balanced for news content
      similarity_boost: 0.75, // Natural sounding
      style: 0.0, // Neutral for news
      use_speaker_boost: true // For clarity
    }
  }
};

// Newsletter templates with different script structures
export enum NewsletterTemplate {
  MORNING_BRIEF = 'morning_brief',
  EVENING_DIGEST = 'evening_digest',
  WEEKLY_ANALYSIS = 'weekly_analysis',
  BREAKING_NEWS = 'breaking_news',
  TECH_UPDATE = 'tech_update',
  BUSINESS_REPORT = 'business_report',
  SPORT_HIGHLIGHTS = 'sport_highlights',
  CUSTOM = 'custom'
}

// Newsletter scheduling types
export interface RecurringSchedule {
  type: 'daily' | 'weekly' | 'custom';
  time: string; // HH:mm format
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  timezone: string; // e.g., 'Asia/Riyadh'
  enabled: boolean;
}

// Audio generation status
export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  GENERATING_AUDIO = 'generating_audio',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Job data for queue processing
export interface AudioGenerationJob {
  id: string;
  newsletterId: string;
  status: GenerationStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

// Script template builder interface
interface ScriptTemplate {
  introduction: (data: any) => string;
  articleSegment: (article: any, index: number) => string;
  transition: (fromTopic: string, toTopic: string) => string;
  conclusion: (data: any) => string;
}

// Newsletter script templates
const SCRIPT_TEMPLATES: Record<NewsletterTemplate, ScriptTemplate> = {
  [NewsletterTemplate.MORNING_BRIEF]: {
    introduction: (data) => `
      صباح الخير ومرحباً بكم في نشرة سبق الصباحية ليوم ${data.date}.
      معكم أبرز الأخبار والتطورات التي يجب أن تعرفوها لبداية يومكم.
    `,
    articleSegment: (article, index) => `
      الخبر ${index === 0 ? 'الأول' : index === 1 ? 'الثاني' : `رقم ${index + 1}`}: 
      ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
    `,
    transition: (from, to) => `
      وننتقل الآن من أخبار ${from} إلى أخبار ${to}.
    `,
    conclusion: (data) => `
      كانت هذه أبرز أخبار الصباح من سبق.
      نتمنى لكم يوماً موفقاً، ونلقاكم في النشرة المسائية.
      للمزيد من الأخبار، تابعونا على تطبيق سبق.
    `
  },
  
  [NewsletterTemplate.EVENING_DIGEST]: {
    introduction: (data) => `
      مساء الخير، أهلاً بكم في النشرة المسائية من سبق.
      نستعرض معكم أهم ما حدث اليوم ${data.date} من أخبار وتطورات.
    `,
    articleSegment: (article, index) => `
      في التفاصيل: ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
      ${article.author ? `كتبها: ${article.author}` : ''}
    `,
    transition: (from, to) => `
      ومن ${from}، ننتقل إلى ${to}.
    `,
    conclusion: (data) => `
      إلى هنا نصل إلى ختام نشرتنا المسائية.
      شكراً لاستماعكم، ونراكم غداً بإذن الله.
      تصبحون على خير.
    `
  },
  
  [NewsletterTemplate.WEEKLY_ANALYSIS]: {
    introduction: (data) => `
      أهلاً بكم في النشرة الأسبوعية التحليلية من سبق.
      نقدم لكم تحليلاً معمقاً لأبرز أحداث الأسبوع الماضي وتأثيراتها المحتملة.
      معكم ${data.narrator || 'فريق سبق الإخباري'}.
    `,
    articleSegment: (article, index) => `
      التحليل ${index + 1}: ${article.title}.
      
      السياق: ${article.context || ''}
      
      التفاصيل: ${article.aiSummary || article.excerpt || ''}
      
      التأثير المتوقع: ${article.impact || 'يُتابع تطور الأحداث.'}
    `,
    transition: (from, to) => `
      بعد استعراض ${from}، دعونا ننتقل إلى ${to}.
    `,
    conclusion: (data) => `
      نشكركم على الاستماع إلى تحليلنا الأسبوعي.
      نلقاكم الأسبوع المقبل مع المزيد من التحليلات المعمقة.
      لا تنسوا متابعتنا على تطبيق سبق للحصول على آخر الأخبار فور حدوثها.
    `
  },
  
  [NewsletterTemplate.BREAKING_NEWS]: {
    introduction: (data) => `
      عاجل من سبق.
      ${data.urgency ? 'خبر هام وعاجل.' : ''}
      نقاطعكم بآخر التطورات.
    `,
    articleSegment: (article, index) => `
      ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
      ${article.location ? `من ${article.location}` : ''}
    `,
    transition: () => '',
    conclusion: (data) => `
      سنوافيكم بالمزيد من التفاصيل فور ورودها.
      تابعوا تطبيق سبق للحصول على آخر التحديثات.
    `
  },
  
  [NewsletterTemplate.TECH_UPDATE]: {
    introduction: (data) => `
      مرحباً بكم في نشرة سبق التقنية.
      نستعرض معكم أحدث التطورات في عالم التكنولوجيا والابتكار.
    `,
    articleSegment: (article, index) => `
      الخبر التقني ${index + 1}: ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
      ${article.impact ? `التأثير على السوق: ${article.impact}` : ''}
    `,
    transition: (from, to) => `
      ومن ${from} إلى ${to}.
    `,
    conclusion: (data) => `
      كانت هذه نشرة سبق التقنية.
      للمزيد من أخبار التكنولوجيا، تابعونا على تطبيق سبق.
    `
  },
  
  [NewsletterTemplate.BUSINESS_REPORT]: {
    introduction: (data) => `
      أهلاً بكم في التقرير الاقتصادي من سبق.
      نستعرض أبرز التطورات في الأسواق المحلية والعالمية.
      ${data.marketStatus ? `حالة الأسواق: ${data.marketStatus}` : ''}
    `,
    articleSegment: (article, index) => `
      في الأخبار الاقتصادية: ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
      ${article.marketImpact ? `التأثير على الأسواق: ${article.marketImpact}` : ''}
    `,
    transition: (from, to) => `
      من ${from} إلى ${to}.
    `,
    conclusion: (data) => `
      هذا كل ما لدينا في التقرير الاقتصادي اليوم.
      نراكم في التقرير القادم مع المزيد من التحليلات الاقتصادية.
    `
  },
  
  [NewsletterTemplate.SPORT_HIGHLIGHTS]: {
    introduction: (data) => `
      مرحباً بمحبي الرياضة، هذه نشرة سبق الرياضية.
      أبرز الأحداث والنتائج الرياضية ${data.period || 'اليوم'}.
    `,
    articleSegment: (article, index) => `
      في الأخبار الرياضية: ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
      ${article.score ? `النتيجة: ${article.score}` : ''}
    `,
    transition: (from, to) => `
      من ${from} إلى ${to}.
    `,
    conclusion: (data) => `
      كانت هذه أبرز الأحداث الرياضية.
      تابعونا للمزيد من الأخبار الرياضية على تطبيق سبق.
    `
  },
  
  [NewsletterTemplate.CUSTOM]: {
    introduction: (data) => data.customIntro || 'مرحباً بكم في نشرة سبق.',
    articleSegment: (article, index) => `
      ${article.title}.
      ${article.aiSummary || article.excerpt || ''}
    `,
    transition: (from, to) => `من ${from} إلى ${to}.`,
    conclusion: (data) => data.customConclusion || 'شكراً لاستماعكم.'
  }
};

export class AudioNewsletterService extends EventEmitter {
  private elevenLabs: ElevenLabsService;
  private activeJobs: Map<string, AudioGenerationJob>;
  
  constructor() {
    super();
    this.elevenLabs = getElevenLabsService();
    this.activeJobs = new Map();
  }
  
  // Create a new audio newsletter
  async createNewsletter(data: {
    title: string;
    description?: string;
    template: NewsletterTemplate;
    voiceId?: string;
    voiceSettings?: any;
    articleIds: string[];
    generatedBy: string;
    scheduledFor?: Date;
    recurringSchedule?: RecurringSchedule;
    metadata?: Record<string, any>;
  }): Promise<AudioNewsletter> {
    const newsletterId = nanoid();
    
    // Create newsletter record
    const [newsletter] = await db.insert(audioNewsletters).values({
      id: newsletterId,
      title: data.title,
      description: data.description,
      template: data.template,
      status: 'pending',
      generatedBy: data.generatedBy,
      scheduledFor: data.scheduledFor?.toISOString(),
      metadata: {
        ...data.metadata,
        voiceId: data.voiceId || ARABIC_VOICES.MALE_NEWS.id,
        voiceSettings: data.voiceSettings || ARABIC_VOICES.MALE_NEWS.settings,
        recurringSchedule: data.recurringSchedule
      }
    }).returning();
    
    // Add articles to newsletter
    if (data.articleIds.length > 0) {
      const articleLinks = data.articleIds.map((articleId, index) => ({
        id: nanoid(),
        newsletterId,
        articleId,
        orderIndex: index
      }));
      
      await db.insert(audioNewsletterArticles).values(articleLinks);
    }
    
    return newsletter;
  }
  
  // Generate audio for newsletter
  async generateAudio(newsletterId: string, options?: {
    webhookUrl?: string;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<AudioGenerationJob> {
    const job: AudioGenerationJob = {
      id: nanoid(),
      newsletterId,
      status: GenerationStatus.PENDING,
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      webhookUrl: options?.webhookUrl,
      metadata: { priority: options?.priority || 'normal' }
    };
    
    this.activeJobs.set(job.id, job);
    
    // Start processing in background
    this.processAudioGeneration(job).catch(err => {
      console.error('Audio generation failed:', err);
      job.status = GenerationStatus.FAILED;
      job.error = err.message;
      this.emit('job:failed', job);
    });
    
    return job;
  }
  
  // Process audio generation
  private async processAudioGeneration(job: AudioGenerationJob): Promise<void> {
    try {
      job.status = GenerationStatus.PROCESSING;
      job.startedAt = new Date();
      job.progress = 10;
      this.emit('job:started', job);
      
      // Get newsletter data
      const newsletter = await this.getNewsletterWithArticles(job.newsletterId);
      if (!newsletter) {
        throw new Error('Newsletter not found');
      }
      
      // Update newsletter status
      await db.update(audioNewsletters)
        .set({ status: 'processing' })
        .where(eq(audioNewsletters.id, job.newsletterId));
      
      job.progress = 20;
      this.emit('job:progress', job);
      
      // Build script from template
      const script = await this.buildScript(newsletter);
      
      job.progress = 30;
      this.emit('job:progress', job);
      
      // Save script
      await db.update(audioNewsletters)
        .set({ script })
        .where(eq(audioNewsletters.id, job.newsletterId));
      
      // Chunk text for processing
      const chunks = this.chunkText(script, 4000); // ElevenLabs character limit
      
      job.status = GenerationStatus.GENERATING_AUDIO;
      job.progress = 40;
      this.emit('job:progress', job);
      
      // Generate audio for each chunk
      const audioBuffers: Buffer[] = [];
      
      // Get voice configuration based on preset or custom settings
      const voicePreset = newsletter.metadata?.voicePreset || 'MALE_NEWS';
      const voiceConfig = ARABIC_VOICES[voicePreset as keyof typeof ARABIC_VOICES] || ARABIC_VOICES.MALE_NEWS;
      const voiceId = newsletter.metadata?.voiceId || voiceConfig.id;
      const voiceSettings = newsletter.metadata?.voiceSettings || voiceConfig.settings;
      const modelId = voiceConfig.model_id || 'eleven_flash_v2_5'; // Use Flash v2.5 for low latency
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progress = 40 + (40 * (i / chunks.length));
        
        try {
          const audioBuffer = await this.elevenLabs.textToSpeech({
            text: chunk,
            voiceId,
            voiceSettings,
            model: modelId // Use Flash v2.5 model for Arabic optimization
          }, 30000); // 30 second timeout per chunk
          
          audioBuffers.push(audioBuffer);
          
          job.progress = Math.round(progress);
          this.emit('job:progress', job);
        } catch (error) {
          console.error(`Failed to generate audio for chunk ${i + 1}:`, error);
          
          // Retry logic
          if (job.retryCount < job.maxRetries) {
            job.retryCount++;
            await this.delay(2000 * job.retryCount); // Exponential backoff
            i--; // Retry the same chunk
            continue;
          }
          
          throw new Error(`Failed to generate audio for chunk ${i + 1}: ${error}`);
        }
      }
      
      job.status = GenerationStatus.UPLOADING;
      job.progress = 80;
      this.emit('job:progress', job);
      
      // Combine audio buffers
      const combinedAudio = Buffer.concat(audioBuffers);
      
      // Upload to storage (implement your storage logic here)
      const audioUrl = await this.uploadAudio(combinedAudio, job.newsletterId);
      
      // Update newsletter with audio URL and duration
      const duration = await this.calculateAudioDuration(combinedAudio);
      
      await db.update(audioNewsletters)
        .set({
          audioUrl,
          duration,
          status: 'published',
          publishedAt: new Date().toISOString()
        })
        .where(eq(audioNewsletters.id, job.newsletterId));
      
      job.status = GenerationStatus.COMPLETED;
      job.progress = 100;
      job.completedAt = new Date();
      this.emit('job:completed', job);
      
      // Send webhook notification if configured
      if (job.webhookUrl) {
        await this.sendWebhookNotification(job.webhookUrl, {
          jobId: job.id,
          newsletterId: job.newsletterId,
          status: 'completed',
          audioUrl,
          duration
        });
      }
      
    } catch (error) {
      job.status = GenerationStatus.FAILED;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('job:failed', job);
      
      // Update newsletter status
      await db.update(audioNewsletters)
        .set({ status: 'failed' })
        .where(eq(audioNewsletters.id, job.newsletterId));
      
      // Send failure webhook
      if (job.webhookUrl) {
        await this.sendWebhookNotification(job.webhookUrl, {
          jobId: job.id,
          newsletterId: job.newsletterId,
          status: 'failed',
          error: job.error
        });
      }
      
      throw error;
    } finally {
      // Clean up job from active jobs
      this.activeJobs.delete(job.id);
    }
  }
  
  // Build script from template
  private async buildScript(newsletter: any): Promise<string> {
    const template = SCRIPT_TEMPLATES[newsletter.template as NewsletterTemplate] || SCRIPT_TEMPLATES[NewsletterTemplate.CUSTOM];
    const scriptParts: string[] = [];
    
    // Add introduction
    const introData = {
      date: new Date().toLocaleDateString('ar-SA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      narrator: newsletter.metadata?.narrator,
      urgency: newsletter.metadata?.urgency,
      period: newsletter.metadata?.period,
      marketStatus: newsletter.metadata?.marketStatus,
      customIntro: newsletter.metadata?.customIntro
    };
    
    scriptParts.push(template.introduction(introData));
    
    // Process articles by category for smooth transitions
    const articlesByCategory = this.groupArticlesByCategory(newsletter.articles);
    let previousCategory = '';
    
    for (const [category, categoryArticles] of Object.entries(articlesByCategory)) {
      // Add transition if not first category
      if (previousCategory && template.transition) {
        scriptParts.push(template.transition(previousCategory, category));
      }
      
      // Add articles
      for (let i = 0; i < categoryArticles.length; i++) {
        const article = categoryArticles[i] as any;
        const articleData = {
          ...article,
          context: newsletter.metadata?.articleContext?.[article.id],
          impact: newsletter.metadata?.articleImpact?.[article.id],
          location: article.metadata?.location,
          author: article.authorName,
          score: article.metadata?.score,
          marketImpact: article.metadata?.marketImpact
        };
        
        scriptParts.push(template.articleSegment(articleData, i));
        
        // Add pause between articles
        if (i < categoryArticles.length - 1) {
          scriptParts.push('\n\n');
        }
      }
      
      previousCategory = category;
    }
    
    // Add conclusion
    const conclusionData = {
      customConclusion: newsletter.metadata?.customConclusion
    };
    
    scriptParts.push(template.conclusion(conclusionData));
    
    return scriptParts.join('\n\n').trim();
  }
  
  // Group articles by category for better flow
  private groupArticlesByCategory(articles: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const article of articles) {
      const category = article.category?.nameAr || 'عام';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(article);
    }
    
    return grouped;
  }
  
  // Chunk text for processing within API limits
  private chunkText(text: string, maxChars: number = 4000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence + '. ';
      
      if ((currentChunk + sentenceWithPunctuation).length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentenceWithPunctuation;
        } else {
          // Single sentence exceeds limit, split it
          const words = sentenceWithPunctuation.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if ((wordChunk + word + ' ').length > maxChars) {
              chunks.push(wordChunk.trim());
              wordChunk = word + ' ';
            } else {
              wordChunk += word + ' ';
            }
          }
          
          if (wordChunk) {
            currentChunk = wordChunk;
          }
        }
      } else {
        currentChunk += sentenceWithPunctuation;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  // Get newsletter with articles
  private async getNewsletterWithArticles(newsletterId: string): Promise<any> {
    const newsletter = await db.query.audioNewsletters.findFirst({
      where: eq(audioNewsletters.id, newsletterId),
      with: {
        articles: {
          with: {
            article: {
              with: {
                category: true
              }
            }
          }
        }
      }
    });
    
    if (!newsletter) return null;
    
    // Sort articles by order index and map to simpler structure
    const sortedArticles = newsletter.articles
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(item => ({
        ...item.article,
        orderIndex: item.orderIndex
      }));
    
    return {
      ...newsletter,
      articles: sortedArticles
    };
  }
  
  // Upload audio to storage
  private async uploadAudio(audioBuffer: Buffer, newsletterId: string): Promise<string> {
    // Implement your storage logic here
    // This is a placeholder - you should integrate with your actual storage service
    
    const fileName = `newsletters/audio_${newsletterId}_${Date.now()}.mp3`;
    
    // For now, return a mock URL
    // In production, upload to S3, GCS, or your preferred storage
    return `/api/audio/${fileName}`;
  }
  
  // Calculate audio duration
  private async calculateAudioDuration(audioBuffer: Buffer): Promise<number> {
    // This is a simplified estimation
    // For accurate duration, use an audio processing library like ffprobe
    
    // Rough estimation: ~150 words per minute, ~5 chars per word
    // MP3 at 128kbps = ~16KB per second
    const sizeInKB = audioBuffer.length / 1024;
    const estimatedSeconds = sizeInKB / 16;
    
    return Math.round(estimatedSeconds);
  }
  
  // Send webhook notification
  private async sendWebhookNotification(url: string, data: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
  
  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get job status
  getJobStatus(jobId: string): AudioGenerationJob | undefined {
    return this.activeJobs.get(jobId);
  }
  
  // Cancel job
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status === GenerationStatus.COMPLETED) {
      return false;
    }
    
    job.status = GenerationStatus.CANCELLED;
    this.emit('job:cancelled', job);
    
    // Update newsletter status
    await db.update(audioNewsletters)
      .set({ status: 'cancelled' })
      .where(eq(audioNewsletters.id, job.newsletterId));
    
    this.activeJobs.delete(jobId);
    return true;
  }
  
  // Get all active jobs
  getActiveJobs(): AudioGenerationJob[] {
    return Array.from(this.activeJobs.values());
  }
  
  // Track listen event
  async trackListen(newsletterId: string, userId: string, duration?: number): Promise<void> {
    await db.insert(audioNewsletterListens).values({
      id: nanoid(),
      newsletterId,
      userId,
      listenedAt: new Date().toISOString(),
      duration
    });
    
    // Update total listens count
    await db.update(audioNewsletters)
      .set({
        totalListens: db.sql`${audioNewsletters.totalListens} + 1`
      })
      .where(eq(audioNewsletters.id, newsletterId));
  }
  
  // Get newsletter analytics
  async getNewsletterAnalytics(newsletterId: string): Promise<any> {
    const listens = await db.query.audioNewsletterListens.findMany({
      where: eq(audioNewsletterListens.newsletterId, newsletterId),
      with: {
        user: true
      }
    });
    
    const uniqueListeners = new Set(listens.map(l => l.userId)).size;
    const totalDuration = listens.reduce((sum, l) => sum + (l.duration || 0), 0);
    const avgDuration = listens.length > 0 ? totalDuration / listens.length : 0;
    
    // Group listens by hour
    const listensByHour: Record<number, number> = {};
    listens.forEach(listen => {
      const hour = new Date(listen.listenedAt).getHours();
      listensByHour[hour] = (listensByHour[hour] || 0) + 1;
    });
    
    // Group listens by day
    const listensByDay: Record<string, number> = {};
    listens.forEach(listen => {
      const day = new Date(listen.listenedAt).toISOString().split('T')[0];
      listensByDay[day] = (listensByDay[day] || 0) + 1;
    });
    
    return {
      totalListens: listens.length,
      uniqueListeners,
      avgDuration,
      totalDuration,
      listensByHour,
      listensByDay,
      recentListens: listens.slice(-10)
    };
  }
  
  // Get scheduled newsletters
  async getScheduledNewsletters(): Promise<AudioNewsletter[]> {
    const now = new Date().toISOString();
    
    return await db.query.audioNewsletters.findMany({
      where: and(
        eq(audioNewsletters.status, 'scheduled'),
        lte(audioNewsletters.scheduledFor, now)
      )
    });
  }
  
  // Process scheduled newsletters
  async processScheduledNewsletters(): Promise<void> {
    const scheduled = await this.getScheduledNewsletters();
    
    for (const newsletter of scheduled) {
      // Generate audio for scheduled newsletter
      await this.generateAudio(newsletter.id);
      
      // Check if this is a recurring newsletter
      const recurringSchedule = newsletter.metadata?.recurringSchedule as RecurringSchedule;
      if (recurringSchedule?.enabled) {
        // Calculate next scheduled time
        const nextScheduledFor = this.calculateNextScheduledTime(recurringSchedule);
        
        // Create new newsletter for next occurrence
        await this.createNewsletter({
          title: newsletter.title,
          description: newsletter.description,
          template: newsletter.template as NewsletterTemplate,
          voiceId: newsletter.metadata?.voiceId,
          voiceSettings: newsletter.metadata?.voiceSettings,
          articleIds: [], // Will be populated based on template rules
          generatedBy: 'system',
          scheduledFor: nextScheduledFor,
          recurringSchedule,
          metadata: newsletter.metadata
        });
      }
    }
  }
  
  // Calculate next scheduled time for recurring newsletter
  private calculateNextScheduledTime(schedule: RecurringSchedule): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    switch (schedule.type) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Find next occurrence based on days of week
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          const currentDay = now.getDay();
          let daysToAdd = 0;
          
          for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (schedule.daysOfWeek.includes(checkDay)) {
              daysToAdd = i;
              break;
            }
          }
          
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
        break;
        
      case 'custom':
        // Implement custom logic based on metadata
        break;
    }
    
    return nextDate;
  }
}

// Export singleton instance
export const audioNewsletterService = new AudioNewsletterService();