import { useId } from 'react'
import type { EmblemConfig } from '@/engine/types'

const BG: Record<string, string> = {
  slate: '#3d4754',
  forest: '#2f4a32',
  sand: '#b9a57a',
  night: '#1a2230',
  steel: '#5a6570',
}

const FG: Record<string, string> = {
  gold: '#d4b45a',
  copper: '#c4894a',
  ivory: '#f0e6d0',
  jade: '#6a9a78',
  crimson: '#a84a45',
}

interface EmblemMarkProps {
  emblem: EmblemConfig
  size?: number
  className?: string
  title?: string
}

function SymbolPath({ symbol, color }: { symbol: string; color: string }) {
  switch (symbol) {
    case 'star':
      return (
        <polygon
          points="50,18 56,40 78,40 60,54 66,76 50,62 34,76 40,54 22,40 44,40"
          fill={color}
        />
      )
    case 'anchor':
      return (
        <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="28" r="7" fill={color} stroke="none" />
          <path d="M50 35 V72" />
          <path d="M32 56 H68" />
          <path d="M28 62 Q50 82 72 62" />
        </g>
      )
    case 'leaf':
      return (
        <path
          d="M50 22 C68 34 74 52 50 78 C26 52 32 34 50 22 Z"
          fill={color}
        />
      )
    case 'signal':
      return (
        <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
          <path d="M38 62 Q50 48 62 62" />
          <path d="M32 52 Q50 32 68 52" />
          <path d="M26 42 Q50 18 74 42" />
          <circle cx="50" cy="70" r="4" fill={color} stroke="none" />
        </g>
      )
    case 'orbit':
      return (
        <g fill="none" stroke={color} strokeWidth="4">
          <ellipse cx="50" cy="50" rx="26" ry="12" transform="rotate(-28 50 50)" />
          <circle cx="50" cy="50" r="7" fill={color} stroke="none" />
        </g>
      )
    case 'gear':
      return (
        <g fill={color}>
          <circle cx="50" cy="50" r="12" />
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <rect
                key={deg}
                x="46"
                y="22"
                width="8"
                height="16"
                rx="1"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
          </g>
          <circle cx="50" cy="50" r="5" fill={BG.night} />
        </g>
      )
    case 'chevron':
    default:
      return (
        <path
          d="M32 58 L50 34 L68 58 L60 58 L50 46 L40 58 Z"
          fill={color}
        />
      )
  }
}

function ShapeClip({ shape }: { shape: string }) {
  switch (shape) {
    case 'circle':
      return <circle cx="50" cy="50" r="42" />
    case 'hex':
      return <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" />
    case 'banner':
      return <path d="M18 16 H82 V78 L50 66 L18 78 Z" />
    case 'shield':
    default:
      return <path d="M50 10 L84 24 V52 C84 72 68 86 50 92 C32 86 16 72 16 52 V24 Z" />
  }
}

export function EmblemMark({
  emblem,
  size = 72,
  className = '',
  title = 'Operator emblem',
}: EmblemMarkProps) {
  const bg = BG[emblem.background] ?? BG.slate
  const fg = FG[emblem.colour] ?? FG.gold
  const uid = useId().replace(/:/g, '')
  const clipId = `emblem-clip-${uid}`
  const shineId = `emblem-shine-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={clipId}>
          <ShapeClip shape={emblem.shape} />
        </clipPath>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={bg} />
        <rect width="100" height="100" fill={`url(#${shineId})`} />
        <SymbolPath symbol={emblem.symbol} color={fg} />
      </g>
      <g fill="none" stroke={fg} strokeWidth="2.5" opacity="0.9">
        <ShapeClip shape={emblem.shape} />
      </g>
    </svg>
  )
}
