// audio.js — one job: every sound, synthesized live with WebAudio.
// No audio files, no network: oscillators and filtered noise only.
// The context is created lazily on the first user gesture (browsers demand
// it); in deterministic shot mode the game never touches audio at all.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.muted = false;
  }

  // Call from a user gesture (start button / first keypress).
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null;
    }
  }

  get ready() {
    return !!this.ctx && !this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  _tone(freq, dur, type, vol, slideTo) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol, filterFreq) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  // The turkey's gobble: three quick descending clucks.
  gobble() {
    if (!this.ready) return;
    [520, 430, 340].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.09, 'square', 0.12, f * 0.7), i * 90);
    });
  }

  jump() {
    this._tone(280, 0.16, 'sine', 0.16, 640);
  }

  dash() {
    this._noise(0.18, 0.16, 2400);
  }

  pickup() {
    this._tone(880, 0.1, 'triangle', 0.18);
    setTimeout(() => this._tone(1320, 0.12, 'triangle', 0.16), 70);
  }

  hit() {
    this._tone(180, 0.25, 'sawtooth', 0.22, 70);
    this._noise(0.2, 0.2, 700);
  }

  // Farmer spots the turkey: a two-note alarm.
  alarm() {
    this._tone(660, 0.12, 'square', 0.14);
    setTimeout(() => this._tone(660, 0.12, 'square', 0.14), 150);
  }

  oven() {
    this._noise(0.5, 0.2, 900);
  }

  stageClear() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.16, 'triangle', 0.16), i * 110);
    });
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.28, 'triangle', 0.18), i * 130);
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.3, 'sawtooth', 0.12), i * 160);
    });
  }

  // A quiet plucked autumn walk: pentatonic, one note per beat, loops while
  // the run is live. Started on play, stopped on end screens.
  startMusic() {
    if (!this.ready || this.musicTimer) return;
    const notes = [262, 294, 330, 392, 440, 392, 330, 294];
    this.musicTimer = setInterval(() => {
      if (!this.ready) return;
      const n = notes[this.musicStep % notes.length];
      this.musicStep += 1;
      this._tone(n, 0.4, 'triangle', 0.05);
      if (this.musicStep % 4 === 0) this._tone(n / 2, 0.5, 'sine', 0.04);
    }, 320);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
