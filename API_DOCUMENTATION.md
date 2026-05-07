# VOID RIFT - API Documentation

## Overview

VOID RIFT uses Vercel Serverless Functions for backend API endpoints. All endpoints are located in the `api/` directory.

## Base URL

- **Production**: `https://your-app.vercel.app/api`
- **Development**: `http://localhost:5173/api` (requires `vercel dev`)

## Authentication

Most endpoints require authentication via session token:

```javascript
// Include in request headers or body
{
  "userId": "user123",
  "token": "session_token_here"
}
```

## Endpoints

### Health Check

**GET** `/api/health`

Check if the backend is online.

**Response**:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 3600
}
```

---

### Leaderboard

#### Submit Score

**POST** `/api/leaderboard`

Submit a score to the global leaderboard.

**Request Body**:
```json
{
  "username": "player1",
  "score": 50000,
  "level": 25,
  "difficulty": "hard",
  "timestamp": 1234567890,
  "userId": "user123",
  "token": "session_token" // Optional for authenticated users
}
```

**Response**:
```json
{
  "success": true,
  "rank": 42,
  "message": "Score submitted successfully"
}
```

**Rate Limits**:
- Authenticated: 5 submissions/minute
- Anonymous: 2 submissions/minute

**Validation**:
- Score must be ≤ 2,000,000
- Level must be ≤ 300
- Score/level ratio must be realistic (≤ 25,000 points/level)
- Timestamp within 5 minutes of server time

#### Get Leaderboard

**GET** `/api/leaderboard?difficulty=hard&limit=100`

Retrieve the global leaderboard.

**Query Parameters**:
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)
- `limit` (optional): Number of entries (default: 100, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "entries": [
    {
      "username": "player1",
      "score": 75000,
      "level": 30,
      "difficulty": "hard",
      "rank": 1,
      "timestamp": 1234567890
    }
  ],
  "total": 150
}
```

---

### Users

#### Register

**POST** `/api/users?action=register`

Register a new user account.

**Request Body**:
```json
{
  "username": "newplayer",
  "password": "hashed_password_pbkdf2",
  "email": "player@example.com" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "userId": "user_abc123",
  "token": "session_token_xyz",
  "user": {
    "username": "newplayer",
    "profile": {
      "level": 1,
      "xp": 0,
      "gamesPlayed": 0
    }
  }
}
```

**Validation**:
- Username: 3-20 characters, alphanumeric + underscore/dash
- Password: Pre-hashed with PBKDF2 (see Security section)

#### Login

**POST** `/api/users?action=login`

Login to an existing account.

**Request Body**:
```json
{
  "username": "player1",
  "password": "hashed_password_pbkdf2"
}
```

**Response**: Same as registration

#### Get Profile

**GET** `/api/users?action=profile&userId=user123&token=session_token`

Get user profile information.

**Response**:
```json
{
  "success": true,
  "user": {
    "username": "player1",
    "profile": {
      "level": 15,
      "xp": 1500,
      "gamesPlayed": 42,
      "totalScore": 500000,
      "highScore": 75000
    },
    "stats": {
      "kills": 1234,
      "deaths": 56,
      "playTime": 36000
    }
  }
}
```

#### Update Stats

**POST** `/api/users?action=stats`

Update user game statistics after a game.

**Request Body**:
```json
{
  "userId": "user123",
  "token": "session_token",
  "score": 50000,
  "level": 25,
  "kills": 150,
  "deaths": 3,
  "duration": 600
}
```

**Response**:
```json
{
  "success": true,
  "xpGain": 5000,
  "levelUp": true,
  "profile": {
    "level": 16,
    "xp": 6500
  },
  "stats": {
    "kills": 1384,
    "deaths": 59,
    "playTime": 36600
  }
}
```

---

### Friends

#### Send Friend Request

**POST** `/api/friends?action=add`

Send a friend request to another user.

**Request Body**:
```json
{
  "userId": "user123",
  "token": "session_token",
  "targetUsername": "friend456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Friend request sent"
}
```

#### Accept Friend Request

**POST** `/api/friends?action=accept`

Accept a pending friend request.

**Request Body**:
```json
{
  "userId": "user123",
  "token": "session_token",
  "requestId": "req_xyz789"
}
```

#### Get Friends List

**GET** `/api/friends?userId=user123&token=session_token`

Get user's friends list.

**Response**:
```json
{
  "success": true,
  "friends": [
    {
      "userId": "friend456",
      "username": "buddy",
      "level": 20,
      "lastOnline": 1234567890
    }
  ]
}
```

