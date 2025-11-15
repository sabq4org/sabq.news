# Sabq Smart News Platform

## Overview
Sabq Smart is an AI-powered, trilingual (Arabic, English, and Urdu) news platform that redefines news consumption. It provides AI-driven article summarization, personalized recommendations, comprehensive content management, and viral social media distribution. The platform features trilingual dashboards, independent content management for each language, smart links, AI-powered SEO, one-click AI content generation, and detailed social sharing analytics. Its business vision is to deliver an advanced news experience by leveraging AI, content enrichment, and social media virality to a broad market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an RTL-first design with custom light/dark theming, Arabic-optimized fonts, a multi-section homepage, and AI-summarized article detail pages. It uses a comprehensive publishing template system with Framer Motion animations for flexible content presentation and mobile responsiveness. Key architectural decisions include a trilingual system with separate database schemas, language-specific dashboards, and an i18n system with LanguageContext and bidirectional routing. A unified brand color system and a consistent smart blocks architecture are applied across all languages, adhering to WCAG 2.1 AA/AAA accessibility standards. The platform also enforces a standardized Hindu-Arabic numeral format using `toLocaleString('en-US')` across all statistical displays.

### Technical Implementations
The frontend utilizes Next.js 15, React 18, Vite, Wouter for routing, TypeScript, and TanStack Query for state management. The backend is built with Express.js and TypeScript, exposing RESTful APIs. Authentication is managed by Passport.js (local, Google OAuth, Apple OAuth). PostgreSQL (Neon serverless) serves as the database, accessed via Drizzle ORM. Google Cloud Storage (Replit Object Storage) handles file storage, and Server-Sent Events (SSE) provide real-time features. Performance optimizations include Gzip compression, smart HTTP caching, and optimized image components.

### Feature Specifications
-   **Authentication & Authorization:** Full Role-Based Access Control (RBAC) with 8 roles and hybrid authentication.
-   **Social Features:** User-to-user following system with analytics and real-time updates, and an intelligent user discovery system.
-   **AI-Powered Recommendations:** Personalized article recommendations based on user interests and reading history.
-   **Content Management:** Lifecycle management for articles, news, users, and categories, featuring an advanced TipTap-based WYSIWYG editor and a Smart Media Library System.
-   **Analytics Dashboards:** Trilingual AI Analytics Dashboard for engagement metrics and category analytics, and a professional TailAdmin-inspired dashboard for key performance indicators (KPIs), time-series visualizations, top articles, and recent activity.
-   **Page Redesigns:** Modernized designs for Categories, Moment by Moment (live news), Category Detail, Article Detail, Homepage, News, and Daily Brief pages, incorporating TailAdmin-inspired layouts, enhanced filtering, statistics, and improved user experience. Daily Brief features 4 KPI statistics cards, enhanced greeting card, upgraded metrics with circular icon badges, improved interest analysis, taller time activity chart, and restructured AI insights section with comprehensive null-safety.
-   **Engagement:** Nested comment system with real-time moderation and AI-powered sentiment analysis.
-   **AI Content Features:** AI-powered article classification (using Claude Sonnet 3.5), multi-type article support, multilingual SEO generation, AI ChatBot Assistant, Audio Summary (ElevenLabs), Daily Briefs, AI Insights Block, Smart Content Generation System, Smart Summary Block, and Deep Analysis Engine (multi-model AI analysis using GPT-5, Gemini, and Claude with SSE streaming).
-   **AI Generation Tools:** One-click AI generation for headlines, classification, SEO, and summaries within the article editor, and a Smart Journalist Agent for AI-powered news writing assistance.
-   **Real-Time Capabilities:** "Moment by Moment" Live News Desk with breaking news ticker and Smart Notifications System via SSE.
-   **Smart Links:** Full CRUD for AI-powered entity/term recognition.
-   **Social Media Integration:** Enterprise-grade viral distribution infrastructure with comprehensive click tracking analytics.
-   **API:** AI-Ready Publisher APIs (machine-readable REST API v1) optimized for LLMs.
-   **Mobile Support:** Native mobile app support via Capacitor 7.4.4 for iOS and Android.
-   **Multilingual Support:** Locale-isolated user pages, trilingual related articles, and trilingual reporter profiles.
-   **Advertising:** Smart Advertising System (Arabic) with AI-powered optimization.
-   **SEO & Social Sharing:** Comprehensive Open Graph and Twitter Card meta tags with server-side rendering.
-   **Digital Credentials:** Apple Wallet Dual Pass System for Press Cards and Loyalty Cards with PassKit integration.

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

