#!/usr/bin/env node

/**
 * Full Data Migration Script: AWS RDS → Dokploy MySQL
 * Run this from API container: node run-migration.js
 */

const mysql = require('mysql2/promise');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

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

const DUMP_FILE = '/tmp/aws_dump.sql';

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

async function exportData() {
  console.log('\n📦 Step 1: Exporting data from AWS RDS...');
  console.log('  This may take several minutes depending on data size...');
  
  const command = `mysqldump -h "${SOURCE_CONFIG.host}" -P ${SOURCE_CONFIG.port} -u "${SOURCE_CONFIG.user}" -p"${SOURCE_CONFIG.password}" ` +
    `--single-transaction --routines --triggers --events --no-create-db --skip-add-drop-table --skip-lock-tables ` +
    `"${SOURCE_CONFIG.database}" > "${DUMP_FILE}"`;

  try {
    await execAsync(command);
    const stats = fs.statSync(DUMP_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Data exported successfully (${sizeMB} MB)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to export data:', error.message);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function importData() {
  console.log('\n📥 Step 2: Importing data to Dokploy MySQL...');
  console.log('  This may take several minutes depending on data size...');
  
  // Disable foreign key checks
  try {
    const conn = await mysql.createConnection(TARGET_CONFIG);
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await conn.end();
  } catch (error) {
    console.warn('⚠️  Could not disable foreign key checks:', error.message);
  }

  const command = `mysql -h "${TARGET_CONFIG.host}" -P ${TARGET_CONFIG.port} -u "${TARGET_CONFIG.user}" -p"${TARGET_CONFIG.password}" ` +
    `"${TARGET_CONFIG.database}" < "${DUMP_FILE}"`;

  try {
    await execAsync(command);
    console.log('✅ Data imported successfully');
    
    // Re-enable foreign key checks
    try {
      const conn = await mysql.createConnection(TARGET_CONFIG);
      await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
      await conn.end();
    } catch (error) {
      console.warn('⚠️  Could not re-enable foreign key checks:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to import data:', error.message);
    if (error.stderr) console.error(error.stderr);
    
    // Try to re-enable foreign key checks even on error
    try {
      const conn = await mysql.createConnection(TARGET_CONFIG);
      await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
      await conn.end();
    } catch (e) {
      // Ignore
    }
    
    return false;
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
        console.log(`    ⚠️  ${table}: Error checking count`);
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
  try {
    if (fs.existsSync(DUMP_FILE)) {
      fs.unlinkSync(DUMP_FILE);
      console.log('✅ Temporary files removed');
    }
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
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

  // Export data
  const exportOk = await exportData();
  if (!exportOk) {
    process.exit(1);
  }

  // Import data
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
