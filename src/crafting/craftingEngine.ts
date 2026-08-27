import {
  getEquipmentDefinition,
  listBlueprints,
} from '@/crafting/blueprintRegistry'
import type {
  CraftResult,
  EquipmentId,
  EquipmentInventoryEntry,
  LoadoutResult,
} from '@/crafting/craftingTypes'
import { LOADOUT_LIMIT } from '@/crafting/craftingTypes'
import type { GameState } from '@/engine/types'

export function getOwnedQuantity(
  inventory: EquipmentInventoryEntry[],
  equipmentId: EquipmentId,
): number {
  return inventory.find((e) => e.equipmentId === equipmentId)?.quantity ?? 0
}

export function hasEquipmentInLoadout(
  loadout: EquipmentId[],
  equipmentId: EquipmentId,
): boolean {
  return loadout.includes(equipmentId)
}

export function loadoutHasAll(
  loadout: EquipmentId[],
  required: EquipmentId[] | undefined,
): boolean {
  if (!required || required.length === 0) return true
  return required.every((id) => loadout.includes(id))
}

/** Ensure inventory / loadout fields exist (old saves). */
export function normalizeCraftingState<T extends Partial<GameState>>(
  state: T,
): T & { inventory: EquipmentInventoryEntry[]; activeLoadout: EquipmentId[] } {
  const inventory = Array.isArray(state.inventory)
    ? state.inventory
        .filter(
          (e): e is EquipmentInventoryEntry =>
            Boolean(e) &&
            typeof e.equipmentId === 'string' &&
            typeof e.quantity === 'number' &&
            e.quantity > 0,
        )
        .map((e) => ({ equipmentId: e.equipmentId, quantity: e.quantity }))
    : []

  const owned = new Set(inventory.map((e) => e.equipmentId))
  const activeLoadout = Array.isArray(state.activeLoadout)
    ? state.activeLoadout
        .filter((id): id is EquipmentId => typeof id === 'string' && owned.has(id))
        .slice(0, LOADOUT_LIMIT)
    : []

  return {
    ...state,
    inventory,
    activeLoadout,
  }
}

export function canCraft(
  state: Pick<GameState, 'resources'>,
  equipmentId: EquipmentId,
): CraftResult {
  const def = getEquipmentDefinition(equipmentId)
  if (!def) return { ok: false, reason: 'unknown_blueprint' }
  const intelCost = def.intelCost ?? 0
  if (
    state.resources.materials < def.materialCost ||
    state.resources.intel < intelCost
  ) {
    return { ok: false, reason: 'insufficient_resources' }
  }
  return { ok: true }
}

/**
 * Craft one unit of equipment. Resources decrement exactly once;
 * inventory increments exactly once. Failed crafts change nothing.
 */
export function craftEquipment(
  state: GameState,
  equipmentId: EquipmentId,
): { state: GameState; result: CraftResult } {
  const check = canCraft(state, equipmentId)
  if (!check.ok) {
    return { state, result: check }
  }
  const def = getEquipmentDefinition(equipmentId)!
  const intelCost = def.intelCost ?? 0
  const existing = getOwnedQuantity(state.inventory, equipmentId)
  const inventory: EquipmentInventoryEntry[] =
    existing > 0
      ? state.inventory.map((e) =>
          e.equipmentId === equipmentId
            ? { ...e, quantity: e.quantity + 1 }
            : e,
        )
      : [...state.inventory, { equipmentId, quantity: 1 }]

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        materials: state.resources.materials - def.materialCost,
        intel: state.resources.intel - intelCost,
      },
      inventory,
    },
    result: { ok: true },
  }
}

export function equipItem(
  state: GameState,
  equipmentId: EquipmentId,
): { state: GameState; result: LoadoutResult } {
  if (getOwnedQuantity(state.inventory, equipmentId) < 1) {
    return { state, result: { ok: false, reason: 'unowned' } }
  }
  if (state.activeLoadout.includes(equipmentId)) {
    return { state, result: { ok: false, reason: 'already_equipped' } }
  }
  if (state.activeLoadout.length >= LOADOUT_LIMIT) {
    return { state, result: { ok: false, reason: 'loadout_full' } }
  }
  return {
    state: {
      ...state,
      activeLoadout: [...state.activeLoadout, equipmentId],
    },
    result: { ok: true },
  }
}

export function unequipItem(
  state: GameState,
  equipmentId: EquipmentId,
): { state: GameState; result: LoadoutResult } {
  if (!state.activeLoadout.includes(equipmentId)) {
    return { state, result: { ok: false, reason: 'not_equipped' } }
  }
  return {
    state: {
      ...state,
      activeLoadout: state.activeLoadout.filter((id) => id !== equipmentId),
    },
    result: { ok: true },
  }
}

/**
 * Decrement inventory for a consumed equipment id exactly once.
 * Removes from loadout when quantity reaches zero.
 */
export function consumeEquipment(
  state: GameState,
  equipmentId: EquipmentId,
): GameState {
  const qty = getOwnedQuantity(state.inventory, equipmentId)
  if (qty < 1) return state

  const nextQty = qty - 1
  const inventory =
    nextQty > 0
      ? state.inventory.map((e) =>
          e.equipmentId === equipmentId ? { ...e, quantity: nextQty } : e,
        )
      : state.inventory.filter((e) => e.equipmentId !== equipmentId)

  const activeLoadout =
    nextQty > 0
      ? state.activeLoadout
      : state.activeLoadout.filter((id) => id !== equipmentId)

  return { ...state, inventory, activeLoadout }
}

/** Consume each listed id once (skips unknown / zero-qty silently). */
export function consumeEquipmentList(
  state: GameState,
  equipmentIds: EquipmentId[] | undefined,
): GameState {
  if (!equipmentIds || equipmentIds.length === 0) return state
  let next = state
  for (const id of equipmentIds) {
    next = consumeEquipment(next, id)
  }
  return next
}

export function blueprintCatalog() {
  return listBlueprints()
}
