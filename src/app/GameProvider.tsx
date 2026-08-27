import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  createInitialGameState,
  reduceGame,
  type GameState,
  type MissionDefinition,
  type PlayerCharacter,
} from '@/engine'
import {
  craftEquipment,
  equipItem,
  normalizeCraftingState,
  unequipItem,
} from '@/crafting/craftingEngine'
import type { EquipmentId } from '@/crafting/craftingTypes'
import { normalizeDirectorState } from '@/director/directorMemory'
import { playPivot, playSuccess } from '@/app/sound'
import { GameContext } from '@/app/gameContext'
import { loadCharacterFromStorage } from '@/character/characterStore'
import {
  PRIMARY_SAVE_ID,
  clearSave,
  deleteCustomMission,
  listCustomMissions,
  loadGame,
  saveCustomMission as persistCustomMission,
  saveGame,
  type CustomMissionRecord,
} from '@/persistence/db'
import {
  defaultPlayStyle,
  type PlayStyleSettings,
} from '@/settings/playStyleTypes'
import { buildMissionRegistry } from '@/worlds/registry'

const ONBOARDING_KEY = 'pivot-point.onboardingComplete'

function withCharacter(character: PlayerCharacter | null): GameState {
  const base = createInitialGameState()
  if (!character) return base
  return { ...base, character }
}

