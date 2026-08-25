/* KORR — motion.
 *
 * One authored language: the stamp landing. It plays at hero scale as the
 * recording stamp (ink.js) and at row scale as each instrument's status mark.
 * Plates tip in; nothing else animates. No generic fade-up on every section.
 *
 * There is exactly one RAF loop: GSAP's ticker drives Lenis. Running two is
 * what desyncs ScrollTrigger pins.
 */
(function () {
  'use strict'

  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)')
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'
  const hasLenis = typeof window.Lenis !== 'undefined'

  let lenis = null

  function teardown () {
    if (lenis) { lenis.destroy(); lenis = null; window.KORR_LENIS = null }
    if (hasGSAP) {
      window.ScrollTrigger.getAll().forEach(t => t.kill())
      window.gsap.ticker.remove(drive)
    }
    // Nothing may be left hidden by a cancelled animation.
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = ''
      el.style.transform = ''
      el.style.clipPath = ''
    })
  }

  function drive (time) { if (lenis) lenis.raf(time * 1000) }

  function setup () {
    if (REDUCE.matches) { teardown(); return }

    if (hasLenis) {
      lenis = new window.Lenis({
        autoRaf: false,                      // GSAP's ticker is the single clock
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
      window.KORR_LENIS = lenis
      if (hasGSAP) {
        lenis.on('scroll', window.ScrollTrigger.update)
        window.gsap.ticker.add(drive)
        window.gsap.ticker.lagSmoothing(0)
      } else {
        const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop) }
        requestAnimationFrame(loop)
      }
    }

    if (!hasGSAP) return
    const { gsap, ScrollTrigger } = window
    gsap.registerPlugin(ScrollTrigger)

    // The certificate settles once, on load.
    gsap.from('#certificate [data-lead]', {
      opacity: 0, y: 22, duration: 1.05, ease: 'expo.out', stagger: 0.07, delay: 0.15,
    })

    bind(document)

    // Images arriving late change the page height.
    window.addEventListener('load', () => ScrollTrigger.refresh())
  }

  /* Bind reveals inside a container. Called again after the schedule re-renders. */
  function bind (root) {
    if (REDUCE.matches || !hasGSAP) return
    const { gsap, ScrollTrigger } = window

    root.querySelectorAll('.inst[data-reveal]').forEach((row) => {
      if (row.dataset.bound) return
      row.dataset.bound = '1'

      gsap.from(row, {
        opacity: 0, y: 14, duration: 0.7, ease: 'expo.out',
        scrollTrigger: { trigger: row, start: 'top 92%', once: true },
      })

      // the stamp lands — heavier and slower when the lot is gone
      const mark = row.querySelector('.mark-status')
      if (!mark) return
      const gone = mark.classList.contains('closed')
      gsap.from(mark, {
        opacity: 0,
        scale: gone ? 1.5 : 1.28,
        rotate: gone ? -9 : -5,
        duration: gone ? 0.62 : 0.44,
        ease: 'expo.out',
        scrollTrigger: { trigger: row, start: 'top 86%', once: true },
        delay: 0.12,
      })
    })

    root.querySelectorAll('.exhibit[data-reveal]').forEach((fig) => {
      if (fig.dataset.bound) return
      fig.dataset.bound = '1'
      gsap.from(fig, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.15, ease: 'expo.out',
        scrollTrigger: { trigger: fig, start: 'top 88%', once: true },
      })
      const img = fig.querySelector('img')
      if (img) {
        gsap.fromTo(img, { scale: 1.1 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 1 },
        })
      }
    })

    ScrollTrigger.refresh()
  }

  window.KORR_MOTION = { bind }

  // Users flip this mid-session.
  REDUCE.addEventListener('change', () => { teardown(); setup() })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
})()
