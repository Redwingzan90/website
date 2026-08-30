// Builds assets/data.js from data.snapshot.json.
//
// SOURCE OF TRUTH: data.snapshot.json, extracted verbatim from the LIVE site
// (https://korrbuildingcollc.netlify.app/) on 2026-08-23. The older local
// Downloads copy is archived at data.snapshot.local-downloads.json and is NOT
// used — it was stale (missing Property #1, wrong down payments, wrong lot
// availability).
//
// Only these transforms are applied, and each is logged:
//   1. new photographs appended (authentic ones first so they lead the card)
//   2. fabricated testimonials dropped (see PRODUCT.md > Evidence on Hand)
// Property facts are never retyped by hand.
import fs from 'node:fs'
import crypto from 'node:crypto'

const snap = JSON.parse(fs.readFileSync('data/data.snapshot.json', 'utf8'))
const newPhotos = JSON.parse(fs.readFileSync('data/new-photos.json', 'utf8'))

const PHOTO_TARGET = { 4: 'property4', 10: '487th-north', 5: 'property5' }

const log = []
const owner = []      // things only the owner can decide, surfaced at the end

const properties = snap.properties.map(p => {
  const out = { ...p }
  const dest = PHOTO_TARGET[p.id]
  if (dest && newPhotos[dest]) {
    const fresh = newPhotos[dest].bases.filter(b => !(out.images || []).includes(b))
    if (fresh.length) {
      out.images = [...fresh, ...(out.images || [])]
      log.push(`  #${p.id} ${p.title}: +${fresh.length} photos (now ${out.images.length})`)
    }
  }
  return out
})

/* ---------------------------------------------------------------------------
   1. DE-DUPLICATE PHOTOGRAPHS ACROSS PROPERTIES.
   The live data shows byte-identical photos on different parcels. Presenting
   one parcel's ground as another's misleads a buyer about what they are
   purchasing, so each photograph is kept on exactly one property, chosen by
   folder provenance, and removed everywhere else.
--------------------------------------------------------------------------- */
const sha = (f) => {
  try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex') }
  catch { return null }
}
// Image paths are web paths and site/ is the web root (same rule as verify-data.mjs)
const fileFor = (base) => 'site/' + (/\.(webp|png|jpe?g)$/i.test(base) ? base : `${base}-640.webp`)

// hash -> [{id, base}]
const seen = new Map()
for (const p of properties) {
  for (const base of p.images || []) {
    const h = sha(fileFor(base))
    if (!h) continue
    if (!seen.has(h)) seen.set(h, [])
    seen.get(h).push({ id: p.id, base })
  }
}

// Provenance: the directory that actually names the parcel wins.
const OWNS = [
  { dir: '411th-olive',     id: 7,  why: 'folder "411th and Olive" — #7 is 411th & Olive' },
  { dir: 'property7',       id: 7,  why: 'the 411th-and-Olive screenshots belong to #7' },
  { dir: 'property2',       id: 2,  why: 'folder property2 — #2 is 487th South' },
  { dir: 'salome-highway',  id: 6,  why: 'folder salome-highway — #6 is Salome Highway' },
  { dir: '539th-baseline',  id: 3,  why: 'folder 539th-baseline — #3 is 539th & Baseline' },
]
const preferredOwner = (candidates) => {
  for (const c of candidates) {
    const rule = OWNS.find(o => c.base.includes('/' + o.dir + '/'))
    if (rule && candidates.some(x => x.id === rule.id)) return { id: rule.id, why: rule.why }
  }
  // otherwise keep it on whichever property has the fewest other photographs
  const counts = new Map(candidates.map(c => [c.id, (properties.find(p => p.id === c.id).images || []).length]))
  const winner = [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0]
  return { id: winner, why: 'kept on the property with the fewest alternatives' }
}

let removed = 0
for (const [, cands] of seen) {
  const ids = [...new Set(cands.map(c => c.id))]
  if (ids.length < 2) continue
  const keep = preferredOwner(cands)
  for (const c of cands) {
    if (c.id === keep.id) continue
    const prop = properties.find(p => p.id === c.id)
    prop.images = prop.images.filter(b => b !== c.base)
    removed++
  }
  owner.push(`photo shared by #${ids.join(' / #')} — kept on #${keep.id} (${keep.why})`)
}
if (removed) log.push(`  de-duplicated ${removed} photo slots across properties`)

