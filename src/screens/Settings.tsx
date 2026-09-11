import React, { useState } from "react";
import { Alert, Platform, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, C, H1, H2, Muted, P, Screen } from "../ui";
import { Civil, formatCivil } from "../lib/dates";

export function Settings({
  dob, hour, minute, scheduled, permission, onChangeDob, onChangeTime, onExport, onRequestPermission, onBack,
}: {
  dob: Civil; hour: number; minute: number; scheduled: number; permission: boolean;
  onChangeDob: () => void; onChangeTime: (h: number, m: number) => void; onExport: () => void; onRequestPermission: () => void; onBack: () => void;
}) {
  const time = new Date(2000, 0, 1, hour, minute);
  return (
    <Screen>
      <H1>Settings</H1>

      <H2 style={{ marginTop: 28 }}>Date of birth</H2>
      <P>{formatCivil(dob)}</P>
      <View style={{ marginTop: 10 }}><Button title="Change" secondary onPress={onChangeDob} /></View>

      <H2 style={{ marginTop: 28 }}>Reminder time</H2>
      <Muted>On the day you outlive someone, you'll get a notification at this time.</Muted>
      <View style={{ backgroundColor: C.card, borderRadius: 14, marginTop: 10, alignItems: Platform.OS === "ios" ? "flex-start" : "stretch" }}>
        <DateTimePicker value={time} mode="time" themeVariant="dark" display={Platform.OS === "ios" ? "compact" : "default"} onValueChange={(_, d) => onChangeTime(d.getHours(), d.getMinutes())} />
      </View>
      <Muted style={{ marginTop: 10 }}>
        {permission ? `${scheduled} reminder${scheduled === 1 ? "" : "s"} scheduled (up to 64 at a time).` : "Notifications are off."}
      </Muted>
      {!permission && <View style={{ marginTop: 10 }}><Button title="Turn on notifications" secondary onPress={onRequestPermission} /></View>}

      <H2 style={{ marginTop: 28 }}>Calendar</H2>
      <Muted>Add every milestone to your calendar as an all-day event.</Muted>
      <View style={{ marginTop: 10 }}><Button title="Export to Calendar" secondary onPress={onExport} /></View>

      <View style={{ marginTop: 40 }}><Button title="Back" onPress={onBack} /></View>
      <Muted style={{ marginTop: 24, fontSize: 14, lineHeight: 20, textAlign: "center" }}>Lifespan data from Wikidata and the Pantheon project at MIT (CC BY 4.0).</Muted>
    </Screen>
  );
}
