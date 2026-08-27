import type {
  DecisionChoice,
  IntelItem,
  MapDefinition,
  MissionDefinition,
  PivotEventDefinition,
} from '@/engine/types'

/**
 * SUPPLY LINE
 *
 * Echo Base → Main Road → Crossing ⇄ Eastern Track
 *                 ↓              ↓
 *             River Ford ←→ Hills
 *                 ↓
 *            North Station
 */
export const supplyLineMap: MapDefinition = {
  id: 'supply-line-map',
  width: 5,
  height: 6,
  startNodeId: 'echo-base',
  objectiveNodeId: 'north-station',
  nodes: [
    {
      id: 'echo-base',
      label: 'Echo Base',
      position: { x: 1, y: 5 },
      terrainId: 'base',
      tags: ['start'],
    },
    {
      id: 'main-road',
      label: 'Main Road',
      position: { x: 1, y: 4 },
      terrainId: 'road',
      tags: [],
    },
    {
      id: 'crossing',
      label: 'Crossing',
      position: { x: 1, y: 3 },
      terrainId: 'crossing',
      tags: [],
    },
    {
      id: 'eastern-track',
      label: 'Eastern Track',
      position: { x: 3, y: 3 },
      terrainId: 'track',
      tags: [],
    },
    {
      id: 'river-ford',
      label: 'River Ford',
      position: { x: 1, y: 2 },
      terrainId: 'river',
      tags: ['hidden'],
    },
    {
      id: 'hills',
      label: 'Hills',
      position: { x: 3, y: 2 },
      terrainId: 'hills',
      tags: [],
    },
    {
      id: 'north-station',
      label: 'North Station',
      position: { x: 1, y: 0 },
      terrainId: 'base',
      tags: ['objective'],
    },
  ],
  edges: [
    {
      id: 'echo-to-main',
      from: 'echo-base',
      to: 'main-road',
      travelCost: 1,
      tags: ['main'],
    },
    {
      id: 'main-to-crossing',
      from: 'main-road',
      to: 'crossing',
      travelCost: 1,
      tags: ['main'],
    },
    {
      id: 'crossing-to-ford',
      from: 'crossing',
      to: 'river-ford',
      travelCost: 1,
      tags: ['main'],
    },
    {
      id: 'crossing-to-eastern',
      from: 'crossing',
      to: 'eastern-track',
      travelCost: 1,
      tags: ['alt'],
    },
    {
      id: 'eastern-to-hills',
      from: 'eastern-track',
      to: 'hills',
      travelCost: 1,
      tags: ['alt'],
    },
    {
      id: 'ford-to-hills',
      from: 'river-ford',
      to: 'hills',
      travelCost: 1,
      tags: ['alt'],
    },
    {
      id: 'hills-to-ford',
      from: 'hills',
      to: 'river-ford',
      travelCost: 1,
      tags: ['alt'],
    },
    {
      id: 'ford-to-north',
      from: 'river-ford',
      to: 'north-station',
      travelCost: 1,
      tags: ['alt'],
    },
    {
      id: 'hills-to-north',
      from: 'hills',
      to: 'north-station',
      travelCost: 1,
      tags: ['alt'],
    },
  ],
}

const startingIntel: IntelItem[] = [
  {
    id: 'orders-supply',
    title: 'Orders',
    description: 'Move supplies from Echo Base to North Station.',
  },
  {
    id: 'map-main-road',
    title: 'Main Road charted',
    description: 'Primary approach runs Echo → Main Road → Crossing.',
    revealsNodeIds: ['main-road', 'crossing'],
  },
]

