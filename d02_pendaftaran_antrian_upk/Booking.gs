/**
 * Booking.gs — Alur pendaftaran pasien: booking terjadwal & walk-in,
 * kuota harian, slot jam dokter, pembatalan & penjadwalan ulang.
 * Semua validasi dilakukan di sisi server (GAS) selain validasi client.
 */

function getPoliData(payload) {
  snapReset();
  requireAuth(String((payload && payload.token) || ''));
  const today = todayStr();
  const polis = getPoliRows().map(p => ({
    ...p,
    sisaHariIni: getSisaKuota(p.id, today),
    terisiHariIni: countActiveAntrian(p.id, today),
    jadwal: getJadwalRowsForPoli(p.id)
  }));
  return JSON.stringify({ today, polis });
}

/**
 * Opsi tanggal (14 hari kerja berikutnya) lengkap dengan sisa kuota & ketersediaan jadwal.
 */
function getDateOptions(payload) {
  snapReset();
  requireAuth(String((payload && payload.token) || ''));
  const poliId = String((payload && payload.poliId) || '');
  const poli = getPoliById(poliId);
  if (!poli) throw new Error('Poli tidak ditemukan.');
  const options = nextNWeekdays(14).map(t => ({
    tanggal: t,
    namaHari: dayNameOf(t),
    sisaKuota: getSisaKuota(poliId, t),
    kuota: poli.kuotaHarian,
    adaJadwal: getSlotsForDate(poliId, t).length > 0
  }));
  return JSON.stringify({ poli, options });
}

/**
 * Cek kuota & slot jam dokter untuk tanggal tertentu.
 */
function getSlots(payload) {
  snapReset();
  requireAuth(String((payload && payload.token) || ''));
  const poliId = String((payload && payload.poliId) || '');
  const tanggal = String((payload && payload.tanggal) || '');
  const poli = getPoliById(poliId);
  if (!poli) throw new Error('Poli tidak ditemukan.');
  if (!tanggal) throw new Error('Tanggal wajib dipilih.');
  if (!isWeekday(tanggal)) throw new Error('Pendaftaran hanya untuk hari kerja (Senin–Jumat).');

  const slots = getSlotsForDate(poliId, tanggal);
  const sisa = getSisaKuota(poliId, tanggal);
  const penuh = sisa <= 0;
  const saran = penuh ? (nextNWeekdays(14).find(d => getSisaKuota(poliId, d) > 0) || null) : null;

  return JSON.stringify({
    poli,
    tanggal,
    namaHari: dayNameOf(tanggal),
    sisaKuota: sisa,
    kuota: poli.kuotaHarian,
    penuh,
    saran,
    slots
  });
}

function createBooking(payload) {
  const user = requireAuth(String((payload && payload.token) || ''));
  const poliId = String((payload && payload.poliId) || '');
  const tanggal = String((payload && payload.tanggal) || '');
  const jamBooking = String((payload && payload.jamBooking) || '');
  const keluhan = String((payload && payload.keluhan) || '').trim().slice(0, 200);

  return withLock(() => {
    snapReset(); // baca ulang setelah dapat lock agar penghitungan kuota/no akurat
    const poli = getPoliById(poliId);
    if (!poli) throw new Error('Poli tidak ditemukan.');
    if (!tanggal) throw new Error('Tanggal booking wajib dipilih.');
    if (!isWeekday(tanggal)) throw new Error('Booking hanya untuk hari kerja (Senin–Jumat).');
    if (!keluhan) throw new Error('Keluhan singkat wajib diisi.');

    const slots = getSlotsForDate(poliId, tanggal);
    if (slots.length === 0) throw new Error('Tidak ada jadwal dokter pada tanggal tersebut.');
    if (!slots.some(s => s.waktu === jamBooking)) throw new Error('Slot jam yang dipilih tidak tersedia.');
    if (getSisaKuota(poliId, tanggal) <= 0) throw new Error('Kuota ' + poli.nama + ' sudah penuh pada tanggal tersebut.');

    const existing = getAntrianRowsFor(poliId, tanggal)
      .find(r => String(r[COL.Antrian.user]) === String(user[COL.Users.id]) && String(r[COL.Antrian.status]) !== 'batal');
    if (existing) throw new Error('Anda sudah memiliki antrian aktif di ' + poli.nama + ' pada tanggal tersebut.');

    const id = genId();
    const no = nextNoAntrian(poliId, tanggal);
    const dibuat = nowIso();
    appendRowData(SHEET_ANTRIAN, [id, user[COL.Users.id], poliId, tanggal, 'booking', jamBooking, no, 'booking', keluhan, dibuat, '', '']);
    return JSON.stringify({ ok: true, antrian: {
      id, userId: String(user[COL.Users.id]), poliId,
      poliKode: poli.kode, poliNama: poli.nama,
      tanggal, jenis: 'booking', jamBooking, noAntrian: no,
      status: 'booking', keluhan,
      waktuDibuat: dibuat, waktuDipanggil: '', waktuSelesai: ''
    }});
  });
}

