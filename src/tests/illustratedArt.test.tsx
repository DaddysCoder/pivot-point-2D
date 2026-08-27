import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultCharacter } from '@/engine/types'
import { PivotEventOverlay } from '@/mission/PivotEvent'
import { PIVOT_EVENT_LIBRARY } from '@/engine/pivotEventLibrary'

vi.mock('@/app/useGame', () => ({
  useGame: () => ({
    game: { character: createDefaultCharacter({ callSign: '' }) },
    setCharacter: vi.fn(),
  }),
}))

import { CharacterCreator } from '@/character/CharacterCreator'

const weatherEvent = PIVOT_EVENT_LIBRARY.find((e) => e.id === 'lib-weather')!

// jsdom does not implement <dialog> modal behavior.
HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.open = true
})
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false
})

describe('Illustrated art', () => {
  it('character creator offers an illustrated portrait for a role with commissioned art', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CharacterCreator />
      </MemoryRouter>,
    )

    const illustratedOption = screen.getByRole('radio', {
      name: /use the illustrated portrait for this role/i,
    })
    await user.click(illustratedOption)
    expect(illustratedOption).toHaveAttribute('aria-checked', 'true')
    expect(
      screen.getByAltText(/illustrated portrait of operator/i),
    ).toBeInTheDocument()
  })

  it('pivot event overlay shows Frontier backdrop art but not for other worlds', () => {
    const { rerender } = render(
      <PivotEventOverlay
        event={weatherEvent}
        choices={weatherEvent.choices}
        open
        onSelect={() => {}}
        decisionLoad={3}
        informationStyle="standard"
        predictability="balanced"
        worldId="frontier"
      />,
    )
    expect(document.querySelector('img[aria-hidden]')).toBeTruthy()

    rerender(
      <PivotEventOverlay
        event={weatherEvent}
        choices={weatherEvent.choices}
        open
        onSelect={() => {}}
        decisionLoad={3}
        informationStyle="standard"
        predictability="balanced"
        worldId="orbit"
      />,
    )
    expect(document.querySelector('img[aria-hidden]')).toBeFalsy()
  })
})
