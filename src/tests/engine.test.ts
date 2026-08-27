import { describe, expect, it } from 'vitest'
import { createSeededRandom, pickIndex } from '@/engine/seededRandom'
import {
  createDefaultCharacter,
  createEmptyResources,
  createInitialGameState,
  type DecisionChoice,
  type GameState,
  type MissionDefinition,
  type PivotEventDefinition,
} from '@/engine/types'
import { reduceGame } from '@/engine/gameReducer'
import { startMission, getMissionById } from '@/engine/missionEngine'
import { applyEffects } from '@/engine/eventEngine'

/** Minimal fixture mission used only for engine-rule tests. */
function createFixtureMission(): MissionDefinition {
  const pivotChoices: DecisionChoice[] = [
    {
      id: 'pivot-recon',
      label: 'Recon',
      description: 'Look for another crossing.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'alt-crossing' },
        { type: 'reveal_node', nodeId: 'ford' },
        { type: 'increment_pivot' },
        { type: 'set_flag', flag: 'adapted_block', value: true },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['go-ford', 'go-east'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'A secondary ford is marked on the map.',
        },
      ],
    },
    {
      id: 'pivot-hold',
      label: 'Hold',
      description: 'Wait for updated conditions.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'weather-update', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'set_flag', flag: 'adapted_block', value: true },
        { type: 'clear_active_event' },
        {
          type: 'log',
          tone: 'info',
          title: 'HOLDING',
          body: 'Updated information expected next turn.',
        },
        {
          type: 'set_active_choices',
          choiceIds: ['advance-turn'],
        },
      ],
    },
  ]

  const blockEvent: PivotEventDefinition = {
    id: 'crossing-blocked',
    title: 'CROSSING CLOSED',
    description: 'Flood damage has made the crossing unsafe.',
    statusLabel: 'route_unavailable',
    trigger: { type: 'on_choice', choiceId: 'direct' },
    once: true,
    effects: [
      { type: 'block_edge', edgeId: 'crossing-to-ford', message: 'ROUTE UNAVAILABLE' },
      { type: 'move_to', nodeId: 'crossing' },
      { type: 'set_status', status: 'pivot' },
      {
        type: 'log',
        tone: 'plan_interrupted',
        title: 'PLAN INTERRUPTED',
        body: 'The original route is no longer available.',
      },
      {
        type: 'log',
        tone: 'route_unavailable',
        title: 'ROUTE UNAVAILABLE',
        body: 'Flood damage has made the crossing unsafe.',
      },
    ],
    choices: pivotChoices,
  }

  return {
    id: 'fixture-supply',
    name: 'Fixture Supply',
    objective: 'Reach North Station',
    tacticalLevel: 2,
    map: {
      id: 'fixture-map',
      width: 5,
      height: 5,
      startNodeId: 'echo',
      objectiveNodeId: 'north',
      nodes: [
        {
          id: 'echo',
          label: 'Echo Base',
          position: { x: 0, y: 4 },
          terrainId: 'base',
          tags: ['start'],
        },
        {
          id: 'crossing',
          label: 'Crossing',
          position: { x: 0, y: 2 },
          terrainId: 'road',
          tags: [],
        },
        {
          id: 'ford',
          label: 'River Ford',
          position: { x: 1, y: 1 },
          terrainId: 'river',
          tags: ['hidden'],
        },
        {
          id: 'east',
          label: 'Eastern Track',
          position: { x: 2, y: 2 },
          terrainId: 'hills',
          tags: [],
        },
        {
          id: 'north',
          label: 'North Station',
          position: { x: 0, y: 0 },
          terrainId: 'base',
          tags: ['objective'],
        },
      ],
      edges: [
        {
          id: 'echo-to-crossing',
          from: 'echo',
          to: 'crossing',
          travelCost: 1,
          tags: ['main'],
        },
        {
          id: 'crossing-to-ford',
          from: 'crossing',
          to: 'ford',
          travelCost: 1,
          tags: ['main'],
        },
        {
          id: 'ford-to-north',
          from: 'ford',
          to: 'north',
          travelCost: 1,
          tags: ['alt'],
        },
        {
          id: 'crossing-to-east',
          from: 'crossing',
          to: 'east',
          travelCost: 2,
          tags: ['alt'],
        },
        {
          id: 'east-to-north',
          from: 'east',
          to: 'north',
          travelCost: 1,
          tags: ['alt'],
        },
      ],
    },
    startingIntel: [
      {
        id: 'brief',
        title: 'Orders',
        description: 'Deliver supplies to North Station.',
      },
    ],
    initialChoices: [
      {
        id: 'direct',
        label: 'Direct',
        description: 'Take Main Road. Shortest; limited alternatives.',
        actionType: 'adapt',
        effects: [
          { type: 'move_to', nodeId: 'crossing' },
          { type: 'set_flag', flag: 'plan_direct', value: true },
          {
            type: 'log',
            tone: 'info',
            title: 'PLAN SET',
            body: 'Direct route via Main Road selected.',
          },
        ],
      },
      {
        id: 'eastern',
        label: 'Eastern Route',
        description: 'Take the hills. Longer; more route options.',
        actionType: 'reroute',
        effects: [
          { type: 'move_to', nodeId: 'east' },
          { type: 'add_travel_turns', turns: 1 },
          { type: 'set_flag', flag: 'plan_eastern', value: true },
          {
            type: 'set_active_choices',
            choiceIds: ['finish-east'],
          },
          {
            type: 'log',
            tone: 'info',
            title: 'PLAN SET',
            body: 'Eastern hills route selected.',
          },
        ],
      },
      {
        id: 'recon-first',
        label: 'Recon',
        description: 'Spend one turn gathering information.',
        actionType: 'recon',
        effects: [
          { type: 'add_travel_turns', turns: 1 },
          { type: 'reveal_intel', intelId: 'alt-crossing' },
          { type: 'reveal_node', nodeId: 'ford' },
          {
            type: 'set_active_choices',
            choiceIds: ['direct', 'eastern', 'go-ford'],
          },
          {
            type: 'log',
            tone: 'new_intel',
            title: 'NEW INTEL',
            body: 'Recon marks a secondary ford.',
          },
        ],
      },
    ],
    choiceLibrary: [
      {
        id: 'go-ford',
        label: 'Take River Ford',
        description: 'Use the revealed ford toward North Station.',
        actionType: 'reroute',
        effects: [
          { type: 'move_to', nodeId: 'ford' },
          { type: 'move_to', nodeId: 'north' },
          { type: 'complete_mission' },
        ],
      },
      {
        id: 'go-east',
        label: 'Reroute East',
        description: 'Move toward Eastern Track.',
        actionType: 'reroute',
        effects: [
          { type: 'move_to', nodeId: 'east' },
          { type: 'add_travel_turns', turns: 2 },
          {
            type: 'set_active_choices',
            choiceIds: ['finish-east'],
          },
        ],
      },
      {
        id: 'finish-east',
        label: 'Continue to North Station',
        description: 'Complete the eastern approach.',
        actionType: 'continue',
        effects: [
          { type: 'move_to', nodeId: 'north' },
          { type: 'complete_mission' },
        ],
      },
      {
        id: 'advance-turn',
        label: 'Continue',
        description: 'Advance one turn while holding.',
        actionType: 'continue',
        effects: [{ type: 'set_status', status: 'active' }],
      },
      ...pivotChoices,
    ],
    events: [blockEvent],
    rewards: [
      {
        id: 'complete',
        label: 'Mission complete',
        materials: 5,
        onComplete: true,
      },
      {
        id: 'ford-intel',
        label: 'Discovered River Ford',
        intel: 2,
        requireIntel: ['alt-crossing'],
      },
      {
        id: 'adapt-token',
        label: 'Adapted to crossing closure',
        pivotTokens: 1,
        requireAdaptedEvent: 'crossing-blocked',
      },
    ],
  }
}

