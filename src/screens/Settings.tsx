import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Button, C, Icon, Muted, Screen } from "../ui";
import { Civil, formatCivil } from "../lib/dates";

const PRIVACY_URL = "https://github.com/sudhir-b/outlived/blob/main/PRIVACY.md";

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
        {Platform.OS === "ios" ? (
          <View style={styles.row}>
            <Text style={styles.label}>Reminder time</Text>
            <DateTimePicker
              value={time}
              mode="time"
              themeVariant="dark"
              accentColor={C.accent}
              display="compact"
              onValueChange={(_, d) => onChangeTime(d.getHours(), d.getMinutes())}
            />
          </View>
        ) : (
          // Android has no inline time control; mounting the picker would pop its dialog straight away, so the row opens it on tap.
          <Pressable
            onPress={() => DateTimePickerAndroid.open({ value: time, mode: "time", is24Hour: uses24Hour(), onValueChange: (_, d) => onChangeTime(d.getHours(), d.getMinutes()) })}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.label}>Reminder time</Text>
            <Text style={styles.timeText}>{time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</Text>
          </Pressable>
        )}
      </View>
      <Muted style={styles.footnote}>
        {permission ? "On the day you outlast someone, you'll get a notification at this time." : "Notifications are off, so reminders can't reach you."}
      </Muted>
      {!permission && <View style={{ marginTop: 14 }}><Button title="Turn on notifications" secondary onPress={onRequestPermission} /></View>}

      {/* Google Play requires the privacy policy to be reachable from inside the app, not just the store listing. */}
      <View style={[styles.group, { marginTop: 28 }]}>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
          <Text style={styles.label}>Privacy policy</Text>
          <Icon name="open-outline" size={20} color={C.muted} />
        </Pressable>
      </View>
    </Screen>
  );
}

function uses24Hour(): boolean {
  try {
    return !new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  } catch {
    return true;
  }
}

const styles = StyleSheet.create({
  timeText: { fontSize: 19, fontWeight: "600", color: C.accent },
  group: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 18 },
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.muted, opacity: 0.35 },
  label: { fontSize: 19, color: C.text },
  value: { flexDirection: "row", alignItems: "center", gap: 6 },
  valueText: { fontSize: 19, color: C.muted },
  footnote: { marginTop: 10, marginHorizontal: 4, fontSize: 15, lineHeight: 21 },
});
