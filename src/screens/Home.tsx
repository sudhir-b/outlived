import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, C, H1, H2, Initials, Muted, P, Screen } from "../ui";
import { Civil, formatAge, formatCivil, formatYear } from "../lib/dates";
import { Outlive } from "../lib/people";

function describe(o: Outlive): string {
  const d = -o.daysAway;
  if (d === 0) return "Today! You've now lived longer.";
  if (d > 0) return `You outlasted them on ${formatCivil(o.date)}.`;
  const days = o.daysAway;
  if (days < 60) return `In ${days} day${days === 1 ? "" : "s"}, on ${formatCivil(o.date)}.`;
  const years = Math.floor(days / 365.2425);
  const months = Math.round((days - years * 365.2425) / 30.4);
  const when = years > 0 ? `${years} year${years === 1 ? "" : "s"}${months ? ` ${months} mo` : ""}` : `${months} months`;
  return `In ${when}, on ${formatCivil(o.date)}.`;
}

function Row({ o }: { o: Outlive }) {
  const passed = o.daysAway <= 0;
  const p = o.person;
  return (
    <View style={[styles.row, passed && styles.rowPassed]}>
      <Initials name={p.name} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.name}>{p.name}</Text>
        <Muted numberOfLines={1}>{p.desc}</Muted>
        <Muted style={{ marginTop: 4 }}>
          {formatYear(p.birth.y)} – {formatYear(p.death.y)} · died aged {formatAge(o.lifespan)}{p.precision !== "day" ? " (approx.)" : ""}
        </Muted>
        <Text style={[styles.when, passed && { color: C.good }]}>{describe(o)}</Text>
      </View>
    </View>
  );
}

export function Home({ dob, outlives, onPick, onSettings }: { dob: Civil; outlives: Outlive[]; onPick: () => void; onSettings: () => void }) {
  const sorted = useMemo(() => [...outlives].sort((a, b) => a.daysAway - b.daysAway), [outlives]);
  const next = sorted.find((o) => o.daysAway > 0);
  const passed = sorted.filter((o) => o.daysAway <= 0).length;

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <H1>Outlasted</H1>
          <Muted>Born {formatCivil(dob)} · {passed} of {outlives.length} outlasted</Muted>
        </View>
        <Pressable onPress={onSettings} hitSlop={12}><Text style={{ fontSize: 28 }}>⚙️</Text></Pressable>
      </View>

      {next && (
        <View style={styles.next}>
          <Muted style={{ color: C.accent, fontWeight: "700" }}>NEXT UP</Muted>
          <H2 style={{ marginTop: 4 }}>{next.person.name}</H2>
          <P>{describe(next)}</P>
        </View>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(o) => o.person.id}
        renderItem={({ item }) => <Row o={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <P style={{ textAlign: "center" }}>No one picked yet.</P>
            <Muted style={{ textAlign: "center", marginTop: 8 }}>Choose some famous people and we'll tell you the day you outlive each of them.</Muted>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button title={outlives.length ? "Add or remove people" : "Choose people"} onPress={onPick} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  next: { margin: 20, marginBottom: 12, padding: 18, backgroundColor: C.accentSoft, borderRadius: 18 },
  row: { flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  rowPassed: { backgroundColor: C.goodSoft, borderColor: C.goodSoft },
  name: { fontSize: 20, fontWeight: "700", color: C.text },
  when: { fontSize: 17, color: C.accent, marginTop: 6, fontWeight: "600" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, backgroundColor: C.bg },
});
