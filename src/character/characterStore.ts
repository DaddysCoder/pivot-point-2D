import { createDefaultCharacter, type PlayerCharacter } from '@/engine/types'

const STORAGE_KEY = 'pivot-point.character'

export function loadCharacterFromStorage(): PlayerCharacter | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlayerCharacter
  } catch {
    return null
  }
}

export function saveCharacterToStorage(character: PlayerCharacter): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character))
}

export function createDraftCharacter(
  overrides: Partial<PlayerCharacter> = {},
): PlayerCharacter {
  return createDefaultCharacter({
    id: crypto.randomUUID(),
    callSign: '',
    ...overrides,
  })
}
