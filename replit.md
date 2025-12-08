# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. The platform aims to deliver an advanced news experience through AI, content enrichment, and social media virality. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform utilizes an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It features a comprehensive publishing template system with Framer Motion animations and mobile responsiveness, adhering to WCAG 2.1 AA accessibility standards. The system is trilingual with separate database schemas, language-specific dashboards, and an i18n system using `LanguageContext` and bidirectional routing. The iFox AI Portal features a futuristic dark mode with enhanced contrast and glassmorphism effects, including an animated AI mascot. The iFox Admin Dashboard is an independent "portal within a portal" with comprehensive mobile responsiveness, covering dashboards, article management, an AI-powered editor, media, scheduling, analytics, categories, and settings. The Visual AI Image Studio provides enterprise-grade AI image generation with dual-model comparison, professional infographic generation with Arabic RTL optimization, and automatic Google Cloud Storage uploads.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Image Optimization Pipeline
Comprehensive on-demand image optimization for performance:
- **WebP Conversion**: Images converted to WebP with quality 85, effort 6, smart subsampling (~30-50% size reduction)
- **Responsive Sizing**: On-the-fly resizing with presets (thumbnail: 160px, small: 256px, medium: 640px, large: 1200px, xlarge: 1920px)
- **Thumbnail Generation**: 640×360 WebP thumbnails at quality 80 for fast loading
- **Blur Placeholder**: 20×11 base64 WebP blur data URL for progressive loading
- **Unique Filenames**: Timestamp-based naming (`baseName_timestamp.webp`, `baseName_timestamp_thumb.webp`)
- **Cache Headers**: WebP=1 year+immutable, other images=1 week, files=1 hour, with ETag support
- **OptimizedImage Component**: CSS gradient shimmer placeholders, automatic WebP detection, srcset/sizes support, IntersectionObserver lazy loading, preferSize hints for optimal delivery
- **API Endpoints**: `/api/images/optimize?url=&w=&q=&f=` for on-demand optimization, `/api/images/srcset` for responsive sets
- **Component Usage**: HeroCarousel uses large/medium/thumbnail, ArticleCard uses large/medium/small based on variant
- **Lite Feed Pre-Optimization**: Automatic image optimization on article publish - generates 1080px WebP at quality 70, stored in `lite/` folder in Object Storage, path saved to `liteOptimizedImageUrl` field. SwipeCard component prefers pre-optimized image with fallback to on-demand optimization via `generateLiteOptimizedImage()` service.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations with smart behavior-based content delivery.
-   **Reader Personalization System:** Smart content recommendations based on reading behavior. Components include ContinueReadingWidget (shows unfinished articles with progress indicators and dismiss functionality), ForYouSection (AI-powered recommendations with reason text like "Because you follow Sports"). Uses existing infrastructure: userAffinities, userEvents, readingHistory, contentVectors, similarityEngine, recommendationService, and dismissedContinueReading. API endpoints: `/api/personalization/continue-reading`, `/api/personalization/continue-reading/:articleId/dismiss`, `/api/personalization/top-interests`, `/api/recommendations/personalized`.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with an advanced WYSIWYG editor and Smart Media Library.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard and a professional dashboard for KPIs.
-   **Advanced Reader Behavior Analytics:** Comprehensive tracking of reading sessions, section-level engagement heatmaps, navigation paths between pages, traffic source attribution (direct/social/referrer), peak hours and daily distribution analysis, real-time active user metrics, device and browser analytics, and article engagement scoring system. Database tables: `reading_sessions`, `section_analytics`, `navigation_paths`, `traffic_sources`, `hourly_engagement_rollups`, `real_time_metrics`, `article_engagement_scores`.
-   **AI Content Features:** AI article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary, Daily Briefs, Smart Content Generation System, Deep Analysis Engine (multi-model AI analysis), and AI Image Transparency System.
-   **iFox Content Generator:** Automated AI content generation system for articles and images, including auto-publishing and notifications.
-   **iFox Public Articles Page:** Public-facing page displaying AI-generated articles with URL-based category filtering.
-   **Audio Newsletter System:** Comprehensive audio broadcasting platform with ElevenLabs integration for Arabic TTS, automated daily briefings, 8 newsletter templates, and an advanced editor with enhanced voice capabilities and analytics.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System v2.0 via SSE.
-   **Smart Notification System v2.0:** Advanced notification system with intelligent deduplication and behavioral tracking:
    - **Memory Layer**: 30-day duplicate prevention using SHA256 hash (userId + articleId + type). Hash generation handles null articleId using "none" placeholder to prevent collisions for non-article notifications. Includes `sentAt` field for precise timing analytics.
    - **Behavior Tracking**: 11 signal types (article_read, article_like, article_bookmark, article_share, article_comment, category_read, tag_read, notification_click, notification_dismiss, time_spent, search_query) with configurable weights
    - **Time-Decay Algorithm**: Signals decay over time (e.g., article_like: 1%/day, notification_click: 0.5%/day). Cleanup job runs periodically calling `applyTimeDecay()` and `cleanupExpiredMemories()`.
    - **Dynamic Interests**: Real-time calculated user interests based on behavioral signals with 0.0-1.0 scoring
    - **Analytics Dashboard**: Track CTR, open rates, dismiss rates, and notification performance by type
    - **Security**: Click/dismiss routes validate notification ownership BEFORE recording analytics to prevent manipulation. Admin analytics requires `requireRole('admin')`.
    - Database tables: `notification_memory`, `user_behavior_signals`, `user_dynamic_interests`, `notification_analytics`
    - API endpoints: `/api/behavior/signal` (POST), `/api/behavior/interests` (GET), `/api/behavior/profile` (GET), `/api/notifications/:id/clicked` (POST), `/api/notifications/:id/dismissed` (POST), `/api/admin/notification-analytics` (GET)
    - **KPI Targets**: CTR >15%, Open Rate >40%, Dismiss Rate <10%, Relevance Score >0.6
