import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, C, Icon, Label, Muted, P, Screen, footer } from "../ui";
import { Civil, daysBetween, formatAge, formatCivil, today, yearsMonths } from "../lib/dates";
import { Outlive } from "../lib/people";

function Hero({ next, total, passed }: { next: Outlive | undefined; total: number; passed: number }) {
  if (total === 0) {
    return (
      <View style={styles.hero}>
        <Label>NEXT UP</Label>
        <Text style={styles.name}>Nobody yet</Text>
        <Muted style={{ marginTop: 6 }}>Choose some famous people and this becomes a countdown to the day you outlast each of them.</Muted>
      </View>
    );
  }
  if (!next) {
    return (
      <View style={styles.hero}>
        <Label>SCOREBOARD</Label>
        <Text style={styles.big}>{passed}</Text>
        <P style={{ color: C.muted }}>of {total} outlasted. You've beaten everyone on your list.</P>
      </View>
    );
  }
  const d = next.daysAway;
  const text = d === 0 ? "Today" : d.toLocaleString();
  // Four digits plus a comma no longer fit at 128pt on a 390pt-wide phone, so step down by length.
  const size = text.length <= 3 ? 128 : text.length <= 6 ? 96 : 72;
  return (
    <View style={styles.hero}>
      <Label>NEXT UP</Label>
      <Text style={[styles.big, { fontSize: size, lineHeight: size }]}>{text}</Text>
      <P style={{ color: C.muted, marginTop: 6 }}>{d === 0 ? "you outlast" : d === 1 ? "day until you outlast" : "days until you outlast"}</P>
      <Text style={styles.name}>{next.person.name}</Text>
      <Muted style={{ marginTop: 6 }}>
        Died at {formatAge(next.lifespan)}{next.person.precision !== "day" ? " (approx.)" : ""} · you pass them on {formatCivil(next.date)}
      </Muted>
    </View>
  );
}

function Bar({ o, next, maxDays }: { o: Outlive; next: boolean; maxDays: number }) {
  const passed = o.daysAway <= 0 && !next;
  const color = next ? C.accent : passed ? C.good : C.future;
  const right = next ? (o.daysAway === 0 ? "Today" : `${o.daysAway.toLocaleString()} day${o.daysAway === 1 ? "" : "s"}`) : formatAge(o.lifespan);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <Text style={styles.rowName} numberOfLines={1}>{o.person.name}</Text>
        <Text style={[styles.rowRight, { color: next ? C.accent : passed ? C.good : C.muted }]}>{right}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, (o.lifespan / maxDays) * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function YouLine({ pct, rows }: { pct: number; rows: number }) {
  // A dashed vertical line drawn from short segments, since single-edge dashed borders are unreliable on iOS.
  const dashes = Array.from({ length: rows * 8 });
  return (
    <View pointerEvents="none" style={[styles.youLine, { left: `${pct}%` }]}>
      <View style={styles.youPill}><Text style={styles.youText}>YOU</Text></View>
      <View style={{ flex: 1, overflow: "hidden", alignItems: "center" }}>
        {dashes.map((_, i) => <View key={i} style={styles.dash} />)}
      </View>
    </View>
  );
}

export function Home({ dob, outlives, onPick, onSettings }: { dob: Civil; outlives: Outlive[]; onPick: () => void; onSettings: () => void }) {
  const sorted = useMemo(() => [...outlives].sort((a, b) => a.daysAway - b.daysAway), [outlives]);
  const next = sorted.find((o) => o.daysAway >= 0);
  const passed = sorted.filter((o) => o.daysAway < 0).length;
  const ageDays = daysBetween(dob, today());
  const age = yearsMonths(dob, today());
  const maxDays = Math.max(ageDays, ...sorted.map((o) => o.lifespan)) * 1.06;

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>OUTLASTED</Text>
        <Pressable onPress={onSettings} hitSlop={12}><Icon name="options-outline" size={26} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Hero next={next} total={sorted.length} passed={passed} />
        {sorted.length > 0 && (
          <View style={{ marginTop: 34 }}>
            <View style={styles.sectionHead}>
              <Label>SCOREBOARD</Label>
              <Text style={styles.score}><Text style={{ color: C.good }}>{passed}</Text><Text style={{ color: C.muted }}> of {sorted.length}</Text></Text>
            </View>
            <Muted style={{ marginBottom: 26 }}>You're {age.years}y {age.months}m. Bars are how long each person lived.</Muted>
            <View style={{ position: "relative", paddingTop: 22 }}>
              <YouLine pct={(ageDays / maxDays) * 100} rows={sorted.length} />
              {sorted.map((o) => <Bar key={o.person.id} o={o} next={o === next} maxDays={maxDays} />)}
            </View>
          </View>
        )}
      </ScrollView>
      <View style={footer}>
        <Button title={sorted.length ? "Add or remove people" : "Choose people"} onPress={onPick} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  wordmark: { fontSize: 15, fontWeight: "800", color: C.accent, letterSpacing: 2 },
  hero: {},
  big: { fontSize: 128, lineHeight: 128, fontWeight: "800", color: C.text, letterSpacing: -5, marginTop: 6, fontVariant: ["tabular-nums"] },
  name: { fontSize: 34, lineHeight: 38, fontWeight: "800", color: C.text, letterSpacing: -0.5, marginTop: 2 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  score: { fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] },
  rowName: { fontSize: 17, fontWeight: "700", color: C.text, flexShrink: 1, marginRight: 12 },
  rowRight: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  track: { height: 12, borderRadius: 6, backgroundColor: C.track, overflow: "hidden" },
  fill: { height: 12, borderRadius: 6 },
  youLine: { position: "absolute", top: 0, bottom: 0, width: 60, marginLeft: -30, alignItems: "center", zIndex: 1 },
  youPill: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 4 },
  youText: { fontSize: 11, fontWeight: "800", color: C.bg, letterSpacing: 1 },
  dash: { width: 2, height: 6, backgroundColor: C.accent, marginBottom: 5, borderRadius: 1 },
});
