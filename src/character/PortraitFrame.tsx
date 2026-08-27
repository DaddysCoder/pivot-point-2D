import type { AppearanceConfig, CharacterRole, EmblemConfig, PortraitStyle } from '@/engine/types'
import { illustratedPortraitFor } from '@/character/illustratedPortraits'
import { OperatorPortrait } from '@/character/OperatorPortrait'

interface PortraitFrameProps {
  appearance: AppearanceConfig
  emblem: EmblemConfig
  callSign?: string
  role?: CharacterRole
  portraitStyle?: PortraitStyle
  size?: number
  className?: string
  showEmblem?: boolean
}

/** Renders the illustrated portrait when the operator has one selected and available for their role, else the customizable SVG portrait. */
export function PortraitFrame({
  appearance,
  emblem,
  callSign,
  role,
  portraitStyle,
  size = 220,
  className = '',
  showEmblem = true,
}: PortraitFrameProps) {
  const illustrated = role && portraitStyle === 'illustrated' ? illustratedPortraitFor(role) : undefined

  if (illustrated) {
    const height = Math.round(size * 1.25)
    return (
      <figure className={`relative inline-flex flex-col items-center ${className}`}>
        <img
          src={illustrated}
          alt={
            callSign
              ? `Illustrated portrait of operator ${callSign}${role ? `, ${role}` : ''}`
              : 'Illustrated operator portrait'
          }
          width={size}
          height={height}
          style={{ width: size, height }}
          className="border border-[var(--pp-route)]/40 object-cover drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
        />
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

  return (
    <OperatorPortrait
      appearance={appearance}
      emblem={emblem}
      callSign={callSign}
      role={role}
      size={size}
      className={className}
      showEmblem={showEmblem}
    />
  )
}
