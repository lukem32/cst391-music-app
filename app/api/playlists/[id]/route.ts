// app/api/playlists/[id]/route.ts
// Controller for single-playlist operations and album membership.
// GET    /api/playlists/[id]               → playlist details + albums (public)
// POST   /api/playlists/[id]               → add album  (body: { albumId })  (logged in)
// DELETE /api/playlists/[id]?albumId=X     → remove album from playlist      (owner or admin)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { PlaylistRepository } from '@/lib/repositories/playlistRepository';
import { PlaylistService } from '@/lib/services/playlistService';

export const runtime = 'nodejs';

function makeService(): PlaylistService {
  return new PlaylistService(new PlaylistRepository(getPool()));
}

// ── GET /api/playlists/[id] ─────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) {
    return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  }

  try {
    const svc = makeService();
    const playlist = await svc.getPlaylistById(playlistId);
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    return NextResponse.json(playlist);
  } catch (err) {
    console.error(`GET /api/playlists/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

// ── POST /api/playlists/[id]  →  add album (logged in) ──────────────────────
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) {
    return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const albumId = Number(body?.albumId);
    if (!albumId || isNaN(albumId)) {
      return NextResponse.json({ error: 'Missing albumId in body' }, { status: 400 });
    }

    const svc = makeService();
    await svc.addAlbumToPlaylist(playlistId, albumId);
    return NextResponse.json({ message: 'Album added to playlist' });
  } catch (err) {
    console.error(`POST /api/playlists/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to add album to playlist' }, { status: 500 });
  }
}

// ── DELETE /api/playlists/[id]?albumId=X  →  remove album (owner or admin) ──
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) {
    return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const albumId = Number(url.searchParams.get('albumId'));
    if (!albumId || isNaN(albumId)) {
      return NextResponse.json({ error: 'Missing albumId query param' }, { status: 400 });
    }

    const svc = makeService();

    // Only the playlist owner or an admin can remove albums
    if (session.user.role !== 'admin') {
      const playlist = await svc.getPlaylistById(playlistId);
      if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      if (playlist.user_email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const removed = await svc.removeAlbumFromPlaylist(playlistId, albumId);
    if (!removed) return NextResponse.json({ error: 'Album not in playlist' }, { status: 404 });
    return NextResponse.json({ message: 'Album removed from playlist' });
  } catch (err) {
    console.error(`DELETE /api/playlists/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to remove album from playlist' }, { status: 500 });
  }
}
