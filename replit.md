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

### Professional Footer Implementation (Oct 12, 2025)
**Feature**: Created comprehensive, RTL-first Footer component for the platform
**Implementation**:
- Multi-column layout with branding, navigation links, social media, and contact information
- Responsive design (mobile: single column, desktop: 5 columns)
- Sections: About (من نحن, اتصل بنا, الشروط والأحكام, سياسة الخصوصية), Categories (all main categories), Services (مُقترب, categories, news, mobile app)
- Social media integration (Facebook, Twitter, Instagram, YouTube, LinkedIn) with hover color effects
- Contact information with email and phone links
- Copyright notice with current year
- Fully integrated into Home.tsx with flexbox layout for proper footer positioning
- Fixed wouter Link nesting issues (removed nested `<a>` tags)

**Impact**: Professional, complete website experience with proper navigation and branding

### Production Theme Migration (Oct 12, 2025)
**Action**: Migrated development theme colors to production default theme
**Implementation**:
- Updated default theme (sabq-default) in database with enhanced color palette
- Light mode colors: background (60 11% 97%), primary (210 90% 45%), improved borders and cards
- Dark mode colors: background (220 28% 6%), foreground (98%), enhanced contrast (borders 20%, cards 10%)
- Updated font stack: IBM Plex Sans Arabic, Tajawal, Inter for better Arabic typography
- Theme name changed to "سبق الذكية - السمة الرئيسية"

**Impact**: Production environment now uses the professionally optimized color scheme with excellent dark mode contrast

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

## AI-Powered Features (Oct 12, 2025)

### 1. AI ChatBot Assistant
**Implementation**: Floating chat interface powered by OpenAI GPT-5
- **Frontend Component**: `AIChatBot.tsx` with Radix UI Dialog
- **Backend**: `/api/ai/chat` endpoint with context-aware responses
- **Features**:
  - Floating button in bottom-left corner (RTL)
  - Context from last 10 published articles
  - Quick suggestion badges for common queries
  - System prompt optimized for Arabic news assistance
  - Full RTL support with responsive design

### 2. Audio Summary (Text-to-Speech)
**Implementation**: Web Speech API for article summarization
- **Custom Hook**: `useTextToSpeech.ts` for browser TTS
- **Integration**: ArticleDetail page with play/stop controls
- **Features**:
  - Reads aiSummary or first 200 words of content
  - Arabic language support (ar-SA)
  - Visual indicators during playback
  - No API costs (browser-native)
  - Volume2/VolumeX icons from lucide-react

### 3. Credibility Score Analysis
**Implementation**: AI-powered article credibility assessment
- **Database Schema**: Added `credibilityScore`, `credibilityAnalysis`, `credibilityLastUpdated` to articles table
- **OpenAI Function**: `analyzeCredibility()` evaluates based on 4 criteria (المصادر، الوضوح، التوازن، الدقة اللغوية)
- **Backend**: `/api/articles/:id/analyze-credibility` endpoint
- **Frontend Component**: `CredibilityIndicator.tsx` with:
  - Progress bar with color coding (green >80, yellow 60-80, red <60)
  - Shield icons (ShieldCheck, AlertTriangle, ShieldX)
  - Dialog showing detailed factor analysis
  - Full RTL and responsive design

### 4. Daily Brief (الملخص اليومي)
**Implementation**: Personalized daily news summary based on user interests
- **Page**: `/daily-brief` (DailyBrief.tsx)
- **Backend**: `/api/daily-brief` fetches articles from user's interested categories
- **Features**:
  - Welcome header with current date in Arabic
  - Estimated reading time calculation
  - Categorized article sections
  - Compact article cards with images and excerpts
  - Empty state with call-to-action for interest selection
  - Refresh button for latest updates
  - Navigation link in user dropdown menu

### 5. Interest Management
**Implementation**: Dedicated page for updating user interests
- **Page**: `/interests/edit` (EditInterests.tsx)
- **Features**:
  - Grid layout (3 cols desktop, 2 tablet, 1 mobile)
  - Visual category cards with selection state
  - Minimum 3 categories validation
  - Progress indicator
  - Toast notifications for success/error
  - Framer-motion animations
  - Linked from Profile and SmartInterestsBlock

### 6. Enhanced Profile Page
**Implementation**: Responsive redesign with article display
- **Article Tabs**: Shows liked articles, bookmarks, and reading history
- **Responsive Layout**:
  - Desktop: 30% sidebar + 70% content, 3-column article grid
  - Tablet: Single column, 2-column article grid
  - Mobile: Single column, 1-column article grid
- **Mobile Optimizations**:
  - Collapsible sidebar sections (Interests, Loyalty, Contact)
  - ArticleCard "grid" variant for compact display
  - Skeleton loaders for each tab
  - Framer-motion staggered entrance animations
- **APIs Used**: `/api/profile/liked`, `/api/profile/bookmarks`, `/api/profile/history`

### 7. AI Insights Block (مؤشرات ذكية) - Oct 13, 2025
**Implementation**: Real-time intelligent analytics dashboard on homepage
- **Component**: `AIInsightsBlock.tsx` - 5-card grid layout with smart metrics
- **Backend**: `/api/ai-insights` endpoint with advanced SQL analytics
- **Analytics Provided** (last 24 hours):
  1. **Most Viewed** (🔥): Top article by views with trend percentage
  2. **Most Commented** (💬): Article with highest engagement in comments
  3. **Most Controversial** (⚡): Highest comment-to-view ratio with AI analysis
  4. **Most Positive** (❤️): Best positive reaction rate from readers
  5. **AI Pick** (🧠): Smart selection based on engagement score (views + comments×5 + likes×3)
- **Features**:
  - Color-coded cards (orange, blue, yellow, pink, purple) with dark mode support
  - Live trend indicators with percentage changes
  - Clickable cards linking to featured articles
  - AI-generated analysis messages in Arabic
  - Auto-refresh every 6 hours
  - Responsive grid (5 cols desktop, 2 cols tablet, 1 col mobile)
  - Skeleton loaders during data fetch
- **Display Location**: Homepage, immediately after Hero Carousel
- **Smart Calculations**:
  - Engagement Score Formula: `views + (comments × 5) + (likes × 3)`
  - Controversy Ratio: `comments / views` for articles with >100 views
  - Positive Rate: `(likes / views) × 100` for articles with >50 views

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