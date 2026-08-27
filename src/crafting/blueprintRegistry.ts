import type { EquipmentDefinition, EquipmentId } from '@/crafting/craftingTypes'

export const EQUIPMENT_BLUEPRINTS: readonly EquipmentDefinition[] = [
  {
    id: 'field-bridge-kit',
    name: 'Field Bridge Kit',
    description: 'Deployable components for temporary crossings.',
    purpose: 'Spans a damaged crossing long enough for the column to pass.',
    materialCost: 5,
    tags: ['build', 'crossing'],
    consumedOnUse: true,
  },
  {
    id: 'repair-kit',
    name: 'Repair Kit',
    description: 'Field tools and bracing for equipment repair.',
    purpose: 'Restores damaged gear and fittings when the situation allows.',
    materialCost: 3,
    tags: ['repair'],
    consumedOnUse: true,
  },
  {
    id: 'recon-kit',
    name: 'Recon Kit',
    description: 'Optics and survey tools for closer observation.',
    purpose: 'Pulls additional terrain detail when the map goes quiet.',
    materialCost: 3,
    intelCost: 1,
    tags: ['recon'],
    consumedOnUse: false,
  },
  {
    id: 'portable-radio',
    name: 'Portable Radio',
    description: 'Handset and antenna for short-range contact.',
    purpose: 'Keeps another line of communication open when plans change.',
    materialCost: 2,
    tags: ['ask', 'comms'],
    consumedOnUse: false,
  },
  {
    id: 'supply-cache',
    name: 'Supply Cache',
    description: 'Compact stores for one shortfall on the road.',
    purpose: 'Offsets a single compatible resource shortage in the field.',
    materialCost: 4,
    tags: ['supply'],
    consumedOnUse: true,
  },
  {
    id: 'route-markers',
    name: 'Route Markers',
    description: 'Flags and notes for marking an alternate path.',
    purpose: 'Preserves or reveals an alternate path when the mission supports it.',
    materialCost: 2,
    intelCost: 1,
    tags: ['route'],
    consumedOnUse: true,
  },
] as const

const BY_ID = new Map(EQUIPMENT_BLUEPRINTS.map((b) => [b.id, b]))

export function getEquipmentDefinition(
  id: EquipmentId,
): EquipmentDefinition | undefined {
  return BY_ID.get(id)
}

export function listBlueprints(): readonly EquipmentDefinition[] {
  return EQUIPMENT_BLUEPRINTS
}
