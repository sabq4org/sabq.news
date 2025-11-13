# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key features include trilingual dashboards, independent content management for each language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform is built with React, Express, and PostgreSQL, supporting dynamic content delivery, user profiling, and advanced theme management. The business vision is to deliver an advanced news experience leveraging AI, content enrichment, and social media virality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, AI-summarized article detail pages, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation and mobile responsiveness. A core architectural decision is the trilingual system with separate database schemas (`ar_*`, `en_*`, `ur_*` tables), language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. The platform utilizes a unified brand color system and a consistent smart blocks architecture across all three languages.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching middleware, production-grade `OptimizedImage` components, and asset footprint reduction.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles, hybrid authentication, and email verification.
-   **Social Following System:** Complete user-to-user following infrastructure with enhanced analytics tracking, robust API endpoints with security and performance considerations, Profile page with followers/following tabs and interactive lists, PublicProfile page for viewing other users' profiles with follow/unfollow functionality, and comprehensive cache invalidation strategy ensuring real-time updates across both users after follow/unfollow actions.
-   **User Discovery System:** Full-featured discovery experience with intelligent user suggestions algorithm (ranking formula: `articles_count * 2 + followers_count` with role prioritization), DiscoverUsers page with responsive grid layout, and distributed follow buttons across 4 strategic locations (ArticleDetail, CommentSection, ReporterProfile, DiscoverUsers page). Navigation integrated in desktop and mobile Header, accessible only to authenticated users.
-   **Smart Recommendations System:** AI-powered personalized article recommendations using SQL-based scoring algorithm with CTEs, user interests integration, reading history analysis, and author following detection. Backend API endpoint (GET /api/recommendations/personalized) with 300-second caching, ready for future frontend integration.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with comment moderation, an advanced TipTap-based WYSIWYG editor supporting rich media embeds (including Twitter/X with theme detection), and a Smart Media Library System with AI-powered image suggestions.
-   **AI Analytics Dashboard (Trilingual):** Displays engagement metrics with reporter attribution and comprehensive category analytics.
-   **Comments & Engagement:** Nested comment system with real-time moderation and AI-powered comment sentiment analysis (Claude Sonnet 4-5, Gemini Flash).
-   **AI-Powered Article Classification:** Smart Article Classification System for Arabic articles using Claude Sonnet 3.5, providing auto-categorization and multi-category suggestions.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **Multilingual SEO Generator:** Enterprise-grade AI-powered SEO optimization system generating meta titles, descriptions, and keywords across all three languages using language-optimized models (Claude Sonnet 3.5, GPT-4o, Gemini 2.5 Flash).
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story/Keyword Following, AI Insights Block, Smart Content Generation System (GPT-5), and a Smart Summary Block.
-   **All-in-One AI Generation (Article Editor):** One-click AI generation for headlines (from 3 models), smart classification, SEO optimization, and smart summaries, with draft-aware architecture and detailed validation.
-   **Smart Journalist Agent:** Professional AI-powered news writing assistant following "Sabq" editorial standards with structured JSON schema output and headline generation from multiple AI models.
-   **Content AI Hub:** Centralized AI tools dashboard for journalists and editors providing 7 integrated tools: Smart Headlines Comparison, Text Summarizer, Social Media Generator, Smart Image Search, Instant Translator, Fact Checker, and Trends Analyzer.
-   **Real-Time Features:** "Moment by Moment" Live News Desk with breaking news ticker, compact live feed, auto-refresh, filters, and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition, direct image upload, AI auto-description, and rich metadata.
-   **Social Media Sharing & Distribution System:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics via a `SocialShareBar` component, smart short links with UTM parameter injection, and a robust backend for tracking and analytics.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages querying English-only data.
-   **Related Articles Feature (Trilingual):** Intelligent article recommendations with language-specific formatting.
-   **Reporter Profile System (Trilingual):** Complete trilingual implementation with language-specific content display and bidirectional fallback logic.
-   **Smart Advertising System (Arabic):** Enterprise-grade advertising platform with AI-powered optimization.
-   **SEO and Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and intelligent media suggestions. A scope-aware theme management system, Content Import System (RSS feeds with AI), and Smart Categories architecture with a junction table are implemented. The Media Library provides centralized asset management with AI-powered keyword extraction.

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

**Development Tools**
-   `TypeScript`