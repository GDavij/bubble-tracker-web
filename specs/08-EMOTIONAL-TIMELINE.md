# Screen Spec: Emotional Timeline

## Route: `/timeline`

## Overview

Visualize emotional states across all tracked people over time. Shows mood, energy, and valence for both people and self-reflection entries.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Emotional Timeline                      [Self ▼] [Filter ▼] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Timeline Chart ───────────────────────────────────────┐ │
│ │                                                           │ │
│ │  Energy                                                 │ │
│ │  1.0 ┤                                                    │ │
│ │      │      ● PersonA (Happy)                            │ │
│ │  0.8 ┤────●────●────●────────────●────●────             │ │
│ │      │   ●    PersonC   ●    PersonB                     │ │
│ │  0.5 ┤─────────●─────────────●─────────●────            │ │
│ │      │              PersonA (Tired)       ● PersonC     │ │
│ │  0.2 ┤───────────────────────────●───────────────────   │ │
│ │      │                                                    │ │
│ │  0.0 ┼───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───  │ │
│ │      Jan 5  10   15   20   25   Feb 5  10  15   20      │ │
│ │                                                           │ │
│ │  [Brush-selection to zoom]                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Timeline List ─────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Today                                                    │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ PersonA  😊 Happy  ⚡ 0.8  ❤️ 0.6  🏠 Gathering     │ │ │
│ │ │ "Positive interaction with friend"                    │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ Me (self)  🙏 Grateful  ⚡ 0.7  ❤️ 0.5  🧘 Reflection│ │ │
│ │ │ "Felt appreciative of my connections today"           │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ Jan 15                                                   │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ PersonB  😟 Anxious  ⚡ 0.4  ❤️ -0.3  💼 Work        │ │ │
│ │ │ "Deadline stress affecting interaction"               │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ PersonC  😊 Happy  ⚡ 0.9  ❤️ 0.8  🎉 Event         │ │ │
│ │ │ "Great time at the gathering"                         │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
```

## Charts

### Main Chart: Energy Over Time

- Scatter/line chart with dots colored by mood
- Each dot: person name label on hover
- Y-axis: energy (0–1) or valence (-1 to +1)
- Toggle between: Energy, Valence, Mood (categorical)
- Brush-selection to zoom into date range

### Filters

| Filter | Options |
|--------|---------|
| View | All People, Specific Person, Self Only |
| Date Range | 7d, 30d, 90d, All time |
| Person | Multi-select dropdown of all people |
| Mood | Multi-select (Happy, Anxious, etc.) |
| Context | Gathering, Workplace, Home, Event, Online, Reflection |

## Timeline List

Reverse-chronological list of emotional state entries:
- Grouped by date (Today, Yesterday, Jan 15, etc.)
- Each entry: Person name + mood emoji + energy bar + valence indicator + context icon
- Color-coded by mood
- Click → expand to show trigger text and notes
- Click person name → navigate to `/people/:id`

## Self-Reflection States

`GET /api/states/self` — user's own emotional entries (where `person_id` is NULL)

Shown with "Me (self)" label and distinct styling.

## States

| State | UI |
|-------|-----|
| Loading | Skeleton chart + skeleton list items |
| Empty | "No emotional data yet. Track interactions to see emotional patterns." |
| Error | Retry banner |
| Data | Full chart + list |

## Data Sources

- `GET /api/states?limit=100` — all emotional states (people + self)
- `GET /api/states/self?limit=100` — self-reflection states only
- `GET /api/people/:id/history/:metric` — per-person metric history (for trend lines)

## Pinia Store

```typescript
interface TimelineState {
  states: PersonState[]
  selfStates: PersonState[]
  filters: {
    view: 'all' | 'self' | 'person'
    personId: string | null
    dateRange: '7d' | '30d' | '90d' | 'all'
    moods: string[]
    contexts: string[]
  }
  chartMetric: 'energy' | 'valence' | 'mood'
  isLoading: boolean
}
```

## Component: EmotionalStateCard

Reused in both timeline list and person detail timeline tab.

```
┌───────────────────────────────────────────────────────────┐
│ PersonA  😊 Happy                             10:30 AM   │
│ Energy  ████████░░ 0.8    Valence  ❤️❤️❤️❤️❤️❤️░░ 0.6 │
│ Context: 🏠 Gathering    Trigger: "Positive interaction" │
│ Notes: "Felt really connected today"                     │
└───────────────────────────────────────────────────────────┘
```
