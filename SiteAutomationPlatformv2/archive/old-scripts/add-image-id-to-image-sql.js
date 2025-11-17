import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2',
};

async function addImageIdField() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    // Check if image_id column exists in image_sql
    console.log('\n📊 Checking image_sql table structure...');
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM image_sql`
    );

    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    const hasImageId = columns.some(col => col.Field === 'image_id');

    if (!hasImageId) {
      console.log('\n⚠️  image_id column is missing! Adding it...');

      // Add image_id column after id
      await connection.execute(`
        ALTER TABLE image_sql
        ADD COLUMN image_id VARCHAR(50) DEFAULT NULL AFTER id
      `);
      console.log('✅ Added image_id column');

      // Add index for faster queries
      await connection.execute(`
        CREATE INDEX idx_image_id ON image_sql(image_id)
      `);
      console.log('✅ Created index on image_id');

      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n✅ image_id column already exists - no migration needed');
    }

    // Show final structure
    console.log('\n📊 Final table structure:');
    const [finalColumns] = await connection.execute(
      `SHOW COLUMNS FROM image_sql`
    );
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

addImageIdField();
