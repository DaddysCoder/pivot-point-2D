import type { ActionType } from '@/engine/types'
import {
  DIRECTOR_DEFAULT_COOLDOWN,
  DIRECTOR_INTENSITY_MAX,
  DIRECTOR_INTENSITY_RECOVERY_PER_TICK,
  DIRECTOR_MANUAL_COOLDOWN,
  DIRECTOR_PREDICTABILITY,
  DIRECTOR_RECENT_ACTION_WINDOW,
} from '@/director/directorRules'
import type {
  DirectorDecision,
  DirectorEventCategory,
  DirectorEventMeta,
  DirectorHistoryEntry,
  DirectorRuntimeState,
} from '@/director/directorTypes'
import type { Predictability } from '@/settings/playStyleTypes'

export function createInitialDirectorState(): DirectorRuntimeState {
  return {
    intensityAvailable: DIRECTOR_INTENSITY_MAX,
    cooldownRemaining: 0,
    history: [],
    recentActionTypes: [],
    advisoryPendingEventId: null,
    lastDecision: null,
    lastCandidates: [],
    resumeChoiceIds: null,
  }
}

export function normalizeDirectorState(
  raw: Partial<DirectorRuntimeState> | null | undefined,
): DirectorRuntimeState {
  const base = createInitialDirectorState()
  if (!raw || typeof raw !== 'object') return base
  return {
    intensityAvailable:
      typeof raw.intensityAvailable === 'number'
        ? Math.max(0, Math.min(DIRECTOR_INTENSITY_MAX, raw.intensityAvailable))
        : base.intensityAvailable,
    cooldownRemaining:
      typeof raw.cooldownRemaining === 'number'
        ? Math.max(0, raw.cooldownRemaining)
        : base.cooldownRemaining,
    history: Array.isArray(raw.history) ? raw.history : [],
    recentActionTypes: Array.isArray(raw.recentActionTypes)
      ? raw.recentActionTypes
      : [],
    advisoryPendingEventId:
      typeof raw.advisoryPendingEventId === 'string'
        ? raw.advisoryPendingEventId
        : null,
    lastDecision: raw.lastDecision ?? null,
    lastCandidates: Array.isArray(raw.lastCandidates) ? raw.lastCandidates : [],
    resumeChoiceIds: Array.isArray(raw.resumeChoiceIds)
      ? raw.resumeChoiceIds
      : null,
  }
}

export function primaryCategory(
  meta: Pick<DirectorEventMeta, 'categories'>,
): DirectorEventCategory {
  return meta.categories[0] ?? 'environment'
}

/** Advance cooldown recovery and intensity between decisions/turns. */
export function tickDirectorClock(
  director: DirectorRuntimeState,
  predictability: Predictability,
): DirectorRuntimeState {
  const recovery =
    DIRECTOR_PREDICTABILITY[predictability]?.intensityRecovery ??
    DIRECTOR_INTENSITY_RECOVERY_PER_TICK
  return {
    ...director,
    cooldownRemaining: Math.max(0, director.cooldownRemaining - 1),
    intensityAvailable: Math.min(
      DIRECTOR_INTENSITY_MAX,
      director.intensityAvailable + recovery,
    ),
  }
}

export function rememberActionType(
  director: DirectorRuntimeState,
  actionType: ActionType | undefined,
): DirectorRuntimeState {
  if (!actionType) return director
  const recentActionTypes = [
    ...director.recentActionTypes,
    actionType,
  ].slice(-DIRECTOR_RECENT_ACTION_WINDOW)
  return { ...director, recentActionTypes }
}

export function recordDirectorTrigger(
  director: DirectorRuntimeState,
  meta: DirectorEventMeta,
  turn: number,
  decision: DirectorDecision,
): DirectorRuntimeState {
  const category = primaryCategory(meta)
  const entry: DirectorHistoryEntry = {
    eventId: meta.eventId,
    category,
    turn,
    source: 'director',
  }
  return {
    ...director,
    intensityAvailable: Math.max(
      0,
      director.intensityAvailable - meta.intensityCost,
    ),
    cooldownRemaining: meta.cooldownTurns ?? DIRECTOR_DEFAULT_COOLDOWN,
    history: [...director.history, entry],
    advisoryPendingEventId: null,
    lastDecision: decision,
  }
}

export function recordManualPivot(
  director: DirectorRuntimeState,
  meta: DirectorEventMeta | undefined,
  eventId: string,
  turn: number,
): DirectorRuntimeState {
  const category = meta ? primaryCategory(meta) : 'environment'
  const entry: DirectorHistoryEntry = {
    eventId,
    category,
    turn,
    source: 'manual',
  }
  return {
    ...director,
    cooldownRemaining: Math.max(
      director.cooldownRemaining,
      meta?.cooldownTurns ?? DIRECTOR_MANUAL_COOLDOWN,
    ),
    history: [...director.history, entry],
    advisoryPendingEventId: null,
    lastDecision: {
      type: 'none',
      reasonCodes: ['manual_control_override'],
    },
  }
}

export function recordMissionPivot(
  director: DirectorRuntimeState,
  meta: DirectorEventMeta | undefined,
  eventId: string,
  turn: number,
): DirectorRuntimeState {
  const category = meta ? primaryCategory(meta) : 'environment'
  const entry: DirectorHistoryEntry = {
    eventId,
    category,
    turn,
    source: 'mission',
  }
  return {
    ...director,
    // Soft cooldown so Director does not immediately stack on scripted pivots.
    cooldownRemaining: Math.max(
      director.cooldownRemaining,
      DIRECTOR_DEFAULT_COOLDOWN,
    ),
    history: [...director.history, entry],
  }
}

export function countDirectorTriggers(
  director: DirectorRuntimeState,
  eventId: string,
): number {
  return director.history.filter(
    (h) => h.eventId === eventId && h.source === 'director',
  ).length
}

export function lastDirectorCategory(
  director: DirectorRuntimeState,
): DirectorEventCategory | null {
  for (let i = director.history.length - 1; i >= 0; i -= 1) {
    const entry = director.history[i]
    if (entry?.source === 'director') return entry.category
  }
  return null
}
