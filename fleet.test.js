const fs = require('fs');
const vm = require('vm');
describe.each(['script.js', 'ios/VoidRift/WebContent/script.js'])('%s fleet', file => {
  const source = fs.readFileSync(file, 'utf8');
  const begin = source.indexOf('  const SHIP_TEMPLATES = [');
  const end = source.indexOf('\n  ];', begin) + 5;
  const ships = vm.runInNewContext(source.slice(begin, end) + ';SHIP_TEMPLATES;');
  test('nine valid hulls with unique IDs and complete positive stats', () => {
    expect(ships).toHaveLength(9);
    expect(new Set(ships.map(s => s.id)).size).toBe(9);
    ships.forEach(ship => {
      expect(Object.keys(ship.stats)).toHaveLength(8);
      Object.values(ship.stats).forEach(value => expect(value).toBeGreaterThan(0));
    });
  });
  test.each(['aurora', 'kestrel', 'atlas'])('%s survives saved selection restoration', id => {
    const begin = source.indexOf('    const FEATURED_IDS =');
    const end = source.indexOf('    initShipSelection();', begin);
    const context = { SHIP_TEMPLATES: ships, Save: {data:{selectedShip:id}}, selectedShip: null };
    vm.runInNewContext(source.slice(begin,end), context);
    expect(context.selectedShip).toBe(id);
  });
});
