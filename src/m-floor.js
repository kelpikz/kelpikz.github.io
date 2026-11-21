(function () {
  'use strict';
  /* ==========================================================================
     THE PAINTER'S FLOOR
     A floor seen from straight above, the way a Mewar painter shows a carpet:
     flat to the eye, while every thing set on it shows its best face.
       M.floorCloud(A, poly, c, o)          a soft cloud of colour let through by noise
       M.floorMasked(A, poly, f, draw)      draw through a mask scaled by f(x, y)
       M.plaster(A, W, H, T, o)              the lime floor, edge to edge
       M.rug(A, r, T, o)                     the indigo rug with its borders
       M.sunDisc(A, cx, cy, R, T)            the gold sun at the heart of the rug (no face)
       M.pigmentShell, M.goldSpill, M.brassBowl, M.waterRings, M.brushBundle, M.peacockFeather,
       M.leafBook, M.goldSheet, M.burnisher, M.garland, M.petals, M.lampGlow, M.jaliLight, M.leafShadows, M.mote
     (the cat, the lamp and its flame are in m-floor2.js)
     T is the hour: a function that turns a pigment into the colour it has in this light.
     ======================================================================== */
  const PI = Math.PI, TAU = 2 * PI;
  const hl = (A, a, b, tool, c, o) => M.cityHand.hl(A, a, b, tool, c, o);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];

  /* a ring drawn by hand: its radius breathes a little as it goes round and its middle sits a hair off true, so two
     rings drawn one inside the other are never quite concentric.  w is how much it breathes (0.01 is a steady hand).
     With a0, a1 it is an arc. */
  function handRing(A, x, y, rx, ry, w, a0, a1) {
    const sd = A.rr(0, 50), p1 = A.rr(0, TAU), p2 = A.rr(0, TAU), p3 = A.rr(0, TAU), ox = A.rr(-1, 1) * rx * w * 0.7, oy = A.rr(-1, 1) * ry * w * 0.7;
    const closed = a0 == null, st = closed ? A.rr(0, TAU) : a0, en = closed ? st + TAU : a1;
    const n = Math.max(20, Math.ceil(Math.abs(en - st) * Math.max(rx, ry) / 2));
    const out = [];
    for (let i = 0; i < (closed ? n : n + 1); i++) {
      const a = st + (en - st) * i / n, k = 1 + w * (0.55 * Math.sin(2 * a + p1) + 0.3 * Math.sin(3 * a + p2) + 0.18 * Math.sin(5 * a + p3) + 0.5 * (A.noise2(Math.cos(a) * 1.6 + sd, Math.sin(a) * 1.6, 7) - 0.5));
      out.push([x + ox + Math.cos(a) * rx * k, y + oy + Math.sin(a) * ry * k]);
    }
    return out;
  }
  M.floorHandRing = handRing;
  // the pressure of a hand along a line: it presses and eases, never the same all the way (lo is the lightest it goes)
  function press(A, pts, lo, wl) {
    const sd = A.rr(0, 50), w = wl || 9;
    return pts.map((q, i) => [q[0], q[1], lo + (1 - lo) * sstep(A.noise2(i / w + sd, sd * 0.3, 5) * 1.5 - 0.2)]);
  }
  M.floorPress = press;

  // ------------------------------------------------------------ masks made of noise and distance
  function masked(A, poly, f, draw) {
    const mk = A.pushMask(poly, 0), S = A.S;
    for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
      const i = y * mk.w + x; if (!mk.d[i]) continue;
      const t = clamp(f((x + mk.x0 + 0.5) / S, (y + mk.y0 + 0.5) / S), 0, 1);
      mk.d[i] = Math.round(mk.d[i] * t);
    }
    try { draw(); } finally { A.popMask(); }
  }
  M.floorMasked = masked;
  function cloud(A, poly, c, o) {
    o = o || {};
    const sc = o.scale || 120, sd = o.seed || 1, thr = o.thr != null ? o.thr : 0.5, soft = o.soft || 0.16, g = o.g;
    masked(A, poly, (x, y) => {
      let v = A.fbm(x / sc + sd * 7.31, y / sc + sd * 3.17, 3, sd * 13);
      let t = sstep((v - thr) / soft + 0.5);
      if (g) t *= g(x, y);
      return t;
    }, () => A.fill(poly, o.tool || 'side', c, { w: o.w || 30, p: o.p != null ? o.p : 0.4, passes: o.passes || 1, ang: o.ang != null ? o.ang : A.rr(-0.8, 0.8), reach: o.reach || 1.0, flow: o.flow || 0.6, cv: 0.03, gap: o.gap }));
  }
  M.floorCloud = cloud;

  /* a wash laid straight into the pixels, smooth as colour rubbed in with a cloth.  f(x, y) (logical units) gives its strength.
     mode 'over' lays the colour on; 'mul' darkens what is there through the colour, as a glaze does. */
  M.floorWash = function (A, poly, c, f, mode) {
    const mk = A.pushMask(poly, 0); A.popMask();
    const col = A.col(c), S = A.S;
    for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
      const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
      const X = x + mk.x0, Y = y + mk.y0; if (X < 0 || Y < 0 || X >= A.W || Y >= A.H) continue;
      const k = v * clamp(f(X / S, Y / S), 0, 1); if (k <= 0) continue;
      const i = Y * A.W + X;
      if (mode === 'mul') { A.R[i] *= 1 - k + k * col[0]; A.G[i] *= 1 - k + k * col[1]; A.B[i] *= 1 - k + k * col[2]; }
      else { A.R[i] += (col[0] - A.R[i]) * k; A.G[i] += (col[1] - A.G[i]) * k; A.B[i] += (col[2] - A.B[i]) * k; }
    }
  };

  /* the drag of a pastel stick: long thin streaks running along ang, as the side of a stick leaves when it is pulled
     across the tooth.  A factor round 1, between about 1 - amt and 1 + amt. */
  M.floorDrag = function (A, ang, len, wid, sd, amt) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    return (x, y) => { const u = x * ca + y * sa, v = -x * sa + y * ca; return 1 + amt * ((A.noise2(u / len + sd, v / wid, 2) - 0.5) * 1.6 + (A.noise2(u / (len * 0.37) - sd, v / (wid * 0.55), 3) - 0.5) * 0.9); };
  };

  /* many shapes laid as ONE wash: their union, softened by a blur of r pixels, so where two overlap the shadow does not double.
     k(x, y) gives the strength (logical units). */
  M.floorUnion = function (A, polys, c, k, r, mode, paint) {
    const S = A.S; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const p of polys) for (const q of p) { if (q[0] < bx0) bx0 = q[0]; if (q[1] < by0) by0 = q[1]; if (q[0] > bx1) bx1 = q[0]; if (q[1] > by1) by1 = q[1]; }
    const pad = Math.ceil(r * 3) + 3, x0 = Math.max(0, Math.floor(bx0 * S) - pad), y0 = Math.max(0, Math.floor(by0 * S) - pad), x1 = Math.min(A.W, Math.ceil(bx1 * S) + pad), y1 = Math.min(A.H, Math.ceil(by1 * S) + pad);
    const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
    const cov = new Float32Array(w * h);
    for (const p of polys) {
      const mk = A.pushMask(p, 0); A.popMask();
      for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x]; if (!v) continue;
        const X = x + mk.x0 - x0, Y = y + mk.y0 - y0; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const i = Y * w + X, f = v / 255; if (f > cov[i]) cov[i] = f;
      }
    }
    // a box blur three times over is near enough a gaussian
    const R = Math.max(1, Math.round(r)), tmp = new Float32Array(w * h);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < h; y++) { let acc = 0; const row = y * w; for (let x = -R; x <= R; x++) acc += cov[row + clamp(x, 0, w - 1)];
        for (let x = 0; x < w; x++) { tmp[row + x] = acc / (2 * R + 1); acc += cov[row + Math.min(w - 1, x + R + 1)] - cov[row + Math.max(0, x - R)]; } }
      for (let x = 0; x < w; x++) { let acc = 0; for (let y = -R; y <= R; y++) acc += tmp[clamp(y, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) { cov[y * w + x] = acc / (2 * R + 1); acc += tmp[Math.min(h - 1, y + R + 1) * w + x] - tmp[Math.max(0, y - R) * w + x]; } }
    }
    const box = [[x0 / S, y0 / S], [x1 / S, y0 / S], [x1 / S, y1 / S], [x0 / S, y1 / S]];
    const f = (lx, ly) => { const X = Math.floor(lx * S) - x0, Y = Math.floor(ly * S) - y0; if (X < 0 || Y < 0 || X >= w || Y >= h) return 0; const v = cov[Y * w + X]; return v > 0.003 ? v * k(lx, ly) : 0; };
    // laid with the side of a stick instead of a cloth, when asked: the same shape, its strokes showing
    if (paint) { const dr = M.floorDrag(A, paint.ang != null ? paint.ang : 0.5, paint.len || 26, paint.wid || 2.2, A.rr(0, 40), paint.amt || 0.45); M.floorWash(A, box, c, (lx, ly) => f(lx, ly) * dr(lx, ly), mode); }
    else M.floorWash(A, box, c, f, mode);
  };

  // a crack in old lime: a wandering hair that forks once or twice
  function crack(A, x, y, len, ang, c, depth) {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const n = Math.max(4, Math.round(len / 4));
    for (let i = 0; i < n; i++) {
      a += A.rr(-0.55, 0.55); a = ang + (a - ang) * 0.6;
      px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py, 1 - 0.7 * i / n]);
      if ((depth || 0) < 2 && i > 2 && A.chance(0.09)) crack(A, px, py, len * A.rr(0.2, 0.45), a + A.rr(0.5, 1.1) * (A.chance(0.5) ? 1 : -1), c, (depth || 0) + 1);
    }
    A.stroke(pts, 'kajal', c, { w: depth ? 0.45 : 0.6, p: depth ? 0.26 : 0.36, wob: 0.35, tin: 0.05, tout: 0.4 });
  }

  /* ================================================================== THE LIME FLOOR */
  M.plaster = function (A, W, H, T, o) {
    o = o || {};
    const all = [[-12, -12], [W + 12, -12], [W + 12, H + 12], [-12, H + 12]];
    // lime laid wet and polished: the colour rubbed well into the tooth, its clouds large and slow
    A.ground(all, T(o.base || '#eedcb8'), { w: 46, ang: -0.5, edge: 0, rub: 16, c2: T(o.base2 || '#f3e6ca'), top: 0.5 });
    cloud(A, all, T('sand'), { scale: 190, seed: 2, thr: 0.53, p: 0.3, w: 40 });
    cloud(A, all, T('peach'), { scale: 260, seed: 3, thr: 0.56, p: 0.24, w: 40 });
    cloud(A, all, T('ochre'), { scale: 320, seed: 6, thr: 0.62, p: 0.12, w: 44 });
    cloud(A, all, T('#fbf2de'), { scale: 130, seed: 4, thr: 0.56, p: 0.3, w: 30 });
    A.blend(all, { r: 16, k: 0.62 });
    cloud(A, all, T('stone'), { scale: 70, seed: 5, thr: 0.64, p: 0.1, w: 22 });
    A.blend(all, { r: 7, k: 0.4 });
    // araish is laid in slabs, each polished on its own day: one a shade warmer, the next paler or greyer, a fine seam between
    let grid = null;
    if (o.slab) {
      const sz = o.slab, ox = -A.rr(sz * 0.2, sz * 0.7), oy = -A.rr(sz * 0.2, sz * 0.7), nx = Math.ceil((W - ox) / sz) + 1, ny = Math.ceil((H - oy) / sz) + 1;
      grid = [];
      for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push([ox + i * sz + A.rr(-5, 5), oy + j * sz + A.rr(-5, 5)]); grid.push(row); }
      const TINTS = ['#fbf3e2', '#e8d0a6', '#f2dcc0', '#e2d6bc', '#efd9b0', '#f6ead2'];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const q = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]], c = T(A.pick(TINTS)), k0 = A.rr(0.08, 0.2), sd = A.rr(0, 50);
        M.floorWash(A, q, c, (x, y) => k0 * (0.55 + 0.9 * A.fbm(x / 140 + sd, y / 140, 3, sd)));
      }
    }
    // the tone drifts across a room: warmer where the sun has lain on it for years, greyer toward the walls, chalk-pale
    // where it was polished hardest; broad slow clouds, never two the same
    {
      const sd = A.rr(0, 40);
      M.floorWash(A, all, T('#c99f68'), (x, y) => 0.34 * sstep((A.fbm(x / 430 + sd, y / 430, 3, 3) - 0.42) / 0.24));
      M.floorWash(A, all, T('#b4ad9c'), (x, y) => 0.3 * sstep((A.fbm(x / 340 - sd, y / 340 + 7, 3, 5) - 0.46) / 0.22));
      M.floorWash(A, all, T('#fffaf0'), (x, y) => 0.36 * sstep((A.fbm(x / 230 + 11, y / 230 - sd, 3, 9) - 0.48) / 0.2));
      // the lime wash: the brush went over it in long loose strokes, each one leaving a faint lip of chalk
      const d1 = M.floorDrag(A, -0.5, 140, 5, sd + 3, 1), d2 = M.floorDrag(A, 0.9, 110, 4, sd + 9, 1);
      M.floorWash(A, all, T('#fdf7e8'), (x, y) => 0.16 * clamp(d1(x, y) - 1, 0, 1) * 2.2);
      M.floorWash(A, all, T('#c2a880'), (x, y) => 0.12 * clamp(1 - d2(x, y), 0, 1) * 2.2);
    }
    // the trowel: the plasterer works across the floor in sweeps of the arm, each sweep leaving a crescent polished a
    // little paler, a ridge of lime at its outer edge where the blade lifted, and hair-fine lines of grit dragged round
    // with it.  The sweeps overlap in scallops and turn slowly as he moves along.
    {
      const sd = A.rr(0, 40);
      for (let i = 0, n = Math.round(W * H / 5200); i < n; i++) {
        const cx = A.rr(-50, W + 50), cy = A.rr(-50, H + 50), r = A.rr(36, 120), sw = A.rr(0.55, 1.25);
        const a0 = TAU * A.noise2(cx / 520 + sd, cy / 520, 11) * 1.6 + A.rr(-0.35, 0.35), band = r * A.rr(0.16, 0.3);
        const arc = (rr2, a, b) => A.ellipse(cx, cy, rr2, rr2 * A.rr(0.82, 1), 0, a, b);
        A.stroke(press(A, arc(r - band * 0.5, a0, a0 + sw), 0.35, 4), 'side', T(A.pick(['#fdf6e6', '#f8eedb', '#fffaf0'])), { w: band, p: A.rr(0.3, 0.5), flow: 0.5, tin: 0.3, tout: 0.4 });
        // now and then the blade left a thin grey film of the wetter lime on the inside of the sweep
        if (A.chance(0.3)) A.stroke(press(A, arc(r - band * 1.1, a0 + sw * 0.15, a0 + sw * A.rr(0.5, 0.85)), 0.3, 3), 'side', T(A.mix('stone', 'sand', 0.35)), { w: band * 0.6, p: A.rr(0.16, 0.26), flow: 0.5, tin: 0.4, tout: 0.5 });
        if (A.chance(0.75)) A.stroke(press(A, arc(r, a0 + sw * 0.05, a0 + sw * A.rr(0.7, 1)), 0.2, 3), 'shade', T(A.mix('stone', 'umber', 0.3)), { w: A.rr(1.4, 2.6), p: A.rr(0.24, 0.4), tin: 0.2, tout: 0.5 });
        if (A.chance(0.6)) for (let k = 0; k < A.ri(1, 3); k++) { const rk = r - band * A.rr(0.15, 0.9), b0 = a0 + A.rr(0, sw * 0.4); A.stroke(arc(rk, b0, b0 + sw * A.rr(0.3, 0.6)), 'chalk', T(A.chance(0.6) ? '#fffaf0' : A.mix('stone', 'umber', 0.25)), { w: 0.55, p: A.rr(0.28, 0.48), tin: 0.3, tout: 0.3 }); }
      }
      // the grain of the lime: specks of calcite and of sand caught in it
      for (let i = 0, n = Math.round(W * H / 380); i < n; i++) A.dot(A.rr(0, W), A.rr(0, H), 'chalk', T(A.pick(['#fffaf0', '#fffaf0', A.mix('stone', 'sand', 0.3), A.mix('umber', 'sand', 0.6)])), { w: A.rr(0.4, 1.1), p: A.rr(0.18, 0.42), len: A.rr(0, 0.6) });
    }
    // the seams between the slabs: a hair of shadow, broken where the lime filled it, and the polished lip beside it catching light
    if (grid) {
      const seam = (p, q) => {
        if (A.chance(0.12)) return;
        const m = [(p[0] + q[0]) / 2 + A.rr(-1.5, 1.5), (p[1] + q[1]) / 2 + A.rr(-1.5, 1.5)], L = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L;
        const t0 = A.chance(0.5) ? A.rr(0, 0.25) : 0, t1 = A.chance(0.5) ? A.rr(0.75, 1) : 1, at = t => t < 0.5 ? [p[0] + (m[0] - p[0]) * t * 2, p[1] + (m[1] - p[1]) * t * 2] : [m[0] + (q[0] - m[0]) * (t - 0.5) * 2, m[1] + (q[1] - m[1]) * (t - 0.5) * 2];
        const pts = []; for (let t = t0; t <= t1 + 1e-6; t += 0.1) pts.push(at(t));
        A.stroke(pts, 'shade', T('stone'), { w: 2.6, p: 0.12 });
        A.stroke(pts, 'kajal', T(A.mix('umber', 'stone', 0.45)), { w: 0.55, p: 0.3, wob: 0.3 });
        A.stroke(pts.map(r => [r[0] + nx * 1.1, r[1] + ny * 1.1]), 'chalk', T('#fcf6e8'), { w: 0.75, p: 0.32, wob: 0.3 });
      };
      for (let j = 0; j < grid.length; j++) for (let i = 0; i < grid[j].length; i++) { if (i + 1 < grid[j].length) seam(grid[j][i], grid[j][i + 1]); if (j + 1 < grid.length) seam(grid[j][i], grid[j + 1][i]); }
    }
    // hairline cracks, a few of them long
    for (let i = 0, n = Math.round(W * H / 90000); i < n; i++) crack(A, A.rr(0, W), A.rr(0, H), A.rr(40, 170), A.rr(0, TAU), T(A.chance(0.7) ? 'sepia' : 'umber'));
    // old stains: pigment that was spilled long ago and scrubbed
    for (const s of (o.stains || [])) {
      const e = A.roughen(A.ellipse(s[0], s[1], s[2], s[2] * A.rr(0.5, 0.85), A.rr(0, 3)), s[2] * 0.18, s[2] * 0.6, true);
      A.fill(e, 'shade', T(s[3]), { w: 5, p: 0.28, passes: 2, gap: 0.6 });
      A.blend(e, { r: Math.max(4, s[2] * 0.2), k: 0.5 });
      A.outline(e, 'shade', T(s[3]), { closed: true, w: 2.2, p: 0.22, pull: 40 });
    }
    // a scuff where something was dragged
    for (const s of (o.scuffs || [])) {
      for (let k = 0; k < 5; k++) A.stroke([[s[0] + A.rr(-4, 4), s[1] + k * 2.4], [s[0] + s[2] * 0.5, s[1] + k * 2.4 + A.rr(-2, 2)], [s[0] + s[2], s[1] + k * 2.6 + A.rr(-3, 3)]], 'shade', T('umber'), { w: A.rr(1, 2.2), p: A.rr(0.12, 0.24) });
      A.smudge([[s[0], s[1] + 5], [s[0] + s[2], s[1] + 7]], { r: 6, k: 0.4 });
    }
    // chalk dust where a stick was dropped and trodden in, and a breath of it carried about
    for (const s of (o.dust || [])) {
      for (let i = 0; i < 110; i++) { const a = A.rr(0, TAU), d = s[2] * Math.pow(A.rnd(), 0.75); A.dot(s[0] + Math.cos(a) * d, s[1] + Math.sin(a) * d * 0.72, 'pastel', T(A.chance(0.7) ? '#fbf8f0' : 'khadi'), { w: A.rr(0.7, 2.6), p: A.rr(0.2, 0.55), len: A.rr(0.1, 0.9) }); }
      const a = A.rr(0, TAU), e = [s[0] + Math.cos(a) * s[2] * 0.9, s[1] + Math.sin(a) * s[2] * 0.9];
      A.stroke([[s[0], s[1]], e], 'side', T('#fbf8f0'), { w: s[2] * 0.4, p: 0.3, tin: 0.2, tout: 0.6 });
      A.smudge([[s[0], s[1]], e], { r: s[2] * 0.16, k: 0.45 });
    }
    // rings where a wet pot was set down, once and then again a little to one side: the lime darkened, its tide line darker still
    for (const s of (o.rings || [])) {
      for (let k = 0; k < 2; k++) {
        const cx = s[0] + (k ? A.rr(-0.35, 0.35) * s[2] : 0), cy = s[1] + (k ? A.rr(-0.3, 0.3) * s[2] : 0), r = s[2] * (k ? A.rr(0.9, 1.04) : 1), a0 = A.rr(0, TAU), span = k ? A.rr(2.4, 4.2) : A.rr(5.3, 6.1);
        if (!k) M.floorWash(A, A.ellipse(cx, cy, r, r * 0.97), T('stone'), () => 0.07, 'mul');
        A.stroke(A.ellipse(cx, cy, r, r * 0.97, 0, a0, a0 + span), 'shade', T(A.mix('umber', 'stone', 0.4)), { w: 1.7, p: 0.34, tin: 0.2, tout: 0.3 });
        A.stroke(A.ellipse(cx, cy, r - 1.4, (r - 1.4) * 0.97, 0, a0 + 0.3, a0 + span - 0.4), 'shade', T('stone'), { w: 3, p: 0.13 });
      }
    }
  };

  // gold dust: a breath of it everywhere, thick where it spilled
  M.goldDust = function (A, pts, n, spread, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const q = pts[i % pts.length], r = spread * Math.pow(A.rnd(), o.pow || 1.6), a = A.rr(0, TAU);
      A.dot(q[0] + Math.cos(a) * r * (o.sx || 1), q[1] + Math.sin(a) * r * (o.sy || 1), 'gold', 'gold', { w: A.rr(0.6, o.big || 1.5), len: A.rr(0.05, 0.4) });
    }
  };

  /* ================================================================== THE RUG
     r = { cx, cy, w, h, rot }.  Everything is set out in the rug's own frame and turned with it. */
  const B = { guard: 8, zig: 17, main: 62, gold: 65, boteh: 91, guard2: 98, field: 101 };
  M.rugBands = B;
  M.rug = function (A, r, T, o) {
    o = o || {};
    const hw = r.w / 2, hh = r.h / 2, X = pts => A.xf(pts, { x: r.cx, y: r.cy, rot: r.rot || 0 });
    const R = i => [[-hw + i, -hh + i], [hw - i, -hh + i], [hw - i, hh - i], [-hw + i, hh - i]];
    const ring = (a, b) => [X(R(a)), X(R(b))];
    const red = T(A.mix('hingul', 'lac', 0.28)), indigo = T(A.mix('neel', 'lapis', 0.3));
    // the outer border is dyed in madder, cooler and deeper than the vermilion the folios are framed in, so a sheet lying
    // over it keeps its edge; the corner medallions keep the brighter red
    const madder = T('#862823');
    const ang = r.rot || 0;
    const say = o.say || (() => {});

    // its shadow on the floor, and the ends of the warp beyond the short sides
    say('rug shadow');
    A.fill(X(R(-3)).map(p => [p[0] + 4, p[1] + 6]), 'shade', T('umber'), { w: 8, p: 0.34, passes: 2, gap: 0.5 });
    A.blend(X(R(-8)).map(p => [p[0] + 4, p[1] + 6]), { r: 8, k: 0.4 });
    say('fringe');
    // the warp ends, gathered a few at a time and tied off in a knot, then left to splay: every bunch its own size, every
    // tassel its own length, some combed straight, some lying over, a thread or two strayed
    for (const sg of [-1, 1]) {
      let v = -hh + A.rr(3, 6);
      while (true) {
        const nT = A.ri(4, 7), span = nT * A.rr(2.1, 2.8);
        if (v + span > hh - 3) break;
        const kd = A.rr(4.5, 7.5), kn = [sg * (hw + kd), v + span / 2 + A.rr(-1.2, 1.2)];
        const len = A.rr(9, 27) * (A.chance(0.12) ? 0.5 : 1), lean = A.rr(-0.45, 0.45) + (A.chance(0.15) ? A.rr(-0.5, 0.5) : 0);
        const col = T(A.chance(0.7) ? 'khadi' : A.chance(0.5) ? A.mix('khadi', 'stone', 0.45) : A.mix('khadi', 'ochre', 0.3));
        const base = sg > 0 ? 0 : PI;
        // the tassel's shadow, then the threads drawn into the knot from the edge, then out of it
        A.stroke(X([[kn[0] + 1.4, kn[1] + 2], [kn[0] + sg * len * 0.8 + 1.4, kn[1] + Math.sin(lean) * len * 0.8 + 2]]), 'shade', T('umber'), { w: span * 0.55, p: 0.14, tin: 0.1, tout: 0.6 });
        for (let i = 0; i < nT; i++) { const v0 = v + (i + 0.5) * span / nT; A.stroke(X([[sg * (hw - 1), v0], [sg * (hw + kd * 0.55), v0 + (kn[1] - v0) * 0.6], kn]), 'chalk', A.mix(col, T('stone'), A.rr(0, 0.25)), { w: A.rr(1, 1.35), p: 0.88, tin: 0, tout: 0 }); }
        const nOut = nT + A.ri(-1, 2);
        for (let i = 0; i < nOut; i++) {
          const spread = (nOut > 1 ? i / (nOut - 1) - 0.5 : 0) * A.rr(0.35, 0.8), a = base + sg * (lean + spread), L = len * A.rr(0.62, 1.12), curl = A.rr(-0.3, 0.3);
          const m = [kn[0] + Math.cos(a - curl) * L * 0.5, kn[1] + Math.sin(a - curl) * L * 0.5], e = [kn[0] + Math.cos(a) * L, kn[1] + Math.sin(a) * L];
          A.stroke(X([kn, m, e]), 'chalk', A.mix(col, T(A.chance(0.5) ? 'stone' : 'khadi'), A.rr(0, 0.3)), { w: A.rr(0.75, 1.2), p: A.rr(0.7, 0.9), tin: 0.05, tout: 0.6 });
        }
        if (A.chance(0.18)) { const a = base + sg * A.rr(-1.2, 1.2), L = len * A.rr(0.8, 1.4); A.stroke(X([kn, [kn[0] + Math.cos(a + 0.3) * L * 0.5, kn[1] + Math.sin(a + 0.3) * L * 0.5], [kn[0] + Math.cos(a) * L, kn[1] + Math.sin(a) * L]]), 'chalk', col, { w: 0.7, p: 0.7, tout: 0.7 }); }
        // the knot: a lump of thread wound on itself, its shadow side a little dark
        const kp = X([kn])[0], kr = A.rr(2, 2.8) * (0.8 + nT * 0.06);
        A.dot(kp[0] + 0.6, kp[1] + 0.9, 'shade', T('umber'), { w: kr * 2.2, p: 0.3 });
        A.dot(kp[0], kp[1], 'chalk', col, { w: kr * 2, p: 0.95, len: A.rr(0.2, 0.8), ang: A.rr(0, 3) });
        A.stroke(A.ellipse(kp[0], kp[1], kr * 0.9, kr * 0.75, A.rr(0, 3), 0.3, 2.6), 'kajal', T(A.mix('stone', 'umber', 0.4)), { w: 0.45, p: 0.5 });
        A.stroke(A.ellipse(kp[0] - 0.3, kp[1] - 0.3, kr * 0.5, kr * 0.4, A.rr(0, 3), 3.6, 5.2), 'chalk', T('#fbf6ea'), { w: 0.6, p: 0.7 });
        v += span + A.rr(0.6, 3.2);
      }
    }

    // the grounds: red all over, then the stripes and the field laid into it
    say('rug grounds');
    A.ground(X(R(0)), madder, { w: 26, ang, edge: 0.8, rub: 7, c2: T('#8e2c26'), top: 0.6 });
    // and not one flat colour: the dye took darker in some lengths of the wool and drier in others, in slow clouds and in
    // streaks that run along the weave (laid without drawing on the hand's chance, so every mark after this falls where it did)
    {
      const sk = 37.1, dA = M.floorDrag(A, ang, 70, 3, sk, 1), dB = M.floorDrag(A, ang + PI / 2, 70, 3, sk + 5, 1);
      M.floorWash(A, X(R(0)), T('#7a2220'), (x, y) => 0.55 * sstep((A.fbm(x / 120 + sk, y / 120, 3, 31) - 0.47) / 0.2) * clamp(0.6 + 0.4 * dA(x, y), 0, 1.4));
      M.floorWash(A, X(R(0)), T('#94302a'), (x, y) => 0.4 * sstep((A.fbm(x / 80 - sk, y / 80 + 3, 3, 32) - 0.55) / 0.16) * clamp(0.5 + 0.5 * dB(x, y), 0, 1.4));
      M.floorWash(A, X(R(0)), T('#661c1c'), (x, y) => 0.35 * sstep((A.fbm(x / 46 + 9, y / 46 - sk, 2, 33) - 0.62) / 0.12));
      /* the outermost bands, the edge guard and the broad band the vine runs in, were dyed again in lac over the madder,
         down to a deep red-brown, so the vermilion frames of the sheets lying on them stand clear of the rug; the inner
         bands keep the madder.  A glaze, so the grain of the stick still shows through it, and uneven as a dye bath is */
      const ca = Math.cos(-ang), sa = Math.sin(-ang), lacK = (x, y) => {
        const u = (x - r.cx) * ca - (y - r.cy) * sa, v = (x - r.cx) * sa + (y - r.cy) * ca, d = Math.min(hw - Math.abs(u), hh - Math.abs(v));
        const inBand = (a, b) => sstep((d - a) / 1.2 + 0.5) * sstep((b - d) / 1.2 + 0.5);
        return Math.max(inBand(-2, B.guard), inBand(B.zig, B.main)) * (0.82 + 0.3 * A.fbm(x / 70 - sk, y / 70 + 5, 3, 34));
      };
      M.floorWash(A, X(R(0)), '#9c9284', lacK, 'mul');
    }
    A.fill(ring(B.guard, B.zig), 'pastel', T(A.mix('lac', 'maroon', 0.2)), { w: 4, p: 1, reach: 1.5, passes: 2, ang, gap: 0.42 });
    A.fill(ring(B.guard + 1.4, B.zig - 1.4), 'pastel', T('haldi'), { w: 4, p: 1, reach: 1.6, passes: 2, ang, gap: 0.4 });
    A.fill(ring(B.gold, B.boteh), 'pastel', T(A.mix('khadi', 'peach', 0.18)), { w: 5, p: 1, reach: 1.6, passes: 2, ang, gap: 0.42, cv: 0.02 });
    A.fill(ring(B.boteh, B.guard2), 'pastel', T(A.mix('lac', 'maroon', 0.35)), { w: 4, p: 1, reach: 1.6, passes: 2, ang, gap: 0.42 });
    A.ground(X(R(B.field)), indigo, { w: 28, ang: ang + 0.02, edge: 0, rub: 8, c2: T('neel'), top: 0.5 });
    cloud(A, X(R(B.field)), T('lapis'), { scale: 140, seed: 21, thr: 0.58, p: 0.3, w: 26, ang });
    cloud(A, X(R(B.field)), T('night'), { scale: 90, seed: 22, thr: 0.6, p: 0.22, w: 22, ang });

    // the field: a loose diamond lattice of paler indigo, a flower where the lines cross, a star in each lozenge
    say('rug field');
    const fw = hw - B.field, fh = hh - B.field, step = o.lattice || 66, sl = 0.62;
    A.withMask(X(R(B.field + 2)), () => {
      for (let c = -fw - fh / sl; c < fw + fh / sl; c += step) for (const sg of [1, -1]) {
        const pts = []; for (let v = -fh - 10; v <= fh + 10; v += 14) pts.push([c + sg * v / sl * 0.5 + A.rr(-0.6, 0.6), v]);
        A.stroke(X(pts), 'chalk', T(A.mix('lapis', 'sky', 0.25)), { w: 1.15, p: 0.5, wob: 1.2 });
      }
      const nodes = [];
      for (let iu = -30; iu <= 30; iu++) for (let iv = -30; iv <= 30; iv++) {
        const u = (iu + iv) * step / 2, v = (iv - iu) * step / 2 * sl;
        if (Math.abs(u) < fw + 8 && Math.abs(v) < fh + 8) nodes.push([u, v, 0]);
        const u2 = u + step / 2, v2 = v;
        if (Math.abs(u2) < fw + 8 && Math.abs(v2) < fh + 8) nodes.push([u2, v2, 1]);
      }
      const FC = ['khadi', 'peach', 'haldi', 'khadi', 'gulabi'];
      for (const q of nodes) {
        const p = X([[q[0] + A.rr(-1, 1), q[1] + A.rr(-1, 1)]])[0];
        if (o.skipNear && o.skipNear(p)) continue;
        if (q[2] === 0) {
          const c = T(A.pick(FC)), a0 = A.rr(0, 0.4) + ang, rr2 = A.rr(4.6, 6);
          for (let k = 0; k < 4; k++) { const a = a0 + k * PI / 2 + A.rr(-0.1, 0.1); A.stroke([[p[0] + Math.cos(a) * 1.2, p[1] + Math.sin(a) * 1.2], [p[0] + Math.cos(a) * rr2, p[1] + Math.sin(a) * rr2]], 'chalk', c, { w: 3, p: 0.95, reach: 1.5, tin: 0.1, tout: 0.4 }); }
          for (let k = 0; k < 4; k++) { const a = a0 + PI / 4 + k * PI / 2; A.dot(p[0] + Math.cos(a) * 4.2, p[1] + Math.sin(a) * 4.2, 'chalk', T('malachite'), { w: 1.6, p: 0.8 }); }
          A.dot(p[0], p[1], A.chance(0.5) ? 'gold' : 'chalk', A.chance(0.5) ? 'gold' : T('hingul'), { w: 1.9, p: 1 });
        } else {
          const c = T(A.chance(0.5) ? 'haldi' : 'khadi');
          for (let k = 0; k < 4; k++) { const a = ang + k * PI / 2; A.dot(p[0] + Math.cos(a) * 2.6, p[1] + Math.sin(a) * 2.6 * sl * 1.4, 'chalk', c, { w: 1.3, p: 0.85 }); }
          if (A.chance(0.35)) A.dot(p[0], p[1], 'gold', 'gold', { w: 1.3 });
        }
      }
    });

    // corner quarter medallions: a scalloped yellow edge, a red ground, a quarter of a lotus, a gold heart
    say('rug corners');
    for (const cu of [-1, 1]) for (const cv of [-1, 1]) {
      const c0 = [cu * fw, cv * fh], Rm = o.cornerR || 112, a0 = Math.atan2(-cv, -cu) - PI / 4;
      A.withMask(X(R(B.field)), () => {
        const disc = (k, lob) => { const pts = []; for (let i = 0; i <= 240; i++) { const a = i / 240 * TAU, r = Rm * k * (lob ? 0.95 + 0.05 * Math.abs(Math.cos(a * lob / 2)) : 1); pts.push([c0[0] + Math.cos(a) * r, c0[1] + Math.sin(a) * r]); } return X(pts); };
        A.fill(disc(1, 56), 'pastel', T('haldi'), { w: 4.5, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
        A.fill(disc(0.86), 'pastel', red, { w: 4.5, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ang + 0.6 });
        A.outline(disc(1, 56), 'kajal', T('kajal'), { closed: true, w: 0.8, p: 0.75 });
        for (let k = 0; k < 15; k++) { const a = a0 + (k + 0.5) * (PI / 2) / 15; A.dot(...X([[c0[0] + Math.cos(a) * Rm * 0.93, c0[1] + Math.sin(a) * Rm * 0.93]])[0], 'chalk', T(k % 2 ? 'hingul' : 'khadi'), { w: 2.2, p: 0.95 }); }
        // the lotus: petals laid edge to edge, white with a blush at the tip
        for (const ring of [[0.8, 9, 0.4], [0.62, 7, 0.34]]) for (let k = 0; k < ring[1]; k++) {
          const a = a0 + (k + 0.5) * (PI / 2) / ring[1], r0 = Rm * ring[2], r1 = Rm * ring[0], hw2 = (PI / 2) / ring[1] * r0 * 1.1;
          const pe = []; for (let j = 0; j <= 12; j++) { const v = j / 12, w2 = hw2 * Math.pow(1 - v, 0.6) * (0.7 + 0.8 * v); pe.push([r0 + (r1 - r0) * v, -w2]); }
          for (let j = 12; j >= 0; j--) { const v = j / 12, w2 = hw2 * Math.pow(1 - v, 0.6) * (0.7 + 0.8 * v); pe.push([r0 + (r1 - r0) * v, w2]); }
          const pts = X(pe.map(p => add(c0, rot(p, a))));
          A.fill(pts, 'pastel', T(ring[1] === 9 ? 'khadi' : 'gulabi'), { w: 2.4, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: a + ang });
          A.withMask(pts, () => A.dot(...X([add(c0, rot([r1 - (r1 - r0) * 0.18, 0], a))])[0], 'chalk', T('rose'), { w: (r1 - r0) * 0.3, p: 0.8, len: 1.4, ang: a + ang }));
          A.stroke(X([add(c0, rot([r0 + 3, 0], a)), add(c0, rot([r1 - 6, 0], a))]), 'chalk', T('rose'), { w: 0.8, p: 0.6 });
          A.outline(pts, 'kajal', T('maroon'), { closed: true, w: 0.65, p: 0.7, again: 0 });
        }
        A.fill(disc(0.36), 'pastel', T(A.mix('lapis', 'neel', 0.3)), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
        for (let k = 0; k < 5; k++) { const a = a0 + (k + 0.5) * (PI / 2) / 5; A.dot(...X([[c0[0] + Math.cos(a) * Rm * 0.27, c0[1] + Math.sin(a) * Rm * 0.27]])[0], 'chalk', T('khadi'), { w: 2.6, p: 1 }); }
        A.fill(disc(0.17), 'gold', 'gold', { w: 2.4, p: 1, passes: 2, gap: 0.45 });
        for (const k of [0.86, 0.36, 0.17]) A.outline(disc(k), 'kajal', T('kajal'), { closed: true, w: 0.85, p: 0.8 });
        A.outline(disc(0.88), 'gold', 'gold', { closed: true, w: 1.3, p: 0.9 });
      }, 0);
    }

    // the main border: a running vine of flowers and leaves on the red
    say('rug vine');
    const mid = (B.zig + B.main) / 2, mw = B.main - B.zig;
    const sides = [
      { a: [-hw + B.main, -hh + mid], b: [hw - B.main, -hh + mid], n: [0, 1] },
      { a: [hw - mid, -hh + B.main], b: [hw - mid, hh - B.main], n: [-1, 0] },
      { a: [hw - B.main, hh - mid], b: [-hw + B.main, hh - mid], n: [0, -1] },
      { a: [-hw + mid, hh - B.main], b: [-hw + mid, -hh + B.main], n: [1, 0] }
    ];
    const period = o.vine || 92;
    for (const sd of sides) {
      const L = Math.hypot(sd.b[0] - sd.a[0], sd.b[1] - sd.a[1]), ux = (sd.b[0] - sd.a[0]) / L, uy = (sd.b[1] - sd.a[1]) / L;
      const nW = Math.max(2, Math.round(L / period)), per = L / nW, amp = mw * 0.24;
      const at = (s, off) => [sd.a[0] + ux * s + sd.n[0] * off, sd.a[1] + uy * s + sd.n[1] * off];
      /* drawn by eye, not by rule: each swing of the stem a little fuller or flatter than the last, the crests running
         a little early or late, and the whole line wandering off its middle and back */
      const ph = A.rr(0, 20), wave = s => amp * (1 + 0.17 * Math.sin(s / per * 1.73 + ph) + 0.08 * Math.sin(s / per * 4.1 - ph)) * Math.sin(s / per * TAU + 0.3 * Math.sin(s / per * 0.93 + ph * 1.3)) + 1.1 * Math.sin(s / (per * 1.7) + ph * 0.7) + 0.7 * (A.noise2(s / 13 + ph, 0.5, 9) - 0.5);
      const stem = []; for (let s = 0; s <= L; s += 4) stem.push(at(s, wave(s)));
      A.stroke(X(stem).map((q, i) => [q[0], q[1], 0.82 + 0.18 * A.noise2(i / 5 + ph, 1.5, 4)]), 'chalk', T(A.mix('malachite', 'sap', 0.35)), { w: 2.2, p: 0.95, reach: 1.4 });
      for (let k = 0; k < nW * 2; k++) {
        const s = (k + 0.25) * per / 2, up = k % 2 === 0, off = wave(s);
        const p = X([at(s, off)])[0], side = up ? 1 : -1;
        // a leaf pair off the stem, and a flower or a bud on the crest
        for (const dl of [-0.5, 0.5]) {
          const s2 = s + dl * per * 0.32, b0 = at(s2, wave(s2)), tip = at(s2 + dl * 7, wave(s2) - side * 11);
          const n2 = [-(tip[1] - b0[1]), tip[0] - b0[0]], nl = Math.hypot(n2[0], n2[1]) || 1, w2 = 3.2;
          const leaf = [b0, [(b0[0] + tip[0]) / 2 + n2[0] / nl * w2, (b0[1] + tip[1]) / 2 + n2[1] / nl * w2], tip, [(b0[0] + tip[0]) / 2 - n2[0] / nl * w2, (b0[1] + tip[1]) / 2 - n2[1] / nl * w2]];
          A.shape(X(A.spline(leaf, true, 1.6)), { c: T(A.chance(0.5) ? 'malachite' : A.mix('sap', 'malachite', 0.5)), w: 2, rough: 0.2, line: false });
          A.stroke(X([b0, tip]), 'chalk', T('leaf'), { w: 0.7, p: 0.6 });
        }
        const fc = at(s, off + side * mw * 0.13), fp = X([fc])[0];
        if (k % 4 === 0 || k % 4 === 2) {
          const pc = T(k % 4 === 0 ? 'khadi' : 'haldi');
          M.cityHand.rosette(A, fp, 7.6, pc, 6, k % 4 === 0 ? T('haldi') : T('hingul'));
          A.outline(A.ellipse(fp[0], fp[1], 8.6, 8.6), 'kajal', T('maroon'), { closed: true, w: 0.6, p: 0.5, again: 0 });
        } else {
          // a bud: a lapis drop with a white tip
          const a = Math.atan2(-side * (sd.n[1]) - 0, 0) ; void a;
          const tipP = at(s, off + side * mw * 0.26), bud = [fc, tipP];
          const bp = X(bud), d = [bp[1][0] - bp[0][0], bp[1][1] - bp[0][1]], dl = Math.hypot(d[0], d[1]) || 1, nn = [-d[1] / dl * 4.2, d[0] / dl * 4.2];
          A.shape(A.spline([bp[0], [bp[0][0] + d[0] * 0.45 + nn[0], bp[0][1] + d[1] * 0.45 + nn[1]], bp[1], [bp[0][0] + d[0] * 0.45 - nn[0], bp[0][1] + d[1] * 0.45 - nn[1]]], true, 1.4), { c: T('lapis'), w: 2.2, rough: 0.2, line: T('kajal'), lw: 0.6, lp: 0.6 });
          A.dot(bp[1][0] - d[0] * 0.12, bp[1][1] - d[1] * 0.12, 'chalk', T('khadi'), { w: 2, p: 0.9 });
        }
      }
    }
    // squares where the border turns, each with its own flower
    for (const cu of [-1, 1]) for (const cv of [-1, 1]) {
      const c0 = [cu * (hw - mid), cv * (hh - mid)], q = X([[c0[0] - mw / 2 + 2, c0[1] - mw / 2 + 2], [c0[0] + mw / 2 - 2, c0[1] - mw / 2 + 2], [c0[0] + mw / 2 - 2, c0[1] + mw / 2 - 2], [c0[0] - mw / 2 + 2, c0[1] + mw / 2 - 2]]);
      A.fill(q, 'pastel', T(A.mix('lac', 'maroon', 0.3)), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
      const cp = X([c0])[0];
      for (let k = 0; k < 8; k++) { const a = ang + k * PI / 4; A.stroke([[cp[0] + Math.cos(a) * 3, cp[1] + Math.sin(a) * 3], [cp[0] + Math.cos(a) * 15, cp[1] + Math.sin(a) * 15]], 'chalk', T(k % 2 ? 'haldi' : 'khadi'), { w: k % 2 ? 3.2 : 4.4, p: 0.95, reach: 1.5, tin: 0.1, tout: 0.5 }); }
      A.dot(cp[0], cp[1], 'gold', 'gold', { w: 4 });
      A.outline(q, 'kajal', T('kajal'), { closed: true, w: 0.8, p: 0.8 });
    }

    // the zigzag in the yellow stripe, the dots in the guards, the little boteh
    say('rug stripes');
    const runAround = (inset, stepL, fn) => {
      const pts = X(R(inset)); for (let i = 0; i < 4; i++) {
        const a = pts[i], b = pts[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / stepL);
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; fn([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], Math.atan2(b[1] - a[1], b[0] - a[0]), k, i); }
      }
    };
    {
      const pts = X(R((B.guard + B.zig) / 2));
      for (let i = 0; i < 4; i++) {
        const a = pts[i], b = pts[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, zz = [];
        for (let s = 0, k = 0; s <= L; s += 4.6, k++) { const off = (k % 2 ? 1 : -1) * 2.7; zz.push([a[0] + ux * s - uy * off, a[1] + uy * s + ux * off]); }
        A.outline(zz, 'kajal', T('maroon'), { w: 0.85, p: 0.85, pull: 90 });
      }
    }
    runAround(B.guard / 2, 7.4, p => A.dot(p[0], p[1], 'chalk', T('khadi'), { w: 2.2, p: 0.9, reach: 1.5 }));
    runAround((B.boteh + B.guard2) / 2, 9, (p, a, k) => A.dot(p[0], p[1], 'chalk', T(k % 3 ? 'haldi' : 'khadi'), { w: 2, p: 0.9, reach: 1.5 }));
    // the boteh: a seed with its tip curled over, turned one way and then the other, a little flower between
    const BOT = [[8.4, -7.6], [4.6, -6.4], [0.4, -5.2], [-4.4, -3.4], [-6, 0.4], [-4, 4.4], [0.6, 5.6], [5, 3.6], [6.8, 0], [7.4, -3.6], [9.6, -6.2]];
    // each one cut by hand: turned a few degrees this way or that, a little larger or smaller, its colour drifting toward a neighbour's
    const DRIFT = [['neel', 'sky', 'teal', 'night'], ['sindoor', 'lac', 'brick', 'saffron'], ['sap', 'teal', 'verdigris', 'olive'], ['sindoor', 'lac', 'brick', 'peori']];
    const BASE = ['lapis', 'hingul', A.mix('malachite', 'sap', 0.3), 'hingul'], ODD = ['saffron', 'teal', 'peori', A.mix('lac', 'maroon', 0.3), 'verdigris', 'gulabi'];
    /* cut along the band by eye, not by rule: the spacing opens and closes, a pair now and then turn to face each other,
       one leans over further, one is plumper; the colours keep their round of blue, red, green, red but the hand slips
       now and then and reaches for another pot.  The little flower between is sometimes a rosette, sometimes three dots. */
    {
      const pts = X(R((B.gold + B.boteh) / 2));
      let k = 0, face = 1;
      for (let i = 0; i < 4; i++) {
        const a = pts[i], b = pts[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), a0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
        let s = A.rr(10, 18);
        while (s < L - 10) {
          const p0 = [a[0] + (b[0] - a[0]) * s / L, a[1] + (b[1] - a[1]) * s / L];
          // facing: mostly turn and turn about, sometimes two the same way, sometimes a pair kissing
          face = A.chance(0.18) ? face : -face;
          const flip = face, s2 = A.rr(0.82, 1.12) * (A.chance(0.1) ? 1.08 : 1), lean = A.rr(-0.2, 0.2) + (A.chance(0.12) ? A.rr(-0.16, 0.16) : 0);
          const an = a0 + lean, p = add(p0, [A.rr(-1.2, 1.2), A.rr(-1.2, 1.2)]);
          const cb = A.chance(0.17) ? A.pick(ODD) : BASE[k % 4];
          const c = T(A.mix(cb, A.pick(DRIFT[k % 4]), A.rr(0.02, 0.24)));
          // the outline is cut afresh each time: the tip curls further or less, the belly fuller or thinner
          const curl = A.rr(-0.9, 1.4), belly = A.rr(0.9, 1.12);
          const loc = BOT.map((q, j) => add(rot([(q[0] * (q[0] < 0 ? belly : 1) + (j > 7 ? curl : 0)) * flip * s2, (q[1] * (j > 3 && j < 8 ? belly : 1) + (j > 8 ? -curl * 0.6 : 0)) * s2], an), p));
          /* and printed as a block prints: the colour and the outline are two blocks, and the second never sits quite on
             the first; the ink is heavier on one and starved on the next; now and then the printer struck twice, and once
             in a long while the block missed altogether and left its place bare */
          const miss = A.chance(0.03), ink = A.chance(0.2) ? A.rr(0.55, 0.75) : A.rr(0.8, 1);
          if (!miss) {
            const sh = A.shape(A.spline(loc, true, 0.9), { c, p: 0.95 * ink, w: 1.8, rough: 0.2, line: T('kajal'), lw: A.rr(0.42, 0.6), lp: A.rr(0.6, 0.85) * (0.75 + 0.25 * ink), off: A.rr(0.7, 1.35) });
            if (A.chance(0.07)) { const g = A.rr(1, 1.8), ga = A.rr(0, TAU); A.outline(sh.map(q => [q[0] + Math.cos(ga) * g, q[1] + Math.sin(ga) * g]), 'kajal', T('kajal'), { closed: true, w: 0.45, p: A.rr(0.3, 0.45) }); }
          }
          const e = add(rot([-0.8 * flip * s2, 0.6 * s2], an), p);
          const inner = miss ? -1 : A.ri(0, 3);
          if (inner === 0) { A.dot(e[0], e[1], 'chalk', T('khadi'), { w: 2.6 * s2, p: 0.95 }); A.dot(e[0], e[1], 'chalk', T(A.chance(0.5) ? 'haldi' : 'lapis'), { w: 1.1, p: 0.9 }); }
          else if (inner === 1) { const sm = BOT.map(q => add(rot([q[0] * flip * s2 * 0.45 - 0.6 * flip, q[1] * s2 * 0.45 + 0.4], an), p)); A.outline(A.spline(sm, true, 0.9), 'chalk', T('khadi'), { closed: true, w: 0.8, p: 0.85 }); }
          else if (inner === 2) for (let j = 0; j < 3; j++) { const q = add(rot([(-2.4 + j * 2) * flip * s2, (0.8 - Math.abs(j - 1) * 1.2) * s2], an), p); A.dot(q[0], q[1], 'chalk', T(j === 1 ? 'haldi' : 'khadi'), { w: A.rr(1.2, 1.7), p: 0.9 }); }
          else if (inner === 3) { A.dot(e[0], e[1], 'chalk', T('khadi'), { w: 3.2 * s2, p: 0.9, len: 0.6, ang: an }); A.dot(e[0], e[1], 'kajal', T('kajal'), { w: 0.8, p: 0.6 }); }
          if (!miss && A.chance(0.7)) for (let j = 0; j < 5; j++) { if (A.chance(0.15)) continue; const q = add(rot([(-0.8 + Math.cos(j * 1.25) * 3.6) * flip * s2, (0.6 + Math.sin(j * 1.25) * 3.6) * s2], an), p); A.dot(q[0], q[1], 'chalk', T('khadi'), { w: A.rr(0.6, 1), p: 0.8 }); }
          // between this one and the next
          const gap = A.rr(22, 31) * (s2 > 1.05 ? 1.08 : 1);
          if (s + gap * 0.5 < L - 6) {
            const e2 = [a[0] + (b[0] - a[0]) * (s + gap * 0.5) / L + A.rr(-0.8, 0.8), a[1] + (b[1] - a[1]) * (s + gap * 0.5) / L + A.rr(-0.8, 0.8)], fk = A.ri(0, 4);
            if (fk <= 1) { for (let j = 0; j < 4; j++) { const aa = an + j * PI / 2 + PI / 4 + A.rr(-0.2, 0.2); A.dot(e2[0] + Math.cos(aa) * 2, e2[1] + Math.sin(aa) * 2, 'chalk', T(k % 2 ? 'hingul' : 'malachite'), { w: A.rr(1.3, 1.8), p: 0.9 }); } A.dot(e2[0], e2[1], 'gold', 'gold', { w: 1.1 }); }
            else if (fk === 2) for (let j = 0; j < 3; j++) { const aa = a0 + PI / 2 + (j - 1) * 2.1; A.dot(e2[0] + Math.cos(aa) * 1.8, e2[1] + Math.sin(aa) * 1.8, 'chalk', T(A.pick(['haldi', 'khadi', 'hingul'])), { w: 1.4, p: 0.9 }); }
            else if (fk === 3) { for (let j = 0; j < 5; j++) { const aa = A.rr(0, 1) + j * 1.2566; A.stroke([[e2[0] + Math.cos(aa) * 0.6, e2[1] + Math.sin(aa) * 0.6], [e2[0] + Math.cos(aa) * 2.8, e2[1] + Math.sin(aa) * 2.8]], 'chalk', T('khadi'), { w: 1.6, p: 0.9, tin: 0.1, tout: 0.4 }); } A.dot(e2[0], e2[1], 'chalk', T('hingul'), { w: 1.2, p: 0.95 }); }
            else A.dot(e2[0], e2[1], 'gold', 'gold', { w: A.rr(1.2, 1.8) });
          }
          s += gap; k++;
        }
      }
    }

    // the rules between the bands, by hand; gold beside the field
    say('rug rules');
    const box = (i, tool, c, o2) => { const p = X(R(i)); for (let k = 0; k < 4; k++) hl(A, p[k], p[(k + 1) % 4], tool, c, o2); };
    for (const i of [B.guard, B.zig, B.main, B.gold, B.boteh, B.guard2, B.field]) box(i, 'kajal', T('kajal'), { w: 0.85, p: 0.8, ov: 1.6 });
    box(B.main + 1.6, 'gold', 'gold', { w: 1.8, p: 0.95, ov: 1 });
    box(B.guard2 + 1.6, 'gold', 'gold', { w: 1.5, p: 0.9, ov: 1 });
    A.outline(X(R(0.5)), 'kajal', T('maroon'), { closed: true, w: 1, p: 0.6, pull: 120 });

    // the weave: fine ribs of weft across everything, and wear where feet went
    say('rug weave');
    A.fill(X(R(0)), 'shade', T('khadi'), { w: 1.3, gap: 2.1, ang, p: 0.11, passes: 1, len: 220 });
    A.fill(X(R(0)), 'shade', T('kajal'), { w: 1.1, gap: 3.3, ang, p: 0.07, passes: 1, len: 220 });
    for (const wz of (o.wear || [])) cloud(A, X(R(0)), T('khadi'), { scale: 40, seed: wz[2], thr: 0.5, p: 0.16, w: 14, ang, g: (x, y) => sstep(1 - Math.hypot(x - wz[0], y - wz[1]) / wz[3]) });
    // a few loose threads
    for (let i = 0; i < 5; i++) {
      const u = A.rr(-hw, hw), v = A.chance(0.5) ? -hh + A.rr(0, 15) : hh - A.rr(0, 15), q = X([[u, v]])[0];
      A.stroke(A.spline([q, [q[0] + A.rr(-9, 9), q[1] + A.rr(-9, 9)], [q[0] + A.rr(-16, 16), q[1] + A.rr(-16, 16)]], false, 2), 'chalk', T(A.pick(['haldi', 'khadi', 'hingul'])), { w: 0.9, p: 0.7 });
    }
  };

  /* ================================================================== THE SUN DISC
     Gold at the heart, a ring of lotus petals, and rays: straight ones and ones that flicker like flame. */
  M.sunDisc = function (A, cx, cy, R, T, o) {
    o = o || {};
    const n = o.n || 32, r0 = R * 0.5, rays = [];
    A.fill(A.roughen(A.ellipse(cx, cy, R * 0.66, R * 0.66), 2, 30, true), 'side', T('saffron'), { w: 16, p: 0.4, passes: 1 });
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + A.rr(-0.012, 0.012), long = i % 2 === 0, r1 = long ? R * A.rr(0.97, 1.02) : R * A.rr(0.8, 0.86);
      const hwid = (TAU / n) * r0 * (long ? 0.46 : 0.42);
      const at = (rr2, v) => add([cx, cy], rot([rr2, v], a));
      if (long) {
        rays.push([a, r1, hwid]);
        const pts = [at(r0, -hwid), at(r0 + (r1 - r0) * 0.5, -hwid * 0.42), at(r1, 0), at(r0 + (r1 - r0) * 0.5, hwid * 0.42), at(r0, hwid)];
        A.shape(pts, { c: T('haldi'), w: 2.6, rough: 0.35, line: T('maroon'), lw: 0.7, lp: 0.75, ang: a });
        A.stroke(press(A, [at(r0 + 2, 0), at(r0 + (r1 - r0) * 0.5, A.rr(-0.4, 0.4)), at(r1 - 6, 0)], 0.6, 1), 'gold', 'gold', { w: 2.1, p: 0.95 });
        // the gold crayon worked down each ray after the colour: along the edge toward the light, and in short hatches
        A.withMask(pts, () => {
          A.stroke(press(A, [at(r0 + 3, -hwid * 0.62), at(r0 + (r1 - r0) * 0.5, -hwid * 0.28), at(r1 - 3, -0.4)], 0.3, 1.2), 'gold', 'gold', { w: 1.3, p: 0.8, tin: 0.1, tout: 0.4 });
          for (let k = 0; k < 4; k++) { const t = 0.15 + k * 0.2 + A.rr(-0.04, 0.04), rr2 = r0 + (r1 - r0) * t, hw2 = hwid * (1 - t * 0.6); A.stroke([at(rr2 - 2, -hw2 * 0.9), at(rr2 + 2.5, hw2 * 0.2)], 'gold', A.chance(0.5) ? 'gold' : '#e8c060', { w: 0.9, p: A.rr(0.5, 0.8), tin: 0.2, tout: 0.4 }); }
          // and over most of the rays a piece of real leaf, pressed down on its size and torn where it ended: never the
          // whole ray, never the same stretch of it twice
          if (A.chance(0.78)) {
            const ta = A.rr(0.02, 0.32), tb = Math.min(1.05, ta + A.rr(0.35, 0.7)), ra = r0 + (r1 - r0) * ta, rb = r0 + (r1 - r0) * tb, wa = hwid * 1.2;
            const lf = A.roughen([at(ra, -wa), at(rb, -wa), at(rb + A.rr(-4, 4), wa), at(ra + A.rr(-4, 4), wa)], 1.1, 5, true);
            A.fill(lf, 'gold', A.chance(0.5) ? '#e4b84a' : '#d8a63c', { w: 2.2, p: 1, passes: 2, gap: 0.4, ang: a });
            A.withMask(lf, () => {
              A.stroke([at(ra + 2, -hwid * 0.45), at(rb - 2, -hwid * 0.1)], 'gold', '#fbe7a6', { w: 1.2, p: 0.75, tin: 0.3, tout: 0.4 });
              if (tb - ta > 0.45) { const ts = r0 + (r1 - r0) * (ta + (tb - ta) * A.rr(0.35, 0.65)); A.stroke([at(ts, -wa), at(ts + A.rr(-2, 2), wa)], 'kajal', T(A.mix('umber', 'ochre', 0.4)), { w: 0.35, p: 0.4 }); }
            });
          }
        });
      } else {
        const L = [], Rt = [], m = 9;
        for (let k = 0; k <= m; k++) { const t = k / m, rr2 = r0 + (r1 - r0) * t, wv = Math.sin(t * PI * 2.2 + i) * hwid * 0.5 * t, ww = hwid * (1 - t) * 0.95 + 0.6; L.push(at(rr2, wv - ww)); Rt.push(at(rr2, wv + ww)); }
        const flame = L.concat(Rt.slice().reverse());
        A.shape(flame, { c: T('saffron'), w: 2.4, rough: 0.3, line: T('lac'), lw: 0.65, lp: 0.7, ang: a });
        const spine = L.map((p, k) => [(p[0] + Rt[k][0]) / 2, (p[1] + Rt[k][1]) / 2]).slice(1, -2);
        A.stroke(spine, 'chalk', T('haldi'), { w: 1.3, p: 0.8 });
        // a line of gold crayon running up the flame, pressed and lifted
        A.withMask(flame, () => {
          A.stroke(press(A, spine.map(p => [p[0] + A.rr(-0.3, 0.3), p[1] + A.rr(-0.3, 0.3)]), 0.25, 1.5), 'gold', 'gold', { w: 1.2, p: 0.85, tin: 0.15, tout: 0.5 });
          // a scrap of leaf at the root of some flames
          if (A.chance(0.4)) { const tb = A.rr(0.25, 0.5), lf = A.roughen([at(r0 - 2, -hwid * 1.2), at(r0 + (r1 - r0) * tb, -hwid), at(r0 + (r1 - r0) * tb, hwid), at(r0 - 2, hwid * 1.2)], 0.9, 4, true); A.fill(lf, 'gold', '#e4b84a', { w: 1.8, p: 1, passes: 2, gap: 0.4, ang: a }); }
        });
      }
    }
    // flecks of gold between the rays, where the crayon touched down
    for (let i = 0; i < 70; i++) { const a = A.rr(0, TAU), d = R * A.rr(0.55, 0.95); A.dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 'gold', 'gold', { w: A.rr(0.6, 1.5), len: A.rr(0.1, 0.8), ang: a }); }
    // a ring of dots, then the lotus petals
    for (let i = 0; i < 48; i++) { const a = i * TAU / 48 + 0.03; A.dot(cx + Math.cos(a) * R * 0.52, cy + Math.sin(a) * R * 0.52, 'gold', 'gold', { w: 1.7 }); }
    A.fill(A.ellipse(cx, cy, R * 0.5, R * 0.5), 'pastel', T(A.mix('hingul', 'lac', 0.3)), { w: 5, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    const np = 16;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < np; i++) {
      const a = (i + pass * 0.5) * TAU / np, ri = R * 0.3, ro = R * (pass ? 0.44 : 0.49), hwid = TAU / np * ri * 0.62;
      const pts = A.spline([add([cx, cy], rot([ri, -hwid], a)), add([cx, cy], rot([ri + (ro - ri) * 0.55, -hwid * 0.95], a)), add([cx, cy], rot([ro, 0], a)), add([cx, cy], rot([ri + (ro - ri) * 0.55, hwid * 0.95], a)), add([cx, cy], rot([ri, hwid], a))], false, 1.6);
      A.shape(pts, { c: T(pass ? 'gulabi' : 'khadi'), w: 2.6, rough: 0.25, line: T('lac'), lw: 0.65, lp: 0.75, ang: a });
      if (!pass) A.stroke([add([cx, cy], rot([ri + 3, 0], a)), add([cx, cy], rot([ro - 5, 0], a))], 'chalk', T('rose'), { w: 1.2, p: 0.7 });
    }
    // the gold heart: a lotus worked gold on gold. Dull gold is laid as the ground, the petals are burnished over it and
    // drawn round with a hair of umber, and the gilder's stylus pricks a ring of dots round the edge. Only a flower: no face.
    const hr = R * 0.3, heart = A.roughen(A.ellipse(cx, cy, hr, hr), 0.6, 10, true), C0 = [cx, cy];
    const dull = '#b8862e', deep = '#8a5a1a', pale = '#f6e09a', hair = T(A.mix('umber', 'sepia', 0.35));
    A.fill(heart, 'pastel', T('ochre'), { w: 5, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.fill(heart, 'gold', dull, { w: 3.2, p: 1, passes: 2, gap: 0.45, ang: 0.3 });
    A.withMask(heart, () => {
      const at = (a, r, v) => add(C0, rot([r, v], a));
      const petal = (a, r0, r1, hw) => A.spline([at(a, r0, -hw * 0.3), at(a, r0 + (r1 - r0) * 0.28, -hw), at(a, r0 + (r1 - r0) * 0.7, -hw * 0.84), at(a, r1, 0), at(a, r0 + (r1 - r0) * 0.7, hw * 0.84), at(a, r0 + (r1 - r0) * 0.28, hw), at(a, r0, hw * 0.3)], true, 0.7);
      // the deep between the petals: a darker gold rubbed in a ring
      A.stroke(A.ellipse(cx, cy, hr * 0.62, hr * 0.62), 'gold', deep, { w: hr * 0.3, p: 0.4 });
      // eight broad petals, burnished: bright down the side toward the window, deeper on the other
      for (let i = 0; i < 8; i++) {
        const a = (i + 0.5) * TAU / 8 + A.rr(-0.025, 0.025), pp = petal(a, hr * 0.24, hr * 0.88, hr * 0.27);
        A.fill(pp, 'gold', 'gold', { w: 2, p: 1, passes: 2, gap: 0.4, ang: a });
        A.withMask(pp, () => {
          A.stroke([at(a, hr * 0.34, hr * 0.12), at(a, hr * 0.62, hr * 0.16), at(a, hr * 0.84, hr * 0.03)], 'gold', deep, { w: hr * 0.12, p: 0.55 });
          A.stroke([at(a, hr * 0.36, -hr * 0.13), at(a, hr * 0.6, -hr * 0.17), at(a, hr * 0.8, -hr * 0.05)], 'gold', pale, { w: hr * 0.07, p: 0.85 });
          for (let v = -2; v <= 2; v++) if (v) A.stroke([at(a, hr * 0.42, v * hr * 0.035), at(a, hr * 0.66, v * hr * 0.07)], 'kajal', hair, { w: 0.32, p: 0.4 });
        });
        A.stroke([at(a, hr * 0.32, 0), at(a, hr * 0.8, 0)], 'kajal', hair, { w: 0.45, p: 0.55, tin: 0.1, tout: 0.4 });
        A.outline(pp, 'kajal', hair, { closed: true, w: 0.6, p: 0.75 });
      }
      // eight small petals in the gaps, of paler gold, their tips just showing
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + A.rr(-0.025, 0.025), pp = petal(a, hr * 0.4, hr * 0.74, hr * 0.13);
        A.fill(pp, 'gold', pale, { w: 1.4, p: 1, passes: 2, gap: 0.4, ang: a });
        A.outline(pp, 'kajal', hair, { closed: true, w: 0.45, p: 0.55 });
      }
      // the seed head: a round of dull gold, a ring of dots pricked into it, a bead of red at its heart
      const seed = A.roughen(A.ellipse(cx, cy, hr * 0.27, hr * 0.27), 0.25, 6, true);
      A.fill(seed, 'gold', dull, { w: 1.6, p: 1, passes: 2, gap: 0.42 });
      A.withMask(seed, () => A.stroke(A.ellipse(cx - hr * 0.04, cy - hr * 0.04, hr * 0.2, hr * 0.2, 0, 3.3, 4.9), 'gold', pale, { w: 1.1, p: 0.85 }));
      A.outline(seed, 'kajal', hair, { closed: true, w: 0.55, p: 0.7 });
      for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + 0.17, q = at(a, hr * 0.165, 0); A.dot(q[0], q[1], 'kajal', hair, { w: 0.95, p: 0.8 }); }
      A.dot(cx, cy, 'chalk', T('hingul'), { w: 2.4, p: 0.95 });
      A.dot(cx - 0.5, cy - 0.5, 'chalk', T('peach'), { w: 0.8, p: 0.8 });
      // the stylus: a ring of tiny dots round the rim of the gold, and a fine ring inside it
      A.stroke(A.ellipse(cx, cy, hr * 0.935, hr * 0.935), 'gold', pale, { w: hr * 0.075, p: 0.9 });
      const nd = Math.round(hr * 1.15);
      for (let i = 0; i < nd; i++) { const a = i * TAU / nd + A.rr(-0.01, 0.01), q = at(a, hr * (0.935 + A.rr(-0.006, 0.006)), 0); A.dot(q[0], q[1], 'kajal', hair, { w: A.rr(0.8, 1.05), p: 0.8 }); }
      A.outline(A.ellipse(cx, cy, hr * 0.89, hr * 0.89), 'kajal', hair, { closed: true, w: 0.4, p: 0.55 });
      // a little burnish where the light from the window falls on the gold
      A.stroke(A.ellipse(cx, cy, hr * 0.8, hr * 0.8, 0, 3.6, 4.4), 'gold', '#fff4c8', { w: 1.2, p: 0.6 });
    });
    A.outline(A.ellipse(cx, cy, R * 0.3, R * 0.3), 'kajal', T('kajal'), { closed: true, w: 0.7, p: 0.9 });
    A.outline(A.ellipse(cx, cy, R * 0.5, R * 0.5), 'kajal', T('kajal'), { closed: true, w: 0.95, p: 0.85 });
    A.outline(A.ellipse(cx, cy, R * 0.505 + 2.4, R * 0.505 + 2.4), 'gold', 'gold', { closed: true, w: 1.6, p: 0.9 });
    return { rays };
  };

  /* the field round the sun taken deeper: the side of an indigo stick worked round it in short curving drags, fullest at
     its rim and between its rays, thinning out into the lattice, so the gold stands up out of the dark.  field is the
     rug's field, which the strokes keep to. */
  M.sunGround = function (A, cx, cy, R, field, T, o) {
    o = o || {};
    const cols = ['#141a4a', '#1a205c', '#0f1438', A.mix('neel', 'kajal', 0.4), '#171c50'].map(c => T(c));
    const n = o.n || Math.round(R * 3.2);
    A.withMask(field, () => {
      for (let i = 0; i < n; i++) {
        const a = A.rr(0, TAU), u = Math.pow(A.rnd(), 1.45), d = R * (0.62 + 1.0 * u), span = A.rr(16, 50) / d, dir = A.chance(0.5) ? 1 : -1, bow = A.rr(-5, 5);
        const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, aa = a + dir * span * t, dd = d + bow * Math.sin(t * PI) + A.rr(-1.2, 1.2); pts.push([cx + Math.cos(aa) * dd, cy + Math.sin(aa) * dd]); }
        A.stroke(pts, 'side', A.pick(cols), { w: A.rr(8, 17), p: (0.62 - 0.44 * u) * A.rr(0.7, 1.15), flow: 0.6, tin: 0.25, tout: 0.4 });
      }
      // and a few radial drags out from between the rays, where the hand turned
      for (let i = 0; i < Math.round(n * 0.12); i++) {
        const a = A.rr(0, TAU), d0 = R * A.rr(0.9, 1.08), d1 = d0 + R * A.rr(0.18, 0.4), da = A.rr(-0.04, 0.04);
        A.stroke([[cx + Math.cos(a) * d0, cy + Math.sin(a) * d0], [cx + Math.cos(a + da) * d1, cy + Math.sin(a + da) * d1]], 'side', A.pick(cols), { w: A.rr(7, 12), p: A.rr(0.18, 0.32), flow: 0.6, tin: 0.2, tout: 0.6 });
      }
    });
  };

  /* the last touches on the sun: the brightest chalk in the picture, laid in small strokes down the lit side of the lotus
     petals and the gold rays, the side toward the window, and a few dots where the stick touched down.  rays is what
     M.sunDisc gave back: where each gold ray was laid. */
  M.sunChalk = function (A, cx, cy, R, T, o) {
    o = o || {};
    const lx = -0.72, ly = -0.69, white = T(o.white || '#fffef6'), warm = T('#fff4d0');
    const at = (a, r, v) => add([cx, cy], rot([r, v], a));
    const litOf = a => 0.5 + 0.5 * (Math.cos(a) * lx + Math.sin(a) * ly);
    const sideOf = a => ((-Math.sin(a)) * lx + Math.cos(a) * ly) > 0 ? 1 : -1;
    const np = 16, ri = R * 0.3;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < np; i++) {
      const a = (i + pass * 0.5) * TAU / np, ro = R * (pass ? 0.44 : 0.49), hw = TAU / np * ri * 0.62, lit = litOf(a), sg = sideOf(a);
      if (A.rnd() > 0.3 + 0.7 * lit) continue;
      if (!pass) {
        // the white petals: only their tips show past the rose ones
        const t0 = A.rr(0.74, 0.82);
        A.stroke([at(a, ri + (ro - ri) * t0, sg * hw * A.rr(0.3, 0.42)), at(a, ri + (ro - ri) * A.rr(0.9, 0.96), sg * hw * 0.08)], 'chalk', white, { w: A.rr(1.1, 1.7), p: A.rr(0.85, 1), tin: 0.1, tout: 0.5 });
      } else {
        const t0 = A.rr(0.16, 0.32), t1 = A.rr(0.6, 0.84), off = sg * hw * A.rr(0.5, 0.66);
        A.stroke([at(a, ri + (ro - ri) * t0, off * 0.9), at(a, ri + (ro - ri) * (t0 + t1) / 2, off * A.rr(0.95, 1.05)), at(a, ri + (ro - ri) * t1, off * 0.55)], 'chalk', white, { w: A.rr(1.2, 2) * (0.75 + 0.25 * lit), p: A.rr(0.85, 1), tin: 0.2, tout: 0.45 });
        if (A.chance(0.45 * lit)) { const q = at(a, ri + (ro - ri) * A.rr(0.4, 0.7), off * A.rr(0.1, 0.4)); A.dot(q[0], q[1], 'chalk', warm, { w: A.rr(0.9, 1.5), p: 0.92 }); }
      }
    }
    // the gold rays: a bright edge down the lit side, from near the root, and on most a second touch further out
    for (const [a, r1, hwid] of (o.rays || [])) {
      const r0 = R * 0.5, lit = litOf(a), sg = sideOf(a), ta = A.rr(0.05, 0.15), tb = A.rr(0.34, 0.5) + 0.12 * lit;
      const pts = []; for (let k = 0; k <= 4; k++) { const t = ta + (tb - ta) * k / 4; pts.push(at(a, r0 + (r1 - r0) * t, sg * hwid * (1 - t) * A.rr(0.42, 0.52))); }
      // first a pale warm scumble along the lit edge, so the chalk sits on a glow and not on bare gold
      A.stroke(pts, 'side', warm, { w: hwid * A.rr(0.55, 0.75), p: 0.3 * (0.5 + 0.5 * lit), flow: 0.6, tin: 0.15, tout: 0.6 });
      A.stroke(pts, 'chalk', white, { w: A.rr(1.3, 1.9), p: A.rr(0.82, 1) * (0.72 + 0.28 * lit), tin: 0.12, tout: 0.6 });
      if (A.chance(0.45 + 0.45 * lit)) { const t = A.rr(0.58, 0.76), t2 = t + A.rr(0.05, 0.11); A.stroke([at(a, r0 + (r1 - r0) * t, sg * hwid * (1 - t) * 0.34), at(a, r0 + (r1 - r0) * t2, sg * hwid * (1 - t2) * 0.2)], 'chalk', white, { w: A.rr(0.7, 1.05), p: 0.88, tin: 0.1, tout: 0.6 }); }
      if (A.chance(0.3)) { const q = at(a, r0 + (r1 - r0) * A.rr(0.2, 0.5), sg * hwid * 0.15); A.dot(q[0], q[1], 'chalk', warm, { w: A.rr(0.8, 1.3), p: 0.9 }); }
    }
  };

  /* the floor darkens toward the walls: lime washed there with red earth in it, laid with the side of a stick in long
     uneven drags that run along each wall.  Each wall was done in its own passes, so how far the wash comes in wanders
     along the wall, the drags show in it, and where two walls meet the passes cross and the corner goes darkest. */
  M.floorEdges = function (A, W, H, T, o) {
    o = o || {};
    const cols = (o.cols || ['#b88466', '#a87256', '#c49274']).map(c => T(c)), reach = o.reach || 110, k = o.k || 1, sd0 = A.rr(0, 50);
    const all = [[-12, -12], [W + 12, -12], [W + 12, H + 12], [-12, H + 12]];
    const fall = t => t >= 1 ? 0 : Math.pow(1 - sstep(t), 1.7);
    cols.forEach((c, n) => {
      const sd = sd0 + n * 11.3, len = 55 + 25 * n, wid = 3.6 + 1.8 * n, p = (o.p || 0.36) * k * [1, 0.7, 0.5][n];
      const dh = M.floorDrag(A, 0.045 - 0.045 * n, len, wid, sd, 0.8), dv = M.floorDrag(A, PI / 2 + 0.04 - 0.04 * n, len, wid, sd + 5, 0.8);
      // the stick only touches the tops of the grain
      const tooth = (x, y) => clamp(0.25 + 1.4 * A.noise2(x / 1.25 + sd * 3, y / 1.25 - sd, 2), 0, 1.3);
      // how far in this pass came, wandering along the wall; a later pass reaches less far
      const rch = (s, w) => reach * (1 - 0.18 * n) * (0.55 + 0.9 * A.noise2(s / (130 + 40 * n) + sd + w * 7.7, w * 3.1 + n, 3));
      const blot = (x, y) => 0.6 + 0.8 * A.fbm(x / 70 + sd, y / 70 - sd, 3, 5);
      M.floorWash(A, all, c, (x, y) => {
        if (Math.min(x, y, W - x, H - y) > reach * 1.46) return 0;
        const hz = Math.max(fall(y / rch(x, 0)), fall((H - y) / rch(x, 1))), vt = Math.max(fall(x / rch(y, 2)), fall((W - x) / rch(y, 3)));
        if (hz <= 0 && vt <= 0) return 0;
        return p * blot(x, y) * tooth(x, y) * (hz * Math.max(0, dh(x, y)) + vt * Math.max(0, dv(x, y)));
      });
    });
  };

  /* ================================================================== THE STILL LIFE */
  // a soft shadow under a thing, thrown away from the light (dx, dy)
  function shadowOf(A, poly, T, dx, dy, p) {
    A.fill(poly.map(q => [q[0] + dx, q[1] + dy]), 'shade', T('umber'), { w: 4, p: p || 0.4, passes: 2, gap: 0.5 });
    A.blend(A.roughen(poly.map(q => [q[0] + dx * 1.2, q[1] + dy * 1.2]), 2, 20, true), { r: 5, k: 0.45 });
  }
  M.floorShadow = shadowOf;
  // a shadow laid as a soft glaze, for a thing that sits over a busy pattern: nothing of the pattern is dragged about
  function softShadow(A, poly, T, dx, dy, k, blur) {
    M.floorUnion(A, [poly.map(q => [q[0] + dx, q[1] + dy])], T(A.mix('umber', 'sepia', 0.35)), () => k, (blur || 4) * A.S, 'mul');
  }
  M.floorSoftShadow = softShadow;

  // a window seen in still water: a pale arch with its jali, softened, and broken into bands where the water moves
  function windowIn(A, cx, cy, s, T, pane, water, pp) {
    const hw = s * 0.42, top = cy - s * 0.62, bot = cy + s * 0.55, sp = cy - s * 0.22;
    // the arch wavers, as anything seen in water does
    const wv = () => A.rr(-1, 1) * s * 0.035;
    const sh = A.spline([[cx - hw + wv(), bot], [cx - hw + wv(), sp], [cx - hw * 0.72 + wv(), sp - s * 0.24], [cx + wv(), top], [cx + hw * 0.72 + wv(), sp - s * 0.24], [cx + hw + wv(), sp], [cx + hw + wv(), bot]], true, 0.6);
    A.fill(sh, 'side', T(pane), { w: s * 0.35, p: pp || 0.55, reach: 1.2, passes: 2, ang: 1.45 });
    A.withMask(sh, () => {
      const bar = (a, b, w, p) => { const pts = []; for (let t = 0; t <= 1.001; t += 0.125) pts.push([a[0] + (b[0] - a[0]) * t + Math.sin(t * 9 + a[1]) * s * 0.025, a[1] + (b[1] - a[1]) * t + Math.sin(t * 7 + a[0]) * s * 0.02]); A.stroke(press(A, pts, 0.3, 1.5), 'chalk', water, { w, p }); };
      for (let i = 1; i < 3; i++) { const xx = cx - hw + i * hw * 2 / 3; bar([xx, top], [xx + A.rr(-0.6, 0.6), bot], s * 0.07, 0.45); }
      for (let j = 1; j < 4; j++) { const yy = sp + (bot - sp) * j / 4 - s * 0.12; bar([cx - hw, yy], [cx + hw, yy + A.rr(-0.5, 0.5)], s * 0.06, 0.4); }
      for (let j = 0; j < 3; j++) { const yy = A.rr(top + s * 0.25, bot - s * 0.1); A.stroke([[cx - hw * 1.2, yy], [cx + hw * 1.2, yy + A.rr(-0.5, 0.5)]], 'side', water, { w: s * 0.09, p: 0.3 }); }
    });
    // a finger drawn across it, the way the water moves: the lattice goes soft and the pale runs a little into the dark
    A.blend(sh, { r: Math.max(1.3, s * 0.09), k: 0.42, ang: A.rr(-0.2, 0.2) });
    for (let j = 0; j < 3; j++) { const yy = A.rr(top + s * 0.1, bot), dir = A.chance(0.5) ? 1 : -1; A.smudge([[cx - dir * hw * 1.1, yy], [cx, yy + A.rr(-1, 1) * s * 0.05], [cx + dir * hw * 1.3, yy + A.rr(-1, 1) * s * 0.08]], { r: s * A.rr(0.06, 0.1), k: 0.5 }); }
  }
  M.floorWindowIn = windowIn;

  // a mussel shell used as a pigment dish; (x, y) its middle, s its length
  // the outline of an oyster half-shell: narrow at the hinge (u = -0.5), broad and uneven at the lip
  function shellOutline(A, x, y, s, ang, k) {
    k = k || 1;
    const P = (u, v) => add([x, y], rot([u * s * k, v * s * k], ang));
    const j = () => A.rr(-0.025, 0.025);
    return A.spline([P(-0.52, 0.02), P(-0.42, -0.14 + j()), P(-0.2, -0.27 + j()), P(0.08, -0.32 + j()), P(0.32, -0.27 + j()), P(0.48, -0.12 + j()), P(0.5, 0.06 + j()), P(0.4, 0.22 + j()), P(0.16, 0.31 + j()), P(-0.12, 0.27 + j()), P(-0.36, 0.16 + j())], true, 1);
  }
  // an oyster shell used as a pigment dish; (x, y) its middle, s its length, the hinge toward -ang
  M.pigmentShell = function (A, x, y, s, ang, pig, T, o) {
    o = o || {};
    const P = (u, v) => add([x, y], rot([u * s, v * s], ang));
    const sh = A.roughen(shellOutline(A, x, y, s, ang), s * 0.014, s * 0.22, true);
    shadowOf(A, sh, T, 3, 4.5, 0.42);
    // the outer lip, grey-brown and flaky, seen as a thin rim round the bowl of the shell
    A.fill(sh, 'pastel', T(A.mix('stone', 'umber', 0.3)), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    const inner = A.roughen(shellOutline(A, x + Math.cos(ang) * s * 0.01, y + Math.sin(ang) * s * 0.01, s, ang, 0.86), s * 0.01, s * 0.2, true);
    A.fill(inner, 'pastel', T('#f4ece4'), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ang + 0.4 });
    // the nacre: lilac, peach and a cold blue, laid in soft and rubbed
    A.withMask(inner, () => {
      A.fill(A.ellipse(P(-0.12, -0.08)[0], P(-0.12, -0.08)[1], s * 0.3, s * 0.16, ang), 'side', T('lilac'), { w: 8, p: 0.4 });
      A.fill(A.ellipse(P(0.18, 0.1)[0], P(0.18, 0.1)[1], s * 0.24, s * 0.12, ang), 'side', T('peach'), { w: 8, p: 0.36 });
      A.fill(A.ellipse(P(0.1, -0.16)[0], P(0.1, -0.16)[1], s * 0.2, s * 0.08, ang), 'side', T('ice'), { w: 6, p: 0.4 });
      A.blend(inner, { r: 3, k: 0.45 });
      // growth lines, fanning from the hinge
      for (let k = 1; k < 6; k++) { const hp = P(-0.5, 0.02); A.stroke(A.ellipse(hp[0], hp[1], s * 0.2 * k, s * 0.13 * k, ang, -1.2, 1.2), 'chalk', T(k % 2 ? 'stone' : 'lilac'), { w: 0.5, p: 0.45 }); }
    });
    // the pigment: a cake in the hollow, dried darker at its rim, swept by the brush
    const c = T(pig), dark = A.mix(c, 'kajal', 0.28), light = A.mix(c, 'khadi', 0.35);
    const pc = A.roughen(A.ellipse(P(0.06, 0.02)[0], P(0.06, 0.02)[1], s * 0.3, s * 0.18, ang + A.rr(-0.25, 0.25)), s * 0.03, s * 0.16, true);
    A.fill(pc, 'pastel', c, { w: 2.4, p: 1, reach: 1.7, passes: 2, gap: 0.38, ang: ang + 0.5 });
    A.withMask(pc, () => {
      A.outline(pc, 'side', dark, { closed: true, w: s * 0.06, p: 0.6 });
      const a0 = A.rr(0, TAU), m = P(0.06, 0.02);
      A.stroke(A.ellipse(m[0], m[1], s * 0.15, s * 0.08, ang, a0, a0 + 2.8), 'chalk', light, { w: s * 0.05, p: 0.6 });
      A.smudge(A.ellipse(m[0], m[1], s * 0.14, s * 0.07, ang, a0, a0 + 2.4), { r: 2.4, k: 0.6 });
      for (let k = 0; k < 10; k++) A.dot(m[0] + A.rr(-s * 0.22, s * 0.22), m[1] + A.rr(-s * 0.12, s * 0.12), 'chalk', A.chance(0.5) ? light : dark, { w: A.rr(0.8, 1.8), p: 0.7 });
      if (A.chance(0.6)) crack(A, m[0] - s * 0.1, m[1], s * 0.24, ang + A.rr(-0.6, 0.6), dark, 1);
    });
    A.outline(pc, 'kajal', A.mix(c, 'kajal', 0.55), { closed: true, w: 0.5, p: 0.5, again: 0 });
    // a wipe of the colour on the nacre, where the brush was pressed to a point
    { const a = P(0.3, -0.12), b = P(0.42, -0.04); A.stroke([a, b], 'chalk', c, { w: s * 0.04, p: 0.75, tin: 0.1, tout: 0.6 }); }
    A.outline(inner, 'kajal', T(A.mix('stone', 'sepia', 0.5)), { closed: true, w: 0.5, p: 0.5, again: 0 });
    A.outline(sh, 'kajal', T('sepia'), { closed: true, w: 0.75, p: 0.7 });
    // ridges on the lip and the knot of the hinge
    const rim = A.resample(sh, s * 0.06, true);
    rim.forEach((q, i) => { if (i % 2) return; const nx = q[0] - x, ny = q[1] - y, l = Math.hypot(nx, ny) || 1; A.stroke([q, [q[0] - nx / l * s * 0.05, q[1] - ny / l * s * 0.05]], 'kajal', T('umber'), { w: 0.4, p: 0.45 }); });
    const hp = P(-0.5, 0.02); A.dot(hp[0], hp[1], 'chalk', T('umber'), { w: s * 0.06, p: 0.8, ang });
    if (o.drip) for (let k = 0; k < 3; k++) { const q = P(A.rr(0.55, 0.85), A.rr(-0.2, 0.3)); A.dot(q[0], q[1], 'chalk', c, { w: A.rr(1.4, 3), p: 0.8 }); }
  };

  // a shell knocked over, and the gold powder run out of it in a fan
  M.goldSpill = function (A, x, y, s, ang, T, pig) {
    // turned over, the shell shows its rough outer back: grey, brown and chalky, in ridged layers
    const sh = A.roughen(shellOutline(A, x, y, s, ang), s * 0.02, s * 0.2, true);
    shadowOf(A, sh, T, 3, 4.5, 0.45);
    A.fill(sh, 'pastel', T(A.mix('stone', 'grey', 0.25)), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(sh, () => {
      for (let k = 1; k < 8; k++) A.stroke(A.roughen(A.ellipse(x - Math.cos(ang) * s * 0.5, y - Math.sin(ang) * s * 0.5, s * 0.14 * k, s * 0.09 * k, ang, -1.2, 1.2), 0.5, 4, false), 'chalk', T(k % 2 ? 'khadi' : A.mix('stone', 'umber', 0.35)), { w: 1.1, p: 0.65 });
      A.fill(A.ellipse(x + Math.cos(ang) * s * 0.1, y + Math.sin(ang) * s * 0.1 - s * 0.08, s * 0.3, s * 0.12, ang), 'side', T('khadi'), { w: 7, p: 0.4 });
      A.fill(A.ellipse(x + Math.cos(ang) * s * 0.1, y + Math.sin(ang) * s * 0.1 + s * 0.12, s * 0.34, s * 0.1, ang), 'side', T('umber'), { w: 7, p: 0.3 });
    });
    A.outline(sh, 'kajal', T('sepia'), { closed: true, w: 0.8, p: 0.7 });
    // the mouth, and the fan of gold beyond it
    const mo = [x + Math.cos(ang) * s * 0.46, y + Math.sin(ang) * s * 0.46];
    const heap = A.roughen(A.ellipse(mo[0] + Math.cos(ang) * s * 0.18, mo[1] + Math.sin(ang) * s * 0.18, s * 0.26, s * 0.2, ang), s * 0.04, s * 0.2, true);
    if (pig) {
      // a cake of colour knocked loose and broken, its powder fanned out and pressed into the floor where it was trodden
      const c = T(pig), dk = A.mix(c, 'kajal', 0.25), lt = A.mix(c, 'khadi', 0.3), hc = [mo[0] + Math.cos(ang) * s * 0.18, mo[1] + Math.sin(ang) * s * 0.18];
      const fan = A.roughen(A.ellipse(mo[0] + Math.cos(ang) * s * 0.62, mo[1] + Math.sin(ang) * s * 0.62, s * 0.58, s * 0.27, ang), s * 0.06, s * 0.3, true);
      A.fill(fan, 'side', c, { w: 5, p: 0.4, ang });
      A.smudge([[mo[0] + Math.cos(ang) * s * 0.2, mo[1] + Math.sin(ang) * s * 0.2], [mo[0] + Math.cos(ang - 0.1) * s * 0.95, mo[1] + Math.sin(ang - 0.1) * s * 0.95]], { r: s * 0.08, k: 0.45 });
      // the cake itself broke as it fell: a few chunks, the largest still near the mouth
      const nb = [[0, 0, 0.11, 0.08], [0.17, -0.07, 0.065, 0.05], [0.12, 0.1, 0.05, 0.04], [0.3, 0.02, 0.04, 0.03]];
      for (const b of nb) {
        const bx = hc[0] + Math.cos(ang) * s * b[0] - Math.sin(ang) * s * b[1], by = hc[1] + Math.sin(ang) * s * b[0] + Math.cos(ang) * s * b[1];
        const ch = A.roughen(A.ellipse(bx, by, s * b[2], s * b[3], ang + A.rr(-0.8, 0.8)), s * 0.015, s * 0.05, true);
        A.fill(ch, 'pastel', c, { w: 1.6, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
        A.withMask(ch, () => { A.dot(bx - s * b[2] * 0.3, by - s * b[3] * 0.3, 'chalk', lt, { w: Math.max(0.8, s * b[2] * 0.5), p: 0.6 }); A.dot(bx + s * b[2] * 0.35, by + s * b[3] * 0.3, 'chalk', dk, { w: Math.max(0.6, s * b[2] * 0.4), p: 0.55 }); });
        A.outline(ch, 'kajal', A.mix(c, 'kajal', 0.5), { closed: true, w: 0.4, p: 0.4, again: 0 });
      }
      for (let i = 0; i < 460; i++) { const a = ang + A.gauss() * 0.38, d = s * (0.32 + Math.pow(A.rnd(), 1.7) * 1.15); A.dot(mo[0] + Math.cos(a) * d, mo[1] + Math.sin(a) * d, 'chalk', A.pick([c, c, dk, lt]), { w: A.rr(0.5, d < s * 0.7 ? 2.2 : 1.3), p: A.rr(0.5, 0.9), len: A.rr(0.05, 0.5) }); }
      A.smudge([[mo[0] + Math.cos(ang) * s * 0.3, mo[1] + Math.sin(ang) * s * 0.3], [mo[0] + Math.cos(ang + 0.15) * s * 1.1, mo[1] + Math.sin(ang + 0.15) * s * 1.1]], { r: s * 0.06, k: 0.4 });
      return;
    }
    A.fill(heap, 'pastel', T('ochre'), { w: 2.4, p: 0.9, reach: 1.5, passes: 2, gap: 0.45 });
    A.fill(heap, 'gold', 'gold', { w: 2.2, p: 1, passes: 2, gap: 0.5 });
    for (let i = 0; i < 520; i++) {
      const a = ang + A.gauss() * 0.42, d = s * (0.3 + Math.pow(A.rnd(), 1.8) * 1.9);
      A.dot(mo[0] + Math.cos(a) * d, mo[1] + Math.sin(a) * d, 'gold', 'gold', { w: A.rr(0.6, d < s * 0.8 ? 2.2 : 1.4), len: A.rr(0.05, 0.4) });
    }
    for (let i = 0; i < 40; i++) { const a = ang + A.gauss() * 0.5, d = s * A.rr(0.3, 1.2); A.dot(mo[0] + Math.cos(a) * d, mo[1] + Math.sin(a) * d, 'chalk', T('ochre'), { w: A.rr(0.8, 1.6), p: 0.5 }); }
  };

  // a brass bowl of water; r its radius
  M.brassBowl = function (A, x, y, r, T, o) {
    o = o || {};
    // beaten by hand and drawn by hand: no ring of it is quite round, and none quite shares a middle with the next
    const ring = (k, w, a0, a1) => handRing(A, x, y, r * k, r * k, w, a0, a1);
    const rim = A.roughen(ring(1, 0.012), r * 0.006, r * 0.3, true);
    // its shadow laid as a glaze, so the rug's border under it is not dragged about
    softShadow(A, ring(1.0, 0.012), T, r * 0.08, r * 0.11, 0.42, r * 0.06);
    A.fill(rim, 'pastel', T('ochre'), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    // the lip: thick, rolled over, bright toward the window, brown away from it
    A.withMask(rim, () => {
      A.stroke(press(A, ring(0.905, 0.015, 2.6, 5.4), 0.55), 'side', T('haldi'), { w: r * 0.18, p: 0.75 });
      A.stroke(press(A, ring(0.905, 0.015, 5.6, 8.6), 0.5), 'side', T(A.mix('umber', 'ochre', 0.35)), { w: r * 0.18, p: 0.65 });
      for (let k = 0; k < 3; k++) A.stroke(press(A, ring(0.86 + k * 0.04, 0.012, A.rr(2.8, 3.4), A.rr(4.4, 5.1)), 0.3, 4), 'gold', 'gold', { w: A.rr(1.4, 2.4), p: 0.9 });
      /* beaten with a round hammer: the rim is a field of small dents, none the same size.  A dent is a hollow, so it is
         in shade on the side toward the window and catches the light on its far side */
      for (let i = 0; i < 64; i++) {
        const a = A.rr(0, TAU), rk = r * A.rr(0.84, 0.975), fs = r * A.rr(0.03, 0.055), c = [x + Math.cos(a) * rk, y + Math.sin(a) * rk], L0 = 3.93 + A.rr(-0.2, 0.2);
        A.stroke(A.ellipse(c[0], c[1], fs, fs * 0.8, a, L0 - 1.1, L0 + 1.1), 'chalk', T(A.mix('umber', 'ochre', 0.3)), { w: fs * 0.45, p: A.rr(0.22, 0.42), tin: 0.3, tout: 0.3 });
        A.stroke(A.ellipse(c[0], c[1], fs * 0.85, fs * 0.7, a, L0 + PI - 0.9, L0 + PI + 0.9), 'chalk', T(A.mix('haldi', 'cream', 0.5)), { w: fs * 0.38, p: A.rr(0.28, 0.55), tin: 0.3, tout: 0.3 });
      }
      // the rolled edge of the lip, a fine line inside the outer one
      A.stroke(press(A, ring(0.965, 0.01, 0.3, 2.6), 0.2, 4), 'kajal', T(A.mix('umber', 'ochre', 0.4)), { w: 0.6, p: 0.45 });
      /* the rim incised by the brazier with a fine point: a line round it, a running zigzag, and a tick between each turn.
         Cut lines hold dark in their grooves and catch a hair of light on their far lip */
      { const cut = T(A.mix('sepia', 'umber', 0.4)), shine = T(A.mix('haldi', 'cream', 0.6));
        A.stroke(press(A, ring(0.875, 0.01), 0.35, 4), 'kajal', cut, { w: 0.55, p: 0.62, closed: true });
        const nZ = 44, zz = [];
        for (let i = 0; i <= nZ * 2; i++) { const a = i * PI / nZ + A.rr(-0.012, 0.012), rk = r * (i % 2 ? 0.94 : 0.885) * A.rr(0.995, 1.005); zz.push([x + Math.cos(a) * rk, y + Math.sin(a) * rk]); }
        for (let s = 0; s < zz.length - 1; s += 9) { const seg = zz.slice(s, Math.min(zz.length, s + 10)); A.stroke(press(A, seg, 0.4, 3), 'kajal', cut, { w: 0.5, p: 0.6, tin: 0.05, tout: 0.1 }); A.stroke(seg.map(q => [q[0] + 0.5, q[1] + 0.5]), 'chalk', shine, { w: 0.4, p: 0.3 }); }
        for (let i = 0; i < nZ; i++) { const a = (i + 0.5) * TAU / nZ, r0 = r * 0.915, r1 = r * 0.935; A.stroke([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], 'kajal', cut, { w: 0.45, p: 0.5 }); }
      }
      // light thrown back off the lip toward the window: two short pulls of the chalk that do not quite join,
      // then one end dragged with a finger, so it is a gleam and not a cut-out
      for (let k = 0; k < 2; k++) {
        const b0 = 3.45 + k * 0.55 + A.rr(-0.05, 0.06), b1 = b0 + A.rr(0.3, 0.42), rk = r * A.rr(0.955, 0.972);
        const pts = []; for (let t = 0; t <= 1.001; t += 0.1) { const a = b0 + (b1 - b0) * t; pts.push([x + Math.cos(a) * rk, y + Math.sin(a) * rk, 0.35 + 0.65 * Math.sin(PI * t)]); }
        A.stroke(pts, 'chalk', T(k === 1 ? '#fff6e0' : '#fff0c8'), { w: r * A.rr(0.04, 0.055), p: A.rr(0.5, 0.65), tin: 0.2, tout: 0.35 });
      }
      A.smudge([[x + Math.cos(4.6) * r * 0.96, y + Math.sin(4.6) * r * 0.96], [x + Math.cos(5.0) * r * 0.94, y + Math.sin(5.0) * r * 0.94]], { r: r * 0.05, k: 0.5 });
      A.dot(x + Math.cos(4.0) * r * 0.945, y + Math.sin(4.0) * r * 0.945, 'chalk', T('#fffaf0'), { w: 2, p: 0.9, len: 0.8, ang: 0.6 });
    });
    const wall = ring(0.82, 0.014);
    A.fill(wall, 'pastel', T(A.mix('ochre', 'umber', 0.3)), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    // the inside wall: in shade on the side toward the window, lit on the far side
    A.withMask(wall, () => {
      A.stroke(press(A, ring(0.79, 0.02, 2.4, 5.2), 0.5), 'side', T(A.mix('umber', 'sepia', 0.3)), { w: r * 0.12, p: 0.6 });
      A.stroke(press(A, ring(0.79, 0.02, 5.8, 8.2), 0.45), 'side', T('haldi'), { w: r * 0.1, p: 0.55 });
      A.blend(wall, { r: r * 0.045, k: 0.3 });
    });
    // the inner rim: a thin bright edge where the lip turns down into the bowl on the lit side, a dark one on the near side
    A.stroke(press(A, ring(0.816, 0.012, 5.5, 8.7), 0.2, 3), 'chalk', T(A.mix('haldi', 'cream', 0.55)), { w: 1.3, p: 0.85, tin: 0.3, tout: 0.3 });
    A.stroke(press(A, ring(0.812, 0.012, 2.4, 5.2), 0.3, 3), 'kajal', T(A.mix('umber', 'sepia', 0.5)), { w: 1, p: 0.6, tin: 0.3, tout: 0.3 });
    // the water
    const wr = r * 0.75, water = handRing(A, x + r * 0.02, y + r * 0.03, wr, wr, 0.016);
    // still water in brass: a deep olive green, darker under the near wall
    const wC = T(A.mix(A.mix('teal', 'olive', 0.45), 'bottle', 0.3));
    A.fill(water, 'side', wC, { w: 12, p: 0.95, reach: 1.3, passes: 2 });
    A.withMask(water, () => {
      A.fill(A.ellipse(x + r * 0.2, y + r * 0.25, wr * 0.8, wr * 0.65), 'side', T(A.mix('teal', 'bottle', 0.4)), { w: 12, p: 0.45 });
      // the brass floor of the bowl, seen through the water
      A.fill(A.ellipse(x + r * 0.06, y + r * 0.08, wr * 0.45, wr * 0.45), 'side', T(A.mix('olive', 'ochre', 0.45)), { w: 10, p: 0.26 });
      A.blend(water, { r: r * 0.05, k: 0.4 });
      // threads of red where a brush was rinsed, already unravelling
      // (kept small and off in the far quarter, wound tight, so nothing in the bowl lines up into a face)
      for (let j = 0; j < 2; j++) {
        const sw = [], b0 = A.rr(0, TAU), ph = A.rr(0, TAU), turn = A.rr(3.6, 4.6);
        for (let k = 0; k < 22; k++) { const t = k / 21, a = b0 + t * turn, rad = wr * (0.04 + 0.17 * t) + Math.sin(t * 9 + ph) * wr * 0.02; sw.push([x + wr * 0.36 + Math.cos(a) * rad, y + wr * 0.4 + Math.sin(a) * rad * 0.75, 1 - 0.6 * t]); }
        A.stroke(sw, 'chalk', T(A.mix('hingul', 'rose', 0.3)), { w: A.rr(0.6, 1.1), p: A.rr(0.22, 0.32), tin: 0.15, tout: 0.7 });
      }
      // the window, lying in the water: a soft pale square, its bars only guessed at, broken across where the water moves
      { const cx = x - wr * 0.3, cy = y - wr * 0.3, s = wr * 0.2, a = 0.1;
        const sq = A.roughen([[-s, -s], [s, -s], [s, s], [-s, s]].map(p => add([cx, cy], rot(p, a))), s * 0.06, s, true);
        A.fill(sq, 'side', T(A.mix(o.pane || 'khadi', 'sky', 0.15)), { w: s * 0.5, p: 0.6, reach: 1.2, passes: 2, ang: 1.5 });
        A.withMask(sq, () => { for (const t of [-0.05, 0.08]) A.stroke([add([cx, cy], rot([t * s * 2, -s * 1.1], a)), add([cx, cy], rot([t * s * 2, s * 1.1], a))], 'side', wC, { w: s * 0.16, p: 0.35 }); A.stroke([add([cx, cy], rot([-s * 1.1, 0.05 * s], a)), add([cx, cy], rot([s * 1.1, 0.05 * s], a))], 'side', wC, { w: s * 0.14, p: 0.3 }); });
        A.blend(A.roughen(A.ellipse(cx, cy, s * 1.5, s * 1.5), 1, 6, true), { r: s * 0.2, k: 0.45 }); }
      for (let j = 0; j < 2; j++) { const yy = y - wr * (0.42 - j * 0.2) + A.rr(-1, 1), dir = j ? 1 : -1; A.smudge([[x - wr * 0.34 - dir * wr * 0.3, yy], [x - wr * 0.34, yy + A.rr(-1, 1)], [x - wr * 0.34 + dir * wr * 0.32, yy + A.rr(-1.5, 1.5)]], { r: wr * 0.05, k: 0.55 }); }
      A.smudge([[x - wr * 0.5, y - wr * 0.1], [x - wr * 0.1, y - wr * 0.5]], { r: wr * 0.06, k: 0.35 });
      // a skin on the water: a faint pale film dragged one way by a breath of air, a soft glint where it holds the light
      { const sd = A.rr(0, 30), ca = Math.cos(-0.57), sa = Math.sin(-0.57);
        M.floorWash(A, water, T(A.mix('khadi', 'ice', 0.4)), (px, py) => {
          const dx = px - x, dy = py - y, al = dx * ca + dy * sa, ac = -dx * sa + dy * ca, u = (dx * 0.74 + dy * 0.67) / wr;
          return 0.12 * sstep((0.35 - u) / 0.9) * (0.45 + 0.9 * A.noise2(al / 16 + sd, ac / 3.2, 4));
        });
        // and where it holds the light, a soft glint: a breath of pale with a small hard heart
        const gx = x + wr * 0.12, gy = y - wr * 0.5;
        M.floorWash(A, A.ellipse(gx, gy, wr * 0.3, wr * 0.13, -0.42), T('#fffaf0'), (px, py) => { const dx = px - gx, dy = py - gy, a2 = (dx * 0.91 - dy * 0.41) / (wr * 0.3), b2 = (dx * 0.41 + dy * 0.91) / (wr * 0.13); return 0.3 * (1 - sstep(Math.hypot(a2, b2))); });
        A.stroke([[gx - wr * 0.1, gy + wr * 0.04], [gx + wr * 0.02, gy - wr * 0.01], [gx + wr * 0.09, gy - wr * 0.04]], 'chalk', T('#fffdf6'), { w: 1.3, p: 0.6, tin: 0.4, tout: 0.5 }); }
      // two rings going out on it, faint and broken
      for (const rk of [0.36, 0.6]) for (let s2 = 0; s2 < 3; s2++) { const a0 = A.rr(0, TAU), da = A.rr(0.7, 1.4); A.stroke(press(A, handRing(A, x + wr * 0.1, y + wr * 0.06, wr * rk, wr * rk * 0.96, 0.02, a0, a0 + da), 0.2, 3), 'chalk', T(rk < 0.5 ? 'khadi' : 'ice'), { w: 1.15, p: 0.5, tin: 0.4, tout: 0.4 }); }
      // and a single warm point of the rug's gold sun in it, on the side toward the sun, broken by the ripple
      { const gx = x - wr * 0.5, gy = y + wr * 0.36, gc = T(A.mix('haldi', 'saffron', 0.35));
        M.floorWash(A, A.ellipse(gx, gy, wr * 0.16, wr * 0.1, 0.15), gc, (px, py) => 0.6 * (1 - sstep(Math.hypot((px - gx) / (wr * 0.16), (py - gy) / (wr * 0.1)))));
        A.dot(gx, gy, 'chalk', T(A.mix('cream', 'haldi', 0.4)), { w: 2.6, p: 0.9, len: 1.3, ang: 0.15 });
        A.dot(gx + 4, gy + 0.9, 'chalk', gc, { w: 1.5, p: 0.8, len: 1.6, ang: 0.15 }); }
    });
    A.outline(press(A, rim, 0.6, 6), 'kajal', T(A.mix('sepia', 'kajal', 0.5)), { closed: true, w: 1.35, p: 0.9 });
    A.outline(press(A, wall, 0.45, 6), 'kajal', T('sepia'), { closed: true, w: 0.9, p: 0.75 });
    A.outline(press(A, water, 0.3, 5), 'kajal', T(A.mix('sepia', 'bottle', 0.4)), { closed: true, w: 0.7, p: 0.55, again: 0 });
  };

  /* a clay matka seen from straight above, standing at the edge of the floor: the round of its belly turning away into
     shade, a band of white painted round its shoulder, the thick rolled lip, and the open mouth going down into the dark */
  M.waterPot = function (A, x, y, r, T, o) {
    o = o || {};
    const clay = T(A.mix('geru', 'brick', 0.3)), clayL = T(A.mix(A.mix('geru', 'peach', 0.6), 'saffron', 0.12)), clayD = T(A.mix('brick', 'umber', 0.6)), clayDD = T(A.mix('umber', 'kajal', 0.45));
    const white = T('#f4ecda'), whiteS = T(A.mix('#f4ecda', 'geru', 0.4));
    // thrown on a wheel and drawn by hand: every ring of it a little out of true, and off the middle of the last
    const ring = (k, w, a0, a1, ky) => handRing(A, x, y, r * k, r * k * (ky || 0.99), w, a0, a1);
    // the light is from the window at the upper left: lit there, the far round of the belly in its own shade
    const lit = (px, py) => ((px - x) * -0.72 + (py - y) * -0.69) / r;
    const belly = A.roughen(ring(1, 0.01), r * 0.005, r * 0.3, true);
    softShadow(A, ring(1, 0.01), T, r * 0.08, r * 0.1, 0.5, r * 0.08);
    A.fill(belly, 'pastel', clay, { w: 5, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(belly, () => {
      const sd = A.rr(0, 40), drag = M.floorDrag(A, -0.8, 30, 3, sd, 0.35);
      // a sphere: the side of the stick laid pale round the lit shoulder, deepening across the far round to its rim
      M.floorWash(A, belly, clayL, (px, py) => { const v = lit(px, py), d = Math.hypot(px - x, py - y) / r; return 0.62 * sstep((v - 0.05) / 0.7) * (1 - sstep((d - 0.7) / 0.3)) * drag(px, py); });
      M.floorWash(A, belly, clayD, (px, py) => 0.7 * sstep((-lit(px, py) - 0.05) / 0.75) * drag(px + 40, py));
      M.floorWash(A, belly, clayDD, (px, py) => { const v = lit(px, py), d = Math.hypot(px - x, py - y) / r; return 0.5 * sstep((-v - 0.35) / 0.6) * sstep((d - 0.72) / 0.28); });
      // then broad straight sweeps of the side of the stick across the shoulder, slanting along the edge of the shade
      { const lt = [-0.72, -0.69], tn = [0.69, -0.72];
        for (let k = 0; k < 34; k++) {
          const q = A.rr(-1, 1), c0 = [x + lt[0] * q * r, y + lt[1] * q * r], half = r * Math.sqrt(Math.max(0.05, 1 - q * q)) * A.rr(0.7, 1.02);
          const p0 = [c0[0] - tn[0] * half + A.rr(-3, 3), c0[1] - tn[1] * half + A.rr(-3, 3)], p1 = [c0[0] + tn[0] * half + A.rr(-3, 3), c0[1] + tn[1] * half + A.rr(-3, 3)];
          if (q > -0.1 && q < 0.22) continue;
          const isLit = q >= 0.22, pr = isLit ? A.rr(0.18, 0.34) * Math.min(1, q * 1.3) : A.rr(0.2, 0.36) * Math.min(1, -q * 1.5);
          A.stroke([p0, [(p0[0] + p1[0]) / 2 + A.rr(-2, 2), (p0[1] + p1[1]) / 2 + A.rr(-2, 2)], p1], 'side', isLit ? clayL : clayD, { w: r * A.rr(0.07, 0.13), p: pr, tin: 0.15, tout: 0.25 });
        }
      }
      A.blend(belly, { r: r * 0.03, k: 0.25, ang: -0.8 });
      /* the band round the shoulder, painted in white with a loaded brush: a line, a row of dots, a row of hanging loops,
         a second line.  Each line laid in a few goes, so it breaks and doubles where the hand lifted; and the white
         sinks into the clay on the side in shade, the way paint on a round thing does */
      const wAt = (px, py) => A.mix(white, whiteS, sstep((-lit(px, py) - 0.1) / 0.8));
      const brokenRing = (f, w, pr) => {
        const rg = ring(f, 0.012), n = rg.length; let i = A.ri(0, 8);
        while (i < n + 3) { const len = Math.floor(n * A.rr(0.14, 0.28)), seg = []; for (let j = 0; j <= len; j++) seg.push(rg[(i + j) % n]); const m = seg[Math.floor(seg.length / 2)]; A.stroke(press(A, seg, 0.4, 5), 'chalk', wAt(m[0], m[1]), { w: w * A.rr(0.85, 1.15), p: pr, wob: 0.35, tin: 0.12, tout: 0.2 }); i += len + Math.floor(n * A.rr(-0.012, 0.03)); }
      };
      brokenRing(0.64, 1.7, 0.82);
      brokenRing(0.86, 1.9, 0.86);
      { const nD = 46; for (let i = 0; i < nD; i++) { const a = i * TAU / nD + A.rr(-0.02, 0.02), rk = r * A.rr(0.695, 0.71), q = [x + Math.cos(a) * rk, y + Math.sin(a) * rk]; A.dot(q[0], q[1], 'chalk', wAt(q[0], q[1]), { w: A.rr(2, 2.8), p: A.rr(0.75, 0.95), len: A.rr(0, 0.4), ang: a }); } }
      // the loops hang from the outer line toward the lip: each a small U drawn in one turn of the brush
      { const nL = 30; for (let i = 0; i < nL; i++) {
        const a = i * TAU / nL + A.rr(-0.015, 0.015), da = TAU / nL * 0.5, pts = [];
        for (let t = 0; t <= 1.001; t += 0.125) { const aa = a - da + 2 * da * t, rk = r * (0.855 - 0.09 * Math.sin(PI * t)); pts.push([x + Math.cos(aa) * rk, y + Math.sin(aa) * rk, 0.6 + 0.4 * Math.sin(PI * t)]); }
        const m = pts[4]; A.stroke(pts, 'chalk', wAt(m[0], m[1]), { w: A.rr(1.2, 1.6), p: A.rr(0.7, 0.9), tin: 0.15, tout: 0.25 });
        A.dot(x + Math.cos(a) * r * 0.785, y + Math.sin(a) * r * 0.785, 'chalk', wAt(m[0], m[1]), { w: 1.6, p: 0.8 });
      } }
      // wear: the paint rubbed thin where hands lift the pot
      for (let k = 0; k < 5; k++) { const a = A.rr(0, TAU); A.smudge(A.ellipse(x, y, r * A.rr(0.68, 0.84), r * A.rr(0.68, 0.84), 0, a, a + A.rr(0.2, 0.35)), { r: 2.4, k: 0.5 }); }
      // the shadow the lip throws on the shoulder, a crescent away from the window
      M.floorWash(A, belly, clayDD, (px, py) => { const cx = x + r * 0.07, cy = y + r * 0.07, d = Math.hypot(px - cx, py - cy) / r; return 0.55 * (1 - sstep((d - 0.5) / 0.12)) * sstep((-lit(px, py) + 0.15) / 0.5); });
    });
    A.outline(press(A, belly, 0.5, 6), 'kajal', T(A.mix('sepia', 'kajal', 0.4)), { closed: true, w: 1.25, p: 0.85 });
    // the lip: thick and rolled over, its crest catching the window on the near side, rolling into shade on the far
    const lx = x + r * 0.015, ly = y - r * 0.01, lipR = 0.5, mouthR = 0.33;
    const lip = A.roughen(handRing(A, lx, ly, r * lipR, r * lipR * 0.98, 0.03), r * 0.005, r * 0.16, true);
    const mouth = A.roughen(handRing(A, lx + r * 0.012, ly + r * 0.01, r * mouthR, r * mouthR * 0.98, 0.03), r * 0.005, r * 0.16, true);
    A.fill(lip, 'pastel', clay, { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(lip, () => {
      const mr = r * (lipR + mouthR) / 2, rr2 = (k, w, a0, a1) => handRing(A, lx, ly, mr * k, mr * k * 0.99, w, a0, a1);
      // the roll: pale along its crest toward the window, a dark underside round its outer edge on the far side
      A.stroke(press(A, rr2(1, 0.015, 2.2, 5.3), 0.45), 'side', clayL, { w: r * 0.085, p: 0.75 });
      A.stroke(press(A, rr2(0.985, 0.012, 3.0, 4.6), 0.3, 3), 'chalk', T(A.mix('peach', 'khadi', 0.55)), { w: 1.7, p: 0.85, tin: 0.3, tout: 0.3 });
      A.stroke(press(A, rr2(1.12, 0.012, 5.4, 8.5), 0.45), 'side', clayDD, { w: r * 0.06, p: 0.6 });
      A.stroke(press(A, rr2(0.92, 0.012, 5.6, 8.0), 0.45), 'side', clayD, { w: r * 0.05, p: 0.5 });
      A.blend(lip, { r: 2, k: 0.25 });
    });
    A.outline(press(A, lip, 0.5, 5), 'kajal', T(A.mix('sepia', 'kajal', 0.4)), { closed: true, w: 1.05, p: 0.8 });
    /* the mouth: dark, going down.  The inside of the neck shows only on the far side, where the window reaches it; the
       water lies deep, a dim olive skin with the window a faint soft square on it */
    A.fill(mouth, 'pastel', clayDD, { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(mouth, () => {
      const mr = r * mouthR;
      M.floorWash(A, mouth, T(A.mix('kajal', 'umber', 0.3)), (px, py) => 0.85 * (1 - sstep((Math.hypot(px - lx + mr * 0.12, py - ly + mr * 0.12) / mr - 0.25) / 0.5)));
      // the inside wall, lit on the far side
      A.stroke(press(A, handRing(A, lx + mr * 0.04, ly + mr * 0.04, mr * 0.86, mr * 0.85, 0.02, 5.6, 8.0), 0.4), 'side', clayD, { w: mr * 0.32, p: 0.7 });
      A.stroke(press(A, handRing(A, lx + mr * 0.04, ly + mr * 0.04, mr * 0.93, mr * 0.92, 0.02, 6.0, 7.6), 0.3, 3), 'side', T(A.mix('geru', 'peach', 0.3)), { w: mr * 0.12, p: 0.45 });
      A.blend(mouth, { r: mr * 0.08, k: 0.4 });
      // the water deep in it: only a dim olive breath where the window finds it, and one small glint
      const wx = lx - mr * 0.14, wy = ly - mr * 0.12, ws = mr * 0.26;
      M.floorWash(A, A.ellipse(wx, wy, ws * 1.4, ws * 1.4), T(A.mix(o.pane || 'khadi', 'olive', 0.7)), (px, py) => 0.32 * (1 - sstep(Math.hypot((px - wx) / ws, (py - wy) / (ws * 0.9)) - 0.2)));
      A.dot(wx - ws * 0.25, wy - ws * 0.3, 'chalk', T(A.mix(o.pane || 'khadi', 'olive', 0.35)), { w: 1.5, p: 0.5, len: 1.2, ang: -0.6 });
    });
    A.outline(press(A, mouth, 0.5, 5), 'kajal', T('kajal'), { closed: true, w: 0.9, p: 0.75 });
  };

  /* flakes of gold leaf blown off the booklet, drifting across the floor along path: smaller and fewer the farther they went,
     each a torn scrap, some creased */
  M.goldFlakes = function (A, path, n, T) {
    const seg = []; let tot = 0;
    for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(l); tot += l; }
    const at = t => { let d = t * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = Math.min(1, d / seg[i]); return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]; } d -= seg[i]; } return path[path.length - 1]; };
    for (let i = 0; i < n; i++) {
      const t = Math.pow((i + A.rr(0.1, 0.9)) / n, 1.35), q = at(t), sz = 5 * (1 - 0.6 * t) * A.rr(0.65, 1.2), off = A.rr(-12, 12) * (0.4 + t), a = A.rr(0, TAU), k = A.rr(0.45, 0.85);
      const c = [q[0] + off * 0.3, q[1] + off];
      const P = (u, v) => add(c, rot([u * sz, v * sz * k], a));
      const fl = A.roughen([P(-1, -0.8), P(0.2, -1.1), P(1, -0.5), P(0.8, 0.7), P(-0.3, 1), P(-1.1, 0.4)], sz * 0.1, sz * 0.5, true);
      A.fill(fl.map(p => [p[0] + 0.9, p[1] + 1.2]), 'shade', T('umber'), { w: 1.2, p: 0.25, passes: 1, gap: 0.5 });
      A.fill(fl, 'pastel', T('ochre'), { w: 1.2, p: 0.9, passes: 1, gap: 0.5 });
      A.fill(fl, 'gold', 'gold', { w: Math.max(0.9, sz * 0.45), p: 1, passes: 2, gap: 0.5, ang: a });
      if (sz > 3) A.stroke([P(-0.6, -0.5), P(0.1, 0.1), P(0.5, 0.7)], 'kajal', T(A.mix('ochre', 'umber', 0.5)), { w: 0.35, p: 0.45 });
      A.outline(fl, 'kajal', T(A.mix('ochre', 'umber', 0.6)), { closed: true, w: 0.35, p: 0.45, again: 0 });
    }
  };

  /* scraps of gold leaf come loose and settled where they fell: items are [x, y, size, turn].  Each a torn and creased
     scrap lying not quite flat, so one edge lifts and throws a hair of shadow; a few lie at the angle that sends the window
     back, and flash */
  M.goldScraps = function (A, items, T) {
    for (const it of items) {
      const [x, y, sz, a] = it, k = A.rr(0.45, 0.9);
      const P = (u, v) => add([x, y], rot([u * sz, v * sz * k], a));
      const nv = A.ri(5, 8), pts = [];
      for (let i = 0; i < nv; i++) { const t = i * TAU / nv + A.rr(-0.25, 0.25), rad = A.rr(0.65, 1.15); pts.push(P(Math.cos(t) * rad, Math.sin(t) * rad)); }
      const fl = A.roughen(pts, sz * 0.08, sz * 0.4, true);
      A.fill(fl.map(p => [p[0] + 0.8, p[1] + 1.1]), 'shade', T('umber'), { w: 1, p: 0.22, passes: 1, gap: 0.5 });
      A.fill(fl, 'pastel', T('ochre'), { w: 1, p: 0.9, passes: 1, gap: 0.5 });
      A.fill(fl, 'gold', A.pick(['gold', '#e4b84a', '#d8a63c']), { w: Math.max(0.8, sz * 0.4), p: 1, passes: 2, gap: 0.5, ang: a });
      if (sz > 2.6) A.stroke([P(-0.6, -0.4), P(0.1, 0.05), P(0.55, 0.6)], 'kajal', T(A.mix('ochre', 'umber', 0.5)), { w: 0.3, p: 0.4 });
      if (it[4]) { const g = P(-0.2, -0.25); A.dot(g[0], g[1], 'chalk', T('#fff6d8'), { w: Math.max(1, sz * 0.5), p: 0.9 }); A.stroke([[g[0] - sz * 0.9, g[1]], [g[0] + sz * 0.9, g[1]]], 'chalk', T('#fff6d8'), { w: 0.45, p: 0.6, tin: 0.4, tout: 0.4 }); A.stroke([[g[0], g[1] - sz * 0.7], [g[0], g[1] + sz * 0.7]], 'chalk', T('#fff6d8'), { w: 0.4, p: 0.5, tin: 0.4, tout: 0.4 }); }
      A.outline(fl, 'kajal', T(A.mix('ochre', 'umber', 0.6)), { closed: true, w: 0.3, p: 0.4, again: 0 });
    }
  };

  // rings spreading on the water: k = 0 is still water with a glint, then larger rings
  M.waterRings = function (A, x, y, wr, k, T, o) {
    o = o || {};
    const c = T(o.c || 'khadi'), c2 = T(o.c2 || 'ice');
    A.dot(x - wr * 0.3, y - wr * 0.34, 'chalk', c, { w: 2.2, p: 0.8, len: 2.4, ang: -0.5 });
    if (!k) return;
    for (let j = 0; j < k; j++) {
      const rad = wr * (0.16 + 0.22 * (k - j)), pr = 0.72 - 0.16 * (k - j) + 0.1 * j;
      for (let s = 0; s < 3; s++) { const a0 = A.rr(0, TAU), da = A.rr(1.2, 2); A.stroke(A.ellipse(x + wr * 0.08, y + wr * 0.04, rad, rad * 0.96, 0, a0, a0 + da), 'chalk', j % 2 ? c2 : c, { w: 1.1, p: Math.max(0.2, pr), tin: 0.3, tout: 0.3 }); }
    }
    A.dot(x + wr * 0.08, y + wr * 0.04, 'chalk', c, { w: 1.6, p: 0.6 });
  };

  // one brush: a reed handle, a thread binding, a tip of squirrel hair
  function brush(A, a, b, T, o) {
    o = o || {};
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux, hw = o.w || 1.8;
    const ferr = 1 - (o.hair || 0.2), F = [a[0] + ux * L * ferr, a[1] + uy * L * ferr];
    A.stroke([[a[0] + nx * 0.4, a[1] + ny * 0.4], F], 'pastel', T(o.c || 'sand'), { w: hw * 2, p: 1, reach: 1.6, tin: 0, tout: 0 });
    A.stroke([[a[0] - nx * hw * 0.4, a[1] - ny * hw * 0.4], [F[0] - nx * hw * 0.4, F[1] - ny * hw * 0.4]], 'chalk', T('khadi'), { w: 0.7, p: 0.6 });
    for (const sg of [-1, 1]) A.stroke([[a[0] + sg * nx * hw, a[1] + sg * ny * hw], [F[0] + sg * nx * hw, F[1] + sg * ny * hw]], 'kajal', T('umber'), { w: 0.5, p: 0.6 });
    for (let d = A.rr(20, 40); d < L * ferr - 8; d += A.rr(26, 44)) A.stroke([[a[0] + ux * d - nx * hw, a[1] + uy * d - ny * hw], [a[0] + ux * d + nx * hw, a[1] + uy * d + ny * hw]], 'kajal', T('umber'), { w: 0.6, p: 0.6 });
    for (let k = 0; k < 4; k++) { const d = L * ferr - k * 1.6; A.stroke([[a[0] + ux * d - nx * hw * 1.1, a[1] + uy * d - ny * hw * 1.1], [a[0] + ux * d + nx * hw * 1.1, a[1] + uy * d + ny * hw * 1.1]], 'chalk', T(o.thread || 'hingul'), { w: 1, p: 0.9 }); }
    const tip = [b[0], b[1]], hl0 = [F[0] - nx * hw * 1.1, F[1] - ny * hw * 1.1], hr0 = [F[0] + nx * hw * 1.1, F[1] + ny * hw * 1.1], mid = [F[0] + ux * L * (1 - ferr) * 0.45, F[1] + uy * L * (1 - ferr) * 0.45];
    A.shape(A.spline([hl0, [mid[0] - nx * hw * 1.5, mid[1] - ny * hw * 1.5], tip, [mid[0] + nx * hw * 1.5, mid[1] + ny * hw * 1.5], hr0], false, 1), { c: T(o.hairC || A.mix('umber', 'sepia', 0.4)), w: 1.6, rough: 0.15, line: false, ang: Math.atan2(uy, ux) });
    if (o.dip) A.withMask(A.spline([[mid[0] - nx * 4, mid[1] - ny * 4], [mid[0] + nx * 4, mid[1] + ny * 4], [tip[0] + ux * 3 + nx * 3, tip[1] + uy * 3 + ny * 3], [tip[0] + ux * 3 - nx * 3, tip[1] + uy * 3 - ny * 3]], true, 2), () => A.stroke([mid, tip], 'pastel', T(o.dip), { w: hw * 3.4, p: 1, reach: 1.6 }));
    A.stroke([hl0, mid, tip], 'kajal', T('kajal'), { w: 0.45, p: 0.5 });
  }
  M.brush = brush;

  // a bundle of fine brushes tied with a red thread
  M.brushBundle = function (A, x, y, ang, len, T, o) {
    o = o || {};
    const n = o.n || 7, ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, all = [];
    const dips = [null, 'hingul', null, 'lapis', null, 'malachite', 'haldi', null, 'kajal'];
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 5.4 + A.rr(-0.7, 0.7), da = A.rr(-0.03, 0.03), L = len * A.rr(0.82, 1.04), s0 = A.rr(-len * 0.08, len * 0.06);
      const a = [x + nx * off + Math.cos(ang + da) * s0, y + ny * off + Math.sin(ang + da) * s0], b = [a[0] + Math.cos(ang + da) * L, a[1] + Math.sin(ang + da) * L];
      all.push([a, b]);
    }
    shadowOf(A, [[all[0][0][0] - nx * 3, all[0][0][1] - ny * 3], [all[0][1][0] - nx * 3, all[0][1][1] - ny * 3], [all[n - 1][1][0] + nx * 3, all[n - 1][1][1] + ny * 3], [all[n - 1][0][0] + nx * 3, all[n - 1][0][1] + ny * 3]], T, 3, 4, 0.36);
    all.forEach((q, i) => brush(A, q[0], q[1], T, { w: A.rr(1.9, 2.6), hair: A.rr(0.13, 0.2), c: A.pick(['sand', 'ochre', 'cream', A.mix('sand', 'umber', 0.25)]), dip: dips[i % dips.length], thread: A.pick(['hingul', 'haldi', 'malachite']) }));
    // the tie, wound three times, a knot, and its two loose ends
    const t = 0.36, cxp = [x + ux * len * t, y + uy * len * t];
    for (let k = 0; k < 3; k++) { const d = k * 2.2 - 2.2; A.stroke(A.spline([[cxp[0] - nx * (n * 2.4) + ux * d, cxp[1] - ny * (n * 2.4) + uy * d], [cxp[0] + ux * (d + 1.4), cxp[1] + uy * (d + 1.4)], [cxp[0] + nx * (n * 2.4) + ux * d, cxp[1] + ny * (n * 2.4) + uy * d]], false, 1.5), 'chalk', T('hingul'), { w: 1.3, p: 0.95 }); }
    const kn = [cxp[0] + nx * n * 2.4, cxp[1] + ny * n * 2.4];
    A.dot(kn[0], kn[1], 'chalk', T('hingul'), { w: 3, p: 1 });
    A.stroke(A.spline([kn, [kn[0] + nx * 8 + ux * 4, kn[1] + ny * 8 + uy * 4], [kn[0] + nx * 14 - ux * 3, kn[1] + ny * 14 - uy * 3]], false, 1.5), 'chalk', T('hingul'), { w: 1.1, p: 0.9, tout: 0.5 });
    A.stroke(A.spline([kn, [kn[0] + nx * 6 - ux * 7, kn[1] + ny * 6 - uy * 7], [kn[0] + nx * 9 - ux * 15, kn[1] + ny * 9 - uy * 15]], false, 1.5), 'chalk', T('hingul'), { w: 1.1, p: 0.9, tout: 0.5 });
  };

  // a peacock feather from its quill (a) to its eye (b); ph stirs the barbs
  M.peacockFeather = function (A, a, b, T, o) {
    o = o || {};
    const GC = o.toneGold ? T('gold') : 'gold', ph = o.ph || 0, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux, bend = o.bend != null ? o.bend : 0.06;
    const sp = t => { const bw = Math.sin(t * PI) * L * bend; return [a[0] + ux * L * t + nx * bw, a[1] + uy * L * t + ny * bw]; };
    const dir = t => { const p = sp(Math.min(1, t + 0.01)), q = sp(Math.max(0, t - 0.01)); return Math.atan2(p[1] - q[1], p[0] - q[0]); };
    // the barbs: a loose fringe near the quill, a full vane of bronze and green toward the eye
    const LOW = [A.mix('olive', 'ochre', 0.3), A.mix('olive', 'ochre', 0.6), A.mix('sap', 'olive', 0.5), A.mix('ochre', 'khadi', 0.3)];
    const HIGH = [A.mix('sap', 'malachite', 0.4), 'sap', A.mix('malachite', 'teal', 0.4), A.mix('ochre', 'olive', 0.4), 'leaf', A.mix('sap', 'gold', 0.35), A.mix('olive', 'sap', 0.5)];
    const ec = sp(0.88), ea = dir(0.88), er = L * 0.046;
    for (let t = 0.06; t < 0.985; t += 0.0042) {
      const d = dir(t), p = sp(t), near = Math.max(0, 1 - Math.abs(t - 0.86) / 0.2);
      const reach = L * (0.03 + 0.07 * Math.pow(t, 1.4) + 0.05 * near) * (t > 0.93 ? Math.max(0.25, 1 - (t - 0.93) * 9) : 1);
      for (const sg of [-1, 1]) {
        if (t < 0.35 && A.chance(0.4)) continue;
        const ba = d + sg * (0.62 + 0.3 * Math.sin(t * 11 + ph * 1.3 + sg) * (t < 0.5 ? 1 : 0.4)) + ph * 0.05 * sg, len = reach * A.rr(0.8, 1.12), cv = sg * A.rr(0.1, 0.24) + ph * 0.04;
        const e1 = [p[0] + Math.cos(ba) * len * 0.5, p[1] + Math.sin(ba) * len * 0.5], e2 = [p[0] + Math.cos(ba + cv) * len, p[1] + Math.sin(ba + cv) * len];
        const lo = t < 0.45;
        // a darker barb under, a lit one over: the vane's sheen
        if (!lo) A.stroke([p, e1, e2], 'chalk', T(A.mix('olive', 'umber', 0.45)), { w: 1.25, p: 0.5, tin: 0.05, tout: 0.6 });
        A.stroke([p, e1, e2], 'chalk', T(A.pick(lo ? LOW : HIGH)), { w: lo ? 0.75 : 0.95, p: lo ? 0.7 : 0.92, tin: 0.05, tout: 0.55 });
        if (!lo && A.chance(0.16)) A.stroke([e1, e2], 'gold', GC, { w: 0.7, p: 0.85 });
      }
    }
    /* the shaft: one long tapering shape of ivory, laid solid, round in section so it is pale along the side toward the
       window and dun along the other; at its foot the bare quill, hollow and a little clear, cut off at a slant */
    {
      const hw = t => (t < 0.08 ? 1.75 : 1.75 - 1.35 * sstep((t - 0.08) / 0.84)) + 0.15 * Math.sin(t * 40);
      const lft = [], rgt = [], mid = [];
      for (let t = -0.06; t <= 0.925; t += 0.012) { const p = sp(t), d = dir(Math.max(0, t)), nx2 = -Math.sin(d), ny2 = Math.cos(d), w = hw(t); lft.push([p[0] + nx2 * w, p[1] + ny2 * w]); rgt.push([p[0] - nx2 * w, p[1] - ny2 * w]); mid.push(p); }
      // the cut end of the quill: a slant across its foot
      const shaft = lft.concat(rgt.slice().reverse());
      A.fill(shaft, 'pastel', T(A.mix('khadi', 'cream', 0.3)), { w: 1.2, p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: Math.atan2(uy, ux) });
      A.withMask(shaft, () => {
        // which side is in the light: the window is up and to the left
        const lightSide = (nx * -0.72 + ny * -0.69) > 0 ? 1 : -1, sideL = lightSide > 0 ? lft : rgt, sideD = lightSide > 0 ? rgt : lft;
        A.stroke(sideD.map((q, i) => [(q[0] + mid[i][0]) / 2, (q[1] + mid[i][1]) / 2]), 'side', T(A.mix('sand', 'umber', 0.25)), { w: 1.6, p: 0.45, tin: 0.05, tout: 0.3 });
        A.stroke(sideL.map((q, i) => [(q[0] * 0.3 + mid[i][0] * 0.7), (q[1] * 0.3 + mid[i][1] * 0.7)]).slice(0, Math.round(sideL.length * 0.8)), 'chalk', T('#fffaf0'), { w: 0.75, p: 0.75, tin: 0.05, tout: 0.6 });
        // the hollow quill: clearer, greyed, a dark core showing through
        const q0 = Math.round(0.11 / 0.012);
        A.stroke(mid.slice(0, q0), 'side', T(A.mix('stone', 'sand', 0.3)), { w: 2.6, p: 0.35, tin: 0, tout: 0.2 });
        A.stroke(mid.slice(1, q0 - 1), 'chalk', T(A.mix('umber', 'stone', 0.5)), { w: 0.5, p: 0.45, tin: 0.2, tout: 0.4 });
      });
      A.stroke(lft, 'kajal', T('sepia'), { w: 0.45, p: 0.62, tin: 0, tout: 0.5 });
      A.stroke(rgt, 'kajal', T('sepia'), { w: 0.45, p: 0.7, tin: 0, tout: 0.5 });
      A.stroke([lft[0], rgt[0]], 'kajal', T('sepia'), { w: 0.5, p: 0.8 });
    }
    // the eye: a bronze cloud, a green heart, a ring of turquoise, a deep blue seed shaped like a heart
    const E = (k, sx, off) => A.roughen(A.ellipse(ec[0] + Math.cos(ea) * er * off, ec[1] + Math.sin(ea) * er * off, er * k * sx, er * k, ea), er * 0.04, er * 0.8, true);
    A.fill(E(1.7, 1.35, 0.05), 'side', T(A.mix('sap', 'gold', 0.4)), { w: er * 0.4, p: 0.8, reach: 1.3, passes: 2, ang: ea });
    A.fill(E(1.36, 1.3, 0), 'pastel', T(A.mix('ochre', 'brick', 0.45)), { w: er * 0.3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ea });
    A.withMask(E(1.36, 1.3, 0), () => A.fill(E(1.36, 1.3, 0.25), 'side', T(A.mix('brick', 'umber', 0.4)), { w: er * 0.3, p: 0.5, ang: ea }));
    A.outline(E(1.1, 1.3, -0.05), 'gold', GC, { closed: true, w: 1.2, p: 0.9, again: 0 });
    A.fill(E(1.02, 1.28, -0.06), 'pastel', T(A.mix('verdigris', 'teal', 0.35)), { w: er * 0.26, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ea });
    A.withMask(E(1.02, 1.28, -0.06), () => A.fill(E(0.8, 1.2, -0.3), 'side', T(A.mix('aqua', 'khadi', 0.3)), { w: er * 0.25, p: 0.45, ang: ea }));
    // the heart: two lobes toward the tip, a point toward the quill
    {
      const H2 = (u, v) => add(ec, rot([u * er, v * er], ea));
      const heart = A.spline([H2(-0.74, 0), H2(-0.46, -0.36), H2(0.08, -0.56), H2(0.52, -0.38), H2(0.56, -0.08), H2(0.5, 0.02), H2(0.56, 0.12), H2(0.52, 0.38), H2(0.08, 0.56), H2(-0.46, 0.36)], true, 0.8);
      A.fill(heart, 'pastel', T(A.mix('neel', 'lapis', 0.45)), { w: er * 0.2, p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: ea });
      A.dot(H2(0.15, -0.18)[0], H2(0.15, -0.18)[1], 'chalk', T('lapis'), { w: er * 0.22, p: 0.8 });
      A.outline(heart, 'kajal', T('night'), { closed: true, w: 0.5, p: 0.6, again: 0 });
    }
    A.outline(E(1.3, 1.3, 0), 'kajal', T(A.mix('sepia', 'olive', 0.3)), { closed: true, w: 0.5, p: 0.5, again: 0 });
    // fine bronze barbs over the edge of the eye
    for (let k = 0; k < 40; k++) { const al = A.rr(-PI, PI) + ph * 0.03, q0 = add(ec, rot([Math.cos(al) * er * 1.56, Math.sin(al) * er * 1.2], ea)), aa = al + ea, ln = er * A.rr(0.4, 0.9); A.stroke([q0, [q0[0] + Math.cos(aa) * ln, q0[1] + Math.sin(aa) * ln]], 'chalk', T(A.pick(['ochre', 'olive', 'gold', 'sap'])), { w: 0.6, p: 0.7, tout: 0.6 }); }
  };

  // a small booklet of gold leaf, open; (x, y) its spine, s the height of a page
  M.leafBook = function (A, x, y, s, ang, T, o) {
    o = o || {};
    const P = (u, v) => add([x, y], rot([u, v], ang));
    const pageL = [P(-s * 0.86, -s / 2), P(-1, -s / 2 + 1), P(-1, s / 2 - 1), P(-s * 0.86, s / 2)], pageR = [P(1, -s / 2 + 1), P(s * 0.86, -s / 2), P(s * 0.86, s / 2), P(1, s / 2 - 1)];
    shadowOf(A, pageL.concat(pageR.slice(1, 3)), T, 3, 4, 0.36);
    for (const pg of [pageL, pageR]) {
      const r2 = A.roughen(pg, 0.6, 8, true);
      A.fill(r2, 'pastel', T(A.mix('peach', 'cream', 0.4)), { w: 3, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang });
      A.withMask(r2, () => { for (let k = 0; k < 18; k++) { const q = P(A.rr(-s * 0.8, s * 0.8), A.rr(-s * 0.45, s * 0.45)); A.stroke([q, [q[0] + A.rr(-6, 6), q[1] + A.rr(-6, 6)]], 'shade', T('ochre'), { w: 0.7, p: 0.3 }); } });
      A.outline(r2, 'kajal', T(A.mix('sepia', 'peach', 0.3)), { closed: true, w: 0.6, p: 0.55 });
    }
    // the stitches of the spine
    for (let k = -2; k <= 2; k++) { const q = P(0, k * s * 0.19); A.stroke([P(-2.4, k * s * 0.19), P(2.4, k * s * 0.19)], 'chalk', T('hingul'), { w: 1, p: 0.9 }); void q; }
    A.stroke([P(0, -s / 2), P(0, s / 2)], 'kajal', T('sepia'), { w: 0.6, p: 0.6 });
    // a sheet of leaf laid on the left page; the right page waits for the one that lifts
    M.goldSheet(A, P(-s * 0.43, 0)[0], P(-s * 0.43, 0)[1], s * 0.62, ang + 0.04, 0, T);
    for (let k = 0; k < 9; k++) { const q = P(A.rr(-s * 1.4, s * 1.5), A.rr(-s * 0.9, s * 0.9)); const fl = A.roughen(A.ellipse(q[0], q[1], A.rr(1.5, 3.6), A.rr(1, 2.4), A.rr(0, 3)), 0.5, 3, true); A.fill(fl, 'gold', 'gold', { w: 1.4, p: 1, passes: 1, gap: 0.5 }); }
  };

  // one sheet of gold leaf; lift 0 lies flat, 1 and 2 have a corner lifting in the breeze
  // (o.toneGold: the leaf takes the hour's tone like every other colour, as a drawing laid apart from the still picture must)
  M.goldSheet = function (A, x, y, s, ang, lift, T, o) {
    const GC = o && o.toneGold ? T('gold') : 'gold';
    const h = s / 2, P = (u, v) => add([x, y], rot([u, v], ang));
    const k = lift * 0.22, fold = h * (0.6 + lift * 0.25);
    const flat = lift ? [P(-h, -h), P(h - fold * 0.9, -h), P(h, -h + fold * 0.9), P(h, h), P(-h, h)] : [P(-h, -h), P(h, -h), P(h, h), P(-h, h)];
    const e = A.roughen(flat, 0.5, 5, true);
    A.fill(e, 'pastel', T('ochre'), { w: 2.4, p: 0.9, reach: 1.5, passes: 2, gap: 0.42, ang });
    A.fill(e, 'gold', GC, { w: 2.6, p: 1, passes: 2, gap: 0.45, ang: ang + 0.4 });
    A.withMask(e, () => { for (let i = 0; i < 9; i++) { const q = P(A.rr(-h, h), A.rr(-h, h)); A.stroke([q, [q[0] + A.rr(-h * 0.5, h * 0.5), q[1] + A.rr(-h * 0.5, h * 0.5)]], 'kajal', T(A.mix('ochre', 'umber', 0.5)), { w: 0.4, p: 0.4 }); } });
    A.outline(e, 'kajal', T(A.mix('ochre', 'umber', 0.6)), { closed: true, w: 0.5, p: 0.55, again: 0 });
    if (lift) {
      // the corner turned back on itself: its underside catches less light, and it throws a shadow
      const c0 = P(h - fold * 0.9, -h), c1 = P(h, -h + fold * 0.9), tipBase = P(h - fold * 0.45, -h + fold * 0.45), up = P(h - fold * (0.9 + k * 0.9), -h + fold * (0.9 + k * 0.9));
      const tipFold = [c0, c1, [up[0] - 2 * lift, up[1] - 3 * lift]];
      A.fill(tipFold.map(q => [q[0] + 3 + lift * 2, q[1] + 4 + lift * 2]), 'shade', T('umber'), { w: 2, p: 0.3, passes: 1, gap: 0.5 });
      A.fill(tipFold, 'pastel', T(A.mix('haldi', 'cream', 0.4)), { w: 2, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      A.fill(tipFold, 'gold', GC, { w: 1.6, p: 0.6, passes: 1, gap: 0.6 });
      A.outline(tipFold, 'kajal', T(A.mix('ochre', 'umber', 0.6)), { closed: true, w: 0.5, p: 0.6, again: 0 });
      void tipBase;
    }
  };

  // an agate burnisher on its turned handle; (x, y) the stone, ang where the handle points
  M.burnisher = function (A, x, y, s, ang, T) {
    const P = (u, v) => add([x, y], rot([u, v], ang));
    const handle = [P(s * 0.25, -s * 0.07), P(s * 1.2, -s * 0.085), P(s * 1.32, -s * 0.05), P(s * 1.33, s * 0.05), P(s * 1.2, s * 0.085), P(s * 0.25, s * 0.07)];
    const stone = A.spline([P(-s * 0.33, 0), P(-s * 0.2, -s * 0.13), P(s * 0.1, -s * 0.12), P(s * 0.28, -s * 0.05), P(s * 0.28, s * 0.05), P(s * 0.1, s * 0.12), P(-s * 0.2, s * 0.13)], true, 1.5);
    shadowOf(A, handle.concat(stone.slice(8, 30)), T, 3, 4, 0.38);
    A.fill(handle, 'pastel', T(A.mix('umber', 'ochre', 0.45)), { w: 2.6, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.stroke([P(s * 0.3, -s * 0.03), P(s * 1.25, -s * 0.04)], 'chalk', T('sand'), { w: 1.2, p: 0.6 });
    for (const t of [0.5, 0.62, 0.95, 1.1]) A.stroke([P(s * t, -s * 0.085), P(s * t, s * 0.085)], 'kajal', T('sepia'), { w: 0.6, p: 0.7 });
    A.outline(handle, 'kajal', T('sepia'), { closed: true, w: 0.7, p: 0.7 });
    A.fill([P(s * 0.2, -s * 0.09), P(s * 0.33, -s * 0.09), P(s * 0.33, s * 0.09), P(s * 0.2, s * 0.09)], 'gold', 'gold', { w: 2, p: 1, passes: 2, gap: 0.45 });
    A.fill(stone, 'pastel', T(A.mix('peach', 'stone', 0.4)), { w: 2.6, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(stone, () => {
      for (let k = 0; k < 6; k++) A.stroke(A.ellipse(P(-s * 0.05, s * 0.02)[0], P(-s * 0.05, s * 0.02)[1], s * (0.06 + k * 0.05), s * (0.03 + k * 0.022), ang + 0.2, 0, TAU), 'chalk', T(['khadi', 'brick', 'stone', 'peach', 'grey', 'khadi'][k]), { w: 1.2, p: 0.55 });
      A.stroke([P(-s * 0.2, -s * 0.08), P(s * 0.12, -s * 0.09)], 'chalk', T('khadi'), { w: 1.6, p: 0.95 });
    });
    A.outline(stone, 'kajal', T('sepia'), { closed: true, w: 0.7, p: 0.7 });
  };

  /* a stub of pencil worn down to a finger's length, its paint chipped, sharpened with a knife, a curl of its shaving
     and a breath of its lead beside it.  (x, y) the cut end, len its length, ang the way the point faces */
  M.pencilStub = function (A, x, y, len, ang, T, o) {
    o = o || {};
    const P = (u, v) => add([x, y], rot([u, v], ang)), hw = 2.9, tipL = 9, body = len - tipL;
    // the shoulder where the knife bit into the paint: a row of small scallops
    const sc = []; for (let k = 0; k <= 6; k++) sc.push(P(body + 1.6 * Math.abs(Math.sin(k * 1.3 + 0.5)) + A.rr(-0.3, 0.3), -hw + k * hw / 3));
    const bodyP = [P(0.3, -hw), ...sc, P(0, hw)], cone = [...sc, P(len - 2.6, hw * 0.34), P(len - 2.6, -hw * 0.34)].reverse(), lead = [P(len - 2.9, -hw * 0.38), P(len, A.rr(-0.2, 0.2)), P(len - 2.9, hw * 0.38)];
    shadowOf(A, bodyP.concat([P(len, 0)]), T, 2.4, 3.2, 0.36);
    const pc = o.paint || A.mix('lac', 'sindoor', 0.35), paint = T(pc);
    A.fill(bodyP, 'pastel', paint, { w: 1.8, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(bodyP, () => {
      // three of its six faces show: the one toward the window pale, the far one dark, a hair of an edge between
      A.stroke(press(A, [P(0, -hw * 0.5), P(body * 0.5, -hw * 0.48), P(body + 1, -hw * 0.5)], 0.5, 1), 'chalk', T(A.mix(pc, 'khadi', 0.45)), { w: 1.3, p: 0.7 });
      A.stroke([P(0, hw * 0.6), P(body + 1, hw * 0.6)], 'side', T(A.mix(pc, 'kajal', 0.45)), { w: 1.8, p: 0.5 });
      A.stroke([P(0, hw * 0.08), P(body, hw * 0.1)], 'kajal', T(A.mix(pc, 'kajal', 0.6)), { w: 0.4, p: 0.5 });
      // chips where the bare wood shows through
      for (let k = 0; k < 3; k++) { const q = P(A.rr(2, body - 2), A.rr(-hw * 0.7, hw * 0.7)); A.dot(q[0], q[1], 'chalk', T(A.mix('sand', 'peach', 0.4)), { w: A.rr(0.8, 1.5), p: 0.8, len: A.rr(0.3, 1), ang }); }
      A.stroke([P(0.5, -hw), P(0.5, hw)], 'chalk', T(A.mix('sand', 'peach', 0.3)), { w: 0.9, p: 0.85 });
    });
    A.fill(cone, 'pastel', T(A.mix('sand', 'peach', 0.35)), { w: 1.4, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(cone, () => { for (let k = 0; k < 3; k++) { const v = (k - 1) * hw * 0.55; A.stroke([P(body + 1.2, v * 1.1), P(len - 2.6, v * 0.3)], 'chalk', T(k === 0 ? 'khadi' : A.mix('sand', 'umber', 0.3)), { w: 1, p: 0.6 }); } });
    A.fill(lead, 'chalk', T(A.mix('kajal', 'slate', 0.35)), { w: 0.8, p: 1, passes: 2, gap: 0.42 });
    A.stroke([P(len - 2.4, -0.4), P(len - 0.6, -0.1)], 'chalk', T('#c9ccd2'), { w: 0.45, p: 0.7 });
    A.outline(bodyP, 'kajal', T('sepia'), { closed: true, w: 0.55, p: 0.6 });
    A.outline(cone, 'kajal', T(A.mix('sepia', 'sand', 0.3)), { closed: true, w: 0.45, p: 0.5, again: 0 });
    // the shaving: a ribbon of wood curled on itself, its outer edge rimmed with the red of the paint
    const sc0 = P(len + 4, hw + 9), turns = A.rr(1.2, 1.7), sp = [], spO = [];
    for (let t = 0; t <= 1.001; t += 0.04) { const a = ang + t * turns * TAU, rr2 = 6.5 - 4.5 * t; sp.push([sc0[0] + Math.cos(a) * rr2, sc0[1] + Math.sin(a) * rr2 * 0.8, 1 - 0.5 * t]); spO.push([sc0[0] + Math.cos(a) * (rr2 + 1.1), sc0[1] + Math.sin(a) * (rr2 + 1.1) * 0.8]); }
    A.stroke(sp.map(q => [q[0] + 1, q[1] + 1.4]), 'shade', T('umber'), { w: 2.2, p: 0.18 });
    A.stroke(sp, 'chalk', T(A.mix('sand', 'peach', 0.45)), { w: 1.9, p: 0.9 });
    A.stroke(spO.slice(0, 18), 'chalk', paint, { w: 0.6, p: 0.75, tout: 0.5 });
    A.stroke(sp, 'kajal', T(A.mix('sepia', 'sand', 0.4)), { w: 0.35, p: 0.4 });
    // and the lead dust where it was sharpened
    for (let i = 0; i < 26; i++) { const q = P(len + A.rr(1, 12), A.rr(-7, 7)); A.dot(q[0], q[1], 'chalk', T(A.mix('kajal', 'slate', 0.4)), { w: A.rr(0.3, 0.9), p: A.rr(0.3, 0.6) }); }
    { const a = P(len + 3, -2), b = P(len + 13, 1.5); A.smudge([a, b], { r: 1.6, k: 0.4 }); }
  };

  // a few threads pulled off a bundle or a binding and dropped: each wanders, one loops back on itself, their ends frayed
  M.looseThreads = function (A, x, y, T, o) {
    o = o || {};
    for (const c of (o.cols || ['hingul', 'haldi', 'gold'])) {
      const pts = [[x + A.rr(-9, 9), y + A.rr(-6, 6)]], L = A.rr(26, 58), n = 7; let a = A.rr(0, TAU);
      for (let i = 0; i < n; i++) { a += A.rr(-0.95, 0.95) + (i === 3 && A.chance(0.5) ? 2.4 : 0); const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(a) * L / n, q[1] + Math.sin(a) * L / n]); }
      const sp = A.spline(pts, false, 1.2);
      A.stroke(sp.map(q => [q[0] + 0.7, q[1] + 1]), 'shade', T('umber'), { w: 1.3, p: 0.15 });
      if (c === 'gold') A.stroke(press(A, sp, 0.45, 3), 'gold', 'gold', { w: 0.85, p: 0.9, tin: 0.05, tout: 0.2 });
      else A.stroke(press(A, sp, 0.5, 3), 'chalk', T(c), { w: A.rr(0.75, 1.05), p: 0.88, tin: 0.05, tout: 0.2 });
      const e = sp[sp.length - 1], e2 = sp[Math.max(0, sp.length - 4)], ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
      for (let j = 0; j < 3; j++) { const aa = ea + A.rr(-0.7, 0.7), l = A.rr(1.6, 3.6); A.stroke([e, [e[0] + Math.cos(aa) * l, e[1] + Math.sin(aa) * l]], 'chalk', T(c === 'gold' ? 'haldi' : c), { w: 0.35, p: 0.6, tout: 0.5 }); }
    }
  };

  // a pinch of dry colour dropped on the floor and dragged once into a smear that thins out
  M.pigmentDust = function (A, x, y, r, pig, T) {
    const c = T(pig), lt = A.mix(c, T('khadi'), 0.35), dk = A.mix(c, T('kajal'), 0.2), a = A.rr(0, TAU);
    const e = A.roughen(A.ellipse(x, y, r, r * A.rr(0.45, 0.7), a), r * 0.15, r * 0.5, true);
    A.fill(e, 'side', c, { w: r * 0.4, p: 0.3, ang: a });
    for (let i = 0; i < r * 16; i++) { const b = A.rr(0, TAU), d = r * Math.pow(A.rnd(), 0.8) * 1.3; A.dot(x + Math.cos(b) * d, y + Math.sin(b) * d * 0.7, 'chalk', A.pick([c, c, lt, dk]), { w: A.rr(0.4, 1.4), p: A.rr(0.35, 0.8), len: A.rr(0, 0.6) }); }
    const sa = a + A.rr(-0.5, 0.5); A.smudge([[x, y], [x + Math.cos(sa) * r * 1.8, y + Math.sin(sa) * r * 1.8]], { r: r * 0.25, k: 0.5 });
  };

  /* gold dust carried off the booklet across the rug: a trail that wanders, thick near where it started and thinning as
     it goes, gathered in little drifts where a draught let it fall, a few grains dragged into streaks */
  M.goldTrail = function (A, path, T, o) {
    o = o || {};
    const sp = A.spline(path, false, 3), seg = []; let tot = 0;
    for (let i = 1; i < sp.length; i++) { const l = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); seg.push(l); tot += l; }
    const at = t => { let d = clamp(t, 0, 1) * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, d / seg[i]) : 0, a = sp[i], b = sp[i + 1]; return { q: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], tn: [(b[0] - a[0]) / (seg[i] || 1), (b[1] - a[1]) / (seg[i] || 1)] }; } d -= seg[i]; } return { q: sp[sp.length - 1], tn: [1, 0] }; };
    const n = o.n || 1200, w0 = o.w0 || 8, w1 = o.w1 || 22, sd = A.rr(0, 40);
    for (let i = 0; i < n; i++) {
      const t = Math.pow(A.rnd(), o.pow || 1.4), p = at(t), nn = [-p.tn[1], p.tn[0]], swell = 0.55 + 0.9 * A.noise2(t * 8 + sd, 1.3, 3);
      if (A.rnd() > swell) continue;
      const off = A.gauss() * (w0 + (w1 - w0) * t) * 0.5 * swell, al = A.rr(-3, 3);
      A.dot(p.q[0] + nn[0] * off + p.tn[0] * al, p.q[1] + nn[1] * off + p.tn[1] * al, 'gold', 'gold', { w: A.rr(0.5, t < 0.3 ? 1.9 : 1.4), len: A.rr(0.05, 0.6), ang: Math.atan2(p.tn[1], p.tn[0]) });
    }
    for (let k = 0; k < (o.drifts || 6); k++) {
      const p = at(A.rr(0.05, 0.92)), nn = [-p.tn[1], p.tn[0]], off = A.gauss() * w0 * 0.4, c = [p.q[0] + nn[0] * off, p.q[1] + nn[1] * off], rad = A.rr(2.5, 6);
      for (let i = 0; i < 46; i++) { const a = A.rr(0, TAU), d = Math.pow(A.rnd(), 1.4) * rad; A.dot(c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d * 0.7, 'gold', 'gold', { w: A.rr(0.6, 1.7) }); }
    }
    for (let k = 0; k < (o.streaks || 14); k++) {
      const p = at(A.rr(0, 0.88)), nn = [-p.tn[1], p.tn[0]], off = A.gauss() * w0 * 0.5, c = [p.q[0] + nn[0] * off, p.q[1] + nn[1] * off], L = A.rr(3, 9);
      A.stroke([c, [c[0] + p.tn[0] * L, c[1] + p.tn[1] * L]], 'gold', 'gold', { w: A.rr(0.6, 1.2), p: A.rr(0.5, 0.85), tin: 0.1, tout: 0.7 });
    }
  };

  /* one marigold head, seen from above: a ruffled round of cupped petals in rings, each ring a little paler toward the
     heart, the outer frill catching the light on the window side; and its own small shadow on what it lies on */
  function marigold(A, x, y, r, T, c0) {
    const base = T(c0 || A.pick(['saffron', 'saffron', 'haldi', 'sindoor']));
    const deep = A.mix(base, T('lac'), 0.38), pale = A.mix(base, T(A.pick(['cream', 'peori', 'haldi'])), 0.5);
    A.dot(x + r * 0.24, y + r * 0.34, 'shade', T('umber'), { w: r * 2.1, p: 0.3 });
    // the ruffled edge: frilled, in lobes of no one size
    const sd = A.rr(0, 50), edge = [], ne = Math.max(36, Math.round(r * 5));
    for (let i = 0; i < ne; i++) { const a = i * TAU / ne, k = 0.8 + 0.22 * A.noise2(Math.cos(a) * 2.2 + sd, Math.sin(a) * 2.2, 3) + 0.06 * Math.sin(a * 13 + sd) + A.rr(-0.03, 0.03); edge.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
    A.fill(edge, 'pastel', base, { w: Math.max(2, r * 0.45), p: 1, reach: 1.6, passes: 2, gap: 0.4 });
    A.withMask(edge, () => {
      // a pompom: domed toward the window, turning into its own shade on the far side
      A.stroke(A.ellipse(x, y, r * 0.7, r * 0.7, 0, 0.1, 2.2), 'side', A.mix(deep, T('umber'), 0.25), { w: r * 0.55, p: 0.45 });
      A.dot(x - r * 0.28, y - r * 0.3, 'side', pale, { w: r * 0.9, p: 0.4 });
      // rings of cupped petals, crowded and overlapping, the outer deepest; each a small arc, its lip caught pale
      for (const [rk, k, cc] of [[0.84, 1, deep], [0.7, 0.9, base], [0.54, 0.8, A.mix(base, pale, 0.5)], [0.36, 0.65, pale]]) {
        const m = Math.max(7, Math.round(r * rk * 3));
        for (let i = 0; i < m; i++) {
          const a = i * TAU / m + A.rr(-0.2, 0.2) + rk * 5, q = r * rk * A.rr(0.88, 1.08), c = [x + Math.cos(a) * q, y + Math.sin(a) * q], hw = r * 0.17 * k, tn = [-Math.sin(a), Math.cos(a)];
          const pts = [[c[0] - tn[0] * hw, c[1] - tn[1] * hw], [c[0] + Math.cos(a) * r * 0.09, c[1] + Math.sin(a) * r * 0.09], [c[0] + tn[0] * hw, c[1] + tn[1] * hw]];
          const away = 0.5 + 0.5 * Math.cos(a - 0.8);   // 1 on the far side, from the window
          A.stroke(pts.map(p => [p[0] - Math.cos(a) * r * 0.05, p[1] - Math.sin(a) * r * 0.05]), 'chalk', A.mix(deep, T('lac'), 0.3), { w: r * 0.08, p: 0.4 + 0.35 * away, tin: 0.2, tout: 0.2 });
          A.stroke(pts, 'chalk', A.mix(cc, deep, 0.3 * away), { w: r * 0.15, p: 0.88, tin: 0.15, tout: 0.15 });
          if (A.chance(0.7 - 0.4 * away)) A.stroke(pts.map(p => [p[0] + Math.cos(a) * r * 0.05, p[1] + Math.sin(a) * r * 0.05]), 'chalk', A.mix(cc, T('cream'), 0.45), { w: r * 0.055, p: 0.7, tin: 0.2, tout: 0.2 });
        }
      }
      // the heart, deep, pricked with the tips of the inmost petals
      A.dot(x + A.rr(-0.4, 0.4), y + A.rr(-0.4, 0.4), 'chalk', A.mix(deep, T('maroon'), 0.2), { w: r * 0.26, p: 0.7 });
      for (let i = 0; i < 5; i++) A.dot(x + A.rr(-0.16, 0.16) * r, y + A.rr(-0.16, 0.16) * r, 'chalk', pale, { w: r * 0.07, p: 0.75 });
    });
    // no hard edge: the frill broken by a few loose petals standing out past it
    for (let i = 0; i < 5; i++) { const a = A.rr(0, TAU), q = r * A.rr(0.8, 0.92), c = [x + Math.cos(a) * q, y + Math.sin(a) * q]; A.stroke([c, [c[0] + Math.cos(a + A.rr(-0.4, 0.4)) * r * 0.22, c[1] + Math.sin(a + A.rr(-0.4, 0.4)) * r * 0.22]], 'chalk', A.chance(0.5) ? deep : base, { w: r * 0.13, p: 0.8, tin: 0.1, tout: 0.5 }); }
  }
  M.marigold = marigold;

  // a garland of marigolds with a few leaves and jasmine, lying loose along pts
  M.garland = function (A, pts, T, o) {
    o = o || {};
    const sp = A.spline(pts, false, 2), path = A.resample(sp, o.step || 12, false);
    A.stroke(sp.map(p => [p[0] + 4, p[1] + 5]), 'shade', T('umber'), { w: 16, p: 0.28 });
    A.stroke(sp, 'chalk', T('khadi'), { w: 1, p: 0.7 });
    // strung in runs of one colour, as the flower-sellers string them, and no two heads the same size
    const runs = []; { const cols = ['saffron', 'haldi', 'saffron', 'peori', A.mix('saffron', 'haldi', 0.5), A.mix('saffron', 'sindoor', 0.3)]; let c = A.pick(cols); while (runs.length < path.length) { const n = A.ri(2, 5); for (let k = 0; k < n; k++) runs.push(c); let c2 = A.pick(cols); while (c2 === c) c2 = A.pick(cols); c = c2; } }
    path.forEach((p, i) => {
      const nx = path[Math.min(path.length - 1, i + 1)], an = Math.atan2(nx[1] - p[1], nx[0] - p[0]);
      if (i % 6 === 3) {
        for (const sg of [-1, 1]) {
          const tip = [p[0] + Math.cos(an + sg * 1.25) * 17, p[1] + Math.sin(an + sg * 1.25) * 17], m = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2], n2 = [Math.cos(an + sg * 1.25 + 1.57) * 4.5, Math.sin(an + sg * 1.25 + 1.57) * 4.5];
          A.shape(A.spline([p, [m[0] + n2[0], m[1] + n2[1]], tip, [m[0] - n2[0], m[1] - n2[1]]], true, 1.5), { c: T(A.pick(['malachite', 'sap', A.mix('malachite', 'bottle', 0.3)])), w: 2.2, rough: 0.2, line: T('bottle'), lw: 0.5, lp: 0.6 });
          A.stroke([p, tip], 'chalk', T('leaf'), { w: 0.7, p: 0.6 });
        }
      } else if (i % 9 === 7) {
        for (let k = 0; k < 4; k++) { const a = A.rr(0, TAU); A.stroke([[p[0], p[1]], [p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 6]], 'chalk', T('khadi'), { w: 2.6, p: 0.95, tout: 0.4 }); }
        A.dot(p[0], p[1], 'chalk', T('gulabi'), { w: 1.8, p: 0.8 });
      } else marigold(A, p[0] + A.rr(-2, 2), p[1] + A.rr(-2, 2), (o.r || 9.5) * A.rr(0.74, 1.22), T, runs[i]);
    });
    // the tassel at its end
    const e = sp[sp.length - 1];
    for (let k = 0; k < 6; k++) A.stroke([e, [e[0] + A.rr(-6, 10), e[1] + A.rr(8, 20)]], 'chalk', T(k % 2 ? 'hingul' : 'haldi'), { w: 1, p: 0.85, tout: 0.5 });
  };

  // loose petals and buds thrown across the floor
  M.petals = function (A, pts, T) {
    for (const q of pts) {
      const kind = q[2] || 'mari', a = A.rr(0, TAU);
      if (kind === 'mari') A.stroke(A.ellipse(q[0], q[1], A.rr(2.8, 4.4), A.rr(1.4, 2.4), a, 0.3, 2.8), 'chalk', T(A.pick(['saffron', 'haldi', 'sindoor', 'peori'])), { w: A.rr(2, 2.8), p: 0.95, reach: 1.5 });
      else if (kind === 'rose') {
        const e = A.roughen(A.ellipse(q[0], q[1], A.rr(3.4, 5), A.rr(2.6, 3.6), a), 0.4, 3, true);
        A.fill(e, 'chalk', T(A.pick(['gulabi', 'rose', 'crimson'])), { w: 2, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
        A.stroke([[q[0] - Math.cos(a) * 2, q[1] - Math.sin(a) * 2], [q[0] + Math.cos(a) * 2, q[1] + Math.sin(a) * 2]], 'chalk', T('lac'), { w: 0.7, p: 0.6 });
      } else if (kind === 'white') A.dot(q[0], q[1], 'chalk', T('khadi'), { w: A.rr(2.2, 3), p: 0.95, ang: a, len: 1.6 });
      else if (kind === 'head') marigold(A, q[0], q[1], A.rr(7, 9), T);
    }
  };

  // the clay lamp on its brass stand; (x, y) the middle of the tray; ang is where the spout points
  // the lamp, its wick and its flame are in m-floor2.js

  /* a pool of lamp light.  A small one (a firefly) is a soft wash.  A large one is rubbed in by hand: the side of a stick
     swung round the flame in short arcs, pressed hard and pale near it, lighter, redder and more broken as it goes out. */
  M.lampGlow = function (A, x, y, R, k, o) {
    o = o || {};
    const sd = A.rr(0, 50), sq = o.sq || 0.92, box = [[x - R, y - R], [x + R, y - R], [x + R, y + R], [x - R, y + R]];
    const d = (px, py) => { const dx = px - x, dy = (py - y) / sq, a = Math.atan2(dy, dx); return Math.hypot(dx, dy) / (R * (1 + 0.07 * (A.noise2(Math.cos(a) * 2 + sd, Math.sin(a) * 2 + sd, 7) - 0.5) * 2)); };
    if (R < 40) {
      const lay = (c, r1, s1, pw) => M.floorWash(A, box, c, (px, py) => { const t = d(px, py) / r1; return t >= 1 ? 0 : s1 * k * Math.pow(1 - sstep(t), pw); });
      lay(o.c0 || '#b4561e', 1, 0.55, 1.4);
      lay(o.c1 || 'saffron', 0.62, 0.55, 1.3);
      lay(o.c2 || 'haldi', 0.32, 0.6, 1.2);
      lay(o.c3 || 'cream', 0.12, 0.7, 1);
      return;
    }
    /* a large pool is scumbled.  The light lies on the floor round the lamp's foot rather than round the flame, and it
       does not reach the same distance every way: it runs out further in two or three tongues and falls short between
       them.  It is laid with the side of the stick in short strokes crossing every way, so the colour catches on the tooth
       and breaks up toward its edge; it is fuller in some places than others; and close to the flame it is rubbed in. */
    const pc = o.at || [x, y], hole = o.hole || (() => 0), zone = o.k || (() => 1), HM = A.HM, S = A.S, W = A.W;
    const bx = o.box || [pc[0] - R * 1.3, pc[1] - R * 1.3, pc[0] + R * 1.3, pc[1] + R * 1.3];
    const pbox = [[bx[0], bx[1]], [bx[2], bx[1]], [bx[2], bx[3]], [bx[0], bx[3]]];
    const ph = [A.rr(0, TAU), A.rr(0, TAU), A.rr(0, TAU)];
    // o.reach(a) gives the same tongues the still picture laid its warmth under, so the two lie together
    const reach = o.reach || (a => 1 + 0.16 * Math.sin(2 * a + ph[0]) + 0.1 * Math.sin(3 * a + ph[1]) + 0.07 * Math.sin(5 * a + ph[2]) + 0.12 * (A.noise2(Math.cos(a) * 1.4 + sd, Math.sin(a) * 1.4, 7) - 0.5));
    const dist = (px, py) => { const dx = px - pc[0], dy = (py - pc[1]) / sq; return Math.hypot(dx, dy) / (R * reach(Math.atan2(dy, dx))); };
    // the strokes: short drags of the stick's side, two ways across each other, and the tooth they skip over
    // the hand turns as it goes, so one way of stroke holds a while, then gives way to the other
    const sA = M.floorDrag(A, 0.35 + A.rr(-0.2, 0.2), 28, 7, sd + 1, 0.8), sB = M.floorDrag(A, 2.05 + A.rr(-0.2, 0.2), 24, 6, sd + 5, 0.8);
    const scum = (px, py) => { const sel = sstep((A.fbm(px / 46 + sd, py / 46 - sd, 2, 8) - 0.5) / 0.16 + 0.5); return clamp(sel * sA(px, py) + (1 - sel) * sB(px, py), 0, 1.6); };
    const blot = (px, py) => 0.62 + 0.76 * A.fbm(px / 66 + sd, py / 66 - sd, 3, 6);
    const tooth = (px, py, t) => { const i = Math.floor(py * S) * W + Math.floor(px * S), h = HM && i >= 0 && i < HM.length ? HM[i] : 0.5; return sstep((h - (0.08 + 0.62 * t * t)) / 0.22 + 0.5); };
    const edge = (px, py) => sstep(Math.min(px - bx[0], bx[2] - px, py - bx[1], bx[3] - py) / (R * 0.12));
    const rK = o.roughK != null ? o.roughK : 1;
    const lay = (c, r1, s1, pw, rough) => M.floorWash(A, pbox, c, (px, py) => {
      const t = dist(px, py) / r1; if (t >= 1) return 0;
      const f = Math.pow(1 - sstep(t), pw), tt = Math.min(1, dist(px, py));
      return s1 * k * f * (1 - rough + rough * scum(px, py) * tooth(px, py, tt)) * blot(px, py) * (1 - 0.72 * hole(px, py)) * zone(px, py) * edge(px, py);
    });
    // the warmth falls away with distance: a burnt red that thins to nothing, saffron inside it, a little haldi near the lamp
    lay(o.c0 || '#b4561e', 1, 0.6, 1.1, 0.6 * rK);
    lay(o.c1 || 'saffron', 0.68, 0.5, 1.25, 0.55 * rK);
    lay(o.c2 || 'haldi', 0.38, 0.48, 1.25, 0.45 * rK);
    // rubbed out with the flat of the finger, round and round, until the pool is one soft bloom
    if (o.bloom) { const circ = A.ellipse(pc[0], pc[1], R * 1.2, R * 1.2 * sq), a1 = A.rr(-0.5, 0.5); A.blend(circ, { r: o.bloom, k: 0.55, ang: a1, len: 70 }); A.blend(circ, { r: o.bloom * 0.8, k: 0.45, ang: a1 + 1.7, len: 60 }); }
    // the air round the flame itself: a small soft light, rubbed round with the finger
    const fl = (c, r1, s1) => M.floorWash(A, [[x - r1, y - r1], [x + r1, y - r1], [x + r1, y + r1], [x - r1, y + r1]], c, (px, py) => { const t = Math.hypot(px - x, (py - y) * 1.15) / (r1 * (0.9 + 0.2 * blot(px, py))); return t >= 1 ? 0 : s1 * k * Math.pow(1 - sstep(t), 1.5) * (0.75 + 0.25 * scum(px, py)); });
    fl(o.c2 || 'haldi', R * 0.2, 0.45);
    fl(o.c3 || 'cream', R * 0.07, 0.6);
    if (o.rub) A.blend([[x - R * 0.22, y - R * 0.22], [x + R * 0.22, y - R * 0.22], [x + R * 0.22, y + R * 0.22], [x - R * 0.22, y + R * 0.22]], { r: o.rub, k: 0.4, len: 30 });
  };

  /* the light a jali lets through.  quad = the four corners of the patch (the window's top-left first, clockwise), in
     the frame where (0,0) is the cel's anchor.  Each opening of the lattice becomes a small pool of light.  o.seed fixes the
     screen, so that the light and the shade laid for the same patch fall in the same places. */
  function jaliField(A, quad, o) {
    const nc = o.cols || 7, nr = o.rows || 5, sd = o.seed != null ? o.seed : A.rr(0, 60);
    const a = quad[0], b = quad[1], cc = quad[2], d = quad[3];
    const ex = b[0] - a[0], ey = b[1] - a[1], fx = d[0] - a[0], fy = d[1] - a[1], gx = a[0] - b[0] + cc[0] - d[0], gy = a[1] - b[1] + cc[1] - d[1];
    const cr = (x1, y1, x2, y2) => x1 * y2 - y1 * x2, k2 = cr(gx, gy, fx, fy);
    // where a floor point lies in the patch: s across the window, t away from it
    const inv = (px, py) => {
      const hx = px - a[0], hy = py - a[1], k1 = cr(ex, ey, fx, fy) + cr(hx, hy, gx, gy), k0 = cr(hx, hy, ex, ey);
      const uOf = v => { const dx = ex + gx * v, dy = ey + gy * v; return Math.abs(dx) > Math.abs(dy) ? (hx - fx * v) / dx : (hy - fy * v) / dy; };
      if (Math.abs(k2) < 1e-6) { const v = -k0 / k1; return [uOf(v), v]; }
      let w = k1 * k1 - 4 * k0 * k2; if (w < 0) return null; w = Math.sqrt(w);
      let v = (-k1 - w) * 0.5 / k2, u = uOf(v);
      if (u < 0 || u > 1 || v < 0 || v > 1) { v = (-k1 + w) * 0.5 / k2; u = uOf(v); }
      return [u, v];
    };
    const hash = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7 + sd) * 43758.5453; return h - Math.floor(h); };
    // vary: how far each opening strays from the last in size, place, softness and brightness (0 is a cut screen);
    // round: 1 turns the stars into the round dapples that leaves outside make of the light; soft: softer edges throughout
    const vary = o.vary || 0, round = o.round || 0, softAll = o.soft || 1, grow0 = o.grow || 0;
    // the stone screen: an eight-pointed star in every bay, a small cross where four bays meet; what passes is light.
    // o.grow opens every star wider, so that what is left of the stone reads as thin bars
    const open = (st, grow, softer) => {
      grow += grow0;
      const v = st[1];
      let U = st[0] * nc, V = v * nr;
      // a screen cut by hand, and light that has come a long way: the pattern wanders a little
      const wu = (0.05 + 0.1 * vary) * (A.noise2(U * 0.6 + sd, V * 0.6, 3) - 0.5), wv = (0.05 + 0.1 * vary) * (A.noise2(U * 0.6, V * 0.6 + sd, 3) - 0.5);
      U += wu; V += wv;
      const i = Math.floor(U), j = Math.floor(V), h1 = hash(i, j), h2 = hash(i + 17, j - 5), h3 = hash(i - 3, j + 29), h4 = hash(i + 7, j + 13);
      const soft = (0.022 + 0.05 * v) * softer * softAll * (1 + vary * 2.2 * h3);
      const x = Math.abs(U - i - 0.5 - vary * 0.22 * (h2 - 0.5)), y = Math.abs(V - j - 0.5 - vary * 0.22 * (h3 - 0.5)), r = (0.285 + grow) * (1 + (0.05 + 0.7 * vary) * (h1 - 0.5));
      // each dapple its own shape: some rounder, some longer, a few pinched
      const ex = 1 + vary * 0.5 * (h4 - 0.5), ey = 1 - vary * 0.5 * (h4 - 0.5);
      const star = Math.min(Math.max(x * ex, y * ey), (x * ex + y * ey) * 0.7071), circ = Math.hypot(x * ex, y * ey) * 0.9;
      const dS = star + (circ - star) * round - r;
      const dim = 1 - vary * 0.6 * h4 * h4;
      const X = Math.abs(U - Math.round(U)), Y = Math.abs(V - Math.round(V));
      /* o.bars: a lattice screen, where what passes is most of the light and the stone throws thin soft bars, a small
         rosette of stone where each two bars cross.  Each bar is cut a little wider or thinner than the next. */
      /* o.barsV 0: only the mullions, the upright bars of the window, thrown as faint soft lines along the light; no
         cross bars, so the beam stays one shape.  Each mullion its own width and softness down its whole length, and
         o.barDepth how much of the light it takes (1, all of it) */
      if (o.bars && o.barsV === 0) {
        const ic = Math.round(U), hc = hash(ic, 3), hd = hash(ic + 5, 11);
        const bu = o.bars * (1 + 0.6 * vary * (hc - 0.5)) - grow * 0.5;
        const sB = (0.022 + 0.05 * v) * softer * softAll * (1 + vary * 1.6 * hd);
        return 1 - (o.barDepth != null ? o.barDepth : 1) * (1 - sstep(0.5 + (X - bu) / sB)) * (0.8 + 0.4 * hd);
      }
      if (o.bars) {
        const bu = o.bars * (1 + 0.5 * vary * (hash(Math.round(U), 3) - 0.5)) - grow * 0.5, bv = o.bars * (1 + 0.5 * vary * (hash(7, Math.round(V)) - 0.5)) - grow * 0.5;
        const dB = Math.min(X - bu, Y - bv), dR = X + Y - (bu + bv) * 1.55;
        return sstep(0.5 + Math.min(dB, dR) / soft) * dim;
      }
      const dC = Math.min(Math.max(X - 0.05 - grow, Y - 0.17 - grow), Math.max(Y - 0.05 - grow, X - 0.17 - grow));
      return Math.max(sstep(0.5 - dS / soft) * dim, sstep(0.5 - dC / soft) * (1 - round));
    };
    // feather: how far in from every side of the patch the light dies away (0, the cut edge of a screen's light; 1, a
    // patch with no edge at all, as the moon's is), the line where it dies wandering a little so it is never ruled
    const fw = o.feather || 0, wob = fw ? (st => 0.8 + 0.4 * A.noise2(st[0] * 3.1 + sd, st[1] * 2.3 - sd, 2)) : (() => 1);
    /* o.arch: the far end of the patch is the window's head thrown on the floor, a cusped arch: a round of small lobes
       with a point between each two.  { h: its height as a part of the patch's length, lobes, depth: how far the points
       come in, soft }.  The line is drawn by eye: the lobes are not all one size and the curve wanders a little. */
    const ar = o.arch, archK = ar ? (st => {
      const h = ar.h || 0.2, dy = (st[1] - (1 - h)) / h; if (dy <= 0) return 1;
      const dx = (st[0] - 0.5) * 2, rho = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
      const nl = ar.lobes || 7, q = phi * nl / PI + 0.06 * Math.sin(phi * 2.3 + sd);
      const r = (1 + (ar.point || 0) * Math.pow(Math.max(0, Math.sin(phi)), 10)) * (1 - (ar.depth || 0.12) * (1 - Math.abs(Math.sin(q * PI))) * (0.8 + 0.4 * A.noise2(q * 0.6 + sd, 0.3, 2)));
      return sstep((r * (1 + 0.025 * (A.noise2(phi * 4 + sd, 1.9, 2) - 0.5)) - rho) / (ar.soft || 0.05) + 0.5);
    }) : null;
    const far = (st, k) => archK ? archK(st) : sstep((1 - st[1]) / k);
    /* under the arch's head the screen gives way: by ar.clear the lattice there thins to nothing, so the cusped head
       reads whole, with a heavier bar of stone (the transom) where the head springs from the screen */
    const openA = !ar ? open : (st, grow, softer) => {
      const op = open(st, grow, softer), h = ar.h || 0.2, dy = (st[1] - (1 - h)) / h, tw = ar.transom || 0;
      let r = op;
      if (ar.clear && dy > 0) r += (1 - op) * ar.clear * sstep(dy / 0.22);
      if (tw) r *= 1 - (ar.transomDepth != null ? ar.transomDepth : 0.9) * (1 - sstep((Math.abs(dy) * h * nr - tw) / (0.06 * softer * softAll) + 0.5));
      return r;
    };
    const fade = st => { const w = wob(st); return sstep(Math.min(st[0], 1 - st[0]) / ((0.045 + fw * 0.34) * w)) * sstep(st[1] / ((0.035 + fw * 0.34) * w)) * far(st, (0.1 + fw * 0.36) * w); };
    // and the open head, with no stone in it, lets through more than the screen does (ar.boost)
    const headK = !ar || !ar.boost ? (() => 1) : (st => { const dy = (st[1] - (1 - (ar.h || 0.2))) / (ar.h || 0.2); return dy <= 0 ? 1 : 1 + ar.boost * sstep(dy / 0.3); });
    const light = (st, grow, softer) => { const f = fade(st); return f <= 0 ? 0 : f * openA(st, grow, softer) * (1 - (ar ? 0.1 : 0.3) * st[1]) * headK(st); };
    const inside = st => { const w = wob(st); return sstep(Math.min(st[0], 1 - st[0]) / ((0.06 + fw * 0.36) * w)) * sstep(st[1] / ((0.05 + fw * 0.36) * w)) * far(st, (0.2 + fw * 0.3) * w); };
    const grain = (px, py) => 0.88 + 0.24 * A.noise2(px / 6 + sd, py / 6, 2);
    const at = (px, py) => { const st = inv(px, py); return st && st[0] >= 0 && st[0] <= 1 && st[1] >= 0 && st[1] <= 1 ? st : null; };
    const bb = [Math.min(a[0], b[0], cc[0], d[0]), Math.min(a[1], b[1], cc[1], d[1]), Math.max(a[0], b[0], cc[0], d[0]), Math.max(a[1], b[1], cc[1], d[1])];
    const box = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[2], bb[3]], [bb[0], bb[3]]];
    // the patch's width across the window and its length away from it, in floor units, for distances outside it
    const wide = Math.abs(cr(fx, fy, ex, ey)) / Math.max(1e-6, Math.hypot(fx, fy)), long = Math.hypot(fx, fy);
    return { at, uv: inv, open: openA, light, inside, edge: fade, grain, box, wide, long };
  }

  // the light as a smooth wash (kept for a faint light where strokes would be too much)
  M.jaliLight = function (A, quad, o) {
    o = o || {};
    const F = jaliField(A, quad, o), c = o.c || '#ffe1a6', c2 = o.c2 || '#fff1cf', pw = o.p || 0.55, amb = o.amb != null ? o.amb : 0.1;
    M.floorWash(A, F.box, c, (px, py) => { const st = F.at(px, py); return st ? (amb * F.inside(st) + pw * 0.8 * F.light(st, 0.03, 1.8)) * F.grain(px, py) : 0; });
    M.floorWash(A, F.box, c2, (px, py) => { const st = F.at(px, py); return st ? pw * F.light(st, -0.015, 1) * F.grain(px, py) : 0; });
  };

  /* the same light laid by hand: the side of a pastel stick dragged through every opening along the way the light came,
     so the strokes show and break on the tooth; then the bright hearts pressed in with the tip in short strokes. */
  M.jaliScumble = function (A, quad, o) {
    o = o || {};
    const F = jaliField(A, quad, o), pw = o.p || 0.55, amb = o.amb != null ? o.amb : 0.08, ang = o.ang != null ? o.ang : 0.4, sd = (o.seed || 0) * 1.7 + 3;
    const len = o.len || 40, wid = o.wid || 2.4, da = o.drag != null ? o.drag : 0.9;
    const drag = M.floorDrag(A, ang, len, wid, sd, da), drag2 = M.floorDrag(A, ang + 0.08, len * 0.6, wid * 0.8, sd + 9, da * 0.78);
    // k(x, y): what lies under the light asks for less of it here (a folio's foot, where its words are written)
    const k = o.k || (() => 1);
    // the hand did not press evenly: the light is fuller in some places than others, in slow broad clouds
    const uneven = o.uneven ? (px, py) => 1 - o.uneven + o.uneven * 1.6 * A.fbm(px / 85 + sd, py / 85 - sd, 3, 4) : () => 1;
    // the side of the stick through the air of the patch and the openings, its drag showing
    M.floorWash(A, F.box, o.c || '#f0a838', (px, py) => { const st = F.at(px, py); return st ? (amb * F.inside(st) + pw * 0.7 * F.light(st, 0.03, 1.8)) * drag(px, py) * uneven(px, py) * k(px, py) : 0; });
    // the hearts of the openings pressed in harder, pale and warm
    M.floorWash(A, F.box, o.c2 || '#ffd98a', (px, py) => { const st = F.at(px, py); return st ? Math.min(1, pw * 1.3 * F.light(st, -0.02, 1)) * drag2(px, py) * uneven(px, py) * k(px, py) : 0; });
    // then rubbed with a finger, so the edges of the openings go soft and the light runs a little into the shade
    // (o.rubAng: the finger went along the light instead of across it, so the long sides keep their line)
    // (an arch's head is left unrubbed, so its cusps keep their line)
    const rubIn = !o.arch ? F.box : (() => { const t = 1 - (o.arch.h || 0.2) * 1.05, q = quad; return [q[0], q[1], [q[1][0] + (q[2][0] - q[1][0]) * t, q[1][1] + (q[2][1] - q[1][1]) * t], [q[0][0] + (q[3][0] - q[0][0]) * t, q[0][1] + (q[3][1] - q[0][1]) * t]]; })();
    if (o.rub) { const ra = o.rubAng != null ? o.rubAng : null; A.blend(rubIn, { r: o.rub, k: 0.4, ang: ra != null ? ra + A.rr(-0.1, 0.1) : ang + 1.2 + A.rr(-0.3, 0.3), len: 18 }); A.blend(rubIn, { r: o.rub * 0.8, k: 0.3, ang: ra != null ? ra - 0.12 : ang - 0.9, len: 14 }); }
    // and where the light finds grains of gold on the floor, they flash
    if (o.glints) {
      const bb = F.box, g = o.glintOk || (() => true);
      for (let i = 0, tries = 0; i < o.glints && tries < o.glints * 60; tries++) {
        const px = A.rr(bb[0][0], bb[1][0]), py = A.rr(bb[0][1], bb[2][1]), st = F.at(px, py);
        if (!st || F.light(st, 0, 1) < 0.55 || !g(px, py)) continue;
        i++;
        const s = A.rr(0.7, 1.3), a = A.rr(-0.3, 0.3);
        A.dot(px, py, 'chalk', o.gc || '#ffe9a0', { w: 3.2 * s, p: 0.4 });
        for (let j = 0; j < 4; j++) { const b = a + j * PI / 2, l = (j % 2 ? 2.4 : 3.8) * s; A.stroke([[px - Math.cos(b) * 0.4, py - Math.sin(b) * 0.4], [px + Math.cos(b) * l, py + Math.sin(b) * l]], 'chalk', '#fff6d8', { w: 0.55, p: 0.8, tin: 0, tout: 0.8 }); }
        A.dot(px, py, 'chalk', '#fffbea', { w: 1.3 * s, p: 0.95 });
      }
    }
  };

  /* for the multiplying layer: the stone between the openings as a cool, clear glaze of indigo, and the openings glazed
     warm, so that what the light lifts reads as gold and not as grey */
  M.jaliTint = function (A, quad, o) {
    o = o || {};
    const F = jaliField(A, quad, o), ang = o.ang != null ? o.ang : 0.4, sd = (o.seed || 0) * 2.3 + 5, da = o.drag != null ? o.drag : 0.8, k = o.k || (() => 1);
    const drag = M.floorDrag(A, ang - 0.1, o.len || 40, o.wid || 2.6, sd, da), drag2 = M.floorDrag(A, ang, (o.len || 40) * 0.7, o.wid || 2.4, sd + 4, da * 0.75);
    if (o.cool) M.floorWash(A, F.box, o.cool, (px, py) => { const st = F.at(px, py); return st ? o.pc * F.inside(st) * (1 - F.open(st, 0.05, 2.2)) * drag(px, py) * k(px, py) : 0; });
    // (o.kWarm: where the warm glaze alone is laid thinner, as on a pale floor, where it would read as paint)
    const kW = o.kWarm || (() => 1);
    if (o.warm) M.floorWash(A, F.box, o.warm, (px, py) => { const st = F.at(px, py); return st ? o.pw * F.light(st, 0.0, 1.4) * drag2(px, py) * k(px, py) * kW(px, py) : 0; });
    /* o.halo { c, p, r }: just outside the light the floor is laid a little cooler and lower, so that the light reads
       against it; it goes out r floor units, the line where it stops wandering, and none of it lies in the light */
    if (o.halo) {
      const h = o.halo, bb = F.box, m = h.r * 1.4, sh = sd + 13;
      const hb = [[bb[0][0] - m, bb[0][1] - m], [bb[1][0] + m, bb[0][1] - m], [bb[1][0] + m, bb[2][1] + m], [bb[0][0] - m, bb[2][1] + m]];
      M.floorWash(A, hb, h.c, (px, py) => {
        const st = F.uv(px, py); if (!st) return 0;
        const du = Math.max(0, -st[0], st[0] - 1) * F.wide, dv = Math.max(0, -st[1], st[1] - 1) * F.long, d = Math.hypot(du, dv);
        const r = h.r * (0.75 + 0.5 * A.noise2(px / 34 + sh, py / 34 - sh, 2));
        if (d >= r) return 0;
        const lit = d > 0 ? 0 : F.edge(st);
        return h.p * (1 - sstep(d / r)) * (1 - lit) * drag(px, py) * k(px, py);
      });
    }
  };

  M.leafShadows = function (A, x, y, len, ang, c, o) {
    o = o || {};
    const ph = o.ph || 0, p0 = o.p || 0.4, all = [];
    const twig = (x0, y0, L, a0, bend, depth) => {
      const stem = []; for (let t = 0; t <= 1.001; t += 0.04) { const bw = Math.sin(t * PI) * L * 0.1 * bend + Math.sin(ph * 0.8 + t * 2) * L * 0.02; stem.push([x0 + Math.cos(a0) * L * t - Math.sin(a0) * bw, y0 + Math.sin(a0) * L * t + Math.cos(a0) * bw]); }
      { const sw = depth ? 1.1 : 1.7, l = [], r = []; for (let i = 0; i < stem.length; i++) { const q = stem[i], nq = stem[Math.min(stem.length - 1, i + 1)], pq = stem[Math.max(0, i - 1)], sa = Math.atan2(nq[1] - pq[1], nq[0] - pq[0]), ww = sw * (1 - 0.5 * i / stem.length); l.push([q[0] - Math.sin(sa) * ww, q[1] + Math.cos(sa) * ww]); r.push([q[0] + Math.sin(sa) * ww, q[1] - Math.cos(sa) * ww]); } all.push(l.concat(r.reverse())); }
      // leaflets in pairs along the stem, the last one alone at the tip
      const n = depth ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const t = 0.2 + 0.8 * i / n, k = Math.round(t * (stem.length - 1)), q = stem[k], nq = stem[Math.min(stem.length - 1, k + 1)], sa = Math.atan2(nq[1] - q[1], nq[0] - q[0]);
        for (const sg of [-1, 1]) {
          const a = sa + sg * (0.75 + A.rr(-0.15, 0.15)) + Math.sin(ph + i * 1.7) * 0.15, Ll = L * (depth ? 0.17 : 0.13) * A.rr(0.8, 1.15), wd = Ll * 0.24, tip = [q[0] + Math.cos(a) * Ll, q[1] + Math.sin(a) * Ll], m = [(q[0] + tip[0]) / 2, (q[1] + tip[1]) / 2];
          const lf = A.spline([q, [m[0] - Math.sin(a) * wd, m[1] + Math.cos(a) * wd], tip, [m[0] + Math.sin(a) * wd * 0.8, m[1] - Math.cos(a) * wd * 0.8]], true, 1.5);
          all.push(lf);
        }
      }
      const e = stem[stem.length - 1], ea = Math.atan2(e[1] - stem[stem.length - 2][1], e[0] - stem[stem.length - 2][0]), Le = L * 0.14, te = [e[0] + Math.cos(ea) * Le, e[1] + Math.sin(ea) * Le];
      const lf = A.spline([e, [(e[0] + te[0]) / 2 - Math.sin(ea) * Le * 0.22, (e[1] + te[1]) / 2 + Math.cos(ea) * Le * 0.22], te, [(e[0] + te[0]) / 2 + Math.sin(ea) * Le * 0.22, (e[1] + te[1]) / 2 - Math.cos(ea) * Le * 0.22]], true, 1.5);
      all.push(lf);
      return stem;
    };
    const main = twig(x, y, len * 0.55, ang, o.bend || 1, 0);
    // two side twigs off the main one
    for (const t of [0.45, 0.85]) { const k = Math.round(t * (main.length - 1)), q = main[k]; twig(q[0], q[1], len * 0.5, ang + (t < 0.6 ? 0.55 : -0.5) + Math.sin(ph) * 0.06, 0.8, 1); }
    const sd = A.rr(0, 40), zk = o.k || (() => 1);
    M.floorUnion(A, all, c, (px, py) => p0 * (0.86 + 0.28 * A.noise2(px / 40 + sd, py / 40, 3)) * zk(px, py), (o.blur || 4) * A.S * 0.45, null, o.paint);
  };

  // a mote of dust turning in the light
  M.mote = function (A, x, y, s, c) {
    A.dot(x, y, 'pastel', c || '#fff0c8', { w: 5 * s, p: 0.28, len: 0.4, hard: 1.2 });
    A.dot(x, y, 'chalk', c || '#fff6dc', { w: 1.6 * s, p: 0.9, len: 0.3 });
  };

  /* ================================================================== ROUND FOUR: MORE THINGS ON THE FLOOR */

  // a mussel shell used as a pigment dish: long, pointed at the hinge, blue-black outside, pearl inside
  M.musselShell = function (A, x, y, s, ang, pig, T) {
    const P = (u, v) => add([x, y], rot([u * s, v * s], ang)), j = () => A.rr(-0.012, 0.012);
    const OUT = [[-0.52, 0.04], [-0.43, -0.07], [-0.25, -0.16], [0.02, -0.22], [0.28, -0.235], [0.45, -0.16], [0.52, -0.01], [0.47, 0.13], [0.3, 0.19], [0.05, 0.18], [-0.19, 0.14], [-0.39, 0.09]];
    const sh = A.roughen(A.spline(OUT.map(q => P(q[0] + j(), q[1] + j())), true, 1), s * 0.007, s * 0.2, true);
    const inner = A.roughen(A.spline(OUT.map(q => P(q[0] * 0.86 + 0.02, q[1] * 0.74 - 0.006)), true, 1), s * 0.005, s * 0.2, true);
    shadowOf(A, sh, T, 2.6, 4, 0.42);
    A.fill(sh, 'pastel', T(A.mix('neel', 'kajal', 0.4)), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    // a violet sheen on the outer lip where the window catches it
    A.withMask(sh, () => A.stroke(A.spline([P(-0.32, -0.15), P(0.02, -0.25), P(0.36, -0.22)], false, 1), 'chalk', T(A.mix('lapis', 'lilac', 0.45)), { w: s * 0.035, p: 0.5, tin: 0.3, tout: 0.4 }));
    A.fill(inner, 'pastel', T(A.mix('ice', 'khadi', 0.45)), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ang + 0.5 });
    A.withMask(inner, () => {
      // the nacre: cold blue toward the hinge, pearl and a little lilac toward the lip
      A.fill(A.ellipse(...P(-0.28, 0.0), s * 0.2, s * 0.1, ang), 'side', T(A.mix('lapis', 'ice', 0.55)), { w: 6, p: 0.42 });
      A.fill(A.ellipse(...P(0.2, -0.06), s * 0.2, s * 0.09, ang), 'side', T('lilac'), { w: 6, p: 0.32 });
      A.blend(inner, { r: 2.4, k: 0.45 });
      const hp = P(-0.5, 0.04);
      for (let k = 1; k < 6; k++) A.stroke(A.ellipse(hp[0], hp[1], s * 0.19 * k, s * 0.085 * k, ang, -1.0, 1.0), 'chalk', T(k % 2 ? 'stone' : 'lilac'), { w: 0.45, p: 0.4 });
      // the cake of colour, set toward the broad end
      const c = T(pig), dk = A.mix(c, 'kajal', 0.28), lt = A.mix(c, 'khadi', 0.35), m = P(0.13, -0.02);
      const pc = A.roughen(A.ellipse(m[0], m[1], s * 0.24, s * 0.1, ang + A.rr(-0.15, 0.15)), s * 0.025, s * 0.14, true);
      A.fill(pc, 'pastel', c, { w: 2.2, p: 1, reach: 1.7, passes: 2, gap: 0.38, ang: ang + 0.5 });
      A.withMask(pc, () => {
        A.outline(pc, 'side', dk, { closed: true, w: s * 0.05, p: 0.55 });
        const a0 = A.rr(0, TAU); A.stroke(A.ellipse(m[0], m[1], s * 0.13, s * 0.05, ang, a0, a0 + 2.6), 'chalk', lt, { w: s * 0.04, p: 0.6 });
        for (let k = 0; k < 8; k++) A.dot(m[0] + A.rr(-s * 0.18, s * 0.18), m[1] + A.rr(-s * 0.07, s * 0.07), 'chalk', A.chance(0.5) ? lt : dk, { w: A.rr(0.7, 1.5), p: 0.65 });
      });
      A.outline(pc, 'kajal', A.mix(c, 'kajal', 0.55), { closed: true, w: 0.45, p: 0.45, again: 0 });
    });
    A.outline(inner, 'chalk', T(A.mix('neel', 'kajal', 0.2)), { closed: true, w: 1.1, p: 0.55 });
    A.outline(sh, 'kajal', T('kajal'), { closed: true, w: 0.7, p: 0.7 });
    const hp = P(-0.5, 0.04); A.dot(hp[0], hp[1], 'chalk', T(A.mix('neel', 'stone', 0.4)), { w: s * 0.05, p: 0.8, ang });
  };

  // a small saucer of unglazed clay for mixing: thrown fast, its rim out of true and chipped once; colour dried in its hollow
  M.clayDish = function (A, x, y, r, pig, T) {
    const clay = T(A.mix('geru', 'peach', 0.32)), clayD = T(A.mix('brick', 'umber', 0.45)), clayL = T(A.mix('peach', 'khadi', 0.35));
    const outer = A.roughen(handRing(A, x, y, r, r * A.rr(0.94, 0.98), 0.035), r * 0.012, r * 0.4, true);
    shadowOf(A, outer, T, 2.4, 3.6, 0.42);
    A.fill(outer, 'pastel', clay, { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(outer, () => {
      A.stroke(press(A, handRing(A, x, y, r * 0.86, r * 0.84, 0.02, 2.5, 5.3), 0.4), 'side', clayL, { w: r * 0.2, p: 0.6 });
      A.stroke(press(A, handRing(A, x, y, r * 0.86, r * 0.84, 0.02, 5.7, 8.4), 0.4), 'side', clayD, { w: r * 0.18, p: 0.5 });
      for (let k = 0; k < 3; k++) { const a0 = A.rr(0, TAU); A.stroke(handRing(A, x, y, r * A.rr(0.78, 0.94), r * A.rr(0.76, 0.92), 0.01, a0, a0 + A.rr(0.8, 1.8)), 'chalk', T(A.mix('geru', 'umber', 0.3)), { w: 0.5, p: 0.35 }); }
    });
    const hc = [x + r * A.rr(0.01, 0.05), y + r * A.rr(0.02, 0.06)];
    const hollow = A.roughen(handRing(A, hc[0], hc[1], r * 0.66, r * 0.62, 0.035), r * 0.01, r * 0.3, true);
    A.fill(hollow, 'pastel', T(A.mix('geru', 'umber', 0.28)), { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    const c = T(pig), dk = A.mix(c, 'kajal', 0.25), lt = A.mix(c, 'khadi', 0.35);
    const pool = A.roughen(handRing(A, hc[0] + r * 0.04, hc[1] + r * 0.05, r * 0.5, r * 0.44, 0.07), r * 0.03, r * 0.3, true);
    A.fill(pool, 'pastel', c, { w: 2.2, p: 1, reach: 1.6, passes: 2, gap: 0.4 });
    A.withMask(pool, () => {
      A.outline(pool, 'side', dk, { closed: true, w: r * 0.12, p: 0.5 });
      const a0 = A.rr(0, TAU), m = [hc[0] + r * 0.04, hc[1] + r * 0.05];
      A.stroke(A.ellipse(m[0], m[1], r * 0.26, r * 0.2, 0, a0, a0 + 2.6), 'chalk', lt, { w: r * 0.09, p: 0.6 });
      A.smudge(A.ellipse(m[0], m[1], r * 0.24, r * 0.18, 0, a0, a0 + 2.2), { r: 1.8, k: 0.55 });
      if (A.chance(0.6)) crack(A, m[0] - r * 0.2, m[1], r * 0.4, A.rr(-0.5, 0.5), dk, 1);
    });
    A.outline(pool, 'kajal', A.mix(c, 'kajal', 0.5), { closed: true, w: 0.42, p: 0.42, again: 0 });
    A.outline(press(A, hollow, 0.3, 5), 'kajal', T('sepia'), { closed: true, w: 0.55, p: 0.5, again: 0 });
    A.outline(press(A, outer, 0.4, 5), 'kajal', T('sepia'), { closed: true, w: 0.8, p: 0.7 });
    // a chip out of the rim, the paler body of the clay showing
    { const a = A.rr(-1.2, 0.6), q = [x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.93]; A.dot(q[0], q[1], 'chalk', clayL, { w: r * 0.18, p: 0.85, len: 0.9, ang: a + PI / 2 }); A.stroke(A.ellipse(q[0], q[1], r * 0.1, r * 0.06, a + PI / 2, PI, TAU), 'kajal', clayD, { w: 0.5, p: 0.6 }); }
  };

  // a cowrie, lying mouth up: a glossy cream oval, the long toothed slit down its middle, a highlight from the window
  M.cowrie = function (A, x, y, s, ang, T) {
    const P = (u, v) => add([x, y], rot([u * s, v * s], ang));
    const ov = A.roughen(A.spline([P(-0.5, 0), P(-0.38, -0.27), P(-0.05, -0.36), P(0.3, -0.31), P(0.5, -0.04), P(0.44, 0.24), P(0.1, 0.36), P(-0.26, 0.32), P(-0.47, 0.17)], true, 1), s * 0.006, s * 0.25, true);
    shadowOf(A, ov, T, 2.2, 3.4, 0.45);
    A.fill(ov, 'pastel', T(A.mix('cream', 'khadi', 0.55)), { w: 2.4, p: 1, reach: 1.6, passes: 2, gap: 0.4, ang });
    A.withMask(ov, () => {
      // the edges roll away toward the floor: a warm grey under them, the base a little yellowed
      A.outline(ov, 'side', T(A.mix('sand', 'stone', 0.5)), { closed: true, w: s * 0.14, p: 0.5 });
      A.fill(A.ellipse(...P(0.02, 0.02), s * 0.3, s * 0.18, ang), 'side', T(A.mix('cream', 'peach', 0.3)), { w: 6, p: 0.25 });
      A.blend(ov, { r: 2, k: 0.4 });
      // the slit, curved a little, and the teeth on both lips of it
      const slit = A.spline([P(-0.44, 0.03), P(-0.2, -0.015), P(0.1, 0.0), P(0.44, 0.04)], false, 1);
      A.stroke(slit, 'kajal', T(A.mix('umber', 'sepia', 0.5)), { w: s * 0.06, p: 0.85, tin: 0.25, tout: 0.25 });
      const rs = A.resample(slit, s * 0.065, false);
      rs.forEach((q, i) => { if (i === 0 || i === rs.length - 1) return; for (const sg of [-1, 1]) { const d = rot([0, sg * s * A.rr(0.07, 0.1)], ang); A.stroke([[q[0] + d[0] * 0.35, q[1] + d[1] * 0.35], [q[0] + d[0], q[1] + d[1]]], 'kajal', T(A.mix('umber', 'sand', 0.3)), { w: 0.5, p: 0.6 }); } });
      A.stroke([P(-0.3, -0.2), P(0.0, -0.27), P(0.26, -0.22)], 'chalk', T('#fffaf0'), { w: s * 0.05, p: 0.75, tin: 0.3, tout: 0.4 });
      A.dot(...P(-0.12, -0.25), 'chalk', T('#ffffff'), { w: 1.4, p: 0.9 });
    });
    A.outline(ov, 'kajal', T(A.mix('sepia', 'sand', 0.3)), { closed: true, w: 0.6, p: 0.6 });
  };

  /* a round brass weight, set on a sheet's corner to hold it flat: a squat disc with a knob in its middle, a ring of
     punched dots, lit toward the window, its shadow down and to the right on the paper */
  M.brassWeight = function (A, x, y, r, T) {
    softShadow(A, handRing(A, x, y, r, r, 0.01), T, r * 0.22, r * 0.3, 0.5, r * 0.12);
    const disc = A.roughen(handRing(A, x, y, r, r * 0.98, 0.012), r * 0.008, r * 0.3, true);
    A.fill(disc, 'pastel', T(A.mix('ochre', 'umber', 0.15)), { w: 2.4, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(disc, () => {
      A.stroke(press(A, handRing(A, x, y, r * 0.8, r * 0.8, 0.02, 2.5, 5.4), 0.5), 'side', T('haldi'), { w: r * 0.36, p: 0.7 });
      A.stroke(press(A, handRing(A, x, y, r * 0.84, r * 0.84, 0.02, 5.8, 8.6), 0.5), 'side', T(A.mix('umber', 'sepia', 0.3)), { w: r * 0.3, p: 0.6 });
      A.blend(disc, { r: r * 0.08, k: 0.35 });
      // the punched ring
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + A.rr(-0.05, 0.05), q = [x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66]; A.dot(q[0], q[1], 'kajal', T('sepia'), { w: A.rr(0.7, 1), p: 0.55 }); }
      // the knob: a small dome, bright on its top-left, dark under its right
      const kn = handRing(A, x + r * 0.03, y + r * 0.03, r * 0.34, r * 0.34, 0.03);
      A.fill(kn, 'pastel', T('ochre'), { w: 1.6, p: 1, passes: 2, gap: 0.42 });
      A.withMask(kn, () => { A.dot(x - r * 0.08, y - r * 0.08, 'chalk', T('cream'), { w: r * 0.3, p: 0.7 }); A.stroke(handRing(A, x + r * 0.03, y + r * 0.03, r * 0.3, r * 0.3, 0.02, 5.8, 8.4), 'side', T('umber'), { w: r * 0.14, p: 0.55 }); });
      A.outline(kn, 'kajal', T('sepia'), { closed: true, w: 0.55, p: 0.6 });
      A.dot(x - r * 0.12, y - r * 0.12, 'chalk', T('#fffaf0'), { w: 1.3, p: 0.95 });
      // the gleam on the rim toward the window, in two short pulls
      for (let k = 0; k < 2; k++) { const b0 = 3.5 + k * 0.62 + A.rr(-0.05, 0.05), pts = []; for (let t = 0; t <= 1.001; t += 0.125) { const a = b0 + 0.45 * t; pts.push([x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, 0.35 + 0.65 * Math.sin(PI * t)]); } A.stroke(pts, 'chalk', T('#fff4d2'), { w: r * 0.12, p: 0.85, tin: 0.2, tout: 0.3 }); }
    });
    A.outline(press(A, disc, 0.45, 5), 'kajal', T('sepia'), { closed: true, w: 0.8, p: 0.8 });
  };

  /* a pricked stencil, a charba: thin paper with a lotus on its stem and a running border pricked through it in pin-holes,
     pounced with charcoal so the design goes through as dots onto the sheet under it.  Laid aside, half off the top. */
  M.charba = function (A, x, y, w, h, ang, T) {
    const P = (u, v) => add([x, y], rot([u, v], ang)), hw = w / 2, hh = h / 2;
    const paper = A.roughen([P(-hw, -hh), P(hw * 0.1, -hh - 2), P(hw, -hh + 1), P(hw + 1.5, hh * 0.15), P(hw - 2, hh), P(hw * 0.35, hh + 1.5), P(-hw * 0.4, hh - 1), P(-hw - 1, hh + 1)], 1.3, 7, true);
    shadowOf(A, paper, T, 1.8, 2.6, 0.28);
    // a tracing paper: thin, the floor showing through it, its fibres and one crease
    A.fill(paper, 'side', T(A.mix('khadi', 'sand', 0.22)), { w: 10, p: 0.6, passes: 2, ang: ang + 0.3 });
    A.withMask(paper, () => {
      for (let i = 0; i < 40; i++) { const q = P(A.rr(-hw, hw), A.rr(-hh, hh)), a = A.rr(0, TAU), l = A.rr(2, 6); A.stroke([q, [q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]], 'chalk', T('stone'), { w: 0.4, p: 0.35 }); }
      A.stroke([P(hw * 0.28, -hh), P(hw * 0.31, hh)], 'chalk', T('#fffaf0'), { w: 0.8, p: 0.5 });
      A.stroke([P(hw * 0.28 + 1.4, -hh), P(hw * 0.31 + 1.4, hh)], 'chalk', T('stone'), { w: 0.6, p: 0.4 });
    });
    // the design: a lotus with a leaf on the left, a running scallop along the right
    const L0 = [-hw * 0.42, 4], Lp = (u, v) => P(L0[0] + u, L0[1] + v), paths = [];
    paths.push([A.spline([[0, -27], [7, -13], [6, 1], [0, 7], [-6, 1], [-7, -13]].map(q => Lp(q[0], q[1])), true, 1), true]);
    for (const sg of [-1, 1]) {
      paths.push([A.spline([[sg * 4, 5], [sg * 16, -6], [sg * 25, -17], [sg * 15, -1], [sg * 6, 8]].map(q => Lp(q[0], q[1])), true, 1), true]);
      paths.push([A.spline([[sg * 6, 9], [sg * 27, 4], [sg * 37, -4], [sg * 24, 11], [sg * 5, 13]].map(q => Lp(q[0], q[1])), true, 1), true]);
    }
    paths.push([A.spline([[-13, 13], [0, 17], [13, 13]].map(q => Lp(q[0], q[1])), false, 1), false]);
    paths.push([A.spline([[0, 17], [2, 25], [-1, 33], [1, 40]].map(q => Lp(q[0], q[1])), false, 1), false]);
    paths.push([A.spline([[1, 29], [-14, 22], [-30, 26], [-16, 33], [1, 30]].map(q => Lp(q[0], q[1])), true, 1), true]);
    { const sc = []; for (let u = -hw * 0.02; u <= hw * 0.86; u += 2) sc.push(P(u, 16 - Math.abs(Math.sin((u + hw) / 9)) * 6)); paths.push([sc, false]); }
    { const sc = []; for (let u = -hw * 0.02; u <= hw * 0.86; u += 2) sc.push(P(u, 24)); paths.push([sc, false]); }
    // the pounce, rubbed through: a grey bloom of charcoal over the design, fuller in the middle
    const sd = A.rr(0, 40), cen = Lp(0, 4);
    M.floorWash(A, paper, T('ash'), (px, py) => 0.16 * (1 - sstep(Math.hypot(px - cen[0], (py - cen[1]) * 1.3) / 56)) * (0.6 + 0.8 * A.fbm(px / 18 + sd, py / 18, 3, 4)));
    // and the holes, one by one: a dark point with a grey halo, not in a perfect row
    for (const [pth, cl] of paths) for (const q of A.resample(pth, 2.7, cl)) {
      const jx = A.rr(-0.35, 0.35), jy = A.rr(-0.35, 0.35);
      A.dot(q[0] + jx, q[1] + jy, 'chalk', T('ash'), { w: 2.2, p: 0.16 });
      A.dot(q[0] + jx, q[1] + jy, 'chalk', T(A.mix('kajal', 'ash', 0.25)), { w: A.rr(0.7, 1.05), p: 0.8 });
    }
    // a corner folded back
    { const f1 = P(-hw + 22, hh + 1), f2 = P(-hw - 1, hh - 18), tip = P(-hw + 15, hh - 14);
      A.fill([f1, f2, tip], 'pastel', T(A.mix('khadi', 'stone', 0.25)), { w: 2, p: 0.95, passes: 2, gap: 0.45 });
      A.stroke([f1, tip, f2], 'kajal', T(A.mix('stone', 'sepia', 0.3)), { w: 0.45, p: 0.5 }); }
    A.outline(paper, 'kajal', T(A.mix('stone', 'sepia', 0.35)), { closed: true, w: 0.5, p: 0.45 });
  };

  /* the pounce bag: a bundle of muslin with powdered charcoal in it, gathered and tied off at the neck with a red thread.
     The cloth is soft and full at the bottom where the powder sits, grey where it comes through the weave; round it on the
     floor, the grey breath where it was dabbed */
  M.pounceBag = function (A, x, y, r, ang, T) {
    const cloth = T(A.mix('khadi', 'cream', 0.3)), clothS = T(A.mix('stone', 'sand', 0.35)), dust = T(A.mix('ash', 'kajal', 0.25));
    const B = (u, v) => add([x, y], rot([u * r, v * r], ang)), nk = B(0.98, 0), Q = (u, v) => add(nk, rot([u * r, v * r], ang));
    const sd = A.rr(0, 30);
    // the dust on the floor, rubbed soft, fuller on the side it was set down
    { const dc = B(-0.4, 0.5);
      M.floorWash(A, A.ellipse(dc[0], dc[1], r * 3, r * 2.5, ang), dust, (px, py) => { const d = Math.hypot((px - dc[0]) / (r * 2.6), (py - dc[1]) / (r * 2.1)); return 0.34 * (1 - sstep(d)) * (0.45 + 0.9 * A.fbm(px / 8 + sd, py / 8, 3, 4)); });
      for (let i = 0; i < 22; i++) { const a = A.rr(0, TAU), d = r * (1.1 + Math.pow(A.rnd(), 1.3) * 1.3); A.dot(dc[0] + Math.cos(a) * d, dc[1] + Math.sin(a) * d * 0.8, 'chalk', dust, { w: A.rr(0.5, 1.1), p: A.rr(0.1, 0.24) }); }
      A.smudge([[dc[0] - r * 1.5, dc[1] + r * 0.4], [dc[0], dc[1] + r * 0.9], [dc[0] + r * 1.2, dc[1] + r * 0.5]], { r: r * 0.3, k: 0.4 }); }
    // the bundle: round and slumped, pinched in toward the neck
    const body = A.roughen(A.spline([B(-1, 0.04), B(-0.88, -0.6), B(-0.32, -0.94), B(0.34, -0.8), B(0.78, -0.4), B(0.99, -0.13), B(0.99, 0.13), B(0.8, 0.44), B(0.36, 0.88), B(-0.3, 0.98), B(-0.86, 0.64)], true, 0.6), r * 0.025, r * 0.4, true);
    // the gathered top: the cloth stands up past the tie in a few soft points
    const tips = [[0.42, -0.5], [0.8, -0.3], [0.9, 0.08], [0.7, 0.42], [0.32, 0.5]];
    const ear = A.roughen(A.spline([Q(-0.06, -0.22), Q(tips[0][0], tips[0][1]), Q(0.6, -0.36), Q(tips[1][0], tips[1][1]), Q(0.8, -0.1), Q(tips[2][0], tips[2][1]), Q(0.8, 0.26), Q(tips[3][0], tips[3][1]), Q(0.5, 0.42), Q(tips[4][0], tips[4][1]), Q(-0.06, 0.22)], true, 0.7), r * 0.02, r * 0.25, true);
    softShadow(A, body, T, 2.2, 3, 0.42, 2.4); softShadow(A, ear, T, 1.8, 2.6, 0.3, 2);
    for (const pl of [body, ear]) {
      A.fill(pl, 'pastel', cloth, { w: 2.2, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
      A.withMask(pl, () => {
        if (pl === body) {
          // the folds drawn in to the tie: each a soft ridge of pale with its shade beside it, laid with the side of the stick
          for (let k = 0; k < 6; k++) {
            const a = ang + PI + (k - 2.5) * 0.48 + A.rr(-0.1, 0.1), q = [x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 0.94], m = [(q[0] + nk[0]) / 2 + A.rr(-1, 1), (q[1] + nk[1]) / 2 + A.rr(-1, 1)];
            A.stroke([q, m, nk], 'side', T('khadi'), { w: r * 0.16, p: 0.4, tin: 0.2, tout: 0.6 });
            A.stroke([[q[0] + 1.2, q[1] + 1.4], [m[0] + 1, m[1] + 1.1], nk], 'side', clothS, { w: r * 0.1, p: 0.32, tin: 0.3, tout: 0.5 });
          }
        } else for (const tp of tips) A.stroke([Q(0.04, 0), Q(tp[0] * 0.55, tp[1] * 0.55), Q(tp[0] * 0.9, tp[1] * 0.9)], 'side', clothS, { w: r * 0.07, p: 0.32, tin: 0.1, tout: 0.5 });
        // the charcoal come through the weave, grey toward the bottom of the bundle where the powder sits
        M.floorWash(A, pl, dust, (px, py) => (pl === body ? 0.52 : 0.24) * sstep(((px - x) * 0.6 + (py - y) * 0.8) / r * 0.75 + 0.4) * (0.55 + 0.9 * A.fbm(px / 5 + sd, py / 5, 2, 3)));
        A.blend(pl, { r: 1.2, k: 0.3 });
      });
      A.outline(press(A, pl, 0.65, 4), 'kajal', T(A.mix('sepia', 'ash', 0.3)), { closed: true, w: 0.9, p: 0.8, again: 0 });
    }
    // the thread wound round the neck, its ends left loose
    for (let k = 0; k < 3; k++) { const o2 = (k - 1) * 1.2; A.stroke([Q(-0.05 + o2 * 0.04, -0.3), Q(0.02 + o2 * 0.04, 0), Q(-0.05 + o2 * 0.04, 0.3)], 'chalk', T('hingul'), { w: 1, p: 0.9 }); }
    A.stroke([Q(0, 0.28), Q(0.2, 0.75), Q(0.05, 1.2)], 'chalk', T('hingul'), { w: 0.7, p: 0.8, tout: 0.5 });
    A.stroke([Q(0, 0.3), Q(-0.3, 0.8), Q(-0.2, 1.1)], 'chalk', T('hingul'), { w: 0.6, p: 0.7, tout: 0.6 });
  };

  // a stick of willow charcoal, snapped at one end and sharpened at the other, and the black it has left on the floor
  M.charcoalStick = function (A, x, y, len, ang, T) {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, hw = len * 0.055;
    const S = (t, k) => [x + ux * len * t + nx * hw * k, y + uy * len * t + ny * hw * k];
    // the marks: a smear where it rolled, a stroke where it was tried, crumbs
    A.stroke([S(-0.3, 4), S(0.2, 4.6), S(0.6, 3.6)], 'side', T(A.mix('ash', 'kajal', 0.3)), { w: hw * 2.2, p: 0.16, tin: 0.3, tout: 0.5 });
    A.smudge([S(-0.2, 4.2), S(0.4, 4.2)], { r: hw * 1.2, k: 0.35 });
    A.stroke([S(0.55, -4), S(0.75, -5.5), S(0.95, -4.4)], 'chalk', T(A.mix('ash', 'kajal', 0.4)), { w: 1.4, p: 0.5, tin: 0.2, tout: 0.6 });
    for (let i = 0; i < 26; i++) { const q = S(A.rr(-0.6, 0.7), A.rr(-4, 6)); A.dot(q[0], q[1], 'chalk', T('kajal'), { w: A.rr(0.5, 1.6), p: A.rr(0.4, 0.8) }); }
    const poly = A.roughen([S(-0.5, -1), S(-0.47, -0.3), S(-0.52, 0.2), S(-0.48, 1), S(0.32, 1), S(0.5, 0.15), S(0.5, -0.15), S(0.32, -1)], 0.3, 4, true);
    shadowOf(A, poly, T, 1.8, 2.8, 0.45);
    A.fill(poly, 'pastel', T(A.mix('kajal', 'ash', 0.25)), { w: 2, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(poly, () => {
      for (let k = 0; k < 4; k++) { const kk = A.rr(-0.7, 0.7); A.stroke([S(-0.5, kk), S(A.rr(0, 0.3), kk + A.rr(-0.1, 0.1))], 'chalk', T(A.mix('ash', 'grey', 0.4)), { w: 0.5, p: 0.45 }); }
      A.stroke([S(-0.48, -0.65), S(0.3, -0.65)], 'chalk', T('grey'), { w: hw * 0.5, p: 0.5, tin: 0.2, tout: 0.3 });
      // the snapped end: a paler face of the wood
      A.fill([S(-0.5, -1), S(-0.47, -0.3), S(-0.52, 0.2), S(-0.48, 1), S(-0.44, 1), S(-0.44, -1)], 'chalk', T('ash'), { w: 1.2, p: 0.7 });
    });
    A.outline(poly, 'kajal', T('kajal'), { closed: true, w: 0.5, p: 0.6 });
  };

  /* the corner of a reed mat (a chatai) pushed in from beyond the picture's edge: split reeds woven two over two, a band of
     dyed reeds near its edge, the edge bound in cloth and stitched.  a -> b is the bound edge; the mat lies on the side
     of (b - a) turned a quarter back, (uy, -ux). */
  M.reedMat = function (A, a, b, T) {
    const Lm = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / Lm, uy = (b[1] - a[1]) / Lm, nx = uy, ny = -ux;
    const Mp = (u, v) => [a[0] + ux * u + nx * v, a[1] + uy * u + ny * v], D = 300;
    const area = [Mp(-60, 0), Mp(Lm + 60, 0), Mp(Lm + 60, D), Mp(-60, D)];
    // it lies a little proud of the floor: its shadow along the bound edge
    A.fill([Mp(-60, -1), Mp(Lm + 60, -1), Mp(Lm + 60, 14), Mp(-60, 14)].map(q => [q[0] + 2.5, q[1] + 4]), 'shade', T('umber'), { w: 5, p: 0.42, passes: 2, gap: 0.5 });
    A.blend([Mp(-60, -6), Mp(Lm + 60, -6), Mp(Lm + 60, 8), Mp(-60, 8)].map(q => [q[0] + 2.5, q[1] + 4]), { r: 3, k: 0.4 });
    A.fill(area, 'side', T(A.mix('sand', 'ochre', 0.2)), { w: 14, p: 1, passes: 2, ang: Math.atan2(uy, ux) });
    const cw = 7.4, inView = q => q[0] > -12 && q[1] > -12 && q[0] < A.W / A.S + 12 && q[1] < A.H / A.S + 12;
    const reed = [T('sand'), T(A.mix('sand', 'khadi', 0.4)), T(A.mix('sand', 'ochre', 0.35)), T(A.mix('sand', 'stone', 0.3))];
    const dyed = (j, i) => j === 3 || j === 4 ? T((i >> 1) % 3 === 1 ? 'neel' : A.mix('lac', 'hingul', 0.3)) : j === 6 ? T('haldi') : null;
    A.withMask(area, () => {
      for (let j = 2; j * cw < D; j++) for (let i = -9; i * cw < Lm + 60; i++) {
        const u0 = i * cw, v0 = j * cw, mid = Mp(u0 + cw / 2, v0 + cw / 2); if (!inView(mid)) continue;
        const weft = ((i + j) & 3) < 2, c = dyed(j, ((i % 6) + 6) % 6) || A.pick(reed);
        if (weft) {
          A.stroke([Mp(u0 - 0.6, v0 + cw / 2 + A.rr(-0.3, 0.3)), Mp(u0 + cw + 0.6, v0 + cw / 2 + A.rr(-0.3, 0.3))], 'pastel', c, { w: cw * 0.86, p: 0.95, reach: 1.5, tin: 0.05, tout: 0.05 });
          A.stroke([Mp(u0, v0 + cw * 0.92), Mp(u0 + cw, v0 + cw * 0.92)], 'kajal', T(A.mix('umber', 'sand', 0.3)), { w: 0.5, p: 0.38 });
          A.stroke([Mp(u0 + 1, v0 + cw * 0.22), Mp(u0 + cw - 1, v0 + cw * 0.22)], 'chalk', T('#fbf3df'), { w: 0.6, p: 0.4 });
        } else {
          A.stroke([Mp(u0 + cw / 2 + A.rr(-0.3, 0.3), v0 - 0.6), Mp(u0 + cw / 2 + A.rr(-0.3, 0.3), v0 + cw + 0.6)], 'pastel', c, { w: cw * 0.86, p: 0.95, reach: 1.5, tin: 0.05, tout: 0.05 });
          A.stroke([Mp(u0 + cw * 0.92, v0), Mp(u0 + cw * 0.92, v0 + cw)], 'kajal', T(A.mix('umber', 'sand', 0.3)), { w: 0.5, p: 0.38 });
        }
      }
      // a reed or two split and standing up out of the weave
      for (let k = 0; k < 3; k++) { const u0 = A.rr(10, Lm - 10), v0 = A.rr(30, 120), q = Mp(u0, v0); if (!inView(q)) continue; A.stroke([q, Mp(u0 + A.rr(8, 16), v0 + A.rr(-3, 3))], 'chalk', T('khadi'), { w: 1, p: 0.7, tout: 0.6 }); }
      // the weave goes darker away from the window
      M.floorWash(A, area, T('umber'), (px) => 0.12 * sstep((px - a[0]) / 260), 'mul');
    });
    // the binding: a strip of indigo cloth folded over the edge and stitched through
    const bind = [Mp(-60, 0), Mp(Lm + 60, 0), Mp(Lm + 60, 13), Mp(-60, 13)];
    A.fill(A.roughen(bind, 0.5, 8, true), 'pastel', T(A.mix('neel', 'lapis', 0.35)), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: Math.atan2(uy, ux) });
    A.withMask(bind, () => {
      A.stroke([Mp(-60, 3), Mp(Lm + 60, 3)], 'chalk', T(A.mix('lapis', 'sky', 0.35)), { w: 2.2, p: 0.45 });
      for (let u = -50; u < Lm + 50; u += A.rr(5.5, 7)) { const q = Mp(u, 6.5); if (!inView(q)) continue; A.stroke([Mp(u - 1, 2.5), Mp(u + 1, 10.5)], 'chalk', T('khadi'), { w: 0.9, p: 0.85 }); }
    });
    A.stroke([Mp(-60, 0.3), Mp(Lm + 60, 0.3)], 'kajal', T('kajal'), { w: 0.7, p: 0.6 });
    A.stroke([Mp(-60, 13), Mp(Lm + 60, 13)], 'kajal', T('sepia'), { w: 0.55, p: 0.5 });
  };

  // where a wet pot stood before it was moved: a ring of damp darker in the lime, crisp at its outer edge where the water
  // stopped, soft inside, broken where the floor dried first
  M.dampRing = function (A, x, y, r, T) {
    const sd = A.rr(0, 40), c = T(A.mix('umber', 'slate', 0.45));
    const box = [[x - r * 1.25, y - r * 1.25], [x + r * 1.25, y - r * 1.25], [x + r * 1.25, y + r * 1.25], [x - r * 1.25, y + r * 1.25]];
    const at = (px, py) => { const dx = px - x, dy = py - y, a = Math.atan2(dy, dx); return [Math.hypot(dx, dy) - r * (1 + 0.035 * Math.sin(3 * a + sd) + 0.04 * (A.noise2(Math.cos(a) * 2 + sd, Math.sin(a) * 2, 5) - 0.5)), a]; };
    M.floorWash(A, box, c, (px, py) => {
      const [d, a] = at(px, py), ring = d > 0 ? Math.exp(-d * d / 5) : Math.exp(-d * d / 70);
      const keep = sstep((A.noise2(Math.cos(a) * 1.3 + sd * 2, Math.sin(a) * 1.3, 4) - 0.3) / 0.22);
      return 0.34 * ring * keep * (0.8 + 0.4 * A.noise2(px / 8 + sd, py / 8, 2));
    }, 'mul');
    M.floorWash(A, box, c, (px, py) => { const d = at(px, py)[0]; return d < 0 ? 0.075 * sstep(-d / 20) * (0.7 + 0.6 * A.fbm(px / 30 + sd, py / 30, 3, 5)) : 0; }, 'mul');
  };

  /* candle light catching on gold: a warm breath over the gold on the side toward the flame, and a few points of it that
     flash.  bands: [[r0, r1, n, k], ...] rings (as fractions of R) to lay it in, with how many points and how strong;
     o.ok(x, y) says where it may fall (off the folios). */
  M.goldGlints = function (A, x, y, R, dir, bands, o) {
    o = o || {};
    A.reseed(o.seed || 1);
    const ok = o.ok || (() => 1), dl = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / dl, uy = dir[1] / dl, sd = A.rr(0, 40);
    for (const bd of bands) {
      const r0 = bd[0] * R, r1 = bd[1] * R, box = [[x - r1, y - r1], [x + r1, y - r1], [x + r1, y + r1], [x - r1, y + r1]];
      M.floorWash(A, box, o.c || '#e08a34', (px, py) => {
        const t = Math.hypot(px - x, py - y); if (t > r1 || t < r0) return 0;
        const v = ((px - x) * ux + (py - y) * uy) / R, edge = (r0 ? sstep((t - r0) / (R * 0.08)) : 1) * sstep((r1 - t) / (R * 0.2));
        return bd[3] * sstep((v + 0.15) / 0.8) * edge * (0.55 + 0.9 * A.fbm(px / 16 + sd, py / 16, 3, 3)) * ok(px, py);
      });
      for (let i = 0, tries = 0; i < bd[2] && tries < bd[2] * 80; tries++) {
        const a = A.rr(0, TAU), rr2 = Math.sqrt(A.rr(r0 * r0, r1 * r1)), px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
        if (Math.cos(a) * ux + Math.sin(a) * uy < A.rr(-0.1, 0.5) || ok(px, py) < 0.95) continue;
        i++;
        const s = A.rr(0.6, 1.15) * (o.s || 1), b0 = A.rr(-0.3, 0.3);
        A.dot(px, py, 'chalk', '#f0a040', { w: 5 * s, p: 0.3 });
        for (let j = 0; j < 4; j++) { const b = b0 + j * PI / 2, l = (j % 2 ? 2.2 : 3.6) * s; A.stroke([[px, py], [px + Math.cos(b) * l, py + Math.sin(b) * l]], 'chalk', '#ffd890', { w: 0.55, p: 0.75, tin: 0, tout: 0.8 }); }
        A.dot(px, py, 'chalk', '#fff0c4', { w: 1.3 * s, p: 0.95 });
      }
    }
    /* o.white: [[r0, r1, n], ...] a few points where the gold faces the flame squarely and throws it back white: a hard
       touch of chalk with its arms flicked out, no two the same size or turn */
    for (const wb of (o.white || [])) {
      const r0 = wb[0] * R, r1 = wb[1] * R;
      for (let i = 0, tries = 0; i < wb[2] && tries < wb[2] * 120; tries++) {
        const a = A.rr(0, TAU), rr2 = Math.sqrt(A.rr(r0 * r0, r1 * r1)), px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
        if (Math.cos(a) * ux + Math.sin(a) * uy < A.rr(0.35, 0.8) || ok(px, py) < 0.95) continue;
        i++;
        const s = A.rr(0.75, 1.3) * (o.s || 1), b0 = A.rr(-0.4, 0.4);
        A.dot(px, py, 'chalk', '#ffe6b0', { w: 4 * s, p: 0.35 });
        for (let j = 0; j < 4; j++) { const b = b0 + j * PI / 2 + A.rr(-0.08, 0.08), l = (j % 2 ? A.rr(2.4, 3.6) : A.rr(5, 7.5)) * s; A.stroke([[px - Math.cos(b) * 0.3, py - Math.sin(b) * 0.3], [px + Math.cos(b) * l, py + Math.sin(b) * l]], 'chalk', '#ffffff', { w: 0.7, p: 0.95, tin: 0, tout: 0.85 }); }
        A.dot(px, py, 'chalk', '#ffffff', { w: 1.9 * s, p: 1 });
      }
    }
  };

  // the cat is in m-floor2.js
})();
