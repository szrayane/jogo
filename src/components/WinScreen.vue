<script setup lang="ts">
defineProps<{
  score: number
}>()

defineEmits<{
  menu: []
}>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">castelo concluído</p>
      <h2 class="title small">Você chegou</h2>
      <p class="lead">O Castelo Aurora acendeu. Quatro mundos, um platformer só seu. Pontuação: {{ score }}.</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('menu')">Menu</button>
      </div>
    </section>
  </div>
</template>
