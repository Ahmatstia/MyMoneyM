// File: src/screens/Profile/ProfileScreen.tsx
import React, { useState } from "react";
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

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { formatCurrency } from "../../utils/calculations";

type SafeIconName = keyof typeof Ionicons.glyphMap;

const { width } = Dimensions.get("window");

// ─── Theme colors ──────────────────────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;
const INFO_COLOR       = Colors.info;
const PURPLE_COLOR     = Colors.purple || "#8B5CF6";

const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

const SectionHeader = ({ title }: { title: string }) => (
  <View style={tw`flex-row items-center mb-3 mt-4`}>
    <View style={tw`w-1 h-3 bg-[#22D3EE] rounded-full mr-2`} />
    <Text style={tw`text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest`}>{title}</Text>
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

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0F172A]`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ACCENT_COLOR} />
        }
      >
        {/* Header dengan Cover Image */}
        <ImageBackground
          source={userProfile.coverImage ? { uri: userProfile.coverImage } : require("../../../assets/bg.png")}
          style={tw`h-56 justify-end pb-0`}
          imageStyle={{ opacity: 0.5 }}
        >
          <View style={tw`absolute top-10 right-4 flex-row gap-2`}>
            <TouchableOpacity 
              onPress={() => pickImage("cover")}
              style={tw`w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/20`}
            >
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Profile Picture & Name Overlay */}
          <View style={tw`px-6 flex-row items-end translate-y-12`}>
            <View style={tw`relative`}>
              <View style={tw`w-28 h-28 rounded-3xl bg-[#1E293B] border-4 border-[#0F172A] items-center justify-center overflow-hidden`}>
                {userProfile.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={tw`w-full h-full`} />
                ) : (
                  <Ionicons name="person" size={48} color="#22D3EE" />
                )}
              </View>
              <TouchableOpacity 
                onPress={() => pickImage("avatar")}
                style={tw`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#22D3EE] items-center justify-center border-2 border-[#0F172A]`}
              >
                <Ionicons name="camera" size={14} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={tw`ml-4 mb-2 flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-white text-2xl font-bold mr-2`} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <TouchableOpacity onPress={() => {
                  setTempName(userProfile.name);
                  setIsEditModalVisible(true);
                }}>
                  <Ionicons name="pencil-outline" size={18} color="#22D3EE" />
                </TouchableOpacity>
              </View>
              <Text style={tw`text-[#94A3B8] text-xs font-medium`}>Keuangan Personal • MyMoney</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Content Section */}
        <View style={tw`px-6 mt-20`}>
          
          <SectionHeader title="Ringkasan Finansial" />
          <View style={tw`bg-[#1E293B] rounded-3xl border border-white/5 p-5`}>
             <Text style={tw`text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-1`}>
               Total Saldo
             </Text>
             <Text style={tw`text-white text-3xl font-extrabold mb-4`}>
               {formatCurrency(state.balance)}
             </Text>
             
             <View style={tw`flex-row justify-between bg-black/20 rounded-2xl p-4`}>
                <View>
                  <Text style={tw`text-[#10B981] text-[10px] font-bold uppercase mb-1`}>Pemasukan</Text>
                  <Text style={tw`text-white font-bold`}>{formatCurrency(state.totalIncome)}</Text>
                </View>
                <View style={tw`w-px h-8 bg-white/10`} />
                <View>
                  <Text style={tw`text-[#EF4444] text-[10px] font-bold uppercase mb-1`}>Pengeluaran</Text>
                  <Text style={tw`text-white font-bold`}>{formatCurrency(state.totalExpense)}</Text>
                </View>
             </View>
          </View>

          <SectionHeader title="Aksi Cepat" />
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity 
              onPress={debugStorage}
              style={tw`flex-1 bg-[#1E293B] border border-white/5 p-4 rounded-2xl items-center`}
            >
              <View style={tw`w-10 h-10 rounded-xl bg-cyan-400/10 items-center justify-center mb-2`}>
                <Ionicons name="bug-outline" size={20} color="#22D3EE" />
              </View>
              <Text style={tw`text-white text-xs font-bold`}>Cek Storage</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                Alert.alert("Hapus Data", "Hapus semua data finansial?", [
                  { text: "Batal", style: "cancel" },
                  { text: "Hapus", style: "destructive", onPress: clearAllData }
                ])
              }}
              style={tw`flex-1 bg-[#1E293B] border border-white/5 p-4 rounded-2xl items-center`}
            >
              <View style={tw`w-10 h-10 rounded-xl bg-red-400/10 items-center justify-center mb-2`}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <Text style={tw`text-white text-xs font-bold`}>Wipe Data</Text>
            </TouchableOpacity>
          </View>

          <SectionHeader title="Informasi Aplikasi" />
          <View style={tw`bg-[#1E293B] rounded-3xl border border-white/5 overflow-hidden`}>
            {[
              { icon: "shield-checkmark-outline", label: "Privasi", value: "Data Terenkripsi Lokal", color: "#8B5CF6" },
              { icon: "refresh-outline", label: "Versi", value: "v1.0.1 Stable", color: "#F59E0B" },
              { icon: "code-working-outline", label: "Engine", value: "React Native Core", color: "#3B82F6" },
            ].map((item, index) => (
              <View key={index} style={tw`flex-row items-center p-4 ${index !== 2 ? 'border-b border-white/5' : ''}`}>
                <View style={tw`w-10 h-10 rounded-xl bg-[${item.color}]/10 items-center justify-center mr-4`}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View>
                  <Text style={tw`text-[#94A3B8] text-[10px] font-bold uppercase`}>{item.label}</Text>
                  <Text style={tw`text-white text-sm font-medium`}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={tw`mt-8 items-center`}>
            <Text style={tw`text-[#64748B] text-[10px]`}>© 2026 Lexanova • Made with Passion</Text>
          </View>

        </View>
      </ScrollView>

      {/* Modal Edit Nama */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/60 justify-center px-6`}>
          <View style={tw`bg-[#1E293B] rounded-3xl border border-white/10 p-6`}>
            <Text style={tw`text-white text-lg font-bold mb-4`}>Ubah Nama Profil</Text>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              placeholder="Masukkan nama Anda"
              placeholderTextColor="#94A3B8"
              style={tw`bg-black/20 rounded-xl p-4 text-white mb-6 border border-white/5`}
              autoFocus
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity 
                onPress={() => setIsEditModalVisible(false)}
                style={tw`flex-1 p-4 rounded-xl bg-white/5 items-center`}
              >
                <Text style={tw`text-[#94A3B8] font-bold`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdateName}
                style={tw`flex-1 p-4 rounded-xl bg-[#22D3EE] items-center`}
              >
                <Text style={tw`text-[#0F172A] font-bold`}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ProfileScreen;
