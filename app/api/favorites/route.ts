// app/api/favorites/route.ts
// Controller for user favorites.  Auth-guarded – requires a valid session.
//
// GET    /api/favorites          → user's favorited albums + their IDs
// POST   /api/favorites          → toggle a favorite (body: { albumId })
// DELETE /api/favorites?albumId  → remove a specific favorite

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { FavoriteRepository } from '@/lib/repositories/favoriteRepository';
import { AlbumRepository } from '@/lib/repositories/albumRepository';
import { FavoriteService } from '@/lib/services/favoriteService';

export const runtime = 'nodejs';

function makeService() {
  const pool = getPool();
  return new FavoriteService(
    new FavoriteRepository(pool),
    new AlbumRepository(pool),
  );
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const svc = makeService();
    const [albums, ids] = await Promise.all([
      svc.getUserFavorites(session.user.email),
      svc.getUserFavoriteIds(session.user.email),
    ]);
    return NextResponse.json({ albums, ids });
  } catch (err) {
    console.error('GET /api/favorites error:', err);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const albumId = Number(body?.albumId);
    if (!albumId || isNaN(albumId)) {
      return NextResponse.json({ error: 'Missing or invalid albumId' }, { status: 400 });
    }

    const svc = makeService();
    const result = await svc.toggleFavorite(session.user.email, albumId);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle favorite';
    if (message === 'Album not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error('POST /api/favorites error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const albumId = Number(url.searchParams.get('albumId'));
    if (!albumId || isNaN(albumId)) {
      return NextResponse.json({ error: 'Missing or invalid albumId' }, { status: 400 });
    }

    const svc = makeService();
    await svc.removeFavorite(session.user.email, albumId);
    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('DELETE /api/favorites error:', err);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
