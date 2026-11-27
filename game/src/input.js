// input.js — one job: keyboard + mouse state with edge detection.
// The game polls `down(code)` every frame and `pressed(code)` for one-shot
// actions (jump, dash, start, restart). Mouse click = jump, right-click
// (or Shift) = dash, so the game is playable without a keyboard too.
export class Input {
  constructor() {
    this.downKeys = new Set();
    this.pressedKeys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = false; // left click this frame
    this.rightClicked = false; // right click this frame
    this.anyKey = false; // any key or click this frame (for menus)
    this._onKeyDown = (e) => {
      if (e.repeat) return;
      this.downKeys.add(e.code);
      this.pressedKeys.add(e.code);
      this.anyKey = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => this.downKeys.delete(e.code);
    this._onBlur = () => {
      this.downKeys.clear();
      this.pressedKeys.clear();
    };
    this._onMouseDown = (e) => {
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      if (e.button === 0) {
        this.clicked = true;
        this.anyKey = true;
      } else if (e.button === 2) {
        this.rightClicked = true;
        this.anyKey = true;
      }
    };
    this._onContextMenu = (e) => e.preventDefault();
  }

  attach(canvas) {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  // Held right now?
  down(code) {
    return this.downKeys.has(code);
  }

  // Pressed since the last endFrame()?
  pressed(code) {
    return this.pressedKeys.has(code);
  }

  // Movement keys, grouped so WASD and arrows both work.
  get jumpHeld() {
    return this.down('Space') || this.down('ArrowUp') || this.down('KeyW');
  }

  get jumpPressed() {
    return (
      this.pressed('Space') ||
      this.pressed('ArrowUp') ||
      this.pressed('KeyW') ||
      this.clicked
    );
  }

  get dashPressed() {
    return (
      this.pressed('ShiftLeft') ||
      this.pressed('ShiftRight') ||
      this.pressed('KeyX') ||
      this.rightClicked
    );
  }

  get hideHeld() {
    return this.down('ArrowDown') || this.down('KeyS');
  }

  get runFastHeld() {
    return this.down('ArrowRight') || this.down('KeyD');
  }

  get runSlowHeld() {
    return this.down('ArrowLeft') || this.down('KeyA');
  }

  get pausePressed() {
    return this.pressed('KeyP') || this.pressed('Escape');
  }

  get restartPressed() {
    return this.pressed('KeyR');
  }

  get mutePressed() {
    return this.pressed('KeyM');
  }

  get startPressed() {
    return (
      this.pressed('Enter') ||
      this.pressed('Space') ||
      this.clicked ||
      this.anyKey
    );
  }

  // Call once at the end of every frame: edges live exactly one frame.
  endFrame() {
    this.pressedKeys.clear();
    this.clicked = false;
    this.rightClicked = false;
    this.anyKey = false;
  }
}
