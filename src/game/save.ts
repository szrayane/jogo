import { DEFAULT_SKIN, normalizeHair, normalizeOutfit, type Skin } from './skins'

const KEY = 'aurora-world-v3'

export interface SaveData {
  unlocked: number
  best: number
  skin: Skin
  cleared: string[]
}

function emptySave(): SaveData {
  return { unlocked: 3, best: 0, skin: { ...DEFAULT_SKIN }, cleared: [] }
}

function normalizeCleared(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))]
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('aurora-world-v2') ?? localStorage.getItem('aurora-world-v1')
    if (!raw) return emptySave()
    const data = JSON.parse(raw) as Partial<SaveData>
    return {
      unlocked: 3,
      best: Math.max(0, Number(data.best) || 0),
      skin: {
        hair: normalizeHair(data.skin?.hair),
        outfit: normalizeOutfit(data.skin?.outfit),
      },
      cleared: normalizeCleared(data.cleared),
    }
  } catch {
    return emptySave()
  }
}

export function writeSave(data: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function saveSkin(skin: Skin) {
  const current = loadSave()
  writeSave({ ...current, skin })
}
