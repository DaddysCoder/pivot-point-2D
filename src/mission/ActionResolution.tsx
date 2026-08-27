import type { ActionType } from '@/engine/types'
import { actionTypeLabel } from '@/mission/actionTypeLabel'
import { resolutionTitleFor } from '@/mission/resolutionCopy'
import { StatusStamp } from '@/components/StatusStamp'

interface ActionResolutionProps {
  actionType: ActionType | null
  label?: string
  visible: boolean
  onDismiss?: () => void
}

export function ActionResolution({
  actionType,
  label,
  visible,
  onDismiss,
}: ActionResolutionProps) {
  if (!actionType) return null
  return (
    <StatusStamp
      title={resolutionTitleFor(actionType)}
      detail={label ?? actionTypeLabel(actionType)}
      visible={visible}
      onDismiss={onDismiss}
      durationMs={1400}
    />
  )
}
