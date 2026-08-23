// One-off: pull the data structures out of the original index.html verbatim.
import fs from 'node:fs'

const html = fs.readFileSync('index.original.backup.html', 'utf8')

function grabArray (name) {
  const i = html.indexOf(`const ${name} = [`)
  if (i < 0) throw new Error('not found: ' + name)
  const start = html.indexOf('[', i)
  let depth = 0, inStr = null, esc = false, j = start
  for (; j < html.length; j++) {
    const c = html[j]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (inStr) { if (c === inStr) inStr = null; continue }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue }
    if (c === '[') depth++
    else if (c === ']') { depth--; if (depth === 0) break }
  }
  return html.slice(start, j + 1)
}

function grabObject (name) {
  const i = html.indexOf(`const ${name} = {`)
  if (i < 0) throw new Error('not found: ' + name)
  const start = html.indexOf('{', i)
  let depth = 0, inStr = null, esc = false, j = start
  for (; j < html.length; j++) {
    const c = html[j]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (inStr) { if (c === inStr) inStr = null; continue }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) break }
  }
  return html.slice(start, j + 1)
}

const out = {
  properties: eval('(' + grabArray('properties') + ')'),
  faqs: eval('(' + grabArray('faqs') + ')'),
  testimonials: eval('(' + grabArray('testimonials') + ')'),
  locations: eval('(' + grabArray('locations') + ')'),
  maps: eval('(' + grabObject('maps') + ')'),
}

fs.writeFileSync('data.snapshot.json', JSON.stringify(out, null, 2))

console.log('properties:', out.properties.length,
  '| faqs:', out.faqs.length,
  '| testimonials:', out.testimonials.length,
  '| maps:', Object.keys(out.maps).join(','))

let lots = 0, imgs = 0, hl = 0, dir = 0, avail = 0, sold = 0
for (const p of out.properties) {
  lots += (p.lots || []).length
  imgs += (p.images || []).length
  hl += (p.highlights || []).length
  dir += (p.directions || []).length
  for (const l of p.lots || []) l.status === 'available' ? avail++ : sold++
}
console.log('TOTALS TO PRESERVE -> lots:', lots, '| images:', imgs,
  '| highlights:', hl, '| direction steps:', dir)
console.log('lot status -> available:', avail, '| sold:', sold)
console.log('\nfield union across properties:')
console.log('  ' + [...new Set(out.properties.flatMap(p => Object.keys(p)))].join(', '))
console.log('\nper-property inventory:')
for (const p of out.properties) {
  console.log(`  #${String(p.id).padEnd(4)} ${p.title.padEnd(46)} ${String(p.price).padEnd(10)} lots:${String((p.lots || []).length).padStart(2)} imgs:${String((p.images || []).length).padStart(2)}`)
}
