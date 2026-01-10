#!/usr/bin/env node

/**
 * Full Data Migration Script: AWS RDS → Dokploy MySQL
 * Run this from API container: node run-migration.js
 * Uses pure Node.js/mysql2 - no CLI tools required
 */

const mysql = require('mysql2/promise');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Source database (AWS RDS)
const SOURCE_CONFIG = {
  host: 'samplingreview.cj8w0m6oovep.ap-southeast-1.rds.amazonaws.com',
  port: 3306,
  database: 'samplingreview',
  user: 'sampling_db',
  password: 'Kl7433l!&>]a',
  connectTimeout: 60000,
};

// Target database (Dokploy) - from environment or default
const TARGET_CONFIG = {
  host: process.env.DB_HOST || 'mysql-samplingreview-sj2xam',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_DATABASE || 'samplingreview',
  user: process.env.DB_USERNAME || 'samplingreview_user',
  password: process.env.DB_PASSWORD || '9fc97ac06e9daa88c8695e0a71580f6c',
  connectTimeout: 60000,
};

async function testConnection(config, name) {
  try {
    const connection = await mysql.createConnection(config);
    await connection.execute('SELECT 1');
    await connection.end();
    console.log(`✅ ${name} connection successful`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} connection failed:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('\n📦 Step 0: Running database migrations...');
  try {
    const { stdout, stderr } = await execAsync('cd /app && npx sequelize-cli db:migrate');
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('No migrations were executed')) console.error(stderr);
    console.log('✅ Migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Migrations failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function getTableNames(connection, database) {
  const [tables] = await connection.execute(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = ? AND table_type = 'BASE TABLE' 
     ORDER BY table_name`,
    [database]
  );
  return tables.map(t => t.table_name);
}

async function migrateTable(sourceConn, targetConn, tableName) {
  console.log(`  Migrating table: ${tableName}...`);
  
  // Get row count first
  const [countResult] = await sourceConn.execute(`SELECT COUNT(*) as count FROM ??`, [tableName]);
  const rowCount = countResult[0].count;
  
  if (rowCount === 0) {
    console.log(`    ⏭️  ${tableName}: 0 rows (skipped)`);
    return { table: tableName, rows: 0 };
  }
  
  console.log(`    📊 ${tableName}: ${rowCount} rows to migrate`);
  
  // Get column names
  const [columns] = await sourceConn.execute(`SHOW COLUMNS FROM ??`, [tableName]);
  const columnNames = columns.map(c => c.Field);
  const columnList = columnNames.map(c => `\`${c}\``).join(', ');
  
  // Clear existing data in target
  await targetConn.execute(`TRUNCATE TABLE ??`, [tableName]);
  
  // Fetch and insert data in batches
  const BATCH_SIZE = 500;
  let offset = 0;
  let totalInserted = 0;
  
  while (offset < rowCount) {
    const [rows] = await sourceConn.execute(
      `SELECT * FROM ?? LIMIT ? OFFSET ?`,
      [tableName, BATCH_SIZE, offset]
    );
    
    if (rows.length === 0) break;
    
    // Build INSERT statement with values
    const placeholders = rows.map(() => `(${columnNames.map(() => '?').join(', ')})`).join(', ');
    const values = [];
    rows.forEach(row => {
      columnNames.forEach(col => {
        const value = row[col];
        values.push(value !== null && value !== undefined ? value : null);
      });
    });
    
    const insertSql = `INSERT INTO ?? (${columnList}) VALUES ${placeholders}`;
    await targetConn.execute(insertSql, [tableName, ...values]);
    
    totalInserted += rows.length;
    offset += BATCH_SIZE;
    
    if (offset % 5000 === 0 || offset >= rowCount) {
      process.stdout.write(`    Progress: ${totalInserted}/${rowCount} rows\r`);
    }
  }
  
  console.log(`    ✅ ${tableName}: ${totalInserted} rows migrated`);
  return { table: tableName, rows: totalInserted };
}

async function exportData() {
  // Placeholder - we migrate directly now
  console.log('\n📦 Step 1: Preparing data migration...');
  console.log('  Using direct database-to-database transfer (pure Node.js)');
  return true;
}

async function importData() {
  console.log('\n📥 Step 2: Migrating data from AWS RDS to Dokploy MySQL...');
  console.log('  This may take several minutes depending on data size...');
  
  let sourceConn, targetConn;
  
  try {
    // Connect to both databases
    sourceConn = await mysql.createConnection(SOURCE_CONFIG);
    targetConn = await mysql.createConnection(TARGET_CONFIG);
    
    // Disable foreign key checks on target
    await targetConn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await targetConn.execute('SET SESSION sql_mode = "NO_AUTO_VALUE_ON_ZERO"');
    console.log('  Foreign key checks disabled');
    
    // Get all tables
    const tables = await getTableNames(sourceConn, SOURCE_CONFIG.database);
    console.log(`\n  Found ${tables.length} tables to migrate`);
    
    // Migrate each table
    const results = [];
    for (const table of tables) {
      try {
        const result = await migrateTable(sourceConn, targetConn, table);
        results.push(result);
      } catch (error) {
        console.error(`    ❌ Failed to migrate ${table}:`, error.message);
        results.push({ table, rows: 0, error: error.message });
      }
    }
    
    // Re-enable foreign key checks
    await targetConn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n  Foreign key checks re-enabled');
    
    // Summary
    const totalRows = results.reduce((sum, r) => sum + (r.rows || 0), 0);
    const successful = results.filter(r => !r.error).length;
    console.log(`\n✅ Data migration completed:`);
    console.log(`   ${successful}/${tables.length} tables migrated successfully`);
    console.log(`   ${totalRows} total rows migrated`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to migrate data:', error.message);
    console.error(error.stack);
    
    // Try to re-enable foreign key checks even on error
    if (targetConn) {
      try {
        await targetConn.execute('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        // Ignore
      }
    }
    
    return false;
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

async function verifyMigration() {
  console.log('\n🔍 Step 3: Verifying migration...');
  
  try {
    const sourceConn = await mysql.createConnection(SOURCE_CONFIG);
    const targetConn = await mysql.createConnection(TARGET_CONFIG);

    // Get table counts
    const [sourceTables] = await sourceConn.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [SOURCE_CONFIG.database]
    );
    const [targetTables] = await targetConn.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [TARGET_CONFIG.database]
    );

    console.log(`  Source tables: ${sourceTables[0].count}`);
    console.log(`  Target tables: ${targetTables[0].count}`);

    // Check key table row counts
    const keyTables = ['users', 'campaigns', 'products', 'vendors', 'campaign_enrolments'];
    console.log('\n  Data row counts:');
    for (const table of keyTables) {
      try {
        const [sourceRows] = await sourceConn.execute(`SELECT COUNT(*) as count FROM ??`, [table]);
        const [targetRows] = await targetConn.execute(`SELECT COUNT(*) as count FROM ??`, [table]);
        const sourceCount = sourceRows[0].count;
        const targetCount = targetRows[0].count;
        const match = sourceCount === targetCount ? '✅' : '⚠️';
        console.log(`    ${match} ${table}: ${sourceCount} → ${targetCount}`);
      } catch (error) {
        console.log(`    ⚠️  ${table}: Error checking count (${error.message})`);
      }
    }

    // Check specific user
    const [users] = await targetConn.execute(
      `SELECT email, name, role_id FROM users WHERE email = ?`,
      ['evan@samplingreview.com']
    );
    if (users.length > 0) {
      console.log(`\n  ✅ User evan@samplingreview.com found in target database`);
    } else {
      console.log(`\n  ⚠️  User evan@samplingreview.com NOT found in target database`);
    }

    await sourceConn.end();
    await targetConn.end();

    console.log('\n✅ Migration verification completed');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function cleanup() {
  console.log('\n🧹 Step 4: Cleaning up...');
  // No temporary files to clean up with pure Node.js approach
  console.log('✅ Cleanup completed (no temporary files)');
}

async function main() {
  console.log('==========================================');
  console.log('Full Data Migration: AWS RDS → Dokploy');
  console.log('==========================================');
  console.log('\n📋 Migration Configuration:');
  console.log('--------------------------------');
  console.log('Source (AWS RDS):');
  console.log(`  Host: ${SOURCE_CONFIG.host}`);
  console.log(`  Database: ${SOURCE_CONFIG.database}`);
  console.log(`  User: ${SOURCE_CONFIG.user}`);
  console.log('\nTarget (Dokploy):');
  console.log(`  Host: ${TARGET_CONFIG.host}`);
  console.log(`  Database: ${TARGET_CONFIG.database}`);
  console.log(`  User: ${TARGET_CONFIG.user}`);

  // Test connections
  console.log('\n🔍 Testing database connections...');
  const sourceOk = await testConnection(SOURCE_CONFIG, 'Source (AWS RDS)');
  if (!sourceOk) {
    console.error('\n❌ Cannot connect to source database. Exiting.');
    process.exit(1);
  }

  const targetOk = await testConnection(TARGET_CONFIG, 'Target (Dokploy)');
  if (!targetOk) {
    console.error('\n❌ Cannot connect to target database. Exiting.');
    process.exit(1);
  }

  // Run migrations
  const migrationsOk = await runMigrations();
  if (!migrationsOk) {
    console.error('\n⚠️  Migrations had issues, but continuing...');
  }

  // Export data (placeholder)
  const exportOk = await exportData();
  if (!exportOk) {
    process.exit(1);
  }

  // Import data (actually does the migration)
  const importOk = await importData();
  if (!importOk) {
    process.exit(1);
  }

  // Verify migration
  await verifyMigration();

  // Cleanup
  await cleanup();

  console.log('\n==========================================');
  console.log('✅ Full migration completed successfully!');
  console.log('==========================================');
  console.log('\nNext steps:');
  console.log('1. Test login endpoint');
  console.log('2. Verify admin portal works');
  console.log('3. Check API logs for any errors');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
