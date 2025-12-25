import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import nanoBananaRoutes from "./routes/nanoBananaRoutes";
import visualAiRoutes from "./routes/visualAiRoutes";
import autoImageRoutes from "./routes/autoImageRoutes";
import notebookLmRoutes from "./routes/notebookLmRoutes";
import rssFeedRoutes from "./routes/rssFeedRoutes";
import aiTasksRoutes from "./routes/aiTasksRoutes";
import advancedAnalyticsRoutes from "./routes/advancedAnalytics";
import quizRoutes from "./quiz-routes";
import { setupVite, serveStatic, log } from "./vite";
import { startNotificationWorker } from "./notificationWorker";
import { startSeasonalCategoriesJob } from "./jobs/seasonalCategoriesJob";
import { startDynamicCategoriesJob } from "./jobs/dynamicCategoriesJob";
import { startCampaignDailyResetJob } from "./jobs/campaignDailyResetJob";
import { startAITasksScheduler } from "./jobs/aiTasksJob";
import { startAiTasksCleanupJob } from "./jobs/aiTasksCleanup";
import { startIfoxContentGeneratorJob } from "./jobs/ifoxContentGeneratorJob";
import { newsletterScheduler } from "./services/newsletterScheduler";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";

// ============================================
// GLOBAL ERROR HANDLERS - حماية السيرفر من التوقف
// ============================================
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error.message);
  console.error('[CRITICAL] Stack:', error.stack);
  // Log but don't exit - let the process continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise);
  console.error('[CRITICAL] Reason:', reason);
  // Log but don't exit - let the process continue
});

const app = express();

// Trust proxy - important for rate limiting to work correctly behind proxies
app.set("trust proxy", 1);

// Health check endpoints BEFORE CORS - critical for deployment health probes
app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.DATABASE_URL ? "configured" : "missing"
  });
});

app.get("/ready", (_req, res) => {
  res.status(200).json({ 
    status: "ready",
    server: "running",
    timestamp: new Date().toISOString()
  });
});

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || [])
  .concat(
    (process.env.REPLIT_DOMAINS?.split(',') || []).map(domain => 
      domain.trim().startsWith('http') ? domain.trim() : `https://${domain.trim()}`
    )
  )
  .concat(['http://localhost:5000', 'http://localhost:5001', 'http://127.0.0.1:5000', 'http://127.0.0.1:5001'])
  .concat(['https://appleid.apple.com']) // Allow Apple OAuth callback
  .filter(origin => origin && origin.trim().length > 0) // Remove empty strings
  .map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Normalize origin - remove port suffix for matching (handles :5000 suffix from health probes)
      const normalizedOrigin = origin.replace(/:5000$/, '').replace(/:5001$/, '');
      
      // Check both exact match and normalized match (without port)
      const isAllowed = allowedOrigins.includes(origin) || 
                        allowedOrigins.includes(normalizedOrigin) ||
                        allowedOrigins.some(allowed => allowed.replace(/:5000$/, '').replace(/:5001$/, '') === normalizedOrigin);
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        console.warn(`[CORS] Allowed origins:`, allowedOrigins);
        callback(new Error('غير مسموح بالوصول من هذا المصدر'));
      }
    },
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Security headers with Helmet.js
const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isDevelopment 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://platform.twitter.com", "https://cdn.syndication.twimg.com"]
          : ["'self'", "https://platform.twitter.com", "https://cdn.syndication.twimg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://ton.twimg.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://*.twimg.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          ...(isDevelopment ? ["ws:", "wss:"] : ["wss:"]),
          "https://api.openai.com",
          "https://api.elevenlabs.io",
          "https://storage.googleapis.com",
          "https://syndication.twitter.com",
          "https://generativelanguage.googleapis.com"
        ],
        mediaSrc: ["'self'", "https:", "blob:"],
        objectSrc: ["'none'"],
        frameSrc: [
          "'self'", 
          "https://platform.twitter.com", 
          "https://twitter.com", 
          "https://x.com",
          "https://www.youtube.com",
          "https://www.dailymotion.com"
        ],
        baseUri: ["'self'"],
        formAction: ["'self'", "https://appleid.apple.com"],
        upgradeInsecureRequests: isDevelopment ? null : [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
  })
);

