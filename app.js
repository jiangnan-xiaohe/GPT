const TARGET = "2025-02-10T00:00:00+08:00";

const STORAGE_KEYS = {
  target: "cny_target",
  timezone: "cny_timezone",
};

const subtitles = [
  "灯火可亲，年味将至",
  "万事顺意，向新而行",
  "人间烟火处，最是团圆时",
];

const supportsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const elements = {
  subtitle: document.getElementById("subtitle"),
  settings: document.getElementById("settings"),
  settingsToggle: document.getElementById("settings-toggle"),
  settingsClose: document.getElementById("settings-close"),
  targetInput: document.getElementById("target-input"),
  timezoneInput: document.getElementById("timezone-input"),
  saveButton: document.getElementById("save-button"),
  targetDisplay: document.getElementById("target-display"),
  timezoneDisplay: document.getElementById("timezone-display"),
  shareButton: document.getElementById("share-button"),
  resetButton: document.getElementById("reset-button"),
  canvas: document.getElementById("celebration-canvas"),
};

const valueNodes = Array.from(document.querySelectorAll(".value")).reduce((acc, node) => {
  acc[node.dataset.unit] = node;
  return acc;
}, {});

const pad = (value) => String(value).padStart(2, "0");

const getStoredTarget = () => localStorage.getItem(STORAGE_KEYS.target) || TARGET;
const getStoredTimezone = () => localStorage.getItem(STORAGE_KEYS.timezone) || "Asia/Shanghai";

const formatDate = (date, timeZone) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone === "local" ? undefined : timeZone,
  };
  return new Intl.DateTimeFormat("zh-CN", options).format(date);
};

const toLocalInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const syncSettingsInputs = () => {
  const storedTarget = getTargetDate();
  elements.targetInput.value = toLocalInputValue(storedTarget);
  elements.timezoneInput.value = getStoredTimezone();
};

const openSettings = () => {
  syncSettingsInputs();
  elements.settings.classList.add("active");
  elements.settings.setAttribute("aria-hidden", "false");
};

const closeSettings = () => {
  elements.settings.classList.remove("active");
  elements.settings.setAttribute("aria-hidden", "true");
};

const setSubtitle = () => {
  const next = subtitles[Math.floor(Math.random() * subtitles.length)];
  elements.subtitle.textContent = next;
};

const updateValue = (unit, nextValue) => {
  const node = valueNodes[unit];
  if (!node) return;
  const current = node.querySelector(".current");
  const next = node.querySelector(".next");
  if (current.textContent === nextValue) return;
  if (supportsReducedMotion) {
    current.textContent = nextValue;
    next.textContent = nextValue;
    return;
  }
  next.textContent = nextValue;
  node.classList.add("flip");
  window.setTimeout(() => {
    current.textContent = nextValue;
    node.classList.remove("flip");
  }, 420);
};

const getTargetDate = () => new Date(getStoredTarget());

const updateDisplay = (diffSeconds) => {
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  updateValue("days", String(days));
  updateValue("hours", pad(hours));
  updateValue("minutes", pad(minutes));
  updateValue("seconds", pad(seconds));
};

const getTimeZoneLabel = (value) => (value === "local" ? "本地时区" : value);

const syncLabels = () => {
  const timeZone = getStoredTimezone();
  const targetDate = getTargetDate();
  elements.targetDisplay.textContent = formatDate(targetDate, timeZone);
  elements.timezoneDisplay.textContent = getTimeZoneLabel(timeZone);
};

const saveSettings = () => {
  if (elements.targetInput.value) {
    const value = new Date(elements.targetInput.value);
    if (!Number.isNaN(value.getTime())) {
      localStorage.setItem(STORAGE_KEYS.target, value.toISOString());
    }
  }
  localStorage.setItem(STORAGE_KEYS.timezone, elements.timezoneInput.value);
  syncLabels();
  window.clearInterval(countdownTimer);
  startCountdown();
  closeSettings();
};

