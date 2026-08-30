<script setup lang="ts">
import { formatTime, loadScores } from '../game/scores'

defineProps<{
  showHelp: boolean
  showScores: boolean
}>()

defineEmits<{
  play: []
  help: []
  scores: []
}>()

const records = loadScores()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">arcade · vue 3 · typescript</p>
      <h1 class="title">Lúmen</h1>
      <p class="lead">Uma faísca contra a escuridão. Sobreviva às ondas, cresça a aura e quebre o recorde.</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('play')">Jogar</button>
        <button class="btn" type="button" @click="$emit('help')">Como jogar</button>
        <button class="btn" type="button" @click="$emit('scores')">Recordes</button>
      </div>
      <div v-if="showHelp" class="help">
        <p>WASD ou setas para mover. No celular, arraste o dedo.</p>
        <p>A aura ataca sozinha. Colete fragmentos azuis para subir de nível e escolher um eco.</p>
        <p>Espaço pausa. M silencia o som.</p>
      </div>
      <ol v-if="showScores" class="scores">
        <li v-if="!records.length">Nenhuma run ainda. A primeira é sua.</li>
        <li v-for="(row, i) in records" :key="row.date">
          <span>{{ i + 1 }}. {{ row.score }} pts</span>
          <span>onda {{ row.wave }} · {{ formatTime(row.time) }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>
