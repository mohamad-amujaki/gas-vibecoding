Act as a Senior Full-Stack Developer & Google Apps Script (GAS) Specialist. Generate a production-ready, highly polished, single-file Google Apps Script Web Application for a "Student Pocket Money Tracker" (Pencatat Uang Saku Siswa).

Follow the exact technical and aesthetic specifications below for a ONE-SHOT generation.

======================================================================
1. ARCHITECTURE & GOOGLE APPS SCRIPT BACKEND (Code.gs)
======================================================================
- Single Web App deployment using HtmlService with HTML standard boilerplate.
- Google Sheets acts as the database. If the active spreadsheet does not have a sheet named "Transactions", automatically initialize it with columns:
  [ID | Date | Description | Amount | Type | Category | CreatedAt]
- Implement backend GAS functions:
  1. `doGet()`: Serves `Index.html` with evaluate/include capabilities and mobile viewport header (`<meta name="viewport" content="width=device-width, initial-scale=1.0">`).
  2. `getInitialData()`: Returns JSON containing total balance, full transaction list (sorted newest first), and 7-day category breakdown stats for the chart.
  3. `addTransaction(payload)`: Validates payload (amount > 0, required fields), appends row to Sheet with auto-generated ID & timestamp, and returns updated data context.

======================================================================
2. FRONTEND ARCHITECTURE & UX (Index.html)
======================================================================
- Single-page interface (SPA) fully responsive and mobile-first.
- Tech Stack: Vanilla JavaScript + Tailwind CSS (via CDN) + Chart.js (via CDN) + Lucide Icons (via CDN).
- NO external heavy UI frameworks or complex state libraries. Use asynchronous `google.script.run` calls.
- Smooth instant UI updates without full page reload.

======================================================================
3. DESIGN SYSTEM & VISUAL STYLE (Strict Anti-Slop Guidelines)
======================================================================
- NO generic glossy gradients, heavy cards, or childish emoji icons.
- Color Palette:
  * Primary Accent: #C98A2C (Mustard / Ochre)
  * Background: #F5F3EF (Warm Off-White/Gray)
  * Text Main: #3D3A35 (Warm Deep Charcoal)
  * Text Secondary / Muted: #78736B
  * Income Tag / Accent: Subtle muted green indicator (#2E7D32 / light tint background)
  * Expense Tag / Accent: Subtle muted red indicator (#C62828 / light tint background)
- Typography:
  * Google Fonts imports: "Fraunces" for headings/prominent numbers and "IBM Plex Sans" for UI body text.
- Icons: Use clean stroke line icons (Lucide icons: e.g., Utensils, Bus, PiggyBank, Folder, Plus, ArrowUpRight, ArrowDownRight). NO emoji (e.g., 🍔💰).

======================================================================
4. SCREEN STRUCTURE & INTERACTION SPECIFICATIONS
======================================================================
(A) Dashboard Header:
  - Big bold typography for current running balance using Fraunces font (e.g., "Rp 125.000").
  - Clean layout, no gradient cards, sharp readable contrast.

(B) Quick Add Transaction Form:
  - Input fields: Date (default today), Description, Amount (numeric input, positive validation), Type (Pemasukan / Pengeluaran toggle), Category dropdown (Jajan, Transport, Tabungan, Lainnya).
  - Submit interaction: Client-side validation -> optimistic UI append with 1-second soft background color transition highlight on the new row -> silent server sync via `google.script.run` -> update total balance instantly.

(C) Recent Transactions List:
  - Displays list sorted newest first.
  - Items formatted cleanly: Date | Description | Category Badge with Lucide Icon | Nominal formatted in IDR currency (e.g., Rp 15.000).

(D) Category Expense Chart (Last 7 Days):
  - Compact Chart.js doughnut or bar chart.
  - Bar/Segment colors strictly styled around the mustard/ochre (#C98A2C) palette and harmonious warm neutrals.
  - Filtered specifically for the last 7 days of expenses.

======================================================================
5. SCOPE BOUNDARY & CODE QUALITY REQUIREMENTS
======================================================================
- Single-user mode (reads/writes directly to the container Spreadsheet).
- Complete code generation: DO NOT leave placeholeders like `// implement later` or `/* CSS goes here */`.
- Provide code separated into clear blocks for `Code.gs` and `Index.html` (or inline HTML with embedded JS/CSS ready for Google Apps Script).

Generate the full runnable source code now.
