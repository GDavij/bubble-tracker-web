# Spec: API Integration Patterns

## 1. Axios Instance & Interceptors

### File: `src/services/api.ts`

```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- REQUEST INTERCEPTOR: Attach JWT ---
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

// --- RESPONSE INTERCEPTOR: Handle 401 → refresh → retry ---
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const authStore = useAuthStore()
      
      try {
        await authStore.refreshTokens()
        processQueue(null, authStore.accessToken)
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authStore.logout()  // Clear tokens, redirect to login
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

## 2. Service Layer Pattern

Each backend domain gets a service file. Services are pure functions (not classes) for tree-shaking.

### Example: `src/services/graph.service.ts`

```typescript
import apiClient from './api'
import type { GraphData, FullGraphData, GraphSnapshot } from '@/types/graph'

export const graphService = {
  getGraph(): Promise<GraphData> {
    return apiClient.get('/api/graph').then(r => r.data)
  },
  getFullGraph(): Promise<FullGraphData> {
    return apiClient.get('/api/graph/full').then(r => r.data)
  },
  getSnapshot(): Promise<GraphSnapshot> {
    return apiClient.get('/api/analysis/graph/snapshot').then(r => r.data)
  },
}
```

### Service Files

| File | Base Path | Key Methods |
|------|-----------|-------------|
| `auth.service.ts` | `/auth` | login, register, refresh, logout, me |
| `graph.service.ts` | `/api/graph` | getGraph, getFullGraph |
| `people.service.ts` | `/api/people` | list, getById, getMetrics, classify, getMetricHistory |
| `relationships.service.ts` | `/api/relationships` | getAll, getHealth |
| `analysis.service.ts` | `/api/analyze` | submit, stream |
| `chat.service.ts` | `/api/chat` | sendMessage, getMessages |
| `states.service.ts` | `/api/states` | getTimeline, getSelfStates |
| `memories.service.ts` | `/api/memories` | search |
| `analytics.service.ts` | `/api/analysis` | getRoles, getProfiles, getSnapshot |

## 3. WebSocket Integration

### File: `src/composables/useWebSocket.ts`

```typescript
export function useWebSocket() {
  const { status, messages, connect, disconnect, send } = // ...
  
  // Auto-reconnect with exponential backoff
  const reconnect = ref(true)
  const maxRetries = 3
  const baseDelay = 1000
  
  // On connect: bind onmessage to update chat store
  // On disconnect: attempt reconnect with backoff
  // After maxRetries: fall back to HTTP polling
  
  return { status, messages, connect, disconnect, send }
}
```

### Connection States

```typescript
type WsStatus = 
  | 'connecting'     // Attempting initial connection
  | 'connected'      // Active WebSocket connection
  | 'disconnected'   // Connection lost, reconnecting...
  | 'fallback'       // Max retries exceeded, using HTTP polling
  | 'error'          // Fatal error
```

### Usage in Chat View

```typescript
const ws = useWebSocket()

onMounted(() => {
  ws.connect(import.meta.env.VITE_WS_URL)
})

// ws.messages updates the chat store reactively
// ws.status shows connection indicator in UI
```

## 4. SSE Integration (Server-Sent Events)

### File: `src/composables/useSSE.ts`

```typescript
export function useSSE(url: string) {
  const eventSource = ref<EventSource | null>(null)
  const connected = ref(false)
  const onMessage = (handler: (data: any) => void) => { /* ... */ }

  const connect = () => {
    eventSource.value = new EventSource(url)
    eventSource.value.onopen = () => { connected.value = true }
    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // dispatch to analysis store
    }
    eventSource.value.onerror = () => {
      connected.value = false
      // Browser auto-reconnects SSE
    }
  }

  const disconnect = () => { eventSource.value?.close() }
  
  onUnmounted(() => disconnect())
  
  return { connected, onMessage, connect }
}
```

### Usage in Analysis View

```typescript
const sse = useSSE(`${API_URL}/api/analysis/stream`)

sse.onMessage((data) => {
  // data: { interaction_id, status, people_extracted, ... }
  analysisStore.updateJobStatus(data.interaction_id, data.status, data)
})
```

## 5. TypeScript Types

### File: `src/types/domain.ts`

```typescript
export interface Person {
  id: string
  display_name: string
  aliases: string[]
  notes: string
  social_role: SocialRole
  current_mood: Mood
  current_energy: number  // [0, 1]
  created_at: string
  updated_at: string
}

