/* KORR Building Co — the abstract, made navigable. */
(function () {
  'use strict'

  // The data file is the one hard dependency. If it fails to load, the page
  // must still be a usable way to reach a human — never a blank schedule with
  // a dead form.
  const RAW = window.KORR_DATA
  const OK = !!(RAW && Array.isArray(RAW.properties) && RAW.properties.length)
  const D = Object.assign({
    phone: '480-453-4044',
    phoneHref: 'tel:4804534044',
    email: 'Charlielandandhomes2@gmail.com',
    properties: [], faqs: [], locations: [], contacts: null,
  }, RAW || {})
  if (!Array.isArray(D.properties)) D.properties = []
  if (!Array.isArray(D.faqs)) D.faqs = []
  if (!Array.isArray(D.locations)) D.locations = []

  const $ = (s, r) => (r || document).querySelector(s)
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)]
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)')

  /* ---------------------------------------------------------------- icons --
     Drawn, one stroke weight. No glyphs standing in for an icon system.      */
  const ICON = {
    phone: '<path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 3 5a1 1 0 0 1 1-1Z"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    noimg: '<path d="M3 5h18v14H3z"/><path d="M3 16l5-5 4 4 3-3 6 6"/><path d="M4 4l16 16"/>',
    seal: '<circle cx="12" cy="10" r="6.5"/><path d="M9 16.5L8 22l4-2 4 2-1-5.5"/>',
  }
  const ico = (n, cls) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${ICON[n]}</svg>`

  /* --------------------------------------------------------------- helpers */
  const w640 = (i) => /\.(webp|png|jpe?g)$/i.test(i) ? i : i + '-640.webp'
  const w1280 = (i) => /\.(webp|png|jpe?g)$/i.test(i) ? i : i + '-1280.webp'
  const num = (s) => parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0
  const openLots = (p) => p.isHouse ? 1 : (p.lots || []).filter(l => l.status === 'available').length
  const totalLots = (p) => p.isHouse ? 1 : (p.lots || []).length

  function status (p) {
    const o = openLots(p), t = totalLots(p)
    if (p.isHouse) return { cls: 'open', text: 'For Sale' }
    if (o === 0) return { cls: 'closed', text: 'Conveyed' }
    if (o === t) return { cls: 'open', text: o + (o === 1 ? ' lot open' : ' lots open') }
    return { cls: 'part', text: o + ' of ' + t + ' open' }
  }

  /* ------------------------------------------------------------- the state */
  let filter = 'all'
  let sort = null

  function visible () {
    let list = filter === 'all' ? D.properties.slice() : D.properties.filter(p => p.location === filter)
    if (sort) list.sort((a, b) => sort === 'asc' ? num(a.price) - num(b.price) : num(b.price) - num(a.price))
    return list
  }

  /* ------------------------------------------------- the schedule of instruments */
  // Plates tipped in between groups of instruments — the emotional payoff
  // against the dry document ground.
  const PLATES = [
    { after: 3, img: 'images/properties/339th-salome/20260207_154639', cap: 'Exhibit A', note: '339th &amp; Lower Buckeye — 11-year term' },
    { after: 7, img: 'images/properties/property5/20260502_165038', cap: 'Exhibit B', note: '411th &amp; Camelback' },
  ]

  function instrumentHTML (p, i) {
    const st = status(p)
    const imgs = p.images || []
    const parcel = p.parcel ? 'Parcel ' + esc(p.parcel) : (p.isHouse ? esc(p.propertyType || 'Single family') : 'Parcel on file')
    const plates = imgs.length
      ? imgs.slice(0, 2).map(im =>
          `<img src="${esc(w640(im))}" alt="" loading="lazy" decoding="async" width="220" height="165">`).join('') +
        (imgs.length > 2 ? `<span class="plate-more">+${imgs.length - 2}</span>` : '')
      : `<span class="no-plate">${ico('noimg')}<span>Plate to follow</span></span>`

    const lotStrip = p.isHouse
      ? ''
      : `<span class="lots" aria-hidden="true">${(p.lots || []).map(l =>
          `<span class="lot ${l.status === 'available' ? 'open' : 'gone'}">${esc(l.id)}</span>`).join('')}</span>`

    const meta = p.isHouse
      ? [p.bedrooms, p.bathrooms, p.sqft, p.acres].filter(Boolean)
      : [p.locationLabel, parcel, p.loanTerm ? 'Term ' + p.loanTerm : null, p.interestRate ? p.interestRate + ' interest' : null].filter(Boolean)

    const terms =
        p.downPayment === 'Cash' ? 'Cash sale'
      : isPlaceholder(p.monthly) && !isPlaceholder(p.downPayment)
          ? esc(p.downPayment) + ' down · call for terms'
      : isPlaceholder(p.downPayment) ? esc(p.monthly)
      : esc(p.downPayment) + ' down · ' + esc(p.monthly)

    // The accessible name must carry what the schedule is FOR — price, terms
    // and status. A bare title leaves a screen-reader user with 13 near-identical
    // rows and none of the information they came for.
    const label = [
      p.title, p.price,
      p.downPayment === 'Cash' ? 'cash sale'
        : isPlaceholder(p.monthly) ? `${p.downPayment} down, call for terms`
        : `${p.downPayment} down, ${p.monthly}`,
      st.text,
    ].filter(Boolean).join(', ')

    return `
    <button class="inst" type="button" data-id="${p.id}" data-reveal
        aria-label="${esc(label)}">
      <span class="inst-no">No.<b>${String(i + 1).padStart(2, '0')}</b></span>
      <span class="inst-main">
        <span class="inst-title">${esc(p.title)}</span>
        <span class="inst-meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</span>
        ${lotStrip}
      </span>
      <span class="inst-plates">${plates}</span>
      <span class="inst-terms">
        <span class="inst-price">${esc(p.price)}</span>
        <span class="inst-sub">${terms}</span>
        <span class="mark-status ${st.cls}">${esc(st.text)}</span>
      </span>
    </button>`
  }

  function renderSchedule () {
    const list = visible()
    const host = $('#schedule')
    let html = ''
    list.forEach((p, i) => {
      html += instrumentHTML(p, i)
      const plate = PLATES.find(pl => pl.after === i + 1)
      if (plate && filter === 'all' && !sort) {
        html += `<figure class="exhibit" data-reveal>
          <img src="${esc(w1280(plate.img))}" alt="Desert parcel near Tonopah, Arizona" loading="lazy" decoding="async" width="1280" height="720">
          <figcaption><b>${plate.cap}</b> — ${plate.note}</figcaption>
        </figure>`
      }
    })
    if (!list.length) {
      html = OK
        ? `<p class="typed" style="padding:2rem .5rem">No instruments match this filter.</p>`
        : `<div style="padding:2.5rem .5rem;border-bottom:1px solid var(--rule)">
             <p class="h3">The schedule could not be loaded.</p>
             <p class="prose" style="margin-top:.6rem">
               Call <a href="${esc(D.phoneHref)}">${esc(D.phone)}</a> and we will go through
               every available parcel, its price and its terms with you directly.
             </p>
           </div>`
    }
    host.innerHTML = html
    $('#schedCount').textContent = list.length + (list.length === 1 ? ' instrument' : ' instruments')
    $$('.inst', host).forEach(b => b.addEventListener('click', () => openSheet(+b.dataset.id, b)))
    if (window.KORR_MOTION) window.KORR_MOTION.bind(host)
  }

  /* ------------------------------------------------------- the instrument sheet */
  const sheet = $('#sheet')
  const sheetBody = $('#sheetBody')
  let lastFocus = null
  let gal = { imgs: [], i: 0 }

  // A placeholder is not a term. Omit the row rather than publish "TBD".
  const isPlaceholder = (v) => !v || /^\s*(tbd|n\/a|-|—)\s*$/i.test(String(v))

  function termRow (dt, dd, cls) {
    if (isPlaceholder(dd)) return ''
    return `<div class="term"><dt>${esc(dt)}</dt><dd class="${cls || ''}">${esc(dd)}</dd></div>`
  }

  function openSheet (id, trigger) {
    const p = D.properties.find(x => x.id === id)
    if (!p) return
    // Remember the row itself, not whatever happened to be focused.
    lastFocus = trigger || document.activeElement
    const st = status(p)
    const imgs = p.images || []
    gal = { imgs, i: 0 }
    // The live site routes AZ and TX enquiries to different lines. Keep that.
    const region = (D.contacts && D.contacts.byRegion && D.contacts.byRegion[p.location]) ||
                   { label: 'Main office', phone: D.phone, href: D.phoneHref }

    const galHTML = imgs.length
      ? `<div class="gal">
           <img id="galImg" src="${esc(w1280(imgs[0]))}" alt="${esc(p.title)} — photograph 1 of ${imgs.length}">
           ${imgs.length > 1 ? `<div class="gal-nav">
             <button type="button" id="galPrev" aria-label="Previous photograph">${ico('left')}</button>
             <span class="gal-count" id="galCount">1 / ${imgs.length}</span>
             <button type="button" id="galNext" aria-label="Next photograph">${ico('right')}</button>
           </div>` : ''}
         </div>`
      : `<div class="no-plate" style="aspect-ratio:3/2">${ico('noimg')}
           <span>No photograph of record</span>
           <span style="text-transform:none;letter-spacing:0;font-size:.66rem;max-width:26ch;line-height:1.5">
             Call ${esc(D.phone)} for a pin drop or to walk the parcel.</span>
         </div>`

    const platHTML = p.isHouse ? '' : `
      <div class="plat">
        <h3 class="caption">Lots of record</h3>
        <div class="plat-grid">${(p.lots || []).map(l => `
          <div class="plat-lot ${l.status === 'available' ? 'open' : 'gone'}">
            ${esc(l.id)}<small>${l.status === 'available' ? 'OPEN' : 'CONVEYED'}</small>
          </div>`).join('')}</div>
        ${(p.lots || []).some(l => l.price || l.terms) ? `<ul class="list-doc">${(p.lots || [])
          .filter(l => l.price || l.terms)
          .map(l => `<li>${ico('check')}<span>Lot ${esc(l.id)} — ${esc(l.price || '')}${l.terms ? ' · ' + esc(l.terms) : ''}</span></li>`)
          .join('')}</ul>` : ''}
      </div>`

    sheetBody.innerHTML = `
      <p class="caption">${esc(p.locationLabel)}${p.parcel ? ' · Parcel ' + esc(p.parcel) : ''}</p>
      <h2 class="h2" id="sheetTitle" style="margin-top:.6rem">${esc(p.title)}</h2>
      <p class="typed" style="margin-top:.8rem;color:var(--ink-3)">
        ${esc(st.text.toUpperCase())}${p.address ? ' · ' + esc(p.address) : ''}</p>

      <div class="sheet-grid" style="margin-top:2.2rem">
        <div>
          ${galHTML}
          ${p.highlights && p.highlights.length ? `
            <h3 class="caption" style="margin-top:2.2rem">Of note</h3>
            <ul class="list-doc">${p.highlights.map(h => `<li>${ico('check')}<span>${esc(h)}</span></li>`).join('')}</ul>` : ''}
          ${p.directions && p.directions.length ? `
            <h3 class="caption" style="margin-top:2.2rem">How to reach it</h3>
            <ol class="route">${p.directions.map(d => `<li><span>${esc(d)}</span></li>`).join('')}</ol>` : ''}
          ${p.deedRestrictions ? `<p class="typed" style="margin-top:1.5rem;color:var(--ink-3)">
            Deed restrictions apply to this property. Ask for the recorded copy before you commit.</p>` : ''}
        </div>

        <div>
          <h3 class="caption">Terms of sale</h3>
          <dl class="terms" style="margin-top:.8rem">
            ${termRow('Price', p.price, 'big')}
            ${termRow('Down payment', p.downPayment, 'accent')}
            ${termRow('Monthly', p.monthly)}
            ${termRow('Interest', p.interestRate)}
            ${termRow('Term', p.loanTerm)}
            ${p.isHouse ? termRow('Bedrooms', p.bedrooms) + termRow('Bathrooms', p.bathrooms) +
                          termRow('Floor area', p.sqft) + termRow('Lot', p.acres) +
                          termRow('Built', p.year) + termRow('HOA', p.hoa) : ''}
            ${termRow('Parcel', p.parcel)}
          </dl>
          <p class="typed" style="margin-top:1rem;color:var(--ink-3)">
            No pre-payment penalty. No credit check. No qualifying.</p>
          ${platHTML}
          <div style="margin-top:2rem;display:flex;flex-wrap:wrap;gap:.7rem">
            <a class="btn" href="${esc(region.href)}">${ico('phone')}Call ${esc(region.phone)}</a>
            <button class="btn btn-ghost" type="button" data-ask="${esc(p.title)}">${ico('arrow')}Ask about this</button>
          </div>
          <p class="typed" style="margin-top:.7rem;color:var(--ink-3)">
            ${esc(region.label)} line. Main office ${esc(D.phone)}.</p>
        </div>
      </div>`

    if (imgs.length > 1) {
      const step = (d) => {
        gal.i = (gal.i + d + gal.imgs.length) % gal.imgs.length
        $('#galImg').src = w1280(gal.imgs[gal.i])
        $('#galImg').alt = p.title + ' — photograph ' + (gal.i + 1) + ' of ' + gal.imgs.length
        $('#galCount').textContent = (gal.i + 1) + ' / ' + gal.imgs.length
      }
      $('#galPrev').addEventListener('click', () => step(-1))
      $('#galNext').addEventListener('click', () => step(1))
    }
    const ask = $('[data-ask]', sheetBody)
    if (ask) ask.addEventListener('click', () => { closeSheet(); jumpToForm(p.title) })

    sheet.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    if (window.KORR_LENIS) window.KORR_LENIS.stop()
    sheet.scrollTop = 0
    // Two things fight this focus call: visibility (handled in CSS — it now
    // flips instantly on open) and the click's own default action, which
    // focuses the clicked row AFTER this handler returns. A task boundary wins
    // both. setTimeout, not rAF: rAF never fires in a backgrounded tab.
    void sheet.offsetHeight
    // The browser's own click-focus lands on the row after this handler and
    // takes focus back, so assert twice and let the later one win the race.
    const takeFocus = () => {
      if (sheet.getAttribute('aria-hidden') !== 'false') return
      if (sheet.contains(document.activeElement)) return
      $('#sheetClose').focus()
    }
    takeFocus()
    setTimeout(takeFocus, 0)
    setTimeout(takeFocus, 80)
    document.addEventListener('keydown', onSheetKey)
  }

  function closeSheet () {
    sheet.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
    if (window.KORR_LENIS) window.KORR_LENIS.start()
    document.removeEventListener('keydown', onSheetKey)
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus()
  }

  function onSheetKey (e) {
    if (e.key === 'Escape') { closeSheet(); return }
    if (e.key !== 'Tab') return
    const f = $$('a[href],button:not([disabled]),input,select,textarea', sheet)
      .filter(el => el.offsetParent !== null)
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  /* --------------------------------------------------------------- the form */
  function jumpToForm (title) {
    const sel = $('#fProperty')
    if (sel && title) sel.value = title
    const t = $('#inquiry')
    if (window.KORR_LENIS) window.KORR_LENIS.scrollTo(t, { offset: -60 })
    else t.scrollIntoView({ behavior: REDUCE.matches ? 'auto' : 'smooth' })
    setTimeout(() => $('#fName').focus(), REDUCE.matches ? 0 : 700)
  }

  function initForm () {
    const sel = $('#fProperty')
    sel.innerHTML = '<option value="">Any property / not sure yet</option>' +
      D.properties.map(p => `<option value="${esc(p.title)}">${esc(p.title)} — ${esc(p.price)}</option>`).join('')

    const form = $('#form')
    const msg = $('#formMsg')
    const btn = $('#formSubmit')

    const fail = (text, focus) => {
      msg.className = 'form-msg'
      msg.textContent = text
      msg.hidden = false
      if (focus) focus.focus()
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (form._honey && form._honey.value) return          // bot

      // An enquiry with no way to reach the buyer is not an enquiry. The form
      // carries `novalidate` for custom messaging, so it is checked here.
      const name = $('#fName').value.trim()
      const phone = $('#fPhone').value.trim()
      if (!name) return fail('Please add your name so we know who we are calling.', $('#fName'))
      if (phone.replace(/[^0-9]/g, '').length < 10) {
        return fail('Please add a phone number we can reach you on — 10 digits.', $('#fPhone'))
      }
      const email = $('#fEmail').value.trim()
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return fail('That email address does not look right. Leave it blank if you prefer.', $('#fEmail'))
      }

      msg.textContent = ''
      msg.className = 'form-msg'
      msg.hidden = true
      btn.disabled = true
      btn.textContent = 'Sending…'
      try {
        const res = await fetch('https://formsubmit.co/ajax/' + D.email, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            email,
            property: sel.value,
            message: $('#fMsg').value,
            _subject: 'KORR site enquiry — ' + (sel.value || 'general'),
          }),
        })
        if (!res.ok) throw new Error('status ' + res.status)
        form.reset()
        msg.className = 'form-msg ok'
        msg.textContent = 'Received. We will call you back on the number you gave. For anything urgent, ring ' + D.phone + '.'
        msg.hidden = false
      } catch (err) {
        msg.className = 'form-msg'
        msg.innerHTML = 'That did not send. Please call <a href="' + esc(D.phoneHref) + '">' + esc(D.phone) +
          '</a> or email <a href="mailto:' + esc(D.email) + '">' + esc(D.email) + '</a>.'
        msg.hidden = false
      } finally {
        btn.disabled = false
        btn.textContent = 'Send enquiry'
      }
    })
  }

  /* ---------------------------------------------------------------- the FAQ */
  function initFaq () {
    $('#faq').innerHTML = D.faqs.map((f, i) => `
      <details${i === 0 ? ' open' : ''}>
        <summary>${esc(f.q)}</summary>
        <div class="ans"><p>${esc(f.a)}</p></div>
      </details>`).join('')
  }

  /* ------------------------------------------------------------- the controls */
  function initControls () {
    const tabs = $('#tabs')
    tabs.innerHTML = D.locations.map(l =>
      `<button class="chip${l.key === 'all' ? ' on' : ''}" data-key="${esc(l.key)}" aria-pressed="${l.key === 'all'}">${esc(l.label)}</button>`
    ).join('')
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return
      filter = b.dataset.key
      $$('.chip', tabs).forEach(c => {
        const on = c.dataset.key === filter
        c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on))
      })
      renderSchedule()
    })
    $$('#sortRow .chip').forEach(b => {
      b.addEventListener('click', () => {
        sort = sort === b.dataset.sort ? null : b.dataset.sort
        $$('#sortRow .chip').forEach(c => {
          const on = c.dataset.sort === sort
          c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on))
        })
        renderSchedule()
      })
    })
  }

  /* ------------------------------------------------------------ the summary */
  function initSummary () {
    // Land lots and houses are different things and are counted separately —
    // rolling a house into the "lots of record" figure misstates the inventory.
    let open = 0, lots = 0, houses = 0, low = Infinity
    D.properties.forEach(p => {
      if (p.isHouse) { houses++; return }
      lots += (p.lots || []).length
      open += (p.lots || []).filter(l => l.status === 'available').length
      const n = num(p.price); if (n) low = Math.min(low, n)
    })
    $('#sumInstruments').textContent = D.properties.length
    $('#sumLots').textContent = lots
    $('#sumOpen').textContent = open
    $('#sumHouses').textContent = houses
    $('#sumLow').textContent = isFinite(low) ? '$' + low.toLocaleString('en-US') : '—'
  }

  /* -------------------------------------------------- the standing call bar */
  /* Shows once the visitor is past the certificate, and re-labels itself to the
     right regional line while they are reading Arizona or Texas listings. */
  function initCallbar () {
    const bar = $('#callbar')
    if (!bar) return
    const cert = $('#certificate')
    const label = $('#callbarLabel'), numEl = $('#callbarNum'), link = $('#callbarLink')

    const setLine = (key) => {
      const r = (D.contacts && D.contacts.byRegion && D.contacts.byRegion[key]) ||
                { label: 'Main office', phone: D.phone, href: D.phoneHref }
      if (numEl.textContent === r.phone) return
      label.textContent = r.label
      numEl.textContent = r.phone
      link.setAttribute('href', r.href)
    }

    // Scroll-driven rather than IntersectionObserver: this has to be reliable,
    // and IO is throttled or suppressed in enough contexts to be a poor primary.
    const update = () => {
      const past = (cert.getBoundingClientRect().bottom || 0) < 8
      const next = past ? '1' : '0'
      if (bar.dataset.show !== next) bar.dataset.show = next
    }
    // Lenis scrolls the document natively, so window 'scroll' fires normally.
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    // motion.js initialises Lenis after this file; hook it once it exists for
    // per-frame accuracy during a smooth scroll.
    window.addEventListener('load', () => {
      if (window.KORR_LENIS) window.KORR_LENIS.on('scroll', update)
      update()
    })
    update()

    // follow the filter: looking at Texas houses should offer the Texas line
    $('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('.chip')
      if (b) setLine(b.dataset.key)
    })
    // and hide it whenever a full-screen layer owns the view
    const layers = [$('#sheet'), $('#mobile')]
    const sync = () => {
      const open = layers.some(l => l && (l.getAttribute('aria-hidden') === 'false' || l.dataset.open === '1'))
      bar.style.visibility = open ? 'hidden' : ''
    }
    layers.forEach(l => l && new MutationObserver(sync)
      .observe(l, { attributes: true, attributeFilter: ['aria-hidden', 'data-open'] }))
  }

  /* ------------------------------------------------------------------ boot */
  function init () {
    // static chrome
    $$('[data-ico]').forEach(el => { el.innerHTML = ico(el.dataset.ico) + el.innerHTML })
    $$('[data-phone]').forEach(el => { el.textContent = D.phone })
    $$('[data-phone-href]').forEach(el => { el.setAttribute('href', D.phoneHref) })

    // the team — every line from the live site stays reachable
    const team = $('#teamList')
    if (team && D.contacts && D.contacts.team) {
      team.innerHTML = D.contacts.team.map(m =>
        `<div style="display:flex;justify-content:space-between;gap:1rem;padding:.2rem 0">
           <span>${esc(m.name)}${m.role ? ' <span style="opacity:.6">(' + esc(m.role) + ')</span>' : ''}</span>
           <a href="${esc(m.href)}">${esc(m.phone)}</a>
         </div>`).join('')
    }

    initSummary()
    initControls()
    renderSchedule()
    initFaq()
    initForm()

    $('#sheetClose').addEventListener('click', closeSheet)

    // mobile menu
    const mob = $('#mobile')
    const burger = $('#burger')
    const onMobKey = (e) => {
      if (e.key === 'Escape') { setMob(false); return }
      if (e.key !== 'Tab') return
      const f = $$('a[href],button:not([disabled])', mob).filter(el => el.offsetParent !== null)
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    const setMob = (v) => {
      mob.dataset.open = v ? '1' : '0'
      burger.setAttribute('aria-expanded', String(v))
      document.body.style.overflow = v ? 'hidden' : ''
      if (window.KORR_LENIS) v ? window.KORR_LENIS.stop() : window.KORR_LENIS.start()
      if (v) {
        void mob.offsetHeight          // visibility is instant on open now
        $('#mobClose').focus()
        document.addEventListener('keydown', onMobKey)
      } else {
        document.removeEventListener('keydown', onMobKey)
        burger.focus()
      }
    }
    burger.setAttribute('aria-expanded', 'false')
    burger.setAttribute('aria-controls', 'mobile')
    burger.addEventListener('click', () => setMob(true))
    $('#mobClose').addEventListener('click', () => setMob(false))
    $$('#mobile a').forEach(a => a.addEventListener('click', () => setMob(false)))

    // in-page anchors go through Lenis so nothing desyncs
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href')
        if (id.length < 2) return
        const t = document.querySelector(id)
        if (!t) return
        e.preventDefault()
        if (window.KORR_LENIS) window.KORR_LENIS.scrollTo(t, { offset: -60 })
        else t.scrollIntoView({ behavior: REDUCE.matches ? 'auto' : 'smooth' })
        // preventDefault also discards the browser's focus reset, so the skip
        // link would scroll but leave focus in the header it was meant to skip.
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1')
        t.focus({ preventScroll: true })
      })
    })

    initCallbar()

    // the recording stamp
    const slot = $('#stamp')
    if (slot && window.KORR_INK) { try { window.KORR_INK.mount(slot) } catch (e) {} }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
