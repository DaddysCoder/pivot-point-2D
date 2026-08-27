import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { playPivot } from '@/app/sound'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { PIVOT_EVENT_LIBRARY } from '@/engine/pivotEventLibrary'
import { listPackMissions } from '@/worlds/registry'

/**
 * Mission Master — design uncertainty for another player (or yourself).
 * Local-only; no multiplayer networking.
 */
export function MissionMasterScreen() {
  const { game, playStyle, dispatch, customMissions } = useGame()
  const [selectedMissionId, setSelectedMissionId] = useState(
    game.currentMissionId ?? 'supply-line',
  )
  const [log, setLog] = useState<string[]>([])

  const missions = useMemo(() => {
    const pack = listPackMissions()
    const custom = customMissions.map((c) => c.mission)
    return [...pack, ...custom]
  }, [customMissions])

  const mission = missions.find((m) => m.id === selectedMissionId)

  const pushLog = (line: string) => {
    setLog((prev) => [`T${game.turn}: ${line}`, ...prev].slice(0, 12))
  }

  const inMission = game.currentMissionId === selectedMissionId

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--pp-accent)]">
            Mission Master
          </p>
          <h1 className="font-serif text-4xl font-semibold">
            Design the difficult situation
          </h1>
          <p className="text-sm text-[var(--pp-route)]">
            Close bridges, remove fuel, change objectives — then watch the
            operator find another move. Local facilitator tools only.
          </p>
        </div>
        <Link to="/base" className="underline underline-offset-2">
          Base
        </Link>
      </header>

      <Panel title="Target mission">
        <select
          className="w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
          value={selectedMissionId}
          onChange={(e) => setSelectedMissionId(e.target.value)}
        >
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {!inMission ? (
          <Button
            className="mt-3"
            onClick={() => {
              dispatch({ type: 'START_MISSION', missionId: selectedMissionId })
              pushLog(`Started ${selectedMissionId}`)
            }}
          >
            Start for operator
          </Button>
        ) : (
          <p className="mt-3 text-sm">
            Live mission: {game.currentMissionId} · status {game.missionStatus} ·
            node {game.playerNodeId}
          </p>
        )}
      </Panel>

      <Panel title="Inject disruption">
        <div className="grid gap-3 sm:grid-cols-2">
          {(mission?.events.length
            ? mission.events
            : PIVOT_EVENT_LIBRARY
          ).map((event) => (
            <div
              key={event.id}
              className="border border-[var(--pp-route)]/30 p-3"
            >
              <p className="font-serif font-semibold">{event.title}</p>
              <p className="mb-2 text-sm text-[var(--pp-route)]">
                {event.description}
              </p>
              <Button
                variant="secondary"
                disabled={!inMission}
                onClick={() => {
                  dispatch({
                    type: 'TRIGGER_FACILITATOR_EVENT',
                    eventId: event.id,
                  })
                  playPivot(playStyle)
                  pushLog(`Triggered ${event.title}`)
                }}
              >
                Trigger
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Master log">
        <ul className="space-y-1 text-sm">
          {log.map((line, i) => (
            <li key={`${line}-${i}`}>{line}</li>
          ))}
          {log.length === 0 ? (
            <li className="text-[var(--pp-route)]">No interventions yet.</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  )
}
