# Ánimo marketing site

Source for [animoplatform.net](https://animoplatform.net), deployed by Netlify from the `main` branch.

## Local preview

```bash
netlify dev
```

The site is intentionally static: standalone HTML pages, a shared design system under `assets/`, and no build step.

## Current site architecture

- `/` — homepage and two-path overview
- `/web-commerce/` — website, e-commerce, and digital marketing services
- `/small-business-ai-consulting/` — practical AI consulting for Louisville small businesses
- `/personal-ai/` — practical AI optimization for individuals
- `/work/` — selected client work
- `/insights/` — practical AI proof library and implementation guides
- `/about/` — founder and company story
- `/contact/` — booking and direct-email paths
- `/tools/ai-readiness` — practical, interactive everyday AI demos (legacy URL retained for continuity)

The official Ánimo tagline is: “what would make your work or life feel lighter?”

The homepage features a silent, viewport-aware video loop with a poster fallback for reduced motion and data saving. Campaign films use native playback controls and load on demand. See `docs/website-films.md` for placement, source assets and playback behavior. Motion 13.1.1 handles restrained scroll effects; the original illustration explorer remains on About. Phosphor Icons 2.1.2 provides interface icons.

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
