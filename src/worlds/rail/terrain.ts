import type { TerrainDefinition } from '@/engine/types'

export const railTerrain: TerrainDefinition[] = [
  { id: 'base', name: 'Station', walkable: true, tags: ['facility'] },
  { id: 'road', name: 'Track', walkable: true, tags: ['route'] },
  { id: 'crossing', name: 'Junction', walkable: true, tags: ['route'] },
  { id: 'river', name: 'Viaduct', walkable: true, tags: ['bridge', 'alt'] },
  { id: 'hills', name: 'Cutting', walkable: true, tags: ['rough'] },
  { id: 'track', name: 'Siding', walkable: true, tags: ['route'] },
  { id: 'forest', name: 'Embankment', walkable: true, tags: ['cover'] },
]
