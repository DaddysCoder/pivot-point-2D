/**
 * Lightweight Web Audio feedback. Respects Play Style sound toggles.
 * No external assets required for Alpha/Beta.
 */

type SoundKind = 'ui' | 'effect' | 'alert' | 'pivot' | 'success'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export interface SoundGates {
  musicEnabled: boolean
  effectsEnabled: boolean
  alertsEnabled: boolean
}

export function playTone(
  kind: SoundKind,
  gates: SoundGates,
  opts: { freq?: number; duration?: number; type?: OscillatorType } = {},
): void {
  if (kind === 'alert' && !gates.alertsEnabled) return
  if ((kind === 'effect' || kind === 'pivot' || kind === 'success') && !gates.effectsEnabled)
    return
  if (kind === 'ui' && !gates.effectsEnabled) return

  const audio = getCtx()
  if (!audio) return
  void audio.resume()

  const osc = audio.createOscillator()
  const gain = audio.createGain()
  const now = audio.currentTime
  const freq =
    opts.freq ??
    (kind === 'pivot' ? 220 : kind === 'success' ? 523 : kind === 'alert' ? 180 : 330)
  const duration = opts.duration ?? (kind === 'success' ? 0.28 : 0.12)

  osc.type = opts.type ?? (kind === 'pivot' ? 'triangle' : 'sine')
  osc.frequency.setValueAtTime(freq, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playPivot(gates: SoundGates): void {
  playTone('pivot', gates, { freq: 196, duration: 0.18 })
  window.setTimeout(() => playTone('pivot', gates, { freq: 247, duration: 0.16 }), 90)
}

export function playSuccess(gates: SoundGates): void {
  playTone('success', gates, { freq: 392, duration: 0.12 })
  window.setTimeout(() => playTone('success', gates, { freq: 523, duration: 0.18 }), 100)
}

/** Quiet radio/button click for Deploy and UI confirms. */
export function playUi(gates: SoundGates): void {
  playTone('ui', gates, { freq: 410, duration: 0.06, type: 'square' })
}

/** Soft placement / mechanical click for base install. */
export function playPlace(gates: SoundGates): void {
  playTone('effect', gates, { freq: 180, duration: 0.07, type: 'triangle' })
  window.setTimeout(
    () => playTone('effect', gates, { freq: 140, duration: 0.05, type: 'triangle' }),
    40,
  )
}

/** Soft paper/radio acknowledgement for intel / brief. */
export function playIntel(gates: SoundGates): void {
  playTone('effect', gates, { freq: 290, duration: 0.08, type: 'sine' })
  window.setTimeout(
    () => playTone('effect', gates, { freq: 340, duration: 0.07, type: 'sine' }),
    70,
  )
}
