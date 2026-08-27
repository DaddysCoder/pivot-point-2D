import {
  activatePivotEvent,
  appendLog,
  applyEffects,
  composeMission,
  findChoice,
  isChoiceAvailable,
} from '@/engine/eventEngine'
import { consumeEquipmentList } from '@/crafting/craftingEngine'
import {
  applyDirectorAfterBeat,
  buildDirectorContext,
  noteManualDirectorCooldown,
  noteMissionDirectorPivot,
  resetDirectorForMission,
  restoreDirectorResumeChoices,
} from '@/director/adaptiveDirector'
import { PIVOT_EVENT_LIBRARY } from '@/engine/pivotEventLibrary'
import { applyMissionRewards } from '@/engine/rewardEngine'
import type {
  EngineResult,
  GameEvent,
  GameState,
  MissionDefinition,
  PivotEventDefinition,
  PlayerAction,
} from '@/engine/types'
import type { Predictability } from '@/settings/playStyleTypes'

export type MissionRegistry = ReadonlyMap<string, MissionDefinition>

export interface ReduceGameOptions {
  predictability?: Predictability
  directorEnabled?: boolean
}

export function getMissionById(
  registry: MissionRegistry,
  missionId: string,
): MissionDefinition | undefined {
  return registry.get(missionId)
}

export function startMission(
  state: GameState,
  mission: MissionDefinition,
): EngineResult {
  const startNode = mission.map.nodes.find((n) => n.id === mission.map.startNodeId)
  if (!startNode) {
    throw new Error(`Mission ${mission.id} is missing start node`)
  }

  const startingIntelIds = mission.startingIntel.map((i) => i.id)
  const revealedNodes = [startNode.id]
  for (const intel of mission.startingIntel) {
    for (const nodeId of intel.revealsNodeIds ?? []) {
      if (!revealedNodes.includes(nodeId)) {
        revealedNodes.push(nodeId)
      }
    }
  }

  let next: GameState = {
    ...state,
    currentMissionId: mission.id,
    missionStatus: 'active',
    turn: 1,
    playerNodeId: startNode.id,
    playerPosition: { ...startNode.position },
    revealedIntel: [...startingIntelIds],
    revealedNodes,
    blockedEdges: mission.map.edges.filter((e) => e.blocked).map((e) => e.id),
    activeEventId: null,
    availableChoiceIds: mission.initialChoices.map((c) => c.id),
    activeChoiceIds: mission.initialChoices.map((c) => c.id),
    triggeredEventIds: [],
    adaptedEventIds: [],
    flags: {},
    pendingIntel: [],
    missionLog: [],
    pivotCount: state.pivotCount,
    travelTurnsRemaining: 0,
    originalPlan: null,
    lastPivotTitle: null,
    lastActionLabel: null,
    discoveries: [],
    finalRoute: [startNode.id],
    awardedRewardIds: [],
    injectedEvents: [],
    director: resetDirectorForMission(state.director),
  }

  next = appendLog(
    next,
    'info',
    'MISSION BRIEF',
    mission.objective,
  )

  // Fire any immediate events
  const events: GameEvent[] = [{ type: 'MISSION_STARTED', payload: { missionId: mission.id } }]
  for (const event of mission.events) {
    if (event.trigger.type === 'immediate') {
      const activated = activatePivotEvent(next, mission, event.id)
      next = noteMissionDirectorPivot(activated.state, event.id)
      events.push(...activated.events)
    }
  }

  return { state: next, events }
}

function deliverPendingIntel(
  state: GameState,
  mission: MissionDefinition,
): EngineResult {
  const due = state.pendingIntel.filter((p) => p.deliverOnTurn <= state.turn)
  if (due.length === 0) {
    return { state, events: [] }
  }

  let next = {
    ...state,
    pendingIntel: state.pendingIntel.filter((p) => p.deliverOnTurn > state.turn),
  }
  const events: GameEvent[] = []

  for (const item of due) {
    const applied = applyEffects(next, mission, [
      { type: 'reveal_intel', intelId: item.intelId },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: `Delayed report received: ${item.intelId}`,
      },
    ])
    next = applied.state
    events.push(...applied.events)
  }

  return { state: next, events }
}

function eventsForChoice(
  mission: MissionDefinition,
  choiceId: string,
): string[] {
  return mission.events
    .filter((e) => e.trigger.type === 'on_choice' && e.trigger.choiceId === choiceId)
    .map((e) => e.id)
}

