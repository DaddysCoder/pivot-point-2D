import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import {
  APPEARANCE_OPTIONS,
  EMBLEM_OPTIONS,
  EMBLEM_BG_SWATCHES,
  EMBLEM_FG_SWATCHES,
  PALETTE_SWATCHES,
  ROLE_OPTIONS,
} from '@/character/characterTypes'
import { EmblemMark } from '@/character/EmblemMark'
import { OperatorPortrait } from '@/character/OperatorPortrait'
import { RoleMark } from '@/character/RoleMark'
import { VisualOption, VisualOptionGroup } from '@/character/VisualOption'
import {
  createDraftCharacter,
  saveCharacterToStorage,
} from '@/character/characterStore'
import { useGame } from '@/app/useGame'
import type {
  AppearanceConfig,
  CharacterRole,
  EmblemConfig,
  PlayerCharacter,
} from '@/engine/types'

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--pp-route)]"
    >
      {children}
    </label>
  )
}

const fieldClass =
  'w-full border border-[var(--pp-route)]/45 bg-[color-mix(in_srgb,var(--pp-parchment)_88%,white)] px-3 py-2 text-[var(--pp-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pp-copper)]'

function HeadwearPreview({
  headwear,
  palette,
}: {
  headwear: string
  palette: string
}) {
  const cloth = PALETTE_SWATCHES[palette]?.cloth ?? '#5a6b45'
  const dark = '#2a3038'
  return (
    <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden>
      <ellipse cx="24" cy="26" rx="12" ry="12" fill="#c4a07a" />
      {headwear === 'cap' ? (
        <path d="M12 20 Q24 8 36 20 L40 22 H8 Z" fill={dark} />
      ) : null}
      {headwear === 'helm' ? (
        <path d="M12 22 Q24 6 36 22 V28 H12 Z" fill={dark} stroke={cloth} />
      ) : null}
      {headwear === 'visor' ? (
        <rect x="14" y="20" width="20" height="5" rx="1" fill={dark} />
      ) : null}
      {headwear === 'none' ? (
        <path d="M14 18 Q24 10 34 18" fill="none" stroke={dark} strokeWidth="3" />
      ) : null}
    </svg>
  )
}

