import { loadoutHasAll } from '@/crafting/craftingEngine'
import type {
  DecisionChoice,
  EngineResult,
  GameEffect,
  GameEvent,
  GameState,
  MissionDefinition,
  MissionLogEntry,
  MissionLogTone,
  ResourceState,
} from '@/engine/types'

function nextLogId(state: GameState): string {
  return `log-${state.missionLog.length + 1}-${state.turn}`
}

export function appendLog(
  state: GameState,
  tone: MissionLogTone,
  title: string,
  body: string,
): GameState {
  const entry: MissionLogEntry = {
    id: nextLogId(state),
    turn: state.turn,
    tone,
    title,
    body,
  }
  return {
    ...state,
    missionLog: [...state.missionLog, entry],
  }
}

function clampResource(value: number): number {
  return Math.max(0, value)
}

function modifyResource(
  resources: ResourceState,
  key: keyof ResourceState,
  amount: number,
): ResourceState {
  // Pivot tokens and progression resources never go below current when amount is negative
  // for pivotTokens specifically we refuse decreases (spec: never remove for unsuccessful choice).
  if (key === 'pivotTokens' && amount < 0) {
    return resources
  }
  return {
    ...resources,
    [key]: clampResource(resources[key] + amount),
  }
}

export function findChoice(
  mission: MissionDefinition,
  choiceId: string,
): DecisionChoice | undefined {
  const fromInitial = mission.initialChoices.find((c) => c.id === choiceId)
  if (fromInitial) return fromInitial
  for (const event of mission.events) {
    const found = event.choices.find((c) => c.id === choiceId)
    if (found) return found
  }
  return mission.choiceLibrary?.find((c) => c.id === choiceId)
}

/**
 * Merge pack mission with runtime-injected Mission Control events.
 * Injected events win on id collision so facilitator overrides stay authoritative.
 */
export function composeMission(
  mission: MissionDefinition,
  state: Pick<GameState, 'injectedEvents'>,
): MissionDefinition {
  if (!state.injectedEvents.length) {
    return mission
  }
  const injectedIds = new Set(state.injectedEvents.map((e) => e.id))
  return {
    ...mission,
    events: [
      ...mission.events.filter((e) => !injectedIds.has(e.id)),
      ...state.injectedEvents,
    ],
  }
}

export function findChoiceForState(
  mission: MissionDefinition,
  state: Pick<GameState, 'injectedEvents'>,
  choiceId: string,
): DecisionChoice | undefined {
  return findChoice(composeMission(mission, state), choiceId)
}

export function isChoiceAvailable(
  state: GameState,
  choice: DecisionChoice,
): boolean {
  if (choice.requireFlags) {
    for (const [flag, expected] of Object.entries(choice.requireFlags)) {
      if (Boolean(state.flags[flag]) !== expected) {
        return false
      }
    }
  }
  if (choice.requireResources) {
    for (const [key, amount] of Object.entries(choice.requireResources)) {
      const resourceKey = key as keyof ResourceState
      if (state.resources[resourceKey] < (amount ?? 0)) {
        return false
      }
    }
  }
  if (!loadoutHasAll(state.activeLoadout ?? [], choice.requireEquipment)) {
    return false
  }
  return true
}

/** Equipment-gated choices stay hidden until the loadout includes them. */
export function isEquipmentRequirementMet(
  state: Pick<GameState, 'activeLoadout'>,
  choice: DecisionChoice,
): boolean {
  return loadoutHasAll(state.activeLoadout ?? [], choice.requireEquipment)
}

export function filterChoiceIdsForLoadout(
  state: Pick<GameState, 'activeLoadout' | 'injectedEvents'>,
  mission: MissionDefinition,
  choiceIds: string[],
): string[] {
  return choiceIds.filter((id) => {
    const choice = findChoice(composeMission(mission, state), id)
    if (!choice) return false
    return isEquipmentRequirementMet(state, choice)
  })
}

