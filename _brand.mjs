// KORR brand assets.
//
// The mark is the site's own recording stamp — the same artifact the page is
// built around, so the social presence and the site are one world.
//
// Type is converted to vector outlines from the real Archivo and Courier Prime
// files in .fonts/, so nothing depends on a font being installed anywhere.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const TOOLS = 'C:/Users/Amanda/AppData/Local/Temp/claude/C--Users-Amanda/a1826788-0af0-4db6-8278-aaa79b51cec9/scratchpad/imgtools/node_modules/'
const fontkit = require(TOOLS + 'fontkit')
const sharp = require(TOOLS + 'sharp')

const OUT = 'images/brand'
fs.mkdirSync(OUT, { recursive: true })

const P = {
  paper: '#e9e7e1', lift: '#f3f1ec', ink: '#14140f', ink3: '#66614f',
  rule: '#b3ad9e', hair: '#c4bdac', stamp: '#8c2f28', green: '#2f5d4a',
}

// Archivo is variable — instance it so we get real condensed bold, not a fake.
const archivo = fontkit.openSync('.fonts/Archivo-var.ttf')
const A_BOLD = archivo.getVariation({ wght: 700, wdth: 88 })
const A_MED = archivo.getVariation({ wght: 500, wdth: 92 })
const C_BOLD = fontkit.openSync('.fonts/CourierPrime-Bold.ttf')
const C_REG = fontkit.openSync('.fonts/CourierPrime-Regular.ttf')

// Lay out a string as an SVG path at a given size, with optional letter-spacing.
function textPath (font, str, size, { x = 0, y = 0, spacing = 0, anchor = 'start' } = {}) {
  const run = font.layout(str)
  const scale = size / font.unitsPerEm
  let width = run.glyphs.reduce((w, g, i) => w + run.positions[i].xAdvance * scale, 0)
  width += spacing * Math.max(0, str.length - 1)
  let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
  const parts = []
  run.glyphs.forEach((g, i) => {
    const p = g.path.toSVG()
    if (p) parts.push(`<path d="${p}" transform="translate(${cx.toFixed(2)},${y.toFixed(2)}) scale(${scale.toFixed(5)},${(-scale).toFixed(5)})"/>`)
    cx += run.positions[i].xAdvance * scale + spacing
  })
  return { svg: parts.join(''), width }
}
const measure = (font, str, size, spacing = 0) => {
  const run = font.layout(str)
  const scale = size / font.unitsPerEm
  return run.glyphs.reduce((w, g, i) => w + run.positions[i].xAdvance * scale, 0) + spacing * Math.max(0, str.length - 1)
}
// shrink until it fits
function fitted (font, str, maxW, size, spacingRatio) {
  let s = size
  while (measure(font, str, s, s * spacingRatio) > maxW && s > 4) s -= size * 0.02
  return s
}
const fitLine = (font, str, maxW, size, spacingRatio) => fitted(font, str, maxW, size, spacingRatio)

/* --------------------------------------------------------- the stamp mark -- */
function stampSVG (cx, cy, r, rot = -7) {
  const g = []
  g.push(`<circle cx="0" cy="0" r="${r}" fill="none" stroke="${P.stamp}" stroke-width="${r * 0.042}"/>`)
  g.push(`<circle cx="0" cy="0" r="${r * 0.9}" fill="none" stroke="${P.stamp}" stroke-width="${r * 0.017}"/>`)
  const inner = r * 0.9
  const chord = (dy) => 2 * Math.sqrt(Math.max(inner * inner - dy * dy, 0)) * 0.86
  const line = (font, str, dyf, szf, spRatio) => {
    const dy = r * dyf
    const size = fitted(font, str, chord(dy + r * szf * 0.5), r * szf, spRatio)
    const t = textPath(font, str, size, { x: 0, y: dy + size * 0.36, spacing: size * spRatio, anchor: 'middle' })
    g.push(`<g fill="${P.stamp}">${t.svg}</g>`)
  }
  const rule = (dyf) => {
    const c = chord(r * dyf) / 2 * 0.8
    g.push(`<line x1="${-c}" y1="${r * dyf}" x2="${c}" y2="${r * dyf}" stroke="${P.stamp}" stroke-width="${r * 0.013}"/>`)
  }
  line(C_BOLD, 'RECORDED', -0.44, 0.155, 0.07)
  rule(-0.295)
  line(C_BOLD, 'KORR', -0.045, 0.315, 0.04)
  rule(0.185)
  line(C_BOLD, 'BUILDING CO', 0.295, 0.105, 0.06)
  line(C_REG, 'MARICOPA CO · AZ', 0.455, 0.082, 0.05)
  return `<g transform="translate(${cx},${cy}) rotate(${rot})">${g.join('')}</g>`
}

