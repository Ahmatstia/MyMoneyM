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

export type GuideTopicId = "cycle" | "recurring" | "budget" | "privacy";

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
      title: "Aturan Pembukuan & Batas Belanja",
      badge: "Fitur Unggulan",
      icon: "shield-checkmark-outline",
      color: colors.accent,
      summary:
        "Bebaskan diri dari stres akhir bulan. Ketahui jatah belanja aman harian berdasarkan sisa hari bulan pembukuan Anda.",
      diagramTitle: "Cara Kerja Jatah Belanja Aman:",
      diagramSteps: [
        {
          label: "Pemasukan Masuk",
          sublabel: "Misal: Rp 3.000.000 (30 Hari)",
          icon: "wallet-outline",
          color: colors.success,
        },
        {
          label: "Hitung Sisa Hari",
          sublabel: "Berjalan otomatis setiap hari",
          icon: "hourglass-outline",
          color: colors.info,
        },
        {
          label: "Jatah Belanja Aman",
          sublabel: "Sisa Uang ÷ Sisa Hari = Aman!",
          icon: "shield-checkmark-outline",
          color: colors.accent,
        },
      ],
      whyItMatters:
        "Banyak orang tekor bukan karena boros sekali belanja, tapi karena tidak sadar menghabiskan uang terlalu cepat di awal bulan. Dengan fitur ini, Anda tahu persis berapa batas belanja maksimal hari ini.",
      steps: [
        {
          number: "1",
          title: "Catat Pemasukan",
          description:
            "Klik tombol (+) ➔ Pilih Pemasukan (uang saku, honor, jatah belanja, atau pemasukan lainnya).",
        },
        {
          number: "2",
          title: "Atur Target Uang Bertahan",
          description:
            "Pilih jangka waktu uang ini harus bertahan (misal: 7 hari untuk mingguan, 30 hari untuk bulanan).",
        },
        {
          number: "3",
          title: "Pantau di Beranda",
          description:
            "Kartu di Beranda akan langsung memandu jatah belanja harian Anda dan sisa hari menuju bulan berikutnya.",
        },
      ],
      proTip:
        "Jika Anda belanja di bawah jatah hari ini, sisa uang otomatis menambah jatah belanja hari-hari berikutnya!",
      actionText: "Catat Pemasukan Sekarang",
      actionTarget: "AddTransaction",
    },
    {
      id: "recurring",
      title: "Pemasukan Rutin Otomatis",
      badge: "Otomatisasi",
      icon: "repeat-outline",
      color: colors.purple,
      summary:
        "Menerima uang saku, kiriman bulanan, atau pemasukan rutin berkala? Biarkan MyMoney mencatatnya secara otomatis tanpa perlu Anda ketik berulang.",
      diagramTitle: "Alur Pemasukan Rutin:",
      diagramSteps: [
        {
          label: "Atur Jadwal",
          sublabel: "Pilih tanggal & frekuensi rutin",
          icon: "calendar-outline",
          color: colors.purple,
        },
        {
          label: "Saat Jatuh Tempo",
          sublabel: "Sistem mendeteksi tanggal aktif",
          icon: "alarm-outline",
          color: colors.warning,
        },
        {
          label: "Otomatis Tercatat",
          sublabel: "Saldo & Jatah harian langsung update",
          icon: "checkmark-circle-outline",
          color: colors.success,
        },
      ],
      whyItMatters:
        "Anda tidak perlu mengingat tanggal atau repot mengetik ulang pemasukan setiap bulan. Aplikasi akan otomatis menambahkan transaksi saat tanggal jatuh tempo tiba.",
      steps: [
        {
          number: "1",
          title: "Buka Menu Transaksi Rutin",
          description:
            "Buka sidebar kiri (geser layar) ➔ Pilih menu Transaksi Rutin.",
        },
        {
          number: "2",
          title: "Buat Pemasukan Rutin",
          description:
            "Masukkan nama (misal: Uang Bulanan / Tagihan), nominal, dan pilih frekuensi (Mingguan / Bulanan / Kustom hari).",
        },
        {
          number: "3",
          title: "Hubungkan dengan Target Bertahan",
          description:
            "Saat jatuh tempo, pemasukan otomatis tercatat dan memperbarui jatah belanja harian Anda di Beranda!",
        },
      ],
      proTip:
        "Transaksi rutin juga bisa digunakan untuk tagihan tetap seperti Kost, WiFi, atau BPJS agar tidak lupa bayar!",
      actionText: "Buka Transaksi Rutin",
      actionTarget: "RecurringTransactions",
    },
    {
      id: "budget",
      title: "Anggaran & Batas Kategori",
      badge: "Kendali Belanja",
      icon: "pie-chart-outline",
      color: colors.warning,
      summary:
        "Kendalikan pos-pos rawan boncos seperti Makan Luar, Kopi, atau Belanja Online dengan batas maksimal bulanan.",
      diagramTitle: "Sistem Peringatan Anggaran:",
      diagramSteps: [
        {
          label: "Tetapkan Target",
          sublabel: "Misal: Makan Rp 1.500.000",
          icon: "flag-outline",
          color: colors.info,
        },
        {
          label: "Peringatan Dini",
          sublabel: "Warna berubah saat capai 80%",
          icon: "alert-circle-outline",
          color: colors.warning,
        },
        {
          label: "Alarm Overbudget",
          sublabel: "Notifikasi saat budget terlampaui",
          icon: "notifications-outline",
          color: colors.error,
        },
      ],
      whyItMatters:
        "Uang sering habis bukan pada hal besar, melainkan pengeluaran kecil harian yang tidak disadari. Anggaran memberi Anda 'lampu kuning' sebelum dompet jebol.",
      steps: [
        {
          number: "1",
          title: "Pilih Menu Anggaran",
          description:
            "Masuk ke tab Anggaran di menu utama atau sidebar navigasi.",
        },
        {
          number: "2",
          title: "Tentukan Batas Kategori",
          description:
            "Pilih kategori yang ingin dibatasi (misal Makanan) dan isi nominal batas maksimalnya.",
        },
        {
          number: "3",
          title: "Cek Bar Progres",
          description:
            "Setiap mencatat pengeluaran, bar progres akan terisi otomatis. Warna merah berarti Anda mendekati batas!",
        },
      ],
      proTip:
        "Aktifkan notifikasi Anggaran di menu Pengaturan untuk mendapatkan pengingat saat anggaran hampir habis.",
      actionText: "Atur Anggaran",
      actionTarget: "Budget",
    },
    {
      id: "privacy",
      title: "100% Privat & Cadangan Data",
      badge: "Keamanan Data",
      icon: "shield-checkmark-outline",
      color: colors.success,
      summary:
        "Data finansial Anda adalah milik pribadi Anda. Tersimpan 100% offline di HP tanpa ada server yang mengintip.",
      diagramTitle: "Keamanan Finansial Anda:",
      diagramSteps: [
        {
          label: "Lokal di HP",
          sublabel: "Database terenkripsi di sandbox HP",
          icon: "phone-portrait-outline",
          color: colors.success,
        },
        {
          label: "Kunci Biometrik",
          sublabel: "Buka via Sidik Jari / PIN",
          icon: "finger-print-outline",
          color: colors.accent,
        },
        {
          label: "Ekspor & Backup",
          sublabel: "Simpan file JSON / CSV mandiri",
          icon: "download-outline",
          color: colors.purple,
        },
      ],
      whyItMatters:
        "Banyak aplikasi finansial menjual atau menganalisis kebiasaan belanja Anda ke pihak ketiga. MyMoney menjamin 100% privasi: tidak butuh email/akun dan tidak ada iklan pelacak.",
      steps: [
        {
          number: "1",
          title: "Aktifkan Kunci Sidik Jari",
          description:
            "Masuk ke Pengaturan ➔ Keamanan ➔ Aktifkan Kunci Aplikasi untuk privasi penuh saat HP dipinjam teman.",
        },
        {
          number: "2",
          title: "Cadangkan Data Berkala",
          description:
            "Di menu Pengaturan ➔ Backup & Ekspor ➔ Klik 'Ekspor Data'. Simpan filenya ke Google Drive atau WhatsApp sendiri.",
        },
        {
          number: "3",
          title: "Pulihkan Kapan Saja",
          description:
            "Jika ganti HP, cukup unduh MyMoney dan klik 'Impor Data' untuk mengembalikan seluruh catatan dalam 2 detik.",
        },
      ],
      proTip:
        "Anda juga bisa mengekspor data ke format CSV untuk diolah di Microsoft Excel atau Google Sheets!",
      actionText: "Buka Pengaturan Keamanan",
      actionTarget: "Settings",
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
