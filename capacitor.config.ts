import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luv.orbit',
  appName: 'Orbit',
  webDir: 'capacitor-www',
  server: {
    // Loads the deployed tracker. The FocusLock native plugin is baked into
    // the APK, so the live site can call it once Phase 3 wiring ships.
    url: 'https://tracker-lake-ten.vercel.app',
    cleartext: false,
  },
};

export default config;
