/**
 * build.mjs — Build pipeline untuk "Pendaftaran & Antrian UPK Kemenkes".
 *
 * Yang dilakukan:
 *   1. Kompilasi Tailwind (utilitas yg dipakai saja) via Tailwind CLI.
 *   2. Unduh & pin Chart.js versi spesifik.
 *   3. Unduh font Plus Jakarta Sans (variable, subset latin) → inline base64.
 *      Catatan: Material Symbols tetap via CDN (variable font-nya ~3.8MB,
 *      melampaui batas 500KB/file Apps Script).
 *   4. Rakit output: tulis ulang Style.html / Chart.html / Index.html /
 *      Display.html / Script.html (in-place di project root).
 *   5. Verifikasi cakupan class Tailwind + laporan ukuran file.
 *
 * Setelah build, file berikut yang DI-UPLOAD ke Apps Script:
 *   Code.gs, Utils.gs, Auth.gs, Booking.gs, Antrian.gs, Admin.gs,
 *   Index.html, Script.html, Style.html, Chart.html, Display.html
 *
 * Folder `build/` TIDAK perlu di-upload.
 *
 * Jalankan:  cd build && npm install   (sekali)
 *            npm run build
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(HERE, 'dist');

const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
const PJS_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap';
// Material Symbols variable font terlalu besar untuk di-inline (3.8MB) →
// tetap dimuat dari Google Fonts. Klik icon UI yang dibutuhkan via ligature.
const MATERIAL_LINK =
  '  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">\n';
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const log = (m) => console.log(m);
const err = (m) => { console.error(m); process.exit(1); };

mkdirSync(DIST, { recursive: true });

// ---------------------------------------------------------------------------
// 1) Tailwind
// ---------------------------------------------------------------------------
log('\n[1/5] Mengompilasi Tailwind…');
const tailwindBin = join(HERE, 'node_modules', '.bin', 'tailwindcss');
try {
  execFileSync(tailwindBin, ['-c', 'tailwind.config.cjs', '-i', 'assets/input.css', '-o', 'dist/tailwind.css', '--minify'], {
    stdio: 'inherit',
  });
} catch (e) {
  err('Gagal kompilasi Tailwind. Jalankan `cd build && npm install` dulu.');
}
const tailwindCss = readFileSync(join(DIST, 'tailwind.css'), 'utf8');
log(`  Tailwind OK (${(tailwindCss.length / 1024).toFixed(1)} KB).`);

// ---------------------------------------------------------------------------
// 2) Chart.js
// ---------------------------------------------------------------------------
log('[2/5] Mengunduh Chart.js 4.4.7…');
const chartJs = await fetch(CHART_JS_URL).then(async (r) => {
  if (!r.ok) err(`Gagal unduh Chart.js: HTTP ${r.status}`);
  return r.text();
});
log(`  Chart.js OK (${(chartJs.length / 1024).toFixed(1)} KB).`);

// ---------------------------------------------------------------------------
// 3) Plus Jakarta Sans (variable, subset latin) → base64 inline
// ---------------------------------------------------------------------------
log('[3/5] Mengunduh Plus Jakarta Sans (variable, latin)…');
const pjsResp = await fetch(PJS_FONTS_URL, { headers: { 'User-Agent': CHROME_UA } }).then(async (r) => {
  if (!r.ok) err(`Gagal unduh CSS font: HTTP ${r.status}`);
  return r.text();
});

const blocks = [...pjsResp.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*\{[^}]*\})/g)];
const latin = blocks.filter((b) => b[1] === 'latin');
if (!latin.length) err('Subset latin Plus Jakarta Sans tidak ditemukan.');
log(`  ${latin.length} blok @font-face latin dipakai.`);

const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
const fontFiles = [...latin.map((b) => b[2]).join('\n').matchAll(urlRe)].map((m) => m[1]);
for (const u of fontFiles) {
  const buf = Buffer.from(await fetch(u).then(async (r) => {
    if (!r.ok) err(`Gagal unduh font ${u}: HTTP ${r.status}`);
    return r.arrayBuffer();
  }));
  const b64 = buf.toString('base64');
  for (const b of latin) b[2] = b[2].replace(u, `data:font/woff2;base64,${b64}`);
  log(`    ${(buf.length / 1024).toFixed(0)} KB  ${u.split('/').pop()}`);
}
const fontsCss = latin.map((b) => b[2]).join('\n');
log(`  Fonts CSS inline OK (${(fontsCss.length / 1024).toFixed(0)} KB base64).`);

// ---------------------------------------------------------------------------
// 4) Rakit output
// ---------------------------------------------------------------------------
log('[4/5] Merakit file output…');

const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const write = (f, s) => writeFileSync(join(ROOT, f), s);
const sentinelFonts = '/* === UPK BUILD: fonts (base64) === */';
const sentinelTail = '/* === UPK BUILD: tailwind compiled === */';
const customMarker = '/* === UPK BUILD: custom css === */';

