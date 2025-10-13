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
- **AI Insights Block (مؤشرات ذكية):** A real-time intelligent analytics dashboard on the homepage, showcasing metrics like Most Viewed, Most Commented, Most Controversial, Most Positive, and AI Pick based on advanced SQL analytics and engagement scoring.

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