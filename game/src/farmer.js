// farmer.js — one job: the farmer AI. A small state machine with a vision
// cone, so the chase feels like a hunt instead of a timer:
//   patrol  — strolls, slowly falls behind, scans with his cone
//   alert   — turkey spotted ("!"), a beat before the chase
//   chase   — sprints and closes the gap fast
//   search  — lost the turkey (hidden or dashed away), wanders, then patrols
// Caught is decided by the gap: when it closes to FARMER_CATCH_GAP the run
// ends. Hiding in a haystack breaks line of sight and ends the chase.
import {
  FARMER_CATCH_GAP,
  FARMER_CHASE_RATE,
  FARMER_DASH_PULL,
  FARMER_HIDE_PULL,
  FARMER_MAX_GAP,
  FARMER_PATROL_CLOSE,
  FARMER_SEARCH_CLOSE,
  FARMER_START_GAP,
  SPOT_TIME,
  TURKEY_X,
  VISION_RANGE,
} from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = FARMER_START_GAP;
    this.state = 'patrol';
    this.stateTime = 0;
    this.alertTime = 0;
    this.walkPhase = 0; // leg swing
    this.spotted = false; // turkey inside the cone right now
    this.justSpotted = false; // one-frame event for the alarm sound
  }

  get x() {
    return TURKEY_X - this.gap;
  }

  get chasing() {
    return this.state === 'chase' || this.state === 'alert';
  }

  // Does the farmer see the turkey? Only when the turkey is not hidden and
  // is inside the vision range ahead of him.
  canSee(turkey) {
    if (turkey.hidden) return false;
    return this.gap <= VISION_RANGE;
  }

  update(dt, turkey) {
    this.stateTime += dt;
    this.walkPhase += dt * (this.state === 'chase' ? 13 : 7);
    this.justSpotted = false;
    const sees = this.canSee(turkey);

    if (this.state === 'patrol') {
      // He is relentless: the gap closes slowly even when he only patrols.
      // A dashing turkey pulls away; hiding is for breaking a chase, not
      // for outrunning one that never started.
      this.gap -= FARMER_PATROL_CLOSE * dt;
      if (turkey.dashing) this.gap += FARMER_DASH_PULL * dt;
      if (this.gap > FARMER_MAX_GAP) this.gap = FARMER_MAX_GAP;
      if (sees) {
        this.state = 'alert';
        this.stateTime = 0;
        this.alertTime = 0;
        this.justSpotted = true;
      }
    } else if (this.state === 'alert') {
      this.alertTime += dt;
      this.spotted = true;
      if (this.alertTime >= SPOT_TIME) {
        this.state = 'chase';
        this.stateTime = 0;
      }
      if (!sees) {
        this.state = 'search';
        this.stateTime = 0;
      }
    } else if (this.state === 'chase') {
      // Dashing pulls the turkey away; running alone cannot outpace him.
      this.gap -= FARMER_CHASE_RATE * dt;
      if (turkey.dashing) this.gap += FARMER_DASH_PULL * dt;
      this.spotted = true;
      if (!sees) {
        this.state = 'search';
        this.stateTime = 0;
      }
    } else if (this.state === 'search') {
      // Lost the trail: he creeps forward, but a hidden turkey cools the
      // trail fast and he gives up and goes back to patrolling.
      if (turkey.hidden) this.gap += FARMER_HIDE_PULL * dt;
      else this.gap -= FARMER_SEARCH_CLOSE * dt;
      if (this.gap > FARMER_MAX_GAP) this.gap = FARMER_MAX_GAP;
      this.spotted = false;
      if (sees) {
        this.state = 'alert';
        this.stateTime = 0;
        this.alertTime = 0;
        this.justSpotted = true;
      } else if (this.stateTime > 2.4) {
        this.state = 'patrol';
        this.stateTime = 0;
      }
    }

    if (this.gap < 0) this.gap = 0;
    return this.gap <= FARMER_CATCH_GAP;
  }
}
