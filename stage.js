/* ------------------------------------------------------------------ *
 *  THE LAKE, MOVING
 *
 *  The same lake garden as before, now set out the way an animated
 *  film is: one finished background, and on top of it loose drawings
 *  ("cels") of everything that moves.  The background is drawn once.
 *  The cranes, the boat, the clouds, the light on the water are each
 *  drawn several times over, a little differently every time, so that
 *  when the page shows them one after another they move and the line
 *  trembles the way a hand-drawn film does.
 *
 *  STAGE.geom       where everything stands (no marks made)
 *  STAGE.background the still picture, without what moves
 *  STAGE.sketch     the first lines in red earth
 *  STAGE.cels       the loose drawings: [{ name, w, h, ax, ay, draw }]
 *  STAGE.actors     what the page does with them
 * ------------------------------------------------------------------ */
const STAGE = {};

STAGE.rng = function (seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();
  return { rnd, rr, ri: (a, b) => Math.floor(a + (b - a + 1) * rnd()), pick: a => a[(rnd() * a.length) | 0], chance: p => rnd() < p };
};

STAGE.geom = function (fmt, mood) {
  const wide = fmt !== 'tall', W = wide ? 1600 : 800, H = wide ? 900 : 1250;
  const night = mood === 'night', dusk = mood === 'dusk';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const bump = (u, c, s) => Math.exp(-((u - c) / s) * ((u - c) / s)), sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const G = { fmt: wide ? 'wide' : 'tall', mood, W, H, wide, night, dusk, zone: night ? 'C' : 'B', grass: night ? 'bottle' : dusk ? 'olive' : 'sap', clamp, lerp };
  const R = STAGE.rng(4711 + (night ? 1 : 0) + (wide ? 0 : 50)), rr = R.rr, pick = R.pick;

  // ---- the lie of the land: a low open shore on the left, where the words go, and the hills on the right
  const yShore0 = G.yShore0 = H * (wide ? 0.628 : 0.56), yBank0 = G.yBank0 = H * 0.872, yHill = G.yHill = yShore0 - (wide ? 56 : 60);
  const shoreY = G.shoreY = x => yShore0 + 7 * Math.sin(x / 140 + 1.3) + 4 * Math.sin(x / 61 + 0.4);
  const bankY = G.bankY = x => yBank0 + 7 * Math.sin(x / 170 + 0.6) + 4 * Math.sin(x / 73 + 2);
  G.ridgeY = x => { const u = x / W; return yHill - H * ((wide ? 0.052 + 0.158 * bump(u, 0.8, 0.19) : 0.044 + 0.12 * bump(u, 0.74, 0.25)) + 0.01 * Math.sin(u * 19 + 1) + 0.006 * Math.sin(u * 41)); };
  const line = G.line = (fn, xa, xb, st) => { const o = []; for (let x = xa; x <= xb + 0.01; x += st) o.push([x, fn(x)]); return o; };
  G.SHORE = line(shoreY, -30, W + 30, 24); G.BANK = line(bankY, -30, W + 30, 24);
  G.gh = H - yBank0;
  const lakeH = G.lakeH = yBank0 - yShore0;
  const pavW = G.pavW = wide ? 292 : 280, pavX = G.pavX = W * (wide ? 0.735 : 0.655); G.pavY = shoreY(pavX) + 4;
  const boatS = G.boatS = 236, boatX = G.boatX = W * (wide ? 0.37 : 0.385), boatY = G.boatY = lerp(yShore0, yBank0, wide ? 0.5 : 0.45), boatRange = G.boatRange = wide ? 86 : 38;
  const orbX = G.orbX = W * (wide ? 0.565 : 0.25); G.orbY = H * (wide ? (dusk ? 0.31 : night ? 0.17 : 0.19) : (dusk ? 0.37 : 0.3)); G.orbR = dusk ? 36 : 30;
  const depth = G.depth = (x, y) => clamp((y - shoreY(x)) / (bankY(x) - shoreY(x)), 0, 1);
  const lakeTop = x => shoreY(x) + 40, lakeBot = x => bankY(x) - 28;
  const gooseY = G.gooseY = lerp(yShore0, yBank0, wide ? 0.27 : 0.2); G.gooseX = [W * 0.06, W * (wide ? 0.5 : 0.56)];
  G.sky = { u1: wide ? 0.56 : 1, v1: wide ? 0.5 : 0.21 };          // the part of the sky kept clear for the words
  G.fx = W * (wide ? 0.6 : 0.44);                                    // where the animals of the near bank stand
  G.focus = wide ? [0.66, 0.74] : [0.6, 0.3];                      // what stays in view when the window crops the sheet

  // ---- trees of the far bank: low under the open sky, tall around the pavilion
  const trees = G.trees = [];
  {
    const tallK = night ? ['cypress', 'blossom', 'cypress', 'dotted', 'puff', 'cypress', 'palm', 'blossom'] : ['bell', 'dotted', 'cypress', 'blossom', 'puff', 'scale', 'cypress', 'lens', 'radiate', 'weeping'];
    const lowK = ['bell', 'dotted', 'puff', 'blossom', 'scale', 'lens', 'radiate'];
    let x = rr(18, 46), i = R.ri(0, 5);
    while (x < W - 16) {
      const u = x / W, near = Math.abs(x - pavX) < pavW * 0.5 + 6, k = sstep(wide ? 0.45 : 0.3, wide ? 0.62 : 0.55, u);
      const kind = near ? pick(['cypress', 'cypress', 'palm']) : k < 0.5 ? lowK[i++ % lowK.length] : tallK[i++ % tallK.length];
      const lo = wide ? rr(58, 90) : rr(84, 124), hi = kind === 'cypress' ? rr(170, 222) : kind === 'palm' ? rr(190, 230) : rr(122, 190);
      const th = near ? rr(225, 268) : lerp(lo, hi, k);
      trees.push({ x, y: shoreY(x) - rr(12, 28), h: th, kind, near });
      x += near ? rr(86, 112) : lerp(wide ? rr(46, 68) : rr(58, 84), rr(72, 106), k);
    }
    trees.sort((p, q) => p.y - q.y);
  }
  const nx = W - Math.max(74, W * 0.1), gh = G.gh;
  G.nearBase = x => bankY(x) + gh * 0.58;
  G.nearTree = { x: nx, y: G.nearBase(W - 80) - 6, h: clamp(H * (wide ? 0.36 : 0.26), 220, 330) };

  // ---- lamps set afloat from the pavilion steps (night)
  const lamps = G.lamps = [];
  if (night) {
    const sx = pavX - pavW * 0.1, sy = shoreY(sx), cp = [[sx, sy + 40], [sx - W * 0.07, sy + lakeH * 0.3], [sx + W * 0.03, sy + lakeH * 0.52], [sx + W * 0.14, sy + lakeH * 0.7], [Math.min(W - 40, sx + W * (wide ? 0.3 : 0.34)), sy + lakeH * 0.82]];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * (cp.length - 1), j = Math.min(cp.length - 2, Math.floor(t)), f = t - j;
      const p0 = cp[Math.max(0, j - 1)], p1 = cp[j], p2 = cp[j + 1], p3 = cp[Math.min(cp.length - 1, j + 2)];
      const cr = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f * f * f);
      lamps.push({ x: cr(0) + rr(-5, 5), y: cr(1) + rr(-5, 5), s: 13 + i * 1.1, k: 0.75 + i * 0.03 });
    }
  }

  // ---- what floats on the lake.  Things in front of the boat go on a cel of their own so the boat can pass behind them.
  const spots = G.spots = [];
  const inBoatX = (x, r) => Math.abs(x - boatX) < boatRange + boatS * 0.72 + r;
  const pavZone = (x, y, r) => Math.abs(x - pavX) < pavW * 0.56 + r && y < shoreY(x) + pavW * 0.5;
  const taken = (x, y, r, t) =>
    (inBoatX(x, r) && Math.abs(y - (boatY + boatS * 0.03)) < boatS * 0.1 + r * 0.6) ||                 // the lane the hull moves in
    (Math.abs(x - boatX) < boatRange + boatS * 0.5 + r && y < boatY && y > boatY - boatS * 0.42 - r * (t === 'lotus' ? 1.5 : 0.5)) ||   // and the water seen through its cabin
    pavZone(x, y, r) ||
    ((dusk || night) && Math.abs(x - orbX) < 46 + r) ||                                                  // the path of light
    (!night && x > G.gooseX[0] - 30 && x < G.gooseX[1] + 30 && Math.abs(y - gooseY) < 15 + r * 0.7) ||   // where the geese swim
    lamps.some(l => Math.hypot(l.x - x, l.y - y) < 26 + r);
  {
    const place = (n, rmin, rmax, t) => {
      let got = 0;
      for (let k = 0; k < n * 60 && got < n; k++) {
        const x = rr(24, W - 24), y = rr(lakeTop(x), lakeBot(x)), d = depth(x, y), s = 0.58 + 0.72 * d, r = rr(rmin, rmax) * s;
        if (taken(x, y, r, t)) continue;
        if (spots.some(q => Math.hypot(q.x - x, (q.y - y) * 1.5) < (q.r + r) * 1.15)) continue;
        spots.push({ t, x, y, r, s, d, seed: (7001 + spots.length * 977) >>> 0, fg: y > boatY - 4 && inBoatX(x, r) }); got++;
      }
    };
    const area = W * lakeH;
    place(clamp(Math.round(area / 27000), 5, 22), 21, 29, 'lotus');
    place(clamp(Math.round(area / 15000), 8, 40), 14, 24, 'pad');
    spots.sort((p, q) => p.y - q.y);
  }
  // open water, for the fish and the rings
  const open = G.open = [];
  for (let k = 0; k < 900 && open.length < (wide ? 16 : 14); k++) {
    const x = rr(40, W - 40), y = rr(lakeTop(x) + 6, lakeBot(x) - 4), d = depth(x, y), s = 0.58 + 0.72 * d, r = 34 * s;
    if (pavZone(x, y, r) || (inBoatX(x, r) && Math.abs(y - boatY) < boatS * 0.42) || (!night && Math.abs(y - gooseY) < 26 + r * 0.5) || lamps.some(l => Math.hypot(l.x - x, l.y - y) < 40 + r)) continue;
    if (spots.some(q => Math.hypot(q.x - x, (q.y - y) * 1.4) < q.r + r) || open.some(q => Math.hypot(q[0] - x, q[1] - y) < 90)) continue;
    open.push([Math.round(x), Math.round(y), +s.toFixed(2)]);
  }
  return G;
};

