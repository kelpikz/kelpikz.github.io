// Draws everything the page shows and writes it to assets/.
//   node make.mjs [--place lake,desert,forest] [--mood day,dusk,night] [--fmt wide,tall] [--what bg,sketch,cels] [--S 1.5] [--tmp dir] [--preview]
//   node make.mjs --paper [--place floor]     only the paper pieces of a place (card, folio border, emblems): not the scenes, not the list
// For every place, mood and format: the still picture, the first sketch, and one sheet of cels with an alpha channel.
// The cels get their alpha by being drawn twice, once on black paper and once on white.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = k => process.argv.includes('--' + k);
const places = arg('place', 'lake').split(','), moods = arg('mood', 'day,dusk,night').split(','), fmts = arg('fmt', 'wide,tall').split(','), what = arg('what', 'bg,sketch,cels').split(',');
const S = parseFloat(arg('S', '1.5')), SK = parseFloat(arg('SK', '1')), Q = arg('q', '80');
const tmp = arg('tmp', path.join(os.tmpdir(), 'lake-make')), assets = path.join(here, 'assets');
fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(assets, { recursive: true });

const srcDir = path.join(here, 'src');
const files = ['engine.js', ...fs.readdirSync(srcDir).filter(f => f.startsWith('m-') && f.endsWith('.js')).sort()].map(f => path.join(srcDir, f)).concat(path.join(here, 'stage.js'), fs.readdirSync(here).filter(f => /^stage-.+.js$/.test(f)).sort().map(f => path.join(here, f)));
// a file that does not parse (another hand may be saving it right now) is left out with a warning, so it cannot stop the rest
const code = files.map(f => {
  const src = fs.readFileSync(f, 'utf8').replace(/^'use strict';/, '');
  try { new Function(src); return src; } catch (e) { console.warn('left out ' + path.basename(f) + ': ' + e.message); return ''; }
}).join('\n;\n');
const { createArt, STAGE } = new Function("'use strict';\n" + code + '\n;return { createArt, STAGE, M };')();

