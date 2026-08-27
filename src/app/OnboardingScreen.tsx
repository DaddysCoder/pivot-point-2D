import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useGame } from '@/app/useGame'

const STEPS = [
  {
    title: 'Plans change',
    body: 'Pivot Point is a strategy game about building a base and running missions where the situation keeps shifting.',
  },
  {
    title: 'Adaptation is the game',
    body: 'When a route closes or intel is wrong, you are not punished — you get new information and choose your next move.',
  },
  {
    title: 'Your interests, your world',
    body: 'Start in Frontier (history/strategy) or Orbit (space). Later you can build missions for someone else as Mission Master.',
  },
  {
    title: 'Play your way',
    body: 'Use Play Style to tune predictability, decision load, motion, and sound. Time pressure and timed transitions are not active yet.',
  },
  {
    title: 'How to play',
    body: 'Your goal is to complete the mission objective. Choose one action at a time. The map is a visual record. If a Pivot Event interrupts the plan, adapt — that is not a failure. Current missions have no traditional lose condition.',
  },
] as const

export function OnboardingScreen() {
  const navigate = useNavigate()
  const { completeOnboarding } = useGame()
  const [step, setStep] = useState(0)

  const current = STEPS[step]!

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 p-6">
      <div className="pp-fade-up">
        <p className="pp-display text-3xl text-[var(--pp-parchment)] md:text-4xl">
          Pivot Point
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
          Briefing {step + 1} / {STEPS.length}
        </p>
      </div>
      <h1 className="pp-display pp-fade-up text-4xl text-[var(--pp-parchment)] md:text-5xl">
        {current.title}
      </h1>
      <div className="pp-surface pp-fade-up p-5">
        <p className="text-base leading-relaxed text-[var(--pp-ink)]">{current.body}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button
            onClick={() => {
              completeOnboarding()
              navigate('/create')
            }}
          >
            Create your operator
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-[var(--pp-parchment)] hover:bg-white/5"
          onClick={() => {
            completeOnboarding()
            navigate('/create')
          }}
        >
          Skip
        </Button>
        <Button
          variant="ghost"
          className="text-[var(--pp-parchment)] hover:bg-white/5"
          onClick={() => navigate('/how-to-play?from=/onboarding')}
        >
          How to Play
        </Button>
      </div>
    </div>
  )
}
