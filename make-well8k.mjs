// Paints the gold well (stage-well8k.js), the one picture the Experience page flies into.
//   node make-well8k.mjs --sketch [--S 1] --out dir          the whole picture at 1x, with the nine camera stops drawn on it
//   node make-well8k.mjs --proof sidekick [--S 4] --out dir   one camera stop at full density, and the same view from a 1x
//                                                             picture beside it; prints time and memory
//   node make-well8k.mjs --crop x,y,w,h [--only L1,L2] ...     the same for any rectangle (logical units)
//   node make-well8k.mjs --cut sidekick [--S 4] --out dir     one focal object cut out with its alpha, exactly as it is
//                                                             painted into the sheet (see cutOut below)
//   node make-well8k.mjs --gauge [--S 2] --out dir            the year gauge, with its alpha, and where its years are
//   node make-well8k.mjs --sheet [--S 4] [--keep] --out dir   the whole picture, the tile pyramid and the manifest, into --dest
//                                                             (default assets/well8k); --keep also writes the sheet PNG
//   any mode takes --mood day|dusk|night (default day): the same painting at that time of day.  --sheet puts a dusk or
//   night pyramid under <dest>/<mood>/ and into the manifest's moods.<mood>, and leaves the day keys alone
//   node make-well8k.mjs --geom                               the stops, hot rectangles and objects, as JSON
//   node make-well8k.mjs --float [--install] --out dir        the brass float plate at 2x, with its alpha and its blank face
//   node make-well8k.mjs --objs dir                           the cut-outs in dir (made by --cut at S 8) into --dest and the manifest
//   node make-well8k.mjs --cels [--S 4] [--install] --out dir the loose drawings on one atlas, and the actors that move them
// It loads the same files make.mjs loads, in the same order.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = k => process.argv.includes('--' + k);
const out = arg('out', path.join(os.tmpdir(), 'well8k-make')); fs.mkdirSync(out, { recursive: true });

const srcDir = path.join(here, 'src');
const files = ['engine.js', ...fs.readdirSync(srcDir).filter(f => f.startsWith('m-') && f.endsWith('.js')).sort()].map(f => path.join(srcDir, f)).concat(path.join(here, 'stage.js'), fs.readdirSync(here).filter(f => /^stage-.+.js$/.test(f)).sort().map(f => path.join(here, f)));
const code = files.map(f => {
  const src = fs.readFileSync(f, 'utf8').replace(/^'use strict';/, '');
  try { new Function(src); return src; } catch (e) { console.warn('left out ' + path.basename(f) + ': ' + e.message); return ''; }
}).join('\n;\n');
const { createArt, STAGE, M } = new Function("'use strict';\n" + code + '\n;return { createArt, STAGE, M };')();

// ---- PNG ------------------------------------------------------------------------------------------
const CT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function writePNG(file, rgba, w, h, alpha) {
  const ch = alpha ? 4 : 3, raw = Buffer.alloc((w * ch + 1) * h);
  for (let y = 0; y < h; y++) { let o = y * (w * ch + 1); raw[o++] = 0; let i = y * w * 4; for (let x = 0; x < w; x++, i += 4) { raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; if (alpha) raw[o++] = rgba[i + 3]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]));
}
const ff = a => execFileSync('ffmpeg', ['-y', '-loglevel', 'error'].concat(a));
const webp = (png, file, q) => ff(['-i', png, '-c:v', 'libwebp', '-q:v', String(q || 88), '-compression_level', '6', file]);

// ---- marks drawn over the picture (stop rectangles, focus crosses, numbers) ---------------------------
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function mark(rgba, w, h) {
  const put = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; };
  return {
    rect(x, y, rw, rh, c, t) { for (let k = 0; k < t; k++) { for (let i = x; i <= x + rw; i++) { put(i, y + k, c); put(i, y + rh - k, c); } for (let j = y; j <= y + rh; j++) { put(x + k, j, c); put(x + rw - k, j, c); } } },
    cross(x, y, r, c, t) { for (let i = -r; i <= r; i++) for (let k = -t; k <= t; k++) { put(x + i, y + k, c); put(x + k, y + i, c); } },
    num(x, y, n, s, c) { const d = DIG[n]; for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (d[r * 3 + q] === '1') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) put(x + q * s + a, y + r * s + b, c); },
    dot(x, y, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) put(x + i, y + j, c); }
  };
}

// ---- run ------------------------------------------------------------------------------------------
const PL = STAGE.places.well8k, G = PL.geom();
G.mood = arg('mood', 'day');
if (!['day', 'dusk', 'night'].includes(G.mood)) throw new Error('--mood is day, dusk or night, not ' + G.mood);
const MOODDIR = G.mood === 'day' ? '' : G.mood + '/';
const t0 = Date.now();
const r = v => Math.round(v * 10) / 10;
const peak = () => Math.round(process.resourceUsage().maxRSS / 1024) + ' MB';
const timer = () => { let last = Date.now(), lastName = 'start'; const times = []; return { say: nm => { const t = Date.now(); times.push([lastName, t - last]); last = t; lastName = nm; }, end: () => { times.push([lastName, Date.now() - last]); return times; } }; };
// the parts of the picture a rectangle needs: the levels whose band it crosses, and those next to them for what overhangs
function partsFor(rc, extra) {
  const [x, y, w, h] = rc, parts = ['paper', 'sides'];
  if (y < 160) parts.push('sky');
  G.levels.forEach(L => { if (y < L.land + 40 && y + h > L.top - 60) parts.push('L' + L.k); });
  if (y + h > G.WTOP - 10) parts.push('tank');
  return parts.concat(extra || []);
}
const geomOut = () => ({ stops: G.stops, focus: G.focus, hot: G.hot, objs: G.objs, obj: G.obj, path: G.path, canopy: G.canopy || null, levels: G.levels.map(L => ({ id: L.id, top: L.top, foot: r(L.foot), land: L.land, bays: L.bays.map(b => b.ch).join(''), quiet: L.bays.filter(b => b.quiet).map(b => [b.quiet, r(b.x0), r(b.x1)]) })) });

