# BubbleTracker Web

Vue 3 frontend for the BubbleTracker social dynamics analysis platform. Visualizes social graphs, relationships, emotional timelines, and AI-powered interaction analysis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict) |
| Build | Vite 8 |
| Routing | Vue Router 5 |
| State | Pinia (setup stores) |
| Graph Viz | D3.js (d3-force) |
| Charts | Chart.js + vue-chartjs |
| HTTP | Axios (JWT refresh interceptor) |
| Styling | Tailwind CSS 4 |
| Tests | Vitest (unit) + Playwright (e2e) |

## Prerequisites

- Node.js >= 20.19.0 or >= 22.12.0
- npm

## Setup

```bash
# Install dependencies
npm install

# Copy env template and configure
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL to your backend URL
```

## Development

```bash
# Start dev server (hot reload)
npm run dev

# Type-check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Unit tests (Vitest)
npm run test:unit

# E2E tests (Playwright) — requires backend running
npm run test:e2e
```

## Project Structure

```
src/
├── types/            # TypeScript interfaces (domain, graph, auth)
├── services/         # Axios API client + service modules
├── stores/           # Pinia stores (auth, graph, people, chat, etc.)
├── composables/      # useWebSocket, useSSE
├── utils/            # Constants, formatters
├── components/
│   ├── ui/           # BaseButton, BaseCard, BaseModal, Toast, etc.
│   ├── layout/       # AppLayout, AuthLayout, Sidebar, TopBar
│   ├── graph/        # ForceGraph, MiniGraph (D3)
│   ├── charts/       # RadarChart, TimelineChart, RoleScoresChart, etc.
│   ├── people/       # PersonAvatar, RoleBadge, MoodIndicator
│   ├── relationships/# RelationshipBadge, StrengthBar, etc.
│   ├── analysis/     # MetricCard, AnalysisJobCard, etc.
│   ├── chat/         # ChatBubble
│   └── memories/     # MemoryResultCard
├── views/            # 16 page views (auth, dashboard, graph, etc.)
├── router/           # Vue Router with auth guard
├── assets/styles/    # Tailwind CSS + theme
└── __tests__/        # Vitest unit tests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API URL |
| `VITE_WS_URL` | `ws://localhost:8080/ws` | WebSocket URL for chat |

The `.env` file is gitignored — use `.env.example` as a template.

## Features

- **Auth**: Login/register with JWT (access + refresh tokens)
- **Social Graph**: Interactive D3 force-directed visualization
- **People**: List, search, filter, detail views with role/mood/energy indicators
- **Relationships**: Browse, filter, health scores, quality dimensions
- **Analysis**: Submit interaction text, view analysis jobs and results
- **Chat**: Real-time WebSocket chat with LLM agent
- **Emotional Timeline**: Chronological view of mood/energy/valence with filters
- **Memories**: Semantic search via vector embeddings
- **Analytics**: Role classifications, aggregated profiles, graph snapshots

## Backend API

Requires [bubble-track-server](https://github.com/GDavij/bubble-track-server) running with:
- PostgreSQL 16+
- Qdrant vector database
- Redis Stack (queue + pub/sub)
- Gemini Vertex AI or Ollama/LM Studio for LLM + embeddings
