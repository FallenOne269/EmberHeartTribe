# Ember Heart Tribe

The website for Ember Heart Tribe, a live WhatsApp community for misfits, freethinkers, and disruptors with heart. Stay wild. Stay human.

Live site: https://embertribe-8maaykep.manus.space

## What's here

`public/` is the site's front end, copied from the live Manus deployment on November 10, 2026, with the analytics and editor scripts that Manus injects at serving time removed.

- `index.html`, `styles.css`, `script.js`, `ember-mark.svg`: the landing page.
- `moderate.html`, `moderate.css`, `moderate.js`: the owner-only Stories moderation page.
- `manus-routes.json`: page list used by Manus hosting.
- `manus-storage/`: the hero image, the promo film (MP4) and the Emberheart track (MP3).

The page also has a Recursion Zero section (`#recursion-zero`) laying out the framework: the core claim, the Ten Directives, the Thirteen Core Protocols, and how the framework is meant to be tested.

## Not in this repository yet

- **The Stories server.** The Stories board posts to `/api/stories` on a Node server (`server.js`, `package.json`, `Dockerfile`) that lives only in the Manus project. It is not publicly downloadable, so it isn't here. Without it, the page loads and plays everything, but Stories won't load or post.
- **The lossless WAV** (`Emberheart_mastered_c6aaca27.wav`, about 82 MB). The page lists it only as a fallback after the MP3, so playback works without it.

## Run it locally

```bash
cd public
python3 -m http.server 8000
```

Then open http://localhost:8000.

Pushing here does not change the live Manus site; that site is still published from Manus.
