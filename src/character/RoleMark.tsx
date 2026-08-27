import type { CharacterRole } from '@/engine/types'

const ICONS: Record<CharacterRole, string> = {
  strategist: '◇',
  scout: '◎',
  engineer: '⚒',
  cartographer: '⌖',
  quartermaster: '▣',
  commander: '⚑',
  intelligence: '◈',
  pathfinder: '↯',
}

interface RoleMarkProps {
  role: CharacterRole
  size?: number
  className?: string
}

export function RoleMark({ role, size = 28, className = '' }: RoleMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center border border-[var(--pp-route)]/40 bg-[color-mix(in_srgb,var(--pp-parchment)_80%,white)] font-serif ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden
    >
      {ICONS[role] ?? '·'}
    </span>
  )
}
