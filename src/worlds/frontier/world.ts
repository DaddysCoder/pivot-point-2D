import type { BuildingDefinition, WorldPack } from '@/engine/types'
import { brokenConnectionMission } from '@/worlds/frontier/missions/brokenConnection'
import { missingReconMission } from '@/worlds/frontier/missions/missingRecon'
import { supplyLineMission } from '@/worlds/frontier/missions/supplyLine'
import { frontierTerrain } from '@/worlds/frontier/terrain'

export const frontierBuildings: BuildingDefinition[] = [
  {
    id: 'command',
    name: 'Command Tent',
    description: 'Coordination hub for missions.',
    costMaterials: 0,
  },
  {
    id: 'map-room',
    name: 'Map Room',
    description: 'Improves route awareness.',
    costMaterials: 3,
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Supports repair and build actions.',
    costMaterials: 5,
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Holds materials and supplies.',
    costMaterials: 2,
  },
  {
    id: 'recon',
    name: 'Recon Post',
    description: 'Supports reconnaissance missions.',
    costMaterials: 4,
  },
  {
    id: 'archive',
    name: 'Archive',
    description: 'Stores mission intel and maps.',
    costMaterials: 4,
  },
  {
    id: 'comms-tower',
    name: 'Communications Tower',
    description: 'Improves Ask / support options.',
    costMaterials: 6,
  },
]

export const frontierWorld: WorldPack = {
  id: 'frontier',
  name: 'WORLD 01 — FRONTIER',
  terrain: frontierTerrain,
  buildings: frontierBuildings,
  missions: [supplyLineMission, missingReconMission, brokenConnectionMission],
  theme: {
    id: 'frontier-command',
    displayName: 'Frontier Command Table',
    primary: '#3d5a3a',
    secondary: '#5c4a32',
    accent: '#6b5a2e',
    paper: '#d4c9a8',
  },
}

export function getFrontierMissionRegistry(): Map<
  string,
  (typeof frontierWorld.missions)[number]
> {
  return new Map(frontierWorld.missions.map((m) => [m.id, m]))
}
