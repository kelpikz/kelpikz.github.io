(function () {
  'use strict';
  /* ==========================================================================
     TWO FOLIOS: UTOPIA AND DALAL STREET
       M.folioArt['utopia'](A, b)        the monsoon dance: a peacock spreads its fan
                                         under the first storm, two hens watch from afar
       M.folioArt['dalal-street'](A, b)  a white bull striding uphill on a saffron ground,
                                         the hills behind stepping up like a rising line
     b = the painting box { x0, y0, x1, y1, w, h } in logical units; the frame clips to it.
     ======================================================================== */
  M.folioArt = M.folioArt || {};
  const PI = Math.PI, TAU = PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // the box with a little bleed, so the ground runs under the frame
  const bleed = (b, p) => [[b.x0 - p, b.y0 - p], [b.x1 + p, b.y0 - p], [b.x1 + p, b.y1 + p], [b.x0 - p, b.y1 + p]];
  // a band of ground between two curves y = top(x) and y = bot(x)
  function band(b, top, bot, st) {
    const out = []; st = st || 4;
    for (let x = b.x0 - 8; x <= b.x1 + 8.01; x += st) out.push([x, top(x)]);
    for (let x = b.x1 + 8; x >= b.x0 - 8.01; x -= st) out.push([x, bot(x)]);
    return out;
  }
  // a small filled oval of pigment
  function blob(A, c, x, y, rx, ry, rot, o) {
    o = o || {};
    const e = A.roughen(A.ellipse(x, y, rx, ry, rot || 0), Math.min(0.5, rx * 0.08), 8, true);
    A.fill([e], o.tool || 'pastel', c, { w: Math.max(1.2, Math.min(rx, ry) * 0.9), p: 1, reach: 1.6, passes: 2, ang: A.rr(-1, 1), cv: o.cv != null ? o.cv : 0.02, gap: 0.42 });
    return e;
  }
  // a five-petal bloom, every one a little different
  function bloom(A, x, y, r, c, heart, n) {
    n = n || 5; const a0 = A.rr(0, TAU);
    for (let k = 0; k < n; k++) {
      const a = a0 + k * TAU / n + A.rr(-0.2, 0.2), l = r * A.rr(0.85, 1.12);
      A.stroke([[x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 'chalk', c, { w: r * A.rr(0.8, 1.0), p: 0.95, reach: 1.5, tin: 0.1, tout: 0.3 });
    }
    A.dot(x, y, 'chalk', heart || 'haldi', { w: Math.max(0.7, r * 0.55), p: 1 });
  }
  // a leaf as one pressed dab of the stick's edge
  const LEAF = A => A._fc_leaf || (A._fc_leaf = A.tool('chalk', { wmin: 0.12, t0: 0.3, tin: 0.42, tout: 0.5, hard: 3.2, streak: 0.12, wob: 0.35, reach: 1.3 }));
  function leaf(A, x, y, ang, len, w, c) {
    A.stroke([[x, y], [x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5], [x + Math.cos(ang) * len, y + Math.sin(ang) * len]], LEAF(A), c, { w, p: 0.95 });
  }

  /* a small tree on a far ridge, the way a Mewar painter sets them against the sky: a dark form,
     lit from inside by sprigs of a lighter green, outlined.  x,y = foot of the trunk, h = height */
  function smallTree(A, x, y, h, kind, P) {
    const rr = A.rr, pick = A.pick;
    P = Object.assign({ c: 'bottle', mid: 'moss', leaf: 'malachite', leaf2: 'leaf', trunk: 'umber', line: 'kajal', flower: null }, P || {});
    if (kind === 'cypress') {
      // a flame: a long point at the top, full low down, rounded at the foot
      const w = h * 0.15, top = y - h, prof = t => w * Math.pow(Math.min(1, t / 0.7), 0.9) * (t > 0.7 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.7) / 0.3, 2))) : 1), pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([x + prof(t) + rr(-0.15, 0.15), top + t * h * 0.92]); }
      for (let i = 16; i >= 0; i--) { const t = i / 16; pts.push([x - prof(t) + rr(-0.15, 0.15), top + t * h * 0.92]); }
      A.stroke([[x, y], [x, y - h * 0.12]], 'kajal', P.trunk, { w: Math.max(0.9, h * 0.04), p: 0.9 });
      const sh = A.shape(pts, { c: P.c, w: Math.max(1.5, w * 0.6), passes: 2, rough: 0.25, ang: 1.4 });
      A.withMask(sh, () => {
        for (let yy = top + h * 0.06; yy < y - h * 0.1; yy += h * 0.05 * rr(0.8, 1.2)) for (const sd of [-1, 1]) {
          const t = (yy - top) / h, ww = prof(t / 0.92) * 0.85;
          A.stroke([[x + sd * 0.4, yy + h * 0.02], [x + sd * ww, yy - h * 0.012]], 'chalk', pick([P.leaf, P.mid, P.leaf]), { w: Math.max(0.6, h * 0.022), p: rr(0.55, 0.85), tin: 0.1, tout: 0.4 });
        }
      });
      A.outline(sh, 'kajal', P.line, { closed: true, w: Math.max(0.5, h * 0.018), p: 0.65, pull: 30 });
      return;
    }
    if (kind === 'palm') {
      const lean = rr(-0.12, 0.12) * h, top = [x + lean, y - h * 0.82];
      const tr = A.spline([[x, y], [x + lean * 0.3, y - h * 0.4], top], false, 1.2);
      A.stroke(tr, 'chalk', A.mix(P.trunk, 'sand', 0.3), { w: Math.max(1, h * 0.05), p: 0.95, tin: 0, tout: 0 });
      for (let i = 2; i < tr.length - 2; i += 2) A.stroke([[tr[i][0] - h * 0.025, tr[i][1]], [tr[i][0] + h * 0.025, tr[i][1] - 0.4]], 'kajal', P.trunk, { w: 0.5, p: 0.6 });
      const nf = A.ri(8, 10);
      for (let k = 0; k < nf; k++) {
        const a = -PI / 2 + (k / (nf - 1) - 0.5) * PI * 1.25 + rr(-0.12, 0.12), L = h * rr(0.3, 0.42), droop = Math.abs(Math.cos(a)) * L * 0.5;
        const fr = A.spline([top, [top[0] + Math.cos(a) * L * 0.55, top[1] + Math.sin(a) * L * 0.55 - L * 0.08], [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L + droop]], false, 1);
        A.stroke(fr, 'kajal', P.c, { w: Math.max(0.6, h * 0.025), p: 0.9 });
        for (let i = 2; i < fr.length - 1; i += 1) for (const sd of [-1, 1]) {
          const q = fr[i], q2 = fr[i + 1], ta = Math.atan2(q2[1] - q[1], q2[0] - q[0]) + sd * 0.9 + 0.35;
          A.stroke([q, [q[0] + Math.cos(ta) * h * 0.075, q[1] + Math.sin(ta) * h * 0.075]], 'chalk', pick([P.c, P.mid, P.leaf]), { w: Math.max(0.5, h * 0.017), p: 0.85, tin: 0, tout: 0.6 });
        }
      }
      for (let k = 0; k < 4; k++) A.dot(top[0] + rr(-1.2, 1.2), top[1] + rr(0.5, 2.2), 'chalk', pick(['saffron', 'ochre']), { w: Math.max(0.8, h * 0.04) });
      return;
    }
    // a round mango tree: a mound of scallops on a forked trunk
    const cx = x + rr(-0.05, 0.05) * h, cy = y - h * 0.6, rx = h * rr(0.36, 0.42), ry = h * 0.38;
    A.stroke([[x, y], [x + rr(-0.5, 0.5), y - h * 0.3], [cx, cy + ry * 0.4]], 'chalk', P.trunk, { w: Math.max(1, h * 0.07), p: 0.95, tin: 0, tout: 0.2 });
    A.stroke([[x, y - h * 0.25], [x - h * 0.12, cy + ry * 0.3]], 'chalk', P.trunk, { w: Math.max(0.7, h * 0.04), p: 0.9, tin: 0, tout: 0.4 });
    const nl = A.ri(9, 12), cp = [];
    for (let i = 0; i < nl * 6; i++) {
      const a = i / (nl * 6) * TAU, lob = Math.pow(Math.abs(Math.sin((i / 6) * PI)), 0.5);
      const r = 1 + 0.07 * lob - (Math.sin(a) > 0.3 ? 0.12 * Math.sin(a) : 0);
      cp.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
    }
    const sh = A.shape(cp, { c: P.c, w: Math.max(1.6, rx * 0.4), passes: 2, rough: 0.3 });
    A.withMask(sh, () => {
      for (const p of A.scatter(sh, Math.max(2.2, h * 0.11), { jit: 0.45 })) {
        const n = A.ri(4, 6), a0 = -PI / 2 + rr(-0.5, 0.5), r = h * rr(0.045, 0.06), lc = A.chance(0.2) ? P.leaf2 : P.leaf;
        for (let k = 0; k < n; k++) { const a = a0 + (k / (n - 1) - 0.5) * 2.6; leaf(A, p[0], p[1], a, r, Math.max(0.6, h * 0.025), lc); }
      }
      if (P.flower) for (const p of A.scatter(sh, Math.max(3, h * 0.16), { jit: 0.5 })) A.dot(p[0], p[1], 'chalk', P.flower, { w: Math.max(0.8, h * 0.035) });
    });
    A.outline(sh, 'kajal', P.line, { closed: true, w: Math.max(0.5, h * 0.018), p: 0.65, pull: 30 });
  }

  /* WILD FLOWERS of the grass, each kind drawn its own way and none twice the same.  x,y = where the stem leaves the
     ground, h = the height of the plant, c = its colour.  o.lean tips the stem, o.hide (0..1) lets the grass in front
     swallow some of it, o.grass = the colours of that grass. */
  function wildflower(A, x, y, h, kind, c, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick;
    const lean = o.lean != null ? o.lean : rr(-0.3, 0.3), bend = rr(-0.3, 0.3);
    const stemC = o.stem || pick(['bottle', 'sap', 'moss', A.mix('sap', 'bottle', 0.5)]);
    const top = [x + Math.sin(lean) * h, y - Math.cos(lean) * h];
    const mid = [x + Math.sin(lean + bend) * h * 0.5, y - Math.cos(lean + bend) * h * 0.5];
    const stem = A.spline([[x, y], mid, top], false, 0.5), sw = Math.max(0.38, h * 0.045);
    // the head faces along the last of the stem; T(u, v): u across the flower, v up its axis
    const e2 = stem[Math.max(0, stem.length - 4)], ha = Math.atan2(top[0] - e2[0], e2[1] - top[1]), ca = Math.cos(ha), sa = Math.sin(ha);
    const T = (u, v) => [top[0] + u * ca + v * sa, top[1] + u * sa - v * ca];
    const leafC = () => pick(['malachite', 'sap', 'bottle', A.mix('sap', 'leaf', 0.4)]);
    if (kind !== 'bell') A.stroke(stem, 'kajal', stemC, { w: sw, p: 0.85, tin: 0, tout: 0.15 });
    for (let k = 0, nl = h > 5 ? A.ri(1, 2) : A.ri(0, 1); k < nl; k++) {
      const q = stem[Math.floor(stem.length * rr(0.1, 0.45))], sd = k % 2 ? 1 : -1;
      leaf(A, q[0], q[1], -PI / 2 + lean + sd * rr(0.55, 1.05), h * rr(0.2, 0.34), Math.max(0.6, h * rr(0.06, 0.09)), leafC());
    }
    const r = h * rr(0.17, 0.23) * (o.big || 1), heart = o.heart || pick(['haldi', 'gold', 'peori', 'haldi']);
    const outl = (po, k) => A.outline(po, 'kajal', A.mix(c, 'kajal', 0.55), { closed: true, w: 0.28, p: k || 0.5, pull: 20, again: 0 });
    if (kind === 'star') {
      // five to seven pointed petals, the face tipped back a little
      const n = A.ri(5, 7), a0 = rr(0, TAU), sq = rr(0.6, 0.95);
      for (let k = 0; k < n; k++) {
        const a = a0 + k * TAU / n + rr(-0.15, 0.15), l = r * rr(0.8, 1.12), P2 = t => T(Math.cos(a) * l * t, Math.sin(a) * l * t * sq);
        A.stroke([P2(0.14), P2(0.6), P2(1)], 'chalk', c, { w: r * rr(0.42, 0.58), p: 0.95, tin: 0.1, tout: 0.7 });
      }
      const hp = T(0, 0); A.dot(hp[0], hp[1], 'chalk', heart, { w: Math.max(0.6, r * 0.45), p: 1 });
    } else if (kind === 'pinwheel') {
      // the periwinkle: five broad petals, each twisted the same way round a dark eye
      const a0 = rr(0, TAU), tw = (A.chance(0.5) ? 1 : -1) * rr(0.35, 0.55);
      for (let k = 0; k < 5; k++) {
        const a = a0 + k * TAU / 5 + rr(-0.1, 0.1), l = r * rr(0.9, 1.1);
        A.stroke([T(Math.cos(a) * r * 0.1, Math.sin(a) * r * 0.1), T(Math.cos(a + tw * 0.5) * l * 0.6, Math.sin(a + tw * 0.5) * l * 0.6), T(Math.cos(a + tw) * l * 0.95, Math.sin(a + tw) * l * 0.95)], 'chalk', c, { w: r * rr(0.62, 0.75), p: 0.95, tin: 0.25, tout: 0.3 });
      }
      const hp = T(0, 0); A.dot(hp[0], hp[1], 'chalk', o.eye || 'crimson', { w: Math.max(0.6, r * 0.42), p: 1 }); A.dot(hp[0], hp[1], 'chalk', 'khadi', { w: Math.max(0.35, r * 0.14), p: 0.9 });
    } else if (kind === 'daisy') {
      // a ring of thin rays round a full yellow disc, tipped back
      const n = A.ri(10, 14), a0 = rr(0, TAU), sq = rr(0.5, 0.85);
      for (let k = 0; k < n; k++) {
        const a = a0 + k * TAU / n + rr(-0.08, 0.08), l = r * rr(0.9, 1.15);
        A.stroke([T(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32 * sq), T(Math.cos(a) * l, Math.sin(a) * l * sq)], 'chalk', c, { w: Math.max(0.35, r * 0.24), p: 0.95, tin: 0.05, tout: 0.4 });
      }
      const hp = T(0, 0);
      A.dot(hp[0], hp[1], 'chalk', pick(['haldi', 'saffron']), { w: r * 0.75, len: r * 0.08, ang: ha, p: 1 });
      A.dot(hp[0] + r * 0.1, hp[1] + r * 0.12, 'chalk', 'ochre', { w: r * 0.3, p: 0.7 });
    } else if (kind === 'cup') {
      // a flower in profile, the way the old painters show it: two petals curving out of a green calyx, one behind
      const back = A.spline([T(-r * 0.25, r * 0.2), T(-r * 0.35, r * 1.0), T(0, r * 1.3), T(r * 0.35, r * 1.0), T(r * 0.25, r * 0.2)], true, 0.3);
      A.fill([back], 'chalk', A.mix(c, 'lac', 0.3), { w: Math.max(0.5, r * 0.4), p: 1, passes: 2, ang: ha - PI / 2 });
      for (const sd of [-1, 1]) {
        const pet = A.spline([T(0, r * 0.1), T(sd * r * 0.55, r * 0.35), T(sd * r * 0.9, r * 0.95), T(sd * r * 0.62, r * 1.18), T(sd * r * 0.32, r * 0.75), T(sd * r * 0.05, r * 0.45)], true, 0.3);
        A.fill([pet], 'chalk', c, { w: Math.max(0.5, r * 0.4), p: 1, passes: 2, ang: ha - PI / 2 + sd * 0.4 });
        A.stroke([T(sd * r * 0.1, r * 0.3), T(sd * r * 0.45, r * 0.72)], 'chalk', A.mix(c, 'khadi', 0.45), { w: Math.max(0.3, r * 0.14), p: 0.75 });
        outl(pet);
      }
      for (const sd of [-1, 1]) A.stroke([T(0, -r * 0.1), T(sd * r * 0.32, r * 0.18), T(sd * r * 0.42, r * 0.42)], 'chalk', leafC(), { w: Math.max(0.4, r * 0.24), p: 0.95, tin: 0, tout: 0.6 });
    } else if (kind === 'bell') {
      // the stem arches over and the bells hang from it, mouths down
      const hs = lean >= 0 ? 1 : -1;
      const arch = A.spline([[x, y], mid, top, T(hs * r * 0.6, r * 0.55), T(hs * r * 1.3, r * 0.3), T(hs * r * 1.6, -r * 0.3)], false, 0.5);
      A.stroke(arch, 'kajal', stemC, { w: sw, p: 0.85, tin: 0, tout: 0.3 });
      for (let k = 0, nb = A.ri(1, 3); k < nb; k++) {
        const q = arch[Math.max(0, arch.length - 1 - k * A.ri(4, 6))], br = r * (k ? rr(0.6, 0.8) : rr(0.85, 1.05)), tilt = rr(-0.25, 0.25) + hs * 0.15;
        const bc = Math.cos(tilt), bs = Math.sin(tilt), B = (u, v) => [q[0] + u * bc - v * bs, q[1] + 0.3 + u * bs + v * bc];
        const cup = A.spline([B(-br * 0.3, 0), B(br * 0.3, 0), B(br * 0.55, br * 0.75), B(br * 0.7, br * 1.15), B(br * 0.25, br * 1.0), B(0, br * 1.18), B(-br * 0.25, br * 1.0), B(-br * 0.7, br * 1.15), B(-br * 0.55, br * 0.75)], true, 0.3);
        A.fill([cup], 'chalk', c, { w: Math.max(0.5, br * 0.4), p: 1, passes: 2, ang: tilt + PI / 2 });
        A.stroke([B(-br * 0.12, br * 0.2), B(-br * 0.3, br * 0.85)], 'chalk', A.mix(c, 'khadi', 0.5), { w: Math.max(0.3, br * 0.16), p: 0.7 });
        outl(cup);
        const cx = B(0, -br * 0.05); A.dot(cx[0], cx[1], 'chalk', leafC(), { w: Math.max(0.5, br * 0.4), p: 0.95 });
      }
    } else if (kind === 'spray') {
      // a fine spray: the stem forks, and every twig ends in a speck of colour
      for (let k = 0, n = A.ri(4, 7); k < n; k++) {
        const a = (k / (n - 1) - 0.5) * rr(1.6, 2.2) + rr(-0.15, 0.15), l = r * rr(1.0, 1.9), s0 = stem[Math.floor(stem.length * rr(0.6, 0.85))];
        const e = k === 0 ? top : T(Math.sin(a) * l, Math.cos(a) * l * 0.8);
        if (k) A.stroke([s0, [(s0[0] + e[0]) / 2 + rr(-0.3, 0.3), (s0[1] + e[1]) / 2], e], 'kajal', stemC, { w: sw * 0.7, p: 0.75, tin: 0, tout: 0.3 });
        A.dot(e[0], e[1], 'chalk', A.chance(0.75) ? c : 'khadi', { w: Math.max(0.55, r * rr(0.4, 0.55)), p: 0.95 });
        if (A.chance(0.5)) A.dot(e[0] + rr(-0.25, 0.25) * r, e[1] + rr(0.1, 0.25) * r, 'chalk', c, { w: Math.max(0.45, r * 0.32), p: 0.9 });
      }
    } else if (kind === 'bud') {
      // one or two closed buds, the colour just showing between the green
      for (let k = 0, nb = A.chance(0.4) ? 2 : 1; k < nb; k++) {
        const q = k ? stem[Math.floor(stem.length * rr(0.55, 0.75))] : top, sd = A.chance(0.5) ? 1 : -1;
        const ba = ha + (k ? sd * rr(0.5, 0.8) : 0), bl = r * (k ? 0.95 : 1.3), bc = Math.cos(ba), bs = Math.sin(ba), base = k ? bl * 0.35 : 0;
        const B = (u, v) => [q[0] + u * bc + v * bs, q[1] + u * bs - v * bc];
        if (k) A.stroke([q, B(0, base)], 'kajal', stemC, { w: sw * 0.8, p: 0.8 });
        const po = A.spline([B(0, base), B(bl * 0.32, base + bl * 0.4), B(bl * 0.2, base + bl * 0.85), B(0, base + bl * 1.05), B(-bl * 0.2, base + bl * 0.85), B(-bl * 0.32, base + bl * 0.4)], true, 0.3);
        A.fill([po], 'chalk', c, { w: Math.max(0.5, bl * 0.3), p: 1, passes: 2, ang: ba - PI / 2 });
        for (const s2 of [-1, 1]) A.stroke([B(0, base), B(s2 * bl * 0.3, base + bl * 0.3), B(s2 * bl * 0.12, base + bl * 0.75)], 'chalk', leafC(), { w: Math.max(0.4, bl * 0.2), p: 0.95, tin: 0, tout: 0.6 });
        outl(po, 0.45);
      }
    } else if (kind === 'spike') {
      // a spike of small florets up the top of the stem, smaller toward the tip
      const i0 = Math.floor(stem.length * rr(0.45, 0.6));
      for (let i = i0; i < stem.length; i++) {
        const t = (i - i0) / Math.max(1, stem.length - 1 - i0), q = stem[i], sd = i % 2 ? 1 : -1, w = r * lerp(0.75, 0.32, t);
        A.dot(q[0] + sd * ca * w * 0.35, q[1] + sd * sa * w * 0.35, 'chalk', A.chance(0.2) ? A.mix(c, 'khadi', 0.4) : c, { w, p: 0.95 });
      }
      A.dot(top[0], top[1], 'chalk', A.mix(c, 'khadi', 0.3), { w: r * 0.3, p: 0.9 });
    } else {
      // four round petals, the little field flower; now only one kind among many
      const a0 = rr(0, TAU);
      for (let k = 0; k < 4; k++) { const a = a0 + k * PI / 2 + rr(-0.12, 0.12), p = T(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); A.dot(p[0], p[1], 'chalk', c, { w: r * rr(0.6, 0.75), p: 0.95 }); }
      const hp = T(0, 0); A.dot(hp[0], hp[1], 'chalk', heart, { w: Math.max(0.5, r * 0.35), p: 1 });
    }
    // the grass in front, swallowing some of it
    if (o.hide) {
      const gc = o.grass || ['bottle', 'moss', 'malachite', 'sap'];
      for (let k = 0, nb = Math.round(3 + o.hide * 5); k < nb; k++) {
        const gx = x + rr(-1, 1) * Math.max(1.5, r * 1.4) + Math.sin(lean) * h * rr(0, 0.6), gy = y + rr(-0.3, 1), gh = h * rr(0.35, 0.65 + o.hide * 0.6), a = -PI / 2 + rr(-0.45, 0.45);
        A.stroke([[gx, gy], [gx + Math.cos(a) * gh * 0.5 + rr(-0.3, 0.3), gy + Math.sin(a) * gh * 0.5], [gx + Math.cos(a) * gh, gy + Math.sin(a) * gh]], 'chalk', pick(gc), { w: rr(0.5, 0.75), p: rr(0.75, 0.95), tin: 0, tout: 0.65 });
      }
    }
  }
  /* flowers sown the way they grow: in drifts of one kind with bare grass between, a stray of another kind here and
     there, a few half lost in the blades.  pts = candidate spots; o.kinds = [[kind, colours, heart], ...];
     o.h(y) = the height of a plant there; o.thresh = how much of the ground stays bare (0..1) */
  function flowerDrifts(A, pts, o) {
    const rr = A.rr, K = o.kinds, seed = o.seed || 11, sc = o.scale || 30, out = [];
    for (const p of pts) {
      if (o.skip && o.skip(p)) continue;
      const d = A.noise2(p[0] / sc, p[1] / (sc * 0.55), seed);
      if (d < o.thresh + rr(-0.06, 0.06)) continue;
      let ki = Math.floor(A.noise2(p[0] / (sc * 1.7), p[1] / sc, seed + 7) * K.length * 1.7) % K.length;
      if (A.chance(0.2)) ki = A.ri(0, K.length - 1);
      out.push([p[0] + rr(-1.5, 1.5), p[1] + rr(-1, 1), ki, d]);
    }
    out.sort((a, c) => a[1] - c[1]);
    for (const q of out) {
      const k = K[q[2]], h = o.h(q[1]) * rr(0.6, 1.3) * (0.85 + (q[3] - o.thresh) * 0.9);
      wildflower(A, q[0], q[1], h, k[0], A.pick(k[1]), { hide: A.chance(o.hidden != null ? o.hidden : 0.3) ? rr(0.35, 1) : 0, grass: o.grass, lean: rr(-0.42, 0.42), heart: k[2] });
    }
    return out.length;
  }

  // a pool in the Mewar way: deep blue worked with rows of little arcs, pads and lotuses on it, rain rings
  function pool(A, poly, o) {
    const rr = A.rr, pick = A.pick; o = o || {};
    const rp = A.ground(poly, o.c || 'lapis', { w: 12, ang: 0.02, c2: A.mix('lapis', 'neel', 0.3), edge: 0.5, rub: 5 })[0];
    const bb = A.bbox([rp]);
    A.withMask(rp, () => {
      // the dark under the bank, and a paler sheen out in the open water
      A.outline(rp, 'side', 'neel', { closed: true, w: 6, p: 0.5, pull: 40 });
      for (let i = 0; i < 6; i++) { const y = rr(bb[1] + 6, bb[3]), x = rr(bb[0], bb[2]); A.stroke([[x, y], [x + rr(15, 30), y + rr(-0.5, 0.5)]], 'side', pick(['aqua', 'sky']), { w: rr(3, 5), p: 0.25 }); }
      let row = 0;
      for (let y = bb[1] + 3; y < bb[3] + 3; y += rr(3.3, 3.8), row++) for (let x = bb[0] + (row % 2 ? 3.4 : 0) + rr(-0.5, 0.5); x < bb[2] + 3; x += rr(6.2, 7.2)) {
        if (A.noise2(x / 18, y / 9, 41) < 0.3) continue;
        const r = rr(3, 3.6);
        A.stroke(A.ellipse(x, y, r, r * 0.6, 0, PI * 1.1, PI * 1.9), 'chalk', pick(['sky', 'ice', 'khadi', 'sky', 'aqua']), { w: 0.65, p: rr(0.65, 0.95), tin: 0.15, tout: 0.15 });
      }
    });
    return rp;
  }

  // a bird far off in the rain: two strokes of white, the wings
  function farBird(A, x, y, s, c) {
    const rr = A.rr, a = rr(0.3, 0.55);
    A.stroke(A.spline([[x - s, y - s * a], [x - s * 0.45, y - s * 0.15], [x, y]], false, 0.6), 'chalk', c, { w: Math.max(0.7, s * 0.28), p: 0.95, tin: 0.4, tout: 0 });
    A.stroke(A.spline([[x, y], [x + s * 0.45, y - s * 0.15], [x + s, y - s * a * rr(0.8, 1.1)]], false, 0.6), 'chalk', c, { w: Math.max(0.7, s * 0.28), p: 0.95, tin: 0, tout: 0.4 });
  }

  /* ====================================================================== THE DANCER
     The train is laid as the shared peacock motif lays it (same rings, barbs and eyes).  The bird in front of it is
     drawn here, face on, the way a Mewar painter sets a peacock dancing in the first rain: a slim neck rising in a
     gentle curve from a teardrop breast, the small head turned to call, the wings let down at the sides with their
     rufous primaries reaching for the ground, one foot lifted mid-step.
     x,y = the planted foot, s = the radius of the fan. */
  function pkBlob(A, c, cx, cy, a, b2, rot, o) {
    o = o || {};
    const rp = A.roughen(A.ellipse(cx, cy, a, b2, rot), o.rough != null ? o.rough : Math.min(a, b2) * 0.09, 8, true);
    A.fill(rp, 'pastel', c, { w: Math.max(1.8, Math.min(a, b2) * 1.05), ang: rot + A.rr(-0.5, 0.5), passes: 2, p: 1, reach: 1.5, cv: o.cv });
    return rp;
  }
  function ocellus(A, E, rot, u, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick, ca = Math.cos(rot), sa = Math.sin(rot);
    // no two eyes alike: a little longer or rounder, the heart set further in or out, the gold ring sometimes broken
    const el = rr(0.7, 0.86), off = rr(0.02, 0.13), hk = rr(0.85, 1.12);
    pkBlob(A, o.halo || 'malachite', E[0] + ca * u * rr(0.04, 0.12), E[1] + sa * u * rr(0.04, 0.12), u * rr(0.94, 1.06), u * el, rot, { cv: 0.05 });
    pkBlob(A, o.bronze || 'ochre', E[0], E[1], u * 0.72, u * 0.72 * el * rr(0.92, 1.02), rot);
    const g0 = A.chance(0.35) ? rr(0.4, 1.4) : 0, g1 = g0 ? g0 + rr(4.2, 5.4) : TAU;
    A.stroke(A.ellipse(E[0], E[1], u * 0.7, u * 0.7 * el * 0.98, rot, g0, g1), 'gold', 'gold', { w: Math.max(0.9, u * rr(0.12, 0.18)), p: rr(0.85, 0.97) });
    const hx = E[0] - ca * u * off, hy = E[1] - sa * u * off;
    A.stroke(A.ellipse(hx, hy, u * 0.47 * hk, u * 0.39 * hk, rot, -rr(1.3, 1.7), rr(1.3, 1.7)), 'chalk', o.ring || 'aqua', { w: Math.max(0.9, u * rr(0.14, 0.19)), p: 0.95 });
    pkBlob(A, o.heart || 'lapis', hx, hy, u * 0.42 * hk, u * 0.35 * hk * rr(0.9, 1.1), rot + rr(-0.15, 0.15));
    A.dot(hx - ca * u * 0.1, hy - sa * u * 0.1, 'kajal', A.chance(0.7) ? 'kajal' : A.mix('kajal', 'neel', 0.4), { w: Math.max(1, u * 0.34 * hk), ang: rot + 1.57, len: u * rr(0.04, 0.12) });
    if (A.chance(0.6)) A.dot(hx + ca * u * 0.12 - sa * u * rr(0.06, 0.16), hy + sa * u * 0.12 + ca * u * rr(0.06, 0.16), 'chalk', pick(['khadi', 'ice', 'khadi']), { w: Math.max(0.5, u * rr(0.07, 0.11)) });
  }
  function dancer(A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick;
    // sink: the whole bird is set this much lower, and its legs are that much shorter, so it stands on short strong legs
    const sink = 0.068, tilt = o.tilt != null ? o.tilt : -0.075, PF = frame(x, y + s * sink, s, tilt), drop = 0.085, org = PF(0, drop), P = frame(org[0], org[1], s, tilt), fanTilt = 0.1;
    const C = [-0.02, -0.47];
    const fp = (phi, r) => P(C[0] + Math.sin(phi + fanTilt) * r * 0.97, C[1] - Math.cos(phi + fanTilt) * r);
    const Q = PF, sp = (cp, closed, st) => A.spline(Q.all(cp), !!closed, st || 0.6);

    // ---- the neck and head, worked out first so the eyes of the train can stand clear of them
    const NECK = [[0, -0.66], [-0.004, -0.735], [-0.002, -0.8], [0.014, -0.865], [0.035, -0.91]].map(p => Q(p[0], p[1]));
    const HC = [0.068, -0.966], hcw = Q(HC[0], HC[1]);
    const nearBird = E => { if (Math.hypot(E[0] - hcw[0], E[1] - hcw[1]) < s * 0.16) return true; for (const q of NECK) if (Math.hypot(E[0] - q[0], E[1] - q[1]) < s * 0.105) return true; return false; };

    // ---- the train: four rings of feathers, the eyes set in ordered rows the way the old painters lay them out.  Every
    //      ring stands on the same spokes, each ring half a step over from the one outside it, so the eyes run in rings
    //      and in radial lines at once; they grow from small near the body to large at the rim.  The hand still lets
    //      each eye come out a little larger or smaller and a hair off its place.
    const D = 0.192, rings = [{ L: 1.0, e: 1.0, off: 0, half: 1.75 }, { L: 0.8, e: 0.8, off: 0.5, half: 1.66 }, { L: 0.62, e: 0.63, off: 0, half: 1.56 }, { L: 0.45, e: 0.47, off: 0.5, half: 1.46 }];
    const fe = [];
    rings.forEach((R, k) => {
      for (let i = -12; i <= 12; i++) {
        const phi0 = (i + R.off) * D; if (Math.abs(phi0) > R.half) continue;
        fe.push({ k, phi: phi0 + rr(-0.05, 0.05) * D, L: R.L * (0.975 + 0.025 * Math.cos(phi0) * Math.cos(phi0)) * rr(0.985, 1.015), e: R.e * rr(0.93, 1.07), bow: rr(-0.02, 0.02), tw: rr(-0.1, 0.1) });
      }
    });
    const f0 = fe.filter(f => f.k === 0);
    const rim = [];
    f0.forEach((f, i) => {
      if (i === 0) { rim.push(fp(f.phi + 0.16, 0.3)); rim.push(fp(f.phi + 0.05, 0.62)); rim.push(fp(f.phi - 0.02, f.L * 0.9)); }
      rim.push(fp(f.phi, f.L * 0.985));
      if (i < f0.length - 1) { const g = f0[i + 1]; rim.push(fp((f.phi + g.phi) / 2, (f.L + g.L) * 0.5 * 0.9)); } else { rim.push(fp(f.phi + 0.02, f.L * 0.9)); rim.push(fp(f.phi - 0.05, 0.62)); rim.push(fp(f.phi - 0.16, 0.3)); }
    });
    const fanPoly = A.roughen([P(C[0], C[1] + 0.07)].concat(A.spline(rim, false, 2.5)), 1.0, 12, true);
    A.pushMask(fanPoly);
    for (let pass = 0; pass < 2; pass++) for (let phi = -1.9; phi < 1.9; phi += (4.2 / s) * rr(0.7, 1.3)) {
      // toward the low sides the ground of the fan is lighter and thinner, the grass showing through between the feathers
      const side = clamp((Math.abs(phi) - 1.3) / 0.45, 0, 1), gc = side > 0 ? A.mix('bottle', pick(['moss', 'malachite', 'leaf']), 0.25 + 0.45 * side) : null;
      A.stroke([fp(phi + rr(-0.012, 0.012), 0), fp(phi + rr(-0.015, 0.015), rr(0.45, 0.6)), fp(phi + rr(-0.012, 0.012), 1.05)], 'pastel', gc || (pass ? pick(['bottle', 'bottle', 'moss', 'bottle']) : 'bottle'), { w: 8 * rr(0.9, 1.1), p: (pass ? 0.9 : 1) * (1 - 0.5 * side), reach: 1.5, cv: 0.03 });
    }
    for (let i = 0; i < 80; i++) {
      const phi = rr(-1.8, 1.8), a = rr(0.34, 0.6), b2 = Math.min(1.0, a + rr(0.2, 0.45));
      A.stroke([fp(phi, a), fp(phi + rr(-0.02, 0.02), (a + b2) / 2), fp(phi, b2)], 'pastel', pick(['malachite', 'malachite', 'teal', 'sap']), { w: rr(3, 5.5), p: 0.8, flow: rr(0.22, 0.42) });
    }
    for (let phi = -1.3; phi < 1.3; phi += 0.09 * rr(0.7, 1.3)) A.stroke([fp(phi, 0), fp(phi, rr(0.2, 0.3))], 'pastel', A.mix('night', 'bottle', 0.35), { w: 7, p: 0.8, flow: 0.45, tout: 0.6 });
    // the edge of the fan's ground rubbed out with a finger, so it melts into the barbs instead of standing as a cut edge
    A.blend(fanPoly, { r: Math.max(1.6, s * 0.03), k: 0.4, len: s * 0.12 });
    A.popMask();
    // and the low sides of the fan, where the ground would show its edge, fringed with loose barbs crossing out over it
    for (const sd of [-1, 1]) for (let r = 0.12; r < 0.66; r += 0.018 * rr(0.7, 1.3)) {
      const ph = sd * (1.72 - 0.12 * (r / 0.66)) + rr(-0.06, 0.04) * sd, q = fp(ph, r), a = Math.atan2(q[1] - fp(ph, r - 0.05)[1], q[0] - fp(ph, r - 0.05)[0]) + sd * rr(0.5, 1.1), l = s * rr(0.03, 0.07);
      A.stroke([q, [q[0] + Math.cos(a) * l * 0.5, q[1] + Math.sin(a) * l * 0.5 + rr(-0.3, 0.3)], [q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]], 'chalk', pick(['leaf', 'olive', 'malachite', 'sage', 'leaf', 'haldi']), { w: rr(0.8, 1.15), p: rr(0.5, 0.85), tin: 0, tout: 0.5 });
    }
    const barbCols = ['leaf', 'leaf', 'leaf', 'malachite', 'malachite', 'verdigris', 'olive', 'haldi', 'sage'];
    for (const f of fe) {
      const at = r => fp(f.phi + f.bow * Math.sin(PI * Math.min(1, r / f.L)), r);
      const rE = f.L * 0.9, u = s * 0.073 * f.e;
      const sh = []; for (let r = 0.12; r <= rE; r += 0.06) sh.push(at(r)); sh.push(at(rE));
      A.stroke(sh, 'chalk', 'sand', { w: 0.9, p: 0.6, flow: 0.6 });
      for (let r = 0.3 + rr(0, 0.03); r < f.L * 0.84; r += 0.027 * rr(0.75, 1.3)) {
        const q = at(r), q2 = at(r + 0.02); let tx = q2[0] - q[0], ty = q2[1] - q[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const len = s * (0.03 + 0.04 * (r / f.L)) * rr(0.8, 1.25);
        for (const sd of [-1, 1]) {
          if (A.chance(0.08)) continue;
          const be = rr(0.5, 0.8), cb = Math.cos(be), sb = Math.sin(be) * sd, ddx = tx * cb - ty * sb, ddy = ty * cb + tx * sb;
          A.stroke([q, [q[0] + ddx * len * 0.5 + tx * len * 0.04, q[1] + ddy * len * 0.5 + ty * len * 0.04], [q[0] + ddx * len + tx * len * 0.14, q[1] + ddy * len + ty * len * 0.14]], 'chalk', pick(barbCols), { w: rr(0.8, 1.2), p: rr(0.5, 0.85), tin: 0, tout: 0.4, flow: 0.75 });
        }
      }
      const E = at(rE), E2 = at(rE + 0.02), rot = Math.atan2(E2[1] - E[1], E2[0] - E[0]);
      const nfr = f.k === 0 ? A.ri(11, 15) : A.ri(7, 10), fl = f.k === 0 ? [0.07, 0.125] : [0.035, 0.065];
      for (let i = 0; i < nfr; i++) {
        const a = rot + rr(-1.45, 1.45), l0 = u * rr(0.5, 0.8), l1 = u + s * rr(fl[0], fl[1]) * (0.6 + 0.4 * Math.cos(a - rot)), cv = rr(-0.25, 0.25);
        A.stroke([[E[0] + Math.cos(a) * l0, E[1] + Math.sin(a) * l0], [E[0] + Math.cos(a + cv * 0.4) * (l0 + l1) * 0.5, E[1] + Math.sin(a + cv * 0.4) * (l0 + l1) * 0.5], [E[0] + Math.cos(a + cv) * l1, E[1] + Math.sin(a + cv) * l1]], 'chalk', pick(['leaf', 'leaf', 'olive', 'haldi', 'sage', 'malachite']), { w: rr(0.75, 1.05), p: rr(0.5, 0.85), tin: 0, tout: 0.5 });
      }
      if (!nearBird(E)) ocellus(A, E, rot + f.tw, u, {
        halo: pick(['malachite', 'malachite', A.mix('malachite', 'leaf', rr(0.3, 0.6)), A.mix('malachite', 'teal', rr(0.3, 0.6)), A.mix('verdigris', 'malachite', 0.5)]),
        bronze: pick(['ochre', 'ochre', A.mix('ochre', 'haldi', rr(0.2, 0.5)), A.mix('ochre', 'umber', rr(0.15, 0.35))]),
        ring: pick(['aqua', 'aqua', 'sky', 'verdigris', A.mix('aqua', 'teal', 0.4)]),
        heart: pick(['lapis', 'lapis', A.mix('lapis', 'neel', rr(0.3, 0.6)), A.mix('lapis', 'teal', rr(0.15, 0.35))])
      });
    }
    for (let i = 0; i < 46; i++) { const phi = rr(-1.7, 1.7), a = rr(0.74, 0.86); A.stroke([fp(phi, a), fp(phi + rr(-0.015, 0.015), a + rr(0.08, 0.16))], 'chalk', pick(['haldi', 'leaf', 'haldi', 'verdigris']), { w: rr(0.7, 1.0), p: rr(0.45, 0.8), tin: 0.1, tout: 0.4 }); }
    for (const sd of [-1, 1]) {
      const ph = sd * (f0[sd < 0 ? 0 : f0.length - 1].phi);
      for (let r = 0.3; r < 0.98; r += 0.022 * rr(0.7, 1.3)) {
        const q = fp(ph + sd * rr(-0.03, 0.05), r), a = P.dir(1.5708) + sd * rr(0.1, 0.9), l = s * rr(0.04, 0.1);
        A.stroke([q, [q[0] + Math.cos(a) * l * 0.5 - sd * 0.6, q[1] + Math.sin(a) * l * 0.5], [q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]], 'chalk', pick(['leaf', 'olive', 'malachite', 'bottle', 'haldi', 'moss']), { w: rr(0.8, 1.1), p: rr(0.5, 0.85), tin: 0, tout: 0.5 });
      }
    }

    // ---- the short dark coverts at the root of the train, fanned round the body like a collar of bronze
    const root = [-0.01, -0.4];
    for (let pass = 0; pass < 2; pass++) for (let i = 0, n = pass ? 17 : 24; i < n; i++) {
      const a = -PI / 2 + (i / (n - 1) - 0.5) * (pass ? 2.5 : 2.95) + rr(-0.04, 0.04), r1 = pass ? rr(0.17, 0.22) : rr(0.23, 0.3);
      const p0 = Q(root[0] + Math.cos(a) * 0.05, root[1] + Math.sin(a) * 0.05), p1 = Q(root[0] + Math.cos(a) * r1, root[1] + Math.sin(a) * r1 * 0.94);
      const pm = [(p0[0] + p1[0]) / 2 + rr(-0.3, 0.3), (p0[1] + p1[1]) / 2];
      A.stroke([p0, pm, p1], 'pastel', pass ? pick(['sepia', A.mix('umber', 'bottle', 0.45)]) : pick(['umber', A.mix('umber', 'bottle', 0.35), 'sepia']), { w: s * (pass ? 0.03 : 0.036), p: 0.95, tin: 0, tout: 0.55, reach: 1.4 });
      A.stroke([lerpP(p0, p1, 0.3), lerpP(p0, p1, 0.92)], 'chalk', A.mix('sand', 'umber', 0.25), { w: 0.45, p: 0.55, tin: 0.1, tout: 0.4 });
      if (!pass) A.stroke([lerpP(p0, p1, 0.75), p1], 'chalk', pick(['olive', A.mix('olive', 'teal', 0.4)]), { w: s * 0.012, p: 0.55, tin: 0.2, tout: 0.4 });
    }

    // ---- a soft shadow on the grass where it dances
    A.stroke([Q(-0.17, 0.012 - sink), Q(0, 0.022 - sink), Q(0.17, 0.012 - sink)], 'shade', A.mix('bottle', 'moss', 0.3), { w: s * 0.05, p: 0.32, tin: 0.4, tout: 0.4 });

    // ---- the wings, let down at the sides: barred buff coverts, rufous primaries reaching for the ground
    const rufous = A.mix('sindoor', 'brick', 0.42), buff = A.mix('sand', 'cream', 0.35);
    for (const sd of [-1, 1]) {
      const M2 = cp => cp.map(p => [p[0] * sd, p[1]]);
      const wp = A.roughen(sp(M2([[0.05, -0.578], [0.1, -0.596], [0.15, -0.558], [0.188, -0.474], [0.214, -0.368], [0.232, -0.262], [0.248, -0.165], [0.252, -0.097], [0.214, -0.102], [0.182, -0.17], [0.15, -0.262], [0.118, -0.36], [0.09, -0.44], [0.066, -0.5]]), true, 0.5), 0.2, 6, true);
      A.fill(wp, 'pastel', buff, { w: s * 0.026, p: 1, passes: 2, ang: Q.dir(-1.4 + sd * 0.2), reach: 1.4 });
      A.withMask(wp, () => {
        // the shoulder, still the blue of the body, in small scales
        A.stroke(sp(M2([[0.06, -0.57], [0.11, -0.578], [0.15, -0.53]]), false, 0.5), 'pastel', A.mix('neel', 'teal', 0.25), { w: s * 0.05, p: 0.95, tin: 0, tout: 0.2 });
        for (let k = 0; k < 7; k++) { const q = Q(sd * rr(0.075, 0.14), rr(-0.575, -0.535)); A.stroke(A.ellipse(q[0], q[1], s * 0.011, s * 0.012, 0, 0.3, PI - 0.3), 'chalk', pick(['verdigris', 'sky', 'aqua']), { w: 0.55, p: 0.8 }); }
        // the coverts barred across in kajal, each bar a little zigzag
        for (let v = -0.525; v < -0.3; v += 0.021 * rr(0.9, 1.1)) {
          const pts = []; for (let u = 0.05, j = 0; u <= 0.27; u += 0.017, j++) pts.push(Q(sd * u, v + (j % 2 ? 0.006 : -0.004) + (u - 0.05) * 0.07));
          A.stroke(pts, 'kajal', pick(['kajal', 'sepia', 'kajal']), { w: s * 0.0095, p: rr(0.65, 0.85), tin: 0.05, tout: 0.05 });
        }
        A.stroke(sp(M2([[0.11, -0.5], [0.165, -0.42], [0.2, -0.32]]), false, 0.5), 'side', A.mix('sand', 'ochre', 0.4), { w: s * 0.03, p: 0.35 });
      }, 0);
      // five primaries, chestnut with darker tips, fingered apart at the ends
      for (let k = 0; k < 5; k++) {
        const t = k / 4, a0 = [sd * lerp(0.112, 0.205, t), lerp(-0.36, -0.33, t)], a1 = [sd * (lerp(0.165, 0.272, t) + rr(-0.003, 0.003)), lerp(-0.07, -0.1, t) + rr(-0.006, 0.006)];
        const cl = sp([a0, [(a0[0] + a1[0]) / 2 + sd * 0.006, (a0[1] + a1[1]) / 2], a1], false, 0.4);
        const fb = ribbon(cl, tt => s * prof(tt, [[0, 0.013], [0.55, 0.0145], [0.88, 0.0105], [1, 0.003]]));
        const fr = A.shape(fb, { c: A.mix(rufous, pick(['sindoor', 'brick', 'saffron']), 0.18), w: s * 0.02, rough: 0.06, passes: 2, ang: Q.dir(1.5) });
        A.withMask(fr, () => {
          A.stroke(cl.slice(Math.floor(cl.length * 0.62)), 'pastel', A.mix('umber', 'sepia', 0.4), { w: s * 0.034, p: 0.9, tin: 0.4, tout: 0 });
          A.stroke(cl.slice(0, Math.floor(cl.length * 0.7)).map(p => [p[0] + sd * s * 0.006, p[1]]), 'chalk', A.mix('saffron', 'peach', 0.35), { w: s * 0.008, p: 0.55, tin: 0.2, tout: 0.6 });
        }, 0);
        A.stroke(cl.slice(0, Math.floor(cl.length * 0.9)), 'kajal', A.mix('sepia', 'brick', 0.3), { w: 0.4, p: 0.55, tin: 0.1, tout: 0.3 });
        A.outline(fr, 'kajal', 'sepia', { closed: true, w: 0.55, p: 0.72, pull: 14, again: 0 });
      }
      A.outline(wp, 'kajal', 'sepia', { closed: true, w: 0.75, p: 0.78, pull: 20, again: 0.1 });
    }

    // ---- the legs, short and strong and grey, with spurs: the left planted, the right lifted mid-step, its toes curled
    const legC = A.mix('stone', 'slate', 0.4), legL = A.mix('slate', 'kajal', 0.45), lw = s * 0.025;
    const shank = (cp, w) => { const wp = sp(cp, false, 0.3); A.stroke(wp, 'chalk', legC, { w, p: 1, reach: 1.3, tin: 0, tout: 0 }); A.stroke(wp.map(p => [p[0] + w * 0.32, p[1] + 0.1]), 'kajal', legL, { w: Math.max(0.42, w * 0.3), p: 0.72 }); A.stroke(wp.map(p => [p[0] - w * 0.36, p[1]]), 'kajal', legL, { w: Math.max(0.35, w * 0.2), p: 0.45 }); return wp; };
    const toe = (cp, w) => { const tp = sp(cp, false, 0.25); A.stroke(tp, 'chalk', legC, { w, p: 1, tin: 0, tout: 0.3 }); A.stroke(tp, 'kajal', legL, { w: Math.max(0.35, w * 0.28), p: 0.6, tin: 0, tout: 0.2 }); const e = tp[tp.length - 1]; A.dot(e[0], e[1], 'kajal', 'kajal', { w: Math.max(0.5, w * 0.45), p: 0.85 }); };
    // feathered thighs, dark, then the bare shank
    for (const sd of [-1, 1]) A.stroke([Q(sd * 0.04, -0.26), Q(sd * 0.045, -0.205), Q(sd * 0.047, -0.17)], 'pastel', A.mix('sepia', 'neel', 0.4), { w: s * 0.048, p: 0.95, tin: 0, tout: 0.5 });
    const g = -sink;   // the ground, in the bird's own frame
    shank([[-0.045, -0.19], [-0.05, -0.15], [-0.048, -0.11], [-0.046, g - 0.004]], lw);
    toe([[-0.046, g - 0.004], [-0.068, g + 0.005], [-0.088, g + 0.012]], lw * 0.78);
    toe([[-0.046, g - 0.002], [-0.048, g + 0.012], [-0.05, g + 0.026]], lw * 0.78);
    toe([[-0.046, g - 0.004], [-0.026, g + 0.005], [-0.007, g + 0.011]], lw * 0.78);
    A.stroke([Q(-0.05, -0.1), Q(-0.064, -0.097), Q(-0.071, -0.099)], 'chalk', legC, { w: lw * 0.55, p: 0.95, tin: 0, tout: 0.85 });   // the spur
    const lift = shank([[0.045, -0.19], [0.062, -0.165], [0.075, -0.14], [0.063, -0.122]], lw);
    toe([[0.063, -0.122], [0.051, -0.108], [0.047, -0.093]], lw * 0.72);
    toe([[0.063, -0.122], [0.065, -0.105], [0.068, -0.09]], lw * 0.72);
    toe([[0.063, -0.122], [0.077, -0.11], [0.085, -0.097]], lw * 0.72);
    A.stroke([Q(0.074, -0.145), Q(0.086, -0.151), Q(0.092, -0.148)], 'chalk', legC, { w: lw * 0.5, p: 0.95, tin: 0, tout: 0.85 });

    // ---- the neck and the teardrop of the breast, in one blue
    const SIL = [[0.074, -0.9], [0.052, -0.858], [0.031, -0.8], [0.031, -0.735], [0.046, -0.668], [0.07, -0.6], [0.097, -0.515], [0.115, -0.42], [0.117, -0.335], [0.1, -0.262], [0.06, -0.212], [0.0, -0.194],
      [-0.06, -0.212], [-0.1, -0.262], [-0.117, -0.335], [-0.115, -0.42], [-0.098, -0.512], [-0.073, -0.588], [-0.051, -0.66], [-0.04, -0.735], [-0.034, -0.8], [-0.022, -0.866], [0.006, -0.912]];
    const body = A.shape(sp(SIL, true, 0.5), { c: 'lapis', w: s * 0.04, passes: 2, rough: 0.12, ang: Q.dir(-1.45) });
    const iri = (cp, c, w, p, fl) => A.stroke(sp(cp, false, 0.6), 'pastel', c, { w: s * w, p, flow: fl });
    A.withMask(body, () => {
      iri([[-0.03, -0.88], [-0.04, -0.78], [-0.05, -0.66], [-0.1, -0.5], [-0.112, -0.37], [-0.09, -0.24]], 'neel', 0.05, 0.75, 0.5);   // the turned-away side
      iri([[0.03, -0.89], [0.014, -0.8], [0.016, -0.72], [0.04, -0.62], [0.06, -0.5], [0.064, -0.38]], A.mix('teal', 'verdigris', 0.4), 0.034, 0.7, 0.35);   // the sheen
      iri([[0.022, -0.6], [0.05, -0.5], [0.05, -0.42]], 'aqua', 0.022, 0.6, 0.3);
      for (let v = -0.29; v < -0.17; v += 0.03) A.stroke([Q(-0.13, v), Q(0, v + 0.012), Q(0.13, v)], 'side', A.mix('night', 'bottle', 0.3), { w: s * 0.034, p: 0.62 });   // the dark of the belly
      A.blend(body, { r: Math.max(1.4, s * 0.02), k: 0.28, ang: Q.dir(-1.5), len: s * 0.2 });
    }, 0);
    // fine scales in rows, the old way: little arcs, the round side down, in lapis, neel and verdigris, smaller up the neck
    for (let v = -0.9, row = 0; v < -0.2; row++) {
      const neck = v < -0.66, dv = neck ? 0.019 : 0.026, du = neck ? 0.022 : 0.031, r = s * (neck ? 0.0095 : 0.0135);
      for (let u = -0.14 + (row % 2) * du * 0.5; u < 0.14; u += du) {
        const q = Q(u + rr(-0.002, 0.002), v + rr(-0.002, 0.002));
        if (!A.inside([body], q[0], q[1]) || !A.inside([body], q[0] + r * 1.25, q[1]) || !A.inside([body], q[0] - r * 1.25, q[1])) continue;
        if (v > -0.28 && A.chance(0.5)) continue;
        const d = Q.dir(PI / 2) + rr(-0.12, 0.12), lit = u > 0.0 && u < 0.08;
        A.stroke(A.ellipse(q[0], q[1], r, r * 1.05, 0, d - 1.3, d + 1.3), 'chalk', lit ? pick(['aqua', 'verdigris', 'sky']) : pick(['verdigris', A.mix('lapis', 'sky', 0.45), 'aqua', A.mix('neel', 'lapis', 0.5)]), { w: Math.max(0.5, r * 0.36), p: rr(0.6, 0.85) });
      }
      v += dv;
    }
    A.outline(body, 'kajal', 'kajal', { closed: true, w: 0.85, p: 0.82, pull: 22, again: 0.12 });

    // ---- the head, turned to the right and calling: white above and below the eye, a crest of fans.  A good size for
    //      the bird, as the painters give it: the head is what the eye goes to after the train
    const hs = 0.07, ba = -0.34, ca = Math.cos(ba), sa = Math.sin(ba);
    const L = (al, ac) => Q(HC[0] + (ca * al - sa * ac) * hs, HC[1] + (sa * al + ca * ac) * hs);
    // the crest first, so the crown covers the roots of its quills: a small upright fan of bare quills, each ending in a
    // spoon of blue-green with a dark heart, the fan leaning back a little from the beak.  Drawn as the painters draw it,
    // every quill one fine pull of the kajal, every spoon a pressed dab with its edge said in a hair of line
    const nq = 7, cr0 = L(-0.18, -0.78);
    for (let i = 0; i < nq; i++) {
      const t = i / (nq - 1), a = Q.dir(-PI / 2 - 0.14 + (t - 0.5) * 1.3 + rr(-0.03, 0.03)), len = s * hs * rr(2.2, 2.4) * (1 - 0.14 * Math.abs(t - 0.5) * 2);
      const tip = [cr0[0] + Math.cos(a) * len, cr0[1] + Math.sin(a) * len], bw = (t - 0.5) * 0.3;
      const mid = [(cr0[0] + tip[0]) / 2 + Math.cos(a + PI / 2) * bw, (cr0[1] + tip[1]) / 2 + Math.sin(a + PI / 2) * bw];
      A.stroke([cr0, mid, tip], 'kajal', A.mix('kajal', 'neel', 0.4), { w: 0.55, p: 0.92, tin: 0, tout: 0.1 });
      // the spoon: an egg of teal set along the quill's end, its wide end outward, a lapis heart and a speck of gold
      const sl = s * hs * 0.34, sw2 = s * hs * 0.19, sc = [tip[0] - Math.cos(a) * sl * 0.35, tip[1] - Math.sin(a) * sl * 0.35];
      const spoon = pkBlob(A, pick([A.mix('teal', 'verdigris', 0.35), 'teal', A.mix('teal', 'malachite', 0.4)]), sc[0], sc[1], sl, sw2, a, { rough: 0.05 });
      A.dot(sc[0] + Math.cos(a) * sl * 0.12, sc[1] + Math.sin(a) * sl * 0.12, 'chalk', 'lapis', { w: sw2 * 1.05, len: sl * 0.35, ang: a, p: 0.95 });
      A.dot(sc[0] + Math.cos(a) * sl * 0.18, sc[1] + Math.sin(a) * sl * 0.18, 'kajal', 'neel', { w: sw2 * 0.5, p: 0.9 });
      A.dot(sc[0] - Math.cos(a) * sl * 0.45, sc[1] - Math.sin(a) * sl * 0.45, 'gold', 'gold', { w: Math.max(0.5, sw2 * 0.55), p: 0.9 });
      A.outline(spoon, 'kajal', A.mix('kajal', 'neel', 0.4), { closed: true, w: 0.35, p: 0.6, pull: 10, again: 0 });
    }
    // the beak, pale horn, open to call
    const up = [L(0.66, -0.46), L(1.2, -0.5), L(1.78, -0.36), L(1.95, -0.2), L(1.7, -0.14), L(1.15, -0.06), L(0.7, 0.0)], lo = [L(0.74, 0.06), L(1.2, 0.12), L(1.62, 0.28), L(1.5, 0.4), L(1.05, 0.42), L(0.66, 0.38)];
    A.shape(A.spline(lo, true, 0.3), { c: A.mix('sand', 'ochre', 0.2), w: s * 0.016, rough: 0, passes: 2, line: A.mix('sepia', 'kajal', 0.4), lw: 0.45, lp: 0.8, off: 0.1 });
    A.shape(A.spline(up, true, 0.3), { c: A.mix('sand', 'cream', 0.45), w: s * 0.016, rough: 0, passes: 2, line: A.mix('sepia', 'kajal', 0.4), lw: 0.45, lp: 0.8, off: 0.1 });
    const skull = A.shape(A.spline([L(-1.0, 0.05), L(-0.85, -0.6), L(-0.3, -0.95), L(0.35, -0.85), L(0.85, -0.48), L(1.02, -0.08), L(0.92, 0.3), L(0.55, 0.65), L(0, 0.84), L(-0.6, 0.7), L(-0.95, 0.38)], true, 0.3), { c: 'lapis', w: s * 0.02, passes: 2, rough: 0.04, ang: Q.dir(ba) });
    A.withMask(skull, () => {
      A.stroke([L(-0.5, -0.75), L(0.2, -0.82), L(0.7, -0.5)], 'pastel', A.mix('teal', 'verdigris', 0.35), { w: s * 0.02, p: 0.7, flow: 0.4 });
      A.stroke([L(-0.9, 0.2), L(-0.4, 0.6), L(0.3, 0.75)], 'pastel', 'neel', { w: s * 0.02, p: 0.7, flow: 0.45 });
    }, 0);
    A.stroke([L(-0.6, -0.36), L(-0.05, -0.5), L(0.62, -0.36)], 'chalk', 'khadi', { w: s * hs * 0.34, p: 0.95, tin: 0.25, tout: 0.2 });   // the white over the eye
    A.stroke([L(-0.42, 0.2), L(0.05, 0.44), L(0.64, 0.26)], 'chalk', 'khadi', { w: s * hs * 0.48, p: 0.95, tin: 0.2, tout: 0.3 });    // and the white crescent under it
    const ey = L(0.26, -0.08);
    A.dot(ey[0], ey[1], 'kajal', 'kajal', { w: s * hs * 0.44, p: 1 });
    A.dot(ey[0] + s * 0.003, ey[1] - s * 0.003, 'chalk', 'khadi', { w: Math.max(0.4, s * 0.0045), p: 0.9 });
    A.outline(skull, 'kajal', 'kajal', { closed: true, w: 0.6, p: 0.8, pull: 14, again: 0 });
    return { head: hcw, centre: P(C[0], C[1]) };
  }
  const lerpP = (a, b2, t) => [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];

  /* A PEAHEN, as the Mewar painters set her beside the dancer: in strict profile, a plump teardrop of warm brown with the
     breast high and forward and a short tail let down behind; a long neck going green and scaled toward its root; a small
     head with a fan of crest, the white of the face above and below a long almond eye; slim grey legs.
     x,y = between her feet; s = the length of her body; o.flip faces her to the left; o.look tips her head up a little */
  function hen(A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick, F = o.flip ? -1 : 1, P0 = frame(x, y, s, 0), P = (u, v) => P0(u * F, v), PA = cp => cp.map(p => P(p[0], p[1]));
    const sp = (cp, closed, st) => A.spline(PA(cp), !!closed, st || 0.4);
    const brown = A.mix(A.mix('umber', 'sand', 0.32), 'ochre', 0.12), dark = A.mix('umber', 'sepia', 0.45), pale = A.mix('sand', 'khadi', 0.45), lw = Math.max(0.4, s * 0.03);
    const legC = A.mix('stone', 'slate', 0.35);
    // legs: the far one a step behind, the near one carrying her
    for (const L of [[[-0.06, -0.46], [-0.05, -0.24], [-0.1, 0.0]], [[0.08, -0.46], [0.1, -0.24], [0.07, 0.0]]]) {
      const lp = sp(L, false, 0.3);
      A.stroke(lp, 'chalk', legC, { w: Math.max(0.6, s * 0.045), p: 0.95, tin: 0, tout: 0 });
      A.stroke(lp.map(q => [q[0] + 0.15, q[1]]), 'kajal', A.mix('slate', 'kajal', 0.4), { w: Math.max(0.3, s * 0.012), p: 0.6 });
      const f = P(L[2][0], L[2][1]);
      for (const a of [-0.25, 0.25, PI - 0.4]) A.stroke([f, [f[0] + Math.cos(a) * F * s * 0.09, f[1] + Math.sin(a) * s * 0.02]], 'chalk', legC, { w: Math.max(0.45, s * 0.025), p: 0.9, tin: 0, tout: 0.4 });
    }
    // the body: breast forward and high, back sloping into a short tail
    const BODY = [[0.37, -0.8], [0.35, -0.65], [0.25, -0.52], [0.06, -0.45], [-0.18, -0.46], [-0.4, -0.52], [-0.56, -0.58], [-0.7, -0.66], [-0.73, -0.72], [-0.57, -0.77], [-0.36, -0.85], [-0.12, -0.94], [0.1, -0.98], [0.29, -0.93]];
    const body = A.shape(sp(BODY, true, 0.4), { c: brown, w: Math.max(1.2, s * 0.08), rough: 0.12, passes: 2, ang: P0.dir(F > 0 ? 0.25 : PI - 0.25) });
    A.withMask(body, () => {
      A.stroke(sp([[-0.66, -0.72], [-0.4, -0.8], [-0.1, -0.9], [0.18, -0.93]], false, 0.6), 'side', dark, { w: s * 0.14, p: 0.45 });          // the back, darker
      A.stroke(sp([[0.24, -0.6], [0.06, -0.5], [-0.14, -0.49]], false, 0.6), 'pastel', pale, { w: s * 0.16, p: 0.9, tin: 0.2, tout: 0.4 });   // the pale belly
      A.blend(body, { r: Math.max(1, s * 0.05), k: 0.25, ang: P0.dir(0), len: s * 0.4 });
      // the hatching of her feathers: small scallops in rows, sepia on the brown, finer toward the breast
      for (let v = -0.9, row = 0; v < -0.55; v += 0.07, row++) for (let u = -0.7 + (row % 2) * 0.05; u < 0.25; u += 0.1) {
        const q = P(u + rr(-0.012, 0.012), v + rr(-0.01, 0.01)); if (!A.inside([body], q[0], q[1]) || A.chance(0.25)) continue;
        const r = s * (u > 0 ? 0.03 : 0.04) * rr(0.85, 1.15);
        A.stroke(A.ellipse(q[0], q[1], r, r * 0.8, 0, 0.35, PI - 0.35), 'kajal', pick(['sepia', dark, 'sepia']), { w: Math.max(0.3, s * 0.011), p: rr(0.5, 0.75) });
      }
      // the folded wing: a long almond of lighter brown edged pale, the primaries drawn as fine dark strokes to the tail
      const wing = sp([[0.18, -0.84], [0.02, -0.74], [-0.3, -0.66], [-0.58, -0.62], [-0.36, -0.74], [-0.08, -0.84]], true, 0.4);
      A.fill([wing], 'chalk', A.mix(brown, 'sand', 0.3), { w: s * 0.05, p: 0.7, passes: 1 });
      A.stroke(sp([[0.16, -0.83], [-0.08, -0.74], [-0.36, -0.67], [-0.58, -0.62]], false, 0.5), 'chalk', pale, { w: Math.max(0.35, s * 0.016), p: 0.75, tin: 0.1, tout: 0.3 });
      for (let k = 0; k < 4; k++) A.stroke(sp([[-0.28 - k * 0.02, -0.71 + k * 0.012], [-0.48 - k * 0.03, -0.66 + k * 0.008], [-0.68 - k * 0.015, -0.66 + k * 0.006]], false, 0.5), 'kajal', dark, { w: Math.max(0.3, s * 0.012), p: 0.6, tin: 0.1, tout: 0.3 });
      for (let k = 0; k < 3; k++) A.stroke(sp([[-0.56 - k * 0.05, -0.6 - k * 0.02], [-0.6 - k * 0.05, -0.74 + k * 0.01]], false, 0.5), 'chalk', pale, { w: Math.max(0.3, s * 0.014), p: 0.55 });   // bars across the tail
    }, 0);
    A.outline(body, 'kajal', A.mix('sepia', 'kajal', 0.4), { closed: true, w: lw, p: 0.8, pull: 14, again: 0 });
    // the neck: brown at the throat, going to a green scaled like a coat of mail toward the breast
    const ncl = sp([[0.24, -0.84], [0.3, -0.98], [0.3, -1.1], [0.34, -1.2]], false, 0.3);
    const nk = A.shape(ribbon(ncl, t => s * lerp(0.13, 0.06, Math.pow(t, 0.8))), { c: A.mix('malachite', 'bottle', 0.25), w: Math.max(0.8, s * 0.05), rough: 0.08, passes: 2 });
    A.withMask(nk, () => {
      A.stroke(ncl.slice(Math.floor(ncl.length * 0.55)), 'pastel', brown, { w: s * 0.12, p: 0.9, tin: 0.4, tout: 0 });
      for (const q of A.along(ncl.slice(0, Math.floor(ncl.length * 0.65)), s * 0.035, 0)) for (const d of [-1, 1]) A.dot(q.x + d * s * 0.025, q.y + rr(-0.2, 0.2), 'chalk', pick(['leaf', 'verdigris', 'aqua']), { w: Math.max(0.4, s * 0.022), p: rr(0.6, 0.85) });
    }, 0);
    A.outline(nk, 'kajal', A.mix('sepia', 'kajal', 0.4), { w: lw * 0.85, p: 0.75, pull: 10, again: 0 });
    // the head, tipped a little up as she watches him
    const hc = [0.37 + rr(-0.01, 0.01), -1.25], ha = (o.look || 0.15), hr = 0.1;
    const H = (u, v) => P(hc[0] + (u * Math.cos(ha) - v * Math.sin(ha)) * hr, hc[1] + (u * Math.sin(-ha) + v * Math.cos(ha)) * hr);
    // the crest first, so the crown covers the roots of its stems
    for (let i = 0; i < 4; i++) {
      const r0 = H(-0.2, -0.85), a = -PI / 2 + F * (i - 1.2) * 0.22 + rr(-0.05, 0.05), len = s * rr(0.1, 0.13), tip = [r0[0] + Math.cos(a) * len, r0[1] + Math.sin(a) * len];
      A.stroke([r0, tip], 'kajal', A.mix('sepia', 'kajal', 0.3), { w: Math.max(0.3, s * 0.01), p: 0.85, tin: 0, tout: 0 });
      A.dot(tip[0], tip[1], 'chalk', pick([A.mix('umber', 'malachite', 0.4), 'verdigris', A.mix('sepia', 'teal', 0.4)]), { w: Math.max(0.6, s * 0.035), p: 0.95 });
    }
    const skull = A.shape(A.spline([H(-1.0, 0.1), H(-0.8, -0.6), H(-0.1, -0.95), H(0.6, -0.7), H(1.0, -0.15), H(0.85, 0.4), H(0.2, 0.75), H(-0.6, 0.62)], true, 0.4), { c: brown, w: Math.max(0.8, s * 0.04), rough: 0.04, passes: 2 });
    A.withMask(skull, () => {
      A.stroke([H(-0.7, -0.3), H(0.0, -0.45), H(0.75, -0.3)], 'chalk', 'khadi', { w: Math.max(0.5, s * 0.032), p: 0.9, tin: 0.2, tout: 0.2 });   // the white over the eye
      A.stroke([H(-0.5, 0.3), H(0.1, 0.42), H(0.75, 0.22)], 'chalk', 'khadi', { w: Math.max(0.5, s * 0.04), p: 0.9, tin: 0.2, tout: 0.3 });     // and under it
    }, 0);
    // the eye: a long almond in kajal, the dark of it toward the beak
    const e0 = H(-0.25, -0.02), e1 = H(0.55, -0.04), em = H(0.15, -0.14), en = H(0.15, 0.08);
    A.stroke([e0, em, e1], 'kajal', 'kajal', { w: Math.max(0.35, s * 0.016), p: 0.9, tin: 0.1, tout: 0.2 });
    A.stroke([e0, en, e1], 'kajal', 'kajal', { w: Math.max(0.3, s * 0.011), p: 0.75, tin: 0.1, tout: 0.1 });
    const ir = H(0.3, -0.04); A.dot(ir[0], ir[1], 'kajal', 'kajal', { w: Math.max(0.6, s * 0.035), p: 0.95 });
    A.outline(skull, 'kajal', A.mix('sepia', 'kajal', 0.4), { closed: true, w: lw * 0.75, p: 0.75, pull: 10, again: 0 });
    // the beak, short and pale, closed
    const bk = [H(0.85, -0.3), H(1.65, -0.02), H(0.9, 0.2)];
    A.shape(A.spline(bk, true, 0.3), { c: A.mix('sand', 'stone', 0.3), w: Math.max(0.5, s * 0.025), rough: 0, passes: 2 });
    A.stroke([H(0.95, -0.04), H(1.55, -0.02)], 'kajal', 'sepia', { w: Math.max(0.25, s * 0.008), p: 0.7 });
    return { head: H(0, 0) };
  }

  /* ====================================================================== UTOPIA */
  /* Rain as a hand lays it: not a ruled grid of dashes but drags of the stick, pulled down on the slant in little bunches,
     each a different length and weight, some broken where the stick skipped.  heavy(x, y) says how dark the cloud is
     over that spot (0..1): the sheets gather there and thin out toward the light.  Under the drags, a few soft veils
     with the side of a pale stick, so a sheet reads as a curtain and not as loose marks. */
  function rainDrags(A, poly, o) {
    const rr = A.rr, sl0 = o.slant, bb = A.bbox([poly]), H = bb[3] - bb[1], lean = Math.abs(sl0) * H + 16;
    const heavy = o.heavy || (() => 0.6), dens = o.density || 1, fade = o.fade != null ? o.fade : 0.5, scale = o.scale || 1;
    A.pushMask([poly]);
    // the veils first, under everything
    const nv = Math.round((bb[2] - bb[0] + 2 * lean) / 9 * dens * (o.veils != null ? o.veils : 1));
    for (let i = 0; i < nv; i++) {
      const xt = rr(bb[0] - lean, bb[2] + lean), w8 = heavy(xt, bb[1]);
      if (A.rnd() > w8 * 0.9) continue;
      const y0 = bb[1] + rr(-10, H * 0.35), sl = sl0 + rr(-0.02, 0.02), x0 = xt + (y0 - bb[1]) * sl;
      let L = rr(0.4, 0.9) * H;
      // a veil can be told to thin out before it reaches the hills, where the side of the stick only scratches the dark
      if (o.vbot) { const lim = o.vbot(x0 + sl * L) + rr(-2, 3) - y0; if (lim < 6) continue; L = Math.min(L, lim); }
      A.stroke([[x0, y0], [x0 + sl * L * 0.5 + rr(-1, 1), y0 + L * 0.5], [x0 + sl * L, y0 + L]], 'side', A.pick(o.veilC || ['ice', 'slate']), { w: rr(4, 9) * scale, p: rr(0.07, 0.16) * w8, tin: 0.3, tout: 0.5 });
    }
    // the drags, in bunches
    const nc = Math.round((bb[2] - bb[0] + 2 * lean) * H / 260 * dens);
    for (let i = 0; i < nc; i++) {
      const y0 = bb[1] + rr(-8, H * 0.95), xt = rr(bb[0] - lean, bb[2] + lean), w8 = heavy(xt, y0), depth = Math.max(0, Math.min(1, (y0 - bb[1]) / H));
      if (A.rnd() > 0.12 + 0.88 * w8) continue;                          // the sheets gather under the dark
      if (A.rnd() < fade * depth * 0.8) continue;                        // and thin toward the ground
      const sl = sl0 + rr(-0.035, 0.035), x0 = xt + (y0 - bb[1]) * sl, n = Math.max(1, Math.round(A.ri(2, 7) * (0.5 + w8)));
      const tone = A.chance(0.62) ? 'pale' : 'chalk', press = (1 - fade * 0.55 * depth) * (0.55 + 0.45 * w8);
      let dx = 0;
      for (let k = 0; k < n; k++) {
        dx += rr(1.1, 3.4) * scale;
        const sx = x0 + dx, sy = y0 + rr(-7, 7) * scale, L = rr(4, 19) * scale * (1 - 0.3 * depth) * (A.chance(0.15) ? 1.6 : 1);
        const tool = tone === 'pale' ? 'pastel' : 'chalk', c = tone === 'pale' ? A.pick(['ice', 'ice', 'sky', A.mix('sky', 'khadi', 0.5)]) : A.pick(['khadi', 'khadi', A.mix('khadi', 'ice', 0.4)]);
        const w = rr(0.4, 1.05) * scale * (tool === 'pastel' ? 1.15 : 0.9), p = rr(0.32, 0.9) * press;
        // a drag, or a drag the stick broke in two or three
        const cuts = A.chance(0.2) ? A.ri(2, 3) : 1;
        let t0 = 0;
        for (let c2 = 0; c2 < cuts; c2++) {
          const t1 = c2 === cuts - 1 ? 1 : t0 + rr(0.25, 0.5) * (1 - t0);
          const a = [sx + sl * L * t0, sy + L * t0], e = [sx + sl * L * t1, sy + L * t1], m = [(a[0] + e[0]) / 2 + rr(-0.25, 0.25), (a[1] + e[1]) / 2];
          A.stroke([a, m, e], tool, c, { w, p: p * rr(0.8, 1.1), tin: rr(0.05, 0.35), tout: rr(0.2, 0.6), wob: 0.5 });
          t0 = t1 + rr(0.06, 0.16);
          if (t0 >= 0.95) break;
        }
      }
    }
    A.popMask();
  }

  /* A HILL LUMP, the way the Mewar painters stack the hills of the rains: one round hump laid in a flat green, then
     modelled from its rim inward (a pale lip of pastel just under the crest, a softer band inside that, the dark
     gathered at the root, the round of it said again in a few fine strokes), and outlined in a pale chalk line.
     L = { cx, rw (half the width), top (the crest), base (where it goes down out of sight), sk (pushes the crest to one
     side), n (how square the shoulders are) }; P = { c, lip, mid, deep, hatch, line }.  Returns y(x) along its crest. */
  function lump(A, L, P) {
    const rr = A.rr, n = L.n || 2.4, H = L.base - L.top, arc = [];
    for (let i = 0; i <= 40; i++) {
      const t = -1 + 2 * i / 40, tt = clamp(t - (L.sk || 0) * (1 - t * t), -1, 1);
      arc.push([L.cx + L.rw * t + rr(-0.12, 0.12), L.top + H * (1 - Math.pow(Math.max(0, 1 - Math.pow(Math.abs(tt), n)), 1 / n))]);
    }
    const rp = A.shape(arc.concat([[L.cx + L.rw, L.base + 40], [L.cx - L.rw, L.base + 40]]), { c: P.c, w: Math.max(2.5, H * 0.3), passes: 2, rough: 0.3, ang: rr(-0.35, 0.35) });
    // the arc again, d further down and drawn in at the sides, so it runs parallel to the rim
    const inset = d => arc.map(p => [L.cx + (p[0] - L.cx) * (1 - d / L.rw * 0.85), p[1] + d]);
    A.withMask(rp, () => {
      A.stroke([[L.cx - L.rw * 1.1, L.top + H * 0.85], [L.cx, L.top + H * 0.9], [L.cx + L.rw * 1.1, L.top + H * 0.85]], 'side', P.deep, { w: H * 0.7, p: 0.5 });
      A.stroke(inset(H * 0.28 + 1.2), 'side', P.mid, { w: Math.max(2.4, H * 0.24), p: 0.42, tin: 0.2, tout: 0.2 });
      A.stroke(inset(1.1), 'pastel', P.lip, { w: Math.max(1.5, H * 0.14), p: 0.85, tin: 0.1, tout: 0.1 });
      A.blend([rp], { r: Math.max(1.3, H * 0.09), k: 0.3, ang: PI / 2 + rr(-0.3, 0.3), len: H * 0.5 });
      for (let j = 1; j <= 3; j++) {
        const seg = inset(H * (0.18 + 0.18 * j)), a = Math.floor(seg.length * rr(0.04, 0.22)), e = Math.floor(seg.length * rr(0.78, 0.96));
        A.stroke(seg.slice(a, e), 'chalk', j === 1 ? P.lip : P.hatch, { w: rr(0.55, 0.8), p: rr(0.4, 0.6) * (1.1 - j * 0.18), tin: 0.3, tout: 0.3 });
      }
    }, 0);
    A.outline(arc.map(p => [p[0] + rr(-0.25, 0.25), p[1] + rr(-0.25, 0.25)]), 'chalk', P.line, { w: rr(0.85, 1.05), p: 0.85, pull: rr(22, 36), again: 0.2 });
    return x => {
      if (x <= arc[0][0] || x >= arc[arc.length - 1][0]) return L.base;
      for (let i = 1; i < arc.length; i++) if (arc[i][0] >= x) { const p = arc[i - 1], q = arc[i]; return lerp(p[1], q[1], (x - p[0]) / (q[0] - p[0] || 1)); }
      return L.base;
    };
  }

  M.folioArt['utopia'] = function (A, b) {
    const rr = A.rr, pick = A.pick;
    const X = u => b.x0 + u * b.w, Y = v => b.y0 + v * b.h;

    // ---- the lie of the land
    const farTop = x => Y(0.47) - 9 * Math.exp(-Math.pow((x - X(0.22)) / 34, 2)) - 12 * Math.exp(-Math.pow((x - X(0.86)) / 40, 2)) + 2 * Math.sin(x / 9);
    const fieldTop = x => Y(0.6) - 7 * Math.exp(-Math.pow((x - X(0.5)) / 70, 2)) + 3 * Math.sin(x / 23 + 1);

    // ---- 1. the sky: slate laid with the side of the stick, heavier toward the top
    const sky = band(b, () => b.y0 - 8, () => Y(0.66));
    A.ground(sky, 'storm', { w: 18, ang: -0.08, c2: A.mix('storm', 'slate', 0.35), edge: 0, rub: 6 });
    A.withMask(sky, () => {
      for (let i = 0; i < 26; i++) { const y = Y(rr(-0.05, 0.3)), x = X(rr(-0.1, 1.05)), L = rr(30, 90); A.stroke([[x, y], [x + L * 0.5, y + rr(-2, 2)], [x + L, y + rr(-2, 2)]], 'side', pick(['neel', 'neel', 'night', 'storm']), { w: rr(8, 15), p: rr(0.4, 0.75) }); }
      for (let i = 0; i < 14; i++) { const y = Y(rr(0.3, 0.55)), x = X(rr(-0.1, 1.05)), L = rr(20, 70); A.stroke([[x, y], [x + L * 0.5, y + rr(-1.5, 1.5)], [x + L, y]], 'side', pick(['slate', 'mauve', 'sky', 'lilac']), { w: rr(3, 7), p: rr(0.2, 0.42) }); }
    }, 0);

    // ---- 2. the storm: a mass of curled cloud across the top, with gold in it
    const cb = [[X(-0.1), Y(-0.15)], [X(1.1), Y(-0.15)], [X(1.1), Y(0.2)], [X(0.85), Y(0.27)], [X(0.62), Y(0.22)], [X(0.4), Y(0.3)], [X(0.18), Y(0.24)], [X(-0.1), Y(0.28)]];
    const cloud = M.cloudMass(A, cb, { curl: 10.5, flat: ['top', 'left', 'right'], lead: 'none', gold: 0.45, density: 1.1, c: 'storm', deep: 'neel', edge: 'khadi' });

    // ---- 3. lightning out of the belly of the cloud: a gold serpent with a red heart, and a smaller one far right
    M.lightning(A, [[X(0.2), Y(0.22)], [X(0.19), Y(0.33)], [X(0.215), Y(0.43)], [X(0.2), Y(0.53)]], { w: 3, amp: 5, wave: 16, forks: 1, coil: false, tongue: true, glow: false, core: 'haldi' });
    M.lightning(A, [[X(0.885), Y(0.2)], [X(0.91), Y(0.3)], [X(0.95), Y(0.45)]], { w: 2.1, amp: 3.5, wave: 13, forks: 0, coil: false, tongue: true, glow: false, core: 'haldi' });

    // ---- 5. the hills under the rain, stacked the Mewar way: three rows of round lumps, each lump outlined in chalk and
    //         modelled from its rim, the back row darkest under the storm, the front row nearly the green of the field;
    //         small trees stand on the crests, the tallest on the back row against the sky
    const ROWS = [
      { base: Y(0.535), crest: x => farTop(x) + rr(-1.5, 2), rw: [17, 25], P: { c: A.mix(A.mix('bottle', 'teal', 0.25), 'night', 0.12), lip: A.mix('malachite', 'sage', 0.35), mid: A.mix('bottle', 'moss', 0.45), deep: A.mix('bottle', 'night', 0.45), hatch: A.mix('malachite', 'bottle', 0.4), line: A.mix('sage', 'khadi', 0.25) } },
      { base: Y(0.585), crest: () => Y(0.507) + rr(-2.5, 2.5), rw: [15, 22], P: { c: A.mix('bottle', 'malachite', 0.48), lip: A.mix('leaf', 'sage', 0.4), mid: A.mix('malachite', 'moss', 0.3), deep: A.mix('bottle', 'moss', 0.3), hatch: A.mix('malachite', 'leaf', 0.3), line: A.mix('leaf', 'khadi', 0.4) } },
      { base: Y(0.645), crest: () => Y(0.548) + rr(-2, 2.5), rw: [14, 20], P: { c: A.mix('malachite', 'sap', 0.35), lip: A.mix('leaf', 'haldi', 0.18), mid: A.mix('sap', 'leaf', 0.35), deep: A.mix('malachite', 'bottle', 0.45), hatch: A.mix('leaf', 'sap', 0.4), line: A.mix('leaf', 'khadi', 0.55) } }
    ];
    const crestAt = ROWS.map((R, ri) => {
      const L = [];
      for (let x = X(-0.06) + (ri % 2) * 11 + rr(-4, 4); x < X(1.06); ) {
        const rw = rr(R.rw[0], R.rw[1]), cx = x + rw * 0.55;
        L.push({ cx, rw, base: R.base, top: Math.min(R.crest(cx), R.base - rw * 0.42), sk: rr(-0.25, 0.25), n: rr(2.1, 2.7) });
        x = cx + rw * rr(0.55, 0.75);
      }
      // every other lump first, so each one in between laps over its neighbours at both shoulders
      const ys = [];
      for (const half of [1, 0]) L.forEach((l, i) => { if (i % 2 === half) ys.push(lump(A, l, R.P)); });
      const y = x => { let m = 1e9; for (const f of ys) m = Math.min(m, f(x)); return m; };
      // trees on this row's crests: the tall ones on the back row against the storm, smaller ones in front
      const TR = ri === 0 ? [[0.025, 'cypress', 27], [0.09, 'mango', 19], [0.135, 'palm', 23], [0.28, 'cypress', 21], [0.7, 'mango', 17], [0.77, 'cypress', 26], [0.855, 'palm', 26], [0.96, 'mango', 20]]
        : ri === 1 ? [[0.045, 'mango', 11], [0.2, 'cypress', 14], [0.33, 'mango', 10], [0.64, 'cypress', 13], [0.9, 'mango', 11]] : [[0.06, 'mango', 9], [0.94, 'cypress', 11]];
      for (const t of TR) {
        // the tree goes to the crest of the lump nearest it, a little to one side of the top
        let best = L[0]; for (const l of L) if (Math.abs(l.cx - X(t[0])) < Math.abs(best.cx - X(t[0]))) best = l;
        const tx = best.cx + best.rw * rr(-0.22, 0.22);
        smallTree(A, tx, y(tx) + 1.6, t[2], t[1], { c: A.mix('bottle', 'night', ri === 0 ? 0.3 : 0.1), mid: 'moss', leaf: t[1] === 'cypress' ? A.mix('malachite', 'bottle', 0.3) : A.mix('malachite', 'leaf', 0.3 + ri * 0.15), leaf2: 'leaf', flower: t[1] === 'mango' && A.chance(0.6) ? 'gulabi' : null });
      }
      return y;
    });
    const hillTop = crestAt[0];

    // ---- 6. cranes flying home together through the dark, a garland of white; and rain over everything far
    M.craneGarland(A, [[X(0.25), Y(0.39)], [X(0.4), Y(0.33)], [X(0.56), Y(0.31)], [X(0.7), Y(0.27)]], 6, { s0: 12, s1: 14.5, sway: 0.3, line: 'slate', lineP: 0.45 });
    for (const q of [[0.78, 0.36, 2.6], [0.82, 0.32, 2.1], [0.05, 0.36, 2.4]]) farBird(A, X(q[0]), Y(q[1]), q[2], 'khadi');
    // how dark the cloud is over a spot: heaviest under the lightning at the left and the far right, lightest where the
    // cranes fly home, toward the break in the storm
    const g = (x, c, w) => Math.exp(-Math.pow((x - X(c)) / (w * b.w), 2));
    const heavy = x => Math.max(0, Math.min(1, 0.3 + 0.62 * g(x, 0.17, 0.2) + 0.5 * g(x, 0.93, 0.14) + 0.3 * (A.noise2(x / 38, 4.1, 93) - 0.5) - 0.32 * g(x, 0.62, 0.13)));
    rainDrags(A, band(b, () => Y(0.18), () => Y(0.66)), { slant: -0.28, density: 1, fade: 0.35, heavy, vbot: x => hillTop(x) + 2 });

    // ---- 7. the near field, the fresh green of the first rain
    const field = band(b, fieldTop, () => b.y1 + 8);
    A.ground(field, A.mix('sap', 'malachite', 0.25), { w: 18, ang: -0.15, c2: A.mix('sap', 'leaf', 0.35), edge: 0.5, rub: 6 });
    A.withMask(field, () => {
      for (let i = 0; i < 70; i++) { const x = X(rr(-0.05, 1.05)), y = Y(rr(0.6, 1.05)), L = rr(8, 22); A.stroke([[x, y], [x + L, y + rr(-1, 1)]], 'side', pick(['sap', 'olive', 'leaf', 'malachite', 'moss']), { w: rr(2.5, 5), p: rr(0.22, 0.45) }); }
      // tufts of grass, three or five blades, darker than the field, gathered in drifts
      for (const p of A.scatter(field, 6.5, { jit: 0.48 })) {
        if (A.noise2(p[0] / 26, p[1] / 14, 77) < 0.5) continue;
        const n = A.ri(3, 5), h = rr(2.2, 3.6), c = pick(['bottle', 'moss', 'malachite', 'bottle']);
        for (let k = 0; k < n; k++) { const a = -PI / 2 + (k / (n - 1) - 0.5) * 1.3 + rr(-0.1, 0.1); A.stroke([[p[0], p[1]], [p[0] + Math.cos(a) * h, p[1] + Math.sin(a) * h]], 'chalk', c, { w: 0.6, p: rr(0.55, 0.85), tin: 0, tout: 0.6 }); }
      }
    }, 0);
    // the field is the last and nearest of the lumps: lit at its rim the same way, and outlined in the same pale chalk
    const ftl = A.spline([[X(-0.05), fieldTop(X(-0.05))], [X(0.2), fieldTop(X(0.2))], [X(0.5), fieldTop(X(0.5))], [X(0.8), fieldTop(X(0.8))], [X(1.05), fieldTop(X(1.05))]], false, 2);
    A.withMask(field, () => {
      A.stroke(ftl.map(p => [p[0], p[1] + 6]), 'side', A.mix('leaf', 'sap', 0.45), { w: 6, p: 0.32 });
      A.stroke(ftl.map(p => [p[0], p[1] + 1.4]), 'pastel', A.mix('leaf', 'haldi', 0.2), { w: 2.4, p: 0.8, tin: 0, tout: 0 });
    }, 0);
    A.outline(ftl, 'chalk', A.mix('leaf', 'khadi', 0.5), { w: 1, p: 0.82, pull: 40, again: 0.15 });
    // a lighter rain over the field, behind the birds
    rainDrags(A, band(b, x => fieldTop(x) - 2, () => Y(0.86)), { slant: -0.28, density: 0.45, fade: 0.7, veils: 0, scale: 0.85, heavy: x => heavy(x) * 0.85 });

    // ---- 8. a pool in the near corner, its lotuses open to the rain
    const pl = pool(A, A.spline([[X(-0.05), Y(0.8)], [X(0.06), Y(0.76)], [X(0.17), Y(0.78)], [X(0.25), Y(0.86)], [X(0.27), Y(1.05)], [X(-0.05), Y(1.05)]], true, 2));
    A.outline(pl.filter(p => p[1] < Y(1.0) && p[0] > X(-0.02)), 'kajal', 'bottle', { w: 0.8, p: 0.7, pull: 30 });
    // a lip of pale earth and reeds where the field meets the water
    A.outline(pl.filter(p => p[1] < Y(1.0) && p[0] > X(-0.02)).map(p => [p[0] + 0.8, p[1] - 1.2]), 'chalk', A.mix('leaf', 'khadi', 0.3), { w: 1.2, p: 0.6, pull: 25 });
    A.withMask(pl, () => {
      for (const q of [[0.16, 0.88, 5], [0.03, 0.85, 4], [0.22, 0.97, 4.5]]) M.ripple(A, X(q[0]), Y(q[1]), q[2], { flat: 0.42, w: 0.5, rings: 2 });
      M.lotusPad(A, X(0.03), Y(0.96), 8, { flat: 0.5, rot: -0.4 });
      M.lotusPad(A, X(0.2), Y(1.01), 7, { flat: 0.5, rot: 2.6 });
      M.lotusPad(A, X(0.135), Y(0.85), 5, { flat: 0.5, rot: 1 });
    }, 0);
    M.lotus(A, X(0.08), Y(0.93), 19, 'open');
    M.lotus(A, X(0.175), Y(0.94), 12, 'bud');

    // ---- 9. the dancer, and the two who watch from across the field
    dancer(A, X(0.5), Y(0.93), 68, { tilt: -0.05 });
    hen(A, X(0.83), Y(0.91), 19, { flip: true, look: 0.22 });
    hen(A, X(0.95), Y(0.85), 15.5, { flip: true, look: 0.05 });

    // ---- 10. flowers in the wet grass, in drifts of their own kind: larger toward the foot, some bowed, some half hidden
    const pc = X(0.5), field2 = band(b, x => fieldTop(x) + 5, () => b.y1 + 2);
    flowerDrifts(A, A.scatter(field2, 6, { jit: 0.5 }), {
      kinds: [['pinwheel', ['gulabi', 'rose', 'khadi']], ['star', ['hingul', 'crimson', 'khadi']], ['bell', ['rose', 'lilac', 'khadi']], ['spray', ['khadi', 'gulabi']],
        ['cup', ['hingul', 'crimson', 'saffron']], ['bud', ['crimson', 'rose']], ['daisy', ['khadi']], ['spike', ['lac', 'rose', 'mauve']], ['cross', ['khadi', 'gulabi']]],
      h: y => lerp(3.4, 11, clamp((y - Y(0.62)) / (b.y1 - Y(0.62)), 0, 1)), thresh: 0.55, scale: 26, seed: 31, hidden: 0.32,
      grass: ['bottle', 'moss', 'malachite', 'sap'],
      skip: p => (p[1] < Y(0.87) && Math.abs(p[0] - pc) < 70) || Math.abs(p[0] - pc) < 27 || (p[0] < X(0.28) && p[1] > Y(0.73)) ||
        (p[0] > X(0.77) && p[0] < X(0.885) && p[1] > Y(0.7) && p[1] < Y(0.935)) || (p[0] > X(0.905) && p[1] > Y(0.66) && p[1] < Y(0.88))
    });
  };

  /* ====================================================================== DALAL STREET */

  // animal geometry in "bull units": origin on the ground under the middle, x forward, y down, 1 unit = s
  function frame(x, y, s, tilt) {
    const c = Math.cos(tilt || 0), sn = Math.sin(tilt || 0);
    const P = (nx, ny) => { const px = nx * s, py = ny * s; return [x + px * c - py * sn, y + px * sn + py * c]; };
    P.all = pts => pts.map(p => P(p[0], p[1]));
    P.dir = a => Math.atan2(Math.sin(a) * c + Math.cos(a) * sn, Math.cos(a) * c - Math.sin(a) * sn);
    return P;
  }
  // a tapering band around a centre line; wf(t) = half width
  function ribbon(cl, wf) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], c = cl[Math.min(n - 1, i + 1)];
      let nx = -(c[1] - a[1]), ny = c[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const poly = L.concat(R.slice().reverse()); poly.L = L; poly.R = R;
    return poly;
  }
  function prof(t, k) { for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])); return k[k.length - 1][1]; }

  // one marigold: a tight ball of saffron and yellow dabs, never the same twice
  function marigold(A, x, y, r) {
    const rr = A.rr;
    A.dot(x, y, 'pastel', A.chance(0.5) ? 'saffron' : A.mix('saffron', 'sindoor', 0.35), { w: r * 2, p: 1 });
    for (let k = 0, n = A.ri(5, 8); k < n; k++) { const a = rr(0, TAU), q = r * rr(0.25, 0.8); A.dot(x + Math.cos(a) * q, y + Math.sin(a) * q, 'chalk', A.pick(['haldi', 'peori', 'saffron', 'haldi']), { w: r * rr(0.45, 0.7), p: 0.9 }); }
    if (A.chance(0.5)) A.dot(x + rr(-0.2, 0.2) * r, y + rr(-0.2, 0.2) * r, 'chalk', A.mix('sindoor', 'lac', 0.3), { w: r * 0.35, p: 0.8 });
  }
  // a brass bell: a cup hung by its loop, its mouth dark
  function bell(A, x, y, r, ang) {
    const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), R = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
    const cup = [R(-r * 0.45, -r * 0.5), R(r * 0.45, -r * 0.5), R(r * 0.62, r * 0.45), R(r * 0.8, r * 0.62), R(-r * 0.8, r * 0.62), R(-r * 0.62, r * 0.45)];
    A.shape(A.spline(cup, true, 0.6), { c: 'gold', tool: 'chalk', w: Math.max(0.8, r * 0.6), rough: 0.08, passes: 2 });
    A.stroke([R(-r * 0.15, -r * 0.5), R(r * 0.25, -r * 0.1), R(r * 0.4, r * 0.4)], 'gold', 'gold', { w: Math.max(0.5, r * 0.35), p: 0.9 });
    A.stroke([R(-r * 0.75, r * 0.62), R(r * 0.75, r * 0.62)], 'kajal', 'sepia', { w: Math.max(0.5, r * 0.22), p: 0.85 });
    A.dot(R(0, r * 0.82)[0], R(0, r * 0.82)[1], 'kajal', 'kajal', { w: Math.max(0.6, r * 0.38) });
    A.outline(A.spline(cup, true, 0.6), 'kajal', 'sepia', { closed: true, w: Math.max(0.4, r * 0.14), p: 0.7, pull: 20 });
    A.stroke([R(-r * 0.2, -r * 0.5), R(0, -r * 0.85), R(r * 0.2, -r * 0.5)], 'kajal', 'sepia', { w: Math.max(0.4, r * 0.14), p: 0.75 });
  }
  // a little rosette painted on the hide for the festival: a ring of red dots round a yellow heart
  function rosette(A, x, y, r) {
    const n = A.ri(6, 8), a0 = A.rr(0, TAU);
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n; A.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, 'chalk', A.chance(0.8) ? 'hingul' : 'sindoor', { w: r * A.rr(0.5, 0.65), p: 0.9 }); }
    A.dot(x, y, 'chalk', 'haldi', { w: r * 0.8, p: 0.95 }); A.dot(x, y, 'chalk', 'sindoor', { w: r * 0.3, p: 0.8 });
  }
  /* a small cloud of the Mewar sky: one white line that rolls up into an open curl at each end, the top heaped in a few
     round lobes, gold laid in the turn of each curl.  x,y = the middle of its foot, L = its length, dir = 1 or -1 (which
     end has the larger curl), o.th = its depth for its length */
  function cloudScroll(A, x, y, L, dir, o) {
    o = o || {};
    const rr = A.rr, ang = rr(-0.05, 0.05), ca = Math.cos(ang), sa = Math.sin(ang);
    const T = q => [x + q[0] * dir * ca - q[1] * sa, y + q[0] * dir * sa + q[1] * ca];
    const Hh = L * (o.th || rr(0.24, 0.29)), R1 = Hh * rr(0.6, 0.68), R2 = Hh * rr(0.42, 0.5), w = o.w || Math.max(0.85, L * 0.042);
    const c1 = [-L / 2 + R1, -R1], c2 = [L / 2 - R2, -R2], turn1 = rr(1.3, 1.5), turn2 = rr(1.15, 1.35), fq = rr(1, 2.2), ph = rr(0, TAU);
    // a spiral that winds in to the heart of a curl: t = 0 at the heart, 1 at the foot
    const spiral = (c, R, turn, m, k0, s) => { const out = []; for (let i = 0; i <= m; i++) { const t = i / m, a = PI / 2 + s * (1 - t) * turn * TAU, r = R * (k0 + (1 - k0) * t); out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9]); } return out; };
    // the line: out of the heart of the left curl, along the foot, up and over into the heart of the right one
    const ln = spiral(c1, R1, turn1, 30, 0.12, 1);
    const nF = Math.max(3, Math.round((c2[0] - c1[0]) / 1.5));
    for (let i = 1; i < nF; i++) { const t = i / nF; ln.push([lerp(c1[0], c2[0], t), Math.sin(t * PI * fq + ph) * Hh * 0.04]); }
    ln.push(...spiral(c2, R2, turn2, 26, 0.16, -1).reverse());
    // the lobes along the top, from the crown of one curl to the crown of the other
    const n = o.lobes || A.ri(2, 4), cuts = [0];
    for (let i = 1; i < n; i++) cuts.push((i + rr(-0.25, 0.25)) / n);
    cuts.push(1);
    const lobes = [];
    for (let i = 0; i < n; i++) {
      const u0 = lerp(c1[0], c2[0], cuts[i]), u1 = lerp(c1[0], c2[0], cuts[i + 1]), v0 = lerp(-2 * R1, -2 * R2, cuts[i]) * 0.84, v1 = lerp(-2 * R1, -2 * R2, cuts[i + 1]) * 0.84;
      const rx = (u1 - u0) / 2; lobes.push([(u0 + u1) / 2, (v0 + v1) / 2, rx, Math.min(rx * rr(0.6, 0.85), Hh * 0.7)]);
    }
    const arc = (cx, cy, rx, ry, a0, a1, m) => { const out = []; for (let i = 0; i <= m; i++) { const a = lerp(a0, a1, i / m); out.push(T([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])); } return out; };
    // the body: only a breath of white, so the blue shows through and the line does the work
    const sil = arc(c1[0], c1[1], R1, R1 * 0.9, PI / 2, PI * 1.5, 10);
    for (const l of lobes) sil.push(...arc(l[0], l[1], l[2], l[3], PI, TAU, 10));
    sil.push(...arc(c2[0], c2[1], R2, R2 * 0.9, -PI / 2, PI / 2, 10));
    A.fill([sil], 'pastel', A.mix('khadi', 'sky', 0.3), { w: Math.max(1, Hh * 0.35), p: o.body || 0.26, passes: 1, ang: ang + 0.3, reach: 1.2 });
    // the white line, then the lobes, each with a smaller arc of blue inside it
    A.stroke(ln.map(T), 'chalk', 'khadi', { w, p: 0.97, tin: 0.06, tout: 0.08 });
    for (const l of lobes) {
      A.stroke(arc(l[0], l[1], l[2], l[3], PI * 1.02, PI * 1.98, 12), 'chalk', 'khadi', { w: w * 0.85, p: 0.95, tin: 0.1, tout: 0.1 });
      if (l[2] > 2.2) A.stroke(arc(l[0], l[1] + l[3] * 0.25, l[2] * 0.55, l[3] * 0.5, PI * 1.12, PI * 1.88, 8), 'chalk', A.mix('sky', 'khadi', 0.4), { w: w * 0.5, p: 0.75, tin: 0.2, tout: 0.3 });
    }
    // gold: a thread winding inside each curl, a step in from the white, and a short arc under one crown
    A.stroke(spiral(c1, R1 * 0.68, turn1 * 0.8, 22, 0.2, 1).map(T), 'gold', 'gold', { w: w * 0.55, p: 0.92, tin: 0.15, tout: 0.25 });
    A.stroke(spiral(c2, R2 * 0.66, turn2 * 0.75, 18, 0.22, -1).map(T), 'gold', 'gold', { w: w * 0.5, p: 0.92, tin: 0.15, tout: 0.25 });
    const bl = lobes[Math.floor(rr(0, n))];
    A.stroke(arc(bl[0], bl[1] + bl[3] * 0.45, bl[2] * 0.75, bl[3] * 0.7, PI * 1.18, PI * 1.7, 6), 'gold', 'gold', { w: w * 0.45, p: 0.85, tin: 0.2, tout: 0.4 });
  }


  /* THE BULL: a white Kankrej bull dressed for the festival, prancing uphill to the right, drawn the Mewar way:
     strict profile, a long level back, a firm hump over the withers, the dewlap hanging in folds from the throat,
     a short deep face with a great almond eye, stout legs with real knees, hocks and fetlocks, the tail let down to a whisk.
     x,y = ground under the middle; s = the scale (the hump stands about 1.03 s high); o.tilt = slope of the ground */
  function bull(A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick, P = frame(x, y, s, o.tilt || 0);
    const hide = A.mix('khadi', 'cream', 0.14), cool = A.mix('ice', 'slate', 0.38), cool2 = A.mix('ice', 'slate', 0.66), warm = A.mix('cream', 'peach', 0.3);
    const farC = A.mix(A.mix(hide, cool, 0.45), 'stone', 0.25), line = A.mix('kajal', 'sepia', 0.35), lw = Math.max(0.55, s * 0.0084);
    const sp = (cp, closed, st) => A.spline(P.all(cp), !!closed, st || 0.7);
    const ink2 = (pts, o2) => A.outline(pts, 'kajal', line, Object.assign({ w: lw, p: 0.8, pull: 24, again: 0.12 }, o2 || {}));
    // ink a leg's edge only where it is out in the open, not where it runs up inside the body
    const openRuns = (pts, poly) => { const out = []; let cur = []; for (const p of pts) { if (A.inside([poly], p[0], p[1])) { if (cur.length > 2) out.push(cur); cur = []; } else cur.push(p); } if (cur.length > 2) out.push(cur); return out; };
    const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
    const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
    const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const fN = u => [u[1], -u[0]];                       // the normal toward the front of a leg running down along u

    // ---- the head has its own frame: u runs from the poll (0) to the tip of the nose (1), v is depth toward the jaw
    //      HL is its length, HD its depth.  A zebu's face: carried low, a flat brow, a short straight front and a broad
    //      muzzle, the nose rounded over and a little squared; the jaw full and deep behind the eye
    const poll = [0.585, -0.925], th = 0.7, HL = 0.475, HD = 1.1, hd = [Math.cos(th), Math.sin(th)], hn = [-Math.sin(th), Math.cos(th)];
    const H = (u, v) => [poll[0] + hd[0] * u * HL + hn[0] * v * HD, poll[1] + hd[1] * u * HL + hn[1] * v * HD];

    // ---- the silhouette, in parts: back and hump, head, dewlap, belly, rump
    const TOP = [[-0.606, -0.86], [-0.56, -0.884], [-0.49, -0.9], [-0.43, -0.905], [-0.36, -0.893], [-0.25, -0.878], [-0.12, -0.871], [0.0, -0.875], [0.062, -0.884],
      [0.1, -0.9], [0.09, -0.97], [0.095, -1.04], [0.113, -1.097], [0.148, -1.133], [0.196, -1.145], [0.246, -1.124], [0.288, -1.07], [0.32, -1.004], [0.35, -0.946], [0.388, -0.9], [0.44, -0.877], [0.49, -0.875], [0.535, -0.893]];
    // a short deep face, the way the old painters drew cattle: a broad brow, a square muzzle, a full jaw
    const HEAD = [H(0, -0.004), H(0.1, -0.02), H(0.2, -0.024), H(0.34, -0.016), H(0.5, -0.007), H(0.64, -0.001), H(0.76, 0.006), H(0.86, 0.018), H(0.93, 0.038), H(0.975, 0.068),
      H(0.997, 0.104), H(0.99, 0.138), H(0.96, 0.164), H(0.91, 0.178), H(0.85, 0.182), H(0.79, 0.174), H(0.72, 0.176), H(0.6, 0.194), H(0.48, 0.218), H(0.38, 0.242), H(0.3, 0.26)];
    // the dewlap: a soft curtain of skin that hangs from the throat and swells forward over the brisket
    const DEW = [[0.548, -0.61], [0.57, -0.566], [0.59, -0.515], [0.602, -0.46], [0.6, -0.408], [0.582, -0.366], [0.546, -0.338], [0.498, -0.326], [0.448, -0.333], [0.408, -0.357], [0.378, -0.392]];
    const UNDER = [[0.355, -0.418], [0.3, -0.408], [0.2, -0.394], [0.08, -0.384], [-0.05, -0.383], [-0.17, -0.393], [-0.27, -0.418], [-0.34, -0.456], [-0.39, -0.505]];
    const REAR = [[-0.45, -0.49], [-0.55, -0.48], [-0.625, -0.53], [-0.664, -0.61], [-0.678, -0.7], [-0.668, -0.78], [-0.642, -0.835]];
    const sil = sp(TOP.concat(HEAD, DEW, UNDER, REAR), true, 0.7);
    // the trunk alone (no neck, no dewlap): the lines of the near legs stop where they go into it
    const trunk = sp(TOP.filter(p => p[0] < 0.33).concat([[0.37, -0.8], [0.395, -0.66], [0.405, -0.53], [0.39, -0.45]], UNDER, REAR), true, 1.2);

    // ---- a leg from its joints J = [top (inside the body), knee or hock, fetlock, coronet], in bull units
    function limb(J, kind, W) {
      const T0 = J[0], K = J[1], F = J[2], C = J[3];
      const u1 = nrm([K[0] - T0[0], K[1] - T0[1]]), u2 = nrm([F[0] - K[0], F[1] - K[1]]), u3 = nrm([C[0] - F[0], C[1] - F[1]]);
      const n1 = fN(u1), n2 = fN(u2), n3 = fN(u3), nK = nrm([n1[0] + n2[0], n1[1] + n2[1]]), nF = nrm([n2[0] + n3[0], n2[1] + n3[1]]);
      let front, back;
      if (kind === 'fore') {
        front = [add(T0, n1, W.top), add(lp(T0, K, 0.3), n1, W.arm), add(lp(T0, K, 0.72), n1, W.arm * 0.7), add(add(K, u1, -0.024), nK, W.knee), add(add(K, u2, 0.03), n2, W.knee * 0.84),
          add(lp(K, F, 0.58), n2, W.can), add(add(F, u2, -0.012), nF, W.fet), add(lp(F, C, 0.55), n3, W.pas), add(C, n3, W.cor)];
        back = [add(C, n3, -W.cor), add(lp(F, C, 0.42), n3, -W.pas), add(add(F, u2, 0.004), nF, -W.fet * 1.15), add(lp(K, F, 0.6), n2, -W.can),
          add(add(K, u2, 0.028), n2, -W.knee * 0.98), add(add(K, u1, -0.04), n1, -W.knee * 0.78), add(lp(T0, K, 0.5), n1, -W.arm * 0.78), add(lp(T0, K, 0.16), n1, -W.arm * 1.05), add(T0, n1, -W.top)];
      } else {
        front = [add(T0, n1, W.top), add(lp(T0, K, 0.3), n1, W.arm), add(lp(T0, K, 0.72), n1, W.arm * 0.6), add(K, nK, W.knee),
          add(lp(K, F, 0.5), n2, W.can), add(add(F, u2, -0.012), nF, W.fet), add(lp(F, C, 0.55), n3, W.pas), add(C, n3, W.cor)];
        back = [add(C, n3, -W.cor), add(lp(F, C, 0.42), n3, -W.pas), add(add(F, u2, 0.004), nF, -W.fet * 1.15), add(lp(K, F, 0.45), n2, -W.can),
          add(add(K, u2, 0.035), n2, -W.can * 1.12), add(add(K, u1, -0.022), nK, -W.hock), add(add(K, u1, -0.08), n1, -W.ach), add(lp(T0, K, 0.42), n1, -W.arm * 1.08), add(T0, n1, -W.top)];
      }
      const fr = sp(front, false, 0.5), bk = sp(back, false, 0.5);
      return { poly: fr.concat(bk), front: fr, back: bk, J, kind, W, u1, u2, u3, n1, n2, n3, nF };
    }
    // the hoof: a dark cloven wedge.  planted: the sole lies on the ground; lifted: it hangs from the pastern
    function hoof(Lg, planted, c) {
      const C = Lg.J[3], W = Lg.W, u3 = Lg.u3, n3 = Lg.n3;
      const cf = add(C, n3, W.cor * 1.02), cb = add(C, n3, -W.cor);
      let pts;
      if (planted) {
        const toe = [cf[0] + 0.036, -0.002], heel = [cb[0] - 0.006, -0.004];
        pts = [cf, lp(cf, toe, 0.55), toe, lp(toe, heel, 0.5), heel, [cb[0] - 0.012, (cb[1] + heel[1]) / 2], cb];
      } else {
        const toe = add(add(C, n3, W.cor + 0.024), u3, 0.05), heel = add(add(C, n3, -W.cor - 0.006), u3, 0.034);
        pts = [cf, lp(cf, toe, 0.55), toe, lp(toe, heel, 0.5), heel, add(cb, n3, -0.01), cb];
      }
      const hf = sp(pts, true, 0.4);
      A.fill([hf], 'pastel', c || A.mix('ash', 'kajal', 0.3), { w: Math.max(1, s * 0.02), p: 1, passes: 2, ang: P.dir(-1.2), reach: 1.4 });
      A.withMask(hf, () => A.stroke(sp([lp(cf, pts[2], 0.25), lp(cf, pts[2], 0.7)], false, 0.4), 'chalk', 'stone', { w: Math.max(0.6, s * 0.012), p: 0.45 }), 0);
      ink2(hf, { closed: true, w: lw * 0.9, again: 0 });
      // the cleft between the two claws
      const top = lp(cf, cb, 0.42), bot = lp(pts[2], pts[4], 0.3);
      A.stroke(sp([top, lp(top, bot, 0.5), bot], false, 0.4), 'chalk', A.mix('stone', 'ash', 0.3), { w: Math.max(0.5, s * 0.007), p: 0.75 });
      // the dewclaw behind the fetlock
      const F = Lg.J[2], dc = add(add(F, u3, 0.018), Lg.nF, -Lg.W.fet * 1.25);
      A.dot(P(dc[0], dc[1])[0], P(dc[0], dc[1])[1], 'kajal', A.mix('ash', 'kajal', 0.4), { w: Math.max(0.8, s * 0.016), len: s * 0.006, ang: P.dir(th), p: 0.9 });
    }
    // an anklet above the fetlock: red cord, a row of gold beads, little bells
    function anklet(Lg) {
      const K = Lg.J[1], F = Lg.J[2], u2 = Lg.u2, n2 = Lg.n2, w = Lg.W.can * 1.25, m = lp(K, F, 0.72);
      const a = P(...add(m, n2, w)), b = P(...add(m, n2, -w));
      A.stroke([a, lp(a, b, 0.5).map((v, i) => v + (i ? 0.25 : 0)), b], 'chalk', 'hingul', { w: Math.max(0.9, s * 0.022), p: 0.95, tin: 0, tout: 0 });
      A.stroke([a, b], 'gold', 'gold', { w: Math.max(0.5, s * 0.007), p: 0.9, tin: 0, tout: 0 });
      for (let k = 0; k <= 3; k++) {
        const q = P(...add(add(m, u2, 0.022), n2, w * (0.85 - k * 0.56)));
        A.dot(q[0], q[1], 'gold', 'gold', { w: Math.max(0.7, s * 0.012), p: 0.95 });
        A.dot(q[0] + 0.15, q[1] + Math.max(0.35, s * 0.004), 'kajal', 'sepia', { w: Math.max(0.35, s * 0.004), p: 0.7 });
      }
    }

    // the legs of a working bull: a heavy forearm and gaskin, broad flat knees and hocks, stout cannons and big fetlocks
    const LEGS = {
      farFore: limb([[0.29, -0.52], [0.287, -0.215], [0.3, -0.078], [0.32, -0.046]], 'fore', { top: 0.085, arm: 0.07, knee: 0.043, can: 0.031, fet: 0.037, pas: 0.028, cor: 0.031 }),
      farHind: limb([[-0.42, -0.58], [-0.452, -0.262], [-0.392, -0.13], [-0.37, -0.098]], 'hind', { top: 0.1, arm: 0.08, knee: 0.039, hock: 0.052, ach: 0.028, can: 0.031, fet: 0.037, pas: 0.028, cor: 0.031 }),
      nearHind: limb([[-0.53, -0.6], [-0.64, -0.268], [-0.712, -0.098], [-0.69, -0.05]], 'hind', { top: 0.11, arm: 0.088, knee: 0.041, hock: 0.058, ach: 0.03, can: 0.033, fet: 0.039, pas: 0.029, cor: 0.032 }),
      nearFore: limb([[0.37, -0.52], [0.54, -0.282], [0.505, -0.148], [0.478, -0.112]], 'fore', { top: 0.09, arm: 0.073, knee: 0.045, can: 0.032, fet: 0.038, pas: 0.029, cor: 0.032 })
    };

    // ---- 1. the tail, let down from the rump in a long gentle S, swinging a little back with the walk; it ends at the hocks
    //      in a black whisk of hair, tied with red thread and gold
    const tcl = sp([[-0.6, -0.858], [-0.648, -0.85], [-0.69, -0.81], [-0.712, -0.74], [-0.714, -0.66], [-0.71, -0.58], [-0.716, -0.5], [-0.732, -0.43], [-0.748, -0.385]], false, 0.6);
    const tr = ribbon(tcl, t => s * lerp(0.02, 0.0085, t));
    A.shape(tr, { c: farC, w: Math.max(1, s * 0.018), rough: 0.08, passes: 2, ang: P.dir(1.45) });
    A.withMask(tr, () => A.stroke(tr.R, 'side', cool, { w: s * 0.016, p: 0.5 }), 0);
    ink2(tr.L, { p: 0.75, w: lw * 0.85 }); ink2(tr.R, { p: 0.75, w: lw * 0.85 });
    // the switch: long dark hairs falling from the tie, thick at the root, spreading and parting toward the ends, the
    // tips swung back a little; every hair its own pull of the kajal, a few strays apart from the rest
    const root = [-0.748, -0.385], hair = [];
    for (let k = 0; k < 44; k++) {
      const stray = k >= 37, th0 = PI / 2 + (stray ? rr(-0.35, 0.55) : rr(-0.2, 0.32)), turn = stray ? rr(-0.1, 0.6) : rr(0.0, 0.42);
      const len = stray ? rr(0.07, 0.13) : rr(0.12, 0.2), M = 9, pts = [];
      let p = [root[0] + rr(-0.008, 0.008), root[1] + rr(-0.004, 0.008)], a = th0;
      pts.push(p);
      for (let i = 1; i <= M; i++) { a = th0 + turn * Math.pow(i / M, 1.4) + rr(-0.05, 0.05); p = [p[0] + Math.cos(a) * len / M, p[1] + Math.sin(a) * len / M]; pts.push(p); }
      hair.push({ pts: P.all(pts), stray });
    }
    // the mass of it near the root, laid first with the side of a dark stick
    for (const h of hair.slice(0, 10)) A.stroke(h.pts.slice(0, 6), 'side', A.mix('ash', 'kajal', 0.45), { w: s * rr(0.02, 0.03), p: rr(0.38, 0.52), tin: 0, tout: 0.6 });
    for (const h of hair) A.stroke(h.pts, 'kajal', pick(['kajal', A.mix('kajal', 'ash', 0.3), 'kajal', A.mix('kajal', 'sepia', 0.3), 'ash']), { w: lw * (h.stray ? rr(0.35, 0.55) : rr(0.45, 0.95)), p: rr(0.6, 0.9), tin: 0, tout: rr(0.55, 0.85) });
    // tied at the root of the switch with red thread and gold
    const td = [Math.cos(PI / 2 + 0.25), Math.sin(PI / 2 + 0.25)], tp = [-td[1], td[0]], tc = [root[0] + td[0] * 0.008, root[1] + td[1] * 0.008];
    const tie = sg => P(tc[0] + tp[0] * 0.02 * sg, tc[1] + tp[1] * 0.02 * sg);
    A.stroke([tie(-1), tie(1)], 'chalk', 'hingul', { w: s * 0.02, p: 0.95, tin: 0, tout: 0 });
    A.stroke([tie(-1), tie(1)].map(q => [q[0] + td[0] * s * 0.008, q[1] + td[1] * s * 0.008]), 'gold', 'gold', { w: s * 0.008, p: 0.95, tin: 0, tout: 0 });

    // ---- 2. the far horn and the far legs, a shade cooler, a little apart from us
    const hb = H(0.05, -0.008);
    // a lyre, as the painters show it even on a beast in profile: the near horn sweeps back and up, the far one forward and up,
    // and both turn in at the tips toward each other
    const HCN = [[0, 0], [-0.028, -0.02], [-0.05, -0.05], [-0.06, -0.088], [-0.054, -0.122], [-0.036, -0.145], [-0.014, -0.156]];
    const HCF = [[0, 0], [0.026, -0.022], [0.044, -0.054], [0.05, -0.09], [0.042, -0.122], [0.024, -0.142], [0.004, -0.151]];
    const hornCL = (b, C) => sp(C.map(p => [b[0] + p[0], b[1] + p[1]]), false, 0.4);
    const hornFar = ribbon(hornCL([hb[0] + 0.036, hb[1] + 0.006], HCF), t => s * lerp(0.016, 0.0045, Math.pow(t, 0.85)));
    A.shape(hornFar, { c: A.mix('hingul', 'lac', 0.45), w: Math.max(1, s * 0.018), rough: 0.06, passes: 2 });
    for (const k of ['farHind', 'farFore']) {
      const Lg = LEGS[k];
      A.shape(Lg.poly, { c: farC, w: Math.max(1.4, s * 0.026), rough: 0.1, passes: 2, ang: P.dir(1.45) });
      A.withMask(Lg.poly, () => { A.stroke(Lg.back.slice(Math.floor(Lg.back.length * 0.1)), 'side', cool2, { w: s * 0.03, p: 0.45 }); A.stroke(Lg.front.slice(Math.floor(Lg.front.length * 0.45)), 'side', cool, { w: s * 0.016, p: 0.35 }); }, 0);
      const k0 = Math.floor(Lg.front.length * 0.3), k1 = Math.floor(Lg.back.length * 0.68);
      ink2(Lg.front.slice(k0), { p: 0.72, w: lw * 0.9 }); ink2(Lg.back.slice(0, k1), { p: 0.72, w: lw * 0.9 });
      hoof(Lg, k === 'farFore', A.mix('ash', 'slate', 0.3));
      anklet(Lg);
    }

    // ---- 3. the body in one piece with the near legs, laid in warm white
    const nearL = [LEGS.nearHind.poly, LEGS.nearFore.poly];
    A.shape(sil, { c: hide, w: Math.max(3, s * 0.06), rough: 0.25, passes: 2, ang: P.dir(-0.2) });
    for (const pl of nearL) A.shape(pl, { c: hide, w: Math.max(1.5, s * 0.03), rough: 0.1, passes: 2, ang: P.dir(1.4) });
    const body = [sil].concat(nearL);

    // ---- 4. modelling: the cool grey-blue of shadow pressed into every hollow, the warmth of the light on every top, rubbed in
    const sh = (cp, w, p, c) => A.stroke(sp(cp, false, 1), 'side', c || cool, { w: s * w, p });
    A.withMask(body, () => {
      sh([[0.36, -0.43], [0.2, -0.41], [0.0, -0.4], [-0.2, -0.414], [-0.34, -0.47]], 0.1, 0.72);                   // under the belly, the barrel turning away
      sh([[0.3, -0.47], [0.1, -0.45], [-0.12, -0.452], [-0.3, -0.5]], 0.07, 0.4);
      sh([[-0.648, -0.83], [-0.67, -0.72], [-0.658, -0.62], [-0.62, -0.54]], 0.07, 0.66);                           // the back of the thigh
      sh([[-0.31, -0.76], [-0.335, -0.64], [-0.37, -0.53]], 0.06, 0.52);                                              // the flank in front of the stifle
      sh([[0.24, -0.82], [0.25, -0.68], [0.27, -0.5]], 0.065, 0.5);                                                   // behind the shoulder
      sh([[0.108, -0.9], [0.1, -0.975], [0.112, -1.06], [0.148, -1.112]], 0.056, 0.62, cool2);
      sh([[0.13, -0.91], [0.126, -0.99], [0.142, -1.07]], 0.05, 0.5);                            // the back wall of the hump, turned from the sun
      sh([[0.108, -0.905], [0.17, -0.92], [0.24, -0.922], [0.3, -0.912]], 0.04, 0.55, cool2);                                      // the seat of the hump on the withers
      sh([[0.15, -0.96], [0.158, -1.04], [0.186, -1.095]], 0.04, 0.3);
      sh([[0.296, -1.04], [0.332, -0.962], [0.375, -0.905]], 0.04, 0.55);                                                 // the front of the hump into the neck
      sh([[0.4, -0.86], [0.42, -0.74], [0.43, -0.6], [0.41, -0.48]], 0.06, 0.5);                                      // where the neck meets the shoulder
      sh([[-0.1, -0.62], [0.05, -0.6], [0.2, -0.61]], 0.08, 0.16);                                                    // the round of the barrel, just breathed on
      sh([H(0.34, 0.235), H(0.5, 0.205), H(0.7, 0.172), H(0.84, 0.172)], 0.034, 0.58);                                 // under the jaw
      sh([[0.57, -0.58], [0.592, -0.52], [0.6, -0.46], [0.594, -0.405], [0.568, -0.36], [0.5, -0.334], [0.43, -0.343]], 0.05, 0.62);   // the hem of the dewlap
      for (let k = 0; k < 3; k++) sh([[0.552 - k * 0.026, -0.578], [0.564 - k * 0.026, -0.53], [0.568 - k * 0.026, -0.478], [0.558 - k * 0.026, -0.418], [0.536 - k * 0.026, -0.37]], 0.017, 0.46 - k * 0.08, cool2);   // the hollows between its folds
      sh([[0.452, -0.56], [0.49, -0.472], [0.526, -0.398]], 0.03, 0.5, cool2);                                        // the shadow of the near foreleg on it
      sh([[0.5, -0.71], [0.49, -0.64], [0.47, -0.56]], 0.04, 0.4);                                                    // a fold in the dewlap
      sh([H(0.4, 0.17), H(0.52, 0.13), H(0.64, 0.105)], 0.036, 0.42);                                                   // the cheek
      sh([H(0.18, 0.07), H(0.31, 0.1), H(0.44, 0.085)], 0.03, 0.5, cool2);                                            // the hollow under the eye
      for (const Lg of [LEGS.nearHind, LEGS.nearFore]) A.stroke(Lg.back.slice(Math.floor(Lg.back.length * 0.05), Math.floor(Lg.back.length * 0.85)), 'side', cool, { w: s * 0.036, p: 0.58 });
      // warmth on the tops: the back, the crown of the hump, the crest of the neck, the brow and the face
      sh([[-0.6, -0.85], [-0.4, -0.875], [-0.15, -0.852], [0.05, -0.858]], 0.05, 0.4, warm);
      sh([[0.152, -1.1], [0.2, -1.118], [0.255, -1.098]], 0.035, 0.46, warm);
      sh([[0.36, -0.885], [0.45, -0.862], [0.53, -0.875]], 0.035, 0.38, warm);
      sh([H(0.1, 0.015), H(0.5, 0.018), H(0.85, 0.02)], 0.026, 0.35, warm);
      A.blend(body, { r: Math.max(2.2, s * 0.032), k: 0.32, ang: P.dir(-0.15), len: s * 0.45 });
      // the muzzle: square, a dusky pink a shade darker than the face, the nose pad greyer still
      const muz = sp([H(0.78, 0.008), H(0.86, 0.019), H(0.93, 0.039), H(0.975, 0.069), H(0.996, 0.104), H(0.989, 0.137), H(0.96, 0.163), H(0.91, 0.176), H(0.85, 0.18), H(0.79, 0.168), H(0.77, 0.1)], true, 0.3);
      A.fill(muz, 'pastel', A.mix(A.mix('gulabi', 'khadi', 0.4), 'stone', 0.26), { w: s * 0.024, p: 0.88, passes: 2, ang: P.dir(th + 1.2) });
      A.stroke(sp([H(0.945, 0.048), H(0.982, 0.08), H(0.988, 0.122)], false, 0.4), 'side', A.mix('gulabi', 'ash', 0.5), { w: s * 0.03, p: 0.6 });
      A.stroke(sp([H(0.84, 0.172), H(0.91, 0.172), H(0.965, 0.156)], false, 0.4), 'side', A.mix('stone', 'ash', 0.4), { w: s * 0.018, p: 0.42 });   // under the chin
      A.blend(muz, { r: 1.6, k: 0.4, ang: P.dir(th), len: s * 0.08 });
      // light: a line of khadi along the back, on the hump and down the front of the face
      A.stroke(sp([[-0.58, -0.857], [-0.35, -0.868], [-0.1, -0.853], [0.05, -0.862]], false, 1), 'chalk', 'khadi', { w: s * 0.02, p: 0.7, tin: 0.2, tout: 0.3 });
      A.stroke(sp([[0.138, -1.11], [0.195, -1.13], [0.248, -1.112], [0.29, -1.062]], false, 1), 'chalk', 'khadi', { w: s * 0.022, p: 0.75, tin: 0.2, tout: 0.4 });
      A.stroke(sp([H(0.12, 0.012), H(0.4, 0.014), H(0.7, 0.014)], false, 1), 'chalk', 'khadi', { w: s * 0.014, p: 0.6, tin: 0.2, tout: 0.4 });
    }, 0);

    // ---- 5. the painted marks of the festival: rosettes on the haunch, the shoulder and the hump, a line of dots up the neck
    for (const q of [[-0.565, -0.7, 0.03], [-0.6, -0.6, 0.016], [0.222, -0.7, 0.028], [0.3, -0.6, 0.016], [0.198, -1.07, 0.022]]) { const c = P(q[0], q[1]); rosette(A, c[0], c[1], s * q[2]); }
    for (const q of A.along(sp([[0.36, -0.86], [0.38, -0.76], [0.4, -0.66]], false, 0.5), s * 0.03, 0)) A.dot(q.x, q.y, 'chalk', q.i % 2 ? 'haldi' : 'hingul', { w: Math.max(0.7, s * 0.012), p: 0.9 });

    // ---- 6. the contour: one wiry line round the whole beast, a hair off register, never across a near leg
    A.pushMaskOutside(nearL);
    const ox = rr(-0.3, 0.3), oy = rr(-0.3, 0.3);
    ink2(sil.map(p => [p[0] + ox, p[1] + oy]), { closed: true });
    A.popMask();
    for (const Lg of [LEGS.nearHind, LEGS.nearFore]) for (const e of [Lg.front, Lg.back]) for (const r of openRuns(e, sil)) ink2(r);
    // inner lines, light: the shoulder, the stifle, the seat of the hump, the folds of the neck and dewlap
    const il = (cp, p, w) => ink2(sp(cp, false, 0.8), { p, w: lw * (w || 0.75), again: 0 });
    il([[0.345, -0.86], [0.37, -0.74], [0.375, -0.62], [0.36, -0.52]], 0.32);
    il([[-0.33, -0.7], [-0.36, -0.6], [-0.39, -0.52]], 0.4);
    il([[-0.47, -0.87], [-0.46, -0.84]], 0.35);
    A.pushMaskOutside([LEGS.nearFore.poly]);
    // three soft folds, each following the swell of the hem, the front one fullest
    il([[0.57, -0.585], [0.586, -0.54], [0.594, -0.49], [0.591, -0.438], [0.573, -0.392], [0.545, -0.36], [0.508, -0.343]], 0.68, 0.95);
    il([[0.545, -0.592], [0.56, -0.548], [0.566, -0.5], [0.562, -0.45], [0.546, -0.408], [0.52, -0.378]], 0.58, 0.85);
    il([[0.52, -0.596], [0.531, -0.555], [0.535, -0.51], [0.53, -0.466], [0.514, -0.428]], 0.46, 0.72);
    A.popMask();
    // the front of the near foreleg, drawn on down over the dewlap so the leg stands in front of it
    { const fr = LEGS.nearFore.front, run = []; for (const p of fr) { if (A.inside([trunk], p[0], p[1])) { if (run.length) break; continue; } if (!A.inside([sil], p[0], p[1])) break; run.push(p); }
      if (run.length > 2) A.stroke(run, 'kajal', line, { w: lw * 0.85, p: 0.72, tin: 0.35, tout: 0 }); }
    il([[0.112, -0.906], [0.2, -0.926], [0.3, -0.92], [0.362, -0.902]], 0.3, 0.65);   // where the hump sits on the shoulders
    il([H(0.12, 0.09), H(0.14, 0.15), H(0.19, 0.2), H(0.26, 0.238), H(0.34, 0.252)], 0.5, 0.8);   // the back of the jaw, so the head sits clear of the neck
    // the folds of the neck, curved round from the throat toward the crest, as the old painters draw them in a grey line
    for (let k = 0; k < 2; k++) il([[0.512 - k * 0.036, -0.69 + k * 0.012], [0.488 - k * 0.036, -0.75 + k * 0.004], [0.482 - k * 0.036, -0.805]], 0.26 - k * 0.04, 0.6);

    // ---- 7. the saddle cloth: red sown with white flowers, a border of yellow and gold, a fringe of tassels flying back
    const CLOTH = [[0.075, -0.894], [-0.06, -0.879], [-0.2, -0.876], [-0.33, -0.891], [-0.452, -0.914], [-0.47, -0.82], [-0.484, -0.7], [-0.51, -0.584], [-0.38, -0.564], [-0.2, -0.555], [-0.02, -0.56], [0.106, -0.576], [0.113, -0.7], [0.1, -0.82]];
    const cloth = sp(CLOTH, true, 0.8);
    const clothR = A.shape(cloth, { c: 'hingul', w: Math.max(2, s * 0.04), rough: 0.15, passes: 2, ang: P.dir(-0.15) });
    const ins = (k) => sp(CLOTH.map(p => [p[0] + (p[0] < -0.2 ? k : p[0] > 0 ? -k : 0) * 0.9, p[1] + (p[1] < -0.85 ? k : p[1] > -0.6 ? -k : 0)]), true, 0.8);
    const field = ins(0.042), mid = ins(0.022);
    A.withMask(clothR, () => {
      A.stroke(sp([[-0.48, -0.62], [-0.2, -0.59], [0.1, -0.61]], false, 1), 'side', 'lac', { w: s * 0.06, p: 0.5 });
      A.stroke(sp([[-0.47, -0.66], [-0.49, -0.86]], false, 1), 'side', 'lac', { w: s * 0.04, p: 0.4 });
      A.stroke(sp([[-0.42, -0.86], [-0.2, -0.85], [0.05, -0.86]], false, 1), 'side', A.mix('hingul', 'sindoor', 0.5), { w: s * 0.04, p: 0.45 });
      A.blend(clothR, { r: 2, k: 0.25, ang: P.dir(0), len: s * 0.3 });
      let row = 0;
      for (let v = -0.81; v < -0.6; v += 0.058, row++) for (let u = -0.43 + (row % 2) * 0.045; u < 0.08; u += 0.09) {
        const q = P(u + rr(-0.005, 0.005), v + rr(-0.005, 0.005));
        if (!A.inside([field], q[0], q[1])) continue;
        bloom(A, q[0], q[1], s * 0.016, 'khadi', 'haldi', 4);
        const g = P(u + 0.045, v + 0.029); if (A.inside([field], g[0], g[1])) A.dot(g[0], g[1], 'gold', 'gold', { w: Math.max(0.6, s * 0.01) });
      }
    }, 0);
    A.outline(mid, 'chalk', 'haldi', { closed: true, w: Math.max(1, s * 0.024), p: 0.95, pull: 40 });
    for (const q of A.along(mid.concat([mid[0]]), s * 0.028, 0.1)) A.dot(q.x, q.y, 'chalk', 'hingul', { w: Math.max(0.55, s * 0.009), p: 0.9 });
    A.outline(field, 'gold', 'gold', { closed: true, w: Math.max(0.7, s * 0.01), p: 0.95, pull: 40 });
    A.outline(clothR, 'gold', 'gold', { closed: true, w: Math.max(0.7, s * 0.011), p: 0.95, pull: 40 });
    ink2(clothR, { closed: true, w: lw * 0.8, p: 0.65 });
    for (let i = 0; i <= 9; i++) {          // tassels along the hem, swung back by the stride
      const t = i / 9, u = lerp(-0.5, 0.1, t), v = lerp(-0.578, -0.572, t) + 0.012 * Math.sin(t * PI), q = P(u, v), q2 = P(u - 0.03, v + 0.052);
      A.stroke([q, q2], 'chalk', i % 2 ? 'haldi' : 'gold', { w: Math.max(0.6, s * 0.01), p: 0.95, tin: 0, tout: 0.4 });
      A.dot(q2[0], q2[1], 'chalk', i % 2 ? 'hingul' : 'saffron', { w: Math.max(0.9, s * 0.02), p: 0.95 });
    }
    const g0 = P(0.108, -0.578), g1 = P(0.118, -0.405);   // the girth, red and gold, under the belly
    A.stroke([g0, g1], 'chalk', 'hingul', { w: s * 0.026, p: 0.95, tin: 0, tout: 0 }); A.stroke([g0, g1], 'gold', 'gold', { w: s * 0.008, p: 0.9, tin: 0, tout: 0 });

    // ---- 8. the near legs: hooves, anklets
    hoof(LEGS.nearHind, true); hoof(LEGS.nearFore, false);
    anklet(LEGS.nearHind); anklet(LEGS.nearFore);

    // ---- 9. the strap of brass bells behind the jaw
    const strap = sp([[0.478, -0.892], [0.486, -0.83], [0.498, -0.77], [0.513, -0.712]], false, 0.5);
    A.stroke(strap, 'chalk', 'hingul', { w: s * 0.034, p: 0.95, tin: 0, tout: 0 });
    A.stroke(strap.map(p => [p[0] - s * 0.012, p[1]]), 'gold', 'gold', { w: s * 0.006, p: 0.85, tin: 0, tout: 0 });
    A.stroke(strap.map(p => [p[0] + s * 0.012, p[1]]), 'gold', 'gold', { w: s * 0.006, p: 0.85, tin: 0, tout: 0 });
    for (const q of A.along(strap, s * 0.026, 0)) if (q.i > 0 && q.i < q.n - 1) A.dot(q.x, q.y, 'chalk', 'khadi', { w: s * 0.008, p: 0.9 });
    for (const t of [0.3, 0.62]) { const q = strap[Math.floor(t * (strap.length - 1))]; bell(A, q[0] + s * 0.008, q[1] + s * 0.032, s * 0.022, P.dir(PI / 2 + 0.25) - PI / 2); }
    const sb = strap[strap.length - 1]; bell(A, sb[0] + s * 0.006, sb[1] + s * 0.056, s * 0.04, P.dir(PI / 2 + 0.3) - PI / 2);

    // ---- 10. the ear, set out sideways under the horn, its inside pink
    const eb = H(0.06, 0.062), ea = P.dir(PI - 0.26), eca = Math.cos(ea), esa = Math.sin(ea);
    const ebs = P(eb[0], eb[1]), EAR = (u, v) => [ebs[0] + (u * eca - v * esa) * s * 1.14, ebs[1] + (u * esa + v * eca) * s * 1.14];
    const ear = A.spline([EAR(-0.01, -0.012), EAR(0.03, -0.026), EAR(0.08, -0.03), EAR(0.125, -0.02), EAR(0.16, -0.002), EAR(0.168, 0.006), EAR(0.14, 0.016), EAR(0.09, 0.026), EAR(0.04, 0.022), EAR(-0.01, 0.012)], true, 0.5);
    const earR = A.shape(ear, { c: A.mix(hide, cool, 0.3), w: Math.max(1, s * 0.02), rough: 0.06, passes: 2 });
    A.withMask(earR, () => {
      A.stroke([EAR(0.02, -0.004), EAR(0.07, -0.004), EAR(0.12, -0.002), EAR(0.15, 0.002)], 'chalk', A.mix('gulabi', 'rose', 0.35), { w: s * 0.024, p: 0.85, tin: 0.1, tout: 0.5 });
      A.stroke([EAR(0.03, 0.018), EAR(0.09, 0.02), EAR(0.14, 0.012)], 'side', cool2, { w: s * 0.012, p: 0.5 });
    }, 0);
    const eo = earR.slice(Math.floor(earR.length * 0.04), Math.floor(earR.length * 0.96));
    ink2(eo, { w: lw * 0.85, again: 0 });

    // ---- 11. the near horn: red to a gold cap, rings of gold, a tassel at the tip
    const horn = ribbon(hornCL(hb, HCN), t => s * lerp(0.018, 0.0045, Math.pow(t, 0.85)));
    A.shape(horn, { c: 'hingul', w: Math.max(1, s * 0.018), rough: 0.06, passes: 2 });
    for (const hr of [hornFar, horn]) {
      const n = hr.L.length, cap = hr.L.slice(Math.floor(n * 0.7)).concat(hr.R.slice(Math.floor(n * 0.7)).reverse());
      A.withMask(hr, () => { A.stroke(hr.R, 'side', 'lac', { w: s * 0.014, p: 0.5 }); A.stroke(hr.L.slice(0, Math.floor(n * 0.6)), 'chalk', A.mix('hingul', 'peach', 0.4), { w: s * 0.006, p: 0.6 }); }, 0);
      A.shape(cap, { c: 'gold', tool: 'chalk', w: Math.max(0.8, s * 0.012), rough: 0.04, passes: 2 });
      for (const t of [0.16, 0.44]) { const m = Math.floor(n * t); A.stroke([hr.L[m], hr.R[m]], 'gold', 'gold', { w: Math.max(0.7, s * 0.01), p: 0.95, tin: 0, tout: 0 }); }
      ink2(hr.L, { p: 0.8, w: lw * 0.85, again: 0 }); ink2(hr.R, { p: 0.8, w: lw * 0.85, again: 0 });
      const tip = [(hr.L[n - 1][0] + hr.R[n - 1][0]) / 2, (hr.L[n - 1][1] + hr.R[n - 1][1]) / 2];
      A.dot(tip[0], tip[1], 'gold', 'gold', { w: s * 0.014 });
    }
    // a red pompom on the poll between the horns, a gold medallion on the brow, a tilak of sindoor
    const pom = P(...H(0.04, -0.03)); A.dot(pom[0], pom[1], 'chalk', 'hingul', { w: s * 0.036 }); A.dot(pom[0] - 0.3, pom[1] - 0.4, 'chalk', 'sindoor', { w: s * 0.018 }); A.dot(pom[0], pom[1], 'gold', 'gold', { w: s * 0.01 });
    const med = P(...H(0.17, 0.012)); A.dot(med[0], med[1], 'gold', 'gold', { w: s * 0.022 }); A.dot(med[0], med[1], 'chalk', 'hingul', { w: s * 0.009 });
    A.stroke([P(...H(0.2, 0.004)), P(...H(0.26, 0.006))], 'chalk', 'sindoor', { w: s * 0.012, p: 0.9 });

    // ---- 12. the eye, as a Mewar painter sets it in a profile: a long almond, the upper lid arched and the lower nearly
    //      straight, both corners drawn to a point; a small dark iris near the front corner looking ahead up the hill;
    //      the kajal run on past the back corner toward the ear; a soft pale lid line above; one speck of light.  No lashes.
    const ec = P(...H(0.31, 0.078)), eA = P.dir(th + 0.06), ca = Math.cos(eA), sa = Math.sin(eA), ER = (u, v) => [ec[0] + (u * ca - v * sa) * s * 0.95, ec[1] + (u * sa + v * ca) * s * 0.95];
    A.stroke(A.spline([ER(-0.074, 0.002), ER(-0.03, -0.03), ER(0.024, -0.031), ER(0.07, -0.004)], false, 0.3), 'side', cool2, { w: s * 0.016, p: 0.34 });   // the socket, just breathed in
    const eye = A.spline([ER(-0.072, 0.003), ER(-0.044, -0.0145), ER(-0.006, -0.0215), ER(0.034, -0.0145), ER(0.066, 0.004), ER(0.036, 0.0105), ER(-0.01, 0.0118), ER(-0.05, 0.0088)], true, 0.2);
    A.fill([eye], 'chalk', A.mix('khadi', 'cream', 0.3), { w: s * 0.012, p: 1, passes: 2 });
    A.withMask(eye, () => {
      const ir = ER(0.022, -0.003);
      A.dot(ir[0], ir[1], 'chalk', A.mix('sepia', 'umber', 0.25), { w: s * 0.028 });
      A.dot(ir[0] + s * 0.003, ir[1], 'kajal', 'kajal', { w: s * 0.017 });
      A.dot(ir[0] + s * 0.007, ir[1] - s * 0.005, 'chalk', 'khadi', { w: Math.max(0.5, s * 0.0055), p: 0.85 });   // a speck of light on the wet of it
      A.stroke([ER(-0.066, -0.004), ER(-0.01, -0.016), ER(0.06, -0.006)], 'side', A.mix('stone', 'ash', 0.3), { w: s * 0.008, p: 0.42 });   // the lid's shadow on the ball
    }, 0);
    // the kajal: heavy along the upper lid, a hair along the lower, both meeting in points
    const up = eye.slice(0, Math.ceil(eye.length * 0.52)), lo = eye.slice(Math.floor(eye.length * 0.5)).concat([eye[0]]);
    A.stroke(up, 'kajal', 'kajal', { w: lw * 1.25, p: 0.92, tin: 0.12, tout: 0.18 });
    A.stroke(lo, 'kajal', 'kajal', { w: lw * 0.75, p: 0.8, tin: 0.15, tout: 0.1 });
    A.stroke([ER(-0.068, 0.002), ER(-0.094, 0.006), ER(-0.125, 0.0)], 'kajal', 'kajal', { w: lw * 1.1, p: 0.9, tin: 0, tout: 0.8 });     // drawn on toward the ear
    A.stroke(A.spline([ER(-0.06, -0.022), ER(-0.02, -0.034), ER(0.03, -0.029)], false, 0.3), 'chalk', A.mix('stone', 'sepia', 0.3), { w: lw * 0.6, p: 0.42, tin: 0.3, tout: 0.4 });   // the lid line, soft and pale

    // ---- 13. nostril and mouth; a halter strap across the face with gold studs
    const ns = P(...H(0.95, 0.078)), na = P.dir(th);
    A.stroke([[ns[0] - Math.cos(na) * s * 0.016, ns[1] - Math.sin(na) * s * 0.016 - s * 0.004], ns, [ns[0] + s * 0.002, ns[1] + s * 0.013]], 'kajal', 'kajal', { w: lw * 1.2, p: 0.9 });
    ink2(sp([H(0.978, 0.146), H(0.945, 0.156), H(0.9, 0.162)], false, 0.4), { w: lw * 0.75, p: 0.72, again: 0 });   // the mouth: a short closed line
    const hal = sp([H(0.66, -0.002), H(0.67, 0.088), H(0.68, 0.176)], false, 0.4);
    A.stroke(hal, 'chalk', 'hingul', { w: s * 0.02, p: 0.95, tin: 0, tout: 0 });
    for (const q of A.along(hal, s * 0.02, 0)) A.dot(q.x, q.y, 'gold', 'gold', { w: Math.max(0.55, s * 0.0085), p: 0.95 });

    // ---- 14. the marigold garland round the neck, swinging heavy over the dewlap; a long strand flying back
    const gl = sp([[0.352, -0.905], [0.37, -0.82], [0.398, -0.735], [0.438, -0.655], [0.488, -0.594], [0.548, -0.562]], false, 0.6);
    const GQ = A.along(gl, s * 0.026, s * 0.002);
    for (const q of GQ) if (A.chance(0.6)) leaf(A, q.x, q.y, q.ang + PI / 2 + rr(-0.5, 0.5) + (A.chance(0.5) ? PI : 0), s * 0.045, s * 0.018, pick(['malachite', 'sap', 'bottle']));
    for (const q of GQ) { const a = q.ang + PI / 2; marigold(A, q.x + Math.cos(a) * s * 0.01, q.y + Math.sin(a) * s * 0.01, s * rr(0.022, 0.027)); }
    for (const q of GQ) { const a = q.ang - PI / 2; if (q.i % 2) marigold(A, q.x + Math.cos(a) * s * 0.012, q.y + Math.sin(a) * s * 0.012, s * rr(0.019, 0.023)); }
    const fly = sp([[0.47, -0.6], [0.44, -0.56], [0.4, -0.54], [0.36, -0.535]], false, 0.6);      // a loose strand swinging back between the forelegs
    for (const q of A.along(fly, s * 0.028, s * 0.002)) marigold(A, q.x, q.y, s * rr(0.017, 0.021));
    const fe = fly[fly.length - 1];
    for (let k = 0; k < 4; k++) A.stroke([fe, [fe[0] - s * (0.03 + 0.01 * k), fe[1] + s * rr(0.02, 0.05)]], 'chalk', k % 2 ? 'gold' : 'haldi', { w: Math.max(0.6, s * 0.008), p: 0.9, tin: 0, tout: 0.5 });

    return { head: P(...H(0.5, 0.05)), hump: P(0.21, -1.07), tail: P(-0.76, -0.3), hind: P(-0.69, 0), fore: P(0.36, 0), garland: P(0.4, -0.75) };
  }

  /* THE HILLS: Mewar rock, built of tall tongues piled in tiers.  Every tongue is cut in a few flat facets: the lit face
     laid pale, the face in shadow pressed darker and hatched with the edge of the chalk, a ridge between them, a wiry contour. */
  // cut the corners of a polyline once, so the facets stay but no corner is sharper than a hand would make it
  function chaikin(p) { const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.78 + b[0] * 0.22, a[1] * 0.78 + b[1] * 0.22], [a[0] * 0.22 + b[0] * 0.78, a[1] * 0.22 + b[1] * 0.78]); } o.push(p[p.length - 1]); return o; }
  function tongue(A, T) {
    const rr = A.rr, x = T.x, yt = T.y, w = T.w, h = T.h, sd = T.sd || 1, ln = T.lean || 0, F = T.fam;
    // a finger of rock: the crown turned over in the first half-width, then the flanks fall nearly straight
    const pk = T.peak != null ? T.peak : rr(0.06, 0.12), lnAt = d => ln * Math.max(0, 1 - d / (w * 1.4));
    const flank = sg => [[0, pk], [0.1, rr(0.25, 0.3)], [0.28, rr(0.4, 0.45)], [0.62, rr(0.48, 0.51)], [1.25, rr(0.51, 0.54)]].filter(q => q[0] * w < h * 0.8)
      .map(q => [x + sg * w * q[1] + lnAt(q[0] * w), yt + q[0] * w]).concat([[x + sg * w * 0.56, yt + h]]);
    const L = flank(-1).reverse(), R = flank(1), cL = L[L.length - 1], cR = R[0];
    const edge = A.roughen(A.resample(chaikin(L.concat(R)), 1.5, false), Math.min(0.5, w * 0.008), 6, false);
    const poly = edge.concat([[x + w * 0.56, yt + h + 6], [x - w * 0.56, yt + h + 6]]);
    const c = A.vary(A.mix(A.pick(F.c), A.pick(F.c), rr(0, 0.6)), 0.022);
    A.fill(poly, 'pastel', c, { w: Math.max(4, w * 0.2), p: 1, reach: 1.6, passes: 2, ang: rr(-1.25, -0.85), cv: 0.02, gap: 0.5 });
    // the facet in shadow: from the crown down, between a ridge line and the shaded flank
    const sideP = sd > 0 ? R : L.slice().reverse(), top = sd > 0 ? cR : cL;
    const ridge = [[lerp(cL[0], cR[0], 0.5) + sd * w * 0.02, top[1] + w * 0.03], [x + sd * w * rr(0.08, 0.12) + lnAt(w * 0.3), yt + w * 0.32], [x + sd * w * rr(0.16, 0.2) + lnAt(w * 0.8), yt + w * 0.8], [x + sd * w * rr(0.2, 0.24), yt + Math.max(w * 1.3, h * 0.9)]];
    const facet = ridge.concat([[x + sd * w * 0.7, yt + h + 4]], sideP.slice(1).reverse().map(p => [p[0] + sd * 2, p[1]]));
    const shadeC = A.mix(c, F.fold, 0.4), deep = A.mix(c, F.fold, 0.78);
    A.withMask(poly, () => {
      A.fill(facet, 'side', shadeC, { w: Math.max(3, w * 0.14), p: 0.9, reach: 1.3, passes: 2, ang: rr(-1.45, -1.1), cv: 0.02 });
      // the striations: the rock's own contour said again inside it two or three times, each a step further in and down,
      // the way the strata of these hills run round them; broken where the chalk skipped, darker on the side in shadow
      const nst = T.soft ? 2 : w > 15 ? 3 : 2;
      for (let i = 1; i <= nst; i++) {
        const dy = w * (0.13 + 0.15 * (i - 1)) * rr(0.9, 1.1), k = 1 - (0.2 + 0.16 * (i - 1)) * rr(0.9, 1.1);
        const sl = edge.filter(p => p[1] - yt < w * (1.6 + 0.3 * i)).map(p => { const ax = x + lnAt(p[1] - yt); return [ax + (p[0] - ax) * k, p[1] + dy]; });
        for (let a = Math.floor(rr(0, 0.12) * sl.length); a < sl.length - 3;) {
          const e = Math.min(sl.length, a + Math.max(4, Math.floor(sl.length * rr(0.28, 0.6)))), run = sl.slice(a, e), shade = (run[run.length >> 1][0] - x) * sd > 0;
          A.stroke(run, 'chalk', A.mix(c, F.fold, shade ? 0.68 : 0.42), { w: rr(0.6, 0.85), p: rr(0.55, 0.75) * (T.soft ? 0.7 : 1), tin: 0.2, tout: 0.3 });
          a = e + Math.max(1, Math.floor(sl.length * rr(0.03, 0.1)));
        }
      }
      // contour hatching with the edge of the chalk, pressed hard at the flank and flicked off toward the ridge; each
      // stroke bends the way a cut across the rock would run, steep at the edge and flattening as it comes round
      const fl = A.resample(sideP, 1.9, false);
      for (let i = 1; i < fl.length - 1 && !T.soft; i++) {
        const p = fl[i], d0 = p[1] - yt; if (d0 > w * 2.2) break;
        const d = w * (0.11 + 0.15 * Math.min(1, d0 / (w * 0.6))) * rr(0.75, 1.15), drop = d * rr(0.3, 0.5);
        A.stroke([[p[0] + sd * 0.8, p[1] - 0.3], [p[0] - sd * d * 0.42, p[1] + drop * 0.72], [p[0] - sd * d, p[1] + drop]], 'chalk', A.chance(0.75) ? deep : F.fold, { w: rr(0.7, 1.0), p: rr(0.5, 0.8), tin: 0, tout: 0.65 });
      }
      // the lit face: a pale lip just inside the lit flank, a highlight on the crown, a second facet edge down the face
      const lit = (sd > 0 ? L.slice().reverse() : R).filter(p => p[1] - yt < w * 1.1);
      if (lit.length > 2) A.stroke(A.spline(lit.map(p => [p[0] + sd * w * 0.08, p[1] + 1.4]), false, 1), 'chalk', A.mix(c, F.lip, 0.65), { w: rr(1.5, 2.1), p: rr(0.7, 0.9), tin: 0.15, tout: 0.4 });
      A.stroke([[x - sd * w * 0.2 + ln * 0.8, yt + w * 0.12], [x + ln * 0.9, yt + w * 0.05]], 'chalk', A.mix(c, F.lip, 0.5), { w: rr(1.4, 2), p: 0.6, tin: 0.3, tout: 0.4 });
      if (w > 15) {
        const mx = x - sd * w * rr(0.16, 0.22) + lnAt(w * 0.5);
        A.stroke(A.spline([[mx, yt + w * 0.4], [mx - sd * w * 0.04, yt + w * 0.8], [mx - sd * w * 0.06, yt + w * 1.2]], false, 1), 'kajal', A.mix(F.fold, c, 0.3), { w: 0.6, p: 0.42, tin: 0.3, tout: 0.5 });
      }
      A.stroke(A.spline(ridge.slice(0, 3), false, 1), 'kajal', A.mix(F.fold, 'kajal', 0.25), { w: 0.75, p: T.soft ? 0.3 : 0.62, tin: 0.12, tout: 0.45 });
      A.blend([facet], { r: 1.5, k: 0.16, ang: -1.2, len: 9 });
      if (T.bush) {                                          // a sprig of green out of a crack
        const bx = x + rr(-0.25, 0.25) * w, by = yt + rr(0.5, 1.1) * w, n2 = A.ri(4, 6), a0 = -PI / 2 + rr(-0.3, 0.3);
        for (let k = 0; k < n2; k++) leaf(A, bx, by, a0 + (k / (n2 - 1) - 0.5) * 2.2, rr(2.4, 3.4), 1.05, A.pick([F.bush, 'bottle', F.bush]));
        if (A.chance(0.45)) A.dot(bx + rr(-1, 1), by - rr(2, 3), 'chalk', A.pick(['khadi', 'gulabi', 'haldi']), { w: 0.9, p: 0.9 });
      }
    }, 0);
    A.outline(edge.map(p => [p[0] + rr(-0.35, 0.35), p[1] + rr(-0.35, 0.35)]), 'kajal', F.line || 'kajal', { w: rr(0.85, 1.05) * (T.lw || 1), p: T.lp || 0.8, pull: rr(30, 50), again: 0.2 });
    return [(cL[0] + cR[0]) / 2, yt];
  }

  M.folioArt['dalal-street'] = function (A, b) {
    const rr = A.rr, pick = A.pick;
    const X = u => b.x0 + u * b.w, Y = v => b.y0 + v * b.h, U = x => (x - b.x0) / b.w;
    const fieldTop = x => Y(0.7 - 0.24 * U(x)) + 1.2 * Math.sin(x / 11);
    const bankTop = x => Y(0.975 - 0.22 * U(x)) + 0.9 * Math.sin(x / 17 + 2);
    const blueBot = x => Y(0.17) + 2 * Math.sin(x / 19 + 0.5);

    // ---- 1. the sky: a pale morning, deep blue at the top with a hem of curled white cloud
    const sky = band(b, () => b.y0 - 8, () => Y(0.78));
    A.ground(sky, A.mix('cream', 'khadi', 0.35), { w: 18, ang: -0.05, edge: 0, rub: 6, c2: A.mix('cream', 'khadi', 0.6) });
    A.withMask(sky, () => {
      // the morning laid in long level passes: pale blue under the cloud, cream, then warmth low over the hills
      const pass = (v0, v1, cols, p0, p1) => { for (let v = v0; v < v1; v += rr(0.018, 0.026)) { const t = (v - v0) / (v1 - v0); for (let x = X(-0.1) + rr(-30, 0); x < X(1.05); x += rr(70, 120)) { const L = rr(80, 130), y = Y(v) + rr(-0.8, 0.8); A.stroke([[x, y], [x + L * 0.5, y + rr(-0.6, 0.6)], [x + L, y + rr(-0.8, 0.8)]], 'side', pick(cols), { w: rr(5, 7), p: lerp(p0, p1, t) * rr(0.8, 1.1), tin: 0.3, tout: 0.3 }); } } };
      pass(0.17, 0.23, ['sky', A.mix('sky', 'ice', 0.5)], 0.38, 0.1);
      pass(0.21, 0.42, ['peach', A.mix('peach', 'haldi', 0.5), A.mix('haldi', 'cream', 0.4)], 0.12, 0.55);
      A.blend(sky, { r: 6, k: 0.35, ang: 0.02, len: 70 });
    }, 0);
    const blue = band(b, () => b.y0 - 8, blueBot);
    A.ground(blue, 'lapis', { w: 14, ang: 0.02, edge: 0.6, rub: 5, c2: A.mix('lapis', 'neel', 0.3) });
    A.withMask(blue, () => { for (let i = 0; i < 16; i++) { const x = X(rr(-0.1, 1)), y = Y(rr(-0.05, 0.08)), L = rr(30, 70); A.stroke([[x, y], [x + L, y + rr(-1, 1)]], 'side', pick(['neel', 'neel', 'night']), { w: rr(6, 11), p: rr(0.3, 0.5) }); } }, 0);
    M.cloudBand(A, [0, 0.2, 0.4, 0.6, 0.8, 1].map(u => [X(u * 1.12 - 0.06), blueBot(X(u * 1.12 - 0.06)) - 1]), 9, { side: 'bottom', c: A.mix('khadi', 'ice', 0.35), rim: 'khadi', shade: 'sky' });
    // the hand that laid the sky once set gold marks along the cloud here; they are laid now into nothing, so that every
    // later mark of this picture (the hills above all) falls exactly as before.  Small clouds take their place at the end.
    A.withMask([[[-999, -999], [-998, -999], [-998, -998]]], () => {
      for (const u of [0.06, 0.2, 0.36, 0.52, 0.66]) {
        const cx = X(u + rr(-0.015, 0.015)), cy = blueBot(cx) - rr(1, 3), r = rr(2.2, 3), a0 = rr(0, TAU), spr = [];
        for (let t = 0; t <= 1.0001; t += 0.05) { const a = a0 + t * TAU * 1.25, q = r * (1 - t * 0.75); spr.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.8]); }
        A.stroke(spr, 'gold', 'gold', { w: 0.9, p: 0.9, tin: 0.1, tout: 0.4 });
        A.stroke([[cx + r, cy], [cx + r + rr(5, 9), cy + rr(-0.6, 0.6)]], 'gold', 'gold', { w: 0.8, p: 0.85, tin: 0, tout: 0.6 });
      }
    });

    // ---- 2. the sun, high in the blue over the top step of the hills
    M.sun(A, X(0.925), Y(0.112), 10.5, { heat: false });

    // ---- 3. the hills: a far range in the cool of the morning, and in front of it five steps of faceted rock,
    //         each step a row of rock higher than the last, climbing from the left edge up to the sun
    // the families of rock keep the old painters' pinks, mauves and greens, but each is ground with a little earth (brick,
    // umber, olive, sand), so they read as stone in the sun and not as sweets
    const ea = (c, e, k) => A.mix(c, e, k);
    const FAM = {
      pink:  { c: [ea('pinkrock', 'brick', 0.2), ea(A.mix('pinkrock', 'peach', 0.3), 'ochre', 0.18), ea(A.mix('pinkrock', 'gulabi', 0.4), 'brick', 0.22)], fold: A.mix('lac', 'umber', 0.3), lip: A.mix('khadi', 'peach', 0.3), bush: 'sap' },
      mauve: { c: [ea('mauve', 'umber', 0.26), ea(A.mix('mauve', 'lilac', 0.4), 'sand', 0.3), ea(A.mix('mauve', 'pinkrock', 0.35), 'umber', 0.22)], fold: A.mix('plum', 'umber', 0.35), lip: A.mix('khadi', 'sand', 0.25), bush: 'sap' },
      stone: { c: [ea(A.mix('stone', 'lilac', 0.25), 'umber', 0.1), ea('stone', 'sand', 0.38), ea('stone', 'ochre', 0.12)], fold: A.mix('slate', 'umber', 0.4), lip: 'khadi', bush: 'malachite' },
      sage:  { c: [ea('sage', 'olive', 0.25), ea(A.mix('sage', 'leaf', 0.3), 'olive', 0.22), ea(A.mix('sage', 'verdigris', 0.35), 'sand', 0.2)], fold: A.mix('moss', 'umber', 0.2), lip: 'cream', bush: 'malachite' },
      teal:  { c: [ea(A.mix('teal', 'verdigris', 0.45), 'olive', 0.22), ea('verdigris', 'sand', 0.2), ea(A.mix('teal', 'sage', 0.35), 'olive', 0.18)], fold: A.mix(A.mix('teal', 'bottle', 0.55), 'umber', 0.15), lip: A.mix('ice', 'cream', 0.4), bush: 'malachite' },
      ochre: { c: [ea(A.mix('ochre', 'haldi', 0.4), 'umber', 0.12), ea(A.mix('sand', 'ochre', 0.45), 'brick', 0.08), ea(A.mix('haldi', 'cream', 0.3), 'ochre', 0.25)], fold: A.mix('brick', 'umber', 0.35), lip: 'cream', bush: 'sap' },
      far:   { c: [ea(A.mix('lilac', 'ice', 0.35), 'stone', 0.4), ea(A.mix('lilac', 'sky', 0.3), 'sand', 0.32), ea(A.mix('mauve', 'ice', 0.5), 'stone', 0.4)], fold: A.mix(A.mix('mauve', 'slate', 0.4), 'umber', 0.15), lip: 'khadi', bush: 'sage', line: A.mix('plum', 'slate', 0.45) }
    };
    const SEG = [   // u from, u to, crest v at its left, crest v at its right, family of the crown row, family of the rows under it
      [-0.06, 0.19, 0.505, 0.49, 'pink', 'mauve'], [0.19, 0.385, 0.425, 0.41, 'mauve', 'stone'], [0.385, 0.58, 0.35, 0.335, 'sage', 'teal'],
      [0.58, 0.775, 0.268, 0.252, 'teal', 'sage'], [0.775, 1.07, 0.192, 0.18, 'ochre', 'pink']
    ];
    const segOf = u => SEG.find(q => u < q[1]) || SEG[SEG.length - 1];
    const crestY = x => { const u = U(x), q = segOf(u); return Y(lerp(q[2], q[3], (u - q[0]) / (q[1] - q[0]))); };
    const farY = x => Math.max(Y(0.205), Math.min(crestY(x) - 12, Y(0.345 - 0.2 * U(x)) + 5 * Math.sin(x / 31 + 0.7) + 2.5 * Math.sin(x / 13 + 1)));

    // the far range: small pale tongues, a thin line, the dark between them only a lilac
    const farG = [];
    for (let x = b.x0 - 8; x <= b.x1 + 8; x += 4) farG.push([x, farY(x) + 6]);
    for (let x = b.x1 + 8; x >= b.x0 - 8; x -= 4) farG.push([x, crestY(x) + 12]);
    A.ground(farG, A.mix('mauve', 'slate', 0.25), { w: 10, edge: 0, rub: 0, top: 0 });
    const TF = [];
    for (let k = 0, y0 = Y(0.2); y0 < Y(0.52); k++, y0 += rr(9, 10.5)) {
      for (let x = b.x0 - 7 + (k % 2) * 6; x < b.x1 + 8; x += rr(12, 14)) {
        const y = y0 + rr(-1.2, 1.2);
        if (y < farY(x) - 1 || y > crestY(x) + 3) continue;
        TF.push({ x: x + rr(-1.5, 1.5), y, w: rr(12, 15), fam: FAM.far, sd: A.chance(0.85) ? -1 : 1, soft: true, peak: rr(0.05, 0.16), lean: rr(-0.8, 0.8), lp: 0.55, lw: 0.8, h: crestY(x) - y + 16 });
      }
    }
    TF.sort((p, q) => p.y - q.y);
    const farTrees = [];
    for (const t of TF) { const c = tongue(A, t); if (t.y < farY(t.x) + 3) farTrees.push(c); }
    // a few dark trees standing far off on the far crowns
    for (const u of [[0.06, 'cypress'], [0.25, 'mango'], [0.33, 'cypress']]) {
      let best = null; for (const c of farTrees) if (!best || Math.abs(c[0] - X(u[0])) < Math.abs(best[0] - X(u[0]))) best = c;
      if (best) smallTree(A, best[0], best[1] + 1.8, u[1] === 'cypress' ? rr(11, 13) : rr(7, 8), u[1], { c: A.mix('bottle', 'slate', 0.3), mid: A.mix('moss', 'slate', 0.3), leaf: A.mix('malachite', 'ice', 0.25), leaf2: 'sage', flower: null });
    }

    // the near range, step by step
    const T = [];
    SEG.forEach((q, si) => {
      const F1 = FAM[q[4]], F2 = FAM[q[5]], x0 = X(q[0]), x1 = X(q[1]);
      for (let k = 0; k < 9; k++) {
        let j = 0;
        for (let x = x0 + 8 + (k % 2) * 7.5; x < x1 - 3; x += rr(13, 16.5), j++) {
          const y = crestY(x) + k * 12.2 + (k ? rr(-2.4, 2.4) : rr(-1.2, 1.2));
          if (y > fieldTop(x) - 1) continue;
          T.push({ x: x + rr(-1.2, 1.2), y, w: rr(13, 18.5), fam: k === 0 ? F1 : (k + j) % 2 ? F2 : F1, sd: A.chance(0.85) ? -1 : 1, peak: rr(0.04, 0.15), lean: rr(-1, 1), crown: k === 0, bush: k > 0 && A.chance(0.22) });
        }
      }
    });
    for (const t of T) t.h = fieldTop(t.x) - t.y + 10;
    // small trees on the crowns, never behind the head and horns
    for (const tr of [[0.03, 'cypress'], [0.11, 'mango'], [0.3, 'mango'], [0.665, 'mango'], [0.745, 'cypress']]) {
      let best = null;
      for (const t of T) if (t.crown && (!best || Math.abs(t.x - X(tr[0])) < Math.abs(best.x - X(tr[0])))) best = t;
      if (best) { best.tree = tr[1]; best.bush = false; }
    }
    // the dark of the crevices under the whole range
    const crev = [];
    for (let x = b.x0 - 8; x <= b.x1 + 8; x += 4) crev.push([x, Math.min(crestY(x) + 7, fieldTop(x) - 2)]);
    for (let x = b.x1 + 8; x >= b.x0 - 8; x -= 4) crev.push([x, fieldTop(x) + 4]);
    A.ground(crev, A.mix('plum', 'maroon', 0.45), { w: 12, edge: 0, rub: 0, top: 0 });
    T.sort((p, q) => p.y - q.y);
    const trees = [];
    for (const t of T) { const c = tongue(A, t); if (t.tree) trees.push([c, t.tree]); }
    for (const c of trees) {
      const t = c[1], Ht = t === 'cypress' ? rr(17, 20) : rr(11, 13);
      smallTree(A, c[0][0] + rr(-1, 1), c[0][1] + 2.2, Ht, t, { c: 'bottle', mid: 'moss', leaf: 'malachite', leaf2: 'leaf', flower: t === 'mango' ? pick(['gulabi', 'khadi']) : null });
    }

    // ---- 4. the saffron field, laid with the side of the stick and rubbed in
    const field = band(b, fieldTop, () => b.y1 + 8);
    A.ground(field, 'saffron', { w: 18, ang: -0.12, c2: A.mix('saffron', 'sindoor', 0.18), edge: 0.8, rub: 6 });
    A.withMask(field, () => {
      for (let i = 0; i < 40; i++) { const x = X(rr(-0.1, 1.05)), y = Y(rr(0.45, 1.0)), L = rr(15, 40); A.stroke([[x, y], [x + L, y - L * 0.12]], 'side', pick(['sindoor', 'peori', 'haldi', 'saffron']), { w: rr(3, 7), p: rr(0.18, 0.32) }); }
      // the old way of sowing a ground: little tufts set down one by one
      for (const p of A.scatter(band(b, x => fieldTop(x) + 6, x => bankTop(x) - 3), 12, { jit: 0.45 })) {
        const n = A.ri(3, 5), h = rr(2.2, 3.4);
        for (let k = 0; k < n; k++) { const a = -PI / 2 + (k / (n - 1) - 0.5) * 1.4 + rr(-0.1, 0.1); A.stroke([[p[0], p[1]], [p[0] + Math.cos(a) * h, p[1] + Math.sin(a) * h]], 'chalk', pick(['moss', 'olive', 'sap']), { w: 0.55, p: rr(0.6, 0.85), tin: 0, tout: 0.6 }); }
      }
      // and the field flowers among them, in loose drifts, small with the distance
      flowerDrifts(A, A.scatter(band(b, x => fieldTop(x) + 5, x => bankTop(x) - 2), 6.5, { jit: 0.5 }), {
        kinds: [['spray', ['khadi', 'khadi', 'gulabi']], ['star', ['khadi', 'hingul']], ['cross', ['hingul', 'lac']], ['daisy', ['khadi']], ['spike', ['lac', 'hingul']], ['bud', ['hingul', 'lac']]],
        h: y => lerp(2.8, 5, clamp((y - Y(0.45)) / (Y(0.95) - Y(0.45)), 0, 1)), thresh: 0.6, scale: 24, seed: 53, hidden: 0.4, grass: ['moss', 'olive', 'sap']
      });
    }, 0);
    ink2line(A, b, fieldTop, 'sepia', 0.55);
    // a hedge of small round bushes where the hills meet the field
    for (let x = X(-0.02); x < X(1.02); x += rr(7, 11)) {
      const y = fieldTop(x) + rr(0, 1.5), r = rr(2.2, 3.4), c = pick(['bottle', A.mix('bottle', 'malachite', 0.4), 'moss']);
      blob(A, c, x, y - r * 0.6, r, r * 0.8, 0);
      for (let j = 0; j < 3; j++) A.dot(x + rr(-0.6, 0.6) * r, y - r * rr(0.5, 1.1), 'chalk', pick(['leaf', 'malachite', 'sap']), { w: r * 0.42, p: 0.85 });
      if (A.chance(0.35)) A.dot(x + rr(-0.4, 0.4) * r, y - r * 0.9, 'chalk', pick(['khadi', 'gulabi', 'haldi']), { w: r * 0.3, p: 0.9 });
      A.outline(A.ellipse(x, y - r * 0.6, r * 1.02, r * 0.82), 'kajal', 'bottle', { closed: true, w: 0.45, p: 0.55, pull: 20, again: 0 });
    }
    // flowering shrubs standing out on the open ground ahead
    for (const q of [[0.79, 0.62, 7], [0.9, 0.57, 8.5], [0.98, 0.66, 6.5], [0.06, 0.78, 6.5]]) {
      const x = X(q[0]), y = Y(q[1]), r = q[2];
      const shp = A.shape(A.roughen(A.ellipse(x, y - r * 0.8, r, r * 0.82), r * 0.08, 6, true), { c: A.mix('bottle', 'malachite', 0.3), w: r * 0.5, rough: 0 });
      A.withMask(shp, () => { for (const p of A.scatter(shp, r * 0.42, { jit: 0.5 })) { const a0 = -PI / 2 + rr(-0.5, 0.5); for (let k = 0; k < 4; k++) leaf(A, p[0], p[1], a0 + (k / 3 - 0.5) * 2.4, r * 0.3, r * 0.13, pick(['malachite', 'leaf', 'sap'])); } }, 0);
      for (const p of A.scatter(shp, r * 0.5, { jit: 0.5, margin: r * 0.1 })) bloom(A, p[0], p[1], r * 0.12, pick(['hingul', 'khadi', 'gulabi', 'hingul']), 'haldi', 5);
      A.outline(shp, 'kajal', 'bottle', { closed: true, w: 0.6, p: 0.7, pull: 25 });
      A.stroke([[x, y - r * 0.1], [x + rr(-0.4, 0.4), y + 1.5]], 'kajal', 'umber', { w: 1, p: 0.85 });
    }

    // ---- 5. the green bank he climbs, rising to the right
    const bank = band(b, bankTop, () => b.y1 + 8);
    A.ground(bank, A.mix('malachite', 'sap', 0.3), { w: 14, ang: -0.1, c2: A.mix('sap', 'leaf', 0.3), edge: 0.5, rub: 5 });
    A.withMask(bank, () => {
      for (let i = 0; i < 30; i++) { const x = X(rr(-0.1, 1.05)), y = Y(rr(0.75, 1.03)), L = rr(10, 26); A.stroke([[x, y], [x + L, y - L * 0.12]], 'side', pick(['bottle', 'moss', 'leaf', 'sap']), { w: rr(2, 4), p: rr(0.22, 0.4) }); }
      for (const p of A.scatter(bank, 5.5, { jit: 0.48 })) {
        if (A.noise2(p[0] / 22, p[1] / 10, 79) < 0.42) continue;
        const n = A.ri(3, 5), h = rr(2.2, 3.4), c = pick(['bottle', 'moss', 'bottle', 'malachite']);
        for (let k = 0; k < n; k++) { const a = -PI / 2 + (k / (n - 1) - 0.5) * 1.3 + rr(-0.1, 0.1); A.stroke([[p[0], p[1]], [p[0] + Math.cos(a) * h, p[1] + Math.sin(a) * h]], 'chalk', c, { w: 0.6, p: rr(0.55, 0.85), tin: 0, tout: 0.6 }); }
      }
    }, 0);
    ink2line(A, b, bankTop, 'bottle', 0.75);
    const lip = []; for (let x = b.x0 - 6; x <= b.x1 + 6; x += 4) lip.push([x, bankTop(x) + 1.5]);
    A.stroke(lip, 'chalk', A.mix('leaf', 'cream', 0.35), { w: 1.1, p: 0.55 });

    // ---- 6. the bull, prancing up the bank
    const bx = X(0.42), slope = Math.atan2(bankTop(bx + 30) - bankTop(bx - 30), 60);
    const B = bull(A, bx, bankTop(bx) + 0.8, 84, { tilt: slope });

    // ---- 7. flowers on the bank, in drifts of their own kind, larger toward the foot; a tuft or two in front of the hooves
    flowerDrifts(A, A.scatter(band(b, x => bankTop(x) + 3, () => b.y1 + 2), 6, { jit: 0.5 }), {
      kinds: [['star', ['haldi', 'saffron'], 'sindoor'], ['pinwheel', ['gulabi', 'rose', 'khadi']], ['daisy', ['khadi']], ['cup', ['hingul', 'saffron', 'crimson']],
        ['bell', ['khadi', 'lilac', 'gulabi']], ['spray', ['khadi', 'haldi']], ['bud', ['hingul', 'saffron']], ['spike', ['lac', 'mauve', 'hingul']], ['cross', ['khadi', 'haldi']]],
      h: y => lerp(4.5, 12, clamp((y - Y(0.75)) / (b.y1 - Y(0.75)), 0, 1)), thresh: 0.5, scale: 28, seed: 67, hidden: 0.3, grass: ['bottle', 'moss', 'malachite', 'sap'],
      skip: p => p[0] > B.hind[0] - 8 && p[0] < B.fore[0] + 14 && p[1] < bankTop(p[0]) + 9
    });
    for (const u of [0.24, 0.3, 0.47, 0.55]) {
      const x = X(u + rr(-0.01, 0.01)), y = bankTop(x) + rr(1.5, 3), n = A.ri(4, 6), h = rr(3.5, 5);
      for (let k = 0; k < n; k++) { const a = -PI / 2 + (k / (n - 1) - 0.5) * 1.5 + rr(-0.1, 0.1); A.stroke([[x, y], [x + Math.cos(a) * h * 0.5, y + Math.sin(a) * h * 0.5], [x + Math.cos(a) * h + rr(-0.5, 0.5), y + Math.sin(a) * h]], 'chalk', pick(['bottle', 'malachite', 'moss']), { w: 0.75, p: 0.9, tin: 0, tout: 0.6 }); }
    }

    // ---- 8. small clouds curling in the blue, white chalk with gold in their turns, no two alike
    A.withMask(blue, () => {
      for (const q of [[0.06, 0.098, 25, 1, 3], [0.215, 0.11, 15, -1, 2], [0.355, 0.083, 28, 1, 3], [0.8, 0.088, 18, -1, 2]]) cloudScroll(A, X(q[0]), Y(q[1]), q[2], q[3], { lobes: q[4] });
    }, 0);

    // ---- 9. birds rising up the slope of the hills toward the sun
    M.smallBirds(A, [[X(0.015), Y(0.3)], [X(0.09), Y(0.255)], [X(0.17), Y(0.222)], [X(0.25), Y(0.205)]], 6, { along: true, c: A.mix('sepia', 'plum', 0.3), s: 3.1, ang: -0.45, spread: 2.5 });
    M.smallBirds(A, [[X(0.5), Y(0.11)], [X(0.62), Y(0.075)], [X(0.74), Y(0.05)]], 5, { along: true, c: 'khadi', s: 4.6, ang: -0.4, spread: 3 });
  };
  // a hand-drawn line along the top of a band of ground
  function ink2line(A, b, f, c, p) {
    const pts = []; for (let x = b.x0 - 6; x <= b.x1 + 6; x += 6) pts.push([x, f(x)]);
    A.outline(pts, 'kajal', c, { w: 0.8, p, pull: 40, again: 0.15 });
  }
})();