const fixtureRegistry = new Map<string, MissionDefinition>([
  ['fixture-supply', createFixtureMission()],
])

describe('seededRandom', () => {
  it('produces a stable sequence for the same seed', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('diverges for different seeds', () => {
    const a = createSeededRandom(1)
    const b = createSeededRandom(2)
    expect([a(), a()]).not.toEqual([b(), b()])
  })

  it('pickIndex stays in range', () => {
    const rng = createSeededRandom(99)
    for (let i = 0; i < 20; i += 1) {
      const index = pickIndex(rng, 5)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(5)
    }
  })
})

describe('mission engine rules', () => {
  it('starts a mission with expected initial state', () => {
    const mission = createFixtureMission()
    const state = createInitialGameState({ seed: 7 })
    const result = startMission(state, mission)

    expect(result.state.currentMissionId).toBe('fixture-supply')
    expect(result.state.missionStatus).toBe('active')
    expect(result.state.playerNodeId).toBe('echo')
    expect(result.state.turn).toBe(1)
    expect(result.state.revealedIntel).toContain('brief')
    expect(result.state.availableChoiceIds).toEqual([
      'direct',
      'eastern',
      'recon-first',
    ])
    expect(result.state.pivotCount).toBe(0)
    expect(result.events.some((e) => e.type === 'MISSION_STARTED')).toBe(true)
  })

  it('action changes state', () => {
    const mission = createFixtureMission()
    let state = startMission(createInitialGameState(), mission).state
    const before = state.playerNodeId
    const result = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'eastern' },
      fixtureRegistry,
    )
    state = result.state
    expect(state.playerNodeId).toBe('east')
    expect(state.playerNodeId).not.toBe(before)
    expect(state.flags.plan_eastern).toBe(true)
    expect(state.missionLog.some((e) => e.title === 'PLAN SET')).toBe(true)
  })

  it('event can change route by blocking an edge', () => {
    const mission = createFixtureMission()
    let state = startMission(createInitialGameState(), mission).state
    const result = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'direct' },
      fixtureRegistry,
    )
    state = result.state

    expect(state.blockedEdges).toContain('crossing-to-ford')
    expect(state.missionStatus).toBe('pivot')
    expect(state.activeEventId).toBe('crossing-blocked')
    expect(state.missionLog.some((e) => e.title === 'PLAN INTERRUPTED')).toBe(
      true,
    )
    expect(state.missionLog.some((e) => e.title === 'ROUTE UNAVAILABLE')).toBe(
      true,
    )
    expect(state.missionStatus).not.toBe('completed')
  })

  it('failed route does not terminate the mission', () => {
    const mission = createFixtureMission()
    let state = startMission(createInitialGameState(), mission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'direct' },
      fixtureRegistry,
    ).state

    expect(state.missionStatus).toBe('pivot')
    expect(state.availableChoiceIds.length).toBeGreaterThan(0)

    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'pivot-recon' },
      fixtureRegistry,
    ).state

    expect(state.missionStatus).not.toBe('completed')
    expect(state.revealedNodes).toContain('ford')
    expect(state.flags.adapted_block).toBe(true)
  })

  it('pivot count cannot decrease because of an unsuccessful choice', () => {
    const mission = createFixtureMission()
    let state = startMission(createInitialGameState(), mission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'direct' },
      fixtureRegistry,
    ).state

    const afterPivot = state.pivotCount
    expect(afterPivot).toBe(0)

    // Holding is a valid adaptation; pivot increments, never decrements.
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'pivot-hold' },
      fixtureRegistry,
    ).state

    expect(state.pivotCount).toBe(1)
    expect(state.pivotCount).toBeGreaterThanOrEqual(afterPivot)

    // Applying a no-op / resource-denied style effect must not reduce pivots.
    const denied = applyEffects(state, mission, [
      {
        type: 'require_resource',
        resource: 'materials',
        amount: 99,
      },
      { type: 'modify_resource', resource: 'pivotTokens', amount: -5 },
    ])
    expect(denied.state.pivotCount).toBe(state.pivotCount)
    expect(denied.state.resources.pivotTokens).toBeGreaterThanOrEqual(
      state.resources.pivotTokens,
    )
  })

  it('getMissionById reads from registry', () => {
    expect(getMissionById(fixtureRegistry, 'fixture-supply')?.id).toBe(
      'fixture-supply',
    )
    expect(getMissionById(fixtureRegistry, 'missing')).toBeUndefined()
  })

  it('complete_mission is rejected when not at the objective node', () => {
    const mission = createFixtureMission()
    const state = startMission(createInitialGameState(), mission).state
    const denied = applyEffects(state, mission, [{ type: 'complete_mission' }])
    expect(denied.state.missionStatus).toBe('active')
    expect(denied.events.some((e) => e.type === 'COMPLETION_REJECTED')).toBe(true)
    expect(
      denied.state.missionLog.some((e) => e.title === 'OBJECTIVE NOT YET MET'),
    ).toBe(true)
  })
})

describe('types helpers', () => {
  it('creates default character and empty resources', () => {
    const character = createDefaultCharacter({ callSign: 'FOX' })
    expect(character.callSign).toBe('FOX')
    expect(createEmptyResources().materials).toBe(0)
    const state: GameState = createInitialGameState()
    expect(state.base.buildings.length).toBe(7)
  })
})
