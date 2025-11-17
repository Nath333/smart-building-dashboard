/**
 * Database Migration Runner
 * Adds image_id column to visual_positions table
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'avancement2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runMigration() {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    console.log('\n📋 Running migration steps...\n');

    // Step 1: Add image_id column
    try {
      console.log('Step 1: Adding image_id column...');
      await connection.execute(`
        ALTER TABLE visual_positions
        ADD COLUMN image_id VARCHAR(50) DEFAULT NULL AFTER page_type
      `);
      console.log('✅ Step 1 complete: image_id column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Step 1 skipped: image_id column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Create index
    try {
      console.log('\nStep 2: Creating index on image_id...');
      await connection.execute(`
        CREATE INDEX idx_image_id ON visual_positions(image_id)
      `);
      console.log('✅ Step 2 complete: Index created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Step 2 skipped: Index already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Drop old unique constraint
    try {
      console.log('\nStep 3: Dropping old unique constraint...');
      await connection.execute(`
        ALTER TABLE visual_positions
        DROP INDEX unique_position
      `);
      console.log('✅ Step 3 complete: Old constraint dropped');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  Step 3 skipped: Constraint already dropped or does not exist');
      } else {
        throw error;
      }
    }

    // Step 4: Add new unique constraint
    try {
      console.log('\nStep 4: Adding new unique constraint...');
      await connection.execute(`
        ALTER TABLE visual_positions
        ADD UNIQUE KEY unique_position (site_name, page_type, image_id, element_id)
      `);
      console.log('✅ Step 4 complete: New constraint added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Step 4 skipped: Constraint already exists');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✨ Multi-image feature is now ready to use.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
