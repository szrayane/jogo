import { AudioBus } from './audio'
import { generateLevel } from './generate'
import { Input, type Pad } from './input'
import { LEVELS } from './levels'
import { loadSave, writeSave } from './save'
import { DEFAULT_SKIN, drawRaya, type OutfitId, type Skin } from './skins'
import { TILE, VH, VW, type Block, type ClearStats, type Coin, type EngineHooks, type HudState, type Item, type Mode, type Particle, type Player, type Theme, type Walker } from './types'

const GRAVITY = 980
const JUMP = -340
const JUMP_CUT = 0.48
const MAX_FALL = 420
const WALK = 92
const RUN = 148
const ACCEL = 520
const AIR_ACCEL = 380
const FRICTION = 640
const COYOTE = 0.09
const BUFFER = 0.11

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function isSolid(cell: string) {
  return cell === '=' || cell === '#' || cell === 'T' || cell === 'I' || cell === '?' || cell === '!' || cell === 'B' || cell === 'U'
}

function isOneWay(cell: string) {
  return cell === '-'
}

function isHazard(cell: string) {
  return cell === '*'
}

function isWater(cell: string) {
  return cell === '~'
}

export class WorldEngine {
  paused = false
  muted = false
  readonly input = new Input()
  readonly audio = new AudioBus()

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private hooks: EngineHooks
  private running = false
  private frame = 0
  private last = 0
  private hudAcc = 0
  private scale = 1
  private ox = 0
  private oy = 0
  private viewW = 0
  private viewH = 0

