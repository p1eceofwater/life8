/* 1 из 8 миллиардов — криминал (у каждой страны своё подполье), бизнес, казино и «Дела».
   Слово «наркотики» в игре не встречается: картель возит «особые бананы», «тот самый кофе» и кубинские сигары.
   За преступления всегда приходится платить: тюрьмой, здоровьем или всем нажитым. */
(function () {
  "use strict";
  const B8 = window.B8, R = B8.R, clamp = B8.clamp;
  const K = (c) => B8.K(c.cur);
  const say = B8.say;

  // ═════════════════ КРИМИНАЛ ═════════════════
  const ORG = {
    cartel: { lbl: "картель", ranks: ["халькон (смотрящий)", "курьер", "бригадир", "лейтенант", "правая рука", "глава картеля"],
      goods: ["«особые бананы»", "«тот самый кофе»", "«сахарный тростник особого сорта»"], cu: ["кубинские сигары без акцизов", "ром «для дедушки»"],
      names: ["Лос Платанос", "Лос Кафетерос", "Лос Гуапос", "Тигрес дель Банано", "Лос Сомбрерос", "Ла Фамилия Тропикана"] },
    mafia: { lbl: "мафия", ranks: ["мальчик на побегушках", "солдат", "капо", "консильери", "заместитель дона", "дон"],
      goods: ["оливковое масло «экстра-тёмное»", "строительные подряды", "моцарелла без документов"] },
    yakuza: { lbl: "клан", ranks: ["новичок", "младший брат", "старший брат", "советник", "заместитель главы", "оябун"],
      goods: ["залы патинко", "долговые расписки", "«охрана» караоке-баров"], names: ["Кумо-гуми", "Цуру-гуми", "Ханаби-кай", "Киба-гуми", "Тора-кай"] },
    triad: { lbl: "триада", ranks: ["«синий фонарь»", "боец «49»", "«соломенная сандалия»", "«белый бумажный веер»", "«благоуханная палка»", "«голова дракона»"],
      goods: ["сумки «Пуччи»", "часы «Ролекс» за десять долларов", "маджонг-клубы"], names: ["Золотой дракон", "Пять лотосов", "Нефритовый веер", "Красный фонарь"] },
    bratva: { lbl: "бригада", ranks: ["шестёрка", "пехота", "бригадир", "смотрящий", "правая рука", "авторитет"],
      goods: ["«крыша» для ларьков", "машины, пригнанные из Европы", "ваучеры"], names: ["Окружные", "Заводские", "Вокзальные", "Дачники", "Пельменные"] },
    syndicate: { lbl: "синдикат", ranks: ["мальчик на подхвате", "громила", "бригадир", "бухгалтер", "заместитель", "босс синдиката"],
      goods: ["самогон «Лунный свет»", "подпольный покер", "ставки на скачки"], names: ["Лунный свет", "Ржавый доллар", "Кленовый лист", "Счастливая подкова", "Кенгуру"] },
    gang: { lbl: "банда", ranks: ["посыльный", "боец", "бригадир", "казначей", "правая рука", "главарь банды"],
      goods: ["ставки на собачьи бега", "виски без акциза", "чай «с секретом» из порта"], names: ["Кепки с Док-стрит", "Туманные джентльмены", "Рыжие кепки"] },
    marseille: { lbl: "сеть", ranks: ["пацан с района", "водитель", "организатор", "поставщик", "партнёр", "крёстный отец Марселя"],
      goods: ["сыр без документов", "яхты с Ривьеры", "духи «Шанель № 6»"], names: ["Буйабес", "Синий берег", "Старый порт"] },
    schemes: { lbl: "схема", ranks: ["стажёр", "«консультант»", "схемщик", "архитектор схем", "серый кардинал", "теневой магнат"],
      goods: ["офшоры", "налоговые «оптимизации»", "инсайдерские сделки"], names: ["Честный консалтинг", "Оптима Плюс", "Офшор и партнёры", "Тихая гавань"] },
    smugglers: { lbl: "контрабандисты", ranks: ["носильщик", "проводник", "перевозчик", "организатор", "правая рука", "король контрабанды"],
      goods: ["телефоны без пошлины", "сигареты без акциза", "поддельные запчасти"], names: ["Старый порт", "Ночные караваны", "Братство границы", "Тихий причал"] },
  };
  const REP_RANK = [0, 40, 100, 200, 350, 600];
  const CR = (B8.crime = { ORG, REP_RANK });
  CR.type = (c) => K(c).uw;
  CR.goods = (c) => { const o = ORG[CR.type(c)]; return R.pick(c, c.cur === "CU" ? o.cu : o.goods); };
  CR.orgName = function (c) {
    const t = CR.type(c), o = ORG[t];
    if (t === "cartel") return c.cur === "CU" ? "сигарный картель «Ла Абана Дульсе»" : c.cur === "BR" ? "картель «Командо Банана»" : "картель «" + R.pick(c, o.names) + "»";
    if (t === "mafia") return "семья " + R.pick(c, B8.pool("it").s);
    if (t === "yakuza") return "клан " + R.pick(c, o.names);
    if (t === "triad") return "общество «" + R.pick(c, o.names) + "»";
    if (t === "bratva") return "бригада «" + R.pick(c, o.names) + "»";
    if (t === "syndicate") return "синдикат «" + (c.cur === "AU" ? "Кенгуру" : R.pick(c, o.names.slice(0, 4))) + "»";
    if (t === "gang") return "банда «" + R.pick(c, o.names) + "»";
    if (t === "marseille") return "сеть «" + R.pick(c, o.names) + "»";
    if (t === "schemes") return "фирма «" + R.pick(c, o.names) + "»";
    return "контрабандисты «" + R.pick(c, o.names) + "»";
  };
  CR.rankTitle = (c) => ORG[c.crime.org || CR.type(c)].ranks[c.crime.rank];
  CR.lbl = (c) => ORG[CR.type(c)].lbl;
  // как часто криминальный мир зовёт: уровень преступности в стране + район детства. Решение всегда за игроком.
  CR.pull = function (c) {
    const k = K(c);
    const base = 0.45 + Math.min(3, k.crime / 9);
    const dist = [1.6, 1.25, 1, 0.75, 0.55][c.q - 1];
    return base * dist * (c.urban ? 1.15 : 0.85) * (c.flags.bad_friends ? 1.5 : 1) * (c.crime.rec ? 1.4 : 1);
  };
  CR.join = function (c) {
    const cr = c.crime;
    cr.on = true; cr.org = CR.type(c); cr.rank = Math.max(cr.rank, 0); cr.orgName = cr.orgName || CR.orgName(c);
    B8.turn(c, "вступление: " + cr.orgName);
  };
  CR.leave = function (c) { c.crime.on = false; c.crime.rank = 0; B8.turn(c, c.sex === "f" ? "завязала с прошлым" : "завязал с прошлым"); if (B8.voice) B8.voice(c, "quit"); };
  function rankUp(c) {
    const cr = c.crime;
    if (!cr.on) return;
    while (cr.rank < 4 && cr.rep >= REP_RANK[cr.rank + 1]) {
      cr.rank++;
      say(c, `Тебя повысили: теперь ты — ${CR.rankTitle(c)} (${cr.orgName}).`, "n", "репутация в подполье", true);
      if (cr.rank === 4) B8.turn(c, CR.rankTitle(c));
    }
  }
  CR.rankUp = rankUp;
  // доля «семьи» каждый год
  CR.passive = function (c) {
    const cr = c.crime;
    if (!cr.on || c.jail) return 0;
    const share = [0, 0.15, 0.5, 1.3, 3.5, 12][cr.rank];
    const x = B8.gdp(c) * share * Math.exp(R.gauss(c, 0, 0.35));
    cr.heat += cr.rank * 2.5; cr.earned += x; cr.rep += 4;
    return x;
  };
  CR.year = function (c) {
    const cr = c.crime;
    cr.heat *= cr.on ? 0.85 : 0.7;
    if (cr.on) rankUp(c);
    // облава, если полиция слишком близко
    if (cr.heat > 70 && R.r(c) < (cr.heat - 60) / 120) CR.arrest(c, Math.round(cr.heat / 15) + cr.rank, "облава");
  };
  // арест → суд (решение игрока)
  CR.arrest = function (c, years, why) {
    if (c.jail || !c.alive) return;
    years = clamp(Math.round(years), 1, 25);
    c.pend.unshift({ id: "trial", d: { years, why } });
    say(c, `Тебя арестовали. Повод — ${why}.`, "b", "полиция давно присматривалась", true);
  };
  CR.toJail = function (c, years) {
    c.jail = years; c.jailTot += years; c.crime.rec += 1; c.crime.heat = 10;
    delete c.flags.jail_ad; delete c.flags.appealed;
    if (c.job) { c.job = null; }
    c.school = false;
    if (c.uni) c.uni = null;
    B8.turn(c, `тюрьма: ${years} ${B8.years(years)}`);
    say(c, `Приговор: ${years} ${B8.years(years)} заключения.`, "b", "", true);
    if (c.spouse && c.spouse.alive && R.r(c) < 0.25 + years * 0.04) B8.schedule(c, "jail_spouse_leaves", 1, 2);
  };
  CR.jailYear = function (c) {
    c.jail -= 1;
    if (c.jail <= 0) {
      c.jail = 0;
      say(c, "Ты выш[ел|ла] на свободу. Воздух пахнет иначе.", "g", "срок закончился", true);
      B8.turn(c, "освобождение");
      c.flags.ex_con = 1;
    }
  };
  // операции: [id, название, мин. ранг, риск, награда (в ВВП на душу), репутация, жар, нужно в банде]
  const OPS = [
    ["pick", "Карманная кража на рынке", -1, 0.12, [0.02, 0.08], 3, 5, false, 14],
    ["fake", "Продавать подделки", -1, 0.1, [0.08, 0.3], 4, 6, false, 15],
    ["car", "Угнать машину", -1, 0.22, [0.3, 0.9], 8, 14, false, 16],
    ["pyramid", "Запустить финансовую пирамиду", -1, 0.2, [2, 8], 10, 30, false, 20],
    ["hack", "Взломать банк", -1, 0.25, [3, 15], 15, 35, false, 18],
    ["task", "Выполнить поручение «старших»", 0, 0.05, [0.15, 0.5], 9, 6, true, 14],
    ["deal", "Крупное дело: {goods}", 1, 0.11, [1, 3.5], 16, 15, true, 16],
    ["bribe", "Подкупить полицию", 1, 0, [0, 0], 1, -28, true, 18],
    ["war", "Разборки с конкурентами", 2, 0.08, [1, 4], 35, 18, true, 18],
    ["casino", "Открыть подпольное казино", 2, 0.12, [2, 6], 20, 18, true, 21],
    ["launder", "Отмыть деньги через бизнес", 1, 0, [0, 0], 2, -22, true, 18],
    ["special", "{special}", 4, 0.15, [10, 40], 60, 30, true, 25],
    ["low", "Залечь на дно", -1, 0, [0, 0], -4, -30, false, 14],
    ["coup", "Занять место главы", 4, 0.2, [0, 0], 0, 20, true, 25],
    ["quit", "Завязать с криминалом", 0, 0, [0, 0], 0, 0, true, 14],
  ];
  const SPECIAL = { cartel: "Построить подводную лодку для «бананов»", mafia: "Сделать предложение, от которого нельзя отказаться", yakuza: "Подмять под себя все патинко района",
    triad: "Наладить поставки сумок «Пуччи» в три страны", bratva: "Приватизировать завод за ваучеры", syndicate: "Подкупить сенатора", gang: "Ограбить поезд с виски",
    marseille: "Увести яхту миллиардера с Ривьеры", schemes: "Вывести миллиард в офшор", smugglers: "Провести караван через три границы" };
  CR.opsFor = function (c) {
    const cr = c.crime, out = [];
    for (const [id, lbl, rank, risk, rew, rep, heat, inOrg, age] of OPS) {
      if (c.age < age) continue;
      if (inOrg && !cr.on) continue;
      if (inOrg && cr.rank < rank) continue;
      if (id === "launder" && !c.biz) continue;
      if (id === "pyramid" && c.iq < 45) continue;
      if (id === "hack" && c.iq < 65 && !(c.job && c.job.f === "it")) continue;
      if (id === "coup" && (cr.rank !== 4 || cr.rep < REP_RANK[5])) continue;
      if (id === "low" && cr.heat < 10) continue;
      const label = B8.fmt(c, lbl, { goods: CR.goods(c), special: SPECIAL[CR.type(c)] });
      const p = CR.success(c, id, risk);
      out.push({ id, label, p: Math.round(p * 100), risk, cost: id === "bribe" ? B8.gdp(c) * (0.4 + cr.rank * 0.5) : 0 });
    }
    return out;
  };
  CR.success = function (c, id, risk) {
    const cr = c.crime;
    if (id === "bribe" || id === "launder" || id === "low" || id === "quit") return 1;
    let p = 0.72 - risk + cr.rank * 0.04 + (c.luck - 50) / 400 + (c.iq - 50) / (id === "hack" || id === "pyramid" ? 200 : 600) - cr.heat / 400;
    if (id === "war" || id === "coup") p = 0.45 + cr.rank * 0.05 + (c.h - 60) / 300 + (c.luck - 50) / 300;
    return clamp(p, 0.08, 0.95);
  };
  // выполнить операцию → { text, kind }
  CR.doOp = function (c, id) {
    const op = OPS.find((o) => o[0] === id), cr = c.crime;
    const [, , , risk, rew, rep, heat] = op;
    const gdp = B8.gdp(c), d = { goods: CR.goods(c), special: SPECIAL[CR.type(c)] };
    c.ya.crime = (c.ya.crime || 0) + 1;
    cr.ops += 1;
    if (id === "low") { cr.heat -= 30; cr.rep = Math.max(0, cr.rep - 4); return res(c, "Ты залег[|ла] на дно: никаких дел, никаких звонков. Полиция потеряла к тебе интерес.", "n"); }
    if (id === "quit") {
      if (cr.rank >= 3 && R.r(c) < 0.35) { cr.heat += 10; c.st += 20; return res(c, "«Из семьи не уходят», — сказали тебе вежливо. Слишком вежливо. Пришлось остаться.", "b"); }
      CR.leave(c); c.hap += 5; c.st -= 10; return res(c, "Ты завязал[|а]. Старые знакомые больше не звонят. Спится лучше.", "g");
    }
    if (id === "bribe") {
      const cost = gdp * (0.4 + cr.rank * 0.5);
      if (c.money < cost) return res(c, "Не хватило денег на «подарок» нужным людям.", "b");
      c.money -= cost;
      const hon = K(c).hdi > 0.85 ? 0.45 : 0.85;
      if (R.r(c) < hon) { cr.heat -= 28; return res(c, `Нужный человек получил конверт (${B8.money(cost)}). Твоё дело потерялось в архиве.`, "g"); }
      cr.heat += 25; return res(c, "Полицейский оказался честным. Конверт приобщили к делу.", "b");
    }
    if (id === "launder") {
      const x = Math.min(c.biz.val * 0.1, gdp * (1 + cr.rank));
      cr.heat -= 22; c.biz.val += x * 0.5;
      return res(c, `Деньги прошли через «${c.biz.name}» и вышли чистыми. По документам — небывалый спрос.`, "g");
    }
    const p = CR.success(c, id, risk);
    if (R.r(c) < p) {
      let sum = gdp * (rew[0] + R.r(c) * (rew[1] - rew[0])) * (1 + cr.rank * 0.25);
      c.money += sum; cr.earned += sum; cr.rep += rep; cr.heat += heat;
      if (id === "coup") { cr.rank = 5; B8.turn(c, CR.rankTitle(c)); if (B8.voice) B8.voice(c, "boss"); if (B8.paper) B8.paper(c, `Новый хозяин теневого мира: ${cr.orgName} сменила главу`, "источники в полиции"); return res(c, `Старый глава ушёл «на пенсию». Теперь ${cr.orgName} — твои. Ты — ${CR.rankTitle(c)}.`, "g", true); }
      if (id === "war") { c.h -= R.int(c, 0, 10); }
      if (cr.on) rankUp(c);
      const T = {
        pick: "Кошелёк туриста стал твоим ({sum}). Совесть пока молчит.", fake: "Подделки разлетелись за неделю. Выручка — {sum}.", car: "Машина ушла перекупщикам за {sum}.",
        pyramid: "Вкладчики несут деньги. Ты выплачиваешь старым из денег новых. Пока всё работает: {sum}.", hack: "Ты взломал[|а] банк и вывел[|а] {sum}. Банк пока делает вид, что ничего не случилось.",
        task: "Поручение выполнено. «Старшие» довольны: {sum}.", deal: "Партия ({goods}) дошла до покупателя. Твоя доля — {sum}.", war: "Конкуренты отступили. Район теперь ваш. Доля — {sum}.",
        casino: "Подпольное казино открылось в подвале прачечной. Первые {sum} — твои.", special: "{special} — удалось! Об этом будут рассказывать легенды. Доля — {sum}.",
      };
      return res(c, B8.fmt(c, T[id] || "Дело сделано: {sum}.", Object.assign(d, { sum })), "g");
    }
    // провал
    cr.heat += heat * 1.5;
    if (id === "war" || id === "coup") {
      c.h -= R.int(c, 15, 35); c.hit = "разборки";
      if (R.r(c) < (id === "coup" ? 0.3 : 0.12) * (1.2 - c.luck / 100)) { B8.die(c, "разборки"); return res(c, "Разборки закончились плохо. Для тебя — навсегда.", "b"); }
      cr.rep = Math.max(0, cr.rep - 20);
      return res(c, id === "coup" ? "Переворот не удался. Тебя понизили и долго не забудут." : "Конкуренты оказались сильнее. Ты еле унёс[|ла] ноги.", "b");
    }
    const arrest = clamp(risk * 2.2 + cr.heat / 160, 0.05, 0.9);
    if (R.r(c) < arrest) {
      const yrs = { pick: 1, fake: 2, car: 3, pyramid: 6, hack: 7, task: 2, deal: 7, casino: 4, special: 12 }[id] || 3;
      CR.arrest(c, yrs + R.int(c, 0, 2), { pick: "кража", fake: "торговля подделками", car: "угон", pyramid: "мошенничество", hack: "взлом банка", task: "соучастие", deal: "контрабанда", casino: "незаконные азартные игры", special: "дело всей жизни" }[id] || "преступление");
      return res(c, "Не повезло: на месте ждала полиция.", "b");
    }
    return res(c, "Дело сорвалось. Ты успел[|а] скрыться, но полиция теперь знает твоё лицо.", "b");
  };
  function res(c, text, kind, big) { const t = say(c, text, kind, "", !!big); return { text: t, kind }; }

  // ═════════════════ БИЗНЕС ═════════════════
  // [id, название, стартовый капитал (в ВВП на душу), средняя маржа, разброс, условие]
  const MUS = (k) => k.rel[0][0] === "isl";
  const KINDS = [
    ["cafe", "кафе", 1.5, 0.12, 0.18], ["shop", "магазин", 1.2, 0.1, 0.12], ["bakery", "пекарня", 1, 0.11, 0.12], ["auto", "автосервис", 1.5, 0.12, 0.14],
    ["beauty", "салон красоты", 1, 0.11, 0.15], ["it", "IT-стартап", 2, 0.02, 0.6, (c) => c.iq >= 55], ["travel", "турагентство", 1, 0.09, 0.22],
    ["fitness", "фитнес-клуб", 2, 0.1, 0.15], ["build", "строительная фирма", 3, 0.13, 0.25], ["logist", "логистическая компания", 3, 0.11, 0.15],
    ["clinic", "частная клиника", 4, 0.14, 0.1, (c) => c.edu >= 3], ["school", "языковая школа", 1, 0.1, 0.1, (c) => c.edu >= 2], ["farm", "ферма", 1, 0.08, 0.2, (c) => !c.urban],
    ["hotel", "отель", 6, 0.12, 0.2], ["blog", "агентство блогеров", 0.5, 0.05, 0.5],
    ["winery", "винодельня", 4, 0.1, 0.2, (c) => "FR IT ES PT CL AR AU ZA GR US".includes(c.cur)], ["tea", "чайная плантация", 2, 0.1, 0.18, (c) => "IN LK KE CN".includes(c.cur)],
    ["coffee", "кофейная плантация", 2, 0.1, 0.2, (c) => "CO BR ET VN".includes(c.cur)], ["sushi", "суши-бар", 1.5, 0.12, 0.15, (c) => c.cur === "JP"],
    ["shawarma", "шаурмичная", 0.8, 0.13, 0.12, (c) => "TR EG IQ SA IL RU KZ UZ DE MA DZ UA".includes(c.cur)], ["factory", "фабрика", 8, 0.11, 0.18, (c) => "CN VN BD IN ID TR MX PL".includes(c.cur)],
    ["casino", "казино", 20, 0.18, 0.12, (c) => K(c).cas === "L" || K(c).cas === "Z"],
  ];
  const BIZ_NAMES = {
    cafe: ["Кафе «У {name}»", "«Добрая чашка»", "«{city}-кафе»"], shop: ["Магазин «Всё для всех»", "«{sur} и сыновья»", "Лавка «Добрый день»"], bakery: ["Пекарня «Тёплый хлеб»", "«Булочная {name}»"],
    auto: ["Автосервис «Шестерёнка»", "«{sur}-Моторс»"], beauty: ["Салон «Шарм»", "Студия «Ты красотка»"], it: ["Стартап «Облако»", "«{sur}Тех»", "«НейроКот»"],
    travel: ["Агентство «Чемодан»", "«Вокруг света с {name}»"], fitness: ["Клуб «Железо»", "«Фит-{city}»"], build: ["«{sur}-Строй»", "«Кирпич и сыновья»"], logist: ["«{sur} Логистик»", "«Быстрая коробка»"],
    clinic: ["Клиника доктора {sur}", "«Здоровье Плюс»"], school: ["Школа языков «Полиглот»"], farm: ["Ферма «{sur}»", "«Зелёные акры»"], hotel: ["Отель «{city} Палас»", "«Гранд {sur}»"],
    blog: ["Агентство «Лайк»", "«Хайп-фабрика»"], winery: ["Винодельня «{sur}»", "«Шато {sur}»"], tea: ["Плантация «Зелёный лист»"], coffee: ["Плантация «Чёрное золото»"], sushi: ["Суши-бар «Волна»"],
    shawarma: ["Шаурмичная «Империя»", "«Шаурма у {name}»"], factory: ["Фабрика «{sur} Индастриз»"], casino: ["Казино «Золотая фишка»", "«Рояль {city}»"],
  };
  const BZ = (B8.biz = { KINDS });
  BZ.LVL = ["", "одна точка", "небольшая сеть", "компания", "корпорация", "империя"];
  const LVL_V = [0, 0, 6, 30, 150, 800];
  BZ.kinds = function (c) {
    return KINDS.filter((x) => (!x[5] || x[5](c)) && !(x[0] === "winery" && (MUS(K(c)) || c.rel === "isl"))).map((x) => ({ id: x[0], n: x[1], cap: B8.gdp(c) * x[2] }));
  };
  BZ.open = function (c, id, quiet) {
    const x = KINDS.find((k) => k[0] === id), cap = B8.gdp(c) * x[2];
    if (c.money < cap) return { text: "Не хватает денег: нужно " + B8.money(cap) + ".", kind: "b" };
    c.money -= cap;
    const nm = B8.fmt(c, R.pick(c, BIZ_NAMES[id] || ["«{sur}»"]), { sur: c.sur });
    c.biz = { id, kind: x[1], name: nm.replace(/^[«"]|[»"]$/g, ""), val: cap, lvl: 1, y: 0, hype: 0, mgr: false, best: cap, profit: 0 };
    if (c.job) c.job = null;
    B8.turn(c, "свой бизнес: " + x[1]);
    const rr = res(c, `Ты открыл[|а] свой бизнес — ${x[1]} «${c.biz.name}». Вложено ${B8.money(cap)}.`, "g", true);
    B8.scene(c, "biz");
    return rr;
  };
  BZ.year = function (c) {
    const b = c.biz;
    if (!b || c.jail) return 0;
    const x = KINDS.find((k) => k[0] === b.id), ec = B8.econ(c);
    b.y += 1;
    let r = x[3] + 0.03 * ec + (c.iq - 50) / 1000 + c.sk / 2500 + b.hype / 600 + R.gauss(c, 0, x[4]);
    if (b.id === "travel") r += 0.04 * ec;
    if (b.mgr) r *= 0.8;
    const profit = b.val * r;
    b.val = Math.max(0, b.val * (1 + 0.03 * ec + R.gauss(c, 0, x[4] / 3)) + profit * 0.35);
    b.hype *= 0.6; b.profit = profit;
    b.best = Math.max(b.best, b.val);
    const gdp = B8.gdp(c);
    while (b.lvl < 5 && b.val >= gdp * LVL_V[b.lvl + 1]) { b.lvl++; say(c, `«${b.name}» вырос[ло|ло] до уровня «${BZ.LVL[b.lvl]}».`.replace("вырос[ло|ло]", "вырос"), "g", "рост бизнеса", true); if (b.lvl >= 4) B8.turn(c, "бизнес: " + BZ.LVL[b.lvl]); }
    if (b.val < gdp * x[2] * 0.12 && b.y > 1) { c.pend.unshift({ id: "biz_crisis", d: {} }); }
    if (!b.mgr) B8.stress(c, 3 + b.lvl, "свой бизнес");
    return profit > 0 ? profit * 0.6 : profit;
  };
  BZ.close = function (c, ratio, why) {
    const b = c.biz, got = b.val * ratio;
    c.money += got; c.biz = null;
    return res(c, `Бизнес «${b.name}» ${why}. Ты получил[|а] ${B8.money(got)}.`, ratio >= 0.9 ? "g" : "n", true);
  };
  // действия владельца
  BZ.acts = function (c) {
    const b = c.biz, gdp = B8.gdp(c);
    if (!b) return [];
    const out = [];
    out.push({ id: "invest", label: "Вложить ещё " + B8.money(Math.max(gdp * 0.5, c.money * 0.3)), ok: c.money > gdp * 0.5 });
    out.push({ id: "ads", label: "Рекламная кампания (" + B8.money(b.val * 0.05) + ")", ok: c.money > b.val * 0.05 });
    if (b.lvl < 5) out.push({ id: "expand", label: `Расшириться до «${BZ.LVL[b.lvl + 1]}» (` + B8.money(b.val * 0.4) + ")", ok: c.money > b.val * 0.4 });
    out.push({ id: "mgr", label: b.mgr ? "Уволить управляющего — рулить самому" : "Нанять управляющего (меньше стресса, меньше прибыли)", ok: true });
    if (b.lvl >= 4) out.push({ id: "ipo", label: "Выйти на биржу (IPO)", ok: !b.ipo });
    out.push({ id: "sell", label: "Продать бизнес (~" + B8.money(b.val) + ")", ok: true });
    return out;
  };
  BZ.act = function (c, id) {
    const b = c.biz, gdp = B8.gdp(c);
    c.ya["biz_" + id] = 1;
    if (id === "invest") { const x = Math.max(gdp * 0.5, c.money * 0.3); c.money -= x; b.val += x * 0.9; return res(c, `Ты вложил[|а] в «${b.name}» ещё ${B8.money(x)}.`, "n"); }
    if (id === "ads") { const x = b.val * 0.05; c.money -= x; b.hype += 25; return res(c, R.r(c) < 0.7 ? `Реклама «${b.name}» висит на каждом углу. Клиентов стало больше.` : `Реклама вышла с опечаткой и стала мемом. Клиентов всё равно стало больше.`, "g"); }
    if (id === "expand") {
      const x = b.val * 0.4; c.money -= x;
      if (R.r(c) < 0.75 + (c.sk - 50) / 300) { b.val = b.val * 1.55 + x; return res(c, `«${b.name}» открывает новые точки. Работы стало вдвое больше, но это того стоит.`, "g"); }
      b.val += x * 0.3; B8.stress(c, 10, "неудачное расширение"); return res(c, "Расширение не задалось: новые точки пустуют. Деньги ушли в аренду.", "b");
    }
    if (id === "mgr") { b.mgr = !b.mgr; return res(c, b.mgr ? "Ты нанял[|а] управляющего. Теперь можно иногда спать." : "Ты снова сам[|а] у руля.", "n"); }
    if (id === "ipo") { b.ipo = 1; const x = b.val * 0.6; c.money += x; b.val *= 1.2; B8.turn(c, "IPO"); if (B8.paper) B8.paper(c, `Акции «${b.name}» взлетели в первый же день торгов`, "биржевая сводка"); return res(c, `IPO! Акции «${b.name}» торгуются на бирже. Ты получил[|а] ${B8.money(x)}, и компания всё ещё твоя.`, "g", true); }
    if (id === "sell") { const ratio = 0.75 + R.r(c) * 0.45; return BZ.close(c, ratio, "продан"); }
    return { text: "", kind: "n" };
  };

  // ═════════════════ КАЗИНО ═════════════════
  const CS = (B8.casino = {});
  CS.minAge = (c) => (c.cur === "US" ? 21 : 18);
  // где можно сыграть
  CS.access = function (c) {
    const k = K(c);
    if (c.age < CS.minAge(c)) return { ok: false, why: `В казино пускают с ${CS.minAge(c)} лет.` };
    if (c.jail) return { ok: false, why: "В тюрьме играют только на сигареты." };
    const out = [];
    const gdp = k.gdp;
    if (k.cas === "L") out.push({ id: "local", label: "Казино в городе " + c.city, cost: 0, risk: 0 });
    if (k.cas === "Z") out.push({ id: "zone", label: "Поехать: " + k.casz, cost: gdp * 0.04, risk: 0 });
    if (k.cas === "F" && c.emig) out.push({ id: "local", label: "Казино для иностранцев", cost: 0, risk: 0 });
    if (k.cas === "B" || (k.cas === "F" && !c.emig)) out.push({ id: "under", label: "Подпольное казино (рискованно)", cost: 0, risk: 0.1 });
    if (c.ls >= 3 || c.money > gdp * 3) out.push({ id: "trip", label: c.cur === "US" ? "Слетать в Макао" : "Слетать в Лас-Вегас", cost: gdp * 0.35, risk: 0 });
    if (!out.length) return { ok: false, why: "Тут негде играть." };
    return { ok: true, list: out, note: k.cas === "B" ? "В стране казино запрещены." : k.cas === "F" ? "Местных в казино не пускают — только иностранцев." : "" };
  };
  CS.enter = function (c, place) {
    c.ya.casino = (c.ya.casino || 0) + 1;
    c.money -= place.cost;
    c.cas.visits += 1; c.cas.add += 4; c.cas.yv = 1;
    c.cas.session = { place: place.id, start: c.money, rounds: 0 };
    if (place.risk && R.r(c) < place.risk) {
      const fine = B8.gdp(c) * 0.3;
      c.money -= fine; c.crime.heat += 15; c.cas.session = null;
      return { raid: true, text: say(c, `Облава в подпольном казино! Штраф ${B8.money(fine)} и неприятный разговор в отделении.`, "b") };
    }
    return { raid: false };
  };
  CS.leave = function (c) {
    const s = c.cas.session;
    if (!s) return null;
    const diff = c.money - s.start;
    c.cas.session = null;
    if (diff > 0) c.cas.won += diff; else c.cas.lost -= diff;
    if (diff < -B8.gdp(c) * 0.5) { c.cas.add += 8; B8.stress(c, 8, "проигрыш в казино"); }
    const t = !s.rounds ? "Ты зашёл в казино, посмотрел[|а] на огни — и ушёл ни с чем. Мудро.".replace("зашёл", c.sex === "f" ? "зашла" : "зашёл").replace("ушёл", c.sex === "f" ? "ушла" : "ушёл")
      : diff > 0 ? `Вечер в казино: выигрыш ${B8.money(diff)}.` : diff < 0 ? `Вечер в казино: проигрыш ${B8.money(-diff)}.` : "Вечер в казино: остал[ся|ась] при своих.";
    return { diff, text: say(c, t, diff > 0 ? "g" : diff < 0 ? "b" : "n") };
  };
  CS.bets = function (c) {
    const gdp = B8.gdp(c), m = Math.max(0, c.money);
    const min = Math.max(1, Math.round(gdp * 0.005));
    const set = [min, Math.round(m * 0.02), Math.round(m * 0.1), Math.round(m * 0.3), Math.round(m)].filter((x, i, a) => x >= min && x <= m && a.indexOf(x) === i);
    return set;
  };
  function settle(c, bet, mult) { const s = c.cas.session; if (s) s.rounds++; const win = Math.round(bet * mult) - bet; c.money += win; if (mult >= 30 && bet > B8.gdp(c) * 0.05) { c.cas.big = 1; } return win; }
  // рулетка (европейская, один ноль)
  const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  CS.isRed = (n) => RED.includes(n);
  CS.roulette = function (c, bet, kind, val) {
    const n = Math.floor(R.r(c) * 37);
    let mult = 0;
    if (kind === "red" && CS.isRed(n)) mult = 2;
    if (kind === "black" && n && !CS.isRed(n)) mult = 2;
    if (kind === "even" && n && n % 2 === 0) mult = 2;
    if (kind === "odd" && n % 2 === 1) mult = 2;
    if (kind === "dozen" && n && Math.ceil(n / 12) === val) mult = 3;
    if (kind === "num" && n === val) mult = 36;
    return { n, mult, win: settle(c, bet, mult) };
  };
  // слоты: три барабана
  CS.SYM = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
  const SW = [30, 24, 18, 12, 6, 3], PAY3 = [7, 10, 18, 40, 150, 500];
  CS.slots = function (c, bet) {
    const pick = () => { let x = R.r(c) * 93; for (let i = 0; i < 6; i++) { x -= SW[i]; if (x <= 0) return i; } return 0; };
    const r = [pick(), pick(), pick()];
    let mult = 0;
    if (r[0] === r[1] && r[1] === r[2]) mult = PAY3[r[0]];
    else if (r.filter((x) => x === 0).length === 2) mult = 2;
    else if (r[0] === r[1] || r[1] === r[2]) mult = r[1] >= 3 ? 2 : 1;
    return { r: r.map((i) => CS.SYM[i]), mult, win: settle(c, bet, mult) };
  };
  // кости: две кости, «больше 7», «меньше 7», «ровно 7»
  CS.dice = function (c, bet, kind) {
    const a = R.int(c, 1, 6), b = R.int(c, 1, 6), s = a + b;
    let mult = 0;
    if (kind === "hi" && s > 7) mult = 2.3;
    if (kind === "lo" && s < 7) mult = 2.3;
    if (kind === "seven" && s === 7) mult = 5.5;
    return { a, b, s, mult, win: settle(c, bet, mult) };
  };
  // блэкджек: дилер берёт до 17, блэкджек платит 3:2
  const draw = (c) => Math.min(10, R.int(c, 1, 13));
  CS.bjScore = (h) => { let s = h.reduce((a, b) => a + b, 0); if (h.includes(1) && s + 10 <= 21) s += 10; return s; };
  CS.bjStart = function (c, bet) { const g = { bet, p: [draw(c), draw(c)], d: [draw(c), draw(c)], done: false }; if (CS.bjScore(g.p) === 21) return CS.bjEnd(c, g); return g; };
  CS.bjHit = function (c, g) { g.p.push(draw(c)); if (CS.bjScore(g.p) > 21) { g.done = true; g.res = "bust"; g.win = settle(c, g.bet, 0); } return g; };
  CS.bjEnd = function (c, g) {
    const ps = CS.bjScore(g.p);
    while (CS.bjScore(g.d) < 17) g.d.push(draw(c));
    const ds = CS.bjScore(g.d);
    let mult;
    if (ps === 21 && g.p.length === 2) { mult = ds === 21 && g.d.length === 2 ? 1 : 2.5; g.res = mult > 1 ? "bj" : "push"; }
    else if (ds > 21 || ps > ds) { mult = 2; g.res = "win"; }
    else if (ps === ds) { mult = 1; g.res = "push"; }
    else { mult = 0; g.res = "lose"; }
    g.done = true; g.win = settle(c, g.bet, mult);
    return g;
  };
  CS.year = function (c) {
    const s = c.cas;
    if (!s.yv) s.add = Math.max(0, s.add - 8); else s.add += 3;
    s.yv = 0;
    if (s.add >= 60 && !c.conds.gambling) { c.conds.gambling = c.age; say(c, "Казино снится по ночам. Ты врёшь близким, куда уходят деньги. Это зависимость.", "b", "слишком частые походы в казино", true); B8.turn(c, "игровая зависимость"); }
    if (c.conds.gambling && s.add < 25) { delete c.conds.gambling; say(c, "Тяга к игре отпустила. Ты свободн[ый|ая].".replace("свободн[ый|ая]", c.sex === "f" ? "свободна" : "свободен"), "g", "", true); c.flags.cured_gambling = 1; }
  };

  // ═════════════════ ДЕЛА ═════════════════
  // список доступных дел для экрана «Дела»
  const A = (B8.acts = {});
  A.groups = function (c) {
    const g = [], gdp = B8.gdp(c), a = c.age;
    const once = (id) => !c.ya[id];
    const it = (id, icon, label, hint, ok = true, why = "") => ({ id, icon, label, hint, ok: ok && once(id), why: ok ? (once(id) ? "" : "уже в этом году") : why });
    if (!c.alive) return g;
    if (a < 3) { g.push(["Малыш", [it("cry", "😭", "Плакать погромче", "родители прибегут"), it("sleep", "😴", "Поспать", "Здоровье↑"), it("smile", "😊", "Улыбнуться бабушке", "Люди↑")]]); return g; }
    if (c.jail) return B8.prison.groups(c, it);
    if (c.fug) return B8.fug.groups(c, it);
    const me = [];
    if (a >= 6) me.push(it("focus", "🎯", "Фокус года", "на что тратишь время", true));
    me.push(it("doctor", "🩺", "Сходить к врачу", a >= 18 ? "стоит " + B8.money(gdp * 0.05) : "Здоровье↑", a < 18 || c.money >= gdp * 0.05, "нет денег"));
    if (a >= 8) me.push(it("gym", "🏃", a < 18 ? "Секция спорта" : "Спортзал", "Здоровье↑ Внешность↑"));
    if (c.rel !== "none" && a >= 6) me.push(it("pray", "🕯", "Сходить: " + B8.temple(c), "Стресс↓ Счастье↑"));
    if (a >= 12) me.push(it("meditate", "🧘", "Медитация и прогулки", "Стресс↓"));
    if (a >= 18) me.push(it("vacation", "🏝", "Отпуск", "стоит " + B8.money(gdp * 0.15), c.money >= gdp * 0.15, "нет денег"));
    if (a >= 18 && c.looks < 85) me.push(it("plastic", "💉", "Пластическая операция", "стоит " + B8.money(gdp * 0.8), c.money >= gdp * 0.8, "нет денег"));
    if (c.conds.gambling) me.push(it("rehab_g", "🫂", "Группа поддержки игроков", "лечит зависимость"));
    if (c.conds.drinking) me.push(it("rehab_d", "🫂", "Бросить пить", "сложно, но можно"));
    if (c.smoker) me.push(it("quit_smoke", "🚭", "Бросить курить", "шанс зависит от воли"));
    g.push(["Я", me]);
    const st = [];
    if (c.school) st.push(it("study_hard", "📖", "Учиться усерднее", "Ум↑ Стресс↑"));
    if (c.school && a >= 12) st.push(it("skip", "🛹", "Прогулять уроки", "Счастье↑ Ум↓"));
    if (!c.school && !c.uni && c.edu >= 2 && a >= 17 && a <= 45) st.push(it("uni", "🎓", "Поступить в университет", "4 года учёбы"));
    if (!c.uni && c.edu === 3 && a <= 50) st.push(it("master", "🎓", "Поступить в магистратуру", "2 года"));
    if (!c.school && c.edu < 2 && a >= 16 && a <= 60) st.push(it("evening", "🌙", "Вечерняя школа", "аттестат за 2 года"));
    if (c.uni) st.push(it("drop_uni", "🚪", "Бросить университет", "свобода, но без диплома"));
    if (a >= 18) st.push(it("course", "💻", "Онлайн-курсы", "Навыки↑ " + B8.money(gdp * 0.03), c.money >= gdp * 0.03, "нет денег"));
    if (st.length) g.push(["Учёба", st]);
    const wk = [];
    if (a >= 16 && !c.school && !c.uni && !c.retired) {
      if (!c.job && !c.biz) wk.push(it("jobs", "🔎", "Искать работу", "3 вакансии"));
      if (c.job) { wk.push(it("work_hard", "💪", "Работать сверхурочно", "Навыки↑ Стресс↑")); wk.push(it("raise", "📈", "Попросить повышения", "зависит от навыков")); wk.push(it("quit", "🚪", "Уволиться", "")); wk.push(it("jobs", "🔎", "Сменить работу", "3 вакансии")); }
      if (c.hobby && c.hobbyL >= 40) wk.push(it("hobby_gig", "🎤", "Заработать на увлечении", B8.HOBBIES[c.hobby][0]));
    }
    if (c.school && a >= 14 && a < 18) wk.push(it("parttime", "🧃", "Подработка", "немного денег"));
    if (a >= 60 && c.job) wk.push(it("retire", "🌅", "Уйти на пенсию", ""));
    if (wk.length) g.push(["Работа", wk]);
    const lv = [];
    if (a >= 3) lv.push(it("parents", "👪", "Провести время с родителями", "Отношения↑", c.mother.alive || c.father.alive, "родителей нет"));
    if (a >= 5) lv.push(it("friends", "🤝", c.friend ? "Встретиться: " + c.friend.n.split(" ")[0] : "Найти друга", "Отношения↑"));
    if (a >= 15 && !(c.spouse && c.spouse.alive)) lv.push(it("dating", "💘", c.date ? "Свидание: " + c.date.n.split(" ")[0] : "Ходить на свидания", "любовь"));
    if (a >= 18 && c.date && !(c.spouse && c.spouse.alive)) lv.push(it("propose", "💍", "Сделать предложение", c.date.n));
    if (c.spouse && c.spouse.alive) { lv.push(it("spouse", "❤️", "Время с " + (c.spouse.sex === "f" ? "женой" : "мужем"), "Отношения↑ Стресс↓")); lv.push(it("divorce", "💔", "Развестись", "")); }
    if (c.spouse && c.spouse.alive && a >= 18 && a <= (c.sex === "f" ? 45 : 60)) lv.push(it("baby", "👶", "Завести ребёнка", "", c.kids.length < 12));
    if (c.kids.some((k) => k.alive)) lv.push(it("kids", "🧒", "Время с детьми", "Отношения↑ Счастье↑"));
    if (a >= 18 && !(c.spouse && c.spouse.alive)) lv.push(it("adopt", "🏡", "Усыновить ребёнка", "нужен достаток", c.ls >= 2, "нужен уровень жизни «комфортно»"));
    if (a >= 12) lv.push(it("post", "📱", "Пост в соцсети", c.sm.f ? B8.social.fmtF(c.sm.f) + " · подписчики" : "вдруг станешь звездой"));
    const petsAlive = (c.pets || []).filter((p) => p.alive);
    if (a >= 5 && petsAlive.length < 3) lv.push(it("pet", "🐾", a < 18 ? "Уговорить родителей на питомца" : "Завести питомца", "друг на годы", a < 18 || c.money >= gdp * 0.02, "нужно " + B8.money(gdp * 0.02)));
    if (petsAlive.length) lv.push(it("petplay", "🐾", "Время с питомцем", petsAlive.map((p) => p.n).join(", ")));
    g.push(["Люди", lv]);
    const mn = [];
    if (a >= 18) {
      if (!c.a.car) mn.push(it("car", "🚗", "Купить машину", B8.money(gdp * 0.35), c.money >= gdp * 0.35, "нужно " + B8.money(gdp * 0.35)));
      else if (c.a.car < 2) mn.push(it("car2", "🏎", "Купить спорткар", B8.money(gdp * 3), c.money >= gdp * 3, "нужно " + B8.money(gdp * 3)));
      if (!c.a.home) mn.push(it("home", "🏠", "Купить жильё", "ипотека или сразу", c.money >= gdp * 1.2 || c.income > gdp * 0.8, "нужен первый взнос " + B8.money(gdp * 1.2)));
      else if (!c.a.mansion) mn.push(it("mansion", "🏰", "Купить особняк", B8.money(gdp * 25), c.money >= gdp * 25, "нужно " + B8.money(gdp * 25)));
      if (!c.a.yacht && c.money >= gdp * 40) mn.push(it("yacht", "🛥", "Купить яхту", B8.money(gdp * 40)));
      mn.push(it("invest", "📊", "Инвестировать", c.inv > 0 ? "в портфеле " + B8.money(c.inv) : "акции и фонды", c.money > gdp * 0.3, "мало денег"));
      if (c.inv > 0) mn.push(it("withdraw", "💵", "Забрать инвестиции", B8.money(c.inv)));
      mn.push(it("charity", "🎗", "Благотворительность", "Счастье↑", c.money > gdp * 0.2, "мало денег"));
      mn.push(it("lottery", "🎟", "Купить лотерейный билет", B8.money(gdp * 0.002), c.money > gdp * 0.002, ""));
    }
    if (mn.length) g.push(["Деньги", mn]);
    const bz = [];
    if (a >= 18) {
      if (c.biz) bz.push(it("biz", "🏢", "Мой бизнес: " + c.biz.name, BZ.LVL[c.biz.lvl] + " · " + B8.money(c.biz.val), true));
      else bz.push(it("biz_open", "🏪", "Открыть бизнес", "от " + B8.money(gdp * 0.5), c.money >= gdp * 0.5, "нужен стартовый капитал от " + B8.money(gdp * 0.5)));
      const acc = CS.access(c);
      if (a >= CS.minAge(c)) bz.push({ id: "casino", icon: "🎰", label: "Казино", hint: acc.ok ? acc.note || "рулетка, блэкджек, слоты, кости" : acc.why, ok: acc.ok && (c.ya.casino || 0) < 3, why: (c.ya.casino || 0) >= 3 ? "хватит на этот год" : acc.why || "" });
    }
    if (bz.length) g.push(["Бизнес и риск", bz]);
    if (a >= 14) {
      const cr = c.crime;
      g.push(["Тёмные дела", [{ id: "crime", icon: "🕶", label: cr.on ? `${cr.orgName}: ${CR.rankTitle(c)}` : "Тёмные дела", hint: cr.on ? "улики " + Math.round(cr.ev || 0) + "% · полиция " + Math.round(cr.heat) + "%" : (cr.ev || 0) > 5 ? "улики " + Math.round(cr.ev) + "% · полиция " + Math.round(cr.heat) + "%" : "делишки, ограбления и не только",
        ok: (c.ya.crime || 0) < 3, why: (c.ya.crime || 0) >= 3 ? "на этот год хватит" : "" }]]);
    }
    const mv = [];
    if (a >= 18 && !c.emig) mv.push(it("emigrate", "✈️", "Эмигрировать", "стоит " + B8.money(gdp * 0.5), c.money >= gdp * 0.5, "нужно " + B8.money(gdp * 0.5)));
    if (a >= 18) mv.push(it("move_city", "🏙", "Переехать в другой город", "новые знакомства"));
    if (B8.canTimeMachine(c)) mv.push(it("timemachine", "⏳", "Машина времени", "вернуться на 5 лет назад (раз за жизнь)"));
    if (mv.length) g.push(["Перемены", mv]);
    return g;
  };
  // выполнить простое дело → { text, kind } или { open: "jobs" | "biz" | "casino" | "crime" | "focus" | "uni" | "emigrate" | "bizopen" }
  A.run = function (c, id) {
    const gdp = B8.gdp(c), a = c.age, pr = (t, k) => res(c, t, k);
    const opens = { focus: 1, jobs: 1, biz: 1, biz_open: 1, casino: 1, crime: 1, emigrate: 1, home: 1, timemachine: 1, invest: 1, uni: 1, f_poster: 1 };
    if (opens[id]) return { open: id };
    if (["work_hard", "raise", "quit"].includes(id) && !c.job) return { text: "", kind: "n" };
    c.ya[id] = 1;
    switch (id) {
      case "cry": { c.hap += 2; c.soc += 1; return pr(R.pick(c, ["Ты закатил[|а] концерт. Мама прибежала, папа принёс бутылочку. Работает!", "Ты плакал[|а] так громко, что соседи принесли погремушку.", "Плач сработал: тебя взяли на ручки и носили весь вечер."]), "g"); }
      case "sleep": { c.h += 2; c.st -= 2; return pr(R.pick(c, ["Ты проспал[|а] четырнадцать часов. Рекорд семьи.", "Тебе снились молоко и облака. Ты проснул[ся|ась] счастлив[ым|ой].", "Ты уснул[|а] прямо в тарелке с кашей."]), "g"); }
      case "smile": { c.soc += 3; c.hap += 2; return pr(R.pick(c, ["Бабушка растаяла и рассказывает соседям, что ты самый умный ребёнок на свете.", "Ты улыбнул[ся|ась] дедушке. Он полчаса строил смешные рожицы в ответ."]), "g"); }
      case "doctor": {
        if (a >= 18) c.money -= gdp * 0.05;
        const found = Object.keys(c.conds).filter((k) => ["diabetes", "back", "cancer", "depression", "drinking"].includes(k));
        c.h += 4;
        if (c.conds.cancer && R.r(c) < 0.5) return { open: "cancer" };
        if (!found.length) return pr(R.pick(c, ["Врач сказал, что ты здоров[|а] как бык. Даже обидно.", "Анализы в норме. Врач посоветовал больше спать и меньше читать новости.", "Всё хорошо. Врач попросил автограф — перепутал[|а] с кем-то."]), "g");
        if (c.conds.depression && R.r(c) < 0.45) { delete c.conds.depression; c.hap += 10; return pr("Врач помог подобрать лечение. Депрессия начала отступать.", "g"); }
        if (c.conds.back) { c.h += 3; return pr("Врач прописал упражнения для спины. Стало полегче.", "g"); }
        return pr("Врач посмотрел анализы и посоветовал следить за собой.", "n");
      }
      case "gym": { c.h += 3; c.looks += 2; c.st -= 3; if (R.r(c) < 0.1) { c.h -= 6; return pr("Ты переусердствовал[|а] и потянул[|а] спину. Неделю ходил[|а] как робот.", "b"); } return pr(R.pick(c, a < 18 ? ["Тренер похвалил тебя перед всей секцией.", "Ты пробежал[|а] дальше всех в группе.", "После тренировок ты спишь как убит[ый|ая]."] : ["Ты стал[|а] сильнее. Футболки сидят иначе.", "Ты наконец понял[|а], зачем люди ходят в зал.", "В зале к тебе подошли спросить совета. Ты польщён[|ена]."].map((x) => x.replace("польщён[|ена]", c.sex === "f" ? "польщена" : "польщён"))), "g"); }
      case "pray": { c.st -= 8; c.hap += 3; c.soc += 1; return pr(R.pick(c, ["Ты сходил[|а]: {temple}. Внутри было тихо, и на душе — тоже.", "В месте, где молились ещё твои предки, тревоги кажутся меньше.", "После службы соседи позвали на обед. Ты не смог[|ла] отказаться."]), "g"); }
      case "meditate": { c.st -= 10; c.hap += 2; return pr(R.pick(c, ["Десять минут тишины в день — и мир стал чуть менее громким.", "Ты гулял[|а] без телефона. Оказывается, птицы поют.", "Ты медитировал[|а] и уснул[|а]. Считается."]), "g"); }
      case "vacation": { c.money -= gdp * 0.15; c.st -= 15; c.hap += 6; return pr(R.pick(c, ["Отпуск у моря. Ты впервые за год не проверял[|а] почту.", "Ты съездил[|а] в горы. Фотографий больше, чем воспоминаний, но всё равно хорошо.", "Отпуск в соседней стране: еда другая, люди те же, отдых — настоящий."]), "g"); }
      case "plastic": { c.money -= gdp * 0.8; if (R.r(c) < 0.85) { c.looks += 15; c.hap += 3; return pr("Операция прошла успешно. Зеркало теперь твой друг.", "g"); } c.looks -= 10; c.h -= 5; return pr("Операция прошла неудачно. Пришлось переделывать.", "b"); }
      case "rehab_g": { c.cas.add -= 25; c.st -= 5; return pr("В группе поддержки ты впервые сказал[|а] вслух: «Я не могу остановиться». Стало легче.", "g"); }
      case "rehab_d": { if (R.r(c) < 0.45) { delete c.conds.drinking; c.h += 6; c.hap += 5; return pr("Ты бросил[|а] пить. Первый трезвый Новый год был странным — и прекрасным.", "g"); } return pr("Попытка бросить сорвалась. Но ты попробуешь ещё.", "b"); }
      case "quit_smoke": { if (R.r(c) < 0.35 + (c.temper === "persistent" ? 0.2 : 0)) { c.smoker = false; c.h += 4; return pr("Ты бросил[|а] курить. Через месяц вернулся вкус еды.", "g"); } return pr("Ты продержал[ся|ась] две недели. Потом сорвал[ся|ась].", "b"); }
      case "study_hard": { c.iq += 3; c.st += 4; return pr(R.pick(c, ["Ты сидел[|а] над учебниками до ночи. Оценки поползли вверх.", "Учитель впервые назвал тебя «надеждой класса».", "Ты разобрал[ся|ась] в дробях. Мир стал понятнее."]), "g"); }
      case "skip": { c.hap += 4; c.iq -= 2; if (R.r(c) < 0.3) { c.st += 6; c.soc -= 2; return pr("Тебя поймали на прогуле. Родителей вызвали в школу.", "b"); } return pr("Вы с друзьями прогуляли уроки и весь день гуляли по {city}. Лучший день в году.", "g"); }
      case "evening": { c.flags.evening = 1; c.school = true; c.schoolY = 9; return pr("Ты пош[ёл|ла] в вечернюю школу. После работы — уроки. Тяжело, но аттестат того стоит.", "n"); }
      case "drop_uni": { c.uni = null; c.hap += 3; return pr("Ты бросил[|а] университет. Родители не разговаривали с тобой неделю.", "n"); }
      case "master": { c.uni = { y: 0, t: 4, abroad: false }; return pr("Ты поступил[|а] в магистратуру.", "g"); }
      case "course": { c.money -= gdp * 0.03; c.sk += 5; c.iq += 1; return pr(R.pick(c, ["Ты прош[ёл|ла] онлайн-курс и получил[|а] красивый сертификат.", "Курс оказался полезнее, чем ожидалось. Начальник заметил.", "Половину курса ты проспал[|а], но вторая половина того стоила."]), "g"); }
      case "work_hard": { c.sk += 4; B8.stress(c, 6, "переработки"); c.job.y += 0.5; if (R.r(c) < 0.25) return promote(c, "сверхурочная работа"); return pr("Ты работал[|а] по вечерам и выходным. Навыки растут, нервы — нет.", "n"); }
      case "raise": { if (R.r(c) < 0.15 + c.sk / 250 + (c.job.y > 3 ? 0.1 : 0) && c.job.lvl < 5) return promote(c, "смелость попросить"); if (R.r(c) < 0.15) { B8.loseJob(c, "конфликт с начальником"); return pr("Начальник воспринял просьбу как наглость. Тебя уволили.", "b"); } return pr("Начальник пообещал «вернуться к этому вопросу». Не вернулся.", "n"); }
      case "quit": { B8.loseJob(c, "увольнение"); c.st -= 5; return pr("Ты уволил[ся|ась]. Первое утро без будильника было волшебным.", "n"); }
      case "hobby_gig": { const x = gdp * (0.05 + c.hobbyL / 300); c.money += x; c.hap += 3; return pr(`Ты заработал[|а] на увлечении (${B8.HOBBIES[c.hobby][0]}): ${B8.money(x)}.`, "g"); }
      case "parttime": { const x = gdp * 0.04; c.money += x; c.st += 2; return pr(R.pick(c, ["Ты подрабатывал[|а] летом и купил[|а] себе первые наушники на свои деньги.", "Подработка в кафе: чаевые, мозоли и уверенность в себе.", "Ты раздавал[|а] листовки. Половину выбросил[|а], никому не говори."]), "g"); }
      case "retire": { c.retired = true; c.job = null; return pr("Ты уш[ёл|ла] на пенсию. Время теперь твоё.", "n"); }
      case "parents": { const p = c.mother.alive ? c.mother : c.father; p.rel = clamp((p.rel || 60) + 8); c.soc += 3; c.hap += 2; return pr(R.pick(c, a < 12 ? ["Вы с родителями ходили в парк. Ты катал[ся|ась] на плечах.", "Вечером вся семья смотрела мультфильмы.", "Папа учил тебя кататься на велосипеде. Колени разбиты, гордость — огромная."] : a < 18 ? ["Ты поговорил[|а] с родителями по душам. Оказывается, они тоже были подростками.", "Семейный ужин без телефонов. Неожиданно весело."] : ["Ты приехал[|а] к родителям. Мама собрала с собой столько еды, что хватило на месяц.", "Ты помог[|ла] родителям с ремонтом. Отец впервые сказал, что гордится тобой.", "Долгий разговор с родителями на кухне до полуночи."]), "g"); }
      case "friends": {
        if (!c.friend || !c.friend.alive) { const s = R.chance(c, 0.6) ? c.sex : c.sex === "m" ? "f" : "m"; c.friend = B8.person(c, s, "friend", R.int(c, -1, 1)); c.soc += 5; return pr("Новый друг — {p}. Вас познакомил{pp} случай.".replace("{pp}", "").replace("{p}", c.friend.n), "g"); }
        c.friend.rel = clamp((c.friend.rel || 60) + 8); c.soc += 3; c.st -= 3;
        return pr(R.pick(c, [`Ты и ${c.friend.n.split(" ")[0]} гуляли до утра.`, `${c.friend.n.split(" ")[0]} выслушал[[|а]] тебя и не дал[[|а]] советов. Именно то, что было нужно.`, `Ты и ${c.friend.n.split(" ")[0]} смотрели ${R.pick(c, ["футбол", "старые фильмы", "сериал"])} и ели всякую вкуснятину.`]).replace(/\[\[\|а\]\]/g, c.friend.sex === "f" ? "а" : ""), "g");
      }
      case "dating": return { open: "dating" };
      case "propose": return { open: "propose" };
      case "spouse": { c.spouse.rel = clamp((c.spouse.rel || 60) + 8); c.st -= 6; c.hap += 3; return pr(R.pick(c, ["Романтический ужин. Как в первый год.", "Вы весь вечер смеялись над старыми фотографиями.", "Вы уехали на выходные вдвоём. Мир подождёт."]), "g"); }
      case "divorce": return { open: "divorce" };
      case "baby": return { open: "baby" };
      case "kids": { c.hap += 4; c.soc += 2; c.st -= 3; return pr(R.pick(c, ["Вы с детьми строили шалаш из подушек. Шалаш победил.", "Ты учил[|а] ребёнка кататься на велосипеде. Твоя очередь гордиться.", "Семейная игра в настолки закончилась ссорой и смехом."]), "g"); }
      case "adopt": return { open: "adopt" };
      case "car": { c.money -= gdp * 0.35; c.a.car = 1; c.hap += 4; return pr("Ты купил[|а] машину. Теперь до работы — двадцать минут вместо полутора часов.", "g"); }
      case "car2": { c.money -= gdp * 3; c.a.car = 2; c.hap += 5; c.looks += 2; return pr("Спорткар! Соседи завидуют, полиция присматривается.", "g"); }
      case "mansion": { c.money -= gdp * 25; c.a.mansion = 1; c.a.mansionVal = gdp * 25; c.hap += 6; return pr("Ты купил[|а] особняк. В нём столько комнат, что ты в одной так и не был[|а].", "g"); }
      case "yacht": { c.money -= gdp * 40; c.a.yacht = 1; c.hap += 5; return pr("Ты купил[|а] яхту. Укачивает, но статус обязывает.", "g"); }
      case "withdraw": { c.money += c.inv; const x = c.inv; c.inv = 0; return pr(`Ты забрал[|а] из инвестиций ${B8.money(x)}.`, "n"); }
      case "charity": { const x = Math.max(gdp * 0.1, c.money * 0.1); c.money -= x; c.hap += 5; c.soc += 3; c.counts.charity = (c.counts.charity || 0) + x; return pr(`Ты пожертвовал[|а] ${B8.money(x)} — ${R.pick(c, ["детской больнице", "приюту для животных", "школе в деревне", "фонду помощи пожилым"])}.`, "g"); }
      case "lottery": { c.money -= gdp * 0.002; if (R.r(c) < 0.0015) { const x = gdp * 300; c.money += x; c.flags.lottery = 1; B8.turn(c, "джекпот в лотерее"); const rr = res(c, `ДЖЕКПОТ! Ты выиграл[|а] в лотерею ${B8.money(x)}!`, "g", true); B8.scene(c, "jackpot"); if (B8.paper) B8.paper(c, `Счастливчик из города {city} сорвал джекпот: ${B8.money(x)}. Билет купили «на сдачу»`, "лотерея"); return rr; } if (R.r(c) < 0.06) { const x = gdp * 0.05; c.money += x; return pr(`Билет выиграл ${B8.money(x)}. Мелочь, а приятно.`, "g"); } return pr(R.pick(c, ["Билет не выиграл. Как и все предыдущие.", "Не совпала ни одна цифра. Зато была надежда целую неделю.", "Мимо. Продавщица сказала, что следующий точно счастливый."]), "n"); }
      case "move_city": { const k = K(c); const nc = R.pick(c, k.cities.filter((x) => x !== c.city)) || c.city; c.city = nc; c.urban = true; c.st += 6; c.soc -= 4; if (c.friend) c.friend.close = false; return pr(`Ты переехал[|а] в ${nc}. Новые улицы, новые лица.`, "n"); }
      case "post": return B8.social.post(c);
      case "pet": return { open: "decide:pet_pick" };
      case "petplay": return B8.pets.play(c);
      default: if (B8.actRun && B8.actRun[id]) return B8.actRun[id](c); return { text: "", kind: "n" };
    }
  };
  function promote(c, why) {
    if (!c.job) return { text: "", kind: "n" };
    c.job.lvl = Math.min(5, c.job.lvl + 1); c.job.y = 0; c.hap += 5; B8.notePeak(c);
    if (c.job.lvl >= 4) B8.turn(c, B8.jobTitle(c));
    return res(c, "Повышение! Теперь ты — {job}.", "g", true);
  }
  B8.promote = promote;
  // свидания: найти пару (из той же культуры, иногда — из другой)
  A.findDate = function (c) {
    const s = c.sex === "m" ? "f" : "m";
    const other = R.r(c) < 0.08 ? B8.poolKey(B8.pickCountry(c).c, "none", () => R.r(c)) : null;
    const p = B8.person(c, s, "date", c.sex === "m" ? R.int(c, -2, 5) : R.int(c, -5, 2));
    if (other) p.n = B8.personName(c, s, other);
    p.looks = clamp(R.gauss(c, 50, 18)); p.rel = R.int(c, 40, 70);
    return p;
  };
  A.marry = function (c, p) {
    p = p || c.date || A.findDate(c);
    p.role = "spouse"; p.rel = Math.max(p.rel || 60, 65);
    c.spouse = p; c.date = null; c.hap += 10;
    B8.turn(c, "свадьба");
    const rr = res(c, `Свадьба! ${p.n} — теперь ${p.sex === "f" ? "твоя жена" : "твой муж"}. ${R.pick(c, ["Гуляли три дня.", "Танцевали до утра.", "Тётя опять плакала больше всех."])}`, "g", true);
    B8.scene(c, "wedding"); if (B8.voice) B8.voice(c, "wedding");
    return rr;
  };
  A.haveKid = function (c, adopted) {
    const s = R.chance(c, 0.51) ? "m" : "f";
    const P = B8.pool(c.pool);
    const first = R.pick(c, s === "m" ? P.m : P.f);
    let sur = c.sex === "m" ? B8.surMasc(c) : c.spouse ? lastSur(c.spouse.n, P) : B8.surMasc(c);
    if (s === "f") sur = B8.surFem(sur, P.fl);
    const n = P.fl.includes("F") ? sur + " " + first : first + " " + sur;
    const kid = { n, first, sex: s, role: "child", born: c.age, alive: true, died: -1, st: "", close: true, rel: 80, le: clamp(R.gauss(c, B8.lifeExp(K(c), s), 8), 30, 104), adopted: !!adopted };
    c.kids.push(kid); c.hap += 8;
    if (c.kids.length === 1) B8.turn(c, adopted ? "усыновление" : "рождение первого ребёнка");
    const firstKid = c.kids.length === 1;
    const rr = res(c, adopted ? `Ты усыновил[|а] ребёнка. ${first} — теперь часть семьи.` : `У тебя родил${s === "f" ? "ась дочь" : "ся сын"} — ${first}. Ты смотришь на ${s === "f" ? "неё" : "него"} и не веришь.`, "g", true);
    if (firstKid) { B8.scene(c, "baby"); if (B8.voice) B8.voice(c, "baby"); }
    return rr;
  };
  function lastSur(full, P) { const parts = full.split(" "); return P.fl.includes("F") ? parts[0] : parts.slice(1).join(" ").split(" ")[0]; }
  // эмиграция: 3 страны, где жить лучше
  A.destinations = function (c) {
    const k = K(c);
    const cand = B8.COUNTRIES.filter((d) => d.hdi > k.hdi + 0.05 && d.c !== c.cur);
    if (!cand.length) return [];
    const out = [];
    for (let i = 0; i < 12 && out.length < 3; i++) { const d = R.wpick(c, cand, (x) => (x.hdi - 0.5) ** 3 * Math.sqrt(x.pop)); if (!out.includes(d)) out.push(d); }
    return out;
  };
  A.emigrate = function (c, code, refugee) {
    const old = K(c), d = B8.K(code);
    if (!refugee) c.money -= old.gdp * 0.5;
    c.cur = code; c.emig = true; c.adapt = 3; c.urban = true; c.city = d.cities[0];
    B8.stress(c, 15, "эмиграция");
    if (c.job) c.job.lvl = Math.max(1, c.job.lvl - 1);
    if (c.biz) { const x = c.biz.val * 0.5; c.money += x; say(c, `Бизнес «${c.biz.name}» пришлось продать перед отъездом за ${B8.money(x)}.`, "n"); c.biz = null; }
    if (c.friend) c.friend.close = false;
    if (c.crime.on) { c.crime.on = false; c.crime.rank = 0; }
    c.le += (B8.lifeExp(d, c.sex) - B8.lifeExp(old, c.sex)) * 0.5;
    B8.turn(c, "эмиграция: " + d.n);
    const rr = res(c, `Ты ${refugee ? "бежал[|а]" : "переехал[|а]"}: ${d.n}, город ${d.cities[0]}. Всё чужое — язык, еда, правила.`, "n", true);
    B8.scene(c, "emig");
    return rr;
  };
  A.mortgage = function (c, cash) {
    const gdp = B8.gdp(c), price = gdp * (c.urban ? 6 : 3) * (1 + c.ls * 0.25);
    if (cash) { if (c.money < price) return res(c, "Не хватает денег.", "b"); c.money -= price; c.a.home = 1; c.a.homeVal = price; c.hap += 6; return res(c, `Ты купил[|а] жильё за ${B8.money(price)} — без долгов!`, "g", true); }
    const down = price * 0.2;
    if (c.money < down) return res(c, "Не хватает на первый взнос.", "b");
    c.money -= down; c.a.home = 1; c.a.homeVal = price; c.a.mort = 20; c.a.mpay = (price - down) * 0.075; c.hap += 5;
    return res(c, `Ты купил[|а] жильё в ипотеку: ${B8.money(price)}, на 20 лет. Теперь у тебя есть ключи и долг.`, "g", true);
  };
  A.invest = function (c, part) { const x = c.money * part; c.money -= x; c.inv += x; return res(c, `Ты вложил[|а] ${B8.money(x)} в акции и фонды.`, "n"); };
})();
