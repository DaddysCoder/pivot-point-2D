import type { GameState, MissionDefinition } from '@/engine/types'
import { EmblemMark } from '@/character/EmblemMark'
import { IconButton } from '@/components/IconButton'
import { ObjectiveCard } from '@/mission/ObjectiveCard'

interface MissionHUDProps {
  mission: MissionDefinition
  game: GameState
  onPause: () => void
  onOpenMissionControl: () => void
  onHowToPlay: () => void
  tutorialHighlight?: string | null
}

export function MissionHUD({
  mission,
  game,
  onPause,
  onOpenMissionControl,
  onHowToPlay,
  tutorialHighlight = null,
}: MissionHUDProps) {
  const highlight = (id: string) =>
    tutorialHighlight === id ? 'ring-2 ring-[var(--pp-copper)]' : ''

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pp-brass)]/30 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        <EmblemMark emblem={game.character.emblem} size={40} />
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-copper)]">
            {mission.name} · Level {mission.tacticalLevel}
          </p>
          <div className={highlight('objective')}>
            <ObjectiveCard mission={mission} game={game} />
          </div>
          <p className="pp-mono text-xs text-[color-mix(in_srgb,var(--pp-parchment)_65%,transparent)]">
            Elapsed turns {game.turn} · {game.character.callSign} ·{' '}
            {game.playerNodeId ?? 'staging'}
          </p>
        </div>
      </div>
      <div
        className={`flex flex-wrap items-center gap-2 text-xs text-[var(--pp-parchment)] ${highlight('resources')}`}
        data-tutorial-target="resources"
      >
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          title="Earned on completion. Spent on upgrades and some Repair actions."
          aria-label={`${game.resources.materials} materials`}
        >
          Mat {game.resources.materials}
        </span>
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          title="Records discoveries. Earned on some completions. Used to craft some equipment."
          aria-label={`${game.resources.intel} intel`}
        >
          Intel {game.resources.intel}
        </span>
        <span
          className="border border-[var(--pp-brass)]/35 px-2 py-1"
          title="Awarded when you adapt after some Pivot Events. Not spendable yet."
          aria-label={`${game.resources.pivotTokens} pivot tokens, not spendable yet`}
        >
          Pivot {game.resources.pivotTokens} · not spendable yet
        </span>
        <button
          type="button"
          className="border border-[var(--pp-brass)]/40 px-2 py-1 uppercase tracking-[0.12em]"
          onClick={onHowToPlay}
        >
          How to Play
        </button>
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
