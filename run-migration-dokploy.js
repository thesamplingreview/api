#!/usr/bin/env node

/**
 * Run Sequelize Migration using Dokploy Database Connection
 * 
 * This script runs the delivery_address migration using Dokploy MySQL connection
 * 
 * Usage: node run-migration-dokploy.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Dokploy MySQL configuration
// Supports both external port (for local run) and internal (for container run)
const DOKPLOY_SERVER_IP = process.env.DOKPLOY_SERVER_IP || '72.62.199.19';
const EXTERNAL_PORT = parseInt(process.env.DOKPLOY_DB_PORT) || 3307;
const INTERNAL_HOST = process.env.DOKPLOY_DB_HOST_INTERNAL || 'mysql-samplingreview-sj2xam';

// Try internal first (if running from Dokploy container), then external
const DB_CONFIG = {
  host: process.env.DB_HOST || process.env.DOKPLOY_DB_HOST || INTERNAL_HOST,
  port: parseInt(process.env.DB_PORT) || parseInt(process.env.DOKPLOY_DB_PORT) || 3306,
  database: process.env.DB_DATABASE || process.env.DOKPLOY_DB_DATABASE || 'samplingreview',
  user: process.env.DB_USERNAME || process.env.DOKPLOY_DB_USERNAME || 'samplingreview_user',
  password: process.env.DB_PASSWORD || process.env.DOKPLOY_DB_PASSWORD || '9fc97ac06e9daa88c8695e0a71580f6c',
  connectTimeout: 60000,
  multipleStatements: true,
};

// Migration SQL
const MIGRATION_SQL = `
ALTER TABLE \`users\` 
ADD COLUMN \`delivery_address\` JSON NULL 
AFTER \`contact_verified_at\`;
`;

async function testConnection() {
  try {
    console.log('\n🔍 Testing Dokploy MySQL connection...');
    console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   User: ${DB_CONFIG.user}`);
    
    const connection = await mysql.createConnection(DB_CONFIG);
    const [result] = await connection.execute('SELECT 1 as test, DATABASE() as db, USER() as user');
    await connection.end();
    
    console.log(`✅ Connection successful`);
    console.log(`   Connected to: ${result[0].db} as ${result[0].user}`);
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n💡 Connection refused. Try:`);
      console.error(`   1. Use external port: DOKPLOY_DB_HOST=72.62.199.19 DOKPLOY_DB_PORT=3307 node run-migration-dokploy.js`);
      console.error(`   2. Or run from Dokploy API container terminal`);
    }
    return false;
  }
}

async function checkColumnExists(connection) {
  try {
    const [rows] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'delivery_address'
    `, [DB_CONFIG.database]);
    
    return rows.length > 0;
  } catch (error) {
    console.error(`❌ Error checking column: ${error.message}`);
    return false;
  }
}

async function runMigration() {
  console.log('\n📦 Running migration: Add delivery_address to users table...');
  
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    // Check if column already exists
    const columnExists = await checkColumnExists(connection);
    
    if (columnExists) {
      console.log('✅ Column delivery_address already exists. Migration not needed.');
      await connection.end();
      return true;
    }
    
    // Run migration
    console.log('   Executing ALTER TABLE statement...');
    await connection.execute(MIGRATION_SQL);
    
    // Verify migration
    const columnExistsAfter = await checkColumnExists(connection);
    
    if (columnExistsAfter) {
      console.log('✅ Migration completed successfully!');
      console.log('   Column delivery_address added to users table');
      
      // Show table structure
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'delivery_address'
      `, [DB_CONFIG.database]);
      
      if (columns.length > 0) {
        console.log(`\n   Column details:`);
        console.log(`   - Name: ${columns[0].COLUMN_NAME}`);
        console.log(`   - Type: ${columns[0].DATA_TYPE}`);
        console.log(`   - Nullable: ${columns[0].IS_NULLABLE}`);
        console.log(`   - Full Type: ${columns[0].COLUMN_TYPE}`);
      }
      
      await connection.end();
      return true;
    } else {
      console.error('❌ Migration failed: Column was not created');
      await connection.end();
      return false;
    }
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    console.error(`   SQL Error Code: ${error.code}`);
    await connection.end();
    return false;
  }
}

async function main() {
  console.log('🚀 Dokploy Migration Runner');
  console.log('============================\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Run migration
  const success = await runMigration();
  
  if (success) {
    console.log('\n✅ All done!');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