export function CharacterCreator() {
  const navigate = useNavigate()
  const { setCharacter, game } = useGame()
  const [draft, setDraft] = useState<PlayerCharacter>(() =>
    game.character.callSign
      ? { ...game.character }
      : createDraftCharacter(),
  )

  const roleMeta = useMemo(
    () => ROLE_OPTIONS.find((r) => r.id === draft.role),
    [draft.role],
  )

  const update = (patch: Partial<PlayerCharacter>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const updateAppearance = (key: keyof AppearanceConfig, value: string) => {
    update({ appearance: { ...draft.appearance, [key]: value } })
  }

  const updateEmblem = (key: keyof EmblemConfig, value: string) => {
    update({ emblem: { ...draft.emblem, [key]: value } })
  }

  const canSubmit = draft.callSign.trim().length >= 2

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="pp-fade-up mb-6">
        <p className="pp-display text-3xl text-[var(--pp-parchment)] md:text-4xl">
          Pivot Point
        </p>
        <p className="mt-1 max-w-xl text-sm text-[color-mix(in_srgb,var(--pp-parchment)_70%,transparent)]">
          Commission an operator. Plans change — find your next move.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.85fr)]">
        <div className="pp-surface pp-fade-up space-y-6 p-5 md:p-6">
          <h1 className="pp-display text-3xl text-[var(--pp-ink)]">
            Operator dossier
          </h1>

          <div>
            <FieldLabel htmlFor="callsign">Call sign</FieldLabel>
            <input
              id="callsign"
              value={draft.callSign}
              onChange={(e) => update({ callSign: e.target.value.toUpperCase() })}
              className={fieldClass}
              maxLength={16}
              autoComplete="off"
              required
            />
          </div>

          <VisualOptionGroup legend="Role">
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((role) => (
                <VisualOption
                  key={role.id}
                  selected={draft.role === role.id}
                  label={`Select ${role.label} role. ${role.flavour}`}
                  onSelect={() => update({ role: role.id as CharacterRole })}
                  className="flex gap-3 p-3 pr-6"
                >
                  <RoleMark role={role.id} size={36} />
                  <span className="min-w-0">
                    <span className="block pp-display text-lg leading-tight text-[var(--pp-ink)]">
                      {role.label}
                    </span>
                    <span className="block text-sm text-[var(--pp-ink)]">
                      {role.flavour}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--pp-route)]">
                      {role.bonus}
                    </span>
                  </span>
                </VisualOption>
              ))}
            </div>
            {/* Accessible fallback */}
            <label className="sr-only" htmlFor="role-fallback">
              Role (list)
            </label>
            <select
              id="role-fallback"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              value={draft.role}
              onChange={(e) => update({ role: e.target.value as CharacterRole })}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            {roleMeta ? (
              <p className="mt-2 text-sm text-[var(--pp-route)]">
                Selected: {roleMeta.label} — {roleMeta.bonus}
              </p>
            ) : null}
          </VisualOptionGroup>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="displayName">Display name (optional)</FieldLabel>
              <input
                id="displayName"
                value={draft.displayName ?? ''}
                onChange={(e) => update({ displayName: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="pronouns">Pronouns (optional)</FieldLabel>
              <input
                id="pronouns"
                value={draft.pronouns ?? ''}
                onChange={(e) => update({ pronouns: e.target.value })}
                className={fieldClass}
              />
            </div>
          </div>

          <VisualOptionGroup legend="Headwear">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {APPEARANCE_OPTIONS.headwear.map((opt) => (
                <VisualOption
                  key={opt}
                  selected={draft.appearance.headwear === opt}
                  label={`Select ${opt} headwear`}
                  onSelect={() => updateAppearance('headwear', opt)}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <HeadwearPreview
                    headwear={opt}
                    palette={draft.appearance.palette}
                  />
                  <span className="text-xs capitalize text-[var(--pp-ink)]">{opt}</span>
                </VisualOption>
              ))}
            </div>
          </VisualOptionGroup>

          <VisualOptionGroup legend="Field palette">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {APPEARANCE_OPTIONS.palette.map((opt) => {
                const swatch = PALETTE_SWATCHES[opt]!
                return (
                  <VisualOption
                    key={opt}
                    selected={draft.appearance.palette === opt}
                    label={`Select ${swatch.label}`}
                    onSelect={() => updateAppearance('palette', opt)}
                    className="flex flex-col items-center gap-1 p-2"
                  >
                    <span
                      className="block h-10 w-10 border border-[var(--pp-ink)]/40"
                      style={{
                        background: `linear-gradient(135deg, ${swatch.cloth} 60%, ${swatch.trim})`,
                      }}
                      aria-hidden
                    />
                    <span className="text-[10px] uppercase tracking-wide text-[var(--pp-ink)]">
                      {opt}
                    </span>
                  </VisualOption>
                )
              })}
            </div>
          </VisualOptionGroup>

          <fieldset>
            <legend className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--pp-route)]">
              Appearance details
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                ['bodyStyle', 'face', 'hair', 'clothing', 'accessory'] as const
              ).map((key) => (
                <div key={key}>
                  <FieldLabel htmlFor={`appearance-${key}`}>{key}</FieldLabel>
                  <select
                    id={`appearance-${key}`}
                    value={draft.appearance[key]}
                    onChange={(e) => updateAppearance(key, e.target.value)}
                    className={fieldClass}
                  >
                    {APPEARANCE_OPTIONS[key].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>

          <VisualOptionGroup legend="Emblem symbol">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {EMBLEM_OPTIONS.symbol.map((symbol) => (
                <VisualOption
                  key={symbol}
                  selected={draft.emblem.symbol === symbol}
                  label={`Select ${symbol} emblem symbol`}
                  onSelect={() => updateEmblem('symbol', symbol)}
                  className="flex flex-col items-center p-2"
                >
                  <EmblemMark
                    emblem={{ ...draft.emblem, symbol }}
                    size={44}
                    title={`${symbol} emblem`}
                  />
                </VisualOption>
              ))}
            </div>
          </VisualOptionGroup>

          <VisualOptionGroup legend="Emblem shape">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EMBLEM_OPTIONS.shape.map((shape) => (
                <VisualOption
                  key={shape}
                  selected={draft.emblem.shape === shape}
                  label={`Select ${shape} emblem shape`}
                  onSelect={() => updateEmblem('shape', shape)}
                  className="flex flex-col items-center p-2"
                >
                  <EmblemMark
                    emblem={{ ...draft.emblem, shape }}
                    size={48}
                    title={`${shape} emblem`}
                  />
                  <span className="mt-1 text-[10px] uppercase tracking-wide">
                    {shape}
                  </span>
                </VisualOption>
              ))}
            </div>
          </VisualOptionGroup>

          <VisualOptionGroup legend="Emblem background">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EMBLEM_OPTIONS.background.map((background) => (
                <VisualOption
                  key={background}
                  selected={draft.emblem.background === background}
                  label={`Select ${background} emblem background`}
                  onSelect={() => updateEmblem('background', background)}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <span
                    className="block h-9 w-9 border border-[var(--pp-ink)]/30"
                    style={{ background: EMBLEM_BG_SWATCHES[background] }}
                    aria-hidden
                  />
                  <span className="text-[10px] uppercase tracking-wide">
                    {background}
                  </span>
                </VisualOption>
              ))}
            </div>
          </VisualOptionGroup>

          <VisualOptionGroup legend="Emblem colour">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EMBLEM_OPTIONS.colour.map((colour) => (
                <VisualOption
                  key={colour}
                  selected={draft.emblem.colour === colour}
                  label={`Select ${colour} emblem colour`}
                  onSelect={() => updateEmblem('colour', colour)}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <EmblemMark
                    emblem={{ ...draft.emblem, colour }}
                    size={40}
                    title={`${colour} emblem`}
                  />
                  <span
                    className="block h-2 w-8"
                    style={{ background: EMBLEM_FG_SWATCHES[colour] }}
                    aria-hidden
                  />
                </VisualOption>
              ))}
            </div>
          </VisualOptionGroup>

          <div className="flex flex-wrap gap-3 border-t border-[var(--pp-route)]/25 pt-4">
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const character = {
                  ...draft,
                  callSign: draft.callSign.trim().toUpperCase(),
                }
                saveCharacterToStorage(character)
                setCharacter(character)
                navigate('/base')
              }}
            >
              Enter the war room
            </Button>
          </div>
        </div>

        <aside className="pp-surface-dark sticky top-4 flex flex-col items-center justify-start gap-3 self-start p-5 pp-fade-up">
          <p className="self-start text-[10px] uppercase tracking-[0.2em] text-[var(--pp-copper)]">
            Field preview
          </p>
          <OperatorPortrait
            appearance={draft.appearance}
            emblem={draft.emblem}
            callSign={draft.callSign || '——'}
            role={draft.role}
            size={240}
          />
        </aside>
      </div>
    </div>
  )
}
