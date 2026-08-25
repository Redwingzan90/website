// Convert the genuinely-new photos in "add images/" into the site's existing
// -640 / -1280 webp pipeline, and emit the image bases to wire into the data.
//
// "411th and Olive" and "Property 11" are deliberately omitted: every file in
// them is already present in images/ under the same basename.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const sharp = require('C:/Users/Amanda/AppData/Local/Temp/claude/C--Users-Amanda/a1826788-0af0-4db6-8278-aaa79b51cec9/scratchpad/imgtools/node_modules/sharp')

const MAP = [
  { folder: '411th and CamelBack South 5 Acres property 4', dest: 'property4',    note: 'folder label says "property 4" — VERIFY' },
  { folder: '487th North lots Property 2',                  dest: '487th-north',  note: 'owner confirmed: Property #10' },
  { folder: 'Property 5 North 5 Acres 411th and CamelBack', dest: 'property5',    note: 'folder label says "Property 5" — VERIFY' },
]

const known = new Set()
;(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else known.add(e.name.replace(/(-640|-1280|-160)?\.(webp|jpe?g|png)$/i, ''))
  }
})('images')

const added = {}

for (const { folder, dest, note } of MAP) {
  const srcDir = path.join('add images', folder)
  const outDir = path.join('images', 'properties', dest)
  fs.mkdirSync(outDir, { recursive: true })

  const files = fs.readdirSync(srcDir)
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .filter(f => !known.has(f.replace(/\.[^.]+$/, '')))
    .sort()

  const bases = []
  let bytes = 0
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '')
    const src = path.join(srcDir, f)
    for (const w of [640, 1280]) {
      const out = path.join(outDir, `${base}-${w}.webp`)
      await sharp(src)
        .rotate()                                   // honour EXIF orientation
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: w === 640 ? 74 : 78, effort: 5 })
        .toFile(out)
      bytes += fs.statSync(out).size
    }
    bases.push(`images/properties/${dest}/${base}`)
  }
  added[dest] = { bases, note }
  console.log(`[${dest.padEnd(13)}] +${bases.length} photos → ${(bytes / 1024).toFixed(0)} KB of webp   (${note})`)
}

fs.writeFileSync('data/new-photos.json', JSON.stringify(added, null, 2))
console.log('\nwrote _new-photos.json')