// one lotus or pad of the lake, the same whichever sheet it is drawn on
STAGE.spot = function (A, G, s, dx, dy) {
  const rr = A.rr, x = s.x + (dx || 0), y = s.y + (dy || 0);
  A.reseed(s.seed);
  if (s.t === 'pad') { M.lotusPad(A, x, y, s.r, { rot: rr(0, 6.28) }); return; }
  const kind = G.night ? 'white' : G.dusk ? A.pick(['open', 'half', 'white', 'bud']) : A.pick(['open', 'open', 'half', 'bud']);
  M.lotusPad(A, x + s.r * rr(0.75, 1.1) * (A.chance(0.5) ? 1 : -1), y + s.r * 0.4, s.r * 0.82, { rot: rr(0, 6.28) });
  M.lotus(A, x, y, s.r * 2, kind, { stem: s.r * rr(0.9, 1.3), bend: rr(-0.15, 0.15) });
};

/* ======================================================================== THE STILL PICTURE */
STAGE.background = function (A, G, say) {
  const { W, H, night, dusk, zone, grass, yHill, yShore0, yBank0, gh, shoreY, bankY, ridgeY, line, SHORE, BANK, pavX, pavY, pavW, orbX, orbY } = G;
  const rr = A.rr, K = {};
  let n = 0;
  const part = name => { if (say) say(name); A.reseed(9001 + (++n) * 7919 + (night ? 13 : dusk ? 7 : 0) + (G.wide ? 0 : 101)); };

  part('sky');
  {
    const sky = [[-12, -12], [W + 12, -12], [W + 12, yHill + 12], [-12, yHill + 12]];
    const low = [[-12, yHill - H * 0.2], [W + 12, yHill - H * 0.17], [W + 12, yHill + 12], [-12, yHill + 12]];
    if (night) {
      A.ground(sky, 'night', { ang: -0.62, w: 34, edge: 0 });
      A.fill(low, 'side', 'neel', { w: 30, p: 0.3, passes: 1, ang: -0.1, reach: 1, flow: 0.5 });
    } else if (dusk) {
      A.ground(sky, 'saffron', { ang: -0.5, w: 34, edge: 0 });
      A.fill([[-12, -12], [W + 12, -12], [W + 12, H * 0.1], [-12, H * 0.13]], 'side', 'rose', { w: 30, p: 0.6, passes: 1, ang: -0.08, reach: 1.15, flow: 0.65 });
      A.fill(low, 'side', 'peori', { w: 30, p: 0.5, passes: 1, ang: -0.1, reach: 1.1, flow: 0.6 });
    } else {
      A.ground(sky, 'sky', { ang: -0.5, w: 34, edge: 0 });
      A.fill(low, 'side', 'ice', { w: 30, p: 0.5, passes: 1, ang: -0.1, reach: 1.1, flow: 0.6 });
    }
  }
  part('sun or moon');
  {
    if (night) {
      M.stars(A, [[0, 0], [W, 0], [W, yHill - H * 0.08], [0, yHill - H * 0.08]], { spacing: 25 });
      M.moon(A, orbX, orbY, 30);
    } else M.sun(A, orbX, orbY, G.orbR);
    // thin streaks low in the sky stay where they are; the scalloped clouds are cels and drift
    const st = (u, v, len) => M.cloudBand(A, [[W * u, H * v], [W * u + len * 0.5, H * v - rr(4, 9)], [W * u + len, H * v + rr(-4, 5)]], 10, night ? { kind: 'streak', n: 3, c: 'storm' } : { kind: 'streak', n: 3 });
    const hv = yHill / H;
    st(0.03, hv - 0.105, Math.min(250, W * 0.3)); st(G.wide ? 0.3 : 0.5, hv - 0.15, Math.min(210, W * 0.26));
  }
  part('far hills');
  K.hill = M.rockHill(A, [[-60, yHill]].concat(line(ridgeY, -40, W + 40, 62), [[W + 60, yHill]]), yHill + 6, { palette: night ? 'night' : 'green', size: 1.05 });
  part('far bank');
  {
    const fb = [[-12, yHill - 8], [W + 12, yHill - 8]].concat(SHORE.slice().reverse());
    A.ground(fb, grass, { ang: -0.3, w: 28, edge: 1.2 });
    A.fill(fb, 'side', night ? 'night' : dusk ? 'ochre' : 'leaf', { w: 22, p: 0.34, passes: 1, ang: 0.1, reach: 1, flow: 0.5 });
  }
  part('lake');
  {
    const poly = SHORE.map(p => [p[0], p[1] - 2]).concat([[W + 30, H + 14], [-30, H + 14]]);
    M.water(A, poly, night ? { kind: 'calm', c: A.mix('neel', 'night', 0.62), edge: 0 } : dusk ? { kind: 'calm', c: A.mix('neel', 'plum', 0.3), edge: 0 } : { kind: 'calm', c: A.mix('neel', 'lapis', 0.42), edge: 0 });
    M.shore(A, SHORE, Object.assign({ c: grass, size: 40 }, night ? { lip: 'verdigris' } : {}));
  }
  part('trees');
  for (const t of G.trees) t.ret = M.tree(A, t.x, t.y, t.h, t.kind, { zone, mounds: t.h > 170 && t.kind !== 'cypress' && t.kind !== 'palm' ? 2 : 1 });
  part('pavilion');
  {
    if (G.wide) M.wall(A, pavX + pavW / 2 + 82, pavY - 4, 150, 30, { night });
    K.pav = M.pavilion(A, pavX, pavY, pavW, { night });
    M.shrub(A, pavX - pavW / 2 - 30, pavY + 6, 48, 'jasmine', { zone });
    M.shrub(A, pavX + pavW / 2 + 26, pavY + 4, 38, 'jasmine', { zone });
  }
  part('dark under the moon');
  if (night) {
    const y0 = shoreY(orbX) + 30;
    for (let i = 0; i < 9; i++) { const y = y0 + 6 + i * 15 + rr(-3, 3), hw = 15 + i * 1.6; A.stroke([[orbX - hw + rr(-4, 4), y], [orbX + hw + rr(-4, 4), y + rr(-1, 1)]], 'side', 'storm', { w: rr(7, 11), p: 0.5 - i * 0.035, reach: 1.1, flow: 0.5 }); }
  }
  part('lotus');
  for (const s of G.spots) if (!s.fg) STAGE.spot(A, G, s);
  if (night) {                       // the geese sleep; by day they are cels and swim
    A.reseed(5150);
    M.goose(A, G.gooseX[0] + (G.gooseX[1] - G.gooseX[0]) * 0.34, G.gooseY, 42, { pose: 'sleep' });
    M.goose(A, G.gooseX[0] + (G.gooseX[1] - G.gooseX[0]) * 0.34 + 62, G.gooseY + 9, 46, { pose: 'sleep', flip: true });
  }
  part('near bank');
  {
    const nb = BANK.concat([[W + 30, H + 14], [-30, H + 14]]);
    A.ground(nb, grass, { ang: -0.2, w: 26, edge: 1.2 });
    A.fill(nb, 'side', night ? 'night' : 'moss', { w: 20, p: 0.3, passes: 1, ang: 0.1, reach: 1, flow: 0.5 });
    M.shore(A, BANK, Object.assign({ c: grass, size: 40, side: -1 }, night ? { lip: 'verdigris' } : {}));
  }
  part('what grows there');
  {
    const base = G.nearBase, nt = G.nearTree;
    K.tree = M.tree(A, nt.x, nt.y, nt.h, night ? 'blossom' : 'weeping', { zone, mounds: 2 });
    if (night) M.tree(A, 62, base(62), G.clamp(H * 0.24, 170, 230), 'palm', { zone });
    else { M.tree(A, 46, base(46) + 4, 168, 'plantain', { zone }); M.tree(A, 94, base(94) + 10, 142, 'plantain', { zone }); M.tree(A, 20, base(20) + 12, 130, 'plantain', { zone }); }
    const fx = G.fx;
    if (night) M.egret(A, fx, base(fx) + 6, 70, { pose: 'sleep' });
    else if (dusk) M.egret(A, fx, base(fx) + 4, 76, { pose: 'still' });
    else { M.deer(A, fx, base(fx) + 2, 54, { pose: 'stand', kind: 'buck' }); M.deer(A, fx + 88, base(fx) + 12, 48, { pose: 'stand', kind: 'doe' }); }
    M.rock(A, W * 0.2 + 20, H - gh * 0.3, 58, 32, { palette: night ? 'night' : 'green' });
    M.shrub(A, W * 0.27 + 30, H - gh * 0.22, 54, 'oleander', { zone });
    M.shrub(A, W * (G.wide ? 0.47 : 0.7), H - gh * 0.24, 56, 'dot', { zone });
    M.tuftRow(A, [[16, H - gh * 0.2], [W * 0.5, H - gh * 0.25], [W - 16, H - gh * 0.19]], { zone, step: 19, s: [11, 24], kinds: night ? ['fern', 'grass', 'flower', 'fan'] : ['flower', 'fan', 'grass', 'flower', 'fern'], skip: 0.14 });
    M.starFlowers(A, [[10, H - gh * 0.46], [W - 10, H - gh * 0.46], [W - 10, H - 8], [10, H - 8]], 26, { zone });
  }
  return K;
};

