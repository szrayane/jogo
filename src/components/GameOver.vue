<script setup lang="ts">
import { formatTime } from '../game/scores'
import type { RunStats, ScoreRow } from '../game/types'

const props = defineProps<{
  stats: RunStats
  ranks: ScoreRow[]
}>()

defineEmits<{
  again: []
  menu: []
}>()

async function share() {
  const text = `Joguei Lúmen e fiz ${props.stats.score} pontos na onda ${props.stats.wave} ✨`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    window.prompt('Copie seu resultado:', text)
  }
}
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">a luz apagou</p>
      <h2 class="title" style="font-size: 46px">Fim de run</h2>
      <div class="over-grid">
        <div>
          <small>pontos</small>
          <b>{{ stats.score }}</b>
        </div>
        <div>
          <small>tempo</small>
          <b>{{ formatTime(stats.time) }}</b>
        </div>
        <div>
          <small>ondas</small>
          <b>{{ stats.wave }}</b>
        </div>
        <div>
          <small>baixas</small>
          <b>{{ stats.kills }}</b>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('again')">De novo</button>
        <button class="btn" type="button" @click="share">Copiar resultado</button>
        <button class="btn" type="button" @click="$emit('menu')">Menu</button>
      </div>
      <ol class="scores">
        <li v-for="(row, i) in ranks" :key="row.date">
          <span>{{ i + 1 }}. {{ row.score }} pts</span>
          <span>onda {{ row.wave }} · {{ formatTime(row.time) }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>
