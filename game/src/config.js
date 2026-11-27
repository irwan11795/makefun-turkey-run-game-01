// config.js — every tuning knob and palette value for Gobble Dash.
// One job: constants. No logic, no imports, so any file can read it.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const GROUND_Y = 640;

// Pixels the turkey scrolls per metre of distance. 14 px/m keeps a full
// 1800 m escape run at roughly one minute of play.
export const PX_PER_METRE = 14;

// Physics (pixels, seconds).
export const GRAVITY = 2600;
export const JUMP_VEL = -980;
export const RUN_SPEED = 430; // base scroll speed while running
export const DASH_SPEED = 780; // burst speed while dashing
export const DASH_TIME = 0.32; // seconds of dash
export const DASH_COOLDOWN = 1.1; // seconds before the next dash
export const HIDE_SPEED = 0; // standing still inside a haystack

// The turkey.
export const TURKEY_X = 300; // fixed screen position; the world scrolls
export const TURKEY_W = 58;
export const TURKEY_H = 54;
export const MAX_LIVES = 3;
export const INVULN_TIME = 1.6; // seconds of mercy after a hit
export const TERMINAL_VEL = 1500; // fastest the turkey ever falls

// The farmer chases by closing a "gap" (px) behind the turkey.
export const FARMER_START_GAP = 500; // beyond vision: the run opens in patrol
export const FARMER_MAX_GAP = 560; // furthest he ever falls behind
export const FARMER_PATROL_CLOSE = 12; // px/s he gains while just running
export const FARMER_CHASE_RATE = 165; // px/s he gains while chasing
export const FARMER_SEARCH_CLOSE = 14; // px/s he creeps while searching
export const FARMER_HIDE_PULL = 140; // px/s the trail cools while hidden
export const FARMER_HIT_CLOSE = 90; // px he gains when the turkey stumbles
export const FARMER_CATCH_GAP = 52; // gap at which the turkey is caught
export const FARMER_DASH_PULL = 150; // px/s the turkey pulls away while dashing
export const VISION_RANGE = 430; // px: turkey inside this is spotted
export const SPOT_TIME = 0.45; // seconds of "!" before the chase starts

// Scoring.
export const SCORE_PER_METRE = 10;
export const CORN_SCORE = 50;
export const STAGE_BONUS = 500;

// The three stages. Distance is in metres; the run ends at TOTAL_DISTANCE.
export const STAGES = [
  {
    name: 'Farmyard',
    subtitle: 'Stage 1 — The Farmyard',
    start: 0,
    end: 500,
    skyTop: '#f7b733',
    skyMid: '#fcb56b',
    skyBot: '#ffe3a3',
    sun: '#fff3c4',
    hillFar: '#c98a3d',
    hillNear: '#a86a2c',
    ground: '#8a5a28',
    groundTop: '#b5773a',
    accent: '#d97b29',
  },
  {
    name: 'Barn',
    subtitle: 'Stage 2 — The Barn',
    start: 500,
    end: 1100,
    skyTop: '#5a3a22',
    skyMid: '#7a4a26',
    skyBot: '#a06a35',
    sun: '#ffd98a',
    hillFar: '#4a2c18',
    hillNear: '#3a2212',
    ground: '#6b4423',
    groundTop: '#96683a',
    accent: '#e0a458',
  },
  {
    name: 'Kitchen',
    subtitle: 'Stage 3 — The Kitchen',
    start: 1100,
    end: 1800,
    skyTop: '#3d2b3a',
    skyMid: '#6b3a44',
    skyBot: '#b06a4a',
    sun: '#ffe9b0',
    hillFar: '#33202c',
    hillNear: '#241722',
    ground: '#4a2e33',
    groundTop: '#7a4a42',
    accent: '#ff9a3d',
  },
];
export const TOTAL_DISTANCE = 1800;

// Autumn palette shared by the turkey, the farmer and the HUD.
export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6e4520',
  turkeyHead: '#a06a35',
  turkeyWattle: '#d93a2b',
  turkeyBeak: '#f2a007',
  featherFan: ['#c96a1e', '#e08a2e', '#a34d16', '#f2b04d', '#7a3a10'],
  farmerHat: '#7a5a2e',
  farmerShirt: '#c94f38',
  farmerOveralls: '#3a5a8a',
  farmerSkin: '#f0c08a',
  farmerBeard: '#e8e0d0',
  hudBg: 'rgba(40, 20, 8, 0.72)',
  hudText: '#ffe9b0',
  hudAccent: '#ffb347',
  danger: '#ff4d2e',
  safe: '#7ed957',
};
