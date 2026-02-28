import pool from './backend/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Run SQL files in order
    const sqlFiles = [
      'backend/database/schema.sql',
      'backend/database/00_base_tables.sql',
      'backend/database/01_course_tables.sql',
      'backend/database/02_grades_and_student_affairs.sql',
      'backend/database/03_dichvu_and_thongbao.sql'
    ];

    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skip ${file} (not found)`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`📄 Running ${file}...`);
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.execute(statement);
          } catch (err) {
            // Ignore if already exists
            if (!err.message.includes('already exists')) {
              console.error(`  Error: ${err.message}`);
            }
          }
        }
      }
    }
    
    console.log('✅ Database setup complete!');
    
    // Verify loai_dichvu
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM loai_dichvu');
    console.log(`📊 Total service types in database: ${rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupDatabase();
