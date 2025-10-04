# Sabq Smart News Platform

## Overview

Sabq Smart is an AI-powered Arabic news platform built with Next.js 15, Express, and PostgreSQL. The platform features intelligent article summarization, personalized recommendations, RSS feed imports, and a comprehensive content management system. It's designed with RTL-first Arabic language support and follows modern design principles inspired by Al Jazeera, The Guardian, and Medium.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- Next.js 15 with React 18 using Vite as the build tool
- Client-side routing via Wouter (lightweight React router)
- TypeScript for type safety across the application
- RTL-first design system optimized for Arabic content

**UI Component System**
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom theme variables
- shadcn/ui component library (New York style variant)
- Custom theme system supporting light/dark modes with CSS variables
- Arabic-optimized typography using IBM Plex Sans Arabic font family
- Custom SABQ logo integration

**State Management**
- TanStack Query (React Query) for server state management
- Custom hooks for authentication and user preferences
- Local component state with React hooks

**Key Frontend Features**
- **Intelligent Homepage** (NEW): Multi-section layout with dynamic content
  - Hero Carousel: Auto-rotating showcase of top 3 stories (5-second intervals)
  - Personalized Feed ("لك خصيصًا"): AI-powered article recommendations
  - Breaking News: Real-time urgent updates with numbered list
  - Deep Dive Section: Analytical articles with AI summaries
  - Editor Picks: Curated content sidebar
  - Trending Topics: Popular categories with dynamic sizing
- Article detail pages with AI summaries and comment sections
- User profile with reading history, bookmarks, and settings
- User registration system with profile completion flow (CompleteProfile → SelectInterests → Home)
- Interest selection page with card-based UI (3-5 interests required)
- Dashboard for content creators and editors
- WYSIWYG article editor with AI-powered title generation
- Responsive design with mobile-first approach
- Behavior tracking hooks for user engagement analytics

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for RESTful API
- Session-based authentication using Replit Auth (OpenID Connect)
- Custom middleware for request logging and error handling

**Database Layer**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database queries
- Schema-first design with Zod validation
- Session storage using connect-pg-simple

**Core Data Models**
- Users: Authentication and comprehensive profile management (firstName, lastName, bio, phoneNumber, profileImageUrl, role, isProfileComplete)
- Articles: Content with versioning, AI summaries, and metadata
- Categories: Hierarchical content organization
- Comments: Threaded discussion system
- Reactions & Bookmarks: User engagement tracking
- RSS Feeds: Automated content import sources
- Reading History: User behavior tracking for recommendations
- Interests: Predefined user interest categories (8 seed interests: politics, sports, economy, technology, health, culture, science, world)
- User Interests: Many-to-many relationship with weighted preferences (3-5 required per user)
- Behavior Logs: Tracks user actions (article views, reads, comments, bookmarks, searches) with metadata
- Sentiment Scores: Stores AI-analyzed emotional sentiment from user comments
- Themes: Dynamic platform themes with assets (logos, banners), tokens (colors, fonts, spacing), scheduling, priority, and lifecycle status
- Theme Audit Log: Complete audit trail of theme changes with user attribution and metadata

**API Architecture**
- RESTful endpoints organized by resource type
- Authentication middleware protecting sensitive routes
- Role-based access control (reader, editor, admin)
- Consistent error handling and response formats
- User profile management (GET /api/auth/user, PATCH /api/auth/user)
- Interest management:
  - GET /api/interests: List all available interests
  - GET /api/user/interests: Get user's selected interests (authenticated)
  - POST /api/user/interests: Set interests with validation (3-5 required, authenticated)
- Behavior tracking:
  - POST /api/behavior/log: Log user actions with sanitized metadata (authenticated)
  - GET /api/user/profile/complete: Get comprehensive user profile with interests, behavior summary, and sentiment profile
- Homepage aggregation (NEW):
  - GET /api/homepage: Returns structured homepage data with all sections:
    - hero: Top 3 articles by views for carousel
    - forYou: Personalized recommendations (uses PersonalizationEngine)
    - breaking: Recent high-view articles (last 24 hours, 5 items)
    - editorPicks: Curated content (4 items)
    - deepDive: Analytical articles with AI summaries (6 items)
    - trending: Top 5 categories by activity (article count)
