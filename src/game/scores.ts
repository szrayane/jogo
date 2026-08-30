import type { ScoreRow } from './types'

const KEY = 'lumen-scores-v1'

export function loadScores(): ScoreRow[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScoreRow[]
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  } catch {
    return []
  }
}

export function saveScore(row: ScoreRow): ScoreRow[] {
  const next = [...loadScores(), row].sort((a, b) => b.score - a.score).slice(0, 5)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
