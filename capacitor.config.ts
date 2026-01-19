import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.artem.todotodo',
  appName: 'todotodo',
  webDir: 'www/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
