import { SUBJECTS, rankSrc, lastIndex } from "./subjects.js";

const BANDS = [
  { zh: "难", en: "Delay" },
  { zh: "牢", en: "Jail" },
  { zh: "子", en: "Guy" },
  { zh: "圣", en: "Saint" },
  { zh: "神", en: "God" },
  { zh: "祖", en: "Ancestor" },
];

const COPY = {
  zh: {
    status: "当前状态",
    stage: (n, total) => `档 ${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    langBtn: "EN",
    langAria: "切换语言",
    muteAria: "声音",
    rosterAria: "人物",
    dragAria: "拖动滑杆",
    nowMark: "当前风评",
    vibe: (name) => `当前风评是 ${name}`,
    calibrate: "校准中…",
    announce: (name) => `当前风评是 ${name}`,
    now: "当前",
    cue: "↓ 时间线",
    timeline: "时间线",
    dossier: "档案",
    cols: ["时间", "风评", "发生了什么", "依据"],
    docTitle: "滑动变祖器 · Sliding Ancestor Rheostat",
    docDesc: "滑动变祖器：给马斯克、梁文锋、杨植麟、奥特曼、达里奥、Tibo 滑动封神。",
    kicker: "变阻器 → 变祖器",
    brand: '滑动变<span class="zu">祖</span>器',
    brandSub: "Sliding Ancestor Rheostat",
    credit: 'Created by Grok 4.6 · <a href="https://github.com/makerjackie/bianzu">GitHub</a>',
  },
  en: {
    status: "Current state",
    stage: (n, total) => `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    langBtn: "中",
    langAria: "Switch language",
    muteAria: "Sound",
    rosterAria: "Characters",
    dragAria: "Drag slider",
    nowMark: "Current vibe",
    vibe: (name) => `Current vibe: ${name}`,
    calibrate: "Calibrating…",
    announce: (name) => `Current vibe: ${name}`,
    now: "now",
    cue: "↓ Timeline",
    timeline: "Timeline",
    dossier: "Dossier",
    cols: ["When", "Vibe", "What happened", "Source"],
    docTitle: "Sliding Ancestor Rheostat · 滑动变祖器",
    docDesc: "Sliding Ancestor Rheostat: slide Musk, Liang, Yang, Altman, Dario, and Tibo into ancestorhood.",
    kicker: "Rheostat → Ancestorstat",
    brand: 'Sliding Ancestor <span class="zu">Rheostat</span>',
    brandSub: "滑动变祖器",
    credit: 'Created by Grok 4.6 · <a href="https://github.com/makerjackie/bianzu">GitHub</a>',
  },
};

const MAX_OHM = 30;
const params = new URLSearchParams(location.search);

const els = {
  html: document.documentElement,
  meterLabel: document.querySelector("#meter-label"),
  statusLabel: document.querySelector("#status-label"),
  intensity: document.querySelector("#intensity"),
  rankName: document.querySelector("#rank-name"),
  rankStage: document.querySelector("#rank-stage"),
  rankSub: document.querySelector("#rank-sub"),
  hint: document.querySelector("#hint"),
  vibe: document.querySelector("#vibe"),
  langBtn: document.querySelector("#lang-btn"),
  muteBtn: document.querySelector("#mute-btn"),
  roster: document.querySelector("#roster"),
  faceA: document.querySelector("#face-a"),
  thumbA: document.querySelector("#thumb-a"),
  thumb: document.querySelector("#thumb"),
  fill: document.querySelector("#fill"),
  scale: document.querySelector("#scale"),
  ticks: document.querySelector("#ticks"),
  nowMark: document.querySelector("#now-mark"),
  slider: document.querySelector("#slider"),
  rail: document.querySelector("#rail"),
  instrument: document.querySelector("#instrument"),
  bezel: document.querySelector("#bezel"),
  porthole: document.querySelector("#porthole"),
  sparks: document.querySelector("#sparks"),
  lab: document.querySelector("#lab"),
  cue: document.querySelector("#below-cue"),
  cueLabel: document.querySelector("#cue-label"),
  chronicle: document.querySelector("#chronicle"),
  tlKicker: document.querySelector("#tl-kicker"),
  tlTitle: document.querySelector("#tl-title"),
  tlWho: document.querySelector("#tl-who"),
  tlCols: document.querySelector("#tl-cols"),
  tlBody: document.querySelector("#tl-body"),
  kicker: document.querySelector("#kicker"),
  brandTitle: document.querySelector("#brand-title"),
  brandSub: document.querySelector("#brand-sub"),
  credit: document.querySelector("#credit"),
  metaDesc: document.querySelector('meta[name="description"]'),
  ogTitle: document.querySelector('meta[property="og:title"]'),
  ogDesc: document.querySelector('meta[property="og:description"]'),
};

