import { Navigate, Route, Routes } from 'react-router-dom'
import { useGame } from '@/app/useGame'
import { HowToPlayScreen } from '@/app/HowToPlayScreen'
import { OnboardingScreen } from '@/app/OnboardingScreen'
import { BaseScreen } from '@/base/BaseScreen'
import { CharacterCreator } from '@/character/CharacterCreator'
import { WorkshopScreen } from '@/crafting/WorkshopScreen'
import { AfterAction } from '@/debrief/AfterAction'
import { MissionBuilderScreen } from '@/mission-builder/MissionBuilderScreen'
import { MissionMasterScreen } from '@/mission-builder/MissionMasterScreen'
import { FacilitatorProfilesScreen } from '@/mission-control/FacilitatorProfilesScreen'
import { MissionScreen } from '@/mission/MissionScreen'
import { SaveSlotsScreen } from '@/persistence/SaveSlotsScreen'
import { PlayStyleSettingsPanel } from '@/settings/PlayStyleSettings'

function HomeRedirect() {
  const { game, ready, onboardingComplete } = useGame()
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="font-serif text-xl">Loading Pivot Point…</p>
      </main>
    )
  }
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }
  if (!game.character.callSign) {
    return <Navigate to="/create" replace />
  }
  return <Navigate to="/base" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/how-to-play" element={<HowToPlayScreen />} />
      <Route path="/create" element={<CharacterCreator />} />
      <Route path="/base" element={<BaseScreen />} />
      <Route path="/workshop" element={<WorkshopScreen />} />
      <Route path="/mission/:missionId" element={<MissionScreen />} />
      <Route path="/debrief/:missionId" element={<AfterAction />} />
      <Route path="/settings" element={<PlayStyleSettingsPanel />} />
      <Route path="/saves" element={<SaveSlotsScreen />} />
      <Route path="/builder" element={<MissionBuilderScreen />} />
      <Route path="/mission-master" element={<MissionMasterScreen />} />
      <Route path="/facilitators" element={<FacilitatorProfilesScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
