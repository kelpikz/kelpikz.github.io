(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE YEAR GAUGE
       M.w8Gauge(A, o)   a tall measuring staff of carved stone, as on the ghats and the old dams, made the Mewar way:
                         a kalash and a lotus capital on top, then one carved band for every year from o.years[0] down,
                         each with a blank sunk face for its numerals (the page letters them), month nicks and quarter
                         grooves cut in the right edge, painted fillets between the years, then the wet stone of
                         'Before' and the plinth.  o.marks: flood marks [{id, year, month, kind}], kind 'sindoor' |
                         'gold' | 'soft', each a painted line across the staff with a small plaque fixed beside it.
                         o = { w, h, years: [2026 .. 2019], marks }.  Returns { years: [{label, y}], marks: [{id, y, kind}],
                         faces: [{label, x, y, w, h}] } in o's units.
     ======================================================================== */
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const C = {
    stone: '#e4cfa2', lit: '#f4e6c4', deep: '#9a7a52', line: '#2a1a10', wet: '#6e6450', moss: '#4a5a2a',
    sindoor: '#c4301c', neel: '#2a4c9c', haldi: '#e6a822', lime: '#f6eedc', leaf: '#3f7a3a', gold: '#e2b84a'
  };

  // chalk laid over a rubbed ground of the same colour: solid, no paper showing through the tooth
  function solidC(A, poly, c, o) { A.ground(poly, c, { w: 6, edge: 0, rub: 2, top: 0.5 }); A.fill(poly, 'chalk', c, Object.assign({ w: 1.6, p: 1, passes: 2 }, o || {})); }
  // a sunk face: the cut edge in shade on top and at the left, the light catching the bottom and the right edge
  function sunk(A, x0, y0, x1, y1, ground) {
    A.ground(rect(x0, y0, x1, y1), ground, { w: 8, edge: 0, rub: 3, c2: A.mix(ground, C.deep, 0.12), top: 0.5 });
    M.floorWash(A, rect(x0, y0, x1, y1), C.deep, (x, y) => 0.5 * (1 - sstep((y - y0) / 3.2)) + 0.4 * (1 - sstep((x - x0) / 3)), 'mul');
    A.stroke([[x0 + 0.6, y1 - 0.5], [x1 - 0.5, y1 - 0.5], [x1 - 0.5, y0 + 0.8]], 'chalk', C.lit, { w: 0.8, p: 0.85 });
    A.outline(rect(x0, y0, x1, y1), 'kajal', C.line, { closed: true, w: 0.5, p: 0.75, pull: 20 });
  }
  // the carved frame round a sunk face: a raised moulding lit on the top and left, a row of beads above and below,
  // a little four-petalled flower at each corner, a lotus bud over the middle.  It stays outside the face.
  function frame(A, x0, y0, x1, y1, accent) {
    const m = 3.6, cxm = (x0 + x1) / 2;
    A.stroke([[x0 - m + 0.6, y1 + m - 0.6], [x0 - m + 0.6, y0 - m + 0.6], [x1 + m - 0.6, y0 - m + 0.6]], 'chalk', C.lit, { w: 0.9, p: 0.85 });
    A.stroke([[x1 + m - 0.6, y0 - m + 0.6], [x1 + m - 0.6, y1 + m - 0.6], [x0 - m + 0.6, y1 + m - 0.6]], 'chalk', A.mix(C.deep, C.stone, 0.3), { w: 0.9, p: 0.8 });
    for (let x = x0 + 2.2; x < x1 - 1.5; x += 3.6) for (const y of [y0 - m / 2, y1 + m / 2]) { A.dot(x + 0.3, y + 0.35, 'chalk', C.deep, { w: 1.3, p: 0.7 }); A.dot(x, y, 'chalk', C.lime, { w: 1.05, p: 0.95 }); }
    for (const [x, y] of [[x0 - m / 2, y0 - m / 2], [x1 + m / 2, y0 - m / 2], [x0 - m / 2, y1 + m / 2], [x1 + m / 2, y1 + m / 2]]) {
      for (let q = 0; q < 4; q++) { const a = q * PI / 2 + PI / 4; A.dot(x + Math.cos(a) * 1.25, y + Math.sin(a) * 1.25, 'chalk', accent, { w: 1.35, p: 1 }); }
      A.dot(x, y, 'chalk', C.haldi, { w: 0.9, p: 1 });
    }
    const bud = A.spline([[cxm - 4.4, y0 - m], [cxm - 2.8, y0 - m - 3], [cxm, y0 - m - 6.4], [cxm + 2.8, y0 - m - 3], [cxm + 4.4, y0 - m]], true, 0.4);
    A.fill(bud, 'chalk', accent, { w: 0.7, p: 1, passes: 2 });
    A.stroke([[cxm, y0 - m - 0.4], [cxm, y0 - m - 4.6]], 'chalk', C.lime, { w: 0.4, p: 0.8 });
    A.outline(bud, 'kajal', C.line, { closed: true, w: 0.4, p: 0.8 });
    A.outline(rect(x0 - m, y0 - m, x1 + m, y1 + m), 'kajal', C.line, { closed: true, w: 0.5, p: 0.7, pull: 20 });
  }
  // a carved fillet between two years: a raised roll, painted in bands of red, lime and red
  function fillet(A, x0, x1, y, k) {
    const th = 7;
    solidC(A, rect(x0 - 2, y - th / 2, x1 + 2, y + th / 2), C.lime, { gap: 0.45, ang: 0.02 });
    for (const [dy, c] of [[-2.2, k % 2 ? C.neel : C.sindoor], [2.2, k % 2 ? C.neel : C.sindoor]]) A.stroke([[x0 - 1, y + dy], [x1 + 1, y + dy + A.rr(-0.2, 0.2)]], 'pastel', c, { w: 1.6, p: 1, tin: 0, tout: 0 });
    M.floorWash(A, rect(x0 - 2, y - th / 2, x1 + 2, y + th / 2), C.deep, (x, yy) => 0.35 * sstep((yy - y) / (th / 2)), 'mul');
    A.stroke([[x0 - 1, y - th / 2 + 0.5], [x1 + 1, y - th / 2 + 0.5]], 'chalk', '#fffaf0', { w: 0.6, p: 0.9 });
    A.outline(rect(x0 - 2, y - th / 2, x1 + 2, y + th / 2), 'kajal', C.line, { closed: true, w: 0.5, p: 0.75, pull: 30 });
  }
  // the emblem on a plaque: a doorway with a toran, two cups, a lotus.  No letters.
  function emblem(A, kind, cx, cy, r) {
    if (kind === 'sindoor') {
      const op = M.w8Arch(cx - r * 0.42, cx + r * 0.42, cy + r * 0.62, cy - r * 0.05, cy - r * 0.5, 5);
      A.fill(op, 'chalk', '#2a1208', { w: 1, p: 1, passes: 2 });
      A.outline(op, 'kajal', C.line, { closed: true, w: 0.4, p: 0.8 });
      for (let i = 0; i < 5; i++) { const x = cx - r * 0.42 + i * r * 0.21; A.fill([[x - r * 0.07, cy - r * 0.42], [x + r * 0.07, cy - r * 0.42], [x, cy - r * 0.18]], 'chalk', i % 2 ? C.haldi : C.leaf, { w: 0.6, p: 1, passes: 1 }); }
      A.stroke([[cx - r * 0.42, cy + r * 0.12], [cx + r * 0.42, cy + r * 0.16]], 'chalk', '#f04030', { w: 0.6, p: 1 });
    } else if (kind === 'gold') {
      for (const [dx, k] of [[-0.3, 1], [0.32, 0.86]]) {
        const x = cx + dx * r, top = cy - r * 0.42 * k, bot = cy + r * 0.55;
        const cup = A.spline([[x - r * 0.24 * k, top], [x + r * 0.24 * k, top], [x + r * 0.16, cy + r * 0.05], [x + r * 0.05, cy + r * 0.2], [x + r * 0.14, bot], [x - r * 0.14, bot], [x - r * 0.05, cy + r * 0.2], [x - r * 0.16, cy + r * 0.05]], true, 0.6);
        A.fill(cup, 'gold', C.gold, { w: 0.8, p: 1, passes: 2 });
        A.outline(cup, 'kajal', C.line, { closed: true, w: 0.4, p: 0.8 });
      }
    } else {
      for (let i = -2; i <= 2; i++) {
        const a = -PI / 2 + i * 0.42, tip = [cx + Math.cos(a) * r * 0.62, cy + r * 0.2 + Math.sin(a) * r * 0.66];
        const pet = A.spline([[cx, cy + r * 0.32], [cx + Math.cos(a - 0.3) * r * 0.36, cy + r * 0.2 + Math.sin(a - 0.3) * r * 0.4], tip, [cx + Math.cos(a + 0.3) * r * 0.36, cy + r * 0.2 + Math.sin(a + 0.3) * r * 0.4]], true, 0.6);
        A.fill(pet, 'chalk', Math.abs(i) === 2 ? '#e8a0a8' : '#f4c4c8', { w: 0.7, p: 1, passes: 2 });
        A.outline(pet, 'kajal', '#5a2a30', { closed: true, w: 0.35, p: 0.7 });
      }
      A.stroke([[cx - r * 0.5, cy + r * 0.42], [cx + r * 0.5, cy + r * 0.42]], 'chalk', C.leaf, { w: 1, p: 1 });
    }
  }
  // a small plaque fixed to the side of the staff at a flood mark: a cusped tablet, its ground in the mark's colour
  function plaque(A, x0, x1, y, kind) {
    const w = x1 - x0, h = w * 1.15, top = y - h * 0.55, op = M.w8Arch(x0, x1, top + h, top + h * 0.32, top, 7);
    const ground = kind === 'sindoor' ? C.sindoor : kind === 'gold' ? '#3e2410' : '#dfe4ea';
    // its shadow on the staff
    A.fill(op.map(p => [p[0] - 1.6, p[1] + 2]), 'side', '#3a2a1a', { w: 4, p: 0.35, passes: 1 });
    solidC(A, op, C.lime, { gap: 0.45 });
    const inner = M.w8Arch(x0 + 2.4, x1 - 2.4, top + h - 2.4, top + h * 0.34, top + 3, 7);
    A.ground(inner, ground, { w: 6, edge: 0, rub: 2, top: 0.5 });
    if (kind === 'gold') A.stroke(inner.slice(1, -1), 'gold', C.gold, { w: 0.9, p: 1 });
    emblem(A, kind, (x0 + x1) / 2, top + h * 0.58, w * 0.42);
    A.outline(inner, 'kajal', C.line, { closed: true, w: 0.45, p: 0.75 });
    A.outline(op, 'kajal', C.line, { closed: true, w: 0.6, p: 0.85, pull: 30 });
    // two pegs, and a string of marigolds over the top
    for (const px of [x0 + w * 0.2, x1 - w * 0.2]) A.dot(px, top + h * 0.86, 'chalk', '#5a3a1a', { w: 1.6, p: 1 });
    for (let i = 0; i <= 6; i++) { const u = i / 6, px = x0 + w * 0.08 + u * w * 0.84, py = top + h * 0.2 + Math.sin(PI * u) * h * 0.08; M.marigold ? M.marigold(A, px, py, 1.6, c => c, i % 2 ? 'haldi' : 'saffron') : A.dot(px, py, 'chalk', '#e88e1e', { w: 2.2, p: 1 }); }
  }

  M.w8Gauge = function (A, o) {
    const W = o.w, Hh = o.h, years = o.years, nY = years.length;
    const x0 = 10, x1 = 96, cx = (x0 + x1) / 2, capH = 150, band = 150, yTop = capH, yBefore = yTop + nY * band, yPl = Hh - 64;
    // solid: where the stone is whole, so the alpha there is made full (the tooth of the paper must not show through)
    const out = { years: [], marks: [], faces: [], solid: [rect(x0, yTop - 4, x1, yPl), rect(x0 - 14, yPl, x1 + 14, Hh - 4), rect(x0 - 6, capH - 14, x1 + 6, capH)] };

    // ---- the shaft: dressed sandstone, lime-washed, lit from the left; going down it is wet, stained, mossy
    const shaft = rect(x0, yTop - 4, x1, yPl);
    A.ground(shaft, C.stone, { w: 14, edge: 0, rub: 6, c2: C.lit, top: 0.4 });
    M.floorCloud(A, shaft, A.mix(C.stone, C.lit, 0.5), { scale: 40, seed: 3, thr: 0.56, soft: 0.25, p: 0.35, w: 7 });
    M.floorCloud(A, shaft, A.mix(C.stone, C.deep, 0.35), { scale: 30, seed: 8, thr: 0.62, soft: 0.25, p: 0.3, w: 6 });
    M.floorWash(A, shaft, C.deep, (x) => 0.32 * sstep((x - cx) / (x1 - cx) * 1.2), 'mul');
    // the water has stood at every height: tide lines, each a wavering band of stain darkest at its top edge, closer
    // together and darker toward the bottom, with salt dried out along some of them
    for (let y = yTop + 300; y < yPl; y += A.rr(14, 40) * (1 - 0.65 * (y - yTop) / (yPl - yTop))) {
      const d = (y - yTop) / (yPl - yTop), k = 0.1 + 0.4 * d, ph = A.rr(0, 9);
      const wav = x => y + Math.sin(x * 0.21 + ph) * 1.2 + Math.sin(x * 0.07 + ph * 0.3) * 1.8;
      M.floorWash(A, rect(x0, y - 4, x1, y + 14), C.wet, (x, yy) => { const e = yy - wav(x); return e < 0 ? 0 : k * (1 - sstep(e / (5 + 6 * d))); }, 'mul');
      if (A.rnd() < 0.45) for (let i = 0; i < 8; i++) { const x = A.rr(x0 + 3, x1 - 3); A.dot(x, wav(x) + A.rr(-0.4, 1), 'chalk', '#f4f0e4', { w: A.rr(0.5, 1.1), p: 0.6 }); }
    }
    // and the lower the stone, the longer it has been wet: a darkening all the way down, and streaks where it ran
    M.floorWash(A, shaft, C.wet, (x, y) => 0.32 * sstep((y - yTop - 420) / (yPl - yTop - 420)), 'mul');
    for (let i = 0; i < 26; i++) { const x = A.rr(x0 + 3, x1 - 3), y = A.rr(yTop + 500, yPl - 40); A.stroke([[x, y], [x + A.rr(-1, 1), y + A.rr(20, 90)]], 'chalk', C.wet, { w: A.rr(1, 2.4), p: 0.22, tout: 0.6 }); }
    M.floorWash(A, shaft, C.wet, (x, y) => 0.55 * sstep((y - yBefore + 80) / 260), 'mul');

    // ---- the years: a sunk blank face for the numerals, month nicks and quarter grooves cut in the right edge
    years.forEach((yr, k) => {
      const t = yTop + k * band, b = t + band;
      // alternate years take a thin wash of haldi, as the bands on a gauge are painted turn and turn about
      if (k % 2) M.floorWash(A, rect(x0, t, x1, b), C.haldi, () => 0.14, 'mul');
      const fx0 = x0 + 8, fx1 = 76, fy0 = t + 22, fy1 = t + 70;
      sunk(A, fx0, fy0, fx1, fy1, A.mix(C.lime, C.stone, 0.35 + 0.25 * k / nY));
      frame(A, fx0, fy0, fx1, fy1, k % 2 ? C.neel : C.sindoor);
      out.years.push({ label: String(yr), y: Math.round((fy0 + fy1) / 2) });
      out.faces.push({ label: String(yr), x: fx0, y: fy0, w: fx1 - fx0, h: fy1 - fy0 });
      // a little rosette under the face, alternately red and blue
      M.w8Rosette ? M.w8Rosette(A, (fx0 + fx1) / 2, fy1 + 30, 6, { accent: k % 2 ? C.neel : C.sindoor, gold: C.haldi, matte: true, line: C.line, lime: C.lime, stone: C.stone }) : 0;
      for (let m = 1; m < 12; m++) {
        const y = t + m * band / 12, q = m % 3 === 0;
        A.stroke([[x1 - (q ? 15 : 8), y], [x1 - 1, y + 0.2]], 'kajal', A.mix(C.line, C.stone, q ? 0.15 : 0.35), { w: q ? 0.7 : 0.45, p: 0.8 });
        if (q) A.stroke([[x1 - 15, y + 0.9], [x1 - 1, y + 1.1]], 'chalk', C.lit, { w: 0.5, p: 0.7 });
      }
      if (k > 0) fillet(A, x0, x1, t, k);
    });
    fillet(A, x0, x1, yBefore, nY);

    // ---- 'Before': below the last year the stone is old and has been under water: one more blank face, moss, a crack
    {
      const fy0 = yBefore + 30, fy1 = yBefore + 78;
      sunk(A, x0 + 8, fy0, 76, fy1, A.mix(C.wet, C.stone, 0.5));
      frame(A, x0 + 8, fy0, 76, fy1, C.moss);
      out.years.push({ label: 'Before', y: Math.round((fy0 + fy1) / 2) });
      out.faces.push({ label: 'Before', x: x0 + 8, y: fy0, w: 76 - x0 - 8, h: fy1 - fy0 });
      for (let i = 0; i < 70; i++) { const x = A.rr(x0, x1), y = yPl - Math.pow(A.rnd(), 2) * 200; A.dot(x, y, 'chalk', A.pick([C.moss, '#5d6a2e', '#3a4a22', '#7a8a3a']), { w: A.rr(1.2, 3), p: 0.8 }); }
      A.stroke(A.roughen([[x0 + 30, yBefore + 96], [x0 + 38, yBefore + 130], [x0 + 33, yBefore + 160], [x0 + 44, yBefore + 196]], 1.2, 4, false), 'kajal', C.line, { w: 0.6, p: 0.8 });
    }

    // ---- the flood marks: a painted line right across, and a plaque beside it
    for (const mk of o.marks || []) {
      const k = years.indexOf(mk.year); if (k < 0) continue;
      const y = yTop + k * band + (12 - (mk.month || 6.5) + 0.5) / 12 * band;
      const lw = mk.kind === 'sindoor' ? 5.2 : mk.kind === 'gold' ? 4.4 : 3.8, h = lw / 2;
      // the water stood here: a dark tide stain under the line, and a notch cut into each edge of the staff
      M.floorWash(A, rect(x0, y + h, x1, y + h + 16), C.wet, (x, yy) => 0.5 * (1 - sstep((yy - y - h) / 16)), 'mul');
      for (const [ex, sg] of [[x0, 1], [x1, -1]]) A.fill([[ex - sg * 0.5, y - h - 1.6], [ex + sg * 5.5, y], [ex - sg * 0.5, y + h + 1.6]], 'chalk', C.line, { w: 0.6, p: 1, passes: 2 });
      if (mk.kind === 'gold') {
        A.stroke([[x0 - 1, y + h * 0.5], [x1 + 1, y + h * 0.5 + 0.3]], 'chalk', '#3e2410', { w: lw, p: 1, tin: 0, tout: 0 });
        A.stroke([[x0 - 1, y], [x1 + 1, y + 0.3]], 'gold', C.gold, { w: lw * 0.8, p: 1, tin: 0, tout: 0 });
        A.stroke([[x0 + 2, y - h * 0.45], [x1 - 2, y - h * 0.45]], 'chalk', '#fff4c8', { w: 0.6, p: 0.8 });
      } else {
        const c = mk.kind === 'sindoor' ? C.sindoor : '#eef2f6', cd = mk.kind === 'sindoor' ? '#7a1408' : '#8a98aa';
        // laid twice, so the colour is thick: once in the deeper shade a little low, then the colour over it
        A.stroke([[x0 - 1, y + 0.8], [x1 + 1, y + 1.1]], 'pastel', cd, { w: lw, p: 1, tin: 0, tout: 0 });
        A.stroke([[x0 - 1, y], [x1 + 1, y + 0.3]], 'pastel', c, { w: lw * 0.85, p: 1, tin: 0, tout: 0 });
        A.stroke([[x0 + 1, y - h * 0.5], [x1 - 1, y - h * 0.5 + 0.2]], 'chalk', mk.kind === 'sindoor' ? '#f06a4a' : '#ffffff', { w: 0.7, p: 0.8 });
        if (mk.kind === 'sindoor') for (let i = 0; i < 7; i++) { const x = A.rr(x0 + 4, x1 - 4), l = A.rr(5, 16); A.stroke([[x, y + h - 0.5], [x + A.rr(-0.3, 0.3), y + h + l]], 'chalk', c, { w: A.rr(0.8, 1.3), p: 0.95, tout: 0.6 }); A.dot(x, y + h + l, 'chalk', cd, { w: 1.3, p: 0.9 }); }
      }
      A.outline([[x0 - 1, y - h - 0.2], [x1 + 1, y - h + 0.1]], 'kajal', C.line, { w: 0.4, p: 0.6 });
      A.outline([[x0 - 1, y + h + 0.3], [x1 + 1, y + h + 0.6]], 'kajal', C.line, { w: 0.5, p: 0.7 });
      plaque(A, 92, W - 2, y, mk.kind);
      out.marks.push({ id: mk.id, y: Math.round(y), kind: mk.kind });
    }

    // ---- the edges of the staff, chipped
    for (const x of [x0, x1]) A.outline(A.roughen([[x, yTop - 4], [x, yPl]], 0.5, 6, false), 'kajal', C.line, { w: 0.8, p: 0.85, pull: 40 });
    A.stroke([[x0 + 1.4, yTop], [x0 + 1.4, yPl - 4]], 'chalk', '#fffaf0', { w: 0.8, p: 0.7 });

    // ---- the capital: a lotus turned down, an amalaka ring, a dome and the kalash; an abacus where it meets the shaft
    {
      const ab = rect(x0 - 6, capH - 14, x1 + 6, capH);
      solidC(A, ab, C.lime, { w: 2, gap: 0.45 });
      M.floorWash(A, ab, C.deep, (x, y) => 0.4 * sstep((y - capH + 14) / 14), 'mul');
      for (let x = x0 - 4; x < x1 + 4; x += 8) A.fill([[x, capH - 12], [x + 4, capH - 3], [x + 8, capH - 12]], 'chalk', C.sindoor, { w: 0.8, p: 0.9, passes: 1 });
      A.outline(ab, 'kajal', C.line, { closed: true, w: 0.6, p: 0.85 });
      // the lotus: two rows of petals turned down over the abacus
      for (const [row, yy, r, c] of [[1, capH - 30, 8, '#f6dcc8'], [0, capH - 16, 9, '#f0c8b0']]) {
        for (let x = x0 - 2 + (row ? 4 : 0); x <= x1 + 2; x += 9) {
          const pet = A.spline([[x - r * 0.5, yy - r], [x, yy - r * 1.1], [x + r * 0.5, yy - r], [x + r * 0.42, yy - r * 0.2], [x, yy + r * 0.45], [x - r * 0.42, yy - r * 0.2]], true, 0.6);
          solidC(A, pet, c, { w: 1 });
          M.floorWash(A, pet, '#8a4a3a', (px, py) => 0.35 * sstep((py - yy + r * 0.4) / r), 'mul');
          A.outline(pet, 'kajal', '#4a2018', { closed: true, w: 0.45, p: 0.75 });
        }
      }
      const ring = A.ellipse(cx, capH - 52, 30, 7);
      solidC(A, ring, C.stone);
      for (let i = -5; i <= 5; i++) A.stroke([[cx + i * 5.2, capH - 58], [cx + i * 5.6, capH - 46]], 'kajal', A.mix(C.line, C.stone, 0.4), { w: 0.45, p: 0.6 });
      M.floorWash(A, ring, C.deep, (x) => 0.35 * sstep((x - cx) / 30 + 0.2), 'mul');
      A.outline(ring, 'kajal', C.line, { closed: true, w: 0.55, p: 0.85 });
      const dome = A.ellipse(cx, capH - 58, 24, 26, 0, PI, TAU).concat([[cx + 24, capH - 57], [cx - 24, capH - 57]]);
      solidC(A, dome, C.lime);
      for (const u of [-0.6, -0.2, 0.2, 0.6]) A.stroke(A.spline([[cx + u * 24, capH - 58], [cx + u * 16, capH - 72], [cx + u * 4, capH - 83]], false, 1), 'kajal', A.mix(C.line, C.lime, 0.5), { w: 0.4, p: 0.5 });
      M.floorWash(A, dome, C.deep, (x) => 0.4 * sstep((x - cx) / 24 + 0.3), 'mul');
      A.outline(dome.slice(0, -2), 'kajal', C.line, { w: 0.55, p: 0.85 });
      // the kalash: a pot of water with mango leaves, painted, not gilt
      const pot = A.spline([[cx - 5, capH - 84], [cx - 10, capH - 96], [cx - 7, capH - 106], [cx + 7, capH - 106], [cx + 10, capH - 96], [cx + 5, capH - 84]], true, 0.6);
      solidC(A, pot, C.haldi, { w: 1 });
      M.floorWash(A, pot, '#6a3a10', (x) => 0.4 * sstep((x - cx) / 10 + 0.3), 'mul');
      A.outline(pot, 'kajal', C.line, { closed: true, w: 0.5, p: 0.85 });
      for (const a of [-0.8, -0.3, 0.3, 0.8]) A.fill(A.spline([[cx, capH - 107], [cx + Math.sin(a) * 6 - 1.5, capH - 112], [cx + Math.sin(a) * 10, capH - 118], [cx + Math.sin(a) * 6 + 1.5, capH - 112]], true, 0.6), 'chalk', C.leaf, { w: 0.6, p: 1, passes: 2 });
      A.fill(A.ellipse(cx, capH - 121, 4, 4.5), 'chalk', '#8a5a2a', { w: 0.8, p: 1, passes: 2 });
      A.outline(A.ellipse(cx, capH - 121, 4, 4.5), 'kajal', C.line, { closed: true, w: 0.45, p: 0.8 });
    }

    // ---- the plinth: a stepped base with a band of petals, standing in the water
    {
      const p1 = rect(x0 - 8, yPl, x1 + 8, yPl + 22), p2 = rect(x0 - 14, yPl + 22, x1 + 14, Hh - 4);
      for (const p of [p1, p2]) { A.ground(p, A.mix(C.wet, C.stone, 0.45), { w: 8, edge: 0, rub: 3, top: 0.5 }); M.floorWash(A, p, '#1a1a12', (x) => 0.3 * sstep((x - cx) / 50 + 0.2), 'mul'); A.outline(p, 'kajal', C.line, { closed: true, w: 0.6, p: 0.85 }); }
      for (let x = x0 - 6; x < x1 + 6; x += 9) A.outline([[x, yPl + 20], [x + 4.5, yPl + 6], [x + 9, yPl + 20]], 'kajal', A.mix(C.line, C.stone, 0.3), { w: 0.45, p: 0.7 });
    }
    return out;
  };
})();
