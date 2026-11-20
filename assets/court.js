// Homepage film hero: four slow-motion shots, scrubbed by scroll.
//
// Each shot is a short clip cut into still frames (tools: clients/animo-platform/2026-11-20-court-film
// in the design workspace). Scrolling moves through the frames, so the visitor controls time: the ball
// hangs in the air, flies, and drops through the net as they scroll. After each make, a card shows one
// problem Ánimo solves. Tapping the ball, or the buttons, plays the next shot by scrolling for them.
//
// On landscape screens a clip is only the middle of the picture. Around it sits a wide still of the same
// arena (the "plate"), with a soft-edged hole the frames show through. On portrait screens the clip
// fills the screen. start() rejects if the first frame cannot load, and the page then falls back to the
// tap-the-ball court.

const BASE = "/assets/court/20261120";
const PLATE = { w: 1920, h: 1072 };
// frames: stills in the sequence. rect: where the clip sits in the plate (x, y, w, h as fractions).
// phone: the part of the clip's width a phone frame shows (left edge, width). made: how far through
// the clip the ball clears the net (0 to 1). lift: on portrait screens, how far the picture slides up
// when the card arrives, so the hoop stays in view above it. ball: where the ball is in the first frame
// (x, y, diameter).
const SHOTS = [
  { id: "s1", frames: 61, rect: [0.47187, 0, 0.41667, 1], phone: [0.1653, 0.6695], made: 0.86, lift: 0, ball: [0.505, 0.622, 0.2] },
  { id: "s2", frames: 61, rect: [0.47187, 0, 0.41667, 1], phone: [0.1053, 0.6695], made: 0.85, lift: 0.2 },
  { id: "s3", frames: 61, rect: [0.47187, 0, 0.41667, 1], phone: [0.1653, 0.6695], made: 0.6, lift: 0.13 },
  { id: "s4", frames: 61, rect: [0.47187, 0, 0.41667, 1], phone: [0.1653, 0.6695], made: 0.8, lift: 0.17 },
];
const CONFETTI = ["#f5a623", "#e8826b", "#fbf5e9", "#c85a3d", "#b9c79b", "#f5ebd8"];

