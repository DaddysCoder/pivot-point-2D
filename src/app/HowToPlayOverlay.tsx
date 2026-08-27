import { HowToPlayContent } from '@/app/HowToPlayContent'
import { Modal } from '@/components/Modal'
import { useGame } from '@/app/useGame'
import { useNavigate } from 'react-router-dom'

interface HowToPlayOverlayProps {
  open: boolean
  onClose: () => void
  allowReplayTutorial?: boolean
}

export function HowToPlayOverlay({
  open,
  onClose,
  allowReplayTutorial = false,
}: HowToPlayOverlayProps) {
  const { replayTutorial } = useGame()
  const navigate = useNavigate()

  return (
    <Modal open={open} title="How to Play" onClose={onClose} className="max-h-[90vh]">
      <div className="max-h-[min(70vh,36rem)] overflow-y-auto pr-1">
        <HowToPlayContent
          showReplayTutorial={allowReplayTutorial}
          onReplayTutorial={
            allowReplayTutorial
              ? () => {
                  replayTutorial()
                  onClose()
                  navigate('/mission/supply-line')
                }
              : undefined
          }
        />
      </div>
    </Modal>
  )
}
