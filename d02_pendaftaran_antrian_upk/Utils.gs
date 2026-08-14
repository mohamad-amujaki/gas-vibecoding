/**
 * Utils.gs — Konstanta, inisialisasi sheet, seed data, dan helper bersama
 * untuk Sistem Pendaftaran & Antrian UPK Kantor Pusat Kemenkes.
 */

const SHEET_USERS = 'Users';
const SHEET_POLI = 'MasterPoli';
const SHEET_JADWAL = 'JadwalDokter';
const SHEET_ANTRIAN = 'Antrian';
const SHEET_SESSIONS = 'Sessions';

const ROLES = ['pasien', 'petugas_loket', 'dokter', 'admin'];
const TIPE_PASIEN = ['pegawai', 'keluarga', 'umum'];
const JENIS_ANTRIAN = ['booking', 'walkin'];
const STATUS_ANTRIAN = ['booking', 'checkin', 'dipanggil', 'diperiksa', 'selesai', 'batal'];
const HARI_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam
const MIN_HOURS_BEFORE_CHANGE = 2; // minimal 2 jam sebelum jadwal
const JAM_OPERASIONAL = { mulai: '08:00', selesai: '15:00' };
const INIT_FLAG = 'upk_inited_v1';
const SESSION_CACHE_PREFIX = 'upk_sess_';

// ---------------------------------------------------------------------------
// Snapshot per-request — baca Spreadsheet SEKALI per eksekusi, lalu pakai memori.
// snapReset() dipanggil di awal tiap fungsi publik agar data selalu segar.
// Ini menghilangkan pembacaan ulang full-sheet pada lookup berulang (pola N×M).
// ---------------------------------------------------------------------------

let _snap = {};
let _poliMap = null;

function snapReset() {
  _snap = {};
  _poliMap = null;
}

function snapRows(sheetName) {
  if (!_snap[sheetName]) _snap[sheetName] = readRows(sheetName).slice(1);
  return _snap[sheetName];
}

/**
 * Jalankan fungsi di dalam LockService agar operasi baca-hitung-tulis (nomor
 * antrian, kuota) atomik — mencegah nomor duplikat saat banyak petugas menulis
 * bersamaan.
 */
function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inisialisasi sheet + seed data cukup sekali (via CacheService), tidak tiap request.
 */
function ensureInited() {
  const cache = CacheService.getScriptCache();
  if (cache.get(INIT_FLAG)) return;
  initSheets();
  seedData();
  try { cache.put(INIT_FLAG, '1', 21600); } catch (e) { /* abaikan */ }
}

// Indeks kolom per sheet (0-based, setelah baris header).
const COL = {
  Users: { id: 0, nama: 1, email: 2, username: 3, pass: 4, salt: 5, role: 6, tipe: 7, identitas: 8, unit: 9, hp: 10, created: 11 },
  Poli: { id: 0, kode: 1, nama: 2, jenis: 3, kuota: 4 },
  Jadwal: { id: 0, poli: 1, dokter: 2, hari: 3, mulai: 4, selesai: 5, aktif: 6 },
  Antrian: { id: 0, user: 1, poli: 2, tanggal: 3, jenis: 4, jam: 5, no: 6, status: 7, keluhan: 8, dibuat: 9, dipanggil: 10, selesai: 11 },
  Session: { token: 0, user: 1, expired: 2 }
};