// ---- the manifest the page reads (assets/well8k/manifest.js): each mode that makes a part of the painting puts its own
// keys in and leaves the others as they are
const dest = arg('dest', path.join(here, 'assets', 'well8k'));
const MAN_HEAD = `/* THE GOLD WELL, the one picture the Experience page flies into.  Made by make-well8k.mjs; do not edit by hand.
   Units: the 1920 x 1080 sheet (LW x LH) unless a key says otherwise.
   pyramid  the painting in three sizes of tiles: scale 1 (1920 x 1080), 2 and 4 (7680 x 4320), each cut in tw x th tiles
   stops    one for each thing, in the order the camera goes down: { id, year, obj, view, focus, card }
   hot      each thing's rectangle;  objs  each thing cut out with its alpha: { src, rect, px, S } (rect in sheet units)
   gauge    the year staff: { src, w, h, years: [{ label, y }], marks: [{ id, y, kind }], faces } in its own pixels
   float    the brass float plate: { src, w, h, face: [x, y, w, h] } in its own pixels (2x)
   glints   where the sun catches gold leaf;  lamps  where a flame burns;  bells  [x, y, size];  canopy  the sixty lanterns
   cels     the loose drawings and the actors that move them */
window.WELL8K = `;
function readManifest() {
  const f = path.join(dest, 'manifest.js');
  if (!fs.existsSync(f)) return {};
  const t = fs.readFileSync(f, 'utf8'), i = t.indexOf('window.WELL8K = ');
  return i < 0 ? {} : JSON.parse(t.slice(i + 16).replace(/;\s*$/, ''));
}
function writeManifest(patch) {
  const m = Object.assign(readManifest(), patch);
  for (const k in m) if (m[k] === undefined) delete m[k];
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'manifest.js'), MAN_HEAD + JSON.stringify(m) + ';\n');
  console.log('manifest ' + path.join(dest, 'manifest.js') + ': ' + Object.keys(m).join(', '));
}
const rnd = v => Array.isArray(v) ? v.map(rnd) : typeof v === 'number' ? Math.round(v * 10) / 10 : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rnd(x)])) : v;

if (has('geom')) { console.log(JSON.stringify(rnd({ stops: G.stops, hot: G.hot, objs: G.objs, focus: G.focus }), null, 1)); }

/* ---- the whole sheet at S = 4, the tile pyramid cut from it, and the manifest.  Each smaller size is the sheet
   averaged down (2 x 2 and 4 x 4 boxes), never painted again, so every size is the same painting. */
if (has('sheet')) {
  const S = parseFloat(arg('S', '4'));
  const A = createArt({ S, LW: 1920, LH: 1080, seed: 8000 });
  const tm = timer();
  PL.background(A, G, tm.say, { mode: 'full' });
  const times = tm.end();
  const W = A.W, H = A.H, rgba = A.toRGBA();
  console.log('painted ' + W + 'x' + H + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, peak ' + peak());
  console.log('  parts: ' + times.map(t => t[0] + ' ' + (t[1] / 1000).toFixed(1)).join(', '));
  const shrink = (src, w, h, f) => {
    if (f === 1) return src;
    const w2 = w / f, h2 = h / f, o = new Uint8ClampedArray(w2 * h2 * 4), k = 1 / (f * f);
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
      let R = 0, Gg = 0, B = 0;
      for (let j = 0; j < f; j++) { let i = ((y * f + j) * w + x * f) * 4; for (let q = 0; q < f; q++, i += 4) { R += src[i]; Gg += src[i + 1]; B += src[i + 2]; } }
      const o4 = (y * w2 + x) * 4; o[o4] = R * k; o[o4 + 1] = Gg * k; o[o4 + 2] = B * k; o[o4 + 3] = 255;
    }
    return o;
  };
  const LEVELS = [{ scale: 1, tw: 1920, th: 1080 }, { scale: 2, tw: 960, th: 1080 }, { scale: 4, tw: 960, th: 1080 }];
  const tmp = path.join(out, 'tile-tmp.png'), pyramid = [];
  for (const lv of LEVELS) {
    const f = S / lv.scale, w = W / f, h = H / f, img = shrink(rgba, W, H, f), cols = w / lv.tw, rows = h / lv.th, dir = path.join(dest, MOODDIR + 'z' + lv.scale);
    fs.mkdirSync(dir, { recursive: true });
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
      const t = new Uint8ClampedArray(lv.tw * lv.th * 4);
      for (let y = 0; y < lv.th; y++) t.set(img.subarray(((rr * lv.th + y) * w + c * lv.tw) * 4, ((rr * lv.th + y) * w + (c + 1) * lv.tw) * 4), y * lv.tw * 4);
      writePNG(tmp, t, lv.tw, lv.th);
      webp(tmp, path.join(dir, c + '_' + rr + '.webp'), lv.scale === 4 ? 86 : 88);
    }
    if (lv.scale === 1) { const p1 = path.join(out, 'sheet-1920.png'); writePNG(p1, img, w, h); ff(['-i', p1, '-q:v', '2', path.join(out, 'sheet-1920.jpg')]); }
    pyramid.push({ scale: lv.scale, tw: lv.tw, th: lv.th, cols, rows, src: 'assets/well8k/' + MOODDIR + 'z' + lv.scale + '/{c}_{r}.webp' });
    console.log('  z' + lv.scale + ': ' + cols + 'x' + rows + ' tiles of ' + lv.tw + 'x' + lv.th);
  }
  fs.rmSync(tmp, { force: true });
  if (has('keep')) writePNG(path.join(out, 'sheet.png'), rgba, W, H);
  let bytes = 0; for (const lv of LEVELS) for (const f of fs.readdirSync(path.join(dest, MOODDIR + 'z' + lv.scale))) bytes += fs.statSync(path.join(dest, MOODDIR + 'z' + lv.scale, f)).size;
  if (G.mood !== 'day') writeManifest(rnd({ moods: Object.assign({}, readManifest().moods, { [G.mood]: { pyramid, lamps: G.lamps, glints: G.glints } }) }));
  else writeManifest(rnd({
    LW: 1920, LH: 1080, bg: '#d9bf8a', pyramid, sheet: { S, w: W, h: H },
    stops: G.stops.map(s => Object.assign({ obj: null }, s, { card: s.card || 'right' })),
    path: G.path || null, hot: G.hot, focus: G.focus,
    glints: G.glints, lamps: G.lamps, bells: G.bells, canopy: G.canopy || null
  }));
  fs.writeFileSync(path.join(out, 'geom.json'), JSON.stringify(geomOut(), null, 1));
  console.log('sheet done in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, tiles ' + (bytes / 1048576).toFixed(1) + ' MB, peak ' + peak());
}

