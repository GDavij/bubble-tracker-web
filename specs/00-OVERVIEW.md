# BubbleTracker Web — Overview & Architecture

## What Is BubbleTracker?

BubbleTracker is a social dynamics analysis platform. Users submit free-text descriptions of social interactions (e.g., "Had lunch with PersonA, PersonB showed up unexpectedly"). The backend uses Gemini AI via an agentic tool-calling loop to extract people, relationships, and social roles, then computes dynamic metrics from **10+ academic disciplines** (psychology, sociology, philosophy, mathematics, physics, geography, anthropology, economics, neuroscience, communication, history).

The web app is the Vue.js frontend that provides a visual interface for all of this.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Vue 3 (Composition API, `<script setup>`) | ^3.5 |
| Language | TypeScript | ~5.6 |
| Build | Vite | ^6 |
| Routing | Vue Router | ^4 |
| State | Pinia | ^2 |
| Graph Viz | D3.js (d3-force, d3-selection) | ^7 |
| Charts | Chart.js + vue-chartjs | ^4 |
| HTTP | Axios | ^1 |
| CSS | Tailwind CSS | ^3 |
| Icons | Lucide Vue Next | latest |
| Animations | @vueuse/motion | latest |
| Utilities | @vueuse/core | latest |
| Testing | Vitest + Playwright | latest |

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Auth Layout (no sidebar)                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Login / Register screens                   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   App Layout (authenticated)              │
│ ┌──────────┬─────────────────────────────────────────────┐│
│ │          │  Top Bar (user avatar, notifications)        ││
│ │          ├─────────────────────────────────────────────┤│
│ │ Sidebar  │                                             ││
│ │ (240px)  │           Main Content Area                 ││
│ │          │           (router-view)                     ││
│ │          │                                             ││
│ │          │                                             ││
│ │          │                                             ││
│ └──────────┴─────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Layout Variants

| Layout | Used By | Description |
|--------|---------|-------------|
| `AuthLayout` | Login, Register | Centered card, no sidebar, dark background |
| `AppLayout` | All authenticated screens | Sidebar + top bar + content area |
| `FullscreenLayout` | Social Graph (expandable) | Content fills viewport, sidebar collapsed |

---

## Route Map

```typescript
// Public (AuthLayout)
/auth/login          → LoginView
/auth/register       → RegisterView

// Authenticated (AppLayout)
/                     → DashboardView (redirect)
/dashboard           → DashboardView
/graph               → SocialGraphView
/people              → PeopleListView
/people/:id          → PersonDetailView
/relationships       → RelationshipsListView
/relationships/:id   → RelationshipHealthView
/analyze             → AnalysisView
/chat                → ChatView
/timeline            → EmotionalTimelineView
/memories            → MemoriesSearchView
/analytics           → AnalyticsView
/analytics/roles     → RolesView
/analytics/profiles  → ProfilesView
/analytics/snapshot  → GraphSnapshotView

// Settings
/settings            → SettingsView
```

---

## Directory Structure

