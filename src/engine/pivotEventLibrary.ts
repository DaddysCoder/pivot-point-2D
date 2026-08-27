import type {
  DecisionChoice,
  PivotEventDefinition,
} from '@/engine/types'

/** Reusable Pivot templates — world packs compose these into missions. */
export const PIVOT_EVENT_LIBRARY: PivotEventDefinition[] = [
  {
    id: 'lib-route-blocked',
    title: 'ROUTE UNAVAILABLE',
    description: 'The planned path is closed. Find your next move.',
    statusLabel: 'route_unavailable',
    trigger: { type: 'manual', code: 'route-blocked' },
    effects: [
      {
        type: 'log',
        tone: 'plan_interrupted',
        title: 'PLAN INTERRUPTED',
        body: 'Original route is no longer available.',
      },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-rb-recon',
        label: 'Recon',
        description: 'Gather more information.',
        actionType: 'recon',
        effects: [
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
          {
            type: 'log',
            tone: 'new_intel',
            title: 'NEW INTEL',
            body: 'Alternate approaches noted.',
          },
        ],
      },
      {
        id: 'lib-rb-reroute',
        label: 'Reroute',
        description: 'Take an alternative path.',
        actionType: 'reroute',
        effects: [
          { type: 'add_travel_turns', turns: 2 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-rb-hold',
        label: 'Hold',
        description: 'Wait for conditions to change.',
        actionType: 'hold',
        effects: [
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
    ],
  },
  {
    id: 'lib-intel-conflict',
    title: 'SOURCES DISAGREE',
    description: 'Two reports conflict about the objective location.',
    statusLabel: 'new_intel',
    trigger: { type: 'manual', code: 'intel-conflict' },
    effects: [
      {
        type: 'log',
        tone: 'new_intel',
        title: 'NEW INTEL',
        body: 'Conflicting information requires a decision.',
      },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-ic-ask',
        label: 'Ask',
        description: 'Request clarification from another unit.',
        actionType: 'ask',
        effects: [
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-ic-recon',
        label: 'Recon',
        description: 'Verify on the ground.',
        actionType: 'recon',
        effects: [
          { type: 'add_travel_turns', turns: 1 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
    ],
  },
  {
    id: 'lib-resource-short',
    title: 'RESOURCE LOST',
    description: 'A supply crate is missing. Plans must adjust.',
    statusLabel: 'resource_lost',
    trigger: { type: 'manual', code: 'resource-unavailable' },
    effects: [
      {
        type: 'log',
        tone: 'resource_lost',
        title: 'RESOURCE LOST',
        body: 'Materials shortfall reported.',
      },
      { type: 'modify_resource', resource: 'materials', amount: -1 },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-rs-trade',
        label: 'Trade',
        description: 'Negotiate for replacement supplies. Requires Influence.',
        actionType: 'ask',
        requireResources: { influence: 1 },
        effects: [
          { type: 'require_resource', resource: 'influence', amount: 1 },
          { type: 'modify_resource', resource: 'materials', amount: 1 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-rs-adapt',
        label: 'Adapt',
        description: 'Continue with what remains.',
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
    id: 'lib-weather',
    title: 'CONDITIONS CHANGED',
    description: 'Weather closes visibility on the main approach.',
    statusLabel: 'conditions_changed',
    trigger: { type: 'manual', code: 'weather' },
    effects: [
      {
        type: 'log',
        tone: 'conditions_changed',
        title: 'CONDITIONS CHANGED',
        body: 'Visibility dropped. Timing and routing may change.',
      },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-w-hold',
        label: 'Hold',
        description: 'Wait for a clearer window.',
        actionType: 'hold',
        effects: [
          { type: 'add_travel_turns', turns: 1 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-w-reroute',
        label: 'Reroute',
        description: 'Take covered ground.',
        actionType: 'reroute',
        effects: [
          { type: 'add_travel_turns', turns: 2 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
    ],
  },
  {
    id: 'lib-objective-shift',
    title: 'OBJECTIVE UPDATED',
    description: 'Orders change mid-mission. Priorities compete.',
    statusLabel: 'objective_updated',
    trigger: { type: 'manual', code: 'objective-changed' },
    effects: [
      {
        type: 'log',
        tone: 'objective_updated',
        title: 'OBJECTIVE UPDATED',
        body: 'A second priority now competes with the original brief.',
      },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-os-keep',
        label: 'Keep original',
        description: 'Stay with the first objective.',
        actionType: 'adapt',
        effects: [
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-os-switch',
        label: 'Switch priority',
        description: 'Accept the updated objective.',
        actionType: 'adapt',
        effects: [
          { type: 'set_flag', flag: 'objective_switched', value: true },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
    ],
  },
  {
    id: 'lib-waiting',
    title: 'WAITING',
    description: 'Contact has not replied. Equipment still offline.',
    statusLabel: 'info',
    trigger: { type: 'manual', code: 'delay' },
    effects: [
      {
        type: 'log',
        tone: 'info',
        title: 'WAITING',
        body: 'No reply yet. Decide whether to wait or move.',
      },
      { type: 'set_status', status: 'pivot' },
    ],
    choices: [
      {
        id: 'lib-wait-hold',
        label: 'Hold',
        description: 'Stay until contact returns.',
        actionType: 'hold',
        effects: [
          { type: 'add_travel_turns', turns: 1 },
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
      {
        id: 'lib-wait-continue',
        label: 'Continue',
        description: 'Move without the reply.',
        actionType: 'continue',
        effects: [
          { type: 'increment_pivot' },
          { type: 'clear_active_event' },
          { type: 'set_status', status: 'active' },
        ],
      },
    ],
  },
]

export const COMPLICATION_PRESETS = [
  { id: 'route-blocked', label: 'Route change', libraryId: 'lib-route-blocked' },
  { id: 'missing-resource', label: 'Missing resource', libraryId: 'lib-resource-short' },
  { id: 'incorrect-info', label: 'Incorrect information', libraryId: 'lib-intel-conflict' },
  { id: 'waiting', label: 'Waiting', libraryId: 'lib-waiting' },
  { id: 'weather', label: 'Weather', libraryId: 'lib-weather' },
  { id: 'objective-changed', label: 'Changing objective', libraryId: 'lib-objective-shift' },
] as const

export function cloneLibraryEvent(
  libraryId: string,
  overrides: Partial<PivotEventDefinition> = {},
): PivotEventDefinition | undefined {
  const base = PIVOT_EVENT_LIBRARY.find((e) => e.id === libraryId)
  if (!base) return undefined
  return {
    ...structuredClone(base),
    ...overrides,
    id: overrides.id ?? `${base.id}-${crypto.randomUUID().slice(0, 8)}`,
  }
}

export function defaultAdaptChoices(): DecisionChoice[] {
  return [
    {
      id: 'generic-recon',
      label: 'Recon',
      description: 'Gather more information.',
      actionType: 'recon',
      effects: [{ type: 'increment_pivot' }, { type: 'clear_active_event' }],
    },
    {
      id: 'generic-reroute',
      label: 'Reroute',
      description: 'Take an alternative path.',
      actionType: 'reroute',
      effects: [{ type: 'increment_pivot' }, { type: 'clear_active_event' }],
    },
    {
      id: 'generic-hold',
      label: 'Hold',
      description: 'Wait for conditions to change.',
      actionType: 'hold',
      effects: [{ type: 'increment_pivot' }, { type: 'clear_active_event' }],
    },
  ]
}
