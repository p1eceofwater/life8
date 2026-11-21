/* 1 из 8 миллиардов — интерфейс: меню, колесо стран, свидетельство, жизнь (полоса года, скорость, фокус, ПК-раскладка),
   дела, казино, тёмные дела и ограбления, тюрьма и бега, газеты, итоги, обучение, горячие клавиши. */
(function () {
  "use strict";
  const B8 = window.B8, R = B8.R;
  const VERSION = "2.0.0";
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const sfx = (n) => B8.audio && B8.audio.sfx(n);
  const money = (x) => B8.money(x);
  const P = () => B8.platform;
  const isPC = () => window.matchMedia("(min-width: 860px) and (min-height: 560px)").matches;
  const isWide = () => window.matchMedia("(min-width: 1180px) and (min-height: 560px)").matches;
  let S = null; // текущая жизнь
  let M = null; // всё, что живёт дольше одной жизни
  const UI = { screen: "menu", sheet: null, logShown: 0, lastAge: -1, rerolls: 0, mode: "new", endRendered: false, focusKey: "" };
  B8.ui = UI;
  // время: полоса года идёт сама; решения ставят на паузу
  const TL = { run: false, sp: 1, skip: false, t: 0, last: performance.now(), q: [], cap: 0 };
  const YEAR_MS = 6500;

  // ═════ сохранение ═════
  const KEY_L = "b8_life", KEY_M = "b8_meta";
  function defMeta() { return { v: 2, atlas: {}, ach: {}, st: { lives: 0, years: 0, maxAge: 0, maxNet: 0, kids: 0, jail: 0, bosses: 0, heists: 0, escapes: 0 }, set: { sound: true, spd: 1, voice: true }, tut: 0, lastAd: 0, daily: {}, codes: 0 }; }
  function loadAll() {
    try { M = Object.assign(defMeta(), JSON.parse(localStorage.getItem(KEY_M) || "null") || {}); } catch (e) { M = defMeta(); }
    M.set = Object.assign({ sound: true, spd: 1, voice: true }, M.set || {}); M.st = Object.assign(defMeta().st, M.st || {});
    try { S = JSON.parse(localStorage.getItem(KEY_L) || "null"); } catch (e) { S = null; }
    if (S && (!S.v || S.done)) S = S.done ? S : null;
    if (S) B8.migrate(S);
    B8.audio.on = M.set.sound !== false;
  }
  let saveT = 0;
  function save(force) {
    try { localStorage.setItem(KEY_M, JSON.stringify(M)); if (S) localStorage.setItem(KEY_L, JSON.stringify(S)); else localStorage.removeItem(KEY_L); } catch (e) {}
    const now = Date.now();
    if (force || now - saveT > 20000) { saveT = now; cloudPush(force); }
  }
  function cloudPush(force) {
    if (!P() || !P().vk) return;
    let life = null;
    if (S) life = Object.assign({}, S, { log: S.log.slice(-220), snaps: [] });
    P().cloudSave({ m: M, l: life, at: Date.now() }, force);
  }
  B8.toast = toast;

  // ═════ мелочи ═════
  function toast(t, kind) {
    const d = document.createElement("div");
    d.className = "toast " + (kind || "");
    d.innerHTML = t;
    $("#toasts").appendChild(d);
    while ($("#toasts").children.length > 4) $("#toasts").firstElementChild.remove();
    setTimeout(() => d.remove(), 3200);
  }
  function show(name) {
    UI.screen = name;
    for (const s of $$(".scr")) s.hidden = s.id !== "scr-" + name;
    if (name !== "life") { TL.run = false; TL.skip = false; }
    if (name === "menu") renderMenu();
    if (name === "life") renderLife(true);
    TUT.ev("screen:" + name);
  }
  const LOCKED = ["decision", "result", "casino", "confirm", "heist", "mg"];
  function sheet(html, kind, onClose) {
    UI.sheet = kind || "sheet";
    UI.onClose = onClose || null;
    const card = $("#sheet-card");
    card.innerHTML = html;
    card.scrollTop = 0;
    card.className = "k-" + UI.sheet;
    $("#sheet").hidden = false;
    TUT.ev("sheet:" + UI.sheet);
    return card;
  }
  function closeSheet() {
    $("#sheet").hidden = true;
    const k = UI.sheet;
    UI.sheet = null;
    if (B8.mg) B8.mg.active = null;
    if (UI.onClose) { const f = UI.onClose; UI.onClose = null; f(); }
    TUT.ev("closed:" + k);
    if (UI.screen === "life") renderLife();
  }
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet" && !LOCKED.includes(UI.sheet)) closeSheet(); });
  const ageWord = (n) => n + " " + B8.years(n);
  const pct = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const cntry = (code) => B8.K(code).n;
  const F = (s, d) => B8.fmt(S, s, d);
  const kv = (a, b) => `<div class="kv"><span>${a}</span><span>${b}</span></div>`;
  const meter = (label, v, col, shown) => `<div class="mt"><span>${label}<b>${shown != null ? shown : Math.round(v) + "%"}</b></span><div class="meter"><i style="width:${pct(v)}%;background:${col}"></i></div></div>`;

  // ═════ меню ═════
  let mapAnim = 0, births = 0, bornT0 = 0;
  function renderMenu() {
    const has = S && S.alive && !S.done;
    const today = new Date().toISOString().slice(0, 10);
    const b = [];
    if (has) b.push(`<button class="btn big primary" data-a="cont">▶ Продолжить жизнь<small>${esc(B8.fullName(S))}, ${ageWord(S.age)} · ${esc(cntry(S.cur))}${S.jail ? " · за решёткой" : S.fug ? " · в бегах" : ""}</small></button>`);
    b.push(`<button class="btn big ${has ? "" : "primary"}" data-a="new">🎲 Новая жизнь<small>колесо решит, где ты родишься</small></button>`);
    b.push(`<div class="row"><button class="btn" data-a="daily">📅 Жизнь дня<small>${M.daily[today] ? "уже прожита" : "одна на всех сегодня"}</small></button><button class="btn" data-a="code">🔑 Код судьбы<small>прожить чужую жизнь</small></button></div>`);
    b.push(`<div class="row"><button class="btn" data-a="atlas">🗺 Атлас<small>${Object.keys(M.atlas).length} из 69 стран</small></button><button class="btn" data-a="ach">🏆 Достижения<small>${Object.keys(M.ach).length} из ${ACH.length}</small></button></div>`);
    b.push(`<div class="row"><button class="btn" data-a="stats">📊 Статистика<small>${M.st.lives} ${plural(M.st.lives, "жизнь", "жизни", "жизней")}</small></button><button class="btn" data-a="set">⚙ Настройки<small>звук, скорость, совесть</small></button></div>`);
    b.push(`<button class="btn ghost" data-a="about">ℹ Об игре</button>`);
    $("#menu-btns").innerHTML = b.join("");
    $("#ver").textContent = "v" + VERSION;
    bornT0 = performance.now(); births = 0;
    if (!mapAnim) mapLoop();
  }
  function plural(n, a, b, c) { const x = Math.abs(n) % 100, y = x % 10; return x > 10 && x < 20 ? c : y === 1 ? a : y >= 2 && y <= 4 ? b : c; }
  const flashes = [];
  function mapLoop() {
    mapAnim = requestAnimationFrame(mapLoop);
    if (UI.screen !== "menu") return;
    const cv = $("#menu-map");
    const t = (performance.now() - bornT0) / 1000, n = Math.floor(t * 4.3);
    while (births < n) { births++; const k = pickBirth(); flashes.push([k.c, performance.now()]); }
    while (flashes.length && performance.now() - flashes[0][1] > 1800) flashes.shift();
    B8.drawMap(cv, { marks: flashes.map(([c, t0]) => { const a = 1 - (performance.now() - t0) / 1800; return [c, `rgba(255,209,102,${a.toFixed(2)})`, 3 + (1 - a) * 9]; }) });
    $("#born-count").innerHTML = `Пока открыто меню, на Земле родил${births % 10 === 1 && births % 100 !== 11 ? "ся" : "ись"} <b>${births}</b> ${plural(births, "ребёнок", "ребёнка", "детей")}`;
  }
  const bw = B8.COUNTRIES.map((k) => k.pop * k.br), bt = bw.reduce((a, b) => a + b, 0);
  function pickBirth() { let x = Math.random() * bt; for (let i = 0; i < bw.length; i++) { x -= bw[i]; if (x <= 0) return B8.COUNTRIES[i]; } return B8.COUNTRIES[0]; }
  $("#menu-btns").addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    sfx("click");
    const a = b.dataset.a;
    if (a === "cont") { show("life"); if (S.pend.length) openDecision(); }
    if (a === "new") { if (S && S.alive && !S.done) confirmNew(() => newLife(B8.newSeed(), "new")); else newLife(B8.newSeed(), "new"); TUT.ev("newLife"); }
    if (a === "daily") { const d = new Date().toISOString().slice(0, 10); const go = () => newLife(B8.dailySeed(d), "daily"); if (S && S.alive && !S.done) confirmNew(go); else go(); }
    if (a === "code") openCode();
    if (a === "atlas") openAtlas();
    if (a === "ach") openAch();
    if (a === "stats") openStats();
    if (a === "set") openSettings();
    if (a === "about") openAbout();
  });
  function confirmNew(go) {
    sheet(`<h2>Начать новую жизнь?</h2><p>Текущая жизнь (${esc(B8.fullName(S))}, ${ageWord(S.age)}) будет потеряна без итогов.</p><div class="opts"><button class="btn big danger" data-x="y">Да, новая жизнь</button><button class="btn big" data-x="n">Отмена</button></div>`, "confirm").onclick = (e) => {
      const x = e.target.closest("[data-x]"); if (!x) return;
      closeSheet(); if (x.dataset.x === "y") go();
    };
  }

  // ═════ новая жизнь и колесо ═════
  function newLife(seed, mode, heir) {
    UI.mode = mode; UI.rerolls = mode === "new" ? UI.rerolls : 0;
    const start = () => {
      S = heir || B8.newLife(seed);
      S.meta.mode = mode;
      if (TUT.active()) S.flags.tut = 1;
      S.peers = [0, 1, 2].map(() => Math.floor(B8.rnd(S) * 31 ** 6));
      UI.logShown = 0; UI.endRendered = false; TL.t = 0; TL.q = []; TL.cap = S.log.length;
      if (heir) { renderBirth(); show("birth"); return; }
      openWheel();
    };
    const now = Date.now();
    if (M.st.lives >= 1 && now - (M.lastAd || 0) > 180000 && P() && P().hasAds() && TUT.done()) { M.lastAd = now; P().interstitial(start); }
    else start();
  }
  let wheelAng = 0, spinning = false;
  function openWheel() {
    show("wheel");
    $("#wheel-res").innerHTML = UI.mode === "daily" ? "Жизнь дня: одно рождение для всех игроков сегодня." : UI.mode === "code" ? "Код судьбы: колесо уже знает ответ." : "Сектор страны — её доля в рождениях на Земле.";
    $("#spin").hidden = false; $("#wheel-go").hidden = true;
    B8.drawWheel($("#wheel"), wheelAng);
  }
  $("#spin").onclick = () => {
    if (spinning) return;
    spinning = true; sfx("click");
    $("#spin").hidden = true;
    const target = B8.wheelAngleFor(S.cc, B8.rnd(S)), from = wheelAng;
    let to = target; while (to < from + Math.PI * 10) to += Math.PI * 2;
    const t0 = performance.now(), dur = 3600;
    let lastTick = 0;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      wheelAng = from + (to - from) * e;
      B8.drawWheel($("#wheel"), wheelAng, p >= 1 ? S.cc : null);
      const tickEvery = 0.18 + p * 0.5;
      if ((wheelAng - from) / tickEvery > lastTick) { lastTick = Math.ceil((wheelAng - from) / tickEvery); sfx("tick"); }
      if (p < 1) requestAnimationFrame(step);
      else {
        spinning = false; wheelAng = to % (Math.PI * 2);
        const k = B8.K(S.cc), sh = B8.birthShare(k.c);
        $("#wheel-res").innerHTML = `Ты родишься здесь:<b>${esc(k.n)}</b>Так рождается ${sh >= 1 ? sh.toFixed(1).replace(".", ",") : sh.toFixed(2).replace(".", ",")}% детей Земли`;
        $("#wheel-go").hidden = false; sfx("birth");
        TUT.ev("spun");
      }
    };
    requestAnimationFrame(step);
  };
  $("#wheel-go").onclick = () => { sfx("click"); renderBirth(); show("birth"); TUT.ev("toBirth"); };

  // ═════ свидетельство о рождении ═════
  function renderBirth() {
    const k = B8.K(S.cc), c = S;
    const sibs = c.sibs.length ? c.sibs.map((s) => `${esc(s.n.split(" ")[0])} (${s.sex === "m" ? "брат" : "сестра"}, ${-s.born})`).join(", ") : "нет";
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    $("#cert").innerHTML = `<h2>Свидетельство о рождении</h2><div class="doc">№ ${esc(c.doc)}${c.gen > 1 ? " · поколение " + c.gen : ""}</div>
      <div class="top"><canvas id="cert-cv" width="96" height="96"></canvas><div><div class="nm">${esc(B8.fullName(c))}</div>${c.patr ? `<div>отчество: ${esc(c.patr)}</div>` : ""}<div>${c.sex === "m" ? "мальчик" : "девочка"}, ${months[c.month - 1]} ${c.born}</div></div></div>
      <div class="row"><span>Место рождения</span><span>${esc(c.urban ? c.city : "деревня у города " + c.city)}, ${esc(k.n)}</span></div>
      <div class="row"><span>Мать</span><span>${esc(c.mother.n)}, ${-c.mother.born}, ${esc(c.mother.job || "")}</span></div>
      <div class="row"><span>Отец</span><span>${esc(c.father.n)}, ${-c.father.born}, ${esc(c.father.job || "")}</span></div>
      <div class="row"><span>Братья и сёстры</span><span>${sibs}</span></div>
      <div class="row"><span>Вера семьи</span><span>${c.rel === "none" ? "нет" : esc(B8.RELN[c.rel])}</span></div>
      <div class="row"><span>Достаток семьи</span><span>${esc(B8.QLABEL[c.q - 1])}</span></div>
      <div class="row"><span>Жизнь семьи</span><span>${esc(B8.LS[c.ls])}</span></div>
      <div class="note">В среднем здесь живут до ${Math.round(B8.lifeExp(k, c.sex))} лет. Твоя семья богаче ${B8.percentile(c)}% людей Земли.</div>`;
    B8.portrait($("#cert-cv"), c, 0, { bg: "#e6d9b8" });
    $("#cert-re").hidden = UI.mode !== "new" || c.gen > 1;
    $("#cert-re").textContent = UI.rerolls ? `↻ Переродиться (уже ${UI.rerolls})` : "↻ Переродиться";
  }
  $("#cert-go").onclick = () => {
    sfx("good");
    show("life");
    save(true);
    TUT.ev("lifeStart");
    if (TUT.done()) play(M.set.spd || 1);
  };
  $("#cert-re").onclick = () => {
    UI.rerolls++;
    if (UI.rerolls === 3) toast("У настоящих восьми миллиардов такой кнопки нет.", "gold");
    S = B8.newLife(B8.newSeed()); S.meta.mode = "new"; S.peers = [0, 1, 2].map(() => Math.floor(B8.rnd(S) * 31 ** 6));
    openWheel();
  };

  // ═════ экран жизни ═════
  const STATS = [["h", "❤️", "Здоровье", "#ff6b6b"], ["hap", "😊", "Счастье", "#ffd166"], ["iq", "🧠", "Ум", "#6aa9ff"], ["soc", "🤝", "Люди", "#5fd38d"], ["st", "😣", "Стресс", "#b78cff"]];
  let prevSt = {};
  function renderLife(full) {
    if (!S) return;
    const c = S;
    if (full) { TL.cap = c.log.length; TL.q = []; UI.focusKey = ""; }
    const scr = $("#scr-life");
    scr.classList.toggle("m-jail", !!c.jail); scr.classList.toggle("m-fug", !!c.fug);
    B8.portrait($("#me-cv"), c);
    $("#who-name").textContent = B8.fullName(c);
    $("#who-sub").textContent = `${ageWord(c.age)} · ${B8.stage(c)}`;
    const k = B8.K(c.cur);
    $("#who-place").textContent = `${c.urban ? c.city : "деревня, " + c.city} · ${k.n}${c.emig ? " (эмиграция)" : ""} · ${B8.ECON[B8.econ(c)]}`;
    const m = $("#money");
    m.textContent = c.age < 16 && Math.abs(c.money) < 1 ? "" : money(c.money);
    m.classList.toggle("neg", c.money < 0);
    $("#stats").innerHTML = STATS.map(([key, ic, lab, col]) => {
      const v = pct(c[key]), d = prevSt[key] == null ? 0 : v - prevSt[key];
      const cls = Math.abs(d) >= 3 ? ((key === "st" ? d < 0 : d > 0) ? "up" : "dn") : "";
      return `<div class="st ${cls}" title="${lab}">${ic} ${lab}<b>${v}</b><div class="bar"><i style="width:${v}%;background:${col}"></i></div></div>`;
    }).join("");
    if (UI.lastAge !== c.age) { prevSt = {}; STATS.forEach(([k]) => (prevSt[k] = pct(c[k]))); UI.lastAge = c.age; }
    renderFocus(); renderMode(); renderLog(full); paintTL();
    $("#btn-year").disabled = !c.alive;
    renderDossier(); renderActsPanel();
  }
  function renderFocus() {
    const c = S, box = $("#focus"), set = B8.focusSet(c);
    if (!set.length) { const k = "none" + c.age; if (UI.focusKey !== k) { UI.focusKey = k; box.innerHTML = `<span class="fl">🎯</span><span class="fc off">Фокус года появится в 6 лет</span>`; } return; }
    if (!c.focus || !set.some((f) => f[0] === c.focus)) c.focus = B8.defFocus(c);
    const key = set.map((f) => f[0]).join() + c.focus;
    if (key === UI.focusKey) return;
    UI.focusKey = key;
    const cur = set.find((f) => f[0] === c.focus);
    const setKey = set.map((f) => f[0]).join();
    box.innerHTML = `<span class="fl" title="Фокус года">🎯</span>` + set.map(([k, l, h]) => `<button class="fc ${c.focus === k ? "on" : ""}" data-f="${k}" title="${esc(h)}">${esc(l)}</button>`).join("") + (cur ? `<span class="fh">${esc(cur[2])}</span>` : "");
    if (UI.focusSet !== setKey) { UI.focusSet = setKey; box.scrollLeft = 0; }
    const on = box.querySelector(".fc.on");
    if (on && (on.offsetLeft < box.scrollLeft || on.offsetLeft + on.offsetWidth > box.scrollLeft + box.clientWidth)) box.scrollLeft = Math.max(0, on.offsetLeft - 40);
  }
  $("#focus").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b || !S || !S.alive) return;
    setFocus(b.dataset.f);
  });
  function setFocus(k) {
    const set = B8.focusSet(S), f = set.find((x) => x[0] === k);
    if (!f) return;
    S.focus = k; sfx("click"); UI.focusKey = "";
    renderFocus(); renderActsPanel();
    toast(`🎯 ${esc(f[1])} <small>${esc(f[2])}</small>`);
    TUT.ev("focus");
  }
  function cycleFocus() { const set = B8.focusSet(S); if (!set.length) return; const i = set.findIndex((x) => x[0] === S.focus); setFocus(set[(i + 1) % set.length][0]); }
  function renderMode() {
    const c = S, box = $("#modebar");
    let h = "", cls = "";
    const PR = B8.prison;
    if (c.jail && c.pr) {
      const p = c.pr; cls = "jail";
      h = `<b>⛓ ${esc(p.name)}</b> · ${p.life ? "пожизненно" : "осталось " + ageWord(c.jail)} · ${PR.RANKS[p.rank]} · 💪 ${Math.round(p.resp)} · ⚠️ ${Math.round(p.dang)} · 🚬 ${p.cig} · 🍜 ${p.nood}${p.plan ? ` · ${PR.PLAN[p.plan][0]} ${Math.round(p.prep)}%` : ""}`;
    } else if (c.fug) {
      const f = c.fug; cls = "fug";
      h = `<b>🚨 В розыске ${Math.round(f.wanted)}%</b> · в бегах ${ageWord(f.y)}${f.docs ? " · 🪪 документы" : ""}${f.face ? " · 💉 новое лицо" : ""}${f.abroad ? " · " + esc(cntry(f.abroad)) : ""}`;
    } else if (c.crime.on || (c.crime.ev || 0) > 8 || c.crime.heat > 25) {
      const cr = c.crime; cls = "crime";
      h = `<b>🕶 ${cr.on ? esc(cr.orgName) + " · " + esc(B8.crime.rankTitle(c)) : "Тёмные делишки"}</b> · 🧾 улики ${Math.round(cr.ev || 0)}% · 🚓 полиция ${Math.round(cr.heat)}%`;
    } else h = `<b>${c.born + c.age}:</b> ${esc(B8.ticker(c))} · Ты богаче ${B8.percentile(c)}% людей Земли`;
    box.className = "modebar " + cls;
    box.innerHTML = h;
  }
  function renderLog(full) {
    const box = $("#log"), c = S, upto = Math.min(c.log.length, TL.cap);
    if (full || UI.logShown > upto) { box.innerHTML = ""; UI.logShown = Math.max(0, upto - 160); if (UI.logShown) box.innerHTML = `<button class="btn sm ghost more" data-more="1">Показать раньше</button>`; }
    let html = "", lastAge = UI.logShown ? c.log[UI.logShown - 1][0] : -1;
    const lastNode = box.lastElementChild;
    if (lastNode && lastNode.dataset && lastNode.dataset.age != null) lastAge = +lastNode.dataset.age;
    for (let i = UI.logShown; i < upto; i++) { const r = entry(c.log[i], lastAge, !full); lastAge = c.log[i][0]; html += r; }
    UI.logShown = upto;
    if (html) { box.insertAdjacentHTML("beforeend", html); drawScenes(box); box.scrollTop = box.scrollHeight; }
  }
  function entry(l, lastAge, fresh) {
    const [a, t, k, why, big, sc] = l;
    let h = "";
    if (a !== lastAge) h += `<div class="yr" data-age="${a}">${ageWord(a)}<small>${S.born + a}</small></div>`;
    if (k === "c" && M.set.voice === false) return h;
    if (sc) h += `<canvas class="scene" width="192" height="96" data-sc="${sc}" data-age="${a}"></canvas>`;
    if (k === "p") return h + `<div class="ev p${fresh ? " new" : ""}" data-age="${a}"><div class="np"><small>📰 ${esc(why)}</small><b>${esc(t)}</b></div></div>`;
    return h + `<div class="ev ${k}${big ? " big" : ""}${fresh ? " new" : ""}" data-age="${a}"><i></i><span>${esc(t)}${why ? `<em>← ${esc(why)}</em>` : ""}</span></div>`;
  }
  function drawScenes(box) { for (const cv of $$("canvas.scene:not([data-done])", box)) { B8.drawScene(cv, cv.dataset.sc, S); cv.dataset.done = 1; } }
  $("#log").addEventListener("click", (e) => {
    if (!e.target.closest("[data-more]")) return;
    const box = $("#log"), c = S;
    let html = "", lastAge = -1;
    const upto = Math.min(c.log.length, TL.cap);
    for (let i = 0; i < upto; i++) { html += entry(c.log[i], lastAge, false); lastAge = c.log[i][0]; }
    box.innerHTML = html; UI.logShown = upto; drawScenes(box);
  });

  // ═════ ПК: досье слева, дела справа ═════
  function renderDossier() {
    if (!isWide() || !S) return;
    const c = S, p = c.pr, f = c.fug, cr = c.crime, PR = B8.prison;
    let mode = "";
    if (c.jail && p) mode = `<div class="dz jail"><h4>⛓ ${esc(p.name)}</h4>${kv("Срок", p.life ? "пожизненно" : "осталось " + ageWord(c.jail))}${kv("Положение", PR.RANKS[p.rank])}${meter("💪 Уважение", p.resp, "#ffd166")}${meter("⚠️ Опасность", p.dang, "#ff6b6b")}${kv("Валюта", "🚬 " + p.cig + " · 🍜 " + p.nood)}${p.biz ? kv("Своё дело", PR.PBIZ[p.biz][1]) : ""}${p.gang ? kv("Банда", "«" + esc(p.gang) + "»") : ""}${p.cat ? kv("Кот", esc(p.cat)) : ""}${p.plan ? meter(PR.PLAN[p.plan][0] + " " + PR.PLAN[p.plan][1], p.prep, "#5fd38d") + meter("👀 Подозрения охраны", p.sus, "#b78cff") : ""}</div>`;
    else if (f) mode = `<div class="dz fug"><h4>🚨 В розыске</h4>${meter("Розыск", f.wanted, "#ff6b6b")}${kv("В бегах", ageWord(f.y))}${kv("Документы", f.docs ? "фальшивые" : "нет")}${kv("Лицо", f.face ? "после пластики" : "своё")}${f.abroad ? kv("Страна", esc(cntry(f.abroad))) : ""}<button class="btn sm" data-dz="poster">🚨 Посмотреть плакат</button></div>`;
    else if (cr.on || (cr.ev || 0) > 5 || cr.heat > 15 || cr.rec) mode = `<div class="dz crime"><h4>🕶 ${cr.on ? esc(cr.orgName) : "Тёмные дела"}</h4>${cr.on ? kv("Положение", esc(B8.crime.rankTitle(c))) : ""}${meter("Репутация", Math.min(100, cr.rep / 6), "#b78cff", Math.round(cr.rep))}${meter("🧾 Улики", cr.ev || 0, "#ff9f43")}${meter("🚓 Внимание полиции", cr.heat, "#ff6b6b")}${cr.rec ? kv("Судимостей", cr.rec) : ""}${c.counts.heists ? kv("Ограблений", c.counts.heists) : ""}</div>`;
    const fam = [];
    if (c.spouse && c.spouse.alive) fam.push(kv(c.spouse.sex === "f" ? "Жена" : "Муж", esc(c.spouse.n.split(" ")[0])));
    else if (c.date) fam.push(kv("Встречаетесь", esc(c.date.n.split(" ")[0])));
    const kids = c.kids.filter((x) => x.alive);
    if (kids.length) fam.push(kv("Дети", kids.map((x) => esc(x.n.split(" ")[0])).join(", ")));
    if (c.gk) fam.push(kv("Внуки", c.gk));
    fam.push(kv("Родители", [c.mother.alive ? "мама" : "", c.father.alive ? "папа" : ""].filter(Boolean).join(" и ") || "нет"));
    if (c.friend && c.friend.alive) fam.push(kv("Друг", esc(c.friend.n.split(" ")[0])));
    const pets = (c.pets || []).filter((x) => x.alive);
    $("#dossier").innerHTML = `<button class="dz-me" data-dz="me"><canvas id="dz-cv" width="96" height="96"></canvas><div><b>${esc(B8.fullName(c))}</b><small>${ageWord(c.age)} · ${esc(B8.stage(c))}</small><small>${esc(c.city)}, ${esc(B8.K(c.cur).n)}</small></div></button>
      <div class="dz-money"><b class="${c.money < 0 ? "loss" : ""}">${c.age < 16 && Math.abs(c.money) < 1 ? "—" : money(c.money)}</b><small>доход ${money(c.income)} в год · состояние ${money(B8.netWorth(c))}</small></div>
      <div class="dz dz-stats">${STATS.map(([key, ic, lab, col]) => meter(ic + " " + lab, c[key], col, pct(c[key]))).join("")}</div>
      ${mode}
      <div class="dz"><h4>🏠 Жизнь</h4>${kv("Дом", esc(c.house))}${kv("Уровень", esc(B8.LS[c.ls]))}${kv("Место в мире", "богаче " + B8.percentile(c) + "%")}${kv("Образование", esc(B8.EDU[c.edu]))}${kv("Работа", esc(B8.jobTitle(c)))}</div>
      <div class="dz"><h4>👪 Близкие</h4>${fam.join("")}${pets.length ? kv("Питомцы", pets.map((x) => B8.pets.PK[x.k][1] + " " + esc(x.n)).join(", ")) : ""}</div>
      <div class="dz"><h4>📱 Слава</h4>${kv("Подписчики", B8.social.fmtF(c.sm.f || 0))}${kv("Газеты о тебе", (c.paper || []).length ? `<button class="lnk" data-dz="paper">${c.paper.length} 📰</button>` : "пока нет")}</div>`;
    B8.portrait($("#dz-cv"), c);
  }
  $("#dossier").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dz]"); if (!b) return;
    sfx("click");
    if (b.dataset.dz === "me") openProfile();
    if (b.dataset.dz === "poster") openPoster();
    if (b.dataset.dz === "paper") openPapers();
  });
  function actsHTML(groups) {
    return groups.map(([t, items]) => `<h3>${esc(t)}</h3><div class="grid2">${items.map((it) =>
      `<button class="act" data-act="${it.id}" ${it.ok ? "" : "disabled"}><span class="i">${it.icon}</span><span><b>${esc(F(it.label))}</b><small>${esc(F(it.ok ? it.hint || "" : it.why || it.hint || ""))}</small></span></button>`).join("")}</div>`).join("");
  }
  function renderActsPanel() {
    if (!isPC() || !S) return;
    const box = $("#acts-panel");
    if (!S.alive) { box.innerHTML = ""; return; }
    const groups = B8.acts.groups(S);
    const st = box.scrollTop;
    box.innerHTML = groups.length ? actsHTML(groups) : `<p class="why">Пока ты слишком мал${S.sex === "f" ? "а" : ""} для дел. Расти!</p>`;
    box.scrollTop = st;
  }
  $("#acts-panel").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled || !S || !S.alive) return;
    sfx("click"); runAct(b.dataset.act);
  });

  // ═════ ход времени ═════
  function paintTL() {
    if (!S) return;
    $("#tl-fill").style.width = Math.round(TL.t * 100) + "%";
    const c = S;
    const extra = c.jail && c.pr ? (c.pr.life ? " · ⛓ пожизненно" : " · ⛓ осталось " + ageWord(c.jail)) : c.fug ? " · 🚨 в бегах" : "";
    const wait = !TL.run && !TL.skip && c.pend.length ? " · ждёт решение" : !TL.run && !TL.skip ? " · пауза" : "";
    const lbl = `${c.born + c.age} · ${ageWord(c.age)}${extra}${wait}`;
    if ($("#tl-lbl").textContent !== lbl) $("#tl-lbl").textContent = lbl;
    $("#tl-play").textContent = TL.run || TL.skip ? "❚❚" : "▶";
    $("#tl-play").classList.toggle("on", TL.run || TL.skip);
    for (const b of $$("#timeline [data-sp]")) b.classList.toggle("on", TL.run && !TL.skip && +b.dataset.sp === TL.sp);
    $("#tl-skip").classList.toggle("on", TL.skip);
    $("#tl-back").disabled = !B8.canTimeMachine(c);
    $("#timeline").classList.toggle("wait", !TL.run && !TL.skip && c.pend.length > 0);
  }
  function play(sp) { if (!S || !S.alive) return; TL.sp = sp || TL.sp; TL.run = true; TL.skip = false; M.set.spd = TL.sp; paintTL(); }
  function pause() { TL.run = false; TL.skip = false; flushReveal(); paintTL(); }
  function togglePlay() { if (TUT.active()) return; sfx("click"); if (TL.run || TL.skip) pause(); else { play(); if (S.pend.length && !TL.q.length) openDecision(); } }
  function toggleSkip() { if (TUT.active() || !S || !S.alive) return; sfx("click"); if (TL.skip) { TL.skip = false; TL.run = true; } else { TL.skip = true; TL.run = false; flushReveal(); } paintTL(); }
  function flushReveal() { if (!S) return; TL.q = []; TL.cap = S.log.length; renderLog(); }
  $("#tl-play").onclick = togglePlay;
  $("#tl-skip").onclick = toggleSkip;
  $("#tl-back").onclick = () => { sfx("click"); if (B8.canTimeMachine(S)) openSub("timemachine"); };
  for (const b of $$("#timeline [data-sp]")) b.onclick = () => { if (TUT.active()) return; sfx("click"); play(+b.dataset.sp); if (S.pend.length && !TL.q.length) openDecision(); };
  $("#tl-bar").onclick = () => { if (S && S.pend.length && !UI.sheet) openDecision(); };
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(120, now - TL.last); TL.last = now;
    if (UI.screen !== "life" || !S || !S.alive || UI.sheet || TUT.active() || document.hidden) return;
    if (!TL.run && !TL.skip) return;
    if (TL.q.length) { let ch = false; while (TL.q.length && TL.q[0][1] <= TL.t) { TL.cap = TL.q.shift()[0] + 1; ch = true; } if (ch) renderLog(); }
    if (!TL.q.length && S.pend.length && TL.t >= 0.12) { openDecision(); return; }
    TL.t += dt / (TL.skip ? 230 : YEAR_MS / TL.sp);
    if (TL.t >= 1) { TL.t = 0; nextYear(TL.skip); }
    paintTL();
  }
  requestAnimationFrame(frame);
  // прожить год: instant — показать все события сразу (кнопка «+ Год», перемотка)
  function nextYear(instant) {
    if (!S || !S.alive || UI.sheet) return;
    if (S.pend.length) { flushReveal(); openDecision(); return; }
    const dang = S.age, before = S.log.length;
    B8.advance(S);
    sfx(S.alive ? "year" : "death");
    const n = S.log.length - before;
    if (instant || n <= 1) { TL.cap = S.log.length; TL.q = []; }
    else { TL.cap = before + 1; TL.q = []; for (let i = 1; i < n; i++) TL.q.push([before + i, 0.06 + (i / n) * 0.55]); }
    renderLife();
    for (const k of ACH_LIVE) checkAch(k);
    if (!S.alive) { TL.run = false; TL.skip = false; flushReveal(); save(true); setTimeout(() => endLife(), 1100); return; }
    if (S.age % 5 === 0) save();
    TUT.ev("year", dang);
    if (instant && !TL.skip && S.pend.length) setTimeout(openDecision, 150);
  }
  function manualYear() { if (!S || !S.alive || UI.sheet) return; sfx("click"); TL.t = 0; flushReveal(); nextYear(true); }
  $("#btn-year").onclick = manualYear;
  $("#btn-acts").onclick = () => { sfx("click"); openActs(); TUT.ev("acts"); };
  $("#me").onclick = () => { sfx("click"); openProfile(); };
  $("#life-menu").onclick = () => { sfx("click"); openLifeMenu(); };

  // ═════ решения ═════
  function openDecision() {
    if (!S || !S.alive) return;
    if (!B8.cleanPend(S)) { if (["result", "decision", "acts"].includes(UI.sheet)) closeSheet(); return; }
    flushReveal();
    const v = B8.view(S, S.pend[0]);
    sfx("decide");
    const html = `<h2>${v.icon || "🔀"} ${esc(v.title)}</h2>${v.why ? `<div class="why">← ${esc(v.why)}</div>` : ""}<div class="dec-text">${esc(v.text)}</div>
      <div class="opts">${v.opts.map((o, n) => `<button class="opt" data-i="${o.i}"><span>${esc(o.t)}${o.hint || o.mg ? `<small>${esc(o.hint || "")}${o.mg ? " 🎮" : ""}</small>` : ""}</span>${o.p != null ? `<span class="pc">${o.p}%</span>` : isPC() ? `<span class="pc k">${n + 1}</span>` : ""}</button>`).join("")}</div>`;
    const card = sheet(html, "decision");
    card.onclick = (e) => {
      const b = e.target.closest("[data-i]");
      if (!b) return;
      const i = +b.dataset.i, o = v.opts.find((x) => x.i === i);
      if (o && o.mg) { runMg(o.mg, card, (score) => resolve(i, { mg: score })); return; }
      resolve(i);
    };
    function resolve(i, extra) {
      UI.sheet = "decision";
      const r = B8.choose(S, i, false, extra);
      if (!r) { closeSheet(); return; }
      sfx(r.ok === false ? "bad" : r.ok ? "good" : "click");
      for (const k of ACH_LIVE) checkAch(k);
      TUT.ev("choice");
      TL.cap = S.log.length;
      const kind = r.ok === false ? "b" : r.ok ? "g" : "";
      card.innerHTML = `<h2>${v.icon || "🔀"} ${esc(v.title)}</h2>${r.text ? `<div class="res ${kind}">${esc(r.text)}</div>` : `<div class="res">Решение принято.</div>`}<button class="btn big primary" data-n="1">Дальше${isPC() ? " <small>Enter</small>" : ""}</button>`;
      UI.sheet = "result";
      card.onclick = (ev) => {
        if (!ev.target.closest("[data-n]")) return;
        if (!S.alive) { closeSheet(); TL.run = false; save(true); setTimeout(endLife, 500); return; }
        if (S.pend.length && B8.cleanPend(S)) openDecision(); else closeSheet();
      };
      save();
    }
  }
  function runMg(kind, card, cb) {
    UI.sheet = "mg";
    card.className = "k-mg";
    B8.mg.run(kind, card, (score, extra) => { cb(score, extra); }, { fmt: (s) => F(s) });
  }
  function pushDecision(id, d) { const ok = B8.fire(S, id, d || {}); if (ok && S.pend.length) openDecision(); else backToActs(); }

  // ═════ дела ═════
  function openActs() {
    if (!S || !S.alive) return;
    if (isPC()) { if (UI.sheet) closeSheet(); renderActsPanel(); return; }
    const groups = B8.acts.groups(S);
    if (!groups.length) { toast(F("Пока ты слишком мал[|а] для дел. Расти!")); return; }
    const card = sheet(`<h2>📋 Дела <small style="color:var(--mut);font-weight:400">· ${ageWord(S.age)}</small></h2>` + actsHTML(groups) + `<div style="margin-top:1rem"><button class="btn big" data-close="1">Закрыть</button></div>`, "acts");
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) { closeSheet(); return; }
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      sfx("click");
      runAct(b.dataset.act);
    };
  }
  function backToActs() { if (isPC()) { if (UI.sheet) closeSheet(); else renderLife(); } else openActs(); }
  function runAct(id) {
    if (id === "j_rew") {
      P().rewarded(() => { S.flags.jail_ad = 1; S.jail = Math.max(1, S.jail - 1); B8.say(S, "Примерное поведение: срок сократили на год.", "g"); toast("Срок сокращён на год", "gold"); renderLife(); save(); }, () => backToActs());
      return;
    }
    const r = B8.acts.run(S, id);
    if (r.open) return openSub(r.open);
    if (!afterAct(r)) backToActs();
  }
  function afterAct(r) {
    if (r && r.text) { toast(esc(r.text), r.kind); sfx(r.kind === "g" ? "good" : r.kind === "b" ? "bad" : "click"); }
    for (const k of ACH_LIVE) checkAch(k);
    TL.cap = S.log.length; TL.q = [];
    renderLife();
    save();
    if (!S.alive) { closeSheet(); setTimeout(endLife, 600); return true; }
    if (S.pend.length) { setTimeout(openDecision, 200); return true; }
    return false;
  }
  function openSub(what) {
    const c = S, gdp = B8.gdp(c);
    const back = `<button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад${isPC() ? "" : " к делам"}</button>`;
    const wire = (card, fn) => { card.onclick = (e) => { if (e.target.closest("[data-back]")) { sfx("click"); backToActs(); return; } fn(e); }; };
    if (what.startsWith("decide:")) return pushDecision(what.slice(7));
    if (what === "mg:dig") {
      const card = sheet("", "mg");
      return B8.mg.run("dig", card, (score, noise) => { const r = B8.prison.dig(S, score, noise); if (!afterAct(r)) backToActs(); }, { fmt: (s) => F(s) });
    }
    if (what === "f_poster") return openPoster();
    if (["dating", "propose", "divorce", "baby", "adopt", "cancer"].includes(what)) { c.ya[what] = 1; return pushDecision("act_" + what); }
    if (what === "focus") {
      const set = B8.focusSet(c);
      wire(sheet(`<h2>🎯 Фокус года</h2><p class="why">На что ты тратишь время в этом году. Его можно менять и сверху, над летописью.</p><div class="opts">${set.map(([k, l, h]) => `<button class="opt" data-f="${k}"><span>${esc(l)}<small>${esc(h)}</small></span>${c.focus === k ? '<span class="pc">сейчас</span>' : ""}</button>`).join("")}</div>${back}`, "focus"), (e) => {
        const b = e.target.closest("[data-f]"); if (!b) return;
        setFocus(b.dataset.f); backToActs();
      });
      return;
    }
    if (what === "jobs") {
      const offers = B8.jobOffers(c);
      wire(sheet(`<h2>🔎 Вакансии</h2>${offers.length ? "" : `<p>Подходящих вакансий нет.${c.crime.rec ? " Судимость закрывает многие двери." : " Нужно образование."}</p>`}<div class="opts">${offers.map((o, i) => {
        const Fd = B8.FIELDS[o.f], pay = gdp * B8.JOB_MULT[o.lvl] * Fd[2] * (0.6 + c.iq / 125) * (c.urban ? 1 : 0.7);
        return `<button class="opt" data-j="${i}"><span>${esc(F(Fd[3][o.lvl - 1]))}<small>${esc(Fd[0])} · около ${money(pay)} в год</small></span><span class="pc">${Math.round(Math.min(95, 45 + c.iq / 3 + c.sk / 4 - (c.crime.rec ? 15 : 0)))}%</span></button>`;
      }).join("")}</div>${back}`, "jobs"), (e) => {
        const b = e.target.closest("[data-j]"); if (!b) return;
        c.ya.jobs = 1;
        const o = offers[+b.dataset.j];
        if (R.r(c) < Math.min(0.95, (45 + c.iq / 3 + c.sk / 4 - (c.crime.rec ? 15 : 0)) / 100)) { B8.takeJob(c, o.f, o.lvl); afterAct({ text: F("Тебя взяли! Новая работа: {job}."), kind: "g" }); }
        else { B8.say(c, "Собеседование не прошло. «Мы вам перезвоним».", "b"); afterAct({ text: "Не взяли. «Мы вам перезвоним».", kind: "b" }); }
        backToActs();
      });
      return;
    }
    if (what === "uni") {
      const ab = c.wealth === 2 || c.iq > 72;
      wire(sheet(`<h2>🎓 Университет</h2><p>Четыре года учёбы. ${c.wealth < 2 ? "Учёба стоит денег каждый год." : ""}</p><div class="opts"><button class="opt" data-u="home"><span>В своей стране</span><span class="pc">${Math.round(Math.min(92, 20 + c.iq * 0.8))}%</span></button>${ab ? `<button class="opt" data-u="abroad"><span>За границей<small>сложнее поступить, но диплом ценнее</small></span><span class="pc">${Math.round(Math.min(85, c.iq * 0.7))}%</span></button>` : ""}</div>${back}`, "uni"), (e) => {
        const b = e.target.closest("[data-u]"); if (!b) return;
        c.ya.uni = 1;
        const abroad = b.dataset.u === "abroad", p = abroad ? Math.min(0.85, c.iq * 0.007) : Math.min(0.92, 0.2 + c.iq * 0.008);
        if (R.r(c) < p) { c.uni = { y: 0, t: 3, abroad }; if (c.job) c.job = null; c.flags.path = 1; B8.say(c, abroad ? "Ты поступил[|а] в университет за границей!" : "Ты поступил[|а] в университет!", "g", "", true); afterAct({ text: "Поступление! Ты студент" + (c.sex === "f" ? "ка" : "") + ".", kind: "g" }); }
        else { B8.say(c, "Не хватило баллов для поступления.", "b"); afterAct({ text: "Не поступил" + (c.sex === "f" ? "а" : "") + ". Можно попробовать в следующем году.", kind: "b" }); }
        backToActs();
      });
      return;
    }
    if (what === "home") {
      const price = gdp * (c.urban ? 6 : 3) * (1 + c.ls * 0.25);
      wire(sheet(`<h2>🏠 Своё жильё</h2><p>Цена — около ${money(price)}.</p><div class="opts"><button class="opt" data-h="cash" ${c.money >= price ? "" : "disabled"}><span>Купить сразу</span></button><button class="opt" data-h="mort" ${c.money >= price * 0.2 ? "" : "disabled"}><span>Ипотека на 20 лет<small>первый взнос ${money(price * 0.2)}</small></span></button></div>${back}`, "home"), (e) => {
        const b = e.target.closest("[data-h]"); if (!b || b.disabled) return;
        c.ya.home = 1; if (!afterAct(B8.acts.mortgage(c, b.dataset.h === "cash"))) backToActs();
      });
      return;
    }
    if (what === "invest") {
      wire(sheet(`<h2>📊 Инвестиции</h2><p>Сейчас вложено: ${money(c.inv)}. В среднем фонды растут на 5–8% в год, но бывают обвалы.</p><div class="opts">${[0.1, 0.3, 0.6, 0.9].map((x) => `<button class="opt" data-p="${x}"><span>Вложить ${Math.round(x * 100)}% денег</span><span class="pc">${money(c.money * x)}</span></button>`).join("")}</div>${back}`, "invest"), (e) => {
        const b = e.target.closest("[data-p]"); if (!b) return;
        c.ya.invest = 1; if (!afterAct(B8.acts.invest(c, +b.dataset.p))) backToActs();
      });
      return;
    }
    if (what === "emigrate") {
      const ds = B8.acts.destinations(c);
      wire(sheet(`<h2>✈️ Эмиграция</h2><p>Переезд стоит ${money(gdp * 0.5)}. Первые три года — тяжело: язык, работа, одиночество.</p><div class="opts">${ds.map((d) => `<button class="opt" data-c="${d.c}"><span>${esc(d.n)}<small>живут до ${Math.round(B8.lifeExp(d, c.sex))}, доход в ${(d.gdp / B8.gdp(c)).toFixed(1).replace(".", ",")} раза выше</small></span></button>`).join("") || "<p>Некуда уезжать — ты уже в одной из лучших стран.</p>"}</div>${back}`, "emig"), (e) => {
        const b = e.target.closest("[data-c]"); if (!b) return;
        c.ya.emigrate = 1; afterAct(B8.acts.emigrate(c, b.dataset.c)); closeSheet();
      });
      return;
    }
    if (what === "timemachine") {
      wire(sheet(`<h2>⏳ Машина времени</h2><p>Раз за жизнь можно вернуться на 5 лет назад и прожить их иначе. Всё, что случилось за эти годы, исчезнет.</p><div class="opts"><button class="btn big primary" data-t="go">⏪ Вернуться на 5 лет назад</button></div>${back}`, "tm"), (e) => {
        if (!e.target.closest("[data-t]")) return;
        S = B8.timeMachine(S); UI.logShown = 0; TL.t = 0; sfx("win"); closeSheet(); renderLife(true); checkAch("tm"); save(true);
      });
      return;
    }
    if (what === "biz_open") return openBizOpen();
    if (what === "biz") return openBiz();
    if (what === "casino") return openCasinoPlaces();
    if (what === "crime") return openCrime();
  }

  // ── бизнес ──
  function openBizOpen() {
    const c = S, ks = B8.biz.kinds(c);
    const card = sheet(`<h2>🏪 Открыть бизнес</h2><p class="why">Стартовый капитал зависит от вида. Бизнес растёт, если ты им занимаешься. Может и прогореть.</p><div class="opts">${ks.map((k) => `<button class="opt" data-k="${k.id}" ${c.money >= k.cap ? "" : "disabled"}><span>${esc(k.n[0].toUpperCase() + k.n.slice(1))}</span><span class="pc">${money(k.cap)}</span></button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "bizopen");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return backToActs();
      const b = e.target.closest("[data-k]"); if (!b || b.disabled) return;
      afterAct(B8.biz.open(c, b.dataset.k)); checkAch("biz"); openBiz();
    };
  }
  function openBiz() {
    const c = S, b = c.biz;
    if (!b) return backToActs();
    const acts = B8.biz.acts(c);
    const card = sheet(`<h2>🏢 ${esc(b.name)}</h2>${kv("Вид", esc(b.kind))}${kv("Уровень", esc(B8.biz.LVL[b.lvl]))}${kv("Стоимость", money(b.val))}${kv("Прибыль за прошлый год", `<span class="${b.profit >= 0 ? "win" : "loss"}">${money(b.profit)}</span>`)}${kv("Лет бизнесу", b.y)}${kv("Управляющий", b.mgr ? "есть" : F("ты сам[|а]"))}
      <h3>Что сделать в этом году</h3><div class="opts">${acts.map((a) => `<button class="opt" data-b="${a.id}" ${a.ok && !c.ya["biz_" + a.id] ? "" : "disabled"}><span>${esc(a.label)}</span></button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "biz");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return backToActs();
      const x = e.target.closest("[data-b]"); if (!x || x.disabled) return;
      const r = B8.biz.act(c, x.dataset.b); afterAct(r); checkAch("biz");
      if (c.biz) openBiz(); else backToActs();
    };
  }

  // ── казино ──
  const CAS = { game: "roulette", bet: 0, bj: null, busy: false };
  function openCasinoPlaces() {
    const c = S, acc = B8.casino.access(c);
    if (!acc.ok) { toast(esc(acc.why)); return; }
    if (acc.list.length === 1) return enterCasino(acc.list[0]);
    const card = sheet(`<h2>🎰 Казино</h2>${acc.note ? `<p class="why">${esc(acc.note)}</p>` : ""}<div class="opts">${acc.list.map((p, i) => `<button class="opt" data-p="${i}" ${c.money >= p.cost ? "" : "disabled"}><span>${esc(p.label)}${p.risk ? "<small>может нагрянуть полиция</small>" : ""}</span>${p.cost ? `<span class="pc">${money(p.cost)}</span>` : ""}</button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "casplace");
    card.onclick = (e) => { if (e.target.closest("[data-back]")) return backToActs(); const b = e.target.closest("[data-p]"); if (!b || b.disabled) return; enterCasino(acc.list[+b.dataset.p]); };
  }
  function enterCasino(place) {
    const r = B8.casino.enter(S, place);
    if (r.raid) { sfx("siren"); if (!afterAct({ text: r.text, kind: "b" })) backToActs(); return; }
    CAS.bj = null; CAS.bet = B8.casino.bets(S)[0] || 0;
    renderCasino("Добро пожаловать! Ставки — только на игровые деньги, других здесь нет.");
  }
  function renderCasino(msg, res) {
    const c = S, bets = B8.casino.bets(c);
    if (!bets.includes(CAS.bet)) CAS.bet = bets[0] || 0;
    const tab = (id, l) => `<button data-g="${id}" class="${CAS.game === id ? "on" : ""}">${l}</button>`;
    let felt = "", ctrl = "";
    if (CAS.game === "roulette") {
      felt = res && res.n != null ? `<div class="wheelnum ${res.n === 0 ? "z" : B8.casino.isRed(res.n) ? "r" : ""}">${res.n}</div>` : `<div class="wheelnum z">?</div>`;
      ctrl = CAS.pick === "num" ? `<div class="betkinds" style="grid-template-columns:repeat(6,1fr)">${Array.from({ length: 37 }, (_, n) => `<button data-r="num" data-v="${n}" class="${n === 0 ? "" : B8.casino.isRed(n) ? "red" : "blk"}">${n}</button>`).join("")}</div>`
        : CAS.pick === "dozen" ? `<div class="betkinds"><button data-r="dozen" data-v="1">1–12</button><button data-r="dozen" data-v="2">13–24</button><button data-r="dozen" data-v="3">25–36</button></div>`
        : `<div class="betkinds"><button data-r="red" class="red">Красное ×2</button><button data-r="black" class="blk">Чёрное ×2</button><button data-r="num">Число ×36</button><button data-r="even">Чётное ×2</button><button data-r="odd">Нечётное ×2</button><button data-r="dozen">Дюжина ×3</button></div>`;
    } else if (CAS.game === "slots") {
      felt = `<div class="reels">${(res && res.r ? res.r : ["🍒", "🔔", "7️⃣"]).map((s) => `<div class="reel">${s}</div>`).join("")}</div><div class="lbl">три 7️⃣ — ×500, три 💎 — ×150</div>`;
      ctrl = `<button class="btn big primary" data-s="1">Крутить</button>`;
    } else if (CAS.game === "dice") {
      felt = `<div class="dice">${res && res.a ? `<div class="die">${res.a}</div><div class="die">${res.b}</div>` : `<div class="die">?</div><div class="die">?</div>`}</div>${res && res.s ? `<div class="lbl">сумма ${res.s}</div>` : ""}`;
      ctrl = `<div class="betkinds"><button data-d="lo">Меньше 7 ×2,3</button><button data-d="seven">Ровно 7 ×5,5</button><button data-d="hi">Больше 7 ×2,3</button></div>`;
    } else {
      const g = CAS.bj;
      const card = (v, hide) => { if (hide) return `<div class="card back"></div>`; const n = v === 1 ? "A" : v === 10 ? R.pick(S, ["10", "J", "Q", "K"]) : v; return `<div class="card ${(v * 7) % 2 ? "r" : ""}">${n}${(v * 7) % 2 ? "♥" : "♠"}</div>`; };
      if (g) felt = `<div class="lbl">Дилер ${g.done ? "(" + B8.casino.bjScore(g.d) + ")" : ""}</div><div class="cards">${g.d.map((v, i) => card(v, !g.done && i === 1)).join("")}</div><div class="lbl">Ты (${B8.casino.bjScore(g.p)})</div><div class="cards">${g.p.map((v) => card(v)).join("")}</div>`;
      else felt = `<div class="lbl">Набери 21 или больше дилера, но не перебери</div>`;
      ctrl = g && !g.done ? `<div class="grid2"><button class="btn big" data-bj="hit">Ещё карту</button><button class="btn big primary" data-bj="stand">Хватит</button></div>` : `<button class="btn big primary" data-bj="deal">Раздать</button>`;
    }
    const cardEl = sheet(`<div class="cas-top"><h2 style="margin:0">🎰 Казино</h2><div class="cas-bal">${money(c.money)}</div></div>
      <div class="tabs">${tab("roulette", "Рулетка")}${tab("bj", "Блэкджек")}${tab("slots", "Слоты")}${tab("dice", "Кости")}</div>
      <div class="felt">${felt}</div>
      <div class="why" style="text-align:center;margin-top:0.4rem">${msg || ""}</div>
      ${bets.length ? `<div class="bets">${bets.map((b) => `<button class="chip ${b === CAS.bet ? "on" : ""}" data-bet="${b}">${b === Math.round(c.money) ? "Всё: " : ""}${money(b)}</button>`).join("")}</div>${ctrl}` : `<p style="text-align:center">Деньги кончились. Казино всегда в выигрыше.</p>`}
      <button class="btn big" data-leave="1" style="margin-top:0.8rem">🚪 Уйти из казино</button>`, "casino");
    cardEl.onclick = onCasino;
  }
  function onCasino(e) {
    if (CAS.busy) return;
    const c = S, t = e.target;
    const g = t.closest("[data-g]"); if (g) { CAS.game = g.dataset.g; CAS.bj = null; CAS.pick = null; sfx("click"); return renderCasino(); }
    const bt = t.closest("[data-bet]"); if (bt) { CAS.bet = +bt.dataset.bet; sfx("click"); return renderCasino(); }
    if (t.closest("[data-leave]")) { const r = B8.casino.leave(c); checkAch("cas"); if (!afterAct(r ? { text: r.text, kind: r.diff > 0 ? "g" : r.diff < 0 ? "b" : "" } : null)) backToActs(); return; }
    const bet = CAS.bet;
    if (!bet || bet > c.money) return;
    const fin = (win, txt) => { sfx(win > 0 ? "win" : win < 0 ? "lose" : "click"); checkAch("cas"); return `${txt} ${win > 0 ? `<span class="win">+${money(win)}</span>` : win < 0 ? `<span class="loss">−${money(-win)}</span>` : "ставка возвращена"}`; };
    const r = t.closest("[data-r]");
    if (r) {
      const kind = r.dataset.r, val = r.dataset.v != null ? +r.dataset.v : 0;
      if (kind === "num" && r.dataset.v == null) { CAS.pick = "num"; return renderCasino("Выбери число от 0 до 36."); }
      if (kind === "dozen" && r.dataset.v == null) { CAS.pick = "dozen"; return renderCasino("Выбери дюжину."); }
      CAS.pick = null;
      const res = B8.casino.roulette(c, bet, kind, val);
      CAS.busy = true; let i = 0;
      const spin = setInterval(() => { sfx("tick"); renderCasino("Шарик бежит…", { n: Math.floor(Math.random() * 37) }); if (++i > 12) { clearInterval(spin); CAS.busy = false; renderCasino(fin(res.win, `Выпало ${res.n}${res.n ? (B8.casino.isRed(res.n) ? ", красное" : ", чёрное") : ", зеро"}.`), res); } }, 90);
      return;
    }
    if (t.closest("[data-s]")) {
      const res = B8.casino.slots(c, bet);
      CAS.busy = true; let i = 0;
      const spin = setInterval(() => { sfx("tick"); const fake = [0, 1, 2].map((j) => (i > 6 + j * 3 ? res.r[j] : B8.casino.SYM[Math.floor(Math.random() * 6)])); renderCasino("…", { r: fake }); if (++i > 14) { clearInterval(spin); CAS.busy = false; renderCasino(fin(res.win, res.mult >= 30 ? "ДЖЕКПОТ!" : res.mult ? "Есть совпадение!" : "Мимо."), res); } }, 80);
      return;
    }
    const d = t.closest("[data-d]");
    if (d) {
      const res = B8.casino.dice(c, bet, d.dataset.d);
      CAS.busy = true; sfx("dice");
      setTimeout(() => { CAS.busy = false; renderCasino(fin(res.win, `Выпало ${res.a} и ${res.b}.`), res); }, 500);
      return;
    }
    const bj = t.closest("[data-bj]");
    if (bj) {
      sfx("card");
      const a = bj.dataset.bj;
      if (a === "deal") CAS.bj = B8.casino.bjStart(c, bet);
      else if (a === "hit") CAS.bj = B8.casino.bjHit(c, CAS.bj);
      else CAS.bj = B8.casino.bjEnd(c, CAS.bj);
      const g2 = CAS.bj;
      if (g2.done) return renderCasino(fin(g2.win, { bj: "Блэкджек!", win: "Победа!", push: "Ничья.", lose: "Дилер сильнее.", bust: "Перебор!" }[g2.res]));
      return renderCasino("Ещё карту или хватит?");
    }
  }

  // ── тёмные дела ──
  function openCrime() {
    const c = S, cr = c.crime, ops = B8.crime.opsFor(c);
    const left = 3 - (c.ya.crime || 0);
    const head = cr.on ? kv("Организация", esc(cr.orgName)) + kv("Положение", esc(B8.crime.rankTitle(c))) : `<p class="why">${F("Ты пока сам[|а] по себе. В организацию позовут, если там тебя заметят: нужна репутация.")}</p>`;
    const canHeist = c.age >= 18 && !c.ya.heist && left >= 2;
    const card = sheet(`<h2>🕶 Тёмные дела</h2>${head}
      ${meter("Репутация в подполье", Math.min(100, cr.rep / 6), "var(--pur)", Math.round(cr.rep))}
      ${meter("🧾 Улики — копятся годами", cr.ev || 0, "#ff9f43")}
      ${meter("🚓 Внимание полиции", cr.heat, "var(--bad)")}
      ${cr.rec ? `<div class="why">Судимостей: ${cr.rec}. С каждой новой срок больше.</div>` : ""}
      ${c.age >= 18 ? `<button class="heist-btn" data-heist="1" ${canHeist ? "" : "disabled"}><span>🎯</span><span><b>Ограбление</b><small>${canHeist ? "команда, план, взлом и погоня" : c.ya.heist ? "одно ограбление в год" : "нужно 2 свободных дела в этом году"}</small></span></button>` : ""}
      <h3>Что провернуть (осталось в этом году: ${Math.max(0, left)})</h3>
      <div class="opts">${ops.map((o) => `<button class="opt" data-o="${o.id}" ${left > 0 ? "" : "disabled"}><span>${esc(o.label)}${o.cost ? `<small>нужно ${money(o.cost)}</small>` : o.id === "car" ? "<small>мини-игра 🎮</small>" : o.risk >= 0.2 ? "<small>очень рискованно</small>" : ""}</span>${["bribe", "launder", "low", "quit"].includes(o.id) ? "" : `<span class="pc">${o.p}%</span>`}</button>`).join("")}</div>
      <p class="why" style="margin-top:0.7rem">Это игра. В жизни за такое сажают, а «особые бананы» — не бананы.</p>
      <button class="btn big" data-back="1">← Назад</button>`, "crime");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return backToActs();
      if (e.target.closest("[data-heist]")) { if (canHeist) openHeist(); return; }
      const b = e.target.closest("[data-o]"); if (!b || b.disabled) return;
      const id = b.dataset.o;
      if (id === "car") { runMg("lock", card, (score) => { const r = B8.crime.doOp(c, "car", { mg: score }); checkAch("crime"); if (!afterAct(r)) openCrime(); }); return; }
      const r = B8.crime.doOp(c, id);
      checkAch("crime");
      if (afterAct(r)) return;
      openCrime();
    };
  }

  // ── ограбление: цель → команда → план → осложнения → хранилище → погоня ──
  const HS = {};
  function openHeist() {
    const c = S, ts = B8.heist.targets(c);
    HS.crew = null; HS.picks = {}; HS.h = null;
    const card = sheet(`<h2>🎯 Ограбление</h2><p class="why">Чем крупнее цель — тем больше добыча, улики и срок, если поймают.</p><div class="opts">${ts.map((t) => `<button class="opt" data-t="${t.id}" ${t.ok ? "" : "disabled"}><span>${esc(t.n)}<small>${t.ok ? "добыча " + money(t.loot[0]) + " – " + money(t.loot[1]) : esc(t.why)}</small></span><span class="pc">${"★".repeat(t.tier)}</span></button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "heist");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return openCrime();
      const b = e.target.closest("[data-t]"); if (!b || b.disabled) return;
      sfx("click"); HS.tid = b.dataset.t; HS.crew = B8.heist.crew(c); heistCrew();
    };
  }
  function heistCrew() {
    const c = S, R0 = B8.heist.ROLES;
    for (const [r] of R0) if (HS.picks[r] == null) HS.picks[r] = -1;
    const cut = R0.reduce((s, [r]) => s + (HS.picks[r] >= 0 ? HS.crew[r][HS.picks[r]].cut : 0), 0);
    const card = sheet(`<h2>🎯 Команда</h2><p class="why">Каждый берёт свою долю. Без кого-то можно обойтись — но рискованнее. Кто-то может оказаться болтуном.</p>
      ${R0.map(([r, ic, lbl]) => `<h3>${ic} ${lbl}</h3><div class="crew">${HS.crew[r].map((m, i) => `<button class="cm ${HS.picks[r] === i ? "on" : ""}" data-r="${r}" data-i="${i}"><b>${esc(m.n)}</b><span class="sk">${"★".repeat(m.sk)}${"☆".repeat(5 - m.sk)}</span><small>${esc(m.tr)}</small><em>доля ${m.cut}%</em></button>`).join("")}<button class="cm none ${HS.picks[r] === -1 ? "on" : ""}" data-r="${r}" data-i="-1"><b>Без ${r === "inside" ? "своего человека" : lbl === "Хакер" ? "хакера" : lbl === "Водитель" ? "водителя" : "громилы"}</b><small>справлюсь сам${c.sex === "f" ? "а" : ""}</small></button></div>`).join("")}
      <div class="kv"><span>Доля команды</span><span>${cut}%</span></div>
      <button class="btn big primary" data-next="1" style="margin-top:0.6rem">Дальше: план</button><button class="btn big" data-back="1" style="margin-top:0.4rem">← К целям</button>`, "heist");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return openHeist();
      if (e.target.closest("[data-next]")) { sfx("click"); return heistPlan(); }
      const b = e.target.closest("[data-r]"); if (!b) return;
      sfx("click"); HS.picks[b.dataset.r] = +b.dataset.i; heistCrew();
    };
  }
  function heistPlan() {
    const c = S, cost = B8.heist.scoutCost(c, HS.tid);
    HS.ap = HS.ap || "quiet"; if (HS.scout == null) HS.scout = c.money >= cost;
    const ap = (id, ic, t, h) => `<button class="opt ${HS.ap === id ? "sel" : ""}" data-ap="${id}"><span>${ic} ${t}<small>${h}</small></span>${HS.ap === id ? '<span class="pc">✓</span>' : ""}</button>`;
    const card = sheet(`<h2>🎯 План</h2><div class="opts">${ap("quiet", "🤫", "Тихо", "важнее хакер и свой человек; меньше улик")}${ap("loud", "💥", "Громко", "важнее громила и водитель")}${ap("smart", "🎭", "Хитро", "важнее твой ум и обаяние")}</div>
      <h3>Разведка</h3><button class="opt ${HS.scout ? "sel" : ""}" data-sc="1" ${c.money >= cost ? "" : "disabled"}><span>🔍 Тщательная разведка<small>+10% к каждому шансу · ${money(cost)}</small></span><span class="pc">${HS.scout ? "✓" : ""}</span></button>
      <button class="btn big primary" data-go="1" style="margin-top:0.8rem">Начать дело</button><button class="btn big" data-back="1" style="margin-top:0.4rem">← Команда</button>`, "heist");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return heistCrew();
      const a = e.target.closest("[data-ap]"); if (a) { sfx("click"); HS.ap = a.dataset.ap; return heistPlan(); }
      const s = e.target.closest("[data-sc]"); if (s && !s.disabled) { sfx("click"); HS.scout = !HS.scout; return heistPlan(); }
      if (e.target.closest("[data-go]")) { sfx("decide"); HS.h = B8.heist.begin(c, HS.tid, HS.crew, HS.picks, HS.ap, HS.scout && c.money >= cost); heistStep(""); }
    };
  }
  function heistStep(prev) {
    const c = S, h = HS.h, v = B8.heist.view(c, h);
    const alarm = `<div class="alarm">${[0, 1, 2].map((i) => `<i class="${i < h.alarm ? "on" : ""}"></i>`).join("")}<span>тревога</span></div>`;
    if (v.stage === "done") return heistEnd();
    if (v.stage === "vault") {
      const card = sheet(`<h2>🎯 ${esc(h.name)}</h2>${prev ? `<div class="res">${esc(prev)}</div>` : ""}${alarm}<p>Вы у хранилища. Дальше — твои руки.</p><button class="btn big primary" data-v="1">🔓 Взломать замок</button>`, "heist");
      card.onclick = (e) => { if (!e.target.closest("[data-v]")) return; runMg("lock", card, (score) => { const r = B8.heist.vault(c, h, score); UI.sheet = "heist"; heistStep(r.text); }); };
      return;
    }
    const title = v.stage === "comp" ? `Этап ${v.step} из ${v.of}` : "Погоня";
    const card = sheet(`<h2>🎯 ${esc(h.name)} · ${title}</h2>${prev ? `<div class="res">${esc(prev)}</div>` : ""}${alarm}<div class="dec-text">${esc(v.text)}</div>
      <div class="opts">${v.opts.map((o, i) => `<button class="opt" data-i="${i}"><span>${esc(o.t)}${o.role ? `<small>${roleTag(h, o.role)}</small>` : ""}</span><span class="pc">${o.p}%</span></button>`).join("")}</div>`, "heist");
    card.onclick = (e) => {
      const b = e.target.closest("[data-i]"); if (!b) return;
      const r = B8.heist.act(c, h, +b.dataset.i);
      sfx(r.ok ? "good" : "bad");
      heistStep(r.text);
    };
  }
  function roleTag(h, r) { const m = h.crew[r], nm = { hacker: "хакер", driver: "водитель", muscle: "громила", inside: "свой человек" }[r]; return m ? `${nm}: ${esc(m.n.split(" ")[0])} ${"★".repeat(m.sk)}` : `${nm} — нет, шанс ниже`; }
  function heistEnd() {
    const c = S, h = HS.h, r = B8.heist.finish(c, h);
    M.st.heists = (M.st.heists || 0) + (r.ok ? 1 : 0);
    for (const k of ACH_LIVE) checkAch(k);
    sfx(r.ok ? "win" : "siren");
    const card = sheet(`<h2>🎯 ${esc(h.name)}</h2><div class="res">${esc(h.lines[h.lines.length - 1] || "")}</div>
      <div class="res ${r.ok ? "g" : "b"}">${r.ok ? `Удалось! Твоя доля: <b>${money(r.sum)}</b>. Улики выросли — их теперь ${Math.round(c.crime.ev)}%.` : "Тебя взяли на месте. Дальше — СИЗО."}</div>
      <button class="btn big primary" data-n="1">Дальше</button>`, "heist");
    card.onclick = (e) => { if (!e.target.closest("[data-n]")) return; closeSheet(); TL.cap = S.log.length; renderLife(); save(); if (!S.alive) setTimeout(endLife, 400); else if (S.pend.length) setTimeout(openDecision, 150); };
  }

  // ── плакат и газеты ──
  function openPoster() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>🚨 Плакат «Разыскивается»</h2><canvas id="poster-cv" width="320" height="420" class="poster"></canvas><p class="why">${S.fug ? F("Такие плакаты висят на вокзалах и остановках. Розыск снижается, если залечь, сменить документы или лицо.") : ""}</p>`, "poster");
    B8.drawPoster($("#poster-cv"), S);
    card.onclick = (e) => { if (e.target.closest("[data-close]")) backToActs(); };
  }
  function papersHTML(c, n) {
    const list = (c.paper || []).slice(-(n || 40)).reverse();
    return list.length ? list.map(([a, h, name]) => `<div class="np clip"><small>📰 ${esc(name)} · ${c.born + a}</small><b>${esc(h)}</b></div>`).join("") : `<p class="why">Газеты о тебе пока не писали.</p>`;
  }
  function openPapers() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>📰 Газеты о тебе</h2>${papersHTML(S)}`, "papers");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }

  // ═════ профиль ═════
  function openProfile() {
    const c = S;
    const p = (x, role) => `<div class="person ${x.alive ? "" : "dead"}"><span>${esc(x.n)}<br><small>${role}${x.st ? " · " + esc(x.st) : ""}${x.job ? " · " + esc(x.job) : ""}</small></span><span>${x.alive ? ageWord(B8.ageOf(c, x)) : "† " + ageWord(x.died)}</span></div>`;
    const ppl = [p(c.mother, "мама"), p(c.father, "папа")].concat(c.sibs.map((s) => p(s, s.sex === "m" ? (s.born < 0 ? "старший брат" : "младший брат") : s.born < 0 ? "старшая сестра" : "младшая сестра")));
    if (c.spouse) ppl.push(p(c.spouse, c.spouse.sex === "f" ? "жена" : "муж"));
    if (c.date) ppl.push(p(c.date, "встречаетесь"));
    c.kids.forEach((k) => ppl.push(p(k, (k.sex === "m" ? "сын" : "дочь") + (k.adopted ? " (приёмн" + (k.sex === "m" ? "ый" : "ая") + ")" : ""))));
    if (c.friend) ppl.push(p(c.friend, "друг"));
    for (const pt of c.pets || []) ppl.push(`<div class="person ${pt.alive ? "" : "dead"}"><span>${B8.pets.PK[pt.k][1]} ${esc(pt.n)}<br><small>${B8.pets.PK[pt.k][0]}</small></span><span>${pt.alive ? ageWord(c.age - pt.born) : "† " + ageWord(pt.died)}</span></div>`);
    const a = [];
    if (c.a.home) a.push("жильё (" + money(c.a.homeVal) + (c.a.mort ? ", ипотека ещё " + c.a.mort + " " + B8.years(c.a.mort) : "") + ")");
    if (c.a.mansion) a.push("особняк"); if (c.a.car) a.push(c.a.car >= 2 ? "спорткар" : "машина"); if (c.a.yacht) a.push("яхта");
    if (c.inv) a.push("инвестиции " + money(c.inv)); if (c.biz) a.push("бизнес «" + c.biz.name + "» (" + money(c.biz.val) + ")");
    const conds = { depression: "депрессия", diabetes: "диабет", back: "больная спина", cancer: "онкология", drinking: "алкоголь", gambling: "игровая зависимость", hungry: "недоедание", unemployed: "безработица" };
    const pr = c.pr, fg = c.fug;
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>${esc(B8.fullName(c))}</h2>
      ${c.patr ? `<div class="why">отчество: ${esc(c.patr)}</div>` : ""}
      ${kv("Возраст", `${ageWord(c.age)} (${c.born + c.age} год)`)}${kv("Где живёшь", `${esc(c.house)}, ${esc(c.city)}`)}${kv("Уровень жизни", esc(B8.LS[c.ls]))}
      ${kv("Место в мире", `богаче ${B8.percentile(c)}% людей`)}${kv("Образование", esc(B8.EDU[c.edu]) + (c.uni ? " (учишься)" : c.school ? " (школа)" : ""))}${kv("Работа", esc(B8.jobTitle(c)))}
      ${kv("Доход в год", money(c.income))}${kv("Состояние", money(B8.netWorth(c)))}
      ${c.temper ? kv("Характер", esc(B8.TEMPERS[c.temper][c.sex === "m" ? 0 : 1])) : ""}${c.hobby ? kv("Увлечение", `${esc(B8.HOBBIES[c.hobby][0])} (${Math.round(c.hobbyL)}/100)`) : ""}
      ${kv("Внешность", Math.round(c.looks) + "/100")}${c.sm.f ? kv("Подписчики", B8.social.fmtF(c.sm.f)) : ""}
      ${Object.keys(c.conds).length ? kv("Здоровье", Object.keys(c.conds).map((k) => conds[k] || k).join(", ")) : ""}
      ${c.crime.on || c.crime.rec ? kv("Подполье", (c.crime.on ? esc(B8.crime.rankTitle(c)) : "в прошлом") + (c.crime.rec ? ", судимостей: " + c.crime.rec : "")) : ""}
      ${pr ? kv("Тюрьма", `${esc(pr.name)} · ${pr.life ? "пожизненно" : "осталось " + ageWord(c.jail)} · ${B8.prison.RANKS[pr.rank]}`) : ""}
      ${fg ? kv("Розыск", `${Math.round(fg.wanted)}% · ${ageWord(fg.y)} в бегах`) : ""}
      ${c.cas.visits ? kv("Казино", `выиграно ${money(c.cas.won)}, проиграно ${money(c.cas.lost)}`) : ""}
      ${a.length ? `<h3>Имущество</h3><p>${esc(a.join(", "))}</p>` : ""}
      <h3>Близкие</h3><div class="people">${ppl.join("")}</div>
      ${(c.paper || []).length ? `<h3>Газеты о тебе</h3>${papersHTML(c, 5)}` : ""}
      <h3>Код судьбы этой жизни</h3><p><b>${B8.seedToCode(c.seed)}</b> — друг может родиться тобой.</p>`, "profile");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }

  // ═════ меню во время жизни ═════
  function openLifeMenu() {
    pause();
    const card = sheet(`<h2>☰ Пауза</h2><div class="opts">
      <button class="btn big primary" data-m="back">▶ Продолжить</button>
      ${(S.paper || []).length ? `<button class="btn big" data-m="paper">📰 Газеты о тебе (${S.paper.length})</button>` : ""}
      <button class="btn big" data-m="code">🔑 Код этой жизни: ${B8.seedToCode(S.seed)}</button>
      <button class="btn big" data-m="set">⚙ Настройки</button>
      <button class="btn big" data-m="end">⏹ Досмотреть жизнь автоматически</button>
      <button class="btn big" data-m="menu">🏠 В главное меню (жизнь сохранится)</button></div>
      ${isPC() ? `<p class="why" style="margin-top:0.8rem">Клавиши: пробел — пауза · → — год · 1/2/3 — скорость · 4 — до решения · Д — дела · Ф — фокус · Esc — меню</p>` : ""}`, "pause");
    card.onclick = (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      const m = b.dataset.m;
      if (m === "back") { closeSheet(); play(); }
      if (m === "paper") openPapers();
      if (m === "code") { copy(B8.seedToCode(S.seed)); toast("Код скопирован"); }
      if (m === "set") openSettings();
      if (m === "menu") { closeSheet(); save(true); show("menu"); }
      if (m === "end") { closeSheet(); fastForward(); }
    };
  }
  function fastForward() {
    let g = 0;
    while (S.alive && g++ < 130) { B8.advance(S); let g2 = 0; while (S.pend.length && g2++ < 12) B8.choose(S, B8.autoPick(S), true); }
    TL.run = false; TL.skip = false;
    renderLife(true); save(true); setTimeout(endLife, 300);
  }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) {} }

  // ═════ конец жизни ═════
  function endLife() {
    if (!S || S.alive || UI.endRendered) return;
    UI.endRendered = true;
    B8.finishLife(S);
    const c = S, net = B8.netWorth(c);
    if (!c.meta.counted) {
      c.meta.counted = 1;
      M.atlas[c.cc] = (M.atlas[c.cc] || 0) + 1;
      M.st.lives++; M.st.years += c.age; M.st.maxAge = Math.max(M.st.maxAge, c.age); M.st.maxNet = Math.max(M.st.maxNet, net);
      M.st.kids += c.kids.length; M.st.jail += c.jailTot; if (c.crime.rank >= 5) M.st.bosses++;
      if (c.flags.fugitive) M.st.escapes = (M.st.escapes || 0) + 1;
      if (c.meta.mode === "daily") M.daily[new Date().toISOString().slice(0, 10)] = c.age;
      if (c.meta.mode === "code") M.codes++;
      for (const a of ACH) checkAch(a.id);
    }
    save(true);
    const turns = (c.turns || []).slice(-14).map(([a, t]) => `<div><b>${a}</b> — ${esc(t)}</div>`).join("");
    const k = B8.K(c.cc);
    const peers = peerLives(c);
    const heirs = B8.heirs(c);
    const famous = (c.paper || []).length >= 3;
    const obit = esc(famous ? `Умер${c.sex === "f" ? "ла" : ""} ${B8.fullName(c)} — ${c.sex === "f" ? "героиня" : "герой"} газетных заголовков. ${B8.epitaph(c)}` : `В городе ${c.city} простились с ${c.sex === "f" ? "жительницей" : "жителем"} по имени ${c.first}. ${B8.epitaph(c)}`);
    $("#end").innerHTML = `<canvas id="grave" width="480" height="220" class="grave"></canvas><div class="album" id="album"></div>
      <h1>${esc(B8.fullName(c))}</h1><div class="years">${c.born} — ${c.born + c.age} · ${ageWord(c.age)} · ${esc(k.n)}${c.cur !== c.cc ? " → " + esc(cntry(c.cur)) : ""}</div>
      <div class="years">Причина: ${esc(B8.CAUSE[c.cause] || c.cause)}</div>
      <div class="epi">«${esc(B8.epitaph(c))}»</div>
      <div class="score">${c.score}<small>очки жизни</small></div>
      <h3>Итоги</h3>
      ${kv("Образование", esc(B8.EDU[c.edu]))}${kv("Вершина карьеры", esc(c.peak || "—"))}${kv("Состояние", money(net))}
      ${kv("Средняя радость", Math.round(c.hsum / (c.age + 1)) + "/100")}${kv("Дети и внуки", c.kids.length + " / " + c.gk)}
      ${c.jailTot ? kv("В тюрьме", ageWord(c.jailTot) + (c.prLast && c.prLast.rank >= 3 ? " · " + B8.prison.RANKS[c.prLast.rank] : "")) : ""}
      ${c.flags.fugitive ? kv("Побег", c.flags.statute ? "дождал" + (c.sex === "f" ? "ась" : "ся") + " срока давности" : c.fug ? "так и не поймали" : "был" + (c.sex === "f" ? "а" : "") + " в бегах") : ""}
      ${c.counts.heists ? kv("Ограблений", c.counts.heists) : ""}
      ${c.crime.rank ? kv("В подполье", esc(B8.crime.ORG[c.crime.org].ranks[c.crime.rank])) : ""}
      ${c.cas.visits ? kv("Казино", c.cas.won > c.cas.lost ? "в плюсе на " + money(c.cas.won - c.cas.lost) : "в минусе на " + money(c.cas.lost - c.cas.won)) : ""}
      ${c.sm.best ? kv("Подписчики", B8.social.fmtF(c.sm.best)) : ""}
      ${(c.pets || []).length ? kv("Питомцы", c.pets.map((p) => B8.pets.PK[p.k][1] + " " + esc(p.n)).join(", ")) : ""}
      ${c.letter && c.age < 60 ? `<h3>Непрочитанное письмо</h3><div class="letter">${esc(c.letter)}<br><small>— написано в 18, должно было открыться в 60</small></div>` : ""}
      <h3>Последняя заметка</h3><div class="np clip"><small>📰 ${esc(B8.paperName(c))} · некролог</small><b>${obit}</b></div>
      ${(c.paper || []).length ? `<h3>Газеты о тебе</h3>${papersHTML(c, 6)}` : ""}
      ${turns ? `<h3>Повороты судьбы</h3><div class="turns">${turns}</div>` : ""}
      <h3>Родились в ту же секунду</h3>${peers}
      <div class="end-btns">
        ${heirs.length ? `<button class="btn big primary" data-e="heir">👶 Прожить жизнь ребёнка</button>` : ""}
        <button class="btn big ${heirs.length ? "" : "primary"}" data-e="new">🎲 Новая жизнь</button>
        ${P() && P().canWall() ? `<button class="btn big" data-e="wall">📤 Рассказать друзьям</button>` : ""}
        <button class="btn big" data-e="code">🔑 Код этой жизни: ${B8.seedToCode(c.seed)}</button>
        <button class="btn big ghost" data-e="menu">🏠 В меню</button></div>`;
    B8.drawGrave($("#grave"), c);
    const al = $("#album");
    for (const a of c.album.concat(c.album[c.album.length - 1] === c.age ? [] : [c.age])) {
      const f = document.createElement("figure"), cv = document.createElement("canvas");
      cv.width = cv.height = 96; B8.portrait(cv, c, a, { hap: c.mood[a] != null ? c.mood[a] : 55 });
      f.appendChild(cv); f.insertAdjacentHTML("beforeend", `<figcaption>${a}</figcaption>`); al.appendChild(f);
    }
    show("end");
    $("#scr-end").scrollTop = 0;
    sfx("death");
  }
  function peerLives(c) {
    return (c.peers || []).map((seed) => {
      const p = B8.newLife(seed, { born: c.born, world: c.world });
      let g = 0;
      while (p.alive && g++ < 125) { B8.advance(p); let g2 = 0; while (p.pend.length && g2++ < 12) B8.choose(p, B8.autoPick(p), true); }
      const job = p.peak || "без особой карьеры";
      return `<div class="peer"><b>${esc(B8.fullName(p))} · ${esc(cntry(p.cc))}</b>прожил${p.sex === "f" ? "а" : ""} ${ageWord(p.age)}, ${esc(job)}, ${p.kids.length ? p.kids.length + " " + plural(p.kids.length, "ребёнок", "ребёнка", "детей") : "без детей"}. ${esc(B8.epitaph(p))}</div>`;
    }).join("");
  }
  $("#end").addEventListener("click", (e) => {
    const b = e.target.closest("[data-e]"); if (!b) return;
    sfx("click");
    const a = b.dataset.e;
    if (a === "new") newLife(B8.newSeed(), "new");
    if (a === "menu") show("menu");
    if (a === "code") { copy(B8.seedToCode(S.seed)); toast("Код скопирован: " + B8.seedToCode(S.seed)); }
    if (a === "wall") P().wallPost(`Я прожил${S.sex === "f" ? "а" : ""} жизнь в стране «${cntry(S.cc)}»: ${ageWord(S.age)}, ${S.peak || "простая жизнь"}. «${B8.epitaph(S)}» Код судьбы: ${B8.seedToCode(S.seed)}. А как проживёшь её ты?`);
    if (a === "heir") openHeirs();
  });
  function openHeirs() {
    const old = S, hs = B8.heirs(old);
    const ad = P() && P().hasAds();
    const card = sheet(`<h2>👶 Чью жизнь прожить?</h2><p class="why">Та же страна, город и фамилия. Ты станешь родителем ребёнка и уйдёшь в том же возрасте, что и в этой жизни. Наследство — его старт.</p><div class="opts">${hs.map((k, i) => `<button class="opt" data-h="${i}"><span>${esc(k.n)}<small>${k.sex === "m" ? "сын" : "дочь"}, сейчас ${ageWord(old.age - k.born)}</small></span></button>`).join("")}</div>
      ${ad ? `<button class="btn big" data-ad="1" style="margin-top:0.6rem">📺 Наследство ×2 за рекламу</button>` : ""}<button class="btn big ghost" data-close="1" style="margin-top:0.4rem">Отмена</button>`, "heirs");
    let mult = 1;
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) return closeSheet();
      if (e.target.closest("[data-ad]")) { P().rewarded(() => { mult = 2; toast("Наследство удвоено!", "gold"); }, () => {}); return; }
      const b = e.target.closest("[data-h]"); if (!b) return;
      const kid = hs[+b.dataset.h];
      closeSheet();
      const heir = B8.heirLife(old, kid);
      if (mult > 1) { heir.inherit *= 2; heir.queue.forEach((q) => { if (q[1] === "heir_inherit") q[2].sum *= 2; }); }
      UI.mode = "heir";
      newLife(0, "heir", heir);
      checkAch("dyn");
    };
  }

  // ═════ достижения ═════
  const ACH = [
    ["first", "🌱", "Первая жизнь", "Прожить любую жизнь до конца", (c) => !c.alive],
    ["old90", "🎂", "Долгожитель", "Дожить до 90", (c) => c.age >= 90],
    ["old100", "💯", "Сто лет!", "Дожить до 100", (c) => c.age >= 100],
    ["million", "💵", "Миллионер", "Состояние от $1 млн", (c) => B8.netWorth(c) >= 1e6],
    ["billion", "💎", "Миллиардер", "Состояние от $1 млрд", (c) => B8.netWorth(c) >= 1e9],
    ["rags", "🪜", "Из грязи в князи", "Родиться в бедности и жить в роскоши", (c) => c.startLs === 0 && c.ls >= 4],
    ["fall", "📉", "Всё потерять", "Родиться в роскоши и закончить в нищете", (c) => c.startLs >= 3 && c.ls === 0 && c.age >= 25],
    ["magister", "🎓", "Магистр", "Получить магистерский диплом", (c) => c.edu >= 4],
    ["abroad", "✈️", "Гражданин мира", "Эмигрировать в другую страну", (c) => c.emig],
    ["master", "🏅", "Мастер", "Стать мастером своего увлечения", (c) => !!c.flags.master],
    ["family5", "👨‍👩‍👧‍👦", "Большая семья", "Пять детей и больше", (c) => c.kids.length >= 5],
    ["gk10", "👵", "Глава рода", "Десять внуков", (c) => c.gk >= 10],
    ["biz", "🏪", "Своё дело", "Открыть бизнес", (c) => !!c.biz || (c.turns || []).some((t) => /свой бизнес/.test(t[1]))],
    ["empire", "🏙", "Империя", "Вырастить бизнес до империи", (c) => (c.biz && c.biz.lvl >= 5) || (c.turns || []).some((t) => /бизнес: империя/.test(t[1]))],
    ["ipo", "🔔", "Звонок на бирже", "Вывести компанию на IPO", (c) => (c.turns || []).some((t) => t[1] === "IPO")],
    ["bankrupt", "🧾", "Банкрот", "Пережить банкротство", (c) => !!c.flags.bankrupt],
    ["jackpot", "🎰", "Сорвать банк", "Крупный выигрыш в казино", (c) => !!c.cas.big],
    ["lottery", "🎟", "Счастливый билет", "Джекпот в лотерее", (c) => !!c.flags.lottery],
    ["cured", "🫂", "Сильнее азарта", "Победить игровую зависимость", (c) => !!c.flags.cured_gambling],
    ["boss", "👑", "Глава подполья", "Возглавить криминальную организацию", (c) => c.crime.rank >= 5],
    ["cartel", "🍌", "Банановый король", "Стать главой картеля", (c) => c.crime.rank >= 5 && c.crime.org === "cartel"],
    ["don", "🍝", "Дон", "Стать доном мафиозной семьи", (c) => c.crime.rank >= 5 && c.crime.org === "mafia"],
    ["clean", "🧼", "Сухим из воды", "Подняться до верхушки подполья и ни разу не сесть", (c) => c.crime.rank >= 4 && !c.jailTot && !c.jail],
    ["jail10", "⛓", "Тюремный стаж", "Провести в тюрьме 10 лет", (c) => c.jailTot >= 10],
    ["escape", "🕳", "Побег", "Сбежать из-под стражи", (c) => !!c.flags.fugitive],
    ["redeem", "🕊", "Новая жизнь", "Выйти на свободу и начать заново", (c) => !!c.flags.redeemed],
    ["witness", "🎭", "Новое имя", "Попасть в программу защиты свидетелей", (c) => !!c.flags.witness],
    ["tm", "⏳", "Второй шанс", "Воспользоваться машиной времени", (c) => !!c.tm],
    ["dyn", "🌳", "Династия", "Прожить жизнь своего ребёнка", (c) => (c.gen || 1) >= 2],
    ["dyn3", "🏰", "Три поколения", "Дойти до третьего поколения", (c) => (c.gen || 1) >= 3],
    ["school", "🏫", "Школа твоего имени", "Построить школу", (c) => !!c.flags.school_named],
    ["startup", "🐕", "Собачье такси", "Взлететь со стартапом", (c) => !!c.flags.startup_win],
    ["atlas10", "🗺", "Путешественник душ", "Родиться в 10 разных странах", () => Object.keys(M.atlas).length >= 10],
    ["atlas30", "🌍", "Половина мира", "Родиться в 30 разных странах", () => Object.keys(M.atlas).length >= 30],
    ["daily", "📅", "Жизнь дня", "Прожить жизнь дня", (c) => c.meta && c.meta.mode === "daily" && !c.alive],
    ["code", "🔑", "Чужая судьба", "Прожить жизнь по коду судьбы", (c) => c.meta && c.meta.mode === "code" && !c.alive],
    // 2.0
    ["watcher", "👁", "Смотрящий", "Стать смотрящим в тюрьме", (c) => !!c.flags.watcher],
    ["noodle", "🍜", "Лапшичный магнат", "Заработать за решёткой 100 пачек лапши", (c) => !!c.flags.noodle],
    ["spoon", "🥄", "Ложка судьбы", "Сбежать через подкоп, вырытый ложкой", (c) => !!c.flags.esc_spoon],
    ["heli", "🚁", "Вертолёт подан", "Улететь из тюрьмы на вертолёте", (c) => !!c.flags.esc_heli],
    ["catback", "🐈", "Сбежал и вернулся за кошкой", "Вернуться за тюремным котом после побега", (c) => !!c.flags.cat_back],
    ["choco", "🍫", "Сел за шоколадку", "Получить срок за украденную шоколадку", (c) => !!c.flags.choco_jail],
    ["morein", "🔒", "Там больше, чем здесь", "Отсидеть больше, чем прожил на воле", (c) => !c.alive && c.age > 20 && c.jailTot > c.age - c.jailTot],
    ["lifer", "♾", "Пожизненно", "Получить пожизненный срок", (c) => !!c.flags.lifer],
    ["statute", "⌛", "Срок давности", "Скрываться, пока дело не закроют", (c) => !!c.flags.statute],
    ["wanted", "🚨", "Звезда розыска", "Розыск 90% и выше", (c) => !!c.flags.wanted90],
    ["parrot", "🦜", "Попугай-свидетель", "Вызвать попугая свидетелем в суд", (c) => !!c.flags.parrot],
    ["century", "🏛", "Дело века", "Провернуть ограбление века", (c) => !!c.flags.century],
    ["crew", "🎬", "Банда в сборе", "Ограбление с полной командой из четырёх", (c) => !!c.flags.fullcrew],
    ["heists5", "💰", "Профессионал", "Пять удачных ограблений за жизнь", (c) => !!c.flags.heists5],
    ["judge", "🤝", "Судья-друг", "Выйти из суда благодаря «подарку»", (c) => !!c.flags.judge],
    ["rat", "🐀", "Крыса", "Сдать своих", (c) => !!c.flags.rat],
    ["mfollow", "📱", "Миллион подписчиков", "Набрать миллион подписчиков", (c) => (c.sm && c.sm.best >= 1e6)],
    ["paper10", "📰", "Газетная звезда", "Десять заметок о тебе в газетах", (c) => (c.paper || []).length >= 10],
    ["zoo", "🐾", "Зоопарк", "Пять питомцев за одну жизнь", (c) => !!c.flags.zoo],
    ["pwed", "💒", "Свадьба за решёткой", "Пожениться по переписке, сидя в тюрьме", (c) => !!c.flags.prison_wed],
    ["book", "📕", "Как я сидел", "Написать книгу о тюрьме", (c) => !!c.flags.book],
    ["psych", "🫖", "Чайник", "Убедить психиатра, что ты чайник", (c) => !!c.flags.psych],
    ["recid", "🔁", "Постоянный клиент", "Три судимости", (c) => c.crime.rec >= 3],
  ].map(([id, ic, t, d, f]) => ({ id, ic, t, d, f }));
  const ACH_LIVE = ["million", "billion", "boss", "cartel", "don", "jackpot", "lottery", "old100", "watcher", "noodle", "spoon", "heli", "catback", "choco", "lifer", "statute", "wanted", "parrot",
    "century", "crew", "heists5", "judge", "rat", "mfollow", "paper10", "zoo", "pwed", "book", "psych", "recid", "escape", "witness", "jail10"];
  function checkAch(id) {
    if (!S || !M) return;
    const list = id === "biz" ? ["biz", "empire", "ipo"] : id === "cas" ? ["jackpot"] : id === "crime" ? ["boss", "cartel", "don", "clean", "escape"] : [id];
    for (const x of list) {
      const a = ACH.find((q) => q.id === x);
      if (!a || M.ach[a.id]) continue;
      let ok = false; try { ok = a.f(S); } catch (e) {}
      if (ok) { M.ach[a.id] = Date.now(); toast(`🏆 ${a.ic} ${esc(a.t)}`, "gold"); sfx("win"); }
    }
  }

  // ═════ разделы меню ═════
  function openAtlas() {
    const n = Object.keys(M.atlas).length;
    const list = B8.COUNTRIES.filter((k) => M.atlas[k.c]).map((k) => `${esc(k.n)} ×${M.atlas[k.c]}`).join(", ");
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>🗺 Атлас жизней</h2><p>Прожиты жизни в <b>${n}</b> из 69 стран.</p><canvas id="atlas-cv" width="720" height="280" style="width:100%"></canvas><p class="why">${list || "Пока ни одной прожитой жизни."}</p>`, "atlas");
    B8.drawMap($("#atlas-cv"), { marks: Object.keys(M.atlas).map((c) => [c, "#ffd166", 5]) });
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }
  function openAch() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>🏆 Достижения · ${Object.keys(M.ach).length}/${ACH.length}</h2><div class="people">${ACH.map((a) => `<div class="person ${M.ach[a.id] ? "" : "dead"}"><span>${a.ic} <b>${esc(a.t)}</b><br><small>${esc(a.d)}</small></span><span>${M.ach[a.id] ? "✓" : ""}</span></div>`).join("")}</div>`, "ach");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }
  function openStats() {
    const s = M.st;
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>📊 Статистика</h2>
      ${kv("Прожито жизней", s.lives)}${kv("Всего лет", s.years)}${kv("Самая долгая жизнь", ageWord(s.maxAge))}${kv("Самое большое состояние", money(s.maxNet))}
      ${kv("Детей за все жизни", s.kids)}${kv("Лет в тюрьме", s.jail)}${kv("Удачных ограблений", s.heists || 0)}${kv("Побегов", s.escapes || 0)}${kv("Глав подполья", s.bosses)}${kv("Стран в атласе", Object.keys(M.atlas).length + " из 69")}`, "stats");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }
  function openSettings() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>⚙ Настройки</h2>
      <div class="opts"><button class="opt" data-s="sound"><span>🔊 Звук</span><span class="pc">${M.set.sound !== false ? "вкл" : "выкл"}</span></button>
      <button class="opt" data-s="spd"><span>⏩ Скорость времени по умолчанию<small>год длится ${(YEAR_MS / 1000 / (M.set.spd || 1)).toFixed(1).replace(".", ",")} с</small></span><span class="pc">×${M.set.spd || 1}</span></button>
      <button class="opt" data-s="voice"><span>💭 Голос совести в летописи</span><span class="pc">${M.set.voice !== false ? "вкл" : "выкл"}</span></button>
      <button class="opt" data-s="tut"><span>🎓 Пройти обучение заново</span></button>
      <button class="opt" data-s="reset"><span>🗑 Сбросить весь прогресс</span></button></div>`, "settings");
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) return closeSheet();
      const b = e.target.closest("[data-s]"); if (!b) return;
      const s = b.dataset.s;
      if (s === "sound") { M.set.sound = M.set.sound === false; B8.audio.on = M.set.sound; }
      if (s === "spd") { M.set.spd = { 1: 2, 2: 4, 4: 1 }[M.set.spd || 1]; TL.sp = M.set.spd; }
      if (s === "voice") { M.set.voice = M.set.voice === false; if (S && UI.screen === "life") UI.logShown = 0; }
      if (s === "tut") { M.tut = 0; save(); closeSheet(); show("menu"); TUT.reset(); return; }
      if (s === "reset") {
        sheet(`<h2>Сбросить всё?</h2><p>Удалятся все жизни, атлас, достижения и статистика. Это нельзя отменить.</p><div class="opts"><button class="btn big danger" data-y="1">Да, удалить всё</button><button class="btn big" data-n="1">Отмена</button></div>`, "confirm").onclick = (ev) => {
          if (ev.target.closest("[data-y]")) { M = defMeta(); M.tut = 99; S = null; save(true); closeSheet(); show("menu"); toast("Прогресс сброшен"); }
          if (ev.target.closest("[data-n]")) openSettings();
        };
        return;
      }
      save(); openSettings();
    };
  }
  function openCode() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>🔑 Код судьбы</h2><p>Введи код из 8 знаков — ты родишься тем же человеком, в том же мире. Дальше всё решают твои выборы.</p>
      <input id="code-in" maxlength="9" placeholder="XXXX-XXXX" style="width:100%;font:700 1.4rem monospace;text-align:center;padding:0.6rem;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--tx);text-transform:uppercase">
      <button class="btn big primary" data-go="1" style="margin-top:0.7rem">Родиться</button>`, "code");
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) return closeSheet();
      if (!e.target.closest("[data-go]")) return;
      const seed = B8.codeToSeed($("#code-in").value);
      if (seed == null) { toast("Код не подходит. Нужно 8 знаков, например K7M2-QX9P.", "b"); return; }
      closeSheet(); newLife(seed, "code");
    };
  }
  function openAbout() {
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>ℹ Об игре</h2>
      <p>«1 из 8 миллиардов» — симулятор жизни. Страну рождения выбирает колесо, где у каждой страны сектор равен её доле в рождениях на Земле. Продолжительность жизни, доходы, грамотность и детская смертность — по данным реальных стран.</p>
      <p>Время идёт само: год за годом — события, решения и последствия. Учёба, любовь, карьера, бизнес, казино, питомцы и соцсети. А ещё — тёмные дела: улики, суд, тюрьма, побеги и жизнь в бегах. У каждой страны — свой колорит и своё подполье.</p>
      <p class="why">Все персонажи и организации вымышлены. Казино в игре — только на игровые деньги, купить их нельзя. Криминал в игре — шутка, а в жизни за это сажают. Возраст: 16+.</p>
      <p class="why">Версия ${VERSION} · <a href="privacy.html" target="_blank" style="color:var(--gold)">Конфиденциальность</a> · <a href="terms.html" target="_blank" style="color:var(--gold)">Соглашение</a></p>
      <p class="why">Разработчик: Шакуров Даниил Денисович · ponosolenya@gmail.com</p>`, "about");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }

  // ═════ горячие клавиши ═════
  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.code;
    if (UI.sheet === "mg") { if (B8.mg.key(e)) e.preventDefault(); return; }
    if (UI.sheet === "decision") { const m = /^(Digit|Numpad)([1-9])$/.exec(k); if (m) { const o = $$("#sheet-card .opt")[+m[2] - 1]; if (o) { e.preventDefault(); o.click(); } } return; }
    if (UI.sheet === "result") { if (k === "Enter" || k === "Space" || k === "ArrowRight") { const n = $("#sheet-card [data-n]"); if (n) { e.preventDefault(); n.click(); } } return; }
    if (UI.sheet === "heist") {
      const m = /^(Digit|Numpad)([1-9])$/.exec(k);
      if (m) { const o = $$("#sheet-card [data-i]")[+m[2] - 1]; if (o) { e.preventDefault(); o.click(); } }
      else if (k === "Enter" || k === "Space") { const n = $("#sheet-card [data-n], #sheet-card [data-v], #sheet-card [data-go], #sheet-card [data-next]"); if (n) { e.preventDefault(); n.click(); } }
      return;
    }
    if (UI.sheet) { if (k === "Escape" && !LOCKED.includes(UI.sheet)) { e.preventDefault(); closeSheet(); } return; }
    if (TUT.active() && UI.screen === "life") { if (k === "ArrowRight" || k === "Enter") { const st = cur(); if (st && st.on === "year") { e.preventDefault(); manualYear(); } } return; }
    if (UI.screen !== "life" || !S || !S.alive) return;
    if (k === "Space") { e.preventDefault(); togglePlay(); }
    else if (k === "ArrowRight" || k === "Enter") { e.preventDefault(); manualYear(); }
    else if (k === "Digit1") play(1);
    else if (k === "Digit2") play(2);
    else if (k === "Digit3") play(4);
    else if (k === "Digit4") toggleSkip();
    else if (k === "KeyL" || k === "KeyD") { if (isPC()) { const p = $("#side-r"); p.classList.remove("flash"); void p.offsetWidth; p.classList.add("flash"); } else openActs(); }
    else if (k === "KeyA" || k === "KeyF") cycleFocus();
    else if (k === "Escape") openLifeMenu();
  });
  let wasPC = isPC() + "" + isWide();
  window.addEventListener("resize", () => { const n = isPC() + "" + isWide(); if (n !== wasPC) { wasPC = n; if (UI.screen === "life" && S) { if (UI.sheet === "acts" && isPC()) closeSheet(); renderLife(true); } } });

  // ═════ ОБУЧЕНИЕ — прямо в игре, шаг за шагом ═════
  const TS = [
    { k: "start", at: "menu", dom: '[data-a="new"]', on: "newLife", t: "Привет! Это симулятор жизни. Ты не выбираешь, где родиться — как и восемь миллиардов людей на Земле. Жми «**Новая жизнь**»." },
    { k: "spin", at: "wheel", dom: "#spin", on: "spun", t: "Это колесо стран. Чем больше детей рождается в стране, тем шире её сектор: Индия — пятая часть круга, Норвегия — тонкая полоска. **Крути!**" },
    { k: "go", at: "wheel", ring: ["#wheel-res", "#wheel-go"], dom: "#wheel-go", on: "toBirth", t: "Судьба решила. Жми «**Дальше**»." },
    { k: "cert", at: "birth", ring: "#cert", btn: "ok", t: "Твоё свидетельство о рождении: имя, семья, вера, достаток. Всё случайно — как в жизни. От этого зависит, что тебя ждёт." },
    { k: "live", at: "birth", dom: "#cert-go", on: "lifeStart", t: "Жми «**Начать жизнь**»." },
    { k: "stats", at: "life", ring: ["#stats", "#dossier .dz-stats"], btn: "ok", t: "Это **шкалы жизни**: здоровье, счастье, ум, отношения с людьми и стресс. Они меняются от событий и твоих решений." },
    { k: "year", at: "life", dom: "#btn-year", on: "year", t: "Пока время на паузе. Жми «**＋ Год**» — проживёшь целый год." },
    { k: "log", at: "life", ring: "#log", dom: "#btn-year", on: "year", t: "Всё, что случилось, — в **летописи**. Серым — причина события. Жми «**＋ Год**» ещё раз." },
    { k: "choice", at: "sheet:decision", ring: "#sheet-card", dom: ".opt", on: "choice", t: "**Решения!** Каждый выбор меняет характер и будущее. Если у варианта есть процент — это шанс, что всё получится. Выбери." },
    { k: "next", at: "sheet:result", dom: "[data-n]", on: "closed:result", t: "Вот что вышло. Жми «**Дальше**»." },
    { k: "acts", at: "life", dom: "#btn-acts", on: "acts", t: "А это «**Дела**»: учёба, работа, любовь, питомцы, бизнес, казино и даже тёмные дела. Открой.",
      pc: { dom: null, on: null, ring: "#side-r", btn: "ok", t: "Справа — «**Дела**»: учёба, работа, любовь, питомцы, бизнес, казино и даже тёмные дела. Пока ты малыш, дел немного. Каждое дело — раз в год." } },
    { k: "actsIn", at: "sheet:acts", ring: "#sheet-card", btn: "ok", pcSkip: true, t: "Пока ты малыш, дел немного. С возрастом откроются школа и работа, с 14 — тёмные дела, с 18 — бизнес, казино и ограбления. Каждое дело — раз в год." },
    { k: "close", at: "sheet:acts", dom: "[data-close]", on: "closed:acts", pcSkip: true, t: "Закрой и живи дальше." },
    { k: "time", at: "life", ring: "#timeline", btn: "ok", t: "Сверху — **полоса года**. Время идёт само: ▶ и ⏸ — пуск и пауза, ×2 и ×4 — быстрее, ⏭ — мотать до следующего решения, ⏪ — машина времени. На решениях игра сама встаёт на паузу.",
      pc: { t: "Сверху — **полоса года**. Время идёт само: ▶ и ⏸ — пуск и пауза (или пробел), ×2 и ×4 — быстрее, ⏭ — до следующего решения, ⏪ — машина времени. Решения — клавишами 1–4." } },
    { k: "focus", at: "life", ring: "#focus", btn: "go", t: "А это **фокус года**: на что ты тратишь время — учёба, карьера, здоровье, деньги… С 14 появится «Улица», с 18 — «Тёмные дела». Дальше — твоя жизнь. Удачи!" },
  ];
  const TUT = {};
  let stepAt = 0, painted = "", scrolled = -1, waiting = -1;
  TUT.active = () => M && M.tut < TS.length;
  TUT.done = () => !TUT.active();
  TUT.reset = () => { stepAt = performance.now(); painted = ""; scrolled = -1; waiting = -1; };
  function cur() { if (!TUT.active()) return null; const st = TS[M.tut]; return isPC() && st.pc ? Object.assign({}, st, st.pc) : st; }
  function next() { if (!TUT.active()) return; M.tut++; while (TUT.active() && isPC() && TS[M.tut].pcSkip) M.tut++; TUT.reset(); save(); if (!TUT.active()) TUT.finish(); }
  TUT.finish = () => { M.tut = 99; $("#tut").hidden = true; save(); if (UI.screen === "life" && S && S.alive) play(M.set.spd || 1); };
  TUT.ev = function (name) {
    if (!TUT.active()) return;
    const st = cur();
    if (!st || st.on !== name || waiting === M.tut) return;
    const at = (waiting = M.tut);
    setTimeout(() => { if (M.tut === at) next(); }, 250);
  };
  function ctxOk(st) {
    if (st.at.startsWith("sheet:")) return UI.sheet === st.at.slice(6);
    return UI.screen === st.at && !UI.sheet;
  }
  const visAll = (sel) => $$(sel).filter((e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0);
  function rectOf(sel, all) {
    const list = (Array.isArray(sel) ? sel : [sel]).flatMap((x) => (all ? visAll(x) : visAll(x).slice(0, 1)));
    if (!list.length) return null;
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    for (const e of list) { const r = e.getBoundingClientRect(); x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom); }
    const app = $("#app").getBoundingClientRect();
    return { x: x1 - 5 - app.left, y: y1 - 5 - app.top, w: x2 - x1 + 10, h: y2 - y1 + 10, el: list[0] };
  }
  function tutFrame() {
    requestAnimationFrame(tutFrame);
    const box = $("#tut"), st = cur();
    const vis = !!st && ctxOk(st) && performance.now() - stepAt > 300 && !spinning;
    if (box.hidden === vis) box.hidden = !vis;
    if (!vis) return;
    const key = M.tut + (isPC() ? "p" : "m");
    if (painted !== key) {
      painted = key;
      const shown = isPC() ? TS.filter((x) => !x.pcSkip).length : TS.length;
      const idx = isPC() ? TS.slice(0, M.tut).filter((x) => !x.pcSkip).length : M.tut;
      $("#tut-step").textContent = `${idx + 1}/${shown}`;
      $("#tut-text").innerHTML = esc(st.t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      const b = $("#tut-btn"); b.hidden = !st.btn; b.textContent = st.btn === "go" ? "Поехали!" : "Понятно";
      const sk = $("#tut-skip"); sk.hidden = M.tut < 2 || st.btn === "go";
      $(".tut-btns").hidden = b.hidden && sk.hidden;
      const bub = $("#tut-bubble"); bub.classList.remove("in"); void bub.offsetWidth; bub.classList.add("in");
    }
    const fr = st.dom ? rectOf(st.dom) : null;
    const rr = st.ring ? rectOf(st.ring, true) || fr : fr;
    const target = fr || rr;
    if (target && scrolled !== M.tut) { scrolled = M.tut; const r = target.el.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) target.el.scrollIntoView({ block: "center" }); }
    const ring = $("#tut-ring"), spot = $("#tut-spot"), fin = $("#tut-finger"), bub = $("#tut-bubble");
    const place = (el, r) => { if (r) { Object.assign(el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" }); el.hidden = false; } else el.hidden = true; };
    const inside = (a, b) => a && b && a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
    const sp = fr && rr && !inside(fr, rr) ? fr : null;
    place(ring, rr); place(spot, sp);
    const app = $("#app").getBoundingClientRect(), vw = app.width, vh = app.height;
    const holes = [rr, sp].filter(Boolean);
    const hole = (r) => { const k = Math.min(12, r.w / 2, r.h / 2); return `M${r.x + k} ${r.y}H${r.x + r.w - k}Q${r.x + r.w} ${r.y} ${r.x + r.w} ${r.y + k}V${r.y + r.h - k}Q${r.x + r.w} ${r.y + r.h} ${r.x + r.w - k} ${r.y + r.h}H${r.x + k}Q${r.x} ${r.y + r.h} ${r.x} ${r.y + r.h - k}V${r.y + k}Q${r.x} ${r.y} ${r.x + k} ${r.y}Z`; };
    const shade = $("#tut-shade"); shade.hidden = !holes.length;
    if (holes.length) shade.firstElementChild.setAttribute("d", `M0 0H${vw}V${vh}H0Z` + holes.map(hole).join(""));
    if (fr) { Object.assign(fin.style, { left: fr.x + fr.w / 2 + "px", top: fr.y + fr.h / 2 + "px" }); fin.hidden = false; } else fin.hidden = true;
    const bh = bub.offsetHeight || 120;
    let by, bx = null;
    if (st.at.startsWith("sheet:")) { const top = $("#sheet-card").getBoundingClientRect().top - app.top; by = top > bh + 16 ? top - bh - 10 : 8; }
    else if (!rr) by = vh / 2 - bh / 2;
    else if (isPC() && rr.w < vw * 0.4 && st.at === "life") { by = Math.max(8, Math.min(vh - bh - 8, rr.y + rr.h / 2 - bh / 2)); bx = rr.x > vw / 2 ? Math.max(8, rr.x - 380) : Math.min(vw - 380, rr.x + rr.w + 14); }
    else if (rr.y + rr.h / 2 > vh * 0.5) by = Math.max(8, rr.y - bh - 14);
    else by = Math.min(vh - bh - 8, rr.y + rr.h + 14);
    bub.style.top = Math.round(by) + "px";
    if (bx != null) { bub.style.left = Math.round(bx) + "px"; bub.style.right = "auto"; bub.style.width = "360px"; bub.style.margin = "0"; }
    else { bub.style.left = ""; bub.style.right = ""; bub.style.width = ""; bub.style.margin = ""; }
  }
  $("#tut-btn").onclick = () => { const st = cur(); if (!st) return; sfx("click"); if (st.btn === "go") { TUT.finish(); toast("Удачной жизни!", "gold"); } else next(); };
  $("#tut-skip").onclick = () => { sfx("click"); TUT.finish(); };

  // ═════ запуск ═════
  async function boot() {
    loadAll();
    if (M.st.lives > 0 && M.tut < 99 && !TUT.active()) M.tut = 99;
    TL.sp = M.set.spd || 1;
    show("menu");
    requestAnimationFrame(tutFrame);
    try {
      const ok = await P().init();
      if (ok && P().vk) {
        const cl = await P().cloudLoad();
        if (cl && cl.m && (cl.m.st.lives > M.st.lives || (!S && cl.l))) { M = Object.assign(defMeta(), cl.m); M.set = Object.assign({ sound: true, spd: 1, voice: true }, M.set || {}); if (cl.l) S = B8.migrate(cl.l); B8.audio.on = M.set.sound !== false; show("menu"); }
      }
      P().ready();
    } catch (e) {}
    document.addEventListener("visibilitychange", () => { if (document.hidden) { if (TL.run || TL.skip) pause(); save(true); } });
  }
  window.addEventListener("DOMContentLoaded", boot);
  B8.debug = { get S() { return S; }, set S(v) { S = v; }, get M() { return M; }, UI, TL, show, openDecision, renderLife, TUT, ACH, play, pause, isPC, openHeist, openPoster, openPapers };
})();
