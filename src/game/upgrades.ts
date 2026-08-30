import type { Player, UpgradeDef } from './types'

function xpNeed(level: number) {
  return 16 + level * 10
}

export function createPlayer(cx: number, cy: number): Player {
  return {
    x: cx,
    y: cy,
    r: 15,
    vx: 0,
    vy: 0,
    speed: 230,
    hp: 100,
    maxHp: 100,
    regen: 0,
    aura: 78,
    pulseCd: 0,
    pulseMax: 0.68,
    pulseDmg: 20,
    crit: 0.08,
    magnet: 86,
    veil: 0,
    satellites: 0,
    xp: 0,
    level: 1,
    xpNeed: xpNeed(1),
  }
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'core',
    name: 'Núcleo quente',
    desc: 'O pulso da aura causa +7 de dano.',
    apply: (p) => {
      p.pulseDmg += 7
    },
  },
  {
    id: 'aura',
    name: 'Aura expandida',
    desc: 'A área de dano cresce +20.',
    apply: (p) => {
      p.aura += 20
    },
  },
  {
    id: 'tempo',
    name: 'Pulso acelerado',
    desc: 'A aura dispara 14% mais rápido.',
    apply: (p) => {
      p.pulseMax = Math.max(0.28, p.pulseMax * 0.86)
    },
  },
  {
    id: 'passos',
    name: 'Passos leves',
    desc: '+22 de velocidade de movimento.',
    apply: (p) => {
      p.speed += 22
    },
  },
  {
    id: 'ima',
    name: 'Ímã estelar',
    desc: 'Puxa fragmentos de luz de mais longe.',
    apply: (p) => {
      p.magnet += 36
    },
  },
  {
    id: 'sat',
    name: 'Satélite',
    desc: 'Uma órbita de luz causa dano ao tocar.',
    apply: (p) => {
      p.satellites = Math.min(4, p.satellites + 1)
    },
  },
  {
    id: 'vita',
    name: 'Vitalidade',
    desc: '+30 de vida máxima e cura imediata.',
    apply: (p) => {
      p.maxHp += 30
      p.hp = Math.min(p.maxHp, p.hp + 30)
    },
  },
  {
    id: 'regen',
    name: 'Regeneração',
    desc: 'Recupera +1.4 de vida por segundo.',
    apply: (p) => {
      p.regen += 1.4
    },
  },
  {
    id: 'veu',
    name: 'Véu',
    desc: 'Reduz 10% do dano recebido.',
    apply: (p) => {
      p.veil = Math.min(0.45, p.veil + 0.1)
    },
  },
  {
    id: 'crit',
    name: 'Clarão',
    desc: '+12% de chance do pulso causar dano duplo.',
    apply: (p) => {
      p.crit = Math.min(0.55, p.crit + 0.12)
    },
  },
]

export function pickUpgrades(count = 3): UpgradeDef[] {
  const pool = [...UPGRADES]
  const picked: UpgradeDef[] = []
  while (picked.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(i, 1)[0])
  }
  return picked
}

export function nextXpNeed(level: number) {
  return xpNeed(level)
}
