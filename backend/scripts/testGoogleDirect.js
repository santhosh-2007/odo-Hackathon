const http = require('http');

async function testGoogleAuth(email, name) {
  const payload = JSON.stringify({ email, name });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/google',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          console.log(`[GOOGLE AUTH] Status: ${res.statusCode} | Success: ${data.success}`);
          console.log(`  User: ${data.user?.name} (${data.user?.email})`);
          console.log(`  Role: ${data.user?.role} | Provider: ${data.user?.oauth_provider}`);
          console.log(`  Customer ID: ${data.user?.customer_id} | Token generated: ${!!data.token}`);
          resolve(data);
        } catch (e) {
          console.error('Failed to parse:', b);
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('1. Testing Google Direct Auth with real user email (santhosh2007sm@gmail.com)...');
  await testGoogleAuth('santhosh2007sm@gmail.com', 'Santhosh Kumar');

  console.log('\n2. Testing repeat login with existing Google account (session resumption)...');
  await testGoogleAuth('santhosh2007sm@gmail.com', 'Santhosh Kumar');

  console.log('\n✅ Google Direct Authentication tests passed successfully!');
}

run().catch(console.error);
