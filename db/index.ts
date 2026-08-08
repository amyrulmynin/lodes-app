import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// If DATABASE_URL is set -> Neon PostgreSQL (production)
// Otherwise -> local SQLite file (local development, no setup needed)
function createDb(): NeonHttpDatabase<any> | BetterSQLite3Database<any> {
  if (process.env.DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { drizzle } = require('drizzle-orm/neon-http');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { neon } = require('@neondatabase/serverless');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const schema = require('./schema');
    const sql = neon(process.env.DATABASE_URL);
    return drizzle(sql, { schema });
  }

  console.log('[db] DATABASE_URL not set - using local SQLite database (sqlite.db)');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema = require('./schema.sqlite');
  const sqlite = new Database('sqlite.db');
  return drizzle(sqlite, { schema });
}

export const db = createDb() as any;
