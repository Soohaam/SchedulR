const fs = require('fs');
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

const migrate = async () => {
  const client = await pool.connect();

  try {
    // 1. Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "appliedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Get list of applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT "name" FROM "_migrations"'
    );
    const appliedMigrationNames = new Set(appliedMigrations.map((m) => m.name));

    // 3. Get list of migration files
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Ensure they run in order

    // 4. Run pending migrations
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.has(file)) {
        console.log(`Running migration: ${file}`);
        
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO "_migrations" ("name") VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✅ Applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to apply ${file}:`, err.message);
          process.exit(1);
        }
      }
    }

    console.log('✨ All migrations applied successfully.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end(); // Close the pool to exit the script
  }
};

migrate();
