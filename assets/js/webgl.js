/* Trame offset en WebGL (OGL) : la photo naît de points d'imprimerie,
   une loupe révèle la trame sous le curseur. Repli : l'image reste une simple <img>. */
import { Renderer } from '../vendor/ogl/core/Renderer.js'
import { Program } from '../vendor/ogl/core/Program.js'
import { Mesh } from '../vendor/ogl/core/Mesh.js'
import { Texture } from '../vendor/ogl/core/Texture.js'
import { Triangle } from '../vendor/ogl/extras/Triangle.js'

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`

const common = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uCell;
uniform vec3 uPaper;
uniform vec3 uInk;
const float A = 0.2618;
vec2 rot(vec2 p) { float c = cos(A), s = sin(A); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
vec2 unrot(vec2 p) { float c = cos(A), s = sin(A); return vec2(c * p.x + s * p.y, -s * p.x + c * p.y); }
`

const photoFrag = common + /* glsl */ `
uniform sampler2D tMap;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform float uIntro;
uniform float uScroll;
uniform vec2 uMouse;
uniform float uHover;
vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return uv * s + (1.0 - s) * uFocus;
}
void main() {
  vec2 px = vUv * uRes;
  vec2 rp = rot(px);
  vec2 cc = (floor(rp / uCell) + 0.5) * uCell;
  vec2 cUv = clamp(unrot(cc) / uRes, 0.0, 1.0);
  vec3 cs = texture2D(tMap, cover(cUv)).rgb;
  float lum = dot(cs, vec3(0.299, 0.587, 0.114));
  float grow = smoothstep(0.0, 0.55, uIntro);
  float r = (1.05 - lum) * uCell * 0.74 * grow;
  float d = length(rp - cc);
  float dotA = 1.0 - smoothstep(r - 0.8, r + 0.8, d);
  vec3 halftone = mix(uPaper, uInk, dotA);
  vec3 photo = texture2D(tMap, cover(vUv)).rgb;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float lens = (1.0 - smoothstep(0.09, 0.22, length((vUv - uMouse) * asp))) * uHover;
  float reveal = smoothstep(0.42, 1.0, uIntro) * (1.0 - uScroll);
  float m = clamp(reveal - lens, 0.0, 1.0);
  gl_FragColor = vec4(mix(halftone, photo, m), 1.0);
}`

