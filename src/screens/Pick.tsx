import React, { useLayoutEffect, useMemo, useState } from "react";
import { Alert, FlatList, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Button, C, Footer, Icon, Muted, Screen, useFooterSpace } from "../ui";
import { PEOPLE, Person, THEMES, computeOutlive, randomPeople, stillAhead } from "../lib/people";
import { Civil, formatCivil, formatYear } from "../lib/dates";

type Nav = { setOptions: (o: object) => void };

const matches = (p: Person, q: string) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
// Adding this many at once asks first, and says how many reminders they bring.
const CONFIRM_OVER = 20;

export function Pick({ dob, picks, onChange, onDone, onInfo, navigation }: {
  dob: Civil | null; picks: Set<string>; onChange: (next: Set<string>) => void; onDone: () => void; onInfo: (id: string) => void; navigation: Nav;
}) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  // Browsing offers the people still ahead of you; this adds back the ones you've outlasted. Name search always covers everyone.
  const [withOutlasted, setWithOutlasted] = useState(false);
  const footerSpace = useFooterSpace();
  const ahead = useMemo(() => (dob ? stillAhead(dob) : PEOPLE), [dob]);
  const aheadIds = useMemo(() => new Set(ahead.map((p) => p.id)), [ahead]);
  const browsing = withOutlasted ? PEOPLE : ahead;
  const themes = useMemo(() => THEMES.filter((t) => browsing.some((p) => p.themes.includes(t.key))), [browsing]);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    if (theme === "picked") return PEOPLE.filter((p) => picks.has(p.id) && (!q || matches(p, q)));
    let out = q ? PEOPLE : browsing;
    if (theme) out = out.filter((p) => p.themes.includes(theme));
    if (q) out = out.filter((p) => matches(p, q));
    return out;
  }, [q, theme, picks, browsing]);
  const unpicked = useMemo(() => (theme === "picked" ? [] : list.filter((p) => !picks.has(p.id))), [list, picks, theme]);

  // Leaving this sheet doesn't close Android's keyboard by itself; it stayed up over Home and covered its button.
  const done = () => { Keyboard.dismiss(); onDone(); };
  const info = (id: string) => { Keyboard.dismiss(); onInfo(id); };

  const toggle = (id: string) => {
    const next = new Set(picks);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };
  const clearAll = () => {
    Alert.alert("Remove everyone?", `This removes all ${picks.size.toLocaleString()} people from your list.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove all", style: "destructive", onPress: () => { onChange(new Set()); setTheme(null); } },
    ]);
  };
  const addAll = () => {
    const add = () => {
      const next = new Set(picks);
      for (const p of unpicked) next.add(p.id);
      onChange(next);
    };
    if (unpicked.length <= CONFIRM_OVER) return add();
    const already = unpicked.filter((p) => !aheadIds.has(p.id)).length;
    const soon = dob ? unpicked.filter((p) => { const d = computeOutlive(p, dob).daysAway; return d >= 0 && d < 365; }).length : 0;
    Alert.alert(`Add ${unpicked.length.toLocaleString()} people?`, addAllMessage(unpicked.length, already, soon), [
      { text: "Cancel", style: "cancel" },
      { text: "Add them", onPress: add },
    ]);
  };
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => picks.size > 0 ? <Pressable onPress={clearAll} hitSlop={12} style={styles.barButton}><Text style={styles.clear}>Clear all</Text></Pressable> : null,
      headerRight: () => <Pressable onPress={done} hitSlop={12} style={styles.barButton}><Text style={styles.done}>Done</Text></Pressable>,
    });
  }, [navigation, picks.size]);

  const surprise = () => {
    const next = new Set(picks);
    for (const p of randomPeople(10, ahead, picks)) next.add(p.id);
    onChange(next);
    setTheme("picked");
    setQuery("");
  };

  const header = (
    <View style={{ gap: 10, marginBottom: 12 }}>
      {!q && theme !== "picked" && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include people I've outlasted</Text>
          <Switch
            value={withOutlasted}
            onValueChange={setWithOutlasted}
            trackColor={{ false: C.line, true: C.good }}
            thumbColor={Platform.OS === "android" ? C.text : undefined}
            ios_backgroundColor={C.line}
          />
        </View>
      )}
      {list.length > 1 && unpicked.length > 0 && (
        <Pressable onPress={addAll} style={({ pressed }) => [styles.addAll, pressed && { opacity: 0.7 }]}>
          <Icon name="add-circle-outline" size={24} color={C.accent} />
          <Text style={styles.addAllText}>{addAllLabel(unpicked.length, !theme && !q, !q && !withOutlasted)}</Text>
        </Pressable>
      )}
    </View>
  );

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
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <PersonRow
            p={item}
            picked={picks.has(item.id)}
            outlastedOn={dob && !aheadIds.has(item.id) ? computeOutlive(item, dob).date : null}
            onPress={() => toggle(item.id)}
            onInfo={() => info(item.id)}
          />
        )}
        ListEmptyComponent={<Muted style={{ textAlign: "center", marginTop: 40 }}>Nobody matches that.</Muted>}
      />
      <Footer>
        <Button title={picks.size ? `Done · ${picks.size.toLocaleString()} picked` : "Done"} onPress={done} />
      </Footer>
    </Screen>
  );
}

/** Without the switch, browsing only lists people you haven't outlasted yet, so the button says that's who it adds. */
function addAllLabel(n: number, everyone: boolean, notYetOnly: boolean): string {
  const count = n.toLocaleString();
  if (everyone) return notYetOnly ? `Add everyone you haven't outlasted (${count})` : `Add everyone (${count})`;
  return notYetOnly ? `Add all ${count} you haven't outlasted` : `Add all ${count}`;
}

function addAllMessage(total: number, already: number, soon: number): string {
  if (already === total) return "You've already outlasted all of them, so they go straight onto your scoreboard.";
  const you = soon === 0 ? "you won't outlast any" : `you'll outlast ${soon === 1 ? "one" : soon.toLocaleString()}`;
  const reminders = soon === 0 ? "" : ", with a reminder on each day";
  return already === 0
    ? `${you[0].toUpperCase()}${you.slice(1)} of them in the next year${reminders}.`
    : `You've already outlasted ${already.toLocaleString()} of them. Of the rest, ${you} in the next year${reminders}.`;
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

function PersonRow({ p, picked, outlastedOn, onPress, onInfo }: { p: Person; picked: boolean; outlastedOn: Civil | null; onPress: () => void; onInfo: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1, marginRight: 4 }}>
        <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
        <Muted numberOfLines={1} style={{ fontSize: 16, lineHeight: 22 }}>{formatYear(p.birth.y)}–{formatYear(p.death.y)} · {p.desc}</Muted>
        {outlastedOn && <Text style={styles.outlasted}>Outlasted {formatCivil(outlastedOn, p.precision)}</Text>}
      </View>
      <Pressable onPress={onInfo} hitSlop={6} style={styles.info} accessibilityRole="button" accessibilityLabel={`About ${p.name}`}>
        <Icon name="information-circle-outline" size={28} color={C.muted} />
      </Pressable>
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
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: C.outline },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipAccent: { borderColor: C.accent },
  chipText: { fontSize: 16, fontWeight: "700" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
  switchLabel: { flex: 1, fontSize: 17, color: C.text },
  addAll: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: C.outline },
  addAllText: { flexShrink: 1, fontSize: 17, fontWeight: "700", color: C.accent },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 16, paddingVertical: 12, paddingLeft: 16, paddingRight: 12, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: "700", color: C.text, lineHeight: 25 },
  outlasted: { fontSize: 15, lineHeight: 21, fontWeight: "700", color: C.good, marginTop: 2 },
  info: { padding: 6, marginRight: 4 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.outline, alignItems: "center", justifyContent: "center" },
  circlePicked: { backgroundColor: C.accent, borderColor: C.accent },
});
