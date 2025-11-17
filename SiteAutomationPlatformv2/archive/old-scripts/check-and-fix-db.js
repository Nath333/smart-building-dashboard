import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2',
};

async function checkAndFixDatabase() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    // Check if image_id column exists
    console.log('\n📊 Checking visual_positions table structure...');
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM visual_positions`
    );

    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    const hasImageId = columns.some(col => col.Field === 'image_id');

    if (!hasImageId) {
      console.log('\n⚠️  image_id column is missing! Applying migration...');

      // Add image_id column
      await connection.execute(`
        ALTER TABLE visual_positions
        ADD COLUMN image_id VARCHAR(50) DEFAULT NULL AFTER page_type
      `);
      console.log('✅ Added image_id column');

      // Add index
      await connection.execute(`
        CREATE INDEX idx_image_id ON visual_positions(image_id)
      `);
      console.log('✅ Created index on image_id');

      // Drop old unique constraint
      try {
        await connection.execute(`
          ALTER TABLE visual_positions
          DROP INDEX unique_position
        `);
        console.log('✅ Dropped old unique_position index');
      } catch (err) {
        console.log('⚠️  No old unique_position index to drop');
      }

      // Add new unique constraint
      await connection.execute(`
        ALTER TABLE visual_positions
        ADD UNIQUE KEY unique_position (site_name, page_type, image_id, element_id)
      `);
      console.log('✅ Added new unique constraint with image_id');

      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n✅ image_id column already exists - no migration needed');
    }

    // Show final structure
    console.log('\n📊 Final table structure:');
    const [finalColumns] = await connection.execute(
      `SHOW COLUMNS FROM visual_positions`
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

checkAndFixDatabase();
