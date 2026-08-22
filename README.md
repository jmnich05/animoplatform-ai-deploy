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
- `/personal-ai/` — practical AI optimization for individuals
- `/work/` — selected client work
- `/about/` — founder and company story
- `/contact/` — booking and direct-email paths
- `/tools/ai-readiness` — existing readiness assessment

The interaction stack uses Motion 13.1.1 for restrained scroll-linked effects and Phosphor Icons 2.1.2 for interface icons. The site remains usable without either CDN dependency.

## Deployment contract

- GitHub `main` is the production source of truth.
- Netlify site: `stellar-cascaron-987df0` (`082d1f81-8d97-4335-bf9a-a9df5d96272a`).
- Use pull requests and Netlify deploy previews for review.
- Do not manually deploy a production-only copy that is not committed here.
- Keep canonical and social URLs on `https://animoplatform.net`.
- Update `sitemap.xml` when adding or removing public pages.

## Measurement setup

The readiness assessment supports GA4 through `window.ANIMO_CONFIG.GA4_MEASUREMENT_ID` in `tools/ai-readiness.html`. Add the production measurement ID only after the GA4 property and consent requirements are confirmed.
