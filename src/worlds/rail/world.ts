import type { BuildingDefinition, WorldPack } from '@/engine/types'
import { signalBlockMission } from '@/worlds/rail/missions/signalBlock'
import { railTerrain } from '@/worlds/rail/terrain'

export const railBuildings: BuildingDefinition[] = [
  {
    id: 'command',
    name: 'Control Cabin',
    description: 'Signal and traffic control.',
    costMaterials: 0,
  },
  {
    id: 'map-room',
    name: 'Diagram Room',
    description: 'Improves route awareness.',
    costMaterials: 3,
  },
  {
    id: 'workshop',
    name: 'Fitters Shop',
    description: 'Supports repair and build actions.',
    costMaterials: 5,
  },
  {
    id: 'storage',
    name: 'Goods Shed',
    description: 'Stores materials and parts.',
    costMaterials: 2,
  },
  {
    id: 'recon',
    name: 'Lookout',
    description: 'Supports reconnaissance checks.',
    costMaterials: 4,
  },
  {
    id: 'archive',
    name: 'Timetable Archive',
    description: 'Stores working timetables.',
    costMaterials: 4,
  },
  {
    id: 'comms-tower',
    name: 'Wire Mast',
    description: 'Improves Ask / support options.',
    costMaterials: 6,
  },
]

export const railWorld: WorldPack = {
  id: 'rail',
  name: 'WORLD 03 — RAIL',
  terrain: railTerrain,
  buildings: railBuildings,
  missions: [signalBlockMission],
  theme: {
    id: 'rail-diagram',
    displayName: 'Railway Diagram Table',
    primary: '#4a4035',
    secondary: '#6b5a45',
    accent: '#8b4513',
    paper: '#d2c4a8',
  },
}
