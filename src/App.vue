<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import GameOver from './components/GameOver.vue'
import Hud from './components/Hud.vue'
import LevelUp from './components/LevelUp.vue'
import StartScreen from './components/StartScreen.vue'
import { LumenEngine } from './game/engine'
import { loadScores, saveScore } from './game/scores'
import type { HudState, RunStats, ScoreRow, UpgradeDef } from './game/types'

type Screen = 'menu' | 'play' | 'upgrade' | 'over'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const screen = ref<Screen>('menu')
const showHelp = ref(false)
const showScores = ref(false)
const hint = ref(true)
const waveText = ref('')
const choices = ref<UpgradeDef[]>([])
const stats = ref<RunStats | null>(null)
const ranks = ref<ScoreRow[]>(loadScores())
const hud = ref<HudState>({
  hp: 100,
  maxHp: 100,
  xp: 0,
  xpNeed: 26,
  level: 1,
  score: 0,
  combo: 1,
  wave: 1,
  time: 0,
  kills: 0,
  muted: false,
  paused: false,
})

let engine: LumenEngine | null = null
let hintTimer = 0
let waveTimer = 0

const playing = computed(() => screen.value === 'play' || screen.value === 'upgrade' || screen.value === 'over')

function boot() {
  const canvas = canvasRef.value
  if (!canvas) return
  engine?.stop()
  engine = new LumenEngine(canvas, {
    onHud: (next) => {
      hud.value = next
    },
    onLevelUp: (next) => {
      choices.value = next
      screen.value = 'upgrade'
    },
    onGameOver: (run) => {
      stats.value = run
      ranks.value = saveScore({
        score: run.score,
        kills: run.kills,
        wave: run.wave,
        time: run.time,
        date: new Date().toISOString(),
      })
      screen.value = 'over'
    },
    onWave: (wave) => {
      waveText.value = `onda ${wave}`
      window.clearTimeout(waveTimer)
      waveTimer = window.setTimeout(() => {
        waveText.value = ''
      }, 1600)
    },
  })
}

async function preview() {
  await nextTick()
  boot()
  if (!engine) return
  engine.attract = true
  engine.start()
}

function play() {
  boot()
  screen.value = 'play'
  hint.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    hint.value = false
  }, 4200)
  engine?.start()
}

function pick(upgrade: UpgradeDef) {
  engine?.applyUpgrade(upgrade)
  screen.value = 'play'
}

function toggleMute() {
  if (!engine) return
  engine.setMuted(!engine.muted)
  hud.value = { ...hud.value, muted: engine.muted }
}

function togglePause() {
  if (!engine || screen.value !== 'play') return
  engine.paused = !engine.paused
  hud.value = { ...hud.value, paused: engine.paused }
}

function onKey(event: KeyboardEvent) {
  if (event.code === 'KeyM') toggleMute()
  if (event.code === 'Space' || event.code === 'Escape') {
    event.preventDefault()
    togglePause()
  }
}

function onResize() {
  engine?.resize()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  void preview()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  window.clearTimeout(hintTimer)
  window.clearTimeout(waveTimer)
  engine?.stop()
})
</script>

<template>
  <div class="stage">
    <canvas ref="canvasRef" />
    <StartScreen
      v-if="screen === 'menu'"
      :show-help="showHelp"
      :show-scores="showScores"
      @play="play"
      @help="showHelp = !showHelp"
      @scores="showScores = !showScores"
    />
    <Hud
      v-if="playing && screen !== 'over'"
      :hud="hud"
      :hint="hint"
      @mute="toggleMute"
      @pause="togglePause"
    />
    <div v-if="waveText && screen === 'play'" class="wave-banner">{{ waveText }}</div>
    <LevelUp v-if="screen === 'upgrade'" :choices="choices" @pick="pick" />
    <GameOver
      v-if="screen === 'over' && stats"
      :stats="stats"
      :ranks="ranks"
      @again="play"
      @menu="screen = 'menu'; void preview()"
    />
  </div>
</template>