---

### Activity

#### Post Activity

**POST** `/api/activity`

Post a new activity to the feed.

**Request Body**:
```json
{
  "userId": "user123",
  "token": "session_token",
  "type": "achievement",
  "data": {
    "achievementName": "First Blood",
    "description": "Got first kill"
  }
}
```

#### Get Activity Feed

**GET** `/api/activity?userId=user123&token=session_token&limit=20`

Get recent activity from friends.

**Response**:
```json
{
  "success": true,
  "activities": [
    {
      "id": "act_123",
      "userId": "friend456",
      "username": "buddy",
      "type": "highscore",
      "data": {
        "score": 75000,
        "level": 30
      },
      "timestamp": 1234567890
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired session token
- `INVALID_INPUT` - Invalid request parameters
- `RATE_LIMIT` - Too many requests
- `USER_NOT_FOUND` - User does not exist
- `USERNAME_TAKEN` - Username already in use
- `INVALID_SCORE` - Score validation failed
- `SERVER_ERROR` - Internal server error

---

## Security

### Password Hashing

**Client-Side**:
1. User enters password
2. Hash with PBKDF2 (100,000 iterations, SHA-256)
3. Use username as salt
4. Send hash to server

**Example** (using `src/utils/crypto.js`):
```javascript
import { hashPassword } from './src/utils/crypto.js';

const hashedPassword = await hashPassword(password, username);
// Send hashedPassword to API
```

**Server-Side**:
- Re-hash with bcrypt/argon2 (TODO)
- Store final hash in database
- Never store plain text passwords

### Anti-Cheat Measures

**Score Validation**:
1. Score must be ≤ MAX_SCORE (2,000,000)
2. Level must be ≤ MAX_LEVEL (300)
3. Score/level ratio ≤ 25,000 points/level
4. Timestamp within 5 minutes of server time
5. Suspicious scores flagged for manual review

**Rate Limiting**:
- Per-user and per-IP rate limits
- Exponential backoff for repeated violations

**Session Management**:
- Tokens expire after inactivity
- One active session per user
- Logout invalidates token

---

## Data Storage

### Vercel KV (Redis)

**Used For**:
- User accounts and sessions
- Leaderboard scores (sorted sets)
- Friend relationships
- Activity feed

**Fallback**:
- File-based storage in `os.tmpdir()` when KV unavailable
- Temporary storage (not persistent across deployments)

### Data Schemas

**User**:
```
kv:users:{userId} = {
  username, passwordHash, email,
  profile: { level, xp, gamesPlayed, totalScore, highScore },
  stats: { kills, deaths, playTime }
}
```

**Leaderboard**:
```
kv:leaderboard:{difficulty} = sorted set by score
  member: {userId}:{username}:{timestamp}
  score: {score}
```

**Session**:
```
kv:session:{token} = { userId, username, createdAt }
  expires: 24 hours
```

---

## Testing

### Running API Tests

```bash
npm test -- leaderboard-api.test.js
```

### Mocking Vercel KV

Create `__mocks__/@vercel/kv.js`:
```javascript
module.exports = {
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn()
  }
};
```

### Example Test

```javascript
jest.mock('@vercel/kv');
const handler = require('./api/leaderboard');

test('rejects invalid scores', async () => {
  const req = { method: 'POST', body: { score: 9999999999 } };
  const res = createMockResponse();
  
  await handler(req, res);
  
  expect(res.statusCode).toBe(400);
  expect(res.body).toContain('invalid score');
});
```

---

## Rate Limiting Details

### Implementation

```javascript
const rateLimitCache = new Map();

function checkRateLimit(userId, isAuthenticated) {
  const limit = isAuthenticated ? 5 : 2;
  const window = 60000; // 1 minute
  
  const now = Date.now();
  const userRequests = rateLimitCache.get(userId) || [];
  
  // Remove old requests
  const recentRequests = userRequests.filter(t => now - t < window);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limited
  }
  
  recentRequests.push(now);
  rateLimitCache.set(userId, recentRequests);
  return true;
}
```

### Cleanup

Rate limit cache is cleaned up:
- Automatically after 1 minute per entry
- On serverless function cold start (cache resets)

---

## CORS Configuration

CORS is configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" }
      ]
    }
  ]
}
```

---

## Environment Variables

Required for production:

- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV authentication token

Optional:

- `NODE_ENV` - Environment (production/development)
- `LOG_LEVEL` - Logging verbosity

---

**Last Updated**: 2026-02-14
**API Version**: 1.0
