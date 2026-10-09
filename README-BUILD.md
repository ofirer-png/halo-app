# Halo IM — native app (Capacitor) build & TestFlight guide

This turns the **Halo IM** web messenger you already run into a **real native iOS & Android app**
for your closed community — no public App Store listing needed. It wraps your live site
(`https://portal.ecofrost.ae/halo`), so updating the website updates the app instantly.

Result:
- **iOS** → distribute via **TestFlight** (invite link, up to ~10,000 testers).
- **Android** → distribute a **signed APK** (sideload link) or Google Play **closed testing**.

---

## 0) What you need (one‑time)
- **iOS:** a **Mac** with **Xcode** (free), and an **Apple Developer account** ($99/yr → developer.apple.com/programs).
- **Android:** **Android Studio** (free, any OS: Mac/Windows/Linux).
- **Node.js 18+** installed.

> You don't need a Mac for Android. You DO need a Mac for iOS/TestFlight (Apple requires Xcode).

---

## 1) Create the native projects (5 min)
From this folder:
```bash
npm install
npx cap add ios        # creates the native iOS project (Mac only)
npx cap add android    # creates the native Android project
npm run assets         # generates all app icons + splash from resources/icon.png & splash.png
npx cap sync
```

## 2) iOS → TestFlight
```bash
npx cap open ios       # opens Xcode
```
In Xcode:
1. Select the **App** target → **Signing & Capabilities** → check **Automatically manage signing**, pick your **Team** (your Apple Developer account). Set **Bundle Identifier** to `ae.ecofrost.haloim` (must be unique to you — change if taken).
2. **Microphone & camera permission strings** (needed for calls): open `ios/App/App/Info.plist` and add:
   - `Privacy - Microphone Usage Description` → "Halo IM uses your microphone for voice and video calls."
   - `Privacy - Camera Usage Description` → "Halo IM uses your camera for video calls."
3. Pick **Any iOS Device (arm64)** as the run target → menu **Product → Archive**.
4. When the Organizer opens → **Distribute App → TestFlight (& App Store)** → upload.
5. Go to **App Store Connect → your app → TestFlight**:
   - Add **External testers**, enable a **public link**, and share that link with your community.
   - The first external build goes through a quick **Beta App Review** (usually hours–a day).
   - Testers install the free **TestFlight** app, open your link, tap **Install**.
   - Note: TestFlight builds **expire after ~90 days** — re‑archive & upload to refresh.

## ⭐ EASIEST Android path — build the APK in the cloud (no Android Studio, no Mac)

You do **not** need to install anything to get an Android APK. The included GitHub Actions
workflow (`.github/workflows/android-build.yml`) builds it on GitHub's servers.

**One‑time:** push this `halo-app` folder to a GitHub repo (can be private).

**To build:**
1. Open the repo → **Actions** tab → **Build Halo IM Android APK** → **Run workflow**.
2. Wait ~3–5 min. When it's green, open the run → **Artifacts** → download **`halo-im-debug-apk`**.
3. That `app-debug.apk` installs on any Android phone: open it, allow "install from this
   source" once, install. **No store, no review.** Share the file (or a link to it) with your team.

> The debug APK is fine for a closed community. Because the app is *hosted* (`server.url`),
> every website change you deploy shows up in the app automatically — you only rebuild the APK
> when you change the native wrapper (icon, permissions, plugins).

**Optional — a SIGNED RELEASE apk** (recommended once you're past testing, and required for
Google Play closed testing). Create a keystore once and add it to the repo as secrets; the
workflow then also produces `app-release.apk`.

Create the keystore (any machine with Java, or in the Actions tab's reusable runner — easiest
is once on your own machine or a cloud shell):
```bash
keytool -genkeypair -v -keystore halo-release.keystore -alias halo \
  -keyalg RSA -keysize 2048 -validity 10000
# remember the store password, key alias (halo), and key password you set
base64 -w0 halo-release.keystore > keystore.b64   # (macOS: base64 -i halo-release.keystore -o keystore.b64)
```
Then in the GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**,
add these four:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the entire contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | the store password you chose |
| `ANDROID_KEY_ALIAS` | `halo` (or the alias you chose) |
| `ANDROID_KEY_PASSWORD` | the key password you chose |

Re‑run the workflow → the run now also has a **`halo-im-release-apk`** artifact. Keep the
keystore + passwords safe; you must reuse the **same** keystore for every future update.

**Publish a downloadable link:** push a tag and the workflow attaches the APK(s) to a GitHub Release:
```bash
git tag v1.0.0 && git push origin v1.0.0
```
Then share the Release's APK download URL with your community.

---

