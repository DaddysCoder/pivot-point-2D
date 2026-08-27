import type { ActionType, MissionDefinition, ResourceState } from '@/engine/types'

export const INSTRUCTION_HEADINGS = [
  'Your goal',
  'Where you begin',
  'What you are trying to reach or restore',
  'What you do each turn',
  'What may change',
  'How the mission ends',
  'Can I lose?',
] as const

export interface MissionInstructions {
  yourGoal: string
  whereYouBegin: string
  tryingToReach: string
  eachTurn: string
  whatMayChange: string
  howItEnds: string
  canILose: string
  startingChoices: string
}

export const CAN_I_LOSE =
  'No. Current missions do not have a traditional lose or game-over condition. Unavailable actions do not punish you — choose another approach.'

export const EACH_TURN =
  'Choose one available action. That choice moves the mission forward. The map is a visual record of where you are, not a board you click to move on.'

export const PIVOT_FAIL_FORWARD =
  'Your original plan changed. Choose a new approach; this is not a failure.'

export const ACTION_GLOSSARY: Record<ActionType, string> = {
  recon: 'Gather information and reveal more of the situation.',
  reroute: 'Take a different path toward the objective.',
  repair: 'Fix or brace something so a route can be used again.',
  hold: 'Wait in place so new information or conditions can arrive.',
  ask: 'Call for help, contact, or support.',
  build: 'Put a structure or workaround in place.',
  adapt: 'Change the plan to match new conditions.',
  continue: 'Keep going along the current approach, or finish the objective.',
  move: 'Change position as part of the authored plan.',
  retreat: 'Pull back from the current approach without ending the mission.',
}

export const RESOURCE_LABELS: Record<keyof ResourceState, string> = {
  materials: 'Materials',
  intel: 'Intel',
  influence: 'Influence',
  experience: 'Experience',
  pivotTokens: 'Pivot Tokens',
}

export const RESOURCE_GLOSSARY: Record<keyof ResourceState, string> = {
  materials:
    'Earned when you complete missions. Spent on base upgrades and some Repair actions.',
  intel:
    'Earned on some completions. It records discoveries and can be spent to craft certain equipment.',
  influence:
    'Listed for later use. There is no usable earn-and-spend loop in normal play yet (a facilitator Trade option is the only spend).',
  experience:
    'Stored on your save. There is no spend loop yet.',
  pivotTokens:
    'Sometimes awarded when you adapt after a Pivot Event. They are not spendable yet.',
}

export const EQUIPMENT_GLOSSARY =
  'Equipment in your loadout can add extra actions. Some kits are used once and then consumed. You can always complete a mission without extra kit.'

export const HOW_TO_PLAY_SECTIONS = [
  {
    title: 'Your goal',
    body: 'Complete the mission objective. Pivot Point is about finishing that job by adapting when plans change.',
  },
  {
    title: 'What you do',
    body: 'Choose one available action at a time. Each choice moves the mission forward. You cannot lose by picking a blocked or unavailable option — pick another approach.',
  },
  {
    title: 'The map',
    body: 'The map is mainly a visual record of your position, routes, and discoveries. You do not click the map to move. Authored choices may jump you along a planned path rather than walking every connection.',
  },
  {
    title: 'Pivot Events',
    body: 'The original plan may be interrupted. When that happens, gather information, reroute, repair, wait, ask for help, build, or otherwise adapt. A Pivot Event is a change of conditions, not a failure.',
  },
  {
    title: 'How a mission ends',
    body: 'A mission ends when you complete its final objective action at the destination. Current missions do not have a traditional lose or game-over condition.',
  },
  {
    title: 'Elapsed turns',
    body: 'Elapsed turns increase when a choice spends travel time (for example Hold or a longer reroute). Not every choice advances the counter.',
  },
  {
    title: 'Replay rewards',
    body: 'Replaying a completed mission currently grants its completion resources again. That rule is provisional and may change.',
  },
] as const

const SHARED_END = 'Complete the final objective action. That is how the mission ends.'