const fieldFrag = common + /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uRed;
uniform vec3 uBlue;
float field(vec2 p) {
  return 0.5 + 0.25 * sin(p.x * 2.1 + uTime * 0.35) * cos(p.y * 1.7 - uTime * 0.27)
       + 0.18 * sin((p.x + p.y) * 3.3 + uTime * 0.21) + 0.12 * cos(length(p - vec2(0.8, 0.4)) * 5.0 - uTime * 0.5);
}
float layer(vec2 px, float ang, float cell, float shift) {
  float c = cos(ang), s = sin(ang);
  vec2 rp = vec2(c * px.x - s * px.y, s * px.x + c * px.y);
  vec2 cc = (floor(rp / cell) + 0.5) * cell;
  vec2 back = vec2(c * cc.x + s * cc.y, -s * cc.x + c * cc.y);
  vec2 uv = back / uRes.y;
  float v = clamp(field(uv * 1.6 + shift), 0.0, 1.0);
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float m = 1.0 - smoothstep(0.0, 0.32, length((back / uRes - uMouse) * asp));
  float r = cell * 0.62 * clamp(v + m * 0.45, 0.0, 1.0);
  return 1.0 - smoothstep(r - 0.8, r + 0.8, length(rp - cc));
}
void main() {
  vec2 px = vUv * uRes;
  float a = layer(px, 0.2618, uCell, 0.0);
  float b = layer(px + 2.0, 1.309, uCell, 1.7);
  float c = layer(px + 4.0, 0.7854, uCell * 1.4, 3.1);
  vec3 col = uPaper;
  col = mix(col, col * uBlue, a * 0.85);
  col = mix(col, col * uRed, b * 0.55);
  col = mix(col, col * uInk, c * 0.65);
  gl_FragColor = vec4(col, 1.0);
}`

const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255] }
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

function makeRenderer(canvas) {
  const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: false, antialias: false })
  return renderer
}

export function initHalftonePhoto(wrap, gsap, onReady) {
  const img = wrap.querySelector('img')
  const canvas = document.createElement('canvas')
  canvas.className = 'gl-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  let renderer
  try { renderer = makeRenderer(canvas) } catch (e) { return null }
  const gl = renderer.gl
  if (!gl) return null
  wrap.appendChild(canvas)
  const focus = (wrap.dataset.focus || '0.5 0.5').split(' ').map(Number)
  const uniforms = {
    tMap: { value: new Texture(gl, { generateMipmaps: false }) },
    uRes: { value: [1, 1] }, uImg: { value: [img.naturalWidth || 3, img.naturalHeight || 2] },
    uFocus: { value: [focus[0], 1 - focus[1]] },
    uCell: { value: 9 }, uIntro: { value: 0 }, uScroll: { value: 0 },
    uMouse: { value: [0.5, 0.5] }, uHover: { value: 0 },
    uPaper: { value: hex(css('--paper') || '#EFEADF') }, uInk: { value: hex(css('--bic') || '#2443A6') },
  }
  const program = new Program(gl, { vertex, fragment: photoFrag, uniforms })
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
  let dirty = true, visible = true
  const resize = () => {
    const r = wrap.getBoundingClientRect()
    renderer.setSize(r.width, r.height)
    uniforms.uRes.value = [r.width * renderer.dpr, r.height * renderer.dpr]
    uniforms.uCell.value = Math.max(7, Math.round(r.width / 95)) * renderer.dpr
    dirty = true
  }
  const render = () => { if (dirty && visible) { renderer.render({ scene: mesh }); dirty = false } }
  const source = new Image()
  source.decoding = 'async'
  source.onload = () => {
    uniforms.tMap.value.image = source
    uniforms.uImg.value = [source.naturalWidth, source.naturalHeight]
    resize()
    gsap.ticker.add(render)
    wrap.classList.add('gl-on')
    dirty = true
    onReady && onReady(api)
  }
  source.src = img.currentSrc || img.src
  new ResizeObserver(resize).observe(wrap)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true }).observe(wrap)
  const fine = window.matchMedia('(pointer: fine)').matches
  if (fine) {
    const set = gsap.quickTo(uniforms.uHover, 'value', { duration: 0.5, ease: 'power3.out', onUpdate: () => { dirty = true } })
    const m = { x: 0.5, y: 0.5 }
    const sync = () => { uniforms.uMouse.value = [m.x, m.y]; dirty = true }
    const mx = gsap.quickTo(m, 'x', { duration: 0.4, ease: 'power3.out', onUpdate: sync })
    const my = gsap.quickTo(m, 'y', { duration: 0.4, ease: 'power3.out', onUpdate: sync })
    wrap.addEventListener('pointermove', e => {
      const r = wrap.getBoundingClientRect()
      mx((e.clientX - r.left) / r.width); my(1 - (e.clientY - r.top) / r.height); set(1)
    })
    wrap.addEventListener('pointerleave', () => set(0))
  }
  const api = {
    uniforms,
    intro(duration = 1.8, delay = 0) {
      return gsap.fromTo(uniforms.uIntro, { value: 0 }, { value: 1, duration, delay, ease: 'power2.inOut', onUpdate: () => { dirty = true } })
    },
    setIntro(v) { uniforms.uIntro.value = v; dirty = true },
    setScroll(v) { uniforms.uScroll.value = v; dirty = true },
  }
  return api
}

export function initTrameField(wrap, gsap) {
  const canvas = document.createElement('canvas')
  canvas.className = 'gl-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  let renderer
  try { renderer = makeRenderer(canvas) } catch (e) { return null }
  const gl = renderer.gl
  if (!gl) return null
  wrap.appendChild(canvas)
  const uniforms = {
    uRes: { value: [1, 1] }, uCell: { value: 14 }, uTime: { value: 0 }, uMouse: { value: [0.7, 0.4] },
    uPaper: { value: hex(css('--paper') || '#EFEADF') }, uInk: { value: hex(css('--ink-soft') || '#4B4840') },
    uBlue: { value: hex(css('--bic-soft') || '#5B73C2') }, uRed: { value: hex(css('--red-soft') || '#E08A78') },
  }
  const program = new Program(gl, { vertex, fragment: fieldFrag, uniforms })
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
  let visible = true
  const resize = () => {
    const r = wrap.getBoundingClientRect()
    renderer.setSize(r.width, r.height)
    uniforms.uRes.value = [r.width * renderer.dpr, r.height * renderer.dpr]
    uniforms.uCell.value = Math.max(10, Math.round(r.width / 70)) * renderer.dpr
  }
  resize()
  new ResizeObserver(resize).observe(wrap)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }).observe(wrap)
  const m = { x: 0.7, y: 0.4 }
  const sync = () => { uniforms.uMouse.value = [m.x, m.y] }
  const mx = gsap.quickTo(m, 'x', { duration: 0.8, ease: 'power3.out', onUpdate: sync })
  const my = gsap.quickTo(m, 'y', { duration: 0.8, ease: 'power3.out', onUpdate: sync })
  wrap.addEventListener('pointermove', e => {
    const r = wrap.getBoundingClientRect()
    mx((e.clientX - r.left) / r.width); my(1 - (e.clientY - r.top) / r.height)
  })
  let last = 0
  gsap.ticker.add(t => {
    if (!visible) return
    if (t - last < 1 / 45) return
    last = t
    uniforms.uTime.value = t
    renderer.render({ scene: mesh })
  })
  wrap.classList.add('gl-on')
  return { uniforms }
}