### Deep Analysis (Omq) Complete Public Section - Phase 3

**تم إكمال قسم العمق بالكامل مع واجهات المستخدم وتحديثات Navigation:**

**1. صفحات Frontend الجديدة:**

**صفحة Omq الرئيسية (client/src/pages/Omq.tsx):**
- Header section مع Brain icon ووصف القسم
- 4 KPI cards (إجمالي التحليلات، المشاهدات، المشاركات، التنزيلات)
- Filters & Search bar (بحث، حالة، تصنيف، نطاق تاريخ)
- Analysis grid responsive (1-2-3 columns) مع بطاقات شاملة
- Pagination كامل (Previous/Next، أرقام صفحات، عرض نتائج)
- Empty state مع رسالة وزر توجيه
- RTL support + Hindu-Arabic numerals + data-testid لكل عنصر
- Loading skeletons + error handling مع toast

**صفحة OmqDetail (client/src/pages/OmqDetail.tsx):**
- Header مع زر العودة، العنوان، الموضوع، والحالة
- أزرار المشاركة والتنزيل مع event tracking
- Metadata bar (تاريخ، وقت توليد، تصنيف، مراسل)
- Metrics dashboard (5 بطاقات: مشاهدات، مشاركات، تنزيلات، PDF، Word)
- Keywords section لعرض الكلمات المفتاحية
- Main content مع 3 tabs:
  - التحليل الموحد
  - نماذج AI (nested tabs: GPT-5, Gemini, Claude)
  - الملخص التنفيذي
- Auto-record view event عند تحميل الصفحة (مرة واحدة)
- whitespace-pre-wrap للحفاظ على تنسيق النصوص

**صفحة OmqStats (client/src/pages/OmqStats.tsx):**
- TailAdmin dashboard design
- 4 KPI cards (إجمالي التحليلات، المشاهدات، المشاركات، التنزيلات)
- Top 10 performing chart باستخدام Recharts
- Recent analyses table مع روابط للتحليلات
- RTL support + responsive design

**2. تحديثات Navigation:**
- إضافة قسم "قسم العُمق" إلى dashboard sidebar (client/src/nav/nav.config.ts)
- 3 عناصر فرعية: جميع التحليلات (/omq)، الإحصائيات (/omq/stats)، إنشاء جديد
- Routes كاملة في App.tsx (/omq, /omq/:id, /omq/stats)

**3. Bug Fixes:**
- إصلاح infinite loop في Omq.tsx (نقل toast من render إلى useEffect)
- إصلاح missing imports في storage.ts (إضافة deepAnalysisMetrics, deepAnalysisEvents)

**4. Architect Review:**
✅ Pass - يعمل end-to-end بدون blockers
✅ Security: none observed
✅ Data layer, API layer, و UI layer متكاملة بشكل صحيح
✅ RBAC integration working correctly
✅ Ready for production

**الملفات المضافة/المعدلة:**
- client/src/pages/Omq.tsx: +537 lines (صفحة رئيسية)
- client/src/pages/OmqDetail.tsx: ~400 lines (صفحة تفاصيل)
- client/src/pages/OmqStats.tsx: ~300 lines (صفحة إحصائيات)
- client/src/App.tsx: +3 routes
- client/src/nav/nav.config.ts: +1 section
- server/storage.ts: +2 imports (deepAnalysisMetrics, deepAnalysisEvents)

