# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform. Its purpose is to redefine news consumption through AI-driven summarization, personalized recommendations, comprehensive content management, and viral social media distribution. Key capabilities include trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. The platform aims to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (November 18, 2025)

### Phase 1 Accessibility Enhancements (الأساسيات)
Implemented comprehensive accessibility infrastructure achieving WCAG 2.1 AA compliance:

-   **AccessibilityContext System:** Global state management for fontSize (normal/large/x-large), highContrast, reduceMotion with localStorage persistence
-   **AccessibilitySettings Dialog:** RTL-friendly dialog in Header with font size selector, high contrast toggle, reduce motion toggle, and reset functionality
-   **SkipLinks Component:** WCAG-compliant bypass mechanism with programmatic focus management to main content, navigation, and footer
-   **Enhanced ARIA Labels:** Comprehensive landmarks (role="banner", "navigation", "contentinfo"), descriptive aria-labels, and aria-current for active navigation
-   **CSS Enhancements:** Font sizing system, high contrast mode styles, reduce motion support, enhanced focus indicators
-   **HeroCarousel Accessibility:** Semantic `<article>` elements with role and aria-label attributes for screen reader support

### Phase 2 Smart Accessibility (الوصول الذكي)
Advanced accessibility features with AI-powered assistance and automated testing:

-   **ARIA Live Regions System:** LiveRegionProvider with useAnnounce hook for polite/assertive screen reader announcements, auto-clearing after 5 seconds, and custom event broadcasting (a11y:announce) for advanced integrations
-   **Enhanced Toast Accessibility:** Toast system integrated with ARIA live regions, announcing messages only once per lifecycle with tracked announcement IDs to prevent repetitive screen reader chatter
-   **Form Validation Announcements:** FormFieldAnnouncer utility component for accessible error/success/loading state announcements with field-specific context
-   **Loading State Announcements:** LoadingAnnouncer wrapper component for announcing loading states, completion, and errors to screen readers
-   **Voice Assistant Foundation:** VoiceAssistantProvider using Web Speech API with voice recognition (ar-SA), speech synthesis, command registration system, and VoiceAssistantButton floating control with accessible keyboard navigation
-   **Automated Accessibility Testing:** Comprehensive axe-core integration with Playwright testing suite covering WCAG 2.1 AA compliance, including homepage, article pages, auth flows, accessibility dialog, skip links, live regions, focus indicators, high contrast mode, font size changes, and reduce motion
-   **Touch Target Improvements:** WCAG 2.5.5 compliance with minimum 44x44px touch targets on mobile devices for all interactive elements (buttons, links, inputs) with opt-out capability via .no-min-touch-size class
-   **Enhanced Focus Indicators:** Improved keyboard navigation with visible 2px focus rings, box-shadow halos, high contrast mode support (3px rings with 6px shadows), and skip link visibility on focus
-   **Screen Reader Utilities:** .sr-only and .sr-only-not-focusable CSS classes for visually hiding content while maintaining screen reader accessibility

### Production-Readiness Enhancements
Critical refinements for deployment-ready accessibility (November 18, 2025):

-   **Voice Assistant Error Handling:** Production-grade graceful degradation with HTTPS requirement checks, microphone permission handling, and comprehensive error code mapping (https-required, not-allowed, service-not-allowed, InvalidStateError) to bilingual user-friendly toast notifications
-   **Bilingual Error Messages:** Complete localization system in VoiceAssistantButton with error code mapping providing actionable guidance in both Arabic and English for all failure scenarios (WCAG 3.1 Language of Parts compliance)
-   **Accessibility Statement Page:** Comprehensive bilingual page at `/accessibility-statement` meeting WCAG 3.2.1 requirements with sections for compliance level (WCAG 2.1 AA), accessibility features (visual, keyboard, touch, screen reader, motion), testing & compliance, contact & feedback (accessibility@sabq.life), and known issues with future roadmap
-   **Arabic Semantic Optimizations:** AccessibleDate component using semantic `<time>` elements with proper `dateTime` ISO attribute and localized `aria-label` (removed aria-roledescription misuse), plus UserContent component with `dir="auto"` for automatic bidirectional text handling in mixed-language content
-   **LiveRegion External Events:** Fixed bug in LiveRegionProvider external event subscription for proper announcement broadcasting via custom events
-   **Toast Duplicate Prevention:** Fixed toast announcement tracking with unique ID system preventing repetitive screen reader chatter

### Phase 3 Advanced Accessibility (التميز الشامل)
Production-ready advanced accessibility features exceeding WCAG 2.1 AA standards:

