# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It achieves this through AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform aims to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with `LanguageContext` and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA accessibility standards, including a standardized Hindu-Arabic numeral format using `toLocaleString('ar-SA')`. UI components are professional, standard-sized, and optimized for mobile, adhering to WCAG AA compliance (24px minimum touch targets).

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs, time-series visualizations, and recent activity.
-   **AI Content Features:** AI-powered article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary, Daily Briefs, Smart Content Generation System, and a Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries, and a Smart Journalist Agent for news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE for staff-only real-time article publishing alerts.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics and Social Crawler Middleware for proper Open Graph meta tags generation (server-side rendering for WhatsApp, Facebook, Twitter crawlers).
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses, event tracking, and RBAC-protected updates.
-   **Hierarchical Task Management:** Tasks can have parent-child relationships with unlimited nesting depth, supported by database schema, backend API, and a tree-view UI component, with secure permission-based filtering.
-   **Intelligent Email Agent System with Sabq Editorial Style:** Automated email-to-article publishing system that uses AI for content analysis, quality scoring, sender validation, and auto-publishing or drafting articles, adhering to Sabq's journalistic standards. Features advanced content cleaning that automatically removes sender names, email signatures, greetings/closings, contact information, and any metadata unrelated to news content before AI processing.
-   **WhatsApp Auto-Publish System:** Enterprise-grade WhatsApp-to-article publishing system integrated with Twilio API, mirroring the email agent architecture for AI-powered content processing and auto-publishing. All articles created via WhatsApp Agent are configured with `hideFromHomepage: false` to ensure visibility in homepage article listings. Includes the same intelligent content cleaning system as Email Agent.
-   **Accessibility:** Comprehensive infrastructure for WCAG 2.1 AA compliance, including global state management for accessibility settings, skip links, enhanced ARIA labels, semantic HTML, and advanced features like ARIA live regions, form/loading state announcements, and a Voice Assistant system. Includes production-ready Reading/Dyslexia Mode with OpenDyslexic font and trilingual Voice Commands for navigation and article reading.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

**Article Ordering Strategy:**
The platform employs a hybrid ordering approach to balance editorial curation with chronological feeds:

-   **Curated Sections (Manual Priority):** Hero Articles, Breaking News, Editor Picks, and Featured Shorts use `displayOrder` as the primary sort key, followed by `publishedAt` (and `views` where applicable). This allows editors to manually pin important content regardless of publish time.
-   **Automated Feeds (Chronological):** For You Feed, General Article Listings, Deep Dive Articles, and Shorts Feeds use pure chronological ordering based on `publishedAt` and `createdAt`. This ensures articles from automated sources (Email Agent, WhatsApp Agent) appear in correct time sequence without manual intervention.
-   **Implementation Note:** Articles without `displayOrder` values (NULL) are automatically sorted after manually prioritized content in curated sections, ensuring editorial control remains intact while automated content flows naturally into time-based feeds.

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5), ElevenLabs API
-   **Email Service:** SendGrid
-   **Messaging Services:** Twilio API (WhatsApp Business API integration)
-   **File Storage:** `@google-cloud/storage` (via Replit Object Storage)
-   **Content Processing:** `rss-parser`, `mammoth` (Word document text extraction)
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
-   **Digital Credentials:** `passkit-generator` (Apple Wallet Pass generation)
-   **Accessibility Testing:** `axe-core` (automated WCAG compliance testing)
-   **Voice Assistant:** Web Speech API (browser native)