import { describe, expect, it } from 'vitest'
import {
  craftEquipment,
  consumeEquipment,
  equipItem,
  getOwnedQuantity,
  normalizeCraftingState,
  unequipItem,
} from '@/crafting/craftingEngine'
import { LOADOUT_LIMIT } from '@/crafting/craftingTypes'
import {
  createInitialGameState,
  isChoiceAvailable,
  reduceGame,
  startMission,
} from '@/engine'
import { getFrontierMissionRegistry, supplyLineMission } from '@/worlds/frontier'

const registry = getFrontierMissionRegistry()

function withMats(materials = 20, intel = 5) {
  return createInitialGameState({
    resources: {
      materials,
      intel,
      influence: 0,
      experience: 0,
      pivotTokens: 0,
    },
    base: {
      ...createInitialGameState().base,
      buildings: createInitialGameState().base.buildings.map((b) =>
        b.buildingId === 'workshop' ? { ...b, level: 1 } : b,
      ),
    },
  })
}

function beginSupplyLine(state = createInitialGameState({ seed: 11 })) {
  return startMission(state, supplyLineMission).state
}

function choose(state: ReturnType<typeof beginSupplyLine>, choiceId: string) {
  return reduceGame(state, { type: 'SELECT_CHOICE', choiceId }, registry).state
}

describe('Crafting engine', () => {
  it('crafts successfully with enough resources', () => {
    const start = withMats(10, 2)
    const { state, result } = craftEquipment(start, 'field-bridge-kit')
    expect(result.ok).toBe(true)
    expect(state.resources.materials).toBe(5)
    expect(getOwnedQuantity(state.inventory, 'field-bridge-kit')).toBe(1)
  })

  it('refuses craft with insufficient resources and changes nothing', () => {
    const start = withMats(2, 0)
    const snapshot = structuredClone(start)
    const { state, result } = craftEquipment(start, 'field-bridge-kit')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('insufficient_resources')
    expect(state.resources).toEqual(snapshot.resources)
    expect(state.inventory).toEqual(snapshot.inventory)
  })

  it('deducts resources once and increments inventory once per craft', () => {
    let state = withMats(10, 2)
    ;({ state } = craftEquipment(state, 'portable-radio'))
    ;({ state } = craftEquipment(state, 'portable-radio'))
    expect(state.resources.materials).toBe(6)
    expect(getOwnedQuantity(state.inventory, 'portable-radio')).toBe(2)
  })

  it('crafts recon kit spending materials and intel', () => {
    const start = withMats(5, 2)
    const { state, result } = craftEquipment(start, 'recon-kit')
    expect(result.ok).toBe(true)
    expect(state.resources.materials).toBe(2)
    expect(state.resources.intel).toBe(1)
  })

  it('enforces loadout limit of 2', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'portable-radio'))
    ;({ state } = craftEquipment(state, 'recon-kit'))
    ;({ state } = craftEquipment(state, 'repair-kit'))
    ;({ state } = equipItem(state, 'portable-radio'))
    ;({ state } = equipItem(state, 'recon-kit'))
    expect(state.activeLoadout).toHaveLength(LOADOUT_LIMIT)
    const blocked = equipItem(state, 'repair-kit')
    expect(blocked.result.ok).toBe(false)
    if (!blocked.result.ok) expect(blocked.result.reason).toBe('loadout_full')
    expect(blocked.state.activeLoadout).toEqual(['portable-radio', 'recon-kit'])
  })

  it('cannot equip an unowned item', () => {
    const state = withMats()
    const { result } = equipItem(state, 'field-bridge-kit')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unowned')
  })

  it('unequips and allows refill', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'portable-radio'))
    ;({ state } = craftEquipment(state, 'repair-kit'))
    ;({ state } = equipItem(state, 'portable-radio'))
    ;({ state } = unequipItem(state, 'portable-radio'))
    expect(state.activeLoadout).toEqual([])
    ;({ state } = equipItem(state, 'repair-kit'))
    expect(state.activeLoadout).toEqual(['repair-kit'])
  })

  it('consumes equipment exactly once and removes from loadout at zero', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'field-bridge-kit'))
    ;({ state } = equipItem(state, 'field-bridge-kit'))
    state = consumeEquipment(state, 'field-bridge-kit')
    expect(getOwnedQuantity(state.inventory, 'field-bridge-kit')).toBe(0)
    expect(state.activeLoadout).not.toContain('field-bridge-kit')
  })

  it('normalizes old saves missing inventory and loadout', () => {
    const legacy = {
      seed: 1,
      resources: { materials: 1, intel: 0, influence: 0, experience: 0, pivotTokens: 0 },
    }
    const normalized = normalizeCraftingState(legacy)
    expect(normalized.inventory).toEqual([])
    expect(normalized.activeLoadout).toEqual([])
  })
})

