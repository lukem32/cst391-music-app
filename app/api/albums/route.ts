// app/api/albums/route.ts
// Thin HTTP controller for albums.
// All business logic lives in AlbumService; all SQL lives in AlbumRepository.
// RBAC: GET is public (guests can browse); POST/PUT/DELETE require admin role.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { AlbumRepository } from '@/lib/repositories/albumRepository';
import { AlbumService } from '@/lib/services/albumService';
import { Album } from '@/lib/types';

export const runtime = 'nodejs';

function makeService(): AlbumService {
  return new AlbumService(new AlbumRepository(getPool()));
}

// ── GET /api/albums ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const svc = makeService();
    const url = new URL(request.url);
    const albumIdParam = url.searchParams.get('albumId');

    if (albumIdParam) {
      const id = parseInt(albumIdParam, 10);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid albumId parameter' }, { status: 400 });
      }
      const album = await svc.getAlbumById(id);
      if (!album) return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      return NextResponse.json(album);
    }

    const albums = await svc.getAllAlbums();
    return NextResponse.json(albums);
  } catch (err) {
    console.error('GET /api/albums error:', err);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// ── POST /api/albums  (admin only) ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const svc = makeService();
    const id = await svc.createAlbum(body as Omit<Album, 'id'>);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create album';
    console.error('POST /api/albums error:', err);
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}

// ── PUT /api/albums  (admin only) ───────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { albumId, ...data } = body;
    if (!albumId) return NextResponse.json({ error: 'Missing albumId for update' }, { status: 400 });
    const svc = makeService();
    await svc.updateAlbum(Number(albumId), data as Partial<Album>);
    return NextResponse.json({ message: 'Album updated successfully' });
  } catch (err) {
    console.error('PUT /api/albums error:', err);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// ── DELETE /api/albums  (admin only) ────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const url = new URL(request.url);
    const albumId = Number(url.searchParams.get('albumId'));
    if (!albumId || isNaN(albumId)) {
      return NextResponse.json({ error: 'Missing or invalid albumId' }, { status: 400 });
    }
    const svc = makeService();
    const deleted = await svc.deleteAlbum(albumId);
    if (!deleted) return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    return NextResponse.json({ message: 'Album deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/albums error:', err);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
