// File: src/components/Tutorial/GuideCenterModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { useTheme } from "../../theme/ThemeContext";

const { width } = Dimensions.get("window");

export type GuideTopicId = "cycle" | "wallets" | "transactions" | "budget" | "moni";

interface GuideCenterModalProps {
  visible: boolean;
  onClose: () => void;
  initialTopic?: GuideTopicId;
  onNavigateAction?: (target: string) => void;
}

interface GuideContent {
  id: GuideTopicId;
  title: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  summary: string;
  diagramTitle: string;
  diagramSteps: {
    label: string;
    sublabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }[];
  whyItMatters: string;
  steps: {
    number: string;
    title: string;
    description: string;
  }[];
  proTip: string;
  actionText?: string;
  actionTarget?: string;
}

export const GuideCenterModal: React.FC<GuideCenterModalProps> = ({
  visible,
  onClose,
  initialTopic = "cycle",
  onNavigateAction,
}) => {
  const { colors } = useTheme();
  const [activeTopic, setActiveTopic] = useState<GuideTopicId>(initialTopic);

  useEffect(() => {
    if (visible && initialTopic) {
      setActiveTopic(initialTopic);
    }
  }, [visible, initialTopic]);

  const topics: GuideContent[] = [
    {
      id: "cycle",
      title: "Awal Pembukuan & Batas Belanja",
      badge: "Kunci Beranda",
      icon: "shield-checkmark-outline",
      color: colors.accent,
      summary:
        "Ketahui jatah belanja aman harian agar uang Anda bertahan sampai tanggal pembukuan/gajian berikutnya tanpa tekor di akhir bulan.",
      diagramTitle: "Cara Kerja Jatah Belanja Harian:",
      diagramSteps: [
        {
          label: "Total Saldo Kas",
          sublabel: "Seluruh uang Anda yang tersedia saat ini",
          icon: "wallet-outline",
          color: colors.success,
        },
        {
          label: "Hitung Sisa Hari",
          sublabel: "Mundur menuju tanggal awal pembukuan",
          icon: "hourglass-outline",
          color: colors.info,
        },
        {
          label: "Jatah Belanja Aman",
          sublabel: "Sisa Uang ÷ Sisa Hari = Angka Aman!",
          icon: "shield-checkmark-outline",
          color: colors.accent,
        },
      ],
      whyItMatters:
        "Banyak orang kehabisan uang bukan karena boros sekali belanja, melainkan tidak sadar menghabiskan uang terlalu cepat di awal bulan. Angka jatah belanja harian di Beranda memberi kompas yang jelas: jika hari ini hemat, jatah belanja hari esok otomatis bertambah!",
      steps: [
        {
          number: "1",
          title: "Setel Tanggal Pembukuan Anda",
          description:
            "Buka Pengaturan ➔ Awal Pembukuan Bulanan. Sesuaikan dengan tanggal gajian atau tanggal uang saku Anda masuk (misal tanggal 25 atau 1).",
        },
        {
          number: "2",
          title: "Cek 'Jatah Hari Ini' di Beranda",
          description:
            "Setiap pagi, lihat kartu Jatah Hari Ini di Beranda sebelum Anda mulai membelanjakan uang.",
        },
        {
          number: "3",
          title: "Catat Pengeluaran",
          description:
            "Setiap kali belanja, catat nominalnya. Sisa jatah hari ini akan otomatis diperbarui secara realtime!",
        },
      ],
      proTip:
        "Jika Anda belanja di bawah jatah hari ini, sisa uang yang belum terpakai otomatis menambah jatah belanja hari-hari berikutnya!",
      actionText: "Atur Awal Pembukuan",
      actionTarget: "Settings",
    },
    {
      id: "wallets",
      title: "Dompet, Bank & E-Wallet",
      badge: "Fitur Baru",
      icon: "card-outline",
      color: colors.purple,
      summary:
        "Kelola banyak rekening sekaligus. Kartu pertama adalah Total Saldo, dan geser ke samping untuk melihat rincian per dompet (BCA, Mandiri, GoPay, Tunai).",
      diagramTitle: "Alur Manajemen Multi-Dompet:",
      diagramSteps: [
        {
          label: "Geser Kartu Saldo",
          sublabel: "Pilih Dompet Tunai, Bank, atau E-Wallet",
          icon: "swap-horizontal-outline",
          color: colors.purple,
        },
        {
          label: "Transfer Saldo",
          sublabel: "Pindah dana tanpa memengaruhi pengeluaran",
          icon: "git-compare-outline",
          color: colors.info,
        },
        {
          label: "Pilih Saat Transaksi",
          sublabel: "Saldo dompet terpotong akurat & rapi",
          icon: "checkmark-circle-outline",
          color: colors.success,
        },
      ],
      whyItMatters:
        "Uang kita tersebar di berbagai tempat: uang tunai di dompet fisik, tabungan di rekening bank, dan saldo di aplikasi e-wallet. Fitur ini memisahkan pencatatan saldo tiap kantong tanpa merusak total kekayaan Anda.",
      steps: [
        {
          number: "1",
          title: "Geser Kartu Saldo di Beranda",
          description:
            "Di bagian atas Beranda, geser kartu ke kiri/kanan untuk berpindah antara Total Semua Dompet dengan masing-masing rekening.",
        },
        {
          number: "2",
          title: "Tambah Dompet / Rekening Baru",
          description:
            "Buka menu samping ➔ Rekening & Dompet ➔ Tekan (+) untuk menambahkan rekening bank atau e-wallet baru beserta warna & saldo awal.",
        },
        {
          number: "3",
          title: "Pindahkan Dana (Transfer)",
          description:
            "Tarik tunai dari ATM atau top up e-wallet? Gunakan tombol 'Transfer' di bawah kartu saldo agar perpindahan dana tidak terhitung pengeluaran palsu.",
        },
      ],
      proTip:
        "Saat mencatat transaksi dengan tombol (+), pilih dompet yang sesuai agar saldo kas Anda selalu cocok 100% dengan saldo rekening bank aslinya.",
      actionText: "Kelola Rekening & Dompet",
      actionTarget: "Wallets",
    },
    {
      id: "transactions",
      title: "Catat Transaksi & Pecah Struk",
      badge: "Pencatatan Cepat",
      icon: "receipt-outline",
      color: colors.info,
      summary:
        "Catat pemasukan & pengeluaran hanya dalam 5 detik. Manfaatkan fitur 'Pecah Struk' untuk merinci struk belanjaan minimarket/supermarket.",
      diagramTitle: "Alur Pencatatan Transaksi:",
      diagramSteps: [
        {
          label: "Tekan Tombol (+)",
          sublabel: "Tombol mengambang di tengah bawah",
          icon: "add-circle-outline",
          color: colors.accent,
        },
        {
          label: "Pecah Struk / Item",
          sublabel: "Rinci barang belanjaan & kuantitas",
          icon: "list-outline",
          color: colors.info,
        },
        {
          label: "Mutasi & Saldo Update",
          sublabel: "Saldo kas & riwayat langsung tercatat",
          icon: "checkmark-done-circle-outline",
          color: colors.success,
        },
      ],
      whyItMatters:
        "Sering kali kita belanja di minimarket dan membayar 1 total struk (misal Rp 150.000) yang berisi makanan, sabun mandi, dan camilan. Dengan fitur Pecah Struk, Anda bisa membagi item belanjaan ke pos yang tepat tanpa ribet mencatat berkali-kali.",
      steps: [
        {
          number: "1",
          title: "Tekan Tombol Tambah (+)",
          description:
            "Pilih jenis Transaksi (Pengeluaran atau Pemasukan), ketik nominal, dan pilih kategori.",
        },
        {
          number: "2",
          title: "Pilih Dompet Sumber Dana",
          description:
            "Tentukan pembayaran via Tunai, Rekening Bank, atau E-Wallet agar saldo rekening terpotong otomatis.",
        },
        {
          number: "3",
          title: "Aktifkan Rincian Struk (Opsional)",
          description:
            "Centang 'Rincian Struk / Item Belanja' untuk menambahkan daftar nama barang, harga satuan, dan jumlah item belanjaan Anda.",
        },
      ],
      proTip:
        "Anda juga dapat melampirkan foto struk fisik atau bukti transfer bank dengan kamera/galeri sebagai arsip digital permanen!",
      actionText: "Catat Transaksi Baru",
      actionTarget: "AddTransaction",
    },
    {
      id: "budget",
      title: "Pagar Anggaran & Peringatan",
      badge: "Rem Belanja",
      icon: "pie-chart-outline",
      color: colors.warning,
      summary:
        "Kendalikan pos-pos rawan boncos seperti Makan Luar, Ngopi, atau Belanja Online dengan batas maksimal bulanan.",
      diagramTitle: "Sistem Peringatan Anggaran:",
      diagramSteps: [
        {
          label: "Pasang Batas Kuota",
          sublabel: "Misal: Makanan Rp 1.500.000",
          icon: "flag-outline",
          color: colors.info,
        },
        {
          label: "Peringatan Dini (80%)",
          sublabel: "Bar berubah kuning saat mendekati batas",
          icon: "alert-circle-outline",
          color: colors.warning,
        },
        {
          label: "Alarm Overbudget",
          sublabel: "Warna merah & notifikasi saat terlampaui",
          icon: "notifications-outline",
          color: colors.error,
        },
      ],
      whyItMatters:
        "Uang sering habis bukan pada hal besar, melainkan pengeluaran kecil harian yang tidak disadari. Anggaran memberi Anda 'lampu kuning' sebelum dompet Anda benar-benar kosong.",
      steps: [
        {
          number: "1",
          title: "Buka Menu Anggaran",
          description:
            "Masuk ke tab Anggaran dari bilah menu bawah atau sidebar samping.",
        },
        {
          number: "2",
          title: "Tentukan Batas Kategori",
          description:
            "Pilih kategori yang ingin dibatasi (misal: Makanan / Jajan) dan isi nominal batas maksimalnya.",
        },
        {
          number: "3",
          title: "Pantau Bar Progres",
          description:
            "Setiap mencatat pengeluaran di kategori tersebut, bar progres terisi otomatis. Warna merah berarti Anda wajib mengerem belanja!",
        },
      ],
      proTip:
        "Anggaran otomatis di-reset mengikuti siklus 'Awal Pembukuan Bulanan' Anda, sehingga tidak perlu membuat ulang setiap bulan.",
      actionText: "Atur Anggaran Kategori",
      actionTarget: "Budget",
    },
    {
      id: "moni",
      title: "Maskot Moni & Kebiasaan Streak",
      badge: "Gamifikasi",
      icon: "paw-outline",
      color: "#F59E0B",
      summary:
        "Bangun kebiasaan finansial positif bersama Kucing Moni! Kumpulkan streak harian, naikkan level finansial, dan buka kostum eksklusif.",
      diagramTitle: "Siklus Kebiasaan Moni:",
      diagramSteps: [
        {
          label: "Catat Tiap Hari",
          sublabel: "Jaga api streak harian tidak padam",
          icon: "flame-outline",
          color: "#EF4444",
        },
        {
          label: "Dapatkan XP & Koin",
          sublabel: "Naik level dari Pemula hingga Sultan",
          icon: "trophy-outline",
          color: "#F59E0B",
        },
        {
          label: "Buka Hadiah Moni",
          sublabel: "Topi koki, mahkota & baju eksklusif",
          icon: "sparkles-outline",
          color: colors.accent,
        },
      ],
      whyItMatters:
        "Mencatat keuangan sering terasa membosankan jika hanya berisi angka. Kehadiran maskot kucing Moni mengubah pencatatan harian menjadi petualangan gamifikasi yang seru dan memotivasi Anda untuk konsisten.",
      steps: [
        {
          number: "1",
          title: "Jaga Streak Harian",
          description:
            "Catat minimal satu transaksi setiap hari. Angka streak di Beranda akan terus bertambah selama Anda tidak melewatkan satu hari pun.",
        },
        {
          number: "2",
          title: "Kunjungi Halaman Moni",
          description:
            "Ketuk gelembung kucing Moni di pojok kanan bawah Beranda untuk mengecek status level, mood, dan koleksi pencapaian Anda.",
        },
        {
          number: "3",
          title: "Klaim Kostum & Aksesoris",
          description:
            "Setiap mencapai level baru, Anda mendapatkan koin untuk membuka topi koki, kacamata, dan kostum lucu di Lemari Moni!",
        },
      ],
      proTip:
        "Ketuk kucing Moni di Beranda untuk melihat celoteh dan reaksi lucunya saat Anda rajin berhemat!",
      actionText: "Kunjungi Kucing Moni",
      actionTarget: "MoniScreen",
    },
  ];
  const currentContent =
    topics.find((t) => t.id === activeTopic) || topics[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[tw`flex-1`, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        {/* ── HEADER ── */}
        <View
          style={[
            tw`flex-row items-center justify-between px-5 py-4 border-b`,
            { borderBottomColor: `${colors.border}60` },
          ]}
        >
          <View style={tw`flex-row items-center gap-2.5`}>
            <View
              style={[
                tw`w-10 h-10 rounded-2xl items-center justify-center`,
                { backgroundColor: `${colors.accent}18` },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <View>
              <Text
                style={[
                  tw`text-lg font-bold`,
                  { color: colors.textPrimary },
                ]}
              >
                Pusat Panduan MyMoney
              </Text>
              <Text
                style={[
                  tw`text-xs`,
                  { color: colors.textSecondary },
                ]}
              >
                Tips & cara pakai fitur agar uang aman
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[
              tw`w-9 h-9 rounded-full items-center justify-center`,
              { backgroundColor: `${colors.border}40` },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── TOPIC PILLS (HORIZONTALLY SCROLLABLE) ── */}
        <View style={tw`py-3`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-5 gap-2`}
          >
            {topics.map((item) => {
              const isActive = activeTopic === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveTopic(item.id)}
                  style={[
                    tw`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl`,
                    {
                      backgroundColor: isActive
                        ? `${item.color}25`
                        : colors.surface,
                      borderWidth: 1,
                      borderColor: isActive
                        ? item.color
                        : `${colors.border}70`,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={isActive ? item.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      tw`text-xs font-semibold`,
                      {
                        color: isActive ? item.color : colors.textSecondary,
                      },
                    ]}
                  >
                    {item.title.split("&")[0].trim()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── MAIN CONTENT ── */}
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-5 pb-10`}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Topic Card */}
          <View
            style={[
              tw`p-5 rounded-3xl mb-5 relative overflow-hidden`,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: `${currentContent.color}30`,
              },
            ]}
          >
            <LinearGradient
              colors={[`${currentContent.color}15`, "transparent"]}
              style={tw`absolute inset-0`}
            />

            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View
                style={[
                  tw`px-2.5 py-1 rounded-full`,
                  { backgroundColor: `${currentContent.color}20` },
                ]}
              >
                <Text
                  style={[
                    tw`text-[10px] font-bold tracking-wider uppercase`,
                    { color: currentContent.color },
                  ]}
                >
                  {currentContent.badge}
                </Text>
              </View>

              <View
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  { backgroundColor: `${currentContent.color}25` },
                ]}
              >
                <Ionicons
                  name={currentContent.icon}
                  size={18}
                  color={currentContent.color}
                />
              </View>
            </View>

            <Text
              style={[
                tw`text-xl font-bold mb-2`,
                { color: colors.textPrimary },
              ]}
            >
              {currentContent.title}
            </Text>

            <Text
              style={[
                tw`text-sm leading-5`,
                { color: colors.textSecondary },
              ]}
            >
              {currentContent.summary}
            </Text>
          </View>

          {/* ── VISUAL SIMULATION DIAGRAM ── */}
          <View
            style={[
              tw`p-4 rounded-2xl mb-5`,
              {
                backgroundColor: `${colors.surfaceLight}50`,
                borderWidth: 1,
                borderColor: `${colors.border}60`,
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-bold uppercase tracking-wider mb-3`,
                { color: colors.textTertiary },
              ]}
            >
              {currentContent.diagramTitle}
            </Text>

            <View style={tw`gap-2.5`}>
              {currentContent.diagramSteps.map((step, idx) => (
                <View
                  key={idx}
                  style={[
                    tw`flex-row items-center p-3 rounded-xl`,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
                      { backgroundColor: `${step.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={step.icon}
                      size={18}
                      color={step.color}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={[
                        tw`text-xs font-bold`,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={[
                        tw`text-[11px]`,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {step.sublabel}
                    </Text>
                  </View>
                  {idx < currentContent.diagramSteps.length - 1 && (
                    <Ionicons
                      name="arrow-down-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* ── WHY IT MATTERS ── */}
          <View
            style={[
              tw`p-4 rounded-2xl mb-5 border-l-4`,
              {
                backgroundColor: `${colors.info}10`,
                borderColor: colors.info,
              },
            ]}
          >
            <View style={tw`flex-row items-center gap-1.5 mb-1.5`}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color={colors.info}
              />
              <Text
                style={[
                  tw`text-xs font-bold`,
                  { color: colors.info },
                ]}
              >
                Kenapa Ini Penting untuk Anda?
              </Text>
            </View>
            <Text
              style={[
                tw`text-xs leading-5`,
                { color: colors.textPrimary },
              ]}
            >
              {currentContent.whyItMatters}
            </Text>
          </View>

          {/* ── 3 SIMPLE STEPS ── */}
          <Text
            style={[
              tw`text-sm font-bold mb-3`,
              { color: colors.textPrimary },
            ]}
          >
            Langkah Mudah Menggunakan:
          </Text>

          <View style={tw`gap-3 mb-5`}>
            {currentContent.steps.map((step) => (
              <View
                key={step.number}
                style={[
                  tw`flex-row p-3.5 rounded-2xl`,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: `${colors.border}60`,
                  },
                ]}
              >
                <View
                  style={[
                    tw`w-7 h-7 rounded-full items-center justify-center mr-3 mt-0.5`,
                    { backgroundColor: `${currentContent.color}20` },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      { color: currentContent.color },
                    ]}
                  >
                    {step.number}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    style={[
                      tw`text-xs font-bold mb-1`,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={[
                      tw`text-xs leading-4`,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── PRO TIP BOX ── */}
          <View
            style={[
              tw`p-4 rounded-2xl mb-6 flex-row items-center gap-3`,
              {
                backgroundColor: `${colors.warning}12`,
                borderWidth: 1,
                borderColor: `${colors.warning}35`,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color={colors.warning}
            />
            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-xs font-bold mb-0.5`,
                  { color: colors.warning },
                ]}
              >
                Tips Ahli Keuangan:
              </Text>
              <Text
                style={[
                  tw`text-[11px] leading-4`,
                  { color: colors.textPrimary },
                ]}
              >
                {currentContent.proTip}
              </Text>
            </View>
          </View>

          {/* ── ACTION BUTTON ── */}
          {currentContent.actionText && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                if (
                  currentContent.actionTarget &&
                  onNavigateAction
                ) {
                  onNavigateAction(currentContent.actionTarget);
                }
              }}
              style={[
                tw`py-3.5 px-4 rounded-2xl items-center justify-center flex-row gap-2 shadow-sm`,
                { backgroundColor: currentContent.color },
              ]}
              activeOpacity={0.85}
            >
              <Text style={tw`text-white font-bold text-sm`}>
                {currentContent.actionText}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default GuideCenterModal;
