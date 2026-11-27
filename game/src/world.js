// world.js — one job: the scrolling farm. It owns the distance, the current
// stage, the scenery seeds, and every field entity (fences, bales, ovens,
// haystacks, corn, knives, rolling pins). It spawns by distance so spacing
// stays fair at any speed; hazards.js moves and collides with the entities.
import {
  GROUND_Y,
  PX_PER_METRE,
  RUN_SPEED,
  STAGES,
  TOTAL_DISTANCE,
  TURKEY_X,
} from './config.js';

export class World {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.distanceM = 0;
    this.scrollX = 0;
    this.speed = RUN_SPEED;
    this.stageIndex = 0;
    this.obstacles = []; // {kind:'fence'|'bale'|'oven', x, w, h, flame, flameTimer, telegraph}
    this.corns = []; // {x, y, taken, bob}
    this.haystacks = []; // {x, w}
    this.knives = []; // {x, y, vy, stuck, warn}
    this.pins = []; // {x, r, angle}
    this.nextSpawnM = 26;
    this.banner = null; // 'stage' when a stage just changed
    this.escaped = false;
    // A few opening props so the first seconds already read as a farm.
    this.haystacks.push({ x: 900, w: 140 });
    this.corns.push({ x: 620, y: GROUND_Y - 120, taken: false, bob: 0 });
    this.corns.push({ x: 680, y: GROUND_Y - 120, taken: false, bob: 0.4 });
    this.corns.push({ x: 740, y: GROUND_Y - 120, taken: false, bob: 0.8 });
  }

  get stage() {
    return STAGES[this.stageIndex];
  }

  // Stage for a distance (used by the renderer for blends too).
  stageAt(distanceM) {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (distanceM >= STAGES[i].start) return i;
    }
    return 0;
  }

  // Advance the world one frame. Returns 'stage' on a stage change.
  update(dt) {
    this.banner = null;
    const step = (this.speed * dt) / PX_PER_METRE;
    this.distanceM += step;
    this.scrollX += this.speed * dt;
    if (this.distanceM >= TOTAL_DISTANCE) {
      this.escaped = true;
      this.distanceM = TOTAL_DISTANCE;
    }
    const idx = this.stageAt(this.distanceM);
    if (idx !== this.stageIndex) {
      this.stageIndex = idx;
      this.banner = 'stage';
    }
    while (this.distanceM >= this.nextSpawnM && !this.escaped) {
      this.spawnPattern();
      this.nextSpawnM += this.rng.range(52, 92);
    }
    const dx = this.speed * dt;
    for (const o of this.obstacles) o.x -= dx;
    for (const c of this.corns) c.x -= dx;
    for (const h of this.haystacks) h.x -= dx;
    for (const k of this.knives) k.x -= dx * 0.35; // knives drift slowly; they fall fast
    for (const p of this.pins) {
      p.x -= dx + 230 * dt; // pins roll toward the turkey on top of the scroll
      p.angle += 6 * dt;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -220);
    this.corns = this.corns.filter((c) => c.x > -80 && !c.taken);
    this.haystacks = this.haystacks.filter((h) => h.x + h.w > -220);
    this.knives = this.knives.filter((k) => k.y < GROUND_Y + 40);
    this.pins = this.pins.filter((p) => p.x > -80);
    return this.banner;
  }

  // One spawn: a pattern that fits the current stage.
  spawnPattern() {
    const r = this.rng;
    const x = 1280 + r.range(40, 220);
    const stage = this.stageIndex;
    const roll = r.next();
    if (stage === 0) {
      if (roll < 0.3) this.addFence(x);
      else if (roll < 0.5) this.addKnife(x);
      else if (roll < 0.65) this.addHaystack(x);
      else if (roll < 0.8) this.addCornLine(x);
      else this.addBale(x);
    } else if (stage === 1) {
      if (roll < 0.28) this.addBale(x);
      else if (roll < 0.5) this.addKnife(x);
      else if (roll < 0.62) this.addPin(x);
      else if (roll < 0.78) this.addHaystack(x);
      else this.addCornLine(x);
    } else {
      if (roll < 0.3) this.addOven(x);
      else if (roll < 0.52) this.addKnife(x);
      else if (roll < 0.7) this.addPin(x);
      else if (roll < 0.85) this.addCornLine(x);
      else if (roll < 0.93) this.addFence(x);
      else this.addHaystack(x); // potato sacks: the kitchen's one hiding spot
      // The kitchen sometimes drops two knives at once.
      if (roll < 0.2) this.addKnife(x + 300);
    }
  }

  addFence(x) {
    this.obstacles.push({ kind: 'fence', x, w: 26, h: 72 });
  }

  addBale(x) {
    this.obstacles.push({ kind: 'bale', x, w: 66, h: 64 });
  }

  addOven(x) {
    this.obstacles.push({
      kind: 'oven',
      x,
      w: 128,
      h: 96,
      flame: 0, // 0 off, 1 telegraph, 2 burning
      flameTimer: this.rng.range(1.4, 2.4),
    });
  }

  addHaystack(x) {
    this.haystacks.push({ x, w: 140 });
  }

  addCornLine(x) {
    for (let i = 0; i < 3; i++) {
      this.corns.push({
        x: x + i * 58,
        y: GROUND_Y - 120 - (i === 1 ? 46 : 0),
        taken: false,
        bob: this.rng.range(0, 6),
      });
    }
  }

  // A carving knife drops from the sky onto the turkey's lane, telegraphed
  // by a shadow on the ground first.
  addKnife(x) {
    this.knives.push({ x: TURKEY_X + this.rng.range(0, 260), y: -60, vy: 0, stuck: false, warn: 0.55 });
  }

  addPin(x) {
    this.pins.push({ x, r: 22, angle: 0 });
  }

  // Is the turkey standing inside a haystack (a hiding spot)?
  haystackAt(turkeyX) {
    for (const h of this.haystacks) {
      if (turkeyX > h.x - 10 && turkeyX < h.x + h.w + 10) return h;
    }
    return null;
  }
}
