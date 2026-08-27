/** Pivot Point core domain types — UI-independent. */

import type {
  EquipmentId,
  EquipmentInventoryEntry,
} from '@/crafting/craftingTypes'
import type { DirectorRuntimeState } from '@/director/directorTypes'

export type { EquipmentId, EquipmentInventoryEntry }
export type { DirectorRuntimeState }

export type ActionType =
  | 'recon'
  | 'adapt'
  | 'repair'
  | 'reroute'
  | 'hold'
  | 'ask'
  | 'build'
  | 'retreat'
  | 'move'
  | 'continue'

export type CharacterRole =
  | 'strategist'
  | 'scout'
  | 'engineer'
  | 'cartographer'
  | 'quartermaster'
  | 'commander'
  | 'intelligence'
  | 'pathfinder'

export interface AppearanceConfig {
  bodyStyle: string
  face: string
  hair: string
  clothing: string
  headwear: string
  accessory: string
  palette: string
}

export interface EmblemConfig {
  symbol: string
  shape: string
  background: string
  colour: string
}

export type PortraitStyle = 'sketch' | 'illustrated'

export interface PlayerCharacter {
  id: string
  callSign: string
  role: CharacterRole
  appearance: AppearanceConfig
  emblem: EmblemConfig
  pronouns?: string
  displayName?: string
  /** 'sketch' (default) uses the customizable SVG portrait; 'illustrated' uses commissioned art when available for the role. */
  portraitStyle?: PortraitStyle
}

export interface GridPosition {
  x: number
  y: number
}

export interface ResourceState {
  materials: number
  intel: number
  influence: number
  experience: number
  pivotTokens: number
}

export interface BuildingDefinition {
  id: string
  name: string
  description: string
  costMaterials: number
}

export interface TerrainDefinition {
  id: string
  name: string
  walkable: boolean
  tags: string[]
}

export interface WorldTheme {
  id: string
  displayName: string
  primary: string
  secondary: string
  accent: string
  paper: string
}

export interface MapNode {
  id: string
  label: string
  position: GridPosition
  terrainId: string
  tags: string[]
}

export interface MapEdge {
  id: string
  from: string
  to: string
  travelCost: number
  blocked?: boolean
  tags: string[]
}

export interface MapDefinition {
  id: string
  width: number
  height: number
  nodes: MapNode[]
  edges: MapEdge[]
  startNodeId: string
  objectiveNodeId: string
}

export interface IntelItem {
  id: string
  title: string
  description: string
  revealsNodeIds?: string[]
  revealsEdgeIds?: string[]
}

export type GameEffect =
  | { type: 'block_edge'; edgeId: string; message?: string }
  | { type: 'unblock_edge'; edgeId: string }
  | { type: 'reveal_intel'; intelId: string }
  | { type: 'reveal_node'; nodeId: string }
  | { type: 'move_to'; nodeId: string }
  | { type: 'add_travel_turns'; turns: number }
  | { type: 'modify_resource'; resource: keyof ResourceState; amount: number }
  | { type: 'require_resource'; resource: keyof ResourceState; amount: number }
  | { type: 'set_flag'; flag: string; value: boolean }
  | { type: 'increment_pivot' }
  | { type: 'complete_mission' }
  | { type: 'schedule_intel'; intelId: string; afterTurns: number }
  | { type: 'log'; tone: MissionLogTone; title: string; body: string }
  | { type: 'set_status'; status: MissionStatus }
  | { type: 'set_active_choices'; choiceIds: string[] }
  | { type: 'clear_active_event' }
  | { type: 'trigger_event'; eventId: string }

export type MissionLogTone =
  | 'info'
  | 'plan_interrupted'
  | 'new_intel'
  | 'conditions_changed'
  | 'route_unavailable'
  | 'resource_lost'
  | 'objective_updated'
  | 'pivot'

export interface DecisionChoice {
  id: string
  label: string
  description: string
  actionType: ActionType
  effects: GameEffect[]
  /** If set, choice is only available when all flags match. */
  requireFlags?: Record<string, boolean>
  /** If set, choice needs these resources. */
  requireResources?: Partial<ResourceState>
  /**
   * Optional equipment gate. When set, the choice is an ADDITIONAL option
   * exposed only if every listed id is in the active loadout.
   * Existing non-gated routes remain valid without equipment.
   */
  requireEquipment?: EquipmentId[]
  /**
   * Equipment consumed exactly once when this choice succeeds.
   * Reusable kits omit this (or leave it empty).
   */
  consumeEquipment?: EquipmentId[]
}

export type EventTrigger =
  | { type: 'on_arrive'; nodeId: string }
  | { type: 'on_choice'; choiceId: string }
  | { type: 'on_turn'; turn: number }
  | { type: 'manual'; code: string }
  | { type: 'immediate' }

export interface PivotEventDefinition {
  id: string
  title: string
  description: string
  statusLabel: MissionLogTone
  trigger: EventTrigger
  effects: GameEffect[]
  choices: DecisionChoice[]
  once?: boolean
}

export interface MissionReward {
  id: string
  label: string
  materials?: number
  intel?: number
  influence?: number
  experience?: number
  pivotTokens?: number
  /** Awarded when all of these flags are true at completion. */
  requireFlags?: Record<string, boolean>
  /** Awarded when these intel ids are revealed. */
  requireIntel?: string[]
  /** Awarded when player adapted after a named pivot event. */
  requireAdaptedEvent?: string
  /** Always awarded on successful completion when no conditions. */
  onComplete?: boolean
}

export type MissionStatus =
  | 'briefing'
  | 'active'
  | 'pivot'
  | 'completed'
  | 'paused'

