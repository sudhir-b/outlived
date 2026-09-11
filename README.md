# Outlasted

A tiny iOS app. Enter your date of birth, pick some famous people, and get a notification on the day you've lived longer than each of them did.

- No account, no server. Everything is on the phone.
- Local scheduled notifications (iOS caps these at 64 pending, so the nearest 64 milestones are scheduled).

## Develop

```bash
npm install
npx expo run:ios            # builds and opens the iOS Simulator
```

## Data

`src/data/people.json` is generated from Wikidata by `node scripts/fetch-people.mjs`. It unions two sources: dead humans with at least 100 Wikipedia sitelinks, and the 5,000 most popular dead people in the [Pantheon](https://pantheon.world) dataset (CC BY). Exact dates come from Wikidata; Pantheon supplies the theme (from its occupation field) and the popularity rank. People whose two sources disagree on lifespan by more than two years are dropped unless Wikidata has exact dates. Year-only dates are treated as 1 July and shown as approximate.

## Release

See `RELEASE.md`.

## Gotcha

If every local notification request suddenly fails in the Simulator (`ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE`, and the system log shows `Added notification request: [ hasError: 1 ]`), the simulator's notification daemon is stuck. Shut the device down and boot it again:

```bash
xcrun simctl shutdown <udid> && xcrun simctl boot <udid>
```

Verified on both the iOS 26.5 and iOS 27.0 runtimes: after a reboot, scheduling and delivery work.
