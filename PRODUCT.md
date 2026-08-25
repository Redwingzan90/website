# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single-file static HTML/CSS/JS (`index.html`), no build step, images served from `images/`.
Inherited from the existing codebase, not a greenfield choice. Deploys as plain static
files. Any rebuild must keep this property — the site has to be droppable on any host.

## Users

Primary buyer: a working adult who wants to own land but cannot or will not go through a
bank. Often has thin, damaged, or no credit history; may be self-employed or paid in cash.
Frequently shopping on a phone, sometimes on a weak rural connection. They are used to
being declined, and they are alert to anything that smells like a scam or a hidden catch.

They are not buying a lifestyle abstraction — they arrive with concrete questions: *What
is the total price? What do I pay today? What do I pay monthly? Can I really build on it?
Where exactly is it? Can I drive out and stand on it this weekend?*

Secondary: small investors buying multiple adjacent lots to hold.

## Product Purpose

Sell owner-financed residential land in Tonopah, Arizona, and owner-financed houses in
Seminole, Texas, directly to buyers with no bank, no credit check, and no qualifying
process. Success is a phone call or form inquiry from a buyer who already understands the
specific lot and its terms before they make contact.

## Positioning

The seller *is* the lender. KORR carries the note itself, which is why no credit check and
no qualifying is a truthful claim rather than a lead-generation hook. A buyer deals with
the same party from first call through closing and through the life of the note. Brokerage
sites listing bank-financed land cannot truthfully copy this.

## Operating Context

- Buyers evaluate lots by driving to them. Written turn-by-turn directions from I-10 are a
  functional part of the product, not marketing copy.
- Lots are physically marked in the field (white plastic pipe at corners, posted
  directional signs on the roadway).
- Closings are handled through Pioneer Title Agency, Maricopa.
- Parcel numbers are recorded and publicly verifiable through the county.
- Inventory is a fixed set of individually-numbered lots per property; each is either
  available or sold. Availability changes and the site must reflect it accurately.
- Contact form currently posts to formsubmit.co and emails
  `Charlielandandhomes2@gmail.com`.

## Capabilities and Constraints

- **13 properties**: 11 Tonopah AZ land parcels (IDs 1–11) and 2 Seminole TX houses
  (IDs 201, 202).
- **40 individually tracked lots**, currently 28 available / 12 sold.
- Prices $29,900–$69,900 for AZ land; $140,000 and $160,000 for the TX houses.
- Down payments from $425. Monthly payments $425–$980. AZ land financed at 12% interest.
  Loan terms range 7½–11 years. No pre-payment penalty on any property.
- Some properties carry deed restrictions (Property #11) and some are noted close to
  electric.
- Mixed sale types exist: certain lots are cash-only at a different price than the
  financed price (Properties #4 and #5). This nuance must not be flattened.
- Properties **#1 (Parcel 506-42-024)** and **#8 (Harquahala)** have **no photographs**.
  Confirmed 2026-08-23: none available.
- Authoritative data snapshot: `data.snapshot.json`, extracted verbatim from the **live
  site** (korrbuildingcollc.netlify.app) on 2026-08-23. This is the source of truth for
  all property facts. The older local `Downloads` export was **stale** — it omitted
  Property #1 entirely and carried wrong down payments (#2, #3) and wrong lot
  availability (#2, #7, #8, #11). It is archived at `data.snapshot.local-downloads.json`
  for reference only and must never be used as a source.

## Brand Commitments

- Name: **KORR Building Company LLC** (also appears as Korr Building Co LLC).
- Mailing address: 1505 East Everglade Ave, Odessa, TX 79762.
- **Main line, confirmed by owner 2026-08-23: 480-453-4044** (Sebastian). The owner first
  gave this as "480-453-4004" and then corrected it — `4044` is right, `4004` is a typo
  and must never be published.
- The rest of the team, all real and all live on the site:
  Charlie 701-500-5906 · Kisha (manager) (432) 308-2481 · Ben 602-525-5688.
- **Enquiries route by region**, as the live site does: Arizona parcels → 701-500-5906,
  Texas houses → (806) 752-0022. Preserve this behaviour.
- `928-299-9034` appeared only in the stale local export and is **not** a current number.
- Email: Charlielandandhomes2@gmail.com, korrbuildingco.llc@gmail.com.
- No binding visual constraint. The previous "Desert Ledger" look (warm near-black, gold,
  Fraunces) is explicitly **not** a commitment — owner directed a full visual replacement
  on 2026-08-23.

## Evidence on Hand

Real and usable:

- 82 photographs of actual parcels and houses, with responsive `-640`/`-1280` webp
  variants already generated.
- Recorded parcel numbers: 506-27-066, 506-16-004C, 506-74-024, 504-13-090M/K, 176581.
- Real turn-by-turn directions to every property.
- Real lot-level availability across 40 lots.
- Closing partner: Pioneer Title Agency, Maricopa.
- Five folders of additional unprocessed photos in `add images/`, mapping to Properties
  #4, #7, #10, #11, #5.

Explicitly absent — must not be fabricated:

- **No customer testimonials.** The six five-star quotes in the previous build were not
  from real customers (confirmed by owner 2026-08-23) and have been removed. Do not
  reintroduce testimonials, review counts, star ratings, or named buyers unless the owner
  supplies real ones with permission.
- No sales-volume, years-in-business, acres-sold, or customer-count figures are confirmed.
  Do not invent them.
- No press, awards, certifications, or third-party ratings.

## Product Principles

1. **The terms are the product.** Price, down payment, monthly payment, interest rate, and
   term are the information buyers came for. They belong in the open, early, and legible —
   never behind a click or softened into marketing language.
2. **Lot-level truth.** Availability is tracked per lot, not per property, and the site
   must never imply a sold lot is available or hide that a property is partly sold.
3. **Proof over persuasion.** This audience is scam-alert. Verifiable specifics — parcel
   numbers, a named title company, real photographs, real directions — build more trust
   than any claim about how great the experience is.
4. **Built for a phone on a weak connection.** The buyer is often standing outside or
   driving. Fast load, legible in sunlight, tappable targets, phone number always
   reachable.
5. **Every property must look intentional**, including the one with no photographs.

## Accessibility & Inclusion

General web audience skewing older; sunlight readability and large tap targets matter more
than usual. Target WCAG 2.1 AA: 4.5:1 body contrast, full keyboard operability, and a
working `prefers-reduced-motion` path for all motion and any WebGL.
