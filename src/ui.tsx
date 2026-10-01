import React from "react";
import { Platform, Pressable, StyleSheet, Text, TextProps, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Hearts maroon and white: a maroon ground, white for the next milestone and the main actions, crest gold for the
// ones already passed. No green: it's the rivals' colour.
export const C = {
  bg: "#59191F",
  card: "#6B2129",
  text: "#FFFFFF",
  muted: "#E3BFC4",
  accent: "#FFFFFF",
  line: "#74303A",
  track: "#74303A",
  outline: "#8E434D",
  future: "#B98A91",
  good: "#F6BE5F",
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

// Android draws the app behind its navigation bar (edge to edge), so the pinned button clears that bar there.
// iPhone keeps the fixed gap it was designed with.
function useBottomInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === "ios" ? 0 : insets.bottom;
}

/** The main button, pinned to the bottom of the screen. */
export function Footer({ children }: { children: React.ReactNode }) {
  const inset = useBottomInset();
  return <View style={[styles.footer, { paddingBottom: Platform.OS === "ios" ? 36 : inset + 16 }]}>{children}</View>;
}

/** Bottom padding for scrolling content under a Footer, so its last row isn't hidden behind the button. */
export function useFooterSpace(): number {
  return 130 + useBottomInset();
}

const styles = StyleSheet.create({
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, backgroundColor: C.bg },
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
