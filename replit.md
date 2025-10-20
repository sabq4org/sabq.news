# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. It aims to provide intelligent article summarization, personalized recommendations, and comprehensive content management, specifically targeting the Arabic-speaking market. The platform supports RTL-first Arabic language design, offering dynamic content delivery, user profiling, and advanced theme management. Its business vision is to deliver a cutting-edge news consumption experience, leveraging AI for personalization and content enrichment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend utilizes Next.js 15, React 18, and Vite, with Wouter for routing and TypeScript for type safety. It features an RTL-first design system built with Radix UI, Tailwind CSS, shadcn/ui, and custom theming for light/dark modes using Arabic-optimized fonts (IBM Plex Sans Arabic, Tajawal, Inter). State management is handled by TanStack Query for server state. Key features include an intelligent, multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a content creator dashboard with a WYSIWYG editor. Responsive design and authentication-protected routes are standard.

### Backend Architecture
The backend is built with Express.js and TypeScript, providing RESTful APIs. Session-based authentication is managed via Passport.js with a local email/password strategy (bcrypt for hashing). PostgreSQL, hosted on Neon serverless, is the database, accessed via Drizzle ORM. Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for Arabic text summarization, AI-powered title generation, and planned sentiment analysis. A comprehensive scope-aware theme management system allows for dynamic, date-validated, and page-specific theme application with a visual editor. File storage uses Google Cloud Storage via Replit Object Storage, and a Content Import System parses RSS feeds with AI for summarization.

### Core Modules
- **Authentication System:** Email/password-based with bcrypt and session management.
- **Onboarding Flow:** Guides users through interest selection to personalize their experience.
- **Roles & Permissions Management (RBAC):** Ensures secure access control for APIs and features.
- **Content Management:** Comprehensive article, news, user, and category lifecycle management with multi-filter UIs.
- **Keyword Navigation:** Interactive system allowing users to browse articles by keywords.
- **Advanced Article Editor:** A professional interface for article creation, featuring subtitle support, news type classification, SEO management with Google preview, and AI-powered title/summary generation.
- **Muqtarib (مُقترب) Section:** A thematic system for presenting articles from different perspectives, with dedicated browsing and management interfaces.

### AI-Powered Features
- **AI ChatBot Assistant:** A floating chat interface powered by OpenAI GPT-5, providing context-aware responses based on recent articles.
- **Audio Summary (Text-to-Speech):** Browser-native Web Speech API integration for reading article summaries in Arabic.
- **Credibility Score Analysis:** AI-powered assessment of article credibility based on multiple criteria, displayed with visual indicators and detailed analysis.
- **Daily Brief (الملخص اليومي):** A personalized daily news summary based on user interests, featuring categorized articles and estimated reading times.
- **Interest Management:** A dedicated page for users to easily update their category interests.
- **Enhanced Profile Page:** Redesigned user profile with responsive layout, displaying liked articles, bookmarks, and reading history.
- **AI Insights Block (مؤشرات الأسبوع):** A real-time intelligent analytics dashboard on the homepage showing 5 metrics over the last 7 days: Most Viewed (الأكثر تداولاً), Most Commented (الأكثر تعليقاً), Most Controversial (الأكثر جدلاً - comment/view ratio), Most Positive (الأكثر إيجابية - like rate with decimal precision), and AI Pick (اختيار الذكاء - engagement score formula: views + comments×5 + likes×3). Features color-coded cards, trend indicators, clickable article links, and smart thresholds (views >10 for controversial, >5 for positive).
- **Intelligent Recommendation System (نظام التوصيات الذكية):** A comprehensive 3-layer AI-powered behavioral recommendation engine featuring: (1) Event Tracking Service for signal collection (view, like, save, share, comment with weighted scoring), (2) Similarity Engine using OpenAI text-embedding-3-large (1536-dimensional vectors) with multi-signal scoring (content similarity 40%, collaborative 30%, category 20%, recency 10%), and (3) Smart Notification Service with 4 recommendation types (PersonalizedContent, TrendingInInterest, SimilarToRecent, CrossCategory). Includes anti-spam mechanisms (cooldown periods, frequency capping, digest grouping), user affinity calculation with temporal decay, content vectorization on article publish, and automated daily digest delivery via cron job. Features comprehensive settings page at `/dashboard/recommendation-settings` for user customization. Backward-compatible with graceful degradation for legacy 1024-d embeddings during migration period. **Recommendation notifications include article title, thumbnail image (80x80px), and direct deeplinks to recommended articles, displayed with purple star icon and "توصية" label in the notifications UI.**

### Real-Time Features
- **Moment by Moment (لحظة بلحظة):** A comprehensive timeline page displaying all platform activities with 13 activity types (ArticlePublished, ArticleUpdated, CommentAdded, ReactionAdded, UserJoined, CategoryCreated, TagCreated, etc.). Features cursor-based pagination with infinite scroll, RTL-first design, date grouping with sticky headers, and filters by activity type. All article links properly use `/article/[slug]` format.
- **Smart Notifications System:** Intelligent notification engine with deduplication (60-minute window for service layer, 24-hour for legacy engine), quiet hours support, and Server-Sent Events (SSE) for real-time push notifications. **No artificial throttling limits** - users control notification volume through their preference settings. Supports 3 notification types: ArticlePublished (interest-based), BreakingNews (preference-based), and FeaturedArticle (category-based). Automatic notification preferences creation for new users with configurable settings per user. Visual notification bell with unread count, toast notifications for breaking news, and colored icons by notification type. Includes manual resend button (🔔) in article management for administrators to resend notifications for any published article. Comprehensive logging system tracks notification delivery through production deployment with detailed diagnostic output.
- **Notifications Page (صفحة الإشعارات):** A complete notifications management page at `/dashboard/notifications` with filtering by type (all, new articles, breaking news, featured articles), visual indicators for unread notifications (blue dot + highlighted background), relative time display in Arabic, mark as read functionality, and mark all as read button. Features RTL-first design with colored icons per notification type.
- **Notification Admin Panel:** Administrative tool at `/dashboard/notification-admin` for system health monitoring and maintenance. Displays notification system status (total users, users with/without preferences, total notifications sent), bulk fix functionality to create notification preferences for all users missing them, and interface to manage user interests. Includes visual health indicators and real-time statistics.

## External Dependencies

**Authentication & Identity**
- Passport.js
- `express-session`, `connect-pg-simple`

**Database & ORM**
- `@neondatabase/serverless`
- `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
- OpenAI API (GPT-5)

**File Storage**
- `@google-cloud/storage` (via Replit Object Storage)

**Content Processing**
- `rss-parser`, `date-fns`

**Frontend Libraries**
- `@tanstack/react-query`
- `wouter`
- `@radix-ui/*`
- `tailwindcss`, `class-variance-authority`

**Development Tools**
- `TypeScript`, `Vite`, `tsx`, `esbuild`