/**
 * Memastikan semua sheet (tabel) tersedia di spreadsheet aktif.
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_USERS, [
    'id_user', 'nama', 'email', 'username', 'password_hash', 'salt', 'role',
    'tipe_pasien', 'identitas', 'unit_kerja', 'no_hp', 'created_at'
  ]);
  ensureSheet(ss, SHEET_POLI, ['id_poli', 'kode_poli', 'nama_poli', 'jenis', 'kuota_harian']);
  ensureSheet(ss, SHEET_JADWAL, ['id_jadwal', 'id_poli', 'nama_dokter', 'hari', 'jam_mulai', 'jam_selesai', 'status_aktif']);
  ensureSheet(ss, SHEET_ANTRIAN, [
    'id_antrian', 'user_id', 'id_poli', 'tanggal', 'jenis', 'jam_booking', 'no_antrian',
    'status', 'keluhan_singkat', 'waktu_dibuat', 'waktu_dipanggil', 'waktu_selesai'
  ]);
  ensureSheet(ss, SHEET_SESSIONS, ['token', 'user_id', 'expired_at']);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  styleHeaderRow(sheet, headers.length);
  return sheet;
}

function styleHeaderRow(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setFontWeight('bold');
  range.setBackground('#E0F5F4');
  range.setFontColor('#0E5E5B');
  sheet.setFrozenRows(1);
}

// ---------------------------------------------------------------------------
// Seed data dummy agar aplikasi "hidup" saat pertama kali dibuka.
// ---------------------------------------------------------------------------

function seedData() {
  const users = readRows(SHEET_USERS);
  if (users.length > 1) return; // sudah ada data

  const ids = {};
  const mkUser = (key, nama, email, username, pass, role, tipe, identitas, unit, hp) => {
    const id = genId();
    const salt = makeSalt();
    appendRowData(SHEET_USERS, [id, nama, email, username, hashPassword(pass, salt), salt, role, tipe, identitas, unit, hp, nowIso()]);
    ids[key] = id;
  };

  // Poli
  const poliId = {};
  [['UM', 'Poli Umum', 'umum', 30], ['GG', 'Poli Gigi', 'spesialis', 15],
   ['JT', 'Poli Jantung', 'spesialis', 12], ['PR', 'Poli Paru', 'spesialis', 12]]
    .forEach(([kode, nama, jenis, kuota]) => {
      const id = genId();
      appendRowData(SHEET_POLI, [id, kode, nama, jenis, kuota]);
      poliId[kode] = id;
    });

  // Jadwal dokter (hari kerja)
  const jd = (kode, dokter, hari, mulai, selesai) =>
    appendRowData(SHEET_JADWAL, [genId(), poliId[kode], dokter, hari, mulai, selesai, 'aktif']);
  jd('UM', 'dr. Budi Santoso', 'Senin', '08:00', '12:00');
  jd('UM', 'dr. Budi Santoso', 'Selasa', '08:00', '12:00');
  jd('UM', 'dr. Budi Santoso', 'Rabu', '08:00', '12:00');
  jd('UM', 'dr. Budi Santoso', 'Kamis', '08:00', '12:00');
  jd('UM', 'dr. Budi Santoso', 'Jumat', '08:00', '12:00');
  jd('UM', 'dr. Rina Marlina', 'Senin', '13:00', '15:00');
  jd('UM', 'dr. Rina Marlina', 'Rabu', '13:00', '15:00');
  jd('UM', 'dr. Rina Marlina', 'Jumat', '13:00', '15:00');
  jd('GG', 'drg. Siti Aminah, Sp.KG', 'Senin', '08:00', '12:00');
  jd('GG', 'drg. Siti Aminah, Sp.KG', 'Selasa', '08:00', '12:00');
  jd('GG', 'drg. Siti Aminah, Sp.KG', 'Kamis', '08:00', '12:00');
  jd('GG', 'drg. Ratna Dewi', 'Rabu', '09:00', '13:00');
  jd('GG', 'drg. Ratna Dewi', 'Jumat', '09:00', '13:00');
  jd('JT', 'dr. Andi Wijaya, Sp.JP', 'Senin', '09:00', '12:00');
  jd('JT', 'dr. Andi Wijaya, Sp.JP', 'Rabu', '09:00', '12:00');
  jd('JT', 'dr. Hendra Gunawan, Sp.JP', 'Selasa', '09:00', '12:00');
  jd('JT', 'dr. Hendra Gunawan, Sp.JP', 'Kamis', '09:00', '12:00');
  jd('PR', 'dr. Nurhayati, Sp.P', 'Senin', '10:00', '13:00');
  jd('PR', 'dr. Nurhayati, Sp.P', 'Kamis', '10:00', '13:00');
  jd('PR', 'dr. Fajar Prasetyo, Sp.P', 'Selasa', '10:00', '13:00');
  jd('PR', 'dr. Fajar Prasetyo, Sp.P', 'Jumat', '10:00', '13:00');

  // Akun
  mkUser('admin', 'Rina Setyawati', 'admin@upk.kemkes.go.id', 'admin', 'admin123', 'admin', '', '', 'UPK Kantor Pusat', '081211111111');
  mkUser('loket1', 'Dewi Anggraini', 'dewi@upk.kemkes.go.id', 'loket1', 'loket123', 'petugas_loket', '', '', 'UPK Kantor Pusat', '081212121212');
  mkUser('dokumum', 'dr. Budi Santoso', 'budi@upk.kemkes.go.id', 'dokter_umum', 'dokter123', 'dokter', '', '', poliId['UM'], '081298765432');
  mkUser('dokgigi', 'drg. Siti Aminah, Sp.KG', 'siti@upk.kemkes.go.id', 'dokter_gigi', 'dokter123', 'dokter', '', '', poliId['GG'], '081299887766');
  mkUser('dokjantung', 'dr. Andi Wijaya, Sp.JP', 'andi@upk.kemkes.go.id', 'dokter_jantung', 'dokter123', 'dokter', '', '', poliId['JT'], '081277665544');
  mkUser('dokparu', 'dr. Nurhayati, Sp.P', 'nurhayati@upk.kemkes.go.id', 'dokter_paru', 'dokter123', 'dokter', '', '', poliId['PR'], '081233445566');
  mkUser('agus', 'Agus Prasetyo', 'agus.prasetyo@gmail.com', 'pegawai1', 'pegawai123', 'pasien', 'pegawai', '198507012005011001', 'Biro Kepegawaian', '081311112222');
  mkUser('sri', 'Sri Wahyuni', 'sri.wahyuni@gmail.com', 'keluarga1', 'keluarga123', 'pasien', 'keluarga', '3171014508900002', 'Sekretariat Jenderal', '081322223333');
  mkUser('rizky', 'Rizky Maulana', 'rizky.maulana@gmail.com', 'umum1', 'umum123', 'pasien', 'umum', '3273011234567890', '', '081333334444');

  // Contoh antrian
  const today = todayStr();
  const y = previousWeekday(today);
  const tmr = nextNWeekdays(1)[0];
  const iso = (minsAgo) => new Date(Date.now() - minsAgo * 60000).toISOString();
  const seedA = (key, kode, tanggal, jenis, jam, no, status, keluhan, dibuat, dipanggil, selesai) =>
    appendRowData(SHEET_ANTRIAN, [genId(), ids[key], poliId[kode], tanggal, jenis, jam, no, status, keluhan, dibuat, dipanggil, selesai]);

  // Hari ini
  seedA('agus', 'UM', today, 'booking', '08:00', 'UM-001', 'selesai', 'Demam dan batuk sejak 2 hari', iso(150), iso(130), iso(100));
  seedA('sri', 'UM', today, 'booking', '09:00', 'UM-002', 'checkin', 'Sakit kepala, ingin periksa tekanan darah', iso(80), '', '');
  seedA('rizky', 'UM', today, 'walkin', '10:15', 'UM-003', 'booking', 'Pemeriksaan kesehatan berkala', iso(40), '', '');
  seedA('sri', 'GG', today, 'booking', '09:30', 'GG-001', 'dipanggil', 'Sakit gigi berlubang di geraham', iso(90), iso(15), '');
  seedA('rizky', 'GG', today, 'booking', '10:30', 'GG-002', 'booking', 'Konsultasi cabut gigi', iso(60), '', '');
  seedA('agus', 'JT', today, 'booking', '11:00', 'JT-001', 'booking', 'Cek jantung berkala (riwayat keluarga)', iso(55), '', '');
  seedA('sri', 'PR', today, 'walkin', '11:30', 'PR-001', 'booking', 'Batang tenggorokan terasa mengganjal', iso(30), '', '');

  // Besok (booking aktif untuk ditampilkan di dashboard pasien)
  seedA('rizky', 'JT', tmr, 'booking', '09:00', nextNoAntrian(poliId['JT'], tmr), 'booking', 'Pemeriksaan tekanan darah', iso(20), '', '');
  seedA('rizky', 'PR', tmr, 'booking', '10:00', nextNoAntrian(poliId['PR'], tmr), 'booking', 'Kontrol asma rutin', iso(10), '', '');

  // Riwayat (hari kerja sebelumnya)
  seedA('agus', 'UM', y, 'booking', '08:30', 'UM-001', 'selesai', 'Demam ringan', iso(1400), iso(1370), iso(1320));
  seedA('rizky', 'UM', y, 'walkin', '10:00', 'UM-002', 'selesai', 'Cek gula darah', iso(1300), iso(1260), iso(1230));
  seedA('sri', 'GG', y, 'booking', '09:00', 'GG-001', 'selesai', 'Scaling / pembersihan karang gigi', iso(1600), iso(1570), iso(1540));
  seedA('rizky', 'JT', y, 'booking', '13:00', 'JT-001', 'selesai', 'Kontrol tekanan darah', iso(1500), iso(1470), iso(1430));
  seedA('rizky', 'PR', y, 'booking', '10:30', 'PR-001', 'batal', 'Sesak nafas ringan', iso(1200), '', '');
}

// ---------------------------------------------------------------------------
// Helpers data sheet
// ---------------------------------------------------------------------------

function readRows(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

function appendRowData(sheetName, values) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).appendRow(values);
}

function updateRowData(sheetName, rowIdx, values) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.getRange(rowIdx, 1, 1, values.length).setValues([values]);
}

function findRowIdx(sheetName, colIdx, value) {
  const rows = readRows(sheetName);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][colIdx]) === String(value)) return i + 1;
  }
  return -1;
}

function findRowByCol(sheetName, colIdx, value) {
  const rows = readRows(sheetName);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][colIdx]) === String(value)) return rows[i];
  }
  return null;
}

function deleteRowByCol(sheetName, colIdx, value) {
  const idx = findRowIdx(sheetName, colIdx, value);
  if (idx > 1) SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).deleteRow(idx);
}

// ---------------------------------------------------------------------------
// Helpers ID, password, waktu
// ---------------------------------------------------------------------------

function genId() {
  return Utilities.getUuid();
}

function makeSalt() {
  return Utilities.getUuid().slice(0, 8);
}

function hashPassword(password, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password) + String(salt),
    Utilities.Charset.UTF_8
  );
  return digest.map(b => ((b < 0 ? b + 256 : b).toString(16)).padStart(2, '0')).join('');
}

function getTz() {
  return Session.getScriptTimeZone();
}

function todayStr() {
  return Utilities.formatDate(new Date(), getTz(), 'yyyy-MM-dd');
}

function nowIso() {
  return new Date().toISOString();
}

function currentHHmm() {
  return Utilities.formatDate(new Date(), getTz(), 'HH:mm');
}

/**
 * Normalisasi nilai sel dari Sheet menjadi string tanggal 'yyyy-MM-dd'.
 * Sel bertipe Date (nilai tanggal/jam di spreadsheet) diubah ke format teks bersih,
 * mencegah munculnya format bawaan seperti "Sat Dec 30 1899 07:26:00 GMT+0707".
 */
