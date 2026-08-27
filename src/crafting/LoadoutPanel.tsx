import { getEquipmentDefinition } from '@/crafting/blueprintRegistry'
import {
  getOwnedQuantity,
} from '@/crafting/craftingEngine'
import { EquipmentMark } from '@/crafting/EquipmentMark'
import type {
  EquipmentId,
  EquipmentInventoryEntry,
} from '@/crafting/craftingTypes'
import { LOADOUT_LIMIT } from '@/crafting/craftingTypes'
import { Button } from '@/components/Button'

interface LoadoutPanelProps {
  inventory: EquipmentInventoryEntry[]
  activeLoadout: EquipmentId[]
  onEquip: (equipmentId: EquipmentId) => boolean
  onUnequip: (equipmentId: EquipmentId) => boolean
  compact?: boolean
}

export function LoadoutPanel({
  inventory,
  activeLoadout,
  onEquip,
  onUnequip,
  compact = false,
}: LoadoutPanelProps) {
  const ownedIds = inventory
    .filter((e) => e.quantity > 0)
    .map((e) => e.equipmentId)

  const slots = Array.from({ length: LOADOUT_LIMIT }, (_, i) => activeLoadout[i] ?? null)

  return (
    <section aria-labelledby="loadout-title" className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
          Before deployment
        </p>
        <h2 id="loadout-title" className="pp-display text-2xl text-[var(--pp-ink)]">
          {compact ? 'Field loadout' : 'Select field loadout'}
        </h2>
        <p className="text-sm text-[var(--pp-route)]">
          {LOADOUT_LIMIT} slots. Equipment adds options — never required for success.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Loadout slots">
        {slots.map((id, index) => {
          const def = id ? getEquipmentDefinition(id) : null
          return (
            <li
              key={`slot-${index}`}
              className="flex min-h-16 items-center gap-3 border border-[var(--pp-route)]/35 bg-[color-mix(in_srgb,var(--pp-parchment)_88%,white)] px-3 py-2"
            >
              {def && id ? (
                <>
                  <EquipmentMark equipmentId={id} size={40} title={def.name} />
                  <div className="min-w-0 flex-1">
                    <p className="pp-display text-base text-[var(--pp-ink)]">{def.name}</p>
                    <p className="pp-mono text-[10px] uppercase tracking-wide text-[var(--pp-accent)]">
                      Slot {index + 1}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="shrink-0 px-2 py-1 text-xs"
                    onClick={() => onUnequip(id)}
                    aria-label={`Unequip ${def.name}`}
                  >
                    Clear
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[var(--pp-route)]">
                  Slot {index + 1} · empty
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {!compact ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--pp-route)]">
            Owned equipment
          </p>
          {ownedIds.length === 0 ? (
            <p className="text-sm text-[var(--pp-route)]">Craft equipment to fill the loadout.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {ownedIds.map((id) => {
                const def = getEquipmentDefinition(id)
                if (!def) return null
                const equipped = activeLoadout.includes(id)
                const full = activeLoadout.length >= LOADOUT_LIMIT
                return (
                  <li key={id}>
                    <Button
                      variant="secondary"
                      className="h-auto gap-2 px-3 py-2"
                      disabled={equipped || full}
                      onClick={() => onEquip(id)}
                      aria-label={
                        equipped
                          ? `${def.name} already equipped`
                          : `Equip ${def.name}`
                      }
                    >
                      <EquipmentMark equipmentId={id} size={28} />
                      <span className="text-left">
                        <span className="block pp-display text-sm">{def.name}</span>
                        <span className="block pp-mono text-[9px] uppercase tracking-wide text-[var(--pp-accent)]">
                          Qty {getOwnedQuantity(inventory, id)}
                          {equipped ? ' · Equipped' : ''}
                        </span>
                      </span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}
