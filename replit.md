# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. It aims to provide intelligent article summarization, personalized recommendations, and comprehensive content management, specifically targeting the Arabic-speaking market. Its business vision is to deliver a cutting-edge news consumption experience, leveraging AI for personalization and content enrichment. The platform supports RTL-first Arabic language design, offering dynamic content delivery, user profiling, and advanced theme management, with market potential in the Arabic-speaking demographic.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design system with custom theming for light/dark modes using Arabic-optimized fonts (IBM Plex Sans Arabic, Tajawal, Inter). It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a content creator dashboard with a WYSIWYG editor. Responsive design is standard.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript. State management is handled by TanStack Query. The backend is built with Express.js and TypeScript, providing RESTful APIs. Session-based authentication uses Passport.js with a local email/password strategy and bcrypt. PostgreSQL, hosted on Neon serverless, is the database, accessed via Drizzle ORM. File storage uses Google Cloud Storage via Replit Object Storage. Real-time features are powered by Server-Sent Events (SSE).

### Feature Specifications
Key features include:
- **Authentication & Authorization:** Email/password-based authentication with session management and comprehensive Roles & Permissions Management (RBAC):
    - **Full RBAC System:** Integrated within Users Management page at `/dashboard/users`
    - **7 System Roles:** system_admin, admin, editor, reporter, comments_moderator, media_manager, reader
    - **49 Granular Permissions:** Organized across 9 modules (articles, categories, users, comments, analytics, system, tags, media, mirqab)
    - **Multi-Role Assignment:** Users can have multiple roles with merged permissions
    - **Secure User Creation:** Admin-only capability with unique temporary passwords (format: `Temp{nanoid(12)}@{year}`), displayed once via AlertDialog with copy-to-clipboard
    - **Role Management UI:** RolesPanel component with PermissionMatrix for viewing merged permissions
    - **Activity Logging:** All user/role changes logged to activityLogs with oldValue/newValue tracking
    - **API Security:** All RBAC endpoints follow `/api/admin/*` pattern with requirePermission middleware
    - **Password Security:** bcrypt hashing with 10 salt rounds, no credential logging, one-time password display
- **Content Management:** Comprehensive article, news, user, and category lifecycle management with advanced filtering, including a comment moderation system.
- **Advanced Article Editor:** Professional interface with subtitle support, news type classification, SEO management, AI-powered title/summary generation, and intuitive tag-based keyword input. Includes an option to republish with a new timestamp. Includes reporter assignment functionality with searchable combobox (avatar, name, email display), validation to ensure assigned user has reporter role, and smart query handling to always show pre-assigned reporters regardless of pagination. **Data Validation:** Automatic sanitization of legacy data - imageUrl validated against http/https pattern, reporterId validated against UUID format, SEO metaTitle/metaDescription auto-truncated to 70/160 characters when using title/excerpt as fallbacks.
- **Muqtarib (مُقترب) Section:** Thematic system for presenting articles from different perspectives.
- **Al-Mirqab (المرقاب) - Future Forecasting System:** AI-powered predictive analytics platform at `/mirqab` featuring four distinct content types:
    - **Sabq Index (مؤشر سبق):** Weekly numerical indicators tracking key metrics with trend analysis, historical comparisons, and AI-generated insights
    - **Next Stories (القصة القادمة):** In-depth predictive analysis of upcoming events with probability assessments, impact scores, and scenario planning
    - **Radar (الرادار):** Daily alert reports highlighting emerging trends, risk levels, and real-time monitoring of critical developments
    - **Algorithm Writes (الخوارزمي يكتب):** AI-generated articles analyzing patterns and forecasting future scenarios with full editorial integration
    - **Dedicated RBAC:** 6 granular permissions (view, create, edit, delete, publish, manage_all) for fine-grained access control
    - **Complete CRUD:** 27 protected API endpoints with 18 frontend pages (landing, 4 public lists, 4 detail pages, 4 dashboard views, 4 create/edit forms)
    - **Database Architecture:** 5 specialized tables (mirqab_entries + 4 type-specific satellites) with JSONB for complex data structures
    - **Rich Visualization:** Custom gradient themes per content type, RTL-optimized layouts, and responsive design with loading states
