# Ánimo redesign and mobile hero message — design QA

## Mobile hero message update — 08-22-2026

- Source visual truth: `/private/tmp/animo-mobile-hero-qa/live-before-390x844.png` — production homepage at a 390 × 844 CSS viewport (375 × 812 captured content pixels at density 1). The 17vw Arial Black headline, .88 line height and negative tracking collapsed the former message into a dense white block.
- Rendered implementation:
  - `/private/tmp/animo-mobile-hero-qa/after-390x844.png` — revised primary mobile state at 390 × 844 CSS (375 × 812 captured content pixels at density 1).
  - `/private/tmp/animo-mobile-hero-qa/after-320x812.png` — narrow mobile state at 320 × 812 CSS (305 × 774 captured content pixels at density 1).
  - `/private/tmp/animo-mobile-hero-qa/after-720x900.png` — mobile-breakpoint state at 720 × 900 CSS (705 × 881 captured content pixels at density 1).
  - `/private/tmp/animo-mobile-hero-qa/after-1280x800.png` — desktop state at 1280 × 800 CSS (1265 × 791 captured content pixels at density 1).
- Combined comparison evidence: `/private/tmp/animo-mobile-hero-qa/combined-390x844.png` (885 × 944 pixels). The production and revised 390px states were reviewed together in one browser-rendered comparison board.
- Full view: navigation, service rail, hero copy, both CTAs, founder note and the beginning of the illustration retain the established hierarchy, hard borders, offset shadows and existing brand colors.
- Focused region: the new single semantic H1 separates the setup, official question and payoff. At 390px the question wraps into four open lines and “Give your day back.” stays on one distinct marigold line; at 320px the payoff wraps cleanly without overlap or clipping.
- Typography: existing condensed, Arial Black and Georgia roles remain intact. The question uses .98 line height and -.04em mobile tracking rather than the former .88/-0.075em treatment.
- Spacing: 10px separates setup from question, 14px separates question from payoff, and 30px separates the H1 from the lede on mobile. No text boxes overlap at 320, 390, 720 or 1280 CSS pixels.
- Color and accessibility: cream copy, marigold payoff and deep-sage background preserve the existing high-contrast palette. All three phrases remain real text inside one H1 in logical reading order; no CSS-generated content or hard line breaks were introduced.
- Interaction regression: mobile navigation opened and closed with synchronized `aria-expanded`; the illustration expanded and closed with Escape; both hero CTAs retain their destination links.
- Browser console: zero warnings or errors after responsive, navigation and illustration checks.
- Comparison history: initial P1 mobile typography collision was corrected with dedicated semantic spans and responsive type rules. The combined post-fix comparison found no remaining P0, P1 or P2 issues.

## Comparison target

- Source visual truth:
  - `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/codex-clipboard-75305566-599d-4568-aa4a-bbb2482fdab7.png` — the reported expanded-hero failure state (1620 × 1260 pixels).
  - `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/codex-clipboard-2b1ebfe1-d13a-4ed7-b458-59d4533da66a.png` — the outdated readiness-assessment state to replace (2056 × 1516 pixels).
- Rendered implementation:
  - `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-hero-expanded-edge.png` — boundary-safe expanded hero after maximum horizontal and vertical wheel input (1440 × 1000 CSS viewport; 1440 × 1000 screenshot at density 1).
  - `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-demo-meals.png` — desktop meal-planning demo (1440 × 1000 CSS viewport; 1425 × 990 captured content pixels at density 1).
  - `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-demos-mobile-meal.png` — mobile demo layout (390 × 844 CSS viewport; 375 × 812 captured content pixels at density 1).
- Combined comparison evidence: `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-qa-board.png` (1425 × 1599 pixels). Both source states and the corresponding revised states were placed in one browser-rendered comparison board before review.
- States: desktop homepage, expanded hero at both maximum pan corners, mobile expanded hero at maximum pan, all four desktop demo tabs, demo button states, mobile demo layout, and Calendly contact links in source.

## Full-view comparison evidence

- The reported hero showed a hard vertical termination of the foreground art and a large empty black field. At both revised pan limits, the illustration covers the complete bordered viewport; the art still has a dark night field by design, but no foreground edge or uncovered stage is visible.
- The old assessment led with an abstract business-readiness score and ROI question. The replacement leads with four outcome-based choices, while preserving the approved editorial typography, cream field, dark ink panels, sage, coral, marigold and squared border/shadow language.
- Desktop and mobile preserve the two-track Ánimo positioning. The demo content narrows naturally to one column and shows no visible horizontal clipping.

## Focused fidelity review