if (has('sketch')) {
  const S = parseFloat(arg('S', '1'));
  const A = createArt({ S, LW: 1920, LH: 1080, seed: 8000 });
  const tm = timer();
  PL.background(A, G, tm.say, { mode: 'full' });
  const times = tm.end();
  const clean = A.toRGBA(), w = A.W, h = A.H;
  const png2 = path.join(out, 'sketch-clean.png'); writePNG(png2, clean, w, h); ff(['-i', png2, '-q:v', '2', path.join(out, 'sketch-clean.jpg')]);
  const rgba = clean, m = mark(rgba, w, h);
  const cols = [[255, 255, 255], [255, 214, 40], [255, 150, 50], [255, 90, 70], [255, 60, 160], [200, 90, 255], [80, 220, 120], [90, 180, 255], [160, 240, 240]];
  G.stops.forEach((s, i) => {
    const [x, y, sw, sh] = s.view.map(v => Math.round(v * S)), c = cols[i];
    if (i > 0) {
      m.rect(x, y, sw, sh, [20, 14, 10], 4); m.rect(x + 1, y + 1, sw - 2, sh - 2, c, 2);
      // the card's inner edge, dashed: the card covers the side beyond it
      const cx = s.card === 'left' ? x + Math.round(sw * 0.3) : x + Math.round(sw * 0.7);
      for (let j = y + 4; j < y + sh - 4; j += 10) for (let k = 0; k < 5; k++) m.dot(cx, j + k, 1, c);
    }
    const fx = Math.round(s.focus[0] * S), fy = Math.round(s.focus[1] * S);
    m.cross(fx, fy, 9, [20, 14, 10], 2); m.cross(fx, fy, 8, c, 1);
    const nx = i > 0 ? x + 6 : fx + 12, ny = i > 0 ? y + 6 : fy - 20;
    m.rect(nx - 3, ny - 3, 24, 34, [20, 14, 10], 14); m.num(nx + 1, ny + 1, i, 5, c);
  });
  for (const k in G.objs) { const [x, y, hw, hh] = G.objs[k].rect.map(v => Math.round(v * S)); m.rect(x, y, hw, hh, [255, 255, 255], 1); }
  const png = path.join(out, 'sketch.png'); writePNG(png, rgba, w, h);
  ff(['-i', png, '-q:v', '2', path.join(out, 'sketch.jpg')]);
  console.log('sketch ' + w + 'x' + h + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, peak ' + peak());
  console.log('  parts: ' + times.map(t => t[0] + ' ' + (t[1] / 1000).toFixed(1)).join(', '));
  console.log('  lanterns ' + (G.canopy ? G.canopy.length : 0) + ', glints ' + G.glints.length + ', lamps ' + G.lamps.length + ', bells ' + G.bells.length);
  fs.writeFileSync(path.join(out, 'geom.json'), JSON.stringify(geomOut(), null, 1));
}

if (has('proof') || has('crop')) {
  const S = parseFloat(arg('S', '4'));
  let crop, only;
  if (has('proof')) {
    const st = G.stops.find(s => s.id === arg('proof', 'sidekick'));
    if (!st) throw new Error('no stop ' + arg('proof') + '; the stops are ' + G.stops.map(s => s.id).join(', '));
    crop = st.view.slice();
    only = partsFor(crop, ['light', 'air']);
  } else {
    crop = arg('crop', '0,0,1920,1080').split(',').map(Number);
    only = arg('only', '') ? ['paper'].concat(arg('only', '').split(',')) : null;
  }
  const tag = arg('tag', has('proof') ? 'proof-' + arg('proof', 'sidekick') : 'crop');
  const A = createArt({ S, LW: 1920, LH: 1080, seed: 8000, crop });
  const tPaper = Date.now() - t0;
  const tm = timer();
  PL.background(A, G, tm.say, { mode: 'full', only });
  const times = tm.end();
  const [cx0, cy0, cx1, cy1] = A.clip(), cw = cx1 - cx0, ch = cy1 - cy0;
  const rgba = new Uint8ClampedArray(cw * ch * 4); A.rgbaInto(rgba, 0, cx0, cy0, cw, ch);
  const png = path.join(out, tag + '.png'); writePNG(png, rgba, cw, ch);
  ff(['-i', png, '-q:v', '2', path.join(out, tag + '.jpg')]);
  // the same rectangle as a 1x picture would show it when the camera stands this close: shrunk to S = 1, then blown up again
  const w1 = Math.round(cw / S), h1 = Math.round(ch / S);
  ff(['-i', png, '-vf', 'scale=' + w1 + ':' + h1 + ':flags=area,scale=' + cw + ':' + ch + ':flags=bicubic', '-q:v', '2', path.join(out, tag + '-from1x.jpg')]);
  // side by side, 800 px each: what S = 4 gives at this stop, and what a 1x picture would give
  ff(['-i', path.join(out, tag + '.jpg'), '-i', path.join(out, tag + '-from1x.jpg'), '-filter_complex', '[0]scale=800:-2[a];[1]scale=800:-2[b];[a][b]hstack', '-q:v', '3', path.join(out, tag + '-pair.jpg')]);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(tag + ' ' + cw + 'x' + ch + ' px (S=' + S + ', sheet ' + A.W + 'x' + A.H + ')  paper ' + (tPaper / 1000).toFixed(1) + ' s  total ' + secs + ' s  peak ' + peak());
  console.log('  parts: ' + times.map(t => t[0] + ' ' + (t[1] / 1000).toFixed(1)).join(', '));
  fs.writeFileSync(path.join(out, tag + '.json'), JSON.stringify({ crop, S, px: [cx0, cy0, cw, ch], secs: +secs, paperSecs: tPaper / 1000, peakRSS: peak(), parts: times, glints: G.glints.length, lamps: G.lamps.length, bells: G.bells.length }, null, 1));
}

/* ---- a focal object cut out.  The sheet is painted up to the moment the object is drawn; there the object is drawn
   three times from the same seed and onto the same paper (the tooth as full of pigment as it is in the sheet): on black,
   on white, and then on the sheet as it really is.  From black and white: alpha = 1 - (white - black), colour = black /
   alpha.  The colour is then put back on the sheet and the well's light laid over it, as it is over the painting, so the
   cut-out lies exactly on the painted object. */
if (has('cut')) {
  const S = parseFloat(arg('S', '4')), id = arg('cut', 'sidekick');
  if (!G.objs[id]) throw new Error('no object ' + id + '; the objects are ' + Object.keys(G.objs).join(', '));
  const rc = G.objs[id].rect, A = createArt({ S, LW: 1920, LH: 1080, seed: 8000, crop: rc });
  const [cx0, cy0, cx1, cy1] = A.clip(), cw = cx1 - cx0, ch = cy1 - cy0, n = cw * ch;
  const grab = (arr, T) => { const o = new T(n); for (let y = 0; y < ch; y++) o.set(arr.subarray((cy0 + y) * A.W + cx0, (cy0 + y) * A.W + cx1), y * cw); return o; };
  const put = (arr, src) => { for (let y = 0; y < ch; y++) arr.set(src.subarray(y * cw, (y + 1) * cw), (cy0 + y) * A.W + cx0); };
  const flat = v => { for (let y = 0; y < ch; y++) for (const a of [A.R, A.G, A.B]) a.fill(v, (cy0 + y) * A.W + cx0, (cy0 + y) * A.W + cx1); };
  let Ib = null, Iw = null, seen = false;
  const tm = timer();
  PL.background(A, G, tm.say, {
    mode: 'full', only: partsFor(rc, ['light']),
    focal: (fid, run) => {
      if (fid !== id) return run();
      seen = true;
      const sv = { R: grab(A.R, Float32Array), G: grab(A.G, Float32Array), B: grab(A.B, Float32Array), FL: grab(A.FL, Uint8Array), HM: grab(A.HM, Float32Array) };
      flat(0); run(); Ib = [grab(A.R, Float32Array), grab(A.G, Float32Array), grab(A.B, Float32Array)];
      put(A.FL, sv.FL); put(A.HM, sv.HM); flat(1); run(); Iw = [grab(A.R, Float32Array), grab(A.G, Float32Array), grab(A.B, Float32Array)];
      put(A.FL, sv.FL); put(A.HM, sv.HM); put(A.R, sv.R); put(A.G, sv.G); put(A.B, sv.B); run();
    }
  });
  tm.end();
  if (!seen) throw new Error(id + ' was not drawn in ' + rc);
  const painted = new Uint8ClampedArray(n * 4); A.rgbaInto(painted, 0, cx0, cy0, cw, ch);
  const al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.min(1, Math.max(0, 1 - ((Iw[0][i] - Ib[0][i]) + (Iw[1][i] - Ib[1][i]) + (Iw[2][i] - Ib[2][i])) / 3));
    al[i] = a < 0.02 ? 0 : a;
    for (let c = 0; c < 3; c++) Ib[c][i] = al[i] > 0 ? Math.min(1, Ib[c][i] / al[i]) : 0;
  }
  put(A.R, Ib[0]); put(A.G, Ib[1]); put(A.B, Ib[2]);
  PL.background(A, G, null, { mode: 'full', only: ['light'] });
  const cut = new Uint8ClampedArray(n * 4); A.rgbaInto(cut, 0, cx0, cy0, cw, ch);
  for (let i = 0; i < n; i++) cut[i * 4 + 3] = Math.round(al[i] * 255);
  fs.mkdirSync(path.join(out, 'obj'), { recursive: true });
  const png = path.join(out, 'obj', id + '.png'); writePNG(png, cut, cw, ch, true);
  webp(png, path.join(out, 'obj', id + '.webp'), 90);
  // a proof sheet: the object as painted, the cut-out on a check, the cut-out lifted on a dark ground with a shadow
  const prev = new Uint8ClampedArray(n * 4 * 3), W3 = cw * 3;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x, a = al[i], chk = ((x >> 5) + (y >> 5)) & 1 ? 200 : 235;
    for (let c = 0; c < 3; c++) {
      prev[(y * W3 + x) * 4 + c] = painted[i * 4 + c];
      prev[(y * W3 + cw + x) * 4 + c] = cut[i * 4 + c] * a + chk * (1 - a);
      prev[(y * W3 + 2 * cw + x) * 4 + c] = cut[i * 4 + c] * a + [26, 34, 40][c] * (1 - a);
    }
    for (let k = 0; k < 3; k++) prev[(y * W3 + k * cw + x) * 4 + 3] = 255;
  }
  const pp = path.join(out, 'cut-' + id + '-proof.png'); writePNG(pp, prev, W3, ch);
  ff(['-i', pp, '-vf', 'scale=1600:-2', '-q:v', '3', path.join(out, 'cut-' + id + '-proof.jpg')]);
  const rect = [cx0 / S, cy0 / S, cw / S, ch / S].map(r);
  console.log('cut ' + id + ' ' + cw + 'x' + ch + ' px, rect ' + rect.join(',') + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, peak ' + peak() + ', webp ' + Math.round(fs.statSync(path.join(out, 'obj', id + '.webp')).size / 1024) + ' KB');
  fs.writeFileSync(path.join(out, 'obj', id + '.json'), JSON.stringify({ id, src: 'assets/well8k/obj/' + id + '.webp', rect, px: [cw, ch], S }, null, 1));
}

