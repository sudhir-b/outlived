# Releasing to the App Store

One-time setup (about 30 minutes plus Apple's approval wait):

1. Join the Apple Developer Program ($99/yr) at developer.apple.com with your Apple ID. Approval can take a day or two.
2. Create an Expo account at expo.dev (free) and install the CLI: `npm i -g eas-cli && eas login`.
3. Link this project: `eas init` (creates the project id in app.json).

Each release:

```bash
eas build --platform ios --profile production
```
First run asks you to sign in to Apple and creates certificates and the App Store Connect app record for `com.sudhirb.outlasted` automatically. Say yes to everything.

```bash
eas submit --platform ios --latest
```
Uploads the build to App Store Connect.

Then in appstoreconnect.apple.com:

1. Open the app and fill in the listing. Every field is drafted in `LISTING.md`; the privacy policy is `PRIVACY.md` and its GitHub URL is what goes in the form.
2. Screenshots: run the app in the iPhone 17 Pro Max Simulator and take screenshots with Cmd+S. You need the 6.9" size only.
3. App Privacy: choose "Data not collected".
4. Age rating: fill the questionnaire, everything "None". It's a 4+ app.
5. Pick the build, submit for review. Reviews usually come back within a day or two.

The reviewer notes are in `LISTING.md` too.

## Getting it on his phone before review finishes

After approval he installs from the App Store like any app. If you want it on his phone sooner, TestFlight works: in App Store Connect, TestFlight tab, add his email as an external tester. He installs the TestFlight app and accepts the invite. TestFlight builds expire after 90 days, so the App Store listing is the proper home.

## Updating the people list

```bash
node scripts/fetch-people.mjs
```
Commit the JSON, bump `version` in app.json, and rebuild.
