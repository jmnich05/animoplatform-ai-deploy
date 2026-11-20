// Homepage hero: four shots, four fixes.
// The visitor taps the ball. It arcs through the hoop, the net swishes and the
// card under the court shows one problem Ánimo solves and what it brings. After
// the fourth make, confetti falls and a banner invites a conversation.
// Every shot goes in: this is a way to read four points, not a game to lose.

const SHOTS = 4;
const END_SCALE = 0.62; // the ball shrinks a little as it travels toward the hoop
const SPOTS = [0.36, 0.58, 0.8, 1]; // each shot starts farther from the rim
const HINTS = ["Tap the ball", "Shoot again", "One more", "Last shot"];
const CONFETTI = ["#f5a623", "#e8826b", "#fbf5e9", "#c85a3d", "#b9c79b", "#f5ebd8"];

const root = document.querySelector("[data-hoops]");
if (root) init(root);

function init(root) {
  const hero = root.closest(".hero");
  const court = root.querySelector("[data-hoops-court]");
  const ball = root.querySelector("[data-hoops-ball]");
  const art = root.querySelector("[data-hoops-ball-art]");
  const target = root.querySelector("[data-hoops-target]");
  const floor = root.querySelector("[data-hoops-floor]");
  const hint = root.querySelector("[data-hoops-hint]");
  const ballLabel = root.querySelector("[data-hoops-ball-label]");
  const live = root.querySelector("[data-hoops-live]");
  const again = root.querySelector("[data-hoops-again]");
  const cta = root.querySelector("[data-hoops-cta]");
  const slides = [...root.querySelectorAll("[data-hoops-slide]")];
  const pips = [...root.querySelectorAll("[data-hoops-pip]")];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!court || !ball || !art || !target || slides.length < SHOTS + 1) return;

  let made = 0;
  let busy = false;
  let frame = 0;
  let swishTimer = 0;
  let wonTimer = 0;

  function track(name, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, { ...params, page_path: window.location.pathname });
    }
  }

  // Where the rim's centre sits inside the court, in court pixels.
  function rim() {
    const c = court.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    return { x: t.left + t.width / 2 - c.left, y: t.top + t.height / 2 - c.top, court: c };
  }

  // Put the resting ball at the spot for the next shot.
  function placeBall() {
    const { x } = rim();
    const radius = ball.offsetWidth / 2;
    const reach = Math.max(40, x - radius - 14);
    const spot = SPOTS[Math.min(made, SHOTS - 1)];
    court.style.setProperty("--ball-x", `${Math.round(x - reach * spot)}px`);
  }

  function describeNext() {
    const next = Math.min(made + 1, SHOTS);
    if (hint) hint.textContent = HINTS[next - 1];
    if (ballLabel) ballLabel.textContent = `Take shot ${next} of ${SHOTS}`;
  }

  function showSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    if (live && index > 0) live.textContent = slides[index].textContent.replace(/\s+/g, " ").trim();
  }

  // Keep the court and its card on screen together once play has started.
  function keepInView() {
    const box = root.getBoundingClientRect();
    const header = document.querySelector("[data-site-header]")?.getBoundingClientRect().height || 0;
    if (box.bottom <= window.innerHeight - 6 && box.top >= header) return;
    const room = window.innerHeight - header;
    const top = box.height <= room ? box.top - header - (room - box.height) / 2 : box.top - header - 10;
    window.scrollBy({ top, behavior: motion.matches ? "auto" : "smooth" });
  }

  // The moment the ball drops through the rim.
  function score(n) {
    pips[n - 1]?.classList.add("is-made");
    showSlide(n);
    root.classList.remove("is-swish");
    void root.offsetWidth;
    root.classList.add("is-swish");
    window.clearTimeout(swishTimer);
    swishTimer = window.setTimeout(() => root.classList.remove("is-swish"), 900);
    keepInView();
    if (n === SHOTS) {
      confetti();
      track("hero_game_complete");
      if (typeof window.fbq === "function") window.fbq("trackCustom", "HeroGameComplete");
    }
  }

  // After the ball has come to rest: line up the next shot, or drop the banner.
  function settle(n) {
    made = n;
    if (n < SHOTS) {
      ball.style.transform = "";
      ball.style.opacity = "";
      placeBall();
      describeNext();
      root.classList.remove("is-flying");
      ball.classList.add("is-entering");
      busy = false;
      return;
    }
    // The last ball stays out of sight; the banner takes the court.
    ball.style.opacity = "0";
    const hadFocus = document.activeElement === ball;
    wonTimer = window.setTimeout(() => {
      root.classList.add("is-won");
      ball.disabled = true;
      busy = false;
      if (hadFocus) cta?.focus({ preventScroll: true });
    }, motion.matches ? 0 : 650);
  }

  function shoot() {
    if (busy || made >= SHOTS) return;
    busy = true;
    const n = made + 1;
    track("hero_shot", { shot_number: n });

    if (motion.matches) {
      root.classList.add("is-flying");
      score(n);
      settle(n);
      return;
    }

    // Measure before the idle bounce stops, so the flight starts where the ball is drawn.
    const { x: x1, y: y1, court: c } = rim();
    const rest = ball.getBoundingClientRect();
    const drawn = art.getBoundingClientRect();
    const restX = rest.left + rest.width / 2 - c.left;
    const restY = rest.top + rest.height / 2 - c.top;
    const x0 = drawn.left + drawn.width / 2 - c.left;
    const y0 = drawn.top + drawn.height / 2 - c.top;
    const radius = rest.width / 2;
    const floorTop = c.height - (floor?.offsetHeight || 0);
    const floorY = floorTop - radius * END_SCALE;
    root.classList.add("is-flying");
    ball.classList.remove("is-entering");

    // A projectile through three points: the start, an apex above the rim, the rim.
    const distance = Math.abs(x1 - x0);
    const apex = Math.max(radius * 0.8 + 8, y1 - (46 + distance * 0.2));
    const rise = Math.max(1, y0 - apex);
    const fall = Math.max(1, y1 - apex);
    const tApex = Math.sqrt(rise) / (Math.sqrt(rise) + Math.sqrt(fall));
    const b = rise / (tApex * tApex);
    const a = -2 * b * tApex;
    const duration = 600 + distance * 0.95;
    const spin = distance * 1.1;

    const paint = (x, y, scale, turn) => {
      ball.style.transform = `translate(${(x - restX).toFixed(1)}px, ${(y - restY).toFixed(1)}px) rotate(${turn.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    };

    let start = 0;
    let last = 0;
    let scored = false;
    let x = x0;
    let y = y0;
    let vx = 0;
    let vy = 0;
    let turn = 0;
    let bounces = 0;
    let fadeStart = 0;
    const gravity = (2 * b) / (duration * duration);

    const step = (now) => {
      if (!start) { start = now; last = now; }
      const elapsed = now - start;
      const dt = Math.min(34, now - last);
      last = now;

      if (!scored && elapsed < duration) {
        const t = elapsed / duration;
        x = x0 + (x1 - x0) * t;
        y = y0 + a * t + b * t * t;
        turn = spin * t;
        paint(x, y, 1 + (END_SCALE - 1) * t, turn);
        frame = requestAnimationFrame(step);
        return;
      }

      if (!scored) {
        scored = true;
        x = x1;
        y = y1;
        // The net takes most of the speed out of the ball.
        vx = ((x1 - x0) / duration) * 0.1;
        vy = ((a + 2 * b) / duration) * 0.55;
        score(n);
      }

      vy += gravity * dt;
      x += vx * dt;
      y += vy * dt;
      turn += vx * dt * 2.4;
      if (y >= floorY && vy > 0) {
        y = floorY;
        vy = -vy * 0.46;
        vx *= 0.7;
        bounces += 1;
        if (bounces >= 2 && !fadeStart) fadeStart = now;
      }
      paint(x, y, END_SCALE, turn);

      if (fadeStart) {
        const fade = Math.min(1, (now - fadeStart) / 240);
        ball.style.opacity = String(1 - fade);
        if (fade >= 1) {
          frame = 0;
          settle(n);
          return;
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  function reset() {
    cancelAnimationFrame(frame);
    window.clearTimeout(wonTimer);
    made = 0;
    busy = false;
    ball.disabled = false;
    ball.style.transform = "";
    ball.style.opacity = "";
    pips.forEach((pip) => pip.classList.remove("is-made"));
    root.classList.remove("is-won", "is-flying", "is-swish");
    showSlide(0);
    if (live) live.textContent = "";
    placeBall();
    describeNext();
    ball.classList.add("is-entering");
    ball.focus({ preventScroll: true });
    track("hero_game_replay");
  }

  function confetti() {
    if (motion.matches || !hero) return;
    const canvas = document.createElement("canvas");
    canvas.className = "hoops-confetti";
    canvas.setAttribute("aria-hidden", "true");
    hero.append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }

    const box = hero.getBoundingClientRect();
    const width = box.width;
    const height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.scale(ratio, ratio);

    const hoop = target.getBoundingClientRect();
    const originX = hoop.left + hoop.width / 2 - box.left;
    const originY = hoop.top + hoop.height / 2 - box.top;
    const count = width < 720 ? 120 : 210;
    const pieces = Array.from({ length: count }, (_, i) => {
      const burst = i < count * 0.45;
      const angle = -Math.PI * (0.08 + Math.random() * 0.84);
      const speed = 0.25 + Math.random() * 0.75;
      return {
        x: burst ? originX : Math.random() * width,
        y: burst ? originY : -20 - Math.random() * height * 0.6,
        vx: burst ? Math.cos(angle) * speed : (Math.random() - 0.5) * 0.14,
        vy: burst ? Math.sin(angle) * speed : 0.08 + Math.random() * 0.22,
        size: 6 + Math.random() * 7,
        turn: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.014,
        sway: Math.random() * Math.PI * 2,
        color: CONFETTI[i % CONFETTI.length],
        round: i % 5 === 0,
      };
    });

    const life = 4600;
    let start = 0;
    let last = 0;
    const tick = (now) => {
      if (!start) { start = now; last = now; }
      const elapsed = now - start;
      const dt = Math.min(34, now - last);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = elapsed > life - 900 ? Math.max(0, (life - elapsed) / 900) : 1;
      for (const p of pieces) {
        p.vy = Math.min(0.42, p.vy + 0.0009 * dt);
        p.vx *= 0.992;
        p.sway += 0.004 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 0.05) * dt;
        p.y += p.vy * dt;
        p.turn += p.spin * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.turn);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // A flat strip that appears to flip as it turns.
          ctx.fillRect(-p.size / 2, (-p.size * 0.42 * Math.cos(p.sway * 2)) / 2, p.size, p.size * 0.42 * Math.cos(p.sway * 2));
        }
        ctx.restore();
      }
      if (elapsed < life) requestAnimationFrame(tick);
      else canvas.remove();
    };
    requestAnimationFrame(tick);
  }

  ball.addEventListener("click", shoot);
  ball.addEventListener("animationend", (event) => {
    if (event.animationName === "hoops-enter") ball.classList.remove("is-entering");
  });
  again?.addEventListener("click", reset);

  // The hoop keeps its place when the court resizes; move the resting ball to match.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { if (!busy) placeBall(); }).observe(court);
  } else {
    window.addEventListener("resize", () => { if (!busy) placeBall(); });
  }

  placeBall();
  describeNext();
  root.classList.add("is-ready");
}
