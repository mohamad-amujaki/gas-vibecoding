/**
 * Antrian.gs — Operasional antrian: dashboard loket, check-in, panggil,
 * pemeriksaan dokter, walk-in manual dari loket, dan data layar display TV.
 */

function getLoketDashboard(payload) {
  snapReset();
  const user = requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const today = todayStr();

  const polis = getPoliRows().map(p => ({
    ...p,
    sisaHariIni: getSisaKuota(p.id, today),
    menunggu: countByStatus(p.id, today, ['booking', 'checkin']),
    sedangDipanggil: countByStatus(p.id, today, ['dipanggil']),
    selesai: countByStatus(p.id, today, ['selesai'])
  }));

  const antrian = snapRows(SHEET_ANTRIAN)
    .filter(r => cellDateStr(r[COL.Antrian.tanggal]) === today)
    .map(r => {
      const a = mapAntrian(r);
      const pu = getPasienInfo(a.userId);
      return { ...a, namaPasien: pu.nama, tipePasien: pu.tipePasien, identitas: pu.identitas, noHp: pu.noHp };
    })
    .sort((a, b) => a.poliKode.localeCompare(b.poliKode) || a.noAntrian.localeCompare(b.noAntrian));

  return JSON.stringify({ today, polis, antrian, petugas: sanitizeUser(user) });
}

function checkInAntrian(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const id = String((payload && payload.idAntrian) || '');
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (String(row[COL.Antrian.status]) !== 'booking') throw new Error('Hanya antrian berstatus booking yang bisa di-check-in.');
  if (cellDateStr(row[COL.Antrian.tanggal]) !== todayStr()) throw new Error('Check-in hanya untuk antrian hari ini.');
  const values = row.slice();
  values[COL.Antrian.status] = 'checkin';
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

function panggilBerikutnya(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const poliId = String((payload && payload.poliId) || '');
  const today = todayStr();

  const rows = getAntrianRowsFor(poliId, today)
    .filter(r => ['booking', 'checkin'].includes(String(r[COL.Antrian.status])))
    .sort((a, b) => String(a[COL.Antrian.no]).localeCompare(String(b[COL.Antrian.no])));

  if (rows.length === 0) throw new Error('Tidak ada antrian yang menunggu di poli ini.');

  const target = rows[0];
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, String(target[COL.Antrian.id]));
  const values = target.slice();
  values[COL.Antrian.status] = 'dipanggil';
  values[COL.Antrian.dipanggil] = nowIso();
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true, antrian: mapAntrian(values) });
}

