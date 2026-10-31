const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
  console.log('Connecting to MySQL Server to initialize database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing schema:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
