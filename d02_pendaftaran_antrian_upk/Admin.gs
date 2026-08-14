/**
 * Admin.gs — Kelola Master Poli, Jadwal Dokter, akun petugas/dokter,
 * serta laporan & statistik operasional.
 */

function getAdminData(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const polis = getPoliRows();
  const jadwals = snapRows(SHEET_JADWAL).map(r => {
    const poli = getPoliById(String(r[COL.Jadwal.poli]));
    return {
      id: String(r[COL.Jadwal.id]),
      poliId: String(r[COL.Jadwal.poli]),
      poliKode: poli ? poli.kode : '',
      poliNama: poli ? poli.nama : '',
      dokter: String(r[COL.Jadwal.dokter]),
      hari: String(r[COL.Jadwal.hari]),
      mulai: cellHHmmStr(r[COL.Jadwal.mulai]),
      selesai: cellHHmmStr(r[COL.Jadwal.selesai]),
      aktif: String(r[COL.Jadwal.aktif])
    };
  });
  const staff = snapRows(SHEET_USERS)
    .filter(r => ['petugas_loket', 'dokter'].includes(String(r[COL.Users.role])))
    .map(sanitizeUser);
  return JSON.stringify({ polis, jadwals, staff });
}

function savePoli(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const id = String((payload && payload.id) || '');
  const kode = String((payload && payload.kode) || '').trim().toUpperCase();
  const nama = String((payload && payload.nama) || '').trim();
  const jenis = String((payload && payload.jenis) || '').trim();
  const kuota = Number(payload && payload.kuota);

  if (!kode || kode.length > 4) throw new Error('Kode poli wajib diisi maksimal 4 karakter.');
  if (!nama) throw new Error('Nama poli wajib diisi.');
  if (!['umum', 'spesialis'].includes(jenis)) throw new Error('Jenis poli tidak valid.');
  if (isNaN(kuota) || kuota <= 0) throw new Error('Kuota harian harus angka positif.');

  if (id) {
    const rowIdx = findRowIdx(SHEET_POLI, COL.Poli.id, id);
    if (rowIdx <= 1) throw new Error('Poli tidak ditemukan.');
    const row = findRowByCol(SHEET_POLI, COL.Poli.id, id);
    const values = row.slice();
    values[COL.Poli.kode] = kode;
    values[COL.Poli.nama] = nama;
    values[COL.Poli.jenis] = jenis;
    values[COL.Poli.kuota] = kuota;
    updateRowData(SHEET_POLI, rowIdx, values);
  } else {
    const existing = snapRows(SHEET_POLI).some(r => String(r[COL.Poli.kode]).toUpperCase() === kode);
    if (existing) throw new Error('Kode poli sudah dipakai.');
    appendRowData(SHEET_POLI, [genId(), kode, nama, jenis, kuota]);
  }
  return JSON.stringify({ ok: true });
}

function saveJadwal(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const id = String((payload && payload.id) || '');
  const poliId = String((payload && payload.poliId) || '');
  const dokter = String((payload && payload.dokter) || '').trim();
  const hari = String((payload && payload.hari) || '').trim();
  const mulai = String((payload && payload.mulai) || '').trim();
  const selesai = String((payload && payload.selesai) || '').trim();
  const aktif = String((payload && payload.aktif) || 'aktif');

  if (!getPoliById(poliId)) throw new Error('Pilih poli terlebih dahulu.');
  if (!dokter) throw new Error('Nama dokter wajib diisi.');
  if (!HARI_NAMES.includes(hari)) throw new Error('Hari tidak valid.');
  if (!/^\d{2}:\d{2}$/.test(mulai) || !/^\d{2}:\d{2}$/.test(selesai)) throw new Error('Format jam harus HH:MM.');
  if (mulai >= selesai) throw new Error('Jam selesai harus lebih besar dari jam mulai.');

  if (id) {
    const rowIdx = findRowIdx(SHEET_JADWAL, COL.Jadwal.id, id);
    if (rowIdx <= 1) throw new Error('Jadwal tidak ditemukan.');
    const row = findRowByCol(SHEET_JADWAL, COL.Jadwal.id, id);
    const values = row.slice();
    values[COL.Jadwal.poli] = poliId;
    values[COL.Jadwal.dokter] = dokter;
    values[COL.Jadwal.hari] = hari;
    values[COL.Jadwal.mulai] = mulai;
    values[COL.Jadwal.selesai] = selesai;
    values[COL.Jadwal.aktif] = aktif;
    updateRowData(SHEET_JADWAL, rowIdx, values);
  } else {
    appendRowData(SHEET_JADWAL, [genId(), poliId, dokter, hari, mulai, selesai, aktif]);
  }
  return JSON.stringify({ ok: true });
}

function deleteJadwal(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const id = String((payload && payload.idJadwal) || '');
  deleteRowByCol(SHEET_JADWAL, COL.Jadwal.id, id);
  return JSON.stringify({ ok: true });
}

