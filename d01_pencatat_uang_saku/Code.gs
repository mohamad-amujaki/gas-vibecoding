/**
 * Student Pocket Money Tracker (Pencatat Uang Saku Siswa)
 * Backend Script - Code.gs
 */

const SHEET_USERS = 'Users';
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_CATEGORIES = 'Categories';

/**
 * Serves the main Web Application interface.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Student Pocket Money Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Modular template file inclusion helper.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Ensures all required sheets (Users, Transactions, Categories) exist in the Spreadsheet.
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Users Sheet
  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_USERS);
    usersSheet.appendRow(['UserID', 'Username', 'PasswordHash', 'CreatedAt']);
    styleHeaderRow(usersSheet, 4);
  }

  // 2. Transactions Sheet
  let txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) {
    txSheet = ss.insertSheet(SHEET_TRANSACTIONS);
    txSheet.appendRow(['ID', 'UserID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'CreatedAt']);
    styleHeaderRow(txSheet, 8);
  }

  // 3. Categories Sheet
  let catSheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!catSheet) {
    catSheet = ss.insertSheet(SHEET_CATEGORIES);
    catSheet.appendRow(['CategoryID', 'UserID', 'Name', 'Type', 'IconName']);
    styleHeaderRow(catSheet, 5);
  }
}

function styleHeaderRow(sheet, numCols) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#F5F3EF');
  headerRange.setFontColor('#3D3A35');
  sheet.setFrozenRows(1);
}

/**
 * Utility: Computes SHA-256 hash for password authentication.
 */
