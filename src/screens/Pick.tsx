import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, C, H1, Icon, Muted, Screen, footer } from "../ui";
import { PEOPLE, Person, THEMES, randomPeople } from "../lib/people";
import { formatYear } from "../lib/dates";

export function Pick({ picks, onChange, onDone }: { picks: Set<string>; onChange: (next: Set<string>) => void; onDone: () => void }) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = PEOPLE;
    if (theme === "picked") out = out.filter((p) => picks.has(p.id));
    else if (theme) out = out.filter((p) => p.themes.includes(theme));
    if (q) out = out.filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    return out.slice(0, 200);
  }, [query, theme, picks]);

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
  const surprise = () => {
    const next = new Set(picks);
    for (const p of randomPeople(10, picks)) next.add(p.id);
    onChange(next);
    setTheme("picked");
    setQuery("");
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={styles.header}>
        <H1>Choose people</H1>
        {picks.size > 0 && <Pressable onPress={clearAll} hitSlop={12}><Text style={styles.clear}>Clear all</Text></Pressable>}
      </View>
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
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: "center" }} style={{ flexGrow: 0, height: 60 }}>
        <Chip label="Surprise me" icon="shuffle" accent onPress={surprise} />
        <Chip label="Picked" active={theme === "picked"} onPress={() => setTheme(theme === "picked" ? null : "picked")} />
        {THEMES.map((t) => (
          <Chip key={t.key} label={t.label} active={theme === t.key} onPress={() => setTheme(theme === t.key ? null : t.key)} />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 130 }}
        renderItem={({ item }) => <PersonRow p={item} picked={picks.has(item.id)} onPress={() => toggle(item.id)} />}
        ListEmptyComponent={<Muted style={{ textAlign: "center", marginTop: 40 }}>Nobody matches that.</Muted>}
      />
      <View style={footer}>
        <Button title={picks.size ? `Done · ${picks.size} picked` : "Done"} onPress={onDone} />
      </View>
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
  header: { paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clear: { fontSize: 16, fontWeight: "700", color: C.muted },
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
