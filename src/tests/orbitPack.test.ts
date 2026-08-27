import { describe, expect, it } from 'vitest'
import { createInitialGameState, reduceGame, startMission } from '@/engine'
import { orbitWorld, relayDriftMission, solarFlareMission } from '@/worlds/orbit'

const registry = new Map(orbitWorld.missions.map((m) => [m.id, m]))

describe('Orbit mission pack', () => {
  it('registers both missions', () => {
    expect(registry.get('relay-drift')?.name).toBe('Relay Drift')
    expect(registry.get('solar-flare')?.name).toBe('Solar Flare')
  })

  it('Solar Flare: direct path pivots then completes via conduit', () => {
    let state = startMission(createInitialGameState(), solarFlareMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('truss-radiation-spike')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-to-conduit' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-conduit-advance' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.pivotTokens).toBe(1)
  })

  it('Solar Flare: recon reveals conduit intel before committing', () => {
    let state = startMission(createInitialGameState(), solarFlareMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-recon' },
      registry,
    ).state
    expect(state.revealedIntel).toContain('conduit-shielded')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-via-conduit' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sf-conduit-advance' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.intel).toBe(2)
  })

  it('Relay Drift still resolves via its own registry entry', () => {
    let state = startMission(createInitialGameState(), relayDriftMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'rd-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('dock-sealed')
  })
})
