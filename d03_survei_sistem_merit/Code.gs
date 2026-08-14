/**
 * SURVEI KESIAPAN MATURITAS SISTEM MERIT 2026
 * Code.gs — Backend utama (routing web app, simpan jawaban, upload bukti, admin API)
 *
 * Struktur Google Sheet yang dibutuhkan (dibuat otomatis oleh initializeSpreadsheet()):
 *  - Responses      : jawaban per pertanyaan per user (auto-save & submit)
 *  - Submissions     : status pengisian per user/instansi (progress, submitted_at)
 *  - Evidence        : log file bukti dukung yang diunggah
 *  - Admins          : daftar email admin Kemenkes
 *  - Organisasi      : daftar instansi terdaftar (opsional, untuk dropdown/lookup)
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web app
 *  - Execute as: Me
 *  - Who has access: Anyone within organization (atau sesuai kebijakan Kemenkes)
 */

// ============================================================
// KONFIGURASI
// ============================================================
const SHEET_RESPONSES   = 'Responses';
const SHEET_SUBMISSIONS = 'Submissions';
const SHEET_EVIDENCE    = 'Evidence';
const SHEET_ADMINS      = 'Admins';
const SHEET_ORG         = 'Organisasi';

const DRIVE_ROOT_FOLDER_NAME = 'Bukti Dukung - Survei Maturitas Sistem Merit 2026';

const SURVEY_META = {
  title: 'Survei Kesiapan Maturitas Sistem Merit Tahun 2026',
  description: 'Survei Kesiapan Maturitas Sistem Merit bertujuan untuk mengetahui tingkat kesiapan Instansi Pemerintah dalam menerapkan sistem merit berdasarkan bukti dukung yang diunggah.',
  periodeMulai: '2026-08-05',
  periodeSelesai: '2026-09-17',
};

// ============================================================
// WEB APP ENTRY POINT
// ============================================================
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'form';
  const template = HtmlService.createTemplateFromFile('index');
  template.initialPage = page;
  return template.evaluate()
    .setTitle(SURVEY_META.title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Dipakai untuk include CSS/JS terpisah jika dipecah, saat ini index.html single-file.
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// IDENTITAS USER
// ============================================================
function getCurrentUser() {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  if (!email) {
    throw new Error('Tidak dapat mengidentifikasi user. Pastikan Anda login dengan akun Google yang diizinkan.');
  }
  const org = lookupOrganisasi_(email);
  return {
    email: email,
    name: org.nama || email.split('@')[0],
    organisasi: org.organisasi || '(Belum diset - lihat sheet Organisasi)',
    isAdmin: isAdminUser_(email),
  };
}

// ============================================================
// QUESTION BANK
// ============================================================
function getQuestionBank() {
  return QUESTION_BANK;
}

function getSurveyMeta() {
  return SURVEY_META;
}

// ============================================================
// AUTOSAVE & DRAFT
// ============================================================

/**
 * Simpan satu jawaban (dipanggil oleh autosave setiap 30 detik / saat pindah pertanyaan)
 * payload: {questionId, aspectNo, score, evidenceNote, evidenceFileIds:[...]}
 */
function saveAnswer(payload) {
  const user = getCurrentUser();
  const sheet = getOrCreateSheet_(SHEET_RESPONSES, [
    'user_email', 'organisasi', 'question_id', 'aspect_no', 'score', 'score_label',
    'evidence_note', 'evidence_file_ids', 'evidence_file_names', 'updated_at'
  ]);

  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const emailCol = headerRow.indexOf('user_email');
  const qCol = headerRow.indexOf('question_id');

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === user.email && data[i][qCol] === payload.questionId) {
      rowIndex = i + 1; // 1-indexed sheet row
      break;
    }
  }

  const question = findQuestion_(payload.questionId);
  const scoreLabel = question ? scoreLabelFor_(question, payload.score) : '';

  const rowValues = [
    user.email,
    user.organisasi,
    payload.questionId,
    payload.aspectNo,
    payload.score,
    scoreLabel,
    payload.evidenceNote || '',
    (payload.evidenceFileIds || []).join(','),
    (payload.evidenceFileNames || []).join(','),
    new Date(),
  ];

  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }

  updateSubmissionProgress_(user);
  return { ok: true, savedAt: new Date().toISOString() };
}

