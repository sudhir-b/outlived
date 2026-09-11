import React from "react";
import { Pressable, StyleSheet, Text, TextProps, View, ViewProps } from "react-native";

export const C = {
  bg: "#FAF7F2",
  card: "#FFFFFF",
  text: "#1F1B16",
  muted: "#6B645B",
  accent: "#B5472A",
  accentSoft: "#F4E1DA",
  line: "#E7E1D8",
  good: "#2E6B3E",
  goodSoft: "#DFEEE2",
};

export function Screen({ children, style, ...rest }: ViewProps) {
  return <View style={[styles.screen, style]} {...rest}>{children}</View>;
}
export function H1({ style, ...rest }: TextProps) { return <Text style={[styles.h1, style]} {...rest} />; }
export function H2({ style, ...rest }: TextProps) { return <Text style={[styles.h2, style]} {...rest} />; }
export function P({ style, ...rest }: TextProps) { return <Text style={[styles.p, style]} {...rest} />; }
export function Muted({ style, ...rest }: TextProps) { return <Text style={[styles.muted, style]} {...rest} />; }

export function Button({ title, onPress, secondary, disabled }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, secondary && styles.btnSecondary, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.btnText, secondary && styles.btnTextSecondary]}>{title}</Text>
    </Pressable>
  );
}

export function Initials({ name, size = 52 }: { name: string; size?: number }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  const hue = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue}, 45%, 82%)`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: "700", color: `hsl(${hue}, 45%, 28%)` }}>{initials.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 64 },
  h1: { fontSize: 34, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", color: C.text },
  p: { fontSize: 19, color: C.text, lineHeight: 27 },
  muted: { fontSize: 17, color: C.muted, lineHeight: 24 },
  btn: { backgroundColor: C.accent, paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, alignItems: "center" },
  btnSecondary: { backgroundColor: C.accentSoft },
  btnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  btnTextSecondary: { color: C.accent },
});
