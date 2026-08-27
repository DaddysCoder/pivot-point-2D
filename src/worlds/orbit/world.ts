import type { BuildingDefinition, WorldPack } from '@/engine/types'
import { relayDriftMission } from '@/worlds/orbit/missions/relayDrift'
import { orbitTerrain } from '@/worlds/orbit/terrain'

export const orbitBuildings: BuildingDefinition[] = [
  {
    id: 'command',
    name: 'Ops Dome',
    description: 'Orbital command hub.',
    costMaterials: 0,
  },
  {
    id: 'map-room',
    name: 'Astrogation Bay',
    description: 'Improves corridor awareness.',
    costMaterials: 3,
  },
  {
    id: 'workshop',
    name: 'Fab Bench',
    description: 'Supports repair and build actions.',
    costMaterials: 5,
  },
  {
    id: 'storage',
    name: 'Hold',
    description: 'Stores materials and parts.',
    costMaterials: 2,
  },
  {
    id: 'recon',
    name: 'Sensor Mast',
    description: 'Supports reconnaissance scans.',
    costMaterials: 4,
  },
  {
    id: 'archive',
    name: 'Telemetry Archive',
    description: 'Stores scan logs and charts.',
    costMaterials: 4,
  },
  {
    id: 'comms-tower',
    name: 'Uplink Array',
    description: 'Improves Ask / support options.',
    costMaterials: 6,
  },
]

export const orbitWorld: WorldPack = {
  id: 'orbit',
  name: 'WORLD 02 — ORBIT',
  terrain: orbitTerrain,
  buildings: orbitBuildings,
  missions: [relayDriftMission],
  theme: {
    id: 'orbit-blueprint',
    displayName: 'Orbit Blueprint Table',
    primary: '#2f4f5e',
    secondary: '#3d4a55',
    accent: '#4a7a8c',
    paper: '#c5d0d6',
  },
}