---

### Deep Analysis (Omq) Public API - Phase 2

**تم إضافة API endpoints عامة لقسم العمق (Omq) مع نظام متقدم لتتبع الأحداث:**

**1. تحديثات Storage Interface (server/storage.ts):**
- أضيف 4 methods جديدة إلى `IStorage`:
  - `getPublishedDeepAnalyses()`: قائمة التحليلات المنشورة مع فلترة متقدمة (status, keyword, category, dateRange) و pagination
  - `getDeepAnalysisMetrics()`: الحصول على إحصائيات analysis محدد
  - `recordDeepAnalysisEvent()`: تسجيل أحداث (view, share, download, export_pdf, export_docx) مع دعم الزوار غير المسجلين
  - `getDeepAnalysisStats()`: إحصائيات عامة (إجمالي التحليلات، المشاهدات، المشاركات، التنزيلات، التحليلات الحديثة)

**2. تطبيق Methods في DatabaseStorage:**
- استخدام LEFT JOIN للحصول على metrics مع كل analysis
- تطبيق filters متقدمة مع `ilike`, `or`, `and`, `gte`, `lte`
- استخدام transactions لضمان atomic operations عند تسجيل الأحداث
- إنشاء metrics record تلقائياً إذا لم يكن موجوداً
- تحديث counters باستخدام SQL increment: `sql\`${field} + 1\``
- معالجة null-safety في جميع النتائج

**3. إضافة 5 API Routes جديدة في server/routes.ts:**

**Public Routes:**
- `GET /api/omq`: قائمة التحليلات المنشورة مع pagination
  - Query params: status, keyword, category, dateFrom, dateTo, page, limit
  - Returns: analyses with metrics + pagination metadata
  
- `GET /api/omq/:id`: تفاصيل تحليل محدد
  - تسجيل view event تلقائياً مع metadata (userAgent, ipAddress, referrer)
  - دعم الزوار غير المسجلين (userId optional)
  - Returns: full analysis with metrics
  
- `POST /api/omq/:id/events`: تسجيل حدث (share, download, export_pdf, export_docx)
  - Zod validation للـ eventType
  - دعم anonymous events
  - Returns: updated metrics

**Protected Routes (requireAuth):**
- `GET /api/omq/stats/summary`: إحصائيات عامة للإداريين
  - Returns: totalAnalyses, totalViews, totalShares, totalDownloads, recentAnalyses
  
- `PATCH /api/omq/:id`: تحديث تحليل (RBAC protected)
  - Permissions: `articles.edit_any` أو `articles.edit_own`
  - التحقق من الملكية للمستخدمين ذوي صلاحية `edit_own` فقط
  - Zod validation للحقول المسموح بتحديثها
  - Activity logging لجميع التحديثات

**المميزات التقنية:**
- استخدام Zod schemas للـ validation
- معالجة أخطاء شاملة مع try/catch
- Status codes صحيحة (200, 400, 403, 404, 500)
- رسائل خطأ بالعربية للمستخدم النهائي
- دعم anonymous tracking للزوار
- Transaction-based event recording لضمان data integrity
- RBAC integration مع ownership checks
- Activity logging للعمليات الحساسة

**التأثير:**
- يمكن الآن عرض التحليلات العميقة للجمهور العام
- تتبع دقيق لكل التفاعلات (المشاهدات، المشاركات، التنزيلات)
- نظام permissions متقدم للتحكم في من يمكنه تعديل التحليلات
- دعم كامل للزوار غير المسجلين في قراءة المحتوى وتتبع الأحداث
- إحصائيات شاملة لقياس تأثير التحليلات العميقة

**الملفات المعدلة:**
- `server/storage.ts`: +250 lines (IStorage interface + DatabaseStorage implementation)
- `server/routes.ts`: +280 lines (5 new API endpoints with full validation)

**Testing Status:**
✅ No LSP errors
✅ Server running successfully
✅ All routes properly validated with Zod
✅ RBAC integration working correctly