/* ---- the year gauge: drawn on black and on white for its alpha, as the cut-outs are */
/* ---- a motif sheet: one motif in all its poses, big, to judge it on its own */
if (has('birds')) {
  const S = parseFloat(arg('S', '2')), A = createArt({ S, LW: 1000, LH: 260, seed: 77 });
  A.R.fill(0.925); A.G.fill(0.863); A.B.fill(0.737); A.reseed(5);
  const poses = ['sit', 'preen', 'tuck', 'half', 'land', 'fly'], coats = ['grey', 'white', 'grey', 'brown', 'grey', 'white'];
  const px = [80, 200, 320, 450, 640, 820];
  poses.forEach((p, i) => M.w8Pigeon(A, px[i], p === 'fly' ? 160 : 215, 92, p, { c: coats[i] }));
  M.w8PigeonHead(A, 950, 110, 92, {});
  const rgba = A.toRGBA(), png = path.join(out, 'birds.png'); writePNG(png, rgba, A.W, A.H);
  ff(['-i', png, '-q:v', '2', path.join(out, 'birds.jpg')]);
  console.log('birds ' + A.W + 'x' + A.H + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
}

if (has('gauge')) {
  const S = parseFloat(arg('S', '2')), GW = 130, GH = 1600;
  const opts = { w: GW, h: GH, years: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019], marks: [{ id: 'joined', year: 2023, month: 6, kind: 'sindoor' }, { id: 'nit-trichy', year: 2019, month: 7, kind: 'soft' }] };
  const draw = v => {
    const A = createArt({ S, LW: GW, LH: GH, seed: 2026 });
    A.R.fill(v); A.G.fill(v); A.B.fill(v); A.reseed(4711);
    const info = M.w8Gauge(A, opts);
    return { A, info };
  };
  const b = draw(0), w = draw(1), A = b.A, n = A.W * A.H, al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.min(1, Math.max(0, 1 - ((w.A.R[i] - A.R[i]) + (w.A.G[i] - A.G[i]) + (w.A.B[i] - A.B[i])) / 3));
    al[i] = a < 0.02 ? 0 : a;
    if (al[i] > 0) { A.R[i] = Math.min(1, A.R[i] / al[i]); A.G[i] = Math.min(1, A.G[i] / al[i]); A.B[i] = Math.min(1, A.B[i] / al[i]); }
  }
  // where the stone is whole the paper must not show through its tooth: there it is laid over the wasli, fully opaque
  const wasli = [0.925, 0.863, 0.737];
  for (const poly of b.info.solid || []) {
    const bb = A.bbox([poly]);
    for (let Y = Math.max(0, Math.floor(bb[1] * S)); Y < Math.min(A.H, Math.ceil(bb[3] * S)); Y++) for (let X = Math.max(0, Math.floor(bb[0] * S)); X < Math.min(A.W, Math.ceil(bb[2] * S)); X++) {
      if (!A.inside([poly], (X + 0.5) / S, (Y + 0.5) / S)) continue;
      const i = Y * A.W + X, a = al[i];
      A.R[i] = A.R[i] * a + wasli[0] * (1 - a); A.G[i] = A.G[i] * a + wasli[1] * (1 - a); A.B[i] = A.B[i] * a + wasli[2] * (1 - a); al[i] = 1;
    }
  }
  const rgba = A.toRGBA(); for (let i = 0; i < n; i++) rgba[i * 4 + 3] = Math.round(al[i] * 255);
  const png = path.join(out, 'gauge.png'); writePNG(png, rgba, A.W, A.H, true);
  webp(png, path.join(out, 'gauge.webp'), 90);
  // a proof: on the dark of the water and on the paper, with the faces where the page sets its numerals outlined
  const pv = new Uint8ClampedArray(n * 4 * 2), W2 = A.W * 2;
  for (let y = 0; y < A.H; y++) for (let x = 0; x < A.W; x++) {
    const i = y * A.W + x, a = al[i];
    for (let c = 0; c < 3; c++) { pv[(y * W2 + x) * 4 + c] = rgba[i * 4 + c] * a + [14, 34, 40][c] * (1 - a); pv[(y * W2 + A.W + x) * 4 + c] = rgba[i * 4 + c] * a + [236, 220, 188][c] * (1 - a); }
    pv[(y * W2 + x) * 4 + 3] = 255; pv[(y * W2 + A.W + x) * 4 + 3] = 255;
  }
  const pp = path.join(out, 'gauge-proof.png'); writePNG(pp, pv, W2, A.H);
  ff(['-i', pp, '-q:v', '3', path.join(out, 'gauge-proof.jpg')]);
  const info = b.info, sc = v => Math.round(v * S);
  const man = { src: 'assets/well8k/gauge.webp', w: A.W, h: A.H, years: info.years.map(y => ({ label: y.label, y: sc(y.y) })), marks: info.marks.map(m => ({ id: m.id, y: sc(m.y), kind: m.kind })), faces: info.faces.map(f => ({ label: f.label, x: sc(f.x), y: sc(f.y), w: sc(f.w), h: sc(f.h) })) };
  fs.writeFileSync(path.join(out, 'gauge.json'), JSON.stringify(man, null, 1));
  console.log('gauge ' + A.W + 'x' + A.H + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, webp ' + Math.round(fs.statSync(path.join(out, 'gauge.webp')).size / 1024) + ' KB');
  if (has('install')) { fs.mkdirSync(dest, { recursive: true }); fs.copyFileSync(path.join(out, 'gauge.webp'), path.join(dest, 'gauge.webp')); writeManifest({ gauge: man }); }
}

