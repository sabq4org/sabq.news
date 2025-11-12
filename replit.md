# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform that enriches news consumption through AI-driven article summarization, personalized recommendations, and comprehensive content management. The platform features trilingual dashboards, independent content management for each language, a smart links system, AI-powered SEO optimization, and one-click AI content generation. It is built with React, Express, and PostgreSQL, supporting RTL/LTR layouts, dynamic content delivery, user profiling, and advanced theme management. The business vision is to deliver an advanced news experience leveraging AI and content enrichment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation. Mobile responsiveness is achieved through a mobile-first approach.

A core architectural decision is the **trilingual system** with separate database architecture (`ar_*`, `en_*`, `ur_*` tables), language-specific dashboards and API layers, and shared resources for users, roles, and authentication. An i18n system with LanguageContext and bidirectional routing is implemented across all three languages (Arabic RTL, English LTR, Urdu RTL).

The platform implements a unified brand color system and a consistent smart blocks architecture across all three languages, featuring distinct header designs, featured layouts, responsive grid layouts, and quad categories blocks.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local strategy, bcrypt, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. 

**Performance Optimizations:**
- Gzip compression for all responses
- Smart HTTP caching middleware (server/cacheMiddleware.ts) with configurable cache durations (LONG: 3600s, MEDIUM: 300s, PERMANENT for immutable assets)
- Applied caching to high-traffic endpoints: /api/categories, /api/trending-keywords, /api/themes/active, /api/smart-blocks with stale-while-revalidate strategy
- Background jobs for automated tasks
- Content Security Policy (CSP) with strict directives
- Production-grade `OptimizedImage` component with WebP fallback (<picture> element), blur placeholders, advanced lazy loading (IntersectionObserver with 200px rootMargin), and error handling
- Asset footprint reduced from 65MB to 56KB via aggressive cleanup (294 files → 3 files)
- Automated cleanup script (scripts/cleanup.sh) for build artifacts and logs

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication (local + Google OAuth + Apple OAuth), including email verification and onboarding flows.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with comment moderation, an advanced article editor (TipTap-based WYSIWYG with Twitter embed support), SEO capabilities, and bulk operations. Includes a Smart Media Library System with AI-powered image suggestions. The editor supports rich media embedding including Twitter/X posts with automatic widget rendering and theme-aware display. Features direct image upload system with preview, progress tracking, multi-upload support (up to 10 images for galleries), and validation (JPG, PNG, GIF, WEBP formats, 10MB max). Twitter embeds implement dynamic theme detection, ensuring tweets display in the reader's current dark/light mode preference without persisting theme in saved HTML.
-   **AI Analytics Dashboard (Trilingual):** Displays engagement metrics with reporter attribution (prioritizing `reporterId`) and comprehensive category analytics dashboards.
-   **Comments & Engagement:** Nested comment system with real-time moderation and AI-powered comment sentiment analysis (Claude Sonnet 4-5, Gemini Flash) with real-time, batch analysis, historical tracking, and dashboard integration.
-   **AI-Powered Article Classification:** Smart Article Classification System for Arabic articles using Claude Sonnet 3.5, providing auto-categorization and multi-category suggestions integrated into the article editor.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **Multilingual SEO Generator:** Enterprise-grade AI-powered SEO optimization system generating meta titles, descriptions, and keywords across all three languages using language-optimized models (Claude Sonnet 3.5, GPT-4o, Gemini 2.5 Flash). Features include editor integration, auto-filling fields, dual-field architecture for content and metadata, version history, provider tracking, and manual override detection.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story/Keyword Following, AI Insights Block, Smart Content Generation System (GPT-5), and a Smart Summary Block.
-   **All-in-One AI Generation (Article Editor):** Comprehensive one-click AI generation button executing 4 AI operations in parallel: (1) Headline Suggestions from 3 AI models (GPT-4o, Claude Sonnet 4-5, Gemini 2.0 Flash), (2) Smart Classification with confidence scoring, (3) SEO optimization (meta title, description, keywords), and (4) Smart Summary (excerpt generation). Features draft-aware architecture supporting both unsaved articles and saved articles, individual error handling per operation (partial success handling), auto-slug generation when selecting headlines, comprehensive validation (title ≥10 chars, content ≥100 chars), and detailed toast notifications showing success/failure count per operation. Includes fixed Smart Summary mutation with proper validation support.
-   **Smart Journalist Agent (Enhanced):** Professional AI-powered news writing assistant following "Sabq" editorial standards with structured JSON schema output (separate lead sentences, body paragraphs, reactions, conclusion), server-side validation (word count 300-500, title ≤10 words, non-empty sections), headline validation with Arabic verb detection, and comprehensive logging. Generates headlines using GPT-4o (formal), Claude Sonnet 4-5 (engaging), and Gemini 2.0 Flash (SEO-optimized). Features detailed prompts enforcing: verb-led titles, 2-line leads, 3-line max paragraphs, neutral tone, and future-impact conclusions. Includes robust JSON parsing with enhanced AI prompts and clear error handling (no auto-fix fallback to prevent data corruption).
-   **Content AI Hub:** Centralized AI tools dashboard for journalists and editors providing 7 integrated tools: (1) Smart Headlines Comparison - generates and compares headlines from GPT-4o, Claude Sonnet 4-5, and Gemini 2.0 Flash; (2) Text Summarizer - uses Claude Sonnet 4-5 for intelligent 30% compression while preserving key points; (3) Social Media Generator - creates platform-optimized posts (Twitter 280, Facebook 500, LinkedIn 700 chars) with GPT-4o; (4) Smart Image Search - suggests image queries and keywords via Gemini 2.0 Flash; (5) Instant Translator - professional translation across 7 languages using Claude Sonnet 4-5; (6) Fact Checker - detects misinformation using ensemble voting from 3 AI models (Claude Sonnet 4-5, GPT-4o, Gemini 2.0 Flash) with confidence scoring, detailed reasoning, red flag detection, and verification recommendations; (7) Trends Analyzer - analyzes trending topics across articles and comments using Claude + Gemini with timeframe filtering (day/week/month), sentiment analysis, and strategic recommendations. All endpoints feature comprehensive Zod input validation (bounds checking, language validation, platform validation) with Arabic error messages, logging, and strict no-emoji policy enforcement.
-   **Real-Time Features:** "Moment by Moment" Live News Desk - redesigned from scratch with breaking news ticker, compact live feed (20 items/page), auto-refresh (30s), simple filters (breaking/all), optimized performance (<1s load time), and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition, direct image upload, AI auto-description, and rich metadata.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages querying English-only data.
-   **Related Articles Feature (Trilingual):** Intelligent article recommendations with language-specific formatting.
-   **Reporter Profile System (Trilingual):** Complete trilingual implementation with language-specific content display and bidirectional fallback logic.
-   **Smart Advertising System (Arabic):** Enterprise-grade advertising platform with AI-powered optimization, including ad account, campaign, performance dashboard, and creative management.
-   **SEO and Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and intelligent media suggestions. A scope-aware theme management system is implemented. A Content Import System parses RSS feeds with AI. The Smart Categories architecture uses a junction table and a background job for automated assignment. Content management supports multiple article types with a unified dashboard and distinct badges. The Media Library provides centralized asset management with AI-powered keyword extraction.

## External Dependencies

**Authentication & Identity**
-   Passport.js (passport-local, passport-google-oauth20, passport-apple)
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

**Development Tools**
-   `TypeScript`