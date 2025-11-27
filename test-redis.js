const { kv } = require('./api/redis-client');

async function test() {
  console.log('Testing Redis client...');
  
  try {
    // Test set
    console.log('Setting key...');
    await kv.set('test:key', { foo: 'bar' });
    
    // Test get
    console.log('Getting key...');
    const value = await kv.get('test:key');
    console.log('Got:', value);
    
    console.log('✅ Redis test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

test();
