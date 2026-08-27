import marcusStrategist from '@/assets/frontier/portraits/marcus-strategist.jpg'
import type { CharacterRole } from '@/engine/types'

/** Commissioned illustrated portraits, keyed by role. Roles without an entry fall back to the SVG portrait. */
export const ILLUSTRATED_PORTRAITS: Partial<Record<CharacterRole, string>> = {
  strategist: marcusStrategist,
}

export function illustratedPortraitFor(role: CharacterRole): string | undefined {
  return ILLUSTRATED_PORTRAITS[role]
}
