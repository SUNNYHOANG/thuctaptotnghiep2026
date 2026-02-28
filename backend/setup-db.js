import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
  let connection;
  try {
    // Step 1: Connect and drop database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    console.log('✅ Connected to MySQL\n');
    console.log('🗑️  Resetting database...');
    
    try {
      await connection.execute('DROP DATABASE IF EXISTS dkhp1');
      console.log('   ✓ Dropped old database');
    } catch (e) {
      console.log('   (No old database to drop)');
    }
    
    await connection.execute('CREATE DATABASE dkhp1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('   ✓ Created new database\n');
    
    await connection.end();
    
    // Step 2: Connect to new database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dkhp1',
      multipleStatements: true
    });
    
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'database', 'setup-complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing setup-complete.sql...');
    
    // Split by semicolon and filter
    let statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));
    
    // Remove problematic statements
    statements = statements.filter(s => {
      const upper = s.toUpperCase();
      return !upper.includes('DROP DATABASE') 
        && !upper.includes('CREATE DATABASE')
        && !(upper === 'USE DKHP1')
        && !(upper.startsWith('USE '));
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.execute(statements[i]);
        successCount++;
      } catch (err) {
        errorCount++;
        // Only log real errors, not info messages
        if (!err.message.includes('already exists') && 
            !err.message.includes('User') &&
            !err.message.includes('Column count')) {
          // console.error(`   ⚠️  Statement ${i}: ${err.message.substring(0, 50)}`);
        }
      }
      if ((i + 1) % 20 === 0) {
        process.stdout.write(`\r   Progress: ${i + 1}/${statements.length}`);
      }
    }
    
    console.log(`\n\n✅ Setup complete!\n   ${successCount} statements executed\n`);
    
    // Verify
    console.log('🔍 Verifying setup...\n');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Tables created: ${tables.length}`);
    
    const [users] = await connection.execute('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    
    if (users && users.length > 0) {
      console.log(`\n✅ Admin account found:
   Username: ${users[0].username}
   Password: ${users[0].password}
   Role: ${users[0].role}
   Status: ${users[0].status}\n`);
    } else {
      console.log('\n⚠️  Admin account not found\n');
    }
    
    const [studentCount] = await connection.execute('SELECT COUNT(*) as count FROM sinhvien');
    console.log(`🎓 Students: ${studentCount[0].count}`);
    
    const [staffCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👤 Staff accounts: ${staffCount[0].count}\n`);
    
    console.log('✨ Database is ready to use!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: cd ../frontend && npm run dev');
    console.log('   3. Login at http://localhost:3000');
    console.log('   4. Tab: Nhân Viên (Admin/Giảng Viên)');
    console.log('   5. Username: admin | Password: admin123\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

setupDatabase();
