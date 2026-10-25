/* La route : croquis du Grand Est avec les étapes réelles du parcours de Francis Gérardin.
   Projection équirectangulaire simple, centrée sur la Lorraine et l'Alsace. */

const LON0 = 5.55, LAT0 = 49.45, KX = 370.2, KY = 560
const P = (lon, lat) => [(lon - LON0) * KX, (LAT0 - lat) * KY]

const RIVERS = [
  { name: 'la Moselle', at: [6.02, 48.98], pts: [[6.55, 47.95], [6.45, 48.17], [6.29, 48.37], [6.10, 48.60], [5.92, 48.67], [6.13, 48.76], [6.06, 48.90], [6.17, 49.12], [6.17, 49.36], [6.30, 49.46]] },
  { name: 'la Meurthe', at: [6.55, 48.50], pts: [[7.05, 48.08], [7.00, 48.18], [6.95, 48.28], [6.85, 48.40], [6.74, 48.45], [6.49, 48.59], [6.18, 48.69], [6.13, 48.76]] },
  { name: 'le Rhin', at: [8.02, 48.92], pts: [[7.57, 47.84], [7.58, 48.03], [7.70, 48.32], [7.80, 48.57], [7.89, 48.69], [7.99, 48.77], [8.23, 48.97], [8.26, 49.1]] },
]
const VOSGES = [[6.84, 47.9], [6.95, 48.05], [7.05, 48.2], [7.12, 48.36], [7.17, 48.51], [7.28, 48.64], [7.38, 48.78], [7.5, 48.95], [7.62, 49.12]]

export const ETAPES = [
  { id: 'rueil', name: 'Rueil-Malmaison', years: '1987–1988', desc: 'European Broadcasting School', off: true, xy: [0, 319] },
  { id: 'saintdie', name: 'Saint-Dié-des-Vosges', years: '1990–2000', desc: 'La Liberté de l’Est', ll: [6.949, 48.284], lab: [-24, 52], anchor: 'end' },
  { id: 'nancy', name: 'Nancy', years: '2002–2016', desc: 'France 3 Lorraine · ImproDisiaque', ll: [6.184, 48.692], lab: [22, 40] },
  { id: 'metz', name: 'Metz', years: '2002–2015', desc: 'Locales de France 3', ll: [6.176, 49.119], lab: [22, -18] },
  { id: 'strasbourg', name: 'Strasbourg', years: 'depuis 2015', desc: 'Animation · impro · coaching', ll: [7.752, 48.573], lab: [-24, -62], anchor: 'end' },
  { id: 'osthouse', name: 'Osthouse', years: '2021–2022', desc: 'Diplôme de coach', ll: [7.637, 48.397], lab: [26, 44] },
]

function smooth(pts) {
  if (pts.length < 3) return `M${pts.map(p => p.join(' ')).join('L')}`
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1.map(n => n.toFixed(1)).join(' ')} ${c2.map(n => n.toFixed(1)).join(' ')} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export function buildRoute(el) {
  const focus = el.dataset.route || 'all'
  const pts = Object.fromEntries(ETAPES.map(e => [e.id, e.off ? e.xy : P(...e.ll)]))
  const order = ['rueil', 'saintdie', 'nancy', 'metz', 'strasbourg', 'osthouse', 'strasbourg']
  let route = `M${pts.rueil[0]} ${pts.rueil[1]}`
  for (let i = 1; i < order.length; i++) {
    const a = pts[order[i - 1]], b = pts[order[i]]
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    const bend = (i % 2 ? -1 : 1) * Math.min(90, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.22)
    const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1
    route += `Q${(mx + nx / nl * bend).toFixed(1)} ${(my + ny / nl * bend).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
  }

  const rivers = RIVERS.map(r => {
    const [lx, ly] = P(...r.at)
    return `<path class="rt-river" d="${smooth(r.pts.map(p => P(...p)))}"/><text class="rt-river-name" x="${lx.toFixed(0)}" y="${ly.toFixed(0)}">${r.name}</text>`
  }).join('')

  const mountains = VOSGES.map(([lon, lat], i) => {
    const [x, y] = P(lon, lat), s = 16 + (i % 3) * 5
    return `<path class="rt-mount" d="M${(x - s).toFixed(1)} ${(y + s * 0.6).toFixed(1)}L${x.toFixed(1)} ${(y - s * 0.9).toFixed(1)}L${(x + s).toFixed(1)} ${(y + s * 0.6).toFixed(1)}M${(x - s * 0.3).toFixed(1)} ${(y + s * 0.6).toFixed(1)}L${(x + s * 0.2).toFixed(1)} ${(y - s * 0.3).toFixed(1)}"/>`
  }).join('')
  const [vx, vy] = P(7.33, 48.36)

  const cities = ETAPES.map(e => {
    const [x, y] = pts[e.id]
    const lab = e.lab || [26, 8]
    const anchor = e.anchor || 'start'
    const hot = focus !== 'all' && focus === e.id ? ' is-focus' : ''
    if (e.off) {
      return `<g class="rt-city rt-off${hot}" data-city="${e.id}"><path class="rt-arrow" d="M58 ${y}L8 ${y}M24 ${y - 14}L8 ${y}L24 ${y + 14}"/><text x="70" y="${y - 22}" class="rt-name">${e.name}</text><text x="70" y="${y + 6}" class="rt-years">${e.years}</text><text x="70" y="${y + 32}" class="rt-desc">${e.desc}</text></g>`
    }
    return `<g class="rt-city${hot}" data-city="${e.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle class="rt-ring" r="17"/><circle class="rt-dot" r="7"/><text x="${lab[0]}" y="${lab[1] - 26}" class="rt-name" text-anchor="${anchor}">${e.name}</text><text x="${lab[0]}" y="${lab[1]}" class="rt-years" text-anchor="${anchor}">${e.years}</text><text x="${lab[0]}" y="${lab[1] + 26}" class="rt-desc" text-anchor="${anchor}">${e.desc}</text></g>`
  }).join('')

  el.innerHTML = `<svg class="rt-svg" viewBox="0 0 1000 900" role="img" aria-labelledby="${el.id}-t"><title id="${el.id}-t">Croquis de route : Rueil-Malmaison, Saint-Dié-des-Vosges, Nancy, Metz, Strasbourg et Osthouse</title>
    <g class="rt-grid">${Array.from({ length: 9 }, (_, i) => `<line x1="0" x2="1000" y1="${i * 100 + 50}" y2="${i * 100 + 50}"/>`).join('')}</g>
    <g class="rt-geo">${rivers}${mountains}<text class="rt-region" x="${vx.toFixed(0)}" y="${vy.toFixed(0)}">Vosges</text><text class="rt-region rt-de" x="975" y="820">Allemagne</text></g>
    <path class="rt-route" d="${route}"/>
    <g class="rt-cities">${cities}</g>
  </svg>`
  return el.querySelector('.rt-route')
}