/* ======================================================================== THE FIRST LINES */
STAGE.sketch = function (A, G) {
  const { W, shoreY, bankY, ridgeY, line, pavX, pavY, pavW, orbX, orbY, boatX, boatY, boatS } = G, sk = (A, pts, o) => M.sketch(A, pts, Object.assign({ w: 3.4 }, o, { p: Math.min(0.69, ((o && o.p) || 0.6) * 1.2) })), rr = A.rr;
  A.reseed(31337 + (G.wide ? 0 : 9));
  sk(A, line(ridgeY, 0, W, 26)); sk(A, line(shoreY, 0, W, 40)); sk(A, line(bankY, 0, W, 40));
  sk(A, A.ellipse(orbX, orbY, 30, 30), { closed: true });
  const pw = pavW / 2, ph = pavW * 0.4;
  sk(A, [[pavX - pw, pavY], [pavX - pw, pavY - ph], [pavX + pw, pavY - ph], [pavX + pw, pavY]]);
  sk(A, [[pavX - pw * 0.8, pavY - ph * 0.5], [pavX + pw * 0.8, pavY - ph * 0.5]], { p: 0.45 });
  for (const u of [-0.72, 0, 0.72]) sk(A, A.ellipse(pavX + u * pw, pavY - ph, pw * (u ? 0.2 : 0.34), pw * (u ? 0.24 : 0.32), 0, Math.PI, 2 * Math.PI));
  G.trees.forEach((t, i) => {
    if (i % 2) return;
    sk(A, A.ellipse(t.x, t.y - t.h * 0.62, t.h * (t.kind === 'cypress' ? 0.11 : 0.24), t.h * 0.36), { closed: true, p: 0.45 });
    sk(A, [[t.x, t.y], [t.x + rr(-3, 3), t.y - t.h * 0.3]], { p: 0.45 });
  });
  const nt = G.nearTree;
  sk(A, A.ellipse(nt.x, nt.y - nt.h * 0.6, nt.h * 0.36, nt.h * 0.36), { closed: true, p: 0.5 });
  sk(A, [[nt.x, nt.y], [nt.x - 4, nt.y - nt.h * 0.3]], { p: 0.5 });
  sk(A, A.spline([[boatX - boatS * 0.5, boatY - boatS * 0.18], [boatX - boatS * 0.3, boatY + boatS * 0.03], [boatX, boatY + boatS * 0.07], [boatX + boatS * 0.3, boatY + boatS * 0.03], [boatX + boatS * 0.5, boatY - boatS * 0.18]]));
  sk(A, A.spline([[boatX - boatS * 0.2, boatY - boatS * 0.29], [boatX + boatS * 0.03, boatY - boatS * 0.37], [boatX + boatS * 0.25, boatY - boatS * 0.29]]), { p: 0.45 });
  G.spots.forEach(s => { if (s.t === 'lotus') sk(A, A.ellipse(s.x, s.y, s.r, s.r * 0.5), { closed: true, p: 0.4 }); });
};

