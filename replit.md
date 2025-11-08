# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, bilingual (Arabic and English) news platform designed to deliver an advanced news experience through AI-driven article summarization, personalized recommendations, and comprehensive content management. It aims to enrich news consumption with AI and content enrichment, featuring an MVP with a complete English dashboard and independent content management for both languages. Key capabilities include a smart links system, an AI-powered SEO optimization platform, and one-click AI content generation. The platform is built with React, Express, and PostgreSQL, supporting RTL/LTR layouts, dynamic content delivery, user profiling, and advanced theme management.

## Recent Changes
**November 8, 2025:** 
- Complete removal of the internal chat/messaging system. All chat-related backend services (chat-storage.ts, chat-websocket.ts, AI chat service), frontend components (chat components folder, notification hooks, chat websocket client), database tables (10+ chat tables), API routes (1300+ lines), and UI elements have been removed. The platform now focuses exclusively on news content management and publishing features.
- Implemented mobile-friendly collapsible sections for Daily Brief pages (both Arabic and English) with four expandable sections: Performance Metrics, Interest Analysis, Time Activity, and AI Insights. Each section features ChevronDown toggle with 200ms animation (rotates 180° when expanded), defaulting to expanded state for better mobile UX.
- Redesigned Smart News Block GridLayout for mobile-responsive display: Mobile view (lg:hidden) now uses vertical list pattern matching Latest News with w-24 h-20 images, divide-y dividers, hover-elevate effects, and proper data-testid attributes. Desktop view (hidden lg:grid) maintains 4-column grid. Implementation is consistent across both Arabic (SmartNewsBlock) and English (EnglishSmartNewsBlock) versions.
- Updated SmartSummaryBlock (both Arabic and English versions) with improved typography and UX: Metric values reduced from text-2xl to text-lg, section headings reduced from text-lg to text-base, default state changed to expanded (isExpanded = true), and CollapsibleTrigger now wraps the full header for easier interaction. Mobile metrics display uses w-24 h-20 icon containers with divide-y dividers matching Latest News layout.
- Reordered Arabic homepage blocks: QuadCategoriesBlock now appears before OpinionArticlesBlock, improving content flow from broad news coverage to category exploration to editorial perspectives.
- Enhanced Smart Summary block in Arabic article detail page (ArticleDetail.tsx): Reduced font size from text-lg to text-sm, heading from text-lg to text-base, implemented collapsible behavior showing only 2 lines initially (line-clamp-2) with "عرض الكل"/"إخفاء" toggle button and ChevronDown animation. Audio button label hidden on mobile (hidden md:inline) for better mobile UX.
- Redesigned Comments Section (CommentSection.tsx) as collapsible block: Collapsed by default with ChevronDown toggle, displays context-aware message ("✍️ لا توجد تعليقات بعد. كن أول من يعلق!" for zero comments, or "يوجد X تعليقات .. للقراءة والمشاركة" with proper Arabic pluralization for existing comments). When expanded, shows comment form and existing comments. Completely hidden for non-authenticated users (returns null), ensuring comments are only visible and interactive for logged-in users.
- Optimized AI Analytics Stats Grid (AiArticleStats & EnAiArticleStats): Improved responsive layout from grid-cols-1 sm:grid-cols-2 to grid-cols-1 xs:grid-cols-2 for better mobile UX. Added custom xs breakpoint (475px) to tailwind.config.ts. Stats now display in single column on small devices (<475px) and 2×2 grid on larger screens (≥475px), balancing compact presentation with readability across all device sizes.
- Redesigned Smart Summary Block (SmartSummaryBlock - "رحلتك المعرفية في سبق اليوم باختصار"): Changed default state to collapsed (isExpanded = false) and optimized mobile layout from vertical list (4 rows) to grid-cols-1 xs:grid-cols-2 (2×2 grid). Mobile metrics now match desktop MetricCard styling with rounded surfaces, color-coded backgrounds (blue/green/pink/purple), consistent typography, and TrendingUp icons, providing compact yet readable presentation across all device sizes.
- Fixed AI Insights Block (مؤشرات الأسبوع) mobile margins: Removed `-mx-4 px-4` negative margin hack that caused first card to touch screen edge on mobile. Block now respects container margins like other homepage blocks.
- Enhanced SEO and Social Sharing: Added comprehensive Open Graph and Twitter Card meta tags to client/index.html for proper homepage sharing on WhatsApp/Facebook/Twitter. Implemented production-ready server-side rendering solution via socialCrawler.ts middleware that detects social media crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn, etc.) and serves static HTML with proper Open Graph meta tags for article pages. Middleware extracts SEO data from article.seo JSON field or falls back to article.title/excerpt/imageUrl, includes proper HTML escaping for security, and supports both camelCase and snake_case field names from Drizzle ORM. Each article gets optimized meta tags: og:image (with dimensions 1200×630), og:title, og:description, og:url, article:published_time, and twitter:card for rich link previews across all social platforms.
- Optimized Quad Categories Block Carousel UX (Both Arabic & English): Removed navigation arrows for cleaner mobile interface, replaced with minimalist dot indicators (1.5px inactive, 2px active). Enabled native touch swipe gestures with snap-scroll behavior for smooth finger-based navigation. Dots positioned below carousel with subtle spacing for unobtrusive yet accessible page indication.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation. Mobile responsiveness is achieved through a mobile-first approach.