function cellDateStr(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, getTz(), 'yyyy-MM-dd');
  return String(v || '');
}

/**
 * Normalisasi nilai sel menjadi string jam 'HH:mm' (untuk kolom jam/jadwal).
 */
function cellHHmmStr(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, getTz(), 'HH:mm');
  return String(v || '');
}

/**
 * Normalisasi nilai sel menjadi string ISO 8601 (untuk kolom waktu_dibuat/dipanggil/selesai).
 */
function cellIsoStr(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString();
  return String(v || '');
}

function datePlusDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return Utilities.formatDate(d, getTz(), 'yyyy-MM-dd');
}

function dayNameOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return HARI_NAMES[(d.getDay() + 6) % 7];
}

function isWeekday(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow >= 1 && dow <= 5;
}

function previousWeekday(dateStr) {
  let d = datePlusDays(dateStr, -1);
  while (!isWeekday(d)) d = datePlusDays(d, -1);
  return d;
}

function nextNWeekdays(n) {
  const out = [];
  let d = datePlusDays(todayStr(), 1);
  while (out.length < n) {
    if (isWeekday(d)) out.push(d);
    d = datePlusDays(d, 1);
  }
  return out;
}

function hhmmToMs(hhmm) {
  const p = String(hhmm || '').split(':');
  return Number(p[0]) * 3600000 + Number(p[1] || 0) * 60000;
}

