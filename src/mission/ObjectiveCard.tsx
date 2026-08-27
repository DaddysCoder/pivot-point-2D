import type { GameState, MissionDefinition } from '@/engine/types'
import { instructionsForMission } from '@/mission/instructions'

interface ObjectiveCardProps {
  mission: MissionDefinition
  game: GameState
}

export function ObjectiveCard({ mission, game }: ObjectiveCardProps) {
  const copy = instructionsForMission(mission)
  const node = mission.map.nodes.find((n) => n.id === game.playerNodeId)

  return (
    <aside
      data-tutorial-target="objective"
      className="border border-[var(--pp-brass)]/40 bg-[color-mix(in_srgb,var(--pp-table)_88%,black)] px-3 py-2 text-[var(--pp-parchment)]"
      aria-label="Mission objective"
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-copper)]">
        Objective
      </p>
      <p className="pp-display text-lg leading-tight">{copy.yourGoal}</p>
      <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--pp-parchment)_70%,transparent)]">
        You are at {node?.label ?? 'staging'}. Reach or restore{' '}
        {mission.map.nodes.find((n) => n.id === mission.map.objectiveNodeId)?.label ??
          'the objective'}
        .
      </p>
    </aside>
  )
}
