# Android / Google Play Starter

This folder is the starter handoff for making FortressForesight a Google Play-billed Android app.

## Intended flow

1. `fortressforesight.app` remains the main web experience
2. An Android wrapper app opens the site in a Trusted Web Activity
3. Google Play handles the subscription purchase
4. The purchased entitlement is synced to Firebase and unlocks paid access everywhere

## Repo pieces added for this

- `android/twa-manifest.json`
- `android/assetlinks.template.json`
- `src/utils/googlePlay.js`
- Play-only upgrade page in the web app

## Before generating the Android app

1. Pick the final Android package name
2. Add `VITE_PLAY_APP_PACKAGE` or `VITE_PLAY_STORE_URL`
3. Replace the placeholders in `android/assetlinks.template.json`
4. Copy the final file to `public/.well-known/assetlinks.json`

## Next Android steps

1. Generate the Android wrapper with Bubblewrap or Android Studio
2. Configure Google Play Billing in the Android app
3. Create the subscription in Play Console
4. Add purchase verification and entitlement sync
5. Publish the app listing