const pivotChoices: DecisionChoice[] = [
  {
    id: 'crossing-recon',
    label: 'Recon',
    description: 'Look for another crossing.',
    actionType: 'recon',
    effects: [
      { type: 'reveal_intel', intelId: 'alt-river-ford' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern', 'hold-position'],
      },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'River Ford marked south of the damaged crossing.',
      },
    ],
  },
  {
    id: 'crossing-reroute',
    label: 'Reroute',
    description: 'Move toward Eastern Track. (+2 travel turns)',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'eastern-track' },
      { type: 'add_travel_turns', turns: 2 },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['eastern-to-hills-choice', 'eastern-recon'],
      },
      {
        type: 'log',
        tone: 'conditions_changed',
        title: 'CONDITIONS CHANGED',
        body: 'Column diverted onto Eastern Track. Extra travel expected.',
      },
    ],
  },
  {
    id: 'crossing-repair',
    label: 'Repair',
    description: 'Inspect the crossing. Requires engineering materials.',
    actionType: 'repair',
    effects: [
      { type: 'require_resource', resource: 'materials', amount: 1 },
      { type: 'unblock_edge', edgeId: 'crossing-to-ford' },
      { type: 'set_flag', flag: 'crossing_repaired', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'CROSSING STABILISED',
        body: 'Temporary bracing restores limited access toward the ford.',
      },
    ],
  },
  {
    id: 'crossing-hold',
    label: 'Hold',
    description: 'Wait. Updated information expected next turn.',
    actionType: 'hold',
    effects: [
      { type: 'schedule_intel', intelId: 'alt-river-ford', afterTurns: 1 },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['hold-continue'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'HOLDING',
        body: 'Standing by for updated crossing reports.',
      },
    ],
  },
  {
    id: 'crossing-build-bridge',
    label: 'Build Temporary Crossing',
    description: 'Deploy the Field Bridge Kit for a temporary span.',
    actionType: 'build',
    requireEquipment: ['field-bridge-kit'],
    consumeEquipment: ['field-bridge-kit'],
    effects: [
      { type: 'unblock_edge', edgeId: 'crossing-to-ford' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      { type: 'set_flag', flag: 'bridge_built', value: true },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern'],
      },
      {
        type: 'log',
        tone: 'conditions_changed',
        title: 'TEMPORARY CROSSING SET',
        body: 'Field Bridge Kit spans the washout. Column can press the ford.',
      },
    ],
  },
  {
    id: 'crossing-repair-kit',
    label: 'Repair with Kit',
    description: 'Use the Repair Kit to brace the damaged span.',
    actionType: 'repair',
    requireEquipment: ['repair-kit'],
    consumeEquipment: ['repair-kit'],
    effects: [
      { type: 'unblock_edge', edgeId: 'crossing-to-ford' },
      { type: 'set_flag', flag: 'crossing_repaired', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'CROSSING STABILISED',
        body: 'Repair Kit bracing restores limited access toward the ford.',
      },
    ],
  },
  {
    id: 'crossing-equipment-recon',
    label: 'Equipment Recon',
    description: 'Use the Recon Kit for a closer survey of the washout.',
    actionType: 'recon',
    requireEquipment: ['recon-kit'],
    effects: [
      { type: 'reveal_intel', intelId: 'alt-river-ford' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      { type: 'reveal_node', nodeId: 'eastern-track' },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern', 'hold-position'],
      },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'Recon Kit confirms River Ford and Eastern Track approaches.',
      },
    ],
  },
  {
    id: 'crossing-contact-radio',
    label: 'Contact Unit',
    description: 'Raise the nearest unit on the Portable Radio.',
    actionType: 'ask',
    requireEquipment: ['portable-radio'],
    effects: [
      { type: 'reveal_intel', intelId: 'alt-river-ford' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern', 'hold-position'],
      },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'Contact confirms the ford is still passable south of the washout.',
      },
    ],
  },
  {
    id: 'crossing-use-cache',
    label: 'Use Supply Cache',
    description: 'Open the cache to cover the shortfall at the crossing.',
    actionType: 'adapt',
    requireEquipment: ['supply-cache'],
    consumeEquipment: ['supply-cache'],
    effects: [
      { type: 'modify_resource', resource: 'materials', amount: 1 },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: [
          'crossing-repair',
          'crossing-reroute',
          'crossing-hold',
          'crossing-recon',
        ],
      },
      {
        type: 'log',
        tone: 'resource_lost',
        title: 'CACHE OPENED',
        body: 'Supply Cache offsets the materials shortfall. Choose your next move.',
      },
    ],
  },
  {
    id: 'crossing-mark-route',
    label: 'Mark Alternate Route',
    description: 'Plant Route Markers toward the eastern approach.',
    actionType: 'reroute',
    requireEquipment: ['route-markers'],
    consumeEquipment: ['route-markers'],
    effects: [
      { type: 'reveal_node', nodeId: 'eastern-track' },
      { type: 'reveal_node', nodeId: 'hills' },
      { type: 'move_to', nodeId: 'eastern-track' },
      { type: 'add_travel_turns', turns: 1 },
      { type: 'increment_pivot' },
      { type: 'clear_active_event' },
      {
        type: 'set_active_choices',
        choiceIds: ['eastern-to-hills-choice', 'eastern-recon'],
      },
      {
        type: 'log',
        tone: 'conditions_changed',
        title: 'ROUTE MARKED',
        body: 'Markers hold the eastern approach open for the column.',
      },
    ],
  },
]

