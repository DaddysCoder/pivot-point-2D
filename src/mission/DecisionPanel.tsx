import type { DecisionChoice, ResourceState } from '@/engine/types'
import { Button } from '@/components/Button'
import { ActionMark } from '@/mission/ActionMark'
import { actionTypeLabel } from '@/mission/actionTypeLabel'
import type { InformationStyle } from '@/settings/playStyleTypes'

interface DecisionPanelProps {
  choices: DecisionChoice[]
  onSelect: (choiceId: string) => void
  decisionLoad: 2 | 3 | 4 | 'open'
  informationStyle: InformationStyle
  disabled?: boolean
  resources?: ResourceState
}

function meetsResources(
  choice: DecisionChoice,
  resources?: ResourceState,
): boolean {
  if (!choice.requireResources || !resources) return true
  for (const [key, amount] of Object.entries(choice.requireResources)) {
    const resourceKey = key as keyof ResourceState
    if (resources[resourceKey] < (amount ?? 0)) {
      return false
    }
  }
  return true
}

/**
 * Decision load limits baseline options. Equipment-gated choices are additive
 * and always appended when already exposed by the engine/loadout.
 */
function applyDecisionLoad(
  choices: DecisionChoice[],
  decisionLoad: 2 | 3 | 4 | 'open',
): DecisionChoice[] {
  if (decisionLoad === 'open') return choices
  const baseline: DecisionChoice[] = []
  const equipment: DecisionChoice[] = []
  for (const choice of choices) {
    if (choice.requireEquipment?.length) {
      equipment.push(choice)
    } else {
      baseline.push(choice)
    }
  }
  return [...baseline.slice(0, decisionLoad), ...equipment]
}

export function DecisionPanel({
  choices,
  onSelect,
  decisionLoad,
  informationStyle,
  disabled = false,
  resources,
}: DecisionPanelProps) {
  const limited = applyDecisionLoad(choices, decisionLoad)

  return (
    <div className="grid gap-2" role="group" aria-label="Available actions">
      {limited.map((choice) => {
        const resourceOk = meetsResources(choice, resources)
        const unavailable = disabled || !resourceOk
        return (
          <Button
            key={choice.id}
            variant="secondary"
            className="h-auto min-h-14 w-full flex-row items-start justify-start gap-3 whitespace-normal border-l-4 border-l-[var(--pp-copper)] px-3 py-3 text-left"
            disabled={unavailable}
            aria-disabled={unavailable}
            title={
              resourceOk
                ? choice.description
                : 'Requirements for that approach are not met'
            }
            onClick={() => onSelect(choice.id)}
          >
            <ActionMark actionType={choice.actionType} size={32} />
            <span className="flex min-w-0 flex-col items-start">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-accent)]">
                {actionTypeLabel(choice.actionType)}
                {choice.requireEquipment?.length ? ' · Kit' : ''}
              </span>
              <span className="pp-display text-lg leading-tight">{choice.label}</span>
              {informationStyle !== 'short' ? (
                <span className="mt-1 text-sm font-normal text-[var(--pp-route)]">
                  {informationStyle === 'detailed'
                    ? choice.description
                    : choice.description.slice(0, 90) +
                      (choice.description.length > 90 ? '…' : '')}
                  {!resourceOk ? ' (unavailable — find another move)' : ''}
                </span>
              ) : null}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