const BUILTIN: Record<string, MissionInstructions> = {
  'supply-line': {
    yourGoal: 'Move supplies from Echo Base to North Station.',
    whereYouBegin: 'Echo Base, with a column ready to move.',
    tryingToReach: 'North Station, so the supplies arrive.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'Routes may close. Recon, reroute, repair, hold, or use equipment to find a workable path.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'Direct, Eastern Route, or Recon are solid first moves. A Repair Kit or Recon Kit in your loadout can add extra options later if you have them.',
  },
  'missing-recon': {
    yourGoal: 'Locate the missing reconnaissance team and restore contact.',
    whereYouBegin: 'The outpost where the team last reported.',
    tryingToReach: 'Signal Ridge, to restore contact with the missing team.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'Search for information, follow or change routes, and respond when the expected trail becomes unreliable.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'A direct search or a recon-first look at the trail are useful starts. Recon gear can add extra survey options if you bring it.',
  },
  'broken-connection': {
    yourGoal: 'Restore communications between South Relay and North Link.',
    whereYouBegin: 'South Relay, at the working end of the line.',
    tryingToReach: 'North Link, so the connection is restored.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'Investigate the break, choose how to reach it, and repair or adapt around complications.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'Trace the main line or ask for a status check. Materials or a Repair Kit help if you later need to brace the line.',
  },
  'relay-drift': {
    yourGoal: 'Return the relay buoy to the Habitat communications corridor.',
    whereYouBegin: 'The Habitat, with the buoy still in view.',
    tryingToReach: 'The drifting relay buoy, locked back into corridor alignment.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'The direct dock approach may become unavailable, requiring reconnaissance, waiting, or a service-rail detour.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'A direct corridor approach or a recon sweep of the dock are useful starts. Sensor or repair kit can add extra options.',
  },
  'signal-block': {
    yourGoal: 'Move the freight consist from Yard Alpha to Harbour Terminus.',
    whereYouBegin: 'Yard Alpha, with the consist ready to leave.',
    tryingToReach: 'Harbour Terminus, to finish the freight run.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'If the mainline signal blocks the route, investigate, wait, or divert through the siding and viaduct.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'Take the mainline or recon the signal diagram first. Route markers or a radio can add extra options if equipped.',
  },
  'solar-flare': {
    yourGoal: 'Escort the supply pod from the Habitat to the Fab Bench.',
    whereYouBegin: 'The Habitat, before the flare window.',
    tryingToReach: 'The Fab Bench, with the pod delivered.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'Flare disruption may force reconnaissance, waiting, or a conduit detour.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'A direct corridor run or a sensor sweep are useful starts. Repair kit can help if systems need bracing.',
  },
  washout: {
    yourGoal: 'Get the inspection trolley from Yard Alpha to the Embankment.',
    whereYouBegin: 'Yard Alpha, with the trolley ready.',
    tryingToReach: 'The Embankment, so inspection can continue.',
    eachTurn: EACH_TURN,
    whatMayChange:
      'Flooding may force reconnaissance, waiting, or a detour on the old siding.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'Take the booked route or recon the wash first. A repair kit can add bracing options later.',
  },
}

export const MISSION_INSTRUCTION_FIELDS: Array<keyof MissionInstructions> = [
  'yourGoal',
  'whereYouBegin',
  'tryingToReach',
  'eachTurn',
  'whatMayChange',
  'howItEnds',
  'canILose',
  'startingChoices',
]

function nodeLabel(mission: MissionDefinition, nodeId: string): string {
  return mission.map.nodes.find((n) => n.id === nodeId)?.label ?? nodeId
}

export function instructionsForMission(mission: MissionDefinition): MissionInstructions {
  const authored = BUILTIN[mission.id]
  if (authored) return authored

  const start = nodeLabel(mission, mission.map.startNodeId)
  const objective = nodeLabel(mission, mission.map.objectiveNodeId)
  return {
    yourGoal: mission.objective,
    whereYouBegin: `You begin at ${start}.`,
    tryingToReach: `You are trying to reach or restore ${objective}.`,
    eachTurn: EACH_TURN,
    whatMayChange:
      'The original plan may be interrupted. Gather information, reroute, repair, wait, ask for help, build, or adapt.',
    howItEnds: SHARED_END,
    canILose: CAN_I_LOSE,
    startingChoices:
      'Use the listed starting actions. Equipment in your loadout may add extra options without replacing the basic routes.',
  }
}

export function isCompletionChoice(choice: {
  effects: Array<{ type: string }>
}): boolean {
  return choice.effects.some((effect) => effect.type === 'complete_mission')
}

export function missingResourceSummary(
  requireResources: Partial<ResourceState> | undefined,
  resources: ResourceState | undefined,
): string | null {
  if (!requireResources || !resources) return null
  const parts: string[] = []
  for (const [key, amount] of Object.entries(requireResources)) {
    const resourceKey = key as keyof ResourceState
    const need = amount ?? 0
    if (resources[resourceKey] < need) {
      parts.push(
        `${RESOURCE_LABELS[resourceKey]} (have ${resources[resourceKey]}, need ${need})`,
      )
    }
  }
  if (parts.length === 0) return null
  return `Unavailable — missing ${parts.join('; ')}. Choose another approach.`
}