function createWalkIn(payload) {
  const user = requireAuth(String((payload && payload.token) || ''));
  const poliId = String((payload && payload.poliId) || '');
  const keluhan = String((payload && payload.keluhan) || '').trim().slice(0, 200);

  return withLock(() => {
    snapReset();
    const poli = getPoliById(poliId);
    if (!poli) throw new Error('Poli tidak ditemukan.');
    const today = todayStr();
    if (!isWeekday(today)) throw new Error('Layanan walk-in hanya tersedia pada hari kerja.');
    const now = currentHHmm();
    if (now < JAM_OPERASIONAL.mulai || now > JAM_OPERASIONAL.selesai) {
      throw new Error('Walk-in hanya dilayani pukul ' + JAM_OPERASIONAL.mulai + '–' + JAM_OPERASIONAL.selesai + '.');
    }
    if (getSisaKuota(poliId, today) <= 0) throw new Error('Kuota ' + poli.nama + ' hari ini sudah penuh.');
    if (!keluhan) throw new Error('Keluhan singkat wajib diisi.');

    const id = genId();
    const no = nextNoAntrian(poliId, today);
    const dibuat = nowIso();
    appendRowData(SHEET_ANTRIAN, [id, user[COL.Users.id], poliId, today, 'walkin', now, no, 'booking', keluhan, dibuat, '', '']);
    return JSON.stringify({ ok: true, antrian: {
      id, userId: String(user[COL.Users.id]), poliId,
      poliKode: poli.kode, poliNama: poli.nama,
      tanggal: today, jenis: 'walkin', jamBooking: now, noAntrian: no,
      status: 'booking', keluhan,
      waktuDibuat: dibuat, waktuDipanggil: '', waktuSelesai: ''
    }});
  });
}

