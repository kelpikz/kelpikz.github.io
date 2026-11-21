(function () {
  'use strict';
  /* ==========================================================================
     THE LIGHT OF THE GOLD WELL BY THE HOUR (part 'light').
       M.w8y.light(A, G, H)  day: the old noon pass, except on the stair: the sun column is as warm as before at the
                             top by the chhatri but fades much sooner down the flight, the well's shade is no longer
                             lifted off the flight all the way down, and the stair's cream is laid a little down (a
                             thin warm glaze over the flight only, its head too, so the top flight sits level with
                             the landings), so the flight sits in the walls' values and no longer reads as a white
                             band from the rim to the water (DAY_SOFT = DAY_STAIR = 0 gives the old pass exactly).
                             The S = 8 cut-outs are made before this pass; not touched.
                             dusk: the sun low behind the chhatri.  Its light lies warm and raking on the rim and the
                             two upper levels and ends where the far parapet's shadow crosses the wall; it runs on down
                             the stair a little way; below, a violet shade gathers and goes blue toward the water.
                             night: a Mewar night.  The pale stone (floors, landings, the stair, the white of the
                             frames and domes) goes into the night itself: a deep indigo glaze, lapis in the upper well
                             and blue-black at the water, darker than the coloured paint beside it.  What is strongly
                             coloured keeps its own hue, laid down (vermilion to crimson, ochre to a warm dark ochre,
                             malachite to emerald).  The moon touches only the top edges: the coping and its kanguras,
                             the chhatri's dome, the deck, the front of the top landing, and the noses of the treads
                             at the head of the stair, thin silver lines that die out going down.  The stair is a dark
                             path.  The only warm light is the lamps' and the lantern hall's.
                             A lamp at a wall throws a fan of light up the wall behind it and a short spill on the floor
                             at its foot; a lamp on a ledge spills low along the floor and a little down the ledge face.
                             The rims are dragged the way the strokes run.  At dusk the lamp gives back the true colour
                             of what it lights, warmed, and each focal thing has a little lamp light of its own.  At
                             night the lamp's light is laid on over the night, warm amber to saffron (the paint's own
                             colour times the flame's), a modest lift that falls from the flame and ends fast; it never
                             brings back the day's pale stone.  Nothing is lifted round the focal things, but each one
                             is lit on its own pixels only (the stage keeps them in G.focalMask), warm, as its nearest
                             lamp would light it (from above when none is near), so it stands out from the night wall;
                             the lantern hall is lit already.  The painter's own glow round a lamp keeps its warmth.
                             Gold leaf catches a breath of the lamps at both hours.
       M.w8y.glow(A, G, H)   dusk and night: the bloom round each flame, rubbed in pastel the folio way.  (The lantern
                             hall's light on the floor in front, one soft spill along its whole front, is laid in
                             the light pass.)  Both hooks run inside the stage's light(), before the air is painted.
     The sky, the hills, the trees and the water are the sky painter's, painted for the hour; this pass leaves them as
     they are and lights only the stone (the parapet, the deck and the chhatri included: the sky painter draws those in
     their day colours at every hour, so they are toned once, here).  If the sky painter's hooks
     are off, it lays a plain wash of the hour over them instead, so a test render still holds together.
     The pass works on a field at one cell a unit, read back per pixel; nothing here is a ruled circle or a smooth
     cone: each pool is a few washes laid one inside another, each with its own wobbling reach.
     ======================================================================== */
  const on = part => { const o = typeof process !== 'undefined' && process.env && process.env.W8Y; return !o || o.split(',').includes(part); };
  if (!on('light')) return;
  M.w8y = M.w8y || {};
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const hex = c => { const v = parseInt(c.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  /* ------------------------------------------------------------ the two hours
     tone: gamma bends each channel (higher = deeper, more saturated), scale and tint lay the value and the cast.
     lamp: R the reach of a niche lamp's pool in units, k its strength, tint the warmth of the lit paint, core the
     brightness laid over at the flame. */
  const MOOD = {
    dusk: {
      warm: [1.06, 0.9, 0.73], violet: [0.86, 0.79, 0.97], blue: [0.66, 0.67, 0.95],
      sunC: hex('#f0a050'), chroma: 0, ind: [0.012, 0.006, 0.02], air: hex('#c2542a'), airK: 0.05,
      lamp: { R: 8.5, k: 0.8, tint: [1.03, 0.84, 0.6], core: 0.62, coreC: hex('#f5a83c') },
      hall: { k: 0.42, R: 1.05, lk: 0.55, floor: 0.4 }, focal: 0.32, focalLamp: 0.15, glint: 0.25,
      bloom: { r: 3.4, k: 0.85, hall: 0.45 }, coreMix: 0.9,
      sky: [[0, hex('#c97c88')], [60, hex('#e8925e')], [125, hex('#f4bf6c')]], skyK: 0.7
    },
    night: {
      /* the glaze over pale paint: its tint (luma 1) in the upper well and at the water, its lightness there (times the
         paint's lightness to the power PN), and the moon's silver on the top edges.  hold: the saturation over which
         paint keeps its own hue. */
      glazeT: [0.74, 0.92, 2.1], glazeD: [0.76, 0.9, 2.1], glazeL: [0.165, 0.075], PN: 1.35, hold: [0.16, 0.48],
      moonT: [0.88, 0.98, 1.32], moonL: 0.66, nose: hex('#b6c3e8'), noseEnd: 560, noseTo: 1000, noseLow: 0.24,
      satT: [0.92, 0.86, 1.02], satUp: 0.08,
      silver: hex('#c8d2ec'), chroma: 0, ind: [0.018, 0.02, 0.07],
      /* a lamp at night lays warm light on over the night: the paint's own colour times the flame's amber (C), a modest
         lift (gain), the night's blue drawn out under it (amb, quickest at the rim).  Its edge is firm: nothing below
         fall[0], a third of the light by fall[1], then rising to the flame; so the rim where amber over indigo turns
         grey is narrow.  glowT: the warmth the painter's own glow round a lamp keeps at night */
      lamp: { R: 10, k: 0.95, tint: [1.03, 0.9, 0.72], core: 0.44, coreC: hex('#f2a447'), C: [1.0, 0.64, 0.3], gain: 0.42, amb: 0.8, fall: [0.12, 0.32], water: 0.18, glowT: [1.12, 0.86, 0.55] },
      obj: { K: 0.85, C: [1.0, 0.72, 0.42], gain: 0.9, amb: 0.85, lo: 0.4, reach: 80 },
      hall: { k: 0.62, R: 1.45, lk: 0.95, floor: 0.75 }, glint: 0.5,
      bloom: { r: 4.2, k: 0.62, hall: 0.85 }, coreMix: 0.12,
      sky: [[0, hex('#141c4a')], [60, hex('#1b275e')], [125, hex('#273874')]], skyK: 0.85
    }
  };
  // the focal things and how much of the hour's dark is lifted off each, so each still reads as itself
  const FOCAL = { sidekick: 1, 'rule-builder': 1, portfolio: 1, 'delta-force': 0.9, 'nit-trichy': 0.85, joined: 0.7, hackathons: 0.8, pragyan: 0.45 };
  // the night lamp on an object, where it differs from FOCAL: the kund's cream stone took the lamp almost to day value
  const NIGHT_OBJ = { 'nit-trichy': 0.55 };

  /* ------------------------------------------------------------ the fields, per unit cell
     NF values a cell: 0 gamma, 1 scale, 2-4 tint, 5 the sun's or moon's colour laid over, 6 lamp pool, 7 lamp core,
     8-9 the way the lamp's strokes run there (cos and sin of twice the angle, so a stroke and its reverse agree),
     10 how much of the paint's own hue the night keeps there (none on the stair), 11 the night glaze's lightness,
     12 the moon on the top landing (on the rim the moon is found per pixel), 13 a night lamp's light (warm light laid
     on over the night, not the day's paint brought back), 14 how near a night lamp is (its own glow is lamplight) */
  const NF = 15;
  /* by day: the old noon pass with its sun column softened on the stair (DAY_SOFT), and the stair's cream laid a
     little down (DAY_STAIR).  Both 0 gives the old noon pass exactly. */
  const DAY_SOFT = 1, DAY_STAIR = 1;

  // which level's wall a height is in, and where that wall starts across (a): outside it lies the side wall
  function levelAt(H, y) {
    for (let k = H.LV.length - 1; k >= 0; k--) if (y >= H.LV[k].top) return k;
    return -1;
  }
  // how deep in the well: half a graded wash, half a step at each eave, so the dark gathers level by level
  const EAVES = [324, 492, 654, 810, 960];
  function deepOf(H, x, y) {
    const cont = sstep((y - 170) / 790);
    let st = 0; for (const e of EAVES) st += sstep((y - e) / 9 + 0.5);
    st /= EAVES.length;
    const k = levelAt(H, y), a = k < 0 ? 960 : H.LV[k].a, inWall = y > 960 ? 1 : sstep((960 - a - Math.abs(x - 960)) / 14 + 0.5);
    return 0.5 * cont + 0.5 * (inWall * st + (1 - inWall) * cont);
  }
  function sideOf(H, x, y) {
    const adx = Math.abs(x - 960), k = levelAt(H, y), a = k < 0 ? 960 : H.LV[k].a, out = y > 960 ? 0 : 1 - sstep((960 - a - adx) / 14 + 0.5);
    return Math.max(sstep((adx - 560) / 520), 0.55 * out) * sstep((y - 150) / 160);
  }
  // the stair column: 1 over the flight, falling off just past its walls, its edge a little unsteady as a brush is
  function column(A, H, x, y) {
    const hw = H.stairHW(clamp(y, 146, 1012)), wob = 3.2 * (A.noise2(y / 41, 3.7, 5) - 0.5) * 2;
    const u = Math.abs(x - 960 + wob) / (hw + 4);
    const streak = 1 + 0.06 * (A.noise2(x / 9, y / 70, 6) - 0.5) * 2;
    return (1 - sstep((u - 0.78) / 0.62)) * streak;
  }
  // a focal thing kept lighter: a soft pool over its box, its rim wandering
  function focalLift(A, G, x, y, M) {
    if (!G.hot) return 0;
    let f = 0;
    for (const id in FOCAL) {
      const b = G.hot[id]; if (!b) continue;
      const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rx = b[2] * 0.56 + 5, ry = b[3] * 0.54 + 5;
      const ux = (x - cx) / rx, uy = (y - cy) / ry, rho2 = ux * ux + uy * uy;
      if (rho2 > 2.2) continue;
      const th = Math.atan2(uy, ux), wob = 1 + 0.12 * (A.noise2(th * 1.3 + 3, cx * 0.01, 11) - 0.5) * 2;
      const v = (1 - sstep((Math.sqrt(rho2) / wob - 0.8) / 0.34)) * FOCAL[id];
      if (v > f) f = v;
    }
    return f * M.focal;
  }

  /* the floors: each level's landing, the terraces running out to the sides, and the deck on the rim.  1 on a floor.
     Built once a render from the levels' own corners, so it follows the drawing exactly. */
  let FLOORS = null, FLOORS_G = null;
  function floorPolys(G, H) {
    if (FLOORS && FLOORS_G === G) return FLOORS;
    const out = [], Ls = G.levels || [];
    Ls.forEach((L, k) => {
      const N = Ls[k + 1], na = N ? N.a : H.WA, nt = N ? N.top : H.WTOP;
      if (L.a != null && L.foot != null) out.push({ p: [[L.a, L.foot], [H.W - L.a, L.foot], [H.W - na, nt], [na, nt]], k });
      if (L.terrL) out.push({ p: L.terrL, k }); if (L.terrR) out.push({ p: L.terrR, k });
    });
    if (G.deck) out.push({ p: G.deck, k: -1 });
    FLOORS = out.map(({ p, k }) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); } return { p, k, x0, y0, x1, y1 }; });
    FLOORS_G = G;
    return FLOORS;
  }
  // the floor a point is on: its level's index (-1 the deck), or null off the floors
  function floorK(G, H, x, y) {
    for (const f of floorPolys(G, H)) {
      if (x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1) continue;
      const p = f.p; let c = false;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
      if (c) return f.k;
    }
    return null;
  }
  const floorAt = (G, H, x, y) => floorK(G, H, x, y) === null ? 0 : 1;

  function cellDusk(A, G, H, M, x, y, F, o) {
    const dx = x - 960;
    const deep = deepOf(H, x, y), side = sideOf(H, x, y), col = column(A, H, x, y);
    // the low sun's light ends at the line the far parapet's shadow draws across the wall; it goes deeper by the stair
    const ys = 398 + 20 * (A.noise2(x / 170, 2.3, 7) - 0.5) * 2 + 64 * Math.exp(-(dx / 140) * (dx / 140));
    const lit = 1 - sstep((y - ys) / 84 + 0.5);
    const path = clamp(col, 0, 1) * (1 - sstep((y - 330) / 360)) * 0.35;
    const L = clamp(Math.max(lit, path), 0, 1), fl = focalLift(A, G, x, y, M) * (1 - 0.75 * floorAt(G, H, x, y));
    const shT = mix3(M.violet, M.blue, deep);
    const stair = clamp(col, 0, 1) * (1 - 0.3 * L);
    F[o] = lerp(1.2 + 0.22 * deep + 0.1 * side, 1.05, L) - 0.2 * fl + 0.08 * stair;
    F[o + 1] = lerp(0.92 - 0.12 * deep - 0.06 * side, 1.0, L) + 0.04 * fl - 0.08 * stair;
    const t = mix3(shT, M.warm, L);
    F[o + 2] = t[0]; F[o + 3] = t[1]; F[o + 4] = t[2];
    F[o + 5] = 0.085 * L;
    F[o + 6] = M.focalLamp * fl / M.focal; F[o + 10] = 1;
  }
  // the flight and its parapets, crisp: 1 on them, 0 a unit and a half past the parapets' outer edge
  const stairIn = (H, x, y) => y < 146 || y > 1014 ? 0 : 1 - sstep((Math.abs(x - 960) - H.stairHW(y) - 5.5) / 1.5 + 0.5);
  function cellNight(A, G, H, M, x, y, F, o) {
    const deep = y > 960 ? 1 : deepOf(H, x, y), side = sideOf(H, x, y), st = stairIn(H, x, y);
    const fk = floorK(G, H, x, y), fz = fk === null ? 0 : 1;
    /* no focal light at night: a lift round a thing reads as a pale haze on the wall round it.  The things are lit by
       the lamps that are there, and the page lights a hovered thing itself. */
    /* coloured paint: keyed low, the light colours most, the deep colours least, so lapis, malachite and vermilion
       keep their jewel.  0: the power on lightness, 1: the lightness of white */
    F[o] = 0.74 + 0.06 * deep;
    F[o + 1] = clamp(0.45 - 0.16 * deep - 0.07 * side + 0.06 * fz * (1 - 0.35 * deep) - 0.03 * (1 - fz), 0.2, 0.8);
    /* pale paint: the glaze, lapis high in the well, blue-black at the water, a step deeper on the side walls.  The
       stair's paint is darker than the floors', so its glaze is lifted a hair: a dark path, never a black stripe. */
    const t = mix3(M.glazeT, M.glazeD, deep);
    F[o + 2] = t[0]; F[o + 3] = t[1]; F[o + 4] = t[2];
    F[o + 11] = lerp(M.glazeL[0], M.glazeL[1], deep) - 0.035 * side + 0.015 * st;
    // the top landing catches the moon toward its front edge; the wall behind it shades its back
    let ml = 0;
    if (fk === 0) { const L = G.levels[0], N = G.levels[1]; if (L && N) { const t1 = (y - L.foot) / ((N.top - L.foot) || 1); ml = 0.62 * sstep((t1 - 0.25) / 0.65) * (1 - 0.35 * sstep((Math.abs(x - 960) - 500) / 400)); } }
    F[o + 12] = ml;
    // the stair keeps none of its paint's hue (its risers would read lighter than its treads)
    F[o + 10] = 1 - st;
  }
  /* the moon on the rim, per pixel (the sky painter's coping, kanguras, face, deck and chhatri are drawn to the unit):
     the kanguras and the coping and the chhatri's dome most, the deck past the parapet's shadow, the parapet's face and
     the chhatri's pillars a little (they face away from the moon) */
  function moonRim(x, y) {
    if (y >= 152) return 0;
    const deck = 0.55 * sstep((y - 137.5) / 3) * (1 - sstep((y - 146.5) / 3));
    let m = lerp(1, 0.32, sstep((y - 122.6) / 0.6 + 0.5));
    m = lerp(m, deck, sstep((y - 136.4) / 0.6 + 0.5));
    return lerp(m, lerp(1, 0.4, sstep((y - 104.2) / 0.6 + 0.5)), sstep(chhatriIn(x, y) / 0.6 + 0.5));
  }

  /* one lamp's light laid into the field, the way a painter lays it.  A lamp on a ledge (the floor behind it) spills
     low along the floor and a little down the ledge face; a lamp at a wall (a niche, a door, a sill) throws a fan of
     light up the wall behind it and a short spill on the floor at its foot.  Every wash's reach wanders on a few slow
     lobes, seeded by where the lamp is, so a crop and the sheet agree; and every wash records the way its strokes run
     (along the floor, or out from the flame up the wall), so its rim is dragged the way the stroke goes. */
  const KN = [7, 9, 6, 8];
  function lampKnots(A, lx, ly, seed) {
    return KN.map((n, q) => { const t = new Float32Array(n + 1); for (let m = 0; m < n; m++) t[m] = 1 + 0.2 * (A.hash(Math.round(lx * 8) + m * 131, Math.round(ly * 8) + q * 977, seed) - 0.5) * 2; t[n] = t[0]; return t; });
  }
  const lobe = (kn, q, th) => { const n = KN[q], u = (th / (2 * Math.PI) + 0.5) * n, m = ((Math.floor(u) % n) + n) % n, f = u - Math.floor(u), s = f * f * (3 - 2 * f); return kn[q][m] + (kn[q][m + 1] - kn[q][m]) * s; };
  function put(F, g, x, y, a, ac, wx, wy, fi) {
    const i = Math.floor(x - g.x0), j = Math.floor(y - g.y0); if (i < 0 || j < 0 || i >= g.w || j >= g.h) return;
    const o = (j * g.w + i) * NF; F[o + (fi || 6)] += a; F[o + 7] += ac; F[o + 8] += wx; F[o + 9] += wy;
  }
  // near a night lamp: 1 within a few units of the flame, gone by fifteen
  function nearLamp(F, g, lx, ly) {
    for (let y = Math.floor(ly - 15) + 0.5; y < ly + 15; y++) for (let x = Math.floor(lx - 15) + 0.5; x < lx + 15; x++) {
      const i = Math.floor(x - g.x0), j = Math.floor(y - g.y0); if (i < 0 || j < 0 || i >= g.w || j >= g.h) continue;
      const v = 1 - sstep((Math.hypot(x - lx, y - ly) - 8) / 7), o = (j * g.w + i) * NF + 14; if (v > F[o]) F[o] = v;
    }
  }
  function splat(A, G, H, F, g, lx, ly, R, k, kc, seed, night) {
    // no two lamps alike: one has more oil, one a longer wick
    const kv = 0.72 + 0.45 * A.hash(Math.round(lx * 8), Math.round(ly * 8), seed + 50);
    k *= kv; kc *= kv;
    const kn = lampKnots(A, lx, ly, seed), ledge = floorAt(G, H, lx, ly - 2.5) === 1;
    const lean = (A.hash(Math.round(lx * 8), Math.round(ly * 8), seed + 70) - 0.5) * 0.22;
    const bx = (ledge ? 1.75 : 1.3) * R + 2, up = (ledge ? 0.75 : 1.45) * R + 2, dn = (ledge ? 0.7 : 0.55) * R + 2;
    const ax = ly + 0.16 * R;   // the fan opens from a point a little under the flame
    for (let y = Math.floor(ly - up) + 0.5; y < ly + dn; y++) {
      const dy = y - ly;
      for (let x = Math.floor(lx - bx) + 0.5; x < lx + bx; x++) {
        const dx = x - lx;
        let a = 0, ac = 0, wx = 0, wy = 0, acF = 0;
        // the flame's own small wash
        { const ex = dx / 1.3, d = Math.hypot(ex, dy), re = 0.3 * R * lobe(kn, 2, Math.atan2(dy, ex)), v = sstep((re - d) / (0.55 * re)); a += 0.5 * v; ac += v; acF = v; }
        if (ledge) {
          // along the floor behind the lamp: wide and low
          const ex = dx / 1.7, ey = (dy + 0.16 * R) / 0.42, d = Math.hypot(ex, ey), re = R * lobe(kn, 0, Math.atan2(ey, ex)), v = sstep((re - d) / (0.65 * re)) * (night ? 1 - 0.6 * Math.min(1, d / re) : 1);
          // down the ledge face under it
          const fx = dx / 0.85, fy = (dy - 0.24 * R) / 0.34, d2 = Math.hypot(fx, fy), re2 = 0.55 * R * lobe(kn, 1, Math.atan2(fy, fx)), v2 = sstep((re2 - d2) / (0.6 * re2));
          a += 0.55 * v + 0.3 * v2; ac += 0.22 * v + 0.1 * v2; wx += v + v2;
        } else {
          // the fan up the wall: out from under the flame, a little leaning, its sides and its reach wandering
          const fy = ax - y;
          if (fy > 0) {
            const r = Math.hypot(dx, fy), th = Math.atan2(dx, fy) - lean, hw = 0.64 * lobe(kn, 3, th * 3);
            const va = sstep((hw - Math.abs(th)) / 0.3 + 0.5), re = 1.3 * R * lobe(kn, 0, th * 2.4), v = va * sstep((re - r) / (0.72 * re)) * (night ? 1 - 0.5 * Math.min(1, r / re) : 1);
            a += 0.5 * v; ac += 0.1 * v;
            if (r > 1e-3) { const c = dx / r, sn = -fy / r; wx += v * (c * c - sn * sn); wy += v * 2 * c * sn; }
          }
          // a short spill on the floor at its foot
          const ex = dx / 1.05, ey = (dy - 0.12 * R) / 0.3, d = Math.hypot(ex, ey), re = R * lobe(kn, 1, Math.atan2(ey, ex)), v = sstep((re - d) / (0.62 * re)) * (night ? 1 - 0.6 * Math.min(1, d / re) : 1);
          a += 0.32 * v; wx += v;
        }
        // at night only the flame itself is bright; the spills are light laid on, never a pale wash
        if (a > 0) put(F, g, x, y, k * a, kc * (night ? acF : ac), wx, wy, night ? 13 : 6);
      }
    }
    if (night) nearLamp(F, g, lx, ly);
  }
  /* a lantern in the hall: a round soft wash (three, one inside another), the hall's dark round it */
  const WASH = [[1.0, 0.36, 0.38, 7, 0.2], [0.58, 0.34, 0.36, 9, 0.18], [0.26, 0.48, 0.46, 6, 0.2]];
  function splatRound(A, F, g, lx, ly, R, k, kc, seed, fi) {
    const kv = 0.72 + 0.45 * A.hash(Math.round(lx * 8), Math.round(ly * 8), seed + 50);
    k *= kv; kc *= kv;
    const kn = lampKnots(A, lx, ly, seed), cy = ly + 0.06 * R, sx = 1.4, sy = 0.9;
    for (let y = Math.floor(cy - sy * R * 1.2) + 0.5; y < cy + sy * R * 1.2; y++) {
      const dy = (y - cy) / sy;
      for (let x = Math.floor(lx - sx * R * 1.2) + 0.5; x < lx + sx * R * 1.2; x++) {
        const dx = (x - lx) / sx, d = Math.hypot(dx, dy); if (d > R * 1.2) continue;
        const th = Math.atan2(dy, dx);
        let a = 0, ac = 0;
        for (let q = 0; q < 3; q++) { const w = WASH[q], reach = R * w[0] * lobe(kn, q, th), v = sstep((reach - d) / (w[1] * reach)); a += w[2] * v; if (q === 2) ac += v; else if (q === 1) ac += 0.25 * v; }
        if (a > 0) put(F, g, x, y, k * a, kc * ac, a, 0, fi);
      }
    }
  }
  /* the lantern hall lit from within: its box, the rim wandering; then out of each arch a tongue of light on the floor
     in front, widening as it comes, the pillars' feet between the tongues left in the night */
  /* at night the focal things sank into the wall.  Each is lit on its own pixels only (the stage keeps, in
     G.focalMask, which pixels its draw changed), as a lamp near it would light it: brighter on the side toward that
     lamp, or from above when none is near; the wall round it stays night.  The lantern hall is lit already. */
  function objLights(G, O, S, cx0, cy0, cx1, cy1) {
    const out = [], FM = G.focalMask; if (!FM) return out;
    for (const id in FM) {
      const m = FM[id], wt = (id in NIGHT_OBJ ? NIGHT_OBJ[id] : FOCAL[id]) || 0, b = G.hot && G.hot[id];
      if (!b || !wt || id === 'pragyan' || m.S !== S) continue;
      if (m.X0 >= cx1 || m.X0 + m.w <= cx0 || m.Y0 >= cy1 || m.Y0 + m.h <= cy0) continue;
      const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
      let best = null, bd = 0.5 * Math.hypot(b[2], b[3]) + O.reach;
      for (const p of G.lamps || []) { const d = Math.hypot(p[0] - cx, p[1] - cy); if (d < bd) { bd = d; best = p; } }
      let dx = 0, dy = -1;
      if (best && bd > 0.2 * Math.min(b[2], b[3])) { dx = (best[0] - cx) / bd; dy = (best[1] - cy) / bd; }
      out.push({ m, k: wt * O.K, cx, cy, dx, dy, half: 0.5 * (Math.abs(dx) * b[2] + Math.abs(dy) * b[3]) });
    }
    return out;
  }
  function hallPool(A, F, g, b, k, kf, canopy, fi) {
    const x0 = b[0] + 6, x1 = b[0] + b[2] - 6, y0 = b[1] + 10, y1 = b[1] + b[3] + 1;
    for (let y = Math.floor(y0 - 20) + 0.5; y < y1 + 12; y++) {
      for (let x = Math.floor(x0 - 24) + 0.5; x < x1 + 24; x++) {
        const ex = 16 * (A.noise2(y / 23, 1.7, 12) - 0.5) * 2, ey = 6 * (A.noise2(x / 31, 4.1, 13) - 0.5) * 2;
        const ix = sstep(Math.min(x - x0 + ex, x1 - x + ex) / 20 + 0.5), iy = sstep(Math.min(y - y0 + ey, (y1 - y) + ey) / 10 + 0.5);
        const v = ix * iy;
        if (v > 0) put(F, g, x, y, k * v, 0, v, 0);
      }
    }
    /* the light on the floor in front: one spill along the hall's whole front, its far edge wandering on its own slow
       swell (not arch by arch), a little more in front of each arch than of the pillars between, and fading at the
       hall's two ends.  The arches are found from the three diyas on each arch's floor. */
    const ds = canopy.filter(c => c.kind === 'diya').sort((p, q) => p.x - q.x), arches = [];
    for (const d of ds) { const a = arches[arches.length - 1]; if (a && d.x - a.xr < 24) { a.xr = d.x; a.sx += d.x; a.n++; } else arches.push({ xl: d.x, xr: d.x, sx: d.x, n: 1 }); }
    const top = b[1] + b[3] - 4, depth = 28, hx0 = b[0] + 4, hx1 = b[0] + b[2] - 4;
    const AC = arches.map(ar => [ar.sx / ar.n, Math.max(14, (ar.xr - ar.xl) / 2 + 6) * 1.3]);
    for (let y = Math.floor(top) + 0.5; y < top + depth * 1.3 + 2; y++) {
      const t = (y - top) / depth;
      for (let x = Math.floor(hx0 - 16) + 0.5; x < hx1 + 16; x++) {
        let am = 0; for (const [cx, w] of AC) { const u = (x - cx) / w; am = Math.max(am, Math.exp(-u * u)); }
        const reach = (0.82 + 0.12 * am) * (1 + 0.22 * (A.noise2(x / 37, 2.9, 15) - 0.5) * 2 + 0.08 * (A.noise2(x / 7, 6.1, 16) - 0.5) * 2);
        const ends = sstep(Math.min(x - hx0, hx1 - x) / (12 + 14 * t) + 0.5);
        const v = ends * (1 - sstep(t / reach)) * (0.78 + 0.22 * am);
        // at night the light on the floor is most at the hall's front and falls away across the floor
        if (v > 0) put(F, g, x, y, kf * v * (1 - 0.35 * t) * (fi === 13 ? 1 - 0.45 * Math.min(1, t / reach) : 1), 0, v, 0, fi);
      }
    }
  }
  // gold leaf catching the lamps: a breath of light at each glint
  function glintCatch(F, g, p, k) {
    for (let y = Math.floor(p[1] - 2) + 0.5; y < p[1] + 2; y++) for (let x = Math.floor(p[0] - 2) + 0.5; x < p[0] + 2; x++) {
      const d = Math.hypot(x - p[0], y - p[1]), v = 1 - sstep(d / 1.9); if (v > 0) put(F, g, x, y, k * v, 0.25 * k * v, 0, 0);
    }
  }

  // ------------------------------------------------------------ what belongs to the sky painter
  let DOME = null;
  function domeTable() {
    if (DOME) return DOME;
    // the chhatri's dome as the sky painter draws it (centre 960, 99; 35.2 across, 31 up, a 4.2 point at the crown)
    const pts = [];
    for (let i = 0; i <= 256; i++) { const a = Math.PI + i / 256 * Math.PI, u = Math.cos(a), v = Math.sin(a), sw = 1 + 0.035 * Math.sin(-a * 2); const kk = Math.max(0, 1 - Math.abs(u) / 0.3); pts.push([Math.abs(u * 35.2 * sw), 99 + v * 31 - 4.2 * kk * kk]); }
    // half-width at each tenth of a unit from the crown down
    const T = new Float32Array(400);
    for (let n = 0; n < 400; n++) { const y = 60 + n / 10; let w = -1; for (const p of pts) if (p[1] <= y && p[0] > w) w = p[0]; T[n] = w; }
    return (DOME = T);
  }
  // how far inside the chhatri a point is, in units (> 0 inside); a coarse outline a hair outside the ink
  function chhatriIn(x, y) {
    const adx = Math.abs(x - 960), yc = 63.8;
    let hw = -1;
    if (y >= 104.2 && y <= 109.8) hw = 48.8;
    else if (y > 109.8 && y <= 149) hw = 40.4;
    else if (y >= 98.8 && y < 104.2) hw = 36.9;
    else if (y >= 60 && y < 98.8) { const t = domeTable()[Math.min(399, Math.max(0, Math.round((y - 60) * 10)))]; hw = t < 0 ? -1 : t + 0.35; }
    if (y >= yc - 2.6 && y <= yc + 1.8) hw = Math.max(hw, 6.4);
    else if (y >= yc - 6.3 && y < yc - 2.6) hw = Math.max(hw, 4.5);
    else if (y >= yc - 12.8 && y < yc - 6.3) hw = Math.max(hw, 3.2);
    else if (y >= yc - 14.2 && y < yc - 12.8) hw = Math.max(hw, 1.6);
    else if (y >= yc - 17.9 && y < yc - 14.2) hw = Math.max(hw, 0.7 * (1 - (yc - 14.2 - y) / 3.7) + 0.25);
    return hw - adx;
  }
  // the share of a pixel the sky painter owns: the sky above the coping, but not the kanguras or the chhatri
  function skyShare(x, y, S) {
    if (y >= 119.5) return 0;
    const aa = 0.7 * S;
    let inside = chhatriIn(x, y);
    if (y >= 113.6 && Math.abs(x - 960) >= 48.5) {
      // the kanguras: one every nine units, a pointed merlon 5.8 high on the coping
      let u = ((x - 4.5) % 9 + 9) % 9; if (u > 4.5) u -= 9;
      const t = 119.8 - y, hw = t <= 1.9 ? 2.75 : t <= 3.1 ? lerp(2.75, 2.25, (t - 1.9) / 1.2) : t <= 4.99 ? lerp(2.25, 1.15, (t - 3.1) / 1.89) : t <= 5.85 ? lerp(1.15, 0.05, (t - 4.99) / 0.86) : -1;
      inside = Math.max(inside, hw + 0.2 - Math.abs(u));
    }
    inside = Math.max(inside, (y - 119.5));
    return clamp(0.5 - inside * aa, 0, 1);
  }
  function waterShare(G, x, y, S) {
    const w = G.tank && G.tank.water; if (!w || y < w[0][1]) return 0;
    const p0 = w[0], p1 = w[1], p2 = w[2], p3 = w[3];
    const tl = (y - p0[1]) / ((p3[1] - p0[1]) || 1), tr = (y - p1[1]) / ((p2[1] - p1[1]) || 1);
    const xl = lerp(p0[0], p3[0], tl), xr = lerp(p1[0], p2[0], tr);
    const inside = Math.min(x - xl, xr - x, (y - p0[1]) + 0.3);
    return clamp(0.5 + inside * 0.7 * S, 0, 1);
  }

  /* ------------------------------------------------------------ the pass */
  function pass(A, G, H, mood) {
    const Q = MOOD[mood], S = A.S, W = A.W;
    const [cx0, cy0, cx1, cy1] = A.clip(); if (cx1 <= cx0 || cy1 <= cy0) return;
    const g = { x0: Math.floor(cx0 / S) - 2, y0: Math.floor(cy0 / S) - 2 };
    g.w = Math.ceil(cx1 / S) + 3 - g.x0; g.h = Math.ceil(cy1 / S) + 3 - g.y0;
    const F = new Float32Array(g.w * g.h * NF), cell = mood === 'dusk' ? cellDusk : cellNight;
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) cell(A, G, H, Q, g.x0 + i + 0.5, g.y0 + j + 0.5, F, (j * g.w + i) * NF);
    // the lamps, then the lantern hall
    const LP = Q.lamp;
    const gx0 = g.x0 - 30, gx1 = g.x0 + g.w + 30, gy0 = g.y0 - 30, gy1 = g.y0 + g.h + 30, near = (x, y) => x > gx0 && x < gx1 && y > gy0 && y < gy1;
    const nt = mood === 'night', fN = nt ? 13 : 6;
    for (const p of G.lamps || []) if (near(p[0], p[1])) splat(A, G, H, F, g, p[0], p[1], LP.R, LP.k, LP.core, 1, nt);
    const canopy = G.canopy && G.canopy.length ? G.canopy : null;
    if (canopy) {
      // at night the hall's spill on the floor in front is lamplight laid on; inside, its lanterns and diyas light the hall
      if (G.hot && G.hot.pragyan) hallPool(A, F, g, G.hot.pragyan, Q.hall.k, Q.hall.floor, canopy, fN);
      for (const c of canopy) if (near(c.x, c.y)) splatRound(A, F, g, c.x, c.y, 12 * Q.hall.R * clamp((c.s || 12) / 15, 0.5, 1.3), Q.hall.lk, LP.core * 0.8, 2);
    }
    for (const p of G.glints || []) if (near(p[0], p[1])) glintCatch(F, g, p, Q.glint);
    // per pixel: the field read back (bilinear), the tone, the pools
    const R = A.R, Gc = A.G, B = A.B, nX = cx1 - cx0;
    const ci = new Int32Array(nX), ct = new Float32Array(nX);
    for (let X = cx0; X < cx1; X++) { const u = clamp((X + 0.5) / S - g.x0 - 0.5, 0, g.w - 1.001), i = Math.floor(u); ci[X - cx0] = i * NF; ct[X - cx0] = u - i; }
    const row = new Float32Array(g.w * NF);
    const skyTheirs = !!(M.w8SkyBody && M.w8y && M.w8y.sky), waterTheirs = !!(M.w8SkyBody && M.w8y && M.w8y.water);
    const night = mood === 'night', sT = Q.satT || [1, 1, 1], sU = 1 + (Q.satUp || 0);
    /* the flights, for the noses of the treads: each flight's head and foot and its step, as the stair painter lays
       them (n steps of about 5.6 from the head to the landing; the nose a little past the middle of each step) */
    const FL = [];
    if (night) for (const L of G.levels || []) {
      if (L.foot == null || L.top == null) continue;
      const yA = L.k === 1 ? Math.max(L.top - 4, H.CHHATRI ? H.CHHATRI.base : 148) : L.top - 4, n = Math.max(1, Math.round((L.foot - yA) / 5.6));
      if (yA < (Q.noseTo || Q.noseEnd)) FL.push([yA, L.foot, (L.foot - yA) / n]);
    }
    const OB = night && Q.obj ? objLights(G, Q.obj, S, cx0, cy0, cx1, cy1) : [], oC = Q.obj ? Q.obj.C : null, oL = Q.obj ? Q.obj.lo : 0;
    const nose = Q.nose, PN = Q.PN || 1, h0 = Q.hold ? Q.hold[0] : 0.1, hW = Q.hold ? Q.hold[1] - Q.hold[0] : 0.24, mT = Q.moonT, mL = Q.moonL;
    const cm = Q.coreMix || 0, ch = Q.chroma, ind = Q.ind, sc0 = Q.sunC || Q.silver, lt = LP.tint, lc = LP.coreC, air = Q.air, airK = Q.airK || 0;
    const nC = LP.C, nG = LP.gain, nA = LP.amb, nF = LP.fall, nW = LP.water || 0, gT = LP.glowT;
    /* a pool's rim rubbed on: the strength dragged along the way the strokes run there, in streaks, as the side of a
       pastel stick leaves it, most where the pool is thin */
    const rub = (a, b0, b1, s, X, y) => {
      if (a >= 0.995) return a;
      const c2 = row[b0 + 8] + (row[b1 + 8] - row[b0 + 8]) * s, s2 = row[b0 + 9] + (row[b1 + 9] - row[b0 + 9]) * s, m2 = Math.hypot(c2, s2);
      let ex = 0.993, ey = 0.12;
      if (m2 > 1e-3) { const cc = c2 / m2; ex = Math.sqrt(0.5 * (1 + cc)); ey = (s2 < 0 ? -1 : 1) * Math.sqrt(Math.max(0, 0.5 * (1 - cc))); }
      const px = (X + 0.5) / S, u = px * ex + y * ey, w = y * ex - px * ey;
      const n = (A.noise2(u / 3.4 + 5, w / 0.45, 21) - 0.5) * 1.6 + (A.noise2(u / 1.3, w / 0.22, 22) - 0.5) * 0.9;
      return clamp(a + 0.85 * n * a * (1 - a), 0, 1);
    };
    const skyCol = y => { const s = Q.sky; if (y <= s[0][0]) return s[0][1]; for (let q = 1; q < s.length; q++) if (y <= s[q][0]) return mix3(s[q - 1][1], s[q][1], (y - s[q - 1][0]) / (s[q][0] - s[q - 1][0])); return s[s.length - 1][1]; };
    for (let Y = cy0; Y < cy1; Y++) {
      const y = (Y + 0.5) / S, v = clamp(y - g.y0 - 0.5, 0, g.h - 1.001), j = Math.floor(v), tv = v - j;
      const o0 = j * g.w * NF, o1 = o0 + g.w * NF;
      for (let q = 0; q < g.w * NF; q++) row[q] = F[o0 + q] + (F[o1 + q] - F[o0 + q]) * tv;
      const rimRow = y < 150, waterRow = G.tank && G.tank.water && y >= G.tank.water[0][1] - 1;
      const sk = rimRow ? skyCol(y) : null, ob = OB.length ? OB.filter(o => Y >= o.m.Y0 && Y < o.m.Y0 + o.m.h) : OB;
      for (let X = cx0; X < cx1; X++) {
        const b0 = ci[X - cx0], s = ct[X - cx0], b1 = b0 + NF, i = Y * W + X;
        const r0 = R[i], g0 = Gc[i], bl0 = B[i];
        // whose pixel: 1 lit here, 0 the sky painter's (sky or water)
        let own = 1, foreign = null;
        if (rimRow) { const sh = skyShare((X + 0.5) / S, y, S); if (sh > 0) { own = 1 - sh; foreign = skyTheirs ? null : sk; } }
        else if (waterRow && waterTheirs) own = 1 - waterShare(G, (X + 0.5) / S, y, S);
        const gm = row[b0] + (row[b1] - row[b0]) * s, sc = row[b0 + 1] + (row[b1 + 1] - row[b0 + 1]) * s;
        const tr = row[b0 + 2] + (row[b1 + 2] - row[b0 + 2]) * s, tg = row[b0 + 3] + (row[b1 + 3] - row[b0 + 3]) * s, tb = row[b0 + 4] + (row[b1 + 4] - row[b0 + 4]) * s;
        let sa = row[b0 + 5] + (row[b1 + 5] - row[b0 + 5]) * s; const L = row[b0 + 6] + (row[b1 + 6] - row[b0 + 6]) * s, Lc = row[b0 + 7] + (row[b1 + 7] - row[b0 + 7]) * s;
        let r = r0, gg = g0, b = bl0;
        const La = night ? row[b0 + 13] + (row[b1 + 13] - row[b0 + 13]) * s : 0;
        if (own > 0) {
          const l = 0.3 * r + 0.59 * gg + 0.11 * b;
          // moonlight takes a little of the fire out of the warm colours
          if (ch > 0) { const d = ch * clamp((r - b) * 2 + 0.3, 0, 1); r += (l - r) * d; gg += (l - gg) * d; b += (l - b) * d; }
          if (night) {
            /* two nights, mixed by how coloured the paint is.  Pale or grey paint takes the night as a glaze: a deep
               indigo at a lightness of its own (the paint's lightness only shading it), silver where the moon touches
               a top edge.  Strongly coloured paint keeps its hue, laid down (vermilion to crimson, ochre to a warm
               dark ochre, malachite to emerald), so it stands lighter than the stone round it. */
            const ml0 = rimRow ? moonRim((X + 0.5) / S, y) : row[b0 + 12] + (row[b1 + 12] - row[b0 + 12]) * s, ml = ml0 > 1 ? 1 : ml0;
            const lo = l > 1e-4 ? sc * Math.exp((gm - 0.07 * ml) * Math.log(l)) : 0, v = l > 1e-4 ? lo / l : 0;
            const gl = lerp(row[b0 + 11] + (row[b1 + 11] - row[b0 + 11]) * s, mL, ml), lg = l > 1e-4 ? gl * Math.exp(PN * Math.log(l)) : 0;
            const mm = ml < 0.625 ? 1.6 * ml : 1, gr = lg * lerp(tr, mT[0], mm), gG = lg * lerp(tg, mT[1], mm), gb = lg * lerp(tb, mT[2], mm);
            const mx = r > gg ? (r > b ? r : b) : (gg > b ? gg : b), mn = r < gg ? (r < b ? r : b) : (gg < b ? gg : b);
            const hk = (row[b0 + 10] + (row[b1 + 10] - row[b0 + 10]) * s) * (1 - 0.85 * ml);
            /* near a lamp, the painter's own glow round it (a warm haze, little colour, middle value) is lamplight and
               keeps its hue; under the glaze it went near black and read as a dark smudge round the flame */
            const nr = row[b0 + 14] + (row[b1 + 14] - row[b0 + 14]) * s;
            const hs = sstep(((mx > 1e-4 ? (mx - mn) / mx : 0) - h0) / hW), hd = nr > 0.002 ? nr * sstep((l - 0.1) / 0.08) * (1 - sstep((l - 0.34) / 0.22)) : 0;
            const hold = hk * (hs > hd ? hs : hd), wk = hd > hs ? hd - hs : 0;
            const t0 = wk > 0 ? sT[0] * (1 + (gT[0] - 1) * wk) : sT[0], t1 = wk > 0 ? sT[1] * (1 + (gT[1] - 1) * wk) : sT[1], t2 = wk > 0 ? sT[2] * (1 + (gT[2] - 1) * wk) : sT[2];
            r = gr + (r * v * t0 - gr) * hold; gg = gG + (gg * v * t1 - gG) * hold; b = gb + (b * v * t2 - gb) * hold;
            const l2 = 0.3 * r + 0.59 * gg + 0.11 * b; r = l2 + (r - l2) * sU; gg = l2 + (gg - l2) * sU; b = l2 + (b - l2) * sU;
            // the noses of the treads at the head of the stair: a thin silver line on each lit nose, dying out going down
            if (FL.length && y < (Q.noseTo || Q.noseEnd)) {
              const px = (X + 0.5) / S, hw = H.stairHW(y), adx = Math.abs(px - 960);
              if (adx < hw + 0.4) for (const f of FL) {
                if (y < f[0] || y >= f[1]) continue;
                const stp = f[2], i0 = Math.floor((y - f[0]) / stp), yc = f[0] + (i0 + 0.58) * stp - 0.42;
                const win = 1 - sstep((Math.abs(y - yc) - 0.2) / 0.32);
                const f0 = 1 - sstep((y - 160) / (Q.noseEnd - 160)), nT = Q.noseTo || Q.noseEnd;
                /* below the head the moon still finds the noses, faintly, all the way to the water, so the flight reads as
                   steps and not as a dark band */
                const fade = Math.max(f0 * f0, (Q.noseLow || 0) * (1 - sstep((y - nT + 60) / 60))), lat = 1 - 0.6 * sstep((adx / hw - 0.7) / 0.3);
                /* laid by hand: each nose a little stronger or weaker than the next, and dragged unevenly along its length */
                const hv = 0.62 + 0.55 * A.noise2(i0 * 0.71 + f[0] * 0.13, px / 19, 31) + 0.25 * (A.noise2(px / 3.1, i0 * 1.37, 32) - 0.5);
                const k = 0.9 * win * fade * lat * (hv > 1.1 ? 1.1 : hv) * sstep((l - 0.45) / 0.3);
                if (k > 0.002) { const q = l < 0.85 ? l / 0.85 : 1; r += (nose[0] * q - r) * k; gg += (nose[1] * q - gg) * k; b += (nose[2] * q - b) * k; }
                break;
              }
            }
            sa = 0.05 * ml;
          } else {
            // the value laid down and the hue held: each channel bent by the same power, then the hour's cast
            r = r > 1e-4 ? sc * tr * Math.exp(gm * Math.log(r)) : 0;
            gg = gg > 1e-4 ? sc * tg * Math.exp(gm * Math.log(gg)) : 0;
            b = b > 1e-4 ? sc * tb * Math.exp(gm * Math.log(b)) : 0;
          }
          // a breath of indigo (or plum) in the deepest darks, so nothing goes to black
          const e = (1 - l) * (1 - l); r += ind[0] * e; gg += ind[1] * e; b += ind[2] * e;
          // the hour's own light laid over thinly: the sun's gold on the rim, the moon's silver down the stair
          if (sa > 0.001) { r = 1 - (1 - r) * (1 - sa * sc0[0]); gg = 1 - (1 - gg) * (1 - sa * sc0[1]); b = 1 - (1 - b) * (1 - sa * sc0[2]); }
          if (airK) { r += (air[0] - r) * airK; gg += (air[1] - gg) * airK; b += (air[2] - b) * airK; }
          // a focal thing at night: its own paint warm in a near lamp's light, on its own pixels only
          if (ob.length) {
            let ko = 0;
            for (const o of ob) {
              const m = o.m, xx = X - m.X0, yy = Y - m.Y0;
              if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h) continue;
              const ma = m.a[yy * m.w + xx]; if (ma < 0.002) continue;
              const sp = (((X + 0.5) / S - o.cx) * o.dx + (y - o.cy) * o.dy) / o.half, k = ma * o.k * (oL + (1 - oL) * sstep((sp + 1.1) / 2.2));
              if (k > ko) ko = k;
            }
            if (ko > 0.002) {
              const lb = 0.3 * r + 0.59 * gg + 0.11 * b, ka = 1 - Q.obj.amb * Math.sqrt(ko), kg = Q.obj.gain * ko;
              r = r * ka + r0 * oC[0] * kg; gg = gg * ka + g0 * oC[1] * kg; b = b * ka + bl0 * oC[2] * kg;
              const la = 0.3 * r + 0.59 * gg + 0.11 * b;
              if (la < lb && la > 1e-4) { const u = lb / la; r *= u; gg *= u; b *= u; }
            }
          }
          /* inside a lamp's pool the paint shows its own colour again, warmed.  The pool's rim is rubbed on: the strength
             is dragged along the ledge in streaks, as the side of a pastel stick leaves it, most where the pool is thin */
          if (L > 0.002) {
            const a = rub(L > 1 ? 1 : L, b0, b1, s, X, y);
            r += (r0 * lt[0] - r) * a; gg += (g0 * lt[1] - gg) * a; b += (bl0 * lt[2] - b) * a;
          }
          /* a night lamp's light: warm amber laid on over the night (the paint's colour times the flame's), the night's
             blue drawn a little out from under it; falling off fast, so it is a pool and not a haze */
          if (La > 0.002) {
            const a = rub(sstep((La - nF[0]) / (nF[1] - nF[0])) * (0.35 + 0.65 * clamp((La - nF[1]) / (1 - nF[1]), 0, 1)), b0, b1, s, X, y), ka = 1 - nA * Math.sqrt(a), kg = nG * a;
            const lb = 0.3 * r + 0.59 * gg + 0.11 * b;
            r = r * ka + r0 * nC[0] * kg; gg = gg * ka + g0 * nC[1] * kg; b = b * ka + bl0 * nC[2] * kg;
            // light only adds: where the warm light would read darker than what was there, it is lifted to that value
            const la = 0.3 * r + 0.59 * gg + 0.11 * b;
            if (la < lb && la > 1e-4) { const u = lb / la; r *= u; gg *= u; b *= u; }
          }
          if (own < 1) {
            const fr = foreign ? foreign : null;
            const br = fr ? lerp(r0, fr[0], Q.skyK) : r0, bg = fr ? lerp(g0, fr[1], Q.skyK) : g0, bb = fr ? lerp(bl0, fr[2], Q.skyK) : bl0;
            r = br + (r - br) * own; gg = bg + (gg - bg) * own; b = bb + (b - bb) * own;
          }
        } else if (foreign) { r = lerp(r0, foreign[0], Q.skyK); gg = lerp(g0, foreign[1], Q.skyK); b = lerp(bl0, foreign[2], Q.skyK); }
        // on what is not stone (the sky painter's water, the sky) a lamp only adds its light
        const kc = Lc + (own < 1 ? (1 - own) * 0.3 * (L > 1 ? 1 : L) + (nW ? (1 - own) * nW * (La > 1 ? 1 : La) : 0) : 0);
        if (kc > 0.002) {
          const k = kc > 1.2 ? 1.2 : kc, km = (k > 1 ? 1 : k) * cm;
          // the flame's saffron rubbed in round it (so it shows on lit cream at dusk), then its light laid over
          r += (lc[0] - r) * km; gg += (lc[1] - gg) * km; b += (lc[2] - b) * km;
          r = 1 - (1 - r) * (1 - k * 0.6 * lc[0]); gg = 1 - (1 - gg) * (1 - k * 0.6 * lc[1]); b = 1 - (1 - b) * (1 - k * 0.6 * lc[2]);
        }
        R[i] = r < 0 ? 0 : r > 1 ? 1 : r; Gc[i] = gg < 0 ? 0 : gg > 1 ? 1 : gg; B[i] = b < 0 ? 0 : b > 1 ? 1 : b;
      }
    }
  }

  /* by day: the stair's cream, under the old noon column, read as a white stripe from the rim to the water.  Laid a
     little down here (a warm, thin glaze over the flight only, its edge the column's own unsteady edge) so the flight
     sits among the floors and walls; nothing else in the day picture is touched. */
  function dayStair(A, H) {
    if (!DAY_STAIR) return;
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, W = A.W;
    const Y0 = Math.max(cy0, Math.floor(146 * S)), Y1 = Math.min(cy1, Math.ceil(1014 * S));
    for (let Y = Y0; Y < Y1; Y++) {
      const y = (Y + 0.5) / S, hw = H.stairHW(clamp(y, 146, 1012)) + 10;
      const X0 = Math.max(cx0, Math.floor((960 - hw) * S)), X1 = Math.min(cx1, Math.ceil((960 + hw) * S));
      const top = 0.55 + 0.45 * sstep((y - 150) / 150);   // the head of the flight too, so it sits level with the landings
      for (let X = X0; X < X1; X++) {
        const k = DAY_STAIR * clamp(column(A, H, (X + 0.5) / S, y), 0, 1) * top; if (k <= 0.002) continue;
        const i = Y * W + X;
        A.R[i] *= 1 - 0.12 * k; A.G[i] *= 1 - 0.17 * k; A.B[i] *= 1 - 0.24 * k;
      }
    }
  }

  /* the noon pass (the stage's light0, line for line) with the sun column softened: it is as warm as before at the
     top by the chhatri, but fades much sooner down the flight, and the well's shade is no longer lifted off the stair
     all the way down, so the treads keep their own colour and the flight sits in the walls' values at the whole view */
  function dayPass(A, G, H) {
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, sh = hex(H.TOK.chhaya), gl = hex('#c8963a'), sun = H.SUN, WATER = H.WATER;
    for (let Y = cy0; Y < cy1; Y++) {
      const y = (Y + 0.5) / S, wcol = 52 + y * 0.05;
      const down = 0.25 * sstep((y - 330) / 680), top = sstep((y - 70) / 50);
      const fallOld = 1 - 0.35 * sstep((y - 200) / 800), fallNew = 1 - 0.85 * sstep((y - 150) / 300);
      const fallCol = lerp(fallOld, fallNew, DAY_SOFT) * top, lift = lerp(1, 0.3 + 0.7 * fallNew, DAY_SOFT), kcol = lerp(0.5, 0.44, DAY_SOFT);
      for (let X = cx0; X < cx1; X++) {
        const x = (X + 0.5) / S, dx = Math.abs(x - 960), col = Math.exp(-(dx / wcol) * (dx / wcol));
        let kd = down + 0.3 * sstep((dx - 560) / 520) * sstep((y - 150) / 160);
        kd *= 1 - 0.85 * col * lift;
        /* the water takes less of the shade, and only the water: laid on every row past the water line, it drew a hard
           seam across the side floors and walls that go on down past that line */
        if (y > WATER) kd *= 1 - 0.55 * waterShare(G, x, y, S);
        const i = Y * A.W + X;
        if (kd > 0.002) { A.R[i] *= 1 - kd + kd * sh[0]; A.G[i] *= 1 - kd + kd * sh[1]; A.B[i] *= 1 - kd + kd * sh[2]; }
        const ds = Math.hypot(x - sun.x, y - sun.y), kl = kcol * col * fallCol + 0.45 * Math.exp(-(ds / 120) * (ds / 120));
        if (kl > 0.002) { A.R[i] = 1 - (1 - A.R[i]) * (1 - gl[0] * kl); A.G[i] = 1 - (1 - A.G[i]) * (1 - gl[1] * kl); A.B[i] = 1 - (1 - A.B[i]) * (1 - gl[2] * kl); }
      }
    }
  }

  M.w8y.light = Object.assign(function (A, G, H) {
    const mood = (G && G.mood) || 'day';
    if (!MOOD[mood]) { if (DAY_SOFT) dayPass(A, G, H); else H.old.light(A, G); dayStair(A, H); return; }
    pass(A, G, H, mood);
  }, { part: 'light' });

  /* ------------------------------------------------------------ the bloom round each flame
     The folio way: a soft warm bloom of pastel rubbed out with the finger, darker and wider outside, warmer and
     smaller inside.  No ring of dots here: at this size they would read as a drawn circle. */
  function bloom(A, x, y, r, k, seed) {
    const an = A.hash(Math.round(x * 4), Math.round(y * 4), seed) * Math.PI;
    A.dot(x, y + r * 0.08, 'pastel', A.mix('saffron', 'neel', 0.32), { w: r * 1.6, p: 0.1 + 0.16 * k, len: r * 0.05, reach: 0.95, hard: 0.85, ang: an });
    A.dot(x, y, 'pastel', A.mix('saffron', 'haldi', 0.4), { w: r * 0.9, p: 0.12 + 0.2 * k, len: r * 0.04, reach: 1.0, hard: 0.95, ang: an + 1.1 });
  }
  M.w8y.glow = Object.assign(function (A, G, H) {
    const mood = (G && G.mood) || 'day', Q = MOOD[mood];
    if (!Q) return;
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, pad = 12;
    const inClip = (x, y) => x * S > cx0 - pad * S && x * S < cx1 + pad * S && y * S > cy0 - pad * S && y * S < cy1 + pad * S;
    const B = Q.bloom;
    for (const p of G.lamps || []) if (inClip(p[0], p[1])) bloom(A, p[0], p[1], B.r, B.k, 3);
    if (G.canopy) for (const c of G.canopy) if (inClip(c.x, c.y) && c.kind !== 'diya') bloom(A, c.x, c.y, Math.max(B.r, (c.s || 12) * 0.42), B.hall, 4);
  }, { part: 'light' });
})();