function movePlayer(state: GameState, mission: MissionDefinition, nodeId: string): GameState {
  const node = mission.map.nodes.find((n) => n.id === nodeId)
  if (!node) {
    return state
  }
  const route = state.finalRoute.includes(nodeId)
    ? state.finalRoute
    : [...state.finalRoute, nodeId]
  return {
    ...state,
    playerNodeId: nodeId,
    playerPosition: { ...node.position },
    revealedNodes: state.revealedNodes.includes(nodeId)
      ? state.revealedNodes
      : [...state.revealedNodes, nodeId],
    finalRoute: route,
  }
}

/**
 * Apply a list of effects. Resource requirements that fail skip subsequent
 * dependent effects in the same batch after logging informational feedback —
 * they never end the mission and never reduce pivotCount.
 */
export function applyEffects(
  state: GameState,
  mission: MissionDefinition,
  effects: GameEffect[],
): EngineResult & { aborted: boolean } {
  let next = state
  const events: GameEvent[] = []
  let skipRest = false
  let aborted = false

  for (const effect of effects) {
    if (skipRest) {
      break
    }

    switch (effect.type) {
      case 'block_edge': {
        if (!next.blockedEdges.includes(effect.edgeId)) {
          next = {
            ...next,
            blockedEdges: [...next.blockedEdges, effect.edgeId],
          }
        }
        if (effect.message) {
          next = appendLog(next, 'route_unavailable', effect.message, effect.message)
        }
        events.push({ type: 'EDGE_BLOCKED', payload: { edgeId: effect.edgeId } })
        break
      }
      case 'unblock_edge': {
        next = {
          ...next,
          blockedEdges: next.blockedEdges.filter((id) => id !== effect.edgeId),
        }
        events.push({ type: 'EDGE_UNBLOCKED', payload: { edgeId: effect.edgeId } })
        break
      }
      case 'reveal_intel': {
        if (!next.revealedIntel.includes(effect.intelId)) {
          next = {
            ...next,
            revealedIntel: [...next.revealedIntel, effect.intelId],
          }
        }
        const intel =
          mission.startingIntel.find((i) => i.id === effect.intelId) ??
          mission.intelCatalog?.find((i) => i.id === effect.intelId)
        if (intel?.revealsNodeIds) {
          for (const nodeId of intel.revealsNodeIds) {
            if (!next.revealedNodes.includes(nodeId)) {
              next = {
                ...next,
                revealedNodes: [...next.revealedNodes, nodeId],
                discoveries: next.discoveries.includes(nodeId)
                  ? next.discoveries
                  : [...next.discoveries, nodeId],
              }
            }
          }
        }
        events.push({ type: 'INTEL_REVEALED', payload: { intelId: effect.intelId } })
        break
      }
      case 'reveal_node': {
        if (!next.revealedNodes.includes(effect.nodeId)) {
          next = {
            ...next,
            revealedNodes: [...next.revealedNodes, effect.nodeId],
            discoveries: next.discoveries.includes(effect.nodeId)
              ? next.discoveries
              : [...next.discoveries, effect.nodeId],
          }
        }
        events.push({ type: 'NODE_REVEALED', payload: { nodeId: effect.nodeId } })
        break
      }
      case 'move_to': {
        // Authored choices are the movement model. The map graph is a visual
        // record; move_to does not walk edges or check blocked routes.
        next = movePlayer(next, mission, effect.nodeId)
        events.push({ type: 'MOVED', payload: { nodeId: effect.nodeId } })
        break
      }
      case 'add_travel_turns': {
        next = {
          ...next,
          travelTurnsRemaining: next.travelTurnsRemaining + effect.turns,
          turn: next.turn + effect.turns,
        }
        events.push({ type: 'TRAVEL_ADDED', payload: { turns: effect.turns } })
        break
      }
      case 'modify_resource': {
        next = {
          ...next,
          resources: modifyResource(next.resources, effect.resource, effect.amount),
        }
        events.push({
          type: 'RESOURCE_CHANGED',
          payload: { resource: effect.resource, amount: effect.amount },
        })
        break
      }
      case 'require_resource': {
        if (next.resources[effect.resource] < effect.amount) {
          next = appendLog(
            next,
            'info',
            'CONDITIONS CHANGED',
            `Unavailable — missing ${effect.resource} (have ${next.resources[effect.resource]}, need ${effect.amount}). Choose another approach.`,
          )
          events.push({
            type: 'RESOURCE_REQUIREMENT_UNMET',
            payload: { resource: effect.resource, amount: effect.amount },
          })
          skipRest = true
          aborted = true
        } else {
          next = {
            ...next,
            resources: modifyResource(
              next.resources,
              effect.resource,
              -effect.amount,
            ),
          }
        }
        break
      }
      case 'set_flag': {
        next = {
          ...next,
          flags: { ...next.flags, [effect.flag]: effect.value },
        }
        break
      }
      case 'increment_pivot': {
        next = { ...next, pivotCount: next.pivotCount + 1 }
        events.push({ type: 'PIVOT_COUNTED' })
        break
      }
      case 'complete_mission': {
        if (next.playerNodeId !== mission.map.objectiveNodeId) {
          next = appendLog(
            next,
            'info',
            'OBJECTIVE NOT YET MET',
            'Reach the mission destination before completing the objective. This is not a failure.',
          )
          events.push({
            type: 'COMPLETION_REJECTED',
            payload: {
              playerNodeId: next.playerNodeId,
              objectiveNodeId: mission.map.objectiveNodeId,
            },
          })
          break
        }
        next = { ...next, missionStatus: 'completed' }
        events.push({ type: 'MISSION_COMPLETED' })
        break
      }
      case 'schedule_intel': {
        next = {
          ...next,
          pendingIntel: [
            ...next.pendingIntel,
            {
              intelId: effect.intelId,
              deliverOnTurn: next.turn + effect.afterTurns,
            },
          ],
        }
        break
      }
      case 'log': {
        next = appendLog(next, effect.tone, effect.title, effect.body)
        break
      }
      case 'set_status': {
        next = { ...next, missionStatus: effect.status }
        break
      }
      case 'set_active_choices': {
        const filtered = effect.choiceIds.filter((id) => {
          const choice = findChoice(mission, id)
          if (!choice) return false
          return isEquipmentRequirementMet(next, choice)
        })
        next = {
          ...next,
          availableChoiceIds: [...filtered],
          activeChoiceIds: [...filtered],
        }
        break
      }
      case 'clear_active_event': {
        next = {
          ...next,
          activeEventId: null,
          missionStatus: next.missionStatus === 'pivot' ? 'active' : next.missionStatus,
        }
        break
      }
      case 'trigger_event': {
        events.push({ type: 'REQUEST_TRIGGER', payload: { eventId: effect.eventId } })
        break
      }
      default: {
        const _exhaustive: never = effect
        void _exhaustive
      }
    }
  }

  return { state: next, events, aborted }
}

export function activatePivotEvent(
  state: GameState,
  mission: MissionDefinition,
  eventId: string,
): EngineResult {
  const event = mission.events.find((e) => e.id === eventId)
  if (!event) {
    return { state, events: [] }
  }
  if (event.once && state.triggeredEventIds.includes(eventId)) {
    return { state, events: [] }
  }

  let next: GameState = {
    ...state,
    activeEventId: eventId,
    lastPivotTitle: event.title,
    triggeredEventIds: state.triggeredEventIds.includes(eventId)
      ? state.triggeredEventIds
      : [...state.triggeredEventIds, eventId],
    availableChoiceIds: event.choices
      .filter((c) => isEquipmentRequirementMet(state, c))
      .map((c) => c.id),
    activeChoiceIds: event.choices
      .filter((c) => isEquipmentRequirementMet(state, c))
      .map((c) => c.id),
    missionStatus: 'pivot',
  }

  next = appendLog(next, event.statusLabel, event.title, event.description)
  const applied = applyEffects(next, mission, event.effects)
  return {
    state: applied.state,
    events: [
      { type: 'PIVOT_EVENT', payload: { eventId, title: event.title } },
      ...applied.events,
    ],
  }
}
