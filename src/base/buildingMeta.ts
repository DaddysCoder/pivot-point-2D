export const BUILDING_LABELS: Record<string, string> = {
  command: 'Command',
  'map-room': 'Map Room',
  workshop: 'Workshop',
  storage: 'Storage',
  recon: 'Recon Post',
  archive: 'Archive',
  'comms-tower': 'Comms Tower',
}

export const UPGRADE_DEFS = [
  {
    id: 'map-room',
    label: 'Upgrade Map Room',
    cost: 3,
    maxLevel: 2,
    mechanical: false,
  },
  {
    id: 'workshop',
    label: 'Build Workshop',
    cost: 5,
    maxLevel: 1,
    mechanical: true,
  },
  {
    id: 'storage',
    label: 'Expand Storage',
    cost: 2,
    maxLevel: 2,
    mechanical: false,
  },
  {
    id: 'recon',
    label: 'Upgrade Recon Post',
    cost: 4,
    maxLevel: 2,
    mechanical: false,
  },
  {
    id: 'archive',
    label: 'Build Archive',
    cost: 4,
    maxLevel: 1,
    mechanical: false,
  },
  {
    id: 'comms-tower',
    label: 'Build Comms Tower',
    cost: 6,
    maxLevel: 1,
    mechanical: false,
  },
] as const
