import type { MapDefinition } from '@/engine/types'
import type { IntelArtefactModel } from '@/mission/intelArtefacts'

interface IntelArtefactProps {
  artefact: IntelArtefactModel
  map?: MapDefinition
}

export function IntelArtefact({ artefact, map }: IntelArtefactProps) {
  return (
    <article
      className="pp-intel-card border border-[var(--pp-route)]/35 bg-[color-mix(in_srgb,var(--pp-parchment)_92%,white)] p-3"
      aria-label={`${artefact.kind}: ${artefact.title}`}
    >
      <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--pp-copper)]">
        {artefact.kind}
      </p>
      <h3 className="pp-display text-base text-[var(--pp-ink)]">{artefact.title}</h3>
      {artefact.kind === 'map' && map ? (
        <MiniMapFragment map={map} />
      ) : artefact.kind === 'route' && map ? (
        <RouteSketch map={map} />
      ) : (
        <p className="mt-1 text-sm leading-snug text-[var(--pp-route)]">{artefact.body}</p>
      )}
      {artefact.kind === 'map' || artefact.kind === 'route' ? (
        <p className="mt-1 text-xs text-[var(--pp-route)]">{artefact.body}</p>
      ) : null}
    </article>
  )
}

function MiniMapFragment({ map }: { map: MapDefinition }) {
  const w = 120
  const h = 72
  const sx = (x: number) => 8 + (x / Math.max(map.width - 1, 1)) * (w - 16)
  const sy = (y: number) => 8 + (y / Math.max(map.height - 1, 1)) * (h - 16)
  const start = map.nodes.find((n) => n.id === map.startNodeId)
  const objective = map.nodes.find((n) => n.id === map.objectiveNodeId)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 max-w-[10rem] border border-[var(--pp-route)]/25 bg-[#cbbd98]"
      aria-hidden
    >
      {map.edges.map((edge) => {
        const from = map.nodes.find((n) => n.id === edge.from)
        const to = map.nodes.find((n) => n.id === edge.to)
        if (!from || !to) return null
        return (
          <line
            key={edge.id}
            x1={sx(from.position.x)}
            y1={sy(from.position.y)}
            x2={sx(to.position.x)}
            y2={sy(to.position.y)}
            stroke="#5a4632"
            strokeWidth="1.2"
            opacity="0.7"
          />
        )
      })}
      {map.nodes.map((node) => (
        <circle
          key={node.id}
          cx={sx(node.position.x)}
          cy={sy(node.position.y)}
          r={node.id === map.objectiveNodeId ? 3.5 : 2.2}
          fill={
            node.id === map.startNodeId
              ? '#c4894a'
              : node.id === map.objectiveNodeId
                ? '#3f5c3c'
                : '#1a1f16'
          }
        />
      ))}
      {start && objective ? (
        <title>
          {start.label} to {objective.label}
        </title>
      ) : null}
    </svg>
  )
}

function RouteSketch({ map }: { map: MapDefinition }) {
  const start = map.nodes.find((n) => n.id === map.startNodeId)
  const objective = map.nodes.find((n) => n.id === map.objectiveNodeId)
  if (!start || !objective) return null
  return (
    <svg width="100%" viewBox="0 0 160 36" className="mt-2" aria-hidden>
      <circle cx="18" cy="18" r="6" fill="#c4894a" stroke="#1a1f16" />
      <text x="28" y="22" fontSize="9" fill="#1a1f16">
        {start.label}
      </text>
      <path
        d="M70 18 H110"
        stroke="#5a4632"
        strokeWidth="2"
        strokeDasharray="3 2"
        markerEnd="url(#route-arrow)"
      />
      <defs>
        <marker
          id="route-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#5a4632" />
        </marker>
      </defs>
      <circle cx="130" cy="18" r="6" fill="#3f5c3c" stroke="#1a1f16" />
      <text x="140" y="12" fontSize="8" fill="#1a1f16" textAnchor="end">
        {objective.label}
      </text>
    </svg>
  )
}
