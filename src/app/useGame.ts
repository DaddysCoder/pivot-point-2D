import { useContext } from 'react'
import { GameContext, type GameContextValue } from '@/app/gameContext'

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider')
  }
  return ctx
}
