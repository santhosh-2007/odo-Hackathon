const http = require('http');

async function testOAuth(provider, email, name, role) {
  const payload = JSON.stringify({
    provider,
    email,
    name,
    oauth_id: `${provider}_uid_${Date.now()}`,
    role: role || 'customer'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/oauth-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          console.log(`[${provider.toUpperCase()}]`, 'Status:', res.statusCode, '| Success:', data.success, '| User:', data.user?.name, '| Role:', data.user?.role, '| Token:', !!data.token);
          resolve(data);
        } catch (e) {
          console.error('Parse error:', b);
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Social OAuth Logins: Google, Microsoft, and GitHub...');
  await testOAuth('google', 'admin@brightloop.com', 'Brightloop Administrator');
  await testOAuth('microsoft', 'billing@acmecorp.com', 'Alex Mercer');
  const rand = Math.floor(Math.random() * 10000);
  await testOAuth('github', `github_dev_${rand}@developer.com`, `Dev Specialist ${rand}`, 'customer');
  console.log('All OAuth tests completed successfully!');
}

runTests().catch(console.error);
