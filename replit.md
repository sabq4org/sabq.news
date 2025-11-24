# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key features include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform aims to deliver an advanced news experience through AI, content enrichment, and social media virality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform utilizes an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It features a comprehensive publishing template system with Framer Motion animations and mobile responsiveness. The system is trilingual with separate database schemas, language-specific dashboards, and an i18n system using `LanguageContext` and bidirectional routing. A unified brand color system and consistent smart blocks architecture adhere to WCAG 2.1 AA accessibility standards, including standardized Hindu-Arabic numerals. UI components are professional, standard-sized, and mobile-optimized (24px minimum touch targets).

The iFox AI Portal features a futuristic dark mode with enhanced contrast (text-gray-200/300, WCAG AA compliant) and glassmorphism effects. An animated AI mascot with floating, rotation, glowing eye, breathing shadow, and multi-layered pulse animations appears in dashboards and the public iFox homepage, using coordinated ring/particle animations for branding.

The iFox Admin Dashboard is an independent "portal within a portal" with 8 pages: Dashboard, Articles, Editor (AI-powered content generation), Media, Schedule, Analytics (KPIs, time-series, category performance, top articles, engagement), Categories (real-time stats, status toggle), and Settings (AI, Publishing, Notifications, Appearance, Media, Security). All pages are fully mobile-responsive with comprehensive breakpoint coverage (sm: 640px, md: 768px, lg: 1024px) and follow a unified responsive design system: responsive padding (p-3 sm:p-4 md:p-6), text sizing (text-xs sm:text-sm md:text-base), icon scaling (w-4 h-4 sm:w-5 sm:h-5), grid layouts (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4), flex direction switching (flex-col sm:flex-row), overflow handling (overflow-x-auto, min-w-0, truncate), responsive dialogs (max-w-[95vw] sm:max-w-lg), and comprehensive data-testid attributes. The mobile sidebar features hamburger menu toggle, backdrop overlay, smooth animations, and auto-close on route change.

The Visual AI Image Studio (`/admin/ifox/image-studio`) provides enterprise-grade AI image generation with dual-model comparison (Nano Banana Pro, NotebookLM powered by Gemini 3 Pro Image). It supports professional infographic generation with Arabic RTL optimization, orientation control, detail levels, and automatic Google Cloud Storage uploads. All generated images include AI disclosure metadata and intelligent thumbnail generation. Five professional infographic style presets with Arabic RTL optimization are available.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with an advanced WYSIWYG editor and Smart Media Library.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs.
-   **AI Content Features:** AI article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary, Daily Briefs, Smart Content Generation System, and Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, Claude with SSE).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries. A Smart Journalist Agent provides news writing assistance. An AI Image Transparency System tracks and discloses AI-generated featured images with metadata and a public visual badge.
-   **iFox Content Generator:** Automated AI content generation system that processes scheduled editorial calendar tasks. Runs every minute, generating complete articles using GPT-5.1, creating AI-generated images via Gemini Pro Image, auto-publishing with status='published', and sending notifications. Uses InsertArticle schema with proper slug generation (140 chars + 8-char nanoid) and filters by `aiGenerated` flag. Processes up to 10 tasks per batch with 3-attempt retry mechanism. All AI articles are auto-published with proper SEO metadata and category linkage.
-   **iFox Public Articles Page:** Public-facing page at `/ifox` displaying all AI-generated articles with URL-based category filtering. Implements identical design and layout as `/ai` page (November 2024 redesign). Uses `GET /api/ifox/articles?categorySlug={slug}` endpoint that filters published articles by specific iFox category (ai-news, ai-insights, ai-opinions, ai-tools, ai-voice) and `aiGenerated === true` flag. Features dark gradient background (`bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`), animated floating orbs, AIHeader component, AIAnimatedLogo with floating rings, hero section with gradient title, category navigation grid (5 cards with colored icons), tabs system (الأحدث/الأكثر رواجاً/المميز), 2-column layout (articles + sidebar), AINewsCard components, AITrendsWidget, and newsletter CTA. Includes loading/error/empty states with proper data-testid attributes for testing.
-   **Audio Newsletter System:** Comprehensive audio broadcasting platform with ElevenLabs Flash v2.5 integration for Arabic TTS, automated daily briefings, 8 newsletter templates, an advanced editor with enhanced voice capabilities (8 diverse Arabic voices: 4 male, 4 female), voice preview/testing system, granular voice parameter controls (playback speed 0.5x-2x, stability 0-1, similarity boost 0-1, style, speaker boost), homepage audio widget, public newsletter page, RSS podcast feed, analytics dashboard with listen counts and completion rates, and automated scheduling system with email notifications. The editor features RTL-optimized voice selection with gender/use-case badges, real-time audio preview functionality, and sub-tabbed interface for voice selection and parameter adjustment.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE for real-time article publishing alerts.
-   **Social Media Integration:** Enterprise-grade viral distribution with click tracking and Social Crawler Middleware for Open Graph meta tags. A Dynamic Metadata System provides server-side rendering of page-specific Open Graph meta tags for various content types.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses.
-   **Hierarchical Task Management:** Supports parent-child relationships with unlimited nesting, a tree-view UI, and secure permission-based filtering.
-   **Intelligent Email Agent System:** Automated email-to-article publishing with AI for content analysis, quality scoring, and auto-publishing.
-   **WhatsApp Auto-Publish System:** Enterprise-grade WhatsApp-to-article publishing with Twilio API integration, AI content processing, multi-image management (Google Cloud Storage), and intelligent content cleaning.
-   **Publisher/Agency Content Sales System:** B2B content publishing platform for external publishers/PR agencies, featuring a credit-based package system, admin approval, publisher logo upload, and performance analytics.
-   **Accessibility:** Comprehensive WCAG 2.1 AA compliance infrastructure, including global state management, skip links, ARIA labels, semantic HTML, live regions, form/loading state announcements, and a Voice Assistant with Reading/Dyslexia Mode.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5.1 with intelligent defaults (no max_completion_tokens parameter). The platform includes scope-aware theme management, a Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with versioned migrations manages database schema. The publisher content sales system uses a three-table architecture (`publishers`, `publisher_credits`, `publisher_credit_logs`) with RBAC and atomic credit deductions. Article ordering uses a hybrid approach of curated sections and chronological feeds.

