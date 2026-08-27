import type { MissionDefinition } from '@/engine/types'

export const missingReconMission: MissionDefinition = {
  id: 'missing-recon',
  name: 'Missing Recon',
  objective: 'Locate a missing reconnaissance team and restore contact.',
  tacticalLevel: 2,
  map: {
    id: 'missing-recon-map',
    width: 5,
    height: 5,
    startNodeId: 'outpost',
    objectiveNodeId: 'signal-ridge',
    nodes: [
      {
        id: 'outpost',
        label: 'Outpost',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'timber-trail',
        label: 'Timber Trail',
        position: { x: 1, y: 3 },
        terrainId: 'forest',
        tags: [],
      },
      {
        id: 'ravine',
        label: 'Ravine',
        position: { x: 2, y: 2 },
        terrainId: 'hills',
        tags: [],
      },
      {
        id: 'old-camp',
        label: 'Old Camp',
        position: { x: 3, y: 2 },
        terrainId: 'track',
        tags: ['hidden'],
      },
      {
        id: 'signal-ridge',
        label: 'Signal Ridge',
        position: { x: 4, y: 0 },
        terrainId: 'hills',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'outpost-trail',
        from: 'outpost',
        to: 'timber-trail',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'trail-ravine',
        from: 'timber-trail',
        to: 'ravine',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'ravine-camp',
        from: 'ravine',
        to: 'old-camp',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'ravine-ridge',
        from: 'ravine',
        to: 'signal-ridge',
        travelCost: 2,
        tags: ['main'],
      },
      {
        id: 'camp-ridge',
        from: 'old-camp',
        to: 'signal-ridge',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'recon-orders',
      title: 'Orders',
      description: 'Last contact placed the team near Signal Ridge.',
    },
  ],
  intelCatalog: [
    {
      id: 'camp-sighting',
      title: 'Camp sighting',
      description: 'Tracks lead to an abandoned camp east of the ravine.',
      revealsNodeIds: ['old-camp'],
    },
  ],
  initialChoices: [
    {
      id: 'mr-direct',
      label: 'Direct to Ridge',
      description: 'Push the timber trail toward Signal Ridge.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'timber-trail' },
        { type: 'move_to', nodeId: 'ravine' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Direct approach via Timber Trail.',
        },
      ],
    },
    {
      id: 'mr-recon',
      label: 'Recon first',
      description: 'Spend a turn scanning for recent signs.',
      actionType: 'recon',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'reveal_intel', intelId: 'camp-sighting' },
        { type: 'reveal_node', nodeId: 'old-camp' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-direct', 'mr-via-camp'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'An old camp is marked east of the ravine.',
        },
      ],
    },
    {
      id: 'mr-via-camp',
      label: 'Search Old Camp',
      description: 'Investigate the abandoned camp for the team.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'timber-trail' },
        { type: 'move_to', nodeId: 'ravine' },
        { type: 'move_to', nodeId: 'old-camp' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-finish-camp'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'mr-via-camp',
      label: 'Search Old Camp',
      description: 'Investigate the abandoned camp for the team.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'timber-trail' },
        { type: 'move_to', nodeId: 'ravine' },
        { type: 'move_to', nodeId: 'old-camp' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-finish-camp'],
        },
      ],
    },
    {
      id: 'mr-trail-blocked-recon',
      label: 'Recon',
      description: 'Look for another approach to the ridge.',
      actionType: 'recon',
      effects: [
        { type: 'reveal_intel', intelId: 'camp-sighting' },
        { type: 'reveal_node', nodeId: 'old-camp' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-go-camp', 'mr-hold'],
        },
      ],
    },
    {
      id: 'mr-go-camp',
      label: 'Reroute via Old Camp',
      description: 'Use the camp trail to reach Signal Ridge.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'old-camp' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-finish-camp'],
        },
      ],
    },
    {
      id: 'mr-hold',
      label: 'Hold',
      description: 'Wait for a weather window on the ridge path.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'camp-sighting', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-hold-continue'],
        },
      ],
    },
    {
      id: 'mr-hold-continue',
      label: 'Continue',
      description: 'Advance after holding.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['mr-go-camp'],
        },
      ],
    },
    {
      id: 'mr-finish-camp',
      label: 'Climb to Signal Ridge',
      description: 'Escort recovered signals gear to the ridge.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'signal-ridge' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Missing recon team located; contact restored.',
        },
      ],
    },
    {
      id: 'mr-finish-ridge',
      label: 'Reach Signal Ridge',
      description: 'Complete the direct climb.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'signal-ridge' },
        { type: 'complete_mission' },
      ],
    },
  ],
  events: [
    {
      id: 'ridge-path-unstable',
      title: 'RIDGE PATH UNSTABLE',
      description:
        'Recent slides have made the direct ridge climb unsafe. The original approach is no longer available.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'mr-direct' },
      once: true,
      effects: [
        { type: 'block_edge', edgeId: 'ravine-ridge', message: 'ROUTE UNAVAILABLE' },
        { type: 'move_to', nodeId: 'ravine' },
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
          id: 'mr-trail-blocked-recon',
          label: 'Recon',
          description: 'Look for another approach to the ridge.',
          actionType: 'recon',
          effects: [
            { type: 'reveal_intel', intelId: 'camp-sighting' },
            { type: 'reveal_node', nodeId: 'old-camp' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['mr-go-camp', 'mr-hold'],
            },
          ],
        },
        {
          id: 'mr-equipment-recon',
          label: 'Equipment Recon',
          description: 'Use the Recon Kit to scan the slides.',
          actionType: 'recon',
          requireEquipment: ['recon-kit'],
          effects: [
            { type: 'reveal_intel', intelId: 'camp-sighting' },
            { type: 'reveal_node', nodeId: 'old-camp' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['mr-go-camp', 'mr-hold'],
            },
            {
              type: 'log',
              tone: 'new_intel',
              title: 'NEW INTEL',
              body: 'Recon Kit marks the old camp trail as still open.',
            },
          ],
        },
        {
          id: 'mr-mark-route',
          label: 'Mark Alternate Route',
          description: 'Plant Route Markers toward the old camp trail.',
          actionType: 'reroute',
          requireEquipment: ['route-markers'],
          consumeEquipment: ['route-markers'],
          effects: [
            { type: 'reveal_node', nodeId: 'old-camp' },
            { type: 'move_to', nodeId: 'old-camp' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['mr-finish-camp'],
            },
            {
              type: 'log',
              tone: 'conditions_changed',
              title: 'ROUTE MARKED',
              body: 'Markers hold the camp trail for the search party.',
            },
          ],
        },
        {
          id: 'mr-go-camp',
          label: 'Reroute via Old Camp',
          description: 'Use the camp trail to reach Signal Ridge.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'old-camp' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['mr-finish-camp'],
            },
          ],
        },
        {
          id: 'mr-hold',
          label: 'Hold',
          description: 'Wait for a weather window on the ridge path.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'camp-sighting', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['mr-hold-continue'],
            },
          ],
        },
      ],
    },
    {
      id: 'mr-manual-delay',
      title: 'SUPPORT DELAYED',
      description: 'Relay confirms the support element is running late.',
      statusLabel: 'conditions_changed',
      trigger: { type: 'manual', code: 'delay' },
      once: false,
      effects: [
        {
          type: 'log',
          tone: 'conditions_changed',
          title: 'CONDITIONS CHANGED',
          body: 'Support is delayed. Continue with local options.',
        },
        { type: 'set_status', status: 'pivot' },
      ],
      choices: [
        {
          id: 'mr-manual-continue',
          label: 'Continue without support',
          description: 'Proceed using on-hand resources.',
          actionType: 'adapt',
          effects: [
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            { type: 'set_status', status: 'active' },
          ],
        },
        {
          id: 'mr-manual-hold',
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
    },
  ],
  rewards: [
    {
      id: 'mr-complete',
      label: 'Mission complete',
      materials: 4,
      onComplete: true,
    },
    {
      id: 'mr-camp-intel',
      label: 'Found Old Camp',
      intel: 2,
      requireIntel: ['camp-sighting'],
    },
    {
      id: 'mr-adapt',
      label: 'Adapted to unstable ridge',
      pivotTokens: 1,
      requireAdaptedEvent: 'ridge-path-unstable',
    },
  ],
}
