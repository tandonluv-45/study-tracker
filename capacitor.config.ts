import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luv.orbit',
  appName: 'Orbit',
  // Placeholder bundle; the app actually loads the live site via server.url below.
  webDir: 'capacitor-www',
  server: {
    // Phase 1: load the deployed tracker directly in the WebView.
    // Later we swap this for the bundled gamified "Orbit" UI.
    url: 'https://tracker-lake-ten.vercel.app',
    cleartext: false,
  },
};

export default config;