const ruling = (w, h, step) => {
  const l = []
  for (let y = step; y < h; y += step) l.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${P.hair}" stroke-opacity="0.30" stroke-width="1"/>`)
  return l.join('')
}
const doc = (w, h, body, ruled = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="${P.paper}"/>${ruled ? ruling(w, h, Math.round(h * 0.045)) : ''}${body}</svg>`

/* ------------------------------------------------------------- the assets -- */
const assets = {}

/* ------------------------------------------------------------- the avatar --
   A profile picture has to survive a circular crop AND stay legible at 32px in
   a favicon or a comment thread. Four lines of stamp text turn to mush there,
   so the avatar is a solid oxblood seal with the wordmark reversed out of it —
   maximum contrast, one thing to read — and the supporting line drops away
   entirely below 128px.                                                      */
function avatarSVG (S, detail) {
  const cx = S / 2, cy = S / 2
  const R = S * 0.5                       // the seal bleeds to the crop edge
  const g = [`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${P.stamp}"/>`]

  // The keyline belongs to the large mark only. At icon size it is noise that
  // steals the room the wordmark needs, so it is dropped and KORR fills the
  // disc almost edge to edge.
  const rot = detail === 'micro' ? -4 : -7
  const inner = []
  if (detail === 'micro') {
    const size = fitted(C_BOLD, 'KORR', S * 0.82, S * 0.40, 0.0)
    inner.push(`<g fill="${P.paper}">${textPath(C_BOLD, 'KORR', size, { x: 0, y: size * 0.355, spacing: 0, anchor: 'middle' }).svg}</g>`)
  } else {
    const ringR = S * 0.425
    g.push(`<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${P.paper}" stroke-opacity="0.85" stroke-width="${S * 0.016}"/>`)
    // Optically centred: the KORR cap-height block and the supporting line
    // straddle the circle's centre, so the seal does not look like it is
    // sliding out of its own crop.
    const size = fitted(C_BOLD, 'KORR', S * 0.62, S * 0.275, 0.03)
    inner.push(`<g fill="${P.paper}">${textPath(C_BOLD, 'KORR', size, { x: 0, y: S * 0.030, spacing: size * 0.03, anchor: 'middle' }).svg}</g>`)
    const w = S * 0.315
    inner.push(`<line x1="${-w / 2}" y1="${S * 0.088}" x2="${w / 2}" y2="${S * 0.088}" stroke="${P.paper}" stroke-opacity="0.9" stroke-width="${S * 0.0085}"/>`)
    const s2 = fitted(C_REG, 'BUILDING CO', S * 0.56, S * 0.074, 0.11)
    inner.push(`<g fill="${P.paper}" fill-opacity="0.92">${textPath(C_REG, 'BUILDING CO', s2, { x: 0, y: S * 0.167, spacing: s2 * 0.11, anchor: 'middle' }).svg}</g>`)
  }
  g.push(`<g transform="translate(${cx},${cy}) rotate(${rot})">${inner.join('')}</g>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${g.join('')}</svg>`
}

// The outline stamp still exists as the document mark, on paper.
assets['korr-mark-stamp'] = (S) => doc(S, S, stampSVG(S / 2, S / 2, S * 0.435, -7))

// 2. Horizontal lockup — stamp + wordmark, for letterheads and signatures.
assets['korr-lockup'] = (W, H) => {
  const r = H * 0.36, cx = H * 0.52
  const wordSize = H * 0.30
  const word = textPath(A_BOLD, 'KORR', wordSize, { x: H * 1.06, y: H * 0.50, spacing: wordSize * 0.10 })
  const subSize = H * 0.098
  const sub = textPath(C_REG, 'BUILDING COMPANY LLC', subSize, { x: H * 1.07, y: H * 0.68, spacing: subSize * 0.16 })
  const tag = textPath(C_REG, 'OWNER-FINANCED LAND · ARIZONA & TEXAS', H * 0.082, { x: H * 1.07, y: H * 0.855, spacing: H * 0.082 * 0.14 })
  return doc(W, H,
    stampSVG(cx, H / 2, r) +
    `<line x1="${H*0.95}" y1="${H*0.20}" x2="${H*0.95}" y2="${H*0.80}" stroke="${P.rule}" stroke-width="${H*0.006}"/>` +
    `<g fill="${P.ink}">${word.svg}</g><g fill="${P.ink3}">${sub.svg}</g><g fill="${P.stamp}">${tag.svg}</g>`)
}

// 3. Facebook / LinkedIn cover.
//    Facebook crops this hard on phones, so everything that must survive lives
//    inside the middle band, and no line is allowed to run under the stamp.
assets['korr-cover-facebook'] = (W, H) => {
  const pad = W * 0.055
  const r = H * 0.27
  const stampCx = W - pad - r
  const textMax = stampCx - r - pad * 1.4      // hard stop before the stamp
  const h1 = fitLine(A_BOLD, 'without a bank.', textMax, H * 0.19, -0.02)
  const l1 = textPath(A_BOLD, 'Land, conveyed', h1, { x: pad, y: H * 0.44, spacing: -h1 * 0.02 })
  const l2 = textPath(A_BOLD, 'without a bank.', h1, { x: pad, y: H * 0.44 + h1 * 0.95, spacing: -h1 * 0.02 })
  const subTxt = 'TONOPAH, AZ  ·  SEMINOLE, TX  ·  480-453-4044'
  const sSize = fitLine(C_BOLD, subTxt, textMax, H * 0.052, 0.14)
  const sub = textPath(C_BOLD, subTxt, sSize, { x: pad, y: H * 0.845, spacing: sSize * 0.14 })
  const capTxt = 'NO CREDIT CHECK  ·  NO QUALIFYING  ·  FROM $29,900'
  const cSize = fitLine(C_BOLD, capTxt, textMax, H * 0.048, 0.16)
  const cap = textPath(C_BOLD, capTxt, cSize, { x: pad, y: H * 0.16, spacing: cSize * 0.16 })
  return doc(W, H,
    `<line x1="${pad}" y1="${H*0.225}" x2="${stampCx - r - pad * 0.5}" y2="${H*0.225}" stroke="${P.ink}" stroke-width="2"/>` +
    `<g fill="${P.ink3}">${cap.svg}</g>` +
    `<g fill="${P.ink}">${l1.svg}</g><g fill="${P.stamp}">${l2.svg}</g>` +
    `<g fill="${P.stamp}">${sub.svg}</g>` +
    stampSVG(stampCx, H * 0.48, r, -7))
}

// 4. Open Graph / link preview.
assets['korr-share'] = (W, H) => {
  const pad = W * 0.065
  const h1 = H * 0.155
  const l1 = textPath(A_BOLD, 'Land, conveyed', h1, { x: pad, y: H * 0.46 })
  const l2 = textPath(A_BOLD, 'without a bank.', h1, { x: pad, y: H * 0.46 + h1 * 0.95 })
  const sSize = H * 0.042
  const sub = textPath(C_REG, '13 INSTRUMENTS  ·  28 LOTS OPEN  ·  FROM $29,900 WITH $425 DOWN', sSize, { x: pad, y: H * 0.80, spacing: sSize * 0.12 })
  const cap = textPath(C_BOLD, 'KORR BUILDING COMPANY LLC', H * 0.042, { x: pad, y: H * 0.14, spacing: H * 0.042 * 0.18 })
  return doc(W, H,
    `<line x1="${pad}" y1="${H*0.195}" x2="${W-pad}" y2="${H*0.195}" stroke="${P.ink}" stroke-width="2"/>` +
    `<g fill="${P.ink3}">${cap.svg}</g>` +
    `<g fill="${P.ink}">${l1.svg}</g><g fill="${P.stamp}">${l2.svg}</g>` +
    `<g fill="${P.ink3}">${sub.svg}</g>` +
    stampSVG(W - pad - H * 0.235, H * 0.44, H * 0.235, -7))
}

// 5. Square post.
assets['korr-square'] = (S) => {
  const pad = S * 0.085
  const h1 = S * 0.105
  const cap = textPath(C_BOLD, 'KORR BUILDING COMPANY LLC', S * 0.030, { x: pad, y: S * 0.115, spacing: S * 0.030 * 0.18 })
  const l1 = textPath(A_BOLD, 'Land,', h1, { x: pad, y: S * 0.60 })
  const l2 = textPath(A_BOLD, 'conveyed', h1, { x: pad, y: S * 0.60 + h1 * 0.95 })
  const l3 = textPath(A_BOLD, 'without a bank.', h1, { x: pad, y: S * 0.60 + h1 * 1.90 })
  const sSize = S * 0.030
  const s1 = textPath(C_REG, 'NO CREDIT CHECK  ·  NO QUALIFYING', sSize, { x: pad, y: S * 0.875, spacing: sSize * 0.14 })
  const s2 = textPath(C_BOLD, 'FROM $29,900 WITH $425 DOWN  ·  480-453-4044', sSize, { x: pad, y: S * 0.925, spacing: sSize * 0.14 })
  return doc(S, S,
    `<line x1="${pad}" y1="${S*0.155}" x2="${S-pad}" y2="${S*0.155}" stroke="${P.ink}" stroke-width="2"/>` +
    `<g fill="${P.ink3}">${cap.svg}</g>` +
    stampSVG(S * 0.62, S * 0.325, S * 0.185, -7) +
    `<g fill="${P.ink}">${l1.svg}${l2.svg}</g><g fill="${P.stamp}">${l3.svg}</g>` +
    `<g fill="${P.ink3}">${s1.svg}</g><g fill="${P.stamp}">${s2.svg}</g>`)
}

/* ----------------------------------------------------------------- render -- */
const jobs = [
  // avatar, every size a platform asks for. Below 128px the supporting line
  // is dropped so the wordmark keeps the whole field.
  ['korr-avatar-1024',      avatarSVG(1024, 'full'), 1024, 1024],
  ['korr-avatar-512',       avatarSVG(512, 'full'), 512, 512],
  ['korr-avatar-256',       avatarSVG(256, 'full'), 256, 256],
  ['korr-avatar-180',       avatarSVG(180, 'full'), 180, 180],
  ['korr-avatar-128',       avatarSVG(128, 'micro'), 128, 128],
  ['korr-avatar-64',        avatarSVG(64, 'micro'), 64, 64],
  ['korr-avatar-32',        avatarSVG(32, 'micro'), 32, 32],
  ['korr-mark-stamp',       assets['korr-mark-stamp'](1024), 1024, 1024],
  ['korr-lockup',           assets['korr-lockup'](2048, 512), 2048, 512],
  ['korr-cover-facebook',   assets['korr-cover-facebook'](1640, 624), 1640, 624],
  ['korr-share',            assets['korr-share'](1200, 630), 1200, 630],
  ['korr-square',           assets['korr-square'](1080), 1080, 1080],
]

console.log('KORR BRAND ASSETS  ->  ' + OUT)
console.log('-'.repeat(58))
for (const [name, svg, w, h] of jobs) {
  fs.writeFileSync(path.join(OUT, name + '.svg'), svg)
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, name + '.png'))
  const kb = fs.statSync(path.join(OUT, name + '.png')).size / 1024
  console.log(`  ${(name + '.png').padEnd(28)} ${String(w).padStart(4)}x${String(h).padEnd(4)}  ${kb.toFixed(0)} KB   (+ .svg)`)
}
console.log('-'.repeat(58))
console.log('type converted to outlines — no font install needed anywhere')
