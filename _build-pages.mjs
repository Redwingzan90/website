// Builds one plain HTML page per published property under land/, plus a
// land/index.html hub and land/sitemap.xml, so search engines can find each
// property by itself (the main page draws its listings with JavaScript).
//
//   node _build-data.mjs && node _build-pages.mjs && node _verify-data.mjs
//
// Facts come only from assets/data.js (generated from data.snapshot.json).
// On purpose these pages leave out: loan terms (some advertised terms are not
// reachable at the advertised payment), parcel numbers (several still need
// checking), survey images, build/permit claims and the FAQ. The main page
// still carries the full listing; every page links back to it.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const SITE = 'https://korrbuildingcollc.netlify.app'
const OUT = 'land'
const TODAY = new Date().toISOString().slice(0, 10)

const ctx = { window: {} }
vm.runInNewContext(fs.readFileSync('assets/data.js', 'utf8'), ctx)
const D = ctx.window.KORR_DATA
const props = D.properties.filter(p => !p.isHouse && p.location === 'tonopah')

const AZ = (D.contacts && D.contacts.byRegion && D.contacts.byRegion.tonopah) ||
  { phone: D.phone, href: D.phoneHref }
const MAIN = { phone: D.phone, href: D.phoneHref }

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const money = (s) => parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0
const isBlank = (v) => !v || /^\s*(tbd|n\/a|-|—)\s*$/i.test(String(v))

