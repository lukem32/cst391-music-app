// app/api/playlists/route.ts
// Thin HTTP controller for playlists.
// RBAC: GET is public; POST requires login (users create playlists);
//       PUT/DELETE require ownership OR admin role.

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

// ── GET /api/playlists ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const svc = makeService();
    const playlists = await svc.getAllPlaylists();
    return NextResponse.json(playlists);
  } catch (err) {
    console.error('GET /api/playlists error:', err);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// ── POST /api/playlists  (logged-in users) ──────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description } = body;
    const svc = makeService();
    const id = await svc.createPlaylist(title, description, session.user.email);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create playlist';
    console.error('POST /api/playlists error:', err);
    return NextResponse.json({ error: msg }, { status: msg.includes('required') ? 400 : 500 });
  }
}

// ── PUT /api/playlists  (admin or playlist owner) ───────────────────────────
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { playlistId, title, description } = body;
    if (!playlistId) return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 });

    // Check ownership unless admin
    if (session.user.role !== 'admin') {
      const svc = makeService();
      const existing = await svc.getPlaylistById(Number(playlistId));
      if (!existing) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      if (existing.user_email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const svc = makeService();
    await svc.updatePlaylist(Number(playlistId), title, description);
    return NextResponse.json({ message: 'Playlist updated' });
  } catch (err) {
    console.error('PUT /api/playlists error:', err);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

// ── DELETE /api/playlists  (admin or playlist owner) ────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const playlistId = Number(url.searchParams.get('playlistId'));
    if (!playlistId || isNaN(playlistId)) {
      return NextResponse.json({ error: 'Missing or invalid playlistId' }, { status: 400 });
    }

    const svc = makeService();

    // Check ownership unless admin
    if (session.user.role !== 'admin') {
      const existing = await svc.getPlaylistById(playlistId);
      if (!existing) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      if (existing.user_email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const deleted = await svc.deletePlaylist(playlistId);
    if (!deleted) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    return NextResponse.json({ message: 'Playlist deleted' });
  } catch (err) {
    console.error('DELETE /api/playlists error:', err);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
