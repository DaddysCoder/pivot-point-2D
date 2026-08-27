import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialGameState, startMission } from '@/engine'
import { TacticalMap } from '@/mission/TacticalMap'
import { supplyLineMission } from '@/worlds/frontier'

describe('TacticalMap', () => {
  it('renders visible locations and operator marker', () => {
    const started = startMission(createInitialGameState(), supplyLineMission).state
    render(<TacticalMap map={supplyLineMission.map} game={started} />)

    expect(
      screen.getByRole('img', { name: /tactical map supply-line-map/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Echo Base')).toBeInTheDocument()
    expect(screen.getByText('North Station')).toBeInTheDocument()
    // Hidden ford not revealed yet
    expect(screen.queryByText('River Ford')).not.toBeInTheDocument()
  })

  it('reveals hidden nodes after intel and shows blocked routes', () => {
    let state = startMission(createInitialGameState(), supplyLineMission).state
    state = {
      ...state,
      revealedNodes: [...state.revealedNodes, 'river-ford'],
      blockedEdges: ['crossing-to-ford'],
    }
    const { container } = render(
      <TacticalMap map={supplyLineMission.map} game={state} />,
    )
    expect(screen.getByText('River Ford')).toBeInTheDocument()
    expect(
      container.querySelector('line[stroke-dasharray]') ||
        container.querySelector('line[stroke-dasharray="6 4"]'),
    ).toBeTruthy()
  })
})
