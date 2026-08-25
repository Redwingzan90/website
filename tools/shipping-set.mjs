// Works out exactly which files the site actually serves, so everything else
// can be kept out of the deploy.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ctx = { window: {} }
vm.createContext(ctx)
vm.runInContext(fs.readFileSync('site/assets/data.js', 'utf8'), ctx)
const D = ctx.window.KORR_DATA

const need = new Set([
  'site/index.html', 'site/favicon.svg',
  'site/assets/korr.css', 'site/assets/korr.js', 'site/assets/data.js', 'site/assets/ink.js', 'site/assets/motion.js',
  'site/vendor/gsap.min.js', 'site/vendor/ScrollTrigger.min.js', 'site/vendor/lenis.min.js',
])

for (const p of D.properties) {
  for (const b of p.images || []) {
    if (/\.(webp|png|jpe?g)$/i.test(b)) need.add(b)
    else { need.add(b + '-640.webp'); need.add(b + '-1280.webp') }
  }
}
// images referenced directly from markup / js (exhibit plates, overlays)
const src = fs.readFileSync('site/index.html', 'utf8') + fs.readFileSync('site/assets/korr.js', 'utf8')
for (const m of src.matchAll(/images\/[A-Za-z0-9_\-./]+/g)) {
  const b = m[0]
  if (/\.(webp|png|jpe?g|svg)$/i.test(b)) need.add(b)
  else { need.add(b + '-640.webp'); need.add(b + '-1280.webp') }
}

const all = []
;(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue
    const p = path.join(d, e.name).split(path.sep).join('/')
    e.isDirectory() ? walk(p) : all.push(p)
  }
})('.')

const norm = (f) => f.replace(/^\.\//, '')
const shipped = [], extra = []
for (const f of all) (need.has(norm(f)) ? shipped : extra).push(norm(f))

const size = (f) => { try { return fs.statSync(f).size } catch { return 0 } }
const sum = (a) => a.reduce((t, f) => t + size(f), 0)

const missing = [...need].filter(f => !fs.existsSync(f))

console.log('SHIPPING SET')
console.log('-'.repeat(56))
console.log(`files the site serves : ${shipped.length}  (${(sum(shipped) / 1048576).toFixed(1)} MB)`)
console.log(`everything else       : ${extra.length}  (${(sum(extra) / 1048576).toFixed(1)} MB)`)
console.log(`total on disk         : ${all.length}  (${(sum(all.map(norm)) / 1048576).toFixed(1)} MB)`)
if (missing.length) { console.log('\nREFERENCED BUT MISSING:'); missing.forEach(m => console.log('  x ' + m)) }

const group = {}
for (const f of extra) {
  const k = f.startsWith('add images/') ? 'add images/'
    : f.startsWith('images/') ? (/\.(jpe?g|png)$/i.test(f) ? 'images/ raw originals (jpg/png)' : 'images/ unused webp')
    : f.startsWith('.claude') ? '.claude/'
    : /^_|\.mjs$/.test(f) ? 'build + audit scripts'
    : /^(live\.html|live\.extract\.json|data\.snapshot.*\.json|_new-photos\.json|index\.original\.backup\.html)$/.test(f) ? 'source data + backups'
    : 'other'
  ;(group[k] = group[k] || []).push(f)
}
console.log('\nNOT SERVED, BY GROUP')
console.log('-'.repeat(56))
for (const [k, v] of Object.entries(group).sort((a, b) => sum(b[1]) - sum(a[1]))) {
  console.log(`${(sum(v) / 1048576).toFixed(1).padStart(6)} MB  ${String(v.length).padStart(4)} files  ${k}`)
}
console.log('\nlargest unused files:')
extra.map(f => [size(f), f]).sort((a, b) => b[0] - a[0]).slice(0, 10)
  .forEach(([s, f]) => console.log(`  ${(s / 1024).toFixed(0).padStart(6)} KB  ${f}`))

fs.writeFileSync('data/shipping-set.txt', shipped.sort().join('\n'))
console.log('\nwrote _shipping-set.txt')
