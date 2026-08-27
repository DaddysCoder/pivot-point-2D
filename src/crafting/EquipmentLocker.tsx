import { getEquipmentDefinition } from '@/crafting/blueprintRegistry'
import { getOwnedQuantity } from '@/crafting/craftingEngine'
import { EquipmentMark } from '@/crafting/EquipmentMark'
import type { EquipmentInventoryEntry } from '@/crafting/craftingTypes'

interface EquipmentLockerProps {
  inventory: EquipmentInventoryEntry[]
}

export function EquipmentLocker({ inventory }: EquipmentLockerProps) {
  const owned = inventory.filter((e) => e.quantity > 0)

  return (
    <section aria-labelledby="equipment-locker-title" className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
          Field stores
        </p>
        <h2
          id="equipment-locker-title"
          className="pp-display text-2xl text-[var(--pp-ink)]"
        >
          Equipment locker
        </h2>
      </div>

      {owned.length === 0 ? (
        <p className="text-sm text-[var(--pp-route)]">
          No crafted equipment yet. Fabricate a blueprint to stock the locker.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {owned.map((entry) => {
            const def = getEquipmentDefinition(entry.equipmentId)
            if (!def) return null
            return (
              <li
                key={entry.equipmentId}
                className="flex gap-3 border-l-2 border-[var(--pp-route)]/35 py-2 pl-3"
              >
                <EquipmentMark
                  equipmentId={entry.equipmentId}
                  size={56}
                  title={def.name}
                />
                <div className="min-w-0">
                  <p className="pp-display text-lg text-[var(--pp-ink)]">{def.name}</p>
                  <p className="pp-mono text-[10px] uppercase tracking-[0.14em] text-[var(--pp-accent)]">
                    Qty {getOwnedQuantity(inventory, entry.equipmentId)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--pp-route)]">{def.purpose}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