// The timeline, in units. One unit is SPAN stage-heights of scrolling.
const INTRO = 0.3;   // the opening frame holds while the headline is up
const LEN = 1.3;     // one shot: the clip plays, then its card holds
const PLAY = 0.8;    // the part of a shot the clip plays across
const FADE = 0.08;   // cross-fade into the next shot
const OUTRO = 0.7;   // the closing banner
const SPAN = 0.72;
const UNITS = INTRO + SHOTS.length * LEN + OUTRO;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pad = (n) => String(n).padStart(3, "0");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function start() {
  const section = document.querySelector("[data-court]");
  const stage = section?.querySelector("[data-court-stage]");
  const film = stage?.querySelector("[data-court-film]");
  const canvas = film?.querySelector("[data-court-canvas]");
  const ctx = canvas?.getContext("2d", { alpha: false });
  if (!section || !stage || !ctx) throw new Error("court: markup missing");

  const cards = [...stage.querySelectorAll("[data-court-card]")];
  const final = stage.querySelector("[data-court-final]");
  const pips = [...stage.querySelectorAll("[data-court-pip]")];
  const hudLabel = stage.querySelector("[data-court-hud-label]");
  const nextButton = stage.querySelector("[data-court-next]");
  const nextLabel = stage.querySelector("[data-court-next-label]");
  const ballButton = stage.querySelector("[data-court-ball]");
  const startButton = stage.querySelector("[data-court-start]");
  const againButton = stage.querySelector("[data-court-again]");
  const cta = stage.querySelector("[data-court-cta]");
  const scratch = document.createElement("canvas");
  const scratchCtx = scratch.getContext("2d", { alpha: false });

  let mode = "wide";       // "wide": plate plus clip. "tall": clip only.
  let variant = "d";       // which frame set: "d" desktop, "m" phone
  let cw = 0;
  let ch = 0;
  let shown = 0;           // the timeline position on screen
  let raf = 0;
  let last = 0;
  let auto = null;         // a scroll the script is playing for the visitor
  let drawnKey = "";
  let uiKey = "";
  let topShot = 0;         // highest shot reported to analytics
  let finished = false;
  let confettiOn = false;

  section.style.height = `calc(100lvh * ${(1 + UNITS * SPAN).toFixed(3)})`;

  // ---------- Frames ----------
  const frames = new Map();   // "s1/d" -> array of loaded images (holes while loading)
  const plates = new Map();   // shot index -> image
  const asked = new Set();

  function setOf(i, v = variant) {
    const key = `${SHOTS[i].id}/${v}`;
    if (!frames.has(key)) frames.set(key, new Array(SHOTS[i].frames));
    return frames.get(key);
  }

  function ensure(i) {
    if (i < 0 || i >= SHOTS.length) return;
    const key = `${SHOTS[i].id}/${variant}`;
    if (asked.has(key)) return;
    asked.add(key);
    const set = setOf(i);
    if (!plates.has(i)) {
      loadImage(`${BASE}/${SHOTS[i].id}/plate.webp`).then((img) => { plates.set(i, img); poke(true); }).catch(() => {});
    }
    let next = 0;
    const pump = () => {
      if (next >= set.length) return;
      const n = next++;
      if (set[n]) return pump();
      loadImage(`${BASE}/${SHOTS[i].id}/${variant}/${pad(n + 1)}.webp`)
        .then((img) => { set[n] = img; poke(true); })
        .catch(() => {})
        .finally(pump);
    };
    for (let k = 0; k < 6; k++) pump();
  }

  // The loaded frame nearest to the one asked for, so a slow connection shows a slightly older moment
  // instead of nothing.
  function frameNear(i, n) {
    const set = setOf(i);
    for (let d = 0; d < set.length; d++) {
      if (set[n - d]) return set[n - d];
      if (set[n + d]) return set[n + d];
    }
    return null;
  }

  // ---------- Layout ----------
  function layout() {
    const w = film.clientWidth;
    const h = film.clientHeight;
    if (!w || !h) return;
    const aspect = w / h;
    mode = aspect > 0.8 ? "wide" : "tall";
    variant = mode === "wide" || aspect >= 0.62 ? "d" : "m";
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let pw = Math.round(w * ratio);
    let ph = Math.round(h * ratio);
    const cap = 2.3e6;     // the footage has about two megapixels; a bigger canvas adds nothing
    if (pw * ph > cap) { const k = Math.sqrt(cap / (pw * ph)); pw = Math.round(pw * k); ph = Math.round(ph * k); }
    if (pw !== cw || ph !== ch) {
      cw = canvas.width = scratch.width = pw;
      ch = canvas.height = scratch.height = ph;
    }
    drawnKey = "";
  }

  // Where shot i lands on the canvas: the clip's box, and (wide only) the plate's box.
  function boxes(i, img, raised = 0) {
    const shot = SHOTS[i];
    if (mode === "wide") {
      const s = Math.max(cw / PLATE.w, ch / PLATE.h);
      const vw = cw / (PLATE.w * s);
      const vh = ch / (PLATE.h * s);
      const centre = shot.rect[0] + shot.rect[2] / 2;
      const left = clamp(centre - 0.66 * vw, 0, 1 - vw);   // keep the action right of centre
      const top = 0;                                        // keep the lights and the top of the arc; lose floor instead
      const ox = -left * PLATE.w * s;
      const oy = -top * PLATE.h * s;
      return {
        plate: [ox, oy, PLATE.w * s, PLATE.h * s],
        clip: [ox + shot.rect[0] * PLATE.w * s, oy + shot.rect[1] * PLATE.h * s, shot.rect[2] * PLATE.w * s, shot.rect[3] * PLATE.h * s],
        crop: [0, 1],
      };
    }
    const iw = img?.naturalWidth || (variant === "m" ? 540 : 800);
    const ih = img?.naturalHeight || (variant === "m" ? 1080 : 1071);
    const s = Math.max(cw / iw, ch / ih);
    return { plate: null, clip: [(cw - iw * s) / 2, (ch - ih * s) / 2 - shot.lift * raised * ch, iw * s, ih * s], crop: variant === "m" ? shot.phone : [0, 1] };
  }

  function paintShot(target, i, position, raised = 0) {
    const whole = Math.floor(position);
    const part = position - whole;
    const a = frameNear(i, whole);
    if (!a) return false;
    const b = part > 0.03 ? setOf(i)[whole + 1] : null;
    const box = boxes(i, a, raised);
    target.globalAlpha = 1;
    target.fillStyle = "#0a0908";
    target.fillRect(0, 0, cw, ch);
    target.drawImage(a, ...box.clip);
    if (b) {   // a soft blend between neighbouring frames keeps slow scrolling smooth
      target.globalAlpha = part;
      target.drawImage(b, ...box.clip);
      target.globalAlpha = 1;
    }
    if (box.plate) {
      const plate = plates.get(i);
      if (!plate) return false;
      target.drawImage(plate, ...box.plate);
    }
    return true;
  }

  // ---------- Timeline ----------
  const cardIn = (i) => SHOTS[i].made * PLAY + 0.02;
  const stops = [...SHOTS.map((_, i) => INTRO + i * LEN + cardIn(i) + 0.17), INTRO + SHOTS.length * LEN + 0.32];

  function metrics() {
    const top = section.getBoundingClientRect().top + window.scrollY;
    return { top, span: Math.max(1, section.offsetHeight - stage.offsetHeight) };
  }
  function readPosition() {
    const { top, span } = metrics();
    return clamp((window.scrollY - top) / span, 0, 1) * UNITS;
  }
  function scrollTo(position) {
    const { top, span } = metrics();
    window.scrollTo({ top: top + (position / UNITS) * span, behavior: "instant" });
  }

  function render(position, settled) {
    const i = clamp(Math.floor((position - INTRO) / LEN), 0, SHOTS.length - 1);
    const u = clamp(position - INTRO - i * LEN, 0, LEN);
    const shot = SHOTS[i];
    let at = clamp(u / PLAY, 0, 1) * (shot.frames - 1);
    if (settled) at = Math.round(at);   // come to rest on a clean single frame
    const fade = i < SHOTS.length - 1 ? clamp((u - (LEN - FADE)) / FADE, 0, 1) : 0;

    ensure(i);
    if (position > 0.02 || fade > 0 || u > PLAY * 0.4) ensure(i + 1);

    // The words over the picture.
    const intro = 1 - smooth(INTRO - 0.14, INTRO + 0.12, position);
    const outro = position - (INTRO + SHOTS.length * LEN);
    const closing = smooth(-0.02, 0.12, outro);
    let made = 0;
    const alphas = cards.map((_, k) => {
      if (k >= SHOTS.length) return 0;
      const uk = position - INTRO - k * LEN;
      if (uk >= SHOTS[k].made * PLAY) made = k + 1;
      return smooth(cardIn(k), cardIn(k) + 0.1, uk) * (1 - smooth(LEN - 0.14, LEN - 0.04, uk));
    });
    const raised = Math.max(alphas[i] || 0, i === SHOTS.length - 1 ? closing : 0);

    const key = `${i}|${at.toFixed(2)}|${fade.toFixed(2)}|${raised.toFixed(2)}|${cw}x${ch}|${plates.has(i)}|${setOf(i).filter(Boolean).length}`;
    if (key !== drawnKey) {
      const ok = paintShot(ctx, i, at, raised);
      if (ok && fade > 0 && paintShot(scratchCtx, i + 1, 0)) {
        ctx.globalAlpha = fade;
        ctx.drawImage(scratch, 0, 0);
        ctx.globalAlpha = 1;
      }
      if (ok) {
        drawnKey = key;
        stage.classList.add("is-live");
      }
    }

    const stopIndex = stops.findIndex((stop) => stop > position + 0.04);
    const ui = `${intro.toFixed(3)}|${closing.toFixed(3)}|${made}|${stopIndex}|${i}|${alphas.map((a) => a.toFixed(3)).join(",")}`;
    if (ui === uiKey) return;
    uiKey = ui;

    stage.style.setProperty("--intro", intro.toFixed(3));
    stage.classList.toggle("is-rolling", intro < 0.02);
    stage.classList.toggle("is-final", closing > 0.5);
    cards.forEach((card, k) => {
      card.style.opacity = alphas[k].toFixed(3);
      card.style.transform = `translateY(${((1 - alphas[k]) * 22).toFixed(1)}px)`;
    });
    if (final) {
      final.style.opacity = closing.toFixed(3);
      final.style.transform = `translateY(${((1 - closing) * 22).toFixed(1)}px)`;
    }
    pips.forEach((pip, k) => pip.classList.toggle("is-made", k < made));
    if (hudLabel) hudLabel.textContent = `Shot ${i + 1} of ${SHOTS.length}`;
    if (nextButton) {
      nextButton.hidden = stopIndex < 0;
      if (nextLabel && stopIndex >= 0) nextLabel.textContent = stopIndex >= SHOTS.length ? "Finish" : stopIndex === SHOTS.length - 1 ? "Last shot" : "Next shot";
    }
    if (ballButton) placeBall();

    if (made > topShot) {
      topShot = made;
      track("hero_film_shot", { shot_number: made });
    }
    if (closing > 0.5 && !finished) {
      finished = true;
      track("hero_film_complete");
      if (typeof window.fbq === "function") window.fbq("trackCustom", "HeroFilmComplete");
      confetti();
    }
    if (closing < 0.05) finished = false;
  }

  // Put the tap target over the ball in the opening frame.
  function placeBall() {
    const [bx, by, bd] = SHOTS[0].ball;
    const box = boxes(0, setOf(0)[0]);
    const [from, width] = box.crop;
    const k = film.clientWidth / cw;
    const size = (bd / width) * box.clip[2] * k;
    ballButton.style.left = `${(film.offsetLeft + (box.clip[0] + ((bx - from) / width) * box.clip[2]) * k).toFixed(1)}px`;
    ballButton.style.top = `${(film.offsetTop + (box.clip[1] + by * box.clip[3]) * k).toFixed(1)}px`;
    ballButton.style.width = ballButton.style.height = `${Math.max(64, size).toFixed(1)}px`;
  }

  function track(name, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, { ...params, page_path: window.location.pathname });
  }

  // ---------- The loop ----------
  function frame(now) {
    raf = 0;
    const dt = Math.min(64, now - last || 16);
    last = now;
    if (auto) {
      const t = clamp((now - auto.start) / auto.duration, 0, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      scrollTo(auto.from + (auto.to - auto.from) * eased);
      if (t >= 1) auto = null;
    }
    const target = readPosition();
    const gap = target - shown;
    shown = Math.abs(gap) < 0.0015 ? target : shown + gap * (1 - Math.exp(-dt / 85));
    render(shown, shown === target && !auto);
    if (shown !== target || auto) raf = requestAnimationFrame(frame);
  }
  function poke(redraw) {
    if (redraw) drawnKey = "";
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // Play the next shot for the visitor by scrolling to its card.
  function advance(source) {
    const from = readPosition();
    const to = stops.find((stop) => stop > from + 0.04);
    if (to === undefined) return;
    auto = { from, to, start: performance.now(), duration: clamp((to - from) * 2700, 1100, 4200) };
    track("hero_film_play", { source });
    // The opening buttons leave with the headline; hand keyboard focus to the control that stays.
    if (source !== "next") window.setTimeout(() => nextButton?.focus({ preventScroll: true }), 700);
    poke();
  }
  function cancelAuto() { auto = null; }

  function confetti() {
    if (confettiOn) return;
    const layer = document.createElement("canvas");
    const pen = layer.getContext("2d");
    if (!pen) return;
    confettiOn = true;
    layer.className = "court-confetti";
    layer.setAttribute("aria-hidden", "true");
    stage.append(layer);
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    layer.width = Math.round(width * ratio);
    layer.height = Math.round(height * ratio);
    pen.scale(ratio, ratio);
    const count = width < 720 ? 110 : 220;
    const pieces = Array.from({ length: count }, (_, n) => {
      const depth = Math.random();   // near pieces are bigger, softer and faster, like the footage
      return {
        x: Math.random() * width,
        y: -30 - Math.random() * height * 0.9,
        vx: (Math.random() - 0.5) * 0.12,
        vy: 0.07 + depth * 0.2,
        size: 5 + depth * 11,
        blur: depth > 0.8 ? 3 : 0,
        turn: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.012,
        sway: Math.random() * Math.PI * 2,
        color: CONFETTI[n % CONFETTI.length],
      };
    });
    const life = 6200;
    let begun = 0;
    let before = 0;
    const tick = (now) => {
      if (!begun) { begun = now; before = now; }
      const elapsed = now - begun;
      const dt = Math.min(34, now - before);
      before = now;
      pen.clearRect(0, 0, width, height);
      pen.globalAlpha = elapsed > life - 1100 ? Math.max(0, (life - elapsed) / 1100) : 1;
      for (const p of pieces) {
        p.sway += 0.0035 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 0.05) * dt;
        p.y += p.vy * dt;
        p.turn += p.spin * dt;
        const flip = Math.cos(p.sway * 2);
        pen.save();
        pen.translate(p.x, p.y);
        pen.rotate(p.turn);
        pen.filter = p.blur ? `blur(${p.blur}px)` : "none";
        pen.fillStyle = p.color;
        pen.fillRect(-p.size / 2, (-p.size * 0.45 * flip) / 2, p.size, p.size * 0.45 * flip);
        pen.restore();
      }
      if (elapsed < life) requestAnimationFrame(tick);
      else { layer.remove(); confettiOn = false; }
    };
    requestAnimationFrame(tick);
  }

  // ---------- Start ----------
  layout();
  ensure(0);
  const first = `${BASE}/${SHOTS[0].id}/${variant}/001.webp`;
  const needed = [loadImage(first)];
  if (mode === "wide") needed.push(loadImage(`${BASE}/${SHOTS[0].id}/plate.webp`));
  await Promise.race([
    Promise.all(needed),
    new Promise((_, reject) => setTimeout(() => reject(new Error("court: first frame timed out")), 9000)),
  ]);

  window.addEventListener("scroll", () => poke(), { passive: true });
  window.addEventListener("resize", () => { layout(); uiKey = ""; poke(true); });
  for (const type of ["wheel", "touchstart", "mousedown"]) window.addEventListener(type, cancelAuto, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key) && !event.target.closest?.("button, a")) cancelAuto();
  });
  startButton?.addEventListener("click", () => advance("button"));
  ballButton?.addEventListener("click", () => advance("ball"));
  nextButton?.addEventListener("click", () => advance("next"));
  againButton?.addEventListener("click", () => {
    auto = { from: readPosition(), to: 0, start: performance.now(), duration: 1400 };
    track("hero_film_replay");
    poke();
    startButton?.focus({ preventScroll: true });
  });
  // The cards and banner sit over each other; only the one on screen should take a click.
  cta?.addEventListener("focus", () => { if (!stage.classList.contains("is-final")) nextButton?.focus(); });
  shown = readPosition();
  render(shown, true);
  poke();

  // For checking a moment of the film by hand: __court.at(1.2) jumps the picture there.
  window.__court = { units: UNITS, stops, at: (position) => { scrollTo(position); shown = readPosition(); drawnKey = ""; uiKey = ""; render(shown, true); return shown; } };
}
