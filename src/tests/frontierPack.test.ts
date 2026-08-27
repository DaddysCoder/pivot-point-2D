import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import {
  brokenConnectionMission,
  getFrontierMissionRegistry,
  missingReconMission,
} from '@/worlds/frontier'

const registry = getFrontierMissionRegistry()

describe('Frontier mission pack', () => {
  it('registers all three Alpha missions', () => {
    expect(registry.get('supply-line')?.name).toBe('Supply Line')
    expect(registry.get('missing-recon')?.name).toBe('Missing Recon')
    expect(registry.get('broken-connection')?.name).toBe('Broken Connection')
  })

  it('Missing Recon: direct path pivots then completes via camp', () => {
    let state = startMission(createInitialGameState(), missingReconMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'mr-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('ridge-path-unstable')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'mr-go-camp' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'mr-finish-camp' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.pivotTokens).toBe(1)
  })

  it('Broken Connection: ask then depot path completes with intel', () => {
    let state = startMission(
      createInitialGameState(),
      brokenConnectionMission,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'bc-ask' },
      registry,
    ).state
    expect(state.revealedIntel).toContain('spare-parts')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'bc-via-depot' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'bc-finish-depot' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.intel).toBe(2)
  })

  it('Mission Control can trigger a manual facilitator event', () => {
    let state = startMission(createInitialGameState(), brokenConnectionMission)
      .state
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'bc-manual-intel' },
      registry,
    ).state
    expect(state.activeEventId).toBe('bc-manual-intel')
    expect(state.revealedNodes).toContain('spare-depot')
    expect(state.missionStatus).toBe('pivot')
  })
})
