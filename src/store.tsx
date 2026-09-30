import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { Settings, saveSettings } from "./lib/storage";
import { computeOutlive, Outlive, personById } from "./lib/people";
import { askPermission, getPermission, reschedule } from "./lib/notifications";
import { Civil, today } from "./lib/dates";

type Store = {
  settings: Settings;
  outlives: Outlive[];
  permission: boolean;
  canAskPermission: boolean;
  setDob: (dob: Civil) => void;
  setPicks: (picks: Set<string>) => void;
  setTime: (hour: number, minute: number) => void;
  setAskedNotify: () => void;
  requestPermission: () => Promise<boolean>;
};

const Ctx = createContext<Store | null>(null);

export function useApp(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useApp must be used inside AppProvider");
  return s;
}

export function AppProvider({ initial, children }: { initial: Settings; children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [permission, setPermission] = useState({ granted: false, canAsk: false });
  const [ref, setRef] = useState<Civil>(today());

  // Recompute "today" when the app comes back to the foreground, so a milestone that passed overnight shows as passed.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => st === "active" && setRef(today()));
    return () => sub.remove();
  }, []);

  const outlives = useMemo<Outlive[]>(() => {
    if (!settings.dob) return [];
    return settings.picks
      .map(personById)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => computeOutlive(p, settings.dob!, ref));
  }, [settings.dob, settings.picks, ref]);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next).catch(() => {});
  }, []);

  // Re-plan notifications whenever the inputs change. This only checks permission; asking happens from Home or Settings.
  useEffect(() => {
    if (!settings.dob) return;
    let cancelled = false;
    (async () => {
      const p = await getPermission();
      if (cancelled) return;
      setPermission(p);
      if (p.granted) await reschedule(outlives, settings.notifyHour, settings.notifyMinute);
    })();
    return () => { cancelled = true; };
  }, [outlives, settings.notifyHour, settings.notifyMinute, permission.granted]);

  const store = useMemo<Store>(() => ({
    settings,
    outlives,
    permission: permission.granted,
    canAskPermission: permission.canAsk,
    setDob: (dob) => persist({ ...settings, dob }),
    setPicks: (picks) => persist({ ...settings, picks: [...picks] }),
    setTime: (notifyHour, notifyMinute) => persist({ ...settings, notifyHour, notifyMinute }),
    setAskedNotify: () => persist({ ...settings, askedNotify: true }),
    requestPermission: async () => { const granted = await askPermission(); setPermission({ granted, canAsk: false }); return granted; },
  }), [settings, outlives, permission, persist]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
