import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Onboarding } from "./src/screens/Onboarding";
import { Home } from "./src/screens/Home";
import { Pick } from "./src/screens/Pick";
import { Settings } from "./src/screens/Settings";
import { DEFAULTS, loadSettings, saveSettings, Settings as S } from "./src/lib/storage";
import { computeOutlive, Outlive, personById } from "./src/lib/people";
import { ensurePermission, reschedule } from "./src/lib/notifications";
import { shareIcs } from "./src/lib/ics";
import { Civil, today } from "./src/lib/dates";

type Screen = "loading" | "onboarding" | "home" | "pick" | "settings" | "editDob";

export default function App() {
  const [settings, setSettings] = useState<S>(DEFAULTS);
  const [screen, setScreen] = useState<Screen>("loading");
  const [permission, setPermission] = useState(false);
  const [scheduled, setScheduled] = useState(0);
  const [ref, setRef] = useState<Civil>(today());

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setScreen(s.dob ? "home" : "onboarding");
    });
    const sub = AppState.addEventListener("change", (st) => st === "active" && setRef(today()));
    return () => sub.remove();
  }, []);

  const outlives: Outlive[] = useMemo(() => {
    if (!settings.dob) return [];
    return settings.picks.map(personById).filter((p): p is NonNullable<typeof p> => !!p).map((p) => computeOutlive(p, settings.dob!, ref));
  }, [settings.dob, settings.picks, ref]);

  const persist = useCallback(async (next: S) => {
    setSettings(next);
    await saveSettings(next);
  }, []);

  // Re-plan notifications whenever the inputs change.
  useEffect(() => {
    if (!settings.dob || screen === "loading") return;
    let cancelled = false;
    (async () => {
      const ok = await ensurePermission();
      if (cancelled) return;
      setPermission(ok);
      if (ok) setScheduled(await reschedule(outlives, settings.notifyHour, settings.notifyMinute));
    })();
    return () => { cancelled = true; };
  }, [outlives, settings.notifyHour, settings.notifyMinute, screen === "loading"]);

  if (screen === "loading") return null;

  return (
    <>
      <StatusBar style="light" />
      {screen === "onboarding" && <Onboarding initial={null} onDone={(dob) => { persist({ ...settings, dob }); setScreen("pick"); }} />}
      {screen === "editDob" && <Onboarding initial={settings.dob} onCancel={() => setScreen("settings")} onDone={(dob) => { persist({ ...settings, dob }); setScreen("settings"); }} />}
      {screen === "home" && settings.dob && <Home dob={settings.dob} outlives={outlives} onPick={() => setScreen("pick")} onSettings={() => setScreen("settings")} />}
      {screen === "pick" && (
        <Pick picks={new Set(settings.picks)} onChange={(next) => persist({ ...settings, picks: [...next] })} onDone={() => setScreen("home")} />
      )}
      {screen === "settings" && settings.dob && (
        <Settings
          dob={settings.dob}
          hour={settings.notifyHour}
          minute={settings.notifyMinute}
          scheduled={scheduled}
          permission={permission}
          onChangeDob={() => setScreen("editDob")}
          onChangeTime={(h, m) => persist({ ...settings, notifyHour: h, notifyMinute: m })}
          onExport={() => shareIcs(outlives).catch((e) => Alert.alert("Couldn't export", String(e)))}
          onRequestPermission={async () => {
            const ok = await ensurePermission();
            setPermission(ok);
            if (!ok) Alert.alert("Notifications are off", "Turn them on for Outlasted in the iPhone Settings app.");
          }}
          onBack={() => setScreen("home")}
        />
      )}
    </>
  );
}
