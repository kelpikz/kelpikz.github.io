(function () {
  'use strict';
  /* ==========================================================================
     THE STEPWELL: WHAT STANDS IN IT, AND WHAT STANDS ROUND ITS RIM
       the rim     M.wellChhatri, M.wellArchWall, M.wellJali, M.wellRail, M.wellPave
       the levels  M.wellDovecote (Sidekick), M.wellLoom (the AI Rule Builder), M.wellToran (joining),
                   M.wellSpouts + M.wellTank (Portfolio), M.wellLanterns (Pragyan), M.wellCups (the hackathons),
                   M.wellPole (Delta Force), M.wellKund (NIT Trichy)
       the loose   M.wellDiya (the clay lamp), M.wellPigeon (in flight), M.wellFlag, M.wellLanternGlow
     T is the tone of the hour (a function from a pigment to what it looks like in that light).
     ======================================================================== */
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const H = () => M.cityHand;
  const I = c => c;
  function hl(A, a, b, tool, c, o) { H().hl(A, a, b, tool, c, o); }
  function solid(A, pts, c, o) { H().solid(A, pts, c, o); }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ------------------------------------------------------------ the chhatri on the rim
  /* (cx, by): the middle of the foot of its plinth; s: scale (1 = a plinth 276 wide).  Returns its silhouette for the
     shadow it throws on the wall behind. */
  M.wellChhatriShape = function (A, cx, by, s) {
    const P = (u, v) => [cx + u * s, by + v * s];
    const dome = H().dome(cx, by - 246 * s, 214 * s, 128 * s);
    return [[P(-138, 0), P(138, 0), P(138, -46), P(-138, -46)], [P(-110, -46), P(110, -46), P(110, -182), P(-110, -182)],
      [P(-152, -182), P(152, -182), P(126, -206), P(-126, -206)], rect(cx - 108 * s, by - 248 * s, cx + 108 * s, by - 204 * s), dome,
      rect(cx - 6 * s, by - 420 * s, cx + 6 * s, by - 370 * s)];
  };
  M.wellChhatri = function (A, cx, by, s, T, o) {
    o = o || {}; T = T || I;
    const P = (u, v) => [cx + u * s, by + v * s];
    const stone = T('#d9cdb0'), lit = T('#f3ead4'), shd = T('#a6977b'), deep = T('#5d4c38'), line = T('#2c2118');
    const shadeR = (poly, k) => { const bb = A.bbox([poly]); M.floorWash(A, poly, T('#7e6a52'), (x) => k * sstep((x - (bb[0] + bb[2]) / 2) / ((bb[2] - bb[0]) / 2) + 0.15), 'mul'); };
    // the plinth, two mouldings
    const pl1 = [P(-138, 0), P(138, 0), P(138, -24), P(-138, -24)], pl2 = [P(-124, -24), P(124, -24), P(124, -46), P(-124, -46)];
    for (const pl of [pl1, pl2]) { solid(A, pl, stone, { w: 5, ang: 0.1 }); shadeR(pl, 0.3); A.outline(pl, 'kajal', line, { closed: true, w: 1, p: 0.8 }); }
    A.stroke([P(-136, -22), P(136, -22)], 'chalk', lit, { w: 2.2, p: 0.8 });
    A.stroke([P(-122, -44), P(122, -44)], 'chalk', lit, { w: 2, p: 0.8 });
    for (let u = -128; u < 126; u += 22) { const pn = [P(u + 4, -5), P(u + 18, -5), P(u + 18, -18), P(u + 4, -18)]; A.outline(pn, 'kajal', A.mix(line, stone, 0.4), { closed: true, w: 0.6, p: 0.5 }); A.dot(cx + (u + 11) * s, by - 11.5 * s, 'chalk', shd, { w: 2.2 * s, p: 0.6 }); }
    // inside: the dark under the roof, and the far arches seen through the near ones
    const inner = rect(cx - 106 * s, by - 172 * s, cx + 106 * s, by - 46 * s);
    A.fill(inner, 'side', T('#6e5638'), { w: 14, p: 1, reach: 1.6, passes: 2, ang: 1.4 });
    M.floorWash(A, inner, T('#2a1c10'), (x, y) => 0.5 * sstep((by - 46 * s - y) / (126 * s)), 'over');
    for (const u of [-70, 0, 70]) { const ar = H().arch(cx + u * s, by - 52 * s, 40 * s, 82 * s, 3, 0.1, 0.6); A.fill(ar, 'side', T('#c08a3e'), { w: 8, p: 0.8, passes: 1, ang: 1.5 }); A.outline(ar, 'kajal', line, { closed: true, w: 0.7, p: 0.5 }); }
    // the arches of the near face, between the pillars
    const cols = [-104, -36, 36, 104], cw = 15;
    for (let i = 0; i < 3; i++) {
      const a0 = cols[i] + cw / 2, a1 = cols[i + 1] - cw / 2, am = (a0 + a1) / 2;
      const ar = H().arch(cx + am * s, by - 46 * s, (a1 - a0) * s, 112 * s, 3, 0.13, 0.62);
      // the spandrels above the arch are solid stone: fill the bay above the opening
      const bay = [P(a0, -168), P(a1, -168), P(a1, -46), P(a0, -46)];
      A.withMask(bay, () => { A.pushMaskOutside(ar); solid(A, bay, stone, { w: 4, ang: 0.4 }); A.stroke([P(a0, -165), P(a1, -165)], 'chalk', lit, { w: 2, p: 0.6 }); H().rosette(A, P(a0 + 6, -150), 3.4 * s, T('#b8743a'), 6, 'gold'); H().rosette(A, P(a1 - 6, -150), 3.4 * s, T('#b8743a'), 6, 'gold'); A.popMask(); });
      A.outline(ar, 'kajal', line, { closed: false, w: 1, p: 0.85, pull: 40 });
      A.stroke(ar.slice(2, -2).map(p => [p[0] + 1.2 * s, p[1] + 1.4 * s]), 'chalk', lit, { w: 1.2, p: 0.55 });
    }
    // the pillars: base, shaft with a band, a bracket capital
    for (const u of cols) {
      const sh = rect(cx + (u - cw / 2) * s, by - 160 * s, cx + (u + cw / 2) * s, by - 56 * s);
      solid(A, sh, stone, { w: 3, ang: 1.5 }); shadeR(sh, 0.5);
      A.stroke([P(u - cw / 2 + 2.5, -158), P(u - cw / 2 + 2.5, -58)], 'chalk', lit, { w: 2.2, p: 0.8 });
      A.outline(sh, 'kajal', line, { closed: true, w: 0.9, p: 0.8 });
      const base = [P(u - 11, -46), P(u + 11, -46), P(u + 9, -56), P(u - 9, -56)], cap = [P(u - 13, -168), P(u + 13, -168), P(u + 9, -160), P(u - 9, -160)];
      for (const q of [base, cap]) { solid(A, q, stone, { w: 2.4 }); shadeR(q, 0.35); A.outline(q, 'kajal', line, { closed: true, w: 0.8, p: 0.75 }); }
      for (const v of [-80, -84, -132, -136]) hl(A, P(u - cw / 2, v), P(u + cw / 2, v), 'kajal', A.mix(line, stone, 0.3), { w: 0.6, p: 0.6 });
    }
    // the beam and the eave
    const beam = [P(-128, -182), P(128, -182), P(128, -168), P(-128, -168)];
    solid(A, beam, stone, { w: 3.5, ang: 0 }); shadeR(beam, 0.3); A.outline(beam, 'kajal', line, { closed: true, w: 0.9, p: 0.8 });
    for (let u = -124; u < 124; u += 9) A.dot(cx + u * s, by - 175 * s, 'chalk', shd, { w: 2.2 * s, len: 1.2 * s, ang: 1.57, p: 0.7 });
    const eave = [P(-126, -206), P(126, -206), P(154, -184), P(-154, -184)];
    solid(A, eave, stone, { w: 4, ang: 0.15 });
    M.floorWash(A, eave, T('#efe2c2'), (x, y) => 0.4 * sstep((by - 184 * s - y) / (22 * s)), 'over'); shadeR(eave, 0.25);
    for (let u = -120; u <= 120; u += 15) hl(A, P(u, -205), P(u * 1.22, -185), 'kajal', A.mix(line, stone, 0.45), { w: 0.6, p: 0.5 });
    A.stroke([P(-154, -183), P(154, -183)], 'side', deep, { w: 4, p: 0.8 });
    A.outline(eave, 'kajal', line, { closed: true, w: 1.1, p: 0.85 });
    // the drum: a carved band of little cusped niches and a frieze of petals
    const drum = rect(cx - 108 * s, by - 248 * s, cx + 108 * s, by - 206 * s);
    solid(A, drum, stone, { w: 4, ang: 1.4 }); shadeR(drum, 0.4);
    for (let u = -100; u <= 92; u += 16) { const nic = H().arch(cx + (u + 8) * s, by - 212 * s, 10 * s, 22 * s, 3, 0.12, 0.6); A.fill(nic, 'chalk', A.mix(shd, deep, 0.25), { w: 2, p: 0.9, passes: 1 }); A.outline(nic, 'kajal', line, { closed: true, w: 0.55, p: 0.6 }); }
    for (let u = -106; u < 106; u += 7) A.stroke([P(u, -236), P(u + 3.5, -244), P(u + 7, -236)], 'kajal', A.mix(line, stone, 0.35), { w: 0.6, p: 0.6 });
    hl(A, P(-108, -236), P(108, -236), 'kajal', line, { w: 0.7, p: 0.7 });
    A.outline(drum, 'kajal', line, { closed: true, w: 1, p: 0.85 });
    // the dome: laid stone, course over course, lit from the upper left
    const dw = 214 * s, dh = 128 * s, dby = by - 248 * s, dome = H().dome(cx, dby, dw, dh);
    solid(A, dome, stone, { w: 6, ang: -0.6 });
    A.blend(dome, { r: 5, k: 0.3 });
    const hw = dw / 2, rv = v => hw * (1 + 0.12 * Math.sin(PI * Math.min(1, v / 0.5))) * Math.pow(Math.max(0, 1 - Math.pow(v, 2.3)), 0.6);
    M.floorWash(A, dome, T('#6e5c44'), (x, y) => { const v = (dby - y) / dh, r = rv(v) || 1, u = (x - cx) / r; return 0.55 * sstep(u * 0.9 + 0.35) * (0.85 + 0.15 * v); }, 'mul');
    M.floorWash(A, dome, lit, (x, y) => { const v = (dby - y) / dh, r = rv(v) || 1, u = (x - cx) / r; return 0.55 * Math.max(0, 1 - Math.hypot(u + 0.42, (v - 0.55) * 1.6) * 1.6); }, 'over');
    A.withMask(dome, () => {
      for (const v of [0.12, 0.26, 0.4, 0.54, 0.68, 0.81, 0.91]) {
        const r = rv(v), y = dby - v * dh, pts = [];
        for (let i = 0; i <= 24; i++) { const t = -1 + 2 * i / 24; pts.push([cx + t * r, y + (1 - t * t) * 3 * s]); }
        A.stroke(pts, 'kajal', A.mix(line, stone, 0.35), { w: 0.65, p: 0.55 });
        const rowH = 0.13, jn = Math.max(3, Math.round(r / (16 * s)));
        for (let k = 1; k < jn * 2; k++) { const t = -1 + k / jn, vv = v + rowH * 0.5; if (vv > 1) continue; const rr2 = rv(Math.min(1, v + rowH * 0.02)); hl(A, [cx + Math.sin(t * PI / 2) * rr2, y + 2], [cx + Math.sin(t * PI / 2) * rv(Math.min(0.98, v + 0.13)), y - 0.13 * dh + 2], 'kajal', A.mix(line, stone, 0.45), { w: 0.5, p: 0.42 }); }
      }
      // a lichen bloom on the shaded side
      M.floorCloud(A, dome, T('#8f8a6a'), { scale: 18, seed: 3.3, thr: 0.62, soft: 0.2, p: 0.3, w: 5, tool: 'chalk', g: (x) => sstep((x - cx) / hw + 0.2) });
    });
    A.outline(dome, 'kajal', line, { closed: true, w: 1.2, p: 0.88, pull: 60, again: 0.25 });
    // the lotus cap and the gold finial
    const ty = dby - dh;
    const cap = A.spline([P(-24, -372), P(-14, -380), P(0, -383), P(14, -380), P(24, -372)].map(p => [p[0], p[1] + (ty - (by - 376 * s))]), false, 1);
    for (let u = -22; u <= 22; u += 7.3) { const pet = [[cx + u * s, ty + 4 * s], [cx + (u + 3.6) * s, ty - 7 * s], [cx + (u + 7.3) * s, ty + 4 * s]]; A.fill(pet, 'chalk', stone, { w: 2, p: 1, passes: 1 }); A.outline(pet, 'kajal', line, { w: 0.6, p: 0.7 }); }
    void cap;
    H().kalash(A, cx, ty - 6 * s, 46 * s, { c: 'gold', base: T('#b07a34') });
    A.dot(cx, ty - 34 * s, 'gold', 'gold', { w: 6 * s, len: 0.3 });
    for (let i = 0; i < 9; i++) { const a = -PI / 2 + (i - 4) * 0.33; A.stroke([[cx + Math.cos(a) * 9 * s, ty - 34 * s + Math.sin(a) * 9 * s], [cx + Math.cos(a) * 20 * s, ty - 34 * s + Math.sin(a) * 20 * s]], 'gold', 'gold', { w: 1, p: 0.75, tout: 0.6 }); }
    return { top: [cx, ty - 46 * s], dome: [cx, dby - dh * 0.5, hw, dh * 0.5] };
  };

  // ------------------------------------------------------------ a jali: a stone screen pierced in a lattice
  M.wellJali = function (A, poly, T, o) {
    o = o || {}; T = T || I;
    const bb = A.bbox([poly]), st = o.c || T('#bdb69a'), hole = o.hole || T('#3b3424'), cell = o.cell || 6.5;
    solid(A, poly, st, { w: 3, ang: 0.8 });
    A.withMask(poly, () => {
      // the holes are small diamonds; the stone between them catches the light on its upper edges
      for (let y = bb[1] + cell * 0.6, r = 0; y < bb[3]; y += cell, r++) for (let x = bb[0] + cell * (r % 2 ? 0.5 : 1), c = 0; x < bb[2]; x += cell, c++) {
        const d = cell * 0.36;
        A.fill([[x, y - d], [x + d, y], [x, y + d], [x - d, y]], 'chalk', hole, { w: Math.max(0.8, d * 0.8), p: 0.95, passes: 1, gap: 0.5 });
        A.stroke([[x - d, y], [x, y - d], [x + d, y]], 'chalk', A.mix(st, 'khadi', 0.5), { w: 0.55, p: 0.5 });
      }
    });
    A.outline(poly, 'kajal', o.line || T('#2c2118'), { closed: true, w: 0.9, p: 0.8 });
  };

  // ------------------------------------------------------------ the wall of blind arches behind the rim
  M.wellArchWall = function (A, x0, x1, yt, yb, T, o) {
    o = o || {}; T = T || I;
    const pl = T('#e2a64c'), pl2 = T('#c98c3c'), pink = T('#d99486'), cop = T('#cdbb98'), line = T('#3a2614'), lit = T('#f6dfa4');
    const face = rect(x0, yt, x1, yb);
    A.ground(face, pl, { w: 26, ang: -1.25, edge: 0, rub: 7, top: 0.7 });
    M.floorCloud(A, face, T('#f0c46c'), { scale: 70, seed: 4.1, thr: 0.55, soft: 0.2, p: 0.45, w: 18 });
    M.floorCloud(A, face, T('#b97a36'), { scale: 50, seed: 7.7, thr: 0.62, soft: 0.2, p: 0.35, w: 14 });
    // old pink lime coming through at the far end, as on the wall in the photograph
    M.floorWash(A, face, pink, (x, y) => 0.55 * sstep((x - (x1 - 520)) / 360) * (0.6 + 0.5 * A.noise2(x / 70, y / 50, 3)), 'over');
    // the damp rising from the foot
    M.floorWash(A, face, T('#7c5434'), (x, y) => 0.28 * sstep((y - (yb - 60)) / 60) * (0.7 + 0.6 * A.noise2(x / 40, 1, 4)), 'mul');
    const bay = o.bay || 116, skip = o.skip || [0, 0];
    const bays = [];
    for (let x = x0 + 14; x < x1; x += bay) bays.push(x);
    bays.forEach((px, i) => {
      // a pilaster: a raised strip, lit on its left edge, its shadow to the right
      const pw = 13, pil = rect(px - pw / 2, yt + 6, px + pw / 2, yb);
      A.fill(pil.map(p => [p[0] + 6, p[1] + 4]), 'side', T('#a46a2c'), { w: 8, p: 0.45, passes: 1, ang: 1.57 });
      solid(A, pil, A.mix(pl, lit, 0.25), { w: 4, ang: 1.55 });
      A.stroke([[px - pw / 2 + 2, yt + 8], [px - pw / 2 + 2, yb - 2]], 'chalk', lit, { w: 1.8, p: 0.8 });
      hl(A, [px - pw / 2, yt + 6], [px - pw / 2, yb], 'kajal', line, { w: 0.8, p: 0.7 });
      hl(A, [px + pw / 2, yt + 6], [px + pw / 2, yb], 'kajal', line, { w: 0.9, p: 0.75 });
      A.fill(rect(px - pw / 2 - 3, yt + 14, px + pw / 2 + 3, yt + 22), 'chalk', A.mix(pl, lit, 0.3), { w: 2.4, p: 1, passes: 1 });
      A.outline(rect(px - pw / 2 - 3, yt + 14, px + pw / 2 + 3, yt + 22), 'kajal', line, { closed: true, w: 0.6, p: 0.6 });
      // a blind arch in the bay, its recess shaded at the top and down its left side
      const mx = px + bay / 2;
      if (mx > x1 - 10 || (mx > skip[0] && mx < skip[1])) return;
      const aw = bay - 40, ah = (yb - yt) * 0.72, ar = H().arch(mx, yb - 10, aw, ah, 3, 0.1, 0.6);
      A.fill(ar, 'side', pl2, { w: 12, p: 0.75, passes: 2, ang: 1.4 });
      A.withMask(ar, () => {
        A.fill(rect(mx - aw / 2 - 2, yb - ah - 4, mx - aw / 2 + 7, yb), 'side', T('#8e5a28'), { w: 6, p: 0.55, passes: 1, ang: 1.57 });
        M.floorWash(A, ar, T('#8e5a28'), (x, y) => 0.35 * (1 - sstep((y - (yb - 10 - ah)) / (ah * 0.35))), 'mul');
      });
      A.outline(ar, 'kajal', line, { closed: true, w: 0.9, p: 0.75, pull: 50 });
      A.stroke(ar.slice(3, -3).map(p => [p[0] + 2, p[1] + 2]), 'chalk', lit, { w: 1, p: 0.45 });
      // a jali in it: a square panel low down, or a small arched window high up, as in the photograph
      if (i % 2 === 0) M.wellJali(A, rect(mx - 17, yb - 72, mx + 17, yb - 26), T, { cell: 6 });
      else M.wellJali(A, H().arch(mx, yb - ah * 0.45, 20, 40, 3, 0.1, 0.55), T, { cell: 5 });
      // rain streaks from the coping
      for (let k = 0; k < 2; k++) { const sx = mx + A.rr(-aw / 2, aw / 2); A.stroke([[sx, yt + 10], [sx + A.rr(-2, 2), yt + 10 + A.rr(20, 60)]], 'side', T('#8a5a2a'), { w: A.rr(4, 9), p: 0.18, tout: 0.7 }); }
    });
    // the coping: a slab along the top that throws a band of shadow
    const cp = [[x0, yt - 12], [x1, yt - 12], [x1, yt + 4], [x0, yt + 4]];
    A.fill(rect(x0, yt + 4, x1, yt + 14), 'side', T('#8e5a28'), { w: 9, p: 0.5, passes: 1, ang: 0 });
    solid(A, cp, cop, { w: 5, ang: 0.05 });
    A.stroke([[x0, yt - 10], [x1, yt - 10]], 'chalk', T('#f3ead4'), { w: 2, p: 0.7 });
    A.outline(cp, 'kajal', line, { closed: true, w: 1, p: 0.8 });
    for (let x = x0 + A.rr(20, 60); x < x1; x += A.rr(60, 110)) hl(A, [x, yt - 12], [x, yt + 4], 'kajal', A.mix(line, cop, 0.4), { w: 0.6, p: 0.5 });
  };

  // ------------------------------------------------------------ the low stone rail round the rim
  /* y: its foot; h: its height; skip: [xa, xb] where something stands in front.  Returns the post points. */
  M.wellRail = function (A, x0, x1, y, h, T, o) {
    o = o || {}; T = T || I;
    const st = T('#ebe4d2'), sh = T('#aca38f'), line = T('#2c2118'), skip = o.skip || [0, 0], gap = o.gap || 88, posts = [];
    for (let x = x0 + 10; x < x1; x += gap) if (x < skip[0] - 6 || x > skip[1] + 6) posts.push(x);
    // shadow on the paving
    A.fill([[x0, y], [x1, y], [x1 + 16, y + 9], [x0 + 16, y + 9]], 'side', T('#7a6a52'), { w: 8, p: 0.3, passes: 1, ang: 0 });
    for (let i = 0; i + 1 < posts.length; i++) {
      const a = posts[i] + 5, b = posts[i + 1] - 5; if (b - a > gap * 1.2) continue;
      const slab = rect(a, y - h * 0.74, b, y - 3);
      solid(A, slab, st, { w: 4, ang: 0.08 });
      M.floorWash(A, slab, sh, (xx, yy) => 0.45 * sstep((yy - (y - h * 0.74)) / (h * 0.74)), 'mul');
      A.stroke([[a + 1, y - h * 0.74 + 1.4], [b - 1, y - h * 0.74 + 1.4]], 'chalk', T('#fffaf0'), { w: 1.6, p: 0.7 });
      A.outline(slab, 'kajal', line, { closed: true, w: 0.8, p: 0.72 });
    }
    for (const x of posts) {
      const post = rect(x - 5, y - h, x + 5, y);
      solid(A, post, st, { w: 2.6, ang: 1.5 });
      A.stroke([[x + 3.5, y - h + 2], [x + 3.5, y - 1]], 'side', sh, { w: 3, p: 0.6 });
      A.outline(post, 'kajal', line, { closed: true, w: 0.8, p: 0.75 });
      A.dot(x, y - h - 2.5, 'chalk', st, { w: 7, len: 1.5, ang: 0, p: 1, reach: 1.5 });
      A.stroke(A.ellipse(x, y - h - 2.5, 4.4, 3, 0, PI, TAU), 'kajal', line, { w: 0.7, p: 0.7 });
    }
    return posts;
  };

  // ------------------------------------------------------------ the paving of the rim
  M.wellPave = function (A, x0, x1, y0, y1, T, o) {
    o = o || {}; T = T || I;
    const st = T('#d6c7a3'), line = T('#3a2c1e'), poly = rect(x0, y0, x1, y1);
    A.ground(poly, st, { w: 18, ang: -0.05, edge: 0, rub: 6, top: 0.6 });
    M.floorCloud(A, poly, T('#efe3c4'), { scale: 40, seed: 2.2, thr: 0.52, soft: 0.2, p: 0.5, w: 10, ang: 0 });
    M.floorCloud(A, poly, T('#a8946e'), { scale: 34, seed: 5.2, thr: 0.62, soft: 0.2, p: 0.35, w: 10, ang: 0 });
    // two rows of slabs, the joints leaning a little toward the middle of the sheet, as paving does seen from above the well
    const rows = [y0, y0 + (y1 - y0) * 0.42, y1];
    for (let r = 0; r < 2; r++) {
      const ya = rows[r], yb = rows[r + 1];
      hl(A, [x0, yb], [x1, yb], 'kajal', A.mix(line, st, 0.25), { w: 0.8, p: 0.6 });
      for (let x = x0 + A.rr(0, 60) + r * 30; x < x1; x += A.rr(70, 130)) { const lean = (x - 800) * 0.012 * (yb - ya) / 30; hl(A, [x, ya], [x + lean, yb], 'kajal', A.mix(line, st, 0.3), { w: 0.7, p: 0.55 }); }
    }
    hl(A, [x0, y0], [x1, y0], 'kajal', line, { w: 0.9, p: 0.7 });
    // the lip of the well: a moulded edge with a row of petals cut into it
    const lip = rect(x0, y1, x1, y1 + 14);
    solid(A, lip, T('#c9b48c'), { w: 4, ang: 0 });
    M.floorWash(A, lip, T('#6e5a40'), (x, y) => 0.4 * sstep((y - y1) / 14), 'mul');
    for (let x = x0 + 3; x < x1; x += 8.5) A.stroke([[x, y1 + 13], [x + 4.2, y1 + 4], [x + 8.5, y1 + 13]], 'kajal', A.mix(line, st, 0.25), { w: 0.6, p: 0.6 });
    hl(A, [x0, y1], [x1, y1], 'kajal', line, { w: 1, p: 0.85 });
    hl(A, [x0, y1 + 14], [x1, y1 + 14], 'kajal', line, { w: 1.1, p: 0.85 });
    A.stroke([[x0, y1 + 1.6], [x1, y1 + 1.6]], 'chalk', T('#fbf2da'), { w: 1.6, p: 0.75 });
  };

  // ------------------------------------------------------------ SIDEKICK: a dovecote, ten holes and the birds that answer
  /* (x, yb): the middle of its foot on the ledge; s: scale (1 = 360 tall).  Returns where its holes are (for the flock). */
  M.wellDovecote = function (A, x, yb, s, T) {
    T = T || I;
    const P = (u, v) => [x + u * s, yb + v * s];
    const lime = T('#f2e6c8'), lime2 = T('#d9c49a'), trim = T('#c98a3a'), red = T('#b8452c'), line = T('#2c2118'), dark = T('#2a1a12');
    const shR = (poly, k) => { const bb = A.bbox([poly]); M.floorWash(A, poly, T('#8a6a44'), (xx) => k * sstep((xx - (bb[0] + bb[2]) / 2) / ((bb[2] - bb[0]) / 2) + 0.25), 'mul'); };
    // its shadow on the wall
    A.fill([P(-30, 0), P(30, 0), P(80, -96), P(110, -340), P(20, -360)].map(p => [p[0] + 16, p[1]]), 'side', T('#8a5a2c'), { w: 14, p: 0.28, passes: 1, ang: -1 });
    // the foot: a stepped base and a round pillar
    const base = [P(-46, 0), P(46, 0), P(40, -16), P(-40, -16)], base2 = [P(-34, -16), P(34, -16), P(30, -28), P(-30, -28)];
    for (const b of [base, base2]) { solid(A, b, lime2, { w: 3 }); shR(b, 0.35); A.outline(b, 'kajal', line, { closed: true, w: 0.9, p: 0.8 }); }
    const col = [P(-15, -28), P(15, -28), P(13, -104), P(-13, -104)];
    solid(A, col, lime, { w: 3, ang: 1.5 }); shR(col, 0.55);
    for (const v of [-46, -66, -86]) hl(A, P(-14, v), P(14, v), 'kajal', A.mix(line, lime, 0.4), { w: 0.6, p: 0.55 });
    A.stroke([P(-10, -30), P(-10, -100)], 'chalk', T('#fffaf0'), { w: 2, p: 0.7 });
    A.outline(col, 'kajal', line, { closed: true, w: 0.9, p: 0.8 });
    // a bracket of four struts carrying the house of the birds
    for (const sg of [-1, 1]) A.stroke([P(sg * 12, -96), P(sg * 40, -112), P(sg * 66, -118)], 'kajal', line, { w: 2, p: 0.9 });
    const plat = [P(-82, -118), P(82, -118), P(76, -128), P(-76, -128)];
    solid(A, plat, trim, { w: 3 }); shR(plat, 0.3); A.outline(plat, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    // the house: lime-washed, two columns of five arched holes, each with a perch under it
    const bx0 = -74, bx1 = 74, by0 = -332, by1 = -128;
    const box = [P(bx0, by1), P(bx1, by1), P(bx1, by0), P(bx0, by0)];
    solid(A, box, lime, { w: 5, ang: 1.45 }); shR(box, 0.45);
    M.floorCloud(A, box, T('#e2cfa6'), { scale: 22, seed: 9.1, thr: 0.58, soft: 0.2, p: 0.35, w: 6, tool: 'chalk' });
    A.stroke([P(bx0 + 3, by1 - 3), P(bx0 + 3, by0 + 3)], 'chalk', T('#fffaf0'), { w: 2.4, p: 0.8 });
    const holes = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) {
      const hx = (c ? 34 : -34), hy = by1 - 10 - r * 40;
      const ar = H().arch(x + hx * s, yb + hy * s, 30 * s, 28 * s, 0, 0, 0.5);
      A.fill(ar, 'chalk', dark, { w: 3, p: 1, passes: 2, reach: 1.5 });
      A.stroke(ar.slice(1, Math.floor(ar.length / 2)), 'side', T('#5a3a24'), { w: 3, p: 0.4 });
      A.outline(ar, 'kajal', line, { closed: true, w: 0.9, p: 0.8 });
      // a painted border round the hole, red and yellow as on the dovecotes of Marwar
      A.stroke(ar.slice(1, -1).map(p => [x + hx * s + (p[0] - x - hx * s) * 1.22, yb + hy * s + (p[1] - yb - hy * s) * 1.14 - 1]), 'chalk', r % 2 ? red : T('#e0a030'), { w: 1.6, p: 0.85 });
      const perch = [P(hx - 19, hy), P(hx + 19, hy), P(hx + 17, hy + 5), P(hx - 17, hy + 5)];
      solid(A, perch, lime2, { w: 2 }); A.outline(perch, 'kajal', line, { closed: true, w: 0.7, p: 0.75 });
      A.stroke([P(hx - 17, hy + 6), P(hx + 19, hy + 7)], 'side', T('#7a5a3a'), { w: 3, p: 0.35 });
      holes.push([x + hx * s, yb + (hy - 12) * s]);
    }
    // the corner bands and a painted frieze of little triangles at the top
    for (const u of [bx0, bx1]) A.fill(rect(x + (u - (u < 0 ? 0 : 7)) * s, yb + by0 * s, x + (u + (u < 0 ? 7 : 0)) * s, yb + by1 * s), 'chalk', trim, { w: 2.4, p: 0.9, passes: 1, ang: 1.57 });
    for (let u = bx0; u < bx1 - 1; u += 10) { const tri = [P(u, by0 + 14), P(u + 5, by0 + 4), P(u + 10, by0 + 14)]; A.fill(tri, 'chalk', red, { w: 2, p: 0.9, passes: 1 }); }
    hl(A, P(bx0, by0 + 15), P(bx1, by0 + 15), 'kajal', line, { w: 0.7, p: 0.7 });
    A.outline(box, 'kajal', line, { closed: true, w: 1.1, p: 0.88, pull: 60 });
    // the cornice and a small cupola with a gold finial
    const cor = [P(-90, -332), P(90, -332), P(84, -344), P(-84, -344)];
    solid(A, cor, lime2, { w: 3 }); shR(cor, 0.3); A.outline(cor, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    const cup = H().dome(x, yb - 344 * s, 112 * s, 56 * s);
    solid(A, cup, lime, { w: 4 });
    M.floorWash(A, cup, T('#8a6a44'), (xx) => 0.5 * sstep((xx - x) / (56 * s) + 0.3), 'mul');
    for (const u of [-0.55, 0, 0.55]) A.stroke(A.spline([P(u * 56, -344), P(u * 44, -372), P(u * 8, -398)], false, 1), 'kajal', A.mix(line, lime, 0.4), { w: 0.6, p: 0.5 });
    A.outline(cup, 'kajal', line, { closed: true, w: 1, p: 0.85 });
    H().kalash(A, x, yb - 398 * s, 22 * s, { c: 'gold', base: trim });
    return { holes, top: [x, yb - 400 * s], box: [x + bx0 * s - 18, yb - 420 * s, x + bx1 * s + 18, yb] };
  };

  // ------------------------------------------------------------ a pigeon on the wing, four beats of the wing (for the flock)
  M.wellPigeon = function (A, x, y, s, ph, c, o) {
    o = o || {};
    const body = c || '#7c8794', dark = o.dark || '#3c4450', light = o.light || '#c8ced2', f = o.flip ? -1 : 1;
    const P = (u, v) => [x + u * s * f, y + v * s];
    // ph 0 wings high, 1 level, 2 down, 3 swept back
    const W = [[-0.95, -0.55], [-0.15, -0.95], [0.55, -0.65], [-0.45, -0.85]][ph % 4];
    for (const side of [0, 1]) {
      const lift = W[0] * (side ? 0.8 : 1), span = side ? 0.82 : 1;
      const wing = A.spline([P(-0.08, -0.02), P(0.02 - 0.25 * span, lift * 0.55), P(-0.12 - 0.15 * span, lift), P(0.12, lift * 0.45 + 0.06), P(0.18, 0.02)], true, 0.5);
      A.fill(wing, 'chalk', side ? A.mix(body, dark, 0.35) : body, { w: Math.max(1, s * 0.12), p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      A.stroke([P(-0.12 - 0.15 * span, lift), P(-0.02, lift * 0.6)], 'chalk', dark, { w: Math.max(0.8, s * 0.06), p: 0.8 });
      A.outline(wing, 'kajal', dark, { closed: true, w: Math.max(0.5, s * 0.025), p: 0.6 });
    }
    const bod = A.spline([P(-0.42, 0.02), P(-0.2, -0.06), P(0.18, -0.06), P(0.36, -0.02), P(0.18, 0.08), P(-0.2, 0.07)], true, 0.5);
    A.fill(bod, 'chalk', body, { w: Math.max(1, s * 0.1), p: 1, reach: 1.5, passes: 2, gap: 0.42 });
    A.stroke([P(-0.06, 0.03), P(0.2, 0.0)], 'chalk', light, { w: Math.max(0.7, s * 0.05), p: 0.7 });
    A.dot(x + 0.36 * s * f, y - 0.04 * s, 'chalk', A.mix(body, dark, 0.3), { w: Math.max(1, s * 0.14), p: 1 });
    A.dot(x + 0.37 * s * f, y - 0.05 * s, 'chalk', '#5b8a6a', { w: Math.max(0.5, s * 0.05), p: 0.8 });
    A.stroke([P(0.42, -0.03), P(0.48, -0.02)], 'kajal', '#b0703a', { w: Math.max(0.5, s * 0.03), p: 0.9 });
    A.stroke([P(-0.42, 0.02), P(-0.56, 0.0), P(-0.56, 0.07), P(-0.42, 0.05)], 'chalk', dark, { w: Math.max(0.8, s * 0.07), p: 0.9 });
  };

  // ------------------------------------------------------------ THE AI RULE BUILDER: a loom, its warp strung and a pattern begun
  M.wellLoom = function (A, x, yb, s, T) {
    T = T || I;
    const P = (u, v) => [x + u * s, yb + v * s];
    const wood = T('#7a4a26'), wood2 = T('#a8703a'), line = T('#24160c');
    const warpC = ['#c63d2f', '#e6b422', '#1d2850', '#e88e1e', '#8f2331', '#f1dfa6', '#2a4b96', '#de5a22'].map(T);
    // its shadow on the wall
    A.fill([P(-120, -4), P(130, -4), P(170, -230), P(-80, -286)].map(p => [p[0] + 18, p[1] + 2]), 'side', T('#8a5a2c'), { w: 16, p: 0.22, passes: 1, ang: -0.9 });
    // the warp: from the cloth beam up over the top beam, a hundred threads in runs of colour
    const wy0 = -262, wy1 = -74, n = 64;
    for (let i = 0; i < n; i++) {
      const u = -100 + 200 * i / (n - 1), c = warpC[Math.floor(i / 4) % warpC.length];
      A.stroke([P(u, wy0), P(u + A.rr(-0.4, 0.4), (wy0 + wy1) / 2), P(u, wy1)], 'chalk', c, { w: 1.3 * s, p: 0.92, tin: 0, tout: 0 });
    }
    // the reed and the heddles across the middle
    const reed = rect(x - 106 * s, yb - 176 * s, x + 106 * s, yb - 164 * s);
    solid(A, reed, wood2, { w: 3, ang: 0 }); A.outline(reed, 'kajal', line, { closed: true, w: 0.8, p: 0.8 });
    for (let u = -104; u <= 104; u += 3.2) hl(A, P(u, -176), P(u, -164), 'kajal', line, { w: 0.4, p: 0.55 });
    for (const v of [-214, -204]) { const hb = rect(x - 108 * s, yb + (v - 3) * s, x + 108 * s, yb + (v + 3) * s); solid(A, hb, wood, { w: 2 }); A.outline(hb, 'kajal', line, { closed: true, w: 0.7, p: 0.75 }); }
    A.stroke([P(-108, -214), P(-118, -250), P(-112, -262)], 'kajal', T('#d8c8a0'), { w: 0.9, p: 0.8 });
    A.stroke([P(108, -214), P(118, -250), P(112, -262)], 'kajal', T('#d8c8a0'), { w: 0.9, p: 0.8 });
    // the cloth woven so far, wound toward the breast beam: a band of the pattern, rows of diamonds and a lehariya wave
    const cl = rect(x - 102 * s, yb - 150 * s, x + 102 * s, yb - 74 * s);
    solid(A, cl, T('#b8322a'), { w: 4, ang: 0 });
    A.withMask(cl, () => {
      for (let v = -146; v < -76; v += 4) A.stroke([P(-104, v), P(104, v + A.rr(-0.3, 0.3))], 'chalk', T(A.chance(0.2) ? '#8f2331' : '#c63d2f'), { w: 1.4 * s, p: 0.5 });
      const rows = [[-140, '#e6b422'], [-112, '#f1dfa6'], [-86, '#e6b422']];
      for (const [v, c] of rows) for (let u = -100; u < 102; u += 14) { const dm = [P(u + 7, v - 7), P(u + 14, v), P(u + 7, v + 7), P(u, v)]; A.fill(dm, 'chalk', T(c), { w: 1.8, p: 1, passes: 1, gap: 0.45 }); A.dot(x + (u + 7) * s, yb + v * s, 'chalk', T('#1d2850'), { w: 1.6 * s, p: 0.95 }); }
      for (const v0 of [-126, -98]) { const pts = []; for (let u = -104; u <= 104; u += 2) pts.push(P(u, v0 + Math.sin(u / 6) * 3)); A.stroke(pts, 'chalk', T('#2a4b96'), { w: 2 * s, p: 0.95 }); A.stroke(pts.map(p => [p[0], p[1] + 3.2 * s]), 'chalk', T('#e88e1e'), { w: 1.4 * s, p: 0.9 }); }
    });
    // the fell of the cloth: where the weaving stopped, a few loose picks of gold
    for (let k = 0; k < 4; k++) A.stroke([P(-102, -152 - k * 2.2), P(102, -152 - k * 2.2 + A.rr(-0.4, 0.4))], 'gold', 'gold', { w: 0.9, p: 0.8 });
    A.outline(cl, 'kajal', line, { closed: true, w: 0.9, p: 0.75 });
    // the frame: two posts, the top beam, the breast beam and the foot
    for (const sg of [-1, 1]) {
      const post = rect(x + sg * 118 * s - 7 * s, yb - 280 * s, x + sg * 118 * s + 7 * s, yb);
      solid(A, post, wood, { w: 3, ang: 1.57 });
      A.stroke([[x + sg * 118 * s - 4 * s, yb - 278 * s], [x + sg * 118 * s - 4 * s, yb - 2]], 'chalk', wood2, { w: 1.8, p: 0.7 });
      for (let v = -270; v < -10; v += A.rr(18, 34)) A.stroke([P(sg * 118 - 5, v), P(sg * 118 + 5, v + A.rr(4, 9))], 'kajal', A.mix(line, wood, 0.4), { w: 0.5, p: 0.45 });
      A.outline(post, 'kajal', line, { closed: true, w: 1, p: 0.85 });
      A.dot(x + sg * 118 * s, yb - 288 * s, 'chalk', wood2, { w: 13 * s, len: 2, ang: 0, p: 1 });
      A.outline(A.ellipse(x + sg * 118 * s, yb - 288 * s, 7 * s, 6 * s), 'kajal', line, { closed: true, w: 0.8, p: 0.8 });
    }
    for (const [v, t] of [[-268, 9], [-74, 10], [-30, 7]]) {
      const bm = rect(x - 126 * s, yb + (v - t / 2) * s, x + 126 * s, yb + (v + t / 2) * s);
      solid(A, bm, wood, { w: 3, ang: 0 });
      A.stroke([P(-124, v - t / 2 + 1.6), P(124, v - t / 2 + 1.6)], 'chalk', wood2, { w: 1.6, p: 0.75 });
      A.outline(bm, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    }
    // the treadles below, and the shuttle lying on the breast beam with its bobbin of gold
    for (const u of [-40, -14, 12, 38]) A.stroke([P(u, -26), P(u + 6, -6)], 'kajal', wood, { w: 3 * s, p: 0.95 });
    const sh = A.spline([P(-30, -83), P(0, -88), P(34, -84), P(42, -80), P(34, -78), P(0, -77), P(-30, -79), P(-40, -81)], true, 0.6);
    solid(A, sh, T('#c8904a'), { w: 2 }); A.outline(sh, 'kajal', line, { closed: true, w: 0.8, p: 0.85 });
    A.stroke([P(-12, -82.5), P(16, -82.5)], 'gold', 'gold', { w: 2.4 * s, p: 0.95 });
    // a thread of gold runs from the shuttle back into the warp: the next rule being written
    A.stroke(A.spline([P(-30, -82), P(-60, -100), P(-80, -140), P(-90, -152)], false, 1), 'gold', 'gold', { w: 0.9, p: 0.85 });
    // spools on a little stand beside it
    for (let k = 0; k < 4; k++) { const sx = x + (148 + k * 13) * s, sy = yb - 8 * s; A.fill(rect(sx - 5 * s, sy - 20 * s, sx + 5 * s, sy), 'chalk', warpC[k * 2], { w: 2, p: 1, passes: 2 }); A.outline(rect(sx - 5 * s, sy - 20 * s, sx + 5 * s, sy), 'kajal', line, { closed: true, w: 0.6, p: 0.7 }); A.dot(sx, sy - 21 * s, 'chalk', wood, { w: 3 * s, len: 2, ang: 0 }); }
    return { box: [x - 132 * s, yb - 300 * s, x + 206 * s, yb] };
  };

  // ------------------------------------------------------------ a toran of mango leaves and marigolds over a door
  M.wellToran = function (A, x0, x1, y, T) {
    T = T || I;
    const cord = A.spline([[x0, y], [(x0 + x1) / 2, y + 7], [x1, y]], false, 2);
    A.stroke(cord, 'kajal', T('#6a3a1a'), { w: 1.1, p: 0.85 });
    const pts = A.resample(cord, 9, false);
    pts.forEach((p, i) => {
      if (i % 2 === 0) {
        // a mango leaf hanging, its tip turned a little
        const L = A.rr(20, 27), a = PI / 2 + A.rr(-0.18, 0.18);
        M.wellLeaf(A, p[0], p[1] + 1, a, L, T(A.pick(['#3f6b2a', '#4f7d30', '#2f5a24', '#5d8a36'])), false);
      } else M.marigold(A, p[0], p[1] + 3, A.rr(4.6, 5.8), T, A.pick(['saffron', 'haldi', 'saffron']));
    });
    for (const p of [cord[0], cord[cord.length - 1]]) { for (let k = 0; k < 5; k++) A.stroke([p, [p[0] + A.rr(-3, 3), p[1] + A.rr(10, 18)]], 'chalk', T(k % 2 ? '#c63d2f' : '#edc94b'), { w: 1, p: 0.85, tout: 0.5 }); M.marigold(A, p[0], p[1], 6.4, T, 'sindoor'); }
  };

  // ------------------------------------------------------------ PORTFOLIO: six spouts, six streams, one tank
  /* the spouts in an arc on the wall, (cx, yTank) the middle of the tank's lip.  Returns the stream paths. */
  M.wellSpoutPts = function (cx, yTank) {
    const out = [];
    for (let i = 0; i < 6; i++) {
      const t = (i - 2.5) / 2.5, x = cx + t * 118, y = yTank - 176 - 34 * (1 - t * t);
      out.push([x, y]);
    }
    return out;
  };
  M.wellStreamPath = function (A, sp, cx, yTank, i) {
    // the water leaves the mouth with a little throw, then gravity has it: it falls nearly straight into the tank
    const t = (i - 2.5) / 2.5, ex = cx + t * 104 + 3, out = sp[0] + t * 9 + 3;
    return A.spline([[sp[0], sp[1] + 7], [out, sp[1] + 20], [sp[0] + (ex - sp[0]) * 0.6 + t * 6 + 1, sp[1] + (yTank - sp[1]) * 0.5], [ex, yTank + 6]], false, 2);
  };
  M.wellSpouts = function (A, cx, yTank, T) {
    T = T || I;
    const pts = M.wellSpoutPts(cx, yTank), st = T('#e0c08a'), line = T('#2c1a10');
    // a carved band behind them, the arc of a frieze of lotus petals
    const band = A.spline(pts.map(p => [p[0], p[1] - 16]), false, 2);
    A.stroke(band, 'side', T('#9a6430'), { w: 10, p: 0.35 });
    // the streams first, so the spout lips sit over them
    pts.forEach((p, i) => {
      const path = M.wellStreamPath(A, p, cx, yTank, i), n = path.length, e = path[n - 1];
      // a rope of water, thick as it leaves the mouth, its own shadow on the wall behind it
      A.stroke(path.map(q => [q[0] + 5, q[1] + 3]), 'side', T('#7a5a3a'), { w: 12, p: 0.2 });
      // the stone shows through it: water is laid on thin, a cool body and a paler core that wavers
      const wav = path.map((q, k) => [q[0] + 1.2 * Math.sin(k / 3.4 + i), q[1]]);
      A.stroke(path, 'side', T('#5c9cb0'), { w: 10, p: 0.5, tin: 0.04, tout: 0 });
      A.stroke(wav, 'chalk', T('#a6d2da'), { w: 4.6, p: 0.6, tin: 0.04, tout: 0 });
      // drops shaken loose from it, low down
      for (let k = 0; k < 6; k++) { const q = path[Math.floor(n * A.rr(0.55, 0.95))], sd = A.chance(0.5) ? -1 : 1; A.stroke([[q[0] + sd * A.rr(6, 11), q[1]], [q[0] + sd * A.rr(6, 11), q[1] + A.rr(3, 6)]], 'chalk', T('#e4f0f0'), { w: A.rr(1.2, 2), p: 0.8 }); }
      // threads of light run down it and break, as falling water does
      for (const off of [-2.2, 0.4, 2.4]) {
        let k = A.ri(0, 4);
        while (k < n - 2) { const l = A.ri(4, 14), seg = path.slice(k, Math.min(n, k + l)).map(q => [q[0] + off, q[1]]); if (seg.length > 1) A.stroke(seg, 'chalk', T(off > 2 ? '#e0eef0' : '#f7f4ea'), { w: off > 0 && off < 1 ? 1.5 : 1, p: 0.8 }); k += l + A.ri(1, 6); }
      }
      // where it strikes the tank: a white burst of drops and a little foam
      for (let k = 0; k < 14; k++) { const a = -PI / 2 + A.rr(-1.4, 1.4), r = A.rr(4, 18); A.dot(e[0] + Math.cos(a) * r * 1.2, e[1] - 2 + Math.sin(a) * r * 0.8, 'chalk', T(A.chance(0.7) ? '#f4f8f4' : '#bfe0e4'), { w: A.rr(1.2, 2.8), p: 0.9 }); }
      A.fill(A.ellipse(e[0], e[1] + 2, 15, 4.4), 'side', T('#e8f2ee'), { w: 4, p: 0.55, passes: 1, ang: 0 });
      A.stroke(A.ellipse(e[0], e[1] + 3, 22, 5, 0, 0, PI), 'chalk', T('#d8ecea'), { w: 1.2, p: 0.6 });
    });
    // each spout: a makara's open mouth carved from one stone
    pts.forEach((p, i) => {
      const t = (i - 2.5) / 2.5, d = t < 0 ? -1 : 1;
      const blk = rect(p[0] - 13, p[1] - 14, p[0] + 13, p[1] + 2);
      A.fill(blk.map(q => [q[0] + 4, q[1] + 5]), 'side', T('#7a4a24'), { w: 8, p: 0.35, passes: 1 });
      solid(A, blk, st, { w: 2.6 });
      A.outline(blk, 'kajal', line, { closed: true, w: 0.8, p: 0.8 });
      const snout = A.spline([[p[0] - 9, p[1] - 4], [p[0] + d * 3, p[1] - 9], [p[0] + d * 12, p[1] - 2], [p[0] + d * 6, p[1] + 6], [p[0] - 6, p[1] + 4]], true, 0.6);
      solid(A, snout, A.mix(st, T('#f3e3c0'), 0.4), { w: 2 });
      A.outline(snout, 'kajal', line, { closed: true, w: 0.8, p: 0.85 });
      A.dot(p[0] + d * 3, p[1] + 3, 'chalk', T('#2a1a12'), { w: 3.6, len: 1.6, ang: 0, p: 1 });
      A.dot(p[0] - d * 2, p[1] - 6, 'kajal', line, { w: 1.6, p: 0.9 });
      A.stroke([[p[0] - 8, p[1] - 12], [p[0] + 8, p[1] - 12]], 'chalk', T('#f7ead0'), { w: 1.2, p: 0.7 });
    });
    return pts;
  };
  /* the tank: a stone trough on the ledge, its water seen a little from above.  (cx, yTank) the middle of its lip, w wide */
  M.wellTank = function (A, cx, yTank, w, yb, T) {
    T = T || I;
    const st = T('#d7b680'), line = T('#2c1a10'), x0 = cx - w / 2, x1 = cx + w / 2;
    A.fill(rect(x0 + 10, yTank, x1 + 22, yb + 4).map(p => p), 'side', T('#7a4a24'), { w: 12, p: 0.3, passes: 1 });
    const body = rect(x0, yTank + 8, x1, yb);
    solid(A, body, st, { w: 5, ang: 0.1 });
    M.floorWash(A, body, T('#6a4a2a'), (x, y) => 0.38 * sstep((y - yTank) / (yb - yTank)) + 0.2 * sstep((x - cx) / (w / 2)), 'mul');
    // panels carved in its face, each a little lotus
    for (let k = 0; k < 4; k++) {
      const px0 = x0 + 12 + k * (w - 24) / 4, px1 = px0 + (w - 24) / 4 - 8, pn = rect(px0, yTank + 20, px1, yb - 10);
      A.outline(pn, 'kajal', A.mix(line, st, 0.35), { closed: true, w: 0.7, p: 0.65 });
      A.stroke([[px0 + 1, yb - 11], [px1 - 1, yb - 11]], 'chalk', T('#f3e3c0'), { w: 1, p: 0.6 });
      const mx = (px0 + px1) / 2, my = (yTank + 20 + yb - 10) / 2;
      for (let a = -2.4; a <= -0.7; a += 0.42) A.stroke([[mx, my + 6], [mx + Math.cos(a) * 11, my + 6 + Math.sin(a) * 12]], 'chalk', T('#b8743a'), { w: 2.4, p: 0.75, tout: 0.4 });
    }
    // the lip, and the water held in it
    const lip = [[x0 - 6, yTank - 6], [x1 + 6, yTank - 6], [x1 + 4, yTank + 8], [x0 - 4, yTank + 8]];
    solid(A, lip, A.mix(st, T('#f3e3c0'), 0.35), { w: 3, ang: 0 });
    A.outline(lip, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    const wat = [[x0 + 2, yTank - 2], [x1 - 2, yTank - 2], [x1 - 4, yTank + 4], [x0 + 4, yTank + 4]];
    A.fill(wat, 'chalk', T('#2f6a6e'), { w: 2.4, p: 1, passes: 2 });
    for (let k = 0; k < 8; k++) { const xx = A.rr(x0 + 10, x1 - 30); A.stroke([[xx, yTank + 1], [xx + A.rr(8, 22), yTank + 1]], 'chalk', T('#cfe0e4'), { w: 0.9, p: 0.7 }); }
    A.outline(body, 'kajal', line, { closed: true, w: 1, p: 0.85 });
    // a brass lota and a clay pot beside it
    potAt(A, x1 + 30, yb, 18, T('#c2602e'), T);
    lotaAt(A, x0 - 26, yb, 14, T);
  };
  function potAt(A, x, yb, r, c, T) {
    const pot = A.spline([[x - r * 0.45, yb], [x - r * 1.05, yb - r * 0.8], [x - r * 0.9, yb - r * 1.5], [x - r * 0.5, yb - r * 1.75], [x - r * 0.55, yb - r * 2.05], [x + r * 0.55, yb - r * 2.05], [x + r * 0.5, yb - r * 1.75], [x + r * 0.9, yb - r * 1.5], [x + r * 1.05, yb - r * 0.8], [x + r * 0.45, yb]], true, 0.8);
    solid(A, pot, c, { w: 3 });
    M.floorWash(A, pot, T('#4a2a1a'), (xx) => 0.45 * sstep((xx - x) / r + 0.2), 'mul');
    A.stroke(A.ellipse(x, yb - r * 1.2, r * 0.95, r * 0.18, 0, 0.2, 2.9), 'chalk', T('#f1dfa6'), { w: 1.2, p: 0.8 });
    A.stroke(A.ellipse(x, yb - r * 1.0, r * 0.98, r * 0.18, 0, 0.2, 2.9), 'chalk', T('#f1dfa6'), { w: 1, p: 0.7 });
    A.outline(pot, 'kajal', T('#2a1810'), { closed: true, w: 0.9, p: 0.85 });
  }
  function lotaAt(A, x, yb, r, T) {
    const lota = A.spline([[x - r * 0.5, yb], [x - r, yb - r * 0.7], [x - r * 0.75, yb - r * 1.4], [x - r * 0.35, yb - r * 1.6], [x - r * 0.5, yb - r * 1.95], [x + r * 0.5, yb - r * 1.95], [x + r * 0.35, yb - r * 1.6], [x + r * 0.75, yb - r * 1.4], [x + r, yb - r * 0.7], [x + r * 0.5, yb]], true, 0.8);
    A.fill(lota, 'gold', T('#d4a437'), { w: 3, p: 1, passes: 2 });
    M.floorWash(A, lota, T('#5a3a14'), (xx) => 0.4 * sstep((xx - x) / r + 0.1), 'mul');
    A.stroke([[x - r * 0.55, yb - r * 1.2], [x - r * 0.3, yb - r * 0.5]], 'chalk', T('#fff3c8'), { w: 1.4, p: 0.8 });
    A.outline(lota, 'kajal', T('#2a1810'), { closed: true, w: 0.8, p: 0.8 });
  }
  M.wellPot = potAt; M.wellLota = lotaAt;

  // ------------------------------------------------------------ PRAGYAN: paper lanterns on a string across the well
  /* pts: where each lantern hangs; returns nothing.  Each is a ribbed paper globe with a cap and a tassel */
  const LCOLS = [['#f0a07a', '#d8606a'], ['#f3c46a', '#e88e1e'], ['#e8a9a4', '#c2304e'], ['#f0c3a0', '#de5a22'], ['#f3d690', '#d4a437']];
  function lantern(A, p, cx, cy, r, i, T, cols) {
    A.stroke([p, [cx, cy - r]], 'kajal', T('#3a2420'), { w: 0.7, p: 0.8 });
    const [c0, c1] = cols[i % cols.length].map(T);
    const glob = A.roughen(A.ellipse(cx, cy, r, r * 1.12), 0.25, 6, true);
    A.fill(glob, 'pastel', c0, { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: 1.4 });
    // lit from within: paler at the heart, the ribs dark against it
    M.floorWash(A, glob, T('#fff3c0'), (x, y) => 0.6 * Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 0.9) / r * 1.2), 'over');
    M.floorWash(A, glob, c1, (x, y) => 0.5 * sstep(Math.hypot(x - cx, y - cy) / r - 0.45), 'over');
    for (const k of [-0.62, -0.25, 0.25, 0.62]) A.stroke(A.spline([[cx + k * r * 0.4, cy - r * 1.08], [cx + k * r * 1.05, cy], [cx + k * r * 0.4, cy + r * 1.1]], false, 1), 'kajal', A.mix(c1, '#3a1a1a', 0.4), { w: 0.6, p: 0.6 });
    A.outline(glob, 'kajal', A.mix(c1, '#2a1010', 0.5), { closed: true, w: 0.8, p: 0.75 });
    A.fill(rect(cx - r * 0.42, cy - r * 1.2, cx + r * 0.42, cy - r * 1.02), 'chalk', T('#7a3a2a'), { w: 1.6, p: 1, passes: 1 });
    A.fill(rect(cx - r * 0.36, cy + r * 1.04, cx + r * 0.36, cy + r * 1.2), 'chalk', T('#7a3a2a'), { w: 1.6, p: 1, passes: 1 });
    for (let k = 0; k < 4; k++) A.stroke([[cx + (k - 1.5) * 1.6, cy + r * 1.2], [cx + (k - 1.5) * 2.4, cy + r * 1.2 + A.rr(8, 13)]], 'chalk', T(k % 2 ? '#c63d2f' : '#edc94b'), { w: 0.9, p: 0.85, tout: 0.5 });
  }
  /* a cord from `from` to `to` sagging by `sag`, with n lanterns spaced along it; returns [[cx, cy, r]] */
  M.wellLanterns = function (A, from, to, sag, n, T, o) {
    o = o || {}; T = T || I;
    const cord = A.spline([from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + sag], to], false, 3);
    A.stroke(cord.map(p => [p[0] + 2, p[1] + 5]), 'side', T('#5a3a3a'), { w: 3, p: 0.18 });
    A.stroke(cord, 'kajal', T('#3a2420'), { w: 1, p: 0.85 });
    const path = A.resample(cord, 4, false), out = [];
    for (let i = 0; i < n; i++) {
      const p = path[Math.round((i + 0.5) / n * (path.length - 1))], hang = A.rr(10, 18), cx = p[0], cy = p[1] + hang + 16, r = A.rr(11, 14);
      lantern(A, p, cx, cy, r, i, T, o.cols || LCOLS);
      out.push([cx, cy, r]);
    }
    return out;
  };
  /* the same, at places fixed in advance (so a glow drawn elsewhere sits on them): s = {from, to, sag}, a quadratic
     through the middle point; ls = [{top, x, y, r}] */
  M.wellLanternsAt = function (A, s, ls, T, o) {
    o = o || {}; T = T || I;
    const c = [2 * ((s.from[0] + s.to[0]) / 2) - (s.from[0] + s.to[0]) / 2, 2 * ((s.from[1] + s.to[1]) / 2 + s.sag) - (s.from[1] + s.to[1]) / 2], cord = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, u = 1 - t; cord.push([u * u * s.from[0] + 2 * u * t * c[0] + t * t * s.to[0], u * u * s.from[1] + 2 * u * t * c[1] + t * t * s.to[1]]); }
    A.stroke(cord.map(p => [p[0] + 3, p[1] + 7]), 'side', T('#5a3a3a'), { w: 3, p: 0.18 });
    A.stroke(cord, 'kajal', T('#3a2420'), { w: 1.1, p: 0.85 });
    ls.forEach((l, i) => lantern(A, l.top, l.x, l.y, l.r, i, T, o.cols || LCOLS));
  };

  // ------------------------------------------------------------ A PIGEON SITTING, big enough to read on a stair
  M.wellPigeonSit = function (A, x, y, s, flip, c, o) {
    o = o || {};
    const f = flip ? -1 : 1, P = (u, v) => [x + u * s * f, y + v * s];
    const body = c || '#8a93a0', dark = o.dark || '#3c4450', light = o.light || '#c8ced2';
    A.fill(A.ellipse(x + 3, y + 0.5, s * 0.55, s * 0.08), 'side', '#3a2a1a', { w: 4, p: 0.22, passes: 1, ang: 0 });
    const tail = [P(-0.5, -0.3), P(-0.92, -0.24), P(-0.88, -0.13), P(-0.42, -0.15)];
    A.fill(tail, 'chalk', A.mix(body, dark, 0.5), { w: 1.6, p: 1, passes: 1 });
    const bd = A.spline([P(-0.6, -0.28), P(-0.3, -0.5), P(0.12, -0.56), P(0.36, -0.5), P(0.42, -0.24), P(0.2, -0.05), P(-0.28, -0.07)], true, 0.6);
    A.fill(bd, 'pastel', body, { w: 2.4, p: 1, passes: 2 });
    M.floorWash(A, bd, dark, (xx, yy) => 0.3 * sstep((yy - y + s * 0.3) / (s * 0.3)), 'mul');
    // the folded wing, darker, with its two black bars
    const wg = A.spline([P(-0.5, -0.31), P(-0.12, -0.5), P(0.2, -0.43), P(0.06, -0.2), P(-0.4, -0.17)], true, 0.6);
    A.fill(wg, 'chalk', A.mix(body, light, 0.25), { w: 2, p: 0.8, passes: 1 });
    A.stroke([P(-0.2, -0.38), P(0.04, -0.33)], 'kajal', dark, { w: 1.3, p: 0.85 });
    A.stroke([P(-0.27, -0.29), P(-0.03, -0.24)], 'kajal', dark, { w: 1.3, p: 0.85 });
    // neck and head, the throat green and violet in the light
    const nk = A.spline([P(0.18, -0.5), P(0.28, -0.78), P(0.42, -0.88), P(0.56, -0.8), P(0.52, -0.56), P(0.38, -0.44)], true, 0.6);
    A.fill(nk, 'pastel', A.mix(body, dark, 0.1), { w: 2, p: 1, passes: 2 });
    A.stroke([P(0.3, -0.6), P(0.48, -0.64)], 'chalk', '#5f9a7a', { w: 2.2, p: 0.8 });
    A.stroke([P(0.28, -0.53), P(0.46, -0.55)], 'chalk', '#9a6aa0', { w: 1.8, p: 0.7 });
    A.dot(...P(0.47, -0.77), 'chalk', '#e8701e', { w: 2, p: 1 });
    A.dot(...P(0.47, -0.77), 'kajal', '#1a1210', { w: 0.9, p: 1 });
    A.stroke([P(0.55, -0.76), P(0.68, -0.72)], 'kajal', '#4a3a30', { w: 1.2, p: 0.9 });
    A.dot(...P(0.56, -0.79), 'chalk', '#f4f0e6', { w: 1.3, p: 0.9 });
    A.outline(bd, 'kajal', dark, { closed: true, w: 0.7, p: 0.55 });
    A.outline(nk, 'kajal', dark, { closed: true, w: 0.6, p: 0.45 });
    for (const u of [0.02, 0.14]) A.stroke([P(u, -0.07), P(u + 0.02, 0)], 'kajal', '#c8501c', { w: 1.1, p: 0.9 });
  };

  // ------------------------------------------------------------ BUNTING: a cord of small cloth flags, cut by hand, each its own size
  M.wellBunting = function (A, from, to, sag, T, o) {
    o = o || {}; T = T || I;
    const cols = o.cols || ['#f2a48a', '#e8607a', '#f6c46a', '#f7e6cc', '#de5a22', '#f08aa0'];
    const c = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 2 * sag], q = t => { const u = 1 - t; return [u * u * from[0] + 2 * u * t * c[0] + t * t * to[0], u * u * from[1] + 2 * u * t * c[1] + t * t * to[1]]; };
    const cord = []; for (let i = 0; i <= 60; i++) cord.push(q(i / 60));
    const n = o.n || Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / 34);
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.12) / n, t1 = (i + 0.88) / n, a = q(t0), b = q(t1), m = q((t0 + t1) / 2);
      const h = A.rr(22, 32), lean = A.rr(-4, 4), tip = [m[0] + lean, m[1] + h];
      const fl = A.roughen([a, b, tip], 0.8, 8, true), col = T(cols[i % cols.length]);
      A.fill(fl.map(p => [p[0] + 3, p[1] + 6]), 'side', T('#4a2a2a'), { w: 8, p: 0.12, passes: 1 });
      A.fill(fl, 'pastel', col, { w: 3, p: 0.95, passes: 2 });
      // the cloth turns away from the light on one side, and its edge is hemmed in a darker thread
      M.floorWash(A, fl, T('#5a2a30'), (x) => 0.28 * sstep((x - m[0]) / 10 + 0.4), 'mul');
      A.stroke([a, [(a[0] + tip[0]) / 2 + 1, (a[1] + tip[1]) / 2], tip], 'chalk', T('#fff4e0'), { w: 1, p: 0.45 });
      A.outline(fl, 'kajal', T('#3a2020'), { closed: true, w: 0.7, p: 0.7 });
      if (i % 3 === 1) A.dot(m[0] + lean * 0.4, m[1] + h * 0.45, 'chalk', T('#f7f2e7'), { w: 2.4, p: 0.85 });
    }
    A.stroke(cord.map(p => [p[0] + 3, p[1] + 6]), 'side', T('#5a3a3a'), { w: 3, p: 0.14 });
    A.stroke(cord, 'kajal', T('#3a2420'), { w: 1, p: 0.85 });
  };

  // ------------------------------------------------------------ THE HACKATHONS: two small gold cups on a carved stand
  M.wellCups = function (A, x, yb, s, T) {
    T = T || I;
    const line = T('#2a1a0c'), st = T('#d8a07a');
    const stand = [[x - 52 * s, yb], [x + 52 * s, yb], [x + 46 * s, yb - 14 * s], [x - 46 * s, yb - 14 * s]];
    solid(A, stand, st, { w: 3 }); M.floorWash(A, stand, T('#5a2a2a'), (xx) => 0.35 * sstep((xx - x) / (52 * s) + 0.3), 'mul');
    A.stroke([[x - 45 * s, yb - 12.5 * s], [x + 45 * s, yb - 12.5 * s]], 'chalk', T('#f4d2bd'), { w: 1.4, p: 0.8 });
    A.outline(stand, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    const cup = (cx, h) => {
      const by = yb - 14 * s, k = h / 46;
      const foot = A.spline([[cx - 11 * k, by], [cx - 8 * k, by - 4 * k], [cx - 3 * k, by - 7 * k], [cx + 3 * k, by - 7 * k], [cx + 8 * k, by - 4 * k], [cx + 11 * k, by]], true, 0.6);
      const stem = rect(cx - 2.4 * k, by - 18 * k, cx + 2.4 * k, by - 6 * k);
      const bowl = A.spline([[cx - 15 * k, by - 44 * k], [cx + 15 * k, by - 44 * k], [cx + 13 * k, by - 30 * k], [cx + 6 * k, by - 20 * k], [cx, by - 18 * k], [cx - 6 * k, by - 20 * k], [cx - 13 * k, by - 30 * k]], true, 0.6);
      for (const sg of [-1, 1]) A.stroke(A.spline([[cx + sg * 13 * k, by - 40 * k], [cx + sg * 22 * k, by - 38 * k], [cx + sg * 20 * k, by - 28 * k], [cx + sg * 10 * k, by - 25 * k]], false, 0.6), 'gold', 'gold', { w: 2.2 * k, p: 0.95 });
      for (const q of [foot, stem, bowl]) { A.fill(q, 'gold', 'gold', { w: 2.4 * k, p: 1, passes: 2, gap: 0.4 }); M.floorWash(A, q, T('#6a3a10'), (xx) => 0.42 * sstep((xx - cx) / (15 * k) + 0.25), 'mul'); A.outline(q, 'kajal', line, { closed: true, w: 0.75, p: 0.8 }); }
      A.stroke([[cx - 9 * k, by - 40 * k], [cx - 6 * k, by - 26 * k]], 'chalk', T('#fff6d8'), { w: 1.6 * k, p: 0.85 });
      A.stroke(A.ellipse(cx, by - 44 * k, 15 * k, 2.8 * k, 0, 0, TAU), 'kajal', line, { w: 0.7, p: 0.75 });
      A.fill(A.ellipse(cx, by - 44 * k, 13.5 * k, 2 * k), 'chalk', T('#8a5a1a'), { w: 1.2, p: 0.9, passes: 1 });
      H().rosette(A, [cx, by - 32 * k], 3.2 * k, T('#c63d2f'), 6, 'gold');
      M.goldGlints && A.dot(cx - 8 * k, by - 36 * k, 'chalk', '#fffbe8', { w: 1.6 * k, p: 0.9 });
    };
    cup(x - 21 * s, 46 * s); cup(x + 22 * s, 40 * s);
    // a marigold laid between them
    M.marigold(A, x + 1, yb - 18 * s, 5 * s, T, 'saffron');
    return { box: [x - 60 * s, yb - 70 * s, x + 60 * s, yb] };
  };

  // ------------------------------------------------------------ DELTA FORCE: a pole for a flag, in a stone socket
  M.wellPole = function (A, x, yb, h, T) {
    T = T || I;
    const line = T('#1e1410');
    const sock = [[x - 20, yb], [x + 20, yb], [x + 15, yb - 22], [x - 15, yb - 22]];
    solid(A, sock, T('#b8a090'), { w: 3 }); M.floorWash(A, sock, T('#3a2a30'), (xx) => 0.4 * sstep((xx - x) / 20 + 0.3), 'mul');
    A.outline(sock, 'kajal', line, { closed: true, w: 0.9, p: 0.85 });
    const pole = [[x - 3, yb - 22], [x + 3, yb - 22], [x + 2.2, yb - h], [x - 2.2, yb - h]];
    A.fill(pole, 'chalk', T('#8a5a30'), { w: 2, p: 1, passes: 2 });
    for (let v = 30; v < h - 10; v += 26) A.stroke([[x - 2.6, yb - v], [x + 2.6, yb - v - 1]], 'kajal', line, { w: 0.6, p: 0.7 });
    A.stroke([[x - 1.4, yb - 24], [x - 1.2, yb - h + 2]], 'chalk', T('#d8a868'), { w: 0.8, p: 0.6 });
    A.outline(pole, 'kajal', line, { closed: true, w: 0.7, p: 0.8 });
    H().kalash(A, x, yb - h, 16, { c: 'gold', base: T('#8a5a30') });
    // a marigold string wound round its foot
    M.garland(A, [[x - 14, yb - 26], [x + 2, yb - 20], [x + 16, yb - 28]], T, { r: 4.4, step: 7 });
    return [x + 2, yb - h + 8];
  };
  /* the flag: a long triangle (a delta) streaming from the pole, three phases of the wind. (x, y) where it is tied */
  M.wellFlag = function (A, x, y, s, ph, T) {
    T = T || I;
    const top = [], bot = [], n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n, wv = Math.sin(t * 5.2 - ph * 2.1) * s * 0.06 * (0.25 + t), dr = s * 0.12 * t * t;
      top.push([x + s * t, y + wv + dr]);
      bot.push([x + s * t, y + s * 0.42 * (1 - t) + wv * 1.15 + dr + s * 0.01 * t]);
    }
    const poly = top.concat(bot.slice().reverse());
    solid(A, poly, T('#c8321c'), { w: Math.max(1.6, s * 0.06), ang: 0.15 });
    A.withMask(poly, () => {
      A.stroke(top.map((p, i) => [p[0], p[1] + s * 0.05 * (1 - i / n)]), 'chalk', T('#e6b422'), { w: Math.max(1, s * 0.045), p: 0.95 });
      A.stroke(bot.map((p, i) => [p[0], p[1] - s * 0.05 * (1 - i / n)]), 'chalk', T('#e6b422'), { w: Math.max(1, s * 0.045), p: 0.95 });
      for (let i = 2; i < n - 2; i += 3) A.stroke([[top[i][0], top[i][1] + 2], [bot[i][0], bot[i][1] - 2]], 'side', T('#6a1810'), { w: 3, p: 0.25 });
      // a small gold sun at the hoist
      H().rosette(A, [x + s * 0.18, y + s * 0.2], s * 0.07, T('#e6b422'), 8, 'gold');
    });
    A.outline(poly, 'kajal', T('#3a0e08'), { closed: true, w: 0.8, p: 0.75, pull: 40 });
  };

  // ------------------------------------------------------------ NIT TRICHY: a lotus kund, a small stepped tank
  M.wellKund = function (A, cx, yb, w, T) {
    T = T || I;
    /* seen from the front and a little above: the far wall of the little tank with its steps going down, a square of
       water with a lotus standing in it, and a low carved parapet in front */
    const line = T('#0e1418'), st = T('#c8d2cc'), x0 = cx - w / 2, x1 = cx + w / 2, h = 104, py = yb - 34;
    // the far rim and the three steps down the far side, each paler where it catches the light
    let a = x0 + 8, b = x1 - 8, y = yb - h;
    const rim = [[a - 4, y - 8], [b + 4, y - 8], [b, y], [a, y]];
    solid(A, rim, A.mix(st, T('#f0f2e8'), 0.4), { w: 3, ang: 0 }); A.outline(rim, 'kajal', line, { closed: true, w: 0.9, p: 0.8 });
    for (let k = 0; k < 4; k++) {
      const rs = [[a, y], [b, y], [b, y + 10], [a, y + 10]];
      solid(A, rs, A.mix(st, T('#2a3a40'), 0.42 + k * 0.08), { w: 2.6, ang: 1.5 });
      A.outline(rs, 'kajal', line, { closed: true, w: 0.6, p: 0.6 });
      a += 14; b -= 14; y += 10;
      if (k === 3) break;
      const tr = [[a - 14, y], [b + 14, y], [b, y + 6], [a, y + 6]];
      solid(A, tr, A.mix(st, T('#eef0e8'), 0.25 - k * 0.06), { w: 2.4, ang: 0 });
      A.outline(tr, 'kajal', line, { closed: true, w: 0.6, p: 0.7 });
      if (k === 1) M.wellMoss(A, [[a + 4, y + 1], [a + 60, y + 1]], { moss: ['#3a4a22', '#4d5a2a', '#2f3c1c'], mossTip: ['#8fa040'] }, { k: 0.8, h: 3 });
      y += 6;
    }
    // the water: dark, with the lamp-light and the stars in it
    const wat = [[a, y], [b, y], [b, py], [a, py]];
    A.fill(wat, 'chalk', T('#1e4446'), { w: 2.6, p: 1, passes: 2, ang: 0 });
    M.floorWash(A, wat, '#6a9a90', (xx, yy) => 0.35 * Math.max(0, 1 - Math.hypot((xx - cx + 40) / 90, (yy - y) / 14)), 'over');
    for (let k = 0; k < 14; k++) { const xx = A.rr(a + 4, b - 20); A.stroke([[xx, A.rr(y + 3, py - 2)], [xx + A.rr(6, 18), A.rr(y + 3, py - 2)]], 'chalk', T('#a8d0d8'), { w: 0.9, p: 0.55 }); }
    M.lotusPad(A, cx - 70, py - 6, 15, { rot: 0.4 }); M.lotusPad(A, cx + 64, py - 5, 12, { rot: 2.2 }); M.lotusPad(A, cx - 30, py - 3, 10, { rot: 4 });
    // the lotus, standing up out of it
    M.lotus(A, cx + 6, py - 16, 52, 'open', { stem: 26, bend: -5 });
    M.lotus(A, cx - 62, py - 22, 24, 'bud', { stem: 30, bend: 7 });
    M.lotus(A, cx + 74, py - 14, 30, 'half', { stem: 22, bend: -4 });
    // the parapet in front: a band of carved lotus petals between two mouldings, finials at its ends
    const par = [[x0, py], [x1, py], [x1, yb], [x0, yb]];
    solid(A, par, st, { w: 4, ang: 0.1 });
    M.floorWash(A, par, T('#1a2430'), (xx, yy) => 0.25 * sstep((yy - py) / 34) + 0.22 * sstep((xx - cx) / (w / 2)), 'mul');
    A.stroke([[x0 + 2, py + 2], [x1 - 2, py + 2]], 'chalk', T('#f4f4ea'), { w: 2, p: 0.85 });
    hl(A, [x0, py + 8], [x1, py + 8], 'kajal', line, { w: 0.7, p: 0.7 }); hl(A, [x0, yb - 7], [x1, yb - 7], 'kajal', line, { w: 0.7, p: 0.7 });
    for (let x = x0 + 6; x < x1 - 8; x += 14) { const pet = [[x, yb - 8], [x + 2, yb - 18], [x + 7, yb - 25], [x + 12, yb - 18], [x + 14, yb - 8]]; A.outline(pet, 'kajal', line, { w: 0.6, p: 0.6 }); A.dot(x + 7, yb - 15, 'chalk', T('#c8321c'), { w: 1.6, p: 0.7 }); }
    A.outline(par, 'kajal', line, { closed: true, w: 1, p: 0.85 });
    for (const fx of [x0 + 6, x1 - 6]) H().kalash(A, fx, py, 9, { c: 'gold', base: st });
    return { box: [x0 - 6, yb - h - 70, x1 + 6, yb] };
  };

  // ------------------------------------------------------------ the clay lamp (the walking lamp, and the ones in the alcoves)
  /* (x, y): the middle of its foot; s: size (1 = 26 long); ph: which flicker of the flame (0, 1, 2) */
  M.wellDiya = function (A, x, y, s, ph, o) {
    o = o || {};
    const clay = o.c || '#a8482e', dark = '#5a2414', line = '#1e0e08';
    const bowl = A.spline([[x - 13 * s, y - 7 * s], [x - 7 * s, y - 1 * s], [x, y], [x + 8 * s, y - 1 * s], [x + 14 * s, y - 6 * s], [x + 19 * s, y - 10 * s], [x + 11 * s, y - 9 * s], [x, y - 8 * s], [x - 12 * s, y - 8.5 * s]], true, 0.4);
    A.fill(bowl, 'pastel', clay, { w: 2.4 * s, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.stroke([[x - 11 * s, y - 4 * s], [x + 10 * s, y - 3.4 * s]], 'side', dark, { w: 2.6 * s, p: 0.5 });
    A.fill(A.ellipse(x - 1 * s, y - 8.6 * s, 11 * s, 1.8 * s), 'chalk', '#3a1a0a', { w: 1.4 * s, p: 0.95, passes: 1 });
    A.stroke([[x - 9 * s, y - 7.2 * s], [x + 6 * s, y - 7.4 * s]], 'chalk', '#e8a070', { w: 0.9 * s, p: 0.7 });
    A.outline(bowl, 'kajal', line, { closed: true, w: 0.8 * s, p: 0.85 });
    // the flame on the wick at the spout, leaning as the air in the well moves
    const fx = x + 15 * s, fy = y - 10.5 * s, lean = [-0.12, 0.08, -0.02][ph % 3], h = 15 * s * [1, 0.88, 1.08][ph % 3];
    const tear = (k, wk) => { const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18, a = t * TAU, v = (1 - Math.cos(a)) / 2; pts.push([fx + Math.sin(a) * h * 0.26 * wk * Math.pow(Math.sin(PI * v * 0.5 + 0.0001), 0.8) + lean * h * v * v, fy - v * h * k]); } return pts; };
    A.fill(tear(1, 1), 'chalk', '#e2622a', { w: Math.max(1, h * 0.2), p: 0.85, reach: 1.7, passes: 2, gap: 0.45, ang: 1.5 });
    A.fill(tear(0.8, 0.7), 'chalk', '#f3bd45', { w: Math.max(0.9, h * 0.16), p: 1, reach: 1.7, passes: 2, gap: 0.42, ang: 1.5 });
    A.fill(tear(0.5, 0.42), 'chalk', '#fff6dc', { w: Math.max(0.7, h * 0.12), p: 1, reach: 1.7, passes: 1, ang: 1.5 });
    A.stroke([[fx, fy + 0.5], [fx + lean * 2, fy - 2.5 * s]], 'kajal', '#2a1206', { w: 0.8 * s, p: 0.9 });
  };
  /* its glow: a pool of light rubbed in round the flame, for the glow layer */
  M.wellDiyaGlow = function (A, x, y, R, k) {
    M.lampGlow(A, x, y, Math.min(39, R), k, { c0: '#b4561e', c1: '#e88e1e', c2: '#f3bd45', c3: '#fff3c8' });
  };
  /* the inside of an alcove lit by its lamp: warm on the back, falling off up into the arch */
  M.wellNicheGlow = function (A, x, yb, w, h) {
    const ar = H().arch(x, yb, w, h, 3, 0.1, 0.6);
    M.floorWash(A, ar, '#d8742a', (px, py) => 0.75 * Math.max(0, 1 - Math.hypot((px - x) / (w * 0.7), (py - yb + 12) / (h * 0.75))), 'over');
    M.floorWash(A, ar, '#f3bd45', (px, py) => 0.7 * Math.max(0, 1 - Math.hypot((px - x) / (w * 0.4), (py - yb + 14) / (h * 0.4))), 'over');
    // the lit sill and the soft light that spills out onto the ledge
    M.floorWash(A, rect(x - w, yb - 6, x + w, yb + 26), '#e88e1e', (px, py) => 0.45 * Math.max(0, 1 - Math.hypot((px - x) / w, (py - yb) / 22)), 'over');
  };
  /* the glow round a whole string of lanterns, for the glow layer */
  M.wellLanternGlow = function (A, pts, k) {
    for (const p of pts) M.lampGlow(A, p[0], p[1], Math.min(38, p[2] * 2.8), k, { c0: '#b4561e', c1: '#e88e1e', c2: '#f3bd45', c3: '#fff3c8' });
  };
})();