// Enable Gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control: no-transform directive
    if (req.headers['cache-control']?.includes('no-transform')) {
      return false;
    }
    // Compress everything else
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, default is 6)
  threshold: 1024, // Only compress responses larger than 1KB
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from uploads directory (for thumbnails and advertiser ads)
const uploadsDir = '/home/runner/workspace/uploads';
app.use('/uploads', express.static(uploadsDir));
console.log(`[Server] ✅ Static uploads directory configured: ${uploadsDir}`);

// Serve static files from public directory (for branding, logos, etc.)
const publicDir = path.join(process.cwd(), 'public');
app.use('/branding', express.static(path.join(publicDir, 'branding')));
console.log(`[Server] ✅ Static branding directory configured: ${publicDir}/branding`);

// Rate limiting configurations
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per IP per window (per user, not global)
  message: { message: "تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى بعد قليل" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/health") || req.path.startsWith("/ready"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { message: "تم تجاوز حد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window for sensitive operations
  message: { message: "تم تجاوز حد الطلبات للعمليات الحساسة. يرجى المحاولة بعد قليل" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Smart caching middleware - must come before routes
app.use((req, res, next) => {
  const path = req.path;
  
  // Hashed assets (Vite generates files like main-abc123.js)
  // Cache aggressively with immutable flag
  if (/\/assets\/.*\.(js|css)$/.test(path) && /[-_][a-f0-9]{8,}/.test(path)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Images and fonts - cache for 30 days
  else if (/\.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)$/i.test(path)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
  }
  // HTML files - always revalidate
  else if (path.endsWith('.html') || path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  // API routes - cache is now controlled per-endpoint in routes.ts via cacheControl middleware
  // No default cache headers set here to allow individual routes to opt-in
  
  next();
});

// Apply general rate limiter to all API routes
app.use("/api", generalApiLimiter);

// ============================================
// APM (Application Performance Monitoring) Middleware
// ============================================
const apmStats = {
  requests: { total: 0, success: 0, errors: 0 },
  responseTimes: [] as number[],
  slowRequests: [] as { path: string; method: string; duration: number; timestamp: Date }[],
  errorPaths: new Map<string, number>(),
};

// APM stats endpoint
app.get("/api/apm/stats", (req, res) => {
  const avgResponseTime = apmStats.responseTimes.length > 0 
    ? apmStats.responseTimes.reduce((a, b) => a + b, 0) / apmStats.responseTimes.length 
    : 0;
  
  const p95Index = Math.floor(apmStats.responseTimes.length * 0.95);
  const sortedTimes = [...apmStats.responseTimes].sort((a, b) => a - b);
  const p95ResponseTime = sortedTimes[p95Index] || 0;
  
  res.json({
    requests: apmStats.requests,
    performance: {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      samplesCount: apmStats.responseTimes.length,
    },
    slowRequests: apmStats.slowRequests.slice(-10), // Last 10 slow requests
    topErrorPaths: Array.from(apmStats.errorPaths.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// Reset APM stats (for testing)
app.post("/api/apm/reset", (req, res) => {
  apmStats.requests = { total: 0, success: 0, errors: 0 };
  apmStats.responseTimes = [];
  apmStats.slowRequests = [];
  apmStats.errorPaths.clear();
  res.json({ message: "APM stats reset successfully" });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // APM tracking for API routes
    if (path.startsWith("/api") && !path.includes("/apm/")) {
      apmStats.requests.total++;
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        apmStats.requests.success++;
      } else if (res.statusCode >= 400) {
        apmStats.requests.errors++;
        const errorCount = apmStats.errorPaths.get(path) || 0;
        apmStats.errorPaths.set(path, errorCount + 1);
      }
      
      // Track response times (keep last 1000 samples)
      apmStats.responseTimes.push(duration);
      if (apmStats.responseTimes.length > 1000) {
        apmStats.responseTimes.shift();
      }
      
      // Track slow requests (>1000ms)
      if (duration > 1000) {
        apmStats.slowRequests.push({
          path,
          method: req.method,
          duration,
          timestamp: new Date(),
        });
        if (apmStats.slowRequests.length > 50) {
          apmStats.slowRequests.shift();
        }
        console.warn(`[APM] ⚠️ Slow request: ${req.method} ${path} took ${duration}ms`);
      }
      
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[Server] Starting server initialization...");
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Port: ${process.env.PORT || "5000"}`);
    
    // Check for required environment variables in production
    if (process.env.NODE_ENV === "production") {
      const requiredEnvVars = ["DATABASE_URL"];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error(`[Server] ⚠️  WARNING: Missing required environment variables: ${missingVars.join(", ")}`);
        console.error("[Server] Please configure these in your deployment settings");
        console.error("[Server] Server will start but database features will not work");
      } else {
        console.log("[Server] ✅ All required environment variables are present");
      }
    }

    // Register Audio Newsletter routes FIRST to avoid conflicts with catch-all routes in main routes.ts
    const audioNewsletterRoutes = await import("./routes/audioNewsletterRoutes");
    app.use("/api/audio-newsletters", audioNewsletterRoutes.default);
    console.log("[Server] ✅ Audio Newsletter routes registered (priority)");

    const server = await registerRoutes(app);
    console.log("[Server] ✅ Routes registered successfully");

    // Register Nano Banana Pro routes
    app.use("/api/nano-banana", nanoBananaRoutes);
    console.log("[Server] ✅ Nano Banana Pro routes registered");
    
    // Register NotebookLM routes
    app.use("/api/notebooklm", notebookLmRoutes);
    console.log("[Server] ✅ NotebookLM routes registered");
    
    // Register Visual AI routes
    app.use("/api/visual-ai", visualAiRoutes);
    console.log("[Server] ✅ Visual AI routes registered");
    
    app.use("/api/auto-image", autoImageRoutes);
    console.log("[Server] ✅ Auto Image Generation routes registered");
    
    // Register Thumbnail routes
    const thumbnailRoutes = await import("./routes/thumbnailRoutes");
    app.use("/api/thumbnails", thumbnailRoutes.default);
    console.log("[Server] ✅ Thumbnail routes registered");
    
    // Register Story Cards routes
    const { storyCardsRouter } = await import("./routes/storyCardsRoutes");
    app.post("/api/story-cards/generate", storyCardsRouter.post["/generate"]);
    app.post("/api/story-cards/instagram-carousel", storyCardsRouter.post["/instagram-carousel"]);
    app.post("/api/story-cards/linkedin-document", storyCardsRouter.post["/linkedin-document"]);
    app.get("/api/story-cards/article/:articleId", storyCardsRouter.get["/article/:articleId"]);
    app.patch("/api/story-cards/:cardId", storyCardsRouter.patch["/:cardId"]);
    app.delete("/api/story-cards/:cardId", storyCardsRouter.delete["/:cardId"]);
    console.log("[Server] ✅ Story Cards routes registered");

    // Register RSS Feed routes
    app.use("/api/rss", rssFeedRoutes);
    console.log("[Server] ✅ RSS Feed routes registered");
    
    // Register AI Tasks routes (iFox AI Autonomous Newsroom)
    app.use("/api/ai-tasks", aiTasksRoutes);
    console.log("[Server] ✅ AI Tasks routes registered");
    
    // Register Advanced Analytics routes
    app.use("/api/advanced-analytics", advancedAnalyticsRoutes);
    console.log("[Server] ✅ Advanced Analytics routes registered");
    
    // Register Quiz routes
    app.use(quizRoutes);
    console.log("[Server] ✅ Quiz routes registered");

    // Social media crawler middleware - MUST come before Vite/static setup
    // This intercepts crawler requests and serves static HTML with proper meta tags
    const { socialCrawlerMiddleware } = await import("./socialCrawler");
    app.use(socialCrawlerMiddleware);
    console.log("[Server] ✅ Social crawler middleware registered");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`[Server] Error: ${status} - ${message}`, err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    
    // Detect environment more reliably
    // In production: NODE_ENV should be 'production' OR built files should exist
    const isProduction = process.env.NODE_ENV === "production" || 
                        process.env.REPLIT_DEPLOYMENT === "1" ||
                        fs.existsSync(path.resolve(import.meta.dirname, "public"));
    
    if (!isProduction && app.get("env") === "development") {
      console.log("[Server] Starting in DEVELOPMENT mode with Vite");
      await setupVite(app, server);
      console.log("[Server] ✅ Vite setup completed");
    } else {
      console.log("[Server] Starting in PRODUCTION mode with static files");
      serveStatic(app);
      console.log("[Server] ✅ Static files setup completed");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`[Server] ✅ Successfully started on port ${port}`);
      console.log(`[Server] Health check available at http://0.0.0.0:${port}/health`);
      console.log(`[Server] Ready check available at http://0.0.0.0:${port}/ready`);
      log(`serving on port ${port}`);
      
      // Background workers should ONLY run in Reserved VM deployments
      // For Autoscale deployments, set ENABLE_BACKGROUND_WORKERS=false or leave it unset
      const enableBackgroundWorkers = process.env.ENABLE_BACKGROUND_WORKERS === "true";
      
      if (!enableBackgroundWorkers) {
        console.log("[Server] ℹ️  Background workers disabled (ENABLE_BACKGROUND_WORKERS not set to 'true')");
        console.log("[Server] This is recommended for Autoscale deployments");
        console.log("[Server] To enable background workers, set ENABLE_BACKGROUND_WORKERS=true in a Reserved VM deployment");
      }
      
      // Start notification worker in a non-blocking way
      // Any errors in the worker won't crash the main server
      if (enableBackgroundWorkers) {
        setImmediate(() => {
          try {
            startNotificationWorker();
          } catch (error) {
            console.error("[Server] ⚠️  Error starting notification worker:", error);
            console.error("[Server] Server will continue running without notification worker");
          }
        });
      }

      // Register job queue handlers for TTS generation
      if (enableBackgroundWorkers) {
        setImmediate(async () => {
          try {
            const { jobQueue } = await import("./services/job-queue");
            const { getElevenLabsService } = await import("./services/elevenlabs");
            const { ObjectStorageService } = await import("./objectStorage");
            const { storage } = await import("./storage");

          jobQueue.onExecute(async (job) => {
            if (job.type === 'generate-tts') {
              console.log(`[JobQueue] Executing TTS generation job ${job.id}`);
              
              const { newsletterId } = job.data;
              const newsletter = await storage.getAudioNewsletterById(newsletterId);

              if (!newsletter) {
                throw new Error('النشرة الصوتية غير موجودة');
              }

              // Update status to processing
              await storage.updateAudioNewsletter(newsletter.id, {
                generationStatus: 'processing',
                generationError: null,
              });

              const elevenLabs = getElevenLabsService();
              const objectStorage = new ObjectStorageService();

              // Build script from articles
              const articlesData = newsletter.articles?.map(na => ({
                title: na.article?.title || '',
                excerpt: na.article?.excerpt || undefined,
                aiSummary: na.article?.aiSummary || undefined,
              })) || [];

              const script = elevenLabs.buildNewsletterScript({
                title: newsletter.title,
                description: newsletter.description || undefined,
                articles: articlesData,
              });

              console.log(`[JobQueue] Generating TTS for newsletter ${newsletter.id}`);
              console.log(`[JobQueue] Script length: ${script.length} characters`);

              // Generate audio
              const audioBuffer = await elevenLabs.textToSpeech({
                text: script,
                voiceId: newsletter.voiceId || undefined,
                model: newsletter.voiceModel || undefined,
                voiceSettings: newsletter.voiceSettings || undefined,
              });

              // Upload to object storage
              const audioPath = `audio-newsletters/${newsletter.id}.mp3`;
              const uploadedFile = await objectStorage.uploadFile(
                audioPath,
                audioBuffer,
                'audio/mpeg'
              );

              // Update newsletter with audio details
              await storage.updateAudioNewsletter(newsletter.id, {
                audioUrl: uploadedFile.url,
                fileSize: audioBuffer.length,
                duration: Math.floor(audioBuffer.length / 16000), // Rough estimate
                generationStatus: 'completed',
                generationError: null,
              });

              console.log(`[JobQueue] Successfully generated audio for newsletter ${newsletter.id}`);
            } else if (job.type === 'generate-audio-brief') {
              console.log(`[JobQueue] Executing audio brief generation job ${job.id}`);
              
              const { briefId } = job.data;
              const brief = await storage.getAudioNewsBriefById(briefId);

              if (!brief) {
                throw new Error('الخبر الصوتي غير موجود');
              }

              // Update status to processing
              await storage.updateAudioNewsBrief(briefId, {
                generationStatus: 'processing',
              });

              const elevenLabs = getElevenLabsService();
              const objectStorage = new ObjectStorageService();

              console.log(`[JobQueue] Generating TTS for audio brief ${briefId}`);
              console.log(`[JobQueue] Content length: ${brief.content.length} characters`);

              // Generate audio
              const audioBuffer = await elevenLabs.textToSpeech({
                text: brief.content,
                voiceId: brief.voiceId || undefined,
                voiceSettings: brief.voiceSettings || undefined,
              });

              // Upload to object storage
              const audioPath = `audio-briefs/brief_${briefId}_${Date.now()}.mp3`;
              const uploadedFile = await objectStorage.uploadFile(
                audioPath,
                audioBuffer,
                'audio/mpeg'
              );

              // Get audio duration (rough estimate: ~150 words per minute for Arabic)
              const wordCount = brief.content.split(/\s+/).length;
              const estimatedDuration = Math.ceil((wordCount / 150) * 60);

              // Update brief with audio details
              await storage.updateAudioNewsBrief(briefId, {
                audioUrl: uploadedFile.url,
                duration: estimatedDuration,
                generationStatus: 'completed',
              });

              console.log(`[JobQueue] Successfully generated audio for brief ${briefId}`);
            }
          });

            console.log("[Server] ✅ Job queue handlers registered successfully");
          } catch (error) {
            console.error("[Server] ⚠️  Error registering job queue handlers:", error);
            console.error("[Server] Server will continue running without job queue");
          }
        });
      }

      // Start Seasonal Categories Job
      if (enableBackgroundWorkers) {
        setImmediate(() => {
          try {
            startSeasonalCategoriesJob();
          } catch (error) {
            console.error("[Server] ⚠️  Error starting seasonal categories job:", error);
            console.error("[Server] Server will continue running without seasonal categories automation");
          }
        });
      }

      // Start Dynamic Categories Job (updates "الآن" every 5 minutes)
      if (enableBackgroundWorkers) {
        setImmediate(() => {
          try {
            startDynamicCategoriesJob();
          } catch (error) {
            console.error("[Server] ⚠️  Error starting dynamic categories job:", error);
            console.error("[Server] Server will continue running without dynamic categories automation");
          }
        });
      }

      // Start Campaign Daily Reset Job (resets daily impressions at midnight)
      if (enableBackgroundWorkers) {
        setImmediate(() => {
          try {
            startCampaignDailyResetJob();
          } catch (error) {
            console.error("[Server] ⚠️  Error starting campaign daily reset job:", error);
            console.error("[Server] Server will continue running without campaign daily reset automation");
          }
        });
      }
      
      // Start Audio Newsletter Jobs (scheduled generation and retries)
      if (enableBackgroundWorkers) {
        setImmediate(async () => {
          try {
            const { initializeAudioNewsletterJobs } = await import("./jobs/audioNewsletterJob");
            initializeAudioNewsletterJobs();
            console.log("[Server] ✅ Audio newsletter jobs started successfully");
          } catch (error) {
            console.error("[Server] ⚠️  Error starting audio newsletter jobs:", error);
            console.error("[Server] Server will continue running without audio newsletter automation");
          }
        });
      }

      // Start Newsletter Scheduler (automated cron-based newsletter generation)
      // Enable scheduler by default unless explicitly disabled
      const enableNewsletterScheduler = process.env.ENABLE_NEWSLETTER_SCHEDULER !== 'false';
      
      if (enableBackgroundWorkers && enableNewsletterScheduler) {
        setImmediate(() => {
          try {
            // Start the newsletter scheduler with Saudi Arabia timezone (UTC+3)
            newsletterScheduler.start();
            console.log("[Server] ✅ Newsletter scheduler started successfully");
            console.log("[Server] 📅 Scheduler timezone: UTC+3 (Saudi Arabia)");
            
            // Log scheduled newsletter details
            const status = newsletterScheduler.getStatus();
            if (status.schedules.length > 0) {
              console.log("[Server] 📰 Active newsletter schedules:");
              status.schedules.forEach(schedule => {
                console.log(`[Server]   - ${schedule.type}: ${schedule.cronSchedule} (${schedule.description || 'No description'})`);
              });
              console.log(`[Server] 🔄 Scheduler is ${status.isRunning ? 'RUNNING' : 'STOPPED'}`);
            } else {
              console.log("[Server] ⚠️  No newsletter schedules configured yet");
            }
          } catch (error) {
            console.error("[Server] ⚠️  Error starting newsletter scheduler:", error);
            console.error("[Server] Server will continue running without newsletter scheduler");
          }
        });
      } else if (!enableBackgroundWorkers) {
        console.log("[Server] Newsletter scheduler skipped (background workers disabled)");
      } else {
        console.log("[Server] Newsletter scheduler disabled (set ENABLE_NEWSLETTER_SCHEDULER=true to enable)");
      }
      
      // Start AI Tasks Scheduler (automated AI content generation for iFox)
      // Enable scheduler by default unless explicitly disabled
      const enableAITasksScheduler = process.env.ENABLE_AI_TASKS_SCHEDULER !== 'false';
      
      if (enableBackgroundWorkers && enableAITasksScheduler) {
        setImmediate(() => {
          try {
            startAITasksScheduler();
            console.log("[Server] ✅ AI Tasks Scheduler started successfully");
            console.log("[Server] 🤖 Checking for pending AI tasks every minute");
            
            // Start cleanup job for stuck tasks
            startAiTasksCleanupJob();
            console.log("[Server] ✅ AI Tasks Cleanup job started successfully");
            
            // Start iFox content generator job
            startIfoxContentGeneratorJob();
            console.log("[Server] ✅ iFox Content Generator started successfully");
          } catch (error) {
            console.error("[Server] ⚠️  Error starting AI tasks scheduler:", error);
            console.error("[Server] Server will continue running without AI tasks automation");
          }
        });
      } else if (!enableBackgroundWorkers) {
        console.log("[Server] AI Tasks Scheduler skipped (background workers disabled)");
      } else {
        console.log("[Server] AI Tasks Scheduler disabled (set ENABLE_AI_TASKS_SCHEDULER=true to enable)");
      }
    });

    // Handle server errors
    server.on("error", (error: any) => {
      console.error("[Server] ❌ Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`[Server] Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error("[Server] ❌ Fatal error during startup:", error);
    console.error("[Server] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    
    // In production, try to stay alive for debugging
    if (process.env.NODE_ENV === 'production') {
      console.error("[Server] ⚠️  Attempting to start server anyway for debugging...");
      const port = parseInt(process.env.PORT || '5000', 10);
      app.listen(port, '0.0.0.0', () => {
        console.log(`[Server] Emergency mode: Listening on port ${port}`);
      });
    } else {
      process.exit(1);
    }
  }
})();

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("[Server] ❌ Uncaught Exception:", error);
  console.error("[Server] Stack trace:", error.stack);
  
  // In production, log but don't exit immediately to allow debugging
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] ❌ Unhandled Rejection at:", promise, "reason:", reason);
  
  // In production, log but don't exit immediately to allow debugging
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT signal received: closing HTTP server");
  process.exit(0);
});