function cancelBooking(payload) {
  snapReset();
  const user = requireAuth(String((payload && payload.token) || ''));
  const id = String((payload && payload.idAntrian) || '');
  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (String(row[COL.Antrian.user]) !== String(user[COL.Users.id])) throw new Error('Anda tidak berhak membatalkan antrian ini.');
  if (!['booking', 'checkin'].includes(String(row[COL.Antrian.status]))) {
    throw new Error('Antrian tidak dapat dibatalkan pada status ini.');
  }
  if (!isBookingChangeable(cellDateStr(row[COL.Antrian.tanggal]), cellHHmmStr(row[COL.Antrian.jam]))) {
    throw new Error('Pembatalan hanya bisa dilakukan minimal 2 jam sebelum jadwal.');
  }
  const values = row.slice();
  values[COL.Antrian.status] = 'batal';
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

function rescheduleBooking(payload) {
  snapReset();
  const user = requireAuth(String((payload && payload.token) || ''));
  const id = String((payload && payload.idAntrian) || '');
  const tanggal = String((payload && payload.tanggal) || '');
  const jamBooking = String((payload && payload.jamBooking) || '');

  const rowIdx = findRowIdx(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (rowIdx <= 1) throw new Error('Antrian tidak ditemukan.');
  const row = findRowByCol(SHEET_ANTRIAN, COL.Antrian.id, id);
  if (String(row[COL.Antrian.user]) !== String(user[COL.Users.id])) throw new Error('Anda tidak berhak menjadwalkan ulang antrian ini.');
  if (!isBookingChangeable(cellDateStr(row[COL.Antrian.tanggal]), cellHHmmStr(row[COL.Antrian.jam]))) {
    throw new Error('Penjadwalan ulang hanya bisa dilakukan minimal 2 jam sebelum jadwal.');
  }
  const poliId = String(row[COL.Antrian.poli]);
  if (!isWeekday(tanggal)) throw new Error('Tanggal baru harus hari kerja (Senin–Jumat).');
  const slots = getSlotsForDate(poliId, tanggal);
  if (slots.length === 0) throw new Error('Tidak ada jadwal dokter pada tanggal baru.');
  if (!slots.some(s => s.waktu === jamBooking)) throw new Error('Slot jam baru tidak tersedia.');
  if (getSisaKuota(poliId, tanggal) <= 0) throw new Error('Kuota poli penuh pada tanggal baru.');

  const oldTanggal = cellDateStr(row[COL.Antrian.tanggal]);
  const values = row.slice();
  values[COL.Antrian.tanggal] = tanggal;
  values[COL.Antrian.jam] = jamBooking;
  values[COL.Antrian.no] = oldTanggal === tanggal ? String(row[COL.Antrian.no]) : nextNoAntrian(poliId, tanggal);
  updateRowData(SHEET_ANTRIAN, rowIdx, values);
  return JSON.stringify({ ok: true });
}

/**
 * Dashboard pasien: user, booking aktif, booking berikutnya, riwayat kunjungan.
 */
function getPatientDashboard(payload) {
  snapReset();
  const user = requireAuth(String((payload && payload.token) || ''));
  const uid = String(user[COL.Users.id]);
  const today = todayStr();

  const all = snapRows(SHEET_ANTRIAN)
    .filter(r => String(r[COL.Antrian.user]) === uid)
    .map(mapAntrian);

  const active = all
    .filter(a => ['booking', 'checkin', 'dipanggil', 'diperiksa'].includes(a.status))
    .sort((a, b) => (a.tanggal + a.jamBooking).localeCompare(b.tanggal + b.jamBooking));

  const history = all
    .filter(a => ['selesai', 'batal'].includes(a.status))
    .sort((a, b) => String(b.waktuDibuat).localeCompare(String(a.waktuDibuat)))
    .slice(0, 30);

  return JSON.stringify({
    user: sanitizeUser(user),
    today,
    active,
    nextBooking: active[0] || null,
    history
  });
}

/**
 * Status antrian real-time pasien: posisi, nomor yang sedang dipanggil,
 * jumlah antrian di depan, total antrean.
 */
function getStatusAntrian(payload) {
  snapReset();
  const user = requireAuth(String((payload && payload.token) || ''));
  const uid = String(user[COL.Users.id]);
  const today = todayStr();

  const rows = snapRows(SHEET_ANTRIAN)
    .filter(r => String(r[COL.Antrian.user]) === uid);

  const results = rows.map(r => {
    const a = mapAntrian(r);
    if (['selesai', 'batal'].includes(a.status)) {
      return { ...a, posisi: null, totalDiAntrean: 0, sedangDipanggil: null, menungguDiDepan: 0 };
    }
    const same = getAntrianRowsFor(a.poliId, a.tanggal)
      .filter(x => String(x[COL.Antrian.status]) !== 'batal')
      .sort((x, y) => String(x[COL.Antrian.no]).localeCompare(String(y[COL.Antrian.no])));
    const myNo = a.noAntrian;
    const called = same.filter(x => ['dipanggil', 'diperiksa', 'selesai'].includes(String(x[COL.Antrian.status])));
    const sedang = called[called.length - 1] || null;
    const diDepan = same.filter(x =>
      ['booking', 'checkin'].includes(String(x[COL.Antrian.status])) &&
      String(x[COL.Antrian.no]).localeCompare(myNo) < 0
    ).length;
    const posisi = same.findIndex(x => String(x[COL.Antrian.no]) === myNo) + 1;
    return {
      ...a,
      posisi,
      totalDiAntrean: same.length,
      sedangDipanggil: sedang ? mapAntrian(sedang) : null,
      menungguDiDepan: diDepan
    };
  });

  return JSON.stringify({ today, antrian: results });
}