const crossingClosed: PivotEventDefinition = {
  id: 'crossing-closed',
  title: 'CROSSING CLOSED',
  description:
    'Overnight flooding has destroyed the crossing. Your original route is no longer available.',
  statusLabel: 'route_unavailable',
  trigger: { type: 'on_choice', choiceId: 'plan-direct' },
  once: true,
  effects: [
    {
      type: 'block_edge',
      edgeId: 'crossing-to-ford',
      message: 'ROUTE UNAVAILABLE',
    },
    { type: 'move_to', nodeId: 'crossing' },
    { type: 'set_status', status: 'pivot' },
    { type: 'set_flag', flag: 'crossing_closed', value: true },
    {
      type: 'log',
      tone: 'plan_interrupted',
      title: 'PLAN INTERRUPTED',
      body: 'Find your next move.',
    },
    {
      type: 'log',
      tone: 'route_unavailable',
      title: 'ROUTE UNAVAILABLE',
      body: 'Flood damage has made the crossing unsafe.',
    },
  ],
  choices: pivotChoices,
}

const initialChoices: DecisionChoice[] = [
  {
    id: 'plan-direct',
    label: 'Direct',
    description: 'Take Main Road. Shortest; limited alternatives.',
    actionType: 'adapt',
    effects: [
      { type: 'move_to', nodeId: 'main-road' },
      { type: 'move_to', nodeId: 'crossing' },
      { type: 'set_flag', flag: 'plan_direct', value: true },
      {
        type: 'log',
        tone: 'info',
        title: 'PLAN SET',
        body: 'Direct route via Main Road selected.',
      },
    ],
  },
  {
    id: 'plan-eastern',
    label: 'Eastern Route',
    description: 'Take the hills. Longer; more route options.',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'main-road' },
      { type: 'move_to', nodeId: 'crossing' },
      { type: 'move_to', nodeId: 'eastern-track' },
      { type: 'add_travel_turns', turns: 1 },
      { type: 'set_flag', flag: 'plan_eastern', value: true },
      {
        type: 'set_active_choices',
        choiceIds: ['eastern-to-hills-choice', 'eastern-recon'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'PLAN SET',
        body: 'Eastern hills route selected.',
      },
    ],
  },
  {
    id: 'plan-recon',
    label: 'Recon',
    description: 'Spend one turn gathering information.',
    actionType: 'recon',
    effects: [
      { type: 'add_travel_turns', turns: 1 },
      { type: 'reveal_intel', intelId: 'alt-river-ford' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      {
        type: 'set_active_choices',
        choiceIds: ['plan-direct', 'plan-eastern', 'take-river-ford-from-echo'],
      },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'Recon marks River Ford as a viable alternate.',
      },
    ],
  },
]