- **Internal Announcement System:** Dashboard-wide announcement banners with various types, expiration options, and admin management.
- **A/B Testing System:** Comprehensive platform for content optimization with experiment management, smart variant distribution, real-time tracking, and advanced analytics.
- **AI-Powered Features:**
    - AI ChatBot Assistant (OpenAI GPT-5).
    - Audio Summary (Text-to-Speech).
    - Credibility Score Analysis.
    - Daily Brief (الملخص اليومي) for personalized news summaries.
    - Intelligent Recommendation System: A 3-layer behavioral engine using OpenAI embeddings with multi-signal scoring, smart notifications, and keyword following integration.
    - Story Tracking & Following System: AI-powered grouping of related articles into evolving narratives with timelines and customizable notifications.
    - Keyword Following System: Personalized keyword tracking with trending keywords display, one-click follow/unfollow, and smart notifications.
    - AI Insights Block (مؤشرات الأسبوع): Real-time analytics dashboard on the homepage showing key metrics.
- **Real-Time Features:**
    - **Moment by Moment (لحظة بلحظة):** Advanced AI-powered activity timeline at `/moment-by-moment` featuring:
        - **AI Daily Insights:** OpenAI-powered analysis generating daily activity summaries, trend detection, and key highlights
        - **Live Statistics Panel:** Real-time engagement metrics (active users, comments, reactions)
        - **Trending Topics Detection:** AI-driven identification of most active topics with engagement scores
        - **Smart Activity Grouping:** Chronological timeline with date-based sections (today, yesterday, this week, this month)
        - **Advanced Filtering:** Search, activity type filters, and date range selection
        - **API Endpoint:** `/api/moment/ai-insights` with 1-minute caching to optimize OpenAI usage
        - **Responsive Design:** RTL-first layout with gradient backgrounds and smooth animations
    - Smart Notifications System: Intelligent engine with deduplication, quiet hours, SSE for real-time pushes, and an admin panel for management.
- **Reporter Profile System:** Comprehensive staff/reporter profile pages linking journalists to their published work with:
    - Individual reporter pages at `/reporter/:slug` with avatar, bio, verification badges, and specialization tags.
    - Performance KPIs: total articles, views, likes, average read time, and completion rate.
    - Latest 5 articles with category badges and engagement metrics.
    - Top 5 writing categories with article counts and percentage shares.
    - 90-day activity timeline chart (views and likes).
    - Clickable reporter links from article detail pages for verified staff members.
- **Publishing Templates System:** Comprehensive template-based publishing infrastructure for diverse content presentation:
    - **21 React Components:** 14 production templates (Hero, List, Grid, Ticker, Timeline, Spotlight, Video, Live) + 7 skeleton placeholders (Podcast, Infographic, Tags, Newsletter, Native, Opinion, Mosaic)
    - **Template Selector Engine:** Intelligent scoring system (0-100) analyzing content context (itemCount, hasImages, hasVideo, hasBreaking, avgExcerptLength, uniqueCategories, isTimeSensitive) to recommend optimal templates
    - **Template Registry:** Centralized TEMPLATE_REGISTRY mapping template IDs to components for dynamic loading
    - **Interactive Playground:** Full preview environment at `/dashboard/template-playground` with dataset selection, template switching, smart recommendations, auto-refresh, content analysis, and tabbed interface (Preview, Props, Info)
    - **Demo Data:** Comprehensive fixtures (demoArticles.json, demoCollections.json) for testing and development
    - **Manifest Architecture:** JSON-based template definitions (templatesManifest.json) with metadata, behaviors, styles, accessibility, performance hints, and scoring criteria
    - **TypeScript Types:** Complete type system for template props, content context, recommendations, and selection policies
    - **RTL-First Design:** All templates support right-to-left Arabic layout with proper accessibility (ARIA roles, keyboard navigation, data-testid attributes)
    - **Performance Optimized:** Lazy loading images, framer-motion animations (<250ms), responsive design, and virtual scrolling support

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Al-Mirqab forecasting tables (mirqab_entries, sabq_index_data, next_story_data, radar_data, algorithm_write_data). AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, predictive analysis, and planned sentiment analysis. A scope-aware theme management system allows for dynamic, date-validated, and page-specific theme application. A Content Import System parses RSS feeds with AI for summarization.

## External Dependencies

**Authentication & Identity**
- Passport.js
- `express-session`, `connect-pg-simple`

**Database & ORM**
- `@neondatabase/serverless` (PostgreSQL)
- `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
- OpenAI API (GPT-5)

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