export type HairId = 'bow' | 'long' | 'bun'
export type OutfitId = 'rosa' | 'azul' | 'dourado'

export interface Skin {
  hair: HairId
  outfit: OutfitId
}

export const HAIRS: { id: HairId; name: string }[] = [
  { id: 'bow', name: 'Laço' },
  { id: 'long', name: 'Longo' },
  { id: 'bun', name: 'Coque' },
]

export const OUTFITS: { id: OutfitId; name: string }[] = [
  { id: 'rosa', name: 'Vestido rosa' },
  { id: 'azul', name: 'Vestido azul' },
  { id: 'dourado', name: 'Vestido dourado' },
]

export const DEFAULT_SKIN: Skin = { hair: 'bow', outfit: 'rosa' }

const TAU = Math.PI * 2
const HAIR = '#4a2c1a'
const SKIN = '#ffd4b8'

type DressTone = { main: string; light: string; dark: string; accent: string; trim: string }

const DRESS_FIX: Record<OutfitId, DressTone> = {
  rosa: { main: '#ff8fb3', light: '#ffd0e0', dark: '#e56b90', accent: '#fff4f8', trim: '#ffd24a' },
  azul: { main: '#7eb6ff', light: '#d4e8ff', dark: '#4d8fe0', accent: '#ffffff', trim: '#ffd24a' },
  dourado: { main: '#f0c14a', light: '#ffe9a8', dark: '#d4a01e', accent: '#fff6d0', trim: '#ffffff' },
}

export function normalizeOutfit(value: string | undefined): OutfitId {
  if (value === 'azul') return 'azul'
  if (value === 'dourado' || value === 'gelo' || value === 'cidade' || value === 'noite') return 'dourado'
  return 'rosa'
}

export function normalizeHair(value: string | undefined): HairId {
  if (value === 'long' || value === 'bun' || value === 'bow') return value
  return 'bow'
}

export function drawRaya(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  big: boolean,
  time: number,
  run: boolean,
  skin: Skin,
) {
  const h = big ? 22 : 16
  const w = 12
  const bob = run ? Math.round(Math.sin(time * 12)) : 0
  const step = run ? Math.round(Math.sin(time * 12)) : 0
  const dress = DRESS_FIX[skin.outfit] ?? DRESS_FIX.rosa
  ctx.save()
  ctx.translate(Math.round(x + w / 2), Math.round(y + h + bob))
  ctx.scale(facing, 1)

  if (skin.hair === 'long' || skin.hair === 'bow') drawLongHairBehind(ctx)

  drawDress(ctx, dress, skin.outfit)

  ctx.fillStyle = SKIN
  ctx.fillRect(-3 + step, -4, 2, 3)
  ctx.fillRect(1 - step, -4, 2, 3)
  ctx.fillStyle = dress.dark
  ctx.fillRect(-3 + step, -2, 3, 2)
  ctx.fillRect(1 - step, -2, 3, 2)

  ctx.fillStyle = SKIN
  ctx.fillRect(-6, -12, 2, 5)
  ctx.fillRect(4, -12, 2, 5)

  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.ellipse(0, -17, 5.2, 5.2, 0, 0, TAU)
  ctx.fill()

  drawHair(ctx, skin.hair)

  ctx.fillStyle = '#fff'
  ctx.fillRect(-3, -18, 2, 2)
  ctx.fillRect(1, -18, 2, 2)
  ctx.fillStyle = '#2b1b14'
  ctx.fillRect(-2, -17, 1, 1)
  ctx.fillRect(2, -17, 1, 1)
  ctx.fillStyle = '#ff8aa4'
  ctx.fillRect(-4, -15, 2, 1)
  ctx.fillRect(2, -15, 2, 1)
  ctx.fillStyle = '#c45c78'
  ctx.fillRect(-1, -14, 2, 1)

  ctx.restore()
}

