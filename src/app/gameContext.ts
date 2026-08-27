import { createContext } from 'react'
import type { GameState, PlayerAction, PlayerCharacter } from '@/engine'
import type { EquipmentId } from '@/crafting/craftingTypes'
import type { CustomMissionRecord } from '@/persistence/db'
import type { PlayStyleSettings } from '@/settings/playStyleTypes'

export interface GameContextValue {
  ready: boolean
  game: GameState
  playStyle: PlayStyleSettings
  activeSaveId: string
  customMissions: CustomMissionRecord[]
  onboardingComplete: boolean
  dispatch: (action: PlayerAction) => void
  setCharacter: (character: PlayerCharacter) => void
  setPlayStyle: (settings: PlayStyleSettings) => void
  setWorldId: (worldId: string) => void
  upgradeBuilding: (buildingId: string) => boolean
  placeBuilding: (buildingId: string, x: number, y: number) => boolean
  craftEquipmentItem: (equipmentId: EquipmentId) => boolean
  equipLoadoutItem: (equipmentId: EquipmentId) => boolean
  unequipLoadoutItem: (equipmentId: EquipmentId) => boolean
  resetCampaign: () => void
  persist: () => Promise<void>
  saveCustomMission: (
    record: Omit<CustomMissionRecord, 'updatedAt'>,
  ) => Promise<void>
  refreshCustomMissions: () => Promise<void>
  deleteCustomMissionById: (id: string) => Promise<void>
  loadSaveSlot: (id: string) => Promise<void>
  saveToSlot: (id: string, label: string) => Promise<void>
  deleteSaveSlot: (id: string) => Promise<void>
  completeOnboarding: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
