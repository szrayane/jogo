import type { LevelDef, Theme } from './types'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (Math.imul(a ^ (a >>> 15), 1 | a) + Math.imul(a ^ (a >>> 7), 61 | a)) >>> 0
    return a / 4294967296
  }
}

function pick<T>(rand: () => number, list: T[]) {
  return list[Math.floor(rand() * list.length)]
}

function blank(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array(cols).fill('.'))
}

function put(grid: string[][], row: number, col: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    if (row >= 0 && row < grid.length && col + i >= 0 && col + i < grid[0].length) {
      grid[row][col + i] = text[i]
    }
  }
}

function fill(grid: string[][], row: number, from: number, to: number, ch: string) {
  const start = Math.max(0, from)
  const end = Math.min(grid[0].length, to)
  for (let c = start; c < end; c++) grid[row][c] = ch
}

function island(grid: string[][], ground: number, from: number, to: number) {
  fill(grid, ground, from, to, '=')
  fill(grid, ground + 1, from, to, '#')
}

export interface BuildOpts {
  seed: number
  theme: Theme
  id: string
  name: string
  blurb: string
  time: number
  zigzags?: number
  climb?: number
  cols?: number
  procedural?: boolean
}

export function buildLevel(opts: BuildOpts): LevelDef {
  const rand = rng(opts.seed || 1)
  const rows = 21
  const cols = opts.cols ?? 128 + Math.floor(rand() * 16)
  const grid = blank(rows, cols)
  const ground = rows - 2
  const water = opts.theme === 'water'
  const zigCount = opts.zigzags ?? 3 + Math.floor(rand() * 2)
  const climb = Math.max(2, Math.min(3, opts.climb ?? 2))
  const padW = 3 + Math.floor(rand() * 2)

  const startW = 12 + Math.floor(rand() * 3)
  island(grid, ground, 0, startW)
  put(grid, ground - 1, 1, 'p')
  if (rand() > 0.45) put(grid, ground - 1, Math.min(6, startW - 3), 'e')

  let cursor = startW
  for (let z = 0; z < zigCount; z++) {
    const gap = (opts.theme === 'ice' ? 6 : 5) + Math.floor(rand() * 2)
    const startLeft = z % 2 === 0
    const left = cursor + 2
    const right = left + gap
    const last = z === zigCount - 1

    for (let i = 0; i < climb; i++) {
      const row = ground - 2 - i * 2
      const onLeft = startLeft ? i % 2 === 0 : i % 2 === 1
      const col = onLeft ? left : right
      put(grid, row, col, '='.repeat(padW))
      if (i === climb - 1) put(grid, row - 1, col + 1, 'o')
    }

    const downCol = right + padW + 1
    put(grid, ground - 2, downCol, '='.repeat(padW))
    if (z === 0) put(grid, ground - 3, left, '?')
    if (z === 1 && opts.theme === 'city') put(grid, ground - 3, right, '!')
    if (z === 2 && rand() > 0.5) put(grid, ground - 3, downCol, 'o')

    const landFrom = downCol + padW + 2
    const landW = last ? cols - landFrom : 8 + Math.floor(rand() * 4)
    const landTo = Math.min(cols, landFrom + landW)
    island(grid, ground, landFrom, landTo)
    if (!last && rand() > 0.5) put(grid, ground - 1, landFrom + 2, 'e')
    if (!last && rand() > 0.45) put(grid, ground - 1, landFrom + 4, 'o')
    cursor = landTo
  }

  if (water) {
    for (let c = 0; c < cols; c++) {
      if (grid[ground][c] === '.') {
        grid[ground][c] = '~'
        grid[ground + 1][c] = '~'
      }
    }
  }

  put(grid, ground - 1, cols - 4, 'g')
  put(grid, ground - 1, Math.max(cursor - 8, cols - 12), 'o.o')

  return {
    id: opts.id,
    name: opts.name,
    theme: opts.theme,
    blurb: opts.blurb,
    time: opts.time,
    map: grid.map((row) => row.join('')),
    procedural: opts.procedural,
  }
}

export function generateLevel(seed: number): LevelDef {
  const rand = rng(seed || 1)
  const theme = pick(rand, ['forest', 'ice', 'water', 'city'] as Theme[])
  const code = 100 + (seed >>> 0) % 900
  return buildLevel({
    seed,
    theme,
    id: 'random',
    name: `Vão ${code}`,
    blurb: 'Gerada agora. Nunca se repete.',
    time: 250 + Math.floor(rand() * 30),
    zigzags: 3 + Math.floor(rand() * 2),
    climb: 2,
    procedural: true,
  })
}
