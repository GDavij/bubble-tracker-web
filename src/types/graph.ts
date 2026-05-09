import type { SocialRole, Mood, Quality, Protocol, PersonState } from './domain'

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

export interface FullGraphData {
  graph: GraphData
  metrics: Record<string, NodeMetrics>
  roles: Record<string, RoleClassification>
  profiles: Record<string, AggregatedProfile>
  person_states: Record<string, PersonState[]>
  timeline: TimelineEntry[]
}

export interface NodeMetrics {
  person_id: string
  user_id: string
  computed_at: string
  time_window: string
  degree: number
  interaction_frequency: number
  emotional_valence: number
  trend_direction: TrendDirection
  centrality: CentralityScores
  community: CommunityMetrics
  relational_health: RelationshipHealth
  social_capital: SocialCapital
  attachment: AttachmentProfile
  humanist_score: HumanistProfile
  social_exchange: SocialExchangeProfile
}

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'volatile'

export interface CentralityScores {
  degree: number
  betweenness: number
  closeness: number
  eigenvector: number
  pagerank: number
  clustering_coef: number
}

export interface CommunityMetrics {
  community_id: string
  community_role: string
  embeddedness: number
  bridge: number
}

export interface RelationshipHealth {
  overall: number
  reciprocity: number
  communication: number
  trust: number
  support: number
  compatibility: number
  growth: number
  resilience: number
}

export interface SocialCapital {
  total: number
  bonding: number
  bridging: number
}

export interface AttachmentProfile {
  style: string
  score: number
}

export interface HumanistProfile {
  agency: number
  empathic: number
}

export interface SocialExchangeProfile {
  satisfaction: number
  investment: number
  comparison_level: number
}

export interface TimelineEntry {
  id: string
  timestamp: string
  type: string
  description: string
  data?: Record<string, unknown>
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

export interface GraphSnapshot {
  total_people: number
  total_relationships: number
  avg_reciprocity: number
  bridge_count: number
  strongest_connection: string
  network_density?: number
  avg_clustering?: number
  community_count?: number
}
