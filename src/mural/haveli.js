/* Haveli wall: the Mewar elephant (elephant.js) painted on a lime-plaster wall.  From the mural prototypes (MessingAround).
   The elephant is flipped, so that it walks toward the scroll of the Writing page. */
(() => {
  'use strict';
  const M = window.Mural;
  const { rng, noiseCanvas, grainTile } = M;
  const TAU = Math.PI * 2;
  const EB = window.Elephant.EB;

  const leafD = (l, w) => `M0 0 C${0.12 * l} ${-0.35 * w} ${0.45 * l} ${-0.62 * w} ${0.68 * l} ${-0.45 * w} C${0.85 * l} ${-0.3 * w} ${0.95 * l} ${-0.1 * w} ${l} 0 C${0.95 * l} ${0.1 * w} ${0.85 * l} ${0.3 * w} ${0.68 * l} ${0.45 * w} C${0.45 * l} ${0.62 * w} ${0.12 * l} ${0.35 * w} 0 0 Z`;
  const rect = (x0, y0, x1, y1) => `M${x0} ${y0} H${x1} V${y1} H${x0} Z`;

  // ---------- the wall ----------

  function paintWall(g, W, H, L) {
    const r = rng(7), P = new M.Painter(g, 11);
    g.fillStyle = '#ecd59c'; g.fillRect(0, 0, W, H);
    g.imageSmoothingQuality = 'high';
    // big soft patches of warmer and lighter lime wash
    const big = noiseCanvas(Math.ceil(W / 30) + 3, Math.ceil(H / 30) + 3, 3, (n, x, y) => {
      const v = n.fbm(x / 6, y / 6, 4);
      return v > 0.5 ? [214, 174, 100, Math.min(255, (v - 0.5) * 2 * 95)] : [253, 242, 204, Math.min(255, (0.5 - v) * 2 * 140)];
    });
    g.drawImage(big, 0, 0, W + 90, H + 90);
    const mid = noiseCanvas(Math.ceil(W / 6) + 2, Math.ceil(H / 6) + 2, 9, (n, x, y) => {
      const v = n.fbm(x / 5, y / 5, 3);
      return v > 0.58 ? [200, 160, 92, (v - 0.58) * 2 * 70] : [255, 249, 226, Math.max(0, 0.42 - v) * 2 * 70];
    });
    g.drawImage(mid, 0, 0, W + 12, H + 12);
    // trowel sweeps
    g.save(); g.filter = 'blur(10px)';
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = r() < 0.55 ? 'rgba(255,250,228,0.14)' : 'rgba(190,150,80,0.05)';
      g.lineWidth = r.range(20, 60);
      const cx = r.range(-100, W + 100), cy = r.range(0, H), rad = r.range(80, 260), a0 = r.range(0, TAU);
      g.beginPath(); g.arc(cx, cy, rad, a0, a0 + r.range(0.4, 1.1)); g.stroke();
    }
    g.restore();

    const c = L.c, f = L.f, y0 = H - L.p;
    // warm damp at the foot of the wall
    const dg = g.createLinearGradient(0, y0 - 90, 0, y0);
    dg.addColorStop(0, 'rgba(170,120,50,0)'); dg.addColorStop(1, 'rgba(150,105,45,0.2)');
    g.fillStyle = dg; g.fillRect(0, y0 - 90, W, 90);

    // the cornice: a whitewashed moulding with small brackets under it
    const top = g.createLinearGradient(0, 0, 0, c * 0.6);
    top.addColorStop(0, '#fcf5e0'); top.addColorStop(1, '#f2e4bd');
    g.fillStyle = top; g.fillRect(0, 0, W, c * 0.6);
    g.fillStyle = '#c9a868'; g.fillRect(0, c * 0.58, W, c * 0.05);
    const roll = g.createLinearGradient(0, c * 0.63, 0, c * 0.84);
    roll.addColorStop(0, '#fff7de'); roll.addColorStop(0.55, '#f0dfb2'); roll.addColorStop(1, '#c9ab70');
    g.fillStyle = roll; g.fillRect(0, c * 0.63, W, c * 0.21);
    g.fillStyle = '#8f7144'; g.fillRect(0, c * 0.84, W, c * 0.03);
    const bw = c * 0.2, bs = c * 0.62;
    for (let x = (W % bs) / 2 - bs / 2; x < W; x += bs) {
      const bg = g.createLinearGradient(x, 0, x + bw, 0);
      bg.addColorStop(0, '#f6e8c2'); bg.addColorStop(1, '#d9bd84');
      g.fillStyle = bg; g.fillRect(x, c * 0.87, bw, c * 0.13);
      g.fillStyle = 'rgba(110,80,35,0.35)'; g.fillRect(x + bw, c * 0.87, 3, c * 0.13);
    }
    g.save(); g.filter = 'blur(2px)';
    for (let i = 0; i < W / 18; i++) { g.fillStyle = `rgba(150,120,70,${r.range(0.03, 0.09)})`; g.fillRect(r.range(0, W), r.range(0, c * 0.56), r.range(4, 40), r.range(1, 4)); }
    g.restore();

    // painted frieze: a red band with a white vine, green leaves and white flowers
    const fy0 = c, fy1 = c + f, fm = (fy0 + fy1) / 2;
    P.fill(rect(-4, fy0, W + 4, fy0 + 4), '#d9a63a', { mottle: 0.4, edge: false });
    P.fill(rect(-4, fy0 + 4, W + 4, fy1 - 4), '#a83a2a', { var: 0.7, mottle: 0.6, edge: false });
    P.fill(rect(-4, fy1 - 4, W + 4, fy1), '#d9a63a', { mottle: 0.4, edge: false });
    for (const y of [fy0, fy0 + 4, fy1 - 4, fy1]) P.line(`M-4 ${y} L${W + 4} ${y}`, { w: 1.1, taper: 0, wobble: 0.3 });
    const per = Math.max(46, f * 2.6), amp = (f - 8) * 0.2, wave = [];
    for (let x = -10; x <= W + 10; x += 2) wave.push([x, fm + Math.sin((x / per) * TAU) * amp]);
    P.strokePts(wave, { w: 1.4, color: '#fbf3df', alpha: 0.95, taper: 0 });
    for (let x = per / 4 - per; x < W + per; x += per / 2) {
      const up = Math.sin((x / per) * TAU) > 0 ? 1 : -1, ly = fm + up * amp;
      for (const s of [-1, 1]) {
        g.save(); g.translate(x + s * 3, ly); g.rotate(s > 0 ? -0.5 * up : Math.PI + 0.5 * up);
        P.fill(leafD(f * 0.38, f * 0.2), '#2f6b4a', { mottle: 0 });
        g.restore();
      }
      const fx = x + per / 4, fyy = fm - up * amp * 0.2;
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; P.dot(fx + Math.cos(a) * f * 0.12, fyy + Math.sin(a) * f * 0.12, f * 0.075, '#fbf3df'); }
      P.dot(fx, fyy, f * 0.06, '#f2c64a');
    }
    const fsh = g.createLinearGradient(0, fy1, 0, fy1 + 26);
    fsh.addColorStop(0, 'rgba(110,70,25,0.22)'); fsh.addColorStop(1, 'rgba(110,70,25,0)');
    g.fillStyle = fsh; g.fillRect(0, fy1, W, 26);

    // sandstone plinth: the ledge seen from above, then a lotus moulding
    const lh = L.p * 0.38;
    g.fillStyle = '#cfae7a'; g.fillRect(0, y0, W, lh);
    const st = noiseCanvas(Math.ceil(W / 3), Math.ceil(lh / 3) + 2, 21, (n, x, y) => {
      const v = n.fbm(x / 8, y / 3, 4);
      return v > 0.5 ? [150, 110, 64, (v - 0.5) * 2 * 120] : [244, 224, 184, (0.5 - v) * 2 * 110];
    });
    g.drawImage(st, 0, y0, W + 3, lh + 6);
    const lg = g.createLinearGradient(0, y0, 0, y0 + lh);
    lg.addColorStop(0, 'rgba(90,60,25,0.35)'); lg.addColorStop(0.3, 'rgba(90,60,25,0)'); lg.addColorStop(1, 'rgba(255,245,220,0.15)');
    g.fillStyle = lg; g.fillRect(0, y0, W, lh);
    for (let x = r.range(60, 200); x < W; x += r.range(190, 300)) {
      g.strokeStyle = 'rgba(95,65,30,0.5)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x + r.range(-8, 8), y0 + lh); g.stroke();
    }
    g.fillStyle = '#f0dcb0'; g.fillRect(0, y0 + lh, W, 3);
    g.fillStyle = 'rgba(80,52,20,0.55)'; g.fillRect(0, y0 + lh + 3, W, 2);
    const fy = y0 + lh + 5, fh = H - fy;
    g.fillStyle = '#c39b66'; g.fillRect(0, fy, W, fh);
    const ft = noiseCanvas(Math.ceil(W / 3), Math.ceil(fh / 3) + 2, 33, (n, x, y) => {
      const v = n.fbm(x / 6, y / 6, 4);
      return v > 0.52 ? [140, 100, 58, (v - 0.52) * 2 * 120] : [240, 220, 180, (0.52 - v) * 2 * 80];
    });
    g.drawImage(ft, 0, fy, W + 3, fh + 6);
    // two rows of lotus petals that point up, then a band of beads
    const pb = fy + fh * 0.7, ph = fh * 0.55, u = Math.max(22, ph * 0.72);
    const petal = (cx, w, h) => {
      const p = new Path2D();
      p.moveTo(cx - w / 2, pb);
      p.bezierCurveTo(cx - w / 2, pb - h * 0.55, cx - w * 0.2, pb - h * 0.85, cx, pb - h);
      p.bezierCurveTo(cx + w * 0.2, pb - h * 0.85, cx + w / 2, pb - h * 0.55, cx + w / 2, pb);
      p.closePath();
      return p;
    };
    for (const [off, hh, dark] of [[u / 2, ph * 0.86, 1], [0, ph, 0]]) {
      for (let x = -u + off; x < W + u; x += u) {
        const p = petal(x, u * 0.98, hh);
        const pg = g.createLinearGradient(x - u / 2, pb - hh, x + u / 2, pb);
        pg.addColorStop(0, dark ? '#b48a55' : '#ecd2a0'); pg.addColorStop(1, dark ? '#8a6436' : '#b98f5a');
        g.fillStyle = pg; g.fill(p);
        g.strokeStyle = 'rgba(85,55,22,0.7)'; g.lineWidth = 1.1; g.stroke(p);
        if (!dark) {
          g.strokeStyle = 'rgba(255,240,205,0.55)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x - u * 0.06, pb - 2); g.quadraticCurveTo(x - u * 0.1, pb - hh * 0.5, x, pb - hh * 0.82); g.stroke();
        }
      }
    }
    g.fillStyle = '#a57d4a'; g.fillRect(0, pb, W, H - pb);
    g.fillStyle = 'rgba(70,45,18,0.6)'; g.fillRect(0, pb, W, 2);
    const br = Math.max(2.5, (H - pb) * 0.16), by = pb + (H - pb) * 0.45;
    for (let x = br; x < W + br; x += br * 2.6) {
      const bg2 = g.createRadialGradient(x - br * 0.3, by - br * 0.3, 0, x, by, br);
      bg2.addColorStop(0, '#f1dcae'); bg2.addColorStop(1, '#9b7442');
      g.fillStyle = bg2; g.beginPath(); g.arc(x, by, br, 0, TAU); g.fill();
    }
  }

  // Cracks, chips and grain on top of everything.
  function paintAge(g, W, H, L) {
    const r = rng(77);
    for (let i = 0; i < 7; i++) {
      let x = r.range(0, W), y = r.range(L.c + L.f + 20, H - L.p - 20), a = r.range(0, TAU);
      const n = r.int(20, 60);
      g.lineWidth = 0.9; g.lineCap = 'round';
      for (let k = 0; k < n; k++) {
        const nx = x + Math.cos(a) * r.range(3, 9), ny = y + Math.sin(a) * r.range(3, 9);
        g.strokeStyle = 'rgba(95,72,40,0.55)'; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        g.strokeStyle = 'rgba(255,250,232,0.35)'; g.beginPath(); g.moveTo(x + 0.8, y + 0.8); g.lineTo(nx + 0.8, ny + 0.8); g.stroke();
        x = nx; y = ny; a += r.range(-0.6, 0.6);
      }
    }
    for (let i = 0; i < 14; i++) {
      const cx = r.range(0, W), cy = r.range(L.c + L.f + 30, H - L.p - 10), rad = r.range(2.5, 8), n = r.int(7, 11);
      if (cx > L.left - 10 && cx < L.left + L.ew + 10 && cy > L.top - 10 && cy < L.top + L.eh + 10) continue;
      const p = new Path2D();
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU, rr = rad * r.range(0.55, 1.25); k ? p.lineTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr) : p.moveTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr); }
      p.closePath();
      g.fillStyle = '#dcc690'; g.fill(p);
      g.save(); g.clip(p);
      g.strokeStyle = 'rgba(110,85,45,0.6)'; g.lineWidth = 2.5; g.translate(0.8, 1.2); g.stroke(p);
      g.restore();
      g.strokeStyle = 'rgba(255,250,235,0.6)'; g.lineWidth = 0.8; g.stroke(p);
    }
    const tile = grainTile(256, 13, 150, 255);
    g.save();
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.17;
    g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);
    g.restore();
    const vg = g.createRadialGradient(W * 0.4, H * 0.45, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(90,60,20,0)'); vg.addColorStop(1, 'rgba(90,60,20,0.18)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  // ---------- leaf shadows that move a little ----------
  function leafSprite(seed, size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = 'rgb(84,58,26)';
    for (let b = 0; b < 6; b++) {
      let x = size * r.range(0.05, 0.3), y = size * r.range(0.05, 0.3), a = r.range(0.1, 1.4);
      for (let i = 0; i < 16; i++) {
        x += Math.cos(a) * size * 0.04; y += Math.sin(a) * size * 0.04; a += r.range(-0.18, 0.18);
        for (const s of [-1, 1]) {
          const la = a + s * r.range(0.6, 1.0), len = size * r.range(0.035, 0.06);
          g.save(); g.translate(x, y); g.rotate(la); g.beginPath(); g.ellipse(len / 2, 0, len / 2, len * 0.2, 0, 0, TAU); g.fill(); g.restore();
        }
      }
    }
    const out = document.createElement('canvas'); out.width = out.height = size;
    const o = out.getContext('2d'); o.filter = 'blur(4px)'; o.drawImage(c, 0, 0);
    return out;
  }

  // ---------- layout and start ----------
  function layout(W, H) {
    const c = Math.round(Math.min(78, Math.max(44, H * 0.075)));
    const p = Math.round(Math.min(150, Math.max(84, H * 0.14)));
    const wide = W > 1000;
    const x0 = wide ? W * 0.025 : W * 0.04;
    const x1 = wide ? W * 0.95 - Math.min(640, W * 0.46) - 28 : W * 0.96;
    const f = Math.round(c * 0.5), availH = H - c - f - p - 40;
    // on tall phone screens let the tail run off the left edge so the elephant is bigger
    const tall = !wide && H > W * 1.3, grow = tall ? 1.22 : 1;
    const s = Math.min(availH / EB.h, (x1 - x0) * grow / EB.w);
    const ew = EB.w * s, eh = EB.h * s;
    return { c, f, p, s, ew, eh, left: tall ? x1 - ew : x0 + (x1 - x0 - ew) / 2, top: H - p - 10 - (1098 - EB.y) * s };
  }

  function start() {
    const wall = document.getElementById('wall'), shade = document.getElementById('shade');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let sprites = null, size = { W: 0, H: 0 }, raf = 0;

    function render() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
      size = { W, H };
      wall.width = Math.round(W * dpr); wall.height = Math.round(H * dpr);
      const g = wall.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const L = layout(W, H);
      paintWall(g, W, H, L);
      const k = L.s * dpr, ec = document.createElement('canvas');
      ec.width = Math.ceil(EB.w * k); ec.height = Math.ceil(EB.h * k);
      const eg = ec.getContext('2d');
      eg.setTransform(k, 0, 0, k, -EB.x * k, -EB.y * k);
      window.Elephant.paint(eg, k);
      g.save(); g.translate(L.left + L.ew, L.top); g.scale(-1, 1); g.globalAlpha = 0.97;
      g.drawImage(ec, 0, 0, L.ew, L.eh);
      g.restore();
      paintAge(g, W, H, L);
      shade.width = Math.round(W * dpr); shade.height = Math.round(H * dpr);
      sprites = sprites || [leafSprite(3, 520), leafSprite(8, 440), leafSprite(15, 380)];
      drawShade(0);
    }

    function drawShade(t) {
      const dpr = shade.width / size.W, g = shade.getContext('2d'), { W, H } = size;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, shade.width, shade.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = 0.16;
      const spots = [[-0.06, -0.08, 0, 1.1], [0.12, -0.12, 1.7, 0.9], [-0.04, 0.12, 3.1, 0.8]];
      spots.forEach(([fx, fy, ph, sc], i) => {
        const sw = Math.sin(t * 0.00045 + ph) * 7 + Math.sin(t * 0.0011 + ph * 2) * 3;
        g.save();
        g.translate(fx * W + sw, fy * H + sw * 0.4);
        g.rotate(Math.sin(t * 0.0004 + ph) * 0.015);
        const s = Math.min(W, H) / 520 * sc;
        g.scale(s, s);
        g.drawImage(sprites[i], 0, 0);
        g.restore();
      });
    }

    function loop(t) { drawShade(t); raf = requestAnimationFrame(loop); }

    render();
    if (!still) raf = requestAnimationFrame(loop);
    let timer = 0, last = innerWidth + 'x' + innerHeight;
    addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = innerWidth + 'x' + innerHeight;
        if (now !== last) { last = now; render(); }
      }, 250);
    });
  }

  if (document.getElementById('wall')) start();
})();
