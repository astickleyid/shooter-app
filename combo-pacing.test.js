const fs=require('fs'),vm=require('vm');
describe.each(['script.js','ios/VoidRift/WebContent/script.js'])('%s combo pacing',file=>{
 const s=fs.readFileSync(file,'utf8');
 const a=s.indexOf('    // A score combo starts');
 const b=s.indexOf('    // Score calculation',a);
 const kill=vm.runInNewContext('(function(){'+s.slice(a,b)+'})',context={performance:{now:()=>context.now},now:100,killComboChain:0,killComboMultiplier:1,killComboTimerEnd:0,KILL_COMBO_MAX:5,KILL_COMBO_WINDOW:2000,killComboSplashStart:0,killComboEscalated:false,killComboEscalatedStart:0});
 var context;
 test('first four kills give no multiplier or escalation; tiers require five more kills',()=>{
  for(let i=1;i<=24;i++){
   context.now+=100;kill();
   expect(context.killComboMultiplier).toBe(Math.min(5,1+Math.floor(i/5)));
   expect(context.killComboEscalated).toBe([10,15,20].includes(i));
  }
  context.now+=2100;kill();
  expect(context.killComboMultiplier).toBe(1);
  expect(context.killComboChain).toBe(1);
  expect(context.killComboEscalated).toBe(false);
 });
});
