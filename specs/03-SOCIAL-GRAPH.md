# Screen Spec: Social Graph

## Route: `/graph`

## Overview

The social graph is the **central visual metaphor** of BubbleTracker. A force-directed graph showing the user's social network: nodes = people, edges = relationships.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                          [Filters] [Legend] [Fullscreen] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│     ┌─── PersonA ───┐                                        │
│    ╱                  ╲                                       │
│ PersonC               PersonB ─── PersonD                   │
│    ╲                  ╱          │                           │
│     ──── PersonE ────┘           │                           │
│            │                     │                           │
│         PersonF              PersonG                        │
│                                                              │
│  [Tooltip on hover: PersonA | Role: Bridge | Energy: 0.8]   │
│                                                              │
│  Zoom: 85%   │  Drag to pan  │  Scroll to zoom              │
└─────────────────────────────────────────────────────────────┘
```

## Data Source

`GET /api/graph` — returns `{ nodes, edges, stats }`

Nodes have: `id`, `display_name`, `social_role`, `current_mood`, `current_energy`
Edges have: `source`, `target`, `quality`, `strength`, `reciprocity_index`, `protocol`

For the expanded view, `GET /api/graph/full` adds metrics, roles, and profiles.

## Graph Behavior

### Physics (d3-force)

| Force | Parameter | Effect |
|-------|-----------|--------|
| `forceLink` | distance=120, strength=weight | Edges pull connected nodes together |
| `forceManyBody` | strength=-200 | Nodes repel each other |
| `forceCenter` | (w/2, h/2) | Centering force |
| `forceCollide` | radius=25 | Prevents node overlap |

### Interactions

| Action | Result |
|--------|--------|
| Hover node | Highlight node + connected edges (dim non-connected) |
| Hover edge | Highlight edge, show tooltip with quality/strength |
| Click node | Open person detail panel (slide-in) |
| Double-click node | Navigate to `/people/:id` |
| Drag node | Reposition (pinned temporarily, released after 1s) |
| Scroll | Zoom in/out |
| Click-drag background | Pan |
| Right-click node | Context menu: View Details, Classify Role, View Metrics |

### Visual Encoding

**Node size:** proportional to interaction_count (radius 15–40px)

**Node color:** `social_role`

| Role | Color |
|------|-------|
| Bridge | Amber (#f59e0b) |
| Mentor | Blue (#3b82f6) |
| Anchor | Emerald (#10b981) |
| Catalyst | Orange (#f97316) |
| Observer | Slate (#94a3b8) |
| Drain | Red (#ef4444) |
| Unknown | Gray (#6b7280) |

**Node border:** 3px ring colored by `current_mood`

**Edge color:** `quality`
| Quality | Color | Stroke |
|---------|-------|--------|
| Nourishing | Green (#22c55e) | Solid, 2px |
| Neutral | Gray (#9ca3af) | Solid, 1px |
| Draining | Red (#ef4444) | Dashed, 2px |
| Conflicted | Yellow (#eab308) | Dotted, 2px |
| Unknown | Gray dim | Solid, 0.5px |

**Edge thickness:** proportional to `strength` (1–5px)

**Edge label:** on hover — shows `protocol` badge + `strength` value

## Filter Panel (Right Drawer)

```
┌─────────────────────┐
│ Filters              │
│                      │
│ Search: [type name]  │
│                      │
│ Role:                │
│ ☑ Bridge   ☑ Mentor  │
│ ☑ Anchor   ☐ Catalyst│
│ ☑ Observer ☐ Drain   │
│                      │
│ Quality:             │
│ ☑ Nourishing ☑ Neutral│
│ ☑ Draining   ☐ Conflic│
│                      │
│ Energy: [======o===] │
│ min: 0.2  max: 1.0   │
│                      │
│ Layout:              │
│ ○ Force-directed     │
│ ○ Circular           │
│ ○ Radial             │
│                      │
│ [Reset] [Apply]      │
└─────────────────────┘
```

## Node Detail Panel (Slide-in from Right)

Opens on click, 400px width.

```
┌──────────────────────────┐
│ PersonA            [X]  │
│──────────────             │
│ Role: Bridge    Confidence: 85% │
│ Mood: 😊 Happy            │
│ Energy: ████████░░ 0.8    │
│                        │
│ Metrics                  │
│ Degree: 5    Betweenness: 0.3│
│ PageRank: 0.15  Clustering: 0.6│
│ Health: 0.75              │
│                        │
│ Relationships            │
│ ┌─ PersonB ─── 0.85 ──┐ │
│ │   Nourishing · Deep  │ │
│ └──────────────────────┘ │
│ ┌─ PersonC ─── 0.60 ──┐ │
│ │   Neutral · Casual   │ │
│ └──────────────────────┘ │
│                        │
│ [View Full Profile →]  │
│ [Classify Role]         │
└──────────────────────────┘
```

## Full Graph Data (via `GET /api/graph/full`)

The full graph endpoint returns everything in one call. The panel should show:

- **Roles** tab: Each node's `primary_role` + `confidence`
- **Profiles** tab: rank, percentile, trend, stability, summary
- **Timeline** tab: emotional state data per person
- **Metrics** tab: All discipline metrics per node

## Legend (Bottom-right floating)

```
● Node size = interaction frequency
● Node color = social role
● Border color = current mood
── Edge color = relationship quality
── Edge thickness = strength
```

## States

| State | UI |
|-------|-----|
| Loading | Full-screen spinner over graph area |
| Empty | "No graph data. Submit interactions to build your graph." + "Analyze Now" CTA |
| Error | "Failed to load graph" + Retry button |
| < 3 nodes | Message: "Build more connections. You need at least 3 people to see meaningful patterns." |
| Data | Interactive graph as specified |

## Pinia Store: `graph.ts`

```typescript
interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: GraphStats | null
  fullData: FullGraphData | null
  selectedNode: GraphNode | null
  filters: {
    search: string
    roles: string[]
    qualities: string[]
    energyRange: [number, number]
  }
  layout: 'force' | 'circular' | 'radial'
  isLoading: boolean
}
```

## API Dependencies

- `GET /api/graph` — core graph data
- `GET /api/graph/full` — expanded data (on demand, when panel opens)
- `POST /api/people/:id/classify` — re-classify role (from context menu)
