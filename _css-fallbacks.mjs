// color-mix() is Safari 16.2+. On older iOS the declaration is dropped and the
// PREVIOUS one wins — which made the footer text #14140f on a #14140f ground
// (invisible) and removed the contact form's field underlines entirely.
//
// This inserts a literal rgba() fallback immediately before every color-mix()
// declaration, so old Safari gets the flat colour and new Safari overrides it.
// Idempotent: re-running will not double up.
import fs from 'node:fs'

const FILE = 'assets/korr.css'
const src = fs.readFileSync(FILE, 'utf8')

const VARS = {
  '--paper': [233, 231, 225],
  '--paper-lift': [243, 241, 236],
  '--paper-deep': [220, 216, 206],
  '--paper-edge': [206, 201, 188],
  '--ink': [20, 20, 15],
  '--ink-2': [58, 55, 47],
  '--ink-3': [102, 97, 79],
  '--rule': [179, 173, 158],
  '--rule-hair': [196, 189, 172],
  '--stamp': [140, 47, 40],
  '--green': [47, 93, 74],
}

const MIX = /color-mix\(\s*in\s+srgb\s*,\s*var\((--[a-z0-9-]+)\)\s+(\d+)%\s*,\s*transparent\s*\)/gi

const out = []
let added = 0

for (const line of src.split(/\r?\n/)) {
  const m = [...line.matchAll(MIX)]
  // only whole declarations, and skip if a fallback is already there
  if (m.length && /^\s*[-a-z]+\s*:/i.test(line) && !/\/\* fallback \*\//.test(out[out.length - 1] || '')) {
    let flat = line
    let ok = true
    for (const hit of m) {
      const rgb = VARS[hit[1]]
      if (!rgb) { ok = false; break }
      flat = flat.replace(hit[0], `rgba(${rgb.join(', ')}, ${(+hit[2] / 100).toFixed(2)})`)
    }
    if (ok) {
      out.push(flat.replace(/;?\s*$/, ';') + ' /* fallback */')
      added++
    }
  }
  out.push(line)
}

fs.writeFileSync(FILE, out.join('\n'))
console.log(`inserted ${added} rgba() fallbacks before color-mix() declarations`)

const after = fs.readFileSync(FILE, 'utf8')
const remaining = [...after.matchAll(MIX)].length
console.log(`color-mix() declarations now covered: ${added} / ${remaining} occurrences`)
