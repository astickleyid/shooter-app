/**
 * PR #2 — level-up rewards & milestone unlock coverage.
 * Mirrors LEVEL_MILESTONES from script.js as a design-contract regression guard.
 */
const LEVEL_BASE_CREDIT = (lvl) => 50 + lvl * 10;
const LEVEL_MILESTONES = {
  2:{abilities:[['primary','scatter']]}, 3:{abilities:[['secondary','cluster']]}, 4:{credits:500},
  5:{ships:['phantom'],abilities:[['defense','reflector']]}, 6:{abilities:[['primary','rail']]},
  7:{abilities:[['secondary','seeker']]}, 8:{abilities:[['ultimate','solarbeam']]}, 9:{credits:800},
  10:{ships:['bulwark'],abilities:[['primary','ionburst']]}, 12:{abilities:[['secondary','gravity']]},
  13:{abilities:[['defense','phaseshift']]}, 15:{ships:['emberwing'],abilities:[['primary','plasma']],credits:1200},
  18:{abilities:[['secondary','charge']]}, 20:{ships:['spectre'],abilities:[['ultimate','timewarp']]},
  22:{abilities:[['primary','photon']]}, 25:{abilities:[['defense','overcharge']],credits:2000},
  28:{abilities:[['secondary','reinforcement']]}, 30:{abilities:[['ultimate','supernova']],credits:2500},
  35:{ships:['titan']}, 40:{credits:4000}
};
const STARTERS = { primary:['pulse'], secondary:['nova'], defense:['aegis'], ultimate:['voidstorm'] };
const ALL = {
  primary:['pulse','scatter','rail','ionburst','plasma','photon'],
  secondary:['nova','cluster','seeker','gravity','charge','reinforcement'],
  defense:['aegis','reflector','phaseshift','overcharge'],
  ultimate:['voidstorm','solarbeam','timewarp','supernova']
};

const grantedAbilitiesBy = (maxLvl) => {
  const owned = { primary:[...STARTERS.primary], secondary:[...STARTERS.secondary], defense:[...STARTERS.defense], ultimate:[...STARTERS.ultimate] };
  for (let l=1; l<=maxLvl; l++) for (const [c,id] of (LEVEL_MILESTONES[l]?.abilities||[])) owned[c].push(id);
  return owned;
};
const grantedShipsBy = (maxLvl) => {
  const s=['vanguard']; for (let l=1; l<=maxLvl; l++) for (const id of (LEVEL_MILESTONES[l]?.ships||[])) s.push(id); return s;
};

describe('Level-up rewards & milestone unlocks', () => {
  test('base credit reward scales per level', () => {
    expect(LEVEL_BASE_CREDIT(1)).toBe(60);
    expect(LEVEL_BASE_CREDIT(10)).toBe(150);
    expect(LEVEL_BASE_CREDIT(50)).toBe(550);
  });
  test('every ability is unlockable by level 30', () => {
    const owned = grantedAbilitiesBy(30);
    for (const cat of Object.keys(ALL)) for (const id of ALL[cat]) expect(owned[cat]).toContain(id);
    const total = Object.values(owned).reduce((a,b)=>a+b.length,0);
    expect(total).toBe(20);
  });
  test('all 6 ships unlockable by level 35', () => {
    const ships = grantedShipsBy(35);
    expect(new Set(ships)).toEqual(new Set(['vanguard','phantom','bulwark','emberwing','spectre','titan']));
  });
  test('no ability or ship is granted twice', () => {
    const seen = new Set();
    for (const m of Object.values(LEVEL_MILESTONES)) {
      for (const [c,id] of (m.abilities||[])) { const k=c+':'+id; expect(seen.has(k)).toBe(false); seen.add(k); }
      for (const s of (m.ships||[])) { expect(seen.has('ship:'+s)).toBe(false); seen.add('ship:'+s); }
    }
  });
});
