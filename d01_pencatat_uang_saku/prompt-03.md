2. Visual Identity & Anti-Slop Guidelines
Strictly follow these visual identity guidelines to ensure a modern, tactile, and non-generic user interface:

Anti-Slop Rules: NO glossy cards, heavy gradients, neon accents, or childish emoji icons.

Color Palette:

Background (Neutral): #F5F3EF (Warm Off-White)

Main Text: #3D3A35 (Warm Deep Charcoal)

Muted Text: #78736B

Primary Accent: #C98A2C (Mustard / Ochre)

Income Indicator: #2E7D32 (Subtle muted green tint)

Expense Indicator: #C62828 (Subtle muted red tint)

Typography:

Headings & Large Balances: Fraunces (Google Fonts)

UI Body & Form Inputs: IBM Plex Sans (Google Fonts)

Iconography: Clean stroke line icons via Lucide Icons CDN (data-lucide attributes). Call lucide.createIcons() after every dynamic DOM update. Strictly NO EMOJI (e.g., 🍔, 💰).

🔐 3. Authentication & Multi-User Isolation
Auth State Management:

Store activeUserId and activeUsername in localStorage.

Display an Auth Modal Popup overlay on initial load if activeUserId is missing.

Auth Modes: Toggle between "Daftar" (Register) and "Masuk" (Login).

Fields: Username/Email and Password.

Server Logic: Use Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password) for basic password hashing before saving to Sheet.

Database Schema (Google Sheets):

Automatically initialize the active spreadsheet with these three sheets if missing:

Users: [UserID | Username | PasswordHash | CreatedAt]

Transactions: [ID | UserID | Date | Description | Amount | Type | Category | CreatedAt]

Categories: [CategoryID | UserID | Name | Type | IconName]

Data Isolation: All transaction fetches, category reads, and balance calculations MUST be scoped strictly to the authenticated UserID.

🏷️ 4. Dynamic Category Management
Default Setup: Auto-populate standard categories for new users upon registration (Jajan [Utensils], Transport [Bus], Tabungan [PiggyBank], Lainnya [Folder]) into the Categories sheet.

Manage Categories Modal ("Kelola Kategori"):

View list of active user categories with assigned Lucide icons.

Form to add new custom category (Inputs: Name, Type: Income/Expense, Lucide Icon string key).

Ability to delete/archive custom categories safely.

Dynamic Form Binding: The transaction creation form's category dropdown must dynamically render based on the active user's saved categories.

📱 5. Screen Structure & Core Interactions
Dashboard Header:

Large, bold running total balance formatted in IDR using the Fraunces font (e.g., Rp 125.000).

Clean, tactile layout without heavy gradient background cards.

Transaction Form:

Inputs: Date (default today: YYYY-MM-DD), Description, Amount (numeric, positive), Type toggle (Income/Expense), Dynamic Category Dropdown.

Interaction: Client validation → optimistic UI update → 1-second soft background highlight transition on the new item row → silent sync via google.script.run.

Recent Transactions List:

Sorted newest first.

Layout per item: Date | Description | Category Badge + Lucide Icon | Amount (Formatted IDR with green + or red -).

7-Day Category Expense Chart:

Compact Chart.js doughnut or bar chart filtered for the last 7 days of expense transactions.

Chart colors strictly constrained to #C98A2C (Mustard) and harmonized warm neutral tones.

🧹 6. Code Quality & Biome Linter Compliance
All generated JavaScript, HTML, and CSS code must strictly pass Biome Linter rules:

Variables: Strictly use const or let. Never use var.

Type Safety: Strictly use === and !==.

Async Execution: Wrap google.script.run calls inside client-side Native Promises to enable async/await syntax.

Syntax: Clean ES6+ arrow functions, clean indentation, and modular functions.

Cleanliness: Zero dead code, no leftover console.log statements, proper event delegation, and destroy existing Chart.js instances before re-rendering.

Accessibility: Include standard semantic HTML tags (<main>, <header>, <nav>, <section>) and appropriate aria-label attributes on interactive buttons.
