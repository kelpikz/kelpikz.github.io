/* ------------------------------------------------------------------ *
 *  THE GOLD WELL  (well8k: the one painting the Experience page flies into)
 *
 *  One sheet, 1920 x 1080 logical units, painted at S = 4 (7680 x 4320)
 *  so that every level holds up when the camera stands in front of it.
 *  Seen from the rim and flattened the Mewar way: a strip of lapis sky
 *  with the sun straight over the chhatri; under it the well opens,
 *  five levels stepping in, each an arcade with its own rhythm and its
 *  own colour (gold, peach, vermilion, malachite, lapis), then the dark
 *  water with the sun in it.  One straight stair runs down the middle.
 *  The noon light falls down that stair like a column; the sides of
 *  the well are in shade; it is noon at the top and night at the water.
 *
 *  The focal objects are the camera stops (seven: the rim, five objects,
 *  the water); the hackathon cups and the Delta Force cranes are found by hovering.  Every object stands clear of the stair in front
 *  of a quiet ground kept for it (a deep arch, a plain panel, a dark
 *  hall), the bays round it drop their colour, its kajal is heavier, and
 *  only the focal objects carry gold leaf; elsewhere gold is painted as
 *  matte yellow ochre.  The card is always on the right of each view, the year gauge on the left.
 *
 *  P.geom() gives the shape, the camera stops, the objects, the hot boxes
 *  and the cut-out rectangles.  P.background(A, G, say, opt) paints;
 *  opt.only limits it to some parts: 'paper', 'sky', 'sides', 'L1'..'L5',
 *  'tank', 'light', 'air'; opt.focal(id, draw) is called in place of
 *  drawing each focal object (make-well8k.mjs uses it to cut them out).
 *  Nothing here runs when the file is loaded.
 * ------------------------------------------------------------------ */
