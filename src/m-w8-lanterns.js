(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE FESTIVAL CANOPY
       M.w8Canopy(A, o)    cords strung across a hall under an eave, tier under tier, hung with lanterns of four kinds
                           (kandil, star, paper, pierced brass) and with bunting, every lantern lit from inside.
                           o = { x0, x1, y, drop, at: [anchor x...], count, P, seed }
                           y is the underside of the eave the cords are tied to; drop how far the lowest tier hangs.
                           Exactly o.count lanterns are hung (the default is 60).  Returns the lanterns placed,
                           [{x, y, kind, s}], so the page can sway them and light them.
       M.w8Lantern(A, x, y, s, kind, c, P)   one lantern hanging from (x, y); s its height
     Units are picture units.
     ======================================================================== */
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const PAPER = ['#e8641e', '#d23c5a', '#e6b422', '#2f8a5a', '#c4301c', '#e87aa0', '#f0a030', '#3a6ab8'];
  const BUNT = ['#c4301c', '#e6b422', '#f4ecd8', '#2a4c9c', '#e87aa0', '#2f8a5a', '#e8641e'];
  const LINE = '#24120a';

  // the light inside: a warm glow round it on the wall behind, and the paper lit from within, brightest at its heart
  function inner(A, poly, cx, cy, r, c) {
    M.floorWash(A, poly, '#fff2c0', (x, y) => 0.75 * Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (r * r)), 'over');
    M.floorWash(A, poly, c, (x, y) => 0.25 * sstep(Math.hypot(x - cx, y - cy) / (r * 1.6)), 'mul');
  }

  M.w8Lantern = function (A, x, y, s, kind, c, P) {
    const lw = Math.max(0.25, s * 0.035), line = LINE, gold = (P && P.gold) || '#d6a535';
    if (kind === 'kandil') {
      // the sky lantern of Diwali: a paper diamond on a little cap, its tails hanging below
      const top = y + s * 0.12, mid = y + s * 0.42, bot = y + s * 0.72, hw = s * 0.3;
      for (let i = 0; i < 5; i++) { const tx = x + (i - 2) * hw * 0.32; A.stroke([[tx, bot - s * 0.04], [tx + A.rr(-0.6, 0.6) * s * 0.05, y + s * A.rr(1.0, 1.25)]], 'chalk', i % 2 ? c : A.mix(c, '#fff6dc', 0.4), { w: Math.max(0.3, s * 0.045), p: 0.95, tout: 0.4 }); }
      const body = [[x, top], [x + hw, mid], [x, bot], [x - hw, mid]];
      A.fill(body, 'pastel', c, { w: Math.max(0.4, s * 0.12), p: 1, passes: 2, ang: 0.4 });
      inner(A, body, x, mid, hw * 0.7, c);
      M.w8Flame(A, x, mid + s * 0.1, s * 0.17);
      A.stroke([[x - hw, mid], [x + hw, mid]], 'chalk', A.mix(c, '#fff6dc', 0.5), { w: Math.max(0.3, s * 0.05), p: 0.9 });
      A.stroke([[x, top], [x, bot]], 'kajal', A.mix(line, c, 0.4), { w: lw * 0.8, p: 0.6 });
      A.outline(body, 'kajal', line, { closed: true, w: lw, p: 0.85, pull: 10 });
      A.fill(rect(x - s * 0.06, y + s * 0.04, x + s * 0.06, top + s * 0.02), 'chalk', gold, { w: Math.max(0.3, s * 0.05), p: 1, passes: 2 });
      return { cx: x, cy: mid, r: hw };
    }
    if (kind === 'star') {
      // a five-pointed paper star with a lit round heart and two tails
      const cx = x, cy = y + s * 0.42, R = s * 0.34, r = R * 0.45, pts = [];
      for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, q = i % 2 ? r : R; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
      for (const dx of [-0.3, 0.3]) A.stroke([[cx + dx * R, cy + R * 0.6], [cx + dx * R * 1.3, y + s * 1.1]], 'chalk', A.mix(c, '#fff6dc', 0.3), { w: Math.max(0.3, s * 0.05), p: 0.9, tout: 0.4 });
      A.fill(pts, 'pastel', c, { w: Math.max(0.4, s * 0.1), p: 1, passes: 2, ang: 0.2 });
      inner(A, pts, cx, cy, r * 1.3, c);
      A.fill(A.ellipse(cx, cy, r * 0.62, r * 0.62), 'chalk', '#fff3c8', { w: Math.max(0.3, s * 0.05), p: 0.9, passes: 2 });
      M.w8Flame(A, cx, cy + r * 0.42, r * 0.8);
      A.outline(pts, 'kajal', line, { closed: true, w: lw, p: 0.85, pull: 10 });
      return { cx, cy, r: R };
    }
    if (kind === 'paper') {
      // a round paper lantern, ribbed, with a gold rim at top and bottom and a short tassel
      const cx = x, cy = y + s * 0.45, rx = s * 0.3, ry = s * 0.34, body = A.ellipse(cx, cy, rx, ry);
      A.fill(body, 'pastel', c, { w: Math.max(0.4, s * 0.12), p: 1, passes: 2, ang: 0 });
      inner(A, body, cx, cy, rx * 0.9, c);
      M.w8Flame(A, cx, cy + ry * 0.3, s * 0.16);
      for (let k = -2; k <= 2; k++) { const yy = cy + k * ry * 0.36, hw = rx * Math.sqrt(Math.max(0, 1 - Math.pow((yy - cy) / ry, 2))); A.stroke([[cx - hw, yy], [cx + hw, yy]], 'kajal', A.mix(line, c, 0.45), { w: lw * 0.7, p: 0.55 }); }
      for (const yy of [cy - ry * 0.96, cy + ry * 0.96]) A.fill(rect(cx - rx * 0.4, yy - s * 0.035, cx + rx * 0.4, yy + s * 0.035), 'chalk', gold, { w: Math.max(0.3, s * 0.05), p: 1, passes: 2 });
      A.stroke([[cx, cy + ry], [cx, cy + ry + s * 0.22]], 'chalk', '#c4301c', { w: Math.max(0.3, s * 0.06), p: 0.95 });
      A.dot(cx, cy + ry + s * 0.23, 'gold', gold, { w: Math.max(0.3, s * 0.07), p: 1 });
      for (let k = -2; k <= 2; k++) A.stroke([[cx + k * s * 0.012, cy + ry + s * 0.25], [cx + k * s * 0.03, cy + ry + s * 0.38]], 'chalk', k % 2 ? '#c4301c' : '#e8641e', { w: Math.max(0.15, s * 0.022), p: 0.95, tout: 0.4 });
      A.outline(body, 'kajal', line, { closed: true, w: lw, p: 0.85, pull: 10 });
      return { cx, cy, r: rx };
    }
    // pierced brass: an onion dome over a cage of brass, the light coming through its holes in points
    const cx = x, cy = y + s * 0.52, hw = s * 0.22, top = y + s * 0.2, bot = y + s * 0.82;
    const dome = A.spline([[cx - hw * 1.15, top + s * 0.08], [cx - hw * 0.8, top - s * 0.02], [cx, y + s * 0.06], [cx + hw * 0.8, top - s * 0.02], [cx + hw * 1.15, top + s * 0.08]], false, 0.6).concat([[cx + hw * 1.15, top + s * 0.1], [cx - hw * 1.15, top + s * 0.1]]);
    const cage = A.spline([[cx - hw, top + s * 0.1], [cx - hw * 1.1, cy], [cx - hw * 0.6, bot], [cx + hw * 0.6, bot], [cx + hw * 1.1, cy], [cx + hw, top + s * 0.1]], true, 0.6);
    for (let k = 0; k < 18; k++) { const a = k * 2.39996 + x * 0.1, rr = hw * (1.5 + (k % 5) * 0.42); A.dot(cx + Math.cos(a) * rr * 1.2, cy + Math.sin(a) * rr, 'chalk', k % 3 ? '#ffd27a' : '#fff0c0', { w: Math.max(0.2, s * (0.03 + (k % 3) * 0.012)), p: 0.55 }); }
    A.fill(cage, 'pastel', '#5a3a14', { w: Math.max(0.4, s * 0.1), p: 1, passes: 2, ang: 1.4 });
    M.floorWash(A, cage, '#ffd27a', (px, py) => 0.35 * Math.exp(-((px - cx) * (px - cx) + (py - cy) * (py - cy)) / (hw * hw)), 'over');
    for (let r0 = 0; r0 < 5; r0++) for (let k = 0; k < 4; k++) {
      const yy = top + s * 0.16 + r0 * s * 0.12, xx = cx + (k - 1.5 + (r0 % 2) * 0.5) * hw * 0.5;
      if (Math.abs(xx - cx) > hw * 0.95) continue;
      A.dot(xx, yy, 'chalk', '#fff0b0', { w: Math.max(0.3, s * 0.05), p: 1 });
    }
    M.w8Flame(A, cx, cy + s * 0.08, s * 0.17);
    A.fill(dome, 'gold', gold, { w: Math.max(0.3, s * 0.08), p: 1, passes: 2 });
    M.floorWash(A, dome, '#5a3a14', (px) => 0.35 * sstep((px - cx) / hw + 0.3), 'mul');
    A.outline(cage, 'kajal', line, { closed: true, w: lw, p: 0.85, pull: 10 });
    A.outline(dome, 'kajal', line, { closed: true, w: lw, p: 0.8 });
    A.stroke([[cx, bot], [cx, bot + s * 0.12]], 'gold', gold, { w: Math.max(0.3, s * 0.06), p: 1 });
    A.dot(cx, bot + s * 0.14, 'gold', gold, { w: Math.max(0.4, s * 0.1), p: 1 });
    if (P && P.glints) P.glints.push([cx, top]);
    return { cx, cy, r: hw };
  };

  // bunting: little cloth flags, triangles mostly, now and then a square, sewn along a cord
  function bunting(A, cord, s, R) {
    for (let i = 1; i < cord.length - 1; i++) {
      const p = cord[i], q = cord[i + 1] || p, c = BUNT[(i + R.ri(0, 1)) % BUNT.length], w = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.86;
      const f = R.chance(0.8) ? [p, [p[0] + w, p[1] + (q[1] - p[1]) * 0.86], [p[0] + w * 0.5, p[1] + s * R.rr(0.9, 1.1)]] : [p, [p[0] + w, p[1] + (q[1] - p[1]) * 0.86], [p[0] + w, p[1] + s * 0.8], [p[0], p[1] + s * 0.8]];
      A.fill(f, 'pastel', c, { w: Math.max(0.35, s * 0.2), p: 1, passes: 2, ang: 1.2 });
      M.floorWash(A, f, '#1a0c08', (x) => 0.2 * sstep((x - p[0]) / Math.max(0.1, w)), 'mul');
      A.outline(f, 'kajal', LINE, { closed: true, w: Math.max(0.22, s * 0.05), p: 0.6, pull: 10 });
      if (f.length === 3 && (i * 7 + Math.round(p[0])) % 9 === 0) { const tp = f[2]; for (let k = 0; k < 4; k++) A.stroke([[tp[0] + (k - 1.5) * s * 0.06, tp[1] - s * 0.04], [tp[0] + (k - 1.5) * s * 0.1 + s * 0.04, tp[1] + s * (0.2 + (k % 2) * 0.12)]], 'chalk', c, { w: Math.max(0.12, s * 0.035), p: 0.9, tout: 0.5 }); }
    }
  }

  M.w8Canopy = function (A, o) {
    const P = o.P || {}, R = STAGE.rng(o.seed || 60), N = o.count || 60, y = o.y, drop = o.drop;
    const at = (o.at || []).filter(x => x >= o.x0 - 0.5 && x <= o.x1 + 0.5).sort((a, b) => a - b);
    if (at.length < 2) at.splice(0, at.length, o.x0, o.x1);
    // four tiers of cords: each tier a run of swags from one anchor to the anchor two along, the tiers offset
    const tiers = [];
    for (let t = 0; t < 4; t++) {
      const sag = drop * (0.18 + t * 0.2), yy = y + t * drop * 0.05, step = t % 2 ? 2 : 3, off = t % 3;
      for (let i = off % step; i + step < at.length + step; i += step) {
        const a = at[Math.min(i, at.length - 1)], b = at[Math.min(i + step, at.length - 1)];
        if (b - a < 4) continue;
        const pts = []; for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push([a + (b - a) * u, yy + sag * Math.sin(PI * u) * (1 + R.rr(-0.02, 0.02))]); }
        tiers.push({ t, a, b, pts, sag });
      }
    }
    // the cords themselves, the bunting on the first and third tiers
    for (const c of tiers) A.stroke(c.pts, 'kajal', '#4a2a14', { w: 0.45, p: 0.85 });
    for (const c of tiers) if (c.t === 0 || c.t === 2) bunting(A, c.pts.filter((p, k) => k % 2 === 0), drop * 0.07, R);
    // where the lanterns hang: spread over the lantern tiers by length, then exactly N of them
    const lt = tiers.filter(c => c.t > 0), len = lt.map(c => c.b - c.a), tot = len.reduce((s, v) => s + v, 0);
    const slots = [];
    lt.forEach((c, j) => {
      const n = Math.max(1, Math.round(N * len[j] / tot));
      for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, i = Math.round(u * 24), p = c.pts[i]; slots.push({ x: p[0], y: p[1], t: c.t }); }
    });
    while (slots.length > N) slots.splice(R.ri(0, slots.length - 1), 1);
    while (slots.length < N) { const c = R.pick(lt), u = R.rr(0.1, 0.9), p = c.pts[Math.round(u * 24)]; slots.push({ x: p[0], y: p[1], t: c.t }); }
    // the lower tiers hang behind the upper ones: draw the deepest first
    slots.sort((a, b) => b.t - a.t || a.x - b.x);
    const KINDS = ['kandil', 'kandil', 'star', 'paper', 'paper', 'brass'], out = [];
    slots.forEach((sl, i) => {
      const kind = KINDS[(i * 7 + R.ri(0, 5)) % KINDS.length], s = drop * R.rr(0.13, 0.19) * (kind === 'brass' ? 1.1 : 1), str = drop * R.rr(0.02, 0.1);
      M.lampGlow(A, sl.x, sl.y + str + s * 0.45, s * 1.5, 0.55, {});
      A.stroke([[sl.x, sl.y], [sl.x + R.rr(-0.2, 0.2), sl.y + str + s * 0.06]], 'kajal', '#3a2010', { w: 0.3, p: 0.8 });
      const r = M.w8Lantern(A, sl.x, sl.y + str, s, kind, PAPER[(i * 3 + R.ri(0, 7)) % PAPER.length], P);
      out.push({ x: +(r.cx.toFixed(1)), y: +(r.cy.toFixed(1)), kind, s: +(s.toFixed(1)) });
    });
    return out;
  };
})();
