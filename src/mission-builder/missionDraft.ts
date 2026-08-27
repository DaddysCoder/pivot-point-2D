import type {
  DecisionChoice,
  MapDefinition,
  MapEdge,
  MapNode,
  MissionDefinition,
  PivotEventDefinition,
} from '@/engine/types'
import {
  COMPLICATION_PRESETS,
  cloneLibraryEvent,
} from '@/engine/pivotEventLibrary'

export const OBJECTIVE_PRESETS = [
  'Deliver supplies',
  'Find missing team',
  'Reach location',
  'Defend position',
  'Repair infrastructure',
  'Map unknown area',
  'Retrieve object',
  'Establish communications',
  'Escort unit',
] as const

export interface MissionDraft {
  id: string
  name: string
  worldId: string
  objective: string
  tacticalLevel: number
  map: MapDefinition
  complicationIds: string[]
  surpriseMe: boolean
}

export function createBlankMap(width = 4, height = 4): MapDefinition {
  const start: MapNode = {
    id: 'start',
    label: 'Start',
    position: { x: 0, y: height - 1 },
    terrainId: 'base',
    tags: ['start'],
  }
  const objective: MapNode = {
    id: 'objective',
    label: 'Objective',
    position: { x: width - 1, y: 0 },
    terrainId: 'base',
    tags: ['objective'],
  }
  const mid: MapNode = {
    id: 'mid',
    label: 'Waypoint',
    position: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    terrainId: 'road',
    tags: [],
  }
  const edges: MapEdge[] = [
    {
      id: 'start-mid',
      from: 'start',
      to: 'mid',
      travelCost: 1,
      tags: ['main'],
    },
    {
      id: 'mid-objective',
      from: 'mid',
      to: 'objective',
      travelCost: 1,
      tags: ['main'],
    },
  ]
  return {
    id: `map-${crypto.randomUUID().slice(0, 8)}`,
    width,
    height,
    startNodeId: start.id,
    objectiveNodeId: objective.id,
    nodes: [start, mid, objective],
    edges,
  }
}

export function createDefaultDraft(worldId = 'frontier'): MissionDraft {
  return {
    id: `custom-${crypto.randomUUID().slice(0, 8)}`,
    name: 'Custom Mission',
    worldId,
    objective: OBJECTIVE_PRESETS[0],
    tacticalLevel: 2,
    map: createBlankMap(),
    complicationIds: ['route-blocked'],
    surpriseMe: false,
  }
}

function buildInitialChoices(map: MapDefinition): DecisionChoice[] {
  return [
    {
      id: 'custom-direct',
      label: 'Direct',
      description: 'Take the main marked route.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: map.nodes[1]?.id ?? map.startNodeId },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Direct plan selected.',
        },
      ],
    },
    {
      id: 'custom-recon',
      label: 'Recon',
      description: 'Spend a turn gathering information.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['custom-direct', 'custom-finish'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Approaches reassessed.',
        },
      ],
    },
    {
      id: 'custom-finish',
      label: 'Push to objective',
      description: 'Commit to reaching the objective.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: map.objectiveNodeId },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Custom mission complete.',
        },
      ],
    },
  ]
}

function buildEvents(
  draft: MissionDraft,
  map: MapDefinition,
): PivotEventDefinition[] {
  const selected = draft.surpriseMe
    ? COMPLICATION_PRESETS.map((p) => p.id).sort(() => Math.random() - 0.5).slice(0, 2)
    : draft.complicationIds

  const events: PivotEventDefinition[] = []
  for (const complicationId of selected) {
    const preset = COMPLICATION_PRESETS.find((p) => p.id === complicationId)
    if (!preset) continue
    const cloned = cloneLibraryEvent(preset.libraryId, {
      trigger:
        complicationId === draft.complicationIds[0] || draft.surpriseMe
          ? { type: 'on_choice', choiceId: 'custom-direct' }
          : { type: 'manual', code: complicationId },
    })
    if (!cloned) continue
    // Ensure a path to completion after pivot
    cloned.choices = cloned.choices.map((choice) => ({
      ...choice,
      effects: [
        ...choice.effects.filter((e) => e.type !== 'set_active_choices'),
        {
          type: 'set_active_choices' as const,
          choiceIds: ['custom-finish'],
        },
      ],
    }))
    if (cloned.effects.some((e) => e.type === 'block_edge')) {
      // rewrite block to first main edge if present
      cloned.effects = cloned.effects.map((e) =>
        e.type === 'block_edge'
          ? { ...e, edgeId: map.edges[1]?.id ?? map.edges[0]?.id ?? e.edgeId }
          : e,
      )
    }
    events.push(cloned)
  }
  return events
}

export function compileMissionDraft(draft: MissionDraft): MissionDefinition {
  const initialChoices = buildInitialChoices(draft.map)
  const events = buildEvents(draft, draft.map)
  return {
    id: draft.id,
    name: draft.name.trim() || 'Custom Mission',
    objective: draft.objective,
    tacticalLevel: draft.tacticalLevel,
    map: draft.map,
    startingIntel: [
      {
        id: `${draft.id}-brief`,
        title: 'Orders',
        description: draft.objective,
      },
    ],
    initialChoices,
    choiceLibrary: initialChoices,
    events,
    rewards: [
      {
        id: `${draft.id}-complete`,
        label: 'Mission complete',
        materials: 4,
        onComplete: true,
      },
      {
        id: `${draft.id}-adapt`,
        label: 'Adapted after disruption',
        pivotTokens: 1,
        requireAdaptedEvent: events[0]?.id,
      },
    ],
  }
}

export function exportMissionJson(mission: MissionDefinition): string {
  return JSON.stringify(mission, null, 2)
}

export function importMissionJson(raw: string): MissionDefinition {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid mission file: not valid JSON')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid mission file: expected an object')
  }
  const mission = parsed as MissionDefinition
  if (typeof mission.id !== 'string' || !mission.id.trim()) {
    throw new Error('Invalid mission file: missing id')
  }
  if (typeof mission.name !== 'string' || !mission.name.trim()) {
    throw new Error('Invalid mission file: missing name')
  }
  if (!mission.map || !Array.isArray(mission.map.nodes) || !Array.isArray(mission.map.edges)) {
    throw new Error('Invalid mission file: map is incomplete')
  }
  if (!Array.isArray(mission.initialChoices) || mission.initialChoices.length === 0) {
    throw new Error('Invalid mission file: missing initial choices')
  }
  if (!Array.isArray(mission.events)) {
    throw new Error('Invalid mission file: events must be an array')
  }
  return mission
}
