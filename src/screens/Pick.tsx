import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, C, H1, Initials, Muted, Screen } from "../ui";
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
  const surprise = () => {
    const next = new Set(picks);
    for (const p of randomPeople(10, picks)) next.add(p.id);
    onChange(next);
    setTheme("picked");
    setQuery("");
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H1>Choose people</H1>
        <Pressable onPress={onDone} hitSlop={12}><Text style={styles.done}>Done ({picks.size})</Text></Pressable>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or description"
        placeholderTextColor={C.muted}
        style={styles.search}
        clearButtonMode="while-editing"
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }} style={{ flexGrow: 0, height: 56, marginBottom: 6 }}>
        <Chip label="🎲 Surprise me" active={false} onPress={surprise} />
        <Chip label={`✅ Picked`} active={theme === "picked"} onPress={() => setTheme(theme === "picked" ? null : "picked")} />
        {THEMES.map((t) => (
          <Chip key={t.key} label={`${t.emoji} ${t.label}`} active={theme === t.key} onPress={() => setTheme(theme === t.key ? null : t.key)} />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) => <PersonRow p={item} picked={picks.has(item.id)} onPress={() => toggle(item.id)} />}
        ListEmptyComponent={<Muted style={{ textAlign: "center", marginTop: 40 }}>Nobody matches that.</Muted>}
      />
      <View style={styles.footer}>
        <Button title={picks.size ? `Done · ${picks.size} picked` : "Done"} onPress={onDone} />
      </View>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

function PersonRow({ p, picked, onPress }: { p: Person; picked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, picked && styles.rowPicked, pressed && { opacity: 0.7 }]}>
      <Initials name={p.name} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{p.name}</Text>
        <Muted numberOfLines={1}>{p.desc}</Muted>
        <Muted>{formatYear(p.birth.y)} – {formatYear(p.death.y)}</Muted>
      </View>
      <Text style={{ fontSize: 26, color: picked ? C.accent : C.line }}>{picked ? "✓" : "+"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  done: { fontSize: 19, fontWeight: "700", color: C.accent },
  search: { marginHorizontal: 20, marginVertical: 14, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 19, borderWidth: 1, borderColor: C.line, color: C.text },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 16, fontWeight: "600", color: C.text },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  rowPicked: { borderColor: C.accent, backgroundColor: C.accentSoft },
  name: { fontSize: 19, fontWeight: "700", color: C.text },
  footer: { position: "absolute", left: 20, right: 20, bottom: 36 },
});
