export const TUTORIAL_STEPS = [
  {
    id: 'objective',
    title: 'Your objective',
    body: 'This card stays visible. Complete that goal by choosing actions, not by clicking the map.',
  },
  {
    id: 'actions',
    title: 'Available actions',
    body: 'Pick one listed action each time. Labels such as Recon or Reroute describe the kind of move.',
  },
  {
    id: 'map',
    title: 'The map marker',
    body: 'The highlighted marker is your current position. The map records the situation; it is not free movement.',
  },
  {
    id: 'resources',
    title: 'Resources',
    body: 'Materials and Intel are used in play. Pivot Tokens can be earned but are not spendable yet.',
  },
  {
    id: 'pivot',
    title: 'Pivot Event',
    body: 'Your original plan changed. Choose a new approach; this is not a failure.',
  },
] as const
