import {
  DIRECTOR_ALLOWED_MISSIONS,
  directorCandidatesForMission,
  getDirectorEventMeta,
} from '@/director/directorRegistry'
import {
  createInitialDirectorState,
  normalizeDirectorState,
  recordDirectorTrigger,
  recordManualPivot,
  recordMissionPivot,
  rememberActionType,
  tickDirectorClock,
} from '@/director/directorMemory'
import { explainCandidate, scoreDirectorEvent } from '@/director/eventScoring'
import type {
  DirectorCandidateDebug,
  DirectorContext,
  DirectorDecision,
  DirectorInspectState,
  DirectorRuntimeState,
} from '@/director/directorTypes'
import { createSeededRandom, pickIndex } from '@/engine/seededRandom'
import type {
  ActionType,
  GameState,
  MissionDefinition,
  PivotEventDefinition,
} from '@/engine/types'
import { PIVOT_EVENT_LIBRARY } from '@/engine/pivotEventLibrary'
import {
  activatePivotEvent,
  appendLog,
  composeMission,
} from '@/engine/eventEngine'
import type { EngineResult } from '@/engine/types'

function directorSeed(state: DirectorInspectState): number {
  const historyLen = state.director?.history.length ?? 0
  const pivot = state.pivotCount
  return (state.seed ^ (state.turn * 2654435761) ^ (historyLen * 40503) ^ (pivot * 97)) >>> 0
}

function resolveEventTitle(
  mission: MissionDefinition,
  eventId: string,
): string {
  const fromMission = mission.events.find((e) => e.id === eventId)
  if (fromMission) return fromMission.title
  return PIVOT_EVENT_LIBRARY.find((e) => e.id === eventId)?.title ?? eventId
}

function eventExists(
  mission: MissionDefinition,
  state: Pick<GameState, 'injectedEvents'>,
  eventId: string,
): boolean {
  if (composeMission(mission, state).events.some((e) => e.id === eventId)) {
    return true
  }
  return PIVOT_EVENT_LIBRARY.some((e) => e.id === eventId)
}

/**
 * Pure Adaptive Director evaluation.
 * Selects a pre-authored event id or returns none/advisory.
 * Never generates prose or bypasses the Pivot engine.
 */
export function evaluateDirector(
  state: DirectorInspectState,
  mission: MissionDefinition,
  context: DirectorContext,
): DirectorDecision {
  const director = normalizeDirectorState(state.director)

  if (!context.enabled) {
    return { type: 'none', reasonCodes: ['director_disabled'] }
  }
  if (!context.missionAllowed || !DIRECTOR_ALLOWED_MISSIONS.has(mission.id)) {
    return { type: 'none', reasonCodes: ['mission_not_allowlisted'] }
  }
  if (state.missionStatus !== 'active') {
    return { type: 'none', reasonCodes: [`status_${state.missionStatus}`] }
  }
  if (state.activeEventId) {
    return { type: 'none', reasonCodes: ['active_event_present'] }
  }

  const inspect: DirectorInspectState = { ...state, director }
  const metas = directorCandidatesForMission(mission.id, state.worldId)
  if (metas.length === 0) {
    return { type: 'none', reasonCodes: ['no_candidates_configured'] }
  }

  const scored: DirectorCandidateDebug[] = []
  const eligible: { meta: (typeof metas)[number]; score: number; reasons: string[] }[] =
    []

  for (const meta of metas) {
    if (!eventExists(mission, state as GameState, meta.eventId)) {
      scored.push({
        eventId: meta.eventId,
        title: resolveEventTitle(mission, meta.eventId),
        score: 0,
        reasonCodes: ['missing_event'],
        eligible: false,
      })
      continue
    }

    const result = scoreDirectorEvent({
      state: inspect,
      mission,
      meta,
      predictability: context.predictability,
      recentCategories: director.history.map((h) => h.category),
    })
    const debug = explainCandidate(
      meta,
      result,
      resolveEventTitle(mission, meta.eventId),
    )
    scored.push(debug)
    if (result.eligible) {
      eligible.push({ meta, score: result.score, reasons: result.reasonCodes })
    }
  }

  // Stash debug onto a transient field via closure consumer — evaluate is pure;
  // callers persist lastCandidates when applying.
  ;(evaluateDirector as unknown as { _lastCandidates?: DirectorCandidateDebug[] })._lastCandidates =
    scored

  if (eligible.length === 0) {
    return { type: 'none', reasonCodes: ['no_eligible_event'] }
  }

  // Prefer advisory-pending event if still eligible.
  if (director.advisoryPendingEventId) {
    const pending = eligible.find(
      (e) => e.meta.eventId === director.advisoryPendingEventId,
    )
    if (pending) {
      return {
        type: 'trigger',
        eventId: pending.meta.eventId,
        reasonCodes: [...pending.reasons, 'advisory_fulfilled'],
      }
    }
  }

  eligible.sort((a, b) => b.score - a.score)
  const topScore = eligible[0]!.score
  const top = eligible.filter((e) => e.score === topScore)

  const rng = createSeededRandom(directorSeed(inspect))
  const pick = top[pickIndex(rng, top.length)]!

  // High predictability: warn once before first fire of warning-capable events.
  if (
    context.predictability === 'high' &&
    pick.meta.supportsAdvanceWarning &&
    director.advisoryPendingEventId !== pick.meta.eventId &&
    !director.history.some((h) => h.eventId === pick.meta.eventId)
  ) {
    return {
      type: 'advisory',
      eventId: pick.meta.eventId,
      reasonCodes: [...pick.reasons, 'advance_warning'],
    }
  }

  return {
    type: 'trigger',
    eventId: pick.meta.eventId,
    reasonCodes: pick.reasons,
  }
}

