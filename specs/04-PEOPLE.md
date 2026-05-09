# Screen Specs: People

## 4a. People Directory `/people`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ People                                              [+ New] │
│                                                     (analyze)│
│ ┌──[Search names...]───┐  [All Roles ▼]  [All Moods ▼]    │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ◉ PersonA        Bridge     😊 Happy     0.85  ⚡ 0.8   ││
│ │   Last interaction: 2 days ago                          ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ◉ PersonB        Anchor     😌 Calm       0.72  ⚡ 0.6 ││
│ │   Last interaction: 5 days ago                          ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ◉ PersonC        Observer   😴 Tired      0.45  ⚡ 0.3 ││
│ │   Last interaction: 1 week ago                          ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 10 of 24 people                         [1] [2] [3]│
└──────────────────────────────────────────────────────────────┘
```

### Components

**Person Card (list item):**
- Avatar circle (first letter of name) — colored by social role
- Name + role badge
- Mood emoji + text
- Relationship health score (colored bar)
- Energy level (lightning icon + bar)
- "Last interaction" relative time
- Click → navigate to `/people/:id`

**Filters:**
- Search by name (client-side filter)
- Role dropdown: All, Bridge, Mentor, Anchor, Catalyst, Observer, Drain
- Mood dropdown: All, Happy, Anxious, Tired, etc.

**Empty state:** "No people tracked yet. Submit interactions to discover people in your network."

### Data Source

`GET /api/people` — returns array of GraphNode objects

---

## 4b. Person Detail `/people/:id`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to People                           PersonA        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Profile ────────────────────────────────────────────┐  │
│ │                                                        │  │
│ │  ◉ PersonA          Role: Bridge   Confidence: 85%     │  │
│ │  Mood: 😊 Happy    Energy: ████████░░ 0.8              │  │
│ │  Aliases: "P", "Big A"   Notes: "College friend"      │  │
│ │                                                        │  │
│ │  [Re-classify Role]  [Edit Notes]                      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Tab: Metrics ──────────────────────────────────────────┐ │
│ │                                                          │ │
│ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │ │
│ │ │ 0.5    │ │ 0.3    │ │ 0.7    │ │ 0.75   │            │ │
│ │ │ Degree │ │ Between│ │ Closen │ │ Health │            │ │
│ │ └────────┘ └────────┘ └────────┘ └────────┘            │ │
│ │                                                          │ │
│ │ Centrality Scores (radar chart):                         │ │
│ │                    Degree                                │ │
│ │                   ╱    ╲                                 │ │
│ │         Between  │  ╱╲  │  Closeness                    │ │
│ │                   ╲╱  ╲╱                                │ │
│ │                   PageRank                               │ │
│ │                                                          │ │
│ │ All 10+ discipline metrics:                             │ │
│ │ Psychology  │ Sociology  │ Philosophy  │ Mathematics    │ │
│ │ Physics     │ Geography  │ Anthropology│ Economics     │ │
│ │ Neuroscience│ Communication│ History                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─ Tab: Roles ────────────────────────────────────────────┐ │
│ │ Role Scores:                                             │ │
│ │ Bridge    ████████████░░░░░ 85%                          │ │
│ │ Anchor    █████████░░░░░░░░ 60%                          │ │
│ │ Mentor    ████░░░░░░░░░░░░░ 30%                          │ │
│ │ ...                                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─ Tab: Relationships ────────────────────────────────────┐ │
│ │ With          Quality      Strength  Protocol           │ │
│ │ PersonB       🟢 Nourishing  0.85    Deep              │ │
│ │ PersonC       ⚪ Neutral     0.50    Casual            │ │
│ │ PersonD       🔴 Draining    0.30    Professional      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─ Tab: Timeline ─────────────────────────────────────────┐ │
│ │ Emotional History (line chart):                          │ │
│ │ Energy ╱╲___╱╲___╱╲___╱╲                               │ │
│ │ Valence ╲╱‾‾‾╲╱‾‾‾╲╱‾‾‾╲╱                              │ │
│ │                                                          │ │
│ │ Date    Mood      Energy  Context  Trigger              │ │
│ │ Jan 15  Happy     0.8     Gathering Positive interaction│ │
│ │ Jan 10  Anxious   0.4     Work      Deadline stress     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─ Tab: Profile ──────────────────────────────────────────┐ │
│ │ Rank: #2 of 24   Percentile: 85th                       │ │
│ │ Trend: Strengthening   Stability: 0.8                   │ │
│ │ Summary: "Strong bridge between social groups..."       │ │
│ └──────────────────────────────────────────────────────────┘ │
```

### Data Sources

- `GET /api/people/:id` — person detail + metrics + role + profile (single response)
- `GET /api/people/:id/metrics` — full NodeMetrics (when Metrics tab clicked)
- `GET /api/people/:id/history/:metric` — metric history over time (for Timeline tab)

### Tab System

Tab bar with 5 tabs: **Metrics**, **Roles**, **Relationships**, **Timeline**, **Profile**

Each tab fetches its data lazily on first click (not on mount).

### Metrics Tab: Discipline Cards

Each discipline expands to show detailed scores:

| Discipline | Cards |
|-----------|-------|
| Psychology | Attachment style (Secure/Anxious/Avoidant), Social Exchange satisfaction |
| Sociology | Bonding capital, Bridging capital, Dunbar layer |
| Philosophy | Agency, Authenticity, Phronesis |
| Mathematics | Degree, Betweenness, Closeness, PageRank, Clustering |
| Physics | Social entropy, Phase transition risk |
| Geography | Proximity score, Mobility range |
| Anthropology | Gift economy (obligation load, credit/debt balance) |
| Economics | Cooperation rate, Nash equilibrium proximity |
| Neuroscience | Oxytocin proxy, Dopamine proxy |
| Communication | Message entropy, Narrative coherence |
| History | Lock-in index, Path dependency |

### Actions

- **Re-classify Role** → `POST /api/people/:id/classify`
- **Edit Notes** → triggers `PATCH` (if this endpoint is available, else local only)

### States

| State | UI |
|-------|-----|
| Loading | Skeleton: avatar placeholder, pulsing metric cards |
| Not found | "Person not found" + back button |
| Error | "Failed to load person data" + Retry |
| Data | Full detail view as specified |

### Pinia Store: `people.ts`

```typescript
interface PeopleState {
  list: GraphNode[]
  selectedPerson: PersonDetail | null
  selectedPersonMetrics: NodeMetrics | null
  isLoading: boolean
  isLoadingDetail: boolean
  filters: { search: string; role: string; mood: string }
}
```
