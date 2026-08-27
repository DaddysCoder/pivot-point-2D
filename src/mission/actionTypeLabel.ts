import type { ActionType } from '@/engine/types'

const LABELS: Record<ActionType, string> = {
  recon: 'Recon',
  adapt: 'Adapt',
  repair: 'Repair',
  reroute: 'Reroute',
  hold: 'Hold',
  ask: 'Ask',
  build: 'Build',
  retreat: 'Retreat',
  move: 'Move',
  continue: 'Continue',
}

export function actionTypeLabel(actionType: ActionType): string {
  return LABELS[actionType] ?? actionType
}
