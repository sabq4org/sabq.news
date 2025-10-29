# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform leveraging React, Express, and PostgreSQL to provide intelligent article summarization, personalized recommendations, and comprehensive content management. Its core purpose is to deliver a cutting-edge news consumption experience, specifically targeting the Arabic-speaking market with RTL-first design, dynamic content delivery, user profiling, and advanced theme management. The platform aims to enrich the news experience through AI-driven personalization and content enrichment, holding significant market potential in the Arabic-speaking demographic.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design system with custom theming for light/dark modes using Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a content creator dashboard with a WYSIWYG editor, all designed responsively. A comprehensive publishing templates system, with 21 production templates covering various content types, ensures flexible and accessible content presentation with Framer Motion animations.

### Technical Implementations
The frontend utilizes Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Session-based authentication is managed by Passport.js with a local strategy and bcrypt. PostgreSQL, hosted on Neon serverless, serves as the database, accessed via Drizzle ORM. File storage is handled by Google Cloud Storage via Replit Object Storage, and Server-Sent Events (SSE) power real-time features.

**Performance Optimizations:**
- **Gzip Compression:** All responses (API + static assets) compressed using gzip middleware (level 6, 1KB threshold) for 60-70% bandwidth reduction
- **Smart Caching Strategy:** 
  - Hashed assets (JS/CSS from Vite): `public, max-age=31536000, immutable` (1 year)
  - Images & Fonts: `public, max-age=2592000` (30 days)
  - HTML files: `public, max-age=0, must-revalidate` (always fresh)
  - **API endpoints: NO cache** - All API requests return fresh data
- **React Query Configuration:** 
  - Global config: Zero caching (`staleTime: 0`, `gcTime: 0`, `refetchOnWindowFocus: false`) per user requirement for real-time data freshness
  - All mutations use `removeQueries()` + `refetchQueries()` pattern to ensure immediate server state reflection
  - All component-level `staleTime` and `refetchInterval` overrides removed to ensure consistent zero-cache behavior
  - HTTP cache headers: All API endpoints use `no-store, no-cache, must-revalidate` with `Pragma: no-cache` and `Expires: 0` to prevent browser/proxy caching

**Article & Shorts Ordering System:**
- **Admin Dashboard:** Articles and shorts management pages (`/api/admin/articles`, `/api/admin/shorts`) sort by `createdAt DESC` to show newest items first
- **Homepage Display:** All public-facing queries (hero, breaking, editor picks, deep dives, all published, shorts feed) prioritize `displayOrder DESC` before fallback sorting criteria (publishedAt, views, createdAt)
- **Auto-Assignment:** New articles/shorts receive `displayOrder = Math.floor(Date.now() / 1000)` (Unix timestamp in seconds) if not explicitly set, ensuring they appear first on homepage
- **Manual Override:** Editors can manually set `displayOrder` during creation/editing to customize homepage positioning
- **Drag & Drop Persistence:** Admin panel article reordering uses batch update to `display_order` column, with immediate cache invalidation and server refetch
- **Mutation Pattern:** `PUT /api/admin/articles/order` accepts `{ articleIds: string[] }` and assigns displayOrder based on array position (first = highest value)

