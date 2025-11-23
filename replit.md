# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key features include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform aims to deliver an advanced news experience through AI, content enrichment, and social media virality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform utilizes an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It features a comprehensive publishing template system with Framer Motion animations and mobile responsiveness. The system is trilingual with separate database schemas, language-specific dashboards, and an i18n system using `LanguageContext` and bidirectional routing. A unified brand color system and consistent smart blocks architecture adhere to WCAG 2.1 AA accessibility standards, including standardized Hindu-Arabic numerals. UI components are professional, standard-sized, and mobile-optimized (24px minimum touch targets).

The iFox AI Portal features a futuristic dark mode with enhanced contrast (text-gray-200/300, WCAG AA compliant) and glassmorphism effects. An animated AI mascot with floating, rotation, glowing eye, breathing shadow, and multi-layered pulse animations appears in dashboards and the public iFox homepage, using coordinated ring/particle animations for branding.

The iFox Admin Dashboard is an independent "portal within a portal" with 8 pages: Dashboard, Articles, Editor (AI-powered content generation), Media, Schedule, Analytics (KPIs, time-series, category performance, top articles, engagement), Categories (real-time stats, status toggle), and Settings (AI, Publishing, Notifications, Appearance, Media, Security).

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
-   **Audio Newsletter System:** Comprehensive audio broadcasting platform with ElevenLabs Flash v2.5 integration for Arabic TTS, automated daily briefings, 8 newsletter templates, an advanced editor, homepage audio widget, public newsletter page, RSS podcast feed, analytics dashboard, and automated scheduling system with email notifications.
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
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes scope-aware theme management, a Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with versioned migrations manages database schema. The publisher content sales system uses a three-table architecture (`publishers`, `publisher_credits`, `publisher_credit_logs`) with RBAC and atomic credit deductions. Article ordering uses a hybrid approach of curated sections and chronological feeds.

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