const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const navToggle = document.querySelector("[data-nav-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

function closeMenu() {
  if (!navToggle || !mobileNav) return;
  navToggle.setAttribute("aria-expanded", "false");
  mobileNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  navToggle.querySelector("i")?.classList.replace("ph-x", "ph-list");
}

navToggle?.addEventListener("click", () => {
  const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(willOpen));
  mobileNav?.classList.toggle("is-open", willOpen);
  document.body.classList.toggle("menu-open", willOpen);
  const icon = navToggle.querySelector("i");
  if (icon) icon.className = willOpen ? "ph ph-x" : "ph ph-list";
});

mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.querySelectorAll("[data-track]").forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "cta_click", {
        cta_name: link.dataset.track,
        page_path: window.location.pathname,
      });
    }
  });
});

const growthStage = document.querySelector("[data-growth-stage]");
const growthArt = document.querySelector("[data-growth-art]");
const growthClose = document.querySelector("[data-growth-close]");
let heroPanX = 0;
let heroPanY = 0;
let heroMaxX = 0;
let heroMaxY = 0;
let heroExpanded = false;
let heroDragging = false;
let heroPointerId = null;
let heroPointerX = 0;
let heroPointerY = 0;
let frame = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sizeHeroArt() {
  if (!growthStage || !growthArt) return;
  const box = growthStage.getBoundingClientRect();
  if (!box.width || !box.height) return;

  const naturalWidth = growthArt.naturalWidth || 2048;
  const naturalHeight = growthArt.naturalHeight || 1152;
  const coverScale = Math.max(box.width / naturalWidth, box.height / naturalHeight);
  const zoom = heroExpanded ? 1.48 : 1.34;
  const renderWidth = naturalWidth * coverScale * zoom;
  const renderHeight = naturalHeight * coverScale * zoom;

  heroMaxX = Math.max(0, (renderWidth - box.width) / 2);
  heroMaxY = Math.max(0, (renderHeight - box.height) / 2);
  growthArt.style.setProperty("--hero-render-width", `${renderWidth}px`);
  growthArt.style.setProperty("--hero-render-height", `${renderHeight}px`);
  queueHeroPosition();
}

function paintHeroPosition() {
  if (!growthArt) return;
  growthArt.style.setProperty("--hero-x", `${-heroPanX * heroMaxX}px`);
  growthArt.style.setProperty("--hero-y", `${-heroPanY * heroMaxY}px`);
  frame = 0;
}

function queueHeroPosition() {
  if (!frame) frame = requestAnimationFrame(paintHeroPosition);
}

function setHeroExpanded(expanded) {
  if (!growthStage || heroExpanded === expanded) return;
  heroExpanded = expanded;
  growthStage.classList.toggle("is-expanded", expanded);
  growthStage.setAttribute("aria-expanded", String(expanded));
  document.body.classList.toggle("hero-exploring", expanded);
  if (!expanded) {
    heroPanX = 0;
    heroPanY = 0;
  }
  requestAnimationFrame(sizeHeroArt);
  if (expanded) growthStage.focus({ preventScroll: true });
}

function moveHeroFromPointer(event) {
  if (!growthStage) return;
  const box = growthStage.getBoundingClientRect();
  heroPanX = clamp(((event.clientX - box.left) / box.width - 0.5) * 2, -1, 1);
  heroPanY = clamp(((event.clientY - box.top) / box.height - 0.5) * 2, -1, 1);
  queueHeroPosition();
}

if (growthStage && growthArt) {
  if (growthArt.complete) sizeHeroArt();
  else growthArt.addEventListener("load", sizeHeroArt, { once: true });
  window.addEventListener("resize", sizeHeroArt);

  growthStage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") {
      if (!heroDragging || event.pointerId !== heroPointerId) return;
      const sensitivityX = heroMaxX ? 1 / heroMaxX : 0;
      const sensitivityY = heroMaxY ? 1 / heroMaxY : 0;
      heroPanX = clamp(heroPanX - (event.clientX - heroPointerX) * sensitivityX, -1, 1);
      heroPanY = clamp(heroPanY - (event.clientY - heroPointerY) * sensitivityY, -1, 1);
      heroPointerX = event.clientX;
      heroPointerY = event.clientY;
      queueHeroPosition();
      return;
    }
    if (!heroDragging) moveHeroFromPointer(event);
  });

  growthStage.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    if (!heroExpanded) setHeroExpanded(true);
    heroDragging = true;
    heroPointerId = event.pointerId;
    heroPointerX = event.clientX;
    heroPointerY = event.clientY;
    growthStage.classList.add("is-dragging");
    growthStage.setPointerCapture(event.pointerId);
  });

  growthStage.addEventListener("pointerup", (event) => {
    if (event.pointerId !== heroPointerId) return;
    heroDragging = false;
    heroPointerId = null;
    growthStage.classList.remove("is-dragging");
  });

  growthStage.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (!heroExpanded) setHeroExpanded(true);

    const horizontalDelta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    const verticalDelta = event.shiftKey ? 0 : event.deltaY;
    heroPanX = clamp(heroPanX + horizontalDelta / Math.max(180, heroMaxX * 1.5), -1, 1);
    heroPanY = clamp(heroPanY + verticalDelta / Math.max(180, heroMaxY * 1.5), -1, 1);
    queueHeroPosition();
  }, { passive: false });

  growthStage.addEventListener("click", () => {
    if (!heroExpanded) setHeroExpanded(true);
  });
  growthClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    setHeroExpanded(false);
  });

  document.addEventListener("pointerdown", (event) => {
    if (heroExpanded && !growthStage.contains(event.target)) setHeroExpanded(false);
  });

  growthStage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setHeroExpanded(!heroExpanded);
      return;
    }
    if (event.key === "Escape" && heroExpanded) {
      event.preventDefault();
      setHeroExpanded(false);
      return;
    }
    const box = growthStage.getBoundingClientRect();
    const directions = {
      ArrowLeft: [-Math.max(40, box.width * .08), 0],
      ArrowRight: [Math.max(40, box.width * .08), 0],
      ArrowUp: [0, -Math.max(40, box.height * .08)],
      ArrowDown: [0, Math.max(40, box.height * .08)],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    if (!heroExpanded) setHeroExpanded(true);
    heroPanX = clamp(heroPanX + directions[event.key][0] / Math.max(1, heroMaxX), -1, 1);
    heroPanY = clamp(heroPanY + directions[event.key][1] / Math.max(1, heroMaxY), -1, 1);
    queueHeroPosition();
  });
}

if (!reducedMotion) {
  import("https://cdn.jsdelivr.net/npm/motion@13.1.1/+esm")
    .then(({ animate, inView }) => {
      root.classList.add("motion-ready");

      inView("[data-reveal]", (element) => {
        element.classList.add("is-visible");
        animate(element, { opacity: [0, 1], y: [24, 0] }, { duration: 0.62, easing: [0.22, 1, 0.36, 1] });
      }, { margin: "0px 0px -10% 0px", amount: 0.18 });

    })
    .catch(() => {
      root.classList.remove("motion-ready");
      document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
    });
} else {
  document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
}
