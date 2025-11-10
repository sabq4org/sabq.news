# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, **trilingual** (Arabic, English, and Urdu) news platform designed to deliver an advanced news experience through AI-driven article summarization, personalized recommendations, and comprehensive content management. It aims to enrich news consumption with AI and content enrichment, featuring an MVP with complete trilingual dashboards and independent content management for all three languages. Key capabilities include a smart links system, an AI-powered SEO optimization platform, and one-click AI content generation. The platform is built with React, Express, and PostgreSQL, supporting RTL/LTR layouts, dynamic content delivery, user profiling, and advanced theme management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation. Mobile responsiveness is achieved through a mobile-first approach.

A core architectural decision is the **trilingual system** with separate database architecture (ar_*, en_*, ur_* tables), language-specific dashboards and API layers, and shared resources for users, roles, and authentication. An i18n system with LanguageContext and bidirectional routing is implemented across all three languages (Arabic RTL, English LTR, Urdu RTL). **Complete trilingual dashboard implementation** with dedicated layout components (`ArabicDashboardLayout`, `EnglishDashboardLayout`, `UrduDashboardLayout`) and navigation hooks (`useArabicNav`, `useEnglishNav`, `useUrduNav`) ensures proper language-specific UI, RTL support, and navigation for all three versions.

**Design System & Color Palette (November 2025 Update):**
The platform now implements a unified brand color system derived from the "سبق الذكية" logo, ensuring visual consistency and reinforcing brand identity:
- **Primary Brand Blue:** `hsl(220, 84%, 53%)` (#2464ec) - Used for primary buttons, links, interactive elements, and brand accents
- **Secondary (Header/Footer):** `hsl(220, 15%, 30%)` (#414857) - Professional dark tone for navigation bars and footers
- **Typography:** Neutral Dark `hsl(220, 20%, 15%)` (#1e232d) for headings and main text; Neutral Light `hsl(220, 10%, 70%)` (#aaafba) for metadata and secondary information
- **State Colors:** Success (green), Warning (orange), Danger (red), Info (cyan) - Distinct semantic colors for user feedback
- **Dark Mode:** Parallel adjustments maintain brand colors with enhanced readability on dark surfaces
- **UI Components:** Gradient backgrounds, subtle shadows, consistent borders, and full dark mode support throughout
- The system includes sticky core categories bar, redesigned footer, and enhanced card layouts with icon-pill headers for analytics displays

**Smart Blocks System (Trilingual):**
All three language versions (Arabic, English, Urdu) implement a consistent smart blocks architecture:
- **Block Header Design:** Icon pill (colored circle with tag icon) + bold colored title + keyword metadata line
- **Featured Layout:** Large hero article (3/5 width) + 4 grid articles (2/5 width, 2x2 grid) with dark gradient overlays and white text
- **Grid Layout:** Responsive 4-column desktop grid with mobile vertical list view
- **Quad Categories Block:** Redesigned with compact mobile list view (horizontal thumbnail + 3 headlines), shadow-enhanced cards with dark mode borders

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local strategy, bcrypt, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include:
-   **Gzip compression, smart HTTP caching, background jobs, and Content Security Policy (CSP)**
-   **OptimizedImage Component (November 2025):** Production-grade image optimization system with skeleton placeholders, smooth fade-in transitions, IntersectionObserver-based lazy loading, priority loading for above-the-fold images, per-instance refs to support duplicate URLs, and error handling with fallback gradients. Implemented across ArticleCard and SmartNewsBlock components to eliminate progressive image loading and improve perceived performance.

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication (local + Google OAuth + Apple OAuth). Email verification system implemented. OAuth features include automatic email verification, account linking by email, first-time user onboarding flow, and proper redirect logic (new users → onboarding, existing users → dashboard).
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with comment moderation, an advanced article editor, SEO, and bulk operations. Includes a Smart Media Library System (Arabic) with AI-powered image suggestions.
-   **AI Analytics Dashboard (Trilingual):** Complete implementation for Arabic, English, and Urdu, displaying engagement metrics with Recharts and Framer Motion animations. **Reporter Attribution System:** Analytics prioritize `reporterId` (credited reporter/writer) over `authorId` (system user who published), with fallback to maintain backward compatibility for legacy content.
-   **Category Analytics System (Trilingual):** Comprehensive analytics dashboard for category pages showing total articles, total views, total interactions (reactions + bookmarks + comments), most active author (with reporterId prioritization), and average views per article. Professional card layout with Framer Motion animations displayed between hero section and article cards across all three language versions. Reusable CategoryAnalytics component with language-specific endpoints (`/api/categories/:id/analytics`, `/api/en/categories/:id/analytics`, `/api/ur/categories/:id/analytics`).
-   **Comments & Engagement:** Nested comment system with real-time moderation, integrated with user authentication.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story/Keyword Following, AI Insights Block, SEO AI Assistant (GPT-5), and Smart Content Generation System (GPT-5). **Smart Summary Block:** Dual-purpose engagement component serving personalized daily metrics for registered users and promotional content for visitors with feature showcase (4 features: bookmarks, personalized recommendations, smart summaries, instant notifications) and registration CTA buttons.
-   **Real-Time Features:** "Moment by Moment" activity timeline and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition, direct image upload, AI auto-description, and rich metadata.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages querying English-only data.
-   **Related Articles Feature (Trilingual):** Intelligent article recommendations with language-specific formatting across Arabic, English, and Urdu.
-   **Reporter Profile System (Trilingual):** Complete trilingual implementation with language-specific content display. System includes:
    - Triple API endpoints (`/api/reporters/:slug` for Arabic, `/api/en/reporters/:slug` for English, `/api/ur/reporters/:slug` for Urdu)
    - **Bidirectional Fallback Logic:** Arabic version falls back to English when `nameAr` is empty; English version falls back to Arabic when `name` is empty; Urdu version falls back to English when `nameUr` is empty - ensures reporter names always display
    - Smart badge filtering (hides language-specific specializations appropriately in each version)
    - Triple page components (`/reporter/:slug` RTL Arabic, `/en/reporter/:slug` LTR English, `/ur/reporter/:slug` RTL Urdu)
    - Comprehensive analytics including KPIs, article history, top categories, and activity timelines
    - Bio field displays correctly under reporter name/title in all three language versions
-   **Smart Advertising System (Arabic - Phase 1 Implemented):** Enterprise-grade advertising platform with AI-powered optimization, including Ad Account, Campaign, Performance Dashboard, Ad Creatives, Inventory Slots, and Creative Placements Management with PostgreSQL EXCLUSION constraint for overlap prevention. RBAC integrated for admin and advertiser roles.
-   **SEO and Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags for homepage and article pages, with server-side rendering for social media crawlers.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and intelligent media suggestions. A scope-aware theme management system is implemented. A Content Import System parses RSS feeds with AI. The Smart Categories architecture uses a junction table for dynamic/smart categories and a background job for automated assignment. Content management supports multiple article types with a unified dashboard and distinct badges. The Media Library provides centralized asset management with AI-powered keyword extraction.

## External Dependencies

**Authentication & Identity**
-   Passport.js (passport-local, passport-google-oauth20, passport-apple)
-   `express-session`, `connect-pg-simple`
-   `apple-signin-auth` (for Apple ID token verification)

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

**Development Tools**
-   `TypeScript`