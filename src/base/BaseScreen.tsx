import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { playPlace, playUi } from '@/app/sound'
import { BaseGrid } from '@/base/BaseGrid'
import { BUILDING_LABELS, UPGRADE_DEFS } from '@/base/buildingMeta'
import { BuildingPalette } from '@/base/BuildingPalette'
import { EmblemMark } from '@/character/EmblemMark'
import { PortraitFrame } from '@/character/PortraitFrame'
import { Button } from '@/components/Button'
import { StatusStamp } from '@/components/StatusStamp'
import { getWorldPack, listPackMissions, WORLD_PACKS } from '@/worlds/registry'

export function BaseScreen() {
  const navigate = useNavigate()
  const {
    game,
    customMissions,
    upgradeBuilding,
    placeBuilding,
    setWorldId,
    playStyle,
    replayTutorial,
  } = useGame()
  const [selected, setSelected] = useState<string | null>('command')
  const [placeModeId, setPlaceModeId] = useState<string | null>(null)
  const [stamp, setStamp] = useState<{ title: string; detail: string } | null>(
    null,
  )

  const levels = Object.fromEntries(
    game.base.buildings.map((b) => [b.buildingId, b.level]),
  )
  const world = getWorldPack(game.worldId) ?? WORLD_PACKS[0]!
  const packMissions = listPackMissions(game.worldId)
  const customs = customMissions.filter((c) => c.worldId === game.worldId)
  const callSign = game.character.callSign || 'Operator'

  const selectedDef = world.buildings.find((b) => b.id === selected)
  const selectedLevel = selected ? (levels[selected] ?? 0) : 0
  const upgradeDef = UPGRADE_DEFS.find((u) => u.id === selected)

  const showStamp = useCallback((title: string, detail: string) => {
    setStamp({ title, detail })
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <header className="pp-fade-up grid gap-4 border-b border-[var(--pp-brass)]/25 pb-5 md:grid-cols-[auto_1fr_auto] md:items-end">
        <PortraitFrame
          appearance={game.character.appearance}
          emblem={game.character.emblem}
          role={game.character.role}
          portraitStyle={game.character.portraitStyle}
          size={120}
          showEmblem={false}
          className="justify-self-start"
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
            {world.name} · War room
          </p>
          <h1 className="pp-display text-4xl text-[var(--pp-parchment)] md:text-5xl">
            {callSign}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[color-mix(in_srgb,var(--pp-parchment)_72%,transparent)]">
            <EmblemMark emblem={game.character.emblem} size={28} />
            <span className="capitalize">{game.character.role}</span>
            <span aria-hidden>·</span>
            <span>Plans change. Find your next move.</span>
          </p>
        </div>
        <div className="pp-mono flex flex-wrap items-center gap-3 text-xs text-[var(--pp-parchment)] md:justify-end">
          <span className="border border-[var(--pp-brass)]/35 px-2 py-1">
            Mat {game.resources.materials}
          </span>
          <span className="border border-[var(--pp-brass)]/35 px-2 py-1">
            Intel {game.resources.intel}
          </span>
          <span className="border border-[var(--pp-brass)]/35 px-2 py-1">
            Pivot {game.resources.pivotTokens} · not spendable yet
          </span>
          <label className="flex items-center gap-2">
            <span className="uppercase tracking-[0.12em] text-[var(--pp-copper)]">
              Theatre
            </span>
            <select
              className="border border-[var(--pp-brass)]/40 bg-[var(--pp-table)] px-2 py-1 text-[var(--pp-parchment)]"
              value={game.worldId}
              onChange={(e) => setWorldId(e.target.value)}
              aria-label="Select world pack"
            >
              {WORLD_PACKS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <nav className="pp-tool-rail pp-fade-up" aria-label="War room tools">
        <Link to="/how-to-play">How to Play</Link>
        <Link to="/settings">Play Style</Link>
        <Link to="/saves">Save slots</Link>
        {(levels.workshop ?? 0) >= 1 ? <Link to="/workshop">Workshop</Link> : null}
        <Link to="/builder">Mission Builder</Link>
        <Link to="/mission-master">Mission Master</Link>
        <Link to="/facilitators">Mission Control</Link>
        <Link to="/create">Edit operator</Link>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="pp-surface p-4" aria-labelledby="base-grid-title">
          <h2
            id="base-grid-title"
            className="pp-display mb-3 text-2xl text-[var(--pp-ink)]"
          >
            Installation plan
          </h2>
          <BaseGrid
            base={game.base}
            selectedId={selected}
            placeModeId={placeModeId}
            onSelect={(id) => {
              setSelected(id)
              setPlaceModeId(null)
            }}
            onPlace={(id, x, y) => {
              const ok = placeBuilding(id, x, y)
              if (ok) {
                playPlace(playStyle)
                showStamp(
                  'PLACED',
                  (BUILDING_LABELS[id] ?? id).toUpperCase(),
                )
              } else {
                showStamp('INSTALLATION UPDATED', 'Could not place there')
              }
              setPlaceModeId(null)
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!selected || (levels[selected] ?? 0) < 1}
              onClick={() => setPlaceModeId(selected)}
            >
              Place selected on grid
            </Button>
            {placeModeId ? (
              <p className="text-sm text-[var(--pp-route)]">
                Tap an empty cell to place {BUILDING_LABELS[placeModeId] ?? placeModeId}.
              </p>
            ) : null}
          </div>

          {selected && selectedDef ? (
            <aside
              className="mt-4 border-t border-[var(--pp-route)]/25 pt-3"
              aria-label="Selected building"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-copper)]">
                Selected installation
              </p>
              <h3 className="pp-display text-xl text-[var(--pp-ink)]">
                {selectedDef.name}
              </h3>
                  <p className="text-sm text-[var(--pp-route)]">{selectedDef.description}</p>
                  <p className="mt-1 text-xs text-[var(--pp-accent)]">
                    {selected === 'workshop'
                      ? 'Mechanical effect: unlocks the Workshop to craft equipment.'
                      : 'No mechanical benefit yet. Placement and level are recorded only.'}
                  </p>
              <p className="mt-1 pp-mono text-xs uppercase tracking-wide text-[var(--pp-accent)]">
                Level {selectedLevel}
                {upgradeDef && selectedLevel < upgradeDef.maxLevel
                  ? ` · Upgrade cost ${upgradeDef.cost} materials`
                  : selectedLevel > 0
                    ? ' · Maxed'
                    : ''}
              </p>
              {selected === 'workshop' && selectedLevel >= 1 ? (
                <Button
                  className="mt-3"
                  onClick={() => {
                    playUi(playStyle)
                    navigate('/workshop')
                  }}
                >
                  Enter Workshop
                </Button>
              ) : null}
            </aside>
          ) : null}
        </section>

        <section className="pp-surface p-4" aria-labelledby="upgrades-title">
          <h2
            id="upgrades-title"
            className="pp-display mb-3 text-2xl text-[var(--pp-ink)]"
          >
            Field upgrades
          </h2>
          <BuildingPalette
            worldId={game.worldId}
            materials={game.resources.materials}
            buildingLevels={levels}
            onUpgrade={(id) => {
              const ok = upgradeBuilding(id)
              if (ok) {
                playPlace(playStyle)
                const nextLevel = (levels[id] ?? 0) + 1
                showStamp(
                  'UPGRADE COMPLETE',
                  `${BUILDING_LABELS[id] ?? id} · Level ${nextLevel}`,
                )
                setSelected(id)
              } else {
                showStamp('INSTALLATION UPDATED', 'Upgrade unavailable')
              }
            }}
            onSelectBuilding={setSelected}
            selectedId={selected}
          />
        </section>
      </div>

      <section className="pp-surface p-4 md:p-5" aria-labelledby="missions-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
              Sealed orders
            </p>
            <h2
              id="missions-title"
              className="pp-display text-2xl text-[var(--pp-ink)] md:text-3xl"
            >
              Available missions
            </h2>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              replayTutorial()
              playUi(playStyle)
              navigate('/mission/supply-line')
            }}
          >
            Replay tutorial
          </Button>
        </div>
        <ul className="space-y-3">
          {packMissions.map((mission) => (
            <li key={mission.id} className="pp-dossier px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="pp-display text-xl text-[var(--pp-ink)]">
                    {mission.name}
                  </p>
                  <p className="text-sm text-[var(--pp-route)]">{mission.objective}</p>
                  <p className="mt-1 pp-mono text-[10px] uppercase tracking-[0.14em] text-[var(--pp-accent)]">
                    Level {mission.tacticalLevel}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    playUi(playStyle)
                    navigate(`/mission/${mission.id}`)
                  }}
                >
                  Deploy
                </Button>
              </div>
            </li>
          ))}
          {customs.map((record) => (
            <li key={record.id} className="pp-dossier px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-accent)]">
                    Custom brief
                  </p>
                  <p className="pp-display text-xl text-[var(--pp-ink)]">
                    {record.mission.name}
                  </p>
                  <p className="text-sm text-[var(--pp-route)]">
                    {record.mission.objective}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    playUi(playStyle)
                    navigate(`/mission/${record.id}`)
                  }}
                >
                  Deploy
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <StatusStamp
        title={stamp?.title ?? ''}
        detail={stamp?.detail}
        visible={Boolean(stamp)}
        onDismiss={() => setStamp(null)}
      />
    </div>
  )
}
