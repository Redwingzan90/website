// Proves the rebuilt site lost nothing from the authoritative source, and that
// it does not publish anything the record contradicts.
//
// Baseline: data.snapshot.json — extracted verbatim from the LIVE site
// (korrbuildingcollc.netlify.app) on 2026-08-23.
//
// Sanctioned transforms (anything else is a failure):
//   - images appended
//   - a photograph removed from a property ONLY when the identical file is
//     still published on another property (cross-property de-duplication)
//   - an availability highlight rewritten ONLY to match the lot record
//   - a directions entry removed ONLY when it was a bare phone number
import fs from 'node:fs'
import crypto from 'node:crypto'
import vm from 'node:vm'

const snap = JSON.parse(fs.readFileSync('data/data.snapshot.json', 'utf8'))
const ctx = { window: {} }
vm.createContext(ctx)
vm.runInContext(fs.readFileSync('site/assets/data.js', 'utf8'), ctx)
const live = ctx.window.KORR_DATA

const problems = []
const notes = []
const byId = new Map(live.properties.map(p => [p.id, p]))
const publishedImages = new Set(live.properties.flatMap(p => p.images || []))

const COUNT_RE = /^(all|\d+)\s+(lots?|parcels?)\s+available$/i
const FIXED_RE = /^\d+ of \d+ (lots?|parcels?) available$/i
const PHONE_ONLY = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/

if (live.properties.length !== snap.properties.length) {
  problems.push(`property count ${live.properties.length} != ${snap.properties.length}`)
}

// Image paths in data.js are web paths ("images/..."), and site/ is the web
// root, so every one of them resolves against site/ rather than the repo root.
const WEB_ROOT = 'site/'
const fileFor = (b) => WEB_ROOT + (/\.(webp|png|jpe?g)$/i.test(b) ? b : `${b}-640.webp`)
const sha = (f) => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex') } catch { return null } }

for (const before of snap.properties) {
  const after = byId.get(before.id)
  if (!after) { problems.push(`property #${before.id} (${before.title}) MISSING`); continue }

  for (const [k, v] of Object.entries(before)) {
    if (k === 'images') {
      for (const img of v) {
        if (after.images.includes(img)) continue
        // removal is only allowed if the identical photograph is still on the site
        const h = sha(fileFor(img))
        const twin = h && [...publishedImages].some(o => sha(fileFor(o)) === h)
        if (twin) notes.push(`#${before.id}: duplicate photo de-listed (still published elsewhere)`)
        else problems.push(`#${before.id} photograph LOST from the site: ${img}`)
      }
      continue
    }
    if (k === 'highlights') {
      if (v.length !== after.highlights.length) { problems.push(`#${before.id} highlight count changed`); continue }
      v.forEach((h, i) => {
        const now = after.highlights[i]
        if (h === now) return
        const open = (after.lots || []).filter(l => l.status === 'available').length
        const total = (after.lots || []).length
        const noun = /parcel/i.test(h) ? 'parcels' : 'lots'
        if (COUNT_RE.test(h.trim()) && FIXED_RE.test(now) && now === `${open} of ${total} ${noun} available`) {
          notes.push(`#${before.id}: availability claim corrected to the lot record ("${h.trim()}" -> "${now}")`)
        } else {
          problems.push(`#${before.id} highlights[${i}] CHANGED\n      was "${h}"\n      now "${now}"`)
        }
      })
      continue
    }
    if (k === 'directions') {
      const dropped = v.filter(d => !after.directions.includes(d))
      for (const d of dropped) {
        if (PHONE_ONLY.test(d.trim())) notes.push(`#${before.id}: bare phone number removed from route steps`)
        else problems.push(`#${before.id} direction step LOST: "${d}"`)
      }
      continue
    }
    if (JSON.stringify(v) !== JSON.stringify(after[k])) {
      problems.push(`#${before.id} ${k} CHANGED\n      was ${JSON.stringify(v)}\n      now ${JSON.stringify(after[k])}`)
    }
  }
}

if (JSON.stringify(snap.faqs) !== JSON.stringify(live.faqs)) problems.push('FAQ content changed')

/* ---- ASSERTION 1: no availability claim may contradict the lot record ---- */
for (const p of live.properties) {
  if (p.isHouse) continue
  const open = (p.lots || []).filter(l => l.status === 'available').length
  for (const h of p.highlights || []) {
    const m = h.trim().match(COUNT_RE)
    if (m) {
      const claimed = /^all$/i.test(m[1]) ? (p.lots || []).length : parseInt(m[1], 10)
      if (claimed !== open) problems.push(`#${p.id} claims "${h.trim()}" but ${open} lot(s) are open`)
    }
    const f = h.trim().match(/^(\d+) of (\d+) /)
    if (f && (+f[1] !== open || +f[2] !== (p.lots || []).length)) {
      problems.push(`#${p.id} claims "${h.trim()}" but the record is ${open} of ${(p.lots || []).length}`)
    }
  }
}

