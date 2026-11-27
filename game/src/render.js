// render.js — one job: everything the player sees. Backgrounds per stage,
// the farmer and his vision cone, the HUD, banners, and the title / pause /
// end screens. All art is vector drawing on the canvas — no image files.
import { DASH_COOLDOWN, GROUND_Y, MAX_LIVES, PALETTE, TOTAL_DISTANCE, VIEW_H, VIEW_W } from './config.js';

// ---- background ----------------------------------------------------------

function drawSky(ctx, stage, scrollX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(0.55, stage.skyMid);
  g.addColorStop(1, stage.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  // Sun with a slow pulse.
  const pulse = 1 + Math.sin(time * 0.8) * 0.03;
  ctx.fillStyle = stage.sun;
  ctx.beginPath();
  ctx.arc(1060, 130, 62 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
  ctx.beginPath();
  ctx.arc(1060, 130, 84 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Clouds drift with the scroll, slowly.
  ctx.fillStyle = 'rgba(255, 244, 214, 0.85)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 340 - scrollX * 0.12) % 1500 + 1500) % 1500 - 110;
    const cy = 70 + (i % 3) * 62;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 44, cy + 8, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx, stage, scrollX) {
  // Far hills.
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const wx = x + scrollX * 0.25;
    ctx.lineTo(x, GROUND_Y - 120 - Math.sin(wx * 0.006) * 46 - Math.sin(wx * 0.0021) * 30);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Near hills / trees.
  ctx.fillStyle = stage.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const wx = x + scrollX * 0.5;
    ctx.lineTo(x, GROUND_Y - 46 - Math.sin(wx * 0.011 + 2) * 26);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Stage dressing on the near hill line.
  if (stage.name === 'Farmyard') {
    for (let i = 0; i < 6; i++) {
      const tx = ((i * 260 - scrollX * 0.5) % 1560 + 1560) % 1560 - 40;
      drawTree(ctx, tx, GROUND_Y - 40);
    }
  } else if (stage.name === 'Barn') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 420 - scrollX * 0.5) % 1680 + 1680) % 1680 - 60;
      ctx.fillRect(bx, 90, 26, GROUND_Y - 90);
    }
  } else {
    // Kitchen: tiled wall and a window with evening light.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let y = 40; y < GROUND_Y - 60; y += 56) {
      for (let x = 0; x < VIEW_W; x += 56) ctx.fillRect(x + ((y / 56) % 2) * 28, y, 26, 26);
    }
    ctx.fillStyle = '#2c1c22';
    ctx.fillRect(90, 110, 190, 150);
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(100, 120, 170, 130);
    ctx.fillStyle = '#2c1c22';
    ctx.fillRect(180, 120, 10, 130);
    ctx.fillRect(100, 180, 170, 10);
  }
}