- Theme management:
  - GET /api/themes/active?scope=site_full: Get active theme with resolution logic
  - GET /api/themes: List all themes (admin/editor only)
  - POST /api/themes: Create new theme (admin/editor)
  - PATCH /api/themes/:id: Update theme (admin/editor)
  - POST /api/themes/:id/publish: Publish theme (admin only)
  - POST /api/themes/:id/expire: Expire active theme (admin only)
  - POST /api/themes/:id/rollback: Rollback to previous version (admin only)
  - GET /api/themes/:id/logs: Get audit trail (admin/editor)
  - POST /api/themes/initialize: Create default theme (admin only)

**AI Integration**
- OpenAI GPT-5 integration for content features:
  - Automatic article summarization
  - AI-powered title generation (3 variants)
  - Support for Arabic language processing
  - Sentiment analysis for user comments (planned)
- Fallback handling for AI service failures

**نبض (Pulse) Intelligent Membership System - Phase 1 ✅ Production-Ready**
- Interest-based user profiling with 8 core categories
- Behavior tracking system monitoring user interactions:
  - Article views and read time with scroll depth tracking
  - Comment creation and engagement
  - Bookmark additions and removals
  - Reaction patterns
  - Search queries and category filters
- Server-side validation: 3-5 interests required, with ID existence checks
- Metadata sanitization: max 10 fields, primitive types only
- Authentication-gated behavior logging to prevent abuse
- Custom hooks: useBehaviorTracking, useArticleReadTracking
- Weighted interest preferences (initial weight: 1.0, dynamic adjustment planned)

**Advanced Theme Management System (In Progress)**
- Database schema: themes and themeAuditLog tables with comprehensive fields
- Dynamic theme resolution logic with priority-based conflict resolution
- Theme lifecycle management (draft → review → scheduled → active → expired)
- Scheduled theme activation with automatic rollback to default
- Full CRUD APIs with RBAC (admin, editor roles)
- Theme assets support: logos (light/dark), favicon, banners, OG images
- Design tokens: colors, fonts, spacing, border radius injected as CSS variables
- Audit trail: Complete history of all theme changes with user tracking
- Rollback functionality: Restore previous theme versions
- Admin UI: Theme Manager page for creating, editing, and publishing themes
- ThemeProvider integration: Automatic CSS variable injection on theme change
- Emergency override support: High-priority themes (priority 9999) bypass normal resolution

**File Storage**
- Google Cloud Storage integration via Replit Object Storage
- Custom ACL (Access Control List) system for file permissions
- Support for public and private content
- Owner-based and role-based access controls

**Content Import System**
- RSS feed parser for automated article import
- Duplicate detection using slug-based matching
- Automatic AI summarization of imported content
- Category mapping for imported articles

### External Dependencies

**Authentication & Identity**
- Replit Auth (OpenID Connect) for user authentication
- Passport.js strategy for session management
- express-session with PostgreSQL session store

**Database & ORM**
- @neondatabase/serverless: Serverless PostgreSQL connection
- drizzle-orm: Type-safe SQL query builder
- drizzle-kit: Database migration tooling

**AI & Machine Learning**
- OpenAI API (GPT-5 model) for:
  - Arabic text summarization
  - Title generation
  - Content analysis

**File Storage**
- @google-cloud/storage: Object storage client
- Replit Object Storage sidecar for credential management

**Content Processing**
- rss-parser: RSS/Atom feed parsing
- date-fns: Date formatting with Arabic locale support

**Frontend Libraries**
- @tanstack/react-query: Server state management
- wouter: Lightweight routing
- @radix-ui/*: Accessible UI primitives (20+ components)
- tailwindcss: Utility-first CSS framework
- class-variance-authority: Component variant management

**Development Tools**
- TypeScript: Static type checking
- Vite: Fast build tooling and HMR
- tsx: TypeScript execution for Node.js
- esbuild: Production bundling

**Deployment Considerations**
- Environment variables for sensitive configuration
- DATABASE_URL for PostgreSQL connection
- OPENAI_API_KEY for AI features
- SESSION_SECRET for session encryption
- ISSUER_URL and REPL_ID for Replit Auth