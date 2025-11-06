import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nuovalingua.app',
  appName: 'NuovaLingua',
  webDir: 'www',
  // server: {
  //   url: 'http://192.168.129.8:8100',
  //   cleartext: true
  // },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3880ff'
    },
    SplashScreen: {
      backgroundColor: '#3880ff',
      showSpinner: false
    }
  },
  android: {
    backgroundColor: '#3880ff'
  }
};

export default config;
