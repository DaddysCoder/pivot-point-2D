import type { DirectorEventMeta } from '@/director/directorTypes'

/**
 * Director metadata for vetted library / mission events.
 * Kept separate from player-facing Pivot copy.
 */
export const DIRECTOR_EVENT_META: readonly DirectorEventMeta[] = [
  {
    eventId: 'lib-route-blocked',
    categories: ['route'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['build', 'route'],
    mapAffinityTags: ['crossing', 'road', 'main'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['recon', 'reroute', 'hold', 'build'],
  },
  {
    eventId: 'lib-intel-conflict',
    categories: ['intel', 'communication'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['recon', 'ask', 'comms'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['ask', 'recon'],
  },
  {
    eventId: 'lib-resource-short',
    categories: ['resource'],
    intensityCost: 25,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['supply'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['adapt', 'ask', 'hold'],
  },
  {
    eventId: 'lib-weather',
    categories: ['environment'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    mapAffinityTags: ['road', 'hills', 'river'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['hold', 'reroute'],
  },
  {
    eventId: 'lib-waiting',
    categories: ['waiting', 'communication'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['ask', 'comms'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['hold', 'continue', 'ask'],
  },
  {
    eventId: 'lib-objective-shift',
    categories: ['objective'],
    intensityCost: 35,
    maxPerMission: 1,
    minTurn: 2,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    supportsAdvanceWarning: true,
    invitedActionTypes: ['adapt'],
  },
  {
    eventId: 'sl-support-delay',
    categories: ['waiting', 'communication'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['ask', 'comms'],
    invitedActionTypes: ['hold', 'adapt', 'ask'],
  },
  {
    eventId: 'sl-manual-intel',
    categories: ['intel'],
    intensityCost: 20,
    maxPerMission: 1,
    compatibleWorlds: ['frontier'],
    compatibleMissionIds: ['supply-line'],
    loadoutAffinityTags: ['recon'],
    invitedActionTypes: ['adapt', 'recon'],
  },
] as const

/** Missions where Adaptive Director may run during initial rollout. */
export const DIRECTOR_ALLOWED_MISSIONS = new Set<string>(['supply-line'])

const META_BY_ID = new Map(DIRECTOR_EVENT_META.map((m) => [m.eventId, m]))

export function getDirectorEventMeta(
  eventId: string,
): DirectorEventMeta | undefined {
  return META_BY_ID.get(eventId)
}

export function listDirectorEventMeta(): readonly DirectorEventMeta[] {
  return DIRECTOR_EVENT_META
}

export function isDirectorMissionAllowed(missionId: string): boolean {
  return DIRECTOR_ALLOWED_MISSIONS.has(missionId)
}

export function directorCandidatesForMission(
  missionId: string,
  worldId: string,
): DirectorEventMeta[] {
  return DIRECTOR_EVENT_META.filter((meta) => {
    if (meta.compatibleMissionIds && !meta.compatibleMissionIds.includes(missionId)) {
      return false
    }
    if (meta.compatibleWorlds && !meta.compatibleWorlds.includes(worldId)) {
      return false
    }
    return true
  })
}
