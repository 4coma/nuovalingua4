import { defineConfig } from '@capacitor/assets';

export default defineConfig({
  icon: {
    source: './resources/icon.png',
    output: './resources',
    android: {
      iconBackgroundColor: '#ffffff',
      iconBackgroundColorDark: '#000000',
      adaptiveIconBackgroundColor: '#ffffff',
      adaptiveIconBackgroundColorDark: '#000000',
    },
  },
});

