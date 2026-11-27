// main.js — one job: wire the game together. It owns the canvas, the game
// state machine (title → play → paused → caught/escaped), the frame loop,
// and the deterministic shot path (?shot=...&seed=... renders one frame).
import { FARMER_HIT_CLOSE, GROUND_Y, VIEW_H, VIEW_W } from './config.js';
import { Rng, clockSeed } from './random.js';
import { Input } from './input.js';
import { World } from './world.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { SoundBank } from './audio.js';
import { buildShotGame, parseShot } from './shots.js';
import * as hazards from './hazards.js';
import { drawEnd, drawPaused, drawScene, drawTitle } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = new Input();
input.attach(canvas);
const sfx = new SoundBank();

// The whole live state in one object, so the renderer and the shots share it.
const game = {
  mode: 'title', // 'title' | 'play' | 'paused' | 'end'
  world: null,
  turkey: null,
  farmer: null,
  hazards,
  score: 0,
  time: 0,
  banner: null,
  bannerTime: 0,
  shake: 0,
  particles: [],
  result: null, // 'caught' | 'escaped'
  startedAt: 0,
};

function newRun() {
  const rng = new Rng(clockSeed());
  game.world = new World(rng);
  game.turkey = new Turkey();
  game.farmer = new Farmer();
  game.score = 0;
  game.banner = null;
  game.bannerTime = 0;
  game.shake = 0;
  game.particles = [];
  game.result = null;
  game.startedAt = performance.now();
}

function startRun() {
  sfx.ensure();
  newRun();
  game.mode = 'play';
  sfx.gobble();
  sfx.startMusic();
}

function endRun(result) {
  game.mode = 'end';
  game.result = result;
  sfx.stopMusic();
  if (result === 'escaped') sfx.win();
  else sfx.lose();
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      life: 0.7,
      maxLife: 0.7,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function updatePlay(dt) {
  const { world, turkey, farmer } = game;
  const prevJump = turkey.y;

  turkey.update(dt, input, world);
  if (prevJump === GROUND_Y - turkey.h && !turkey.onGround && turkey.vy < 0) {
    sfx.jump();
  }
  if (turkey.dashing && turkey.dashTime > DASH_TIME - dt) sfx.dash();
  world.speed = turkey.speed;

  const banner = world.update(dt);
  if (banner === 'stage') {
    game.banner = 'stage';
    game.bannerTime = 2.2;
    // The score formula below already includes the +500 stage bonus.
    sfx.stageClear();
    sfx.gobble();
  }

  hazards.updateKnives(world, dt);
  hazards.updateOvens(world, dt);

  const hit = hazards.collide(world, turkey);
  if (hit.corn > 0) {
    turkey.corn += hit.corn;
    game.score += hit.corn * 50;
    sfx.pickup();
    burst(turkey.x + 30, turkey.y + 10, '#ffd23d', 6, 120);
  }
  if (hit.hit) {
    const out = turkey.hurt();
    game.shake = 1;
    // The stumble lets the farmer close in — the real cost of a hit.
    farmer.gap = Math.max(60, farmer.gap - FARMER_HIT_CLOSE);
    burst(turkey.x + 30, turkey.y + 20, '#ff4d2e', 14, 260);
    sfx.hit();
    if (out) {
      endRun('caught');
      return;
    }
  }

  const caught = farmer.update(dt, turkey);
  if (farmer.justSpotted) {
    game.banner = 'spotted';
    game.bannerTime = 1.1;
    sfx.alarm();
  }
  if (caught) {
    turkey.dead = true;
    burst(turkey.x + 30, turkey.y + 20, '#8a5a2b', 18, 200);
    endRun('caught');
    return;
  }
  if (world.escaped) {
    game.score += 1000;
    endRun('escaped');
    return;
  }

  // Score ticks with distance; dust while running on the ground.
  game.score = Math.floor(world.distanceM) * 10 + turkey.corn * 50 +
    (world.stageIndex > 0 ? 500 : 0) + (world.stageIndex > 1 ? 500 : 0);
  if (turkey.onGround && !turkey.hidden && Math.random() < dt * 8) {
    game.particles.push({
      x: turkey.x + 8,
      y: GROUND_Y - 4,
      vx: -60 - Math.random() * 60,
      vy: -20 - Math.random() * 30,
      life: 0.4,
      maxLife: 0.4,
      color: '#c9a06a',
      size: 2 + Math.random() * 2,
    });
  }

  // Particles and timers decay.
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  if (game.bannerTime > 0) game.bannerTime -= dt;
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 2.4);
  game.time += dt;
}

function update(dt) {
  if (input.mutePressed) sfx.toggleMute();
  if (game.mode === 'title') {
    game.time += dt;
    // Gentle idle scene behind the title: the world scrolls slowly.
    game.world.speed = 60;
    game.world.update(dt);
    game.turkey.runPhase += dt * 6;
    game.farmer.walkPhase += dt * 5;
    if (input.startPressed) startRun();
  } else if (game.mode === 'play') {
    if (input.pausePressed) {
      game.mode = 'paused';
      sfx.stopMusic();
    } else {
      updatePlay(dt);
    }
  } else if (game.mode === 'paused') {
    if (input.pausePressed || input.startPressed) {
      game.mode = 'play';
      sfx.ensure();
      sfx.startMusic();
    }
  } else if (game.mode === 'end') {
    game.time += dt;
    if (input.restartPressed || input.startPressed) startRun();
  }
  input.endFrame();
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.mode === 'title') drawTitle(ctx, game, game.time);
  else if (game.mode === 'play') drawScene(ctx, game, game.time);
  else if (game.mode === 'paused') {
    drawScene(ctx, game, game.time);
    drawPaused(ctx, game);
  } else drawEnd(ctx, game, game.time);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ---- boot -----------------------------------------------------------------
// Shot mode: build the frozen scene, draw exactly one frame, and say so.
// The screenshot script waits for window.__shotReady before capturing.
const shot = parseShot();
if (shot) {
  const g = buildShotGame(shot.shot, shot.seed);
  Object.assign(game, g);
  game.time = 0.5; // fixed clock: blinking prompts read "on" in every shot
  render();
  window.__shotReady = true;
  document.title = 'shot:' + shot.shot;
} else {
  newRun();
  requestAnimationFrame(frame);
}

// Surface any runtime error for the headless check (and for players).
window.addEventListener('error', (e) => {
  window.__gameError = String(e.message || e.error || 'unknown error');
});

// Read-only handle for debugging and automated checks (mode, distance,
// farmer gap). Single-player game; nothing here talks to the network.
window.__gobble = game;
