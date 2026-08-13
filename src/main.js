import { SUBJECTS, rankSrc } from "./subjects.js";

const COPY = {
  zh: {
    titleHtml: '滑动变<span class="zu">祖</span>器',
    kicker: "Universal Intensity Calibrator",
    status: "当前状态",
    stage: (n) => `阶段 ${String(n).padStart(2, "0")} / 06`,
    langBtn: "EN",
    docTitle: "滑动变祖器 · zu.01mvp.com",
  },
  en: {
    titleHtml: "Rheostat",
    kicker: "Sliding Ancestor Rheostat",
    status: "Current state",
    stage: (n) => `Stage ${String(n).padStart(2, "0")} / 06`,
    langBtn: "中",
    docTitle: "Rheostat · Sliding Ancestor",
  },
};

const MAX_INTENSITY = 30;
const LAST = 5;
const params = new URLSearchParams(location.search);

const els = {
  html: document.documentElement,
  title: document.querySelector("#title"),
  kicker: document.querySelector("#kicker"),
  meterLabel: document.querySelector("#meter-label"),
  statusLabel: document.querySelector("#status-label"),
  intensity: document.querySelector("#intensity"),
  rankName: document.querySelector("#rank-name"),
  rankStage: document.querySelector("#rank-stage"),
  rankSub: document.querySelector("#rank-sub"),
  hint: document.querySelector("#hint"),
  langBtn: document.querySelector("#lang-btn"),
  muteBtn: document.querySelector("#mute-btn"),
  roster: document.querySelector("#roster"),
  faceA: document.querySelector("#face-a"),
  faceB: document.querySelector("#face-b"),
  thumbA: document.querySelector("#thumb-a"),
  thumbB: document.querySelector("#thumb-b"),
  thumb: document.querySelector("#thumb"),
  fill: document.querySelector("#fill"),
  scale: document.querySelector("#scale"),
  ticks: document.querySelector("#ticks"),
  cylinder: document.querySelector("#cylinder"),
  instrument: document.querySelector("#instrument"),
  bezel: document.querySelector("#bezel"),
  porthole: document.querySelector("#porthole"),
  sparks: document.querySelector("#sparks"),
};

let lang = detectLang();
let subject = detectSubject();
let muted = localStorage.getItem("bianzu-muted") === "1";
let t = 0;
let dragging = false;
let lastRank = 0;
let audioReady = false;
let audioCtx = null;
let hum = null;
const banks = {};

function detectLang() {
  if (params.get("lang") === "zh" || params.get("lang") === "en") return params.get("lang");
  const saved = localStorage.getItem("bianzu-lang");
  if (saved === "zh" || saved === "en") return saved;
  const host = location.hostname;
  if (host.startsWith("godelon")) return "en";
  if (host.startsWith("bianzu") || host.startsWith("zu.")) return "zh";
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
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

function applyLang() {
  const c = copy();
  els.html.lang = lang === "zh" ? "zh-CN" : "en";
  els.title.innerHTML = c.titleHtml;
  els.kicker.textContent = c.kicker;
  els.statusLabel.textContent = c.status;
  els.langBtn.textContent = c.langBtn;
  document.title = c.docTitle;
  renderRoster();
  renderScale();
  setT(t);
}

function renderRoster() {
  els.roster.innerHTML = SUBJECTS.map((item) => {
    const src = rankSrc(item, item.ranks[2]);
    const label = lang === "zh" ? item.zh : item.en;
    const active = item.id === subject.id ? " is-active" : "";
    return `<button type="button" class="who${active}" data-id="${item.id}" title="${label}">
      <img src="${src}" alt="${label}" />
      <span>${label}</span>
    </button>`;
  }).join("");
  els.roster.querySelectorAll(".who").forEach((btn) => {
    btn.addEventListener("click", () => setSubject(btn.dataset.id));
  });
}

function renderScale() {
  els.ticks.innerHTML = ranks().map(() => "<i></i>").join("");
  els.scale.innerHTML = ranks()
    .map((rank, i) => `<button type="button" class="tick" data-index="${i}">${rank[lang]}</button>`)
    .join("");
  els.scale.querySelectorAll(".tick").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      unlockAudio();
      setT(Number(btn.dataset.index) / LAST, true);
    });
  });
}

