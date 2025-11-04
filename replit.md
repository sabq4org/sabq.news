# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. Its main goal is to deliver an advanced news experience for the Arabic-speaking market by providing AI-driven article summarization, personalized recommendations, and comprehensive content management. The platform features an RTL-first design, dynamic content delivery, user profiling, and advanced theme management, aiming to enrich news consumption through AI and content enrichment. Key capabilities include a Smart Links system with CRUD operations and AI auto-description, a comprehensive SEO AI platform, one-click AI-powered content generation, and native multi-language support for Arabic and English.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 production templates) ensures flexible content presentation with Framer Motion animations. Mobile responsiveness is achieved through a mobile-first approach. The design system uses a refreshed color palette with vibrant accents, enhanced dashboard UI elements, and full dark mode support. Navigation includes a sticky Core Categories bar on desktop and a redesigned footer with an Intelligence Banner, navigation columns, and a bottom bar.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication uses Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (via Replit Object Storage) handles file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching, zero caching for TanStack Query API calls, background jobs with locking, dynamic category updates, CSP for production, and API payload optimization to reduce response sizes by excluding heavy fields.

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and granular permissions, hybrid authentication with separate login paths.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, including comment moderation, an advanced article editor with AI-powered title/summary generation, SEO, and bulk operations.
-   **Comments & Engagement:** Nested comment system with reply functionality, visual distinctions, reply counters, and real-time moderation.
-   **Multi-Type Article System:** Support for news, opinion, analysis, and column articles, with unified dashboard management but strict separation on public-facing sites.
-   **Muqtarib (مُقترب) Section:** Thematic system for diverse article perspectives.
-   **Al-Mirqab (المرقاب):** AI-powered predictive analytics platform.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, audience targeting, and analytics.
-   **A/B Testing System:** For content optimization.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (Text-to-Speech with ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story Tracking & Following, Keyword Following, AI Insights Block, SEO AI Assistant (automated SEO analysis with GPT-5), and Smart Content Generation System (one-click AI-powered content generation using GPT-5 for all editorial elements).
-   **Real-Time Features:** "Moment by Moment" (لحظة بلحظة) provides an AI-powered activity timeline with live status and AI insights; Smart Notifications via SSE.
-   **Reporter Profile System:** Dedicated pages for staff and reporters.
-   **Audio Newsletters & Quick Audio News Briefs:** AI-powered text-to-speech news briefing systems.
-   **Sabq Shorts (سبق قصير):** Vertical video reels platform with HLS streaming and analytics.
-   **Quad Categories Block:** Customizable homepage block.
-   **Smart Categories System:** Intelligent categorization with Core, Dynamic/AI, and Seasonal types, automated article assignment, and relevance scoring.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD structured data and OpenAPI 3.0 specification.
-   **Smart Links Management System:** Full CRUD for AI-powered entity and term recognition with image upload to Object Storage, AI-powered auto-description, rich metadata, and dashboard management.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for various functions. A scope-aware theme management system enables dynamic theme application. A Content Import System parses RSS feeds with AI for summarization. The Smart Categories architecture uses a junction table, background jobs for automated assignment, and refined selection algorithms. The content management architecture unifies all article types in the dashboard while maintaining strict public-facing separation between news and opinion content via filtering.

### Multi-Language Support System
The platform implements a hybrid multi-language approach using a single database with language fields (`articles.language`, `categories.language`). Supported languages are Arabic ('ar') and English ('en'), with future extensibility. API endpoints accept an optional `language` query parameter for filtering. The frontend uses a `LanguageContext` and `LanguageSelector` component in the header to manage global language state, update document direction, and store preferences in local storage. Content is independent per language; no translation layer is involved.

### Mobile App Support
Native mobile app support is enabled via Capacitor 7.4.4, with configured iOS and Android platforms, including auto-generated app icons and splash screens.

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