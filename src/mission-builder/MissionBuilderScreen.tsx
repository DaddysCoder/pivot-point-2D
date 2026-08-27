import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { MapEditor } from '@/mission-builder/MapEditor'
import { COMPLICATION_PRESETS } from '@/engine/pivotEventLibrary'
import {
  OBJECTIVE_PRESETS,
  compileMissionDraft,
  createDefaultDraft,
  exportMissionJson,
  importMissionJson,
  type MissionDraft,
} from '@/mission-builder/missionDraft'
import { WORLD_PACKS } from '@/worlds/registry'

export function MissionBuilderScreen() {
  const navigate = useNavigate()
  const { game, saveCustomMission, refreshCustomMissions, customMissions } =
    useGame()
  const [draft, setDraft] = useState<MissionDraft>(() =>
    createDefaultDraft(game.worldId || 'frontier'),
  )
  const [message, setMessage] = useState<string | null>(null)
  const [importText, setImportText] = useState('')

  const compiled = useMemo(() => compileMissionDraft(draft), [draft])

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--pp-accent)]">
            Create Mission
          </p>
          <h1 className="font-serif text-4xl font-semibold">Mission Builder</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/base" className="underline underline-offset-2">
            Base
          </Link>
          <Link to="/mission-master" className="underline underline-offset-2">
            Mission Master
          </Link>
        </div>
      </header>

      <Panel title="Brief">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="text-sm">
            World
            <select
              className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
              value={draft.worldId}
              onChange={(e) => setDraft({ ...draft, worldId: e.target.value })}
            >
              {WORLD_PACKS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            Objective
            <select
              className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
              value={draft.objective}
              onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
            >
              {OBJECTIVE_PRESETS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Tactical level
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
              value={draft.tacticalLevel}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  tacticalLevel: Number(e.target.value) || 1,
                })
              }
            />
          </label>
        </div>
      </Panel>

      <Panel title="Complications">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.surpriseMe}
            onChange={(e) =>
              setDraft({ ...draft, surpriseMe: e.target.checked })
            }
          />
          Surprise Me — engine selects complications
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPLICATION_PRESETS.map((preset) => (
            <label key={preset.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={draft.surpriseMe}
                checked={draft.complicationIds.includes(preset.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...draft.complicationIds, preset.id]
                    : draft.complicationIds.filter((id) => id !== preset.id)
                  setDraft({ ...draft, complicationIds: next })
                }}
              />
              {preset.label}
            </label>
          ))}
        </div>
      </Panel>

      <MapEditor
        map={draft.map}
        onChange={(map) => setDraft({ ...draft, map })}
      />

      <Panel title="Save / share">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const mission = compileMissionDraft(draft)
              await saveCustomMission({
                id: mission.id,
                mission,
                worldId: draft.worldId,
                createdBy: game.character.callSign || 'operator',
              })
              await refreshCustomMissions()
              setMessage(`Saved “${mission.name}”.`)
            }}
          >
            Save mission
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const mission = compileMissionDraft(draft)
              await saveCustomMission({
                id: mission.id,
                mission,
                worldId: draft.worldId,
                createdBy: game.character.callSign || 'operator',
              })
              await refreshCustomMissions()
              navigate(`/mission/${mission.id}`)
            }}
          >
            Save & deploy
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const text = exportMissionJson(compiled)
              await navigator.clipboard.writeText(text)
              setMessage('Mission JSON copied to clipboard.')
            }}
          >
            Copy JSON
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const blob = new Blob([exportMissionJson(compiled)], {
                type: 'application/json',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${compiled.id}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download JSON
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}

        <div className="mt-4 space-y-2">
          <label className="block text-sm" htmlFor="import-json">
            Import mission JSON
          </label>
          <textarea
            id="import-json"
            className="min-h-28 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] p-2 font-mono text-xs"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste a shareable mission file…"
          />
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const mission = importMissionJson(importText)
                await saveCustomMission({
                  id: mission.id,
                  mission,
                  worldId: draft.worldId,
                  createdBy: game.character.callSign || 'operator',
                })
                await refreshCustomMissions()
                setDraft({
                  ...createDefaultDraft(draft.worldId),
                  id: mission.id,
                  name: mission.name,
                  objective: mission.objective,
                  tacticalLevel: mission.tacticalLevel,
                  map: mission.map,
                })
                setMessage(`Imported “${mission.name}”.`)
              } catch {
                setMessage('Import failed — check JSON format.')
              }
            }}
          >
            Import
          </Button>
        </div>
      </Panel>

      <Panel title="Saved custom missions">
        {customMissions.length === 0 ? (
          <p className="text-sm text-[var(--pp-route)]">No custom missions yet.</p>
        ) : (
          <ul className="space-y-2">
            {customMissions.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-[var(--pp-route)]/30 p-2"
              >
                <span className="font-serif">{record.mission.name}</span>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/mission/${record.id}`)}
                >
                  Deploy
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
