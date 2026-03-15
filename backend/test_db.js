const db = require('./config/db');
require('dotenv').config();

async function test() {
  try {
    // Test basic connection
    const [rows] = await db.query('SELECT 1 as test');
    console.log('Connection OK:', rows);

    // Test pitches table
    const [pitches] = await db.query('SELECT * FROM pitches');
    console.log('Pitches count:', pitches.length);
    pitches.forEach(p => console.log(' -', p.name, '|', p.price_per_hour));

    // Test users table structure
    const [cols] = await db.query('SHOW COLUMNS FROM users');
    console.log('Users columns:', cols.map(c => c.Field).join(', '));

    // Test insert user
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update('test123').digest('hex');
    try {
      const [result] = await db.query(
        'INSERT INTO users (username, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
        ['testuser_check', hash, 'Test User', '0123456789']
      );
      console.log('Insert user OK, id:', result.insertId);
      // Clean up
      await db.query('DELETE FROM users WHERE id = ?', [result.insertId]);
      console.log('Cleanup OK');
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log('Test user already exists, thats fine');
      } else {
        throw e;
      }
    }

    console.log('\nAll tests passed!');
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Code:', err.code);
  }
  process.exit(0);
}

test();
