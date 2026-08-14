# Build Prompt — Sistem Pendaftaran & Antrian UPK Kantor Pusat Kemenkes

## 1. Ringkasan Satu Kalimat
Web app untuk pendaftaran (booking terjadwal maupun walk-in) dan pengelolaan antrian layanan kesehatan di Unit Pelayanan Kesehatan (UPK) Kantor Pusat Kemenkes, melayani Pegawai, Keluarga Pegawai, dan Masyarakat Umum di 4 poli (Umum, Gigi, Jantung, Paru), dengan tampilan display antrian real-time dan dashboard operasional untuk petugas, dokter, dan admin.

---

## 2. Tech Stack (WAJIB, jangan diganti)
- **Database**: Google Sheet (1 spreadsheet, multi-tab sebagai "tabel")
- **Backend**: Google Apps Script (GAS) — `doGet()` untuk render HTML, `google.script.run` untuk operasi CRUD dari client
- **Frontend**: HTML + Tailwind CSS (via CDN), vanilla JavaScript
- **Icon**: Google Material Symbols (gunakan varian *Outlined*, konsisten di seluruh aplikasi — jangan campur dengan icon set lain, jangan pakai emoji sebagai pengganti icon)
- **Deployment**: GAS Web App — Execute as "Me", Access "Anyone" (karena masyarakat umum harus bisa akses tanpa akun Google)

---

## 3. Struktur Data (Google Sheet — tiap tab = 1 sheet)

**`Users`**
`id_user | nama | email | username | password_hash | salt | role [pasien/petugas_loket/dokter/admin] | tipe_pasien [pegawai/keluarga/umum] | identitas [NIP/NIK] | unit_kerja | no_hp | created_at`

**`MasterPoli`**
`id_poli | kode_poli | nama_poli | jenis [umum/spesialis] | kuota_harian`

**`JadwalDokter`**
`id_jadwal | id_poli | nama_dokter | hari [Senin..Jumat] | jam_mulai | jam_selesai | status_aktif`

**`Antrian`**
`id_antrian | user_id | id_poli | tanggal | jenis [booking/walkin] | jam_booking | no_antrian | status [booking/checkin/dipanggil/diperiksa/selesai/batal] | keluhan_singkat | waktu_dibuat | waktu_dipanggil | waktu_selesai`

**`Sessions`**
`token | user_id | expired_at`

Semua ID gunakan UUID (`Utilities.getUuid()`). Password di-hash pakai `Utilities.computeDigest(DigestAlgorithm.SHA_256, password + salt)` — **jangan pernah simpan plaintext**.

Format nomor antrian: `[KODE_POLI]-[3 digit berurutan]`, reset ke `001` tiap hari per poli. Contoh: `UM-001`, `GG-014`, `JT-002`, `PR-001`.

---

## 4. Role & Alur Login
4 role: **Pasien**, **Petugas Loket**, **Dokter/Poli**, **Admin**.

- Semua pasien (pegawai/keluarga/umum) mendaftar akun bebas secara mandiri (username/password) — tanpa verifikasi otomatis ke data pegawai resmi. Verifikasi identitas (NIP/NIK) dilakukan manual oleh petugas loket saat check-in bila diperlukan.
- Setelah login sukses, buat token session (simpan di tab `Sessions` dengan masa berlaku, mis. 8 jam) dan simpan di `localStorage` browser — GAS tidak punya session server-side bawaan.
- Redirect otomatis ke dashboard sesuai role.

---

## 5. Layar Utama & Elemen

### A. Landing / Login / Register (Pasien)
- Landing page: hero singkat identitas UPK Kemenkes, tombol "Daftar Akun" & "Masuk"
- Form register: nama, tipe pasien (pegawai/keluarga/umum — pilih via segmented button), NIP/NIK, unit kerja (khusus pegawai), no HP, username, password
- Form login: username + password

### B. Dashboard Pasien
- Kartu ringkasan: booking aktif berikutnya (poli, tanggal, jam, no antrian, status)
- Tombol "Daftar Antrian Baru" → alur booking
- Riwayat kunjungan (tabel: tanggal, poli, status, keluhan singkat)
- Tiap booking aktif punya tombol "Batalkan" dan "Jadwalkan Ulang" (aktif hanya jika masih ≥2 jam sebelum jadwal, disabled dengan tooltip penjelasan jika sudah lewat batas)

### C. Alur Booking / Walk-in (Pasien)
1. Pilih jenis: **Booking terjadwal** atau **Walk-in hari ini**
2. Pilih poli (card 4 poli: Umum, Gigi, Jantung, Paru — untuk poli spesialis, tampilkan jadwal dokter yang tersedia hari itu/minggu ini, sembunyikan/nonaktifkan tanggal tanpa jadwal dokter)
3. **Jika booking**: pilih tanggal (kalender, hanya Senin–Jumat aktif) → sistem cek sisa kuota poli di tanggal itu → jika penuh, tampilkan pesan & sarankan tanggal lain → pilih slot jam sesuai jadwal dokter
   **Jika walk-in**: sistem cek sisa kuota hari ini → jika penuh, tampilkan pesan poli penuh hari ini
4. Isi keluhan singkat (textarea pendek)
5. Konfirmasi → sistem generate `no_antrian` otomatis, simpan ke tab `Antrian`, tampilkan halaman sukses berisi nomor antrian & ringkasan jadwal

