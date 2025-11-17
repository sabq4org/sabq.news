# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform. Its purpose is to redefine news consumption through AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform aims to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with `LanguageContext` and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA accessibility standards (not AAA). The platform enforces a standardized Hindu-Arabic numeral format using `toLocaleString('ar-SA')` across all statistical displays.

#### Mobile-First Component Sizing
The platform implements professional, standard-sized UI components optimized for mobile devices following WCAG AA compliance (24px minimum touch targets on mobile). Key sizing decisions:

-   **MobileOptimizedKpiCard Component**: Mobile-first responsive sizing with progressive enhancement
    -   Mobile (default): Padding `p-2` (8px), label `text-[10px]`, value `text-base` (16px), icon container `h-6 w-6` (24×24px), icon `h-3 w-3` (12×12px)
    -   Tablet (sm:): Padding `p-3` (12px), label `text-xs`, value `text-lg` (18px), icon container `h-8 w-8` (32×32px), icon `h-4 w-4` (16×16px)
    -   Desktop (md:): Padding `p-4` (16px), value `text-xl` (20px), icon container `h-10 w-10` (40×40px), icon `h-5 w-5` (20×20px)
    -   Large Desktop (lg:): Value `text-2xl` (24px)

-   **Keyboard Accessibility**: All interactive KPI cards support full keyboard navigation with `role="button"`, `tabIndex={0}`, Enter/Space key handlers, `aria-pressed` for active states, and visible focus rings (`focus-visible:ring-2`) for WCAG compliance.

-   **TailAdmin Design Pattern**: Consistent use of MobileOptimizedKpiCard across all dashboard pages (ArticlesManagement, Home, ArticleDetail) with TailAdmin color scheme: emerald (published/success), indigo (scheduled/upcoming), amber (draft/in-progress), slate (archived/inactive).

-   **Quick Actions System**: Staff-only rapid content creation interface featuring QuickActionCard component with responsive sizing and QuickActionsSection grid. Provides one-click access to create articles, tasks, deep analyses, internal ads, and smart blocks. Implements RBAC gating using `isStaff()` to restrict display to authorized personnel (super_admin, admin, editor, reporter, opinion_author, moderator, content_creator). Features include:
    -   Mobile (default): Icon 48×48px, padding 16px
    -   Tablet (sm:): Icon 56×56px, padding 20px
    -   Desktop (md:+): Icon 64×64px, padding 24px
    -   Grid layout: 1 col mobile → 2 cols tablet → 3 cols desktop → 5 cols XL
    -   TailAdmin color coding: Emerald (articles), Indigo (tasks), Purple (analysis), Amber (ads), Cyan (blocks)
    -   Full keyboard accessibility with Enter/Space handlers and focus-visible rings
    -   Wouter navigation integration

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs, time-series visualizations, and recent activity.
-   **AI Content Features:** AI-powered article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Smart Content Generation System, and a Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries, and a Smart Journalist Agent for news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE with NotificationBell in dashboard header for staff-only real-time article publishing alerts.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses, event tracking (view, share, download), and RBAC-protected updates.
-   **Hierarchical Task Management:** Tasks can have parent-child relationships with unlimited nesting depth, supported by database schema, backend API updates, and a tree-view UI component with on-demand subtask fetching. Implements secure permission-based filtering with `userIdForOwn` parameter that applies OR logic (created OR assigned) for users with view_own permission, preventing privilege escalation vulnerabilities.
-   **Intelligent Email Agent System with Sabq Editorial Style:** Automated email-to-article publishing system that receives news content via SendGrid webhooks, performs AI-powered content analysis and quality scoring, validates senders through whitelist and token authentication, and auto-publishes articles from trusted senders or saves as drafts for review. Features include **GPT-4o content analysis** with **Sabq newspaper editorial style enforcement** (direct, clear, concise, information-rich writing), language detection (Arabic/English/Urdu), category prediction, comprehensive content improvement with AI-generated titles and excerpts following Sabq standards, **comprehensive attachment system** with Google Cloud Storage, comprehensive admin dashboard for sender management and webhook logs, and daily statistics tracking. The system ensures all published content adheres to Sabq's journalistic standards: clear Arabic, no filler, important information first, 8-12 word headlines, and 30-50 word leads. **Token validation** supports multiple formats ([TOKEN:xxx], TOKEN:xxx, or bare 64-character hex) with case-insensitive matching across subject/text/HTML. **Bootstrap approach** allows first trusted sender creation without authentication when database is empty, preventing deployment chicken-egg problem while maintaining security for subsequent additions. **Smart Category Matching** integrates AI-detected categories with database categories through exact/partial matching and intelligent fallback chain (AI match → sender default → first active → first overall), guaranteeing every article has a valid category. **Reporter User Management** automatically creates or retrieves user accounts for trusted senders, ensuring articles are attributed to actual reporters instead of system users, with safe name handling (defaults to "Reporter" for null/empty names). **Content Preservation & Formatting (Nov 2025):** All three language prompts (Arabic, English, Urdu) enforce strict content preservation ("keep all details - never shorten content") and HTML paragraph formatting (each paragraph wrapped in `<p>` tags) to ensure AI-generated articles maintain complete information and proper structure. Webhook log status correctly reflects "published" when auto-publish is enabled, eliminating confusion about processing states. **Word Document Support (Nov 2025):** Full .docx attachment support using `mammoth` library - extracts text from Word documents and merges it with email content before AI analysis, enabling reporters to send news articles as Word files. Original Word files are preserved in Google Cloud Storage for editorial review. Processing flow: Word extraction → merge with email → token removal → AI analysis → attachment processing. Maximum file size: 25MB (SendGrid limit). **Article Visibility Fix (Nov 17, 2025):** Email agent now includes essential fields in articleData to ensure published articles appear in homepage queries: `articleType: "news"`, `newsType: "regular"`, `hideFromHomepage: false`, `displayOrder: 0`. Removed non-existent `language` field from articleData (language is determined by table selection: articles/ur_articles/en_articles). Articles created via email agent are now fully visible in frontend homepage sections. **Comprehensive Attachment System (Nov 17, 2025):** Complete refactor of attachment handling to ensure all files (Word documents, images, other files) are uploaded to Google Cloud Storage and metadata preserved **even during early rejection** (sender not trusted, inactive sender, invalid token, no content, quality too low, no news value). All attachments processed in unified early block before any validation, with complete metadata tracking (filename, contentType, size, url, type). System tracks image files separately for featured image selection while preserving all attachment metadata in webhook logs for editorial review. Dual-fix approach: (1) SendGrid Inbound Parse configuration documentation (docs/SENDGRID_ATTACHMENTS_SETUP.md) with step-by-step setup, (2) Backend code refactor ensuring single source of truth (`allAttachmentsMetadata`) used across all webhook outcomes. **Real-Time Staff Notifications (Nov 17, 2025):** When email agent publishes articles, automatic real-time notifications delivered to all staff users via SSE (Server-Sent Events) with NotificationBell component in dashboard header showing unread count badge, notification panel with list, and toast alerts for breaking news. System uses storage-based endpoints (no direct DB access) for architectural compliance.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5), ElevenLabs API
-   **Email Service:** SendGrid
-   **File Storage:** `@google-cloud/storage` (via Replit Object Storage)
-   **Content Processing:** `rss-parser`, `mammoth` (Word document text extraction)
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
-   **Digital Credentials:** `passkit-generator` (Apple Wallet Pass generation)