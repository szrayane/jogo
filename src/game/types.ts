import type { Skin } from './skins'

export const VW = 320
export const VH = 180
export const TILE = 16

export type Theme = 'forest' | 'ice' | 'water' | 'city'
export type Mode = 'map' | 'level'

export interface Player {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  facing: 1 | -1
  grounded: boolean
  big: boolean
  invuln: number
  coyote: number
  jumpBuf: number
  jumping: boolean
  airJumps: number
  dead: boolean
  win: number
}

export interface Walker {
  x: number
  y: number
  w: number
  h: number
  dir: 1 | -1
  alive: boolean
  squash: number
}

export interface Item {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  kind: 'fruit'
}

export interface Coin {
  x: number
  y: number
  taken: boolean
  pop: number
}

export interface Block {
  tx: number
  ty: number
  kind: '?' | '!' | 'B'
  used: boolean
  bump: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

export interface LevelDef {
  id: string
  name: string
  theme: Theme
  blurb: string
  time: number
  map: string[]
}

export interface HudState {
  mode: Mode
  coins: number
  lives: number
  score: number
  time: number
  levelName: string
  muted: boolean
  paused: boolean
  mapName: string
  canEnter: boolean
}

export interface ClearStats {
  levelId: string
  levelName: string
  coins: number
  score: number
  timeLeft: number
  last: boolean
}

export interface EngineHooks {
  onHud: (hud: HudState) => void
  onClear: (stats: ClearStats) => void
  onGameOver: (score: number) => void
  onWin: (score: number) => void
}

export type { Skin }
