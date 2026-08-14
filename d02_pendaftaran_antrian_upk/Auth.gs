/**
 * Auth.gs — Registrasi, login, sesi, dan validasi autentikasi.
 * Password disimpan sebagai SHA-256(password + salt) — tidak pernah plaintext.
 */

function registerUser(payload) {
  snapReset();
  ensureInited();
  payload = payload || {};

  const nama = String(payload.nama || '').trim();
  const tipePasien = String(payload.tipePasien || '').trim();
  const identitas = String(payload.identitas || '').trim();
  const noHp = String(payload.noHp || '').trim();
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const email = String(payload.email || '').trim();
  const unitKerja = String(payload.unitKerja || '').trim();

  if (!nama) throw new Error('Nama lengkap wajib diisi.');
  if (!TIPE_PASIEN.includes(tipePasien)) throw new Error('Pilih tipe pasien terlebih dahulu.');
  if (!identitas) throw new Error('NIP/NIK wajib diisi.');
  if (!noHp) throw new Error('Nomor HP wajib diisi.');
  if (tipePasien === 'pegawai' && !unitKerja) throw new Error('Unit kerja wajib diisi untuk pegawai.');
  if (username.length < 3) throw new Error('Username minimal 3 karakter.');
  if (password.length < 6) throw new Error('Password minimal 6 karakter.');
  if (!/^\d{6,18}$/.test(identitas)) throw new Error('NIP/NIK harus berupa angka 6–18 digit.');

  const users = snapRows(SHEET_USERS);
  for (let i = 0; i < users.length; i++) {
    if (String(users[i][COL.Users.username]).toLowerCase() === username) {
      throw new Error('Username sudah terdaftar. Silakan login.');
    }
  }

  const id = genId();
  const salt = makeSalt();
  appendRowData(SHEET_USERS, [
    id, nama, email, username, hashPassword(password, salt), salt,
    'pasien', tipePasien, identitas, unitKerja, noHp, nowIso()
  ]);

  snapReset(); // baris baru belum ada di snapshot
  return createSession(id);
}

function loginUser(payload) {
  snapReset();
  ensureInited();
  payload = payload || {};

  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!username || !password) throw new Error('Username dan password wajib diisi.');

  const rows = snapRows(SHEET_USERS);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.Users.username]).toLowerCase() === username) {
      const salt = String(rows[i][COL.Users.salt]);
      const hash = hashPassword(password, salt);
      if (hash === String(rows[i][COL.Users.pass])) {
        return createSession(String(rows[i][COL.Users.id]));
      }
      throw new Error('Password yang dimasukkan salah.');
    }
  }
  throw new Error('Username tidak ditemukan.');
}

function logoutUser(payload) {
  snapReset();
  const token = String((payload && payload.token) || '');
  deleteRowByCol(SHEET_SESSIONS, COL.Session.token, token);
  try { CacheService.getScriptCache().remove(SESSION_CACHE_PREFIX + token); } catch (e) { /* abaikan */ }
  return JSON.stringify({ ok: true });
}

function validateSession(payload) {
  snapReset();
  ensureInited();
  const user = getSessionUser(String((payload && payload.token) || ''));
  if (!user) return JSON.stringify({ valid: false });
  return JSON.stringify({ valid: true, user: sanitizeUser(user) });
}

function getCurrentUser(payload) {
  snapReset();
  const user = requireAuth(String((payload && payload.token) || ''));
  return JSON.stringify({ user: sanitizeUser(user) });
}

// ---------------------------------------------------------------------------
// Internal session helpers
// ---------------------------------------------------------------------------

function createSession(userId) {
  cleanupExpiredSessions();
  const token = genId();
  const expiredAt = Date.now() + SESSION_DURATION_MS;
  const expiredStr = new Date(expiredAt).toISOString();
  appendRowData(SHEET_SESSIONS, [token, userId, expiredStr]);
  try {
    CacheService.getScriptCache().put(
      SESSION_CACHE_PREFIX + token,
      JSON.stringify({ uid: String(userId), exp: expiredAt }),
      21600
    );
  } catch (e) { /* cache gagal → fallback ke sheet */ }
  const user = getUserRowById(userId);
  return JSON.stringify({ token, user: sanitizeUser(user) });
}

function cleanupExpiredSessions() {
  const rows = snapRows(SHEET_SESSIONS);
  for (let i = rows.length - 1; i >= 0; i--) {
    const exp = new Date(String(rows[i][COL.Session.expired]));
    if (isNaN(exp.getTime()) || exp.getTime() < Date.now()) {
      deleteRowByCol(SHEET_SESSIONS, COL.Session.token, rows[i][COL.Session.token]);
    }
  }
}

function getSessionUser(token) {
  if (!token) return null;

  // Fast path: cache sesi (skip 2 baca full-sheet per request)
  const cached = CacheService.getScriptCache().get(SESSION_CACHE_PREFIX + token);
  if (cached) {
    try {
      const c = JSON.parse(cached);
      if (Date.now() < c.exp) return getUserRowById(c.uid);
    } catch (e) { /* cache korup → fallback ke sheet */ }
  }

  const rows = snapRows(SHEET_SESSIONS);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.Session.token]) === String(token)) {
      const exp = new Date(String(rows[i][COL.Session.expired]));
      if (isNaN(exp.getTime()) || exp.getTime() < Date.now()) {
        deleteRowByCol(SHEET_SESSIONS, COL.Session.token, token);
        return null;
      }
      try {
        CacheService.getScriptCache().put(
          SESSION_CACHE_PREFIX + token,
          JSON.stringify({ uid: String(rows[i][COL.Session.user]), exp: exp.getTime() }),
          21600
        );
      } catch (e) { /* abaikan */ }
      return getUserRowById(String(rows[i][COL.Session.user]));
    }
  }
  return null;
}

function requireAuth(token) {
  const user = getSessionUser(token);
  if (!user) throw new Error('Sesi berakhir atau tidak valid. Silakan login kembali.');
  return user;
}

function requireRole(token, roles) {
  const user = requireAuth(token);
  const role = String(user[COL.Users.role] || '').trim().toLowerCase();
  if (!roles.includes(role)) throw new Error('Anda tidak memiliki akses ke fitur ini.');
  return user;
}

function sanitizeUser(user) {
  return {
    id: String(user[COL.Users.id]),
    nama: String(user[COL.Users.nama] || ''),
    email: String(user[COL.Users.email] || ''),
    username: String(user[COL.Users.username] || ''),
    role: String(user[COL.Users.role] || 'pasien'),
    tipePasien: String(user[COL.Users.tipe] || ''),
    identitas: String(user[COL.Users.identitas] || ''),
    unitKerja: String(user[COL.Users.unit] || ''),
    noHp: String(user[COL.Users.hp] || '')
  };
}
