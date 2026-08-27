import type { ReactNode } from 'react'

interface VisualOptionGroupProps {
  legend: string
  children: ReactNode
  className?: string
}

/** Accessible radiogroup shell for visual tile selectors. */
export function VisualOptionGroup({
  legend,
  children,
  className = '',
}: VisualOptionGroupProps) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--pp-route)]">
        {legend}
      </legend>
      <div role="radiogroup" aria-label={legend}>
        {children}
      </div>
    </fieldset>
  )
}

interface VisualOptionProps {
  selected: boolean
  label: string
  onSelect: () => void
  children: ReactNode
  className?: string
}

export function VisualOption({
  selected,
  label,
  onSelect,
  children,
  className = '',
}: VisualOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={`pp-tactile relative min-h-11 border-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pp-copper)] ${
        selected
          ? 'border-[var(--pp-ink)] bg-[color-mix(in_srgb,var(--pp-parchment)_75%,#c4894a)] shadow-[inset_0_0_0_1px_var(--pp-copper)]'
          : 'border-[var(--pp-route)]/35 bg-[color-mix(in_srgb,var(--pp-parchment)_90%,white)] hover:border-[var(--pp-route)]/70'
      } ${className}`}
    >
      {selected ? (
        <span
          className="absolute right-1.5 top-1.5 pp-mono text-[9px] uppercase tracking-wide text-[var(--pp-ink)]"
          aria-hidden
        >
          ●
        </span>
      ) : (
        <span
          className="absolute right-1.5 top-1.5 pp-mono text-[9px] text-[var(--pp-route)]/40"
          aria-hidden
        >
          ○
        </span>
      )}
      {children}
    </button>
  )
}
