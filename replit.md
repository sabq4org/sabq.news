# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform designed to revolutionize news consumption. It offers AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. The platform features trilingual dashboards, independent content management per language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. Its core vision is to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, and a multi-section homepage. It includes a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA/AAA accessibility standards. The platform enforces a standardized Hindu-Arabic numeral format using `toLocaleString('en-US')` across all statistical displays.

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
-   **Deep Analysis (Omq):** Complete public section with UI, navigation, and API endpoints for published analyses, event tracking (view, share, download), and RBAC-protected updates. Includes summary statistics for administrators.

### System Design Choices
Core data models include Users, Articles, Categories, Comments, Reactions, Bookmarks, Reading History, and Media Library. AI integration leverages OpenAI GPT-5. The platform includes a scope-aware theme management system, Content Import System (RSS feeds with AI), and a Smart Categories architecture. The Media Library provides centralized asset management with AI-powered keyword extraction. Drizzle ORM with a versioned migration approach handles database schema changes.

## External Dependencies

**Authentication & Identity**
-   Passport.js (`passport-local`, `passport-google-oauth20`, `passport-apple`)
-   `express-session`, `connect-pg-simple`
-   `apple-signin-auth`

**Database & ORM**
-   `@neondatabase/serverless` (PostgreSQL)
-   `drizzle-orm`, `drizzle-kit`

**AI & Machine Learning**
-   OpenAI API (GPT-5)
-   ElevenLabs API

**Email Service**
-   SendGrid

**File Storage**
-   `@google-cloud/storage` (via Replit Object Storage)

**Content Processing**
-   `rss-parser`

**Frontend Libraries**
-   `@tanstack/react-query`
-   `wouter`
-   `@radix-ui/*`
-   `tailwindcss`, `class-variance-authority`

**Digital Credentials**
-   `passkit-generator` (Apple Wallet Pass generation)

## Recent Changes (November 15, 2025)

### Task Management System (Task Center) - Backend Complete

**تم بناء نظام إدارة مهام متكامل مع AI و RBAC:**

**1. Database Schema (shared/schema.ts):**
- `tasks` table: title, description, status, priority, dueDate, assignedTo, department, tags, aiSuggestions, estimatedDuration, progress
- `subtasks` table: مهام فرعية مع displayOrder و completion tracking
- `taskComments` table: نظام تعليقات كامل
- `taskAttachments` table: رفع ملفات مع metadata
- `taskActivityLog` table: audit trail كامل مع before/after snapshots
- Relations شاملة و Zod validation schemas

**2. Storage Layer (server/storage.ts):**
- 19 method تم تنفيذها بالكامل
- `getTasks` مع filters متقدمة (status, priority, assignedTo, createdBy, department, search)
- `getTaskWithDetails` مع جميع الـ relations
- `getTaskStatistics` للإحصائيات (total, todo, in_progress, review, completed, overdue)
- Counter updates تلقائية للـ subtasks/comments/attachments

**3. RBAC Permissions (server/seedRBAC.ts):**
- 9 task permissions جديدة:
  - tasks.view_all, tasks.view_own
  - tasks.create
  - tasks.edit_own, tasks.edit_any
  - tasks.delete_own, tasks.delete_any
  - tasks.assign, tasks.view_analytics
- Permissions مسندة لجميع الأدوار (admin, editor, reporter, etc.)

**4. Backend API Endpoints (server/routes.ts):**
17 endpoints مع security كاملة:
- Tasks CRUD: GET/POST /api/tasks, GET/PATCH/DELETE /api/tasks/:id
- Status management: PATCH /api/tasks/:id/status
- Statistics: GET /api/tasks/statistics
- Subtasks: POST /api/tasks/:id/subtasks, PATCH/DELETE /api/subtasks/:id, PATCH /api/subtasks/:id/toggle
- Comments: GET/POST /api/tasks/:id/comments, DELETE /api/task-comments/:id
- Attachments: GET/POST /api/tasks/:id/attachments, DELETE /api/task-attachments/:id
- Activity: GET /api/tasks/:id/activity

**5. Security Features:**
- ✅ IDOR Protection: ownership checks في جميع الـ endpoints
- ✅ RBAC Authorization: requirePermission middleware
- ✅ Rate Limiting: taskLimiter (30 req/min) على جميع الـ endpoints
- ✅ Full Audit Trail: activity logging مع before/after full snapshots
- ✅ Input Validation: Zod schemas لجميع الـ requests

**6. Next Phase:**
- Frontend implementation: قائمة المهام، Kanban Board، تفاصيل المهمة
- AI Integration: Smart Assignment، Task Breakdown، Time Prediction
- Smart Notifications: إشعارات ذكية للمواعيد والتحديثات
- Analytics Dashboard: تقارير أداء وإحصائيات

**الملفات المعدلة:**
- `shared/schema.ts`: +250 lines (Task tables + schemas)
- `server/storage.ts`: +600 lines (Storage methods)
- `server/seedRBAC.ts`: +30 lines (Task permissions)
- `server/routes.ts`: +500 lines (17 API endpoints)

---

### Deep Analysis (Omq) Editorial Publishing Workflow - Phase 4

**تم إضافة نظام نشر تحريري كامل لقسم العمق مع RBAC:**

**1. Backend API Enhancements (server/routes.ts):**
- أضفت `PATCH /api/deep-analysis/:id/status` endpoint لتحديث حالة التحليل
- RBAC authorization متقدم:
  - `articles.edit_any` أو `articles.publish`: يمكن نشر/تحديث أي تحليل
  - `articles.edit_own`: يمكن فقط نشر/تحديث التحليلات الخاصة
- Zod validation للحالات (draft, completed, published, archived)
- Activity logging شامل مع isOwner flag
- رسائل خطأ بالعربية للمستخدم النهائي

**2. Dashboard UI Updates (client/src/pages/dashboard/DeepAnalysis.tsx):**
- Status configuration helper مع icons و variants
- أزرار نشر/إلغاء نشر في header التحليل المحدد
- Status badges في قائمة التحليلات السابقة
- TanStack Query mutation مع cache invalidation تلقائي
- Toast notifications للتأكيد

**3. Editorial Workflow:**
```
Dashboard generates analysis → status: 'completed'
    ↓
Reviewer/Editor reviews content
    ↓
Clicks "نشر" button → status: 'published'
    ↓
Appears in public /omq pages
    ↓
Can "إلغاء النشر" anytime → status: 'completed'
```

**4. Bug Fixes:**
- إصلاح API response structure في `/api/omq` endpoint:
  - كان يعيد `{success, data, pagination}`
  - الآن يعيد `{analyses, total, page, limit, totalPages}` للتطابق مع Frontend interface
- إضافة null safety في `Omq.tsx`: `analysesData && analysesData.analyses && analysesData.analyses.length > 0`
- إصلاح TypeError: "undefined is not an object (evaluating 'l.analyses.length')"

**5. Testing & Review:**
✅ Pass - RBAC authorization يعمل بشكل صحيح
✅ المحررون يمكنهم نشر تحليلات الزملاء
✅ Frontend mutations و cache invalidation صحيحة
✅ API response structure متطابق مع Frontend
✅ No LSP errors
✅ Ready for production

**الملفات المعدلة:**
- `server/routes.ts`: +70 lines (PATCH /api/deep-analysis/:id/status + API fix)
- `client/src/pages/dashboard/DeepAnalysis.tsx`: +100 lines (status badges + publish buttons)
- `client/src/pages/Omq.tsx`: null safety improvements
```