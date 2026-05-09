# Screen Spec: Analysis

## Route: `/analyze`

## Overview

Submit free-text interaction descriptions for multi-disciplinary analysis. This is the primary data input screen.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Analyze Interactions                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Input ────────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ Describe a social interaction:                            │ │
│ │                                                           │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ "Met PersonA for lunch today at that new place.      │ │ │
│ │ │  PersonB joined us unexpectedly. PersonB and I       │ │ │
│ │ │  have been distant lately, but things felt okay.     │ │ │
│ │ │  PersonA seemed stressed about work..."              │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │  [Analyze]  [Clear]   📎 Upload text file    256/10000   │ │
│ │                                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Recent Analyses ────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ ┌─────── Job #uuid-xxxx ──────── Status ── Time ────────┐ │ │
│ │ │ "Met PersonA for lunch..."                 ✅ Done   2m │ │ │
│ │ │ People: PersonA, PersonB, PersonC                      │ │ │
│ │ │ Relationships: 3 found                                 │ │ │
│ │ │ [View Results →]                                       │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ "Had coffee with..."                       🔄 Process  │ │ │
│ │ │ Enqueued 30s ago...                                    │ │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ "Big argument at..."                        ❌ Failed    │ │ │
│ │ │ Error: Analysis could not complete. [Retry]            │ │ │
│ │ └─────────────────────────────────────────────────────────┤ │ │
│ │                                                             │ │
│ │ [Load More...]                                              │ │
│ └───────────────────────────────────────────────────────────┘ │
```

## Interaction Input

### Text Area
- Auto-expanding textarea
- Character counter: `{current}/{max}` where max = 10000
- Paste support for large text blocks

### Submit Flow
1. User types/pastes text (min 1 char)
2. Click "Analyze" → `POST /api/analyze` with `{ text }`
3. Response (202): `{ interaction_id, job_id, status: "pending" }`
4. Job appears in Recent Analyses with `⏳ Pending` status
5. SSE updates: status transitions `pending → processing → completed`
6. On `completed`: analysis result auto-loads, people appear in graph

### Validation
- Empty text → disabled button + "Enter interaction text" hint
- Over 10000 chars → counter turns red + "Max 10000 characters" warning
- Network error → toast + retry option

## Real-time Status Updates (SSE)

Connect to `GET /api/analysis/stream` on mount.

```typescript
const eventSource = new EventSource(`${API_URL}/api/analysis/stream`)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // data: { interaction_id, status, people_extracted, summary, ... }
  updateJobStatus(data)
}
```

Status badges:
| Status | Visual | Notes |
|--------|--------|-------|
| `pending` | ⏳ Gray, pulsing | In queue |
| `processing` | 🔄 Blue, spinning | Agent running |
| `completed` | ✅ Green | Done, results available |
| `failed` | ❌ Red | Error occurred |

## Analysis Result Display (expandable)

When a job completes, show:

```
┌─── Analysis Results ────────────────────────────────────────┐
│                                                              │
│ People Extracted:                                            │
│   ◉ PersonA (Bridge)   ◉ PersonB (Anchor)   ◉ PersonC      │
│                                                              │
│ Relationships Found:                                         │
│   PersonA ↔ PersonB: Friend (strength: 0.85, nourishing)    │
│   PersonB ↔ PersonC: Colleague (strength: 0.50, neutral)   │
│                                                              │
│ Summary: "Lunch meeting with friends. PersonA was stressed  │
│ about work, PersonB joined unexpectedly..."                 │
│                                                              │
│ [View in Graph →]  [View PersonA →]  [View PersonB →]      │
└──────────────────────────────────────────────────────────────┘
```

## States

| State | UI |
|-------|-----|
| Empty/initial | Clean textarea, "No analyses yet" for history |
| Typing | Live char counter, button enables when text present |
| Submitting | Button shows spinner + "Analyzing...", disabled |
| Job pending | Job row shows ⏳ status |
| Processing | Job row shows 🔄 spinning indicator |
| Completed | Job row shows ✅, results expandable |
| Failed | Job row shows ❌, retry button |
| SSE disconnected | Small banner: "Live updates disconnected. Page refresh to reconnect." |

## Data Sources

- `POST /api/analyze` — submit interaction
- `GET /api/analysis/stream` — SSE for status updates
- `POST /api/chat` — send to chat instead (submits same text)

## Pinia Store: `analysis.ts`

```typescript
interface AnalysisState {
  jobs: AnalysisJob[]     // with status, result
  currentText: string
  isSubmitting: boolean
  sseConnected: boolean
}

interface AnalysisJob {
  interactionId: string
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  text: string
  result?: AnalysisResult
  createdAt: Date
}
```
