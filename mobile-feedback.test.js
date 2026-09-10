const fs = require('fs');
const vm = require('vm');
describe.each(['script.js','ios/VoidRift/WebContent/script.js'])('%s mobile feedback', file => {
 const source=fs.readFileSync(file,'utf8');
 test.each([[320,568],[393,852],[852,393]])('combo splashes fit %ix%i regardless of Retina resolution', (width,height)=>{
  const a=source.indexOf('    // ── Kill Combo Multiplier Splash');
  const b=source.indexOf('\n    // ── ',a+10);
  const calls=[];
  const ctx={save(){},restore(){},strokeText(...args){calls.push(args);},fillText(...args){calls.push(args);}};
  vm.runInNewContext(source.slice(a,b),{ctx,window:{innerWidth:width,innerHeight:height},canvas:{width:width*3,height:height*3},performance:{now:()=>100},killComboMultiplier:3,killComboSplashStart:0,KILL_COMBO_WINDOW:3000,killComboEscalated:true,killComboEscalatedStart:0});
  expect(calls).toHaveLength(4);
  calls.forEach(([,x,y,maxWidth])=>{expect(x-maxWidth/2).toBeGreaterThanOrEqual(32);expect(x+maxWidth/2).toBeLessThanOrEqual(width-32);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(height);});
 });
 test('upgrade breaks occur only after waves 3, 6, 9',()=>{
  const a=source.indexOf('  const shouldOfferWaveUpgrade');
  const b=source.indexOf('    const modal',a);
  for(let wave=1;wave<=9;wave++){
   const next=jest.fn();
   const context={readyUpLevel:wave,next};
   vm.runInNewContext(source.slice(a,b)+'}; globalThis.offer=shouldOfferWaveUpgrade(readyUpLevel); if(!offer)showWaveUpgradeScreen(next);',context);
   expect(context.offer).toBe(wave%3===0);
   expect(next).toHaveBeenCalledTimes(wave%3===0?0:1);
  }
 });
});
