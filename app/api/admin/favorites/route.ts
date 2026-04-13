// app/api/admin/favorites/route.ts
// Admin-only endpoint: aggregated favorites stats.
// Returns per-album favorite counts for the admin dashboard.
//
// GET /api/admin/favorites  →  { stats, totalFavUsers, totalFavorites }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { FavoriteRepository } from '@/lib/repositories/favoriteRepository';
import { AlbumRepository } from '@/lib/repositories/albumRepository';
import { FavoriteService } from '@/lib/services/favoriteService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Must be logged in AND be an admin
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pool = getPool();
    const svc = new FavoriteService(
      new FavoriteRepository(pool),
      new AlbumRepository(pool),
    );
    const data = await svc.getAdminStats();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/admin/favorites error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin favorites data' }, { status: 500 });
  }
}
