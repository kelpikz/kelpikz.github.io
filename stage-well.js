/* ------------------------------------------------------------------ *
 *  THE STEPWELL  (the Experience page)
 *
 *  One tall painting of the far wall of a deep stepwell, cut into seven
 *  frames of the wide sheet (1600 x 900) laid one under the other with
 *  no seams: the rim at noon, five levels going down, and the water.
 *  Going down is going back in time: Optmyzr in the sun at the top,
 *  college by the water, and before college under it.
 *
 *  The flights of steps cross in V's as in the photograph of the real
 *  well.  The light goes from noon at the rim to night at the water, and
 *  the stone gets older as it goes down.  The years are on a carved gauge
 *  on the left wall, and the milestones are flood marks.  No words are
 *  painted: the page writes them over the blank faces.  The lamp that
 *  walks down, the lamps in the alcoves and everything that moves are
 *  loose drawings (cels).
 * ------------------------------------------------------------------ */
STAGE.places.well = (function () {
  const P = {};

  /* ================================================================ THE STORY, AS DATA
     NOT CONFIRMED: how the years are grouped into levels is a first guess, and 2022 for the two hackathon wins is a guess.
     Change it here; the page reads it from assets/well.json.  y is where it is on the sheet; a level is one frame. */
  const DATA = P.DATA = {
    unconfirmed: ['the grouping of years into levels', 'the hackathon year (2022)'],
    levels: [
      { frame: 1, years: [2025, 2026], label: 'Optmyzr, now', hour: 'noon', objects: [
        { id: 'sidekick', what: 'a dovecote with ten holes: Sidekick, the chat agent', motif: 'dovecote' },
        { id: 'rule-builder', what: 'a loom with a pattern begun: the AI Rule Builder', motif: 'loom' }] },
      { frame: 2, years: [2023, 2024], label: 'Optmyzr, the start', hour: 'afternoon', objects: [
        { id: 'joined', what: 'a toran over the alcove: joining in June 2023', motif: 'toran' },
        { id: 'portfolio', what: 'six spouts running into one tank: the Portfolio platform', motif: 'spouts' }] },
      { frame: 3, years: [2022], label: 'Pragyan and the hackathons', hour: 'dusk', objects: [
        { id: 'pragyan', what: 'paper lanterns and marigold strings: Pragyan, the tech fest', motif: 'lanterns' },
        { id: 'hackathons', what: 'two small gold cups: two hackathon wins', motif: 'cups', guess: true }] },
      { frame: 4, years: [2020, 2021], label: 'Delta Force', hour: 'evening', objects: [
        { id: 'delta-force', what: 'a flock flying in a delta, and a pennant', motif: 'flock' }] },
      { frame: 5, years: [2019], label: 'NIT Trichy', hour: 'night', objects: [
        { id: 'nit-trichy', what: 'a lotus in a small stepped kund', motif: 'kund' }] }
    ],
    milestones: [
      { id: 'joined-optmyzr', at: 2023 + 5.5 / 12, kind: 'sindoor', text: 'June 2023: joined Optmyzr' },
      { id: 'hackathons', at: 2022.5, kind: 'gold', text: '2022: won two hackathons', guess: true },
      { id: 'nit-trichy', at: 2019.55, kind: 'soft', text: '2019: NIT Trichy' }
    ]
  };

  const PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const r0 = v => Math.round(v);

  /* ================================================================ THE SHEET */
  const W = 1600, FH = 900, NF = 7, H = FH * NF;
  const RIM = 690, WATER = 5330, CARD = 1040;          // the card covers x > CARD on every level frame
  // the five levels: where each starts, where its floor is, the size of one stair pyramid (P), where its alcove is, how far
  // the side walls have come in (left, right) and how old the stone is (0 dry .. 1 wet)
  const LV = [
    { top: RIM, yF: 1690, P: 902, ax: 550, inL: 104, inR: 0, age: 0.04 },
    { top: 1730, yF: 2590, P: 785, ax: 450, inL: 104, inR: 0, age: 0.24 },
    { top: 2630, yF: 3490, P: 785, ax: 520, inL: 104, inR: 100, age: 0.5 },
    { top: 3530, yF: 4390, P: 785, ax: 480, inL: 150, inR: 150, age: 0.75 },
    { top: 4430, yF: 5290, P: 785, ax: 560, inL: 200, inR: 200, age: 0.95 }
  ];
  const NSTEP = 9, LAND = 44;
  // the gauge: years against y.  A level of the well holds the years between its top and its floor; the ledge holds none.
  const YMAP = [[RIM, 2027], [1690, 2025], [1730, 2025], [2590, 2023], [2630, 2023], [3490, 2022], [3530, 2022], [4390, 2020], [4430, 2020], [5290, 2019]];
  function yOf(t) {
    for (let i = 0; i + 1 < YMAP.length; i++) { const a = YMAP[i], b = YMAP[i + 1]; if (a[1] === b[1]) continue; if (t <= a[1] && t >= b[1]) return a[0] + (b[0] - a[0]) * (a[1] - t) / (a[1] - b[1]); }
    if (t < 2019) return 5290 + (2019 - t) * 860;
    return null;
  }
  function yearAt(y) {
    for (let i = 0; i + 1 < YMAP.length; i++) { const a = YMAP[i], b = YMAP[i + 1]; if (y >= a[0] && y <= b[0]) return a[1] === b[1] ? a[1] : a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); }
    return y < RIM ? 2027 : 2019 - (y - 5290) / 860;
  }
  const GAUGE = { x0: 26, x1: 96 };

  /* ================================================================ THE LIGHT OF THE HOUR, BY DEPTH
     each key: the stone of the wall (wall), its shadowed recesses (recess), the face of a stair mass (face), the top of a
     tread (tread), the dark under a nosing (riser), the shadow one mass throws on the wall (cast), the dark of a niche
     (deep), the kajal line (line), lime-wash (lime); and a glaze the objects take on in this light (glaze, gl). */
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
  const hexc = h => { const v = parseInt(h.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const KC = {};
  for (const k in KEYS) { KC[k] = {}; for (const f in KEYS[k]) KC[k][f] = typeof KEYS[k][f] === 'string' ? hexc(KEYS[k][f]) : KEYS[k][f]; }
  // each level holds its own hour in its middle; the light turns across the ledges between them
  // each hour is true at the middle of its level and the light moves on all the way down, so a ledge is never a border
  const ANCH = [[0, 'noon'], [1100, 'noon'], [2160, 'after'], [3060, 'dusk'], [3960, 'eve'], [4860, 'night'], [5540, 'water'], [H, 'water']];
  const kcache = new Map();
  function keyAt(y) {
    const q = Math.round(y / 6) * 6;
    if (kcache.has(q)) return kcache.get(q);
    let i = 0; while (i + 2 < ANCH.length && q > ANCH[i + 1][0]) i++;
    const a = ANCH[i], b = ANCH[i + 1], t = a[1] === b[1] ? 0 : clamp((q - a[0]) / (b[0] - a[0]), 0, 1), A0 = KC[a[1]], B0 = KC[b[1]], K = {};
    for (const f in A0) K[f] = Array.isArray(A0[f]) ? mixc(A0[f], B0[f], t) : lerp(A0[f], B0[f], t);
    const near = t < 0.5 ? a[1] : b[1];
    K.moss = MOSS[near][0]; K.mossTip = MOSS[near][1]; K.hour = near;
    kcache.set(q, K);
    return K;
  }
  // what a pigment looks like at depth y
  const toneAt = (A, y) => { const K = keyAt(y); return c => A.mix(c, K.glaze, K.gl); };

  /* ================================================================ GEOMETRY */
  // one stair pyramid: two flights falling left and right from a landing at (c, y0) to the foot of the tier at y1
  function mass(c, y0, y1, Pw, lw) {
    const n = NSTEP, rise = (y1 - y0) / n, run = (Pw / 2 - lw / 2) / n, L = [], R = [], steps = [];
    // laid by hand: no two treads quite the same height, no two risers quite plumb with the rest
    const g = STAGE.rng((Math.round(c * 7.3 + y0 * 13.1) >>> 0) + 1), j = () => ({ x: [0, 0].concat(Array.from({ length: n }, () => g.rr(-5.5, 5.5))), y: [0].concat(Array.from({ length: n }, (v, i) => i === n - 1 ? 0 : g.rr(-4, 4))) });
    const jl = j(), jr = j();
    const xl = i => c - lw / 2 - (i - 1) * run + (i > n ? 0 : jl.x[i]), xr = i => c + lw / 2 + (i - 1) * run - (i > n ? 0 : jr.x[i]);
    const yl = i => i === 0 ? y0 : y0 + i * rise + jl.y[i], yr = i => i === 0 ? y0 : y0 + i * rise + jr.y[i];
    L.push([xl(1), y0]); R.push([xr(1), y0]);
    for (let i = 1; i <= n; i++) {
      L.push([xl(i), yl(i)], [xl(i + 1), yl(i)]); R.push([xr(i), yr(i)], [xr(i + 1), yr(i)]);
      if (i < n) { steps.push({ x0: xl(i + 1), x1: xl(i), y: yl(i), dir: -1, h: yl(i + 1) - yl(i) }); steps.push({ x0: xr(i), x1: xr(i + 1), y: yr(i), dir: 1, h: yr(i + 1) - yr(i) }); }
    }
    steps.unshift({ x0: xl(1), x1: xr(1), y: y0, dir: 0, h: rise, riser: false });
    const pts = L.slice().reverse().concat(R);
    return { pts, apex: [xl(1), xr(1), y0], base: y1, steps, c, rise, run };
  }
  function levelGeom(L, k) {
    const ht = (L.yF - L.top) / 3, out = Object.assign({ k, ht, masses: [] }, L);
    for (let j = 0; j < 3; j++) {
      const y0 = L.top + j * ht, y1 = y0 + ht, off = j % 2 ? L.P / 2 : 0;
      let c = L.ax + off; while (c - L.P > -L.P / 2) c -= L.P;
      for (; c - L.P / 2 < W + 2; c += L.P) out.masses.push(Object.assign(mass(c, y0, y1, L.P, LAND), { tier: j }));
    }
    out.mid = (L.top + L.yF) / 2;
    out.alcove = { x: L.ax, yb: L.yF - 8, w: 104, h: 176 };
    out.lamp = [L.ax, L.yF - 12];
    out.left = L.inL; out.right = W - L.inR;
    return out;
  }

  P.geom = function (fmt) {
    const G = { fmt: 'wide', W, H, FH, NF, wide: true, RIM, WATER, CARD, keyAt, yOf, yearAt, toneAt, focus: [0.33, 0.5], sky: { u1: 1, v1: 0.04 } };
    G.frames = []; for (let i = 0; i < NF; i++) G.frames.push({ i, y: i * FH, h: FH, name: i === 0 ? 'rim' : i === NF - 1 ? 'water' : 'level ' + i });
    G.levels = LV.map((L, i) => levelGeom(L, i + 1));
    const R = STAGE.rng(20231);
    // what stands on each level (sheet units).  Boxes are for hovering: [x0, y0, x1, y1]
    const [L1, L2, L3, L4, L5] = G.levels;
    G.chhatri = { cx: 650, by: 640, s: 1 };
    G.dove = { x: 252, yb: L1.yF + 10, s: 0.94 };
    G.loom = { x: 826, yb: L1.yF + 10, s: 1 };
    G.tank = { cx: 790, yTank: L2.yF - 62, w: 270, yb: L2.yF + 10 };
    G.spouts = M.wellSpoutPts(G.tank.cx, G.tank.yTank);
    G.toran = { x0: L2.ax - 62, x1: L2.ax + 62, y: L2.alcove.yb - L2.alcove.h - 14 };
    G.lanternString = { from: [140, 2716], to: [1080, 2724], sag: 74, n: 11 };
    // where the lanterns hang: fixed here so the glow (a cel) sits on them
    {
      const s = G.lanternString, mid = [(s.from[0] + s.to[0]) / 2, (s.from[1] + s.to[1]) / 2 + s.sag];
      const q = t => { const u = 1 - t; return [u * u * s.from[0] + 2 * u * t * (2 * mid[0] - (s.from[0] + s.to[0]) / 2) + t * t * s.to[0], u * u * s.from[1] + 2 * u * t * (2 * mid[1] - (s.from[1] + s.to[1]) / 2) + t * t * s.to[1]]; };
      G.lanterns = []; for (let i = 0; i < s.n; i++) { const t = (i + 0.5) / s.n, p = q(t), hang = R.rr(12, 22), r = R.rr(11, 14); G.lanterns.push({ top: p, x: p[0], y: p[1] + hang + 16, r, hang }); }
    }
    G.cups = { x: 770, yb: L3.yF + 10, s: 1.6 };
    G.pole = { x: 790, yb: L4.yF + 10, h: 318 };
    G.flag = [G.pole.x + 2, G.pole.yb - G.pole.h + 10];
    G.delta = { x: 520, y: 3800, slots: [[0, 0], [84, -36], [-4, 64], [168, -70], [80, 100], [250, -100], [160, 136]] };
    G.kund = { cx: 830, yb: L5.yF + 10, w: 300 };
    G.diya = [640, 5760];
    // the lamp's way down: along the rim, down one diagonal of crossing flights per level, along the floor to the alcove
    const path = [[G.chhatri.cx - 40, 652], [L1.ax - 8, 664], [L1.ax, L1.top]], stops = [];
    G.levels.forEach((L, i) => {
      if (i > 0) {
        // from the last alcove along the floor to the head of a flight of this level, and down onto its landing
        const prev = G.levels[i - 1];
        let best = L.ax, bd = 1e9; for (let m = -3; m <= 3; m++) { const c = L.ax + m * L.P; if (c < L.left + 60 || c > CARD) continue; const d = Math.abs(c - prev.ax); if (d < bd) { bd = d; best = c; } }
        path.push([best, prev.yF + 4], [best, L.top]);
      }
      // choose the diagonals so the walk stays left of the card
      let x = path[path.length - 1][0], y = L.top;
      const ok = v => v > L.left + 40 && v < CARD;
      const d1 = ok(x + L.P / 2) ? 1 : -1; x += d1 * L.P / 2; y += L.ht; path.push([x - d1 * LAND / 2, y - L.ht + L.rise0], [x, y]);
      x -= d1 * L.P / 2; y += L.ht; path.push([x, y]);
      const d3 = ok(x - L.P / 2) ? -1 : 1; x += d3 * L.P / 2; y += L.ht; path.push([x, L.yF + 4]);
      path.push([L.ax, L.yF + 4], L.lamp.slice());
      stops.push(path.length - 1);
    });
    path.push([L5.ax + 60, WATER + 8], [G.diya[0], G.diya[1]]);
    stops.push(path.length - 1);
    G.lampPath = path.map(p => [r0(p[0]), r0(p[1])]); G.lampStops = stops;
    // the gauge, and the blank faces where the page writes each year
    G.gauge = { x0: GAUGE.x0, x1: GAUGE.x1, y0: RIM - 14, y1: H + 6, years: [2017, 2027], yOf, capital: true, faces: [] };
    for (let Y = 2026; Y >= 2019; Y--) { const y = yOf(Y); G.gauge.faces.push({ year: Y, y0: r0(y - 48), y1: r0(y - 8) }); }
    G.milestones = DATA.milestones.map(m => { const y = yOf(m.at); return Object.assign({}, m, { y: r0(y), plaque: [GAUGE.x1 + 4, r0(y - 29), 330, r0(y + 29)] }); });
    void R;
    return G;
  };
  // the height of the first riser of a level (for the lamp path)
  LV.forEach(L => { L.rise0 = (L.yF - L.top) / 3 / NSTEP; });

  /* ================================================================ PAINTING HELPERS */
  // a wash whose colour changes from row to row, rubbed in with a cloth (the under-colour of the wall)
  function gradWash(A, poly, colAt, k) {
    const mk = A.pushMask(poly, 0); A.popMask();
    const S = A.S; let lastY = -1, c = null;
    for (let y = 0; y < mk.h; y++) {
      const Y = y + mk.y0; if (Y < 0 || Y >= A.H) continue;
      if (Y !== lastY) { c = colAt(Y / S); lastY = Y; }
      for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
        const X = x + mk.x0; if (X < 0 || X >= A.W) continue;
        const kk = v * (typeof k === 'function' ? clamp(k(X / S, Y / S), 0, 1) : k); if (kk <= 0) continue;
        const i = Y * A.W + X; A.R[i] += (c[0] - A.R[i]) * kk; A.G[i] += (c[1] - A.G[i]) * kk; A.B[i] += (c[2] - A.B[i]) * kk;
      }
    }
  }
  // light coming in from above in a slanting band: a glaze rubbed on, then the side of a pale stick dragged down it
  // the band's edges are soft: the light is strongest along its middle line and dies off to both sides
  function shaft(A, poly, c, k, ang) {
    const bb = A.bbox([poly]), sd = A.rr(0, 40);
    const a = [(poly[0][0] + poly[1][0]) / 2, poly[0][1]], b = [(poly[2][0] + poly[3][0]) / 2, poly[2][1]];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    const half = y => lerp(Math.abs(poly[1][0] - poly[0][0]), Math.abs(poly[2][0] - poly[3][0]), (y - bb[1]) / (bb[3] - bb[1])) / 2 * Math.abs(nx);
    const wide = A.roughen(poly.map(p => [p[0] + (p[0] > (a[0] + b[0]) / 2 ? 60 : -60), p[1]]), 12, 80, true);
    M.floorWash(A, wide, c, (x, y) => { const d = Math.abs((x - a[0]) * nx + (y - a[1]) * ny) / Math.max(1, half(y)); return k * (1 - sstep((d - 0.45) / 0.75)) * (0.75 + 0.35 * A.noise2(x / 220 + sd, y / 260, 9)) * (0.55 + 0.45 * sstep((bb[3] - y) / (bb[3] - bb[1]))); }, 'over');
    void ang;
  }
  // the masses of a tier are drawn in the light of the tier's middle; this turns each row of them to the light of its
  // own height, so the hour changes down the wall without a seam at the ledges
  function retint(A, polys, refY, field) {
    field = field || 'face';
    const mk = A.pushMask(polys, 0); A.popMask();
    const S = A.S, ref = keyAt(refY)[field]; let lastY = -1, f = null;
    for (let y = 0; y < mk.h; y++) {
      const Y = y + mk.y0; if (Y < 0 || Y >= A.H) continue;
      if (Y !== lastY) { const c = keyAt(Y / S)[field]; f = [c[0] / ref[0], c[1] / ref[1], c[2] / ref[2]].map(v => clamp(v, 0.55, 1.7)); lastY = Y; }
      if (Math.abs(f[0] - 1) + Math.abs(f[1] - 1) + Math.abs(f[2] - 1) < 0.004) continue;
      for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
        const X = x + mk.x0; if (X < 0 || X >= A.W) continue;
        const i = Y * A.W + X; A.R[i] *= 1 + (f[0] - 1) * v; A.G[i] *= 1 + (f[1] - 1) * v; A.B[i] *= 1 + (f[2] - 1) * v;
      }
    }
  }
  const calmWash = (A, y0, y1, K) => M.floorWash(A, rect(CARD - 40, y0, W, y1), K.wall, x => 0.16 * sstep((x - CARD + 40) / 120), 'over');

  /* ================================================================ THE PICTURE */
  P.background = function (A, G, say) {
    let n = 0;
    const part = name => { if (say) say(name); A.reseed(9001 + (++n) * 7919); };
    const want = (y0, y1) => !G.only || (y1 > G.only[0] && y0 < G.only[1]);
    rim(A, G, part, want);
    G.levels.forEach(L => level(A, G, L, part, want));
    part('water'); if (want(WATER - 60, H)) water(A, G);
    part('gauge'); if (want(RIM - 30, 6100)) gauge(A, G);
    part('grain'); grain(A, G, want);
  };

  // ---------------------------------------------------------------- the rim at noon
  function rim(A, G, part, want) {
    const T = toneAt(A, 300), K = keyAt(400), ch = G.chhatri;
    part('sky');
    if (want(0, 400)) {
      const sky = rect(0, 0, W, 330);
      gradWash(A, sky, y => mixc(hexc('#a9c8d6'), hexc('#f4dfa6'), sstep(y / 300)), 1);
      // the sky laid in long side strokes, blue going to a gold haze toward the hills
      for (let y = -10; y < 330; y += 22) {
        const c = A.mix('#9ec2d4', '#f3d79a', sstep((y + 10) / 300));
        A.fill(rect(-20, y, W + 20, y + 30), 'side', c, { w: 24, p: 0.55, passes: 1, ang: A.rr(-0.04, 0.04), reach: 1.2, flow: 0.55, cv: 0.03 });
      }
      // the gold room: haze round the sun, rubbed in, and long gold veils of light
      M.floorWash(A, sky, '#f7e2a0', (x, y) => 0.75 * Math.max(0, 1 - Math.hypot((x - 210) / 760, (y - 110) / 420)), 'over');
      for (let i = 0; i < 9; i++) { const y = A.rr(30, 280); A.stroke([[A.rr(-40, 300), y], [A.rr(700, 1650), y + A.rr(-14, 14)]], 'side', A.pick(['#fbeab8', '#f7dc90', '#fff2cc']), { w: A.rr(8, 18), p: A.rr(0.18, 0.32), reach: 0.9 }); }
      for (let i = 0; i < 4; i++) { const y = A.rr(40, 200), x = A.rr(500, 1400); M.cloudBand(A, [[x, y], [x + 120, y - 6], [x + A.rr(220, 320), y + 4]], A.rr(12, 18), { c: '#fbf3e0', rim: 'khadi', shade: '#d8b080' }); }
      M.sun(A, 210, 112, 50, { c: 'cream' });
      M.goldDust(A, [[210, 112]], 220, 260, { sx: 2.4, sy: 1.1, big: 1.6 });
    }
    part('hill');
    if (want(100, 640)) {
      const ridge = [[-60, 300]], sd = 3.1;
      for (let x = -40; x <= W + 60; x += 40) ridge.push([x, 205 + 70 * A.noise1(x / 260 + sd, 3) - 60 * Math.exp(-Math.pow((x - 1180) / 220, 2)) - 30 * Math.exp(-Math.pow((x - 420) / 160, 2))]);
      ridge.push([W + 60, 300]);
      M.rockHill(A, ridge, 400, { size: 0.9, palette: { crevice: '#4a4a26', line: 'sepia', fam: [
        { w: 3.0, c: ['olive', '#8a9442', '#7d8a3a'], fold: 'moss', lip: '#c9c46a' },
        { w: 2.4, c: ['sage', '#a9b47a', '#9aa56a'], fold: 'bottle', lip: 'cream' },
        { w: 1.6, c: ['pinkrock', '#d8a890', '#c99a84'], fold: 'lac', lip: 'khadi' },
        { w: 1.3, c: ['ochre', '#c9a060', 'sand'], fold: 'umber', lip: 'cream' },
        { w: 0.9, c: ['#5b6b30', 'moss'], fold: 'bottle', lip: 'sage' }] } });
      // scrub and a few trees on the hill, darkest where the hill folds
      const R = STAGE.rng(77);
      for (let i = 0; i < 110; i++) {
        const x = R.rr(-20, W + 20); let yr = 400; for (let k = 0; k + 1 < ridge.length; k++) if (x >= ridge[k][0] && x <= ridge[k + 1][0]) yr = lerp(ridge[k][1], ridge[k + 1][1], (x - ridge[k][0]) / (ridge[k + 1][0] - ridge[k][0]));
        const y = R.rr(yr + 26, 392); if (y > 395) continue;
        if (R.chance(0.6)) M.tree(A, x, y, R.rr(26, 60), R.pick(['dotted', 'puff', 'bell', 'dotted']), { zone: 'A' });
        else M.shrub(A, x, y, R.rr(18, 32), 'dot', { zone: 'A' });
      }
      // a small temple on the far ridge with its red flag, for the eye to rest on
      const tx = 1180, ty = 152;
      const sh = A.spline([[tx - 14, ty], [tx - 12, ty - 20], [tx - 6, ty - 34], [tx, ty - 40], [tx + 6, ty - 34], [tx + 12, ty - 20], [tx + 14, ty]], true, 0.6);
      A.shape(sh, { c: '#efe2c4', w: 2.4, line: '#4a3020', lw: 0.7, lp: 0.8, rough: 0.2 });
      A.shape(rect(tx - 20, ty, tx + 20, ty + 14), { c: '#e6d2a8', w: 2.4, line: '#4a3020', lw: 0.7, lp: 0.8, rough: 0.2 });
      A.stroke([[tx, ty - 40], [tx, ty - 58]], 'kajal', '#3a2010', { w: 0.8, p: 0.9 });
      A.fill([[tx, ty - 58], [tx + 16, ty - 54], [tx, ty - 50]], 'chalk', '#c8321c', { w: 1.6, p: 1, passes: 1 });
      // two tall trees by the wall, as in the photograph, their feet hidden by it
      M.tree(A, 70, 620, 330, 'radiate', { zone: 'B' });
      M.tree(A, 1546, 384, 118, 'puff', { zone: 'A' });
      M.tree(A, 1452, 380, 92, 'bell', { zone: 'A' });
    }
    part('wall');
    if (want(330, 640)) {
      M.wellArchWall(A, -10, W + 10, 362, 606, T, { bay: 116, skip: [ch.cx - 150, ch.cx + 150] });
      // the shadow of the chhatri lies on the wall to its right: the sun is high and to the left
      const sil = M.wellChhatriShape(A, ch.cx, ch.by, ch.s).map(p => p.map(q => [q[0] + 128, q[1] + 34]));
      // rubbed in soft with the side of a cool stick, its edges let go, so it lies on the arches as a stain of shade
      A.withMask(rect(0, 362, W, 606), () => {
        M.floorUnion(A, sil, '#a07a78', (x, y) => 0.34 + 0.1 * A.noise2(x / 40, y / 40, 3), 9 * A.S, 'mul', { ang: -1.1, len: 30, wid: 2.6, amt: 0.5 });
        M.floorUnion(A, sil, '#8a7088', () => 0.12, 14 * A.S, 'over', { ang: -0.9, len: 22, wid: 2.2, amt: 0.6 });
      });
      // pigeons resting on the coping
      const R = STAGE.rng(5);
      for (let i = 0; i < 9; i++) { const x = R.rr(40, W - 40); if (Math.abs(x - ch.cx) < 170) continue; M.pigeonSit(A, x, 350, R.rr(9, 12), R.chance(0.5), R.pick(['slate', '#8a8f98', '#6e7682'])); }
    }
    part('rail');
    if (want(560, 700)) {
      M.wellPave(A, -10, W + 10, 640, 676, T);
      const posts = M.wellRail(A, -10, W + 10, 640, 34, T, { skip: [ch.cx - 142, ch.cx + 142], gap: 92 });
      G.railPosts = posts;
    }
    part('chhatri');
    if (want(180, 700)) {
      const sh = M.wellChhatriShape(A, ch.cx, ch.by, ch.s);
      // its shadow on the paving, short at noon
      M.floorUnion(A, [sh[0].map(q => [q[0] + 24, q[1] + 10])], '#7a6040', () => 0.4, 2 * A.S, 'mul');
      G.chhatriInfo = M.wellChhatri(A, ch.cx, ch.by, ch.s, T);
      // gold on everything the sun strikes: the finial, the drum, the eave
      M.goldDust(A, [[ch.cx, 300], [ch.cx - 60, 390], [ch.cx + 40, 420]], 90, 90, { sx: 1.6, sy: 0.8 });
    }
    part('torans');
    if (want(560, 700) && G.railPosts) {
      // marigold torans swagged between the posts of the rail: a festival at the top of the well
      const posts = G.railPosts;
      for (let i = 0; i + 1 < posts.length; i++) {
        const a = posts[i], b = posts[i + 1]; if (b - a > 140) continue;
        if (i % 2) continue;
        M.garland(A, [[a, 608], [(a + b) / 2, 626], [b, 608]], toneAt(A, 600), { r: 5.2, step: 8 });
      }
      // and one hung across the front of the chhatri plinth
      M.garland(A, [[ch.cx - 130, 600], [ch.cx - 65, 622], [ch.cx, 604], [ch.cx + 65, 622], [ch.cx + 130, 600]], toneAt(A, 600), { r: 5.6, step: 8 });
    }
    void K;
  }

  // ---------------------------------------------------------------- the wall paintings
  /* In each V between two flights: a framed panel high in the V, where the wall is widest, and a lotus roundel down
     toward its point.  Haveli subjects only, nobody in them and nobody riding: peacocks, elephants, horses, parrots in
     mango trees, lotus scrolls, fish.  Fresh at noon, flaking by dusk, ghosts under lime and moss near the water. */
  const FRESCO = [
    ['peacock', 'parrots', 'fish', 'horse', 'mango', 'lotus', 'peacock'],
    ['elephant', 'lotus', 'horse', 'parrots', 'peacock', 'fish', 'mango'],
    ['peacock', 'parrots', 'lotus', 'elephant', 'horse', 'mango', 'fish'],
    ['horse', 'elephant', 'fish', 'peacock', 'lotus', 'parrots', 'mango'],
    ['fish', 'lotus', 'peacock', 'elephant', 'fish', 'horse', 'lotus']
  ];
  const ROUND = ['#2a4a6a', '#7a2a2a', '#3f6a3e', '#b8342a'];
  // the things standing on each floor rise in front of the lowest V's: no painting is put behind them
  // the objects standing in the lowest row of V's: the panel above them is left out, or only the roundel when the
  // object is short enough to stand under the panel  ([x, half width, 'r' = roundel only])
  const BUSY = { 1: [[252, 130], [826, 170]], 2: [[790, 230]], 3: [[770, 110, 'r']], 4: [[820, 120]], 5: [[830, 170, 'r']] };
  function frescos(A, L, Km, T) {
    let n = 0;
    for (let j = 0; j < 3; j++) {
      const ms = L.masses.filter(m => m.tier === j).sort((a, b) => a.c - b.c);
      for (let i = 0; i + 1 < ms.length; i++) {
        const a = ms[i], b = ms[i + 1], vx = (a.c + b.c) / 2, Vw = b.apex[0] - a.apex[1], ty = a.apex[2], h = a.base - ty;
        // a V cut by the side of the shaft keeps the part of its panel that is still in view
        const pw = Vw * 0.44, px0 = Math.max(vx - pw / 2, L.left + 16), px1 = Math.min(vx + pw / 2, L.right - 16), rr0 = clamp(Vw * 0.07, 30, 46);
        if (px1 - px0 < 200) continue;
        const busy = j === 2 ? BUSY[L.k].find(([ox, ow]) => Math.abs(vx - ox) < ow + pw / 2) : null;
        if (busy && busy[2] !== 'r') continue;
        const calm = (px0 + px1) / 2 > CARD ? 0.45 : 0, age = clamp(L.age + (j - 1) * 0.05, 0, 1);
        M.wellFresco(A, [px0, ty + h * 0.07, px1, ty + h * 0.4], FRESCO[L.k - 1][n % 7], Km, { T, age, calm });
        if (!busy && vx - rr0 > L.left + 16 && vx + rr0 < L.right - 16) M.wellRoundel(A, vx, ty + h * 0.63, rr0, Km, { T, age, calm, ground: ROUND[(n + L.k) % 4] });
        n++;
      }
    }
  }

  // ---------------------------------------------------------------- one level
  function level(A, G, L, part, want) {
    const k = L.k, y0 = L.top, y1 = L.yF + 40, Km = keyAt(L.mid), age = L.age, T = toneAt(A, L.mid);
    const on = want(y0 - 40, y1 + 40);
    part('wall ' + k);
    if (on) {
      const band = rect(0, y0, W, y1);
      // the whole wall is laid in the hour of the level's middle, stone and all, and then each row is turned to the
      // hour of its own height (below), so the light goes on changing across the ledges without a band
      gradWash(A, band, () => Km.wall, 1);
      for (let y = y0 - 10; y < y1; y += 110) {
        const b = A.roughen(rect(-20, y, W + 20, y + 130), 8, 40, true);
        A.fill(b, 'side', Km.wall, { w: 30, p: 0.7, passes: 2, turn: 0.8, ang: A.rr(-0.7, -0.4), reach: 1.4, cv: 0.03 });
      }
      A.blend(band, { r: 8, k: 0.36 });
      gradWash(A, band, () => Km.wall, 0.28);
      M.wellStone(A, band, Km, { c: Km.wall, joints: 30, mottle: 0.8, grain: 0.8, ground: false, age });
      // the wall paintings in the V's, put on the stone before the light and the years got at them
      frescos(A, L, Km, T);
      // the shadow under the ledge above
      if (k > 1) M.floorWash(A, rect(0, y0, W, y0 + 60), Km.cast, (x, y) => 0.55 * (1 - sstep((y - y0) / 50)), 'mul');
      else M.floorWash(A, rect(0, y0, W, y0 + 40), Km.cast, (x, y) => 0.45 * (1 - sstep((y - y0) / 34)), 'mul');
    }
    part('stains ' + k);
    if (on) {
      // rain and seep from the level above: more as the well goes down
      M.wellStains(A, L.left, CARD, y0 + 2, 120 + 160 * age, Math.round(6 + 30 * age), Km);
      M.wellStains(A, CARD, W, y0 + 2, 100 + 100 * age, Math.round(2 + 6 * age), Km);
      if (age > 0.6) for (let i = 0; i < Math.round(age * 2.4); i++) M.wellTide(A, -10, W + 10, y0 + L.ht * (1.6 + i * 0.9 + A.rr(-0.2, 0.2)), keyAt(y0 + L.ht * 2), { salt: 0.18 + age * 0.15, sh: 10 + age * 8, dh: 16 + age * 14 });
    }
    if (on) retint(A, [rect(0, y0, W, y1)], L.mid, 'wall');
    part('shadows ' + k);
    const off = [[34, 14], [48, 16], [56, 16], [40, 12], [24, 8]][k - 1], sk = [0.58, 0.6, 0.55, 0.42, 0.3][k - 1];
    if (on && sk) M.wellShadow(A, L.masses.map(m => m.pts), Km, off, sk);
    part('masses ' + k);
    if (on) {
      for (const m of L.masses) {
        if (m.c + L.P / 2 < 0 || m.c - L.P / 2 > W) continue;
        M.wellMass(A, m, keyAt((m.apex[2] + m.base) / 2), age);
      }
      for (let j = 0; j < 3; j++) { const ms = L.masses.filter(m => m.tier === j); retint(A, ms.map(m => m.pts), (ms[0].apex[2] + ms[0].base) / 2); }
    }
    part('alcove ' + k);
    if (on) {
      const al = L.alcove;
      L.alcoveInfo = M.wellAlcove(A, al.x, al.yb, al.w, al.h, keyAt(al.yb - 60), age);
    }
    part('light ' + k);
    if (on) {
      if (k === 1) shaft(A, [[150, y0], [600, y0], [1010, L.yF], [560, L.yF]], '#fff4d0', 0.2, 1.1);
      if (k === 2) shaft(A, [[110, y0], [470, y0], [980, L.yF], [700, L.yF]], '#ffd890', 0.16, 1.0);
      if (k === 3) M.floorWash(A, rect(0, y0, W, y1), '#f8b8a8', (x, y) => 0.28 * sstep((y - y0) / 240) * Math.max(0, 1 - Math.hypot((x - 300) / 900, (y - y0 - 60) / 520)), 'over');
      if (k === 4) M.floorWash(A, rect(0, y0, W, y1), '#c8a8c8', (x, y) => 0.18 * sstep((y - y0) / 240) * Math.max(0, 1 - Math.hypot((x - 260) / 900, (y - y0) / 600)), 'over');
      if (k === 5) M.floorWash(A, rect(0, y0, W, y1), '#9fb4c8', (x, y) => 0.14 * sstep((y - y0) / 240) * Math.max(0, 1 - Math.hypot((x - 500) / 900, (y - y0) / 700)), 'over');
    }
    part('age ' + k);
    if (on) aging(A, G, L);
    part('ledge ' + k);
    if (on) {
      const K = keyAt(L.yF + 10);
      M.wellLedge(A, L.left - 4, L.right + 4, L.yF - 6, 46, K, age, { frieze: k % 2 ? 'lotus' : 'chevron' });
      // the edge of the ledge throws its shadow on the wall below it (drawn with the level below); its own lip is lit
      if (k === 5) {
        // the last ledge is wet to the water: dark algae along its foot
        M.floorWash(A, rect(L.left, L.yF + 20, L.right, L.yF + 40), '#1a2a22', (x, y) => 0.6 * sstep((y - L.yF - 20) / 20), 'mul');
      }
    }
    part('piers ' + k);
    if (on) {
      const K = keyAt(L.mid);
      if (L.inL) M.wellPier(A, -4, L.inL, y0, y1, K, 'L', age, { stairs: false });
      if (L.inR) M.wellPier(A, W - L.inR, W + 4, y0, y1, K, 'R', age, { stairs: false });
      // the piers too take the hour of each row, so their stone runs on down through the ledges
      const pp = []; if (L.inL) pp.push(rect(-4, y0, L.inL, y1)); if (L.inR) pp.push(rect(W - L.inR, y0, W + 4, y1));
      if (pp.length) retint(A, pp, L.mid, 'recess');
    }
    part('calm ' + k);
    if (on) calmWash(A, y0, y1, Km);
    part('marks ' + k);
    if (on) for (const m of G.milestones) if (m.y > y0 && m.y < L.yF) M.wellFloodLine(A, GAUGE.x1 - 2, W + 4, m.y, m.kind, keyAt(m.y));
    part('objects ' + k);
    if (on) objects(A, G, L, T);
  }

  // stains, salt, lichen, cracks, a peepal, ferns, drips: as the well goes down
  function aging(A, G, L) {
    const k = L.k, age = L.age, y0 = L.top, Km = keyAt(L.mid);
    const R = STAGE.rng(400 + k);
    const inV = (x, y) => !L.masses.some(m => A.inside([m.pts], x, y));
    // cracks in the stone
    for (let i = 0; i < 4 + age * 10; i++) { const x = R.rr(L.left + 20, R.chance(0.8) ? CARD : W - 20), y = R.rr(y0 + 20, L.yF - 20); M.wellCrack(A, x, y, R.rr(18, 50), R.rr(0.9, 2.2), keyAt(y).line); }
    if (age > 0.3) {
      // rings of lichen and lime in a few clusters low on the wall, as on the lower walls of the photograph
      const nc = Math.round(1 + age * 3);
      for (let c = 0; c < nc; c++) {
        const cx = R.rr(L.left + 60, c === nc - 1 ? W - 80 : CARD - 60), cy = R.rr(y0 + L.ht * 1.4, L.yF - 40), K = keyAt(cy);
        for (let i = 0; i < 4 + age * 8; i++) { const r = R.rr(2.5, 7) * (0.7 + age * 0.4); M.wellLichen(A, cx + R.rr(-44, 44), cy + R.rr(-30, 30), r, K); }
      }
      // damp: dark seeps low on each tier where the water comes through the stone, and a few flakes of dead lime
      for (let t = 0; t < 3; t++) {
        const yb = L.top + L.ht * (t + 1), K = keyAt(yb);
        M.floorCloud(A, rect(L.left, yb - L.ht * (0.3 + age * 0.3), W, yb + 4), A.mix(K.recess, K.deep, 0.5), { scale: 34, seed: R.rr(1, 99), thr: 0.66 - age * 0.1, soft: 0.3, p: 0.1 + age * 0.16, w: 9, ang: 1.45 });
      }
      for (let c = 0; c < Math.round(2 + age * 6); c++) {
        const t = R.ri(0, 2), cx = R.rr(L.left + 30, c % 4 === 3 ? W - 40 : CARD), cy = L.top + L.ht * (t + R.rr(0.7, 0.95)), r = R.rr(6, 13);
        M.wellPeel(A, cx, cy, r, keyAt(cy), { p: 0.45 });
      }
    }
    if (age > 0.45) {
      // drips from the treads, and moss in the corners of the V's
      for (let i = 0; i < age * 26; i++) { const m = L.masses[R.ri(0, L.masses.length - 1)], s = m.steps[R.ri(1, m.steps.length - 1)]; if (!s) continue; const x = s.dir < 0 ? s.x0 + 2 : s.x1 - 2; if (x > W || x < 0) continue; M.wellDrip(A, x, s.y + 7, R.rr(8, 30), keyAt(s.y)); }
      for (const m of L.masses) { const yb = m.base; for (const sg of [-1, 1]) { const x = m.c + sg * L.P / 2; if (x < L.left || x > L.right) continue; M.wellMoss(A, [[x - 30, yb - 2], [x + 30, yb - 2]], keyAt(yb), { k: age, h: 4 + age * 6 }); } }
    }
    if (k === 3) {
      // a peepal has split the stone of a V, as they do
      M.wellPeepal(A, 236, 3230, 1.05, keyAt(3230));
      M.wellPeepal(A, 1270, 2900, 0.7, keyAt(2900));
    }
    if (age > 0.45) {
      // creepers let down from the ledge above and from the treads, their small leaves turning to the light
      const nc = Math.round(age * 9);
      for (let i = 0; i < nc; i++) {
        const fromLedge = i < nc / 2, x = R.rr(L.left + 30, i % 3 === 2 ? W - 40 : CARD - 20);
        if (fromLedge && k > 1) M.wellCreeper(A, x, y0 + 4, R.rr(60, 160) * age, keyAt(y0 + 80), { seed: R.rr(0, 99) });
        else { const m = L.masses[R.ri(0, L.masses.length - 1)], st = m.steps[R.ri(1, m.steps.length - 1)]; if (st && st.dir) M.wellCreeper(A, st.dir < 0 ? st.x0 + 6 : st.x1 - 6, st.y + 4, R.rr(30, 90) * age, keyAt(st.y), { seed: R.rr(0, 99) }); }
      }
    }
    if (age > 0.7) {
      // what the water has done, big enough to read from across the well: wet runs down from every ledge and tier,
      // white lines of salt where the water once stood, and lichen in grey and orange rosettes
      for (let t = 0; t < 3; t++) {
        const ty = L.top + L.ht * t, K = keyAt(ty + 60);
        for (let i = 0; i < 8 + age * 12; i++) {
          const x = R.rr(L.left + 10, R.chance(0.8) ? CARD : W - L.inR - 10), yy = ty + (t ? R.rr(2, 10) : R.rr(26, 40));
          if (!inV(x, yy + 6)) continue;
          M.wellWetStreak(A, x, yy, R.rr(50, 190) * age, R.rr(4, 10), K);
        }
        const sy = ty + L.ht * R.rr(0.5, 0.82);
        M.wellSalt(A, L.left, W - L.inR, sy, keyAt(sy), { k: 0.55 + (age - 0.7) * 1.4 });
      }
      for (let c = 0; c < 7; c++) {
        const cx = R.rr(L.left + 40, c === 6 ? W - L.inR - 40 : CARD - 40), cy = R.rr(y0 + 30, L.yF - 30), K = keyAt(cy), orange = c % 2 === 0;
        for (let i = 0; i < 6; i++) M.wellLichen(A, cx + R.rr(-40, 40), cy + R.rr(-26, 26), R.rr(8, 17), K, orange ? { c: A.mix('#e0a040', K.glaze, K.gl), d: '#8a4a1a' } : {});
      }
    }
    if (age > 0.6) {
      const ferns = k === 4
        ? [[170, 3700, 1.1, 0.6], [905, 4060, 1, -0.3], [158, 4250, 1.4, 0.7], [640, 3960, 0.9, 0.2], [1480, 3820, 0.9, -0.5], [560, 3640, 1.1, 0.4], [1000, 3880, 1, -0.2], [330, 4330, 1.3, 0.5], [760, 4180, 0.9, 0.1]]
        : [[230, 4560, 1.4, 0.7], [700, 4700, 1.1, -0.2], [1010, 4980, 1.2, 0.3], [215, 5140, 1.6, 0.6], [1390, 4640, 1.1, -0.6], [480, 5230, 1, 0.1], [900, 4480, 1.3, -0.4], [330, 4860, 1.5, 0.6], [760, 5060, 1.2, 0.3], [1150, 5240, 1.1, -0.5], [560, 4600, 1.2, 0.2]];
      for (const f of ferns) M.wellFern(A, f[0], f[1], f[2], keyAt(f[1]), { lean: f[3], n: A.ri(7, 11), c: A.mix('#2f4a26', keyAt(f[1]).deep, 0.25), c2: A.mix('#7fae44', keyAt(f[1]).glaze, keyAt(f[1]).gl * 0.7) });
    }
    void Km;
  }

  // ---------------------------------------------------------------- the things on each level
  function objects(A, G, L, T) {
    const k = L.k, K = keyAt(L.yF);
    if (k === 1) {
      const d = G.dove; G.doveInfo = M.wellDovecote(A, d.x, d.yb, d.s, T);
      const lm = G.loom; G.loomInfo = M.wellLoom(A, lm.x, lm.yb, lm.s, T);
      // a few feathers and grain on the ledge under the dovecote
      const R = STAGE.rng(11);
      for (let i = 0; i < 26; i++) A.dot(d.x + R.rr(-90, 90), d.yb + R.rr(-6, 6), 'chalk', R.pick(['#e6b422', '#f1dfa6', '#c1892b']), { w: 1.2, p: 0.8 });
      for (let i = 0; i < 4; i++) { const x = d.x + R.rr(-100, 120), y = d.yb + R.rr(-4, 4); A.stroke([[x, y], [x + R.rr(6, 10), y - R.rr(1, 3)]], 'chalk', '#eef0f0', { w: 1.6, p: 0.8, tout: 0.6 }); }
      for (let i = 0; i < 3; i++) M.wellPigeonSit(A, d.x + [-78, 92, 128][i], d.yb + 2, 24, i === 1, ['#8a93a0', '#9aa0a8', '#7e8894'][i]);
      // and more of them sitting about the stairs, as they do in every stepwell
      const R2 = STAGE.rng(13), cand = [];
      for (const m of L.masses) for (const st of m.steps) if (st.dir && st.x0 > 140 && st.x1 < CARD - 60) cand.push(st);
      for (let i = 0; i < 7 && cand.length; i++) { const st = cand.splice(R2.ri(0, cand.length - 1), 1)[0]; M.wellPigeonSit(A, R2.rr(st.x0 + 12, st.x1 - 12), st.y + 1, R2.rr(20, 25), st.dir > 0, R2.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#a8a49c'])); }
    }
    if (k === 2) {
      const tk = G.tank;
      M.wellSpouts(A, tk.cx, tk.yTank, T);
      M.wellTank(A, tk.cx, tk.yTank, tk.w, tk.yb, T);
      const t = G.toran; M.wellToran(A, t.x0, t.x1, t.y, T);
      // the doorway of a new beginning: rangoli dots on the ledge before the alcove, and a kalash
      const R = STAGE.rng(23), ax = L.alcove.x;
      for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; A.dot(ax + Math.cos(a) * 16, L.yF + 8 + Math.sin(a) * 4, 'chalk', i % 2 ? '#f7f2e7' : '#de5a22', { w: 2.2, p: 0.9 }); }
      M.wellLota(A, ax + 66, L.yF + 12, 12, T);
      M.wellPot(A, ax - 72, L.yF + 12, 15, T('#c2602e'), T);
      void R;
    }
    if (k === 3) {
      const s = G.lanternString;
      // bunting first, cut from every bright cloth in the house, then the lanterns over it
      M.wellBunting(A, [104, 2650], [600, 2662], 22, T);
      M.wellBunting(A, [560, 2656], [1030, 2650], 26, T, { cols: ['#f6c46a', '#f08aa0', '#f7e6cc', '#e8607a', '#f2a48a'] });
      M.wellLanternsAt(A, s, G.lanterns, T);
      // marigold strings swagged along the face of the ledge, and down from the alcove frame
      for (let x = L.left + 6; x < CARD; x += 130) M.garland(A, [[x, L.yF + 20], [x + 65, L.yF + 40], [x + 130, L.yF + 20]], T, { r: 5.4, step: 8 });
      const ax = L.alcove.x, top = L.alcove.yb - L.alcove.h - 12;
      M.garland(A, [[ax - 56, top + 6], [ax, top + 26], [ax + 56, top + 6]], T, { r: 5.6, step: 8 });
      for (const sg of [-1, 1]) M.garland(A, [[ax + sg * 56, top + 6], [ax + sg * 60, top + 60], [ax + sg * 58, top + 100]], T, { r: 5, step: 8 });
      const c = G.cups; G.cupsInfo = M.wellCups(A, c.x, c.yb, c.s, T);
      // petals thrown on the ledge
      const R = STAGE.rng(31), pts = [];
      for (let i = 0; i < 46; i++) pts.push([R.rr(L.left + 20, CARD), L.yF + R.rr(-4, 12), R.pick(['mari', 'mari', 'rose', 'white'])]);
      M.petals(A, pts, T);
    }
    if (k === 4) {
      const p = G.pole; M.wellPole(A, p.x, p.yb, p.h, T);
      // a soldier's things, and nobody: a drum by the pole
      drum(A, p.x - 56, p.yb, T);
    }
    if (k === 5) {
      const kd = G.kund; G.kundInfo = M.wellKund(A, kd.cx, kd.yb, kd.w, T);
    }
    void K;
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

  // ---------------------------------------------------------------- the water at the bottom
  function water(A, G) {
    const L5 = G.levels[4], pool = rect(0, WATER, W, H), R = STAGE.rng(61);
    const depth = y => sstep((y - WATER) / 760);
    const colAt = y => mixc(hexc('#3a5a50'), hexc('#0e1c1e'), depth(y));
    const mx = 880, my = 6040, dy = G.diya;
    // calmer toward the card on the right: the marks there are fewer and fainter
    const calm = x => 1 - 0.45 * sstep((x - CARD + 60) / 200);
    // the water itself: green where it is shallow over the steps, going black-green below
    gradWash(A, pool, colAt, 1);
    // laid in with the side of the stick in long strokes that waver a little, never two rows alike, then rubbed flat
    for (let y = WATER - 6; y < H + 10; y += R.rr(10, 22)) {
      const t = depth(y), c = A.mix(A.mix('#33584e', '#3c5034', A.noise1(y / 80, 4) * 0.6), '#0f1d1f', t);
      for (let x = R.rr(-260, -20); x < W + 20;) {
        const l = R.rr(220, 820), a = R.rr(-0.014, 0.014), amp = R.rr(1, 3.4), ph = R.rr(0, 6), fr = R.rr(70, 110), pts = [];
        for (let s = 0; s <= 10; s++) { const xx = x + l * s / 10; pts.push([xx, y + (xx - x) * a + amp * Math.sin(xx / fr + ph)]); }
        A.stroke(pts, 'side', c, { w: R.rr(12, 26), p: R.rr(0.22, 0.5) });
        x += l + R.rr(-90, 50);
      }
    }
    A.blend(pool, { r: 10, k: 0.35, ang: 0, len: 160 });

    // the last level gives itself back upside down: the wall, the flights and the lit alcove, dimmer and greener
    // the deeper it goes, each row pulled a little sideways by the swell, and broken where the wind touches it
    {
      const S = A.S, Y0 = Math.round(WATER * S), n = Math.round(560 * S), cl = A.clip(), c0 = cl[0], c1 = cl[2], tint = [0.5, 0.72, 0.7], ph = R.rr(0, 6);
      for (let d = 0; d < n; d++) {
        const Yd = Y0 + d, Ys = Y0 - 1 - Math.round(d * 0.96); if (Yd < 0 || Yd >= A.H || Ys < 0) continue;
        if (Yd < cl[1] || Yd >= cl[3]) continue;
        const u = d / n, lu = d / S;
        const a = 0.52 * Math.pow(1 - u, 1.25) * (0.55 + 0.45 * A.noise1(lu / 2.6 + ph, 7)) * (0.7 + 0.3 * Math.sin(lu / 5.3 + ph));
        const sh = Math.round(S * ((1.5 + 7 * u) * Math.sin(lu / (6 + 5 * u) + ph) + 2.5 * (A.noise1(lu / 11, 3) - 0.5)));
        for (let X = c0; X < c1; X++) {
          const xs = Math.min(A.W - 1, Math.max(0, X + sh)), i = Yd * A.W + X, j = Ys * A.W + xs;
          const k = a * (0.75 + 0.5 * A.noise2(X / S / 160, lu / 24, 5)) * calm(X / S);
          A.R[i] += (A.R[j] * tint[0] - A.R[i]) * k; A.G[i] += (A.G[j] * tint[1] - A.G[i]) * k; A.B[i] += (A.B[j] * tint[2] - A.B[i]) * k;
        }
      }
      // then the water laid back over the mirror in broken strokes, so it is paint and not glass
      for (let y = WATER + 6; y < WATER + 560; y += R.rr(5, 11)) {
        const t = (y - WATER) / 560, c = A.mix('#2c4a44', '#14262a', t);
        for (let x = R.rr(-60, 0); x < W;) { const l = R.rr(40, 260); if (R.chance(0.55)) A.stroke([[x, y], [x + l * 0.5, y + R.rr(-1.4, 1.4)], [x + l, y + R.rr(-1, 1)]], 'side', c, { w: R.rr(3, 7), p: R.rr(0.08, 0.22) * (0.6 + t * 0.6) }); x += l + R.rr(10, 80); }
      }
      A.blend(rect(0, WATER + 2, W, WATER + 560), { r: 4, k: 0.3, ang: 0, len: 50 });
    }
    // before college: the well goes on down under the water, flight under flight, each paler shape a little further
    // gone than the one above it; a few treads catch the light, and below that the dark takes everything
    const deep = levelGeom({ top: WATER + 50, yF: WATER + 50 + 3 * 250, P: 785, ax: L5.ax + 392, inL: 200, inR: 200, age: 1 }, 6);
    // they show most a little under the surface, where the mirror lets go of the eye, and are gone near the bottom
    const fade = y => (0.4 + 0.6 * sstep((y - WATER - 100) / 220)) * (1 - sstep((y - WATER - 260) / 680));
    A.withMask(pool, () => {
      for (const m of deep.masses) {
        if (m.c + 420 < 0 || m.c - 420 > W) continue;
        // the face of each flight only as a soft paler shape, its edges lost in the water; its shaded flank
        const bb = A.bbox([m.pts]), foot = y => 1 - sstep((y - bb[3] + 60) / 60);
        M.floorUnion(A, [m.pts], '#6e9e8a', (x, y) => 0.42 * fade(y) * foot(y) * calm(x) * (0.6 + 0.5 * A.noise2(x / 80, y / 30, 17)), 7 * A.S, 'over', { ang: 0.04, len: 40, wid: 2.4, amt: 0.5 });
        M.floorUnion(A, [m.pts], '#0c1e1c', (x, y) => 0.3 * sstep((x - m.c) / 160) * fade(y) * foot(y), 7 * A.S, 'mul');
        for (const s of m.steps) {
          if (!s.dir || R.chance(0.4)) continue;
          const f = fade(s.y); if (f < 0.06) continue;
          for (let x = s.x0 + R.rr(0, 10); x < s.x1 - 4;) { const l = R.rr(10, 34), xe = Math.min(s.x1, x + l); A.stroke([[x, s.y + R.rr(-1, 1)], [(x + xe) / 2, s.y + R.rr(-1.6, 1.6)], [xe, s.y + R.rr(-1, 1)]], 'side', R.chance(0.6) ? '#a0c4b4' : '#7ea696', { w: R.rr(2.4, 4.6), p: f * calm(x) * R.rr(0.32, 0.6) });
            if (R.chance(0.4)) A.stroke([[x, s.y + 6], [xe, s.y + 6 + R.rr(-1, 1)]], 'side', '#0e2020', { w: R.rr(3, 6), p: f * 0.3 }); x = xe + R.rr(5, 16); }
        }
      }
      // the water between the eye and the steps, laid over them in broken strokes
      for (let y = WATER + 30; y < H + 6; y += R.rr(6, 13)) { const c = A.mix('#2c4a44', '#10201f', depth(y)); for (let x = R.rr(-60, 0); x < W;) { const l = R.rr(30, 200); if (R.chance(0.5)) A.stroke([[x, y], [x + l / 2, y + R.rr(-1.2, 1.2)], [x + l, y + R.rr(-1, 1)]], 'side', c, { w: R.rr(3, 6), p: R.rr(0.1, 0.24) }); x += l + R.rr(10, 70); } }
      A.blend(rect(0, WATER + 20, W, H), { r: 8, k: 0.32, ang: 0, len: 90 });
    });

    // just under the surface: a pale skin of sky broken into long dashes
    for (let y = WATER + 4; y < WATER + 130; y += R.rr(5, 10)) {
      const t = (y - WATER) / 130;
      for (let x = R.rr(-40, 0); x < W;) { const l = R.rr(20, 110); if (R.chance(0.5)) A.stroke([[x, y], [x + l / 2, y + R.rr(-1, 1)], [x + l, y + R.rr(-0.6, 0.6)]], 'side', R.chance(0.6) ? '#8aa2a6' : '#6a8488', { w: R.rr(2, 4), p: (1 - t) * R.rr(0.14, 0.32) * calm(x) }); x += l + R.rr(14, 80); }
    }
    // the pale lip where the water meets the last step, wet algae along it, and the lip's reflection broken into dashes
    A.fill(rect(L5.left, WATER - 2, L5.right, WATER + 6), 'side', '#1c3a2a', { w: 6, p: 0.7, passes: 1, ang: 0 });
    A.stroke([[L5.left, WATER + 1], [L5.right, WATER + 1]], 'chalk', '#cfe0dc', { w: 1.6, p: 0.7 });
    for (let x = L5.left; x < L5.right;) { const l = R.rr(14, 60); A.stroke([[x, WATER + 9], [x + l, WATER + 9 + R.rr(-0.6, 0.6)]], 'chalk', '#a8c4be', { w: 1.6, p: R.rr(0.3, 0.55) }); x += l + R.rr(6, 30); }
    // the lit alcove above comes down into the water as long warm dashes
    {
      const ax = L5.alcove.x;
      M.floorWash(A, rect(ax - 90, WATER, ax + 90, WATER + 330), '#c87a28', (x, y) => 0.15 * (1 - sstep((y - WATER) / 310)) * Math.max(0, 1 - Math.abs(x - ax) / 80), 'over');
      for (let i = 0; i < 80; i++) {
        const t = Math.pow(R.rnd(), 1.3), y = WATER + 12 + t * 310, hw = (32 - t * 16) * R.rr(0.25, 1.1), cx = ax + R.rr(-14, 14) + 6 * Math.sin(y / 13);
        A.stroke([[cx - hw, y + R.rr(-1, 1)], [cx, y + R.rr(-1.4, 1.4)], [cx + hw, y + R.rr(-1, 1)]], R.chance(0.6) ? 'side' : 'chalk', R.pick(['#e88e1e', '#f3bd45', '#f6d488', '#d8701a']), { w: R.rr(1.6, 3.6), p: (1 - t) * R.rr(0.3, 0.7), tin: 0.2, tout: 0.25 });
      }
    }

    // the moon, which the well never sees, is in the water: its disc cut by the slow swell into slices that wave a
    // little, each pulled its own way and laid in one pass of the stick, some broken in two, a soft light rubbed round
    M.floorWash(A, rect(mx - 440, my - 280, mx + 440, my + 320), '#b8c8bc', (x, y) => 0.22 * Math.pow(Math.max(0, 1 - Math.hypot((x - mx) / 440, (y - my) / 260)), 1.5), 'over');
    M.floorWash(A, rect(mx - 120, my - 120, mx + 120, my + 140), '#e8e4c8', (x, y) => 0.2 * Math.pow(Math.max(0, 1 - Math.hypot((x - mx) / 110, (y - my) / 120)), 1.2), 'over');
    A.fill(A.roughen(A.ellipse(mx, my + 4, 26, 46), 6, 12, true), 'side', '#e6e2c4', { w: 10, p: 0.3, passes: 2, ang: R.rr(-0.2, 0.2) });
    const moonC = ['#f6f0d8', '#efe4b8', '#fff8e6', '#e6dcb0', '#f3ecc8', '#d8d4b8'];
    const slices = [];
    for (let y = my - 52, row = 0; y < my + 62; row++) {
      const h = R.rr(2.4, 6.8), u = (y - my) / (y < my ? 52 : 62), ch = Math.sqrt(Math.max(0, 1 - u * u)) * 30 * R.rr(0.7, 1.35) + R.rr(2, 9);
      const cx = mx + R.rr(-8, 8) + 5 * Math.sin(row * 1.7), cut = R.chance(0.32);
      const parts = cut ? [[cx - ch, cx - ch * R.rr(0, 0.45)], [cx + ch * R.rr(0.05, 0.45), cx + ch]] : [[cx - ch, cx + ch]];
      for (const [a, b] of parts) {
        if (b - a < 3) continue;
        const n = Math.max(2, Math.round((b - a) / 7)), ph = R.rr(0, 6), amp = R.rr(0.3, 1.5), pts = [];
        for (let i = 0; i <= n; i++) pts.push([a + (b - a) * i / n, y + h / 2 + amp * Math.sin(i * 1.3 + ph) + R.rr(-0.4, 0.4)]);
        // pressed hard, and gone over twice, so the stick fills the tooth of the paper
        const c = R.pick(moonC), pp = R.rr(0.75, 1) * (1 - Math.abs(u) * 0.35);
        A.stroke(pts, 'side', c, { w: h, p: pp, tin: R.rr(0.08, 0.35), tout: R.rr(0.08, 0.35) });
        A.stroke(pts.map(q => [q[0] + R.rr(-2, 2), q[1] + R.rr(-0.5, 0.5)]), 'pastel', c, { w: h * 0.8, p: pp * 0.8, tin: 0.2, tout: 0.2 });
      }
      slices.push([cx, y, ch, h]);
      y += h + R.rr(1.2, 5.5) * (0.6 + Math.abs(u) * 0.9);
    }
    // then rubbed sideways with a finger, and a few thin bright edges put back where the slices tip to the sky
    A.blend(rect(mx - 60, my - 64, mx + 60, my + 76), { r: 2, k: 0.55, ang: 0, len: 14 });
    for (const [cx, y, ch] of slices) {
      if (R.chance(0.55)) A.stroke([[cx - ch * R.rr(0.2, 0.7), y + R.rr(0, 1)], [cx + ch * R.rr(0.1, 0.6), y + R.rr(-0.6, 1.2)]], 'chalk', '#fffbea', { w: R.rr(1, 1.8), p: R.rr(0.4, 0.8) });
    }
    // bits pulled away from it, smaller and fainter the further they drift
    for (let i = 0; i < 34; i++) {
      const sg = R.chance(0.5) ? 1 : -1, d = R.rr(0.9, 3.2), x = mx + sg * R.rr(30, 70) * d * 0.7 + R.rr(-10, 10), y = my + R.rr(-70, 120) + (d - 1) * R.rr(-10, 30);
      const l = R.rr(4, 18) / Math.sqrt(d), bend = R.rr(-1, 1);
      A.stroke([[x - l / 2, y], [x, y + bend], [x + l / 2, y + R.rr(-0.6, 0.6)]], 'chalk', R.pick(moonC), { w: R.rr(1.4, 3), p: R.rr(0.3, 0.7) / d, tin: 0.2, tout: 0.3 });
    }
    // and its light run out below in a loose trail
    for (let i = 0; i < 16; i++) { const y = my + 56 + R.rr(4, 200), t = (y - my - 56) / 200, hw = 40 * (1 - t * 0.7) * R.rr(0.2, 0.8), cx = mx + 10 * Math.sin(y / 17) + R.rr(-14, 14); A.stroke([[cx - hw, y + R.rr(-1, 1)], [cx, y + R.rr(-1.6, 1.6)], [cx + hw, y + R.rr(-1, 1)]], R.chance(0.5) ? 'side' : 'chalk', R.pick(moonC), { w: R.rr(1.6, 3.2), p: (1 - t) * R.rr(0.18, 0.42) }); }

    // the lamp on the water: rings going out from it, broken where the light leaves them, warm near and cool far
    M.floorWash(A, rect(dy[0] - 200, dy[1] - 90, dy[0] + 200, dy[1] + 110), '#e8a040', (x, y) => 0.2 * Math.pow(Math.max(0, 1 - Math.hypot((x - dy[0]) / 190, (y - dy[1] - 8) / 80)), 1.5), 'over');
    for (const [rx, k] of [[34, 1], [62, 0.8], [98, 0.6], [142, 0.42], [196, 0.26]]) {
      const ry = rx * 0.3, c = A.mix('#f3c070', '#a8c4be', clamp((rx - 30) / 150, 0, 1));
      for (let a = R.rr(0, 0.8); a < 2 * PI;) {
        const len = R.rr(0.35, 1.1), gap = R.rr(0.12, 0.5) + (rx / 210) * 0.4;
        A.stroke(A.ellipse(dy[0] + R.rr(-1.5, 1.5), dy[1] + 8 + R.rr(-1, 1), rx * R.rr(0.97, 1.03), ry * R.rr(0.94, 1.06), 0, a, a + len), R.chance(0.5) ? 'side' : 'chalk', c, { w: R.rr(1.4, 3), p: k * R.rr(0.3, 0.65), tin: 0.25, tout: 0.25 });
        a += len + gap;
      }
    }

    // long lanes of paler water where a breath of wind has crossed it
    for (let i = 0; i < 10; i++) { const y = R.rr(5660, 6280), x0 = R.rr(-120, 1000), l = R.rr(300, 820), pts = []; for (let q = 0; q <= 12; q++) { const xx = x0 + l * q / 12; pts.push([xx, y + 3 * Math.sin(xx / 90 + i)]); } A.stroke(pts, 'side', A.mix('#4e706a', '#2a4440', depth(y) * 0.7), { w: R.rr(10, 22), p: R.rr(0.1, 0.2) * calm(x0 + l / 2), tin: 0.3, tout: 0.3 }); }
    // the Mewar marks for still water, but no two alike: scale arcs single and double, wavy dashes, bits of rings,
    // lying thick in some drifting patches and missing from others
    for (let i = 0; i < 1100; i++) {
      const x = R.rr(-20, W + 20), y = R.rr(WATER + 30, H - 6), t = depth(y);
      const patch = sstep((A.noise2(x / 300 + 3.7, y / 120 + 1.3, 23) - 0.36) / 0.3);
      if (R.rnd() > (0.12 + 0.7 * patch) * calm(x)) continue;
      if (Math.hypot((x - mx) / 70, (y - my) / 80) < 1 || Math.hypot((x - dy[0]) / 220, (y - dy[1]) / 80) < 1) continue;
      const near = Math.max(0, 1 - Math.hypot((x - mx) / 380, (y - my) / 200)), c = A.mix(A.mix('#86a8a2', '#3e5c58', t * 0.8), '#e8e4c8', near * 0.6);
      const p = (R.rr(0.18, 0.4) * (1 - t * 0.25) + near * 0.25) * calm(x), kind = R.rnd(), sw = R.rr(14, 44) * (1 + t * 0.2);
      if (kind < 0.42) A.stroke(A.ellipse(x, y, sw / 2, R.rr(3, 6.5), R.rr(-0.06, 0.06), PI * R.rr(1.05, 1.18), PI * R.rr(1.82, 1.95)), 'chalk', c, { w: R.rr(0.9, 1.6), p });
      else if (kind < 0.6) { for (let k2 = 0; k2 < 2; k2++) A.stroke(A.ellipse(x, y + k2 * 3.4, sw / 2 * (1 - k2 * 0.3), R.rr(3, 5.5), 0, PI * 1.1, PI * 1.9), 'chalk', c, { w: R.rr(0.9, 1.4), p: p * (1 - k2 * 0.3) }); }
      else if (kind < 0.82) { const pts = [], fr = R.rr(5, 9), amp = R.rr(1, 2.4); for (let xx = 0; xx <= sw * 1.4; xx += 3) pts.push([x + xx, y + amp * Math.sin(xx / fr)]); A.stroke(pts, R.chance(0.5) ? 'chalk' : 'side', c, { w: R.rr(1, 2.2), p: p * 0.9, tin: 0.2, tout: 0.3 }); }
      else { const a0 = R.rr(0, 2 * PI); A.stroke(A.ellipse(x, y, sw * 0.7, sw * 0.18, 0, a0, a0 + R.rr(0.8, 2.2)), 'chalk', c, { w: R.rr(0.8, 1.3), p: p * 0.8 }); }
    }

    // fish: three, gold and vermilion, turning slowly under the surface; a breath of water laid over each
    for (const f of [[420, 5900, 56, 0.2], [1010, 5960, 48, PI - 0.15], [700, 6200, 62, -0.1]]) {
      A.withMask(pool, () => M.fish(A, f[0], f[1], f[2], { pose: 'swim', ang: f[3], c: '#f3bd45', back: '#c8501c', fin: '#e8701e' }));
      M.floorWash(A, A.ellipse(f[0], f[1], 70, 44), '#1a3432', (x, y) => 0.24 * Math.max(0, 1 - Math.hypot((x - f[0]) / 70, (y - f[1]) / 44)), 'over');
    }
    // stars, far above, come down here as sparks: big and small, a few warm, none in the moon's light
    for (let i = 0; i < 90; i++) {
      const x = R.rr(120, W - 20), y = R.rr(WATER + 160, H - 20); if (Math.hypot(x - mx, (y - my) * 1.2) < 130 || Math.hypot((x - dy[0]) / 200, (y - dy[1]) / 70) < 1) continue;
      const big = R.chance(0.16), c = R.chance(0.2) ? '#f3dca0' : R.chance(0.5) ? '#e8f0f0' : '#c8dcdc', k = calm(x);
      if (big) M.sparkle(A, x, y, R.rr(2, 3.2) * k);
      else { A.dot(x, y, 'chalk', c, { w: R.rr(1, 2.2), p: R.rr(0.45, 0.9) * k }); if (R.chance(0.4)) A.stroke([[x - R.rr(2, 5), y], [x + R.rr(2, 5), y]], 'chalk', c, { w: 0.8, p: 0.35 * k }); }
    }
    // lotus all across the water: a clump at each place, pads first, then flowers, quieter on the card's side
    const clumps = [[150, 6060, 1, 2], [300, 5930, 0.9, 1], [430, 6180, 1, 2], [560, 6030, 0.7, 1], [700, 5640, 0.75, 1], [790, 6240, 0.9, 1], [1000, 6150, 0.85, 1], [1180, 5900, 0.6, 1], [1270, 6220, 0.7, 1], [1480, 6000, 0.6, 1], [1420, 5660, 0.5, 0]];
    for (const [cx, cy, s, nfl] of clumps) {
      const k = calm(cx), dk = depth(cy) * 0.6;
      for (let i = 0; i < Math.round(4 + s * 4); i++) { const x = cx + R.rr(-70, 70) * s, y = cy + R.rr(-26, 30) * s; M.lotusPad(A, x, y, R.rr(12, 28) * s, { rot: R.rr(0, 6.28), c: A.mix(A.mix('#2f6a44', '#1a3a2c', dk), '#14262a', 1 - k) }); }
      for (let i = 0; i < nfl; i++) M.lotus(A, cx + R.rr(-40, 40) * s, cy + R.rr(-14, 8) * s, R.rr(20, 34) * s * k, R.pick(['open', 'white', 'half', 'open']), { stem: 0 });
      if (R.chance(0.7)) M.lotus(A, cx + R.rr(-60, 60) * s, cy - R.rr(10, 26) * s, 14 * s, 'bud', { stem: R.rr(12, 20) * s, bend: R.rr(-4, 4) });
    }
    // fireflies over the water near the walls, where it is darkest
    M.fireflies(A, rect(110, WATER + 40, 420, 5980), 6, { s: 0.8 });
    M.fireflies(A, rect(1180, WATER + 40, 1560, 5900), 3, { s: 0.7 });
    M.fireflies(A, rect(420, 6080, 1000, 6260), 3, { s: 0.7 });
    // marigold petals that came down from the levels above, drifting toward the lamp
    const pts = []; for (let i = 0; i < 46; i++) { const t = R.rnd(); pts.push([lerp(260, dy[0] - 30, t) + R.rr(-60, 60), lerp(5420, dy[1] + 10, t) + R.rr(-30, 30), R.pick(['mari', 'mari', 'white', 'rose'])]); }
    M.petals(A, pts, c => A.mix(c, '#0e1a24', 0.25));
  }

  // ---------------------------------------------------------------- the gauge, the plaques and the marigold tie
  function gauge(A, G) {
    M.wellGauge(A, G.gauge, keyAt);
    // the gauge is old stone too: grain, a little wash of lime, chips out of its edges, stains running down it
    for (let y = G.gauge.y0; y < WATER; y += 300) {
      const K = keyAt(y + 150), poly = rect(GAUGE.x0, y, GAUGE.x1, Math.min(WATER, y + 300));
      M.wellStone(A, poly, K, { c: A.mix(K.face, K.lime, 0.25), ground: false, joints: 0, mottle: 0.55, grain: 1.6 });
      M.wellStains(A, GAUGE.x0 + 6, GAUGE.x1 - 6, y + 4, 60, 2, K);
      for (let i = 0; i < 3; i++) { const side = i % 2, yy = y + A.rr(10, 290); if (yy > WATER) continue; M.wellChip(A, side ? GAUGE.x1 - 2 : GAUGE.x0 + 2, yy, A.rr(3, 6), K, { face: true }); }
    }
    // under the water the gauge wavers, goes green, and is lost: the pool's own colour laid over it, thicker with depth,
    // and the water's strokes carried across it so it sits in the water and not on it
    const gx0 = GAUGE.x0 - 6, gx1 = GAUGE.x1 + 10, wcol = y => mixc(hexc('#3a5a50'), hexc('#0e1c1e'), sstep((y - WATER) / 760));
    for (let y = WATER; y < G.gauge.y1 + 4; y += 12) M.floorWash(A, rect(gx0, y, gx1, y + 12), wcol(y + 6), () => 0.38 + 0.6 * sstep((y - WATER + 20) / 520), 'over');
    for (let y = WATER + 4; y < G.gauge.y1; y += A.rr(7, 15)) { const x = gx0 - A.rr(0, 30), l = A.rr(80, 160), ph = A.rr(0, 6); A.stroke([0, 1, 2, 3, 4].map(i => [x + l * i / 4, y + 1.6 * Math.sin(i * 1.3 + ph)]), 'side', A.mix(wcol(y), '#5f8a80', 0.35 * (1 - sstep((y - WATER) / 500))), { w: A.rr(6, 12), p: A.rr(0.25, 0.5) }); }
    A.blend(rect(gx0, WATER + 6, gx1, G.gauge.y1), { r: 7, k: 0.4, ang: 0, len: 60 });
    for (const m of G.milestones) {
      const K = keyAt(m.y);
      M.wellPlaque(A, m.plaque[0], m.y, m.plaque[2], m.plaque[3] - m.plaque[1], m.kind, K);
      if (m.kind === 'sindoor') M.wellTie(A, GAUGE.x0, GAUGE.x1, m.y - 4, toneAt(A, m.y));
      if (m.kind === 'gold') { M.goldDust(A, [[GAUGE.x1 + 120, m.y]], 60, 110, { sx: 2.4, sy: 0.4 }); }
    }
  }

  // ---------------------------------------------------------------- a last breath of tooth over everything
  function grain(A, G, want) {
    for (let f = 0; f < NF; f++) {
      if (!want(f * FH, f * FH + FH)) continue;
      const y0 = f * FH, R = STAGE.rng(900 + f);
      for (let i = 0; i < 900; i++) { const x = R.rr(0, W), y = R.rr(y0, y0 + FH), K = keyAt(y); A.dot(x, y, 'chalk', R.chance(0.5) ? K.lime : K.deep, { w: R.rr(0.6, 1.3), p: R.rr(0.15, 0.35) }); }
    }
  }

  /* ================================================================ THE FIRST LINES (geru, on the bare sheet) */
  P.sketch = function (A, G) {
    const sk = (pts, o) => M.sketch(A, pts, Object.assign({ w: 3.4 }, o, { p: Math.min(0.69, ((o && o.p) || 0.6) * 1.2) }));
    A.reseed(31337);
    sk([[0, 362], [W, 362]]); sk([[0, 606], [W, 606]], { p: 0.45 }); sk([[0, 640], [W, 640]]); sk([[0, RIM], [W, RIM]]);
    const ch = G.chhatri, sh = M.wellChhatriShape(A, ch.cx, ch.by, ch.s);
    for (const p of sh) sk(p, { closed: true, p: 0.5 });
    sk(A.ellipse(210, 112, 50, 50), { closed: true, p: 0.45 });
    for (const L of G.levels) {
      for (const m of L.masses) if (m.tier !== 1 || L.k % 2) sk(m.pts, { p: 0.42 });
      sk([[L.left, L.yF - 6], [L.right, L.yF - 6]]); sk([[L.left, L.yF + 40], [L.right, L.yF + 40]], { p: 0.45 });
      sk(M.cityHand.arch(L.alcove.x, L.alcove.yb, L.alcove.w, L.alcove.h, 3, 0.1, 0.6), { closed: true, p: 0.5 });
      if (L.inL > 104) sk([[L.inL, L.top], [L.inL, L.yF + 40]], { p: 0.45 });
      if (L.inR) sk([[W - L.inR, L.top], [W - L.inR, L.yF + 40]], { p: 0.45 });
    }
    sk(rect(GAUGE.x0, RIM, GAUGE.x1, WATER + 300), { closed: true, p: 0.5 });
    for (const m of G.milestones) sk([[GAUGE.x1, m.y], [W, m.y]], { p: 0.4 });
    const d = G.dove; sk(rect(d.x - 74, d.yb - 330, d.x + 74, d.yb - 128), { closed: true, p: 0.5 });
    const lm = G.loom; sk(rect(lm.x - 120, lm.yb - 280, lm.x + 120, lm.yb), { closed: true, p: 0.5 });
    const tk = G.tank; sk(rect(tk.cx - tk.w / 2, tk.yTank, tk.cx + tk.w / 2, tk.yb), { closed: true, p: 0.5 });
    sk([G.lanternString.from, [(G.lanternString.from[0] + G.lanternString.to[0]) / 2, G.lanternString.from[1] + G.lanternString.sag], G.lanternString.to], { p: 0.45 });
    sk([[G.pole.x, G.pole.yb], [G.pole.x, G.pole.yb - G.pole.h]], { p: 0.5 });
    sk(rect(G.kund.cx - G.kund.w / 2, G.kund.yb - 64, G.kund.cx + G.kund.w / 2, G.kund.yb), { closed: true, p: 0.5 });
    sk([[0, WATER], [W, WATER]]);
  };

  /* ================================================================ THE LOOSE DRAWINGS */
  P.cels = function (G) {
    const C = [], cel = (name, w, h, ax, ay, draw) => C.push({ name, w: Math.ceil(w), h: Math.ceil(h), ax, ay, draw });
    // the clay lamp, its flame in three flickers; its glow; the inside of a lit alcove
    for (let v = 0; v < 3; v++) cel('lamp' + v, 64, 52, 24, 44, (A, x, y) => M.wellDiya(A, x, y, 1.15, v));
    for (let v = 0; v < 2; v++) cel('lampglow' + v, 100, 100, 32, 74, (A, x, y) => M.wellDiyaGlow(A, x + 18, y - 24, 38, v ? 0.85 : 1));
    cel('niche', 112, 170, 56, 150, (A, x, y) => M.wellNicheGlow(A, x, y, 80, 130));
    // pigeons on the wing, four beats, two greys
    for (let ph = 0; ph < 4; ph++) for (let v = 0; v < 2; v++) cel('pg' + ph + (v ? 'b' : 'a'), 52, 44, 26, 22, (A, x, y) => M.wellPigeon(A, x, y, 34, ph, v ? '#8a8f98' : '#7c8794', { flip: true, dark: v ? '#40464e' : '#3c4450' }));
    // motes in the noon light
    for (let v = 0; v < 3; v++) cel('mote' + v, 18, 18, 9, 9, (A, x, y) => M.mote(A, x, y, [0.7, 1, 1.3][v], v === 2 ? '#fff3c0' : null));
    // the six streams, glinting
    {
      const tk = G.tank, sp = G.spouts, x0 = tk.cx - 230, y0 = tk.yTank - 290;
      for (let v = 0; v < 3; v++) cel('stream' + v, 460, 310, tk.cx - x0, tk.yTank - y0, (A, x, y) => {
        const dx = x - tk.cx, dy = y - tk.yTank;
        sp.forEach((p, i) => {
          const path = M.wellStreamPath(A, p, tk.cx, tk.yTank, i).map(q => [q[0] + dx, q[1] + dy]);
          for (let k = 0; k < 5; k++) { const a = A.ri(2, path.length - 6), l = A.ri(2, 4); A.stroke(path.slice(a, a + l).map(q => [q[0] + A.rr(-0.6, 0.6), q[1]]), 'chalk', '#ffffff', { w: 1.2, p: 0.85 }); }
          const e = path[path.length - 1]; for (let k = 0; k < 3; k++) A.dot(e[0] + A.rr(-8, 8), e[1] - A.rr(2, 8), 'chalk', '#e8f4f6', { w: 1.4, p: 0.8 });
        });
        M.ripple(A, tk.cx + dx, tk.yTank + 2 + dy, 40 + v * 8, { rings: 2, w: 0.8, flat: 0.12 });
      });
    }
    // the glow of the lanterns, two breaths
    {
      const ls = G.lanterns, x0 = Math.min(...ls.map(l => l.x)) - 50, x1 = Math.max(...ls.map(l => l.x)) + 50, y0 = Math.min(...ls.map(l => l.y)) - 50, y1 = Math.max(...ls.map(l => l.y)) + 50;
      G.lanternBox = [r0(x0), r0(y0)];
      for (let v = 0; v < 2; v++) cel('lantern' + v, x1 - x0, y1 - y0, 0, 0, (A, x, y) => M.wellLanternGlow(A, ls.map(l => [x + l.x - x0, y + l.y - y0, l.r]), v ? 0.8 : 1));
    }
    // the flag in three winds
    for (let v = 0; v < 3; v++) cel('flag' + v, 150, 96, 6, 14, (A, x, y) => M.wellFlag(A, x, y, 128, v, c => A.mix(c, KEYS.eve.glaze, 0.18)));
    // cranes for the delta, four beats of the wing
    for (let ph = 0; ph < 4; ph++) cel('crane' + ph, 140, 130, 70, 65, (A, x, y) => M.crane(A, x, y, 66, { ang: PI, phase: ph, c: '#f4eef0', shadow: '#b8a8c4' }));
    // fireflies
    [1.2, 0.75].forEach((s, i) => cel('fly' + i, 40, 40, 20, 20, (A, x, y) => M.fireflies(A, [[x - 1, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1]], 1, { trail: 0, s })));
    // stars in the water
    [2.4, 4, 6].forEach((r, i) => cel('spark' + i, 26, 26, 13, 13, (A, x, y) => M.sparkle(A, x, y, r)));
    // the lamp afloat at the end, with its long reflection; and the rings round it
    for (let v = 0; v < 3; v++) cel('float' + v, 100, 140, 50, 40, (A, x, y) => {
      M.reflection(A, x, y + 6, 22, 92, { c: 'haldi', c2: 'saffron', p: 1, lw: 2.2, gap: 3, spread: 0.6 });
      M.lamp(A, x, y, 22, { ripples: false, reflect: false, k: 0.9 });
    });
    [[10, true], [17, false], [26, false], [36, false]].forEach((q, i) => cel('ring' + i, 90, 44, 45, 22, (A, x, y) => M.ripple(A, x, y, q[0], { fresh: q[1], rings: i === 3 ? 3 : undefined, w: i === 3 ? 0.8 : 1, c: '#9fb8bc' })));
    return C;
  };

  /* ================================================================ WHAT THE PAGE DOES WITH THEM
     Sheet units, seconds.  Two new kinds:
       'alcoves'   the page lights an alcove's lamp (cels) and its niche glow when the walking lamp has reached it, and
                   leaves it lit, so the way back up is lit.  pts: where each lamp stands, one per level.
       'walker'    the lamp that walks down with the reader, along path; stops[i] is the index of the point at level i's
                   alcove (the last stop is the water).
       'formation' birds that fly in a fixed shape (slots, offsets from x, y), drifting together by amp over period, each
                   beating its wings out of step with the others. */
  P.actors = function (G) {
    const a = [], [L1, L2, L3, L4, L5] = G.levels;
    a.push({ type: 'twinkle', layer: 'glow', z: 1, cels: ['mote0', 'mote1', 'mote2'], box: [260, 760, 980, 1600], n: 10, every: [1, 3] });
    const d = G.doveInfo || { holes: [[G.dove.x, G.dove.yb - 250]] }, h = d.holes[7] || d.holes[0];
    a.push({ type: 'flock', layer: 'top', z: 2, frames: [['pg0a', 'pg0b'], ['pg1a', 'pg1b'], ['pg2a', 'pg2b'], ['pg3a', 'pg3b']], cycle: [0, 1, 2, 3], from: [r0(h[0]), r0(h[1])], to: [-80, 820], sag: -120, n: 14, gap: 26, speed: 170, size: [0.7, 1.05], first: 1.5, every: [12, 22] });
    a.push({ type: 'boil', layer: 'top', z: 3, cels: ['stream0', 'stream1', 'stream2'], x: r0(G.tank.cx), y: r0(G.tank.yTank), hold: 2 });
    a.push({ type: 'flicker', layer: 'glow', z: 4, cels: ['lantern0', 'lantern1'], x: G.lanternBox[0], y: G.lanternBox[1], hold: 3, alpha: [0.75, 1] });
    a.push({ type: 'sway', layer: 'top', z: 5, cels: ['flag0', 'flag1', 'flag2'], x: r0(G.flag[0]), y: r0(G.flag[1]), every: [2, 5], hold: 3 });
    a.push({ type: 'formation', layer: 'top', z: 6, cels: ['crane0', 'crane1', 'crane2', 'crane3'], x: G.delta.x, y: G.delta.y, slots: G.delta.slots, amp: [26, 10], period: 16, hold: 4 });
    a.push({ type: 'blink', layer: 'glow', z: 7, cels: ['fly0', 'fly1'], zones: [[L4.left + 20, 3700, CARD, L4.yF - 10], [L5.left + 20, 4560, CARD, L5.yF - 10], [240, WATER + 40, 1200, 5900]], n: [4, 7, 5] });
    a.push({ type: 'twinkle', layer: 'glow', z: 8, cels: ['spark0', 'spark1', 'spark2'], box: [240, WATER + 120, W - 40, H - 40], n: 8, every: [0.6, 1.8] });
    const dx = G.diya[0], dy = G.diya[1];
    a.push({ type: 'rings', layer: 'under', z: 9, cels: ['ring0', 'ring1', 'ring2', 'ring3'], pts: [[dx, dy + 4, 1], [dx - 4, dy + 6, 1.2], [dx, dy + 3, 1], [dx + 2, dy + 5, 1.4], [dx, dy + 4, 1.6]], every: [3, 7], hold: 2 });
    a.push({ type: 'boil', layer: 'top', z: 10, cels: ['float0', 'float1', 'float2'], x: dx, y: dy, hold: 3 });
    a.push({ type: 'alcoves', layer: 'top', z: 11, cels: ['lamp0', 'lamp1', 'lamp2'], glow: ['lampglow0', 'lampglow1'], niche: 'niche', pts: G.levels.map(L => [L.lamp[0], L.lamp[1]]), nicheAt: G.levels.map(L => [L.alcove.x, L.alcove.yb]), hold: 2 });
    a.push({ type: 'walker', layer: 'top', z: 12, cels: ['lamp0', 'lamp1', 'lamp2'], glow: ['lampglow0', 'lampglow1'], path: G.lampPath, stops: G.lampStops, hold: 2 });
    void L1; void L2; void L3;
    return a;
  };

  /* ================================================================ FOR THE PAGE: where things are (assets/well.json) */
  P.layout = function (G) {
    return {
      w: W, h: H, frame: [W, FH], frames: G.frames.map(f => ({ i: f.i, y: f.y, name: f.name })),
      card: [CARD, 0, W, FH],
      levels: G.levels.map((L, i) => ({
        frame: L.k, years: DATA.levels[i].years, label: DATA.levels[i].label, hour: DATA.levels[i].hour,
        y: [r0(L.top), r0(L.yF + 40)], floor: r0(L.yF), alcove: [r0(L.alcove.x), r0(L.alcove.yb)], lamp: L.lamp.map(r0),
        objects: objectBoxes(G, L.k).map((o, j) => Object.assign({}, DATA.levels[i].objects[j] || {}, { box: o.map(r0) }))
      })),
      gauge: { box: [GAUGE.x0, G.gauge.y0, GAUGE.x1, G.gauge.y1], map: YMAP, below: '2019 - (y - 5290) / 860', faces: G.gauge.faces },
      milestones: G.milestones.map(m => ({ id: m.id, at: +m.at.toFixed(3), kind: m.kind, text: m.text, guess: !!m.guess, y: m.y, plaque: m.plaque })),
      water: WATER, lampPath: G.lampPath, lampStops: G.lampStops, unconfirmed: DATA.unconfirmed
    };
  };
  function objectBoxes(G, k) {
    if (k === 1) return [G.doveInfo ? G.doveInfo.box : [G.dove.x - 92, G.dove.yb - 400, G.dove.x + 92, G.dove.yb], G.loomInfo ? G.loomInfo.box : [G.loom.x - 132, G.loom.yb - 300, G.loom.x + 206, G.loom.yb]];
    if (k === 2) return [[G.toran.x0 - 10, G.toran.y - 10, G.toran.x1 + 10, G.levels[1].yF + 10], [G.tank.cx - 220, G.tank.yTank - 270, G.tank.cx + 220, G.tank.yb]];
    if (k === 3) { const ls = G.lanterns; return [[Math.min(...ls.map(l => l.x)) - 20, G.lanternString.from[1] - 10, Math.max(...ls.map(l => l.x)) + 20, Math.max(...ls.map(l => l.y)) + 30], G.cupsInfo ? G.cupsInfo.box : [G.cups.x - 70, G.cups.yb - 80, G.cups.x + 70, G.cups.yb]]; }
    if (k === 4) { const s = G.delta; return [[s.x - 80, s.y - 170, s.x + 320, s.y + 200], [G.pole.x - 70, G.pole.yb - G.pole.h - 20, G.pole.x + 150, G.pole.yb]]; }
    return [G.kundInfo ? G.kundInfo.box : [G.kund.cx - 110, G.kund.yb - 140, G.kund.cx + 110, G.kund.yb]];
  }

  P.W = W; P.FH = FH; P.NF = NF; P.H = H;
  return P;
})();
