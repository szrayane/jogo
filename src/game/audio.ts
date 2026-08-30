export class AudioBus {
  muted = false
  private ctx: AudioContext | null = null

  unlock() {
    this.ensure()
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  jump() {
    this.sweep(280, 520, 0.1, 0.05, 'square')
  }

  coin() {
    this.blip(980, 0.05, 'square', 0.045)
    this.blip(1320, 0.08, 'square', 0.035, 0.05)
  }

  stomp() {
    this.sweep(200, 90, 0.1, 0.06, 'square')
  }

  bump() {
    this.blip(140, 0.06, 'triangle', 0.05)
  }

  power() {
    this.sweep(360, 820, 0.22, 0.055, 'square')
  }

  hurt() {
    this.sweep(260, 80, 0.18, 0.07, 'sawtooth')
  }

  die() {
    this.sweep(320, 70, 0.4, 0.07, 'square')
  }

  clear() {
    this.sweep(400, 880, 0.28, 0.05, 'triangle')
  }

  private ensure() {
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return
      this.ctx = new AudioCtor()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
    const ctx = this.ensure()
    if (!ctx || this.muted) return
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = type
    osc.frequency.value = freq
    amp.gain.setValueAtTime(gain, t)
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(amp)
    amp.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur)
  }

  private sweep(from: number, to: number, dur: number, gain: number, type: OscillatorType) {
    const ctx = this.ensure()
    if (!ctx || this.muted) return
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), ctx.currentTime + dur)
    amp.gain.setValueAtTime(gain, ctx.currentTime)
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(amp)
    amp.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  }
}
