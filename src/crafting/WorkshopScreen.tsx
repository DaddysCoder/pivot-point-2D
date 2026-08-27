import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { playPlace, playUi } from '@/app/sound'
import { listBlueprints } from '@/crafting/blueprintRegistry'
import {
  canCraft,
  getOwnedQuantity,
} from '@/crafting/craftingEngine'
import { EquipmentLocker } from '@/crafting/EquipmentLocker'
import { EquipmentMark } from '@/crafting/EquipmentMark'
import { LoadoutPanel } from '@/crafting/LoadoutPanel'
import type { EquipmentId } from '@/crafting/craftingTypes'
import { Button } from '@/components/Button'
import { StatusStamp } from '@/components/StatusStamp'

export function WorkshopScreen() {
  const navigate = useNavigate()
  const {
    game,
    craftEquipmentItem,
    equipLoadoutItem,
    unequipLoadoutItem,
    playStyle,
  } = useGame()
  const [stamp, setStamp] = useState<{ title: string; detail: string } | null>(
    null,
  )

  const workshopLevel =
    game.base.buildings.find((b) => b.buildingId === 'workshop')?.level ?? 0

  const showStamp = useCallback((title: string, detail: string) => {
    setStamp({ title, detail })
  }, [])

  if (workshopLevel < 1) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <article className="pp-surface p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
            Installation offline
          </p>
          <h1 className="pp-display text-3xl text-[var(--pp-ink)]">Workshop</h1>
          <p className="mt-2 text-[var(--pp-route)]">
            Build the Workshop from Field upgrades to fabricate equipment.
          </p>
          <Button className="mt-4" onClick={() => navigate('/base')}>
            Return to war room
          </Button>
        </article>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <header className="pp-fade-up border-b border-[var(--pp-brass)]/25 pb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
          Fabrication bay
        </p>
        <h1 className="pp-display text-4xl text-[var(--pp-parchment)] md:text-5xl">
          Workshop
        </h1>
        <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--pp-parchment)_72%,transparent)]">
          Prepare optional field equipment. Adaptation remains possible without it.
        </p>
        <div className="pp-mono mt-3 flex flex-wrap gap-3 text-xs text-[var(--pp-parchment)]">
          <span className="border border-[var(--pp-brass)]/35 px-2 py-1">
            Mat {game.resources.materials}
          </span>
          <span className="border border-[var(--pp-brass)]/35 px-2 py-1">
            Intel {game.resources.intel}
          </span>
          <Link
            to="/base"
            className="border border-[var(--pp-brass)]/35 px-2 py-1 uppercase tracking-[0.12em] text-[var(--pp-copper)] hover:border-[var(--pp-copper)]"
            onClick={() => playUi(playStyle)}
          >
            War room
          </Link>
        </div>
      </header>

      <section className="pp-surface p-4 md:p-5" aria-labelledby="blueprints-title">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
          Fabrication
        </p>
        <h2
          id="blueprints-title"
          className="pp-display mb-4 text-2xl text-[var(--pp-ink)]"
        >
          Blueprints
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {listBlueprints().map((blueprint) => {
            const owned = getOwnedQuantity(game.inventory, blueprint.id)
            const craftCheck = canCraft(game, blueprint.id)
            const costParts = [`${blueprint.materialCost} MAT`]
            if (blueprint.intelCost) {
              costParts.push(`${blueprint.intelCost} INTEL`)
            }
            return (
              <li
                key={blueprint.id}
                className="flex gap-3 border border-[var(--pp-route)]/30 bg-[color-mix(in_srgb,var(--pp-parchment)_90%,white)] p-3"
              >
                <EquipmentMark
                  equipmentId={blueprint.id}
                  size={64}
                  title={blueprint.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="pp-display text-xl uppercase tracking-wide text-[var(--pp-ink)]">
                    {blueprint.name}
                  </p>
                  <p className="text-sm text-[var(--pp-route)]">{blueprint.description}</p>
                  <p className="mt-1 pp-mono text-[10px] uppercase tracking-[0.14em] text-[var(--pp-accent)]">
                    {costParts.join(' · ')} · Owned {owned}
                  </p>
                  <Button
                    className="mt-2"
                    variant="secondary"
                    disabled={!craftCheck.ok}
                    onClick={() => {
                      const ok = craftEquipmentItem(blueprint.id)
                      if (ok) {
                        playPlace(playStyle)
                        showStamp('FABRICATION COMPLETE', blueprint.name.toUpperCase())
                      } else {
                        showStamp('FABRICATION HALTED', 'Insufficient resources')
                      }
                    }}
                  >
                    Craft
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="pp-surface p-4 md:p-5">
        <EquipmentLocker inventory={game.inventory} />
      </section>

      <section className="pp-surface p-4 md:p-5">
        <LoadoutPanel
          inventory={game.inventory}
          activeLoadout={game.activeLoadout}
          onEquip={(id: EquipmentId) => {
            const ok = equipLoadoutItem(id)
            if (ok) playUi(playStyle)
            return ok
          }}
          onUnequip={(id: EquipmentId) => {
            const ok = unequipLoadoutItem(id)
            if (ok) playUi(playStyle)
            return ok
          }}
        />
      </section>

      <StatusStamp
        title={stamp?.title ?? ''}
        detail={stamp?.detail}
        visible={Boolean(stamp)}
        onDismiss={() => setStamp(null)}
      />
    </div>
  )
}