function drawTree(ctx, x, y) {
  ctx.fillStyle = '#5a3416';
  ctx.fillRect(x - 5, y - 46, 10, 46);
  ctx.fillStyle = '#c96a1e';
  ctx.beginPath();
  ctx.arc(x, y - 62, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e08a2e';
  ctx.beginPath();
  ctx.arc(x - 16, y - 48, 18, 0, Math.PI * 2);
  ctx.arc(x + 16, y - 48, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx, stage, scrollX) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 14);
  // Scrolling ground texture: tufts and stones.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let i = 0; i < 24; i++) {
    const gx = ((i * 173 - scrollX) % 1400 + 1400) % 1400 - 60;
    const gy = GROUND_Y + 34 + ((i * 47) % 100);
    ctx.beginPath();
    ctx.ellipse(gx, gy, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Distance progress ticks along the ground edge.
  ctx.fillStyle = 'rgba(255, 233, 176, 0.5)';
  for (let m = 0; m <= TOTAL_DISTANCE; m += 100) {
    const px = VIEW_W - ((TOTAL_DISTANCE - m) / TOTAL_DISTANCE) * VIEW_W;
    ctx.fillRect(px, GROUND_Y + 2, 2, 10);
  }
}

// ---- farmer ---------------------------------------------------------------

export function drawVisionCone(ctx, farmer, stage) {
  if (farmer.state === 'patrol' || farmer.state === 'search') {
    const fx = farmer.x;
    const fy = GROUND_Y - 78;
    const range = 430;
    const spread = 0.42;
    ctx.save();
    ctx.fillStyle =
      farmer.state === 'search' ? 'rgba(255, 210, 60, 0.16)' : 'rgba(255, 210, 60, 0.22)';
    ctx.beginPath();
    ctx.moveTo(fx + 20, fy);
    ctx.lineTo(fx + 20 + range, fy - Math.tan(spread) * range);
    ctx.lineTo(fx + 20 + range, fy + Math.tan(spread) * range * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawFarmer(ctx, farmer, time) {
  const fx = farmer.x;
  const fy = GROUND_Y;
  const swing = Math.sin(farmer.walkPhase) * 9;
  const hurry = farmer.state === 'chase';
  ctx.save();
  ctx.translate(fx, fy);
  // Legs: overalls, mid-stride.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -52);
  ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(6, -52);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();
  // Body: red shirt + overall straps.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.beginPath();
  ctx.ellipse(0, -78, 24, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-14, -104, 8, 30);
  ctx.fillRect(6, -104, 8, 30);
  // Arms: one pumping, one holding a net when chasing.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-16, -92);
  ctx.lineTo(-26 - swing * 0.6, -66);
  ctx.moveTo(16, -92);
  ctx.lineTo(28 + (hurry ? 6 : -swing * 0.6), -70);
  ctx.stroke();
  if (hurry) {
    // Butterfly net, raised.
    ctx.strokeStyle = '#8a5a28';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(28, -70);
    ctx.lineTo(52, -108);
    ctx.stroke();
    ctx.strokeStyle = '#dfe6ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(58, -116, 16, 12, 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Head: skin, white beard, straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(2, -122, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerBeard;
  ctx.beginPath();
  ctx.ellipse(6, -110, 12, 10, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(2, -134, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2, -138, 16, 10, 0, Math.PI, 0);
  ctx.fill();
  // Eyes: angry dots when chasing.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(8, -124, hurry ? 2.6 : 2, 0, Math.PI * 2);
  ctx.arc(15, -124, hurry ? 2.6 : 2, 0, Math.PI * 2);
  ctx.fill();
  // Alert "!" while spotting.
  if (farmer.state === 'alert') {
    ctx.fillStyle = '#ff4d2e';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    const pop = 1 + Math.sin(time * 14) * 0.12;
    ctx.save();
    ctx.translate(2, -178);
    ctx.scale(pop, pop);
    ctx.fillText('!', 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// ---- particles ------------------------------------------------------------

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---- HUD ------------------------------------------------------------------

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-12, -4, -7, -12, 0, -5);
  ctx.bezierCurveTo(7, -12, 12, -4, 0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, g) {
  const pad = 16;
  ctx.fillStyle = PALETTE.hudBg;
  ctx.beginPath();
  ctx.roundRect(pad, pad, VIEW_W - pad * 2, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // Lives.
  for (let i = 0; i < MAX_LIVES; i++) {
    drawHeart(ctx, 52 + i * 30, 48, i < g.turkey.lives);
  }
  // Score.
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('SCORE ' + g.score.toLocaleString('en-US'), 160, 48);
  // Distance + stage.
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillText(
    g.world.stage.name.toUpperCase() + '  ·  ' + Math.floor(g.world.distanceM) + ' m / ' + TOTAL_DISTANCE + ' m',
    VIEW_W / 2 + 60,
    40,
  );
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '16px sans-serif';
  ctx.fillText('corn × ' + g.turkey.corn, VIEW_W / 2 + 60, 62);
  // Dash cooldown + speed.
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = g.turkey.dashing ? '#7ed957' : PALETTE.hudText;
  ctx.fillText(g.turkey.dashing ? 'DASH!' : g.turkey.hidden ? 'HIDDEN' : 'RUN', VIEW_W - 48, 40);
  const cd = Math.max(0, g.turkey.dashCooldown / DASH_COOLDOWN);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(VIEW_W - 188, 56, 140, 8);
  ctx.fillStyle = cd === 0 ? '#7ed957' : '#ffb347';
  ctx.fillRect(VIEW_W - 188, 56, 140 * (1 - cd), 8);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,233,176,0.8)';
  ctx.fillText('SHIFT dash · ↓ hide · SPACE jump', VIEW_W - 48, 71);
  ctx.textBaseline = 'alphabetic';
}

function drawBanner(ctx, g, time) {
  if (!g.banner || g.bannerTime <= 0) return;
  const a = Math.min(1, g.bannerTime);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  if (g.banner === 'stage') {
    ctx.fillStyle = 'rgba(40, 20, 8, 0.8)';
    ctx.beginPath();
    ctx.roundRect(VIEW_W / 2 - 300, 150, 600, 84, 14);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(g.world.stage.subtitle.toUpperCase(), VIEW_W / 2, 186);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#ffb347';
    ctx.fillText(
      g.world.stageIndex === 1 ? 'Hide in the hay — the farmer is watching' : 'Mind the oven — Thanksgiving is close',
      VIEW_W / 2,
      216,
    );
  } else if (g.banner === 'spotted') {
    ctx.fillStyle = '#ff4d2e';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('SPOTTED! RUN!', VIEW_W / 2, 200);
  }
  ctx.restore();
}

// ---- full scenes -----------------------------------------------------------

export function drawScene(ctx, g, time, chrome = true) {
  ctx.save();
  if (g.shake > 0) {
    ctx.translate((Math.random() - 0.5) * g.shake * 14, (Math.random() - 0.5) * g.shake * 14);
  }
  const stage = g.world.stage;
  drawSky(ctx, stage, g.world.scrollX, time);
  drawHills(ctx, stage, g.world.scrollX);
  drawGround(ctx, stage, g.world.scrollX);
  // Field entities, back to front.
  const hz = g.hazards;
  hz.drawHaystacks(ctx, g.world);
  hz.drawCorn(ctx, g.world, time);
  hz.drawObstacles(ctx, g.world, time);
  hz.drawKnives(ctx, g.world);
  hz.drawPins(ctx, g.world);
  drawVisionCone(ctx, g.farmer, stage);
  g.turkey.draw(ctx);
  drawFarmer(ctx, g.farmer, time);
  drawParticles(ctx, g.particles);
  ctx.restore();
  if (!chrome) return;
  drawHUD(ctx, g);
  drawBanner(ctx, g, time);
  // Hit flash.
  if (g.turkey.hitFlash > 0) {
    ctx.fillStyle = 'rgba(255, 40, 20, ' + (g.turkey.hitFlash * 0.5).toFixed(2) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // Distance progress bar along the bottom.
  if (!chrome) return;
  ctx.fillStyle = 'rgba(40, 20, 8, 0.6)';
  ctx.fillRect(0, VIEW_H - 14, VIEW_W, 14);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(0, VIEW_H - 14, (g.world.distanceM / TOTAL_DISTANCE) * VIEW_W, 14);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ESCAPE ' + Math.floor(g.world.distanceM) + ' / ' + TOTAL_DISTANCE + ' m', VIEW_W - 10, VIEW_H - 3);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, g, time) {
  // Farmyard backdrop with the turkey and the farmer mid-chase, no HUD:
  // the title card carries the information on this screen.
  drawScene(ctx, g, time, false);
  ctx.fillStyle = 'rgba(30, 14, 4, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 96px sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 220);
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('Farmyard to Kitchen Escape', VIEW_W / 2, 272);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '22px sans-serif';
  ctx.fillText('Thanksgiving is coming — and you are the main course.', VIEW_W / 2, 322);
  ctx.fillText('Outrun the farmer, dodge the oven and the carving knife,', VIEW_W / 2, 354);
  ctx.fillText('and make it out of the kitchen alive.', VIEW_W / 2, 386);
  // Controls card.
  ctx.fillStyle = 'rgba(40, 20, 8, 0.8)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 330, 430, 660, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 466);
  ctx.font = '20px sans-serif';
  ctx.fillText('SPACE / ↑ / click — jump      SHIFT / right-click — dash', VIEW_W / 2, 500);
  ctx.fillText('↓ in a haystack — hide      P — pause      R — restart', VIEW_W / 2, 532);
  ctx.fillText('Grab corn for points. Three hearts. Reach 1800 m to escape!', VIEW_W / 2, 564);
  const blink = Math.sin(time * 4) > 0;
  if (blink) {
    ctx.fillStyle = '#7ed957';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('PRESS ENTER OR CLICK TO RUN', VIEW_W / 2, 650);
  }
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255, 233, 176, 0.7)';
  ctx.fillText('A Thanksgiving escape game · Gobble Dash', VIEW_W / 2, 740);
}

export function drawPaused(ctx, g) {
  ctx.fillStyle = 'rgba(30, 14, 4, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 360);
  ctx.font = '24px sans-serif';
  ctx.fillText('Press P to keep running — the farmer is waiting.', VIEW_W / 2, 412);
}

export function drawEnd(ctx, g, time) {
  drawScene(ctx, g, time, false);
  ctx.fillStyle = 'rgba(30, 14, 4, 0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  const escaped = g.result === 'escaped';
  ctx.fillStyle = escaped ? '#7ed957' : '#ff4d2e';
  ctx.font = 'bold 92px sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 240);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '26px sans-serif';
  ctx.fillText(
    escaped
      ? 'You slipped out of the kitchen and into the wild — no Thanksgiving dinner today!'
      : 'The farmer got you. The oven was already warm…',
    VIEW_W / 2,
    296,
  );
  // Score card.
  ctx.fillStyle = 'rgba(40, 20, 8, 0.85)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 280, 340, 560, 190, 14);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('FINAL SCORE  ' + g.score.toLocaleString('en-US'), VIEW_W / 2, 392);
  ctx.font = '22px sans-serif';
  ctx.fillText(
    'Distance ' + Math.floor(g.world.distanceM) + ' m  ·  Corn × ' + g.turkey.corn + '  ·  ' + g.world.stage.name,
    VIEW_W / 2,
    436,
  );
  ctx.fillStyle = '#ffb347';
  ctx.fillText(escaped ? 'Rank: Thanksgiving Survivor' : 'Rank: Sunday Roast', VIEW_W / 2, 478);
  const blink = Math.sin(time * 4) > 0;
  if (blink) {
    ctx.fillStyle = '#7ed957';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('PRESS R OR ENTER TO RUN AGAIN', VIEW_W / 2, 600);
  }
}
