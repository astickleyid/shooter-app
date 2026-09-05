const fs = require('fs');
const vm = require('vm');

describe.each(['admob-manager.js', 'ios/VoidRift/WebContent/admob-manager.js'])('%s release configuration', file => {
  test('disabled iOS ads never preload, show, or grant a reward', () => {
    const postMessage = jest.fn();
    const window = {
      iOSBridge: { ads: { enabled: false } },
      webkit: { messageHandlers: { adPreloadRewarded: { postMessage }, adShowRewarded: { postMessage } } },
      addEventListener: jest.fn()
    };
    const context = vm.createContext({ window, console });
    vm.runInContext(fs.readFileSync(file, 'utf8') + ';globalThis.manager = AdMobManager;', context);
    const manager = context.manager;
    const reward = jest.fn(), cancel = jest.fn();
    manager.initialize();
    manager._preload();
    manager.showRewarded(reward, cancel);
    expect(manager.canShow).toBe(false);
    expect(manager.isLoading).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
    expect(window.addEventListener).not.toHaveBeenCalled();
    expect(reward).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledWith('disabled');
  });
});
