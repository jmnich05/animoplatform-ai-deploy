# Ánimo marketing site

Source for [animoplatform.net](https://animoplatform.net), deployed by Netlify from the `main` branch.

## Local preview

```bash
netlify dev
```

The site is intentionally static: standalone HTML pages, a shared design system under `assets/`, and no build step.

## Current site architecture

- `/` — short homepage for small businesses, built around the four problems Ánimo solves; the hero is the interactive "four shots, four fixes" court
- `/therapy-practices/` — therapy and mental-health practices (HIPAA-aware wording; client-approved clinical facts only)
- `/services/` — websites, search and ads for small businesses, organised by the same four fixes (was `/web-commerce/` until 2026-11-20)
- `/work/` — current and former clients
- `/insights/` — proof library and implementation guides
- `/about/` — founder and company story
- `/contact/` — booking and direct-email paths
- `/closer-horizons-data-deletion/` — data deletion instructions for the Closer Horizons Studio app

Retired on 2026-10-28 (301s in `netlify.toml`): `/personal-ai/`, `/ai-coaching/`, `/small-business-ai-consulting/` and `/tools/ai-readiness`. Retired on 2026-10-31: `/insights/practical-ai-for-work-and-family-life/` (301 to `/insights/`), plus the unused People film and personal-AI demo scripts. The About-page launch film was replaced with the 30-second “Be the answer” film.

The official Ánimo tagline is: “what would make your business feel lighter?”

The homepage hero is a short film played on a button (`assets/court.css`, `assets/court.js`, media under `assets/court/20261120/s1/`). The opening frame is a photoreal arena with a ball frozen in mid-air. "Take the shot", or a tap on the ball, plays a five-second slow-motion clip (`shot.mp4`, about 0.65 MB): the ball flies and drops through the net, and a card, a solid block of one brand colour with a display-size headline, shows one problem Ánimo solves and what it brings. "Next shot" plays the same clip again for the next card. After the fourth, "Finish" dissolves the picture into a confetti-filled still of the same arena (`confetti.webp`), paper keeps falling over it, and a "Let’s make this happen together." banner invites a conversation. Nothing is tied to scrolling: the hero is one screen tall and the page scrolls past it. An earlier version scrubbed the shot with scroll; Jon found it jerky and asked for a button on 2026-11-20.

On landscape screens the clip is only the middle of the picture: around it sits a wide still of the same arena (`plate.webp`) with a soft-edged hole the clip shows through. On portrait screens the clip fills the screen. The clip is fetched whole after the first paint so it starts the instant the button is pressed; if it cannot play, the shot is told with two stills (`start.webp`, `end.webp`). `shot.mp4` is tagged BT.709 on purpose: untagged, browsers and the stills disagreed about its colours and the clip showed as a lighter rectangle inside the plate.

The film only runs when a small script in the page head adds `court-on` to `<html>`: the visitor allows motion and has not asked to save data. Everyone else, and anyone whose opening still fails to load, gets the earlier tap-the-ball court (`assets/hoops.css`, `assets/hoops.js`), which is plain HTML, SVG and a canvas. Add `?hero=tap` to the homepage address to see that court on any device. Without JavaScript the four fixes are still listed in full in the section below the hero.

The footage was generated on fal (nano-banana-pro for the start, end, wide and confetti stills; Seedance 2.5 image-to-video for the clip, with start and end frames so the shot is a clean make and the camera stays locked off). Three other camera angles were generated and shipped briefly on 2026-11-20, then dropped in favour of looping the first shot; one of them had a rim detached from its backboard. Prompts, the capped generator, the frame-cutting script and the spend ledger live in the design workspace at `clients/animo-platform/2026-11-20-court-film/`. To change the shot, regenerate there, encode the clip with the BT.709 conversion noted in the `shot.mp4` commit, put the media in a new dated folder under `assets/court/`, and update `BASE` in `court.js` and the paths in `court.css` and `index.html` (`/assets/*` is cached as immutable, so never overwrite a published file).

The 30-second hero film (`assets/films/20261029/hero30.mp4`) is no longer on the homepage because its end card still reads "For e-commerce brands · therapy practices". Campaign films use native playback controls and load on demand. See `docs/website-films.md` for placement, source assets and playback behavior. Motion 13.1.1 handles restrained scroll effects; the sprout illustration on About is a static, fully visible image. Phosphor Icons 2.1.2 provides interface icons.

## Deployment contract

- GitHub `main` is the production source of truth.
- Netlify site: `stellar-cascaron-987df0` (`082d1f81-8d97-4335-bf9a-a9df5d96272a`).
- Use pull requests and Netlify deploy previews for review.
- Do not manually deploy a production-only copy that is not committed here.
- Keep canonical and social URLs on `https://animoplatform.net`.
- Update `sitemap.xml` when adding or removing public pages.

## Measurement setup

GA4 is installed directly site-wide with measurement ID `G-H20MPFJEKF`; Google Tag Manager is not installed. CTA clicks and demo interactions send lightweight events when `gtag` is available.

The public booking path is an inline Calendly embed on `/contact/`, backed by `https://calendly.com/letsconnect-animoplatform/30min`. A validated `calendly.event_scheduled` message sends the GA4 recommended event `generate_lead` once per page load. Only generic fields are recorded; Calendly invitee details and payloads are never forwarded to GA4.

The Meta Pixel is loaded site-wide from `assets/meta-pixel.js` (the pixel ID lives only there; the file does nothing until a numeric ID is set). It sends `PageView` on every page, `Lead` on the same validated Calendly booking, and a custom `CTAClick` with the `data-track` name. Automatic event detection is turned off, and no invitee or visitor details are sent. Bump the `?v=` query on `meta-pixel.js` and `site.js` references when either file changes (`/assets/*` is cached as immutable).

On 2026-10-28 the homepage hero events were renamed: `hero_business` became `hero_store`, `hero_personal` became `hero_practice`, and `hero_launch_film` was removed. The homepage offer cards now send `home_store_card` and `home_practice_card`, and the therapy section sent `home_therapy_cta`. On `/contact/`, `contact_business_calendly` became `contact_store_calendly` and `contact_personal_calendly` became `contact_practice_calendly`.

On 2026-10-29 the homepage was cut to seven sections and the therapy content moved to `/therapy-practices/`, so `home_therapy_cta` is gone. New events: `nav_contact` (header button), `mobile_nav_contact` (phone menu button), `therapy_hero_contact` and `therapy_final_contact`. The header is sticky on every page, and the old two-card announcement rail above it was removed.

On 2026-11-20 Ánimo stopped featuring e-commerce and refocused on small businesses. `/web-commerce/` became `/services/` (301 in `netlify.toml`), the nav and footer link changed from "E-commerce" to "Services", and the homepage was rebuilt around four fixes: traffic that converts, foot traffic, reputation, and readiness for AI search. Event changes: `hero_store` and `hero_practice` are gone, replaced by `hero_contact` and `hero_four_fixes`; `home_store_card` and `home_practice_card` are replaced by `home_services` and `home_practice_link`; `commerce_hero_contact` and `commerce_final_contact` became `services_hero_contact` and `services_final_contact`; `contact_store_calendly` became `contact_business_calendly`. The hero court sends `hero_shot` (with `shot_number` 1–4), `hero_game_complete`, `hero_game_replay`, and the banner button sends `hero_game_cta`. Meta also receives a custom `HeroGameComplete`.

The "1.5 to 3×" figure on the homepage and `/services/` is Jon’s stated expectation for traffic and conversions in a client’s first 12 months, based on client results so far. Keep the "not a guarantee" note beside it, and update or remove the figure if the evidence changes.

The film hero (2026-11-20) sends `hero_film_play` (with `source`: `ball`, `button` or `next`, and `shot_number`), `hero_film_shot` (with `shot_number` 1–4), `hero_film_complete`, `hero_film_replay`, and its closing button sends `hero_film_cta`. Meta receives a custom `HeroFilmComplete`. The tap court keeps its own `hero_shot` and `hero_game_*` events.
