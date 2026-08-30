<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { HAIRS, OUTFITS, drawRaya, type HairId, type OutfitId, type Skin } from '../game/skins'

const props = defineProps<{
  skin: Skin
}>()

const emit = defineEmits<{
  update: [skin: Skin]
  back: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let frame = 0
let time = 0

function paint(next = props.skin) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, 160, 160)
  ctx.fillStyle = '#1a1020'
  ctx.fillRect(0, 0, 160, 160)
  ctx.save()
  ctx.translate(80, 124)
  ctx.scale(4, 4)
  drawRaya(ctx, -6, -16, 1, false, time, true, next)
  ctx.restore()
}

function loop(now: number) {
  time = now / 1000
  paint()
  frame = requestAnimationFrame(loop)
}

function setHair(hair: HairId) {
  emit('update', { ...props.skin, hair })
}

function setOutfit(outfit: OutfitId) {
  emit('update', { ...props.skin, outfit })
}

watch(() => props.skin, (next) => paint(next), { deep: true })

onMounted(() => {
  frame = requestAnimationFrame(loop)
})

onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <div class="overlay scroll">
    <section class="panel wide">
      <p class="brand">visual da aurora</p>
      <h2 class="title small">Looks</h2>
      <div class="looks">
        <canvas ref="canvasRef" width="160" height="160" class="look-canvas" />
        <div>
          <p class="look-label">Cabelo</p>
          <div class="chip-row">
            <button
              v-for="hair in HAIRS"
              :key="hair.id"
              class="chip"
              :class="{ on: skin.hair === hair.id }"
              type="button"
              @click="setHair(hair.id)"
            >
              {{ hair.name }}
            </button>
          </div>
          <p class="look-label">Roupa</p>
          <div class="chip-row">
            <button
              v-for="outfit in OUTFITS"
              :key="outfit.id"
              class="chip"
              :class="{ on: skin.outfit === outfit.id }"
              type="button"
              @click="setOutfit(outfit.id)"
            >
              {{ outfit.name }}
            </button>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" type="button" @click="$emit('back')">Pronto</button>
      </div>
    </section>
  </div>
</template>
