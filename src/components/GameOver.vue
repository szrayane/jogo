<script setup lang="ts">
defineProps<{
  score: number
}>()

defineEmits<{
  again: []
  menu: []
}>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">vidas esgotadas</p>
      <h2 class="title small">Fim de jogo</h2>
      <p class="lead">A aurora espera de novo. Sua pontuação: {{ score }}.</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('again')">Tentar de novo</button>
        <button class="btn" type="button" @click="$emit('menu')">Menu</button>
      </div>
    </section>
  </div>
</template>
