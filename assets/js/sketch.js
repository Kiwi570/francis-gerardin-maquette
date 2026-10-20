/* Croquis provisoires à l'encre, dessinés en code en attendant les images Grok.
   Chaque scène est composée de traits légèrement tremblés, comme au stylo bille. */

const W = 480, H = 360

function makeRng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h) || 1
}

class Pen {
  constructor(seed) { this.r = makeRng(seed); this.parts = []; this.defs = []; this.clipId = 0; this.uid = seed.toString(36) }
  j(a = 1.6) { return (this.r() - 0.5) * 2 * a }
  seg(x1, y1, x2, y2, a = 1.4) {
    const mx = (x1 + x2) / 2 + this.j(a * 1.3), my = (y1 + y2) / 2 + this.j(a * 1.3)
    return `M${(x1 + this.j(a)).toFixed(1)} ${(y1 + this.j(a)).toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${(x2 + this.j(a)).toFixed(1)} ${(y2 + this.j(a)).toFixed(1)}`
  }
  line(x1, y1, x2, y2, o = {}) {
    const d = this.seg(x1, y1, x2, y2, o.a ?? 1.4) + (o.single ? '' : this.seg(x1, y1, x2, y2, (o.a ?? 1.4) * 0.8))
    this.parts.push(this.path(d, o))
    return this
  }
  path(d, o = {}) {
    const cls = o.cls || 'k'
    return `<path class="${cls}" d="${d}"${o.clip ? ` clip-path="url(#${o.clip})"` : ''}/>`
  }
  poly(pts, o = {}) {
    for (let i = 0; i < pts.length - 1; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o)
    if (o.close) this.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], o)
    return this
  }
  rect(x, y, w, h, o = {}) {
    if (o.fill) this.hatchRect(x, y, w, h, o.fill)
    return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true })
  }
  ellipse(cx, cy, rx, ry, o = {}) {
    if (o.fill) this.hatchEllipse(cx, cy, rx, ry, o.fill)
    const n = Math.max(14, Math.round((rx + ry) / 3))
    const passes = o.single ? 1 : 2
    for (let p = 0; p < passes; p++) {
      const start = this.r() * Math.PI * 2
      let d = ''
      for (let i = 0; i <= n + 1; i++) {
        const t = start + (i / n) * Math.PI * 2
        const x = cx + Math.cos(t) * (rx + this.j(rx * 0.04 + 0.6)), y = cy + Math.sin(t) * (ry + this.j(ry * 0.04 + 0.6))
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
      }
      this.parts.push(this.path(d, o))
    }
    return this
  }
  arc(cx, cy, rx, ry, a0, a1, o = {}) {
    const n = 18
    let d = ''
    for (let i = 0; i <= n; i++) {
      const t = a0 + (a1 - a0) * (i / n)
      d += (i ? 'L' : 'M') + (cx + Math.cos(t) * rx + this.j(0.8)).toFixed(1) + ' ' + (cy + Math.sin(t) * ry + this.j(0.8)).toFixed(1)
    }
    this.parts.push(this.path(d, o))
    return this
  }
  clip(shape) {
    const id = `c${this.uid}${this.clipId++}`
    this.defs.push(`<clipPath id="${id}">${shape}</clipPath>`)
    return id
  }
  hatch(clip, bbox, f) {
    const gap = f.gap ?? 7, ang = (f.angle ?? -35) * Math.PI / 180, cls = f.cls || 'h'
    const [x, y, w, h] = bbox, cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2 + 4
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx
    let d = ''
    for (let s = -R; s <= R; s += gap) {
      const px = cx + nx * s, py = cy + ny * s
      d += this.seg(px - dx * R, py - dy * R, px + dx * R, py + dy * R, 1.1)
    }
    this.parts.push(`<path class="${cls}" d="${d}" clip-path="url(#${clip})"/>`)
  }
  hatchRect(x, y, w, h, f) { this.hatch(this.clip(`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`), [x, y, w, h], f) }
  hatchEllipse(cx, cy, rx, ry, f) { this.hatch(this.clip(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`), [cx - rx, cy - ry, rx * 2, ry * 2], f) }
  hatchPoly(pts, f) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const x = Math.min(...xs), y = Math.min(...ys)
    this.hatch(this.clip(`<polygon points="${pts.map(p => p.join(',')).join(' ')}"/>`), [x, y, Math.max(...xs) - x, Math.max(...ys) - y], f)
  }
  svg(label) {
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${this.defs.join('')}</defs>${this.parts.join('')}</svg>`
  }
}

/* --- éléments réutilisables --- */
function chair(p, x, y, s = 1, o = {}) {
  p.rect(x, y, 22 * s, 4 * s, o)
  p.line(x + 2 * s, y, x + 2 * s, y - 22 * s, o)
  p.line(x + 20 * s, y, x + 20 * s, y - 22 * s, o)
  p.line(x + 2 * s, y - 22 * s, x + 20 * s, y - 22 * s, o)
  p.line(x + 2 * s, y + 4 * s, x + 2 * s, y + 20 * s, o)
  p.line(x + 20 * s, y + 4 * s, x + 20 * s, y + 20 * s, o)
}
function tableMic(p, x, y, s = 1) {
  p.ellipse(x, y, 7 * s, 3 * s, { fill: { gap: 3, cls: 'h' }, single: true })
  p.line(x, y, x + 10 * s, y - 26 * s)
  p.ellipse(x + 11 * s, y - 31 * s, 4 * s, 6 * s, { fill: { gap: 2.4, cls: 'h' }, single: true })
}
function head(p, x, y, s = 1) {
  p.ellipse(x, y, 13 * s, 15 * s, { fill: { gap: 3.2, angle: 50, cls: 'hd' }, single: true })
  p.arc(x, y + 34 * s, 28 * s, 22 * s, Math.PI, Math.PI * 2, {})
  p.hatchEllipse(x, y + 36 * s, 27 * s, 20 * s, { gap: 3.2, angle: 50, cls: 'hd' })
}
function cup(p, x, y, s = 1) {
  p.ellipse(x, y, 16 * s, 16 * s)
  p.ellipse(x, y, 11 * s, 11 * s, { fill: { gap: 2.6, angle: 20, cls: 'hd' }, single: true })
  p.arc(x + 18 * s, y, 6 * s, 5 * s, -1.3, 1.3)
}
function notebook(p, x, y, w, h) {
  p.rect(x, y, w / 2, h).rect(x + w / 2, y, w / 2, h)
  for (let i = 1; i < 7; i++) {
    const ly = y + (h / 7) * i
    p.line(x + 8, ly, x + w / 2 - 8, ly, { cls: 'r', single: true, a: 0.6 })
    p.line(x + w / 2 + 8, ly, x + w - 8, ly, { cls: 'r', single: true, a: 0.6 })
  }
  p.line(x + 16, y + 4, x + 16, y + h - 4, { cls: 'm', single: true, a: 0.5 })
}
function pen(p, x, y, len, ang) {
  const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len, nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4
  p.poly([[x + nx, y + ny], [x + dx + nx, y + dy + ny], [x + dx - nx, y + dy - ny], [x - nx, y - ny]], { close: true })
  p.line(x, y, x - Math.cos(ang) * 14, y - Math.sin(ang) * 14)
  p.hatchPoly([[x + dx * 0.7 + nx, y + dy * 0.7 + ny], [x + dx + nx, y + dy + ny], [x + dx - nx, y + dy - ny], [x + dx * 0.7 - nx, y + dy * 0.7 - ny]], { gap: 2.2, cls: 'hb' })
}
function windowPanes(p, x, y, w, h, cols = 2) {
  p.rect(x, y, w, h)
  for (let i = 1; i < cols; i++) p.line(x + (w / cols) * i, y, x + (w / cols) * i, y + h, { single: true })
  p.line(x, y + h / 2, x + w, y + h / 2, { single: true })
  p.hatchRect(x + 4, y + 4, w - 8, h - 8, { gap: 11, angle: 60, cls: 'hl' })
}
function tree(p, x, y, s = 1) {
  p.poly([[x, y - 70 * s], [x - 22 * s, y - 10 * s], [x + 22 * s, y - 10 * s]], { close: true })
  p.hatchPoly([[x, y - 70 * s], [x - 22 * s, y - 10 * s], [x + 22 * s, y - 10 * s]], { gap: 3.4, angle: 70, cls: 'hd' })
  p.line(x, y - 10 * s, x, y)
}
function lectern(p, x, y, s = 1) {
  p.poly([[x - 26 * s, y], [x + 26 * s, y], [x + 18 * s, y - 70 * s], [x - 18 * s, y - 70 * s]], { close: true })
  p.hatchPoly([[x - 26 * s, y], [x + 26 * s, y], [x + 18 * s, y - 70 * s], [x - 18 * s, y - 70 * s]], { gap: 5, cls: 'hb' })
  p.rect(x - 30 * s, y - 78 * s, 60 * s, 8 * s)
  p.line(x + 10 * s, y - 78 * s, x + 4 * s, y - 104 * s)
  p.ellipse(x + 3 * s, y - 109 * s, 4 * s, 6 * s, { fill: { gap: 2.2 }, single: true })
}
function rowsOfChairs(p, x0, y0, n, rows, s, dx, dy) {
  for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) chair(p, x0 + i * dx * s - r * 6, y0 + r * dy, s * (1 + r * 0.12))
}
function spiralBinding(p, x, y, w) { for (let i = 0; i < w / 18; i++) p.ellipse(x + i * 18 + 9, y, 5, 7, { single: true }) }

