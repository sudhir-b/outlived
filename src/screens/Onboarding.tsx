import React, { useState } from "react";
import { View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, H1, Muted, P, Screen, C } from "../ui";
import { Civil, fromDate, toDate } from "../lib/dates";

export function Onboarding({ initial, withHeader, onDone }: { initial: Civil | null; withHeader?: boolean; onDone: (dob: Civil) => void }) {
  const [date, setDate] = useState<Date>(initial ? toDate(initial) : new Date(1960, 0, 1));
  return (
    <Screen style={withHeader ? { paddingTop: 24 } : undefined}>
      {!withHeader && <H1>When were you born?</H1>}
      <Muted style={{ marginTop: withHeader ? 0 : 8 }}>Everything else is worked out from this. It stays on your phone.</Muted>
      <View style={{ marginVertical: 32, backgroundColor: C.card, borderRadius: 16, height: 216, overflow: "hidden", justifyContent: "center" }}>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          themeVariant="dark"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          onValueChange={(_, d) => setDate(d)}
          style={{ height: 216 }}
        />
      </View>
      <Button title={withHeader ? "Save" : "Continue"} onPress={() => onDone(fromDate(date))} />
      <P style={{ marginTop: 24, textAlign: "center" }}>{date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</P>
    </Screen>
  );
}
