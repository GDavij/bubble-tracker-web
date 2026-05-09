# Component Spec: Shared Component Library

## UI Primitives

All base UI components in `src/components/ui/`.

### `BaseButton`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' | 'secondary' | 'ghost' | 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' | 'md' | 'lg'` | `'md'` | Size |
| `loading` | `boolean` | `false` | Shows spinner, disables |
| `disabled` | `boolean` | `false` | Disabled state |
| `icon` | `string` | — | Lucide icon name |
| `iconPosition` | `'left' | 'right'` | `'left'` | Icon placement |

### `BaseCard`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `'none' | 'sm' | 'md' | 'lg'` | `'md'` | Padding around content |
| `hoverable` | `boolean` | `false` | Lift on hover effect |
| `clickable` | `boolean` | `false` | Cursor pointer + click handler |

### `BaseBadge`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `See colors below` | `'default'` | Color variant |
| `size` | `'sm' | 'md'` | `'sm'` | Size |

Color variants map to role/quality/mood colors from spec.

### `BaseModal`

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | `false` |
| `title` | `string` | — |
| `size` | `'sm' | 'md' | 'lg' | 'xl' | 'full'` | `'md'` |

Sections: header (with close), body (scrollable), footer (actions).

### `BaseToast`

| Prop | Type | Default |
|------|------|---------|
| `type` | `'success' | 'error' | 'warning' | 'info'` | `'info'` |
| `message` | `string` | required |
| `duration` | `number` | `4000` | Auto-dismiss ms |
| `action` | `{ label, onClick }` | — | Optional action button |

Positioned fixed bottom-right, stacked vertically.

### `BaseTooltip`

| Prop | Type | Default |
|------|------|---------|
| `text` | `string` | required |
| `position` | `'top' | 'bottom' | 'left' | 'right'` | `'top'` |
| `delay` | `number` | `200` | Show delay in ms |

### `BaseSkeleton`

Placeholder loading animation.

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'text' | 'circular' | 'rectangular'` | `'text'` |
| `width` | `string` | `'100%'` |
| `height` | `string` | — |

### `ProgressBar`

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | required | 0–100 |
| `color` | `string` | `'primary'` | Tailwind color |
| `height` | `string` | `'8px'` |
| `showLabel` | `boolean` | `false` |

### `EmptyState`

| Prop | Type | Default |
|------|------|---------|
| `icon` | `string` | — | Lucide icon |
| `title` | `string` | required |
| `description` | `string` | — |
| `action` | `{ label, onClick }` | — | CTA button |

### `ErrorState`

| Prop | Type | Default |
|------|------|---------|
| `message` | `string` | `'Something went wrong'` |
| `retry` | `() => void` | — | Retry callback |

### `StatCard`

| Prop | Type | Source |
|------|------|--------|
| `icon` | `string` | Lucide icon name |
| `label` | `string` | Metric name |
| `value` | `string / number` | Current value |
| `change` | `{ value, direction }` | Optional trend |

### `TabBar`

| Prop | Type |
|------|------|
| `tabs` | `{ id: string; label: string; count?: number }[]` |
| `activeTab` | `string` |
| `@change` | `(tabId: string) => void` |

## Domain-Specific Components

### `PersonAvatar`

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Person's display name |
| `role` | `SocialRole` | Colors the avatar |
| `mood` | `Mood` | Optional mood indicator |
| `size` | `'sm' | 'md' | 'lg' | 'xl'` | Size |

Renders: First letter as avatar, colored by role, optional mood dot overlay.

### `RelationshipBadge`

| Prop | Type |
|------|------|
| `quality` | `Quality` |
| `strength` | `number` |

Renders: Colored dot + quality label + optional strength bar.

### `RoleBadge`

| Prop | Type |
|------|------|
| `role` | `SocialRole` |
| `confidence` | `number` (optional) |

Renders: Role name with role color, optional confidence % in tooltip.

### `MoodIndicator`

| Prop | Type |
|------|------|
| `mood` | `Mood` |

Renders: Mood emoji + colored background circle.

### `EnergyBar`

| Prop | Type |
|------|------|
| `value` | `number` (0–1) |
| `showValue` | `boolean` |

Renders: Colored horizontal bar (green > 0.6, yellow > 0.3, red < 0.3).

### `MetricCard`

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Metric name |
| `value` | `string / number` | Metric value |
| `unit` | `string` | Optional unit (%) |
| `icon` | `string` | Optional icon |
| `trend` | `'up' | 'down' | 'stable'` | Optional trend arrow |

### `RoleScoresChart`

Horizontal stacked bar chart showing all 6 role scores for a person. Each bar segment colored by role.

Props: `scores: Record<SocialRole, number>`

### `DisciplineMetricsPanel`

Expandable panel showing all 10+ discipline metrics for a person. Each discipline is a collapsible section showing its key metrics.

Props: `metrics: NodeMetrics`

### `RadarChart`

Radar/spider chart for centrality scores.

Props: `scores: CentralityScores`

### `ForceGraph`

D3-based force-directed graph component. Encapsulates all simulation logic.

Props:
- `nodes: GraphNode[]`
- `edges: GraphEdge[]`
- `width: number`
- `height: number`
- `selectedNodeId?: string`
- `@nodeClick: (node) => void`
- `@nodeHover: (node) => void`

### `MiniGraph`

Smaller version of ForceGraph for dashboard preview (250×200). Same props, read-only (no click).

### `EmotionalSparkline`

Mini line chart for emotional timeline preview. Props: `data: TimelinePoint[]`, `metric: 'energy' | 'valence'`

### `TimelineChart`

Full-size interactive timeline chart with brush zoom. Props: `states: PersonState[]`, `metric: 'energy' | 'valence' | 'mood'`

### `StrengthBar`

Horizontal bar representing relationship strength. Color-mapped (green > 0.6, yellow > 0.3, red < 0.3).

Props: `value: number`

### `HealthDimensionBar`

Individual dimension bar for the 6-dimension relationship health view.

Props: `label: string`, `value: number`

### `MetricHistoryChart`

Line chart showing a single metric over time. Can overlay multiple people.

Props: `data: MetricPoint[]`, `metricName: string`, `personName?: string`

### `AnalysisJobCard`

Card for the analysis history list.

Props: `job: AnalysisJob`, `@view: (job) => void`, `@retry: (job) => void`

### `MemoryResultCard`

Card for semantic search results.

Props: `result: MemoryResult`, `query: string`

### `ChatBubble`

Single message bubble in the chat view.

Props: `message: ChatMessage`, `@personClick: (name) => void`
