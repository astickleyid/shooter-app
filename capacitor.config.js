/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.voidrift.game',
  appName: 'VOID RIFT',
  webDir: '.',

  plugins: {
    AdMob: {
      appIdIos: 'ca-app-pub-3940256099942544~1458002511',
      appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
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
    cleartext: false,
  },
};

module.exports = config;
