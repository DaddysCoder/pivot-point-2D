# Pivot Point

**Plans change. Find your next move.**

Interest-led strategy game built around planning, problem-solving, and adapting when circumstances change.

Designed with neurodivergence-informed accessibility in mind. Not marketed as clinical treatment.

## Status: Beta 01+

Playable across three world packs, custom missions, PWA install, and facilitator tools.

### Worlds
- **Frontier** — history/strategy (Supply Line, Missing Recon, Broken Connection)
- **Orbit** — space exploration (Relay Drift)
- **Rail** — railways (Signal Block)

### Features
- Character creator + Play Style controls
- Persistent base grid with placements/upgrades
- Pivot Event Engine + reusable event library
- Mission Builder, map editor, JSON import/export
- Mission Master (local facilitator disruptions)
- Mission Control + facilitator profiles
- Save slots (Dexie / IndexedDB)
- PWA (installable, offline shell)
- Light Web Audio feedback
- Onboarding + skip-to-content
- How to Play (permanent) + Mission Brief instructions + first-mission tutorial

### Explicitly not included (by design)
- Backend / authentication / analytics
- Multiplayer networking
- 3D
- Clinical claims or clinical data collection

## Scripts

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Architecture

- `src/engine/` — pure reducer, mission/event/reward, pivot library
- `src/worlds/` — Frontier + Orbit + Rail packs + registry
- `src/mission-builder/` — builder, map editor, Mission Master
- `src/mission/` · `src/base/` · `src/character/` · `src/debrief/` · `src/mission-control/` · `src/settings/` · `src/persistence/`