function eventsForArrival(
  mission: MissionDefinition,
  nodeId: string,
): string[] {
  return mission.events
    .filter((e) => e.trigger.type === 'on_arrive' && e.trigger.nodeId === nodeId)
    .map((e) => e.id)
}

function markAdaptedIfNeeded(
  state: GameState,
  previousActiveEventId: string | null,
): GameState {
  if (!previousActiveEventId) {
    return state
  }
  if (state.adaptedEventIds.includes(previousActiveEventId)) {
    return state
  }
  return {
    ...state,
    adaptedEventIds: [...state.adaptedEventIds, previousActiveEventId],
  }
}

function directorContextFor(
  state: GameState,
  options: ReduceGameOptions | undefined,
): ReturnType<typeof buildDirectorContext> {
  const missionId = state.currentMissionId ?? ''
  return buildDirectorContext(
    Boolean(options?.directorEnabled),
    options?.predictability ?? 'balanced',
    missionId,
  )
}

function maybeDirector(
  state: GameState,
  mission: MissionDefinition,
  options: ReduceGameOptions | undefined,
  actionType?: Parameters<typeof applyDirectorAfterBeat>[3],
): EngineResult {
  if (state.missionStatus !== 'active' || state.activeEventId) {
    return { state, events: [] }
  }
  return applyDirectorAfterBeat(
    state,
    mission,
    directorContextFor(state, options),
    actionType,
  )
}

