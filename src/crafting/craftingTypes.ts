/** Workshop crafting domain types — UI-independent. */

export type EquipmentId =
  | 'field-bridge-kit'
  | 'repair-kit'
  | 'recon-kit'
  | 'portable-radio'
  | 'supply-cache'
  | 'route-markers'

export interface EquipmentDefinition {
  id: EquipmentId
  name: string
  description: string
  /** Short game-world purpose shown in the locker. */
  purpose: string
  materialCost: number
  intelCost?: number
  tags: string[]
  /**
   * When true, using a choice that lists this id in consumeEquipment
   * decrements inventory exactly once.
   */
  consumedOnUse: boolean
}

export interface EquipmentInventoryEntry {
  equipmentId: EquipmentId
  quantity: number
}

/** Maximum equipment types that may be equipped for a mission. */
export const LOADOUT_LIMIT = 2

export type CraftResult =
  | { ok: true }
  | { ok: false; reason: 'unknown_blueprint' | 'insufficient_resources' }

export type LoadoutResult =
  | { ok: true }
  | {
      ok: false
      reason: 'unowned' | 'already_equipped' | 'loadout_full' | 'not_equipped'
    }
