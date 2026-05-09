# Screen Spec: Analytics

## Routes

- `/analytics` — Analytics hub / Graph Snapshot
- `/analytics/roles` — Role Classifications
- `/analytics/profiles` — Aggregated Profiles

## 10a. Analytics Hub `/analytics`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Analytics                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Graph Snapshot ───────────────────────────────────────┐ │
│ │                                                           │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│ │ │ 25       │ │ 45       │ │ 0.72     │ │ PersonA ↔    │ │ │
│ │ │ People   │ │ Rels     │ │ Avg Recip│ │   PersonB    │ │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│ │                                                           │ │
│ │ Network Density: ████████░░░ 0.34                         │ │
│ │ Avg Clustering:  ██████████░ 0.52                         │ │
│ │ Bridge Count:    3                                        │ │
│ │ Community Count: 4                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Quick Links ──────────────────────────────────────────┐ │
│ │  [Role Classifications →]  [Aggregated Profiles →]      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Analytics Panels (2-col grid) ────────────────────────┐ │
│ │ ┌───────────────────┐  ┌───────────────────────────────┐ │ │
│ │ │ Role Distribution  │  │ Top Connections               │ │ │
│ │ │ (pie/donut chart)  │  │ (horizontal bar chart)        │ │ │
│ │ │                   │  │                                │ │ │
│ │ │ 🟡 Bridge   5     │  │ PersonA-PersonB  0.85 ██████  │ │ │
│ │ │ 🔵 Mentor   3     │  │ PersonC-PersonA  0.72 █████   │ │ │
│ │ │ 🟢 Anchor   8     │  │ PersonB-PersonD  0.68 █████   │ │ │
│ │ │ 🟠 Catalyst 2     │  │                                │ │ │
│ │ │ ⚪ Observer 4     │  └───────────────────────────────┘ │ │
│ │ │ 🔴 Drain    3     │                                     │ │
│ │ └───────────────────┘                                     │ │
│ │                                                           │ │
│ │ ┌───────────────────┐  ┌───────────────────────────────┐ │ │
│ │ │ Quality Breakdown  │  │ Protocol Distribution        │ │ │
│ │ │ (bar chart)        │  │ (pie chart)                  │ │ │
│ │ └───────────────────┘  └───────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
```

### Data Source

`GET /api/analysis/graph/snapshot`

```typescript
interface GraphSnapshot {
  total_people: number
  total_relationships: number
  avg_reciprocity: number
  bridge_count: number
  strongest_connection: string
  // Additional computed stats
  network_density?: number
  avg_clustering?: number
  community_count?: number
}
```

---

## 10b. Role Classifications `/analytics/roles`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Role Classifications                                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Role Distribution:                                            │
│                                                               │
│ ┌─── View: Grid ──────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│ │ │ 🟡 Bridge    │ │ 🔵 Mentor    │ │ 🟢 Anchor    │         │ │
│ │ │ PersonA 85%  │ │ PersonE 72% │ │ PersonC 78% │         │ │
│ │ │ PersonF 80%  │ │ PersonG 65% │ │ PersonD 74% │         │ │
│ │ │ PersonH 76%  │ │             │ │ PersonI 70% │         │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│ │ │ 🟠 Catalyst  │ │ ⚪ Observer  │ │ 🔴 Drain     │         │ │
│ │ │ PersonJ 68%  │ │ PersonK 80% │ │ PersonL 65% │         │ │
│ │ │             │ │ PersonM 72% │ │             │         │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Person Detail (clicked PersonA) ───────────────────────┐ │
│ │                                                           │ │
│ │ PersonA  Role Scores:                                     │ │
│ │ Bridge    ████████████████░░░ 0.85                        │ │
│ │ Anchor    ████████████░░░░░░░ 0.60                        │ │
│ │ Mentor    ██████░░░░░░░░░░░░░ 0.30                        │ │
│ │ Observer  ██░░░░░░░░░░░░░░░░░ 0.10                        │ │
│ │ Catalyst  ██░░░░░░░░░░░░░░░░░ 0.05                        │ │
│ │ Drain     █░░░░░░░░░░░░░░░░░░ 0.02                        │ │
│ │ Confidence: 85%                                           │ │
│ │                                                           │ │
│ │ [View Full Profile →]                                     │ │
│ └──────────────────────────────────────────────────────────┘ │
```

### Data Source

`GET /api/analysis/roles` → Map of `person_id → { primary_role, confidence, scores }`

### Alternate Views

- **Grid** (default): People grouped by primary role
- **List**: Table with sortable columns (Person, Role, Confidence)
- **Chart**: Pie/donut chart of role distribution

---

## 10c. Aggregated Profiles `/analytics/profiles`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Aggregated Profiles                           [↓ Sort By]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Rankings ─────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Ranking of all people by overall influence/significance   │ │
│ │                                                           │ │
│ │ #1  ◉ PersonA   🟡 Bridge    Pctl: 90  📈 Strengthening │ │
│ │     Strong bridge between social groups...               │ │
│ │                                                           │ │
│ │ #2  ◉ PersonC   🟢 Anchor    Pctl: 85  📈 Strengthening │ │
│ │     Central stabilizing presence in network...           │ │
│ │                                                           │ │
│ │ #3  ◉ PersonB   🔵 Mentor    Pctl: 78  📊 Stable        │ │
│ │     Key influence on multiple people...                  │ │
│ │                                                           │ │
│ │ #4  ◉ PersonD   🟠 Catalyst  Pctl: 70  📉 Declining     │ │
│ │     Change driver with decreasing engagement...          │ │
│ │ ...                                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
```

### Data Source

`GET /api/analysis/profiles` → Map of `person_id → { rank, percentile, trend, stability, summary }`

### Rankings

Each profile card shows:
- Rank number + avatar
- Person name + role badge
- Percentile bar (0-100)
- Trend direction indicator (📈 strengthening, 📊 stable, 📉 declining)
- Stability indicator
- Summary text (first ~100 chars)

### Sort Options

- By Rank (default)
- By Percentile (descending)
- By Trend (strengthening first)
- By Stability

## States (all analytics screens)

| State | UI |
|-------|-----|
| Loading | Skeleton charts + cards |
| Empty | "Not enough data. Track 5+ people to see analytics." |
| Error | Retry button per panel |
| Data | Full analytics as designed |
