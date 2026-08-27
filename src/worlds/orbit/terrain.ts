import type { TerrainDefinition } from '@/engine/types'

export const orbitTerrain: TerrainDefinition[] = [
  { id: 'base', name: 'Habitat', walkable: true, tags: ['facility'] },
  { id: 'road', name: 'Transit', walkable: true, tags: ['route'] },
  { id: 'crossing', name: 'Dock Gate', walkable: true, tags: ['route'] },
  { id: 'river', name: 'Plasma Channel', walkable: true, tags: ['hazard', 'alt'] },
  { id: 'hills', name: 'Asteroid Rise', walkable: true, tags: ['rough'] },
  { id: 'track', name: 'Service Rail', walkable: true, tags: ['route'] },
  { id: 'forest', name: 'Debris Field', walkable: true, tags: ['cover'] },
]