/* ======================================================================== THE LOOSE DRAWINGS
   Each cel is { name, w, h, ax, ay, draw(A, x, y) }: a box of w x h sheet units, and a point (ax, ay) inside it that the
   page will put at some place of the picture.  draw gets that point in the coordinates of the sheet it is drawn on. */
STAGE.cels = function (G) {
  const { W, night, dusk, shoreY, bankY, yShore0, yBank0, orbX, boatS, boatY, lakeH } = G, C = [];
  const cel = (name, w, h, ax, ay, draw) => C.push({ name, w: Math.ceil(w), h: Math.ceil(h), ax, ay, draw });

  // lotus in front of the boat
  const fg = G.spots.filter(s => s.fg);
  if (fg.length) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of fg) { x0 = Math.min(x0, s.x - s.r * 2.6); x1 = Math.max(x1, s.x + s.r * 2.6); y0 = Math.min(y0, s.y - s.r * 3.4); y1 = Math.max(y1, s.y + s.r * 1.6); }
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    G.fgBox = [x0, y0];
    cel('fg', x1 - x0, y1 - y0, 0, 0, (A, x, y) => { for (const s of fg) STAGE.spot(A, G, s, x - x0, y - y0); });
  }
  for (let v = 0; v < 2; v++) cel('boat' + v, boatS * 1.78, boatS * 0.88, boatS * 1.02, boatS * 0.47, (A, x, y) => M.boat(A, x, y, boatS, { night }));
  [[9, true], [15, false], [23, false], [32, false]].forEach((q, i) => cel('ring' + i, 80, 44, 40, 26, (A, x, y) => M.ripple(A, x, y, q[0], { fresh: q[1], rings: i === 3 ? 3 : undefined, w: i === 3 ? 0.8 : 1 })));

  if (!night) {
    for (let v = 0; v < 2; v++) cel('goose' + v, 100, 66, 52, 46, (A, x, y) => M.goose(A, x, y, 44, { pose: 'swim' }));
    for (let ph = 0; ph < 4; ph++) for (let v = 0; v < 2; v++) cel('crane' + ph + (v ? 'b' : 'a'), 92, 88, 46, 46, (A, x, y) => M.crane(A, x, y, 52, { ang: Math.PI, phase: ph }));
    const leap = [[0, -10, -0.75], [9, -26, -0.3], [22, -28, 0.5], [33, -12, 1.15]];
    leap.forEach((q, i) => cel('fish' + i, 86, 66, 27, 54, (A, x, y) => M.fish(A, x + q[0], y + q[1], 30, { pose: 'leap', ang: q[2], splash: false, arch: 1 })));
    // clouds: scalloped bands
    const wh = { c: '#f3f1ea', rim: 'khadi', shade: 'slate' };
    const cols = dusk ? [{ c: 'gulabi', rim: 'cream', shade: 'crimson' }, { c: 'peach', rim: 'cream', shade: 'brick' }, { c: 'gulabi', rim: 'cream', shade: 'crimson' }, { c: 'peach', rim: 'cream', shade: 'brick' }] : [wh, wh, wh, wh];
    [[270, 25], [350, 31], [220, 21], [300, 27]].forEach((q, i) => {
      const pad = q[1] * 3 + 12, hh = q[1] * 3 + 16;
      cel('cloud' + i, q[0] + pad * 2, hh * 2, pad, hh, (A, x, y) => M.cloudBand(A, [[x, y], [x + q[0] * 0.5, y - A.rr(4, 10)], [x + q[0], y + A.rr(-4, 6)]], q[1], cols[i]));
    });
  } else {
    [[270, 23], [350, 28], [230, 20]].forEach((q, i) => {
      const pad = q[1] * 3 + 12, hh = q[1] * 3 + 16;
      cel('cloud' + i, q[0] + pad * 2, hh * 2, pad, hh, (A, x, y) => M.cloudBand(A, [[x, y], [x + q[0] * 0.5, y - A.rr(4, 10)], [x + q[0], y + A.rr(-4, 6)]], q[1], { c: A.mix('storm', 'night', 0.25), rim: 'slate', shade: 'night' }));
    });
    for (let v = 0; v < 3; v++) cel('lamp' + v, 70, 88, 35, 36, (A, x, y) => M.lamp(A, x, y, 16, { k: 0.85 }));
    [1.25, 0.72].forEach((s, i) => cel('fly' + i, 40, 40, 20, 20, (A, x, y) => M.fireflies(A, [[x - 1, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1]], 1, { trail: 0, s })));
    [3, 5.5, 8].forEach((r, i) => cel('spark' + i, 26, 26, 13, 13, (A, x, y) => M.sparkle(A, x, y, r)));
  }

  // light on the water
  const y0 = shoreY(orbX) + 30;
  if (night) {
    for (let v = 0; v < 3; v++) cel('light' + v, 150, 176, 75, 6, (A, x, y) => {
      M.reflection(A, x, y, 34, 150, { lw: 3, gap: 2.5, p: 1, c2: 'ice', spread: 0.4 });
      M.reflection(A, x + 1, y + 4, 26, 120, { lw: 2.2, gap: 3.0, p: 1, spread: 0.5 });
    });
    G.light = [orbX, y0];
  } else if (dusk) {
    const len = Math.min(220, lakeH * 0.6);
    for (let v = 0; v < 3; v++) cel('light' + v, 170, len + 26, 85, 6, (A, x, y) => M.reflection(A, x, y, 40, len, { c: 'haldi', c2: 'saffron', lw: 3, gap: 2.6, p: 1, spread: 0.45 }));
    G.light = [orbX, y0];
  } else {
    const gy0 = Math.floor(yShore0 + 26), gh = Math.ceil(yBank0 - 4 - gy0), n = Math.round(26 * W * lakeH / 352000 * (G.wide ? 1 : 1.3));
    const clear = (x, y) => !G.spots.some(s => Math.hypot(s.x - x, (s.y - y) * 1.6) < s.r * 1.5 + 14) && !(Math.abs(x - G.pavX) < G.pavW * 0.56 && y < shoreY(x) + G.pavW * 0.5);
    for (let v = 0; v < 3; v++) cel('light' + v, W, gh, 0, 0, (A, x, y) => {
      for (let i = 0, k = 0; i < n && k < n * 8; k++) {
        const gx = A.rr(20, W - 20), gy = A.rr(shoreY(gx) + 40, bankY(gx) - 28), l = A.rr(10, 26) * (0.6 + 0.7 * G.depth(gx, gy));
        if (!clear(gx, gy)) continue;
        i++;
        A.stroke([[x + gx - l, y + gy - gy0], [x + gx, y + gy - gy0 - A.rr(0.5, 1.8)], [x + gx + l, y + gy - gy0]], 'chalk', 'ice', { w: 1.1, p: A.rr(0.45, 0.75) });
      }
    });
    G.light = [0, gy0];
  }

  if (!night && !dusk) {
    ['up', 'down'].forEach((wings, i) => cel('parrot' + i, 76, 64, 38, 32, (A, x, y) => M.parrot(A, x, y, 34, { pose: 'fly', ang: Math.PI, wings })));
    [['peori', 'saffron'], ['khadi', 'ice'], ['sindoor', 'peori']].forEach((c, i) => cel('bfly' + i, 26, 26, 13, 13, (A, x, y) => M.butterfly(A, x, y, 7.5, c[0], c[1])));
  }
  if (dusk) ['still', 'look'].forEach((pose, i) => cel('egret' + i, 84, 100, 42, 92, (A, x, y) => M.egret(A, x, y, 66, { pose, flip: true })));
  return C;
};

