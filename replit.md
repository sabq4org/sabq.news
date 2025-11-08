# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, bilingual (Arabic and English) news platform designed to deliver an advanced news experience through AI-driven article summarization, personalized recommendations, and comprehensive content management. It aims to enrich news consumption with AI and content enrichment, featuring an MVP with a complete English dashboard and independent content management for both languages. Key capabilities include a smart links system, an AI-powered SEO optimization platform, and one-click AI content generation. The platform is built with React, Express, and PostgreSQL, supporting RTL/LTR layouts, dynamic content delivery, user profiling, and advanced theme management.

## Recent Changes
**November 8, 2025:** Complete removal of the internal chat/messaging system. All chat-related backend services (chat-storage.ts, chat-websocket.ts, AI chat service), frontend components (chat components folder, notification hooks, chat websocket client), database tables (10+ chat tables), API routes (1300+ lines), and UI elements have been removed. The platform now focuses exclusively on news content management and publishing features.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation. Mobile responsiveness is achieved through a mobile-first approach.

A core architectural decision is the **bilingual system** with separate database architecture, language-specific dashboards and API layers, and shared resources for users, roles, and authentication. An i18n system with LanguageContext and bidirectional routing is implemented. The design system uses an enhanced color palette, gradient backgrounds, subtle shadows, and full dark mode support, with a sticky core categories bar and a redesigned footer.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching, background jobs, and a Content Security Policy (CSP).

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with comment moderation, an advanced article editor, SEO, and bulk operations.
-   **AI Analytics Dashboard (Bilingual):** Complete implementation for both Arabic and English with strict language separation, displaying engagement metrics with Recharts and Framer Motion animations.
-   **Comments & Engagement:** Nested comment system with real-time moderation.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story/Keyword Following, AI Insights Block, SEO AI Assistant (GPT-5), and Smart Content Generation System (GPT-5).
-   **Real-Time Features:** "Moment by Moment" activity timeline and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition, direct image upload, AI auto-description, and rich metadata.
-   **Smart Media Library System (Arabic):** Comprehensive asset management with hierarchical folders, AI-powered image suggestions (GPT-5), and integration with the article editor.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including Schema.org JSON-LD and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages querying English-only data.
-   **Related Articles Feature (Bilingual):** Intelligent article recommendations with language-specific formatting.
-   **Smart Advertising System (Arabic - Phase 1 Implemented):** Enterprise-grade advertising platform with AI-powered optimization. Features include Ad Account, Campaign, Performance Dashboard, Ad Creatives, Inventory Slots, and Creative Placements Management with PostgreSQL EXCLUSION constraint for overlap prevention. RBAC integrated for admin and advertiser roles.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and intelligent media suggestions. A scope-aware theme management system is implemented. A Content Import System parses RSS feeds with AI. The Smart Categories architecture uses a junction table for dynamic/smart categories and a background job for automated assignment. Content management supports multiple article types with a unified dashboard and distinct badges. The Media Library provides centralized asset management with AI-powered keyword extraction.

## External Dependencies

**Authentication & Identity**
-   Passport.js
-   `express-session`, `connect-pg-simple`

**Database & ORM**
-   `@neondatabase/serverless` (PostgreSQL)
-   `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
-   OpenAI API (GPT-5)
-   ElevenLabs API

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