/**
 * Muat draft jawaban milik user saat form dibuka / resume.
 */
function loadDraft() {
  const user = getCurrentUser();
  const sheet = getOrCreateSheet_(SHEET_RESPONSES, [
    'user_email', 'organisasi', 'question_id', 'aspect_no', 'score', 'score_label',
    'evidence_note', 'evidence_file_ids', 'evidence_file_names', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const idx = {};
  headerRow.forEach((h, i) => idx[h] = i);

  const answers = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.user_email] === user.email) {
      answers[row[idx.question_id]] = {
        score: row[idx.score],
        evidenceNote: row[idx.evidence_note],
        evidenceFileIds: row[idx.evidence_file_ids] ? String(row[idx.evidence_file_ids]).split(',').filter(Boolean) : [],
        evidenceFileNames: row[idx.evidence_file_names] ? String(row[idx.evidence_file_names]).split(',').filter(Boolean) : [],
      };
    }
  }

  const submission = getSubmissionRow_(user.email);
  return {
    user: user,
    answers: answers,
    status: submission ? submission.status : 'draft',
    submittedAt: submission ? submission.submittedAt : null,
  };
}

/**
 * Submit akhir — kunci status jadi 'submitted'. Validasi semua pertanyaan wajib sudah terjawab.
 */
function submitForm() {
  const user = getCurrentUser();
  const draft = loadDraft();
  const requiredQuestions = flattenQuestions_().filter(q => isQuestionApplicable_(q, draft.answers));

  const missing = requiredQuestions.filter(q => {
    const ans = draft.answers[q.id];
    if (!ans || ans.score === '' || ans.score === undefined || ans.score === null) return true;
    if (q.evidenceRequired && (!ans.evidenceFileIds || ans.evidenceFileIds.length === 0)) return true;
    return false;
  });

  if (missing.length > 0) {
    return {
      ok: false,
      message: 'Masih ada ' + missing.length + ' pertanyaan yang belum lengkap (jawaban dan/atau bukti dukung wajib).',
      missingIds: missing.map(q => q.id),
    };
  }

  const sheet = getOrCreateSheet_(SHEET_SUBMISSIONS, [
    'user_email', 'organisasi', 'status', 'progress_percent', 'submitted_at', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const emailCol = headerRow.indexOf('user_email');
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === user.email) { rowIndex = i + 1; break; }
  }
  const now = new Date();
  const rowValues = [user.email, user.organisasi, 'submitted', 100, now, now];
  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return { ok: true, message: 'Survei berhasil dikirim. Terima kasih atas partisipasi Anda.' };
}

function updateSubmissionProgress_(user) {
  const applicable = flattenQuestions_(); // recompute against latest answers below
  const draft = loadDraft();
  const applicableQ = flattenQuestions_().filter(q => isQuestionApplicable_(q, draft.answers));
  const answered = applicableQ.filter(q => {
    const a = draft.answers[q.id];
    return a && a.score !== '' && a.score !== undefined && a.score !== null;
  });
  const percent = applicableQ.length ? Math.round((answered.length / applicableQ.length) * 100) : 0;

  const sheet = getOrCreateSheet_(SHEET_SUBMISSIONS, [
    'user_email', 'organisasi', 'status', 'progress_percent', 'submitted_at', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const emailCol = headerRow.indexOf('user_email');
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === user.email) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) {
    sheet.appendRow([user.email, user.organisasi, 'draft', percent, '', new Date()]);
  } else {
    const statusCol = headerRow.indexOf('status');
    const currentStatus = data[rowIndex - 1][statusCol] || 'draft';
    sheet.getRange(rowIndex, 4, 1, 1).setValue(percent); // progress_percent
    sheet.getRange(rowIndex, 6, 1, 1).setValue(new Date()); // updated_at
    if (currentStatus !== 'submitted') {
      sheet.getRange(rowIndex, 3, 1, 1).setValue('draft');
    }
  }
}

