# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform that redefines news consumption. It provides AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. The platform features trilingual dashboards, independent content management for each language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. Its business vision is to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, a multi-section homepage, and AI-summarized article detail pages. It uses a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA/AAA accessibility standards. The platform also enforces a standardized Hindu-Arabic numeral format using `toLocaleString('en-US')` across all statistical displays.

### Technical Implementations
The frontend utilizes Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features. Performance optimizations include Gzip compression, smart HTTP caching, and optimized image components.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Social Features:** User-to-user following system with analytics and real-time updates, and an intelligent user discovery system.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests and reading history.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced TipTap-based WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional TailAdmin-inspired dashboard for key performance indicators (KPIs), time-series visualizations, top articles, and recent activity.
-   **Page Redesigns:** Modernized designs for Categories, Moment by Moment (live news), Category Detail, Article Detail, Homepage, News, and Daily Brief pages, incorporating TailAdmin-inspired layouts, enhanced filtering, statistics, and improved user experience. Daily Brief features 4 KPI statistics cards, enhanced greeting card, upgraded metrics with circular icon badges, improved interest analysis, taller time activity chart, and restructured AI insights section with comprehensive null-safety.
-   **Engagement:** Nested comment system with real-time moderation and AI-powered sentiment analysis.
-   **AI Content Features:** AI-powered article classification (using Claude Sonnet 3.5), multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, AI Insights Block, Smart Content Generation System, Smart Summary Block, and Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries within the article editor, and a Smart Journalist Agent for AI-powered news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE.
-   **Smart Links:** Full CRUD for AI-powered entity/term recognition.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **API:** AI-Ready Publisher APIs (machine-readable REST API v1) optimized for LLMs.
-   **Mobile Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Advertising:** Smart Advertising System (Arabic) with AI-powered optimization.
-   **SEO & Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

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