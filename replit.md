# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform that redefines news consumption. It offers AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. The platform integrates trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. Its primary goal is to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with `LanguageContext` and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA/AAA accessibility standards. The platform enforces a standardized Hindu-Arabic numeral format using `toLocaleString('ar-SA')` across all statistical displays.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs, time-series visualizations, and recent activity.
-   **AI Content Features:** AI-powered article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Smart Content Generation System, and a Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries, and a Smart Journalist Agent for news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses, event tracking (view, share, download), and RBAC-protected updates.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5), ElevenLabs API
-   **Email Service:** SendGrid
-   **File Storage:** `@google-cloud/storage` (via Replit Object Storage)
-   **Content Processing:** `rss-parser`
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
-   **Digital Credentials:** `passkit-generator` (Apple Wallet Pass generation)

## Recent Changes (November 15, 2025)

### Deep Analysis Dashboard - Critical Bug Fixes & UX Improvements

**User-Reported Issues Fixed:**
1. ❌ **Edit functionality broken** - Clicking "Edit" opened empty form instead of loading analysis
2. ❌ **Non-responsive design** - Table unusable on mobile devices
3. ❌ **Poor data display** - Long titles/topics cluttered and unreadable
4. ❌ **Confusing status labels** - "مكتمل" (completed) unclear, users couldn't find "منشور" (published)

**Solutions Implemented:**

**1. Edit Functionality Fix (DeepAnalysis.tsx):**
- ✅ Added URL parameter support via `useLocation` hook
- ✅ Auto-load analysis when `?id=xxx` or `?edit=xxx` in URL
- ✅ Auto-populate form fields (topic, keywords) from loaded analysis
- ✅ DeepAnalysisList.tsx now uses `?id=${analysis.id}` navigation
- **Result:** Edit button now correctly loads and displays analysis for editing

**2. Mobile-Responsive Design (DeepAnalysisList.tsx):**
- ✅ **Mobile View (< md):** Card-based layout with:
  - Status badge + date header
  - Title (line-clamp-2)
  - Topic (line-clamp-1)
  - Category display
  - Action buttons (View, Edit, Delete)
- ✅ **Desktop View (≥ md):** Traditional table layout
- ✅ Clean breakpoint separation using Tailwind's `hidden md:block` / `md:hidden`
- **Result:** Excellent UX on both mobile and desktop devices

**3. Data Display Improvements:**
- ✅ **Titles:** Applied `line-clamp-2` (max 2 lines before truncation)
- ✅ **Topics:** Applied `line-clamp-1` (max 1 line before truncation)
- ✅ **Desktop Table:** Added interactive tooltips for full text on hover
- ✅ **TooltipProvider:** Wrapped component for tooltip functionality
- **Result:** Clean, readable presentation without UI clutter

**4. Status Terminology Standardization:**
- ✅ Changed "completed" label from "مكتمل" → **"جاهز للنشر"** (Ready to Publish)
- ✅ Updated icon from `Save` → `CheckCircle` for better visual recognition
- ✅ **Unified across both files:**
  - `DeepAnalysis.tsx` (detail view + history sidebar)
  - `DeepAnalysisList.tsx` (list view + filters)
- ✅ Status flow now clear:
  - **مسودة** (Draft) - Initial state
  - **جاهز للنشر** (Ready to Publish) - AI generation complete
  - **منشور** (Published) - Public on /omq
  - **مؤرشف** (Archived) - Hidden from public

**Technical Implementation:**
- Added `CheckCircle` import from lucide-react
- Updated `getStatusConfig` helper in both components
- Updated status filter options in DeepAnalysisList
- Removed unused Save button from DeepAnalysis toolbar
- Maintained all data-testid attributes for testing
- Added mobile-specific test IDs

**Testing & Validation:**
- ✅ All LSP errors resolved
- ✅ HMR updates successful
- ✅ Architect review passed
- ✅ No runtime errors
- ✅ Status labels consistent across all views

**Files Modified:**
- `client/src/pages/dashboard/DeepAnalysis.tsx`: +25 lines (URL params, form population, status updates)
- `client/src/pages/dashboard/DeepAnalysisList.tsx`: +150 lines (mobile cards, tooltips, line-clamp)

---