function addStaffUser(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const nama = String((payload && payload.nama) || '').trim();
  const username = String((payload && payload.username) || '').trim().toLowerCase();
  const password = String((payload && payload.password) || '');
  const role = String((payload && payload.role) || '').trim();
  const noHp = String((payload && payload.noHp) || '').trim();
  const poliId = String((payload && payload.poliId) || '');

  if (!nama) throw new Error('Nama wajib diisi.');
  if (!['petugas_loket', 'dokter'].includes(role)) throw new Error('Role harus petugas_loket atau dokter.');
  if (username.length < 3) throw new Error('Username minimal 3 karakter.');
  if (password.length < 6) throw new Error('Password minimal 6 karakter.');
  if (role === 'dokter' && !getPoliById(poliId)) throw new Error('Pilih poli untuk akun dokter.');

  const rows = snapRows(SHEET_USERS);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.Users.username]).toLowerCase() === username) {
      throw new Error('Username sudah terdaftar.');
    }
  }

  const id = genId();
  const salt = makeSalt();
  appendRowData(SHEET_USERS, [
    id, nama, '', username, hashPassword(password, salt), salt,
    role, '', '', role === 'dokter' ? poliId : 'UPK Kantor Pusat', noHp, nowIso()
  ]);
  return JSON.stringify({ ok: true });
}

function deleteStaffUser(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const id = String((payload && payload.idUser) || '');
  if (!id) throw new Error('User tidak ditemukan.');
  deleteRowByCol(SHEET_USERS, COL.Users.id, id);
  return JSON.stringify({ ok: true });
}

/**
 * Laporan & statistik: tren harian, per poli, breakdown tipe pasien,
 * dan rata-rata waktu tunggu.
 */
function getReports(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['admin']);
  const today = todayStr();
  const polis = getPoliRows();
  const rows = snapRows(SHEET_ANTRIAN);

  const dates = [];
  for (let i = 13; i >= 0; i--) dates.push(datePlusDays(today, -i));
  const trend = {};
  dates.forEach(d => { trend[d] = { total: 0, selesai: 0, booking: 0, walkin: 0 }; });

  const perPoliToday = {};
  const perPoliWeek = {};
  polis.forEach(p => { perPoliToday[p.id] = 0; perPoliWeek[p.id] = 0; });
  const perTipe = { pegawai: 0, keluarga: 0, umum: 0 };

  const weekStart = datePlusDays(today, -6);
  let totalToday = 0;
  let selesaiToday = 0;
  let totalWaitMs = 0;
  let waitCount = 0;

  rows.forEach(r => {
    const status = String(r[COL.Antrian.status]);
    if (status === 'batal') return;
    const tanggal = cellDateStr(r[COL.Antrian.tanggal]);
    const poliId = String(r[COL.Antrian.poli]);

    if (trend[tanggal]) {
      trend[tanggal].total++;
      if (status === 'selesai') trend[tanggal].selesai++;
      if (String(r[COL.Antrian.jenis]) === 'walkin') trend[tanggal].walkin++;
      else trend[tanggal].booking++;
    }
    if (tanggal === today) {
      totalToday++;
      if (perPoliToday[poliId] !== undefined) perPoliToday[poliId]++;
      if (status === 'selesai') selesaiToday++;
    }
    if (tanggal >= weekStart && tanggal <= today) {
      if (perPoliWeek[poliId] !== undefined) perPoliWeek[poliId]++;
      const pu = getPasienInfo(String(r[COL.Antrian.user]));
      const tipe = pu.tipePasien || 'umum';
      if (perTipe[tipe] !== undefined) perTipe[tipe]++;
    }
    if (r[COL.Antrian.dipanggil] && r[COL.Antrian.dibuat]) {
      const t1 = new Date(cellIsoStr(r[COL.Antrian.dibuat])).getTime();
      const t2 = new Date(cellIsoStr(r[COL.Antrian.dipanggil])).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 >= t1) {
        totalWaitMs += (t2 - t1);
        waitCount++;
      }
    }
  });

  const totalWeek = dates.slice(-7).reduce((s, d) => s + trend[d].total, 0);
  const avgWaitMin = waitCount > 0 ? Math.round(totalWaitMs / 60000 / waitCount) : 0;

  return JSON.stringify({
    today,
    totalToday,
    selesaiToday,
    totalWeek,
    avgWaitMin,
    perPoliToday: polis.map(p => ({ kode: p.kode, nama: p.nama, jumlah: perPoliToday[p.id] || 0 })),
    perPoliWeek: polis.map(p => ({ kode: p.kode, nama: p.nama, jumlah: perPoliWeek[p.id] || 0 })),
    trend: dates.map(d => ({ tanggal: d, total: trend[d].total, selesai: trend[d].selesai, booking: trend[d].booking, walkin: trend[d].walkin })),
    perTipe
  });
}
