import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Onboarding } from "./src/screens/Onboarding";
import { Home } from "./src/screens/Home";
import { Pick } from "./src/screens/Pick";
import { Settings } from "./src/screens/Settings";
import { loadSettings, Settings as StoredSettings } from "./src/lib/storage";
import { AppProvider, useApp } from "./src/store";
import { C } from "./src/ui";

export type RootParams = {
  Onboarding: undefined;
  Home: undefined;
  Pick: undefined;
  Settings: undefined;
  EditDob: undefined;
};
const Stack = createNativeStackNavigator<RootParams>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, text: C.text, primary: C.accent, border: C.line },
};

function OnboardingScreen({ navigation }: NativeStackScreenProps<RootParams, "Onboarding">) {
  const { setDob } = useApp();
  return (
    <Onboarding
      initial={null}
      onDone={(dob) => {
        setDob(dob);
        navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Pick" }] });
      }}
    />
  );
}

function EditDobScreen({ navigation }: NativeStackScreenProps<RootParams, "EditDob">) {
  const { settings, setDob } = useApp();
  return <Onboarding initial={settings.dob} withHeader onDone={(dob) => { setDob(dob); navigation.goBack(); }} />;
}

function HomeScreen({ navigation }: NativeStackScreenProps<RootParams, "Home">) {
  const { settings, outlives } = useApp();
  if (!settings.dob) return null;
  return <Home dob={settings.dob} outlives={outlives} onPick={() => navigation.navigate("Pick")} onSettings={() => navigation.navigate("Settings")} />;
}

function PickScreen({ navigation }: NativeStackScreenProps<RootParams, "Pick">) {
  const { settings, setPicks } = useApp();
  return <Pick picks={new Set(settings.picks)} onChange={setPicks} onDone={() => navigation.goBack()} navigation={navigation} />;
}

function SettingsScreen({ navigation }: NativeStackScreenProps<RootParams, "Settings">) {
  const { settings, scheduled, permission, setTime, requestPermission } = useApp();
  if (!settings.dob) return null;
  return (
    <Settings
      dob={settings.dob}
      hour={settings.notifyHour}
      minute={settings.notifyMinute}
      scheduled={scheduled}
      permission={permission}
      onChangeDob={() => navigation.navigate("EditDob")}
      onChangeTime={setTime}
      onRequestPermission={async () => {
        const ok = await requestPermission();
        if (!ok) Alert.alert("Notifications are off", "Turn them on for Outlasted in the iPhone Settings app.");
      }}
    />
  );
}

export default function App() {
  const [initial, setInitial] = useState<StoredSettings | null>(null);
  useEffect(() => { loadSettings().then(setInitial); }, []);
  if (!initial) return null;

  return (
    <AppProvider initial={initial}>
      <StatusBar style="light" />
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName={initial.dob ? "Home" : "Onboarding"}
          screenOptions={{
            headerStyle: { backgroundColor: C.bg },
            headerTintColor: C.accent,
            headerTitleStyle: { color: C.text, fontWeight: "700" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: C.bg },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false, title: "Outlasted" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="EditDob" component={EditDobScreen} options={{ title: "Date of birth" }} />
          <Stack.Screen name="Pick" component={PickScreen} options={{ title: "Choose people", presentation: "modal" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
