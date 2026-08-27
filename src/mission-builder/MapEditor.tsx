import { useMemo, useState } from 'react'
import type { MapDefinition, MapNode } from '@/engine/types'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'

const TERRAIN_OPTIONS = [
  'base',
  'road',
  'crossing',
  'river',
  'hills',
  'track',
  'forest',
] as const

interface MapEditorProps {
  map: MapDefinition
  onChange: (map: MapDefinition) => void
}

export function MapEditor({ map, onChange }: MapEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    map.startNodeId,
  )
  const selected = useMemo(
    () => map.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [map.nodes, selectedNodeId],
  )

  const updateNode = (nodeId: string, patch: Partial<MapNode>) => {
    onChange({
      ...map,
      nodes: map.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    })
  }

  const addNode = () => {
    const id = `node-${crypto.randomUUID().slice(0, 5)}`
    const node: MapNode = {
      id,
      label: 'New site',
      position: {
        x: Math.min(map.width - 1, map.nodes.length % map.width),
        y: Math.min(map.height - 1, Math.floor(map.nodes.length / map.width)),
      },
      terrainId: 'road',
      tags: [],
    }
    const last = map.nodes[map.nodes.length - 1]
    onChange({
      ...map,
      nodes: [...map.nodes, node],
      edges: last
        ? [
            ...map.edges,
            {
              id: `${last.id}-${id}`,
              from: last.id,
              to: id,
              travelCost: 1,
              tags: ['alt'],
            },
          ]
        : map.edges,
    })
    setSelectedNodeId(id)
  }

  const removeNode = (nodeId: string) => {
    if (nodeId === map.startNodeId || nodeId === map.objectiveNodeId) return
    onChange({
      ...map,
      nodes: map.nodes.filter((n) => n.id !== nodeId),
      edges: map.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    })
    setSelectedNodeId(map.startNodeId)
  }

  const cell = 48

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Map canvas">
        <svg
          viewBox={`0 0 ${map.width * cell} ${map.height * cell}`}
          width="100%"
          className="min-h-64 border border-[var(--pp-route)]/40 bg-[color-mix(in_srgb,var(--pp-map)_30%,#d8cdb0)]"
          role="img"
          aria-label="Editable mission map"
        >
          {map.edges.map((edge) => {
            const from = map.nodes.find((n) => n.id === edge.from)
            const to = map.nodes.find((n) => n.id === edge.to)
            if (!from || !to) return null
            return (
              <line
                key={edge.id}
                x1={from.position.x * cell + cell / 2}
                y1={from.position.y * cell + cell / 2}
                x2={to.position.x * cell + cell / 2}
                y2={to.position.y * cell + cell / 2}
                stroke="var(--pp-route)"
                strokeWidth={2}
              />
            )
          })}
          {map.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.position.x * cell + 4}
                y={node.position.y * cell + 4}
                width={cell - 8}
                height={cell - 8}
                rx={4}
                fill={selectedNodeId === node.id ? '#e4d9b4' : '#9aa882'}
                stroke="var(--pp-ink)"
                strokeWidth={selectedNodeId === node.id ? 3 : 1}
                tabIndex={0}
                role="button"
                aria-label={`Select ${node.label}`}
                onClick={() => setSelectedNodeId(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedNodeId(node.id)
                  }
                }}
              />
              <text
                x={node.position.x * cell + cell / 2}
                y={node.position.y * cell + cell / 2}
                textAnchor="middle"
                fontSize="9"
                fill="#1a1f16"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addNode}>
            Add node
          </Button>
          <label className="text-sm">
            W
            <input
              type="number"
              min={3}
              max={8}
              value={map.width}
              className="ml-1 w-14 border px-1"
              onChange={(e) =>
                onChange({ ...map, width: Number(e.target.value) || 4 })
              }
            />
          </label>
          <label className="text-sm">
            H
            <input
              type="number"
              min={3}
              max={8}
              value={map.height}
              className="ml-1 w-14 border px-1"
              onChange={(e) =>
                onChange({ ...map, height: Number(e.target.value) || 4 })
              }
            />
          </label>
        </div>
      </Panel>

      <Panel title="Node properties">
        {selected ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Label
              <input
                className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-2 py-1"
                value={selected.label}
                onChange={(e) =>
                  updateNode(selected.id, { label: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Terrain
              <select
                className="mt-1 w-full border-2 border-[var(--pp-route)]/40 bg-[var(--pp-paper)] px-2 py-1"
                value={selected.terrainId}
                onChange={(e) =>
                  updateNode(selected.id, { terrainId: e.target.value })
                }
              >
                {TERRAIN_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                X
                <input
                  type="number"
                  min={0}
                  max={map.width - 1}
                  className="mt-1 w-full border px-2 py-1"
                  value={selected.position.x}
                  onChange={(e) =>
                    updateNode(selected.id, {
                      position: {
                        ...selected.position,
                        x: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Y
                <input
                  type="number"
                  min={0}
                  max={map.height - 1}
                  className="mt-1 w-full border px-2 py-1"
                  value={selected.position.y}
                  onChange={(e) =>
                    updateNode(selected.id, {
                      position: {
                        ...selected.position,
                        y: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  onChange({ ...map, startNodeId: selected.id })
                }
              >
                Set start
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  onChange({ ...map, objectiveNodeId: selected.id })
                }
              >
                Set objective
              </Button>
              <Button
                variant="ghost"
                disabled={
                  selected.id === map.startNodeId ||
                  selected.id === map.objectiveNodeId
                }
                onClick={() => removeNode(selected.id)}
              >
                Remove
              </Button>
            </div>
            <p className="text-xs text-[var(--pp-route)]">
              Start: {map.startNodeId} · Objective: {map.objectiveNodeId}
            </p>
          </div>
        ) : (
          <p className="text-sm">Select a node.</p>
        )}
      </Panel>
    </div>
  )
}
