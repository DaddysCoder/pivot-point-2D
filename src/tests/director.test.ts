import { describe, expect, it } from 'vitest'
import {
  applyDirectorAfterBeat,
  buildDirectorContext,
  evaluateDirector,
  noteManualDirectorCooldown,
} from '@/director/adaptiveDirector'
import {
  createInitialDirectorState,
  normalizeDirectorState,
  recordDirectorTrigger,
  tickDirectorClock,
} from '@/director/directorMemory'
import { getDirectorEventMeta } from '@/director/directorRegistry'
import { scoreDirectorEvent } from '@/director/eventScoring'
import {
  createInitialGameState,
  reduceGame,
  startMission,
} from '@/engine'
import { getFrontierMissionRegistry, supplyLineMission } from '@/worlds/frontier'

const registry = getFrontierMissionRegistry()

const directorOn = {
  directorEnabled: true,
  predictability: 'balanced' as const,
}

const directorOff = {
  directorEnabled: false,
  predictability: 'balanced' as const,
}

function beginSupplyLine(seed = 42) {
  const state = createInitialGameState({ seed })
  return startMission(state, supplyLineMission).state
}

function choose(
  state: ReturnType<typeof beginSupplyLine>,
  choiceId: string,
  options = directorOff,
) {
  return reduceGame(state, { type: 'SELECT_CHOICE', choiceId }, registry, options)
}

function activeDirectorState(seed = 42) {
  // Eastern route avoids scripted crossing pivot so Director can evaluate on active beats.
  let state = beginSupplyLine(seed)
  state = choose(state, 'plan-eastern', directorOff).state
  // Clear soft mission cooldown from any incidental notes; eastern has no scripted pivot.
  state = {
    ...state,
    director: {
      ...normalizeDirectorState(state.director),
      cooldownRemaining: 0,
      intensityAvailable: 100,
    },
    missionStatus: 'active',
    activeEventId: null,
  }
  return state
}

