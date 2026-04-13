import { Pool } from 'pg';

// Persist across hot reloads in dev and across warm serverless invocations
let pool: Pool | undefined;
let migrationRan = false;

export function getPool(): Pool {
  if (!pool) {
    const URL = process.env.DATABASE_URL_NEON ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!URL) throw new Error('POSTGRES_URL (or DATABASE_URL) not set');

    pool = new Pool({
      connectionString: URL,
      // TLS is required by many hosted PGs; harmless locally when undefined
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 5, // small pool suits serverless
    });

    // Auto-migrate on first pool creation (safe – all statements use IF NOT EXISTS)
    if (!migrationRan) {
      migrationRan = true;
      runMigrations(pool).catch((err) =>
        console.error('[db] Auto-migration error:', err),
      );
    }
  }
  return pool;
}

/**
 * Idempotent migrations that add the Milestone 5 schema additions.
 * Safe to run on every cold start; IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
 * means they are no-ops once the objects exist.
 */
async function runMigrations(p: Pool): Promise<void> {
  // 1. Add user_email to playlists (nullable – no impact on existing rows)
  await p.query(`
    ALTER TABLE playlists
    ADD COLUMN IF NOT EXISTS user_email varchar(255) DEFAULT NULL
  `);

  // 2. Favorites table
  await p.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id         SERIAL PRIMARY KEY,
      user_email varchar(255) NOT NULL,
      album_id   integer      NOT NULL,
      created_at timestamptz  DEFAULT NOW(),
      CONSTRAINT fav_album_fk          FOREIGN KEY (album_id)
        REFERENCES albums(id) ON DELETE CASCADE,
      CONSTRAINT unique_user_album_fav UNIQUE (user_email, album_id)
    )
  `);

  // 3. Indexes (IF NOT EXISTS keeps this idempotent)
  await p.query(`CREATE INDEX IF NOT EXISTS fav_user_idx  ON favorites (user_email)`);
  await p.query(`CREATE INDEX IF NOT EXISTS fav_album_idx ON favorites (album_id)`);

  console.log('[db] Migrations OK');
}
