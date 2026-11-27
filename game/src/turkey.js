// turkey.js — one job: the turkey itself. Physics (run, jump, dash, hide),
// lives and invulnerability, and the vector-art drawing of the bird.
// The turkey's screen x never changes; the world scrolls past it.
import {
  DASH_COOLDOWN,
  DASH_SPEED,
  DASH_TIME,
  GRAVITY,
  GROUND_Y,
  INVULN_TIME,
  JUMP_VEL,
  MAX_LIVES,
  PALETTE,
  RUN_SPEED,
  TERMINAL_VEL,
  TURKEY_H,
  TURKEY_W,
  TURKEY_X,
} from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y - TURKEY_H; // top of the bird
    this.vy = 0;
    this.onGround = true;
    this.lives = MAX_LIVES;
    this.corn = 0;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.invuln = 0;
    this.hidden = false;
    this.hideStack = null;
    this.runPhase = 0; // leg / bob cycle
    this.hitFlash = 0;
    this.dead = false;
  }

  get w() {
    return TURKEY_W;
  }

  get h() {
    return TURKEY_H;
  }

  get dashing() {
    return this.dashTime > 0;
  }

  get bottom() {
    return this.y + this.h;
  }

  // Current scroll speed the world should use this frame.
  get speed() {
    if (this.hidden) return 0;
    return this.dashing ? DASH_SPEED : RUN_SPEED;
  }

  update(dt, input, world) {
    if (this.dead) return;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTime > 0) this.dashTime -= dt;

    // Hide: Down held while standing inside a haystack.
    const stack = world.haystackAt(this.x + this.w / 2);
    if (this.onGround && stack && input.hideHeld) {
      this.hidden = true;
      this.hideStack = stack;
    } else if (!input.hideHeld || !stack) {
      this.hidden = false;
      this.hideStack = null;
    }

    // Jump: only from the ground, never while hidden.
    if (!this.hidden && input.jumpPressed && this.onGround) {
      this.vy = JUMP_VEL;
      this.onGround = false;
    }
    // Hold jump a touch longer for a higher hop.
    if (!this.hidden && input.jumpHeld && this.vy < 0) {
      this.vy -= GRAVITY * 0.35 * dt;
    }

    // Dash: a burst of speed that also outruns the farmer's chase.
    if (!this.hidden && input.dashPressed && this.dashCooldown <= 0 && this.onGround) {
      this.dashTime = DASH_TIME;
      this.dashCooldown = DASH_COOLDOWN;
    }

    // Gravity and ground, with a terminal fall speed so long drops stay fair.
    this.vy += GRAVITY * dt;
    if (this.vy > TERMINAL_VEL) this.vy = TERMINAL_VEL;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y - this.h) {
      this.y = GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    }
    if (this.y < 60) this.y = 60;

    if (!this.hidden) this.runPhase += dt * (this.dashing ? 22 : 13);
  }

  // Lose a life. Returns true when the turkey is out of lives.
  hurt() {
    if (this.invuln > 0 || this.dead) return false;
    this.lives -= 1;
    this.invuln = INVULN_TIME;
    this.hitFlash = 0.35;
    if (this.lives <= 0) this.dead = true;
    return this.dead;
  }

  // Axis-aligned hit box, a little forgiving at the edges.
  get box() {
    return { x: this.x + 8, y: this.y + 6, w: this.w - 16, h: this.h - 8 };
  }

  draw(ctx) {
    if (this.hidden) return; // tucked inside the haystack — nothing to see
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return; // blink
    const t = this.runPhase;
    const bob = this.onGround ? Math.sin(t) * 2 : 0;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + bob;
    const flash = this.hitFlash > 0;

    ctx.save();
    ctx.translate(cx, cy);

    // Tail fan: five autumn feathers fanned behind the body.
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = PALETTE.featherFan[i];
      ctx.beginPath();
      ctx.ellipse(-26, -14, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Legs: two quick orange sticks, mid-stride.
    ctx.strokeStyle = '#f2a007';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const legSwing = this.onGround ? Math.sin(t) * 8 : 4;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6 + legSwing, 27);
    ctx.moveTo(6, 16);
    ctx.lineTo(6 - legSwing, 27);
    ctx.stroke();

    // Body: a plump brown oval.
    ctx.fillStyle = flash ? '#e8e8e8' : PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, 4, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = flash ? '#d8d8d8' : PALETTE.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(-2, 6, 16, 11, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head: small, up front, with a panicked eye.
    ctx.fillStyle = flash ? '#e8e8e8' : PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(20, -16, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak.
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(29, -18);
    ctx.lineTo(40, -14);
    ctx.lineTo(29, -11);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(28, -8, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye: wide white with a darting pupil.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(22, -19, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(23.5, -19, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Dash motion lines.
    if (this.dashing) {
      ctx.strokeStyle = 'rgba(255, 233, 176, 0.85)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const yy = -10 + i * 12;
        ctx.beginPath();
        ctx.moveTo(-44 - i * 8, yy);
        ctx.lineTo(-28 - i * 8, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
