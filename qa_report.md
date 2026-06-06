# 🔍 QA REPORT — MyMoney Android
**QA Expert** | Tanggal: 6 Juni 2026 | Platform: Android | Tools: GitHub Issues

---

## 📋 EXECUTIVE SUMMARY

| Item | Detail |
|------|--------|
| **Scope** | Perhitungan keuangan (income/expense/balance), BalanceCarousel (Slide 1–3), filter periode |
| **File Diperiksa** | `calculations.ts`, `useHomeData.ts`, `BalanceCarousel.tsx`, `types/index.ts` |
| **Bug Ditemukan** | 7 Bug (2 Critical, 3 High, 2 Medium) |
| **Status** | ⚠️ **TIDAK LAYAK RELEASE** sebelum bug Critical & High diperbaiki |

---

## 🐛 BUG REPORT

### BUG-001 — Perhitungan `daysPassed` Bisa Menghasilkan Nilai 0 (Sebelum Diclamp)
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-001 |
| **Severity** | 🔴 Critical |
| **Priority** | P1 |
| **File** | `src/utils/calculations.ts` → `calculateProjection()` baris 317 |
| **Deskripsi** | `daysPassed` dihitung dengan `Math.ceil((now - start) / 86400000)`. Jika `now` == `start` (hari pertama periode), hasilnya = 0, kemudian `Math.max(1, 0)` membuat `daysPassed = 1`, **tetapi** `daysRemaining = totalDays - 1`. Ini menyebabkan proyeksi tidak akurat di hari pertama karena semua pengeluaran diasumsikan terjadi dalam 1 hari, padahal periode baru mulai. |
| **Langkah Reproduksi** | 1. Buat income dengan `cyclePeriod = 7` hari ini. 2. Catat 1 expense pada hari yang sama. 3. Lihat Slide 3 proyeksi — nilai "Est. Saldo" akan sangat rendah karena `dailyAvgExpense` dihitung dari 1 hari saja. |
| **Expected** | Hari pertama periode seharusnya tidak memproyeksikan dengan rata-rata harian penuh (divisor = 1 terlalu agresif) |
| **Actual** | Jika pengeluaran hari ini Rp 100.000 dan periode 7 hari, proyeksi = Rp 100.000 × 7 = Rp 700.000 padahal kita baru di hari pertama |
| **Rekomendasi** | Gunakan `daysPassed = Math.max(1, diffDays + 1)` berdasarkan hari kalender, bukan `Math.ceil` yang sensitif terhadap jam |

---

### BUG-002 — `filterTransactionsByTime` Memodifikasi Date Object via `setHours()` In-Place
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-002 |
| **Severity** | 🔴 Critical |
| **Priority** | P1 |
| **File** | `src/utils/calculations.ts` → `filterTransactionsByTime()` baris 278 |
| **Deskripsi** | Di dalam `.filter()`, baris `d.setHours(0,0,0,0)` memodifikasi variabel `d` yang sama yang digunakan untuk perbandingan `d < startOfWeek` di baris 275. Ini adalah **side effect mutation** di dalam fungsi filter — `d` yang sudah di-mutate kemudian di-compare dengan `startOfWeek.getTime()`. Ini dapat menyebabkan transaksi dengan timestamp sore hari (misalnya 23:59) pada hari awal siklus diklasifikasikan secara keliru. |
| **Langkah Reproduksi** | 1. Tambahkan income pembuka siklus pada hari ini jam 08:00. 2. Tambahkan expense hari ini jam 23:59 dengan kategori lain. 3. Filter "Periode" → expense jam 23:59 mungkin tidak muncul. |
| **Expected** | Semua transaksi dalam hari yang sama dengan startOfWeek seharusnya dievaluasi dengan benar |
| **Actual** | Mutation `d.setHours(0,0,0,0)` mengubah nilai `d` yang sudah dipakai untuk cek sebelumnya |
| **Rekomendasi** | Buat salinan: `const dNormalized = new Date(d); dNormalized.setHours(0,0,0,0);` lalu gunakan `dNormalized` untuk compare |

---