function normalizeGameState(state: GameState): GameState {
  const defaults = createInitialGameState()
  const known = new Map(state.base.buildings.map((b) => [b.buildingId, b]))
  const buildings = defaults.base.buildings.map(
    (def) => known.get(def.buildingId) ?? def,
  )
  for (const b of state.base.buildings) {
    if (!buildings.some((x) => x.buildingId === b.buildingId)) {
      buildings.push(b)
    }
  }
  const withCrafting = normalizeCraftingState(state)
  return {
    ...defaults,
    ...withCrafting,
    resources: { ...defaults.resources, ...state.resources },
    inventory: withCrafting.inventory,
    activeLoadout: withCrafting.activeLoadout,
    director: normalizeDirectorState(state.director ?? defaults.director),
    injectedEvents: state.injectedEvents ?? [],
    base: {
      ...defaults.base,
      ...state.base,
      buildings,
      placements: state.base.placements ?? defaults.base.placements,
    },
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [game, setGame] = useState<GameState>(() =>
    withCharacter(loadCharacterFromStorage()),
  )
  const [playStyle, setPlayStyleState] =
    useState<PlayStyleSettings>(defaultPlayStyle)
  const [activeSaveId, setActiveSaveId] = useState(PRIMARY_SAVE_ID)
  const [customMissions, setCustomMissions] = useState<CustomMissionRecord[]>(
    [],
  )
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === '1'
    } catch {
      return false
    }
  })

  const registryRef = useRef(buildMissionRegistry())

  const rebuildRegistry = useCallback((customs: CustomMissionRecord[]) => {
    registryRef.current = buildMissionRegistry(
      customs.map((c) => c.mission as MissionDefinition),
    )
  }, [])

  const refreshCustomMissions = useCallback(async () => {
    const list = await listCustomMissions()
    setCustomMissions(list)
    rebuildRegistry(list)
  }, [rebuildRegistry])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const saved = await loadGame()
      const customs = await listCustomMissions()
      if (cancelled) return
      rebuildRegistry(customs)
      setCustomMissions(customs)
      if (saved) {
        setGame(normalizeGameState(saved.game))
        setPlayStyleState({
          ...defaultPlayStyle,
          ...saved.playStyle,
          adaptiveDirectorEnabled:
            saved.playStyle?.adaptiveDirectorEnabled ?? false,
        })
        setActiveSaveId(saved.id)
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [rebuildRegistry])

  const persist = useCallback(async () => {
    await saveGame({
      id: activeSaveId,
      label: activeSaveId,
      character: game.character,
      game,
      playStyle,
    })
  }, [activeSaveId, game, playStyle])

  useEffect(() => {
    if (!ready) return
    const handle = window.setTimeout(() => {
      void persist()
    }, 250)
    return () => window.clearTimeout(handle)
  }, [game, playStyle, ready, persist])

  useEffect(() => {
    document.documentElement.dataset.motion = playStyle.motion
    document.documentElement.dataset.world = game.worldId
  }, [playStyle.motion, game.worldId])

  const dispatch = useCallback(
    (action: Parameters<typeof reduceGame>[1]) => {
      setGame((current) => {
        const result = reduceGame(current, action, registryRef.current, {
          predictability: playStyle.predictability,
          directorEnabled: playStyle.adaptiveDirectorEnabled,
        })
        if (result.events.some((e) => e.type === 'PIVOT_EVENT')) {
          playPivot(playStyle)
        }
        if (result.events.some((e) => e.type === 'MISSION_COMPLETED')) {
          playSuccess(playStyle)
        }
        return result.state
      })
    },
    [playStyle],
  )

  const setCharacter = useCallback((character: PlayerCharacter) => {
    setGame((current) => ({ ...current, character }))
  }, [])

  const setPlayStyle = useCallback((settings: PlayStyleSettings) => {
    setPlayStyleState(settings)
  }, [])

  const setWorldId = useCallback((worldId: string) => {
    setGame((current) => ({ ...current, worldId }))
    document.documentElement.dataset.world = worldId
  }, [])

  const upgradeBuilding = useCallback((buildingId: string) => {
    let purchased = false
    setGame((current) => {
      const building = current.base.buildings.find(
        (b) => b.buildingId === buildingId,
      )
      if (!building) return current

      const costs: Record<string, number> = {
        'map-room': 3,
        workshop: 5,
        storage: 2,
        recon: 4,
        archive: 4,
        'comms-tower': 6,
      }
      const maxLevels: Record<string, number> = {
        'map-room': 2,
        workshop: 1,
        storage: 2,
        recon: 2,
        archive: 1,
        'comms-tower': 1,
      }
      const cost = costs[buildingId]
      const maxLevel = maxLevels[buildingId]
      if (cost == null || maxLevel == null) return current
      if (building.level >= maxLevel) return current
      if (current.resources.materials < cost) return current

      purchased = true
      return {
        ...current,
        resources: {
          ...current.resources,
          materials: current.resources.materials - cost,
        },
        base: {
          ...current.base,
          buildings: current.base.buildings.map((b) =>
            b.buildingId === buildingId ? { ...b, level: b.level + 1 } : b,
          ),
        },
      }
    })
    return purchased
  }, [])

  const placeBuilding = useCallback((buildingId: string, x: number, y: number) => {
    let placed = false
    setGame((current) => {
      if (x < 0 || y < 0 || x >= current.base.gridWidth || y >= current.base.gridHeight) {
        return current
      }
      const exists = current.base.buildings.find((b) => b.buildingId === buildingId)
      if (!exists || exists.level < 1) return current
      placed = true
      return {
        ...current,
        base: {
          ...current.base,
          placements: {
            ...(current.base.placements ?? {}),
            [buildingId]: { x, y },
          },
        },
      }
    })
    return placed
  }, [])

  const craftEquipmentItem = useCallback((equipmentId: EquipmentId) => {
    let crafted = false
    setGame((current) => {
      const { state, result } = craftEquipment(current, equipmentId)
      crafted = result.ok
      return result.ok ? state : current
    })
    return crafted
  }, [])

  const equipLoadoutItem = useCallback((equipmentId: EquipmentId) => {
    let equipped = false
    setGame((current) => {
      const { state, result } = equipItem(current, equipmentId)
      equipped = result.ok
      return result.ok ? state : current
    })
    return equipped
  }, [])

  const unequipLoadoutItem = useCallback((equipmentId: EquipmentId) => {
    let cleared = false
    setGame((current) => {
      const { state, result } = unequipItem(current, equipmentId)
      cleared = result.ok
      return result.ok ? state : current
    })
    return cleared
  }, [])

  const resetCampaign = useCallback(() => {
    setGame(withCharacter(loadCharacterFromStorage()))
    setPlayStyleState(defaultPlayStyle)
  }, [])

  const saveCustomMission = useCallback(
    async (record: Omit<CustomMissionRecord, 'updatedAt'>) => {
      await persistCustomMission(record)
      await refreshCustomMissions()
    },
    [refreshCustomMissions],
  )

  const deleteCustomMissionById = useCallback(
    async (id: string) => {
      await deleteCustomMission(id)
      await refreshCustomMissions()
    },
    [refreshCustomMissions],
  )

  const loadSaveSlot = useCallback(async (id: string) => {
    const saved = await loadGame(id)
    if (!saved) return
    setGame(normalizeGameState(saved.game))
    setPlayStyleState({
      ...defaultPlayStyle,
      ...saved.playStyle,
      adaptiveDirectorEnabled:
        saved.playStyle?.adaptiveDirectorEnabled ?? false,
    })
    setActiveSaveId(saved.id)
  }, [])

  const saveToSlot = useCallback(
    async (id: string, label: string) => {
      await saveGame({
        id,
        label,
        character: game.character,
        game,
        playStyle,
      })
      setActiveSaveId(id)
    },
    [game, playStyle],
  )

  const deleteSaveSlot = useCallback(
    async (id: string) => {
      await clearSave(id)
      if (id === activeSaveId) {
        setActiveSaveId(PRIMARY_SAVE_ID)
      }
    },
    [activeSaveId],
  )

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboardingComplete(true)
  }, [])

  const value = useMemo(
    () => ({
      ready,
      game,
      playStyle,
      activeSaveId,
      customMissions,
      onboardingComplete,
      dispatch,
      setCharacter,
      setPlayStyle,
      setWorldId,
      upgradeBuilding,
      placeBuilding,
      craftEquipmentItem,
      equipLoadoutItem,
      unequipLoadoutItem,
      resetCampaign,
      persist,
      saveCustomMission,
      refreshCustomMissions,
      deleteCustomMissionById,
      loadSaveSlot,
      saveToSlot,
      deleteSaveSlot,
      completeOnboarding,
    }),
    [
      ready,
      game,
      playStyle,
      activeSaveId,
      customMissions,
      onboardingComplete,
      dispatch,
      setCharacter,
      setPlayStyle,
      setWorldId,
      upgradeBuilding,
      placeBuilding,
      craftEquipmentItem,
      equipLoadoutItem,
      unequipLoadoutItem,
      resetCampaign,
      persist,
      saveCustomMission,
      refreshCustomMissions,
      deleteCustomMissionById,
      loadSaveSlot,
      saveToSlot,
      deleteSaveSlot,
      completeOnboarding,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
