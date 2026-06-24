/**
 * Synthesizes firework explosion sounds using the Web Audio API.
 * No audio files needed — everything is generated on the fly.
 *
 * A single "pop" consists of:
 *   1. White-noise burst (the explosion body) shaped through a bandpass filter
 *   2. Low-frequency thud (the concussive boom) via a sine oscillator that
 *      drops quickly in pitch and amplitude
 *   3. High-frequency sparkle (the crackle tail) via a high-pass filtered noise
 */

// Lazy-init a single shared AudioContext (browsers require user gesture first)
let _ctx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  // Resume if suspended (Chrome autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** Play one firework pop at `delaySeconds` from now. */
function playPop(ctx: AudioContext, delaySeconds: number) {
  const t = ctx.currentTime + delaySeconds

  // ── 1. Noise burst ────────────────────────────────────────────────────────
  // Build a short buffer of white noise with a natural exponential decay baked in
  const sr = ctx.sampleRate
  const noiseDur = 0.45
  const noiseBuf = ctx.createBuffer(1, Math.floor(sr * noiseDur), sr)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    // Amplitude envelope: sharp attack, exponential fall-off
    const env = Math.pow(1 - i / data.length, 1.8)
    data[i] = (Math.random() * 2 - 1) * env
  }

  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = noiseBuf

  // Bandpass shapes the noise from harsh white → warm "whoosh"
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 600
  bp.Q.value = 0.7

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.55, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur)

  noiseSource.connect(bp)
  bp.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noiseSource.start(t)

  // ── 2. Low thud (boom) ────────────────────────────────────────────────────
  const thud = ctx.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(90, t)
  thud.frequency.exponentialRampToValueAtTime(22, t + 0.25)

  const thudGain = ctx.createGain()
  thudGain.gain.setValueAtTime(1.1, t)
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)

  thud.connect(thudGain)
  thudGain.connect(ctx.destination)
  thud.start(t)
  thud.stop(t + 0.3)

  // ── 3. High sparkle (crackle tail) ────────────────────────────────────────
  const crackleDur = 0.6
  const crackleBuf = ctx.createBuffer(1, Math.floor(sr * crackleDur), sr)
  const cData = crackleBuf.getChannelData(0)
  for (let i = 0; i < cData.length; i++) {
    // Sparse crackle: most samples silent, occasional random spike
    cData[i] = Math.random() < 0.06 ? (Math.random() * 2 - 1) : 0
    // Fade out over the buffer length
    cData[i] *= Math.pow(1 - i / cData.length, 1.2)
  }

  const crackleSource = ctx.createBufferSource()
  crackleSource.buffer = crackleBuf

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000

  const crackleGain = ctx.createGain()
  crackleGain.gain.setValueAtTime(0.35, t)
  crackleGain.gain.exponentialRampToValueAtTime(0.001, t + crackleDur)

  crackleSource.connect(hp)
  hp.connect(crackleGain)
  crackleGain.connect(ctx.destination)
  crackleSource.start(t)
}

/**
 * Play the full firework sequence — one pop per burst site, timed to match
 * the visual burst delays in Fireworks.tsx.
 */
const BURST_DELAYS = [0, 0.20, 0.42, 0.65, 0.85]

export function playFireworkSounds() {
  try {
    const ctx = getCtx()
    for (const delay of BURST_DELAYS) {
      playPop(ctx, delay)
    }
  } catch (e) {
    // Audio not available (e.g., automated test env) — silently ignore
    console.warn('Firework audio unavailable:', e)
  }
}
