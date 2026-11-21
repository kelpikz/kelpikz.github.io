/* ------------------------------------------------------------------ *
 *  THE SIX FOLIOS
 *
 *  One page for each project, the way a Mewar album page is made: a
 *  sheet of handmade paper, a red border sown with small white flowers
 *  between two black rules and a line of gold, a yellow panel at the
 *  top where the title is written, and the painting under it.  The
 *  page writes the title, the tagline and the year itself, over the
 *  blank panel and the blank margin at the foot.
 *
 *  Each painting is its own motif, M.folioArt[id](A, b), drawn inside
 *  the box b and clipped to it.  The frame is the same for all six.
 *
 *      node make.mjs --paper --place folios [--only shelf] [--tmp dir]
 *  writes assets/folio-<id>.webp (and a PNG with alpha in --tmp).
 * ------------------------------------------------------------------ */
M.folioArt = M.folioArt || {};

STAGE.places.folios = (function () {
  const P = {};
  const IDS = P.IDS = ['shelf', 'open-transcribe', 'claudemonitor', 'dpay', 'utopia', 'dalal-street'];
  const W = P.W = 360, H = P.H = 300;
  // where things are on the sheet, in logical units (the page uses the same numbers, as fractions)
  const BAND0 = 11, BAND1 = 26, FOOT = 260;              // the red border: outer edge, inner edge; the foot of the frame
  const IN = P.IN = { x0: 30, y0: 30, x1: 330, y1: 241 };                  // inside the gold line
  const PANEL = P.PANEL = { x0: 30, y0: 30, x1: 330, y1: 72 };             // the yellow panel for the title
  const BOX = P.BOX = { x0: 30, y0: 74, x1: 330, y1: 241, w: 300, h: 167 }; // the painting
  P.MARGIN = { x0: 14, y0: 262, x1: 346, y1: 296 };                        // the foot, for the tagline and the year
  const RED = '#b3301f';

  P.geom = function () { throw new Error('the folios are paper pieces only: run make.mjs --paper --place folios'); };

  // the paper itself laid down solid, pixel by pixel, so the alpha has no holes where the tooth would show
  function sheet(A, poly, c, grain) {
    const mk = A.pushMask(poly); A.popMask();
    const col = A.col(c);
    for (let y = 0; y < mk.h; y++) for (let x = 0; x < mk.w; x++) {
      const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
      const X = x + mk.x0, Y = y + mk.y0, i = Y * A.W + X;
      const g = 1 + grain * ((A.noise2(X / 52, Y / 52, 3) - 0.5) * 0.7 + (A.noise2(X / 6, Y / 6, 5) - 0.5) * 0.7 + (A.HM[i] - 0.5) * 0.6);
      A.R[i] += (Math.min(1, col[0] * g) - A.R[i]) * v; A.G[i] += (Math.min(1, col[1] * g) - A.G[i]) * v; A.B[i] += (Math.min(1, col[2] * g) - A.B[i]) * v;
    }
  }
  // one ruled line, pulled along a straight edge but by hand: it starts and stops a little off the corner
  function hl(A, a, b, tool, c, o) { M.cityHand.hl(A, a, b, tool, c, o); }
  function box4(A, x0, y0, x1, y1, tool, c, o) { hl(A, [x0, y0], [x1, y0], tool, c, o); hl(A, [x1, y0], [x1, y1], tool, c, o); hl(A, [x1, y1], [x0, y1], tool, c, o); hl(A, [x0, y1], [x0, y0], tool, c, o); }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // a small white flower of five petals, the kind sown along a Mewar border
  function flower(A, x, y, r) {
    const a0 = A.rr(0, 6.28);
    for (let k = 0; k < 5; k++) {
      const a = a0 + k * 1.2566 + A.rr(-0.12, 0.12), ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      A.stroke([[x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25], [ex, ey]], 'chalk', 'khadi', { w: r * 0.78, p: 0.95, reach: 1.5, tin: 0.1, tout: 0.25 });
    }
    A.dot(x + A.rr(-0.2, 0.2), y + A.rr(-0.2, 0.2), 'chalk', 'haldi', { w: r * 0.62, p: 1, reach: 1.5 });
  }

  /* Each sheet is its own album page: its own margin paper (the hashiya), its own small motif sown along the red band,
     and its own sprinkle of gold leaf.  The red band, the rules and the gold line are the same on all six, as in one album. */
  const STY = P.STY = {
    'shelf':           { paper: '#d3dbca', kind: 'vine',    zar: 1.0 },   // pale sage-blue
    'open-transcribe': { paper: '#e4cd9f', kind: 'bud',     zar: 0.85 },  // buff
    'claudemonitor':   { paper: '#f2e8cf', kind: 'rosette', zar: 1.25 },  // ivory
    'dpay':            { paper: '#efd199', kind: 'five',    zar: 1.1 },   // pale saffron
    'utopia':          { paper: '#ecccbf', kind: 'sprig',   zar: 0.9 },   // pale pink
    'dalal-street':    { paper: '#efdfb6', kind: 'four',    zar: 1.0 }    // cream
  };
  const GREEN = () => A_.mix('sap', 'malachite', A_.rr(0.25, 0.6));
  let A_ = null;   // the sheet being drawn, for the small colour helpers

  // a lotus bud on a short stem, its tip toward (ux, uy): a pink bud, round at the foot and pointed at the tip,
  // its petals parted by a fine line, held in two green sepals
  function bud(A, x, y, ux, uy, s) {
    const nx = -uy, ny = ux, L = s, Wd = s * 0.36, bx = x - ux * L * 0.42, by = y - uy * L * 0.42;
    const at = (t, side) => { const hw = Wd * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.82 + 0.06)), 0.7) * (1 - 0.55 * t * t); return [bx + ux * L * t + nx * hw * side, by + uy * L * t + ny * hw * side]; };
    const outl = []; for (let i = 0; i <= 10; i++) outl.push(at(i / 10, 1)); for (let i = 10; i >= 0; i--) outl.push(at(i / 10, -1));
    A.stroke([[bx - ux * s * 0.42, by - uy * s * 0.42], [bx, by]], 'chalk', GREEN(), { w: 0.75, p: 0.9 });
    const pink = A.mix('gulabi', 'rose', A.rr(0.15, 0.55));
    A.fill(outl, 'chalk', pink, { w: 1.1, p: 1, passes: 2, gap: 0.45, ang: Math.atan2(uy, ux), reach: 1.5 });
    A.stroke([at(0.22, 0.15), at(0.95, 0.05)], 'chalk', A.shade(pink, 0.45), { w: 0.9, p: 0.8, tin: 0.3, tout: 0.5 });
    A.stroke([at(0.12, 0.62), at(0.5, 0.42), at(0.98, 0)], 'kajal', A.mix('lac', 'kajal', 0.3), { w: 0.3, p: 0.6 });
    for (const sd of [-1, 1]) A.stroke([[bx + ux * 0.2, by + uy * 0.2], at(0.36, sd * 1.05)], 'chalk', GREEN(), { w: s * 0.17, p: 0.95, tin: 0.05, tout: 0.75 });
  }
  // a lotus seen from above: eight pink petals round a pale ring and a yellow heart
  function lotusTop(A, x, y, r) {
    const a0 = A.rr(0, 0.8);
    for (let k = 0; k < 8; k++) { const a = a0 + k * 0.7854; A.stroke([[x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3], [x + Math.cos(a) * r, y + Math.sin(a) * r]], 'chalk', A.mix('gulabi', 'rose', A.rr(0.1, 0.5)), { w: r * 0.5, p: 1, reach: 1.5, tin: 0.1, tout: 0.55 }); }
    for (let k = 0; k < 8; k++) { const a = a0 + (k + 0.5) * 0.7854; A.stroke([[x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2], [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62]], 'chalk', 'khadi', { w: r * 0.32, p: 0.95, tin: 0.1, tout: 0.5 }); }
    A.dot(x, y, 'chalk', 'haldi', { w: r * 0.45, p: 1 });
  }
  // a ring of white dots round a yellow heart
  function rosette(A, x, y, r) {
    const n = A.chance(0.5) ? 7 : 8, a0 = A.rr(0, 6.28);
    for (let k = 0; k < n; k++) { const a = a0 + k * 6.2832 / n + A.rr(-0.1, 0.1); A.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, 'chalk', 'khadi', { w: r * 0.46 * A.rr(0.85, 1.12), p: 1, reach: 1.5 }); }
    A.dot(x, y, 'chalk', A.chance(0.5) ? 'haldi' : 'peori', { w: r * 0.7, p: 1, reach: 1.5 });
    A.dot(x + A.rr(-0.2, 0.2), y + A.rr(-0.2, 0.2), 'chalk', 'lac', { w: r * 0.24, p: 0.9 });
  }
  // a quatrefoil: four round white petals set square to the band, small green leaves between, a saffron heart
  function four(A, x, y, r) {
    const a0 = A.rr(-0.1, 0.1);
    for (let k = 0; k < 4; k++) { const a = a0 + k * 1.5708 + 0.7854; A.dot(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, 'chalk', GREEN(), { w: r * 0.36, p: 0.95, len: r * 0.12, ang: a }); }
    for (let k = 0; k < 4; k++) { const a = a0 + k * 1.5708 + A.rr(-0.06, 0.06); A.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', 'khadi', { w: r * 0.66, len: r * 0.14, ang: a, p: 1, reach: 1.5 }); }
    A.dot(x, y, 'chalk', A.chance(0.5) ? 'saffron' : 'hingul', { w: r * 0.42, p: 1 });
  }
  // a sprig: a curved stem with three leaves and a saffron bud at its tip, leaning along the band
  function sprig(A, x, y, ux, uy, s) {
    const nx = -uy, ny = ux, bend = A.rr(0.18, 0.32) * (A.chance(0.5) ? 1 : -1);
    const p0 = [x - ux * s * 0.55, y - uy * s * 0.55], p1 = [x + nx * bend * s, y + ny * bend * s], p2 = [x + ux * s * 0.55, y + uy * s * 0.55];
    const st = A.spline([p0, p1, p2], false, 0.8);
    A.stroke(st, 'chalk', GREEN(), { w: 0.65, p: 0.9 });
    [0.3, 0.55, 0.78].forEach((t, k) => {
      const q = st[Math.min(st.length - 1, Math.round(t * (st.length - 1)))], sd = k % 2 ? 1 : -1;
      A.stroke([[q[0], q[1]], [q[0] + (ux * 0.5 + nx * sd) * s * 0.42, q[1] + (uy * 0.5 + ny * sd) * s * 0.42]], 'chalk', GREEN(), { w: s * 0.24, p: 0.95, tin: 0.1, tout: 0.7 });
    });
    A.dot(p2[0], p2[1], 'chalk', A.chance(0.6) ? 'saffron' : 'peori', { w: s * 0.3, p: 1, reach: 1.5 });
    A.dot(p2[0] + ux * 0.3, p2[1] + uy * 0.3, 'chalk', 'khadi', { w: s * 0.1, p: 0.8 });
  }

  // the motif sown along one side of the band, from (ax, ay) to (bx, by)
  function sow(A, kind, ax, ay, bx, by) {
    const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
    if (kind === 'vine') {
      // one running stem that waves across the band, a leaf at each swell, a small white flower in each hollow
      const lam = 15.5, amp = 2.9, ph = A.rr(0, 6.28), pts = [];
      for (let s = 6; s <= L - 6; s += 0.9) { const w = Math.sin(s / lam * 6.2832 + ph) * amp * (1 + 0.08 * Math.sin(s * 0.37)); pts.push([ax + ux * s + nx * w, ay + uy * s + ny * w]); }
      A.stroke(pts, 'chalk', A.mix('sap', 'malachite', 0.4), { w: 0.95, p: 0.92, cv: 0.04, wob: 0.35 });
      for (let k = 0; ; k++) {
        const s = (k + 0.25) * lam / 2 - (ph / 6.2832) * lam; if (s > L - 8) break; if (s < 8) continue;
        const sd = k % 2 ? -1 : 1, cx = ax + ux * s + nx * amp * sd, cy = ay + uy * s + ny * amp * sd;
        A.stroke([[cx, cy], [cx + (ux * 0.7 - nx * sd * 0.45) * 4.8, cy + (uy * 0.7 - ny * sd * 0.45) * 4.8]], 'chalk', GREEN(), { w: 2.5, p: 0.95, tin: 0.1, tout: 0.7, wob: 0.4 });
        const fx = cx - nx * sd * amp * 1.35 + ux * A.rr(-0.6, 0.6), fy = cy - ny * sd * amp * 1.35 + uy * A.rr(-0.6, 0.6);
        if (k % 2 === 0) { for (let j = 0; j < 4; j++) { const a = j * 1.5708 + A.rr(0, 0.6); A.dot(fx + Math.cos(a) * 1.1, fy + Math.sin(a) * 1.1, 'chalk', 'khadi', { w: 1.05, p: 1 }); } A.dot(fx, fy, 'chalk', 'haldi', { w: 0.7, p: 1 }); }
      }
      return;
    }
    const step = kind === 'rosette' ? 13 : kind === 'bud' ? 12.5 : kind === 'sprig' ? 14 : 15.5, n = Math.max(1, Math.round(L / step));
    for (let i = 1; i < n; i++) {
      const t = i / n, x = ax + (bx - ax) * t + A.rr(-0.4, 0.4), y = ay + (by - ay) * t + A.rr(-0.4, 0.4), sd = i % 2 ? 1 : -1;
      if (kind === 'five') flower(A, x, y, 3.1);
      else if (kind === 'four') { four(A, x, y, 3.3); if (i < n - 1) A.dot(x + ux * step / 2, y + uy * step / 2, 'chalk', 'haldi', { w: 1.0, p: 1 }); }
      else if (kind === 'rosette') { rosette(A, x, y, 2.6); if (i < n - 1) for (const k of [-1, 1]) A.dot(x + ux * step / 2 + nx * k * 1.5, y + uy * step / 2 + ny * k * 1.5, 'chalk', 'khadi', { w: 0.8, p: 0.95 }); }
      else if (kind === 'bud') { const a = sd * 1.5708 + A.rr(-0.15, 0.15), c = Math.cos(a), s = Math.sin(a); bud(A, x, y, ux * c - uy * s, uy * c + ux * s, 7.4); }
      else if (kind === 'sprig') sprig(A, x, y, ux, uy, 9.5);
    }
  }
  // the larger motif in each corner, inside a ring of yellow
  function corner(A, kind, x, y) {
    if (kind === 'rosette') rosette(A, x, y, 3.4);
    else if (kind === 'four' || kind === 'sprig') four(A, x, y, 4.2);
    else if (kind === 'bud') lotusTop(A, x, y, 4.3);
    else flower(A, x, y, 3.9);
    A.outline(A.ellipse(x, y, 6.4, 6.4), 'chalk', 'haldi', { closed: true, w: 0.9, p: 0.8 });
  }

  // gold leaf beaten into flakes and thrown over the margin: clouds of it here and there, a few large flakes, never on the painting
  function zarAfshan(A, edge, dens) {
    const b = BAND0 - 3.8, k0 = 30 + Math.floor(A.rr(0, 20)), N = Math.round(5200 * dens);
    for (let i = 0; i < N; i++) {
      const x = A.rr(3, W - 3), y = A.rr(3, H - 3);
      if (x > b && x < W - b && y > b && y < FOOT + 3.8) continue;
      if (!A.inside(edge, x, y)) continue;
      const d = A.noise2(x / 34, y / 30, k0) * 0.75 + A.noise2(x / 9, y / 9, k0 + 1) * 0.25;
      if (A.rnd() > Math.pow(d, 2.4) * 2.1) continue;
      const text = y > 263 && y < 294 && x > 17 && x < 343, r = A.rnd();
      if (r < 0.05 && !text) {
        // a large flake: a torn scrap of leaf, laid with a few short pulls of the gold crayon, its edge broken
        const s = A.rr(1.6, 2.9), a = A.rr(0, 6.28);
        const poly = A.roughen([[x - s, y - s * 0.6], [x + s * 0.8, y - s * 0.9], [x + s, y + s * 0.5], [x - s * 0.3, y + s]].map(p => { const dx = p[0] - x, dy = p[1] - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; }), 0.45, 2.2, true);
        A.fill(poly, 'gold', 'gold', { w: 1.1, p: 1, passes: 2, gap: 0.5, ang: a });
      } else if (r < 0.32) {
        const a = A.rr(0, 6.28), l = A.rr(0.5, text ? 1.0 : 1.7);
        A.stroke([[x - Math.cos(a) * l, y - Math.sin(a) * l], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 'gold', 'gold', { w: A.rr(0.8, 1.35), p: 1, tin: 0, tout: 0.3 });
      } else A.dot(x, y, 'gold', 'gold', { w: A.rr(0.6, 1.1), len: A.rr(0.05, 0.35), p: A.rr(0.8, 1) });
    }
  }

  function frame(A, kind) {
    const b0 = BAND0, b1 = BAND1;
    // the red border: each side filled along its own length, as a wide brush is pulled
    const sides = [
      [[b0, b0], [W - b0, b0], [W - b1, b1], [b1, b1]],
      [[W - b0, b0], [W - b0, FOOT], [W - b1, FOOT - (b1 - b0)], [W - b1, b1]],
      [[W - b0, FOOT], [b0, FOOT], [b1, FOOT - (b1 - b0)], [W - b1, FOOT - (b1 - b0)]],
      [[b0, FOOT], [b0, b0], [b1, b1], [b1, FOOT - (b1 - b0)]]
    ];
    sides.forEach((q, i) => A.fill(q, 'pastel', RED, { w: 6, ang: i % 2 ? 1.571 : 0.004, passes: 2, p: 1, reach: 1.65, gap: 0.42, cv: 0.01, turn: 0.9 }));
    sides.forEach((q, i) => A.fill(q, 'chalk', A.mix(RED, 'maroon', 0.45), { w: 2, ang: i % 2 ? 1.571 : 0.004, passes: 1, p: 0.28, gap: 2.8, cv: 0.01 }));
    const fb = FOOT - (b1 - b0);
    // this sheet's motif, along the middle of the band, a fist's breadth apart
    const mid = (b0 + b1) / 2, fy = FOOT - (b1 - b0) / 2;
    sow(A, kind, mid, mid, W - mid, mid); sow(A, kind, W - mid, mid, W - mid, fy); sow(A, kind, W - mid, fy, mid, fy); sow(A, kind, mid, fy, mid, mid);
    for (const q of [[mid, mid], [W - mid, mid], [W - mid, fy], [mid, fy]]) corner(A, kind, q[0], q[1]);
    // the rules: black on both edges of the band, then a line of gold inside, then black again
    box4(A, b0, b0, W - b0, FOOT, 'kajal', 'kajal', { w: 1, p: 0.85, ov: 2 });
    // and outside the band, on the margin paper, a thin rule of white between two of black
    box4(A, b0 - 1.45, b0 - 1.45, W - b0 + 1.45, FOOT + 1.45, 'chalk', 'khadi', { w: 1.15, p: 0.95, ov: 0.6 });
    box4(A, b0 - 2.85, b0 - 2.85, W - b0 + 2.85, FOOT + 2.85, 'kajal', 'kajal', { w: 0.6, p: 0.8, ov: 1.2 });
    box4(A, b1, b1, W - b1, fb, 'kajal', 'kajal', { w: 0.95, p: 0.85, ov: 2 });
    box4(A, b1 + 2.2, b1 + 2.2, W - b1 - 2.2, fb - 2.2, 'gold', 'gold', { w: 1.9, p: 0.95, ov: 1.2 });
    box4(A, IN.x0, IN.y0, IN.x1, IN.y1, 'kajal', 'kajal', { w: 0.8, p: 0.8, ov: 1.4 });
  }

  // The yellow is laid before the painting and rubbed only over itself: it is laid a little wider than the panel, under where
  // the border and the painting will go, so the finger never drags cream paper or the painting's colour into it.
  function panelGround(A) {
    const wide = rect(PANEL.x0 - 6, PANEL.y0 - 6, PANEL.x1 + 6, PANEL.y1 + 4), p = rect(PANEL.x0, PANEL.y0, PANEL.x1, PANEL.y1);
    A.withMask(wide, () => {
      A.fill(wide, 'side', '#edc24a', { w: 14, p: 1, reach: 1.5, passes: 2, ang: 0.03, cv: 0.02, turn: 0.4 });
      A.blend(wide, { r: 7, k: 0.35, ang: 0.02 });
    }, 0);
    A.withMask(p, () => {
      A.fill(p, 'side', A.mix('haldi', 'saffron', 0.18), { w: 11, p: 0.42, reach: 1.1, passes: 1, ang: -0.04, cv: 0.03 });
      A.fill(p, 'chalk', 'peori', { w: 2.4, p: 0.3, passes: 1, gap: 2.6, ang: 0.02, cv: 0.02 });
    }, 0);
  }
  function panelRules(A) {
    hl(A, [PANEL.x0, PANEL.y1 + 0.8], [PANEL.x1, PANEL.y1 + 0.8], 'kajal', 'kajal', { w: 0.95, p: 0.85, ov: 1 });
    hl(A, [PANEL.x0, PANEL.y1 + 2.4], [PANEL.x1, PANEL.y1 + 2.4], 'gold', 'gold', { w: 1.1, p: 0.8, ov: 0.6 });
  }

  // age: the margin browned toward the edge, a few foxing spots, and the soft grey of a thumb that held it
  function age(A, edge, seed) {
    A.withMask(edge, () => {
      A.outline(edge, 'shade', 'sand', { closed: true, w: 5, p: 0.36, pull: 90 });
      A.outline(edge, 'shade', 'ochre', { closed: true, w: 2, p: 0.22, pull: 70 });
      for (let i = 0; i < 9; i++) {
        const x = A.rr(6, W - 6), y = A.chance(0.6) ? A.rr(FOOT + 4, H - 5) : A.rr(4, 10);
        A.dot(x, y, 'shade', A.chance(0.5) ? 'ochre' : 'sand', { w: A.rr(1.2, 3.4), p: A.rr(0.25, 0.5) });
      }
      const tx = A.rr(W * 0.62, W * 0.86);
      A.dot(tx, H - 9, 'shade', 'grey', { w: 15, p: 0.12 });
    });
  }

  function placeholder(A, b) {
    A.ground(rect(b.x0 - 2, b.y0 - 2, b.x1 + 2, b.y1 + 2), 'sage', { w: 26, edge: 0 });
    A.outline(A.ellipse((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 40, 30), 'geru', 'geru', { closed: true });
  }

  P.page = function (A, id) {
    const e = 2.6, edge = A.roughen(rect(e, e, W - e, H - e), 1.2, 11, true);
    const st = STY[id] || { paper: '#f3ead6', kind: 'five', zar: 1 };
    A_ = A;
    sheet(A, edge, st.paper, 0.05);
    age(A, edge);
    zarAfshan(A, edge, st.zar);
    const b = Object.assign({}, BOX);
    panelGround(A);
    A.withMask(rect(BOX.x0 - 1, BOX.y0 - 1, BOX.x1 + 1, BOX.y1 + 1), () => (M.folioArt[id] || placeholder)(A, b), 0);
    panelRules(A);
    frame(A, st.kind);
  };

  P.papers = function () {
    return IDS.map(id => ({ file: 'folio-' + id + '.webp', w: W, h: H, S: 3.4, q: 86, relief: 0.022, fibres: 0.25, draw: A => P.page(A, id) }));   // relief: wasli is burnished smooth, so the tooth shows in the pigment but the sheet does not crinkle
  };

  return P;
})();