export type SocialRole = 'bridge' | 'mentor' | 'anchor' | 'catalyst' | 'observer' | 'drain' | 'unknown'
export type Mood = 'happy' | 'anxious' | 'tired' | 'energized' | 'sad' | 'neutral' | 'angry' | 'hopeful' | 'lonely' | 'grateful'
export type Quality = 'nourishing' | 'neutral' | 'draining' | 'conflicted' | 'unknown'
export type Protocol = 'deep' | 'casual' | 'professional' | 'digital' | 'mixed'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Relationship {
  id: string
  source_person_id: string
  target_person_id: string
  quality: Quality
  strength: number  // [0, 1]
  label: string
  reciprocity_index: number  // [0, 1]
  protocol: Protocol
}

export interface Interaction {
  id: string
  user_id: string
  raw_text: string
  status: JobStatus
  summary?: string
  job_id?: string
}

export interface NodeMetrics {
  person_id: string
  user_id: string
  computed_at: string
  time_window: string
  degree: number
  centrality: CentralityScores
  community: CommunityMetrics
  relational_health: RelationshipHealth
  social_capital: SocialCapital
  attachment: AttachmentProfile
  humanist_score: HumanistProfile
  social_exchange: SocialExchangeProfile
  trend_direction: TrendDirection
}

export interface CentralityScores {
  degree: number
  betweenness: number
  closeness: number
  eigenvector: number
  pagerank: number
  clustering_coef: number
}

export interface PersonState {
  person_id: string | null
  person_name?: string
  mood: Mood
  energy: number
  valence: number
  context: string
  trigger: string
  notes: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender: 'You' | 'BubbleTrack'
  content: string
  is_user: boolean
  session_id?: string
  analysis_job?: { interaction_id: string; job_id: string; status: string }
  created_at: string
}
```

### File: `src/types/graph.ts`

```typescript
export interface GraphNode {
  id: string
  display_name: string
  social_role: SocialRole
  current_mood: Mood
  current_energy: number
  interaction_count: number
}

export interface GraphEdge {
  source: string
  target: string
  quality: Quality
  strength: number
  source_weight: number
  target_weight: number
  protocol: Protocol
  reciprocity_index: number
}

export interface GraphStats {
  total_people: number
  total_relationships: number
  avg_reciprocity: number
  bridge_count: number
  strongest_connection: string
}

export interface GraphData {
  user_id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: GraphStats
}

export interface FullGraphData extends GraphData {
  metrics: Record<string, any>      // person_id → NodeMetrics
  roles: Record<string, RoleClassification>
  profiles: Record<string, AggregatedProfile>
  person_states: Record<string, PersonState[]>
  timeline: any[]
}

export interface RoleClassification {
  primary_role: SocialRole
  confidence: number
  scores: Record<SocialRole, number>
}

export interface AggregatedProfile {
  rank: number
  percentile: number
  trend: string
  stability: number
  summary: string
}
```

## 6. Error Handling Convention

```typescript
// API errors always return: { error: "description" }
// HTTP status codes:
//   400 — Bad request / validation
//   401 — Missing/invalid JWT
//   404 — Resource not found
//   409 — Conflict (auth: email exists)
//   500 — Internal server error
//   501 — Feature not configured

// Standard error handler in composable:
function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error
    if (message) return message
    if (error.code === 'ERR_NETWORK') return 'Unable to connect to server'
    return `Request failed (${error.response?.status || 'unknown'})`
  }
  return 'An unexpected error occurred'
}
```

## 7. Real-time Architecture Decision

```
WebSocket vs SSE vs Polling

Chat:           WebSocket (bidirectional, real-time)
Analysis:       SSE (unidirectional, server→client)
Fallback:       HTTP polling (every 5s)

Store updates flow:
  WebSocket/SSE → Pinia Store → Reactive Components
  HTTP Polling  → Pinia Store → Reactive Components
```

## 8. Pinia Store Pattern

All stores follow the same pattern:

```typescript
import { defineStore } from 'pinia'

export const usePeopleStore = defineStore('people', () => {
  // State
  const list = ref<Person[]>([])
  const selectedPerson = ref<PersonDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Actions
  async function fetchList() {
    isLoading.value = true
    error.value = null
    try {
      list.value = await peopleService.list()
    } catch (e) {
      error.value = handleApiError(e)
    } finally {
      isLoading.value = false
    }
  }
  
  // Getters
  const bridgeCount = computed(() => 
    list.value.filter(p => p.social_role === 'bridge').length
  )
  
  return { list, selectedPerson, isLoading, error, fetchList, bridgeCount }
})
```
