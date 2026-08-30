export class AudioBus {
  muted = false
  private ctx: AudioContext | null = null

  unlock() {
    this.ensure()
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  pulse() {
    this.blip(420, 0.07, 'sine', 0.04)
  }

  hit() {
    this.blip(180, 0.05, 'square', 0.035)
  }

  kill() {
    this.sweep(320, 140, 0.12, 0.05)
  }

  hurt() {
    this.sweep(220, 70, 0.16, 0.07)
  }

  level() {
    this.sweep(360, 720, 0.22, 0.06)
  }

  over() {
    this.sweep(300, 60, 0.45, 0.08)
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

  private blip(freq: number, dur: number, type: OscillatorType, gain: number) {
    const ctx = this.ensure()
    if (!ctx || this.muted) return
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    amp.gain.setValueAtTime(gain, ctx.currentTime)
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(amp)
    amp.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  }

  private sweep(from: number, to: number, dur: number, gain: number) {
    const ctx = this.ensure()
    if (!ctx || this.muted) return
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = 'triangle'
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