const slug = (p) => {
  const name = String(p.title).split('—')[1] || ''
  const s = name.toLowerCase().replace(/&/g, 'and').replace(/\+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `property-${p.id}${s && !/^parcel/.test(s) ? '-' + s : ''}`
}
const place = (p) => (String(p.title).split('—')[1] || '').trim()
const open = (p) => (p.lots || []).filter(l => l.status === 'available')
const isCash = (p) => /cash/i.test(p.downPayment)

// Highlights the page may repeat. Terms, build claims and anything already
// shown as a fact row are dropped.
const SAFE_HL = (h) => /acre/i.test(h) || !/term|build|permit|year|month|down|\$|interest|lots? available|parcels? available|lot available|available/i.test(h)

function photos (p) {
  return (p.images || []).filter(i => !/survey/i.test(i)).slice(0, 6)
}
const w640 = (i) => /\.(webp|png|jpe?g)$/i.test(i) ? i : i + '-640.webp'
const w1280 = (i) => /\.(webp|png|jpe?g)$/i.test(i) ? i : i + '-1280.webp'

function offerLine (p) {
  if (isCash(p)) return `${p.price} cash`
  return `${p.price}, ${p.downPayment} down and ${String(p.monthly).replace('/mo', '')} a month`
}

function headline (p) {
  const n = open(p).length
  const lots = n === 1 ? '1 lot' : `${n} lots`
  return isCash(p)
    ? `${lots} for sale near Tonopah, AZ — ${p.price} cash`
    : `${lots} for sale near Tonopah, AZ — ${p.downPayment} down, owner financed`
}

const CSS = `
:root{--paper:#e9e7e1;--lift:#f3f1ec;--ink:#14140f;--ink2:#3a372f;--ink3:#66614f;--rule:#b3ad9e;--stamp:#8c2f28;--green:#2f5d4a}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--stamp)}main,header,footer{max-width:46rem;margin:0 auto;padding:0 1.25rem}
header{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-top:1rem;padding-bottom:1rem;border-bottom:1px solid var(--rule)}
.mark{font-weight:800;letter-spacing:.04em;color:var(--ink);text-decoration:none}.mark span{font-weight:400;margin-left:.35rem}
h1{font-size:clamp(1.6rem,5vw,2.3rem);line-height:1.15;margin:1.6rem 0 .5rem}
h2{font-size:1.2rem;margin:2rem 0 .6rem}
.sub{color:var(--ink2);margin:0 0 1.2rem}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.6rem;margin:0;padding:0}
.facts div{background:var(--lift);border:1px solid var(--rule);border-radius:6px;padding:.7rem .8rem}
.facts dt{font-size:.8rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em}
.facts dd{margin:.15rem 0 0;font-size:1.25rem;font-weight:700}
.btns{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.4rem 0}
.btn{display:inline-block;padding:.85rem 1.2rem;border-radius:6px;background:var(--stamp);color:#fff;text-decoration:none;font-weight:700;min-height:44px}
.btn.alt{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}
.lots{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.4rem}
.lots li{padding:.3rem .65rem;border-radius:999px;border:1px solid var(--rule);background:var(--lift);font-size:.95rem}
.lots .sold{color:var(--ink3);text-decoration:line-through}
.lots .open{border-color:var(--green);color:var(--green);font-weight:700}
ol.dir{padding-left:1.3rem}ol.dir li{margin:.3rem 0}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:.5rem}
.gal img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:6px;background:var(--lift);display:block}
ul.hl{padding-left:1.2rem}
.cards{list-style:none;padding:0;margin:0;display:grid;gap:.7rem}
.cards a{display:block;background:var(--lift);border:1px solid var(--rule);border-radius:8px;padding:.9rem 1rem;color:var(--ink);text-decoration:none}
.cards b{display:block;font-size:1.08rem}.cards span{color:var(--ink2)}
.note{color:var(--ink3);font-size:.9rem}
footer{border-top:1px solid var(--rule);margin-top:3rem;padding-top:1rem;padding-bottom:2rem;color:var(--ink2);font-size:.92rem}
`

function shell ({ title, desc, canonical, body, ld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#e9e7e1">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/images/brand/korr-share.png">
<meta property="og:site_name" content="KORR Building Company">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${CSS.trim()}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<header>
  <a class="mark" href="/"><b>KORR</b><span>Building Company</span></a>
  <a href="${esc(MAIN.href)}">${esc(MAIN.phone)}</a>
</header>
<main>
${body}
</main>
<footer>
  <p><b>KORR Building Company LLC</b> · Owner-financed land near Tonopah, Arizona. The seller carries the note.</p>
  <p>Closings through NBTS · Prices and lot availability subject to change without notice · <a href="/privacy.html">Privacy policy</a></p>
</footer>
</body>
</html>
`
}

const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
})

function propertyPage (p) {
  const url = `${SITE}/${OUT}/${slug(p)}.html`
  const avail = open(p)
  const title = `${headline(p)} | KORR`
  const desc = isCash(p)
    ? `${place(p)}, Tonopah, Arizona: ${avail.length} of ${p.lots.length} lots still available for ${p.price} cash. Photos, lot list and driving directions from I-10. Sold directly by the owner.`
    : `${place(p)}, Tonopah, Arizona: ${p.price} with ${p.downPayment} down and ${String(p.monthly).replace('/mo', '')} a month. No credit check, no qualifying, owner financed. ${avail.length} of ${p.lots.length} lots available. Photos and directions from I-10.`

  const facts = [
    ['Price', p.price],
    isCash(p) ? ['Terms', 'Cash'] : ['Down', p.downPayment],
    isCash(p) ? null : ['Monthly', p.monthly],
    !isCash(p) && !isBlank(p.interestRate) ? ['Interest', p.interestRate] : null,
    ['Lots available', `${avail.length} of ${p.lots.length}`],
  ].filter(Boolean).filter(([, v]) => !isBlank(v))

  const lots = p.lots.map(l => {
    const lp = l.price && l.price !== p.price ? ` · ${l.price}` : ''
    return l.status === 'available'
      ? `<li class="open">Lot ${esc(l.id)} — available${esc(lp)}</li>`
      : `<li class="sold">Lot ${esc(l.id)} — sold</li>`
  }).join('')

  const hl = (p.highlights || []).filter(SAFE_HL)
  if (p.deedRestrictions) hl.push('Deed restrictions apply. Ask us for a copy before you buy.')
  const imgs = photos(p)
  const gallery = imgs.length
    ? `<h2>Photos</h2><div class="gal">${imgs.map((i, n) =>
        `<a href="/${esc(w1280(i))}"><img src="/${esc(w640(i))}" alt="${esc(place(p))}, Tonopah AZ — photo ${n + 1}" loading="${n < 2 ? 'eager' : 'lazy'}" width="640" height="480"></a>`).join('')}</div>`
    : `<p class="note">No photographs of this property are posted yet. Call and we will send a pin drop so you can drive out and see it.</p>`

  const dirs = (p.directions || []).length
    ? `<h2>How to get there</h2><ol class="dir">${p.directions.map(d => `<li>${esc(d)}</li>`).join('')}</ol>`
    : ''

  const others = props.filter(o => o.id !== p.id && open(o).length)
    .map(o => `<li><a href="/${OUT}/${slug(o)}.html"><b>${esc(place(o))}</b><span>${esc(offerLine(o))} · ${open(o).length} available</span></a></li>`).join('')

  const body = `
<h1>${esc(place(p))} — land for sale near Tonopah, AZ</h1>
<p class="sub">${esc(offerLine(p))}.${isCash(p) ? '' : ' No credit check, no qualifying. We carry the note ourselves.'}</p>
<dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
<div class="btns">
  <a class="btn" href="${esc(AZ.href)}">Call ${esc(AZ.phone)}</a>
  <a class="btn alt" href="/#property-${p.id}">Full listing &amp; inquiry form</a>
</div>
<h2>Lots</h2>
<ul class="lots">${lots}</ul>
${hl.length ? `<h2>Good to know</h2><ul class="hl">${hl.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${gallery}
${dirs}
<p class="note">Call ${esc(AZ.phone)} for a pin drop or to set up a time to see the land in person. Parcel numbers and full terms are on the <a href="/#property-${p.id}">full listing</a>.</p>
${others ? `<h2>Other land near Tonopah</h2><ul class="cards">${others}</ul>` : ''}
<p><a href="/${OUT}/">All land for sale</a></p>`

  const offer = {
    '@type': 'Offer', price: money(p.price), priceCurrency: 'USD',
    availability: avail.length ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    url, seller: { '@type': 'Organization', name: 'KORR Building Company LLC', telephone: '+1-' + AZ.phone.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') },
  }
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'RealEstateListing',
      name: `${place(p)} — land for sale near Tonopah, AZ`, description: desc, url,
      datePosted: TODAY,
      image: imgs.slice(0, 3).map(i => `${SITE}/${w1280(i)}`),
      contentLocation: { '@type': 'Place', name: 'Tonopah, Arizona',
        address: { '@type': 'PostalAddress', addressLocality: 'Tonopah', addressRegion: 'AZ', addressCountry: 'US' } },
      offers: offer,
    },
    crumbs([['Home', SITE + '/'], ['Land for sale', `${SITE}/${OUT}/`], [place(p), url]]),
  ]
  return { file: `${slug(p)}.html`, url, html: shell({ title, desc, canonical: url, body, ld }) }
}

function hubPage () {
  const url = `${SITE}/${OUT}/`
  const live = props.filter(p => open(p).length)
  const low = Math.min(...live.filter(p => !isCash(p)).map(p => money(p.price)))
  const lowDown = Math.min(...live.filter(p => !isCash(p)).map(p => money(p.downPayment)))
  const fmt = (n) => '$' + n.toLocaleString('en-US')
  const nOpen = live.reduce((a, p) => a + open(p).length, 0)
  const title = `Owner-financed land for sale in Tonopah, AZ — from ${fmt(lowDown)} down | KORR`
  const desc = `${nOpen} lots for sale near Tonopah, Arizona, west of Phoenix off I-10. Owner financing from ${fmt(low)} with ${fmt(lowDown)} down. No credit check, no qualifying. Photos and directions for every property.`
  const cards = live.map(p => `<li><a href="/${OUT}/${slug(p)}.html"><b>${esc(place(p))}</b><span>${esc(offerLine(p))} · ${open(p).length} of ${p.lots.length} lots available</span></a></li>`).join('')
  const body = `
<h1>Owner-financed land for sale near Tonopah, Arizona</h1>
<p class="sub">Every property we are selling right now, with its price and payments. No credit check and no qualifying: we carry the note ourselves, so you deal with us from the first call through closing.</p>
<div class="btns"><a class="btn" href="${esc(AZ.href)}">Call ${esc(AZ.phone)}</a><a class="btn alt" href="/#inquiry">Send an inquiry</a></div>
<h2>${nOpen} lots available</h2>
<ul class="cards">${cards}</ul>
<p class="note">Lots are in Maricopa County, west of Phoenix off the I-10. Prices and lot availability change as lots sell; the <a href="/">main listing</a> is always current.</p>`
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Land for sale near Tonopah, AZ',
      itemListElement: live.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${OUT}/${slug(p)}.html`, name: place(p) })),
    },
    crumbs([['Home', SITE + '/'], ['Land for sale', url]]),
  ]
  return { file: 'index.html', url, html: shell({ title, desc, canonical: url, body, ld }) }
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const pages = [hubPage(), ...props.filter(p => open(p).length).map(propertyPage)]
for (const pg of pages) fs.writeFileSync(path.join(OUT, pg.file), pg.html)
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(pg => `  <url>\n    <loc>${pg.url}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`).join('\n') +
  `\n</urlset>\n`)
console.log(`wrote ${pages.length} pages to ${OUT}/`)
