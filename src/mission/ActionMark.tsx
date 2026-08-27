import type { ActionType } from '@/engine/types'

interface ActionMarkProps {
  actionType: ActionType
  size?: number
  className?: string
}

const META: Record<ActionType, { glyph: string; label: string }> = {
  recon: { glyph: '◎', label: 'Recon' },
  adapt: { glyph: '↻', label: 'Adapt' },
  repair: { glyph: '⚒', label: 'Repair' },
  reroute: { glyph: '⑂', label: 'Reroute' },
  hold: { glyph: '▮', label: 'Hold' },
  ask: { glyph: '⌁', label: 'Ask' },
  build: { glyph: '⌂', label: 'Build' },
  retreat: { glyph: '↩', label: 'Retreat' },
  move: { glyph: '→', label: 'Move' },
  continue: { glyph: '⟶', label: 'Continue' },
}

export function ActionMark({
  actionType,
  size = 28,
  className = '',
}: ActionMarkProps) {
  const meta = META[actionType] ?? { glyph: '·', label: actionType }
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-center justify-center border border-[var(--pp-route)]/45 bg-[color-mix(in_srgb,var(--pp-parchment)_85%,white)] text-[var(--pp-ink)] ${className}`}
      style={{ width: size, height: size }}
      title={meta.label}
      aria-hidden
    >
      <span className="leading-none" style={{ fontSize: size * 0.42 }}>
        {meta.glyph}
      </span>
    </span>
  )
}
