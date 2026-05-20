# Learning Path Tracker - AI Developer Guide (CLAUDE.md)

This file serves as the system memory, rules, and guidelines for development within the Learning Path Tracker repository.

---

## 1. Project Overview
The **Learning Path Tracker** is a premium dark-themed SaaS-style dashboard application designed to help individuals track their learning progress across various topics, manage subtopics, capture key notes/concepts, and quickly revise critical marked notes.

---

## 2. Tech Stack
- **Framework**: Next.js 16.2+ (App Router)
- **Library**: React 19
- **Language**: TypeScript 5
- **Database ORM**: Prisma 7
- **Database Client**: PostgreSQL (`pg` pool, utilizing `@prisma/adapter-pg` in runtime)
- **Styling**: TailwindCSS v4 with CSS Variables and PostCSS
- **State Management**: React `useState` & `useEffect` (for page-level data), local storage (client-side telemetry)

---

## 3. Folder Structure
```text
learning-path-tracker/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Dashboard tab routes
│   │   ├── dashboard/          # Main Overview dashboard
│   │   ├── notes/              # Notes management screen
│   │   └── topics/             # Topics list and drawers
│   ├── api/                    # API Route Handlers
│   │   ├── dashboard/          # Overview telemetry API
│   │   ├── notes/              # Notes CRUD (single & collection)
│   │   ├── subtopics/          # Subtopic completion PATCH
│   │   └── topics/             # Topics CRUD
│   ├── globals.css             # Global dark SaaS styles & variables
│   └── layout.tsx              # Root Layout
├── components/                 # Reusable UI & Layout Components
│   ├── layout/                 # Layout components (Navbar, Sidebar)
│   ├── ui/                     # UI components (NoteCard, Badge, ProgressBar, etc.)
│   └── icons/                  # Custom SVG icon components
├── lib/                        # Utility & helper modules (prisma.ts)
├── prisma/                     # Database Schema & Migrations
│   └── schema.prisma           # Prisma Data Schema
├── types/                      # TypeScript declarations (index.ts)
├── package.json                # Project dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 4. Prisma Database Rules
- **Schema Modifications**: Always declare explicit relations and cascade rules. E.g., deleting a `Topic` must cascade-delete related `Subtopic` and `Note` records.
- **Indices**: Declare `@@index` on fields commonly used in filtering (e.g. `isImportant`, `topicId`, `status`, `category`, `priority`).
- **No Raw SQL**: Interact with the database exclusively using the `prisma` client wrapper (`@/lib/prisma`). Never write raw SQL.
- **Client Handling**: Keep prisma connection pooling correct across development environment hot-reloads using `globalThis`.

---

## 5. UI Design Rules
- **Color Palette**: Use curated dark SaaS colors, HSL-tailored variables, and sleek dark modes. Avoid generic browser reds/blues/greens.
- **Interactive Gradients**: Use smooth, glowing gradients (e.g. violet, indigo, blue, orange, emerald) for badges, cards, streak items, and banners.
- **Animations & Hover**: 
  - Add micro-animations (e.g., hover scaling, slide-in drawers, scaling modals).
  - Add a premium top gradient border glow on card hover.
- **Consistency**: Keep the dark SaaS design structure standard. Do not introduce light-colored themes or light-gray layouts unless explicitly requested.

---

## 6. Coding Conventions
- **Client Components**: Prefix any files utilizing Hooks (`useState`, `useEffect`, `usePathname`, etc.) with `'use client';` at line 1.
- **Server Actions vs. API routes**: Use API Route Handlers located under `app/api/...` for backend database queries and mutations.
- **Optimistic Updates**: For smooth UX, update the local component/list state optimistically before triggering background API requests. Revert state on failure.
- **No Placeholders**: Never drop in mock image elements or temporary placeholder logic. Use proper markup and real data or tool-generated assets.

---

## 7. API Conventions
- **Endpoint Structure**: Return JSON payloads consistently. Use descriptive status codes (e.g., `200` for Success, `201` for Created, `400` for Bad Request, `404` for Not Found, `500` for Internal Server Error).
- **Error Handling**: Standardize error schemas: `NextResponse.json({ error: 'ErrorMessage' }, { status: Code })`.
- **Query Params**: Use URLSearchParams properly to filter collection results (e.g. GET `/api/notes?topicId=123`).

---

## 8. TypeScript Standards
- **Strong Typing**: Avoid using `any`. Always use explicit types from `@/types` or local interfaces.
- **Imports**: Use path aliases (`@/...`) for absolute imports from the root folder.
- **Route Params**: Declare `params` in Next.js pages or route handlers as a Promise to stay aligned with Next.js 16 requirements. E.g., `params: Promise<{ id: string }>`.

---

## 9. Reusable Component Rules
- Reusable UI elements belong in `components/ui/` or `components/icons/`.
- Ensure components are focused, configurable via props, and accept standard className overlays when applicable.
- Prevent duplicate UI code. Reuse `Badge`, `ProgressBar`, `NoteCard`, and SVG icons instead of rewriting custom local elements.

---

## 10. Dashboard Architecture
The main dashboard page gathers data from multiple services:
1. **Total Overview**: Fetches telemetry counters (Streak, topics completed, overall progress, and recent activities) via `/api/dashboard`.
2. **Detailed Progress**: Fetches active topics progress and subtopic counts via `/api/topics`.
3. **Quick Revision Deck**: Integrates notes retrieval and star-toggles directly on the dashboard page.

---

## 11. Notes System Explanation
Notes capture knowledge chunks attached to a specific learning `Topic`.
- **Creation**: Can be added globally on the Notes page or inline inside the Topic Details drawer.
- **Display**: Grouped by date in the main Notes tab, and ordered chronologically descending in the Topic Details drawer.
- **Deletion**: Synchronizes with the database and triggers updates to related views.

---

## 12. Important Notes / Revision System
Users can star/toggle notes as "Important" to add them to their revision library.
- **Highlighting**: Notes marked important get a custom glowing styling (a premium violet background gradient and custom shadow border).
- **Placement**: A special **Quick Revision** section is displayed on the main Dashboard below progress stats and above recent activity.
- **Telemetry**: Revision counts are recorded in local storage (`lpt_revision_counts`). Clicking **Revise** on a card triggers a modal detailed view and increments this counter client-side.
- **Filters**: The Quick Revision deck features tabs for `All Important`, `Recently Added`, and `Most Revised`.

---

## 13. Progress Tracking Logic
Topic progress tracks the depth of subtopic completion.
- **Recalculation**: Progress is calculated as: `progress = Math.round((completedSubtopics / totalSubtopics) * 100)`.
- **Status Bounds**:
  - `progress == 100` -> Topic Status becomes `COMPLETED`.
  - `100 > progress > 0` -> Topic Status becomes `IN_PROGRESS`.
  - `progress == 0` -> Topic Status becomes `NOT_STARTED`.
- **Cascade**: Updating subtopic completion triggers a parent progress check and updates the overarching Dashboard overall progress metrics.

---

## 14. Essential Developer Prompt Instructions

> [!IMPORTANT]
> When executing tasks in this codebase, follow these rules strictly:
> 1. **Always use Prisma** for database access. Never use raw database queries or direct SQL strings.
> 2. **Always write strict TypeScript**. Maintain complete type safety and avoid compiler overrides.
> 3. **Keep the dark SaaS theme consistent**. Ensure new colors, borders, and overlays fit into the HSL variables and glowing dark theme.
> 4. **Maintain reusable components**. Always check `components/ui/` first before creating new custom layout components.
> 5. **Avoid breaking existing UI**. Be meticulous when editing JSX structures to ensure closing tags and CSS classes remain balanced.
> 6. **Preserve responsive design**. Verify that dashboard blocks, decks, list grids, and details drawers adjust gracefully from mobile to widescreen viewports.
