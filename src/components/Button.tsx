import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--pp-accent)] text-[var(--pp-parchment)] hover:brightness-110 border-[color-mix(in_srgb,var(--pp-accent)_70%,black)] shadow-[0_2px_0_rgba(0,0,0,0.25)]',
  secondary:
    'bg-[color-mix(in_srgb,var(--pp-parchment)_92%,white)] text-[var(--pp-ink)] hover:bg-[var(--pp-parchment)] border-[var(--pp-route)]/55',
  ghost:
    'bg-transparent text-[var(--pp-ink)] hover:bg-black/5 border-transparent',
  danger:
    'bg-[var(--pp-alert)] text-[var(--pp-parchment)] hover:brightness-110 border-[color-mix(in_srgb,var(--pp-alert)_70%,black)]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`pp-tactile inline-flex items-center justify-center gap-2 rounded-none border-2 px-4 py-2 text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pp-copper)] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
