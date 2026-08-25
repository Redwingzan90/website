// Second pass: single-line rules with several declarations, and gradient stops,
// which the first pass skipped. Splits the declaration so the fallback sits
// immediately before the color-mix() version.
import fs from 'node:fs'

const FILE = 'assets/korr.css'
let src = fs.readFileSync(FILE, 'utf8')

const RGB = {
  '--paper': '233, 231, 225', '--paper-lift': '243, 241, 236',
  '--paper-deep': '220, 216, 206', '--paper-edge': '206, 201, 188',
  '--ink': '20, 20, 15', '--ink-2': '58, 55, 47', '--ink-3': '102, 97, 79',
  '--rule': '179, 173, 158', '--rule-hair': '196, 189, 172',
  '--stamp': '140, 47, 40', '--green': '47, 93, 74',
}
const flat = (v, pct) => `rgba(${RGB[v]}, ${(+pct / 100).toFixed(2)})`

// property: color-mix(...)  ->  property: rgba(...); property: color-mix(...)
const rules = [
  ['#inquiry .caption { color: color-mix(in srgb, var(--paper) 60%, transparent); }',
   `#inquiry .caption { color: ${flat('--paper', 60)}; color: color-mix(in srgb, var(--paper) 60%, transparent); }`],
  ['#inquiry .prose { color: color-mix(in srgb, var(--paper) 80%, transparent); }',
   `#inquiry .prose { color: ${flat('--paper', 80)}; color: color-mix(in srgb, var(--paper) 80%, transparent); }`],
  ['.form-msg.ok { border-color: var(--green); background: color-mix(in srgb, var(--green) 26%, transparent); }',
   `.form-msg.ok { border-color: var(--green); background: ${flat('--green', 26)}; background: color-mix(in srgb, var(--green) 26%, transparent); }`],
  ['footer { background: var(--ink); color: color-mix(in srgb, var(--paper) 66%, transparent); }',
   `footer { background: var(--ink); color: ${flat('--paper', 66)}; color: color-mix(in srgb, var(--paper) 66%, transparent); }`],
  ['footer .mark span { color: color-mix(in srgb, var(--paper) 50%, transparent); }',
   `footer .mark span { color: ${flat('--paper', 50)}; color: color-mix(in srgb, var(--paper) 50%, transparent); }`],
]

let n = 0
for (const [from, to] of rules) {
  if (src.includes(from)) { src = src.replace(from, to); n++ }
  else console.log('  (not found, may already be patched) ' + from.slice(0, 48))
}

// Gradient stops: an invalid colour invalidates the whole gradient, so give the
// property a flat fallback declaration first.
const GRAD = [
  { anchor: '.sheet-ground {', prop: 'background-image', fallback: 'none' },
  { anchor: '.lot.gone {', prop: 'background', fallback: flat('--ink', 8) },
  { anchor: '.no-plate {', prop: 'background', fallback: flat('--paper', 100) },
  { anchor: '.plat-lot.gone {', prop: 'background', fallback: flat('--ink', 8) },
]
for (const g of GRAD) {
  const i = src.indexOf(g.anchor)
  if (i < 0) continue
  const j = src.indexOf(g.prop + ':', i)
  if (j < 0 || j > src.indexOf('}', i)) continue
  if (src.slice(Math.max(0, j - 80), j).includes('/* fallback */')) continue
  src = src.slice(0, j) + `${g.prop}: ${g.fallback}; /* fallback */\n  ` + src.slice(j)
  n++
}

fs.writeFileSync(FILE, src)
console.log(`patched ${n} declarations`)

const left = [...src.split(/\r?\n/).entries()].filter(([i, l]) =>
  /color-mix/.test(l) && !/fallback/.test(l) &&
  !/fallback/.test(src.split(/\r?\n/)[i - 1] || '') && !/rgba\(/.test(l))
console.log(`color-mix() declarations still without a fallback: ${left.length}`)
left.forEach(([i, l]) => console.log(`  ${i + 1}: ${l.trim().slice(0, 70)}`))
