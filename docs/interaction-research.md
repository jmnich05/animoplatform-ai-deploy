# Ánimo interaction direction

Research date: 2026-08-22

## Recommendation

Use Motion for lightweight scroll-linked storytelling and in-view transitions, combined with native sticky layout, Pointer Events and keyboard controls for the two-axis hero exploration.

- Motion `scroll()` supports parallax and scroll-driven storytelling in a small JavaScript footprint and uses the browser ScrollTimeline API when available: https://motion.dev/docs/scroll
- Motion `inView()` is built on IntersectionObserver and is appropriate for restrained section reveals: https://motion.dev/docs/inview
- GSAP ScrollTrigger is the strongest alternative for more complex pinned timelines, horizontal sequences, snapping and highly choreographed production work: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Lenis is a performant MIT-licensed smooth-scroll layer with WebGL and parallax integrations, but it is intentionally not used here because the site does not need scroll smoothing to tell the story: https://github.com/darkroomengineering/lenis
- Three.js is the right escalation path only if a future concept genuinely needs a real-time 3D scene. The current two-dimensional editorial art direction does not justify the extra runtime or rendering complexity: https://threejs.org/docs/

## Implementation choices

- Pin Motion to `13.1.1` through jsDelivr.
- Keep normal browser scrolling and real HTML page navigation.
- Make the growth hero respond to horizontal and vertical pointer input.
- Add arrow-key input for the same two-axis interaction.
- Tie image scale and the progress rule to page scroll.
- Respect `prefers-reduced-motion`; content and navigation remain fully usable without animation.
- Use Phosphor Icons `2.1.2` for interface icons rather than handcrafted symbols.

## Why this fits Ánimo

The interaction is expressive enough to make the sprout-to-tree idea memorable, but light enough to keep the site credible, fast and focused on the consulting offer. The motion supports the meaning of the brand rather than serving as a technology demonstration.
