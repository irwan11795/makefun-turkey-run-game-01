// hazards.js — one job: everything that can hurt or feed the turkey.
// It moves the knives, pins and oven flames, tests every collision against
// the turkey, and draws the field entities. The world owns the lists; this
// file owns what the lists do.
import { GROUND_Y } from './config.js';

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Falling knives: telegraph, then plunge. A stuck knife stays in the ground
// as a jumpable spike for a couple of seconds.
export function updateKnives(world, dt) {
  for (const k of world.knives) {
    if (k.warn > 0) {
      k.warn -= dt;
      continue;
    }
    if (!k.stuck) {
      k.vy += 4200 * dt;
      k.y += k.vy * dt;
      if (k.y >= GROUND_Y - 46) {
        k.y = GROUND_Y - 46;
        k.stuck = true;
        k.stuckTime = 2.2;
      }
    } else {
      k.stuckTime -= dt;
      if (k.stuckTime <= 0) k.y = GROUND_Y + 100; // sink away, culled by world
    }
  }
}

// Oven flames: telegraph (glow + smoke) then a burst of fire from the top.
export function updateOvens(world, dt) {
  for (const o of world.obstacles) {
    if (o.kind !== 'oven') continue;
    if (o.flame === 0) {
      o.flameTimer -= dt;
      if (o.flameTimer <= 0) {
        o.flame = 1;
        o.flameTimer = 0.6; // telegraph
      }
    } else if (o.flame === 1) {
      o.flameTimer -= dt;
      if (o.flameTimer <= 0) {
        o.flame = 2;
        o.flameTimer = 0.9; // burning
      }
    } else {
      o.flameTimer -= dt;
      if (o.flameTimer <= 0) {
        o.flame = 0;
        o.flameTimer = 1.6 + Math.random() * 1.2;
      }
    }
  }
}

// Test every collision. Returns { hit: bool, corn: number } — hit once per
// frame at most, so one bad landing costs one heart.
export function collide(world, turkey) {
  const events = { hit: false, corn: 0 };
  if (turkey.dead || turkey.hidden) return events;
  const tb = turkey.box;

  for (const o of world.obstacles) {
    const ob = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h };
    if (o.kind === 'oven' && o.flame === 2) {
      const flame = { x: o.x + 8, y: GROUND_Y - o.h - 120, w: o.w - 16, h: 120 };
      if (overlap(tb, flame)) events.hit = true;
    }
    // Landing on top of a fence/bale/oven is fine; hitting its side hurts.
    const landing = turkey.vy >= 0 && tb.y + tb.h - o.h < 14 && tb.y + tb.h < GROUND_Y - o.h + 18;
    if (overlap(tb, ob) && !landing) events.hit = true;
  }
  for (const k of world.knives) {
    if (k.warn > 0) continue;
    const kb = { x: k.x - 6, y: k.y, w: 12, h: 46 };
    if (overlap(tb, kb)) events.hit = true;
  }
  for (const p of world.pins) {
    const pb = { x: p.x - p.r, y: GROUND_Y - p.r * 2, w: p.r * 2, h: p.r * 2 };
    if (overlap(tb, pb)) events.hit = true;
  }
  for (const c of world.corns) {
    if (c.taken) continue;
    const cb = { x: c.x - 14, y: c.y - 14, w: 28, h: 28 };
    if (overlap(tb, cb)) {
      c.taken = true;
      events.corn += 1;
    }
  }
  return events;
}

// ---- drawing -------------------------------------------------------------

