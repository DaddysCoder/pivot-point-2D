import type { EquipmentId } from '@/crafting/craftingTypes'
import type { EquipmentInventoryEntry, MissionDefinition } from '@/engine/types'
import { getEquipmentDefinition } from '@/crafting/blueprintRegistry'
import { EquipmentMark } from '@/crafting/EquipmentMark'
import { LoadoutPanel } from '@/crafting/LoadoutPanel'
import { Button } from '@/components/Button'
import { buildIntelArtefacts } from '@/mission/intelArtefacts'
import { IntelArtefact } from '@/mission/IntelArtefact'
import { playIntel } from '@/app/sound'
import type { SoundGates } from '@/app/sound'

interface MissionBriefProps {
  mission: MissionDefinition
  onBegin: () => void
  onBack: () => void
  soundGates?: SoundGates
  inventory?: EquipmentInventoryEntry[]
  activeLoadout?: EquipmentId[]
  onEquip?: (equipmentId: EquipmentId) => boolean
  onUnequip?: (equipmentId: EquipmentId) => boolean
}

export function MissionBrief({
  mission,
  onBegin,
  onBack,
  soundGates,
  inventory = [],
  activeLoadout = [],
  onEquip,
  onUnequip,
}: MissionBriefProps) {
  const artefacts = buildIntelArtefacts(mission)
  const showLoadoutEditor = Boolean(onEquip && onUnequip)

  return (
    <article className="pp-surface pp-fade-up relative mx-auto max-w-3xl overflow-hidden p-6 md:p-8">
      <div
        className="pointer-events-none absolute -right-2 top-6 pp-stamp text-sm"
        aria-hidden
      >
        Sealed
      </div>

      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
        Field orders · Tactical level {mission.tacticalLevel}
      </p>
      <h1 className="pp-display mt-2 text-4xl text-[var(--pp-ink)] md:text-5xl">
        {mission.name}
      </h1>
      <p className="mt-3 border-l-2 border-[var(--pp-copper)] pl-3 font-serif text-xl leading-snug text-[var(--pp-ink)]">
        {mission.objective}
      </p>

      <section className="mt-6" aria-labelledby="field-intel-title">
        <h2
          id="field-intel-title"
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-route)]"
        >
          Field intelligence
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {artefacts.map((artefact) => (
            <IntelArtefact
              key={artefact.id}
              artefact={artefact}
              map={mission.map}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 border-t border-[var(--pp-route)]/25 pt-5" aria-labelledby="brief-loadout-title">
        <h2
          id="brief-loadout-title"
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]"
        >
          Field loadout
        </h2>
        {showLoadoutEditor ? (
          <div className="mt-3">
            <LoadoutPanel
              inventory={inventory}
              activeLoadout={activeLoadout}
              onEquip={onEquip!}
              onUnequip={onUnequip!}
              compact={false}
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Equipped loadout">
            {activeLoadout.length === 0 ? (
              <li className="text-sm text-[var(--pp-route)]">No equipment selected.</li>
            ) : (
              activeLoadout.map((id) => {
                const def = getEquipmentDefinition(id)
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 border border-[var(--pp-route)]/40 px-2 py-1"
                  >
                    <EquipmentMark equipmentId={id} size={28} />
                    <span className="pp-display text-sm uppercase tracking-wide">
                      {def?.name ?? id}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--pp-route)]/25 pt-5">
        <Button
          onClick={() => {
            if (soundGates) playIntel(soundGates)
            onBegin()
          }}
        >
          Choose initial plan
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Return to war room
        </Button>
      </div>
    </article>
  )
}
