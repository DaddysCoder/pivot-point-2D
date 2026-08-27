import { ACTION_GLOSSARY, EQUIPMENT_GLOSSARY, HOW_TO_PLAY_SECTIONS, RESOURCE_GLOSSARY } from '@/mission/instructions'
import { Button } from '@/components/Button'

interface HowToPlayContentProps {
  onReplayTutorial?: () => void
  showReplayTutorial?: boolean
}

export function HowToPlayContent({
  onReplayTutorial,
  showReplayTutorial = false,
}: HowToPlayContentProps) {
  return (
    <div className="space-y-5">
      <p className="font-serif text-lg leading-relaxed text-[var(--pp-ink)]">
        Pivot Point is about completing objectives by adapting when plans change.
        Supportive, fail-forward play is the design: you keep going.
      </p>

      {HOW_TO_PLAY_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
            {section.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--pp-ink)]">{section.body}</p>
        </section>
      ))}

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
          Action labels
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(ACTION_GLOSSARY).map(([id, text]) => (
            <li key={id}>
              <strong className="capitalize">{id}</strong> — {text}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
          Materials, Intel, Influence, Experience, Pivot Tokens, equipment
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(RESOURCE_GLOSSARY).map(([id, text]) => (
            <li key={id}>{text}</li>
          ))}
          <li>{EQUIPMENT_GLOSSARY}</li>
        </ul>
      </section>

      {showReplayTutorial && onReplayTutorial ? (
        <Button variant="secondary" onClick={onReplayTutorial}>
          Replay tutorial
        </Button>
      ) : null}
    </div>
  )
}
