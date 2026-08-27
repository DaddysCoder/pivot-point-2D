import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import {
  deleteFacilitatorProfile,
  listFacilitatorProfiles,
  saveFacilitatorProfile,
  type FacilitatorProfile,
} from '@/persistence/db'

export function FacilitatorProfilesScreen() {
  const [profiles, setProfiles] = useState<FacilitatorProfile[]>([])
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = useCallback(async () => {
    setProfiles(await listFacilitatorProfiles())
    setReady(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Mission Control profiles</h1>
          <p className="text-sm text-[var(--pp-route)]">
            Local facilitator preferences only. No clinical labels in player view.
          </p>
        </div>
        <Link to="/base" className="underline underline-offset-2">
          Base
        </Link>
      </header>

      <Panel title="New profile">
        <label className="block text-sm">
          Display name
          <input
            className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          Notes
          <textarea
            className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <Button
          className="mt-3"
          disabled={!name.trim()}
          onClick={async () => {
            await saveFacilitatorProfile({
              id: `fac-${crypto.randomUUID().slice(0, 6)}`,
              displayName: name.trim(),
              notes,
              preferredPredictability: 'balanced',
            })
            setName('')
            setNotes('')
            await refresh()
          }}
        >
          Save profile
        </Button>
      </Panel>

      <Panel title="Saved">
        {!ready ? (
          <p className="text-sm">Loading profiles…</p>
        ) : profiles.length === 0 ? (
          <p className="text-sm">No facilitator profiles yet.</p>
        ) : (
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-2 border border-[var(--pp-route)]/30 p-3"
              >
                <div>
                  <p className="font-serif font-semibold">{p.displayName}</p>
                  <p className="text-sm text-[var(--pp-route)]">{p.notes || '—'}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await deleteFacilitatorProfile(p.id)
                    await refresh()
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
