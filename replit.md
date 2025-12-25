# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption through AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Its core purpose is to deliver an advanced news experience by leveraging AI for content enrichment and social media virality. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations and mobile responsiveness, adhering to WCAG 2.1 AA accessibility standards. The system is trilingual with separate database schemas, language-specific dashboards, and an i18n system. The iFox AI Portal has a futuristic dark mode with glassmorphism effects and an animated AI mascot. The iFox Admin Dashboard is a mobile-responsive "portal within a portal" for article management, AI-powered editing, media, scheduling, analytics, categories, and settings. The Visual AI Image Studio provides enterprise-grade AI image generation, professional infographic creation with Arabic RTL optimization, and automatic Google Cloud Storage uploads.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query. The backend is an Express.js server with TypeScript, exposing RESTful APIs. Authentication utilizes Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage handles file storage, and Server-Sent Events (SSE) provide real-time features. A comprehensive image optimization pipeline includes WebP conversion, responsive sizing, thumbnail generation, blur placeholders, unique filenames, and optimized caching.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations & Personalization:** Personalized article recommendations based on smart behavioral analysis, including "Continue Reading" and "For You" sections.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with an advanced WYSIWYG editor and Smart Media Library.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard and a professional dashboard for KPIs, including advanced reader behavior analytics with detailed tracking.
-   **AI Content Features:** AI article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary, Daily Briefs, Smart Content Generation System, Deep Analysis Engine, and AI Image Transparency System.
-   **iFox Content Generator:** Automated AI content generation for articles and images, with auto-publishing.
-   **Audio Newsletter System:** Comprehensive audio broadcasting platform with ElevenLabs integration for Arabic TTS, automated daily briefings, and an advanced editor.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with a breaking news ticker and an advanced Smart Notification System v2.0 with intelligent deduplication, behavioral tracking, and time-decay algorithms.
-   **Social Media Integration:** Enterprise-grade viral distribution with click tracking, Social Crawler Middleware for Open Graph meta tags, and a Dynamic Metadata System.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI and API for published analyses.
-   **Hierarchical Task Management:** Supports parent-child relationships with unlimited nesting and a tree-view UI.
-   **Intelligent Email Agent System:** Automated email-to-article publishing with AI for content analysis and auto-publishing, supporting URL content extraction.
-   **WhatsApp Auto-Publish System:** Enterprise-grade WhatsApp-to-article publishing with Twilio API, AI content processing, and multi-image management, supporting URL content extraction.
-   **URL Content Extraction System:** Automated extraction of article content from 20+ vetted external news sources with proper Arabic source attribution and security measures.
-   **Publisher/Agency Content Sales System:** B2B content publishing platform with a credit-based package system and performance analytics.
-   **Muqtarab (مُقترب) Content System:** Non-news content platform with "Angles" and "Topics," structured JSON content blocks, and SEO metadata.
-   **Accessibility:** Comprehensive WCAG 2.1 AA compliance infrastructure, including global state management, skip links, ARIA labels, semantic HTML, live regions, and a Voice Assistant with Reading/Dyslexia Mode.
-   **AI Comment Moderation System:** Automated comment analysis using GPT-4o-mini with classification, automatic status updates, an admin dashboard, and background processing.
-   **Advanced Search System**: Full-text search for comments and articles with Arabic text normalization, relevance scoring, and flexible filtering.
-   **Online Moderator Presence System:** Real-time tracking of moderator online status with immediate offline status on logout.
-   **Smart Auto-Format System:** AI-powered smart formatting for the rich text editor that automatically highlights important keywords in Arabic news content, with configurable rules and GPT-5.1 integration.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5.1. The platform includes scope-aware theme management, a Content Import System, and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with versioned migrations manages database schema. The publisher content sales system uses a three-table architecture with RBAC and atomic credit deductions. Article ordering uses a hybrid approach of curated sections and chronological feeds. The iFox Category Management System uses a dedicated endpoint with server-side in-memory caching. The AI Tasks System integrates GPT-5.1 for structured JSON responses, atomic race condition prevention, and automated cleanup jobs.

## Security & Infrastructure

### Security Measures
-   **Password Hashing:** bcrypt with 12 rounds for stronger protection
-   **Rate Limiting:** Multi-tier rate limiting system:
    - General API: 500 requests per 15 minutes per IP
    - Authentication: 5 attempts per 15 minutes (skip successful requests)
    - Sensitive Operations: 10 requests per 15 minutes
-   **Database Encryption:** Neon serverless PostgreSQL uses TLS/SSL by default via WebSocket connections
-   **Session Security:** httpOnly cookies, secure flag in production, strict sameSite policy
-   **CSRF Protection:** crypto.randomBytes(32) tokens
-   **Security Headers:** Comprehensive CSP, HSTS with preload, X-Content-Type-Options, X-Frame-Options

### Database Backup Strategy
-   **Provider:** Neon Serverless PostgreSQL (automatic backups)
-   **Automatic Daily Backups:** Neon provides automatic daily backups with 7-day retention (Pro plans have 30-day retention)
-   **Point-in-Time Recovery (PITR):** Available on Neon Pro/Scale plans for recovering to any point within retention window
-   **Branching:** Neon supports database branching for safe testing and development
-   **Manual Exports:** For additional safety, use `pg_dump` for manual backups to Google Cloud Storage

### Application Performance Monitoring (APM)
-   **Built-in APM Endpoint:** `/api/apm/stats` provides real-time performance metrics
-   **Metrics Tracked:**
    - Total/success/error request counts
    - Average and P95 response times
    - Slow requests (>1000ms) tracking
    - Top error paths
    - Memory usage and uptime
-   **Pool Monitoring:** Database connection pool stats logged periodically
-   **Slow Request Alerts:** Automatic console warnings for requests exceeding 1000ms

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5.1), ElevenLabs API
-   **Email Service:** SendGrid
-   **Messaging Services:** Twilio API (WhatsApp Business API integration)
-   **File Storage:** `@google-cloud/storage`
-   **Content Processing:** `rss-parser`, `mammoth`, Puppeteer
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `framer-motion`
-   **Digital Credentials:** `passkit-generator`
-   **Accessibility Testing:** `axe-core`
-   **Mobile App Development:** Capacitor
-   **Operating System Integration:** Web Speech API