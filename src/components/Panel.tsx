import type { HTMLAttributes, ReactNode } from 'react'

interface PanelProps extends HTMLAttributes<HTMLElement> {
  title?: string
  children: ReactNode
  as?: 'section' | 'div' | 'aside'
}

export function Panel({
  title,
  children,
  className = '',
  as: Tag = 'section',
  ...rest
}: PanelProps) {
  return (
    <Tag className={`pp-surface p-4 md:p-5 ${className}`} {...rest}>
      {title ? (
        <h2 className="pp-display mb-3 text-xl tracking-wide text-[var(--pp-ink)] md:text-2xl">
          {title}
        </h2>
      ) : null}
      {children}
    </Tag>
  )
}