### D. Halaman Status Antrian (Pasien, real-time)
- Menampilkan posisi antrian saat ini vs nomor antrian pasien, auto-refresh tiap 10–15 detik (polling `google.script.run`)
- Badge status berwarna: Booking (abu), Check-in (biru), Dipanggil (hijau menyala + animasi halus), Diperiksa (kuning), Selesai (hijau tua)

### E. Layar Display TV (Ruang Tunggu — akses publik, tanpa login)
- Full-screen, grid per poli menampilkan nomor antrian yang **sedang dipanggil** dan **antrian berikutnya**
- Auto-refresh tiap 5–10 detik, tipografi besar & kontras tinggi supaya terbaca dari jarak jauh

### F. Dashboard Petugas Loket
- Tabel antrian hari ini per poli, filter by poli & status
- Tombol aksi: "Check-in" (verifikasi kedatangan pasien booking — termasuk cek manual NIP/NIK jika perlu), "Panggil Berikutnya" (ambil antrian status `checkin`/`booking` urutan terlama → ubah status jadi `dipanggil` → update Layar Display)
- Bisa input walk-in langsung dari sisi loket (untuk pasien yang datang tanpa isi form sendiri)

### G. Dashboard Dokter/Poli
- Daftar pasien dengan status `dipanggil` di poli miliknya hari ini
- Tombol "Mulai Periksa" (`dipanggil` → `diperiksa`) dan "Selesai" (`diperiksa` → `selesai`, catat `waktu_selesai`)

### H. Dashboard Admin
- Kelola Master Poli: tambah/edit kuota harian per poli
- Kelola Jadwal Dokter: CRUD jadwal per poli (hari, jam, nama dokter, aktif/nonaktif)
- Kelola akun Petugas/Dokter (tambah user dengan role tertentu)
- **Laporan & Statistik**: jumlah pasien per poli (harian/mingguan), grafik tren kunjungan, breakdown tipe pasien (pegawai/keluarga/umum), rata-rata waktu tunggu — gunakan chart sederhana (bar/line) dengan data asli dari tab `Antrian`

---

## 6. Gaya Visual

**Palet warna** — berbasis identitas Kemenkes (turquoise, hijau terang, hitam untuk teks tegas). Karena kode hex resmi belum terverifikasi dari brand guideline, gunakan approksimasi berikut dan sesuaikan jika Anda punya nilai hex resmi:
- Primary (turquoise): `#00A9A5` — untuk elemen aksi utama, header, navigasi aktif
- Secondary (hijau terang): `#6FBE44` — untuk status positif/selesai, aksen
- Neutral dark: `#1A1A1A` / `#2D2D2D` — teks utama, bukan hitam pekat penuh
- Background: putih/`#F7FAFA` (bukan abu generik AI), card dengan sedikit tint turquoise di border/shadow

**Karakter visual**: medical/healthcare software modern — berbasis card dengan status berwarna jelas (badge), whitespace cukup lega agar tidak sesak, tipografi sans-serif tegas (mis. Inter/Plus Jakarta Sans dari Google Fonts), shadow lembut bukan flat generik.

**Hindari "AI slop"**:
- Jangan pakai gradient ungu-biru generik khas template AI
- Jangan pakai ilustrasi stok generik/3D bubble people
- Jangan icon membulat berlebihan atau emoji sebagai pengganti icon — konsisten pakai Material Symbols Outlined
- Gunakan data contoh yang realistis dan lokal: nama Indonesia (mis. "Budi Santoso", "drg. Siti Aminah, Sp.KG"), unit kerja nyata Kemenkes (mis. "Biro Kepegawaian", "Sekretariat Jenderal", "Ditjen Yankes"), bukan "John Doe" atau "Lorem Ipsum"

---

## 7. Batasan Ruang Lingkup (TIDAK termasuk di versi MVP ini)
- Tidak ada integrasi pembayaran atau BPJS
- Tidak ada rekam medis elektronik lengkap (hanya keluhan singkat + status kunjungan)
- Tidak ada notifikasi WhatsApp/SMS/push (status hanya via halaman web & layar display)
- Tidak ada multi-bahasa
- Tidak ada penjadwalan otomatis pengganti dokter cuti/izin — dikelola manual oleh Admin
- Tidak mencakup unit vertikal/UPT/RSUP lain — khusus UPK Kantor Pusat Kemenkes

---

## 8. Ketentuan Teknis Tambahan
- Mobile-first, responsif penuh (mayoritas pasien akan akses dari HP)
- Semua tanggal booking harus tervalidasi Senin–Jumat dan sesuai jam kerja Kantor Pusat Kemenkes
- Validasi sisi client DAN server (GAS) untuk kuota, jadwal dokter, dan batas waktu batal/reschedule (≥2 jam sebelum jadwal)
- Struktur kode GAS rapi: pisahkan file per fungsi (`Auth.gs`, `Booking.gs`, `Antrian.gs`, `Admin.gs`, `Utils.gs`) dan HTML per halaman/komponen menggunakan `HtmlService.createTemplateFromFile` + `include()`
- Sertakan data dummy awal (beberapa dokter, jadwal, dan 5–10 antrian contoh) agar aplikasi langsung terlihat "hidup" saat pertama dibuka, bukan tampilan kosong

---
## Version History
| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| v1 | 2026-08-03 | Draf awal hasil in-depth interview |
