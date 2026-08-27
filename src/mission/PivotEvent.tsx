import type {
  DecisionChoice,
  MissionLogTone,
  PivotEventDefinition,
  ResourceState,
} from '@/engine/types'
import { Modal } from '@/components/Modal'
import { DecisionPanel } from '@/mission/DecisionPanel'
import type { DecisionLoad, InformationStyle } from '@/settings/playStyleTypes'
import { frontierPivotArtFor } from '@/worlds/frontier/pivotArt'

interface PivotEventProps {
  event: PivotEventDefinition
  choices: DecisionChoice[]
  open: boolean
  onSelect: (choiceId: string) => void
  decisionLoad: DecisionLoad
  informationStyle: InformationStyle
  predictability: 'high' | 'balanced' | 'unpredictable'
  resources?: ResourceState
  worldId?: string
}

const CONDITION_COPY: Record<MissionLogTone, string> = {
  info: 'NEW INTEL',
  plan_interrupted: 'CONDITIONS CHANGED',
  new_intel: 'NEW INTEL',
  conditions_changed: 'CONDITIONS CHANGED',
  route_unavailable: 'ROUTE UNAVAILABLE',
  resource_lost: 'RESOURCE CHANGE',
  objective_updated: 'OBJECTIVE UPDATED',
  pivot: 'WAITING',
}

function conditionTags(event: PivotEventDefinition): string[] {
  const tags = new Set<string>(['PIVOT POINT', 'CONDITIONS CHANGED'])
  tags.add(CONDITION_COPY[event.statusLabel] ?? 'CONDITIONS CHANGED')
  for (const effect of event.effects) {
    if (effect.type === 'block_edge') tags.add('ROUTE UNAVAILABLE')
    if (effect.type === 'reveal_intel' || effect.type === 'reveal_node') {
      tags.add('NEW INTEL')
    }
    if (effect.type === 'modify_resource') tags.add('RESOURCE CHANGE')
  }
  return Array.from(tags)
}

export function PivotEventOverlay({
  event,
  choices,
  open,
  onSelect,
  decisionLoad,
  informationStyle,
  predictability,
  resources,
  worldId,
}: PivotEventProps) {
  const tags = conditionTags(event)
  const backdrop = worldId === 'frontier' ? frontierPivotArtFor(event.statusLabel) : undefined

  return (
    <Modal open={open} title={event.title} className="pp-pivot-modal">
      <div className="relative pp-pivot-body">
        <div
          className="pointer-events-none absolute -right-1 -top-1 pp-stamp text-xs md:text-sm"
          aria-hidden
        >
          Pivot Point
        </div>
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="mb-3 h-32 w-full border border-[var(--pp-route)]/30 object-cover md:h-40"
          />
        ) : null}
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--pp-alert)]">
          Pivot Point · Conditions changed
        </p>
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Changed conditions">
          {tags.map((tag) => (
            <li
              key={tag}
              className="border border-[var(--pp-alert)]/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--pp-alert)]"
            >
              {tag}
            </li>
          ))}
        </ul>
        {predictability === 'high' ? (
          <p className="mb-3 text-sm text-[var(--pp-route)]">
            Conditions may change. Review options before committing.
          </p>
        ) : null}
        <p className="mb-4 text-base leading-relaxed text-[var(--pp-ink)]">
          {event.description}
        </p>
        <p className="pp-display mb-4 text-2xl text-[var(--pp-ink)]">
          What is your next move?
        </p>
        <DecisionPanel
          choices={choices}
          onSelect={onSelect}
          decisionLoad={decisionLoad}
          informationStyle={informationStyle}
          resources={resources}
        />
      </div>
    </Modal>
  )
}
