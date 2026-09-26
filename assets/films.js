// Content films load on demand through native controls. Only the silent hero
// loop plays automatically, when visible and when the visitor permits motion.
const films = [...document.querySelectorAll('[data-film]')];
const hero = document.querySelector('[data-hero-film]');
const toggle = document.querySelector('[data-hero-toggle]');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
let inView = false;
let visitorPaused = false;
let visitorRequested = false;
let contentPlaying = false;

function updateToggle() {
  if (!hero || !toggle) return;
  toggle.textContent = hero.paused ? 'Play motion' : 'Pause motion';
  toggle.setAttribute('aria-label', hero.paused ? 'Play background video' : 'Pause background video');
}
function pauseHero() { hero?.pause(); }
function syncHero() {
  if (!hero) return;
  const permitted = visitorRequested || (!motion.matches && !connection?.saveData);
  if (!permitted || visitorPaused || !inView || document.hidden || contentPlaying) {
    pauseHero();
    return;
  }
  if (!hero.getAttribute('src')) hero.src = hero.dataset.src;
  hero.play().catch(updateToggle);
}
if (hero && toggle) {
  toggle.hidden = false;
  hero.muted = true;
  hero.addEventListener('play', updateToggle);
  hero.addEventListener('pause', updateToggle);
  hero.addEventListener('error', () => { toggle.hidden = true; });
  toggle.addEventListener('click', () => {
    if (!hero.paused) {
      visitorPaused = true;
      pauseHero();
    } else {
      visitorPaused = false;
      visitorRequested = true;
      syncHero();
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncHero();
    }, { threshold: .15 }).observe(hero);
  } else {
    inView = true;
    syncHero();
  }
  motion.addEventListener('change', () => {
    visitorRequested = false;
    syncHero();
  });
  connection?.addEventListener('change', syncHero);
  document.addEventListener('visibilitychange', syncHero);
}
films.forEach((video) => {
  let started = false;
  video.addEventListener('play', () => {
    films.forEach((other) => { if (other !== video) other.pause(); });
    contentPlaying = true;
    pauseHero();
    if (!started && typeof window.gtag === 'function') {
      window.gtag('event', 'video_start', {
        video_title: video.dataset.film,
        page_path: window.location.pathname,
      });
    }
    started = true;
  });
  for (const event of ['pause', 'ended']) video.addEventListener(event, () => {
    contentPlaying = films.some((film) => !film.paused && !film.ended);
    syncHero();
  });
});
