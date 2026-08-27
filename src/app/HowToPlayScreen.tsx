import { useNavigate, useSearchParams } from 'react-router-dom'
import { HowToPlayContent } from '@/app/HowToPlayContent'
import { Button } from '@/components/Button'
import { useGame } from '@/app/useGame'

export function HowToPlayScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { replayTutorial } = useGame()
  const back = params.get('from') || '/base'

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--pp-copper)]">
        Field manual
      </p>
      <h1 className="pp-display text-4xl text-[var(--pp-parchment)] md:text-5xl">
        How to Play
      </h1>
      <article className="pp-surface p-5 md:p-6">
        <HowToPlayContent
          showReplayTutorial
          onReplayTutorial={() => {
            replayTutorial()
            navigate('/mission/supply-line')
          }}
        />
      </article>
      <Button variant="secondary" onClick={() => navigate(back)}>
        Close
      </Button>
    </div>
  )
}
