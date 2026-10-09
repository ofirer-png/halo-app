import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Halo IM native wrapper.
 * HOSTED mode: the app loads your live messenger, so updating the website
 * updates the app instantly (no re-submit needed for web changes).
 * Change `server.url` to your real domain if different.
 */
const config: CapacitorConfig = {
  appId: 'ae.ecofrost.haloim',
  appName: 'Halo IM',
  webDir: 'www',
  server: {
    url: 'https://portal.ecofrost.ae/halo',
    cleartext: false,
  },
  backgroundColor: '#0B1F3A',
  ios: { contentInset: 'always', limitsNavigationsToAppBoundDomains: false },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#0B1F3A', showSpinner: false },
    // Native push via Firebase Cloud Messaging (@capacitor-firebase/messaging).
    // Returns a real FCM token on BOTH iOS and Android, which the server sends to.
    // iOS also needs: Push Notifications + Background Modes capabilities (set in Xcode),
    // GoogleService-Info.plist in the app, and your APNs .p8 uploaded in Firebase.
    FirebaseMessaging: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
