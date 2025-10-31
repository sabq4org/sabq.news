# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. Its main goal is to deliver an advanced news experience for the Arabic-speaking market by providing AI-driven article summarization, personalized recommendations, and comprehensive content management. The platform features an RTL-first design, dynamic content delivery, user profiling, and advanced theme management, aiming to enrich news consumption through AI and content enrichment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 production templates) ensures flexible content presentation with Framer Motion animations. Mobile responsiveness is achieved through a mobile-first approach, ensuring accessible touch targets (minimum 32px) and text sizes.

**Navigation Design:**
- **NavigationBar (Homepage):** Displays sticky Core Categories navigation bar only. Smart Categories strip has been removed for cleaner, simpler design.
- **Footer:** Redesigned with column-based layout (NO Card components) to differentiate from news article cards. Features three-tier structure: (1) Intelligence Banner with live AI metrics, (2) Navigation columns with icons and links, (3) Bottom bar with brand, contact, and social/legal links. All numbers displayed in English digits (toLocaleString('en-US')).

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication uses Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (via Replit Object Storage) handles file storage, and Server-Sent Events (SSE) enable real-time features. Performance optimizations include gzip compression for all responses and a smart caching strategy that prioritizes fresh data by explicitly disabling HTTP caching for API endpoints and configuring TanStack Query for zero caching.

### Feature Specifications
Key features include:
- **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 7 roles and 49 granular permissions.
- **Content Management:** Lifecycle management for articles, news, users, and categories, including comment moderation, an advanced article editor with AI-powered title/summary generation, SEO, and bulk operations.
- **Muqtarib (مُقترب) Section:** A thematic system for diverse article perspectives.
- **Al-Mirqab (المرقاب) - Future Forecasting System:** An AI-powered predictive analytics platform with Sabq Index, Next Stories, Radar, and Algorithm Writes.
- **Advanced Internal Announcements System:** Production-grade platform with multi-announcement support, versioning, scheduling, audience targeting, multi-channel distribution, priority levels, rich content editor, and analytics.
- **A/B Testing System:** For content optimization and experiment management.
- **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (Text-to-Speech), Credibility Score Analysis, Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story Tracking & Following, Keyword Following, and AI Insights Block.
- **Real-Time Features:** "Moment by Moment" (لحظة بلحظة) provides an AI-powered activity timeline, and a Smart Notifications System offers real-time pushes via SSE.
- **Reporter Profile System:** Dedicated pages for staff and reporters.
- **Audio Newsletters (النشرات الصوتية) & Quick Audio News Briefs:** AI-powered text-to-speech news briefing systems with ElevenLabs integration.
- **Sabq Shorts (سبق قصير) - Vertical Video Reels System:** A full-featured short-form video news platform with vertical swipe navigation, HLS streaming, interactive engagement, analytics, and admin dashboard.
- **Quad Categories Block:** Customizable homepage block displaying 4 category columns with configurable content and admin interface.
- **Smart Categories System:** Intelligent categorization with Core, Dynamic/AI, and Seasonal types, featuring automated article assignment via background jobs, relevance scoring, and intelligent selection algorithms for categories like "الآن".
- **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including comprehensive article metadata, Schema.org JSON-LD structured data, developer documentation, and OpenAPI 3.0 specification.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, and predictive analysis. A scope-aware theme management system enables dynamic theme application. A Content Import System parses RSS feeds with AI for summarization. The Smart Categories architecture uses a junction table (`articleSmartCategories`) for dynamic/smart categories, a background job for automated assignment, and a refined selection algorithm for "الآن" based on breaking news, trending articles, and featured content.

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