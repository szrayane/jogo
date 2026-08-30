<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Customize from './components/Customize.vue'
import PauseMenu from './components/PauseMenu.vue'
import GameOver from './components/GameOver.vue'
import Hud from './components/Hud.vue'
import LevelClear from './components/LevelClear.vue'
import MapSelect from './components/MapSelect.vue'
import StartScreen from './components/StartScreen.vue'
import WinScreen from './components/WinScreen.vue'
import { WorldEngine } from './game/engine'
import { loadSave, saveSkin } from './game/save'
import type { Skin } from './game/skins'
import type { ClearStats, HudState } from './game/types'

type Screen = 'menu' | 'maps' | 'looks' | 'game' | 'clear' | 'over' | 'win'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const screen = ref<Screen>('menu')
const showHelp = ref(false)
const hint = ref(true)
const pauseOpen = ref(false)
const finalScore = ref(0)
const clearStats = ref<ClearStats | null>(null)
const skin = ref<Skin>({ ...loadSave().skin })
const hud = ref<HudState>({
  mode: 'map',
  coins: 0,
  lives: 5,
  score: 0,
  time: 0,
  levelName: '',
  muted: false,
  paused: false,
  mapName: 'Aurora',
  canEnter: false,
})

let engine: WorldEngine | null = null
let hintTimer = 0

function boot() {
  const canvas = canvasRef.value
  if (!canvas) return
  engine?.stop()
  engine = new WorldEngine(canvas, {
    onHud: (next) => {
      hud.value = next
    },
    onClear: (stats) => {
      clearStats.value = stats
      screen.value = 'clear'
    },
    onGameOver: (score) => {
      finalScore.value = score
      screen.value = 'over'
    },
    onWin: (score) => {
      finalScore.value = score
      screen.value = 'win'
    },
  })
  engine.setSkin(skin.value)
}

function openMaps() {
  if (!engine) boot()
  engine?.setSkin(skin.value)
  engine?.start()
  screen.value = 'maps'
}

function playLevel(index: number) {
  if (!engine) boot()
  engine?.setSkin(skin.value)
  engine?.enterLevel(index)
  engine?.start()
  pauseOpen.value = false
  screen.value = 'game'
  hint.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    hint.value = false
  }, 5000)
}

function updateSkin(next: Skin) {
  skin.value = next
  saveSkin(next)
  engine?.setSkin(next)
}

function toggleMute() {
  if (!engine) return
  engine.setMuted(!engine.muted)
  hud.value = { ...hud.value, muted: engine.muted }
}

function openPause() {
  if (screen.value !== 'game' || hud.value.mode !== 'level') return
  pauseOpen.value = true
  if (engine) {
    engine.paused = true
    hud.value = { ...hud.value, paused: true }
  }
}

function resume() {
  pauseOpen.value = false
  if (engine) {
    engine.paused = false
    hud.value = { ...hud.value, paused: false }
  }
}

function restartLevel() {
  pauseOpen.value = false
  engine?.restartLevel()
  if (engine) {
    engine.paused = false
    hud.value = { ...hud.value, paused: false }
  }
}

function toStartMenu() {
  pauseOpen.value = false
  engine?.leaveLevel()
  screen.value = 'menu'
}

function hold(action: 'left' | 'right' | 'jump' | 'run' | 'enter', down: boolean) {
  engine?.input.setVirtual(action, down)
}

function onKey(event: KeyboardEvent) {
  if (event.code === 'KeyM') toggleMute()
  if (event.code === 'Escape') {
    event.preventDefault()
    if (pauseOpen.value) resume()
    else openPause()
  }
}

function onResize() {
  engine?.resize()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  boot()
  engine?.start()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  window.clearTimeout(hintTimer)
  engine?.stop()
})
</script>

<template>
  <div class="stage">
    <canvas ref="canvasRef" />
    <StartScreen
      v-if="screen === 'menu'"
      :show-help="showHelp"
      @play="openMaps"
      @looks="screen = 'looks'"
      @help="showHelp = !showHelp"
    />
    <MapSelect v-if="screen === 'maps'" @pick="playLevel" @back="screen = 'menu'" />
    <Customize v-if="screen === 'looks'" :skin="skin" @update="updateSkin" @back="screen = 'menu'" />
    <Hud
      v-if="screen === 'game' || screen === 'clear'"
      :hud="hud"
      :hint="hint"
      @mute="toggleMute"
      @menu="openPause"
      @hold="hold"
    />
    <PauseMenu v-if="pauseOpen && screen === 'game'" @resume="resume" @restart="restartLevel" @menu="toStartMenu" />
    <LevelClear v-if="screen === 'clear' && clearStats" :stats="clearStats" @next="openMaps" />
    <GameOver v-if="screen === 'over'" :score="finalScore" @again="openMaps" @menu="screen = 'menu'" />
    <WinScreen v-if="screen === 'win'" :score="finalScore" @menu="screen = 'menu'" />
  </div>
</template>
