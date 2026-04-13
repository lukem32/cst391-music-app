// app/api/setup/route.ts
// One-time migration endpoint.
// Adds the favorites table and user_email column to playlists if they don't exist.
// Safe to call multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
//
// Usage: GET /api/setup  (run once after deploying the new feature)
// ⚠️  Delete or gate this route behind admin auth before production release.

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  // Optional: restrict to admins only
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized – sign in first' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden – admin only' }, { status: 403 });
  }

  const pool = getPool();
  const results: string[] = [];

  try {
    // 1. Add user_email to playlists (nullable – safe for existing rows)
    await pool.query(`
      ALTER TABLE playlists
      ADD COLUMN IF NOT EXISTS user_email varchar(255) DEFAULT NULL
    `);
    results.push('✅ playlists.user_email column ready');

    // 2. Create favorites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id         SERIAL PRIMARY KEY,
        user_email varchar(255) NOT NULL,
        album_id   integer      NOT NULL,
        created_at timestamptz  DEFAULT NOW(),
        CONSTRAINT fav_album_fk          FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
        CONSTRAINT unique_user_album_fav UNIQUE (user_email, album_id)
      )
    `);
    results.push('✅ favorites table ready');

    // 3. Indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS fav_user_idx  ON favorites (user_email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS fav_album_idx ON favorites (album_id)`);
    results.push('✅ indexes ready');

    return NextResponse.json({ message: 'Migration complete', results });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Setup migration error:', detail);
    return NextResponse.json({ error: 'Migration failed', detail, results }, { status: 500 });
  }
}
