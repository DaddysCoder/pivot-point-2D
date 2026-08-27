import type { TerrainDefinition } from '@/engine/types'

export const frontierTerrain: TerrainDefinition[] = [
  { id: 'base', name: 'Base', walkable: true, tags: ['facility'] },
  { id: 'road', name: 'Road', walkable: true, tags: ['route'] },
  { id: 'crossing', name: 'Crossing', walkable: true, tags: ['route', 'bridge'] },
  { id: 'river', name: 'Ford', walkable: true, tags: ['water', 'alt'] },
  { id: 'hills', name: 'Hills', walkable: true, tags: ['rough'] },
  { id: 'track', name: 'Track', walkable: true, tags: ['route'] },
  { id: 'forest', name: 'Forest', walkable: true, tags: ['cover'] },
]
