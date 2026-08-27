import {
  applyPlayerAction,
  type MissionRegistry,
  type ReduceGameOptions,
} from '@/engine/missionEngine'
import type { EngineResult, GameState, MissionDefinition, PlayerAction } from '@/engine/types'

/**
 * Pure game reducer.
 * Given GameState + PlayerAction, returns NewGameState + GameEvent[].
 * Contains no React.
 */
export function reduceGame(
  state: GameState,
  action: PlayerAction,
  registry: MissionRegistry,
  options?: ReduceGameOptions,
): EngineResult {
  return applyPlayerAction(state, action, registry, options)
}

export function createMissionRegistry(
  missions: MissionDefinition[],
): MissionRegistry {
  return new Map(missions.map((m) => [m.id, m]))
}

export type { ReduceGameOptions }
