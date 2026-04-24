// File: src/screens/Profile/ProfileScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  ImageBackground,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  getDay,
  isSameMonth,
  isToday
} from "date-fns";
import { id } from "date-fns/locale";

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { formatCurrency } from "../../utils/calculations";

const { width } = Dimensions.get("window");

const SectionHeader = ({ title, icon }: { title: string; icon?: string }) => (
  <View style={tw`flex-row items-center mb-4 mt-6 px-1`}>
    <View style={tw`w-1.5 h-4 bg-[#22D3EE] rounded-full mr-3`} />
    <Text style={tw`text-[#94A3B8] text-[11px] font-extrabold uppercase tracking-[2px]`}>{title}</Text>
    {icon && <Ionicons name={icon as any} size={14} color="#64748B" style={tw`ml-2`} />}
  </View>
);

const ProfileScreen: React.FC = () => {
  const { state, clearAllData, debugStorage, isLoading, updateUserProfile } = useAppContext();
  const { userProfile } = state;
  
  if (!userProfile) {
    return (
      <View style={tw`flex-1 bg-[#0F172A] items-center justify-center`}>
        <Text style={tw`text-white`}>Memuat Profil...</Text>
      </View>
    );
  }

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const pickImage = async (type: "avatar" | "cover") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "avatar") {
        await updateUserProfile({ avatar: uri });
      } else {
        await updateUserProfile({ coverImage: uri });
      }
    }
  };

  const handleUpdateName = async () => {
    if (tempName.trim().length === 0) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }
    await updateUserProfile({ name: tempName });
    setIsEditModalVisible(false);
  };

  // ─── MONTHLY HEATMAP LOGIC ──────────────────────────────────────────────────
  const { calendarDays, monthTotalActivity } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Padding awal (agar hari pertama sesuai dengan nama hari)
    // getDay() returns 0 (Sun) to 6 (Sat). Kita mau Sen-Min (1-0)
    let firstDayIndex = getDay(start);
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Sesuaikan ke Sen=0, Min=6
    
    const padding = Array(firstDayIndex).fill(null);
    
    // Hitung transaksi per hari
    const counts: Record<string, number> = {};
    let total = 0;
    state.transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (isSameMonth(tDate, currentMonth)) {
        const dateKey = format(tDate, 'yyyy-MM-dd');
        counts[dateKey] = (counts[dateKey] || 0) + 1;
        total++;
      }
    });

    return {
      calendarDays: [...padding, ...days.map(d => ({ 
        date: d, 
        count: counts[format(d, 'yyyy-MM-dd')] || 0 
      }))],
      monthTotalActivity: total
    };
  }, [currentMonth, state.transactions]);

  const getActivityColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "transparent";
    if (count === 0) return "rgba(255, 255, 255, 0.05)";
    if (count === 1) return "rgba(34, 211, 238, 0.3)";
    if (count === 2) return "rgba(34, 211, 238, 0.6)";
    return "#22D3EE";
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0F172A]`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-32`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#22D3EE" />
        }
      >
        {/* Header imersif */}
        <View style={tw`relative`}>
          <ImageBackground
            source={userProfile.coverImage ? { uri: userProfile.coverImage } : require("../../../assets/bg.png")}
            style={tw`h-72 justify-end`}
            imageStyle={tw`opacity-60`}
          >
            <LinearGradient colors={["transparent", "rgba(15, 23, 42, 0.8)", "#0F172A"]} style={tw`absolute inset-0`} />
            <View style={tw`absolute top-12 right-6`}>
              <TouchableOpacity onPress={() => pickImage("cover")} style={tw`bg-black/30 p-2.5 rounded-full border border-white/10`}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={tw`px-6 pb-6 flex-row items-center`}>
              <View style={tw`relative`}>
                <LinearGradient colors={["#22D3EE", "#06B6D4"]} style={tw`p-1 rounded-[32px]`}>
                  <View style={tw`w-24 h-24 rounded-[28px] bg-[#0F172A] items-center justify-center overflow-hidden`}>
                    {userProfile.avatar ? (
                      <Image source={{ uri: userProfile.avatar }} style={tw`w-full h-full`} />
                    ) : (
                      <Ionicons name="person" size={40} color="#22D3EE" />
                    )}
                  </View>
                </LinearGradient>
                <TouchableOpacity onPress={() => pickImage("avatar")} style={tw`absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#22D3EE] items-center justify-center border-4 border-[#0F172A]`}>
                  <Ionicons name="camera" size={14} color="#0F172A" />
                </TouchableOpacity>
              </View>
              
              <View style={tw`ml-5 flex-1`}>
                <View style={tw`flex-row items-center mb-1`}>
                  <Text style={tw`text-white text-2xl font-black mr-2`} numberOfLines={1}>
                    {userProfile.name}
                  </Text>
                  <TouchableOpacity onPress={() => { setTempName(userProfile.name); setIsEditModalVisible(true); }}>
                    <View style={tw`bg-white/10 p-1.5 rounded-lg`}>
                      <Ionicons name="pencil" size={14} color="#22D3EE" />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-cyan-500/20 px-2.5 py-1 rounded-full mr-2`}>
                    <Text style={tw`text-[#22D3EE] text-[9px] font-black uppercase tracking-wider`}>Pro Member</Text>
                  </View>
                  <Text style={tw`text-[#94A3B8] text-xs font-medium`}>Joined April 2026</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={tw`px-6 -mt-2`}>
          
          {/* Monthly Consistency Heatmap */}
          <SectionHeader title="Consistency Calendar" icon="calendar" />
          <LinearGradient
            colors={["rgba(30, 41, 59, 0.7)", "rgba(15, 23, 42, 0.9)"]}
            style={tw`rounded-3xl border border-white/10 p-5 mb-2`}
          >
            {/* Header Kalender */}
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <TouchableOpacity onPress={prevMonth} style={tw`p-2 bg-white/5 rounded-full`}>
                <Ionicons name="chevron-back" size={18} color="#22D3EE" />
              </TouchableOpacity>
              
              <View style={tw`items-center`}>
                <Text style={tw`text-white text-base font-black capitalize`}>
                  {format(currentMonth, 'MMMM yyyy', { locale: id })}
                </Text>
                <Text style={tw`text-[#64748B] text-[9px] font-bold uppercase tracking-widest`}>
                  {monthTotalActivity} AKTIVITAS
                </Text>
              </View>

              <TouchableOpacity onPress={nextMonth} style={tw`p-2 bg-white/5 rounded-full`}>
                <Ionicons name="chevron-forward" size={18} color="#22D3EE" />
              </TouchableOpacity>
            </View>

            {/* Nama Hari */}
            <View style={tw`flex-row justify-between mb-4`}>
              {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                <View key={i} style={tw`w-9 items-center`}>
                  <Text style={tw`text-[#64748B] text-[10px] font-bold`}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid Kalender (Terbagi Rata & Terkunci di Kolomnya) */}
            <View>
              {(() => {
                const rows = [];
                for (let i = 0; i < calendarDays.length; i += 7) {
                  let week = calendarDays.slice(i, i + 7);
                  // Tambahkan padding jika baris terakhir kurang dari 7 hari
                  while (week.length < 7) {
                    week.push(null);
                  }
                  rows.push(week);
                }
                return rows.map((week, wIndex) => (
                  <View key={wIndex} style={tw`flex-row justify-between mb-1.5`}>
                    {week.map((day, dIndex) => (
                      <View 
                        key={dIndex} 
                        style={[
                          tw`w-9 h-9 rounded-lg items-center justify-center border border-white/5`,
                          { backgroundColor: day ? getActivityColor(day.count, true) : 'transparent' }
                        ]}
                      >
                        {day && (
                          <Text style={[
                            tw`text-[10px] font-bold`,
                            { color: day.count > 0 ? '#0F172A' : (isToday(day.date) ? '#22D3EE' : '#94A3B8') }
                          ]}>
                            {format(day.date, 'd')}
                          </Text>
                        )}
                        {day && isToday(day.date) && day.count === 0 && (
                          <View style={tw`absolute bottom-1 w-1 h-1 bg-[#22D3EE] rounded-full`} />
                        )}
                      </View>
                    ))}
                  </View>
                ));
              })()}
            </View>

            {/* Legend */}
            <View style={tw`flex-row items-center justify-center mt-4 gap-4`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-2.5 h-2.5 rounded-[3px] bg-white/5 border border-white/10`} />
                <Text style={tw`text-[#64748B] text-[9px] font-bold`}>0</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-2.5 h-2.5 rounded-[3px] bg-cyan-500/30`} />
                <Text style={tw`text-[#64748B] text-[9px] font-bold`}>1</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-2.5 h-2.5 rounded-[3px] bg-cyan-500/60`} />
                <Text style={tw`text-[#64748B] text-[9px] font-bold`}>2</Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={tw`w-2.5 h-2.5 rounded-[3px] bg-[#22D3EE]`} />
                <Text style={tw`text-[#64748B] text-[9px] font-bold`}>3+</Text>
              </View>
            </View>
          </LinearGradient>

          <SectionHeader title="Statistik Utama" />
          <View style={tw`flex-row gap-4 mb-2`}>
            <TouchableOpacity style={tw`flex-1 bg-[#1E293B] p-5 rounded-3xl border border-white/5`}>
              <View style={tw`w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mb-3`}>
                <Ionicons name="wallet-outline" size={20} color="#818CF8" />
              </View>
              <Text style={tw`text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider mb-1`}>Saldo Bersih</Text>
              <Text style={tw`text-white text-base font-black`} numberOfLines={1}>
                {formatCurrency(state.balance)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={tw`flex-1 bg-[#1E293B] p-5 rounded-3xl border border-white/5`}>
              <View style={tw`w-10 h-10 rounded-2xl bg-emerald-500/10 items-center justify-center mb-3`}>
                <Ionicons name="pie-chart-outline" size={20} color="#10B981" />
              </View>
              <Text style={tw`text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider mb-1`}>Anggaran</Text>
              <Text style={tw`text-white text-base font-black`} numberOfLines={1}>
                {state.budgets.length} Aktif
              </Text>
            </TouchableOpacity>
          </View>

          <SectionHeader title="Kelola Akun" />
          <View style={tw`bg-[#1E293B] rounded-3xl border border-white/5 overflow-hidden`}>
            <TouchableOpacity onPress={debugStorage} style={tw`flex-row items-center p-4 border-b border-white/5`}>
              <View style={tw`w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center mr-4`}>
                <Ionicons name="shield-outline" size={18} color="#3B82F6" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-sm font-bold`}>Keamanan & Storage</Text>
                <Text style={tw`text-[#64748B] text-[10px]`}>Cek integritas database lokal</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { Alert.alert("Wipe Data", "Hapus semua data?", [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: clearAllData }]) }} style={tw`flex-row items-center p-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center mr-4`}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[#EF4444] text-sm font-bold`}>Hapus Semua Data</Text>
                <Text style={tw`text-[#64748B] text-[10px]`}>Reset aplikasi ke pengaturan pabrik</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal Edit Nama */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/80 justify-end`}>
          <View style={tw`bg-[#1E293B] rounded-t-[40px] p-8 border-t border-white/10`}>
            <View style={tw`w-12 h-1.5 bg-white/10 rounded-full self-center mb-8`} />
            <Text style={tw`text-white text-2xl font-black mb-2`}>Ubah Nama</Text>
            <View style={tw`bg-black/30 rounded-2xl p-4 mb-8 border border-white/5`}>
              <TextInput value={tempName} onChangeText={setTempName} placeholder="Nama Anda" placeholderTextColor="#64748B" style={tw`text-white text-lg font-bold`} autoFocus />
            </View>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={tw`flex-1 p-5 rounded-2xl bg-white/5 items-center`}><Text style={tw`text-[#94A3B8] font-black`}>Batal</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateName} style={tw`flex-1 p-5 rounded-2xl bg-[#22D3EE] items-center`}><Text style={tw`text-[#0F172A] font-black`}>Simpan</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
