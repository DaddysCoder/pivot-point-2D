import type { IntelItem, MapDefinition, MissionDefinition } from '@/engine/types'

export type IntelArtefactKind =
  | 'map'
  | 'note'
  | 'report'
  | 'coordinates'
  | 'route'
  | 'conditions'

export interface IntelArtefactModel {
  id: string
  kind: IntelArtefactKind
  title: string
  body: string
}

/** Deterministic artefacts derived only from existing mission data. */
export function buildIntelArtefacts(
  mission: MissionDefinition,
): IntelArtefactModel[] {
  const artefacts: IntelArtefactModel[] = []
  const map = mission.map
  const start = map.nodes.find((n) => n.id === map.startNodeId)
  const objective = map.nodes.find((n) => n.id === map.objectiveNodeId)

  artefacts.push({
    id: `${mission.id}-map`,
    kind: 'map',
    title: 'Map fragment',
    body: `${map.width}×${map.height} theatre · ${map.nodes.length} marked sites`,
  })

  if (start && objective) {
    artefacts.push({
      id: `${mission.id}-coords`,
      kind: 'coordinates',
      title: 'Coordinate card',
      body: `Start ${start.label} (${start.position.x},${start.position.y}) → Objective ${objective.label} (${objective.position.x},${objective.position.y})`,
    })
    artefacts.push({
      id: `${mission.id}-route`,
      kind: 'route',
      title: 'Route sketch',
      body: `${start.label} → ${objective.label}`,
    })
  }

  mission.startingIntel.forEach((intel, index) => {
    artefacts.push({
      id: intel.id,
      kind: index === 0 ? 'note' : 'report',
      title: intel.title,
      body: intel.description,
    })
  })

  const conditionIntel = mission.startingIntel.find((i) =>
    /weather|condition|storm|fog|rain|wind/i.test(`${i.title} ${i.description}`),
  )
  if (conditionIntel) {
    artefacts.push({
      id: `${conditionIntel.id}-conditions`,
      kind: 'conditions',
      title: 'Conditions slip',
      body: conditionIntel.description,
    })
  }

  return artefacts
}

export type { IntelItem, MapDefinition }
