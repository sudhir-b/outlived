import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, C, Label, Muted } from "../ui";
import { Outlive, describe, wikipediaUrl } from "../lib/people";
import { ageInWords, formatCivil } from "../lib/dates";

/** Who someone was and when you pass them. A reminder can cover several people on one day, so this takes a list. */
export function PersonPage({ outlives, picks, onToggle }: { outlives: Outlive[]; picks: Set<string>; onToggle: (id: string) => void }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.content}>
      {outlives.map((o, i) => (
        <View key={o.person.id} style={i > 0 && styles.divider}>
          <Card o={o} picked={picks.has(o.person.id)} onToggle={() => onToggle(o.person.id)} />
        </View>
      ))}
    </ScrollView>
  );
}

function Card({ o, picked, onToggle }: { o: Outlive; picked: boolean; onToggle: () => void }) {
  const p = o.person;
  const what = describe(p);
  const ahead = o.daysAway >= 0;
  return (
    <View>
      <Text style={styles.name}>{p.name}</Text>
      {!!what && <Muted style={styles.what}>{what[0].toUpperCase() + what.slice(1)}</Muted>}
      <View style={styles.facts}>
        <Fact label="BORN" value={formatCivil(p.birth, p.precision)} />
        <Fact label="DIED" value={`${formatCivil(p.death, p.precision)}, aged ${ageInWords(o.lifespan, p.precision)}`} />
        <Fact label={ahead ? "YOU OUTLAST THEM" : "YOU OUTLASTED THEM"} value={when(o)} color={ahead ? C.accent : C.good} />
      </View>
      <Button title="Read on Wikipedia" onPress={() => Linking.openURL(wikipediaUrl(p))} />
      <View style={{ height: 12 }} />
      <Button title={picked ? "Remove from my list" : "Add to my list"} secondary onPress={onToggle} />
    </View>
  );
}

function Fact({ label, value, color = C.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Label>{label}</Label>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

function when(o: Outlive): string {
  // As precise as the person's own dates: a lifespan known only to the year can't put you past them on a given day.
  const date = formatCivil(o.date, o.person.precision);
  const d = o.daysAway;
  if (d === 0) return `Today, ${date}`;
  return d > 0 ? `${date}, in ${span(d)}` : `${date}, ${span(-d)} ago`;
}

function span(days: number): string {
  if (days < 60) return days === 1 ? "1 day" : `${days} days`;
  if (days < 730) return `${Math.round(days / 30.44)} months`;
  return `${Math.floor(days / 365.2425)} years`;
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 56 },
  divider: { marginTop: 36, paddingTop: 36, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.muted },
  name: { fontSize: 34, lineHeight: 38, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  what: { marginTop: 8, fontSize: 19, lineHeight: 26 },
  facts: { marginTop: 28, marginBottom: 32, gap: 18 },
  value: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
});
