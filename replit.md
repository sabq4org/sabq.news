# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform that revolutionizes news consumption through AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform leverages AI, content enrichment, and social media virality to deliver an advanced news experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with `LanguageContext` and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA accessibility standards, including a standardized Hindu-Arabic numeral format. UI components are professional, standard-sized, and optimized for mobile, adhering to WCAG AA compliance (24px minimum touch targets).

**iFox (آي فوكس) AI Portal Design:** The iFox section features a futuristic dark mode design with enhanced color contrast for readability. Dashboard cards use `/30-/20` opacity range for glassmorphism effect while maintaining visibility. Text colors upgraded to `text-gray-200/300` from `text-white/60` for WCAG AA compliance. The section prominently features an animated AI mascot with floating, rotation, glowing eye effects, breathing shadow, and multi-layered pulse animations using Framer Motion. The mascot appears in both admin dashboard headers and public iFox homepage with coordinated ring/particle animations (cyan, purple, green colors) for cohesive brand identity.

**iFox Admin Dashboard (Complete):** The iFox admin dashboard is a fully independent "portal within a portal" featuring 8 complete pages:
- **Dashboard:** Main overview with KPIs, quick actions, and recent activity
- **Articles:** Article management with filtering, bulk actions, and status tracking
- **Editor:** Advanced WYSIWYG editor with AI-powered content generation
- **Media:** Media library with upload, organization, and asset management
- **Schedule:** Calendar-based scheduling system with drag-and-drop functionality
- **Analytics:** Comprehensive analytics dashboard with performance metrics, time-series charts, category performance analysis, top articles tracking, and engagement statistics (views, engagement, AI scores, active users)
- **Categories:** Category management interface with real-time statistics (article counts, views, AI scores), status toggle functionality, and performance insights
- **Settings:** Advanced configuration panel with 6 sections (AI Settings: provider/model/temperature/tokens/auto-features, Publishing: auto-publish/review/scheduling, Notifications: email/push/digest, Appearance: theme/colors/fonts/RTL, Media: file-size/formats/optimization, Security: 2FA/session/IP-whitelist). All pages use structured settings API (GET/PUT) with proper TypeScript typing and validation.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs, time-series visualizations, and recent activity.
-   **AI Content Features:** AI-powered article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary, Daily Briefs, Smart Content Generation System, and a Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries, and a Smart Journalist Agent for news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE for staff-only real-time article publishing alerts.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics and Social Crawler Middleware for proper Open Graph meta tags generation.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses, event tracking, and RBAC-protected updates.
-   **Hierarchical Task Management:** Tasks can have parent-child relationships with unlimited nesting depth, supported by database schema, backend API, and a tree-view UI component, with secure permission-based filtering.
-   **Intelligent Email Agent System:** Automated email-to-article publishing system with AI for content analysis, quality scoring, sender validation, auto-publishing, and advanced content cleaning.
-   **WhatsApp Auto-Publish System with Multi-Image Support:** Enterprise-grade WhatsApp-to-article publishing system integrated with Twilio API, featuring AI-powered content processing, auto-publishing, comprehensive multi-image management with Google Cloud Storage integration, and intelligent content cleaning.
-   **Publisher/Agency Content Sales System:** Enterprise-grade B2B content publishing platform enabling external publishers and PR agencies to submit news articles through a credit-based package system, requiring admin approval for publishing and credit deduction. Includes publisher logo upload, credit package management, and performance analytics.
-   **Accessibility:** Comprehensive infrastructure for WCAG 2.1 AA compliance, including global state management for accessibility settings, skip links, enhanced ARIA labels, semantic HTML, ARIA live regions, form/loading state announcements, and a Voice Assistant system with Reading/Dyslexia Mode.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes. The publisher content sales system uses a three-table architecture (`publishers`, `publisher_credits`, `publisher_credit_logs`) with RBAC-controlled workflows and atomic credit deductions. Article ordering employs a hybrid approach, combining manually prioritized curated sections with chronological automated feeds.

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