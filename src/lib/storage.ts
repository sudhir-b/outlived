import AsyncStorage from "@react-native-async-storage/async-storage";
import { Civil } from "./dates";

export type Settings = {
  dob: Civil | null;
  picks: string[];
  notifyHour: number;
  notifyMinute: number;
};

const KEY = "outlived.settings.v1";
export const DEFAULTS: Settings = { dob: null, picks: [], notifyHour: 9, notifyMinute: 0 };

export async function loadSettings(): Promise<Settings> {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