function hashPassword(password) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password),
    Utilities.Charset.UTF_8
  );
  return digest.map(byte => {
    const v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/**
 * Seeds default categories for a user if they have none.
 */
function seedDefaultCategories(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName(SHEET_CATEGORIES);
  const defaultCategories = [
    ['Jajan', 'Pengeluaran', 'utensils'],
    ['Transport', 'Pengeluaran', 'bus'],
    ['Tabungan', 'Pemasukan', 'piggy-bank'],
    ['Lainnya', 'Pengeluaran', 'folder']
  ];

  defaultCategories.forEach((cat, index) => {
    const catId = 'CAT-' + Date.now() + '-' + index;
    catSheet.appendRow([catId, userId, cat[0], cat[1], cat[2]]);
  });
}

/**
 * Registers a new user and populates default categories.
 */
function registerUser(payload) {
  initSheets();

  if (!payload || !payload.username || !payload.password) {
    throw new Error('Username dan password wajib diisi');
  }

  const username = String(payload.username).trim().toLowerCase();
  const password = String(payload.password).trim();

  if (username.length < 3) {
    throw new Error('Username minimal 3 karakter');
  }
  if (password.length < 4) {
    throw new Error('Password minimal 4 karakter');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const usersData = usersSheet.getDataRange().getValues();

  for (let i = 1; i < usersData.length; i++) {
    if (String(usersData[i][1]).toLowerCase() === username) {
      throw new Error('Username sudah terdaftar! Silakan login.');
    }
  }

  const userId = 'USER-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  usersSheet.appendRow([userId, username, passwordHash, createdAt]);
  seedDefaultCategories(userId);

  return { userId, username };
}

/**
 * Authenticates a user by username and password.
 */
function loginUser(payload) {
  initSheets();

  if (!payload || !payload.username || !payload.password) {
    throw new Error('Username dan password wajib diisi');
  }

  const username = String(payload.username).trim().toLowerCase();
  const password = String(payload.password).trim();
  const passwordHash = hashPassword(password);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const usersData = usersSheet.getDataRange().getValues();

  for (let i = 1; i < usersData.length; i++) {
    const [storedUserId, storedUsername, storedHash] = usersData[i];
    if (String(storedUsername).toLowerCase() === username) {
      if (storedHash === passwordHash) {
        return { userId: String(storedUserId), username: String(storedUsername) };
      } else {
        throw new Error('Password yang dimasukkan salah.');
      }
    }
  }

  throw new Error('Username tidak ditemukan. Silakan daftar terlebih dahulu.');
}

/**
 * Fetches user-scoped initial data: balance, transactions, categories, and 7-day chart stats.
 */
function getInitialDataForUser(userId) {
  initSheets();

  if (!userId) {
    throw new Error('Sesi pengguna tidak valid');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName(SHEET_CATEGORIES);
  const catRows = catSheet.getDataRange().getValues().slice(1);

  // Resilient category matching: match UserID or unassigned/empty rows
  let categories = catRows
    .filter(row => {
      const rowUserId = String(row[1] || '').trim();
      return rowUserId === String(userId).trim() || rowUserId === '';
    })
    .map(row => ({
      id: String(row[0] || ''),
      name: String(row[2] || '').trim(),
      type: String(row[3] || '').trim(),
      iconName: String(row[4] || 'folder').trim().toLowerCase()
    }));

  // Auto-seed if user has no categories in DB
  if (categories.length === 0) {
    seedDefaultCategories(userId);
    const freshCatRows = catSheet.getDataRange().getValues().slice(1);
    categories = freshCatRows
      .filter(row => String(row[1] || '').trim() === String(userId).trim())
      .map(row => ({
        id: String(row[0] || ''),
        name: String(row[2] || '').trim(),
        type: String(row[3] || '').trim(),
        iconName: String(row[4] || 'folder').trim().toLowerCase()
      }));
  }

  // 2. Fetch Transactions for User
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  const txRows = txSheet.getDataRange().getValues().slice(1);

  let totalBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  const userTransactions = [];

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const categoryTotals = {};

  txRows.forEach(row => {
    const [id, rowUserId, dateStr, description, amountRaw, type, category, createdAt] = row;

    // Match UserID or fallback for legacy single-user rows
    if (String(rowUserId || '').trim() === String(userId).trim() || String(rowUserId || '').trim() === '') {
      const amount = Number(amountRaw) || 0;
      const txType = String(type || '').trim();

      if (txType === 'Pemasukan') {
        totalBalance += amount;
        totalIncome += amount;
      } else if (txType === 'Pengeluaran') {
        totalBalance -= amount;
        totalExpense += amount;
      }

      let dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      const formattedDate = formatDateStandard(dateObj);
      const createdAtIso = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

      userTransactions.push({
        id: String(id),
        date: formattedDate,
        description: String(description || '').trim(),
        amount: amount,
        type: txType,
        category: String(category || '').trim(),
        createdAt: createdAtIso
      });

      if (txType === 'Pengeluaran') {
        if (dateObj >= sevenDaysAgo && dateObj <= today) {
          const catKey = String(category || 'Lainnya').trim();
          categoryTotals[catKey] = (categoryTotals[catKey] || 0) + amount;
        }
      }
    }
  });

  userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const chartLabels = Object.keys(categoryTotals);
  const chartDataValues = Object.values(categoryTotals);

  const colorMap = {
    'Jajan': '#C98A2C',
    'Transport': '#A66E1E',
    'Tabungan': '#E6B86A',
    'Lainnya': '#8C857B'
  };

  const chartColors = chartLabels.map(label => colorMap[label] || '#C98A2C');

  return JSON.stringify({
    totalBalance,
    totalIncome,
    totalExpense,
    transactions: userTransactions,
    categories,
    chartData: {
      labels: chartLabels,
      data: chartDataValues,
      colors: chartColors
    }
  });
}

/**
 * Appends a new user-scoped transaction.
 */
function addTransactionForUser(payload) {
  if (!payload || !payload.userId) {
    throw new Error('Sesi pengguna tidak ditemukan');
  }

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Nominal harus angka positif lebih besar dari 0');
  }

  if (!payload.description || !String(payload.description).trim()) {
    throw new Error('Deskripsi transaksi tidak boleh kosong');
  }

  if (!payload.type || !['Pemasukan', 'Pengeluaran'].includes(payload.type)) {
    throw new Error('Tipe transaksi harus Pemasukan atau Pengeluaran');
  }

  if (!payload.category || !String(payload.category).trim()) {
    throw new Error('Kategori transaksi wajib dipilih');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);

  const id = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const createdAt = new Date().toISOString();

  let txDate = payload.date ? new Date(payload.date) : new Date();
  if (isNaN(txDate.getTime())) {
    txDate = new Date();
  }

  txSheet.appendRow([
    id,
    payload.userId,
    formatDateStandard(txDate),
    String(payload.description).trim(),
    amount,
    payload.type,
    String(payload.category).trim(),
    createdAt
  ]);

  return getInitialDataForUser(payload.userId);
}

/**
 * Adds a new custom category for the user.
 */
function addCategoryForUser(payload) {
  if (!payload || !payload.userId) {
    throw new Error('Sesi pengguna tidak valid');
  }
  if (!payload.name || !String(payload.name).trim()) {
    throw new Error('Nama kategori wajib diisi');
  }
  if (!payload.type || !['Pemasukan', 'Pengeluaran'].includes(payload.type)) {
    throw new Error('Tipe kategori tidak valid');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName(SHEET_CATEGORIES);
  const catId = 'CAT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const iconName = payload.iconName ? String(payload.iconName).trim().toLowerCase() : 'folder';

  catSheet.appendRow([catId, payload.userId, String(payload.name).trim(), payload.type, iconName]);

  return getInitialDataForUser(payload.userId);
}

/**
 * Deletes a category for the user.
 */
function deleteCategoryForUser(payload) {
  if (!payload || !payload.userId || !payload.categoryId) {
    throw new Error('Parameter hapus kategori tidak valid');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName(SHEET_CATEGORIES);
  const data = catSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.categoryId)) {
      catSheet.deleteRow(i + 1);
      break;
    }
  }

  return getInitialDataForUser(payload.userId);
}

function formatDateStandard(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
