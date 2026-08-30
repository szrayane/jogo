export class Input {
  left = false
  right = false
  jump = false
  run = false
  enter = false
  jumpHeld = false
  private jumpWas = false
  private enterWas = false
  private keys = new Set<string>()
  private virt = { left: false, right: false, jump: false, run: false, enter: false }

  attach() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.keys.clear()
  }

  setVirtual(action: 'left' | 'right' | 'jump' | 'run' | 'enter', down: boolean) {
    this.virt[action] = down
  }

  beginFrame() {
    const left = this.has('ArrowLeft', 'KeyA') || this.virt.left
    const right = this.has('ArrowRight', 'KeyD') || this.virt.right
    this.left = left && !right
    this.right = right && !left
    this.run = this.has('ShiftLeft', 'ShiftRight', 'KeyJ', 'KeyX') || this.virt.run
    this.jumpHeld = this.has('Space', 'KeyK', 'KeyZ', 'ArrowUp') || this.virt.jump
    this.jump = this.jumpHeld && !this.jumpWas
    this.jumpWas = this.jumpHeld
    const enterHeld = this.has('Enter', 'KeyE') || this.virt.enter
    this.enter = enterHeld && !this.enterWas
    this.enterWas = enterHeld
  }

  private has(...codes: string[]) {
    return codes.some((code) => this.keys.has(code))
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
}