### Feature Specifications
Key features include:
- **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 7 system roles, 49 granular permissions across 9 modules, multi-role assignment, and secure user creation with activity logging.
- **Content Management:** Comprehensive lifecycle management for articles, news, users, and categories, including a comment moderation system and an advanced article editor with AI-powered title/summary generation, SEO management, and reporter assignment. Articles management dashboard features bulk operations with select-all checkbox functionality, enabling bulk archival and permanent deletion of archived articles with proper confirmations.
- **Muqtarib (مُقترب) Section:** A thematic system for diverse article perspectives.
- **Al-Mirqab (المرقاب) - Future Forecasting System:** An AI-powered predictive analytics platform offering Sabq Index, Next Stories, Radar, and Algorithm Writes, with dedicated RBAC, full CRUD capabilities, and rich visualizations.
- **Advanced Internal Announcements System:** A production-grade announcement platform with multi-announcement support, versioning system (auto-snapshots on updates with restore capability), scheduling (auto-publish/expire via cron), audience targeting (roles + specific users), multi-channel distribution (dashboard/email/mobile/web), priority levels (critical/high/medium/low), rich content editor with attachments, comprehensive analytics tracking (impressions, unique views, dismissals, clicks, CTR), and archival management.
- **A/B Testing System:** A comprehensive platform for content optimization, experiment management, and real-time tracking.
- **AI-Powered Features:** Includes an AI ChatBot Assistant, Audio Summary (Text-to-Speech), Credibility Score Analysis, Daily Briefs, an Intelligent Recommendation System using OpenAI embeddings, Story Tracking & Following, Keyword Following, and AI Insights Block.
- **Real-Time Features:** "Moment by Moment" (لحظة بلحظة) provides an AI-powered activity timeline with daily insights, live statistics, and trending topics. A Smart Notifications System offers intelligent, real-time pushes via SSE.
- **Reporter Profile System:** Dedicated pages for staff and reporters showcasing their work, performance KPIs, and writing specializations.
- **Audio Newsletters (النشرات الصوتية):** An AI-powered text-to-speech news briefing system with ElevenLabs integration, asynchronous generation, RSS/Podcast feed, and analytics tracking.
- **Quick Audio News Briefs (الأخبار الصوتية السريعة):** A lightweight system for generating and publishing short audio snippets to the homepage, integrated with ElevenLabs and using a background job queue.
- **Sabq Shorts (سبق قصير) - Vertical Video Reels System:** A full-featured short-form video news platform similar to TikTok/Instagram Reels, featuring vertical swipe navigation (9:16 aspect ratio), HLS video streaming with MP4 fallback, interactive engagement (likes, shares, comments), analytics tracking (views, watch time, completion rate), homepage featured block, dedicated /shorts fullscreen feed with keyboard controls, and comprehensive admin dashboard with filtering, search, and content management. Supports RBAC with dedicated shorts permissions (shorts:view, shorts:create, shorts:edit, shorts:delete, shorts:manage).
- **Quad Categories Block (بلوك التصنيفات الرباعية):** A customizable homepage block displaying 4 category columns in a responsive grid layout. Features include: configurable stat types (dailyCount, weeklyCount, totalViews, engagementRate), headline modes (latest, mostViewed, editorsPick), mobile carousel with swipe navigation, customizable badges (breaking, exclusive, analysis), fresh content indicators based on configurable hours threshold, teaser text support, and adjustable article list size (3-8 articles). Admin interface located at `/dashboard/blocks/quad-categories` under "المحتوى الذكي" section. Supports full RBAC with admin-only access.
- **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs and AI applications, including comprehensive article metadata, licensing information, and usage rights. Features Schema.org JSON-LD structured data on article pages, developer documentation (/ai-publisher), AI usage policy page (/ai-policy), and machine-readable policy (/.well-known/ai-usage.json). Full OpenAPI 3.0 specification available at /openapi.json. Endpoints include: /api/v1/articles (list), /api/v1/articles/:id (detail), /api/v1/search (search), /api/v1/breaking (breaking news), /api/v1/categories (categories).

### System Design Choices
Core data models encompass Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and specialized Al-Mirqab forecasting tables. AI integration extensively uses OpenAI GPT-5 for Arabic text summarization, title generation, and predictive analysis. A scope-aware theme management system enables dynamic, date-validated, and page-specific theme application. A Content Import System parses RSS feeds with AI for summarization.

### Mobile App Support
Native mobile app support is achieved via Capacitor 7.4.4, with configured iOS and Android platforms, including auto-generated app icons and splash screens. The design is mobile-optimized with RTL support, safe area, and touch target optimization, utilizing Capacitor plugins for essential functionalities.

## External Dependencies

**Authentication & Identity**
- Passport.js
- `express-session`, `connect-pg-simple`

**Database & ORM**
- `@neondatabase/serverless` (PostgreSQL)
- `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
- OpenAI API (GPT-5)
- ElevenLabs API (Text-to-Speech for Arabic)

**File Storage**
- `@google-cloud/storage` (via Replit Object Storage)

**Content Processing**
- `rss-parser`

**Frontend Libraries**
- `@tanstack/react-query`
- `wouter`
- `@radix-ui/*`
- `tailwindcss`, `class-variance-authority`

**Development Tools**
- `TypeScript`