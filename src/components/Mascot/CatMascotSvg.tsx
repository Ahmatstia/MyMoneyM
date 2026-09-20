import React from "react";
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { AccessoryId, CatMood } from "../../types/gamification";

interface CatMascotSvgProps {
  mood?: CatMood;
  accessory?: AccessoryId;
  isBlinking?: boolean;
  size?: number;
}

export const CatMascotSvg: React.FC<CatMascotSvgProps> = ({
  mood = "happy",
  accessory = "none",
  isBlinking = false,
  size = 110,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        {/* Cat Fur Gradient */}
        <LinearGradient id="furGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FED7AA" />
          <Stop offset="50%" stopColor="#FDBA74" />
          <Stop offset="100%" stopColor="#FB923C" />
        </LinearGradient>

        {/* Belly Gradient */}
        <LinearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#FEF3C7" />
        </LinearGradient>

        {/* Gold Coin Gradient */}
        <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#FACC15" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>

        {/* Sunglasses Gradient */}
        <LinearGradient id="sunglassesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1E293B" />
          <Stop offset="50%" stopColor="#0F172A" />
          <Stop offset="100%" stopColor="#020617" />
        </LinearGradient>

        {/* Chef Hat Shading */}
        <LinearGradient id="chefHatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E2E8F0" />
        </LinearGradient>

        {/* Rosy Cheek Glow */}
        <RadialGradient id="blushGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FB7185" stopOpacity="0.75" />
          <Stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ─── TAIL ──────────────────────────────────────────────────────── */}
      <Path
        d="M 148 145 C 180 135 190 100 175 80 C 168 70 156 75 160 85 C 166 98 158 118 135 125 Z"
        fill="#FB923C"
      />

      {/* ─── LEFT EAR ─────────────────────────────────────────────────── */}
      <Path
        d="M 52 75 C 45 42 62 25 72 24 C 82 23 88 45 88 65 Z"
        fill="url(#furGradient)"
      />
      {/* Left Inner Ear */}
      <Path
        d="M 58 68 C 54 48 64 36 71 35 C 77 34 81 48 81 62 Z"
        fill="#FDA4AF"
      />

      {/* ─── RIGHT EAR ────────────────────────────────────────────────── */}
      <Path
        d="M 148 75 C 155 42 138 25 128 24 C 118 23 112 45 112 65 Z"
        fill="url(#furGradient)"
      />
      {/* Right Inner Ear */}
      <Path
        d="M 142 68 C 146 48 136 36 129 35 C 123 34 119 48 119 62 Z"
        fill="#FDA4AF"
      />

      {/* ─── BODY (Chubby round shape) ────────────────────────────────── */}
      <Ellipse
        cx="100"
        cy="125"
        rx="58"
        ry="50"
        fill="url(#furGradient)"
      />

      {/* ─── WHITE BELLY ──────────────────────────────────────────────── */}
      <Ellipse
        cx="100"
        cy="132"
        rx="40"
        ry="34"
        fill="url(#bellyGradient)"
      />

      {/* ─── HEAD ─────────────────────────────────────────────────────── */}
      <Ellipse
        cx="100"
        cy="86"
        rx="52"
        ry="44"
        fill="url(#furGradient)"
      />

      {/* Forehead Marking / Tabbies */}
      <Path
        d="M 97 46 L 103 46 L 101 54 L 99 54 Z"
        fill="#EA580C"
        opacity="0.6"
      />
      <Path
        d="M 88 49 L 93 49 L 91 56 L 87 56 Z"
        fill="#EA580C"
        opacity="0.6"
      />
      <Path
        d="M 112 49 L 107 49 L 109 56 L 113 56 Z"
        fill="#EA580C"
        opacity="0.6"
      />

      {/* ─── ROSY BLUSH CHEEKS ────────────────────────────────────────── */}
      <Circle cx="64" cy="95" r="10" fill="url(#blushGlow)" />
      <Circle cx="136" cy="95" r="10" fill="url(#blushGlow)" />

      {/* ─── EYES (Dynamic based on Mood and Blinking) ────────────────── */}
      {isBlinking || mood === "sleepy" ? (
        // Closed / Sleeping eyes
        <G stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <Path d="M 68 88 Q 78 94 88 88" />
          <Path d="M 112 88 Q 122 94 132 88" />
          {mood === "sleepy" && (
            <G stroke="#3B82F6" strokeWidth="2.5">
              {/* Little Zzz */}
              <Path d="M 145 60 L 155 60 L 145 70 L 155 70" />
              <Path d="M 160 48 L 167 48 L 160 55 L 167 55" />
            </G>
          )}
        </G>
      ) : mood === "happy" || mood === "playful" ? (
        // Happy Crescent Eyes (^ ^)
        <G stroke="#7C2D12" strokeWidth="4" strokeLinecap="round" fill="none">
          <Path d="M 67 90 Q 78 77 89 90" />
          <Path d="M 111 90 Q 122 77 133 90" />
        </G>
      ) : mood === "celebrate" ? (
        // Sparkling Star Eyes
        <G fill="#CA8A04">
          {/* Left Star Eye */}
          <Path d="M 78 75 Q 78 86 85 86 Q 78 86 78 97 Q 78 86 71 86 Q 78 86 78 75 Z" />
          {/* Right Star Eye */}
          <Path d="M 122 75 Q 122 86 129 86 Q 122 86 122 97 Q 122 86 115 86 Q 122 86 122 75 Z" />
        </G>
      ) : mood === "worried" ? (
        // Anxious / Worried Eyes
        <G>
          <Ellipse cx="78" cy="87" rx="8" ry="9" fill="#7C2D12" />
          <Ellipse cx="122" cy="87" rx="8" ry="9" fill="#7C2D12" />
          <Circle cx="81" cy="84" r="3" fill="#FFFFFF" />
          <Circle cx="125" cy="84" r="3" fill="#FFFFFF" />
          {/* Sweat drop */}
          <Path
            d="M 138 72 C 138 68 143 62 143 62 C 143 62 148 68 148 72 C 148 75 144 77 143 77 C 141 77 138 75 138 72 Z"
            fill="#38BDF8"
          />
        </G>
      ) : (
        // Default Anime Eyes with Sparkles
        <G>
          <Ellipse cx="78" cy="87" rx="7.5" ry="9" fill="#7C2D12" />
          <Ellipse cx="122" cy="87" rx="7.5" ry="9" fill="#7C2D12" />
          {/* Sparkles */}
          <Circle cx="76" cy="84" r="3" fill="#FFFFFF" />
          <Circle cx="81" cy="89" r="1.5" fill="#FFFFFF" />
          <Circle cx="120" cy="84" r="3" fill="#FFFFFF" />
          <Circle cx="125" cy="89" r="1.5" fill="#FFFFFF" />
        </G>
      )}

      {/* ─── NOSE & MOUTH ─────────────────────────────────────────────── */}
      {/* Little Pink Triangle Nose */}
      <Path
        d="M 97 93 L 103 93 L 100 97 Z"
        fill="#F43F5E"
      />
      {/* W-Shaped Cat Mouth */}
      <Path
        d="M 94 97 Q 97 101 100 97 Q 103 101 106 97"
        stroke="#7C2D12"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── WHISKERS ─────────────────────────────────────────────────── */}
      <G stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        {/* Left Whiskers */}
        <Path d="M 52 90 L 32 87" />
        <Path d="M 52 95 L 30 96" />
        <Path d="M 53 100 L 34 105" />
        {/* Right Whiskers */}
        <Path d="M 148 90 L 168 87" />
        <Path d="M 148 95 L 170 96" />
        <Path d="M 147 100 L 166 105" />
      </G>

      {/* ─── PAWS HOLDING GOLDEN RUPIAH COIN ───────────────────────────── */}
      {/* The Lucky Coin */}
      <Circle
        cx="100"
        cy="134"
        r="19"
        fill="url(#goldGradient)"
        stroke="#B45309"
        strokeWidth="2"
      />
      <Circle
        cx="100"
        cy="134"
        r="15"
        stroke="#FEF08A"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="2, 2"
      />
      {/* "Rp" symbol on the coin */}
      <Path
        d="M 93 128 L 93 140 M 93 128 L 98 128 C 101 128 101 133 98 133 L 93 133 M 97 133 L 101 140 M 103 132 L 103 140 M 103 135 C 105 133 108 133 108 135 L 108 140"
        stroke="#78350F"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Left Front Paw */}
      <Ellipse
        cx="78"
        cy="136"
        rx="10"
        ry="8"
        fill="#FED7AA"
        stroke="#F97316"
        strokeWidth="1.5"
      />
      {/* Right Front Paw */}
      <Ellipse
        cx="122"
        cy="136"
        rx="10"
        ry="8"
        fill="#FED7AA"
        stroke="#F97316"
        strokeWidth="1.5"
      />

      {/* Little Back Feet */}
      <Ellipse cx="72" cy="168" rx="14" ry="8" fill="#FDBA74" />
      <Ellipse cx="128" cy="168" rx="14" ry="8" fill="#FDBA74" />

      {/* ─── ACCESSORIES (Conditionally rendered) ──────────────────────── */}

      {/* 1. Golden Bell with Red Collar */}
      {accessory === "bell" && (
        <G>
          {/* Red collar band */}
          <Path
            d="M 70 114 Q 100 124 130 114"
            stroke="#DC2626"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bell Body */}
          <Circle
            cx="100"
            cy="119"
            r="8"
            fill="url(#goldGradient)"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          <Circle cx="100" cy="122" r="1.5" fill="#78350F" />
          <Path d="M 96 122 L 104 122" stroke="#78350F" strokeWidth="1" />
        </G>
      )}

      {/* 2. Cool Sunglasses */}
      {accessory === "sunglasses" && (
        <G>
          {/* Bridge */}
          <Path
            d="M 94 85 L 106 85"
            stroke="#020617"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Left Lens */}
          <Rect
            x="64"
            y="76"
            width="28"
            height="18"
            rx="6"
            fill="url(#sunglassesGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Left Lens Reflection */}
          <Path
            d="M 68 79 L 75 79 L 70 91 L 67 91 Z"
            fill="#FFFFFF"
            opacity="0.35"
          />
          {/* Right Lens */}
          <Rect
            x="108"
            y="76"
            width="28"
            height="18"
            rx="6"
            fill="url(#sunglassesGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Right Lens Reflection */}
          <Path
            d="M 112 79 L 119 79 L 114 91 L 111 91 Z"
            fill="#FFFFFF"
            opacity="0.35"
          />
        </G>
      )}

      {/* 3. Cute Pink / Gold Ribbon Bow */}
      {accessory === "bow" && (
        <G transform="translate(132, 42) rotate(15)">
          {/* Left loop */}
          <Path
            d="M 0 0 C -12 -10 -15 10 0 4 Z"
            fill="#F43F5E"
            stroke="#BE123C"
            strokeWidth="1.5"
          />
          {/* Right loop */}
          <Path
            d="M 0 0 C 12 -10 15 10 0 4 Z"
            fill="#F43F5E"
            stroke="#BE123C"
            strokeWidth="1.5"
          />
          {/* Center knot */}
          <Circle cx="0" cy="2" r="3.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
        </G>
      )}

      {/* 4. Chef Hat */}
      {accessory === "chef_hat" && (
        <G transform="translate(100, 38)">
          {/* Puffy top */}
          <Circle cx="-16" cy="-14" r="14" fill="url(#chefHatGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <Circle cx="16" cy="-14" r="14" fill="url(#chefHatGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <Circle cx="0" cy="-22" r="16" fill="url(#chefHatGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Hat band */}
          <Rect
            x="-26"
            y="-4"
            width="52"
            height="14"
            rx="3"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* Band pleat lines */}
          <Path d="M -12 -4 L -12 10 M 0 -4 L 0 10 M 12 -4 L 12 10" stroke="#E2E8F0" strokeWidth="1.5" />
        </G>
      )}

      {/* 5. Royal Sparkling Crown */}
      {accessory === "crown" && (
        <G transform="translate(100, 36)">
          {/* Crown Base */}
          <Path
            d="M -24 8 L -20 -12 L -7 0 L 0 -18 L 7 0 L 20 -12 L 24 8 Z"
            fill="url(#goldGradient)"
            stroke="#92400E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Crown Jewels (Rubies & Emeralds) */}
          <Circle cx="-20" cy="-12" r="2.5" fill="#EF4444" />
          <Circle cx="0" cy="-18" r="3.5" fill="#3B82F6" />
          <Circle cx="20" cy="-12" r="2.5" fill="#EF4444" />
          {/* Center gem on base */}
          <Circle cx="0" cy="2" r="2.5" fill="#10B981" />
        </G>
      )}
    </Svg>
  );
};