function batalAntrianLoket(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const id = String((payload && payload.idAntrian) || '');
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (!['booking', 'checkin'].includes(String(row[COL.Antrian.status]))) {
    throw new Error('Hanya antrian menunggu yang bisa dibatalkan.');
  }
  const values = row.slice();
  values[COL.Antrian.status] = 'batal';
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

/**
 * Walk-in manual dari sisi loket untuk pasien yang tidak mengisi form sendiri.
 * Pasien bisa dipilih dari akun yang sudah ada, atau dibuatkan akun ringan baru.
 */
function createWalkInLoket(payload) {
  const user = requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const poliId = String((payload && payload.poliId) || '');
  const keluhan = String((payload && payload.keluhan) || '').trim().slice(0, 200);
  const userId = String((payload && payload.userId) || '');

  return withLock(() => {
    snapReset();
    const poli = getPoliById(poliId);
    if (!poli) throw new Error('Poli tidak ditemukan.');
    const today = todayStr();
    if (!isWeekday(today)) throw new Error('Layanan walk-in hanya tersedia pada hari kerja.');
    if (getSisaKuota(poliId, today) <= 0) throw new Error('Kuota ' + poli.nama + ' hari ini sudah penuh.');
    if (!keluhan) throw new Error('Keluhan singkat wajib diisi.');

    let pasienId = userId;
    if (!pasienId) {
      const nama = String((payload && payload.nama) || '').trim();
      const tipePasien = String((payload && payload.tipePasien) || 'umum');
      const identitas = String((payload && payload.identitas) || '').trim();
      const noHp = String((payload && payload.noHp) || '').trim();
      const unitKerja = String((payload && payload.unitKerja) || '').trim();
      if (!nama) throw new Error('Nama pasien wajib diisi untuk walk-in manual.');
      if (!identitas) throw new Error('NIP/NIK pasien wajib diisi.');
      if (tipePasien === 'pegawai' && !unitKerja) throw new Error('Unit kerja wajib diisi untuk pasien pegawai.');

      const id = genId();
      const salt = makeSalt();
      const username = 'walkin_' + String(Date.now()).slice(-8);
      appendRowData(SHEET_USERS, [
        id, nama, '', username, hashPassword('walkin123', salt), salt,
        'pasien', tipePasien, identitas, unitKerja, noHp, nowIso()
      ]);
      pasienId = id;
      snapReset(); // user baru belum ada di snapshot
    }

    const id = genId();
    const no = nextNoAntrian(poliId, today);
    const dibuat = nowIso();
    const jam = currentHHmm();
    appendRowData(SHEET_ANTRIAN, [id, pasienId, poliId, today, 'walkin', jam, no, 'checkin', keluhan, dibuat, '', '']);
    return JSON.stringify({ ok: true, antrian: {
      id, userId: pasienId, poliId,
      poliKode: poli.kode, poliNama: poli.nama,
      tanggal: today, jenis: 'walkin', jamBooking: jam, noAntrian: no,
      status: 'checkin', keluhan,
      waktuDibuat: dibuat, waktuDipanggil: '', waktuSelesai: ''
    }});
  });
}

/**
 * Pencarian pasien terdaftar untuk walk-in manual (berdasarkan NIP/NIK atau nama).
 */
function searchPasien(payload) {
  snapReset();
  requireRole(String((payload && payload.token) || ''), ['petugas_loket', 'admin']);
  const q = String((payload && payload.q) || '').trim().toLowerCase();
  if (!q) return JSON.stringify({ results: [] });

  const results = snapRows(SHEET_USERS)
    .filter(r => String(r[COL.Users.role]) === 'pasien')
    .filter(r => {
      const identitas = String(r[COL.Users.identitas]).toLowerCase();
      const nama = String(r[COL.Users.nama]).toLowerCase();
      return identitas.indexOf(q) >= 0 || nama.indexOf(q) >= 0;
    })
    .slice(0, 10)
    .map(r => ({
      id: String(r[COL.Users.id]),
      nama: String(r[COL.Users.nama]),
      tipePasien: String(r[COL.Users.tipe]),
      identitas: String(r[COL.Users.identitas]),
      noHp: String(r[COL.Users.hp])
    }));
  return JSON.stringify({ results });
}

function getDokterDashboard(payload) {
  snapReset();
  const user = requireRole(String((payload && payload.token) || ''), ['dokter', 'admin']);
  const poliId = String(user[COL.Users.unit] || '');
  const today = todayStr();
  const poli = getPoliById(poliId);

  const rows = snapRows(SHEET_ANTRIAN)
    .filter(r => String(r[COL.Antrian.poli]) === poliId && cellDateStr(r[COL.Antrian.tanggal]) === today)
    .map(r => {
      const a = mapAntrian(r);
      const pu = getPasienInfo(a.userId);
      return { ...a, namaPasien: pu.nama, tipePasien: pu.tipePasien, identitas: pu.identitas, noHp: pu.noHp };
    })
    .sort((a, b) => a.noAntrian.localeCompare(b.noAntrian));

  return JSON.stringify({
    today,
    poli,
    dipanggil: rows.filter(a => a.status === 'dipanggil'),
    diperiksa: rows.filter(a => a.status === 'diperiksa'),
    selesai: rows.filter(a => a.status === 'selesai'),
    dokter: sanitizeUser(user)
  });
}

function mulaiPeriksa(payload) {
  snapReset();
  const user = requireRole(String((payload && payload.token) || ''), ['dokter', 'admin', 'petugas_loket']);
  const id = String((payload && payload.idAntrian) || '');
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (String(row[COL.Antrian.status]) !== 'dipanggil') throw new Error('Hanya antrian berstatus dipanggil yang bisa diperiksa.');
  if (String(user[COL.Users.role]) === 'dokter' && String(row[COL.Antrian.poli]) !== String(user[COL.Users.unit])) {
    throw new Error('Pasien bukan milik poli Anda.');
  }
  const values = row.slice();
  values[COL.Antrian.status] = 'diperiksa';
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

function selesaiPeriksa(payload) {
  snapReset();
  const user = requireRole(String((payload && payload.token) || ''), ['dokter', 'admin', 'petugas_loket']);
  const id = String((payload && payload.idAntrian) || '');
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (String(row[COL.Antrian.status]) !== 'diperiksa') throw new Error('Hanya antrian berstatus diperiksa yang bisa diselesaikan.');
  if (String(user[COL.Users.role]) === 'dokter' && String(row[COL.Antrian.poli]) !== String(user[COL.Users.unit])) {
    throw new Error('Pasien bukan milik poli Anda.');
  }
  const values = row.slice();
  values[COL.Antrian.status] = 'selesai';
  values[COL.Antrian.selesai] = nowIso();
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

/**
 * Data layar display ruang tunggu (akses publik, tanpa login).
 */
function getDisplayData(payload) {
  snapReset();
  ensureInited();
  const today = todayStr();
  const polis = getPoliRows().map(p => {
    const rows = getAntrianRowsFor(p.id, today)
      .sort((a, b) => String(a[COL.Antrian.no]).localeCompare(String(b[COL.Antrian.no])));
    const current = rows.filter(r => String(r[COL.Antrian.status]) === 'dipanggil');
    const sedang = current[current.length - 1] || null;
    const nextRows = rows.filter(r => ['booking', 'checkin'].includes(String(r[COL.Antrian.status])));
    const nameOf = r => getPasienInfo(String(r[COL.Antrian.user])).nama;
    return {
      id: p.id,
      kode: p.kode,
      nama: p.nama,
      jenis: p.jenis,
      sedangDipanggil: sedang ? { no: String(sedang[COL.Antrian.no]), nama: nameOf(sedang) } : null,
      berikutnya: nextRows.slice(0, 3).map(r => ({ no: String(r[COL.Antrian.no]), nama: nameOf(r) }))
    };
  });
  return JSON.stringify({ today, polis });
}