let lang = detectLang();
let subject = detectSubject();
let muted = localStorage.getItem("bianzu-muted") === "1";
let t = 0;
let dragging = false;
let lastRank = -1;
let audioReady = false;
let audioCtx = null;
let hum = null;
let snapTimer = 0;
let introing = false;
let introRaf = 0;
const banks = {};
let voice = null;

function last() {
  return lastIndex(subject);
}

function currentT() {
  return subject.current / last();
}

function detectLang() {
  if (params.get("lang") === "zh" || params.get("lang") === "en") return params.get("lang");
  const saved = localStorage.getItem("bianzu-lang");
  if (saved === "zh" || saved === "en") return saved;
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  return list.some((item) => String(item).toLowerCase().startsWith("zh")) ? "zh" : "en";
}

function detectSubject() {
  const id = params.get("who") || localStorage.getItem("bianzu-who");
  return SUBJECTS.find((item) => item.id === id) || SUBJECTS[hostDefault()];
}

function hostDefault() {
  const host = location.hostname;
  if (host.startsWith("godelon")) return 0;
  if (host.startsWith("bianzu")) return 1;
  return 0;
}

function ranks() {
  return subject.ranks;
}

function copy() {
  return COPY[lang];
}

function loc(zh, en) {
  return lang === "zh" ? zh : en;
}

function rankLabel(rank) {
  return loc(rank?.zh, rank?.en) || "";
}

function applyLang() {
  const c = copy();
  els.html.lang = lang === "zh" ? "zh-CN" : "en";
  els.statusLabel.textContent = c.status;
  els.langBtn.textContent = c.langBtn;
  els.langBtn.setAttribute("aria-label", c.langAria);
  els.muteBtn.setAttribute("aria-label", c.muteAria);
  els.roster.setAttribute("aria-label", c.rosterAria);
  els.thumb.setAttribute("aria-label", c.dragAria);
  els.nowMark?.setAttribute("title", c.nowMark);
  els.cueLabel.textContent = c.cue;
  els.tlKicker.textContent = c.dossier;
  els.tlTitle.textContent = c.timeline;
  els.tlCols.innerHTML = c.cols.map((col) => `<span>${col}</span>`).join("");
  els.kicker.textContent = c.kicker;
  els.brandTitle.innerHTML = c.brand;
  els.brandSub.textContent = c.brandSub;
  if (els.credit) els.credit.innerHTML = c.credit;
  document.title = c.docTitle;
  els.metaDesc?.setAttribute("content", c.docDesc);
  els.ogTitle?.setAttribute("content", c.docTitle);
  els.ogDesc?.setAttribute("content", c.docDesc);
  renderRoster();
  renderScale();
  renderTimeline();
  setT(t);
  if (introing) {
    els.vibe.classList.add("calibrating");
    els.vibe.textContent = copy().calibrate;
  }
}

function renderRoster() {
  els.roster.innerHTML = SUBJECTS.map((item) => {
    const src = rankSrc(item, item.ranks[item.current]);
    const label = loc(item.zh, item.en);
    const who = loc(item.whoZh, item.whoEn);
    const active = item.id === subject.id ? " is-active" : "";
    return `<button type="button" class="who${active}" data-id="${item.id}" title="${who}">
      <img src="${src}" alt="${label}" />
      <span>${label}</span>
    </button>`;
  }).join("");
  els.roster.querySelectorAll(".who").forEach((btn) => {
    btn.addEventListener("click", () => setSubject(btn.dataset.id));
  });
}

