// Re-extract the authoritative data from the LIVE site (live.html) and diff it
// against the snapshot taken from the local Downloads copy, so every difference
// is visible before anything is overwritten.
import fs from 'node:fs'

const html = fs.readFileSync('live.html', 'utf8')

function grab (name, open, close) {
  const i = html.indexOf(`const ${name} = ${open}`)
  if (i < 0) return null
  const start = html.indexOf(open, i)
  let depth = 0, inStr = null, esc = false, j = start
  for (; j < html.length; j++) {
    const c = html[j]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (inStr) { if (c === inStr) inStr = null; continue }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue }
    if (c === open) depth++
    else if (c === close) { depth--; if (!depth) break }
  }
  return eval('(' + html.slice(start, j + 1) + ')')
}

const live = {
  properties: grab('properties', '[', ']'),
  faqs: grab('faqs', '[', ']'),
  testimonials: grab('testimonials', '[', ']'),
  locations: grab('locations', '[', ']'),
  maps: grab('maps', '{', '}'),
}

const old = JSON.parse(fs.readFileSync('data.snapshot.json', 'utf8'))

const oldById = new Map(old.properties.map(p => [p.id, p]))
const newById = new Map(live.properties.map(p => [p.id, p]))

console.log('LIVE SITE vs LOCAL DOWNLOADS COPY')
console.log('='.repeat(66))
console.log(`properties   live ${live.properties.length}   local ${old.properties.length}`)
console.log(`faqs         live ${live.faqs.length}   local ${old.faqs.length}`)

const added = [...newById.keys()].filter(k => !oldById.has(k))
const removed = [...oldById.keys()].filter(k => !newById.has(k))
console.log(`\nONLY ON LIVE:  ${added.length ? added.join(', ') : 'none'}`)
console.log(`ONLY ON LOCAL: ${removed.length ? removed.join(', ') : 'none'}`)

for (const id of added) {
  const p = newById.get(id)
  console.log(`\n  + #${id} ${p.title}`)
  console.log(`      ${p.price} · ${p.downPayment} down · ${p.monthly} · ${p.interestRate}`)
  console.log(`      lots: ${(p.lots || []).map(l => l.id + ':' + l.status).join(' ') || '—'}`)
  console.log(`      images: ${(p.images || []).length}`)
  console.log(`      highlights: ${(p.highlights || []).length}, directions: ${(p.directions || []).length}`)
}

console.log('\nFIELD DIFFS ON SHARED PROPERTIES')
console.log('-'.repeat(66))
let diffs = 0
for (const [id, np] of newById) {
  const op = oldById.get(id); if (!op) continue
  const keys = [...new Set([...Object.keys(op), ...Object.keys(np)])]
  for (const k of keys) {
    const a = JSON.stringify(op[k]), b = JSON.stringify(np[k])
    if (a === b) continue
    diffs++
    if (k === 'images') { console.log(`  #${id} images: local ${(op[k]||[]).length} vs live ${(np[k]||[]).length}`); continue }
    console.log(`  #${id} ${k}:`)
    console.log(`      local: ${a === undefined ? '(absent)' : String(a).slice(0, 130)}`)
    console.log(`      live : ${b === undefined ? '(absent)' : String(b).slice(0, 130)}`)
  }
}
if (!diffs) console.log('  (none — shared properties are identical)')

// which live image paths actually exist locally?
const missing = new Set()
let total = 0
for (const p of live.properties) for (const im of p.images || []) {
  const cands = /\.(webp|png|jpe?g)$/i.test(im) ? [im] : [im + '-640.webp', im + '-1280.webp']
  for (const c of cands) { total++; if (!fs.existsSync(c)) missing.add(c) }
}
console.log(`\nIMAGE PATHS referenced by live data: ${total} checked, ${missing.size} missing locally`)
;[...missing].slice(0, 12).forEach(m => console.log('   missing: ' + m))

fs.writeFileSync('live.extract.json', JSON.stringify(live, null, 2))
console.log('\nwrote live.extract.json')
