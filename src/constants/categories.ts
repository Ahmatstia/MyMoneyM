// File: src/constants/categories.ts

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
  customId?: string;
}

// Zero Default Categories: Pengguna bebas menentukan kategorinya sendiri secara manual
export const DEFAULT_CATEGORIES: CategoryItem[] = [];

// Registry fallback kategori lawas agar riwayat masa lalu tetap memiliki ikon & warna
export const LEGACY_CATEGORIES: CategoryItem[] = [
  { id: "makanan",      name: "Makanan",       icon: "restaurant-outline",          color: "#F59E0B" },
  { id: "transportasi", name: "Transportasi",  icon: "car-outline",                 color: "#3B82F6" },
  { id: "belanja",      name: "Belanja",       icon: "cart-outline",                color: "#8B5CF6" },
  { id: "tagihan",      name: "Tagihan",       icon: "document-text-outline",       color: "#6366F1" },
  { id: "pemasukan",    name: "Pemasukan",     icon: "cash-outline",                color: "#22D3EE" },
  { id: "lainnya",      name: "Lainnya",       icon: "ellipsis-horizontal-outline", color: "#94A3B8" },
  { id: "jajan",        name: "Jajan",         icon: "fast-food-outline",           color: "#F43F5E" },
  { id: "ngopi",        name: "Ngopi",         icon: "cafe-outline",                color: "#A855F7" },
  { id: "pakaian",      name: "Pakaian",       icon: "shirt-outline",               color: "#EC4899" },
  { id: "bbm",          name: "BBM",           icon: "flame-outline",               color: "#EF4444" },
  { id: "tol_parkir",   name: "Parkir",        icon: "navigate-outline",            color: "#6366F1" },
  { id: "rumah",        name: "Rumah",         icon: "home-outline",                color: "#22C55E" },
  { id: "keluarga",     name: "Keluarga",      icon: "people-outline",              color: "#3B82F6" },
  { id: "hewan",        name: "Hewan",         icon: "paw-outline",                 color: "#F97316" },
  { id: "listrik",      name: "Listrik",       icon: "flash-outline",               color: "#EAB308" },
  { id: "air",          name: "Air",           icon: "water-outline",               color: "#06B6D4" },
  { id: "internet",     name: "Internet",      icon: "wifi-outline",                color: "#3B82F6" },
  { id: "pulsa",        name: "Pulsa",         icon: "call-outline",                color: "#06B6D4" },
  { id: "cicilan",      name: "Cicilan",       icon: "calendar-outline",            color: "#8B5CF6" },
  { id: "pajak",        name: "Pajak",         icon: "receipt-outline",             color: "#F59E0B" },
  { id: "asuransi",     name: "Asuransi",      icon: "shield-checkmark-outline",    color: "#10B981" },
  { id: "hiburan",      name: "Hiburan",       icon: "film-outline",                color: "#EC4899" },
  { id: "langganan",    name: "Langganan",     icon: "play-circle-outline",         color: "#EF4444" },
  { id: "hobi",         name: "Hobi",          icon: "color-palette-outline",       color: "#EC4899" },
  { id: "liburan",      name: "Liburan",       icon: "airplane-outline",            color: "#3B82F6" },
  { id: "olahraga",     name: "Olahraga",      icon: "barbell-outline",             color: "#F97316" },
  { id: "perawatan",    name: "Perawatan",     icon: "body-outline",                color: "#F43F5E" },
  { id: "buku",         name: "Buku",          icon: "book-outline",                color: "#8B5CF6" },
  { id: "kesehatan",    name: "Kesehatan",     icon: "medical-outline",             color: "#EF4444" },
  { id: "pendidikan",   name: "Pendidikan",    icon: "school-outline",              color: "#10B981" },
  { id: "hadiah",       name: "Hadiah",        icon: "gift-outline",                color: "#EC4899" },
  { id: "donasi",       name: "Donasi",        icon: "heart-half-outline",          color: "#EF4444" },
  { id: "investasi",    name: "Investasi",     icon: "trending-up-outline",         color: "#06B6D4" },
  { id: "tabungan",     name: "Tabungan",      icon: "wallet-outline",              color: "#14B8A6" },
  { id: "hutang",       name: "Hutang",        icon: "card-outline",                color: "#F97316" },
  { id: "gaji",         name: "Gaji",          icon: "cash-outline",                color: "#22D3EE" },
];

export const ALL_SYSTEM_CATEGORIES: CategoryItem[] = [
  ...LEGACY_CATEGORIES,
];
