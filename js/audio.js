/* 1 из 8 миллиардов — короткие звуки на WebAudio (без файлов). */
(function () {
  "use strict";
  const B8 = (window.B8 = window.B8 || {});
  let ac = null, bus = null;
  const last = {};
  function init() {
    if (ac) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); bus = ac.createGain(); bus.gain.value = 0.45; bus.connect(ac.destination); } catch (e) { ac = null; }
  }
  function tone(f, d, type, vol, slide) {
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, vol, fq) {
    if (!ac) return;
    const t = ac.currentTime, len = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, len, ac.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < len; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "bandpass"; f.frequency.value = fq || 1200; g.gain.value = vol || 0.15;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(bus); s.start(t);
  }
  const seq = (notes, step, type, vol) => notes.forEach((f, i) => setTimeout(() => tone(f, step * 1.6 / 1000, type, vol), i * step));
  B8.audio = {
    on: true,
    unlock() { init(); if (ac && ac.state === "suspended") ac.resume(); },
    suspend() { ac && ac.suspend(); }, resume() { ac && ac.resume(); },
    sfx(n) {
      if (!ac || !B8.audio.on) return;
      const now = performance.now();
      if (last[n] && now - last[n] < 35) return;
      last[n] = now;
      switch (n) {
        case "click": tone(900, 0.03, "square", 0.03); break;
        case "tick": tone(1400, 0.015, "square", 0.025); break;
        case "year": tone(660, 0.05, "triangle", 0.05); setTimeout(() => tone(880, 0.07, "triangle", 0.045), 50); break;
        case "good": seq([523, 659, 784], 70, "triangle", 0.06); break;
        case "bad": tone(220, 0.22, "sawtooth", 0.05, 110); break;
        case "coin": tone(1320, 0.06, "square", 0.04); setTimeout(() => tone(1760, 0.09, "square", 0.035), 60); break;
        case "win": seq([523, 659, 784, 1046, 1318], 75, "square", 0.05); break;
        case "lose": tone(330, 0.12, "triangle", 0.05, 200); setTimeout(() => tone(220, 0.2, "triangle", 0.05, 140), 120); break;
        case "birth": seq([392, 523, 659, 784, 659, 1046], 110, "sine", 0.07); break;
        case "death": seq([392, 330, 262, 196], 260, "sine", 0.06); break;
        case "card": noise(0.06, 0.14, 1600); break;
        case "dice": for (let i = 0; i < 4; i++) setTimeout(() => noise(0.04, 0.16, 900 + i * 300), i * 70); break;
        case "siren": tone(700, 0.25, "sawtooth", 0.03, 1100); setTimeout(() => tone(1100, 0.25, "sawtooth", 0.03, 700), 250); break;
        case "decide": tone(523, 0.08, "sine", 0.06); setTimeout(() => tone(784, 0.1, "sine", 0.05), 70); break;
      }
    },
  };
  ["pointerdown", "keydown"].forEach((e) => window.addEventListener(e, () => B8.audio.unlock(), { passive: true }));
})();
