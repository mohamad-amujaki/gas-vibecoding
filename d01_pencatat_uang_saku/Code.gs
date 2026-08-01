/**
 * Student Pocket Money Tracker (Pencatat Uang Saku Siswa)
 * Backend Script - Code.gs
 *
 * Features:
 * - Serves Index.html with evaluate/include capabilities and mobile viewport header.
 * - Initializes and manages Google Sheets database ("Transactions").
 * - Returns initial data context (balance, sorted transactions, 7-day category breakdown).
 * - Validates and appends new transactions safely.
 */

const SHEET_NAME = 'Transactions';

/**
 * Serves the HTML web app interface.
 */
function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Pencatat Uang Saku Siswa')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Gets or initializes the 'Transactions' sheet in the active spreadsheet.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Initialize header row
    const headers = ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'CreatedAt'];
    sheet.appendRow(headers);

    // Style header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#F5F3EF');
    headerRange.setFontColor('#3D3A35');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Fetches all initial data: total balance, sorted transactions (newest first),
 * and last 7 days category breakdown for chart visualization.
 *
 * @returns {string} JSON string containing balance, transactions, and chartData
 */
function getInitialData() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return JSON.stringify({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        transactions: [],
        chartData: { labels: [], data: [], colors: [] }
      });
    }

    const rows = data.slice(1); // Omit header row
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    const transactions = [];

    // Calculate dates for last 7 days window (inclusive of today)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const categoryTotals = {};

    rows.forEach(row => {
      const [id, dateStr, description, amountRaw, type, category, createdAt] = row;
      const amount = Number(amountRaw) || 0;

      if (type === 'Pemasukan') {
        totalBalance += amount;
        totalIncome += amount;
      } else if (type === 'Pengeluaran') {
        totalBalance -= amount;
        totalExpense += amount;
      }

      // Parse date safely
      let dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      const formattedDate = formatDateStandard(dateObj);
      const createdAtIso = createdAt ? (new Date(createdAt).toISOString()) : new Date().toISOString();

      transactions.push({
        id: String(id),
        date: formattedDate,
        rawDate: dateObj.toISOString(),
        description: String(description),
        amount: amount,
        type: String(type),
        category: String(category),
        createdAt: createdAtIso
      });

      // Aggregate category expenses for the last 7 days
      if (type === 'Pengeluaran') {
        if (dateObj >= sevenDaysAgo && dateObj <= today) {
          const catKey = String(category || 'Lainnya').trim();
          categoryTotals[catKey] = (categoryTotals[catKey] || 0) + amount;
        }
      }
    });

    // Sort transactions by creation time descending (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Prepare chart data format
    const chartLabels = Object.keys(categoryTotals);
    const chartDataValues = Object.values(categoryTotals);

    // Warm Ochre/Mustard palette mapping for category colors
    const colorMap = {
      'Jajan': '#C98A2C',      // Mustard / Primary Accent
      'Transport': '#A66E1E',  // Darker Warm Ochre
      'Tabungan': '#E6B86A',   // Light Warm Amber
      'Lainnya': '#8C857B'     // Muted Warm Gray
    };

    const chartColors = chartLabels.map(label => colorMap[label] || '#C98A2C');

    return JSON.stringify({
      totalBalance,
      totalIncome,
      totalExpense,
      transactions,
      chartData: {
        labels: chartLabels,
        data: chartDataValues,
        colors: chartColors
      }
    });

  } catch (error) {
    throw new Error('Gagal mengambil data dari Spreadsheet: ' + error.message);
  }
}

/**
 * Validates payload and appends a new transaction to the Sheet.
 * Returns the fresh full initial data state.
 *
 * @param {Object} payload { date, description, amount, type, category }
 * @returns {string} JSON string of updated data state
 */
function addTransaction(payload) {
  try {
    if (!payload) {
      throw new Error('Payload transaksi tidak valid');
    }

    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal harus berupa angka lebih besar dari 0');
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

    const sheet = getOrCreateSheet();
    const id = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const createdAt = new Date();

    // Parse date payload safely
    let txDate = payload.date ? new Date(payload.date) : new Date();
    if (isNaN(txDate.getTime())) {
      txDate = new Date();
    }

    const formattedTxDate = formatDateStandard(txDate);

    sheet.appendRow([
      id,
      formattedTxDate,
      String(payload.description).trim(),
      amount,
      payload.type,
      String(payload.category).trim(),
      createdAt
    ]);

    // Return refreshed database state to client
    return getInitialData();

  } catch (error) {
    throw new Error('Gagal menambahkan transaksi: ' + error.message);
  }
}

/**
 * Helper to convert Date object into YYYY-MM-DD standard format
 */
function formatDateStandard(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
