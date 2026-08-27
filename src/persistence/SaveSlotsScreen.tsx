import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { listSaves, type SaveSlot } from '@/persistence/db'

export function SaveSlotsScreen() {
  const { game, playStyle, activeSaveId, loadSaveSlot, saveToSlot, deleteSaveSlot } =
    useGame()
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [label, setLabel] = useState('Campaign save')
  const [message, setMessage] = useState<string | null>(null)

  const refresh = async () => {
    setSlots(await listSaves())
  }

  useEffect(() => {
    void listSaves().then(setSlots)
  }, [activeSaveId])

  // Refresh list after explicit save/delete actions via refresh()

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Save slots</h1>
          <p className="text-sm text-[var(--pp-route)]">
            Active: {activeSaveId} · {game.character.callSign || 'unnamed'}
          </p>
        </div>
        <Link to="/base" className="underline underline-offset-2">
          Base
        </Link>
      </header>

      <Panel title="Save current campaign">
        <label className="block text-sm">
          Slot label
          <input
            className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const id = `slot-${crypto.randomUUID().slice(0, 6)}`
              await saveToSlot(id, label || id)
              setMessage(`Saved ${label}`)
              await refresh()
            }}
          >
            Save new slot
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await saveToSlot(activeSaveId, label || activeSaveId)
              setMessage(`Updated ${activeSaveId}`)
              await refresh()
            }}
          >
            Overwrite active
          </Button>
        </div>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        <p className="mt-2 text-xs text-[var(--pp-route)]">
          Play Style autosave stays local (music {playStyle.musicEnabled ? 'on' : 'off'}).
        </p>
      </Panel>

      <Panel title="Load">
        {slots.length === 0 ? (
          <p className="text-sm">No saved slots yet.</p>
        ) : (
          <ul className="space-y-2">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-[var(--pp-route)]/30 p-3"
              >
                <div>
                  <p className="font-serif font-semibold">{slot.label}</p>
                  <p className="text-xs text-[var(--pp-route)]">
                    {slot.character.callSign} ·{' '}
                    {new Date(slot.updatedAt).toLocaleString()} · {slot.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await loadSaveSlot(slot.id)
                      setMessage(`Loaded ${slot.label}`)
                    }}
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await deleteSaveSlot(slot.id)
                      await refresh()
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