  private mode: Mode = 'map'
  private node = 0
  private unlocked = 0
  private lives = 5
  private coins = 0
  private buddyLives = 5
  private buddyCoins = 0
  private score = 0
  private timeLeft = 240
  private theme: Theme = 'forest'
  private skin: Skin = { ...DEFAULT_SKIN }
  private levelName = ''
  private levelId = ''
  private cols = 0
  private rows = 0
  private grid: string[][] = []
  private player!: Player
  private buddy: Player | null = null
  private coop = false
  private spawn = { x: 32, y: 32 }
  private walkers: Walker[] = []
  private coinsWorld: Coin[] = []
  private blocks: Block[] = []
  private items: Item[] = []
  private particles: Particle[] = []
  private pops: { x: number; y: number; vy: number; life: number }[] = []
  private goal = { x: 0, y: 0, w: 12, h: 48 }
  private camX = 0
  private camY = 0
  private tickTime = 0
  private deathTimer = 0
  private clearSent = false

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponível')
    this.canvas = canvas
    this.ctx = ctx
    this.hooks = hooks
    const save = loadSave()
    this.unlocked = save.unlocked
    this.skin = { ...save.skin }
    this.input.attach()
    this.resize()
    this.openMap()
  }

  setSkin(skin: Skin) {
    this.skin = { ...skin }
  }

  setCoop(on: boolean) {
    this.coop = on
  }

  restartLevel() {
    this.enterLevel(this.node, this.coop)
  }

  leaveLevel() {
    this.openMap()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.audio.unlock()
    this.frame = requestAnimationFrame(this.loop)
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

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.viewW = this.canvas.clientWidth
    this.viewH = this.canvas.clientHeight
    this.canvas.width = Math.floor(this.viewW * dpr)
    this.canvas.height = Math.floor(this.viewH * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.scale = Math.max(1, Math.floor(Math.min(this.viewW / VW, this.viewH / VH)))
    this.ox = Math.floor((this.viewW - VW * this.scale) / 2)
    this.oy = Math.floor((this.viewH - VH * this.scale) / 2)
  }

  private loop = (now: number) => {
    if (!this.running) return
    const dt = Math.min((now - this.last) / 1000, 0.033)
    this.last = now
    this.input.beginFrame(this.coop)
    if (!this.paused) this.update(dt)
    this.draw()
    this.hudAcc += dt
    if (this.hudAcc > 0.1) {
      this.hudAcc = 0
      this.emitHud()
    }
    this.frame = requestAnimationFrame(this.loop)
  }

  private emitHud() {
    const hud: HudState = {
      mode: this.mode,
      coins: this.coins,
      lives: this.lives,
      buddyCoins: this.buddyCoins,
      buddyLives: this.buddyLives,
      score: this.score,
      time: Math.max(0, Math.ceil(this.timeLeft)),
      levelName: this.levelName,
      muted: this.muted,
      paused: this.paused,
      mapName: this.levelName || 'Aurora',
      canEnter: false,
      coop: this.coop,
    }
    this.hooks.onHud(hud)
  }

  private update(dt: number) {
    this.tickTime += dt
    if (this.mode === 'map') return
    if (this.player.win > 0) {
      this.player.win += dt
      this.player.vx = 0
      this.player.vy = Math.min(MAX_FALL, this.player.vy + GRAVITY * dt)
      this.moveY(this.player, this.player.vy * dt)
      this.snapToGround(this.player)
      if (this.buddy) {
        this.buddy.vx = 0
        this.buddy.vy = Math.min(MAX_FALL, this.buddy.vy + GRAVITY * dt)
        this.moveY(this.buddy, this.buddy.vy * dt)
        this.snapToGround(this.buddy)
      }
      this.followCamera(dt)
      this.updateParticles(dt)
      if (this.player.win > 0.7 && !this.clearSent) this.finishLevel()
      return
    }
    if (this.player.dead && (!this.buddy || this.buddy.dead)) {
      for (const p of this.actors()) {
        p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt)
        p.y += p.vy * dt
      }
      this.updateParticles(dt)
      this.deathTimer -= dt
      if (this.deathTimer <= 0) this.respawn()
      return
    }

    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.killPlayer()
      return
    }

    this.updatePlayer(this.player, this.input.p1, dt)
    if (this.buddy && !this.buddy.dead) this.updatePlayer(this.buddy, this.input.p2, dt)
    this.resolveBuddy()
    this.updateWalkers(dt)
    this.updateItems(dt)
    this.updateParticles(dt)
    this.collideActors()
    this.checkFalls()
    if (!this.player.dead) this.followCamera(dt)
    this.checkGoal()
  }

  private openMap() {
    this.mode = 'map'
    this.paused = false
    this.clearSent = false
    this.emitHud()
  }

  enterLevel(index: number, coop = this.coop) {
    const base = LEVELS[index]
    if (!base) return
    const def = base.procedural ? generateLevel((Date.now() ^ (Math.random() * 1e9)) >>> 0) : base
    this.coop = coop
    this.mode = 'level'
    this.node = index
    this.theme = def.theme
    this.levelName = def.name
    this.levelId = base.id
    this.timeLeft = def.time
    this.clearSent = false
    this.particles = []
    this.pops = []
    this.items = []
    this.deathTimer = 0
    this.parse(def.map)
    this.camX = 0
    this.camY = 0
    this.paused = false
  }

  private parse(map: string[]) {
    this.rows = map.length
    this.cols = map[0].length
    this.grid = map.map((row) => row.split(''))
    this.walkers = []
    this.coinsWorld = []
    this.blocks = []
    this.spawn = { x: TILE * 2, y: TILE * 8 }
    this.goal = { x: (this.cols - 3) * TILE, y: (this.rows - 6) * TILE, w: 12, h: 64 }

    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const cell = this.grid[ty][tx]
        const x = tx * TILE
        const y = ty * TILE
        if (cell === 'p') {
          this.spawn = { x, y }
          this.grid[ty][tx] = '.'
        } else if (cell === 'e') {
          this.walkers.push({ x, y: y + 4, w: 14, h: 12, dir: -1, alive: true, squash: 0 })
          this.grid[ty][tx] = '.'
        } else if (cell === 'o') {
          this.coinsWorld.push({ x: x + 2, y: y + 6, taken: false, pop: 0 })
          this.grid[ty][tx] = '.'
        } else if (cell === 'g') {
          this.goal = { x: x + 2, y: y - 20, w: 10, h: 36 }
          this.grid[ty][tx] = '.'
        } else if (cell === '?' || cell === '!' || cell === 'B') {
          this.blocks.push({ tx, ty, kind: cell, used: false, bump: 0 })
        }
      }
    }
    this.resetPlayer()
  }

  private makeActor(x: number, y: number): Player {
    return {
      x,
      y,
      w: 12,
      h: 16,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      big: false,
      invuln: 0,
      coyote: 0,
      jumpBuf: 0,
      jumping: false,
      airJumps: 1,
      dead: false,
      win: 0,
      onBuddy: false,
    }
  }

  private resetPlayer() {
    this.player = this.makeActor(this.spawn.x, this.spawn.y)
    this.buddy = this.coop ? this.makeActor(this.spawn.x + 14, this.spawn.y) : null
  }

  private actors() {
    return this.buddy ? [this.player, this.buddy] : [this.player]
  }

  private sizePlayer(p = this.player) {
    const was = p.h
    p.w = 12
    p.h = p.big ? 22 : 16
    p.y += was - p.h
  }

  private updatePlayer(p: Player, pad: Pad, dt: number) {
    if (p.dead) return
    const wet = this.inWater(p)
    const icy = this.theme === 'ice'
    const fromBuddy = p.onBuddy
    p.invuln = Math.max(0, p.invuln - dt)
    p.coyote = p.grounded ? COYOTE : Math.max(0, p.coyote - dt)
    if (pad.jump) p.jumpBuf = BUFFER
    else p.jumpBuf = Math.max(0, p.jumpBuf - dt)

    const max = (pad.run ? RUN : WALK) * (wet ? 0.78 : 1)
    const accel = p.grounded ? (icy ? 260 : ACCEL) : AIR_ACCEL
    if (pad.left) {
      p.vx -= accel * dt
      p.facing = -1
    } else if (pad.right) {
      p.vx += accel * dt
      p.facing = 1
    } else if (p.grounded) {
      const drag = icy ? 120 : FRICTION
      const friction = Math.min(Math.abs(p.vx), drag * dt)
      p.vx += p.vx > 0 ? -friction : friction
    }
    p.vx = clamp(p.vx, -max, max)

    if (p.jumpBuf > 0 && p.coyote > 0) {
      const boost = fromBuddy ? 1.38 : 1
      p.vy = (wet ? JUMP * 0.72 : JUMP) * boost
      p.onBuddy = false
      p.grounded = false
      p.coyote = 0
      p.jumpBuf = 0
      p.jumping = true
      this.audio.jump()
    } else if (p.jumpBuf > 0 && p.airJumps > 0) {
      p.vy = JUMP * (wet ? 0.7 : 0.94)
      p.airJumps -= 1
      p.jumpBuf = 0
      p.jumping = true
      p.grounded = false
      this.audio.jump()
      this.puff(p.x + p.w / 2, p.y + p.h, '#ffe08a', 6)
    }
    if (p.jumping && !pad.jumpHeld && p.vy < 0) {
      p.vy *= JUMP_CUT
      p.jumping = false
    }
    if (p.vy > 0) p.jumping = false

    const grav = wet ? 480 : GRAVITY
    p.vy = Math.min(wet ? 170 : MAX_FALL, p.vy + grav * dt)

    const dx = p.vx * dt
    const dy = p.vy * dt
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2.4))
    p.grounded = false
    const goingUp = p.vy < 0
    for (let i = 0; i < steps; i++) {
      this.moveX(p, dx / steps)
      this.moveY(p, dy / steps)
    }
    this.snapToGround(p)
    if (p.grounded) {
      p.airJumps = 1
      this.bumpTilesUnder(p)
    }
    if (goingUp) {
      const hx = Math.floor((p.x + p.w / 2) / TILE)
      const hy = Math.floor((p.y - 1) / TILE)
      this.bumpAt(hx, hy, p)
    }
  }

  private inWater(p = this.player) {
    return isWater(this.cell(Math.floor((p.x + p.w / 2) / TILE), Math.floor((p.y + p.h * 0.6) / TILE)))
  }

  private snapToGround(p = this.player) {
    if (p.vy < -16) return
    const probe = p.y + p.h + 3
    if (this.standable(p.x + 3, probe, p.y + p.h) || this.standable(p.x + p.w - 3, probe, p.y + p.h)) {
      const ty = Math.floor(probe / TILE)
      p.y = ty * TILE - p.h
      p.vy = 0
      p.grounded = true
    }
  }

  private standable(px: number, py: number, prevBottom: number) {
    const tx = Math.floor(px / TILE)
    const ty = Math.floor(py / TILE)
    const cell = this.cell(tx, ty)
    if (isSolid(cell)) return true
    return isOneWay(cell) && prevBottom <= ty * TILE + 3
  }

  private bumpTilesUnder(p: Player) {
    const ty = Math.floor((p.y + p.h + 1) / TILE)
    const x0 = Math.floor((p.x + 2) / TILE)
    const x1 = Math.floor((p.x + p.w - 2) / TILE)
    for (let tx = x0; tx <= x1; tx++) this.bumpAt(tx, ty, p)
  }

  private moveX(body: { x: number; y: number; w: number; h: number; vx?: number }, dx: number) {
    if (!dx) return
    body.x += dx
    const hits = this.solidsAt(body.x, body.y, body.w, body.h, false)
    for (const hit of hits) {
      if (dx > 0) body.x = Math.min(body.x, hit.x - body.w)
      else body.x = Math.max(body.x, hit.x + hit.w)
      if (body.vx !== undefined) body.vx = 0
    }
    body.x = clamp(body.x, 0, this.cols * TILE - body.w)
  }

  private moveY(body: { x: number; y: number; w: number; h: number; vy?: number }, dy: number) {
    if (!dy) return
    const prevBottom = body.y + body.h
    body.y += dy
    const hits = this.solidsAt(body.x, body.y, body.w, body.h, dy > 0, prevBottom)
    for (const hit of hits) {
      if (dy > 0) {
        body.y = Math.min(body.y, hit.y - body.h)
        if (body.vy !== undefined) body.vy = 0
        if (this.isActor(body)) body.grounded = true
      } else {
        const overlapL = body.x + body.w - hit.x
        const overlapR = hit.x + hit.w - body.x
        if (this.isActor(body) && overlapL > 0 && overlapL < 5) {
          body.x = hit.x - body.w
        } else if (this.isActor(body) && overlapR > 0 && overlapR < 5) {
          body.x = hit.x + hit.w
        } else {
          body.y = Math.max(body.y, hit.y + hit.h)
          if (body.vy !== undefined) body.vy = 0
          if (this.isActor(body)) this.bumpAt(hit.tx, hit.ty, body)
        }
      }
    }
  }

  private solidsAt(x: number, y: number, w: number, h: number, down: boolean, prevBottom = y + h) {
    const x0 = Math.floor(x / TILE)
    const y0 = Math.floor(y / TILE)
    const x1 = Math.floor((x + w - 0.001) / TILE)
    const y1 = Math.floor((y + h - 0.001) / TILE)
    const out: { x: number; y: number; w: number; h: number; tx: number; ty: number }[] = []
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const cell = this.cell(tx, ty)
        if (isSolid(cell)) out.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE, tx, ty })
        else if (down && isOneWay(cell) && prevBottom <= ty * TILE + 2) {
          out.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE, tx, ty })
        }
      }
    }
    return out
  }

  private cell(tx: number, ty: number) {
    if (tx < 0 || tx >= this.cols) return '#'
    if (ty < 0 || ty >= this.rows) return '.'
    return this.grid[ty][tx]
  }

  private bumpAt(tx: number, ty: number, who?: Player) {
    const block = this.blocks.find((item) => item.tx === tx && item.ty === ty)
    if (!block || block.used) return
    block.used = true
    block.bump = 1
    this.audio.bump()
    if (block.kind === 'B') {
      if (this.player.big) {
        this.grid[ty][tx] = '.'
        this.puff(tx * TILE + 8, ty * TILE + 8, '#c48a58', 10)
        this.score += 10
      } else {
        block.used = false
      }
      return
    }
    this.grid[ty][tx] = 'U'
    if (block.kind === '!') {
      this.items.push({ x: tx * TILE + 1, y: ty * TILE - 18, w: 14, h: 14, vx: 36, vy: -90, kind: 'fruit' })
      this.audio.power()
      this.puff(tx * TILE + 8, ty * TILE, '#ff91a4', 8)
    } else {
      this.spawnCoinPop(tx * TILE + 4, ty * TILE - 6, who)
    }
  }

  private spawnCoinPop(x: number, y: number, who?: Player) {
    const buddy = who === this.buddy
    if (buddy) this.buddyCoins += 1
    else this.coins += 1
    this.score += 100
    this.audio.coin()
    this.pops.push({ x, y, vy: -70, life: 0.85 })
    this.puff(x + 4, y + 4, '#ffd24a', 8)
    if (buddy && this.buddyCoins >= 100) {
      this.buddyCoins -= 100
      this.buddyLives += 1
    } else if (!buddy && this.coins >= 100) {
      this.coins -= 100
      this.lives += 1
    }
  }

  private updateWalkers(dt: number) {
    for (const enemy of this.walkers) {
      if (!enemy.alive) {
        enemy.squash = Math.max(0, enemy.squash - dt)
        continue
      }
      enemy.x += enemy.dir * 28 * dt
      const ahead = this.cell(Math.floor((enemy.x + (enemy.dir > 0 ? enemy.w + 1 : -1)) / TILE), Math.floor((enemy.y + enemy.h + 2) / TILE))
      const wall = this.cell(Math.floor((enemy.x + (enemy.dir > 0 ? enemy.w + 1 : -1)) / TILE), Math.floor((enemy.y + 4) / TILE))
      if ((!isSolid(ahead) && !isOneWay(ahead)) || isSolid(wall)) enemy.dir = enemy.dir === 1 ? -1 : 1
      const hits = this.solidsAt(enemy.x, enemy.y, enemy.w, enemy.h, false)
      for (const hit of hits) {
        if (enemy.dir > 0) enemy.x = hit.x - enemy.w
        else enemy.x = hit.x + hit.w
        enemy.dir = enemy.dir === 1 ? -1 : 1
      }
    }
  }

  private updateItems(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      item.vy += GRAVITY * dt
      this.moveX(item, item.vx * dt)
      this.moveY(item, item.vy * dt)
      const who = this.actors().find((actor) => !actor.dead && overlaps(actor, item))
      if (who) {
        this.items.splice(i, 1)
        if (!who.big) {
          who.big = true
          this.sizePlayer(who)
        }
        this.score += 200
        this.audio.power()
      }
    }
  }

  private updateParticles(dt: number) {
    for (const coin of this.coinsWorld) {
      if (coin.taken && coin.pop > 0) coin.pop -= dt * 1.4
    }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const pop = this.pops[i]
      pop.life -= dt
      pop.y += pop.vy * dt
      pop.vy += 140 * dt
      if (pop.life <= 0) this.pops.splice(i, 1)
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.life -= dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vy += 220 * dt
      if (particle.life <= 0) this.particles.splice(i, 1)
    }
    for (const block of this.blocks) block.bump = Math.max(0, block.bump - dt * 6)
  }

  private isActor(body: object): body is Player {
    return body === this.player || body === this.buddy
  }

  private resolveBuddy() {
    const a = this.player
    const b = this.buddy
    if (!b || a.dead || b.dead || this.fallingOff(a) || this.fallingOff(b)) return
    a.onBuddy = false
    b.onBuddy = false
    this.tryStandOn(a, b)
    this.tryStandOn(b, a)
    if (a.onBuddy && b.vy < -40) {
      a.vy = JUMP * 1.12
      a.grounded = false
      a.onBuddy = false
    } else if (b.onBuddy && a.vy < -40) {
      b.vy = JUMP * 1.12
      b.grounded = false
      b.onBuddy = false
    }
  }

  private tryStandOn(top: Player, base: Player) {
    if (top.vy < -20) return
    const overlapX = Math.min(top.x + top.w, base.x + base.w) - Math.max(top.x, base.x)
    if (overlapX < 4) return
    const topBottom = top.y + top.h
    if (topBottom < base.y - 4 || topBottom > base.y + 8) return
    top.y = base.y - top.h
    top.vy = 0
    top.grounded = true
    top.onBuddy = true
    top.airJumps = 1
  }

  private collideActors() {
    for (const p of this.actors()) {
      if (p.dead) continue
      for (const coin of this.coinsWorld) {
        if (!coin.taken && overlaps(p, { x: coin.x - 2, y: coin.y - 6, w: 18, h: 20 })) {
          coin.taken = true
          coin.pop = 0
          this.spawnCoinPop(coin.x, coin.y, p)
        }
      }

      const feet = { x: p.x + 2, y: p.y + p.h - 4, w: p.w - 4, h: 6 }
      for (const enemy of this.walkers) {
        if (!enemy.alive) continue
        if (!overlaps(p, enemy)) continue
        if (p.vy > 40 && feet.y <= enemy.y + 6) {
          enemy.alive = false
          enemy.squash = 0.35
          p.vy = JUMP * 0.62
          p.grounded = false
          p.invuln = 0.12
          this.score += 200
          this.audio.stomp()
          this.puff(enemy.x + 7, enemy.y + 6, '#d8a06a', 8)
        } else if (p.invuln <= 0) {
          this.hurt(p)
        }
      }

      const x0 = Math.floor(p.x / TILE)
      const y0 = Math.floor(p.y / TILE)
      const x1 = Math.floor((p.x + p.w - 1) / TILE)
      const y1 = Math.floor((p.y + p.h - 1) / TILE)
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (isHazard(this.cell(tx, ty))) this.rescueOrKill(p)
        }
      }
    }
  }

  private hurt(p: Player) {
    if (p.big) {
      p.big = false
      this.sizePlayer(p)
      p.invuln = 1.4
      this.audio.hurt()
      return
    }
    this.rescueOrKill(p)
  }

  private inPit(p: Player) {
    return p.y > this.rows * TILE
  }

  private fallingOff(p: Player) {
    return !p.dead && (this.inPit(p) || (!p.grounded && p.vy > 50 && p.y + p.h > (this.rows - 1) * TILE))
  }

  private canRescueTo(p: Player) {
    return !p.dead && p.grounded && !this.fallingOff(p) && p.y < this.rows * TILE - 16
  }

  private checkFalls() {
    const living = this.actors().filter((p) => !p.dead)
    if (!living.length) return
    if (living.length > 1 && living.every((p) => this.fallingOff(p))) {
      this.killPlayer(true)
      return
    }
    const fallen = living.filter((p) => p.y > this.rows * TILE + 12)
    if (!fallen.length) return
    const safe = living.find((p) => this.canRescueTo(p))
    if (safe) {
      for (const p of fallen) this.rescue(p, safe)
      return
    }
    this.killPlayer(true)
  }

  private checkGoal() {
    if (this.clearSent || this.player.dead) return
    const at = (p: Player) => !p.dead && overlaps(p, this.goal)
    const ready = this.coop && this.buddy ? at(this.player) && at(this.buddy) : at(this.player)
    if (!ready) return
    this.player.win = 0.01
    this.player.vx = 0
    this.player.vy = 0
    this.snapToGround(this.player)
    if (this.buddy) {
      this.buddy.vx = 0
      this.buddy.vy = 0
      this.snapToGround(this.buddy)
    }
    this.audio.clear()
  }

  private rescueOrKill(p: Player) {
    const other = this.actors().find((actor) => actor !== p && this.canRescueTo(actor))
    if (other) {
      this.rescue(p, other)
      return
    }
    this.killPlayer(false)
  }

  private rescue(p: Player, safe: Player) {
    p.x = safe.x
    p.y = safe.y - p.h - 2
    p.vx = 0
    p.vy = 0
    p.invuln = 1.1
    this.puff(p.x + 6, p.y + 8, '#9ad7ff', 10)
  }

  private killPlayer(fromPit = false) {
    if (this.player.dead && (!this.buddy || this.buddy.dead)) return
    for (const p of this.actors()) {
      p.dead = true
      p.vx = 0
      p.vy = fromPit ? Math.max(p.vy, 80) : -80
    }
    this.lives -= 1
    if (this.coop) this.buddyLives -= 1
    this.deathTimer = fromPit ? 0.28 : 0.7
    this.audio.die()
    this.puff(this.player.x + 6, this.player.y + 8, '#ff91a4', 16)
  }

  private respawn() {
    if (this.lives <= 0 || (this.coop && this.buddyLives <= 0)) {
      this.hooks.onGameOver(this.score)
      this.lives = 5
      this.coins = 0
      this.buddyLives = 5
      this.buddyCoins = 0
      this.openMap()
      return
    }
    this.enterLevel(this.node, this.coop)
  }

  private finishLevel() {
    this.clearSent = true
    this.paused = true
    const next = this.node + 1
    this.unlocked = Math.max(this.unlocked, next)
    const save = loadSave()
    writeSave({
      ...save,
      unlocked: this.unlocked,
      best: Math.max(save.best, this.score),
      cleared: save.cleared.includes(this.levelId) ? save.cleared : [...save.cleared, this.levelId],
    })
    const timeLeft = Math.max(0, Math.floor(this.timeLeft))
    this.score += timeLeft * 10
    const story = LEVELS.filter((level) => !level.procedural)
    const lastStory = story[story.length - 1]
    const stats: ClearStats = {
      levelId: this.levelId,
      levelName: this.levelName,
      coins: this.coins + this.buddyCoins,
      score: this.score,
      timeLeft,
      last: this.levelId === lastStory?.id,
    }
    if (stats.last) this.hooks.onWin(this.score)
    else this.hooks.onClear(stats)
  }

  private followCamera(dt: number) {
    const focus = this.buddy && !this.buddy.dead
      ? { x: (this.player.x + this.buddy.x) / 2, y: (this.player.y + this.buddy.y) / 2, facing: this.player.facing }
      : this.player
    const look = focus.facing * 28
    const targetX = focus.x - VW * 0.38 + look
    const targetY = focus.y - VH * 0.55
    this.camX += (targetX - this.camX) * Math.min(1, dt * 6)
    this.camY += (targetY - this.camY) * Math.min(1, dt * 5)
    this.camX = clamp(this.camX, 0, Math.max(0, this.cols * TILE - VW))
    this.camY = clamp(this.camY, 0, Math.max(0, this.rows * TILE - VH))
  }

  private puff(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 20 + Math.random() * 70
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 20,
        life: 0.35 + Math.random() * 0.25,
        max: 0.6,
        color,
        size: 1.2 + Math.random() * 1.8,
      })
    }
  }

  private draw() {
    const { ctx } = this
    ctx.fillStyle = '#120814'
    ctx.fillRect(0, 0, this.viewW, this.viewH)
    ctx.save()
    ctx.translate(this.ox, this.oy)
    ctx.scale(this.scale, this.scale)
    ctx.imageSmoothingEnabled = false
    ctx.beginPath()
    ctx.rect(0, 0, VW, VH)
    ctx.clip()

    if (this.mode === 'map') this.drawMap()
    else this.drawLevel()

    ctx.restore()
  }

  private drawMap() {
    const { ctx } = this
    const sky = ctx.createLinearGradient(0, 0, 0, 110)
    sky.addColorStop(0, '#5eb6e8')
    sky.addColorStop(0.55, '#b8e4f4')
    sky.addColorStop(1, '#ffe2b0')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VW, VH)

    ctx.fillStyle = '#f8d56a'
    ctx.beginPath()
    ctx.arc(278, 28, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(248,213,106,0.28)'
    ctx.beginPath()
    ctx.arc(278, 28, 22, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#7eb3c9'
    ctx.beginPath()
    ctx.moveTo(0, 92)
    ctx.lineTo(48, 58)
    ctx.lineTo(86, 88)
    ctx.lineTo(130, 50)
    ctx.lineTo(176, 90)
    ctx.lineTo(230, 46)
    ctx.lineTo(280, 86)
    ctx.lineTo(320, 62)
    ctx.lineTo(320, 110)
    ctx.lineTo(0, 110)
    ctx.fill()
    ctx.fillStyle = '#f4f7fb'
    ctx.beginPath()
    ctx.moveTo(48, 58)
    ctx.lineTo(58, 70)
    ctx.lineTo(38, 70)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(130, 50)
    ctx.lineTo(140, 64)
    ctx.lineTo(120, 64)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(230, 46)
    ctx.lineTo(241, 60)
    ctx.lineTo(219, 60)
    ctx.fill()

    ctx.fillStyle = '#6fce6a'
    ctx.fillRect(0, 104, VW, 76)
    ctx.fillStyle = '#5bb85a'
    ctx.fillRect(0, 148, VW, 32)
    this.drawCloud(36 + Math.sin(this.tickTime * 0.3) * 4, 26, 1)
    this.drawCloud(168, 18, 1.15)
    this.drawCloud(250 + Math.sin(this.tickTime * 0.25) * 3, 36, 0.85)

    this.drawTree(22, 108)
    this.drawTree(88, 102)
    this.drawTree(198, 100)
    this.drawBush(40, 132)
    this.drawBush(170, 128)
    this.drawBush(300, 134)
    this.drawFlower(70, 140, '#ff91a4')
    this.drawFlower(112, 146, '#ffd24a')
    this.drawFlower(214, 142, '#ff91a4')
    this.drawFlower(268, 148, '#c9a6ff')

    ctx.fillStyle = '#6ec8e0'
    ctx.beginPath()
    ctx.ellipse(118, 158, 28, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8fe0ee'
    ctx.beginPath()
    ctx.ellipse(112, 156, 10, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    drawRaya(ctx, 152, 118, 1, false, this.tickTime, true, this.skin)
  }

  private drawTree(x: number, y: number) {
    const { ctx } = this
    ctx.fillStyle = '#8a5530'
    ctx.fillRect(x + 5, y + 10, 5, 14)
    ctx.fillStyle = '#3fa35a'
    ctx.beginPath()
    ctx.arc(x + 7, y + 8, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#56c46a'
    ctx.beginPath()
    ctx.arc(x + 3, y + 10, 6, 0, Math.PI * 2)
    ctx.arc(x + 12, y + 9, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawBush(x: number, y: number) {
    const { ctx } = this
    ctx.fillStyle = '#3fa35a'
    ctx.beginPath()
    ctx.arc(x + 6, y + 8, 7, 0, Math.PI * 2)
    ctx.arc(x + 14, y + 8, 8, 0, Math.PI * 2)
    ctx.arc(x + 10, y + 4, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawFlower(x: number, y: number, color: string) {
    const { ctx } = this
    ctx.fillStyle = '#3fa35a'
    ctx.fillRect(x + 2, y, 2, 6)
    ctx.fillStyle = color
    ctx.fillRect(x, y - 2, 6, 4)
    ctx.fillStyle = '#ffe08a'
    ctx.fillRect(x + 2, y - 1, 2, 2)
  }

  private drawLevel() {
    const { ctx } = this
    this.drawSky()
    const par = this.camX * 0.22
    if (this.theme === 'city') this.drawCity(par)
    else if (this.theme === 'ice') this.drawIceMountains(par)
    else if (this.theme === 'forest') this.drawPinkGrove(par)
    else {
      this.drawHills(0, '#4a9aaa', 132, par)
      this.drawHills(0.15, '#2f7a88', 150, par * 1.15)
      this.drawHills(0.3, '#1f5c6a', 166, par * 1.35)
    }
    this.drawCloud(70 - par * 0.4, 24, 1)
    this.drawCloud(210 - par * 0.35, 36, 1.15)
    this.drawWeather()

    const x0 = Math.max(0, Math.floor(this.camX / TILE) - 1)
    const y0 = Math.max(0, Math.floor(this.camY / TILE) - 1)
    const x1 = Math.min(this.cols - 1, Math.floor((this.camX + VW) / TILE) + 1)
    const y1 = Math.min(this.rows - 1, Math.floor((this.camY + VH) / TILE) + 1)
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) this.drawTile(tx, ty)
    }

    this.drawGoal()
    for (const coin of this.coinsWorld) {
      if (coin.taken) continue
      this.drawCoin(coin.x - this.camX, coin.y - this.camY, 1, coin.x)
    }
    for (const pop of this.pops) {
      this.drawCoin(pop.x - this.camX, pop.y - this.camY, Math.max(0.3, pop.life * 1.4), pop.x)
    }
    for (const item of this.items) this.drawFruit(item.x - this.camX, item.y - this.camY)
    for (const enemy of this.walkers) {
      if (!enemy.alive && enemy.squash <= 0) continue
      this.drawWalker(enemy)
    }
    this.drawActor(this.player, this.skin)
    if (this.buddy) this.drawActor(this.buddy, this.buddySkin())
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life / particle.max
      ctx.fillStyle = particle.color
      ctx.fillRect(particle.x - this.camX, particle.y - this.camY, particle.size, particle.size)
    }
    ctx.globalAlpha = 1
  }

  private buddySkin(): Skin {
    const outfit: OutfitId = this.skin.outfit === 'azul' ? 'rosa' : 'azul'
    return { ...this.skin, outfit }
  }

  private drawActor(p: Player, skin: Skin) {
    if (p.dead && Math.sin(this.tickTime * 30) <= 0) return
    if (p.invuln > 0 && Math.floor(this.tickTime * 16) % 2 !== 0) return
    drawRaya(
      this.ctx,
      p.x - this.camX,
      p.y - this.camY,
      p.facing,
      p.big,
      this.tickTime,
      p.grounded && Math.abs(p.vx) > 20,
      skin,
    )
  }

  private drawSky() {
    const { ctx } = this
    const sky = ctx.createLinearGradient(0, 0, 0, VH)
    if (this.theme === 'ice') {
      sky.addColorStop(0, '#8ec4e8')
      sky.addColorStop(0.45, '#d4ecfa')
      sky.addColorStop(1, '#eef6fc')
    } else if (this.theme === 'water') {
      sky.addColorStop(0, '#3a9ec8')
      sky.addColorStop(0.5, '#7ecce0')
      sky.addColorStop(1, '#c8eef0')
    } else if (this.theme === 'city') {
      sky.addColorStop(0, '#0c1024')
      sky.addColorStop(0.55, '#1c1838')
      sky.addColorStop(1, '#3a2850')
    } else {
      sky.addColorStop(0, '#7ec8f0')
      sky.addColorStop(0.4, '#b8e0c8')
      sky.addColorStop(1, '#d8e8a8')
    }
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VW, VH)
    if (this.theme === 'city') {
      ctx.fillStyle = '#fff6c8'
      for (let i = 0; i < 28; i++) {
        ctx.globalAlpha = 0.35 + ((i * 17) % 5) * 0.1
        ctx.fillRect((i * 37 + 11) % VW, 8 + (i * 13) % 70, 1, 1)
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#f0e0b0'
      ctx.beginPath()
      ctx.arc(268, 22, 8, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = this.theme === 'ice' ? '#fff6d8' : '#ffe08a'
      ctx.beginPath()
      ctx.arc(this.theme === 'water' ? 52 : 268, 22, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 230, 140, 0.22)'
      ctx.beginPath()
      ctx.arc(this.theme === 'water' ? 52 : 268, 22, 20, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawCity(scroll: number) {
    const { ctx } = this
    const ground = 168
    const far = [
      { x: 0, w: 40, h: 48, c: '#1a1630' },
      { x: 44, w: 28, h: 70, c: '#181428' },
      { x: 80, w: 50, h: 40, c: '#1c1834' },
      { x: 140, w: 36, h: 62, c: '#16122a' },
      { x: 190, w: 46, h: 52, c: '#1a1630' },
      { x: 248, w: 32, h: 76, c: '#181428' },
    ]
    for (const b of far) {
      const x = ((b.x - scroll * 0.25) % (VW + 50)) - 16
      ctx.fillStyle = b.c
      ctx.fillRect(x, ground - b.h, b.w, b.h)
    }
    const near = [
      { x: 8, w: 36, h: 78, win: '#ffd24a' },
      { x: 50, w: 26, h: 104, win: '#7ee0ff' },
      { x: 82, w: 40, h: 64, win: '#ff91a4' },
      { x: 128, w: 32, h: 94, win: '#c8f0a8' },
      { x: 168, w: 48, h: 80, win: '#b8f0ff' },
      { x: 224, w: 28, h: 110, win: '#ffb3c4' },
      { x: 258, w: 42, h: 70, win: '#ffd24a' },
    ]
    for (const building of near) {
      const x = ((building.x - scroll * 0.55) % (VW + 60)) - 20
      ctx.fillStyle = '#16121f'
      ctx.fillRect(x + 3, ground - building.h + 5, building.w, building.h)
      ctx.fillStyle = '#2c2740'
      ctx.fillRect(x, ground - building.h, building.w, building.h)
      ctx.fillStyle = '#3a3454'
      ctx.fillRect(x, ground - building.h, building.w, 4)
      ctx.fillStyle = building.win
      for (let wy = 10; wy < building.h - 12; wy += 9) {
        for (let wx = 4; wx < building.w - 6; wx += 8) {
          ctx.globalAlpha = 0.45 + ((wx + wy) % 12) * 0.04
          ctx.fillRect(x + wx, ground - building.h + wy, 3, 4)
        }
      }
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = '#121018'
    ctx.fillRect(0, ground, VW, VH - ground)
    ctx.fillStyle = '#2a2438'
    ctx.fillRect(0, ground, VW, 3)
  }

  private drawIceMountains(scroll: number) {
    const { ctx } = this
    const back = [
      { x: -10, h: 70, w: 90, c: '#8aadc4' },
      { x: 70, h: 96, w: 110, c: '#7fa0b8' },
      { x: 170, h: 64, w: 86, c: '#8aadc4' },
      { x: 250, h: 88, w: 100, c: '#7a98b0' },
    ]
    for (const peak of back) {
      const x = peak.x - scroll * 0.28
      ctx.fillStyle = peak.c
      ctx.beginPath()
      ctx.moveTo(x, 176)
      ctx.lineTo(x + peak.w * 0.35, 176 - peak.h * 0.7)
      ctx.lineTo(x + peak.w * 0.55, 176 - peak.h)
      ctx.lineTo(x + peak.w, 176)
      ctx.fill()
    }
    const front = [
      { x: 20, h: 92, w: 78 },
      { x: 100, h: 118, w: 96 },
      { x: 190, h: 80, w: 72 },
      { x: 255, h: 108, w: 90 },
    ]
    for (const peak of front) {
      const x = peak.x - scroll * 0.5
      ctx.fillStyle = '#b4d0e0'
      ctx.beginPath()
      ctx.moveTo(x, 176)
      ctx.lineTo(x + peak.w * 0.48, 176 - peak.h)
      ctx.lineTo(x + peak.w, 176)
      ctx.fill()
      ctx.fillStyle = '#f4fbff'
      ctx.beginPath()
      ctx.moveTo(x + peak.w * 0.48, 176 - peak.h)
      ctx.lineTo(x + peak.w * 0.48 + 14, 176 - peak.h + 24)
      ctx.lineTo(x + peak.w * 0.48 - 10, 176 - peak.h + 18)
      ctx.lineTo(x + peak.w * 0.48 - 4, 176 - peak.h + 28)
      ctx.closePath()
      ctx.fill()
    }
    this.drawHills(0.2, '#dceaf2', 156, scroll * 0.7)
  }

  private drawPinkGrove(scroll: number) {
    const { ctx } = this
    this.drawHills(0.05, '#8fbe7a', 128, scroll * 0.35)
    this.drawHills(0.22, '#6fa05c', 148, scroll * 0.7)
    this.drawHills(0.4, '#5a8a48', 164, scroll)
    const trees = [10, 42, 78, 118, 156, 198, 236, 278]
    for (let i = 0; i < trees.length; i++) {
      const x = ((trees[i] - scroll * 0.85) % (VW + 50)) - 16
      const tall = 20 + (i % 3) * 5
      ctx.fillStyle = '#5a3820'
      ctx.fillRect(x + 7, 168 - tall, 4, tall)
      ctx.fillStyle = '#2f7a3c'
      ctx.beginPath()
      ctx.arc(x + 9, 168 - tall, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#4aa85a'
      ctx.beginPath()
      ctx.arc(x + 4, 170 - tall, 7, 0, Math.PI * 2)
      ctx.arc(x + 14, 169 - tall, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ff9bb8'
      ctx.fillRect(x + 5, 166 - tall, 2, 2)
      ctx.fillRect(x + 12, 164 - tall, 2, 2)
    }
  }

  private drawWeather() {
    const { ctx } = this
    if (this.theme === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      for (let i = 0; i < 22; i++) {
        const x = ((i * 41 + this.tickTime * 18) % (VW + 16)) - 8
        const y = ((i * 23 + this.tickTime * 28) % (VH + 10)) - 4
        ctx.fillRect(x, y, 1.4, 1.4)
      }
    } else if (this.theme === 'forest') {
      ctx.fillStyle = 'rgba(80,140,70,0.45)'
      for (let i = 0; i < 10; i++) {
        const x = ((i * 53 + this.tickTime * 12) % (VW + 20)) - 8
        const y = 40 + ((i * 29 + this.tickTime * 8) % 90)
        ctx.fillRect(x, y, 2, 1)
      }
    } else if (this.theme === 'water') {
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      for (let i = 0; i < 8; i++) {
        const x = ((i * 61 + this.tickTime * 6) % (VW + 30)) - 10
        ctx.fillRect(x, 150 + Math.sin(this.tickTime * 2 + i) * 3, 10, 1)
      }
    }
  }

  private drawHills(shift: number, color: string, base: number, scroll = 0) {
    const { ctx } = this
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(-40, VH)
    for (let x = -40; x <= VW + 40; x += 12) {
      const y = base + Math.sin((x + scroll) * 0.03 + shift) * 10 + Math.sin((x + scroll) * 0.01 + shift) * 8
      ctx.lineTo(x, y)
    }
    ctx.lineTo(VW + 40, VH)
    ctx.closePath()
    ctx.fill()
  }

  private drawCloud(x: number, y: number, s: number) {
    const { ctx } = this
    ctx.fillStyle = this.theme === 'city' ? 'rgba(255,180,220,0.2)' : 'rgba(255,255,255,0.86)'
    ctx.beginPath()
    ctx.ellipse(x, y, 16 * s, 8 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(x + 12 * s, y + 2, 12 * s, 7 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(x - 11 * s, y + 2, 11 * s, 6 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private speck(tx: number, ty: number) {
    return (tx * 13 + ty * 7) & 7
  }

  private drawTile(tx: number, ty: number) {
    const cell = this.grid[ty][tx]
    const block = this.blocks.find((item) => item.tx === tx && item.ty === ty)
    const bump = block ? Math.sin(block.bump * Math.PI) * 3 : 0
    const x = tx * TILE - this.camX
    const y = ty * TILE - this.camY - bump
    const { ctx } = this
    if (cell === '.') return
    if (cell === '=' || cell === '#') {
      this.drawGround(tx, ty, x, y, cell === '=')
    } else if (cell === '-') {
      ctx.fillStyle = '#6a4220'
      ctx.fillRect(x, y, TILE, 6)
      ctx.fillStyle = '#c48a48'
      ctx.fillRect(x, y, TILE, 4)
      ctx.fillStyle = '#e0b06a'
      ctx.fillRect(x, y, TILE, 1)
      ctx.fillStyle = '#8a5a30'
      ctx.fillRect(x + 5, y + 1, 1, 3)
      ctx.fillRect(x + 11, y + 1, 1, 3)
    } else if (cell === '?' || cell === '!' || cell === 'U') {
      ctx.fillStyle = '#5a3010'
      ctx.fillRect(x, y, TILE, TILE)
      ctx.fillStyle = cell === 'U' ? '#8a6840' : '#f0b83a'
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
      ctx.fillStyle = cell === 'U' ? '#6a4e30' : '#ffe08a'
      ctx.fillRect(x + 2, y + 2, 5, 2)
      if (cell !== 'U') {
        ctx.fillStyle = '#7a4d1e'
        ctx.fillRect(x + 6, y + 5, 4, 6)
        ctx.fillRect(x + 7, y + 4, 2, 8)
        ctx.fillStyle = '#fff3b0'
        ctx.fillRect(x + 7, y + 5, 2, 3)
      }
    } else if (cell === 'B') {
      ctx.fillStyle = '#8a4e2c'
      ctx.fillRect(x, y, TILE, TILE)
      ctx.fillStyle = '#d08958'
      ctx.fillRect(x + 1, y + 1, 14, 6)
      ctx.fillRect(x + 1, y + 9, 14, 6)
      ctx.fillStyle = '#e0a878'
      ctx.fillRect(x + 2, y + 2, 5, 2)
    } else if (cell === 'T' || cell === 'I') {
      ctx.fillStyle = '#1e6a38'
      ctx.fillRect(x, y, TILE, TILE)
      ctx.fillStyle = '#3cb86a'
      ctx.fillRect(x + 2, y, 12, TILE)
      ctx.fillStyle = '#2a8f50'
      ctx.fillRect(x + 3, y, 2, TILE)
      ctx.fillRect(x + 11, y, 2, TILE)
      ctx.fillStyle = '#8fe0a8'
      ctx.fillRect(x + 6, y + 2, 1, TILE - 4)
      if (cell === 'T') {
        ctx.fillStyle = '#1e6a38'
        ctx.fillRect(x - 3, y, TILE + 6, 7)
        ctx.fillStyle = '#46d07a'
        ctx.fillRect(x - 2, y, TILE + 4, 5)
      }
    } else if (cell === '*') {
      ctx.fillStyle = '#6a2030'
      ctx.beginPath()
      ctx.moveTo(x + 2, y + 15)
      ctx.lineTo(x + 8, y + 2)
      ctx.lineTo(x + 14, y + 15)
      ctx.fill()
      ctx.fillStyle = '#d24b5c'
      ctx.beginPath()
      ctx.moveTo(x + 4, y + 15)
      ctx.lineTo(x + 8, y + 5)
      ctx.lineTo(x + 12, y + 15)
      ctx.fill()
    } else if (cell === '~') {
      ctx.fillStyle = '#1a6a88'
      ctx.fillRect(x, y, TILE, TILE)
      ctx.fillStyle = 'rgba(70, 180, 220, 0.55)'
      ctx.fillRect(x, y, TILE, TILE)
      ctx.fillStyle = 'rgba(200, 250, 255, 0.4)'
      ctx.fillRect(x, y + (Math.floor(this.tickTime * 5 + tx) % 5), TILE, 2)
    }
  }

  private drawGround(tx: number, ty: number, x: number, y: number, surface: boolean) {
    const { ctx } = this
    const n = this.speck(tx, ty)
    const leftOpen = !isSolid(this.cell(tx - 1, ty))
    const rightOpen = !isSolid(this.cell(tx + 1, ty))
    let body = '#6e4530'
    let shade = '#4a2e1c'
    let cap = '#4a9a42'
    let light = '#6fc45a'
    if (this.theme === 'ice') {
      body = surface ? '#c8dff0' : '#9eb8cc'
      shade = '#7a98b0'
      cap = '#f4fbff'
      light = '#ffffff'
    } else if (this.theme === 'water') {
      body = '#c4a06a'
      shade = '#8a6a40'
      cap = '#3cb86a'
      light = '#6fd080'
    } else if (this.theme === 'city') {
      body = '#4a4a56'
      shade = '#2e2e38'
      cap = '#8a8a96'
      light = '#c0c0cc'
    }
    ctx.fillStyle = body
    ctx.fillRect(x, y, TILE, TILE)
    ctx.fillStyle = shade
    ctx.fillRect(x + 2 + (n % 5), y + 6 + (n % 4), 3, 2)
    ctx.fillRect(x + 8 - (n % 3), y + 11, 4, 2)
    if (leftOpen && isSolid(this.cell(tx, ty + 1))) ctx.fillRect(x, y, 2, TILE)
    if (rightOpen && isSolid(this.cell(tx, ty + 1))) ctx.fillRect(x + 14, y, 2, TILE)
    if (surface) {
      ctx.fillStyle = cap
      ctx.fillRect(x, y, TILE, 5)
      ctx.fillStyle = light
      ctx.fillRect(x, y, TILE, 2)
      if (this.theme === 'forest' || this.theme === 'water') {
        ctx.fillStyle = light
        ctx.fillRect(x + 3, y - 2, 2, 3)
        ctx.fillRect(x + 9, y - 1, 2, 2)
        if (n > 4) ctx.fillRect(x + 6, y - 2, 1, 2)
      } else if (this.theme === 'ice') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x + 4, y + 1, 2, 1)
        ctx.fillRect(x + 11, y + 3, 1, 1)
      }
    } else if (this.theme === 'city') {
      ctx.fillStyle = shade
      ctx.fillRect(x, y + 7, TILE, 1)
    }
  }

  private drawCoin(x: number, y: number, scale = 1, phase = 0) {
    const { ctx } = this
    const bob = Math.sin(this.tickTime * 5.2 + phase * 0.08) * 1.4
    const spin = 0.22 + Math.abs(Math.sin(this.tickTime * 4.4 + phase * 0.12)) * 0.78
    const cx = x + 6 * scale
    const cy = y + 7 * scale + bob
    const rx = 5.4 * scale * spin
    const ry = 6.8 * scale

    ctx.fillStyle = 'rgba(255, 210, 74, 0.28)'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 1, rx + 3.2, ry + 2.2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#a86a12'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 0.6, rx + 1.15, ry + 0.9, 0, 0, Math.PI * 2)
    ctx.fill()

    const face = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 0.4, cx, cy, ry)
    face.addColorStop(0, '#fff6c4')
    face.addColorStop(0.35, '#ffd24a')
    face.addColorStop(0.78, '#f0a028')
    face.addColorStop(1, '#c47816')
    ctx.fillStyle = face
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()

    if (spin > 0.42) {
      ctx.strokeStyle = 'rgba(176, 96, 18, 0.45)'
      ctx.lineWidth = Math.max(0.7, scale)
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * 0.58, ry * 0.58, 0, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#fff8d8'
      const arm = 1.6 * scale * spin
      ctx.beginPath()
      ctx.moveTo(cx, cy - arm * 1.6)
      ctx.lineTo(cx + arm * 0.45, cy)
      ctx.lineTo(cx, cy + arm * 1.6)
      ctx.lineTo(cx - arm * 0.45, cy)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.beginPath()
      ctx.ellipse(cx - rx * 0.28, cy - ry * 0.32, rx * 0.18, ry * 0.14, -0.4, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = '#ffe08a'
      ctx.fillRect(cx - 0.6 * scale, cy - ry * 0.7, 1.2 * scale, ry * 1.4)
    }
  }

  private drawFruit(x: number, y: number) {
    const { ctx } = this
    ctx.fillStyle = '#ff7fa3'
    ctx.beginPath()
    ctx.ellipse(x + 7, y + 8, 6, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5dbe55'
    ctx.fillRect(x + 6, y + 1, 2, 4)
  }

  private drawWalker(enemy: Walker) {
    const { ctx } = this
    const x = enemy.x - this.camX
    const y = enemy.y - this.camY + (enemy.alive ? 0 : 7)
    const h = enemy.alive ? 13 : 5
    ctx.fillStyle = '#8a4c28'
    ctx.fillRect(x + 2, y + 3, 11, h - 2)
    ctx.fillStyle = '#c9844a'
    ctx.fillRect(x + 1, y + 2, 13, h - 4)
    ctx.fillStyle = '#e8b07a'
    ctx.fillRect(x + 3, y + 3, 9, 4)
    if (enemy.alive) {
      ctx.fillStyle = '#2b1b14'
      ctx.fillRect(x + 4, y + 5, 2, 2)
      ctx.fillRect(x + 9, y + 5, 2, 2)
      ctx.fillStyle = '#fff'
      ctx.fillRect(x + 4, y + 5, 1, 1)
      ctx.fillRect(x + 9, y + 5, 1, 1)
      const step = Math.floor(this.tickTime * 8) % 2
      ctx.fillStyle = '#6a3820'
      ctx.fillRect(x + 2 + step, y + 11, 3, 2)
      ctx.fillRect(x + 9 - step, y + 11, 3, 2)
    }
  }

  private drawGoal() {
    const { ctx } = this
    const x = this.goal.x - this.camX + 4
    const y = this.goal.y - this.camY
    ctx.fillStyle = '#f4e2b0'
    ctx.fillRect(x, y, 3, 56)
    ctx.fillStyle = '#ffd24a'
    ctx.beginPath()
    ctx.moveTo(x + 3, y + 4)
    ctx.lineTo(x + 16, y + 10)
    ctx.lineTo(x + 3, y + 16)
    ctx.fill()
  }

  private drawCastle(x: number, y: number) {
    const { ctx } = this
    ctx.fillStyle = '#8d4d66'
    ctx.fillRect(x + 2, y + 10, 22, 20)
    ctx.fillStyle = '#c86b84'
    ctx.fillRect(x, y + 8, 8, 22)
    ctx.fillRect(x + 18, y + 8, 8, 22)
    ctx.fillRect(x + 8, y + 14, 10, 16)
    ctx.fillStyle = '#6b334c'
    ctx.fillRect(x, y + 6, 8, 3)
    ctx.fillRect(x + 18, y + 6, 8, 3)
    ctx.fillStyle = '#3a2418'
    ctx.fillRect(x + 11, y + 20, 6, 10)
    ctx.fillStyle = '#ffd24a'
    ctx.fillRect(x + 4, y + 14, 3, 3)
    ctx.fillRect(x + 21, y + 14, 3, 3)
    ctx.fillStyle = '#ff6b8a'
    ctx.fillRect(x + 13, y, 2, 8)
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.moveTo(x + 15, y)
    ctx.lineTo(x + 22, y + 3)
    ctx.lineTo(x + 15, y + 6)
    ctx.fill()
  }
}
