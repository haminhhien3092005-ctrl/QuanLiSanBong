const db = require('./config/db');

async function run() {
    try {
        await db.query("ALTER TABLE pitches ADD COLUMN address VARCHAR(255) DEFAULT '' AFTER description");
        console.log('OK: Column address added to pitches');
    } catch (e) {
        console.log('Error:', e.message);
    }
    process.exit();
}
run();
