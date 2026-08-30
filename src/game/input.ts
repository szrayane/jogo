export class Input {
  readonly keys = new Set<string>()
  pointer = { active: false, x: 0, y: 0 }
  private canvas: HTMLCanvasElement | null = null

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.canvas?.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    this.canvas = null
    this.keys.clear()
    this.pointer.active = false
  }

  axis(): { x: number; y: number } {
    let x = 0
    let y = 0
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1
    const len = Math.hypot(x, y)
    if (len > 0) return { x: x / len, y: y / len }
    return { x: 0, y: 0 }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault()
    }
    this.keys.add(event.code)
  }

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
  }

  private toLocal(event: PointerEvent) {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
  }

  private onPointerDown = (event: PointerEvent) => {
    this.canvas?.setPointerCapture(event.pointerId)
    this.pointer.active = true
    this.toLocal(event)
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.pointer.active) return
    this.toLocal(event)
  }

  private onPointerUp = () => {
    this.pointer.active = false
  }
}