- Fonts and typography: the existing Arial Black/Georgia/condensed hierarchy is preserved. Large display copy, serif emphasis, small uppercase labels and interface labels remain legible at desktop and mobile sizes.
- Spacing and layout rhythm: the tab row aligns to the split story/canvas grid. Cards retain the established hard borders and offset shadows. Mobile switches to stacked tabs, story and canvas without compressing the interactive controls.
- Colors and visual tokens: only the existing paper, cream, ink, sage, coral and marigold tokens are used. Contrast remains strong in both light and dark demo canvases.
- Image quality and asset fidelity: the original 2048-pixel Ánimo growth illustration remains the hero source. The added background fallback uses the same asset and positioning variables; no substitute illustration or generated approximation was introduced.
- Copy and content: the official lowercase tagline is exact. Each demo is framed in plain language, and meal ordering, email drafting and family information explicitly retain user approval and privacy boundaries.
- Focused regions were evaluated in `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-demo-brief.png`, `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-demo-commute.png` and `/private/var/folders/pp/jf0zztqs2czbr8sgh65d5b2m0000gn/T/animo-hero-mobile-edge.png`; these states verify small labels, button feedback, audio progress, privacy copy and the mobile boundary.

## Findings

- No actionable P0, P1 or P2 visual differences remain.
- P3 follow-up: the legacy `/tools/ai-readiness` slug no longer describes the page. It is intentionally retained for existing links and search continuity; a future clean URL can redirect here after search data is reviewed.

## Interaction and accessibility QA

- Hero: opening, closing, pointer positioning, vertical/horizontal wheel input and both maximum pan corners passed. `ResizeObserver`, post-animation measurement and a 4.5% safe buffer keep the frame covered.
- Motion: the existing Motion dependency adds only a small scroll-linked vertical drift and in-view reveals. Reduced-motion users retain static content and direct interaction.
- Demo tabs: mouse and arrow-key selection passed. Exactly one tabpanel is exposed at a time.
- Meal demo: preference toggles, exclusive store choice, order-summary copy and refresh feedback passed.
- Morning brief: review actions toggle to an added state without sending anything.
- Parent commute: play/pause state, progress and elapsed-time feedback passed; it is clearly a visual simulation.
- Responsive: desktop at 1440 × 1000 and mobile at 390 × 844 passed visually.
- Browser console: zero warnings or errors after homepage, hero, tab, button, audio and mobile checks.
- JavaScript syntax and Git whitespace checks: passed.

## Comparison history

- Initial report: P1 — expanded-hero pan could expose an uncovered black field and a hard image edge. Fixed with synchronized foreground/background positioning, repeated size measurement and safe overscan. Post-fix evidence: `animo-hero-expanded-edge.png`, `animo-hero-expanded-opposite-edge.png` and `animo-hero-mobile-edge.png`.
- Initial report: P1 — the assessment represented the prior business-only positioning. Replaced with four interactive, personal-outcome demos and plain-language approval/privacy copy. Post-fix evidence: `animo-demo-meals.png`, `animo-demo-calendar.png`, `animo-demo-brief.png`, `animo-demo-commute.png` and `animo-demos-mobile-meal.png`.
- Post-fix comparison found no additional P0, P1 or P2 issues.

## Implementation checklist

- [x] Prevent uncovered hero edges at every pan boundary.
- [x] Add restrained scroll-linked hero motion with the existing open-source Motion package.
- [x] Replace Google Scheduler links with the verified Calendly event.
- [x] Apply the official tagline and refresh the homepage proof strip.
- [x] Replace the readiness assessment with four working visual demos.
- [x] Verify desktop, mobile, interactions, console and source/implementation comparison.

## Living illustration iteration — 08-22-2026

- Reference capture: `/private/tmp/animo-living-qa-before-1280x800.png` from the current production homepage.
- Implementation capture: `/private/tmp/animo-living-qa-after-final-1280x800.png` from the local living-illustration build.
- Combined comparison surface: `http://127.0.0.1:4180/compare.html`; both states were judged together at the same 1280 x 800 viewport and homepage position.
- The living layer preserves the approved copy, typography, split-hero composition, illustration crop, hard border, and offset shadow. It adds depth response without redesigning the page or replacing the source artwork.
- The generated grayscale depth map is 1672 x 941, weighs 98,246 bytes, and was produced locally with Tiefling using Depth Anything V2 Small. The source artwork was not uploaded.
- The responsive source image is decoded and its resolved `currentSrc` is loaded through Three.js, avoiding a black texture while retaining browser caching and the existing `srcset` behavior.
- The Three.js renderer reached the `ready` state with a clean browser console. Its render buffer is capped at 1.8 million pixels and redraws only while visible or easing toward a changed view.
- Desktop was checked at 1280 x 800. Pointer response, expanded mode, all four pan extremes, arrow keys, Escape, and focus return passed without exposing an uncovered image edge.
- Mobile was checked at 390 x 844. The canvas resized to the 345 x 430 inline hero and the 358 x 812 expanded explorer without exposing a blank edge; the approved mobile headline remains legible and unchanged.
- Reduced-motion pauses the depth renderer and exposes the existing image explorer. WebGL2, import, texture, or context failure removes the canvas-ready state and retains the synchronized image/background fallback.
- Static validation passed: `node --check assets/site.js`, `node --check assets/depth-pan-renderer.js`, and `git diff --check`.

final result: passed
