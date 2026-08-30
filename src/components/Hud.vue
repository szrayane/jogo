<script setup lang="ts">
import { formatTime } from '../game/scores'
import type { HudState } from '../game/types'

defineProps<{
  hud: HudState
  hint: boolean
}>()

defineEmits<{
  mute: []
  pause: []
}>()
</script>

<template>
  <div class="hud">
    <div class="hud-top">
      <div class="bars">
        <div class="bar hp"><span :style="{ width: `${(hud.hp / hud.maxHp) * 100}%` }" /></div>
        <div class="bar xp"><span :style="{ width: `${(hud.xp / hud.xpNeed) * 100}%` }" /></div>
      </div>
      <div class="stat">
        <strong>{{ hud.score }}</strong>
        onda {{ hud.wave }} · {{ formatTime(hud.time) }}
        <template v-if="hud.combo > 1"> · x{{ hud.combo }}</template>
      </div>
    </div>
    <div class="hud-bottom">
      <p v-if="hint" class="hint">WASD ou arraste · a aura ataca sozinha</p>
      <p v-else-if="hud.paused" class="hint">pausado · espaço para voltar</p>
      <span v-else />
      <div style="display: flex; gap: 8px">
        <button class="icon-btn" type="button" :aria-label="hud.muted ? 'Ativar som' : 'Silenciar'" @click="$emit('mute')">
          {{ hud.muted ? '🔇' : '🔊' }}
        </button>
        <button class="icon-btn" type="button" aria-label="Pausar" @click="$emit('pause')">
          {{ hud.paused ? '▶' : '❚❚' }}
        </button>
      </div>
    </div>
  </div>
</template>
