import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { GameState, MapDefinition, MapNode } from '@/engine/types'
import { frontierTerrain } from '@/worlds/frontier'
import { orbitTerrain } from '@/worlds/orbit'
import { railTerrain } from '@/worlds/rail'

const TERRAIN_FILL: Record<string, string> = {
  base: '#6a7a52',
  road: '#c4b48a',
  crossing: '#a88860',
  river: '#5f8494',
  hills: '#8a7852',
  track: '#b8a57a',
  forest: '#456040',
}

const ORBIT_FILL: Record<string, string> = {
  base: '#4a6675',
  road: '#7a8d99',
  crossing: '#5c7380',
  river: '#3d6a7a',
  hills: '#6b5f55',
  track: '#8a9aa3',
  forest: '#3f4f55',
}

const RAIL_FILL: Record<string, string> = {
  base: '#6a5a45',
  road: '#5c5348',
  crossing: '#7a6a52',
  river: '#6f7f8a',
  hills: '#8a7a60',
  track: '#4a433a',
  forest: '#5a6348',
}

interface TacticalMapProps {
  map: MapDefinition
  game: GameState
  className?: string
  worldId?: string
}

function nodeVisible(node: MapNode, game: GameState): boolean {
  if (!node.tags.includes('hidden')) return true
  return game.revealedNodes.includes(node.id)
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

function TerrainTexture({
  terrainId,
  x,
  y,
  size,
}: {
  terrainId: string
  x: number
  y: number
  size: number
}) {
  if (terrainId === 'forest') {
    return (
      <g opacity="0.35" fill="#1a2a18">
        <circle cx={x + size * 0.3} cy={y + size * 0.35} r={4} />
        <circle cx={x + size * 0.55} cy={y + size * 0.28} r={5} />
        <circle cx={x + size * 0.7} cy={y + size * 0.48} r={4} />
      </g>
    )
  }
  if (terrainId === 'river') {
    return (
      <path
        d={`M${x + 6} ${y + size * 0.4} Q${x + size / 2} ${y + size * 0.2} ${x + size - 6} ${y + size * 0.45}`}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
      />
    )
  }
  if (terrainId === 'hills') {
    return (
      <path
        d={`M${x + 8} ${y + size * 0.65} L${x + size * 0.35} ${y + size * 0.35} L${x + size * 0.55} ${y + size * 0.55} L${x + size - 8} ${y + size * 0.3}`}
        fill="none"
        stroke="rgba(26,31,22,0.25)"
        strokeWidth="2"
      />
    )
  }
  if (terrainId === 'road' || terrainId === 'track') {
    return (
      <line
        x1={x + 10}
        y1={y + size / 2}
        x2={x + size - 10}
        y2={y + size / 2}
        stroke="rgba(26,31,22,0.2)"
        strokeWidth="3"
        strokeDasharray={terrainId === 'track' ? '3 4' : undefined}
      />
    )
  }
  return null
}

export function TacticalMap({
  map,
  game,
  className = '',
  worldId = 'frontier',
}: TacticalMapProps) {
  const cell = 56
  const pad = 28
  const width = map.width * cell + pad * 2
  const height = map.height * cell + pad * 2
  const fills =
    worldId === 'orbit' ? ORBIT_FILL : worldId === 'rail' ? RAIL_FILL : TERRAIN_FILL
  const terrainDefs =
    worldId === 'orbit'
      ? orbitTerrain
      : worldId === 'rail'
        ? railTerrain
        : frontierTerrain

  const nodeByPos = new Map<string, MapNode>()
  for (const node of map.nodes) {
    if (!nodeVisible(node, game)) continue
    nodeByPos.set(cellKey(node.position.x, node.position.y), node)
  }

  const blocked = new Set(game.blockedEdges)
  const patternId = `map-paper-${map.id}`

  const prevBlocked = useRef<string[]>([])
  const prevRevealed = useRef<string[]>([])
  const [flashBlocked, setFlashBlocked] = useState<Set<string>>(new Set())
  const [flashRevealed, setFlashRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newlyBlocked = game.blockedEdges.filter(
      (id) => !prevBlocked.current.includes(id),
    )
    const newlyRevealed = game.revealedNodes.filter(
      (id) => !prevRevealed.current.includes(id),
    )
    prevBlocked.current = game.blockedEdges
    prevRevealed.current = game.revealedNodes
    if (newlyBlocked.length === 0 && newlyRevealed.length === 0) return
    setFlashBlocked(new Set(newlyBlocked))
    setFlashRevealed(new Set(newlyRevealed))
    const id = window.setTimeout(() => {
      setFlashBlocked(new Set())
      setFlashRevealed(new Set())
    }, 420)
    return () => window.clearTimeout(id)
  }, [game.blockedEdges, game.revealedNodes])

  return (
    <div
      className={`pp-map-frame overflow-auto p-2 ${className}`}
      role="img"
      aria-label={`Tactical map ${map.id}. Operator at ${game.playerNodeId ?? 'unknown'}.`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="min-w-[280px] max-w-full"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          <pattern
            id={patternId}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.6" fill="rgba(90,70,50,0.12)" />
          </pattern>
          <filter id={`map-soft-${map.id}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" />
          </filter>
        </defs>

        <rect width={width} height={height} fill="#cbbd98" />
        <rect width={width} height={height} fill={`url(#${patternId})`} />

        {/* Contour / map grid */}
        {Array.from({ length: map.width + 1 }, (_, i) => (
          <line
            key={`vx-${i}`}
            x1={pad + i * cell}
            y1={pad}
            x2={pad + i * cell}
            y2={pad + map.height * cell}
            stroke="rgba(90,70,50,0.12)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: map.height + 1 }, (_, i) => (
          <line
            key={`hy-${i}`}
            x1={pad}
            y1={pad + i * cell}
            x2={pad + map.width * cell}
            y2={pad + i * cell}
            stroke="rgba(90,70,50,0.12)"
            strokeWidth="1"
          />
        ))}

        {/* Compass rose */}
        <g transform={`translate(${width - 36} 36)`} opacity="0.7">
          <circle r="16" fill="none" stroke="rgba(26,31,22,0.45)" strokeWidth="1.5" />
          <polygon points="0,-12 3,2 0,0 -3,2" fill="rgba(26,31,22,0.7)" />
          <text
            y="22"
            textAnchor="middle"
            fontSize="8"
            fill="rgba(26,31,22,0.7)"
            fontFamily="IBM Plex Mono, monospace"
          >
            N
          </text>
        </g>

        {map.edges.map((edge) => {
          const from = map.nodes.find((n) => n.id === edge.from)
          const to = map.nodes.find((n) => n.id === edge.to)
          if (!from || !to) return null
          if (!nodeVisible(from, game) || !nodeVisible(to, game)) return null
          const x1 = pad + from.position.x * cell + cell / 2
          const y1 = pad + from.position.y * cell + cell / 2
          const x2 = pad + to.position.x * cell + cell / 2
          const y2 = pad + to.position.y * cell + cell / 2
          const isBlocked = blocked.has(edge.id)
          const justBlocked = flashBlocked.has(edge.id)
          return (
            <g key={edge.id} className={justBlocked ? 'pp-route-flash' : undefined}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isBlocked ? '#7a3b2e' : '#5a4632'}
                strokeWidth={isBlocked ? 3.5 : 2.5}
                strokeDasharray={isBlocked ? '6 4' : undefined}
                opacity={0.9}
                strokeLinecap="round"
                className={!isBlocked ? 'pp-route-line' : undefined}
              >
                <title>
                  {isBlocked ? `Route unavailable: ${edge.id}` : `Route: ${edge.id}`}
                </title>
              </line>
              {!isBlocked ? (
                <circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r="2"
                  fill="#c4894a"
                  opacity="0.8"
                />
              ) : null}
            </g>
          )
        })}

        {Array.from({ length: map.height }, (_, y) =>
          Array.from({ length: map.width }, (_, x) => {
            const node = nodeByPos.get(cellKey(x, y))
            const cx = pad + x * cell
            const cy = pad + y * cell
            if (!node) {
              return (
                <rect
                  key={`empty-${x}-${y}`}
                  x={cx + 5}
                  y={cy + 5}
                  width={cell - 10}
                  height={cell - 10}
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(90,70,50,0.08)"
                />
              )
            }
            const terrain = terrainDefs.find((t) => t.id === node.terrainId)
            const fill = fills[node.terrainId] ?? '#9aa882'
            const isPlayer = game.playerNodeId === node.id
            const isObjective = node.id === map.objectiveNodeId
            const justRevealed = flashRevealed.has(node.id)
            const style: CSSProperties = {
              transition: 'opacity 320ms ease, transform 200ms ease',
            }
            return (
              <g
                key={node.id}
                style={style}
                filter={`url(#map-soft-${map.id})`}
                className={justRevealed ? 'pp-node-reveal' : undefined}
                opacity={1}
              >
                <rect
                  x={cx + 4}
                  y={cy + 4}
                  width={cell - 8}
                  height={cell - 8}
                  rx={2}
                  fill={fill}
                  stroke={isObjective ? '#2f4a2c' : 'rgba(26,31,22,0.5)'}
                  strokeWidth={isObjective ? 3 : 1.5}
                />
                <TerrainTexture
                  terrainId={node.terrainId}
                  x={cx}
                  y={cy}
                  size={cell}
                />
                {isObjective ? (
                  <rect
                    x={cx + 8}
                    y={cy + 8}
                    width={cell - 16}
                    height={cell - 16}
                    fill="none"
                    stroke="#d4b45a"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                    opacity="0.85"
                  />
                ) : null}
                <text
                  x={cx + cell / 2}
                  y={cy + cell / 2 - 2}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#1a1f16"
                  fontWeight={700}
                  fontFamily="Cormorant Garamond, serif"
                >
                  {node.label}
                </text>
                <text
                  x={cx + cell / 2}
                  y={cy + cell / 2 + 11}
                  textAnchor="middle"
                  fontSize="7"
                  fill="rgba(26,31,22,0.72)"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {terrain?.name ?? node.terrainId}
                </text>
                {isPlayer ? (
                  <g className="pp-player-marker">
                    <circle
                      cx={cx + cell / 2}
                      cy={cy + 11}
                      r={7}
                      fill="#f0e6d0"
                      stroke="#121820"
                      strokeWidth={2}
                    >
                      <title>Operator position</title>
                    </circle>
                    <circle
                      cx={cx + cell / 2}
                      cy={cy + 11}
                      r={2.5}
                      fill="#c4894a"
                    />
                  </g>
                ) : null}
              </g>
            )
          }),
        )}

        <text
          x={pad}
          y={height - 8}
          fontSize="8"
          fill="rgba(26,31,22,0.55)"
          fontFamily="IBM Plex Mono, monospace"
        >
          {worldId.toUpperCase()} THEATRE · MAP {map.id}
        </text>
      </svg>
    </div>
  )
}
