import type {
  EngineResult,
  GameState,
  MissionDefinition,
  MissionReward,
  ResourceState,
} from '@/engine/types'

function matchesReward(state: GameState, reward: MissionReward): boolean {
  if (state.awardedRewardIds.includes(reward.id)) {
    return false
  }

  if (reward.onComplete) {
    return state.missionStatus === 'completed'
  }

  if (reward.requireFlags) {
    for (const [flag, expected] of Object.entries(reward.requireFlags)) {
      if (Boolean(state.flags[flag]) !== expected) {
        return false
      }
    }
  }

  if (reward.requireIntel) {
    for (const intelId of reward.requireIntel) {
      if (!state.revealedIntel.includes(intelId)) {
        return false
      }
    }
  }

  if (reward.requireAdaptedEvent) {
    if (!state.adaptedEventIds.includes(reward.requireAdaptedEvent)) {
      return false
    }
  }

  // Conditional rewards without onComplete still require mission completion
  // unless they only track mid-mission discovery — award at completion time.
  return state.missionStatus === 'completed'
}

function addRewards(
  resources: ResourceState,
  reward: MissionReward,
): ResourceState {
  return {
    materials: resources.materials + (reward.materials ?? 0),
    intel: resources.intel + (reward.intel ?? 0),
    influence: resources.influence + (reward.influence ?? 0),
    experience: resources.experience + (reward.experience ?? 0),
    pivotTokens: resources.pivotTokens + (reward.pivotTokens ?? 0),
  }
}

/**
 * Award mission rewards based on outcomes. Safe to call multiple times;
 * each reward id is granted at most once.
 */
export function applyMissionRewards(
  state: GameState,
  mission: MissionDefinition,
): EngineResult {
  if (state.missionStatus !== 'completed') {
    return { state, events: [] }
  }

  let next = state
  const awarded: string[] = []

  for (const reward of mission.rewards) {
    if (!matchesReward(next, reward)) {
      continue
    }
    next = {
      ...next,
      resources: addRewards(next.resources, reward),
      awardedRewardIds: [...next.awardedRewardIds, reward.id],
    }
    awarded.push(reward.id)
  }

  return {
    state: next,
    events: awarded.map((id) => ({
      type: 'REWARD_GRANTED',
      payload: { rewardId: id },
    })),
  }
}

export function summarizeRewards(state: GameState): ResourceState {
  return { ...state.resources }
}