STAGE.places.well8k = (function () {
  const P = {};
  const W = 1920, H = 1080, PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const T = c => c;
  const r1 = v => Math.round(v * 10) / 10;
  // the pigeons of the well (src/m-w8-birds.js).  The pose and the coat come from where the bird is, so the dice for
  // everything else stay as they were
  const POSE = ['sit', 'sit', 'preen', 'tuck', 'half', 'sit', 'preen'];
  const hashXY = (x, y) => { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return h - Math.floor(h); };
  const coatOf = (c, h) => /^#e[cef]/.test(c) ? 'white' : h > 0.88 ? 'brown' : 'grey';
  function pigeonSit(A, x, y, s, flip, c) { const h = hashXY(x, y); M.w8Pigeon(A, x, y, s, POSE[(h * POSE.length) | 0], { flip, c: coatOf(c, hashXY(y, x)) }); }
  function pigeonFly(A, x, y, s, ph, c, o) { const sn = s * 0.62; M.w8Pigeon(A, x, y + 0.35 * sn, sn, 'fly', { flip: o && o.flip, c: coatOf(c, hashXY(y, x)) }); }
  const hex3 = c => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const STAGE_mix = (a, b, t) => { const p = hex3(a), q = hex3(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  /* ================================================================ PALETTE TOKENS (see ART-DIRECTION.md) */
  const TOK = {
    wasli: '#ecdcbc', sona: '#dcae45', sonaDeep: '#a8741c', zari: '#f2d27a',
    aadoo: '#f2a07a', kesar: '#ec8a3a', sindoor: '#d23c2a', gulal: '#cf4a6c',
    hara: '#3b7f52', neel: '#2a4c9c', raat: '#17204a', jal: '#0e2a30',
    kai: '#5a6b2e', safeda: '#f7efdc', pathar: '#e2c08a', kajal: '#1b1512', geru: '#9c4a2c',
    chhaya: '#4a3c6c'
  };
  // one palette per level: the stone cools and darkens going down, the bays carry the level's colour
  const PAL = {
    y2025: { stone: '#edd4a2', stoneLit: '#f8e9c8', stoneWarm: '#e9c488', stoneDeep: '#b5874a', lime: '#f8f0de', line: '#2c1d12', ground: '#d9a83c', frieze: '#d9a83c', gold: '#d6a535', accent: '#c8321c', panel: '#2a4b96', dark: '#3a2212', glow: '#f0b050' },
    y2023: { stone: '#efc7a2', stoneLit: '#f8e2c8', stoneWarm: '#eab48c', stoneDeep: '#b27a58', lime: '#f8ece0', line: '#2e1a14', ground: '#f0a07a', frieze: '#e98a5c', gold: '#d6a535', accent: '#c8321c', panel: '#3b7f52', dark: '#3a1a16', glow: '#f0a050' },
    y2022: { stone: '#e4b49e', stoneLit: '#f2d4c4', stoneWarm: '#dc9c86', stoneDeep: '#a26254', lime: '#f6e4da', line: '#2e1416', ground: '#cf3a2a', frieze: '#a82a26', gold: '#d6a535', accent: '#e6b422', panel: '#1d2850', dark: '#2c1012', glow: '#f09040' },
    y2020: { stone: '#c9b8a2', stoneLit: '#e2d6c4', stoneWarm: '#bfa688', stoneDeep: '#7e6e60', lime: '#ece4d6', line: '#1e1a14', ground: '#3b7f52', frieze: '#2f6844', gold: '#c99a35', accent: '#e8607a', panel: '#7a2a2a', dark: '#1c1a14', glow: '#f0a040' },
    y2019: { stone: '#aaa2ae', stoneLit: '#cac2cc', stoneWarm: '#a0909e', stoneDeep: '#5e5468', lime: '#ddd6dc', line: '#16141e', ground: '#2a4c9c', frieze: '#1d2f6a', gold: '#c99a35', accent: '#f0b8b0', panel: '#17204a', dark: '#12101c', glow: '#f0a040' },
    tank: { stone: '#6e7670', stoneLit: '#8e9690', stoneWarm: '#6a6e60', stoneDeep: '#363e3c', lime: '#a8b0a8', line: '#0c1010', ground: '#0e2a30', frieze: '#0e2a30', gold: '#b08a35', accent: '#d77f86', panel: '#0e2a30', dark: '#081012', glow: '#f0a040' }
  };

  /* the colour each level's wall is washed in: strong, with its own lit, warm and deep tones.  frame: the moulding
     round a bay; jali: the stone of its screens; halo: the ground inside a gilded niche, chosen to stand off the wall.
     Cream is kept for the pillars, the eaves and the floors. */
  const WALL = {
    y2025: { stone: '#d8962a', stoneLit: '#e8b040', stoneWarm: '#c8822a', stoneDeep: '#6e4010', frame: '#eccb80', jali: '#e2bc70', halo: '#c4301c' },
    y2023: { stone: '#e98a5e', stoneLit: '#f2a47a', stoneWarm: '#dc7650', stoneDeep: '#843624', frame: '#f6c4a2', jali: '#eeb08e', halo: '#2f6a4a' },
    y2022: { stone: '#bf3424', stoneLit: '#d24a32', stoneWarm: '#a82a1e', stoneDeep: '#52120c', frame: '#e6a08a', jali: '#d88870', halo: '#1d2f6a' },
    y2020: { stone: '#2c7450', stoneLit: '#3a8a60', stoneWarm: '#256444', stoneDeep: '#0c2c1c', frame: '#9cc4a6', jali: '#84b292', halo: '#7a2424' },
    y2019: { stone: '#26468e', stoneLit: '#3456a4', stoneWarm: '#1f3a7c', stoneDeep: '#0c183c', frame: '#93a6d4', jali: '#7c90c4', halo: '#121a40' }
  };

  /* ================================================================ THE SHAPE OF THE WELL */
  const VP = [960, 112];
  const rayX = (p, y) => VP[0] + (y - VP[1]) * (p[0] - VP[0]) / (p[1] - VP[1]);
  const rayY = (p, x) => VP[1] + (x - VP[0]) * (p[1] - VP[1]) / (p[0] - VP[0]);
  /* the five levels, newest at the top.  top: the eave of its wall; land: the edge of its landing (the next level's
     top); a: where its wall starts across.  side: the zigzag side its big things stand on (-1 left, 1 right).
     The bays are read outward from the stair: the head first (headZ on the zigzag side, headO on the other), then
     seq again and again.  P pavilion, K big jharokha, S the wall of spouts, T the door with the toran,
     W door, H wide halo, m panel, h halo, k jharokha, n jali, l lamp niche. */
  const LV = [
    { id: 'y2025', top: 150, land: 324, a: 150, frieze: 'lotus', side: -1, headZ: 'P', headO: 'P', seq: 'nhnWnmnH', seqO: 'nWnhnmnk' },
    { id: 'y2023', top: 324, land: 492, a: 226, frieze: 'vine', side: 1, headZ: 'nSnT', headO: 'P', seq: 'nknmnWnh', seqO: 'nhnWnmnk' },
    { id: 'y2022', top: 492, land: 654, a: 298, frieze: 'lattice', side: -1, headZ: 'P', headO: 'K', seq: 'nmnHnknW', seqO: 'nWnknmnh' },
    { id: 'y2020', top: 654, land: 810, a: 364, frieze: 'waves', side: 1, headZ: 'K', headO: 'P', seq: 'lmlWlhlk', seqO: 'lhlklmlW' },
    { id: 'y2019', top: 810, land: 960, a: 424, frieze: 'stars', side: -1, headZ: 'P', headO: 'K', seq: 'lWlmlhlW', seqO: 'lmlWlklh' }];
  const WTOP = 960, WATER = 976, WA = 478;
  const STAIR = { y0: 146, y1: 1012, hw0: 44, hw1: 30 };
  const stairHW = y => lerp(STAIR.hw0, STAIR.hw1, (y - STAIR.y0) / (STAIR.y1 - STAIR.y0));
  const SUN = { x: 960, y: 44, r: 30 };
  const CHHATRI = { x: 960, base: 148, h: 84 };
  const MOTIFS = ['mango', 'elephant', 'peacock', 'horse', 'lotus', 'deer'];
  const BW = { P: 2.1, K: 1.9, S: 4.2, T: 1.8, W: 1.4, H: 1.4, m: 1, h: 1, k: 1.05, n: 0.58, l: 0.58 };
  const KIND = { P: 'pavilion', K: 'jharokha', S: 'spoutwall', T: 'torana', W: 'door', H: 'halo', m: 'panel', h: 'halo', k: 'jharokha', n: 'jali', l: 'lamp' };
  // the screens knocked through, here and there and never on both sides: [level, side, which jali bay counting out]
  const BROKEN = [[1, 1, 5], [3, 1, 3], [4, -1, 2]];
  /* where the focal objects stand (picture units across), and the quiet ground kept behind each: every bay whose
     middle falls in [x0, x1] gives way to one plain bay.  'dark': plain plaster with one deep arch, for a light
     object; 'plain': a plain pale panel, for a dark one; 'hall': a dark hall of arches for the lanterns. */
  const OX = { dove: 300, loom: 700, cups: 690, cranes: 1190, pole: 1400, kund: 690 };
  const QUIET = [
    { k: 1, side: -1, x0: 226, x1: 374, kind: 'dark', ow: 126 },
    { k: 1, side: -1, x0: 612, x1: 800, kind: 'plain' },
    { k: 3, side: 1, x0: 1085, x1: 1520, kind: 'hall' },
    { k: 4, side: 1, x0: 1070, x1: 1310, kind: 'dark', ow: 190 },
    { k: 5, side: -1, x0: 560, x1: 820, kind: 'dark', ow: 220 }];

  function sideWall(L, side) {
    const left = side === 'left', cx = left ? L.a : L.b, Ct = [cx, L.top], Cf = [cx, L.foot];
    const xn = left ? -40 : W + 40, Nt = [xn, rayY(Ct, xn)], Nf = [xn, rayY(Cf, xn)];
    return { quad: left ? [Nt, Ct, Cf, Nf] : [Ct, Nt, Nf, Cf], Ct, Cf, Nt, Nf };
  }
  // the bays of one level, outward from the stair on each side
  function layout(L) {
    const shw = stairHW((L.top + L.foot) / 2) + 6, u = (L.arB - L.arT) * 0.48, out = [];
    L.u = u; L.pw = u * 0.13;
    for (const sg of [-1, 1]) {
      const inner = 960 + sg * shw, outer = sg < 0 ? L.a : L.b, len = Math.abs(outer - inner);
      const head = sg === L.side ? L.headZ : L.headO, seq = head + (sg === L.side ? L.seq : L.seqO).repeat(8), ws = [];
      let sum = 0;
      for (const ch of seq) { const w = BW[ch] * u; if (sum + w * 0.5 > len) break; ws.push(ch); sum += w; }
      // the head keeps its size; the rest give a little so the wall is filled exactly
      const fixed = ws.slice(0, head.length).reduce((s, ch) => s + BW[ch] * u, 0), f = (len - fixed) / (sum - fixed);
      let x = inner;
      ws.forEach((ch, i) => {
        const w = BW[ch] * u * (i < head.length ? 1 : f), xb = x + sg * w;
        out.push({ x0: Math.min(x, xb), x1: Math.max(x, xb), ch, kind: KIND[ch], side: sg, i });
        x = xb;
      });
    }
    // the quiet grounds: the bays in each span give way to one plain bay (a pavilion keeps its place)
    for (const q of QUIET) if (q.k === L.k) {
      const inn = out.filter(b => b.side === q.side && b.kind !== 'pavilion' && (b.x0 + b.x1) / 2 > q.x0 && (b.x0 + b.x1) / 2 < q.x1);
      if (!inn.length) continue;
      const nb = { x0: Math.min(...inn.map(b => b.x0)), x1: Math.max(...inn.map(b => b.x1)), ch: 'Q', kind: q.kind === 'hall' ? 'hall' : 'iwan', quiet: q.kind, ow: q.ow, side: q.side, i: inn[0].i };
      out.splice(out.indexOf(inn[0]), inn.length, nb);
    }
    return out;
  }

  P.geom = function () {
    const G = { W, H, VP, TOK, PAL, SUN, CHHATRI, STAIR, stairHW, WTOP, WA, WATER };
    G.levels = LV.map((src, i) => {
      const L = Object.assign({ k: i + 1, pal: PAL[src.id] }, src);
      L.b = W - L.a; L.band = L.land - L.top; L.h = L.band * 0.75; L.foot = L.top + L.h;
      L.eaveY = L.top + 4; L.fr0 = L.top + L.h * 0.12; L.fr1 = L.top + L.h * 0.22;
      L.arT = L.fr1 + 0.8; L.arB = L.foot - L.h * 0.1;
      L.left = sideWall(L, 'left'); L.right = sideWall(L, 'right');
      L.bays = layout(L);
      return L;
    });
    G.levels.forEach((L, i) => {
      const N = G.levels[i + 1] || { a: WA, top: WTOP };
      const YF = 1500, fl = [L.a, L.foot], fr = [L.b, L.foot], nl = [N.a, N.top], nr = [W - N.a, N.top];
      L.terrL = [[rayX(fl, YF), YF], fl, [N.a, L.foot], nl, [rayX(nl, YF), YF]];
      L.terrR = [[rayX(nr, YF), YF], nr, [W - N.a, L.foot], fr, [rayX(fr, YF), YF]];
    });
    {
      const YF = 1500, l = [WA, WTOP], r = [W - WA, WTOP];
      G.tank = { wall: rect(WA, WTOP, W - WA, WATER), water: [[WA + 4, WATER], [W - WA - 4, WATER], [rayX(r, YF), YF], [rayX(l, YF), YF]] };
    }
    const L1 = G.levels[0];
    G.deck = [[-60, 136], [W + 60, 136], [W + 60, rayY([L1.b, L1.top], W + 60)], [L1.b, L1.top], [L1.a, L1.top], [-60, rayY([L1.a, L1.top], -60)]];

    // ---- the focal objects, each on its own ground, clear of the stair
    const [La, Lb, Lc, Ld, Le] = G.levels;
    const bayOf = (L, ch) => L.bays.find(b => b.ch === ch && b.side === L.side);
    const S2 = bayOf(Lb, 'S'), T2 = bayOf(Lb, 'T'), HL = Lc.bays.find(b => b.kind === 'hall');
    G.obj = {
      dove: { x: OX.dove, yb: La.land - 6, k: 0.46 },
      loom: { x: OX.loom, yb: La.land - 5, k: 0.5 },
      // the spouts and their tank are drawn wider than tall, so the six mouths sit in the wall under the frieze
      tank: { x: r1((S2.x0 + S2.x1) / 2), yb: Lb.land - 6, kx: 0.68, ky: 0.52, yT: -56 },
      door: { x0: r1(T2.x0), x1: r1(T2.x1) },
      // the festival hall: the cords are tied under the eave, at the pillars of the hall
      hall: { x0: r1(HL.x0), x1: r1(HL.x1), y: r1(Lc.eaveY + 9), drop: r1(Lc.arB - Lc.eaveY - 2) },
      // the two hackathon cups: a small trophy on the landing, found by hovering, not a stop of its own
      cups: { x: OX.cups, yb: Lc.land - 5, k: 0.3, s: 1.6 },
      cranes: { x: OX.cranes, y: r1(Ld.top + Ld.h * 0.42 + 15), s: 38 },
      pole: { x: OX.pole, yb: Ld.land - 5, k: 0.5, h: 318 },
      kund: { x: OX.kund, yb: Le.land - 3, k: 0.85, w: 300 },
      float: { x: 905, y: 1040 }, sunR: { x: 960, y: 1030 }
    };
    const O = G.obj, box = (x, y, w, h) => [x, y, w, h].map(r1);
    G.hot = {
      sidekick: box(O.dove.x - 92 * 0.94 * O.dove.k, O.dove.yb - 420 * 0.94 * O.dove.k, 184 * 0.94 * O.dove.k, 420 * 0.94 * O.dove.k),
      'rule-builder': box(O.loom.x - 132 * O.loom.k, O.loom.yb - 300 * O.loom.k, 338 * O.loom.k, 300 * O.loom.k),
      joined: box(T2.x0, Lb.arT - 4, T2.x1 - T2.x0, Lb.foot - Lb.arT + 4),
      portfolio: box(O.tank.x - 140 * O.tank.kx, O.tank.yb - 282 * O.tank.ky, 280 * O.tank.kx, 282 * O.tank.ky),
      pragyan: box(O.hall.x0, O.hall.y - 4, O.hall.x1 - O.hall.x0, O.hall.drop * 1.12),
      hackathons: box(O.cups.x - 60 * O.cups.s * O.cups.k, O.cups.yb - 72 * O.cups.s * O.cups.k, 120 * O.cups.s * O.cups.k, 72 * O.cups.s * O.cups.k),
      'delta-force': box(O.cranes.x + CRANE_V.lead - O.cranes.s * 0.75, O.cranes.y - 3 * CRANE_V.dy - O.cranes.s * 0.7, 3 * CRANE_V.dx + O.cranes.s * 1.45, 6 * CRANE_V.dy + O.cranes.s * 1.3),
      'nit-trichy': box(O.kund.x - 150 * O.kund.k, O.kund.yb - 150 * O.kund.k, 300 * O.kund.k, 150 * O.kund.k)
    };
    // the cut-out of each object: its box with room for the glow, the shadow and the hand going over the line
    G.objs = {};
    for (const id in G.hot) {
      const [x, y, w, h] = G.hot[id], m = id === 'pragyan' ? 0.1 : 0.08;
      G.objs[id] = { rect: box(x - w * m, y - h * m, w * (1 + 2 * m), h * (1 + 2 * m)) };
    }

    // ---- the camera stops: the rim, one for each object, the water.  A view is 1/z of the sheet, the object at the
    //      middle of the part left free between the year gauge on the left and the card, which is always on the right
    const mid = b => [b[0] + b[2] / 2, b[1] + b[3] / 2];
    const view = (c, z, card) => {
      const vw = W / z, vh = H / z, x0 = clamp(c[0] - 0.37 * vw, 0, W - vw), y0 = clamp(c[1] - 0.5 * vh, 0, H - vh);
      return [x0, y0, vw, vh].map(r1);
    };
    const STOPS = [
      ['sidekick', 'y2025', 3.2], ['rule-builder', 'y2025', 3.2], ['portfolio', 'y2023', 2.9], ['pragyan', 'y2022', 2.7],
      ['nit-trichy', 'y2019', 3.0]];
    // the hackathon cups and the Delta Force cranes keep their hot boxes (the page names them on hover) but are not
    // stops: Delta Force is told on the NIT Trichy card
    const stops = [{ id: 'rim', year: null, obj: null, view: [0, 0, W, H], focus: [960, 540], card: 'right', z: 1 }];
    for (const [id, year, z] of STOPS) {
      const f = mid(G.hot[id]), card = 'right';
      // the portfolio view holds the door beside the tank too
      const c = id === 'portfolio' ? mid([G.hot.portfolio[0], G.hot.portfolio[1], G.hot.joined[0] + G.hot.joined[2] - G.hot.portfolio[0], G.hot.portfolio[3]]) : f;
      stops.push({ id, year, obj: id, also: id === 'portfolio' ? ['joined'] : undefined, view: view(c, z, card), focus: f.map(r1), card, z });
    }
    {
      const vh = 250, vw = vh * 16 / 9;
      stops.push({ id: 'before', year: 'before', obj: null, view: [960 - 0.42 * vw, H - vh, vw, vh].map(r1), focus: [940, 1030], card: 'right', z: r1(H / vh) });
    }
    G.stops = stops;
    G.focus = stops.map(s => s.focus);
    // the lamp's walk: from the chhatri straight down the stair to the water
    G.path = [[960, 148]].concat(G.levels.map(L => [960, L.top]), [[960, WTOP], [960, WATER + 30]]);
    return G;
  };

  /* ================================================================ MAPS, AND THE SHEET SEEN THROUGH ONE
     (the same machinery as stage-wellhero.js, with thinner floors for lines: at S = 4 a hair is a quarter unit) */
  function scaleMap(k, ox, oy) { return { f: (x, y) => [ox + x * k, oy + y * k], inv: (X, Y) => [(X - ox) / k, (Y - oy) / k], J: () => [k, 0, 0, k] }; }
  const place = (hx, hy, k, nx, ny) => scaleMap(k, hx - (nx || 0) * k, hy - (ny || 0) * k);
  const isPolys = p => p.length && Array.isArray(p[0][0]);
  const cen = p => { const q = isPolys(p) ? p[0] : p; let sx = 0, sy = 0; for (const v of q) { sx += v[0]; sy += v[1]; } return [sx / q.length, sy / q.length]; };
  const MINW = { kajal: 0.3, chalk: 0.38, pastel: 0.55, side: 1.2, gold: 0.4, shade: 0.6, geru: 0.34, pencil: 0.28 };
  const tw = (tool, w0, k) => Math.max(w0 * k, Math.min(w0, typeof tool === 'string' && MINW[tool] != null ? MINW[tool] : 0.35));
  const wobK = k => clamp(k * 1.3, 0.35, 1);
  // zo.kw: kajal drawn this many times heavier (the focal objects)
  function zoom(A, map, zo) {
    if (A.__z) {
      const o = A.__z, m2 = map;
      map = {
        f: (x, y) => { const q = m2.f(x, y); return o.f(q[0], q[1]); },
        inv: (X, Y) => { const q = o.inv(X, Y); return m2.inv(q[0], q[1]); },
        J: (x, y) => { const q = m2.f(x, y), a = o.J(q[0], q[1]), b = m2.J(x, y); return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]]; }
      };
      A = A.__base;
    }
    const B = A, Z = Object.create(B), TL = B.TOOLS, KW = (zo && zo.kw) || 1, kwf = tool => tool === 'kajal' ? KW : 1;
    const pt = p => { const q = map.f(p[0], p[1]); if (p.length > 2) q.push(p[2]); return q; };
    const pts = a => a.map(pt), polys = p => isPolys(p) ? p.map(pts) : pts(p);
    const kAt = (x, y) => { const j = map.J(x, y); return Math.sqrt(Math.abs(j[0] * j[3] - j[1] * j[2])); };
    const angAt = (x, y, a) => { const j = map.J(x, y), c = Math.cos(a), s = Math.sin(a); return Math.atan2(j[2] * c + j[3] * s, j[0] * c + j[1] * s); };
    const TT = tool => typeof tool === 'string' ? TL[tool] : tool;
    Z.__z = map; Z.__base = B; Z.__k = kAt; Z.__ang = angAt; Z.__pt = pt;
    Z.stroke = (p, tool, c, o) => {
      o = o || {}; if (p.length < 2) return;
      const m = p[(p.length / 2) | 0], k = kAt(m[0], m[1]), w0 = (o.w != null ? o.w : TT(tool).w) * kwf(tool);
      return B.stroke(pts(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.line = (x1, y1, x2, y2, tool, c, o) => Z.stroke([[x1, y1], [x2, y2]], tool, c, o);
    Z.dot = (x, y, tool, c, o) => {
      o = o || {}; const w0 = o.w != null ? o.w : TT(tool).w, l0 = o.len != null ? o.len : w0 * 0.35, an = o.ang != null ? o.ang : B.rnd() * 6.283, k = kAt(x, y), q = map.f(x, y);
      return B.dot(q[0], q[1], tool, c, Object.assign({}, o, { w: tw(tool, w0, k), len: l0 * k, ang: angAt(x, y, an), wob: (o.wob != null ? o.wob : 0.3) * wobK(k) }));
    };
    Z.fill = (p, tool, c, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]), w0 = o.w != null ? o.w : TT(tool).w;
      return B.fill(polys(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : -0.62), len: (o.len != null ? o.len : B.rr(150, 260)) * k, edge: o.edge ? o.edge * k : o.edge, wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.outline = (p, tool, c, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]), w0 = (o.w != null ? o.w : TT(tool).w) * kwf(tool);
      return B.outline(pts(p), tool, c, Object.assign({}, o, { w: tw(tool, w0, k), pull: (o.pull != null ? o.pull : B.rr(60, 130)) * k, wob: (o.wob != null ? o.wob : 1) * wobK(k) }));
    };
    Z.smudge = (p, o) => { o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]); return B.smudge(pts(p), Object.assign({}, o, { r: Math.max(0.6, (o.r || 8) * k) })); };
    Z.blend = (p, o) => {
      o = o || {}; const c0 = cen(p), k = kAt(c0[0], c0[1]);
      return B.blend(polys(p), Object.assign({}, o, { r: Math.max(0.8, (o.r || 9) * k), len: (o.len || 90) * k, ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : B.rr(-0.9, -0.3)) }));
    };
    Z.ground = (p, c, o) => {
      o = o || {}; const ps = isPolys(p) ? p : [p];
      const rp = o.edge === 0 ? ps : ps.map(q => B.roughen(q, o.edge != null ? o.edge : 1.6, 18, true));
      const c0 = cen(rp), k = kAt(c0[0], c0[1]);
      B.ground(rp.map(pts), c, Object.assign({}, o, { edge: 0, w: tw('side', o.w || 30, k), rub: o.rub === 0 ? 0 : Math.max(0.8, (o.rub || 8) * k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : -0.62) }));
      return rp;
    };
    Z.shape = (p, o) => {
      o = o || {}; const rp = o.rough === 0 ? p : B.roughen(p, o.rough != null ? o.rough : 0.8, 12, true);
      const c0 = cen(rp), k = kAt(c0[0], c0[1]), tool = o.tool || 'pastel', lt = o.lineTool || 'kajal';
      B.shape(pts(rp), Object.assign({}, o, { rough: 0, w: tw(tool, o.w != null ? o.w : TT(tool).w, k), ang: angAt(c0[0], c0[1], o.ang != null ? o.ang : B.rr(-1.2, 1.2)), lw: tw(lt, o.lw != null ? o.lw : TT(lt).w, k), off: (o.off != null ? o.off : 0.5) * k }));
      return rp;
    };
    Z.pushMask = (p, soft) => B.pushMask(polys(p), soft);
    Z.pushMaskOutside = (p, soft) => B.pushMaskOutside(polys(p), soft);
    Z.withMask = (p, fn, soft) => { B.pushMask(polys(p), soft); try { fn(); } finally { B.popMask(); } };
    return Z;
  }
  function wrapM() {
    const names = ['floorWash', 'floorMasked', 'floorCloud', 'floorUnion', 'lampGlow'], keep = {};
    for (const n of names) keep[n] = M[n];
    const invF = (z, f) => (x, y) => { const q = z.inv(x, y); return f(q[0], q[1]); };
    M.floorWash = function (A, poly, c, f, mode) { return A.__z ? keep.floorWash(A.__base, poly.map(q => A.__z.f(q[0], q[1])), c, invF(A.__z, f), mode) : keep.floorWash(A, poly, c, f, mode); };
    M.floorMasked = function (A, poly, f, draw) { return A.__z ? keep.floorMasked(A, poly, invF(A.__z, f), draw) : keep.floorMasked(A, poly, f, draw); };
    M.floorCloud = function (A, poly, c, o) {
      if (!A.__z) return keep.floorCloud(A, poly, c, o);
      o = o || {}; const c0 = cen(poly), k = A.__k(c0[0], c0[1]);
      return keep.floorCloud(A, poly, c, Object.assign({}, o, { scale: (o.scale || 120) * k, g: o.g ? invF(A.__z, o.g) : null }));
    };
    M.floorUnion = function (A, polys, c, k, r, mode, paint) {
      if (!A.__z) return keep.floorUnion(A, polys, c, k, r, mode, paint);
      const z = A.__z, c0 = cen(polys), s = A.__k(c0[0], c0[1]);
      const pp = paint ? Object.assign({}, paint, { ang: A.__ang(c0[0], c0[1], paint.ang != null ? paint.ang : 0.5), len: (paint.len || 26) * s, wid: Math.max(0.6, (paint.wid || 2.2) * s) }) : paint;
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

  /* ================================================================ THE PICTURE */
  P.background = function (A, G, say, opt) {
    opt = opt || {};
    const only = opt.only ? new Set(opt.only) : null, want = n => !only || only.has(n);
    let n = 0;
    const part = name => { if (say) say(name); A.reseed(9001 + (++n) * 7919); };
    G.glints = []; G.lamps = []; G.bells = []; G.darkOps = []; G.__focal = opt.focal || null;
    const restore = wrapM();
    try {
      if (want('paper')) { part('paper'); A.fill(rect(-10, -10, W + 10, H + 10), 'side', TOK.wasli, { w: 40, p: 0.5, passes: 1 }); }
      if (want('sky')) { part('sky'); sky(A, G); }
      if (want('sides')) { part('sides'); sides(A, G); }
      G.levels.forEach(L => { if (want('L' + L.k)) { part('L' + L.k); level(A, G, L); } });
      if (want('tank')) { part('tank'); tank(A, G); }
      if (want('light')) { part('light'); light(A, G); }
      if (want('air')) { part('air'); air(A, G); }
    } finally { restore(); }
  };

  /* ---------------------------------------------------------------- the sky, the rim, the chhatri */
  function sky(A, G) { const Y = Y8('sky'); return Y ? Y(A, G, H8()) : sky0(A, G); }
  function sky0(A, G) {
    A.fill(rect(-10, -10, W + 10, 152), 'side', '#f3dca6', { w: 40, p: 1, passes: 2 });
    M.floorWash(A, rect(-10, 60, W + 10, 152), '#f8ecd0', (x, y) => 0.6 * sstep((y - 60) / 60), 'over');
    // the lapis band along the top, scalloped, with gold rain-cloud curls on its edge
    const scal = [[-10, -10], [W + 10, -10]];
    for (let x = W + 10; x >= -10; x -= 30) scal.push([x, 20 + 5 * Math.sin(x / 30 * PI)]);
    A.fill(scal, 'side', TOK.neel, { w: 18, p: 1, passes: 2 });
    for (let x = 15; x < W; x += 60) A.stroke(A.ellipse(x, 18, 11, 5.5, 0, PI, TAU), 'gold', TOK.sona, { w: 1.6, p: 0.9 });
    for (let i = 0; i < 40; i++) { const x = A.rr(10, W - 10), y = A.rr(4, 14); A.stroke(A.ellipse(x, y, 5, 2.4, 0, 0, PI * 1.6), 'chalk', '#f6efe0', { w: 1, p: 0.85 }); }
    // two Mewar clouds, white curls with gold under them, far out on either side of the sun
    for (const cx of [420, 1500]) for (let i = 0; i < 7; i++) {
      const x = cx + (i - 3) * 22 + A.rr(-4, 4), y = 62 + Math.abs(i - 3) * 3 + A.rr(-2, 2), r = 11 - Math.abs(i - 3) * 1.2;
      A.fill(A.ellipse(x, y, r, r * 0.75, 0, PI, TAU).concat([[x + r, y + 2], [x - r, y + 2]]), 'pastel', '#fbf6ea', { w: 3, p: 1, passes: 2 });
      A.stroke(A.ellipse(x, y, r, r * 0.75, 0, PI * 1.05, PI * 1.95), 'kajal', '#8a7a9a', { w: 0.6, p: 0.6 });
      A.stroke([[x - r, y + 2.5], [x + r, y + 2.5]], 'gold', TOK.sona, { w: 1, p: 0.8 });
    }
    // the sun: a gold disc ringed in vermilion, its rays turning round it
    const S0 = G.SUN;
    for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, r2 = S0.r * (i % 2 ? 1.75 : 2.3); A.stroke([[S0.x + Math.cos(a) * S0.r * 1.12, S0.y + Math.sin(a) * S0.r * 1.12], [S0.x + Math.cos(a) * r2, S0.y + Math.sin(a) * r2]], 'gold', TOK.sona, { w: i % 2 ? 1.4 : 2.2, p: 0.95, tout: 0.6 }); }
    A.fill(A.ellipse(S0.x, S0.y, S0.r * 1.08, S0.r * 1.08), 'pastel', TOK.sindoor, { w: 5, p: 1, passes: 2 });
    A.fill(A.ellipse(S0.x, S0.y, S0.r, S0.r), 'gold', TOK.sona, { w: 5, p: 1, passes: 3 });
    A.withMask(A.ellipse(S0.x, S0.y, S0.r, S0.r), () => { for (let i = 0; i < 9; i++) A.stroke(A.ellipse(S0.x, S0.y, S0.r * (0.3 + i * 0.08), S0.r * (0.3 + i * 0.08)), 'gold', i % 2 ? '#f2d27a' : '#c8962c', { w: 0.6, p: 0.6 }); });
    // the hills and the trees on the rim
    const hill = [[-10, 136]]; for (let x = -10; x <= W + 10; x += 16) hill.push([x, 104 + 9 * Math.sin(x / 80) + 6 * Math.sin(x / 31 + 1)]); hill.push([W + 10, 136]);
    A.fill(hill, 'side', '#c9a4a8', { w: 14, p: 1, passes: 2 });
    M.floorWash(A, hill, '#8a6a8a', (x, y) => 0.3 * sstep((y - 100) / 30), 'mul');
    for (let x = 6; x < W; x += A.rr(18, 28)) {
      if (Math.abs(x - 960) < 70) continue;
      const y = 122 + A.rr(-3, 3), r = A.rr(6, 10), c = A.pick(['#4f8a5b', '#3f6b2a', '#6b8f3a', '#2f5a3a']);
      A.fill(A.ellipse(x, y - r, r, r * 0.95), 'pastel', c, { w: 3, p: 1, passes: 2 });
      M.floorWash(A, A.ellipse(x, y - r, r, r * 0.95), '#1a2a14', (px) => 0.35 * sstep((px - x) / r + 0.2), 'mul');
      for (let k = 0; k < 6; k++) A.dot(x + A.rr(-r, r) * 0.7, y - r + A.rr(-r, r) * 0.7, 'chalk', A.mix(c, '#e8f0b0', 0.4), { w: 1.2, p: 0.7 });
    }
    // the rim: a parapet of little arches, then the deck
    A.fill(G.deck, 'side', '#f0dcb4', { w: 18, p: 1, passes: 2 });
    A.fill(rect(-10, 122, W + 10, 137), 'side', '#ead2a0', { w: 8, p: 1, passes: 2 });
    for (let x = 0; x < W; x += 9) if (Math.abs(x - 960) > 48) A.fill(M.w8Arch(x + 1.5, x + 7.5, 135, 128.5, 125, 3), 'chalk', '#7a5434', { w: 1, p: 0.9, passes: 2, gap: 0.5 });
    A.stroke([[-10, 122.3], [W + 10, 122.3]], 'kajal', '#5a3a1a', { w: 0.6, p: 0.8 });
    A.stroke([[-10, 137], [W + 10, 137]], 'kajal', '#5a3a1a', { w: 0.6, p: 0.8 });
    chhatri(A, G);
  }
  function chhatri(A, G) {
    const C = G.CHHATRI, x = C.x, b = C.base, pal = PAL.y2025, lit = '#fbf6ea', line = pal.line;
    // four pillars and three openings under a chhajja; a ribbed dome; a gold finial reaching into the sun
    const body = rect(x - 40, b - 40, x + 40, b);
    A.fill(body, 'chalk', '#f4ead2', { w: 3, p: 1, passes: 2, gap: 0.45 });
    for (let i = 0; i < 3; i++) {
      const ax = x - 34 + i * 23.5, op = M.w8Arch(ax, ax + 21, b, b - 22, b - 35, 7);
      A.fill(op, 'side', '#3a2212', { w: 3, p: 1, passes: 2 });
      M.floorWash(A, op, '#f0b050', (px, py) => 0.35 * sstep((py - (b - 20)) / 20), 'over');
      A.outline(op.slice(1, -1), 'kajal', line, { w: 0.5, p: 0.85 });
    }
    M.floorWash(A, body, pal.stoneDeep, (px) => 0.3 * sstep((px - x) / 40 + 0.3), 'mul');
    M.w8Eave(A, x - 47, x + 47, b - 42, pal, { th: 3, dp: 3, sh: 5, at: [x - 38, x - 12, x + 12, x + 38] });
    const dome = A.ellipse(x, b - 46, 34, 34, 0, PI, TAU).concat([[x + 34, b - 45], [x - 34, b - 45]]);
    A.fill(dome, 'chalk', lit, { w: 3, p: 1, passes: 2, gap: 0.45 });
    for (let i = 1; i < 8; i++) { const a = PI + i / 8 * PI; A.stroke([[x + Math.cos(a) * 34, b - 46 + Math.sin(a) * 34], [x + Math.cos(a) * 6, b - 78]], 'kajal', A.mix(line, lit, 0.55), { w: 0.4, p: 0.55 }); }
    M.floorWash(A, dome, pal.stoneDeep, (px) => 0.35 * sstep((px - x) / 34 + 0.2), 'mul');
    A.outline(dome.slice(0, -2), 'kajal', line, { w: 0.6, p: 0.85 });
    A.fill(rect(x - 36, b - 47, x + 36, b - 44), 'chalk', '#e8d8b0', { w: 1, p: 1, passes: 2 });
    A.stroke([[x, b - 80], [x, b - 92]], 'gold', TOK.sona, { w: 1.6, p: 1 });
    A.fill(A.ellipse(x, b - 83, 3.4, 2.6), 'gold', TOK.sona, { w: 1.2, p: 1, passes: 2 });
    M.w8Zari(A, x, b - 93, 1.2, { gold: TOK.sona, glints: G.glints });
  }

  /* ---------------------------------------------------------------- the side walls: flights of steps, in shade
     Each side of a level is a wall seen in perspective, running from the back wall toward us.  On it, as in the great
     stepwells, the steps go down in double flights: a peak of stone with a flight on each slope and a small landing on
     top, then a hollow of plain wall between two peaks with a doorway, a niche or a screen in it.  All of it is drawn
     in the wall's own plane (s along the wall from the back corner, y as on the back wall) and carried into the
     picture by sideMap, so the steps crowd together toward the back as real ones do.  The life on them (pots, lamps,
     a dog, washing, a peacock, a kite) is drawn after, upright and at the size the wall has where it stands. */
  function sideMap(L, sd) {
    const c0 = (sd === 'left' ? L.a : L.b) - 960, q = 1 / (2 * Math.abs(c0)), vy = VP[1];
    const g = s => 1 / (1 - s * q);
    return {
      g, Ls: (1 - Math.abs(c0) / 1000) / q,
      f: (s, y) => { const k = g(s); return [960 + c0 * k, vy + (y - vy) * k]; },
      inv: (X, Y) => { const k = (X - 960) / c0; return [(1 - 1 / k) / q, vy + (Y - vy) / k]; },
      J: (s, y) => { const k = g(s), kp = q * k * k; return [c0 * kp, 0, (y - vy) * kp, k]; }
    };
  }
  function sides(A, G) { const Y = Y8('sides'); return Y ? Y(A, G, H8()) : sides0(A, G); }
  function sides0(A, G) {
    const R = STAGE.rng(5150);
    G.levels.forEach(L => {
      const wp = wallPal(L);
      L.sideInfo = {};
      for (const sd of ['left', 'right']) {
        const S = L[sd];
        A.ground(S.quad, STAGE_mix(wp.stone, wp.stoneDeep, 0.45), { w: 22, edge: 0, rub: 7 });
        L.sideInfo[sd] = flights(A, G, L, sd, R);
        // these walls face away from the sun
        M.floorWash(A, S.quad, TOK.chhaya, (x) => 0.12 + 0.1 * sstep(Math.abs(x - 960) / 960), 'mul');
      }
      terrace(A, L, L.terrL, R, 'left');
      terrace(A, L, L.terrR, R, 'right');
    });
    sideLife(A, G);
  }
  function flights(A, G, L, sd, R) {
    const m = sideMap(L, sd), Z = zoom(A, m), wp = wallPal(L), pal = L.pal, top = L.top, foot = L.foot, Hh = foot - top;
    const run = Hh * 0.8, tl = Hh * 0.24, bl = Hh * 0.62, unit = 2 * run + tl + bl, n = Math.max(8, Math.round(Hh / 4.8)), bw = run * 0.32;
    const cMass = STAGE_mix(wp.stoneLit, wp.stone, 0.5), cHol = STAGE_mix(wp.stone, wp.stoneDeep, 0.62);
    const cTread = STAGE_mix(pal.lime, wp.stoneLit, 0.3), cRiser = STAGE_mix(wp.stone, wp.stoneDeep, 0.55), line = pal.line;
    const PZ = Object.assign({}, pal, { stone: cHol, stoneDeep: wp.stoneDeep, frame: STAGE_mix(wp.frame, wp.stoneDeep, 0.3), jali: STAGE_mix(wp.jali, wp.stoneDeep, 0.25), lamps: null, glints: G.glints });
    const info = { m, peaks: [], hollows: [], top, foot, Hh, run, bl, bw };
    const Ls = m.Ls + 30, ph = R.rr(0.05, 0.95) * unit;
    // the rises are never quite even
    const rises = () => { const r = []; let t = 0; for (let i = 0; i < n; i++) { const v = R.rr(0.85, 1.15); r.push(v); t += v; } let c = 0; return [0].concat(r.map(v => (c += v * Hh / t))); };
    const starts = []; for (let s0 = -ph; s0 < Ls; s0 += unit) starts.push(s0);
    // 1. the hollows between the peaks: plain wall going back into the dark, each with a doorway, a niche or a screen
    starts.forEach((s0, k) => {
      const c = s0 + run + tl, d = c + run, e = s0 + unit, f = e + run;
      const hol = [[c, top], [f, top], [e, foot], [d, foot]];
      Z.ground(hol, cHol, { w: 14, edge: 0, rub: 6, c2: STAGE_mix(cHol, wp.stone, 0.3), top: 0.5 });
      Z.withMask(hol, () => {
        for (let y = top + R.rr(3, 8); y < foot; y += Hh * R.rr(0.085, 0.1)) Z.stroke([[c - 5, y], [f + 5, y + R.rr(-0.6, 0.6)]], 'geru', STAGE_mix(line, cHol, 0.55), { w: 0.4, p: 0.45 });
      });
      const sc = (d + e) / 2, w = Math.min(bl * 0.82, Hh * 0.44);
      const kind = sd === 'left' ? (k % 3 === 2 ? 'jali' : 'door') : (k % 2 ? 'niche' : 'jali');
      info.hollows.push({ c, d, e, f, sc, w, kind });
      hollowFeature(Z, PZ, sc, top, foot, w, kind);
      // the ledge above throws its shade down the top of the wall
      M.floorWash(Z, hol, wp.stoneDeep, (x, y) => 0.55 * (1 - sstep((y - top) / (Hh * 0.2))), 'mul');
    });
    // 2. the peaks: the stone mass and its courses, a flight on each slope, the little landing on top
    starts.forEach(s0 => {
      const a = s0, b = a + run, c = b + tl, d = c + run;
      const mass = [[a, foot], [b, top], [c, top], [d, foot]];
      Z.ground(mass, cMass, { w: 14, edge: 0, rub: 6, c2: STAGE_mix(cMass, pal.lime, 0.25), top: 0.5 });
      Z.withMask(mass, () => {
        for (let y = top + R.rr(4, 9); y < foot; y += Hh * R.rr(0.09, 0.11)) {
          Z.stroke([[a - 5, y], [d + 5, y + R.rr(-0.5, 0.5)]], 'geru', STAGE_mix(line, cMass, 0.5), { w: 0.4, p: 0.5 });
          for (let x = a + R.rr(0, 20); x < d; x += R.rr(14, 26)) Z.stroke([[x, y + 0.4], [x + R.rr(-0.4, 0.4), y + Hh * 0.09]], 'geru', STAGE_mix(line, cMass, 0.55), { w: 0.36, p: 0.45 });
        }
      });
      M.floorWash(Z, mass, wp.stoneDeep, (x, y) => 0.32 * sstep((y - top) / Hh), 'mul');
      const up = rises(), dn = rises(), sawU = [], sawD = [], inU = [], inD = [];
      for (let i = 0; i < n; i++) {
        // up the left slope: each step stands out of the slope, its tread lit, its face in shade
        const yT = foot - up[i + 1], yB = foot - up[i], s1 = a + run * up[i] / Hh;
        step(Z, s1, s1 + bw, yT, yB, cTread, cRiser, wp, R);
        sawU.push([s1, yB], [s1, yT]); inU.push([s1 + bw, yB], [s1 + bw, yT]);
        // and down the right one
        const yT2 = top + dn[i], yB2 = top + dn[i + 1], s2 = c + run * dn[i + 1] / Hh;
        step(Z, s2 - bw, s2, yT2, yB2, cTread, cRiser, wp, R);
        sawD.push([s2, yT2], [s2, yB2]); inD.push([s2 - bw, yT2], [s2 - bw, yB2]);
      }
      Z.stroke(sawU, 'kajal', line, { w: 0.42, p: 0.7, wob: 0.6 });
      Z.stroke(sawD, 'kajal', line, { w: 0.42, p: 0.7, wob: 0.6 });
      Z.stroke(inU, 'kajal', STAGE_mix(line, cMass, 0.35), { w: 0.36, p: 0.6, wob: 0.6 });
      Z.stroke(inD, 'kajal', STAGE_mix(line, cMass, 0.35), { w: 0.36, p: 0.6, wob: 0.6 });
      // the landing on top: a slab with a light nose
      Z.fill(rect(b - 2, top - 0.2, c + 2, top + Hh * 0.05), 'chalk', cTread, { w: 1.4, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
      Z.stroke([[b - 2, top + 0.3], [c + 2, top + 0.3]], 'chalk', '#fff6e4', { w: 0.6, p: 0.9 });
      Z.outline([[b - 2, top + Hh * 0.05], [c + 2, top + Hh * 0.05]], 'kajal', line, { w: 0.4, p: 0.7 });
      info.peaks.push({ a, b, c, d, sc: (b + c) / 2, up, dn });
    });
    // the shade of the ledge above lies over the peaks too
    M.floorWash(Z, rect(-20, top, Ls, top + Hh * 0.12), '#1c1220', (x, y) => 0.4 * (1 - sstep((y - top) / (Hh * 0.12))), 'mul');
    return info;
  }
  // one step of a side flight, in the wall's plane: a lit tread over a face in shade, a worn place, now and then a chip
  function step(Z, s0, s1, yT, yB, cTread, cRiser, wp, R) {
    const h = yB - yT, tH = h * R.rr(0.36, 0.46);
    Z.fill(rect(s0, yT, s1, yT + tH), 'chalk', STAGE_mix(cTread, wp.stone, R.rr(0, 0.25)), { w: 1.2, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    Z.fill(rect(s0, yT + tH, s1, yB), 'chalk', STAGE_mix(cRiser, wp.stoneDeep, R.rr(0, 0.22)), { w: 1.2, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    if (R.chance(0.4)) Z.fill(Z.ellipse((s0 + s1) / 2 + R.rr(-2, 2), yT + tH * 0.5, (s1 - s0) * R.rr(0.18, 0.3), tH * 0.32), 'chalk', STAGE_mix(cTread, '#ffffff', 0.35), { w: 0.8, p: 0.55, passes: 1 });
    if (R.chance(0.07)) { const x = R.rr(s0, s1); Z.fill(Z.roughen(rect(x - 1.6, yT, x + 1.6, yT + h * 0.7), 0.4, 1, true), 'chalk', wp.stoneDeep, { w: 0.7, p: 0.9, passes: 2 }); }
  }
  // what is let into the wall of a hollow: a doorway into the dark, a shrine niche, a stone screen
  function hollowFeature(Z, P, sc, top, foot, w, kind) {
    const Hh = foot - top;
    if (kind === 'door') {
      const op = M.w8Arch(sc - w / 2, sc + w / 2, foot, foot - Hh * 0.42, foot - Hh * 0.6, 7), fr = M.w8Arch(sc - w * 0.62, sc + w * 0.62, foot, foot - Hh * 0.42, foot - Hh * 0.66, 0);
      Z.fill(fr, 'chalk', P.frame, { w: 1.6, p: 1, passes: 2, gap: 0.45, ang: 1.3 });
      M.w8Dark(Z, op, P, foot);
      Z.outline(op.slice(1, -1), 'kajal', P.line, { w: 0.5, p: 0.85 });
    } else if (kind === 'niche') {
      const sill = foot - Hh * 0.22, op = M.w8Arch(sc - w * 0.32, sc + w * 0.32, sill, sill - Hh * 0.22, sill - Hh * 0.36, 7), fr = M.w8Arch(sc - w * 0.44, sc + w * 0.44, sill + Hh * 0.03, sill - Hh * 0.22, sill - Hh * 0.42, 0);
      Z.fill(fr, 'chalk', P.frame, { w: 1.4, p: 1, passes: 2, gap: 0.45, ang: 1.3 });
      M.w8Dark(Z, op, P, sill);
      Z.outline(op.slice(1, -1), 'kajal', P.line, { w: 0.45, p: 0.8 });
    } else {
      const sc0 = rect(sc - w * 0.36, top + Hh * 0.28, sc + w * 0.36, top + Hh * 0.62), fr = rect(sc - w * 0.46, top + Hh * 0.24, sc + w * 0.46, top + Hh * 0.66);
      Z.fill(fr, 'chalk', P.frame, { w: 1.4, p: 1, passes: 2, gap: 0.45, ang: 1.3 });
      M.w8JaliScreen(Z, sc0, Object.assign({}, P, { jaliQ: 0.34 }), { fine: true });
      Z.outline(sc0, 'kajal', P.line, { closed: true, w: 0.42, p: 0.75 });
    }
  }
  // a terrace: the floor of a level running out along the side, a cream ledge with a light nose and the shade under it
  function terrace(A, L, tq, R, sd) {
    const pal = L.pal, wp = wallPal(L), bb = A.bbox([tq]);
    A.ground(tq, STAGE_mix(pal.lime, wp.stone, 0.3), { w: 18, edge: 0, rub: 7, c2: STAGE_mix(pal.lime, wp.stoneLit, 0.15), top: 0.5 });
    M.floorCloud(A, tq, STAGE_mix(pal.stoneWarm, wp.stone, 0.3), { scale: 30, seed: R.rr(0, 99), thr: 0.6, soft: 0.3, p: 0.3, w: 5 });
    // slab joints: lines of one depth run level across it, and closer together toward the back
    A.withMask(tq, () => {
      for (let y = bb[1] + R.rr(2, 5), g = 4; y < Math.min(H + 5, bb[3]); y += g, g *= 1.22) A.stroke([[bb[0] - 5, y], [bb[2] + 5, y + R.rr(-0.5, 0.5)]], 'geru', STAGE_mix(pal.line, pal.lime, 0.6), { w: 0.4, p: 0.4 });
    });
    M.floorWash(A, tq, TOK.chhaya, () => 0.26, 'mul');
    const nose = sd === 'left' ? [tq[3], tq[4]] : [tq[1], tq[0]];
    A.stroke(nose, 'chalk', '#fff4e0', { w: 0.9, p: 0.85 });
    A.outline([[nose[0][0], nose[0][1] + 0.9], [nose[1][0], nose[1][1] + 0.9]], 'kajal', pal.line, { w: 0.6, p: 0.8 });
    A.outline(tq.slice(1, 4), 'kajal', pal.line, { w: 0.6, p: 0.7 });
  }
  /* what lives on the side walls.  The two sides are never twins: on the left the household side (water pots, the
     washing, the lamps in the doorways, a dog asleep); on the right the wild side (a peacock, parakeets, a kite that
     came down, creepers, a peepal, the wayside shrines). */
  const LIFE = {
    left: { y2025: ['pots', 'pigeons'], y2023: ['washing', 'lamps'], y2022: ['dog', 'pots', 'lamps'], y2020: ['creeper', 'lamps'], y2019: ['lamps', 'pots'] },
    right: { y2025: ['creeper', 'pigeons'], y2023: ['peacock', 'shrine'], y2022: ['kite', 'shrine'], y2020: ['parrots', 'creeper'], y2019: ['peepal', 'shrine'] }
  };
  const at0 = (m, s, y) => m.f(s, y);
  function sideLife(A, G) {
    const R = STAGE.rng(6262);
    G.levels.forEach(L => {
      for (const sd of ['left', 'right']) {
        const I = L.sideInfo[sd], m = I.m, Hh = I.Hh, pal = L.pal, wp = wallPal(L), P = { lamps: G.lamps, glints: G.glints };
        const K = { line: pal.line, deep: wp.stoneDeep, recess: pal.dark, lit: pal.lime, stone: wp.stone };
        const seen = x => x > 0.04 * m.Ls && x < 0.86 * m.Ls;
        // along the foot of the wall: plants in pots on the household side, a few pigeons on both
        for (let s = m.Ls * R.rr(0.1, 0.2); s < m.Ls * 0.85; s += m.Ls * R.rr(0.14, 0.24)) {
          const q = at0(m, s, I.foot), k = m.g(s);
          if (sd === 'left' && R.chance(0.6)) M.pot(A, q[0], q[1] + 2 * k, 3.2 * k * Hh / 120, R.pick(['tulsi', 'tulsi', 'rose', 'palm']), {});
          else if (R.chance(0.5)) pigeonSit(A, q[0], q[1] + R.rr(3, 9) * k, 6 * k * Hh / 130, R.chance(0.5), R.pick(['#8a93a0', '#9aa0a8', '#eef0f0']));
        }
        const peaks = I.peaks.filter(p => seen(p.sc)), hols = I.hollows.filter(h => seen(h.sc));
        const at = (s, y) => m.f(s, y), g = s => m.g(s);
        for (const what of LIFE[sd][L.id]) {
          if (what === 'pigeons') for (const p of peaks) for (let i = 0; i < 3; i++) { const s = p.sc + R.rr(-0.4, 0.4) * (p.c - p.b), q = at(s, I.top); pigeonSit(A, q[0], q[1] - 0.4, 6.5 * g(s) * Hh / 130, R.chance(0.5), R.pick(['#8a93a0', '#9aa0a8', '#eef0f0'])); }
          if (what === 'pots') {
            // pots carried part way and left on the steps, and a pair by a doorway
            for (const p of peaks.slice(0, 2)) for (let i = 3; i < 6; i += R.ri(1, 2)) {
              const s = p.a + I.run * p.up[i + 1] / Hh + I.bw * R.rr(0.25, 0.6), y = I.foot - p.up[i + 1], q = at(s, y);
              M.w8Matka(A, q[0], q[1] + 0.2, Hh * 0.075 * g(s), R.pick(['#b8602e', '#a04a26', '#c87a3a']), { cloth: R.chance(0.3) ? '#c4301c' : null });
            }
            for (const h of hols.slice(0, 1)) for (const dx of [0.75, 0.95]) { const s = h.sc + h.w * dx, q = at(s, I.foot); M.w8Matka(A, q[0], q[1], Hh * 0.09 * g(s), R.pick(['#b8602e', '#a04a26']), {}); }
          }
          if (what === 'lamps') {
            for (const h of hols) if (h.kind === 'door') { const s = h.sc, q = at(s, I.foot); M.lampGlow(A, q[0], q[1] - Hh * 0.1 * g(s), h.w * 0.5 * g(s), 0.75, {}); M.w8Lamp(A, q[0], q[1] - 0.3, Hh * 0.06 * g(s), P, true); }
            for (const p of peaks) { const q = at(p.sc, I.top); M.w8Lamp(A, q[0], q[1] - 0.3, Hh * 0.05 * g(p.sc), P, true); }
          }
          if (what === 'washing') {
            const h = hols.find(h => h.sc > m.Ls * 0.15) || hols[0];
            if (h) {
              const y = I.top + Hh * 0.2, a = at(h.c + I.run * 0.22, y), b = at(h.f - I.run * 0.22, y);
              M.w8Washing(A, a, b, Hh * 0.08 * g(h.sc), Hh * 0.32 * g(h.sc), ['#c4301c', '#e6b422', '#2a6aa0', '#e8607a', '#f2ead8', '#3f9c58']);
            }
          }
          if (what === 'dog') {
            const h = hols.find(h => h.sc > m.Ls * 0.2) || hols[0];
            if (h) { const s = h.sc + h.w * 0.9, q = at(s, I.foot); M.w8Dog(A, q[0], q[1] - 0.4, Hh * 0.3 * g(s), sd === 'left'); }
          }
          if (what === 'creeper') for (const h of hols) for (let i = 0; i < 4; i++) {
            const s = h.c + (h.f - h.c) * (0.15 + i * 0.22) + R.rr(-4, 4), q = at(s, I.top), k = g(s);
            M.wellCreeper(A, q[0], q[1] + 1, Hh * k * R.rr(0.3, 0.7), K, { seed: R.rr(0, 99) });
            for (let j = 0; j < 14; j++) A.dot(q[0] + R.rr(-8, 8) * k, q[1] + R.rr(-2, 6) * k, 'chalk', R.pick(['#c2304e', '#d23c6a', '#e8607a', '#3f6b2a', '#4f7d30']), { w: R.rr(1.4, 2.4) * k, p: 1 });
          }
          if (what === 'peacock') { const p = peaks[Math.min(1, peaks.length - 1)]; if (p) { const q = at(p.sc, I.top); M.peacockPerched(A, q[0], q[1] - 0.5, Hh * 0.11 * g(p.sc), { flip: sd === 'right' }); } }
          if (what === 'parrots') { const p = peaks[0]; if (p) { const q = at(p.sc, I.top), k = g(p.sc); M.parrot(A, q[0] - 6 * k, q[1] - 0.4, Hh * 0.1 * k, { pose: 'perch', flip: false }); M.parrot(A, q[0] + 6 * k, q[1] - 0.4, Hh * 0.095 * k, { pose: 'perch', flip: true }); } }
          if (what === 'kite') { const p = peaks[peaks.length - 1]; if (p) { const q = at(p.sc, I.top + Hh * 0.18), k = g(p.sc); M.kite(A, q[0], q[1], Hh * 0.2 * k, M.kiteIds ? M.kiteIds[2] : 'x', { rot: 0.5, short: false }); } }
          if (what === 'peepal') { const h = hols[0]; if (h) { const q = at(h.sc, I.top + Hh * 0.5); M.wellPeepal(A, q[0], q[1], Hh / 110 * g(h.sc), K); } }
          if (what === 'shrine') for (const h of hols) if (h.kind === 'niche') {
            const s = h.sc, k = g(s), q = at(s, I.foot - Hh * 0.22);
            M.lampGlow(A, q[0], q[1] - Hh * 0.08 * k, h.w * 0.4 * k, 0.8, {});
            A.fill(A.ellipse(q[0] - h.w * 0.06 * k, q[1] - Hh * 0.04 * k, Hh * 0.035 * k, Hh * 0.045 * k), 'pastel', TOK.sindoor, { w: Math.max(0.5, k), p: 1, passes: 2 });
            M.w8Lamp(A, q[0] + h.w * 0.1 * k, q[1] - 0.2, Hh * 0.05 * k, P, true);
            for (let i = 0; i < 5; i++) A.dot(q[0] + R.rr(-h.w * 0.2, h.w * 0.2) * k, q[1] - 0.3, 'chalk', R.pick(['#e88e1e', '#f6efe0', '#d77f86']), { w: 1.1 * k, p: 1 });
          }
        }
      }
    });
  }

  /* ---------------------------------------------------------------- one level */
  // the wall of a level in its full colour; the pillars, eaves and floors stay cream
  function wallPal(L) { return Object.assign({}, L.pal, WALL[L.id]); }
  function level(A, G, L) {
    // gold leaf is kept for the focal objects: everywhere else the gold is painted, matte yellow ochre (see LEAF)
    const pal = Object.assign({ glints: G.glints, lamps: G.lamps, bells: G.bells, darkOps: G.darkOps, matte: true }, L.pal), wp = wallPal(L);
    // the bays are framed and screened in the wall's own lighter tones; a gilded niche gets a ground that stands off it
    const bayP = Object.assign({}, pal, { stone: wp.stone, stoneLit: wp.stoneLit, stoneWarm: wp.stoneWarm, frame: wp.frame, jali: wp.jali, jaliQ: 0.32, ground: wp.halo });
    const deepP = Object.assign({}, pal, { stoneDeep: wp.stoneDeep });
    const x0 = L.a, x1 = L.b, shw = stairHW((L.top + L.foot) / 2);
    // 1. the wall's stone in the level's colour
    M.w8Stone(A, rect(x0, L.top, x1, L.foot), wp, { course: L.h * 0.085 });
    // the painter's geru guide lines for the bays, laid first and left showing where the colour skips
    for (const b of L.bays) A.stroke([[b.x0, L.arT - 1], [b.x0 + A.rr(-0.6, 0.6), L.arB + 1]], 'geru', A.mix(TOK.geru, wp.stone, 0.3), { w: 0.4, p: 0.55 });
    // 2. the bays
    const t0 = G.obj && G.obj.tank, mouths = t0 ? M.wellSpoutPts(0, t0.yT).map(p => [t0.x + p[0] * t0.kx, t0.yb + p[1] * t0.ky]) : [];
    const jc = { '-1': 0, '1': 0 };
    for (const b of L.bays) {
      if (b.kind === 'pavilion') continue;
      if (b.kind === 'iwan') { iwan(A, L, b, wp, pal); continue; }
      if (b.kind === 'hall') { b.at = hall(A, L, b, wp, pal); continue; }
      const bb = { x0: b.x0 + L.pw * 0.55, x1: b.x1 - L.pw * 0.55, yt: L.arT, yb: L.arB }, w = bb.x1 - bb.x0;
      // the wall the spouts are set in is a deep green-black recess, so the water and the cream stone read against it
      if (b.kind === 'spoutwall') { M.w8SpoutWall(A, b, L, Object.assign({}, bayP, { stone: '#142620', lime: '#2c3c34', stoneWarm: '#1c342c', stoneDeep: '#0a1410' }), mouths); continue; }
      const o = { motif: MOTIFS[(b.i + L.k + (b.side > 0 ? 3 : 0)) % MOTIFS.length], parrots: b.ch === 'K' || (b.ch === 'k' && b.i % 3 === 1), lit: L.k >= 2 || b.i % 3 === 0 };
      if (b.kind === 'jali') { jc[b.side]++; o.broken = BROKEN.some(q => q[0] === L.k && q[1] === b.side && q[2] === jc[b.side]); }
      if (b.kind === 'panel') o.paint = (a, c, d, e) => miniature(A, a, c, d, e, o.motif, pal, L);
      if (b.kind === 'torana') {
        // the door the thread is tied across: a focal object, so its frame takes gold leaf and a heavier line
        x8ground(A, G, 'joined', sheetZ(A), { bb, L, wp, pal, bayP });
        focal(A, G, 'joined', () => {
          if (X8('joined')) { const Z = sheetZ(A); X8('joined').draw(Z, x8o(Z, G, { bb, L, wp, pal, bayP })); return; }
          const Z = zoom(A, scaleMap(1, 0, 0), { kw: 1.6 }), info = M.w8Bay(Z, bb, 'door', Object.assign({}, bayP, { matte: false, gold: TOK.zari }), { lobes: 11 });
          M.w8Toran(Z, bb.x0 + w * 0.12, bb.x1 - w * 0.12, info.ya + (info.ys - info.ya) * 0.25, w * 0.045, pal);
          M.w8Thread(Z, bb.x0 + w * 0.1, bb.x1 - w * 0.1, info.ys + (L.arB - info.ys) * 0.12, w * 0.05);
          // two parakeets meeting on the head of the frame
          M.parrot(A, info.xc - w * 0.13, info.ya + 1.2, w * 0.2, { pose: 'perch', flip: false });
          M.parrot(A, info.xc + w * 0.13, info.ya + 1.6, w * 0.19, { pose: 'perch', flip: true });
          M.w8DoorDetail(A, { x0: bb.x0, x1: bb.x1, xc: info.xc, ya: info.ya, ys: info.ys, ty: info.ya + (info.ys - info.ya) * 0.25, yb: L.arB }, { glint: (x, y) => G.glints.push([x, y]), lamp: (x, y) => G.lamps.push([x, y]), bell: (x, y, s) => G.bells.push([x, y, s]) });
        });
        continue;
      }
      M.w8Bay(A, bb, b.kind, bayP, o);
    }
    // 3. pillars between the bays (not where a pavilion stands, it has its own), the frieze, the eave, the dado
    const pav = L.bays.filter(b => b.kind === 'pavilion'), inPav = x => pav.some(p => x > p.x0 - 1 && x < p.x1 + 1);
    const edges = [...new Set(L.bays.flatMap(b => [r1(b.x0), r1(b.x1)]))].filter(x => Math.abs(x - 960) > shw + 3).sort((a, b) => a - b);
    for (const x of edges) if (!inPav(x)) M.w8Pillar(A, x, L.arT, L.arB, L.pw, pal);
    M.w8Frieze(A, x0, x1, L.fr0, L.fr1, L.frieze, pal);
    // under the ledge of the level above, the wall goes dark
    M.floorWash(A, rect(x0, L.eaveY + 3, x1, L.eaveY + 3 + L.h * 0.16), wp.stoneDeep, (x, y) => 0.4 * (1 - sstep((y - L.eaveY - 3) / (L.h * 0.16))), 'mul');
    M.w8Eave(A, x0, x1, L.eaveY, deepP, { at: edges, th: 3.6, dp: 5, sh: L.h * 0.07 });
    if (L.k === 1) for (const bx of edges) if (!inPav(bx)) M.w8Bell(A, bx, L.eaveY + 3.6 + 5.6, 1.15, pal);
    M.w8Dado(A, x0, x1, L.arB, L.foot, Object.assign({}, pal, { stone: wp.stone, stoneDeep: wp.stoneDeep, lime: STAGE_mix(pal.lime, wp.stone, 0.3) }));
    // 4. the pavilions beside the stair, standing out from the wall
    for (const p of pav) M.w8Pavilion(A, p.x0, p.x1, L, pal, { room: L.k === 1 ? 'gold' : L.k >= 4 ? 'dark' : 'ground' });
    // 5. the landing, the stair, what stands on the landing, the petals that have come to rest
    M.w8Floor(A, x0, x1, L.foot, L.land, Object.assign({}, deepP, { lime: STAGE_mix(pal.lime, wp.stone, 0.18) }));
    stairPart(A, G, L.top - 4, L.land, pal);
    THINGS[L.id](A, G, L, pal);
    landingPetals(A, L);
  }

  // the stair: each tread its own stone and worn in the middle, the risers in shade, a parapet on either side
  function stairPart(A, G, y0, y1, pal) { const Y = Y8('stair'); return Y ? Y(A, G, y0, y1, pal, H8()) : stairPart0(A, G, y0, y1, pal); }
  function stairPart0(A, G, y0, y1, pal) {
    const poly = [[960 - stairHW(y0), y0], [960 + stairHW(y0), y0], [960 + stairHW(y1), y1], [960 - stairHW(y1), y1]];
    A.fill(poly, 'side', A.mix(pal.lime, pal.stone, 0.3), { w: 8, p: 1, reach: 1.5, passes: 2, ang: 0.03 });
    const step = 5.6;
    for (let y = y0 + 1; y < y1 - 0.5; y += step) {
      const hw = stairHW(y), yn = y + step * 0.55;
      A.fill(rect(960 - hw, y, 960 + hw, yn), 'chalk', A.mix(pal.lime, pal.stoneWarm, A.rr(0, 0.4)), { w: 1.3, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
      A.fill(A.ellipse(960 + A.rr(-3, 3), y + step * 0.28, hw * 0.42, step * 0.16), 'chalk', A.mix(pal.lime, '#ffffff', 0.4), { w: 0.9, p: 0.6, passes: 1 });
      const riser = rect(960 - hw, yn, 960 + hw, y + step);
      A.fill(riser, 'chalk', A.mix(pal.stone, pal.stoneDeep, A.rr(0.4, 0.55)), { w: 1.3, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
      M.floorWash(A, riser, pal.line, (x) => 0.3 * sstep((Math.abs(x - 960) - hw * 0.45) / (hw * 0.55)), 'mul');
      A.stroke([[960 - hw, yn], [960 + hw, yn]], 'chalk', '#fffaf0', { w: 0.6, p: 0.9, tin: 0, tout: 0 });
      A.outline([[960 - hw, yn + 0.5], [960 + hw, yn + 0.5]], 'kajal', A.mix(pal.line, pal.stone, 0.35), { w: 0.32, p: 0.55, pull: 40 });
      if (A.chance(0.12)) M.w8Chip(A, 960 + A.rr(-hw * 0.8, hw * 0.8), yn + 0.4, A.rr(0.6, 1.2), pal);
    }
    for (const sg of [-1, 1]) {
      const par = [[960 + sg * stairHW(y0), y0], [960 + sg * (stairHW(y0) + 5), y0], [960 + sg * (stairHW(y1) + 5), y1], [960 + sg * stairHW(y1), y1]];
      A.fill(par, 'chalk', pal.lime, { w: 1.6, p: 1, passes: 2, gap: 0.45, ang: 1.5 });
      M.floorWash(A, par, pal.stoneDeep, () => sg > 0 ? 0.32 : 0.08, 'mul');
      A.stroke([[960 + sg * (stairHW(y0) + 1.2), y0], [960 + sg * (stairHW(y1) + 1.2), y1]], 'chalk', '#fffaf0', { w: 0.6, p: 0.8 });
      A.outline(par, 'kajal', pal.line, { closed: true, w: 0.45, p: 0.75 });
    }
  }

  // a panel painting, drawn through a map at three times its size so every line keeps its weight
  function miniature(A, x0, y0, x1, y1, motif, pal) {
    const k = 1 / 3, Z = zoom(A, scaleMap(k, x0, y0));
    M.w8Miniature(Z, 0, 0, (x1 - x0) / k, (y1 - y0) / k, motif, pal, {});
  }

  function pigeons(A, L, n, seed, avoid) { const Y = Y8('pigeons'); return Y ? Y(A, L, n, seed, avoid, H8()) : pigeons0(A, L, n, seed, avoid); }
  function pigeons0(A, L, n, seed, avoid) {
    const R = STAGE.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = R.rr(L.a + 10, L.b - 10); if (Math.abs(x - 960) < 60 || (avoid && avoid(x))) continue;
      pigeonSit(A, x, L.top - 1, R.rr(6.5, 8) * L.h / 130, R.chance(0.5), R.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#a8aeb4']));
    }
  }
  function landingLamps(A, L, pal, every, avoid) {
    for (const b of L.bays) if (b.i % every === 0 && b.kind !== 'pavilion') {
      const x = b.side < 0 ? b.x0 : b.x1; if (avoid && avoid(x)) continue;
      M.w8Lamp(A, x, L.land - 3, 5 * L.h / 130, pal, true);
    }
  }
  /* ---------------------------------------------------------------- the focal objects, and how they are made to stand out
     A focal object gets, by the painter's means only: a quiet ground kept behind it (iwan, hall), the colour of the
     bays round it let down (hush), a heavier kajal line (zoom kw), and gold leaf, which nothing else in the well has
     (leaf).  Each is drawn from its own seed through focal(), so it comes out the same whether it is painted into the
     sheet or cut out on its own. */
  const SEED = { sidekick: 101, 'rule-builder': 202, joined: 303, portfolio: 404, pragyan: 505, hackathons: 606, 'delta-force': 707, 'nit-trichy': 808 };
  function focal(A, G, id, draw) {
    const run = () => { A.reseed(91000 + SEED[id]); draw(); };
    if (G.__focal) { G.__focal(id, run); return; }
    /* on the sheet at dusk and night only: which pixels are the object's own, found as the change its draw makes in its
       box (grown 16 units, within the clip), softened a pixel or two.  Kept in sheet pixels as G.focalMask[id], so the
       light pass can light the object and not the wall round it.  Nothing is read or kept by day. */
    if (G.focalMask) delete G.focalMask[id];
    const b = G.mood && G.mood !== 'day' && G.hot && G.hot[id];
    if (!b) { run(); return; }
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, pad = 16;
    const X0 = Math.max(cx0, Math.floor((b[0] - pad) * S)), X1 = Math.min(cx1, Math.ceil((b[0] + b[2] + pad) * S));
    const Y0 = Math.max(cy0, Math.floor((b[1] - pad) * S)), Y1 = Math.min(cy1, Math.ceil((b[1] + b[3] + pad) * S));
    if (X1 <= X0 || Y1 <= Y0) { run(); return; }
    const w = X1 - X0, h = Y1 - Y0, W = A.W, R = A.R, Gc = A.G, B = A.B, keep = new Float32Array(w * h * 3);
    for (let j = 0, q = 0; j < h; j++) for (let o = (Y0 + j) * W + X0, e = o + w; o < e; o++, q += 3) { keep[q] = R[o]; keep[q + 1] = Gc[o]; keep[q + 2] = B[o]; }
    run();
    let a = new Float32Array(w * h);
    for (let j = 0, q = 0, k = 0; j < h; j++) for (let o = (Y0 + j) * W + X0, e = o + w; o < e; o++, q += 3, k++) {
      const dr = Math.abs(R[o] - keep[q]), dg = Math.abs(Gc[o] - keep[q + 1]), db = Math.abs(B[o] - keep[q + 2]);
      a[k] = sstep(((dr > dg ? (dr > db ? dr : db) : (dg > db ? dg : db)) - 0.012) / 0.05);
    }
    // softened: a box a pixel or two across, along the rows and then down the columns
    const rad = S >= 3 ? 2 : 1, n = 2 * rad + 1, t = new Float32Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let s = 0; for (let u = -rad; u <= rad; u++) { const ii = i + u; s += a[j * w + (ii < 0 ? 0 : ii >= w ? w - 1 : ii)]; } t[j * w + i] = s / n; }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let s = 0; for (let u = -rad; u <= rad; u++) { const jj = j + u; s += t[(jj < 0 ? 0 : jj >= h ? h - 1 : jj) * w + i]; } a[j * w + i] = s / n; }
    (G.focalMask = G.focalMask || {})[id] = { X0, Y0, w, h, a, S };
  }
  // gold leaf: a burnished line that catches the sun; every touch is also a glint the page can make twinkle
  function leaf(Z, pts, w, G) {
    Z.stroke(pts, 'gold', TOK.zari, { w, p: 1, tin: 0.04, tout: 0.08 });
    if (G) { const m = pts[(pts.length / 2) | 0]; G.glints.push(Z.__pt ? Z.__pt(m) : m); }
  }
  function leafDot(Z, x, y, w, G) { Z.dot(x, y, 'gold', TOK.zari, { w, p: 1 }); if (G) G.glints.push(Z.__pt ? Z.__pt([x, y]) : [x, y]); }
  // a repainted object (src/m-w8x-<id>.js) takes the place of the old one: M.w8x[id] = { draw(Z, o), ground?(Z, o) }.
  // Z is the object's own frame (the same one the old motif used); draw() is the object only, cut out for the card;
  // ground() is what it puts on the wall behind and under it (its shadow, a cloth, a niche), painted with the sheet.
  // W8X=a,b (node only) limits the swap to those ids, so a painter testing one object is not hurt by another's half-done file
  // a repainted part of the well itself (src/m-w8y-<part>.js) takes the place of the old one the same way: M.w8y[hook] is
  // called with the old arguments and then H8(), the stage's own helpers and its old painters (H8().old).  The hooks:
  // sky (sky, hills, rim, chhatri), sides (the side walls and their life), stair (one level's run of the stair),
  // petals (one level's landing), pigeons (one level's eave), iwan and hall (the quiet grounds; hall returns the tie
  // points), water (the tank at the foot), air (the flock and the falling petals).  A hook may carry .part, the name
  // its painter tests it under; W8Y=a,b (node only) limits the swap to those parts.  Also light (the light over
  // everything, by G.mood: 'day', 'dusk' or 'night') and glow (after it: the lamps lit, G.lamps)
  const Y8 = id => { const f = M.w8y && M.w8y[id]; if (!f) return null; const only = typeof process !== 'undefined' && process.env && process.env.W8Y; return only && !only.split(',').includes(f.part || id) ? null : f; };
  const X8 = id => { const only = typeof process !== 'undefined' && process.env && process.env.W8X; return only && !only.split(',').includes(id) ? null : (M.w8x && M.w8x[id]) || null; };
  const x8o = (Z, G, o) => Object.assign({ G, T, TOK, leaf: (pts, w) => leaf(Z, pts, w, G), leafDot: (x, y, w) => leafDot(Z, x, y, w, G), glint: (x, y) => G.glints.push(Z.__pt([x, y])), lamp: (x, y) => G.lamps.push(Z.__pt([x, y])), bell: (x, y, sz) => G.bells.push(Z.__pt([x, y]).concat([sz])) }, o);
  const doveZ = (A, G) => { const d = G.obj.dove; return zoom(A, place(d.x, d.yb, d.k, 0, 0), { kw: 1.7 }); };
  const loomZ = (A, G) => { const lm = G.obj.loom; return zoom(A, place(lm.x, lm.yb, lm.k, 0, 0), { kw: 1.6 }); };
  const kundZ = (A, G) => { const kd = G.obj.kund; return zoom(A, place(kd.x, kd.yb, kd.k, 0, 0), { kw: 1.6 }); };
  const sheetZ = (A, kw) => zoom(A, scaleMap(1, 0, 0), { kw: kw || 1.6 });
  const cupsZ = (A, G) => { const c = G.obj.cups; return zoom(A, place(c.x, c.yb, c.k, 0, 0), { kw: 1.6 }); };
  function x8ground(A, G, id, Z, o) { const X = X8(id); if (X && X.ground) { A.reseed(92000 + SEED[id]); X.ground(Z, x8o(Z, G, o)); return true; } return false; }
  // the colour round an object let down: the bays near it go toward grey, a little darker, most at its edge
  function hush(A, b, k, skip) {
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rx = b[2] * 0.9 + 30, ry = b[3] * 0.75 + 20;
    const X0 = Math.max(cx0, Math.floor((cx - rx) * S)), X1 = Math.min(cx1, Math.ceil((cx + rx) * S)), Y0 = Math.max(cy0, Math.floor((cy - ry) * S)), Y1 = Math.min(cy1, Math.ceil((cy + ry) * S));
    for (let Y = Y0; Y < Y1; Y++) {
      const dy = ((Y + 0.5) / S - cy) / ry;
      for (let X = X0; X < X1; X++) {
        const dx = ((X + 0.5) / S - cx) / rx, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 1) continue;
        if (skip) { const x = (X + 0.5) / S, y = (Y + 0.5) / S; if (x > skip[0] && x < skip[0] + skip[2] && y > skip[1] && y < skip[1] + skip[3]) continue; }
        const t = k * (1 - sstep((d - 0.4) / 0.6)), i = Y * A.W + X, r = A.R[i], g = A.G[i], bl = A.B[i], l = 0.3 * r + 0.59 * g + 0.11 * bl, dk = 1 - 0.1 * t;
        A.R[i] = (r + (l - r) * t) * dk; A.G[i] = (g + (l - g) * t) * dk; A.B[i] = (bl + (l - bl) * t) * dk;
      }
    }
  }
  // the dark behind a light object, in each level's own key: indigo under the saffron, aubergine under the vermilion,
  // the night sky through an open bay under the malachite, night blue under the lapis
  const INTERIOR = {
    y2025: { side: '#232a5c', far: '#1a1f48', floor: '#3a3050', deep: '#0e1028', pattern: '#4a5490', lampSide: -0.4, lampH: 0.4 },
    y2022: { side: '#3a1a34', far: '#2a1228', floor: '#4a2430', deep: '#160a14', pattern: '#6a3a5a', lampSide: 0.44, lampH: 0.5 },
    y2020: { sky: true, side: '#1e4a48', far: '#071a1e', deep: '#04110f' },
    y2019: { side: '#162050', far: '#0e163a', floor: '#24305a', deep: '#080c22', pattern: '#3a4a8a' } };
  // a quiet bay: plain plaster in the wall's own colour let down, and for a light object one deep arch behind it
  function iwan(A, L, b, wp, pal) { const Y = Y8('iwan'); return Y ? Y(A, L, b, wp, pal, H8()) : iwan0(A, L, b, wp, pal); }
  function iwan0(A, L, b, wp, pal) {
    const x0 = b.x0 + L.pw * 0.55, x1 = b.x1 - L.pw * 0.55, yt = L.arT, yb = L.arB, w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2, R = STAGE.rng(Math.round(b.x0 * 7));
    const plain = b.quiet === 'plain', pl = plain ? STAGE_mix(pal.lime, wp.stone, 0.24) : STAGE_mix(wp.stone, '#8a7c70', 0.28), face = rect(x0, yt, x1, yb);
    A.ground(face, pl, { w: 16, edge: 0, rub: 7, c2: STAGE_mix(pl, pal.lime, 0.18), top: 0.5 });
    M.floorCloud(A, face, STAGE_mix(pl, wp.stoneDeep, 0.22), { scale: 46, seed: R.rr(0, 99), thr: 0.6, soft: 0.3, p: 0.22, w: 8 });
    // the courses of the plaster just show, and a few old repairs
    A.withMask(face, () => { for (let y = yt + R.rr(4, 9); y < yb; y += h * R.rr(0.16, 0.2)) A.stroke([[x0 - 2, y], [x1 + 2, y + R.rr(-0.5, 0.5)]], 'geru', STAGE_mix(pal.line, pl, 0.62), { w: 0.4, p: 0.35 }); });
    if (!plain) {
      const ow = Math.min(w * 0.88, b.ow || w * 0.7), ys = yt + h * 0.3, ya = yt + h * 0.05;
      const fr = M.w8Arch(xc - ow / 2 - 3, xc + ow / 2 + 3, yb, ys, ya - 3, 0), op = M.w8Arch(xc - ow / 2, xc + ow / 2, yb, ys, ya, 9);
      A.fill(fr, 'chalk', STAGE_mix(wp.frame, '#9a8c7c', 0.3), { w: 2, p: 0.95, passes: 2, gap: 0.5, ang: 1.2 });
      const K = INTERIOR[L.id] || INTERIOR.y2019;
      const room = M.w8Interior(A, xc, ow, yb, ys, ya, { key: K, sky: !!K.sky, lobes: 9, line: pal.line, lampSide: K.lampSide, lampH: K.lampH, lamps: pal.lamps });
      if (pal.darkOps) pal.darkOps.push(room);
      A.outline(fr.slice(1, -1), 'geru', STAGE_mix(pal.line, pl, 0.4), { closed: false, w: 0.45, p: 0.6 });
    }
    A.outline(face, 'geru', STAGE_mix(pal.line, pl, 0.5), { closed: true, w: 0.45, p: 0.5 });
  }
  /* the festival hall: a run of arches open into a dark room, slim pillars between them; returns where the cords are tied */
  function hall(A, L, b, wp, pal) { const Y = Y8('hall'); return Y ? Y(A, L, b, wp, pal, H8()) : hall0(A, L, b, wp, pal); }
  function hall0(A, L, b, wp, pal) {
    const x0 = b.x0 + L.pw * 0.55, x1 = b.x1 - L.pw * 0.55, yt = L.arT, yb = L.arB, w = x1 - x0, h = yb - yt;
    const n = Math.max(3, Math.round(w / 68)), pw = L.pw * 0.7, pl = STAGE_mix(wp.stone, '#7a6a60', 0.3), at = [b.x0];
    A.ground(rect(x0, yt, x1, yb), pl, { w: 16, edge: 0, rub: 7, c2: STAGE_mix(pl, wp.stoneDeep, 0.2), top: 0.5 });
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w / n + pw * 0.6, c = x0 + (i + 1) * w / n - pw * 0.6, ys = yt + h * 0.26, op = M.w8Arch(a, c, yb, ys, yt + h * 0.04, 9);
      A.ground(op, '#120806', { w: 10, edge: 0, rub: 5, c2: '#1e0f0a', top: 0.6 });
      M.floorWash(A, op, '#3c2014', (x, y) => 0.45 * sstep((y - ys) / (yb - ys)), 'over');
      A.outline(op.slice(1, -1), 'kajal', pal.line, { closed: false, w: 0.55, p: 0.85, pull: 30 });
    }
    for (let i = 1; i < n; i++) { const px = x0 + i * w / n; M.w8Pillar(A, px, yt, yb, pw, pal); at.push(px); }
    at.push(b.x1);
    return at;
  }

  // the shadow a motif throws on the wall is painted with the wall, not with the object, so a cut-out does not carry it
  const SHADOW = '#8a5a2c';
  function noShadow(Z, c0) { const sh = c0 || SHADOW, Q = Object.create(Z); Q.fill = (p, tool, c, o) => tool === 'side' && c === sh ? undefined : Z.fill(p, tool, c, o); return Q; }
  function wallShadows(A, G) {
    const d = G.obj.dove, s = 0.94, lm = G.obj.loom;
    const doveOwn = x8ground(A, G, 'sidekick', doveZ(A, G), { s });
    if (!doveOwn) M.w8DoveFloor(zoom(A, place(d.x, d.yb, d.k, 0, 0)), s);
    if (G.darkOps.length) A.pushMaskOutside(G.darkOps);
    if (!doveOwn) zoom(A, place(d.x, d.yb, d.k, 0, 0)).fill([[-30, 0], [30, 0], [80, -96], [110, -340], [20, -360]].map(p => [p[0] * s + 16, p[1] * s]), 'side', SHADOW, { w: 14, p: 0.28, passes: 1, ang: -1 });
    if (!X8('rule-builder')) zoom(A, place(lm.x, lm.yb, lm.k, 0, 0)).fill([[-120, -4], [130, -4], [170, -230], [-80, -286]].map(p => [p[0] + 18, p[1] + 2]), 'side', SHADOW, { w: 16, p: 0.22, passes: 1, ang: -0.9 });
    if (G.darkOps.length) A.popMask();
  }
  // the dovecote (Sidekick): cream, so it stands in front of a deep arch
  function drawDove(A, G) {
    const d = G.obj.dove, s = 0.94, Z = doveZ(A, G), P = (u, v) => [u * s, v * s];
    if (X8('sidekick')) return X8('sidekick').draw(Z, x8o(Z, G, { s }));
    M.wellDovecote(noShadow(Z), 0, 0, s, T);
    M.w8DoveDetail(Z, s, { glint: (x, y) => G.glints.push(Z.__pt([x, y])) });
    leaf(Z, [P(-86, -339), P(86, -339)], 2, G);
    leaf(Z, [P(-79, -122), P(79, -122)], 1.8, G);
    for (const u of [-71, 71]) leaf(Z, [P(u, -328), P(u, -132)], 1.5, G);
    for (let r = 0; r < 5; r++) for (const hx of [-34, 34]) leafDot(Z, hx * s, (-138 - 40 * r - 35) * s, 4, G);
  }
  // the loom (Rule Builder): dark wood, so it stands in front of a plain pale panel
  function drawLoom(A, G) {
    const lm = G.obj.loom, Z = loomZ(A, G);
    if (X8('rule-builder')) return X8('rule-builder').draw(Z, x8o(Z, G, {}));
    M.wellLoom(noShadow(Z), 0, 0, 1, T);
    leaf(Z, [[-124, -272.5], [124, -272.5]], 1.8, G);
    leaf(Z, [[-124, -79.5], [124, -79.5]], 1.4, G);
    for (const sg of [-1, 1]) leafDot(Z, sg * 118, -288, 10, G);
    M.w8LoomDetail(Z, { glint: (x, y) => G.glints.push(Z.__pt([x, y])) });
  }
  // the spouts and the tank (Portfolio)
  const tankZ = (A, G) => { const t = G.obj.tank; return zoom(A, { f: (x, y) => [t.x + x * t.kx, t.yb + y * t.ky], inv: (X, Y) => [(X - t.x) / t.kx, (Y - t.yb) / t.ky], J: () => [t.kx, 0, 0, t.ky] }, { kw: 1.6 }); };
  function drawTank(A, G) {
    const t = G.obj.tank, Zt = tankZ(A, G);
    if (X8('portfolio')) return X8('portfolio').draw(Zt, x8o(Zt, G, { yT: t.yT }));
    M.wellSpouts(noShadow(Zt, '#7a4a24'), 0, t.yT, T);
    M.wellTank(noShadow(Zt, '#7a4a24'), 0, t.yT, 270, 0, T);
    M.w8TankDetail(Zt, t.yT, { glint: (x, y) => G.glints.push(Zt.__pt([x, y])) });
    for (const p of M.wellSpoutPts(0, t.yT)) leaf(Zt, A.ellipse(p[0], p[1] + 2, 11, 5, 0, PI * 0.05, PI * 0.95), 2, G);
    leaf(Zt, [[-140, t.yT - 5.5], [140, t.yT - 5.5]], 2, G);
  }
  // the canopy of sixty lanterns (Pragyan), in the dark hall
  function drawCanopy(A, G, L) {
    const h = G.obj.hall, hb = L.bays.find(b => b.kind === 'hall');
    if (X8('pragyan')) { const Z = sheetZ(A, 1.5); G.canopy = X8('pragyan').draw(Z, x8o(Z, G, { hall: h, at: hb.at, L })) || G.canopy; return; }
    G.canopy = M.w8Canopy(A, { x0: h.x0, x1: h.x1, y: h.y, drop: h.drop, at: hb.at, count: 60, P: { gold: TOK.zari, glints: G.glints }, seed: 60 });
  }
  // the two cups (Hackathons), gold already: a leaf edge on the stand
  function drawCups(A, G) {
    const c = G.obj.cups, Z = cupsZ(A, G);
    if (X8('hackathons')) { G.cupsInfo = X8('hackathons').draw(Z, x8o(Z, G, { s: c.s })) || G.cupsInfo; return; }
    G.cupsInfo = M.wellCups(Z, 0, 0, c.s, T);
    leaf(Z, [[-46 * c.s, -13.6 * c.s], [46 * c.s, -13.6 * c.s]], 1.6, G);
    M.w8CupsDetail(Z, c.s, { glint: (x, y) => G.glints.push(Z.__pt([x, y])) });
  }
  // the cranes (Delta Force): seven sarus in a V, a delta, flying out of an open bay into the night; the leader's
  // place from the middle of the object, the step back and the step out along each arm
  const CRANE_V = { lead: -72, dx: 38, dy: 12 };
  function drawCranes(A, G) {
    if (X8('delta-force')) { const Z = sheetZ(A, 1.5); return X8('delta-force').draw(Z, x8o(Z, G, { cr: G.obj.cranes, V: CRANE_V, box: G.hot['delta-force'] })); }
    const cr = G.obj.cranes, Z = zoom(A, scaleMap(1, 0, 0), { kw: 1.5 }), DX = CRANE_V.dx, DY = CRANE_V.dy, x0 = cr.x + CRANE_V.lead;
    const slots = [[0, 0, 'mid'], [1, -1, 'up'], [1, 1, 'down'], [2, -1, 'mid'], [2, 1, 'up'], [3, -1, 'down'], [3, 1, 'mid']];
    // the farthest back first, so each bird lies over the one behind it
    slots.slice().reverse().forEach(([n, sd, ph]) => {
      const x = x0 + n * DX + (sd > 0 ? 3 : 0), y = cr.y + sd * n * DY, s = cr.s * (1 - 0.05 * n), Q = (u, v) => [x - u * s, y + v * s];
      M.w8Crane(Z, x, y, s, { flip: true, wing: ph, glint: (gx, gy) => G.glints.push(Z.__pt([gx, gy])) });
      leaf(Z, [Q(0.06, -0.066), Q(0.14, -0.052), Q(0.22, -0.046)], Math.max(0.5, s * 0.016), G);
    });
  }
  // the lotus kund (NIT Trichy): a stepped tank seen from the front, green water crowded with lotus
  function drawKund(A, G) {
    const kd = G.obj.kund, Z = kundZ(A, G);
    if (X8('nit-trichy')) { G.kundInfo = X8('nit-trichy').draw(Z, x8o(Z, G, {})); return; }
    G.kundInfo = M.w8Kund(Z, { glint: (x, y) => G.glints.push(Z.__pt([x, y])), lamp: (x, y) => G.lamps.push(Z.__pt([x, y])) });
    leaf(Z, [[-148, -135.4], [148, -135.4]], 2, G);
    leaf(Z, [[-150, -33.6], [150, -33.6]], 1.8, G);
  }

  const THINGS = {
    // Optmyzr now, up in the sun: the dovecote and the loom, each on its own ground, a cloth just off the loom hung out
    // over the eave between them, a cat asleep on the warm threshold of the gold room
    y2025(A, G, L, pal) {
      const O = G.obj, d = O.dove, lm = O.loom, pv = L.bays.find(b => b.kind === 'pavilion' && b.side === L.side);
      hush(A, G.hot.sidekick, 0.5); hush(A, G.hot['rule-builder'], 0.42);
      M.w8Cloth(A, 470, 548, L.top - 1.5, L.h * 0.36, pal, {});
      pigeons(A, L, 22, 25, x => Math.abs(x - d.x) < 60 || (x > lm.x - 75 && x < lm.x + 110) || (x > 462 && x < 556));
      wallShadows(A, G);
      focal(A, G, 'sidekick', () => drawDove(A, G));
      x8ground(A, G, 'rule-builder', loomZ(A, G), {});
      focal(A, G, 'rule-builder', () => drawLoom(A, G));
      M.w8Rangoli(A, (pv.x0 + pv.x1) / 2, L.foot + 10, 10, 4.4, pal);
      M.sleepingCat(A, pv.x0 + (pv.x1 - pv.x0) * 0.62, L.foot - 1.6 - 40 * (24 / 150), 24, 0, 0, T, {});
      landingLamps(A, L, pal, 2, x => Math.abs(x - d.x) < 64 || (x > lm.x - 80 && x < lm.x + 115));
      const R = STAGE.rng(19);
      for (let i = 0; i < 6; i++) pigeonSit(A, d.x + R.rr(-62, 52) + (i % 2 ? 0 : 0), L.land - R.rr(2, 6), R.rr(7, 8.5), R.chance(0.5), R.pick(['#8a93a0', '#9aa0a8', '#7e8894', '#eef0f0']));
      for (let i = 0; i < 3; i++) pigeonFly(A, d.x + R.rr(-20, 70), d.yb - 400 * 0.94 * d.k + R.rr(-14, 10), R.rr(6, 8), R.ri(0, 3), R.pick(['#8a93a0', '#eef0f0']), {});
    },
    // six spouts pouring into one tank; beside it the door with the toran and the red thread (drawn with the bays)
    y2023(A, G, L, pal) {
      const t = G.obj.tank;
      hush(A, G.hot.portfolio, 0.3, G.hot.joined);
      if (!x8ground(A, G, 'portfolio', tankZ(A, G), { yT: t.yT })) M.w8TankShadows(tankZ(A, G), t.yT);
      focal(A, G, 'portfolio', () => drawTank(A, G));
      pigeons(A, L, 14, 26, x => Math.abs(x - t.x) < 110);
      const dr = G.obj.door, xc = (dr.x0 + dr.x1) / 2;
      M.w8Rangoli(A, xc, L.foot + 10, 11, 4.6, pal);
      landingLamps(A, L, pal, 3, x => Math.abs(x - t.x) < 110);
    },
    // the festival: sixty lanterns in the dark hall; two gold cups on a stand in front of a deep arch
    y2022(A, G, L, pal) {
      const hl = G.obj.hall, c = G.obj.cups;
      x8ground(A, G, 'pragyan', sheetZ(A, 1.5), { hall: hl, at: (L.bays.find(b => b.kind === 'hall') || {}).at, L });
      focal(A, G, 'pragyan', () => drawCanopy(A, G, L));
      x8ground(A, G, 'hackathons', cupsZ(A, G), { s: c.s });
      focal(A, G, 'hackathons', () => drawCups(A, G));
      pigeons(A, L, 10, 27, x => (x > hl.x0 - 12 && x < hl.x1 + 12) || Math.abs(x - c.x) < 110);
      landingLamps(A, L, pal, 2, x => Math.abs(x - c.x) < 110 || (x > hl.x0 - 8 && x < hl.x1 + 8));
    },
    // cranes going over in a V across a deep arch; a pole with a pennant and a drum; a kite caught on the eave
    y2020(A, G, L, pal) {
      hush(A, G.hot['delta-force'], 0.5);
      const p = G.obj.pole, Zp = zoom(A, place(p.x, p.yb, p.k, 0, 0));
      const tie = M.wellPole(Zp, 0, 0, p.h, T);
      M.wellFlag(Zp, tie[0], tie[1], 128, 1, T);
      drum(Zp, -62, 0);
      M.kite(A, 1470, L.eaveY + 10, 15, M.kiteIds ? M.kiteIds[0] : 'x', { rot: -0.35, short: false });
      x8ground(A, G, 'delta-force', sheetZ(A, 1.5), { cr: G.obj.cranes, V: CRANE_V, box: G.hot['delta-force'] });
      focal(A, G, 'delta-force', () => drawCranes(A, G));
      landingLamps(A, L, pal, 2, x => Math.abs(x - G.obj.cranes.x) < 120);
    },
    // the lotus kund, lamps in the niches; night
    y2019(A, G, L, pal) {
      const kd = G.obj.kund;
      hush(A, G.hot['nit-trichy'], 0.4);
      x8ground(A, G, 'nit-trichy', kundZ(A, G), {});
      focal(A, G, 'nit-trichy', () => drawKund(A, G));
      landingLamps(A, L, pal, 1, x => Math.abs(x - kd.x) < 140);
    }
  };
  function drum(A, x, yb) {
    const body = A.spline([[x - 18, yb], [x - 20, yb - 16], [x - 18, yb - 32], [x + 18, yb - 32], [x + 20, yb - 16], [x + 18, yb]], true, 0.8);
    A.fill(body, 'chalk', '#8f2331', { w: 2.6, p: 1, passes: 2 });
    M.floorWash(A, body, '#2a1018', (xx) => 0.45 * sstep((xx - x) / 20 + 0.2), 'mul');
    for (let i = 0; i < 7; i++) { const u = -16 + i * 5.4; A.stroke([[x + u, yb - 30], [x + u + 2.6, yb - 2]], 'chalk', '#e6b422', { w: 1, p: 0.85 }); }
    A.fill(A.ellipse(x, yb - 32, 18, 4.5), 'chalk', '#ecdcbc', { w: 1.6, p: 1, passes: 2 });
    A.outline(body, 'kajal', '#1e1410', { closed: true, w: 0.9, p: 0.8 });
    A.outline(A.ellipse(x, yb - 32, 18, 4.5), 'kajal', '#1e1410', { closed: true, w: 0.8, p: 0.8 });
  }
  function landingPetals(A, L) { const Y = Y8('petals'); return Y ? Y(A, L, H8()) : landingPetals0(A, L); }
  function landingPetals0(A, L) {
    const R = STAGE.rng(800 + L.k);
    for (let c = 0; c < 12; c++) {
      const near = R.chance(0.45), cx = near ? 960 + R.pick([-1, 1]) * R.rr(52, 110) : R.rr(L.a + 20, L.b - 20), cy = R.rr(L.foot + 3, L.land - 4);
      const n = R.ri(4, near ? 18 : 9);
      for (let i = 0; i < n; i++) M.w8Petal(A, cx + R.rr(-7, 7), cy + R.rr(-1.6, 1.6), R.rr(0.8, 1.2) * L.h / 130, R.pick(['mari', 'mari', 'rose', 'jasmine']), R.rr(-0.5, 0.5));
    }
  }

  /* ---------------------------------------------------------------- the water at the bottom, the sun in it */
  function tank(A, G) { const Y = Y8('water'); return Y ? Y(A, G, H8()) : tank0(A, G); }
  function tank0(A, G) {
    const pal = Object.assign({ lamps: G.lamps, glints: G.glints }, PAL.tank);
    M.w8Stone(A, G.tank.wall, pal, { course: 6 });
    A.stroke([[WA, WTOP + 0.5], [W - WA, WTOP + 0.5]], 'chalk', pal.lime, { w: 1.4, p: 0.9 });
    const water = G.tank.water;
    A.ground(water, '#0b2128', { w: 24, edge: 0, rub: 8, c2: '#10303a', top: 0.4 });
    M.floorCloud(A, water, '#133238', { scale: 70, seed: 3, thr: 0.58, soft: 0.4, p: 0.3, w: 10 });
    // the stair goes on down under the water
    for (let y = WATER; y < STAIR.y1; y += 5.6) { const hw = stairHW(y); A.fill(rect(960 - hw, y, 960 + hw, y + 3), 'chalk', A.mix('#5e7a72', '#0b2128', (y - WATER) / (STAIR.y1 - WATER)), { w: 1.2, p: 0.8, passes: 1 }); }
    const R = STAGE.rng(77), gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += R.rnd(); return (u - 2) / 0.58; };
    A.withMask(water, () => {
      // a few long slow ripples, a little lighter than the skin of the water
      for (let y = WATER + 8, r = 0; y < H + 4; y += 10 + r * 0.9, r++) for (let x = WA - 200 + (r % 2) * 24; x < W - WA + 200; x += R.rr(46, 96)) {
        if (Math.abs(x - 960) < 70) continue;
        A.stroke(A.ellipse(x, y, R.rr(12, 24), 2.4 + r * 0.15, 0, PI * 1.12, PI * 1.88), 'chalk', R.pick(['#1c3e44', '#21484c', '#183640']), { w: 0.6, p: 0.6 });
      }
      // the sun come down to the water: broken gold, its rings going out, and its path laid on the water to us
      const sr = G.obj.sunR;
      for (let y = sr.y + 8; y < H + 4; y += R.rr(1.4, 2.4)) {
        const spread = 14 + (y - sr.y) * 0.5;
        for (let k = 0; k < 3; k++) {
          const x = 960 + gauss() * spread * 0.5, f = 1 - Math.min(1, Math.abs(x - 960) / spread), len = R.rr(2.5, 8) * (0.5 + f);
          A.stroke([[x - len / 2, y], [x + len / 2, y + R.rr(-0.2, 0.2)]], 'gold', R.pick(['#e2b53e', '#f2d27a', '#f6e6b8', '#c9a24a']), { w: 0.7, p: 0.35 + 0.55 * f });
        }
      }
      for (let k = 1; k <= 4; k++) A.stroke(A.ellipse(sr.x, sr.y, 22 * k, 7 * k, 0, 0, TAU), 'chalk', k % 2 ? '#a88a3e' : '#c9a24a', { w: 0.9, p: 0.75 - k * 0.12 });
      for (let i = 0; i < 26; i++) { const y = sr.y - 9 + i * 0.75, hw = 26 * Math.sqrt(Math.max(0, 1 - Math.pow((y - sr.y) / 10, 2))) * R.rr(0.7, 1.15); A.stroke([[sr.x - hw + R.rr(-2, 2), y], [sr.x + hw + R.rr(-2, 2), y]], 'gold', R.pick(['#e2b53e', '#f2d27a', '#d6a535']), { w: 0.8, p: 0.95 }); }
      A.stroke(A.ellipse(sr.x, sr.y, 28, 10.5), 'chalk', TOK.sindoor, { w: 1, p: 0.8 });
      // lily pads and lotus along the edges, and fish turning under the light
      for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) {
        const x = 960 + sg * R.rr(180, 380), y = R.rr(WATER + 16, 1070);
        M.lotusPad(A, x, y, R.rr(5, 8), {});
        if (i % 3 === 0) M.lotus(A, x + R.rr(-3, 3), y - 3, R.rr(3, 4.5), 'open', {});
      }
      for (let i = 0; i < 6; i++) M.fish(A, 960 + R.rr(-150, 160), R.rr(1000, 1072), R.rr(9, 13), { pose: 'swim', ang: R.rr(-PI, PI), c: '#f3bd45', back: '#c8501c', fin: '#e8701e' });
      const fl = G.obj.float;
      M.lampGlow(A, fl.x, fl.y - 2, 26, 0.9, {});
      M.w8FloatLamp(A, fl.x, fl.y, 2.2, pal);
    });
  }

  /* ---------------------------------------------------------------- the light over everything: noon at the top,
     night at the water, the sides in shade, and the sun falling straight down the stair like a column */
  function light(A, G) {
    const Y = Y8('light'); if (Y) Y(A, G, H8()); else light0(A, G);
    const Yg = Y8('glow'); if (Yg) Yg(A, G, H8());
  }
  function light0(A, G) {
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, hex = c => { const v = parseInt(c.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
    const sh = hex(TOK.chhaya), gl = hex('#c8963a'), sun = G.SUN;
    for (let Y = cy0; Y < cy1; Y++) {
      const y = (Y + 0.5) / S, wcol = 52 + y * 0.05;
      const down = 0.25 * sstep((y - 330) / 680), fallCol = (1 - 0.35 * sstep((y - 200) / 800)) * sstep((y - 70) / 50);
      for (let X = cx0; X < cx1; X++) {
        const x = (X + 0.5) / S, dx = Math.abs(x - 960), col = Math.exp(-(dx / wcol) * (dx / wcol));
        let kd = down + 0.3 * sstep((dx - 560) / 520) * sstep((y - 150) / 160);
        kd *= 1 - 0.85 * col;
        if (y > WATER) kd *= 0.45;
        const i = Y * A.W + X;
        if (kd > 0.002) { A.R[i] *= 1 - kd + kd * sh[0]; A.G[i] *= 1 - kd + kd * sh[1]; A.B[i] *= 1 - kd + kd * sh[2]; }
        const ds = Math.hypot(x - sun.x, y - sun.y), kl = 0.5 * col * fallCol + 0.45 * Math.exp(-(ds / 120) * (ds / 120));
        if (kl > 0.002) { A.R[i] = 1 - (1 - A.R[i]) * (1 - gl[0] * kl); A.G[i] = 1 - (1 - A.G[i]) * (1 - gl[1] * kl); A.B[i] = 1 - (1 - A.B[i]) * (1 - gl[2] * kl); }
      }
    }
  }

  /* ---------------------------------------------------------------- what is in the air: the flock going up out of
     the well toward the sun, and the petals and gold leaf coming down the column of light */
  function air(A, G) { const Y = Y8('air'); return Y ? Y(A, G, H8()) : air0(A, G); }
  function air0(A, G) {
    const R = STAGE.rng(4242), gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += R.rnd(); return (u - 2) / 0.58; };
    for (let i = 0; i < 84; i++) {
      const t = i / 84, a = t * 9.4 + R.rr(-0.25, 0.25), r = 26 + 300 * t, x = 1000 + Math.cos(a) * r * (0.85 + 0.3 * t) + R.rr(-12, 12), y = 930 - t * 820 + Math.sin(a) * r * 0.2 + R.rr(-8, 8);
      const s = 2.6 + 5.5 * t;
      if (s > 5.2) pigeonFly(A, x, y, s, R.ri(0, 3), R.pick(['#8a93a0', '#eef0f0', '#7e8894']), { flip: Math.cos(a) < 0 });
      else { const dk = R.chance(0.3) ? '#f4eef0' : '#3c4450'; A.stroke(A.spline([[x - s, y - s * 0.3], [x - s * 0.45, y - s * 0.5], [x, y], [x + s * 0.45, y - s * 0.5], [x + s, y - s * 0.3]], false, 0.5), 'kajal', dk, { w: Math.max(0.35, s * 0.14), p: 0.9 }); }
    }
    for (let i = 0; i < 1500; i++) {
      const y = R.rr(80, WATER), wide = R.chance(0.8) ? 1 : 3.2, x = 960 + gauss() * (40 + y * 0.05) * wide;
      const kind = R.pick(['mari', 'mari', 'rose', 'jasmine', 'gold', 'gold']);
      M.w8Petal(A, x, y, R.rr(0.8, 1.5) * (0.75 + 0.5 * (1 - y / 1000)), kind, R.rr(0, TAU));
    }
  }

  let H8c = null;
  function H8() {
    return H8c || (H8c = {
      W, H, PI, TAU, clamp, lerp, sstep, rect, r1, T, TOK, PAL, WALL, LV, VP, rayX, rayY, WTOP, WATER, WA, STAIR, stairHW, SUN, CHHATRI,
      MOTIFS, BW, KIND, QUIET, OX, BROKEN, hashXY, coatOf, POSE, pigeonSit, pigeonFly, STAGE_mix, hex3, scaleMap, place, cen, zoom,
      sideMap, sideWall, wallPal, INTERIOR, SHADOW, LIFE, at0, hush, leaf, leafDot, focal, X8, SEED, CRANE_V,
      old: { sky: sky0, chhatri, sides: sides0, flights, step, hollowFeature, terrace, sideLife, stairPart: stairPart0, landingPetals: landingPetals0,
        pigeons: pigeons0, landingLamps, iwan: iwan0, hall: hall0, tank: tank0, light: light0, air: air0, drum, miniature }
    });
  }

  return P;
})();
