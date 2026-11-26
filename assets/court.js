// Homepage film hero: one slow-motion shot, played on a button.
//
// The visitor presses "Take the shot" (or taps the ball). A short clip plays: the ball flies and drops
// through the net, and a card shows one problem Ánimo solves. "Next shot" plays the same clip again
// for the next card. After the fourth, "Finish" fills the arena with confetti and brings up the
// closing banner. Nothing is tied to scrolling: the hero is one screen and the page scrolls past it.
//
// On landscape screens the clip is only the middle of the picture. Around it sits a wide still of the
// same arena (the "plate"), with a soft-edged hole the clip shows through. On portrait screens the
// clip fills the screen. If the video cannot play, the shot is shown with two stills instead.
// start() rejects if the opening still cannot load, and the page then falls back to the tap court.

const BASE = "/assets/court/20261120/s1";
const PLATE = { w: 1920, h: 1072 };
const RECT = [0.47187, 0, 0.41667, 1];   // where the clip sits in the plate: x, y, w, h as fractions
const CLIP = { w: 832, h: 1114 };
const BALL = [0.505, 0.622, 0.2];        // the ball in the opening frame: x, y, diameter (of the clip)
const MADE = 0.86;                       // how far through the clip the ball clears the net
const SHOTS = 4;
const CONFETTI = ["#f5a623", "#e8826b", "#fbf5e9", "#c85a3d", "#b9c79b", "#f5ebd8"];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Two frames from now, or shortly after if the browser is not painting (a tab in the background).
const nextPaint = () => new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); setTimeout(resolve, 120); });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function start() {
  const stage = document.querySelector("[data-court-stage]");
  const film = stage?.querySelector("[data-court-film]");
  const scene = film?.querySelector("[data-court-scene]");
  const video = film?.querySelector("[data-court-video]");
  if (!stage || !scene || !video) throw new Error("court: markup missing");

  const still = Object.fromEntries([...film.querySelectorAll("[data-court-still]")].map((img) => [img.dataset.courtStill, img]));
  const cards = [...stage.querySelectorAll("[data-court-card]")];
  const final = stage.querySelector("[data-court-final]");
  const pips = [...stage.querySelectorAll("[data-court-pip]")];
  const hudLabel = stage.querySelector("[data-court-hud-label]");
  const live = stage.querySelector("[data-court-live]");
  const nextButton = stage.querySelector("[data-court-next]");
  const nextLabel = stage.querySelector("[data-court-next-label]");
  const ballButton = stage.querySelector("[data-court-ball]");
  const startButton = stage.querySelector("[data-court-start]");
  const againButton = stage.querySelector("[data-court-again]");
  const cta = stage.querySelector("[data-court-cta]");

  let made = 0;
  let busy = false;
  let videoReady = null;   // resolves true once the clip can play, false if it cannot
  let party = null;        // the running confetti, if any
  let onScreen = true;

  function track(name, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, { ...params, page_path: window.location.pathname });
  }

  // ---------- Layout ----------
  // Size the scene like a cover-fitted picture and put the tap target over the ball.
  function layout() {
    const w = film.clientWidth;
    const h = film.clientHeight;
    if (!w || !h) return;
    const tall = w / h <= 0.8;
    stage.classList.toggle("is-tall", tall);
    let box;
    if (tall) {
      scene.style.cssText = "";
      const s = Math.max(w / CLIP.w, h / CLIP.h);
      box = [(w - CLIP.w * s) / 2, (h - CLIP.h * s) / 2, CLIP.w * s, CLIP.h * s];
    } else {
      const s = Math.max(w / PLATE.w, h / PLATE.h);
      const seen = w / (PLATE.w * s);
      const left = clamp(RECT[0] + RECT[2] / 2 - 0.66 * seen, 0, 1 - seen);   // keep the hoop right of centre
      const ox = -left * PLATE.w * s;                                          // top-aligned: keep the lights, lose floor
      scene.style.width = `${(PLATE.w * s).toFixed(1)}px`;
      scene.style.height = `${(PLATE.h * s).toFixed(1)}px`;
      scene.style.left = `${ox.toFixed(1)}px`;
      box = [ox + RECT[0] * PLATE.w * s, 0, RECT[2] * PLATE.w * s, PLATE.h * s];
    }
    if (ballButton) {
      ballButton.style.left = `${(film.offsetLeft + box[0] + BALL[0] * box[2]).toFixed(1)}px`;
      ballButton.style.top = `${(film.offsetTop + box[1] + BALL[1] * box[3]).toFixed(1)}px`;
      ballButton.style.width = ballButton.style.height = `${Math.max(64, BALL[2] * box[2]).toFixed(1)}px`;
    }
  }

  // ---------- Picture ----------
  // Fetch the whole clip up front, so it starts the instant the button is pressed.
  function prepare() {
    videoReady = fetch(`${BASE}/shot-quick.mp4`)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error("clip missing"))))
      .then((blob) => new Promise((resolve, reject) => {
        video.addEventListener("loadeddata", () => resolve(true), { once: true });
        video.addEventListener("error", () => reject(new Error("clip unreadable")), { once: true });
        video.src = URL.createObjectURL(blob);
        video.load();
      }))
      .catch(() => false);
  }

  function show(name, on, instant = false) {
    const img = still[name];
    if (!img) return;
    img.classList.toggle("is-instant", instant);
    img.classList.toggle("is-on", on);
  }

  // Play the clip from the top and resolve twice: when the ball clears the net, and when it ends.
  function playClip(rate, onMade) {
    return new Promise((resolve) => {
      let scored = false;
      let done = false;
      const check = () => {
        if (!scored && video.currentTime >= MADE * video.duration) { scored = true; onMade(); }
      };
      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener("ended", finish);
        video.removeEventListener("timeupdate", check);
        if (!scored) { scored = true; onMade(); }
        resolve();
      };
      const watch = () => {
        if (done) return;
        check();
        if (video.ended) return finish();
        requestAnimationFrame(watch);
      };
      video.playbackRate = rate;
      video.addEventListener("ended", finish);
      video.addEventListener("timeupdate", check);   // still on time when the tab is not painting frames
      setTimeout(finish, (video.duration / rate) * 1000 + 1500);   // never leave the button locked
      video.play().then(() => requestAnimationFrame(watch)).catch(finish);
    });
  }

  // ---------- Words ----------
  function showCard(index) {
    cards.forEach((card, k) => card.classList.toggle("is-on", k === index));
  }
  function describe() {
    pips.forEach((pip, k) => pip.classList.toggle("is-made", k < made));
    if (hudLabel) hudLabel.textContent = made ? `${made} of ${SHOTS} made` : `${SHOTS} shots`;
    if (nextLabel) nextLabel.textContent = made >= SHOTS ? "Finish" : made === SHOTS - 1 ? "Last shot" : "Next shot";
  }
  function score(n) {
    made = n;
    describe();
    showCard(n - 1);
    if (live) live.textContent = cards[n - 1]?.textContent.replace(/\s+/g, " ").trim() || "";
    track("hero_film_shot", { shot_number: n });
  }

  // ---------- The shot ----------
  async function shoot(source) {
    if (busy || made >= SHOTS) return;
    busy = true;
    const n = made + 1;
    track("hero_film_play", { source, shot_number: n });
    stage.classList.add("is-rolling", "is-flying");
    showCard(-1);
    if (hudLabel) hudLabel.textContent = `Shot ${n} of ${SHOTS}`;

    // Whenever the picture is at rest a still covers the clip: the opening frame before a shot, the
    // last frame after it. The video is only uncovered while it is moving, so a browser that draws
    // video slightly differently from images never shows a mismatch on a resting frame.
    const canPlay = await Promise.race([videoReady, wait(6000).then(() => false)]);
    if (canPlay) {
      if (n > 1) {
        // A fresh ball: fade the opening frame in over the last one, then rewind underneath it.
        show("start", true);
        await wait(200);
        show("end", false, true);
        await new Promise((resolve) => {
          video.addEventListener("seeked", resolve, { once: true });
          setTimeout(resolve, 800);
          video.currentTime = 0;
        });
        await nextPaint();
      }
      // The clip is already cut to speed (1.5 seconds, 60 frames a second), so it plays at its own
      // rate and every browser shows it smoothly. The ball reaches the net about 1.3 seconds after
      // the first press. Later shots run a touch quicker to make up for the fresh ball fading in.
      const flight = playClip(n === 1 ? 1 : 1.15, () => score(n));
      show("start", false, true);
      await flight;
      show("end", true, true);
    } else {
      // No video: the same shot told with two stills.
      if (n > 1) {
        show("start", true);
        await wait(450);
      }
      show("end", true, true);
      show("start", false);
      await wait(350);
      score(n);
    }

    stage.classList.remove("is-flying");
    busy = false;
    if (stage.contains(document.activeElement) || document.activeElement === document.body) nextButton?.focus({ preventScroll: true });
  }

  function finish() {
    if (busy || made < SHOTS || stage.classList.contains("is-final")) return;
    stage.classList.add("is-final");
    showCard(-1);
    final?.classList.add("is-on");
    show("confetti", true);
    startConfetti();
    track("hero_film_complete");
    if (typeof window.fbq === "function") window.fbq("trackCustom", "HeroFilmComplete");
    cta?.focus({ preventScroll: true });
  }

  function again() {
    if (busy) return;
    track("hero_film_replay");
    stopConfetti();
    made = 0;
    describe();
    showCard(-1);
    final?.classList.remove("is-on");
    show("confetti", false);
    show("end", false);
    show("start", true, true);   // the opening frame, at once, while the clip rewinds behind it
    video.pause();
    try { video.currentTime = 0; } catch (error) { /* not loaded yet: the poster is showing anyway */ }
    stage.classList.remove("is-final", "is-rolling", "is-flying");
    if (live) live.textContent = "";
    startButton?.focus({ preventScroll: true });
  }

  // ---------- Confetti ----------
  // Paper falls for as long as the closing banner is on screen. Near pieces are bigger, softer and
  // faster, to sit with the confetti in the picture behind them.
  function startConfetti() {
    if (party || !onScreen) return;
    const layer = document.createElement("canvas");
    const pen = layer.getContext("2d");
    if (!pen) return;
    layer.className = "court-confetti";
    layer.setAttribute("aria-hidden", "true");
    stage.append(layer);
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    layer.width = Math.round(width * ratio);
    layer.height = Math.round(height * ratio);
    pen.scale(ratio, ratio);
    const count = width < 720 ? 130 : 260;
    const pieces = Array.from({ length: count }, (_, n) => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: -30 - Math.random() * height * 1.1,
        vx: (Math.random() - 0.5) * 0.12,
        vy: 0.07 + depth * 0.21,
        size: 5 + depth * 12,
        blur: depth > 0.82 ? 3 : 0,
        turn: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.012,
        sway: Math.random() * Math.PI * 2,
        color: CONFETTI[n % CONFETTI.length],
      };
    });
    party = { layer, ending: 0 };
    const mine = party;
    let before = 0;
    const tick = (now) => {
      if (party !== mine) return;
      const dt = Math.min(34, now - (before || now));
      before = now;
      const fade = mine.ending ? Math.max(0, 1 - (now - mine.ending) / 500) : 1;
      pen.clearRect(0, 0, width, height);
      pen.globalAlpha = fade;
      for (const p of pieces) {
        p.sway += 0.0035 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 0.05) * dt;
        p.y += p.vy * dt;
        p.turn += p.spin * dt;
        if (p.y > height + 30 && !mine.ending) { p.y = -30; p.x = Math.random() * width; }
        const flip = Math.cos(p.sway * 2);
        pen.save();
        pen.translate(p.x, p.y);
        pen.rotate(p.turn);
        pen.filter = p.blur ? `blur(${p.blur}px)` : "none";
        pen.fillStyle = p.color;
        pen.fillRect(-p.size / 2, (-p.size * 0.45 * flip) / 2, p.size, p.size * 0.45 * flip);
        pen.restore();
      }
      if (fade > 0) requestAnimationFrame(tick);
      else { layer.remove(); party = null; }
    };
    requestAnimationFrame(tick);
  }
  function stopConfetti() {
    if (party && !party.ending) party.ending = performance.now();
  }

  // ---------- Start ----------
  layout();
  const needed = [loadImage(`${BASE}/start.webp`)];
  if (!stage.classList.contains("is-tall")) needed.push(loadImage(`${BASE}/plate.webp`));
  await Promise.race([
    Promise.all(needed),
    new Promise((_, reject) => setTimeout(() => reject(new Error("court: opening still timed out")), 9000)),
  ]);
  stage.classList.add("is-live");
  describe();
  prepare();

  window.addEventListener("resize", layout);
  startButton?.addEventListener("click", () => shoot("button"));
  ballButton?.addEventListener("click", () => shoot("ball"));
  nextButton?.addEventListener("click", () => (made >= SHOTS ? finish() : shoot("next")));
  againButton?.addEventListener("click", again);
  if ("IntersectionObserver" in window) {
    // Stop drawing confetti once the hero has scrolled away; pick it up again if the visitor returns.
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (!onScreen) stopConfetti();
      else if (stage.classList.contains("is-final")) startConfetti();
    }, { threshold: 0.05 }).observe(stage);
  }
}
