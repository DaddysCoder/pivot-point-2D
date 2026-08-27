import { getEquipmentDefinition } from '@/crafting/blueprintRegistry'
import {
  DIRECTOR_SCORE_THRESHOLD,
  DIRECTOR_SCORE_WEIGHTS,
  DIRECTOR_PREDICTABILITY,
} from '@/director/directorRules'
import {
  countDirectorTriggers,
  lastDirectorCategory,
} from '@/director/directorMemory'
import type {
  DirectorEventMeta,
  DirectorScoreResult,
  ScoreContext,
} from '@/director/directorTypes'
import type { MissionDefinition } from '@/engine/types'

function loadoutTags(state: ScoreContext['state']): Set<string> {
  const tags = new Set<string>()
  for (const id of state.activeLoadout ?? []) {
    const def = getEquipmentDefinition(id)
    for (const tag of def?.tags ?? []) tags.add(tag)
  }
  return tags
}

function nodeTags(mission: MissionDefinition, nodeId: string | null): Set<string> {
  const tags = new Set<string>()
  if (!nodeId) return tags
  const node = mission.map.nodes.find((n) => n.id === nodeId)
  for (const tag of node?.tags ?? []) tags.add(tag)
  // Terrain id acts as a soft affinity key (crossing, road, hills…).
  if (node?.terrainId) tags.add(node.terrainId)
  return tags
}

function recentlyResolvedPivot(state: ScoreContext['state']): boolean {
  return Boolean(state.activeEventId) || state.missionStatus === 'pivot'
}

export function scoreDirectorEvent(ctx: ScoreContext): DirectorScoreResult {
  const { state, mission, meta, predictability } = ctx
  const reasons: string[] = []
  let score = 0
  let eligible = true

  const director = state.director
  if (!director) {
    return { score: 0, reasonCodes: ['no_director_state'], eligible: false }
  }

  const used = countDirectorTriggers(director, meta.eventId)
  const max = meta.maxPerMission ?? 1
  if (used >= max) {
    score += DIRECTOR_SCORE_WEIGHTS.alreadyMaxed
    reasons.push('max_per_mission')
    eligible = false
  }

  if (director.cooldownRemaining > 0) {
    score += DIRECTOR_SCORE_WEIGHTS.insideCooldown
    reasons.push('inside_cooldown')
    eligible = false
  }

  if (meta.minTurn != null && state.turn < meta.minTurn) {
    score += DIRECTOR_SCORE_WEIGHTS.nonsensical
    reasons.push('before_min_turn')
    eligible = false
  }

  if (state.triggeredEventIds.includes(meta.eventId)) {
    // Mission already used this id (scripted or prior inject).
    score += DIRECTOR_SCORE_WEIGHTS.alreadyMaxed
    reasons.push('already_triggered')
    eligible = false
  }

  if (director.intensityAvailable < meta.intensityCost) {
    score += DIRECTOR_SCORE_WEIGHTS.intensityTooHigh
    reasons.push('intensity_budget_low')
    eligible = false
  }

  // Map compatibility
  const tags = nodeTags(mission, state.playerNodeId)
  const mapHit = meta.mapAffinityTags?.some((t) => tags.has(t)) ?? false
  if (mapHit) {
    score += DIRECTOR_SCORE_WEIGHTS.mapCompatible
    reasons.push('map_compatible')
  } else if (!meta.mapAffinityTags?.length) {
    score += Math.floor(DIRECTOR_SCORE_WEIGHTS.mapCompatible / 3)
    reasons.push('map_neutral')
  }

  // Unused category
  const seenCategories = new Set(director.history.map((h) => h.category))
  const unused = meta.categories.some((c) => !seenCategories.has(c))
  if (unused) {
    score += DIRECTOR_SCORE_WEIGHTS.unusedCategory
    reasons.push('unused_category')
  }

  // Loadout affinity — modest bonus only; never a hard trigger.
  const equipped = loadoutTags(state)
  const affinity = meta.loadoutAffinityTags?.some((t) => equipped.has(t)) ?? false
  if (affinity) {
    score += DIRECTOR_SCORE_WEIGHTS.loadoutAffinity
    reasons.push('equipment_opportunity')
  }

  // Tactical level — mid-intensity events fit level 2+ better.
  if (mission.tacticalLevel >= 2 && meta.intensityCost >= 20) {
    score += DIRECTOR_SCORE_WEIGHTS.tacticalLevelMatch
    reasons.push('tactical_level_match')
  }

  // Category freshness vs consecutive repeat
  const lastCat = lastDirectorCategory(director)
  const primary = meta.categories[0]
  if (lastCat && primary && lastCat === primary) {
    score += DIRECTOR_SCORE_WEIGHTS.consecutiveCategory
    reasons.push('repeats_previous_category')
  } else if (primary && lastCat !== primary) {
    score += DIRECTOR_SCORE_WEIGHTS.categoryFresh
    reasons.push('category_fresh')
  }

  // Variety: if recent actions are monotone, prefer events inviting other verbs.
  const recent = director.recentActionTypes
  if (recent.length >= 3) {
    const dominant = recent[0]
    const allSame = recent.every((a) => a === dominant)
    if (allSame && meta.invitedActionTypes?.length) {
      if (!meta.invitedActionTypes.includes(dominant!)) {
        score += DIRECTOR_SCORE_WEIGHTS.varietyInvite
        reasons.push('action_variety')
      }
    }
  }

  // Just resolved a pivot (adapted this mission recently relative to turn)
  if (state.adaptedEventIds.length > 0 && director.cooldownRemaining > 0) {
    score += DIRECTOR_SCORE_WEIGHTS.justResolvedPivot
    reasons.push('recent_pivot_resolution')
  }

  // Resource event when materials already 0 is still OK (adapt path exists),
  // but avoid if it would be nonsensical with no choices possible — library events always have adapt/hold.
  if (meta.categories.includes('resource') && state.resources.materials <= 0) {
    // Still eligible; slight caution
    score -= 5
    reasons.push('resource_already_tight')
  }

  if (predictability === 'high') {
    score += DIRECTOR_SCORE_WEIGHTS.highPredictabilityCaution
    reasons.push('high_predictability_caution')
  }

  if (recentlyResolvedPivot(state)) {
    eligible = false
    reasons.push('active_pivot_block')
  }

  const threshold =
    DIRECTOR_SCORE_THRESHOLD +
    (DIRECTOR_PREDICTABILITY[predictability]?.scoreThresholdBonus ?? 0)

  if (eligible && score < threshold) {
    eligible = false
    reasons.push('below_score_threshold')
  }

  return { score, reasonCodes: reasons, eligible }
}

export function explainCandidate(
  meta: DirectorEventMeta,
  result: DirectorScoreResult,
  title: string,
) {
  return {
    eventId: meta.eventId,
    title,
    score: result.score,
    reasonCodes: result.reasonCodes,
    eligible: result.eligible,
  }
}
