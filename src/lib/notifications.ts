import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Outlive } from "./people";
import { formatAge, toDate } from "./dates";

const IOS_LIMIT = 64;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Cancel everything and schedule the next N future milestones. */
export async function reschedule(outlives: Outlive[], hour: number, minute: number): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("milestones", {
      name: "Milestones",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const now = Date.now();
  const upcoming = outlives
    .filter((o) => o.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)
    .filter((o) => toDate(o.date, hour, minute).getTime() > now)
    .slice(0, IOS_LIMIT);

  for (const o of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `You've outlived ${o.person.name}`,
        body: `${o.person.name} died aged ${formatAge(o.lifespan)}. As of today, you've lived longer.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: toDate(o.date, hour, minute),
        channelId: "milestones",
      },
    });
  }
  return upcoming.length;
}
