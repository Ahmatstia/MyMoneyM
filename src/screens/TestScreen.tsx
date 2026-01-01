import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { useTailwind } from "tailwindcss-react-native";

export default function TestScreen() {
  const tw = useTailwind();
  const [switchOn, setSwitchOn] = useState(false);
  const [text, setText] = useState("");

  return (
    <ScrollView
      style={tw("flex-1 bg-background")}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw("p-4")}>
        {/* Header */}
        <Text
          style={tw("text-3xl font-bold text-primary mt-2 mb-6 text-center")}
        >
          🎨 NativeWind Demo
        </Text>

        {/* Status */}
        <View
          style={tw("bg-green-50 p-4 rounded-xl border border-green-200 mb-6")}
        >
          <Text style={tw("text-green-800 font-bold text-lg")}>
            ✅ Setup Berhasil!
          </Text>
          <Text style={tw("text-green-700 mt-1")}>
            NativeWind v1.7.10 + React Navigation v6
          </Text>
        </View>

        {/* Color Palette */}
        <Text style={tw("text-xl font-bold text-gray-800 mb-3")}>
          Color Palette
        </Text>
        <View style={tw("flex-row flex-wrap gap-3 mb-6")}>
          {[
            { name: "Primary", class: "bg-primary", hex: "#4F46E5" },
            { name: "Secondary", class: "bg-secondary", hex: "#10B981" },
            { name: "Tertiary", class: "bg-tertiary", hex: "#F59E0B" },
            { name: "Error", class: "bg-error", hex: "#DC2626" },
            {
              name: "Surface",
              class: "bg-surface border border-outline",
              hex: "#FFFFFF",
            },
            {
              name: "Background",
              class: "bg-background border border-outline",
              hex: "#F9FAFB",
            },
          ].map((color) => (
            <View
              key={color.name}
              style={tw(`${color.class} w-28 h-28 rounded-xl justify-end p-2`)}
            >
              <Text style={tw("text-white text-xs font-medium")}>
                {color.name}
              </Text>
              <Text style={tw("text-white text-xs opacity-90")}>
                {color.hex}
              </Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <Text style={tw("text-xl font-bold text-gray-800 mb-3")}>Buttons</Text>
        <View style={tw("gap-3 mb-6")}>
          <TouchableOpacity
            style={tw("bg-primary py-3 rounded-lg")}
            onPress={() => console.log("Primary pressed")}
          >
            <Text style={tw("text-white font-semibold text-center")}>
              Primary Button
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw("bg-secondary py-3 rounded-lg")}
            onPress={() => console.log("Secondary pressed")}
          >
            <Text style={tw("text-white font-semibold text-center")}>
              Secondary Button
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw("border-2 border-primary bg-transparent py-3 rounded-lg")}
            onPress={() => console.log("Outline pressed")}
          >
            <Text style={tw("text-primary font-semibold text-center")}>
              Outline Button
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Elements */}
        <Text style={tw("text-xl font-bold text-gray-800 mb-3")}>
          Form Elements
        </Text>
        <View
          style={tw("bg-surface p-4 rounded-xl border border-outline mb-6")}
        >
          {/* TextInput */}
          <Text style={tw("text-gray-700 mb-2")}>Text Input:</Text>
          <TextInput
            style={tw(
              "border border-outline rounded-lg p-3 mb-4 text-gray-800"
            )}
            placeholder="Type something..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
          />

          {/* Switch */}
          <View style={tw("flex-row items-center justify-between")}>
            <Text style={tw("text-gray-700")}>Switch:</Text>
            <Switch
              value={switchOn}
              onValueChange={setSwitchOn}
              trackColor={{ false: "#D1D5DB", true: "#10B981" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Typography */}
        <Text style={tw("text-xl font-bold text-gray-800 mb-3")}>
          Typography
        </Text>
        <View style={tw("bg-surfaceVariant p-4 rounded-xl mb-6")}>
          <Text style={tw("text-xs text-gray-600")}>Extra Small - text-xs</Text>
          <Text style={tw("text-sm text-gray-600 mt-1")}>Small - text-sm</Text>
          <Text style={tw("text-base text-gray-700 mt-1")}>
            Base - text-base
          </Text>
          <Text style={tw("text-lg text-gray-800 mt-1")}>Large - text-lg</Text>
          <Text style={tw("text-xl font-bold text-gray-900 mt-1")}>
            Extra Large - text-xl
          </Text>
          <Text style={tw("text-2xl font-bold text-primary mt-1")}>
            2XL Primary - text-2xl
          </Text>
        </View>

        {/* Spacing & Shadows */}
        <Text style={tw("text-xl font-bold text-gray-800 mb-3")}>
          Spacing & Shadows
        </Text>
        <View style={tw("flex-row gap-3 mb-8")}>
          <View style={tw("bg-primary p-2 rounded")}>
            <Text style={tw("text-white text-xs")}>p-2</Text>
          </View>
          <View style={tw("bg-primary p-4 rounded-lg")}>
            <Text style={tw("text-white text-xs")}>p-4</Text>
          </View>
          <View style={tw("bg-primary p-6 rounded-lg shadow-lg")}>
            <Text style={tw("text-white text-xs")}>p-6 + shadow</Text>
          </View>
        </View>

        {/* Success Footer */}
        <View
          style={tw("bg-primary/10 p-4 rounded-xl border border-primary/20")}
        >
          <Text style={tw("text-primary font-bold text-center text-lg")}>
            🎉 NativeWind Berfungsi Sempurna!
          </Text>
          <Text style={tw("text-gray-700 text-center mt-2")}>
            Semua utilitas Tailwind CSS bekerja di React Native
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
