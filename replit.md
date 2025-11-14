# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management for each language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform's business vision is to deliver an advanced news experience leveraging AI, content enrichment, and social media virality, targeting a broad market with its innovative approach to news consumption.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, and AI-summarized article detail pages. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation and mobile responsiveness. Core architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. The platform utilizes a unified brand color system and a consistent smart blocks architecture across all three languages. The user profile page is designed in an Apple News + LinkedIn style, featuring a clean header with inline editing, a horizontal stats row, a modern tab system for navigation, and a wide content area with a grid layout, optimized for mobile-first responsiveness. The platform is integrating TailAdmin Dashboard for analytics, calendar, advanced tables, and user management.

**Unified Color System (Development & Production):** The platform uses a centralized CSS Variables system defined in `client/src/index.css` ensuring 100% color consistency across all environments. Background colors: Light Mode `hsl(0, 0%, 100%)` (pure white), Dark Mode `hsl(220, 25%, 8%)` (deep blue-gray). All colors meet WCAG 2.1 AA/AAA accessibility standards with verified contrast ratios. Complete documentation available in `docs/COLOR_SYSTEM.md` covering 100+ pages with zero CSS conflicts.

**Unified Number Format Standard:** The platform enforces a standardized number format using Hindu-Arabic numerals (0-9) across all statistics cards, dashboards, and components. All numbers use `toLocaleString('en-US')` for consistent display with proper thousands separators (1,234 instead of ١٬٢٣٤). This standard was implemented platform-wide affecting 19 files and 100+ number displays. Comprehensive documentation available in `docs/NUMBER_FORMAT_STANDARD.md` with templates, guidelines, and maintenance protocols. Zero instances of deprecated `'ar-SA'` or `'ar-EG'` locales remaining.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching middleware, production-grade `OptimizedImage` components, and asset footprint reduction.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Social Following System:** Complete user-to-user following infrastructure with analytics and real-time updates.
-   **User Discovery System:** Intelligent user suggestions algorithm and a DiscoverUsers page.
-   **Smart Recommendations System:** AI-powered personalized article recommendations based on user interests and reading history.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with an advanced TipTap-based WYSIWYG editor and a Smart Media Library System.
-   **AI Analytics Dashboard (Trilingual):** Displays engagement metrics and category analytics.
-   **TailAdmin Analytics Dashboard (Phase 1 COMPLETE):** Modern professional analytics dashboard at `/dashboard/analytics` with 6 KPI metric cards showing lifetime totals and month-over-month trends (Views, Users, Articles, Comments, Likes, Bookmarks), interactive ApexCharts time-series visualization with 12-month historical data, top 10 articles ranking table with view counts and percentage changes, and recent activity feed with user details. Backend APIs implement accurate date-bounded queries with proper monthly aggregation, division-by-zero protection, and meaningful growth indicators. Role-based access control restricts dashboard to admin, super_admin, chief_editor, and editor roles. Production-ready with Architect approval.
-   **Modern Categories Page Redesign (COMPLETE):** Completely redesigned `/categories` page with TailAdmin-inspired professional layout featuring: (1) Statistics summary section with 4 metric cards (Total Categories, Total Articles, Total Views, Total Engagement) with responsive grid and loading states, (2) Search and filter bar with RTL search input, Grid/List view toggle, and sort options (newest, most articles, most viewed), (3) Redesigned compact category cards with emoji removed (replaced with lucide-react Newspaper icons), horizontal icon+name layout, 2x2 stats grid, and hover-elevate interactions, (4) Fully responsive design (1-4 columns based on breakpoint), (5) All interactions use useMemo for performance optimization. Architect approved as production-ready.
-   **Moment by Moment Page Redesign (COMPLETE):** Enhanced live news page at `/moment-by-moment` with TailAdmin professional design: (1) Statistics section with 4 cards (Total Live Updates Today, Breaking News Count, Most Active Category, Average Update Frequency), (2) Enhanced hero with vibrant gradient and pulsing LIVE badge, (3) Time range filter (Last Hour, 3 Hours, Today, Yesterday, 7 Days) with proper date boundaries, (4) Category filter for targeted news viewing, (5) Improved live status bar with manual refresh button and update count, (6) Enhanced cards with category-colored borders and NEW badges for recent updates (<5 min), (7) All existing functionality preserved (breaking ticker, auto-refresh, infinite scroll, RTL). Architect approved as production-ready.
-   **Category Detail Page Redesign (COMPLETE):** Completely redesigned `/category/:slug` page with TailAdmin professional style: (1) Clean hero image without text overlay (title/description moved below), (2) 6 statistics cards in 2 rows (Total Articles, Recent 24h, Total Views, Avg Engagement, Most Viewed Article, Last Update), (3) Most Active Reporter section showing reporter with most articles including profile image, article count, total views, and link to profile, (4) Advanced filters (Sort by newest/views/engagement, Time range filter, Article type filter), (5) Enhanced article cards with larger images and better spacing (colored borders removed per user request), (6) Load More pagination with automatic displayCount reset on filter changes, (7) Empty state with reset filters option, (8) CategoryAnalytics component removed, replaced with modern statistics. Architect approved as production-ready.
-   **Article Detail Page Redesign (COMPLETE):** Completely redesigned `/article/:slug` page with 100% TailAdmin compliance: (1) Statistics Cards Section with 6 KPI metrics at top (Views, Reactions, Comments, Reading Time, Shares, Bookmarks) in responsive grid (2x3 on mobile, 6 columns on desktop), each with circular color-coded icon background, large number, and descriptive label, (2) Article Header Card with professional layout including author card with larger avatar (h-14), verification badge, reading time, and Follow/Unfollow button, (3) Featured Image with clean simple design (removed blurred background effect), (4) Smart Summary Card with circular icon background and collapsible content, (5) Article Content wrapped in card container for better visual separation, (6) Engagement Actions Card with modern 2-column grid layout (Like/Bookmark buttons), (7) Social Share Bar Card with professional icon header and green color scheme. All cards use hover-elevate interactions, consistent spacing (gap-4, gap-6), and proper null-safety with nullish coalescing (`?? 0`) for all metrics. Replaced ViewsCount component with Eye icon for proper badge rendering. Production-ready with Architect approval.
-   **Homepage Redesign (Phase 1 COMPLETE):** Added TailAdmin-style Statistics Cards section at top of homepage featuring 4 KPI metrics (Total Articles, Today's Articles, Total Views, Active Users) with dedicated `/api/homepage/stats` endpoint. Implementation includes 5-minute caching middleware, responsive 2x2/4-column grid layout, circular color-coded icon backgrounds (primary, green, blue, orange), Hindu-Arabic number formatting with `toLocaleString('en-US')`, proper null-safety with nullish coalescing (`?? 0`), hover-elevate interactions, and visual separation via `bg-muted/30 border-b`. Backend uses optimized SQL queries for published articles with accurate 24-hour and 7-day aggregations. Production-ready with Architect approval.
-   **Comments & Engagement:** Nested comment system with real-time moderation and AI-powered sentiment analysis.
-   **AI-Powered Article Classification:** Smart Article Classification System for Arabic articles using Claude Sonnet 3.5.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **Multilingual SEO Generator:** Enterprise-grade AI-powered SEO optimization across three languages.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System, Story/Keyword Following, AI Insights Block, Smart Content Generation System, and a Smart Summary Block.
-   **All-in-One AI Generation (Article Editor):** One-click AI generation for headlines, classification, SEO, and summaries.
-   **Smart Journalist Agent:** Professional AI-powered news writing assistant adhering to editorial standards.
-   **Content AI Hub:** Centralized AI tools dashboard for journalists and editors.
-   **Real-Time Features:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition.
-   **Social Media Sharing & Distribution System:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages.
-   **Related Articles Feature (Trilingual):** Intelligent article recommendations with language-specific formatting.
-   **Reporter Profile System (Trilingual):** Complete trilingual implementation.
-   **Smart Advertising System (Arabic):** Enterprise-grade advertising platform with AI-powered optimization.
-   **SEO and Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.
-   **Apple Wallet Dual Pass System:** Enterprise-grade digital credential system supporting Press Cards and Loyalty Cards with PassKit integration.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for various tasks. A scope-aware theme management system, Content Import System (RSS feeds with AI), and Smart Categories architecture are implemented. The Media Library provides centralized asset management with AI-powered keyword extraction.

### Database Migration Strategy
The platform uses Drizzle ORM with a versioned migration approach. Production-ready migrations are stored in `migrations/` directory:
-   **Migration 0001 (2025-11-14):** Added unique constraints for `short_links.short_code` and `users.apple_id`, removed obsolete `trend_cache` table. All constraints are idempotent with pre-validation checks.
-   **Migration Process:** Use `npm run db:push` for development schema sync. All production changes must be captured as versioned SQL migrations with pre/post-validation queries.
-   **Constraint Management:** All unique constraints verified via SQL queries before application. No data-loss operations without dependency audits.

## External Dependencies

**Authentication & Identity**
-   Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`)
-   `express-session`, `connect-pg-simple`
-   `apple-signin-auth`

**Database & ORM**
-   `@neondatabase/serverless` (PostgreSQL)
-   `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
-   OpenAI API (GPT-5)
-   ElevenLabs API

**Email Service**
-   SendGrid

**File Storage**
-   `@google-cloud/storage` (via Replit Object Storage)

**Content Processing**
-   `rss-parser`

**Frontend Libraries**
-   `@tanstack/react-query`
-   `wouter`
-   `@radix-ui/*`
-   `tailwindcss`, `class-variance-authority`

**Digital Credentials**
-   `passkit-generator` (Apple Wallet Pass generation)