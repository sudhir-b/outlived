# Outlived

A tiny iOS app. Enter your date of birth, pick some famous people, and get a notification on the day you've lived longer than each of them did.

- No account, no server. Everything is on the phone.
- Local scheduled notifications (iOS caps these at 64 pending, so the nearest 64 milestones are scheduled).
- "Export to Calendar" writes every milestone as an all-day event, as a backup for notifications.

## Develop

```bash
npm install
npx expo run:ios            # builds and opens the iOS Simulator
```

## Data

`src/data/people.json` is generated from Wikidata by `node scripts/fetch-people.mjs`. It pulls dead humans with at least 100 Wikipedia sitelinks, with birth/death dates and a rough theme tag from their occupations. Year-only dates are treated as 1 July and shown as approximate.

## Release

See `RELEASE.md`.
