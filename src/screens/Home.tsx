import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, C, Footer, Icon, Label, Muted, P, Screen, useFooterSpace } from "../ui";
import { Civil, daysBetween, formatCivil, formatLifespan, today } from "../lib/dates";
import { Outlive } from "../lib/people";

function Hero({ next, sameDay, total, passed }: { next: Outlive | undefined; sameDay: number; total: number; passed: number }) {
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
        <Text style={styles.big}>{passed.toLocaleString()}</Text>
        <P style={{ color: C.muted }}>of {total.toLocaleString()} outlasted. You've beaten everyone on your list.</P>
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
      {sameDay > 0 && <P style={{ color: C.muted }}>and {sameDay === 1 ? "1 other" : `${sameDay.toLocaleString()} others`} the same day</P>}
      <Muted style={{ marginTop: 6 }}>Died at {formatLifespan(next.lifespan, next.person.precision)} · {formatCivil(next.date)}</Muted>
    </View>
  );
}

function Bar({ o, next, maxDays, youPct, onPress }: { o: Outlive; next: boolean; maxDays: number; youPct: number; onPress: () => void }) {
  const passed = o.daysAway <= 0 && !next;
  const color = next ? C.accent : passed ? C.good : C.future;
  const right = formatLifespan(o.lifespan, o.person.precision);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ paddingBottom: 14 }, pressed && { opacity: 0.6 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <Text style={styles.rowName} numberOfLines={1}>{o.person.name}</Text>
        <Text style={[styles.rowRight, { color: next ? C.accent : passed ? C.good : C.muted }]}>{right}</Text>
      </View>
      <View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, (o.lifespan / maxDays) * 100)}%`, backgroundColor: color }]} />
        </View>
        {/* Your age marked on each bar. A line down the whole list ran through the names and ages. */}
        <View pointerEvents="none" style={[styles.tick, { left: `${youPct}%` }]} />
      </View>
    </Pressable>
  );
}

function YouPill({ pct }: { pct: number }) {
  return (
    <View pointerEvents="none" style={[styles.youPillWrap, { left: `${pct}%` }]}>
      <View style={styles.youPill}><Text style={styles.youText}>YOU</Text></View>
    </View>
  );
}

// Up to this many people you've already outlasted are listed in full; past that they fold into one line,
// so someone tracking a whole category doesn't scroll through hundreds of them to reach what's next.
const PASSED_INLINE = 8;

export function Home({ dob, outlives, onPick, onSettings, onPerson }: { dob: Civil; outlives: Outlive[]; onPick: () => void; onSettings: () => void; onPerson: (id: string) => void }) {
  const sorted = useMemo(() => [...outlives].sort((a, b) => a.daysAway - b.daysAway), [outlives]);
  const firstAhead = sorted.findIndex((o) => o.daysAway >= 0);
  const next = firstAhead >= 0 ? sorted[firstAhead] : undefined;
  const passed = firstAhead >= 0 ? firstAhead : sorted.length;
  const sameDay = next ? sorted.filter((o) => o.daysAway === next.daysAway).length - 1 : 0;
  const ageDays = daysBetween(dob, today());
  const maxDays = sorted.reduce((m, o) => Math.max(m, o.lifespan), ageDays) * 1.06;
  const youPct = (ageDays / maxDays) * 100;
  const footerSpace = useFooterSpace();
  const [showPassed, setShowPassed] = useState(false);
  const folded = passed > PASSED_INLINE;
  const rows = folded && !showPassed ? sorted.slice(passed) : sorted;

  const header = (
    <>
      <Hero next={next} sameDay={sameDay} total={sorted.length} passed={passed} />
      {sorted.length > 0 && (
        <View style={{ marginTop: 34 }}>
          <View style={styles.sectionHead}>
            <Label>SCOREBOARD</Label>
            <Text style={styles.score}><Text style={{ color: C.good }}>{passed.toLocaleString()}</Text><Text style={{ color: C.muted }}> of {sorted.length.toLocaleString()}</Text></Text>
          </View>
          {folded && (
            <Pressable onPress={() => setShowPassed(!showPassed)} hitSlop={8} style={styles.fold}>
              <Text style={styles.foldText}>{passed.toLocaleString()} already outlasted</Text>
              <Text style={styles.foldAction}>{showPassed ? "Hide" : "Show"}</Text>
            </Pressable>
          )}
          <View style={{ height: 22 }}><YouPill pct={youPct} /></View>
        </View>
      )}
    </>
  );

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>OUTLASTED</Text>
        <Pressable onPress={onSettings} hitSlop={12}><Icon name="options-outline" size={26} /></Pressable>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(o) => o.person.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <Bar o={item} next={item === next} maxDays={maxDays} youPct={youPct} onPress={() => onPerson(item.person.id)} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: footerSpace }}
        showsVerticalScrollIndicator={false}
      />
      <Footer>
        <Button title={sorted.length ? "Add or remove people" : "Choose people"} onPress={onPick} />
      </Footer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  wordmark: { fontSize: 15, fontWeight: "800", color: C.accent, letterSpacing: 2 },
  hero: {},
  big: { fontSize: 128, lineHeight: 128, fontWeight: "800", color: C.text, letterSpacing: -5, marginTop: 6, fontVariant: ["tabular-nums"] },
  name: { fontSize: 34, lineHeight: 38, fontWeight: "800", color: C.text, letterSpacing: -0.5, marginTop: 2 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 },
  fold: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 18 },
  foldText: { fontSize: 17, fontWeight: "700", color: C.good },
  foldAction: { fontSize: 17, fontWeight: "700", color: C.accent },
  score: { fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] },
  rowName: { fontSize: 17, fontWeight: "700", color: C.text, flexShrink: 1, marginRight: 12 },
  rowRight: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  track: { height: 12, borderRadius: 6, backgroundColor: C.track, overflow: "hidden" },
  fill: { height: 12, borderRadius: 6 },
  youPillWrap: { position: "absolute", top: 0, width: 60, marginLeft: -30, alignItems: "center" },
  youPill: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  youText: { fontSize: 11, fontWeight: "800", color: C.bg, letterSpacing: 1 },
  // The outline in the background colour keeps the tick visible where it crosses the white bar of the next person.
  tick: { position: "absolute", top: -5, bottom: -5, width: 5, marginLeft: -2.5, borderRadius: 2.5, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.bg },
});
