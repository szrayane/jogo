<script setup lang="ts">
import { ref } from 'vue'
import { LEVELS } from '../game/levels'
import { loadSave } from '../game/save'

defineEmits<{
  pick: [payload: { index: number; coop: boolean }]
  back: []
}>()

const coop = ref(false)

const themes: Record<string, string> = {
  forest: 'Floresta',
  ice: 'Gelo',
  water: 'Aquático',
  city: 'Cidade',
}

const cleared = new Set(loadSave().cleared)
const doneCount = LEVELS.filter((level) => cleared.has(level.id)).length
</script>

<template>
  <div class="overlay scroll maps-home">
    <div class="home-orb orb-a" />
    <div class="home-orb orb-b" />
    <section class="panel wide maps-panel">
      <div class="card-shine" />
      <header class="maps-head">
        <p class="brand">aurora world</p>
        <h2 class="title small">Mapas</h2>
        <p class="lead">Quatro mundos e um vão que o jogo monta na hora.</p>
        <p class="maps-progress">{{ doneCount }} / {{ LEVELS.length }} concluídos</p>
        <div class="coop-row" role="group" aria-label="Modo">
          <button class="coop-btn" :class="{ on: !coop }" type="button" @click="coop = false">1 jogadora</button>
          <button class="coop-btn" :class="{ on: coop }" type="button" @click="coop = true">2 jogadoras</button>
        </div>
        <p v-if="coop" class="coop-hint">P1: A D e espaço · P2: setas e K · sobe no ombro da outra</p>
      </header>
      <div class="map-grid">
        <button
          v-for="(level, i) in LEVELS"
          :key="level.id"
          class="map-card"
          :class="[level.theme, { done: cleared.has(level.id), wild: level.procedural }]"
          type="button"
          @click="$emit('pick', { index: i, coop })"
        >
          <div class="map-art" aria-hidden="true">
            <i class="art-sun" />
            <i class="art-far" />
            <i class="art-mid" />
            <i class="art-near" />
          </div>
          <div class="map-meta">
            <small>{{ String(i + 1).padStart(2, '0') }} · {{ level.procedural ? 'Gerada' : themes[level.theme] }}</small>
            <strong>{{ level.name }}</strong>
            <span>{{ level.blurb }}</span>
          </div>
          <em v-if="cleared.has(level.id)" class="map-check" aria-label="concluído">✓</em>
          <em v-else class="map-go">entrar</em>
        </button>
      </div>
      <div class="actions">
        <button class="btn" type="button" @click="$emit('back')">Voltar</button>
      </div>
    </section>
  </div>
</template>
