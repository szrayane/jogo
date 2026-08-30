<script setup lang="ts">
import type { ClearStats } from '../game/types'

defineProps<{
  stats: ClearStats
}>()

defineEmits<{
  next: []
}>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">fase concluída</p>
      <h2 class="title small">{{ stats.levelName }}</h2>
      <div class="over-grid">
        <div>
          <small>pontos</small>
          <b>{{ stats.score }}</b>
        </div>
        <div>
          <small>tempo extra</small>
          <b>{{ stats.timeLeft }}s</b>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('next')">Escolher mapa</button>
      </div>
    </section>
  </div>
</template>
