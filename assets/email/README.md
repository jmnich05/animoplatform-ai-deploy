# assets/email/

Static graphics hosted here are served by Netlify from the site root.

## Canonical URL pattern

```
https://ai.animoplatform.net/assets/email/<filename>
```

Example:

```
https://ai.animoplatform.net/assets/email/pitch-v1.png
```

## Intended use

Prospecting email hero graphics (and any other email-embedded images).
Files dropped here are referenced directly in Gmail HTML CTA blocks —
Netlify serves them with no additional config since the publish directory is `.`.

## Naming convention

Use version-suffixed filenames to avoid CDN cache collisions:

```
pitch-v1.png
pitch-v2.png
```

Do NOT overwrite an existing file in place. Gmail / email clients cache
image URLs aggressively. A new filename guarantees the recipient's client
fetches the updated image rather than serving a stale cached copy.

## Who produces the files

Imogen (Marketing) exports from Canva. Theo (Web) drops the PNG here,
commits, merges to main, and confirms the URL resolves before handing
the link back to Priya (Sales) for sequencing.
