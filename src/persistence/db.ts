import Dexie, { type EntityTable } from 'dexie'
import type { GameState, MissionDefinition, PlayerCharacter } from '@/engine/types'
import {
  defaultPlayStyle,
  type PlayStyleSettings,
} from '@/settings/playStyleTypes'

export interface SaveSlot {
  id: string
  label: string
  updatedAt: number
  character: PlayerCharacter
  game: GameState
  playStyle: PlayStyleSettings
}

export interface CustomMissionRecord {
  id: string
  updatedAt: number
  mission: MissionDefinition
  worldId: string
  createdBy: string
}

export interface FacilitatorProfile {
  id: string
  displayName: string
  notes: string
  preferredPredictability: PlayStyleSettings['predictability']
  updatedAt: number
}

class PivotPointDB extends Dexie {
  saves!: EntityTable<SaveSlot, 'id'>
  customMissions!: EntityTable<CustomMissionRecord, 'id'>
  facilitators!: EntityTable<FacilitatorProfile, 'id'>

  constructor() {
    super('pivot-point')
    this.version(1).stores({
      saves: 'id, updatedAt',
    })
    this.version(2).stores({
      saves: 'id, updatedAt, label',
      customMissions: 'id, updatedAt, worldId',
      facilitators: 'id, updatedAt',
    })
  }
}

export const db = new PivotPointDB()

export const PRIMARY_SAVE_ID = 'slot-1'

export async function saveGame(
  slot: Omit<SaveSlot, 'updatedAt' | 'label'> & { id?: string; label?: string },
) {
  const id = slot.id ?? PRIMARY_SAVE_ID
  const existing = await db.saves.get(id)
  const record: SaveSlot = {
    id,
    label: slot.label ?? existing?.label ?? `Save ${id}`,
    updatedAt: Date.now(),
    character: slot.character,
    game: slot.game,
    playStyle: slot.playStyle ?? defaultPlayStyle,
  }
  await db.saves.put(record)
  return record
}

export async function loadGame(id = PRIMARY_SAVE_ID): Promise<SaveSlot | undefined> {
  return db.saves.get(id)
}

export async function listSaves(): Promise<SaveSlot[]> {
  return db.saves.orderBy('updatedAt').reverse().toArray()
}

export async function clearSave(id = PRIMARY_SAVE_ID): Promise<void> {
  await db.saves.delete(id)
}

export async function saveCustomMission(
  record: Omit<CustomMissionRecord, 'updatedAt'>,
): Promise<CustomMissionRecord> {
  const full: CustomMissionRecord = { ...record, updatedAt: Date.now() }
  await db.customMissions.put(full)
  return full
}

export async function listCustomMissions(): Promise<CustomMissionRecord[]> {
  return db.customMissions.orderBy('updatedAt').reverse().toArray()
}

export async function deleteCustomMission(id: string): Promise<void> {
  await db.customMissions.delete(id)
}

export async function getCustomMission(
  id: string,
): Promise<CustomMissionRecord | undefined> {
  return db.customMissions.get(id)
}

export async function saveFacilitatorProfile(
  profile: Omit<FacilitatorProfile, 'updatedAt'>,
): Promise<FacilitatorProfile> {
  const full: FacilitatorProfile = { ...profile, updatedAt: Date.now() }
  await db.facilitators.put(full)
  return full
}

export async function listFacilitatorProfiles(): Promise<FacilitatorProfile[]> {
  return db.facilitators.orderBy('updatedAt').reverse().toArray()
}

export async function deleteFacilitatorProfile(id: string): Promise<void> {
  await db.facilitators.delete(id)
}