function drawDress(ctx: CanvasRenderingContext2D, dress: DressTone, outfit: OutfitId) {
  ctx.fillStyle = dress.dark
  ctx.beginPath()
  ctx.moveTo(-3, -12)
  ctx.lineTo(3, -12)
  ctx.lineTo(6.4, -3)
  ctx.lineTo(-6.4, -3)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = dress.main
  ctx.beginPath()
  ctx.moveTo(-2.4, -13.2)
  ctx.lineTo(2.4, -13.2)
  ctx.lineTo(5.4, -4)
  ctx.lineTo(-5.4, -4)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = dress.dark
  ctx.fillRect(-1.8, -11, 1, 6.4)
  ctx.fillRect(0.8, -11, 1, 6.4)
  ctx.fillStyle = dress.light
  ctx.fillRect(-0.5, -11, 1, 6.2)

  ctx.fillStyle = dress.light
  ctx.fillRect(-5.2, -4.8, 10.4, 1.3)
  ctx.beginPath()
  ctx.ellipse(-3.8, -3.3, 1.5, 1.1, 0, 0, TAU)
  ctx.ellipse(-1.2, -3.3, 1.5, 1.1, 0, 0, TAU)
  ctx.ellipse(1.2, -3.3, 1.5, 1.1, 0, 0, TAU)
  ctx.ellipse(3.8, -3.3, 1.5, 1.1, 0, 0, TAU)
  ctx.fill()

  ctx.fillStyle = dress.main
  ctx.fillRect(-2.4, -13.4, 4.8, 3.2)
  ctx.fillStyle = dress.light
  ctx.fillRect(-1.6, -13, 3.2, 1.5)

  ctx.fillStyle = dress.dark
  ctx.fillRect(-3.2, -9.4, 6.4, 1.5)
  ctx.fillStyle = dress.trim
  ctx.fillRect(-1, -9.6, 2, 1.8)

  if (outfit === 'rosa') {
    ctx.fillStyle = dress.accent
    ctx.beginPath()
    ctx.ellipse(-1.7, -8.7, 1.5, 0.95, -0.4, 0, TAU)
    ctx.ellipse(1.7, -8.7, 1.5, 0.95, 0.4, 0, TAU)
    ctx.fill()
    ctx.fillStyle = dress.trim
    ctx.beginPath()
    ctx.ellipse(0, -8.7, 0.8, 0.8, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = dress.accent
    ctx.fillRect(-1.6, -13.4, 3.2, 1)
  }

  if (outfit === 'azul') {
    ctx.fillStyle = dress.accent
    ctx.beginPath()
    ctx.moveTo(-3, -13.6)
    ctx.lineTo(0, -11.1)
    ctx.lineTo(3, -13.6)
    ctx.lineTo(1.8, -13.6)
    ctx.lineTo(0, -12.1)
    ctx.lineTo(-1.8, -13.6)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = dress.dark
    ctx.fillRect(-0.5, -12.6, 1, 2.2)
    ctx.fillStyle = dress.trim
    ctx.fillRect(-3.2, -9.2, 6.4, 0.6)
  }

  if (outfit === 'dourado') {
    ctx.fillStyle = dress.accent
    ctx.fillRect(-3, -13.4, 6, 1)
    ctx.fillRect(-5.2, -4.4, 10.4, 0.8)
    ctx.fillStyle = dress.trim
    ctx.fillRect(-0.8, -11.2, 1, 1)
    ctx.fillRect(1.4, -7.2, 1, 1)
    ctx.fillRect(-2.6, -6, 1, 1)
  }
}

function drawLongHairBehind(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#3a2214'
  ctx.beginPath()
  ctx.ellipse(0, -16.5, 6.2, 5.4, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = HAIR
  ctx.beginPath()
  ctx.ellipse(-6.6, -9, 1.6, 7.2, 0.1, 0, TAU)
  ctx.ellipse(6.6, -9, 1.6, 7.2, -0.1, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#3a2214'
  ctx.beginPath()
  ctx.ellipse(-6.8, -8, 1.2, 6.2, 0.1, 0, TAU)
  ctx.ellipse(6.8, -8, 1.2, 6.2, -0.1, 0, TAU)
  ctx.fill()
}

function drawCap(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = HAIR
  ctx.beginPath()
  ctx.ellipse(0, -20, 5.5, 3.4, 0, 0, TAU)
  ctx.fill()
  ctx.fillRect(-5, -19, 2, 5)
  ctx.fillRect(3, -19, 2, 5)
}

function drawHair(ctx: CanvasRenderingContext2D, hair: HairId) {
  drawCap(ctx)

  if (hair === 'long' || hair === 'bow') {
    ctx.fillRect(-6, -20, 2, 5)
    ctx.fillRect(4, -20, 2, 5)
    if (hair === 'bow') drawBow(ctx)
    return
  }

  if (hair === 'bun') {
    ctx.fillStyle = '#3a2214'
    ctx.beginPath()
    ctx.ellipse(0, -25, 3.6, 3.6, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = HAIR
    ctx.beginPath()
    ctx.ellipse(0, -25, 3, 3, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = '#6a4030'
    ctx.fillRect(-3, -23, 6, 1)
    ctx.fillStyle = '#ffe0c2'
    ctx.fillRect(-1, -27, 1, 1)
    return
  }

  drawBow(ctx)
}

function drawBow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#e03d6a'
  ctx.beginPath()
  ctx.ellipse(-3.2, -23.5, 2.1, 1.5, -0.5, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(3.2, -23.5, 2.1, 1.5, 0.5, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#ff7aa0'
  ctx.beginPath()
  ctx.ellipse(-3.2, -23.5, 1.5, 1, -0.5, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(3.2, -23.5, 1.5, 1, 0.5, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#ffd24a'
  ctx.beginPath()
  ctx.ellipse(0, -23.5, 1.1, 1.1, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#e03d6a'
  ctx.beginPath()
  ctx.moveTo(-0.8, -22.4)
  ctx.lineTo(-2, -19.5)
  ctx.lineTo(0, -22)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0.8, -22.4)
  ctx.lineTo(2, -19.5)
  ctx.lineTo(0, -22)
  ctx.fill()
}