/* ======================================================================== WHAT THE PAGE DOES WITH THEM
   Plain data.  Lengths are sheet units, times are seconds.  z is the order they are laid down, low first. */
STAGE.actors = function (G) {
  const { W, H, wide, night, dusk, boatX, boatY, boatS, boatRange, orbX } = G, a = [];
  const R = STAGE.rng(77 + (night ? 1 : dusk ? 2 : 0) + (wide ? 0 : 5));
  const r0 = v => Math.round(v);
  // clouds drift with the wind, left to right, and come round again
  {
    const rows = wide ? [[0.62, 0.075, 5.5], [-0.2, 0.125, 7], [0.78, 0.245, 4.2], [-0.255, 0.3, 6]] : [[0.5, 0.235, 4.4], [-0.1, 0.275, 5.6], [0.62, 0.33, 3.6], [0.1, 0.385, 4.8]];
    const n = night ? 3 : 4, items = [];
    for (let i = 0; i < n; i++) items.push({ cel: 'cloud' + i, x: r0(W * rows[i][0]), y: r0(H * rows[i][1]), v: rows[i][2] * (night ? 0.7 : 1) });
    a.push({ type: 'drift', z: 1, items, wrap: [-420, W + 60] });
  }
  if (night) a.push({ type: 'twinkle', z: 0, cels: ['spark0', 'spark1', 'spark2'], box: [20, 16, W - 20, r0(G.yHill - H * 0.14)], every: [0.5, 1.6] });
  if (!night) a.push({
    type: 'flock', z: 2, frames: [['crane0a', 'crane0b'], ['crane1a', 'crane1b'], ['crane2a', 'crane2b'], ['crane3a', 'crane3b']], cycle: [0, 1, 2, 2, 3, 0],
    from: [W + 70, r0(H * (wide ? 0.34 : 0.33))], to: [-70, r0(H * (wide ? 0.09 : 0.235))], sag: wide ? -46 : -24, n: wide ? 7 : 5, gap: wide ? 62 : 54, speed: wide ? 104 : 82,
    size: [0.72, 1], first: 0.6, every: [20, 34]
  });
  a.push({ type: 'boil', z: 3, cels: ['light0', 'light1', 'light2'], x: r0(G.light[0]), y: r0(G.light[1]), hold: night || dusk ? 3 : 2 });
  a.push({ type: 'rings', z: 4, cels: ['ring0', 'ring1', 'ring2', 'ring3'], pts: G.open, every: night ? [2.5, 6] : [1.4, 4], hold: 2 });
  if (!night) a.push({ type: 'swim', z: 5, cels: ['goose0', 'goose1'], y: r0(G.gooseY), x0: r0(G.gooseX[0]), x1: r0(G.gooseX[1]), speed: 9, n: 2, gap: 64, scale: wide ? 0.82 : 0.9 });
  if (night) a.push({ type: 'lamps', z: 5, cels: ['lamp0', 'lamp1', 'lamp2'], pts: G.lamps.map(l => [r0(l.x), r0(l.y), +(l.s / 16).toFixed(2)]), hold: 2 });
  if (!night) a.push({ type: 'leap', z: 6, cels: ['fish0', 'fish1', 'fish2', 'fish3'], rings: ['ring0', 'ring1', 'ring2', 'ring3'], pts: G.open, reach: 36, first: dusk ? 9 : 5, every: dusk ? [14, 26] : [8, 17] });
  a.push({ type: 'boat', z: 7, cels: ['boat0', 'boat1'], x: r0(boatX), y: r0(boatY), range: boatRange, period: 46, bob: 1.6, hold: 6 });
  if (G.fgBox) a.push({ type: 'still', z: 8, cel: 'fg', x: G.fgBox[0], y: G.fgBox[1], bob: 0.8 });
  if (dusk) a.push({ type: 'pose', z: 9, cels: ['egret0', 'egret1'], x: r0(G.fx + 46), y: r0(G.nearBase(G.fx) + 12), every: [3, 8] });
  if (!night && !dusk) {
    a.push({ type: 'flutter', z: 10, cels: ['bfly0', 'bfly1', 'bfly2'], box: [40, r0(G.yBank0 + 14), W - 40, H - 26], n: wide ? 5 : 3 });
    const nt = G.nearTree;
    a.push({ type: 'pair', z: 11, cels: ['parrot0', 'parrot1'], from: [r0(nt.x - 20), r0(nt.y - nt.h * 0.62)], to: [-50, r0(G.yBank0 - G.lakeH * (wide ? 0.5 : 0.62))], sag: wide ? 70 : 60, n: 2, speed: wide ? 190 : 150, first: 9, every: [24, 40] });
  }
  if (night) {
    const zones = [[10, r0(G.yBank0 - 24), W - 10, H - 14], [10, r0(G.yHill - 34), W - 10, r0(G.yShore0 - 6)]];
    a.push({ type: 'blink', z: 10, cels: ['fly0', 'fly1'], zones, n: [Math.round(W / 110), Math.round(W / 80)] });
  }
  void R; void orbX; void boatS;
  return a;
};