function setSubject(id) {
  const next = SUBJECTS.find((item) => item.id === id);
  if (!next || next.id === subject.id) return;
  subject = next;
  localStorage.setItem("bianzu-who", subject.id);
  lastRank = -1;
  renderRoster();
  renderScale();
  preload();
  setT(t, true);
}

function pair(value) {
  const scaled = value * LAST;
  const lo = Math.min(LAST, Math.floor(scaled));
  const hi = Math.min(LAST, Math.ceil(scaled));
  return { lo, hi, frac: scaled - lo };
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
  const { lo, hi, frac } = pair(t);
  const nearest = Math.round(t * LAST);
  const intensity = String(Math.round(t * MAX_INTENSITY)).padStart(2, "0");
  const list = ranks();
  const rank = list[nearest];

  els.faceA.src = rankSrc(subject, list[lo]);
  els.faceB.src = rankSrc(subject, list[hi]);
  els.faceA.style.opacity = String(1 - frac);
  els.faceB.style.opacity = String(frac);
  els.thumbA.src = rankSrc(subject, list[lo]);
  els.thumbB.src = rankSrc(subject, list[hi]);
  els.thumbA.style.opacity = String(1 - frac);
  els.thumbB.style.opacity = String(frac);
  els.thumb.style.left = `${t * 100}%`;
  els.fill.style.width = `${t * 100}%`;
  els.intensity.textContent = intensity;
  els.meterLabel.textContent = lang === "zh" ? subject.meterZh : subject.meterEn;
  els.hint.textContent = lang === "zh" ? subject.hintZh : subject.hintEn;
  els.rankName.textContent = rank[lang];
  els.rankSub.textContent = lang === "zh" ? rank.zhSub : rank.enSub;
  els.rankStage.textContent = copy().stage(nearest + 1);
  els.faceA.alt = rank[lang];
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
      bump(els.bezel, up ? "flash-up" : "flash-down");
      bump(els.porthole, up ? "rise" : "shake");
      spark(up);
      if (navigator.vibrate) navigator.vibrate(up ? 18 : 28);
      playRank(nearest, up);
    }
  }

  if (snap) t = nearest / LAST;
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
  let clip = banks[id];
  if (!clip) {
    clip = new Audio(`/sfx/${id}.mp3`);
    banks[id] = clip;
  }
  if (muted) return;
  clip.volume = volume;
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function playRank(index, up) {
  if (!audioReady || muted) return;
  poke(`${subject.id}/${lang}-${index}`);
  poke("click", 0.35);
  if (up && index >= 4) poke("zap", 0.45);
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

function tFromClientX(clientX) {
  const rail = els.cylinder.querySelector(".rail");
  const box = rail.getBoundingClientRect();
  return (clientX - box.left) / box.width;
}

function onPointerDown(event) {
  if (event.target.closest(".tick") || event.target.closest(".who")) return;
  dragging = true;
  els.thumb.classList.add("hot");
  unlockAudio();
  startHum();
  els.instrument.setPointerCapture?.(event.pointerId);
  setT(tFromClientX(event.clientX));
}

function onPointerMove(event) {
  if (!dragging) return;
  setT(tFromClientX(event.clientX));
}

function onPointerUp() {
  dragging = false;
  els.thumb.classList.remove("hot");
  stopHum();
}

function syncMute() {
  els.muteBtn.textContent = muted ? "✕" : "♪";
  els.muteBtn.classList.toggle("off", muted);
  if (muted) stopHum();
}

function runDemo() {
  const start = performance.now();
  const duration = 9000;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    setT(p);
    if (p < 1) requestAnimationFrame(tick);
  };
  unlockAudio();
  requestAnimationFrame(tick);
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

preload();
loadBanks();
applyLang();
syncMute();
setT(0);

els.instrument.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    unlockAudio();
    setT(t + 1 / LAST, true);
  }
  if (event.key === "ArrowLeft") {
    unlockAudio();
    setT(t - 1 / LAST, true);
  }
});

if (params.get("demo") === "1") {
  window.addEventListener("load", () => setTimeout(runDemo, 400));
}

window.__bianzu = { setT, setSubject, runDemo };
