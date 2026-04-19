// Manual mock for @vercel/kv for testing
const store = new Map();

const kv = {
  zrange: jest.fn().mockResolvedValue([]),
  zadd: jest.fn().mockResolvedValue(1),
  zcount: jest.fn().mockResolvedValue(0),
  zcard: jest.fn().mockResolvedValue(0),
  zremrangebyrank: jest.fn().mockResolvedValue(0),
  get: jest.fn(async (key) => store.get(key) || null),
  set: jest.fn(async (key, value) => {
    store.set(key, value);
    return 'OK';
  }),
  incr: jest.fn(async (key) => {
    const current = store.get(key) || 0;
    const next = current + 1;
    store.set(key, next);
    return next;
  }),
  expire: jest.fn().mockResolvedValue(1),
  __store: store
};

module.exports = { kv };