// ---- PNG out ---------------------------------------------------------------------------------
const CT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function writePNG(file, rgba, w, h, alpha) {
  const bpp = alpha ? 4 : 3, raw = Buffer.alloc((w * bpp + 1) * h);
  for (let y = 0; y < h; y++) { let o = y * (w * bpp + 1); raw[o++] = 0; let i = y * w * 4; for (let x = 0; x < w; x++, i += 4) { raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; if (alpha) raw[o++] = rgba[i + 3]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]));
}
function webp(png, out, q) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out]);
  return Math.round(fs.statSync(out).size / 1024);
}
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---- the sheet of cels ---------------------------------------------------------------------------
function packCels(C, width) {
  const order = C.slice().sort((a, b) => b.h - a.h || b.w - a.w), pad = 3;
  let x = pad, y = pad, rowH = 0;
  for (const c of order) {
    if (x + c.w + pad > width) { x = pad; y += rowH + pad; rowH = 0; }
    c.x = x; c.y = y; x += c.w + pad; rowH = Math.max(rowH, c.h);
  }
  return y + rowH + pad;
}
function drawCels(C, LW, LH, paper, tag) {
  const A = createArt({ S, LW, LH });
  A.R.fill(paper); A.G.fill(paper); A.B.fill(paper);
  for (const c of C) {
    A.pushMask(A.rect(c.x, c.y, c.w, c.h), 0);
    A.reseed(hash(tag + c.name));
    c.draw(A, c.x + c.ax, c.y + c.ay);
    A.popMask();
  }
  return A;
}
function matte(A0, A1, relief) {
  relief = relief == null ? 0.075 : relief;
  const W = A0.W, H = A0.H, N = W * H, out = new Uint8ClampedArray(N * 4), HM = A0.HM;
  for (let i = 0; i < N; i++) {
    const a = 1 - ((A1.R[i] - A0.R[i]) + (A1.G[i] - A0.G[i]) + (A1.B[i] - A0.B[i])) / 3;
    if (a < 0.02) continue;
    const x = i % W, y = (i / W) | 0; let k = 1;
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) k += ((HM[i - 1] - HM[i + 1]) + (HM[i - W] - HM[i + W])) * relief;
    const inv = 255 * k / Math.min(1, a), j = i * 4;
    out[j] = A0.R[i] * inv; out[j + 1] = A0.G[i] * inv; out[j + 2] = A0.B[i] * inv; out[j + 3] = Math.min(1, a) * 255 + 0.5;
  }
  return out;
}
// lay cels over the still picture at the places they start from, to look at the whole thing without a browser
// the page tints the folio sheets for the hour with a CSS filter (projects.css, --tint); the preview does the same, step by step
// as the Filter Effects spec writes each function, clamped after each, so the plate shows what the page shows
const TINT = { dusk: [['sepia', .2], ['saturate', 1.1], ['brightness', .9], ['hue', -7]], night: [['brightness', .95], ['saturate', .82]] };
function tintFn(mood) {
  const steps = (TINT[mood] || []).map(([f, v]) => {
    if (f === 'brightness') return [[v, 0, 0], [0, v, 0], [0, 0, v]];
    if (f === 'saturate') return [[.213 + .787 * v, .715 - .715 * v, .072 - .072 * v], [.213 - .213 * v, .715 + .285 * v, .072 - .072 * v], [.213 - .213 * v, .715 - .715 * v, .072 + .928 * v]];
    if (f === 'sepia') { const k = 1 - v; return [[.393 + .607 * k, .769 - .769 * k, .189 - .189 * k], [.349 - .349 * k, .686 + .314 * k, .168 - .168 * k], [.272 - .272 * k, .534 - .534 * k, .131 + .869 * k]]; }
    const a = v * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
    return [[.213 + c * .787 - n * .213, .715 - c * .715 - n * .715, .072 - c * .072 + n * .928], [.213 - c * .213 + n * .143, .715 + c * .285 + n * .140, .072 - c * .072 - n * .283], [.213 - c * .213 - n * .787, .715 - c * .715 + n * .715, .072 + c * .928 + n * .072]];
  });
  if (!steps.length) return null;
  return (r, g, b) => { for (const m of steps) { const R = m[0][0] * r + m[0][1] * g + m[0][2] * b, G = m[1][0] * r + m[1][1] * g + m[1][2] * b, B = m[2][0] * r + m[2][1] * g + m[2][2] * b; r = Math.min(255, Math.max(0, R)); g = Math.min(255, Math.max(0, G)); b = Math.min(255, Math.max(0, B)); } return [r, g, b]; };
}

