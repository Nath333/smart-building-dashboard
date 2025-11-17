/**
 * Database Operations Logger
 * Provides detailed logging for normalized database operations
 */

class DatabaseLogger {
  /**
   * Log database query execution
   */
  logQuery(operation, table, siteName, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 DB Query: ${operation} on ${table} for site "${siteName}"`, details);
  }

  /**
   * Log successful database operation
   */
  logSuccess(operation, table, siteName, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ DB Success: ${operation} on ${table} for site "${siteName}"`, details);
  }

  /**
   * Log database error
   */
  logError(operation, table, siteName, error, details = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ DB Error: ${operation} on ${table} for site "${siteName}"`);
    console.error(`  Error: ${error.message}`);
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  SQL State: ${error.sqlState || 'N/A'}`);
    if (Object.keys(details).length > 0) {
      console.error(`  Details:`, details);
    }
    if (error.stack) {
      console.error(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
  }

  /**
   * Log adapter conversion
   */
  logConversion(direction, siteName, recordCount = null) {
    const timestamp = new Date().toISOString();
    const arrow = direction === 'toFlat' ? '📤' : '📥';
    const msg = direction === 'toFlat'
      ? `Converting FROM normalized TO flat structure`
      : `Converting FROM flat TO normalized structure`;

    console.log(`[${timestamp}] ${arrow} Adapter: ${msg} for site "${siteName}"`);
    if (recordCount !== null) {
      console.log(`  Records processed: ${recordCount}`);
    }
  }

  /**
   * Log data save operation summary
   */
  logSaveSummary(siteName, tables, rowsAffected) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💾 Save Summary for site "${siteName}":`);
    console.log(`  Tables updated: ${tables.length}`);
    tables.forEach(table => {
      const rows = rowsAffected[table] || 0;
      console.log(`    - ${table}: ${rows} row(s) affected`);
    });
  }

  /**
   * Log fetch operation summary
   */
  logFetchSummary(siteName, tables, recordCounts) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📥 Fetch Summary for site "${siteName}":`);
    console.log(`  Tables queried: ${tables.length}`);
    tables.forEach(table => {
      const count = recordCounts[table] || 0;
      console.log(`    - ${table}: ${count} record(s) found`);
    });
  }

  /**
   * Log dual-write operation
   */
  logDualWrite(siteName, legacySuccess, normalizedSuccess) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 Dual-Write for site "${siteName}":`);
    console.log(`  Legacy form_sql: ${legacySuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Normalized tables: ${normalizedSuccess ? '✅ Success' : '❌ Failed'}`);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, siteName, durationMs, details = {}) {
    const timestamp = new Date().toISOString();
    const emoji = durationMs < 100 ? '⚡' : durationMs < 500 ? '✓' : '⚠️';
    console.log(`[${timestamp}] ${emoji} Performance: ${operation} for "${siteName}" took ${durationMs}ms`, details);
  }

  /**
   * Log migration event
   */
  logMigration(event, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔧 Migration: ${event}`, details);
  }

  /**
   * Create a timer for performance tracking
   */
  startTimer() {
    return Date.now();
  }

  /**
   * End timer and return duration
   */
  endTimer(startTime) {
    return Date.now() - startTime;
  }
}

export default new DatabaseLogger();
