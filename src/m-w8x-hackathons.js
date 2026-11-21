(function () {
  'use strict';
  /* ==========================================================================
     THE HACKATHONS, repainted: two gold cups on a low chowki
       M.w8x['hackathons'] = { draw(Z, o), ground(Z, o) }   (hooked in stage-well8k.js)
     Z is the cups' own frame: origin at the foot centre of the stand, y up is negative, 1 unit = 1 sheet unit.
     The hot box is x -96..96, y -115.2..0.

     Painted the way the folios are: every part laid solid with the stick (pastel, reach 1.5, two passes, the strokes
     run round the form), gold leaf laid over an ochre ground and stopped a hair short of the contour so the ground
     shows at a worn, broken edge, a thick-and-thin kajal contour pulled round each part as soon as it is laid, then
     the ornament set in counted rows along the form: beads, petals, enamel, pearls, white dots along the edges,
     a border inside each border, a small flower in each gap.  Every repeated unit is placed by hand: its size,
     angle and spacing change a little from one to the next.  No finger rubbing, no spatter, no scatter.
     The cups are seen a little from above, so every ring round them bows down at the front (TILT).
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = PI * 2, HALF = PI / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const TILT = 0.11;

  const C = {
    line: '#22140a',          // the contour: kajal warmed with umber
    chase: '#5a3410',         // lines chased into the gold
    bole: '#b47c22',          // the ochre laid under the leaf; it shows at the leaf's worn edge
    goldDeep: '#b8862a',      // a tint for gold in its own shadow (the back petals, the inside of the bowl)
    burnish: '#ffe6a0',       // a tint for the strip the agate has polished
    shell: '#d4a236',         // shell gold, rubbed over the leaf
    ruby: '#b8242c',
    enamel: '#c63d2f',
    emerald: '#1f7a4c',
    pearl: '#f7f0dc',
    white: '#fbf6e8',
    light: '#fff3c8',
    glaze: '#7a4a10',
    neel: '#22306a',
    neelTop: '#3a4f96',
    border: '#c0352a',
    green: '#2a7a4a',
    wood: '#5e2a24',
    woodLit: '#9a5a44',
    mari: ['#e88e1e', '#edc94b', '#e88e1e', '#d9661e', '#edc94b'],
    leaf: '#3f7a3a',
    rose: '#e8a0a4'
  };

  // a closed outline at a steady distance inside a shape (the folio's inset)
  function inset(Z, poly, d) {
    const n = poly.length, nrm = i => { const a = poly[(i - 3 + n) % n], b = poly[(i + 3) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
    let vote = 0;
    for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += Z.inside([poly], poly[i][0] + m[0] * 0.6, poly[i][1] + m[1] * 0.6) ? 1 : -1; }
    const sg = vote >= 0 ? 1 : -1;
    return poly.map((p, i) => { const m = nrm(i); return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d]; });
  }
  /* the edge of the leaf: inside the contour by d0..d1, the distance wandering slowly (a long and a short wave) the
     way leaf tears and the burnisher pushes it, so a thin broken thread of the ochre ground shows by the line */
  function brokenIn(Z, poly, d0, d1) {
    const pts = Z.resample(poly, 0.45, true), n = pts.length;
    if (n < 14) return poly;
    const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
    let vote = 0;
    for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += Z.inside([poly], pts[i][0] + m[0] * 0.5, pts[i][1] + m[1] * 0.5) ? 1 : -1; }
    const sg = vote >= 0 ? 1 : -1, p1 = Z.rr(0, TAU), p2 = Z.rr(0, TAU), w1 = Z.rr(2.6, 3.8), w2 = Z.rr(0.9, 1.3);
    return pts.map((p, i) => {
      const s = i * 0.45, t = clamp(0.5 + 0.32 * Math.sin(TAU * s / w1 + p1) + 0.2 * Math.sin(TAU * s / w2 + p2), 0, 1), d = lerp(d0, d1, t), m = nrm(i);
      return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d];
    });
  }
  // a tapering band round a centre line; wf(t) = half width
  function ribbon(cl, wf) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const poly = L.concat(R.slice().reverse()); poly.L = L; poly.R = R;
    return poly;
  }

  function kit(Z) {
    const rr = Z.rr;
    const lay = (poly, c, ang, w, o) => Z.fill(poly, 'pastel', c, Object.assign({ w: w || 2, p: 1, reach: 1.5, passes: 2, ang: ang || 0.4, turn: 0.22, cv: 0.012 }, o || {}));
    // gold leaf over an ochre ground, stopped short of the contour at a broken edge; tint darkens it for gold in its own shade
    const gild = (poly, ang, tint, o) => {
      o = o || {};
      lay(poly, tint ? Z.mix(C.bole, tint, 0.4) : C.bole, ang, 1.6);
      const lp = o.edge === false ? poly : brokenIn(Z, poly, o.d0 != null ? o.d0 : 0.24, o.d1 != null ? o.d1 : 0.7);
      Z.fill(lp, 'gold', tint || 'gold', { w: 1.3, p: 1, reach: 1.4, passes: 2, ang: (ang || 0.4) + 0.3, turn: 0.25 });
      // shell gold rubbed over the leaf along the form: it quiets the leaf to a matte body and leaves it shining in the gaps
      if (o.sheen !== 0) Z.fill(lp, 'pastel', tint ? Z.mix(C.shell, tint, 0.5) : C.shell, { w: 1.6, p: o.sheen || 0.6, reach: 0.95, passes: 1, ang: ang || 0.4, cv: 0.01 });
    };
    // the polished strip: a pass of the agate along the lit side leaves the leaf paler and smoother there
    const burnish = (pts, w, p) => Z.stroke(pts, 'gold', C.burnish, { w, p: p || 0.85, tin: 0.3, tout: 0.35 });
    /* the Mewar contour, thick and thin: one kajal line pulled round the shape, and inside it a second and third pass
       only where the form turns away from the light (from the upper left), so the line swells there */
    const ink = (poly, o) => {
      o = o || {};
      const pts = Z.resample(poly, 0.6, true), n = pts.length;
      if (n < 8) return;
      const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
      let vote = 0;
      for (let i = 0; i < n; i += Math.max(1, n / 30 | 0)) { const m = nrm(i); vote += Z.inside([poly], pts[i][0] + m[0] * 0.5, pts[i][1] + m[1] * 0.5) ? 1 : -1; }
      const sg = vote >= 0 ? 1 : -1;
      const ph1 = rr(0, TAU), ph2 = rr(0, TAU), f1 = rr(0.018, 0.03), f2 = rr(0.07, 0.11), lx = -0.55, ly = -0.83;
      const wt = pts.map((p, i) => {
        const m = nrm(i), ox = -m[0] * sg, oy = -m[1] * sg, away = -(ox * lx + oy * ly);
        return clamp(0.45 + 0.6 * away + 0.16 * Math.sin(i * f1 * TAU + ph1) + 0.08 * Math.sin(i * f2 * TAU + ph2) + (o.bias || 0), 0, 1);
      });
      const c = o.c || C.line, k = o.k || 1;
      Z.outline(pts, 'kajal', c, { closed: true, w: (o.w0 || 0.42) * k, p: 0.95, pull: o.pull || 40, again: 0.1 });
      let i0 = 0; for (let i = 1; i < n; i++) if (wt[i] < wt[i0]) i0 = i;
      for (const [lev, off] of [[0.42, 0.26], [0.66, 0.5], [0.86, 0.72]]) {
        let run = [];
        const flush = () => { if (run.length > 5) Z.stroke(run, 'kajal', c, { w: 0.42 * k, p: 0.92, tin: 0.3, tout: 0.3 }); run = []; };
        for (let j = 0; j <= n; j++) {
          const i = (i0 + j) % n;
          if (wt[i] > lev) { const m = nrm(i), d = off * k; run.push([pts[i][0] + m[0] * sg * d, pts[i][1] + m[1] * sg * d]); } else flush();
        }
        flush();
      }
    };
    const chase = (pts, w, o) => Z.stroke(pts, 'kajal', (o && o.c) || C.chase, Object.assign({ w: w || 0.22, p: 0.9, tin: 0.12, tout: 0.15 }, o || {}));
    const chaseLoop = (poly, w, c) => Z.outline(poly, 'kajal', c || C.chase, { closed: true, w: w || 0.22, p: 0.9, pull: 30, again: 0.05 });
    // white dots along a path: counted, each a little different in size and place, the way a brush tip sets them
    const dots = (pts, step, r, o) => {
      o = o || {};
      const qs = Z.along(pts, step * rr(0.97, 1.03), 0), ph = rr(0, TAU), n = qs.length, j = step * 0.05;
      qs.forEach((q, i) => {
        if (o.trim && (i < o.trim || i >= n - o.trim)) return;
        const s = r * (1 + 0.08 * Math.sin(i * 1.7 + ph) + rr(-0.05, 0.05));
        Z.dot(q.x + rr(-j, j), q.y + rr(-j, j), 'chalk', o.c || C.white, { w: s, p: 0.97, reach: 1.3 });
      });
    };
    // a bead of gold: a dark seat, the bead, a speck of light up and left
    const bead = (x, y, r, lit) => {
      r *= rr(0.93, 1.07); x += rr(-0.05, 0.05) * r; y += rr(-0.05, 0.05) * r;
      Z.dot(x + r * 0.06, y + r * 0.08, 'kajal', C.chase, { w: r * 1.2, p: 0.95 });
      Z.dot(x, y, 'gold', 'gold', { w: r * 0.92, p: 1, reach: 1.3 });
      if (lit) Z.dot(x - r * 0.22, y - r * 0.24, 'chalk', C.light, { w: r * 0.32, p: 0.9 });
    };
    const pearl = (x, y, r) => {
      r *= rr(0.94, 1.06);
      Z.dot(x + r * 0.16, y + r * 0.22, 'kajal', C.chase, { w: r * 1.12, p: 0.85 });
      Z.dot(x, y, 'chalk', C.pearl, { w: r, p: 1, reach: 1.4 });
      Z.dot(x - r * 0.2, y - r * 0.22, 'chalk', '#ffffff', { w: r * 0.36, p: 0.95 });
    };
    // a cut stone in a gold collet: gold ring, the stone, a dark under-edge, a white glint
    const stone = (x, y, r, c) => {
      Z.dot(x, y, 'gold', 'gold', { w: r * 2.5, p: 1, reach: 1.3 });
      Z.dot(x, y, 'kajal', C.line, { w: r * 2.05, p: 0.9 });
      Z.dot(x, y, 'pastel', c, { w: r * 1.75, p: 1, reach: 1.5 });
      Z.dot(x + r * 0.25, y + r * 0.3, 'pastel', Z.mix(c, '#1a0808', 0.45), { w: r * 0.9, p: 0.8, reach: 1.2 });
      Z.dot(x - r * 0.3, y - r * 0.32, 'chalk', '#ffffff', { w: r * 0.5, p: 1 });
    };
    // a small white floret: n chalk dots round a coloured heart, each dot set by hand
    const floret = (x, y, r, n, sx, heart, a0) => {
      a0 = a0 != null ? a0 : rr(0, 1);
      for (let k = 0; k < n; k++) {
        const a = a0 + k * TAU / n + rr(-0.06, 0.06), rk = r * rr(0.92, 1.06);
        Z.dot(x + Math.cos(a) * r * sx, y + Math.sin(a) * r * 0.92, 'chalk', C.white, { w: rk * 0.95, p: 0.98, reach: 1.3 });
      }
      Z.dot(x, y, 'chalk', heart || '#edc94b', { w: r * 0.7, p: 1 });
    };
    /* a marigold head, counted: eleven outer petals give the ruffled edge, a dark crease between each pair, seven
       short inner petals in a paler tone, a dark heart with one speck of light */
    const marigold = (x, y, r, c, a0) => {
      a0 = a0 != null ? a0 : rr(0, TAU);
      const n = 11, ph = rr(0, TAU), dk = Z.mix(c, '#9a2a08', 0.5), lt = Z.mix(c, '#fff2b8', 0.5);
      const E = [];
      for (let k = 0; k < 88; k++) { const a = k * TAU / 88, R = r * (0.84 + 0.16 * Math.abs(Math.cos((a - a0) * n / 2))) * (1 + 0.035 * Math.sin(3 * a + ph)); E.push([x + Math.cos(a) * R, y + Math.sin(a) * R * 0.94]); }
      Z.fill(E, 'pastel', c, { w: Math.max(0.45, r * 0.45), p: 1, reach: 1.5, passes: 2, ang: a0, turn: 0.3 });
      Z.withMask(E, () => {
        for (let k = 0; k < n; k++) {
          const a = a0 + (k + 0.5) * TAU / n + rr(-0.04, 0.04);
          Z.stroke([[x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.4], [x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.81]], 'kajal', dk, { w: Math.max(0.1, r * 0.08), p: 0.8, tin: 0.2, tout: 0.4 });
        }
        for (let k = 0; k < 7; k++) { const a = a0 + 0.3 + k * TAU / 7; Z.dot(x + Math.cos(a) * r * 0.34, y + Math.sin(a) * r * 0.32, 'chalk', lt, { w: r * 0.34 * rr(0.92, 1.08), len: r * 0.16, ang: a, p: 0.92 }); }
        Z.dot(x, y, 'kajal', dk, { w: r * 0.3, p: 0.9 });
        Z.dot(x - r * 0.08, y - r * 0.09, 'chalk', lt, { w: r * 0.11, p: 0.9 });
      });
      Z.outline(E, 'kajal', '#5a240a', { closed: true, w: Math.max(0.14, r * 0.09), p: 0.85, pull: 8 });
    };
    return { lay, gild, burnish, ink, chase, chaseLoop, dots, bead, pearl, stone, floret, marigold };
  }

  // a profile r(v) through control points [v, r], v rising
  function profile(Z, cp) {
    const pts = Z.spline(cp, false, 0.004);
    return v => {
      if (v <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) if (pts[i][0] >= v) { const a = pts[i - 1], b = pts[i], t = (v - a[0]) / ((b[0] - a[0]) || 1); return lerp(a[1], b[1], t); }
      return pts[pts.length - 1][1];
    };
  }

  /* ---------------------------------------------------------------- one cup
     X: its middle, Y0: where its axis meets the stand, H: its height.  kind 'sun' (the first prize) or 'lotus'. */
  function cup(Z, K, o, X, Y0, H, kind) {
    const rr = Z.rr;
    const rB = profile(Z, [[0.338, 0.07], [0.36, 0.125], [0.395, 0.195], [0.44, 0.245], [0.5, 0.275], [0.565, 0.287], [0.62, 0.285], [0.68, 0.285], [0.75, 0.294], [0.82, 0.31], [0.885, 0.327], [0.94, 0.34]]);
    const rF = profile(Z, [[0, 0.29], [0.024, 0.29], [0.042, 0.272], [0.068, 0.215], [0.09, 0.145], [0.105, 0.085], [0.118, 0.058], [0.126, 0.05]]);
    const rS = profile(Z, [[0.112, 0.05], [0.14, 0.039], [0.18, 0.034], [0.25, 0.033], [0.3, 0.036], [0.33, 0.046], [0.345, 0.055]]);
    const rL = v => rB(v) + 0.012;
    const P = (u, v) => [X + u * H, Y0 - v * H];
    const SP = (rf, v, th) => { const r = rf(v); return [X + H * r * Math.sin(th), Y0 - v * H + TILT * H * r * Math.cos(th)]; };
    const arc = (rf, v, t0, t1, n) => { const out = []; n = n || 40; for (let i = 0; i <= n; i++) out.push(SP(rf, v, lerp(t0, t1, i / n))); return out; };
    const side = (rf, v0, v1, sg, n) => { const out = []; n = n || 30; for (let i = 0; i <= n; i++) { const v = lerp(v0, v1, i / n); out.push([X + sg * H * rf(v), Y0 - v * H]); } return out; };
    // a body of revolution between v0 and v1: the front ring at the foot, up the right, the back ring at the top, down the left
    const body = (rf, v0, v1) => arc(rf, v0, -HALF, HALF).concat(side(rf, v0, v1, 1).slice(1), arc(rf, v1, HALF, 3 * HALF).slice(1), side(rf, v1, v0, -1).slice(1));
    // a band on the front between two rings
    const band = (rf, v0, v1) => arc(rf, v0, -HALF, HALF).concat(side(rf, v0, v1, 1).slice(1), arc(rf, v1, HALF, -HALF).slice(1), side(rf, v1, v0, -1).slice(1));
    // a petal on the surface, centred at angle tc, from v0 to its tip at v1, dw its half width in angle
    const petalPath = (rf, tc, v0, v1, dw, n) => {
      n = n || 18; const L = [], R = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, v = lerp(v0, v1, t), d = dw * Math.pow(Math.max(0, Math.sin(PI * (0.1 + 0.9 * t))), 0.8);
        L.push(SP(rf, v, clamp(tc - d, -HALF, HALF))); R.push(SP(rf, v, clamp(tc + d, -HALF, HALF)));
      }
      return { L, R };
    };
    const petal = (rf, tc, v0, v1, dw, n) => { const q = petalPath(rf, tc, v0, v1, dw, n); return q.L.concat(q.R.reverse()); };
    // a counted ring of white dots round the cup, smaller where the ring turns away
    const ringDots = (rf, v, dth, r) => {
      const ph = rr(0, TAU); let i = 0;
      for (let th = -1.5; th <= 1.5; th += dth * rr(0.95, 1.05), i++) {
        const s = r * (0.45 + 0.55 * Math.cos(th)) * (1 + 0.07 * Math.sin(i * 1.9 + ph));
        if (s < 0.26) continue;
        const q = SP(rf, v, th + rr(-0.006, 0.006)); Z.dot(q[0], q[1], 'chalk', C.white, { w: s, p: 0.97, reach: 1.3 });
      }
    };
    // a twisted gold rope round the cup: the gold, then a slanting chased tick at each turn of the twist
    const rope = (rf, v, wv) => {
      Z.stroke(arc(rf, v, -HALF, HALF, 60), 'gold', 'gold', { w: H * wv, p: 1, reach: 1.35 });
      for (let th = -1.5; th < 1.5; th += 0.07 * rr(0.95, 1.05)) {
        if (Math.cos(th) < 0.14) continue;
        Z.stroke([SP(rf, v - wv * 0.42, th), SP(rf, v + wv * 0.42, th + 0.04)], 'kajal', C.chase, { w: 0.15, p: 0.85, tin: 0.2, tout: 0.2 });
      }
    };

    // ---- the handles, behind the bowl: an S-scroll from the belly up to under the lip, a curl riding on top, a ruby
    for (const sg of [-1, 1]) {
      const cl = Z.spline([[0.25, 0.53], [0.33, 0.535], [0.395, 0.565], [0.437, 0.615], [0.452, 0.685], [0.447, 0.755], [0.425, 0.81], [0.388, 0.85], [0.345, 0.872], [0.31, 0.878]].map(p => P(sg * p[0], p[1])), false, 0.5);
      const wf = t => H * (0.029 - 0.008 * t);
      const hd = ribbon(cl, wf);
      K.gild(hd, sg > 0 ? 1.3 : -1.3);
      const lit = ribbon(cl, t => wf(t) * 0.42).R, mid = cl, outer = sg > 0 ? ribbon(cl, t => wf(t) * 0.55).L : ribbon(cl, t => wf(t) * 0.55).R;
      Z.withMask(hd, () => {
        K.burnish(lit.slice(6, -8), H * 0.009, 0.8);
        K.chase(mid.slice(3, -4), 0.17);
        Z.stroke((sg > 0 ? hd.L : hd.R).slice(3), 'shade', C.glaze, { w: H * 0.012, p: 0.45 });
      });
      K.ink(hd, { k: 0.85 });
      K.dots(outer.slice(10, -6), 1.55, 0.5);
      const cu = Z.spline([[0.392, 0.85], [0.425, 0.882], [0.46, 0.9], [0.488, 0.89], [0.494, 0.866], [0.479, 0.852], [0.462, 0.859], [0.466, 0.872]].map(p => P(sg * p[0], p[1])), false, 0.4);
      const cr = ribbon(cu, t => H * lerp(0.015, 0.007, t));
      K.gild(cr, 0.3, null, { d0: 0.18, d1: 0.45 });
      K.ink(cr, { k: 0.7 });
      const bp = P(sg * 0.452, 0.685);
      for (const dv of [-0.034, 0.034]) { const q = P(sg * 0.45, 0.685 + dv); K.bead(q[0], q[1], H * 0.009, dv > 0); }
      K.stone(bp[0], bp[1], H * 0.013, C.ruby);
      o.leafDot(P(sg * 0.474, 0.872)[0], P(sg * 0.474, 0.872)[1], H * 0.008);
    }

    // ---- the foot: a dome of lotus petals on a beaded rim
    const FOOT = body(rF, 0, 0.122);
    K.gild(FOOT, 0.15);
    Z.withMask(FOOT, () => {
      K.burnish(arc(rF, 0.07, -1.25, -0.35, 12), H * 0.016, 0.7);
      K.chase(arc(rF, 0.029, -HALF, HALF), 0.24);
      for (let th = -1.45; th <= 1.46; th += 0.118 * rr(0.96, 1.04)) { const q = SP(rF, 0.014, th); K.bead(q[0], q[1], H * 0.0128 * (0.55 + 0.45 * Math.cos(th)), Math.abs(th + 0.5) < 0.5); }
      ringDots(rF, 0.037, 0.1, 0.5);
      for (const [i, tc] of [-1.1, -0.55, 0, 0.55, 1.1].entries()) {
        const t2 = tc + rr(-0.015, 0.015);
        K.chaseLoop(petal(rF, t2, 0.045, 0.114, 0.27), 0.24, C.line);
        K.chaseLoop(petal(rF, t2, 0.052, 0.106, 0.2), 0.16);
        const ins = petal(rF, t2, 0.06, 0.098, 0.1);
        K.lay(ins, i % 2 ? C.emerald : C.enamel, 1.2, 0.6);
        K.chaseLoop(ins, 0.16, C.line);
        const tp = SP(rF, 0.104, t2); Z.dot(tp[0], tp[1], 'chalk', C.white, { w: H * 0.0068 * (0.5 + 0.5 * Math.cos(t2)), p: 0.97 });
      }
      for (const tc of [-0.825, -0.275, 0.275, 0.825]) { const q = SP(rF, 0.1, tc); K.floret(q[0], q[1], H * 0.0062, 4, Math.max(0.35, Math.cos(tc)), C.ruby); }
      Z.stroke(side(rF, 0.02, 0.11, 1).map(p => [p[0] - H * 0.02, p[1]]), 'shade', C.glaze, { w: H * 0.04, p: 0.5 });
    });
    K.ink(FOOT);

    // ---- the stem: two collars, a knop with a ruby and two pearls, the collar under the bowl
    const STEM = body(rS, 0.116, 0.338);
    K.gild(STEM, 1.45, null, { d0: 0.2, d1: 0.5 });
    Z.withMask(STEM, () => {
      Z.stroke(side(rS, 0.12, 0.335, 1, 12).map(p => [p[0] - H * 0.012, p[1]]), 'shade', C.glaze, { w: H * 0.024, p: 0.5 });
      K.burnish(side(rS, 0.125, 0.33, -1, 12).map(p => [p[0] + H * 0.014, p[1]]), H * 0.009, 0.8);
      for (let v = 0.17; v < 0.31; v += 0.0235) if (Math.abs(v - 0.225) > 0.03) K.chase(arc(rS, v, -1.2, 1.2, 10), 0.14);
    });
    K.ink(STEM, { k: 0.85 });
    for (const [v, rx, ry] of [[0.142, 0.052, 0.014], [0.306, 0.056, 0.015]]) {
      const c = P(0, v), E = Z.ellipse(c[0], c[1], H * rx, H * ry);
      K.gild(E, 0, null, { edge: false });
      K.ink(E, { k: 0.75 });
      K.dots(Z.ellipse(c[0], c[1] + H * ry * 0.15, H * rx * 0.78, H * ry * 0.45, 0, 0.25, PI - 0.25), H * 0.011, 0.36);
    }
    const kc = P(0, 0.225), KN = Z.ellipse(kc[0], kc[1], H * 0.086, H * 0.034);
    K.gild(KN, 0.1, null, { d0: 0.2, d1: 0.5 });
    Z.withMask(KN, () => {
      Z.stroke(Z.ellipse(kc[0], kc[1] - H * 0.004, H * 0.086, H * 0.012, 0, 0.15, PI - 0.15), 'kajal', C.chase, { w: 0.22, p: 0.85 });
      Z.stroke(Z.ellipse(kc[0] + H * 0.02, kc[1] + H * 0.006, H * 0.06, H * 0.026, 0, -0.6, 0.9), 'shade', C.glaze, { w: H * 0.02, p: 0.45 });
      K.burnish(Z.ellipse(kc[0] - H * 0.01, kc[1] - H * 0.006, H * 0.06, H * 0.02, 0, PI * 1.08, PI * 1.5), H * 0.008, 0.8);
    });
    K.ink(KN, { k: 0.85 });
    K.dots(Z.ellipse(kc[0], kc[1] + H * 0.004, H * 0.078, H * 0.026, 0, 0.35, PI - 0.35), H * 0.0115, 0.38);
    K.stone(kc[0], kc[1] + H * 0.004, H * 0.014, C.ruby);
    for (const sg of [-1, 1]) K.pearl(kc[0] + sg * H * 0.05, kc[1] + H * 0.003, H * 0.013);
    o.leafDot(kc[0] - H * 0.035, kc[1] - H * 0.022, H * 0.007);
    const cc = P(0, 0.336), COL = Z.ellipse(cc[0], cc[1], H * 0.088, H * 0.019);
    K.gild(COL, 0, null, { edge: false });
    K.ink(COL, { k: 0.8 });

    // ---- the bowl: gold, a calyx of lotus petals in two rows, a bead waist, a band of red enamel, scallops, the lip
    const BOWL = body(rB, 0.338, 0.94);
    K.gild(BOWL, 0.05);
    Z.withMask(BOWL, () => {
      // the agate's strip down the lit side, before the ornament goes over it
      K.burnish(side(rB, 0.37, 0.89, -1, 24).map(p => [p[0] + H * 0.075, p[1]]), H * 0.045, 0.65);
      // the back row of petals: their upper parts show between the front ones, a shade deeper, a small flower in each gap
      for (const tc of [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5]) {
        const t2 = tc + rr(-0.012, 0.012), pt = petal(rB, t2, 0.37, 0.636, 0.27);
        Z.fill(pt, 'gold', C.goldDeep, { w: 1.1, p: 1, reach: 1.3, passes: 1, ang: 1.1 });
        Z.fill(pt, 'pastel', Z.mix(C.shell, C.goldDeep, 0.6), { w: 1.3, p: 0.6, reach: 0.95, passes: 1, ang: 1.3, cv: 0.01 });
        K.chaseLoop(pt, 0.24);
        K.chaseLoop(petal(rB, t2, 0.42, 0.618, 0.17), 0.15);
        K.chase([SP(rB, 0.5, t2), SP(rB, 0.555, t2), SP(rB, 0.605, t2)], 0.13);
        if (Math.abs(tc) < 1.2) { const q = SP(rB, 0.594, t2); K.floret(q[0], q[1], H * 0.0105, 5, Math.max(0.4, Math.cos(t2)), C.ruby); }
      }
      // the front row: gold petals with a border inside the border, a row of white dots between, an enamel heart, a pearl
      for (const [i, tc] of [-1.2, -0.6, 0, 0.6, 1.2].entries()) {
        const t2 = tc + rr(-0.012, 0.012), sx = 0.5 + 0.5 * Math.cos(t2);
        const pt = petal(rB, t2, 0.345, 0.6, 0.3);
        K.gild(pt, 1.3, null, { d0: 0.2, d1: 0.5 });
        Z.withMask(pt, () => K.burnish(petalPath(rB, t2, 0.37, 0.56, 0.2, 10).L, H * 0.012, 0.75));
        K.chaseLoop(pt, 0.28, C.line);
        const inner = petal(rB, t2, 0.366, 0.58, 0.215);
        K.chaseLoop(inner, 0.16);
        if (sx > 0.45) { const pp = petalPath(rB, t2, 0.36, 0.585, 0.26, 24); K.dots(pp.L.slice(4).concat(pp.R.slice(4).reverse()), 1.05, 0.42 * Math.min(1, sx + 0.15), { trim: 1 }); }
        const ins = petal(rB, t2, 0.385, 0.555, 0.125);
        K.lay(ins, i % 2 ? C.emerald : C.enamel, 1.3, 0.7);
        Z.withMask(ins, () => {
          Z.stroke([SP(rB, 0.4, t2 - 0.04), SP(rB, 0.51, t2 - 0.03)], 'chalk', i % 2 ? '#7fc29a' : '#f08a70', { w: H * 0.006, p: 0.6 });
          K.chase([SP(rB, 0.395, t2), SP(rB, 0.54, t2)], 0.13, { c: i % 2 ? '#0e3a22' : '#5a0e10' });
        });
        K.chaseLoop(ins, 0.18, C.line);
        const tip = SP(rB, 0.575, t2); K.pearl(tip[0], tip[1], H * 0.0105 * sx);
        const bs = SP(rB, 0.372, t2); Z.dot(bs[0], bs[1], 'chalk', C.white, { w: H * 0.006 * sx, p: 0.97 });
      }
      // the waist: a row of beads between two chased lines
      K.chase(arc(rB, 0.623, -HALF, HALF), 0.26);
      K.chase(arc(rB, 0.667, -HALF, HALF), 0.26);
      for (let th = -1.5; th <= 1.51; th += 0.08 * rr(0.96, 1.04)) { const q = SP(rB, 0.645, th); K.bead(q[0], q[1], H * 0.0138 * (0.45 + 0.55 * Math.cos(th)), Math.abs(th + 0.55) < 0.4); }
      // the band of red enamel: a twisted rope above and below, inside each a kajal hairline and a row of white dots,
      // and in the field a gold vine with a leaf at every turn and white florets
      const BAND = band(rB, 0.68, 0.8);
      K.lay(BAND, C.enamel, 0.05, 1.4);
      Z.withMask(BAND, () => {
        for (const v of [0.69, 0.79]) K.chase(arc(rB, v, -HALF, HALF), 0.16, { c: '#3a0a0a' });
        ringDots(rB, 0.697, 0.06, 0.48);
        ringDots(rB, 0.783, 0.06, 0.48);
        const vine = []; for (let th = -1.5; th <= 1.5; th += 0.03) vine.push(SP(rB, 0.74 + 0.02 * Math.sin(th * 5.2), th));
        Z.stroke(vine, 'gold', 'gold', { w: H * 0.0055, p: 0.95 });
        // a leaf at every crest and trough of the vine, pointing along it, a white floret on every other crest
        for (let k = -3; k <= 2; k++) {
          const tc = (PI / 2 + k * PI) / 5.2, s = Math.sin(tc * 5.2);
          if (Math.abs(tc) > 1.42) continue;
          const q = SP(rB, 0.74 + 0.02 * s, tc), q2 = SP(rB, 0.74 + 0.02 * s + 0.018 * Math.sign(s), tc + 0.05);
          Z.dot((q[0] + q2[0]) / 2, (q[1] + q2[1]) / 2, 'chalk', '#3f9a5a', { w: H * 0.011 * Math.max(0.35, Math.cos(tc)), len: H * 0.008, ang: Math.atan2(q2[1] - q[1], q2[0] - q[0]), p: 0.95 });
        }
        for (const tc of [-1.25, -0.72, 0.72, 1.25]) {
          const q = SP(rB, 0.74, tc), sx = Math.max(0.3, Math.cos(tc));
          K.floret(q[0], q[1], H * 0.016, 5, sx, kind === 'sun' ? '#edc94b' : '#e88e1e');
        }
        Z.stroke(arc(rB, 0.74, 1.0, 1.55, 12), 'shade', '#4a0c0c', { w: H * 0.13, p: 0.38, tin: 0.3, tout: 0 });
      });
      rope(rB, 0.68, 0.014);
      rope(rB, 0.8, 0.014);
      // a row of scallops hung from under the lip, a ruby speck in each, a white dot at each cusp
      const sstep = 0.2;
      for (let th = -1.5; th < 1.4; th += sstep) {
        const sc = []; for (let k = 0; k <= 8; k++) { const t = k / 8; sc.push(SP(rB, 0.884 - 0.042 * Math.sin(t * PI), th + sstep * t)); }
        K.chase(sc, 0.22, { tin: 0.1, tout: 0.1 });
        const inn = []; for (let k = 1; k < 8; k++) { const t = k / 8; inn.push(SP(rB, 0.884 - 0.026 * Math.sin(t * PI), th + sstep * t)); }
        K.chase(inn, 0.13, { tin: 0.2, tout: 0.2 });
        const cs = 0.5 + 0.5 * Math.cos(th + sstep / 2), d = SP(rB, 0.858, th + sstep / 2);
        Z.dot(d[0], d[1], 'pastel', C.enamel, { w: H * 0.009 * cs, p: 1 });
        const cu = SP(rB, 0.874, th); if (Math.cos(th) > 0.2) Z.dot(cu[0], cu[1], 'chalk', C.white, { w: H * 0.0058 * (0.5 + 0.5 * Math.cos(th)), p: 0.97 });
      }
      K.chase(arc(rB, 0.888, -HALF, HALF), 0.22);
      // volume: one glaze down the right of the belly and up the band, a dry light down the left
      Z.stroke(side(rB, 0.36, 0.89, 1, 20).map(p => [p[0] - H * 0.05, p[1]]), 'shade', C.glaze, { w: H * 0.07, p: 0.55, tin: 0.2, tout: 0.2 });
      Z.stroke(side(rB, 0.345, 0.89, 1, 20).map(p => [p[0] - H * 0.012, p[1]]), 'shade', '#4a2a08', { w: H * 0.02, p: 0.55 });
      for (const [v0, v1] of [[0.81, 0.875], [0.4, 0.56]]) Z.stroke(side(rB, v0, v1, -1, 8).map(p => [p[0] + H * 0.07, p[1]]), 'chalk', C.light, { w: H * 0.007, p: 0.5, tin: 0.3, tout: 0.3 });
    });
    K.ink(BOWL, { pull: 50 });

    // ---- the medallion on the band
    const m = SP(rB, 0.74, 0), mr = H * (kind === 'sun' ? 0.062 : 0.06);
    if (kind === 'sun') {
      /* sixteen rays, the folio's sun: eight straight and pointed with a white dot past each tip, eight shorter ones
         that waver like flame; squashed top to bottom so the whole sun sits inside the band */
      const sy = 0.68, at = (a, r) => [m[0] + Math.cos(a) * r, m[1] + Math.sin(a) * r * sy];
      for (let k = 0; k < 16; k++) {
        const a = k * TAU / 16 + rr(-0.025, 0.025);
        let ray;
        if (k % 2 === 0) {
          const l = mr * 1.8 * rr(0.96, 1.04), w = 0.2;
          ray = [at(a - w, mr * 0.9), at(a - w * 0.35, mr * 1.25), at(a, l), at(a + w * 0.35, mr * 1.25), at(a + w, mr * 0.9)];
          const tp = at(a, l + mr * 0.24); Z.dot(tp[0], tp[1], 'chalk', C.white, { w: mr * 0.11, p: 0.97 });
        } else {
          const cl = []; for (let i = 0; i <= 12; i++) { const t = i / 12, r = lerp(mr * 0.92, mr * 1.5, t); cl.push(at(a + 0.09 * Math.sin(t * TAU * 0.9), r)); }
          ray = ribbon(cl, t => mr * 0.15 * Math.pow(1 - t, 0.8));
        }
        Z.fill(ray, 'gold', 'gold', { w: 0.6, p: 1, reach: 1.4, passes: 2 });
        Z.fill(ray, 'pastel', C.shell, { w: 0.6, p: 0.55, reach: 0.95, passes: 1, ang: a });
        Z.outline(ray, 'kajal', C.line, { closed: true, w: 0.17, p: 0.85, pull: 20 });
      }
      const D = Z.ellipse(m[0], m[1], mr, mr * 0.86);
      K.gild(D, 0.6, null, { d0: 0.2, d1: 0.45 });
      Z.withMask(D, () => Z.stroke(Z.ellipse(m[0] + mr * 0.15, m[1] + mr * 0.12, mr * 0.8, mr * 0.66, 0, -0.9, 1.6), 'shade', C.glaze, { w: mr * 0.3, p: 0.45 }));
      K.ink(D, { k: 0.75 });
      K.chase(Z.ellipse(m[0], m[1], mr * 0.72, mr * 0.61), 0.2);
      for (let k = 0; k < 12; k++) { const a = k * TAU / 12 + rr(-0.03, 0.03); K.bead(m[0] + Math.cos(a) * mr * 0.86, m[1] + Math.sin(a) * mr * 0.73, mr * 0.13, k > 6 && k < 10); }
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2; Z.dot(m[0] + Math.cos(a) * mr * 0.55, m[1] + Math.sin(a) * mr * 0.46, 'chalk', C.white, { w: mr * 0.08, p: 0.97 }); }
      K.stone(m[0], m[1], mr * 0.32, C.ruby);
      o.leaf(Z.ellipse(m[0], m[1], mr * 1.02, mr * 0.88, 0, PI * 1.05, PI * 1.45), H * 0.007);
    } else {
      for (let k = 0; k < 8; k++) {
        const a = k * TAU / 8 + PI / 8 + rr(-0.03, 0.03), c = [m[0] + Math.cos(a) * mr * 0.72, m[1] + Math.sin(a) * mr * 0.68];
        const pe = Z.ellipse(c[0], c[1], mr * 0.42 * rr(0.95, 1.05), mr * 0.24, a);
        K.lay(pe, '#f6ece0', a, 0.6);
        Z.withMask(pe, () => Z.dot(c[0] - Math.cos(a) * mr * 0.18, c[1] - Math.sin(a) * mr * 0.18, 'pastel', C.rose, { w: mr * 0.3, p: 0.8 }));
        Z.outline(pe, 'kajal', C.line, { closed: true, w: 0.18, p: 0.85, pull: 20 });
        K.chase([[c[0] - Math.cos(a) * mr * 0.3, c[1] - Math.sin(a) * mr * 0.3], [c[0] + Math.cos(a) * mr * 0.3, c[1] + Math.sin(a) * mr * 0.3]], 0.12, { c: '#8a3a40' });
        const tp = [m[0] + Math.cos(a + PI / 8) * mr * 1.0, m[1] + Math.sin(a + PI / 8) * mr * 0.94];
        Z.dot(tp[0], tp[1], 'chalk', C.white, { w: mr * 0.1, p: 0.97 });
      }
      const D = Z.ellipse(m[0], m[1], mr * 0.5, mr * 0.48);
      K.gild(D, 0.6, null, { edge: false }); K.ink(D, { k: 0.6 });
      K.stone(m[0], m[1], mr * 0.3, C.emerald);
      o.leafDot(m[0] - mr * 0.3, m[1] - mr * 0.3, H * 0.006);
    }

    // ---- the lip: a ring of pearls on gold
    const LIP = band(rL, 0.893, 0.94);
    K.gild(LIP, 0.05, null, { d0: 0.2, d1: 0.5 });
    Z.withMask(LIP, () => {
      for (let th = -1.48; th <= 1.49; th += 0.085 * rr(0.96, 1.04)) { const q = SP(rL, 0.917, th), r = H * 0.0118 * (0.5 + 0.5 * Math.cos(th)); if (r > H * 0.004) K.pearl(q[0], q[1], r); }
      Z.stroke(side(rL, 0.895, 0.94, 1, 6).map(p => [p[0] - H * 0.02, p[1]]), 'shade', C.glaze, { w: H * 0.03, p: 0.5 });
    });
    K.ink(LIP, { k: 0.9 });

    // ---- the mouth seen from a little above: the rim's top a thin gold ring with a row of white dots, the far wall lit
    const oc = P(0, 0.94), rxo = H * rL(0.94), ryo = TILT * rxo, rxi = rxo - H * 0.026, ryi = ryo * rxi / rxo;
    const RIM = Z.ellipse(oc[0], oc[1], rxo, ryo), MOUTH = Z.ellipse(oc[0], oc[1] + H * 0.002, rxi, ryi);
    K.gild(RIM, 0, null, { edge: false });
    K.lay(MOUTH, '#3a220c', 0, 1.2);
    Z.withMask(MOUTH, () => {
      Z.pushMaskOutside(Z.ellipse(oc[0], oc[1] + ryi * 0.95, rxi * 1.05, ryi * 1.25));
      Z.fill(MOUTH, 'gold', C.goldDeep, { w: 1, p: 0.95, reach: 1.25, passes: 2, ang: 0 });
      Z.popMask();
      Z.stroke(Z.ellipse(oc[0], oc[1] + ryi * 0.95, rxi * 1.05, ryi * 1.25, 0, PI * 1.15, PI * 1.85), 'shade', '#2a1606', { w: ryi * 0.4, p: 0.5 });
    });
    Z.outline(MOUTH, 'kajal', C.line, { closed: true, w: 0.3, p: 0.9, pull: 30 });
    K.ink(RIM, { k: 0.85 });
    K.dots(Z.ellipse(oc[0], oc[1] + H * 0.0015, (rxo + rxi) / 2, (ryo + ryi) / 2, 0, 0.12, PI - 0.12), 1.5, 0.42);
    o.leaf(Z.ellipse(oc[0], oc[1], rxo * 0.97, ryo * 0.8, 0, PI * 0.62, PI * 0.88), H * 0.007);
    o.leaf(Z.ellipse(oc[0], oc[1], rxo * 0.97, ryo * 0.8, 0, PI * 1.1, PI * 1.3), H * 0.005);

    return { P, SP, rB };
  }

  /* ---------------------------------------------------------------- the chowki under its cloth */
  function chowki(Z, K, o) {
    const rr = Z.rr;
    const TOP = -30.6, MID = -26.6, HEM = -11.6;
    // the legs below the cloth: turned lac wood with gold rings, bun feet
    for (const lx of [-80, 80]) {
      const prof = [[0, 2.3], [0.1, 2.5], [0.2, 1.5], [0.3, 1.5], [0.46, 2.7], [0.6, 2.5], [0.72, 1.4], [0.8, 1.4], [0.9, 3.0], [1, 2.7]];
      const pts = Z.spline(prof.map(p => [p[0], p[1]]), false, 0.02);
      const y = t => lerp(HEM - 1, 0, t), L = pts.map(p => [lx - p[1], y(p[0])]), R = pts.map(p => [lx + p[1], y(p[0])]).reverse();
      const LEG = L.concat(R);
      K.lay(LEG, C.wood, 1.5, 1.2);
      Z.withMask(LEG, () => {
        Z.stroke(L.map(p => [p[0] + 0.9, p[1]]), 'chalk', C.woodLit, { w: 0.7, p: 0.6, tin: 0.2, tout: 0.2 });
        for (const t of [0.25, 0.76]) {
          Z.stroke([[lx - 3, y(t)], [lx + 3, y(t)]], 'gold', 'gold', { w: 0.9, p: 1 });
          for (let k = -2; k <= 2; k++) Z.dot(lx + k * 0.95, y(t) - 0.95, 'chalk', C.white, { w: 0.34, p: 0.95 });
        }
      });
      K.ink(LEG, { k: 0.8 });
    }
    // the cloth hanging in front: neel, a hingul border of florets, a green border inside it with white dots,
    // a scalloped hem with gold tassels
    const N = 8, xs = []; for (let i = 0; i <= N; i++) xs.push(lerp(-89.5, 89.5, i / N));
    const hem = [];
    for (let i = 0; i < N; i++) for (let k = 0; k < 10; k++) { const t = k / 10; hem.push([lerp(xs[i], xs[i + 1], t), HEM + 1.8 * Math.sin(t * PI)]); }
    hem.push([89.5, HEM]);
    const DROP = [[-89.5, MID], [89.5, MID]].concat(hem.slice().reverse());
    const RD = Z.resample(DROP, 0.6, true);
    K.lay(DROP, C.neel, 1.5, 2.2, { turn: 0.12 });
    const IN1 = inset(Z, RD, 2.5), IN2 = inset(Z, RD, 3.5);
    Z.withMask(DROP, () => {
      Z.pushMaskOutside(IN1);
      K.lay(DROP, C.border, 0.05, 1.6);
      Z.popMask();
      Z.withMask(IN1, () => { Z.pushMaskOutside(IN2); K.lay(IN1, C.green, 0.05, 1.2); Z.popMask(); });
      // the field: a diaper of small white buti, each set by hand on a counted grid
      Z.withMask(IN2, () => {
        let row = 0;
        for (let y = MID + 5.4; y < HEM + 1.2; y += 4.3, row++) for (let x = -85 + (row % 2 ? 3.3 : 0); x < 86; x += 6.6) K.floret(x + rr(-0.12, 0.12), y + rr(-0.12, 0.12), 0.6, 4, 1, row % 2 ? '#edc94b' : '#e88e1e');
        for (const [fx, d1, d2] of [[-58, 0.6, -0.9], [-22, -0.5, 0.8], [18, 0.7, 1.1], [52, -0.8, -0.4]]) Z.stroke([[fx, MID + 1], [fx + d1, (MID + HEM) / 2], [fx + d2, HEM + 1.5]], 'shade', '#0a1030', { w: 2.4, p: 0.35, tin: 0.2, tout: 0.4 });
      });
      // the hingul border: white florets and gold dots by turns along its middle; the green one: a row of white dots
      const mid = inset(Z, RD, 1.25);
      for (const q of Z.along(mid.concat([mid[0]]), 2.4, 0)) { if (q.i % 2) K.floret(q.x, q.y, 0.55, 4, 1, '#edc94b'); else Z.dot(q.x, q.y, 'gold', 'gold', { w: 0.7, p: 1 }); }
      const gm = inset(Z, RD, 3.0);
      K.dots(gm.concat([gm[0]]), 0.95, 0.36);
    });
    Z.stroke(IN1.concat([IN1[0]]), 'gold', 'gold', { w: 0.45, p: 1 });
    K.chase(IN2.concat([IN2[0]]), 0.14, { c: C.line });
    Z.stroke(hem, 'gold', 'gold', { w: 0.8, p: 1 });
    K.ink(DROP, { k: 0.9 });
    // tassels at the points of the hem: a red head with a white dot, a gold cap, seven gold threads
    for (let i = 1; i < N; i++) {
      const x = xs[i], y = HEM + 0.2;
      Z.dot(x, y + 0.5, 'pastel', C.enamel, { w: 1.15, p: 1 });
      Z.dot(x - 0.15, y + 0.35, 'chalk', C.white, { w: 0.3, p: 0.95 });
      for (let k = 0; k < 7; k++) { const dx = (k - 3) * 0.28; Z.stroke([[x + dx * 0.3, y + 1.1], [x + dx, y + 4.6 + 0.25 * Math.sin(k * 2.1 + i)]], 'gold', 'gold', { w: 0.4, p: 1, tin: 0.05, tout: 0.3 }); }
      Z.stroke([[x - 0.9, y + 1.4], [x + 0.9, y + 1.4]], 'kajal', C.line, { w: 0.2, p: 0.8 });
    }
    // the top of the cloth, seen from above: a paler neel, a hingul strip at its front edge stitched with white
    const TOPP = [[-86.5, TOP], [86.5, TOP], [89.5, MID], [-89.5, MID]];
    K.lay(TOPP, C.neelTop, 0.02, 1.6);
    Z.withMask(TOPP, () => {
      K.lay([[-90, MID - 1.5], [90, MID - 1.5], [90, MID + 0.2], [-90, MID + 0.2]], C.border, 0.02, 1.0);
      K.chase([[-90, MID - 1.5], [90, MID - 1.5]], 0.13, { c: C.line });
      K.dots([[-88.5, MID - 0.75], [88.5, MID - 0.75]], 1.6, 0.36);
      for (let x = -84; x < 85; x += 3.4) Z.dot(x, TOP + 1.6, 'chalk', '#dfe4f2', { w: 0.32, p: 0.9 });
    });
    K.ink(TOPP, { k: 0.85 });
    return { TOP, MID };
  }

  M.w8x['hackathons'] = {
    // the shadow of the chowki on the landing, thrown back and to the right: one even glaze, then a darker core
    ground(Z, o) {
      Z.fill(Z.ellipse(5, -0.6, 95, 2.4), 'shade', '#6a4a44', { w: 1.6, p: 1, reach: 1.5, passes: 2, ang: 0.02, turn: 0.08 });
      Z.fill(Z.ellipse(4, -0.3, 87, 1.1), 'shade', '#4a302c', { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: 0.02, turn: 0.08 });
    },
    draw(Z, o) {
      const K = kit(Z), rr = Z.rr;
      chowki(Z, K, o);
      // where each cup stands, its own shadow on the cloth
      for (const [x, w] of [[-43, 28], [43, 23]]) Z.fill(Z.ellipse(x + 3, -28.6, w, 1.9), 'shade', '#0a0e26', { w: 1.4, p: 0.55, passes: 2, ang: 0 });
      // the second prize behind and to the right, the first in front and to the left
      cup(Z, K, o, 43, -30.4, 70, 'lotus');
      const big = cup(Z, K, o, -43, -30.4, 84, 'sun');
      // a marigold string hung on the first prize's handle: two strands, a leaf pair at every fourth head, a red tassel
      {
        const P = big.P;
        const strands = [
          [[-0.37, 0.872], [-0.42, 0.878], [-0.465, 0.845], [-0.495, 0.76], [-0.52, 0.64], [-0.535, 0.51], [-0.532, 0.39], [-0.522, 0.31]],
          [[-0.39, 0.866], [-0.445, 0.835], [-0.462, 0.735], [-0.47, 0.605], [-0.472, 0.485], [-0.463, 0.375]]
        ];
        strands.forEach((sp, j) => {
          const cl = Z.spline(sp.map(p => P(p[0], p[1])), false, 0.5);
          Z.stroke(cl, 'kajal', '#6a1a10', { w: 0.24, p: 0.8 });
          const heads = Z.along(cl, 2.7, 0);
          heads.forEach((q, i) => {
            if (i % 4 === 2) for (const s2 of [-1, 1]) Z.stroke([[q.x, q.y], [q.x + s2 * 2.0, q.y + 0.5 + 0.1 * s2]], 'pastel', C.leaf, { w: 0.85, p: 1, tin: 0.1, tout: 0.6 });
            K.marigold(q.x, q.y, 1.5 * (1 + 0.05 * Math.sin(i * 2.3 + j)), C.mari[(i + j * 2) % C.mari.length], i * 0.7 + j);
          });
          const e = cl[cl.length - 1];
          for (let k = 0; k < 6; k++) Z.stroke([[e[0], e[1] + 1], [e[0] + (k - 2.5) * 0.35, e[1] + 4.2 + 0.3 * Math.sin(k * 1.9 + j)]], 'chalk', C.ruby, { w: 0.3, p: 1, tin: 0.05, tout: 0.3 });
          Z.dot(e[0], e[1] + 1.1, 'gold', 'gold', { w: 1.1, p: 1 });
        });
      }
      // one marigold dropped on the cloth between the cups, and four rose petals
      K.marigold(1.5, -31.2, 2.4, '#e88e1e', 0.3);
      for (const [x, y, a] of [[-11, -29.6, 0.4], [10, -29.2, -0.8], [16.5, -30.4, 2.1], [-18.5, -28.6, 1.4]]) {
        const pe = Z.ellipse(x, y, 1.15, 0.62, a);
        K.lay(pe, C.rose, a, 0.5);
        Z.outline(pe, 'kajal', '#7a2a30', { closed: true, w: 0.15, p: 0.7, pull: 8 });
        K.chase([[x - Math.cos(a) * 0.6, y - Math.sin(a) * 0.6], [x + Math.cos(a) * 0.5, y + Math.sin(a) * 0.5]], 0.1, { c: '#a04a50' });
      }
      return { box: [-96, -115.2, 96, 0] };
    }
  };
})();