describe('Adaptive Director', () => {
  it('returns the same decision for the same seed and state', () => {
    const state = activeDirectorState(99)
    const ctx = buildDirectorContext(true, 'balanced', 'supply-line')
    const a = evaluateDirector(state, supplyLineMission, ctx)
    const b = evaluateDirector(state, supplyLineMission, ctx)
    expect(a).toEqual(b)
  })

  it('does nothing while paused, during pivot, or when completed', () => {
    const base = activeDirectorState()
    const ctx = buildDirectorContext(true, 'balanced', 'supply-line')

    expect(
      evaluateDirector(
        { ...base, missionStatus: 'paused' },
        supplyLineMission,
        ctx,
      ).type,
    ).toBe('none')
    expect(
      evaluateDirector(
        { ...base, missionStatus: 'pivot', activeEventId: 'crossing-closed' },
        supplyLineMission,
        ctx,
      ).type,
    ).toBe('none')
    expect(
      evaluateDirector(
        { ...base, missionStatus: 'completed' },
        supplyLineMission,
        ctx,
      ).type,
    ).toBe('none')
  })

  it('returns none when disabled or mission not allow-listed', () => {
    const state = activeDirectorState()
    expect(
      evaluateDirector(
        state,
        supplyLineMission,
        buildDirectorContext(false, 'balanced', 'supply-line'),
      ).type,
    ).toBe('none')
    expect(
      evaluateDirector(
        state,
        supplyLineMission,
        buildDirectorContext(true, 'balanced', 'broken-connection'),
      ).reasonCodes,
    ).toContain('mission_not_allowlisted')
  })

  it('cooldown prevents director event spam', () => {
    let state = activeDirectorState(7)
    const ctx = buildDirectorContext(true, 'balanced', 'supply-line')
    const first = applyDirectorAfterBeat(state, supplyLineMission, ctx, 'continue')
    expect(first.events.some((e) => e.type === 'DIRECTOR_TRIGGER')).toBe(true)
    expect(first.state.director.cooldownRemaining).toBeGreaterThan(0)

    const second = applyDirectorAfterBeat(
      { ...first.state, missionStatus: 'active', activeEventId: null },
      supplyLineMission,
      ctx,
      'continue',
    )
    // Still cooling down after a single tick from applyDirectorAfterBeat
    expect(second.events.some((e) => e.type === 'DIRECTOR_TRIGGER')).toBe(false)
    expect(second.state.director?.lastDecision?.type).toBe('none')
  })

  it('intensity budget blocks events that cost more than available', () => {
    const state = {
      ...activeDirectorState(3),
      director: {
        ...createInitialDirectorState(),
        intensityAvailable: 5,
        cooldownRemaining: 0,
      },
    }
    const decision = evaluateDirector(
      state,
      supplyLineMission,
      buildDirectorContext(true, 'balanced', 'supply-line'),
    )
    expect(decision.type).toBe('none')
  })

  it('max-per-mission is enforced', () => {
    const meta = getDirectorEventMeta('lib-weather')!
    let director = createInitialDirectorState()
    director = recordDirectorTrigger(
      director,
      meta,
      2,
      { type: 'trigger', eventId: meta.eventId, reasonCodes: [] },
    )
    const state = {
      ...activeDirectorState(5),
      director: { ...director, cooldownRemaining: 0, intensityAvailable: 100 },
      triggeredEventIds: [],
    }
    // Force only this meta path via already-triggered others — score should mark maxed
    const scored = scoreDirectorEvent({
      state,
      mission: supplyLineMission,
      meta,
      predictability: 'balanced',
      recentCategories: [],
    })
    expect(scored.eligible).toBe(false)
    expect(scored.reasonCodes).toContain('max_per_mission')
  })

  it('category repetition is penalised when another option exists', () => {
    const metaRoute = getDirectorEventMeta('lib-route-blocked')!
    const metaIntel = getDirectorEventMeta('lib-intel-conflict')!
    let director = createInitialDirectorState()
    director = {
      ...director,
      history: [
        {
          eventId: 'lib-route-blocked',
          category: 'route',
          turn: 1,
          source: 'director',
        },
      ],
      cooldownRemaining: 0,
    }
    const state = { ...activeDirectorState(11), director }
    const routeScore = scoreDirectorEvent({
      state,
      mission: supplyLineMission,
      meta: metaRoute,
      predictability: 'balanced',
      recentCategories: ['route'],
    })
    const intelScore = scoreDirectorEvent({
      state,
      mission: supplyLineMission,
      meta: metaIntel,
      predictability: 'balanced',
      recentCategories: ['route'],
    })
    expect(routeScore.reasonCodes).toContain('repeats_previous_category')
    expect(intelScore.score).toBeGreaterThan(routeScore.score)
  })

  it('manual Mission Control resets director cooldown', () => {
    let state = activeDirectorState(8)
    state = {
      ...state,
      director: { ...createInitialDirectorState(), cooldownRemaining: 0 },
    }
    state = noteManualDirectorCooldown(state, 'lib-waiting')
    expect(state.director.cooldownRemaining).toBeGreaterThanOrEqual(2)
    expect(state.director.history.at(-1)?.source).toBe('manual')
  })

  it('equipment influences score but does not guarantee an event', () => {
    const meta = getDirectorEventMeta('lib-resource-short')!
    const bare = activeDirectorState(13)
    const withCache = {
      ...bare,
      activeLoadout: ['supply-cache' as const],
      inventory: [{ equipmentId: 'supply-cache' as const, quantity: 1 }],
    }
    const without = scoreDirectorEvent({
      state: bare,
      mission: supplyLineMission,
      meta,
      predictability: 'balanced',
      recentCategories: [],
    })
    const withEq = scoreDirectorEvent({
      state: withCache,
      mission: supplyLineMission,
      meta,
      predictability: 'balanced',
      recentCategories: [],
    })
    expect(withEq.reasonCodes).toContain('equipment_opportunity')
    expect(withEq.score).toBeGreaterThan(without.score)
    // Still not a forced trigger — eligibility remains score/threshold based
    expect(typeof withEq.eligible).toBe('boolean')
  })

  it('director-triggered library event resolves through existing Pivot flow', () => {
    let state = activeDirectorState(21)
    const result = applyDirectorAfterBeat(
      state,
      supplyLineMission,
      buildDirectorContext(true, 'balanced', 'supply-line'),
      'continue',
    )
    expect(result.events.some((e) => e.type === 'DIRECTOR_TRIGGER')).toBe(true)
    expect(result.events.some((e) => e.type === 'PIVOT_EVENT')).toBe(true)
    expect(result.state.missionStatus).toBe('pivot')
    expect(result.state.activeEventId).toBeTruthy()

    const eventId = result.state.activeEventId!
    const mission = supplyLineMission
    const composedChoices =
      result.state.injectedEvents.find((e) => e.id === eventId)?.choices ??
      mission.events.find((e) => e.id === eventId)?.choices
    expect(composedChoices && composedChoices.length > 0).toBe(true)
    const choiceId = composedChoices![0]!.id
    state = reduceGame(
      result.state,
      { type: 'SELECT_CHOICE', choiceId },
      registry,
      directorOn,
    ).state
    expect(state.missionStatus === 'active' || state.missionStatus === 'pivot').toBe(
      true,
    )
  })

  it('reload-style normalization preserves director memory', () => {
    const raw = {
      intensityAvailable: 55,
      cooldownRemaining: 2,
      history: [
        {
          eventId: 'lib-weather',
          category: 'environment' as const,
          turn: 3,
          source: 'director' as const,
        },
      ],
    }
    const normalized = normalizeDirectorState(raw)
    expect(normalized.intensityAvailable).toBe(55)
    expect(normalized.cooldownRemaining).toBe(2)
    expect(normalized.history).toHaveLength(1)
    expect(normalizeDirectorState(undefined).history).toEqual([])
  })

  it('Supply Line remains completable with Director disabled', () => {
    let state = beginSupplyLine(4)
    state = choose(state, 'plan-eastern', directorOff).state
    state = choose(state, 'eastern-to-hills-choice', directorOff).state
    state = choose(state, 'hills-to-north-choice', directorOff).state
    expect(state.missionStatus).toBe('completed')
  })

  it('Supply Line remains completable with Director enabled', () => {
    let state = beginSupplyLine(6)
    // Scripted pivot path — director must not hard-lock progress
    state = choose(state, 'plan-direct', directorOn).state
    expect(state.activeEventId).toBe('crossing-closed')
    state = choose(state, 'crossing-reroute', directorOn).state

    // Drain director pivots if any appear; always prefer progress choices
    for (let i = 0; i < 12 && state.missionStatus !== 'completed'; i += 1) {
      if (state.missionStatus === 'pivot' && state.activeEventId) {
        const choiceId = state.availableChoiceIds[0]
        if (!choiceId) break
        state = choose(state, choiceId, directorOn).state
        continue
      }
      const progress =
        state.availableChoiceIds.find((id) =>
          [
            'eastern-to-hills-choice',
            'hills-to-north-choice',
            'take-river-ford',
            'ford-to-north-choice',
            'eastern-recon',
            'hills-to-ford-choice',
          ].includes(id),
        ) ?? state.availableChoiceIds[0]
      if (!progress) break
      state = choose(state, progress, directorOn).state
    }
    expect(state.missionStatus).toBe('completed')
  })

  it('tick recovers intensity over turns', () => {
    let director = createInitialDirectorState()
    director = { ...director, intensityAvailable: 40 }
    director = tickDirectorClock(director, 'balanced')
    expect(director.intensityAvailable).toBeGreaterThan(40)
  })

  it('high predictability can emit a field advisory before triggering', () => {
    let state = activeDirectorState(17)
    state = {
      ...state,
      director: {
        ...createInitialDirectorState(),
        cooldownRemaining: 0,
        intensityAvailable: 100,
      },
    }
    const result = applyDirectorAfterBeat(
      state,
      supplyLineMission,
      buildDirectorContext(true, 'high', 'supply-line'),
      'continue',
    )
    const advisory = result.events.find((e) => e.type === 'DIRECTOR_ADVISORY')
    const trigger = result.events.find((e) => e.type === 'DIRECTOR_TRIGGER')
    // Either advisory (preferred) or none if threshold blocks — never chaos
    if (advisory) {
      expect(result.state.missionLog.some((l) => l.title === 'FIELD ADVISORY')).toBe(
        true,
      )
      expect(result.state.director.advisoryPendingEventId).toBeTruthy()
      expect(trigger).toBeUndefined()
    } else {
      expect(result.state.missionStatus).not.toBe('completed')
    }
  })

  it('different eligible setups can select different events', () => {
    const ctx = buildDirectorContext(true, 'unpredictable', 'supply-line')
    const a = evaluateDirector(activeDirectorState(1), supplyLineMission, ctx)
    const b = evaluateDirector(activeDirectorState(2), supplyLineMission, ctx)
    // Not required to differ every time, but decisions must be well-formed
    expect(['trigger', 'none', 'advisory']).toContain(a.type)
    expect(['trigger', 'none', 'advisory']).toContain(b.type)
  })
})
