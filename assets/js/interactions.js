/* Fonctionnalités : agenda, frise du parcours, formulaires en étapes (simulés),
   caucus d'impro, calendrier de coaching, prise de rendez-vous simulée, copie des coordonnées. */
import { EVENEMENTS, PARCOURS, PISTES, CAUCUS } from './data.js?v=2'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const fmtDate = (d, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => new Intl.DateTimeFormat('fr-FR', opts).format(d)

/* ---------- Agenda ---------- */
export function initAgenda() {
  $$('[data-agenda]').forEach(el => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const list = EVENEMENTS.map(e => ({ ...e, d: new Date(e.date + 'T12:00:00') })).sort((a, b) => a.d - b.d)
    const avenir = list.filter(e => e.d >= today)
    const passees = list.filter(e => e.d < today).reverse()
    const item = (e, past) => `<li class="ag-item${past ? ' is-past' : ''}">
        <time class="ag-date" datetime="${e.date}"><span class="ag-day" data-count="${e.d.getDate()}">${e.d.getDate()}</span><span class="ag-month">${fmtDate(e.d, { month: 'short', year: 'numeric' })}</span></time>
        <div class="ag-body"><p class="ag-format">${esc(e.format)}${past ? ' · passé' : ''}</p><h4 class="ag-title">${esc(e.titre)}</h4><p class="ag-lieu">${esc(e.lieu)}</p>${e.note ? `<p class="ag-note">${esc(e.note)}</p>` : ''}</div></li>`
    el.innerHTML = `<div class="ag-col"><h3 class="ag-head">À venir <span class="ag-count">${avenir.length}</span></h3>${avenir.length ? `<ul class="ag-list">${avenir.map(e => item(e, false)).join('')}</ul>` : '<p class="ag-empty">Aucune date publiée pour l’instant. <span class="todo">Prochaines animations à compléter</span></p>'}</div>
      <div class="ag-col"><h3 class="ag-head">Passées <span class="ag-count">${passees.length}</span></h3><ul class="ag-list">${passees.map(e => item(e, true)).join('')}</ul><p class="ag-empty"><span class="todo">Liste des événements animés depuis 2016 à compléter</span></p></div>`
  })
}

/* ---------- Frise du parcours ---------- */
export function initFrise() {
  $$('[data-frise]').forEach(el => {
    const Y0 = 1987, Y1 = 2027, LAST = 2022.9, NOW = 2026.8
    const ppy = window.matchMedia('(max-width: 899px)').matches ? 74 : 112
    const W = (Y1 - Y0) * ppy
    const x = y => ((y - Y0) * ppy).toFixed(1)
    const ticks = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => {
      const y = Y0 + i
      return `<span class="fr-tick${y % 5 === 0 ? ' is-major' : ''}" style="left:${x(y)}px">${y % 5 === 0 || y === Y0 ? y : ''}</span>`
    }).join('')
    const lanes = PISTES.map(p => {
      const items = PARCOURS.filter(i => i.piste === p.id).sort((a, b) => a.debut - b.debut)
      const rows = []
      const placed = items.map(it => {
        const fin = it.fin ?? NOW
        const left = (it.debut - Y0) * ppy
        const right = Math.max((fin - Y0) * ppy, left + 236)
        let r = rows.findIndex(end => end + 14 < left)
        if (r === -1) { r = rows.length; rows.push(right) } else rows[r] = right
        return { it, r, left }
      })
      const RH = 60
      const html = placed.map(({ it, r }) => {
        const solidEnd = it.fin ?? LAST
        const solidW = Math.max((solidEnd - it.debut) * ppy, 8)
        const dash = it.fin === null ? `<span class="fr-dash" style="left:${solidW.toFixed(1)}px;width:${((NOW - LAST) * ppy).toFixed(1)}px" title="Activité en cours en 2022, à confirmer aujourd’hui"></span>` : ''
        const dates = `${Math.floor(it.debut)}${it.fin === null ? ' → ?' : (Math.floor(it.fin) !== Math.floor(it.debut) ? '–' + Math.floor(it.fin) : '')}`
        return `<div class="fr-item" style="left:${x(it.debut)}px;top:${r * RH}px" tabindex="0" title="${esc(it.titre)} · ${esc(it.lieu)}"><span class="fr-bar" style="width:${solidW.toFixed(1)}px"></span>${dash}<span class="fr-dates">${dates}</span><span class="fr-title">${esc(it.titre)}</span><span class="fr-lieu">${esc(it.lieu)}</span></div>`
      }).join('')
      return `<div class="fr-lane fr-${p.id}" style="height:${rows.length * RH + 6}px"><span class="fr-lane-name">${esc(p.nom)}</span>${html}</div>`
    }).join('')
    el.innerHTML = `<div class="fr-scroll" data-frise-scroll tabindex="0" role="region" aria-label="Frise du parcours, de 1987 à aujourd’hui (défilement horizontal)"><div class="fr-inner" style="width:${W + 260}px">
      <div class="fr-years">${ticks}</div>${lanes}
      <span class="fr-limit" style="left:${x(LAST)}px"><span>Site actuel mis à jour fin 2022 · au-delà, à confirmer</span></span>
    </div></div>`
  })
}