function preview(bg, W, H, atlas, AW, man, mood) {
  const tint = tintFn(mood);
  const out = new Uint8ClampedArray(bg);
  // how a cel meets what is under it: its layer's blend ('shade' multiplies, 'glow' screens), and an alpha for 'flicker'
  let mode = 'normal', alpha = 1;
  const put = (name, ux, uy, sc) => {
    const c = man.cels[name]; if (!c) return; sc = sc || 1;
    const dw = Math.round(c[2] * sc), dh = Math.round(c[3] * sc), dx = Math.round(ux * S - c[4] * S * sc), dy = Math.round(uy * S - c[5] * S * sc);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const X = dx + x, Y = dy + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const si = ((c[1] + Math.min(c[3] - 1, (y / sc) | 0)) * AW + c[0] + Math.min(c[2] - 1, (x / sc) | 0)) * 4, a = atlas[si + 3] / 255 * alpha; if (!a) continue;
      const di = (Y * W + X) * 4;
      for (let k = 0; k < 3; k++) {
        const s = atlas[si + k], d = out[di + k];
        const t = mode === 'multiply' ? d * s / 255 : mode === 'screen' ? 255 - (255 - d) * (255 - s) / 255 : s;
        out[di + k] = d + (t - d) * a;
      }
    }
  };
  // the folios (and the slip) as the page lays them, read back from assets/, so the floor can be judged with them on it
  const lay = (file, cx, cy, w, h, deg) => {
    const f = path.join(assets, file); if (!fs.existsSync(f)) return;
    let raw; try { raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { maxBuffer: 1 << 28 }); } catch (e) { return; }
    const sw = Math.round(Math.sqrt(raw.length / 4 * w / h)), sh = Math.round(raw.length / 4 / sw), r = deg * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
    const pw = w * S, ph = h * S, R = Math.hypot(pw, ph) / 2, X0 = Math.max(0, Math.floor(cx * S - R)), X1 = Math.min(W - 1, Math.ceil(cx * S + R)), Y0 = Math.max(0, Math.floor(cy * S - R)), Y1 = Math.min(H - 1, Math.ceil(cy * S + R));
    for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) {
      // a soft shadow first, then the sheet
      const ux = X - cx * S, uy = Y - cy * S, lx = ux * cr + uy * sr, ly = -ux * sr + uy * cr;
      const di = (Y * W + X) * 4, sx = Math.floor((lx / pw + 0.5) * sw), sy = Math.floor((ly / ph + 0.5) * sh);
      const shx = Math.floor(((lx - 5) / pw + 0.5) * sw), shy = Math.floor(((ly - 7) / ph + 0.5) * sh);
      if (shx >= 0 && shy >= 0 && shx < sw && shy < sh) { const k = 1 - 0.28 * raw[(shy * sw + shx) * 4 + 3] / 255; out[di] *= k; out[di + 1] *= k; out[di + 2] *= k; }
      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
      const si = (sy * sw + sx) * 4, a = raw[si + 3] / 255; if (!a) continue;
      const px = tint ? tint(raw[si], raw[si + 1], raw[si + 2]) : [raw[si], raw[si + 1], raw[si + 2]];
      for (let k = 0; k < 3; k++) out[di + k] += (px[k] - out[di + k]) * a;
    }
  };
  const layered = man.actors.some(a => a.layer), FL = layered && STAGE.places.floor;
  for (const layer of layered ? ['under', 'folios', 'glow', 'shade', 'top'] : [null]) {   // shade over glow, so the leaves cut the light
    if (layer === 'folios') {
      if (FL) { const fmt = man.w > man.h ? 'wide' : 'tall'; FL.FOLIOS[fmt].forEach((q, i) => lay('folio-' + FL.IDS[i] + '.webp', q[0], q[1], q[2], q[2] * 300 / 360, q[3])); const s = FL.SLIP[fmt]; lay('paper-slip.webp', s[0], s[1], s[2], 80, s[3]); }
      continue;
    }
    mode = layer === 'shade' ? 'multiply' : layer === 'glow' ? 'screen' : 'normal';
  for (const a of man.actors.filter(a => !layer || a.layer === layer).sort((p, q) => p.z - q.z)) {
    alpha = a.type === 'flicker' ? a.alpha[1] : a.type === 'still' && a.alpha != null ? a.alpha : 1;
    if (a.type === 'breeze' || a.type === 'flicker') put(a.cels[0], a.x, a.y);
    else if (a.type === 'drift') a.items.forEach(i => put(i.cel, i.x, i.y));
    else if (a.type === 'boil') put(a.cels[0], a.x, a.y);
    else if (a.type === 'boat') put(a.cels[0], a.x, a.y);
    else if (a.type === 'still') put(a.cel, a.x, a.y);
    else if (a.type === 'swim') for (let i = 0; i < a.n; i++) put(a.cels[i % 2], a.x0 + (a.x1 - a.x0) * 0.4 + i * a.gap, a.y + i * 8, a.scale);
    else if (a.type === 'flock') for (let i = 0; i < a.n; i++) { const t = 0.38 + i * a.gap / Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]); put(a.frames[i % 4][i % 2], a.from[0] + (a.to[0] - a.from[0]) * t, a.from[1] + (a.to[1] - a.from[1]) * t + a.sag * 4 * t * (1 - t) + (i % 2 ? 9 : -7), a.size[0] + (a.size[1] - a.size[0]) * (1 - i / a.n)); }
    else if (a.type === 'pair') for (let i = 0; i < a.n; i++) { const t = 0.45 + i * 0.05; put(a.cels[i % 2], a.from[0] + (a.to[0] - a.from[0]) * t, a.from[1] + (a.to[1] - a.from[1]) * t + a.sag * 4 * t * (1 - t) + i * 16); }
    else if (a.type === 'leap') { const p = a.pts[1] || a.pts[0]; put(a.rings[2], p[0], p[1], p[2]); put(a.cels[1], p[0], p[1], p[2]); }
    else if (a.type === 'rings') a.pts.slice(2, 5).forEach((p, i) => put(a.cels[i + 1], p[0], p[1], p[2]));
    else if (a.type === 'lamps') a.pts.forEach((p, i) => put(a.cels[i % 3], p[0], p[1], p[2]));
    else if (a.type === 'pose') put(a.cels[1], a.x, a.y);
    else if (a.type === 'flutter') for (let i = 0; i < a.n; i++) put(a.cels[i % 3], a.box[0] + (a.box[2] - a.box[0]) * (i + 0.5) / a.n, a.box[1] + (a.box[3] - a.box[1]) * (0.3 + 0.4 * (i % 2)));
    else if (a.type === 'blink') a.zones.forEach((z, zi) => { for (let i = 0; i < a.n[zi]; i++) put(a.cels[i % 2], z[0] + (z[2] - z[0]) * ((i * 0.618 + 0.3) % 1), z[1] + (z[3] - z[1]) * ((i * 0.37 + 0.2) % 1)); });
    else if (a.type === 'wheel') for (let i = 0; i < a.n; i++) { const th = 0.9 + i * 2.6; put(a.cels[i % 2], a.cx + a.rx * Math.cos(th), a.cy + a.ry * Math.sin(th), a.size[i % 2]); }
    else if (a.type === 'sway') put(a.cels[0], a.x, a.y);
    else if (a.type === 'bound') for (let i = 0; i < a.n; i++) { const e = 0.5 - i * 0.075; put(a.cels[i % 3], a.from[0] + (a.to[0] - a.from[0]) * e, a.from[1] + (a.to[1] - a.from[1]) * e - (i % 3 === 1 ? a.height : a.height * 0.5), i ? 0.92 : 1); }
    else if (a.type === 'twinkle') for (let i = 0; i < 5; i++) put(a.cels[i % 3], a.box[0] + (a.box[2] - a.box[0]) * ((i * 0.618 + 0.1) % 1), a.box[1] + (a.box[3] - a.box[1]) * ((i * 0.41 + 0.2) % 1));
  }
  }
  return out;
}

