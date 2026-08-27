import type { GameState, MissionDefinition } from '@/engine/types'
import { EmblemMark } from '@/character/EmblemMark'
import { IconButton } from '@/components/IconButton'

interface MissionHUDProps {
  mission: MissionDefinition
  game: GameState
  onPause: () => void
  onOpenMissionControl: () => void
}

export function MissionHUD({
  mission,
  game,
  onPause,
  onOpenMissionControl,
}: MissionHUDProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pp-brass)]/30 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        <EmblemMark emblem={game.character.emblem} size={40} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-copper)]">
            {mission.name} · Level {mission.tacticalLevel}
          </p>
          <h1 className="pp-display text-2xl text-[var(--pp-parchment)] md:text-3xl">
            {mission.objective}
          </h1>
          <p className="pp-mono text-xs text-[color-mix(in_srgb,var(--pp-parchment)_65%,transparent)]">
            Turn {game.turn} · {game.character.callSign} ·{' '}
            {game.playerNodeId ?? 'staging'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pp-parchment)]">
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          aria-label={`${game.resources.materials} materials`}
        >
          Mat {game.resources.materials}
        </span>
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          aria-label={`${game.resources.intel} intel`}
        >
          Intel {game.resources.intel}
        </span>
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          aria-label={`${game.resources.pivotTokens} pivot tokens`}
        >
          Pivot {game.resources.pivotTokens}
        </span>
        <IconButton label="Pause mission" onClick={onPause}>
          ‖
        </IconButton>
        <IconButton label="Open Mission Control" onClick={onOpenMissionControl}>
          ⌖
        </IconButton>
      </div>
    </header>
  )
}
