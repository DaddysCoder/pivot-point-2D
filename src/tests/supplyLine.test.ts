import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import { getFrontierMissionRegistry, supplyLineMission } from '@/worlds/frontier'

const registry = getFrontierMissionRegistry()

function beginSupplyLine(seed = 11) {
  const state = createInitialGameState({ seed })
  return startMission(state, supplyLineMission).state
}

function choose(state: ReturnType<typeof beginSupplyLine>, choiceId: string) {
  return reduceGame(state, { type: 'SELECT_CHOICE', choiceId }, registry).state
}

describe('Supply Line mission', () => {
  it('starts at Echo Base with Direct, Eastern Route, and Recon', () => {
    const state = beginSupplyLine()
    expect(state.currentMissionId).toBe('supply-line')
    expect(state.playerNodeId).toBe('echo-base')
    expect(state.availableChoiceIds).toEqual([
      'plan-direct',
      'plan-eastern',
      'plan-recon',
    ])
  })

  it('Direct path triggers CROSSING CLOSED pivot without ending the mission', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')

    expect(state.playerNodeId).toBe('crossing')
    expect(state.missionStatus).toBe('pivot')
    expect(state.activeEventId).toBe('crossing-closed')
    expect(state.blockedEdges).toContain('crossing-to-ford')
    expect(state.flags.crossing_closed).toBe(true)
    expect(state.missionLog.some((e) => e.title === 'PLAN INTERRUPTED')).toBe(
      true,
    )
    expect(state.missionLog.some((e) => e.title === 'ROUTE UNAVAILABLE')).toBe(
      true,
    )
    expect(state.missionLog.some((e) => e.title === 'CROSSING CLOSED')).toBe(
      true,
    )
    expect(state.availableChoiceIds).toEqual([
      'crossing-recon',
      'crossing-reroute',
      'crossing-repair',
      'crossing-hold',
    ])
    expect(state.missionStatus).not.toBe('completed')
  })

  it('Recon after closure reveals River Ford and awards adapt pivot on completion', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-recon')

    expect(state.revealedNodes).toContain('river-ford')
    expect(state.revealedIntel).toContain('alt-river-ford')
    expect(state.discoveries).toContain('river-ford')
    expect(state.pivotCount).toBe(1)
    expect(state.adaptedEventIds).toContain('crossing-closed')
    expect(state.missionStatus).toBe('active')

    state = choose(state, 'take-river-ford')
    expect(state.playerNodeId).toBe('river-ford')

    state = choose(state, 'ford-to-north-choice')
    expect(state.playerNodeId).toBe('north-station')
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.intel).toBe(2)
    expect(state.resources.pivotTokens).toBe(1)
    expect(state.awardedRewardIds).toEqual(
      expect.arrayContaining([
        'supply-complete',
        'supply-ford-intel',
        'supply-adapt-pivot',
      ]),
    )
  })

  it('Reroute after closure adds travel turns and can complete via hills', () => {
    let state = beginSupplyLine()
    const turnBefore = state.turn
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-reroute')

    expect(state.playerNodeId).toBe('eastern-track')
    expect(state.turn).toBe(turnBefore + 2)
    expect(state.pivotCount).toBe(1)
    expect(state.adaptedEventIds).toContain('crossing-closed')

    state = choose(state, 'eastern-to-hills-choice')
    expect(state.playerNodeId).toBe('hills')

    state = choose(state, 'hills-to-north-choice')
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.pivotTokens).toBe(1)
    // River Ford not discovered via this branch
    expect(state.resources.intel).toBe(0)
  })

  it('Repair without materials does not end the mission or reduce pivots', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    const pivots = state.pivotCount

    state = choose(state, 'crossing-repair')

    expect(state.missionStatus).toBe('pivot')
    expect(state.activeEventId).toBe('crossing-closed')
    expect(state.blockedEdges).toContain('crossing-to-ford')
    expect(state.flags.crossing_repaired).toBeUndefined()
    expect(state.pivotCount).toBe(pivots)
    expect(
      state.missionLog.some((e) =>
        e.body.includes('missing materials'),
      ),
    ).toBe(true)
  })

  it('Repair with materials unblocks the crossing approach', () => {
    let state = beginSupplyLine()
    state = {
      ...state,
      resources: { ...state.resources, materials: 2 },
    }
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-repair')

    expect(state.flags.crossing_repaired).toBe(true)
    expect(state.blockedEdges).not.toContain('crossing-to-ford')
    expect(state.resources.materials).toBe(1)
    expect(state.pivotCount).toBe(1)
    expect(state.missionStatus).toBe('active')

    // After repair, River Ford still needs revealing for the take-river-ford choice —
    // reveal it via recon-style follow-up by moving through ford choice after manual reveal.
    state = {
      ...state,
      revealedNodes: [...state.revealedNodes, 'river-ford'],
      revealedIntel: [...state.revealedIntel, 'alt-river-ford'],
      discoveries: [...state.discoveries, 'river-ford'],
      flags: { ...state.flags, discovered_river_ford: true },
    }
    state = choose(state, 'take-river-ford')
    state = choose(state, 'ford-to-north-choice')

    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(6) // 1 remaining + 5 completion
    expect(state.resources.pivotTokens).toBe(1)
    expect(state.resources.intel).toBe(2)
  })

  it('Hold receives updated intel next turn then can finish via River Ford', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-hold')

    expect(state.pivotCount).toBe(1)
    expect(state.pendingIntel.some((p) => p.intelId === 'alt-river-ford')).toBe(
      true,
    )
    expect(state.availableChoiceIds).toEqual(['hold-continue'])

    state = choose(state, 'hold-continue')

    expect(state.revealedIntel).toContain('alt-river-ford')
    expect(state.revealedNodes).toContain('river-ford')
    expect(state.missionLog.some((e) => e.title === 'NEW INTEL')).toBe(true)

    state = choose(state, 'take-river-ford')
    state = choose(state, 'ford-to-north-choice')

    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.intel).toBe(2)
    expect(state.resources.pivotTokens).toBe(1)
  })

  it('Eastern route completes without the crossing pivot', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-eastern')

    expect(state.playerNodeId).toBe('eastern-track')
    expect(state.activeEventId).toBeNull()
    expect(state.flags.plan_eastern).toBe(true)
    expect(state.blockedEdges).not.toContain('crossing-to-ford')

    state = choose(state, 'eastern-to-hills-choice')
    state = choose(state, 'hills-to-north-choice')

    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.pivotTokens).toBe(0)
    expect(state.adaptedEventIds).not.toContain('crossing-closed')
  })

  it('Recon-first reveals River Ford before committing to a plan', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-recon')

    expect(state.revealedIntel).toContain('alt-river-ford')
    expect(state.revealedNodes).toContain('river-ford')
    expect(state.flags.discovered_river_ford).toBe(true)
    expect(state.availableChoiceIds).toEqual([
      'plan-direct',
      'plan-eastern',
      'take-river-ford-from-echo',
    ])

    state = choose(state, 'take-river-ford-from-echo')
    expect(state.playerNodeId).toBe('river-ford')

    state = choose(state, 'ford-to-north-choice')
    expect(state.missionStatus).toBe('completed')
    expect(state.resources.materials).toBe(5)
    expect(state.resources.intel).toBe(2)
    // No crossing-closed adaptation
    expect(state.resources.pivotTokens).toBe(0)
  })

  it('Direct after recon still hits the pivot and can adapt', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-recon')
    state = choose(state, 'plan-direct')

    expect(state.activeEventId).toBe('crossing-closed')
    expect(state.missionStatus).toBe('pivot')

    state = choose(state, 'crossing-reroute')
    state = choose(state, 'eastern-to-hills-choice')
    state = choose(state, 'hills-to-ford-choice')
    state = choose(state, 'ford-to-north-choice')

    expect(state.missionStatus).toBe('completed')
    expect(state.resources.pivotTokens).toBe(1)
    expect(state.resources.intel).toBe(2)
  })

  it('keeps final route history for after-action style summaries', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-recon')
    state = choose(state, 'take-river-ford')
    state = choose(state, 'ford-to-north-choice')

    expect(state.finalRoute[0]).toBe('echo-base')
    expect(state.finalRoute).toContain('crossing')
    expect(state.finalRoute).toContain('river-ford')
    expect(state.finalRoute.at(-1)).toBe('north-station')
    expect(state.originalPlan).toBe('Direct')
    expect(state.lastPivotTitle).toBe('CROSSING CLOSED')
  })
})
