// File: src/components/Tutorial/AppGuidebookModal.tsx
import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

const triggerLayoutAnimation = () => {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch {
    // Fallback safe
  }
};

const { width } = Dimensions.get("window");

export type GuideCategory =
  | "all"
  | "home"
  | "transactions"
  | "budget_savings"
  | "recurring_debt"
  | "analytics_calendar"
  | "data_system";

export interface FeatureGuideItem {
  id: string;
  name: string; // 100% Sesuai nama tombol / label resmi di aplikasi
  category: GuideCategory;
  categoryLabel: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  location: string;
  analogy: string; // Analogi Nyata (Sangat Mudah Dipahami)
  summary: string; // Fungsi Utama (Fungsinya Buat Apa)
  howItWorks: string[]; // Cara Kerja Sistem di Balik Layar
  steps: string[]; // Langkah Praktis Pakai
  impact: string; // Dampak Finansial Nyata
  proTip: string; // Tips Pro
  actionTarget?: string;
  actionLabel?: string;
}

interface AppGuidebookModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateAction?: (target: string) => void;
  initialFeatureId?: string;
}

export const AppGuidebookModal: React.FC<AppGuidebookModalProps> = ({
  visible,
  onClose,
  onNavigateAction,
  initialFeatureId,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>("all");
  const [expandedId, setExpandedId] = useState<string | null>(initialFeatureId || "payday_cycle");

  const categories: { id: GuideCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "all", label: "Semua Fitur", icon: "sparkles-outline" },
    { id: "home", label: "Beranda & Pembukuan", icon: "home-outline" },
    { id: "transactions", label: "Transaksi & Struk", icon: "receipt-outline" },
    { id: "budget_savings", label: "Anggaran & Tabungan", icon: "pie-chart-outline" },
    { id: "recurring_debt", label: "Rutin & Hutang", icon: "repeat-outline" },
    { id: "analytics_calendar", label: "Analisis & Kalender", icon: "bar-chart-outline" },
    { id: "data_system", label: "Data & Sistem", icon: "shield-checkmark-outline" },
  ];

  // Daftar Panduan Lengkap Seluruh 27 Fitur MyMoney (Nama 100% Sesuai Aplikasi + Analogi Nyata)
  const guideData: FeatureGuideItem[] = useMemo(
    () => [
      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 1: BERANDA & PEMBUKUAN (PONDASI UTAMA SISTEM)
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "payday_cycle",
        name: "Awal Pembukuan Bulanan",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Pondasi Utama Sistem",
        icon: "calendar-outline",
        color: colors.accent,
        location: "Pengaturan ➔ Tab Pembukuan ➔ Awal Pembukuan Bulanan",
        analogy:
          "Ibarat mengisi tangki bensin kendaraan sampai penuh setiap tanggal 25 (atau tanggal 1). Anda mengatur patokan awal perhitungan tepat saat dana masuk atau saat pembukuan baru dimulai, BUKAN memaksakan selalu di tanggal 1 kalender jika ritme keuangan Anda berbeda. Ini memastikan catatan dan perkiraan sisa uang selalu cocok dengan ritme nyata hidup Anda!",
        summary:
          "Menentukan tanggal awal dimulainya pembukuan bulanan Anda (misal tanggal 25 atau tanggal 1). Menyelaraskan seluruh sistem aplikasi dengan ritme pemasukan riil Anda (uang bulanan, honor, omzet, atau transfer berkala).",
        howItWorks: [
          "Rentang Pembukuan Bulanan: Jika Anda menyetel tanggal 25, maka rentang 'Bulan Ini' dihitung dari tanggal 25 bulan lalu hingga tanggal 24 bulan berjalan (contoh: 25 Agustus s/d 24 September).",
          "Reset Anggaran Otomatis: Kuota anggaran bulanan (makan, bensin, dll) otomatis diperbarui saat tanggal awal pembukuan tiba, tepat saat dana baru masuk.",
          "Sinkronisasi Transaksi Rutin: Jadwal pemasukan berkala otomatis diselaraskan dengan tanggal awal pembukuan Anda.",
          "Kalkulator Batas Harian Cerdas: Menghitung sisa hari mundur menuju tanggal awal pembukuan berikutnya sebagai pembagi sisa kas.",
          "Penanganan Bulan Pendek: Jika diset tanggal 29, 30, atau 31, sistem otomatis meng-clamp ke akhir bulan jika bulan tersebut lebih pendek (seperti 28/29 Februari) tanpa error.",
        ],
        steps: [
          "Buka menu Pengaturan ➔ Tab Pembukuan.",
          "Ketuk menu 'Awal Pembukuan Bulanan'.",
          "Pilih tanggal awal pembukuan Anda (contoh: 25 atau 1) lalu tekan 'Simpan Tanggal Pembukuan'.",
          "Kembali ke Beranda: seluruh ringkasan kas, mutasi bulan ini, dan anggaran seketika teratur mengikuti ritme pembukuan Anda!",
        ],
        impact:
          "Menghilangkan kebingungan antara tanggal kalender umum dengan ritme keluar-masuk uang Anda yang sebenarnya. Laporan keuangan Anda menjadi 100% akurat sesuai realita.",
        proTip:
          "Baik Anda freelancer, wiraswasta, pelajar, maupun pekerja kantoran, Anda bisa menyetel atau mengubah tanggal ini kapan saja tanpa merusak riwayat transaksi masa lalu.",
        actionTarget: "Home",
        actionLabel: "Buka Beranda & Cek Pembukuan",
      },
      {
        id: "daily_safe_limit",
        name: "Batas Harian Aman",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Penyelamat Dompet",
        icon: "shield-checkmark-outline",
        color: colors.success,
        location: "Layar Beranda (Kartu Ringkasan Keuangan)",
        analogy:
          "Ibarat ransum makanan saat mendaki gunung. Jika Anda punya 30 bungkus mie untuk 30 hari pendakian, jatah aman Anda adalah 1 bungkus per hari. Jika hari ini Anda berpuasa, besok jatah Anda menjadi 2 bungkus. Tetapi jika di hari pertama Anda pesta menghabiskan 10 bungkus, di akhir bulan Anda dipastikan kelaparan di puncak gunung.",
        summary:
          "Menghitung batas maksimal pengeluaran harian yang aman secara dinamis berdasarkan sisa kas bulan ini dibagi sisa hari menuju akhir bulan pembukuan.",
        howItWorks: [
          "Rumus Dinamis: (Sisa Kas Bulan Ini) ÷ (Sisa Hari Menuju Awal Pembukuan Berikutnya).",
          "Dinamika Dua Arah: Jika hari ini belanja di bawah batas aman, sisa jatahnya otomatis memperbesar batas aman hari-hari berikutnya.",
          "Koreksi Otomatis: Jika hari ini Anda belanja berlebih karena keperluan mendesak, sistem otomatis memperkecil jatah hari esok agar uang Anda tetap bertahan sampai akhir bulan.",
        ],
        steps: [
          "Buka Beranda setiap pagi dan lihat angka 'Batas Harian Aman'.",
          "Jadikan angka tersebut sebagai patokan batas maksimal belanja harian atau jajan hari ini.",
          "Catat transaksi sesaat setelah berbelanja agar kalkulator langsung memperbarui angka sisa.",
        ],
        impact:
          "Menghilangkan rasa bersalah saat berbelanja karena Anda tahu pasti nominal belanja harian yang aman tanpa takut kehabisan uang di akhir bulan.",
        proTip:
          "Cek angka ini sebelum membuka aplikasi pesan antar makanan online atau checkout keranjang belanja!",
        actionTarget: "Home",
        actionLabel: "Cek Batas Harian di Beranda",
      },
      {
        id: "financial_projection",
        name: "Proyeksi Keuangan",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Radar Peramalan Kas",
        icon: "trending-up-outline",
        color: colors.info,
        location: "Layar Beranda (Kartu Proyeksi Saldo)",
        analogy:
          "Ibarat radar bahan bakar dan kecepatan di dashboard pesawat terbang. Jika pilot terbang terlalu kencang membakar avtur padahal bandara tujuan masih jauh, radar akan menyalakan lampu kuning/merah: 'Bahan bakar tidak cukup sampai tujuan jika kecepatan jelajah tidak segera dikurangi!'.",
        summary:
          "Menganalisis laju belanja harian Anda (burn rate) dan memproyeksikan apakah kas Anda akan surplus (hijau), mepet (kuning), atau minus/defisit (merah) saat akhir bulan pembukuan tiba.",
        howItWorks: [
          "Menghitung rata-rata pengeluaran harian riil Anda sejak hari pertama pembukuan bulan berjalan.",
          "Mengalikan laju pengeluaran tersebut dengan sisa hari yang masih harus dilalui sampai akhir bulan pembukuan.",
          "Membandingkan hasil estimasi dengan kas yang tersedia dan menyajikan sinyal warna status visual.",
        ],
        steps: [
          "Lihat kartu 'Proyeksi Keuangan' di Beranda.",
          "Perhatikan warna indikator: Hijau (Surplus Aman), Kuning (Waspada Mepet), Merah (Potensi Defisit).",
          "Jika warna kuning atau merah, segera rem pengeluaran non-esensial selama beberapa hari ke depan.",
        ],
        impact:
          "Memberikan peringatan dini (early warning system) 10-15 hari sebelum uang Anda habis, sehingga Anda punya waktu memulihkan ritme belanja sebelum kas benar-benar menipis.",
        proTip:
          "Bandingkan angka proyeksi saldo akhir dengan target tabungan Anda untuk memastikan rencana masa depan tetap tercapai.",
        actionTarget: "Home",
        actionLabel: "Lihat Proyeksi di Beranda",
      },
      {
        id: "balance_summary",
        name: "Sisa Kas Bulan Ini vs Saldo Total",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Pemisah Brankas & Dompet",
        icon: "wallet-outline",
        color: colors.purple,
        location: "Layar Beranda (Carousel Kartu Saldo Utama)",
        analogy:
          "Saldo Total adalah isi seluruh brankas besi di kamar Anda (termasuk tabungan dan cadangan dana). Sedangkan Sisa Kas Bulan Ini adalah uang di dompet belanja yang dialokasikan untuk kebutuhan hidup sehari-hari hingga akhir bulan pembukuan.",
        summary:
          "Membedakan dengan tegas antara total kekayaan kas bersih yang Anda miliki dengan jatah uang belanja bulan berjalan saat ini.",
        howItWorks: [
          "Slide Saldo Total: Akumulasi seluruh pemasukan dikurangi seluruh pengeluaran sejak pertama kali mencatat.",
          "Slide Sisa Kas Bulan Ini: Pemasukan bulan berjalan dikurangi belanja bulan berjalan.",
          "Slide Pengeluaran Terbanyak: Analisis kategori pengeluaran terbesar yang menyerap kas bulan ini.",
        ],
        steps: [
          "Geser kartu saldo utama di Beranda ke kanan atau kiri.",
          "Gunakan 'Sisa Kas Bulan Ini' untuk mengambil keputusan belanja harian.",
          "Gunakan 'Saldo Total' untuk melihat pertumbuhan aset kas bersih Anda.",
        ],
        impact:
          "Mencegah ilusi kekayaan semu (phantom wealth) di mana seseorang merasa masih punya banyak uang di rekening padahal uang itu adalah tabungan bayar sewa atau dana darurat.",
        proTip:
          "Ketuk ikon mata di pojok kartu untuk menyembunyikan nominal saldo saat Anda membuka aplikasi di tempat umum atau transportasi publik.",
        actionTarget: "Home",
        actionLabel: "Buka Carousel Saldo",
      },
      {
        id: "cycle_income_tracking",
        name: "Atur Target Uang Bertahan (Alokasi Jatah Harian)",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Alokasi Ransum Kas",
        icon: "infinite-outline",
        color: colors.accent,
        location: "Formulir Catat Pemasukan ➔ Toggle 'Atur Target Uang Bertahan'",
        analogy:
          "Ibarat menuangkan satu galon air mineral baru ke dispenser kantor atau kos. Anda menempelkan label: 'Galon ini untuk minum 14 hari ke depan'. Aplikasi akan menghitung jatah tetesan air harian agar dispenser tidak kosong sebelum hari ke-14.",
        summary:
          "Fitur saat menerima pemasukan (uang bulanan, honor proyek, uang saku mingguan, atau pendapatan jualan) untuk menentukan berapa hari uang tersebut harus bertahan agar sistem membaginya menjadi jatah belanja harian yang aman.",
        howItWorks: [
          "Saat mencatat pemasukan, aktifkan toggle 'Atur Target Uang Bertahan' dan tentukan durasi (misal: 7 hari, 14 hari, atau 30 hari).",
          "Sistem langsung menghitung simulasi jatah belanja harian yang aman selama durasi tersebut.",
          "Beranda secara otomatis menyesuaikan perhitungan Batas Harian Aman agar dana bertahan optimal hingga hari terakhir.",
        ],
        steps: [
          "Tekan tombol (+) ➔ Pilih Pemasukan.",
          "Masukkan nominal uang (misal: Rp 1.400.000).",
          "Aktifkan opsi 'Atur Target Uang Bertahan' ➔ Pilih '14 Hari (2 Mgg)'.",
          "Lihat simulasi live: ~Rp 100.000/hari selama 14 hari ke depan.",
          "Simpan transaksi. Beranda otomatis menjaga jatah belanja harian Anda tetap aman.",
        ],
        impact:
          "Sangat cocok untuk semua kalangan: pekerja lepas, mahasiswa/pelajar dengan uang saku berkala, ibu rumah tangga pengatur uang belanja, hingga pedagang dan wirausaha.",
        proTip:
          "Jika Anda menerima uang saku atau honor tambahan di pertengahan bulan, atur target bertahan sampai tanggal akhir bulan pembukuan agar dana tidak langsung habis.",
        actionTarget: "AddTransaction",
        actionLabel: "Coba Catat Pemasukan",
      },
      {
        id: "time_filters",
        name: "Filter Rentang Waktu (Mingguan, Bulan Ini, Tahun Ini, Semua)",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Navigasi Kacamata Kas",
        icon: "options-outline",
        color: colors.accent,
        location: "Layar Beranda & Riwayat Transaksi (Tab Filter)",
        analogy:
          "Ibarat menggunakan lensa kamera: Anda bisa memperbesar untuk melihat detail hari-hari ini (Mingguan), melihat panorama pembukuan bulan berjalan (Bulan Ini), atau melihat pemandangan luas seluruh tahun finansial Anda (Tahun Ini & Semua).",
        summary:
          "Pilihan cepat untuk mengubah rentang laporan pembukuan dari skala mingguan, bulan pembukuan aktif, rekap tahunan, hingga total keseluruhan.",
        howItWorks: [
          "'Mingguan': Memfilter transaksi dari hari Senin sampai Minggu berjalan.",
          "'Bulan Ini': Memfilter transaksi dalam rentang bulan pembukuan aktif Anda (misal: 25 Ags - 24 Sep atau 1 - 30 Sep).",
          "'Tahun Ini': Memfilter transaksi dari 1 Januari sampai 31 Desember tahun berjalan.",
          "'Semua': Menampilkan total seluruh riwayat transaksi sepanjang waktu.",
        ],
        steps: [
          "Ketuk salah satu tab filter di bawah ringkasan kartu Beranda.",
          "Perhatikan seluruh kartu grafik, total pengeluaran, dan pemasukan langsung menyesuaikan dalam sekejap.",
        ],
        impact:
          "Memungkinkan Anda melakukan evaluasi jangka pendek (mingguan) maupun evaluasi strategis jangka panjang (tahunan) dalam 1 sentuhan.",
        proTip:
          "Gunakan filter 'Mingguan' saat akhir pekan untuk mengevaluasi apakah pengeluaran sabtu-minggu Anda terkendali.",
        actionTarget: "Home",
        actionLabel: "Ganti Filter Waktu",
      },

      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 2: TRANSAKSI & STRUK
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "add_transaction",
        name: "Catat Transaksi (Pemasukan & Pengeluaran)",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Jantung Pembukuan",
        icon: "add-circle-outline",
        color: colors.success,
        location: "Tombol (+) Hijau Melayang di Bagian Bawah Layar",
        analogy:
          "Ibarat menyalakan lampu senter di ruangan gelap gulita. Tanpa mencatat, uang kas Anda bocor seperti air merembes di lantai gelap tanpa Anda tahu di mana titik bocornya.",
        summary:
          "Mencatat setiap aliran uang kas masuk atau uang keluar harian lengkap dengan nominal, kategori pos, tanggal, catatan, dan bukti fisik.",
        howItWorks: [
          "Mutasi Pengeluaran otomatis memotong Saldo Kas dan menambah beban belanja kategori serta kuota anggaran terkait.",
          "Mutasi Pemasukan otomatis menambah Saldo Kas dan menaikkan batas jatah harian aman.",
          "Mendukung pemilihan tanggal lampau (backdate) jika Anda baru sempat mencatat transaksi beberapa hari lalu.",
        ],
        steps: [
          "Tekan tombol (+) melayang di tengah bawah layar.",
          "Pilih jenis mutasi: 'Pengeluaran' (merah) atau 'Pemasukan' (hijau).",
          "Ketik nominal uang, pilih kategori pos belanja, dan ketik keterangan opsional.",
          "Tekan 'Simpan Transaksi'. Seluruh saldo dan grafik langsung terupdate.",
        ],
        impact:
          "Merekam jejak digital setiap rupiah uang Anda, menghilangkan fenomena 'uang habis entah ke mana' di akhir bulan.",
        proTip:
          "Biasakan mencatat tepat setelah transaksi terjadi (seperti saat menerima kembalian kasir) agar tidak ada nominal kecil yang terlupakan.",
        actionTarget: "AddTransaction",
        actionLabel: "Catat Transaksi Sekarang",
      },
      {
        id: "sub_transactions",
        name: "Sub-Transaksi (Rincian Item Keranjang Belanja)",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Rincian Keranjang Belanja",
        icon: "list-outline",
        color: colors.info,
        location: "Form Catat Transaksi ➔ Bagian 'Rincian Belanja (Sub-Transaksi)'",
        analogy:
          "Ibarat struk kasir supermarket. Anda membayar total Rp 450.000 sekaligus di kasir, tetapi belanjaan itu terdiri dari deterjen (Kebutuhan Rumah), susu bayi (Keluarga), dan camilan kopi (Jajan). Sub-transaksi membedah satu nota belanja ke rincian item barang yang sebenarnya.",
        summary:
          "Fitur kasir digital untuk mencatat belanja supermarket atau restoran yang memiliki banyak item barang sekaligus dalam satu kali pembayaran kuitansi.",
        howItWorks: [
          "Memungkinkan Anda menambahkan baris item belanja dengan nama barang, harga satuan, dan kuantitas (qty).",
          "Sistem otomatis menjumlahkan total belanja secara live dan mengisi nominal transaksi utama.",
          "Seluruh rincian sub-transaksi akan dicetak rapi pada Struk Digital.",
        ],
        steps: [
          "Saat mencatat transaksi pengeluaran, gulir ke bagian 'Rincian Belanja (Sub-Transaksi)'.",
          "Ketuk 'Tambah Item' ➔ masukkan nama barang (misal: Beras 5kg), harga satuan, dan jumlah.",
          "Tambahkan item berikutnya sesuai struk belanja Anda.",
          "Nominal total transaksi utama otomatis terkalkulasi rapi!",
        ],
        impact:
          "Mencegah kebingungan di kemudian hari seperti: 'Kemarin belanja Rp 450.000 di supermarket beli apa saja ya?'. Anda memiliki arsip inventaris belanja lengkap.",
        proTip:
          "Sangat bermanfaat untuk menghitung patungan makan bareng teman saat satu orang membayar total tagihan di kasir.",
        actionTarget: "AddTransaction",
        actionLabel: "Coba Fitur Sub-Transaksi",
      },
      {
        id: "digital_receipt",
        name: "Struk Digital Transaksi",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Kuitansi Kasir Thermal",
        icon: "receipt-outline",
        color: colors.purple,
        location: "Layar Transaksi ➔ Ketuk Salah Satu Kartu Transaksi",
        analogy:
          "Ibarat kuitansi kasir mini yang dicetak di atas kertas thermal anti-luntur digital. Kertas struk kasir minimarket asli tintanya akan memudar hilang dalam 2 bulan, tetapi struk digital ini tersimpan abadi dan bisa difoto atau dibagikan ke WhatsApp teman.",
        summary:
          "Menghasilkan kuitansi transaksi bergaya kasir thermal modern yang memuat rincian lengkap, sub-transaksi, ID unik, stempel status, dan barcode visual yang bisa dibagikan.",
        howItWorks: [
          "Mengumpulkan seluruh metadata transaksi: jam transaksi, kategori, catatan, dan daftar rincian sub-item.",
          "Merender tampilan nota thermal bergaris perforasi dengan font kasir monospaced estetik.",
          "Menyediakan tombol ekspor gambar untuk dibagikan langsung ke aplikasi pesan atau media sosial.",
        ],
        steps: [
          "Buka menu 'Transaksi' di bar bawah.",
          "Sentuh kartu transaksi yang ingin Anda lihat kuitansinya.",
          "Modal Struk Digital akan muncul meluncur dari bawah layar.",
          "Tekan tombol 'Bagikan Struk' jika ingin mengirim bukti pembayaran ke orang lain.",
        ],
        impact:
          "Memudahkan urusan penagihan patungan (split bill) dan arsip klaim reimbursment kantor tanpa ribet memfoto nota manual.",
        proTip:
          "Tunjukkan struk digital ini ke pasangan Anda saat evaluasi belanja bulanan rumah tangga untuk transparansi penuh.",
        actionTarget: "Transactions",
        actionLabel: "Buka Riwayat Transaksi",
      },
      {
        id: "receipt_photo",
        name: "Foto Bukti Transaksi",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Klip Kertas Nota Fisik",
        icon: "camera-outline",
        color: colors.warning,
        location: "Form Catat Transaksi ➔ Opsi 'Lampirkan Foto Bukti'",
        analogy:
          "Ibarat menjepitkan kertas nota belanja fisik asli langsung ke lembar buku kas toko Anda menggunakan klip kertas. Meskipun nota kertas fisiknya suatu saat basah atau robek, salinan fotonya tetap aman tersimpan di ponsel Anda.",
        summary:
          "Menyematkan foto bukti fisik struk kertas, kuitansi bermeterai, atau tangkapan layar bukti transfer m-banking langsung ke dalam catatan transaksi.",
        howItWorks: [
          "Mengambil foto melalui kamera ponsel atau memilih berkas gambar dari galeri perangkat.",
          "Menyimpan tautan gambar lokal di memori aplikasi yang terikat dengan ID transaksi terkait.",
          "Menampilkan thumbnail foto di riwayat dan memungkinkan preview layar penuh.",
        ],
        steps: [
          "Saat mengisi form transaksi, ketuk tombol 'Ambil Foto Struk' atau 'Pilih dari Galeri'.",
          "Foto kuitansi belanja Anda dengan pencahayaan yang cukup.",
          "Simpan transaksi. Foto struk akan selalu tersemat di kartu transaksi tersebut.",
        ],
        impact:
          "Sangat krusial untuk transaksi bernilai besar (beli barang elektronik bergaransi, servis kendaraan, atau kuitansi medis rumah sakit).",
        proTip:
          "Gunakan fitur ini untuk menyimpan foto garansi produk agar tidak hilang saat ingin klaim servis di kemudian hari.",
        actionTarget: "AddTransaction",
        actionLabel: "Lampirkan Foto Struk",
      },
      {
        id: "custom_categories",
        name: "Kelola Kategori",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Label Toples Dapur",
        icon: "pricetags-outline",
        color: colors.accent,
        location: "Pengaturan ➔ Tab Pembukuan ➔ Kelola Kategori",
        analogy:
          "Ibarat menamai toples-toples bumbu di dapur: Anda memberi label nama dan warna berbeda pada toples garam, gula, dan merica. Anda tidak akan pernah salah mengambil bahan saat memasak resep keluarga.",
        summary:
          "Menambah, mengubah, atau menyesuaikan kategori pos transaksi sesuai gaya hidup unik Anda lengkap dengan puluhan pilihan ikon visual dan warna estetik.",
        howItWorks: [
          "Menyediakan kategori bawaan (Makanan, Transport, Belanja, Tagihan, dll).",
          "Memungkinkan pembuatan kategori kustom tanpa batas yang langsung terintegrasi dengan filter grafik dan anggaran.",
          "Kategori kustom tersimpan aman di basis data lokal dan ikut terbawa saat Anda melakukan backup JSON.",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab Pembukuan ➔ Klik 'Kelola Kategori'.",
          "Tekan tombol 'Tambah Kategori Baru'.",
          "Ketik nama kategori (misal: Kucing/Peliharaan, Skincare, Hobi, Donasi).",
          "Pilih ikon representatif dan warna favorit Anda lalu tekan Simpan.",
        ],
        impact:
          "Laporan keuangan Anda menjadi jauh lebih relevan, spesifik, dan tidak kaku karena mencerminkan hobi serta prioritas hidup Anda yang sebenarnya.",
        proTip:
          "Gunakan warna hangat (oranye/merah) untuk pos kebutuhan wajib dan warna dingin (hijau/biru) untuk pos keinginan/hiburan.",
        actionTarget: "ManageCategories",
        actionLabel: "Kelola Kategori Sekarang",
      },

      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 3: ANGGARAN & TABUNGAN
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "budget_limits",
        name: "Anggaran Kategori",
        category: "budget_savings",
        categoryLabel: "Anggaran & Tabungan",
        tag: "Pagar Pengaman Jurang",
        icon: "pie-chart-outline",
        color: colors.error,
        location: "Tab Menu 'Anggaran' di Bar Navigasi Bawah",
        analogy:
          "Ibarat pagar pembatas di pinggir jalan tol pegunungan yang curam. Batas anggaran menjaga mobil belanja Anda agar tidak meluncur bablas terperosok ke dalam jurang defisit.",
        summary:
          "Menetapkan batas maksimal plafon pengeluaran untuk kategori pos tertentu (misal: jatah jajan Makanan maksimal Rp 1.500.000 per bulan). Sistem otomatis mengawal progres belanja Anda.",
        howItWorks: [
          "Menghitung otomatis persentase pemakaian kuota anggaran setiap kali ada transaksi baru pada kategori terkait.",
          "Bar meteran progres berubah warna: Hijau (Aman < 70%), Kuning (Waspada 70-90%), Merah (Kritis / Overbudget > 100%).",
          "Periode Anggaran otomatis di-reset tiap bulan mengikuti tanggal Awal Pembukuan Bulanan Anda.",
        ],
        steps: [
          "Buka tab menu 'Anggaran' ➔ Tekan tombol 'Buat Anggaran Baru'.",
          "Pilih kategori yang ingin dibatasi (misal: 'Makanan & Minuman').",
          "Masukkan nominal batas maksimal (misal: Rp 1.500.000) dan periode bulanan.",
          "Simpan anggaran. Bar meteran akan otomatis terisi setiap kali Anda mencatat pengeluaran makanan.",
        ],
        impact:
          "Menghentikan kebiasaan belanja tanpa rem. Anda langsung sadar saat kuota jajan sudah menipis sebelum akhir bulan tiba.",
        proTip:
          "Fokuskan pembuatan anggaran pada 3 kategori yang paling sering membuat dompet Anda bocor (misal: Kopi/Jajan, Nongkrong, dan Belanja Online).",
        actionTarget: "Budget",
        actionLabel: "Atur Anggaran Kategori",
      },
      {
        id: "savings_goals",
        name: "Rencana Tabungan",
        category: "budget_savings",
        categoryLabel: "Anggaran & Tabungan",
        tag: "Celengan Gembok Target",
        icon: "trophy-outline",
        color: colors.accent,
        location: "Tab Menu 'Tabungan' di Bar Navigasi Bawah",
        analogy:
          "Ibarat memiliki beberapa celengan ayam dari tanah liat yang digembok khusus dan diberi tulisan target: 'Beli Laptop Baru', 'Liburan Akhir Tahun', dan 'Dana Darurat'. Anda termotivasi mengisinya keping demi keping.",
        summary:
          "Menetapkan target menabung untuk impian finansial tertentu lengkap dengan target nominal, tenggat waktu (deadline), dan indikator persentase pencapaian.",
        howItWorks: [
          "Menyimpan data pos tabungan target (Target Nominal, Saldo Terkumpul, Tanggal Deadline).",
          "Menghitung otomatis sisa kekurangan uang dan estimasi setoran rutin yang diperlukan.",
          "Menampilkan badge piala animasi saat tabungan berhasil mencapai 100% lunas.",
        ],
        steps: [
          "Masuk ke menu 'Tabungan' ➔ Tekan tombol 'Buat Target Tabungan'.",
          "Beri nama impian (misal: Dana Darurat 6 Bulan), tentukan target nominal (misal: Rp 15.000.000).",
          "Pilih ikon dan target tanggal pencapaian.",
          "Tekan Simpan Target. Target tabungan Anda siap diisi setoran!",
        ],
        impact:
          "Mengubah menabung dari kegiatan yang terasa membosankan menjadi permainan pencapaian (gamified goal) yang memuaskan secara psikologis.",
        proTip:
          "Prioritaskan membuat tabungan 'Dana Darurat' minimal setara 3 kali pengeluaran bulanan sebelum menabung untuk barang konsumtif.",
        actionTarget: "Savings",
        actionLabel: "Lihat Rencana Tabungan",
      },
      {
        id: "savings_transfer",
        name: "Setor & Transfer Tabungan (Double-Entry Kas)",
        category: "budget_savings",
        categoryLabel: "Anggaran & Tabungan",
        tag: "Pindah Kantong Brankas",
        icon: "swap-horizontal-outline",
        color: colors.success,
        location: "Layar Tabungan ➔ Ketuk Salah Satu Tabungan ➔ 'Setor Saldo'",
        analogy:
          "Ibarat memindahkan selembar uang Rp 200.000 dari dompet saku celana Anda ke dalam amplop terkunci di dalam brankas. Uang di dompet belanja berkurang, tetapi total kekayaan Anda sama sekali tidak hilang!",
        summary:
          "Mencatat setoran uang ke pos tabungan atau mentransfer antar target tabungan secara terintegrasi dengan saldo dompet kas utama (Prinsip Pembukuan Ganda).",
        howItWorks: [
          "Setor ke Tabungan: Saldo dompet kas utama otomatis dipotong dan saldo pos tabungan bertambah secara real-time.",
          "Tarik dari Tabungan: Saldo tabungan berkurang dan uang kas utama kembali bertambah.",
          "Transfer Antar Tabungan: Memindahkan dana dari Tabungan A ke Tabungan B tanpa memengaruhi kas utama.",
        ],
        steps: [
          "Buka menu 'Tabungan' ➔ Ketuk target tabungan yang ingin diisi.",
          "Tekan tombol 'Setor Saldo'.",
          "Masukkan nominal uang yang ingin disisihkan dari kas (misal: Rp 500.000).",
          "Konfirmasi. Uang kas utama terpotong aman dan progres tabungan Anda melonjak naik!",
        ],
        impact:
          "Mengamankan uang dari godaan belanja impulsif karena uang tersebut sudah 'dikurung' di dalam pos tabungan khusus.",
        proTip:
          "Lakukan transfer setoran tabungan tepat saat menerima pemasukan bulanan (pay yourself first), bukan menunggu sisa uang di akhir bulan!",
        actionTarget: "Savings",
        actionLabel: "Setor Saldo Tabungan",
      },

      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 4: RUTIN & HUTANG
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "recurring_transactions",
        name: "Transaksi Rutin (Auto-Draft Berkala)",
        category: "recurring_debt",
        categoryLabel: "Rutin & Hutang",
        tag: "Sekretaris Pengingat Tagihan",
        icon: "repeat-outline",
        color: colors.accent,
        location: "Pengaturan ➔ Tab Pembukuan ➔ Transaksi Rutin",
        analogy:
          "Ibarat memiliki sekretaris pribadi yang hafal mati tanggal jatuh tempo tagihan WiFi, listrik, cicilan motor, sewa kos, dan jadwal pemasukan bulanan Anda. Tepat pada tanggalnya, dia meletakkan lembar kuitansi siap catat di meja Anda.",
        summary:
          "Otomatisasi pengingat dan draf pencatatan transaksi berkala (harian, mingguan, bulanan, atau tahunan) seperti uang bulanan/uang saku, sewa kontrakan, atau langganan streaming.",
        howItWorks: [
          "Menyimpan jadwal transaksi berulang lengkap dengan nominal, kategori, dan frekuensi tanggal.",
          "Sistem otomatis mengecek tanggal setiap kali aplikasi dibuka. Jika jadwal jatuh tempo tiba, notifikasi pengingat muncul dan transaksi siap dicatat.",
          "Sinkronisasi Otomatis: Transaksi pemasukan berkala otomatis menyesuaikan tanggal saat Awal Pembukuan Bulanan diperbarui.",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab Pembukuan ➔ 'Transaksi Rutin'.",
          "Tekan tombol 'Tambah Transaksi Rutin'.",
          "Pilih tipe (Pemasukan/Pengeluaran), ketik nominal (misal: WiFi Rp 350.000), dan pilih frekuensi 'Bulanan' tanggal 5.",
          "Simpan. Anda tidak akan pernah lagi lupa mencatat pengeluaran wajib bulanan Anda!",
        ],
        impact:
          "Menyelamatkan Anda dari denda keterlambatan bayar tagihan dan menghemat waktu pencatatan berulang setiap bulannya.",
        proTip:
          "Daftarkan semua langganan aplikasi digital (Netflix, Spotify, Cloud Storage) di sini untuk mengevaluasi apakah ada langganan yang sudah tidak terpakai.",
        actionTarget: "RecurringTransactions",
        actionLabel: "Kelola Transaksi Rutin",
      },
      {
        id: "debt_manager",
        name: "Catatan Hutang & Piutang",
        category: "recurring_debt",
        categoryLabel: "Rutin & Hutang",
        tag: "Buku Catatan Kasbon",
        icon: "book-outline",
        color: colors.error,
        location: "Menu Lainnya / Beranda ➔ Catatan Hutang Piutang",
        analogy:
          "Ibarat papan tulis buku bon di warung. Saat Anda meminjamkan uang Rp 500.000 ke teman, dompet kas Anda berkurang, tetapi kekayaan Anda tidak hilang karena Anda memegang surat piutang tagihan. Saat teman membayar, kas bertambah tanpa dianggap sebagai pemasukan belanja baru!",
        summary:
          "Mencatat uang yang Anda pinjam dari orang lain (Hutang) atau uang Anda yang dipinjam oleh teman (Piutang) secara terintegrasi dengan saldo kas riil.",
        howItWorks: [
          "Mencatat Peminjam/Pemberi Pinjaman, nominal, tanggal jatuh tempo, dan bunga opsional.",
          "Pinjam Uang (Hutang) ➔ Menambah saldo kas dompet secara otomatis.",
          "Pinjamkan Uang (Piutang) ➔ Memotong saldo kas dompet secara otomatis.",
          "Mencegah pencatatan dobel pada laporan arus kas murni.",
        ],
        steps: [
          "Buka menu 'Hutang & Piutang'.",
          "Tekan tombol 'Tambah Catatan Baru'.",
          "Pilih tipe: 'Saya Berhutang' atau 'Orang Berhutang ke Saya'.",
          "Masukkan nama orang, nomor kontak, nominal, dan batas waktu pengembalian lalu simpan.",
        ],
        impact:
          "Menyelamatkan hubungan pertemanan dan tali silaturahmi karena Anda memiliki catatan transparan mengenai siapa berhutang apa kepada siapa.",
        proTip:
          "Aktifkan notifikasi pengingat jatuh tempo agar Anda bisa menagih piutang secara santun sebelum tanggal tempo terlewat.",
        actionTarget: "Debt",
        actionLabel: "Buka Hutang & Piutang",
      },
      {
        id: "debt_installment",
        name: "Cicilan & Pelunasan Kas Terintegrasi",
        category: "recurring_debt",
        categoryLabel: "Rutin & Hutang",
        tag: "Kwitansi Angsuran Bertahap",
        icon: "card-outline",
        color: colors.info,
        location: "Layar Hutang Piutang ➔ Ketuk Item Hutang ➔ 'Bayar Cicilan'",
        analogy:
          "Ibarat kuitansi setoran angsuran bank. Setiap kali ada cicilan dibayar, sisa beban hutang di buku perjanjian mengecil dan kas dompet terpotong otomatis dengan rapi tanpa salah hitung.",
        summary:
          "Mencatat pelunasan bertahap (cicilan) untuk setiap hutang atau piutang aktif dengan sinkronisasi langsung ke saldo dompet kas.",
        howItWorks: [
          "Menerima setoran pembayaran cicilan sebagian atau pelunasan penuh 100%.",
          "Otomatis memotong sisa saldo hutang/piutang dan mencatat mutasi kas keluar/masuk secara sinkron.",
          "Jika sisa hutang mencapai Rp 0, status otomatis berubah menjadi 'Lunas' dengan stempel hijau.",
        ],
        steps: [
          "Buka catatan hutang/piutang terkait ➔ Tekan tombol 'Bayar / Catat Cicilan'.",
          "Masukkan nominal uang yang dibayarkan (misal: Rp 250.000 dari total Rp 1.000.000).",
          "Pilih tanggal pembayaran dan simpan.",
          "Sisa hutang otomatis berkurang menjadi Rp 750.000 dan saldo kas Anda langsung terupdate!",
        ],
        impact:
          "Menjaga akurasi neraca keuangan Anda secara sempurna saat melunasi tanggungan secara mencicil.",
        proTip:
          "Anda bisa melihat riwayat seluruh jejak cicilan sebelumnya lengkap dengan tanggal pembayaran masing-masing.",
        actionTarget: "Debt",
        actionLabel: "Kelola Pembayaran Cicilan",
      },

      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 5: ANALISIS & KALENDER
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "analytics_charts",
        name: "Analisis & Grafik Finansial",
        category: "analytics_calendar",
        categoryLabel: "Analisis & Kalender",
        tag: "Rontgen Medis Keuangan",
        icon: "pie-chart-outline",
        color: colors.accent,
        location: "Tab Menu 'Analisis' di Bar Navigasi Bawah",
        analogy:
          "Ibarat hasil foto rontgen laboratorium atau rekam jantung di rumah sakit. Dalam satu lirikan mata, dokter keuangan Anda langsung tahu 'organ belanja' mana yang sedang mengalami pembengkakan atau kebocoran dana.",
        summary:
          "Menyajikan diagram lingkaran (donut chart), grafik komparasi batang pemasukan vs pengeluaran, dan tren arus kas bulanan secara visual interaktif.",
        howItWorks: [
          "Mengelompokkan seluruh transaksi berdasarkan kategori dan menghitung proporsi persentase pengeluaran.",
          "Menghitung perbandingan rasio pemasukan terhadap pengeluaran.",
          "Menyorot pos belanja nomor satu yang paling banyak menyerap anggaran kas Anda.",
        ],
        steps: [
          "Buka tab menu 'Analisis' di bar bawah.",
          "Pilih rentang waktu evaluasi (Mingguan, Bulan Ini, atau Tahunan).",
          "Sentuh irisan diagram donat untuk melihat nominal rinci per kategori pengeluaran.",
        ],
        impact:
          "Menghilangkan ketidaksadaran belanja (financial blindspot) dan menunjukkan fakta konkret ke mana larinya uang Anda.",
        proTip:
          "Usahakan porsi pos hiburan/keinginan di diagram donat tidak melebihi 30% dari total pengeluaran bulanan Anda (Prinsip 50/30/20).",
        actionTarget: "Analytics",
        actionLabel: "Buka Grafik Analisis",
      },
      {
        id: "financial_calendar",
        name: "Kalender Finansial (Detektor Hari Boros)",
        category: "analytics_calendar",
        categoryLabel: "Analisis & Kalender",
        tag: "Radar Cuaca Belanja",
        icon: "calendar",
        color: colors.warning,
        location: "Tab Menu 'Kalender' di Bar Navigasi Bawah",
        analogy:
          "Ibarat peta radar cuaca badai di televisi berita. Tanggal-tanggal di kalender yang memiliki titik merah tebal adalah hari-hari di mana dompet Anda tersambar 'badai pengeluaran besar'.",
        summary:
          "Matriks kalender bulanan interaktif yang memetakan seluruh transaksi pada tanggal terjadinya, dilengkapi titik indikator warna untuk mendeteksi pola hari boros Anda.",
        howItWorks: [
          "Menampilkan kisi 30-31 hari dalam bulan berjalan.",
          "Setiap tanggal memiliki indikator titik warna: Hijau (Ada Pemasukan), Merah (Ada Pengeluaran), dan Titik Besar (Belanja Di Atas Rata-rata).",
          "Ketuk salah satu tanggal untuk melihat daftar transaksi yang terjadi tepat di hari itu.",
        ],
        steps: [
          "Buka tab menu 'Kalender' di bar bawah.",
          "Perhatikan tanggal-tanggal yang memiliki titik merah menonjol.",
          "Ketuk tanggal tersebut untuk memeriksa apa yang Anda beli pada hari itu.",
        ],
        impact:
          "Membantu Anda mengenali pola psikologis belanja: misalnya apakah Anda selalu boros setiap hari Jumat malam atau setiap tanggal kembar promo e-commerce.",
        proTip:
          "Gunakan kalender untuk merencanakan 'Hari Nol Belanja' (No-Spend Days) minimal 2 hari dalam seminggu untuk mempercepat tabungan.",
        actionTarget: "Calendar",
        actionLabel: "Lihat Kalender Finansial",
      },


      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 6: DATA & SISTEM (PRIVASI & KEAMANAN)
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "backup_restore",
        name: "Cadangkan & Pulihkan Data (Offline JSON)",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Brankas Baja Tanpa Cloud",
        icon: "cloud-offline-outline",
        color: colors.accent,
        location: "Pengaturan ➔ Tab 'Data & Info' ➔ Backup & Restore",
        analogy:
          "Ibarat menyimpan sertifikat tanah dan perhiasan berharga di dalam brankas baja tahan api milik Anda sendiri di rumah, tanpa perlu menitipkannya ke bank atau server pihak ketiga di internet.",
        summary:
          "Menyimpan seluruh catatan transaksi, tabungan, anggaran, dan pengaturan menjadi 1 file mandiri (.json) yang dapat dipindahkan ke ponsel baru kapan saja dengan privasi 100% offline.",
        howItWorks: [
          "Ekspor (Backup): Merangkum seluruh basis data SQLite/AsyncStorage lokal menjadi berkas terstruktur .json dan memicu dialog berbagi file (Share Sheet).",
          "Impor (Restore): Membaca file backup .json, memvalidasi integritas data, dan memulihkan seluruh mutasi tanpa kehilangan satu rupiah pun.",
          "Tidak ada satu byte data pun yang dikirim ke server luar (Zero Third-Party Cloud Transmission).",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab 'Data & Info'.",
          "Klik 'Cadangkan Data (Backup JSON)' untuk menyimpan file ke Google Drive, iCloud, atau memori ponsel.",
          "Jika berganti ponsel, klik 'Pulihkan Data (Restore JSON)' dan pilih berkas backup Anda.",
        ],
        impact:
          "Menjamin keamanan data finansial Anda seumur hidup. Ponsel boleh rusak atau hilang, tetapi catatan keuangan Anda tetap selamat.",
        proTip:
          "Lakukan backup rutin setiap awal atau akhir bulan pembukuan setelah seluruh catatan bulanan selesai dirapikan.",
        actionTarget: "Settings",
        actionLabel: "Buka Menu Backup",
      },
      {
        id: "csv_ml_export",
        name: "Ekspor Data CSV (ML Ready)",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Laporan Akuntan Profesional",
        icon: "grid-outline",
        color: colors.info,
        location: "Pengaturan ➔ Tab 'Data & Info' ➔ Ekspor Data CSV",
        analogy:
          "Ibarat menyerahkan buku jurnal transaksi toko Anda kepada kantor akuntan publik profesional atau analis data untuk diolah menjadi tabel Excel rapi dan model kecerdasan buatan (Machine Learning).",
        summary:
          "Mengekspor seluruh data pembukuan menjadi 6 berkas tabel standar internasional (.csv) yang siap dibuka di Microsoft Excel, Google Sheets, atau dianalisis oleh data scientist / AI.",
        howItWorks: [
          "Mengekstrak tabel Transaksi, Kategori, Anggaran, Tabungan, Hutang, dan Transaksi Rutin ke format Comma Separated Values (CSV).",
          "Membersihkan teks agar bebas dari error pemisah koma dan menggunakan pengkodean UTF-8 standar internasional.",
          "Menghasilkan berkas 'All-in-One' gabungan untuk memudahkan pemodelan prediksi Machine Learning.",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab 'Data & Info'.",
          "Klik 'Ekspor Data CSV (ML Ready)'.",
          "Pilih berkas CSV yang ingin dibagikan (All-in-One atau per tabel) lalu buka di Excel atau komputer Anda.",
        ],
        impact:
          "Memberikan kebebasan mutlak bagi Anda yang ingin membuat laporan pajak tahunan, laporan laba rugi bisnis kecil, atau grafik kustom di komputer.",
        proTip:
          "Berkas CSV ini sangat kompatibel dengan rumus pivot table di Excel dan Google Data Studio.",
        actionTarget: "Settings",
        actionLabel: "Ekspor Berkas CSV",
      },
      {
        id: "mascot_moni",
        name: "Maskot Moni si Kucing Finansial",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Sahabat Pengingat Dompet",
        icon: "happy-outline",
        color: colors.warning,
        location: "Pengaturan ➔ Tab 'Tampilan' (Sakelar Moni) & Gelembung Beranda",
        analogy:
          "Ibarat memiliki sahabat setia yang duduk menemani di samping meja Anda. Dia akan bersorak gembira saat tabungan Anda bertambah, dan menepuk pundak Anda secara ramah saat belanja Anda mulai ugal-ugalan.",
        summary:
          "Asisten maskot interaktif yang menemani perjalanan finansial Anda di Beranda dengan balon percakapan cerdas, tips hemat harian, dan apresiasi setiap Anda disiplin mencatat uang.",
        howItWorks: [
          "Menyesuaikan ekspresi dan ucapan berdasarkan sisa hari bulan pembukuan dan status Batas Harian Aman Anda.",
          "Dapat disentuh untuk memunculkan renungan atau motivasi finansial hari ini.",
          "Dapat dinonaktifkan dengan mudah melalui sakelar di menu Tampilan jika Anda menyukai gaya antarmuka ultra-minimalis.",
        ],
        steps: [
          "Sentuh gelembung Moni di sudut layar Beranda untuk berinteraksi dengannya.",
          "Baca pesan atau tips keuangan yang diberikannya.",
          "Jika ingin menyembunyikan Moni, buka Pengaturan ➔ Tab 'Tampilan' ➔ Matikan sakelar 'Maskot Moni di Beranda'.",
        ],
        impact:
          "Mengubah suasana mengelola keuangan yang biasanya terasa kaku dan menegangkan menjadi aktivitas harian yang ramah dan menyenangkan.",
        proTip:
          "Sentuh Moni beberapa kali berturut-turut untuk melihat reaksi animasi lucunya saat sedang bersemangat!",
        actionTarget: "Settings",
        actionLabel: "Atur Tampilan Maskot",
      },
      {
        id: "streak_habit",
        name: "Check-in Harian & Streak",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Pemicu Disiplin Rutin",
        icon: "flame-outline",
        color: colors.error,
        location: "Header Layar Beranda (Ikon Api Streak)",
        analogy:
          "Ibarat menyiram bibit tanaman setiap pagi. Satu hari Anda lupa menyiram bibit tersebut tidak mati, tetapi jika Anda menyiramnya 30 hari berturut-turut, kebiasaan sadar finansial Anda tumbuh mengakar menjadi pohon kekayaan yang kokoh.",
        summary:
          "Sistem gamifikasi psikologis yang menghitung berapa hari berturut-turut Anda membuka aplikasi dan mencatat keuangan Anda.",
        howItWorks: [
          "Mencatat tanggal kunjungan terakhir di memori lokal.",
          "Jika Anda kembali mencatat di hari berikutnya, angka streak api bertambah (+1).",
          "Jika terlewat lebih dari 24-48 jam tanpa ada aktivitas, api streak akan padam dan kembali ke angka 1.",
        ],
        steps: [
          "Buka aplikasi MyMoney minimal sekali setiap hari.",
          "Catat minimal satu transaksi atau cek Batas Harian Aman Anda.",
          "Lihat angka api di header Beranda terus bertambah dari hari ke hari!",
        ],
        impact:
          "Kunci sukses kebebasan finansial adalah konsistensi. Fitur ini melatih otak bawah sadar Anda membentuk kebiasaan sadar uang tanpa terasa terpaksa.",
        proTip:
          "Mempertahankan streak 7 hari berturut-turut terbukti secara ilmiah mampu memangkas pengeluaran impulsif hingga 15%!",
        actionTarget: "Home",
        actionLabel: "Lihat Streak di Beranda",
      },
      {
        id: "app_theme",
        name: "Tema Aplikasi (6 Palet Eksklusif)",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Nuansa Interior Mata",
        icon: "color-palette-outline",
        color: colors.purple,
        location: "Pengaturan ➔ Tab 'Tampilan' ➔ Tema Aplikasi",
        analogy:
          "Ibarat mengganti warna cat dinding kamar kerja dan memasang pencahayaan lampu baru. Suasana ruangan yang segar membuat Anda betah berlama-lama merapikan meja kerja tanpa merasa jenuh.",
        summary:
          "Mengubah seluruh skema warna visual aplikasi ke dalam 6 pilihan tema eksklusif: Emerald (Zamrud), Sapphire (Safir), Ruby (Merah), Amethyst (Ungu), Cyberpunk, dan Midnight (Hitam Murni).",
        howItWorks: [
          "Menerapkan palet warna terstandarisasi ke seluruh tombol, gradien, kartu, dan teks secara instan tanpa perlu memuat ulang aplikasi.",
          "Mendukung kontras tinggi untuk kenyamanan membaca di bawah terik sinar matahari maupun di ruangan gelap.",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab 'Tampilan'.",
          "Pilih salah satu kartu palet tema warna yang Anda sukai.",
          "Seluruh aplikasi seketika berubah penampilannya secara elegan.",
        ],
        impact:
          "Membasmi rasa bosan dan memberikan pengalaman visual premium yang memanjakan mata Anda setiap hari.",
        proTip:
          "Tema 'Midnight' menghemat konsumsi daya baterai hingga 20% pada smartphone dengan layar OLED/AMOLED.",
        actionTarget: "Settings",
        actionLabel: "Ganti Tema Warna",
      },
      {
        id: "reset_all_data",
        name: "Reset Semua Data",
        category: "data_system",
        categoryLabel: "Data & Sistem",
        tag: "Lembaran Baru Bersih",
        icon: "trash-bin-outline",
        color: colors.error,
        location: "Pengaturan ➔ Tab 'Data & Info' ➔ Zona Kritis (Paling Bawah)",
        analogy:
          "Ibarat membuka lembaran buku tulis kas baru yang bersih dan rapi setelah buku kas lama Anda simpan rapi di lemari arsip masa lalu.",
        summary:
          "Menghapus seluruh transaksi, anggaran, tabungan, dan catatan hutang secara permanen jika Anda ingin merestrukturisasi total pembukuan bersih dari nol.",
        howItWorks: [
          "Menghapus basis data lokal dan mengembalikan pengaturan aplikasi ke kondisi awal pabrik (factory reset).",
          "Dilengkapi dialog konfirmasi ganda dan animasi pelindung untuk mencegah tindakan tidak sengaja.",
        ],
        steps: [
          "Buka Pengaturan ➔ Tab 'Data & Info' ➔ Gulir ke paling bawah.",
          "Ketuk tombol 'Hapus Semua Data'.",
          "Konfirmasi persetujuan pada kotak dialog peringatan sistem.",
        ],
        impact:
          "Memberikan kesempatan kedua bagi Anda yang ingin memulai awal baru pengelolaan keuangan tanpa terbebani catatan lama yang berantakan.",
        proTip:
          "SELALU lakukan 'Cadangkan Data (Backup JSON)' terlebih dahulu sebelum melakukan reset data agar Anda tidak kehilangan catatan masa lalu!",
        actionTarget: "Settings",
        actionLabel: "Cek Menu Reset",
      },

      // ══════════════════════════════════════════════════════════════════════════
      // PILAR 7: MULTI-DOMPET & MANAJEMEN METODE PEMBAYARAN
      // ══════════════════════════════════════════════════════════════════════════
      {
        id: "multi_wallet_setup",
        name: "Kelola Dompet & Metode Pembayaran",
        category: "home",
        categoryLabel: "Beranda & Pembukuan",
        tag: "Brankas Multi-Kantong",
        icon: "wallet-outline",
        color: colors.accent,
        location: "Menu Dompet (Ikon Dompet di Beranda) ➔ Tambah Dompet",
        analogy:
          "Ibarat seorang bendahara keluarga yang menyimpan uang di beberapa tempat berbeda: dompet fisik untuk belanja harian, rekening bank untuk dana cadangan, dan celengan kusus untuk tabungan jangka panjang. Setiap kantong tahu perannya masing-masing, dan total kekayaan adalah jumlah seluruh kantong.",
        summary:
          "Mengelola beberapa sumber dana (Tunai, Bank, E-Wallet, Kartu Kredit) secara bersamaan dalam satu aplikasi. Setiap dompet dapat diberi label, misalnya Belanja atau Tabungan.",
        howItWorks: [
          "Label Belanja: Dompet berlabel 'Belanja' (misal: Tunai, GoPay, Dana) cocok untuk transaksi sehari-hari dan ikut dihitung sebagai uang siap dipakai.",
          "Label Tabungan: Dompet berlabel 'Tabungan' (misal: Rekening BCA, Deposito) cocok untuk dana cadangan yang tidak ikut dihitung sebagai uang siap dipakai.",
          "Dompet Default: Dompet yang dicentang sebagai 'Default' akan otomatis dipilih saat mencatat transaksi baru. Anda tetap bisa memilih dompet lain secara manual di form transaksi.",
          "Saldo Real-time: Setiap dompet otomatis menghitung ulang saldo berdasarkan seluruh riwayat transaksi yang terhubung kepadanya. Tidak ada angka yang perlu diinput manual.",
          "Migrasi Otomatis: Semua transaksi lama sebelum fitur ini diaktifkan otomatis dipindahkan ke 'Dompet Kas Utama' tanpa kehilangan satu data pun.",
        ],
        steps: [
          "Buka layar 'Dompet' melalui ikon dompet di Beranda atau menu navigasi.",
          "Tekan tombol '+' atau 'Tambah Dompet Baru'.",
          "Beri nama dompet (misal: GoPay, BCA Tabungan, Tunai Dompet).",
          "Pilih tipe ikon dan warna unik untuk memudahkan identifikasi visual.",
          "Pilih label: 'Belanja' untuk kebutuhan harian atau 'Tabungan' untuk dana cadangan.",
          "Masukkan saldo awal jika ada (misal: Rp 500.000 untuk saldo GoPay saat ini).",
          "Simpan. Dompet baru siap digunakan sebagai sumber dana transaksi!",
        ],
        impact:
          "Anda tidak perlu lagi menghitung manual berapa uang di rekening A ditambah dompet B. Aplikasi merangkum total kekayaan kas Anda dari semua sumber secara real-time dan akurat.",
        proTip:
          "Tandai rekening atau e-wallet yang 'tidak boleh disentuh' (seperti dana darurat) sebagai dompet bertipe Tabungan agar tidak tercampur dalam perhitungan kas belanja harian Anda.",
        actionTarget: "Wallets",
        actionLabel: "Kelola Dompet Saya",
      },
      {
        id: "transfer_between_wallets",
        name: "Transfer Antar Dompet",
        category: "transactions",
        categoryLabel: "Transaksi & Struk",
        tag: "Pindah Dana Antar Kantong",
        icon: "swap-horizontal-outline",
        color: colors.info,
        location: "Tombol (+) ➔ Tab 'Transfer' (Tab Ketiga)",
        analogy:
          "Ibarat memindahkan uang tunai dari dompet saku ke dalam amplop rekening bank Anda sendiri. Nilai total kekayaan Anda tidak berubah serupiah pun — hanya lokasi penyimpanannya yang berpindah. Bedanya, jika ada biaya administrasi transfer bank, biaya itu saja yang dicatat sebagai pengeluaran nyata.",
        summary:
          "Mencatat perpindahan dana antara dua dompet milik Anda sendiri (misal: Tunai → BCA, GoPay → Dana). Transfer bersifat 'netral' — tidak mengurangi atau menambah total kekayaan bersih Anda, kecuali biaya admin bank jika ada.",
        howItWorks: [
          "Net-Neutral (Kekayaan Tetap): Saldo dompet sumber berkurang dan saldo dompet tujuan bertambah dengan nominal yang sama. Total kekayaan Anda tidak berubah.",
          "Biaya Admin Terpisah: Jika ada biaya transfer bank (misal: Rp 6.500), masukkan di kolom 'Biaya Admin'. Hanya biaya admin ini yang dicatat sebagai pengeluaran nyata dan mengurangi total kekayaan.",
          "Pemilihan Dompet Sumber & Tujuan: Anda wajib memilih dua dompet berbeda. Aplikasi mencegah transfer ke dompet yang sama.",
          "Konsistensi Saldo: Setelah transfer, saldo kedua dompet diperbarui secara otomatis dan instan tanpa perlu refresh manual.",
        ],
        steps: [
          "Tekan tombol (+) hijau di tengah bawah layar.",
          "Pilih tab 'Transfer' (tab ketiga, ikon panah bolak-balik).",
          "Pilih 'Dompet Asal' (sumber dana keluar) dari daftar dompet Anda.",
          "Pilih 'Dompet Tujuan' (penerima dana masuk) — harus berbeda dari dompet asal.",
          "Masukkan nominal uang yang dipindahkan (misal: Rp 500.000).",
          "Isi 'Biaya Admin' jika ada biaya transfer bank (opsional, misal: Rp 6.500).",
          "Tambahkan catatan opsional lalu tekan 'Simpan Transfer'.",
        ],
        impact:
          "Memisahkan perpindahan dana internal dari arus kas nyata sehingga laporan keuangan Anda tidak terdistorsi. Tanpa fitur ini, transfer dari bank ke GoPay akan salah tercatat sebagai 'pengeluaran + pemasukan' sekaligus dan menggelembungkan total transaksi secara palsu.",
        proTip:
          "Setelah gajian, gunakan fitur Transfer untuk memindahkan sebagian gaji ke dompet 'BCA Tabungan' secara instan. Prinsip 'Bayar Diri Sendiri Dulu' (Pay Yourself First) terlaksana hanya dalam 3 ketukan!",
        actionTarget: "AddTransaction",
        actionLabel: "Coba Transfer Antar Dompet",
      },
    ],
    [colors]
  );

  // Filter Search & Category
  const filteredGuides = useMemo(() => {
    return guideData.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.analogy.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.impact.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [guideData, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    triggerLayoutAnimation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAction = (item: FeatureGuideItem) => {
    if (item.actionTarget && onNavigateAction) {
      onClose();
      onNavigateAction(item.actionTarget);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[`${colors.accent}25`, `${colors.surface}00`]}
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
        >
          {/* Top Bar: Close & Badge */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: `${colors.accent}20`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: `${colors.accent}40`,
              }}
            >
              <Ionicons name="book-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>
                BUKU PANDUAN LENGKAP • A TO Z
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: `${colors.border}80`,
              }}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Big Title & Subtitle */}
          <Text style={{ color: colors.textPrimary, fontSize: 23, fontWeight: "900", letterSpacing: -0.5 }}>
            Panduan & Tutorial Seluruh Fitur
          </Text>
          <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            Ketahui fungsi, analogi nyata, cara pakai, dan dampak finansial 30 fitur MyMoney untuk menguasai keuangan Anda 100%.
          </Text>

          {/* Quick Search Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 10 : 6,
              marginTop: 14,
              borderWidth: 1,
              borderColor: `${colors.border}90`,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.gray400} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari fitur (misal: pembukuan, batas harian, struk)..."
              placeholderTextColor={colors.gray500}
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontSize: 13,
                fontWeight: "500",
              }}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* ─── Category Scroll Pills ────────────────────────────────────────────── */}
        <View style={{ marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    triggerLayoutAnimation();
                    setSelectedCategory(cat.id);
                  }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 13,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent : `${colors.border}80`,
                  }}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isSelected ? "#FFFFFF" : colors.gray400}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "800" : "600",
                      color: isSelected ? "#FFFFFF" : colors.gray400,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Feature Guide Accordion List ─────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredGuides.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: `${colors.border}80`,
                marginTop: 10,
              }}
            >
              <Ionicons name="search-outline" size={40} color={colors.gray500} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                Fitur Tidak Ditemukan
              </Text>
              <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 4, textAlign: "center" }}>
                Tidak ada fitur yang cocok dengan kata kunci "{searchQuery}".
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {filteredGuides.map((item) => {
                const isExpanded = expandedId === item.id;

                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: isExpanded ? item.color : `${colors.border}80`,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isExpanded ? 0.15 : 0.05,
                      shadowRadius: 6,
                      elevation: isExpanded ? 4 : 1,
                    }}
                  >
                    {/* Header Row (Always Visible) */}
                    <TouchableOpacity
                      onPress={() => toggleExpand(item.id)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                      }}
                    >
                      {/* Icon Container */}
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: `${item.color}15`,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>

                      {/* Name & Summary preview */}
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                          <View
                            style={{
                              backgroundColor: `${item.color}20`,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                              marginRight: 8,
                            }}
                          >
                            <Text style={{ color: item.color, fontSize: 9, fontWeight: "800" }}>
                              {item.tag}
                            </Text>
                          </View>
                          <Text style={{ color: colors.gray500, fontSize: 10, fontWeight: "600" }}>
                            {item.categoryLabel}
                          </Text>
                        </View>

                        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>
                          {item.name}
                        </Text>
                        {!isExpanded && (
                          <Text
                            style={{ color: colors.gray400, fontSize: 11, marginTop: 3 }}
                            numberOfLines={1}
                          >
                            {item.summary}
                          </Text>
                        )}
                      </View>

                      {/* Expand Chevron */}
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: isExpanded ? `${item.color}20` : `${colors.border}40`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={isExpanded ? item.color : colors.gray400}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingBottom: 16,
                          borderTopWidth: 1,
                          borderTopColor: `${colors.border}60`,
                          backgroundColor: `${item.color}04`,
                        }}
                      >
                        {/* 📍 Lokasi Fitur */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: colors.background,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            marginTop: 12,
                            borderWidth: 1,
                            borderColor: `${colors.border}70`,
                          }}
                        >
                          <Ionicons name="location-outline" size={14} color={item.color} style={{ marginRight: 6 }} />
                          <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "600" }}>
                            Lokasi:{" "}
                            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                              {item.location}
                            </Text>
                          </Text>
                        </View>

                        {/* 💡 ANALOGI KEHIDUPAN NYATA (SANGAT MUDAH DIPAHAMI) */}
                        <View
                          style={{
                            marginTop: 12,
                            backgroundColor: "rgba(255, 184, 77, 0.08)",
                            padding: 13,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "rgba(255, 184, 77, 0.28)",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                            <Ionicons name="sparkles" size={15} color="#FFB84D" style={{ marginRight: 6 }} />
                            <Text
                              style={{
                                color: "#FFB84D",
                                fontSize: 11,
                                fontWeight: "900",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              💡 Analogi Sederhana (Biar Langsung Paham)
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 12,
                              lineHeight: 18,
                              fontStyle: "italic",
                              fontWeight: "500",
                            }}
                          >
                            "{item.analogy}"
                          </Text>
                        </View>

                        {/* 🎯 1. FUNGSI UTAMA (FUNGSI NYA BUAT APA) */}
                        <View style={{ marginTop: 14 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                            <Ionicons name="bulb-outline" size={15} color={item.color} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                              Fungsi Utama (Fungsinya Buat Apa?)
                            </Text>
                          </View>
                          <Text style={{ color: colors.gray300, fontSize: 13, lineHeight: 20 }}>
                            {item.summary}
                          </Text>
                        </View>

                        {/* ⚙️ 2. CARA KERJA SISTEM DI BALIK LAYAR */}
                        {item.howItWorks && item.howItWorks.length > 0 && (
                          <View style={{ marginTop: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                              <Ionicons name="git-network-outline" size={15} color={item.color} style={{ marginRight: 6 }} />
                              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                                Cara Kerja Sistem di Balik Layar
                              </Text>
                            </View>
                            <View style={{ gap: 6 }}>
                              {item.howItWorks.map((hwText, hwIdx) => (
                                <View key={hwIdx} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                  <View
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: item.color,
                                      marginTop: 6,
                                      marginRight: 8,
                                    }}
                                  />
                                  <Text style={{ flex: 1, color: colors.gray300, fontSize: 12, lineHeight: 18 }}>
                                    {hwText}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* 📱 3. CARA PAKAI (LANGKAH PRAKTIS) */}
                        <View style={{ marginTop: 14 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <Ionicons name="play-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                              Cara Pakai (Langkah Praktis)
                            </Text>
                          </View>
                          <View style={{ gap: 8 }}>
                            {item.steps.map((stepText, sIdx) => (
                              <View key={sIdx} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                <View
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: `${item.color}20`,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                    marginTop: 1,
                                  }}
                                >
                                  <Text style={{ color: item.color, fontSize: 10, fontWeight: "800" }}>
                                    {sIdx + 1}
                                  </Text>
                                </View>
                                <Text style={{ flex: 1, color: colors.gray300, fontSize: 12, lineHeight: 18 }}>
                                  {stepText}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* 🚀 4. DAMPAK BAGI KEUANGAN ANDA */}
                        <View
                          style={{
                            marginTop: 14,
                            backgroundColor: `${colors.success}10`,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: `${colors.success}30`,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <Ionicons name="shield-checkmark-outline" size={15} color={colors.success} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.success, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
                              Dampak Nyata Bagi Dompet Anda
                            </Text>
                          </View>
                          <Text style={{ color: colors.textPrimary, fontSize: 12, lineHeight: 18, fontWeight: "500" }}>
                            {item.impact}
                          </Text>
                        </View>

                        {/* 💎 5. TIPS PRO */}
                        <View
                          style={{
                            marginTop: 10,
                            backgroundColor: `${item.color}10`,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: `${item.color}30`,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <Ionicons name="star-outline" size={15} color={item.color} style={{ marginRight: 6 }} />
                            <Text style={{ color: item.color, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
                              Tips Pro
                            </Text>
                          </View>
                          <Text style={{ color: colors.gray300, fontSize: 12, lineHeight: 18 }}>
                            {item.proTip}
                          </Text>
                        </View>

                        {/* 🚀 6. TOMBOL BUKA FITUR LANGSUNG (DEEP LINK) */}
                        {item.actionTarget && onNavigateAction && (
                          <TouchableOpacity
                            onPress={() => handleAction(item)}
                            activeOpacity={0.8}
                            style={{
                              marginTop: 14,
                              backgroundColor: item.color,
                              paddingVertical: 12,
                              paddingHorizontal: 16,
                              borderRadius: 12,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginRight: 6 }}>
                              {item.actionLabel || `Buka Fitur ${item.name}`}
                            </Text>
                            <Ionicons name="arrow-forward-outline" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