function meanHex(px, W, x0, y0, x1, y1) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) { const i = (y * W + x) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
  return '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('');
}

// ---- the paper pieces: each is drawn on black and on white, as the cels are, so its edge keeps a true alpha -----
if (has('paper')) {
  for (const place of arg('place', 'floor').split(',')) {
    const PL = STAGE.at(place); if (!PL.papers) continue;
    for (const p of PL.papers()) {
      if (arg('only', '') && !arg('only', '').split(',').some(s => p.file.includes(s))) continue;
      const one = paper => { const A = createArt({ S: p.S || 2, LW: p.w, LH: p.h, fibres: p.fibres }); A.R.fill(paper); A.G.fill(paper); A.B.fill(paper); A.reseed(hash('paper' + p.file)); p.draw(A); return A; };
      const A0 = one(0), A1 = one(1), png = path.join(tmp, p.file.replace(/\.webp$/, '.png'));
      writePNG(png, matte(A0, A1, p.relief), A0.W, A0.H, true);
      console.log(p.file.padEnd(26) + (A0.W + 'x' + A0.H).padStart(10) + '   ' + webp(png, path.join(assets, p.file), p.q || 90) + ' KB');
    }
  }
  process.exit(0);
}

// ---- run ------------------------------------------------------------------------------------------
const manFile = path.join(assets, 'scenes.json');
const all = fs.existsSync(manFile) ? JSON.parse(fs.readFileSync(manFile, 'utf8')) : {};
for (const place of places) for (const mood of moods) for (const fmt of fmts) {
  // the lake keeps its old names (day-wide); the other places put their own name in front (desert-day-wide)
  const PL = STAGE.at(place), key = (place === 'lake' ? '' : place + '-') + mood + '-' + fmt, G = PL.geom(fmt, mood), t0 = Date.now(), log = [];
  const man = all[key] = all[key] || {};
  Object.assign(man, { w: G.W, h: G.H, S, focus: G.focus, sky: G.sky, water: G.touch || [Math.round(G.yShore0 + 18), Math.round(G.yBank0 - 6)] });
  if (G.ink) man.ink = G.ink;            // which ink the page writes with over this sky: 'dark' or 'light'
  let bgRGBA = null, bgW = 0, bgH = 0;
  if (what.includes('bg')) {
    const A = createArt({ S, LW: G.W, LH: G.H });
    PL.background(A, G, process.env.VERBOSE ? n => console.log('   ', n) : null);
    bgRGBA = A.toRGBA(); bgW = A.W; bgH = A.H;
    const png = path.join(tmp, key + '.png'); writePNG(png, bgRGBA, A.W, A.H, false);
    man.bg = key + '.webp'; man.px = [A.W, A.H];
    man.skyc = meanHex(bgRGBA, A.W, 0, 0, Math.round(A.W * G.sky.u1), Math.round(A.H * G.sky.v1));
    log.push('bg ' + A.W + 'x' + A.H + ' ' + webp(png, path.join(assets, man.bg), Q) + ' KB');
  }
  if (what.includes('sketch')) {
    const A = createArt({ S: SK, LW: G.W, LH: G.H });
    PL.sketch(A, G);
    const skRGBA = A.toRGBA(); man.paper = meanHex(skRGBA, A.W, 0, 0, A.W, A.H);
    const png = path.join(tmp, key + '-sketch.png'); writePNG(png, skRGBA, A.W, A.H, false);
    man.sketch = key + '-sketch.webp';
    log.push('sketch ' + webp(png, path.join(assets, man.sketch), 50) + ' KB');
  }
  if (what.includes('cels')) {
    const C = PL.cels(G), AW = 1600, AH = packCels(C, AW);
    const A0 = drawCels(C, AW, AH, 0, key), A1 = drawCels(C, AW, AH, 1, key), rgba = matte(A0, A1);
    const png = path.join(tmp, key + '-cels.png'); writePNG(png, rgba, A0.W, A0.H, true);
    man.atlas = key + '-cels.webp'; man.cels = {};
    for (const c of C) man.cels[c.name] = [Math.round(c.x * S), Math.round(c.y * S), Math.round(c.w * S), Math.round(c.h * S), c.ax, c.ay];
    man.actors = PL.actors(G);
    log.push('cels ' + C.length + ' on ' + A0.W + 'x' + A0.H + ' ' + webp(png, path.join(assets, man.atlas), 84) + ' KB');
    if (has('preview')) {
      if (!bgRGBA) { const A = createArt({ S, LW: G.W, LH: G.H }); PL.background(A, G); bgRGBA = A.toRGBA(); bgW = A.W; bgH = A.H; }
      writePNG(path.join(tmp, key + '-preview.png'), preview(bgRGBA, bgW, bgH, rgba, A0.W, man, place === 'floor' ? mood : null), bgW, bgH, false);
    }
  }
  console.log(key.padEnd(18) + ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + ' s   ' + log.join('   '));
}
fs.writeFileSync(manFile, JSON.stringify(all));
fs.writeFileSync(path.join(assets, 'scenes.js'), '/* made by make.mjs */\nwindow.LAKE_SCENES = ' + JSON.stringify(all) + ';\n');
console.log('wrote', manFile);
