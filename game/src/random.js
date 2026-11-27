// random.js — one job: a tiny seeded RNG so screenshots are deterministic.
// Mulberry32: fast, small, and good enough for spawning and scenery.
// The live game seeds from the clock; the shot renderer seeds with 1.
export class Rng {
  constructor(seed) {
    this.state = (seed >>> 0) || 1;
  }

  // Next float in [0, 1).
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Float in [min, max).
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // Integer in [min, max] inclusive.
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  // Pick one element from an array.
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  // True with probability p (0..1).
  chance(p) {
    return this.next() < p;
  }
}

// A throwaway seed from the clock for live play (never used in shot mode).
export function clockSeed() {
  return (Date.now() % 2147483647) >>> 0 || 7;
}

// A child RNG derived from this one, for a subsystem that wants its own
// stream without disturbing the parent's (scenery, particles).
export function forkRng(rng) {
  return new Rng((rng.state ^ 0x9e3779b9) >>> 0);
}
