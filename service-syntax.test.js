const fs = require('fs');
const vm = require('vm');
test.each(['auth-system.js', 'leaderboard-system.js', 'ios/VoidRift/WebContent/auth-system.js', 'ios/VoidRift/WebContent/leaderboard-system.js'])('%s parses as a browser script', file => {
  expect(() => new vm.Script(fs.readFileSync(file, 'utf8'))).not.toThrow();
});
