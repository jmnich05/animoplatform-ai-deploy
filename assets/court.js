// Homepage film hero: one slow-motion shot, played four times, scrubbed by scroll.
//
// The shot is a short clip cut into still frames (tools: clients/animo-platform/2026-11-20-court-film
// in the design workspace). Scrolling moves through the frames: the ball hangs in the air, flies, and
// drops through the net. After each make a card shows one problem Ánimo solves, then a fresh ball fades
// in and the same shot plays again. After the fourth make the arena fills with confetti and a banner
// invites a conversation.
//
// Three things keep it easy to follow. A shot that has been started finishes by itself when the
// visitor stops scrolling. The arrow keys step from shot to shot. And the ball, the "Take the shot"
// button and the button under each card all play the next shot for the visitor.
//
// On landscape screens the clip is only the middle of the picture. Around it sits a wide still of the
// same arena (the "plate"), with a soft-edged hole the frames show through. On portrait screens the
// clip fills the screen. start() rejects if the first frame cannot load, and the page then falls back
// to the tap-the-ball court.

const BASE = "/assets/court/20261120";
const PLATE = { w: 1920, h: 1072 };
// frames: stills in the sequence. rect: where the clip sits in the plate (x, y, w, h as fractions).
// phone: the part of the clip's width a phone frame shows (left edge, width). made: how far through
// the clip the ball clears the net (0 to 1). ball: where the ball is in the first frame (x, y, diameter).
const CLIP = { id: "s1", frames: 61, rect: [0.47187, 0, 0.41667, 1], phone: [0.1653, 0.6695], made: 0.86, ball: [0.505, 0.622, 0.2] };
const SHOTS = 4;
const CONFETTI = ["#f5a623", "#e8826b", "#fbf5e9", "#c85a3d", "#b9c79b", "#f5ebd8"];

