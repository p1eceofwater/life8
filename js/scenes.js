/* 1 из 8 миллиардов — пиксельные сцены главных моментов (рождение, свадьба, арест, тюрьма, побег, ограбление…),
   плакат «Разыскивается» и надгробие в итогах. Всё рисуется кодом, без картинок. */
(function () {
  "use strict";
  const B8 = window.B8;
  const W = 64, H = 32;
  function ctx(cv) { const x = cv.getContext("2d"); x.imageSmoothingEnabled = false; return x; }
  function painter(cv) {
    const x = ctx(cv), px = cv.width / W;
    const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a * px), Math.round(b * px), Math.ceil(w * px), Math.ceil(h * px)); };
    return { x, px, r };
  }
  const rnd = (s) => () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
  function sky(p, night, seed) {
    const { r } = p;
    const cols = night ? ["#0e1330", "#141a3d", "#1b2450", "#232e5e"] : ["#7fb6e8", "#95c4ee", "#acd2f2", "#c4e0f5"];
    for (let i = 0; i < 4; i++) r(0, i * 6, W, 6, cols[i]);
    r(0, 24, W, 8, night ? "#1a2a20" : "#5a9a4a");
    if (night) { const g = rnd(seed || 7); for (let i = 0; i < 22; i++) r(Math.floor(g() * W), Math.floor(g() * 20), 1, 1, g() < 0.3 ? "#fff6c8" : "#c9d3ff"); }
  }
  const moon = (p, a, b) => { p.r(a, b, 5, 5, "#fff3c0"); p.r(a + 2, b, 3, 3, "#141a3d"); };
  const sun = (p, a, b) => { p.r(a, b, 6, 6, "#ffd166"); p.r(a - 1, b + 1, 8, 4, "#ffd166"); p.r(a + 1, b - 1, 4, 8, "#ffd166"); };
  function person(p, a, b, shirt, skin, opt) {
    opt = opt || {};
    const { r } = p;
    r(a + 1, b, 3, 3, skin || "#e0ac69"); r(a + 1, b - 1, 3, 1, opt.hair || "#2a1d16");
    r(a, b + 3, 5, 5, shirt || "#4f81bd");
    if (opt.dress) r(a - 1, b + 6, 7, 3, shirt); else { r(a + 0.5, b + 8, 1.5, 3, "#2a2a35"); r(a + 3, b + 8, 1.5, 3, "#2a2a35"); }
    if (opt.hands) { r(a - 1, b + 4, 1, 3, skin || "#e0ac69"); r(a + 5, b + 4, 1, 3, skin || "#e0ac69"); }
  }
  const SC = {};
  SC.birth = (p, c) => {
    sky(p, true, 3); moon(p, 50, 3);
    const { r } = p;
    r(18, 14, 22, 12, "#6b4a3a"); r(16, 12, 26, 3, "#8a3a2a"); r(20, 10, 18, 3, "#8a3a2a"); r(24, 8, 10, 3, "#8a3a2a");
    r(22, 17, 5, 5, "#ffd166"); r(31, 17, 5, 5, "#ffd166"); r(24, 17, 1, 5, "#6b4a3a"); r(33, 17, 1, 5, "#6b4a3a");
    r(10, 4, 2, 2, "#fff"); r(9, 5, 4, 1, "#fff"); r(10, 6, 2, 1, "#fff");
    r(44, 18, 6, 4, "#f4ecd8"); r(45, 16, 4, 2, "#ffe0bd");
  };
  SC.wedding = (p, c) => {
    sky(p, false); sun(p, 52, 3);
    const { r } = p;
    for (let i = 0; i < 9; i++) { r(18 + i * 3, 6 + Math.abs(4 - i) * 1.4, 3, 3, i % 2 ? "#ff9fb5" : "#fff"); }
    r(17, 10, 2, 16, "#c9a15a"); r(45, 10, 2, 16, "#c9a15a");
    person(p, 26, 15, c && c.sex === "f" ? "#f4f4f4" : "#22242c", c && c.look ? c.look.skin : null, { dress: c && c.sex === "f" });
    person(p, 33, 15, c && c.sex === "f" ? "#22242c" : "#f4f4f4", null, { dress: !(c && c.sex === "f") });
    r(30, 10, 2, 2, "#ff5a7a"); r(29, 11, 4, 1, "#ff5a7a"); r(30, 12, 2, 1, "#ff5a7a");
  };
  SC.baby = (p) => {
    const { r } = p;
    r(0, 0, W, H, "#f2e6d8"); r(0, 24, W, 8, "#d8c3a5");
    r(20, 16, 24, 8, "#c99a6a"); for (let i = 0; i < 7; i++) r(21 + i * 3.3, 12, 1, 5, "#b0845a"); r(20, 11, 24, 2, "#b0845a");
    r(27, 14, 10, 4, "#9fc5ff"); r(29, 13, 4, 3, "#ffe0bd");
    r(31, 2, 1, 5, "#888"); r(26, 7, 11, 1, "#888"); r(25, 8, 2, 2, "#ff9f43"); r(30, 8, 2, 2, "#5fd38d"); r(36, 8, 2, 2, "#6aa9ff");
    r(48, 6, 3, 3, "#ff6b8b"); r(47, 7, 5, 1, "#ff6b8b"); r(12, 9, 2, 2, "#ff6b8b"); r(11, 10, 4, 1, "#ff6b8b");
  };
  SC.arrest = (p, c) => {
    sky(p, true, 11);
    const { r } = p;
    r(0, 24, W, 8, "#2b2f3a"); r(0, 27, W, 1, "#ffd166");
    r(8, 15, 26, 8, "#e8e8f0"); r(12, 11, 16, 5, "#e8e8f0"); r(14, 12, 5, 3, "#7fb6e8"); r(21, 12, 5, 3, "#7fb6e8");
    r(8, 18, 26, 2, "#2f3d9c"); r(15, 9, 4, 2, "#ff3b3b"); r(21, 9, 4, 2, "#3b7bff");
    r(10, 22, 5, 4, "#111"); r(27, 22, 5, 4, "#111");
    r(11, 5, 16, 4, "rgba(255,60,60,.25)"); r(19, 5, 12, 4, "rgba(60,120,255,.25)");
    person(p, 42, 13, c && c.look ? c.look.shirt : "#4f81bd", c && c.look ? c.look.skin : null);
    r(41, 17, 7, 1, "#c0c0c8");
    person(p, 50, 13, "#2f3d9c", null, { hair: "#1b1b22" }); r(50, 11, 6, 2, "#2f3d9c");
  };
  SC.prison = (p) => {
    const { r } = p;
    r(0, 0, W, H, "#4a4e5a"); for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) r(x, y, 7, 3, "#555a68");
    r(22, 4, 20, 16, "#0e1330"); moon(p, 33, 7);
    for (let i = 0; i < 5; i++) r(23 + i * 4, 4, 1.5, 16, "#9aa0b5");
    r(22, 4, 20, 1.5, "#9aa0b5"); r(22, 18.5, 20, 1.5, "#9aa0b5");
    r(0, 26, W, 6, "#33363f"); r(8, 22, 14, 4, "#6b4a3a"); r(8, 21, 14, 1.5, "#d9d9d9");
  };
  SC.release = (p, c) => {
    sky(p, false); sun(p, 44, 6);
    const { r } = p;
    r(0, 8, 16, 18, "#6b6f7a"); r(48, 8, 16, 18, "#6b6f7a");
    r(16, 8, 4, 18, "#4a4e5a"); r(44, 8, 4, 18, "#4a4e5a");
    for (let i = 0; i < 4; i++) r(8 + i * 2, 10, 1, 16, "#9aa0b5");
    r(28, 24, 8, 8, "#c9b38a"); r(26, 28, 12, 4, "#c9b38a");
    person(p, 30, 13, c && c.look ? c.look.shirt : "#4f81bd", c && c.look ? c.look.skin : null, { hands: true });
  };
  SC.escape = (p) => {
    sky(p, true, 21); moon(p, 8, 3);
    const { r } = p;
    r(0, 14, W, 12, "#565a66"); for (let x = 0; x < W; x += 6) r(x, 13, 3, 1, "#565a66");
    r(30, 0, 6, 14, "rgba(255,250,200,.12)"); r(26, 0, 14, 4, "rgba(255,250,200,.08)");
    r(46, 6, 1, 8, "#c9a15a"); person(p, 44, 2, "#e07b28", null);
    r(50, 15, 1, 11, "#c9a15a");
    for (let x = 0; x < W; x += 4) r(x, 12, 2, 1, "#9aa0b5");
  };
  SC.heli = (p) => {
    sky(p, false); sun(p, 6, 3);
    const { r } = p;
    r(0, 22, W, 10, "#6b6f7a"); r(0, 20, W, 2, "#4a4e5a");
    r(26, 6, 18, 6, "#2f3d5c"); r(40, 8, 12, 2, "#2f3d5c"); r(50, 6, 2, 5, "#2f3d5c"); r(28, 7, 6, 3, "#7fb6e8");
    r(20, 4, 30, 1, "#1b1b22"); r(34, 4, 1, 3, "#1b1b22"); r(28, 12, 12, 1, "#1b1b22");
    r(33, 13, 1, 8, "#c9a15a"); r(31, 14, 1, 7, "#c9a15a"); for (let i = 0; i < 4; i++) r(31, 15 + i * 2, 3, 0.6, "#c9a15a");
    person(p, 30, 17, "#e07b28", null, { hands: true });
  };
  SC.wanted = (p, c) => {
    const { r } = p;
    r(0, 0, W, H, "#8a4a3a"); for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 3; x < W; x += 7) r(x, y, 6, 3, "#9a5a48");
    r(22, 3, 20, 26, "#e9dcbc"); r(23, 4, 18, 3, "#2a2418"); r(27, 9, 10, 10, "#c9b38a");
    if (c && c.look) { r(29, 10, 6, 6, c.look.skin); r(29, 9, 6, 2, c.look.hair); r(28, 16, 8, 3, c.look.shirt); }
    r(24, 21, 16, 1.5, "#2a2418"); r(26, 24, 12, 2, "#8a1c1c");
  };
  SC.heist = (p) => {
    const { r } = p;
    r(0, 0, W, H, "#2a2d38"); r(0, 26, W, 6, "#1d1f28");
    r(8, 4, 22, 22, "#8a8f9e"); r(10, 6, 18, 18, "#6b6f7a"); r(17, 13, 4, 4, "#c9a15a"); r(18, 6, 2, 18, "#5a5e6a");
    r(30, 8, 10, 18, "#9aa0b5");
    for (let i = 0; i < 5; i++) r(42 + (i % 3) * 6, 22 - Math.floor(i / 3) * 3, 5, 3, "#ffd166");
    r(52, 16, 8, 10, "#7a5c3a"); r(55, 15, 2, 2, "#7a5c3a"); r(54, 19, 4, 4, "#5fd38d");
  };
  SC.jackpot = (p) => {
    const { r } = p;
    r(0, 0, W, H, "#2a1640"); for (let i = 0; i < 10; i++) r(i * 7, 0, 3, 2, i % 2 ? "#ffd166" : "#ff5a7a");
    r(20, 4, 24, 22, "#c0202a"); r(22, 8, 20, 9, "#fff"); for (let i = 0; i < 3; i++) { r(23 + i * 7, 9, 5, 7, "#fff8e0"); r(24.5 + i * 7, 10, 2, 5, "#c0202a"); r(24 + i * 7, 10, 4, 1, "#c0202a"); }
    r(44, 8, 2, 10, "#9aa0b5"); r(43, 6, 4, 3, "#ff3b3b");
    for (let i = 0; i < 9; i++) r(14 + i * 4, 26 + (i % 2), 3, 3, "#ffd166");
  };
  SC.biz = (p) => {
    sky(p, false); sun(p, 54, 2);
    const { r } = p;
    r(12, 10, 40, 16, "#e8dcc4"); for (let i = 0; i < 8; i++) r(12 + i * 5, 7, 5, 4, i % 2 ? "#c0504d" : "#f4f4f4");
    r(16, 14, 12, 8, "#7fb6e8"); r(34, 14, 8, 12, "#7a5c3a"); r(39, 20, 1, 1, "#ffd166"); r(22, 3, 20, 4, "#2f3d5c"); r(25, 4, 14, 2, "#ffd166");
  };
  SC.emig = (p) => {
    sky(p, false);
    const { r } = p;
    r(0, 24, W, 8, "#acd2f2"); r(6, 18, 12, 4, "#fff"); r(40, 20, 16, 4, "#fff"); r(46, 18, 8, 3, "#fff");
    r(16, 9, 30, 4, "#f4f4f4"); r(42, 7, 4, 3, "#f4f4f4"); r(26, 6, 6, 4, "#d9d9d9"); r(26, 12, 6, 4, "#d9d9d9"); r(44, 9, 3, 1.5, "#7fb6e8");
    for (let i = 0; i < 6; i++) r(20 + i * 3, 10, 1.5, 1.5, "#4f81bd");
  };
  SC.school = (p) => {
    sky(p, false); sun(p, 4, 3);
    const { r } = p;
    r(14, 8, 36, 18, "#c99a6a"); r(12, 6, 40, 3, "#8a3a2a"); for (let i = 0; i < 5; i++) r(17 + i * 7, 12, 4, 5, "#7fb6e8"); r(29, 19, 6, 7, "#5a3a22");
    r(31, 2, 1, 5, "#555"); r(32, 2, 5, 3, "#c0504d");
  };
  SC.grad = (p) => {
    sky(p, false); sun(p, 50, 3);
    const { r } = p;
    r(24, 8, 16, 3, "#1b1b22"); r(28, 11, 8, 3, "#1b1b22"); r(39, 9, 1, 6, "#ffd166"); r(38, 15, 3, 2, "#ffd166");
    person(p, 29, 14, "#1b1b22", null, { hands: true }); r(37, 17, 5, 2, "#f4ecd8"); r(39, 17, 1, 2, "#c0504d");
  };
  B8.drawScene = function (cv, id, c) {
    const p = painter(cv);
    (SC[id] || SC.birth)(p, c);
    p.x.strokeStyle = "rgba(0,0,0,.35)"; p.x.lineWidth = 2; p.x.strokeRect(1, 1, cv.width - 2, cv.height - 2);
  };
  B8.SCENES = Object.keys(SC);

  // ── плакат «Разыскивается» ──
  B8.drawPoster = function (cv, c) {
    const x = ctx(cv), w = cv.width, h = cv.height;
    x.fillStyle = "#e9dcbc"; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(120,90,40,.15)"; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % w, (i * 53) % h, 3, 3);
    x.strokeStyle = "#2a2418"; x.lineWidth = 4; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = "#2a2418"; x.textAlign = "center";
    x.font = "900 34px Georgia, serif"; x.fillText("РАЗЫСКИВАЕТСЯ", w / 2, 58, w - 40);
    const pc = document.createElement("canvas"); pc.width = pc.height = 96;
    B8.portrait(pc, c, c.age, { bg: "#c9b38a" });
    x.drawImage(pc, w / 2 - 84, 76, 168, 168);
    x.lineWidth = 3; x.strokeRect(w / 2 - 84, 76, 168, 168);
    x.font = "800 20px Georgia, serif"; x.fillText(B8.fullName(c), w / 2, 276, w - 40);
    const f = c.fug || { wanted: 50 };
    x.font = "600 15px Georgia, serif";
    const marks = [];
    if (f.face) marks.push("лицо после пластики"); if (c.flags.face_tattoo) marks.push("татуировка на лице"); if (c.looks > 75) marks.push("очень хорош" + (c.sex === "f" ? "а" : "") + " собой");
    if (c.flags.esc_spoon) marks.push("носит с собой ложку"); if (!marks.length) marks.push(["улыбается, когда врёт", "любит " + B8.K(c.cur).food, "оглядывается на каждом углу"][c.age % 3]);
    x.fillText("Особые приметы: " + marks.slice(0, 2).join(", "), w / 2, 302, w - 40);
    x.font = "900 26px Georgia, serif"; x.fillStyle = "#8a1c1c";
    x.fillText("НАГРАДА: " + B8.money(B8.gdp(c) * (2 + f.wanted / 10)), w / 2, 342, w - 40);
    x.save(); x.translate(w - 70, h - 54); x.rotate(-0.28); x.strokeStyle = "#8a1c1c"; x.lineWidth = 3; x.strokeRect(-52, -20, 104, 40);
    x.font = "900 16px sans-serif"; x.fillText("РОЗЫСК " + Math.round(f.wanted) + "%", 0, 6); x.restore();
  };

  // ── надгробие ──
  B8.drawGrave = function (cv, c) {
    const x = ctx(cv), w = cv.width, h = cv.height;
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2b2148"); g.addColorStop(0.6, "#c86f4a"); g.addColorStop(1, "#f0b36a");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "#2c3b2a"; x.fillRect(0, h * 0.78, w, h * 0.22);
    x.fillStyle = "#8a8f9e"; const gw = w * 0.42, gx = (w - gw) / 2, gy = h * 0.2;
    x.beginPath(); x.moveTo(gx, h * 0.82); x.lineTo(gx, gy + gw / 2); x.arc(w / 2, gy + gw / 2, gw / 2, Math.PI, 0); x.lineTo(gx + gw, h * 0.82); x.closePath(); x.fill();
    x.fillStyle = "#6b6f7a"; x.fillRect(gx - 8, h * 0.8, gw + 16, 8);
    x.fillStyle = "#2a2d38"; x.textAlign = "center";
    x.font = `800 ${Math.round(w / 24)}px Georgia, serif`; x.fillText(B8.fullName(c), w / 2, gy + gw * 0.4, gw - 28);
    x.font = `600 ${Math.round(w / 28)}px Georgia, serif`; x.fillText(c.born + " — " + (c.born + c.age), w / 2, gy + gw * 0.4 + w / 18);
    const fl = ["#ff6b8b", "#ffd166", "#fff", "#b78cff"];
    for (let i = 0; i < 7; i++) { x.fillStyle = "#3f7a3a"; x.fillRect(gx + 10 + i * (gw - 20) / 6, h * 0.76, 2, 10); x.fillStyle = fl[i % 4]; x.fillRect(gx + 7 + i * (gw - 20) / 6, h * 0.74, 8, 6); }
    if ((c.pets || []).length) { x.font = `${Math.round(w / 16)}px sans-serif`; x.fillText(B8.pets.PK[(c.pets[0] || {}).k] ? B8.pets.PK[c.pets[0].k][1] : "", gx + gw + 26, h * 0.8); }
  };
})();