export interface MissionDefinition {
  id: string
  name: string
  objective: string
  tacticalLevel: number
  map: MapDefinition
  startingIntel: IntelItem[]
  /** Mid-mission intel not revealed at start. */
  intelCatalog?: IntelItem[]
  initialChoices: DecisionChoice[]
  events: PivotEventDefinition[]
  rewards: MissionReward[]
  /** Optional catalogue of follow-up choices referenced by id. */
  choiceLibrary?: DecisionChoice[]
}

export interface WorldPack {
  id: string
  name: string
  terrain: TerrainDefinition[]
  buildings: BuildingDefinition[]
  missions: MissionDefinition[]
  theme: WorldTheme
}

export interface MissionLogEntry {
  id: string
  turn: number
  tone: MissionLogTone
  title: string
  body: string
}

export interface BaseBuildingState {
  buildingId: string
  level: number
}

export interface BaseState {
  buildings: BaseBuildingState[]
  gridWidth: number
  gridHeight: number
  /** Optional grid placements for richer base building. */
  placements?: Record<string, { x: number; y: number }>
}

export interface PendingIntel {
  intelId: string
  deliverOnTurn: number
}

export interface GameState {
  seed: number
  character: PlayerCharacter
  worldId: string
  currentMissionId: string | null
  missionStatus: MissionStatus
  turn: number
  playerNodeId: string | null
  playerPosition: GridPosition
  resources: ResourceState
  revealedIntel: string[]
  revealedNodes: string[]
  blockedEdges: string[]
  activeEventId: string | null
  activeChoiceIds: string[]
  availableChoiceIds: string[]
  triggeredEventIds: string[]
  adaptedEventIds: string[]
  flags: Record<string, boolean>
  pendingIntel: PendingIntel[]
  missionLog: MissionLogEntry[]
  pivotCount: number
  travelTurnsRemaining: number
  originalPlan: string | null
  lastPivotTitle: string | null
  lastActionLabel: string | null
  discoveries: string[]
  finalRoute: string[]
  awardedRewardIds: string[]
  base: BaseState
  /**
   * Manually injected Pivot events (e.g. Mission Control library events).
   * Persisted for the mission so choices remain resolvable after SELECT_CHOICE
   * and across save/reload.
   */
  injectedEvents: PivotEventDefinition[]
  /** Crafted field equipment stored at base. */
  inventory: EquipmentInventoryEntry[]
  /** Up to two equipment types selected for the next / current mission. */
  activeLoadout: EquipmentId[]
  /** Mission-local Adaptive Director runtime (budget, cooldown, history). */
  director: DirectorRuntimeState
}

export type PlayerAction =
  | { type: 'START_MISSION'; missionId: string }
  | { type: 'SELECT_CHOICE'; choiceId: string }
  | { type: 'TRIGGER_FACILITATOR_EVENT'; eventId: string }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RETURN_TO_BASE' }

export interface GameEvent {
  type: string
  payload?: Record<string, unknown>
}

export interface EngineResult {
  state: GameState
  events: GameEvent[]
}

export function createEmptyResources(): ResourceState {
  return {
    materials: 0,
    intel: 0,
    influence: 0,
    experience: 0,
    pivotTokens: 0,
  }
}

export function createDefaultCharacter(
  overrides: Partial<PlayerCharacter> = {},
): PlayerCharacter {
  return {
    id: 'operator-1',
    callSign: 'ECHO',
    role: 'strategist',
    portraitStyle: 'sketch',
    appearance: {
      bodyStyle: 'standard',
      face: 'calm',
      hair: 'short',
      clothing: 'field',
      headwear: 'none',
      accessory: 'none',
      palette: 'olive',
    },
    emblem: {
      symbol: 'chevron',
      shape: 'shield',
      background: 'slate',
      colour: 'gold',
    },
    ...overrides,
  }
}

export function createInitialGameState(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    seed: 1,
    character: createDefaultCharacter(),
    worldId: 'frontier',
    currentMissionId: null,
    missionStatus: 'briefing',
    turn: 0,
    playerNodeId: null,
    playerPosition: { x: 0, y: 0 },
    resources: createEmptyResources(),
    revealedIntel: [],
    revealedNodes: [],
    blockedEdges: [],
    activeEventId: null,
    activeChoiceIds: [],
    availableChoiceIds: [],
    triggeredEventIds: [],
    adaptedEventIds: [],
    flags: {},
    pendingIntel: [],
    missionLog: [],
    pivotCount: 0,
    travelTurnsRemaining: 0,
    originalPlan: null,
    lastPivotTitle: null,
    lastActionLabel: null,
    discoveries: [],
    finalRoute: [],
    awardedRewardIds: [],
    injectedEvents: [],
    inventory: [],
    activeLoadout: [],
    director: {
      intensityAvailable: 100,
      cooldownRemaining: 0,
      history: [],
      recentActionTypes: [],
      advisoryPendingEventId: null,
      lastDecision: null,
      lastCandidates: [],
      resumeChoiceIds: null,
    },
    base: {
      buildings: [
        { buildingId: 'command', level: 1 },
        { buildingId: 'map-room', level: 1 },
        { buildingId: 'workshop', level: 0 },
        { buildingId: 'storage', level: 1 },
        { buildingId: 'recon', level: 1 },
        { buildingId: 'archive', level: 0 },
        { buildingId: 'comms-tower', level: 0 },
      ],
      gridWidth: 5,
      gridHeight: 5,
      placements: {
        command: { x: 2, y: 2 },
        'map-room': { x: 1, y: 1 },
        storage: { x: 3, y: 1 },
        recon: { x: 1, y: 3 },
      },
    },
    ...overrides,
  }
}
