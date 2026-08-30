import { AudioBus } from './audio'
import { Input } from './input'
import { createPlayer, nextXpNeed, pickUpgrades } from './upgrades'
import type {
  Enemy,
  EnemyKind,
  EngineHooks,
  Floater,
  Gem,
  Particle,
  Player,
  Satellite,
  UpgradeDef,
} from './types'

const TAU = Math.PI * 2

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function blueprint(kind: EnemyKind): Omit<Enemy, 'id' | 'x' | 'y'> {
  switch (kind) {
    case 'wraith':
      return { kind, r: 11, hp: 14, maxHp: 14, speed: 138, dmg: 7, xp: 6, hitCd: 0, hue: 280 }
    case 'brute':
      return { kind, r: 22, hp: 86, maxHp: 86, speed: 42, dmg: 16, xp: 14, hitCd: 0, hue: 18 }
    case 'seeker':
      return { kind, r: 13, hp: 32, maxHp: 32, speed: 98, dmg: 11, xp: 9, hitCd: 0, hue: 200 }
    default:
      return { kind: 'shade', r: 14, hp: 22, maxHp: 22, speed: 72, dmg: 8, xp: 4, hitCd: 0, hue: 312 }
  }
}

export class LumenEngine {
  paused = false
  choosing = false
  attract = false
  muted = false
  shake = 0
  waveFlash = 0
  pulseRing = 0
  readonly input = new Input()
  readonly audio = new AudioBus()

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private hooks: EngineHooks
  private running = false
  private last = 0
  private frame = 0
  private hudAcc = 0
  private spawnAcc = 0
  private nextId = 1
  private w = 0
  private h = 0
  private stars: { x: number; y: number; z: number; a: number }[] = []