export function applyPlayerAction(
  state: GameState,
  action: PlayerAction,
  registry: MissionRegistry,
  options?: ReduceGameOptions,
): EngineResult {
  if (action.type === 'PAUSE') {
    return {
      state: { ...state, missionStatus: 'paused' },
      events: [{ type: 'PAUSED' }],
    }
  }

  if (action.type === 'RESUME') {
    return {
      state: {
        ...state,
        missionStatus: state.activeEventId ? 'pivot' : 'active',
      },
      events: [{ type: 'RESUMED' }],
    }
  }

  if (action.type === 'RETURN_TO_BASE') {
    return {
      state: {
        ...state,
        currentMissionId: null,
        missionStatus: 'briefing',
        activeEventId: null,
        availableChoiceIds: [],
        activeChoiceIds: [],
        injectedEvents: [],
      },
      events: [{ type: 'RETURNED_TO_BASE' }],
    }
  }

  if (action.type === 'START_MISSION') {
    const mission = getMissionById(registry, action.missionId)
    if (!mission) {
      return {
        state: appendLog(
          state,
          'info',
          'CONDITIONS CHANGED',
          `Mission ${action.missionId} is not available.`,
        ),
        events: [{ type: 'MISSION_MISSING', payload: { missionId: action.missionId } }],
      }
    }
    return startMission(state, mission)
  }

  const missionId = state.currentMissionId
  if (!missionId) {
    return { state, events: [{ type: 'NO_ACTIVE_MISSION' }] }
  }
  const mission = getMissionById(registry, missionId)
  if (!mission) {
    return { state, events: [{ type: 'MISSION_MISSING', payload: { missionId } }] }
  }

  if (action.type === 'TRIGGER_FACILITATOR_EVENT') {
    let runtimeState = state
    let runtimeMission = composeMission(mission, state)

    const inComposed = runtimeMission.events.some((e) => e.id === action.eventId)
    if (!inComposed) {
      const libraryEvent = PIVOT_EVENT_LIBRARY.find((e) => e.id === action.eventId)
      if (!libraryEvent) {
        return {
          state: appendLog(
            state,
            'info',
            'CONDITIONS CHANGED',
            `Event ${action.eventId} is not available.`,
          ),
          events: [{ type: 'EVENT_MISSING', payload: { eventId: action.eventId } }],
        }
      }
      const injected: PivotEventDefinition = structuredClone(libraryEvent)
      runtimeState = {
        ...state,
        injectedEvents: [
          ...state.injectedEvents.filter((e) => e.id !== injected.id),
          injected,
        ],
      }
      runtimeMission = composeMission(mission, runtimeState)
    }

    const activated = activatePivotEvent(runtimeState, runtimeMission, action.eventId)
    return {
      state: noteManualDirectorCooldown(activated.state, action.eventId),
      events: activated.events,
    }
  }

  if (action.type === 'SELECT_CHOICE') {
    const runtimeMission = composeMission(mission, state)
    const choice = findChoice(runtimeMission, action.choiceId)
    if (!choice) {
      return {
        state: appendLog(
          state,
          'info',
          'CONDITIONS CHANGED',
          'That option is no longer listed.',
        ),
        events: [{ type: 'CHOICE_MISSING', payload: { choiceId: action.choiceId } }],
      }
    }

    if (
      state.availableChoiceIds.length > 0 &&
      !state.availableChoiceIds.includes(choice.id)
    ) {
      return {
        state: appendLog(
          state,
          'info',
          'CONDITIONS CHANGED',
          'That option is not available right now.',
        ),
        events: [{ type: 'CHOICE_UNAVAILABLE', payload: { choiceId: choice.id } }],
      }
    }

    if (!isChoiceAvailable(state, choice)) {
      return {
        state: appendLog(
          state,
          'info',
          'CONDITIONS CHANGED',
          'Requirements for that approach are not met. Find another move.',
        ),
        events: [{ type: 'CHOICE_REQUIREMENTS_UNMET', payload: { choiceId: choice.id } }],
      }
    }

    const previousActiveEventId = state.activeEventId
    const wasPivot = state.missionStatus === 'pivot' || Boolean(state.activeEventId)

    let next: GameState = {
      ...state,
      lastActionLabel: choice.label,
      originalPlan: state.originalPlan ?? choice.label,
    }

    const applied = applyEffects(next, runtimeMission, choice.effects)
    next = applied.state
    const events: GameEvent[] = [
      { type: 'CHOICE_SELECTED', payload: { choiceId: choice.id } },
      ...applied.events,
    ]

    if (!applied.aborted && choice.consumeEquipment?.length) {
      next = consumeEquipmentList(next, choice.consumeEquipment)
      events.push({
        type: 'EQUIPMENT_CONSUMED',
        payload: { equipmentIds: choice.consumeEquipment },
      })
    }

    // One successful Pivot response → one Pivot count.
    // Prefer explicit increment_pivot effect; otherwise auto-count once.
    // Aborted/resource-denied choices never count and never decrease.
    if (!applied.aborted && wasPivot && previousActiveEventId) {
      next = markAdaptedIfNeeded(next, previousActiveEventId)
      const alreadyCounted = applied.events.some((e) => e.type === 'PIVOT_COUNTED')
      if (!alreadyCounted) {
        next = { ...next, pivotCount: next.pivotCount + 1 }
        events.push({ type: 'PIVOT_COUNTED' })
      }
    }

    // Trigger choice-linked pivot events (e.g. Direct → Crossing Closed)
    for (const eventId of eventsForChoice(runtimeMission, choice.id)) {
      if (next.triggeredEventIds.includes(eventId)) {
        continue
      }
      const activated = activatePivotEvent(next, composeMission(mission, next), eventId)
      next = noteMissionDirectorPivot(activated.state, eventId)
      events.push(...activated.events)
    }

    // Arrival triggers
    if (next.playerNodeId) {
      for (const eventId of eventsForArrival(runtimeMission, next.playerNodeId)) {
        if (next.triggeredEventIds.includes(eventId)) {
          continue
        }
        const activated = activatePivotEvent(next, composeMission(mission, next), eventId)
        next = noteMissionDirectorPivot(activated.state, eventId)
        events.push(...activated.events)
      }
    }

    // If mission completed via effects, apply rewards
    if (next.missionStatus === 'completed') {
      const rewarded = applyMissionRewards(next, runtimeMission)
      next = rewarded.state
      events.push(...rewarded.events)
    }

    // Deliver pending intel if turn advanced via travel effects
    const delivered = deliverPendingIntel(next, runtimeMission)
    next = delivered.state
    events.push(...delivered.events)

    // Restore mission thread after Director-injected library pivots
    if (
      !applied.aborted &&
      wasPivot &&
      previousActiveEventId &&
      next.missionStatus === 'active' &&
      !next.activeEventId
    ) {
      next = restoreDirectorResumeChoices(next)
    }

    // Adaptive Director — only when still active and no pivot in flight
    if (!applied.aborted && next.missionStatus === 'active' && !next.activeEventId) {
      const directed = maybeDirector(next, mission, options, choice.actionType)
      next = directed.state
      events.push(...directed.events)
    }

    return { state: next, events }
  }

  return { state, events: [] }
}

export function isMissionComplete(state: GameState): boolean {
  return state.missionStatus === 'completed'
}

export function canTraverseEdge(
  state: GameState,
  edgeId: string,
): boolean {
  return !state.blockedEdges.includes(edgeId)
}
