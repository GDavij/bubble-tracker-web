# Screen Spec: Memory Search

## Route: `/memories`

## Overview

Semantic search across all past interactions using RAG (Retrieval-Augmented Generation). Find relevant past interactions by meaning, not just keywords.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Memory Search                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Search ───────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ 🔍 [Search past interactions...]                    [🔎] │ │
│ │                                                           │ │
│ │ Filters:                                                  │ │
│ │   Person: [All ▼]  Session: [All ▼]  Segment: [All ▼]   │ │
│ │                                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Results ──────────────────────────────────────────────┐ │
│ │                                                           │ │
│ │ 5 results for "relationship with PersonA" (0.45s)        │ │
│ │                                                           │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ 📝 89% match                                          │ │
│ │ │ "Met PersonA for lunch today at that new place.       │ │
│ │ │  PersonB joined us unexpectedly..."                   │ │
│ │ │                                                        │ │
│ │ │ 👤 PersonA, PersonB   📅 Jan 15, 2025                 │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ 📝 72% match                                          │ │ │
│ │ │ "Had a deep conversation with PersonA about future    │ │ │
│ │ │  plans. PersonA seemed optimistic..."                 │ │ │
│ │ │                                                        │ │
│ │ │ 👤 PersonA   📅 Jan 10, 2025                          │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ │ ┌───────────────────────────────────────────────────────┐ │ │
│ │ │ 📝 55% match                                          │ │ │
│ │ │ "Weekly team meeting. PersonB presented the project   │ │ │
│ │ │  update. Felt productive."                            │ │ │
│ │ │                                                        │ │
│ │ │ 👤 PersonB   📅 Jan 8, 2025                           │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─── Semantic Search Info ──────────────────────────────────┐ │
│ │ Powered by AI vector search — searches by meaning, not    │ │
│ │ just keywords. Results are ranked by semantic relevance.  │ │
│ └──────────────────────────────────────────────────────────┘ │
```

## Search Behavior

### Input
- Text input with search icon
- Debounced: triggers search 300ms after user stops typing
- Or press Enter / click 🔎

### Filters

| Filter | API Param | Values |
|--------|-----------|--------|
| Person | `person` | Person name (auto-complete from people list) |
| Session | `session` | Session ID (from chat sessions) |
| Segment | `segment` | Text segment filter |

### Results

Each result card shows:
- Match score percentage (color-coded: green > 80%, yellow > 50%, gray < 50%)
- Interaction text content (truncated to ~150 chars, search terms highlighted)
- People tags (clickable → person detail)
- Date timestamp
- Click card → show full text in expandable detail

### Highlighting

Semantically matched terms should be highlighted in the result text using `<mark>` tags or a yellow background span.

## API

`GET /api/memories?query={text}&limit={n}&person={name}&session={id}&segment={text}`

```typescript
interface MemoryResult {
  content: string
  score: number
  metadata: {
    people: string[]
    interaction_id: string
    timestamp: string
  }
}
```

## States

| State | UI |
|-------|-----|
| Initial | Search bar + info card about semantic search. "Search your past interactions to find patterns." |
| Searching | Spinner in search input, results area shows "Searching..." |
| Results | Result cards with scores |
| Empty results | "No memories found for '{query}'. Try different terms or check your filters." |
| Error | "Search failed" + retry button |
| No filters | Show "Optional: filter by person, session, or segment to narrow results" |
