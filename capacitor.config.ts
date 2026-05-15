import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voidrift.game',
  appName: 'VOID RIFT',
  webDir: '.',  // Root directory — index.html is in root

  plugins: {
    // AdMob rewarded ads
    AdMob: {
      // Replace with your AdMob App IDs from https://admob.google.com/
      // iOS App ID:     ca-app-pub-REPLACE_WITH_YOUR_APP_ID
      // Android App ID: ca-app-pub-REPLACE_WITH_YOUR_APP_ID
      // Test IDs:
      //   iOS:     ca-app-pub-3940256099942544~1458002511
      //   Android: ca-app-pub-3940256099942544~3347511713
      appIdIos: 'ca-app-pub-3940256099942544~1458002511',     // REPLACE
      appIdAndroid: 'ca-app-pub-3940256099942544~3347511713', // REPLACE
    },
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },

  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  server: {
    // For development only — remove for production builds
    // url: 'http://192.168.1.X:5173',
    cleartext: false,
  },
};

export default config;
