/* 1 из 8 миллиардов — интерфейс: меню, колесо стран, свидетельство, жизнь, дела, казино, тёмные дела, итоги, обучение. */
(function () {
  "use strict";
  const B8 = window.B8, R = B8.R;
  const VERSION = "1.0.0";
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const sfx = (n) => B8.audio && B8.audio.sfx(n);
  const money = (x) => B8.money(x);
  const P = () => B8.platform;
  let S = null; // текущая жизнь
  let M = null; // всё, что живёт дольше одной жизни: атлас, достижения, статистика, настройки, обучение
  const UI = { screen: "menu", sheet: null, auto: false, autoT: 0, logShown: 0, lastAge: -1, rerolls: 0, mode: "new", endRendered: false };
  B8.ui = UI;

  // ═════ сохранение ═════
  const KEY_L = "b8_life", KEY_M = "b8_meta";
  function defMeta() { return { v: 1, atlas: {}, ach: {}, st: { lives: 0, years: 0, maxAge: 0, maxNet: 0, kids: 0, jail: 0, bosses: 0 }, set: { sound: true, speed: 1 }, tut: 0, lastAd: 0, daily: {}, codes: 0 }; }
  function loadAll() {
    try { M = Object.assign(defMeta(), JSON.parse(localStorage.getItem(KEY_M) || "null") || {}); } catch (e) { M = defMeta(); }
    try { S = JSON.parse(localStorage.getItem(KEY_L) || "null"); } catch (e) { S = null; }
    if (S && (!S.v || S.done)) S = S.done ? S : null;
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
    if (S) { life = Object.assign({}, S, { log: S.log.slice(-220), snaps: [] }); }
    P().cloudSave({ m: M, l: life, at: Date.now() }, force);
  }
  B8.toast = toast;

  // ═════ мелочи ═════
  function toast(t, kind) {
    const d = document.createElement("div");
    d.className = "toast " + (kind || "");
    d.innerHTML = t;
    $("#toasts").appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
  function show(name) {
    UI.screen = name;
    for (const s of $$(".scr")) s.hidden = s.id !== "scr-" + name;
    if (name !== "life") stopAuto();
    if (name === "menu") renderMenu();
    if (name === "life") renderLife(true);
    TUT.ev("screen:" + name);
  }
  function sheet(html, kind, onClose) {
    UI.sheet = kind || "sheet";
    UI.onClose = onClose || null;
    const card = $("#sheet-card");
    card.innerHTML = html;
    card.scrollTop = 0;
    $("#sheet").hidden = false;
    stopAuto(true);
    TUT.ev("sheet:" + UI.sheet);
    return card;
  }
  function closeSheet() {
    $("#sheet").hidden = true;
    const k = UI.sheet;
    UI.sheet = null;
    if (UI.onClose) { const f = UI.onClose; UI.onClose = null; f(); }
    TUT.ev("closed:" + k);
    if (UI.screen === "life") { renderLife(); resumeAuto(); }
  }
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet" && !["decision", "result", "casino", "confirm"].includes(UI.sheet)) closeSheet(); });
  const ageWord = (n) => n + " " + B8.years(n);
  const pct = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const cntry = (code) => B8.K(code).n;

  // ═════ меню ═════
  let mapAnim = 0, births = 0, bornT0 = 0;
  function renderMenu() {
    const has = S && S.alive && !S.done;
    const today = new Date().toISOString().slice(0, 10);
    const b = [];
    if (has) b.push(`<button class="btn big primary" data-a="cont">▶ Продолжить жизнь<small>${esc(B8.fullName(S))}, ${ageWord(S.age)} · ${esc(cntry(S.cur))}</small></button>`);
    b.push(`<button class="btn big ${has ? "" : "primary"}" data-a="new">🎲 Новая жизнь<small>колесо решит, где ты родишься</small></button>`);
    b.push(`<div class="row"><button class="btn" data-a="daily">📅 Жизнь дня<small>${M.daily[today] ? "уже прожита" : "одна на всех сегодня"}</small></button><button class="btn" data-a="code">🔑 Код судьбы<small>прожить чужую жизнь</small></button></div>`);
    b.push(`<div class="row"><button class="btn" data-a="atlas">🗺 Атлас<small>${Object.keys(M.atlas).length} из 69 стран</small></button><button class="btn" data-a="ach">🏆 Достижения<small>${Object.keys(M.ach).length} из ${ACH.length}</small></button></div>`);
    b.push(`<div class="row"><button class="btn" data-a="stats">📊 Статистика<small>${M.st.lives} ${plural(M.st.lives, "жизнь", "жизни", "жизней")}</small></button><button class="btn" data-a="set">⚙ Настройки<small>звук, скорость, обучение</small></button></div>`);
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
    // за секунду на Земле рождается ~4,3 ребёнка
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
      UI.logShown = 0; UI.endRendered = false;
      if (heir) { renderBirth(); show("birth"); return; }
      openWheel();
    };
    // реклама — только в естественной паузе: перед новой жизнью, не в первой, не чаще раза в 3 минуты
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
    $("#ticker").innerHTML = `<b>${c.born + c.age}:</b> ${esc(B8.ticker(c))} · Ты богаче ${B8.percentile(c)}% людей Земли`;
    renderLog(full);
    $("#btn-year").disabled = !c.alive;
    $("#btn-auto").classList.toggle("on", UI.auto);
    $("#btn-auto").textContent = UI.auto ? "⏸" : "⏩";
  }
  function renderLog(full) {
    const box = $("#log"), c = S;
    if (full || UI.logShown > c.log.length) { box.innerHTML = ""; UI.logShown = Math.max(0, c.log.length - 160); if (UI.logShown) box.innerHTML = `<button class="btn sm ghost more" data-more="1">Показать раньше</button>`; }
    let html = "", lastAge = UI.logShown ? c.log[UI.logShown - 1][0] : -1;
    const lastNode = box.lastElementChild;
    if (lastNode && lastNode.dataset && lastNode.dataset.age != null) lastAge = +lastNode.dataset.age;
    for (let i = UI.logShown; i < c.log.length; i++) {
      const [a, t, k, why, big] = c.log[i];
      if (a !== lastAge) { html += `<div class="yr" data-age="${a}">${ageWord(a)}<small>${c.born + a}</small></div>`; lastAge = a; }
      html += `<div class="ev ${k}${big ? " big" : ""}${full ? "" : " new"}" data-age="${a}"><i></i><span>${esc(t)}${why ? `<em>← ${esc(why)}</em>` : ""}</span></div>`;
    }
    UI.logShown = c.log.length;
    if (html) { box.insertAdjacentHTML("beforeend", html); box.scrollTop = box.scrollHeight; }
  }
  $("#log").addEventListener("click", (e) => {
    if (!e.target.closest("[data-more]")) return;
    const box = $("#log"), c = S;
    let html = "", lastAge = -1;
    for (let i = 0; i < c.log.length; i++) { const [a, t, k, why, big] = c.log[i]; if (a !== lastAge) { html += `<div class="yr" data-age="${a}">${ageWord(a)}<small>${c.born + a}</small></div>`; lastAge = a; } html += `<div class="ev ${k}${big ? " big" : ""}" data-age="${a}"><i></i><span>${esc(t)}${why ? `<em>← ${esc(why)}</em>` : ""}</span></div>`; }
    box.innerHTML = html; UI.logShown = c.log.length;
  });

  // ═════ ход времени ═════
  function nextYear() {
    if (!S || !S.alive || UI.sheet) return;
    if (S.pend.length) { openDecision(); return; }
    const dang = S.age;
    B8.advance(S);
    sfx(S.alive ? "year" : "death");
    renderLife();
    for (const k of ACH_LIVE) checkAch(k);
    if (!S.alive) { stopAuto(); save(true); setTimeout(() => endLife(), 900); return; }
    if (S.age % 5 === 0) save();
    TUT.ev("year", dang);
    if (S.pend.length) setTimeout(openDecision, UI.auto ? 250 : 150);
  }
  $("#btn-year").onclick = () => { sfx("click"); nextYear(); };
  $("#btn-acts").onclick = () => { sfx("click"); openActs(); TUT.ev("acts"); };
  $("#btn-auto").onclick = () => { sfx("click"); UI.auto ? stopAuto() : startAuto(); TUT.ev("auto"); };
  $("#me").onclick = () => { sfx("click"); openProfile(); };
  $("#life-menu").onclick = () => { sfx("click"); openLifeMenu(); };
  function startAuto() { if (!S || !S.alive) return; UI.auto = true; UI.autoPaused = false; renderLife(); autoTick(); }
  function stopAuto(pause) { if (pause && UI.auto) { UI.autoPaused = true; return; } UI.auto = false; UI.autoPaused = false; clearTimeout(UI.autoT); if (UI.screen === "life" && S) { $("#btn-auto").classList.remove("on"); $("#btn-auto").textContent = "⏩"; } }
  function resumeAuto() { if (UI.auto && UI.autoPaused) { UI.autoPaused = false; autoTick(); } }
  function autoTick() {
    clearTimeout(UI.autoT);
    if (!UI.auto || UI.autoPaused) return;
    const sp = [1300, 750, 380][M.set.speed != null ? M.set.speed : 1];
    UI.autoT = setTimeout(() => { if (UI.auto && !UI.sheet && UI.screen === "life") nextYear(); if (UI.auto && !UI.autoPaused) autoTick(); }, sp);
  }

  // ═════ решения ═════
  function openDecision() {
    if (!S || !S.pend.length) return;
    const v = B8.view(S, S.pend[0]);
    sfx("decide");
    const html = `<h2>${v.icon || "🔀"} ${esc(v.title)}</h2>${v.why ? `<div class="why">← ${esc(v.why)}</div>` : ""}<div class="dec-text">${esc(v.text)}</div>
      <div class="opts">${v.opts.map((o) => `<button class="opt" data-i="${o.i}"><span>${esc(o.t)}${o.hint ? `<small>${esc(o.hint)}</small>` : ""}</span>${o.p != null ? `<span class="pc">${o.p}%</span>` : ""}</button>`).join("")}</div>`;
    const card = sheet(html, "decision");
    card.onclick = (e) => {
      const b = e.target.closest("[data-i]");
      if (!b) return;
      const r = B8.choose(S, +b.dataset.i);
      sfx(r.ok === false ? "bad" : r.ok ? "good" : "click");
      for (const k of ACH_LIVE) checkAch(k);
      TUT.ev("choice");
      const kind = r.ok === false ? "b" : r.ok ? "g" : "";
      card.innerHTML = `<h2>${v.icon || "🔀"} ${esc(v.title)}</h2>${r.text ? `<div class="res ${kind}">${esc(r.text)}</div>` : `<div class="res">Решение принято.</div>`}<button class="btn big primary" data-n="1">Дальше</button>`;
      UI.sheet = "result";
      card.onclick = (ev) => {
        if (!ev.target.closest("[data-n]")) return;
        if (!S.alive) { closeSheet(); stopAuto(); save(true); setTimeout(endLife, 500); return; }
        if (S.pend.length) openDecision(); else closeSheet();
      };
      save();
    };
  }
  function pushDecision(id, d) { const ok = B8.fire(S, id, d || {}); if (ok && S.pend.length) openDecision(); else { closeSheet(); } }

  // ═════ дела ═════
  function openActs() {
    if (!S || !S.alive) return;
    const groups = B8.acts.groups(S);
    if (!groups.length) { toast("Пока ты слишком мал[|а] для дел. Расти!".replace("[|а]", S.sex === "f" ? "а" : "")); return; }
    const html = `<h2>📋 Дела <small style="color:var(--mut);font-weight:400">· ${ageWord(S.age)}</small></h2>` + groups.map(([t, items]) => `<h3>${esc(t)}</h3><div class="grid2">${items.map((it) =>
      `<button class="act" data-act="${it.id}" ${it.ok ? "" : "disabled"}><span class="i">${it.icon}</span><span><b>${esc(B8.fmt(S, it.label))}</b><small>${esc(B8.fmt(S, it.ok ? it.hint || "" : it.why || it.hint || ""))}</small></span></button>`).join("")}</div>`).join("") +
      `<div style="margin-top:1rem"><button class="btn big" data-close="1">Закрыть</button></div>`;
    const card = sheet(html, "acts");
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) { closeSheet(); return; }
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      sfx("click");
      runAct(b.dataset.act);
    };
  }
  function runAct(id) {
    if (id === "j_rew") {
      P().rewarded(() => { S.flags.jail_ad = 1; S.jail = Math.max(1, S.jail - 1); B8.say(S, "Примерное поведение: срок сократили на год.", "g"); toast("Срок сокращён на год", "gold"); renderLife(); save(); }, () => openActs());
      return;
    }
    const r = B8.acts.run(S, id);
    if (r.open) return openSub(r.open);
    afterAct(r);
    openActs();
  }
  function afterAct(r) {
    if (r && r.text) { toast(esc(r.text), r.kind); sfx(r.kind === "g" ? "good" : r.kind === "b" ? "bad" : "click"); }
    for (const k of ACH_LIVE) checkAch(k);
    renderLife();
    save();
    if (!S.alive) { closeSheet(); setTimeout(endLife, 600); return true; }
    if (S.pend.length) { setTimeout(openDecision, 200); return true; }
    return false;
  }
  function openSub(what) {
    const c = S, gdp = B8.gdp(c);
    const back = `<button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад к делам</button>`;
    const wire = (card, fn) => { card.onclick = (e) => { if (e.target.closest("[data-back]")) { sfx("click"); openActs(); return; } fn(e); }; };
    if (["dating", "propose", "divorce", "baby", "adopt", "cancer"].includes(what)) { c.ya[what] = 1; return pushDecision("act_" + what); }
    if (what === "focus") {
      const set = B8.focusSet(c);
      wire(sheet(`<h2>🎯 Фокус года</h2><p class="why">На что ты тратишь свободное время в этом году. Действует, пока не сменишь.</p><div class="opts">${set.map(([k, l, h]) => `<button class="opt" data-f="${k}"><span>${esc(l)}<small>${esc(h)}</small></span>${c.focus === k ? '<span class="pc">сейчас</span>' : ""}</button>`).join("")}</div>${back}`, "focus"), (e) => {
        const b = e.target.closest("[data-f]"); if (!b) return;
        c.focus = b.dataset.f; sfx("good"); toast("Фокус: " + esc(set.find((x) => x[0] === c.focus)[1])); TUT.ev("focus"); openActs();
      });
      return;
    }
    if (what === "jobs") {
      const offers = B8.jobOffers(c);
      wire(sheet(`<h2>🔎 Вакансии</h2>${offers.length ? "" : "<p>Подходящих вакансий нет. Нужно образование.</p>"}<div class="opts">${offers.map((o, i) => {
        const F = B8.FIELDS[o.f], pay = gdp * B8.JOB_MULT[o.lvl] * F[2] * (0.6 + c.iq / 125) * (c.urban ? 1 : 0.7);
        return `<button class="opt" data-j="${i}"><span>${esc(B8.fmt(c, F[3][o.lvl - 1]))}<small>${esc(F[0])} · около ${money(pay)} в год</small></span><span class="pc">${Math.round(Math.min(95, 45 + c.iq / 3 + c.sk / 4))}%</span></button>`;
      }).join("")}</div>${back}`, "jobs"), (e) => {
        const b = e.target.closest("[data-j]"); if (!b) return;
        c.ya.jobs = 1;
        const o = offers[+b.dataset.j];
        if (R.r(c) < Math.min(0.95, (45 + c.iq / 3 + c.sk / 4) / 100)) { B8.takeJob(c, o.f, o.lvl); afterAct({ text: B8.fmt(c, "Тебя взяли! Новая работа: {job}."), kind: "g" }); }
        else { B8.say(c, "Собеседование не прошло. «Мы вам перезвоним».", "b"); afterAct({ text: "Не взяли. «Мы вам перезвоним».", kind: "b" }); }
        openActs();
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
        openActs();
      });
      return;
    }
    if (what === "home") {
      const price = gdp * (c.urban ? 6 : 3) * (1 + c.ls * 0.25);
      wire(sheet(`<h2>🏠 Своё жильё</h2><p>Цена — около ${money(price)}.</p><div class="opts"><button class="opt" data-h="cash" ${c.money >= price ? "" : "disabled"}><span>Купить сразу</span></button><button class="opt" data-h="mort" ${c.money >= price * 0.2 ? "" : "disabled"}><span>Ипотека на 20 лет<small>первый взнос ${money(price * 0.2)}</small></span></button></div>${back}`, "home"), (e) => {
        const b = e.target.closest("[data-h]"); if (!b || b.disabled) return;
        c.ya.home = 1; afterAct(B8.acts.mortgage(c, b.dataset.h === "cash")); openActs();
      });
      return;
    }
    if (what === "invest") {
      wire(sheet(`<h2>📊 Инвестиции</h2><p>Сейчас вложено: ${money(c.inv)}. В среднем фонды растут на 5–8% в год, но бывают обвалы.</p><div class="opts">${[0.1, 0.3, 0.6, 0.9].map((x) => `<button class="opt" data-p="${x}"><span>Вложить ${Math.round(x * 100)}% денег</span><span class="pc">${money(c.money * x)}</span></button>`).join("")}</div>${back}`, "invest"), (e) => {
        const b = e.target.closest("[data-p]"); if (!b) return;
        c.ya.invest = 1; afterAct(B8.acts.invest(c, +b.dataset.p)); openActs();
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
      const ad = P() && P().hasAds();
      wire(sheet(`<h2>⏳ Машина времени</h2><p>Раз за жизнь можно вернуться на 5 лет назад и прожить их иначе. Всё, что случилось за эти годы, исчезнет.</p><div class="opts"><button class="btn big primary" data-t="go">Вернуться на 5 лет назад</button></div>${back}`, "tm"), (e) => {
        if (!e.target.closest("[data-t]")) return;
        S = B8.timeMachine(S); UI.logShown = 0; sfx("win"); closeSheet(); renderLife(true); checkAch("tm"); save(true);
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
      if (e.target.closest("[data-back]")) return openActs();
      const b = e.target.closest("[data-k]"); if (!b || b.disabled) return;
      afterAct(B8.biz.open(c, b.dataset.k)); checkAch("biz"); openBiz();
    };
  }
  function openBiz() {
    const c = S, b = c.biz;
    if (!b) return openActs();
    const acts = B8.biz.acts(c);
    const card = sheet(`<h2>🏢 ${esc(b.name)}</h2><div class="kv"><span>Вид</span><span>${esc(b.kind)}</span></div><div class="kv"><span>Уровень</span><span>${esc(B8.biz.LVL[b.lvl])}</span></div>
      <div class="kv"><span>Стоимость</span><span>${money(b.val)}</span></div><div class="kv"><span>Прибыль за прошлый год</span><span class="${b.profit >= 0 ? "win" : "loss"}">${money(b.profit)}</span></div><div class="kv"><span>Лет бизнесу</span><span>${b.y}</span></div><div class="kv"><span>Управляющий</span><span>${b.mgr ? "есть" : "ты сам[|а]".replace("[|а]", c.sex === "f" ? "а" : "")}</span></div>
      <h3>Что сделать в этом году</h3><div class="opts">${acts.map((a) => `<button class="opt" data-b="${a.id}" ${a.ok && !c.ya["biz_" + a.id] ? "" : "disabled"}><span>${esc(a.label)}</span></button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "biz");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return openActs();
      const x = e.target.closest("[data-b]"); if (!x || x.disabled) return;
      const r = B8.biz.act(c, x.dataset.b); afterAct(r); checkAch("biz");
      if (c.biz) openBiz(); else openActs();
    };
  }

  // ── казино ──
  const CAS = { game: "roulette", bet: 0, bj: null, busy: false };
  function openCasinoPlaces() {
    const c = S, acc = B8.casino.access(c);
    if (!acc.ok) { toast(esc(acc.why)); return; }
    if (acc.list.length === 1) return enterCasino(acc.list[0]);
    const card = sheet(`<h2>🎰 Казино</h2>${acc.note ? `<p class="why">${esc(acc.note)}</p>` : ""}<div class="opts">${acc.list.map((p, i) => `<button class="opt" data-p="${i}" ${c.money >= p.cost ? "" : "disabled"}><span>${esc(p.label)}${p.risk ? "<small>может нагрянуть полиция</small>" : ""}</span>${p.cost ? `<span class="pc">${money(p.cost)}</span>` : ""}</button>`).join("")}</div><button class="btn big" data-back="1" style="margin-top:0.8rem">← Назад</button>`, "casplace");
    card.onclick = (e) => { if (e.target.closest("[data-back]")) return openActs(); const b = e.target.closest("[data-p]"); if (!b || b.disabled) return; enterCasino(acc.list[+b.dataset.p]); };
  }
  function enterCasino(place) {
    const r = B8.casino.enter(S, place);
    if (r.raid) { sfx("siren"); afterAct({ text: r.text, kind: "b" }); return openActs(); }
    CAS.bj = null; CAS.bet = B8.casino.bets(S)[0] || 0;
    renderCasino("Добро пожаловать! Ставки сделаны на игровые деньги — других здесь нет.");
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
    if (t.closest("[data-leave]")) { const r = B8.casino.leave(c); checkAch("cas"); afterAct(r ? { text: r.text, kind: r.diff > 0 ? "g" : r.diff < 0 ? "b" : "" } : null); return openActs(); }
    const bet = CAS.bet;
    if (!bet || bet > c.money) return;
    const fin = (win, txt) => { sfx(win > 0 ? "win" : win < 0 ? "lose" : "click"); checkAch("cas"); return `${txt} ${win > 0 ? `<span class="win">+${money(win)}</span>` : win < 0 ? `<span class="loss">−${money(-win)}</span>` : "ставка возвращена"}`; };
    const r = t.closest("[data-r]");
    if (r) {
      let kind = r.dataset.r, val = r.dataset.v != null ? +r.dataset.v : 0;
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
      const spin = setInterval(() => { sfx("tick"); const fake = [0, 1, 2].map((j) => (i > 6 + j * 3 ? res.r[j] : R.pick(S, B8.casino.SYM))); renderCasino("…", { r: fake }); if (++i > 14) { clearInterval(spin); CAS.busy = false; renderCasino(fin(res.win, res.mult >= 30 ? "ДЖЕКПОТ!" : res.mult ? "Есть совпадение!" : "Мимо."), res); } }, 80);
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
      const g = CAS.bj;
      if (g.done) return renderCasino(fin(g.win, { bj: "Блэкджек!", win: "Победа!", push: "Ничья.", lose: "Дилер сильнее.", bust: "Перебор!" }[g.res]));
      return renderCasino("Ещё карту или хватит?");
    }
  }

  // ── тёмные дела ──
  function openCrime() {
    const c = S, cr = c.crime, ops = B8.crime.opsFor(c);
    const left = 3 - (c.ya.crime || 0);
    const head = cr.on ? `<div class="kv"><span>Организация</span><span>${esc(cr.orgName)}</span></div><div class="kv"><span>Положение</span><span>${esc(B8.crime.rankTitle(c))}</span></div>`
      : `<p class="why">Ты пока сам[|а] по себе. Вступить в организацию можно, если там тебя заметят: нужна репутация.</p>`.replace("[|а]", c.sex === "f" ? "а" : "");
    const rep = Math.min(100, cr.rep / 6);
    const card = sheet(`<h2>🕶 Тёмные дела</h2>${head}
      <div class="why">Репутация в подполье: ${Math.round(cr.rep)}</div><div class="meter"><i style="width:${rep}%;background:var(--pur)"></i></div>
      <div class="why">Внимание полиции: ${Math.round(cr.heat)}%</div><div class="meter"><i style="width:${cr.heat}%;background:var(--bad)"></i></div>
      ${cr.rec ? `<div class="why">Судимостей: ${cr.rec}</div>` : ""}
      <h3>Что провернуть (осталось в этом году: ${Math.max(0, left)})</h3>
      <div class="opts">${ops.map((o) => `<button class="opt" data-o="${o.id}" ${left > 0 ? "" : "disabled"}><span>${esc(o.label)}${o.cost ? `<small>нужно ${money(o.cost)}</small>` : o.risk >= 0.2 ? "<small>очень рискованно</small>" : ""}</span>${["bribe", "launder", "low", "quit"].includes(o.id) ? "" : `<span class="pc">${o.p}%</span>`}</button>`).join("")}</div>
      <p class="why" style="margin-top:0.7rem">Это игра. В жизни за такое сажают, а «особые бананы» — не бананы.</p>
      <button class="btn big" data-back="1">← Назад</button>`, "crime");
    card.onclick = (e) => {
      if (e.target.closest("[data-back]")) return openActs();
      const b = e.target.closest("[data-o]"); if (!b || b.disabled) return;
      const r = B8.crime.doOp(c, b.dataset.o);
      checkAch("crime");
      if (afterAct(r)) return;
      openCrime();
    };
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
    const a = [];
    if (c.a.home) a.push("жильё (" + money(c.a.homeVal) + (c.a.mort ? ", ипотека ещё " + c.a.mort + " " + B8.years(c.a.mort) : "") + ")");
    if (c.a.mansion) a.push("особняк"); if (c.a.car) a.push(c.a.car >= 2 ? "спорткар" : "машина"); if (c.a.yacht) a.push("яхта");
    if (c.inv) a.push("инвестиции " + money(c.inv)); if (c.biz) a.push("бизнес «" + c.biz.name + "» (" + money(c.biz.val) + ")");
    const conds = { depression: "депрессия", diabetes: "диабет", back: "больная спина", cancer: "онкология", drinking: "алкоголь", gambling: "игровая зависимость", hungry: "недоедание", unemployed: "безработица" };
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>${esc(B8.fullName(c))}</h2>
      ${c.patr ? `<div class="why">отчество: ${esc(c.patr)}</div>` : ""}
      <div class="kv"><span>Возраст</span><span>${ageWord(c.age)} (${c.born + c.age} год)</span></div>
      <div class="kv"><span>Где живёшь</span><span>${esc(c.house)}, ${esc(c.city)}</span></div>
      <div class="kv"><span>Уровень жизни</span><span>${esc(B8.LS[c.ls])}</span></div>
      <div class="kv"><span>Место в мире</span><span>богаче ${B8.percentile(c)}% людей</span></div>
      <div class="kv"><span>Образование</span><span>${esc(B8.EDU[c.edu])}${c.uni ? " (учишься)" : c.school ? " (школа)" : ""}</span></div>
      <div class="kv"><span>Работа</span><span>${esc(B8.jobTitle(c))}</span></div>
      <div class="kv"><span>Доход в год</span><span>${money(c.income)}</span></div>
      <div class="kv"><span>Состояние</span><span>${money(B8.netWorth(c))}</span></div>
      ${c.temper ? `<div class="kv"><span>Характер</span><span>${esc(B8.TEMPERS[c.temper][c.sex === "m" ? 0 : 1])}</span></div>` : ""}
      ${c.hobby ? `<div class="kv"><span>Увлечение</span><span>${esc(B8.HOBBIES[c.hobby][0])} (${Math.round(c.hobbyL)}/100)</span></div>` : ""}
      <div class="kv"><span>Внешность</span><span>${Math.round(c.looks)}/100</span></div>
      ${Object.keys(c.conds).length ? `<div class="kv"><span>Здоровье</span><span>${Object.keys(c.conds).map((k) => conds[k] || k).join(", ")}</span></div>` : ""}
      ${c.crime.on || c.crime.rec ? `<div class="kv"><span>Подполье</span><span>${c.crime.on ? esc(B8.crime.rankTitle(c)) : "в прошлом"}${c.crime.rec ? ", судимостей: " + c.crime.rec : ""}</span></div>` : ""}
      ${c.cas.visits ? `<div class="kv"><span>Казино</span><span>выиграно ${money(c.cas.won)}, проиграно ${money(c.cas.lost)}</span></div>` : ""}
      ${a.length ? `<h3>Имущество</h3><p>${esc(a.join(", "))}</p>` : ""}
      <h3>Близкие</h3><div class="people">${ppl.join("")}</div>
      <h3>Код судьбы этой жизни</h3><p><b>${B8.seedToCode(c.seed)}</b> — друг может родиться тобой.</p>`, "profile");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }

  // ═════ меню во время жизни ═════
  function openLifeMenu() {
    const card = sheet(`<h2>☰ Пауза</h2><div class="opts">
      <button class="btn big primary" data-m="back">▶ Продолжить</button>
      <button class="btn big" data-m="code">🔑 Код этой жизни: ${B8.seedToCode(S.seed)}</button>
      <button class="btn big" data-m="set">⚙ Настройки</button>
      <button class="btn big" data-m="end">⏹ Досмотреть жизнь автоматически</button>
      <button class="btn big" data-m="menu">🏠 В главное меню (жизнь сохранится)</button></div>`, "pause");
    card.onclick = (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      const m = b.dataset.m;
      if (m === "back") closeSheet();
      if (m === "code") { copy(B8.seedToCode(S.seed)); toast("Код скопирован"); }
      if (m === "set") openSettings();
      if (m === "menu") { closeSheet(); save(true); show("menu"); }
      if (m === "end") { closeSheet(); fastForward(); }
    };
  }
  function fastForward() {
    let g = 0;
    while (S.alive && g++ < 130) { B8.advance(S); while (S.pend.length) B8.choose(S, B8.autoPick(S), true); }
    renderLife(true); save(true); setTimeout(endLife, 300);
  }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) {} }

  // ═════ конец жизни ═════
  function endLife() {
    if (!S || S.alive || UI.endRendered) return;
    UI.endRendered = true;
    B8.finishLife(S);
    const c = S, net = B8.netWorth(c);
    // мета: атлас, статистика, достижения
    if (!c.meta.counted) {
      c.meta.counted = 1;
      M.atlas[c.cc] = (M.atlas[c.cc] || 0) + 1;
      M.st.lives++; M.st.years += c.age; M.st.maxAge = Math.max(M.st.maxAge, c.age); M.st.maxNet = Math.max(M.st.maxNet, net);
      M.st.kids += c.kids.length; M.st.jail += c.jailTot; if (c.crime.rank >= 5) M.st.bosses++;
      if (c.meta.mode === "daily") M.daily[new Date().toISOString().slice(0, 10)] = c.age;
      if (c.meta.mode === "code") M.codes++;
      for (const a of ACH) checkAch(a.id);
    }
    save(true);
    const turns = (c.turns || []).slice(-14).map(([a, t]) => `<div><b>${a}</b> — ${esc(t)}</div>`).join("");
    const k = B8.K(c.cc);
    const peers = peerLives(c);
    const heirs = B8.heirs(c);
    $("#end").innerHTML = `<div class="album" id="album"></div>
      <h1>${esc(B8.fullName(c))}</h1><div class="years">${c.born} — ${c.born + c.age} · ${ageWord(c.age)} · ${esc(k.n)}${c.cur !== c.cc ? " → " + esc(cntry(c.cur)) : ""}</div>
      <div class="years">Причина: ${esc(B8.CAUSE[c.cause] || c.cause)}</div>
      <div class="epi">«${esc(B8.epitaph(c))}»</div>
      <div class="score">${c.score}<small>очки жизни</small></div>
      <h3>Итоги</h3>
      <div class="kv"><span>Образование</span><span>${esc(B8.EDU[c.edu])}</span></div>
      <div class="kv"><span>Вершина карьеры</span><span>${esc(c.peak || "—")}</span></div>
      <div class="kv"><span>Состояние</span><span>${money(net)}</span></div>
      <div class="kv"><span>Средняя радость</span><span>${Math.round(c.hsum / (c.age + 1))}/100</span></div>
      <div class="kv"><span>Дети и внуки</span><span>${c.kids.length} / ${c.gk}</span></div>
      ${c.jailTot ? `<div class="kv"><span>В тюрьме</span><span>${ageWord(c.jailTot)}</span></div>` : ""}
      ${c.crime.rank ? `<div class="kv"><span>В подполье</span><span>${esc(B8.crime.ORG[c.crime.org].ranks[c.crime.rank])}</span></div>` : ""}
      ${c.cas.visits ? `<div class="kv"><span>Казино</span><span>${c.cas.won > c.cas.lost ? "в плюсе на " + money(c.cas.won - c.cas.lost) : "в минусе на " + money(c.cas.lost - c.cas.won)}</span></div>` : ""}
      ${c.letter && c.age < 60 ? `<h3>Непрочитанное письмо</h3><div class="letter">${esc(c.letter)}<br><small>— написано в 18, должно было открыться в 60</small></div>` : ""}
      ${turns ? `<h3>Повороты судьбы</h3><div class="turns">${turns}</div>` : ""}
      <h3>Родились в ту же секунду</h3>${peers}
      <div class="end-btns">
        ${heirs.length ? `<button class="btn big primary" data-e="heir">👶 Прожить жизнь ребёнка</button>` : ""}
        <button class="btn big ${heirs.length ? "" : "primary"}" data-e="new">🎲 Новая жизнь</button>
        ${P() && P().canWall() ? `<button class="btn big" data-e="wall">📤 Рассказать друзьям</button>` : ""}
        <button class="btn big" data-e="code">🔑 Код этой жизни: ${B8.seedToCode(c.seed)}</button>
        <button class="btn big ghost" data-e="menu">🏠 В меню</button></div>`;
    const al = $("#album");
    for (const a of c.album.concat(c.album[c.album.length - 1] === c.age ? [] : [c.age])) {
      const f = document.createElement("figure"), cv = document.createElement("canvas");
      cv.width = cv.height = 96; B8.portrait(cv, c, a, { hap: c.mood[a] != null ? c.mood[a] : 55 });
      f.appendChild(cv); f.insertAdjacentHTML("beforeend", `<figcaption>${a}</figcaption>`); al.appendChild(f);
    }
    show("end");
    sfx("death");
  }
  function peerLives(c) {
    return (c.peers || []).map((seed) => {
      const p = B8.newLife(seed, { born: c.born, world: c.world });
      let g = 0;
      while (p.alive && g++ < 125) { B8.advance(p); while (p.pend.length) B8.choose(p, B8.autoPick(p), true); }
      const job = p.peak || "без особой карьеры";
      return `<div class="peer"><b>${esc(B8.fullName(p))} · ${esc(cntry(p.cc))}</b>прожил${p.sex === "f" ? "а" : ""} ${ageWord(p.age)}, ${esc(job)}, ${p.kids.length ? p.kids.length + " " + plural(p.kids.length, "ребёнок", "ребёнка", "детей") : "без детей"}. ${esc(B8.epitaph(p))}</div>`;
    }).join("");
  }
  $("#end").addEventListener("click", (e) => {
    const b = e.target.closest("[data-e]"); if (!b) return;
    sfx("click");
    const a = b.dataset.e;
    if (a === "new") newLife(B8.newSeed(), "new");
    if (a === "menu") { show("menu"); }
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
    ["clean", "🧼", "Сухим из воды", "Подняться до верхушки подполья и ни разу не сесть", (c) => c.crime.rank >= 4 && !c.jailTot],
    ["jail10", "⛓", "Тюремный стаж", "Провести в тюрьме 10 лет", (c) => c.jailTot >= 10],
    ["escape", "🕳", "Побег", "Сбежать из тюрьмы", (c) => !!c.flags.fugitive],
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
  ].map(([id, ic, t, d, f]) => ({ id, ic, t, d, f }));
  const ACH_LIVE = ["million", "billion", "boss", "cartel", "don", "jackpot", "lottery", "old100"];
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
      <div class="kv"><span>Прожито жизней</span><span>${s.lives}</span></div><div class="kv"><span>Всего лет</span><span>${s.years}</span></div>
      <div class="kv"><span>Самая долгая жизнь</span><span>${ageWord(s.maxAge)}</span></div><div class="kv"><span>Самое большое состояние</span><span>${money(s.maxNet)}</span></div>
      <div class="kv"><span>Детей за все жизни</span><span>${s.kids}</span></div><div class="kv"><span>Лет в тюрьме</span><span>${s.jail}</span></div>
      <div class="kv"><span>Глав подполья</span><span>${s.bosses}</span></div><div class="kv"><span>Стран в атласе</span><span>${Object.keys(M.atlas).length} из 69</span></div>`, "stats");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }
  function openSettings() {
    const sp = ["медленно", "нормально", "быстро"];
    const card = sheet(`<button class="ico close" data-close="1">✕</button><h2>⚙ Настройки</h2>
      <div class="opts"><button class="opt" data-s="sound"><span>🔊 Звук</span><span class="pc">${M.set.sound !== false ? "вкл" : "выкл"}</span></button>
      <button class="opt" data-s="speed"><span>⏩ Скорость авто-лет</span><span class="pc">${sp[M.set.speed != null ? M.set.speed : 1]}</span></button>
      <button class="opt" data-s="tut"><span>🎓 Пройти обучение заново</span></button>
      <button class="opt" data-s="reset"><span>🗑 Сбросить весь прогресс</span></button></div>`, "settings");
    card.onclick = (e) => {
      if (e.target.closest("[data-close]")) return closeSheet();
      const b = e.target.closest("[data-s]"); if (!b) return;
      const s = b.dataset.s;
      if (s === "sound") { M.set.sound = M.set.sound === false; B8.audio.on = M.set.sound; }
      if (s === "speed") M.set.speed = ((M.set.speed != null ? M.set.speed : 1) + 1) % 3;
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
      <p>Каждый год — события, которые вытекают из твоего положения и прошлых решений. Учёба, любовь, карьера, бизнес, казино и тёмные дела. У каждой страны — свой колорит и своё подполье.</p>
      <p class="why">Все персонажи и организации вымышлены. Казино в игре — только на игровые деньги, купить их нельзя. Криминал в игре — шутка, а в жизни за это сажают. Возраст: 16+.</p>
      <p class="why">Версия ${VERSION} · <a href="privacy.html" target="_blank" style="color:var(--gold)">Конфиденциальность</a> · <a href="terms.html" target="_blank" style="color:var(--gold)">Соглашение</a></p>
      <p class="why">Разработчик: Шакуров Даниил Денисович · ponosolenya@gmail.com</p>`, "about");
    card.onclick = (e) => { if (e.target.closest("[data-close]")) closeSheet(); };
  }

  // ═════ ОБУЧЕНИЕ — прямо в игре, шаг за шагом ═════
  // Никаких текстовых окон: Судьба ведёт по первой жизни, подсвечивает нужную кнопку и ждёт действия игрока.
  const TS = [
    { k: "start", at: "menu", dom: '[data-a="new"]', on: "newLife", t: "Привет! Это симулятор жизни. Ты не выбираешь, где родиться — как и восемь миллиардов людей на Земле. Жми «**Новая жизнь**»." },
    { k: "spin", at: "wheel", dom: "#spin", on: "spun", t: "Это колесо стран. Чем больше детей рождается в стране, тем шире её сектор: Индия — пятая часть круга, Норвегия — тонкая полоска. **Крути!**" },
    { k: "go", at: "wheel", ring: ["#wheel-res", "#wheel-go"], dom: "#wheel-go", on: "toBirth", t: "Судьба решила. Жми «**Дальше**»." },
    { k: "cert", at: "birth", ring: "#cert", btn: "ok", t: "Твоё свидетельство о рождении: имя, семья, вера, достаток. Всё случайно — как в жизни. От этого зависит, что тебя ждёт." },
    { k: "live", at: "birth", dom: "#cert-go", on: "lifeStart", t: "Жми «**Начать жизнь**»." },
    { k: "stats", at: "life", ring: "#stats", btn: "ok", t: "Это **шкалы жизни**: здоровье, счастье, ум, отношения с людьми и стресс. Они меняются от событий и твоих решений." },
    { k: "year", at: "life", dom: "#btn-year", on: "year", t: "Жми «**＋ Год**» — проживёшь целый год." },
    { k: "log", at: "life", ring: "#log", dom: "#btn-year", on: "year", t: "Всё, что случилось, — в **летописи**. Серым — причина события. Жми «**＋ Год**» ещё раз." },
    { k: "choice", at: "sheet:decision", ring: "#sheet-card", dom: ".opt", on: "choice", t: "**Решения!** Каждый выбор меняет характер и будущее. Если у варианта есть процент — это шанс, что всё получится. Выбери." },
    { k: "next", at: "sheet:result", dom: "[data-n]", on: "closed:result", t: "Вот что вышло. Жми «**Дальше**»." },
    { k: "acts", at: "life", dom: "#btn-acts", on: "acts", t: "А это «**Дела**»: учёба, работа, любовь, бизнес, казино и даже тёмные дела. Открой." },
    { k: "actsIn", at: "sheet:acts", ring: "#sheet-card", btn: "ok", t: "Пока ты малыш, дел немного. С возрастом откроются школа и работа, с 14 — тёмные дела, с 18 — бизнес и казино. Каждое дело — раз в год." },
    { k: "close", at: "sheet:acts", dom: "[data-close]", on: "closed:acts", t: "Закрой и живи дальше." },
    { k: "auto", at: "life", dom: "#btn-auto", btn: "go", t: "Кнопка **⏩** проживает годы сама и останавливается на важных решениях. Дальше — твоя жизнь. Удачи!" },
  ];
  const TUT = {};
  let stepAt = 0, painted = "", scrolled = -1, waiting = -1;
  TUT.active = () => M && M.tut < TS.length;
  TUT.done = () => !TUT.active();
  TUT.reset = () => { stepAt = performance.now(); painted = ""; scrolled = -1; waiting = -1; };
  const cur = () => (TUT.active() ? TS[M.tut] : null);
  function next() { if (!TUT.active()) return; M.tut++; TUT.reset(); save(); if (!TUT.active()) TUT.finish(); }
  TUT.finish = () => { M.tut = 99; $("#tut").hidden = true; save(); };
  TUT.ev = function (name) {
    if (!TUT.active()) return;
    const st = TS[M.tut];
    if (st.on !== name || waiting === M.tut) return;
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
    const key = M.tut + "";
    if (painted !== key) {
      painted = key;
      const shown = TS.length;
      $("#tut-step").textContent = `${M.tut + 1}/${shown}`;
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
    let by;
    if (st.at.startsWith("sheet:")) { const top = $("#sheet-card").getBoundingClientRect().top - app.top; by = top > bh + 16 ? top - bh - 10 : 8; }
    else if (!rr) by = vh / 2 - bh / 2;
    else if (rr.y + rr.h / 2 > vh * 0.5) by = Math.max(8, rr.y - bh - 14);
    else by = Math.min(vh - bh - 8, rr.y + rr.h + 14);
    bub.style.top = Math.round(by) + "px";
  }
  $("#tut-btn").onclick = () => { const st = cur(); if (!st) return; sfx("click"); if (st.btn === "go") { TUT.finish(); toast("Удачной жизни!", "gold"); } else next(); };
  $("#tut-skip").onclick = () => { sfx("click"); TUT.finish(); };

  // ═════ запуск ═════
  async function boot() {
    loadAll();
    // старые игроки, у которых уже есть прожитые жизни, обучение не видят
    if (M.st.lives > 0 && M.tut < 99 && !TUT.active()) M.tut = 99;
    show("menu");
    requestAnimationFrame(tutFrame);
    try {
      const ok = await P().init();
      if (ok && P().vk) {
        const cl = await P().cloudLoad();
        if (cl && cl.m && (cl.m.st.lives > M.st.lives || (!S && cl.l))) { M = Object.assign(defMeta(), cl.m); if (cl.l) S = cl.l; B8.audio.on = M.set.sound !== false; show("menu"); }
      }
      P().ready();
    } catch (e) {}
    document.addEventListener("visibilitychange", () => { if (document.hidden) { stopAuto(); save(true); } });
  }
  window.addEventListener("DOMContentLoaded", boot);
  B8.debug = { get S() { return S; }, set S(v) { S = v; }, get M() { return M; }, UI, show, openDecision, renderLife, TUT, ACH };
})();
