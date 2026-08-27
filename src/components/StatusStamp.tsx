import { useEffect, useRef } from 'react'

interface StatusStampProps {
  title: string
  detail?: string
  visible: boolean
  onDismiss?: () => void
  durationMs?: number
  className?: string
}

/** Non-blocking stamp/status feedback for placement, upgrades, resolutions. */
export function StatusStamp({
  title,
  detail,
  visible,
  onDismiss,
  durationMs = 1600,
  className = '',
}: StatusStampProps) {
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!visible || !title) return
    const id = window.setTimeout(() => {
      onDismissRef.current?.()
    }, durationMs)
    return () => window.clearTimeout(id)
  }, [visible, title, detail, durationMs])

  if (!visible || !title) return null

  return (
    <div
      className={`pp-status-stamp pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 border-2 border-[var(--pp-ink)] bg-[var(--pp-parchment)] px-5 py-3 text-center shadow-[0_10px_28px_rgba(0,0,0,0.35)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="pp-display text-sm font-bold uppercase tracking-[0.16em] text-[var(--pp-alert)]">
        {title}
      </p>
      {detail ? (
        <p className="mt-1 text-sm text-[var(--pp-route)]">{detail}</p>
      ) : null}
    </div>
  )
}