```
src/
├── assets/                  # Static assets
│   ├── styles/             # Global CSS, Tailwind imports
│   └── images/             # Logo, illustrations
├── components/             # Shared components
│   ├── layout/             # AppLayout, Sidebar, TopBar
│   ├── graph/              # D3 graph visualization components
│   ├── charts/             # Chart.js wrapper components
│   ├── people/             # Person-related shared components
│   ├── relationships/      # Relationship-related shared components
│   ├── analysis/           # Analysis-related shared components
│   └── ui/                 # Base UI primitives (Button, Card, Modal, etc.)
├── composables/            # Vue composables
│   ├── useAuth.ts          # Auth state + token management
│   ├── useApi.ts           # HTTP client with interceptors
│   ├── useWebSocket.ts     # WebSocket connection management
│   ├── useSSE.ts           # Server-Sent Events
│   ├── useGraph.ts         # D3 graph manipulation
│   └── useNotifications.ts # Toast notification system
├── stores/                 # Pinia stores
│   ├── auth.ts             # Auth state (user, tokens)
│   ├── graph.ts            # Social graph data
│   ├── people.ts           # People list + selected person
│   ├── relationships.ts    # Relationships data
│   ├── chat.ts             # Chat messages + WebSocket
│   ├── analysis.ts         # Analysis jobs + SSE updates
│   └── ui.ts               # Sidebar state, theme, layout
├── views/                  # Route-level page components
│   ├── auth/
│   ├── dashboard/
│   ├── graph/
│   ├── people/
│   ├── relationships/
│   ├── analysis/
│   ├── chat/
│   ├── timeline/
│   ├── memories/
│   └── analytics/
├── router/                 # Vue Router config
│   └── index.ts
├── services/               # API service layer
│   ├── api.ts              # Axios instance + interceptors
│   ├── auth.service.ts     # Auth API calls
│   ├── graph.service.ts    # Graph API calls
│   ├── people.service.ts   # People API calls
│   ├── relationships.service.ts
│   ├── analysis.service.ts
│   ├── chat.service.ts
│   ├── memories.service.ts
│   └── states.service.ts
├── types/                  # TypeScript interfaces
│   ├── api.ts              # API response types
│   ├── domain.ts           # Domain entity types (Person, Relationship, etc.)
│   ├── graph.ts            # Graph node/edge types
│   └── auth.ts             # Auth types
├── utils/                  # Utility functions
│   ├── constants.ts        # App-wide constants
│   └── formatters.ts       # Date, number formatting
├── App.vue
└── main.ts
```

---

## Design Principles

1. **Data-driven UI** — All screens derive from backend API responses. No mock data in production.
2. **Real-time first** — WebSocket for chat, SSE for analysis updates. Polling as fallback.
3. **Interdisciplinary richness** — Every metric from the 10+ disciplines should be visible and explorable.
4. **Progressive disclosure** — Dashboard shows summaries; detail views reveal full metrics.
5. **Graph-centric** — The social graph is the core visual metaphor. Nodes are people, edges are relationships.
6. **Dark theme default** — Social dynamics app feels more personal in dark mode.
7. **Responsive** — Sidebar collapses on mobile, graph becomes touch-friendly.

---

## API Base URL Configuration

```typescript
// .env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

---

## Color System (Tailwind)

### Role Colors

| Role | Color | Tailwind Class |
|------|-------|---------------|
| Bridge | Amber | `amber-500` |
| Mentor | Blue | `blue-500` |
| Anchor | Emerald | `emerald-500` |
| Catalyst | Orange | `orange-500` |
| Observer | Slate | `slate-400` |
| Drain | Red | `red-500` |

### Quality Colors

| Quality | Color | Tailwind Class |
|---------|-------|---------------|
| Nourishing | Green | `green-500` |
| Neutral | Gray | `gray-400` |
| Draining | Red | `red-500` |
| Conflicted | Yellow | `yellow-500` |
| Unknown | Gray | `gray-300` |

### Mood Colors

| Mood | Color | Tailwind Class |
|------|-------|---------------|
| Happy | Yellow | `yellow-400` |
| Anxious | Purple | `purple-400` |
| Tired | Gray | `gray-400` |
| Energized | Orange | `orange-400` |
| Sad | Blue | `blue-400` |
| Neutral | Gray | `gray-300` |
| Angry | Red | `red-400` |
| Hopeful | Emerald | `emerald-400` |
| Lonely | Indigo | `indigo-400` |
| Grateful | Pink | `pink-400` |

---

## Authentication Flow

1. User lands on `/auth/login` (no token → redirect)
2. Login → receive `access_token` (15min) + `refresh_token` (7 days)
3. Store tokens in memory (access) + httpOnly cookie or localStorage (refresh)
4. Axios interceptor attaches `Authorization: Bearer <access_token>` to all requests
5. On 401 → attempt refresh via `POST /auth/refresh` → retry original request
6. On refresh failure → redirect to `/auth/login`

---

## Real-time Architecture

```
┌─────────────────────┐
│   Vue App            │
│  ┌───────────────┐  │
│  │ WebSocket      │──┼── ws://server/ws  (chat messages)
│  │ Composable     │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ SSE            │──┼── GET /api/analysis/stream  (analysis results)
│  │ Composable     │  │
│  └───────────────┘  │
└─────────────────────┘
```

- WebSocket reconnects with exponential backoff
- SSE reconnects automatically
- Both update Pinia stores, which trigger reactive UI updates
