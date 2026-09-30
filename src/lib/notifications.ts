import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Outlive } from "./people";
import { ageInWords, toDate } from "./dates";

const IOS_LIMIT = 64;

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

const CHANNEL = "milestones";

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  // HIGH shows a banner as well as the shade entry. Android fixes a channel's importance when it's first created.
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Milestones", importance: Notifications.AndroidImportance.HIGH });
}

let queue: Promise<number> = Promise.resolve(0);

/**
 * Cancel everything and schedule the next N future milestones.
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
  const upcoming = outlives
    .filter((o) => o.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)
    .filter((o) => toDate(o.date, hour, minute).getTime() > now)
    .slice(0, IOS_LIMIT);

  let count = 0;
  for (const o of upcoming) {
    try {
      await schedule(o, hour, minute);
      count += 1;
    } catch (e) {
      console.warn(`Could not schedule ${o.person.name} for ${toDate(o.date, hour, minute).toISOString()}: ${String(e)}`);
    }
  }
  return count;
}

async function schedule(o: Outlive, hour: number, minute: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
      content: {
        title: `You've outlasted ${o.person.name}`,
        body: `${o.person.name} died aged ${ageInWords(o.lifespan, o.person.precision)}. As of today, you've lived longer.`,
        sound: true,
      },
      // Calendar triggers are iOS-only. Android gets the same moment as a plain date; the app re-plans on every open,
      // so a clock or time zone change is picked up either way.
      trigger: Platform.OS === "ios"
        ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, year: o.date.y, month: o.date.m, day: o.date.d, hour, minute, repeats: false }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: toDate(o.date, hour, minute), channelId: CHANNEL },
  });
}
