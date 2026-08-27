/** Tunable Adaptive Director rules — turns only, no real-time timers. */

export const DIRECTOR_INTENSITY_MAX = 100
export const DIRECTOR_INTENSITY_RECOVERY_PER_TICK = 12
export const DIRECTOR_DEFAULT_COOLDOWN = 2
export const DIRECTOR_MANUAL_COOLDOWN = 2
export const DIRECTOR_RECENT_ACTION_WINDOW = 5

/** Minimum score required for a candidate to be selectable. */
export const DIRECTOR_SCORE_THRESHOLD = 15

/** Predictability frequency multipliers applied to the selection threshold. */
export const DIRECTOR_PREDICTABILITY = {
  high: {
    scoreThresholdBonus: 12,
    intensityRecovery: 10,
  },
  balanced: {
    scoreThresholdBonus: 0,
    intensityRecovery: 12,
  },
  unpredictable: {
    scoreThresholdBonus: -8,
    intensityRecovery: 14,
  },
} as const

export const DIRECTOR_SCORE_WEIGHTS = {
  mapCompatible: 30,
  unusedCategory: 20,
  loadoutAffinity: 15,
  tacticalLevelMatch: 10,
  categoryFresh: 10,
  varietyInvite: 8,
  alreadyMaxed: -100,
  insideCooldown: -80,
  consecutiveCategory: -60,
  nonsensical: -50,
  justResolvedPivot: -40,
  intensityTooHigh: -30,
  highPredictabilityCaution: -10,
} as const
