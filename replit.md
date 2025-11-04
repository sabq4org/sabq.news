# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, bilingual (Arabic and English) news platform designed to deliver an advanced news experience through AI-driven article summarization, personalized recommendations, and comprehensive content management. Built with React, Express, and PostgreSQL, the platform supports RTL/LTR layouts, dynamic content delivery, user profiling, and advanced theme management. It aims to enrich news consumption with AI and content enrichment, featuring an MVP with a complete English dashboard and independent content management for both languages. Key capabilities include a smart links system, an AI-powered SEO optimization platform, and one-click AI content generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation. Mobile responsiveness is achieved through a mobile-first approach.

A core architectural decision is the **bilingual system**, which implements:
-   **Separate Database Architecture:** Independent tables for each language (e.g., `en_categories`, `articles`) for clean separation.
-   **Language-Specific Dashboards:** Completely separate management interfaces for Arabic (`/dashboard`) and English (`/en/dashboard`), each with its own navigation, layout (RTL/LTR), and content management, ensuring zero content mixing.
-   **API Layer Separation:** Dedicated API endpoints for each language (e.g., `/api/dashboard/*` for Arabic, `/api/en/dashboard/*` for English).
-   **Shared Resources:** Users, roles, and authentication are shared.
-   **i18n System:** LanguageContext with translation dictionaries, LanguageSwitcher, and bidirectional routing.
-   **Unified Design System:** Both languages share the same color palette, components, and design principles, adapting for RTL/LTR.

The design system uses an enhanced color palette with a soft bluish-white background, brightened primary colors, and a new accent system (blue, purple, green). Dashboard UI elements feature gradient backgrounds, subtle shadows, and hover effects. Dark mode is fully supported. Navigation includes a sticky core categories bar on desktop and a redesigned footer with an intelligence banner, navigation columns, and a bottom bar.

### Technical Implementations
The frontend is built with Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, utilizing TanStack Query for state management. The backend uses Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (via Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features.

Performance optimizations include Gzip compression, smart HTTP caching, background jobs with locking mechanisms, dynamic category updates every 15 minutes, and a Content Security Policy (CSP). API payload optimization reduces response sizes by excluding heavy fields from homepage endpoints.

### Feature Specifications
Key features include:
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and granular permissions, and hybrid authentication.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, including comment moderation, an advanced article editor with AI-powered title/summary generation, SEO, and bulk operations.
-   **Comments & Engagement:** Nested comment system with reply functionality and real-time moderation.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles, managed from a unified dashboard but strictly separated on public-facing pages.
-   **Advanced Internal Announcements System:** Production-grade platform with multi-announcement support, versioning, scheduling, audience targeting, and analytics.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (Text-to-Speech with ElevenLabs), Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story Tracking & Following, Keyword Following, AI Insights Block, SEO AI Assistant (GPT-5 for automated SEO analysis and content generation), and Smart Content Generation System (one-click content creation using GPT-5).
-   **Real-Time Features:** "Moment by Moment" (لحظة بلحظة) provides an AI-powered activity timeline, and a Smart Notifications System uses SSE.
-   **Smart Links Management System:** Full CRUD operations for AI-powered entity and term recognition, direct image upload, AI-powered auto-description generation, rich metadata support, and dashboard management.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including article metadata, Schema.org JSON-LD, and OpenAPI 3.0 specification.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, and predictive analysis. A scope-aware theme management system enables dynamic theme application. A Content Import System parses RSS feeds with AI for summarization. The Smart Categories architecture uses a junction table (`articleSmartCategories`) for dynamic/smart categories, a background job for automated assignment, and a refined selection algorithm for "الآن" based on breaking news, trending articles, and featured content. Content management supports multiple article types (news, opinion, analysis, column) with a unified dashboard interface and distinct type badges. Public-facing content applies filtering to exclude opinion articles from general news feeds, maintaining separation while opinion articles are accessible via dedicated sections.

## External Dependencies

**Authentication & Identity**
-   Passport.js
-   `express-session`, `connect-pg-simple`

**Database & ORM**
-   `@neondatabase/serverless` (PostgreSQL)
-   `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
-   OpenAI API (GPT-5)
-   ElevenLabs API (Text-to-Speech for Arabic)

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