function renderScale() {
  const c = copy();
  const cur = subject.current;
  els.ticks.innerHTML = ranks().map((_, i) => `<i class="${i === cur ? "is-now" : ""}"></i>`).join("");
  els.scale.innerHTML = ranks()
    .map((rank, i) => {
      const now = i === cur ? `<em>${c.now}</em>` : "";
      return `<button type="button" class="tick${i === cur ? " is-now" : ""}" data-index="${i}">${rankLabel(rank)}${now}</button>`;
    })
    .join("");
  els.scale.querySelectorAll(".tick").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      abortIntro();
      unlockAudio();
      setT(Number(btn.dataset.index) / last(), true);
    });
  });
  els.nowMark.style.setProperty("--now", `${xFromT(cur / last())}%`);
  els.instrument.style.setProperty("--n", String(ranks().length));
}

function dateKey(value) {
  const parts = String(value).split("-").map(Number);
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

function bandLabel(index) {
  return rankLabel(ranks()[index]) || loc(BANDS[index]?.zh, BANDS[index]?.en) || "";
}

function renderTimeline() {
  const c = copy();
  els.tlWho.textContent = loc(subject.whoZh, subject.whoEn);
  const rows = [...(subject.timeline || [])].sort((a, b) => dateKey(b.date) - dateKey(a.date));
  els.tlBody.innerHTML = rows
    .map((row) => {
      const now = row.now ? `<em class="tl-now">${c.now}</em>` : "";
      return `<article class="tl-row band-${row.rank}${row.now ? " is-now" : ""}">
        <time datetime="${row.date}">${row.date}</time>
        <span class="tl-band">${bandLabel(row.rank)}${now}</span>
        <p class="tl-why">${loc(row.whyZh, row.whyEn)}</p>
        <p class="tl-src">${loc(row.srcZh, row.srcEn)}</p>
      </article>`;
    })
    .join("");
}

function setSubject(id) {
  const next = SUBJECTS.find((item) => item.id === id);
  if (!next) return;
  abortIntro();
  subject = next;
  localStorage.setItem("bianzu-who", subject.id);
  lastRank = -1;
  t = currentT();
  renderRoster();
  renderScale();
  renderTimeline();
  preload();
  setT(t, true);
}

function bump(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function spark(up) {
  els.sparks.innerHTML = "";
  for (let i = 0; i < 10; i += 1) {
    const node = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
    node.style.setProperty("--x", `${Math.cos(angle) * (90 + Math.random() * 40)}px`);
    node.style.setProperty("--y", `${Math.sin(angle) * (90 + Math.random() * 40)}px`);
    node.style.background = up ? "#e8c56a" : "#ff6d5a";
    els.sparks.append(node);
  }
}

function setT(next, snap = false) {
  t = Math.min(1, Math.max(0, next));
  if (snap) t = Math.round(t * last()) / last();
  const nearest = Math.round(t * last());
  const ohms = String(Math.round(t * MAX_OHM)).padStart(2, "0");
  const list = ranks();
  const rank = list[nearest];
  const currentRank = list[subject.current];
  const src = rankSrc(subject, rank);

  els.faceA.src = src;
  els.thumbA.src = src;
  els.thumb.classList.toggle("is-snap", snap && !dragging);
  els.fill.classList.toggle("is-snap", snap && !dragging);
  els.thumb.style.setProperty("--x", `${xFromT(t)}%`);
  els.thumb.style.setProperty("--s", dragging ? "1.16" : snap ? "1.06" : "1");
  els.fill.style.setProperty("--t", String(xFromT(t) / 100));
  document.documentElement.style.setProperty("--t", String(t));
  els.slider.classList.toggle("live", dragging || introing);
  els.intensity.textContent = ohms;
  els.meterLabel.textContent = loc(subject.meterZh, subject.meterEn);
  els.hint.textContent = loc(subject.hintZh, subject.hintEn);
  els.rankName.textContent = rankLabel(rank);
  els.rankSub.textContent = loc(rank?.eventZh, rank?.eventEn) || "";
  els.rankStage.textContent = copy().stage(nearest + 1, list.length);
  if (!introing) els.vibe.textContent = copy().vibe(rankLabel(currentRank));
  els.faceA.alt = rankLabel(rank);
  document.body.dataset.rank = String(nearest);

  els.scale.querySelectorAll(".tick").forEach((btn, i) => {
    btn.classList.toggle("is-active", i === nearest);
  });
  els.ticks.querySelectorAll("i").forEach((tick, i) => {
    tick.classList.toggle("is-active", i === nearest);
  });

  if (hum) hum.frequency.setTargetAtTime(70 + t * 240, audioCtx.currentTime, 0.05);

  if (nearest !== lastRank) {
    const up = nearest > lastRank;
    const changed = lastRank >= 0;
    lastRank = nearest;
    if (changed) {
      bump(els.rankName, "pop");
      bump(els.intensity, "pop");
      if (introing) {
        poke("click", 0.2);
      } else {
        bump(els.vibe, "pop");
        bump(els.bezel, up ? "flash-up" : "flash-down");
        bump(els.porthole, up ? "rise" : "shake");
        bump(els.slider, "kick");
        spark(up);
        if (navigator.vibrate) navigator.vibrate(up ? 18 : 28);
        playRank(nearest, up);
      }
    }
  }
}

function preload() {
  for (const rank of ranks()) {
    const img = new Image();
    img.src = rankSrc(subject, rank);
  }
}

function loadBanks() {
  banks.click = new Audio("/sfx/click.mp3");
  banks.zap = new Audio("/sfx/zap.mp3");
  banks.click.preload = "auto";
  banks.zap.preload = "auto";
}

function poke(id, volume = 1) {
  const isVoice = id.includes("/");
  if (isVoice && voice) {
    voice.pause();
    voice.currentTime = 0;
  }
  let clip = banks[id];
  if (!clip) {
    clip = new Audio(`/sfx/${id}.mp3?v=5`);
    banks[id] = clip;
  }
  if (isVoice) voice = clip;
  if (muted) return;
  clip.volume = volume;
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function playRank(index, up) {
  if (!audioReady || muted) return;
  poke(`${subject.id}/${lang}-${index}`);
  poke("click", 0.35);
  if (up && index >= last() - 1) poke("zap", 0.45);
}

function unlockAudio() {
  if (audioReady) {
    audioCtx?.resume();
    return;
  }
  audioReady = true;
  audioCtx = new AudioContext();
  audioCtx.resume();
}

function startHum() {
  if (muted || !audioCtx) return;
  stopHum();
  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 70 + t * 240;
  filter.type = "lowpass";
  filter.frequency.value = 520;
  gain.gain.value = 0.03;
  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start();
  hum = osc;
  hum._gain = gain;
}

function stopHum() {
  if (!hum) return;
  try {
    hum._gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    hum.stop(audioCtx.currentTime + 0.1);
  } catch {
    /* already stopped */
  }
  hum = null;
}

function units() {
  return last() + 1;
}

function xFromT(value) {
  return ((value * last() + 0.5) / units()) * 100;
}

function tFromClientX(clientX) {
  const box = els.rail.getBoundingClientRect();
  if (!box.width) return t;
  const f = (clientX - box.left) / box.width;
  return (f * units() - 0.5) / last();
}

function onPointerDown(event) {
  if (event.target.closest(".tick") || event.target.closest(".who")) return;
  event.preventDefault();
  abortIntro();
  dragging = true;
  els.thumb.classList.remove("is-snap");
  els.fill.classList.remove("is-snap");
  els.thumb.classList.add("hot");
  unlockAudio();
  startHum();
  els.slider.setPointerCapture?.(event.pointerId);
  setT(tFromClientX(event.clientX));
}

function onPointerMove(event) {
  if (!dragging) return;
  setT(tFromClientX(event.clientX));
}

function onPointerUp() {
  if (!dragging) return;
  dragging = false;
  els.thumb.classList.remove("hot");
  stopHum();
  setT(t, true);
}

function scheduleSnap() {
  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(() => {
    if (!dragging) setT(t, true);
  }, 140);
}

function wheelDelta(event) {
  let dy = event.deltaY;
  if (event.deltaMode === 1) dy *= 16;
  if (event.deltaMode === 2) dy *= 640;
  return dy;
}

function openTimeline() {
  abortIntro();
  els.chronicle.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onWheel(event) {
  if (dragging || event.shiftKey || event.ctrlKey || event.metaKey) return;
  abortIntro();
  event.preventDefault();
  unlockAudio();
  els.thumb.classList.remove("is-snap");
  els.fill.classList.remove("is-snap");
  setT(t + wheelDelta(event) / 1100);
  scheduleSnap();
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function huntPath(p, target) {
  const highFirst = target < 0.55;
  const keys = [
    [0, 0.02],
    [0.13, 0.16 + target * 0.1],
    [0.3, highFirst ? 0.9 : 0.08],
    [0.44, highFirst ? 1 : 0],
    [0.6, clamp01(target + (highFirst ? -0.4 : 0.4))],
    [0.74, clamp01(target + (highFirst ? 0.2 : -0.2))],
    [0.86, clamp01(target + (highFirst ? -0.05 : 0.05))],
    [1, target],
  ];
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1][0]) i += 1;
  const [p0, v0] = keys[i];
  const [p1, v1] = keys[i + 1];
  const u = (p - p0) / Math.max(0.0001, p1 - p0);
  const eased = u * u * (3 - 2 * u);
  let value = v0 + (v1 - v0) * eased;
  if (p < 0.9) {
    const amp = 0.03 * Math.sin(p * Math.PI);
    value += Math.sin(p * 58) * amp + Math.sin(p * 97) * amp * 0.35;
  }
  return clamp01(value);
}

function abortIntro() {
  if (!introing) return;
  introing = false;
  if (introRaf) cancelAnimationFrame(introRaf);
  introRaf = 0;
  document.body.classList.remove("is-intro");
  els.thumb.classList.remove("hunting");
  els.vibe.classList.remove("calibrating");
  const name = rankLabel(ranks()[subject.current]);
  els.vibe.textContent = copy().vibe(name);
}

function announceVibe() {
  const name = rankLabel(ranks()[subject.current]);
  els.vibe.classList.remove("calibrating");
  els.vibe.textContent = copy().announce(name);
  bump(els.vibe, "announce");
}

function finishIntro() {
  if (!introing) return;
  introing = false;
  introRaf = 0;
  document.body.classList.remove("is-intro");
  els.thumb.classList.remove("hunting");
  const landed = subject.current;
  setT(currentT(), true);
  bump(els.rankName, "pop");
  bump(els.intensity, "pop");
  bump(els.bezel, "flash-up");
  bump(els.porthole, "rise");
  bump(els.slider, "kick");
  spark(true);
  playRank(landed, true);
  announceVibe();
}

function runIntro() {
  if (introRaf) {
    cancelAnimationFrame(introRaf);
    introRaf = 0;
  }
  if (prefersReduced()) {
    introing = false;
    lastRank = -1;
    document.body.classList.remove("is-intro");
    els.thumb.classList.remove("hunting");
    setT(currentT(), true);
    announceVibe();
    return;
  }
  introing = true;
  lastRank = -1;
  document.body.classList.add("is-intro");
  els.thumb.classList.add("hunting");
  els.vibe.classList.add("calibrating");
  els.vibe.textContent = copy().calibrate;
  setT(0);
  const target = currentT();
  const duration = 2860;
  let start = 0;
  const tick = (now) => {
    if (!introing) return;
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    setT(huntPath(p, target));
    if (p < 1) {
      introRaf = requestAnimationFrame(tick);
      return;
    }
    finishIntro();
  };
  introRaf = requestAnimationFrame(tick);
}

function runDemo() {
  runIntro();
}

function syncMute() {
  els.muteBtn.textContent = muted ? "✕" : "♪";
  els.muteBtn.classList.toggle("off", muted);
  if (muted) stopHum();
}

els.langBtn.addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem("bianzu-lang", lang);
  applyLang();
});

els.muteBtn.addEventListener("click", () => {
  muted = !muted;
  localStorage.setItem("bianzu-muted", muted ? "1" : "0");
  if (!muted) unlockAudio();
  syncMute();
});

els.cue.addEventListener("click", openTimeline);

preload();
loadBanks();
introing = !prefersReduced();
applyLang();
syncMute();

els.slider.addEventListener("pointerdown", onPointerDown);
els.instrument.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    abortIntro();
    unlockAudio();
    setT(t + 1 / last(), true);
  }
  if (event.key === "ArrowLeft") {
    abortIntro();
    unlockAudio();
    setT(t - 1 / last(), true);
  }
});

requestAnimationFrame(() => runIntro());

window.__bianzu = { setT, setSubject, runDemo, runIntro };