function getSubmissionRow_(email) {
  const sheet = getOrCreateSheet_(SHEET_SUBMISSIONS, [
    'user_email', 'organisasi', 'status', 'progress_percent', 'submitted_at', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const idx = {};
  headerRow.forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.user_email] === email) {
      return {
        status: data[i][idx.status],
        progressPercent: data[i][idx.progress_percent],
        submittedAt: data[i][idx.submitted_at],
      };
    }
  }
  return null;
}

// ============================================================
// UPLOAD BUKTI DUKUNG (FILE -> GOOGLE DRIVE)
// ============================================================

/**
 * fileData: { filename, mimeType, base64Data, questionId }
 * Menyimpan ke folder: Root / <Organisasi> / <Email User> / <QuestionId - Nama File>
 */
function uploadEvidence(fileData) {
  const user = getCurrentUser();
  const maxBytes = 25 * 1024 * 1024; // 25MB, selaras dengan referensi UI Kemenkes
  const decoded = Utilities.base64Decode(fileData.base64Data);
  if (decoded.length > maxBytes) {
    return { ok: false, message: 'Ukuran file melebihi batas 25MB.' };
  }

  const blob = Utilities.newBlob(decoded, fileData.mimeType, fileData.filename);
  const folder = getUserEvidenceFolder_(user.organisasi, user.email);
  const file = folder.createFile(blob);
  file.setDescription('Bukti dukung untuk pertanyaan ' + fileData.questionId + ' — diunggah oleh ' + user.email);

  logEvidence_(user, fileData.questionId, file);

  return {
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl(),
  };
}

function deleteEvidence(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function logEvidence_(user, questionId, file) {
  const sheet = getOrCreateSheet_(SHEET_EVIDENCE, [
    'user_email', 'organisasi', 'question_id', 'file_id', 'file_name', 'file_url', 'uploaded_at'
  ]);
  sheet.appendRow([
    user.email, user.organisasi, questionId, file.getId(), file.getName(), file.getUrl(), new Date()
  ]);
}

// ============================================================
// ADMIN DASHBOARD API
// ============================================================

function adminGetAllSubmissions() {
  requireAdmin_();
  const sheet = getOrCreateSheet_(SHEET_SUBMISSIONS, [
    'user_email', 'organisasi', 'status', 'progress_percent', 'submitted_at', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data.shift();
  const idx = {};
  headerRow.forEach((h, i) => idx[h] = i);
  return data.map(row => ({
    email: row[idx.user_email],
    organisasi: row[idx.organisasi],
    status: row[idx.status],
    progressPercent: row[idx.progress_percent],
    submittedAt: row[idx.submitted_at] ? new Date(row[idx.submitted_at]).toISOString() : null,
    updatedAt: row[idx.updated_at] ? new Date(row[idx.updated_at]).toISOString() : null,
  }));
}

function adminGetSubmissionDetail(email) {
  requireAdmin_();
  const sheet = getOrCreateSheet_(SHEET_RESPONSES, [
    'user_email', 'organisasi', 'question_id', 'aspect_no', 'score', 'score_label',
    'evidence_note', 'evidence_file_ids', 'evidence_file_names', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data.shift();
  const idx = {};
  headerRow.forEach((h, i) => idx[h] = i);

  const answers = data.filter(row => row[idx.user_email] === email).map(row => ({
    questionId: row[idx.question_id],
    aspectNo: row[idx.aspect_no],
    score: row[idx.score],
    scoreLabel: row[idx.score_label],
    evidenceNote: row[idx.evidence_note],
    evidenceFileNames: row[idx.evidence_file_names],
    updatedAt: row[idx.updated_at] ? new Date(row[idx.updated_at]).toISOString() : null,
  }));

  return {
    answers: answers,
    aspectScores: computeAspectScores_(answers),
  };
}

function adminExportToSheet() {
  requireAdmin_();
  const ss = SpreadsheetApp.getActive();
  const src = getOrCreateSheet_(SHEET_RESPONSES, []);
  const exportName = 'Export_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  const copy = src.copyTo(ss);
  copy.setName(exportName);
  return { ok: true, sheetName: exportName };
}

function computeAspectScores_(answers) {
  const grouped = {};
  answers.forEach(a => {
    if (!grouped[a.aspectNo]) grouped[a.aspectNo] = [];
    if (typeof a.score === 'number') grouped[a.aspectNo].push(a.score);
  });
  const result = {};
  Object.keys(grouped).forEach(aspectNo => {
    const scores = grouped[aspectNo];
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    result[aspectNo] = Math.round(avg * 100) / 100;
  });
  return result;
}

function requireAdmin_() {
  const email = Session.getActiveUser().getEmail();
  if (!isAdminUser_(email)) {
    throw new Error('Akses ditolak. Halaman ini khusus admin Kemenkes.');
  }
}

function isAdminUser_(email) {
  const sheet = getOrCreateSheet_(SHEET_ADMINS, ['email']);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) return true;
  }
  return false;
}

function lookupOrganisasi_(email) {
  const sheet = getOrCreateSheet_(SHEET_ORG, ['email', 'nama', 'organisasi']);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
      return { nama: data[i][1], organisasi: data[i][2] };
    }
  }
  return { nama: '', organisasi: '' };
}

// ============================================================
// BAGIAN 9 — PROFILING PENGHARGAAN (tidak memengaruhi skor)
// ============================================================
function getProfilingSection() {
  return PROFILING_SECTION;
}

function saveProfiling(payload) {
  const user = getCurrentUser();
  const sheet = getOrCreateSheet_('Profiling', [
    'user_email', 'organisasi', 'pernah_menerima', 'nama_penghargaan',
    'penerima', 'tahun', 'penyelenggara', 'evidence_file_ids', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const emailCol = headerRow.indexOf('user_email');
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === user.email) { rowIndex = i + 1; break; }
  }
  const rowValues = [
    user.email, user.organisasi, payload.pernahMenerima,
    payload.namaPenghargaan || '', payload.penerima || '', payload.tahun || '',
    payload.penyelenggara || '', (payload.evidenceFileIds || []).join(','), new Date(),
  ];
  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }
  return { ok: true };
}

