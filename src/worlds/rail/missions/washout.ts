import type { MissionDefinition } from '@/engine/types'

/** WORLD 03 — RAIL: get an inspection trolley to a flooded embankment before the next working. */
export const washoutMission: MissionDefinition = {
  id: 'washout',
  name: 'Washout',
  objective: 'Get the inspection trolley from Yard Alpha to the Embankment before the next working.',
  tacticalLevel: 2,
  map: {
    id: 'washout-map',
    width: 5,
    height: 5,
    startNodeId: 'yard-alpha',
    objectiveNodeId: 'embankment',
    nodes: [
      {
        id: 'yard-alpha',
        label: 'Yard Alpha',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'branch-line',
        label: 'Branch Line',
        position: { x: 1, y: 3 },
        terrainId: 'road',
        tags: [],
      },
      {
        id: 'cutting',
        label: 'Cutting',
        position: { x: 2, y: 2 },
        terrainId: 'hills',
        tags: [],
      },
      {
        id: 'old-siding',
        label: 'Old Siding',
        position: { x: 3, y: 3 },
        terrainId: 'track',
        tags: ['hidden'],
      },
      {
        id: 'embankment',
        label: 'Embankment',
        position: { x: 3, y: 1 },
        terrainId: 'base',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'yard-branch',
        from: 'yard-alpha',
        to: 'branch-line',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'branch-cutting',
        from: 'branch-line',
        to: 'cutting',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'cutting-embankment',
        from: 'cutting',
        to: 'embankment',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'branch-siding',
        from: 'branch-line',
        to: 'old-siding',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'siding-embankment',
        from: 'old-siding',
        to: 'embankment',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'washout-orders',
      title: 'Orders',
      description: 'Heavy rain has undermined the line near the Embankment. Inspect before the next working.',
    },
  ],
  intelCatalog: [
    {
      id: 'siding-clear',
      title: 'Old siding clear',
      description: 'The disused siding still holds a working connection to the embankment.',
      revealsNodeIds: ['old-siding'],
    },
  ],
  initialChoices: [
    {
      id: 'wo-direct',
      label: 'Main line run',
      description: 'Take Branch Line → Cutting → Embankment.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'branch-line' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Main line path selected.',
        },
      ],
    },
    {
      id: 'wo-recon',
      label: 'Walk the line',
      description: 'Spend a turn checking track condition first.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'reveal_intel', intelId: 'siding-clear' },
        { type: 'reveal_node', nodeId: 'old-siding' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-direct', 'wo-via-siding'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Old siding marked as a viable diversion.',
        },
      ],
    },
    {
      id: 'wo-via-siding',
      label: 'Old Siding',
      description: 'Route the trolley via the old siding.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'branch-line' },
        { type: 'move_to', nodeId: 'old-siding' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-siding-advance'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'wo-via-siding',
      label: 'Old Siding',
      description: 'Route the trolley via the old siding.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'branch-line' },
        { type: 'move_to', nodeId: 'old-siding' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-siding-advance'],
        },
      ],
    },
    {
      id: 'wo-pivot-recon',
      label: 'Recon',
      description: 'Walk out to check how far the washout extends.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'siding-clear' },
        { type: 'reveal_node', nodeId: 'old-siding' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-to-siding', 'wo-hold'],
        },
      ],
    },
    {
      id: 'wo-to-siding',
      label: 'Reroute to Old Siding',
      description: 'Divert off the washed-out cutting.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'old-siding' },
        { type: 'add_travel_turns', turns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-siding-advance'],
        },
      ],
    },
    {
      id: 'wo-hold',
      label: 'Hold',
      description: 'Wait for the water to recede.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'siding-clear', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-hold-continue'],
        },
      ],
    },
    {
      id: 'wo-hold-continue',
      label: 'Continue',
      description: 'Advance after holding.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['wo-to-siding'],
        },
      ],
    },
    {
      id: 'wo-siding-advance',
      label: 'Reach Embankment',
      description: 'Bring the trolley in via the old siding.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'embankment' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Embankment inspected before the next working.',
        },
      ],
    },
  ],
  events: [
    {
      id: 'cutting-washed-out',
      title: 'CUTTING WASHED OUT',
      description:
        'Standing water has undermined the cutting. The direct approach to the Embankment is unsafe.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'wo-direct' },
      once: true,
      effects: [
        {
          type: 'block_edge',
          edgeId: 'cutting-embankment',
          message: 'ROUTE UNAVAILABLE',
        },
        { type: 'move_to', nodeId: 'branch-line' },
        { type: 'set_status', status: 'pivot' },
        {
          type: 'log',
          tone: 'plan_interrupted',
          title: 'PLAN INTERRUPTED',
          body: 'Find your next move.',
        },
      ],
      choices: [
        {
          id: 'wo-pivot-recon',
          label: 'Recon',
          description: 'Walk out to check how far the washout extends.',
          actionType: 'recon',
          effects: [
            { type: 'reveal_intel', intelId: 'siding-clear' },
            { type: 'reveal_node', nodeId: 'old-siding' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['wo-to-siding', 'wo-hold'],
            },
          ],
        },
        {
          id: 'wo-to-siding',
          label: 'Reroute to Old Siding',
          description: 'Divert off the washed-out cutting.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'old-siding' },
            { type: 'add_travel_turns', turns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['wo-siding-advance'],
            },
          ],
        },
        {
          id: 'wo-hold',
          label: 'Hold',
          description: 'Wait for the water to recede.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'siding-clear', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['wo-hold-continue'],
            },
          ],
        },
      ],
    },
    {
      id: 'wo-manual-signal-loss',
      title: 'SIGNAL LOSS',
      description: 'The block instrument to Cutting has dropped out.',
      statusLabel: 'conditions_changed',
      trigger: { type: 'manual', code: 'signal-loss' },
      once: false,
      effects: [
        {
          type: 'log',
          tone: 'conditions_changed',
          title: 'CONDITIONS CHANGED',
          body: 'Block working is down. Decide how to proceed.',
        },
        { type: 'set_status', status: 'pivot' },
      ],
      choices: [
        {
          id: 'wo-manual-continue',
          label: 'Continue under caution',
          description: 'Proceed at walking pace without block protection.',
          actionType: 'adapt',
          effects: [
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            { type: 'set_status', status: 'active' },
          ],
        },
        {
          id: 'wo-manual-hold',
          label: 'Hold',
          description: 'Wait for block working to be restored.',
          actionType: 'hold',
          effects: [
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            { type: 'set_status', status: 'active' },
          ],
        },
      ],
    },
  ],
  rewards: [
    {
      id: 'wo-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'wo-siding-intel',
      label: 'Mapped old siding',
      intel: 2,
      requireIntel: ['siding-clear'],
    },
    {
      id: 'wo-adapt',
      label: 'Adapted to washout',
      pivotTokens: 1,
      requireAdaptedEvent: 'cutting-washed-out',
    },
  ],
}
