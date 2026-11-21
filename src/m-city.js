(function () {
  'use strict';
  /* ==========================================================================
     THE OLD TOWN ON KITE DAY
     Lime-washed houses set out the Mewar way: every front flat to the eye, every
     roof tipped up so that its floor can be seen, and paper kites over all of it.
       M.kite(A, x, y, s, id, o)        a paper fighter kite
       M.kiteFar(A, x, y, s, c, c2, rot) a kite far off: a few dabs
       M.house(A, b)                    one house; b says where it stands and how it is dressed
       M.shikhara(A, x, y, w, h, o)     the white spire of a temple
       M.pot, M.spool, M.cat, M.matka, M.ladder, M.mat, M.cot, M.clothes, M.pigeon, M.pennant, M.diya, M.puff
     ======================================================================== */
  const PI = Math.PI, SX = 0.42, SY = 0.5;             // how far a roof goes to the right and up for one unit of depth

  // ------------------------------------------------------------ helpers (the same hand as m-arch.js)
  function hl(A, a, b, tool, c, o) {
    o = o || {};
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const ov = o.ov != null ? o.ov : Math.min(2, L * 0.05);
    const e0 = A.rr(-0.3, 1) * ov, e1 = A.rr(-0.3, 1) * ov;
    const p0 = [a[0] - ux * e0, a[1] - uy * e0], p1 = [b[0] + ux * e1, b[1] + uy * e1];
    if (L > 80) {
      const n = Math.ceil(L / 28), pts = [], k = A.rr(-1, 1) * Math.min(1.3, L * 0.006);
      for (let i = 0; i <= n; i++) { const t = i / n, bw = Math.sin(t * PI) * k; pts.push([p0[0] + (p1[0] - p0[0]) * t - uy * bw, p0[1] + (p1[1] - p0[1]) * t + ux * bw]); }
      A.outline(pts, tool, c, Object.assign({ pull: A.rr(70, 120), again: 0.22 }, o));
      return;
    }
    const bow = A.rr(-1, 1) * Math.min(0.9, L * 0.012);
    const m = [(p0[0] + p1[0]) / 2 - uy * bow, (p0[1] + p1[1]) / 2 + ux * bow];
    A.stroke(A.chance(0.5) ? [p0, m, p1] : [p1, m, p0], tool, c, o);
  }
  function solid(A, pts, c, o) {
    o = o || {};
    const bb = A.bbox([pts]), m = Math.min(bb[2] - bb[0], bb[3] - bb[1]);
    const w = o.w || Math.max(2, Math.min(8, m * 0.8));
    A.fill(pts, o.tool || 'pastel', c, { w, ang: o.ang != null ? o.ang : A.rr(-1.1, -0.2), passes: o.passes || 2, p: o.p != null ? o.p : 1, reach: o.reach || 1.65, gap: o.gap != null ? o.gap : 0.42, cv: o.cv != null ? o.cv : 0.012, turn: 0.9 });
  }
  function tint(A, pts, c, o) {
    o = o || {};
    A.fill(pts, 'shade', c, { w: o.w || 2.6, p: o.p != null ? o.p : 0.45, passes: o.passes || 1, gap: o.gap != null ? o.gap : 0.7, ang: o.ang != null ? o.ang : -0.9, turn: 0.7, cv: 0.03 });
  }
  function archCurve(cx, sy, hw, ah, n, cusp) {
    const pts = [], N = n ? 16 * n : 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = PI * t, bx = -hw * Math.cos(a);
      let by = ah * Math.pow(Math.sin(a), 0.78);
      const pk = Math.max(0, 1 - Math.abs(t - 0.5) * 9); by += ah * 0.16 * pk * pk;
      const k = n ? 1 - cusp * (1 - Math.abs(Math.sin(n * PI * t))) : 1;
      pts.push([cx + bx * k, sy + by * k]);
    }
    return pts;
  }
  // a cusped opening on the sheet: its foot at (cx, by), w wide, h high
  function arch(cx, by, w, h, n, cusp, spring) {
    spring = spring == null ? 0.56 : spring;
    const hw = w / 2, sy = h * spring;
    return [[cx - hw, by], [cx - hw, by - sy]].concat(archCurve(cx, sy, hw, h * (1 - spring) / 1.16, n, cusp == null ? 0.12 : cusp).map(p => [p[0], by - p[1]]), [[cx + hw, by - sy], [cx + hw, by]]);
  }
  // bulbous dome on the sheet, foot at (cx, by)
  function dome(cx, by, w, h, pointed) {
    const hw = w / 2, pts = [], N = 16, e1 = pointed ? 2.05 : 2.3, e2 = pointed ? 0.66 : 0.6;
    const r = v => hw * (1 + 0.12 * Math.sin(PI * Math.min(1, v / 0.5))) * Math.pow(Math.max(0, 1 - Math.pow(v, e1)), e2);
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push([cx - r(v), by - v * h]); }
    for (let i = N - 1; i >= 0; i--) { const v = i / N; pts.push([cx + r(v), by - v * h]); }
    return pts;
  }
  function tearPts(cx, by, w, h, lean) {
    const pts = [], N = 9, r = v => (w / 2) * Math.sin(PI * Math.pow(v, 0.55));
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push([cx - r(v) + lean * v * v, by - v * h]); }
    for (let i = N - 1; i >= 1; i--) { const v = i / N; pts.push([cx + r(v) + lean * v * v, by - v * h]); }
    return pts;
  }
  function flame(A, x, y, h) {
    const lean = A.rr(-0.28, 0.28) * h;
    A.fill(tearPts(x, y, h * 0.6, h, lean), 'chalk', 'saffron', { w: Math.max(1.2, h * 0.3), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.3, cv: 0.02 });
    A.fill(tearPts(x, y - h * 0.04, h * 0.36, h * 0.72, lean * 0.5), 'chalk', 'haldi', { w: Math.max(1, h * 0.2), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.5 });
    A.dot(x, y - h * 0.17, 'chalk', 'khadi', { w: Math.max(0.9, h * 0.17), p: 1, reach: 1.6, ang: 1.57 });
  }
  function glow(A, cx, cy, r, o) {
    o = o || {}; const c0 = o.c0 || 'brick', c1 = o.c1 || 'saffron', c2 = o.c2 || 'haldi', sq = o.sq || 1, k = o.k != null ? o.k : 1;
    const blob = f => A.roughen(A.ellipse(cx + A.rr(-0.06, 0.06) * r, cy + A.rr(-0.06, 0.06) * r, r * f, r * f * sq), r * f * 0.1, r * 0.9, true);
    if (o.c0 !== false) A.fill(blob(1), 'side', c0, { w: Math.max(4, r * 0.7), p: 0.36 * k, reach: 0.95, passes: 1, ang: A.rr(-1, 1), cv: 0.03 });
    A.fill(blob(0.72), 'side', c1, { w: Math.max(3.5, r * 0.6), p: 0.5 * k, reach: 1.0, passes: 1, ang: A.rr(-1, 1), cv: 0.03 });
    A.fill(blob(0.46), 'pastel', c2, { w: Math.max(3, r * 0.4), p: 0.6 * k, reach: 1.0, passes: 1, ang: A.rr(-1, 1) });
    const sp = [], a0 = A.rr(0, 6.28);
    for (let i = 0; i <= 34; i++) { const a = a0 + i * 0.62, rad = r * (0.25 + 0.85 * i / 34); sp.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * sq]); }
    A.smudge(sp, { r: Math.max(2.5, r * 0.36), k: 0.34 });
    A.fill(blob(0.26), 'pastel', c2, { w: Math.max(2, r * 0.26), p: 0.85 * k, reach: 1.25, passes: 1 });
  }
  function kalash(A, x, y, k, o) {
    o = o || {};
    A.dot(x, y - k * 0.1, 'chalk', o.base || 'ochre', { w: k * 0.34, len: k * 0.2, ang: 0, reach: 1.6, p: 1 });
    A.dot(x, y - k * 0.34, 'gold', o.c || 'gold', { w: k * 0.36, ang: 0, len: k * 0.1 });
    A.dot(x, y - k * 0.36, 'gold', o.c || 'gold', { w: k * 0.3, ang: 1.57, len: k * 0.08 });
    A.dot(x, y - k * 0.6, 'gold', o.c || 'gold', { w: k * 0.2, ang: 1.57, len: k * 0.07 });
    A.stroke([[x, y - k * 0.6], [x + A.rr(-0.3, 0.3), y - k]], 'gold', o.c || 'gold', { w: Math.max(0.85, k * 0.1), tin: 0, tout: 0.5 });
  }
  function rosette(A, c, r, col, n, heart) {
    const a0 = A.rr(0, 6.28); n = n || 6;
    for (let k = 0; k < n; k++) { const a = a0 + k * 6.2832 / n + A.rr(-0.1, 0.1); A.stroke([[c[0] + Math.cos(a) * r * 0.3, c[1] + Math.sin(a) * r * 0.3], [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]], 'chalk', col, { w: Math.max(0.9, r * 0.5), p: 0.9, tin: 0.15, tout: 0.1 }); }
    A.dot(c[0], c[1], 'gold', heart || 'gold', { w: Math.max(0.9, r * 0.5) });
  }
  function crack(A, x, y, len, ang, c) {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const n = Math.max(3, Math.round(len / 3));
    for (let i = 0; i < n; i++) { a += A.rr(-0.7, 0.7); px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py]); a = ang + (a - ang) * 0.5; }
    A.stroke(pts, 'pencil', c || 'sepia', { w: 0.75, p: 0.5, wob: 0.4 });
  }
  M.cityHand = { hl, solid, tint, arch, dome, flame, glow, kalash, rosette, crack };

  // ============================================================== KITES
  const KITE = {
    'open-transcribe': { c: '#d4412b', tail: 'haldi', dark: 'maroon' },
    'shelf': { c: '#27387d', tail: 'cream', dark: 'neel' },
    'claudemonitor': { c: '#3f9c58', tail: 'saffron', dark: 'bottle' },
    'soma': { c: '#e2668f', tail: 'khadi', dark: 'lac', ribbon: ['khadi', '#e2668f'] },
    'dpay': { c: 'lapis', tail: 'khadi', dark: 'neel' },
    'utopia': { c: 'haldi', tail: 'hingul', dark: 'umber', ribbon: ['hingul', '#3f9c58'] },
    'dalal-street': { c: 'khadi', tail: 'crimson', dark: 'sepia' }
  };
  M.kiteIds = Object.keys(KITE);
  /* M.kite(A, x, y, s, id, o): a paper fighter kite, the kind flown from the roofs at Sankranti.
     (x, y) = where the string is tied, the middle of the kite;  s = its height from tip to tip.
     id: one of M.kiteIds, or anything else for a plain kite of o.c and o.c2 (o.style 'half' | 'band' | 'foot' | 'plain').
     o: rot (lean in radians, + to the right), swing (which way the tail hangs out), short (no long ribbons),
        lantern (a paper lamp on a thread below it), dim (0..1, how much of the night is on it), ph (phase of the ribbons) */
  M.kite = function (A, x, y, s, id, o) {
    o = o || {};
    const rr = A.rr, D = KITE[id] || { c: o.c || 'hingul', c2: o.c2 || 'haldi', tail: o.c2 || 'haldi', dark: 'sepia', style: o.style || 'half' };
    const rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot), sw = o.swing != null ? o.swing : -rot * 2.4, ph = o.ph || 0;
    const T = (u, v) => [x + (u * cr - v * sr) * s, y + (u * sr + v * cr) * s], L = pts => pts.map(p => T(p[0], p[1]));
    const dim = c => o.dim ? A.mix(c, 'neel', o.dim) : A.col(c);
    const HW = 0.53, SH = -0.06, wS = Math.max(1.8, Math.min(8, s * 0.09));
    const half = sg => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, m = 1 - t; pts.push([sg * (2 * m * t * 0.4 + t * t * HW), m * m * -0.5 + 2 * m * t * -0.43 + t * t * SH]); } return pts; };
    const outL = half(1).concat([[0, 0.5]], half(-1).reverse().slice(0, -1)), out = L(outL);
    const fld = (pts, c, ang, w) => solid(A, L(pts), dim(c), { w: w || wS, ang: (ang == null ? -0.7 : ang) + rot });
    const disc = (u, v, r, c) => { const q = T(u, v); solid(A, A.ellipse(q[0], q[1], r * s, r * s), dim(c), { w: Math.max(1.4, r * s * 0.55) }); };
    const foot = T(0, 0.5);

    // long paper ribbons from the foot
    if (D.ribbon) D.ribbon.forEach((c, i) => {
      const pts = [], n = 22, len = (0.86 - i * 0.12) * (o.short ? 0.42 : 1);
      for (let k = 0; k <= n; k++) { const t = k / n; pts.push(T((i ? 0.035 : -0.035) + sw * 0.16 * t + 0.07 * Math.sin(t * 6.4 + ph + i * 1.9) * (0.25 + t), 0.5 + t * len)); }
      A.stroke(pts, 'chalk', dim(c), { w: Math.max(1.5, s * 0.036), p: 0.98, reach: 1.6, tin: 0, tout: 0.25, wob: 0.5 });
      A.stroke(pts.map(p => [p[0] + 0.6, p[1] + 0.3]), 'pencil', dim(D.dark), { w: 0.6, p: 0.4, wob: 0.4 });
    });
    // the little paper tail glued under the foot
    const tl = L([[0, 0.485], [0.088 + sw * 0.05, 0.635], [-0.088 + sw * 0.05, 0.635]]);
    solid(A, tl, dim(D.tail), { w: Math.max(1.4, s * 0.05), ang: 0.3 + rot });
    A.outline(tl, 'pencil', dim(D.dark), { closed: true, w: Math.max(0.6, s * 0.009), p: 0.7, pull: s * 0.3 });
    if (o.lantern) {
      const lx = foot[0] + sw * s * 0.03, ly = foot[1] + s * 0.4;
      glow(A, lx, ly, s * 0.3, { k: 0.9 });
      A.stroke([[foot[0], foot[1] + s * 0.14], [lx, ly - s * 0.1]], 'pencil', 'cream', { w: 0.6, p: 0.6 });
      const bw = s * 0.085, bh = s * 0.11;
      solid(A, [[lx - bw * 0.8, ly - bh], [lx + bw * 0.8, ly - bh], [lx + bw, ly - bh * 0.3], [lx + bw, ly + bh * 0.3], [lx + bw * 0.8, ly + bh], [lx - bw * 0.8, ly + bh], [lx - bw, ly + bh * 0.3], [lx - bw, ly - bh * 0.3]], 'saffron', { w: Math.max(1.4, bw * 0.7), ang: 1.4 });
      A.fill(A.ellipse(lx, ly, bw * 0.6, bh * 0.7), 'chalk', 'haldi', { w: Math.max(1.2, bw * 0.5), p: 1, reach: 1.7, passes: 2, gap: 0.4 });
      A.dot(lx, ly, 'chalk', 'khadi', { w: Math.max(1, bw * 0.45), p: 1, reach: 1.6 });
      for (const sg of [-1, 1]) hl(A, [lx - bw * 0.85, ly + sg * bh], [lx + bw * 0.85, ly + sg * bh], 'kajal', 'maroon', { w: Math.max(0.8, s * 0.012), ov: 0 });
      for (const f of [-0.5, 0, 0.5]) A.stroke([[lx + f * bw, ly + bh], [lx + f * bw * 1.3, ly + bh + s * 0.05]], 'pencil', 'saffron', { w: 0.7, p: 0.8, tin: 0, tout: 0.4 });
    }

    // the paper
    A.pushMask(out);
    fld([[-0.62, -0.58], [0.62, -0.58], [0.62, 0.58], [-0.62, 0.58]], D.c);
    if (id === 'open-transcribe') {
      disc(0, -0.05, 0.2, 'haldi');
      for (let k = 0; k < 12; k++) { const a = k * PI / 6 + 0.26, p0 = T(Math.cos(a) * 0.255, -0.05 + Math.sin(a) * 0.255), p1 = T(Math.cos(a) * 0.33, -0.05 + Math.sin(a) * 0.33); A.stroke([p0, p1], 'chalk', dim('haldi'), { w: Math.max(1.1, s * 0.03), p: 1, reach: 1.6, tin: 0, tout: 0.5 }); }
      disc(0, -0.05, 0.075, 'saffron');
    } else if (id === 'shelf') {
      fld([[0, -0.6], [0.62, -0.6], [0.62, 0.6], [0, 0.6]], 'cream', -1.2);
      // two bands that change colour as they cross the spine
      for (const q of [[-0.21, -0.08], [0.08, 0.18]]) {
        fld([[-0.62, q[0]], [0, q[0]], [0, q[1]], [-0.62, q[1]]], 'cream', 0.05);
        fld([[0, q[0]], [0.62, q[0]], [0.62, q[1]], [0, q[1]]], '#27387d', 0.05);
      }
    } else if (id === 'claudemonitor') {
      fld([[-0.6, -0.17], [0.6, -0.17], [0.6, 0.07], [-0.6, 0.07]], 'saffron', 0.05);
      for (const v of [-0.17, 0.07]) A.stroke([T(-0.6, v), T(0.6, v)], 'chalk', dim('cream'), { w: Math.max(1, s * 0.022), p: 0.95, reach: 1.5 });
    } else if (id === 'soma') {
      for (const sg of [-1, 1]) { disc(sg * 0.2, -0.1, 0.115, 'khadi'); disc(sg * 0.2, -0.1, 0.048, 'crimson'); }
      fld([[-0.6, 0.2], [0.6, 0.2], [0.6, 0.6], [-0.6, 0.6]], 'khadi', 0.05);
      A.stroke([T(-0.4, 0.2), T(0.4, 0.2)], 'chalk', dim('crimson'), { w: Math.max(1, s * 0.022), p: 0.95, reach: 1.5 });
    } else if (id === 'dpay') {
      disc(-0.02, -0.04, 0.235, 'khadi'); disc(0.075, -0.075, 0.2, 'lapis');
      const q = T(0.15, -0.07); rosette(A, q, s * 0.045, dim('khadi'), 5, dim('haldi'));
      A.stroke(L(outL.map(p => [p[0] * 0.84, p[1] * 0.84 + 0.0])).concat([T(0, -0.42)]), 'chalk', dim('khadi'), { w: Math.max(0.9, s * 0.016), p: 0.9, reach: 1.4 });
    } else if (id === 'utopia') {
      const chev = (v0, t, c) => fld([[-0.6, v0], [0, v0 + 0.3], [0.6, v0], [0.6, v0 + t], [0, v0 + 0.3 + t], [-0.6, v0 + t]], c, 0.6);
      chev(-0.5, 0.12, '#3f9c58'); chev(-0.24, 0.12, 'hingul');
    } else if (id === 'dalal-street') {
      const n = 5, e1 = [HW / n, (SH - 0.5) / n], e2 = [-HW / n, (SH - 0.5) / n];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) {
        const bx = i * e1[0] + j * e2[0], by = 0.5 + i * e1[1] + j * e2[1];
        fld([[bx, by], [bx + e1[0], by + e1[1]], [bx + e1[0] + e2[0], by + e1[1] + e2[1]], [bx + e2[0], by + e2[1]]], 'crimson', 0.8, Math.max(1.4, s * 0.045));
      }
      disc(0, -0.2, 0.06, 'crimson');
      A.stroke(L(half(-1).reverse().concat(half(1).slice(1)).map(p => [p[0] * 0.88, p[1] * 0.88])), 'chalk', dim('crimson'), { w: Math.max(0.9, s * 0.018), p: 0.9, reach: 1.4 });
    } else if (D.style === 'half') fld([[0, -0.6], [0.62, -0.6], [0.62, 0.6], [0, 0.6]], D.c2, -1.2);
    else if (D.style === 'band') fld([[-0.6, -0.14], [0.6, -0.14], [0.6, 0.06], [-0.6, 0.06]], D.c2, 0.05);
    else if (D.style === 'foot') fld([[-0.6, 0.12], [0.6, 0.12], [0.6, 0.6], [-0.6, 0.6]], D.c2, 0.05);
    // light through the paper, and one crease
    if (s > 30) {
      tint(A, L([[-0.56, -0.02], [-0.2, -0.5], [0.06, -0.5], [-0.24, 0.16]]), 'khadi', { p: 0.34, gap: 0.8, ang: -0.9 + rot, w: 2.6 });
      tint(A, L([[0.56, 0], [0.2, 0.34], [0, 0.52], [0.3, 0.02]]), dim(D.dark), { p: 0.3, gap: 0.8, ang: -0.9 + rot, w: 2.4 });
    }
    A.popMask();
    // the edge, the spine and the bow
    const off = [rr(-0.5, 0.5), rr(-0.5, 0.5)], lwk = Math.max(0.75, s * 0.0125);
    A.outline(out.map(p => [p[0] + off[0], p[1] + off[1]]), 'kajal', dim(D.dark), { closed: true, w: lwk, p: 0.8, pull: s * 0.5, again: 0.25 });
    hl(A, T(0, -0.5), T(0, 0.5), 'pencil', dim('sepia'), { w: Math.max(0.65, s * 0.01), p: 0.72, ov: 1 });
    const bow = []; for (let i = 0; i <= 14; i++) { const t = -1 + 2 * i / 14; bow.push(T(t * HW, SH - 0.33 * Math.pow(1 - t * t, 0.8))); }
    A.stroke(bow, 'pencil', dim('sepia'), { w: Math.max(0.6, s * 0.009), p: 0.62 });
    return { foot, top: T(0, -0.5) };
  };

  M.kiteFar = function (A, x, y, s, c, c2, rot) {
    rot = rot || 0;
    const cr = Math.cos(rot), sr = Math.sin(rot), T = (u, v) => [x + (u * cr - v * sr) * s, y + (u * sr + v * cr) * s];
    const d = [T(0, -0.5), T(0.52, -0.06), T(0, 0.5), T(-0.52, -0.06)], w = Math.max(1.1, s * 0.3);
    A.fill(d, 'chalk', c, { w, p: 1, reach: 1.65, passes: 2, gap: 0.4, ang: rot - 0.7 });
    if (c2 && s > 6.5) A.fill(A.chance(0.5) ? [d[0], d[1], d[2]] : [d[3], d[1], d[2]], 'chalk', c2, { w, p: 1, reach: 1.65, passes: 2, gap: 0.4, ang: rot + 0.6 });
    if (s > 9.5) { A.stroke([d[0], d[2]], 'pencil', 'sepia', { w: 0.6, p: 0.5 }); A.outline(d, 'pencil', 'sepia', { closed: true, w: 0.6, p: 0.42, pull: 30 }); }
    const f = T(0, 0.62); A.dot(f[0], f[1], 'chalk', c2 || c, { w: Math.max(0.8, s * 0.16), p: 0.95, reach: 1.5 });
  };

  // ============================================================== HOUSES
  function win(A, cx, by, ww, wh, o) {
    const k = o.k;
    if (k < 0.6) {
      A.dot(cx, by - wh * 0.5, 'chalk', o.fill, { w: Math.max(1.1, ww * 0.62), len: wh * 0.24, ang: 1.57, p: 0.95, reach: 1.5 });
      if (o.lit) A.dot(cx, by - wh * 0.4, 'chalk', 'cream', { w: Math.max(0.7, ww * 0.26), p: 0.9, reach: 1.5 });
      return;
    }
    const op = arch(cx, by, ww, wh, k > 0.8 ? 3 : 0, 0.1, 0.56);
    solid(A, op, o.fill, { w: Math.max(1.6, ww * 0.4), ang: -1.2 });
    if (o.lit) A.withMask(op, () => {
      A.fill(A.ellipse(cx, by - wh * 0.36, ww * 0.36, wh * 0.36), 'chalk', 'haldi', { w: Math.max(1.4, ww * 0.3), p: 1, reach: 1.6, passes: 2, gap: 0.4 });
      A.dot(cx, by - wh * 0.3, 'chalk', 'khadi', { w: Math.max(1, ww * 0.22), p: 1, reach: 1.5 });
    });
    else if (o.shut) {
      hl(A, [cx, by], [cx, by - wh * 0.9], 'pencil', o.ink, { w: 0.8, p: 0.7, ov: 0 });
      for (const sg of [-1, 1]) for (const f of [0.3, 0.62]) A.dot(cx + sg * ww * 0.24, by - wh * f, 'chalk', o.stud || 'cream', { w: Math.max(0.7, ww * 0.1), p: 0.85 });
    } else A.withMask(op, () => A.fill([[cx - ww, by - wh - 2], [cx - ww * 0.1, by - wh - 2], [cx - ww * 0.1, by], [cx - ww, by]], 'shade', 'kajal', { w: 2, p: 0.5, passes: 1, gap: 0.7 }));
    A.outline(op, 'pencil', o.ink, { w: 0.85 * o.lw, p: 0.75, pull: 30 });
    hl(A, [cx - ww * 0.72, by + 0.7 * k], [cx + ww * 0.72, by + 0.7 * k], 'pencil', o.ink, { w: o.lw, p: 0.8 });
    if (o.awn) {
      const ay = by - wh - 1.6 * k, a0 = cx - ww * 0.76, a1 = cx + ww * 0.76, drop = 6 * k, b0 = a0 - 1.8 * k, b1 = a1 + 1.8 * k, n = 4, st = (b1 - b0) / n;
      const pts = [[a0, ay], [a1, ay]];
      for (let i = 0; i < n; i++) pts.push([b1 - i * st, ay + drop], [b1 - (i + 0.5) * st, ay + drop + 2.2 * k]);
      pts.push([b0, ay + drop]);
      solid(A, pts, o.awn, { w: 2.4, ang: 0.12 });
      for (let i = 1; i < n; i++) A.stroke([[a0 + (a1 - a0) * i / n, ay + 0.6], [b0 + i * st, ay + drop]], 'pencil', o.awn2 || 'haldi', { w: 0.8, p: 0.8 });
      A.outline(pts, 'pencil', o.ink, { closed: true, w: 0.7 * o.lw, p: 0.6, pull: 40 });
      for (let i = 0; i < n; i++) A.dot(b1 - (i + 0.5) * st, ay + drop + 1.8 * k, 'chalk', o.awn2 || 'haldi', { w: Math.max(0.8, 1.1 * k), p: 0.95 });
    }
  }
  function door(A, cx, by, dw, dh, o) {
    const k = o.k, rr = A.rr, fr = arch(cx, by, dw + 5 * k, dh + 3.2 * k, 0, 0, 0.62), op = arch(cx, by, dw, dh, 5, 0.1, 0.62);
    solid(A, fr, o.frame, { w: 3, ang: -1.3 });
    solid(A, op, o.c, { w: Math.max(2, dw * 0.2), ang: -1.35 });
    hl(A, [cx, by], [cx, by - dh * 0.92], 'pencil', o.ink, { w: 0.9, p: 0.8, ov: 0 });
    if (!o.lit) for (let r = 0; r < 3; r++) for (const f of [-0.33, -0.14, 0.14, 0.33]) A.dot(cx + f * dw, by - dh * (0.16 + r * 0.2), 'gold', 'gold', { w: Math.max(0.8, 1.2 * k) });
    else A.withMask(op, () => glow(A, cx, by - dh * 0.4, dw * 0.5, { c0: 'hingul' }));
    A.outline(op, 'pencil', o.ink, { w: o.lw, p: 0.8, pull: 34, again: 0.25 });
    A.outline(fr, 'pencil', o.ink, { w: o.lw * 0.85, p: 0.6, pull: 44 });
    // a string of marigolds over it
    const sw = [], xa = cx - dw * 0.62, xb = cx + dw * 0.62, y0 = by - dh - 4.4 * k;
    for (let i = 0; i <= 12; i++) { const t = i / 12; sw.push([xa + (xb - xa) * t, y0 + 4.2 * k * Math.sin(PI * t)]); }
    A.along(sw, 2.3 * k, 0.2 * k).forEach((q, i) => A.dot(q.x, q.y, 'chalk', i % 2 ? 'saffron' : 'haldi', { w: 1.9 * k, p: 1, reach: 1.6 }));
    for (const xx of [xa, xb]) A.stroke([[xx, y0], [xx + rr(-0.5, 0.5), y0 + 8 * k]], 'chalk', 'saffron', { w: 1.5 * k, p: 0.95, tin: 0, tout: 0.4 });
    // the step
    const st = [[cx - dw * 0.78, by - 0.4], [cx + dw * 0.78, by - 0.4], [cx + dw * 0.86, by + 3 * k], [cx - dw * 0.86, by + 3 * k]];
    solid(A, st, o.step, { w: 2.2, ang: 0.04 });
    A.outline(st, 'pencil', o.ink, { closed: true, w: o.lw * 0.8, p: 0.6 });
  }
  /* M.house(A, b): one house.  b: x, y (left foot of the front), w, h (the front up to the roof floor), d (depth of the roof),
     ph (height of the parapet), k (size of the details: 1 near, 0.4 far), colours wall, lit, shadow, cast, floor, line, soft,
     inner, pierce;  top 'jali' | 'crest' | 'plain';  rows, cols, win 'arch' | 'shut' | 'none', shut (colour), lit [window numbers];
     frieze (colour), awn (colour), dado (colour), door { at, c, frame, step }, skip [window numbers left out],
     balcony (true: the middle window of the top row is a covered balcony)
     returns { F(X, Z) -> a point on the roof floor, floor, back: [x0, y, x1], front: [x0, y, x1], wins: [[cx, by, ww, wh]...] } */
  M.house = function (A, b) {
    const rr = A.rr, k = b.k || 1, far = k < 0.6, x = b.x, y = b.y, w = b.w, h = b.h, ph = b.ph, ox = b.d * SX, oy = b.d * SY;
    const yF = y - h, yT = yF - ph, ink = b.line || 'sepia', lw = Math.max(0.62, 0.98 * Math.sqrt(k)), lp = far ? 0.5 : 0.8;
    const jj = Math.min(0.5, 0.18 + k * 0.3), Q = (px, py) => [px + rr(-jj, jj), py + rr(-jj, jj)];
    const pen = (p, q, c, pp, wd) => hl(A, p, q, 'pencil', c || ink, { w: (wd || 1) * lw, p: pp || lp });
    const floor = [Q(x, yF), Q(x + w, yF), Q(x + w + ox, yF - oy), Q(x + ox, yF - oy)];
    solid(A, floor, b.floor, { ang: -0.12 });
    const back = [Q(x + ox, yT - oy), Q(x + w + ox, yT - oy), Q(x + w + ox, yF - oy), Q(x + ox, yF - oy)];
    solid(A, back, b.wall, { ang: 0.06 });
    const left = [Q(x, yT), Q(x + ox, yT - oy), Q(x + ox, yF - oy), Q(x, yF)];
    solid(A, left, b.shadow, { ang: -0.9 });
    if (!far) {
      tint(A, [[x + ph * 0.2, yF], [x + ox + ph * 0.2, yF - oy], [x + ox + ph * 1.2, yF - oy], [x + ph * 1.2, yF]], b.cast, { p: 0.55, gap: 0.6, ang: -0.9 });
      tint(A, [[x + ox, yF - oy], [x + w + ox, yF - oy], [x + w + ox - 1, yF - oy + ph * 0.4], [x + ox + 1, yF - oy + ph * 0.4]], b.cast, { p: 0.4, gap: 0.7, ang: 0.05 });
    }
    const side = [Q(x + w, y), Q(x + w + ox, y - oy), Q(x + w + ox, yT - oy), Q(x + w, yT)];
    solid(A, side, b.lit, { ang: -1.25 });
    const front = [Q(x, yT), Q(x + w, yT), Q(x + w, y), Q(x, y)];
    solid(A, front, b.wall, { ang: rr(-0.8, -0.4) });
    if (b.crestBack && !far) {
      const mw = 5.4 * k, n = Math.max(2, Math.round(w / mw)), w1 = w / n, mh = 4 * k, pts = [[x + ox, yT - oy + 0.5]];
      for (let i = 0; i < n; i++) { const a = x + ox + i * w1; pts.push([a + w1 * 0.12, yT - oy - mh * 0.45], [a + w1 * 0.5, yT - oy - mh], [a + w1 * 0.88, yT - oy - mh * 0.45], [a + w1, yT - oy]); }
      pts.push([x + w + ox, yT - oy + 0.5]);
      solid(A, pts, b.wall, { w: 2.2, ang: 0.2 }); A.outline(pts.slice(1, -1), 'pencil', ink, { w: lw * 0.8, p: lp * 0.85, pull: 60 });
    } else pen(back[0], back[1], null, lp * 0.9);
    pen(left[0], left[1], null, lp * 0.9); pen(left[1], left[2], null, lp * 0.8, 0.85);
    pen(back[3], back[2], b.soft, lp * 0.75, 0.8); pen(left[3], left[2], b.soft, lp * 0.75, 0.8);
    pen(side[1], side[2], null, lp * 0.9); pen(side[3], side[2], null, lp * 0.9);
    // a small window or two in the side that takes the sun
    if (!far && ox > 9) for (let i = 0, n = h > 70 * k ? 2 : 1; i < n; i++) { const qx = x + w + ox * 0.5, qy = y - oy * 0.5 - h * (0.72 - i * 0.36); A.stroke([[qx, qy - 3.4 * k], [qx + 0.4, qy + 3.4 * k]], 'chalk', b.inner, { w: Math.max(1.4, ox * 0.2), p: 0.9, reach: 1.5, tin: 0, tout: 0 }); }

    // the top of the wall
    if (b.top === 'crest') {
      const mw = 5.4 * k, n = Math.max(2, Math.round(w / mw)), w1 = w / n, mh = 4.2 * k, pts = [[x, yT + 0.5]];
      for (let i = 0; i < n; i++) { const a = x + i * w1; pts.push([a + w1 * 0.12, yT - mh * 0.45], [a + w1 * 0.5, yT - mh], [a + w1 * 0.88, yT - mh * 0.45], [a + w1, yT]); }
      pts.push([x + w, yT + 0.5]);
      solid(A, pts, b.wall, { w: 2.2, ang: 0.2 });
      A.outline(pts.slice(1, -1), 'pencil', ink, { w: lw * 0.85, p: lp * 0.9, pull: 60 });
    } else pen(front[0], front[1]);
    if (b.top === 'jali' && !far) {
      const rows = ph > 11 * k ? 2 : 1;
      for (let r = 0; r < rows; r++) for (let px = x + 3.4 * k + (r ? 2.3 * k : 0); px < x + w - 2.6 * k; px += 4.6 * k) {
        const qx = px + rr(-0.3, 0.3), qy = yT + ph * (rows > 1 ? (r ? 0.7 : 0.32) : 0.52) + rr(-0.3, 0.3);
        A.dot(qx, qy, 'chalk', b.pierce, { w: 1.5 * k, p: 0.9, ang: 1.57 });
        if (k > 0.85) A.stroke([[qx - 2.1 * k, qy - 1.6 * k], [qx - 1.5 * k, qy + 1 * k], [qx, qy + 2 * k], [qx + 1.5 * k, qy + 1 * k], [qx + 2.1 * k, qy - 1.6 * k]], 'pencil', b.soft, { w: 0.7, p: 0.55, wob: 0.4 });
      }
      pen([x, yT + 1.5 * k], [x + w, yT + 1.5 * k], b.soft, 0.55, 0.8);
    }
    pen([x, yF], [x + w, yF], far ? b.soft : null, far ? 0.4 : 0.62, 0.85);
    pen(front[1], front[2]); pen(front[0], front[3]);

    let yy = yF + 1.6 * k;
    if (b.frieze && !far) {
      const fh = 5.6 * k;
      solid(A, [[x + 0.6, yy], [x + w - 0.6, yy], [x + w - 0.6, yy + fh], [x + 0.6, yy + fh]], b.frieze, { w: Math.max(2, fh * 0.6), ang: 0.03 });
      let i = 0;
      for (let px = x + 4 * k; px < x + w - 3 * k; px += 6.2 * k, i++) {
        const qx = px + rr(-0.4, 0.4), qy = yy + fh / 2 + rr(-0.3, 0.3);
        if (k > 0.85) { rosette(A, [qx, qy], 2 * k, 'khadi', 5, 'haldi'); if (i % 2) A.stroke([[qx + 2.2 * k, qy], [qx + 4 * k, qy + rr(-1, 1) * k]], 'pencil', 'leaf', { w: 0.8, p: 0.7 }); }
        else A.dot(qx, qy, 'chalk', 'khadi', { w: 1.5 * k, p: 0.95 });
      }
      pen([x, yy + fh], [x + w, yy + fh], null, 0.6, 0.8);
      yy += fh + 1.2 * k;
    }
    const dadoH = b.dado ? 7.5 * k : 0;
    if (b.dado && !far) {
      const y0 = y - dadoH;
      solid(A, [[x + 0.6, y0], [x + w - 0.6, y0], [x + w - 0.6, y], [x + 0.6, y]], b.dado, { w: 3, ang: 0.03 });
      for (let px = x + 1.5 * k; px < x + w - 5 * k; px += rr(5.6, 6.6) * k) A.stroke([[px, y - 1.2 * k], [px + 0.8 * k, y - 4.6 * k], [px + 2.9 * k, y - 6.8 * k], [px + 5 * k, y - 4.6 * k], [px + 5.8 * k, y - 1.2 * k]], 'pencil', b.petal || 'crimson', { w: 0.9, p: 0.62, wob: 0.5 });
      pen([x, y0], [x + w, y0], null, 0.6, 0.8);
    }
    // windows
    const wins = [], rows = b.rows || 1, cols = b.cols || 1, y0 = yy + 2.5 * k, y1 = y - dadoH - 3 * k, cw = w / cols, ch = (y1 - y0) / rows;
    const ww = Math.min(cw * 0.5, 15 * k), wh = Math.min(ch * 0.74, ww * 1.75);
    const dr = b.door, dw = dr ? Math.min(27 * k, w * 0.32) : 0, dh = dr ? Math.min((y1 - y0) * 0.72, 46 * k) : 0, dcx = dr ? x + w * dr.at : 0;
    const wo = { k, lw, ink, fill: b.inner, awn2: b.awn2, stud: b.stud };
    if (b.win !== 'none') for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const n = r * cols + c, cx = x + (c + 0.5) * cw + rr(-0.7, 0.7) * k, by = y0 + (r + 0.5) * ch + wh * 0.5 + rr(-0.5, 0.5) * k;
      if (b.skip && b.skip.includes(n)) continue;
      if (dr && Math.abs(cx - dcx) < dw * 0.5 + ww * 0.75 && by > y - dadoH - dh - 8 * k) continue;
      if (b.keep && cx > b.keep[0] && cx < b.keep[1] && by > b.keep[2]) continue;
      const lit = !!(b.lit2 && b.lit2.includes(n)), bal = b.balcony && r === 0 && c === (cols >> 1) && !far;
      if (bal) {
        const bw = ww * 1.9, bh = wh * 1.12, b0 = by + 2 * k;
        solid(A, [[cx - bw / 2, b0 - bh], [cx + bw / 2, b0 - bh], [cx + bw / 2, b0], [cx - bw / 2, b0]], b.bright || 'khadi', { w: 3, ang: -0.3 });
        const cap = []; for (let i = 0; i <= 12; i++) { const t = -1 + 2 * i / 12; cap.push([cx + t * bw * 0.62, b0 - bh - 1.2 * k - 2 * k * (1 - t * t)]); }
        for (let i = 12; i >= 0; i--) { const t = -1 + 2 * i / 12; cap.push([cx + t * bw * 0.56, b0 - bh - 2 * k - 7.5 * k * (1 - Math.pow(Math.abs(t), 2.2))]); }
        solid(A, cap, b.cap || 'gulabi', { w: 2.4, ang: 0.2 }); A.outline(cap, 'pencil', ink, { closed: true, w: lw * 0.85, p: 0.75, pull: 40 });
        kalash(A, cx, b0 - bh - 9 * k, 6.5 * k);
        win(A, cx, b0 - 2.4 * k, ww * 1.05, wh * 0.86, Object.assign({}, wo, { lit, fill: lit ? 'saffron' : b.inner }));
        A.outline([[cx - bw / 2, b0 - bh], [cx - bw / 2, b0], [cx + bw / 2, b0], [cx + bw / 2, b0 - bh]], 'pencil', ink, { w: lw * 0.9, p: 0.8, pull: 40 });
        for (const f of [-0.36, 0, 0.36]) A.stroke([[cx + f * bw, b0 + 0.4], [cx + f * bw * 0.8, b0 + 2.6 * k], [cx + f * bw * 0.86, b0 + 4.6 * k]], 'pencil', ink, { w: lw * 0.9, p: 0.7 });
        hl(A, [cx - bw * 0.56, b0 - 2.2 * k], [cx + bw * 0.56, b0 - 2.2 * k], 'pencil', b.soft, { w: 0.8, p: 0.6 });
        wins.push([cx, b0, bw, bh]);
        continue;
      }
      const shut = b.win === 'shut' && !lit && (n * 7 + (b.sd || 0)) % 5 !== 0;
      win(A, cx, by, ww, wh, Object.assign({}, wo, { lit, shut, fill: lit ? 'saffron' : shut ? b.shut : b.inner, awn: b.awn && r === 0 && !far ? b.awn : null }));
      wins.push([cx, by, ww, wh]);
    }
    if (dr && !far) door(A, dcx, y - 0.5, dw, dh, { k, lw, ink, c: dr.c, frame: dr.frame, step: dr.step, lit: dr.lit });
    if (!far && b.worn !== false) {
      for (let i = 0, n = Math.round(w * h / 5200); i < n; i++) crack(A, x + rr(4, w - 10), yy + rr(4, Math.max(6, h - 20)), rr(7, 16) * k, rr(0.6, 2.4), b.soft);
      if (wins.length && A.chance(0.7)) { const q = A.pick(wins); tint(A, [[q[0] - q[2] * 0.4, q[1] + 2], [q[0] + q[2] * 0.4, q[1] + 2], [q[0] + q[2] * 0.2, q[1] + 12 * k], [q[0] - q[2] * 0.3, q[1] + 15 * k]], b.stain || 'stone', { p: 0.4, gap: 0.6, ang: 1.5, w: 2 }); }
    }
    return { F: (X, Z) => [x + X + Z * SX, yF - Z * SY], floor, back: [x + ox, yT - oy, x + w + ox], front: [x, yT, x + w], wins, yF, yT, ox, oy };
  };

  /* M.shikhara(A, x, y, w, h, o): the spire of a temple, white, in courses.  (x, y) = middle of its foot, w = width at the foot,
     h = height of the stone.  o: wall, shade, line, soft, band, lit (true: a lamp in the niche), mini (0 = no small spires at its shoulders)
     returns { top: [x, y] (foot of the flag pole), pole: [x, y] (its head) } */
  M.shikhara = function (A, x, y, w, h, o) {
    o = o || {};
    const rr = A.rr, ink = o.line || 'sepia', soft = o.soft || 'grey', k = w / 84, lw = Math.max(0.65, Math.sqrt(k));
    const hw = v => (w / 2) * (1 - 0.84 * Math.pow(v, 2.15));
    if (o.mini !== 0) for (const sg of [-1, 1]) M.shikhara(A, x + sg * w * 0.47, y, w * 0.4, h * 0.46, Object.assign({}, o, { mini: 0, pole: 0, lit: false }));
    const body = []; const N = 26;
    for (let i = 0; i <= N; i++) { const v = i / N; body.push([x - hw(v), y - v * h]); }
    for (let i = N; i >= 0; i--) { const v = i / N; body.push([x + hw(v), y - v * h]); }
    solid(A, body, o.wall || 'khadi', { ang: -0.5 });
    A.withMask(body, () => {
      tint(A, [[x - w, y - h], [x - w * 0.12, y - h], [x - w * 0.16, y], [x - w, y]], o.shade || 'lilac', { p: 0.5, gap: 0.7, ang: -1.1 });
      tint(A, [[x + w * 0.26, y - h], [x + w, y - h], [x + w, y], [x + w * 0.3, y]], o.warm || 'peach', { p: 0.34, gap: 0.8, ang: -1.1 });
      // the courses
      let i = 0;
      for (let yy = y - 5 * k; yy > y - h + 3; yy -= rr(5, 6.6) * k, i++) { const v = (y - yy) / h, a = hw(v); hl(A, [x - a, yy], [x + a, yy + rr(-0.4, 0.4)], 'pencil', i % 4 === 3 ? ink : (o.band || 'rose'), { w: i % 4 === 3 ? 0.9 * lw : 0.75, p: i % 4 === 3 ? 0.62 : 0.45, ov: 0 }); }
    });
    // the ribs that run up it
    for (const f of [-0.62, -0.26, 0.26, 0.62]) { const pts = []; for (let i = 0; i <= N; i++) { const v = i / N; pts.push([x + f * hw(v), y - v * h]); } A.stroke(pts, 'pencil', Math.abs(f) < 0.5 ? ink : soft, { w: 0.85 * lw, p: 0.62 }); }
    // little niches up the middle
    for (const v of [0.07, 0.3, 0.5]) {
      const nw = w * (v < 0.1 ? 0.2 : 0.11) * (1 - v * 0.5), nh = nw * 1.5, by = y - v * h, op = arch(x, by, nw, nh, v < 0.1 ? 3 : 0, 0.1);
      solid(A, op, o.inner || 'maroon', { w: Math.max(1.4, nw * 0.4) });
      if (o.lit && v < 0.1) A.withMask(op, () => glow(A, x, by - nh * 0.4, nw * 0.7, { c0: 'hingul' }));
      A.outline(op, 'pencil', ink, { w: 0.8 * lw, p: 0.7, pull: 30 });
    }
    A.outline(body.slice(0, N + 1), 'pencil', ink, { w: lw, p: 0.8, pull: 70, again: 0.25 });
    A.outline(body.slice(N + 1), 'pencil', ink, { w: lw, p: 0.8, pull: 70, again: 0.25 });
    // neck, the ribbed stone, the gold pot
    const ty = y - h, nw = hw(1);
    solid(A, [[x - nw * 0.8, ty - 3 * k], [x + nw * 0.8, ty - 3 * k], [x + nw, ty + 0.5], [x - nw, ty + 0.5]], o.wall || 'khadi', { w: 2 });
    const am = A.ellipse(x, ty - 6.6 * k, nw * 1.75, 4.2 * k);
    solid(A, am, o.amalaka || 'gulabi', { w: 2.4, ang: 0.1 });
    for (let f = -0.8; f <= 0.81; f += 0.32) A.stroke([[x + f * nw * 1.7, ty - 3.4 * k], [x + f * nw * 1.5, ty - 9.8 * k]], 'pencil', ink, { w: 0.7, p: 0.5 });
    A.outline(am, 'pencil', ink, { closed: true, w: 0.85 * lw, p: 0.75, pull: 30 });
    kalash(A, x, ty - 10 * k, 13 * k);
    const pole = [x + rr(-0.4, 0.4), ty - 22 * k - (o.pole === 0 ? 0 : h * 0.14)];
    if (o.pole !== 0) A.stroke([[x, ty - 21 * k], pole], 'kajal', o.poleC || 'umber', { w: 1.2 * lw, p: 0.9, tin: 0, tout: 0 });
    return { top: [x, ty - 22 * k], pole };
  };

  // ============================================================== THINGS LEFT ON THE ROOFS
  // a flower pot; (x, y) = middle of its foot, s = height of the pot
  M.pot = function (A, x, y, s, kind, o) {
    o = o || {};
    const rr = A.rr, ink = o.line || 'sepia', dim = c => o.dim ? A.mix(c, 'neel', o.dim) : c;
    if (kind === 'tulsi') for (let i = 0; i < 7; i++) { const a = -PI / 2 + rr(-0.6, 0.6), l = s * rr(0.9, 1.7); A.stroke([[x + rr(-0.2, 0.2) * s, y - s * 0.9], [x + Math.cos(a) * l * 0.6, y - s - l * 0.55], [x + Math.cos(a) * l, y - s + Math.sin(a) * l]], 'chalk', dim(A.pick(['sap', 'leaf', 'malachite'])), { w: Math.max(1, s * 0.16), p: 0.95, tin: 0, tout: 0.5 }); }
    else if (kind === 'palm') for (let i = 0; i < 6; i++) { const a = -PI / 2 + (i - 2.5) * 0.48 + rr(-0.1, 0.1), l = s * rr(1.4, 2); A.stroke([[x, y - s * 0.9], [x + Math.cos(a) * l * 0.6, y - s * 0.9 + Math.sin(a) * l * 0.75], [x + Math.cos(a) * l * 1.05, y - s * 0.9 + Math.sin(a) * l * 0.62]], 'chalk', dim(i % 2 ? 'sap' : 'malachite'), { w: Math.max(1.1, s * 0.2), p: 0.95, tin: 0, tout: 0.6 }); }
    else {
      const m = A.roughen(A.ellipse(x, y - s * 1.52, s * 0.66, s * 0.56), s * 0.07, s * 0.5, true);
      solid(A, m, dim(kind === 'rose' ? 'bottle' : 'sap'), { w: Math.max(1.6, s * 0.3) });
      const fl = kind === 'rose' ? ['crimson', 'rose', 'gulabi'] : kind === 'white' ? ['khadi', 'cream', 'khadi'] : ['saffron', 'haldi', 'sindoor'];
      for (let i = 0, n = Math.max(4, Math.round(s * 0.7)); i < n; i++) { const a = rr(0, 6.28), r = Math.sqrt(A.rnd()); A.dot(x + Math.cos(a) * r * s * 0.56, y - s * 1.52 + Math.sin(a) * r * s * 0.46, 'chalk', dim(A.pick(fl)), { w: Math.max(1, s * 0.2), p: 1, reach: 1.6 }); }
    }
    const pot = [[x - s * 0.44, y - s], [x + s * 0.44, y - s], [x + s * 0.3, y], [x - s * 0.3, y]];
    solid(A, pot, dim(o.c || 'brick'), { w: Math.max(1.6, s * 0.3), ang: 0.1 });
    A.stroke([[x - s * 0.46, y - s * 0.94], [x + s * 0.46, y - s * 0.94]], 'chalk', dim(o.rim || 'saffron'), { w: Math.max(0.9, s * 0.14), p: 0.9 });
    A.outline(pot, 'pencil', ink, { closed: true, w: 0.75, p: 0.6, pull: 30 });
  };
  // a kite spool lying where it was put down; (x, y) = its middle, s = length with the handles
  M.spool = function (A, x, y, s, c, ang, o) {
    o = o || {};
    const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), T = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
    A.stroke([T(-0.5, 0), T(0.5, 0)], 'kajal', 'umber', { w: Math.max(1, s * 0.055), p: 0.95, tin: 0, tout: 0 });
    const body = [T(-0.25, -0.15), T(0.25, -0.15), T(0.25, 0.15), T(-0.25, 0.15)];
    solid(A, body, c, { w: Math.max(1.4, s * 0.1), ang: (ang || 0) + 1.57 });
    for (let f = -0.2; f <= 0.21; f += 0.08) A.stroke([T(f, -0.15), T(f + 0.02, 0.15)], 'pencil', o.dark || 'sepia', { w: 0.6, p: 0.42 });
    for (const sg of [-1, 1]) A.stroke([T(sg * 0.27, -0.2), T(sg * 0.27, 0.2)], 'kajal', 'umber', { w: Math.max(1.2, s * 0.07), p: 1, tin: 0, tout: 0 });
    if (o.thread !== false) { const a = T(0.1, -0.15); A.stroke(A.spline([a, [a[0] + s * 0.3, a[1] - s * 0.34], [a[0] + s * 0.1, a[1] - s * 0.62], [a[0] + s * 0.5, a[1] - s * 0.8]], false, 2), 'pencil', c, { w: 0.7, p: 0.8 }); }
  };
  // a cat asleep; (x, y) = under its middle, s = its length
  M.cat = function (A, x, y, s, c, o) {
    o = o || {};
    const ink = o.line || 'sepia', body = A.roughen(A.ellipse(x, y - s * 0.24, s * 0.46, s * 0.25), s * 0.02, s * 0.4, true);
    solid(A, body, c, { w: Math.max(1.8, s * 0.12), ang: 0.2 });
    const hx = x - s * 0.36, hy = y - s * 0.2, head = A.ellipse(hx, hy, s * 0.17, s * 0.15);
    for (const sg of [-1, 1]) solid(A, [[hx + sg * s * 0.14, hy - s * 0.06], [hx + sg * s * 0.13, hy - s * 0.25], [hx + sg * s * 0.02, hy - s * 0.12]], c, { w: Math.max(1.2, s * 0.06) });
    solid(A, head, c, { w: Math.max(1.6, s * 0.1) });
    A.stroke(A.spline([[x + s * 0.44, y - s * 0.2], [x + s * 0.4, y - s * 0.02], [x, y + s * 0.02], [x - s * 0.24, y - s * 0.04]], false, 2), 'chalk', o.c2 || c, { w: Math.max(1.6, s * 0.09), p: 1, reach: 1.6, tin: 0, tout: 0.3 });
    for (const f of [-0.08, 0.1, 0.26]) A.stroke([[x + f * s, y - s * 0.46], [x + f * s + s * 0.03, y - s * 0.3]], 'pencil', o.stripe || 'umber', { w: 0.9, p: 0.6 });
    A.outline(body, 'pencil', ink, { closed: true, w: 0.75, p: 0.5, pull: 30 });
    A.stroke(A.ellipse(hx - s * 0.04, hy, s * 0.04, s * 0.02, 0, 0.2, 2.9), 'kajal', 'kajal', { w: 0.7, p: 0.8 });
    A.stroke(A.ellipse(hx + s * 0.07, hy, s * 0.04, s * 0.02, 0, 0.2, 2.9), 'kajal', 'kajal', { w: 0.7, p: 0.8 });
  };
  // a round water pot; (x, y) = its foot, s = its width
  M.matka = function (A, x, y, s, c, o) {
    o = o || {};
    const body = A.ellipse(x, y - s * 0.42, s * 0.5, s * 0.42);
    solid(A, body, c, { w: Math.max(1.6, s * 0.2), ang: 0.3 });
    solid(A, [[x - s * 0.2, y - s * 0.92], [x + s * 0.2, y - s * 0.92], [x + s * 0.16, y - s * 0.76], [x - s * 0.16, y - s * 0.76]], c, { w: Math.max(1.2, s * 0.12) });
    A.stroke([[x - s * 0.24, y - s * 0.93], [x + s * 0.24, y - s * 0.93]], 'chalk', o.rim || 'peach', { w: Math.max(0.9, s * 0.08), p: 0.9 });
    A.stroke(A.ellipse(x, y - s * 0.46, s * 0.48, s * 0.12, 0, 0.3, 2.84), 'pencil', o.band || 'khadi', { w: 0.8, p: 0.7 });
    A.dot(x - s * 0.2, y - s * 0.58, 'chalk', o.rim || 'peach', { w: Math.max(0.9, s * 0.1), p: 0.7 });
    A.outline(body, 'pencil', o.line || 'sepia', { closed: true, w: 0.75, p: 0.55, pull: 30 });
  };
  M.ladder = function (A, x0, y0, x1, y1, wd, c) {
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * wd / 2, ny = ux * wd / 2;
    for (const sg of [-1, 1]) hl(A, [x0 + sg * nx, y0 + sg * ny], [x1 + sg * nx, y1 + sg * ny], 'kajal', c || 'umber', { w: 1.5, p: 0.9 });
    for (let d = 5; d < L - 3; d += A.rr(6, 7.4)) hl(A, [x0 + ux * d - nx, y0 + uy * d - ny], [x0 + ux * d + nx, y0 + uy * d + ny], 'pencil', c || 'umber', { w: 1.1, p: 0.85, ov: 0.5 });
  };
  // something spread on the floor to dry: red chillies, or rounds of papad on a cloth
  M.mat = function (A, pts, kind, o) {
    o = o || {};
    const dim = c => o.dim ? A.mix(c, 'neel', o.dim) : c, ch = kind === 'chilli';
    solid(A, pts, dim(ch ? 'hingul' : 'khadi'), { ang: -0.2 });
    const sc = A.scatter([pts], ch ? 3 : 6.4, { jit: ch ? 0.5 : 0.2, margin: ch ? 1 : 2.4 });
    for (const q of sc) {
      if (ch) A.stroke([[q[0], q[1]], [q[0] + A.rr(-2.4, 2.4), q[1] + A.rr(-1.2, 1.2)]], 'pencil', dim(A.pick(['crimson', 'lac', 'sindoor', 'maroon'])), { w: 1, p: 0.9, tin: 0, tout: 0.3 });
      else { const e = A.ellipse(q[0], q[1], 2.5, 1.6); A.fill(e, 'chalk', dim(A.pick(['haldi', 'cream', 'peori'])), { w: 1.6, p: 1, reach: 1.6, passes: 2, gap: 0.4 }); }
    }
    A.outline(pts, 'pencil', o.line || 'sepia', { closed: true, w: 0.75, p: 0.55, pull: 40 });
  };
  // a string cot: F maps (X, Z) on the roof floor to the sheet; (X0, Z0) = its near left foot, l long, d deep
  M.cot = function (A, F, X0, Z0, l, d, o) {
    o = o || {};
    const up = 5.5, P = (X, Z) => { const q = F(X, Z); return [q[0], q[1] - up]; };
    const fr = [P(X0, Z0), P(X0 + l, Z0), P(X0 + l, Z0 + d), P(X0, Z0 + d)];
    for (const q of [[X0, Z0], [X0 + l, Z0], [X0 + l, Z0 + d], [X0, Z0 + d]]) { const a = F(q[0], q[1]); A.stroke([[a[0], a[1] - up], [a[0], a[1] + 0.5]], 'kajal', 'umber', { w: 1.5, p: 0.95, tin: 0, tout: 0 }); }
    solid(A, fr, o.c || 'cream', { ang: -0.1 });
    for (let t = 0.06; t < 1; t += 0.075) { A.stroke([P(X0 + l * t, Z0), P(X0 + l * Math.min(1, t + 0.3), Z0 + d)], 'pencil', 'umber', { w: 0.6, p: 0.45 }); A.stroke([P(X0 + l * t, Z0 + d), P(X0 + l * Math.min(1, t + 0.3), Z0)], 'pencil', 'ochre', { w: 0.6, p: 0.4 }); }
    A.outline(fr, 'kajal', 'umber', { closed: true, w: 1.3, p: 0.9, pull: 50 });
    if (o.cloth) { const cl = [P(X0 + l * 0.1, Z0 + d * 0.1), P(X0 + l * 0.52, Z0 + d * 0.1), P(X0 + l * 0.52, Z0 + d * 0.9), P(X0 + l * 0.1, Z0 + d * 0.9)]; solid(A, cl, o.cloth, { ang: 0.5 }); A.outline(cl, 'pencil', 'sepia', { closed: true, w: 0.7, p: 0.5 }); for (const q of A.scatter([cl], 4, { margin: 1 })) A.dot(q[0], q[1], 'chalk', 'khadi', { w: 0.9, p: 0.9 }); }
  };
  // washing on a line between two poles: long cloths in the colours of the day
  M.clothes = function (A, x0, y0, x1, y1, o) {
    o = o || {};
    const rr = A.rr, n = o.n || 4, hh = o.h || 30, dim = c => o.dim ? A.mix(c, 'neel', o.dim) : c, cols = o.cols || ['crimson', 'haldi', 'teal', 'rose', 'lapis', 'saffron', 'khadi', '#3f9c58'];
    for (const p of [[x0, y0], [x1, y1]]) A.stroke([[p[0], p[1] - 4], [p[0] + rr(-0.6, 0.6), p[1] + hh * 1.25]], 'kajal', 'umber', { w: 1.5, p: 0.95, tin: 0, tout: 0 });
    const ln = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 5 * Math.sin(PI * t)];
    let t = 0.07, i = (o.first || 0);
    while (t < 0.9) {
      const wt = rr(0.1, 0.2) * (4 / n), a = ln(t), b = ln(Math.min(0.95, t + wt)), len = hh * rr(0.55, 1.1), c = dim(cols[i % cols.length]), c2 = dim(cols[(i + 3) % cols.length]);
      const cl = [a, b, [b[0] + rr(-1, 1), b[1] + len], [a[0] + rr(-1, 1), a[1] + len + rr(-2, 2)]];
      solid(A, cl, c, { ang: 1.5 });
      A.stroke([[cl[3][0], cl[3][1] - 2.6], [cl[2][0], cl[2][1] - 2.6]], 'chalk', c2, { w: 2, p: 0.95, reach: 1.5 });
      if (i % 2 === 0) for (const q of A.scatter([cl], 4.2, { margin: 1.4 })) A.dot(q[0], q[1], 'chalk', dim('khadi'), { w: 0.9, p: 0.85 });
      else for (let f = 0.3; f < 1; f += 0.34) A.stroke([[a[0] + (b[0] - a[0]) * f, a[1] + 1], [cl[3][0] + (cl[2][0] - cl[3][0]) * f, cl[3][1] - 4]], 'pencil', c2, { w: 0.8, p: 0.7 });
      A.outline(cl, 'pencil', o.line || 'sepia', { closed: true, w: 0.7, p: 0.5, pull: 40 });
      t += wt + rr(0.02, 0.06); i++;
    }
    const pts = []; for (let k = 0; k <= 12; k++) pts.push(ln(k / 12));
    A.stroke(pts, 'pencil', o.line || 'sepia', { w: 0.8, p: 0.8 });
  };
  // a pigeon on the wing, seen small: (x, y) = body, s = half span
  M.pigeon = function (A, x, y, s, flap, c) {
    const lift = flap ? -0.32 : 0.34;
    for (const sg of [-1, 1]) A.stroke([[x, y], [x + sg * s * 0.5, y - s * lift * 0.9], [x + sg * s, y - s * lift * (flap ? 0.5 : 1.25)]], 'kajal', c || 'slate', { w: s * 0.2, p: 0.95, tin: 0, tout: 0.7, t0: 0.15, wob: 0.3 });
    A.stroke([[x - s * 0.16, y + s * 0.04], [x + s * 0.2, y - s * 0.02]], 'kajal', c || 'slate', { w: s * 0.3, p: 1, tin: 0.1, tout: 0.2 });
    A.dot(x - s * 0.06, y - s * 0.02, 'chalk', 'khadi', { w: Math.max(0.7, s * 0.14), p: 0.8 });
  };
  // a pigeon sitting on a wall; (x, y) = its feet, s = its length
  M.pigeonSit = function (A, x, y, s, flip, c) {
    const f = flip ? -1 : 1;
    A.stroke([[x - f * s * 0.45, y - s * 0.18], [x, y - s * 0.3], [x + f * s * 0.3, y - s * 0.42]], 'kajal', c || 'slate', { w: s * 0.36, p: 1, tin: 0.3, tout: 0.1, wob: 0.2 });
    A.dot(x + f * s * 0.36, y - s * 0.62, 'chalk', c || 'slate', { w: s * 0.26, p: 1, reach: 1.5 });
    A.stroke([[x + f * s * 0.46, y - s * 0.6], [x + f * s * 0.58, y - s * 0.56]], 'pencil', 'saffron', { w: 0.7, p: 0.9 });
    A.dot(x + f * s * 0.05, y - s * 0.34, 'chalk', 'khadi', { w: Math.max(0.6, s * 0.1), p: 0.7 });
  };
  // the long flag of a temple; (x, y) = where it is tied at the head of the pole, s = its length, ph = where the wave is
  M.pennant = function (A, x, y, s, ph, c, o) {
    o = o || {};
    const top = [], bot = [], n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n, wv = Math.sin(t * 5.4 - ph) * s * 0.055 * (0.3 + t), dr = s * 0.2 * t * t;
      top.push([x + s * t, y + wv + dr]); bot.push([x + s * t, y + s * 0.34 * (1 - t) + wv * 1.2 + dr + s * 0.02 * t]);
    }
    const poly = top.concat(bot.reverse());
    solid(A, poly, c || 'saffron', { w: Math.max(1.6, s * 0.08), ang: 0.2 });
    A.withMask(poly, () => A.stroke(top.map((p, i) => [p[0], p[1] + s * 0.16 * (1 - i / n)]), 'chalk', o.c2 || 'haldi', { w: Math.max(1, s * 0.05), p: 0.9, reach: 1.4 }));
    A.outline(poly, 'pencil', o.line || 'lac', { closed: true, w: 0.75, p: 0.6, pull: 40 });
  };
  // a clay lamp on a wall, lit
  M.diya = function (A, x, y, s, o) {
    o = o || {};
    if (o.glow !== false) glow(A, x, y - s * 0.6, s * 1.5, { c0: false, k: 0.8 });
    A.dot(x, y - s * 0.12, 'chalk', 'brick', { w: Math.max(1.4, s * 0.4), len: s * 0.3, ang: 0, p: 1, reach: 1.6 });
    if (o.flame !== false) flame(A, x, y - s * 0.25, s * 0.9);
  };
  // a small round tree far off, no more than a few dabs
  M.puff = function (A, x, y, r, c, c2) {
    const m = A.roughen(A.ellipse(x, y - r * 0.9, r, r * 0.9), r * 0.12, r * 0.8, true);
    solid(A, m, c, { w: Math.max(1.6, r * 0.5) });
    for (let i = 0, n = Math.max(3, Math.round(r * 1.1)); i < n; i++) { const a = A.rr(0, 6.28), q = Math.sqrt(A.rnd()) * r * 0.8; A.dot(x + Math.cos(a) * q - r * 0.1, y - r * 0.95 + Math.sin(a) * q * 0.85, 'chalk', c2, { w: Math.max(0.8, r * 0.22), p: 0.85 }); }
    A.stroke([[x, y - r * 0.1], [x + A.rr(-0.5, 0.5), y + r * 0.5]], 'pencil', 'umber', { w: Math.max(0.8, r * 0.16), p: 0.8 });
  };
})();
