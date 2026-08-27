import type { ReactNode } from 'react'

interface BaseBuildingMarkProps {
  buildingId: string
  size?: number
  className?: string
}

/** Tabletop planning-board markers for base buildings. Decorative when labelled nearby. */
export function BaseBuildingMark({
  buildingId,
  size = 48,
  className = '',
}: BaseBuildingMarkProps) {
  const ink = '#1a1f16'
  const paper = '#e8dcc4'
  const copper = '#c4894a'
  const wood = '#6a5a40'

  let art: ReactNode
  switch (buildingId) {
    case 'command':
      art = (
        <>
          <path d="M10 48 L50 18 L90 48 Z" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="28" y="42" width="44" height="28" fill={paper} stroke={ink} strokeWidth="2" />
          <line x1="50" y1="18" x2="50" y2="8" stroke={copper} strokeWidth="3" />
          <circle cx="50" cy="8" r="4" fill={copper} />
        </>
      )
      break
    case 'map-room':
      art = (
        <>
          <rect x="18" y="28" width="64" height="40" fill={paper} stroke={ink} strokeWidth="2" />
          <path d="M28 48 H72 M40 36 V60 M60 36 V60" stroke={wood} strokeWidth="2" />
          <circle cx="50" cy="48" r="5" fill={copper} />
        </>
      )
      break
    case 'workshop':
      art = (
        <>
          <rect x="22" y="34" width="56" height="34" fill={wood} stroke={ink} strokeWidth="2" />
          <path d="M22 34 L50 18 L78 34" fill={paper} stroke={ink} strokeWidth="2" />
          <path d="M38 58 L48 40 L58 58" fill="none" stroke={copper} strokeWidth="3" />
        </>
      )
      break
    case 'storage':
      art = (
        <>
          <rect x="20" y="42" width="28" height="22" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="52" y="42" width="28" height="22" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="36" y="26" width="28" height="20" fill={paper} stroke={ink} strokeWidth="2" />
        </>
      )
      break
    case 'recon':
      art = (
        <>
          <rect x="44" y="30" width="12" height="40" fill={wood} stroke={ink} strokeWidth="2" />
          <rect x="30" y="18" width="40" height="16" fill={paper} stroke={ink} strokeWidth="2" />
          <circle cx="42" cy="26" r="4" fill="none" stroke={copper} strokeWidth="2" />
          <circle cx="58" cy="26" r="4" fill="none" stroke={copper} strokeWidth="2" />
        </>
      )
      break
    case 'archive':
      art = (
        <>
          <rect x="26" y="22" width="48" height="48" fill={wood} stroke={ink} strokeWidth="2" />
          <line x1="26" y1="38" x2="74" y2="38" stroke={ink} strokeWidth="2" />
          <line x1="26" y1="54" x2="74" y2="54" stroke={ink} strokeWidth="2" />
          <rect x="44" y="42" width="6" height="8" fill={copper} />
        </>
      )
      break
    case 'comms-tower':
      art = (
        <>
          <line x1="50" y1="70" x2="50" y2="16" stroke={ink} strokeWidth="3" />
          <path d="M50 20 L70 40 M50 20 L30 40" fill="none" stroke={wood} strokeWidth="2" />
          <circle cx="50" cy="14" r="5" fill={copper} stroke={ink} strokeWidth="1.5" />
          <path
            d="M58 18 Q70 14 74 22 M62 26 Q74 22 78 30"
            fill="none"
            stroke={copper}
            strokeWidth="1.5"
          />
        </>
      )
      break
    default:
      art = (
        <rect x="30" y="30" width="40" height="40" fill={paper} stroke={ink} strokeWidth="2" />
      )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      role="presentation"
    >
      {art}
    </svg>
  )
}
