# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered Arabic news platform built with React, Express, and PostgreSQL. It aims to provide intelligent article summarization, personalized recommendations, and comprehensive content management. The platform supports RTL-first Arabic language design and draws inspiration from leading news outlets like Al Jazeera, The Guardian, and Medium. Key capabilities include dynamic content delivery, user profiling, and advanced theme management. The business vision is to deliver a cutting-edge news consumption experience, leveraging AI for personalization and content enrichment, targeting the Arabic-speaking market.

## Recent Critical Fixes (Oct 2025)

### Navigation & Routing Fixes (Oct 12, 2025)
**Issue**: Multiple dashboard pages had broken navigation - sidebar showing empty, categories page redirecting to homepage, missing route handlers causing 404 errors
**Solutions Applied**:
1. **React Hooks Error**: Fixed hook ordering in DashboardLayout - all hooks now called before any conditional returns
2. **Role Detection Bug**: Fixed `/api/auth/user` endpoint to use `user.role` from users table as fallback when RBAC userRoles table has no entry
3. **Navigation State**: Removed problematic reader redirect in Dashboard.tsx that was causing unexpected behavior
4. **Dashboard Pages Migration**: Migrated CategoriesManagement, ArticlesManagement, RolesManagement, and ArticleEditor to unified DashboardLayout
5. **Missing Routes**: Added "Coming Soon" placeholder page for all nav.config.ts routes not yet implemented (18 routes)

**Impact**: 
- Dashboard sidebar now displays correctly across all pages with consistent navigation
- All management pages (Categories, Articles, Roles, Editor) use unified DashboardLayout
- All navigation links now resolve (no more 404 errors) with clear "قريباً" messaging

### Dark Mode Enhancement (Oct 12, 2025)
**Issue**: Dark mode colors had insufficient contrast making text and UI elements hard to read
**Solutions Applied**:
- Increased background darkness (6% instead of 8%) for better contrast
- Enhanced text clarity (98% instead of 95%) for improved readability
- Improved border visibility (20% instead of 18%) for better element separation
- Optimized card backgrounds and borders for clearer visual hierarchy
- Brightened primary colors (65% instead of 60%) for better visibility
- Enhanced muted text (75% instead of 70%) for secondary content
- Strengthened shadows for better depth perception
- Improved hover/active interactions for clearer user feedback

**Impact**: Dark mode now provides excellent contrast and readability across the entire platform

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with Next.js 15, React 18, and Vite, using Wouter for client-side routing and TypeScript for type safety. It features an RTL-first design system with Radix UI, Tailwind CSS, shadcn/ui, and custom theming for light/dark modes using IBM Plex Sans Arabic font. State management is handled by TanStack Query for server state and React hooks for local component state.
Key features include an intelligent, multi-section homepage with a hero carousel, personalized feed, breaking news, deep dives, and trending topics. It also supports article detail pages with AI summaries, user profiles, a three-page onboarding flow (Welcome → Interest Selection → Personalization), and a dashboard for content creators with a WYSIWYG article editor. Responsive design, behavior tracking, and authentication-protected routes are integral.

### Backend Architecture
The backend uses Express.js with TypeScript, implementing RESTful APIs. Authentication is session-based via Passport.js with a local email/password strategy, using bcrypt for password hashing and auto-login after registration. PostgreSQL, hosted on Neon serverless, serves as the database, accessed via Drizzle ORM.
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, RSS Feeds, Reading History, User Interests (linking users to categories), Behavior Logs, Sentiment Scores, and Themes.
The API architecture provides authenticated and RBAC-protected endpoints for user management, interest management, behavior tracking, homepage content aggregation, and comprehensive theme management.
AI integration leverages OpenAI GPT-5 for Arabic text summarization, AI-powered title generation, and planned sentiment analysis, with fallback handling for service failures.
The "نبض (Pulse)" Intelligent Membership System tracks user behavior and interests for personalized experiences. 

**Advanced Theme Management System** with comprehensive scope-aware functionality:
- **Scope-Based Application**: Themes can target specific pages (homepage_only, dashboard) or apply site-wide (site_full)
- **Dynamic Theme Resolution**: ThemeProvider automatically detects current page and requests appropriate scoped theme
- **Expiration Handling**: Themes with startAt/endAt dates are automatically validated; expired themes revert to default or none
- **Default Theme Logic**: Default themes respect scope restrictions and date validation; won't apply outside their designated pages
- **Lifecycle Management**: Scheduled activation, audit trail, rollback capabilities, and theme versioning
- **Visual Theme Editor**: Hex color picker with HSL conversion, live preview, and comprehensive asset management
- **Date Validation**: Empty datetime fields properly normalized to null; no validation errors when toggling default status

File storage is handled by Google Cloud Storage via Replit Object Storage, with a custom ACL system. A Content Import System parses RSS feeds, performs duplicate detection, and uses AI for summarization.

### Core Modules
- **Authentication System:** Migrated to traditional email/password with bcrypt hashing, session management, and auto-login after registration.
- **Onboarding Flow:** Three-page journey (Welcome → Interest Selection → Personalization) where users select at least 3 category interests, which are saved to user_interests table linking to categories.
- **Roles & Permissions Management:** Full RBAC system with protected APIs, ensuring system integrity and preventing admin lockouts.
- **News Management:** Comprehensive article lifecycle management with RBAC-protected APIs and multi-filter UI.
- **Users Management:** Full user CRUD with status tracking, RBAC, and self-protection for admin accounts.
- **Categories Management:** UI for hierarchical content organization with full CRUD, RBAC, and hero image support.
- **Keyword Navigation:** Interactive keyword system with dedicated pages showing all articles tagged with specific keywords. Keywords are clickable with smooth hover animations.
- **Advanced Article Editor:** Professional article creation interface with subtitle support, news type classification (breaking/featured/regular), instant/scheduled publishing, comprehensive SEO management with Google preview, and AI-powered title/summary generation. Features a two-column layout (70% content, 30% settings) with rich text editing capabilities.
- **Muqtarib (مُقترب) Section:** Thematic angles (زوايا) system for presenting articles from different perspectives (Digital Publishing, Economy, Thought). Features public angle browsing (/muqtarib), detailed angle pages with linked articles (/muqtarib/:slug), and admin CRUD management (/dashboard/muqtarib) with RBAC protection. Includes AngleCard component, comprehensive hooks for data fetching (useMuqtaribAngles, useAngleDetail, useAngleArticles), and full SEO implementation.

## External Dependencies

**Authentication & Identity**
- Passport.js: Session-based authentication with local strategy
- `express-session` & `connect-pg-simple`: Session management with PostgreSQL store

**Database & ORM**
- `@neondatabase/serverless`: PostgreSQL connection
- `drizzle-orm`: Type-safe SQL query builder
- `drizzle-kit`: Database migration tooling

**AI & Machine Learning**
- OpenAI API (GPT-5 model): Arabic text summarization, title generation, content analysis

**File Storage**
- `@google-cloud/storage`: Google Cloud Storage client via Replit Object Storage

**Content Processing**
- `rss-parser`: RSS/Atom feed parsing
- `date-fns`: Date formatting with Arabic locale support

**Frontend Libraries**
- `@tanstack/react-query`: Server state management
- `wouter`: Lightweight routing
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management

**Development Tools**
- `TypeScript`: Static type checking
- `Vite`: Fast build tooling
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Production bundling