### BUG-003 — `openingBalance` untuk Filter `monthly` Tidak Menghitung Opening Balance Hari Ini
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-003 |
| **Severity** | 🟠 High |
| **Priority** | P2 |
| **File** | `src/screens/Home/hooks/useHomeData.ts` baris 44–45 |
| **Deskripsi** | Untuk `timeFilter === "monthly"`, kode menggunakan `startDate = new Date(now.getFullYear(), now.getMonth(), 1)` (sudah benar). Namun untuk `daily` default (sebelum if block), `startDate` diset ke hari ini (`now.getDate()`). Ini berarti jika `timeFilter === "monthly"` dan ada transaksi dari bulan lalu, mereka akan dihitung sebagai opening balance — ini benar. Tetapi **edge case**: jika user switch filter dari "all" ke "monthly" di hari pertama bulan, `openingBalance` = 0 karena tidak ada transaksi sebelum tanggal 1. Ini benar secara logika, tetapi jika `totalIncome = 0` dan `openingBalance = 0`, `filteredBalance` juga 0, menampilkan saldo yang membingungkan. |
| **Expected** | Penjelasan di UI bahwa "belum ada data bulan ini" |
| **Actual** | Saldo tampil Rp 0 tanpa konteks |
| **Rekomendasi** | Tampilkan state "belum ada data untuk periode ini" jika `filteredTransactions.length === 0` |

---

### BUG-004 — `getActiveCycleInfo` Tidak Menangani Transaksi Masa Depan
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-004 |
| **Severity** | 🟠 High |
| **Priority** | P2 |
| **File** | `src/utils/calculations.ts` → `getActiveCycleInfo()` baris 185 |
| **Deskripsi** | Fungsi memeriksa `time <= now.getTime()` untuk menghindari transaksi masa depan, ini benar. Namun jika user memiliki **2 transaksi dengan `cyclePeriod`** (misalnya income pertama 1 Mei dan income kedua 15 Mei), fungsi mengambil yang **terbaru (15 Mei)**. Jika siklus 15 Mei = 30 hari, maka `cyclesPassed` akan melewati 15 Juni, dan `startDate` baru = 15 Juni. Akibatnya, siklus dari 1 Mei tidak pernah dievaluasi, dan **semua transaksi 1–14 Mei menghilang dari filter "Periode"**. |
| **Expected** | Hanya satu income yang bisa menjadi "anchor" siklus aktif, dan user harus diperingatkan |
| **Actual** | Multiple cycle incomes menyebabkan data transaksi menghilang dari filter |
| **Rekomendasi** | Validasi di UI bahwa hanya satu `cyclePeriod` income yang aktif; tampilkan warning jika ada lebih dari satu |

---

### BUG-005 — Slide 2 Bar Ratio: Saat Income = Expense, Bar Tidak 50/50
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-005 |
| **Severity** | 🟡 Medium |
| **Priority** | P3 |
| **File** | `src/screens/Home/components/BalanceCarousel.tsx` → Slide2 baris 565–567 |
| **Deskripsi** | `incomeRatio` dan `expenseRatio` dihitung dari `total = filteredIncome + filteredExpense`. Jika income = expense = 500.000, total = 1.000.000, masing-masing = 50%. **Animasi bar** dimulai dari 0 dan target ke 50%. Namun `Math.max(incomeBarWidth.value, 1)` memastikan minimal 1% selalu tampil. Artinya ketika `filteredIncome = 0` dan `filteredExpense > 0`, income bar tetap terlihat 1% (misleading). |
| **Expected** | Saat income = 0, income bar seharusnya tidak tampil sama sekali |
| **Actual** | Income bar selalu minimal 1% meskipun tidak ada pemasukan |
| **Rekomendasi** | Ganti dengan `Math.max(incomeBarWidth.value, incomeRatio > 0 ? 1 : 0)` |

---

### BUG-006 — `Slide1` Menampilkan `Math.abs(balance)` — Saldo Negatif Tidak Jelas
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-006 |
| **Severity** | 🟡 Medium |
| **Priority** | P3 |
| **File** | `src/screens/Home/components/BalanceCarousel.tsx` → Slide1 baris 404 |
| **Deskripsi** | `formatCurrency(Math.abs(safeNumber(props.balance)))` selalu menampilkan nilai positif. Warna teks diubah ke merah saat negatif (`G_ERROR`), yang sudah benar. Namun tanda minus `-` tidak ditampilkan di depan angka, sehingga user mungkin bingung: angka merah tanpa tanda minus. |
| **Expected** | Saldo negatif tampil sebagai `-Rp 500.000` dengan warna merah |
| **Actual** | Tampil `Rp 500.000` dengan warna merah — tanpa tanda minus |
| **Rekomendasi** | Tampilkan prefix `-` saat `balance < 0`: `${props.balance < 0 ? "-" : ""}${formatCurrency(Math.abs(...))}` |

