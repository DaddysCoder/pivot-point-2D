import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { buildMissionRegistry } from '@/worlds/registry'

export function AfterAction() {
  const { missionId = 'supply-line' } = useParams()
  const navigate = useNavigate()
  const { game, dispatch, customMissions } = useGame()
  const registry = useMemo(
    () => buildMissionRegistry(customMissions.map((c) => c.mission)),
    [customMissions],
  )
  const mission = registry.get(missionId)

  const pivotEntries = game.missionLog.filter(
    (e) =>
      e.tone === 'plan_interrupted' ||
      e.tone === 'route_unavailable' ||
      e.tone === 'pivot' ||
      e.title.includes('CROSSING'),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
        After Action Report
      </p>
      <h1 className="pp-display text-4xl text-[var(--pp-parchment)] md:text-5xl">
        {mission?.name ?? 'Mission'} review
      </h1>

      <Panel>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              Original Plan
            </dt>
            <dd className="font-serif text-lg">{game.originalPlan ?? 'Not recorded'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              What Changed
            </dt>
            <dd className="font-serif text-lg">
              {game.lastPivotTitle ?? 'No disruption recorded'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              What You Tried
            </dt>
            <dd className="font-serif text-lg">
              {game.lastActionLabel ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              What You Discovered
            </dt>
            <dd className="font-serif text-lg">
              {game.discoveries.length > 0
                ? game.discoveries.join(', ')
                : 'No new sites marked'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              Final Route
            </dt>
            <dd className="font-serif text-lg">{game.finalRoute.join(' → ')}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              Pivots
            </dt>
            <dd className="font-serif text-lg">{game.pivotCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              Campaign resource totals
            </dt>
            <dd className="text-sm">
              Materials {game.resources.materials} · Intel {game.resources.intel} ·
              Pivot Tokens {game.resources.pivotTokens} (not spendable yet)
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-[var(--pp-route)]">
              Replay rewards
            </dt>
            <dd className="text-sm text-[var(--pp-route)]">
              Completing this mission again currently grants its completion resources
              again. Influence and Experience have no usable loop yet.
            </dd>
          </div>
        </dl>

        {pivotEntries.length > 0 ? (
          <ul className="mt-4 space-y-1 border-t border-[var(--pp-route)]/30 pt-4 text-sm">
            {pivotEntries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.title}</strong> — {entry.body}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            dispatch({ type: 'START_MISSION', missionId })
            navigate(`/mission/${missionId}`)
          }}
        >
          Replay
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            dispatch({ type: 'START_MISSION', missionId })
            navigate(`/mission/${missionId}`)
          }}
        >
          Change Strategy
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            dispatch({ type: 'RETURN_TO_BASE' })
            navigate('/base')
          }}
        >
          Return to Base
        </Button>
      </div>
    </div>
  )
}
