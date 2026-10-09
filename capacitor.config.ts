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
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
