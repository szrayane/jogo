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
      <div class="stat left hud-players">
        <svg width="0" height="0" class="hud-defs" aria-hidden="true">
          <defs>
            <linearGradient id="heart-fill" x1="6" y1="3" x2="18" y2="22" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ffd0dc" />
              <stop offset="0.38" stop-color="#ff6b8a" />
              <stop offset="1" stop-color="#c41e4a" />
            </linearGradient>
          </defs>
        </svg>
        <div class="hud-player">
          <strong>Aurora</strong>
          <div class="hud-meters">
            <span class="meter lives">
              <svg class="ico-heart" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="url(#heart-fill)" d="M12 21.3c-.4 0-.8-.12-1.12-.36C6.4 17.7 3.2 14.7 3.2 10.7 3.2 7.7 5.5 5.5 8.4 5.5c1.62 0 3.08.78 4 2.02.92-1.24 2.38-2.02 4-2.02 2.9 0 5.2 2.2 5.2 5.2 0 4-3.2 7-7.68 10.24-.32.24-.72.36-1.12.36Z" />
                <path fill="rgba(255,255,255,0.55)" d="M8.2 7.05c-1.7 0-3.05 1.28-3.05 3.05 0 .28.22.5.5.5s.5-.22.5-.5c0-1.18.88-2.05 2.05-2.05.28 0 .5-.22.5-.5s-.22-.5-.5-.5Z" />
              </svg>
              {{ hud.lives }}
            </span>
            <span class="meter coins">
              <i class="ico-coin" aria-hidden="true" />
              {{ hud.coins }}
            </span>
          </div>
        </div>
        <div v-if="hud.coop" class="hud-player luna">
          <strong>Luna</strong>
          <div class="hud-meters">
            <span class="meter lives">
              <svg class="ico-heart" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="url(#heart-fill)" d="M12 21.3c-.4 0-.8-.12-1.12-.36C6.4 17.7 3.2 14.7 3.2 10.7 3.2 7.7 5.5 5.5 8.4 5.5c1.62 0 3.08.78 4 2.02.92-1.24 2.38-2.02 4-2.02 2.9 0 5.2 2.2 5.2 5.2 0 4-3.2 7-7.68 10.24-.32.24-.72.36-1.12.36Z" />
                <path fill="rgba(255,255,255,0.55)" d="M8.2 7.05c-1.7 0-3.05 1.28-3.05 3.05 0 .28.22.5.5.5s.5-.22.5-.5c0-1.18.88-2.05 2.05-2.05.28 0 .5-.22.5-.5s-.22-.5-.5-.5Z" />
              </svg>
              {{ hud.buddyLives }}
            </span>
            <span class="meter coins">
              <i class="ico-coin" aria-hidden="true" />
              {{ hud.buddyCoins }}
            </span>
          </div>
        </div>
      </div>
      <div class="stat">
        <strong>{{ hud.mode === 'map' ? hud.mapName : hud.levelName }}</strong>
        <span v-if="hud.mode === 'level'">{{ hud.score }} · {{ hud.time }}s</span>
        <span v-else>mundo aurora</span>
      </div>
    </div>
    <div class="hud-bottom">
      <p v-if="hint && hud.mode === 'level' && hud.coop" class="hint">P1 A D espaço · P2 setas K · sobe no ombro da outra pra pular mais alto</p>
      <p v-else-if="hint && hud.mode === 'level'" class="hint">pule em cima do ? para moeda · pulo duplo no ar</p>
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
