import {
  INSTRUCTION_HEADINGS,
  instructionsForMission,
  type MissionInstructions,
} from '@/mission/instructions'
import type { MissionDefinition } from '@/engine/types'

const FIELD_BY_HEADING: Record<(typeof INSTRUCTION_HEADINGS)[number], keyof MissionInstructions> =
  {
    'Your goal': 'yourGoal',
    'Where you begin': 'whereYouBegin',
    'What you are trying to reach or restore': 'tryingToReach',
    'What you do each turn': 'eachTurn',
    'What may change': 'whatMayChange',
    'How the mission ends': 'howItEnds',
    'Can I lose?': 'canILose',
  }

export function MissionInstructionBlock({ mission }: { mission: MissionDefinition }) {
  const copy = instructionsForMission(mission)
  return (
    <section className="mt-6" aria-labelledby="mission-instructions-title">
      <h2
        id="mission-instructions-title"
        className="text-[10px] uppercase tracking-[0.18em] text-[var(--pp-route)]"
      >
        Orders in plain language
      </h2>
      <dl className="mt-3 space-y-3">
        {INSTRUCTION_HEADINGS.map((heading) => (
          <div key={heading}>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-copper)]">
              {heading}
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-[var(--pp-ink)]">
              {copy[FIELD_BY_HEADING[heading]]}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-copper)]">
            Useful starting choices and equipment
          </dt>
          <dd className="mt-0.5 text-sm leading-relaxed text-[var(--pp-ink)]">
            {copy.startingChoices}
          </dd>
        </div>
      </dl>
    </section>
  )
}
