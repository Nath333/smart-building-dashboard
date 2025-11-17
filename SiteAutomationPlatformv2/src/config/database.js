// ✅ Centralized Database Configuration
// This file provides a single source of truth for all database connections
// Change database settings here only - no need to modify multiple files

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment check - DB_NAME:', process.env.DB_NAME);
console.log('🔍 Forcing database to: avancement2');

// ✅ Database Configuration - CHANGE HERE ONLY
export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: 'avancement2', // 👈 Single point to change database - FORCED to avancement2
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🔍 Final dbConfig.database:', dbConfig.database);

// ✅ Create and export connection pool
export const db = mysql.createPool(dbConfig);

// ✅ Export helper function to get new connections if needed
export const getConnection = async () => {
  try {
    const connection = await db.getConnection();
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// ✅ Test database connection on import
(async () => {
  try {
    const connection = await db.getConnection();
    console.log(`✅ Database connected: ${dbConfig.database} @ ${dbConfig.host}`);
    console.log(`🔍 Using database from config: ${dbConfig.database}`);
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
  }
})();

export default db;
