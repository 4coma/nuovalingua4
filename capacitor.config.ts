import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'nuovalingua4',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3880ff'
    }
  },
  android: {
    navigationBarColor: '#3880ff'
  }
};

export default config;
