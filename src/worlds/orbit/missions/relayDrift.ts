import type { MissionDefinition } from '@/engine/types'

/** WORLD 02 — ORBIT: first mission for the space exploration pack. */
export const relayDriftMission: MissionDefinition = {
  id: 'relay-drift',
  name: 'Relay Drift',
  objective: 'Reposition a drifting relay buoy back into the Habitat link corridor.',
  tacticalLevel: 2,
  map: {
    id: 'relay-drift-map',
    width: 5,
    height: 5,
    startNodeId: 'habitat',
    objectiveNodeId: 'buoy',
    nodes: [
      {
        id: 'habitat',
        label: 'Habitat',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'transit',
        label: 'Transit',
        position: { x: 1, y: 3 },
        terrainId: 'road',
        tags: [],
      },
      {
        id: 'dock-gate',
        label: 'Dock Gate',
        position: { x: 2, y: 2 },
        terrainId: 'crossing',
        tags: [],
      },
      {
        id: 'service-rail',
        label: 'Service Rail',
        position: { x: 4, y: 2 },
        terrainId: 'track',
        tags: [],
      },
      {
        id: 'debris',
        label: 'Debris Field',
        position: { x: 3, y: 1 },
        terrainId: 'forest',
        tags: ['hidden'],
      },
      {
        id: 'buoy',
        label: 'Relay Buoy',
        position: { x: 2, y: 0 },
        terrainId: 'hills',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'hab-transit',
        from: 'habitat',
        to: 'transit',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'transit-dock',
        from: 'transit',
        to: 'dock-gate',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'dock-buoy',
        from: 'dock-gate',
        to: 'buoy',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'dock-rail',
        from: 'dock-gate',
        to: 'service-rail',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'rail-debris',
        from: 'service-rail',
        to: 'debris',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'debris-buoy',
        from: 'debris',
        to: 'buoy',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'orbit-orders',
      title: 'Orders',
      description: 'Relay buoy drifted off corridor. Restore Habitat link.',
    },
  ],
  intelCatalog: [
    {
      id: 'debris-path',
      title: 'Debris corridor',
      description: 'A longer but open path through the debris field.',
      revealsNodeIds: ['debris'],
    },
  ],
  initialChoices: [
    {
      id: 'rd-direct',
      label: 'Direct corridor',
      description: 'Take Transit → Dock Gate → Buoy.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'transit' },
        { type: 'move_to', nodeId: 'dock-gate' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Direct Habitat corridor selected.',
        },
      ],
    },
    {
      id: 'rd-recon',
      label: 'Scan first',
      description: 'Spend a turn scanning for alternate corridors.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'reveal_intel', intelId: 'debris-path' },
        { type: 'reveal_node', nodeId: 'debris' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-direct', 'rd-via-rail'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Debris corridor marked as viable.',
        },
      ],
    },
    {
      id: 'rd-via-rail',
      label: 'Service Rail',
      description: 'Approach via the service rail and debris field.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'transit' },
        { type: 'move_to', nodeId: 'dock-gate' },
        { type: 'move_to', nodeId: 'service-rail' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-rail-advance'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'rd-via-rail',
      label: 'Service Rail',
      description: 'Approach via the service rail and debris field.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'transit' },
        { type: 'move_to', nodeId: 'dock-gate' },
        { type: 'move_to', nodeId: 'service-rail' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-rail-advance'],
        },
      ],
    },
    {
      id: 'rd-pivot-recon',
      label: 'Recon',
      description: 'Map a bypass around the sealed gate.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'debris-path' },
        { type: 'reveal_node', nodeId: 'debris' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-to-rail', 'rd-hold'],
        },
      ],
    },
    {
      id: 'rd-to-rail',
      label: 'Reroute to Service Rail',
      description: 'Leave the sealed dock approach.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'service-rail' },
        { type: 'add_travel_turns', turns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-rail-advance'],
        },
      ],
    },
    {
      id: 'rd-hold',
      label: 'Hold',
      description: 'Wait for dock systems to recycle.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'debris-path', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-hold-continue'],
        },
      ],
    },
    {
      id: 'rd-hold-continue',
      label: 'Continue',
      description: 'Advance after holding.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-to-rail'],
        },
      ],
    },
    {
      id: 'rd-rail-advance',
      label: 'Push through debris',
      description: 'Use Service Rail into the debris field.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'debris' },
        {
          type: 'set_active_choices',
          choiceIds: ['rd-finish'],
        },
      ],
    },
    {
      id: 'rd-finish',
      label: 'Secure Relay Buoy',
      description: 'Lock the buoy back into corridor alignment.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'buoy' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Relay buoy restored to Habitat corridor.',
        },
      ],
    },
  ],
  events: [
    {
      id: 'dock-sealed',
      title: 'DOCK GATE SEALED',
      description:
        'An automated lockdown sealed the direct buoy approach. Your original corridor is unavailable.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'rd-direct' },
      once: true,
      effects: [
        {
          type: 'block_edge',
          edgeId: 'dock-buoy',
          message: 'ROUTE UNAVAILABLE',
        },
        { type: 'move_to', nodeId: 'dock-gate' },
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
          id: 'rd-pivot-recon',
          label: 'Recon',
          description: 'Map a bypass around the sealed gate.',
          actionType: 'recon',
          effects: [
            { type: 'reveal_intel', intelId: 'debris-path' },
            { type: 'reveal_node', nodeId: 'debris' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['rd-to-rail', 'rd-hold'],
            },
          ],
        },
        {
          id: 'rd-to-rail',
          label: 'Reroute to Service Rail',
          description: 'Leave the sealed dock approach.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'service-rail' },
            { type: 'add_travel_turns', turns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['rd-rail-advance'],
            },
          ],
        },
        {
          id: 'rd-hold',
          label: 'Hold',
          description: 'Wait for dock systems to recycle.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'debris-path', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['rd-hold-continue'],
            },
          ],
        },
      ],
    },
  ],
  rewards: [
    {
      id: 'rd-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'rd-debris-intel',
      label: 'Mapped debris corridor',
      intel: 2,
      requireIntel: ['debris-path'],
    },
    {
      id: 'rd-adapt',
      label: 'Adapted to dock seal',
      pivotTokens: 1,
      requireAdaptedEvent: 'dock-sealed',
    },
  ],
}