export function getLastEvaluatedCandidates(): DirectorCandidateDebug[] {
  return (
    (evaluateDirector as unknown as { _lastCandidates?: DirectorCandidateDebug[] })
      ._lastCandidates ?? []
  )
}

export function ensureDirectorState(state: GameState): GameState {
  if (state.director) {
    return { ...state, director: normalizeDirectorState(state.director) }
  }
  return { ...state, director: createInitialDirectorState() }
}

function injectLibraryEventIfNeeded(
  state: GameState,
  mission: MissionDefinition,
  eventId: string,
): { state: GameState; mission: MissionDefinition; event?: PivotEventDefinition } {
  const composed = composeMission(mission, state)
  const existing = composed.events.find((e) => e.id === eventId)
  if (existing) {
    return { state, mission: composed, event: existing }
  }
  const libraryEvent = PIVOT_EVENT_LIBRARY.find((e) => e.id === eventId)
  if (!libraryEvent) {
    return { state, mission: composed }
  }
  const injected = structuredClone(libraryEvent)
  const nextState: GameState = {
    ...state,
    injectedEvents: [
      ...state.injectedEvents.filter((e) => e.id !== injected.id),
      injected,
    ],
  }
  return {
    state: nextState,
    mission: composeMission(mission, nextState),
    event: injected,
  }
}

/**
 * Run Director after a successful active-mission beat.
 * Safe failure → returns state unchanged aside from clock tick / debug stamp.
 */
