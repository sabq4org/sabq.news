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
- Arabic-optimized typography using Tajawal font family

**State Management**
- TanStack Query (React Query) for server state management
- Custom hooks for authentication and user preferences
- Local component state with React hooks

**Key Frontend Features**
- Home page with featured articles and category filtering
- Article detail pages with AI summaries and comment sections
- User profile with reading history and bookmarks
- Dashboard for content creators and editors
- WYSIWYG article editor with AI-powered title generation
- Responsive design with mobile-first approach

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
- Users: Authentication and profile management
- Articles: Content with versioning, AI summaries, and metadata
- Categories: Hierarchical content organization
- Comments: Threaded discussion system
- Reactions & Bookmarks: User engagement tracking
- RSS Feeds: Automated content import sources
- Reading History: User behavior tracking for recommendations

**API Architecture**
- RESTful endpoints organized by resource type
- Authentication middleware protecting sensitive routes
- Role-based access control (reader, editor, admin)
- Consistent error handling and response formats

**AI Integration**
- OpenAI GPT-5 integration for content features:
  - Automatic article summarization
  - AI-powered title generation (3 variants)
  - Support for Arabic language processing
- Fallback handling for AI service failures

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