# Living illustration asset pipeline

- Source image: `assets/hero/animo-growth-system.jpg` (1672 × 941).
- Depth image: `assets/hero/animo-growth-depth-tiefling-v1.png` (1672 × 941, 98,246 bytes, grayscale, SHA-256 `184eb1aa75a4af9690b3023875d4128d53b21e5eeac57e341530ade17bbdbf21`).
- Depth image generated locally on 08-22-2026 with Tiefling using Depth Anything V2 Small at a requested 1024-pixel model size. The model ran locally in the browser; no source image was uploaded.
- Runtime: pinned Three.js 0.185.1 plus the existing Motion 13.1.1 scroll hook.
- The browser receives only the source image, the pre-generated depth image, and the renderer. It does not receive Tiefling or an inference model.
- Reduced-motion, WebGL failure, texture failure, and context loss retain the existing static image explorer.

Licenses:

- Tiefling: MIT.
- Depth Anything V2 Small: Apache-2.0.
- Three.js: MIT; the vendored module retains its license header and `assets/vendor/three/LICENSE.js` contains the license text.
