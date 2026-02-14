// Use manual mock from __mocks__/@vercel/kv.js
jest.mock('@vercel/kv');

const handler = require('./api/leaderboard');
const { kv } = require('@vercel/kv');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    }
  };
}

describe('leaderboard API security', () => {
  beforeEach(() => {
    kv.__store.clear();
  });

  test('rejects unauthenticated submissions', async () => {
    const req = {
      method: 'POST',
      headers: {},
      body: { username: 'anon', score: 100, level: 1, difficulty: 'normal' },
      query: {}
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects implausible high scores even when authenticated', async () => {
    const token = 'valid-token';
    kv.__store.set(`session:${token}`, {
      token,
      userId: 'u_1',
      username: 'pilot',
      expiresAt: Date.now() + 60_000
    });

    const req = {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: { username: 'pilot', userId: 'u_1', score: 9_999_999_999, level: 1, difficulty: 'normal' },
      query: {}
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/score/i);
  });
});
