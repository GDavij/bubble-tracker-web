export type SocialRole = 'bridge' | 'mentor' | 'anchor' | 'catalyst' | 'observer' | 'drain' | 'unknown'
export type Mood = 'happy' | 'anxious' | 'tired' | 'energized' | 'sad' | 'neutral' | 'angry' | 'hopeful' | 'lonely' | 'grateful'
export type Quality = 'nourishing' | 'neutral' | 'draining' | 'conflicted' | 'unknown'
export type Protocol = 'deep' | 'casual' | 'professional' | 'digital' | 'mixed'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'volatile'

export interface Person {
  id: string
  display_name: string
  aliases: string[]
  notes: string
  social_role: SocialRole
  current_mood: Mood
  current_energy: number
  created_at: string
  updated_at: string
}

export interface Relationship {
  id: string
  source_person_id: string
  target_person_id: string
  quality: Quality
  strength: number
  label: string
  reciprocity_index: number
  source_weight: number
  target_weight: number
  protocol: Protocol
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  user_id: string
  raw_text: string
  status: JobStatus
  summary?: string
  people?: string[]
  job_id?: string
  created_at: string
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

export interface PersonState {
  id: string
  person_id: string | null
  person_name?: string
  mood: Mood
  energy: number
  valence: number
  context: string
  trigger: string
  notes: string
  interaction_id?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  sender: 'You' | 'BubbleTrack'
  content: string
  is_user: boolean
  session_id?: string
  analysis_job?: { interaction_id: string; job_id: string; status: string }
  created_at: string
}

export interface AnalysisResult {
  people_extracted: Person[]
  relationships_found: Relationship[]
  summary: string
}

export interface AnalysisJob {
  interaction_id: string
  job_id: string
  status: JobStatus
  text: string
  result?: AnalysisResult
  created_at: Date
}

export interface MemoryResult {
  content: string
  score: number
  metadata: {
    people: string[]
    interaction_id: string
    timestamp: string
  }
}
