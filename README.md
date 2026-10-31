# Ánimo marketing site

Source for [animoplatform.net](https://animoplatform.net), deployed by Netlify from the `main` branch.

## Local preview

```bash
netlify dev
```

The site is intentionally static: standalone HTML pages, a shared design system under `assets/`, and no build step.

## Current site architecture

- `/` — short homepage for e-commerce brands and therapy practices; each vertical has its own page
- `/therapy-practices/` — therapy and mental-health practices (HIPAA-aware wording; client-approved clinical facts only)
- `/web-commerce/` — websites, SEO, ads, email and SMS for e-commerce brands
- `/work/` — current and former clients
- `/insights/` — proof library and implementation guides
- `/about/` — founder and company story
- `/contact/` — booking and direct-email paths
- `/closer-horizons-data-deletion/` — data deletion instructions for the Closer Horizons Studio app

Retired on 2026-10-28 (301s in `netlify.toml`): `/personal-ai/`, `/ai-coaching/`, `/small-business-ai-consulting/` and `/tools/ai-readiness`. Retired on 2026-10-31: `/insights/practical-ai-for-work-and-family-life/` (301 to `/insights/`), plus the unused People film and personal-AI demo scripts.

The official Ánimo tagline is: “what would make your business feel lighter?”

The homepage features a silent, viewport-aware video loop with a poster fallback for reduced motion and data saving. Campaign films use native playback controls and load on demand. See `docs/website-films.md` for placement, source assets and playback behavior. Motion 13.1.1 handles restrained scroll effects; the sprout illustration on About is a static, fully visible image. Phosphor Icons 2.1.2 provides interface icons.

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
