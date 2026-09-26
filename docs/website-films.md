# Website films — 09-26-2026

All media is committed with the site under `assets/films/20260926/`, so Git-based deploy previews and future production builds contain the same assets. Original masters were not changed.

| Placement | Source export | Website version |
| --- | --- | --- |
| Home hero | Launch Spot, `renders/final/animo_spot_v4_4x5_web.mp4`, 21.9–28.3 seconds | Silent 6.4-second river loop, 720 × 900 |
| Home business service | Paid Ads, `out/animo-business-30s-4x5.mp4` | 30 seconds, 720 × 900 |
| Home and Personal AI | Paid Ads, `out/animo-people-30s-4x5.mp4` | 30 seconds, 720 × 900 |
| Web + Commerce | Paid Ads, `out/animo-sizzle-20s-landscape-web.mp4` | 20 seconds, 1280 × 720 |
| About, `#launch-film` | Launch Spot, `renders/final/animo_spot_v4_4x5_web.mp4` | Full 54.7-second film, 720 × 900 |

Original projects are `/Users/jonnichols/Animo Launch Spot/animo-spot/` and `/Users/jonnichols/Animo Paid Ads/animo-reels/`. Website encodes use H.264, CRF 25, yuv420p, AAC 96 kbps, and fast-start metadata. The silent hero uses CRF 26. All aspect ratios are preserved; posters come from the source exports.

`assets/films.css` and `assets/films.js` are loaded only on the four updated pages. Content films use `preload="none"` and native sound, seek and fullscreen controls. Starting a film pauses other films. The decorative hero has no audio track, pauses outside the viewport or on a hidden tab, and preserves an explicit visitor pause. Reduced-motion and Save-Data visitors receive a still poster and an optional Play motion button. Without JavaScript, the hero remains a poster and the content films still have native controls and direct links.

The launch film has English WebVTT captions and a collapsible transcript/visual description. Caption dialogue comes from the source timeline/transcripts; the closing voiceover was transcribed from the supplied audio. The graphic reels present their message as on-screen text with music.

An intentional film play emits `video_start` once per film per page view through the existing GA4 tag, with only the film key and page path. Hero motion does not emit video engagement events. Existing booking/conversion behavior is unchanged.

For revisions, use a new dated media directory and update the CSS/JS version strings. Netlify serves `/assets/*` with immutable caching.
