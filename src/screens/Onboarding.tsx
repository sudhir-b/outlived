import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Button, H1, Icon, P, Screen, C } from "../ui";
import { Civil, fromDate, toDate } from "../lib/dates";

const OLDEST = new Date(1900, 0, 1);

export function Onboarding({ initial, withHeader, onDone }: { initial: Civil | null; withHeader?: boolean; onDone: (dob: Civil) => void }) {
  const [date, setDate] = useState<Date>(initial ? toDate(initial) : new Date(1960, 0, 1));
  const label = date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  // Android can't show the wheel inside the page, so a tap opens its own dialog. Spinner style, because paging a calendar back sixty years is a chore.
  // The spinner dialog paints its own button text, ignoring the theme's accent, so the amber is passed in here.
  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value: date,
      mode: "date",
      display: "spinner",
      maximumDate: new Date(),
      minimumDate: OLDEST,
      positiveButton: { textColor: C.accent },
      negativeButton: { textColor: C.accent },
      onValueChange: (_, d) => setDate(d),
    });

  return (
    <Screen style={withHeader ? { paddingTop: 24 } : undefined}>
      {!withHeader && <H1>When were you born?</H1>}
      {Platform.OS === "ios" ? (
        <View style={[styles.card, { marginTop: withHeader ? 0 : 32 }]}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            themeVariant="dark"
            maximumDate={new Date()}
            minimumDate={OLDEST}
            onValueChange={(_, d) => setDate(d)}
            style={{ height: 216 }}
          />
        </View>
      ) : (
        <Pressable onPress={openAndroidPicker} style={({ pressed }) => [styles.field, { marginTop: withHeader ? 0 : 32 }, pressed && { opacity: 0.7 }]}>
          <Text style={styles.fieldText}>{label}</Text>
          <Icon name="calendar-outline" size={26} color={C.accent} />
        </Pressable>
      )}
      <Button title={withHeader ? "Save" : "Continue"} onPress={() => onDone(fromDate(date))} />
      {Platform.OS === "ios" && <P style={{ marginTop: 24, textAlign: "center" }}>{label}</P>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 32, backgroundColor: C.card, borderRadius: 16, height: 216, overflow: "hidden", justifyContent: "center" },
  field: { marginBottom: 32, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldText: { fontSize: 24, fontWeight: "700", color: C.text },
});
