import { BaseBuildingMark } from '@/base/BaseBuildingMark'
import { BUILDING_LABELS } from '@/base/buildingMeta'
import type { BaseState } from '@/engine/types'

interface BaseGridProps {
  base: BaseState
  selectedId: string | null
  onSelect: (buildingId: string) => void
  onPlace?: (buildingId: string, x: number, y: number) => void
  placeModeId?: string | null
}

export function BaseGrid({
  base,
  selectedId,
  onSelect,
  onPlace,
  placeModeId,
}: BaseGridProps) {
  const cells = Array.from({ length: base.gridHeight }, (_, y) =>
    Array.from({ length: base.gridWidth }, (_, x) => {
      const placed = Object.entries(base.placements ?? {}).find(
        ([, pos]) => pos.x === x && pos.y === y,
      )
      return { x, y, buildingId: placed?.[0] ?? null }
    }),
  )

  return (
    <div className="space-y-3">
      <div
        className="pp-map-frame grid gap-1.5 p-3"
        style={{
          gridTemplateColumns: `repeat(${base.gridWidth}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label="Base layout grid"
      >
        {cells.flat().map((cell) => {
          const building = cell.buildingId
            ? base.buildings.find((b) => b.buildingId === cell.buildingId)
            : null
          const selected = selectedId === cell.buildingId
          return (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              role="gridcell"
              aria-label={
                cell.buildingId
                  ? `${BUILDING_LABELS[cell.buildingId] ?? cell.buildingId} level ${building?.level ?? 0} at ${cell.x},${cell.y}`
                  : `Empty cell ${cell.x},${cell.y}`
              }
              onClick={() => {
                if (placeModeId && onPlace && !cell.buildingId) {
                  onPlace(placeModeId, cell.x, cell.y)
                  return
                }
                if (cell.buildingId) onSelect(cell.buildingId)
              }}
              className={`pp-tactile group relative flex min-h-[4.5rem] flex-col items-center justify-center border p-1.5 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pp-ink)] ${
                selected
                  ? 'z-[1] -translate-y-0.5 border-[var(--pp-ink)] bg-[color-mix(in_srgb,var(--pp-parchment)_65%,#c4894a)] shadow-[0_6px_0_rgba(0,0,0,0.18)]'
                  : cell.buildingId
                    ? 'border-[var(--pp-route)]/45 bg-[color-mix(in_srgb,var(--pp-parchment)_82%,#8a9a6a)] hover:-translate-y-0.5 hover:border-[var(--pp-copper)] hover:shadow-[0_4px_0_rgba(0,0,0,0.12)]'
                    : 'border-dashed border-[var(--pp-route)]/30 bg-[rgba(26,31,22,0.06)] hover:border-[var(--pp-route)]/55'
              }`}
            >
              {building ? (
                <>
                  <BaseBuildingMark buildingId={building.buildingId} size={40} />
                  <p className="pp-display text-[11px] leading-tight text-[var(--pp-ink)]">
                    {BUILDING_LABELS[building.buildingId] ?? building.buildingId}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide text-[var(--pp-route)]">
                    Lv {building.level}
                  </p>
                </>
              ) : placeModeId ? (
                <span className="text-xs text-[var(--pp-route)]">Place</span>
              ) : (
                <span className="text-[10px] text-[var(--pp-route)]/40" aria-hidden>
                  ·
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2" role="list" aria-label="Buildings">
        {base.buildings
          .filter((b) => b.level > 0)
          .map((building) => (
            <button
              key={building.buildingId}
              type="button"
              role="listitem"
              onClick={() => onSelect(building.buildingId)}
              className={`pp-tactile inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition ${
                selectedId === building.buildingId
                  ? 'border-[var(--pp-ink)] bg-[color-mix(in_srgb,var(--pp-parchment)_75%,#c4894a)]'
                  : 'border-[var(--pp-route)]/40 bg-transparent hover:border-[var(--pp-route)]/70'
              }`}
            >
              <BaseBuildingMark buildingId={building.buildingId} size={22} />
              {BUILDING_LABELS[building.buildingId] ?? building.buildingId}
            </button>
          ))}
      </div>
    </div>
  )
}