function addMinutesToHHmm(hhmm, mins) {
  const parts = String(hhmm).split(':');
  const d = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]) + mins);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/**
 * Cek apakah antrian masih bisa dibatalkan/dijadwalkan ulang (>= 2 jam sebelum jadwal).
 */
function isBookingChangeable(tanggal, jamBooking) {
  if (!tanggal || !jamBooking) return false;
  const today = todayStr();
  if (tanggal > today) return true;
  if (tanggal < today) return false;
  return hhmmToMs(jamBooking) - hhmmToMs(currentHHmm()) >= MIN_HOURS_BEFORE_CHANGE * 3600000;
}

// ---------------------------------------------------------------------------
// Helpers poli, jadwal, antrian, kuota
// ---------------------------------------------------------------------------

function getPoliRows() {
  return snapRows(SHEET_POLI).map(p => ({
    id: String(p[COL.Poli.id]),
    kode: String(p[COL.Poli.kode]),
    nama: String(p[COL.Poli.nama]),
    jenis: String(p[COL.Poli.jenis]),
    kuotaHarian: Number(p[COL.Poli.kuota]) || 0
  }));
}

function getPoliMap() {
  if (!_poliMap) {
    _poliMap = {};
    snapRows(SHEET_POLI).forEach(p => { _poliMap[String(p[COL.Poli.id])] = p; });
  }
  return _poliMap;
}

