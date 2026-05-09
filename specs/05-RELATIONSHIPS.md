# Screen Specs: Relationships

## 5a. Relationships List `/relationships`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Relationships                                     [Filter ▼] │
│                                                               │
│ ┌──[Search people...]───┐  [All Qualities ▼]  [↓ Sort by]  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ PersonA ↔ PersonB     0.85  🟢 Nourishing  Deep        ││
│ │   Last updated: 3 days ago                               ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ PersonA ↔ PersonC     0.50  ⚪ Neutral     Casual       ││
│ │   Last updated: 1 week ago                               ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ PersonA ↔ PersonD     0.30  🔴 Draining    Professional││
│ │   Reciprocity: 0.45 (imbalanced)                        ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 5 of 15                                   [1] [2]   │
└──────────────────────────────────────────────────────────────┘
```

### Relationship Card

- `source ↔ target` names (click name → person detail)
- Strength bar (colored, 0–1)
- Quality badge (colored dot + text)
- Protocol badge (Deep/Casual/Professional/Digital/Mixed)
- Reciprocity warning if imbalanced (< 0.3 or > 0.7)

### Data Source

`GET /api/relationships`

---

## 5b. Relationship Health `/relationships/:id`

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Relationships                          PersonA ↔ PersonB│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Relationship Health ──────────────────────────────────┐ │
│ │                                                           │ │
│ │  Quality: 🟢 Nourishing                                   │ │
│ │  Strength: ████████████████░░░ 0.85                        │ │
│ │  Reciprocity: ██████████████░░░░ 0.75                     │ │
│ │  Protocol: Deep                                            │ │
│ │                                                           │ │
│ │  Source (PersonA) → weight: 0.9   Target (PersonB) → 0.8 │ │
│ │                                                           │ │
│ │  6-Dimension Health Scores:                               │ │
│ │  ┌─────────────────────────────────────────────────────┐ │ │
│ │  │ Communication  ████████████████░░░  0.82            │ │ │
│ │  │ Trust          ██████████████░░░░  0.70            │ │ │
│ │  │ Support        █████████████████░░ 0.78            │ │ │
│ │  │ Compatibility  ███████████████░░░░ 0.74            │ │ │
│ │  │ Growth         ██████████████████░ 0.90            │ │ │
│ │  │ Resilience     █████████████████░░ 0.85            │ │ │
│ │  └─────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Interaction History ──────────────────────────────────┐ │
│ │ "Met PersonB for lunch..."                         2d ago│ │
│ │ "PersonB helped with project..."                   5d ago│ │
│ │ "Had a disagreement with PersonB..."               2w ago│ │
│ └──────────────────────────────────────────────────────────┘ │
```

### Data Source

`GET /api/relationships/:id/health`

### 6-Dimension Health Visualization

Horizontal bar chart, each bar colored by score:
- 0–0.3: Red
- 0.3–0.7: Yellow
- 0.7–1.0: Green

### States

| State | UI |
|-------|-----|
| Loading | Skeleton bars |
| Not found | "Relationship not found" + back |
| Error | Toast + retry |
| Data | Full layout |
