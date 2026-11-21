(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE LOOSE DRAWINGS
     The small drawings the page moves over the painting, each drawn with the same tools as the painting:
       M.w8CelList   [{ name, w, h, ax, ay, boil?, draw(A, x, y) }]: w x h the cel's box in sheet units, (ax, ay) its anchor
                     in the box (the point laid on the painting), draw paints it with (x, y) the box's top left corner;
                     boil: draw it twice, with a different grain, so a moving bird is never quite the same drawing.
       glow0..2      the light round a lamp, as it breathes        mote0..2   dust in the sun down the stair
       pr0..3, pm0..3  a rose, a marigold petal turning           pgU/M/D, pwU/M/D  a pigeon far off (grey, white):
       crU/M/D       a sarus crane far off, wings up, level, down       wings up, level, down
       fly0, fly1    a firefly lit, and going dark                 ring0..3   rings opening on the water
       spark0..2     the sun catching gold leaf
     ======================================================================== */
  const PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const radial = (A, box, c, cx, cy, r, k, sq) => M.floorWash(A, box, c, (x, y) => k * (1 - sstep(Math.hypot(x - cx, (y - cy) / (sq || 1)) / r)), 'over');

  // a pigeon far off, facing left: a few strokes, as the painters drew birds across a sky
  function farPigeon(A, x, y, ph, coat) {
    const C = coat === 'white' ? { body: '#ebe8e0', wing: '#dcd9d2', tip: '#8a8a92', head: '#d4d4d8', line: '#3a3430' } : { body: '#8e96a8', wing: '#a6aebe', tip: '#3e4250', head: '#6c7486', line: '#22242c' };
    const Q = (u, v) => [x - u, y + v];
    // the wing tips, near then far: up in a V over the back; level, the near one spread below and the far one above (seen a
    // little from below, as a bird crossing the sky is); and down
    const W = { U: [[1.3, -5.4], [-2.4, -5.1]], M: [[-1.2, 3.0], [-2.8, -3.2]], D: [[-1.4, 4.4], [0.3, 3.8]] }[ph];
    const wing = (sh, root, tip, far) => {
      const lead = [(sh[0] + tip[0]) / 2 + 0.7, (sh[1] + tip[1]) / 2], trail = [(root[0] + tip[0]) / 2 - 0.6, (root[1] + tip[1]) / 2 + (tip[1] < 0 ? 0.5 : -0.3)];
      const poly = A.spline([Q(...root), Q(...sh), Q(...lead), Q(...tip), Q(...trail)], true, 0.15);
      A.fill(poly, 'chalk', far ? A.mix(C.wing, C.tip, 0.35) : C.wing, { w: 0.35, p: 1, passes: 3 });
      // the dark ends of the flight feathers
      A.stroke([Q(trail[0] + (tip[0] - trail[0]) * 0.4, trail[1] + (tip[1] - trail[1]) * 0.4), Q(...tip)], 'chalk', C.tip, { w: 0.6, p: 0.9, tin: 0.2 });
      A.outline(poly, 'kajal', C.line, { closed: true, w: 0.12, p: 0.7 });
    };
    wing([0.9, -0.6], [-1.0, -0.4], W[1], true);
    const body = A.spline([Q(3.2, -0.4), Q(1.6, -1.3), Q(-1.6, -1.1), Q(-3.0, -0.3), Q(-1.6, 0.9), Q(1.6, 1.0)], true, 0.15);
    const tail = [Q(-2.6, -0.5), Q(-5.6, -0.9), Q(-5.7, 0.6), Q(-2.6, 0.5)];
    A.fill(tail, 'chalk', C.body, { w: 0.35, p: 1, passes: 3 });
    A.stroke([Q(-5.1, -0.8), Q(-5.2, 0.55)], 'chalk', C.tip, { w: 0.5, p: 0.9 });
    A.fill(body, 'chalk', C.body, { w: 0.4, p: 1, passes: 3 });
    A.fill(A.ellipse(...Q(3.3, -1.0), 1.25, 1.15), 'chalk', C.head, { w: 0.3, p: 1, passes: 2 });
    A.fill([Q(4.4, -1.2), Q(5.3, -0.95), Q(4.4, -0.7)], 'chalk', '#c89a8a', { w: 0.2, p: 1, passes: 1 });
    A.dot(...Q(3.6, -1.25), 'kajal', '#140c08', { w: 0.35, p: 1 });
    A.outline(body, 'kajal', C.line, { closed: true, w: 0.12, p: 0.6 });
    A.outline(tail, 'kajal', C.line, { closed: true, w: 0.1, p: 0.5 });
    wing([0.5, -0.3], [-1.3, -0.2], W[0], false);
  }

  const L = [];
  // the breath of a lamp: a warm glow, three ways
  [[15, 0.92, 0.95], [13, 1.08, 0.85], [17, 0.86, 1]].forEach(([R, sq, k], i) => L.push({ name: 'glow' + i, w: 40, h: 40, ax: 20, ay: 22, draw(A, x, y) {
    const cx = x + 20, cy = y + 22, box = rect(x, y, x + 40, y + 40);
    radial(A, box, '#c8641e', cx, cy, R, 0.32 * k, sq);
    radial(A, box, '#f4a440', cx, cy - 1, R * 0.6, 0.38 * k, sq);
    radial(A, box, '#ffe4a0', cx, cy - 1.5, R * 0.28, 0.5 * k, sq * 1.2);
  } }));
  // dust in the sun
  [[0.9, 0.9], [0.7, 0.75], [1.2, 0.8]].forEach(([r, k], i) => L.push({ name: 'mote' + i, w: 6, h: 6, ax: 3, ay: 3, draw(A, x, y) {
    radial(A, rect(x, y, x + 6, y + 6), '#fff0c0', x + 3, y + 3, 2.6, 0.3 * k);
    A.dot(x + 3, y + 3, 'chalk', '#fff6d8', { w: r, p: k });
  } }));
  // a petal turning as it falls: one rose petal and one marigold petal, each at four turns
  for (const [kind, cn] of [['rose', 'pr'], ['mari', 'pm']]) for (let k = 0; k < 4; k++) L.push({ name: cn + k, w: 8, h: 8, ax: 4, ay: 4, draw(A, x, y) { M.w8Petal(A, x + 4, y + 4, 1.5, kind, 0.4 + k * 0.8); } });
  // pigeons far off
  for (const [c, cn] of [['grey', 'pg'], ['white', 'pw']]) for (const ph of ['U', 'M', 'D']) L.push({ name: cn + ph, w: 18, h: 16, ax: 9, ay: 8, boil: true, draw(A, x, y) { farPigeon(A, x + 9, y + 8, ph, c); } });
  // sarus cranes far off
  for (const [ph, wn] of [['U', 'up'], ['M', 'mid'], ['D', 'down']]) L.push({ name: 'cr' + ph, w: 40, h: 36, ax: 20, ay: 18, boil: true, draw(A, x, y) { M.w8Crane(A, x + 20, y + 18, 16, { flip: true, wing: wn }); } });
  // a firefly, lit and going dark
  [[1, 1.1], [0.45, 0.8]].forEach(([k, r], i) => L.push({ name: 'fly' + i, w: 10, h: 10, ax: 5, ay: 5, draw(A, x, y) {
    radial(A, rect(x, y, x + 10, y + 10), '#c8e860', x + 5, y + 5, 4.6, 0.55 * k);
    A.dot(x + 5, y + 5, 'chalk', k > 0.6 ? '#fbffd8' : '#e0f0a0', { w: r, p: 1 });
  } }));
  // rings opening on the water, seen from above at a slant
  [[[3.2, 0.95]], [[6.2, 0.85], [2.8, 0.6]], [[9.6, 0.7], [5.6, 0.55]], [[13, 0.5], [8.6, 0.38]]].forEach((rs, i) => L.push({ name: 'ring' + i, w: 32, h: 12, ax: 16, ay: 6, draw(A, x, y) {
    for (const [r, p] of rs) { A.stroke(A.ellipse(x + 16, y + 6, r, r * 0.3, 0, PI * 1.02, PI * 1.98), 'chalk', '#e4f4ee', { w: 0.55, p }); A.stroke(A.ellipse(x + 16, y + 6.2, r, r * 0.3, 0, PI * 0.06, PI * 0.94), 'chalk', '#9ccabc', { w: 0.45, p: p * 0.8 }); }
  } }));
  // the sun on gold leaf
  [[2.4, 1], [3.6, 0.9], [1.6, 0.8]].forEach(([s, k], i) => L.push({ name: 'spark' + i, w: 10, h: 10, ax: 5, ay: 5, draw(A, x, y) {
    const cx = x + 5, cy = y + 5;
    radial(A, rect(x, y, x + 10, y + 10), '#fff2b8', cx, cy, s * 1.1, 0.35 * k);
    for (const [a, l] of [[0, s], [PI / 2, s * 1.25], [PI / 4, s * 0.5], [-PI / 4, s * 0.5]]) A.stroke([[cx - Math.cos(a) * l, cy - Math.sin(a) * l], [cx + Math.cos(a) * l, cy + Math.sin(a) * l]], 'chalk', '#fffbe8', { w: 0.35, p: k, tin: 0.4, tout: 0.4 });
    A.dot(cx, cy, 'chalk', '#ffffff', { w: 0.6, p: 1 });
  } }));
  M.w8CelList = L;
})();
