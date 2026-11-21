/* 1 из 8 миллиардов — Криминал 2.0 и всё, что делает жизнь живой.
   Улики копятся годами → обыск → СИЗО → суд → тюрьма как отдельная жизнь (уважение, опасность, сигареты и лапша) →
   побег (проект на годы) → жизнь в бегах → поимка или срок давности. Ограбления с командой, где кто-то может оказаться крысой.
   Плюс газета о герое, соцсети, питомцы, голос совести и сцены главных моментов. */
(function () {
  "use strict";
  const B8 = window.B8, R = B8.R, clamp = B8.clamp, CR = B8.crime, say = B8.say;
  const K = (c) => B8.K(c.cur), gdp = (c) => B8.gdp(c);
  const g = (c, m, f) => (c.sex === "f" ? f : m);
  const res = (c, text, kind, big) => ({ text: say(c, text, kind || "n", "", !!big), kind: kind || "n" });
  const hashStr = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  B8.actRun = B8.actRun || {};
  const ACT = B8.actRun;

  // ═════════════════ ГАЗЕТА ═════════════════
  const PAPER_BY = { DE: "«{c}-Цайтунг»", AT: "«{c}-Цайтунг»", CH: "«{c}-Цайтунг»", IT: "«Коррьере ди {c}»", FR: "«Журналь де {c}»", ES: "«Эль Диарио де {c}»",
    PT: "«Диариу де {c}»", BR: "«Жорнал де {c}»", JP: "«{c}-Симбун»", KR: "«{c}-Ильбо»", CN: "«{c} Жибао»", RU: "«Вести-{c}»", UA: "«Вести-{c}»", KZ: "«Вести-{c}»",
    UZ: "«Вести-{c}»", PL: "«Газета-{c}»", US: "«{c} Трибьюн»", GB: "«{c} Кроникл»", IN: "«{c}-Таймс»", PK: "«{c}-Таймс»" };
  const PAPER_REG = { latam: "«Ла Вос де {c}»", mideast: "«Аль-Ахбар {c}»", e_europe: "«Новости-{c}»", c_asia: "«Вести-{c}»" };
  function paperName(c) {
    const t = PAPER_BY[c.cur] || PAPER_REG[K(c).reg] || ["«{c}-Таймс»", "«{c}-Экспресс»", "«{c}-Пост»"][hashStr(c.city) % 3];
    return t.replace("{c}", c.city);
  }
  B8.paperName = paperName;
  B8.paper = function (c, head, sub) {
    c.paper = c.paper || [];
    const h = B8.fmt(c, head, {}), name = paperName(c);
    c.paper.push([c.age, h, name]);
    if (c.paper.length > 40) c.paper.shift();
    B8.say(c, h, "p", name + (sub ? " · " + B8.fmt(c, sub) : ""), true);
  };
  const MASKS = ["в маске банана", "в маске панды", "в костюме единорога", "в масках бабушек", "в масках котов", "в масках тыквы", "в костюмах куриц", "в масках динозавров", "в масках президентов вымышленных стран"];
  B8.mask = (c) => R.pick(c, MASKS);

  // ═════════════════ ГОЛОС СОВЕСТИ ═════════════════
  const VOICE = {
    crime1: ["Ну вот. А мама говорила: «Только не ты».", "Первый шаг — самый лёгкий. Запомни это ощущение: дальше будет тяжелее."],
    money: ["Деньги пахнут. Ты просто привык[|ла] к запаху.", "Ты можешь купить почти всё. Интересно, почему внутри так тихо."],
    arrest: ["Ты знал[|а], что этим кончится. Просто надеял[ся|ась], что не сегодня.", "Наручники холодные. Ещё холоднее мысль о маме."],
    prison: ["Здесь много времени. Хватит, чтобы подумать. Или чтобы научиться не думать.", "Стены не говорят. Но слушают внимательно."],
    life: ["Пожизненно. Слово, которое не помещается в голове.", "Теперь каждое утро будет одинаковым. Придётся придумывать разницу самому."],
    release: ["Мир не ждал тебя. Но и дверь не закрыл.", "Свобода пахнет булочной и выхлопными газами. Лучший запах на свете."],
    escape: ["Свобода, которая всё время оглядывается, — это ещё свобода?", "Ты на воле. Осталось понять, куда бежать дальше."],
    fug: ["Каждая сирена теперь — про тебя.", "Чужое имя натирает, как чужие ботинки."],
    betray: ["Ты спас[|ла] себя. Интересно, во сколько это обошлось.", "Ты не крыса. Ты просто очень хотел[|а] домой. Так ведь?"],
    boss: ["Ты на вершине. Отсюда хорошо видно, как далеко падать.", "Тебя боятся. Когда-то ты мечтал[|а], чтобы тебя любили."],
    quit: ["Ты завязал[|а]. Кажется, впервые за годы ты спишь спокойно.", "Старый телефон выброшен. Новый звонит только по пустякам. Это прекрасно."],
    heist: ["Ты провернул[|а] дело. Сердце до сих пор стучит в ушах.", "Деньги — в одной сумке. Совесть — в другой, потяжелее."],
    wedding: ["Ну что, теперь вас двое. Не подведи.", "Ты пообещал[|а] «в горе и в радости». Радость — проще."],
    baby: ["Теперь кто-то будет смотреть на тебя снизу вверх. Постарайся оправдать.", "Маленький человек. Огромная ответственность."],
    forty: ["Сорок. Половина пути? Или уже больше?", "Сорок лет. Ты всё ещё не знаешь, кем станешь, когда вырастешь. И это нормально."],
    sixty: ["Шестьдесят. Самое время сделать то, что ты всё откладывал[|а].", "Шестьдесят. Морщины — это карта мест, где ты смеял[ся|ась]."],
    casino: ["Казино всегда выигрывает. Сегодня оно выиграло у тебя.", "Ещё одна ставка — и точно отыграешься. Так думал каждый, кто здесь проиграл."],
    rich: ["У тебя есть всё. Кроме времени, которое ушло на то, чтобы это получить.", "Роскошь быстро становится обычной. Вот это — настоящая ловушка."],
  };
  B8.voice = function (c, key, again) {
    if (!VOICE[key]) return;
    if (!again && c.flags["v_" + key]) return;
    c.flags["v_" + key] = 1;
    B8.say(c, "💭 " + R.pick(c, VOICE[key]), "c");
  };

  // ═════════════════ СЛЕДСТВИЕ И СУД ═════════════════
  const busy = (c) => c.pend.some((x) => ["inv_search", "inv_sizo", "trial", "recapture", "bail_run"].includes(x.id));
  CR.harsh = (c) => ({ US: 1.3, SG: 1.5, SA: 1.4, CN: 1.3, IR: 1.3, AE: 1.3, JP: 1.1, RU: 1.2, NO: 0.6, SE: 0.7, NL: 0.7, DE: 0.8, FI: 0.7, DK: 0.7, CH: 0.8 })[c.cur] || 1;
  CR.sentence = (c, base) => Math.max(1, Math.round(base * (1 + 0.25 * Math.min(4, c.crime.rec)) * CR.harsh(c) * (1 + (c.crime.ev || 0) / 400)));
  CR.evDesc = function (c) {
    const e = c.crime.ev || 0;
    return e < 25 ? "Улик немного — адвокаты такие дела любят." : e < 60 ? "Улик хватает." : e < 90 ? "Папка с уликами не помещается на столе." : "Улики привезли на тележке. На двух.";
  };
  CR.year = function (c) {
    const cr = c.crime;
    cr.heat *= cr.on ? 0.85 : 0.7;
    cr.ev = Math.max(0, (cr.ev || 0) - (cr.on ? 3 : 6));
    if (c.focus === "dark" && c.age >= 16) { cr.rep += cr.on ? 8 : 4; cr.heat += 5; cr.ev += 3; }
    if (cr.on) CR.rankUp(c);
    if (c.fug || c.jail) return;
    const p = Math.max(0, (cr.heat - 55) / 150) + Math.max(0, (cr.ev - 55) / 110);
    if (cr.ev >= 100 || (p > 0 && R.r(c) < p)) CR.investigate(c);
  };
  CR.investigate = function (c) {
    if (c.jail || c.fug || busy(c) || !c.alive) return;
    const cr = c.crime;
    const years = Math.round(2 + cr.ev / 16 + cr.rank * 2 + Math.min(6, c.counts.heists || 0) * 1.2);
    c.pend.unshift({ id: "inv_search", d: { years, why: cr.on ? "организованная преступность" : "серия преступлений" } });
    say(c, "Следствие собрало на тебя достаточно. Ночью у подъезда стоит незнакомая машина с выключенными фарами.", "b", "улики копились годами", true);
  };
  CR.arrest = function (c, years, why) {
    if (c.jail || !c.alive || c.fug || busy(c)) return;
    c.pend.unshift({ id: "inv_sizo", d: { years: clamp(Math.round(years), 1, 40), why } });
    say(c, `Тебя арестовали. Статья: ${why}.`, "b", "", true);
    B8.scene(c, "arrest");
    B8.voice(c, "arrest");
    c.crime.heat = Math.min(100, c.crime.heat + 10);
  };
  const VERDICT = ["{full} получил[|а] {n}. Судья был непреклонен", "Приговор по громкому делу: {full} проведёт за решёткой {n}", "{full} выслушал[|а] приговор молча. {n} — и ни днём меньше"];
  const LIFERS = ["Пожизненно: {full} проведёт остаток жизни за решёткой", "Суд приговорил {full} к пожизненному. В зале аплодировали и плакали"];
  CR.toJail = function (c, years, opt) {
    opt = opt || {};
    years = Math.max(1, Math.round(years));
    const life = !!opt.life || years >= 40;
    const cr = c.crime;
    c.jail = life ? 99 : years; cr.rec += 1; cr.heat = 10; cr.ev = Math.round((cr.ev || 0) * 0.3);
    delete c.flags.jail_ad; delete c.flags.appealed;
    c.job = null; c.school = false; c.uni = null;
    c.pr = PR.make(c, years, life, opt);
    c.focus = "p_quiet";
    if (opt.why === "кража шоколадки") c.flags.choco_jail = 1;
    if (opt.psych) { c.flags.psych = 1; say(c, "Тебя признали невменяем[ым|ой] и отправили в психиатрическую больницу на год. Сосед по палате уверен, что он Наполеон. Вы подружились.", "n", "актёрский талант", true); return; }
    B8.turn(c, life ? "пожизненный срок" : `тюрьма: ${years} ${B8.years(years)}`);
    say(c, life ? `Приговор: пожизненное заключение. Место: ${c.pr.name}.` : `Приговор: ${years} ${B8.years(years)} заключения. Место: ${c.pr.name}.`, "b", "", true);
    B8.scene(c, "prison");
    if (life) { c.flags.lifer = 1; B8.voice(c, "life"); } else B8.voice(c, "prison");
    if (life || years >= 6 || cr.on) B8.paper(c, R.pick(c, life ? LIFERS : VERDICT).replace("{n}", years + " " + B8.years(years)), "из зала суда");
    consequences(c, years, life);
  };
  function consequences(c, years, life) {
    const G = gdp(c), cr = c.crime, out = [];
    if (years >= 4 || cr.on || life) {
      const share = clamp(0.3 + years * 0.05 + (cr.on ? 0.2 : 0), 0, 0.9);
      const took = Math.max(0, c.money) * share + c.inv * share;
      c.money -= Math.max(0, c.money) * share; c.inv *= 1 - share;
      if (took > G * 0.3) out.push(B8.money(took));
      if (c.a.car && share > 0.4) { c.a.car = 0; out.push("машину"); }
      if (c.a.yacht) { c.a.yacht = 0; out.push("яхту"); }
      if (c.a.mansion && share > 0.5) { c.a.mansion = 0; out.push("особняк"); }
      if (out.length) say(c, "Конфискация: суд забрал " + out.join(", ") + ".", "b", "имущество, нажитое преступным путём", true);
    }
    if (c.biz) {
      if (cr.on || years >= 5) { say(c, `Бизнес «${c.biz.name}» арестован вместе с владельцем.`, "b", "", true); c.biz = null; }
      else { c.biz.mgr = true; say(c, `«${c.biz.name}» пока работает без тебя — с управляющим.`, "n"); }
    }
    if (c.spouse && c.spouse.alive && R.r(c) < 0.2 + Math.min(years, 15) * 0.04 + (life ? 0.3 : 0)) B8.schedule(c, "jail_spouse_leaves", 1, 2);
    if (c.kids.some((k) => k.alive && c.age - k.born >= 6 && c.age - k.born < 25)) B8.schedule(c, "p_kids_shame", 1, 3);
    if ((c.mother.alive || c.father.alive) && R.r(c) < 0.6) B8.schedule(c, "p_parents_visit", 1, 1);
    if (c.emig) { c.flags.deport = 1; say(c, "Вид на жительство аннулирован. После срока — депортация на родину.", "b"); }
    if (c.edu >= 3 && cr.rec === 1) say(c, "С судимостью дорога в юристы, полицейские и учителя закрыта.", "n");
  }

  // ═════════════════ ТЮРЬМА ═════════════════
  const PR = (B8.prison = {});
  PR.RANKS = ["новичок", "работяга", "свой", "авторитет", "смотрящий"];
  PR.RT = [0, 25, 45, 70, 90];
  PR.rankOf = (p) => { let r = 0; for (let i = 0; i < PR.RT.length; i++) if (p.resp >= PR.RT[i]) r = i; return r; };
  function colony(c) {
    const r = K(c).reg, n = R.int(c, 2, 39);
    if (["RU", "UA", "KZ", "UZ", "BY"].includes(c.cur)) return `колония №${n} «${R.pick(c, ["Берёзка", "Ромашка", "Чайка", "Солнышко", "Северная звезда"])}»`;
    if (c.cur === "US") return `тюрьма штата «${R.pick(c, ["Чёрная скала", "Тихие сосны", "Ржавый каньон", "Пять ветров"])}»`;
    if (["NO", "SE", "NL", "FI", "DK"].includes(c.cur)) return R.pick(c, ["тюрьма на острове с видом на фьорд", "тюрьма, похожая на дом отдыха", "тюрьма с собственной сауной"]);
    if (c.cur === "JP") return `исправительное учреждение «${R.pick(c, ["Сакура", "Тихий пруд", "Белый журавль"])}»`;
    if (r === "latam") return `тюрьма «${R.pick(c, ["Санта-Тереза", "Лос-Пинос", "Эль-Инфьерно", "Пуэнте-Негро", "Ла-Палома"])}»`;
    if (r === "mideast") return `тюрьма «${R.pick(c, ["Аль-Джабаль", "Пустынная звезда", "Старая крепость"])}»`;
    return `центральная тюрьма города ${c.city}`;
  }
  PR.acc = (name) => name.replace(/^колония/, "колонию").replace(/^центральная тюрьма/, "центральную тюрьму").replace(/^тюрьма, похожая/, "тюрьму, похожую").replace(/^тюрьма/, "тюрьму");
  const GANGS = { latam: ["Лос Тигрес", "Ла Эме", "Сантос"], e_europe: ["Северные", "Банные", "Клуб любителей домино"], c_asia: ["Северные", "Чайханщики"], n_america: ["Красные кеды", "Пять углов", "Клуб вязания"],
    w_europe: ["Портовые", "Ночные пекари"], east_asia: ["Белые журавли", "Тихий бамбук"], se_asia: ["Морские змеи", "Рисовые"], south_asia: ["Чайные", "Тигры Бенгалии"], africa: ["Львы", "Утренняя роса"], mideast: ["Пустынные", "Кальянщики"] };
  PR.gangName = (c) => R.pick(c, GANGS[K(c).reg] || ["Северные", "Южные"]);
  PR.make = function (c, years, life, opt) {
    const cr = c.crime;
    return { term: years, life: !!life, y: 0, name: opt && opt.psych ? "психиатрическая больница" : colony(c), resp: clamp(10 + cr.rank * 9 + (cr.rep > 150 ? 10 : 0) + (c.h > 75 ? 5 : 0), 0, 60),
      dang: clamp(20 + (c.flags.rat ? 35 : 0) + (cr.rank >= 4 ? 10 : 0), 0, 90), rank: 0, cig: 3, nood: 0, noodT: 0, gang: "", biz: "", plan: "", prep: 0, sus: 0,
      solit: 0, viol: 0, cat: "", pal: null, udo: 0, appealed: 0 };
  };
  const PBIZ = {
    noodle: ["🍜", "лапшичная под нарами", "лапша"], phone: ["📱", "прокат телефонов", "телефоны"], tattoo: ["🖋", "тату-салон в камере", "татуировки"],
    letters: ["✍️", "писарь любовных писем", "письма"], roach: ["🪳", "тараканьи бега", "ставки"], shoes: ["👟", "ремонт кроссовок", "кроссовки"],
  };
  PR.PBIZ = PBIZ;
  PR.pay = function (p, cig) {
    if (p.cig >= cig) { p.cig -= cig; return true; }
    const need = cig - p.cig;
    if (p.nood * 2 >= need) { p.nood -= Math.ceil(need / 2); p.cig = 0; return true; }
    return false;
  };
  PR.can = (p, cig) => p.cig + p.nood * 2 >= cig;
  const PLAN = {
    spoon: ["🥄", "подкоп ложкой", 22, 0.66, 0.1],
    laundry: ["🧺", "фургон с бельём", 34, 0.52, 0.06],
    guard: ["👮", "форма охранника", 40, 0.44, 0.05],
    sick: ["🤒", "побег из больницы", 30, 0.46, 0.05],
    cake: ["🎂", "напильник в торте", 100, 0.24, 0],
    heli: ["🚁", "вертолёт", 100, 0.56, 0],
  };
  PR.PLAN = PLAN;
  const DANGER = ["В душевой на тебя напали трое. Ты отбил[ся|ась], но неделю провёл[|а] в лазарете.", "Ночью кто-то вылил на твою койку ведро холодной воды. Предупреждение понято.",
    "Тебя толкнули на лестнице. «Случайно». Синяки — по-настоящему.", "Драка подносами в столовой. Ты оказал[ся|ась] в самой гуще."];
  CR.jailYear = function (c) {
    const p = c.pr || (c.pr = PR.make(c, c.jail, false));
    p.y += 1; c.jailTot = (c.jailTot || 0) + 1;
    const f = c.focus;
    if (f === "p_resp") { p.resp += 7; p.dang += 4; c.h += 1; }
    else if (f === "p_study") {
      c.iq += 3 * (1 - c.iq / 125);
      if (c.edu < 2 && p.y >= 2 && R.r(c) < 0.4) { c.edu = 2; say(c, "Ты получил[|а] школьный аттестат прямо в тюрьме. Учительница плакала, конвоир тоже.", "g", "фокус на учёбе", true); }
      else if (c.edu === 2 && p.y >= 4 && R.r(c) < 0.25) { c.edu = 3; say(c, "Заочный диплом получен — за решёткой. Первый в истории этой тюрьмы.", "g", "фокус на учёбе", true); }
    } else if (f === "p_work") { p.cig += R.int(c, 8, 15); c.sk += 1; }
    else if (f === "p_quiet") { p.dang -= 8; p.viol = Math.max(0, p.viol - 1); c.st -= 4; }
    else if (f === "p_biz") p.dang += 3;
    else if (f === "p_escape") { p.prep += p.plan ? PLAN[p.plan][2] * (0.8 + R.r(c) * 0.4) : 6; if (p.plan) p.sus += 6; }
    if (p.biz) {
      const boost = f === "p_biz" ? 2 : 1, x = R.int(c, 4, 10) * boost;
      if (p.biz === "noodle") { p.nood += x; p.noodT += x; if (p.noodT >= 100) c.flags.noodle = 1; } else p.cig += x + (p.biz === "letters" ? Math.round(c.iq / 20) : 0);
      if (p.biz === "phone" || p.biz === "roach") p.dang += 3;
    }
    if (p.gang) { p.resp += 3; p.dang += 3; }
    p.dang += (25 - p.dang) * 0.15 - p.rank * 2;
    p.resp -= 1;
    p.resp = clamp(p.resp); p.dang = clamp(p.dang); p.prep = clamp(p.prep, 0, 100); p.sus = clamp(p.sus);
    const nr = PR.rankOf(p);
    if (nr !== p.rank) {
      const up = nr > p.rank; p.rank = nr;
      say(c, up ? `Твоё положение в тюрьме выросло: теперь ты — ${PR.RANKS[nr]}.` : `Положение пошатнулось: теперь ты — ${PR.RANKS[nr]}.`, up ? "g" : "b", "уважение", up && nr >= 3);
      if (up && nr === 4) { c.flags.watcher = 1; B8.turn(c, "смотрящий"); B8.paper(c, "В {city} заключённый навёл в тюрьме такой порядок, что охрана просит совета", "тюремная хроника"); }
    }
    if (R.r(c) < p.dang / 260) { c.h -= R.int(c, 6, 18); c.hit = "тюрьма"; say(c, R.pick(c, DANGER), "b", "опасность в тюрьме"); }
    if (p.plan && p.prep > 0 && PLAN[p.plan][4] && R.r(c) < PLAN[p.plan][4] + p.sus / 400 + p.dang / 600) {
      say(c, p.plan === "spoon" ? "Охрана нашла подкоп за плакатом. Годы работы ложкой — впустую. Тебя на месяц отправили в карцер." : "Охрана раскрыла план побега. Месяц в карцере и усиленный надзор.", "b", "подозрения охраны", true);
      p.prep = 0; p.sus = 0; p.solit += 1; p.viol += 1; p.dang += 10; c.st += 10;
      if (!p.life) c.jail += 1;
    } else if (p.plan && p.prep >= 100 && !c.pend.some((x) => x.id === "escape_night")) c.pend.push({ id: "escape_night", d: {} });
    if (!p.life && !p.udo && p.y >= Math.ceil(p.term / 2) && c.jail >= 2 && p.viol === 0) { p.udo = 1; c.pend.push({ id: "p_udo", d: {} }); }
    if (!p.life) c.jail -= 1;
    if (c.jail <= 0) PR.release(c, "срок закончился");
  };
  PR.release = function (c, why) {
    const p = c.pr || {};
    c.jail = 0;
    c.prLast = { rank: p.rank || 0, y: p.y || 0, name: p.name || "" };
    c.pr = null;
    say(c, "Ты выш[ел|ла] на свободу. Воздух пахнет иначе.", "g", why || "срок закончился", true);
    B8.scene(c, "release");
    B8.turn(c, "освобождение");
    c.flags.ex_con = 1; c.flags.parole = c.age + 3;
    if (c.flags.deport && c.emig) {
      c.cur = c.cc; c.emig = false; c.adapt = 0; c.city = K(c).cities[0]; delete c.flags.deport;
      say(c, `Сразу после освобождения тебя депортировали на родину — ${K(c).n}. Чемодан, самолёт, незнакомый аэропорт.`, "b", "судимость у эмигранта", true);
      B8.turn(c, "депортация");
    }
    const pet = (c.pets || []).find((x) => x.alive);
    if (pet) say(c, B8.fmt(c, `${pet.n} узнал[[|а]] тебя с первого взгляда. Кажется, только ${pet.g === "f" ? "она" : "он"} не задаёт вопросов.`, { ps: pet.g }), "g");
    B8.voice(c, "release");
    c.focus = B8.defFocus(c);
  };
  PR.groups = function (c, it) {
    const p = c.pr || (c.pr = PR.make(c, c.jail, false));
    const g1 = [it("j_gym", "🏋️", "Качалка", "Здоровье↑ Уважение↑"), it("j_study", "📚", "Библиотека и заочка", "Ум↑"), it("j_work", "🧵", "Мастерская", "🚬 +10"),
      it("j_chapel", "🕯", c.rel !== "none" ? "Тюремная часовня" : "Тюремный психолог", "Стресс↓"), it("j_theatre", "🎭", "Тюремный театр", "Счастье↑ Люди↑")];
    const g2 = [it("j_biz", PBIZ[p.biz] ? PBIZ[p.biz][0] : "🍜", p.biz ? "Своё дело: " + PBIZ[p.biz][1] : "Открыть своё дело", p.biz ? "доход в 🍜 и 🚬" : "лапша, телефоны, татуировки…"),
      it("j_gang", "🤝", p.gang ? "Дела банды «" + p.gang + "»" : "Прибиться к банде", "Уважение↑ Опасность↑"), it("j_fight", "👊", "Отстоять место у окна", "Уважение↑ или лазарет"),
      it("j_guard", "💰", "Подкупить охрану", "🚬 20 · Опасность↓", PR.can(p, 20), "нужно 🚬 20")];
    if (p.rank >= 3) g2.push(it("j_judge", "⚖️", "Рассудить спор в блоке", "Уважение↑"));
    const g3 = [it("j_phone", "📞", "Позвонить домой", "🚬 5", PR.can(p, 5), "нужно 🚬 5"),
      it("j_letter", "💌", p.pal ? "Письмо: " + p.pal.n.split(" ")[0] : g(c, "Написать письмо незнакомке", "Написать письмо незнакомцу"), p.pal ? "переписка " + p.pal.k + "/3" : "вдруг ответят"),
      it("j_appeal", "⚖️", "Подать апелляцию", p.life ? "пожизненное — почти без шансов" : "шанс скостить срок", !p.appealed, "уже подавал[|а]")];
    if (!p.cat) g3.push(it("j_cat", "🐈", "Подкормить тюремного кота", "вдруг подружитесь"));
    if (B8.platform && B8.platform.hasAds() && !p.life && c.jail > 1 && !c.flags.jail_ad) g3.push(it("j_rew", "📺", "Примерное поведение", "−1 год срока за рекламу"));
    const g4 = [{ id: "j_escape", icon: p.plan ? PLAN[p.plan][0] : "🕳", label: p.plan ? "Побег: " + PLAN[p.plan][1] : "Спланировать побег", hint: p.plan ? "готовность " + Math.round(p.prep) + "% · охрана подозревает " + Math.round(p.sus) + "%" : "6 способов. Риск — огромный", ok: true, why: "" }];
    if (p.plan === "spoon") g4.push(it("j_dig", "⛏", "Копать подкоп", "мини-игра: не попадись"));
    return [["Камера", g1], ["Порядки", g2], ["Связь с волей", g3], ["Побег", g4]];
  };
  const pr = (c) => c.pr || (c.pr = PR.make(c, c.jail || 1, false));
  ACT.j_gym = (c) => { const p = pr(c); c.h += 4; p.resp += 4; return res(c, R.pick(c, ["Качалка из самодельных гирь. Через месяц на тебя смотрят иначе.", "Сто отжиманий каждое утро. Сокамерники начали считать вслух.", "Ты поднял[|а] штангу, которую до тебя поднимал только «Шкаф» из третьего блока. Шкаф пожал тебе руку."]), "g"); };
  ACT.j_study = (c) => { c.iq += 4; if (c.edu < 2 && R.r(c) < 0.3) { c.edu = 2; return res(c, "Ты получил[|а] аттестат прямо в тюрьме.", "g", true); } return res(c, R.pick(c, ["Ты читаешь всё из тюремной библиотеки. Даже энциклопедию на букву «К».", "Заочный курс экономики. Преподаватель удивлён: твои работы — лучшие на потоке.", "Ты выучил[|а] три языка у сокамерников. Ругаться — на всех трёх."]), "g"); };
  ACT.j_work = (c) => { const p = pr(c); const x = R.int(c, 8, 12); p.cig += x; return res(c, `Ты шил[|а] рукавицы в мастерской. Заработано: 🚬 ${x}. Время идёт быстрее.`, "n"); };
  ACT.j_chapel = (c) => { c.st -= 10; c.hap += 3; return res(c, c.rel !== "none" ? R.pick(c, ["В тюремной часовне тихо. Впервые за долгое время ты говоришь честно — хоть и не вслух.", "Капеллан выслушал тебя и не сказал ни слова осуждения. Этого хватило."]) : R.pick(c, ["Психолог спросил, что ты чувствуешь. Ты говорил[|а] час. Он не перебивал.", "Психолог дал тебе тетрадь: «Пишите письма себе на волю». Ты пишешь."]), "g"); };
  ACT.j_theatre = (c) => { c.hap += 5; c.soc += 4; const p = pr(c); p.resp += 1; return res(c, R.pick(c, ["Тюремный театр ставит «Ромео и Джульетту». Тебе досталась роль балкона. Ты справил[ся|ась] блестяще.", "Ты сыграл[|а] короля в тюремной пьесе. Зал из ста заключённых стоя аплодировал. Охрана тоже.", "Спектакль о побеге. Начальник тюрьмы смотрел очень внимательно и делал заметки."]), "g"); };
  ACT.j_biz = (c) => (pr(c).biz ? bizRun(c) : { open: "decide:p_bizpick" });
  function bizRun(c) {
    const p = pr(c), x = R.int(c, 6, 14);
    if (p.biz === "noodle") { p.nood += x; p.noodT += x; if (p.noodT >= 100) c.flags.noodle = 1; return res(c, `Лапша на кипятильнике расходится, как горячие пирожки. Выручка: 🍜 ${x}.`, "g"); }
    p.cig += x;
    if (p.biz === "phone") { p.dang += 4; return res(c, `Прокат телефонов: минута — сигарета. Выручка: 🚬 ${x}. Охрана косится.`, "g"); }
    if (p.biz === "tattoo") { const t = R.pick(c, ["дельфина", "маму", "надпись «не забуду»", "карту побега (шутка)", "бабочку на шее у самого страшного соседа"]); return res(c, `Ты набил[|а] клиенту ${t}. Оплата: 🚬 ${x}.`, "g"); }
    if (p.biz === "letters") { return res(c, `Ты пишешь любовные письма за сокамерников. Три жены уже растроганы. Оплата: 🚬 ${x}.`, "g"); }
    if (p.biz === "roach") { if (R.r(c) < 0.3) { p.dang += 8; return res(c, "Таракан-фаворит по кличке Молния сошёл с дистанции. Проигравшие требуют вернуть сигареты.", "b"); } return res(c, `Тараканьи бега собрали весь блок. Ты — букмекер. Выручка: 🚬 ${x}.`, "g"); }
    return res(c, `Ты починил[|а] полблока кроссовок. Оплата: 🚬 ${x}.`, "g");
  }
  ACT.j_gang = (c) => {
    const p = pr(c);
    if (!p.gang) return { open: "decide:p_gangjoin" };
    p.resp += 6; p.dang += 6;
    if (R.r(c) < 0.3) { c.h -= 8; return res(c, `Банда «${p.gang}» поссорилась с соседним блоком. Ты был[|а] в первом ряду.`, "b"); }
    return res(c, R.pick(c, [`Банда «${p.gang}» доверила тебе раздачу сигарет на неделю. Почёт и ответственность.`, `С «${p.gang}» ты провернул[|а] обмен: три пачки чая на окно с видом на двор.`, `Старший банды «${p.gang}» назвал тебя «надёжным». Здесь это почти орден.`]), "g");
  };
  ACT.j_fight = (c) => {
    const p = pr(c), win = R.r(c) < 0.4 + (c.h - 50) / 200 + p.resp / 400;
    if (win) { p.resp += 9; p.dang += 2; return res(c, "Ты отстоял[|а] место у окна. Теперь по утрам у тебя есть солнце. И уважение.", "g"); }
    c.h -= 10; p.resp -= 3; p.viol += 1; c.hit = "тюрьма"; return res(c, "Драка за место у окна закончилась лазаретом. Окно досталось другому. В личном деле — замечание.", "b");
  };
  ACT.j_guard = (c) => { const p = pr(c); if (!PR.pay(p, 20)) return res(c, "Не хватает сигарет.", "b"); p.dang -= 15; c.hap += 3; return res(c, R.pick(c, ["Охранник взял блок сигарет и теперь «не видит» твою кипятильную плитку.", "За двадцать сигарет охранник перевёл тебя в камеру потише. Соседи — двое бухгалтеров.", "Охранник принёс тебе свежую газету и булочку. Ты чуть не расплакал[ся|ась]."]), "g"); };
  ACT.j_judge = (c) => { const p = pr(c); p.resp += 6; p.cig += 5; return res(c, R.pick(c, ["Два соседа спорили, чья очередь мыть пол. Ты рассудил[|а] так мудро, что они помирились и вымыли вместе.", "Спор о пропавшей лапше. Ты нашёл[|ла] виновника — им оказалась тюремная крыса. Настоящая."]).replace("нашёл[|ла]", "наш[ёл|ла]"), "g"); };
  ACT.j_phone = (c) => { const p = pr(c); if (!PR.pay(p, 5)) return res(c, "Не хватает сигарет.", "b"); c.hap += 5; c.st -= 5; const who = c.mother.alive ? "маме" : c.spouse && c.spouse.alive ? (c.spouse.sex === "f" ? "жене" : "мужу") : "старому другу"; return res(c, `Ты позвонил[|а] ${who}. Пять минут, плохая связь — и голос, от которого внутри теплеет.`, "g"); };
  ACT.j_letter = (c) => {
    const p = pr(c);
    if (!p.pal) { const s = c.sex === "m" ? "f" : "m"; p.pal = { n: B8.personName(c, s), s, k: 1 }; return res(c, B8.fmt(c, `Ты написал[|а] письмо в клуб знакомств «Сердце за решёткой». Ответил[[|а]] ${p.pal.n}. Почерк красивый, вопросы — смешные.`, { ps: s }), "g"); }
    p.pal.k += 1; c.hap += 3;
    if (p.pal.k >= 3 && !(c.spouse && c.spouse.alive)) return { open: "decide:p_wedding" };
    if (c.spouse && c.spouse.alive) return res(c, B8.fmt(c, `Переписка с ${p.pal.n.split(" ")[0]} — дружеская: ты же в браке. Но письма всё равно ждёшь.`, { ps: p.pal.s }), "n");
    return res(c, B8.fmt(c, `Новое письмо от ${p.pal.n.split(" ")[0]}. На конверте нарисовано сердце. Сокамерники завидуют.`, { ps: p.pal.s }), "g");
  };
  ACT.j_appeal = (c) => {
    const p = pr(c); p.appealed = 1; c.flags.appealed = 1;
    if (!p.life && R.r(c) < 0.22) { c.jail = Math.max(1, Math.floor(c.jail / 2)); return res(c, "Апелляцию удовлетворили: срок сократили вдвое!", "g", true); }
    if (p.life && R.r(c) < 0.05) { p.life = false; c.jail = 20; p.term = 20; return res(c, "Чудо: пожизненное заменили на двадцать лет. Впервые за годы ты считаешь дни.", "g", true); }
    return res(c, "В апелляции отказали. Адвокат прислал письмо: «Не сдавайтесь». И счёт.", "b");
  };
  ACT.j_cat = (c) => {
    const p = pr(c);
    if (R.r(c) < 0.55) { p.cat = R.pick(c, ["Срок", "Конвой", "Адвокат", "Шнырь", "Барон", "Тапок"]); c.hap += 6; return res(c, `Тюремный кот по кличке ${p.cat} теперь спит у тебя в ногах. Самый свободный житель этой тюрьмы.`, "g"); }
    return res(c, "Кот съел твою кашу, посмотрел свысока и ушёл к соседу. Кошки и в тюрьме кошки.", "n");
  };
  ACT.j_escape = (c) => (pr(c).plan ? { open: "decide:escape_status" } : { open: "decide:escape_plan" });
  ACT.j_dig = (c) => ({ open: "mg:dig" });
  // результат мини-игры «подкоп»: score 0–3, noise 0–3
  PR.dig = function (c, score, noise) {
    const p = pr(c);
    p.prep = clamp(p.prep + 6 + score * 6, 0, 100);
    p.sus = clamp(p.sus + noise * 9);
    if (noise >= 3 && R.r(c) < 0.5) { p.prep = Math.max(0, p.prep - 30); p.sus += 15; p.viol += 1; return res(c, "Охранник услышал стук ложки. Ты сделал[|а] вид, что ешь суп. В три часа ночи. Не поверили.", "b"); }
    if (p.prep >= 100 && !c.pend.some((x) => x.id === "escape_night")) c.pend.push({ id: "escape_night", d: {} });
    return res(c, score >= 2 ? `Ты копал[|а] всю ночь. Подкоп готов на ${Math.round(p.prep)}%. Ложка стёрлась наполовину.` : `Работа шла медленно: охрана ходила мимо слишком часто. Подкоп — ${Math.round(p.prep)}%.`, score >= 2 ? "g" : "n");
  };
  // попытка побега: true — удалось
  PR.attempt = function (c, bonus) {
    const p = pr(c), pl = PLAN[p.plan] || PLAN.spoon;
    const pc = clamp(pl[3] + (p.prep - 100) / 400 + (c.luck - 50) / 500 + (p.rank >= 3 ? 0.08 : 0) - p.dang / 500 - p.sus / 500 + (bonus || 0), 0.05, 0.9);
    if (R.r(c) < pc) { escapeWin(c); return true; }
    escapeFail(c); return false;
  };
  PR.chance = (c, bonus) => { const p = pr(c), pl = PLAN[p.plan] || PLAN.spoon; return clamp(pl[3] + (p.prep - 100) / 400 + (c.luck - 50) / 500 + (p.rank >= 3 ? 0.08 : 0) - p.dang / 500 - p.sus / 500 + (bonus || 0), 0.05, 0.9); };
  const ESC_TXT = {
    spoon: "Последний ком земли — и над головой звёзды. Ты вылез[|ла] в огороде за забором тюрьмы. Ложку ты сохранил[|а] на память.",
    laundry: "Ты лежал[|а] под горой простыней, пока фургон проезжал ворота. Пахло хлоркой и свободой.",
    guard: "В форме охранника ты прош[ёл|ла] через три поста. На последнем тебе даже отдали честь.",
    sick: "Из тюремной больницы ты уш[ёл|ла] через окно туалета, в больничной рубашке и одном тапке.",
    cake: "В мамином торте был напильник. Решётка сдалась за три ночи. Торт был вкусный.",
    heli: "В полдень над прогулочным двором завис вертолёт. Верёвочная лестница, крики охраны — и город остался внизу.",
  };
  const ESC_HEAD = {
    spoon: "Побег века: заключённ[ый|ая] прорыл[|а] подкоп столовой ложкой", laundry: "Бегл[ец|янка] уехал[|а] из тюрьмы в фургоне с грязным бельём",
    guard: "Охрана отдала честь бегл[ецу|янке] в своей же форме", sick: "Из тюремной больницы сбежал[|а] пациент[|ка] в одном тапке",
    cake: "Классика: напильник в торте снова сработал", heli: "Вертолёт над тюрьмой: дерзкий побег средь бела дня",
  };
  function escapeWin(c) {
    const p = pr(c), plan = p.plan || "spoon";
    say(c, ESC_TXT[plan], "g", "план побега", true);
    B8.scene(c, plan === "heli" ? "heli" : "escape");
    if (plan === "spoon") c.flags.esc_spoon = 1;
    if (plan === "heli") c.flags.esc_heli = 1;
    const cat = p.cat;
    FG.start(c, plan, {});
    B8.paper(c, ESC_HEAD[plan], "срочно в номер");
    B8.voice(c, "escape");
    if (cat) c.pend.push({ id: "cat_back", d: { cat } });
  }
  function escapeFail(c) {
    const p = pr(c);
    say(c, R.pick(c, ["Прожектор поймал тебя на заборе. Сирены, собаки и очень долгий разговор с начальником.", "Ты почти уш[ёл|ла], но споткнул[ся|ась] о спящего охранника. Он проснулся.", "План был идеальным. Кроме одной детали: в эту ночь сменили замки."]), "b", "побег провалился", true);
    if (!p.life) c.jail += 3;
    p.plan = ""; p.prep = 0; p.sus = 0; p.solit += 1; p.viol += 1; p.dang += 10; p.resp += 5; c.h -= 6; c.st += 12;
  }
  PR.escFail = escapeFail;
  PR.win = escapeWin;
  PR.colony = colony;
  PR.chanceFor = function (c, plan) { const p = pr(c), kp = p.plan, kq = p.prep; p.plan = plan; if (PLAN[plan][2] >= 100) p.prep = 100; const x = PR.chance(c, 0); p.plan = kp; p.prep = kq; return x; };

  // ═════════════════ В БЕГАХ ═════════════════
  const FG = (B8.fug = {});
  FG.start = function (c, how, opt) {
    opt = opt || {};
    const p = c.pr;
    const left = p ? (p.life ? 99 : c.jail) : opt.years || 3;
    if (c.jail) { c.prLast = { rank: p ? p.rank : 0, y: p ? p.y : 0, name: p ? p.name : "" }; c.jail = 0; c.pr = null; }
    c.fug = { y: 0, wanted: clamp(opt.wanted || (p && p.life ? 90 : 72)), docs: 0, face: 0, abroad: "", left, life: !!(p && p.life), how };
    c.job = null;
    if (c.biz) { say(c, `Бизнес «${c.biz.name}» конфисковали: владелец в розыске.`, "b"); c.biz = null; }
    if (c.crime.on) { c.crime.on = false; }
    c.crime.heat = 90;
    c.flags.fugitive = 1;
    if (c.fug.wanted >= 90) c.flags.wanted90 = 1;
    B8.turn(c, "побег");
    c.focus = "f_hide";
    say(c, "Теперь ты в розыске. Твоё лицо — на плакатах «Разыскивается» по всей стране.", "b", "", true);
    B8.scene(c, "wanted");
  };
  FG.year = function (c) {
    const f = c.fug;
    if (!f) return;
    f.y += 1;
    const foc = c.focus;
    f.wanted += foc === "f_hide" ? -14 : foc === "f_live" ? 6 : -5;
    if (foc === "f_live") { c.hap += 6; c.st -= 6; }
    if (foc === "f_hide") { c.st += 3; c.soc -= 2; }
    f.wanted = clamp(f.wanted);
    if (f.wanted >= 90) c.flags.wanted90 = 1;
    const catchP = (f.wanted / 260) * (f.docs ? 0.5 : 1) * (f.face ? 0.6 : 1) * (f.abroad ? 0.6 : 1);
    if (R.r(c) < catchP) { FG.capture(c, R.pick(c, ["Тебя узнала кассирша в супермаркете. Она смотрит телешоу «Их разыскивают».", "Охотник за головами выследил тебя по чеку из кафе.", "Тебя выдал сосед — за награду купил себе газонокосилку."])); return; }
    if (!f.life && f.y >= 12 && f.wanted < 25) {
      c.fug = null; c.flags.statute = 1; c.crime.heat = 0; c.crime.ev = 0;
      say(c, "Срок давности истёк. Дело закрыли, плакаты сняли. Ты — снова ты.", "g", "двенадцать лет в бегах", true);
      B8.turn(c, "срок давности");
      B8.paper(c, "Срок давности истёк: бегл[ец|янка] из громкого дела официально свобод[ен|на]", "из архива полиции");
    }
  };
  FG.capture = function (c, why) {
    const f = c.fug;
    if (!f) return;
    c.fug = null;
    say(c, why, "b", "розыск", true);
    B8.scene(c, "arrest");
    B8.paper(c, R.pick(c, ["Бегл[ец|янка] пойман[|а]: {full} снова за решёткой", "Погоня окончена: полиция задержала {full}", "{full} пойман[|а]. Полиция просит больше не выкладывать селфи"]), "криминальная хроника");
    c.pend.unshift({ id: "recapture", d: { left: f.left, life: f.life } });
  };
  FG.groups = function (c, it) {
    const f = c.fug, G = gdp(c);
    const run = [{ id: "f_poster", icon: "🚨", label: "Плакат «Разыскивается»", hint: "розыск " + Math.round(f.wanted) + "%", ok: true, why: "" },
      it("f_docs", "🪪", f.docs ? "Документы есть" : "Фальшивые документы", B8.money(G * 0.6), !f.docs && c.money >= G * 0.6, f.docs ? "уже есть" : "нужно " + B8.money(G * 0.6)),
      it("f_face", "💉", "Подпольная пластика", B8.money(G * 1.2), !f.face && c.money >= G * 1.2, f.face ? "уже сделана" : "нужно " + B8.money(G * 1.2)),
      it("f_abroad", "✈️", f.abroad ? "Сменить страну" : "Бежать за границу", f.docs ? "с документами — проще" : "без документов — рискованно"),
      it("f_selfie", "🤳", "Выложить селфи", "подписчики↑ розыск↑"),
      it("f_mom", "📞", "Позвонить маме", "Счастье↑ Розыск↑", c.mother.alive, "мамы нет"),
      it("f_surrender", "🏳", "Сдаться полиции", "меньше срок")];
    const me = [it("meditate", "🧘", "Медитация", "Стресс↓"), it("gym", "🏃", "Пробежка в капюшоне", "Здоровье↑")];
    if (c.rel !== "none") me.push(it("pray", "🕯", "Сходить: " + B8.temple(c), "Стресс↓"));
    const lv = [];
    if (c.spouse && c.spouse.alive) lv.push(it("spouse", "❤️", "Тайная встреча с " + (c.spouse.sex === "f" ? "женой" : "мужем"), "Отношения↑"));
    if (c.kids.some((k) => k.alive)) lv.push(it("kids", "🧒", "Увидеть детей издалека", "Счастье↑"));
    if ((c.pets || []).some((p) => p.alive)) lv.push(it("petplay", "🐾", "Время с питомцем", "Стресс↓"));
    lv.push(it("lottery", "🎟", "Лотерейный билет", B8.money(G * 0.002), c.money > G * 0.002, ""));
    return [["В бегах", run], ["Я", me], ["Жизнь", lv]];
  };
  const fug = (c) => c.fug;
  ACT.f_docs = (c) => {
    const f = fug(c), G = gdp(c); c.money -= G * 0.6;
    if (R.r(c) < 0.72) { f.docs = 1; f.wanted = clamp(f.wanted - 15); return res(c, `Новый паспорт на имя «${B8.personName(c, c.sex)}». Фото — твоё, подпись — чужая, жизнь — снова твоя.`, "g"); }
    f.wanted = clamp(f.wanted + 8); return res(c, "Продавец документов исчез с деньгами. В паспорте, который он оставил, — фото кота.", "b");
  };
  ACT.f_face = (c) => {
    const f = fug(c), G = gdp(c); c.money -= G * 1.2;
    if (R.r(c) < 0.75) { f.face = 1; f.wanted = clamp(f.wanted - 25); c.looks += R.int(c, -5, 12); if (c.look) c.look.scar = 1; return res(c, "Подпольный хирург сделал тебе новое лицо. Мама бы не узнала. Это и пугает.", "g"); }
    f.wanted = clamp(f.wanted + 10); c.looks -= 8; return res(c, "Хирург перестарался: теперь ты похож[|а] на известного актёра. На улице просят автограф. Это хуже, чем розыск.", "b");
  };
  ACT.f_abroad = (c) => {
    const f = fug(c);
    const cand = B8.COUNTRIES.filter((x) => x.c !== c.cur && x.hdi < 0.85 && x.pop > 5);
    const d = R.pick(c, cand);
    if (R.r(c) < 0.45 + (f.docs ? 0.35 : 0) + (c.luck - 50) / 400) {
      c.cur = d.c; c.city = d.cities[0]; c.urban = true; c.emig = true; c.adapt = 3; f.abroad = d.c; f.wanted = clamp(f.wanted - 30);
      B8.turn(c, "бегство: " + d.n);
      return res(c, `Ты пересёк[|ла] границу ${f.docs ? "по чужому паспорту" : "ночью, на рыбацкой лодке"}. Новая страна — ${d.n}. Здесь тебя никто не ищет. Пока.`, "g", true);
    }
    FG.capture(c, "На границе пограничник сравнил твоё лицо с плакатом. Совпало.");
    return { text: "", kind: "b" };
  };
  ACT.f_selfie = (c) => { const f = fug(c); f.wanted = clamp(f.wanted + 18); c.sm.f += R.int(c, 200, 5000) * (1 + c.sm.f / 20000); c.hap += 3; return res(c, R.pick(c, ["Селфи на пляже с геотегом. Через час полиция знала, где ты обедаешь.", "Ты выложил[|а] фото в тёмных очках и с усами. Мама узнала тебя по ушам. И не только мама.", "Пост «Скучаю по дому» собрал тысячи лайков. Один — от следователя."]), "n"); };
  ACT.f_mom = (c) => { const f = fug(c); f.wanted = clamp(f.wanted + 9); c.hap += 7; c.st -= 6; return res(c, R.pick(c, ["Мама плакала и спрашивала, ешь ли ты нормально. Ты соврал[|а], что ешь.", "Мама сказала: «Я всегда знала, что ты не такой». Потом добавила: «Но ты именно такой». И всё равно любит.".replace("не такой", g(c, "не такой", "не такая")).replace("именно такой", g(c, "именно такой", "именно такая"))]), "g"); };
  ACT.f_surrender = (c) => { const f = fug(c); c.fug = null; say(c, "Ты приш[ёл|ла] в полицию сам[|а]. Дежурный долго не верил и попросил показать плакат.", "n", "", true); c.pend.unshift({ id: "recapture", d: { left: Math.max(1, Math.round(f.left * 0.7)), life: f.life, self: 1 } }); return { text: "", kind: "n" }; };

  // ═════════════════ ОГРАБЛЕНИЯ ═════════════════
  const H = (B8.heist = {});
  // id, название, ярус, добыча [от, до] (в ВВП на душу), сложность, улики, нужна репутация, винительный, родительный
  const TG = [
    ["jewel", "Ювелирный магазин", 1, [1.5, 5], 0, 22, 0, "ювелирный магазин", "ювелирного магазина"],
    ["armored", "Инкассаторская машина", 2, [3, 10], 0.05, 30, 15, "инкассаторскую машину", "инкассаторской машины"],
    ["casino", "Касса казино", 2, [6, 20], 0.1, 32, 30, "кассу казино", "кассы казино"],
    ["bank", "Банк", 3, [10, 35], 0.12, 40, 50, "банк", "банка"],
    ["museum", "Музей: знаменитая картина", 3, [15, 45], 0.12, 36, 60, "картину из музея", "музея"],
    ["train", "Поезд с ценностями", 3, [12, 40], 0.15, 38, 70, "поезд с ценностями", "поезда с ценностями"],
    ["century", "Дело века", 4, [60, 180], 0.22, 55, 160, "", ""],
  ];
  H.TG = TG;
  const CENTURY = {
    BR: "Подкоп под хранилище Центробанка через соседнюю пиццерию", MX: "Угнать «золотой поезд» с выручкой всех казино страны", CO: "Вывезти изумруды из подземного хранилища",
    US: "Ограбить хранилище с золотым запасом. Или хотя бы его сувенирную лавку", GB: "Увести королевские драгоценности. Или королевский чайник", FR: "Вынести самую знаменитую улыбку мира из музея. Снова",
    IT: "Украсть фонтан. Вместе с монетками", JP: "Ограбить сокровищницу патинко-короля", CN: "Вынести нефритовые печати из императорского хранилища", RU: "Ограбить инкассаторский поезд через всю страну",
    IN: "Выкрасть алмаз размером с кулак из сокровищницы махараджи", EG: "Вскрыть гробницу фараона, которую ещё не нашли учёные", DE: "Взломать хранилище Бундесбанка", CH: "Вскрыть швейцарский сейф с золотом ста стран",
    NG: "Ограбить нефтяного принца на его же свадьбе", ZA: "Угнать вагон с алмазами прямо с рудника", AU: "Ограбить казино на круизном лайнере", CA: "Увести стратегический запас кленового сиропа",
    AR: "Ограбить банк через канализацию, как в легенде", TR: "Вынести сокровища султана из дворца-музея", KR: "Взломать хранилище корпорации-гиганта", ES: "Ограбить монетный двор и напечатать себе денег",
    PE: "Найти и вывезти золото инков", TH: "Увести изумрудного Будду. Ну, его копию за миллионы", ID: "Ограбить плавучее казино у острова", PH: "Увести яхту с золотом бывшего диктатора",
  };
  const centuryName = (c) => CENTURY[c.cur] || `Ограбить национальный банк страны: ${K(c).n}`;
  H.targets = function (c) {
    const cr = c.crime, n = c.counts.heists || 0;
    return TG.map((t) => {
      const name = t[0] === "century" ? centuryName(c) : t[1];
      let ok = cr.rep >= t[6] || cr.rank >= t[2] - 1 || n >= t[2] - 1;
      if (t[0] === "century") ok = cr.rep >= t[6] || cr.rank >= 3 || n >= 2;
      if (t[0] === "casino" && K(c).cas === "B") return null;
      return { id: t[0], n: name, tier: t[2], ok, why: ok ? "" : "нужна репутация " + t[6] + " или опыт", loot: [gdp(c) * t[3][0], gdp(c) * t[3][1]] };
    }).filter(Boolean);
  };
  H.ROLES = [["hacker", "💻", "Хакер"], ["driver", "🚗", "Водитель"], ["muscle", "💪", "Громила"], ["inside", "🕵", "Свой человек"]];
  const TRAITS = {
    hacker: [["бывш[[ий|ая]] сисадмин банка", 1, 0.05], ["взламывает всё, кроме своего холодильника", 0, 0.05], ["носит шапочку из фольги «от слежки»", 0, 0.02],
      ["печатает двумя пальцами, зато очень быстро", 0, 0.06], ["слишком много болтает в соцсетях", 1, 0.3], ["сбежал[[|а]] с урока информатики и не вернул[[ся|ась]]", -1, 0.12]],
    driver: [["бывш[[ий|ая]] гонщи[[к|ца]] ралли", 1, 0.05], ["двадцать лет водил[[|а]] такси и знает все дворы", 1, 0.04], ["права купил[[|а]] позавчера", -2, 0.05],
      ["ездит только под музыку восьмидесятых", 0, 0.03], ["однажды угнал[[|а]] машину у полицейского", 0, 0.15], ["очень любит хвастаться в баре", 0, 0.3]],
    muscle: [["бывш[[ий|ая]] борец, чемпион региона", 1, 0.05], ["огромн[[ый|ая]] и добр[[ый|ая]], плачет на мелодрамах", 0, 0.03], ["пугает одним взглядом", 1, 0.06],
      ["носит с собой гантелю «на всякий случай»", 0, 0.05], ["долж[[ен|на]] денег половине города", 0, 0.28], ["бывш[[ий|ая]] вышибала ночного клуба", 0, 0.06]],
    inside: [["охранни[[к|ца]] с долгами по ипотеке", 1, 0.15], ["уборщи[[к|ца]], знающ[[ий|ая]] все коды", 1, 0.08], ["стажёр, ненавидящ[[ий|ая]] начальство", 0, 0.1],
      ["бывш[[ий|ая]] сотрудни[[к|ца]], уволенн[[ый|ая]] под Новый год", 1, 0.12], ["слишком честн[[ый|ая]] для этого дела", -1, 0.35]],
  };
  function cand(c, role) {
    const s = R.chance(c, 0.68) ? "m" : "f";
    const tr = R.pick(c, TRAITS[role]);
    const sk = clamp(R.int(c, 1, 5) + tr[1], 1, 5);
    return { n: B8.personName(c, s), s, sk, tr: B8.fmt(c, tr[0], { ps: s }), cut: 6 + sk * 3 + R.int(c, 0, 4), rat: tr[2] + R.r(c) * 0.06 };
  }
  H.crew = function (c) { const o = {}; for (const [r] of H.ROLES) o[r] = [cand(c, r), cand(c, r)]; return o; };
  H.scoutCost = (c, tid) => gdp(c) * 0.15 * TG.find((t) => t[0] === tid)[2];
  // осложнения: [id, подходы ("*"/q/l/s), цели ("*"/список), текст, варианты: [надпись, роль, характеристика, шанс, удача, неудача, эффект при удаче, при неудаче]]
  const COMPS = [
    ["alarm", "*", "*", "Сигнализация запищала раньше времени!", [["Хакер глушит сигнал", "hacker", "iq", 0.55, "Хакер нажал[[|а]] три клавиши. Сирена затихла, как будто ей стало стыдно.", "Хакер нажал[[|а]] не те три клавиши. Сирена стала громче."], ["Работать быстрее", "muscle", "h", 0.5, "Вы управились за две минуты. Рекорд.", "Спешка — плохой помощник. Вы уронили половину добычи.", { loot: -0.15 }, { loot: -0.25 }], ["Сделать вид, что так и надо", "", "luck", 0.4, "Прохожие решили, что это учения. Один даже помог вынести сумку.", "Прохожие решили, что это ограбление. Они были правы."]]],
    ["classmate", "*", "jewel bank casino", "Охранник узнал тебя: это твой одноклассник {m}!", [["Вспомнить школу и договориться", "", "soc", 0.55, "Вы вспомнили учительницу физкультуры и поделили добычу по-честному. Он даже помог.", "Он вспомнил, как ты списывал[|а] у него контрольные. И нажал тревожную кнопку."], ["Связать его, извиняясь", "muscle", "h", 0.6, "Ты связал[|а] его и пообещал[|а] прислать открытку. Он кивнул с пониманием.", "Он вырвался и убежал звать на помощь."], ["Сказать, что ты — это не ты", "", "looks", 0.35, "«Обознался», — пробормотал он и отвернулся. Магия уверенности.", "«Ты всегда так говорил[|а], когда врал[|а]», — сказал он."]]],
    ["finger", "q s", "bank", "Хранилище открывается по отпечатку пальца директора.", [["Хакер подделывает отпечаток", "hacker", "iq", 0.55, "Отпечаток из клея и фотографии сработал с первого раза.", "Сканер ответил: «Вы не директор». Очень вежливо и очень громко."], ["Уговорить директора — он как раз здесь", "", "soc", 0.4, "Директор оказался в долгах. Он приложил палец и попросил долю.", "Директор упал в обморок. Прямо на кнопку тревоги.", { loot: -0.1 }], ["Пробить стену перфоратором", "muscle", "h", 0.45, "Стена сдалась. Соседи сверху подумали, что это ремонт.", "Перфоратор оказался слабее стены. И громче."]]],
    ["traffic", "*", "*", "Водитель застрял[[|а]] в пробке и опаздывает!", [["Ждать", "driver", "luck", 0.55, "Водитель приехал[[|а]] по встречке, по тротуару и через клумбу. Но вовремя.", "Пробка так и не рассосалась."], ["Уходить пешком с сумками", "", "h", 0.45, "Ты пробежал[|а] три квартала с сумками. Лучшая тренировка в жизни.", "Сумки оказались очень тяжёлыми.", { loot: -0.1 }, { loot: -0.3 }], ["Угнать прокатные самокаты", "", "luck", 0.5, "Банда на самокатах — полиция даже не поняла, кого ловить.", "У самокатов села батарея на втором перекрёстке."]]],
    ["tour", "*", "bank museum", "В зале — экскурсия школьников!", [["Притвориться экскурсоводом", "", "iq", 0.5, "Ты провёл[|а] лучшую экскурсию в их жизни. Дети хлопали, пока вы выносили сумки.", "Школьник спросил: «А вы правда экскурсовод?» — и снял тебя на телефон."], ["Переждать в туалете", "", "luck", 0.55, "Экскурсия ушла. Ты вышел[|ла] посвежевш[им|ей].".replace("вышел[|ла]", "выш[ел|ла]"), "Экскурсии понадобился именно этот туалет."], ["Объявить «пожарные учения»", "", "soc", 0.45, "Все организованно вышли на улицу. Даже охрана.", "Охрана знала, что учений сегодня нет."]]],
    ["empty", "*", "bank casino armored", "Сейф пустой — деньги перенесли в соседний!", [["Хакер находит схему здания", "hacker", "iq", 0.5, "Нужный сейф нашёлся за картиной с уточками.", "Схема была старой. Там, где должен быть сейф, — столовая."], ["Громила несёт сейф целиком", "muscle", "h", 0.4, "[[Он|Она]] поднял[[|а]] сейф и пош[[ёл|ла]]. Никто не решился остановить.", "Сейф победил. Громила сел[[|а]] на него и заплакал[[|а]].", { loot: 0.1 }], ["Взять что есть", "", "", 0.95, "Добыча — канцелярия, кофемашина и фикус. Кофемашина, кстати, дорогая.", "", { loot: -0.6 }]]],
    ["camera", "*", "*", "Камера наблюдения смотрит прямо на тебя.", [["Хакер зацикливает запись", "hacker", "iq", 0.6, "На записи — пустой коридор и муха. Двадцать минут подряд.", "Запись зациклилась на твоём лице. Двадцать минут подряд."], ["Помахать в камеру", "", "luck", 0.3, "Охранник у монитора спал. Твой привет увидит только архив.", "Видео с твоим приветом стало вирусным.", { ev: 0 }, { ev: 20 }], ["Повернуться спиной и идти задом", "", "iq", 0.5, "Ты шёл задом весь коридор. Это было странно, но работает.".replace("шёл", "ш[ёл|ла]"), "Ты врезал[ся|ась] в охранника. Спиной."]]],
    ["dog", "*", "jewel bank casino train", "Сторожевая собака размером с телёнка!", [["Дать ей колбасы", "", "luck", 0.6, "Собака съела колбасу и пошла провожать тебя до выхода.", "Собака на диете. Колбасу съела охрана, а потом погналась за тобой."], ["Громила с ней играет", "muscle", "soc", 0.55, "Громила почесал[[|а]] собаке живот. Собака теперь в команде.", "Собака решила играть в «догони громилу»."], ["Хакер включает ультразвук", "hacker", "iq", 0.5, "Собака ушла спать в будку. Ультразвук действует даже на совесть.", "Ультразвук разбудил всех собак района."]]],
    ["nervous", "*", "*", "Свой человек нервничает и хочет всё отменить.", [["Успокоить его", "", "soc", 0.6, "Ты рассказал[|а] [[ему|ей]] анекдот. Помогло. Анекдот был так себе.", "[[Он|Она]] убежал[[|а]] домой. С ключами."], ["Пообещать двойную долю", "", "", 0.85, "[[Он|Она]] мгновенно успокоил[[ся|ась]]. Деньги — лучшее успокоительное.", "", { loot: -0.1 }], ["Отпустить его", "", "luck", 0.5, "[[Он|Она]] уш[[ёл|ла]]. Без [[него|неё]] даже проще.", "[[Он|Она]] уш[[ёл|ла]] — и пош[[ёл|ла]] в полицию."]]],
    ["rivals", "*", "bank jewel casino armored", "На месте уже работают другие грабители!", [["Объединиться", "", "soc", 0.6, "Две банды поделили добычу. Вышло даже дружно.", "Они согласились, а потом убежали со всем.", { loot: -0.3 }, { loot: -0.5 }], ["Обогнать их", "driver", "luck", 0.5, "Вы забрали лучшее, пока конкуренты спорили, кто держит сумку.", "Конкуренты оказались быстрее."], ["Вызвать на них полицию", "", "iq", 0.45, "Полиция взяла конкурентов. Вы ушли с чёрного хода.", "Полиция приехала и взяла всех. Почти всех."]]],
    ["heavy", "*", "*", "Добыча тяжелее, чем казалось.", [["Брать только самое ценное", "", "iq", 0.7, "Ты отобрал[|а] самое дорогое за минуту. Глаз-алмаз.", "Самым ценным оказалось не то, что ты взял[|а].", { loot: 0 }, { loot: -0.2 }], ["Громила несёт всё", "muscle", "h", 0.55, "Громила унёс[[|ла]] всё и даже не вспотел[[|а]].", "Громила сорвал[[|а]] спину. Сумки остались.", { loot: 0.2 }, { loot: -0.2 }], ["Оставить часть", "", "", 0.95, "Жадность — грех. Половина добычи осталась охране на чай.", "", { loot: -0.3 }]]],
    ["laser", "q s", "museum bank", "Лазерная сетка в коридоре!", [["Пролезть как в кино", "", "h", 0.45, "Ты прош[ёл|ла] сетку шпагатом. Никто не узнает, но это было красиво.", "Ты чихнул[|а] в самый неподходящий момент."], ["Хакер отключает лазеры", "hacker", "iq", 0.6, "Лазеры погасли. Хакер скромно поклонил[[ся|ась]].", "Лазеры погасли, а свет — включился."], ["Зеркальце из пудреницы", "", "iq", 0.45, "Лучи отразились в потолок. Физика — лучший подельник.", "Лучи отразились в датчик тревоги. Физика — коварный подельник."]]],
    ["dye", "*", "bank armored casino", "В пачке денег взорвалась ампула с краской!", [["Отстирать в машине порошком", "", "luck", 0.4, "Порошок «Белизна» справился. Купюры теперь пахнут лавандой.", "Купюры стали розовыми. Ты тоже.", { loot: 0 }, { loot: -0.2 }], ["Бросить испорченное", "", "", 0.95, "Ты выбросил[|а] пачки с краской. Остальное — чистое.", "", { loot: -0.2 }], ["Продать «художникам»", "", "soc", 0.4, "Современный художник купил розовые деньги как инсталляцию. Дорого.", "Художник оказался налоговым инспектором.", { loot: 0.1 }]]],
    ["mom", "*", "*", "В самый ответственный момент звонит мама!", [["Ответить шёпотом", "", "soc", 0.55, "«Мама, я в библиотеке». — «Почему так тихо?» — «Это же библиотека».", "Мама услышала сирену и начала задавать вопросы. Громко."], ["Сбросить", "", "luck", 0.7, "Мама перезвонила позже. Ты сказал[|а], что был[|а] в метро.", "Мама прислала двадцать сообщений, телефон вибрировал на всё хранилище."], ["Включить громкую связь и попросить совета", "", "luck", 0.3, "Мама подсказала, где лучше прятать деньги. Оказывается, она многое знает.", "Мама вызвала полицию. «Для твоего же блага».", { loot: 0.15 }]]],
    ["patrol", "*", "*", "У входа остановился патруль — выпить кофе.", [["Ждать, пока допьют", "", "luck", 0.55, "Они допили и уехали. Кофе был отвратительный — пили быстро.", "Они заказали ещё по пончику."], ["Отвлечь: позвонить в пиццерию на их адрес", "", "iq", 0.5, "Курьер с десятью пиццами отвлёк патруль на полчаса.", "Патруль решил, что пицца — взятка, и пошёл разбираться."], ["Уйти через крышу", "", "h", 0.5, "Крыша, пожарная лестница, переулок — классика.", "Пожарная лестница кончилась на третьем этаже."]]],
    ["laptop", "q s", "*", "Хакер уронил[[|а]] ноутбук!", [["Чинить на коленке", "hacker", "iq", 0.5, "Скотч, жвачка и гений — ноутбук ожил.", "Ноутбук показал синий экран. Навсегда."], ["Работать вручную", "", "iq", 0.4, "Ты вскрыл[|а] замок шпилькой. Старые методы — надёжные.", "Шпилька сломалась в замке."], ["Помолиться", "", "luck", 0.3, "Ноутбук включился сам. Хакер теперь верит в чудеса.", "Чуда не случилось."]]],
    ["vent", "q", "bank museum jewel", "Громила застрял[[|а]] в вентиляции!", [["Тянуть всей командой", "", "h", 0.55, "Рывок — и [[он|она]] свобод[[ен|на]]. Потеряли только [[его|её]] кроссовок.", "Тянули, тянули — вытянуть не смогли."], ["Смазать маслом", "", "iq", 0.6, "Подсолнечное масло из кафе внизу спасло операцию.", "Масло протекло на датчики."], ["Оставить его и вернуться позже", "", "", 0.6, "Ты вернул[ся|ась] через час. [[Он|Она]] спал[[|а]]. Доволь[[ный|ная]].", "[[Его|Её]] нашли охранники. [[Он|Она]] всё рассказал[[|а]] за бутерброд."]]],
    ["granny", "l", "jewel armored casino", "Пожилая посетительница отказывается лечь на пол и бьёт тебя сумкой.", [["Уважительно попросить", "", "soc", 0.5, "Ты сказал[|а] «пожалуйста». Она прилегла и попросила подушку.", "Сумка у неё тяжёлая. Видимо, кирпичи."], ["Отдать ей часть добычи", "", "", 0.9, "Бабушка взяла пачку денег, сказала «на внуков» и ушла.", "", { loot: -0.1 }], ["Бежать", "", "h", 0.6, "Ты сбежал[|а]. Бабушка — быстрее, но устала у дверей.", "Бабушка догнала."]]],
    ["fake", "*", "museum", "Картина оказалась подделкой! Настоящая — в запасниках.", [["Идти в запасники", "", "luck", 0.45, "В запасниках — настоящий шедевр. И три недоеденных бутерброда.", "Запасники охраняются лучше, чем выставка.", { loot: 0.3 }], ["Взять подделку — кто заметит?", "", "", 0.95, "Подделку купит коллекционер, который тоже не разбирается.", "", { loot: -0.5 }], ["Хакер ищет по базе", "hacker", "iq", 0.55, "Настоящая картина — в соседнем зале под табличкой «копия». Хитрые музейщики.", "База музея — на дискетах."]]],
    ["train_fast", "*", "train", "Поезд не останавливается на станции, как обещали!", [["Прыгнуть на ходу", "", "h", 0.45, "Прыжок, кувырок — и ты в вагоне. Каскадёры аплодируют.", "Прыжок не удался. Ты догонял[|а] поезд на велосипеде."], ["Водитель догоняет поезд", "driver", "luck", 0.55, "Машина неслась вдоль путей, как в кино. Вы перебрались на ходу.", "Дорога кончилась раньше, чем рельсы."], ["Отцепить вагон на подъёме", "", "iq", 0.5, "Вагон отцепился и тихо скатился к вам в руки.", "Отцепился не тот вагон. Вы ограбили вагон-ресторан.", { loot: 0.1 }, { loot: -0.4 }]]],
    ["croupier", "*", "casino", "Крупье узнал в тебе постоянного клиента!", [["Предложить ему долю", "", "soc", 0.55, "Крупье подмигнул и открыл кассу. Он давно мечтал уволиться.", "Крупье обиделся: ты проиграл[|а] ему сто вечеров, а теперь грабишь."], ["Сказать, что ты приш[ёл|ла] отыграться", "", "luck", 0.45, "Он рассмеялся и отвернулся. Казино всегда понимает игроков.", "Он рассмеялся и нажал кнопку."], ["Поставить всё на красное", "", "luck", 0.48, "Выпало красное! Добыча удвоилась прямо на месте.", "Выпало чёрное. Касса закрылась.", { loot: 0.4 }, { loot: -0.4 }]]],
    ["director", "*", "bank casino", "Управляющий предлагает долю, лишь бы его не трогали.", [["Согласиться", "", "", 0.85, "Управляющий сам открыл сейф и показал, где лежит самое ценное.", "", { loot: 0.2, ev: 10 }], ["Отказаться: никаких свидетелей-партнёров", "", "iq", 0.6, "Ты отказал[|а]. Чем меньше людей знает — тем лучше.", "Он обиделся и запомнил тебя в лицо."], ["Взять с него расписку", "", "iq", 0.4, "Расписка «я не видел[|а] никаких грабителей» — лучший документ в твоей коллекции.", "Он написал расписку твоим настоящим именем."]]],
    ["sneeze", "q s", "*", "Кто-то из команды чихнул прямо на датчик движения.", [["Замереть", "", "luck", 0.5, "Вы стояли неподвижно пять минут. Датчик решил, что это манекены.", "Датчик решил, что это грабители."], ["Хакер перезагружает датчик", "hacker", "iq", 0.6, "Датчик перезагрузился. Его сознание чисто.", "Датчик перезагрузился с громким писком."], ["Бежать к цели", "", "h", 0.45, "Добежал[|а]! Взял[|а]! Убежал[|а]!", "Добежать не успел[|а]."]]],
    ["window", "l", "*", "Охрана закрыла главный выход!", [["Громила выбивает дверь", "muscle", "h", 0.55, "Дверь вылетела вместе с рамой. Охрана решила не связываться.", "Дверь оказалась бронированной. Громила — нет."], ["Водитель подаёт машину прямо в витрину", "driver", "luck", 0.5, "Эффектный выезд. Стекло — на счастье.", "Машина застряла в витрине."], ["Уйти через окно туалета", "", "h", 0.5, "Окно маленькое, но надежда больше.", "Окно маленькое. Ты — нет."]]],
  ];
  const GETAWAY = [["Гнать по проспекту", "driver", "luck", 0.58], ["Затеряться во дворах", "driver", "iq", 0.6], ["Пересесть на «{ride}»", "", "luck", 0.5], ["Разделиться и уходить пешком", "", "h", 0.52], ["Переодеться в туристов", "", "looks", 0.5]];
  const STAT = (c, s) => (s === "luck" ? (c.luck - 50) / 300 : s === "iq" ? (c.iq - 50) / 300 : s === "soc" ? (c.soc - 50) / 300 : s === "h" ? (c.h - 60) / 300 : s === "looks" ? (c.looks - 50) / 300 : 0);
  H.begin = function (c, tid, crewC, picks, ap, scout) {
    const t = TG.find((x) => x[0] === tid);
    const crew = {};
    for (const [r] of H.ROLES) { const i = picks[r]; crew[r] = i != null && i >= 0 ? crewC[r][i] : null; }
    if (scout) c.money -= H.scoutCost(c, tid);
    c.ya.heist = 1; c.ya.crime = (c.ya.crime || 0) + 2;
    const pool = COMPS.filter((x) => (x[1] === "*" || x[1].split(" ").includes(ap[0])) && (x[2] === "*" || x[2].split(" ").includes(tid)) &&
      !(x[0] === "laptop" && !crew.hacker) && !(x[0] === "vent" && !crew.muscle) && !(x[0] === "nervous" && !crew.inside) && !(x[0] === "traffic" && !crew.driver));
    const n = 2 + (t[2] >= 3 ? 1 : 0), comps = [];
    while (comps.length < n && pool.length) comps.push(pool.splice(Math.floor(R.r(c) * pool.length), 1)[0][0]);
    const gw = GETAWAY.slice(); const gets = [];
    while (gets.length < 3) gets.push(gw.splice(Math.floor(R.r(c) * gw.length), 1)[0]);
    return { tid, crew, ap, scout: !!scout, comps, gets, i: 0, alarm: 0, loot: 1, ev: 0, caught: false, stage: "comp", lines: [], name: tid === "century" ? centuryName(c) : t[1] };
  };
  const roleB = (h, r) => (!r ? 0 : h.crew[r] ? (h.crew[r].sk - 3) * 0.07 + 0.08 : -0.15);
  const apB = (h, r) => (h.ap === "quiet" && (r === "hacker" || r === "inside") ? 0.05 : h.ap === "loud" && (r === "muscle" || r === "driver") ? 0.05 : h.ap === "smart" && !r ? 0.05 : 0);
  H.p = function (c, h, o) {
    const t = TG.find((x) => x[0] === h.tid);
    return clamp(o[3] - t[4] + (h.scout ? 0.1 : 0) - h.alarm * 0.07 + roleB(h, o[1]) + apB(h, o[1]) + STAT(c, o[2]) + (h.crew.inside ? 0.04 : 0), 0.05, 0.95);
  };
  const SUBJ = { laptop: "hacker", vent: "muscle", nervous: "inside", traffic: "driver" };
  const psOf = (h, compId, role) => { const m = (role && h.crew[role]) || (SUBJ[compId] && h.crew[SUBJ[compId]]); return { ps: m ? m.s : "m" }; };
  H.view = function (c, h) {
    if (h.stage === "comp") {
      const x = COMPS.find((q) => q[0] === h.comps[h.i]);
      return { stage: "comp", step: h.i + 1, of: h.comps.length, text: B8.fmt(c, x[3], psOf(h, x[0])), opts: x[4].map((o) => ({ t: B8.fmt(c, o[0]), p: Math.round(H.p(c, h, o) * 100), role: o[1] })) };
    }
    if (h.stage === "vault") return { stage: "vault" };
    if (h.stage === "getaway") return { stage: "getaway", text: "Добыча в сумках. Теперь — уйти.", opts: h.gets.map((o) => ({ t: B8.fmt(c, o[0]), p: Math.round(H.p(c, h, o) * 100), role: o[1] })) };
    return { stage: "done" };
  };
  H.act = function (c, h, i) {
    const list = h.stage === "comp" ? COMPS.find((q) => q[0] === h.comps[h.i])[4] : h.gets;
    const o = list[i] || list[0];
    const ok = R.r(c) < H.p(c, h, o);
    let text;
    if (h.stage === "comp") {
      text = B8.fmt(c, ok ? o[4] : o[5] || o[4], psOf(h, h.comps[h.i], o[1]));
      const fx = ok ? o[6] : o[7];
      if (fx) { if (fx.loot) h.loot += fx.loot; if (fx.ev) h.ev += fx.ev; }
      if (!ok) h.alarm += 1;
      h.i += 1;
      if (h.alarm >= 3) { h.caught = true; h.stage = "done"; }
      else if (h.i >= h.comps.length) h.stage = "vault";
    } else {
      text = ok ? R.pick(c, ["Сирены остались позади. Через час вы уже делили добычу в гараже.", "Вы растворились в городе, как сахар в чае.", "Погоня свернула не туда. Вы — туда."]) : h.alarm >= 2 ? "Погоня догнала. Наручники щёлкнули прямо у машины." : "Вы ушли, но засветились на десятке камер.";
      if (!ok) { if (h.alarm >= 2) h.caught = true; else { h.ev += 20; h.alarm += 1; } }
      h.stage = "done";
    }
    h.lines.push(text);
    return { ok, text };
  };
  // хранилище: score 0–3 из мини-игры «взлом замка»
  H.vault = function (c, h, score) {
    score = score == null ? (R.r(c) < 0.5 ? 1 : 2) : score;
    h.loot *= 0.55 + score * 0.2;
    if (score === 0) h.alarm += 1;
    const text = score >= 3 ? "Замок щёлкнул с первой попытки. Хранилище открыто — и оно полное." : score === 2 ? "Замок поддался не сразу, но поддался." : score === 1 ? "Замок сопротивлялся. Открыть удалось только одну секцию." : "Замок заклинило. Пришлось ломать — громко и долго.";
    h.lines.push(text);
    h.stage = h.alarm >= 3 ? "done" : "getaway";
    if (h.alarm >= 3) h.caught = true;
    return { ok: score >= 2, text };
  };
  const HEIST_OK = ["{country}: налётчики {mask} ограбили {acc}", "Дерзкое ограбление в городе {city}: налётчики были {mask}", "Ограбление {gen} в городе {city}: на месте оставили открытку «Спасибо»",
    "Неизвестные вынесли из {gen} {sum}. Полиция в недоумении", "Банда {mask} снова на свободе: полиция ищет грабителей {gen}"];
  const HEIST_NO = ["Неудачное ограбление {gen}: налётчики {mask} задержаны на месте", "Грабители {mask} застряли в дверях {gen}. Полиция приехала за пять минут", "Ограбление {gen} сорвалось: налётчиков выдала мама одного из них"];
  H.finish = function (c, h) {
    const t = TG.find((x) => x[0] === h.tid), G = gdp(c), cr = c.crime;
    const d = { acc: t[0] === "century" ? "сокровищницу страны" : t[7], gen: t[0] === "century" ? "главной сокровищницы страны" : t[8], mask: B8.mask(c) };
    c.counts.heistTry = (c.counts.heistTry || 0) + 1;
    if (h.caught) {
      say(c, `Ограбление «${h.name}» провалилось.`, "b", h.lines[h.lines.length - 1] || "", true);
      B8.paper(c, B8.fmt(c, R.pick(c, HEIST_NO), d), "криминальная хроника");
      cr.ev += t[5];
      CR.arrest(c, 3 + t[2] * 2, "ограбление");
      return { ok: false, sum: 0, text: "Тебя взяли на месте." };
    }
    const base = G * (t[3][0] + R.r(c) * (t[3][1] - t[3][0])) * Math.max(0.15, h.loot);
    const cuts = Object.values(h.crew).filter(Boolean).reduce((s, m) => s + m.cut, 0);
    const mine = base * (1 - Math.min(80, cuts) / 100);
    c.money += mine; cr.earned += mine; cr.rep += 10 + t[2] * 12; cr.heat += 8 + t[2] * 5 + h.alarm * 6;
    cr.ev = clamp((cr.ev || 0) + t[5] * (0.45 + h.alarm * 0.2) * (h.ap === "quiet" ? 0.7 : 1) + h.ev, 0, 100);
    c.counts.heists = (c.counts.heists || 0) + 1;
    d.sum = B8.money(base);
    say(c, `Ограбление «${h.name}» удалось! Общая добыча — ${B8.money(base)}, твоя доля после команды — ${B8.money(mine)}.`, "g", "", true);
    B8.scene(c, "heist");
    B8.paper(c, B8.fmt(c, R.pick(c, HEIST_OK), d).replace("{sum}", d.sum), "криминальная хроника");
    B8.voice(c, "heist");
    if (t[0] === "century") { c.flags.century = 1; B8.turn(c, "дело века"); }
    if (H.ROLES.every(([r]) => h.crew[r])) c.flags.fullcrew = 1;
    if (c.counts.heists >= 5) c.flags.heists5 = 1;
    if (!cr.on && cr.rep > 60) cr.orgName = cr.orgName || CR.orgName(c);
    for (const m of Object.values(h.crew)) if (m && R.r(c) < m.rat) { B8.schedule(c, "heist_rat", 1, 2, { p: m.n, ps: m.s }); break; }
    return { ok: true, sum: mine, text: "" };
  };
  // для бота и «досмотреть автоматически»
  H.auto = function (c, tid) {
    const crewC = H.crew(c), picks = {};
    for (const [r] of H.ROLES) picks[r] = R.r(c) < 0.85 ? (crewC[r][0].sk >= crewC[r][1].sk ? 0 : 1) : -1;
    const h = H.begin(c, tid, crewC, picks, R.pick(c, ["quiet", "loud", "smart"]), c.money > H.scoutCost(c, tid) * 3);
    let g2 = 0;
    while (h.stage !== "done" && g2++ < 10) { if (h.stage === "vault") H.vault(c, h); else H.act(c, h, Math.floor(R.r(c) * 3)); }
    return H.finish(c, h);
  };

  // ═════════════════ ОПЕРАЦИИ: улики, шоколадка, замести следы ═════════════════
  const EVB = { pick: 4, choco: 2, fake: 5, car: 8, pyramid: 16, hack: 12, task: 4, deal: 10, war: 12, casino: 10, special: 25 };
  const _doOp = CR.doOp, _opsFor = CR.opsFor, _success = CR.success;
  CR.success = function (c, id, risk) { let p = _success(c, id, risk); if (id === "car" && c.flags._mg != null) p = clamp(p + (c.flags._mg - 1.5) * 0.12, 0.05, 0.95); return p; };
  CR.doOp = function (c, id, extra) {
    const cr = c.crime, first = !cr.ops;
    let r;
    if (id === "choco") {
      c.ya.crime = (c.ya.crime || 0) + 1; cr.ops += 1;
      if (R.r(c) < 0.8) { c.hap += 2; cr.ev = clamp((cr.ev || 0) + 1); r = res(c, R.pick(c, ["Шоколадка оказалась с орехами. Ты не любишь орехи. Но было вкусно.", "Ты вынес[|ла] шоколадку в рукаве. Охранник проводил тебя взглядом и вздохнул."]), "g"); }
      else if (R.r(c) < 0.25) { r = res(c, "Охранник поймал тебя у выхода. Магазин решил «проучить» и вызвал полицию.", "b"); CR.arrest(c, 1, "кража шоколадки"); }
      else { cr.heat += 4; r = res(c, "Охранник поймал тебя и заставил купить шоколадку. И ещё одну — «за моральный ущерб».", "b"); c.money -= gdp(c) * 0.002; }
    } else if (id === "clean") {
      const cost = gdp(c) * 0.3 * (1 + cr.rank);
      c.ya.crime = (c.ya.crime || 0) + 1;
      if (c.money < cost) return res(c, "Не хватает денег, чтобы замести следы.", "b");
      c.money -= cost;
      if (R.r(c) < 0.7) { cr.ev = Math.max(0, cr.ev - 25); r = res(c, `Ты заплатил[|а] ${B8.money(cost)} «чистильщику». Свидетели вдруг всё забыли, файлы — потерялись.`, "g"); }
      else { cr.ev = clamp(cr.ev + 10); r = res(c, "«Чистильщик» оказался полицейским под прикрытием. Улик стало больше.", "b"); }
    } else {
      if (id === "car" && extra && extra.mg != null) c.flags._mg = extra.mg;
      r = _doOp(c, id);
      delete c.flags._mg;
      const e = EVB[id];
      if (e) cr.ev = clamp((cr.ev || 0) + e * (r.kind === "b" ? 1.6 : 0.5 + R.r(c) * 0.6) * (1 - c.iq / 260));
      if (id === "low") cr.ev = Math.max(0, (cr.ev || 0) - 8);
    }
    if (first && cr.ops) B8.voice(c, "crime1");
    return r;
  };
  CR.opsFor = function (c) {
    const out = _opsFor(c);
    if (c.age >= 14 && !c.crime.on) out.unshift({ id: "choco", label: "Стащить шоколадку в магазине", p: 80, risk: 0.05, cost: 0 });
    if ((c.crime.ev || 0) >= 15) out.push({ id: "clean", label: "Замести следы", p: 70, risk: 0, cost: gdp(c) * 0.3 * (1 + c.crime.rank) });
    return out;
  };

  // ═════════════════ СОЦСЕТИ ═════════════════
  const SM = (B8.social = {});
  SM.fmtF = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",") + " млн" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".", ",") + " тыс." : String(Math.round(n)));
  const POSTS = ["Фото еды. Двенадцать лайков, три из них — от мамы.", "Видео, где кот падает с дивана. Кот недоволен, подписчики — в восторге.", "Селфи с серьёзным лицом и подписью «думаю о вечном». Друзья ставят смеющиеся смайлики.",
    "Видео о том, как ты чинил[|а] кран. Кран победил, видео — тоже.", "Ты снял[|а] танец под модную песню. Бабушка повторила его лучше и набрала больше лайков.", "Длинный пост о смысле жизни. Его прочитали двое. Один из них — бот.",
    "Фото заката. Сорок лайков и одно предложение руки и сердца от незнакомца.", "Ты рассказал[|а] историю из жизни. В комментариях спорят, правда ли это. Это правда.", "Ролик «Мой обычный день». Подписчики из других стран не верят, что так живут.",
    "Пост «Что я понял[|а] к {age} годам». Самый популярный комментарий: «Ничего».", "Ты показал[|а] свою комнату. Тебе посоветовали убраться три тысячи человек.", "Фото с подписью «Новая жизнь с понедельника». Понедельник не наступил."];
  const VIRAL = ["Твоё видео разлетелось по всему интернету! Тебя узнают на улице и просят «повторить ту штуку».", "Мем с твоим лицом облетел весь мир. Ты стал[|а] шаблоном для открыток.",
    "Твой пост перепечатали новости трёх стран. Мама распечатала его и повесила на холодильник."];
  const HATE = ["Под постом — шторм хейтеров. Кто-то написал, что у тебя неправильные уши.", "Тебя обвинили во всём сразу. Ты просто выложил[|а] фото обеда.", "Сто комментариев «кто это вообще такой?». Ты сам[|а] начал[|а] сомневаться."];
  SM.post = function (c) {
    const s = c.sm; s.posts += 1; c.ya.post = 1;
    const cr = c.crime;
    if (cr.on && cr.rank >= 2 && R.r(c) < 0.5) {
      const gain = Math.round((200 + s.f * 0.4) * (1 + R.r(c))); s.f += gain; cr.rep += 6; cr.heat += 8; cr.ev = clamp((cr.ev || 0) + 4);
      return res(c, CR.type(c) === "cartel" ? `Фото с тигром на фоне банановой плантации. Подпись: «Бизнес растёт». +${SM.fmtF(gain)} подписчиков. Следователь тоже подписался.` :
        `Пост с хештегом #честныйбизнес. +${SM.fmtF(gain)} подписчиков. Следователь сохранил его в папку «Улики».`, "n");
    }
    const fame = Math.max(0.3, 1 + cr.rank * 0.3 + (c.paper || []).length * 0.15 + (c.flags.master ? 1 : 0) + (c.looks - 50) / 60 + (c.soc - 50) / 80);
    let gain = Math.round((8 + R.r(c) * 40) * fame + s.f * (0.05 + R.r(c) * 0.15));
    let t, kind = "g";
    if (R.r(c) < 0.05 + (c.looks > 70 ? 0.03 : 0) + Math.min(0.1, (c.paper || []).length * 0.01)) { gain = Math.round((s.f + 800) * (2 + R.r(c) * 8)); s.viral += 1; t = R.pick(c, VIRAL); c.hap += 6; }
    else if (R.r(c) < 0.12 + (s.f > 50000 ? 0.1 : 0)) { gain = Math.round(gain * 0.3); t = R.pick(c, HATE); B8.stress(c, 6, "хейтеры"); kind = "b"; }
    else t = R.pick(c, POSTS);
    s.f += gain; s.best = Math.max(s.best, s.f);
    const msgs = [];
    for (const [m, l] of [[1e3, "Тысяча подписчиков! Ты — местная знаменитость."], [1e4, "Десять тысяч подписчиков. С тобой здороваются незнакомые люди."], [1e5, "Сто тысяч подписчиков! Бренды предлагают рекламу. Ты — блогер."], [1e6, "МИЛЛИОН ПОДПИСЧИКОВ. Тебе прислали золотую кнопку и сто коробок с товарами."]]) {
      if (s.f >= m && !c.flags["sm" + m]) { c.flags["sm" + m] = 1; msgs.push(l); if (m >= 1e6) { B8.turn(c, "миллион подписчиков"); B8.paper(c, "Миллион подписчиков: {full} — главный блогер города {city}", "светская хроника"); } }
    }
    const r = res(c, t + ` (+${SM.fmtF(gain)})`, kind);
    for (const m of msgs) say(c, m, "g", "соцсети", true);
    return r;
  };
  SM.year = function (c) {
    const s = c.sm; if (!s || !s.f) return;
    if (!c.ya.post) s.f = Math.round(s.f * 0.94);
  };
  B8.incHook = function (c) {
    let x = 0;
    const s = c.sm, G = gdp(c), rural = c.urban ? 1 : 0.7;
    if (s && s.f >= 1e5) x += G * Math.min(8, s.f / 250000 + 0.3);
    if (c.fug && c.focus === "f_cash") x += G * 0.3 * rural;
    return x;
  };

  // ═════════════════ ПИТОМЦЫ ═════════════════
  const PK = {
    dog: ["пёс", "🐕", "m", 13, ["Шарик", "Тайсон", "Бублик", "Генерал", "Пельмень", "Рекс", "Граф", "Барон"]],
    cat: ["кот", "🐈", "m", 16, ["Барсик", "Маркиз", "Пончик", "Зефир", "Профессор", "Кузя", "Тимофей"]],
    kitty: ["кошка", "🐈‍⬛", "f", 16, ["Мурка", "Багира", "Сосиска", "Матильда", "Плюшка", "Ириска"]],
    parrot: ["попугай", "🦜", "m", 45, ["Кеша", "Гоша", "Капитан", "Рикки", "Жако"]],
    turtle: ["черепаха", "🐢", "f", 60, ["Тортилла", "Ракета", "Скорость", "Пятница"]],
    hamster: ["хомяк", "🐹", "m", 3, ["Хрум", "Пушок", "Бисквит", "Щекан"]],
    rabbit: ["кролик", "🐇", "m", 9, ["Ушастик", "Снежок", "Морковкин"]],
    iguana: ["игуана", "🦎", "f", 15, ["Годзилла", "Шуршалка", "Королева"]],
    hedgehog: ["ёжик", "🦔", "m", 5, ["Колючка", "Туман", "Шнурок"]],
  };
  const PETS = (B8.pets = { PK });
  const PLINES = {
    any: ["{pet} спит у тебя на голове. Ты не возражаешь.", "{pet} встречает тебя у двери каждый вечер. Никто другой так не радуется.", "{pet} стащил[[|а]] со стола ужин и сделал[[|а]] вид, что так и было.",
      "{pet} заболел[[|а]]. Ветеринар, лекарства, бессонная ночь — и утром {pet} снова просит есть.", "{pet} снял[[ся|ась]] в рекламе корма. Гонорар — мешок того же корма."],
    dog: ["{pet} сгрыз твои ботинки и посмотрел так, будто это ты виноват[|а].", "{pet} выиграл на районной выставке собак в номинации «Самая счастливая морда».", "{pet} притащил с прогулки чужой мяч, чужую палку и чужую собаку."],
    cat: ["{pet} уронил с полки всё, что можно уронить, и посмотрел, что ещё осталось.", "{pet} пропал на три дня и вернулся с новым ошейником. У него есть вторая семья.", "{pet} сел на клавиатуру и отправил начальнику письмо «ыыыыыыыыы»."],
    kitty: ["{pet} принесла тебе «подарок» — живого голубя. Голубь в шоке.", "{pet} родила пятерых котят в шкафу с твоими свитерами.", "{pet} смотрит в пустой угол и шипит. Ты стараешься не думать об этом."],
    parrot: ["{pet} выучил новое слово. Это слово нельзя произносить при бабушке.", "{pet} научился имитировать звонок телефона. Ты бегаешь отвечать по десять раз в день.", "{pet} повторяет твой пароль от банка. Ты меняешь пароль. Он выучивает новый."],
    turtle: ["{pet} переползла через всю комнату за день. Рекорд.", "{pet} пережила уже третий твой ремонт. И переживёт всех."],
    hamster: ["{pet} сбежал из клетки и неделю жил в диване. Вернулся упитанным.", "{pet} бегает в колесе ночью так, будто готовится к Олимпиаде."],
    rabbit: ["{pet} перегрыз провод от телевизора. Вечер без сериала оказался неплохим."],
    iguana: ["{pet} загорает под лампой и смотрит на тебя как на подданного.", "{pet} сбежала и навела панику в подъезде. Соседи думали, что это дракон."],
    hedgehog: ["{pet} топает ночью так, будто по квартире ходит слон.", "{pet} свернулся клубком в твоём тапке. Утро началось с крика."],
  };
  PETS.adopt = function (c, kind) {
    const k = PK[kind], p = { n: R.pick(c, k[4]), k: kind, g: k[2], born: c.age, alive: true, le: Math.max(2, Math.round(k[3] * (0.75 + R.r(c) * 0.5))) };
    c.pets.push(p);
    if (c.age >= 18) c.money -= gdp(c) * 0.02;
    c.hap += 6; c.st -= 4;
    if (c.pets.length >= 5) c.flags.zoo = 1;
    return p;
  };
  PETS.line = (c, p, list) => B8.fmt(c, R.pick(c, list).replace(/\{pet\}/g, p.n), { ps: p.g });
  PETS.year = function (c) {
    const alive = (c.pets || []).filter((p) => p.alive);
    for (const p of alive) {
      if (c.age - p.born >= p.le) {
        p.alive = false; p.died = c.age - p.born; c.hap -= 8; B8.stress(c, 8, "смерть питомца");
        say(c, B8.fmt(c, `${p.n} (${PK[p.k][0]}) прожил[[|а]] с тобой ${p.died} ${B8.years(p.died)} и тихо уснул[[|а]] навсегда. Дом стал пустым.`, { ps: p.g }), "b", "", true);
      }
    }
    const live = alive.filter((p) => p.alive);
    if (live.length && !c.jail && R.r(c) < 0.35) {
      const p = R.pick(c, live);
      say(c, PETS.line(c, p, R.r(c) < 0.5 ? PLINES.any : PLINES[p.k] || PLINES.any), "g");
      c.hap += 2;
    }
  };
  PETS.play = function (c) {
    const live = (c.pets || []).filter((p) => p.alive);
    if (!live.length) return { text: "", kind: "n" };
    const p = R.pick(c, live); c.hap += 4; c.st -= 6;
    return res(c, PETS.line(c, p, ["Вы с {pet} гуляли до темноты. Лучший антистресс на свете.", "{pet} показал[[|а]] новый трюк. Ты сам[|а] не знаешь, кто кого дрессирует.", "Ты валял[ся|ась] на полу, а {pet} лежал[[|а]] рядом. Идеальный вечер."]), "g");
  };
  PETS.parrot = (c) => (c.pets || []).find((p) => p.alive && p.k === "parrot");

  // ═════════════════ ГОД: общие хуки ═════════════════
  B8.yearHooks.push(function (c) {
    SM.year(c); PETS.year(c); FG.year(c);
    if (c.age === 40) B8.voice(c, "forty");
    if (c.age === 60) B8.voice(c, "sixty");
    if (c.age >= 18 && c.money > gdp(c) * 20) B8.voice(c, "money");
    if (c.ls === 4) B8.voice(c, "rich");
    if (c.age === 100) B8.paper(c, "Сто лет! {full} отметил[|а] юбилей и пообещал[|а] дожить до двухсот", "светская хроника");
  });
  // крупный выигрыш в казино — в газету
  const _leave = B8.casino.leave;
  B8.casino.leave = function (c) {
    const r = _leave(c);
    if (r && r.diff > gdp(c) * 8) { B8.paper(c, "Казино в шоке: игрок сорвал банк и ушёл, не сыграв больше ни разу", "светская хроника"); B8.scene(c, "jackpot"); }
    if (r && r.diff < -gdp(c) * 2) B8.voice(c, "casino");
    return r;
  };

  // ═════════════════ СТАРЫЕ СОХРАНЕНИЯ ═════════════════
  B8.migrate = function (c) {
    if (!c) return c;
    if (c.crime && c.crime.ev == null) c.crime.ev = 0;
    if (c.pr === undefined) c.pr = null;
    if (c.fug === undefined) c.fug = null;
    c.sm = c.sm || { f: 0, posts: 0, viral: 0, best: 0 };
    c.pets = c.pets || [];
    c.paper = c.paper || [];
    if (c.jail && !c.pr) c.pr = PR.make(c, c.jail, false);
    c.v = 2;
    return c;
  };
})();