export function applyDirectorAfterBeat(
  state: GameState,
  mission: MissionDefinition,
  context: DirectorContext,
  actionType?: ActionType,
): EngineResult {
  let next = ensureDirectorState(state)
  let director = tickDirectorClock(next.director!, context.predictability)
  director = rememberActionType(director, actionType)
  next = { ...next, director }

  if (
    next.missionStatus !== 'active' ||
    next.activeEventId ||
    !context.enabled ||
    !context.missionAllowed
  ) {
    next = {
      ...next,
      director: {
        ...director,
        lastDecision: {
          type: 'none',
          reasonCodes:
            next.missionStatus !== 'active'
              ? [`status_${next.missionStatus}`]
              : next.activeEventId
                ? ['active_event_present']
                : !context.enabled
                  ? ['director_disabled']
                  : ['mission_not_allowlisted'],
        },
        lastCandidates: [],
      },
    }
    return { state: next, events: [] }
  }

  const decision = evaluateDirector(next, mission, context)
  const candidates = getLastEvaluatedCandidates()
  director = {
    ...normalizeDirectorState(next.director),
    lastDecision: decision,
    lastCandidates: candidates,
  }
  next = { ...next, director }

  if (decision.type === 'advisory') {
    const advised = appendLog(
      {
        ...next,
        director: {
          intensityAvailable: director.intensityAvailable,
          cooldownRemaining: director.cooldownRemaining,
          history: director.history,
          recentActionTypes: director.recentActionTypes,
          lastCandidates: candidates,
          lastDecision: decision,
          advisoryPendingEventId: decision.eventId,
          resumeChoiceIds: director.resumeChoiceIds,
        },
      },
      'info',
      'FIELD ADVISORY',
      'Conditions ahead may change.',
    )
    return {
      state: advised,
      events: [
        {
          type: 'DIRECTOR_ADVISORY',
          payload: { eventId: decision.eventId, reasons: decision.reasonCodes },
        },
      ],
    }
  }

  if (decision.type === 'none') {
    return { state: next, events: [] }
  }

  const meta = getDirectorEventMeta(decision.eventId)
  if (!meta) {
    return {
      state: {
        ...next,
        director: {
          ...director,
          lastDecision: { type: 'none', reasonCodes: ['missing_meta'] },
        },
      },
      events: [],
    }
  }

  const injected = injectLibraryEventIfNeeded(next, mission, decision.eventId)
  if (!injected.event) {
    return {
      state: {
        ...next,
        director: {
          ...director,
          lastDecision: { type: 'none', reasonCodes: ['missing_event'] },
        },
      },
      events: [],
    }
  }

  director = recordDirectorTrigger(director, meta, next.turn, decision)
  director = {
    ...director,
    resumeChoiceIds: [...next.availableChoiceIds],
  }
  next = { ...injected.state, director }

  const activated = activatePivotEvent(next, injected.mission, decision.eventId)
  return {
    state: activated.state,
    events: [
      {
        type: 'DIRECTOR_TRIGGER',
        payload: { eventId: decision.eventId, reasons: decision.reasonCodes },
      },
      ...activated.events,
    ],
  }
}

/** Restore mission choices after a Director-injected Pivot is cleared. */
export function restoreDirectorResumeChoices(state: GameState): GameState {
  const director = normalizeDirectorState(state.director)
  if (!director.resumeChoiceIds || director.resumeChoiceIds.length === 0) {
    return state
  }
  if (state.activeEventId || state.missionStatus === 'pivot') {
    return state
  }
  // If a choice already installed a new active set, keep it.
  const stillOnDirectorChoices =
    state.availableChoiceIds.length > 0 &&
    state.availableChoiceIds.every((id) =>
      state.injectedEvents.some(
        (e) =>
          e.id === director.history.at(-1)?.eventId &&
          e.choices.some((c) => c.id === id),
      ),
    )
  if (!stillOnDirectorChoices && state.availableChoiceIds.length > 0) {
    return {
      ...state,
      director: { ...director, resumeChoiceIds: null },
    }
  }
  return {
    ...state,
    availableChoiceIds: [...director.resumeChoiceIds],
    activeChoiceIds: [...director.resumeChoiceIds],
    director: { ...director, resumeChoiceIds: null },
  }
}

export function noteManualDirectorCooldown(
  state: GameState,
  eventId: string,
): GameState {
  const next = ensureDirectorState(state)
  const meta = getDirectorEventMeta(eventId)
  return {
    ...next,
    director: recordManualPivot(next.director!, meta, eventId, next.turn),
  }
}

export function noteMissionDirectorPivot(
  state: GameState,
  eventId: string,
): GameState {
  const next = ensureDirectorState(state)
  const meta = getDirectorEventMeta(eventId)
  return {
    ...next,
    director: recordMissionPivot(next.director!, meta, eventId, next.turn),
  }
}

export function buildDirectorContext(
  enabled: boolean,
  predictability: DirectorContext['predictability'],
  missionId: string,
): DirectorContext {
  return {
    enabled,
    predictability,
    missionAllowed: DIRECTOR_ALLOWED_MISSIONS.has(missionId),
  }
}

export function resetDirectorForMission(
  previous: DirectorRuntimeState | undefined,
): DirectorRuntimeState {
  void previous
  return createInitialDirectorState()
}
