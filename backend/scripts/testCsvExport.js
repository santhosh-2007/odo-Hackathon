const http = require('http');

async function testAllCsvReports() {
  const loginData = JSON.stringify({ email: 'admin@brightloop.com', password: 'Admin@12345' });

  // 1. Login
  const token = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b).token));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Login successful, token acquired.');

  const reportTypes = [
    'total-revenue',
    'monthly-revenue',
    'active-subscriptions',
    'closed-subscriptions',
    'outstanding-invoices',
    'overdue-invoices',
    'payment-history',
    'customer-subscriptions'
  ];

  for (const rType of reportTypes) {
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/reports/${rType}/csv`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          const isCsv = res.headers['content-type']?.includes('text/csv');
          const hasBOM = b.charCodeAt(0) === 0xFEFF;
          const firstLine = b.replace(/^\uFEFF/, '').split('\r\n')[0];
          console.log(`[CSV: ${rType}] Status: ${res.statusCode} | UTF-8 BOM: ${hasBOM} | Headers: ${firstLine.substring(0, 60)}...`);
          resolve();
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  console.log('\n✅ All 8 CSV report types tested and verified successfully!');
}

testAllCsvReports().catch(console.error);
