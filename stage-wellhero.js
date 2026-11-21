/* ------------------------------------------------------------------ *
 *  THE STEPWELL, WHOLE  (the opening screen of the Experience page)
 *
 *  One wide picture (1920 x 1080) of the whole well at once, seen from
 *  the rim and flattened the Mewar way: the hill, the jali wall and the
 *  chhatri across the top; under them the well opens downward, its far
 *  walls stepping in level by level and its side walls running toward
 *  us in perspective, so the picture is a funnel of crossing flights.
 *  Five levels, each smaller than the one above, each holding its hour
 *  and its things; the lamps in their alcoves make a chain of light
 *  down the middle to the one lamp on the still water.
 *
 *  It is painted with the motifs of the tall well (m-well*.js), drawn
 *  small: every wall is painted in its own flat "wall space" and a
 *  proxy of the sheet carries each mark into the picture, through a
 *  plain scale for the far walls and a perspective map for the side
 *  walls.  Nothing here runs when the file is loaded.
 * ------------------------------------------------------------------ */
STAGE.places.wellhero = (function () {
  const P = {};
  const W = 1920, H = 1080, PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const hl = (A, a, b, tool, c, o) => M.cityHand.hl(A, a, b, tool, c, o);

  /* ================================================================ THE LIGHT OF THE HOUR (as in stage-well.js) */
  const KEYS = {
    noon:  { face: '#efc97a', wall: '#bd8a40', recess: '#b8863c', tread: '#f9edcc', riser: '#9a6a2c', cast: '#a06e34', deep: '#5e3c1c', line: '#3a2614', lime: '#f5dfa2', glaze: '#fff3d8', gl: 0.05, footDark: 0.1 },
    after: { face: '#ecb866', wall: '#b67634', recess: '#b0742f', tread: '#f6e0b2', riser: '#8f5a2a', cast: '#9a5c30', deep: '#56341a', line: '#38220f', lime: '#f0d29a', glaze: '#f0a040', gl: 0.08, footDark: 0.16 },
    dusk:  { face: '#efb596', wall: '#b46c60', recess: '#b06a64', tread: '#f7dac6', riser: '#7e4450', cast: '#8e5066', deep: '#4e2632', line: '#3a1c22', lime: '#f2cdb4', glaze: '#d0607a', gl: 0.14, footDark: 0.22 },
    eve:   { face: '#c0a8b6', wall: '#7c627a', recess: '#7a6280', tread: '#dccdcf', riser: '#4c3a58', cast: '#665074', deep: '#30223c', line: '#24182c', lime: '#d6c8cc', glaze: '#5a4a7a', gl: 0.28, footDark: 0.26 },
    night: { face: '#7a8c96', wall: '#435262', recess: '#425062', tread: '#a6b6b8', riser: '#24303e', cast: '#38465a', deep: '#141c26', line: '#0e141c', lime: '#93a3a6', glaze: '#18243a', gl: 0.46, footDark: 0.3 },
    water: { face: '#3a4c46', wall: '#2c3a3c', recess: '#24302f', tread: '#5a6a64', riser: '#141c1e', cast: '#1b2628', deep: '#0b1214', line: '#080c0d', lime: '#4a5a55', glaze: '#0e1a24', gl: 0.55, footDark: 0.3 }
  };
  const MOSS = {
    noon: [['#6b7a30', '#7b8a36', '#5c6a2c'], ['#b7c060', '#c9c46a']], after: [['#5f6e2c', '#76822f', '#4d5a2a'], ['#a9b545', '#c6c66a']],
    dusk: [['#5a6630', '#6f7a36', '#4a5428'], ['#a9b04a', '#c4b860']], eve: [['#4a6a3e', '#5a7a42', '#3a5634'], ['#9ab46a', '#b0c47a']],
    night: [['#3a5a3c', '#4a6c44', '#2e4a32'], ['#88aa66', '#9cbc72']], water: [['#2a4430', '#34503a', '#22382a'], ['#6a8a5a', '#7a9a60']]
  };
  MOSS.peach = MOSS.after;
  const hexc = h => { const v = parseInt(h.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const KC = {};
  for (const k in KEYS) { KC[k] = {}; for (const f in KEYS[k]) KC[k][f] = typeof KEYS[k][f] === 'string' ? hexc(KEYS[k][f]) : KEYS[k][f]; }
  // the giddy hour between afternoon and dusk, for the middle of the well
  KC.peach = {}; for (const f in KC.after) KC.peach[f] = Array.isArray(KC.after[f]) ? mixc(KC.after[f], KC.dusk[f], 0.55) : lerp(KC.after[f], KC.dusk[f], 0.55);
  // noon gold at the rim, peach and rose down the middle, violet, then night at the water
  const ANCH = [[0, 'noon'], [390, 'noon'], [532, 'peach'], [668, 'dusk'], [790, 'eve'], [895, 'night'], [975, 'water'], [H, 'water']];
  const kcache = new Map();
  function keyAt(y) {
    const q = Math.round(y / 2) * 2;
    if (kcache.has(q)) return kcache.get(q);
    let i = 0; while (i + 2 < ANCH.length && q > ANCH[i + 1][0]) i++;
    const a = ANCH[i], b = ANCH[i + 1], t = a[1] === b[1] ? 0 : clamp((q - a[0]) / (b[0] - a[0]), 0, 1), A0 = KC[a[1]], B0 = KC[b[1]], K = {};
    for (const f in A0) K[f] = Array.isArray(A0[f]) ? mixc(A0[f], B0[f], t) : lerp(A0[f], B0[f], t);
    const near = t < 0.5 ? a[1] : b[1];
    K.moss = MOSS[near][0]; K.mossTip = MOSS[near][1]; K.hour = near;
    kcache.set(q, K);
    return K;
  }
  const toneAt = (A, y) => { const K = keyAt(y); return c => A.mix(c, K.glaze, K.gl); };

  /* ================================================================ MAPS, AND THE SHEET SEEN THROUGH ONE */
  // a plain scale: (x, y) in a motif's own units to the picture
  function scaleMap(k, ox, oy) { return { f: (x, y) => [ox + x * k, oy + y * k], inv: (X, Y) => [(X - ox) / k, (Y - oy) / k], J: () => [k, 0, 0, k] }; }
  // the same, with the motif's point (nx, ny) put down at (hx, hy)
  const place = (hx, hy, k, nx, ny) => scaleMap(k, hx - (nx || 0) * k, hy - (ny || 0) * k);
  // a perspective map from four points to four points (a wall seen at a slant)
  function solveH(s, d) {
    const m = [], b = [];
    for (let i = 0; i < 4; i++) {
      const x = s[i][0], y = s[i][1], X = d[i][0], Y = d[i][1];
      m.push([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.push(X);
      m.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.push(Y);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      let t = m[c]; m[c] = m[p]; m[p] = t; t = b[c]; b[c] = b[p]; b[p] = t;
      for (let r = c + 1; r < 8; r++) { const f = m[r][c] / m[c][c]; for (let q = c; q < 8; q++) m[r][q] -= f * m[c][q]; b[r] -= f * b[c]; }
    }
    const h = new Array(8);
    for (let r = 7; r >= 0; r--) { let v = b[r]; for (let q = r + 1; q < 8; q++) v -= m[r][q] * h[q]; h[r] = v / m[r][r]; }
    return h;
  }
  function homog(src, dst) {
    const h = solveH(src, dst), g = solveH(dst, src);
    const ap = (m, x, y) => { const w = m[6] * x + m[7] * y + 1; return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w]; };
    return {
      f: (x, y) => ap(h, x, y), inv: (X, Y) => ap(g, X, Y),
      J: (x, y) => { const w = h[6] * x + h[7] * y + 1, X = (h[0] * x + h[1] * y + h[2]) / w, Y = (h[3] * x + h[4] * y + h[5]) / w; return [(h[0] - X * h[6]) / w, (h[1] - X * h[7]) / w, (h[3] - Y * h[6]) / w, (h[4] - Y * h[7]) / w]; }
    };
  }
  const isPolys = p => p.length && Array.isArray(p[0][0]);
  const cen = p => { const q = isPolys(p) ? p[0] : p; let sx = 0, sy = 0; for (const v of q) { sx += v[0]; sy += v[1]; } return [sx / q.length, sy / q.length]; };
  // how thin a line can be drawn small before the hand gives up thinning it
  const MINW = { kajal: 0.42, chalk: 0.55, pastel: 0.8, side: 1.6, gold: 0.6, shade: 0.8, geru: 0.5, pencil: 0.4 };
  const tw = (tool, w0, k) => Math.max(w0 * k, Math.min(w0, typeof tool === 'string' && MINW[tool] != null ? MINW[tool] : 0.5));
  const wobK = k => clamp(k * 1.3, 0.35, 1);
  /* the sheet seen through a map: every mark a motif makes in its own units lands in the picture, its width, its
     reach and the turn of its hatching carried with it.  What it does not draw (noise, the dice, the colours) it shares. */
  function zoom(A, map) {
    if (A.__z) {
      const o = A.__z, m2 = map;
      map = {
        f: (x, y) => { const q = m2.f(x, y); return o.f(q[0], q[1]); },
        inv: (X, Y) => { const q = o.inv(X, Y); return m2.inv(q[0], q[1]); },
        J: (x, y) => { const q = m2.f(x, y), a = o.J(q[0], q[1]), b = m2.J(x, y); return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]]; }
      };
      A = A.__base;
    }
    const B = A, Z = Object.create(B), TL = B.TOOLS;
    const pt = p => { const q = map.f(p[0], p[1]); if (p.length > 2) q.push(p[2]); return q; };
    const pts = a => a.map(pt), polys = p => isPolys(p) ? p.map(pts) : pts(p);
    const kAt = (x, y) => { const j = map.J(x, y); return Math.sqrt(Math.abs(j[0] * j[3] - j[1] * j[2])); };
    const angAt = (x, y, a) => { const j = map.J(x, y), c = Math.cos(a), s = Math.sin(a); return Math.atan2(j[2] * c + j[3] * s, j[0] * c + j[1] * s); };
    const T = tool => typeof tool === 'string' ? TL[tool] : tool;
    Z.__z = map; Z.__base = B; Z.__k = kAt; Z.__ang = angAt; Z.__pt = pt;
    Z.stroke = (p, tool, c, o) => {
      o = o || {}; if (p.length < 2) return;
      const m = p[(p.length / 2) | 0], k = kAt(m[0], m[1]), w0 = o.w != null ? o.w : T(tool).w;
      return B.stroke(pts(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.line = (x1, y1, x2, y2, tool, c, o) => Z.stroke([[x1, y1], [x2, y2]], tool, c, o);
    Z.dot = (x, y, tool, c, o) => {
      o = o || {}; const w0 = o.w != null ? o.w : T(tool).w, l0 = o.len != null ? o.len : w0 * 0.35, an = o.ang != null ? o.ang : B.rnd() * 6.283, k = kAt(x, y), q = map.f(x, y);
      return B.dot(q[0], q[1], tool, c, Object.assign({}, o, { w: tw(tool, w0, k), len: l0 * k, ang: angAt(x, y, an), wob: (o.wob != null ? o.wob : 0.3) * wobK(k) }));
    };
    Z.fill = (p, tool, c, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]), w0 = o.w != null ? o.w : T(tool).w;
      return B.fill(polys(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : -0.62), len: (o.len != null ? o.len : B.rr(150, 260)) * k, edge: o.edge ? o.edge * k : o.edge, wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.outline = (p, tool, c, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]), w0 = o.w != null ? o.w : T(tool).w;
      return B.outline(pts(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), pull: (o.pull != null ? o.pull : B.rr(60, 130)) * k, wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.smudge = (p, o) => { o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]); return B.smudge(pts(p), Object.assign({}, o, { r: Math.max(0.8, (o.r || 8) * k) })); };
    Z.blend = (p, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]);
      return B.blend(polys(p), Object.assign({}, o, { r: Math.max(1, (o.r || 9) * k), len: (o.len || 90) * k, ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : B.rr(-0.9, -0.3)) }));
    };
    Z.ground = (p, c, o) => {
      o = o || {}; const ps = isPolys(p) ? p : [p];
      const rp = o.edge === 0 ? ps : ps.map(q => B.roughen(q, o.edge != null ? o.edge : 1.6, 18, true));
      const c0 = cen(rp), k = kAt(c0[0], c0[1]);
      B.ground(rp.map(pts), c, Object.assign({}, o, { edge: 0, w: tw('side', o.w || 30, k), rub: o.rub === 0 ? 0 : Math.max(1, (o.rub || 8) * k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : -0.62) }));
      return rp;
    };
    Z.shape = (p, o) => {
      o = o || {}; const rp = o.rough === 0 ? p : B.roughen(p, o.rough != null ? o.rough : 0.8, 12, true);
      const c0 = cen(rp), k = kAt(c0[0], c0[1]), tool = o.tool || 'pastel', lt = o.lineTool || 'kajal';
      B.shape(pts(rp), Object.assign({}, o, { rough: 0, w: tw(tool, o.w != null ? o.w : T(tool).w, k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : B.rr(-1.2, 1.2)), lw: tw(lt, o.lw != null ? o.lw : T(lt).w, k), off: (o.off != null ? o.off : 0.5) * k }));
      return rp;
    };
    Z.pushMask = (p, soft) => B.pushMask(polys(p), soft);
    Z.pushMaskOutside = (p, soft) => B.pushMaskOutside(polys(p), soft);
    Z.withMask = (p, fn, soft) => { B.pushMask(polys(p), soft); try { fn(); } finally { B.popMask(); } };
    return Z;
  }
  // the pixel washes of m-floor.js, taught to look through a map.  Put in for the painting only, and taken out after.
  function wrapM() {
    const names = ['floorWash', 'floorMasked', 'floorCloud', 'floorUnion', 'lampGlow'], keep = {};
    for (const n of names) keep[n] = M[n];
    const invF = (z, f) => (x, y) => { const q = z.inv(x, y); return f(q[0], q[1]); };
    M.floorWash = function (A, poly, c, f, mode) { return A.__z ? keep.floorWash(A, poly, c, invF(A.__z, f), mode) : keep.floorWash(A, poly, c, f, mode); };
    M.floorMasked = function (A, poly, f, draw) { return A.__z ? keep.floorMasked(A, poly, invF(A.__z, f), draw) : keep.floorMasked(A, poly, f, draw); };
    M.floorCloud = function (A, poly, c, o) {
      if (!A.__z) return keep.floorCloud(A, poly, c, o);
      o = o || {}; const c0 = cen(poly), k = A.__k(c0[0], c0[1]);
      return keep.floorCloud(A, poly, c, Object.assign({}, o, { scale: (o.scale || 120) * k, g: o.g ? invF(A.__z, o.g) : null }));
    };
    M.floorUnion = function (A, polys, c, k, r, mode, paint) {
      if (!A.__z) return keep.floorUnion(A, polys, c, k, r, mode, paint);
      const z = A.__z, c0 = cen(polys), s = A.__k(c0[0], c0[1]);
      const pp = paint ? Object.assign({}, paint, { ang: A.__ang(c0[0], c0[1], paint.ang != null ? paint.ang : 0.5), len: (paint.len || 26) * s, wid: Math.max(0.8, (paint.wid || 2.2) * s) }) : paint;
      return keep.floorUnion(A.__base, polys.map(p => p.map(q => z.f(q[0], q[1]))), c, invF(z, k), Math.max(1, r * s), mode, pp);
    };
    M.lampGlow = function (A, x, y, R, kk, o) {
      if (!A.__z) return keep.lampGlow(A, x, y, R, kk, o);
      o = o || {}; const z = A.__z, s = A.__k(x, y), q = z.f(x, y), o2 = Object.assign({}, o);
      if (o.at) o2.at = z.f(o.at[0], o.at[1]);
      if (o.box) { const a = z.f(o.box[0], o.box[1]), b = z.f(o.box[2], o.box[3]); o2.box = [a[0], a[1], b[0], b[1]]; }
      if (o.hole) o2.hole = invF(z, o.hole);
      if (o.k) o2.k = invF(z, o.k);
      return keep.lampGlow(A.__base, q[0], q[1], R * s, kk, o2);
    };
    return () => { for (const n of names) M[n] = keep[n]; };
  }
  // a polygon cut to a rectangle (Sutherland-Hodgman)
  function clipPoly(poly, x0, y0, x1, y1) {
    const sides = [
      [p => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
      [p => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
      [p => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
      [p => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]]];
    let out = poly;
    for (const [inside, cut] of sides) {
      const src = out; out = [];
      for (let i = 0; i < src.length; i++) {
        const cur = src[i], prev = src[(i + src.length - 1) % src.length], ci = inside(cur), pi = inside(prev);
        if (ci) { if (!pi) out.push(cut(prev, cur)); out.push(cur); } else if (pi) out.push(cut(prev, cur));
      }
      if (!out.length) break;
    }
    return out;
  }
  const onSheet = p => clipPoly(p, -12, -12, W + 12, H + 12);

  /* ================================================================ THE SHAPE OF THE WELL */
  // the eye looks down the middle of the well; every line that runs toward us goes back to this point, by the chhatri
  const VP = [960, 230];
  const rayX = (p, y) => VP[0] + (y - VP[1]) * (p[0] - VP[0]) / (p[1] - VP[1]);
  const rayY = (p, x) => VP[1] + (x - VP[0]) * (p[1] - VP[1]) / (p[0] - VP[0]);
  // every wall is painted in its own units: VH tall, a coping band, then two tiers of crossing flights
  const VH = 444, COPE = 24, TIER = 210, NST = 7, PW = 620, LAND = 44;
  // the five levels: where each far wall starts and ends down the sheet, where it starts across, and how old it is
  const LV = [
    { top: 300, foot: 452, a: 140, age: 0.04, years: [2027, 2025] },
    { top: 466, foot: 598, a: 202, age: 0.24, years: [2025, 2023] },
    { top: 611, foot: 726, a: 264, age: 0.5, years: [2023, 2022] },
    { top: 738, foot: 838, a: 326, age: 0.75, years: [2022, 2020] },
    { top: 849, foot: 936, a: 388, age: 0.95, years: [2020, 2019] }];
  const WTOP = 952, WA = 430;
  const MILES = [{ at: 2023 + 5.5 / 12, kind: 'sindoor' }, { at: 2022.5, kind: 'gold' }, { at: 2019.55, kind: 'soft' }];
  const FRESCO = [
    ['peacock', 'parrots', 'fish', 'horse', 'mango', 'lotus', 'peacock'],
    ['elephant', 'lotus', 'horse', 'parrots', 'peacock', 'fish', 'mango'],
    ['peacock', 'parrots', 'lotus', 'elephant', 'horse', 'mango', 'fish'],
    ['horse', 'elephant', 'fish', 'peacock', 'lotus', 'parrots', 'mango'],
    ['fish', 'lotus', 'peacock', 'elephant', 'fish', 'horse', 'lotus']
  ];
  const ROUND = ['#2a4a6a', '#7a2a2a', '#3f6a3e', '#b8342a'];

  // one stair pyramid in wall units: two flights falling left and right from a landing at (c, y0) to the foot at y1
  function mass(c, y0, y1, Pw, lw, n, seed) {
    const rise = (y1 - y0) / n, run = (Pw / 2 - lw / 2) / n, L = [], R = [], steps = [];
    const g = STAGE.rng((Math.round(c * 7.3 + y0 * 13.1 + seed * 101) >>> 0) + 1), j = () => ({ x: [0, 0].concat(Array.from({ length: n }, () => g.rr(-5.5, 5.5))), y: [0].concat(Array.from({ length: n }, (v, i) => i === n - 1 ? 0 : g.rr(-3.5, 3.5))) });
    const jl = j(), jr = j();
    const xl = i => c - lw / 2 - (i - 1) * run + (i > n ? 0 : jl.x[i]), xr = i => c + lw / 2 + (i - 1) * run - (i > n ? 0 : jr.x[i]);
    const yl = i => i === 0 ? y0 : y0 + i * rise + jl.y[i], yr = i => i === 0 ? y0 : y0 + i * rise + jr.y[i];
    L.push([xl(1), y0]); R.push([xr(1), y0]);
    for (let i = 1; i <= n; i++) {
      L.push([xl(i), yl(i)], [xl(i + 1), yl(i)]); R.push([xr(i), yr(i)], [xr(i + 1), yr(i)]);
      if (i < n) { steps.push({ x0: xl(i + 1), x1: xl(i), y: yl(i), dir: -1, h: yl(i + 1) - yl(i) }); steps.push({ x0: xr(i), x1: xr(i + 1), y: yr(i), dir: 1, h: yr(i + 1) - yr(i) }); }
    }
    steps.unshift({ x0: xl(1), x1: xr(1), y: y0, dir: 0, h: rise, riser: false });
    return { pts: L.slice().reverse().concat(R), apex: [xl(1), xr(1), y0], base: y1, steps, c, rise, run };
  }
  function massesFor(u0, u1, cref, seed) {
    const out = [];
    for (let j = 0; j < 2; j++) {
      const y0 = COPE + j * TIER, y1 = y0 + TIER, off = j === 0 ? PW / 2 : 0;
      let c = cref + off; while (c - PW > u0 - PW / 2) c -= PW;
      for (; c - PW / 2 < u1 + 2; c += PW) if (c + PW / 2 > u0 - 2) out.push(Object.assign(mass(c, y0, y1, PW, LAND, NST, seed), { tier: j }));
    }
    return out;
  }
  // a side wall: the strip between the rays through the top and the foot of the far wall's end, mapped from wall units
  function sideWall(L, side) {
    const left = side === 'left', cx = left ? L.a : L.b, Ct = [cx, L.top], Cf = [cx, L.foot];
    const xe = rayX(Ct, 1140);
    const xn = left ? Math.max(-60, xe) : Math.min(W + 60, xe);
    const Nt = [xn, rayY(Ct, xn)], Nf = [xn, rayY(Cf, xn)];
    const Uw = Math.abs(cx - xn) / (L.s * 0.55);
    const map = homog([[0, 0], [Uw, 0], [Uw, VH], [0, VH]], left ? [Nt, Ct, Cf, Nf] : [Ct, Nt, Nf, Cf]);
    const cl = clipPoly(left ? [Nt, Ct, Cf, Nf] : [Ct, Nt, Nf, Cf], -4, -4, W + 4, H + 4);
    let umin = 1e9, umax = -1e9; for (const q of cl) { const p = map.inv(q[0], q[1]); umin = Math.min(umin, p[0]); umax = Math.max(umax, p[0]); }
    const u0 = Math.max(0, umin - 8), u1 = Math.min(Uw, umax + 8);
    const cref = left ? Uw - PW * 0.3 : PW * 0.3;
    const quad = [map.f(u0, 0), map.f(u1, 0), map.f(u1, VH), map.f(u0, VH)];
    return { kind: side, map, Uw, u0, u1, quad, near: xn, masses: massesFor(u0, u1, cref, L.k * 10 + (left ? 1 : 2)) };
  }

  P.geom = function () {
    const G = { fmt: 'wide', W, H, keyAt, toneAt, VP };
    G.levels = LV.map((src, i) => {
      const L = Object.assign({ k: i + 1 }, src);
      L.b = W - L.a; L.s = (L.foot - L.top) / VH; L.Wu = (L.b - L.a) / L.s; L.uc = L.Wu / 2; L.mid = (L.top + L.foot) / 2;
      L.keyV = v => keyAt(L.top + v * L.s);
      L.far = { kind: 'far', map: scaleMap(L.s, L.a, L.top), u0: 0, u1: L.Wu, quad: rect(L.a, L.top, L.b, L.foot), masses: massesFor(0, L.Wu, L.uc, L.k * 10) };
      L.left = sideWall(L, 'left'); L.right = sideWall(L, 'right');
      L.alcove = { u: L.uc, v: 436, w: 90, h: 150 };
      // the years down this level's gauge, in wall units
      L.vOf = Y => (Y > L.years[0] + 1e-6 || Y < L.years[1] - 1e-6) ? null : COPE + (L.years[0] - Y) / (L.years[0] - L.years[1]) * (VH - COPE);
      return L;
    });
    // the floor of each level: a U between the foot of its walls and the top of the walls below (or the water)
    G.levels.forEach((L, i) => {
      const N = G.levels[i + 1] || { a: WA, top: WTOP };
      L.na = N.a; L.ntop = N.top;
      const YF = 1700, fl = [L.a, L.foot], fr = [L.b, L.foot], nl = [N.a, N.top], nr = [W - N.a, N.top];
      L.terr = onSheet([[rayX(fl, YF), YF], fl, fr, [rayX(fr, YF), YF], [rayX(nr, YF), YF], nr, nl, [rayX(nl, YF), YF]]);
      L.terrL = onSheet([[rayX(fl, YF), YF], fl, [N.a, L.foot], nl, [rayX(nl, YF), YF]]);
      L.terrR = onSheet([[rayX(nr, YF), YF], nr, [W - N.a, L.foot], fr, [rayX(fr, YF), YF]]);
    });
    {
      const YF = 1700, l = [WA, WTOP], r = [W - WA, WTOP];
      G.pool = onSheet([l, r, [rayX(r, YF), YF], [rayX(l, YF), YF]]);
    }
    const L1 = G.levels[0];
    G.deck = onSheet([[-60, 291], [W + 60, 291], [W + 60, rayY([L1.b, L1.top], W + 60)], [L1.b, L1.top], [L1.a, L1.top], [-60, rayY([L1.a, L1.top], -60)]]);
    // the rim, drawn with the tall well's rim motifs at four tenths of their size; the chhatri a little larger
    G.rimMap = scaleMap(0.4, 0, 300 - 690 * 0.4);
    G.chhatri = { map: place(960, 281, 0.5, 650, 640), cx: 650, by: 640, s: 1, hx: 960 };
    // what stands on each floor (picture units), its size, and the box it hides of the wall behind it
    G.obj = {
      dove: { x: 512, yb: 461, k: 0.3, s: 0.94 },
      loom: { x: 1392, yb: 461, k: 0.3, s: 1 },
      tank: { x: 1328, yb: 607, k: 0.34 },
      cups: { x: 738, yb: 734, k: 0.42, s: 1.6 },
      pole: { x: 1252, yb: 846, k: 0.3, h: 318 },
      kund: { x: 1178, yb: 946, k: 0.36, w: 300 },
      lan: { from: [352, 634], to: [1568, 634], sag: 40, n: 15, k: 0.42 },
      delta: { x: 600, y: 774, s: 31, slots: [[0, 0], [84, -36], [-4, 64], [168, -70], [80, 100], [250, -100], [160, 136]].map(q => [q[0] * 0.46, q[1] * 0.42]) },
      diya: [960, 1040]
    };
    G.busy = [
      [470, 336, 556, 461], [1336, 368, 1450, 461],
      [1276, 506, 1380, 607], [930, 540, 990, 600],
      [710, 686, 766, 734],
      [1222, 746, 1300, 846],
      [1120, 880, 1236, 946]];
    {
      const s = G.obj.lan, k = s.k, R = STAGE.rng(20231), from = [s.from[0] / k, s.from[1] / k], to = [s.to[0] / k, s.to[1] / k], sag = s.sag / k;
      const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + sag];
      const q = t => { const u = 1 - t, cx = 2 * mid[0] - (from[0] + to[0]) / 2, cy = 2 * mid[1] - (from[1] + to[1]) / 2; return [u * u * from[0] + 2 * u * t * cx + t * t * to[0], u * u * from[1] + 2 * u * t * cy + t * t * to[1]]; };
      G.lanString = { from, to, sag };
      G.lanterns = []; for (let i = 0; i < s.n; i++) { const t = (i + 0.5) / s.n, p = q(t), hang = R.rr(12, 22), r = R.rr(11, 14); G.lanterns.push({ top: p, x: p[0], y: p[1] + hang + 16, r, hang }); }
    }
    return G;
  };

  /* ================================================================ PAINTING HELPERS */
  // a wash whose colour changes from place to place, rubbed in with a cloth.  colAt(x, y) in picture units
  function gradWash(A, poly, colAt, k) {
    const mk = A.pushMask(poly, 0); A.popMask();
    const S = A.S;
    for (let y = 0; y < mk.h; y++) {
      const Y = y + mk.y0; if (Y < 0 || Y >= A.H) continue;
      for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
        const X = x + mk.x0; if (X < 0 || X >= A.W) continue;
        const c = colAt(X / S, Y / S), kk = v * (typeof k === 'function' ? clamp(k(X / S, Y / S), 0, 1) : k); if (kk <= 0) continue;
        const i = Y * A.W + X; A.R[i] += (c[0] - A.R[i]) * kk; A.G[i] += (c[1] - A.G[i]) * kk; A.B[i] += (c[2] - A.B[i]) * kk;
      }
    }
  }
  // the same on a wall, the colour asked for in the wall's own units
  function washZ(A, Z, poly, colAt, k) {
    const z = Z.__z; gradWash(A, poly.map(p => z.f(p[0], p[1])), (x, y) => { const q = z.inv(x, y); return colAt(q[0], q[1]); }, k);
  }
  // turn painted stone to the light of its own height on its wall (each pixel to the key of its own row of the wall)
  function retintZ(A, Z, polys, L, refV, field) {
    const z = Z.__z, mk = A.pushMask(polys.map(p => p.map(q => z.f(q[0], q[1]))), 0); A.popMask();
    const S = A.S, ref = L.keyV(refV)[field];
    for (let y = 0; y < mk.h; y++) {
      const Y = y + mk.y0; if (Y < 0 || Y >= A.H) continue;
      for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
        const X = x + mk.x0; if (X < 0 || X >= A.W) continue;
        const c = L.keyV(z.inv((X + 0.5) / S, (Y + 0.5) / S)[1])[field];
        const f0 = clamp(c[0] / ref[0], 0.55, 1.7), f1 = clamp(c[1] / ref[1], 0.55, 1.7), f2 = clamp(c[2] / ref[2], 0.55, 1.7);
        const i = Y * A.W + X; A.R[i] *= 1 + (f0 - 1) * v; A.G[i] *= 1 + (f1 - 1) * v; A.B[i] *= 1 + (f2 - 1) * v;
      }
    }
  }
  // light in a slanting band, soft at its edges
  function shaft(A, poly, c, k) {
    const bb = A.bbox([poly]), sd = A.rr(0, 40);
    const a = [(poly[0][0] + poly[1][0]) / 2, poly[0][1]], b = [(poly[2][0] + poly[3][0]) / 2, poly[2][1]];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const half = y => lerp(Math.abs(poly[1][0] - poly[0][0]), Math.abs(poly[2][0] - poly[3][0]), (y - bb[1]) / (bb[3] - bb[1])) / 2 * Math.abs(nx);
    const wide = A.roughen(poly.map(p => [p[0] + (p[0] > (a[0] + b[0]) / 2 ? 50 : -50), p[1]]), 8, 60, true);
    M.floorWash(A, wide, c, (x, y) => { const d = Math.abs((x - a[0]) * nx + (y - a[1]) * ny) / Math.max(1, half(y)); return k * (1 - sstep((d - 0.45) / 0.75)) * (0.75 + 0.35 * A.noise2(x / 160 + sd, y / 190, 9)) * (0.55 + 0.45 * sstep((bb[3] - y) / (bb[3] - bb[1]))); }, 'over');
  }

  /* ================================================================ THE PICTURE */
  P.background = function (A, G, say) {
    let n = 0;
    const part = name => { if (say) say(name); A.reseed(9001 + (++n) * 7919); };
    const restore = wrapM();
    try {
      part('sky'); sky(A, G);
      part('hill'); hill(A, G);
      rim(A, G, part);
      G.levels.forEach(L => {
        for (const side of ['far', 'left', 'right']) { part(side + ' ' + L.k); wall(A, G, L, L[side]); }
        part('corners ' + L.k); corners(A, G, L);
        part('floor ' + L.k); floor(A, G, L);
      });
      part('gauge'); gauge(A, G);
      part('marks'); G.levels.forEach(L => marks(A, G, L));
      part('light'); light(A, G);
      G.levels.forEach(L => { part('objects ' + L.k); objects(A, G, L); part('life ' + L.k); life(A, G, L); });
      part('lamps'); lamps(A, G);
      part('water'); water(A, G);
      part('birds'); birds(A, G);
      part('gold'); gold(A, G);
      part('grain'); grain(A, G);
    } finally { restore(); }
  };

  // ---------------------------------------------------------------- the sky over the rim, at noon
  function sky(A, G) {
    const sk = rect(0, 0, W, 240);
    gradWash(A, sk, (x, y) => mixc(hexc('#a9c8d6'), hexc('#f4dfa6'), sstep(y / 190)), 1);
    for (let y = -8; y < 240; y += 15) {
      const c = A.mix('#9ec2d4', '#f3d79a', sstep((y + 8) / 190));
      A.fill(rect(-20, y, W + 20, y + 21), 'side', c, { w: 17, p: 0.55, passes: 1, ang: A.rr(-0.04, 0.04), reach: 1.2, flow: 0.55, cv: 0.03 });
    }
    // the gold room round the sun, and long veils of light
    M.floorWash(A, sk, '#f7e2a0', (x, y) => 0.75 * Math.max(0, 1 - Math.hypot((x - 250) / 760, (y - 64) / 300)), 'over');
    for (let i = 0; i < 12; i++) { const y = A.rr(14, 150); A.stroke([[A.rr(-40, 360), y], [A.rr(800, 1900), y + A.rr(-8, 8)]], 'side', A.pick(['#fbeab8', '#f7dc90', '#fff2cc']), { w: A.rr(5, 12), p: A.rr(0.16, 0.3), reach: 0.9 }); }
    for (let i = 0; i < 7; i++) { const y = A.rr(18, 96), x = A.rr(380, 1800); if (Math.abs(x - 960) < 200) continue; M.cloudBand(A, [[x, y], [x + 70, y - 4], [x + A.rr(130, 200), y + 3]], A.rr(7, 11), { c: '#fbf3e0', rim: 'khadi', shade: '#d8b080' }); }
    // the chhatri stands against a breath of light, so it glows from across the well
    M.floorWash(A, rect(640, 0, 1280, 300), '#fff2c4', (x, y) => 0.42 * Math.pow(Math.max(0, 1 - Math.hypot((x - 960) / 300, (y - 150) / 190)), 1.3), 'over');
    M.sun(A, 250, 64, 30, { c: 'cream' });
    M.goldDust(A, [[250, 64]], 200, 200, { sx: 2.6, sy: 1, big: 1.3 });
  }

  // ---------------------------------------------------------------- the hill behind the wall
  function hill(A, G) {
    const ridge = [[-60, 220]], sd = 3.1;
    for (let x = -40; x <= W + 60; x += 28) ridge.push([x, 122 + 40 * A.noise1(x / 210 + sd, 3) - 40 * Math.exp(-Math.pow((x - 1530) / 190, 2)) - 26 * Math.exp(-Math.pow((x - 360) / 150, 2)) + 10 * Math.exp(-Math.pow((x - 960) / 160, 2))]);
    ridge.push([W + 60, 220]);
    M.rockHill(A, ridge, 236, { size: 0.55, palette: { crevice: '#4a4a26', line: 'sepia', fam: [
      { w: 3.0, c: ['olive', '#8a9442', '#7d8a3a'], fold: 'moss', lip: '#c9c46a' },
      { w: 2.4, c: ['sage', '#a9b47a', '#9aa56a'], fold: 'bottle', lip: 'cream' },
      { w: 1.6, c: ['pinkrock', '#d8a890', '#c99a84'], fold: 'lac', lip: 'khadi' },
      { w: 1.3, c: ['ochre', '#c9a060', 'sand'], fold: 'umber', lip: 'cream' },
      { w: 0.9, c: ['#5b6b30', 'moss'], fold: 'bottle', lip: 'sage' }] } });
    const ry = x => { for (let k = 0; k + 1 < ridge.length; k++) if (x >= ridge[k][0] && x <= ridge[k + 1][0]) return lerp(ridge[k][1], ridge[k + 1][1], (x - ridge[k][0]) / (ridge[k + 1][0] - ridge[k][0])); return 220; };
    const R = STAGE.rng(77);
    for (let i = 0; i < 190; i++) {
      const x = R.rr(-20, W + 20), y = R.rr(ry(x) + 14, 196);
      if (y > 198 || (Math.abs(x - 960) < 90 && y < 150)) continue;
      if (R.chance(0.6)) M.tree(A, x, y, R.rr(14, 34), R.pick(['dotted', 'puff', 'bell', 'dotted']), { zone: 'A' });
      else M.shrub(A, x, y, R.rr(10, 18), 'dot', { zone: 'A' });
    }
    // a small temple on the far ridge with its red flag
    const tx = 1530, ty = ry(1530) + 6, Zt = zoom(A, place(tx, ty, 0.55, 0, 0));
    const sh = A.spline([[-14, 0], [-12, -20], [-6, -34], [0, -40], [6, -34], [12, -20], [14, 0]], true, 0.6);
    Zt.shape(sh, { c: '#efe2c4', w: 2.4, line: '#4a3020', lw: 0.7, lp: 0.8, rough: 0.2 });
    Zt.shape(rect(-20, 0, 20, 14), { c: '#e6d2a8', w: 2.4, line: '#4a3020', lw: 0.7, lp: 0.8, rough: 0.2 });
    Zt.stroke([[0, -40], [0, -58]], 'kajal', '#3a2010', { w: 0.8, p: 0.9 });
    Zt.fill([[0, -58], [16, -54], [0, -50]], 'chalk', '#c8321c', { w: 1.6, p: 1, passes: 1 });
  }

  // ---------------------------------------------------------------- the rim: jali wall, rail, paving, the chhatri
  function rim(A, G, part) {
    const Zr = zoom(A, G.rimMap), T = toneAt(A, 250), ch = G.chhatri, Zc = zoom(A, ch.map);
    const cxr = ch.hx / 0.4, half = 165 / 0.4 * 0.5;
    part('trees');
    // tall trees by the wall as in the photograph, their feet hidden by it
    M.tree(Zr, 150, 620, 330, 'radiate', { zone: 'B' });
    M.tree(Zr, 4700, 610, 300, 'radiate', { zone: 'B' });
    M.tree(Zr, 4180, 384, 130, 'puff', { zone: 'A' });
    M.tree(Zr, 640, 384, 110, 'bell', { zone: 'A' });
    M.tree(Zr, 3560, 384, 92, 'bell', { zone: 'A' });
    part('wall');
    M.wellArchWall(Zr, -30, 4830, 362, 606, T, { bay: 116, skip: [cxr - half, cxr + half] });
    // the chhatri's shadow on the wall to its right: the sun is high and to the left
    {
      const sil = M.wellChhatriShape(Zc, ch.cx, ch.by, ch.s).map(p => p.map(q => [q[0] + 128, q[1] + 34]));
      A.withMask(rect(0, 168, W, 267), () => {
        M.floorUnion(Zc, sil, '#a07a78', (x, y) => 0.34 + 0.1 * A.noise2(x / 40, y / 40, 3), 9 * A.S, 'mul', { ang: -1.1, len: 30, wid: 2.6, amt: 0.5 });
        M.floorUnion(Zc, sil, '#8a7088', () => 0.12, 14 * A.S, 'over', { ang: -0.9, len: 22, wid: 2.2, amt: 0.6 });
      });
    }
    // pigeons resting on the coping of the wall
    {
      const R = STAGE.rng(5);
      for (let i = 0; i < 40; i++) { const x = R.rr(40, 4760); if (Math.abs(x - cxr) < 260) continue; M.pigeonSit(Zr, x, 350, R.rr(10, 13), R.chance(0.5), R.pick(['slate', '#8a8f98', '#6e7682', '#9aa0a8'])); }
    }
    part('rail');
    M.wellPave(Zr, -30, 4830, 640, 676, T);
    const posts = M.wellRail(Zr, -30, 4830, 640, 34, T, { skip: [cxr - half + 20, cxr + half - 20], gap: 92 });
    part('deck');
    deck(A, G);
    part('chhatri');
    {
      const sh = M.wellChhatriShape(Zc, ch.cx, ch.by, ch.s);
      M.floorUnion(Zc, [sh[0].map(q => [q[0] + 24, q[1] + 10])], '#7a6040', () => 0.4, 2 * A.S, 'mul');
      G.chhatriInfo = M.wellChhatri(Zc, ch.cx, ch.by, ch.s, T);
      M.goldDust(Zc, [[ch.cx, 300], [ch.cx - 60, 390], [ch.cx + 40, 420]], 90, 90, { sx: 1.6, sy: 0.8 });
    }
    part('torans');
    for (let i = 0; i + 1 < posts.length; i++) {
      const a = posts[i], b = posts[i + 1]; if (b - a > 140 || i % 2) continue;
      M.garland(Zr, [[a, 608], [(a + b) / 2, 626], [b, 608]], T, { r: 5.6, step: 8 });
    }
    M.garland(Zc, [[ch.cx - 130, 600], [ch.cx - 65, 622], [ch.cx, 604], [ch.cx + 65, 622], [ch.cx + 130, 600]], T, { r: 5.6, step: 8 });
  }
  // the walk round the mouth of the well, from the paving to the lip
  function deck(A, G) {
    const K = keyAt(296), p = G.deck;
    A.fill(p, 'side', K.tread, { w: 8, p: 0.9, passes: 2, ang: 0.02, reach: 1.4, cv: 0.03 });
    M.floorCloud(A, p, A.mix(K.tread, K.recess, 0.4), { scale: 40, seed: 3.3, thr: 0.6, soft: 0.2, p: 0.3, w: 6, ang: 0.03 });
    A.withMask(p, () => { for (let x = -40; x < W + 40; x += A.rr(40, 70)) { const top = [x, 291], bot = [rayX([x, 291], 330), 330]; hl(A, top, bot, 'kajal', A.mix(K.tread, K.line, 0.5), { w: 0.5, p: 0.38 }); } });
    // the lip, lit along its edge
    const L1 = G.levels[0], lipL = [[-60, rayY([L1.a, L1.top], -60)], [L1.a, L1.top], [L1.b, L1.top], [W + 60, rayY([L1.b, L1.top], W + 60)]];
    A.stroke(lipL.map(q => [q[0], q[1] - 1.2]), 'chalk', A.mix(K.tread, 'khadi', 0.7), { w: 1.6, p: 0.8 });
    A.stroke(lipL, 'kajal', K.line, { w: 1, p: 0.8 });
  }

  // ---------------------------------------------------------------- one wall of one level (far, left or right)
  function wall(A, G, L, Wd) {
    const Z = zoom(A, Wd.map), u0 = Wd.u0, u1 = Wd.u1, kv = L.keyV, age = L.age, k = L.k, face = rect(u0, 0, u1, VH);
    const Km = kv(VH * 0.5), Tm = c => { const K = kv(VH * 0.6); return A.mix(c, K.glaze, K.gl); };
    const area = (u1 - u0) / 1600;
    Z.withMask(face, () => {
      // the stone laid in the hour of the level, then each row turned to the hour of its own height
      washZ(A, Z, face, (u, v) => kv(v).wall, 1);
      for (let v = -10; v < VH; v += 110) {
        const b = Z.roughen(rect(u0 - 20, v, u1 + 20, v + 130), 8, 40, true);
        Z.fill(b, 'side', kv(v + 60).wall, { w: 30, p: 0.7, passes: 2, turn: 0.8, ang: Z.rr(-0.7, -0.4), reach: 1.4, cv: 0.03 });
      }
      Z.blend(face, { r: 8, k: 0.36 });
      washZ(A, Z, face, (u, v) => kv(v).wall, 0.28);
      M.wellStone(Z, face, Km, { c: Km.wall, joints: 30, mottle: 0.8, grain: 0.8, ground: false, age });
      frescos(A, Z, G, L, Wd, Tm);
      M.floorWash(Z, rect(u0, 0, u1, 76), Km.cast, (x, y) => 0.55 * (1 - sstep((y - COPE) / 46)), 'mul');
      M.wellStains(Z, u0, u1, COPE + 2, 110 + 150 * age, Math.max(1, Math.round((6 + 28 * age) * area)), Km);
      if (age > 0.6) for (let i = 0; i < Math.round(age * 2); i++) M.wellTide(Z, u0 - 10, u1 + 10, COPE + TIER * (0.85 + i * 0.85 + Z.rr(-0.12, 0.12)), kv(300), { salt: 0.18 + age * 0.15, sh: 10 + age * 8, dh: 16 + age * 14 });
      retintZ(A, Z, [face], L, VH * 0.5, 'wall');
      const off = [[34, 14], [48, 16], [56, 16], [40, 12], [24, 8]][k - 1], sk = [0.58, 0.6, 0.55, 0.42, 0.3][k - 1];
      M.wellShadow(Z, Wd.masses.map(m => m.pts), Km, off, sk);
      for (const m of Wd.masses) M.wellMass(Z, m, kv((m.apex[2] + m.base) / 2), age);
      for (let j = 0; j < 2; j++) { const ms = Wd.masses.filter(m => m.tier === j); if (ms.length) retintZ(A, Z, ms.map(m => m.pts), L, (ms[0].apex[2] + ms[0].base) / 2, 'face'); }
      niches(A, Z, G, L, Wd);
      if (Wd.kind === 'far') {
        const al = L.alcove;
        L.alcoveInfo = M.wellAlcove(Z, al.u, al.v, al.w, al.h, kv(al.v - 50), age);
        // its lamp, lit: the niche warm round it
        M.wellNicheGlow(Z, al.u, al.v, al.w, al.h);
        M.wellDiya(Z, al.u - 8, al.v - 2, 1.5, k % 3);
      }
      aging(A, Z, G, L, Wd);
      coping(A, Z, L, Wd);
    });
    // the side walls turn from the sun on the left and toward it on the right
    const q = onSheet(Wd.quad);
    if (q.length > 2) {
      if (Wd.kind === 'left') M.floorWash(A, q, Km.cast, (x, y) => 0.36 + 0.06 * A.noise2(x / 60, y / 60, 4), 'mul');
      if (Wd.kind === 'right') M.floorWash(A, q, Km.lime, (x) => 0.06 + 0.05 * sstep((x - L.b) / 160), 'over');
    }
    if (Wd.kind === 'far') {
      // the left side wall throws its shadow across the end of the far wall
      const d = (L.foot - L.top) * 0.62, tri = [[L.a - 2, L.top], [L.a + d * 0.35, L.top], [L.a + d, L.foot + 2], [L.a - 2, L.foot + 2]];
      M.floorWash(A, A.roughen(tri, 1.5, 20, true), Km.cast, (x, y) => { const e = (L.a + d * 0.35 + (d * 0.65) * (y - L.top) / (L.foot - L.top)) - x; return 0.42 * sstep(e / 8); }, 'mul');
    }
  }
  // the wall paintings in the V's: a panel high in the V and a roundel lower down
  function frescos(A, Z, G, L, Wd, T) {
    const K = L.keyV(VH * 0.4), side = Wd.kind; let n = side === 'left' ? 3 : side === 'right' ? 5 : 0;
    const R = STAGE.rng(900 + L.k * 7 + n);
    for (let j = 0; j < 2; j++) {
      const ms = Wd.masses.filter(m => m.tier === j).sort((a, b) => a.c - b.c);
      for (let i = 0; i + 1 < ms.length; i++) {
        const a = ms[i], b = ms[i + 1], vx = (a.c + b.c) / 2, Vw = b.apex[0] - a.apex[1], ty = a.apex[2], h = a.base - ty;
        if (vx < Wd.u0 + 90 || vx > Wd.u1 - 90) continue;
        const pw = Vw * 0.44, age = clamp(L.age + (j - 0.5) * 0.06, 0, 1), calm = side === 'left' ? 0.32 : side === 'right' ? 0.16 : 0.12;
        const pb = [vx - pw / 2, ty + h * 0.07, vx + pw / 2, ty + h * 0.4], r = clamp(Vw * 0.07, 30, 46), rb = [vx - r, ty + h * 0.63 - r, vx + r, ty + h * 0.63 + r];
        // not every V is painted: some keep only a roundel, some only a panel, a few are bare stone with the stains on them
        const pick = R.rnd(), panel = pick > 0.3 && pick < 0.92 || pick < 0.12, round = pick > 0.12;
        if (panel && !busyW(G, Wd, pb)) M.wellFresco(Z, pb, FRESCO[L.k - 1][n % 7], K, { T, age, calm });
        if (round && pick < 0.82 && !busyW(G, Wd, rb)) M.wellRoundel(Z, vx, ty + h * 0.63, r, K, { T, age, calm, ground: ROUND[(n + L.k) % 4] });
        n++;
      }
    }
  }
  // does a box on a wall (wall units) fall behind something standing on a floor in front of it?
  function busyW(G, Wd, b) { const p0 = Wd.map.f(b[0], b[1]), p1 = Wd.map.f(b[2], b[3]); return G.busy.some(o => Math.max(p0[0], p1[0]) > o[0] && Math.min(p0[0], p1[0]) < o[2] && Math.max(p0[1], p1[1]) > o[1] && Math.min(p0[1], p1[1]) < o[3]); }
  // the plain niches of the photograph, cut under some of the landings between the flights, dark inside
  function niches(A, Z, G, L, Wd) {
    const R = STAGE.rng(1200 + L.k * 13 + ['far', 'left', 'right'].indexOf(Wd.kind));
    for (const m of Wd.masses) {
      const pick = R.rnd(), w = R.rr(64, 86), h = w * R.rr(1.5, 1.75), yb = m.base - 4;
      if (Wd.kind === 'far' && (m.c < 400 || Math.abs(m.c - L.alcove.u) < L.Wu * 0.3)) continue;
      if (m.c < Wd.u0 + 70 || m.c > Wd.u1 - 70 || pick > (Wd.kind === 'far' ? 0.22 : 0.3)) continue;
      if (busyW(G, Wd, [m.c - w / 2 - 12, yb - h - 14, m.c + w / 2 + 12, yb + 6])) continue;
      M.wellAlcove(Z, m.c, yb, w, h, L.keyV(yb - h / 2), L.age);
    }
  }
  // the coping along the top of a wall: its face with a carved frieze, lit along the lip
  function coping(A, Z, L, Wd) {
    const K = L.keyV(12), u0 = Wd.u0 - 6, u1 = Wd.u1 + 6, band = rect(u0, 0, u1, COPE);
    Z.fill(band, 'side', K.face, { w: 18, p: 1, reach: 1.5, passes: 2, ang: Z.rr(-0.04, 0.04), cv: 0.03 });
    M.floorWash(Z, band, K.riser, (x, y) => 0.34 * sstep(y / COPE), 'mul');
    M.wellFrieze(Z, u0, u1, 3, COPE - 2, K, L.k % 2 ? 'lotus' : 'chevron', L.age);
    Z.stroke([[u0, 1.4], [u1, 1.4]], 'chalk', Z.mix(K.tread, 'khadi', 0.6), { w: 2.2, p: 0.75 });
    hl(Z, [u0, 0], [u1, 0], 'kajal', K.line, { w: 1.2, p: 0.85 });
    hl(Z, [u0, COPE], [u1, COPE], 'kajal', K.line, { w: 1, p: 0.75 });
    if (L.age > 0.4) for (let x = u0 + Z.rr(0, 80); x < u1; x += Z.rr(60, 160) / L.age) if (Z.chance(L.age * 0.7)) M.wellMossPad(Z, x, x + Z.rr(20, 70), 2, K, { h: 3 + L.age * 7, hang: 4 + L.age * 6 });
  }
  // stains, salt, lichen, cracks, a peepal, ferns, drips: as the well goes down (as in the tall well, by area)
  function aging(A, Z, G, L, Wd) {
    const k = L.k, age = L.age, u0 = Wd.u0, u1 = Wd.u1, kv = L.keyV, area = (u1 - u0) / 1600;
    const R = STAGE.rng(400 + k * 10 + ['far', 'left', 'right'].indexOf(Wd.kind));
    const N = v => Math.max(0, Math.round(v * area));
    const inV = (x, y) => !Wd.masses.some(m => Z.inside([m.pts], x, y));
    for (let i = 0; i < N(4 + age * 10); i++) { const x = R.rr(u0 + 20, u1 - 20), y = R.rr(COPE + 20, VH - 20); M.wellCrack(Z, x, y, R.rr(18, 50), R.rr(0.9, 2.2), kv(y).line); }
    if (age > 0.2) {
      const nc = N(1 + age * 3);
      for (let c = 0; c < nc; c++) {
        const cx = R.rr(u0 + 60, u1 - 60), cy = R.rr(COPE + TIER * 0.6, VH - 40), K = kv(cy);
        for (let i = 0; i < 4 + age * 8; i++) M.wellLichen(Z, cx + R.rr(-44, 44), cy + R.rr(-30, 30), R.rr(2.5, 7) * (0.7 + age * 0.4), K);
      }
      for (let t = 0; t < 2; t++) {
        const yb = COPE + TIER * (t + 1), K = kv(yb);
        M.floorCloud(Z, rect(u0, yb - TIER * (0.3 + age * 0.3), u1, yb + 4), Z.mix(K.recess, K.deep, 0.5), { scale: 34, seed: R.rr(1, 99), thr: 0.66 - age * 0.1, soft: 0.3, p: 0.1 + age * 0.16, w: 9, ang: 1.45 });
      }
      for (let c = 0; c < N(2 + age * 6); c++) { const t = R.ri(0, 1), cx = R.rr(u0 + 30, u1 - 30), cy = COPE + TIER * (t + R.rr(0.7, 0.95)); M.wellPeel(Z, cx, cy, R.rr(6, 13), kv(cy), { p: 0.45 }); }
    }
    if (age > 0.45) {
      for (let i = 0; i < N(age * 30); i++) { const m = Wd.masses[R.ri(0, Wd.masses.length - 1)], s = m.steps[R.ri(1, m.steps.length - 1)]; if (!s) continue; const x = s.dir < 0 ? s.x0 + 2 : s.x1 - 2; if (x > u1 || x < u0) continue; M.wellDrip(Z, x, s.y + 7, R.rr(8, 30), kv(s.y)); }
      for (const m of Wd.masses) { const yb = m.base; for (const sg of [-1, 1]) { const x = m.c + sg * PW / 2; if (x < u0 || x > u1) continue; M.wellMoss(Z, [[x - 30, yb - 2], [x + 30, yb - 2]], kv(yb), { k: age, h: 4 + age * 6 }); } }
    }
    if (k === 3) {
      // a peepal has split the stone of a V, as they do
      const ms = Wd.masses.filter(m => m.tier === 0).sort((a, b) => a.c - b.c);
      if (ms.length > 3) { const m = ms[Wd.kind === 'far' ? 1 : ms.length - 2], x = m.c + PW / 2, y = m.base - 30; M.wellPeepal(Z, x, y, Wd.kind === 'far' ? 1.05 : 1.2, kv(y)); }
    }
    if (age > 0.45) {
      const nc = N(age * 10);
      for (let i = 0; i < nc; i++) {
        const x = R.rr(u0 + 30, u1 - 30);
        if (i % 2 === 0) M.wellCreeper(Z, x, COPE + 4, R.rr(60, 160) * age, kv(COPE + 80), { seed: R.rr(0, 99) });
        else { const m = Wd.masses[R.ri(0, Wd.masses.length - 1)], st = m.steps[R.ri(1, m.steps.length - 1)]; if (st && st.dir) M.wellCreeper(Z, st.dir < 0 ? st.x0 + 6 : st.x1 - 6, st.y + 4, R.rr(30, 90) * age, kv(st.y), { seed: R.rr(0, 99) }); }
      }
    }
    if (age > 0.7) {
      for (let t = 0; t < 2; t++) {
        const ty = COPE + TIER * t, K = kv(ty + 60);
        for (let i = 0; i < N(10 + age * 14); i++) {
          const x = R.rr(u0 + 10, u1 - 10), yy = ty + (t ? R.rr(2, 10) : R.rr(26, 40));
          if (!inV(x, yy + 6)) continue;
          M.wellWetStreak(Z, x, yy, R.rr(50, 190) * age, R.rr(4, 10), K);
        }
        const sy = ty + TIER * R.rr(0.5, 0.82);
        M.wellSalt(Z, u0, u1, sy, kv(sy), { k: 0.55 + (age - 0.7) * 1.4 });
      }
      for (let c = 0; c < N(8); c++) {
        const cx = R.rr(u0 + 40, u1 - 40), cy = R.rr(COPE + 30, VH - 30), K = kv(cy), orange = c % 2 === 0;
        for (let i = 0; i < 6; i++) M.wellLichen(Z, cx + R.rr(-40, 40), cy + R.rr(-26, 26), R.rr(8, 17), K, orange ? { c: Z.mix('#e0a040', K.glaze, K.gl), d: '#8a4a1a' } : {});
      }
    }
    if (age > 0.6) {
      for (let i = 0; i < N(12); i++) {
        const x = R.rr(u0 + 30, u1 - 30), y = R.rr(COPE + 60, VH - 6); if (!inV(x, y)) continue;
        const K = kv(y);
        M.wellFern(Z, x, y, R.rr(0.9, 1.5), K, { lean: R.rr(-0.6, 0.7), n: R.ri(7, 11), c: Z.mix('#2f4a26', K.deep, 0.25), c2: Z.mix('#7fae44', K.glaze, K.gl * 0.7) });
      }
    }
  }
  // the corners where a side wall meets the far wall
  function corners(A, G, L) {
    const K = keyAt(L.mid);
    for (const x of [L.a, L.b]) {
      const left = x === L.a;
      // the turn of the stone: a dark seam, the edge of the far wall caught by the light
      M.floorWash(A, rect(x - (left ? 7 : 0), L.top, x + (left ? 0 : 7), L.foot), K.cast, (px) => 0.32 * (1 - Math.abs(px - x) / 7), 'mul');
      A.stroke([[x + (left ? 1.4 : -1.4), L.top + 2], [x + (left ? 1.4 : -1.4), L.foot]], 'chalk', A.mix(K.tread, 'khadi', 0.4), { w: 1.2, p: left ? 0.35 : 0.6 });
      hl(A, [x, L.top], [x, L.foot + 1], 'kajal', K.line, { w: 1, p: 0.82 });
    }
  }

  // ---------------------------------------------------------------- the floor of a level (a U round the drop to the next)
  function floor(A, G, L) {
    const K = keyAt(L.foot + 6), p = L.terr, R = STAGE.rng(300 + L.k), age = L.age;
    if (p.length < 3) return;
    A.fill(p, 'side', K.tread, { w: 10, p: 0.95, passes: 2, ang: 0.03, reach: 1.4, cv: 0.035 });
    A.blend(p, { r: 4, k: 0.3, ang: 0.02, len: 60 });
    M.floorCloud(A, p, A.mix(K.tread, K.recess, 0.5), { scale: 40, seed: L.k * 7 + 3, thr: 0.58, soft: 0.2, p: 0.32 + age * 0.15, w: 7, ang: 0.05 });
    M.floorCloud(A, p, A.mix(K.tread, 'khadi', 0.5), { scale: 34, seed: L.k * 5 + 1, thr: 0.6, soft: 0.2, p: 0.25, w: 6, ang: -0.1 });
    const fl = [L.a, L.foot], fr = [L.b, L.foot], nl = [L.na, L.ntop], nr = [W - L.na, L.ntop];
    A.withMask(p, () => {
      // the slabs: their joints run back to the eye's point, and across in rows that open out toward us
      for (let t = 0.12; t < 1; t += R.rr(0.07, 0.11)) {
        const x = lerp(L.a, L.b, t), q0 = [x, L.foot], q1 = [rayX(q0, L.ntop + 2), L.ntop + 2];
        hl(A, q0, q1, 'kajal', A.mix(K.tread, K.line, 0.5), { w: 0.55, p: 0.4 });
      }
      for (const sg of [-1, 1]) {
        const o = sg < 0 ? fl : fr, nIn = sg < 0 ? nl : nr;
        for (let f = 0.33; f < 1; f += 0.33) { const a = [lerp(o[0], nIn[0], f), lerp(o[1], nIn[1], f)]; hl(A, a, [rayX(a, H + 40), H + 40], 'kajal', A.mix(K.tread, K.line, 0.45), { w: 0.55, p: 0.36 }); }
        for (let y = L.foot + 10, st = 9 * L.s / 0.34; y < H + 10; y += st, st *= 1.12) hl(A, [rayX(o, y) - sg * 2, y], [rayX(nIn, y) + sg * 2, y + R.rr(-0.6, 0.6)], 'kajal', A.mix(K.tread, K.line, 0.42), { w: 0.6, p: 0.36 });
      }
      // a midline joint across the far strip
      hl(A, [L.a, (L.foot + L.ntop) / 2], [L.b, (L.foot + L.ntop) / 2 + R.rr(-0.5, 0.5)], 'kajal', A.mix(K.tread, K.line, 0.42), { w: 0.55, p: 0.32 });
      // feet have worn the slabs pale down the middle of each walk
      M.floorWash(A, p, 'khadi', (x, y) => 0.12 * sstep(1 - Math.abs(x - 960) / 900), 'over');
      // under the foot of every wall the floor is in its shadow; the left walk lies in the shade of the wall beside it
      M.floorWash(A, p, K.cast, (x, y) => {
        const dl = Math.abs(x - rayX(fl, y)), dr = Math.abs(x - rayX(fr, y)), df = y - L.foot, sc = Math.max(0.6, Math.abs(x - 960) / (960 - L.a));
        const foot = 0.38 * (1 - sstep(Math.min(df, x < 960 ? dl : dr) / (6 * sc)));
        const shade = x < L.a ? 0.3 * (1 - sstep(dl / (26 * sc * L.s / 0.3))) : 0;
        return Math.max(foot, shade);
      }, 'mul');
      if (age > 0.5) {
        // the lower floors are green at their joints and wet in their hollows
        M.floorCloud(A, p, A.mix(K.moss[0], K.tread, 0.35), { scale: 26, seed: L.k * 3.1, thr: 0.62 - age * 0.12, soft: 0.2, p: 0.35 + age * 0.3, w: 5, ang: 0.1, tool: 'chalk' });
        for (let i = 0; i < Math.round(age * 3.5); i++) {
          const side = R.chance(0.5) ? -1 : 1, y = R.rr(L.foot + 30, Math.min(H - 10, L.foot + 220)), o = side < 0 ? fl : fr, nIn = side < 0 ? nl : nr;
          const x = lerp(rayX(o, y), rayX(nIn, y), R.rr(0.25, 0.75)); if (x < -20 || x > W + 20) continue;
          const sc = Math.abs(x - 960) / (960 - L.a) * L.s, rx = R.rr(10, 24) * sc / 0.3, ry = rx * 0.2;
          puddle(A, x, y, rx, ry, K);
        }
      }
    });
    // the edge where the floor drops to the level below: lit along its lip
    const lip = [[rayX(nl, H + 40), H + 40], nl, nr, [rayX(nr, H + 40), H + 40]];
    A.stroke(lip.map(q => [q[0], q[1] - 1.2]), 'chalk', A.mix(K.tread, 'khadi', 0.7), { w: 1.6, p: 0.75 });
    A.stroke(lip, 'kajal', K.line, { w: 1, p: 0.8 });
    const foot = [[rayX(fl, H + 40), H + 40], fl, fr, [rayX(fr, H + 40), H + 40]];
    A.stroke(foot, 'kajal', A.mix(K.line, K.cast, 0.3), { w: 0.8, p: 0.55 });
  }
  // a puddle on the floor of a lower level: sky in it, its edge darker
  function puddle(A, x, y, rx, ry, K) {
    const e = A.roughen(A.ellipse(x, y, rx, ry), Math.max(0.6, ry * 0.3), Math.max(4, rx * 0.5), true);
    // only damp: the slab darker where the water stands, the sky catching on it in a streak or two
    A.fill(e, 'side', A.mix(K.tread, K.deep, 0.4), { w: Math.max(2, ry * 1.2), p: 0.42, passes: 2, ang: 0.02 });
    M.floorWash(A, e, '#9fb4c8', (px, py) => 0.22 * sstep((py - y + ry) / (2 * ry)), 'over');
    for (let i = 0; i < 2; i++) { const yy = y + A.rr(-0.4, 0.2) * ry; A.stroke([[x - rx * A.rr(0.3, 0.7), yy], [x + rx * A.rr(0.2, 0.6), yy + A.rr(-0.3, 0.3)]], 'chalk', '#d0dee0', { w: Math.max(0.5, ry * 0.2), p: 0.4 }); }
  }

  // ---------------------------------------------------------------- the gauge down the left, the plaques, the marks
  function gauge(A, G) {
    for (const L of G.levels) {
      const Z = zoom(A, L.far.map), kv = L.keyV;
      const g = { x0: 16, x1: 84, y0: COPE + 2, y1: VH - 2, years: [L.years[1], L.years[0]], yOf: L.vOf, capital: L.k === 1, faces: [] };
      for (let Y = L.years[0]; Y > L.years[1]; Y--) { const v = L.vOf(Y); if (v != null && v > COPE + 56) g.faces.push({ year: Y, y0: v - 48, y1: v - 8 }); }
      M.wellGauge(Z, g, kv);
      const K = kv(VH / 2), poly = rect(g.x0, g.y0, g.x1, g.y1);
      M.wellStone(Z, poly, K, { c: Z.mix(K.face, K.lime, 0.25), ground: false, joints: 0, mottle: 0.55, grain: 1.6 });
      M.wellStains(Z, g.x0 + 6, g.x1 - 6, g.y0 + 4, 80, 2, K);
      for (let i = 0; i < 4; i++) { const side = i % 2, yy = Z.rr(g.y0 + 10, g.y1 - 10); M.wellChip(Z, side ? g.x1 - 2 : g.x0 + 2, yy, Z.rr(3, 6), kv(yy), { face: true }); }
      for (const m of MILES) {
        const v = L.vOf(m.at); if (v == null) continue;
        const Km = kv(v);
        M.wellPlaque(Z, g.x1 + 4, v, g.x1 + 280, 58, m.kind, Km);
        if (m.kind === 'sindoor') M.wellTie(Z, g.x0, g.x1, v - 4, c => Z.mix(c, Km.glaze, Km.gl));
        if (m.kind === 'gold') M.goldDust(Z, [[g.x1 + 140, v]], 70, 120, { sx: 2.4, sy: 0.4 });
      }
    }
  }
  // the flood marks run on round the well at their heights: across the far wall and along both side walls
  function marks(A, G, L) {
    for (const m of MILES) {
      const v = L.vOf(m.at); if (v == null) continue;
      const K = L.keyV(v);
      for (const side of ['far', 'left', 'right']) {
        const Wd = L[side], Z = zoom(A, Wd.map), x0 = side === 'far' ? 288 : Wd.u0 - 4, x1 = Wd.u1 + 4;
        Z.withMask(rect(Wd.u0, 0, Wd.u1, VH), () => M.wellFloodLine(Z, x0, x1, v, m.kind, K));
        // drawn so small the mark would be lost on the stone: the hand goes over it again at the size of the picture
        const pts = [], n = 60;
        for (let i = 0; i <= n; i++) { const u = lerp(Math.max(x0, Wd.u0), Math.min(x1, Wd.u1), i / n); pts.push(Wd.map.f(u, v + 1.4 * Math.sin(u / 41 + L.k))); }
        const on = pts.filter(q => q[0] > -10 && q[0] < W + 10 && q[1] < H + 10);
        if (on.length < 2) continue;
        if (m.kind === 'sindoor') { A.stroke(on.map(q => [q[0], q[1] + 0.8]), 'side', '#6a1610', { w: 2.6, p: 0.3 }); A.stroke(on, 'pastel', '#c8321c', { w: 1.7, p: 0.9, reach: 1.4 }); }
        else if (m.kind === 'gold') { A.stroke(on.map(q => [q[0], q[1] + 0.8]), 'side', '#4a3010', { w: 2.4, p: 0.28 }); A.stroke(on, 'gold', 'gold', { w: 1.7, p: 0.95 }); A.stroke(on.map(q => [q[0], q[1] - 0.6]), 'chalk', 'cream', { w: 0.6, p: 0.5 }); }
        else { A.stroke(on.map(q => [q[0], q[1] + 1]), 'side', K.deep, { w: 2.2, p: 0.25 }); A.stroke(on, 'chalk', A.mix(K.tread, 'ice', 0.5), { w: 1.3, p: 0.7 }); }
      }
    }
  }

  // ---------------------------------------------------------------- the light of each hour laid over the levels
  function light(A, G) {
    // noon comes down in a slant from the left across the first two levels
    shaft(A, [[150, 300], [560, 300], [1120, 610], [720, 610]], '#fff4d0', 0.2);
    shaft(A, [[980, 300], [1220, 300], [1500, 520], [1290, 520]], '#fff0c8', 0.1);
    const band = (y0, y1, c, k, cx, cy, rx, ry) => M.floorWash(A, rect(0, y0, W, y1), c, (x, y) => k * Math.max(0, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry)) * (0.6 + 0.4 * sstep((y - y0) / 60)), 'over');
    band(560, 760, '#f8b8a8', 0.24, 520, 660, 1100, 240);
    band(470, 640, '#ffc890', 0.12, 1300, 560, 900, 200);
    band(720, 870, '#c8a8c8', 0.17, 480, 790, 1000, 200);
    band(830, 960, '#9fb4c8', 0.13, 760, 900, 900, 180);
    // the well darkens toward its sides as it goes down, where the light from the mouth does not reach
    M.floorWash(A, rect(0, 600, W, H), '#141020', (x, y) => 0.42 * sstep((y - 600) / 480) * sstep((Math.abs(x - 960) - 260) / 700), 'mul');
  }

  // ---------------------------------------------------------------- what stands on each level
  function objects(A, G, L) {
    const k = L.k, T = toneAt(A, L.foot - 30), O = G.obj, Zf = zoom(A, L.far.map), al = L.alcove;
    if (k === 1) {
      const d = O.dove, Zd = zoom(A, place(d.x, d.yb, d.k, 0, 0));
      G.doveInfo = M.wellDovecote(Zd, 0, 0, d.s, T);
      const lm = O.loom, Zl = zoom(A, place(lm.x, lm.yb, lm.k, 0, 0));
      M.wellLoom(Zl, 0, 0, lm.s, T);
      const R = STAGE.rng(11);
      for (let i = 0; i < 26; i++) Zd.dot(R.rr(-90, 90), R.rr(-6, 6), 'chalk', R.pick(['#e6b422', '#f1dfa6', '#c1892b']), { w: 1.2, p: 0.8 });
      for (let i = 0; i < 4; i++) { const x = R.rr(-100, 120), y = R.rr(-4, 4); Zd.stroke([[x, y], [x + R.rr(6, 10), y - R.rr(1, 3)]], 'chalk', '#eef0f0', { w: 1.6, p: 0.8, tout: 0.6 }); }
      for (let i = 0; i < 3; i++) M.wellPigeonSit(Zd, [-78, 92, 128][i], 2, 24, i === 1, ['#8a93a0', '#9aa0a8', '#7e8894'][i]);
      // and more of them sitting about the stairs, as they do in every stepwell
      const R2 = STAGE.rng(13), cand = [];
      for (const m of L.far.masses) for (const st of m.steps) if (st.dir && st.x0 > 300 && st.x1 < L.Wu - 300) cand.push(st);
      for (let i = 0; i < 16 && cand.length; i++) { const st = cand.splice(R2.ri(0, cand.length - 1), 1)[0]; M.wellPigeonSit(Zf, R2.rr(st.x0 + 12, st.x1 - 12), st.y + 1, R2.rr(22, 27), st.dir > 0, R2.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#a8a49c', '#e8e6e0'])); }
      // and on the walk round the mouth of the well, among a few dropped petals and grains
      const Tr = toneAt(A, 290), R3 = STAGE.rng(17), pp = [];
      for (let i = 0; i < 22; i++) { const x = R3.rr(30, W - 30); if (Math.abs(x - 960) < 110) continue; const y = x < L.a || x > L.b ? rayY([x < 960 ? L.a : L.b, L.top], x) - R3.rr(2, 8) : R3.rr(294, 299); M.wellPigeonSit(A, x, y, R3.rr(8, 10.5), R3.chance(0.5), R3.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#e8e6e0'])); }
      for (let i = 0; i < 60; i++) { const x = R3.rr(20, W - 20); pp.push([x / 0.5, R3.rr(292, 298) / 0.5, R3.pick(['mari', 'mari', 'white', 'rose'])]); }
      M.petals(zoom(A, scaleMap(0.5, 0, 0)), pp, Tr);
    }
    if (k === 2) {
      const t = O.tank, Zt = zoom(A, place(t.x, t.yb, t.k, 0, 0)), yT = -72;
      M.wellSpouts(Zt, 0, yT, T);
      M.wellTank(Zt, 0, yT, 270, 0, T);
      M.wellToran(Zf, al.u - 58, al.u + 58, al.v - al.h - 14, T);
      // a doorway of a new beginning: rangoli before the alcove, a lota and a pot
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; Zf.dot(al.u + Math.cos(a) * 46, VH + 34 + Math.sin(a) * 10, 'chalk', i % 2 ? '#f7f2e7' : '#de5a22', { w: 6, p: 0.9 }); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; Zf.dot(al.u + Math.cos(a) * 22, VH + 34 + Math.sin(a) * 5, 'chalk', i % 2 ? '#e6b422' : '#c8321c', { w: 5, p: 0.9 }); }
      const Zp = zoom(A, place(960, 606, 0.32, 0, 0));
      M.wellLota(Zp, 150, 0, 12, T);
      M.wellPot(Zp, -160, 0, 15, T('#c2602e'), T);
      // marigold strings along the coping of the wall below: the middle of the well is dressed for a feast
      const Z3 = zoom(A, G.levels[2].far.map), W3 = G.levels[2].Wu;
      for (let u = 120; u < W3 - 300; u += 360) M.garland(Z3, [[u, 4], [u + 180, 40], [u + 360, 4]], T, { r: 15, step: 21 });
      sideGarlands(A, G.levels[2], T, 360, 36, 15);
    }
    if (k === 3) {
      const Zl = zoom(A, scaleMap(O.lan.k, 0, 0)), s = G.lanString;
      M.wellBunting(Zl, [336 / O.lan.k, 621 / O.lan.k], [962 / O.lan.k, 627 / O.lan.k], 22 / O.lan.k, T);
      M.wellBunting(Zl, [958 / O.lan.k, 627 / O.lan.k], [1584 / O.lan.k, 621 / O.lan.k], 26 / O.lan.k, T, { cols: ['#f6c46a', '#f08aa0', '#f7e6cc', '#e8607a', '#f2a48a'] });
      M.wellLanternsAt(Zl, s, G.lanterns, T);
      const Z4 = zoom(A, G.levels[3].far.map), W4 = G.levels[3].Wu;
      for (let u = 60; u < W4 - 200; u += 400) M.garland(Z4, [[u, 4], [u + 200, 46], [u + 400, 4]], T, { r: 17, step: 24 });
      sideGarlands(A, G.levels[3], T, 400, 42, 17);
      const top = al.v - al.h - 12;
      M.garland(Zf, [[al.u - 56, top + 6], [al.u, top + 30], [al.u + 56, top + 6]], T, { r: 9, step: 12 });
      for (const sg of [-1, 1]) M.garland(Zf, [[al.u + sg * 56, top + 6], [al.u + sg * 62, top + 70], [al.u + sg * 60, top + 130]], T, { r: 8, step: 11 });
      const c = O.cups, Zc = zoom(A, place(c.x, c.yb, c.k, 0, 0));
      G.cupsInfo = M.wellCups(Zc, 0, 0, c.s, T);
      const Zp = zoom(A, scaleMap(0.5, 0, 0)), R = STAGE.rng(31), pts = [];
      for (let i = 0; i < 90; i++) { const x = R.rr(L.a + 20, L.b - 20), y = R.rr(L.foot + 2, L.ntop - 1); pts.push([x / 0.5, y / 0.5, R.pick(['mari', 'mari', 'rose', 'white'])]); }
      M.petals(Zp, pts, T);
    }
    if (k === 4) {
      const p = O.pole, Zp = zoom(A, place(p.x, p.yb, p.k, 0, 0));
      const tie = M.wellPole(Zp, 0, 0, p.h, T);
      M.wellFlag(Zp, tie[0], tie[1], 128, 1, T);
      drum(Zp, -56, 0, T);
    }
    if (k === 5) {
      const kd = O.kund, Zk = zoom(A, place(kd.x, kd.yb, kd.k, 0, 0));
      G.kundInfo = M.wellKund(Zk, 0, 0, kd.w, T);
    }
  }
  // the feast goes all the way round: marigold strings swung along the coping of both side walls too
  function sideGarlands(A, L, T, span, sag, r) {
    for (const side of ['left', 'right']) {
      const Wd = L[side], Z = zoom(A, Wd.map);
      for (let u = Wd.u0 + (side === 'left' ? 30 : 10); u + span <= Wd.u1 + span * 0.4; u += span) M.garland(Z, [[u, 4], [u + span / 2, sag], [u + span, 4]], T, { r, step: r * 1.4 });
    }
  }
  function drum(A, x, yb, T) {
    const body = A.spline([[x - 18, yb], [x - 20, yb - 16], [x - 18, yb - 32], [x + 18, yb - 32], [x + 20, yb - 16], [x + 18, yb]], true, 0.8);
    A.fill(body, 'chalk', T('#8f2331'), { w: 2.6, p: 1, passes: 2 });
    M.floorWash(A, body, T('#2a1018'), (xx) => 0.45 * sstep((xx - x) / 20 + 0.2), 'mul');
    for (let i = 0; i < 6; i++) A.stroke([[x - 18 + i * 7, yb - 31], [x - 15 + i * 7 + 3, yb - 1]], 'chalk', T('#e6b422'), { w: 0.8, p: 0.85 });
    A.fill(A.ellipse(x, yb - 32, 18, 4), 'chalk', T('#e8d8b0'), { w: 2, p: 1, passes: 2 });
    A.outline(A.ellipse(x, yb - 32, 18, 4), 'kajal', T('#2a1810'), { closed: true, w: 0.8, p: 0.8 });
    A.outline(body, 'kajal', T('#2a1810'), { closed: true, w: 0.8, p: 0.8 });
    A.stroke([[x + 8, yb - 38], [x + 30, yb - 44]], 'kajal', T('#6a4020'), { w: 1.6, p: 0.95 });
  }
  // a point on the floor of a level, on its left or right walk: w 0 at the foot of the wall, 1 at the drop
  function walkAt(L, side, y, w) {
    const o = side < 0 ? [L.a, L.foot] : [L.b, L.foot], n = side < 0 ? [L.na, L.ntop] : [W - L.na, L.ntop];
    return [lerp(rayX(o, y), rayX(n, y), w), y];
  }
  const scaleAt = (L, x) => L.s * Math.max(0.6, Math.abs(x - VP[0]) / (VP[0] - L.a));
  // the life of the walks along the sides, where they come up close
  function life(A, G, L) {
    const k = L.k, T = toneAt(A, L.foot), R = STAGE.rng(700 + k), K = keyAt(L.foot + 6);
    const spots = [];
    for (const side of [-1, 1]) {
      const y1 = Math.min(H + 6, L.foot + (H - L.foot) * 0.95);
      for (let i = 0; i < 14; i++) {
        const y = lerp(L.foot + 8, y1, Math.pow((i + R.rr(0.1, 0.9)) / 14, 1.1)), w = R.rr(0.1, 0.66), p = walkAt(L, side, y, w);
        if (p[0] < 8 || p[0] > W - 8 || p[1] > H - 4) continue;
        spots.push({ side, p, s: scaleAt(L, p[0]), w });
      }
    }
    spots.sort((a, b) => a.p[1] - b.p[1]);
    for (const sp of spots) {
      const [x, y] = sp.p, s = sp.s * 1.5, Z = zoom(A, place(x, y, s, 0, 0)), r = R.rnd();
      if (k === 1) {
        if (r < 0.55) M.wellPigeonSit(Z, 0, 0, R.rr(22, 27), sp.side > 0, R.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#e8e6e0']));
        else if (r < 0.75) M.wellPot(Z, 0, 0, R.rr(12, 16), T(R.pick(['#c2602e', '#b8452c', '#d07a3a'])), T);
        else for (let i = 0; i < 12; i++) Z.dot(R.rr(-30, 30), R.rr(-6, 6), 'chalk', R.pick(['#e6b422', '#f1dfa6', '#c1892b']), { w: 2, p: 0.8 });
      } else if (k === 2) {
        if (r < 0.3) M.wellPot(Z, 0, 0, R.rr(13, 17), T(R.pick(['#c2602e', '#b8452c'])), T);
        else if (r < 0.5) M.wellLota(Z, 0, 0, R.rr(10, 13), T);
        else if (r < 0.75) { for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; Z.dot(Math.cos(a) * 26, Math.sin(a) * 7, 'chalk', i % 2 ? '#f7f2e7' : '#de5a22', { w: 5, p: 0.9 }); } Z.dot(0, 0, 'chalk', '#e6b422', { w: 7, p: 0.9 }); }
        else M.wellPigeonSit(Z, 0, 0, R.rr(22, 26), sp.side > 0, R.pick(['#8a93a0', '#9aa0a8']));
      } else if (k === 3) {
        if (r < 0.45) { M.wellDiya(Z, 0, 0, 1, R.ri(0, 2)); M.wellDiyaGlow(Z, 15, -12, 34, 0.7); }
        else if (r < 0.7) M.garland(Z, [[-40, 0], [-10, 6], [20, 2], [44, 8]], T, { r: 5.6, step: 8 });
        else { const pts = []; for (let i = 0; i < 14; i++) pts.push([R.rr(-40, 40), R.rr(-8, 8), R.pick(['mari', 'mari', 'rose', 'white'])]); M.petals(Z, pts, T); }
      } else if (k === 4) {
        if (r < 0.5) { M.wellDiya(Z, 0, 0, 1, R.ri(0, 2)); M.wellDiyaGlow(Z, 15, -12, 38, 0.85); }
        else M.wellFern(Z, 0, 0, R.rr(1, 1.5), K, { lean: R.rr(-0.6, 0.6), n: R.ri(7, 11), c: A.mix('#2f4a26', K.deep, 0.25), c2: A.mix('#7fae44', K.glaze, K.gl * 0.7) });
      } else {
        if (r < 0.3) { M.wellDiya(Z, 0, 0, 1, R.ri(0, 2)); M.wellDiyaGlow(Z, 15, -12, 38, 0.9); }
        else M.wellFern(Z, 0, 0, R.rr(1.1, 1.7), K, { lean: R.rr(-0.6, 0.6), n: R.ri(8, 12), c: A.mix('#2a4430', K.deep, 0.2), c2: A.mix('#6a8a5a', K.glaze, K.gl * 0.5) });
      }
    }
    if (k >= 3) {
      // from dusk down, a row of lamps set along the edge of each walk, as on the ghats at a festival
      G.ledgeLamps = G.ledgeLamps || [];
      for (const side of [-1, 1]) {
        let y = L.ntop + 4, n = 0;
        while (y < H + 4 && n < 60) {
          const p = walkAt(L, side, y, R.rr(0.78, 0.9)); if (p[0] < -8 || p[0] > W + 8) break;
          const s = scaleAt(L, p[0]) * 1.3, Z = zoom(A, place(p[0], p[1], s, 0, 0));
          // set down by hand: not evenly, a few in twos, now and then one gone out or never put there
          if (R.chance(0.86)) { M.wellDiya(Z, -13, 0, 1, (n + k) % 3); G.ledgeLamps.push([p[0] + 2 * s, p[1] - 10.5 * s, s, k]); }
          const ux = p[0] - VP[0], uy = p[1] - VP[1];
          y += (R.chance(0.2) ? R.rr(30, 40) : R.rr(62, 96)) * s * uy / Math.hypot(ux, uy); n++;
        }
      }
    }
  }

  // ---------------------------------------------------------------- the chain of lamps down the middle
  function lamps(A, G) {
    const R = [17, 23, 29, 34, 38], KK = [0.5, 0.66, 0.8, 0.92, 1];
    G.levels.forEach((L, i) => {
      const al = L.alcove, f = L.far.map.f(al.u - 8 + 15 * 1.5, al.v - 2 - 10.5 * 1.5);
      // the light stays on its own wall: round the niche, warm on the stone, and not down over the ledge below it
      A.withMask(rect(L.a, L.top + 3, L.b, L.foot - 1), () => {
        M.floorWash(A, rect(f[0] - 90, f[1] - 80, f[0] + 90, f[1] + 30), '#e8963a', (x, y) => (0.05 + 0.1 * i / 4) * Math.pow(Math.max(0, 1 - Math.hypot((x - f[0]) / (40 + i * 10), (y - f[1] + 14) / (36 + i * 8))), 1.5), 'over');
        M.wellDiyaGlow(A, f[0], f[1] - 2, R[i], KK[i]);
      });
    });
    // the lamps along the edges of the lower walks
    for (const [x, y, s, k] of G.ledgeLamps || []) M.wellDiyaGlow(A, x, y, Math.min(39, 60 * s), 0.45 + 0.12 * (k - 3));
    // the lanterns of the middle level glow over their string
    const k = G.obj.lan.k, Zl = zoom(A, scaleMap(k, 0, 0));
    M.wellLanternGlow(Zl, G.lanterns.map(l => [l.x, l.y, l.r]), 0.75);
  }

  // ---------------------------------------------------------------- the water at the bottom
  function water(A, G) {
    const pool = G.pool, L5 = G.levels[4], R = STAGE.rng(61), Y0 = WTOP;
    const depth = y => sstep((y - Y0) / 150);
    const mx = 724, my = 1014, dy = G.obj.diya;
    gradWash(A, pool, (x, y) => mixc(hexc('#22383c'), hexc('#070c16'), depth(y)), 1);
    A.withMask(pool, () => {
      for (let y = Y0 - 4; y < H + 6; y += R.rr(4, 9)) {
        const t = depth(y), c = A.mix(A.mix('#20383c', '#263440', A.noise1(y / 40, 4) * 0.6), '#080e18', t);
        for (let x = R.rr(320, 440); x < 1620;) {
          const l = R.rr(100, 380), a = R.rr(-0.012, 0.012), amp = R.rr(0.4, 1.4), ph = R.rr(0, 6), fr = R.rr(35, 55), pts = [];
          for (let s = 0; s <= 10; s++) { const xx = x + l * s / 10; pts.push([xx, y + (xx - x) * a + amp * Math.sin(xx / fr + ph)]); }
          A.stroke(pts, 'side', c, { w: R.rr(6, 13), p: R.rr(0.22, 0.5) });
          x += l + R.rr(-50, 30);
        }
      }
      A.blend(pool, { r: 6, k: 0.35, ang: 0, len: 90 });
    });
    // the last level given back upside down, dimmer and greener the deeper it goes, pulled sideways by the swell
    {
      const S = A.S, mk = A.pushMask(pool, 2); A.popMask();
      const Y0p = Math.round(Y0 * S), n = Math.round(128 * S), tint = [0.5, 0.72, 0.7], ph = R.rr(0, 6);
      for (let d = 0; d < n; d++) {
        const Yd = Y0p + d, Ys = Y0p - 1 - Math.round(d * 0.96); if (Yd >= A.H || Ys < 0) continue;
        const my0 = Yd - mk.y0; if (my0 < 0 || my0 >= mk.h) continue;
        const u = d / n, lu = d / S;
        const a = 0.55 * Math.pow(1 - u, 1.1) * (0.55 + 0.45 * A.noise1(lu / 1.4 + ph, 7)) * (0.7 + 0.3 * Math.sin(lu / 2.8 + ph));
        const sh = Math.round(S * ((0.8 + 3.5 * u) * Math.sin(lu / (3 + 2.5 * u) + ph) + 1.3 * (A.noise1(lu / 6, 3) - 0.5)));
        for (let x = 0; x < mk.w; x++) {
          const mv = mk.d[my0 * mk.w + x] / 255; if (!mv) continue;
          const X = x + mk.x0, xs = Math.min(A.W - 1, Math.max(0, X + sh)), i = Yd * A.W + X, j = Ys * A.W + xs;
          const k = mv * a * (0.75 + 0.5 * A.noise2(X / S / 90, lu / 12, 5));
          A.R[i] += (A.R[j] * tint[0] - A.R[i]) * k; A.G[i] += (A.G[j] * tint[1] - A.G[i]) * k; A.B[i] += (A.B[j] * tint[2] - A.B[i]) * k;
        }
      }
      A.withMask(pool, () => {
        for (let y = Y0 + 3; y < H; y += R.rr(3, 6)) {
          const t = (y - Y0) / 128, c = A.mix('#1e3a3a', '#0c1a20', t);
          for (let x = R.rr(300, 420); x < 1640;) { const l = R.rr(20, 130); if (R.chance(0.55)) A.stroke([[x, y], [x + l * 0.5, y + R.rr(-0.7, 0.7)], [x + l, y + R.rr(-0.5, 0.5)]], 'side', c, { w: R.rr(2, 4), p: R.rr(0.08, 0.22) * (0.6 + t * 0.6) }); x += l + R.rr(6, 40); }
        }
        A.blend(rect(300, Y0 + 1, 1640, H), { r: 3, k: 0.3, ang: 0, len: 30 });
      });
    }
    // the well goes on down under the water, flight under flight, each paler shape further gone
    {
      const s6 = 0.16, a6 = WA + 40, map6 = scaleMap(s6, a6, Y0 + 12), Wu6 = (W - 2 * a6) / s6, Z6 = zoom(A, map6), ms = massesFor(0, Wu6, Wu6 / 2, 66);
      const fade = v => { const y = Y0 + 12 + v * s6; return (0.4 + 0.6 * sstep((y - Y0 - 8) / 26)) * (1 - sstep((y - Y0 - 30) / 90)); };
      A.withMask(pool, () => {
        for (const m of ms) {
          const foot = v => 1 - sstep((v - m.base + 60) / 60);
          M.floorUnion(Z6, [m.pts], '#6e9e8a', (x, y) => 0.42 * fade(y) * foot(y) * (0.6 + 0.5 * A.noise2(x / 80, y / 30, 17)), 7 * A.S, 'over', { ang: 0.04, len: 40, wid: 2.4, amt: 0.5 });
          M.floorUnion(Z6, [m.pts], '#0c1e1c', (x, y) => 0.3 * sstep((x - m.c) / 160) * fade(y) * foot(y), 7 * A.S, 'mul');
          for (const st of m.steps) {
            if (!st.dir || R.chance(0.4)) continue;
            const f = fade(st.y); if (f < 0.06) continue;
            for (let x = st.x0 + R.rr(0, 10); x < st.x1 - 4;) { const l = R.rr(10, 34), xe = Math.min(st.x1, x + l); Z6.stroke([[x, st.y + R.rr(-1, 1)], [(x + xe) / 2, st.y + R.rr(-1.6, 1.6)], [xe, st.y + R.rr(-1, 1)]], 'side', R.chance(0.6) ? '#a0c4b4' : '#7ea696', { w: R.rr(2.4, 4.6), p: f * R.rr(0.32, 0.6) }); x = xe + R.rr(5, 16); }
          }
        }
        for (let y = Y0 + 10; y < H + 4; y += R.rr(3, 6)) { const c = A.mix('#1e3a3a', '#0a161c', depth(y)); for (let x = R.rr(300, 400); x < 1640;) { const l = R.rr(16, 100); if (R.chance(0.5)) A.stroke([[x, y], [x + l / 2, y + R.rr(-0.6, 0.6)], [x + l, y + R.rr(-0.5, 0.5)]], 'side', c, { w: R.rr(1.6, 3.2), p: R.rr(0.1, 0.24) }); x += l + R.rr(6, 36); } }
        A.blend(rect(300, Y0 + 8, 1640, H), { r: 4, k: 0.3, ang: 0, len: 50 });
        // just under the surface: a pale skin of sky broken into dashes
        for (let y = Y0 + 2; y < Y0 + 50; y += R.rr(3, 6)) {
          const t = (y - Y0) / 50;
          for (let x = R.rr(320, 420); x < 1620;) { const l = R.rr(10, 60); if (R.chance(0.5)) A.stroke([[x, y], [x + l / 2, y + R.rr(-0.5, 0.5)], [x + l, y + R.rr(-0.3, 0.3)]], 'side', R.chance(0.6) ? '#8aa2a6' : '#6a8488', { w: R.rr(1.2, 2.4), p: (1 - t) * R.rr(0.14, 0.32) }); x += l + R.rr(8, 44); }
        }
      });
    }
    // the lip where the water meets the last floor: wet algae, a pale line, its reflection broken
    const l = [WA, Y0], r = [W - WA, Y0], lip = [[rayX(l, H + 30), H + 30], l, r, [rayX(r, H + 30), H + 30]];
    A.stroke(lip.map(q => [q[0], q[1] + 2]), 'side', '#1c3a2a', { w: 4, p: 0.7 });
    A.stroke(lip, 'chalk', '#cfe0dc', { w: 1.2, p: 0.65 });
    A.withMask(pool, () => { for (let x = WA; x < W - WA;) { const ll = R.rr(8, 34); A.stroke([[x, Y0 + 5], [x + ll, Y0 + 5 + R.rr(-0.4, 0.4)]], 'chalk', '#a8c4be', { w: 1.1, p: R.rr(0.3, 0.55) }); x += ll + R.rr(4, 18); } });
    // the lit alcove above comes down into the water as long warm dashes, and joins the lamp floating there
    {
      const ax = L5.far.map.f(L5.alcove.u, 0)[0];
      M.floorWash(A, rect(ax - 60, Y0, ax + 60, Y0 + 100), '#c87a28', (x, y) => 0.16 * (1 - sstep((y - Y0) / 90)) * Math.max(0, 1 - Math.abs(x - ax) / 46), 'over');
      for (let i = 0; i < 46; i++) {
        const t = Math.pow(R.rnd(), 1.3), y = Y0 + 6 + t * 80, hw = (16 - t * 8) * R.rr(0.25, 1.1), cx = ax + R.rr(-7, 7) + 3 * Math.sin(y / 6);
        A.stroke([[cx - hw, y + R.rr(-0.5, 0.5)], [cx, y + R.rr(-0.7, 0.7)], [cx + hw, y + R.rr(-0.5, 0.5)]], R.chance(0.6) ? 'side' : 'chalk', R.pick(['#e88e1e', '#f3bd45', '#f6d488', '#d8701a']), { w: R.rr(1, 2.2), p: (1 - t) * R.rr(0.3, 0.7), tin: 0.2, tout: 0.25 });
      }
    }
    // the moon, which the well never sees, is in the water: cut by the swell into slices that wave a little
    const ms = 0.8;
    M.floorWash(A, rect(mx - 260, my - 130, mx + 260, my + 130), '#a8bcb4', (x, y) => 0.24 * Math.pow(Math.max(0, 1 - Math.hypot((x - mx) / 250, (y - my) / 120)), 1.5), 'over');
    M.floorWash(A, rect(mx - 80, my - 80, mx + 80, my + 80), '#e8e4c8', (x, y) => 0.26 * Math.pow(Math.max(0, 1 - Math.hypot((x - mx) / 66, (y - my) / 70)), 1.2), 'over');
    A.fill(A.roughen(A.ellipse(mx, my + 2, 21, 36), 3, 6, true), 'side', '#e6e2c4', { w: 6, p: 0.3, passes: 2, ang: R.rr(-0.2, 0.2) });
    const moonC = ['#f6f0d8', '#efe4b8', '#fff8e6', '#e6dcb0', '#f3ecc8', '#d8d4b8'], slices = [];
    for (let y = my - 52 * ms, row = 0; y < my + 62 * ms; row++) {
      const h = R.rr(2.4, 6.8) * ms, u = (y - my) / (y < my ? 52 * ms : 62 * ms), ch = (Math.sqrt(Math.max(0, 1 - u * u)) * 30 * R.rr(0.7, 1.35) + R.rr(2, 9)) * ms;
      const cx = mx + (R.rr(-8, 8) + 5 * Math.sin(row * 1.7)) * ms, cut = R.chance(0.32);
      const parts = cut ? [[cx - ch, cx - ch * R.rr(0, 0.45)], [cx + ch * R.rr(0.05, 0.45), cx + ch]] : [[cx - ch, cx + ch]];
      for (const [a, b] of parts) {
        if (b - a < 1.5) continue;
        const nn = Math.max(2, Math.round((b - a) / 4)), ph = R.rr(0, 6), amp = R.rr(0.2, 0.7), pts = [];
        for (let i = 0; i <= nn; i++) pts.push([a + (b - a) * i / nn, y + h / 2 + amp * Math.sin(i * 1.3 + ph) + R.rr(-0.2, 0.2)]);
        const c = R.pick(moonC), pp = R.rr(0.75, 1) * (1 - Math.abs(u) * 0.35);
        A.stroke(pts, 'side', c, { w: Math.max(1.6, h), p: pp, tin: R.rr(0.08, 0.35), tout: R.rr(0.08, 0.35) });
        A.stroke(pts.map(q => [q[0] + R.rr(-1, 1), q[1] + R.rr(-0.3, 0.3)]), 'pastel', c, { w: Math.max(1.2, h * 0.8), p: pp * 0.8, tin: 0.2, tout: 0.2 });
      }
      slices.push([cx, y, ch]);
      y += h + R.rr(1.2, 5.5) * ms * (0.6 + Math.abs(u) * 0.9);
    }
    A.blend(rect(mx - 50, my - 46, mx + 50, my + 54), { r: 1.6, k: 0.5, ang: 0, len: 12 });
    for (const [cx, y, ch] of slices) if (R.chance(0.55)) A.stroke([[cx - ch * R.rr(0.2, 0.7), y + R.rr(0, 0.5)], [cx + ch * R.rr(0.1, 0.6), y + R.rr(-0.3, 0.6)]], 'chalk', '#fffbea', { w: R.rr(0.7, 1.2), p: R.rr(0.4, 0.8) });
    for (let i = 0; i < 26; i++) {
      const sg = R.chance(0.5) ? 1 : -1, d = R.rr(0.9, 3.2), x = mx + sg * R.rr(22, 50) * d * 0.7 + R.rr(-6, 6), y = my + R.rr(-44, 70) + (d - 1) * R.rr(-6, 18);
      const ll = R.rr(2, 9) / Math.sqrt(d), bend = R.rr(-0.6, 0.6);
      A.stroke([[x - ll / 2, y], [x, y + bend], [x + ll / 2, y + R.rr(-0.3, 0.3)]], 'chalk', R.pick(moonC), { w: R.rr(0.9, 1.8), p: R.rr(0.3, 0.7) / d, tin: 0.2, tout: 0.3 });
    }
    // the Mewar marks for still water, no two alike, thick in drifting patches and missing from others
    A.withMask(pool, () => {
      for (let i = 0; i < 520; i++) {
        const x = R.rr(300, 1620), y = R.rr(Y0 + 10, H - 2), t = depth(y);
        if (!A.inside([pool], x, y)) continue;
        const patch = sstep((A.noise2(x / 150 + 3.7, y / 60 + 1.3, 23) - 0.36) / 0.3);
        if (R.rnd() > 0.12 + 0.7 * patch) continue;
        if (Math.hypot((x - mx) / 56, (y - my) / 62) < 1 || Math.hypot((x - dy[0]) / 110, (y - dy[1]) / 40) < 1) continue;
        const near = Math.max(0, 1 - Math.hypot((x - mx) / 180, (y - my) / 100)), c = A.mix(A.mix('#86a8a2', '#3e5c58', t * 0.8), '#e8e4c8', near * 0.6);
        const p = R.rr(0.18, 0.4) * (1 - t * 0.25) + near * 0.25, kind = R.rnd(), sw = R.rr(7, 22) * (1 + t * 0.2);
        if (kind < 0.42) A.stroke(A.ellipse(x, y, sw / 2, R.rr(1.6, 3.2), R.rr(-0.06, 0.06), PI * R.rr(1.05, 1.18), PI * R.rr(1.82, 1.95)), 'chalk', c, { w: R.rr(0.7, 1.2), p });
        else if (kind < 0.6) { for (let k2 = 0; k2 < 2; k2++) A.stroke(A.ellipse(x, y + k2 * 1.8, sw / 2 * (1 - k2 * 0.3), R.rr(1.6, 2.8), 0, PI * 1.1, PI * 1.9), 'chalk', c, { w: R.rr(0.7, 1.1), p: p * (1 - k2 * 0.3) }); }
        else if (kind < 0.82) { const pts = [], fr = R.rr(2.5, 4.5), amp = R.rr(0.5, 1.2); for (let xx = 0; xx <= sw * 1.4; xx += 1.5) pts.push([x + xx, y + amp * Math.sin(xx / fr)]); A.stroke(pts, R.chance(0.5) ? 'chalk' : 'side', c, { w: R.rr(0.8, 1.6), p: p * 0.9, tin: 0.2, tout: 0.3 }); }
        else { const a0 = R.rr(0, 2 * PI); A.stroke(A.ellipse(x, y, sw * 0.7, sw * 0.18, 0, a0, a0 + R.rr(0.8, 2.2)), 'chalk', c, { w: R.rr(0.6, 1), p: p * 0.8 }); }
      }
      // long lanes of paler water where a breath of wind has crossed it
      for (let i = 0; i < 7; i++) { const y = R.rr(Y0 + 30, H - 10), x0 = R.rr(400, 1300), ll = R.rr(150, 400), pts = []; for (let q = 0; q <= 12; q++) { const xx = x0 + ll * q / 12; pts.push([xx, y + 1.5 * Math.sin(xx / 45 + i)]); } A.stroke(pts, 'side', A.mix('#4e706a', '#2a4440', depth(y) * 0.7), { w: R.rr(5, 11), p: R.rr(0.1, 0.2), tin: 0.3, tout: 0.3 }); }
      // two fish, gold and vermilion, turning slowly under the surface
      for (const f of [[1190, 1018, 26, PI - 0.15], [650, 1060, 30, 0.2]]) {
        M.fish(A, f[0], f[1], f[2], { pose: 'swim', ang: f[3], c: '#f3bd45', back: '#c8501c', fin: '#e8701e' });
        M.floorWash(A, A.ellipse(f[0], f[1], 35, 22), '#1a3432', (x, y) => 0.24 * Math.max(0, 1 - Math.hypot((x - f[0]) / 35, (y - f[1]) / 22)), 'over');
      }
      // stars, far above, come down here as sparks
      for (let i = 0; i < 70; i++) {
        const x = R.rr(420, 1500), y = R.rr(Y0 + 30, H - 6); if (!A.inside([pool], x, y) || Math.hypot(x - mx, (y - my) * 1.2) < 90 || Math.hypot((x - dy[0]) / 100, (y - dy[1]) / 34) < 1) continue;
        const big = R.chance(0.14), c = R.chance(0.2) ? '#f3dca0' : R.chance(0.5) ? '#e8f0f0' : '#c8dcdc';
        if (big) M.sparkle(A, x, y, R.rr(1.6, 2.6));
        else { A.dot(x, y, 'chalk', c, { w: R.rr(0.8, 1.6), p: R.rr(0.45, 0.9) }); if (R.chance(0.4)) A.stroke([[x - R.rr(1, 3), y], [x + R.rr(1, 3), y]], 'chalk', c, { w: 0.6, p: 0.35 }); }
      }
      // lotus at the edges of the water, pads first, then flowers
      const clumps = [[505, 984, 0.55, 1], [440, 1058, 0.62, 2], [1420, 982, 0.5, 1], [1480, 1056, 0.62, 2], [1170, 1066, 0.45, 1], [850, 1074, 0.38, 0], [1290, 1030, 0.32, 0], [610, 1040, 0.3, 0]];
      for (const [cx, cy, s, nfl] of clumps) {
        const dk = depth(cy) * 0.6;
        for (let i = 0; i < Math.round(4 + s * 6); i++) { const x = cx + R.rr(-70, 70) * s, y = cy + R.rr(-22, 26) * s; M.lotusPad(A, x, y, R.rr(12, 28) * s, { rot: R.rr(0, 6.28), c: A.mix('#2f6a44', '#1a3a2c', dk) }); }
        for (let i = 0; i < nfl; i++) M.lotus(A, cx + R.rr(-40, 40) * s, cy + R.rr(-14, 8) * s, R.rr(22, 34) * s, R.pick(['open', 'white', 'half', 'open']), { stem: 0 });
        if (R.chance(0.7)) M.lotus(A, cx + R.rr(-60, 60) * s, cy - R.rr(10, 26) * s, 14 * s, 'bud', { stem: R.rr(12, 20) * s, bend: R.rr(-4, 4) });
      }
    });
    // the lamp on the water: rings going out from it, warm near and cool far, and the lamp itself
    M.floorWash(A, rect(dy[0] - 110, dy[1] - 50, dy[0] + 110, dy[1] + 60), '#e8a040', (x, y) => 0.24 * Math.pow(Math.max(0, 1 - Math.hypot((x - dy[0]) / 100, (y - dy[1] - 4) / 40)), 1.5), 'over');
    for (const [rx, k] of [[17, 1], [31, 0.8], [49, 0.6], [71, 0.42], [98, 0.26]]) {
      const ry = rx * 0.3, c = A.mix('#f3c070', '#a8c4be', clamp((rx - 15) / 75, 0, 1));
      for (let a = R.rr(0, 0.8); a < 2 * PI;) {
        const len = R.rr(0.35, 1.1), gap = R.rr(0.12, 0.5) + (rx / 105) * 0.4;
        A.stroke(A.ellipse(dy[0] + R.rr(-0.8, 0.8), dy[1] + 4 + R.rr(-0.5, 0.5), rx * R.rr(0.97, 1.03), ry * R.rr(0.94, 1.06), 0, a, a + len), R.chance(0.5) ? 'side' : 'chalk', c, { w: R.rr(0.9, 1.8), p: k * R.rr(0.3, 0.65), tin: 0.25, tout: 0.25 });
        a += len + gap;
      }
    }
    const Zd = zoom(A, place(dy[0] - 6, dy[1], 0.8, 0, 0));
    M.wellDiya(Zd, 0, 0, 1, 0);
    M.wellDiyaGlow(A, dy[0] - 6 + 15 * 0.8, dy[1] - 10.5 * 0.8, 30, 0.95);
    // fireflies over the water near the walls, where it is darkest; petals come down from the feast above
    M.fireflies(A, [[430, 960], [640, 960], [600, 1076], [400, 1076]], 4, { s: 0.6 });
    M.fireflies(A, [[1290, 960], [1500, 960], [1520, 1076], [1300, 1076]], 3, { s: 0.6 });
    const pts = []; for (let i = 0; i < 40; i++) { const t = R.rnd(); pts.push([lerp(620, dy[0] - 20, t) + R.rr(-40, 40), lerp(962, dy[1] + 6, t) + R.rr(-10, 10), R.pick(['mari', 'mari', 'white', 'rose'])]); }
    M.petals(zoom(A, scaleMap(0.6, 0, 0)), pts.map(q => [q[0] / 0.6, q[1] / 0.6, q[2]]), c => A.mix(c, '#0e1a24', 0.25));
  }

  // ---------------------------------------------------------------- birds: the pigeons out of the dovecote, the cranes
  function birds(A, G) {
    const R = STAGE.rng(808), d = G.obj.dove, info = G.doveInfo || {}, zd = place(d.x, d.yb, d.k, 0, 0);
    const top = Array.isArray(info.top) && typeof info.top[0] === 'number' ? zd.f(info.top[0], info.top[1]) : [d.x, d.yb - 110];
    // a hundred voices: the whole dovecote goes up at once, a column off its roof that leans toward the sun and opens out
    // over the rim into the sky, the birds nearest us the biggest
    const cols = [['#7c8794', '#3c4450'], ['#8a8f98', '#40464e'], ['#9aa0a8', '#4a5058'], ['#e8e6e0', '#8a8a86'], ['#6e7682', '#343a44'], ['#f4f2ec', '#9a9890']];
    const fl = [];
    for (let i = 0; i < 150; i++) {
      const t = Math.pow((i + R.rnd()) / 150, 0.8), cx = top[0] - 210 * Math.pow(t, 1.25) + 40 * Math.sin(t * 3.1), cy = top[1] - 8 - 330 * t;
      const sp = 24 + 140 * t, gs = () => R.rnd() + R.rnd() + R.rnd() - 1.5, x = cx + gs() * sp * 0.9, y = cy + gs() * sp * 0.42;
      if (y < 6 || x < 8 || x > W - 8) continue;
      fl.push([x, y, 6 + 10 * t + R.rr(-0.8, 1.8), t]);
    }
    fl.sort((a, b) => a[2] - b[2]);
    for (const [x, y, s, t] of fl) { const c = cols[R.chance(0.22) ? R.pick([3, 5]) : R.pick([0, 1, 2, 4])]; M.wellPigeon(A, x, y, s, R.ri(0, 3), c[0], { flip: R.chance(0.85), dark: c[1] }); }
    // a few circling the chhatri
    for (let i = 0; i < 9; i++) { const a = R.rr(0, 2 * PI), c = R.pick(cols); M.wellPigeon(A, 960 + Math.cos(a) * R.rr(100, 190), 120 + Math.sin(a) * R.rr(30, 70), R.rr(5, 7.5), R.ri(0, 3), c[0], { flip: Math.cos(a) > 0, dark: c[1] }); }
    // the delta of cranes across the evening level, and the pennant streams below it
    const dl = G.obj.delta;
    dl.slots.forEach((s, i) => M.crane(A, dl.x + s[0], dl.y + s[1], dl.s * (1 - i * 0.03), { ang: PI, phase: (i * 3) % 4, c: '#f4eef0', shadow: '#b8a8c4' }));
  }
  // gold on everything the noon sun strikes up top
  function gold(A, G) {
    const ch = G.chhatri, Zc = zoom(A, ch.map);
    M.goldDust(Zc, [[ch.cx, 240], [ch.cx - 90, 420], [ch.cx + 70, 440]], 120, 120, { sx: 1.6, sy: 0.8 });
    M.goldDust(A, [[520, 300], [1000, 300], [1500, 300]], 160, 220, { sx: 2.8, sy: 0.25 });
    M.goldDust(A, [[600, 380]], 70, 140, { sx: 2, sy: 0.6 });
  }
  // a last breath of tooth over everything
  function grain(A, G) {
    const R = STAGE.rng(909);
    for (let i = 0; i < 4800; i++) { const x = R.rr(0, W), y = R.rr(0, H), K = keyAt(y); A.dot(x, y, 'chalk', R.chance(0.5) ? K.lime : K.deep, { w: R.rr(0.5, 1.1), p: R.rr(0.12, 0.3) }); }
  }

  P.W = W; P.H = H;
  return P;
})();