  player!: Player
  enemies: Enemy[] = []
  gems: Gem[] = []
  particles: Particle[] = []
  floaters: Floater[] = []
  moons: Satellite[] = []
  score = 0
  combo = 1
  comboT = 0
  wave = 1
  time = 0
  kills = 0

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponível')
    this.canvas = canvas
    this.ctx = ctx
    this.hooks = hooks
    this.input.attach(canvas)
    this.resize()
    this.reset()
  }

  reset() {
    this.player = createPlayer(this.w / 2, this.h / 2)
    this.enemies = []
    this.gems = []
    this.particles = []
    this.floaters = []
    this.moons = []
    this.score = 0
    this.combo = 1
    this.comboT = 0
    this.wave = 1
    this.time = 0
    this.kills = 0
    this.spawnAcc = 0.4
    this.shake = 0
    this.waveFlash = 1.6
    this.pulseRing = 0
    this.choosing = false
    this.paused = false
    this.attract = false
    this.seedStars()
    this.emitHud()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.audio.unlock()
    this.frame = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frame)
    this.input.detach()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.audio.setMuted(muted)
  }

  applyUpgrade(upgrade: UpgradeDef) {
    upgrade.apply(this.player)
    if (this.player.satellites > this.moons.length) {
      this.moons.push({ angle: rand(0, TAU), radius: 42 + this.moons.length * 16 })
    }
    this.choosing = false
    this.paused = false
    this.burst(this.player.x, this.player.y, '#ffd4e2', 18)
    this.audio.level()
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.w = w
    this.h = h
    this.canvas.width = Math.floor(w * dpr)
    this.canvas.height = Math.floor(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (this.stars.length === 0) this.seedStars()
    if (this.player) {
      if (this.attract) {
        this.player.x = this.w / 2
        this.player.y = this.h / 2
      } else {
        this.player.x = clamp(this.player.x, 28, this.w - 28)
        this.player.y = clamp(this.player.y, 28, this.h - 28)
      }
    }
  }

  private seedStars() {
    this.stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * Math.max(this.w, 1),
      y: Math.random() * Math.max(this.h, 1),
      z: rand(0.3, 1.4),
      a: rand(0.25, 0.9),
    }))
  }

  private tick = (now: number) => {
    if (!this.running) return
    const dt = Math.min((now - this.last) / 1000, 0.033)
    this.last = now
    if (this.attract) {
      this.time += dt
    } else if (!this.paused && !this.choosing) {
      this.update(dt)
    }
    this.draw()
    this.hudAcc += dt
    if (this.hudAcc > 0.08) {
      this.hudAcc = 0
      this.emitHud()
    }
    this.frame = requestAnimationFrame(this.tick)
  }

  private emitHud() {
    this.hooks.onHud({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.player.xp,
      xpNeed: this.player.xpNeed,
      level: this.player.level,
      score: Math.floor(this.score),
      combo: this.combo,
      wave: this.wave,
      time: this.time,
      kills: this.kills,
      muted: this.muted,
      paused: this.paused,
    })
  }

  private update(dt: number) {
    this.time += dt
    this.shake = Math.max(0, this.shake - dt * 8)
    this.waveFlash = Math.max(0, this.waveFlash - dt)
    this.pulseRing = Math.max(0, this.pulseRing - dt * 2.2)
    this.comboT = Math.max(0, this.comboT - dt)
    if (this.comboT <= 0) this.combo = 1

    const nextWave = 1 + Math.floor(this.time / 22)
    if (nextWave !== this.wave) {
      this.wave = nextWave
      this.waveFlash = 1.8
      this.hooks.onWave(this.wave)
    }

    this.movePlayer(dt)
    this.player.hp = clamp(this.player.hp + this.player.regen * dt, 0, this.player.maxHp)
    this.player.pulseCd -= dt
    if (this.player.pulseCd <= 0) this.pulse()

    this.updateMoons(dt)
    this.spawn(dt)
    this.updateEnemies(dt)
    this.updateGems(dt)
    this.updateFx(dt)

    if (this.player.hp <= 0) {
      this.player.hp = 0
      this.paused = true
      this.audio.over()
      this.hooks.onGameOver({
        score: Math.floor(this.score),
        kills: this.kills,
        wave: this.wave,
        time: this.time,
        level: this.player.level,
      })
    }
  }

  private movePlayer(dt: number) {
    const p = this.player
    let ax = 0
    let ay = 0
    if (this.input.pointer.active) {
      ax = this.input.pointer.x - p.x
      ay = this.input.pointer.y - p.y
      const len = Math.hypot(ax, ay)
      if (len < 8) {
        ax = 0
        ay = 0
      } else {
        ax /= len
        ay /= len
      }
    } else {
      const axis = this.input.axis()
      ax = axis.x
      ay = axis.y
    }
    p.vx += (ax * p.speed - p.vx) * Math.min(1, dt * 10)
    p.vy += (ay * p.speed - p.vy) * Math.min(1, dt * 10)
    p.x = clamp(p.x + p.vx * dt, 28, this.w - 28)
    p.y = clamp(p.y + p.vy * dt, 28, this.h - 28)
  }

  private pulse() {
    const p = this.player
    p.pulseCd = p.pulseMax
    this.pulseRing = 1
    this.audio.pulse()
    let hits = 0
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y)
      if (d <= p.aura + enemy.r) {
        const crit = Math.random() < p.crit
        this.hurtEnemy(enemy, p.pulseDmg * (crit ? 2 : 1), crit, hits === 0)
        hits++
      }
    }
    if (hits) this.shake = Math.min(3.2, this.shake + 0.5)
  }

  private updateMoons(dt: number) {
    const p = this.player
    for (const moon of this.moons) {
      moon.angle += dt * 2.4
      const x = p.x + Math.cos(moon.angle) * moon.radius
      const y = p.y + Math.sin(moon.angle) * moon.radius
      for (const enemy of this.enemies) {
        if (Math.hypot(enemy.x - x, enemy.y - y) < enemy.r + 8) {
          this.hurtEnemy(enemy, 20 * dt, false, false)
        }
      }
    }
  }

  private spawn(dt: number) {
    this.spawnAcc -= dt
    const interval = Math.max(0.32, 1.55 - this.wave * 0.12)
    const cap = Math.min(58, 7 + this.wave * 4)
    if (this.spawnAcc > 0 || this.enemies.length >= cap) return
    this.spawnAcc = interval
    const pack = this.wave >= 6 ? 2 : 1
    for (let i = 0; i < pack; i++) this.spawnOne()
  }

  private spawnOne() {
    const roll = Math.random()
    let kind: EnemyKind = 'shade'
    if (this.wave >= 2 && roll < 0.28) kind = 'wraith'
    else if (this.wave >= 3 && roll < 0.46) kind = 'brute'
    else if (this.wave >= 4 && roll < 0.64) kind = 'seeker'

    const angle = rand(0, TAU)
    const dist = Math.max(this.w, this.h) * 0.55 + 50
    const stats = blueprint(kind)
    const scale = 1 + (this.wave - 1) * 0.08
    const enemy: Enemy = {
      id: this.nextId++,
      ...stats,
      hp: stats.hp * scale,
      maxHp: stats.maxHp * scale,
      x: this.w / 2 + Math.cos(angle) * dist,
      y: this.h / 2 + Math.sin(angle) * dist,
    }
    this.enemies.push(enemy)
  }

  private updateEnemies(dt: number) {
    const p = this.player
    for (const enemy of this.enemies) {
      const dx = p.x - enemy.x
      const dy = p.y - enemy.y
      const dist = Math.hypot(dx, dy) || 1
      let speed = enemy.speed
      if (enemy.kind === 'seeker' && dist < 220) speed += 36
      enemy.x += (dx / dist) * speed * dt
      enemy.y += (dy / dist) * speed * dt
      enemy.hitCd = Math.max(0, enemy.hitCd - dt)

      if (dist < p.r + enemy.r - 2 && enemy.hitCd <= 0) {
        const dmg = enemy.dmg * (1 - p.veil)
        p.hp -= dmg
        enemy.hitCd = 0.55
        this.shake = 4
        this.float(p.x, p.y - 18, `-${Math.round(dmg)}`, '#ff8aa0')
        this.burst(p.x, p.y, '#ff6b8a', 10)
        this.audio.hurt()
      }
    }
  }

  private hurtEnemy(enemy: Enemy, dmg: number, crit: boolean, fx = true) {
    enemy.hp -= dmg
    if (fx) {
      this.float(enemy.x, enemy.y - enemy.r, crit ? `${Math.round(dmg)}!` : `${Math.round(dmg)}`, crit ? '#ffe08a' : '#fff0f5')
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: rand(-40, 40),
        vy: rand(-40, 40),
        life: 0.35,
        max: 0.35,
        size: 3,
        color: crit ? '#ffe08a' : '#ffb3c7',
      })
      this.audio.hit()
    }
    if (enemy.hp <= 0) this.kill(enemy)
  }

  private kill(enemy: Enemy) {
    this.enemies = this.enemies.filter((item) => item.id !== enemy.id)
    this.kills += 1
    this.comboT = 1.25
    this.combo = Math.min(9, this.combo + 1)
    this.score += (18 + enemy.xp * 3) * this.combo
    this.gems.push({
      x: enemy.x,
      y: enemy.y,
      vx: rand(-30, 30),
      vy: rand(-30, 30),
      value: enemy.xp,
      life: 8,
    })
    this.burst(enemy.x, enemy.y, '#ffd6e4', 16)
    this.audio.kill()
  }

  private updateGems(dt: number) {
    const p = this.player
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i]
      gem.life -= dt
      const dx = p.x - gem.x
      const dy = p.y - gem.y
      const dist = Math.hypot(dx, dy) || 1
      if (dist < p.magnet) {
        gem.vx += (dx / dist) * 520 * dt
        gem.vy += (dy / dist) * 520 * dt
      } else {
        gem.vx *= 0.96
        gem.vy *= 0.96
      }
      gem.x += gem.vx * dt
      gem.y += gem.vy * dt
      if (dist < p.r + 8 || gem.life <= 0) {
        if (dist < p.r + 18) this.gainXp(gem.value)
        this.gems.splice(i, 1)
      }
    }
  }

  private gainXp(value: number) {
    const p = this.player
    p.xp += value
    this.score += value
    while (p.xp >= p.xpNeed) {
      p.xp -= p.xpNeed
      p.level += 1
      p.xpNeed = nextXpNeed(p.level)
      p.hp = clamp(p.hp + 12, 0, p.maxHp)
      this.choosing = true
      this.paused = true
      this.audio.level()
      this.hooks.onLevelUp(pickUpgrades(3))
    }
  }

  private updateFx(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.life -= dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vx *= 0.96
      particle.vy *= 0.96
      if (particle.life <= 0) this.particles.splice(i, 1)
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const floater = this.floaters[i]
      floater.life -= dt
      floater.y -= 22 * dt
      if (floater.life <= 0) this.floaters.splice(i, 1)
    }
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU)
      const s = rand(30, 160)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(0.25, 0.7),
        max: 0.7,
        size: rand(1.5, 3.6),
        color,
      })
    }
  }

  private float(x: number, y: number, text: string, color: string) {
    this.floaters.push({ x, y, text, life: 0.7, color })
  }

  private draw() {
    const { ctx } = this
    const ox = (Math.random() - 0.5) * this.shake * 2.4
    const oy = (Math.random() - 0.5) * this.shake * 2.4
    ctx.clearRect(0, 0, this.w, this.h)
    ctx.save()
    ctx.translate(ox, oy)

    const bg = ctx.createRadialGradient(this.w * 0.5, this.h * 0.45, 40, this.w * 0.5, this.h * 0.5, Math.max(this.w, this.h) * 0.72)
    bg.addColorStop(0, '#1a1028')
    bg.addColorStop(0.45, '#100816')
    bg.addColorStop(1, '#07040c')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, this.w, this.h)

    for (const star of this.stars) {
      ctx.globalAlpha = star.a * (0.55 + Math.sin(this.time * star.z + star.x) * 0.25)
      ctx.fillStyle = '#fff4f8'
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.z * 0.9, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    this.drawAura()
    for (const gem of this.gems) this.drawGem(gem)
    for (const enemy of this.enemies) this.drawEnemy(enemy)
    this.drawMoons()
    this.drawPlayer()

    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life / particle.max
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    ctx.font = '700 13px Manrope, sans-serif'
    ctx.textAlign = 'center'
    for (const floater of this.floaters) {
      ctx.globalAlpha = clamp(floater.life / 0.7, 0, 1)
      ctx.fillStyle = floater.color
      ctx.fillText(floater.text, floater.x, floater.y)
    }
    ctx.globalAlpha = 1

    const vig = ctx.createRadialGradient(this.w / 2, this.h / 2, this.w * 0.2, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.62)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, this.player.hp < this.player.maxHp * 0.28 ? 'rgba(70,8,22,0.55)' : 'rgba(4,2,8,0.5)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, this.w, this.h)

    ctx.restore()
  }

  private drawAura() {
    const { ctx, player } = this
    const glow = ctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, player.aura)
    glow.addColorStop(0, 'rgba(255,145,164,0.20)')
    glow.addColorStop(0.7, 'rgba(255,145,164,0.06)')
    glow.addColorStop(1, 'rgba(255,145,164,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.aura, 0, TAU)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,180,198,0.28)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.aura, 0, TAU)
    ctx.stroke()

    if (this.pulseRing > 0) {
      ctx.strokeStyle = `rgba(255,232,240,${this.pulseRing * 0.7})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.aura * (1.05 - this.pulseRing * 0.08), 0, TAU)
      ctx.stroke()
    }
  }

  private drawPlayer() {
    const { ctx, player } = this
    ctx.shadowColor = '#ff91a4'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#fff6f8'
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.r, 0, TAU)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ff91a4'
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.r * 0.42, 0, TAU)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,230,236,0.85)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 6; i++) {
      const a = this.time * 1.6 + (i * TAU) / 6
      ctx.beginPath()
      ctx.moveTo(player.x + Math.cos(a) * 7, player.y + Math.sin(a) * 7)
      ctx.lineTo(player.x + Math.cos(a) * 19, player.y + Math.sin(a) * 19)
      ctx.stroke()
    }
  }

  private drawMoons() {
    const { ctx, player } = this
    ctx.fillStyle = '#ffe08a'
    ctx.shadowColor = '#ffe08a'
    ctx.shadowBlur = 10
    for (const moon of this.moons) {
      const x = player.x + Math.cos(moon.angle) * moon.radius
      const y = player.y + Math.sin(moon.angle) * moon.radius
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, TAU)
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  private drawEnemy(enemy: Enemy) {
    const { ctx } = this
    const color = `hsl(${enemy.hue} 72% 68%)`
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.beginPath()
    if (enemy.kind === 'wraith') {
      ctx.moveTo(enemy.x, enemy.y - enemy.r)
      ctx.lineTo(enemy.x + enemy.r, enemy.y)
      ctx.lineTo(enemy.x, enemy.y + enemy.r)
      ctx.lineTo(enemy.x - enemy.r, enemy.y)
      ctx.closePath()
    } else if (enemy.kind === 'brute') {
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 + 0.2
        const x = enemy.x + Math.cos(a) * enemy.r
        const y = enemy.y + Math.sin(a) * enemy.r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    } else if (enemy.kind === 'seeker') {
      const a = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x)
      ctx.moveTo(enemy.x + Math.cos(a) * enemy.r, enemy.y + Math.sin(a) * enemy.r)
      ctx.lineTo(enemy.x + Math.cos(a + 2.4) * enemy.r, enemy.y + Math.sin(a + 2.4) * enemy.r)
      ctx.lineTo(enemy.x + Math.cos(a - 2.4) * enemy.r, enemy.y + Math.sin(a - 2.4) * enemy.r)
      ctx.closePath()
    } else {
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, TAU)
    }
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(8,4,12,0.55)'
    ctx.fillRect(enemy.x - enemy.r, enemy.y + enemy.r + 5, enemy.r * 2, 3)
    ctx.fillStyle = '#ffd1dc'
    ctx.fillRect(enemy.x - enemy.r, enemy.y + enemy.r + 5, enemy.r * 2 * clamp(enemy.hp / enemy.maxHp, 0, 1), 3)
  }

  private drawGem(gem: Gem) {
    const { ctx } = this
    ctx.fillStyle = '#b8f0ff'
    ctx.shadowColor = '#7ee0ff'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(gem.x, gem.y - 5)
    ctx.lineTo(gem.x + 4, gem.y)
    ctx.lineTo(gem.x, gem.y + 5)
    ctx.lineTo(gem.x - 4, gem.y)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
  }
}