const choiceLibrary: DecisionChoice[] = [
  ...pivotChoices,
  {
    id: 'take-river-ford',
    label: 'Take River Ford',
    description: 'Use the revealed ford toward North Station.',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'river-ford' },
      {
        type: 'set_active_choices',
        choiceIds: ['ford-to-north-choice'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'ROUTE UPDATED',
        body: 'Column moving via River Ford.',
      },
    ],
  },
  {
    id: 'take-river-ford-from-echo',
    label: 'Approach via River Ford',
    description: 'Use recon intel to bypass the main crossing.',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'main-road' },
      { type: 'move_to', nodeId: 'crossing' },
      { type: 'move_to', nodeId: 'river-ford' },
      {
        type: 'set_active_choices',
        choiceIds: ['ford-to-north-choice'],
      },
      {
        type: 'log',
        tone: 'info',
        title: 'ROUTE UPDATED',
        body: 'Approaching North Station via River Ford.',
      },
    ],
  },
  {
    id: 'reroute-eastern',
    label: 'Reroute to Eastern Track',
    description: 'Leave the closed crossing for the eastern approach.',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'eastern-track' },
      { type: 'add_travel_turns', turns: 2 },
      {
        type: 'set_active_choices',
        choiceIds: ['eastern-to-hills-choice'],
      },
    ],
  },
  {
    id: 'hold-position',
    label: 'Hold',
    description: 'Wait for another opening.',
    actionType: 'hold',
    effects: [
      { type: 'schedule_intel', intelId: 'weather-clearing', afterTurns: 1 },
      {
        type: 'set_active_choices',
        choiceIds: ['hold-continue'],
      },
    ],
  },
  {
    id: 'hold-continue',
    label: 'Continue',
    description: 'Advance one turn while holding position.',
    actionType: 'continue',
    effects: [
      { type: 'add_travel_turns', turns: 1 },
      { type: 'set_status', status: 'active' },
      { type: 'set_flag', flag: 'discovered_river_ford', value: true },
      {
        type: 'set_active_choices',
        choiceIds: ['take-river-ford', 'reroute-eastern'],
      },
    ],
  },
  {
    id: 'eastern-recon',
    label: 'Recon hills',
    description: 'Survey the eastern approach before committing.',
    actionType: 'recon',
    effects: [
      { type: 'reveal_node', nodeId: 'hills' },
      { type: 'reveal_node', nodeId: 'river-ford' },
      {
        type: 'set_active_choices',
        choiceIds: ['eastern-to-hills-choice'],
      },
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'Hills connect to both River Ford and North Station.',
      },
    ],
  },
  {
    id: 'eastern-to-hills-choice',
    label: 'Advance through Hills',
    description: 'Push the column into the hills toward North Station.',
    actionType: 'continue',
    effects: [
      { type: 'move_to', nodeId: 'hills' },
      {
        type: 'set_active_choices',
        choiceIds: ['hills-to-north-choice', 'hills-to-ford-choice'],
      },
    ],
  },
  {
    id: 'hills-to-north-choice',
    label: 'Descend to North Station',
    description: 'Complete delivery via the eastern hills.',
    actionType: 'continue',
    effects: [
      { type: 'move_to', nodeId: 'north-station' },
      { type: 'complete_mission' },
      {
        type: 'log',
        tone: 'info',
        title: 'OBJECTIVE MET',
        body: 'Supplies delivered to North Station.',
      },
    ],
  },
  {
    id: 'hills-to-ford-choice',
    label: 'Cut across to River Ford',
    description: 'Link to the ford before the final approach.',
    actionType: 'reroute',
    effects: [
      { type: 'move_to', nodeId: 'river-ford' },
      {
        type: 'set_active_choices',
        choiceIds: ['ford-to-north-choice'],
      },
    ],
  },
  {
    id: 'ford-to-north-choice',
    label: 'Deliver to North Station',
    description: 'Final leg from River Ford.',
    actionType: 'continue',
    effects: [
      { type: 'move_to', nodeId: 'north-station' },
      { type: 'complete_mission' },
      {
        type: 'log',
        tone: 'info',
        title: 'OBJECTIVE MET',
        body: 'Supplies delivered to North Station via River Ford.',
      },
    ],
  },
]