---

### BUG-007 — `projectionData` Untuk Filter `yearly` Menggunakan 31 Desember Hardcoded
| Field | Detail |
|-------|--------|
| **Bug ID** | BUG-007 |
| **Severity** | 🟠 High |
| **Priority** | P2 |
| **File** | `src/screens/Home/hooks/useHomeData.ts` baris 493 |
| **Deskripsi** | `endDate = new Date(now.getFullYear(), 11, 31)` → ini mengasumsikan hari terakhir tahun adalah 31 Desember. Ini benar untuk kalender Gregorian, **tetapi** `calculateProjection` menghitung `totalDays = Math.ceil((end - start) / 86400000)`. Dengan `endDate.setHours(23,59,59,999)` yang tidak dipanggil di `projectionData`, end time = 00:00:00. Sehingga `totalDays` bisa off-by-1 (364 hari bukan 365). |
| **Expected** | `totalDays` = 365 (atau 366 tahun kabisat) |
| **Actual** | Bisa = 364 karena end date tanpa setHours(23,59,59,999) |
| **Rekomendasi** | Tambahkan `endDate.setHours(23, 59, 59, 999)` setelah set endDate yearly |

---

## ✅ TEST CASE — Perhitungan Income/Expense/Balance per Periode

### TC-001: Happy Path — Filter Monthly

| Field | Detail |
|-------|--------|
| **TC ID** | TC-001 |
| **Nama** | Perhitungan total income bulan ini |
| **Precondition** | Ada 3 transaksi income bulan ini: Rp 1.000.000, Rp 500.000, Rp 250.000 |
| **Steps** | 1. Set `timeFilter = "monthly"` → 2. Lihat Slide 1 "Masuk" |
| **Expected** | Rp 1.750.000 |
| **Priority** | P1 |

---

### TC-002: Happy Path — Filter Yearly

| Field | Detail |
|-------|--------|
| **TC ID** | TC-002 |
| **Nama** | Perhitungan total expense tahun ini |
| **Precondition** | Ada expense: Jan Rp 100.000, Mar Rp 200.000, Jun Rp 150.000 |
| **Steps** | 1. Set `timeFilter = "yearly"` → 2. Lihat Slide 1 "Keluar" |
| **Expected** | Rp 450.000 |
| **Priority** | P1 |

---

### TC-003: Happy Path — Net Kas (Slide 2 Footer)

| Field | Detail |
|-------|--------|
| **TC ID** | TC-003 |
| **Nama** | Net Kas = Income - Expense |
| **Precondition** | Income = Rp 2.000.000, Expense = Rp 800.000 |
| **Steps** | 1. Set filter periode → 2. Lihat "Net Kas" di footer Slide 2 |
| **Expected** | +Rp 1.200.000 (warna hijau) |
| **Priority** | P1 |

---

### TC-004: Edge Case — Balance Negatif (Defisit)

| Field | Detail |
|-------|--------|
| **TC ID** | TC-004 |
| **Nama** | Saldo negatif tampil benar |
| **Precondition** | Income = Rp 500.000, Expense = Rp 800.000 |
| **Steps** | 1. Lihat Slide 1 saldo utama |
| **Expected** | Angka merah dengan penanda negatif, badge "Defisit" di Slide 2 |
| **Priority** | P1 |
| **⚠️ Bug** | BUG-006: Tanda minus tidak tampil |

---

### TC-005: Edge Case — Tidak Ada Transaksi

| Field | Detail |
|-------|--------|
| **TC ID** | TC-005 |
| **Nama** | State kosong — belum ada transaksi |
| **Precondition** | `transactions = []` |
| **Steps** | 1. Buka Home → 2. Lihat semua Slide |
| **Expected** | Slide 1: "Rp 0", teks "Mulai catat transaksi pertamamu" |
| **Priority** | P2 |

---

### TC-006: Edge Case — Filter Weekly dengan Cycle Period

| Field | Detail |
|-------|--------|
| **TC ID** | TC-006 |
| **Nama** | Filter periode 7 hari menggunakan cycle anchor |
| **Precondition** | Income hari ini dengan `cyclePeriod = 7`, + 3 expense hari ini |
| **Steps** | 1. Set `timeFilter = "weekly"` → 2. Lihat total di Slide 1 |
| **Expected** | Hanya transaksi dalam 7 hari sejak income cycle yang masuk |
| **Priority** | P1 |

