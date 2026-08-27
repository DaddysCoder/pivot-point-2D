import type { AppearanceConfig, CharacterRole } from '@/engine/types'
import { EmblemMark } from '@/character/EmblemMark'
import type { EmblemConfig } from '@/engine/types'

const PALETTE: Record<
  string,
  { cloth: string; clothDark: string; skin: string; hair: string; trim: string }
> = {
  olive: {
    cloth: '#5a6b45',
    clothDark: '#3f4c32',
    skin: '#c4a07a',
    hair: '#3a2f28',
    trim: '#c4894a',
  },
  slate: {
    cloth: '#4a5562',
    clothDark: '#333c47',
    skin: '#c9ad8e',
    hair: '#2c3036',
    trim: '#8aa0b0',
  },
  sand: {
    cloth: '#a89068',
    clothDark: '#7a6848',
    skin: '#d2b08a',
    hair: '#6a4e38',
    trim: '#d4b45a',
  },
  ink: {
    cloth: '#2a3340',
    clothDark: '#1a2230',
    skin: '#b89272',
    hair: '#1a1a1c',
    trim: '#c4894a',
  },
  cobalt: {
    cloth: '#3a5578',
    clothDark: '#2a3e58',
    skin: '#c4a488',
    hair: '#2a3038',
    trim: '#7aa0c0',
  },
  rust: {
    cloth: '#8a4a32',
    clothDark: '#623428',
    skin: '#c8a07c',
    hair: '#4a3028',
    trim: '#d4a060',
  },
}

interface OperatorPortraitProps {
  appearance: AppearanceConfig
  emblem: EmblemConfig
  callSign?: string
  role?: CharacterRole
  size?: number
  className?: string
  showEmblem?: boolean
}

function bodyScale(style: string): number {
  if (style === 'compact') return 0.92
  if (style === 'tall') return 1.06
  if (style === 'broad') return 1.08
  return 1
}

