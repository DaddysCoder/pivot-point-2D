export type Predictability = 'high' | 'balanced' | 'unpredictable'
export type DecisionLoad = 2 | 3 | 4 | 'open'
export type TimePressure = 'none' | 'gentle' | 'tactical'
export type InformationStyle = 'short' | 'standard' | 'detailed'
export type MotionPreference = 'standard' | 'reduced'
export type TransitionWarning = 'immediate' | '10s' | '30s' | 'player'

export interface PlayStyleSettings {
  predictability: Predictability
  decisionLoad: DecisionLoad
  timePressure: TimePressure
  informationStyle: InformationStyle
  motion: MotionPreference
  musicEnabled: boolean
  effectsEnabled: boolean
  alertsEnabled: boolean
  transitionWarning: TransitionWarning
  /**
   * Adaptive Director — local event selector over pre-authored Pivots.
   * Default off so scripted missions stay deterministic until playtest enables it.
   */
  adaptiveDirectorEnabled: boolean
}

export const defaultPlayStyle: PlayStyleSettings = {
  predictability: 'balanced',
  decisionLoad: 3,
  timePressure: 'none',
  informationStyle: 'standard',
  motion: 'standard',
  musicEnabled: false,
  effectsEnabled: true,
  alertsEnabled: true,
  transitionWarning: 'player',
  adaptiveDirectorEnabled: false,
}