---

### TC-007: Edge Case — Ganti Filter (monthly → weekly → yearly)

| Field | Detail |
|-------|--------|
| **TC ID** | TC-007 |
| **Nama** | Konsistensi saat ganti filter |
| **Precondition** | Ada transaksi di berbagai periode |
| **Steps** | 1. Pilih monthly → catat nilai → 2. Pilih weekly → 3. Pilih yearly |
| **Expected** | Setiap filter menampilkan data yang benar dan tidak cross-contaminate |
| **Priority** | P1 |

---

### TC-008: Edge Case — Opening Balance Dihitung Benar

| Field | Detail |
|-------|--------|
| **TC ID** | TC-008 |
| **Nama** | Opening balance bulan sebelumnya tersinkronisasi |
| **Precondition** | Income bulan lalu Rp 3jt, expense bulan lalu Rp 1jt; bulan ini income Rp 500.000 |
| **Steps** | 1. Filter = monthly → 2. Lihat "Termasuk saldo awal" di Slide 1 |
| **Expected** | Opening balance = +Rp 2.000.000, total saldo = Rp 2.500.000 |
| **Priority** | P1 |

---

### TC-009: Negative Case — Amount = 0

| Field | Detail |
|-------|--------|
| **TC ID** | TC-009 |
| **Nama** | Transaksi dengan amount nol |
| **Precondition** | Tambah expense dengan amount = 0 |
| **Steps** | 1. Cek total expense |
| **Expected** | Tidak mengubah total, saldo tetap sama |
| **Priority** | P2 |

---

### TC-010: Negative Case — Amount = NaN / String Invalid

| Field | Detail |
|-------|--------|
| **TC ID** | TC-010 |
| **Nama** | `safeNumber` menangani input tidak valid |
| **Precondition** | Data korup: `amount = "abc"` atau `amount = undefined` |
| **Steps** | Evaluasi `safeNumber("abc")`, `safeNumber(undefined)`, `safeNumber(Infinity)` |
| **Expected** | Semua return 0, tidak crash |
| **Priority** | P1 |
| **Status** | ✅ Sudah di-handle di `safeNumber()` |

---

### TC-011: Negative Case — Tanggal Invalid

| Field | Detail |
|-------|--------|
| **TC ID** | TC-011 |
| **Nama** | Transaksi dengan tanggal tidak valid |
| **Precondition** | `date = "2026-13-45"` atau `date = ""` |
| **Steps** | Filter any → transaksi harus tidak crash |
| **Expected** | Transaksi diabaikan dari filter (return false) |
| **Priority** | P1 |
| **Status** | ✅ Sudah di-handle `isNaN(d.getTime()) return false` |

---

### TC-012: Performance — 1000+ Transaksi

| Field | Detail |
|-------|--------|
| **TC ID** | TC-012 |
| **Nama** | Performa filter dan kalkulasi dengan data besar |
| **Precondition** | Mock 1000 transaksi |
| **Steps** | Switch filter monthly → yearly → weekly berulang |
| **Expected** | UI tidak freeze, semua `useMemo` di-evaluate benar |
| **Priority** | P2 |

---

## ✅ TEST CASE — BalanceCarousel: Naik/Turun & Proyeksi

### TC-013: Slide 1 — Chip Naik/Turun

| Field | Detail |
|-------|--------|
| **TC ID** | TC-013 |
| **Nama** | Indikator trending-up muncul saat surplus |
| **Precondition** | `filteredPeriodNetto > 0` |
| **Steps** | Lihat chip di pojok kanan atas Slide 1 |
| **Expected** | Icon `trending-up` hijau, label "+Rp X" |
| **Priority** | P1 |

---

### TC-014: Slide 1 — Chip Saat Netto = 0

| Field | Detail |
|-------|--------|
| **TC ID** | TC-014 |
| **Nama** | Chip tidak muncul saat netto = 0 |
| **Precondition** | Income = Expense = Rp 500.000 |
| **Steps** | Lihat pojok kanan atas Slide 1 |
| **Expected** | Chip tidak muncul (`hasChange = false`) |
| **Priority** | P2 |

---

### TC-015: Slide 2 — Progress Bar Proporsi

