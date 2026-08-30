<script setup lang="ts">
import type { UpgradeDef } from '../game/types'

defineProps<{
  choices: UpgradeDef[]
}>()

defineEmits<{
  pick: [upgrade: UpgradeDef]
}>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <p class="brand">nível seguinte</p>
      <h2 class="title" style="font-size: 40px">Escolha um eco</h2>
      <p class="lead">A luz lembra o que você pega. Cada run fica diferente.</p>
      <div class="level-grid">
        <button v-for="item in choices" :key="item.id" class="card" type="button" @click="$emit('pick', item)">
          <strong>{{ item.name }}</strong>
          <span>{{ item.desc }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
