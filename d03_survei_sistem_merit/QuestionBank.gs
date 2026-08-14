/**
 * QuestionBank.gs — Bank pertanyaan survei (8 aspek, 33 pertanyaan berskor + 1 bagian profiling).
 * Ditranskrip dari "Kertas Kerja Evaluasi Sistem Merit 2026" (Kemenkes/KemenPANRB).
 *
 * Setiap pertanyaan:
 *   id              : kode unik pertanyaan (dipakai sebagai key jawaban di Sheet)
 *   subaspek        : judul subaspek
 *   question        : teks pertanyaan
 *   keterangan      : catatan/definisi tambahan (opsional)
 *   type            : 'score' (0-4), 'gate' (Ya/Tidak, tidak dihitung skor), 'select' (pilihan tanpa skor)
 *   options         : daftar {value, label}
 *   evidenceRequired: true jika bukti dukung wajib diunggah untuk skor > 0
 *   evidenceHints   : daftar contoh bukti dukung yang disarankan
 *   dependsOn       : { questionId, values:[...] } — pertanyaan hanya berlaku jika jawaban questionId ada di values
 */

const QUESTION_BANK = [
  // ============================================================
  // ASPEK 1 — PERENCANAAN KEBUTUHAN DAN STANDARDISASI JABATAN
  // ============================================================
  {
    no: 1,
    title: 'Aspek Perencanaan Kebutuhan dan Standardisasi Jabatan',
    description: 'Pemetaan kebutuhan Pegawai ASN oleh Instansi Pemerintah berdasarkan penetapan nomenklatur jabatan yang berbasis analisis jabatan dan evaluasi jabatan.',
    questions: [
      {
        id: 'a1q1',
        subaspek: '1.1. Subaspek Analisis Jabatan',
        question: 'Sejauh mana ketersediaan dan pemanfaatan Analisis Jabatan (Anjab) dan Analisis Beban Kerja (ABK) pada instansi Anda?',
        keterangan: 'Jabatan yang dimaksud termasuk Jabatan Manajerial dan Jabatan Non Manajerial. *Jabatan yang dimaksud termasuk Jabatan Manajerial dan Jabatan Non-manajerial.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Anjab dan ABK tidak tersedia.' },
          { value: 1, label: 'Anjab dan ABK tersedia untuk sebagian jabatan.' },
          { value: 2, label: 'Anjab dan ABK tersedia untuk seluruh jabatan.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan didasarkan pada analisis kebutuhan organisasi, termasuk beban kerja dan visi misi instansi pemerintah.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta telah digunakan sebagai dasar pengusulan kebutuhan pengisian jabatan, mutasi pegawai, dan/atau pengembangan kompetensi.' },
        ],
        evidenceHints: [
          'Dokumen/penetapan/tangkap layar dashboard Analisis Jabatan dan Analisis Beban Kerja pada Sistem Informasi',
          'Dokumen Rencana Strategis',
          'Dokumen/tangkap layar Sistem Informasi yang memuat data ABK dan data eksisting pegawai pada saat pengusulan kebutuhan ASN',
          'Bukti dukung relevan lainnya yang menunjukkan pemanfaatan Anjab ABK sebagai dasar pengusulan kebutuhan pengisian jabatan, mutasi pegawai, dan/atau pengembangan kompetensi',
        ],
      },
      {
        id: 'a1q2',
        subaspek: '1.2. Subaspek Evaluasi Jabatan',
        question: 'Sejauh mana penetapan kelas jabatan pada instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Evaluasi Jabatan belum disusun.' },
          { value: 1, label: 'Evaluasi Jabatan telah disusun dan telah diusulkan kepada Menteri PANRB.' },
          { value: 2, label: 'Evaluasi Jabatan telah disetujui Menteri PANRB namun PPK belum menetapkan peraturan kelas jabatan.' },
          { value: 3, label: 'Evaluasi Jabatan telah disetujui Menteri PANRB dan PPK telah menetapkan peraturan kelas jabatan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan digunakan sebagai dasar pemberian penghargaan dan pengakuan (tunjangan kinerja/Tambahan Penghasilan Pegawai).' },
        ],
        evidenceHints: [
          'Surat usulan validasi hasil Evaluasi Jabatan kepada Menteri PANRB',
          'Surat Persetujuan Menteri PANRB Penetapan Kelas Jabatan di Lingkungan Instansi',
          'Tangkap layar Peraturan PPK tentang jabatan dan kelas jabatan',
          'Tangkap layar/sample bukti pemanfaatan slip tunjangan kinerja/Tambahan Penghasilan Pegawai berdasarkan Kelas Jabatan untuk satu pegawai',
        ],
      },
      {
        id: 'a1q3',
        subaspek: '1.3. Subaspek Perencanaan Kebutuhan ASN',
        question: 'Sejauh mana Peta Jabatan telah ditetapkan dan terintegrasi dengan sistem informasi serta dimanfaatkan dalam pemenuhan kebutuhan ASN di instansi Anda?',
        keterangan: 'Sistem informasi dapat menggunakan e-formasi, SIASN, atau aplikasi internal instansi.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Peta Jabatan tidak tersedia.' },
          { value: 1, label: 'Peta Jabatan tersedia namun belum ditetapkan.' },
          { value: 2, label: 'Peta Jabatan telah ditetapkan namun belum terintegrasi dengan sistem informasi.' },
          { value: 3, label: 'Peta Jabatan telah ditetapkan dan telah terintegrasi dengan sistem informasi.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta digunakan sebagai dasar pengusulan kebutuhan pengisian jabatan, mutasi pegawai, dan/atau karier dalam rangka pemenuhan kebutuhan ASN.' },
        ],
        evidenceHints: [
          'Surat persetujuan kebutuhan talenta dan/atau karier oleh Menteri Fungsional PANRB',
          'Tangkap layar Peta Jabatan pada Sistem Informasi',
          'Bukti dukung relevan lainnya yang menunjukkan pemanfaatan peta jabatan sebagai dasar promosi, rotasi, rekrutmen pegawai, manajemen talenta dan/atau karier ASN',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 2 — MANAJEMEN TALENTA
  // ============================================================
  {
    no: 2,
    title: 'Aspek Manajemen Talenta',
    description: 'Penyelenggaraan manajemen talenta yang dilakukan oleh Instansi Pemerintah meliputi pemetaan talenta, pemenuhan talenta melalui akuisisi talenta, retensi talenta, pengembangan talenta, serta pemantauan dan evaluasi.',
    questions: [
      {
        id: 'a2q1',
        subaspek: 'Pemetaan Talenta',
        question: 'Sejauh mana Komite Talenta Instansi (KTI) menggunakan hasil pemetaan talenta dalam proses manajemen talenta di instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'KTI belum terbentuk.' },
          { value: 1, label: 'KTI telah terbentuk, namun instansi telah melakukan pemetaan talenta pada sebagian pegawai.' },
          { value: 2, label: 'KTI telah terbentuk dan sudah melakukan pemetaan talenta untuk seluruh pegawai.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta pemetaan talenta diperbarui secara berkala dengan menggunakan instrumen yang valid.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan hasil pemetaan talenta digunakan untuk pengembangan karier, pengembangan kompetensi, dan/atau pengisian/penempatan suksesor dalam jabatan target.' },
        ],
        evidenceHints: [
          'SK Komite Talenta Instansi (KTI)',
          'Laporan hasil pemetaan pegawai',
          'Dokumen atau peraturan internal terkait manajemen talenta instansi yang dapat memuat strategi akuisisi',
          'Dokumentasi penyampaian strategi akuisisi talenta kepada pegawai',
          'Bukti dukung relevan lainnya yang menunjukkan pemanfaatan pengembangan karier, kompetensi, dan/atau penempatan/pengisian jabatan target',
        ],
      },
      {
        id: 'a2q2',
        subaspek: 'Akuisisi Talenta',
        question: 'Bagaimana strategi akuisisi talenta di instansi Anda?',
        keterangan: '*Jabatan target adalah jabatan yang sedang atau akan lowong yang akan diisi kandidat talenta dalam pengembangan karier PNS',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Tidak tersedia strategi akuisisi talenta berdasarkan analisis kebutuhan talenta dan basis data talenta.' },
          { value: 1, label: 'Tersedianya strategi akuisisi talenta berdasarkan analisis kebutuhan talenta dan basis data talenta.' },
          { value: 2, label: 'Strategi akuisisi talenta telah dilaksanakan pada sebagian pegawai yang menduduki Jabatan Manajerial.' },
          { value: 3, label: 'Strategi akuisisi talenta telah dilaksanakan untuk pengembangan karier, kompetensi, dan/atau pengisian/penempatan suksesor dalam jabatan target.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta digunakan sebagai dasar rekrutmen pegawai, manajemen talenta dan/atau karier ASN.' },
        ],
        evidenceHints: [
          'Dokumen atau peraturan internal terkait manajemen talenta instansi yang dapat memuat strategi akuisisi',
          'Dokumentasi penyampaian strategi akuisisi talenta kepada pegawai',
          'Bukti dukung relevan lainnya yang menunjukkan pemanfaatan pengembangan karier, kompetensi, dan/atau penempatan/pengisian jabatan target',
        ],
      },
      {
        id: 'a2q3',
        subaspek: 'Pengadaan ASN',
        question: 'Bagaimana pelaksanaan pengadaan pengadaan ASN dalam memenuhi kebutuhan di instansi Anda?',
        keterangan: '*Tahapan pengadaan terdiri dari pengumuman, seleksi administrasi, seleksi kompetensi, sampai dengan pengumuman kelulusan.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Usulan kebutuhan untuk pengadaan ASN belum berdasarkan analisis kebutuhan talenta atau perencanaan kebutuhan ASN.' },
          { value: 1, label: 'Usulan kebutuhan untuk pengadaan sudah berdasarkan kebutuhan talenta atau perencanaan kebutuhan ASN, namun pelaksanaan tahapan pengadaan belum sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.' },
          { value: 2, label: 'Usulan kebutuhan untuk pengadaan sudah berdasarkan kebutuhan talenta atau perencanaan kebutuhan ASN serta pelaksanaan tahapan pengadaan dilakukan sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta tidak ada penundaan pengangkatan/pelantikan terhadap pegawai hasil pengadaan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta pengadaan ASN telah sesuai dengan usulan kebutuhan ASN yang mampu memenuhi kebutuhan ASN yang berkompetensi dan berkinerja tinggi.' },
        ],
        evidenceHints: [
          'Dokumen analisis kebutuhan talenta/perencanaan kebutuhan ASN',
          'Dokumen usulan kebutuhan Pengadaan ASN',
          'Penetapan Pengadaan ASN dari KemenPANRB',
          'Dokumen Pengumuman Pengadaan ASN',
          'Laporan pelaksanaan dan evaluasi pengadaan ASN yang dapat memuat rekapitulasi pengangkatan CPNS menjadi PNS',
        ],
      },
      {
        id: 'a2q4',
        subaspek: 'Pengembangan Talenta',
        question: 'Sudah sebaik apa program dan/atau kegiatan pengembangan talenta disusun berdasarkan pemetaan talenta di instansi Anda?',
        keterangan: '*Program pengembangan talenta dapat merujuk lampiran II Peraturan Menteri PANRB Nomor 20 Tahun 2025 tentang Manajemen Talenta',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Program/kegiatan pengembangan talenta belum disusun.' },
          { value: 1, label: 'Program/kegiatan pengembangan talenta telah disusun namun belum berdasarkan hasil pemetaan talenta.' },
          { value: 2, label: 'Program/kegiatan pengembangan talenta telah disusun berdasarkan hasil pemetaan talenta.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan telah dilaksanakan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan program pengembangan talenta mendukung akselerasi karier, yaitu promosi, pengayaan, maupun perluasan jabatan, pengembangan kompetensi, dan peningkatan kualifikasi.' },
        ],
        evidenceHints: [
          'Dokumen program pengembangan talenta',
          'Dokumentasi pelaksanaan pengembangan talenta yang mendukung akselerasi karier',
          'Dokumen lain yang relevan atau menunjukkan keselarasan dengan kebutuhan organisasi, dan kesenjangan talenta (contoh: HCDP, IDP)',
        ],
      },
      {
        id: 'a2q5',
        subaspek: 'Retensi Talenta',
        question: 'Sejauh mana penyusunan, penetapan, dan pemanfaatan program retensi talenta di instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Belum dilakukan identifikasi kebutuhan program retensi talenta.' },
          { value: 1, label: 'Telah dilakukan identifikasi dan analisis kebutuhan program retensi talenta.' },
          { value: 2, label: 'Kriteria skor 1 terpenuhi, dan telah ditetapkan program retensi talenta.' },
          { value: 3, label: 'Program retensi talenta telah dilaksanakan untuk sebagian kelompok talenta.' },
          { value: 4, label: 'Program retensi talenta telah dilaksanakan untuk seluruh kelompok talenta.' },
        ],
        evidenceHints: [
          'Dokumen atau peraturan internal terkait manajemen talenta instansi yang dapat memuat program retensi talenta',
          'Dokumentasi pelaksanaan program retensi talenta yang dapat memuat setiap kelompok talenta',
        ],
      },
      {
        id: 'a2q6',
        subaspek: 'Pemantauan dan Evaluasi',
        question: 'Sejauh mana pelaksanaan pemantauan dan evaluasi dalam penyelenggaraan manajemen talenta di instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pemantauan serta evaluasi penyelenggaraan manajemen talenta belum dilaksanakan.' },
          { value: 1, label: 'Pemantauan serta evaluasi dilakukan pada sebagian aspek penyelenggaraan manajemen talenta.' },
          { value: 2, label: 'Pemantauan serta evaluasi dilakukan pada keseluruhan aspek penyelenggaraan manajemen talenta.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan dalam laporan yang dihasilkan memuat: 1. Capaian penyelenggaraan manajemen talenta; 2. Analisis hasil pemantauan dan evaluasi; dan 3. Rekomendasi perbaikan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta rekomendasi perbaikan ditindaklanjuti melalui perbaikan sistem manajemen talenta.' },
        ],
        evidenceHints: [
          'Rancangan/dokumen kebijakan internal yang telah diimplementasikan oleh pegawai dan unit kerja seluruh unit kerja terdapat rekomendasi perbaikan',
          'Laporan evaluasi implementasi kebijakan manajemen talenta di instansi',
          'Dokumen/bukti lainnya yang menunjukkan perbaikan sistem manajemen talenta berdasarkan rekomendasi',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 3 — PENGELOLAAN KINERJA
  // ============================================================
  {
    no: 3,
    title: 'Aspek Pengelolaan Kinerja',
    description: 'Pengelolaan kinerja Pegawai ASN yang dilakukan oleh Instansi Pemerintah yang terdiri atas perencanaan kinerja, pelaksanaan pemantauan dan pembinaan kinerja, evaluasi kinerja, serta tindak lanjut hasil evaluasi kinerja.',
    questions: [
      {
        id: 'a3q1',
        subaspek: 'Perencanaan Kinerja',
        question: 'Bagaimana kondisi perencanaan kinerja pegawai di instansi Anda?',
        keterangan: '*Aplikasi pengelolaan kinerja pegawai yang dimaksud dapat menggunakan eKinerja atau aplikasi internal.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Output hasil kerja/realisasi tidak tersedia.' },
          { value: 1, label: '70%-90% pegawai telah menyusun SKP yang memuat paling sedikit RHK, IKI, dan Target Kinerja.' },
          { value: 2, label: '> 90% pegawai telah menyusun SKP yang paling sedikit memuat RHK, IKI, dan Target Kinerja.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan mayoritas SKP (>80%) disusun tepat waktu, berorientasi hasil, berbasis cascading, serta terdapat ekspektasi khusus perilaku kerja.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan mayoritas Pegawai (>80%) telah dijabarkan ke dalam target periodik (milestone) sebagai dasar pemantauan individu kinerja pegawai.' },
        ],
        evidenceHints: [
          'Tangkap layar dalam aplikasi pengelolaan kinerja pegawai yang menunjukkan: Jumlah rekapitulasi pegawai yang telah membuat Sasaran Kinerja Pegawai (SKP) tahun 2025, Indikator Kinerja Individu (IKI), untuk Jabatan Pimpinan Tinggi, Jabatan Administrator dan Jabatan Fungsional (masing-masing 1 contoh untuk setiap level/jenjang)',
          'Contoh tampilan SKP yang memuat Rencana Hasil Kerja, Indikator Kinerja Individu (IKI), dan Target Kinerja',
          'Contoh tampilan kinerja (misalnya Matriks Pembagian Peran dan Hasil/Pohon Kinerja atau dokumen sejenis)',
          'Contoh tampilan milestone/rencana aksi periodik pegawai',
        ],
      },
      {
        id: 'a3q2',
        subaspek: 'Pelaksanaan, Pemantauan, dan Pembinaan Kinerja',
        question: 'Bagaimana pelaksanaan, pemantauan, dan pembinaan kinerja di instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Output hasil kerja/realisasi kinerja tidak tersedia.' },
          { value: 1, label: 'Output hasil kerja/realisasi tersedia dan dilakukan paling sedikit dalam satu kali dalam satu tahun.' },
          { value: 2, label: 'Output hasil kerja/realisasi tersedia dan dilakukan secara berkelanjutan minimal setiap periode (bulanan/triwulanan) penilaian kinerja.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan atasan memberikan umpan balik (feedback) berkala yang spesifik serta terdokumentasi.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan dilakukan pembinaan kinerja (minimal memuat rencana perbaikan kinerja yang disepakati) untuk pengembangan kinerja dan kompetensi pegawai.' },
        ],
        evidenceHints: [
          'Tangkap layar dalam aplikasi pengelolaan kinerja pegawai yang menunjukkan: Jumlah Rekapitulasi contoh hasil kerja yang diunggah (output hasil kerja/realisasi target kinerja)',
          'Dokumentasi contoh umpan balik/feedback kinerja yang diberikan dari pejabat penilai',
          'Dokumentasi contoh tindak lanjut yang dilaksanakan (bimbingan/konseling), pengembangan kinerja dan kompetensi sesuai hasil pemantauan kinerja',
        ],
      },
      {
        id: 'a3q3',
        subaspek: 'Evaluasi Kinerja',
        question: 'Sejauh mana hasil evaluasi kinerja periodik dan tahunan pegawai tersedia dan dimanfaatkan dan ditandatangani atasan di instansi Anda?',
        keterangan: '*Evaluasi kinerja adalah Sasaran Kinerja Pegawai (SKP) yang sudah dinilai dan ditandatangani atasan.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: '<70% pegawai telah mendapatkan evaluasi kinerja tahunan.' },
          { value: 1, label: '70-90% pegawai telah mendapatkan evaluasi kinerja tahunan dan periodik.' },
          { value: 2, label: '>90% pegawai telah mendapatkan evaluasi kinerja tahunan dan periodik.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta evaluasi dilakukan tepat waktu berdasarkan bukti capaian yang relevan serta mencerminkan kontribusi terhadap organisasi.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta hasil evaluasi kinerja telah dimanfaatkan untuk pemberian penghargaan, pembinaan, pengembangan karier, dan/atau pengembangan kinerja dan kompetensi pegawai.' },
        ],
        evidenceHints: [
          'Tangkap layar dalam aplikasi pengelolaan kinerja pegawai yang menunjukkan: a. Jumlah Rekapitulasi SKP Tahun 2025 yang telah dinilai dan ditandatangani atasan dan ditandatangani; b. Contoh Sasaran Kinerja Pegawai (SKP) yang sudah dinilai dan ditandatangani atasan',
          'c. Contoh Hasil penilaian atasan/unit kerja organisasi',
          'Dokumen/bukti lainnya yang menunjukkan pemanfaatan hasil evaluasi kinerja untuk pemberian penghargaan, pembinaan, pengembangan karier pegawai',
        ],
      },
      {
        id: 'a3q4',
        subaspek: 'Tindak Lanjut Evaluasi Kinerja',
        question: 'Sejauh mana pelaksanaan tindak lanjut evaluasi kinerja pegawai di instansi Anda?',
        keterangan: '*Tindak lanjut kinerja pegawai terdiri dari komponen-komponen berikut: (1) pelaporan kinerja; (2) keberatan; (3) penghargaan; (4) sanksi',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Tindak lanjut hasil evaluasi kinerja tidak terlaksana.' },
          { value: 1, label: 'Tindak lanjut terlaksana untuk salah satu komponen (misalnya: hanya memfasilitasi keberatan pegawai).' },
          { value: 2, label: 'Tindak lanjut terlaksana untuk sebagian komponen (2-3 komponen).' },
          { value: 3, label: 'Seluruh komponen tindak lanjut (4 komponen) telah terlaksana sesuai dengan mekanisme dan ketentuan yang berlaku.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan tindak lanjut tersebut diterapkan secara konsisten kepada seluruh pegawai yang berdampak pada pengembangan karier ASN.' },
        ],
        evidenceHints: [
          'Contoh fitur/ruang untuk mengajukan keberatan pegawai (jika ada keberatan)',
          'Contoh proses keberatan pegawai',
          'Contoh proses pemberian penghargaan berbasis kinerja (peraturan internal instansi) seperti prioritas pengembangan kompetensi dan prioritas talent pool',
          'Contoh proses pemberian pembinaan dan sanksi kinerja (jika ada sanksi)',
          'Dokumen/bukti dukung lainnya yang menunjukkan pemberian pelaporan pembinaan kinerja, keberatan, penghargaan, dan sanksi berdasarkan evaluasi kinerja',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 4 — PENGEMBANGAN KOMPETENSI
  // ============================================================
  {
    no: 4,
    title: 'Aspek Pengembangan Kompetensi',
    description: 'Program pengembangan diri pegawai ASN yang disusun oleh Instansi Pemerintah untuk pemenuhan kebutuhan kompetensi sesuai dengan standar kompetensi jabatan dan hasil pengukuran kompetensi pegawai ASN yang mendukung pencapaian kinerja organisasi.',
    questions: [
      {
        id: 'a4q0_jenis_instansi',
        subaspek: 'Pendahuluan',
        question: 'Dalam penyusunan SKJ, apakah instansi Anda merupakan:',
        type: 'gate',
        evidenceRequired: false,
        options: [
          { value: 'pusat', label: 'Instansi Pusat' },
          { value: 'provinsi', label: 'Pemerintah Provinsi' },
          { value: 'kabkota', label: 'Pemerintah Kabupaten/Kota' },
        ],
        evidenceHints: [],
      },
      {
        id: 'a4q1_pusat_prov',
        subaspek: 'Standar Kompetensi Jabatan Bagi Instansi KL/Provinsi',
        question: 'Sejauh mana ketersediaan dan pemanfaatan Standar Kompetensi Jabatan (SKJ) di instansi Anda?',
        keterangan: '*Kompetensi SKJ terdiri dari kompetensi manajerial, sosial kultural, dan teknis.',
        type: 'score',
        evidenceRequired: true,
        dependsOn: { questionId: 'a4q0_jenis_instansi', values: ['pusat', 'provinsi'] },
        options: [
          { value: 0, label: 'Tidak tersedia SKJ.' },
          { value: 1, label: 'SKJ telah tersedia untuk sebagian jabatan manajerial dengan aspek kompetensi yang belum lengkap (manajerial, sosial kultural, dan/atau teknis).' },
          { value: 2, label: 'SKJ telah tersedia untuk seluruh jabatan manajerial dengan aspek kompetensi yang lengkap (manajerial, sosial kultural, dan teknis).' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan SKJ telah ditetapkan oleh instansi sesuai dengan surat persetujuan Menteri PANRB.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta SKJ telah dimanfaatkan sebagai dasar pengukuran dan pengembangan kompetensi pegawai.' },
        ],
        evidenceHints: [
          'Rekap/list seluruh jabatan manajerial yang telah memiliki SKJ',
          'Dokumen SKJ/dokumen SKJ yang telah ditetapkan',
          'Laporan/dokumen lainnya yang dapat menggambarkan pemanfaatan SKJ dalam pengukuran dan pengembangan kompetensi',
        ],
      },
      {
        id: 'a4q1_kabkota',
        subaspek: 'Standar Kompetensi Jabatan Bagi Instansi Kab/Kota',
        question: 'Sejauh mana ketersediaan dan pemanfaatan Standar Kompetensi Jabatan (SKJ) di instansi Anda?',
        keterangan: '*Kompetensi SKJ terdiri dari kompetensi manajerial, sosial kultural, dan teknis.',
        type: 'score',
        evidenceRequired: true,
        dependsOn: { questionId: 'a4q0_jenis_instansi', values: ['kabkota'] },
        options: [
          { value: 0, label: 'Tidak tersedia SKJ.' },
          { value: 1, label: 'SKJ telah tersedia untuk sebagian jabatan manajerial dengan aspek kompetensi yang belum lengkap (manajerial, sosial kultural, dan/atau teknis).' },
          { value: 2, label: 'SKJ telah tersedia untuk seluruh jabatan manajerial dengan aspek kompetensi yang lengkap (manajerial, sosial kultural, atau teknis).' },
          { value: 3, label: 'SKJ telah disusun/ditetapkan oleh Instansi merujuk Keputusan Menteri SKJ.5 tahun 2026 tentang persetujuan Menteri PANRB terhadap usulan SKJ untuk seluruh jabatan manajerial dan sesuai SOTK.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta SKJ telah dimanfaatkan sebagai dasar pengukuran dan pengembangan kompetensi pegawai.' },
        ],
        evidenceHints: [
          'Rekap/list seluruh jabatan manajerial yang telah memiliki SKJ',
          'Dokumen SKJ persetujuan Menteri PANRB terhadap usulan SKJ',
          'Laporan/dokumen lainnya yang dapat menggambarkan pemanfaatan SKJ dalam pengukuran dan pengembangan kompetensi',
        ],
      },
      {
        id: 'a4q2',
        subaspek: 'Pengukuran Kompetensi',
        question: 'Sejauh mana pelaksanaan pengukuran kompetensi bagi pegawai di instansi Anda?',
        keterangan: '*Pegawai yang dimaksud adalah seluruh Pegawai Negeri Sipil (PNS) pada jabatan manajerial dan jabatan non-manajerial. Jabatan Manajerial adalah Jabatan Pimpinan Tinggi, Jabatan Administrator, dan Jabatan Pengawas.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pengukuran kompetensi belum dilaksanakan pada pegawai.' },
          { value: 1, label: 'Pengukuran kompetensi telah dilaksanakan hanya pada pegawai yang menduduki Jabatan Pimpinan Tinggi (JPT).' },
          { value: 2, label: 'Pengukuran kompetensi telah dilaksanakan sebagian pegawai yang menduduki Jabatan Manajerial.' },
          { value: 3, label: 'Pengukuran kompetensi telah dilaksanakan pada sebagian pegawai yang menduduki Jabatan Manajerial dan Non-manajerial.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan hasil pengukuran kompetensi telah dimanfaatkan untuk mengetahui gap kompetensi, perencanaan dan pelaksanaan pengembangan kompetensi, pemetaan talenta dan penyusunan rencana pengembangan karier pegawai.' },
        ],
        evidenceHints: [
          'Laporan pengukuran kompetensi pegawai yang memuat jumlah rincian jenis dan jenjang jabatan yang telah dilakukan pengukuran kompetensi',
          'Dokumen lain yang menunjukkan pemanfaatan hasil pengukuran kompetensi untuk mengetahui gap kompetensi, perencanaan dan pelaksanaan pengembangan kompetensi, pemetaan talenta dan penyusunan rencana pengembangan karier pegawai',
        ],
      },
      {
        id: 'a4q3',
        subaspek: 'Program Pengembangan Kompetensi',
        question: 'Sejauh mana pelaksanaan program pengembangan kompetensi di instansi Anda?',
        keterangan: '*Dokumen Rencana Pengembangan Kompetensi Pegawai ASN dapat berupa Analisis Kebutuhan Diklat (AKD); Analisis Kebutuhan Pengembangan Kompetensi (AKPK)/Individual Development Plan (IDP); Human Capital Development Plan (HCDP) Rencana Pengembangan Kompetensi Tingkat Instansi; dan/atau Rencana Pengembangan Kompetensi Pegawai ASN (Individual Development Plan/IDP)',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Belum terdapat Dokumen Rencana Pengembangan Kompetensi Pegawai ASN.' },
          { value: 1, label: 'Telah disusun Dokumen Rencana Pengembangan Kompetensi Pegawai ASN.' },
          { value: 2, label: 'Kriteria skor 1 terpenuhi, dan pelaksanaan pengembangan kompetensi berdasarkan Dokumen Rencana Pengembangan Kompetensi Pegawai ASN.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan telah dilakukan evaluasi pelaksanaan program pengembangan kompetensi pegawai ASN.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan telah dilakukan tindak lanjut sesuai hasil evaluasi tersebut.' },
        ],
        evidenceHints: [
          'Dokumen Analisis Kebutuhan Diklat (AKD); Analisis Kebutuhan Pengembangan Kompetensi (AKPK)/Individual Development Plan (IDP)',
          'Dokumen Human Capital Development Plan (HCDP)',
          'Dokumen pelaksanaan program pengembangan kompetensi',
          'Dokumen evaluasi pelaksanaan program pengembangan kompetensi',
          'Dokumen pelaksanaan tindak lanjut hasil evaluasi',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 5 — PENGUATAN BUDAYA KERJA DAN CITRA INSTITUSI
  // ============================================================
  {
    no: 5,
    title: 'Aspek Penguatan Budaya Kerja dan Citra Institusi',
    description: 'Upaya yang dilakukan Instansi Pemerintah untuk menanamkan dan mengimplementasikan nilai dasar BerAKHLAK, meliputi proses internalisasi, keteladanan dan kepemimpinan, serta dukungan kebijakan.',
    questions: [
      {
        id: 'a5q1',
        subaspek: 'Internalisasi Nilai Dasar ASN',
        question: 'Sejauh mana pelaksanaan internalisasi nilai dasar BerAKHLAK pada ASN di instansi Anda?',
        keterangan: '*Internalisasi nilai satu arah: hanya menggunakan media (banner/flyer/video dll); Internalisasi dua arah: menggunakan pendalaman materi (sosialisasi tatap muka, pelatihan dll), melibatkan knowledge sharing dan/atau benchmarking',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Internalisasi nilai dasar belum dilakukan.' },
          { value: 1, label: 'Internalisasi nilai dasar dilakukan secara satu arah atau dua arah.' },
          { value: 2, label: 'Internalisasi nilai dasar dilakukan dengan satu arah dan dua arah serta melibatkan lintas unit.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta internalisasi nilai dasar ASN sudah melibatkan pimpinan dan sudah dilaksanakan secara rutin dan berkelanjutan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta internalisasi nilai dasar telah berdampak pada instansi, khususnya terkait penerapan nilai dasar dalam perilaku, yang dibuktikan dengan pengukuran internal dan terdapat perbaikan berkelanjutan atas hasil pengukuran tersebut.' },
        ],
        evidenceHints: [
          'Laporan dan dokumentasi internalisasi nilai dasar',
          'Laporan pengukuran internal terkait penerapan nilai dasar ASN, yang dapat diperkuat dengan fakta eksternal (contoh: Google Review, testimoni, atau Survei Kepuasan yang dikaitkan dengan BerAKHLAK)',
        ],
      },
      {
        id: 'a5q2',
        subaspek: 'Keteladanan dan Kepemimpinan — Pimpinan',
        question: '1. Sejauh mana pimpinan tertinggi di instansi Anda menunjukkan komitmen nyata penerapan nilai ASN dan memiliki program/kegiatan penerapan nilai dasar ASN berdampak pada peningkatan kualitas pelayanan publik?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pimpinan belum menyatakan komitmen.' },
          { value: 1, label: 'Pimpinan Instansi Pemerintah telah menyatakan komitmen dalam penerapan nilai dasar ASN (launching komitmen/video komitmen/pencanangan BerAKHLAK).' },
          { value: 2, label: 'Kriteria skor 1 terpenuhi, dan pimpinan memiliki program/kegiatan yang mendorong penerapan nilai dasar ASN.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta program/kegiatan yang mendorong penerapan nilai dasar ASN telah dilaksanakan dan dievaluasi.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta program/kegiatan penerapan nilai dasar ASN berdampak pada peningkatan kualitas pelayanan publik.' },
        ],
        evidenceHints: [
          'Dokumentasi komitmen pimpinan (launching/ video komitmen/ pencanangan BerAKHLAK)',
          'Dokumentasi program/kegiatan tentang penerapan nilai dasar pimpinan',
          'laporan kegiatan, evaluasi dan dampak program/kegiatan bukti dukung adanya peningkatan kualitas pelayanan publik',
        ],
      },
      {
        id: 'a5q3',
        subaspek: 'Keteladanan dan Kepemimpinan — Agen Perubahan',
        question: '2. Sejauh mana Agen Perubahan/tim kerja budaya di instansi Anda membuat rencana aksi yang telah dilaksanakan dan dievaluasi?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Agen Perubahan/tim kerja budaya belum ditetapkan dan belum memiliki rencana aksi.' },
          { value: 1, label: 'Agen Perubahan/tim kerja budaya sudah ditetapkan namun belum memiliki rencana aksi.' },
          { value: 2, label: 'Agen Perubahan/tim kerja budaya sudah ditetapkan dan sudah memiliki rencana aksi.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan rencana aksi agen perubahan/tim kerja budaya telah dilaksanakan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, rencana aksi agen perubahan/tim kerja budaya telah dievaluasi.' },
        ],
        evidenceHints: [
          'Surat Keputusan (SK) Agen Perubahan',
          'Dokumen/laporan yang berisi: a. rencana aksi; b. pelaksanaan rencana aksi; c. evaluasi rencana aksi',
        ],
      },
      {
        id: 'a5q4',
        subaspek: 'Dukungan Kebijakan',
        question: 'Bagaimana penerapan implementasi kebijakan BerAKHLAK di instansi Anda?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Tidak ada kebijakan implementasi BerAKHLAK yang mendukung penguatan budaya kerja.' },
          { value: 1, label: 'Tersedia dokumen kebijakan implementasi BerAKHLAK.' },
          { value: 2, label: 'Dokumen kebijakan implementasi BerAKHLAK sudah ditetapkan.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan telah memuat perwujudan perilaku atau strategi internalisasi nilai dasar.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta diimplementasikan oleh pegawai dan unit kerja seluruh unit kerja serta telah dievaluasi dan terdapat rekomendasi perbaikan.' },
        ],
        evidenceHints: [
          'Rancangan/dokumen kebijakan implementasi kebijakan BerAKHLAK per unit yang telah ditetapkan',
          'Laporan evaluasi implementasi kebijakan BerAKHLAK per unit kerja dan perilaku pegawai',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 6 — PENGHARGAAN DAN PENGAKUAN
  // ============================================================
  {
    no: 6,
    title: 'Aspek Penghargaan dan Pengakuan',
    description: 'Pemberian penghargaan dan pengakuan oleh Instansi Pemerintah kepada pegawai ASN dalam bentuk kenaikan pangkat, gaji dan tunjangan, dan jaminan sosial secara adil, layak, dan kompetitif.',
    questions: [
      {
        id: 'a6q1',
        subaspek: 'Kenaikan Pangkat',
        question: 'Sejauh mana proses kenaikan pangkat bagi Pegawai ASN di instansi Anda telah dilaksanakan secara tepat waktu sesuai dengan ketentuan peraturan perundang-undangan?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Proses kenaikan pangkat bagi pegawai yang memenuhi persyaratan belum dilaksanakan sesuai ketentuan.' },
          { value: 1, label: 'Proses kenaikan pangkat bagi pegawai yang memenuhi persyaratan telah dilaksanakan, namun masih terdapat pegawai yang belum diproses dan/atau mengalami keterlambatan.' },
          { value: 2, label: 'Proses kenaikan pangkat bagi pegawai yang memenuhi persyaratan telah dilaksanakan sesuai waktu yang ditetapkan.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta pemenuhan hak atas kenaikan pangkat dilaksanakan sesuai ketentuan perundang-undangan.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta hasil pelaksanaan kenaikan pangkat dimonitor, dievaluasi, dan dimanfaatkan sebagai dasar penyempurnaan pengelolaan karier ASN.' },
        ],
        evidenceHints: [
          'Rekapitulasi Kenaikan Pangkat Periode Pengusulan Terakhir (jumlah pegawai yang memenuhi persyaratan eligible), jumlah yang disetujui BKN, jumlah pegawai yang ditetapkan SK kenaikan pangkat',
          'SOP/Pedoman/Prosedur Kenaikan Pangkat di internal instansi',
          'Laporan monitoring/evaluasi proses kenaikan pangkat yang dapat memuat kendala dan rekomendasi penyempurnaan pengelolaan karier ASN',
        ],
      },
      {
        id: 'a6q2',
        subaspek: 'Gaji dan Tunjangan',
        question: 'Sejauh mana pembayaran gaji pokok dan tunjangan melekat di instansi Anda telah dilaksanakan secara tepat waktu, jumlah, akuntabel, dan sesuai dengan ketentuan peraturan perundang-undangan?',
        keterangan: '*Tunjangan melekat terdiri dari tunjangan pangan, tunjangan jabatan, dan tunjangan keluarga.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pembayaran gaji dan tunjangan melekat tidak dilaksanakan.' },
          { value: 1, label: 'Pembayaran gaji dan tunjangan melekat telah dilaksanakan, namun masih terdapat ketidaksesuaian jumlah dan/atau keterlambatan waktu pembayaran.' },
          { value: 2, label: 'Pembayaran gaji dan tunjangan melekat telah dilaksanakan sesuai dengan jumlah yang menjadi hak pegawai, namun masih ada keterlambatan waktu pembayaran.' },
          { value: 3, label: 'Pembayaran gaji dan tunjangan melekat telah dilaksanakan sesuai dengan jumlah yang menjadi hak pegawai dan tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta hasil pelaksanaan pembayaran dimonitor, dievaluasi, dan dimanfaatkan untuk meningkatkan akuntabilitas dan perbaikan berkelanjutan.' },
        ],
        evidenceHints: [
          'SOP pembayaran gaji pokok dan tunjangan melekat',
          'Rekapitulasi/laporan pembayaran 1 bulan terakhir yang paling sedikit memuat jumlah PPPK per golongan, jumlah keluarga, jumlah anggaran per komponen gaji pokok dan tunjangan melekat, dan tanggal pembayaran',
          'Laporan monitoring pembayaran gaji dan tunjangan yang melekat yang dapat memuat kendala dan rekomendasi perbaikan',
        ],
      },
      {
        id: 'a6q3_gate',
        subaspek: '6.3. Subaspek Tunjangan Kinerja atau Tambahan Penghasilan Pegawai ASN',
        question: 'Pendahuluan (Pertanyaan pembuka bagi Instansi Provinsi/Kabupaten/Kota): Apakah instansi Anda membayarkan Tambahan Penghasilan Pegawai (TPP)?',
        keterangan: 'Jika "Instansi kami BUKAN Pemerintah Provinsi/Kabupaten/Kota" atau "Tidak", jawaban tidak lanjut ke pertanyaan skor Tunjangan Kinerja/TPP (langsung lanjut ke pertanyaan Jaminan Sosial).',
        type: 'gate',
        evidenceRequired: false,
        options: [
          { value: 'bukan_provkab', label: 'Instansi kami BUKAN Pemerintah Provinsi/Kabupaten/Kota' },
          { value: 'ya', label: 'Ya, instansi kami (Pemerintah Provinsi/Kabupaten/Kota) membayarkan TPP' },
          { value: 'tidak', label: 'Tidak, instansi kami (Pemerintah Provinsi/Kabupaten/Kota) tidak membayarkan TPP (misal: karena keterbatasan kemampuan keuangan)' },
        ],
        evidenceHints: [],
      },
      {
        id: 'a6q3',
        subaspek: '6.3. Subaspek Tunjangan Kinerja atau Tambahan Penghasilan Pegawai ASN',
        question: 'Sejauh mana pembayaran Tunjangan Kinerja (Tukin) atau Tambahan Penghasilan Pegawai (TPP) ASN di instansi Anda telah dilaksanakan secara tepat waktu, jumlah, akuntabel, dan sesuai dengan ketentuan peraturan perundang-undangan?',
        keterangan: '*Tunjangan melekat terdiri dari tunjangan pangan, tunjangan jabatan, dan tunjangan keluarga.',
        type: 'score',
        evidenceRequired: true,
        dependsOn: { questionId: 'a6q3_gate', values: ['ya'] },
        options: [
          { value: 0, label: 'Pembayaran Tukin atau TPP ASN belum dilaksanakan sesuai dengan ketentuan.' },
          { value: 1, label: 'Pembayaran Tukin/TPP telah dilaksanakan, namun masih terdapat ketidaksesuaian jumlah dan/atau keterlambatan waktu pembayaran.' },
          { value: 2, label: 'Pembayaran Tukin/TPP telah dilaksanakan sesuai dengan jumlah yang menjadi hak pegawai, namun masih ada keterlambatan waktu pembayaran.' },
          { value: 3, label: 'Pembayaran Tukin/TPP telah dilaksanakan sesuai dengan jumlah yang menjadi hak pegawai dan tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta hasil pelaksanaan pembayaran dimonitor, dievaluasi, dan dimanfaatkan untuk meningkatkan kualitas pengelolaan Tukin/TPP.' },
        ],
        evidenceHints: [
          'Dokumen pedoman/SOP yang memuat terkait pembayaran Tunjangan Kinerja (Tukin)/Tambahan Penghasilan Pegawai (TPP)',
          'Dokumen peraturan instansi tentang Tukin/TPP',
          'Rekapitulasi/tangkap layar pembayaran Tukin/TPP periode terakhir',
          'Laporan monitoring pembayaran Tukin/TPP yang dapat memuat kendala dan rekomendasi perbaikan',
        ],
      },
      {
        id: 'a6q4_hari_tua',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Hari Tua dan Pensiun',
        question: 'Sejauh mana instansi Anda menyediakan dukungan administratif kepegawaian dan keuangan serta memfasilitaskan pemenuhan persyaratan dalam rangka pemberian Jaminan Sosial (Jaminan Pensiun dan Hari Tua, Jaminan Kecelakaan Kerja, Jaminan Kematian, dan Jaminan Kesehatan) bagi Pegawai ASN?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Pensiun dan Hari Tua kepada Pegawai PNS yang memenuhi persyaratan tidak terdokumentasi.' },
          { value: 1, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Pensiun dan Hari Tua kepada Pegawai PNS yang memenuhi persyaratan telah terdokumentasi sebagian.' },
          { value: 2, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Pensiun dan Hari Tua kepada Pegawai PNS yang memenuhi persyaratan telah terdokumentasi seluruhnya namun tidak diproses tepat waktu.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan hasil pelaksanaan diproses tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta tersedia laporan pelaksanaannya.' },
        ],
        evidenceHints: [
          'Rekapitulasi Pemotongan Iuran Jaminan Pensiun dan Hari Tua',
          'Daftar Nominatif PNS yang akan mencapai BUP',
          'Pertimbangan Teknis dari BKN',
          'Daftar Dokumen Surat Keputusan (SK) Pensiun PNS dari PPK Instansi',
          'Laporan pelaksanaan atas dukungan administrasi kepegawaian dan keuangan dalam 2 (dua) tahun terakhir',
        ],
      },
      {
        id: 'a6q4_kecelakaan_gate',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Kecelakaan Kerja',
        question: 'Pertanyaan pembuka: apakah di instansi Anda terdapat kejadian Kecelakaan Kerja Pegawai dalam 2 (dua) tahun terakhir? (jika ya, lanjut ke pertanyaan jaminan kecelakaan)',
        type: 'gate',
        evidenceRequired: false,
        options: [
          { value: 'ya', label: 'Ya' },
          { value: 'tidak', label: 'Tidak' },
        ],
        evidenceHints: [],
      },
      {
        id: 'a6q4_kecelakaan',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Kecelakaan Kerja',
        question: 'Sejauh mana instansi Anda menyediakan dukungan administratif kepegawaian dan keuangan serta memfasilitasi pemenuhan persyaratan dalam rangka pemberian Jaminan Kecelakaan Kerja bagi Pegawai ASN?',
        type: 'score',
        evidenceRequired: true,
        dependsOn: { questionId: 'a6q4_kecelakaan_gate', values: ['ya'] },
        options: [
          { value: 0, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Kecelakaan Kerja kepada Pegawai ASN yang memenuhi persyaratan tidak terdokumentasi.' },
          { value: 1, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Kecelakaan Kerja kepada Pegawai ASN yang memenuhi persyaratan telah terdokumentasi sebagian.' },
          { value: 2, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk Jaminan Kecelakaan Kerja kepada Pegawai ASN yang memenuhi persyaratan telah terdokumentasi seluruhnya namun tidak diproses tepat waktu.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan hasil pelaksanaan diproses tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta tersedia laporan pelaksanaannya.' },
        ],
        evidenceHints: [
          'Data/dokumentasi sampling dari dokumen periode 2 (dua) tahun terakhir yang prosesnya telah selesai, yang terdiri dari: 1. Dokumen Pembayaran luran JKK Pegawai ASN yang khusus Pemerintah Daerah; 2. Rekapitulasi kejadian kecelakaan kerja dan penyakit akibat kerja, serta kejadian tewas; 3. Daftar Dokumen; 4. Daftar Dokumen Surat Keputusan Tewas yang diterbitkan Instansi Pemerintah Pusat kesatuan Pembinaan',
          'Laporan pelaksanaan dukungan administrasi kepegawaian dan keuangan untuk jaminan kecelakaan kerja',
        ],
      },
      {
        id: 'a6q4_kematian_gate',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Kematian',
        question: 'Pertanyaan pembuka: apakah di instansi Anda terdapat kejadian Kematian Pegawai dalam 2 (dua) tahun terakhir? (jika ya, lanjut ke pertanyaan jaminan kematian)',
        type: 'gate',
        evidenceRequired: false,
        options: [
          { value: 'ya', label: 'Ya' },
          { value: 'tidak', label: 'Tidak' },
        ],
        evidenceHints: [],
      },
      {
        id: 'a6q4_kematian',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Kematian',
        question: 'Sejauh mana instansi Anda menyediakan dukungan administratif kepegawaian dan keuangan untuk jaminan kematian kepada Pegawai ASN yang memenuhi persyaratan?',
        type: 'score',
        evidenceRequired: true,
        dependsOn: { questionId: 'a6q4_kematian_gate', values: ['ya'] },
        options: [
          { value: 0, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk jaminan kematian kepada Pegawai ASN yang memenuhi persyaratan tidak terdokumentasi.' },
          { value: 1, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk jaminan kematian kepada Pegawai ASN yang memenuhi persyaratan telah terdokumentasi sebagian.' },
          { value: 2, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk jaminan kematian kepada Pegawai ASN yang memenuhi persyaratan telah terdokumentasi seluruhnya namun tidak diproses tepat waktu.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan hasil pelaksanaan diproses tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta tersedia laporan pelaksanaannya.' },
        ],
        evidenceHints: [
          'Data/dokumentasi sampling dari dokumen periode 2 (dua) tahun terakhir yang prosesnya telah selesai, yang terdiri dari: 1. Dokumen pemotongan iuran jaminan kematian',
          'Laporan pelaksanaan dukungan administrasi kepegawaian dan keuangan untuk jaminan kematian',
        ],
      },
      {
        id: 'a6q4_kesehatan',
        subaspek: '6.4. Subaspek Jaminan Sosial — Jaminan Kesehatan',
        question: 'Sejauh mana instansi Anda menyediakan dukungan administratif kepegawaian dan keuangan untuk jaminan kesehatan kepada Pegawai ASN yang memenuhi persyaratan?',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk jaminan kesehatan kepada Pegawai ASN yang memenuhi persyaratan tidak terdokumentasi.' },
          { value: 1, label: 'Pemberian dukungan administrasi kepegawaian dan keuangan untuk jaminan kesehatan kepada Pegawai ASN yang memenuhi persyaratan telah terdokumentasi sebagian.' },
          { value: 2, label: 'Pegawai ASN yang memenuhi persyaratan telah terdokumentasi seluruhnya namun tidak diproses tepat waktu.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan hasil pelaksanaan diproses tepat waktu.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, serta tersedia laporan pelaksanaannya.' },
        ],
        evidenceHints: [
          'Kesehatan/iuran wajib Kesehatan pegawai',
          'Dokumen penyetoran iuran Jaminan Kesehatan',
          'Laporan pelaksanaan dukungan administrasi kepegawaian dan keuangan untuk jaminan kesehatan',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 7 — DISIPLIN, PEMBERHENTIAN, DAN UPAYA ADMINISTRATIF
  // ============================================================
  {
    no: 7,
    title: 'Aspek Disiplin, Pemberhentian, dan Upaya Administratif',
    description: 'Upaya pengelolaan disiplin, pemberhentian, dan upaya administratif yang dilakukan Instansi Pemerintah agar proses disiplin, pemberhentian, dan upaya administratif dilaksanakan sesuai norma, standar, prosedur, dan kriteria yang berlaku.',
    questions: [
      {
        id: 'a7q1',
        subaspek: 'Pembinaan dan Penegakan Disiplin, Pemberhentian, dan Upaya Administratif',
        question: 'Sejauh mana pelaksanaan pembinaan dan penegakkan disiplin, Pemberhentian dan Upaya Administratif pegawai ASN di instansi Anda berdasarkan kesesuaian dengan Norma Standar dan Prosedur (NSPK) dan upaya administratif terdokumentasikan dalam sistem informasi kepegawaian?',
        keterangan: '*Pembinaan merupakan kegiatan preventif/pencegahan pelanggaran disiplin (sosialisasi langsung, menggunakan media elektronik, media sosial, dll). Penegakan merupakan penindakan apabila terjadi pelanggaran disiplin. Pemberhentian yang dimaksud adalah pemberhentian yang berkaitan dengan pelanggaran disiplin. Pembinaan satu arah menggunakan flyer, poster, dll, sedangkan pembinaan dua arah dapat berupa kegiatan sosialisasi langsung/virtual, webinar, dll.',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Tidak/belum dilakukan pembinaan disiplin, pemberhentian dan upaya administratif pegawai ASN.' },
          { value: 1, label: 'Telah dilaksanakan pembinaan disiplin, pemberhentian dan upaya administratif pegawai yang berdampak terhadap peningkatan pemahaman regulasi disiplin dan integritas pegawai secara satu arah atau dua arah.' },
          { value: 2, label: 'Telah dilaksanakan pembinaan disiplin, pemberhentian dan upaya administratif pegawai yang berdampak terhadap peningkatan pemahaman regulasi disiplin dan integritas pegawai secara satu arah dan dua arah, secara berkala (minimal 2 kali).' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, dan telah memproses pelanggaran disiplin/pemberhentian/upaya administratif sesuai ketentuan NSPK.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan terdapat pendokumentasian penegakan disiplin/pemberhentian/upaya administratif dalam sistem informasi kepegawaian.' },
        ],
        evidenceHints: [
          'Dokumentasi kegiatan pembinaan seperti daftar hadir, materi pembinaan flyer, dll.',
          'Sampel dokumentasi penegakan disiplin dari Surat Panggilan, BAP, SK hukuman disiplin, dan/atau dokumen lain sesuai dengan jenis hukuman disiplin yang diproses sesuai dengan surat hukuman disiplin',
          'Rekapitulasi kasus disiplin instansi',
          'Tangkap layar pendokumentasian penegakan disiplin/pemberhentian/upaya administratif dalam sistem informasi kepegawaian (termasuk informasi mengenai pemberhentian dan penegakan disiplin instansi pemerintah)',
          'Laporan penegakan disiplin',
        ],
      },
    ],
  },

  // ============================================================
  // ASPEK 8 — DIGITALISASI MANAJEMEN ASN
  // ============================================================
  {
    no: 8,
    title: 'Aspek Digitalisasi Manajemen ASN',
    description: 'Proses manajemen ASN dengan memanfaatkan teknologi digital yang terintegrasi secara sistem dan data oleh Instansi Pemerintah untuk memudahkan penyelenggaraan dan pelayanan manajemen ASN.',
    questions: [
      {
        id: 'a8q1',
        subaspek: 'Data Manajemen ASN',
        question: 'Sejauh mana progres digitalisasi data manajemen ASN di instansi Anda?',
        keterangan: '*Data manajemen ASN berupa: 1. Data pemetaan jabatan yang memuat minimal nama jabatan, ABK, kelas jabatan, dan standar bezzetting jabatan; 2. Data profil pegawai yang memuat minimal biodata pegawai; 3. Data pemetaan kompetensi pegawai; 4. Data pemetaan talenta pegawai; 5. Data pengembangan talenta dan retensi pegawai; 6. Data kenaikan pangkat pegawai; 7. Data pengembangan kompetensi pegawai; 8. Data SKP; 9. Data penilaian kinerja pegawai; 10. Data pemberian penghargaan/sanksi pegawai; 11. Data pelanggaran disiplin pegawai; 12. Data penegakan disiplin pegawai; 13. Data rekapitulasi kenaikan pangkat; 14. Data pembayaran gaji, tunjangan melekat dan tunjangan kinerja/TPP pegawai; 15. Data nominatif pegawai wajib iuran pensiun; 16. Data pemotongan iuran wajib pegawai (iuran pensiun, iuran BPJS, dan potongan pajak); 17. Data bukti pembayaran JKK/JKM',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Data manajemen ASN tidak tersedia secara digital.' },
          { value: 1, label: 'Data manajemen ASN tersedia secara digital untuk sebagian.' },
          { value: 2, label: 'Data manajemen ASN tersedia secara digital seluruhnya.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta seluruh Data manajemen ASN: akurat, mutakhir dan terintegrasi secara internal.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan dimanfaatkan untuk mendukung proses manajerial dalam pengambilan keputusan terkait Manajemen ASN dan terintegrasi secara nasional.' },
        ],
        evidenceHints: [
          'Tangkap layar data manajemen ASN yang sudah terdigitalisasi',
          'Tangkap layar contoh data dari minimal dua jenis yang datanya sinkron (konsisten), akurat, dan terintegrasi',
          'Bukti dukung lain yang menunjukkan pemanfaatan data dalam pengambilan keputusan yang berisi contoh keputusan dan tangkap layar tindak lanjutnya',
        ],
      },
      {
        id: 'a8q2',
        subaspek: 'Layanan Digital Manajemen ASN',
        question: 'Sejauh mana penyediaan layanan digital manajemen ASN yang instansi Anda?',
        keterangan: '*Layanan digital manajemen ASN yang dimaksud adalah: 1. Layanan dasar kepegawaian seperti absensi, pengajuan cuti, pengajuan surat tugas, layanan disposisi/persuratan; 2. Layanan peta jabatan yang digunakan untuk update data Anjab dan ABK serta identifikasi jabatan target, sampai dengan pengisian jabatan target; 3. Layanan manajemen talenta (mulai dari pemetaan talenta, identifikasi jabatan target, sampai dengan pengisian jabatan target); 4. Layanan pengelolaan kinerja (mulai dari perencanaan hingga tindak lanjut evaluasi kinerja); 5. Layanan pengembangan kompetensi (pemetaan kompetensi, perencanaan IDP, ijin tugas belajar, dan pembelajaran mandiri); 6. Layanan keuangan (cetak bukti potong pajak dan slip gaji)',
        type: 'score',
        evidenceRequired: true,
        options: [
          { value: 0, label: 'Layanan digital manajemen ASN tidak tersedia.' },
          { value: 1, label: 'Layanan digital manajemen ASN tersedia sebagian.' },
          { value: 2, label: 'Layanan digital manajemen ASN tersedia seluruhnya.' },
          { value: 3, label: 'Kriteria skor 2 terpenuhi, serta seluruh layanan digital manajemen ASN: aman dan/atau andal.' },
          { value: 4, label: 'Kriteria skor 3 terpenuhi, dan digunakan dengan mudah, cepat dan terintegrasi secara internal.' },
        ],
        evidenceHints: [
          'Tangkap layar layanan digital manajemen ASN',
          'Laporan hasil uji keamanan jika membuat layanan sendiri',
          'Laporan pemanfaatan helpdesk',
          'Bukti testimoni/ulasan dalam pemanfaatan layanan digital manajemen ASN yang menunjukkan mudah, cepat, dan terintegrasi secara internal',
          'Laporan pemanfaatan layanan digital dalam pengambilan keputusan yang berisi contoh keputusan dan tangkap layar tindak lanjutnya',
        ],
      },
    ],
  },
];

// ============================================================
// BAGIAN PROFILING (tidak dihitung skor, dipisah dari 33 pertanyaan)
// ============================================================
const PROFILING_SECTION = {
  no: 9,
  title: 'Profiling Data Penghargaan Instansi Pemerintah',
  description: 'Data profil penghargaan instansi di bidang pengelolaan SDM (tidak memengaruhi skor maturitas).',
  question: 'Apakah instansi Anda pernah memperoleh penghargaan di bidang pengelolaan SDM?',
  fields: ['Nama Penghargaan', 'Penerima Penghargaan', 'Tahun Perolehan', 'Penyelenggara/Pemberi Penghargaan', 'Bukti Dukung'],
};
