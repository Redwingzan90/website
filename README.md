# KORR Building Company LLC

Owner-financed land in Tonopah, Arizona and homes in Seminole, Texas.
Static site — no build step, no framework. Deployed on Netlify from this repo.

## Changing a property

**Never hand-edit `site/assets/data.js`.** It is generated.

1. Edit `data/data.snapshot.json` — the source of truth for every property fact.
2. Regenerate and check:

```bash
node tools/build-data.mjs && node tools/verify-data.mjs
```

`tools/verify-data.mjs` must print **PASS** before you commit. It proves nothing was
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
node tools/serve.mjs 4321
```

Then open http://127.0.0.1:4321/

## Adding photographs

Drop a folder into `photos-inbox/`, map it to a property id in `tools/add-photos.mjs`,
then:

```bash
node tools/add-photos.mjs && node tools/build-data.mjs && node tools/verify-data.mjs
```

This generates the `-640` / `-1280` webp variants the site serves. Camera
originals are gitignored — **keep your own backup of them.**

## Layout

Netlify publishes **`site/` only**. Everything else in this repository is
internal and cannot be fetched from the web — which is the point: the repo root
used to be the web root, so the photo inbox, the HTML backups and the data
snapshots were all publicly downloadable, and only a list of hand-written 404
redirects stood in the way. A file is now private unless someone deliberately
puts it in `site/`.

```
site/                 PUBLISHED — everything here is on the internet
  index.html          the page
  privacy.html        privacy policy
  404.html            not-found page
  assets/korr.css     design system
  assets/korr.js      rendering + interaction
  assets/data.js      GENERATED - do not edit
  assets/ink.js       the recording-stamp shader
  assets/motion.js    Lenis + GSAP scroll choreography
  vendor/             GSAP, ScrollTrigger, Lenis (vendored, no CDN at runtime)
  images/             the photographs the site serves

tools/                build and check scripts; run from the repo root
  verify-data.mjs     must print PASS before any commit
  build-data.mjs      regenerates site/assets/data.js from the snapshot
  add-photos.mjs      imports photos-inbox/ and makes the webp variants
  serve.mjs           local preview of site/ on http://127.0.0.1:4321
  manifest.mjs        hashes every published file, to prove a refactor changed nothing

data/                 SOURCE OF TRUTH
  data.snapshot.json  every property fact
  new-photos.json     photo-to-property mapping

photos-inbox/         camera originals waiting to be placed on a property
fonts/                brand source fonts (used to generate assets, not served)
archive/              superseded copies kept as extraction baselines

PRODUCT.md            product truth: audience, constraints, what must never be invented
netlify.toml          publish directory, caching and security headers
```


## Ground rules

- **No invented facts.** No testimonials, review counts, years in business,
  acres sold, or customer numbers unless the owner supplies them. See
  `PRODUCT.md` › Evidence on Hand.
- **Lot-level truth.** Sold lots stay visible and marked; the site must never
  imply a sold lot is available.
- **Terms in the open.** Price, down payment, monthly, rate and term belong on
  the page, not behind a phone call.
