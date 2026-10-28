/* Francis Gérardin · maquette « Carnet de route »
   Mouvement : GSAP + ScrollTrigger + SplitText + DrawSVG, défilement Lenis, trame offset WebGL. */
import { drawSketches } from './sketch.js?v=20261028'
import { buildRoute } from './route.js?v=20261028'
import { initAgenda, initFrise, initWizards, initContactForm, initCaucus, initCalendrier, initRdv, initCopy } from './interactions.js?v=20261028'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const root = document.documentElement
const store = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* stockage indisponible */ } },
  sget(k) { try { return sessionStorage.getItem(k) } catch { return null } },
  sset(k, v) { try { sessionStorage.setItem(k, v) } catch { /* stockage indisponible */ } },
}
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const calm = root.classList.contains('is-calm')
const still = reduced || calm
const gsap = window.gsap
const fine = window.matchMedia('(pointer: fine)').matches

/* ---------- Contenu construit en code ---------- */
drawSketches()
initAgenda()
initFrise()
$$('[data-route]').forEach(el => buildRoute(el))
initWizards()
initContactForm()
initCaucus(still)
initCalendrier()
initRdv()
initCopy()

/* ---------- Mode calme ---------- */
$$('[data-calm-toggle]').forEach(btn => {
  btn.setAttribute('aria-pressed', String(calm))
  btn.addEventListener('click', () => {
    store.set('fg-calme', calm ? null : '1')
    location.reload()
  })
})

/* ---------- Menu mobile ---------- */
const burger = $('.hd-burger'), menu = $('#menu-mobile')
if (burger && menu) {
  menu.setAttribute('data-lenis-prevent', '')
  const horsMenu = on => $$('body > main, body > footer, body > .skip').forEach(x => { x.inert = on })
  const close = () => {
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu')
    menu.hidden = true; root.classList.remove('menu-open'); horsMenu(false); window.__lenis?.start()
  }
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true'
    if (!open) { close(); return }
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu')
    menu.hidden = false; root.classList.add('menu-open'); horsMenu(true); window.__lenis?.stop()
    menu.querySelector('a')?.focus()
  })
  document.addEventListener('keydown', e => {
    if (menu.hidden) return
    if (e.key === 'Escape') { close(); burger.focus(); return }
    if (e.key !== 'Tab') return
    const f = [burger, ...$$('a[href], button:not([disabled])', menu)]
    const i = f.indexOf(document.activeElement)
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
  })
  window.addEventListener('pageshow', e => { if (e.persisted && !menu.hidden) close() })
  $$('a', menu).forEach(a => a.addEventListener('click', close))
}

/* ---------- En-tête au défilement ---------- */
const header = $('.hd')
const onScrollHeader = y => header && header.classList.toggle('is-scrolled', y > 24)
onScrollHeader(window.scrollY)
window.addEventListener('scroll', () => onScrollHeader(window.scrollY), { passive: true })

