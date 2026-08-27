import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import {
  compileMissionDraft,
  createDefaultDraft,
  exportMissionJson,
  importMissionJson,
} from '@/mission-builder/missionDraft'
import { relayDriftMission } from '@/worlds/orbit'
import { signalBlockMission } from '@/worlds/rail'
import { buildMissionRegistry, WORLD_PACKS } from '@/worlds/registry'

describe('world registry', () => {
  it('includes Frontier, Orbit, and Rail packs', () => {
    expect(WORLD_PACKS.map((w) => w.id)).toEqual(['frontier', 'orbit', 'rail'])
    const registry = buildMissionRegistry()
    expect(registry.get('supply-line')).toBeTruthy()
    expect(registry.get('relay-drift')).toBeTruthy()
    expect(registry.get('signal-block')).toBeTruthy()
  })
})

describe('Orbit Relay Drift', () => {
  it('pivots on direct corridor and completes via service rail', () => {
    const registry = buildMissionRegistry()
    let state = startMission(createInitialGameState({ worldId: 'orbit' }), relayDriftMission)
      .state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'rd-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('dock-sealed')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'rd-to-rail' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'rd-rail-advance' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'rd-finish' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.pivotTokens).toBe(1)
  })
})

describe('Rail Signal Block', () => {
  it('pivots on mainline and completes via viaduct', () => {
    const registry = buildMissionRegistry()
    let state = startMission(createInitialGameState({ worldId: 'rail' }), signalBlockMission)
      .state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sb-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('signal-red')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sb-to-siding' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sb-siding-advance' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sb-finish' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.pivotTokens).toBe(1)
  })
})

describe('mission builder compile/export', () => {
  it('compiles a playable custom mission and round-trips JSON', () => {
    const draft = createDefaultDraft('frontier')
    draft.name = 'Test Crossing'
    draft.complicationIds = ['route-blocked']
    const mission = compileMissionDraft(draft)
    expect(mission.initialChoices.length).toBeGreaterThan(0)
    expect(mission.events.length).toBeGreaterThan(0)

    const registry = buildMissionRegistry([mission])
    let state = startMission(createInitialGameState(), mission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'custom-direct' },
      registry,
    ).state
    expect(state.missionStatus).toBe('pivot')

    const raw = exportMissionJson(mission)
    const imported = importMissionJson(raw)
    expect(imported.id).toBe(mission.id)
    expect(imported.name).toBe('Test Crossing')
  })

  it('rejects malformed imported mission JSON', () => {
    expect(() => importMissionJson('{')).toThrow(/not valid JSON/)
    expect(() => importMissionJson('{"id":"x"}')).toThrow(/missing name/)
    expect(() =>
      importMissionJson(
        JSON.stringify({
          id: 'x',
          name: 'X',
          map: { nodes: [], edges: [] },
          initialChoices: [],
          events: [],
        }),
      ),
    ).toThrow(/initial choices/)
  })
})