-   **Social Media Integration:** Enterprise-grade viral distribution with click tracking, Social Crawler Middleware for Open Graph meta tags, and a Dynamic Metadata System.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI and API for published analyses.
-   **Hierarchical Task Management:** Supports parent-child relationships with unlimited nesting and a tree-view UI.
-   **Intelligent Email Agent System:** Automated email-to-article publishing with AI for content analysis and auto-publishing.
-   **WhatsApp Auto-Publish System:** Enterprise-grade WhatsApp-to-article publishing with Twilio API, AI content processing, multi-image management, and a Message Aggregation System for multi-part messages.
-   **Publisher/Agency Content Sales System:** B2B content publishing platform with a credit-based package system and performance analytics.
-   **Muqtarab (مُقترب) Content System:** Non-news content platform featuring "Angles" and "Topics" with structured JSON content blocks, SEO metadata, and a status workflow.
-   **Accessibility:** Comprehensive WCAG 2.1 AA compliance infrastructure, including global state management, skip links, ARIA labels, semantic HTML, live regions, and a Voice Assistant with Reading/Dyslexia Mode.
-   **AI Comment Moderation System:** Automated comment analysis using GPT-4o-mini with classification (safe/flagged/spam/harmful), automatic status updates, admin dashboard at `/dashboard/ai-moderation` with metrics, filters, and bulk actions. Background processing ensures non-blocking comment creation. **Advanced Search System**: Full-text search for comments and articles with Arabic text normalization, relevance scoring, highlighting, and flexible filtering. API endpoints: `/api/moderation/search/comments` (query, status, aiClassification, dateFrom, dateTo, sortBy), `/api/moderation/search/articles` (query, categoryId, publishFrom, publishTo, includeComments, sortBy). Frontend component `ModerationAdvancedSearch` provides dual-tab interface with RTL layout for Arabic, advanced filters, and expandable article comment threads.
-   **Online Moderator Presence System:** Real-time tracking of moderator online status using `lastActivityAt` timestamp with 15-minute threshold. The `getOnlineModerators()` function queries users with moderator roles from both legacy `users.role` field and RBAC `user_roles` table. **Immediate Offline Status on Logout**: The `setModeratorOffline(userId)` method clears `lastActivityAt` to null, ensuring moderators are immediately marked offline when logging out. Both logout handlers (`POST /api/logout` and `GET /api/auth/logout`) call this method with promisified logout flow and isolated error handling to guarantee status updates even during failures.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5.1. The platform includes scope-aware theme management, a Content Import System, and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with versioned migrations manages database schema. The publisher content sales system uses a three-table architecture with RBAC and atomic credit deductions. Article ordering uses a hybrid approach of curated sections and chronological feeds. The iFox Category Management System uses a dedicated endpoint with server-side in-memory caching and specific schemas for iFox articles. The AI Tasks System integrates GPT-5.1 for structured JSON responses, atomic race condition prevention, and includes automated cleanup jobs for stuck tasks.

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5), ElevenLabs API
-   **Email Service:** SendGrid
-   **Messaging Services:** Twilio API (WhatsApp Business API integration)
-   **File Storage:** `@google-cloud/storage`
-   **Content Processing:** `rss-parser`, `mammoth`
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
-   **Digital Credentials:** `passkit-generator`
-   **Accessibility Testing:** `axe-core`
-   **Voice Assistant:** Web Speech API
### Smart Auto-Format System
AI-powered smart formatting for the rich text editor that automatically highlights important keywords in Arabic news content:
- **API Endpoint**: `POST /api/ai/auto-format` - Accepts text and formatting rules, returns formatted text with Markdown bold markers
- **Frontend Integration**: "تنسيق ذكي" (Smart Format) button in the RichTextEditor toolbar with Wand2 icon
- **Features**:
  - Automatic detection and bolding of important names, institutions, numbers, and statistics
  - Configurable rules: `bold_names`, `bold_numbers`, `bold_institutions`, `max_bold_per_paragraph`
  - Returns formatted Markdown text and detailed highlights array with reasons
  - Loading state with spinner indicator
  - Toast notifications for success/failure
- **Authorization**: Requires editor, admin, or reporter role
- **Model**: Uses GPT-5.1 with JSON response format
