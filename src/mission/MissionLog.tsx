import type { MissionLogEntry } from '@/engine/types'

interface MissionLogProps {
  entries: MissionLogEntry[]
}

export function MissionLog({ entries }: MissionLogProps) {
  const visible = [...entries].reverse().slice(0, 12)

  return (
    <aside
      className="pp-ruled max-h-64 overflow-auto border border-[var(--pp-route)]/35 bg-[color-mix(in_srgb,var(--pp-parchment)_88%,white)] p-3"
      aria-label="Mission log"
    >
      <h2 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
        Field notebook
      </h2>
      <ol className="space-y-2">
        {visible.map((entry) => (
          <li key={entry.id} className="border-l-2 border-[var(--pp-route)]/40 pl-2">
            <p className="pp-mono text-[10px] uppercase tracking-wide text-[var(--pp-route)]">
              T{entry.turn} · {entry.title}
            </p>
            <p className="text-sm text-[var(--pp-ink)]">{entry.body}</p>
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="text-sm text-[var(--pp-route)]">No entries yet.</li>
        ) : null}
      </ol>
    </aside>
  )
}
