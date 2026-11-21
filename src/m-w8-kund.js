(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE LOTUS KUND, at night
       M.w8Kund(Z, o)   in kund units: 300 across (x -150..150), the foot of the parapet at y = 0, the far rim at y -134.
                        o.lamp(x, y): where a flame burns; o.glint(x, y): where gold catches the light.
     A small stepped tank drawn the way the old painters drew one, tipped up so the water shows: a far rim carved in
     lotus petals, four courses of steps on three sides going down to green water, the steps going on under it, the
     water laid in rows of little ripples and crowded with pads and big blooms; in front a low parapet with a band of
     carved lotus petals and a finial at each end.  A frog on a pad, a dragonfly, a fish turning, a seed head, petals
     afloat, and two diyas set on the water.
     ======================================================================== */
  const PI = Math.PI;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ST = { tread: '#d4b490', riser: '#86666a', rim: '#e0c49c', face: '#cfa982', deep: '#5a4250', line: '#24161a', petal: '#ead2aa', water: '#1c5446', waterL: '#2c7458', rip: '#5aa68a', ripL: '#a8d4bc' };

  // a row of upright lotus petals carved along a band, each with a midrib and a lit edge
  function petalBand(Z, x0, x1, y0, y1, n, col) {
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const cx = x0 + (i + 0.5) * w, p = Z.spline([[cx - w * 0.46, y1], [cx - w * 0.44, y0 + (y1 - y0) * 0.45], [cx, y0], [cx + w * 0.44, y0 + (y1 - y0) * 0.45], [cx + w * 0.46, y1]], false, 0.4);
      Z.fill(p, 'chalk', col, { w: Math.max(0.3, w * 0.3), p: 1, passes: 2 });
      M.floorWash(Z, p, ST.deep, (x) => 0.35 * sstep((x - cx) / (w * 0.5) + 0.1), 'mul');
      Z.stroke([[cx, y1 - 0.4], [cx, y0 + (y1 - y0) * 0.3]], 'kajal', ST.line, { w: 0.25, p: 0.5 });
      Z.stroke(p.slice(0, Math.ceil(p.length / 2)), 'chalk', '#fff4dc', { w: 0.35, p: 0.55 });
      Z.outline(p, 'kajal', ST.line, { closed: false, w: 0.35, p: 0.75 });
    }
  }

  M.w8Kund = function (Z, o) {
    o = o || {};
    const WX = 112, WT = -100, RIM0 = -134, RIM1 = -124;
    // ---- the tank's own walls at the two ends, under the rim, so nothing behind shows between rim and parapet
    Z.ground(rect(-148, RIM1, 148, -30), ST.face, { edge: 0, w: 3, rub: 0, top: 0 });
    for (const sg of [-1, 1]) M.floorWash(Z, rect(sg > 0 ? 140 : -148, RIM1, sg > 0 ? 148 : -140, -30), ST.deep, () => 0.3, 'mul');
    // ---- the steps on three sides: four courses, each a band round the water, its tread lit and its riser in shade
    for (let i = 0; i < 4; i++) {
      const ox = 140 - 7 * i, oy = RIM1 + 6 * i, ix = ox - 7, iy = oy + 6;
      const band = [[-ox, -30], [-ox, oy], [ox, oy], [ox, -30], [ix, -30], [ix, iy], [-ix, iy], [-ix, -30]];
      Z.ground(band, Z.mix(ST.tread, ST.riser, i * 0.08), { edge: 0, w: 2.4, rub: 0, top: 0 });
      // the riser: the inner edge of each course, in shade
      Z.fill([[-ix, iy - 2.2], [ix, iy - 2.2], [ix, iy], [-ix, iy]], 'chalk', ST.riser, { w: 1, p: 1, passes: 2 });
      for (const sg of [-1, 1]) Z.fill([[sg * ix, iy], [sg * (ix + 2.2), iy - 2.2], [sg * (ix + 2.2), -30], [sg * ix, -30]], 'chalk', Z.mix(ST.riser, ST.tread, 0.3), { w: 1, p: 1, passes: 2 });
      Z.stroke([[-ox + 0.6, oy + 0.6], [ox - 0.6, oy + 0.6]], 'chalk', '#fff0d8', { w: 0.45, p: 0.55 });
      Z.outline([[-ix, -30], [-ix, iy], [ix, iy], [ix, -30]], 'kajal', ST.line, { closed: false, w: 0.35, p: 0.7 });
      // worn places and chips on the treads
      for (let k = 0; k < 7; k++) Z.dot(Z.rr(-ox + 3, ox - 3), oy + Z.rr(1, 3.4), 'chalk', Z.mix(ST.tread, ST.riser, 0.45), { w: Z.rr(0.6, 1.4), p: 0.5 });
    }
    // ---- the far rim, carved in lotus petals, with a moulding over it
    Z.ground(rect(-146, RIM0, 146, RIM1), ST.rim, { edge: 0, w: 2.4, rub: 0, top: 0 });
    petalBand(Z, -144, 144, RIM0 + 1.4, RIM1 - 0.4, 24, ST.petal);
    Z.fill(rect(-148, RIM0 - 2, 148, RIM0 + 0.8), 'chalk', ST.rim, { w: 1, p: 1, passes: 2 });
    Z.outline(rect(-148, RIM0 - 2, 148, RIM1), 'kajal', ST.line, { closed: true, w: 0.45, p: 0.8 });
    // ---- the water: deep green, lighter toward the far steps, laid in rows of little ripples; the steps going on under it
    const wat = rect(-WX, WT, WX, -30);
    Z.ground(wat, ST.water, { edge: 0, w: 3, rub: 0, top: 0 });
    M.floorWash(Z, wat, ST.waterL, (x, y) => 0.6 * (1 - sstep((y - WT) / 40)), 'over');
    for (let k = 1; k <= 2; k++) Z.outline([[-WX + 7 * k, -30], [-WX + 7 * k, WT + 6 * k], [WX - 7 * k, WT + 6 * k], [WX - 7 * k, -30]], 'chalk', '#8ab8a4', { closed: false, w: 0.7, p: 0.28 - k * 0.06 });
    for (let r = 0, y = WT + 3; y < -31; y += 3.6, r++) for (let x = -WX + 3 + (r % 2) * 3.5; x < WX - 3; x += 7) Z.stroke(Z.ellipse(x, y, 3, 1, 0, 0.15, PI - 0.15), 'chalk', r % 3 ? ST.rip : ST.ripL, { w: 0.35, p: 0.5 });
    // the moon on the water, broken
    for (let k = 0; k < 5; k++) Z.stroke([[-30 - k * 1.5 + Z.rr(-1, 1), WT + 10 + k * 3.4], [-18 + k * 1.2 + Z.rr(-1, 1), WT + 10 + k * 3.4]], 'chalk', '#e8f0e0', { w: 0.8, p: 0.55 - k * 0.07 });
    // a fish turning just under the surface
    const fx = 36, fy = -44, fish = Z.spline([[fx - 8, fy], [fx - 3, fy - 2], [fx + 4, fy - 1.6], [fx + 7, fy], [fx + 3, fy + 1.4], [fx - 3, fy + 1.4]], true, 0.3);
    M.floorWash(Z, fish, '#ec7a2a', () => 0.6, 'over');
    M.floorWash(Z, [[fx - 7.5, fy], [fx - 11.5, fy - 2.8], [fx - 11, fy + 2.4]], '#ec7a2a', () => 0.5, 'over');
    Z.stroke([[fx - 2, fy - 1.2], [fx + 4, fy - 1]], 'chalk', '#ffc890', { w: 0.45, p: 0.5 });
    for (const r of [6, 10]) Z.stroke(Z.ellipse(fx + 5, fy - 1.5, r, r * 0.3), 'chalk', ST.ripL, { w: 0.35, p: 0.45 });
    // ---- pads, crowded, then the blooms standing up out of them
    const pads = [[-92, -86, 11], [-70, -52, 14], [-40, -76, 10], [-12, -42, 12], [20, -90, 9], [46, -62, 13], [80, -84, 11], [96, -46, 12], [-102, -40, 9], [64, -38, 9], [-58, -94, 8], [6, -66, 9], [-26, -92, 8], [-88, -64, 8], [100, -66, 7], [28, -76, 7]];
    pads.forEach((p, i) => M.lotusPad(Z, p[0], p[1], p[2], { rot: i * 1.9, flat: 0.5 }));
    const blooms = [[-6, -66, 46, 'open', 16], [64, -64, 40, 'open', 14], [-62, -72, 34, 'half', 14], [-94, -54, 26, 'open', 12], [30, -84, 22, 'bud', 18], [90, -78, 20, 'bud', 16], [24, -54, 28, 'half', 12], [-36, -54, 30, 'white', 10], [-104, -78, 18, 'bud', 14], [-30, -96, 20, 'bud', 16], [104, -54, 24, 'half', 12]];
    blooms.sort((a, b) => a[1] - b[1]).forEach(b => M.lotus(Z, b[0], b[1], b[2], b[3], { stem: b[4], bend: Z.rr(-3, 3) }));
    // a seed head standing up, its holes
    const sp = [50, -96];
    Z.stroke(Z.spline([[sp[0] - 1, -70], [sp[0] - 0.4, -84], sp], false, 0.6), 'chalk', '#4e7a2a', { w: 0.9, p: 0.95 });
    const pod = [[sp[0] - 4.6, sp[1] - 4.4], [sp[0] + 4.6, sp[1] - 4.4], [sp[0] + 1.6, sp[1] + 0.6], [sp[0] - 1.6, sp[1] + 0.6]];
    Z.fill(pod, 'pastel', '#9aa83a', { w: 1, p: 1, passes: 2 });
    Z.fill(Z.ellipse(sp[0], sp[1] - 4.4, 4.6, 1.2), 'chalk', '#c8c860', { w: 0.6, p: 1, passes: 1 });
    for (let i = 0; i < 7; i++) Z.dot(sp[0] - 3.2 + i * 1.07, sp[1] - 4.4 + (i % 2 ? 0.4 : -0.3), 'kajal', '#3a4010', { w: 0.6, p: 0.9 });
    Z.outline(pod, 'kajal', '#1e2a10', { closed: true, w: 0.3, p: 0.7 });
    // the frog on the big pad
    const fr = [-72, -55];
    const body = Z.spline([[fr[0] - 4.6, fr[1]], [fr[0] - 3.6, fr[1] - 3.2], [fr[0] + 0.4, fr[1] - 5], [fr[0] + 3.6, fr[1] - 4.2], [fr[0] + 4.8, fr[1] - 1.6], [fr[0] + 3, fr[1] + 0.4], [fr[0] - 2, fr[1] + 0.6]], true, 0.3);
    Z.ground(body, '#6e9a30', { edge: 0, w: 0.8, rub: 0, top: 0 });
    M.floorWash(Z, body, '#d8e070', (x, y) => 0.5 * (1 - sstep((y - (fr[1] - 5)) / 4)), 'over');
    for (const [u, v] of [[-2, -3], [0.6, -3.6], [-0.8, -1.6]]) Z.dot(fr[0] + u, fr[1] + v, 'chalk', '#2e4a16', { w: 0.7, p: 0.9 });
    Z.stroke(Z.spline([[fr[0] - 3.4, fr[1] - 0.6], [fr[0] - 5.4, fr[1] - 1.6], [fr[0] - 4.4, fr[1] + 0.6], [fr[0] - 6.4, fr[1] + 0.8]], false, 0.3), 'chalk', '#4e7a22', { w: 1, p: 0.95 });
    Z.stroke([[fr[0] + 3, fr[1] - 0.6], [fr[0] + 4.2, fr[1] + 0.6], [fr[0] + 5.4, fr[1] + 0.7]], 'chalk', '#4e7a22', { w: 0.8, p: 0.95 });
    Z.dot(fr[0] + 3, fr[1] - 4.4, 'chalk', '#e8c040', { w: 1.5, p: 1 });
    Z.dot(fr[0] + 3.2, fr[1] - 4.4, 'kajal', '#100c08', { w: 0.8, p: 1 });
    Z.stroke([[fr[0] + 4.6, fr[1] - 2], [fr[0] + 2.6, fr[1] - 1.6]], 'kajal', '#1e3a10', { w: 0.3, p: 0.8 });
    Z.outline(body, 'kajal', '#1e2a10', { closed: true, w: 0.35, p: 0.75 });
    // petals afloat, and two diyas set on the water with their light under them
    for (const [u, v, k, a] of [[-48, -40, 'rose', 0.4], [-14, -58, 'rose', 2.2], [12, -36, 'jasmine', 1], [78, -56, 'rose', 3.4], [-84, -44, 'mari', 0.2], [40, -92, 'rose', 1.4]]) M.w8Petal(Z, u, v, 1.4, k, a);
    for (const [u, v, ph] of [[-30, -38, 0], [82, -42, 1]]) {
      const s = 0.22;
      M.lampGlow(Z, u, v - 3, 12, 0.5, {});
      Z.stroke(Z.ellipse(u, v + 1.6, 6.5, 1), 'chalk', '#ffd890', { w: 0.6, p: 0.6 });
      for (let k = 0; k < 3; k++) Z.stroke([[u - 2 + k * 2, v + 2.8 + k * 0.6], [u - 1.4 + k * 2, v + 5.6 + k * 0.8]], 'chalk', '#ffe0a0', { w: 0.7, p: 0.5 });
      M.wellDiya(Z, u - 15 * s, v, s, ph, {});
      if (o.lamp) o.lamp(u, v - 16 * s);
    }
    // the dragonfly over the water on the right
    const df = [100, -112];
    for (const [a, l] of [[-0.35, 7.5], [0.25, 7], [PI + 0.35, 7.5], [PI - 0.25, 7]]) {
      const ca = Math.cos(a), sa = Math.sin(a), wg = Z.ellipse(df[0] + 1 + ca * l * 0.5, df[1] - 0.6 + sa * l * 0.5 - 1.2, l * 0.52, 1.2, a);
      M.floorWash(Z, wg, '#e8f2f4', () => 0.5, 'over');
      Z.outline(wg, 'kajal', '#2a3a4a', { closed: true, w: 0.18, p: 0.55 });
    }
    Z.stroke([[df[0] - 7, df[1] + 1.6], [df[0] + 3, df[1]]], 'chalk', '#2a8aa8', { w: 0.9, p: 1, tin: 0.2 });
    Z.dot(df[0] + 3.4, df[1] - 0.1, 'chalk', '#1a5a7a', { w: 1.5, p: 1 });
    // ---- the parapet in front: a moulding, a band of carved lotus petals, a plain face with a running scroll, the plinth
    const par = rect(-150, -32, 150, 0);
    Z.ground(par, ST.face, { edge: 0, w: 3, rub: 0, top: 0 });
    Z.fill(par, 'pastel', Z.mix(ST.face, '#fff0d8', 0.2), { w: 2, p: 0.35, passes: 1, ang: 0 });
    Z.fill(rect(-150, -34, 150, -31), 'chalk', ST.rim, { w: 1, p: 1, passes: 2 });
    petalBand(Z, -148, 148, -30.5, -22, 22, ST.petal);
    Z.stroke([[-150, -21.4], [150, -21.4]], 'kajal', ST.line, { w: 0.4, p: 0.7 });
    const scroll = []; for (let x = -144; x <= 144; x += 2) scroll.push([x, -13.6 + Math.sin(x * 0.16) * 3]);
    Z.stroke(scroll, 'kajal', Z.mix(ST.line, ST.face, 0.3), { w: 0.45, p: 0.7 });
    for (let x = -140; x <= 140; x += 19.6) { const yy = -13.6 + Math.sin(x * 0.16) * 3; Z.outline(Z.spline([[x, yy], [x + 2, yy - 3], [x + 4.6, yy - 2.6], [x + 2.4, yy - 0.4]], true, 0.3), 'kajal', Z.mix(ST.line, ST.face, 0.3), { closed: true, w: 0.35, p: 0.65 }); }
    Z.fill(rect(-152, -6, 152, 0), 'chalk', Z.mix(ST.face, ST.riser, 0.35), { w: 1, p: 1, passes: 2 });
    Z.stroke([[-152, -6], [152, -6]], 'kajal', ST.line, { w: 0.4, p: 0.7 });
    M.floorWash(Z, par, ST.deep, (x, y) => 0.3 * sstep((y + 18) / 18), 'mul');
    Z.outline(rect(-150, -34, 150, 0), 'kajal', ST.line, { closed: true, w: 0.55, p: 0.85 });
    // a finial at each end: a short post with a lotus bud on it
    for (const sg of [-1, 1]) {
      const x = sg * 145;
      Z.fill(rect(x - 3.4, -46, x + 3.4, -34), 'chalk', ST.rim, { w: 1, p: 1, passes: 2 });
      M.floorWash(Z, rect(x - 3.4, -46, x + 3.4, -34), ST.deep, (xx) => 0.35 * sstep((xx - x) / 3.4 + 0.2), 'mul');
      const bud = Z.spline([[x - 3.6, -46], [x - 3, -50], [x, -55], [x + 3, -50], [x + 3.6, -46]], true, 0.3);
      Z.fill(bud, 'gold', '#d6a535', { w: 0.8, p: 1, passes: 2 });
      Z.outline(bud, 'kajal', ST.line, { closed: true, w: 0.35, p: 0.8 });
      Z.outline(rect(x - 3.4, -46, x + 3.4, -34), 'kajal', ST.line, { closed: true, w: 0.35, p: 0.8 });
      if (o.glint) o.glint(x - 1, -51);
    }
    // the whole of it in the night: a cool shade over the stone away from the lamps
    M.floorWash(Z, [[-150, RIM0 - 2], [150, RIM0 - 2], [150, 0], [-150, 0]], '#1c2450', (x, y) => 0.22 * (1 - Math.max(Math.exp(-((x + 30) * (x + 30) + (y + 38) * (y + 38)) / 900), Math.exp(-((x - 82) * (x - 82) + (y + 42) * (y + 42)) / 900))), 'mul');
    return { box: [-152, RIM0 - 2, 152, 0] };
  };
})();
