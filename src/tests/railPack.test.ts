import { describe, expect, it } from 'vitest'
import { createInitialGameState, reduceGame, startMission } from '@/engine'
import { railWorld, signalBlockMission, washoutMission } from '@/worlds/rail'

const registry = new Map(railWorld.missions.map((m) => [m.id, m]))

describe('Rail mission pack', () => {
  it('registers both missions', () => {
    expect(registry.get('signal-block')?.name).toBe('Signal Block')
    expect(registry.get('washout')?.name).toBe('Washout')
  })

  it('Washout: direct path pivots then completes via old siding', () => {
    let state = startMission(createInitialGameState(), washoutMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('cutting-washed-out')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-to-siding' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-siding-advance' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.pivotTokens).toBe(1)
  })

  it('Washout: recon reveals siding intel before committing', () => {
    let state = startMission(createInitialGameState(), washoutMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-recon' },
      registry,
    ).state
    expect(state.revealedIntel).toContain('siding-clear')
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-via-siding' },
      registry,
    ).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'wo-siding-advance' },
      registry,
    ).state
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.intel).toBe(2)
  })

  it('Signal Block still resolves via its own registry entry', () => {
    let state = startMission(createInitialGameState(), signalBlockMission).state
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'sb-direct' },
      registry,
    ).state
    expect(state.activeEventId).toBe('signal-red')
  })
})
