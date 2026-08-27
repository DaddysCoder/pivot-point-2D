import type { MissionDefinition, WorldPack } from '@/engine/types'
import { frontierWorld } from '@/worlds/frontier/world'
import { orbitWorld } from '@/worlds/orbit/world'
import { railWorld } from '@/worlds/rail/world'

export const WORLD_PACKS: WorldPack[] = [frontierWorld, orbitWorld, railWorld]

export function getWorldPack(worldId: string): WorldPack | undefined {
  return WORLD_PACKS.find((w) => w.id === worldId)
}

export function buildMissionRegistry(
  customMissions: MissionDefinition[] = [],
): Map<string, MissionDefinition> {
  const map = new Map<string, MissionDefinition>()
  for (const world of WORLD_PACKS) {
    for (const mission of world.missions) {
      map.set(mission.id, mission)
    }
  }
  for (const mission of customMissions) {
    map.set(mission.id, mission)
  }
  return map
}

export function listPackMissions(worldId?: string): MissionDefinition[] {
  const worlds = worldId
    ? WORLD_PACKS.filter((w) => w.id === worldId)
    : WORLD_PACKS
  return worlds.flatMap((w) => w.missions)
}