/* ---------- Formulaires en étapes (simulés) ---------- */
export function initWizards() {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  $$('[data-min-today]').forEach(i => { i.min = iso(new Date()) })
  $$('[data-wizard]').forEach(form => {
    const steps = $$('.wz-step', form)
    const bar = $('.wz-bar', form)
    const labels = $$('.wz-labels li', form)
    const prev = $('[data-prev]', form), next = $('[data-next]', form), submit = $('[data-submit]', form)
    const err = $('.wz-error', form)
    const done = $('.wz-done', form)
    let i = 0
    const show = () => {
      steps.forEach((s, k) => { s.hidden = k !== i })
      labels.forEach((l, k) => { l.classList.toggle('is-current', k === i); l.classList.toggle('is-done', k < i) })
      if (bar) bar.style.transform = `scaleX(${(i + 1) / steps.length})`
      prev.hidden = i === 0
      next.hidden = i === steps.length - 1
      submit.hidden = i !== steps.length - 1
      err.textContent = ''
      if (i === steps.length - 1) fillSummary()
    }
    const valid = () => {
      const fields = $$('input, select, textarea', steps[i])
      for (const f of fields) {
        if (!f.checkValidity()) {
          const name = f.closest('fieldset')?.querySelector('legend')?.textContent || 'ce champ'
          err.textContent = f.type === 'radio' ? `Choisissez une option pour « ${name.trim()} ».` : (f.validity.typeMismatch ? 'Vérifiez l’adresse e-mail.' : `Merci de remplir le champ « ${(f.labels?.[0]?.textContent || name).replace('*', '').trim()} ».`)
          f.focus({ preventScroll: true })
          return false
        }
      }
      return true
    }
    function fillSummary() {
      const box = $('.wz-summary', form)
      if (!box) return
      const rows = []
      $$('[data-sum]', form).forEach(f => {
        if ((f.type === 'radio' || f.type === 'checkbox') && !f.checked) return
        const v = f.tagName === 'SELECT' ? f.options[f.selectedIndex]?.text : (f.type === 'date' && f.value ? fmtDate(new Date(f.value + 'T12:00:00')) : f.value)
        if (!v) return
        const label = f.dataset.sum
        const existing = rows.find(r => r[0] === label)
        if (existing) existing[1] += ', ' + v
        else rows.push([label, v])
      })
      box.innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')
    }
    next.addEventListener('click', () => { if (valid()) { i++; show(); steps[i].querySelector('input, select, textarea')?.focus({ preventScroll: true }) } })
    prev.addEventListener('click', () => { i = Math.max(0, i - 1); show() })
    form.addEventListener('submit', e => {
      e.preventDefault()
      if (!valid()) return
      fillSummary()
      const sum = $('.wz-summary', form)
      $('.wz-done-summary', form).innerHTML = sum ? sum.innerHTML : ''
      $$('.wz-body', form).forEach(b => { b.hidden = true })
      done.hidden = false
      done.focus()
      form.dispatchEvent(new CustomEvent('wizard:done', { bubbles: true }))
    })
    $('[data-restart]', form)?.addEventListener('click', () => {
      form.reset(); i = 0
      $$('.wz-body', form).forEach(b => { b.hidden = false })
      done.hidden = true; show()
    })
    form.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit' && i < steps.length - 1) { e.preventDefault(); next.click() }
    })
    show()
  })
}