| Field | Detail |
|-------|--------|
| **TC ID** | TC-015 |
| **Nama** | Bar income dan expense proporsional |
| **Precondition** | Income = Rp 1jt, Expense = Rp 3jt (total Rp 4jt) |
| **Steps** | Lihat Slide 2 bar chart |
| **Expected** | Income bar ≈ 25%, Expense bar ≈ 75% |
| **Priority** | P1 |
| **⚠️ Bug** | BUG-005: Bar minimal 1% meski income = 0 |

---

### TC-016: Slide 3 — Proyeksi Hari Pertama Periode

| Field | Detail |
|-------|--------|
| **TC ID** | TC-016 |
| **Nama** | Proyeksi di hari pertama tidak terlalu agresif |
| **Precondition** | Expense = Rp 100.000 pada hari 1 dari 7 |
| **Steps** | Lihat Slide 3 "Est. Saldo" |
| **Expected** | Proyeksi tidak melebihi 2× pengeluaran aktual |
| **Priority** | P1 |
| **⚠️ Bug** | BUG-001: Proyeksi = Rp 700.000 (terlalu agresif) |

---

### TC-017: Slide 3 — Progress Bar Periode

| Field | Detail |
|-------|--------|
| **TC ID** | TC-017 |
| **Nama** | Progress bar periode berjalan akurat |
| **Precondition** | Hari ini = hari ke-3 dari periode 7 hari |
| **Steps** | Lihat gauge bar di Slide 3 |
| **Expected** | Bar ≈ 42–43% (3/7 × 100) |
| **Priority** | P1 |

---

### TC-018: Slide 3 — Status Warna

| Field | Detail |
|-------|--------|
| **TC ID** | TC-018 |
| **Nama** | Status color sesuai kondisi keuangan |
| **Cases** | Surplus → hijau "Aman" \| Warning (< Rp 1jt negatif) → kuning "Hati-hati" \| Defisit besar → merah "Waspada" |
| **Priority** | P1 |

---

## 📊 RISK MATRIX

| Bug ID | Severity | Probability | Risk Level | Action |
|--------|----------|-------------|------------|--------|
| BUG-001 | Critical | High | 🔴 CRITICAL | Fix Before Release |
| BUG-002 | Critical | Medium | 🔴 CRITICAL | Fix Before Release |
| BUG-004 | High | Medium | 🟠 HIGH | Fix Before Release |
| BUG-007 | High | High (akhir tahun) | 🟠 HIGH | Fix Before Release |
| BUG-003 | High | Medium | 🟠 HIGH | Fix Before Release |
| BUG-005 | Medium | High | 🟡 MEDIUM | Fix Next Sprint |
| BUG-006 | Medium | High | 🟡 MEDIUM | Fix Next Sprint |

---

## 🆕 FITUR BARU: "Berapa Hari Lagi Periode Berakhir"

**Status: DIIMPLEMENTASIKAN** ✅

Fitur ditambahkan di bagian bawah setiap card carousel dengan teks kecil kontekstual:
- Filter **mingguan/periode**: `"Periode berakhir dalam X hari"`
- Filter **bulanan**: `"Bulan berakhir dalam X hari"`
- Filter **tahunan**: `"Tahun berakhir dalam X hari"`
- Filter **all**: tidak tampil (tidak relevan)

Implementasi: `BalanceCarousel.tsx` — setiap Slide 1, 2, 3 menerima `projectionData.daysRemaining` dan `timeFilter` lalu menampilkan teks di bagian bawah card.

---

## 📋 QA STRATEGY RINGKASAN

### Entry Criteria
- [ ] Semua BUG Critical (BUG-001, BUG-002) diperbaiki
- [ ] Build berhasil tanpa error TypeScript
- [ ] Test case TC-001 s/d TC-007 pass

### Exit Criteria
- [ ] Semua TC-001 hingga TC-018 pass
- [ ] Tidak ada bug Severity Critical atau High yang open
- [ ] Manual testing di Android device (min API 29)
- [ ] Fitur "hari lagi periode berakhir" tampil benar di semua 3 slide dan semua filter

### Recommended Test Data
```
Income: Rp 5.000.000 (hari pertama bulan)
Expense 1: Rp 150.000 — Makan
Expense 2: Rp 80.000 — Transport  
Expense 3: Rp 500.000 — Belanja
Income cycle 7 hari: Rp 2.000.000
```
