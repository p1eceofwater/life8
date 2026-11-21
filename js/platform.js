/* 1 из 8 миллиардов — связь с ВКонтакте (VK Mini Apps) и Яндекс Играми.
   Вне Яндекса всё здесь просто ничего не делает, и игра работает как обычный сайт. */
(function () {
  "use strict";
  const NF = (window.B8 = window.B8 || {});
  const P = (NF.platform = { name: "web", ysdk: null, player: null, lang: null, active: false, adOpen: false });
  const LANGS_OK = ["ru", "en"];
  // СНГ-языки Яндекса показываем по-русски, остальные — по-английски
  const MAP = { be: "ru", kk: "ru", uk: "ru", uz: "ru", ru: "ru", tr: "en" };

  P.isYandex = () => typeof window.YaGames !== "undefined";

  // ВКонтакте открывает мини-приложение с параметрами vk_app_id, vk_language и т.д.
  const QS = new URLSearchParams(location.search);
  P.isVK = () => QS.has("vk_app_id") || QS.has("vk_platform");
  const VK_LANG = { ru: "ru", uk: "ru", ua: "ru", be: "ru", kz: "ru", en: "en" };
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function initVK() {
    try {
      if (!window.vkBridge) await loadScript("https://unpkg.com/@vkontakte/vk-bridge@2/dist/browser.min.js");
      P.vk = window.vkBridge;
      await P.vk.send("VKWebAppInit");
      P.name = "vk";
      P.lang = VK_LANG[QS.get("vk_language")] || "ru";
      // свернули ВКонтакте — выключаем звук
      P.vk.subscribe((e) => {
        const t = e && e.detail && e.detail.type;
        if (t === "VKWebAppViewHide") NF.audio && NF.audio.suspend();
        if (t === "VKWebAppViewRestore" && !P.adOpen) NF.audio && NF.audio.resume();
      });
      P.vk.send("VKWebAppCheckNativeAds", { ad_format: "interstitial" }).catch(() => {});
      P.vk.send("VKWebAppCheckNativeAds", { ad_format: "reward" }).catch(() => {});
      return true;
    } catch (e) { console.warn("VK Bridge init failed", e); P.vk = null; return false; }
  }
  P.hasAds = () => !!(P.ysdk || P.vk) || !!(NF.ADMIN_FAKE_ADS && NF.ADMIN_FAKE_ADS());
  // ID пользователя ВК (из параметров запуска) — для админки и именных промокодов
  P.userId = () => parseInt(QS.get("vk_user_id") || "0", 10) || 0;
  P.platformTag = () => QS.get("vk_platform") || (P.ysdk ? "yandex" : "web");

  // ── приглашения друзей (ВКонтакте) ──
  // По правилам ВК (п. 2.6.2) за саму отправку приглашений ничего не даём.
  // Подарок получает новый игрок, который пришёл по приглашению друга.
  P.canInvite = () => !!P.vk;
  P.invite = function () {
    if (!P.vk) return Promise.resolve(false);
    return P.vk.send("VKWebAppShowInviteBox").then(() => true).catch(() => false);
  };
  // истории ВК работают только в мобильных приложениях ВКонтакте
  P.canStory = () => !!P.vk && /^mobile_(android|iphone)/.test(QS.get("vk_platform") || "");
  P.story = function (dataUrl) {
    if (!P.vk) return Promise.resolve(false);
    const app = QS.get("vk_app_id") || "";
    return P.vk.send("VKWebAppShowStoryBox", {
      background_type: "image", blob: dataUrl,
      attachment: { text: "go_to", type: "url", url: "https://vk.com/app" + app },
    }).then(() => true).catch(() => false); // закрыл редактор без публикации → ошибка
  };
  // запись на стене со ссылкой на игру
  P.canWall = () => !!P.vk;
  P.wallPost = function (message) {
    if (!P.vk) return Promise.resolve(false);
    const app = QS.get("vk_app_id") || "";
    return P.vk.send("VKWebAppShowWallPostBox", { message, attachments: "https://vk.com/app" + app }).then(() => true).catch(() => false);
  };
  // таблица лидеров ВК (очки друзей записывает сервер через secure.addAppEvent)
  P.canLeaderboard = () => !!P.vk;
  P.leaderboard = function (score) {
    if (!P.vk) return Promise.resolve(false);
    return P.vk.send("VKWebAppShowLeaderBoardBox", { user_result: score }).then(() => true).catch(() => false);
  };
  // впервые открыл игру из приглашения/уведомления или по ссылке vk.com/app…#invite
  P.cameByInvite = function () {
    if (!P.isVK()) return false;
    if (/invite/i.test(location.hash)) return true;
    const ref = QS.get("vk_ref") || "";
    return QS.get("vk_is_app_user") === "0" && /^(notifications|request)/.test(ref);
  };

  P.init = async function () {
    if (P.isVK()) return initVK();
    if (!P.isYandex()) return false;
    try {
      P.ysdk = await window.YaGames.init();
      P.name = "yandex";
      const l = (P.ysdk.environment && P.ysdk.environment.i18n && P.ysdk.environment.i18n.lang) || "en";
      P.lang = LANGS_OK.includes(l) ? l : MAP[l] || "en";
      try { P.player = await P.ysdk.getPlayer({ scopes: false }); } catch (e) { P.player = null; }
      return true;
    } catch (e) {
      console.warn("Yandex SDK init failed", e);
      return false;
    }
  };

  // игра загружена и с ней можно взаимодействовать
  P.ready = function () {
    try { P.ysdk && P.ysdk.features.LoadingAPI && P.ysdk.features.LoadingAPI.ready(); } catch (e) {}
  };

  // идёт ли сейчас геймплей (смена без открытых окон)
  P.setActive = function (on) {
    if (!P.ysdk || on === P.active) return;
    P.active = on;
    try {
      const g = P.ysdk.features.GameplayAPI;
      if (g) on ? g.start() : g.stop();
    } catch (e) {}
  };

  function adStart() { P.adOpen = true; P.setActive(false); NF.audio && NF.audio.suspend(); }
  function adEnd() { P.adOpen = false; NF.audio && NF.audio.resume(); }

  // полноэкранная реклама в естественной паузе (после смены). done() вызывается всегда.
  P.adLog = [];
  P.interstitial = function (done) {
    P.adLog.push({ k: "interstitial", t: Date.now() });
    if (!P.vk && !P.ysdk && NF.ADMIN_FAKE_ADS && NF.ADMIN_FAKE_ADS()) { NF.toast && NF.toast("📺 [тест] межстраничная реклама"); done && done(); return; }
    if (P.vk) {
      adStart();
      P.vk.send("VKWebAppShowNativeAds", { ad_format: "interstitial" }).catch(() => {}).finally(() => { adEnd(); done && done();
        P.vk.send("VKWebAppCheckNativeAds", { ad_format: "interstitial" }).catch(() => {}); });
      return;
    }
    if (!P.ysdk) { done && done(); return; }
    let finished = false;
    const fin = () => { if (finished) return; finished = true; adEnd(); done && done(); };
    try {
      P.ysdk.adv.showFullscreenAdv({ callbacks: { onOpen: adStart, onClose: fin, onError: fin, onOffline: fin } });
    } catch (e) { fin(); }
  };

  // реклама за награду. onReward — только если досмотрели.
  P.rewarded = function (onReward, done) {
    P.adLog.push({ k: "reward", t: Date.now() });
    if (!P.vk && !P.ysdk && NF.ADMIN_FAKE_ADS && NF.ADMIN_FAKE_ADS()) { NF.toast && NF.toast("📺 [тест] ролик за награду"); onReward && onReward(); done && done(true); return; }
    if (P.vk) {
      adStart();
      P.vk.send("VKWebAppShowNativeAds", { ad_format: "reward", use_waterfall: false })
        .then((d) => { adEnd(); if (d && d.result) onReward && onReward(); done && done(!!(d && d.result)); })
        .catch(() => { adEnd(); done && done(false); })
        .finally(() => P.vk.send("VKWebAppCheckNativeAds", { ad_format: "reward" }).catch(() => {}));
      return;
    }
    if (!P.ysdk) { done && done(false); return; }
    let got = false, finished = false;
    const fin = () => { if (finished) return; finished = true; adEnd(); done && done(got); };
    try {
      P.ysdk.adv.showRewardedVideo({ callbacks: { onOpen: adStart, onRewarded: () => { got = true; onReward && onReward(); }, onClose: fin, onError: fin } });
    } catch (e) { fin(); }
  };

  // облачное сохранение (для игроков, вошедших в Яндекс ID; гостям хватает памяти браузера)
  let lastCloud = 0, cloudTimer = null;
  const CHUNK = 4000;
  function cloudJSON(s) {
    return JSON.stringify(s); // сохранение уже урезано в ui.js (летопись — последние записи, без снимков машины времени)
  }
  async function vkSave(s) {
    const str = cloudJSON(s), n = Math.ceil(str.length / CHUNK);
    for (let i = 0; i < n; i++) await P.vk.send("VKWebAppStorageSet", { key: "b8l" + i, value: str.slice(i * CHUNK, (i + 1) * CHUNK) });
    await P.vk.send("VKWebAppStorageSet", { key: "b8ln", value: String(n) });
  }
  async function vkLoad() {
    const r = await P.vk.send("VKWebAppStorageGet", { keys: ["b8ln"] });
    const n = parseInt((r.keys && r.keys[0] && r.keys[0].value) || "0", 10);
    if (!n) return null;
    const keys = Array.from({ length: n }, (_, i) => "b8l" + i);
    const d = await P.vk.send("VKWebAppStorageGet", { keys });
    const map = Object.fromEntries((d.keys || []).map((k) => [k.key, k.value]));
    return JSON.parse(keys.map((k) => map[k] || "").join(""));
  }
  P.cloudSave = function (s, force) {
    if (P.vk && s) {
      const now = Date.now();
      const go = () => { lastCloud = Date.now(); cloudTimer = null; vkSave(s).catch(() => {}); };
      if (force || now - lastCloud > 60000) go();
      else if (!cloudTimer) cloudTimer = setTimeout(go, 60000 - (now - lastCloud));
      return;
    }
    if (!P.player || !s) return;
    const now = Date.now();
    const doSave = () => { lastCloud = Date.now(); cloudTimer = null; try { P.player.setData({ save: JSON.stringify(s), at: Date.now() }, true).catch(() => {}); } catch (e) {} };
    if (force || now - lastCloud > 30000) doSave();
    else if (!cloudTimer) cloudTimer = setTimeout(doSave, 30000 - (now - lastCloud));
  };
  // маленькое хранилище аккаунта (использованные промокоды): переживает «Новую игру» и переезд на другое устройство
  P.kvGet = async function (key) {
    let local = null;
    try { local = JSON.parse(localStorage.getItem("b8_kv_" + key) || "null"); } catch (e) {}
    if (P.vk) {
      try {
        const d = await P.vk.send("VKWebAppStorageGet", { keys: [key] });
        const v = d && d.keys && d.keys[0] && d.keys[0].value;
        if (v) return JSON.parse(v);
      } catch (e) {}
    }
    return local;
  };
  P.kvSet = async function (key, val) {
    const str = JSON.stringify(val);
    try { localStorage.setItem("b8_kv_" + key, str); } catch (e) {}
    if (P.vk) { try { await P.vk.send("VKWebAppStorageSet", { key, value: str }); } catch (e) {} }
  };
  P.cloudLoad = async function () {
    if (P.vk) { try { return await vkLoad(); } catch (e) { return null; } }
    if (!P.player) return null;
    try {
      const d = await P.player.getData(["save"]);
      return d && d.save ? JSON.parse(d.save) : null;
    } catch (e) { return null; }
  };
})();
