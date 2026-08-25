# KORR Building Company LLC

Owner-financed land in Tonopah, Arizona and homes in Seminole, Texas.
Static site — no build step, no framework. Deployed on Netlify from this repo.

## Changing a property

**Never hand-edit `assets/data.js`.** It is generated.

1. Edit `data.snapshot.json` — the source of truth for every property fact.
2. Regenerate and check:

```bash
node _build-data.mjs && node _verify-data.mjs
```

`_verify-data.mjs` must print **PASS** before you commit. It proves nothing was
lost against the snapshot, and it fails the build if the site would publish
something the record contradicts.

## What the checker enforces

- every property, lot, price, term, parcel number and direction step round-trips
- no availability claim contradicts the lot array (e.g. a highlight saying
  "3 Lots Available" when only one lot is open)
- no photograph appears on two different properties
- an advertised loan term is reachable at the advertised monthly payment
- every image path resolves on disk
- every contact number is still reachable somewhere on the site
- no fabricated testimonial has been reintroduced

## Local preview

```bash
node _serve.mjs 4321
```

Then open http://127.0.0.1:4321/

## Adding photographs

Drop a folder into `add images/`, map it to a property id in `_add-photos.mjs`,
then:

```bash
node _add-photos.mjs && node _build-data.mjs && node _verify-data.mjs
```

This generates the `-640` / `-1280` webp variants the site serves. Camera
originals are gitignored — **keep your own backup of them.**

## Layout

```
index.html          the page
assets/korr.css     design system
assets/korr.js      rendering + interaction
assets/data.js      GENERATED — do not edit
assets/ink.js       the recording-stamp shader
assets/motion.js    Lenis + GSAP scroll choreography
vendor/             GSAP, ScrollTrigger, Lenis (vendored, no CDN at runtime)
data.snapshot.json  SOURCE OF TRUTH for property facts
PRODUCT.md          product truth: audience, constraints, what must never be invented
DESIGN.md           the visual system as built
```

## Ground rules

- **No invented facts.** No testimonials, review counts, years in business,
  acres sold, or customer numbers unless the owner supplies them. See
  `PRODUCT.md` › Evidence on Hand.
- **Lot-level truth.** Sold lots stay visible and marked; the site must never
  imply a sold lot is available.
- **Terms in the open.** Price, down payment, monthly, rate and term belong on
  the page, not behind a phone call.