/* --- scènes --- */
const SCENES = {
  bureau(p) {
    notebook(p, 120, 110, 220, 150)
    pen(p, 360, 250, 110, -2.2)
    p.ellipse(410, 90, 22, 30, { fill: { gap: 3, cls: 'h' } })
    p.line(392, 112, 330, 190); p.line(398, 116, 336, 194)
    cup(p, 70, 80, 1.3)
    p.rect(40, 220, 70, 46, {}); p.rect(52, 230, 70, 46, { fill: { gap: 9, angle: 10, cls: 'hl' } })
    p.rect(250, 28, 130, 54, { fill: { gap: 6, angle: 0, cls: 'hl' } })
  },
  scene(p) {
    p.line(0, 210, 480, 210)
    p.poly([[100, 0], [60, 210], [180, 210]], { close: false }); p.hatchPoly([[100, 0], [40, 210], [200, 210]], { gap: 13, angle: 75, cls: 'hl' })
    p.poly([[380, 0], [300, 210], [420, 210]], {}); p.hatchPoly([[380, 0], [280, 210], [440, 210]], { gap: 13, angle: 105, cls: 'hl' })
    p.rect(110, 160, 260, 12, { fill: { gap: 4, cls: 'hb' } })
    p.line(124, 172, 124, 208); p.line(356, 172, 356, 208)
    for (let i = 0; i < 4; i++) { chair(p, 132 + i * 60, 150, 0.9); tableMic(p, 150 + i * 60, 160, 0.8) }
    for (let i = 0; i < 6; i++) head(p, 40 + i * 82 + (i % 2) * 10, 280 + (i % 2) * 12, 1.3)
  },
  pupitre(p) {
    windowPanes(p, 40, 30, 90, 130, 2); windowPanes(p, 350, 30, 90, 130, 2)
    lectern(p, 240, 220, 1.2)
    rowsOfChairs(p, 30, 270, 7, 2, 1, 64, 50)
  },
  cercle(p) {
    windowPanes(p, 60, 20, 110, 100, 3); windowPanes(p, 310, 20, 110, 100, 3)
    p.line(0, 150, 480, 150)
    for (let i = 0; i < 9; i++) {
      const t = (i / 9) * Math.PI * 2, x = 240 + Math.cos(t) * 160, y = 245 + Math.sin(t) * 62
      chair(p, x - 11, y, 0.85 + Math.sin(t) * 0.18)
    }
    p.ellipse(240, 250, 70, 24, { cls: 'r', single: true })
  },
  fauteuils(p) {
    windowPanes(p, 170, 20, 140, 160, 2)
    const arm = (x, flip) => {
      p.rect(x, 220, 100, 50, { fill: { gap: 6, cls: 'hb' } })
      p.rect(x + (flip ? 80 : 0), 150, 20, 120)
      p.rect(x + (flip ? 0 : 20), 160, 80, 60)
      p.line(x + 6, 270, x + 6, 300); p.line(x + 94, 270, x + 94, 300)
    }
    arm(40, false); arm(340, true)
    p.ellipse(240, 250, 40, 10); p.line(240, 260, 240, 300); p.rect(220, 236, 34, 8, { fill: { gap: 3 } })
    p.line(150, 300, 150, 230); p.ellipse(150, 210, 26, 30, { fill: { gap: 5, angle: 70, cls: 'hd' } })
  },
  chemin(p) {
    p.ellipse(250, 150, 60, 40, { cls: 'r', single: true })
    p.hatchEllipse(250, 150, 58, 38, { gap: 12, angle: 0, cls: 'hl' })
    for (let i = 0; i < 7; i++) { tree(p, 20 + i * 30, 330 - i * 22, 1.1 - i * 0.08); tree(p, 460 - i * 30, 330 - i * 22, 1.1 - i * 0.08) }
    p.poly([[150, 360], [222, 190], [236, 170]], {}); p.poly([[330, 360], [262, 190], [252, 170]], {})
    p.hatchPoly([[150, 360], [236, 170], [252, 170], [330, 360]], { gap: 12, angle: 0, cls: 'hl' })
  },
  temps(p) {
    p.line(0, 200, 480, 200)
    p.rect(150, 160, 180, 40, { fill: { gap: 5, angle: -10, cls: 'hb' } })
    p.line(250, 160, 262, 214, { cls: 'm' }); p.line(262, 214, 256, 226, { cls: 'm' })
    pen(p, 170, 150, 140, -0.05)
    p.hatchPoly([[150, 200], [330, 200], [480, 300], [250, 320]], { gap: 6, angle: 20, cls: 'hd' })
    p.hatchPoly([[0, 40], [140, 40], [220, 200], [0, 200]], { gap: 14, angle: 60, cls: 'hl' })
  },
  carnet(p) {
    notebook(p, 90, 90, 260, 180)
    pen(p, 300, 300, 140, -0.5)
    cup(p, 400, 100, 1.4)
    p.hatchPoly([[0, 0], [200, 0], [60, 360], [0, 360]], { gap: 16, angle: 75, cls: 'hl' })
  },
  dialogue(p) {
    p.line(0, 300, 480, 300)
    const ch = (x, flip) => {
      const f = flip ? -1 : 1
      p.line(x, 300, x, 230); p.line(x + 60 * f, 300, x + 60 * f, 230)
      p.rect(Math.min(x, x + 60 * f), 222, 60, 10, { fill: { gap: 3, cls: 'hb' } })
      p.line(x, 222, x - 6 * f, 140); p.line(x - 6 * f, 140, x + 10 * f, 140)
    }
    ch(110, false); ch(370, true)
    p.ellipse(240, 210, 50, 10); p.line(240, 220, 240, 300)
    p.rect(214, 192, 16, 18, {}); p.rect(250, 192, 16, 18, {})
    p.arc(222, 182, 6, 6, Math.PI, Math.PI * 2, { cls: 'hl' }); p.arc(258, 182, 6, 6, Math.PI, Math.PI * 2, { cls: 'hl' })
    p.line(150, 190, 190, 176, { cls: 'm' }); p.line(330, 176, 296, 190, { cls: 'm' })
  },
  notes(p) {
    for (let i = 0; i < 4; i++) p.rect(60 + i * 8, 80 + i * 8, 170, 110, { fill: i === 3 ? { gap: 10, angle: 0, cls: 'r' } : null })
    p.rect(260, 70, 170, 220, {})
    for (let i = 0; i < 12; i++) p.line(276, 92 + i * 16, 414 - (i % 3) * 30, 92 + i * 16, { cls: 'r', single: true, a: 0.5 })
    p.hatchRect(276, 124, 110, 10, { gap: 2.4, angle: 0, cls: 'hy' }); p.hatchRect(276, 188, 90, 10, { gap: 2.4, angle: 0, cls: 'hy' })
    p.ellipse(130, 280, 40, 40); p.line(130, 280, 130, 252, { cls: 'm' }); p.line(130, 280, 150, 288, {}); p.rect(122, 228, 16, 12)
    pen(p, 230, 320, 120, -0.35)
  },
  conference(p) {
    p.rect(150, 30, 260, 150, { fill: { gap: 10, angle: 45, cls: 'hl' } })
    lectern(p, 100, 250, 1.1)
    rowsOfChairs(p, 120, 300, 6, 1, 1.1, 60, 40)
  },
  debat(p) {
    p.line(0, 240, 480, 240)
    p.rect(150, 196, 180, 10, { fill: { gap: 3, cls: 'hb' } }); p.line(160, 206, 160, 240); p.line(320, 206, 320, 240)
    tableMic(p, 185, 196, 1.1); tableMic(p, 240, 196, 1.1); tableMic(p, 295, 196, 1.1)
    chair(p, 70, 200, 1.4); chair(p, 380, 200, 1.4)
    p.hatchRect(0, 0, 480, 120, { gap: 9, angle: 0, cls: 'hd' })
  },
  forum(p) {
    p.line(0, 150, 480, 150)
    for (let i = 0; i < 4; i++) {
      const x = 20 + i * 120, s = 1
      p.rect(x, 160, 90 * s, 60 * s); p.poly([[x - 6, 160], [x + 45, 130], [x + 96, 160]], {})
      p.hatchPoly([[x - 6, 160], [x + 45, 130], [x + 96, 160]], { gap: 4, cls: 'hb' })
    }
    for (let i = 0; i < 5; i++) head(p, 60 + i * 92, 290 + (i % 2) * 14, 1)
  },
  'table-ronde'(p) {
    p.ellipse(240, 180, 110, 110, { fill: { gap: 9, angle: 30, cls: 'hl' } })
    for (let i = 0; i < 5; i++) {
      const t = (i / 5) * Math.PI * 2 - Math.PI / 2, x = 240 + Math.cos(t) * 145, y = 180 + Math.sin(t) * 145
      p.rect(x - 22, y - 22, 44, 44, { fill: { gap: 4, cls: 'hb' } })
      const mx = 240 + Math.cos(t) * 85, my = 180 + Math.sin(t) * 85
      p.ellipse(mx, my, 6, 6, { fill: { gap: 2 }, single: true }); p.line(mx, my, 240 + Math.cos(t) * 62, 180 + Math.sin(t) * 62)
      p.rect(240 + Math.cos(t) * 70 - 10, 180 + Math.sin(t) * 70 - 7, 20, 14, {})
    }
  },
  sport(p) {
    for (let i = 0; i < 6; i++) p.line(0, 40 + i * 14, 480, 30 + i * 14, { single: true })
    p.ellipse(240, 230, 260, 70, {}); p.ellipse(240, 230, 220, 50, { single: true })
    p.line(0, 150, 480, 140)
    p.line(330, 360, 300, 250); p.ellipse(296, 236, 12, 18, { fill: { gap: 2.6 } })
    p.line(0, 330, 480, 320); p.line(0, 336, 480, 326)
  },
  livres(p) {
    for (let i = 0; i < 5; i++) p.rect(60 + (i % 2) * 6, 250 - i * 26, 140, 26, { fill: i % 2 ? { gap: 5, angle: 90, cls: 'hb' } : null })
    for (let i = 0; i < 3; i++) p.rect(220 + (i % 2) * 8, 250 - i * 30, 120, 30, { fill: i === 1 ? { gap: 5, angle: 90, cls: 'r' } : null })
    cup(p, 390, 240, 1.3); cup(p, 400, 160, 1)
    tableMic(p, 300, 300, 1.2)
    p.line(0, 276, 480, 276)
  },
  salle(p) {
    rowsOfChairs(p, 40, 250, 4, 2, 1, 70, 52)
    for (let i = 0; i < 3; i++) chair(p, 330 + i * 26, 250 - i * 30, 0.9)
    p.line(420, 300, 420, 70); p.line(400, 300, 420, 260); p.line(440, 300, 420, 260)
    p.rect(396, 50, 48, 30, { fill: { gap: 3, cls: 'hd' } })
    p.poly([[30, 340], [120, 320], [200, 345], [300, 330]], { cls: 'k' })
  },
  repet(p) {
    p.line(0, 300, 480, 300)
    for (let i = 0; i < 6; i++) {
      const x = 50 + i * 76, lean = (i % 2 ? 1 : -1) * 12
      p.line(x, 300, x + lean, 190); p.line(x + 26, 300, x + 18 + lean, 190)
      p.rect(x - 6 + lean, 110, 44, 84, { fill: { gap: 5, angle: 60, cls: i % 3 === 0 ? 'hb' : 'hd' } })
      p.line(x - 6 + lean, 130, x - 30 + lean * 2, 170 - (i % 2) * 50); p.line(x + 38 + lean, 130, x + 60 + lean, 170 - ((i + 1) % 2) * 50)
    }
  },
  confiance(p) {
    p.line(0, 300, 480, 300)
    p.ellipse(240, 70, 20, 24, { fill: { gap: 3, angle: 50, cls: 'hd' } })
    p.rect(214, 96, 52, 110, { fill: { gap: 5, angle: 60, cls: 'hb' } })
    p.line(214, 110, 160, 70); p.line(266, 110, 320, 70)
    p.line(226, 206, 216, 300); p.line(254, 206, 266, 300)
    for (let i = 0; i < 5; i++) { const x = 40 + i * 100; chair(p, x, 330, 0.9); head(p, x + 10, 300, 0.55) }
  },
  studio(p) {
    p.hatchRect(0, 0, 480, 360, { gap: 7, angle: 80, cls: 'hd' })
    p.rect(250, 170, 190, 30, { fill: { gap: 4, cls: 'hb' } }); p.line(260, 200, 250, 250); p.line(430, 200, 440, 250)
    p.poly([[300, 0], [250, 120], [400, 120]], {}); p.hatchPoly([[300, 0], [230, 160], [420, 160]], { gap: 11, angle: 100, cls: 'hl' })
    p.rect(60, 150, 120, 80, { fill: { gap: 4, angle: 30, cls: 'hb' } }); p.rect(30, 172, 30, 36, {}); p.ellipse(45, 190, 10, 12, {})
    p.line(120, 230, 120, 300); p.line(120, 300, 70, 340); p.line(120, 300, 170, 340); p.line(120, 300, 120, 345)
  },
  spot(p) {
    p.hatchRect(0, 0, 480, 360, { gap: 6, angle: 80, cls: 'hd' })
    p.poly([[240, 0], [130, 290], [350, 290]], {})
    p.ellipse(240, 290, 120, 30, {})
    p.hatchPoly([[240, 0], [120, 290], [360, 290]], { gap: 12, angle: 90, cls: 'hl' })
    chair(p, 190, 280, 1.2); chair(p, 262, 280, 1.2)
    for (let i = 0; i < 8; i++) p.line(0, 320 + i * 6, 480, 316 + i * 6, { single: true, cls: 'r', a: 0.5 })
  },
  formation(p) {
    windowPanes(p, 340, 30, 110, 130, 2)
    p.rect(110, 40, 150, 180, {}); p.line(130, 220, 100, 330); p.line(240, 220, 270, 330); p.line(185, 220, 185, 320)
    for (let i = 0; i < 5; i++) p.line(130, 80 + i * 26, 230 - i * 12, 80 + i * 26, { cls: 'r', single: true, a: 0.5 })
    for (let i = 0; i < 5; i++) { const t = Math.PI * (0.15 + i * 0.17); chair(p, 240 + Math.cos(t) * 200 - 10, 300 + Math.sin(t) * 30, 0.9) }
  },
  telephone(p) {
    p.rect(40, 200, 190, 120, { fill: null }); p.line(40, 200, 135, 262); p.line(230, 200, 135, 262)
    p.ellipse(340, 210, 80, 46, { fill: { gap: 6, angle: 10, cls: 'hb' } })
    p.ellipse(340, 210, 30, 30, {}); for (let i = 0; i < 8; i++) { const t = i * 0.7 - 2.6; p.ellipse(340 + Math.cos(t) * 22, 210 + Math.sin(t) * 22, 4, 4, { single: true }) }
    p.poly([[260, 160], [280, 130], [400, 130], [420, 160]], {}); p.hatchPoly([[260, 160], [280, 130], [400, 130], [420, 160]], { gap: 4, cls: 'hd' })
    pen(p, 60, 120, 150, 0.15)
    p.line(420, 240, 460, 330, { cls: 'm' })
  },
}

export function drawSketches(root = document) {
  root.querySelectorAll('[data-sketch]').forEach(el => {
    if (el.dataset.drawn) return
    const name = el.dataset.sketch
    const fn = SCENES[name]
    if (!fn) return
    const p = new Pen(hashString(name + (el.dataset.grok || '')))
    fn(p)
    const holder = document.createElement('div')
    holder.className = 'ph-art'
    holder.innerHTML = p.svg(el.dataset.label || 'Croquis provisoire')
    el.prepend(holder)
    el.dataset.drawn = '1'
  })
}

export { SCENES, Pen }