/* ---------- Formulaire de contact simple (simulé) ---------- */
export function initContactForm() {
  $$('[data-contact-form]').forEach(form => {
    const err = $('.wz-error', form), done = $('.cf-done', form)
    form.addEventListener('submit', e => {
      e.preventDefault()
      const bad = $$('input, textarea, select', form).find(f => !f.checkValidity())
      if (bad) { err.textContent = bad.validity.typeMismatch ? 'Vérifiez l’adresse e-mail.' : `Merci de remplir le champ « ${(bad.labels?.[0]?.textContent || '').replace('*', '').trim()} ».`; bad.focus(); return }
      err.textContent = ''
      $('.cf-body', form).hidden = true
      done.hidden = false
      done.focus()
      form.dispatchEvent(new CustomEvent('wizard:done', { bubbles: true }))
    })
    $('[data-restart]', form)?.addEventListener('click', () => { form.reset(); $('.cf-body', form).hidden = false; done.hidden = true })
  })
}

/* ---------- Caucus de 20 secondes ---------- */
export function initCaucus(still) {
  $$('[data-caucus]').forEach(box => {
    const pick = a => a[Math.floor(Math.random() * a.length)]
    const out = k => $(`[data-out="${k}"]`, box)
    const ring = $('.cc-ring-fg', box), num = $('.cc-num', box), status = $('.cc-status', box)
    const btn = $('[data-draw]', box), stop = $('[data-stop]', box)
    const C = 2 * Math.PI * 54
    if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = 0 }
    let raf = 0, t0 = 0
    const end = msg => { cancelAnimationFrame(raf); raf = 0; status.textContent = msg; box.classList.remove('is-running'); stop.hidden = true }
    const tick = now => {
      const el = (now - t0) / 1000, left = Math.max(0, 20 - el)
      num.textContent = Math.ceil(left)
      if (ring) ring.style.strokeDashoffset = (C * (1 - left / 20)).toFixed(1)
      if (left <= 0) { end('Fin du caucus : à vous de jouer !'); box.classList.add('is-go'); return }
      raf = requestAnimationFrame(tick)
    }
    btn.addEventListener('click', () => {
      cancelAnimationFrame(raf)
      box.classList.remove('is-go')
      out('theme').textContent = pick(CAUCUS.themes)
      out('nature').textContent = pick(CAUCUS.natures)
      out('categorie').textContent = pick(CAUCUS.categories)
      out('joueurs').textContent = pick(CAUCUS.joueurs)
      out('duree').textContent = pick(CAUCUS.durees)
      box.classList.add('is-running')
      status.textContent = 'Caucus en cours : 20 secondes pour vous préparer.'
      stop.hidden = false
      if (btn.firstChild && btn.firstChild.nodeType === 3) btn.firstChild.nodeValue = 'Tirer une autre situation '; else btn.textContent = 'Tirer une autre situation'
      t0 = performance.now()
      if (still) { num.textContent = '20'; if (ring) ring.style.strokeDashoffset = 0 }
      raf = requestAnimationFrame(tick)
      box.dispatchEvent(new CustomEvent('caucus:draw', { bubbles: true }))
    })
    stop.addEventListener('click', () => end('Caucus arrêté.'))
  })
}

/* ---------- Calendrier indicatif de coaching ---------- */
export function initCalendrier() {
  $$('[data-calendrier]').forEach(box => {
    const range = $('#cal-seances', box), outN = $('.cal-n', box), track = $('.cal-track', box)
    const res = $('.cal-result', box), tot = $('.cal-total', box)
    const render = () => {
      const n = +range.value
      const freq = +($('input[name="cal-freq"]:checked', box)?.value || 7)
      const dur = +($('input[name="cal-duree"]:checked', box)?.value || 60)
      outN.textContent = n
      range.setAttribute('aria-valuetext', `${n} séances`)
      const days = (n - 1) * freq
      const weeks = Math.round(days / 7)
      const months = days / 30.44
      const mTxt = months < 1.5 ? 'un peu plus d’un mois' : `environ ${String(Math.round(months * 2) / 2).replace('.', ',')} mois`
      res.innerHTML = `<strong>${weeks} semaines</strong> entre la première et la dernière séance, soit ${mTxt}.`
      const mins = n * dur, h = Math.floor(mins / 60), m = mins % 60
      tot.textContent = `${n} séances de ${dur === 60 ? '1 h' : dur === 90 ? '1 h 30' : '1 h 15'} : ${h} h${m ? ' ' + m : ''} de dialogue au total.`
      const maxDays = 11 * 14
      track.innerHTML = Array.from({ length: n }, (_, k) => `<span class="cal-dot" style="left:${((k * freq) / maxDays * 100).toFixed(2)}%"><span>${k + 1}</span></span>`).join('') +
        `<span class="cal-span" style="width:${(days / maxDays * 100).toFixed(2)}%"></span>`
      box.dispatchEvent(new CustomEvent('calendrier:update', { bubbles: true }))
    }
    box.addEventListener('input', render)
    render()
  })
}

