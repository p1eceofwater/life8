/* 1 из 8 миллиардов — мини-игры: взлом замка (на точность), подкоп (быстро, но тихо), допрос (угадать характер следователя).
   Результат — число от 0 до 3, его получает решение или дело. Управление: касание, пробел, цифры 1–4. */
(function () {
  "use strict";
  const B8 = window.B8;
  const MG = (B8.mg = { active: null });
  const sfx = (n) => B8.audio && B8.audio.sfx(n);
  function finish(box, title, score, text, done, extra) {
    MG.active = null;
    box.innerHTML = `<h2>${title}</h2><div class="mg-score">${"★".repeat(score)}${"☆".repeat(3 - score)}</div><div class="res ${score >= 2 ? "g" : score === 0 ? "b" : ""}">${text}</div><button class="btn big primary" data-mgdone="1">Дальше</button>`;
    sfx(score >= 2 ? "good" : "bad");
    box.querySelector("[data-mgdone]").onclick = () => done(score, extra || 0);
  }
  MG.key = function (e) { if (MG.active && MG.active.key) return MG.active.key(e); return false; };

  // ── взлом замка: три штифта, отмычка бегает туда-сюда, жми в зелёной зоне ──
  MG.lock = function (box, done, opt) {
    opt = opt || {};
    const widths = [26, 19, 13], speeds = [70, 95, 125];
    let pin = 0, ok = 0, x = 0, dir = 1, last = performance.now(), zone = [0, 0], alive = true, wait = 0;
    box.innerHTML = `<h2>🔓 ${opt.title || "Взлом замка"}</h2><p class="why">Жми «Поддеть», когда отмычка в зелёной зоне. Три штифта — три попытки.</p>
      <div class="mg-pins">${[0, 1, 2].map((i) => `<i data-p="${i}"></i>`).join("")}</div>
      <div class="mg-track"><b class="mg-zone"></b><span class="mg-mark"></span></div>
      <button class="btn big primary mg-tap" data-mg="tap">🔧 Поддеть <small>пробел</small></button>`;
    const zEl = box.querySelector(".mg-zone"), mEl = box.querySelector(".mg-mark"), pins = box.querySelectorAll(".mg-pins i");
    const newZone = () => { const w = widths[pin]; const s = 8 + Math.random() * (84 - w); zone = [s, s + w]; zEl.style.left = s + "%"; zEl.style.width = w + "%"; };
    newZone();
    const tap = () => {
      if (!alive || wait) return;
      const hit = x >= zone[0] && x <= zone[1];
      pins[pin].className = hit ? "ok" : "no";
      sfx(hit ? "coin" : "bad");
      if (hit) ok++;
      pin++;
      if (pin >= 3) { alive = false; setTimeout(() => finish(box, "🔓 " + (opt.title || "Взлом замка"), ok, ok === 3 ? "Все три штифта встали на место. Щёлк!" : ok === 2 ? "Два штифта из трёх. Замок поддался со скрипом." : ok === 1 ? "Только один штифт. Пришлось повозиться." : "Отмычка сломалась. Замок победил.", done), 350); return; }
      wait = 1; setTimeout(() => { wait = 0; newZone(); }, 300);
    };
    box.querySelector("[data-mg]").onclick = tap;
    MG.active = { key: (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); tap(); return true; } return false; } };
    const step = (t) => {
      if (!alive || !box.isConnected) return;
      const dt = Math.min(50, t - last) / 1000; last = t;
      if (!wait) { x += dir * speeds[pin] * dt; if (x > 100) { x = 100; dir = -1; } if (x < 0) { x = 0; dir = 1; } }
      mEl.style.left = x + "%";
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ── подкоп: шесть секунд, копай быстро, но замирай, когда идёт охранник ──
  MG.dig = function (box, done, opt) {
    const F = (opt && opt.fmt) || ((x) => x);
    const DUR = 6500;
    let depth = 0, noise = 0, t0 = performance.now(), danger = false, next = t0 + 900 + Math.random() * 700, alive = true;
    box.innerHTML = `<h2>⛏ Подкоп</h2><p class="why">Копай, пока тихо. Когда идёт охранник — замри, иначе он услышит.</p>
      <div class="mg-guard" data-g="0">🤫 Тихо</div>
      <div class="mg-depth"><i></i></div><div class="mg-noise"></div>
      <div class="mg-time"><i></i></div>
      <button class="btn big primary mg-tap" data-mg="dig">⛏ Копать <small>пробел</small></button>`;
    const gEl = box.querySelector(".mg-guard"), dEl = box.querySelector(".mg-depth i"), nEl = box.querySelector(".mg-noise"), tEl = box.querySelector(".mg-time i");
    const dig = () => {
      if (!alive) return;
      if (danger) { noise++; sfx("bad"); nEl.textContent = "🔔".repeat(Math.min(3, noise)); box.classList.add("shake"); setTimeout(() => box.classList.remove("shake"), 200); }
      else { depth++; sfx("tick"); dEl.style.width = Math.min(100, (depth / 18) * 100) + "%"; }
    };
    box.querySelector("[data-mg]").onclick = dig;
    MG.active = { key: (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); dig(); return true; } return false; } };
    const step = (t) => {
      if (!alive || !box.isConnected) return;
      if (t >= next) { danger = !danger; next = t + (danger ? 600 + Math.random() * 500 : 700 + Math.random() * 900); gEl.dataset.g = danger ? "1" : "0"; gEl.textContent = danger ? "👮 Идёт охранник! Замри!" : "🤫 Тихо — копай"; if (danger) sfx("siren"); }
      tEl.style.width = Math.max(0, 100 - ((t - t0) / DUR) * 100) + "%";
      if (t - t0 >= DUR) {
        alive = false;
        const score = Math.min(3, Math.floor(depth / 6)), nz = Math.min(3, noise);
        finish(box, "⛏ Подкоп", score, F(score >= 3 ? "Ты прокопал[|а] за ночь больше, чем за месяц." : score === 2 ? "Хорошая ночь: земли за плакатом стало меньше." : score === 1 ? "Немного продвинул[ся|ась]. Ложка гнётся." : "Почти ничего. Земля здесь — как камень.") + (nz ? ` Шум: ${"🔔".repeat(nz)} — охрана могла что-то услышать.` : " Ни звука — охрана спит спокойно."), done, nz);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ── допрос: три вопроса; у следователя характер — подбери тактику ──
  const TYPES = [
    ["злой", "😠", "Следователь стучит кулаком по столу.", 0],
    ["добрый", "🙂", "Следователь предлагает чай и печенье.", 2],
    ["уставший", "😴", "Следователь зевает и смотрит на часы.", 1],
    ["хитрый", "🤨", "Следователь улыбается слишком дружелюбно.", 3],
  ];
  const TACT = [["🤐", "Молчать"], ["😄", "Отшутиться"], ["😢", "Давить на жалость"], ["🧠", "Встречный вопрос"]];
  const Q = ["«Где вы были в ночь на четверг?»", "«Вам знаком этот человек на фото?»", "«Откуда у вас такие деньги?»", "«Почему ваши отпечатки на сейфе?»", "«Кто такой «Тапок»?»", "«Зачем вам три телефона?»"];
  const REACT = { good: ["Следователь растерялся и что-то зачеркнул в протоколе.", "Следователь долго смотрел на тебя, потом сказал: «Ладно, дальше»."], bad: ["Следователь довольно кивнул и записал каждое слово.", "«Вот это уже интересно», — сказал следователь."] };
  MG.talk = function (box, done) {
    let round = 0, score = 0;
    const qs = Q.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const draw = (msg) => {
      const tp = TYPES[Math.floor(Math.random() * TYPES.length)];
      box.dataset.tp = tp[3];
      box.innerHTML = `<h2>🗣 Допрос · ${round + 1}/3</h2>${msg ? `<div class="res">${msg}</div>` : ""}<div class="mg-inv"><span>${tp[1]}</span><div><b>Следователь — ${tp[0]}</b><small>${tp[2]}</small></div></div>
        <div class="dec-text">${qs[round]}</div><div class="opts">${TACT.map((x, i) => `<button class="opt" data-t="${i}"><span>${x[0]} ${x[1]}</span><span class="pc">${i + 1}</span></button>`).join("")}</div>
        <p class="why">Подсказка: злого лучше не злить, доброго — растрогать, уставшего — рассмешить, а хитрого — запутать.</p>`;
      box.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => pick(+b.dataset.t)));
    };
    const pick = (i) => {
      const best = +box.dataset.tp;
      const good = i === best || (i === 3 && Math.random() < 0.35);
      if (good) score++;
      sfx(good ? "good" : "bad");
      round++;
      const msg = REACT[good ? "good" : "bad"][Math.floor(Math.random() * 2)];
      if (round >= 3) { MG.active = null; finish(box, "🗣 Допрос", score, msg + " " + (score >= 3 ? "Следователь вышел курить и не вернулся." : score === 2 ? "Допрос закончился в твою пользу." : score === 1 ? "Ничья. Протокол получился скучным." : "Протокол получился толстым. Не в твою пользу."), done); return; }
      draw(msg);
    };
    MG.active = { key: (e) => { const m = /^Digit([1-4])$/.exec(e.code); if (m) { pick(+m[1] - 1); return true; } return false; } };
    draw("");
  };
  MG.run = function (kind, box, done, opt) { return (MG[kind] || MG.lock)(box, done, opt); };
})();
