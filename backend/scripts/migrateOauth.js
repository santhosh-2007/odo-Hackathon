const { query } = require('../config/db');

async function migrate() {
  try {
    const cols = await query("SHOW COLUMNS FROM users LIKE 'oauth_provider'");
    if (cols.length === 0) {
      await query("ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50) NULL AFTER phone");
      console.log('Added oauth_provider column');
    }
    const cols2 = await query("SHOW COLUMNS FROM users LIKE 'oauth_id'");
    if (cols2.length === 0) {
      await query("ALTER TABLE users ADD COLUMN oauth_id VARCHAR(191) NULL AFTER oauth_provider");
      console.log('Added oauth_id column');
    }
    const cols3 = await query("SHOW COLUMNS FROM users LIKE 'avatar_url'");
    if (cols3.length === 0) {
      await query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL AFTER oauth_id");
      console.log('Added avatar_url column');
    }
    await query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL");
    console.log('Modified password_hash to be nullable');
    console.log('OAuth migration finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
