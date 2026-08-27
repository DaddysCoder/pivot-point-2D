export type {
  PlayerCharacter,
  CharacterRole,
  AppearanceConfig,
  EmblemConfig,
} from '@/engine/types'

export const ROLE_OPTIONS: Array<{
  id: import('@/engine/types').CharacterRole
  label: string
  flavour: string
  bonus: string
}> = [
  {
    id: 'strategist',
    label: 'Strategist',
    flavour: 'Plan beyond the first move.',
    bonus: 'Preview an additional consequence.',
  },
  {
    id: 'scout',
    label: 'Scout',
    flavour: 'See what others miss.',
    bonus: 'Extra information during Recon.',
  },
  {
    id: 'engineer',
    label: 'Engineer',
    flavour: 'Turn obstacles into options.',
    bonus: 'Additional Repair options.',
  },
  {
    id: 'cartographer',
    label: 'Cartographer',
    flavour: 'Know the ground.',
    bonus: 'Reveals more of the map.',
  },
  {
    id: 'quartermaster',
    label: 'Quartermaster',
    flavour: 'Make limited resources work.',
    bonus: 'Improved supply handling.',
  },
  {
    id: 'commander',
    label: 'Commander',
    flavour: 'Keep the objective in sight.',
    bonus: 'Stronger mission coordination.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence Officer',
    flavour: 'Find the missing information.',
    bonus: 'Better conflicting-source reads.',
  },
  {
    id: 'pathfinder',
    label: 'Pathfinder',
    flavour: 'There is always another route.',
    bonus: 'Faster alternate routing.',
  },
]

/** Field colours for palette swatches (visual only). */
export const PALETTE_SWATCHES: Record<string, { cloth: string; trim: string; label: string }> = {
  olive: { cloth: '#5a6b45', trim: '#c4894a', label: 'olive field palette' },
  slate: { cloth: '#4a5562', trim: '#8aa0b0', label: 'slate field palette' },
  sand: { cloth: '#a89068', trim: '#d4b45a', label: 'sand field palette' },
  ink: { cloth: '#2a3340', trim: '#c4894a', label: 'ink field palette' },
  cobalt: { cloth: '#3a5578', trim: '#7aa0c0', label: 'cobalt field palette' },
  rust: { cloth: '#8a4a32', trim: '#d4a060', label: 'rust field palette' },
}

export const EMBLEM_BG_SWATCHES: Record<string, string> = {
  slate: '#3d4754',
  forest: '#2f4a32',
  sand: '#b9a57a',
  night: '#1a2230',
  steel: '#5a6570',
}

export const EMBLEM_FG_SWATCHES: Record<string, string> = {
  gold: '#d4b45a',
  copper: '#c4894a',
  ivory: '#f0e6d0',
  jade: '#6a9a78',
  crimson: '#a84a45',
}

export const APPEARANCE_OPTIONS = {
  bodyStyle: ['standard', 'compact', 'tall', 'broad'],
  face: ['calm', 'focused', 'weathered', 'sharp'],
  hair: ['short', 'tied', 'cropped', 'none', 'braided'],
  clothing: ['field', 'coat', 'vest', 'flight'],
  headwear: ['none', 'cap', 'helm', 'visor'],
  accessory: ['none', 'binoculars', 'notebook', 'compass', 'radio'],
  palette: ['olive', 'slate', 'sand', 'ink', 'cobalt', 'rust'],
} as const

export const EMBLEM_OPTIONS = {
  symbol: ['chevron', 'star', 'anchor', 'leaf', 'signal', 'orbit', 'gear'],
  shape: ['shield', 'circle', 'hex', 'banner'],
  background: ['slate', 'forest', 'sand', 'night', 'steel'],
  colour: ['gold', 'copper', 'ivory', 'jade', 'crimson'],
} as const