function getPoliById(poliId) {
  const p = getPoliMap()[String(poliId)];
  return p ? {
    id: String(p[COL.Poli.id]),
    kode: String(p[COL.Poli.kode]),
    nama: String(p[COL.Poli.nama]),
    jenis: String(p[COL.Poli.jenis]),
    kuotaHarian: Number(p[COL.Poli.kuota]) || 0
  } : null;
}

function getJadwalRowsForPoli(poliId) {
  return snapRows(SHEET_JADWAL)
    .filter(r => String(r[COL.Jadwal.poli]) === String(poliId) && String(r[COL.Jadwal.aktif]) === 'aktif')
    .map(r => ({
      id: String(r[COL.Jadwal.id]),
      poliId: String(r[COL.Jadwal.poli]),
      dokter: String(r[COL.Jadwal.dokter]),
      hari: String(r[COL.Jadwal.hari]),
      mulai: cellHHmmStr(r[COL.Jadwal.mulai]),
      selesai: cellHHmmStr(r[COL.Jadwal.selesai])
    }));
}

function getAntrianRowsFor(poliId, tanggal) {
  const t = cellDateStr(tanggal);
  return snapRows(SHEET_ANTRIAN)
    .filter(r => String(r[COL.Antrian.poli]) === String(poliId) && cellDateStr(r[COL.Antrian.tanggal]) === t);
}

function countActiveAntrian(poliId, tanggal) {
  return getAntrianRowsFor(poliId, tanggal).filter(r => String(r[COL.Antrian.status]) !== 'batal').length;
}

function getSisaKuota(poliId, tanggal) {
  const poli = getPoliById(poliId);
  const kuota = poli ? poli.kuotaHarian : 0;
  return Math.max(0, kuota - countActiveAntrian(poliId, tanggal));
}

function nextNoAntrian(poliId, tanggal) {
  const poli = getPoliById(poliId);
  const kode = poli ? poli.kode : 'POL';
  const n = getAntrianRowsFor(poliId, tanggal).length + 1;
  return kode + '-' + String(n).padStart(3, '0');
}

/**
 * Menghasilkan slot jam 30 menit dari jadwal dokter yang aktif pada tanggal tsb.
 */
function getSlotsForDate(poliId, tanggal) {
  const dayName = dayNameOf(tanggal);
  const jadwals = getJadwalRowsForPoli(poliId).filter(j => j.hari === dayName);
  if (jadwals.length === 0) return [];
  const slots = [];
  jadwals.forEach(j => {
    let t = j.mulai;
    while (t < j.selesai) {
      const end = addMinutesToHHmm(t, 30);
      slots.push({ waktu: t, selesai: end, dokter: j.dokter });
      t = end;
    }
  });
  return slots;
}

function mapAntrian(row) {
  const poli = getPoliById(String(row[COL.Antrian.poli]));
  return {
    id: String(row[COL.Antrian.id]),
    userId: String(row[COL.Antrian.user]),
    poliId: String(row[COL.Antrian.poli]),
    poliKode: poli ? poli.kode : '',
    poliNama: poli ? poli.nama : '',
    tanggal: cellDateStr(row[COL.Antrian.tanggal]),
    jenis: String(row[COL.Antrian.jenis]),
    jamBooking: cellHHmmStr(row[COL.Antrian.jam]),
    noAntrian: String(row[COL.Antrian.no] || ''),
    status: String(row[COL.Antrian.status] || 'booking'),
    keluhan: String(row[COL.Antrian.keluhan] || ''),
    waktuDibuat: cellIsoStr(row[COL.Antrian.dibuat]),
    waktuDipanggil: cellIsoStr(row[COL.Antrian.dipanggil]),
    waktuSelesai: cellIsoStr(row[COL.Antrian.selesai])
  };
}

function getUserRowById(userId) {
  return snapRows(SHEET_USERS).find(r => String(r[COL.Users.id]) === String(userId)) || null;
}

function getPasienInfo(userId) {
  const pu = getUserRowById(userId);
  return pu ? {
    nama: String(pu[COL.Users.nama]),
    tipePasien: String(pu[COL.Users.tipe] || ''),
    identitas: String(pu[COL.Users.identitas] || ''),
    noHp: String(pu[COL.Users.hp] || '')
  } : { nama: '', tipePasien: '', identitas: '', noHp: '' };
}

function countByStatus(poliId, tanggal, statuses) {
  return getAntrianRowsFor(poliId, tanggal).filter(r => statuses.includes(String(r[COL.Antrian.status]))).length;
}
