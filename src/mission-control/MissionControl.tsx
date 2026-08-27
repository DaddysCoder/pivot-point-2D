import type { GameState, MissionDefinition } from '@/engine/types'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { PIVOT_EVENT_LIBRARY } from '@/engine/pivotEventLibrary'
import { isDirectorMissionAllowed } from '@/director/directorRegistry'
import { normalizeDirectorState } from '@/director/directorMemory'

const FACILITATOR_PRESETS = [
  {
    id: 'route-blocked',
    label: 'Route blocked',
    description: 'Close a primary crossing or approach.',
    match: (mission: MissionDefinition) =>
      mission.events.find((e) =>
        e.effects.some((fx) => fx.type === 'block_edge'),
      )?.id ?? 'lib-route-blocked',
  },
  {
    id: 'new-intel',
    label: 'New intel',
    description: 'Insert delayed reconnaissance.',
    match: (mission: MissionDefinition) =>
      mission.events.find(
        (e) => e.id.includes('intel') || e.title.includes('INTEL'),
      )?.id ?? 'lib-intel-conflict',
  },
  {
    id: 'delay',
    label: 'Delay',
    description: 'Force a hold / waiting beat.',
    match: (mission: MissionDefinition) =>
      mission.events.find((e) =>
        e.choices.some((c) => c.actionType === 'hold'),
      )?.id ?? 'lib-waiting',
  },
  {
    id: 'resource-unavailable',
    label: 'Resource unavailable',
    description: 'Remove or lock a resource-sensitive option.',
    match: () => 'lib-resource-short',
  },
  {
    id: 'objective-changed',
    label: 'Objective changed',
    description: 'Trigger a conditions-changed event.',
    match: (mission: MissionDefinition) =>
      mission.events.find((e) =>
        e.effects.some(
          (fx) => fx.type === 'log' && fx.tone === 'objective_updated',
        ),
      )?.id ?? 'lib-objective-shift',
  },
]

interface MissionControlProps {
  open: boolean
  onClose: () => void
  mission: MissionDefinition
  onTrigger: (eventId: string) => void
  game?: GameState
  directorEnabled?: boolean
}

function DirectorDiagnostics({
  game,
  mission,
  directorEnabled,
}: {
  game: GameState
  mission: MissionDefinition
  directorEnabled: boolean
}) {
  const director = normalizeDirectorState(game.director)
  const last = director.lastDecision
  const lastEvent =
    director.history.length > 0
      ? director.history[director.history.length - 1]
      : null
  const allowed = isDirectorMissionAllowed(mission.id)

  return (
    <div className="mt-4 border-t border-[var(--pp-route)]/30 pt-4">
      <p className="mb-2 text-xs uppercase tracking-[0.14em]">Director status</p>
      <p className="mb-2 text-sm text-[var(--pp-route)]">
        Facilitator / playtest diagnostic only. Not shown in the player HUD.
      </p>
      <dl className="pp-mono grid gap-1 text-xs text-[var(--pp-ink)]">
        <div className="flex justify-between gap-2">
          <dt>Enabled</dt>
          <dd>{directorEnabled ? 'yes' : 'no'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Mission allow-listed</dt>
          <dd>{allowed ? 'yes' : 'no'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Budget</dt>
          <dd>{director.intensityAvailable}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Cooldown</dt>
          <dd>{director.cooldownRemaining}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Last event</dt>
          <dd>{lastEvent ? `${lastEvent.eventId} (${lastEvent.source})` : '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Last decision</dt>
          <dd>
            {last
              ? last.type === 'trigger'
                ? `trigger:${last.eventId}`
                : last.type === 'advisory'
                  ? `advisory:${last.eventId}`
                  : 'none'
              : '—'}
          </dd>
        </div>
      </dl>
      {director.lastCandidates.length > 0 ? (
        <ul className="mt-3 space-y-2" aria-label="Eligible candidates">
          {director.lastCandidates.map((c) => (
            <li
              key={c.eventId}
              className="border border-[var(--pp-route)]/25 px-2 py-1.5 text-xs"
            >
              <p className="font-semibold uppercase tracking-wide">
                {c.title} · Score {c.score}
                {c.eligible ? '' : ' · ineligible'}
              </p>
              <p className="text-[var(--pp-route)]">{c.reasonCodes.join(' · ')}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[var(--pp-route)]">
          No scored candidates yet this mission.
        </p>
      )}
    </div>
  )
}

export function MissionControl({
  open,
  onClose,
  mission,
  onTrigger,
  game,
  directorEnabled = false,
}: MissionControlProps) {
  const libraryIds = new Set(mission.events.map((e) => e.id))
  const extraLibrary = PIVOT_EVENT_LIBRARY.filter((e) => !libraryIds.has(e.id))

  return (
    <Modal open={open} title="Mission Control" onClose={onClose}>
      <p className="mb-4 text-sm text-[var(--pp-route)]">
        Facilitator tools. Insert a controlled change during play. No clinical
        labels are shown to the player.
      </p>
      <div className="grid gap-3">
        {FACILITATOR_PRESETS.map((preset) => {
          const eventId = preset.match(mission)
          const resolved =
            mission.events.some((e) => e.id === eventId) ||
            PIVOT_EVENT_LIBRARY.some((e) => e.id === eventId)
              ? eventId
              : undefined
          return (
            <div
              key={preset.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-[var(--pp-route)]/30 p-3"
            >
              <div>
                <p className="font-serif font-semibold">{preset.label}</p>
                <p className="text-sm text-[var(--pp-route)]">{preset.description}</p>
              </div>
              <Button
                variant="secondary"
                disabled={!resolved}
                onClick={() => resolved && onTrigger(resolved)}
              >
                Trigger
              </Button>
            </div>
          )
        })}
      </div>
      <div className="mt-4 border-t border-[var(--pp-route)]/30 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.14em]">Mission events</p>
        <div className="flex flex-wrap gap-2">
          {mission.events.map((event) => (
            <Button
              key={event.id}
              variant="ghost"
              onClick={() => onTrigger(event.id)}
            >
              {event.title}
            </Button>
          ))}
        </div>
      </div>
      {extraLibrary.length > 0 ? (
        <div className="mt-4 border-t border-[var(--pp-route)]/30 pt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.14em]">
            Event library
          </p>
          <div className="flex flex-wrap gap-2">
            {extraLibrary.map((event) => (
              <Button
                key={event.id}
                variant="ghost"
                onClick={() => onTrigger(event.id)}
              >
                {event.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {game ? (
        <DirectorDiagnostics
          game={game}
          mission={mission}
          directorEnabled={directorEnabled}
        />
      ) : null}
    </Modal>
  )
}
