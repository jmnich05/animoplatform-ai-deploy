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
let heroX = 0;
let heroY = 0;
let frame = 0;

function paintHeroPosition() {
  if (!growthArt) return;
  growthArt.style.setProperty("--hero-x", `${heroX}px`);
  growthArt.style.setProperty("--hero-y", `${heroY}px`);
  frame = 0;
}

function queueHeroPosition() {
  if (!frame) frame = requestAnimationFrame(paintHeroPosition);
}

if (growthStage && growthArt && !reducedMotion) {
  growthStage.addEventListener("pointermove", (event) => {
    const box = growthStage.getBoundingClientRect();
    heroX = ((event.clientX - box.left) / box.width - 0.5) * -36;
    heroY = ((event.clientY - box.top) / box.height - 0.5) * -26;
    queueHeroPosition();
  });
  growthStage.addEventListener("pointerleave", () => {
    heroX = 0;
    heroY = 0;
    queueHeroPosition();
  });
  growthStage.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: [-8, 0],
      ArrowRight: [8, 0],
      ArrowUp: [0, -8],
      ArrowDown: [0, 8],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    heroX = Math.max(-28, Math.min(28, heroX + directions[event.key][0]));
    heroY = Math.max(-22, Math.min(22, heroY + directions[event.key][1]));
    queueHeroPosition();
  });
}

if (!reducedMotion) {
  import("https://cdn.jsdelivr.net/npm/motion@13.1.1/+esm")
    .then(({ animate, inView, scroll }) => {
      root.classList.add("motion-ready");

      inView("[data-reveal]", (element) => {
        element.classList.add("is-visible");
        animate(element, { opacity: [0, 1], y: [24, 0] }, { duration: 0.62, easing: [0.22, 1, 0.36, 1] });
      }, { margin: "0px 0px -10% 0px", amount: 0.18 });

      if (growthStage && growthArt) {
        scroll((progress) => {
          growthStage.style.setProperty("--growth-progress", `${18 + progress * 82}%`);
          growthArt.style.setProperty("--hero-scale", String(1.03 + progress * 0.08));
        }, { target: growthStage, offset: ["start end", "end start"] });
      }
    })
    .catch(() => {
      root.classList.remove("motion-ready");
      document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
    });
} else {
  document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
}