-   **Reading/Dyslexia Mode (COMPLETE):** Production-ready OpenDyslexic font integration via Fontsource NPM package (WOFF2 format) with global loading in index.css. Features enhanced typography (line-height 1.8, letter-spacing 0.12em, word-spacing 0.16em) scoped to text containers only (p, li, h1-h6, blockquote, article, section), preserving table layouts and UI controls. Includes line highlighting on hover with reduce-motion support. SSR/SSG compatible with localStorage guards (typeof window checks). AccessibilitySettings dialog toggle with state persistence. Scoping excludes table headers (td, th) to prevent dashboard layout breakage.

-   **Voice Commands Extension (COMPLETE):** Production-ready trilingual voice commands system with advanced navigation and article reading capabilities. Core architecture includes useResolvedLanguage hook for unified route-aware language detection (/ur → 'ur', /en → 'en', default → LanguageContext), supporting Arabic (ar-SA), English (en-US), and Urdu (ur-PK) speech recognition via Web Speech API. Features comprehensive global navigation commands (7 for ar/en: home, news, opinion, categories, dashboard, profile, daily-brief; 5 for ur: home, news, categories, dashboard, back; plus universal help/back commands), article reading commands (start/stop/pause/resume reading with VoicePlaybackManager utility), and VoiceCommandsHelp dialog with trilingual categorized command lists. Implements multilingual phrase registration (all language variants registered, route resolution via currentLang), language-specific route navigation (Urdu commands navigate to /ur routes), toast + speech synthesis feedback in user's current language, and automatic cleanup. Components: useVoiceCommands hook (global commands), useArticleVoiceCommands hook (article reading), VoicePlaybackManager utility (playback control), VoiceCommandsHelp dialog (help UI), useResolvedLanguage hook (unified language detection). Production-ready with graceful error handling, null guards for unsupported routes, and real-time recognition updates on route/language changes.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with `LanguageContext` and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA accessibility standards. The platform enforces a standardized Hindu-Arabic numeral format using `toLocaleString('ar-SA')` across all statistical displays.

It implements professional, standard-sized UI components optimized for mobile devices, adhering to WCAG AA compliance (24px minimum touch targets on mobile), exemplified by the `MobileOptimizedKpiCard` and `QuickActionCard` components with responsive sizing and keyboard accessibility.

### Technical Implementations
The frontend uses Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional dashboard for KPIs, time-series visualizations, and recent activity.
-   **AI Content Features:** AI-powered article classification, multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, Smart Content Generation System, and a Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries, and a Smart Journalist Agent for news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE with NotificationBell for staff-only real-time article publishing alerts.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **Mobile Support:** Native mobile app support via Capacitor for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.
-   **Deep Analysis (Omq):** Public section with UI, navigation, and API endpoints for published analyses, event tracking, and RBAC-protected updates.
-   **Hierarchical Task Management:** Tasks can have parent-child relationships with unlimited nesting depth, supported by database schema, backend API, and a tree-view UI component, with secure permission-based filtering.
-   **Intelligent Email Agent System with Sabq Editorial Style:** Automated email-to-article publishing system that receives news content via SendGrid webhooks. It performs AI-powered content analysis and quality scoring (GPT-4o enforcing Sabq editorial style), validates senders, auto-publishes or drafts articles. Features include language detection, category prediction, AI content improvement, comprehensive attachment handling (including `.docx` via `mammoth` with preservation in Google Cloud Storage), admin dashboard, and daily statistics. It ensures adherence to Sabq's journalistic standards (clear Arabic, no filler, important info first, short headlines/leads) and includes robust token validation, smart category matching, and reporter user management. The system now fully preserves content details and HTML formatting during AI processing, correctly displays auto-published articles on the homepage, manages all attachments for metadata tracking (even on rejection), and delivers real-time staff notifications via SSE.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

## External Dependencies

-   **Authentication & Identity:** Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`), `express-session`, `connect-pg-simple`, `apple-signin-auth`
-   **Database & ORM:** `@neondatabase/serverless` (PostgreSQL), `drizzle-orm`, `drizzle-kit`
-   **AI & Machine Learning:** OpenAI API (GPT-5), ElevenLabs API
-   **Email Service:** SendGrid
-   **File Storage:** `@google-cloud/storage` (via Replit Object Storage)
-   **Content Processing:** `rss-parser`, `mammoth` (Word document text extraction)
-   **Frontend Libraries:** `@tanstack/react-query`, `wouter`, `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
-   **Digital Credentials:** `passkit-generator` (Apple Wallet Pass generation)