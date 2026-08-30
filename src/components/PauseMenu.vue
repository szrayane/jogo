<script setup lang="ts">
defineEmits<{
  resume: []
  restart: []
  menu: []
}>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">pausa</p>
      <h2 class="title small">Menu</h2>
      <p class="lead">Voltar ao jogo, recomeçar a fase ou ir ao início.</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('resume')">Continuar</button>
        <button class="btn" type="button" @click="$emit('restart')">Reiniciar</button>
        <button class="btn" type="button" @click="$emit('menu')">Menu inicial</button>
      </div>
    </section>
  </div>
</template>
