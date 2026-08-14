/**
 * Utilities.gs — Helper functions: sheet management, Drive folder management,
 * question-bank lookups, dan logging.
 */

// ============================================================
// SHEET HELPERS
// ============================================================
function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e56c9').setFontColor('#ffffff');
    }
  } else if (headers && headers.length && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
// DRIVE FOLDER HELPERS
// ============================================================
function getOrCreateRootDriveFolder_() {
  const it = DriveApp.getFoldersByName(DRIVE_ROOT_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(DRIVE_ROOT_FOLDER_NAME);
}

function getOrCreateSubfolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

/**
 * Struktur folder: Root / <Organisasi> / <Email User>
 */
function getUserEvidenceFolder_(organisasi, email) {
  const root = getOrCreateRootDriveFolder_();
  const orgFolder = getOrCreateSubfolder_(root, organisasi || 'Tanpa Organisasi');
  const userFolder = getOrCreateSubfolder_(orgFolder, email);
  return userFolder;
}

// ============================================================
// QUESTION BANK LOOKUP HELPERS
// ============================================================

/**
 * Kembalikan seluruh pertanyaan (flatten dari 8 aspek + bagian profiling)
 * sebagai array datar untuk validasi/progress.
 */
function flattenQuestions_() {
  const all = [];
  QUESTION_BANK.forEach(aspect => {
    aspect.questions.forEach(q => {
      all.push(Object.assign({ aspectNo: aspect.no, aspectTitle: aspect.title }, q));
    });
  });
  return all;
}

function findQuestion_(questionId) {
  const all = flattenQuestions_();
  return all.find(q => q.id === questionId) || null;
}

function scoreLabelFor_(question, score) {
  if (!question || !question.options) return '';
  const opt = question.options.find(o => String(o.value) === String(score));
  return opt ? opt.label : '';
}

/**
 * Sebagian pertanyaan bersifat kondisional (routing), misalnya:
 * - Pertanyaan TPP hanya relevan untuk Pemerintah Provinsi/Kab-Kota
 * - Pertanyaan Jaminan Kecelakaan/Kematian hanya lanjut jika jawaban pembuka = "Ya"
 * Fungsi ini mengecek apakah pertanyaan wajib ditampilkan/divalidasi
 * berdasarkan jawaban yang sudah ada (answers: {questionId: {score,...}}).
 */
function isQuestionApplicable_(question, answers) {
  if (!question.dependsOn) return true;
  const dep = answers[question.dependsOn.questionId];
  if (!dep) return false;
  const depScore = dep.score;
  return question.dependsOn.values.map(String).indexOf(String(depScore)) !== -1;
}

// ============================================================
// LOGGING
// ============================================================
function logAction_(action, detail) {
  try {
    const sheet = getOrCreateSheet_('Logs', ['timestamp', 'user', 'action', 'detail']);
    sheet.appendRow([new Date(), Session.getActiveUser().getEmail(), action, JSON.stringify(detail || {})]);
  } catch (e) {
    // Logging tidak boleh menghentikan proses utama
  }
}
