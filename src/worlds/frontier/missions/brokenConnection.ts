import type { MissionDefinition } from '@/engine/types'

export const brokenConnectionMission: MissionDefinition = {
  id: 'broken-connection',
  name: 'Broken Connection',
  objective: 'Restore communications between South Relay and North Link.',
  tacticalLevel: 3,
  map: {
    id: 'broken-connection-map',
    width: 5,
    height: 5,
    startNodeId: 'south-relay',
    objectiveNodeId: 'north-link',
    nodes: [
      {
        id: 'south-relay',
        label: 'South Relay',
        position: { x: 0, y: 4 },
        terrainId: 'base',
        tags: ['start'],
      },
      {
        id: 'wire-road',
        label: 'Wire Road',
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
        id: 'spare-depot',
        label: 'Spare Depot',
        position: { x: 4, y: 2 },
        terrainId: 'track',
        tags: ['hidden'],
      },
      {
        id: 'north-link',
        label: 'North Link',
        position: { x: 2, y: 0 },
        terrainId: 'base',
        tags: ['objective'],
      },
    ],
    edges: [
      {
        id: 'south-wire',
        from: 'south-relay',
        to: 'wire-road',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'wire-junction',
        from: 'wire-road',
        to: 'junction',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'junction-north',
        from: 'junction',
        to: 'north-link',
        travelCost: 1,
        tags: ['main'],
      },
      {
        id: 'junction-depot',
        from: 'junction',
        to: 'spare-depot',
        travelCost: 1,
        tags: ['alt'],
      },
      {
        id: 'depot-north',
        from: 'spare-depot',
        to: 'north-link',
        travelCost: 1,
        tags: ['alt'],
      },
    ],
  },
  startingIntel: [
    {
      id: 'comms-orders',
      title: 'Orders',
      description: 'Line fault reported between South Relay and North Link.',
    },
  ],
  intelCatalog: [
    {
      id: 'spare-parts',
      title: 'Spare Depot',
      description: 'A secondary depot holds replacement coils.',
      revealsNodeIds: ['spare-depot'],
    },
  ],
  initialChoices: [
    {
      id: 'bc-direct',
      label: 'Trace main line',
      description: 'Follow Wire Road to the junction fault.',
      actionType: 'adapt',
      effects: [
        { type: 'move_to', nodeId: 'wire-road' },
        { type: 'move_to', nodeId: 'junction' },
        {
          type: 'log',
          tone: 'info',
          title: 'PLAN SET',
          body: 'Tracing the main communications line.',
        },
      ],
    },
    {
      id: 'bc-ask',
      label: 'Ask North Link',
      description: 'Request a status check before moving.',
      actionType: 'ask',
      effects: [
        { type: 'reveal_intel', intelId: 'spare-parts' },
        { type: 'reveal_node', nodeId: 'spare-depot' },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-direct', 'bc-via-depot'],
        },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'North Link suggests spare coils at the eastern depot.',
        },
      ],
    },
    {
      id: 'bc-via-depot',
      label: 'Collect spares first',
      description: 'Visit the depot before repairing the junction.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'wire-road' },
        { type: 'move_to', nodeId: 'junction' },
        { type: 'move_to', nodeId: 'spare-depot' },
        { type: 'modify_resource', resource: 'materials', amount: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-finish-depot'],
        },
      ],
    },
  ],
  choiceLibrary: [
    {
      id: 'bc-via-depot',
      label: 'Collect spares first',
      description: 'Visit the depot before repairing the junction.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'wire-road' },
        { type: 'move_to', nodeId: 'junction' },
        { type: 'move_to', nodeId: 'spare-depot' },
        { type: 'modify_resource', resource: 'materials', amount: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-finish-depot'],
        },
      ],
    },
    {
      id: 'bc-repair',
      label: 'Repair',
      description: 'Attempt a field repair at the junction.',
      actionType: 'repair',
      effects: [
        { type: 'require_resource', resource: 'materials', amount: 1 },
        { type: 'unblock_edge', edgeId: 'junction-north' },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-finish-main'],
        },
        {
          type: 'log',
          tone: 'info',
          title: 'LINE STABILISED',
          body: 'Temporary splice restores the northern span.',
        },
      ],
    },
    {
      id: 'bc-reroute-depot',
      label: 'Reroute to Depot',
      description: 'Fetch coils from the spare depot.',
      actionType: 'reroute',
      effects: [
        { type: 'move_to', nodeId: 'spare-depot' },
        { type: 'modify_resource', resource: 'materials', amount: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-finish-depot'],
        },
      ],
    },
    {
      id: 'bc-hold',
      label: 'Hold',
      description: 'Wait for a parts drop.',
      actionType: 'hold',
      effects: [
        { type: 'schedule_intel', intelId: 'spare-parts', afterTurns: 1 },
        { type: 'increment_pivot' },
        { type: 'clear_active_event' },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-hold-continue'],
        },
      ],
    },
    {
      id: 'bc-hold-continue',
      label: 'Continue',
      description: 'Parts window opens.',
      actionType: 'continue',
      effects: [
        { type: 'add_travel_turns', turns: 1 },
        { type: 'modify_resource', resource: 'materials', amount: 1 },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-repair-after-hold', 'bc-reroute-depot'],
        },
      ],
    },
    {
      id: 'bc-repair-after-hold',
      label: 'Repair junction',
      description: 'Use arrived materials to splice the line.',
      actionType: 'repair',
      effects: [
        { type: 'require_resource', resource: 'materials', amount: 1 },
        { type: 'unblock_edge', edgeId: 'junction-north' },
        {
          type: 'set_active_choices',
          choiceIds: ['bc-finish-main'],
        },
      ],
    },
    {
      id: 'bc-finish-main',
      label: 'Confirm North Link',
      description: 'Walk the restored line to North Link.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'north-link' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Communications restored.',
        },
      ],
    },
    {
      id: 'bc-finish-depot',
      label: 'Relay via Depot path',
      description: 'Complete the link using the depot spur.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'north-link' },
        { type: 'complete_mission' },
        {
          type: 'log',
          tone: 'info',
          title: 'OBJECTIVE MET',
          body: 'Communications restored via depot spur.',
        },
      ],
    },
  ],
  events: [
    {
      id: 'line-severed',
      title: 'LINE SEVERED',
      description:
        'The northern span is fully down. The direct confirmation path is unavailable until repaired or bypassed.',
      statusLabel: 'route_unavailable',
      trigger: { type: 'on_choice', choiceId: 'bc-direct' },
      once: true,
      effects: [
        {
          type: 'block_edge',
          edgeId: 'junction-north',
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
          id: 'bc-repair',
          label: 'Repair',
          description: 'Attempt a field repair at the junction.',
          actionType: 'repair',
          effects: [
            { type: 'require_resource', resource: 'materials', amount: 1 },
            { type: 'unblock_edge', edgeId: 'junction-north' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['bc-finish-main'],
            },
          ],
        },
        {
          id: 'bc-repair-kit',
          label: 'Repair with Kit',
          description: 'Use the Repair Kit to splice the northern span.',
          actionType: 'repair',
          requireEquipment: ['repair-kit'],
          consumeEquipment: ['repair-kit'],
          effects: [
            { type: 'unblock_edge', edgeId: 'junction-north' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['bc-finish-main'],
            },
            {
              type: 'log',
              tone: 'info',
              title: 'LINE STABILISED',
              body: 'Repair Kit splice restores the northern span.',
            },
          ],
        },
        {
          id: 'bc-contact-radio',
          label: 'Contact Unit',
          description: 'Raise North Link on the Portable Radio.',
          actionType: 'ask',
          requireEquipment: ['portable-radio'],
          effects: [
            { type: 'reveal_intel', intelId: 'spare-parts' },
            { type: 'reveal_node', nodeId: 'spare-depot' },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['bc-reroute-depot', 'bc-repair', 'bc-hold'],
            },
            {
              type: 'log',
              tone: 'new_intel',
              title: 'NEW INTEL',
              body: 'North Link confirms spare coils at the eastern depot.',
            },
          ],
        },
        {
          id: 'bc-reroute-depot',
          label: 'Reroute to Depot',
          description: 'Fetch coils from the spare depot.',
          actionType: 'reroute',
          effects: [
            { type: 'move_to', nodeId: 'spare-depot' },
            { type: 'modify_resource', resource: 'materials', amount: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['bc-finish-depot'],
            },
          ],
        },
        {
          id: 'bc-hold',
          label: 'Hold',
          description: 'Wait for a parts drop.',
          actionType: 'hold',
          effects: [
            { type: 'schedule_intel', intelId: 'spare-parts', afterTurns: 1 },
            { type: 'increment_pivot' },
            { type: 'clear_active_event' },
            {
              type: 'set_active_choices',
              choiceIds: ['bc-hold-continue'],
            },
          ],
        },
      ],
    },
    {
      id: 'bc-manual-intel',
      title: 'NEW INTEL',
      description: 'Mission Control inserts a spare-depot sighting.',
      statusLabel: 'new_intel',
      trigger: { type: 'manual', code: 'new-intel' },
      once: false,
      effects: [
        { type: 'reveal_intel', intelId: 'spare-parts' },
        { type: 'reveal_node', nodeId: 'spare-depot' },
        {
          type: 'log',
          tone: 'new_intel',
          title: 'NEW INTEL',
          body: 'Spare Depot confirmed on the eastern spur.',
        },
        { type: 'set_status', status: 'pivot' },
      ],
      choices: [
        {
          id: 'bc-manual-ack',
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
    },
    {
      id: 'bc-objective-shift',
      title: 'OBJECTIVE UPDATED',
      description: 'Priority shifts: restore any working path, not only the main span.',
      statusLabel: 'objective_updated',
      trigger: { type: 'manual', code: 'objective-changed' },
      once: false,
      effects: [
        {
          type: 'log',
          tone: 'objective_updated',
          title: 'OBJECTIVE UPDATED',
          body: 'Any restored path to North Link satisfies the brief.',
        },
        { type: 'set_status', status: 'pivot' },
      ],
      choices: [
        {
          id: 'bc-objective-ack',
          label: 'Adapt plan',
          description: 'Accept the updated objective.',
          actionType: 'adapt',
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
      id: 'bc-complete',
      label: 'Mission complete',
      materials: 5,
      onComplete: true,
    },
    {
      id: 'bc-depot-intel',
      label: 'Located Spare Depot',
      intel: 2,
      requireIntel: ['spare-parts'],
    },
    {
      id: 'bc-adapt',
      label: 'Adapted to severed line',
      pivotTokens: 1,
      requireAdaptedEvent: 'line-severed',
    },
  ],
}
