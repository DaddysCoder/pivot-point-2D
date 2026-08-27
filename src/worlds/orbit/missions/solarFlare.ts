import type { MissionDefinition } from '@/engine/types'

/** WORLD 02 — ORBIT: escort a supply pod through a flare-disrupted corridor. */
export const solarFlareMission: MissionDefinition = {
  id: 'solar-flare',
  name: 'Solar Flare',
  objective: 'Escort the supply pod from the Habitat to the Fab Bench before the flare window closes.',
  tacticalLevel: 2,
  map: {
    id: 'solar-flare-map',
    width: 5,
    height: 5,
    startNodeId: 'habitat',
    objectiveNodeId: 'fab-bench',
    nodes: [
      {
        id: 'habitat',
        label: 'Habitat',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'outer-ring',
        label: 'Outer Ring',
        position: { x: 1, y: 3 },
        terrainId: 'road',
        tags: [],
      },
      {
        id: 'exposed-truss',
        label: 'Exposed Truss',
        position: { x: 2, y: 2 },
        terrainId: 'hills',
        tags: [],
      },
      {
        id: 'shielded-conduit',
        label: 'Shielded Conduit',
        position: { x: 3, y: 3 },
        terrainId: 'track',
        tags: ['hidden'],
      },
      {
        id: 'fab-bench',
        label: 'Fab Bench',
        position: { x: 3, y: 1 },
        terrainId: 'base',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'hab-ring',
        from: 'habitat',
        to: 'outer-ring',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'ring-truss',
        from: 'outer-ring',
        to: 'exposed-truss',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'truss-fab',
        from: 'exposed-truss',
        to: 'fab-bench',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'ring-conduit',
        from: 'outer-ring',
        to: 'shielded-conduit',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'conduit-fab',
        from: 'shielded-conduit',
        to: 'fab-bench',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'flare-orders',
      title: 'Orders',
      description: 'A supply pod needs to reach the Fab Bench before flare intensity peaks.',
    },
  ],
  intelCatalog: [
    {
      id: 'conduit-shielded',
      title: 'Shielded conduit',
      description: 'A radiation-shielded conduit bypasses the exposed truss.',
      revealsNodeIds: ['shielded-conduit'],
    },
  ],
  initialChoices: [
    {
      id: 'sf-direct',
      label: 'Outer Ring run',
      description: 'Take Outer Ring → Exposed Truss → Fab Bench.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'outer-ring' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Outer Ring path selected.',
        },
      ],
    },
    {
      id: 'sf-recon',
      label: 'Scan radiation levels',
      description: 'Spend a turn checking exposure readings first.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'reveal_intel', intelId: 'conduit-shielded' },
        { type: 'reveal_node', nodeId: 'shielded-conduit' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-direct', 'sf-via-conduit'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Shielded conduit marked as a safe bypass.',
        },
      ],
    },
    {
      id: 'sf-via-conduit',
      label: 'Shielded Conduit',
      description: 'Route the pod through the shielded conduit.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'outer-ring' },
        { type: 'move_to', nodeId: 'shielded-conduit' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-conduit-advance'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'sf-via-conduit',
      label: 'Shielded Conduit',
      description: 'Route the pod through the shielded conduit.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'outer-ring' },
        { type: 'move_to', nodeId: 'shielded-conduit' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-conduit-advance'],
        },
      ],
    },
    {
      id: 'sf-pivot-recon',
      label: 'Recon',
      description: 'Read the truss radiation gauge for a safe window.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'conduit-shielded' },
        { type: 'reveal_node', nodeId: 'shielded-conduit' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-to-conduit', 'sf-hold'],
        },
      ],
    },
    {
      id: 'sf-to-conduit',
      label: 'Reroute to Conduit',
      description: 'Pull the pod off the exposed truss.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'shielded-conduit' },
        { type: 'add_travel_turns', turns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-conduit-advance'],
        },
      ],
    },
    {
      id: 'sf-hold',
      label: 'Hold',
      description: 'Shelter the pod until the flare eases.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'conduit-shielded', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-hold-continue'],
        },
      ],
    },
    {
      id: 'sf-hold-continue',
      label: 'Continue',
      description: 'Advance after holding.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['sf-to-conduit'],
        },
      ],
    },
    {
      id: 'sf-conduit-advance',
      label: 'Deliver to Fab Bench',
      description: 'Bring the pod in through the conduit.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'fab-bench' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Supply pod delivered to the Fab Bench.',
        },
      ],
    },
  ],
  events: [
    {
      id: 'truss-radiation-spike',
      title: 'RADIATION SPIKE',
      description:
        'Flare intensity spikes over the exposed truss. The direct approach to Fab Bench is unsafe.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'sf-direct' },
      once: true,
      effects: [
        {
          type: 'block_edge',
          edgeId: 'truss-fab',
          message: 'ROUTE UNAVAILABLE',
        },
        { type: 'move_to', nodeId: 'outer-ring' },
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
          id: 'sf-pivot-recon',
          label: 'Recon',
          description: 'Read the truss radiation gauge for a safe window.',
          actionType: 'recon',
          effects: [
            { type: 'reveal_intel', intelId: 'conduit-shielded' },
            { type: 'reveal_node', nodeId: 'shielded-conduit' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sf-to-conduit', 'sf-hold'],
            },
          ],
        },
        {
          id: 'sf-to-conduit',
          label: 'Reroute to Conduit',
          description: 'Pull the pod off the exposed truss.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'shielded-conduit' },
            { type: 'add_travel_turns', turns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sf-conduit-advance'],
            },
          ],
        },
        {
          id: 'sf-hold',
          label: 'Hold',
          description: 'Shelter the pod until the flare eases.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'conduit-shielded', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['sf-hold-continue'],
            },
          ],
        },
      ],
    },
    {
      id: 'sf-manual-comms-static',
      title: 'COMMS STATIC',
      description: 'Flare noise is scrambling telemetry from the pod.',
      statusLabel: 'conditions_changed',
      trigger: { type: 'manual', code: 'comms-static' },
      once: false,
      effects: [
        {
          type: 'log',
          tone: 'conditions_changed',
          title: 'CONDITIONS CHANGED',
          body: 'Telemetry is unreliable. Decide how to proceed.',
        },
        { type: 'set_status', status: 'pivot' },
      ],
      choices: [
        {
          id: 'sf-manual-continue',
          label: 'Continue on dead reckoning',
          description: 'Proceed without live telemetry.',
          actionType: 'adapt',
          effects: [
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            { type: 'set_status', status: 'active' },
          ],
        },
        {
          id: 'sf-manual-hold',
          label: 'Hold',
          description: 'Wait for telemetry to clear.',
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
      id: 'sf-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'sf-conduit-intel',
      label: 'Mapped shielded conduit',
      intel: 2,
      requireIntel: ['conduit-shielded'],
    },
    {
      id: 'sf-adapt',
      label: 'Adapted to radiation spike',
      pivotTokens: 1,
      requireAdaptedEvent: 'truss-radiation-spike',
    },
  ],
}
