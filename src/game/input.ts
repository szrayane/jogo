export interface Pad {
  left: boolean
  right: boolean
  jump: boolean
  jumpHeld: boolean
  run: boolean
}

function emptyPad(): Pad {
  return { left: false, right: false, jump: false, jumpHeld: false, run: false }
}

export class Input {
  p1 = emptyPad()
  p2 = emptyPad()
  left = false
  right = false
  jump = false
  run = false
  enter = false
  jumpHeld = false
  private jumpWas1 = false
  private jumpWas2 = false
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

  beginFrame(coop = false) {
    const lettersLeft = this.has('KeyA')
    const lettersRight = this.has('KeyD')
    const arrowsLeft = this.has('ArrowLeft')
    const arrowsRight = this.has('ArrowRight')
    const left1 = lettersLeft || this.virt.left || (!coop && arrowsLeft)
    const right1 = lettersRight || this.virt.right || (!coop && arrowsRight)
    this.p1.left = left1 && !right1
    this.p1.right = right1 && !left1
    this.p1.run = this.has('ShiftLeft', 'KeyX') || this.virt.run || (!coop && this.has('ShiftRight', 'KeyJ'))
    this.p1.jumpHeld =
      this.has('Space', 'KeyW', 'KeyZ') || this.virt.jump || (!coop && this.has('ArrowUp', 'KeyK'))
    this.p1.jump = this.p1.jumpHeld && !this.jumpWas1
    this.jumpWas1 = this.p1.jumpHeld

    this.p2.left = coop && arrowsLeft && !arrowsRight
    this.p2.right = coop && arrowsRight && !arrowsLeft
    this.p2.run = coop && this.has('ShiftRight', 'KeyJ')
    this.p2.jumpHeld = coop && this.has('ArrowUp', 'KeyK')
    this.p2.jump = this.p2.jumpHeld && !this.jumpWas2
    this.jumpWas2 = this.p2.jumpHeld

    this.left = this.p1.left
    this.right = this.p1.right
    this.run = this.p1.run
    this.jumpHeld = this.p1.jumpHeld
    this.jump = this.p1.jump
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
