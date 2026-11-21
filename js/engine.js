/* 1 из 8 миллиардов — модель жизни.
   Всё состояние жизни — обычный объект (сохраняется как JSON). Случайность — своя, от «кода судьбы»,
   поэтому одинаковый код даёт одинаковое рождение и одинаковый мир. */
(function () {
  "use strict";
  const B8 = (window.B8 = window.B8 || {});
  const START_YEAR = 2026, MAX_AGE = 120;
  B8.START_YEAR = START_YEAR;

  // ───────── случайность ─────────
  function mul(a) { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return [a, ((t ^ (t >>> 14)) >>> 0) / 4294967296]; }
  B8.rnd = (c) => { const [s, v] = mul(c.rs); c.rs = s; return v; };
  const R = {};
  B8.R = R;
  R.r = (c) => B8.rnd(c);
  R.int = (c, a, b) => a + Math.floor(B8.rnd(c) * (b - a + 1));
  R.pick = (c, arr) => arr[Math.floor(B8.rnd(c) * arr.length)];
  R.chance = (c, p) => B8.rnd(c) < p;
  R.gauss = (c, m, s) => { let u = 0, v = 0; while (!u) u = B8.rnd(c); v = B8.rnd(c); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  R.wpick = (c, items, wf) => { const ws = items.map(wf); const tot = ws.reduce((a, b) => a + b, 0); let x = B8.rnd(c) * tot; for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };
  const clamp = (v, lo = 0, hi = 100) => (v < lo ? lo : v > hi ? hi : v);
  B8.clamp = clamp;

  // ───────── страны ─────────
  const BY = {};
  B8.COUNTRIES.forEach((k) => (BY[k.c] = k));
  B8.K = (code) => BY[code];
  const BIRTHS = B8.COUNTRIES.map((k) => k.pop * k.br);
  const TOT = BIRTHS.reduce((a, b) => a + b, 0);
  B8.birthShare = (code) => (BY[code].pop * BY[code].br) / TOT * 100;
  B8.pickCountry = (c) => R.wpick(c, B8.COUNTRIES, (k) => k.pop * k.br);
  B8.REGION = { south_asia: "Южная Азия", east_asia: "Восточная Азия", se_asia: "Юго-Восточная Азия", africa: "Африка", mideast: "Ближний Восток и Северная Африка",
    latam: "Латинская Америка", w_europe: "Западная Европа", e_europe: "Восточная Европа", n_america: "Северная Америка и Австралия", c_asia: "Центральная Азия" };
  B8.RELN = { hin: "индуизм", isl: "ислам", chr: "христианство", sikh: "сикхизм", bud: "буддизм", none: "", jew: "иудаизм", folk: "народные верования",
    shinto: "синтоизм и буддизм", trad: "традиционные верования", chondo: "чхондоизм", afro: "сантерия", tao: "даосизм", other: "местная вера" };
  // праздник и место молитвы по религии (для текстов)
  const HOLI = { hin: ["Дивали", "Холи"], isl: ["Ураза-байрам", "Курбан-байрам"], chr: ["Рождество", "Пасха"], sikh: ["Вайсакхи", "Дивали"], bud: ["Весак", "Новый год"],
    none: ["Новый год", "день рождения бабушки"], jew: ["Песах", "Хануку"], folk: ["Праздник весны", "Праздник середины осени"], shinto: ["Сёгацу", "Обон"],
    trad: ["праздник урожая", "праздник предков"], chondo: ["Чхусок", "Новый год"], afro: ["праздник ориши", "Рождество"], tao: ["Праздник весны", "Праздник фонарей"], other: ["Новый год", "праздник урожая"] };
  const TEMPLE = { hin: "храм", isl: "мечеть", chr: "церковь", sikh: "гурдвара", bud: "пагода", none: "", jew: "синагога", folk: "храм предков", shinto: "храм",
    trad: "священная роща", chondo: "храм", afro: "дом сантеро", tao: "даосский храм", other: "храм" };
  B8.holiday = (c, i = 0) => HOLI[c.rel][i] || "Новый год";
  B8.temple = (c) => (c.cc === "PL" && c.rel === "chr" ? "костёл" : TEMPLE[c.rel] || "храм");
  B8.lifeExp = (k, sex) => (sex === "f" ? k.lef : k.lem);
  B8.retAge = (k) => (k.hdi > 0.85 ? 67 : k.hdi > 0.7 ? 63 : 60);

  // ───────── деньги ─────────
  B8.money = function (x) {
    const s = x < 0 ? "−" : "", a = Math.abs(x);
    if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(".", ",") + " млрд";
    if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(".", ",") + " млн";
    return s + "$" + Math.round(a).toLocaleString("ru-RU").replace(/,/g, " ");
  };
  B8.gdp = (c) => BY[c.cur].gdp;
  B8.gain = function (c, amount, why) { c.money += amount; if (why) c.mwhy = why; };

  // ───────── имена ─────────
  function newName(c, sex, poolKey) {
    const p = B8.pool(poolKey || c.pool);
    return R.pick(c, sex === "m" ? p.m : p.f);
  }
  B8.newName = newName;
  function surOf(c, sex, poolKey) { const p = B8.pool(poolKey || c.pool); return B8.surFem(R.pick(c, p.s), p.fl); }
  // полное имя человека из той же культуры
  B8.personName = function (c, sex, poolKey) {
    const pk = poolKey || c.pool, p = B8.pool(pk);
    const first = R.pick(c, sex === "m" ? p.m : p.f);
    let sur = R.pick(c, p.s);
    if (sex === "f") sur = B8.surFem(sur, p.fl);
    if (/^бин /.test(sur) && sex === "f") sur = sur.replace(/^бин /, "бинти ");
    return p.fl.includes("F") ? sur + " " + first : first + " " + sur;
  };
  B8.fullName = function (c) {
    const p = B8.pool(c.pool);
    const s1 = c.sur, s2 = c.sur2;
    let sur = s1;
    if (p.fl.includes("S") && s2) sur = s1 + " " + s2;
    if (p.fl.includes("B") && s2) sur = s2 + " " + s1;
    return p.fl.includes("F") ? sur + " " + c.first : c.first + " " + sur;
  };

  // ───────── текст: {переменные}, [он|она] по герою, [[он|она]] по второму участнику ─────────
  B8.fmt = function (c, s, d) {
    if (!s) return "";
    d = d || {};
    const k = BY[c.cur];
    if (s.includes("[[")) s = s.replace(/\[\[([^\[\]|]*)\|([^\[\]|]*)\]\]/g, (_, m, f) => ((d.ps || "m") === "f" ? f : m));
    if (s.includes("[")) s = s.replace(/\[([^\[\]|]*)\|([^\[\]|]*)\]/g, (_, m, f) => (c.sex === "f" ? f : m));
    if (!s.includes("{")) return s;
    return s.replace(/\{(\w+)(?::([\d.]+))?\}/g, (all, v, arg) => {
      switch (v) {
        case "name": return c.first;
        case "full": return B8.fullName(c);
        case "city": return c.city;
        case "country": return k.n;
        case "food": return k.food;
        case "sport": return k.sport;
        case "ride": return k.ride;
        case "holiday": return B8.holiday(c, 0);
        case "holiday2": return B8.holiday(c, 1);
        case "temple": return B8.temple(c);
        case "p": return d.p || "кто-то";
        case "p2": return d.p2 || "кто-то";
        case "m": return newName(c, "m");
        case "f": return newName(c, "f");
        case "friend": return c.friend ? c.friend.n : "друг";
        case "spouse": return c.spouse ? c.spouse.n : "супруг";
        case "kid": { const ks = (c.kids || []).filter((x) => x.alive); return ks.length ? R.pick(c, ks).n : "ребёнок"; }
        case "mom": return c.mother.n;
        case "dad": return c.father.n;
        case "money": return B8.money(B8.gdp(c) * parseFloat(arg || "1"));
        case "sum": return B8.money(d.sum || 0);
        case "org": return c.crime && c.crime.orgName ? c.crime.orgName : B8.crime ? B8.crime.orgName(c) : "банда";
        case "biz": return c.biz ? c.biz.name : "бизнес";
        case "boss": return d.boss || newName(c, "m");
        case "year": return String(c.born + c.age);
        case "age": return String(c.age);
        case "job": return B8.jobTitle(c);
        case "x": return d.x || "";
        default: return d[v] != null ? String(d[v]) : all;
      }
    });
  };

  // ───────── летопись ─────────
  // kind: g — хорошее, b — плохое, n — нейтральное, w — мир, d — решение; big — важное событие (жирным)
  B8.say = function (c, text, kind = "n", why = "", big = false, d) {
    const t = B8.fmt(c, text, d);
    c.log.push([c.age, t, kind, why ? B8.fmt(c, why, d) : "", big ? 1 : 0]);
    if (c.log.length > 900) c.log.splice(0, c.log.length - 900);
    c.news = c.news || [];
    c.news.push(t);
    return t;
  };
  B8.turn = function (c, label) { c.turns = c.turns || []; c.turns.push([c.age, label]); };
  B8.stress = function (c, x, why) { c.st += x; if (x > 0 && why) { c.stressors.push([c.age, why]); if (c.stressors.length > 12) c.stressors.shift(); } };
  B8.schedule = function (c, key, lo, hi, data) { const a = c.age + (hi == null ? lo : R.int(c, lo, hi)); c.queue.push([a, key, data || {}]); };
  const flag = (c, f) => !!c.flags[f];
  B8.flag = flag;
  B8.setFlag = (c, f, v = 1) => { if (v) c.flags[f] = v; else delete c.flags[f]; };

  // ───────── мир ─────────
  function makeWorld(c) {
    const w = { seed: R.int(c, 1, 1e9), ev: {}, econ: {} };
    let y = START_YEAR + R.int(c, 5, 20);
    while (y < 2150) { (w.ev[y] = w.ev[y] || []).push("recession"); y += R.int(c, 18, 40); }
    for (let i = 0; i < 2; i++) { const py = R.int(c, 2032, 2115); (w.ev[py] = w.ev[py] || []).push("pandemic"); }
    w.br = R.int(c, 2048, 2085); (w.ev[w.br] = w.ev[w.br] || []).push("breakthrough");
    w.auto = R.int(c, 2036, 2062); (w.ev[w.auto] = w.ev[w.auto] || []).push("automation");
    w.clim = R.int(c, 2050, 2075); (w.ev[w.clim] = w.ev[w.clim] || []).push("climate");
    const extra = ["mars", "fusion", "ai_rights", "olympics", "flying", "lunar", "longevity", "quantum", "ocean"];
    for (const e of extra) { const ey = R.int(c, 2030, 2120); (w.ev[ey] = w.ev[ey] || []).push(e); }
    return w;
  }
  // экономика страны в году: −2 кризис … +2 бум (детерминирована от мира)
  B8.econ = function (c, code, year) {
    const w = c.world; code = code || c.cur; year = year || c.born + c.age;
    const seq = (w.econ[code] = w.econ[code] || []);
    let h = w.seed ^ code.charCodeAt(0) * 7919 ^ code.charCodeAt(1) * 104729;
    while (seq.length <= year - START_YEAR) {
      const yy = START_YEAR + seq.length, prev = seq.length ? seq[seq.length - 1] : 0;
      const t = mul(h + seq.length * 31337); h = t[0]; const x = t[1];
      let s;
      if ((w.ev[yy] || []).includes("recession")) s = -2;
      else if (prev <= -2) s = x < 0.6 ? -1 : -2;
      else if (prev === -1) s = x < 0.6 ? 0 : x < 0.8 ? 1 : -1;
      else { s = x < 0.05 ? -2 : x < 0.15 ? -1 : x < 0.5 ? 0 : x < 0.88 ? 1 : 2; if (prev === 2 && x < 0.3) s = -1; }
      seq.push(s);
    }
    return seq[Math.max(0, year - START_YEAR)];
  };
  B8.ECON = { "-2": "кризис", "-1": "спад", 0: "стабильно", 1: "рост", 2: "бум" };
  B8.climate = (c) => { const y = c.born + c.age; return y < c.world.clim ? 1 : 1 + Math.min(1.5, (y - c.world.clim) / 30); };

  // ───────── уровень жизни ─────────
  B8.LS = ["на грани выживания", "скромно", "комфортно", "в достатке", "в роскоши"];
  B8.LS_SHORT = ["выживание", "скромно", "комфорт", "достаток", "роскошь"];
  const QREL = [0.3, 0.55, 0.8, 1.2, 2.3];
  B8.QLABEL = ["беднейшие 20% в стране", "ниже среднего", "средние 20% в стране", "выше среднего", "богатейшие 20% в стране"];
  function famTier(k, q) { const f = k.gdp * QREL[q - 1]; return f < 2500 ? 0 : f < 9000 ? 1 : f < 30000 ? 2 : f < 70000 ? 3 : 4; }
  B8.famTier = famTier;
  B8.houseLabel = function (c) {
    const ls = c.ls, urban = c.urban;
    if (c.jail) return "камера на четверых";
    if (c.a && c.a.mansion) return "особняк";
    if (c.a && c.a.home) return urban ? (ls >= 3 ? "своя большая квартира" : "своя квартира") : "свой дом";
    if (c.age < 18 || c.school || c.uni) {
      return ["лачуга", "тесная квартира", "квартира", "просторная квартира", "дом с садом"][ls].replace("лачуга", urban ? "комната в трущобах" : "хижина");
    }
    return ["угол в чужой квартире", "съёмная комната", "съёмная квартира", "просторная квартира", "пентхаус"][ls];
  };

  // ───────── работа ─────────
  // поля карьеры: [название, нужно образования (0–4), множитель дохода, должности по уровню 1..5]
  B8.FIELDS = {
    labor: ["Рабочие профессии", 0, 0.8, ["разнорабоч[ий|ая]", "рабоч[ий|ая]", "бригадир", "мастер участка", "начальник цеха"]],
    farm: ["Сельское хозяйство", 0, 0.6, ["батрак", "фермер", "фермер с землёй", "хозяин фермы", "агроном-управляющий"]],
    trade: ["Торговля", 0, 0.85, ["продав[ец|щица]", "старш[ий|ая] продав[ец|щица]", "администратор", "директор магазина", "директор сети"]],
    transport: ["Транспорт", 0, 0.9, ["курьер", "водитель", "водитель автобуса", "диспетчер", "начальник автопарка"]],
    food: ["Кафе и рестораны", 0, 0.8, ["посудомой[щик|щица]", "повар", "су-шеф", "шеф-повар", "ресторатор"]],
    office: ["Офис", 2, 1.1, ["секретарь", "менеджер", "старш[ий|ая] менеджер", "руководитель отдела", "директор"]],
    it: ["IT", 2, 1.6, ["стажёр-программист", "программист", "ведущ[ий|ая] разработчи[к|ца]", "техлид", "технический директор"]],
    med: ["Медицина", 3, 1.4, ["санитар", "медбрат", "врач", "заведующ[ий|ая] отделением", "главврач"]],
    edu: ["Образование", 3, 0.95, ["помощник учителя", "учитель", "завуч", "директор школы", "профессор"]],
    law: ["Право", 3, 1.5, ["помощник юриста", "юрист", "адвокат", "партнёр фирмы", "судья"]],
    eng: ["Инженерия", 3, 1.35, ["техник", "инженер", "ведущ[ий|ая] инженер", "главный инженер", "технический директор"]],
    sci: ["Наука", 4, 1.2, ["лаборант", "научн[ый|ая] сотрудни[к|ца]", "кандидат наук", "заведующ[ий|ая] лабораторией", "академик"]],
    police: ["Полиция", 2, 1.0, ["курсант", "патрульн[ый|ая]", "сержант", "следователь", "начальник отдела"]],
    art: ["Искусство", 0, 0.9, ["уличн[ый|ая] музыкант", "артист", "известн[ый|ая] артист", "звезда", "легенда"]],
  };
  B8.JOB_MULT = [0.12, 0.45, 0.8, 1.2, 1.9, 3.2];
  B8.jobTitle = function (c) {
    if (c.jail) return "заключённ[ый|ая]".replace(/\[([^|]*)\|([^\]]*)\]/, (_, m, f) => (c.sex === "f" ? f : m));
    if (c.biz) return "владел[ец|ица] бизнеса «" + c.biz.name + "»";
    if (c.crime && c.crime.rank >= 4 && c.crime.on) return B8.crime.rankTitle(c);
    if (!c.job) {
      if (c.retired) return c.sex === "f" ? "пенсионерка" : "пенсионер";
      if (c.uni) return c.sex === "f" ? "студентка" : "студент";
      if (c.school) return c.sex === "f" ? "школьница" : "школьник";
      if (c.age < 16) return "ребёнок";
      return "без работы";
    }
    const f = B8.FIELDS[c.job.f];
    return B8.fmt(c, f[3][Math.min(4, c.job.lvl - 1)]);
  };
  B8.stage = function (c) {
    if (!c.alive) return "умер" + (c.sex === "f" ? "ла" : "");
    if (c.jail) return c.sex === "f" ? "Заключённая" : "Заключённый";
    if (c.age < 1) return "Младенец";
    if (c.age < 6) return "Малыш";
    if (c.age < 18) return c.school ? (c.sex === "m" ? "Школьник" : "Школьница") : c.urban ? "Работающий подросток" : "Помогает семье";
    if (c.uni) return c.sex === "m" ? "Студент" : "Студентка";
    if (c.retired) return c.sex === "m" ? "Пенсионер" : "Пенсионерка";
    const t = B8.jobTitle(c);
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  B8.EDU = ["нет", "начальное", "среднее", "высшее", "магистратура"];

  // ───────── люди вокруг ─────────
  function person(c, sex, role, born, extra) {
    return Object.assign({ n: B8.personName(c, sex), sex, role, born, alive: true, died: -1, st: "", close: true, rel: R.int(c, 55, 85), le: clamp(R.gauss(c, B8.lifeExp(BY[c.cc], sex), 8), 30, 104) }, extra || {});
  }
  B8.person = person;
  B8.bump = (p, x) => { if (p) p.rel = clamp((p.rel || 60) + x); };
  B8.ageOf = (c, p) => (p.alive ? c.age - p.born : p.died);

  // ───────── рождение ─────────
  const PARENT_JOBS = [["фермер", "сезонный рабочий", "уличный торговец", "строитель", "рыбак", "грузчик"],
    ["строитель", "водитель", "продавец", "медсестра", "учитель", "швея", "механик", "повар"],
    ["врач", "инженер", "владелец бизнеса", "юрист", "программист", "менеджер", "архитектор"]];
  // культуры, где жена сохраняет свою фамилию
  const KEEP_SUR = ["cn_mus", "arab_gulf", "arab_iraq", "arab_yemen", "arab_levant", "eg_mus", "copt", "maghreb", "sd", "sd_chr", "ir", "af", "my_malay", "ph_mus", "id_mus", "it", "et_chr", "et_mus", "ng_mus", "ne", "ke_mus"];
  const jobMasc = (j) => ({ медсестра: "медбрат", швея: "портной" })[j] || j;
  const jobFem = (j) => ({ фермер: "фермерша", рыбак: "рыбачка", грузчик: "фасовщица", строитель: "маляр", механик: "кладовщица" })[j] || j;
  const HOMEMAKER = { mideast: 0.75, south_asia: 0.65, c_asia: 0.35, africa: 0.3, se_asia: 0.3, latam: 0.3 };
  B8.newLife = function (seed, opt) {
    opt = opt || {};
    const c = { v: 1, seed, rs: seed | 0, log: [], flags: {}, conds: {}, counts: {}, last: {}, queue: [], stressors: [], turns: [], pend: [], ya: {}, album: [0], news: [], meta: {} };
    c.world = opt.world || makeWorld(c);
    const k = opt.cc ? BY[opt.cc] : B8.pickCountry(c);
    c.cc = c.cur = k.c;
    c.sex = opt.sex || (R.chance(c, 0.51) ? "m" : "f");
    c.born = opt.born || START_YEAR;
    c.age = 0; c.alive = true; c.cause = "";
    c.le = clamp(R.gauss(c, B8.lifeExp(k, c.sex), 8), 25, 105);
    c.q = opt.q || R.int(c, 1, 5);
    const fam = k.gdp * QREL[c.q - 1];
    c.wealth = fam < 5000 ? 0 : fam > 45000 || (c.q === 5 && fam > 15000) ? 2 : 1;
    c.urban = opt.urban != null ? opt.urban : R.r(c) * 100 < k.urb;
    c.city = opt.city || R.pick(c, k.cities);
    c.rel = opt.rel || R.wpick(c, k.rel, (x) => x[1])[0];
    c.pool = B8.poolKey(k.c, c.rel, () => R.r(c));
    const P = B8.pool(c.pool);
    // семья: фамилия отца, у испанцев и португальцев — ещё и фамилия матери
    const dadSur = opt.sur || R.pick(c, P.s), momSur = R.pick(c, P.s);
    c.sur = c.sex === "f" ? B8.surFem(dadSur, P.fl) : dadSur;
    if (P.fl.includes("S") || P.fl.includes("B")) c.sur2 = opt.sur2 || momSur;
    c.first = R.pick(c, c.sex === "m" ? P.m : P.f);
    const mAge = Math.round(clamp(R.gauss(c, 31 - (k.br - 10) * 0.25, 4.5), 17, 44));
    const fAge = Math.round(clamp(mAge + R.gauss(c, 4, 3), 18, 60));
    const jp = PARENT_JOBS[c.wealth === 1 && !c.urban ? 0 : c.wealth];
    const fn = (sex) => R.pick(c, sex === "m" ? P.m : P.f);
    const fmtN = (first, sur) => (P.fl.includes("F") ? sur + " " + first : first + " " + sur);
    const dadFirst = opt.dadFirst || fn("m");
    c.father = Object.assign(person(c, "m", "father", -fAge), { n: fmtN(dadFirst, dadSur), first: dadFirst, job: jobMasc(R.pick(c, jp)) });
    const momFirst = fn("f");
    const ownSur = P.fl.includes("S") || P.fl.includes("B") || (P.fl.includes("F") && c.pool !== "jp") || KEEP_SUR.includes(c.pool);
    c.mother = Object.assign(person(c, "f", "mother", -mAge), { n: fmtN(momFirst, B8.surFem(ownSur ? momSur : dadSur, P.fl)), first: momFirst,
      job: R.r(c) < (HOMEMAKER[k.reg] || 0.2) ? "домохозяйка" : jobFem(R.pick(c, jp)) });
    if (P.fl.includes("K")) { c.father.n = dadFirst + " Сингх"; c.mother.n = momFirst + " Каур"; if (c.sex === "f") c.sur = "Каур"; }
    if (P.fl.includes("P")) c.patr = B8.patronymic(dadFirst, c.sex);
    if (opt.parent) { const pr = opt.parent; c[pr.sex === "m" ? "father" : "mother"] = Object.assign(c[pr.sex === "m" ? "father" : "mother"], pr.p); }
    c.sibs = [];
    const nOld = Math.min(7, Math.max(0, Math.floor((mAge - 18) / 2)));
    let gap = 0;
    for (let i = 0; i < nOld; i++) {
      if (!R.chance(c, (k.tfr - 1) / (k.tfr + 1.5))) continue;
      gap += R.int(c, 1, 4);
      if (gap > mAge - 16) break;
      const s = R.chance(c, 0.51) ? "m" : "f";
      c.sibs.push(Object.assign(person(c, s, "sibling", -gap), { n: fn(s) }));
    }
    c.kids = []; c.exes = []; c.friend = null; c.spouse = null; c.date = null; c.friends = [];
    const hb = (k.hdi - 0.6) * 40, g = (m, s) => R.gauss(c, m, s);
    c.h = clamp(g(74 + c.wealth * 5 + hb, 8)); c.iq = clamp(g(30 + c.wealth * 4 + hb * 0.4, 8)); c.soc = clamp(g(52, 10));
    c.luck = clamp(g(50, 20)); c.hap = clamp(g(57 + c.wealth * 6 + (k.hap - 5) * 3, 8)); c.st = 10; c.looks = clamp(g(50, 18));
    c.money = 0; c.inv = 0; c.income = 0; c.edu = 0; c.school = false; c.schoolY = 0; c.uni = null; c.job = null; c.sk = 0;
    c.retired = false; c.emig = false; c.adapt = 0; c.smoker = false; c.smokeY = 0; c.povY = 0;
    c.ls = c.startLs = c.maxLs = famTier(k, c.q); c.lsp = 0; c.a = {}; c.biz = null; c.hobby = ""; c.hobbyL = 0; c.temper = ""; c.tv = [];
    c.focus = ""; c.careerY = 0; c.gk = 0; c.mwhy = ""; c.hit = "болезнь"; c.hsum = 0; c.mood = [];
    c.crime = { on: false, org: k.uw, rank: 0, rep: 0, heat: 0, rec: 0, earned: 0, ops: 0, orgName: "" };
    c.cas = { visits: 0, won: 0, lost: 0, add: 0, big: 0 };
    c.jail = 0; c.jailTot = 0; c.gen = opt.gen || 1; c.letter = ""; c.tm = 0; c.snaps = [];
    c.month = R.int(c, 1, 12); c.doc = k.c3 + "-" + c.born + "-" + R.int(c, 1000000, 9999999);
    c.house = B8.houseLabel(c);
    c.look = B8.makeLook ? B8.makeLook(c) : null;
    B8.say(c, birthSentence(c), "n", "", true);
    return c;
  };
  function birthSentence(c) {
    const k = BY[c.cc];
    const share = B8.birthShare(k.c);
    const where = c.urban ? `в городе ${c.city}` : `в деревне недалеко от города ${c.city}`;
    const nb = c.sibs.filter((s) => s.sex === "m").length, ns = c.sibs.length - nb;
    const cnt = (n, one, few, many) => (n === 1 ? one : n < 5 ? n + " " + few : n + " " + many);
    const sibs = c.sibs.length ? " Старшие: " + [nb ? cnt(nb, "брат", "брата", "братьев") : "", ns ? cnt(ns, "сестра", "сестры", "сестёр") : ""].filter(Boolean).join(" и ") + "." : "";
    const rel = c.rel === "none" ? " Семья не религиозна." : ` Вера семьи — ${B8.RELN[c.rel]}.`;
    return `Ты родил[ся|ась] ${where} (${k.n}). Так рождается ${share >= 1 ? share.toFixed(1).replace(".", ",") : share.toFixed(2).replace(".", ",")}% детей Земли. Семья — ${B8.QLABEL[c.q - 1]}.${rel}${sibs}`;
  }

  // ───────── фокус года ─────────
  B8.FOCUS = {
    kid: [["study", "📚 Учёба", "Ум↑"], ["friends", "🧸 Друзья и игры", "Отношения↑ Счастье↑"], ["sport", "⚽ Спорт", "Здоровье↑"], ["hobby", "🎨 Увлечения", "Счастье↑ Мастерство↑"]],
    work: [["chores", "🧺 Помощь семье", "Семья↑ Ум немного↓"], ["friends", "🧸 Друзья и игры", "Отношения↑ Счастье↑"], ["sport", "⚽ Спорт", "Здоровье↑"], ["hobby", "🎨 Увлечения", "Счастье↑"]],
    adult: [["balance", "⚖️ Всего понемногу", "Без перекосов"], ["career", "💼 Карьера", "Доход↑ Повышение↑ Стресс↑"], ["family", "❤️ Семья и друзья", "Отношения↑ Стресс↓"],
      ["health", "🏃 Здоровье", "Здоровье↑"], ["study", "📚 Самообразование", "Ум↑ Навыки↑"], ["rest", "🎣 Отдых и увлечения", "Счастье↑ Стресс↓"]],
    old: [["balance", "⚖️ Всего понемногу", "Без перекосов"], ["family", "❤️ Семья и внуки", "Отношения↑ Счастье↑"], ["health", "🏃 Здоровье", "Здоровье↑"], ["rest", "🎣 Увлечения", "Счастье↑"]],
  };
  B8.focusSet = (c) => (c.age < 6 ? [] : c.age < 18 ? (c.school ? B8.FOCUS.kid : B8.FOCUS.work) : c.retired || c.age >= 65 ? B8.FOCUS.old : B8.FOCUS.adult);
  B8.defFocus = (c) => (c.age < 6 ? "" : c.age < 18 ? (c.school ? "study" : "chores") : "balance");
  function applyFocus(c) {
    const f = c.focus;
    c.careerY = f === "career" ? c.careerY + 1 : Math.max(0, c.careerY - 1);
    if (f === "study") { c.iq += 2.5 * (1 - c.iq / 125); c.sk += 2; }
    else if (f === "friends") { c.soc += 3 * (1 - c.soc / 125); c.hap += 1.5; c.st -= 3; }
    else if (f === "sport" || f === "health") { c.h += 2.5 * (1 - c.h / 125); c.st -= 2; c.counts.fh = (c.counts.fh || 0) + 1; if (c.counts.fh >= 4) c.flags.sporty = 1; }
    else if (f === "hobby" || f === "rest") { c.hap += 2.5; c.st -= 5; if (c.hobby) c.hobbyL += 3 * (1 - c.hobbyL / 110); }
    else if (f === "chores") { c.soc += 1.5 * (1 - c.soc / 125); c.iq -= 0.5; }
    else if (f === "career") { c.sk += 3; c.st += 4; }
    else if (f === "balance") { c.sk += 1; c.soc += 1 * (1 - c.soc / 125); c.st -= 2; }
    else if (f === "family") { c.soc += 3 * (1 - c.soc / 125); c.hap += 2; c.st -= 5; }
    if (c.hobby && f !== "hobby" && f !== "rest") c.hobbyL += 0.4 * (1 - c.hobbyL / 110);
  }

  // ───────── увлечения ─────────
  B8.HOBBIES = {
    music: ["музыка", "Ты впервые взял[|а] в руки гитару — и не захотел[|а] отпускать.", ["Первое выступление на школьном концерте. Руки дрожали.", "Твою песню слушают тысячи людей в сети.", "Ты собрал[|а] полный зал на собственном концерте."], "art"],
    drawing: ["рисование", "Ты рисуешь везде: в тетрадях, на стенах, на песке.", ["Твой рисунок повесили в школьном коридоре.", "Первая выставка в местной галерее.", "Твои картины покупают коллекционеры."], "art"],
    sport: ["спорт", "Ты записал[ся|ась] в секцию — {sport} — и пропадаешь там вечерами.", ["Первая медаль на городских соревнованиях.", "Ты выиграл[|а] чемпионат региона.", "Ты выступил[|а] за сборную страны."], "art"],
    reading: ["книги", "Ты читаешь всё, что попадается под руку, — даже инструкции к стиральной машине.", ["Ты прочитал[|а] сотую книгу.", "Твой рассказ напечатали в журнале.", "Вышла твоя первая книга."], "edu"],
    coding: ["программирование", "Ты написал[|а] первую программу — она вывела «Привет, мир».", ["Твоя программа заработала у друзей.", "Твоё приложение скачали десять тысяч человек.", "Крупная компания купила твой проект."], "it"],
    cooking: ["кулинария", "Ты помогаешь на кухне. Твоя стряпня пока несъедобна, но ты стараешься.", ["Вся семья просит добавки.", "Твой рецепт победил на местном конкурсе.", "О твоей кухне написали в газете."], "food"],
    chess: ["шахматы", "Дед научил тебя шахматам. Ты обыграл[|а] его через неделю.", ["Первый разряд.", "Ты стал[|а] мастером спорта.", "Ты обыграл[|а] гроссмейстера на турнире."], "edu"],
  };
  function hobbyMilestones(c) {
    if (!c.hobby) return;
    const H = B8.HOBBIES[c.hobby];
    [30, 60, 85].forEach((lvl, i) => {
      const key = "hm" + i;
      if (c.hobbyL >= lvl && !c.flags[key]) {
        c.flags[key] = 1; c.hap += 5;
        if (i === 2) { c.flags.master = 1; B8.turn(c, "мастер: " + H[0]); }
        B8.say(c, H[2][i], "g", "годы увлечения", i > 0);
      }
    });
  }

  // ───────── работа: поиск ─────────
  B8.canField = (c, f) => c.edu >= B8.FIELDS[f][1] && !(f === "police" && c.crime.rec > 0) && !(f === "farm" && c.urban && c.age > 25);
  B8.jobOffers = function (c) {
    const fields = Object.keys(B8.FIELDS).filter((f) => B8.canField(c, f) && f !== "art");
    const out = [];
    const pool = fields.slice();
    while (out.length < 3 && pool.length) {
      const f = pool.splice(Math.floor(R.r(c) * pool.length), 1)[0];
      const lvl = clamp(1 + Math.floor((c.edu >= 3 ? 1 : 0) + c.sk / 40 + (c.iq > 70 ? 0.5 : 0)), 1, 3);
      out.push({ f, lvl });
    }
    return out;
  };
  B8.takeJob = function (c, f, lvl, quiet) {
    c.job = { f, lvl, y: 0 };
    if (c.conds.unemployed) delete c.conds.unemployed;
    c.flags.path = 1;
    if (!quiet) B8.say(c, "Новая работа: {job}.", "g", "", true);
  };
  B8.findJob = function (c, quiet) {
    const offers = B8.jobOffers(c);
    if (!offers.length) return;
    const o = offers.sort((a, b) => B8.FIELDS[b.f][2] - B8.FIELDS[a.f][2])[0];
    B8.takeJob(c, o.f, o.lvl, quiet);
  };
  B8.loseJob = function (c, why) {
    if (!c.job) return;
    c.job = null; c.conds.unemployed = c.age;
    B8.stress(c, 12, why || "потеря работы");
  };

  // ───────── экономика года ─────────
  function economy(c) {
    const k = BY[c.cur], gdp = k.gdp, rural = c.urban ? 1 : 0.7, ec = B8.econ(c);
    let inc = 0;
    if (c.jail) inc = 0;
    else if (c.retired) inc = gdp * k.pen + Math.min(c.kids.filter((x) => x.alive).length, 4) * gdp * 0.06 * rural + c.inv * 0.04;
    else if (c.school || c.uni) inc = gdp * 0.12 * rural + (c.flags.scholar ? gdp * 0.2 : 0);
    else if (c.job) {
      const F = B8.FIELDS[c.job.f];
      inc = gdp * B8.JOB_MULT[Math.min(5, c.job.lvl)] * F[2] * (0.6 + c.iq / 125) * rural * (1 + 0.08 * ec) * (1 + Math.min(c.job.y, 15) * 0.01) * (1 + c.sk / 400) * Math.exp(R.gauss(c, 0, 0.12));
      if (c.focus === "career") inc *= 1.12;
      if (c.flags.hobbypro) inc *= 1 + c.hobbyL / 200;
      if (c.conds.drinking) inc *= 0.8;
      if (c.crime.rec && c.job.f !== "labor") inc *= 0.9;
    }
    if (c.biz && B8.biz) inc += B8.biz.year(c);
    if (c.spouse && c.spouse.alive && !c.jail) inc += gdp * 0.35 * rural * (c.flags.spouse_good ? 1.4 : 1);
    if (c.crime.on && B8.crime) inc += B8.crime.passive(c);
    c.income = inc;
    const kids = c.age < 55 ? Math.min(c.kids.filter((x) => x.alive && c.age - x.born < 22).length, 6) : 0;
    const need = gdp * 0.32 * (c.urban ? 1 : 0.55) * (1 + 0.15 * kids);
    let cost = c.jail ? gdp * 0.05 : need + Math.max(0, inc - need) * (0.82 + 0.03 * c.ls);
    if (c.a.car) cost += gdp * 0.05 * (c.a.car >= 2 ? 3 : 1);
    if (c.a.yacht) cost += gdp * 2;
    if (c.a.mort > 0) { cost += c.a.mpay; c.a.mort -= 1; if (!c.a.mort) B8.say(c, "Ипотека выплачена! Квартира теперь полностью твоя.", "g", "", true); }
    if (c.uni && c.wealth < 2 && !c.flags.scholar) cost += gdp * 0.12;
    if (c.conds.diabetes || c.conds.cancer) cost += gdp * 0.1;
    if (c.conds.gambling) cost += gdp * 0.25 * (c.cas.add / 100);
    if (c.adapt) cost *= 1.15;
    c.money += inc - cost;
    if (c.inv) {
      c.inv *= 1 + R.gauss(c, 0.06 + ec * 0.04, 0.12);
      if (c.money < 0 && c.inv > 0) { const x = Math.min(c.inv, -c.money); c.inv -= x; c.money += x; }
    }
    if (c.money < -gdp * 0.3) {
      c.povY += 1; c.h -= 2; B8.stress(c, 8, "долги"); c.hit = "бедность";
      if (c.a.mort && c.money < -gdp * 1.5) {
        c.a.home = 0; c.a.mort = 0; c.a.mpay = 0; c.money += c.a.homeVal * 0.5;
        B8.turn(c, "потеря жилья"); B8.say(c, "Банк забрал жильё за долги по ипотеке.", "b", c.mwhy || "долги", true);
      }
      if (c.money < -gdp * 3) c.money = -gdp * 3;
    } else if (c.povY) { c.povY = 0; B8.say(c, "Ты выбрал[ся|ась] из долговой ямы.", "g", c.mwhy || "", true); }
    if (c.h < 45 && c.money > gdp * 0.1) { c.money -= gdp * 0.2; c.h += 5 / k.med; }
  }
  const LS_UP = ["", "Денег стало хватать на самое нужное — без страха перед концом месяца.", "Ты переехал[|а] в нормальную квартиру и впервые откладываешь деньги.",
    "Ты живёшь в достатке: хорошая еда, отпуск каждый год, никаких долгов.", "Ты живёшь богато: дом с садом, лучшие врачи, путешествия когда захочется."];
  const LS_DOWN = ["Каждый день — борьба за еду и крышу над головой.", "Ты живёшь от зарплаты до зарплаты.", "Ты переехал[|а] в жильё попроще и стал[|а] считать каждую покупку.", "Пришлось отказаться от привычных удовольствий."];
  B8.netWorth = (c) => c.money + c.inv + (c.a.home ? c.a.homeVal : 0) + (c.a.mansion ? c.a.mansionVal || 0 : 0) + (c.biz ? c.biz.val : 0);
  function lifestyle(c) {
    const k = BY[c.cur];
    if (c.age < 18) {
      c.ls = c.flags.dad_dead && c.wealth === 0 ? 0 : famTier(BY[c.cc], c.q);
      if (c.emig) c.ls = Math.max(c.ls, famTier(k, Math.max(1, c.q - 1)));
      c.house = B8.houseLabel(c); return;
    }
    if (c.school || c.uni || c.jail) { c.house = B8.houseLabel(c); return; }
    const gdp = k.gdp, score = c.income / gdp * 0.6 + Math.max(0, B8.netWorth(c)) / gdp * 0.03;
    const t = score < 0.4 ? 0 : score < 0.8 ? 1 : score < 1.8 ? 2 : score < 4 ? 3 : 4;
    if (t === c.ls) c.lsp = 0;
    else {
      c.lsp += 1;
      if (c.lsp >= 2 || Math.abs(t - c.ls) >= 2) {
        const up = t > c.ls, nw = Math.abs(t - c.ls) < 2 ? c.ls + (up ? 1 : -1) : t;
        const why = c.mwhy || (up ? "рост дохода" : "падение дохода");
        if (up) { B8.say(c, `Уровень жизни вырос: теперь ты живёшь ${B8.LS[nw]}. ` + LS_UP[nw], "g", why, true); if (nw >= 3 && nw > c.maxLs) B8.turn(c, nw === 4 ? "роскошная жизнь" : "жизнь в достатке"); }
        else {
          B8.say(c, `Уровень жизни упал: теперь ты живёшь ${B8.LS[nw]}. ` + LS_DOWN[nw], "b", why, true);
          if (nw <= 1 && c.ls >= 3 && !(c.turns || []).some((t) => t[1] === "потеря достатка" && c.age - t[0] < 15)) B8.turn(c, "потеря достатка");
          if (c.a.car && nw <= 1) { c.a.car = 0; B8.say(c, "Машину пришлось продать.", "b", "нужны деньги"); }
        }
        c.ls = nw; c.lsp = 0; c.mwhy = "";
      }
    }
    c.maxLs = Math.max(c.maxLs, c.ls);
    c.house = B8.houseLabel(c);
  }

  // ───────── семья: старение и уход близких ─────────
  const hazard = (age, le) => 0.0005 + 0.03 * Math.exp((age - le) / 6.5);
  function familyYear(c) {
    const k = BY[c.cur];
    for (const p of [c.mother, c.father]) {
      if (!p.alive) continue;
      const pa = c.age - p.born;
      const fated = p.fate != null && p.fate >= 0;
      if (fated ? c.age >= p.fate : R.r(c) < hazard(pa, p.le) * (c.age < 18 && k.hdi < 0.55 ? 1.5 : 1)) {
        p.alive = false; p.died = pa;
        const who = p.role === "mother" ? "мама" : "папа";
        B8.stress(c, 25, "смерть родителя"); c.hap -= 10;
        B8.say(c, `Умер${p.sex === "f" ? "ла" : ""} ${who}, ${p.n}. ${pa} ${B8.years(pa)}.`, "b", c.age < 18 ? "детство кончилось слишком рано" : "", true);
        B8.turn(c, "смерть: " + who);
        if (p.role === "father") c.flags.dad_dead = 1;
        if (c.age >= 18 && R.chance(c, 0.6) && c.wealth >= 1) B8.schedule(c, "inherit", 0, 1, { who });
      }
    }
    for (const s of c.sibs) if (s.alive && R.r(c) < hazard(c.age - s.born, s.le) * 0.8) { s.alive = false; s.died = c.age - s.born; B8.stress(c, 15, "смерть близкого"); B8.say(c, `Не стало ${s.sex === "m" ? "брата" : "сестры"} — ${s.n}.`, "b", "", true); }
    for (const kd of c.kids) {
      if (!kd.alive) continue;
      const ka = c.age - kd.born;
      if (ka < 5 && R.r(c) < k.im * 0.00012 * 2) { kd.alive = false; kd.died = ka; B8.stress(c, 35, "смерть ребёнка"); c.hap -= 20; B8.say(c, `Умер[|ла] твой ребёнок — ${kd.n}. Ему было ${ka}. Это самое страшное, что может случиться.`, "b", "", true); B8.turn(c, "смерть ребёнка"); continue; }
      if (ka >= 5 && R.r(c) < hazard(ka, kd.le) * 0.5) { kd.alive = false; kd.died = ka; B8.stress(c, 30, "смерть ребёнка"); c.hap -= 15; B8.say(c, `Не стало твоего ребёнка — ${kd.n}.`, "b", "", true); continue; }
      if (ka === 6) kd.st = "пошёл в школу".replace("пошёл", kd.sex === "f" ? "пошла" : "пошёл");
      if (ka === 18) { kd.edu = R.chance(c, 0.3 + c.edu * 0.12) ? 3 : 2; kd.st = kd.edu >= 3 ? "учится в университете" : "работает"; }
      if (ka === 23) kd.job = kd.edu >= 3 ? R.pick(c, ["врач", "инженер", "учитель", "программист", "юрист", "экономист", "архитектор"]) : R.pick(c, ["водитель", "продавец", "строитель", "повар", "механик", "парикмахер", "охранник"]);
      if (ka >= 24 && !kd.married && R.chance(c, 0.12)) { kd.married = true; kd.st = "в браке"; B8.say(c, `${kd.n} вступил${kd.sex === "f" ? "а" : ""} в брак. Ты плакал[|а] на свадьбе.`, "g"); }
      if (kd.married && ka >= 25 && ka <= 42 && R.chance(c, 0.15)) { kd.kids = (kd.kids || 0) + 1; c.gk += 1; c.hap += 4; B8.say(c, `У тебя ${c.gk === 1 ? "появился первый внук" : "ещё один внук — уже " + c.gk}. ${kd.n} — счастлив${kd.sex === "f" ? "а" : ""}.`, "g", "", c.gk === 1); }
    }
    if (c.spouse && c.spouse.alive) {
      const sa = c.age - c.spouse.born;
      if (R.r(c) < hazard(sa, c.spouse.le)) {
        c.spouse.alive = false; c.spouse.died = sa; B8.stress(c, 30, "смерть супруга"); c.hap -= 15;
        B8.say(c, `Умер${c.spouse.sex === "f" ? "ла" : ""} ${c.spouse.sex === "f" ? "жена" : "муж"} — ${c.spouse.n}. Дом стал очень тихим.`, "b", "", true);
        B8.turn(c, "вдовство"); c.exes.push(c.spouse); c.spouse = null;
      }
    }
    if (c.friend && c.friend.alive && R.r(c) < hazard(c.age - c.friend.born, c.friend.le) * 0.6) {
      c.friend.alive = false; c.friend.died = c.age - c.friend.born; B8.stress(c, 15, "смерть друга");
      B8.say(c, `Не стало друга — ${c.friend.n}.`, "b", "", true); c.friend = null;
    }
  }
  B8.years = (n) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? "лет" : b === 1 ? "год" : b >= 2 && b <= 4 ? "года" : "лет"; };

  // ───────── обновление года ─────────
  const TEMPERS = { cautious: ["осторожный и наблюдательный", "осторожная и наблюдательная"], bold: ["смелый и общительный", "смелая и общительная"],
    kind: ["чуткий и заботливый", "чуткая и заботливая"], persistent: ["упорный и настойчивый", "упорная и настойчивая"] };
  B8.TEMPERS = TEMPERS;
  function yearUpdate(c) {
    const k = BY[c.cur], a = c.age;
    if (a === 5 && !c.temper) {
      const v = c.tv.length ? c.tv : [R.pick(c, Object.keys(TEMPERS))];
      const cnt = {}; v.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
      c.temper = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x] || v.lastIndexOf(y) - v.lastIndexOf(x))[0];
      B8.say(c, `К пяти годам сложился характер: ты — ${TEMPERS[c.temper][c.sex === "m" ? 0 : 1]} ребёнок.`, "n", "выборы раннего детства", true);
      ({ cautious: () => (c.iq += 4), bold: () => (c.soc += 5), kind: () => (c.soc += 4), persistent: () => (c.iq += 3) })[c.temper]();
    }
    applyFocus(c);
    if (c.jail) { /* тюрьма — своя жизнь, см. crime.jailYear */ }
    else if (c.school) {
      c.schoolY += 1;
      let gr = (0.8 + R.r(c) * 1.2) * (0.5 + k.edu / 30) * (c.conds.hungry ? 0.6 : 1);
      if (c.temper === "persistent") gr *= 1.15;
      c.iq += gr * (1 - c.iq / 125);
      if (c.schoolY >= 11) {
        c.school = false; c.edu = Math.max(c.edu, 2);
        const res = c.iq > 70 ? "на отлично" : c.iq > 50 ? "хорошо" : "еле-еле";
        B8.say(c, `Выпускные экзамены сданы ${res}. Аттестат на руках!`, "g", c.focus === "study" ? "фокус на учёбе" : "", true);
      }
    } else if (c.uni) {
      c.uni.y += 1; c.iq += (1 + R.r(c) * 1.5) * (1 - c.iq / 125);
      if (c.uni.y >= (c.uni.t === 4 ? 2 : 4)) {
        c.edu = c.uni.t; const abroad = c.uni.abroad; c.uni = null;
        B8.say(c, c.edu === 4 ? "Ты получил[|а] диплом магистра!" : "Ты получил[|а] диплом бакалавра!", "g", abroad ? "учёба за границей" : "", true);
        if (!c.job && !c.biz) B8.findJob(c);
      }
    } else c.iq += (a < 6 ? 1.6 : 0.3) * (1 - c.iq / 125);
    if (c.job && !c.jail) { c.job.y += 1; c.sk += 1.5 + c.iq / 60; }
    if (a === 18) c.money += k.gdp * [0, 0.3, 2.5][c.wealth];
    if (a >= 18 && !c.school && !c.uni && !c.retired && !c.jail) {
      const ra = B8.retAge(k);
      if (a >= ra && ((!c.job && !c.biz) || a >= ra + 10)) {
        c.retired = true; c.job = null;
        if (c.biz) { B8.gain(c, c.biz.val * 0.7, "продажа бизнеса"); B8.say(c, `Ты продал[|а] «${c.biz.name}» и отош[ёл|ла] от дел.`, "n"); c.biz = null; }
        B8.say(c, "Ты уш[ёл|ла] на пенсию.", "n", "возраст", true);
      } else if (!c.job && !c.biz && c.flags.path && !c.crime.on && R.r(c) < 0.45 - Math.max(0, -B8.econ(c)) * 0.12) B8.findJob(c);
    }
    if (a >= 18) economy(c);
    lifestyle(c);
    familyYear(c);
    hobbyMilestones(c);
    if (c.smoker) { c.smokeY += 1; if (c.smokeY === 12) B8.schedule(c, "quit_smoke", 0); }
    if (c.conds.unemployed && !c.jail) B8.stress(c, 6, "безработица");
    if (B8.crime && !c.jail) B8.crime.year(c);
    if (B8.casino) B8.casino.year(c);
    // здоровье тянется к «норме» для возраста и образа жизни
    const tgt = 94 + (c.ls - 1) * 1.5 - Math.max(0, a - 30) * 0.6 * k.med - (c.smoker ? Math.max(0, a - 18) * 0.25 : 0) - (c.conds.diabetes ? 8 : 0) - (c.conds.back ? 6 : 0) -
      (c.conds.drinking ? 8 : 0) - (c.conds.cancer ? 10 : 0) - (c.st > 60 ? 4 : 0) + (c.flags.sporty ? 3 : 0) - (c.jail ? 4 : 0);
    c.h += (tgt - c.h) * 0.18;
    // стресс
    const sup = (c.spouse && c.spouse.alive ? 0.06 : 0) + (c.friend && c.friend.close && c.friend.alive ? 0.04 : 0) + Math.max(0, c.soc - 55) / 600;
    let load = 0;
    if (a >= 18) { load += c.job && c.job.lvl >= 3 ? 3 : c.biz ? 3.5 : 1.5; if (a < 60) load += Math.min(c.kids.filter((x) => x.alive && c.age - x.born < 18).length, 3) * 1.5; if (c.adapt) load += 5; if (c.jail) load += 8; if (c.crime.on) load += 2 + c.crime.heat / 20; }
    else if (a >= 7) load += c.school ? 2 : 3;
    if (c.temper === "cautious") load += 1;
    c.st = clamp(c.st * (0.8 - sup) + load);
    // счастье
    let ht;
    if (a < 18) ht = k.hap * 5 + 18 + c.ls * 4 + (c.h - 50) * 0.2 - c.st * 0.25;
    else {
      const rel = c.money / k.gdp, mf = rel > 0 ? 3 * Math.log1p(rel) : Math.max(-10, rel * 6);
      ht = k.hap * 6 + (c.h - 50) * 0.2 + mf + c.ls * 2.5 + (c.spouse && c.spouse.alive ? 8 : 0) + Math.min(c.kids.filter((x) => x.alive).length, 3) * 2 - (c.adapt ? 10 : 0) - c.st * 0.3 +
        (c.luck - 50) * 0.05 + (c.soc - 50) * 0.1 + (c.flags.master ? 6 : 0) - (c.jail ? 15 : 0);
      if (c.conds.depression) ht -= 15;
    }
    c.hap += (ht - c.hap) * 0.3 + (R.r(c) * 4 - 2);
    c.soc += (52 - c.soc) * 0.04;
    if (a > 65) c.iq -= 0.4;
  }

  // ───────── события мира ─────────
  B8.NEWS = {
    recession: ["Мир: в {year} году начался глобальный экономический кризис.", "b"],
    pandemic: ["Мир: пандемия нового вируса.", "b"],
    breakthrough: ["Мир: прорыв в медицине — болезни старения научились лечить. Но не везде.", "g"],
    automation: ["Мир: волна автоматизации — роботы и ИИ заменяют офисную и заводскую работу.", "n"],
    climate: ["Мир: климат перешёл точку невозврата — бедствий станет больше.", "b"],
    mars: ["Мир: на Марсе высадились первые люди. Один из них — родом из твоей страны, говорят по телевизору.", "w"],
    fusion: ["Мир: запущена первая термоядерная электростанция. Электричество обещают сделать почти бесплатным. Лет через двадцать.", "w"],
    ai_rights: ["Мир: в ООН всерьёз спорят, нужен ли искусственному интеллекту отпуск.", "w"],
    olympics: ["Мир: Олимпиаду впервые провели сразу в трёх странах. Бегуны летали между ними на самолётах.", "w"],
    flying: ["Мир: в крупных городах появились летающие такси. Пробки переместились в небо.", "w"],
    lunar: ["Мир: на Луне открылась первая гостиница. Номер стоит как три дома.", "w"],
    longevity: ["Мир: средний возраст жизни на Земле впервые перевалил за 80.", "g"],
    quantum: ["Мир: квантовый компьютер взломал старые пароли. Миллионы людей меняют «12345» на «123456».", "w"],
    ocean: ["Мир: океаны начали очищать от пластика роботы-киты.", "g"],
  };
  function worldYear(c) {
    const y = c.born + c.age;
    for (const e of c.world.ev[y] || []) {
      const n = B8.NEWS[e];
      if (e === "pandemic") {
        const hit = 10 + Math.max(0, c.age - 50) * 0.5 - (c.flags.vacc ? 5 : 0);
        c.h -= hit; c.hit = "болезнь"; B8.stress(c, 8, "пандемия");
        B8.say(c, `Мир: пандемия нового вируса. Ты переболел[|а]${hit > 15 ? " тяжело" : ""}.`, "w", "", true);
      } else if (e === "breakthrough") { const b = BY[c.cur].hdi > 0.75 ? 4 : 1.5; c.le += b; B8.say(c, n[0], "w", b < 3 ? "богатые страны получают лечение первыми" : "", true); }
      else if (e === "recession") { B8.stress(c, 6, "мировой кризис"); B8.say(c, n[0], "w", "", true); }
      else if (e === "longevity") { c.le += 1; B8.say(c, n[0], "w"); }
      else B8.say(c, n[0], "w", "", e === "automation" || e === "climate");
    }
  }
  // строка новостей эпохи (для бегущей строки)
  const TICKER = ["Учёные снова спорят, полезен ли кофе.", "Мировой рекорд: человек 48 часов не смотрел в телефон.", "В моду вернулись кнопочные телефоны.", "Курс биткоина опять всех удивил.",
    "Роботы-курьеры объявили забастовку из-за дождя.", "Новый сериал смотрит полпланеты.", "Цены на жильё снова выросли. Никто не удивлён.", "Футбольный трансфер года стоил как небольшая страна.",
    "Пингвины Антарктиды впервые попали в кадр спутника крупным планом.", "Стартап продаёт воздух из горных деревень. Продажи растут.", "Самый популярный ребёнок-блогер ушёл на пенсию в 14.",
    "Нейросеть написала оперу. Критики разгромили, зрители рыдали.", "Мировые лидеры встретились и сфотографировались.", "Электромобилей впервые продали больше, чем бензиновых."];
  B8.ticker = (c) => { const y = c.born + c.age; const ev = c.world.ev[y]; if (ev && ev.length && B8.NEWS[ev[0]]) return B8.fmt(c, B8.NEWS[ev[0]][0]); return TICKER[((Math.imul(y, 2654435761) ^ c.world.seed) >>> 0) % TICKER.length]; };

  // ───────── смерть ─────────
  B8.die = function (c, cause) { c.alive = false; c.cause = cause; c.pend = []; };
  B8.CAUSE = { "младенческая смертность": "болезни новорождённых", болезнь: "болезнь", старость: "старость", "несчастный случай": "несчастный случай", бедность: "бедность и её последствия",
    война: "вооружённый конфликт", рак: "онкологическое заболевание", сердце: "болезнь сердца", разборки: "криминальные разборки", тюрьма: "болезнь в тюрьме", авария: "авария", стихия: "стихийное бедствие" };
  function deathCheck(c) {
    const a = c.age;
    if (c.flags.tut && a < 12) { if (c.h < 20) c.h = 20; return; } // первая жизнь в обучении не обрывается в детстве
    if (c.h <= 0) {
      if (R.r(c) < 0.2 + c.luck / 250) { c.h = 8; B8.say(c, "Ты был[|а] на грани смерти, но чудом выкарабкал[ся|ась].", "g", "удача", true); }
      else { B8.die(c, c.hit); return; }
    }
    if (a >= MAX_AGE) { B8.die(c, "старость"); return; }
    let h = 0.0004 + 0.03 * Math.exp((a - c.le) / 6.5);
    if (a < 5) h += BY[c.cur].im * 0.00012;
    if (c.h < 50) h *= 1 + (50 - c.h) / 30;
    if (R.r(c) < Math.min(h, 0.95)) {
      if (c.conds.cancer) B8.die(c, "рак");
      else if (c.jail) B8.die(c, "тюрьма");
      else if (c.povY >= 2 && a < c.le) B8.die(c, "бедность");
      else if (a >= 60 && a >= c.le - 8) B8.die(c, R.chance(c, 0.25) ? "сердце" : "старость");
      else B8.die(c, "болезнь");
    }
  }
  function clampAll(c) {
    c.h = clamp(c.h, c.alive ? 1 : 0); c.iq = clamp(c.iq); c.soc = clamp(c.soc); c.hap = clamp(c.hap); c.st = clamp(c.st); c.sk = clamp(c.sk); c.hobbyL = clamp(c.hobbyL);
    c.luck = clamp(c.luck); c.looks = clamp(c.looks);
    if (c.crime) { c.crime.heat = clamp(c.crime.heat); c.crime.rep = clamp(c.crime.rep, 0, 1000); }
    if (c.cas) c.cas.add = clamp(c.cas.add);
  }
  B8.clampAll = clampAll;

  // ───────── ход времени ─────────
  // «+ Год»: доживаем текущий год, стареем, начинается новый — с событиями и решениями.
  B8.advance = function (c) {
    if (!c.alive) return;
    c.news = [];
    if (!c.focus || !B8.focusSet(c).some((f) => f[0] === c.focus)) c.focus = B8.defFocus(c);
    B8.snapshot(c);
    yearUpdate(c);
    if (c.alive) deathCheck(c);
    clampAll(c);
    c.hsum += c.hap;
    c.mood[c.age] = Math.round(c.hap);
    if (!c.alive) { B8.finishLife(c); return; }
    c.age += 1;
    c.ya = {};
    notePeak(c);
    if (c.adapt) { c.adapt -= 1; if (!c.adapt) { c.st -= 10; B8.say(c, "Ты наконец освоил[ся|ась] в новой стране: язык, друзья, свои места.", "g", "три года адаптации", true); } }
    if (c.jail && B8.crime) B8.crime.jailYear(c);
    if (c.age % 10 === 0 && c.album[c.album.length - 1] !== c.age) c.album.push(c.age);
    if (c.age === 1 && B8.flag(c, "_")) {}
    beginYear(c);
    clampAll(c);
    if (!c.alive) B8.finishLife(c);
  };
  // вершина карьеры — для итогов жизни
  function notePeak(c) {
    let sc = 0, t = "";
    if (c.job) { sc = c.job.lvl * 10 + B8.FIELDS[c.job.f][2] * 3; t = B8.jobTitle(Object.assign({}, c, { biz: null, jail: 0 })); }
    if (c.biz) { const v = 15 + c.biz.lvl * 10; if (v > sc) { sc = v; t = "владел" + (c.sex === "f" ? "ица" : "ец") + " бизнеса (" + B8.biz.LVL[c.biz.lvl] + ")"; } }
    if (c.crime.on && c.crime.rank >= 2) { const v = 20 + c.crime.rank * 10; if (v > sc) { sc = v; t = B8.crime.rankTitle(c) + " (" + c.crime.orgName + ")"; } }
    if (sc > (c.peakSc || 0)) { c.peakSc = sc; c.peak = t; }
  }
  B8.notePeak = notePeak;
  function beginYear(c) {
    c.hit = "болезнь";
    if (c.age === 1 && !c.flags.tut && R.r(c) * 1000 < BY[c.cur].im * 0.6) { B8.die(c, "младенческая смертность"); return; }
    worldYear(c);
    // отложенные последствия
    const due = c.queue.filter((q) => q[0] <= c.age);
    c.queue = c.queue.filter((q) => q[0] > c.age);
    for (const [, key, data] of due) {
      if (!c.alive) return;
      const e = B8.EV[key];
      if (!e) continue;
      if (e.if && !e.if(c, data)) continue;
      B8.fire(c, key, Object.assign({}, data), true);
    }
    if (!c.alive) return;
    B8.events(c);
  }

  // ───────── события ─────────
  B8.EV = {};
  B8.POOL = [];
  const K_EVENT = 0.2; // вес 1 ≈ 20% в год, если событие подходит
  // def("id", { a:[от,до], w, cd, n, if, pre, t, fx, o:[...], title, cat, abs, chain })
  B8.def = function (id, spec) {
    if (B8.EV[id]) console.warn("дубль события", id);
    spec.id = id;
    if (spec.cd == null) spec.cd = 5;
    if (spec.n == null) spec.n = spec.o ? 1 : 2;
    B8.EV[id] = spec;
    if (!spec.chain && spec.a) B8.POOL.push(spec);
    return spec;
  };
  B8.chain = (id, spec) => B8.def(id, Object.assign({ chain: true }, spec));
  const wOf = (e, c) => (typeof e.w === "function" ? e.w(c) : e.w == null ? 1 : e.w);
  B8.events = function (c) {
    const a = c.age, fired = [];
    for (const e of B8.POOL) {
      if (a < e.a[0] || a > e.a[1]) continue;
      if ((c.counts[e.id] || 0) >= e.n) continue;
      if (a - (c.last[e.id] == null ? -999 : c.last[e.id]) < e.cd) continue;
      if (c.jail ? !e.jail : e.jail) continue;
      if (e.if && !e.if(c)) continue;
      const w = wOf(e, c);
      if (w <= 0) continue;
      const p = e.abs ? w : Math.min(0.85, w * K_EVENT);
      if (R.r(c) < p) fired.push(e);
    }
    // не больше 3 событий в год и не больше 2 решений
    for (let i = fired.length - 1; i > 0; i--) { const j = Math.floor(R.r(c) * (i + 1)); [fired[i], fired[j]] = [fired[j], fired[i]]; }
    fired.sort((x, y) => (y.abs ? 1 : 0) - (x.abs ? 1 : 0));
    let n = 0, dec = c.pend.length;
    const cap = a < 3 ? 2 : 3;
    for (const e of fired) {
      if (n >= cap) break;
      if (e.o && dec >= 2) continue;
      if (B8.fire(c, e.id, {})) { n++; if (e.o) dec++; }
      if (!c.alive) return;
    }
  };
  // запустить событие: обычное — сразу в летопись, с выбором — в очередь решений
  B8.fire = function (c, id, d, fromQueue) {
    const e = B8.EV[id];
    if (!e) return false;
    d = d || {};
    if (e.pre && e.pre(c, d) === false) return false;
    c.counts[id] = (c.counts[id] || 0) + 1;
    c.last[id] = c.age;
    if (e.o) { c.pend.push({ id, d }); return true; }
    const text = typeof e.t === "function" ? e.t(c, d) : Array.isArray(e.t) ? R.pick(c, e.t) : e.t;
    if (text) B8.say(c, text, e.k || kindOf(e.fx), typeof e.why === "function" ? e.why(c, d) : e.why || "", !!e.big, d);
    if (e.fx) B8.apply(c, e.fx, d);
    return true;
  };
  function kindOf(fx) {
    if (!fx) return "n";
    const v = (fx.hap || 0) + (fx.h || 0) + (fx.$ || 0) * 10 - (fx.st || 0) * 0.5;
    return v > 1 ? "g" : v < -1 ? "b" : "n";
  }
  // применить эффекты
  B8.apply = function (c, fx, d) {
    if (!fx) return;
    if (typeof fx === "function") return fx(c, d || {});
    const gdp = B8.gdp(c);
    if (fx.h) { c.h += fx.h; if (fx.h < 0) c.hit = fx.hit || c.hit; }
    if (fx.hap) c.hap += fx.hap;
    if (fx.iq) c.iq += fx.iq;
    if (fx.soc) c.soc += fx.soc;
    if (fx.st) B8.stress(c, fx.st, fx.why || "");
    if (fx.luck) c.luck += fx.luck;
    if (fx.looks) c.looks += fx.looks;
    if (fx.sk) c.sk += fx.sk;
    if (fx.le) c.le += fx.le;
    if (fx.$) B8.gain(c, gdp * fx.$, fx.mwhy);
    if (fx.$$) B8.gain(c, fx.$$, fx.mwhy);
    if (fx.heat) c.crime.heat += fx.heat;
    if (fx.rep) c.crime.rep += fx.rep;
    if (fx.add) c.cas.add += fx.add;
    if (fx.hob) c.hobbyL += fx.hob;
    if (fx.flag) [].concat(fx.flag).forEach((f) => (f[0] === "-" ? delete c.flags[f.slice(1)] : (c.flags[f] = 1)));
    if (fx.cond) [].concat(fx.cond).forEach((f) => (f[0] === "-" ? delete c.conds[f.slice(1)] : (c.conds[f] = c.age)));
    if (fx.tv) c.tv.push(fx.tv);
    if (fx.q) [].concat(fx.q.length && Array.isArray(fx.q[0]) ? fx.q : [fx.q]).forEach((q) => B8.schedule(c, q[1], q[0], q[2], Object.assign({}, d || {}, q[3] || {})));
    if (fx.turn) B8.turn(c, fx.turn);
    if (fx.fn) fx.fn(c, d || {});
    if (fx.t) B8.say(c, fx.t, fx.k || kindOf(fx), fx.why || "", !!fx.big, d);
    if (fx.die) B8.die(c, fx.die);
  };

  // ───────── решения ─────────
  B8.TITLES = { child: "Детство", school: "Школа", teen: "Юность", adult: "Взрослая жизнь", work: "Работа", love: "Любовь", family: "Семья", health: "Здоровье", money: "Деньги",
    old: "Старость", country: "Страна", rel: "Вера", crime: "Тёмные дела", biz: "Бизнес", casino: "Казино", prison: "Тюрьма", weird: "Странный случай", world: "Мир" };
  // что показать игроку: заголовок, текст и варианты (с шансом успеха, если он есть)
  B8.view = function (c, pd) {
    const e = B8.EV[pd.id], d = pd.d || {};
    const text = typeof e.t === "function" ? e.t(c, d) : Array.isArray(e.t) ? e.t[(c.counts[e.id] || 1) % e.t.length] : e.t;
    const opts = e.o.map((o, i) => ({ i, t: B8.fmt(c, typeof o.t === "function" ? o.t(c, d) : o.t, d), hint: o.hint ? B8.fmt(c, typeof o.hint === "function" ? o.hint(c, d) : o.hint, d) : "",
      p: o.p != null ? clamp(Math.round((typeof o.p === "function" ? o.p(c, d) : o.p) * 100), 1, 99) : null, ok: !o.if || o.if(c, d) })).filter((o) => o.ok);
    return { title: e.title ? B8.fmt(c, typeof e.title === "function" ? e.title(c, d) : e.title, d) : B8.TITLES[e.cat] || "Решение", text: B8.fmt(c, text, d),
      why: e.why ? B8.fmt(c, typeof e.why === "function" ? e.why(c, d) : e.why, d) : "", opts, cat: e.cat || "", icon: e.icon || "" };
  };
  // выбрать вариант: применить последствия, вернуть итоговый текст
  B8.choose = function (c, i, auto) {
    const pd = c.pend.shift();
    if (!pd) return null;
    const e = B8.EV[pd.id], d = pd.d || {}, o = e.o[i] || e.o[0];
    const label = B8.fmt(c, typeof o.t === "function" ? o.t(c, d) : o.t, d);
    const before = c.log.length;
    B8.say(c, (typeof e.title === "string" ? e.title : B8.TITLES[e.cat] || "Решение") + " · " + (auto ? "Авто: " : "") + label, "d", "", false, d);
    let ok = null;
    if (o.p != null) {
      const p = typeof o.p === "function" ? o.p(c, d) : o.p;
      ok = R.r(c) < p;
      B8.apply(c, o.fx, d);
      B8.apply(c, ok ? o.ok : o.no, d);
    } else B8.apply(c, o.fx, d);
    clampAll(c);
    if (!c.alive) B8.finishLife(c);
    const res = c.log.slice(before + 1).map((l) => l[1]);
    return { ok, text: res.join(" "), dead: !c.alive };
  };
  // автовыбор (для «авто» и ровесников): осторожный, но разумный
  B8.autoPick = function (c) {
    const pd = c.pend[0], e = B8.EV[pd.id];
    const opts = e.o.map((o, i) => [o, i]).filter(([o]) => !o.if || o.if(c, pd.d || {}));
    const sc = ([o]) => (o.auto != null ? (typeof o.auto === "function" ? o.auto(c, pd.d || {}) : o.auto) : 0) + (o.p != null ? (typeof o.p === "function" ? o.p(c, pd.d) : o.p) - 0.5 : 0) + R.r(c) * 0.8;
    opts.sort((x, y) => sc(y) - sc(x));
    return opts[0][1];
  };

  // ───────── машина времени: снимки последних лет ─────────
  B8.snapshot = function (c) {
    const s = Object.assign({}, c);
    delete s.snaps; delete s.log; delete s.news;
    c.snaps.push([c.age, c.log.length, JSON.stringify(s)]);
    if (c.snaps.length > 6) c.snaps.shift();
  };
  B8.canTimeMachine = (c) => c.alive && c.snaps.length >= 5 && c.age >= 8 && !c.tm;
  B8.timeMachine = function (c) {
    const sn = c.snaps[0];
    if (!sn) return c;
    const old = JSON.parse(sn[2]);
    const n = Object.assign(old, { log: c.log.slice(0, sn[1]), snaps: [], news: [], tm: 1 });
    n.rs = (c.rs ^ 0x5bd1e995) | 0; // другой поток случайностей — мир помнит второй шанс
    n.pend = [];
    B8.say(n, `⏳ Машина времени: ты вернул[ся|ась] в ${n.age} ${B8.years(n.age)}. Второго шанса больше не будет.`, "w", "", true);
    return n;
  };

  // ───────── итоги жизни ─────────
  B8.finishLife = function (c) {
    if (c.done) return;
    c.done = true;
    c.score = B8.score(c);
  };
  B8.score = function (c) {
    const avg = c.hsum / (c.age + 1), net = B8.netWorth(c);
    const wp = clamp(net > 1 ? Math.log10(net) * 3 : 0, 0, 20);
    return Math.round(c.age * 0.6 + avg * 0.4 + c.edu * 4 + wp + Math.min(c.kids.length, 3) * 2 + (c.spouse ? 5 : 0) + (c.flags.master ? 5 : 0) + c.gk * 0.5 - c.jailTot * 0.8);
  };
  B8.epitaph = function (c) {
    const g = (m, f) => (c.sex === "f" ? f : m);
    if (c.crime.rank >= 5) return g("Его боялись три страны и любила одна бабушка.", "Её боялись три страны и любила одна бабушка.");
    if (c.jailTot >= 10) return g("Он знал цену свободе лучше всех.", "Она знала цену свободе лучше всех.");
    if (B8.netWorth(c) > B8.gdp(c) * 500) return g("Мог купить что угодно. Кроме лишнего дня.", "Могла купить что угодно. Кроме лишнего дня.");
    if (c.cas.big) return g("Однажды он сорвал банк. Об этом помнит весь город.", "Однажды она сорвала банк. Об этом помнит весь город.");
    if (c.gk >= 5) return g("Дедушка, которого обожали внуки.", "Бабушка, которую обожали внуки.");
    if (c.flags.master) return g("Мастер своего дела.", "Мастер своего дела.");
    if (c.age < 5) return "Слишком мало времени, чтобы успеть стать кем-то. Но достаточно, чтобы быть любимым.";
    if (c.age < 30) return g("Ушёл слишком рано.", "Ушла слишком рано.");
    if (c.hsum / (c.age + 1) > 70) return g("Прожил счастливую жизнь.", "Прожила счастливую жизнь.");
    if (c.edu >= 4) return g("Учился всю жизнь — и учил других.", "Училась всю жизнь — и учила других.");
    return g("Один из восьми миллиардов. Единственный такой.", "Одна из восьми миллиардов. Единственная такая.");
  };

  // ───────── место в мире: богаче какой доли людей ─────────
  let incTable = null;
  function buildInc() {
    const pts = [];
    for (const k of B8.COUNTRIES) for (let q = 0; q < 5; q++) pts.push([k.gdp * QREL[q], k.pop / 5]);
    pts.sort((a, b) => a[0] - b[0]);
    const tot = pts.reduce((s, p) => s + p[1], 0);
    let acc = 0;
    incTable = pts.map((p) => { acc += p[1]; return [p[0], acc / tot]; });
  }
  B8.percentile = function (c) {
    if (!incTable) buildInc();
    let inc;
    if (c.age < 18 || c.school || c.uni) inc = BY[c.cc].gdp * QREL[c.q - 1] * (c.emig ? 1.5 : 1);
    else { const fam = 1 + (c.spouse && c.spouse.alive ? 1 : 0) + Math.min(3, c.kids.filter((x) => x.alive && c.age - x.born < 18).length); inc = (c.income * 2.2 + Math.max(0, B8.netWorth(c)) * 0.03) / fam * 2; }
    let p = 0;
    for (const [v, cum] of incTable) { if (v <= inc) p = cum; else break; }
    return clamp(Math.round(p * 100), 1, 99);
  };

  // ───────── код судьбы ─────────
  const ALPH = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  B8.seedToCode = function (seed) { let s = seed >>> 0, out = ""; for (let i = 0; i < 8; i++) { out += ALPH[s % 31]; s = Math.floor(s / 31); } return out.slice(0, 4) + "-" + out.slice(4); };
  B8.codeToSeed = function (code) {
    const t = (code || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (t.length !== 8) return null;
    let s = 0;
    for (let i = 7; i >= 0; i--) { const v = ALPH.indexOf(t[i]); if (v < 0) return null; s = s * 31 + v; }
    return s >>> 0;
  };
  B8.newSeed = () => (Math.floor(Math.random() * 31 ** 6) * 31 + Math.floor(Math.random() * 31)) >>> 0;
  B8.dailySeed = (dateStr) => { let h = 2166136261; for (const ch of "day:" + dateStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 31 ** 6; };

  // ───────── династия: прожить жизнь своего ребёнка ─────────
  B8.heirs = (c) => c.kids.filter((k) => k.alive && c.age - k.born >= 0);
  B8.heirLife = function (old, kid) {
    const seed = (old.rs ^ (kid.born * 2654435761)) >>> 0;
    const parent = { sex: old.sex, p: { n: B8.fullName(old), first: old.first, alive: false, died: -1, job: B8.jobTitle(old) } };
    const P = B8.pool(old.pool);
    const parts = kid.n.split(" "), kidSur = P.fl.includes("F") ? parts[0] : parts.slice(1).join(" ");
    const masc = B8.surMasc({ sex: kid.sex, sur: kidSur, pool: old.pool });
    const c = B8.newLife(seed, { cc: old.cur, sex: kid.sex, born: old.born + kid.born, city: old.city, urban: old.urban, rel: old.rel, gen: (old.gen || 1) + 1,
      sur: masc, sur2: old.sur2, dadFirst: old.sex === "m" ? old.first : undefined, world: old.world, q: Math.max(1, Math.min(5, old.ls + 1)) });
    c.pool = old.pool;
    if (kid.first) { c.first = kid.first; c.log = []; B8.say(c, `Ты родил[ся|ась]: ${B8.fullName(c)}. ${B8.K(c.cc).n}, ${c.city}.`, "n", "", true); }
    // родитель (прошлый герой) уйдёт в том же возрасте, что и в прошлой жизни
    const par = old.sex === "m" ? c.father : c.mother;
    Object.assign(par, { n: B8.fullName(old), first: old.first, fate: old.age - kid.born, born: -(kid.born), job: B8.jobTitle(old), alive: true });
    const inh = Math.max(0, B8.netWorth(old)) / Math.max(1, B8.heirs(old).length);
    c.inherit = inh;
    c.meta.parentName = B8.fullName(old);
    B8.say(c, `Ты — ${c.gen}-е поколение семьи. Родитель — ${B8.fullName(old)}. Когда-нибудь тебе достанется наследство: ${B8.money(inh)}.`, "n", "династия", true);
    c.queue.push([Math.max(18, old.age - kid.born), "heir_inherit", { sum: inh }]);
    return c;
  };
  B8.surMasc = function (c) {
    const p = B8.pool(c.pool);
    if (c.sex === "m") return c.sur;
    if (p.fl.includes("K")) return "Сингх";
    if (p.fl.includes("G")) { if (/(ская|цкая)$/.test(c.sur)) return c.sur.slice(0, -2) + "ий"; if (/(ова|ева|ёва|ина|ына)$/.test(c.sur)) return c.sur.slice(0, -1); }
    if (p.fl.includes("R")) { if (/у$/.test(c.sur)) return c.sur.slice(0, -1) + "ос"; }
    return c.sur;
  };
})();
