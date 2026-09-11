import React, { useState } from "react";
import { View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, H1, Muted, P, Screen, C } from "../ui";
import { Civil, fromDate, toDate } from "../lib/dates";

export function Onboarding({ initial, onDone, onCancel }: { initial: Civil | null; onDone: (dob: Civil) => void; onCancel?: () => void }) {
  const [date, setDate] = useState<Date>(initial ? toDate(initial) : new Date(1960, 0, 1));
  return (
    <Screen>
      <H1>When were you born?</H1>
      <Muted style={{ marginTop: 8 }}>Everything else is worked out from this. It stays on your phone.</Muted>
      <View style={{ marginVertical: 32, backgroundColor: C.card, borderRadius: 16, height: 216, overflow: "hidden", justifyContent: "center" }}>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          onValueChange={(_, d) => setDate(d)}
          style={{ height: 216 }}
        />
      </View>
      <Button title="Continue" onPress={() => onDone(fromDate(date))} />
      {onCancel && <View style={{ marginTop: 12 }}><Button title="Cancel" secondary onPress={onCancel} /></View>}
      <P style={{ marginTop: 24, textAlign: "center" }}>{date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</P>
    </Screen>
  );
}
