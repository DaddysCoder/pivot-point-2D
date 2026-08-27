import { BaseBuildingMark } from '@/base/BaseBuildingMark'
import { UPGRADE_DEFS } from '@/base/buildingMeta'
import { Button } from '@/components/Button'
import { getWorldPack } from '@/worlds/registry'

interface BuildingPaletteProps {
  worldId: string
  materials: number
  buildingLevels: Record<string, number>
  onUpgrade: (buildingId: string) => void
  onSelectBuilding?: (buildingId: string) => void
  selectedId?: string | null
}

export function BuildingPalette({
  worldId,
  materials,
  buildingLevels,
  onUpgrade,
  onSelectBuilding,
  selectedId,
}: BuildingPaletteProps) {
  const world = getWorldPack(worldId)

  return (
    <div className="space-y-3" aria-label="Base upgrades">
      <p className="text-sm text-[var(--pp-route)]">
        Materials available: <strong>{materials}</strong>
      </p>
      {UPGRADE_DEFS.map((upgrade) => {
        const def = world?.buildings.find((b) => b.id === upgrade.id)
        const level = buildingLevels[upgrade.id] ?? 0
        const available = level < upgrade.maxLevel
        const canAfford = materials >= upgrade.cost
        const selected = selectedId === upgrade.id
        return (
          <div
            key={upgrade.id}
            className={`flex gap-3 border-l-2 py-2 pl-3 ${
              selected
                ? 'border-[var(--pp-copper)] bg-[color-mix(in_srgb,var(--pp-parchment)_70%,#c4894a)]/30'
                : 'border-[var(--pp-route)]/35'
            }`}
          >
            <button
              type="button"
              className="pp-tactile shrink-0"
              aria-label={`Select ${def?.name ?? upgrade.label}`}
              onClick={() => onSelectBuilding?.(upgrade.id)}
            >
              <BaseBuildingMark buildingId={upgrade.id} size={40} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="pp-display text-lg text-[var(--pp-ink)]">
                {def?.name ?? upgrade.label}
              </p>
              <p className="mb-2 text-sm text-[var(--pp-route)]">
                {def?.description ?? upgrade.label} · Lv {level}/{upgrade.maxLevel} ·
                Cost {upgrade.cost}
              </p>
              <Button
                variant="secondary"
                disabled={!available || !canAfford}
                onClick={() => {
                  onSelectBuilding?.(upgrade.id)
                  onUpgrade(upgrade.id)
                }}
              >
                {!available
                  ? 'Maxed'
                  : canAfford
                    ? level === 0
                      ? 'Build'
                      : 'Upgrade'
                    : 'Need more materials'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
