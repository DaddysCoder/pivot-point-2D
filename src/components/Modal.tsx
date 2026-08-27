import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/Button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose?: () => void
  footer?: ReactNode
  className?: string
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  className = '',
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={`fixed inset-0 z-50 m-auto w-[min(92vw,36rem)] border-2 border-[var(--pp-route)] bg-[var(--pp-parchment)] p-0 text-[var(--pp-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.45)] open:flex open:flex-col backdrop:bg-[rgba(12,16,22,0.62)] ${className}`}
      onCancel={(event) => {
        if (!onClose) {
          event.preventDefault()
          return
        }
        onClose()
      }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--pp-route)]/30 px-5 py-4">
        <h2 id={titleId} className="pp-display text-2xl text-[var(--pp-ink)]">
          {title}
        </h2>
        {onClose ? (
          <Button variant="ghost" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </header>
      <div className="px-5 py-4">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--pp-route)]/30 px-5 py-4">
          {footer}
        </footer>
      ) : null}
    </dialog>
  )
}
