# Implementation Master Plan

## Phase 1: The "Walking Skeleton" (Days 1-2)
1.  **Initialize Monorepo:** Setup basic directory structure.
2.  **Setup Next.js:** Install Next.js with Tailwind.
3.  **Setup Supabase:** Create local Supabase project, initialize tables from `Database_Schema.md`.
4.  **Setup Prisma:** Connect Prisma to Supabase Postgres.
5.  **Hello World:** Create a "Create Project" form on frontend that saves to DB.

## Phase 2: The Core Crawler (Days 3-5)
1.  **Setup NestJS Microservice:** Create the backend worker service.
2.  **Install Playwright:** Configure headless browser.
3.  **Build Crawler:** Write logic to visit a URL and count links.
4.  **Connect Queue:** Make the frontend "Start Scan" button trigger the NestJS worker via Redis.

## Phase 3: The Intelligence Layer (Days 6-10)
1.  **Form Detection:** Teach crawler to find `<input>` tags.
2.  **Integrate AI:** Connect Gemini/Claude API.
3.  **Context Injection:** Send HTML forms to AI, ask for "Negative Test Data".
4.  **Execution:** Playwright fills forms with AI data and clicks submit.
5.  **Error Trapping:** Detect if page crashes or shows 500 error.

## Phase 4: The Neon Dashboard (Days 11-14)
1.  **Build UI:** Create "Terminal-style" logs window.
2.  **Realtime Sync:** Connect Supabase Realtime to show logs as they happen.
3.  **Reporting:** Generate JSON output from DB records.