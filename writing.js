/* Writing: the scroll.
   The text of the scroll is plain HTML.  Everything else is painted with the brush engine of the mural (src/mural/painter.js),
   so the scroll and the wall are one picture:
     #paper   the sheet: handmade wasli paper, a silk brocade mount at the top and the bottom, a Mewar folio border, the
              yellow panel for the title, a roundel for each number, rules between the entries, a lotus and a seal.
              It is painted to the size of the text, and again when the text changes size.
     #stave   the upper stave: the brocade wraps over it; turned lac ends and brass lotus-bud finials.
     #cord    a red and gold cord from the stave up to a brass peg in the wall.
     #spool   the lower stave with the paper still wound on it.  While the scroll opens, the roll turns (its paper moves
              by as much as has come off it) and gets thinner.  Drawn each frame from pieces painted once.
     .tassel  two silk tassels on the lower stave.
   Without scripts the page shows the text on a plain sheet. */
(() => {
  'use strict';
  const M = window.Mural, root = document.documentElement;
  // if anything is missing, show the plain sheet: writing.css hides the scroll until it is painted
  const plain = () => { root.classList.remove('js', 'painted'); };
  if (!M) { plain(); return; }
  const { rng, rgba, shade, Painter, grainTile, noiseCanvas, ellipsePath } = M;
  const TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);
  const scroll = $('scroll'), roll = $('roll'), text = $('text');
  const paper = $('paper'), stave = $('stave'), spool = $('spool'), cord = $('cord');
  const tassels = Array.prototype.slice.call(document.querySelectorAll('.tassel'));
  if (!scroll || !paper) { plain(); return; }

  const C = {
    paper: '#efe0b9', ink: '#1d1410', red: '#b3301f', sindoor: '#a3261a', maroon: '#7a1321',
    haldi: '#e8b43a', gold: '#d4a23a', goldD: '#9c6b1d', goldL: '#f3d27a', green: '#3f6a3e', white: '#fbf3e2',
    pink: '#d98b76', pinkD: '#9c4f43', silk: '#8a1d1a', lac: '#6e1a14', seal: '#b5291e',
  };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 560px)');
  const dprOf = () => Math.min(2, window.devicePixelRatio || 1);

  // ---- the measures of the scroll, in CSS pixels.  writing.css pads the text to fit them (--pad-*). ----------------
  const EXT = 34;          // how far the staves reach past the paper on each side: the turned end and the finial
  const RT = 9;            // the upper stave, with the brocade over it
  const TH = 32, TCY = 15; // the canvas of the upper stave, and the stave's centre in it
  const HC = 64;           // the cord rises this far above the centre of the upper stave
  const R0 = 21, R1 = 12;  // the radius of the lower roll when the scroll is shut, and when it is open
  const SH = 12;           // the lower canvas reaches this far up over the paper, for the shadow of the roll
  const BT = 26, BB = 20;  // the brocade at the top and the bottom of the sheet
  const S = 12, GAP = 8;   // the border: its distance from the side, and from the brocade
  const bwOf = () => (small.matches ? 11 : 15);   // the width of the red band of the border

  // ---- small helpers ------------------------------------------------------------------------------------------------
  const f = (v) => (Math.round(v * 100) / 100).toString();
  const rect = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)} H${f(x1)} V${f(y1)} H${f(x0)} Z`;
  // a frame: the outer rectangle clockwise and the inner one the other way, so it fills as a ring
  const ring = (x0, y0, x1, y1, w) => rect(x0, y0, x1, y1) + ` M${f(x0 + w)} ${f(y0 + w)} V${f(y1 - w)} H${f(x1 - w)} V${f(y0 + w)} Z`;
  // a path in local units, scaled and moved: pts is a flat list of commands and numbers
  function tx(d, s, x, y, rot = 0) {
    const c = Math.cos(rot), sn = Math.sin(rot);
    return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (m, a, b) => {
      const u = +a * s, v = +b * s;
      return f(x + u * c - v * sn) + ' ' + f(y + u * sn + v * c);
    });
  }
  function canvasFor(cv, w, h) {
    const dpr = dprOf();
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingQuality = 'high';
    return g;
  }
  function offscreen(w, h) {
    const dpr = dprOf(), c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingQuality = 'high';
    return { c, g, w, h };
  }

  // ==================================================================================================================
  // The paper
  // ==================================================================================================================

  // the sides of a handmade sheet are deckled: never straight, a little thin and bright at the very edge
  function deckle(W, H, r) {
    const N = M.noise1(91), p = new Path2D();
    p.moveTo(0, 0); p.lineTo(W, 0);
    for (let y = 0; y <= H; y += 3) p.lineTo(W - 0.6 - Math.abs(N(y / 9 + 40)) * 2.6 - Math.abs(N(y / 2.1 + 7)) * 0.8, y);
    p.lineTo(W, H); p.lineTo(0, H);
    for (let y = H; y >= 0; y -= 3) p.lineTo(0.6 + Math.abs(N(y / 9)) * 2.6 + Math.abs(N(y / 2.3 + 90)) * 0.8, y);
    p.closePath();
    return p;
  }

  // wasli: layered handmade paper.  A warm ground, soft patches, fibres, flecks of bark, browned edges, foxing,
  // an old water stain, and faint bands where it remembers being rolled
  function paperGround(g, W, H, seed) {
    const r = rng(seed);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const big = noiseCanvas(W / 22 + 3, H / 22 + 3, seed + 1, (n, x, y) => {
      const v = n.fbm(x / 5, y / 5, 4);
      return v > 0.52 ? [190, 140, 70, Math.min(255, (v - 0.52) * 2 * 70)] : [255, 247, 222, Math.min(255, (0.52 - v) * 2 * 120)];
    });
    g.drawImage(big, 0, 0, W + 66, H + 66);
    const mid = noiseCanvas(W / 5 + 2, H / 5 + 2, seed + 2, (n, x, y) => {
      const v = n.fbm(x / 4, y / 4, 3);
      return v > 0.6 ? [170, 120, 60, (v - 0.6) * 2 * 55] : [255, 250, 232, Math.max(0, 0.4 - v) * 2 * 60];
    });
    g.drawImage(mid, 0, 0, W + 10, H + 10);
    // fibres
    g.lineCap = 'round';
    const nf = Math.min(5000, (W * H) / 230);
    for (let i = 0; i < nf; i++) {
      const x = r.range(-6, W), y = r.range(-6, H), a = r.range(0, TAU), l = r.range(3, 15), b = r.range(-0.5, 0.5);
      g.strokeStyle = r() < 0.5 ? `rgba(125,82,32,${r.range(0.05, 0.12)})` : `rgba(255,251,236,${r.range(0.12, 0.3)})`;
      g.lineWidth = r.range(0.35, 0.85);
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + b) * l / 2, y + Math.sin(a + b) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    // flecks of bark and grit, pressed into the sheet
    for (let i = 0; i < (W * H) / 9000; i++) {
      const x = r.range(0, W), y = r.range(0, H), s = r.range(0.4, 1.3);
      g.fillStyle = `rgba(70,45,20,${r.range(0.25, 0.6)})`;
      g.beginPath(); g.ellipse(x, y, s * r.range(1, 2.4), s * r.range(0.5, 1), r.range(0, 3), 0, TAU); g.fill();
    }
    // the bands of a sheet that was kept rolled: slow light and dark, faint
    const per = 2 * Math.PI * 15, gr = g.createLinearGradient(0, 0, 0, H);
    const steps = Math.ceil(H / 8);
    for (let k = 0; k <= steps; k++) {
      const y = k / steps, s = Math.sin((y * H) / per * TAU + 1.3) * (0.6 + 0.4 * Math.sin(y * 7.1));
      gr.addColorStop(y, s > 0 ? `rgba(120,75,25,${(s * 0.045).toFixed(3)})` : `rgba(255,250,235,${(-s * 0.07).toFixed(3)})`);
    }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // the edges browned with age, unevenly
    const q = 4, burn = noiseCanvas(W / q + 2, H / q + 2, seed + 3, (n, x, y) => {
      const d = Math.min(x, W / q - x, (y - BT / q) * 1.6, (H / q - BB / q - y) * 1.6);
      const v = n.fbm(x / 7, y / 7, 4), reach = 4 + v * 9;
      const a = Math.max(0, 1 - d / reach);
      return [128, 74, 22, a * a * 150];
    });
    g.drawImage(burn, 0, 0, W + 2 * q, H + 2 * q);
    // foxing: small rust spots in a few clusters
    for (let c = 0; c < 5; c++) {
      const cx = r.range(W * 0.08, W * 0.92), cy = r.range(H * 0.1, H * 0.95), n = r.int(3, 9);
      for (let k = 0; k < n; k++) {
        const x = cx + r.gauss() * 26, y = cy + r.gauss() * 22, rad = r.range(1.2, 4.6);
        const sp = g.createRadialGradient(x, y, 0, x, y, rad);
        sp.addColorStop(0, `rgba(140,78,30,${r.range(0.25, 0.45)})`); sp.addColorStop(0.45, 'rgba(150,90,40,0.16)'); sp.addColorStop(1, 'rgba(150,90,40,0)');
        g.fillStyle = sp; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      }
    }
    // an old water stain: a pale pool with a darker tide line
    const sx = W * r.range(0.62, 0.8), sy = H * r.range(0.55, 0.75), R = Math.min(W, H) * r.range(0.13, 0.18);
    const N = M.noise1(seed + 4), tide = new Path2D();
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * TAU, rr = R * (1 + 0.22 * N(Math.cos(a) * 2 + 5) + 0.1 * N(a * 3 + 11));
      k ? tide.lineTo(sx + Math.cos(a) * rr * 1.25, sy + Math.sin(a) * rr) : tide.moveTo(sx + Math.cos(a) * rr * 1.25, sy + Math.sin(a) * rr);
    }
    tide.closePath();
    g.save();
    g.fillStyle = 'rgba(255,248,226,0.16)'; g.fill(tide);
    g.filter = 'blur(1.2px)'; g.strokeStyle = 'rgba(150,96,38,0.2)'; g.lineWidth = 2.2; g.stroke(tide);
    g.filter = 'blur(3px)'; g.strokeStyle = 'rgba(150,96,38,0.08)'; g.lineWidth = 7; g.stroke(tide);
    g.restore();
  }

  // red silk brocade (kimkhab): a fine weave, small gold buti in a half-drop, gold threads at its edges
  function brocade(g, P, x0, y0, x1, y1, seed, edges = true) {
    const r = rng(seed);
    P.fill(rect(x0, y0, x1, y1), C.silk, { mottle: 0.5, edge: false, angle: 0, blot: 0.6 });
    g.save();
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    for (let y = y0; y < y1; y += 1.4) {
      g.fillStyle = (Math.round(y / 1.4) & 1) ? 'rgba(255,220,200,0.05)' : 'rgba(0,0,0,0.07)';
      g.fillRect(x0, y, x1 - x0, 0.7);
    }
    const gx = 13, gy = 9;
    for (let row = 0, y = y0 + 5; y < y1 - 2; row++, y += gy) {
      for (let x = x0 + (row & 1 ? gx / 2 : 0) + 4; x < x1; x += gx) {
        g.fillStyle = rgba(C.goldL, r.range(0.7, 0.95));
        g.beginPath(); g.arc(x, y, 1.15, 0, TAU); g.fill();
        g.fillStyle = rgba(C.gold, 0.85);
        for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.785; g.beginPath(); g.arc(x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4, 0.7, 0, TAU); g.fill(); }
      }
    }
    g.restore();
    if (!edges) return;
    g.fillStyle = rgba(C.goldL, 0.85); g.fillRect(x0, y0 + 1.2, x1 - x0, 0.9); g.fillRect(x0, y1 - 2.1, x1 - x0, 0.9);
    g.fillStyle = 'rgba(40,10,4,0.55)'; g.fillRect(x0, y0, x1 - x0, 0.7); g.fillRect(x0, y1 - 0.7, x1 - x0, 0.7);
  }

  // a floret of five white petals round a yellow eye, as on the frieze of the wall
  function floret(P, x, y, s) {
    for (let k = 0; k < 5; k++) {
      const a = k * TAU / 5 - Math.PI / 2;
      P.dot(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, C.white);
    }
    P.dot(x, y, s * 0.3, C.haldi);
  }
  function leaf(g, x, y, l, a) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = rgba(C.green, 0.95);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -l * 0.32, l, 0); g.quadraticCurveTo(l * 0.5, l * 0.32, 0, 0); g.fill();
    g.restore();
  }
  // a rosette for a corner: a gold disc, eight petals, a red eye
  function rosette(P, g, x, y, R) {
    P.gold(ellipsePath(x, y, R), { w: 1.2 });
    for (let k = 0; k < 8; k++) {
      const a = k * TAU / 8;
      g.save(); g.translate(x + Math.cos(a) * R * 0.45, y + Math.sin(a) * R * 0.45); g.rotate(a);
      g.fillStyle = rgba(C.white, 0.95); g.beginPath(); g.ellipse(0, 0, R * 0.34, R * 0.17, 0, 0, TAU); g.fill();
      g.restore();
    }
    P.dot(x, y, R * 0.24, C.red, { ring: C.ink, ringW: 0.6 });
  }

  // the folio border: an ink rule, a red band with florets and leaves, a gold rule, an ink rule
  function border(g, P, x0, y0, x1, y1, bw) {
    P.line(rect(x0, y0, x1, y1), { w: 1.2, vary: 0.25, wobble: 0.25 });
    P.fill(ring(x0 + 1, y0 + 1, x1 - 1, y1 - 1, bw), C.red, { angle: 0, blot: 0.5, edgeW: 2 });
    // florets along the middle of the band, with a pair of leaves between each two
    const m = 1 + bw / 2, a0 = x0 + m, b0 = y0 + m, a1 = x1 - m, b1 = y1 - m;
    const sides = [[a0, b0, a1, b0], [a1, b0, a1, b1], [a1, b1, a0, b1], [a0, b1, a0, b0]];
    const s = bw * 0.52;
    sides.forEach(([xa, ya, xb, yb]) => {
      const len = Math.hypot(xb - xa, yb - ya), n = Math.max(2, Math.round(len / (bw * 1.75)));
      const ux = (xb - xa) / len, uy = (yb - ya) / len, dir = Math.atan2(uy, ux);
      for (let i = 1; i < n; i++) {
        const t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t;
        floret(P, x, y, s);
        const h = len / n / 2, lx = x + ux * h, ly = y + uy * h;
        leaf(g, lx, ly, bw * 0.38, dir - 0.9); leaf(g, lx, ly, bw * 0.38, dir + Math.PI + 0.9);
      }
    });
    const gi = 2 + bw;
    P.gold(ring(x0 + gi, y0 + gi, x1 - gi, y1 - gi, 3), { line: false });
    P.line(rect(x0 + gi, y0 + gi, x1 - gi, y1 - gi), { w: 0.7, vary: 0.2, wobble: 0.2, color: '#3a2410' });
    P.line(rect(x0 + gi + 3, y0 + gi + 3, x1 - gi - 3, y1 - gi - 3), { w: 0.9, vary: 0.25, wobble: 0.25 });
    [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].forEach(([x, y]) => rosette(P, g, x, y, bw * 0.78));
  }

  // a paisley (buta), the tip curling outward
  const BUTA = 'M0.5 -1 C0.15 -0.78 -0.58 -0.55 -0.62 0.12 C-0.64 0.6 -0.26 0.96 0.16 0.93 C0.62 0.89 0.82 0.44 0.63 0.04 C0.5 -0.26 0.28 -0.5 0.5 -1 Z';
  function buta(P, x, y, s, flip) {
    const g = P.ctx;
    g.save(); g.translate(x, y); g.scale(flip ? -1 : 1, 1); g.rotate(-0.5);
    P.fill(tx(BUTA, s, 0, 0), C.red, { blot: 0.3, edgeW: 1.5 });
    P.line(tx(BUTA, s, 0, 0), { w: 1.1, vary: 0.3 });
    P.dot(0, s * 0.3, s * 0.3, C.goldL, { ring: C.ink, ringW: 0.6 });
    P.pearls(tx('M-0.38 -0.1 C-0.3 -0.45 0 -0.6 0.25 -0.68', s, 0, 0), { gap: s * 0.22, r: s * 0.07, color: C.white });
    g.restore();
  }

  // a lotus, opening: two leaves, a gold calyx, five pink petals with darker veins
  const PETAL = 'M0 0 C0.55 -0.3 0.5 -0.82 0 -1 C-0.5 -0.82 -0.55 -0.3 0 0 Z';
  function lotus(P, x, y, s) {
    const g = P.ctx;
    leaf(g, x - s * 0.1, y + s * 0.05, s * 1.05, Math.PI - 0.12);
    leaf(g, x + s * 0.1, y + s * 0.05, s * 1.05, 0.12);
    [[-1.05, 0.95, C.pinkD], [1.05, 0.95, C.pinkD], [-0.55, 1, C.pink], [0.55, 1, C.pink], [0, 1.08, C.pink]].forEach(([a, k, col]) => {
      const d = tx(PETAL, s * k, x, y, a);
      P.fill(d, col, { blot: 0.25, edgeW: 1.2 });
      P.line(d, { w: 0.9, vary: 0.3, color: '#3a1a14' });
      P.line(tx('M0 -0.12 L0 -0.72', s * k, x, y, a), { w: 0.6, color: C.pinkD, alpha: 0.7, taper: 3 });
    });
    P.gold(`M${f(x - s * 0.42)} ${f(y - s * 0.05)} C${f(x - s * 0.3)} ${f(y + s * 0.32)} ${f(x + s * 0.3)} ${f(y + s * 0.32)} ${f(x + s * 0.42)} ${f(y - s * 0.05)} Z`, { w: 0.9 });
  }

  // the seal of the owner, pressed in vermilion: the letters stand in the colour of the paper
  function seal(P, x, y, s, seed) {
    const g = P.ctx, r = rng(seed), N = M.noise1(seed);
    g.save(); g.translate(x, y); g.rotate(-0.07);
    const h = s / 2, p = [];
    for (let k = 0; k < 40; k++) {
      const t = k / 40 * 4, side = Math.floor(t), u = t - side, j = N(k * 0.7) * 0.9;
      const pt = [[-h + u * s, -h + j], [h + j, -h + u * s], [h - u * s, h + j], [-h + j, h - u * s]][side];
      p.push(pt);
    }
    const d = 'M' + p.map((q) => f(q[0]) + ' ' + f(q[1])).join(' L') + ' Z';
    g.globalAlpha = 0.9;
    P.fill(d, C.seal, { blot: 0.3, edge: false, mottle: 1.6 });
    g.globalAlpha = 1;
    g.strokeStyle = rgba(C.paper, 0.9); g.lineWidth = 1.3;
    g.strokeRect(-h + 3.2, -h + 3.2, s - 6.4, s - 6.4);
    g.fillStyle = rgba(C.paper, 0.95); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${f(s * 0.44)}px Eczar, Georgia, serif`;
    g.fillText('A', -s * 0.17, -s * 0.12); g.fillText('P', s * 0.17, s * 0.15);
    // the ink took unevenly: flecks of paper show through it
    for (let k = 0; k < s * 3; k++) {
      g.fillStyle = rgba(C.paper, r.range(0.25, 0.8));
      g.beginPath(); g.arc(r.range(-h, h), r.range(-h, h), r.range(0.3, 1.1), 0, TAU); g.fill();
    }
    g.restore();
  }

  // where things are in the text, relative to the sheet
  function measure() {
    const box = text.getBoundingClientRect(), rel = (e) => {
      const b = e.getBoundingClientRect();
      return { x0: b.left - box.left, y0: b.top - box.top, x1: b.right - box.left, y1: b.bottom - box.top };
    };
    const items = Array.prototype.slice.call(text.querySelectorAll('.index > li')).map((li) => {
      const b = rel(li), cs = getComputedStyle(li, '::before');
      const w = parseFloat(cs.width) || 26, h = parseFloat(cs.height) || 26;
      return { ...b, cx: b.x0 + (parseFloat(cs.left) || 0) + w / 2, cy: b.y0 + (parseFloat(cs.top) || 0) + h / 2, nr: Math.min(w, h) / 2 };
    });
    const title = text.querySelector('h1'), word = title.querySelector('span') || title, end = text.querySelector('.end');
    return { W: box.width, H: box.height, title: rel(title), word: rel(word), end: end ? rel(end) : null, items };
  }

  function paintPaper(m) {
    const { W, H } = m, g = canvasFor(paper, W, H), P = new Painter(g, 17), bw = bwOf();
    const edge = deckle(W, H);
    g.save(); g.clip(edge);
    paperGround(g, W, H, 41);
    // the mount: brocade at the top (it goes on over the stave) and at the bottom (it goes into the roll)
    brocade(g, P, 0, 0, W, BT, 5);
    brocade(g, P, 0, H - BB, W, H, 6);
    // the stave above throws a soft shadow down on the brocade
    let sh = g.createLinearGradient(0, RT - 2, 0, RT + 12);
    sh.addColorStop(0, 'rgba(30,8,2,0.5)'); sh.addColorStop(1, 'rgba(30,8,2,0)');
    g.fillStyle = sh; g.fillRect(0, RT - 2, W, 14);
    // where paper meets brocade: a fold of paper over the silk
    sh = g.createLinearGradient(0, BT, 0, BT + 5);
    sh.addColorStop(0, 'rgba(70,40,10,0.28)'); sh.addColorStop(1, 'rgba(70,40,10,0)');
    g.fillStyle = sh; g.fillRect(0, BT, W, 5);
    sh = g.createLinearGradient(0, H - BB - 5, 0, H - BB);
    sh.addColorStop(0, 'rgba(70,40,10,0)'); sh.addColorStop(1, 'rgba(70,40,10,0.24)');
    g.fillStyle = sh; g.fillRect(0, H - BB - 5, W, 5);

    // the border
    const bx0 = S, by0 = BT + GAP, bx1 = W - S, by1 = H - BB - GAP;
    border(g, P, bx0, by0, bx1, by1, bw);
    const xi0 = bx0 + bw + 6, yi0 = by0 + bw + 6, xi1 = bx1 - bw - 6;

    // the yellow panel for the title, as at the head of a Mewar folio
    const py1 = Math.max(m.title.y1 + 12, yi0 + 40);
    P.fill(rect(xi0, yi0, xi1, py1), C.haldi, { angle: 0, blot: 0.7, edge: false });
    P.line(`M${f(xi0)} ${f(py1)} L${f(xi1)} ${f(py1)}`, { w: 1.1, taper: 0, vary: 0.25 });
    P.line(`M${f(xi0)} ${f(py1 + 3.2)} L${f(xi1)} ${f(py1 + 3.2)}`, { w: 1.4, taper: 0, color: C.red, vary: 0.3 });
    const wy = (m.word.y0 + m.word.y1) / 2 + 2, bs = Math.min(15, (py1 - yi0) * 0.32);
    buta(P, m.word.x0 - bs * 1.9, wy, bs, false);
    buta(P, m.word.x1 + bs * 1.9, wy, bs, true);

    // a rule between each two entries, with a small flower in a gap at its middle
    m.items.forEach((it, i) => {
      if (i > 0) {
        const y = it.y0, mid = (xi0 + xi1) / 2, xa = xi0 + 8, xb = xi1 - 8;
        P.line(`M${f(xa)} ${f(y)} L${f(mid - 13)} ${f(y)}`, { w: 1, color: C.sindoor, taper: 26, vary: 0.3 });
        P.line(`M${f(mid + 13)} ${f(y)} L${f(xb)} ${f(y)}`, { w: 1, color: C.sindoor, taper: 26, vary: 0.3 });
        P.line(`M${f(xa + 30)} ${f(y + 3)} L${f(mid - 15)} ${f(y + 3)}`, { w: 0.7, color: C.goldD, alpha: 0.75, taper: 20 });
        P.line(`M${f(mid + 15)} ${f(y + 3)} L${f(xb - 30)} ${f(y + 3)}`, { w: 0.7, color: C.goldD, alpha: 0.75, taper: 20 });
        for (let k = 0; k < 4; k++) {
          const a = k * TAU / 4;
          P.dot(mid + Math.cos(a) * 4, y + 1.5 + Math.sin(a) * 4, 2.6, C.red, { ring: C.ink, ringW: 0.4 });
        }
        P.dot(mid, y + 1.5, 1.8, C.goldL);
      }
      // the roundel the number is written in: gold, ringed, with a ring of pearls
      P.gold(ellipsePath(it.cx, it.cy, it.nr), { w: 1.3 });
      P.pearls(ellipsePath(it.cx, it.cy, it.nr + 3.6), { gap: 4.4, r: 1, color: C.red });
    });

    // at the foot: a lotus in the middle and the seal at the right
    if (m.end) {
      const ey = (m.end.y0 + m.end.y1) / 2;
      lotus(P, (xi0 + xi1) / 2, ey + 9, 15);
      seal(P, xi1 - 34, ey + 2, small.matches ? 30 : 36, 77);
    }

    // grain over all of it, and the bright thin edge of the deckle
    const tile = grainTile(256, 29, 150, 255);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.13;
    g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.restore();
    g.save(); g.clip(edge);
    g.strokeStyle = 'rgba(255,249,232,0.75)'; g.lineWidth = 2.2; g.stroke(edge);
    g.restore();
  }

  // ==================================================================================================================
  // The staves
  // ==================================================================================================================

  // light falls from the upper left: a cylinder is bright a third of the way down and dark at its foot
  function cylShade(g, x0, x1, cy, R, k = 1) {
    const gr = g.createLinearGradient(0, cy - R, 0, cy + R);
    gr.addColorStop(0, `rgba(20,6,0,${0.35 * k})`);
    gr.addColorStop(0.22, `rgba(255,240,210,${0.28 * k})`);
    gr.addColorStop(0.36, `rgba(255,240,210,${0.06 * k})`);
    gr.addColorStop(0.7, `rgba(20,6,0,${0.18 * k})`);
    gr.addColorStop(1, `rgba(20,6,0,${0.58 * k})`);
    g.fillStyle = gr; g.fillRect(x0, cy - R, x1 - x0, 2 * R);
  }

  // one end of a stave, pointing to the right from its root: a turned lac stub with gold rings, then a brass finial
  // shaped as a lotus bud.  The profile is a list of [length, radius] turned on the axis.
  const STUB = [[0, 0.62], [9, 0.62]];
  const FINIAL = [[0, 0.95], [2.5, 0.95], [2.6, 0.5], [5, 0.45], [5.1, 0.85], [7, 1.05], [10.5, 1.22], [14, 1.0], [16, 0.55], [17.5, 0.4], [21, 0.14], [22, 0]];
  function lathe(prof, x, cy, R, dir) {
    const top = prof.map(([t, r]) => [x + dir * t, cy - r * R]), bot = prof.slice().reverse().map(([t, r]) => [x + dir * t, cy + r * R]);
    return 'M' + top.concat(bot).map((p) => f(p[0]) + ' ' + f(p[1])).join(' L') + ' Z';
  }
  function staveEnd(g, P, x, cy, R, dir) {
    // the turned lac stub, red-brown, with two gold rings
    const s = lathe(STUB, x, cy, R, dir);
    P.fill(s, C.lac, { angle: 0, blot: 0.3, edge: false });
    g.save(); g.clip(new Path2D(s));
    [2.5, 6.5].forEach((t) => { g.fillStyle = rgba(C.gold, 0.95); g.fillRect(dir > 0 ? x + t : x - t - 1.4, cy - R, 1.4, 2 * R); });
    cylShade(g, Math.min(x, x + dir * 9), Math.max(x, x + dir * 9), cy, R * 0.62);
    g.restore();
    // the brass finial
    const fx = x + dir * 9, fd = lathe(FINIAL, fx, cy, R, dir);
    P.gold(fd, { w: 1.1, base: '#c99434' });
    g.save(); g.clip(new Path2D(fd));
    cylShade(g, Math.min(fx, fx + dir * 22), Math.max(fx, fx + dir * 22), cy, R * 1.25, 1.1);
    // the petals of the bud, scored into the brass
    g.strokeStyle = 'rgba(70,40,8,0.55)'; g.lineWidth = 0.6;
    [-0.5, 0, 0.5].forEach((v) => { g.beginPath(); g.moveTo(fx + dir * 7.5, cy + v * R * 1.2); g.quadraticCurveTo(fx + dir * 15, cy + v * R * 0.9, fx + dir * 21, cy); g.stroke(); });
    g.restore();
  }

  // the upper stave: the brocade of the mount wrapped over a round stave, with the ends and the cord tied on
  function paintStave(W) {
    const w = W + 2 * EXT, g = canvasFor(stave, w, TH), P = new Painter(g, 23), cy = TCY;
    const x0 = EXT, x1 = EXT + W;
    // the wrapped brocade
    g.save(); g.beginPath(); g.rect(x0 - 1, cy - RT, W + 2, 2 * RT); g.clip();
    brocade(g, P, x0 - 1, cy - RT, x1 + 1, cy + RT, 9);
    cylShade(g, x0 - 1, x1 + 1, cy, RT, 1.1);
    g.restore();
    // its ends: the silk is folded in, a little darker
    [x0, x1].forEach((x) => { g.fillStyle = 'rgba(40,8,4,0.45)'; g.fillRect(x - 1, cy - RT, 2, 2 * RT); });
    staveEnd(g, P, x0 - 1, cy, RT * 0.86, -1);
    staveEnd(g, P, x1 + 1, cy, RT * 0.86, 1);
    // the cord is tied round each stub: three turns
    [x0 - 6, x1 + 6].forEach((x) => {
      for (let k = -1; k <= 1; k++) {
        g.fillStyle = k ? C.red : C.goldL;
        g.beginPath(); g.ellipse(x + k * 1.6, cy, 1.1, RT * 0.62 + 0.8, 0.12, 0, TAU); g.fill();
      }
    });
  }

  // the cord: from the two ties up to a brass peg in the wall, twisted red and gold, and its shadow on the wall
  function paintCord(W) {
    const w = W + 2 * EXT, h = HC + 16, g = canvasFor(cord, w, h), P = new Painter(g, 31);
    const px = w / 2, py = 13, yt = HC + 1, ties = [[EXT - 6, yt], [EXT + W + 6, yt]];
    const path = (dx, dy) => {
      const p = new Path2D();
      ties.forEach(([x, y], i) => {
        p.moveTo(x + dx, y + dy);
        // a little belly in the cord near the peg, where it bends over
        p.quadraticCurveTo(px + (x - px) * 0.08 + dx, py + 3 + dy, px + dx + (i ? 1.5 : -1.5), py + dy);
      });
      return p;
    };
    g.save(); g.filter = 'blur(2px)'; g.strokeStyle = 'rgba(60,30,8,0.28)'; g.lineWidth = 3; g.stroke(path(5, 8)); g.restore();
    g.lineCap = 'round';
    g.strokeStyle = '#5a120e'; g.lineWidth = 2.8; g.stroke(path(0, 0));
    g.strokeStyle = C.red; g.lineWidth = 2; g.stroke(path(0, 0));
    g.save(); g.setLineDash([2.2, 2.6]); g.strokeStyle = C.goldL; g.lineWidth = 1.3; g.stroke(path(0, -0.2)); g.restore();
    // the peg: a brass nail head and its shadow on the plaster
    g.save(); g.filter = 'blur(2.5px)'; g.fillStyle = 'rgba(60,30,8,0.35)'; g.beginPath(); g.arc(px + 4, py + 6, 6, 0, TAU); g.fill(); g.restore();
    P.gold(ellipsePath(px, py, 5.6), { w: 1.1, base: '#c99434' });
    P.dot(px - 1.6, py - 1.8, 1.6, '#fff2c4', { alpha: 0.8 });
  }

  // ---- the lower roll: painted once in pieces, put together each frame ------------------------------------------------
  let rollTex = null, ends = null, curW = 0;
  function paintRollPieces(W) {
    // the outside of the roll is the silk of the lower mount, wound on the stave: a strip of brocade as long as a few
    // turns, a whole number of rows of buti (two rows to a repeat), so it joins where it wraps.  As the roll turns, the
    // buti move by as much paper as has come off.
    const th = Math.ceil(2 * Math.PI * R0 * 2 / 18) * 18;
    const t = offscreen(W, th);
    brocade(t.g, new Painter(t.g, 63), 0, -5, W, th + 4, 63, false);
    rollTex = t;
    // the two ends of the lower stave, on a sprite with the axis at its middle
    const eh = 2 * 14, e = offscreen(EXT + 4, eh), P = new Painter(e.g, 47);
    staveEnd(e.g, P, EXT + 2, eh / 2, 7.5, -1);
    const e2 = offscreen(EXT + 4, eh), P2 = new Painter(e2.g, 48);
    staveEnd(e2.g, P2, 2, eh / 2, 7.5, 1);
    ends = { l: e, r: e2, h: eh };
  }

  function drawSpool(W, rad, turn) {
    const w = W + 2 * EXT, h = SH + 2 * R0 + 6;
    let g = spool.getContext('2d');
    const dpr = dprOf();
    if (spool.width !== Math.round(w * dpr) || spool.height !== Math.round(h * dpr)) g = canvasFor(spool, w, h);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, spool.width, spool.height); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cy = SH + rad, x0 = EXT, x1 = EXT + W;
    // the shadow of the roll on the paper above it, and the paper bending in toward it
    const sh = g.createLinearGradient(0, SH - 12, 0, SH);
    sh.addColorStop(0, 'rgba(60,30,6,0)'); sh.addColorStop(1, 'rgba(60,30,6,0.34)');
    g.fillStyle = sh; g.fillRect(x0 + 2, SH - 12, W - 4, 12);
    // the stave ends, behind the roll
    g.drawImage(ends.l.c, 0, 0, ends.l.c.width, ends.l.c.height, -2, cy - ends.h / 2, EXT + 4, ends.h);
    g.drawImage(ends.r.c, 0, 0, ends.r.c.width, ends.r.c.height, x1 - 2, cy - ends.h / 2, EXT + 4, ends.h);
    // the roll: each row of it shows the strip at the arc length it has turned to
    const th = rollTex.h, tc = rollTex.c, k = tc.height / th;
    for (let y = -rad; y < rad; y += 0.5) {
      const yy = Math.min(rad - 0.01, Math.max(-rad + 0.01, y + 0.25));
      const s = Math.asin(yy / rad) * rad - turn;
      const v = ((s % th) + th) % th;
      g.drawImage(tc, 0, Math.floor(v * k), tc.width, Math.max(1, Math.ceil(0.5 * k)), x0, cy + y, W, 0.5);
    }
    g.save(); g.beginPath(); g.rect(x0, cy - rad, W, 2 * rad); g.clip();
    cylShade(g, x0, x1, cy, rad, 1);
    // the cut ends of the wound sheet: a ring for each turn, seen almost edge on
    const turns = Math.max(1, Math.round((rad - 6) / 1.1));
    g.lineWidth = 0.6;
    for (let i = 0; i < turns; i++) {
      const rr = 6 + (rad - 6) * (i + 1) / turns;
      g.strokeStyle = `rgba(30,6,2,${0.3 + 0.2 * (i & 1)})`;
      [x0 + 1.2, x1 - 1.2].forEach((x, j) => { g.beginPath(); g.ellipse(x + (j ? -1 : 1) * (i % 3) * 0.25, cy, 1.4, rr, 0, j ? -Math.PI / 2 : Math.PI / 2, j ? Math.PI / 2 : Math.PI * 1.5); g.stroke(); });
    }
    g.restore();
    // where the sheet leaves the roll
    g.fillStyle = 'rgba(60,30,6,0.35)'; g.fillRect(x0, cy - rad, W, 0.8);
    // the tassels hang from the stubs: keep them on the axis as the roll thins
    tassels.forEach((t) => { t.style.top = cy + 'px'; });
  }

  // a silk tassel: a loop of cord, a gold cap, a fall of red threads with a few gold ones
  function paintTassel(cv, seed) {
    const w = 22, h = 66, g = canvasFor(cv, w, h), P = new Painter(g, seed), r = rng(seed);
    g.lineCap = 'round';
    g.strokeStyle = '#5a120e'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(w / 2, 0); g.quadraticCurveTo(w / 2 + 2, 7, w / 2, 13); g.stroke();
    g.strokeStyle = C.red; g.lineWidth = 1.1; g.stroke();
    for (let k = 0; k < 46; k++) {
      const x0 = w / 2 + r.range(-3.2, 3.2), x1 = w / 2 + r.range(-8, 8), y1 = h - r.range(1, 9);
      g.strokeStyle = r() < 0.14 ? rgba(C.goldL, 0.95) : rgba(shade(C.red, r.range(-0.35, 0.12)), 0.95);
      g.lineWidth = r.range(0.5, 1.05);
      g.beginPath(); g.moveTo(x0, 22); g.quadraticCurveTo((x0 + x1) / 2 + r.range(-1, 1), (22 + y1) / 2, x1, y1); g.stroke();
    }
    P.gold(`M${w / 2 - 4} 23 C${w / 2 - 5} 16 ${w / 2 - 2.5} 12 ${w / 2} 12 C${w / 2 + 2.5} 12 ${w / 2 + 5} 16 ${w / 2 + 4} 23 Z`, { w: 0.9, base: '#c99434' });
    g.fillStyle = rgba(C.goldL, 0.9); g.fillRect(w / 2 - 4.5, 23, 9, 1.6);
    g.fillStyle = 'rgba(30,6,2,0.35)'; g.fillRect(w / 2 - 4.5, 24.6, 9, 1.4);
  }

  // ==================================================================================================================
  // Putting it together, and the opening
  // ==================================================================================================================
  let H = 0, prog = still ? 1 : 0, opened = still, last = '';

  function paintAll() {
    const m = measure();
    if (m.W < 40 || m.H < 40) return;
    // paint only when something on the sheet has moved: a repaint can itself ask for a font, and that must not loop
    const sig = JSON.stringify([m, small.matches, document.fonts ? document.fonts.status : '']);
    if (sig === last) return;
    last = sig;
    H = m.H;
    paintPaper(m);
    if (m.W !== curW) {
      curW = m.W;
      paintStave(m.W); paintCord(m.W); paintRollPieces(m.W);
      tassels.forEach((t, i) => paintTassel(t.querySelector('canvas'), 101 + i));
    }
    frame();
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function frame() {
    const p = ease(prog);
    const rad = Math.sqrt(R1 * R1 + (R0 * R0 - R1 * R1) * (1 - p));
    // shut, the sheet shows only the brocade under the upper stave; the roll turns by as much paper as comes off it
    const len = p * (H - 2 * RT);
    roll.style.height = opened ? 'auto' : (2 * RT + len).toFixed(2) + 'px';
    drawSpool(curW, rad, len);
  }

  function open() {
    const T = 2400;
    let t0 = 0, prev = 0;
    const step = (now) => {
      t0 = t0 || now;   // count from the first frame, so a busy start does not skip the beginning
      // a late frame pauses the unrolling, it does not make it jump
      if (prev && now - prev > 50) t0 += now - prev - 17;
      prev = now;
      prog = Math.min(1, (now - t0) / T);
      if (prog >= 1) { opened = true; frame(); scroll.classList.add('settle'); return; }
      frame();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  try {
    root.classList.add('painted');
    paintAll();
  } catch (e) {
    plain();
    throw e;
  }
  // the shut scroll hangs at once.  It unrolls when the wall is painted (haveli.js sends 'wall:ready'): painting the
  // wall stops the page for a moment, and the unrolling must not stop with it.
  scroll.classList.add('hung');
  if (!still) {
    let started = false;
    // start when the browser draws smoothly again: 8 frames in a row, each on time (or after 1.5 s at most)
    const go = () => {
      if (started) return;
      started = true;
      let ok = 0, prev = 0;
      const t1 = performance.now();
      const wait = (now) => {
        ok = prev && now - prev < 25 ? ok + 1 : 0;
        prev = now;
        if (ok >= 8 || now - t1 > 1500) open(); else requestAnimationFrame(wait);
      };
      requestAnimationFrame(wait);
    };
    document.addEventListener('wall:ready', go, { once: true });
    setTimeout(go, 2500);   // the wall is late, or it failed
  }

  // paint again when the text changes size (the font arrives, the window turns) or the font of the seal arrives
  let timer = 0;
  const again = () => { clearTimeout(timer); timer = setTimeout(() => { try { paintAll(); } catch (e) { plain(); throw e; } }, 120); };
  if (window.ResizeObserver) new ResizeObserver(again).observe(text);
  if (document.fonts) document.fonts.ready.then(again);
  small.addEventListener && small.addEventListener('change', () => { curW = 0; last = ''; again(); });
})();
