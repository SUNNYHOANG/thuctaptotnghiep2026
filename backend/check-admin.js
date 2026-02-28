import pool from './config/database.js';

async function checkAdmin() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    console.log('👤 Admin Account Found:');
    console.log(rows);
    
    if (rows.length === 0) {
      console.log('❌ Admin account not found in database!');
    } else {
      console.log('✅ Admin account exists');
      console.log('   Username:', rows[0].username);
      console.log('   Password:', rows[0].password);
      console.log('   Role:', rows[0].role);
      console.log('   Status:', rows[0].status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit();
}

checkAdmin();
