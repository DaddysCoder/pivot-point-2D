import routeBlocked from '@/assets/frontier/events/route-blocked.jpg'
import newIntel from '@/assets/frontier/events/new-intel.jpg'
import resourceLost from '@/assets/frontier/events/resource-lost.jpg'
import conditionsChanged from '@/assets/frontier/events/conditions-changed.jpg'
import objectiveUpdated from '@/assets/frontier/events/objective-updated.jpg'
import pivotGeneric from '@/assets/frontier/events/pivot-generic.jpg'
import type { MissionLogTone } from '@/engine/types'

/** Illustrated Pivot Event backdrops for the Frontier world pack, keyed by the event's status tone. */
export const FRONTIER_PIVOT_ART: Partial<Record<MissionLogTone, string>> = {
  route_unavailable: routeBlocked,
  plan_interrupted: routeBlocked,
  new_intel: newIntel,
  resource_lost: resourceLost,
  conditions_changed: conditionsChanged,
  objective_updated: objectiveUpdated,
  info: pivotGeneric,
  pivot: pivotGeneric,
}

export function frontierPivotArtFor(tone: MissionLogTone): string | undefined {
  return FRONTIER_PIVOT_ART[tone]
}
