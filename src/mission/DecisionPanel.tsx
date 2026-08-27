import { useMemo, useState } from 'react'
import type { DecisionChoice, ResourceState } from '@/engine/types'
import { Button } from '@/components/Button'
import { ActionMark } from '@/mission/ActionMark'
import { actionTypeLabel } from '@/mission/actionTypeLabel'
import { applyDecisionLoad, uniqueActionTypes } from '@/mission/decisionLoad'
import {
  ACTION_GLOSSARY,
  isCompletionChoice,
  missingResourceSummary,
} from '@/mission/instructions'
import type { InformationStyle } from '@/settings/playStyleTypes'

interface DecisionPanelProps {
  choices: DecisionChoice[]
  onSelect: (choiceId: string) => void
  decisionLoad: 2 | 3 | 4 | 'open'
  informationStyle: InformationStyle
  disabled?: boolean
  resources?: ResourceState
  showNowHelp?: boolean
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

export function DecisionPanel({
  choices,
  onSelect,
  decisionLoad,
  informationStyle,
  disabled = false,
  resources,
  showNowHelp = false,
}: DecisionPanelProps) {
  const [showMore, setShowMore] = useState(false)
  const { visible, extra } = useMemo(
    () => applyDecisionLoad(choices, decisionLoad),
    [choices, decisionLoad],
  )
  const listed = showMore ? [...visible, ...extra] : visible
  const actionTypes = uniqueActionTypes(listed)

  if (choices.length === 0) {
    return (
      <div role="status" className="space-y-2 text-sm text-[var(--pp-route)]">
        <p>
          No actions listed. Open How to Play, or return to Base and try another
          approach. This is not a failure.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {showNowHelp ? (
        <div data-tutorial-target="actions" className="text-sm text-[var(--pp-route)]">
          <p className="font-semibold text-[var(--pp-ink)]">What do I do now?</p>
          <p className="mt-1">
            Choose one listed action. That choice moves the mission forward. The map
            is a visual record; it does not move you.
          </p>
          {actionTypes.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {actionTypes.map((type) => (
                <li key={type}>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--pp-accent)]">
                    {actionTypeLabel(type)}
                  </span>
                  {' — '}
                  {ACTION_GLOSSARY[type]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2" role="group" aria-label="Available actions">
        {listed.map((choice) => {
          const resourceOk = meetsResources(choice, resources)
          const unavailable = disabled || !resourceOk
          const missing = missingResourceSummary(choice.requireResources, resources)
          const complete = isCompletionChoice(choice)
          return (
            <Button
              key={choice.id}
              variant={complete ? 'primary' : 'secondary'}
              className={`h-auto min-h-14 w-full flex-row items-start justify-start gap-3 whitespace-normal px-3 py-3 text-left ${
                complete
                  ? 'border-l-4 border-l-[var(--pp-copper)] ring-1 ring-[var(--pp-copper)]'
                  : 'border-l-4 border-l-[var(--pp-copper)]'
              }`}
              disabled={unavailable}
              aria-disabled={unavailable}
              title={resourceOk ? choice.description : (missing ?? undefined)}
              onClick={() => onSelect(choice.id)}
            >
              <ActionMark actionType={choice.actionType} size={32} />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-accent)]">
                  {actionTypeLabel(choice.actionType)}
                  {choice.requireEquipment?.length ? ' · Kit' : ''}
                  {complete ? ' · Complete objective' : ''}
                </span>
                <span className="pp-display text-lg leading-tight">{choice.label}</span>
                {informationStyle !== 'short' ? (
                  <span className="mt-1 text-sm font-normal text-[var(--pp-route)]">
                    {informationStyle === 'detailed'
                      ? choice.description
                      : choice.description.slice(0, 90) +
                        (choice.description.length > 90 ? '…' : '')}
                    {missing ? ` ${missing}` : ''}
                  </span>
                ) : missing ? (
                  <span className="mt-1 text-sm font-normal text-[var(--pp-route)]">
                    {missing}
                  </span>
                ) : null}
              </span>
            </Button>
          )
        })}
      </div>

      {extra.length > 0 && !showMore ? (
        <Button
          variant="ghost"
          onClick={() => setShowMore(true)}
          aria-expanded={false}
        >
          More options ({extra.length})
        </Button>
      ) : null}
    </div>
  )
}
