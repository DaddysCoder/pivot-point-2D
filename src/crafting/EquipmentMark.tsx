import type { EquipmentId } from '@/crafting/craftingTypes'
import type { ReactNode } from 'react'

interface EquipmentMarkProps {
  equipmentId: EquipmentId | string
  size?: number
  className?: string
  title?: string
}

/** Field-kit / tabletop equipment marks. Decorative when labelled nearby. */
export function EquipmentMark({
  equipmentId,
  size = 48,
  className = '',
  title,
}: EquipmentMarkProps) {
  const ink = '#1a1f16'
  const paper = '#e8dcc4'
  const copper = '#c4894a'
  const wood = '#6a5a40'
  const olive = '#3f5c3c'

  let art: ReactNode
  switch (equipmentId) {
    case 'field-bridge-kit':
      art = (
        <>
          <rect x="14" y="48" width="72" height="10" fill={wood} stroke={ink} strokeWidth="2" />
          <path
            d="M20 48 L36 28 L64 28 L80 48"
            fill={paper}
            stroke={ink}
            strokeWidth="2"
          />
          <line x1="36" y1="28" x2="36" y2="48" stroke={ink} strokeWidth="2" />
          <line x1="50" y1="28" x2="50" y2="48" stroke={ink} strokeWidth="2" />
          <line x1="64" y1="28" x2="64" y2="48" stroke={ink} strokeWidth="2" />
          <path d="M28 58 H72" stroke={copper} strokeWidth="2" strokeDasharray="4 3" />
        </>
      )
      break
    case 'repair-kit':
      art = (
        <>
          <rect x="22" y="30" width="56" height="40" rx="2" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="30" y="38" width="40" height="24" fill={paper} stroke={ink} strokeWidth="1.5" />
          <path
            d="M40 62 L48 42 L56 62"
            fill="none"
            stroke={copper}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="40" r="4" fill={olive} stroke={ink} strokeWidth="1" />
        </>
      )
      break
    case 'recon-kit':
      art = (
        <>
          <rect x="24" y="40" width="22" height="16" rx="3" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="54" y="40" width="22" height="16" rx="3" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="44" y="44" width="12" height="8" fill={paper} stroke={ink} strokeWidth="1.5" />
          <circle cx="35" cy="48" r="5" fill="none" stroke={copper} strokeWidth="2" />
          <circle cx="65" cy="48" r="5" fill="none" stroke={copper} strokeWidth="2" />
          <path d="M30 36 H40 M60 36 H70" stroke={ink} strokeWidth="2" />
        </>
      )
      break
    case 'portable-radio':
      art = (
        <>
          <rect x="34" y="36" width="32" height="40" rx="2" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="40" y="44" width="20" height="12" fill={paper} stroke={ink} strokeWidth="1.5" />
          <circle cx="50" cy="66" r="4" fill={copper} />
          <line x1="50" y1="36" x2="50" y2="16" stroke={ink} strokeWidth="2.5" />
          <path
            d="M50 18 L62 28 M50 22 L66 34"
            fill="none"
            stroke={copper}
            strokeWidth="1.5"
          />
        </>
      )
      break
    case 'supply-cache':
      art = (
        <>
          <rect x="22" y="34" width="56" height="36" fill={wood} stroke={ink} strokeWidth="2" />
          <path d="M22 34 L50 22 L78 34" fill={paper} stroke={ink} strokeWidth="2" />
          <line x1="50" y1="34" x2="50" y2="70" stroke={ink} strokeWidth="2" />
          <rect x="44" y="48" width="12" height="8" fill={copper} stroke={ink} strokeWidth="1" />
        </>
      )
      break
    case 'route-markers':
      art = (
        <>
          <rect x="18" y="28" width="50" height="44" fill={paper} stroke={ink} strokeWidth="2" />
          <path d="M28 40 H58 M28 52 H50 M28 64 H54" stroke={wood} strokeWidth="2" />
          <line x1="72" y1="72" x2="72" y2="28" stroke={ink} strokeWidth="2.5" />
          <path d="M72 28 L88 36 L72 44 Z" fill={copper} stroke={ink} strokeWidth="1.5" />
          <line x1="58" y1="68" x2="58" y2="40" stroke={ink} strokeWidth="2" />
          <path d="M58 40 L70 46 L58 52 Z" fill={olive} stroke={ink} strokeWidth="1.5" />
        </>
      )
      break
    default:
      art = (
        <rect x="28" y="28" width="44" height="44" fill={paper} stroke={ink} strokeWidth="2" />
      )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {art}
    </svg>
  )
}