/* ---- the float: the brass plate that rides on the water by the staff, painted at 2x on black and on white for its
   alpha; where the brass is whole it is made fully opaque */
if (has('float')) {
  const S = parseFloat(arg('S', '2')), FW = 170, FH = 64;
  const draw = v => { const A = createArt({ S, LW: FW, LH: FH, seed: 1709 }); A.R.fill(v); A.G.fill(v); A.B.fill(v); A.reseed(311); return { A, info: M.w8Float(A, { w: FW, h: FH }) }; };
  const b = draw(0), w = draw(1), A = b.A, n = A.W * A.H, al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.min(1, Math.max(0, 1 - ((w.A.R[i] - A.R[i]) + (w.A.G[i] - A.G[i]) + (w.A.B[i] - A.B[i])) / 3));
    al[i] = a < 0.02 ? 0 : a;
    if (al[i] > 0) { A.R[i] = Math.min(1, A.R[i] / al[i]); A.G[i] = Math.min(1, A.G[i] / al[i]); A.B[i] = Math.min(1, A.B[i] / al[i]); }
  }
  const brass = [0.78, 0.59, 0.23];
  for (const poly of b.info.solid || []) for (let Y = 0; Y < A.H; Y++) for (let X = 0; X < A.W; X++) {
    if (!A.inside([poly], (X + 0.5) / S, (Y + 0.5) / S)) continue;
    const i = Y * A.W + X, a = al[i];
    A.R[i] = A.R[i] * a + brass[0] * (1 - a); A.G[i] = A.G[i] * a + brass[1] * (1 - a); A.B[i] = A.B[i] * a + brass[2] * (1 - a); al[i] = 1;
  }
  const rgba = A.toRGBA(); for (let i = 0; i < n; i++) rgba[i * 4 + 3] = Math.round(al[i] * 255);
  const png = path.join(out, 'float.png'); writePNG(png, rgba, A.W, A.H, true);
  webp(png, path.join(out, 'float.webp'), 92);
  // a proof, four times as big: on the water, on the stone, and with the face outlined
  const face = b.info.face.map(v => Math.round(v * S)), pv = new Uint8ClampedArray(n * 4 * 3), W3 = A.W * 3;
  for (let y = 0; y < A.H; y++) for (let x = 0; x < A.W; x++) {
    const i = y * A.W + x, a = al[i], onFace = (x === face[0] || x === face[0] + face[2] || y === face[1] || y === face[1] + face[3]) && x >= face[0] && x <= face[0] + face[2] && y >= face[1] && y <= face[1] + face[3];
    for (let c = 0; c < 3; c++) {
      pv[(y * W3 + x) * 4 + c] = rgba[i * 4 + c] * a + [14, 34, 40][c] * (1 - a);
      pv[(y * W3 + A.W + x) * 4 + c] = rgba[i * 4 + c] * a + [228, 207, 162][c] * (1 - a);
      pv[(y * W3 + 2 * A.W + x) * 4 + c] = onFace ? [255, 0, 160][c] : rgba[i * 4 + c] * a + [14, 34, 40][c] * (1 - a);
    }
    for (let k = 0; k < 3; k++) pv[(y * W3 + k * A.W + x) * 4 + 3] = 255;
  }
  const pp = path.join(out, 'float-proof.png'); writePNG(pp, pv, W3, A.H);
  ff(['-i', pp, '-vf', 'scale=iw*2:ih*2:flags=neighbor', '-q:v', '2', path.join(out, 'float-proof.jpg')]);
  const man = { src: 'assets/well8k/float.webp', w: A.W, h: A.H, face };
  fs.writeFileSync(path.join(out, 'float.json'), JSON.stringify(man, null, 1));
  console.log('float ' + A.W + 'x' + A.H + ', face ' + face.join(',') + ', webp ' + Math.round(fs.statSync(path.join(out, 'float.webp')).size / 1024) + ' KB');
  if (has('install')) { fs.mkdirSync(dest, { recursive: true }); fs.copyFileSync(path.join(out, 'float.webp'), path.join(dest, 'float.webp')); writeManifest({ float: man }); }
}

