import type { MissionDefinition } from '@/engine/types'

/** WORLD 03 — RAIL: clear a blocked freight run. */
export const signalBlockMission: MissionDefinition = {
  id: 'signal-block',
  name: 'Signal Block',
  objective: 'Get the freight consist from Yard Alpha to Harbour Terminus.',
  tacticalLevel: 2,
  map: {
    id: 'signal-block-map',
    width: 5,
    height: 5,
    startNodeId: 'yard-alpha',
    objectiveNodeId: 'harbour',
    nodes: [
      {
        id: 'yard-alpha',
        label: 'Yard Alpha',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'mainline',
        label: 'Mainline',
        position: { x: 1, y: 3 },
        terrainId: 'road',
        tags: [],
      },
      {
        id: 'junction',
        label: 'Junction',
        position: { x: 2, y: 2 },
        terrainId: 'crossing',
        tags: [],
      },
      {
        id: 'siding',
        label: 'Goods Siding',
        position: { x: 4, y: 2 },
        terrainId: 'track',
        tags: [],
      },
      {
        id: 'viaduct',
        label: 'Viaduct',
        position: { x: 3, y: 1 },
        terrainId: 'river',
        tags: ['hidden'],
      },
      {
        id: 'harbour',
        label: 'Harbour Terminus',
        position: { x: 2, y: 0 },
        terrainId: 'base',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'yard-main',
        from: 'yard-alpha',
        to: 'mainline',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'main-junction',
        from: 'mainline',
        to: 'junction',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'junction-harbour',
        from: 'junction',
        to: 'harbour',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'junction-siding',
        from: 'junction',
        to: 'siding',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'siding-viaduct',
        from: 'siding',
        to: 'viaduct',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'viaduct-harbour',
        from: 'viaduct',
        to: 'harbour',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'rail-orders',
      title: 'Orders',
      description: 'Freight consist must reach Harbour Terminus before night window.',
    },
  ],
  intelCatalog: [
    {
      id: 'viaduct-open',
      title: 'Viaduct path',
      description: 'Goods siding links to the old viaduct approach.',
      revealsNodeIds: ['viaduct'],
    },
  ],
  initialChoices: [
    {
      id: 'sb-direct',
      label: 'Mainline run',
      description: 'Take Yard → Mainline → Junction → Harbour.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'mainline' },
        { type: 'move_to', nodeId: 'junction' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Mainline path selected.',
        },
      ],
    },
    {
      id: 'sb-recon',
      label: 'Check signals',
      description: 'Spend a turn reading the board.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'reveal_intel', intelId: 'viaduct-open' },
        { type: 'reveal_node', nodeId: 'viaduct' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-direct', 'sb-via-siding'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Viaduct approach marked available via goods siding.',
        },
      ],
    },
    {
      id: 'sb-via-siding',
      label: 'Goods siding',
      description: 'Divert early onto the siding.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'mainline' },
        { type: 'move_to', nodeId: 'junction' },
        { type: 'move_to', nodeId: 'siding' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-siding-advance'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'sb-via-siding',
      label: 'Goods siding',
      description: 'Divert early onto the siding.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'mainline' },
        { type: 'move_to', nodeId: 'junction' },
        { type: 'move_to', nodeId: 'siding' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-siding-advance'],
        },
      ],
    },
    {
      id: 'sb-pivot-recon',
      label: 'Recon',
      description: 'Find another working path past the red signal.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'viaduct-open' },
        { type: 'reveal_node', nodeId: 'viaduct' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-to-siding', 'sb-hold'],
        },
      ],
    },
    {
      id: 'sb-to-siding',
      label: 'Reroute to siding',
      description: 'Leave the blocked main for the goods road.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'siding' },
        { type: 'add_travel_turns', turns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-siding-advance'],
        },
      ],
    },
    {
      id: 'sb-hold',
      label: 'Hold',
      description: 'Wait for signal clearance.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'viaduct-open', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-hold-continue'],
        },
      ],
    },
    {
      id: 'sb-hold-continue',
      label: 'Continue',
      description: 'Advance after holding.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-to-siding'],
        },
      ],
    },
    {
      id: 'sb-siding-advance',
      label: 'Take viaduct',
      description: 'Push the consist across the goods viaduct.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'viaduct' },
        {
          type: 'set_active_choices',
          choiceIds: ['sb-finish'],
        },
      ],
    },
    {
      id: 'sb-finish',
      label: 'Arrive Harbour Terminus',
      description: 'Complete the freight run.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'harbour' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Freight consist berthed at Harbour Terminus.',
        },
      ],
    },
  ],
  events: [
    {
      id: 'signal-red',
      title: 'SIGNAL RED',
      description:
        'Junction home signal stays at danger. The mainline into Harbour is unavailable.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'sb-direct' },
      once: true,
      effects: [
        {
          type: 'block_edge',
          edgeId: 'junction-harbour',
          message: 'ROUTE UNAVAILABLE',
        },
        { type: 'move_to', nodeId: 'junction' },
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
          id: 'sb-pivot-recon',
          label: 'Recon',
          description: 'Find another working path past the red signal.',
          actionType: 'recon',
          effects: [
            { type: 'reveal_intel', intelId: 'viaduct-open' },
            { type: 'reveal_node', nodeId: 'viaduct' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sb-to-siding', 'sb-hold'],
            },
          ],
        },
        {
          id: 'sb-to-siding',
          label: 'Reroute to siding',
          description: 'Leave the blocked main for the goods road.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'siding' },
            { type: 'add_travel_turns', turns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sb-siding-advance'],
            },
          ],
        },
        {
          id: 'sb-hold',
          label: 'Hold',
          description: 'Wait for signal clearance.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'viaduct-open', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sb-hold-continue'],
            },
          ],
        },
      ],
    },
  ],
  rewards: [
    {
      id: 'sb-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'sb-viaduct-intel',
      label: 'Mapped viaduct approach',
      intel: 2,
      requireIntel: ['viaduct-open'],
    },
    {
      id: 'sb-adapt',
      label: 'Adapted to signal block',
      pivotTokens: 1,
      requireAdaptedEvent: 'signal-red',
    },
  ],
}
