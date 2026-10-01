import React, { useLayoutEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, C, Footer, Icon, Muted, Screen, useFooterSpace } from "../ui";
import { PEOPLE, Person, THEMES, randomPeople, stillAhead } from "../lib/people";
import { Civil, formatYear } from "../lib/dates";

type Nav = { setOptions: (o: object) => void };

const matches = (p: Person, q: string) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
const listNames = (names: string[]) =>
  names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]}, ${names[1]} and ${names.length - 2} more`;

export function Pick({ dob, picks, onChange, onDone, navigation }: { dob: Civil | null; picks: Set<string>; onChange: (next: Set<string>) => void; onDone: () => void; navigation: Nav }) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const footerSpace = useFooterSpace();
  // Only offer people who lived longer than you have so far. "Picked" still shows everyone, so outlasted picks can be removed.
  const ahead = useMemo(() => (dob ? stillAhead(dob) : PEOPLE), [dob]);
  const themes = useMemo(() => THEMES.filter((t) => ahead.some((p) => p.themes.includes(t.key))), [ahead]);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    let out = theme === "picked" ? PEOPLE.filter((p) => picks.has(p.id)) : ahead;
    if (theme && theme !== "picked") out = out.filter((p) => p.themes.includes(theme));
    if (q) out = out.filter((p) => matches(p, q));
    return out.slice(0, 200);
  }, [q, theme, picks, ahead]);
  // Searching for someone you've already outlasted says so, instead of looking like they're missing.
  const aheadIds = useMemo(() => new Set(ahead.map((p) => p.id)), [ahead]);
  const outlasted = useMemo(
    () => (!q || theme === "picked" ? [] : PEOPLE.filter((p) => !aheadIds.has(p.id) && (!theme || p.themes.includes(theme)) && matches(p, q)).map((p) => p.name)),
    [q, theme, aheadIds],
  );
  const note = outlasted.length ? `You've already outlasted ${listNames(outlasted)}.` : null;

  const toggle = (id: string) => {
    const next = new Set(picks);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };
  const clearAll = () => {
    Alert.alert("Remove everyone?", `This removes all ${picks.size} people from your list.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove all", style: "destructive", onPress: () => { onChange(new Set()); setTheme(null); } },
    ]);
  };
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => picks.size > 0 ? <Pressable onPress={clearAll} hitSlop={12} style={styles.barButton}><Text style={styles.clear}>Clear all</Text></Pressable> : null,
      headerRight: () => <Pressable onPress={onDone} hitSlop={12} style={styles.barButton}><Text style={styles.done}>Done</Text></Pressable>,
    });
  }, [navigation, picks.size]);

  const surprise = () => {
    const next = new Set(picks);
    for (const p of randomPeople(10, ahead, picks)) next.add(p.id);
    onChange(next);
    setTheme("picked");
    setQuery("");
  };

  return (
    <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={styles.search}>
        <Icon name="search" size={22} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a name"
          placeholderTextColor={C.muted}
          style={styles.searchInput}
          clearButtonMode="while-editing"
          autoCorrect={false}
          keyboardAppearance="dark"
        />
        {/* iOS draws its own clear button (clearButtonMode); Android has none. */}
        {Platform.OS === "android" && query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={12}>
            <Icon name="close-circle" size={22} color={C.muted} />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: "center" }} style={{ flexGrow: 0, height: 60 }}>
        <Chip label="Surprise me" icon="shuffle" accent onPress={surprise} />
        <Chip label="Picked" active={theme === "picked"} onPress={() => setTheme(theme === "picked" ? null : "picked")} />
        {themes.map((t) => (
          <Chip key={t.key} label={t.label} active={theme === t.key} onPress={() => setTheme(theme === t.key ? null : t.key)} />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: footerSpace }}
        renderItem={({ item }) => <PersonRow p={item} picked={picks.has(item.id)} onPress={() => toggle(item.id)} />}
        ListEmptyComponent={<Muted style={{ textAlign: "center", marginTop: 40 }}>{note ?? "Nobody matches that."}</Muted>}
        ListFooterComponent={list.length > 0 && note ? <Muted style={{ textAlign: "center", marginTop: 12 }}>{note}</Muted> : null}
      />
      <Footer>
        <Button title={picks.size ? `Done · ${picks.size} picked` : "Done"} onPress={onDone} />
      </Footer>
    </Screen>
  );
}

function Chip({ label, icon, active, accent, onPress }: { label: string; icon?: "shuffle"; active?: boolean; accent?: boolean; onPress: () => void }) {
  const color = active ? C.bg : accent ? C.accent : C.text;
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, accent && styles.chipAccent]}>
      {icon && <Icon name={icon} size={18} color={color} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function PersonRow({ p, picked, onPress }: { p: Person; picked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
        <Muted numberOfLines={1} style={{ fontSize: 16, lineHeight: 22 }}>{formatYear(p.birth.y)}–{formatYear(p.death.y)} · {p.desc}</Muted>
      </View>
      <View style={[styles.circle, picked && styles.circlePicked]}>
        <Icon name={picked ? "checkmark" : "add"} size={24} color={picked ? C.bg : C.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // iOS 26 wraps header buttons in a glass capsule sized to the view, so the padding is what keeps the text off its edge.
  barButton: { paddingHorizontal: 10 },
  clear:{ fontSize: 17, fontWeight: "600", color: C.muted },
  done: { fontSize: 17, fontWeight: "700", color: C.accent },
  search: { marginHorizontal: 24, marginTop: 18, marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4 },
  searchInput: { flex: 1, fontSize: 19, color: C.text, paddingVertical: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: "#3A332C" },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipAccent: { borderColor: C.accent },
  chipText: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 16, paddingVertical: 12, paddingLeft: 16, paddingRight: 12, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: "700", color: C.text, lineHeight: 25 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#3A332C", alignItems: "center", justifyContent: "center" },
  circlePicked: { backgroundColor: C.accent, borderColor: C.accent },
});