export function drawObstacles(ctx, world, time) {
  for (const o of world.obstacles) {
    const y = GROUND_Y - o.h;
    if (o.kind === 'fence') {
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(o.x, y, 6, o.h);
      ctx.fillRect(o.x + o.w - 6, y, 6, o.h);
      ctx.fillStyle = '#96622f';
      ctx.fillRect(o.x - 4, y + 10, o.w + 8, 8);
      ctx.fillRect(o.x - 4, y + 34, o.w + 8, 8);
      ctx.fillStyle = '#5a3416';
      ctx.beginPath();
      ctx.moveTo(o.x - 4, y);
      ctx.lineTo(o.x + 2, y - 10);
      ctx.lineTo(o.x + 8, y);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === 'bale') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, GROUND_Y - o.h / 2, o.h / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87a22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, GROUND_Y - o.h / 2, o.h / 2 - 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, GROUND_Y - o.h / 2, o.h / 2 - 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.kind === 'oven') {
      // Oven body: a squat steel box with a round window and a dial.
      ctx.fillStyle = '#3d3d46';
      ctx.fillRect(o.x, y, o.w, o.h);
      ctx.fillStyle = '#55555f';
      ctx.fillRect(o.x, y, o.w, 12);
      ctx.fillStyle = '#1c1c22';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, y + 52, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = o.flame === 2 ? '#ff9a3d' : '#5a2c14';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, y + 52, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5a2e';
      ctx.beginPath();
      ctx.arc(o.x + 18, y + 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OVEN', o.x + o.w / 2, y + 92);
      // Telegraph: a glow and rising smoke before the burst.
      if (o.flame === 1) {
        ctx.fillStyle = 'rgba(255, 120, 40, 0.25)';
        ctx.fillRect(o.x, y - 130, o.w, 130);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, y - 30 - (time * 30) % 60, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Burning: three licking flames from the oven mouth.
      if (o.flame === 2) {
        for (let i = 0; i < 3; i++) {
          const fx = o.x + 22 + i * 42;
          const fh = 90 + Math.sin(time * 18 + i * 2.1) * 22;
          ctx.fillStyle = i === 1 ? '#ffcf3d' : '#ff7a2e';
          ctx.beginPath();
          ctx.moveTo(fx - 16, y);
          ctx.quadraticCurveTo(fx - 20, y - fh * 0.7, fx, y - fh);
          ctx.quadraticCurveTo(fx + 20, y - fh * 0.7, fx + 16, y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

export function drawHaystacks(ctx, world) {
  for (const h of world.haystacks) {
    const x = h.x;
    const y = GROUND_Y;
    ctx.fillStyle = '#c9962e';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + h.w / 2, y - 96, x + h.w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a87a22';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const sx = x + 14 + i * ((h.w - 28) / 4);
      ctx.beginPath();
      ctx.moveTo(sx, y - 8);
      ctx.quadraticCurveTo(sx + 6, y - 46, sx - 2, y - 72);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a5f14';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE — hold ↓', x + h.w / 2, y - 104);
  }
}

export function drawCorn(ctx, world, time) {
  for (const c of world.corns) {
    if (c.taken) continue;
    const bobY = Math.sin(time * 4 + c.bob) * 4;
    ctx.save();
    ctx.translate(c.x, c.y + bobY);
    ctx.fillStyle = '#7ed957';
    ctx.beginPath();
    ctx.ellipse(-8, -12, 5, 12, -0.5, 0, Math.PI * 2);
    ctx.ellipse(8, -12, 5, 12, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a41e';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -12);
      ctx.lineTo(i * 5, 12);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawKnives(ctx, world) {
  for (const k of world.knives) {
    // Warning shadow on the ground while it is still falling.
    if (k.warn > 0 || !k.stuck) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(k.x, GROUND_Y + 4, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (k.warn > 0) {
        ctx.fillStyle = '#ff4d2e';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', k.x, GROUND_Y - 8);
      }
    }
    if (k.warn > 0) continue;
    // Blade + handle, point down.
    ctx.save();
    ctx.translate(k.x, k.y + 23);
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.lineTo(6, -20);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3416';
    ctx.fillRect(-7, -30, 14, 12);
    ctx.restore();
  }
}

export function drawPins(ctx, world) {
  for (const p of world.pins) {
    ctx.save();
    ctx.translate(p.x, GROUND_Y - p.r);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#c98a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, p.r - 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a28';
    ctx.beginPath();
    ctx.arc(-28, 0, 6, 0, Math.PI * 2);
    ctx.arc(28, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