export function OperatorPortrait({
  appearance,
  emblem,
  callSign,
  role,
  size = 220,
  className = '',
  showEmblem = true,
}: OperatorPortraitProps) {
  const palette = PALETTE[appearance.palette] ?? PALETTE.olive!
  const scale = bodyScale(appearance.bodyStyle)
  const faceY =
    appearance.face === 'weathered' ? 2 : appearance.face === 'sharp' ? -1 : 0

  return (
    <figure
      className={`relative inline-flex flex-col items-center ${className}`}
      aria-label={
        callSign
          ? `Portrait of operator ${callSign}${role ? `, ${role}` : ''}`
          : 'Operator portrait'
      }
    >
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 200 230"
        role="presentation"
        className="pp-lamp-glow drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
      >
        <defs>
          <radialGradient id="portrait-glow" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(196,137,74,0.25)" />
            <stop offset="100%" stopColor="rgba(18,24,32,0)" />
          </radialGradient>
          <linearGradient id="coat-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="200" rx="70" ry="14" fill="rgba(0,0,0,0.25)" />
        <circle cx="100" cy="110" r="95" fill="url(#portrait-glow)" />

        <g transform={`translate(100 118) scale(${scale}) translate(-100 -118)`}>
          {/* torso */}
          <path
            d="M48 210 V145 C48 120 70 108 100 108 C130 108 152 120 152 145 V210 Z"
            fill={palette.cloth}
          />
          <path
            d="M48 210 V145 C48 120 70 108 100 108 C130 108 152 120 152 145 V210 Z"
            fill="url(#coat-shine)"
          />
          {appearance.clothing === 'coat' ? (
            <path
              d="M70 120 L100 210 L130 120"
              fill="none"
              stroke={palette.clothDark}
              strokeWidth="8"
            />
          ) : null}
          {appearance.clothing === 'vest' ? (
            <path
              d="M72 130 H128 V210 H72 Z"
              fill={palette.clothDark}
              opacity="0.85"
            />
          ) : null}
          {appearance.clothing === 'flight' ? (
            <path
              d="M55 150 H145"
              stroke={palette.trim}
              strokeWidth="3"
              strokeDasharray="4 3"
            />
          ) : null}

          {/* collar */}
          <path
            d="M78 118 L100 132 L122 118"
            fill="none"
            stroke={palette.clothDark}
            strokeWidth="4"
          />

          {/* neck + head */}
          <rect x="90" y="78" width="20" height="28" rx="4" fill={palette.skin} />
          <ellipse
            cx="100"
            cy={70 + faceY}
            rx={appearance.bodyStyle === 'broad' ? 34 : 30}
            ry={36}
            fill={palette.skin}
          />

          {/* hair */}
          {appearance.hair !== 'none' ? (
            <path
              d={
                appearance.hair === 'braided'
                  ? 'M70 62 Q100 28 130 62 L124 78 Q100 58 76 78 Z'
                  : appearance.hair === 'tied'
                    ? 'M72 58 Q100 30 128 58 L122 74 Q100 56 78 74 Z'
                    : appearance.hair === 'cropped'
                      ? 'M74 60 Q100 38 126 60 L120 70 Q100 56 80 70 Z'
                      : 'M68 64 Q100 26 132 64 L126 78 Q100 58 74 78 Z'
              }
              fill={palette.hair}
            />
          ) : null}

          {/* face marks */}
          <g fill={palette.clothDark} opacity="0.7">
            <ellipse cx="88" cy={68 + faceY} rx="2.2" ry="2.5" />
            <ellipse cx="112" cy={68 + faceY} rx="2.2" ry="2.5" />
            {appearance.face === 'focused' ? (
              <>
                <path d="M80 60 H96" stroke={palette.hair} strokeWidth="2" />
                <path d="M104 60 H120" stroke={palette.hair} strokeWidth="2" />
              </>
            ) : null}
            {appearance.face === 'weathered' ? (
              <>
                <path
                  d="M78 74 Q88 78 96 74"
                  fill="none"
                  stroke={palette.clothDark}
                  strokeWidth="1.5"
                />
                <path
                  d="M104 74 Q112 78 122 74"
                  fill="none"
                  stroke={palette.clothDark}
                  strokeWidth="1.5"
                />
              </>
            ) : null}
          </g>

          {/* headwear */}
          {appearance.headwear === 'cap' ? (
            <path d="M68 54 Q100 34 132 54 L138 58 H62 Z" fill={palette.clothDark} />
          ) : null}
          {appearance.headwear === 'helm' ? (
            <path
              d="M66 58 Q100 28 134 58 V70 H66 Z"
              fill={palette.clothDark}
              stroke={palette.trim}
              strokeWidth="2"
            />
          ) : null}
          {appearance.headwear === 'visor' ? (
            <rect
              x="72"
              y="60"
              width="56"
              height="10"
              rx="2"
              fill={palette.clothDark}
              opacity="0.85"
            />
          ) : null}

          {/* accessory */}
          {appearance.accessory === 'binoculars' ? (
            <g transform="translate(118 120)">
              <rect x="0" y="0" width="12" height="22" rx="3" fill={palette.trim} />
              <rect x="14" y="0" width="12" height="22" rx="3" fill={palette.trim} />
            </g>
          ) : null}
          {appearance.accessory === 'notebook' ? (
            <rect
              x="128"
              y="150"
              width="18"
              height="24"
              rx="2"
              fill="#e8dcc4"
              stroke={palette.clothDark}
            />
          ) : null}
          {appearance.accessory === 'compass' ? (
            <circle cx="138" cy="160" r="10" fill={palette.trim} stroke={palette.clothDark} />
          ) : null}
          {appearance.accessory === 'radio' ? (
            <g transform="translate(130 140)">
              <rect width="16" height="28" rx="2" fill={palette.clothDark} />
              <line x1="8" y1="0" x2="8" y2="-14" stroke={palette.trim} strokeWidth="2" />
            </g>
          ) : null}
        </g>
      </svg>

      {showEmblem ? (
        <div className="absolute bottom-2 right-2">
          <EmblemMark emblem={emblem} size={Math.round(size * 0.28)} />
        </div>
      ) : null}

      {callSign ? (
        <figcaption className="mt-1 text-center">
          <p className="pp-display text-xl tracking-wide text-[var(--pp-parchment)]">
            {callSign}
          </p>
          {role ? (
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
              {role}
            </p>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
