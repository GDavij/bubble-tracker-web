# Component Spec: Sidebar

## Overview

Persistent left-side navigation for the authenticated `AppLayout`. Provides access to all main sections and shows contextual badges.

## Layout

```
┌──────────────────────┐
│  ◉ BubbleTracker     │  ← Logo + brand (click → /dashboard)
│  v1.0.0              │
├──────────────────────┤
│                      │
│  Navigation          │
│                      │
│  📊 Dashboard        │  ← Active state: highlighted bg
│  🕸️  Social Graph    │
│  👥 People           │
│  🔗 Relationships    │
│  ✍️  Analyze         │
│  💬 Chat             │
│  📈 Timeline         │
│  🔍 Memories         │
│  📋 Analytics        │
│    ▸ Roles           │  ← Nested sub-items (collapsible)
│    ▸ Profiles        │
│    ▸ Snapshot        │
│                      │
├──────────────────────┤
│                      │
│  ⚙️ Settings         │  ← Bottom section
│                      │
├──────────────────────┤
│                      │
│  👤 My Name          │  ← User section at bottom
│     user@email.com   │
│  [Sign Out]          │
│                      │
└──────────────────────┘
```

## Dimensions

| State | Width |
|-------|-------|
| Expanded | 240px |
| Collapsed | 64px (icons only) |
| Mobile (drawer) | Overlay, 280px |

## Navigation Items

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| 📊 | Dashboard | `/dashboard` | — |
| 🕸️ | Social Graph | `/graph` | — |
| 👥 | People | `/people` | Count (from store) |
| 🔗 | Relationships | `/relationships` | Count |
| ✍️ | Analyze | `/analyze` | Pending jobs |
| 💬 | Chat | `/chat` | Unread count |
| 📈 | Timeline | `/timeline` | New states |
| 🔍 | Memories | `/memories` | — |
| 📋 | Analytics | `/analytics` | — |
| ⚙️ | Settings | `/settings` | — |

### Analytics Sub-items

Collapsible accordion within the sidebar:

```
▾ 📋 Analytics         ← Click toggles expand
     Roles             → /analytics/roles
     Profiles          → /analytics/profiles
     Snapshot          → /analytics/snapshot
```

## Behavior

### Active State
- Current route highlighted with accent color background
- If sub-route active, parent item shows expanded + highlighted

### Collapse Mode
- Toggle button at bottom of sidebar (or hamburger in top bar on mobile)
- Collapsed: icons only, labels hidden, expand on hover
- CSS transition: width 240px ↔ 64px

### Mobile (viewports < 768px)
- Sidebar hidden by default
- Hamburger button in top bar opens overlay drawer
- Click outside or navigate closes drawer

### Badges
- People count, pending jobs, unread messages — reactive from Pinia stores
- Polled or updated via WebSocket/SSE

## Pinia Store: `ui.ts`

```typescript
interface UIState {
  sidebarExpanded: boolean
  sidebarOpen: boolean        // mobile drawer
  activeRoute: string
}
```

## States

| State | UI |
|-------|-----|
| Expanded (desktop) | Full sidebar, 240px |
| Collapsed (desktop) | Icons only, 64px, expand on hover |
| Mobile drawer | Overlay from left, backdrop dims content |
| Loading | Skeleton nav items (gray rectangles) |
