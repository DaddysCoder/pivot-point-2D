import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  children,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center border border-[var(--pp-brass)]/45 bg-[color-mix(in_srgb,var(--pp-table)_70%,#2a3848)] text-[var(--pp-parchment)] transition hover:border-[var(--pp-copper)] hover:bg-[color-mix(in_srgb,var(--pp-copper)_22%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pp-copper)] disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
