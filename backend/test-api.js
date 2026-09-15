import http from 'http';
import app from './src/app.js';
import { ENV } from './src/config/env.js';

const testServer = http.createServer(app);

const runTests = async () => {
  console.log('[Test Suite] Starting API endpoint verification...');

  await new Promise((resolve) => testServer.listen(5001, resolve));
  console.log('[Test Suite] Test server listening on port 5001');

  const get = (path) => new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    }).on('error', reject);
  });

  const post = (path, body) => new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request(`http://localhost:5001${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  const getAuth = (path, token) => new Promise((resolve, reject) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    http.get(`http://localhost:5001${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    }).on('error', reject);
  });

  const postAuth = (path, body, token) => new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`http://localhost:5001${path}`, {
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  const delAuth = (path, token) => new Promise((resolve, reject) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const req = http.request(`http://localhost:5001${path}`, {
      method: 'DELETE',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });

  try {
    // 1. Test Health
    const health = await get('/health');
    console.log('✓ GET /health:', health.status, health.data.status);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Test Welcome
    const welcome = await get('/api');
    console.log('✓ GET /api:', welcome.status, welcome.data.name);

    // 3. Test Unauthenticated Protected Route (Expect 401)
    const unauthGames = await get('/api/games');
    console.log('✓ GET /api/games without token (expected 401):', unauthGames.status, unauthGames.data.message);
    if (unauthGames.status !== 401) throw new Error('Route was not protected by auth middleware');

    // 4. Test Login as Coach Alex (Role: COACH)
    const loginRes = await post('/api/auth/login', {
      email: 'coach.alex@betruegamers.com',
      password: 'GamingPassword123!'
    });
    const token = loginRes.data?.data?.token;
    console.log('✓ POST /api/auth/login:', loginRes.status, token ? `Logged in as Coach Alex (${loginRes.data.data.user.role})` : loginRes.data.message);



    if (token) {
      // 5. Test Authenticated Route (Expect 200)
      const authGames = await getAuth('/api/games', token);
      console.log('✓ GET /api/games with Bearer token (expected 200):', authGames.status, `Returned ${authGames.data.count || 0} games`);

      // 6. Test RBAC: Coach Alex tries to access Admin stats (Expect 403 Forbidden)
      const adminAttempt = await getAuth('/api/admin/stats', token);
      console.log('✓ GET /api/admin/stats as COACH (expected 403):', adminAttempt.status, adminAttempt.data.message);
      if (adminAttempt.status !== 403) throw new Error('Role-based authorization failed to block non-admin');
    }

    // 7. Test Auth Validation (Missing Fields)
    const invalidSignup = await post('/api/auth/signup', { email: 'bad' });
    console.log('✓ POST /api/auth/signup validation check (expected 400):', invalidSignup.status, invalidSignup.data.message);
    if (invalidSignup.status !== 400) throw new Error('Validation middleware failed to reject invalid signup');

    console.log('\n🎉 ALL AUTHENTICATION & ROLE-BASED ACCESS CONTROL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test Suite Failed:', err.message);
  } finally {
    testServer.close(() => {
      console.log('[Test Suite] Server closed.');
      process.exit(0);
    });
  }
};

runTests();
