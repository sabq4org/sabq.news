# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. Its main goal is to deliver an advanced news experience for the Arabic-speaking market by providing AI-driven article summarization, personalized recommendations, and comprehensive content management. The platform features an RTL-first design, dynamic content delivery, user profiling, and advanced theme management, aiming to enrich news consumption through AI and content enrichment.

**Latest Update (November 2025):** Smart Links system now fully operational with complete CRUD operations for entities and terms, Object Storage integration for entity images, and AI-powered auto-description generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming and Arabic-optimized fonts. It includes a multi-section homepage, AI-summarized article detail pages, a three-page onboarding flow, and a responsive content creator dashboard with a WYSIWYG editor. A comprehensive publishing template system (21 production templates) ensures flexible content presentation with Framer Motion animations. Mobile responsiveness is achieved through a mobile-first approach, ensuring accessible touch targets (minimum 32px) and text sizes.

**Design System (Updated November 2025):**
- **Color Palette:** Enhanced with vibrant yet professional tones. Background shifted from neutral gray to soft bluish-white (#F8FAFF) for improved visual appeal. Primary color brightened to create more engaging interactions.
- **Accent Colors:** New accent system with blue, purple, and green variants for differentiation and visual hierarchy (accent-blue, accent-purple, accent-green).
- **Dashboard UI:** 
  - Welcome card features gradient background (indigo-50 → blue-50 → indigo-50) with soft shadows and animated sparkle icon
  - Stats cards enhanced with colored icon containers, subtle shadows (shadow-indigo-50), and hover elevation effects
  - Gradient text on greeting for premium feel
  - All cards have smooth transitions and hover interactions
- **Calendar System:** Today highlighting in Month and Week views with primary color background (bg-primary/10), border (border-primary), and text styling
- **Dark Mode:** Fully supported with appropriate color adjustments for all new UI elements

**Navigation Design:**
- **NavigationBar (Homepage):** Displays sticky Core Categories navigation bar. Hidden on mobile devices (phones/tablets), visible only on desktop (md breakpoint and above). Smart Categories strip has been removed for cleaner, simpler design.
- **Footer:** Redesigned with column-based layout (NO Card components) to differentiate from news article cards. Features three-tier structure: (1) Intelligence Banner with live AI metrics, (2) Navigation columns with icons and links, (3) Bottom bar with brand, contact, and social/legal links. All numbers displayed in English digits (toLocaleString('en-US')).

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, and TypeScript, with TanStack Query for state management. The backend is Express.js with TypeScript, exposing RESTful APIs. Authentication uses Passport.js (local strategy, bcrypt). PostgreSQL (Neon serverless) is the database, accessed via Drizzle ORM. Google Cloud Storage (via Replit Object Storage) handles file storage, and Server-Sent Events (SSE) enable real-time features. 

**Performance Optimizations:**
- Gzip compression for all responses
- Smart HTTP caching strategy (aggressive for assets, zero for API endpoints)
- TanStack Query configured with zero caching for fresh data
- Background jobs with locking mechanism to prevent concurrent execution and database blocking
- Dynamic categories update every 15 minutes (optimized from 5 minutes for 66% reduction in database load)
- Content Security Policy (CSP) configured to allow WebSocket connections (ws:/wss:) and Vite inline styles for production deployment

### Feature Specifications
Key features include:
- **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles (including opinion_author) and granular permissions. Hybrid authentication with separate login pages (/login for readers, /admin/login for staff) powered by unified backend service with intelligent role-based redirection.
- **Content Management:** Lifecycle management for articles, news, users, and categories, including comment moderation, an advanced article editor with AI-powered title/summary generation, SEO, and bulk operations.
- **Comments & Engagement:** Nested comment system with reply functionality, visual distinction for replies (vertical accent line, "رد" badge, lighter background), reply counters, and real-time comment moderation workflow.
- **Multi-Type Article System:** Support for multiple article types (news, opinion, analysis, column) with unified dashboard management, type-based badges for clear distinction, and dedicated author role (opinion_author) for opinion content. Public pages maintain separation with dedicated opinion listing (/opinion) and detail pages (/opinion/[slug]).
- **Muqtarib (مُقترب) Section:** A thematic system for diverse article perspectives.
- **Al-Mirqab (المرقاب) - Future Forecasting System:** An AI-powered predictive analytics platform with Sabq Index, Next Stories, Radar, and Algorithm Writes.
- **Advanced Internal Announcements System:** Production-grade platform with multi-announcement support, versioning, scheduling, audience targeting, multi-channel distribution, priority levels, rich content editor, and analytics.
- **A/B Testing System:** For content optimization and experiment management.
- **AI-Powered Features:** AI ChatBot Assistant, Audio Summary (Text-to-Speech), Credibility Score Analysis, Daily Briefs, Intelligent Recommendation System (OpenAI embeddings), Story Tracking & Following, Keyword Following, and AI Insights Block.
- **Real-Time Features:** "Moment by Moment" (لحظة بلحظة) provides an AI-powered activity timeline, and a Smart Notifications System offers real-time pushes via SSE.
- **Reporter Profile System:** Dedicated pages for staff and reporters.
- **Audio Newsletters (النشرات الصوتية) & Quick Audio News Briefs:** AI-powered text-to-speech news briefing systems with ElevenLabs integration.
- **Sabq Shorts (سبق قصير) - Vertical Video Reels System:** A full-featured short-form video news platform with vertical swipe navigation, HLS streaming, interactive engagement, analytics, and admin dashboard.
- **Quad Categories Block:** Customizable homepage block displaying 4 category columns with configurable content, admin interface, and optional full-width background color.
- **Smart Categories System:** Intelligent categorization with Core, Dynamic/AI, and Seasonal types, featuring automated article assignment via background jobs, relevance scoring, and intelligent selection algorithms for categories like "الآن".
- **AI-Ready Publisher APIs:** Machine-readable REST API v1 endpoints optimized for LLMs, including comprehensive article metadata, Schema.org JSON-LD structured data, developer documentation, and OpenAPI 3.0 specification.
- **Smart Links Management System:** Full CRUD operations for AI-powered entity and term recognition with:
  - Create, Read, Update (PATCH), Delete (DELETE) endpoints
  - Direct image upload to Object Storage (Google Cloud Storage)
  - AI-powered auto-description generation via GPT-4o
  - Rich metadata support (position, organization, birthDate, location, website, social media)
  - Automatic slug generation and alias management
  - Entity/term detail pages with related articles
  - Dashboard management interface with advanced form handling

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, and Reading History. AI integration leverages OpenAI GPT-5 for Arabic text summarization, title generation, and predictive analysis. A scope-aware theme management system enables dynamic theme application. A Content Import System parses RSS feeds with AI for summarization. The Smart Categories architecture uses a junction table (`articleSmartCategories`) for dynamic/smart categories, a background job for automated assignment, and a refined selection algorithm for "الآن" based on breaking news, trending articles, and featured content.

**Content Management Architecture:**
The platform supports multiple article types (news, opinion, analysis, column) with intelligent categorization:

**Dashboard Management:**
- **Unified Management Interface:** `/dashboard/articles` displays ALL article types (news, opinion, analysis, column) in a single interface titled "الأخبار والمقالات" (News & Articles)
- **Article Type Distinction:** Each article displays a type badge (خبر/رأي/تحليل/عمود) to clearly differentiate between content types
- **No Separate Opinion Section:** The separate "مقالات الرأي" section has been removed from the dashboard navigation for simplified management

**Frontend Separation:**
The platform maintains strict separation on the public-facing website. All news-serving storage methods and API endpoints apply the filtering pattern `or(isNull(articles.articleType), ne(articles.articleType, 'opinion'))` to exclude opinion articles from:
- Public news feeds (`/api/news`, `/api/homepage`)
- Hero, breaking news, editor picks, and deep-dive sections
- Smart categories, recommendations, and personalized feeds
- Related articles and keyword search results
- QuadCategoriesBlock and SmartNewsBlock components

Opinion articles remain accessible exclusively through:
- Public opinion listing (`/api/opinion`) and detail pages (`/opinion/[slug]`)
- User-personal data (bookmarks, likes, reading history)

This architecture ensures simplified content management in the dashboard while maintaining content integrity and separation on the public-facing website.

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