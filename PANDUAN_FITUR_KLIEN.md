# 📱 Panduan Resmi Fitur: Siklus Periode & Batas Belanja Harian (MyMoney)

Dokumen ini menjelaskan fungsi dan cara kerja dari dua fitur utama di aplikasi **MyMoney**:
1. **Fitur "Mulai Periode Baru"** (Siklus Keuangan Pemasukan).
2. **Fitur "Batas Uang / Jatah Belanja Harian"** (*Safe Daily Spending*).

---

## 🎯 1. Mengapa Fitur Ini Dibuat? (Masalah yang Diselesaikan)

Banyak orang memiliki siklus keuangan yang **tidak selalu mengikuti kalender masehi biasa (tanggal 1 sampai 30)**:
* Ada yang **gajian setiap tanggal 25**.
* Mahasiswa / anak kos mendapat **uang saku setiap hari Senin untuk 7 hari**.
* Pekerja lepas (*Freelancer*) mendapat **uang proyek untuk bekal hidup 14–30 hari**.

Jika hanya memakai kalender biasa, uang gajian sering habis di tengah jalan sebelum waktunya.

Fitur ini hadir seperti **"MEMASANG ALARM / HITUNG MUNDUR"** pada uang Anda, sehingga aplikasi akan membagi rata uang Anda dan memberi tahu berapa maksimal uang yang boleh Anda belanjakan setiap hari agar tidak boncos sebelum gajian berikutnya.

---

## ⚙️ 2. Kapan Harus Menyalakan "Mulai Periode Baru"?

Fitur ini muncul saat Anda mencatat transaksi **Pemasukan**.

### 🟢 A. NYALAKAN Sakelar "Mulai Periode Baru" (Aktif)
* **Kapan dipakai:** Jika uang yang masuk adalah **Gaji Pokok / Uang Nafkah / Uang Saku Utama**.
* **Pilihan Durasi:** `7 Hari`, `30 Hari`, atau `Kustom` (sesuai kebutuhan Anda).
* **Efeknya di Aplikasi:**
  1. Tanggal uang masuk tersebut dijadikan **Hari Ke-1**.
  2. Aplikasi memasang hitung mundur sisa hari (misal: *"Periode berakhir dalam 5 hari"*).
  3. Aplikasi otomatis mematok **Batas Belanja Aman per hari** dari uang tersebut.

### ⚪ B. MATIKAN Sakelar "Mulai Periode Baru" (Non-aktif)
* **Kapan dipakai:** Jika uang yang masuk adalah **Uang Tambahan / Bonus / Cashback / Piutang yang Dibayar Teman**.
* **Efeknya di Aplikasi:**
  1. Saldo dompet Anda otomatis bertambah biasa.
  2. Perhitungan hitung mundur gajian Anda **TIDAK akan terganggu/berubah**.

---

## 📊 3. Bagaimana Cara Kerja "Batas Uang Harian" di Beranda?

Aplikasi MyMoney secara cerdas menghitung batas belanja harian Anda di layar Beranda:

| Kondisi Pengguna | Rumus Perhitungan | Tujuan & Manfaat |
| :--- | :--- | :--- |
| **Kondisi 1: Ada Anggaran (Budget)** | $$\text{Jatah Harian} = \frac{\text{Sisa Anggaran Total}}{\text{Sisa Hari}}$$ | Mengontrol agar target batas anggaran bulanan tidak jebol. |
| **Kondisi 2: Belum Ada Anggaran** | $$\text{Jatah Harian} = \frac{\text{Total Saldo Kas}}{\text{Sisa Hari}}$$ | Menjaga saldo kas dompet agar bertahan sampai akhir periode. |

> 💡 **Kelebihan Fitur:**  
> Fitur Batas Uang Harian ini **SELALU AKTIF** di beranda:
> * Jika pengguna pakai **Periode Baru** $\to$ Dibagi sesuai sisa hari durasi uang tersebut.
> * Jika pengguna **tanpa Periode Baru** $\to$ Otomatis dibagi ke sisa hari kalender bulan ini (sampai tanggal 30/31).

---

## 📝 4. Tutorial Penggunaan Langkah Demi Langkah

1. Buka aplikasi **MyMoney**, tekan tombol Tambah Transaksi (**+**).
2. Pilih jenis transaksi **Pemasukan**.
3. Ketik jumlah uangnya (Contoh: `Rp 2.100.000` untuk uang saku / gaji).
4. Nyalakan sakelar **"Mulai Periode Baru"**, lalu pilih durasinya (Contoh: pilih **7 Hari** atau **30 Hari**).
5. Tekan tombol **Simpan Transaksi**.
6. **Lihat Hasilnya di Halaman Beranda:**
   * Geser slider kartu ke **Slide 3 (KONTROL ANGGARAN)**: Anda akan melihat jatah belanja Anda, misalnya: `Rp 70.000 /hari` lengkap dengan hitung mundur sisa hari menuju gajian berikutnya.
   * Pada widget **Statistik** di bawah, angka **Batas Uang** akan otomatis sama persis dan sinkron.

---

## 📌 Rangkuman Singkat

* **Uang Jatah / Gaji?** $\to$ **NYALAKAN** *"Mulai Periode Baru"*.
* **Uang Bonus / Tambahan?** $\to$ **MATIKAN** *"Mulai Periode Baru"*.
* **Lihat Batas Belanja Aman?** $\to$ Buka **Beranda** (Slide 3 Kartu & Widget Statistik Bawah).
