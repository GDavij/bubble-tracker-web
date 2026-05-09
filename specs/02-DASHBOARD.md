# Screen Spec: Dashboard

## Screen: Dashboard (`/dashboard`)

**Layout:** `AppLayout` — sidebar + content area

The dashboard is the landing page after login. It provides a high-level summary of the user's social world, recent activity, and quick actions.

```
┌─────────────────────────────────────────────────────────────────┐
│ Top Bar: "Dashboard"                                     [👤]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │  👥 25 People     │ │  🔗 45 Rels      │ │  📊 3.2 Avg Recip│ │
│  │   +3 this week   │ │  +5 this week    │ │                  │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────┐ ┌──────────────────────────┐ │
│  │                                │ │  Role Distribution       │ │
│  │   Mini Social Graph (preview)  │ │  ┌────────────────────┐ │ │
│  │   (clickable → full graph)     │ │  │ 🟡 Bridge    5     │ │ │
│  │                                │ │  │ 🔵 Mentor    3     │ │ │
│  │                                │ │  │ 🟢 Anchor    8     │ │ │
│  │                                │ │  │ 🟠 Catalyst  2     │ │ │
│  │                                │ │  │ ⚪ Observer  4     │ │ │
│  │                                │ │  │ 🔴 Drain     3     │ │ │
│  └───────────────────────────────┘ │  └────────────────────┘ │ │
│                                    └──────────────────────────┘ │
│  ┌───────────────────────────────┐ ┌──────────────────────────┐ │
│  │  Recent Activity Feed          │ │  Quick Analyze           │ │
│  │  ────────────────────────      │ │                          │ │
│  │  📝 "Had lunch with..."        │ │  [Enter interaction...]  │ │
│  │     completed · 2 min ago      │ │                          │ │
│  │  📝 "Coffee with..."           │ │  [    Analyze    ]       │ │
│  │     processing · 5 min ago     │ │                          │ │
│  │  📝 "Met PersonA at..."        │ │  ─── or ───             │ │
│  │     failed · 1 hr ago          │ │  📎 Paste full text     │ │
│  │                                │ │  💬 Open Chat           │ │
│  └───────────────────────────────┘ └──────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Emotional Pulse (last 7 days)                            │   │
│  │  [sparkline chart showing avg energy/valence over time]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sections

### 1. Stats Bar (top row)

Three stat cards showing key metrics from `GET /api/graph` stats:

| Card | Data Source | Display |
|------|-----------|---------|
| People | `stats.total_people` | Number + "this week" delta |
| Relationships | `stats.total_relationships` | Number + "this week" delta |
| Avg Reciprocity | `stats.avg_reciprocity` | Decimal (2 places) + trend arrow |

**API:** `GET /api/graph` → `response.stats`

---

### 2. Mini Social Graph (left)

A small preview of the social graph (force-directed layout, read-only). Shows the last ~20 nodes. Clicking anywhere on it navigates to `/graph`.

**Component:** `MiniGraphPreview.vue`
- Rendered with D3 force simulation (fixed, no dragging)
- Nodes colored by role
- Edges colored by quality
- Click handler → `router.push('/graph')`

**API:** `GET /api/graph` → `response.nodes` + `response.edges`

---

### 3. Role Distribution (right)

Horizontal bar chart showing count of people per social role.

**Component:** `RoleDistributionChart.vue`
- Uses Chart.js horizontal bar
- Colors match role color system
- Clicking a bar → `/analytics/roles` filtered

**API:** `GET /api/analysis/roles` → count by `primary_role`

---

### 4. Recent Activity Feed (bottom left)

List of recent interactions with their processing status.

| Row Element | Data | Source |
|------------|------|--------|
| Text preview | `raw_text` (truncated 50 chars) | `interactions` |
| Status badge | `status` (queued/processing/completed/failed) | `interactions` |
| Time ago | `created_at` | `interactions` |

Status badge colors:
- `queued` → gray
- `processing` → blue (animated pulse)
- `completed` → green
- `failed` → red

Click a row → `/analyze` with interaction details

**Real-time:** SSE updates status badges as analysis progresses.

**API:** No direct endpoint. Data comes from `GET /api/graph/full` timeline or a future dedicated endpoint.

---

### 5. Quick Analyze (bottom right)

A compact interaction submission form.

```
[Enter interaction text...]
[Analyze]
```

- Textarea (auto-expanding, max 10000 chars)
- Submit → `POST /api/analyze` with `{ text }`
- On success → show toast "Analysis started" with job ID
- On error → show inline error
- Links: "Open Chat" → `/chat`

**API:** `POST /api/analyze`

---

### 6. Emotional Pulse (full width)

A sparkline area chart showing average emotional energy and valence over the last 7 days.

**Component:** `EmotionalPulseChart.vue`
- Dual-line chart (energy + valence)
- X-axis: time (7 days)
- Y-axis: -1 to 1 (valence), 0 to 1 (energy)
- Hover tooltip: date + values

**API:** `GET /api/states?limit=50`

---

## Data Loading Strategy

```typescript
// On mount, fetch all dashboard data in parallel
const [graphData, rolesData, statesData] = await Promise.all([
  graphService.getGraph(),
  analysisService.getRoles(),
  statesService.getTimeline(50),
])
```

If any request fails, show that section in an error state with retry button. Other sections remain functional.

---

## Empty States

| Condition | Display |
|-----------|---------|
| No people yet | "Welcome! Start by describing a social interaction" + prominent Quick Analyze |
| No roles classified | "Roles will appear after analysis" |
| No emotional states | "Emotional data will build over time" |
| Graph empty | Illustration + "Your social graph is empty. Submit an interaction to get started." |

---

## Loading States

- Stats cards: skeleton rectangles
- Mini graph: pulsing circle placeholder
- Role chart: skeleton bars
- Activity feed: 3 skeleton rows
- Quick analyze: always interactive (no loading state needed)
- Emotional pulse: skeleton chart
