# Outlasted — scope (v1)

Gift app for one user. No sign-in, no backend, no running costs.

## Decision: platform
- **Expo (React Native), iOS only for now.** Local scheduled notifications via `expo-notifications`. No server needed.
- Reason: iOS web apps can't schedule local notifications (Web Push needs a server). Native is the only true client-only option with notifications.
- Cost: Apple Developer Program $99/yr. Prototype free on iOS Simulator first.
- Distribution: App Store submission (permanent). TestFlight expires every 90 days, so avoid it for the final gift. EAS ad hoc build (device UDID registered) is a 1-year middle option.
- Fallback / hedge: "Add to Calendar" button exporting an .ics of all outlive dates. Works even if notification permission is denied.

## User flow
1. First open: enter date of birth (big date picker, large text). Stored in AsyncStorage.
2. Pick people:
   - Browse by theme (Musicians, Scientists, Rulers, Writers, Athletes, Ancient world, Died young).
   - Search by name.
   - "Surprise me" random 10.
3. Home screen: list of picks sorted by outlive date.
   - Past: "You outlasted Mozart on 12 Mar 2000 (he died at 35y 10m)".
   - Future: "You'll outlive Churchill on 4 Jun 2051 (in 24 years)".
   - Next one up is highlighted at the top.
4. On the day: local notification "Today you've outlasted Charles Darwin, who died aged 73y 2m."
5. Settings: change DOB, notification time (default 9am), re-request permission.

## Core logic
- lifespanDays = deathDate - birthDate
- outliveDate = userDOB + lifespanDays
- Recompute and reschedule all notifications whenever DOB or picks change (cancel all, schedule again).
- iOS limit: 64 pending local notifications. Schedule only the next 64 future dates.
- Year-only precision for ancient figures: store `precision: "day" | "year"`, use 1 Jul for year-only, label "approx."
- Ignore Julian/Gregorian differences.

## Data
- `people.json` bundled in the app. Fields: id, name, birth, death, precision, occupation[], oneLiner, wikipediaThumb (optional).
- Source: one-off Wikidata SPARQL script (humans with sitelinks > N, birth and death dates known). Target 300–500 people.
- v1: no images. Initials on a coloured circle. Add thumbnails later if wanted.

## Out of scope for v1
- Android, accounts, sync, sharing, images, backend of any kind.

## Build order (each is a small session)
1. Expo app skeleton, DOB screen, hardcoded 20 people, home list with calc. Run in Simulator.
2. Local notifications + reschedule logic + permission handling. Test in Simulator with a fake "tomorrow".
3. Wikidata script -> people.json, themes, search, surprise me.
4. .ics export, settings, large-text pass, app icon.
5. Apple account, EAS build, App Store submission.