describe('Equipment-enabled Supply Line choices', () => {
  it('keeps normal Crossing Closed choices without equipment', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    expect(state.availableChoiceIds).toEqual([
      'crossing-recon',
      'crossing-reroute',
      'crossing-repair',
      'crossing-hold',
    ])
    expect(state.availableChoiceIds).not.toContain('crossing-build-bridge')
  })

  it('exposes Field Bridge Kit choice when equipped', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'field-bridge-kit'))
    ;({ state } = equipItem(state, 'field-bridge-kit'))
    state = beginSupplyLine(state)
    state = choose(state, 'plan-direct')
    expect(state.availableChoiceIds).toContain('crossing-build-bridge')
    expect(state.availableChoiceIds).toEqual(
      expect.arrayContaining([
        'crossing-recon',
        'crossing-reroute',
        'crossing-repair',
        'crossing-hold',
        'crossing-build-bridge',
      ]),
    )
  })

  it('completes Supply Line with zero crafted equipment', () => {
    let state = beginSupplyLine()
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-reroute')
    state = choose(state, 'eastern-to-hills-choice')
    state = choose(state, 'hills-to-north-choice')
    expect(state.missionStatus).toBe('completed')
    expect(state.inventory).toEqual([])
  })

  it('completes Supply Line through Field Bridge Kit path and consumes kit once', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'field-bridge-kit'))
    ;({ state } = equipItem(state, 'field-bridge-kit'))
    state = beginSupplyLine(state)
    state = choose(state, 'plan-direct')
    expect(state.availableChoiceIds).toContain('crossing-build-bridge')

    state = choose(state, 'crossing-build-bridge')
    expect(getOwnedQuantity(state.inventory, 'field-bridge-kit')).toBe(0)
    expect(state.activeLoadout).not.toContain('field-bridge-kit')
    expect(state.flags.bridge_built).toBe(true)
    expect(state.blockedEdges).not.toContain('crossing-to-ford')

    state = choose(state, 'take-river-ford')
    state = choose(state, 'ford-to-north-choice')
    expect(state.missionStatus).toBe('completed')
  })

  it('keeps reusable recon kit after equipment recon', () => {
    let state = withMats()
    ;({ state } = craftEquipment(state, 'recon-kit'))
    ;({ state } = equipItem(state, 'recon-kit'))
    state = beginSupplyLine(state)
    state = choose(state, 'plan-direct')
    state = choose(state, 'crossing-equipment-recon')
    expect(getOwnedQuantity(state.inventory, 'recon-kit')).toBe(1)
    expect(state.activeLoadout).toContain('recon-kit')
    expect(state.revealedNodes).toContain('river-ford')
  })

  it('isChoiceAvailable hides gated choices without loadout', () => {
    const state = beginSupplyLine()
    const choice = supplyLineMission.events
      .find((e) => e.id === 'crossing-closed')!
      .choices.find((c) => c.id === 'crossing-build-bridge')!
    expect(isChoiceAvailable(state, choice)).toBe(false)
  })
})
