const RANKS = [
  { zh: "量子马", en: "Quantum", zhSub: "Quantum Musk", enSub: "量子马", src: "/ranks/01-quantum.webp" },
  { zh: "牢马", en: "Jailed", zhSub: "Jailed Musk", enSub: "牢马", src: "/ranks/02-lao.webp" },
  { zh: "马子", en: "Elon", zhSub: "Just Elon", enSub: "马子", src: "/ranks/03-zi.webp" },
  { zh: "马圣", en: "Saint", zhSub: "Saint Musk", enSub: "马圣", src: "/ranks/04-saint.webp" },
  { zh: "马神", en: "God", zhSub: "God Musk", enSub: "马神", src: "/ranks/05-god.webp" },
  { zh: "马祖", en: "Ancestor", zhSub: "Ancestor Musk", enSub: "马祖", src: "/ranks/06-ancestor.webp" },
];

const COPY = {
  zh: {
    titleHtml: '滑动变<span class="zu">祖</span>器',
    kicker: "Musk Intensity Calibrator",
    meter: "马系强度",
    status: "当前状态",
    stage: (n) => `阶段 ${String(n).padStart(2, "0")} / 06`,
    hint: "← 滑动以增强马系浓度 →",
    langBtn: "EN",
    docTitle: "滑动变祖器 · Godelon",
  },
  en: {
    titleHtml: "Godelon",
    kicker: "Sliding Ancestor Rheostat",
    meter: "Musk Intensity",
    status: "Current state",
    stage: (n) => `Stage ${String(n).padStart(2, "0")} / 06`,
    hint: "← slide to increase musk density →",
    langBtn: "中",
    docTitle: "Godelon · Sliding Ancestor Rheostat",
  },
};

const MAX_INTENSITY = 30;
const LAST = RANKS.length - 1;

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
let muted = localStorage.getItem("bianzu-muted") === "1";
let t = 0;
let dragging = false;
let lastRank = 0;
let audioReady = false;
let audioCtx = null;
let hum = null;
const banks = {};

function detectLang() {
  const saved = localStorage.getItem("bianzu-lang");
  if (saved === "zh" || saved === "en") return saved;
  const host = location.hostname;
  if (host.startsWith("godelon")) return "en";
  if (host.startsWith("bianzu")) return "zh";
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function copy() {
  return COPY[lang];
}

function applyLang() {
  const c = copy();
  els.html.lang = lang === "zh" ? "zh-CN" : "en";
  els.title.innerHTML = c.titleHtml;
  els.kicker.textContent = c.kicker;
  els.meterLabel.textContent = c.meter;
  els.statusLabel.textContent = c.status;
  els.hint.textContent = c.hint;
  els.langBtn.textContent = c.langBtn;
  document.title = c.docTitle;
  renderScale();
  setT(t);
}

function renderScale() {
  els.ticks.innerHTML = RANKS.map(() => "<i></i>").join("");
  els.scale.innerHTML = RANKS.map(
    (rank, i) =>
      `<button type="button" class="tick" data-index="${i}">${rank[lang]}</button>`,
  ).join("");
  els.scale.querySelectorAll(".tick").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      unlockAudio();
      setT(Number(btn.dataset.index) / LAST, true);
    });
  });
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
  const rank = RANKS[nearest];

  els.faceA.src = RANKS[lo].src;
  els.faceB.src = RANKS[hi].src;
  els.faceA.style.opacity = String(1 - frac);
  els.faceB.style.opacity = String(frac);
  els.thumbA.src = RANKS[lo].src;
  els.thumbB.src = RANKS[hi].src;
  els.thumbA.style.opacity = String(1 - frac);
  els.thumbB.style.opacity = String(frac);
  els.thumb.style.left = `${t * 100}%`;
  els.fill.style.width = `${t * 100}%`;
  els.intensity.textContent = intensity;
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
    lastRank = nearest;
    bump(els.rankName, "pop");
    bump(els.intensity, "pop");
    bump(els.bezel, up ? "flash-up" : "flash-down");
    bump(els.porthole, up ? "rise" : "shake");
    spark(up);
    if (navigator.vibrate) navigator.vibrate(up ? 18 : 28);
    playRank(nearest, up);
  }

  if (snap) t = nearest / LAST;
}

function preload() {
  for (const rank of RANKS) {
    const img = new Image();
    img.src = rank.src;
  }
}

function loadBanks() {
  for (const key of ["click", "zap"]) {
    banks[key] = new Audio(`/sfx/${key}.mp3`);
    banks[key].preload = "auto";
  }
  for (const code of ["zh", "en"]) {
    for (let i = 0; i < RANKS.length; i += 1) {
      const id = `${code}-${i}`;
      banks[id] = new Audio(`/sfx/${id}.mp3`);
      banks[id].preload = "auto";
    }
  }
}

function poke(id, volume = 1) {
  const clip = banks[id];
  if (!clip || muted) return;
  clip.volume = volume;
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function playRank(index, up) {
  if (!audioReady || muted) return;
  poke(`${lang}-${index}`);
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
  if (event.target.closest(".tick")) return;
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
