import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { createNavigationContainerRef, DarkTheme, NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Onboarding } from "./src/screens/Onboarding";
import { Home } from "./src/screens/Home";
import { Pick } from "./src/screens/Pick";
import { Settings } from "./src/screens/Settings";
import { PersonPage } from "./src/screens/Person";
import { loadSettings, Settings as StoredSettings } from "./src/lib/storage";
import { AppProvider, useApp } from "./src/store";
import { openNotificationSettings } from "./src/lib/notifications";
import { computeOutlive, personById } from "./src/lib/people";
import { C } from "./src/ui";

export type RootParams = {
  Onboarding: undefined;
  Home: undefined;
  Pick: undefined;
  Settings: undefined;
  EditDob: undefined;
  Person: { ids: string[] };
};
const Stack = createNativeStackNavigator<RootParams>();
const nav = createNavigationContainerRef<RootParams>();

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
  const { settings, outlives, canAskPermission, setAskedNotify, requestPermission } = useApp();
  // Offer reminders once there's someone to be reminded about, with a line of context first. iOS shows its own prompt
  // only once, and a "Don't Allow" there can only be undone in the Settings app. Runs when the people sheet closes.
  useFocusEffect(useCallback(() => {
    if (!settings.picks.length || !canAskPermission || settings.askedNotify) return;
    const t = setTimeout(() => {
      setAskedNotify();
      Alert.alert("Get a reminder on the day?", "Outlasted can send you a notification on the day you outlast each of them.", [
        { text: "Not now", style: "cancel" },
        { text: "Turn on", onPress: () => { requestPermission(); } },
      ]);
    }, 500);
    return () => clearTimeout(t);
  }, [settings.picks.length, canAskPermission, settings.askedNotify, setAskedNotify, requestPermission]));
  if (!settings.dob) return null;
  return (
    <Home
      dob={settings.dob}
      outlives={outlives}
      onPick={() => navigation.navigate("Pick")}
      onSettings={() => navigation.navigate("Settings")}
      onPerson={(id) => navigation.navigate("Person", { ids: [id] })}
    />
  );
}

function PickScreen({ navigation }: NativeStackScreenProps<RootParams, "Pick">) {
  const { settings, setPicks } = useApp();
  return (
    <Pick
      dob={settings.dob}
      picks={new Set(settings.picks)}
      onChange={setPicks}
      onDone={() => navigation.goBack()}
      onInfo={(id) => navigation.navigate("Person", { ids: [id] })}
      navigation={navigation}
    />
  );
}

function PersonScreen({ route }: NativeStackScreenProps<RootParams, "Person">) {
  const { settings, setPicks } = useApp();
  const { dob } = settings;
  const outlives = useMemo(
    () => (dob ? route.params.ids.flatMap((id) => { const p = personById(id); return p ? [computeOutlive(p, dob)] : []; }) : []),
    [dob, route.params.ids],
  );
  const picks = new Set(settings.picks);
  const toggle = (id: string) => {
    picks.has(id) ? picks.delete(id) : picks.add(id);
    setPicks(picks);
  };
  return <PersonPage outlives={outlives} picks={picks} onToggle={toggle} />;
}

/** Tapping a reminder opens the page for the people it was about. */
function useOpenFromNotification(navReady: boolean) {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!navReady || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const ids = response.notification.request.content.data?.ids;
    // Cleared once handled, or the same reminder would reopen the page every time the app starts.
    Notifications.clearLastNotificationResponse();
    if (Array.isArray(ids) && ids.length && nav.isReady()) nav.navigate("Person", { ids: ids.map(String) });
  }, [navReady, response]);
}

function SettingsScreen({ navigation }: NativeStackScreenProps<RootParams, "Settings">) {
  const { settings, permission, setTime, requestPermission } = useApp();
  if (!settings.dob) return null;
  return (
    <Settings
      dob={settings.dob}
      hour={settings.notifyHour}
      minute={settings.notifyMinute}
      permission={permission}
      onChangeDob={() => navigation.navigate("EditDob")}
      onChangeTime={setTime}
      onRequestPermission={async () => {
        const ok = await requestPermission();
        if (!ok) Alert.alert("Notifications are off", "Turn them on for Outlasted in your phone's Settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openNotificationSettings },
        ]);
      }}
    />
  );
}

export default function App() {
  const [initial, setInitial] = useState<StoredSettings | null>(null);
  const [navReady, setNavReady] = useState(false);
  useEffect(() => { loadSettings().then(setInitial); }, []);
  useOpenFromNotification(navReady);
  if (!initial) return null;

  return (
    <SafeAreaProvider>
      <AppProvider initial={initial}>
        <StatusBar style="light" />
        <NavigationContainer ref={nav} theme={theme} onReady={() => setNavReady(true)}>
          <Stack.Navigator
            initialRouteName={initial.dob ? "Home" : "Onboarding"}
            screenOptions={{
              headerStyle: { backgroundColor: C.bg },
              headerTintColor: C.accent,
              headerTitleStyle: { color: C.text, fontWeight: "700" },
              headerShadowVisible: false,
              headerTitleAlign: "center", // Android left-aligns by default; match the iPhone
              contentStyle: { backgroundColor: C.bg },
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false, title: "Outlasted" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
            <Stack.Screen name="EditDob" component={EditDobScreen} options={{ title: "Date of birth" }} />
            <Stack.Screen name="Pick" component={PickScreen} options={{ title: "Choose people", presentation: "modal" }} />
            {/* A sheet, so it opens the same way over Home and over the Choose people sheet. */}
            <Stack.Screen
              name="Person"
              component={PersonScreen}
              options={({ navigation }) => ({
                title: "",
                presentation: "modal",
                headerRight: Platform.OS === "ios"
                  ? () => <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ paddingHorizontal: 10 }}><Text style={{ fontSize: 17, fontWeight: "700", color: C.accent }}>Done</Text></Pressable>
                  : undefined,
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
