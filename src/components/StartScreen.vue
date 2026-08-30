<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { loadSave } from '../game/save'
import { drawRaya } from '../game/skins'

defineProps<{
  showHelp: boolean
}>()

defineEmits<{
  play: []
  looks: []
  help: []
}>()

const save = loadSave()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let frame = 0

function loop(now: number) {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, 140, 150)
    ctx.save()
    ctx.translate(70, 128)
    ctx.fillStyle = 'rgba(255, 210, 74, 0.16)'
    ctx.beginPath()
    ctx.ellipse(0, 6, 22, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.scale(3.4, 3.4)
    drawRaya(ctx, -6, -16, 1, false, now / 1000, true, save.skin)
    ctx.restore()
  }
  frame = requestAnimationFrame(loop)
}

onMounted(() => {
  frame = requestAnimationFrame(loop)
})

onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <div class="overlay home">
    <div class="home-orb orb-a" />
    <div class="home-orb orb-b" />
    <div class="home-orb orb-c" />
    <section class="panel title-card">
      <div class="card-shine" />
      <div class="spark spark-a" />
      <div class="spark spark-b" />
      <div class="spark spark-c" />
      <h1 class="title glow">Aurora<br />World</h1>
      <div class="title-rule" />
      <div class="hero-stage">
        <canvas ref="canvasRef" width="140" height="150" class="hero-preview" />
      </div>
      <div class="actions stack">
        <button class="btn primary wide" type="button" @click="$emit('play')">Jogar</button>
        <button class="btn wide" type="button" @click="$emit('looks')">Looks</button>
        <button class="btn wide" type="button" @click="$emit('help')">Como jogar</button>
      </div>
      <div v-if="showHelp" class="help">
        <p class="help-kicker">como jogar</p>
        <div class="help-grid">
          <article class="help-card">
            <span>1 jogadora</span>
            <p>
              <kbd>A</kbd><kbd>D</kbd> ou <kbd>←</kbd><kbd>→</kbd> anda
            </p>
            <p><kbd>espaço</kbd> <kbd>K</kbd> pula · pulo duplo</p>
          </article>
          <article class="help-card">
            <span>2 jogadoras</span>
            <p>P1 <kbd>A</kbd><kbd>D</kbd><kbd>espaço</kbd></p>
            <p>P2 <kbd>←</kbd><kbd>→</kbd><kbd>K</kbd></p>
            <p>Sobe no ombro da outra pra impulsionar. Se uma cair, a outra puxa.</p>
          </article>
          <article class="help-card wide">
            <span>na fase</span>
            <p>Caixa <em>?</em> solta moeda.<kbd>Esc</kbd> ou ☰ pausa.</p>
          </article>
        </div>
      </div>
      <p v-if="save.best" class="best">melhor pontuação · {{ save.best }}</p>
      <p class="tech">Vue · TypeScript · Vite</p>
    </section>
  </div>
</template>
