import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Button, H1, Icon, P, Screen, C } from "../ui";
import { Civil, formatCivilLong, fromUTCDate, toUTCDate, today } from "../lib/dates";

const OLDEST = toUTCDate({ y: 1900, m: 1, d: 1 });

export function Onboarding({ initial, withHeader, onDone }: { initial: Civil | null; withHeader?: boolean; onDone: (dob: Civil) => void }) {
  const [dob, setDob] = useState<Civil>(initial ?? { y: 1960, m: 1, d: 1 });
  const label = formatCivilLong(dob);
  const latest = toUTCDate(today());
  // Android can't show the wheel inside the page, so a tap opens its own dialog. Spinner style, because paging a calendar back sixty years is a chore.
  // The spinner dialog paints its own button text, ignoring the theme's accent, so the accent is passed in here.
  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value: toUTCDate(dob),
      mode: "date",
      display: "spinner",
      timeZoneName: "UTC",
      maximumDate: latest,
      minimumDate: OLDEST,
      positiveButton: { textColor: C.accent },
      negativeButton: { textColor: C.accent },
      onValueChange: (_, d) => setDob(fromUTCDate(d)),
    });

  return (
    <Screen style={withHeader ? { paddingTop: 24 } : undefined}>
      {!withHeader && <H1>When were you born?</H1>}
      {Platform.OS === "ios" ? (
        <View style={[styles.card, { marginTop: withHeader ? 0 : 32 }]}>
          <DateTimePicker
            value={toUTCDate(dob)}
            mode="date"
            display="spinner"
            themeVariant="dark"
            timeZoneName="UTC"
            maximumDate={latest}
            minimumDate={OLDEST}
            onValueChange={(_, d) => setDob(fromUTCDate(d))}
            style={{ height: 216 }}
          />
        </View>
      ) : (
        <Pressable onPress={openAndroidPicker} style={({ pressed }) => [styles.field, { marginTop: withHeader ? 0 : 32 }, pressed && { opacity: 0.7 }]}>
          <Text style={styles.fieldText}>{label}</Text>
          <Icon name="calendar-outline" size={26} color={C.accent} />
        </Pressable>
      )}
      <Button title={withHeader ? "Save" : "Continue"} onPress={() => onDone(dob)} />
      {Platform.OS === "ios" && <P style={{ marginTop: 24, textAlign: "center" }}>{label}</P>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 32, backgroundColor: C.card, borderRadius: 16, height: 216, overflow: "hidden", justifyContent: "center" },
  field: { marginBottom: 32, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldText: { fontSize: 24, fontWeight: "700", color: C.text },
});
