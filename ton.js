const Ton = {
  an: false,
  ctx: null,
  rauschen: null,

  bereit() {
    if (!this.an) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        const laenge = this.ctx.sampleRate;
        this.rauschen = this.ctx.createBuffer(1, laenge, this.ctx.sampleRate);
        const daten = this.rauschen.getChannelData(0);
        for (let i = 0; i < laenge; i++) daten[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch (e) {
      return null;  
    }
  },

  huelle(ziel, start, spitze, dauer) {
    ziel.gain.setValueAtTime(0.0001, start);
    ziel.gain.exponentialRampToValueAtTime(spitze, start + 0.004);
    ziel.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  },

  klack() {
    const ctx = this.bereit();
    if (!ctx) return;
    const t = ctx.currentTime;
    const quelle = ctx.createBufferSource();
    quelle.buffer = this.rauschen;
    const versatz = Math.random() * 0.8;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400 + Math.random() * 900;
    filter.Q.value = 1.4;
    const laut = ctx.createGain();
    this.huelle(laut, t, 0.5, 0.045);
    quelle.connect(filter).connect(laut).connect(ctx.destination);
    quelle.start(t, versatz, 0.06);

    const tief = ctx.createOscillator();
    tief.type = "triangle";
    tief.frequency.setValueAtTime(180, t);
    tief.frequency.exponentialRampToValueAtTime(70, t + 0.05);
    const tiefLaut = ctx.createGain();
    this.huelle(tiefLaut, t, 0.18, 0.06);
    tief.connect(tiefLaut).connect(ctx.destination);
    tief.start(t);
    tief.stop(t + 0.07);
  },

  fehler() {
    const ctx = this.bereit();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(65, t + 0.16);
    const g = ctx.createGain();
    this.huelle(g, t, 0.35, 0.18);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.2);
  },

  glocke() {
    const ctx = this.bereit();
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const [freq, laut, dauer] of [[2093, 0.16, 1.1], [3140, 0.07, 0.7], [5230, 0.03, 0.4]]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      this.huelle(g, t, laut, dauer);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dauer + 0.05);
    }
  },

  stempel() {
    const ctx = this.bereit();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    const g = ctx.createGain();
    this.huelle(g, t, 0.6, 0.3);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.32);
    this.glocke();
  }
};