/* ---------- Prise de rendez-vous simulée ---------- */
export function initRdv() {
  $$('[data-rdv]').forEach(box => {
    const grid = $('.rdv-days', box), slots = $('.rdv-slots', box), form = $('.rdv-form', box)
    const chosen = $('.rdv-chosen', box), hidden = $('#rdv-creneau', box), done = $('.rdv-done', box)
    const SLOTS = { 1: ['10:00', '14:00'], 2: ['09:30', '18:00'], 3: ['14:00'], 4: ['10:00', '18:30'], 5: ['09:30', '16:00'], 6: ['10:00'] }
    const days = []
    const d = new Date(); d.setHours(12, 0, 0, 0)
    while (days.length < 12) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)) }
    grid.innerHTML = days.map((day, k) => `<button type="button" class="rdv-day" data-k="${k}" aria-pressed="false"><span class="rdv-wd">${fmtDate(day, { weekday: 'short' })}</span><span class="rdv-dn">${day.getDate()}</span><span class="rdv-mo">${fmtDate(day, { month: 'short' })}</span></button>`).join('')
    const pickDay = k => {
      $$('.rdv-day', grid).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.k === k)))
      const day = days[k]
      const list = SLOTS[day.getDay()] || []
      slots.innerHTML = list.map((h, j) => {
        const taken = (day.getDate() * 7 + j * 3) % 5 === 0
        return `<button type="button" class="rdv-slot" data-h="${h}" ${taken ? 'disabled' : ''}>${h.replace(':', ' h ')}${taken ? ' · pris' : ''}</button>`
      }).join('')
      $$('.rdv-slot', slots).forEach(b => b.addEventListener('click', () => {
        $$('.rdv-slot', slots).forEach(x => x.classList.toggle('is-on', x === b))
        const label = `${fmtDate(day)} à ${b.dataset.h.replace(':', ' h ')}`
        hidden.value = label
        chosen.textContent = label
        form.hidden = false
        form.querySelector('input:not([type=hidden])')?.focus({ preventScroll: true })
      }))
    }
    grid.addEventListener('click', e => { const b = e.target.closest('.rdv-day'); if (b) pickDay(+b.dataset.k) })
    const firstFree = Math.max(0, days.findIndex(day => (SLOTS[day.getDay()] || []).some((_, j) => (day.getDate() * 7 + j * 3) % 5 !== 0)))
    pickDay(firstFree)
    form.addEventListener('submit', e => {
      e.preventDefault()
      const bad = $$('input', form).find(f => !f.checkValidity())
      const err = $('.wz-error', form)
      if (bad) { err.textContent = `Merci de remplir le champ « ${(bad.labels?.[0]?.textContent || '').replace('*', '').trim()} ».`; bad.focus(); return }
      err.textContent = ''
      $('.rdv-done-label', box).textContent = hidden.value
      $('.rdv-body', box).hidden = true
      done.hidden = false
      done.focus()
      box.dispatchEvent(new CustomEvent('wizard:done', { bubbles: true }))
    })
    $('[data-restart]', box)?.addEventListener('click', () => { form.reset(); form.hidden = true; $('.rdv-body', box).hidden = false; done.hidden = true; pickDay(firstFree) })
  })
}

/* ---------- Copier les coordonnées ---------- */
export function initCopy() {
  $$('[data-copy]').forEach(btn => {
    const orig = btn.textContent
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy
      const ok = () => { btn.textContent = 'Copié'; btn.classList.add('is-ok'); setTimeout(() => { btn.textContent = orig; btn.classList.remove('is-ok') }, 1600) }
      const fallback = () => {
        const target = document.getElementById(btn.dataset.copyTarget)
        if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
        btn.textContent = 'Sélectionné : copiez'
        setTimeout(() => { btn.textContent = orig }, 2200)
      }
      try { navigator.clipboard.writeText(text).then(ok, fallback) } catch { fallback() }
    })
  })
}
