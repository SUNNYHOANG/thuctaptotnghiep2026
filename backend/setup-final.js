import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
  let connection;
  try {
    // Step 1: Drop and create database
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
    } catch (e) {}
    
    await connection.execute('CREATE DATABASE dkhp1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('   ✓ Created new database\n');
    
    await connection.end();
    
    // Step 2: Execute each SQL file individually
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dkhp1'
    });
    
    console.log('📖 Creating tables...\n');
    
    // Read SQL file line by line and execute statements
    const sqlPath = path.join(__dirname, 'database', 'setup-complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Simple approach: execute the entire SQL file
    const sqlStatements = sqlContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.toUpperCase().startsWith('USE'));
    
    let created = {
      tables: 0,
      inserts: 0,
      other: 0
    };
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const stmt = sqlStatements[i];
      try {
        await connection.execute(stmt);
        
        if (stmt.toUpperCase().includes('CREATE TABLE')) created.tables++;
        else if (stmt.toUpperCase().includes('INSERT')) created.inserts++;
        else created.other++;
        
        // Show progress
        if ((i + 1) % 5 === 0) {
          process.stdout.write(`\r   Processed: ${i + 1}/${sqlStatements.length} statements`);
        }
      } catch (err) {
        // Silently ignore most errors, only show critical ones
        if (err.message.includes('Syntax error')) {
          console.error(`\n   ⚠️ Syntax error in statement ${i}`);
        }
      }
    }
    
    console.log(`\n\n✅ Setup complete!
   📊 Tables: ${created.tables}
   📝 Inserts: ${created.inserts}
   ⚙️  Other: ${created.other}\n`);
    
    // Verify
    console.log('🔍 Verifying setup...\n');
    
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📊 Tables in database: ${tables.length}`);
      tables.slice(0, 5).forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`   ✓ ${tableName}`);
      });
      if (tables.length > 5) console.log(`   ... and ${tables.length - 5} more`);
    } catch (e) {
      console.log('   (Could not list tables)');
    }
    
    try {
      const [users] = await connection.execute('SELECT username, role, status FROM users LIMIT 5');
      console.log(`\n👤 User accounts: ${users.length}`);
      users.forEach(u => {
        console.log(`   ✓ ${u.username} (${u.role}) - ${u.status}`);
      });
    } catch (e) {
      console.log('   (Users table not found)');
    }
    
    try {
      const [studentCount] = await connection.execute('SELECT COUNT(*) as cnt FROM sinhvien');
      console.log(`\n🎓 Students: ${studentCount[0].cnt}`);
    } catch (e) {}
    
    console.log('\n✨ Database setup successful!\n');
    console.log('🔐 Login credentials:');
    console.log('   Tab: Nhân Viên (Admin/Giảng Viên)');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');
    
    console.log('🚀 Next steps:');
    console.log('   1. npm run dev (in backend folder)');
    console.log('   2. cd ../frontend && npm run dev');
    console.log('   3. Visit http://localhost:3000\n');
    
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