function loadProfilingDraft() {
  const user = getCurrentUser();
  const sheet = getOrCreateSheet_('Profiling', [
    'user_email', 'organisasi', 'pernah_menerima', 'nama_penghargaan',
    'penerima', 'tahun', 'penyelenggara', 'evidence_file_ids', 'updated_at'
  ]);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const idx = {};
  headerRow.forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.user_email] === user.email) {
      return {
        pernahMenerima: data[i][idx.pernah_menerima],
        namaPenghargaan: data[i][idx.nama_penghargaan],
        penerima: data[i][idx.penerima],
        tahun: data[i][idx.tahun],
        penyelenggara: data[i][idx.penyelenggara],
      };
    }
  }
  return null;
}

// ============================================================
// SETUP AWAL — jalankan sekali dari editor Apps Script
// ============================================================
function initializeSpreadsheet() {
  getOrCreateSheet_(SHEET_RESPONSES, [
    'user_email', 'organisasi', 'question_id', 'aspect_no', 'score', 'score_label',
    'evidence_note', 'evidence_file_ids', 'evidence_file_names', 'updated_at'
  ]);
  getOrCreateSheet_(SHEET_SUBMISSIONS, [
    'user_email', 'organisasi', 'status', 'progress_percent', 'submitted_at', 'updated_at'
  ]);
  getOrCreateSheet_(SHEET_EVIDENCE, [
    'user_email', 'organisasi', 'question_id', 'file_id', 'file_name', 'file_url', 'uploaded_at'
  ]);
  getOrCreateSheet_(SHEET_ADMINS, ['email']);
  getOrCreateSheet_(SHEET_ORG, ['email', 'nama', 'organisasi']);
  getOrCreateRootDriveFolder_();
  SpreadsheetApp.getUi().alert('Setup selesai. Sheet dan folder Drive sudah dibuat.');
}
