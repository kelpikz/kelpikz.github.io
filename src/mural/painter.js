/* painter.js
   A small engine that paints Mewar-style murals on a 2D canvas.
   Shapes are SVG path strings (M L H V C S Q T Z, no arcs).
   The painter adds what a hand gives: ink lines that swell and wobble,
   mottled paint, brush streaks, hatching that follows the form,
   hand-set dots, and wear. */
(function (global) {
  'use strict';

  // ---------- random and noise ----------
  function rng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    const r = () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    r.range = (a, b) => a + r() * (b - a);
    r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
    r.pick = (a) => a[Math.floor(r() * a.length)];
    r.gauss = () => (r() + r() + r() + r() - 2) / 2;
    return r;
  }

  function noise1(seed) {
    const r = rng(seed), v = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) v[i] = r() * 2 - 1;
    return (t) => {
      const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f);
      const a = v[i & 2047], b = v[(i + 1) & 2047];
      return a + (b - a) * u;
    };
  }

  function noise2(seed) {
    const N = 256, r = rng(seed), v = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) v[i] = r();
    const at = (x, y) => v[(y & (N - 1)) * N + (x & (N - 1))];
    const n = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    };
    n.fbm = (x, y, oct = 4) => {
      let s = 0, a = 0.5, f = 1, t = 0;
      for (let i = 0; i < oct; i++) { s += a * n(x * f + i * 17.3, y * f + i * 9.1); t += a; f *= 2; a *= 0.5; }
      return s / t;
    };
    return n;
  }

  // ---------- colour ----------
  function hex(c) {
    if (Array.isArray(c)) return c;
    c = c.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
  }
  const rgba = (c, a = 1) => { const [r, g, b] = hex(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
  const mix = (a, b, t) => { a = hex(a); b = hex(b); return a.map((v, i) => v + (b[i] - v) * t); };
  const shade = (c, k) => (k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k));

  // ---------- paths ----------
  function flatten(d, tol = 2) {
    const tok = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lcx = 0, lcy = 0, lq = null, cur = null;
    const subs = [];
    const num = () => parseFloat(tok[i++]);
    const start = (px, py) => { cur = { pts: [[px, py]], closed: false }; subs.push(cur); };
    const lineTo = (px, py) => { if (!cur) start(x, y); cur.pts.push([px, py]); };
    const cubic = (x1, y1, x2, y2, x3, y3) => {
      const len = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
      const n = Math.max(2, Math.ceil(len / tol));
      for (let k = 1; k <= n; k++) {
        const t = k / n, mt = 1 - t;
        lineTo(mt * mt * mt * x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3,
               mt * mt * mt * y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3);
      }
    };
    const quad = (x1, y1, x2, y2) =>
      cubic(x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y), x2 + (2 / 3) * (x1 - x2), y2 + (2 / 3) * (y1 - y2), x2, y2);
    while (i < tok.length) {
      if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'M') {
        const px = num() + ox, py = num() + oy; start(px, py);
        x = sx = px; y = sy = py; lcx = x; lcy = y; lq = null; cmd = rel ? 'l' : 'L';
      } else if (C === 'L') {
        const px = num() + ox, py = num() + oy; lineTo(px, py); x = px; y = py; lcx = x; lcy = y; lq = null;
      } else if (C === 'H') {
        const px = num() + ox; lineTo(px, y); x = px; lcx = x; lcy = y; lq = null;
      } else if (C === 'V') {
        const py = num() + oy; lineTo(x, py); y = py; lcx = x; lcy = y; lq = null;
      } else if (C === 'C') {
        const x1 = num() + ox, y1 = num() + oy, x2 = num() + ox, y2 = num() + oy, x3 = num() + ox, y3 = num() + oy;
        cubic(x1, y1, x2, y2, x3, y3); lcx = x2; lcy = y2; x = x3; y = y3; lq = null;
      } else if (C === 'S') {
        const x1 = 2 * x - lcx, y1 = 2 * y - lcy;
        const x2 = num() + ox, y2 = num() + oy, x3 = num() + ox, y3 = num() + oy;
        cubic(x1, y1, x2, y2, x3, y3); lcx = x2; lcy = y2; x = x3; y = y3; lq = null;
      } else if (C === 'Q') {
        const x1 = num() + ox, y1 = num() + oy, x2 = num() + ox, y2 = num() + oy;
        quad(x1, y1, x2, y2); lq = [x1, y1]; x = x2; y = y2; lcx = x; lcy = y;
      } else if (C === 'T') {
        const x1 = lq ? 2 * x - lq[0] : x, y1 = lq ? 2 * y - lq[1] : y;
        const x2 = num() + ox, y2 = num() + oy;
        quad(x1, y1, x2, y2); lq = [x1, y1]; x = x2; y = y2; lcx = x; lcy = y;
      } else if (C === 'Z') {
        if (cur) cur.closed = true;
        x = sx; y = sy; cur = null;
      } else {
        i++;
      }
    }
    return subs;
  }

  function resample(pts, step) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0].slice()];
    let acc = 0;
    for (let k = 1; k < pts.length; k++) {
      let ax = pts[k - 1][0], ay = pts[k - 1][1];
      const bx = pts[k][0], by = pts[k][1];
      let seg = Math.hypot(bx - ax, by - ay);
      while (acc + seg >= step && seg > 0) {
        const t = (step - acc) / seg;
        ax += (bx - ax) * t; ay += (by - ay) * t;
        out.push([ax, ay]);
        seg = Math.hypot(bx - ax, by - ay); acc = 0;
      }
      acc += seg;
    }
    const last = pts[pts.length - 1], tail = out[out.length - 1];
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.3) out.push(last.slice());
    return out;
  }

  function bbox(subs) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of subs) for (const [x, y] of s.pts) {
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }

  // Points along a path at a fixed gap, each with its tangent angle.
  function along(d, gap, tol = 1.5) {
    const out = [];
    for (const sp of flatten(d, tol)) {
      let pts = sp.closed ? sp.pts.concat([sp.pts[0]]) : sp.pts;
      pts = resample(pts, gap);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        out.push({ x: pts[i][0], y: pts[i][1], a: Math.atan2(b[1] - a[1], b[0] - a[0]) });
      }
    }
    return out;
  }

  // Blend two paths that have the same commands (for insets and bands).
  function lerpPath(a, b, t) {
    const nb = b.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
    let k = 0;
    return a.replace(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g, (m) => {
      const v = parseFloat(m) + (parseFloat(nb[k++]) - parseFloat(m)) * t;
      return v.toFixed(2);
    });
  }

  function ellipsePath(cx, cy, rx, ry = rx, rot = 0) {
    const k = 0.5523, pts = [];
    const P = (x, y) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      return `${(cx + x * c - y * s).toFixed(2)} ${(cy + x * s + y * c).toFixed(2)}`;
    };
    pts.push(`M${P(-rx, 0)}`);
    pts.push(`C${P(-rx, -ry * k)} ${P(-rx * k, -ry)} ${P(0, -ry)}`);
    pts.push(`C${P(rx * k, -ry)} ${P(rx, -ry * k)} ${P(rx, 0)}`);
    pts.push(`C${P(rx, ry * k)} ${P(rx * k, ry)} ${P(0, ry)}`);
    pts.push(`C${P(-rx * k, ry)} ${P(-rx, ry * k)} ${P(-rx, 0)} Z`);
    return pts.join(' ');
  }

  const f2 = (v) => (Math.round(v * 100) / 100).toString();

  // Smooth curve through points (Catmull-Rom). A point [x, y, 1] is a sharp corner.
  function spline(pts, closed = true) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const k1 = p1[2] ? 0 : 1 / 6, k2 = p2[2] ? 0 : 1 / 6;
      d += ` C${f2(p1[0] + (p2[0] - p0[0]) * k1)} ${f2(p1[1] + (p2[1] - p0[1]) * k1)} ` +
        `${f2(p2[0] - (p3[0] - p1[0]) * k2)} ${f2(p2[1] - (p3[1] - p1[1]) * k2)} ${f2(p2[0])} ${f2(p2[1])}`;
    }
    return closed ? d + ' Z' : d;
  }

  // Polyline as a path string.
  const poly = (pts, closed = true) => 'M' + pts.map((p) => f2(p[0]) + ' ' + f2(p[1])).join(' L') + (closed ? ' Z' : '');

  // A closed band of width w0..w1 around an open path (ropes, straps, necklaces).
  function band(d, w0, w1 = w0) {
    const pts = resample(flatten(d, 1)[0].pts, 2);
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = (w0 + ((w1 - w0) * i) / Math.max(1, n - 1)) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return poly(L.concat(R.reverse()));
  }

  // Move each edge of a convex polygon inwards by d.
  function inset(pts, d) {
    const n = pts.length;
    let A = 0;
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
    const s = A > 0 ? 1 : -1, lines = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      const nx = -dy * s, ny = dx * s;
      lines.push([p[0] + nx * d, p[1] + ny * d, dx, dy]);
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = lines[(i - 1 + n) % n], b = lines[i];
      const den = a[2] * b[3] - a[3] * b[2];
      const t = ((b[0] - a[0]) * b[3] - (b[1] - a[1]) * b[2]) / den;
      out.push([a[0] + a[2] * t, a[1] + a[3] * t]);
    }
    return out;
  }

  // ---------- the painter ----------
  class Painter {
    constructor(ctx, seed = 1) {
      this.ctx = ctx;
      this.r = rng(seed);
      this.N = noise1(seed * 31 + 7);
      this.inkColor = '#161413';
    }

    nz() { const off = this.r() * 1800; return (t) => this.N(t + off); }

    // A filled band whose two edges swell and wobble, like a brush stroke.
    ribbon(pts, o) {
      const ctx = this.ctx, n = pts.length;
      if (n < 2) return;
      const step = o.step || 1.5, total = (n - 1) * step;
      const nw = this.nz(), nj = this.nz();
      const L = new Array(n), R = new Array(n);
      for (let i = 0; i < n; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
        let tx = p1[0] - p0[0], ty = p1[1] - p0[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx, s = i * step;
        let w = o.w * (1 + (o.vary ?? 0.35) * nw(s / (o.scale || 16)));
        if (o.taper > 0) {
          const e = Math.min(1, s / o.taper, (total - s) / o.taper);
          w *= Math.pow(Math.max(e, 0.04), 0.65);
        }
        const j = (o.wobble ?? 0.5) * nj(s / 28);
        const cx = pts[i][0] + nx * j, cy = pts[i][1] + ny * j;
        L[i] = [cx + (nx * w) / 2, cy + (ny * w) / 2];
        R[i] = [cx - (nx * w) / 2, cy - (ny * w) / 2];
      }
      ctx.beginPath();
      ctx.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
      ctx.closePath();
      ctx.fill();
    }

    // Ink outline along a path.
    line(d, o = {}) {
      const ctx = this.ctx, step = o.step || 1.4;
      ctx.save();
      ctx.fillStyle = rgba(o.color || this.inkColor, o.alpha ?? 1);
      for (const sp of flatten(d, 1.2)) {
        let pts = sp.closed ? sp.pts.concat([sp.pts[0], sp.pts[1] || sp.pts[0]]) : sp.pts;
        pts = resample(pts, step);
        this.ribbon(pts, {
          w: o.w ?? 2.6, vary: o.vary ?? 0.38, wobble: o.wobble ?? 0.45,
          taper: sp.closed ? 0 : (o.taper ?? 7), step, scale: o.scale ?? 16,
        });
      }
      ctx.restore();
    }

    // A stroke along given points (for hatching and hair).
    strokePts(pts, o) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = rgba(o.color || this.inkColor, o.alpha ?? 1);
      const step = o.step || 1.4;
      this.ribbon(resample(pts, step), { w: o.w, vary: o.vary ?? 0.3, wobble: o.wobble ?? 0.25, taper: o.taper ?? 6, step, scale: 10 });
      ctx.restore();
    }

    // Paint fill with mottling and brush streaks.
    fill(d, color, o = {}) {
      const ctx = this.ctx, p = new Path2D(d);
      ctx.save();
      ctx.fillStyle = rgba(color);
      ctx.fill(p);
      const mottle = o.mottle ?? 1;
      if (mottle > 0) {
        ctx.clip(p);
        const b = bbox(flatten(d, 6));
        const area = Math.max(1, b.w * b.h);
        const count = Math.min(2600, (area / 240) * mottle);
        const v = o.var ?? 1, blot = o.blot ?? 1;
        for (let k = 0; k < count; k++) {
          const x = this.r.range(b.x0, b.x1), y = this.r.range(b.y0, b.y1);
          const rad = this.r.range(3, 18) * blot;
          ctx.fillStyle = rgba(shade(color, this.r.range(-0.12, 0.1) * v), this.r.range(0.04, 0.13));
          ctx.beginPath();
          ctx.ellipse(x, y, rad, rad * this.r.range(0.35, 1), this.r.range(0, Math.PI), 0, Math.PI * 2);
          ctx.fill();
        }
        const ang = o.angle ?? -0.35;
        ctx.lineCap = 'round';
        for (let k = 0; k < count * 0.6; k++) {
          const x = this.r.range(b.x0, b.x1), y = this.r.range(b.y0, b.y1), len = this.r.range(6, 26) * blot;
          const a = ang + this.r.range(-0.25, 0.25);
          ctx.strokeStyle = rgba(shade(color, this.r.range(-0.1, 0.1) * v), this.r.range(0.04, 0.12));
          ctx.lineWidth = this.r.range(1, 3.2) * blot;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
        }
        if (o.edge !== false) {
          // pigment pools a little darker along the edge
          ctx.strokeStyle = rgba(shade(color, -0.18), 0.35);
          ctx.lineWidth = o.edgeW ?? 5;
          ctx.stroke(p);
        }
      }
      ctx.restore();
    }

    shape(d, color, o = {}) {
      this.fill(d, color, o);
      if (o.line !== false) this.line(d, { w: o.w ?? 2.8, color: o.ink, vary: o.vary, wobble: o.wobble });
    }

    // Gold paint: warm base, darker pools, bright flecks.
    gold(d, o = {}) {
      const base = o.base || '#d4a23a';
      this.fill(d, base, { var: 1.4, angle: o.angle, edgeW: 4 });
      const ctx = this.ctx, p = new Path2D(d), b = bbox(flatten(d, 6));
      ctx.save(); ctx.clip(p);
      const count = Math.min(900, (b.w * b.h) / 90);
      for (let k = 0; k < count; k++) {
        ctx.fillStyle = rgba(this.r() < 0.6 ? '#fbe39a' : '#9a6a1c', this.r.range(0.15, 0.5));
        ctx.beginPath();
        ctx.arc(this.r.range(b.x0, b.x1), this.r.range(b.y0, b.y1), this.r.range(0.4, 1.3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (o.line !== false) this.line(d, { w: o.w ?? 2.4, color: o.ink || '#3a2410' });
    }

    // Hatching: short strokes that follow a direction field, clipped to the shape.
    hatch(d, o) {
      const ctx = this.ctx, p = new Path2D(d), b = bbox(flatten(d, 6));
      const m = ctx.getTransform();
      ctx.save();
      ctx.clip(p);
      ctx.fillStyle = rgba(o.color, o.alpha ?? 0.8);
      const step = 1.6;
      let made = 0, tries = 0;
      while (made < o.count && tries < o.count * 8) {
        tries++;
        const x = this.r.range(b.x0, b.x1), y = this.r.range(b.y0, b.y1);
        const q = m.transformPoint(new DOMPoint(x, y));
        if (!ctx.isPointInPath(p, q.x, q.y)) continue;
        if (o.mask && this.r() > o.mask(x, y)) continue;
        made++;
        const len = this.r.range(o.len[0], o.len[1]);
        const fwd = [], back = [];
        let cx = x, cy = y;
        for (let s = 0; s <= len / 2; s += step) { fwd.push([cx, cy]); const a = o.field(cx, cy); cx += Math.cos(a) * step; cy += Math.sin(a) * step; }
        cx = x; cy = y;
        for (let s = step; s <= len / 2; s += step) { const a = o.field(cx, cy); cx -= Math.cos(a) * step; cy -= Math.sin(a) * step; back.push([cx, cy]); }
        const pts = back.reverse().concat(fwd);
        this.ribbon(pts, { w: this.r.range(o.w[0], o.w[1]), vary: 0.35, wobble: 0.25, taper: len * 0.42, step, scale: 9 });
      }
      ctx.restore();
    }

    // Random dots inside a shape.
    stipple(d, o) {
      const ctx = this.ctx, p = new Path2D(d), b = bbox(flatten(d, 6));
      ctx.save(); ctx.clip(p);
      for (let k = 0; k < o.count; k++) {
        const x = this.r.range(b.x0, b.x1), y = this.r.range(b.y0, b.y1);
        if (o.mask && this.r() > o.mask(x, y)) continue;
        ctx.fillStyle = rgba(Array.isArray(o.color) && typeof o.color[0] === 'string' ? this.r.pick(o.color) : o.color, this.r.range(o.alpha?.[0] ?? 0.6, o.alpha?.[1] ?? 1));
        const r = this.r.range(o.r[0], o.r[1]);
        ctx.beginPath(); ctx.ellipse(x, y, r, r * this.r.range(0.7, 1), this.r() * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // A painted dot: slightly uneven, optional ink ring.
    dot(x, y, r, color, o = {}) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = rgba(color, o.alpha ?? 1);
      ctx.beginPath();
      ctx.ellipse(x + this.r.range(-0.3, 0.3), y + this.r.range(-0.3, 0.3), r * this.r.range(0.88, 1.1), r * this.r.range(0.85, 1.05), this.r() * 3, 0, Math.PI * 2);
      ctx.fill();
      if (o.ring) { ctx.strokeStyle = rgba(o.ring, o.ringAlpha ?? 0.9); ctx.lineWidth = o.ringW ?? 0.8; ctx.stroke(); }
      if (o.hi) { ctx.fillStyle = rgba('#ffffff', 0.55); ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    // A row of dots along a path (pearls, white dot work).
    pearls(d, o) {
      for (const p of along(d, o.gap)) {
        if (o.skipEnds && (p === undefined)) continue;
        this.dot(p.x, p.y, o.r * this.r.range(0.85, 1.12), o.color || '#fbf3e2', o);
      }
    }

    // Erase small flecks to show age.
    wear(x0, y0, x1, y1, count, size = 1) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < count; k++) {
        const cx = this.r.range(x0, x1), cy = this.r.range(y0, y1), n = this.r.int(5, 9), rad = this.r.range(0.6, 3.2) * size;
        ctx.fillStyle = `rgba(0,0,0,${this.r.range(0.35, 0.95)})`;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, rr = rad * this.r.range(0.5, 1.3);
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  // A tile of fine grain, used as a pattern over the finished picture.
  function grainTile(size = 256, seed = 5, lo = 70, hi = 190) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d'), img = g.createImageData(size, size), r = rng(seed);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = lo + r() * (hi - lo);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // A soft noise field as a canvas (drawn scaled up for blotches and stains).
  function noiseCanvas(w, h, seed, fn) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d'), img = g.createImageData(c.width, c.height), n = noise2(seed);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const [r, gg, b, a] = fn(n, x, y);
      const i = (y * c.width + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  global.Mural = { rng, noise1, noise2, hex, rgba, mix, shade, flatten, resample, bbox, along, lerpPath, ellipsePath, spline, poly, band, inset, Painter, grainTile, noiseCanvas };
})(window);