**iFox Category Management System (November 2024):**
- **Architecture:** Dedicated endpoint `GET /api/admin/ifox/categories` with 1-hour server-side in-memory cache via `storage.getIFoxCategoryMap()` method
- **Request Contract:** Frontend sends `categorySlug` (string), backend converts to UUID internally using cached category map, eliminating frontend UUID exposure
- **Schemas:** Dedicated `insertIFoxArticleSchema` and `updateIFoxArticleSchema` in `shared/schema.ts` for iFox-specific validation
- **API Endpoints:** 
  - Admin: `POST /api/admin/ifox/articles` and `PATCH /api/admin/ifox/articles/:id` handle slug→UUID conversion with proper validation
  - Public: `GET /api/ifox/categories` returns active (non-deleted) iFox categories for public pages
- **Public Filtering:** `GET /api/ifox/articles?categorySlug={slug}` returns `{ articles: [...], total: number }` structure
- **Frontend:** 
  - `IFoxArticleEditor.tsx` uses admin categories endpoint
  - `IFoxArticles.tsx` uses public categories endpoint with URL-based category filtering and sticky tabs
- **Deleted Categories Filtering:** `getIFoxCategoryMap()` filters out deleted categories (status != 'deleted'), preventing deleted categories from appearing in headers and public pages
- **Reliability:** Server-side caching (1 hour TTL) + client-side caching prevents auth failures, guarantees consistent slug→UUID mappings for active iFox categories only

**AI Tasks System (GPT-5.1 Compliance - November 2025):**
- **ai-manager.ts:** GPT-5.1 integration without temperature parameter, uses `response_format: { type: "json_object" }` for structured JSON responses, omits `max_completion_tokens` to use intelligent defaults
- **aiTaskExecutor.ts:** Atomic race condition prevention via `markAiTaskProcessing()` with `skipped` flag, sequential task execution prevents duplicate processing
- **aiArticleGenerator.ts:** Database schema compliance - uses `typeof articles.$inferInsert` return type, includes `authorId` field, removes legacy fields (featured, trending, viewCount, createdAt, updatedAt) that have database defaults, super admin fallback when `task.createdBy` is null
- **aiTasksCleanup.ts:** Automated cleanup job (runs every 5 minutes) that fails tasks stuck in "processing" status for >10 minutes, includes null/NaN validation for `updatedAt` field to prevent race conditions
- **Known Limitation:** 30+ other files (`calendarAi.ts`, `smartLinks.ts`, `contentAnalyzer.ts`, etc.) still call OpenAI directly with temperature parameter - requires systematic refactoring in future iterations

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