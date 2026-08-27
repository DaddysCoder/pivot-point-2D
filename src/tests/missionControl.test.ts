import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import { supplyLineMission } from '@/worlds/frontier'
import { buildMissionRegistry } from '@/worlds/registry'

const registry = buildMissionRegistry([supplyLineMission])

function begin() {
  return startMission(createInitialGameState({ seed: 21 }), supplyLineMission).state
}

describe('Mission Control library events — full resolve loop', () => {
  it('Route blocked: lib-route-blocked choices resolve without CHOICE_MISSING', () => {
    let state = begin()
    const pivotsBefore = state.pivotCount

    const triggered = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-route-blocked' },
      registry,
    )
    state = triggered.state

    expect(state.missionStatus).toBe('pivot')
    expect(state.activeEventId).toBe('lib-route-blocked')
    expect(state.injectedEvents.some((e) => e.id === 'lib-route-blocked')).toBe(
      true,
    )
    expect(state.availableChoiceIds).toEqual(
      expect.arrayContaining(['lib-rb-recon', 'lib-rb-reroute', 'lib-rb-hold']),
    )

    const resolved = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rb-recon' },
      registry,
    )
    state = resolved.state

    expect(resolved.events.some((e) => e.type === 'CHOICE_MISSING')).toBe(false)
    expect(state.activeEventId).toBeNull()
    expect(state.missionStatus).toBe('active')
    expect(state.pivotCount).toBe(pivotsBefore + 1)
    expect(state.adaptedEventIds).toContain('lib-route-blocked')

    // Mission remains playable — initial-style continuation still available after adapt
    // (library clears to active; Supply Line still has its original available set from clear)
    expect(state.missionStatus).not.toBe('completed')
  })

  it('Waiting: lib-waiting → lib-wait-hold resumes normally', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-waiting' },
      registry,
    ).state
    expect(state.activeEventId).toBe('lib-waiting')

    const result = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-wait-hold' },
      registry,
    )
    state = result.state

    expect(result.events.some((e) => e.type === 'CHOICE_MISSING')).toBe(false)
    expect(state.activeEventId).toBeNull()
    expect(state.missionStatus).toBe('active')
    expect(state.pivotCount).toBe(1)
  })

  it('Objective shift: lib-objective-shift → lib-os-switch sets flag and clears', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-objective-shift' },
      registry,
    ).state

    const result = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-os-switch' },
      registry,
    )
    state = result.state

    expect(result.events.some((e) => e.type === 'CHOICE_MISSING')).toBe(false)
    expect(state.flags.objective_switched).toBe(true)
    expect(state.activeEventId).toBeNull()
    expect(state.missionStatus).toBe('active')
  })

  it('Resource event: lib-resource-short Trade requires influence and Adapt always works', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-resource-short' },
      registry,
    ).state
    expect(state.activeEventId).toBe('lib-resource-short')

    // No influence → Trade unavailable / unmet, mission stays in pivot
    const denied = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rs-trade' },
      registry,
    )
    expect(denied.events.some((e) => e.type === 'CHOICE_REQUIREMENTS_UNMET')).toBe(
      true,
    )
    expect(denied.state.activeEventId).toBe('lib-resource-short')
    expect(denied.state.resources.materials).toBe(state.resources.materials)
    expect(denied.state.pivotCount).toBe(state.pivotCount)

    // Adapt still works
    const adapted = reduceGame(
      denied.state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rs-adapt' },
      registry,
    )
    expect(adapted.events.some((e) => e.type === 'CHOICE_MISSING')).toBe(false)
    expect(adapted.state.activeEventId).toBeNull()
    expect(adapted.state.missionStatus).toBe('active')
    expect(adapted.state.pivotCount).toBe(state.pivotCount + 1)
  })

  it('Resource event Trade spends influence only when available', () => {
    let state = begin()
    state = {
      ...state,
      resources: { ...state.resources, influence: 2, materials: 3 },
    }
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-resource-short' },
      registry,
    ).state
    // Event itself may reduce materials by 1
    const matsAfterEvent = state.resources.materials

    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rs-trade' },
      registry,
    ).state

    expect(state.resources.influence).toBe(1)
    expect(state.resources.materials).toBe(matsAfterEvent + 1)
    expect(state.activeEventId).toBeNull()
  })

  it('Injected library event survives simulated save/reload state round-trip', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-route-blocked' },
      registry,
    ).state

    // Simulate persistence: JSON round-trip of GameState
    const reloaded = JSON.parse(JSON.stringify(state)) as typeof state
    expect(reloaded.injectedEvents).toHaveLength(1)

    const result = reduceGame(
      reloaded,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rb-hold' },
      registry,
    )
    expect(result.events.some((e) => e.type === 'CHOICE_MISSING')).toBe(false)
    expect(result.state.missionStatus).toBe('active')
  })

  it('does not double-count Pivot when library choice includes increment_pivot', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-route-blocked' },
      registry,
    ).state
    const before = state.pivotCount
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rb-reroute' },
      registry,
    ).state
    expect(state.pivotCount).toBe(before + 1)
  })

  it('aborted resource choice does not increase or decrease pivot count', () => {
    let state = begin()
    state = reduceGame(
      state,
      { type: 'TRIGGER_FACILITATOR_EVENT', eventId: 'lib-resource-short' },
      registry,
    ).state
    // Give influence 0 explicitly after event
    state = {
      ...state,
      resources: { ...state.resources, influence: 0 },
      pivotCount: 5,
    }
    state = reduceGame(
      state,
      { type: 'SELECT_CHOICE', choiceId: 'lib-rs-trade' },
      registry,
    ).state
    expect(state.pivotCount).toBe(5)
  })
})
