import { useNavigate } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import {
  defaultPlayStyle,
  type DecisionLoad,
  type InformationStyle,
  type MotionPreference,
  type PlayStyleSettings,
  type Predictability,
  type TimePressure,
  type TransitionWarning,
} from '@/settings/playStyleTypes'

function SelectField<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-[0.14em]">
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value
          const matched = options.find((o) => String(o.value) === raw)
          if (matched) onChange(matched.value)
        }}
        className="w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-3 py-2"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function PlayStyleSettingsPanel() {
  const navigate = useNavigate()
  const { playStyle, setPlayStyle } = useGame()

  const update = (patch: Partial<PlayStyleSettings>) => {
    setPlayStyle({ ...playStyle, ...patch })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="font-serif text-4xl font-semibold">Play Style</h1>
      <p className="text-sm text-[var(--pp-route)]">
        Neurodivergence-informed controls. Defaults favour calm, untimed play.
      </p>

      <Panel className="space-y-4">
        <SelectField<Predictability>
          id="predictability"
          label="Predictability"
          value={playStyle.predictability}
          onChange={(predictability) => update({ predictability })}
          options={[
            { value: 'high', label: 'High — advance notice' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'unpredictable', label: 'Unpredictable' },
          ]}
        />
        <SelectField<DecisionLoad>
          id="decision-load"
          label="Decision load"
          value={playStyle.decisionLoad}
          onChange={(decisionLoad) => update({ decisionLoad })}
          options={[
            { value: 2, label: '2 choices' },
            { value: 3, label: '3 choices' },
            { value: 4, label: '4 choices' },
            { value: 'open', label: 'Open strategy' },
          ]}
        />
        <SelectField<TimePressure>
          id="time-pressure"
          label="Time pressure"
          value={playStyle.timePressure}
          onChange={(timePressure) => update({ timePressure })}
          options={[
            { value: 'none', label: 'None (default)' },
            { value: 'gentle', label: 'Gentle' },
            { value: 'tactical', label: 'Tactical' },
          ]}
        />
        <SelectField<InformationStyle>
          id="information-style"
          label="Information style"
          value={playStyle.informationStyle}
          onChange={(informationStyle) => update({ informationStyle })}
          options={[
            { value: 'short', label: 'Short' },
            { value: 'standard', label: 'Standard' },
            { value: 'detailed', label: 'Detailed' },
          ]}
        />
        <SelectField<MotionPreference>
          id="motion"
          label="Motion"
          value={playStyle.motion}
          onChange={(motion) => update({ motion })}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'reduced', label: 'Reduced' },
          ]}
        />
        <SelectField<TransitionWarning>
          id="transitions"
          label="Mission transitions"
          value={playStyle.transitionWarning}
          onChange={(transitionWarning) => update({ transitionWarning })}
          options={[
            { value: 'immediate', label: 'Immediate' },
            { value: '10s', label: '10-second warning' },
            { value: '30s', label: '30-second warning' },
            { value: 'player', label: 'Player-controlled continue' },
          ]}
        />

        <fieldset className="space-y-2">
          <legend className="text-xs uppercase tracking-[0.14em]">Sound</legend>
          {(
            [
              ['musicEnabled', 'Music'],
              ['effectsEnabled', 'Effects'],
              ['alertsEnabled', 'Alerts'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={playStyle[key]}
                onChange={(e) => update({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 border-t border-[var(--pp-route)]/25 pt-4">
          <legend className="text-xs uppercase tracking-[0.14em]">
            Field conditions (playtest)
          </legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={playStyle.adaptiveDirectorEnabled}
              onChange={(e) =>
                update({ adaptiveDirectorEnabled: e.target.checked })
              }
            />
            <span>
              <span className="font-semibold">Responsive field conditions</span>
              <span className="mt-0.5 block text-[var(--pp-route)]">
                When on, vetted mid-mission complications may appear on Supply
                Line. Default off. Does not use external AI.
              </span>
            </span>
          </label>
        </fieldset>

        <p className="text-sm text-[var(--pp-route)]">
          Failure presentation is always calm and informational. No flashing,
          buzzers, or humiliation screens.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/base')}>Save & return</Button>
          <Button
            variant="secondary"
            onClick={() => setPlayStyle(defaultPlayStyle)}
          >
            Reset defaults
          </Button>
        </div>
      </Panel>
    </div>
  )
}
