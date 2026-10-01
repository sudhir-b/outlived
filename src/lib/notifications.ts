import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { Outlive, describe } from "./people";
import { ageInWords, toDate } from "./dates";

// Days with a reminder, scheduled ahead; the app tops them up on every open. iOS keeps at most 64 pending
// notifications. Android allows 500 alarms per app, so it can look further ahead for someone tracking everyone.
const LIMIT = Platform.OS === "ios" ? 64 : 150;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Where things stand, without prompting. `canAsk` means iOS will still show its one-time prompt. */
export async function getPermission(): Promise<{ granted: boolean; canAsk: boolean }> {
  const p = await Notifications.getPermissionsAsync();
  return { granted: p.granted, canAsk: !p.granted && p.canAskAgain };
}

/** Shows the system prompt if it hasn't been answered yet; otherwise returns the existing answer straight away. */
export async function askPermission(): Promise<boolean> {
  // Android 13+ only shows its prompt once the app has a notification channel.
  await ensureChannel();
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Opens the system screen with Outlasted's notification switch, falling back to the app's settings page. */
export function openNotificationSettings(): void {
  const fallback = () => { Linking.openSettings(); };
  if (Platform.OS === "ios") {
    // UIApplication.openNotificationSettingsURLString
    Linking.openURL("app-settings:notifications").catch(fallback);
    return;
  }
  const pkg = Constants.expoConfig?.android?.package;
  if (!pkg) return fallback();
  Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [{ key: "android.provider.extra.APP_PACKAGE", value: pkg }]).catch(fallback);
}

const CHANNEL = "milestones";

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  // HIGH shows a banner as well as the shade entry. Android fixes a channel's importance when it's first created.
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Milestones", importance: Notifications.AndroidImportance.HIGH });
}

let queue: Promise<number> = Promise.resolve(0);

/**
 * Cancel everything and schedule a reminder for each of the next days with a milestone, one per day.
 * Runs one at a time: ticking people quickly would otherwise interleave two runs and leave duplicate reminders.
 */
export function reschedule(outlives: Outlive[], hour: number, minute: number): Promise<number> {
  const run = queue.catch(() => 0).then(() => replan(outlives, hour, minute));
  queue = run;
  return run;
}

async function replan(outlives: Outlive[], hour: number, minute: number): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await ensureChannel();
  const now = Date.now();
  // Someone tracking whole categories gets several people on some days; they share that day's reminder.
  const days = new Map<string, Outlive[]>();
  for (const o of outlives.filter((x) => x.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway)) {
    if (toDate(o.date, hour, minute).getTime() <= now) continue;
    const key = `${o.date.y}-${o.date.m}-${o.date.d}`;
    const day = days.get(key);
    if (day) day.push(o);
    else if (days.size < LIMIT) days.set(key, [o]);
  }

  let count = 0;
  for (const day of days.values()) {
    try {
      await schedule(day, hour, minute);
      count += 1;
    } catch (e) {
      console.warn(`Could not schedule ${day[0].person.name} for ${toDate(day[0].date, hour, minute).toISOString()}: ${String(e)}`);
    }
  }
  return count;
}

const age = (o: Outlive) => ageInWords(o.lifespan, o.person.precision);

function content(day: Outlive[]): Notifications.NotificationContentInput {
  // The ids let a tap open these people's page (see App.tsx).
  const data = { ids: day.map((o) => o.person.id) };
  if (day.length === 1) {
    const [o] = day;
    const what = describe(o.person);
    return {
      title: `You've outlasted ${o.person.name}`,
      body: `${what ? `${o.person.name}, ${what},` : o.person.name} died aged ${age(o)}. As of today, you've lived longer.`,
      data,
      sound: true,
    };
  }
  const names = day.map((o) => `${o.person.name} (${age(o)})`);
  const list = names.length <= 4
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
  return {
    title: `You've outlasted ${day.length} people today`,
    body: `${list}. As of today, you've lived longer than all of them.`,
    data,
    sound: true,
  };
}

async function schedule(day: Outlive[], hour: number, minute: number): Promise<void> {
  const { date } = day[0];
  await Notifications.scheduleNotificationAsync({
      content: content(day),
      // Calendar triggers are iOS-only. Android gets the same moment as a plain date; the app re-plans on every open,
      // so a clock or time zone change is picked up either way.
      trigger: Platform.OS === "ios"
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, year: date.y, month: date.m, day: date.d, hour, minute, repeats: false }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: toDate(date, hour, minute), channelId: CHANNEL },
  });
}
