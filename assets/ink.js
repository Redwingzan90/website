/* KORR — the recording stamp.
 *
 * The one authored motion moment on this site: an oxblood stamp impressing
 * into paper. A single fullscreen fragment shader does the work — paper-fibre
 * warp, an irregular pressure front spreading from the centre, tooth breakup
 * where ink skips the raised fibres, and pooling at the edges of the plate.
 *
 * Deliberately 2D. A terrain scene would cost this audience — largely rural,
 * largely on phones — far more than it returns. This is ~1 draw call.
 *
 * Falls back to a static CSS impression when WebGL2 is unavailable, and
 * renders instantly (no animation) under prefers-reduced-motion.
 */
(function () {
  'use strict'

  const VERT = `#version 300 es
  in vec2 p; out vec2 v;
  void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`

  const FRAG = `#version 300 es
  precision highp float;
  in vec2 v; out vec4 o;
  uniform sampler2D uMask;
  uniform float uT;
  uniform vec3 uInk;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float s=0., a=.5;
    for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=.5; }
    return s;
  }

  void main(){
    vec2 uv = vec2(v.x, 1.0 - v.y);

    // paper fibre displaces the plate very slightly
    vec2 warp = (vec2(fbm(uv*23.+3.1), fbm(uv*23.+7.7)) - .5) * .013;
    vec2 suv = uv + warp;
    float m = texture(uMask, suv).a;

    // pressure front: spreads from the centre with an irregular edge
    float grain = fbm(uv*7.0);
    float front = uT*1.42 - distance(uv, vec2(.5)) + (grain-.5)*.17;
    float ink = smoothstep(0., .085, front) * m;

    // tooth — ink skips where the paper is raised
    float tooth = smoothstep(.40, .80, fbm(uv*104.));
    ink *= mix(1., .58, tooth);

    // ink pools at the edge of the impression
    float edge = max(m - texture(uMask, suv + vec2(.0045)).a, 0.);
    ink += edge * .55 * smoothstep(0., .25, uT) * m;

    // a couple of dry patches, as a real stamp leaves
    ink *= mix(1., smoothstep(.18, .55, fbm(uv*4.2+11.)), .28);

    o = vec4(uInk, clamp(ink, 0., 1.) * .93);
  }`

  function buildMask (size, lines) {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const x = c.getContext('2d')
    const C = size / 2

    // Ring geometry. Everything is fitted inside INNER so no glyph can run
    // past the rule or off the plate once the whole mark is rotated.
    const OUTER = size * 0.435
    const INNER = size * 0.395

    x.translate(C, C)
    x.rotate(-7 * Math.PI / 180)
    x.translate(-C, -C)

    x.strokeStyle = '#000'
    x.fillStyle = '#000'
    x.textAlign = 'center'
    x.textBaseline = 'middle'

    x.lineWidth = size * 0.017
    x.beginPath(); x.arc(C, C, OUTER, 0, Math.PI * 2); x.stroke()
    x.lineWidth = size * 0.007
    x.beginPath(); x.arc(C, C, INNER, 0, Math.PI * 2); x.stroke()

    // Width available on the chord at a given vertical offset from centre.
    const chord = (dy) => {
      const h = Math.abs(dy)
      if (h >= INNER) return 0
      return 2 * Math.sqrt(INNER * INNER - h * h) * 0.88   // 12% breathing room
    }

    // Draw a line at its ideal size, shrinking only as far as it must to fit.
    const line = (text, dyFrac, weight, sizeFrac, minFrac) => {
      const dy = size * dyFrac
      const max = chord(dy + size * sizeFrac * 0.5)   // measure at the glyph's widest edge
      let px = size * sizeFrac
      const floor = size * (minFrac || sizeFrac * 0.6)
      const font = (p) => `${weight} ${p.toFixed(1)}px "Courier Prime","Courier New",monospace`
      x.font = font(px)
      let w = x.measureText(text).width
      if (w > max) {
        px = Math.max(floor, px * (max / w))
        x.font = font(px)
        w = x.measureText(text).width
      }
      // Still too wide at the floor (very long county name) — condense it.
      if (w > max) {
        x.save()
        x.translate(C, C + dy); x.scale(max / w, 1); x.translate(-C, -(C + dy))
        x.fillText(text, C, C + dy)
        x.restore()
        return
      }
      x.fillText(text, C, C + dy)
    }

    line(lines[0], -0.175, 700, 0.082)
    line(lines[1], -0.006, 700, 0.112, 0.062)
    line(lines[2],  0.098, 400, 0.058, 0.040)
    line(lines[3],  0.175, 400, 0.058, 0.040)

    // separating rules, kept inside the inner ring
    x.lineWidth = size * 0.005
    const rule = (dyFrac) => {
      const dy = size * dyFrac
      const half = chord(dy) / 2 * 0.80
      x.beginPath()
      x.moveTo(C - half, C + dy); x.lineTo(C + half, C + dy); x.stroke()
    }
    rule(-0.108)
    rule(0.048)

    return c
  }

  function mount (slot) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const cv = document.createElement('canvas')
    cv.setAttribute('aria-hidden', 'true')
    const gl = cv.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false })
    if (!gl) return false                      // keep the static impression

    const box = slot.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)   // fill rate, not vanity
    const S = Math.max(160, Math.round(box.width))
    cv.width = cv.height = Math.round(S * dpr)

    const sh = (t, src) => {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
      return s
    }
    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    } catch (e) { return false }

    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const mask = buildMask(512, [
      slot.dataset.l1 || 'RECORDED',
      slot.dataset.l2 || 'KORR BUILDING CO',
      slot.dataset.l3 || 'MARICOPA COUNTY · ARIZONA',
      slot.dataset.l4 || 'SELLER FINANCED',
    ])
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask)

    gl.viewport(0, 0, cv.width, cv.height)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniform1i(gl.getUniformLocation(prog, 'uMask'), 0)
    gl.uniform3f(gl.getUniformLocation(prog, 'uInk'), 0.549, 0.184, 0.157) // #8c2f28
    const uT = gl.getUniformLocation(prog, 'uT')

    slot.appendChild(cv)
    slot.dataset.live = '1'

    const draw = (t) => {
      gl.uniform1f(uT, t)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    if (reduce) { draw(1); return true }        // present, but not animated

    // Impress once, when it is actually on screen.
    let done = false
    const run = () => {
      if (done) return
      done = true
      const D = 1050, t0 = performance.now()
      const tick = (now) => {
        const k = Math.min((now - t0) / D, 1)
        draw(1 - Math.pow(1 - k, 3))           // exponential ease-out
        if (k < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some(e => e.isIntersecting)) { run(); io.disconnect() }
      }, { threshold: 0.25 })
      io.observe(slot)
    } else run()

    return true
  }

  // buildMask is exposed so the plate can be measured in a test.
  window.KORR_INK = { mount, buildMask }
})()
