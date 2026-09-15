import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  console.log('[Migration] Starting database migration...');
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('[Migration] Successfully executed database/schema.sql');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Migration Error] Failed to execute migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// If run directly via node CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Aborted:', err.message);
      process.exit(1);
    });
}