/* ---- ASSERTION 2: no photograph may appear on two different properties ---- */
const hashes = new Map()
for (const p of live.properties) for (const b of p.images || []) {
  const h = sha(fileFor(b)); if (!h) continue
  if (!hashes.has(h)) hashes.set(h, new Set())
  hashes.get(h).add(p.id)
}
for (const [, ids] of hashes) {
  if (ids.size > 1) problems.push(`identical photograph published on properties #${[...ids].join(', #')}`)
}

/* ---- ASSERTION 3: a stated loan term must be reachable at the stated payment */
const n = (s) => parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0
const termWarnings = []
for (const p of live.properties) {
  if (!p.loanTerm || !/12/.test(p.interestRate || '')) continue
  const P = n(p.price) - n(p.downPayment), pmt = n(p.monthly), r = 0.12 / 12
  if (!P || !pmt) continue
  const stated = /(\d+)\s*year[s]?\s*(?:and)?\s*(\d+)?\s*month/i.test(p.loanTerm)
    ? (+RegExp.$1 * 12 + (+RegExp.$2 || 0))
    : Math.round(parseFloat(p.loanTerm.replace(/[^0-9.½]/g, '').replace('½', '.5')) * 12)
  if (pmt <= P * r) { problems.push(`#${p.id} payment ${p.monthly} never amortizes ${p.price}`); continue }
  const actual = Math.log(pmt / (pmt - P * r)) / Math.log(1 + r)
  if (isFinite(stated) && stated > 0 && actual - stated > 6) {
    termWarnings.push(`#${p.id} advertises "${p.loanTerm}" (${stated} mo) but ${p.monthly} at 12% takes ${actual.toFixed(0)} mo`)
  }
}

/* ---- images resolve ---- */
let checked = 0; const broken = []
for (const p of live.properties) for (const img of p.images || []) {
  const cands = /\.(webp|png|jpe?g)$/i.test(img) ? [img] : [`${img}-640.webp`, `${img}-1280.webp`]
  for (const c of cands) { checked++; if (!fs.existsSync(WEB_ROOT + c)) broken.push(c) }
}
if (broken.length) problems.push(`${broken.length} broken image paths:\n      ` + broken.slice(0, 8).join('\n      '))

/* ---- contacts + testimonials ---- */
const shipped = ['site/index.html', 'site/assets/data.js', 'site/assets/korr.js']
  .filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n')
const digits = (s) => s.replace(/[^0-9]/g, '')
const REQUIRED = ['480-453-4044', '701-500-5906', '(432) 308-2481', '602-525-5688', '(806) 752-0022']
const missing = REQUIRED.filter(x => !digits(shipped).includes(digits(x)))
if (missing.length) problems.push('contact numbers lost: ' + missing.join(', '))
if (/4804534004|480-453-4004/.test(shipped)) problems.push('the mistyped 480-453-4004 is present — must be 4044')
for (const t of (snap.testimonials || [])) {
  if (shipped.includes(t.text.slice(2, 40))) problems.push(`fabricated testimonial reintroduced (${t.name})`)
}

let lots = 0, imgs = 0, hl = 0, dir = 0, av = 0
for (const p of live.properties) {
  lots += (p.lots || []).length; imgs += (p.images || []).length
  hl += (p.highlights || []).length; dir += (p.directions || []).length
  for (const l of p.lots || []) if (l.status === 'available') av++
}

console.log('KORR DATA INTEGRITY CHECK   (baseline: live site, 2026-08-23)')
console.log('-'.repeat(64))
console.log(`properties      ${live.properties.length} / ${snap.properties.length}`)
console.log(`lots            ${lots}   (${av} available)`)
console.log(`highlights      ${hl}`)
console.log(`direction steps ${dir}`)
console.log(`images          ${imgs}   (${checked} paths checked, ${broken.length} broken)`)
console.log(`faqs            ${live.faqs.length} / ${snap.faqs.length}`)
console.log(`contact lines   ${REQUIRED.length - missing.length} / ${REQUIRED.length}`)
console.log('-'.repeat(64))
const counted = {}
notes.forEach(x => { counted[x.replace(/\(.*\)/, '').trim()] = (counted[x.replace(/\(.*\)/, '').trim()] || 0) + 1 })
if (notes.length) {
  console.log('SANCTIONED EDITS:')
  Object.entries(counted).forEach(([k, v]) => console.log(`  - ${k}${v > 1 ? ` (x${v})` : ''}`))
  console.log('-'.repeat(64))
}
if (termWarnings.length) {
  console.log('OWNER MUST RESOLVE — advertised term vs payment:')
  termWarnings.forEach(w => console.log('  ! ' + w))
  console.log('-'.repeat(64))
}
if (problems.length) {
  console.log(`FAIL — ${problems.length} problem(s):`)
  problems.forEach(p => console.log('  x ' + p))
  process.exitCode = 1
} else {
  console.log('PASS — nothing lost, and nothing published that the record contradicts.')
}