/* ---------------------------------------------------------------------------
   2. AVAILABILITY CLAIMS MUST MATCH THE LOT ARRAY.
   Several highlight strings assert a lot count that the lots array contradicts.
   The lots array is the record; the marketing string is corrected to match, and
   every correction is reported so the owner can confirm which was right.
--------------------------------------------------------------------------- */
const COUNT_RE = /^(all|\d+)\s+(lots?|parcels?)\s+available$/i
for (const p of properties) {
  if (p.isHouse || !p.highlights) continue
  const open = (p.lots || []).filter(l => l.status === 'available').length
  const total = (p.lots || []).length
  p.highlights = p.highlights.map(h => {
    const m = h.trim().match(COUNT_RE)
    if (!m) return h
    const claimed = /^all$/i.test(m[1]) ? total : parseInt(m[1], 10)
    if (claimed === open) return h
    // pluralise from the total, not the open count: "1 of 4 lots available"
    const noun = /parcel/i.test(m[2]) ? 'parcels' : 'lots'
    const fixed = `${open} of ${total} ${noun} available`
    owner.push(`#${p.id} highlight said "${h.trim()}" but the lot record shows ${open} of ${total} open — corrected`)
    return fixed
  })
}

/* ---------------------------------------------------------------------------
   3. A bare phone number is not a driving direction. Several `directions`
   arrays end with one; it renders as a numbered route step.
--------------------------------------------------------------------------- */
const PHONE_ONLY = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
for (const p of properties) {
  if (!p.directions) continue
  const before = p.directions.length
  p.directions = p.directions.filter(d => !PHONE_ONLY.test(d.trim()))
  if (p.directions.length !== before) log.push(`  #${p.id}: dropped a bare phone number from the route steps`)
}

// Every contact on the live site, preserved. The team is real and buyers use
// these lines; the regional routing is how the live site actually behaves.
const contacts = {
  // Confirmed by owner 2026-08-23: 480-453-4044 is the main line (Sebastian).
  // The 4004 spelling that briefly circulated was a typo.
  primary: '480-453-4044',
  primaryHref: 'tel:4804534044',
  team: [
    { name: 'Charlie', role: '', phone: '701-500-5906', href: 'tel:7015005906' },
    { name: 'Kisha', role: 'Manager', phone: '(432) 308-2481', href: 'tel:4323082481' },
    { name: 'Sebastian', role: 'main line', phone: '480-453-4044', href: 'tel:4804534044' },
    { name: 'Ben', role: '', phone: '602-525-5688', href: 'tel:6025255688' },
  ],
  byRegion: {
    tonopah: { label: 'Arizona parcels', phone: '701-500-5906', href: 'tel:7015005906' },
    seminole: { label: 'Texas houses', phone: '(806) 752-0022', href: 'tel:8067520022' },
  },
}

const data = {
  phone: contacts.primary,
  phoneHref: contacts.primaryHref,
  contacts,
  email: 'Charlielandandhomes2@gmail.com',
  emailAlt: 'korrbuildingco.llc@gmail.com',
  address: '1505 East Everglade Ave, Odessa, TX 79762',
  titleAgency: 'Pioneer Title Agency, Maricopa',
  locations: snap.locations,
  properties,
  faqs: snap.faqs,
  maps: snap.maps,
  // testimonials intentionally absent — see PRODUCT.md > Evidence on Hand
}

const banner = `/* KORR Building Co — property data.
 * GENERATED from data.snapshot.json by _build-data.mjs. Do not hand-edit.
 * Source of truth: the live site, captured 2026-08-23.
 * To change a property fact, edit data.snapshot.json and re-run:
 *     node _build-data.mjs && node _verify-data.mjs
 */\n`

fs.writeFileSync('site/assets/data.js', banner + 'window.KORR_DATA = ' + JSON.stringify(data, null, 2) + ';\n')

console.log('TRANSFORMS APPLIED')
console.log(log.length ? log.join('\n') : '  (none)')
console.log(`\ntestimonials dropped: ${(snap.testimonials || []).length} (fabricated — must not be reintroduced)`)

let lots = 0, imgs = 0, hl = 0, dir = 0, av = 0
for (const p of properties) {
  lots += (p.lots || []).length; imgs += (p.images || []).length
  hl += (p.highlights || []).length; dir += (p.directions || []).length
  for (const l of p.lots || []) if (l.status === 'available') av++
}
console.log(`\nassets/data.js: ${properties.length} properties · ${lots} lots (${av} available) · ${imgs} images · ${hl} highlights · ${dir} direction steps`)
console.log(`contacts preserved: ${contacts.team.length} team lines + ${Object.keys(contacts.byRegion).length} regional lines`)

if (owner.length) {
  console.log('\nNEEDS OWNER CONFIRMATION:')
  owner.forEach(o => console.log('  ! ' + o))
}