// ---- Style.html: fonts + tailwind + custom css (untuk include di Index) ----
// Ambil hanya bagian custom (di belakang marker), agar build berulang tidak menggandakan.
let customStyle = read('Style.html').match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const cm = customStyle.indexOf(customMarker);
if (cm !== -1) customStyle = customStyle.slice(cm + customMarker.length);
else {
  const tm = customStyle.indexOf(sentinelTail);
  if (tm !== -1) customStyle = customStyle.slice(tm + sentinelTail.length);
}
const styleOut =
  `<style>\n${sentinelFonts}\n${fontsCss}\n\n${sentinelTail}\n${tailwindCss}\n\n${customMarker}\n${customStyle.trim()}\n</style>\n`;
write('Style.html', styleOut);
log('  Style.html ditulis ulang.');

// ---- Chart.html: Chart.js inline (untuk include di Index) ----
write('Chart.html', `<script>\n${chartJs}\n</script>\n`);
log('  Chart.html dibuat (baru).');

// ---- Index.html: CDN tailwind/chart dibuang, fonts → Material saja, include Chart ----
const GSTATIC_PRE =
  '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
let idx = read('Index.html');
idx = idx
  .replace(/  <link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">\n/, '')
  .replace(/  <script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n/, '')
  .replace(/  <script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js"><\/script>\n/, '');
if (!idx.includes('family=Material+Symbols+Outlined')) {
  idx = idx.replace(GSTATIC_PRE, GSTATIC_PRE + MATERIAL_LINK);
}
if (!idx.includes("include('Chart')")) {
  idx = idx.replace('<?!= include(\'Style\'); ?>', '<?!= include(\'Style\'); ?>\n  <?!= include(\'Chart\'); ?>');
}
write('Index.html', idx);
log('  Index.html CDN dibuang, Material Symbols via link, include Chart dipasang.');

// ---- Display.html: CDN dibuang, fonts+tailwind disisipkan ke <style> ----
let disp = read('Display.html');
disp = disp
  .replace(/  <link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">\n/, '')
  .replace(/  <script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n/, '');
if (!disp.includes('family=Material+Symbols+Outlined')) {
  disp = disp.replace(GSTATIC_PRE, GSTATIC_PRE + MATERIAL_LINK);
}
if (!disp.includes(sentinelFonts)) {
  disp = disp.replace('<style>\n', `<style>\n${sentinelFonts}\n${fontsCss}\n\n${sentinelTail}\n${tailwindCss}\n\n`);
}
write('Display.html', disp);
log('  Display.html CDN dibuang, fonts+tailwind disisipkan.');

// ---- Script.html: hapus blok tailwind.config (JIT browser) ----
let script = read('Script.html');
const cfgRe = /  \/\/ =+\n  \/\/ Tailwind CSS custom theme[^\n]*\n  \/\/ =+\n  tailwind\.config = \{[^]*?\n  \};\n\n/;
const before = script.length;
script = script.replace(cfgRe, '');
if (script.length === before) log('  (Warning) blok tailwind.config di Script.html tidak ditemukan — mungkin sudah dibersihkan.');
else log('  Script.html blok tailwind.config dihapus.');
write('Script.html', script);

// ---------------------------------------------------------------------------
// 5) Verifikasi cakupan class + laporan ukuran
// ---------------------------------------------------------------------------
log('\n[5/5] Verifikasi & laporan…');

// Class custom (di CSS manual Style.html & Display.html) → dianggap dikenal.
const custom = new Set();
for (const f of ['Style.html', 'Display.html']) {
  const src = read(f);
  for (const m of src.matchAll(/\.([a-zA-Z][\w-]*)/g)) custom.add(m[1]);
}

// Selector Tailwind → normalisasi (buang backslash & segmen varian/pseudo).
const VARIANT = new Set([
  'hover', 'focus', 'active', 'disabled', 'visited', 'checked', 'focus-within',
  'focus-visible', 'group-hover', 'group-focus', 'peer-hover', 'placeholder',
  'required', 'invalid', 'valid', 'read-only', 'first', 'last', 'odd', 'even',
  'motion-safe', 'motion-reduce', 'dark', 'sm', 'md', 'lg', 'xl', '2xl', 'print',
]);
const normalize = (s) => {
  const out = new Set([s]);
  const segs = s.split(':');
  const base = segs.filter((x) => !VARIANT.has(x)).join(':');
  if (base) out.add(base);
  out.add(segs[segs.length - 1]);
  return out;
};
const known = new Set();
for (const m of tailwindCss.matchAll(/\.([a-zA-Z0-9_\-\[\]\/\.:%\\]+)/g)) {
  for (const k of normalize(m[1].replaceAll('\\', ''))) known.add(k);
}

const candidates = new Set();
for (const f of ['Index.html', 'Display.html', 'Script.html']) {
  const src = read(f);
  for (const m of src.matchAll(/class="([^"]*)"/g)) {
    candidates.add(m[1]);
    for (const bm of m[1].matchAll(/\$\{[^}]*\}/g))
      for (const qm of bm[0].matchAll(/'([^']*)'/g)) candidates.add(qm[1]);
  }
  for (const m of src.matchAll(/className\s*=\s*(['"])([^'"]*)\1/g)) {
    candidates.add(m[2]);
    for (const bm of m[2].matchAll(/\$\{[^}]*\}/g))
      for (const qm of bm[0].matchAll(/'([^']*)'/g)) candidates.add(qm[1]);
  }
}

const missing = new Set();
for (const c of candidates) {
  const cleaned = c.replace(/\$\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
  for (const raw of cleaned.split(' ')) {
    if (!raw) continue;
    const s = raw.replaceAll('\\', '');
    const bases = normalize(s);
    const ok =
      [...bases].some((b) => known.has(b) || custom.has(b)) ||
      (!s.includes('-') && !known.has(s) && !custom.has(s));
    if (!ok) missing.add(raw);
  }
}
if (missing.size) {
  log(`  ⚠  ${missing.size} token class tidak ditemukan di CSS hasil kompilasi:`);
  log('     ' + [...missing].sort().join(' '));
} else {
  log('  Semua class ter-compile. ✓');
}

log('\nUkuran file hasil build (target < 500KB/file, batas Apps Script):');
for (const f of ['Index.html', 'Script.html', 'Style.html', 'Chart.html', 'Display.html']) {
  const kb = statSync(join(ROOT, f)).size / 1024;
  const flag = kb > 500 ? '  ⚠ LEWAT BATAS' : '  ✓';
  log(`  ${f.padEnd(16)} ${kb.toFixed(1).padStart(8)} KB${flag}`);
}

rmSync(DIST, { recursive: true, force: true });
log('\nSelesai. Upload file terbaru ke Apps Script lalu deploy versi baru.');
