<script setup lang="ts">
import type { HudState } from '../game/types'

defineProps<{
  hud: HudState
  hint: boolean
}>()

defineEmits<{
  mute: []
  menu: []
  hold: [action: 'left' | 'right' | 'jump' | 'run' | 'enter', down: boolean]
}>()
</script>

<template>
  <div class="hud">
    <div class="hud-top">
      <div class="stat left">
        <strong>Raya</strong>
        <span>x {{ hud.lives }} · {{ hud.coins }} moedas</span>
      </div>
      <div class="stat">
        <strong>{{ hud.mode === 'map' ? hud.mapName : hud.levelName }}</strong>
        <span v-if="hud.mode === 'level'">{{ hud.score }} · {{ hud.time }}s</span>
        <span v-else>mundo aurora</span>
      </div>
    </div>
    <div class="hud-bottom">
      <p v-if="hint && hud.mode === 'level'" class="hint">pule em cima do ? para moeda · pulo duplo no ar</p>
      <p v-else-if="hud.paused" class="hint">pausado</p>
      <p v-else-if="hud.mode === 'map'" class="hint">← → escolhe · enter entra</p>
      <span v-else />
      <div class="icon-row">
        <button class="icon-btn" type="button" :aria-label="hud.muted ? 'Ativar som' : 'Silenciar'" @click="$emit('mute')">
          {{ hud.muted ? '🔇' : '🔊' }}
        </button>
        <button v-if="hud.mode === 'level'" class="icon-btn" type="button" aria-label="Menu" @click="$emit('menu')">
          ☰
        </button>
      </div>
    </div>
    <div class="touch">
      <div class="touch-move">
        <button
          class="pad"
          type="button"
          aria-label="Esquerda"
          @pointerdown.prevent="$emit('hold', 'left', true)"
          @pointerup.prevent="$emit('hold', 'left', false)"
          @pointercancel="$emit('hold', 'left', false)"
          @pointerleave="$emit('hold', 'left', false)"
        >
          ◀
        </button>
        <button
          class="pad"
          type="button"
          aria-label="Direita"
          @pointerdown.prevent="$emit('hold', 'right', true)"
          @pointerup.prevent="$emit('hold', 'right', false)"
          @pointercancel="$emit('hold', 'right', false)"
          @pointerleave="$emit('hold', 'right', false)"
        >
          ▶
        </button>
      </div>
      <div class="touch-act">
        <button
          v-if="hud.mode === 'map'"
          class="pad primary"
          type="button"
          @pointerdown.prevent="$emit('hold', 'enter', true)"
          @pointerup.prevent="$emit('hold', 'enter', false)"
        >
          entrar
        </button>
        <template v-else>
          <button
            class="pad"
            type="button"
            aria-label="Correr"
            @pointerdown.prevent="$emit('hold', 'run', true)"
            @pointerup.prevent="$emit('hold', 'run', false)"
            @pointercancel="$emit('hold', 'run', false)"
            @pointerleave="$emit('hold', 'run', false)"
          >
            B
          </button>
          <button
            class="pad primary"
            type="button"
            aria-label="Pular"
            @pointerdown.prevent="$emit('hold', 'jump', true)"
            @pointerup.prevent="$emit('hold', 'jump', false)"
            @pointercancel="$emit('hold', 'jump', false)"
            @pointerleave="$emit('hold', 'jump', false)"
          >
            A
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
