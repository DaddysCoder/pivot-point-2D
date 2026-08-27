import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { composeMission, findChoice } from '@/engine'
import type { ActionType } from '@/engine/types'
import { useGame } from '@/app/useGame'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { ActionResolution } from '@/mission/ActionResolution'
import { DecisionPanel } from '@/mission/DecisionPanel'
import { MissionBrief } from '@/mission/MissionBrief'
import { MissionHUD } from '@/mission/MissionHUD'
import { MissionLog } from '@/mission/MissionLog'
import { PivotEventOverlay } from '@/mission/PivotEvent'
import { TacticalMap } from '@/mission/TacticalMap'
import { MissionControl } from '@/mission-control/MissionControl'
import { buildMissionRegistry } from '@/worlds/registry'

export function MissionScreen() {
  const { missionId = 'supply-line' } = useParams()
  const navigate = useNavigate()
  const { game, playStyle, dispatch, customMissions, equipLoadoutItem, unequipLoadoutItem } =
    useGame()
  const [briefSeen, setBriefSeen] = useState(false)
  const [controlOpen, setControlOpen] = useState(false)
  const [resolution, setResolution] = useState<{
    actionType: ActionType
    label: string
  } | null>(null)

  const registry = useMemo(
    () => buildMissionRegistry(customMissions.map((c) => c.mission)),
    [customMissions],
  )
  const mission = registry.get(missionId)
  const runtimeMission = useMemo(
    () => (mission ? composeMission(mission, game) : undefined),
    [mission, game],
  )

  useEffect(() => {
    if (game.missionStatus === 'completed' && game.currentMissionId) {
      navigate(`/debrief/${game.currentMissionId}`, { replace: true })
    }
  }, [game.missionStatus, game.currentMissionId, navigate])

  const activeChoices = useMemo(() => {
    if (!runtimeMission) return []
    return game.availableChoiceIds
      .map((id) => findChoice(runtimeMission, id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  }, [game.availableChoiceIds, runtimeMission])

  const activeEvent = runtimeMission?.events.find((e) => e.id === game.activeEventId)

  if (!mission) {
    return (
      <Panel title="Mission unavailable" className="m-4">
        <p>That mission is not available.</p>
        <Button className="mt-4" onClick={() => navigate('/base')}>
          Return to base
        </Button>
      </Panel>
    )
  }

  if (game.missionStatus === 'completed') {
    return (
      <Panel title="Returning to After Action" className="m-4">
        <p>Mission complete. Preparing summary…</p>
      </Panel>
    )
  }

  const brief = (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <MissionBrief
        mission={mission}
        soundGates={playStyle}
        inventory={game.inventory}
        activeLoadout={game.activeLoadout}
        onEquip={equipLoadoutItem}
        onUnequip={unequipLoadoutItem}
        onBegin={() => {
          dispatch({ type: 'START_MISSION', missionId: mission.id })
          setBriefSeen(true)
        }}
        onBack={() => navigate('/base')}
      />
    </div>
  )

  if (!briefSeen && game.currentMissionId !== mission.id) {
    return brief
  }

  if (game.currentMissionId !== mission.id && briefSeen) {
    return (
      <Panel title="Staging" className="m-4">
        <p className="mb-3">Loading mission…</p>
        <Button
          onClick={() => dispatch({ type: 'START_MISSION', missionId: mission.id })}
        >
          Start
        </Button>
      </Panel>
    )
  }

  const inMission = game.currentMissionId === mission.id

  if (!inMission) {
    return brief
  }

  const selectChoice = (choiceId: string) => {
    const choice = findChoice(runtimeMission!, choiceId)
    dispatch({ type: 'SELECT_CHOICE', choiceId })
    if (choice) {
      setResolution({ actionType: choice.actionType, label: choice.label })
    }
  }

  const mapDimmed = game.missionStatus === 'pivot'

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-3 md:p-5">
      <MissionHUD
        mission={mission}
        game={game}
        onPause={() => dispatch({ type: 'PAUSE' })}
        onOpenMissionControl={() => setControlOpen(true)}
      />

      {game.missionStatus === 'paused' ? (
        <Panel title="Mission paused">
          <p className="mb-3 text-sm">Take your time. Resume when ready.</p>
          <Button onClick={() => dispatch({ type: 'RESUME' })}>Resume</Button>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)]">
        <div className={mapDimmed ? 'pp-map-dimmed' : undefined}>
          <TacticalMap
            map={mission.map}
            game={game}
            worldId={game.worldId}
            className="min-h-[22rem] pp-fade-up"
          />
        </div>
        <div className="flex flex-col gap-4">
          {game.missionStatus !== 'pivot' ? (
            <section className="pp-surface p-4" aria-labelledby="orders-title">
              <h2
                id="orders-title"
                className="pp-display mb-3 text-xl text-[var(--pp-ink)]"
              >
                Orders
              </h2>
              <DecisionPanel
                choices={activeChoices}
                onSelect={selectChoice}
                decisionLoad={playStyle.decisionLoad}
                informationStyle={playStyle.informationStyle}
                disabled={game.missionStatus === 'paused'}
                resources={game.resources}
              />
            </section>
          ) : (
            <section className="pp-surface relative overflow-hidden p-4">
              <div
                className="pp-stamp pointer-events-none absolute right-3 top-3 text-xs"
                aria-hidden
              >
                Pivot
              </div>
              <h2 className="pp-display mb-2 text-xl text-[var(--pp-ink)]">
                Pivot Point active
              </h2>
              <p className="text-sm text-[var(--pp-route)]">
                Circumstances changed. Choose your next move in the overlay.
              </p>
            </section>
          )}
          <MissionLog entries={game.missionLog} />
        </div>
      </div>

      {activeEvent && game.missionStatus === 'pivot' ? (
        <PivotEventOverlay
          event={activeEvent}
          choices={activeChoices}
          open
          onSelect={selectChoice}
          decisionLoad={playStyle.decisionLoad}
          informationStyle={playStyle.informationStyle}
          predictability={playStyle.predictability}
          resources={game.resources}
        />
      ) : null}

      <ActionResolution
        actionType={resolution?.actionType ?? null}
        label={resolution?.label}
        visible={Boolean(resolution)}
        onDismiss={() => setResolution(null)}
      />

      <MissionControl
        open={controlOpen}
        onClose={() => setControlOpen(false)}
        mission={mission}
        game={game}
        directorEnabled={playStyle.adaptiveDirectorEnabled}
        onTrigger={(eventId) => {
          dispatch({ type: 'TRIGGER_FACILITATOR_EVENT', eventId })
          setControlOpen(false)
        }}
      />
    </div>
  )
}