## 3) Android → signed APK via Android Studio (alternative to the cloud build above)
```bash
npx cap open android   # opens Android Studio
```
In Android Studio:
1. **Build → Generate Signed Bundle / APK → APK**. Create a keystore the first time (keep it safe — you reuse it for every update).
2. Choose **release**, finish → you get `app-release.apk`.
3. Host that APK on a private link (your site, Drive, etc.). Users open it on Android, allow
   "Install unknown apps" once, and install. **No store, no review.**
4. (Optional) Google Play **closed testing**: Play Console ($25 one‑time) → upload the AAB →
   add testers by email or link. Reviewed, but not public.

## 4) Updating the app
Because it's hosted (`server.url`), **any change you deploy to the website appears in the app
immediately** — no rebuild. You only rebuild/re‑submit when you change this native wrapper
(icon, native plugins, permissions) or to refresh an expired TestFlight build.

---

## 5) Native push notifications — NOW WIRED (FCM for Android, APNs for iOS)

The code for native push is already built on both sides:
- **App:** the `@capacitor/push-notifications` plugin is included; when the app starts it asks for
  notification permission and registers the device's token with the backend
  (`POST /api/push/native/register`). Tapping a notification opens the conversation.
- **Server:** sends through **Firebase Cloud Messaging HTTP v1** (`src/lib/nativepush.ts`). Every
  chat message / call already fans out over BOTH web push and native push automatically.

You just need to create a free Firebase project and drop in the config. One-time:

### A. Firebase project + Android (FCM)
1. Go to **console.firebase.google.com** → **Add project** (any name).
2. **Project settings → General → Your apps → Add app → Android.**
   - Package name: **`ae.ecofrost.haloim`** (must match `appId` in `capacitor.config.ts`).
   - Download **`google-services.json`**.
3. Give it to the build:
   - **Cloud build:** add a GitHub secret **`ANDROID_GOOGLE_SERVICES_JSON`** = the full contents of
     `google-services.json`. The workflow wires it in automatically on the next run.
   - **Local build:** put `google-services.json` in `android/app/`.

### B. iOS (APNs, through Firebase)
1. In the same Firebase project: **Add app → iOS**, bundle id **`ae.ecofrost.haloim`**, download
   **`GoogleService-Info.plist`** → place in `ios/App/App/` (drag into the App target in Xcode).
2. Create an **APNs auth key**: Apple Developer → **Certificates, IDs & Profiles → Keys → +**,
   enable **Apple Push Notifications service (APNs)**, download the **`.p8`** (note the Key ID + your Team ID).
3. Firebase → **Project settings → Cloud Messaging → Apple app configuration → APNs Authentication Key →
   Upload** the `.p8` (with Key ID + Team ID).
4. In Xcode, the **App** target → **Signing & Capabilities → + Capability → Push Notifications**, and
   add **Background Modes → Remote notifications**.

### C. Server (one env var)
1. Firebase → **Project settings → Service accounts → Generate new private key** → downloads a JSON.
2. In **Vercel → your project → Settings → Environment Variables**, add **`FCM_SERVICE_ACCOUNT`** =
   the entire contents of that JSON (one value). Redeploy.
3. Verify: open `/health` → it should show `"nativePushEnabled": true`.

That's it — installed apps now get real OS notifications for messages and calls even when fully closed,
with no code changes. (Until `FCM_SERVICE_ACCOUNT` is set, the server simply skips native push and the
PWA web-push path keeps working.)

---

## 6) (Reference) earlier notes on native push
Web push (VAPID) does NOT fire inside a native app's webview. For reliable **background
notifications in the native app**, add native push:
- Create a free **Firebase** project → add iOS & Android apps → download `google-services.json`
  (Android) and set up **APNs key** (from your Apple Developer account) in Firebase for iOS.
- Add the `@capacitor/push-notifications` plugin; the web app registers the device token and
  sends it to a new backend endpoint; the server sends alerts via **FCM/APNs**.
- **I can wire both sides** (the app registration + a `POST /api/push/native` backend bridge and
  the send logic) once you've created the Firebase project and the APNs key — just send me those
  and I'll ship the code. Until then, in‑app notifications work while the app is open, and calls
  ring via the existing system.

---

## Notes
- Calls (Daily) and mic/camera work inside the native webview on iOS 14.3+/modern Android, as long
  as the Info.plist permission strings (step 2.2) and Android permissions are present (Capacitor
  adds the Android ones automatically on `cap sync`).
- `appId` `ae.ecofrost.haloim` is a suggestion — it just needs to be unique to your account.
- Keep your signing keystore (Android) and Apple account credentials safe; you need them for every update.
