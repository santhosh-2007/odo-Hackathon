const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedDb() {
  console.log('Connecting to MySQL Server to seed database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'brightloop_sms',
    multipleStatements: true
  });

  try {
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql...');
    await connection.query(seedSql);
    console.log('Database seeded successfully with Brightloop Software data!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedDb();
}

module.exports = seedDb;
