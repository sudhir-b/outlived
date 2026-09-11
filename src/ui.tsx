import React from "react";
import { Pressable, StyleSheet, Text, TextProps, View, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Dark, warm palette: ink background, amber for the next milestone, green for the ones already passed.
export const C = {
  bg: "#14110F",
  card: "#221D19",
  text: "#F5EFE6",
  muted: "#A89F92",
  accent: "#E9A23B",
  accentSoft: "#3B2E17",
  line: "#2E2823",
  track: "#2E2823",
  future: "#8C8378",
  good: "#6FD08A",
  goodSoft: "#1E3326",
  danger: "#F08C7A",
};

export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({ name, size = 22, color = C.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Screen({ children, style, ...rest }: ViewProps) {
  return <View style={[styles.screen, style]} {...rest}>{children}</View>;
}
export function H1({ style, ...rest }: TextProps) { return <Text style={[styles.h1, style]} {...rest} />; }
export function H2({ style, ...rest }: TextProps) { return <Text style={[styles.h2, style]} {...rest} />; }
export function P({ style, ...rest }: TextProps) { return <Text style={[styles.p, style]} {...rest} />; }
export function Muted({ style, ...rest }: TextProps) { return <Text style={[styles.muted, style]} {...rest} />; }
export function Label({ style, ...rest }: TextProps) { return <Text style={[styles.label, style]} {...rest} />; }

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

export function Initials({ name, size = 44 }: { name: string; size?: number }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  const hue = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue}, 30%, 26%)`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: "700", color: `hsl(${hue}, 45%, 82%)` }}>{initials.toUpperCase()}</Text>
    </View>
  );
}

export const footer = { position: "absolute" as const, left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, backgroundColor: C.bg };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingTop: 64 },
  h1: { fontSize: 34, fontWeight: "800", color: C.text, letterSpacing: -0.5, lineHeight: 38 },
  h2: { fontSize: 22, fontWeight: "700", color: C.text },
  p: { fontSize: 19, color: C.text, lineHeight: 27 },
  muted: { fontSize: 17, color: C.muted, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: "700", color: C.muted, letterSpacing: 1.4 },
  btn: { backgroundColor: C.accent, paddingVertical: 18, paddingHorizontal: 24, borderRadius: 999, alignItems: "center" },
  btnSecondary: { backgroundColor: C.card },
  btnText: { color: C.bg, fontSize: 20, fontWeight: "800" },
  btnTextSecondary: { color: C.text },
});
