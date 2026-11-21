/* 1 из 8 миллиардов — пиксельные портреты, карта мира и колесо стран. */
(function () {
  "use strict";
  const B8 = (window.B8 = window.B8 || {});
  const SKIN = {
    south_asia: ["#8d5524", "#a86b3c", "#c68642", "#9a6233"], east_asia: ["#f1c27d", "#e0ac69", "#f5d0a9"], se_asia: ["#c68642", "#d8a06a", "#e0ac69"],
    africa: ["#4a2c1a", "#5c3a21", "#3b2416", "#6b4226"], mideast: ["#c68642", "#d8a06a", "#e0ac69", "#b07b4f"], latam: ["#c68642", "#e0ac69", "#8d5524", "#f1c27d", "#6b4226"],
    w_europe: ["#f5d0a9", "#f1c27d", "#ffe0bd", "#e0ac69"], e_europe: ["#ffe0bd", "#f5d0a9", "#f1c27d"], n_america: ["#ffe0bd", "#f1c27d", "#c68642", "#5c3a21", "#e0ac69"],
    c_asia: ["#e0ac69", "#d8a06a", "#f1c27d"],
  };
  const DARK = ["#1d1410", "#2a1d16", "#151012", "#3a2618"], LIGHT = ["#5a3a22", "#8a5a2b", "#c9a15a", "#e3c27a", "#7a2f1a"];
  const SHIRT = ["#c0504d", "#4f81bd", "#9bbb59", "#8064a2", "#f79646", "#4bacc6", "#d9d9d9", "#e06c8c", "#3f9e8f", "#b8860b"];
  const SCARF = ["#3a3f6b", "#6b3a52", "#2f5d50", "#1f1f2a", "#7a5c3a", "#8a2f3a", "#c9b38a"];
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // внешность задаётся при рождении и не меняется (кроме возраста)
  B8.makeLook = function (c) {
    const k = B8.K(c.cc), h = hash(c.seed + ":" + c.first);
    const pk = (arr, n) => arr[(h >>> n) % arr.length];
    const light = ["w_europe", "e_europe", "n_america"].includes(k.reg) && (h & 7) < 3;
    return {
      skin: pk(SKIN[k.reg] || SKIN.n_america, 3), hair: light ? pk(LIGHT, 7) : pk(DARK, 7), style: (h >>> 11) % 4, shirt: pk(SHIRT, 13),
      glasses: ((h >>> 17) & 7) === 0, beard: c.sex === "m" && ((h >>> 19) & 3) === 0 && ["mideast", "south_asia", "c_asia"].includes(k.reg) ? 2 : c.sex === "m" && ((h >>> 19) & 7) === 0 ? 1 : 0,
      hijab: c.sex === "f" && c.rel === "isl" && ["mideast", "south_asia", "se_asia", "c_asia", "africa"].includes(k.reg) && ((h >>> 21) % 10) < 6, scarf: pk(SCARF, 23),
      turban: c.sex === "m" && c.rel === "sikh", kippah: c.sex === "m" && c.rel === "jew" && ((h >>> 25) & 3) === 0, eyes: k.reg === "east_asia" || k.reg === "c_asia" ? 1 : 0,
    };
  };
  // портрет 24×24 «пикселя» в canvas
  B8.portrait = function (cv, c, age, opt) {
    opt = opt || {};
    const L = c.look || (c.look = B8.makeLook(c));
    const S = 24, px = cv.width / S, x = cv.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, cv.width, cv.height);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a * px), Math.round(b * px), Math.ceil(w * px), Math.ceil(h * px)); };
    age = age == null ? c.age : age;
    const bg = opt.bg || ["#3b3f55", "#3f4a5e", "#3f5a5e", "#4a5a3f", "#5e4f2f"][Math.max(0, Math.min(4, c.ls))];
    if (!opt.nobg) { P(0, 0, S, S, bg); P(0, 18, S, 6, "rgba(0,0,0,.18)"); }
    const dead = c.alive === false && age >= c.age;
    const baby = age < 3, kid = age < 12, old = age >= 65, mid = age >= 48;
    let hair = L.hair;
    if (age >= 70) hair = "#d9d9d9"; else if (age >= 58) hair = "#9a9a9a"; else if (mid && L.style === 1) hair = "#6d6d6d";
    const sk = L.skin;
    const shirt = c.jail && age === c.age ? "#e07b28" : opt.suit || (c.crime && c.crime.rank >= 4 && age >= 25) ? "#22242c" : (c.biz && age >= 25 && age === c.age) ? "#2f3d5c" : L.shirt;
    // плечи и одежда
    const shW = baby ? 10 : kid ? 12 : 16, shX = (S - shW) / 2;
    P(shX, 19, shW, 5, shirt);
    if (shirt === "#22242c" || shirt === "#2f3d5c") { P(11, 19, 2, 5, "#e8e8e8"); P(11.5, 20, 1, 3.5, shirt === "#22242c" ? "#8a1c1c" : "#c9a227"); }
    // шея и голова
    const hw = baby ? 10 : kid ? 10 : 10, hh = baby ? 10 : kid ? 11 : 12, hx = (S - hw) / 2, hy = baby ? 8 : kid ? 6 : 5;
    P(10.5, hy + hh - 1, 3, 3, sk);
    P(hx, hy + 1, hw, hh - 2, sk); P(hx + 1, hy, hw - 2, hh, sk);
    // волосы / головной убор
    if (L.hijab && age >= 12) {
      P(hx - 1, hy - 1, hw + 2, 4, L.scarf); P(hx - 1, hy, 2, hh + 2, L.scarf); P(hx + hw - 1, hy, 2, hh + 2, L.scarf); P(shX + 2, 18, shW - 4, 2, L.scarf);
    } else if (L.turban && age >= 6) {
      P(hx - 1, hy - 3, hw + 2, 5, L.scarf); P(hx + 3, hy - 4, 4, 2, L.scarf);
      if (age >= 18) { P(hx + 1, hy + hh - 3, hw - 2, 3, hair); P(hx + 3, hy + hh - 1, 4, 2, hair); }
    } else if (!(age >= 60 && c.sex === "m" && L.style === 3)) {
      if (baby) P(hx + 3, hy - 1, 4, 2, hair);
      else if (c.sex === "f" && L.style !== 3) { P(hx - 1, hy - 1, hw + 2, 4, hair); P(hx - 1, hy, 2, age < 60 ? hh + 1 : hh - 3, hair); P(hx + hw - 1, hy, 2, age < 60 ? hh + 1 : hh - 3, hair); if (L.style === 2) P(hx + 3, hy - 3, 4, 2, hair); }
      else { P(hx - 1, hy - 1, hw + 2, 3, hair); P(hx - 1, hy, 1, 4, hair); P(hx + hw, hy, 1, 4, hair); if (L.style === 1) P(hx + 1, hy - 2, hw - 2, 1, hair); }
    } else P(hx - 1, hy + 2, 1, 3, hair), P(hx + hw, hy + 2, 1, 3, hair);
    if (L.kippah && age >= 13) P(hx + 3, hy - 1, 4, 1, "#2f3d5c");
    // лицо
    const ey = hy + (baby ? 5 : 5);
    const eye = dead ? "#555" : "#1b1b22";
    if (L.eyes) { P(hx + 2, ey, 2, 0.8, eye); P(hx + hw - 4, ey, 2, 0.8, eye); } else { P(hx + 2.5, ey, 1, 1, eye); P(hx + hw - 3.5, ey, 1, 1, eye); }
    if (c.fug && age === c.age) { P(hx + 1, ey - 0.5, hw - 2, 2, "#0c0c10"); P(hx - 1, hy - 1, hw + 2, 2.5, "#2a2d38"); P(hx + hw - 2, hy + 1, 4, 1, "#2a2d38"); }
    else if (c.crime && c.crime.rank >= 4 && age >= 25 && age === c.age && !c.jail) { P(hx + 1, ey - 0.5, hw - 2, 2, "#0c0c10"); }
    else if ((L.glasses && age >= 10) || (age >= 50 && L.style !== 0)) { x.strokeStyle = "#2a2a30"; x.lineWidth = Math.max(1, px * 0.5); x.strokeRect((hx + 1.5) * px, (ey - 0.6) * px, 2.6 * px, 2.2 * px); x.strokeRect((hx + hw - 4.1) * px, (ey - 0.6) * px, 2.6 * px, 2.2 * px); }
    const hap = opt.hap != null ? opt.hap : c.hap;
    const my = hy + hh - 3.2;
    if (dead) P(hx + 4, my, 2, 0.8, "#6b3a3a");
    else if (hap > 62) { P(hx + 3, my, 1, 0.8, "#8a3a3a"); P(hx + 4, my + 0.8, 2, 0.8, "#8a3a3a"); P(hx + 6, my, 1, 0.8, "#8a3a3a"); }
    else if (hap < 35) { P(hx + 3, my + 0.8, 1, 0.8, "#6b3a3a"); P(hx + 4, my, 2, 0.8, "#6b3a3a"); P(hx + 6, my + 0.8, 1, 0.8, "#6b3a3a"); }
    else P(hx + 3.5, my + 0.4, 3, 0.8, "#7a3e3e");
    if (L.beard && age >= 22 && !kid) P(hx + (L.beard === 2 ? 0.5 : 2), hy + hh - 4, hw - (L.beard === 2 ? 1 : 4), L.beard === 2 ? 4 : 2, hair);
    if (c.flags && c.flags.face_tattoo && age >= 18) { P(hx + hw - 3, ey + 1.5, 1, 1, "#2f3d5c"); P(hx + hw - 2.5, ey + 2.5, 1, 1, "#2f3d5c"); }
    if (L.scar && age >= 18) P(hx + 2, ey + 2, 2, 0.5, "rgba(120,40,40,.6)");
    if (old) { P(hx + 1.5, ey + 2, 1.5, 0.5, "rgba(0,0,0,.25)"); P(hx + hw - 3, ey + 2, 1.5, 0.5, "rgba(0,0,0,.25)"); P(hx + 3, hy + 2, 4, 0.5, "rgba(0,0,0,.18)"); }
    if (baby) { P(hx + 1.5, ey + 2, 1.5, 1, "rgba(255,120,120,.35)"); P(hx + hw - 3, ey + 2, 1.5, 1, "rgba(255,120,120,.35)"); }
    if (dead) { x.fillStyle = "rgba(20,20,30,.45)"; x.fillRect(0, 0, cv.width, cv.height); }
  };

  // ── карта мира из точек ──
  const G = () => B8.MAPGEO;
  B8.mapXY = function (lat, lon, w, h) {
    const g = G(); let lo = lon; if (lo < g.lon0) lo += 360;
    return [((lo - g.lon0) / (g.lon1 - g.lon0)) * w, ((g.lat0 - lat) / (g.lat0 - g.lat1)) * h];
  };
  B8.drawMap = function (cv, opt) {
    opt = opt || {};
    const x = cv.getContext("2d"), m = B8.LANDMASK, rows = m.length, cols = m[0].length;
    const w = cv.width, h = cv.height, sx = w / cols, sy = h / rows;
    x.clearRect(0, 0, w, h);
    x.fillStyle = opt.dot || "rgba(150,170,190,.35)";
    const r = Math.max(1, Math.min(sx, sy) * 0.32);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (m[i][j] === "1") { x.beginPath(); x.arc(j * sx + sx / 2, i * sy + sy / 2, r, 0, 6.283); x.fill(); }
    for (const [code, col, rad] of opt.marks || []) {
      const k = B8.K(code); if (!k) continue;
      const [px, py] = B8.mapXY(k.lat, k.lon, w, h);
      x.fillStyle = col; x.beginPath(); x.arc(px, py, rad || r * 3, 0, 6.283); x.fill();
    }
  };

  // ── колесо стран: сектор = доля рождений на Земле ──
  const WCOL = ["#e4572e", "#29335c", "#f3a712", "#a8c686", "#669bbc", "#c1666b", "#4b3f72", "#d4b483", "#48a9a6", "#e4dfda", "#7d8491", "#b33f62"];
  B8.wheelOrder = function () {
    return B8.COUNTRIES.slice().sort((a, b) => b.pop * b.br - a.pop * a.br);
  };
  B8.drawWheel = function (cv, ang, hi) {
    const x = cv.getContext("2d"), w = cv.width, r = w / 2 - 6, cx = w / 2, cy = w / 2;
    x.clearRect(0, 0, w, w);
    const list = B8.wheelOrder();
    const tot = list.reduce((s, k) => s + k.pop * k.br, 0);
    let a0 = ang;
    x.save();
    list.forEach((k, i) => {
      const da = ((k.pop * k.br) / tot) * Math.PI * 2;
      x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, a0, a0 + da); x.closePath();
      x.fillStyle = k.c === hi ? "#ffd166" : WCOL[i % WCOL.length]; x.fill();
      if (da > 0.12) {
        x.save(); x.translate(cx, cy); x.rotate(a0 + da / 2); x.textAlign = "right"; x.fillStyle = k.c === hi ? "#1b1b22" : i % WCOL.length === 9 ? "#29335c" : "#fff";
        x.font = `bold ${Math.max(10, Math.min(16, da * 60))}px system-ui, sans-serif`; x.fillText(k.n.length > 11 ? k.c : k.n, r - 8, 5); x.restore();
      }
      a0 += da;
    });
    x.restore();
    x.beginPath(); x.arc(cx, cy, r, 0, 6.283); x.lineWidth = 5; x.strokeStyle = "#1b1b22"; x.stroke();
    x.beginPath(); x.arc(cx, cy, r * 0.14, 0, 6.283); x.fillStyle = "#1b1b22"; x.fill();
    x.fillStyle = "#ffd166"; x.font = `bold ${Math.round(r * 0.09)}px system-ui`; x.textAlign = "center"; x.fillText("8 млрд", cx, cy + r * 0.035);
  };
  // угол поворота, при котором страна окажется под стрелкой (стрелка сверху)
  B8.wheelAngleFor = function (code, jitter) {
    const list = B8.wheelOrder(), tot = list.reduce((s, k) => s + k.pop * k.br, 0);
    let acc = 0;
    for (const k of list) {
      const da = ((k.pop * k.br) / tot) * Math.PI * 2;
      if (k.c === code) { const mid = acc + da * (0.2 + 0.6 * (jitter == null ? 0.5 : jitter)); return -Math.PI / 2 - mid; }
      acc += da;
    }
    return 0;
  };
})();
