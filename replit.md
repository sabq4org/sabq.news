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
- **Authentication & Authorization:** Email/password-based authentication with session management and Roles & Permissions Management (RBAC).
- **Content Management:** Comprehensive article, news, user, and category lifecycle management with advanced filtering, including a comment moderation system.
- **Advanced Article Editor:** Professional interface with subtitle support, news type classification, SEO management, AI-powered title/summary generation, and intuitive tag-based keyword input. Includes an option to republish with a new timestamp.
- **Muqtarib (مُقترب) Section:** Thematic system for presenting articles from different perspectives.
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
    - Moment by Moment (لحظة بلحظة): Timeline displaying all platform activities with pagination and filters.
    - Smart Notifications System: Intelligent engine with deduplication, quiet hours, SSE for real-time pushes, and an admin panel for management.
- **Reporter Profile System:** Comprehensive staff/reporter profile pages linking journalists to their published work with:
    - Individual reporter pages at `/reporter/:slug` with avatar, bio, verification badges, and specialization tags.
    - Performance KPIs: total articles, views, likes, average read time, and completion rate.
    - Latest 5 articles with category badges and engagement metrics.
    - Top 5 writing categories with article counts and percentage shares.
    - 90-day activity timeline chart (views and likes).
    - Clickable reporter links from article detail pages for verified staff members.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, and planned sentiment analysis. A scope-aware theme management system allows for dynamic, date-validated, and page-specific theme application. A Content Import System parses RSS feeds with AI for summarization.

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