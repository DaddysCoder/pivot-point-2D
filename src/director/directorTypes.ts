import type { ActionType, GameState, MissionDefinition } from '@/engine/types'
import type { Predictability } from '@/settings/playStyleTypes'

/** Coarse event categories used for variety memory and scoring. */
export type DirectorEventCategory =
  | 'route'
  | 'resource'
  | 'intel'
  | 'waiting'
  | 'objective'
  | 'communication'
  | 'environment'
  | 'repair'
  | 'equipment-opportunity'

export interface DirectorEventMeta {
  eventId: string
  categories: DirectorEventCategory[]
  /** Intensity cost deducted when the Director triggers this event. */
  intensityCost: number
  minTurn?: number
  /** Override default director cooldown after this event fires. */
  cooldownTurns?: number
  maxPerMission?: number
  compatibleWorlds?: string[]
  compatibleMissionIds?: string[]
  compatibleMissionTags?: string[]
  /** Soft equipment-tag affinity (from EquipmentDefinition.tags). */
  loadoutAffinityTags?: string[]
  avoidAfterCategory?: DirectorEventCategory[]
  /** High predictability may show a field advisory before firing. */
  supportsAdvanceWarning?: boolean
  /** Action types this event primarily invites (variety scoring). */
  invitedActionTypes?: ActionType[]
  /** Node / edge tags that boost map compatibility. */
  mapAffinityTags?: string[]
}

export interface DirectorHistoryEntry {
  eventId: string
  category: DirectorEventCategory
  turn: number
  source: 'director' | 'manual' | 'mission'
}

export interface DirectorCandidateDebug {
  eventId: string
  title: string
  score: number
  reasonCodes: string[]
  eligible: boolean
}

export type DirectorDecision =
  | {
      type: 'trigger'
      eventId: string
      reasonCodes: string[]
    }
  | {
      type: 'none'
      reasonCodes: string[]
    }
  | {
      type: 'advisory'
      eventId: string
      reasonCodes: string[]
    }

/** Mission-local Adaptive Director runtime (persisted in saves). */
export interface DirectorRuntimeState {
  intensityAvailable: number
  cooldownRemaining: number
  history: DirectorHistoryEntry[]
  recentActionTypes: ActionType[]
  /** When set, next eligible evaluation may fire this warned event. */
  advisoryPendingEventId: string | null
  lastDecision: DirectorDecision | null
  lastCandidates: DirectorCandidateDebug[]
  /**
   * Choice ids to restore after a Director-injected Pivot resolves,
   * so library events do not strand the mission thread.
   */
  resumeChoiceIds: string[] | null
}

export interface DirectorContext {
  enabled: boolean
  predictability: Predictability
  /** Mission is allow-listed for Director (e.g. Supply Line). */
  missionAllowed: boolean
}

export interface DirectorScoreResult {
  score: number
  reasonCodes: string[]
  eligible: boolean
}

export type DirectorInspectState = Pick<
  GameState,
  | 'seed'
  | 'turn'
  | 'missionStatus'
  | 'playerNodeId'
  | 'revealedIntel'
  | 'blockedEdges'
  | 'resources'
  | 'activeLoadout'
  | 'inventory'
  | 'triggeredEventIds'
  | 'adaptedEventIds'
  | 'pivotCount'
  | 'worldId'
  | 'activeEventId'
  | 'injectedEvents'
  | 'director'
>

export interface ScoreContext {
  state: DirectorInspectState
  mission: MissionDefinition
  meta: DirectorEventMeta
  predictability: Predictability
  recentCategories: DirectorEventCategory[]
}
