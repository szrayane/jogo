export type EnemyKind = 'shade' | 'wraith' | 'brute' | 'seeker'

export interface Vec {
  x: number
  y: number
}

export interface Player {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  speed: number
  hp: number
  maxHp: number
  regen: number
  aura: number
  pulseCd: number
  pulseMax: number
  pulseDmg: number
  crit: number
  magnet: number
  veil: number
  satellites: number
  xp: number
  level: number
  xpNeed: number
}

export interface Enemy {
  id: number
  kind: EnemyKind
  x: number
  y: number
  r: number
  hp: number
  maxHp: number
  speed: number
  dmg: number
  xp: number
  hitCd: number
  hue: number
}

export interface Gem {
  x: number
  y: number
  vx: number
  vy: number
  value: number
  life: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

export interface Floater {
  x: number
  y: number
  text: string
  life: number
  color: string
}

export interface Satellite {
  angle: number
  radius: number
}

export interface HudState {
  hp: number
  maxHp: number
  xp: number
  xpNeed: number
  level: number
  score: number
  combo: number
  wave: number
  time: number
  kills: number
  muted: boolean
  paused: boolean
}

export interface RunStats {
  score: number
  kills: number
  wave: number
  time: number
  level: number
}

export interface ScoreRow {
  score: number
  kills: number
  wave: number
  time: number
  date: string
}

export interface UpgradeDef {
  id: string
  name: string
  desc: string
  apply: (player: Player) => void
}

export interface EngineHooks {
  onHud: (hud: HudState) => void
  onLevelUp: (choices: UpgradeDef[]) => void
  onGameOver: (stats: RunStats) => void
  onWave: (wave: number) => void
}
