import pool from './config/database.js';

async function checkTables() {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📊 Tables in database dkhp1:');
    console.log(tables);
    
    if (tables.length === 0) {
      console.log('\n❌ No tables found! Database needs to be setup.');
      console.log('\n💡 Solution: Run setup-complete.sql');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit();
}

checkTables();
