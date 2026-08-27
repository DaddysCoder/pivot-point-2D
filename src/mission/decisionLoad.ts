import type { ActionType, DecisionChoice } from '@/engine/types'

/**
 * Decision load limits how many baseline options are shown first.
 * Remaining unique routes stay available behind "More options".
 * Equipment-gated choices are additive and always appended.
 */
export function applyDecisionLoad(
  choices: DecisionChoice[],
  decisionLoad: 2 | 3 | 4 | 'open',
): { visible: DecisionChoice[]; extra: DecisionChoice[] } {
  if (decisionLoad === 'open') {
    return { visible: choices, extra: [] }
  }
  const baseline: DecisionChoice[] = []
  const equipment: DecisionChoice[] = []
  for (const choice of choices) {
    if (choice.requireEquipment?.length) {
      equipment.push(choice)
    } else {
      baseline.push(choice)
    }
  }
  const extra = baseline.slice(decisionLoad)
  return {
    visible: [...baseline.slice(0, decisionLoad), ...equipment],
    extra,
  }
}

export function uniqueActionTypes(choices: DecisionChoice[]): ActionType[] {
  const seen = new Set<ActionType>()
  const order: ActionType[] = []
  for (const choice of choices) {
    if (!seen.has(choice.actionType)) {
      seen.add(choice.actionType)
      order.push(choice.actionType)
    }
  }
  return order
}
