# High-Level System Architecture

## 1. Overview
The AutoQA Platform follows a **Microservices-based Event-Driven Architecture**. This ensures that long-running tests (crawling a website) do not block the user interface.

## 2. Core Components

### A. The Client (Frontend)
* **Tech:** Next.js (React), TailwindCSS, Framer Motion.
* **Theme:** "Neon Cyberpunk" (Dark background, high-contrast Green/Purple/Pink accents).
* **Role:** User dashboard, project management, and real-time report visualization.
* **Hosting:** Vercel.

### B. The API Gateway (Backend Core)
* **Tech:** Node.js with NestJS.
* **Role:** Handles incoming HTTP requests, manages authentication, and dispatches jobs to the Worker Queue.
* **Security:** Validates Supabase JWT tokens.

### C. The Worker Queue (Async Engine)
* **Tech:** Redis + BullMQ.
* **Role:** Buffers test requests. If 100 users click "Start Scan" at once, the queue manages the load so the server doesn't crash.

### D. The Crawler & Tester Engine (The "Brain")
* **Tech:** Playwright (Headless Browser) + TypeScript.
* **AI Integration:** LangChain connects to Claude/Gemini APIs.
* **Role:**
    1.  Receives a job from Queue.
    2.  Launches a headless browser.
    3.  Navigates the target URL.
    4.  Injects AI-generated inputs.
    5.  Captures DOM state and Screenshots.

### E. The Data Layer
* **Tech:** Supabase (PostgreSQL).
* **Role:** Stores Projects, Scans, Logs, and JSON Reports.
* **Storage:** Supabase Storage (S3) for screenshots.

## 3. Data Flow Diagram
[Client] -> (HTTP POST) -> [NestJS API]
                                |
                          (Add Job)
                                v
                          [Redis Queue]
                                |
                          (Process Job)
                                v
                     [Playwright Engine] <--> [Target Website]
                                |
                        (Save Results)
                                v
                       [Supabase DB]