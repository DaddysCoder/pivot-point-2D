import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HowToPlayContent } from '@/app/HowToPlayContent'
import { HowToPlayScreen } from '@/app/HowToPlayScreen'
import { OnboardingScreen } from '@/app/OnboardingScreen'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import type { DecisionChoice, GameState } from '@/engine/types'
import { applyDecisionLoad } from '@/mission/decisionLoad'
import { DecisionPanel } from '@/mission/DecisionPanel'
import { MissionBrief } from '@/mission/MissionBrief'
import { PivotEventOverlay } from '@/mission/PivotEvent'
import {
  INSTRUCTION_HEADINGS,
  instructionsForMission,
  MISSION_INSTRUCTION_FIELDS,
  missingResourceSummary,
  PIVOT_FAIL_FORWARD,
} from '@/mission/instructions'
import { supplyLineMission } from '@/worlds/frontier'
import { relayDriftMission } from '@/worlds/orbit'
import { buildMissionRegistry, listPackMissions } from '@/worlds/registry'

vi.mock('@/app/useGame', () => ({
  useGame: () => ({
    replayTutorial: vi.fn(),
    completeOnboarding: vi.fn(),
    completeTutorial: vi.fn(),
    tutorialComplete: false,
    tutorialReplayActive: false,
  }),
}))

HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.open = true
})
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false
})

function playPath(missionId: string, choiceIds: string[]) {
  const registry = buildMissionRegistry()
  const mission = registry.get(missionId)!
  let state = startMission(createInitialGameState(), mission).state
  const snapshots: GameState[] = [state]
  for (const choiceId of choiceIds) {
    expect(state.availableChoiceIds.length, `${missionId} before ${choiceId}`).toBeGreaterThan(0)
    state = reduceGame(state, { type: 'SELECT_CHOICE', choiceId }, registry).state
    snapshots.push(state)
  }
  return snapshots
}

describe('Mission instructions catalogue', () => {
  it('gives every built-in mission complete instruction content', () => {
    for (const mission of listPackMissions()) {
      const copy = instructionsForMission(mission)
      for (const field of MISSION_INSTRUCTION_FIELDS) {
        expect(copy[field].trim().length, `${mission.id}.${field}`).toBeGreaterThan(8)
      }
      expect(copy.canILose).toMatch(/traditional lose/i)
    }
  })
})

describe('Mission Brief instructions', () => {
  it('renders instruction headings before starting', () => {
    render(
      <MissionBrief
        mission={supplyLineMission}
        onBegin={() => {}}
        onBack={() => {}}
        onHowToPlay={() => {}}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Supply Line' })).toBeInTheDocument()
    for (const heading of INSTRUCTION_HEADINGS) {
      expect(screen.getByText(heading)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /choose initial plan/i })).toBeInTheDocument()
  })
})

describe('How to Play copy', () => {
  it('explains goal, map, pivots, fail-forward, and unfinished currencies', () => {
    render(<HowToPlayContent />)
    expect(screen.getByText(/complete the mission objective/i)).toBeInTheDocument()
    expect(screen.getByText(/visual record/i)).toBeInTheDocument()
    expect(screen.getByText(/not a failure/i)).toBeInTheDocument()
    expect(screen.getByText(/not spendable yet/i)).toBeInTheDocument()
    expect(screen.getByText(/traditional lose/i)).toBeInTheDocument()
  })
})