/* ---------- Fil d'encre ---------- */
function buildThread() {
  const main = $('main')
  const svg = main && $('.thread', main)
  if (!svg) return null
  const path = $('.thread-path', svg), nib = $('.thread-nib', svg)
  const state = { len: 0, samples: [] }
  const build = () => {
    const nodes = $$('[data-thread]', main).filter(n => n.offsetParent !== null)
    if (nodes.length < 2) { path.setAttribute('d', ''); return }
    const mr = main.getBoundingClientRect()
    const w = main.clientWidth, h = main.scrollHeight
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.style.height = h + 'px'
    const narrow = w < 900
    const vw = w
    const gut = Math.min(52, Math.max(16, vw * 0.04)), mcol = Math.min(132, vw * 0.09)
    const marginX = Math.max(0, (vw - 1380) / 2) + gut + mcol * 0.5
    const pts = []
    nodes.forEach(n => {
      const r = n.getBoundingClientRect()
      const [fx, fy] = (n.dataset.thread || '0.5 0.5').split(' ').map(Number)
      const y = r.top - mr.top + r.height * fy
      if (narrow) { pts.push({ x: Math.max(6, gut * 0.36), y }); return }
      if (n.hasAttribute('data-free')) {
        const x = r.left - mr.left + r.width * fx
        pts.push({ x: marginX, y: y - 90 }, { x, y, loop: n.hasAttribute('data-loop') }, { x: marginX, y: y + 110 })
      } else {
        pts.push({ x: marginX + (n.hasAttribute('data-loop') ? 0 : 0), y, loop: n.hasAttribute('data-loop') })
      }
    })
    pts.sort((a, b) => a.y - b.y)
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    let cur = pts[0]
    for (let i = 1; i < pts.length; i++) {
      const b = pts[i], dy = b.y - cur.y
      d += `C${cur.x.toFixed(1)} ${(cur.y + dy * 0.55).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy * 0.55).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      cur = b
      if (b.loop) {
        const r = 34
        d += `C${(b.x + r * 1.1).toFixed(1)} ${(b.y + r * 0.5).toFixed(1)} ${(b.x + r * 1.2).toFixed(1)} ${(b.y - r * 1.3).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - r * 1.2).toFixed(1)}`
        d += `C${(b.x - r * 1.2).toFixed(1)} ${(b.y - r * 1.1).toFixed(1)} ${(b.x - r * 0.6).toFixed(1)} ${(b.y + r * 0.7).toFixed(1)} ${(b.x + r * 0.2).toFixed(1)} ${(b.y + r * 0.9).toFixed(1)}`
        cur = { x: b.x + r * 0.2, y: b.y + r * 0.9 }
      }
    }
    path.setAttribute('d', d)
    state.len = path.getTotalLength()
    path.style.strokeDasharray = `${state.len} ${state.len}`
    state.samples = []
    let maxY = -Infinity
    for (let l = 0; l <= state.len; l += 6) {
      const p = path.getPointAtLength(l)
      maxY = Math.max(maxY, p.y)
      state.samples.push({ l, y: maxY, x: p.x, py: p.y })
    }
    state.top = main.getBoundingClientRect().top + window.scrollY
    update()
  }
  const update = () => {
    if (!state.len) return
    if (still) { path.style.strokeDashoffset = 0; nib.style.opacity = 0; return }
    const target = window.scrollY + window.innerHeight * 0.62 - state.top
    const arr = state.samples
    let lo = 0, hi = arr.length - 1
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid].y >= target) hi = mid; else lo = mid + 1 }
    const s = arr[lo]
    const drawn = Math.max(0, Math.min(state.len, s.l))
    path.style.strokeDashoffset = (state.len - drawn).toFixed(1)
    nib.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.py.toFixed(1)})`)
    nib.style.opacity = drawn > 4 && drawn < state.len - 4 ? 1 : 0
  }
  let t = 0
  const rebuild = () => { clearTimeout(t); t = setTimeout(build, 120) }
  new ResizeObserver(rebuild).observe(main)
  window.addEventListener('load', build)
  build()
  return { update, build }
}
const thread = buildThread()

/* ---------- Sans animation : état final complet ---------- */
function finishStill() {
  root.classList.add('is-still')
  $$('.intro, .flip').forEach(el => el.remove())
  $$('.trame').forEach(el => el.classList.add('is-done'))
  $$('[data-route]').forEach(el => el.classList.add('is-drawn'))
  thread && thread.update()
}

if (!gsap || still) {
  finishStill()
} else {
  run()
}