// The timeline, in units. One unit is SPAN stage-heights of scrolling.
const INTRO = 0.3;   // the opening frame holds while the headline is up
const LEN = 1.3;     // one shot: the clip plays, then its card holds
const PLAY = 0.8;    // the part of a shot the clip plays across
const FADE = 0.12;   // the next ball fades in at the end of a shot
const FIN = 0.85;    // the confetti and the closing banner
const SPAN = 0.72;
const END = INTRO + SHOTS * LEN;
const UNITS = END + FIN;
const CARD_IN = CLIP.made * PLAY + 0.02;

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
  const nextButton = stage.querySelector("[data-court-next]");
  const nextLabel = stage.querySelector("[data-court-next-label]");
  const ballButton = stage.querySelector("[data-court-ball]");
  const ballLabel = stage.querySelector("[data-court-ball-label]");
  const hint = stage.querySelector("[data-court-hint]");
  const startButton = stage.querySelector("[data-court-start]");
  const againButton = stage.querySelector("[data-court-again]");
  const cta = stage.querySelector("[data-court-cta]");
  const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const verb = touch ? "Swipe up" : "Scroll";

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
  let party = null;        // the running confetti, if any
  let lastY = window.scrollY;
  let heading = 1;         // the direction the visitor last scrolled: 1 forward, -1 back
  let idle = 0;
  let touching = false;
  let held = false;        // set by the manual check below, so a frozen moment stays frozen

  section.style.height = `calc(100lvh * ${(1 + UNITS * SPAN).toFixed(3)})`;
  stage.classList.toggle("is-touch", touch);
  if (ballLabel) ballLabel.textContent = `${verb} to shoot`;
  if (hint) hint.textContent = touch ? "or swipe up ↑" : "or scroll, or press ↓";

  // ---------- Frames ----------
  const frames = new Map();   // "d" -> array of loaded images (holes while loading)
  let plate = null;
  const finale = new Map();   // "d" -> the confetti still
  const asked = new Set();

  function frameSet(v = variant) {
    if (!frames.has(v)) frames.set(v, new Array(CLIP.frames));
    return frames.get(v);
  }

  function ensure() {
    if (asked.has(variant)) return;
    asked.add(variant);
    const v = variant;
    const set = frameSet(v);
    if (!plate) loadImage(`${BASE}/${CLIP.id}/plate.webp`).then((img) => { plate = img; poke(true); }).catch(() => {});
    let next = 0;
    let finaleAsked = false;
    const pump = () => {
      if (next >= set.length) {
        if (!finaleAsked) {
          finaleAsked = true;
          loadImage(`${BASE}/fin/${v}.webp`).then((img) => { finale.set(v, img); poke(true); }).catch(() => {});
        }
        return;
      }
      const n = next++;
      if (set[n]) return pump();
      loadImage(`${BASE}/${CLIP.id}/${v}/${pad(n + 1)}.webp`)
        .then((img) => { set[n] = img; poke(true); })
        .catch(() => {})
        .finally(pump);
    };
    for (let k = 0; k < 6; k++) pump();
  }

  // The loaded frame nearest to the one asked for, so a slow connection shows a slightly older moment
  // instead of nothing.
  function frameNear(n) {
    const set = frameSet();
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
      cw = canvas.width = pw;
      ch = canvas.height = ph;
    }
    drawnKey = "";
  }

  // Where the picture lands on the canvas: the clip's box, and (wide only) the plate's box.
  function boxes(img) {
    if (mode === "wide") {
      const s = Math.max(cw / PLATE.w, ch / PLATE.h);
      const vw = cw / (PLATE.w * s);
      const centre = CLIP.rect[0] + CLIP.rect[2] / 2;
      const left = clamp(centre - 0.66 * vw, 0, 1 - vw);   // keep the action right of centre
      const ox = -left * PLATE.w * s;                       // top-aligned: keep the lights, lose floor
      return {
        plate: [ox, 0, PLATE.w * s, PLATE.h * s],
        clip: [ox + CLIP.rect[0] * PLATE.w * s, CLIP.rect[1] * PLATE.h * s, CLIP.rect[2] * PLATE.w * s, CLIP.rect[3] * PLATE.h * s],
        crop: [0, 1],
      };
    }
    const iw = img?.naturalWidth || (variant === "m" ? 540 : 800);
    const ih = img?.naturalHeight || (variant === "m" ? 1080 : 1071);
    const s = Math.max(cw / iw, ch / ih);
    return { plate: null, clip: [(cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s], crop: variant === "m" ? CLIP.phone : [0, 1] };
  }

  // position: which frame, with a fraction. fresh: how far the next ball has faded in.
  // confetti: how far the picture has dissolved into the confetti still.
  function paint(position, fresh, confetti) {
    const whole = Math.floor(position);
    const part = position - whole;
    const a = frameNear(whole);
    if (!a) return false;
    if (mode === "wide" && !plate) return false;
    const set = frameSet();
    const box = boxes(a);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(a, ...box.clip);
    if (part > 0.03 && set[whole + 1]) {   // a soft blend between neighbouring frames keeps slow scrolling smooth
      ctx.globalAlpha = part;
      ctx.drawImage(set[whole + 1], ...box.clip);
    }
    if (fresh > 0 && set[0]) {
      ctx.globalAlpha = fresh;
      ctx.drawImage(set[0], ...box.clip);
    }
    const still = finale.get(variant);
    if (confetti > 0 && still) {
      ctx.globalAlpha = confetti;
      ctx.drawImage(still, ...box.clip);
    }
    ctx.globalAlpha = 1;
    if (box.plate) ctx.drawImage(plate, ...box.plate);
    return true;
  }

  // ---------- Timeline ----------
  // Where the picture rests: after each card has arrived, and on the closing banner.
  const stops = [...Array.from({ length: SHOTS }, (_, k) => INTRO + k * LEN + CARD_IN + 0.17), END + 0.42];
  const resting = (p) => p <= 0.1 || p >= END + 0.3 || stops.slice(0, SHOTS).some((stop, k) => p >= stop - 0.07 && p <= INTRO + k * LEN + LEN - 0.2);

  function metrics() {
    const top = section.getBoundingClientRect().top + window.scrollY;
    return { top, span: Math.max(1, section.offsetHeight - stage.offsetHeight) };
  }
  function readPosition() {
    const { top, span } = metrics();
    return clamp((window.scrollY - top) / span, 0, 1) * UNITS;
  }
  function pinned() {
    const { top, span } = metrics();
    return window.scrollY >= top - 2 && window.scrollY <= top + span + 2;
  }
  function scrollTo(position) {
    const { top, span } = metrics();
    window.scrollTo({ top: top + (position / UNITS) * span, behavior: "instant" });
  }

  function render(position, settled) {
    const i = clamp(Math.floor((position - INTRO) / LEN), 0, SHOTS - 1);
    const u = clamp(position - INTRO - i * LEN, 0, LEN);
    let at = clamp(u / PLAY, 0, 1) * (CLIP.frames - 1);
    if (settled) at = Math.round(at);   // come to rest on a clean single frame
    const fresh = i < SHOTS - 1 ? smooth(LEN - FADE, LEN, u) : 0;
    const over = position - END;
    const confetti = smooth(-0.1, 0.12, over);
    const closing = smooth(0.06, 0.22, over);

    ensure();
    const key = `${at.toFixed(2)}|${fresh.toFixed(2)}|${confetti.toFixed(2)}|${cw}x${ch}|${!!plate}|${!!finale.get(variant)}|${frameSet().filter(Boolean).length}`;
    if (key !== drawnKey && paint(at, fresh, confetti)) {
      drawnKey = key;
      stage.classList.add("is-live");
    }

    // The words over the picture.
    const intro = 1 - smooth(INTRO - 0.14, INTRO + 0.12, position);
    let made = 0;
    const alphas = cards.map((_, k) => {
      const uk = position - INTRO - k * LEN;
      if (uk >= CLIP.made * PLAY) made = k + 1;
      return smooth(CARD_IN, CARD_IN + 0.1, uk) * (1 - smooth(LEN - 0.16, LEN - 0.05, uk));
    });
    const stopIndex = stops.findIndex((stop) => stop > position + 0.04);
    const cardUp = alphas[i] > 0.6;
    const ui = `${intro.toFixed(3)}|${closing.toFixed(3)}|${made}|${stopIndex}|${cardUp}|${alphas.map((a) => a.toFixed(3)).join(",")}`;
    if (ui === uiKey) return;
    uiKey = ui;

    stage.style.setProperty("--intro", intro.toFixed(3));
    stage.classList.toggle("is-rolling", intro < 0.02);
    stage.classList.toggle("is-final", closing > 0.5);
    cards.forEach((card, k) => {
      card.style.opacity = alphas[k].toFixed(3);
      card.style.setProperty("--rise", `${((1 - alphas[k]) * 26).toFixed(1)}px`);
    });
    if (final) {
      final.style.opacity = closing.toFixed(3);
      final.style.setProperty("--rise", `${((1 - closing) * 26).toFixed(1)}px`);
    }
    pips.forEach((pip, k) => pip.classList.toggle("is-made", k < made));
    if (nextButton && nextLabel) {
      nextButton.hidden = stopIndex < 0;
      // Say what scrolling does next: finish this shot, take the next one, or see the finish.
      nextLabel.textContent = !cardUp ? `Keep ${touch ? "swiping up" : "scrolling"}` : stopIndex >= SHOTS ? `${verb} for the finish` : `${verb} for shot ${stopIndex + 1} of ${SHOTS}`;
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
    }
    if (closing < 0.05) finished = false;
    if (closing > 0.3) startConfetti(); else if (closing < 0.05) stopConfetti();
  }

  // Put the tap target over the ball in the opening frame.
  function placeBall() {
    const [bx, by, bd] = CLIP.ball;
    const box = boxes(frameSet()[0]);
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
      lastY = window.scrollY;
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

  // Scroll to a point on the timeline for the visitor, at the pace of the film.
  function play(to, pace = 2700) {
    const from = readPosition();
    if (Math.abs(to - from) < 0.01) return;
    held = false;
    auto = { from, to, start: performance.now(), duration: clamp(Math.abs(to - from) * pace, 450, 4200) };
    poke();
  }
  function advance(source) {
    const to = stops.find((stop) => stop > readPosition() + 0.04);
    if (to === undefined) return false;
    track("hero_film_play", { source });
    play(to);
    // The opening buttons leave with the headline; hand keyboard focus to the control that stays.
    if (source === "ball" || source === "button") window.setTimeout(() => nextButton?.focus({ preventScroll: true }), 700);
    return true;
  }
  function retreat() {
    const from = readPosition();
    if (from <= 0.02) return false;
    play([...stops].reverse().find((stop) => stop < from - 0.04) ?? 0, 1500);
    return true;
  }
  function cancelAuto() { auto = null; held = false; }

  // A shot that has been started should finish. When scrolling stops part-way through one, carry on
  // in the direction the visitor was going until the picture reaches its next resting point.
  function settle() {
    if (auto || touching || held || !pinned()) return;
    const from = readPosition();
    if (resting(from)) return;
    if (heading > 0) play(stops.find((stop) => stop > from) ?? from, 2300);
    else play([...stops].reverse().find((stop) => stop < from) ?? 0, 1500);
  }
  function onScroll() {
    const y = window.scrollY;
    if (!auto) {
      if (y !== lastY) heading = y > lastY ? 1 : -1;
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 190);
    }
    lastY = y;
    poke();
  }

  // ---------- Confetti ----------
  // Paper falls for as long as the closing banner is up. Near pieces are bigger, softer and faster,
  // to sit with the confetti in the picture behind them.
  function startConfetti() {
    if (party) return;
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
  ensure();
  const needed = [loadImage(`${BASE}/${CLIP.id}/${variant}/001.webp`)];
  if (mode === "wide") needed.push(loadImage(`${BASE}/${CLIP.id}/plate.webp`));
  await Promise.race([
    Promise.all(needed),
    new Promise((_, reject) => setTimeout(() => reject(new Error("court: first frame timed out")), 9000)),
  ]);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { layout(); uiKey = ""; poke(true); });
  for (const type of ["wheel", "mousedown"]) window.addEventListener(type, cancelAuto, { passive: true });
  window.addEventListener("touchstart", () => { touching = true; cancelAuto(); }, { passive: true });
  for (const type of ["touchend", "touchcancel"]) {
    window.addEventListener(type, () => { touching = false; window.clearTimeout(idle); idle = window.setTimeout(settle, 240); }, { passive: true });
  }
  // The arrow keys step from shot to shot while the film is on screen.
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || !pinned()) return;
    if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const onControl = !!event.target.closest?.("button, a");
    const forward = event.key === "ArrowDown" || event.key === "PageDown" || (event.key === " " && !onControl && !event.shiftKey);
    const back = event.key === "ArrowUp" || event.key === "PageUp";
    if (forward ? advance("key") : back ? retreat() : false) event.preventDefault();
  });
  startButton?.addEventListener("click", () => advance("button"));
  ballButton?.addEventListener("click", () => advance("ball"));
  nextButton?.addEventListener("click", () => advance("next"));
  againButton?.addEventListener("click", () => {
    track("hero_film_replay");
    play(0, 600);
    startButton?.focus({ preventScroll: true });
  });
  // The cards and banner sit over each other; only the one on screen should take keyboard focus.
  cta?.addEventListener("focus", () => { if (!stage.classList.contains("is-final")) nextButton?.focus(); });

  shown = readPosition();
  render(shown, true);
  poke();

  // For checking a moment of the film by hand: __court.at(1.2) freezes the picture there.
  window.__court = { units: UNITS, stops, at: (position) => { auto = null; held = true; scrollTo(position); shown = readPosition(); drawnKey = ""; uiKey = ""; render(shown, true); return shown; } };
}
