import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacter } from '@/engine/types'
import { ActionMark } from '@/mission/ActionMark'
import { DecisionPanel } from '@/mission/DecisionPanel'
import { buildIntelArtefacts } from '@/mission/intelArtefacts'
import { resolutionTitleFor } from '@/mission/resolutionCopy'
import { supplyLineMission } from '@/worlds/frontier'
import type { DecisionChoice } from '@/engine/types'

const setCharacter = vi.fn()

vi.mock('@/app/useGame', () => ({
  useGame: () => ({
    game: {
      character: createDefaultCharacter({ callSign: '' }),
    },
    setCharacter,
  }),
}))

import { CharacterCreator } from '@/character/CharacterCreator'

describe('Game feel pass', () => {
  beforeEach(() => {
    setCharacter.mockClear()
  })

  it('character visual selectors update role and palette', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CharacterCreator />
      </MemoryRouter>,
    )

    const scout = screen.getByRole('radio', { name: /select scout role/i })
    await user.click(scout)
    expect(scout).toHaveAttribute('aria-checked', 'true')

    const olive = screen.getByRole('radio', {
      name: /select olive field palette/i,
    })
    await user.click(olive)
    expect(olive).toHaveAttribute('aria-checked', 'true')

    const helm = screen.getByRole('radio', { name: /select helm headwear/i })
    await user.click(helm)
    expect(helm).toHaveAttribute('aria-checked', 'true')

    const star = screen.getByRole('radio', {
      name: /select star emblem symbol/i,
    })
    await user.click(star)
    expect(star).toHaveAttribute('aria-checked', 'true')
  })

  it('decision panel keeps choice ids and shows action mark', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const choices: DecisionChoice[] = [
      {
        id: 'take-road',
        label: 'Take the road',
        description: 'Move along the main supply road.',
        actionType: 'move',
        effects: [],
      },
    ]
    render(
      <DecisionPanel
        choices={choices}
        onSelect={onSelect}
        decisionLoad={3}
        informationStyle="standard"
      />,
    )
    expect(screen.getByText('Move')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /take the road/i }))
    expect(onSelect).toHaveBeenCalledWith('take-road')
  })

  it('action mark is decorative and resolution titles are game-state based', () => {
    const { container } = render(<ActionMark actionType="recon" />)
    expect(container.querySelector('[aria-hidden]')).toBeTruthy()
    expect(resolutionTitleFor('recon')).toBe('INTEL CONFIRMED')
    expect(resolutionTitleFor('reroute')).toBe('NEW ROUTE')
    expect(resolutionTitleFor('hold')).toBe('POSITION HELD')
  })

  it('intel artefacts derive only from mission data', () => {
    const artefacts = buildIntelArtefacts(supplyLineMission)
    expect(artefacts.some((a) => a.kind === 'map')).toBe(true)
    expect(artefacts.some((a) => a.kind === 'coordinates')).toBe(true)
    expect(artefacts.some((a) => a.kind === 'note' || a.kind === 'report')).toBe(
      true,
    )
    for (const item of supplyLineMission.startingIntel) {
      expect(
        artefacts.some(
          (a) => a.body.includes(item.description) || a.id === item.id,
        ),
      ).toBe(true)
    }
  })
})