describe('Pivot Event explanation', () => {
  it('states that a plan change is not a failure', () => {
    const event = supplyLineMission.events.find((e) => e.id === 'crossing-closed')!
    render(
      <PivotEventOverlay
        event={event}
        choices={event.choices}
        open
        onSelect={() => {}}
        decisionLoad="open"
        informationStyle="standard"
        predictability="balanced"
        onHowToPlay={() => {}}
      />,
    )
    expect(screen.getByText(PIVOT_FAIL_FORWARD)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument()
  })
})

describe('Decision Load disclosure', () => {
  it('keeps unique routes available behind More options', async () => {
    const user = userEvent.setup()
    const pivot = supplyLineMission.events.find((e) => e.id === 'crossing-closed')!
    const baseline = pivot.choices.filter((c) => !c.requireEquipment?.length)
    const { extra } = applyDecisionLoad(baseline, 2)
    expect(extra.some((c) => c.id === 'crossing-repair')).toBe(true)

    render(
      <DecisionPanel
        choices={baseline}
        onSelect={() => {}}
        decisionLoad={2}
        informationStyle="standard"
      />,
    )
    expect(screen.queryByText('Inspect the crossing. Requires engineering materials.')).toBeNull()
    await user.click(screen.getByRole('button', { name: /more options/i }))
    expect(screen.getByText(/Inspect the crossing/i)).toBeInTheDocument()
  })

  it('does not make Supply Line appear stuck at decision load 2', () => {
    const snapshots = playPath('supply-line', [
      'plan-direct',
      'crossing-reroute',
      'eastern-to-hills-choice',
      'hills-to-north-choice',
    ])
    const pivot = snapshots[1]!
    const mission = supplyLineMission
    const choices = pivot.availableChoiceIds
      .map((id) => mission.events[0]!.choices.find((c) => c.id === id) ?? mission.choiceLibrary?.find((c) => c.id === id))
      .filter((c): c is DecisionChoice => Boolean(c))
    const { visible, extra } = applyDecisionLoad(choices, 2)
    expect([...visible, ...extra].length).toBeGreaterThan(0)
    expect(snapshots.at(-1)?.missionStatus).toBe('completed')
  })
})

describe('Unavailable resources and empty actions', () => {
  it('names the missing resource', () => {
    const summary = missingResourceSummary(
      { materials: 1 },
      {
        materials: 0,
        intel: 0,
        influence: 0,
        experience: 0,
        pivotTokens: 0,
      },
    )
    expect(summary).toMatch(/Materials/)
    expect(summary).toMatch(/need 1/)

    const choice: DecisionChoice = {
      id: 'pay',
      label: 'Repair',
      description: 'Needs materials.',
      actionType: 'repair',
      requireResources: { materials: 2 },
      effects: [],
    }
    render(
      <DecisionPanel
        choices={[choice]}
        onSelect={() => {}}
        decisionLoad="open"
        informationStyle="short"
        resources={{
          materials: 0,
          intel: 0,
          influence: 0,
          experience: 0,
          pivotTokens: 0,
        }}
      />,
    )
    expect(screen.getByText(/missing Materials/i)).toBeInTheDocument()
  })

  it('shows recovery copy instead of an empty action panel', () => {
    render(
      <DecisionPanel
        choices={[]}
        onSelect={() => {}}
        decisionLoad={3}
        informationStyle="standard"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/no actions listed/i)
  })

  it('marks completion actions as Complete objective', () => {
    const choice: DecisionChoice = {
      id: 'finish',
      label: 'Deliver to North Station',
      description: 'Final leg.',
      actionType: 'continue',
      effects: [
        { type: 'move_to', nodeId: 'north-station' },
        { type: 'complete_mission' },
      ],
    }
    render(
      <DecisionPanel
        choices={[choice]}
        onSelect={() => {}}
        decisionLoad="open"
        informationStyle="standard"
      />,
    )
    expect(screen.getByText(/complete objective/i)).toBeInTheDocument()
  })
})

describe('Supported mission paths stay actionable', () => {
  it('keeps choices listed until completion on authored happy paths', () => {
    const paths: Array<[string, string[]]> = [
      ['supply-line', ['plan-direct', 'crossing-recon', 'take-river-ford', 'ford-to-north-choice']],
      ['missing-recon', ['mr-direct', 'mr-go-camp', 'mr-finish-camp']],
      ['broken-connection', ['bc-ask', 'bc-via-depot', 'bc-finish-depot']],
      ['relay-drift', ['rd-direct', 'rd-to-rail', 'rd-rail-advance', 'rd-finish']],
      ['signal-block', ['sb-direct', 'sb-to-siding', 'sb-siding-advance', 'sb-finish']],
    ]
    for (const [missionId, steps] of paths) {
      const snapshots = playPath(missionId, steps)
      expect(snapshots.at(-1)?.missionStatus, missionId).toBe('completed')
      expect(snapshots.at(-1)?.playerNodeId).toBe(
        buildMissionRegistry().get(missionId)!.map.objectiveNodeId,
      )
    }
  })

  it('documents that authored movement may skip map connections', () => {
    const [started, afterDirect] = playPath('supply-line', ['plan-direct'])
    expect(started.playerNodeId).toBe('echo-base')
    expect(afterDirect.playerNodeId).toBe('crossing')
    expect(afterDirect.playerNodeId).not.toBe('main-road')
  })
})

describe('How to Play from onboarding and the field manual', () => {
  it('exposes How to Play on onboarding and the dedicated screen', () => {
    const { unmount } = render(
      <MemoryRouter>
        <OnboardingScreen />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument()
    unmount()

    render(
      <MemoryRouter>
        <HowToPlayScreen />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'How to Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /replay tutorial/i })).toBeInTheDocument()
  })
})

describe('How to Play during a mission', () => {
  it('opens How to Play from the brief without starting', async () => {
    const user = userEvent.setup()
    const onHowToPlay = vi.fn()
    render(
      <MissionBrief
        mission={relayDriftMission}
        onBegin={() => {}}
        onBack={() => {}}
        onHowToPlay={onHowToPlay}
      />,
    )
    await user.click(screen.getByRole('button', { name: /how to play/i }))
    expect(onHowToPlay).toHaveBeenCalled()
  })
})
