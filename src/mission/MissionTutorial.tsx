import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { TUTORIAL_STEPS } from '@/mission/tutorialSteps'

interface MissionTutorialProps {
  stepIndex: number
  onNext: () => void
  onSkip: () => void
}

export function MissionTutorial({ stepIndex, onNext, onSkip }: MissionTutorialProps) {
  const step = TUTORIAL_STEPS[stepIndex]
  if (!step) return null
  const last = stepIndex >= TUTORIAL_STEPS.length - 1

  return (
    <Modal open title={`How to play · ${step.title}`} onClose={onSkip}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pp-copper)]">
        First mission · {stepIndex + 1} / {TUTORIAL_STEPS.length}
      </p>
      <p className="mt-2 text-base leading-relaxed text-[var(--pp-ink)]">{step.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onNext}>{last ? 'Got it' : 'Next'}</Button>
        <Button variant="ghost" onClick={onSkip}>
          Skip tutorial
        </Button>
      </div>
    </Modal>
  )
}
