# Screen Spec: Chat

## Route: `/chat`

## Overview

Conversational interface with BubbleTrack AI. Users can chat about their social graph, ask questions, and submit interactions conversationally.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Chat with BubbleTrack                    [New Chat ▼] [🔍]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─── Messages ────────────────────────────────────────────┐  │
│ │                                                          │  │
│ │ ┌──────────────────────────────────────────────────────┐ │  │
│ │ │ BubbleTrack   (Connected via WebSocket)               │ │  │
│ │ │ ────────────────────────────────────────────────     │ │  │
│ │ │ Hello! I'm BubbleTrack, your social dynamics         │ │  │
│ │ │ assistant. Tell me about your interactions or ask    │ │  │
│ │ │ questions about your social graph.                   │ │  │
│ │ │                                            10:30 AM  │ │  │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ │ ┌──────────────────────────────────────────────────────┐ │  │
│ │ │ Tell me about my relationship with PersonA           │ │  │
│ │ │                                            10:31 AM  │ │  │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ │ ┌──────────────────────────────────────────────────────┐ │  │
│ │ │ BubbleTrack    ●●● Processing                        │ │  │
│ │ │ ────────────────────────────────────────────────     │ │  │
│ │ │ Your relationship with PersonA appears to be        │ │  │
│ │ │ strong (strength: 0.85) and nourishing. Analyzed    │ │  │
│ │ │ across 6 dimensions of relational health, the       │ │  │
│ │ │ highest being Growth (0.90). PersonA serves as a    │ │  │
│ │ │ Bridge in your network...                          │ │  │
│ │ │                                            10:31 AM  │ │  │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ │ [Scroll to bottom automatically]                         │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─── Input ────────────────────────────────────────────────┐  │
│ │ [Type your message...]                              [Send]│  │
│ │                                     {characters}/1000     │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─── Connection Status ─────────────────────────────────────┐ │
│ │ 🟢 Connected via WebSocket  —  or  —  ⚪ HTTP Polling    │ │
│ └──────────────────────────────────────────────────────────┘ │
```

## WebSocket Integration

### Connection
- On mount: attempt `WebSocket` connection to `ws://{API_HOST}/ws`
- Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Max 3 retries before falling back to HTTP polling

### Message Flow

```
User sends message:
  1. POST /api/chat { sender: "You", content, session_id }
  2. Optimistically add user message to UI
  3. Server saves to DB + broadcasts via WebSocket hub
  4. If WS connected: receive BubbleTrack response via WebSocket
  5. If WS fails: poll GET /api/chat for new messages

Receiving messages:
  1. WebSocket onmessage: parse ChatMessage JSON
  2. Add to messages array
  3. Auto-scroll to bottom
```

### Connection Status

| Status | Badge | Action |
|--------|-------|--------|
| Connecting | 🔄 Yellow pulsing | Waiting for handshake |
| Connected | 🟢 Green "Live" | Real-time updates active |
| Disconnected | 🔴 Red "Disconnected" | Auto-reconnecting... |
| Fallback | ⚪ Gray "Polling" | HTTP polling, 5s interval |
| Error | 🔴 "WS Error" | Fallback to HTTP |

## Message Types

### User Message
```json
{
  "id": "uuid",
  "sender": "You",
  "content": "Tell me about PersonA",
  "is_user": true,
  "session_id": "optional",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### BubbleTrack Response (with analysis results)
```json
{
  "id": "uuid",
  "sender": "BubbleTrack",
  "content": "Analysis of PersonA shows...",
  "is_user": false,
  "analysis_job": {
    "interaction_id": "uuid",
    "job_id": "asynq:uuid",
    "status": "pending"
  },
  "created_at": "2025-01-15T10:30:05Z"
}
```

## Chat Sessions

- Sidebar shows session history grouped by date
- Each session has a `session_id`
- "New Chat" creates a fresh session (new `session_id`)
- `GET /api/chat?session_id={id}&limit=50`

## Actions

- **Send** — Submit message
- **Enter** sends (Shift+Enter = newline)
- **New Chat** — Clear current session, create new `session_id`
- **Search** (🔍) — Navigates to `/memories` with chat text prefilled
- **Click person name** in BubbleTrack response → Navigate to `/people/:id`
- **Click relationship** mention → Navigate to `/relationships/:id/health`

## States

| State | UI |
|-------|-----|
| Loading | Skeleton message placeholders (2-3 gray bubbles) |
| Empty | Welcome message from BubbleTrack + suggested prompts |
| Sending | User message shown, typing indicator for BubbleTrack |
| Receiving | `●●●` animated dots in BubbleTrack bubble |
| Error (send) | Message shows ⚠️ "Failed to send" + retry button |
| WS disconnected | Banner: "Real-time connection lost. Messages may be delayed." |
| History loaded | "Loaded 25 messages" indicator |

## Suggested Prompts (Empty State)

```
Try asking:
┌─────────────────────────────────────────────────────────────┐
│ 💬 "Tell me about my strongest relationships"              │
│ 💬 "Who are the bridges in my network?"                    │
│ 💬 "How has my relationship with PersonA changed?"          │
│ 💬 "Analyze this interaction: [paste text]"                │
└─────────────────────────────────────────────────────────────┘
```

## Pinia Store: `chat.ts`

```typescript
interface ChatState {
  messages: ChatMessage[]
  currentSessionId: string
  isSending: boolean
  isTyping: boolean           // BubbleTrack is generating
  wsStatus: WsStatus
  sessions: { id: string; preview: string; date: Date }[]
}

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback' | 'error'
```

## Data Sources

- `POST /api/chat` — send message
- `GET /api/chat` — get history (query: `session_id`, `limit`)
- `ws://{host}/ws` — WebSocket for real-time
