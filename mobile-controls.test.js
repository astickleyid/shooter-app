const fs = require('fs');
const vm = require('vm');

describe.each(['script.js', 'ios/VoidRift/WebContent/script.js'])('%s mobile input', file => {
  const source = fs.readFileSync(file, 'utf8');
  test.each(['Move', 'Shoot'])('%s release stops input without timers that corrupt the next touch', kind => {
    const start = source.indexOf(`    const reset${kind}Joystick =`);
    const end = source.indexOf('\n    };', start) + 7;
    const context = vm.createContext({
      dom: { joystickMoveStick: { style: {} }, joystickShootStick: { style: {} } },
      controlSettings: { floatingJoysticks: true },
      input: { moveX: 1, moveY: 1, aimX: 1, aimY: 1, isAiming: true, fireHeld: true },
      setInterval: jest.fn(),
    });
    vm.runInContext(`let smoothMoveX=1, smoothMoveY=1, smoothAimX=1, smoothAimY=1;
      let moveHapticTriggered=true, shootHapticTriggered=true;
      ${source.slice(start, end)}; reset${kind}Joystick();`, context);
    const axes = kind === 'Move' ? ['moveX', 'moveY'] : ['aimX', 'aimY'];
    axes.forEach(axis => expect(context.input[axis]).toBe(0));
    if (kind === 'Shoot') expect(context.input.fireHeld).toBe(false);
    expect(context.setInterval).not.toHaveBeenCalled();
  });
  test('HUD work is limited while rendering can continue at display refresh rate', () => {
    const start = source.indexOf('  const updateFrameHUD =');
    const end = source.indexOf('\n  };', start) + 5;
    const updateHUD = jest.fn();
    const context = vm.createContext({ updateHUD });
    vm.runInContext(`let lastHUDTime=-Infinity; ${source.slice(start, end)};
      for(let t=0;t<1000;t+=1000/120) updateFrameHUD(t);`, context);
    expect(updateHUD.mock.calls.length).toBeGreaterThan(20);
    expect(updateHUD.mock.calls.length).toBeLessThanOrEqual(30);
  });
});