const getCountdownText = () => {
  const days = valueNodes.days?.querySelector(".current")?.textContent ?? "0";
  const hours = valueNodes.hours?.querySelector(".current")?.textContent ?? "00";
  const minutes = valueNodes.minutes?.querySelector(".current")?.textContent ?? "00";
  const seconds = valueNodes.seconds?.querySelector(".current")?.textContent ?? "00";
  return `新春倒计时：还剩 ${days}天${hours}小时${minutes}分${seconds}秒，一起等年味～`;
};

const shareCountdown = async () => {
  const message = `${getCountdownText()} ${window.location.href}`;
  try {
    await navigator.clipboard.writeText(message);
    alert("已复制倒计时与链接，快去分享吧！");
  } catch (error) {
    prompt("复制以下内容分享：", message);
  }
};

const resizeCanvas = () => {
  const { canvas } = elements;
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
};

const startCelebration = () => {
  const { canvas } = elements;
  if (!canvas) return;
  if (supportsReducedMotion) return () => {};
  resizeCanvas();
  const ctx = canvas.getContext("2d");
  const particles = [];
  const fireworks = [];
  const maxParticles = Math.min(220, Math.floor(window.innerWidth / 3));
  const maxFireworks = supportsReducedMotion ? 0 : 6;

  for (let i = 0; i < maxParticles; i += 1) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.8 + 0.4,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.6 + 0.2,
    });
  }

  for (let i = 0; i < maxFireworks; i += 1) {
    fireworks.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.5 + 60,
      radius: Math.random() * 30 + 20,
      alpha: 1,
    });
  }

  let running = true;
  let lastTime = performance.now();

  const draw = (time) => {
    if (!running) return;
    const delta = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = "rgba(255, 215, 160, 0.8)";
    particles.forEach((p) => {
      p.y += p.speed * (delta / 16);
      p.x += p.drift * (delta / 16);
      if (p.y > window.innerHeight) {
        p.y = -10;
        p.x = Math.random() * window.innerWidth;
      }
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    fireworks.forEach((f) => {
      ctx.globalAlpha = f.alpha;
      ctx.strokeStyle = "rgba(215, 161, 74, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.stroke();
      f.radius += 0.6 * (delta / 16);
      f.alpha -= 0.01 * (delta / 16);
      if (f.alpha <= 0) {
        f.radius = Math.random() * 30 + 20;
        f.alpha = 1;
      }
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  return () => {
    running = false;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
};

let celebrationStop = null;
let countdownTimer = null;

const startCountdown = () => {
  const targetDate = getTargetDate();
  const tick = () => {
    const now = new Date();
    const diff = Math.max(0, targetDate.getTime() - now.getTime());
    const diffSeconds = Math.floor(diff / 1000);
    updateDisplay(diffSeconds);

    if (diffSeconds === 0) {
      document.querySelector("h1").textContent = "春节快乐";
      elements.resetButton.hidden = false;
      if (!celebrationStop) {
        celebrationStop = startCelebration();
      }
      return;
    }

    if (celebrationStop) {
      celebrationStop();
      celebrationStop = null;
    }
    elements.resetButton.hidden = true;
  };

  tick();
  countdownTimer = window.setInterval(tick, 1000);
};

const resetCountdown = () => {
  localStorage.removeItem(STORAGE_KEYS.target);
  localStorage.removeItem(STORAGE_KEYS.timezone);
  syncLabels();
  window.clearInterval(countdownTimer);
  celebrationStop?.();
  celebrationStop = null;
  document.querySelector("h1").textContent = "新春倒计时";
  setSubtitle();
  startCountdown();
};

const init = () => {
  setSubtitle();
  syncLabels();
  syncSettingsInputs();

  elements.settingsToggle.addEventListener("click", openSettings);
  elements.settingsClose.addEventListener("click", closeSettings);
  elements.saveButton.addEventListener("click", saveSettings);
  elements.shareButton.addEventListener("click", shareCountdown);
  elements.resetButton.addEventListener("click", resetCountdown);

  elements.settings.addEventListener("click", (event) => {
    if (event.target === elements.settings) {
      closeSettings();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  startCountdown();
};

init();