/* ---- the loose drawings: each cel of M.w8CelList painted once (a bird twice, for the boil) on black and on white for
   its alpha, laid in rows on one atlas and cut to what was drawn; then the actors that set them going on the painting,
   placed from the lamps, the lanterns and the gold the sheet recorded.  Map entries are [sx, sy, sw, sh, ax, ay]:
   the cel's pixels in the atlas, and its anchor in sheet units from the cel's top left corner (the page's put()). */
if (has('cels')) {
  const S = parseFloat(arg('S', '4')), GAP = 3, AWU = 256, list = [];
  M.w8CelList.forEach((c, i) => {
    list.push(Object.assign({ seed: 401 + i * 7 }, c));
    if (c.boil) list.push(Object.assign({}, c, { name: c.name + 'b', seed: 9001 + i * 13 }));
  });
  let x = GAP, y = GAP, rowH = 0;
  for (const c of list) {
    if (x + c.w + GAP > AWU) { x = GAP; y += rowH + GAP; rowH = 0; }
    c.ux = x; c.uy = y; x += c.w + GAP; rowH = Math.max(rowH, c.h);
  }
  const LHU = Math.ceil(y + rowH + GAP);
  const paint = v => {
    const A = createArt({ S, LW: AWU, LH: LHU, seed: 77 }); A.R.fill(v); A.G.fill(v); A.B.fill(v);
    for (const c of list) { A.reseed(c.seed); c.draw(A, c.ux, c.uy); }
    return A;
  };
  const A = paint(0), Wt = paint(1), n = A.W * A.H, al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.min(1, Math.max(0, 1 - ((Wt.R[i] - A.R[i]) + (Wt.G[i] - A.G[i]) + (Wt.B[i] - A.B[i])) / 3));
    al[i] = a < 0.012 ? 0 : a;
    if (al[i] > 0) { A.R[i] = Math.min(1, A.R[i] / al[i]); A.G[i] = Math.min(1, A.G[i] / al[i]); A.B[i] = Math.min(1, A.B[i] / al[i]); }
  }
  const rgba = A.toRGBA(); for (let i = 0; i < n; i++) rgba[i * 4 + 3] = Math.round(al[i] * 255);
  const png = path.join(out, 'cels.png'); writePNG(png, rgba, A.W, A.H, true);
  webp(png, path.join(out, 'cels.webp'), 92);
  // each cel cut to what was drawn in its box, with a pixel to spare; a drawing that reaches the edge of its box warns
  const map = {};
  for (const c of list) {
    const X0 = Math.floor(c.ux * S), Y0 = Math.floor(c.uy * S), X1 = Math.ceil((c.ux + c.w) * S), Y1 = Math.ceil((c.uy + c.h) * S);
    let a0 = X1, b0 = Y1, a1 = -1, b1 = -1;
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) if (al[Y * A.W + X] > 0) { if (X < a0) a0 = X; if (X > a1) a1 = X; if (Y < b0) b0 = Y; if (Y > b1) b1 = Y; }
    if (a1 < 0) { console.log('cel ' + c.name + ' is empty'); continue; }
    if (a0 === X0 || b0 === Y0 || a1 === X1 - 1 || b1 === Y1 - 1) console.log('cel ' + c.name + ' reaches the edge of its box');
    a0 = Math.max(X0, a0 - 1); b0 = Math.max(Y0, b0 - 1); a1 = Math.min(X1 - 1, a1 + 1); b1 = Math.min(Y1 - 1, b1 + 1);
    map[c.name] = [a0, b0, a1 - a0 + 1, b1 - b0 + 1, r(c.ux + c.ax - a0 / S), r(c.uy + c.ay - b0 / S)];
  }
  // a proof, twice as big: the atlas on the night of the deep bays and on the day of the sky, with each cut outlined
  const W2 = A.W * 2, pv = new Uint8ClampedArray(W2 * A.H * 4), BG = [[16, 22, 40], [239, 226, 184]];
  for (let Y = 0; Y < A.H; Y++) for (let X = 0; X < A.W; X++) for (let k = 0; k < 2; k++) {
    const i = Y * A.W + X, o = (Y * W2 + k * A.W + X) * 4, a = al[i];
    for (let ch = 0; ch < 3; ch++) pv[o + ch] = rgba[i * 4 + ch] * a + BG[k][ch] * (1 - a);
    pv[o + 3] = 255;
  }
  for (const m of Object.values(map)) for (let k = 0; k < 2; k++) for (let X = m[0]; X < m[0] + m[2]; X++) for (let Y = m[1]; Y < m[1] + m[3]; Y++) {
    if (X !== m[0] && X !== m[0] + m[2] - 1 && Y !== m[1] && Y !== m[1] + m[3] - 1) continue;
    const o = (Y * W2 + k * A.W + X) * 4; pv[o] = 255; pv[o + 1] = 0; pv[o + 2] = 160;
  }
  const pp = path.join(out, 'cels-proof.png'); writePNG(pp, pv, W2, A.H);
  ff(['-i', pp, '-vf', 'scale=iw*2:ih*2:flags=neighbor', '-q:v', '2', path.join(out, 'cels-proof.jpg')]);

  // ---- the actors.  Everything comes and goes at random on the page; here only where, how big, and how often.
  const W = readManifest(), acts = [];
  let seed = 4242; const rng = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + (b - a) * rng();
  const turn = (a, k) => a.slice(k % a.length).concat(a.slice(0, k % a.length));
  const onSheet = p => p[0] >= 0 && p[0] <= (W.LW || 1920) && p[1] >= 0 && p[1] <= (W.LH || 1080);
  const GLOW = ['glow0', 'glow1', 'glow2'];
  // every flame breathes, each out of step with the others
  for (const p of (W.lamps || []).filter(onSheet)) acts.push({ type: 'flicker', z: 1, x: r(p[0]), y: r(p[1] + 1), sc: r(rr(0.36, 0.48) * 100) / 100, hold: 2 + ((rng() * 3) | 0), alpha: [0.3, 0.8], cels: turn(GLOW, (rng() * 3) | 0) });
  // the sixty lanterns of the hall, softer, each by its size
  for (const c of W.canopy || []) acts.push({ type: 'flicker', z: 1, x: r(c.x), y: r(c.y + 1), sc: Math.round(c.s / 26 * 100) / 100, hold: 3 + ((rng() * 3) | 0), alpha: [0.2, 0.6], cels: turn(GLOW, (rng() * 3) | 0) });
  // the sun on the gold: one glint in each 30-unit square, the largest; each lights now and then and goes out
  const cell = new Map();
  for (const g of (W.glints || []).filter(onSheet)) {
    const k = Math.floor(g[0] / 30) + ',' + Math.floor(g[1] / 30), s = g[2] == null ? 0.5 : g[2], o = cell.get(k);
    if (!o || s > o[2]) cell.set(k, [g[0], g[1], s]);
  }
  const SPARK = ['spark0', 'spark1', 'spark2'];
  for (const g of cell.values()) acts.push({ type: 'twinkle', z: 2, box: [r(g[0]), r(g[1]), r(g[0]), r(g[1])], n: 1, every: [6, 28], sc: Math.round(Math.min(0.95, Math.max(0.32, 0.25 + g[2] * 0.6)) * 100) / 100, cels: turn(SPARK, (rng() * 3) | 0) });
  // dust in the sun down the stair, and petals turning in the air over it
  acts.push({ type: 'twinkle', z: 2, box: [922, 125, 998, 955], n: 26, every: [0.8, 3.5], sc: 1, cels: ['mote0', 'mote1', 'mote2'] });
  acts.push({ type: 'twinkle', z: 2, box: [892, 160, 1028, 940], n: 6, every: [3, 9], sc: 1.1, cels: ['pr0', 'pr1', 'pr2', 'pr3'] });
  acts.push({ type: 'twinkle', z: 2, box: [892, 160, 1028, 940], n: 5, every: [3, 9], sc: 1.1, cels: ['pm0', 'pm1', 'pm2', 'pm3'] });
  // rings where a fish rose or a petal fell on the pool, bigger nearer
  const pts = [];
  for (let i = 0; i < 26; i++) { const py = rr(990, 1072), t = (py - 975) / 105; pts.push([r(rr(500 - 40 * t, 1420 + 40 * t)), r(py), Math.round((0.75 + 0.55 * t) * 100) / 100]); }
  acts.push({ type: 'rings', z: 1, hold: 3, every: [0.9, 2.6], sc: 1, cels: ['ring0', 'ring1', 'ring2', 'ring3'], pts });
  // birds across the sky, all flying west: grey pigeons, a few white ones, and now and then cranes in a far V
  const beat = [['pgU', 'pgUb'], ['pgM', 'pgMb'], ['pgD', 'pgDb']], white = [['pwU', 'pwUb'], ['pwM', 'pwMb'], ['pwD', 'pwDb']], crane = [['crU', 'crUb'], ['crM', 'crMb'], ['crD', 'crDb']];
  acts.push({ type: 'flock', z: 3, from: [1995, 66], to: [-75, 42], n: 7, gap: 15, spread: 0.35, size: [0.5, 0.68], first: 5, speed: 72, every: [26, 50], cycle: [0, 1, 2, 1], frames: beat, sag: 8 });
  acts.push({ type: 'flock', z: 3, from: [1995, 84], to: [-75, 72], n: 3, gap: 13, spread: 0.3, size: [0.55, 0.7], first: 21, speed: 88, every: [34, 70], cycle: [0, 1, 2, 1], frames: white, sag: -6 });
  acts.push({ type: 'flock', z: 3, from: [2010, 46], to: [-130, 58], n: 7, gap: 15, spread: 0.35, size: [0.5, 0.58], first: 38, speed: 42, every: [70, 130], cycle: [0, 0, 1, 2, 2, 1], frames: crane, sag: -10 });
  // fireflies where the well goes dark: along the lowest arcade, over the pool, and in the deep side walls
  acts.push({ type: 'blink', z: 4, zones: [[430, 840, 1490, 940], [490, 985, 1430, 1070], [40, 760, 380, 1060], [1540, 760, 1880, 1060]], n: [9, 11, 5, 5], sc: 1, cels: ['fly0', 'fly1'] });

  const man = { atlas: 'assets/well8k/cels.webp', S, w: A.W, h: A.H, map, acts };
  fs.writeFileSync(path.join(out, 'cels.json'), JSON.stringify(man, null, 1));
  const kinds = {}; for (const a of acts) kinds[a.type] = (kinds[a.type] || 0) + 1;
  console.log('cels ' + Object.keys(map).length + ' on ' + A.W + 'x' + A.H + ', webp ' + Math.round(fs.statSync(path.join(out, 'cels.webp')).size / 1024) + ' KB; acts ' + JSON.stringify(kinds));
  if (has('install')) { fs.mkdirSync(dest, { recursive: true }); fs.copyFileSync(path.join(out, 'cels.webp'), path.join(dest, 'cels.webp')); writeManifest({ cels: man }); }
}

/* ---- the cut-outs made by --cut (each in its own process, so they can run side by side) put into --dest and into
   the manifest's objs */
if (has('objs')) {
  const dir = arg('objs'), objs = Object.assign({}, readManifest().objs || {});
  fs.mkdirSync(path.join(dest, 'obj'), { recursive: true });
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    fs.copyFileSync(path.join(dir, j.id + '.webp'), path.join(dest, 'obj', j.id + '.webp'));
    objs[j.id] = { src: j.src, rect: j.rect, px: j.px, S: j.S };
  }
  writeManifest({ objs });
}
