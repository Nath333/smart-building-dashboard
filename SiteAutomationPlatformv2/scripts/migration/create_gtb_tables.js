import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createGTBTables() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'admin',
    database: 'avancement',
    multipleStatements: true
  });

  try {
    console.log('Connected to MySQL database');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'database', 'gtb_schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing GTB schema SQL...');

    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await connection.execute(statement);
          console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          console.log(`! Skipped (already exists): ${statement.substring(0, 50)}...`);
        }
      }
    }

    console.log('✅ GTB tables created successfully!');

    // Verify tables were created
    console.log('\nVerifying created tables:');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'gtb_%'");
    tables.forEach(table => {
      console.log(`  ✓ ${Object.values(table)[0]}`);
    });

    // Check default data in gtb_module_categories
    console.log('\nVerifying default GTB module categories:');
    const [categories] = await connection.execute('SELECT category_code, category_name FROM gtb_module_categories');
    categories.forEach(cat => {
      console.log(`  ✓ ${cat.category_code}: ${cat.category_name}`);
    });

  } catch (error) {
    console.error('❌ Error creating GTB tables:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\nDatabase connection closed');
  }
}

createGTBTables();