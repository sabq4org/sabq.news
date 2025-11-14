# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management for each language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform's business vision is to deliver an advanced news experience leveraging AI, content enrichment, and social media virality, targeting a broad market with its innovative approach to news consumption.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts, a multi-section homepage, and AI-summarized article detail pages. A comprehensive publishing template system (21 templates) with Framer Motion animations ensures flexible content presentation and mobile responsiveness. Core architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. The platform utilizes a unified brand color system and a consistent smart blocks architecture across all three languages. The user profile page is designed in an Apple News + LinkedIn style, featuring a clean header with inline editing, a horizontal stats row, a modern tab system for navigation, and a wide content area with a grid layout, optimized for mobile-first responsiveness. The platform is integrating TailAdmin Dashboard for analytics, calendar, advanced tables, and user management.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication is handled by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) is used for file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include Gzip compression, smart HTTP caching middleware, production-grade `OptimizedImage` components, and asset footprint reduction.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Social Following System:** Complete user-to-user following infrastructure with analytics and real-time updates.
-   **User Discovery System:** Intelligent user suggestions algorithm and a DiscoverUsers page.
-   **Smart Recommendations System:** AI-powered personalized article recommendations based on user interests and reading history.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, with an advanced TipTap-based WYSIWYG editor and a Smart Media Library System.
-   **AI Analytics Dashboard (Trilingual):** Displays engagement metrics and category analytics.
-   **TailAdmin Analytics Dashboard (Phase 1 COMPLETE):** Modern professional analytics dashboard at `/dashboard/analytics` with 6 KPI metric cards showing lifetime totals and month-over-month trends (Views, Users, Articles, Comments, Likes, Bookmarks), interactive ApexCharts time-series visualization with 12-month historical data, top 10 articles ranking table with view counts and percentage changes, and recent activity feed with user details. Backend APIs implement accurate date-bounded queries with proper monthly aggregation, division-by-zero protection, and meaningful growth indicators. Role-based access control restricts dashboard to admin, super_admin, chief_editor, and editor roles. Production-ready with Architect approval.
-   **Modern Categories Page Redesign (COMPLETE):** Completely redesigned `/categories` page with TailAdmin-inspired professional layout featuring: (1) Statistics summary section with 4 metric cards (Total Categories, Total Articles, Total Views, Total Engagement) with responsive grid and loading states, (2) Search and filter bar with RTL search input, Grid/List view toggle, and sort options (newest, most articles, most viewed), (3) Redesigned compact category cards with emoji removed (replaced with lucide-react Newspaper icons), horizontal icon+name layout, 2x2 stats grid, and hover-elevate interactions, (4) Fully responsive design (1-4 columns based on breakpoint), (5) All interactions use useMemo for performance optimization. Architect approved as production-ready.
-   **Comments & Engagement:** Nested comment system with real-time moderation and AI-powered sentiment analysis.
-   **AI-Powered Article Classification:** Smart Article Classification System for Arabic articles using Claude Sonnet 3.5.
-   **Multi-Type Article System:** Supports news, opinion, analysis, and column articles.
-   **Advanced Internal Announcements System:** Production-grade platform with versioning, scheduling, and audience targeting.
-   **Multilingual SEO Generator:** Enterprise-grade AI-powered SEO optimization across three languages.
-   **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Intelligent Recommendation System, Story/Keyword Following, AI Insights Block, Smart Content Generation System, and a Smart Summary Block.
-   **All-in-One AI Generation (Article Editor):** One-click AI generation for headlines, classification, SEO, and summaries.
-   **Smart Journalist Agent:** Professional AI-powered news writing assistant adhering to editorial standards.
-   **Content AI Hub:** Centralized AI tools dashboard for journalists and editors.
-   **Real-Time Features:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE.
-   **Smart Links Management System:** Full CRUD for AI-powered entity/term recognition.
-   **Social Media Sharing & Distribution System:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs.
-   **Mobile App Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Locale-Isolated User Pages:** Complete English-specific user profile pages.
-   **Related Articles Feature (Trilingual):** Intelligent article recommendations with language-specific formatting.
-   **Reporter Profile System (Trilingual):** Complete trilingual implementation.
-   **Smart Advertising System (Arabic):** Enterprise-grade advertising platform with AI-powered optimization.
-   **SEO and Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.
-   **Apple Wallet Dual Pass System:** Enterprise-grade digital credential system supporting Press Cards and Loyalty Cards with PassKit integration.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5 for various tasks. A scope-aware theme management system, Content Import System (RSS feeds with AI), and Smart Categories architecture are implemented. The Media Library provides centralized asset management with AI-powered keyword extraction.

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

**Digital Credentials**
-   `passkit-generator` (Apple Wallet Pass generation)