function run() {
  const { ScrollTrigger, SplitText, DrawSVGPlugin, ScrambleTextPlugin, CustomEase } = window
  gsap.registerPlugin(ScrollTrigger, ...[SplitText, DrawSVGPlugin, ScrambleTextPlugin, CustomEase].filter(Boolean))
  CustomEase && CustomEase.create('ink', 'M0,0 C0.2,0.7 0.25,1 1,1')
  root.classList.add('is-moving')

  /* Défilement fluide */
  let lenis = null
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(t => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    window.__lenis = lenis
  }
  gsap.ticker.add(() => thread && thread.update())
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href')
    if (id.length < 2) return
    let target = null
    try { target = document.getElementById(decodeURIComponent(id.slice(1))) } catch (er) { /* ancre invalide */ }
    if (!target) return
    e.preventDefault()
    lenis ? lenis.scrollTo(target, { offset: -90, duration: 1.2 }) : target.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', id)
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }))

  /* Transition « page tournée » */
  const flip = $('.flip')
  if (flip) {
    if (root.classList.contains('play-flip')) {
      gsap.fromTo(flip, { yPercent: 0, rotateX: 0 }, { yPercent: -112, rotateX: 14, duration: 0.7, ease: 'power3.inOut', delay: 0.02, onComplete: () => flip.classList.add('is-gone') })
    }
    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#') || a.target === '_blank' || /^(mailto|tel|https?):/.test(href) || a.hasAttribute('download')) return
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        const norm = p => p.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '')
        const u = new URL(a.href)
        if (norm(u.pathname) === norm(location.pathname) && !u.hash && u.search === location.search) { e.preventDefault(); lenis ? lenis.scrollTo(0) : window.scrollTo(0, 0); return }
        e.preventDefault()
        store.sset('fg-flip', '1')
        flip.classList.remove('is-gone')
        gsap.fromTo(flip, { yPercent: 108, rotateX: -12 }, { yPercent: 0, rotateX: 0, duration: 0.45, ease: 'power3.in', onComplete: () => { location.href = href } })
      })
    })
    window.addEventListener('pageshow', e => { if (e.persisted) { gsap.set(flip, { yPercent: -112 }); flip.classList.add('is-gone') } })
  }

  /* Ouverture « conducteur » (accueil, une fois par visite) */
  const intro = $('.intro')
  const heroStart = gsap.timeline({ paused: true })
  if (intro && root.classList.contains('play-intro')) {
    store.sset('fg-intro', '1')
    const tc = $('.intro-tc', intro)
    const counter = { f: 0 }
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: () => { intro.remove(); heroStart.play() } })
    tl.to(counter, { f: 2 * 25 + 12, duration: 2.1, ease: 'none', onUpdate: () => {
      const f = Math.round(counter.f), s = Math.floor(f / 25), fr = f % 25
      tc.textContent = `00:00:${String(s).padStart(2, '0')}:${String(fr).padStart(2, '0')}`
    } }, 0)
      .from('.intro-head > *', { y: 14, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0)
      .from('.intro-row', { x: -24, autoAlpha: 0, stagger: 0.2, duration: 0.45 }, 0.25)
      .from('.intro-check', { scale: 0, rotate: -40, stagger: 0.2, duration: 0.35, ease: 'back.out(3)' }, 0.6)
      .from('.intro-dots', { scaleX: 0, transformOrigin: 'left center', stagger: 0.2, duration: 0.4 }, 0.35)
      .to('.intro-sheet', { yPercent: -112, rotateX: 16, duration: 0.75, ease: 'power3.inOut' }, 2.05)
      .to(intro, { autoAlpha: 0, duration: 0.3 }, 2.55)
    const skip = () => { if (tl.progress() < 1) tl.progress(1) }
    intro.addEventListener('click', skip)
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('wheel', () => { if (tl.time() > 1.2) skip() }, { passive: true, once: true })
  } else {
    intro && intro.remove()
    gsap.delayedCall(root.classList.contains('play-flip') ? 0.45 : 0.1, () => heroStart.play())
  }

  /* Héros : titre, corrections au rouge, photo en trame */
  const hero = $('.hero')
  if (hero) {
    const title = $$('.hero .split-hero', hero)
    title.forEach(t => {
      if (!SplitText) return
      const s = new SplitText(t, { type: 'lines,words', mask: 'lines', linesClass: 'ln', aria: 'none' })
      heroStart.from(s.lines, { yPercent: 108, duration: 1, stagger: 0.09, ease: 'expo.out' }, 0)
    })
    heroStart.from($$('.hero [data-hero-fade]', hero), { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.25)
    const corr = $$('.corr', hero)
    corr.forEach((c, i) => {
      heroStart.from(c, { autoAlpha: 0, y: 12, duration: 0.35 }, 0.55 + i * 0.42)
      const strike = $('.strike path', c)
      if (strike && DrawSVGPlugin) heroStart.from(strike, { drawSVG: '0%', duration: 0.32, ease: 'power2.in' }, 0.8 + i * 0.42)
    })
    const ins = $('.ins', hero)
    if (ins) {
      const at = 0.75 + corr.length * 0.42
      heroStart.from(ins, { clipPath: 'inset(0 100% -20% 0)', duration: 0.8, ease: 'power2.inOut' }, at)
      const ul = $('.ins-mark path', hero)
      ul && DrawSVGPlugin && heroStart.from(ul, { drawSVG: '0%', duration: 0.6, ease: 'power2.out' }, at + 0.6)
    }
    const heroImg = $('.hero-photo', hero)
    if (heroImg) {
      heroStart.from(heroImg, { clipPath: 'inset(8% 8% 8% 8%)', duration: 1.4, ease: 'expo.out' }, 0.1)
      const tag = $('.hero-photo .caption', hero)
      tag && heroStart.from(tag, { clipPath: 'inset(0 100% 0 0)', duration: 0.7, ease: 'power2.inOut' }, 1.1)
    }
  }

  /* WebGL : trame offset sur la photo du héros et champ de trame */
  const glPhoto = $('[data-gl="halftone"]')
  const glField = $('[data-gl="field"]')
  if (glPhoto || glField) {
    import('./webgl.js?v=20261028').then(({ initHalftonePhoto, initTrameField }) => {
      if (glPhoto) {
        const img = $('img', glPhoto)
        const start = () => {
          const api = initHalftonePhoto(glPhoto, gsap, a => {
            a.setIntro(0)
            heroStart.progress() > 0.2 ? a.intro(1.6) : heroStart.add(a.intro(1.8), 0.05)
            ScrollTrigger.create({ trigger: glPhoto, start: 'top top', end: 'bottom top', onUpdate: s => a.setScroll(s.progress * 0.75) })
          })
          if (!api) glPhoto.classList.add('gl-off')
        }
        img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, { once: true })
      }
      if (glField) initTrameField(glField, gsap)
    }).catch(() => { /* WebGL indisponible : l'image reste affichée */ })
  }

  /* Titres de sections ligne à ligne */
  if (SplitText) {
    $$('.split').forEach(el => {
      const s = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'ln', aria: 'none' })
      gsap.from(s.lines, { yPercent: 105, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
    })
  }

  /* Apparitions */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%', once: true,
    onEnter: els => gsap.from(els, { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  })

  /* Trame offset en CSS sur les photos */
  $$('.trame:not(.is-done)').forEach(el => {
    if (el.closest('.hero')) { el.classList.add('is-done'); return }
    gsap.fromTo(el, { '--t': 0 }, { '--t': 1, duration: 1.5, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onComplete: () => el.classList.add('is-done') })
  })

  /* Légendes de presse */
  $$('.caption').forEach(c => {
    if (c.closest('.hero')) return
    gsap.from(c, { clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'power2.inOut', scrollTrigger: { trigger: c, start: 'top 95%', once: true } })
  })

  /* Corrections au rouge hors héros */
  $$('.correction').forEach(box => {
    if (box.closest('.hero')) return
    const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 80%', once: true } })
    $$('.corr', box).forEach((c, i) => {
      const p = $('.strike path', c)
      p && DrawSVGPlugin && tl.from(p, { drawSVG: '0%', duration: 0.35, ease: 'power2.in' }, 0.2 + i * 0.35)
    })
    const ins = $('.ins', box)
    ins && tl.from(ins, { clipPath: 'inset(0 100% -20% 0)', duration: 0.7, ease: 'power2.inOut' }, '>-0.05')
    const ul = $('.ins-mark path', box)
    ul && DrawSVGPlugin && tl.from(ul, { drawSVG: '0%', duration: 0.5 }, '>-0.1')
  })

  /* Traits soulignés à la main */
  DrawSVGPlugin && $$('.hand-line path').forEach(p => {
    if (p.closest('.hero') || p.closest('.correction')) return
    gsap.from(p, { drawSVG: '0%', duration: 1, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('svg'), start: 'top 90%', once: true } })
  })

  /* Tampons et compteurs */
  $$('.stamp').forEach(s => {
    gsap.from(s, { scale: 1.3, rotate: '-=10', autoAlpha: 0, duration: 0.55, ease: 'back.out(2.2)', scrollTrigger: { trigger: s, start: 'top 92%', once: true } })
  })
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, obj = { v: 0 }
    gsap.to(obj, { v: to, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(obj.v) } })
  })

  /* Mots qui improvisent (formateur) */
  if (ScrambleTextPlugin) {
    $$('[data-scramble]').forEach((el, i) => {
      const txt = el.textContent
      gsap.to(el, { scrambleText: { text: txt, chars: 'abcdefghijklmnopqrstuvwxyzéèàç', revealDelay: 0.25, speed: 0.6 }, duration: 1.3, delay: 0.3 + i * 0.12, scrollTrigger: { trigger: el, start: 'top 95%', once: true } })
    })
  }

  /* Dépêches : vitesse du défilement liée au scroll */
  $$('.ticker').forEach(t => {
    ScrollTrigger.create({ trigger: t, start: 'top bottom', end: 'bottom top', onUpdate: s => { t.style.setProperty('--skew', `${gsap.utils.clamp(-6, 6, s.getVelocity() / -300)}deg`) } })
  })

  /* Parallaxe douce */
  $$('[data-parallax]').forEach(el => {
    const amt = +el.dataset.parallax || 10
    gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
  })

  /* Croquis provisoires : tracé à l'encre */
  $$('.ph').forEach(ph => {
    const paths = $$('.ph-art path.k', ph)
    if (!paths.length || !DrawSVGPlugin) return
    gsap.from(paths, { drawSVG: '0%', duration: 1.2, stagger: { amount: 0.8 }, ease: 'power1.inOut', scrollTrigger: { trigger: ph, start: 'top 90%', once: true } })
    gsap.from($$('.ph-art path:not(.k)', ph), { autoAlpha: 0, duration: 0.8, delay: 0.6, scrollTrigger: { trigger: ph, start: 'top 90%', once: true } })
  })

  /* La route */
  $$('[data-route]').forEach(el => {
    const route = $('.rt-route', el)
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true }, onComplete: () => el.classList.add('is-drawn') })
    DrawSVGPlugin && tl.from(route, { drawSVG: '0%', duration: 3.2, ease: 'power1.inOut' }, 0)
    tl.from($$('.rt-river, .rt-mount', el), { autoAlpha: 0, duration: 0.8, stagger: 0.02 }, 0)
    $$('.rt-city', el).forEach((c, i) => tl.from(c, { autoAlpha: 0, scale: 0.6, transformOrigin: '0 0', duration: 0.45, ease: 'back.out(2)' }, 0.25 + i * 0.5))
  })

  const mm = gsap.matchMedia()

  /* Sections épinglées (écrans larges) */
  mm.add('(min-width: 900px)', () => {
    /* Sections épinglées, créées dans l'ordre de la page */
    const initStack = sec => {
      const cards = $$('.stack-card', sec)
      if (cards.length < 2) return
      sec.classList.add('is-pinned')
      if (cards.some(c => c.scrollHeight > c.clientHeight + 2)) { sec.classList.remove('is-pinned'); return }
      gsap.set(cards.slice(1), { yPercent: 115, rotate: i => (i % 2 ? -3 : 3) })
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * (cards.length - 1) * 0.9, pin: true, scrub: 0.7, anticipatePin: 1 } })
      cards.slice(1).forEach((c, i) => {
        tl.to(c, { yPercent: 0, rotate: (i % 2 ? -1.2 : 1.2), duration: 1, ease: 'power2.out' }, i)
          .fromTo(cards[i], { scale: 1, '--dim': 0 }, { scale: 0.93, '--dim': 1, duration: 1 }, i)
      })
      const marks = $$('.stack-index li', sec)
      if (marks.length) {
        ScrollTrigger.create({ trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * (cards.length - 1) * 0.9, onUpdate: s => {
          const k = Math.min(cards.length - 1, Math.round(s.progress * (cards.length - 1)))
          marks.forEach((m, j) => m.classList.toggle('is-on', j === k))
        } })
      }
      return () => sec.classList.remove('is-pinned')
    }
    const initH = sec => {
      const track = $('.h-track', sec)
      if (!track) return
      if (sec.classList.contains('frise-sec') && window.innerHeight < 860) return
      sec.classList.add('is-pinned')
      const dist = () => Math.max(0, track.scrollWidth - sec.clientWidth + 40)
      const counter = $('[data-year]', sec)
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: s => { if (counter) counter.textContent = Math.round(1987 + s.progress * 39.8) } },
      })
      return () => sec.classList.remove('is-pinned')
    }
    const initM = sec => {
      const steps = $$('.mt-step', sec), checks = $$('.mt-q', sec)
      gsap.set($$('.mt-bar', sec), { scaleX: 0, transformOrigin: 'left center' })
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 1.8, pin: true, scrub: 0.5, anticipatePin: 1 } })
      steps.forEach((s, i) => tl.fromTo(s, { autoAlpha: 0.55 }, { autoAlpha: 1, duration: 0.5 }, i * 0.7).to($('.mt-bar', s), { scaleX: 1, duration: 0.6 }, i * 0.7))
      checks.forEach((c, i) => tl.from($('.mt-tick path', c), { drawSVG: '0%', duration: 0.25 }, 2 + i * 0.25).fromTo(c, { autoAlpha: 0.35 }, { autoAlpha: 1, duration: 0.2 }, 2 + i * 0.25))
    }
    const cleanups = []
    $$('[data-stack], [data-hscroll], [data-methode]').forEach(sec => {
      const r = sec.hasAttribute('data-stack') ? initStack(sec) : sec.hasAttribute('data-hscroll') ? initH(sec) : initM(sec)
      if (typeof r === 'function') cleanups.push(r)
    })
    ScrollTrigger.sort()
    return () => cleanups.forEach(f => f())
  })

  /* Principes du coaching : image collante qui change */
  $$('[data-principes]').forEach(sec => {
    const items = $$('.pr-item', sec), figs = $$('.pr-fig', sec)
    items.forEach((it, i) => ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 60%', onToggle: s => {
      if (!s.isActive) return
      figs.forEach((f, j) => f.classList.toggle('is-on', j === i))
      items.forEach((x, j) => x.classList.toggle('is-on', j === i))
    } }))
  })

  /* Formulaires : petit tampon de confirmation */
  document.addEventListener('wizard:done', e => {
    const s = $('.stamp-ok', e.target)
    s && gsap.fromTo(s, { scale: 1.8, rotate: -18, autoAlpha: 0 }, { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.4)' })
  })
  document.addEventListener('caucus:draw', e => {
    gsap.from($$('[data-out]', e.target), { y: 10, autoAlpha: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' })
    gsap.fromTo($('.cc-card', e.target), { rotate: -6, scale: 0.94 }, { rotate: -1.5, scale: 1, duration: 0.6, ease: 'back.out(2)' })
  })

  /* Micro-interactions au pointeur */
  if (fine) {
    const cur = $('.cursor')
    if (cur) {
      root.classList.add('has-cursor')
      const x = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' }), y = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' })
      window.addEventListener('pointermove', e => { x(e.clientX); y(e.clientY); cur.classList.remove('is-out') }, { passive: true })
      document.addEventListener('pointerover', e => { cur.classList.toggle('is-link', !!e.target.closest('a, button, label, input, select, textarea, [tabindex]')) })
      document.addEventListener('pointerleave', () => cur.classList.add('is-out'))
      document.addEventListener('pointerenter', () => cur.classList.remove('is-out'))
    }
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' }), my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' })
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.35) })
      el.addEventListener('pointerleave', () => { mx(0); my(0) })
    })
    $$('.tilt').forEach(el => {
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' })
      gsap.set(el, { transformPerspective: 900 })
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 9); rx(-((e.clientY - r.top) / r.height - 0.5) * 7) })
      el.addEventListener('pointerleave', () => { rx(0); ry(0) })
    })
    const wobble = $('#ink-wobble feDisplacementMap')
    if (wobble) {
      $$('.format').forEach(f => {
        f.addEventListener('pointerenter', () => gsap.fromTo(wobble, { attr: { scale: 0 } }, { attr: { scale: 14 }, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' }))
      })
    }
  }

  /* Progression de lecture sous l'en-tête */
  const prog = $('.hd-progress')
  if (prog) {
    const setP = gsap.quickSetter(prog, 'scaleX')
    gsap.ticker.add(() => { const max = document.documentElement.scrollHeight - innerHeight; setP(max > 0 ? Math.min(1, scrollY / max) : 0) })
  }

  /* Pied de page : le numéro s'écrit */
  const ftPhone = $('.ft-phone')
  if (ftPhone && SplitText) {
    const sp = new SplitText(ftPhone, { type: 'chars', charsClass: 'char', aria: 'none' })
    const tl = gsap.timeline({ scrollTrigger: { trigger: ftPhone, start: 'top 92%', once: true } })
    tl.from(sp.chars, { yPercent: 80, rotate: 8, autoAlpha: 0, duration: 0.7, stagger: 0.035, ease: 'back.out(2)' })
    const sign = $('.ft-sign')
    sign && tl.from(sign, { clipPath: 'inset(0 100% -20% 0)', duration: 0.9, ease: 'power2.inOut' }, '-=0.3')
  }

  /* Schéma des bienfaits : il se construit */
  $$('.schema svg').forEach(svg => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 75%', once: true } })
    const pills = $$('.sch-pill', svg), pillTxt = pills.map(r => r.nextElementSibling)
    tl.from($$('.sch-cap, .sch-cap-t', svg), { autoAlpha: 0, x: -20, duration: 0.5, stagger: 0.08 }, 0)
      .from(pills.map((r, i) => [r, pillTxt[i]]).flat(), { autoAlpha: 0, x: -24, duration: 0.45, stagger: 0.035, ease: 'power3.out' }, 0.2)
    tl.from($$('.sch-link', svg), { autoAlpha: 0, duration: 0.5, stagger: 0.03 }, 0.6)
    tl.from($$('.sch-core, .sch-core-t', svg), { scale: 0.6, autoAlpha: 0, transformOrigin: '620px 350px', duration: 0.6, ease: 'back.out(2.2)' }, 1.1)
      .from($$('.sch-res, .sch-res-g text', svg), { autoAlpha: 0, x: 24, duration: 0.45, stagger: 0.04, ease: 'power3.out' }, 1.4)
    tl.from($$('.sch-loop', svg), { autoAlpha: 0, duration: 0.5, stagger: 0.15 }, 1.9)
  })

  /* Enveloppe de contact : le rabat s'ouvre, la carte sort */
  $$('.env').forEach(env => {
    const closed = $('.env-flap-closed', env), open = $('.env-flap-open', env), letter = $('.env-letter', env)
    closed.style.display = 'block'
    gsap.set(open, { scaleY: 0, transformOrigin: '50% 100%' })
    gsap.set(closed, { transformOrigin: '50% 0%' })
    gsap.set(letter, { y: 175 })
    const tl = gsap.timeline({ delay: root.classList.contains('play-flip') ? 0.9 : 0.5 })
    tl.to(closed, { scaleY: 0, duration: 0.45, ease: 'power2.in' })
      .set(closed, { display: 'none' })
      .to(open, { scaleY: 1, duration: 0.45, ease: 'power2.out' })
      .to(letter, { y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.15')
      .from($$('.env-post', env), { scale: 1.6, autoAlpha: 0, rotate: -40, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)' }, '-=0.3')
    gsap.to($('.env-float', env), { y: -6, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 })
    if (fine) {
      env.addEventListener('pointerenter', () => tl.progress() === 1 && gsap.to(letter, { y: -16, duration: 0.5, ease: 'power3.out' }))
      env.addEventListener('pointerleave', () => tl.progress() === 1 && gsap.to(letter, { y: 0, duration: 0.6, ease: 'power3.out' }))
    }
  })

  /* Formats : aperçu qui suit le curseur */
  $$('[data-flist]').forEach(list => {
    const pv = $('.fl-preview', list)
    if (!pv || !fine || !window.matchMedia('(hover: hover) and (min-width: 900px)').matches) return
    const items = $$('.fl-pv', pv)
    const xTo = gsap.quickTo(pv, 'x', { duration: 0.55, ease: 'power3.out' }), yTo = gsap.quickTo(pv, 'y', { duration: 0.55, ease: 'power3.out' })
    const rTo = gsap.quickTo(pv, 'rotation', { duration: 0.8, ease: 'power3.out' })
    let lastX = 0
    list.addEventListener('pointermove', e => {
      const r = list.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      xTo(x + 40); yTo(y - pv.offsetHeight / 2); rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6)); lastX = e.clientX
    })
    $$('.fl-row', list).forEach(row => row.addEventListener('pointerenter', () => {
      items.forEach(it => it.classList.toggle('is-on', it.dataset.fl === row.dataset.fl))
      gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' })
    }))
    list.addEventListener('pointerleave', () => gsap.to(pv, { autoAlpha: 0, scale: 0.9, duration: 0.3 }))
    gsap.set(pv, { scale: 0.9 })
  })

  /* Arrivée sur une ancre (#date, #devis, #rdv) une fois les sections épinglées en place */
  const goHash = () => {
    if (location.hash.length < 2) return
    const t = document.getElementById(location.hash.slice(1))
    if (!t) return
    ScrollTrigger.refresh()
    const go = () => {
      if (lenis) { lenis.resize(); lenis.scrollTo(t, { offset: -90, immediate: true, force: true }) } else t.scrollIntoView()
    }
    go()
    setTimeout(() => { if (Math.abs(t.getBoundingClientRect().top - 90) > 40) go() }, 350)
  }

  window.addEventListener('load', () => { ScrollTrigger.refresh(); setTimeout(goHash, 60) })
  document.fonts && document.fonts.ready.then(() => { ScrollTrigger.refresh(); thread && thread.build() })
}
