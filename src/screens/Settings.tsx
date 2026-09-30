import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, C, Icon, Muted, Screen } from "../ui";
import { Civil, formatCivil } from "../lib/dates";

export function Settings({
  dob, hour, minute, permission, onChangeDob, onChangeTime, onRequestPermission,
}: {
  dob: Civil; hour: number; minute: number; permission: boolean;
  onChangeDob: () => void; onChangeTime: (h: number, m: number) => void; onRequestPermission: () => void;
}) {
  const time = new Date(2000, 0, 1, hour, minute);
  return (
    <Screen style={{ paddingTop: 24 }}>
      <View style={styles.group}>
        <Pressable onPress={onChangeDob} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
          <Text style={styles.label}>Date of birth</Text>
          <View style={styles.value}>
            <Text style={styles.valueText}>{formatCivil(dob)}</Text>
            <Icon name="chevron-forward" size={20} color={C.muted} />
          </View>
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Reminder time</Text>
          <DateTimePicker
            value={time}
            mode="time"
            themeVariant="dark"
            accentColor={C.accent}
            display={Platform.OS === "ios" ? "compact" : "default"}
            onValueChange={(_, d) => onChangeTime(d.getHours(), d.getMinutes())}
          />
        </View>
      </View>
      <Muted style={styles.footnote}>
        {permission ? "On the day you outlast someone, you'll get a notification at this time." : "Notifications are off, so reminders can't reach you."}
      </Muted>
      {!permission && <View style={{ marginTop: 14 }}><Button title="Turn on notifications" secondary onPress={onRequestPermission} /></View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 18 },
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.muted, opacity: 0.35 },
  label: { fontSize: 19, color: C.text },
  value: { flexDirection: "row", alignItems: "center", gap: 6 },
  valueText: { fontSize: 19, color: C.muted },
  footnote: { marginTop: 10, marginHorizontal: 4, fontSize: 15, lineHeight: 21 },
});
