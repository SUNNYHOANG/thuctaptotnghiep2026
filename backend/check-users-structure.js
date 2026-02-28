import pool from './config/database.js';

async function checkUsersTable() {
  try {
    const [columns] = await pool.execute("DESCRIBE users");
    console.log('📋 Columns in users table:');
    console.log(columns);
    
    console.log('\n🔍 Checking for data:');
    const [rows] = await pool.execute('SELECT * FROM users');
    console.log('Total records:', rows.length);
    if (rows.length > 0) {
      console.log('First record:', rows[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit();
}

checkUsersTable();