A core architectural decision is the **bilingual system** with separate database architecture, language-specific dashboards and API layers, and shared resources for users, roles, and authentication. An i18n system with LanguageContext and bidirectional routing is implemented. The design system uses an enhanced color palette, gradient backgrounds, subtle shadows, and full dark mode support, with a sticky core categories bar and a redesigned footer.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching, background jobs, and a Content Security Policy (CSP).

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with comment moderation, an advanced article editor, SEO, and bulk operations.
-   **AI Analytics Dashboard (Bilingual):** Complete implementation for both Arabic and English with strict language separation, displaying engagement metrics with Recharts and Framer Motion animations.
-   **Comments & Engagement:** Nested comment system with real-time moderation.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story/Keyword Following, AI Insights Block, SEO AI Assistant (GPT-5), and Smart Content Generation System (GPT-5).
-   **Real-Time Features:** "Moment by Moment" activity timeline and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition, direct image upload, AI auto-description, and rich metadata.
-   **Smart Media Library System (Arabic):** Comprehensive asset management with hierarchical folders, AI-powered image suggestions (GPT-5), and integration with the article editor.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages querying English-only data.
-   **Related Articles Feature (Bilingual):** Intelligent article recommendations with language-specific formatting.
-   **Smart Advertising System (Arabic - Phase 1 Implemented):** Enterprise-grade advertising platform with AI-powered optimization. Features include Ad Account, Campaign, Performance Dashboard, Ad Creatives, Inventory Slots, and Creative Placements Management with PostgreSQL EXCLUSION constraint for overlap prevention. RBAC integrated for admin and advertiser roles.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and intelligent media suggestions. A scope-aware theme management system is implemented. A Content Import System parses RSS feeds with AI. The Smart Categories architecture uses a junction table for dynamic/smart categories and a background job for automated assignment. Content management supports multiple article types with a unified dashboard and distinct badges. The Media Library provides centralized asset management with AI-powered keyword extraction.

## External Dependencies

**Authentication & Identity**
-   Passport.js
-   `express-session`, `connect-pg-simple`

**Database & ORM**
-   `@neondatabase/serverless` (PostgreSQL)
-   `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
-   OpenAI API (GPT-5)
-   ElevenLabs API

**File Storage**
-   `@google-cloud/storage` (via Replit Object Storage)

**Content Processing**
-   `rss-parser`

**Frontend Libraries**
-   `@tanstack/react-query`
-   `wouter`
-   `@radix-ui/*`
-   `tailwindcss`, `class-variance-authority`

**Development Tools**
-   `TypeScript`