/** Extra intel items revealed mid-mission (not all start revealed). */
export const supplyLineIntelLibrary: IntelItem[] = [
  ...startingIntel,
  {
    id: 'alt-river-ford',
    title: 'River Ford',
    description: 'A secondary ford sits below the damaged crossing.',
    revealsNodeIds: ['river-ford'],
  },
  {
    id: 'weather-clearing',
    title: 'Weather update',
    description: 'Water levels are dropping near the ford.',
    revealsNodeIds: ['river-ford'],
  },
]

const facilitatorDelay: PivotEventDefinition = {
  id: 'sl-support-delay',
  title: 'SUPPORT DELAYED',
  description: 'Mission Control reports the escort element is delayed.',
  statusLabel: 'conditions_changed',
  trigger: { type: 'manual', code: 'delay' },
  once: false,
  effects: [
    {
      type: 'log',
      tone: 'conditions_changed',
      title: 'CONDITIONS CHANGED',
      body: 'Support is delayed. Continue with available options.',
    },
    { type: 'set_status', status: 'pivot' },
  ],
  choices: [
    {
      id: 'sl-delay-continue',
      label: 'Continue',
      description: 'Proceed without waiting for escort.',
      actionType: 'adapt',
      effects: [
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        { type: 'set_status', status: 'active' },
      ],
    },
    {
      id: 'sl-delay-hold',
      label: 'Hold',
      description: 'Wait for the delayed element.',
      actionType: 'hold',
      effects: [
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        { type: 'set_status', status: 'active' },
      ],
    },
  ],
}

const facilitatorIntel: PivotEventDefinition = {
  id: 'sl-manual-intel',
  title: 'NEW INTEL',
  description: 'Mission Control inserts a ford sighting.',
  statusLabel: 'new_intel',
  trigger: { type: 'manual', code: 'new-intel' },
  once: false,
  effects: [
    { type: 'reveal_intel', intelId: 'alt-river-ford' },
    { type: 'reveal_node', nodeId: 'river-ford' },
    {
      type: 'log',
      tone: 'new_intel',
      title: 'NEW INTEL',
      body: 'River Ford confirmed passable.',
    },
    { type: 'set_status', status: 'pivot' },
  ],
  choices: [
    {
      id: 'sl-intel-ack',
      label: 'Acknowledge',
      description: 'Incorporate the new information.',
      actionType: 'adapt',
      effects: [
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        { type: 'set_status', status: 'active' },
      ],
    },
  ],
}

export const supplyLineMission: MissionDefinition = {
  id: 'supply-line',
  name: 'Supply Line',
  objective: 'Move supplies from Echo Base to North Station.',
  tacticalLevel: 2,
  map: supplyLineMap,
  startingIntel,
  intelCatalog: supplyLineIntelLibrary.filter(
    (item) => !startingIntel.some((s) => s.id === item.id),
  ),
  initialChoices,
  events: [crossingClosed, facilitatorDelay, facilitatorIntel],
  choiceLibrary,
  rewards: [
    {
      id: 'supply-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'supply-ford-intel',
      label: 'Discovering River Ford',
      intel: 2,
      requireIntel: ['alt-river-ford'],
    },
    {
      id: 'supply-adapt-pivot',
      label: 'Adapting to crossing closure',
      pivotTokens: 1,
      requireAdaptedEvent: 'crossing-closed',
    },
  ],
}
