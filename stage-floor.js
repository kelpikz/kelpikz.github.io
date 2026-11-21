/* ------------------------------------------------------------------ *
 *  THE PAINTER'S FLOOR
 *
 *  A floor seen from straight above, in the hour after a long piece of
 *  work was finished and went well.  An indigo rug with a gold sun at
 *  its heart; around it the lime floor, the pigments in their shells, a
 *  brass bowl of water, brushes, a peacock feather, a booklet of gold
 *  leaf, a marigold garland, a clay lamp, and a cat asleep in the light.
 *  Nobody is there.  The six folios are laid over it by the page.
 *
 *  The still picture is the room without anything that falls across a
 *  folio: the window light, the leaf shadows, the lamp glow and the cat
 *  are loose drawings, each on its own layer (see the contract).
 * ------------------------------------------------------------------ */
STAGE.places.floor = (function () {
  const P = {};
  const IDS = P.IDS = ['shelf', 'open-transcribe', 'claudemonitor', 'dpay', 'utopia', 'dalal-street'];
  // where the folios lie: centre x, centre y, width, turn in degrees (the page lays them; the preview copies it)
  P.FOLIOS = {
    // not a grid, and not one size: D-Pay is the largest sheet, open-transcribe the smallest and its corner rests on Shelf's
    // edge; Utopia's head lies over the sun's lowest rays
    wide: [[372, 296, 316, -9], [672, 232, 272, 8], [1082, 318, 326, -4], [1188, 636, 366, 5], [815, 660, 300, -7], [430, 640, 330, 10]],
    tall: [[265, 330, 262, -7], [540, 342, 236, 5], [266, 606, 250, 3], [536, 600, 272, -6], [262, 874, 246, -3], [540, 884, 258, 7]]
  };
  P.SLIP = { wide: [150, 110, 220, -3], tall: [400, 150, 220, -2] };
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const bboxOf = (pts, m) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return [Math.floor(x0 - m), Math.floor(y0 - m), Math.ceil(x1 + m), Math.ceil(y1 + m)]; };
  const shift = (pts, dx, dy) => pts.map(p => [p[0] + dx, p[1] + dy]);

  // the hour: what a pigment looks like in this light
  function tone(A, G) {
    /* night: every colour sinks in value and loses some of its colour toward grey, as colours do in the dark; it keeps its
       own hue and is not turned toward blue (the pinks do not go periwinkle, the whites do not go lavender).  The warm
       colours give up the most; the indigos keep theirs, so the rug's field stays indigo and does not go to black.  Only
       the deepest darks take a breath of indigo */
    if (G.night) return c => { c = A.col(c); const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2], d = 0.32 * clamp((c[0] - c[2]) * 2 + 0.45, 0, 1); return c.map((v, i) => (v + (l - v) * d) * 0.86 + [0.006, 0.008, 0.016][i] * (1 - l)); };
    if (G.dusk) return c => A.mix(A.mix(c, '#c2542a', 0.15), '#46263a', 0.1);
    return c => A.mix(c, '#fff3d8', 0.05);
  }
  P.tone = tone;

  /* the night in the room: a deep glaze, all but grey (only a little cool), that lowers each colour without turning it,
     thinner in the lamp's pool; the corners go further into the dark.  (The moon's patch is its own drawing, over the cat: it lifts nothing round
     it.)  The still picture lays it, and the loose drawings that lie under the folios (the cat, the water, the gold sheet,
     the feather) take the same glaze where they lie. */
  const NIGHT = '#2c2e40', NIGHT_EDGE = '#1c1d28';
  const nightK = (G, x, y) => 0.74 - 0.36 * (1 - sstep(G.poolD(x, y) / 1.15));
  const edgeK = (G, x, y) => { const u = x / G.W, v = y / G.H, e = Math.min(u, 1 - u, v * 1.4, 1 - v); return (1 - sstep(e / 0.2)) * (G.night ? 0.7 : 0.45); };
  function roomTone(A, G, x, y) {
    const T = tone(A, G); if (!G.night) return T;
    const k = nightK(G, x, y), e = edgeK(G, x, y), n = A.col(NIGHT), ne = A.col(NIGHT_EDGE);
    return c => T(c).map((v, i) => v * (1 - k + k * n[i]) * (1 - e + e * ne[i]));
  }

  /* where the folios lie, read back as weights at a floor point: on a sheet, on its title panel, on its foot margin where
     the tagline is written.  Lights are kept thin over the words, and no shadow crosses a title. */
  function sheetZones(fmt) {
    const F = P.FOLIOS[fmt].map(q => { const k = q[2] / 360, a = q[3] * PI / 180; return { cx: q[0], cy: q[1], k, ca: Math.cos(a), sa: Math.sin(a) }; });
    const band = (v, a, b, s) => sstep((v - a) / s + 0.5) * sstep((b - v) / s + 0.5);
    // wT, wF, wOn, wP: how much the title, the foot, the sheet itself and the painting on it take away.
    // soft: the title and foot come in by degrees over a sheet's margins instead of at its edge, so a glaze kept thin
    // over the words shows no line where it thins
    return (wT, wF, wOn, wP, soft) => (x, y) => {
      let title = 0, foot = 0, on = 0, paint = 0;
      for (const f of F) {
        const dx = x - f.cx, dy = y - f.cy, lu = (dx * f.ca + dy * f.sa) / f.k + 180, lv = (-dx * f.sa + dy * f.ca) / f.k + 150;
        if (lu < -14 || lu > 374 || lv < -14 || lv > 314) continue;
        const iu = band(lu, -6, 366, 10), su = soft ? band(lu, 10, 350, 34) : iu;
        on = Math.max(on, iu * band(lv, -6, 306, 10));
        title = Math.max(title, su * (soft ? band(lv, 32, 70, 26) : band(lv, 26, 76, 10)));
        foot = Math.max(foot, su * (soft ? band(lv, 262, 298, 26) : band(lv, 254, 306, 10)));
        if (wP) paint = Math.max(paint, band(lu, 26, 334, 8) * band(lv, 70, 245, 8));
      }
      return (1 - wT * title) * (1 - wF * foot) * (1 - wOn * on) * (1 - (wP || 0) * paint);
    };
  }

  /* ====================================================================== WHERE THINGS ARE */
  P.geom = function (fmt, mood) {
    const wide = fmt !== 'tall', W = wide ? 1600 : 800, H = wide ? 900 : 1250;
    const night = mood === 'night', dusk = mood === 'dusk', day = !night && !dusk;
    const G = { place: 'floor', fmt: wide ? 'wide' : 'tall', mood, W, H, wide, night, dusk, day };
    G.sky = { u1: 1, v1: 1 };            // no sky: the page takes the mean of the whole floor
    G.focus = [0.5, 0.5];
    G.touch = [0, H];
    G.ink = night ? 'light' : 'dark';
    const L = G.L = wide ? {
      rug: { cx: 790, cy: 455, w: 1344, h: 780, rot: 0.006 },
      sun: [790, 452, 198],               // the gold sun, its rays running on under the edges of the sheets
      wear: [[790, 455, 31, 300], [420, 760, 32, 170], [1150, 150, 33, 160]],
      bowl: [1335, 198, 56],
      book: [1342, 398, 52, -0.1],
      agate: [1478, 812, 30, -0.25],
      // what a painter leaves on the floor: a pencil worn to a stub, threads off a binding, a pinch of colour
      stub: [1225, 826, 30, 0.12],
      threads: [[1450, 845]],
      pdust: [[1565, 812, 7, 'lapis']],
      // gold dust carried off the booklet, along the gap under the top row and down between two sheets
      trail: [[1318, 412], [1290, 440], [1240, 462], [1170, 464], [1100, 465], [1040, 468], [990, 470], [945, 466]],
      trail2: [[1040, 468], [1018, 520], [1008, 600], [1004, 680]],
      lamp: [86, 724, 1.3],                 // where the brass foot meets the floor, and the size
      brushes: [60, 836, -0.115, 252],
      // the colours lie as they were put down, in three loose knots and in whatever came to hand: an oyster, a cowrie and a
      // clay saucer; a mussel and a shell knocked over, its lapis spilt; an oyster with a brush laid across it, a saucer, the gold
      // [x, y, size, turn, pigment, kind]
      shells: [[744, 838, 50, 0.6, 'hingul', 'oyster'], [800, 860, 23, 0, 'haldi', 'dish'], [778, 812, 25, -0.45, null, 'cowrie'],
        [842, 828, 50, 2.75, 'malachite', 'mussel'], [1050, 836, 46, -0.3, 'peach', 'oyster'], [1104, 862, 21, 0, 'khadi', 'dish']],
      tipped: [946, 852, 44, -0.25, 'lapis'],
      spill: [1152, 842, 50, 0.15],
      brushOn: [[1006, 870], [1102, 808]],
      rolled: [[202, 668], [[104, 604], [128, 620], [150, 634], [176, 652]]],     // a marigold come off the garland, and its petals behind it
      flakes: [[1312, 424], [1250, 442], [1170, 455], [1080, 464], [995, 472]],
      pot: [1574, 326, 118],
      slab: 232,
      dust: [[30, 650, 22], [1585, 760, 18]],
      rings: [[1548, 668, 26]],
      feather: [[1392, 856], [1546, 500]],
      garland: [[-24, 172], [60, 198], [138, 238], [176, 320], [158, 404], [96, 452], [46, 520], [72, 586]],
      cat: [621, 798, 138, -0.02],              // asleep in profile in the gap between the bull and the peacock, its rump just under the bull's corner
      stains: [[300, 868, 30, 'hingul'], [1530, 120, 42, 'lapis'], [36, 372, 26, 'haldi'], [1560, 840, 22, 'malachite'], [1588, 610, 16, 'geru']],
      scuffs: [[1480, 600, 70]],
      // the window is in the left wall: the patches run from it to the right, the way the light in the bowl and the pot
      // comes from the left.  Corners: the window's top first, across it, then away.
      /* by day one long raking beam: it comes in low from the wall, climbs a little across the rug's lower border, over
         the sleeping cat (its back stays in the shade) and the shells, and ends in the window's cusped head on the red band
         past them, clear of every sheet so the head reads whole.  Its ends are upright, as the wall is. */
      jali: [[430, 745], [430, 805], [935, 905], [935, 845]],
      // at dusk the long low shaft comes in from the far wall across the lamp and runs out over the cat
      shaft: [[-9, 621], [-31, 739], [789, 889], [811, 771]],
      // the moon comes in higher and steeper, a faint cool patch over the cat
      moon: [[535, 639], [465, 761], [725, 911], [795, 789]],
      leaves: { day: [792, 840, 105, 0.04], dusk: [110, 700, 280, 0.17], night: [478, 724, 130, 0.42] },
      // the bare floor at the lower right: a brush dropped there wet, the smear it left, a few petals
      drop: { brush: [[1590, 771], [1522, 806]], smear: [[1514, 813], [1503, 823], [1494, 837]], pig: 'hingul', petals: [[1556, 745], [1480, 724], [1588, 828], [1540, 843], [1474, 800], [1576, 711], [1517, 766]] },
      veil: [140, 66, 1440, 846],
      // along the top: a pricked stencil and its pounce bag, a stick of charcoal; the corner of a reed mat at the top right
      charba: [566, 22, 196, 88, -0.05], bag: [706, 36, 15, 0.5], charcoal: [936, 32, 66, 0.2], mat: [[1418, -12], [1612, 174]],
      topPetals: [[300, 30], [420, 50], [470, 14], [820, 18], [860, 52], [1060, 24], [1130, 54], [1210, 20], [1290, 46], [1380, 30]],
      damp: [1530, 474, 100],
      // the bare floor: a konia in the lower left corner, under the lamp; prints of turmeric, vermilion and lapis; the rag
      konia: [-4, 864, 126, -Math.PI / 2],
      prints: [[24, 606, -1.2, 'haldi', 1], [37, 592, -0.9, 'haldi', 0.6], [1506, 712, -2.0, 'hingul', 1], [1498, 727, -1.8, 'hingul', 0.62], [1493, 742, -1.6, 'hingul', 0.36], [1004, 46, 0.9, 'lapis', 0.9], [1018, 37, 1.1, 'lapis', 0.55]],
      rag: [1590, 640, 66, 0.35],
      weight: [2, 348, 13, 12.5],          // a brass weight on claudemonitor's top right corner: [folio, u, v, radius]
      glowR: { dusk: 210, night: 320 }
    } : {
      rug: { cx: 400, cy: 612, w: 660, h: 960, rot: -0.004 },
      sun: [400, 604, 172],
      wear: [[400, 612, 31, 240], [560, 1060, 32, 140]],
      bowl: [652, 162, 48],
      book: [176, 166, 44, 0.08],
      agate: [236, 104, 24, 0.12],
      stub: [575, 92, 24, 0.25],
      threads: [[724, 1086]],
      pdust: [[118, 92, 6, 'hingul']],
      trail: [[196, 186], [250, 200], [320, 212], [372, 222], [396, 262], [402, 330], [404, 400], [402, 450]],
      trail2: null,
      lamp: [74, 1118, 1.15],
      brushes: [150, 1180, -0.05, 236],
      shells: [[200, 1112, 46, 0.7, 'hingul', 'oyster'], [252, 1140, 21, 0, 'haldi', 'dish'], [228, 1090, 23, -0.4, null, 'cowrie'],
        [286, 1108, 44, 2.8, 'malachite', 'mussel'], [452, 1110, 42, -0.3, 'peach', 'oyster'], [500, 1142, 19, 0, 'khadi', 'dish']],
      tipped: [362, 1136, 40, -0.2, 'lapis'],
      spill: [542, 1168, 42, 0.12],
      brushOn: [[414, 1138], [494, 1086]],
      rolled: [[150, 990], [[70, 950], [92, 962], [112, 972], [132, 982]]],
      flakes: [[200, 184], [262, 196], [340, 206], [430, 212], [520, 216]],
      pot: [792, 412, 100],
      slab: 210,
      dust: [[772, 250, 16]],
      rings: [[742, 1150, 20]],
      feather: [[744, 1004], [752, 560]],
      garland: [[-16, 250], [50, 292], [104, 380], [96, 480], [42, 560], [36, 660], [96, 760], [108, 860], [60, 932]],
      cat: [606, 1054, 128, -0.04],
      stains: [[40, 1000, 26, 'hingul'], [760, 130, 30, 'lapis'], [700, 1180, 22, 'haldi']],
      scuffs: [[690, 1050, 60]],
      // by day the beam rises from the floor below the rug across the shells and the cat, over the corner of the last sheet
      jali: [[380, 1120], [380, 1201], [712, 1051], [712, 970]],
      shaft: [[-20, 890], [-20, 990], [700, 1130], [700, 1030]],
      moon: [[460, 966], [460, 1060], [760, 1150], [760, 1056]],
      leaves: { day: [400, 1050, 110, 0.1], dusk: [10, 920, 320, 0.25], night: [470, 1000, 140, 0.25] },
      drop: null,
      veil: [90, 90, 720, 1040],
      charba: null, bag: [452, 44, 13, 0.4], charcoal: [328, 54, 54, 0.3], mat: null,
      topPetals: [[300, 20], [390, 70], [520, 30], [700, 60]],
      damp: [770, 540, 78],
      konia: [804, 1254, 150, Math.PI],
      prints: [[752, 184, -2.2, 'lapis', 0.9], [764, 196, -2.0, 'lapis', 0.55], [782, 1058, -1.4, 'hingul', 1], [771, 1072, -1.2, 'hingul', 0.6]],
      rag: [30, 162, 56, -0.45],
      weight: [0, 13, 13, 10],
      glowR: { dusk: 180, night: 270 }
    };
    // where the flame stands: the tip of the wick (as M.lampStand draws it); the glow is centred in the flame
    G.spout = M.lampWickAt(L.lamp[0], L.lamp[1], L.lamp[2]);
    G.flameH = wide ? 22 : 19;
    G.glowAt = [G.spout[0], G.spout[1] - G.flameH * 0.45];
    // the boxes of the loose drawings, in scene units
    const B = G.boxes = {};
    { const cu = L.cat[2] / 150; B.cat = [Math.floor(L.cat[0] - 86 * cu), Math.floor(L.cat[1] - 62 * cu), Math.ceil(L.cat[0] + 100 * cu), Math.ceil(L.cat[1] + 88 * cu)]; }
    B.ring = [L.bowl[0] - L.bowl[2] * 0.84, L.bowl[1] - L.bowl[2] * 0.84, L.bowl[0] + L.bowl[2] * 0.84, L.bowl[1] + L.bowl[2] * 0.84].map(Math.round);
    {
      const f = L.feather, fl = Math.hypot(f[1][0] - f[0][0], f[1][1] - f[0][1]);
      B.feather = bboxOf([f[0], f[1]], fl * 0.17);
    }
    {
      const b = L.book, c = [b[0] + Math.cos(b[3]) * b[2] * 0.43, b[1] + Math.sin(b[3]) * b[2] * 0.43];
      G.sheetAt = c; B.leaf = [Math.floor(c[0] - b[2] * 0.62), Math.floor(c[1] - b[2] * 0.62), Math.ceil(c[0] + b[2] * 0.62), Math.ceil(c[1] + b[2] * 0.62)];
    }
    B.flame = [Math.floor(G.spout[0] - 18), Math.floor(G.spout[1] - G.flameH * 1.6), Math.ceil(G.spout[0] + 18), Math.ceil(G.spout[1] + 8)];
    const gr = night ? L.glowR.night : L.glowR.dusk;
    G.glowR = gr;
    /* the lamp's pool lies on the floor round the stand's foot, under the flame and a little toward where the spout points.
       It does not reach as far every way: poolReach(a) gives its tongues.  poolD is 1 at its edge. */
    {
      const f = L.lamp, s = f[2], t = night ? 0.35 : 0.55;
      G.pool = [f[0] + (G.glowAt[0] - f[0]) * t + 10 * s, f[1] + (G.glowAt[1] - f[1]) * t];
      G.poolR = gr * 0.85;
      G.poolReach = a => 1 + 0.16 * Math.sin(2 * a + 1.3) + 0.1 * Math.sin(3 * a + 4.1) + 0.07 * Math.sin(5 * a + 2.2) + 0.05 * Math.sin(7 * a + 0.4);
      G.poolD = (x, y) => { const dx = x - G.pool[0], dy = (y - G.pool[1]) / 0.92; return Math.hypot(dx, dy) / (G.poolR * G.poolReach(Math.atan2(dy, dx))); };
      // the brass dish under the flame throws its own shadow round the foot
      G.poolHole = (x, y) => 1 - sstep((Math.hypot((x - f[0]) / (44 * s), (y - f[1] + 4 * s) / (26 * s)) - 0.55) / 0.7);
      const m = G.poolR * 1.45;
      G.poolBox = [G.pool[0] - m, G.pool[1] - m, G.pool[0] + m, G.pool[1] + m];
      // the warmth the flame throws past its pool stays in the left third of the room (a little more on the narrow page,
      // where the pool itself is wider than a third)
      { const x0 = W * (wide ? 0.27 : 0.36), x1 = W * (wide ? 0.36 : 0.48); G.warmCut = x => 1 - sstep((x - x0) / (x1 - x0)); }
      const bb = bboxOf([[G.poolBox[0], G.poolBox[1]], [G.poolBox[2], G.poolBox[3]], [G.glowAt[0] - gr * 0.3, G.glowAt[1] - gr * 0.3], [G.glowAt[0] + gr * 0.3, G.glowAt[1] + gr * 0.3]], 0);
      B.glow = [clamp(bb[0], 0, W), clamp(bb[1], 0, H), clamp(bb[2], 0, W), clamp(bb[3], 0, H)];
      // past the pool the light still goes on, thin, across the rug and the nearest sheets, until poolD 1.6
      const wp = []; for (let i = 0; i < 48; i++) { const a = i * TAU / 48, r = 1.6 * G.poolR * G.poolReach(a); wp.push([G.pool[0] + Math.cos(a) * r, G.pool[1] + Math.sin(a) * r * 0.92]); }
      const bw = bboxOf(wp, 4);
      B.warm = [clamp(bw[0], 0, W), clamp(bw[1], 0, H), clamp(bw[2], 0, W), clamp(bw[3], 0, H)];
    }
    // the weights of the folios under a point (see sheetZones)
    G.zone = sheetZones(G.fmt);
    G.patch = day ? L.jali : dusk ? L.shaft : L.moon;
    B.patch = bboxOf(G.patch, 14).map((v, i) => i % 2 ? clamp(v, 0, H) : clamp(v, 0, W));
    // by day the shade laid with the light reaches a little past it, where the floor round the beam is kept lower
    B.tint = day ? bboxOf(G.patch, 46).map((v, i) => i % 2 ? clamp(v, 0, H) : clamp(v, 0, W)) : B.patch;
    const lv = L.leaves[mood];
    G.leaf = lv;
    B.leaves = bboxOf([[lv[0], lv[1]], [lv[0] + Math.cos(lv[3]) * lv[2], lv[1] + Math.sin(lv[3]) * lv[2]]], lv[2] * 0.36).map((v, i) => i % 2 ? clamp(v, 0, H) : clamp(v, 0, W));
    B.veil = L.veil;
    // the brass weight, set on a folio's corner: where the page lays that corner
    {
      const w = L.weight, f = P.FOLIOS[G.fmt][w[0]], k = f[2] / 360, a = f[3] * PI / 180, u = (w[1] - 180) * k, v = (w[2] - 150) * k;
      G.weightAt = [f[0] + u * Math.cos(a) - v * Math.sin(a), f[1] + u * Math.sin(a) + v * Math.cos(a), w[3]];
      const r = w[3]; B.weight = [Math.floor(G.weightAt[0] - r * 1.5), Math.floor(G.weightAt[1] - r * 1.5), Math.ceil(G.weightAt[0] + r * 1.9), Math.ceil(G.weightAt[1] + r * 2)];
    }
    // the candle catching on the gold at night: the sun, and the booklet of leaf
    { const s = L.sun, m = s[2] * 1.08; B.sunG = [Math.floor(s[0] - m), Math.floor(s[1] - m), Math.ceil(s[0] + m), Math.ceil(s[1] + m)]; }
    { const b = L.book, m = b[2] * 1.15; G.bookAt = [b[0] - 4, b[1]]; B.bookG = [Math.floor(b[0] - 4 - m), Math.floor(b[1] - m), Math.ceil(b[0] - 4 + m), Math.ceil(b[1] + m)]; }
    return G;
  };

  /* ====================================================================== THE STILL PICTURE */
  P.background = function (A, G, say) {
    const { W, H, L, night, dusk, day, wide } = G, T = tone(A, G);
    let n = 0;
    const part = name => { if (say) say(name); A.reseed(15301 + (++n) * 7919 + (night ? 13 : dusk ? 7 : 0) + (wide ? 0 : 101)); };
    const all = [[-12, -12], [W + 12, -12], [W + 12, H + 12], [-12, H + 12]];

    part('lime floor');
    M.plaster(A, W, H, T, { stains: L.stains, scuffs: L.scuffs, slab: L.slab, dust: L.dust, rings: L.rings });
    // it was swept this morning: the fans of a grass broom in the lime dust, on the bare floor round the rug
    {
      const r = L.rug, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0);
      const offRug = (x, y) => { const u = (x - r.cx) * c + (y - r.cy) * s, v = -(x - r.cx) * s + (y - r.cy) * c; return sstep((Math.max(Math.abs(u) - r.w / 2, Math.abs(v) - r.h / 2) + 2) / 12); };
      M.broomSweeps(A, W, H, T, { keep: offRug });
    }

    // toward the walls the lime was washed with red earth, darker the nearer the wall and darkest into the corners
    part('wall wash');
    M.floorEdges(A, W, H, T, { k: wide ? 1 : 1.1, reach: wide ? 115 : 95 });
    // in a corner the quarter of a mandana drawn for some festival, half scrubbed away by feet since; and where colour
    // was wiped off a finger, its print
    M.mandanaCorner(A, L.konia[0], L.konia[1], L.konia[2], L.konia[3], T);
    M.fingerprints(A, L.prints, T);

    part('rug');
    const sunAt = L.sun;
    M.rug(A, L.rug, T, { wear: L.wear, say, lattice: wide ? 66 : 58, vine: wide ? 92 : 84, cornerR: wide ? 118 : 96, skipNear: p => Math.hypot(p[0] - sunAt[0], p[1] - sunAt[1]) < sunAt[2] * 1.02 });

    // the field round the sun worked deeper with the side of an indigo stick, so the gold glows out of it
    part('round the sun');
    {
      const r = L.rug, f = M.rugBands.field + 1, hw = r.w / 2 - f, hh = r.h / 2 - f;
      M.sunGround(A, sunAt[0], sunAt[1], sunAt[2], A.xf([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], { x: r.cx, y: r.cy, rot: r.rot || 0 }), T);
    }

    part('sun');
    const sunRays = M.sunDisc(A, sunAt[0], sunAt[1], sunAt[2], T).rays;

    // the brightest chalk in the picture, last, on the petals and the gold rays
    part('sun chalk');
    M.sunChalk(A, sunAt[0], sunAt[1], sunAt[2], T, { rays: sunRays });

    // along the top of the floor and in its corner: what was used before the colour, put by
    part('top strip');
    if (L.mat) M.reedMat(A, L.mat[0], L.mat[1], T);
    if (L.charba) M.charba(A, L.charba[0], L.charba[1], L.charba[2], L.charba[3], L.charba[4], T);
    if (L.bag) M.pounceBag(A, L.bag[0], L.bag[1], L.bag[2], L.bag[3], T);
    if (L.charcoal) M.charcoalStick(A, L.charcoal[0], L.charcoal[1], L.charcoal[2], L.charcoal[3], T);
    M.petals(A, L.topPetals.map(q => [q[0] + A.rr(-8, 8), q[1] + A.rr(-6, 6), A.pick(['mari', 'mari', 'rose', 'white'])]), T);

    part('garland');
    M.garland(A, L.garland, T, { r: wide ? 11 : 9.6, step: wide ? 12 : 11 });

    part('petals');
    {
      /* the petals and the specks of kumkum lie where things were done: shed round the garland, flicked about the shells
         as the brushes were loaded, round the booklet of leaf.  Only a few were thrown wide, and the floor between is clean. */
      const pts = [], cx = L.rug.cx, cy = L.rug.cy, reach = Math.hypot(W, H) * 0.55;
      for (let i = 0; i < (wide ? 46 : 34); i++) {
        const a = A.rr(0, TAU), r = sunAt[2] * 1.8 + Math.pow(A.rnd(), 1.2) * reach * 0.55, x = cx + Math.cos(a) * r * (wide ? 1.15 : 0.8), y = cy + Math.sin(a) * r * (wide ? 0.62 : 1);
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
        pts.push([x, y, A.pick(['mari', 'mari', 'rose', 'white'])]);
      }
      const knot = (x, y, n, rx, ry, kinds) => { for (let i = 0; i < n; i++) { const a = A.rr(0, TAU), d = Math.pow(A.rnd(), 0.8); pts.push([x + Math.cos(a) * d * rx, y + Math.sin(a) * d * ry, A.pick(kinds)]); } };
      // about the shells, in two or three knots where the colour was ground and mixed
      const sh = L.shells;
      for (const s of [sh[0], sh[3], sh[4]]) knot(s[0] + A.rr(-10, 10), s[1] + A.rr(-8, 4), wide ? 13 : 10, s[2] * 1.7, s[2] * 0.9, ['rose', 'rose', 'mari', 'white', 'mari']);
      // round the booklet, where it was cut
      knot(L.book[0] - 6, L.book[1] + 8, wide ? 14 : 11, L.book[2] * 1.5, L.book[2] * 1.1, ['mari', 'rose', 'white', 'mari']);
      // spilled near the garland, and two heads come loose
      for (let i = 0; i < (wide ? 76 : 60); i++) { const g = L.garland[A.ri(1, L.garland.length - 2)]; pts.push([g[0] + A.rr(-34, 34), g[1] + A.rr(-26, 36), A.pick(['mari', 'mari', 'mari', 'white', 'rose'])]); }
      const g1 = L.garland[L.garland.length - 1]; pts.push([g1[0] + 26, g1[1] + 24, 'head']);
      // and one that rolled away across the floor, shedding a petal or two as it went
      for (const q of L.rolled[1]) pts.push([q[0] + A.rr(-3, 3), q[1] + A.rr(-3, 3), 'mari']);
      M.petals(A, pts, T);
      { const m = L.rolled[0]; A.dot(m[0] + 2.5, m[1] + 3.5, 'shade', T('umber'), { w: 19, p: 0.32 }); M.marigold(A, m[0], m[1], wide ? 9.5 : 8.6, T, 'saffron'); }
    }

    part('shells');
    // colour flicked off the brushes as they were loaded: specks of each pigment round its own shell, kumkum among them,
    // thick close in and few further out
    for (const s of L.shells.concat([L.tipped])) {
      const pig = s[4] || 'hingul', n = Math.round(s[2] * 0.75);
      for (let i = 0; i < n; i++) {
        const a = A.rr(0, TAU), d = s[2] * (0.5 + 1.5 * Math.pow(A.rnd(), 1.4)), c = A.chance(0.32) ? A.pick(['hingul', 'sindoor', 'hingul']) : pig;
        A.dot(s[0] + Math.cos(a) * d, s[1] + Math.sin(a) * d * 0.75, 'chalk', T(c), { w: A.rr(0.7, 2.3), p: A.rr(0.55, 0.92), len: A.rr(0, 0.8), ang: A.rr(0, TAU) });
      }
    }
    M.goldSpill(A, L.tipped[0], L.tipped[1], L.tipped[2], L.tipped[3], T, L.tipped[4]);
    M.goldSpill(A, L.spill[0], L.spill[1], L.spill[2], L.spill[3], T);
    for (const s of L.shells) {
      if (s[5] === 'dish') M.clayDish(A, s[0], s[1], s[2], s[4], T);
      else if (s[5] === 'cowrie') M.cowrie(A, s[0], s[1], s[2], s[3], T);
      else if (s[5] === 'mussel') M.musselShell(A, s[0], s[1], s[2], s[3], s[4], T);
      else M.pigmentShell(A, s[0], s[1], s[2], s[3], s[4], T, { drip: A.chance(0.4) });
    }
    // a brush put down across the peach, its tip still wet with it
    { const a = L.brushOn[0], b = L.brushOn[1]; A.stroke([[a[0] + 3, a[1] + 5], [b[0] + 4, b[1] + 6]], 'shade', T('umber'), { w: 4.5, p: 0.36, tin: 0.1, tout: 0.3 }); M.brush(A, a, b, T, { w: 1.7, hair: 0.2, c: A.mix('sand', 'ochre', 0.25), thread: 'lapis', dip: 'peach' }); }

    part('brushes');
    M.brushBundle(A, L.brushes[0], L.brushes[1], L.brushes[2], L.brushes[3], T, { n: 7 });

    part('bowl');
    M.brassBowl(A, L.bowl[0], L.bowl[1], L.bowl[2], T, { pane: night ? 'ice' : 'khadi' });

    part('water pot');
    M.dampRing(A, L.damp[0], L.damp[1], L.damp[2], T);
    M.waterPot(A, L.pot[0], L.pot[1], L.pot[2], T, { pane: night ? 'ice' : 'khadi' });

    part('lamp');
    M.lampStand(A, L.lamp[0], L.lamp[1], L.lamp[2], !day, T);

    part('gold leaf');
    M.leafBook(A, L.book[0], L.book[1], L.book[2], L.book[3], T);
    M.burnisher(A, L.agate[0], L.agate[1], L.agate[2], L.agate[3], T);
    M.goldFlakes(A, L.flakes, wide ? 16 : 12, T);
    /* scraps of leaf that got away while it was being laid: placed one by one where they would have settled, more of them
       round the sun where the gilding was done and round the booklet where it was cut, none under a sheet; a few lie at
       the angle that sends the window back */
    {
      const free = (() => { const z = G.zone(0, 0, 1); return (x, y) => x > 4 && y > 4 && x < W - 4 && y < H - 4 && z(x, y) > 0.95; })();
      const items = [], s = L.sun, r = L.rug, b = L.book, flash = () => !night && A.chance(0.24);
      const put = (x, y, sz) => { if (free(x, y)) items.push([x, y, sz, A.rr(0, TAU), flash()]); };
      for (let i = 0; i < (wide ? 70 : 50); i++) { const a = A.rr(0, TAU), d = s[2] * A.rr(1.02, 2.1); put(s[0] + Math.cos(a) * d, s[1] + Math.sin(a) * d * (wide ? 0.82 : 1), A.rr(1.5, 4.2) * (A.chance(0.12) ? 1.6 : 1)); }
      for (let i = 0; i < (wide ? 60 : 44); i++) put(r.cx + A.rr(-0.47, 0.47) * r.w, r.cy + A.rr(-0.47, 0.47) * r.h, A.rr(1.4, 3.6));
      for (let i = 0; i < (wide ? 34 : 24); i++) { const a = A.rr(0, TAU), d = b[2] * A.rr(0.85, 2); put(b[0] + Math.cos(a) * d, b[1] + Math.sin(a) * d * 0.8, A.rr(1.1, 3.4)); }
      for (let i = 0; i < (wide ? 22 : 16); i++) { const x = A.rr(0, W), y = A.rr(0, H); if (Math.abs(x - r.cx) < r.w / 2 + 6 && Math.abs(y - r.cy) < r.h / 2 + 6) continue; put(x, y, A.rr(1.2, 3)); }
      M.goldScraps(A, items, T);
    }

    part('gold dust');
    {
      // a breath of it over the whole rug, more of it toward the sun, a trail from the spilled shell
      const pts = []; for (let i = 0; i < 60; i++) pts.push([L.rug.cx + A.rr(-L.rug.w / 2, L.rug.w / 2), L.rug.cy + A.rr(-L.rug.h / 2, L.rug.h / 2)]);
      M.goldDust(A, pts, wide ? 900 : 600, 60, { pow: 1 });
      M.goldDust(A, [[sunAt[0], sunAt[1]]], 500, sunAt[2] * 1.5, { pow: 0.7, big: 1.8 });
    }

    part('gold trail');
    M.goldTrail(A, L.trail, T, { n: wide ? 1300 : 1000 });
    if (L.trail2) M.goldTrail(A, L.trail2, T, { n: 420, w0: 6, w1: 14, pow: 1.1, drifts: 2, streaks: 5 });

    part('small things');
    M.pencilStub(A, L.stub[0], L.stub[1], L.stub[2], L.stub[3], T, { paint: A.mix('malachite', 'kajal', 0.22) });
    L.threads.forEach(q => M.looseThreads(A, q[0], q[1], T));
    L.pdust.forEach(q => M.pigmentDust(A, q[0], q[1], q[2], q[3], T));
    // the rag the brushes were wiped on, dropped at the edge of the floor
    M.paintRag(A, L.rag[0], L.rag[1], L.rag[2], L.rag[3], T);

    // at the lower right a brush was dropped with colour still in it: it touched down tip first and slid, and lay where
    // it stopped; a few petals were carried there on a foot
    if (L.drop) {
      part('dropped brush');
      const d = L.drop, a = d.brush[0], b = d.brush[1], c = T(d.pig);
      const sm = [b].concat(d.smear).map((q, i) => [q[0] + A.rr(-1, 1), q[1] + A.rr(-1, 1) + (i ? 0 : 3)]);
      // where the loaded tip met the floor and was dragged on: heavy at first, then breaking up on the tooth
      A.stroke(sm, 'side', c, { w: 7.5, p: 0.5, flow: 0.6, tin: 0.02, tout: 0.85 });
      A.stroke(sm.slice(0, 3).map(q => [q[0] + A.rr(-0.8, 0.8), q[1] + A.rr(-0.8, 0.8)]), 'pastel', c, { w: 3.6, p: 0.75, tin: 0.05, tout: 0.6 });
      A.stroke(sm.slice(1).map(q => [q[0] + 1.5, q[1] + 2]), 'side', A.mix(c, T('lac'), 0.35), { w: 3.4, p: 0.32, tin: 0.1, tout: 0.8 });
      A.smudge(sm.slice(0, 2), { r: 2.2, k: 0.3 });
      for (let i = 0; i < 26; i++) { const q = sm[A.ri(0, sm.length - 1)]; A.dot(q[0] + A.rr(-9, 9), q[1] + A.rr(-7, 7), 'chalk', A.chance(0.7) ? c : T('lac'), { w: A.rr(0.6, 1.8), p: A.rr(0.5, 0.9), len: A.rr(0, 0.6) }); }
      A.stroke([[a[0] + 3, a[1] + 5], [b[0] + 4, b[1] + 6]], 'shade', T('umber'), { w: 4.5, p: 0.36, tin: 0.1, tout: 0.3 });
      M.brush(A, a, b, T, { w: 1.8, hair: 0.21, c: A.mix('sand', 'umber', 0.12), thread: 'malachite', dip: d.pig });
      M.petals(A, d.petals.map(q => [q[0] + A.rr(-4, 4), q[1] + A.rr(-4, 4), A.pick(['mari', 'mari', 'rose', 'white'])]), T);
    }

    part('the hour');
    if (night) {
      // the room in the dark: a deep, nearly grey glaze that lowers every colour, lighter in the lamp's pool
      M.floorWash(A, all, NIGHT, (x, y) => nightK(G, x, y), 'mul');
      // warm in the pool even in the still picture, so the glow has something to stand on: fuller in some places, uneven at its edge
      const sd = A.rr(0, 40);
      M.floorWash(A, all, '#c0602a', (x, y) => { const d = G.poolD(x, y); return d >= 1.15 ? 0 : 0.36 * Math.pow(1 - sstep(d / 1.15), 1.3) * (0.82 + 0.36 * A.fbm(x / 90 + sd, y / 90 - sd, 3, 6)) * (1 - 0.5 * G.poolHole(x, y)); }, 'mul');
    } else if (dusk) {
      // the sun is low and comes in from the left: warm there, the far side of the room already going violet
      const sd = A.rr(0, 40), wob = (x, y) => 0.92 + 0.16 * A.noise2(x / 160 + sd, y / 160, 3);
      M.floorWash(A, all, '#a8482a', () => 0.1);
      M.floorWash(A, all, '#6b4c7a', (x, y) => 0.78 * sstep(x / W * 1.1 + y / H * 0.35 - 0.3) * wob(x, y), 'mul');
      M.floorWash(A, all, '#e88a3e', (x, y) => 0.24 * (1 - sstep(x / W * 1.6 + y / H * 0.2)) * wob(y, x));
    }
    // the corners fall away into shade: not one smooth fall but broken into long drags along each wall, as the wash went on
    {
      const sd = A.rr(0, 40), dh = M.floorDrag(A, 0.03, 80, 6, sd, 0.38), dv = M.floorDrag(A, PI / 2 - 0.03, 80, 6, sd + 7, 0.38);
      M.floorWash(A, all, night ? NIGHT_EDGE : dusk ? '#6b4a52' : '#a08060', (x, y) => {
        const u = x / W, v = y / H, m = sstep((Math.min(u, 1 - u) - Math.min(v * 1.4, 1 - v)) / 0.08 + 0.5);
        return edgeK(G, x, y) * (day ? 0.7 : 0.9) * (1 + (night ? 0.2 : 0.55) * (clamp(m * dh(x, y) + (1 - m) * dv(x, y), 0.3, 1.7) - 1));
      }, 'mul');
    }
  };

  /* ====================================================================== THE FIRST LINES */
  P.sketch = function (A, G) {
    const L = G.L, sk = (pts, o) => M.sketch(A, pts, Object.assign({ w: 3.4 }, o, { p: Math.min(0.69, ((o && o.p) || 0.6) * 1.2) }));
    A.reseed(61337 + (G.wide ? 0 : 9));
    const r = L.rug, X = pts => A.xf(pts, { x: r.cx, y: r.cy, rot: r.rot });
    const R = i => [[-r.w / 2 + i, -r.h / 2 + i], [r.w / 2 - i, -r.h / 2 + i], [r.w / 2 - i, r.h / 2 - i], [-r.w / 2 + i, r.h / 2 - i]];
    sk(X(R(0)), { closed: true }); sk(X(R(62)), { closed: true, p: 0.42 }); sk(X(R(101)), { closed: true, p: 0.5 });
    const s = L.sun; sk(A.ellipse(s[0], s[1], s[2], s[2]), { closed: true }); sk(A.ellipse(s[0], s[1], s[2] * 0.5, s[2] * 0.5), { closed: true, p: 0.45 });
    sk(A.ellipse(L.bowl[0], L.bowl[1], L.bowl[2], L.bowl[2]), { closed: true });
    { const lp = L.lamp, q = s2 => s2 * lp[2]; sk(A.ellipse(lp[0], lp[1], q(31), q(9)), { closed: true }); sk([[lp[0], lp[1] - q(14)], [lp[0], lp[1] - q(46)]], { p: 0.45 }); sk(A.ellipse(lp[0], lp[1] - q(52.5), q(29), q(6.8)), { closed: true, p: 0.5 }); sk(A.ellipse(lp[0], lp[1] - q(62), q(22), q(9)), { closed: true, p: 0.5 }); }
    sk(A.ellipse(L.cat[0] - L.cat[2] * 0.093, L.cat[1] + L.cat[2] * 0.08, L.cat[2] * 0.373, L.cat[2] * 0.2, L.cat[3]), { closed: true, p: 0.5 }); sk(A.ellipse(L.cat[0] + L.cat[2] * 0.36, L.cat[1] + L.cat[2] * 0.087, L.cat[2] * 0.127, L.cat[2] * 0.113), { closed: true, p: 0.45 });
    for (const sh of L.shells.concat([L.tipped])) sk(sh[5] === 'dish' ? A.ellipse(sh[0], sh[1], sh[2], sh[2]) : A.ellipse(sh[0], sh[1], sh[2] / 2, sh[2] * 0.31, sh[3]), { closed: true, p: 0.4, w: 2.4 });
    sk([L.feather[0], L.feather[1]], { p: 0.45 });
    sk(A.spline(L.garland, false, 10), { p: 0.45 });
    sk([[L.brushes[0], L.brushes[1]], [L.brushes[0] + Math.cos(L.brushes[2]) * L.brushes[3], L.brushes[1] + Math.sin(L.brushes[2]) * L.brushes[3]]], { p: 0.4 });
  };

  /* ====================================================================== THE LOOSE DRAWINGS */
  P.cels = function (G) {
    const { L, night, dusk, day, wide } = G, B = G.boxes, C = [];
    const cel = (name, w, h, ax, ay, draw) => C.push({ name, w: Math.ceil(w), h: Math.ceil(h), ax, ay, draw });
    // a cel cut from the scene at the box b; draw(A, dx, dy, T) draws at scene coordinates moved by (dx, dy)
    const box = (name, b, draw) => cel(name, b[2] - b[0], b[3] - b[1], 0, 0, (A, x, y) => draw(A, x - b[0], y - b[1], tone(A, G)));
    // the same, for a drawing that lies on the floor under the folios: at night it takes the room's glaze where it lies
    const boxAt = (name, b, at, draw) => cel(name, b[2] - b[0], b[3] - b[1], 0, 0, (A, x, y) => draw(A, x - b[0], y - b[1], roomTone(A, G, at[0], at[1])));
    // a weight read at a cel point, from the folios under it in the scene
    const zk = (wT, wF, wOn, wP, soft) => { const z = G.zone(wT, wF, wOn, wP || 0, soft); return (dx, dy) => (x, y) => z(x - dx, y - dy); };

    // the cat, breathing; at night the lamp warms the flank that faces it
    // (the lamp's warmth stays in the left third of the room, so the cat, asleep across it in the moon, takes none)
    const catWarm = null;
    for (let k = 0; k < 3; k++) boxAt('cat' + k, B.cat, L.cat, (A, dx, dy, T) => M.sleepingCat(A, L.cat[0] + dx, L.cat[1] + dy, L.cat[2], L.cat[3], k, T, { warm: catWarm }));
    // the water: still, then a ring that spreads
    const wr = L.bowl[2] * 0.75;
    for (let k = 0; k < 4; k++) boxAt('ring' + k, B.ring, L.bowl, (A, dx, dy, T) => M.waterRings(A, L.bowl[0] + dx + L.bowl[2] * 0.02, L.bowl[1] + dy + L.bowl[2] * 0.03, wr, k, T, { c: night ? 'ice' : 'khadi', c2: night ? 'sky' : 'ice' }));
    // the sheet of gold on the right-hand page, and its corner lifting
    for (let k = 0; k < 3; k++) boxAt('leaf' + k, B.leaf, G.sheetAt, (A, dx, dy, T) => M.goldSheet(A, G.sheetAt[0] + dx, G.sheetAt[1] + dy, L.book[2] * 0.62, L.book[3] - 0.03, k, T, { toneGold: night }));
    // the feather, its barbs stirring
    const fMid = [(L.feather[0][0] + L.feather[1][0]) / 2, (L.feather[0][1] + L.feather[1][1]) / 2];
    // at night it lies far from the lamp: its greens and its eye go down into the dark with the rest of that side of the room
    const fDim = night ? [0.64, 0.64, 0.68] : null;
    for (let k = 0; k < 3; k++) boxAt('feather' + k, B.feather, fMid, (A, dx, dy, T) => M.peacockFeather(A, [L.feather[0][0] + dx, L.feather[0][1] + dy], [L.feather[1][0] + dx, L.feather[1][1] + dy], fDim ? (c => T(c).map((v, i) => v * fDim[i])) : T, { ph: k * 0.9, bend: 0.05, toneGold: night }));

    /* light through the jali, or the long shaft at dusk, or the moon, laid by hand with the side of a pastel stick and
       rubbed soft with a finger.  By day the openings keep the screen's stars but each is its own; at dusk the low sun
       through the leaves outside makes round dapples of every size.  The light is kept thin over a folio's title and
       foot, where its words are; where it falls on bare floor it finds grains of gold. */
    // by day amber and saffron, never a pale cream: on the red border the light must deepen the red, not bleach it to pink
    const lightC = day ? ['#d08a48', '#f2c48a'] : dusk ? ['#e86a2c', '#ffb066'] : ['#454f80', '#8a94b6'];
    const pq = G.patch, lightAng = Math.atan2(pq[3][1] - pq[0][1], pq[3][0] - pq[0][0]);
    /* by day one clear beam: the window's two mullions show in it only as faint soft lines along the light, there are no
       cross bars, the sides are laid soft, and the far end is the window's cusped head, a thin soft transom where it springs */
    const screen = day ? { cols: 3, rows: 6, seed: 17.3, ang: lightAng, vary: 0.45, soft: 2.2, bars: 0.035, barsV: 0, barDepth: 0.3, feather: 0.07, arch: { h: G.wide ? 0.115 : 0.13, lobes: 7, depth: 0.17, soft: 0.07, clear: 1, transom: 0.07, transomDepth: 0.25, point: 0.32, boost: 0.04 } }
      : dusk ? { cols: 5, rows: 10, seed: 29.1, ang: lightAng, vary: 0.8, round: 0.85, soft: 2 }
      : { cols: 4, rows: 7, seed: 41.7, ang: lightAng, bars: 0.09, vary: 0.3, soft: 1.5 };
    const lightK = zk(0.45, day ? 0.45 : 0.6, 0, day ? 0.3 : 0, !dusk), offSheet = zk(0, 0, 1);
    // where the light lies on the rug's red its glaze is laid full, so the red deepens; on the pale lime floor only a little
    // of it, so the floor goes to a warm pale gold and not to orange paint
    const onRug = (x, y) => { const r = L.rug, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0), u = (x - r.cx) * c + (y - r.cy) * s, v = -(x - r.cx) * s + (y - r.cy) * c; return sstep(Math.min(r.w / 2 - Math.abs(u), r.h / 2 - Math.abs(v)) / 4 + 0.5); };
    // and the cat takes less of the lift than the floor does, so its line holds in the light: by day a good deal less, under
    // the moon a little less, so the lattice still lies across it but it does not go to a ghost
    const catSoft = (x, y) => { const c = L.cat, s = c[2], e = (ex, ey, rx, ry) => Math.hypot((x - ex) / rx, (y - ey) / ry); return 1 - sstep((Math.min(e(c[0] - s * 0.093, c[1] + s * 0.08, s * 0.4, s * 0.23), e(c[0] + s * 0.36, c[1] + s * 0.06, s * 0.15, s * 0.15)) - 0.85) / 0.3); };
    const beamK = (dx, dy) => { const f = lightK(dx, dy), cut = day ? 0.7 : night ? 0.35 : 0; return cut ? (x, y) => f(x, y) * (1 - cut * catSoft(x - dx, y - dy)) : f; };
    box(day ? 'jali' : dusk ? 'shaft' : 'moon', B.patch, (A, dx, dy) => M.jaliScumble(A, shift(G.patch, dx, dy), Object.assign({
      c: lightC[0], c2: lightC[1], p: day ? 0.55 : dusk ? 0.6 : 0.32, amb: night ? 0.08 : day ? 0.12 : 0.08, k: beamK(dx, dy),
      len: day ? 16 : dusk ? 20 : 16, wid: dusk ? 3 : 2.6, drag: day ? 0.15 : dusk ? 0.2 : 0.3,
      uneven: night ? 0.3 : day ? 0.25 : 0.4, rub: night ? 1.4 : day ? 1 : 3, rubAng: day ? lightAng : null, feather: night ? 0.4 : 0,
      glints: night ? 0 : day ? 20 : 6, glintOk: (() => { const f = offSheet(dx, dy), c = L.cat, s = c[2], inE = (x, y, ex, ey, rx, ry) => ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 < 1;
        // never on the cat: the gold is in the floor, not in its fur
        const onCat = (x, y) => inE(x, y, c[0] - s * 0.093, c[1] + s * 0.08, s * 0.43, s * 0.25) || inE(x, y, c[0] + s * 0.36, c[1] + s * 0.06, s * 0.16, s * 0.16);
        return (x, y) => f(x, y) > 0.95 && !onCat(x - dx, y - dy); })(), gc: day ? '#ffdc80' : '#ffd08a'
    }, screen)));
    // and the same screen on the multiplying layer: the stone between the openings a clear cool indigo, the openings glazed warm.
    // By day the bars are lifted off the paintings, so they lie only on the floor, the cat and the margins of the sheets
    const shadeK = zk(1, 0.8, 0, day ? 0.9 : 0);
    // by day the glaze in the beam is a deep saffron, so the red under it goes to vermilion, and round the beam the floor
    // is laid a little cooler and lower so the light reads
    if (!night) box(day ? 'jalitint' : 'shafttint', B.tint, (A, dx, dy) => M.jaliTint(A, shift(G.patch, dx, dy), Object.assign({ cool: day ? '#7a70c8' : '#6a54b8', pc: day ? 0.1 : 0.16, warm: day ? '#ffb45c' : '#ffa868', pw: day ? 0.26 : 0.24, len: day ? 34 : 24, drag: day ? 0.35 : 0.25, k: shadeK(dx, dy),
      halo: day ? { c: '#7a7498', p: 0.3, r: 40 } : null, kWarm: day ? (x, y) => 0.35 + 0.65 * onRug(x - dx, y - dy) : null }, screen)));
    // the shadows of leaves outside, in the light: cool and clear, scumbled; never across a title
    const lv = G.leaf, leafC = day ? '#4a58b4' : dusk ? '#5e3a72' : '#1c2672';
    for (let k = 0; k < 3; k++) box('leaves' + k, B.leaves, (A, dx, dy) => M.leafShadows(A, lv[0] + dx, lv[1] + dy, lv[2], lv[3], leafC, { ph: k * 1.3, n: 9, p: day ? 0.3 : dusk ? 0.38 : 0.3, blur: dusk ? 6 : 4, bend: dusk ? 0.6 : 1, k: shadeK(dx, dy), paint: { ang: lv[3] + 0.35, len: 16, wid: 2.4, amt: day ? 0.4 : dusk ? 0.3 : 0.5 } }));
    // dust turning in the light
    if (!night) for (let k = 0; k < 3; k++) cel('mote' + k, 16, 16, 8, 8, (A, x, y) => M.mote(A, x, y, 0.8 + k * 0.2, dusk ? '#ffd29a' : '#fff0c8'));
    // the flame and its pool of light: a warm scumble on the floor round the stand, the dish's shadow at its foot
    if (!day) {
      for (let k = 0; k < 3; k++) box('flame' + k, B.flame, (A, dx, dy, T) => M.floorFlame(A, G.spout[0] + dx, G.spout[1] + dy, G.flameH, -Math.PI / 2, k * 2.1, c => A.col(c)));
      const poolK = zk(0.4, 0.5, 0);
      for (let k = 0; k < 2; k++) box('lampglow' + k, B.glow, (A, dx, dy) => M.lampGlow(A, G.glowAt[0] + dx, G.glowAt[1] + dy, G.poolR, night ? 1 : 0.75, {
        at: [G.pool[0] + dx, G.pool[1] + dy], box: [G.poolBox[0] + dx, G.poolBox[1] + dy, G.poolBox[2] + dx, G.poolBox[3] + dy], reach: G.poolReach,
        hole: (x, y) => G.poolHole(x - dx, y - dy), k: poolK(dx, dy), rub: 3,
        c0: night ? '#8a3e14' : '#9a4a1c', c1: '#d9822c', c2: '#f0b048', c3: '#ffe2a0',
        // at night the pool is rubbed out with the finger into one soft bloom, the stick's drag barely showing
        bloom: night ? 5 : 0, roughK: night ? 0.5 : 1 }));
    }
    /* at night the flame's light does not stop at the pool: it runs on, thin and warm, across the rug to the nearest sheets
       (Dalal Street, Shelf's lower corner) and dies away with distance; rubbed in unevenly, a little less at the dish's foot */
    if (night) box('lampwarm', B.warm, (A, dx, dy) => {
      const b = B.warm, poly = [[b[0] + dx, b[1] + dy], [b[2] + dx, b[1] + dy], [b[2] + dx, b[3] + dy], [b[0] + dx, b[3] + dy]], sd = A.rr(0, 40);
      M.floorWash(A, poly, '#a0521c', (x, y) => {
        const sx = x - dx, sy = y - dy, d = G.poolD(sx, sy);
        if (d >= 1.6) return 0;
        return G.warmCut(sx) * 0.5 * Math.pow(1 - sstep((d - 0.45) / 1.15), 1.3) * (0.55 + 0.45 * sstep(d / 0.7)) * (0.78 + 0.44 * A.fbm(sx / 110 + sd, sy / 110 - sd, 3, 6)) * (1 - 0.6 * G.poolHole(sx, sy));
      });
    });
    // at night the candle catches on the gold: on the sun's heart and rays, on the booklet of leaf; never on a sheet
    if (night) {
      const toLamp = (p) => [G.pool[0] - p[0], G.pool[1] - p[1]], s = L.sun;
      // and on the side toward the flame a few hard white points, where the leaf faces it squarely
      for (let k = 0; k < 2; k++) box('sunglint' + k, B.sunG, (A, dx, dy) => { const ok = offSheet(dx, dy); M.goldGlints(A, s[0] + dx, s[1] + dy, s[2], toLamp(s), [[0, 0.31, 10, 0.55], [0.5, 1.02, 14, 0.26]], { ok, seed: k * 31 + 7, s: 1.2, white: [[0.08, 0.29, 2 + k], [0.55, 0.95, 4 - k]] }); });
      for (let k = 0; k < 2; k++) box('bookglint' + k, B.bookG, (A, dx, dy) => { const ok = offSheet(dx, dy); M.goldGlints(A, G.bookAt[0] + dx, G.bookAt[1] + dy, L.book[2] * 0.9, toLamp(G.bookAt), [[0, 1, 4, 0.24]], { ok, seed: k * 17 + 3, s: 0.8, white: [[0.15, 0.9, 2 - k]] }); });
    }
    // a brass weight on a folio's corner, to keep it flat: it lies over the sheet
    boxAt('weight', B.weight, G.weightAt, (A, dx, dy, T) => M.brassWeight(A, G.weightAt[0] + dx, G.weightAt[1] + dy, G.weightAt[2], T));
    // fireflies that came in through the jali
    if (night) for (let k = 0; k < 3; k++) cel('firefly' + k, 28, 28, 14, 14, (A, x, y) => { M.lampGlow(A, x, y, 10 + k * 1.5, 0.9, { c0: '#3e5a1c', c1: '#9cc23e', c2: '#d8f07a', c3: '#f6ffd0' }); A.dot(x, y, 'chalk', '#f4ffc8', { w: 2.4, p: 1 }); });
    /* night lies over the folios too.  The page lays the sheets bright, so on a sheet this glaze is the whole of the room's
       dark: a sheet across the room from the lamp goes as low as the rug round it, and lifts toward the flame.  On the floor,
       already dark in the still picture, it only deepens with distance.  Nearly grey, like the floor's, never blue.  Near the
       lamp it turns to a warm amber glaze, and the warmth stays in the left third of the room */
    if (night) box('dark', B.veil, (A, dx, dy) => {
      const v = B.veil, poly = [[v[0] + dx, v[1] + dy], [v[2] + dx, v[1] + dy], [v[2] + dx, v[3] + dy], [v[0] + dx, v[3] + dy]], sd = A.rr(0, 40);
      // the title panels are kept only a very little thinner than the rest, so their yellow goes down to ochre with the room
      const zT = G.zone(0.3, 0.3, 0, 0, true), offS = G.zone(0, 0, 1);
      // laid in long, faint drags of the stick's side and fuller in some places than others, so it is never flat
      const ca = Math.cos(-0.35), sa = Math.sin(-0.35);
      M.floorWash(A, poly, '#1f2230', (x, y) => {
        const sx = x - dx, sy = y - dy, u = (sx - v[0]) / (v[2] - v[0]), w = (sy - v[1]) / (v[3] - v[1]);
        const edge = sstep(Math.min(u, 1 - u, w, 1 - w) / 0.1), lamp = sstep((G.poolD(sx, sy) - 0.3) / 1.5), moon = 1;
        const drag = A.noise2((sx * ca - sy * sa) / 260 + sd, (sx * sa + sy * ca) / 11, 2);
        // and deeper the further from the lamp: the sheets across the room sit lower than those beside it
        const far = sstep((Math.hypot(sx - G.pool[0], sy - G.pool[1]) - 460) / 600), on = 1 - offS(sx, sy);
        const wF = edge * (0.04 + 0.2 * lamp + 0.1 * far), wS = 0.32 + 0.3 * lamp + 0.1 * far;
        return (wF + (wS - wF) * on) * moon * zT(sx, sy) * (0.9 + 0.2 * A.fbm(sx / 140 + sd, sy / 140, 3, 5) + 0.06 * (drag - 0.5));
      });
      M.floorWash(A, poly, '#f29a4c', (x, y) => {
        const sx = x - dx, sy = y - dy, u = (sx - v[0]) / (v[2] - v[0]), w = (sy - v[1]) / (v[3] - v[1]);
        const edge = sstep(Math.min(u, 1 - u, w, 1 - w) / 0.03);
        return edge * G.warmCut(sx) * 0.44 * Math.pow(1 - sstep((G.poolD(sx, sy) - 0.25) / 1.6), 1.2) * (0.85 + 0.3 * A.fbm(sx / 90 - sd, sy / 90, 3, 5));
      });
    });
    return C;
  };

  /* ====================================================================== WHAT THE PAGE DOES WITH THEM */
  P.actors = function (G) {
    const { night, dusk, day } = G, B = G.boxes, a = [];
    const at = b => ({ x: b[0], y: b[1] });
    const three = n => [n + '0', n + '1', n + '2'];
    if (night) a.push(Object.assign({ type: 'still', layer: 'shade', z: 1, cel: 'dark' }, at(B.veil)));
    a.push(Object.assign({ type: 'sway', layer: 'under', z: 2, cels: ['ring0', 'ring1', 'ring2', 'ring3'], every: [6, 14], hold: 4, seq: [1, 2, 3, 0] }, at(B.ring)));
    a.push(Object.assign({ type: 'sway', layer: 'under', z: 3, cels: three('leaf'), every: [5, 11], hold: 3 }, at(B.leaf)));
    a.push(Object.assign({ type: 'sway', layer: 'under', z: 4, cels: three('feather'), every: night ? [9, 18] : [4, 9], hold: 3 }, at(B.feather)));
    a.push(Object.assign({ type: 'boil', layer: 'under', z: 5, cels: three('cat'), hold: 9, seq: [0, 1, 2, 1] }, at(B.cat)));
    a.push(Object.assign({ type: 'breeze', layer: 'shade', z: 6, cels: three('leaves'), amp: dusk ? [16, 6] : [10, 5], period: dusk ? 9 : 7, hold: 6 }, at(B.leaves)));
    if (!night) a.push(Object.assign({ type: 'still', layer: 'shade', z: 5.5, cel: day ? 'jalitint' : 'shafttint' }, at(B.tint)));
    a.push(Object.assign({ type: 'still', layer: 'glow', z: 7, cel: day ? 'jali' : dusk ? 'shaft' : 'moon', alpha: night ? 0.62 : day ? 0.66 : 1 }, at(B.patch)));
    if (!night) a.push({ type: 'twinkle', layer: 'glow', z: 8, cels: three('mote'), box: B.patch, n: day ? 9 : 7, every: [1.2, 3.2] });
    if (night) a.push(Object.assign({ type: 'still', layer: 'glow', z: 8.8, cel: 'lampwarm' }, at(B.warm)));
    if (!day) {
      a.push(Object.assign({ type: 'flicker', layer: 'glow', z: 9, cels: ['lampglow0', 'lampglow1'], hold: 3, alpha: night ? [0.78, 1] : [0.62, 0.86] }, at(B.glow)));
      a.push(Object.assign({ type: 'boil', layer: 'top', z: 10, cels: three('flame'), hold: 2 }, at(B.flame)));
    }
    if (night) {
      a.push(Object.assign({ type: 'flicker', layer: 'glow', z: 9.5, cels: ['sunglint0', 'sunglint1'], hold: 3, alpha: [0.35, 0.7] }, at(B.sunG)));
      a.push(Object.assign({ type: 'flicker', layer: 'glow', z: 9.6, cels: ['bookglint0', 'bookglint1'], hold: 3, alpha: [0.25, 0.55] }, at(B.bookG)));
    }
    a.push(Object.assign({ type: 'still', layer: 'top', z: 12, cel: 'weight' }, at(B.weight)));
    if (night) a.push({ type: 'twinkle', layer: 'glow', z: 11, cels: three('firefly'), box: G.wide ? [900, 380, 1500, 820] : [400, 480, 790, 820], n: 5, every: [1.4, 3.6] });
    return a;
  };

  /* ====================================================================== PAPER
     The frieze for the head of the page, the dado for its foot, and the slip that carries the page's name.
     Each is drawn on black and on white to find its alpha, so the paper is laid down solid, pixel by pixel. */
  P.papers = function () {
    const { hl } = M.cityHand, out = [];
    const RED = '#b3301f', MAROON = '#7a1321';
    const sheet = (A, poly, c, grain) => {
      const mk = A.pushMask(poly); A.popMask();
      const col = A.col(c);
      for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
        const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
        const X = x + mk.x0, Y = y + mk.y0, i = Y * A.W + X;
        const g = 1 + grain * ((A.noise2(X / 52, Y / 52, 3) - 0.5) * 0.7 + (A.noise2(X / 6, Y / 6, 5) - 0.5) * 0.7 + (A.HM[i] - 0.5) * 0.6);
        A.R[i] += (Math.min(1, col[0] * g) - A.R[i]) * v; A.G[i] += (Math.min(1, col[1] * g) - A.G[i]) * v; A.B[i] += (Math.min(1, col[2] * g) - A.B[i]) * v;
      }
    };
    // the two ends of a strip made to meet: the last few columns and the first few eased toward their common mean
    const seam = (A, b) => {
      const W = A.W, H = A.H, ch = [A.R, A.G, A.B];
      for (let y = 0; y < H; y++) for (const C of ch) {
        const o = y * W; let e0 = 0, e1 = 0; for (let k = 0; k < 4; k++) { e0 += C[o + k]; e1 += C[o + W - 1 - k]; } e0 /= 4; e1 /= 4;
        const m = (e0 + e1) / 2;
        for (let i = 0; i < b; i++) { const k = 1 - i / b; C[o + i] += (m - e0) * k; C[o + W - 1 - i] += (m - e1) * k; }
      }
    };
    // a rule run right across, with a wobble that has a whole number of waves so its two ends meet
    const rule = (A, y, tool, c, w, p, ph) => {
      const pts = []; for (let x = -12; x <= 1612; x += 8) pts.push([x, y + 0.28 * Math.sin(x / 1600 * TAU * 7 + ph) + 0.12 * Math.sin(x / 1600 * TAU * 23 + ph * 2)]);
      A.stroke(pts, tool, c, { w, p, tin: 0, tout: 0, wob: 0.2 });
    };

    out.push({ file: 'paper-frieze.webp', w: 1600, h: 40, S: 1.5, q: 86, draw: A => {
      const strip = [[-2, -2], [1602, -2], [1602, 42], [-2, 42]];
      sheet(A, strip, RED, 0.05);
      A.fill(strip, 'pastel', RED, { w: 6, p: 0.7, reach: 1.5, passes: 1, gap: 0.5, ang: 0.004, cv: 0.01 });
      A.fill(strip, 'chalk', A.mix(RED, 'maroon', 0.45), { w: 2, p: 0.26, passes: 1, gap: 2.8, ang: 0.004, cv: 0.01 });
      // the vine: a whole number of waves along the strip
      const vy = x => 20 + 5.2 * Math.sin(x / 80 * TAU);
      const stem = []; for (let x = -10; x <= 1610; x += 3) stem.push([x, vy(x)]);
      A.stroke(stem, 'chalk', A.mix('malachite', 'sap', 0.3), { w: 1.6, p: 0.95, tin: 0, tout: 0 });
      for (let k = 0; k < 40; k++) {
        // leaves where the stem crosses the middle; a flower at each crest
        for (const xo of [0, 40]) {
          const x = k * 80 + xo, up = xo === 0 ? -1 : 1;
          for (const sg of [-1, 1]) {
            const b0 = [x + sg * 3, vy(x + sg * 3)], tip = [x + sg * 11, vy(x) + up * 7.5 * (sg > 0 ? 1 : -1)];
            const m = [(b0[0] + tip[0]) / 2, (b0[1] + tip[1]) / 2], d = [tip[0] - b0[0], tip[1] - b0[1]], dl = Math.hypot(d[0], d[1]), nn = [-d[1] / dl * 2.4, d[0] / dl * 2.4];
            A.shape(A.spline([b0, [m[0] + nn[0], m[1] + nn[1]], tip, [m[0] - nn[0], m[1] - nn[1]]], true, 1.2), { c: A.chance(0.5) ? 'malachite' : A.mix('sap', 'malachite', 0.5), w: 1.6, rough: 0.15, line: false });
          }
        }
        for (const xo of [20, 60]) {
          const x = k * 80 + xo + A.rr(-0.6, 0.6), y = vy(k * 80 + xo) + (xo === 20 ? 1.5 : -1.5), r = A.rr(4.6, 5.4), a0 = A.rr(0, 1.2);
          for (let j = 0; j < 5; j++) { const a = a0 + j * 1.2566 + A.rr(-0.1, 0.1); A.stroke([[x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25], [x + Math.cos(a) * r, y + Math.sin(a) * r]], 'chalk', 'khadi', { w: r * 0.8, p: 0.95, reach: 1.5, tin: 0.1, tout: 0.25 }); }
          A.dot(x, y, 'chalk', 'haldi', { w: r * 0.6, p: 1, reach: 1.5 });
          A.dot(x, y, 'kajal', 'maroon', { w: 0.9, p: 0.6 });
        }
      }
      // little dots of gold and haldi along both edges, inside the rules
      for (let x = 5; x < 1600; x += 10) { A.dot(x + A.rr(-0.3, 0.3), 8.6, 'chalk', 'haldi', { w: 1.5, p: 0.9 }); A.dot(x + 5 + A.rr(-0.3, 0.3), 31.4, 'chalk', 'haldi', { w: 1.5, p: 0.9 }); }
      rule(A, 2.4, 'kajal', 'kajal', 1.4, 0.9, 0); rule(A, 5.2, 'gold', 'gold', 1.9, 0.95, 1);
      rule(A, 34.8, 'gold', 'gold', 1.9, 0.95, 2); rule(A, 37.6, 'kajal', 'kajal', 1.4, 0.9, 3);
      seam(A, 18);
    } });

    out.push({ file: 'paper-dado.webp', w: 1600, h: 40, S: 1.5, q: 86, draw: A => {
      const strip = [[-2, -2], [1602, -2], [1602, 42], [-2, 42]];
      sheet(A, strip, MAROON, 0.05);
      A.fill(strip, 'pastel', A.mix(MAROON, 'lac', 0.3), { w: 6, p: 0.6, reach: 1.5, passes: 1, gap: 0.5, ang: 0.004 });
      // the petals behind, then the petals in front
      for (const back of [true, false]) for (let k = 0; k < 50; k++) {
        const cx = k * 32 + (back ? 0 : 16) + A.rr(-0.3, 0.3), base = 35.5, tip = back ? 10 : 7.6 + A.rr(-0.5, 0.5), hw = back ? 11 : 13.6, curl = A.rr(-1.4, 1.4);
        // a lotus petal: a narrow foot, a full body, drawn to a point that turns a little to one side
        const petal = (sc, b0) => { const out = [], t0 = b0 - (b0 - tip) * 0, pts = 18;
          for (let j = 0; j <= pts; j++) { const v = j / pts, w2 = sc * hw * Math.sin(Math.PI * (0.13 + 0.87 * v)) * (1 - 0.18 * v * v * v); out.push([cx - w2 + curl * v * v, t0 - (t0 - tip - (1 - sc) * 6) * v]); }
          for (let j = pts; j >= 0; j--) { const v = j / pts, w2 = sc * hw * Math.sin(Math.PI * (0.13 + 0.87 * v)) * (1 - 0.18 * v * v * v); out.push([cx + w2 + curl * v * v, t0 - (t0 - tip - (1 - sc) * 6) * v]); }
          return out; };
        const pet = petal(1, base);
        if (back) { A.shape(pet, { c: A.mix('lac', 'hingul', 0.45), w: 2.4, rough: 0.2, line: 'kajal', lw: 0.6, lp: 0.6 });
          A.stroke([[cx, base - 2], [cx + curl * 0.4, tip + 6]], 'chalk', A.mix('lac', 'maroon', 0.4), { w: 0.7, p: 0.5 }); continue; }
        A.fill(pet, 'pastel', A.mix('khadi', 'peach', A.rr(0.1, 0.3)), { w: 2.6, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: 1.57 });
        A.withMask(pet, () => {
          // the blush runs down from the tip
          A.fill(A.ellipse(cx + curl, tip + 6, hw * 0.9, 10), 'chalk', 'gulabi', { w: 2.2, p: 0.9, reach: 1.5, passes: 2, gap: 0.45 });
          A.fill(A.ellipse(cx + curl, tip + 2.5, hw * 0.45, 4.5), 'chalk', 'rose', { w: 1.8, p: 0.85, reach: 1.4, passes: 1, gap: 0.5 });
          A.blend(A.ellipse(cx, tip + 12, hw, 8), { r: 2.4, k: 0.5 });
          // the shade low in the petal, where it curves away
          A.stroke([[cx - hw * 0.5, base - 1.2], [cx, base - 3], [cx + hw * 0.5, base - 1.2]], 'side', 'sand', { w: 4, p: 0.42 });
        });
        // the inner line that every painted lotus petal has, and its vein
        A.outline(petal(0.66, base - 1), 'chalk', A.mix('rose', 'gulabi', 0.4), { closed: true, w: 0.6, p: 0.6 });
        A.stroke([[cx, base - 2], [cx + curl * 0.3, (base + tip) / 2], [cx + curl * 0.7, tip + 6]], 'chalk', 'rose', { w: 0.8, p: 0.65 });
        A.outline(pet, 'kajal', 'kajal', { closed: true, w: 0.75, p: 0.8 });
      }
      // the foot: a yellow band with a run of dots
      sheet(A, [[-2, 36], [1602, 36], [1602, 42], [-2, 42]], '#e9b53c', 0.04);
      for (let x = 4; x < 1600; x += 8) A.dot(x + A.rr(-0.3, 0.3), 38.4, 'chalk', MAROON, { w: 1.3, p: 0.8 });
      rule(A, 35.6, 'kajal', 'kajal', 1.2, 0.9, 0.5);
      rule(A, 2.4, 'gold', 'gold', 1.9, 0.95, 1.5); rule(A, 5, 'kajal', 'kajal', 1.2, 0.9, 2.5);
      seam(A, 18);
    } });

    out.push({ file: 'paper-slip.webp', w: 220, h: 80, S: 2.5, q: 90, draw: A => {
      // the slip, torn from a bigger sheet along its left and lower edges
      const top = [], rt = [], bot = [], lf = [];
      for (let x = 10; x <= 204; x += 3) top.push([x, 11 + A.rr(-0.25, 0.25)]);
      for (let y = 11; y <= 70; y += 3) rt.push([204 + A.rr(-0.25, 0.25), y]);
      for (let x = 204; x >= 10; x -= 2) bot.push([x, 70 + (A.noise1 ? 0 : 0) + 1.6 * Math.sin(x * 0.21) * A.rr(0.4, 1) + A.rr(-0.8, 0.8)]);
      for (let y = 70; y >= 11; y -= 2) lf.push([10 + 1.8 * Math.sin(y * 0.37) * A.rr(0.4, 1) + A.rr(-0.9, 0.9), y]);
      const edge = top.concat(rt, bot, lf);
      // its shadow on the floor, and the stone's
      A.fill(shift(edge, 2.6, 3.4), 'shade', 'umber', { w: 4, p: 0.42, passes: 2, gap: 0.5 });
      A.blend(shift(A.roughen(edge, 1, 10, true), 3, 4), { r: 3, k: 0.5 });
      sheet(A, edge, '#f2e7cd', 0.05);
      A.withMask(edge, () => {
        A.outline(edge, 'shade', 'sand', { closed: true, w: 4, p: 0.34, pull: 80 });
        A.outline(edge, 'shade', 'ochre', { closed: true, w: 1.6, p: 0.24, pull: 60 });
        // the torn edges show the paper's fibre, a paler line just inside
        A.stroke(bot.map(p => [p[0], p[1] - 1.2]), 'chalk', 'khadi', { w: 1.1, p: 0.6 });
        A.stroke(lf.map(p => [p[0] + 1.2, p[1]]), 'chalk', 'khadi', { w: 1.1, p: 0.6 });
        // a fold across it, long ago
        A.stroke([[78, 11], [80, 40], [79, 70]], 'shade', 'stone', { w: 1.6, p: 0.2 });
        for (let i = 0; i < 5; i++) A.dot(A.rr(20, 190), A.rr(16, 66), 'shade', A.chance(0.5) ? 'ochre' : 'sand', { w: A.rr(1, 2.6), p: A.rr(0.2, 0.4) });
        // a ruled line in red at the left, the way a slip is marked for a book's page
        hl(A, [20, 16], [20, 66], 'kajal', RED, { w: 0.8, p: 0.7, ov: 0.6 });
      });
      // the weight: a flat river pebble, matte and grey-green, speckled, a vein of white quartz running across it
      const cx = 189, cy = 18, rx = 20, ry = 13.5, ra = -0.24, st = A.roughen(A.spline(A.ellipse(cx, cy, rx, ry, ra).map((q, i) => [q[0] + (i % 5 === 2 ? A.rr(-1.2, 1.2) : 0), q[1] + (i % 7 === 3 ? A.rr(-1, 1) : 0)]), true, 1), 0.35, 8, true);
      A.fill(shift(st, 2.2, 3), 'shade', 'umber', { w: 3, p: 0.5, passes: 2, gap: 0.5 });
      A.blend(shift(st, 3, 4), { r: 2.6, k: 0.45 });
      A.fill(st, 'pastel', A.mix(A.mix('stone', 'sage', 0.35), 'slate', 0.15), { w: 2.4, p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: ra });
      A.withMask(st, () => {
        // round and dull: the light lies broad on the upper side, the lower side goes into shade
        A.fill(A.ellipse(cx - 4, cy - 4, rx * 0.8, ry * 0.6, ra), 'side', A.mix('stone', 'khadi', 0.55), { w: 6, p: 0.5, ang: ra });
        A.fill(A.ellipse(cx + 5, cy + 6, rx * 0.85, ry * 0.55, ra), 'side', A.mix('slate', 'umber', 0.35), { w: 6, p: 0.45, ang: ra });
        A.blend(st, { r: 2.2, k: 0.45 });
        // the vein of quartz, a little wavy, and a thread beside it
        const vein = []; for (let t = -1.1; t <= 1.101; t += 0.1) vein.push([cx + t * rx * Math.cos(ra + 0.62) - 2, cy + t * rx * Math.sin(ra + 0.62) + Math.sin(t * 3.1) * 1.3 + 1]);
        A.stroke(vein, 'chalk', '#f3eee2', { w: 2, p: 0.85, tin: 0.05, tout: 0.05 });
        A.stroke(vein.map(q => [q[0] + 3.4, q[1] - 1.2]), 'chalk', A.mix('khadi', 'stone', 0.4), { w: 0.6, p: 0.6 });
        // speckles of darker and paler grain
        for (let i = 0; i < 46; i++) A.dot(cx + A.rr(-rx, rx), cy + A.rr(-ry, ry), 'chalk', A.pick([A.mix('slate', 'kajal', 0.3), A.mix('umber', 'stone', 0.3), 'khadi', A.mix('ochre', 'stone', 0.5)]), { w: A.rr(0.4, 1.1), p: A.rr(0.45, 0.8) });
        // a dull sheen, never a gloss
        A.stroke(A.ellipse(cx - 3, cy - 3.5, rx * 0.55, ry * 0.45, ra, 3.4, 4.6), 'side', '#f8f3e6', { w: 3.4, p: 0.32, tin: 0.4, tout: 0.4 });
      });
      A.outline(st, 'kajal', A.mix('umber', 'slate', 0.4), { closed: true, w: 0.55, p: 0.55 });
    } });
    // the card a project's details are written on in the dialog: cream wasli with a red rule and an ochre pencil line inside it
    const frameRule = (A, w, h, r, tool, c, o) => { for (const q of [[[r, r], [w - r, r]], [[w - r, r], [w - r, h - r]], [[w - r, h - r], [r, h - r]], [[r, h - r], [r, r]]]) hl(A, q[0], q[1], tool, c, o); };
    out.push({ file: 'paper-card.webp', w: 240, h: 150, S: 2, draw: A => {
      const w = 240, h = 150, e = 2.6, edge = A.roughen([[e, e], [w - e, e], [w - e, h - e], [e, h - e]], 1, 9, true);
      sheet(A, edge, '#f6f0e2', 0.035);
      A.withMask(edge, () => {
        A.outline(edge, 'shade', 'sand', { closed: true, w: 3, p: 0.3, pull: 90 });
        frameRule(A, w, h, 7.6, 'kajal', RED, { w: 1.75, p: 0.95, ov: 2.4 });
        frameRule(A, w, h, 11, 'pencil', 'ochre', { w: 0.95, p: 0.9, ov: 1.6 });
      });
    } });
    return out;
  };

  return P;
})();
