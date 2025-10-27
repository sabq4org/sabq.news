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