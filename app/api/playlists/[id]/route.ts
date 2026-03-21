import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Album, Track, PlaylistWithAlbums } from '@/lib/types';

export const runtime = 'nodejs';

async function fetchAlbumsForAlbumIds(pool: any, albumIds: number[]) {
  if (albumIds.length === 0) return [];
  const tracksRes = await pool.query('SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number', [albumIds]);
  const tracksData = tracksRes.rows;
  const tracksByAlbum: Record<number, Track[]> = {};
  for (const t of tracksData) {
    (tracksByAlbum[t.album_id] ||= []).push({
      id: t.id,
      number: t.number,
      title: t.title,
      lyrics: t.lyrics,
      video: t.video_url,
    });
  }
  const albumsRes = await pool.query('SELECT * FROM albums WHERE id = ANY($1)', [albumIds]);
  return albumsRes.rows.map((a: any) => ({
    id: a.id,
    title: a.title,
    artist: a.artist,
    year: a.year,
    image: a.image,
    description: a.description,
    tracks: tracksByAlbum[a.id] || [],
  }));
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  try {
    const pool = getPool();
    const pRes = await pool.query('SELECT id, title, description, created_at FROM playlists WHERE id=$1', [playlistId]);
    if (pRes.rowCount === 0) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    const playlist = pRes.rows[0];
    const paRes = await pool.query('SELECT album_id FROM playlist_albums WHERE playlist_id=$1 ORDER BY id', [playlistId]);
    const albumIds = paRes.rows.map((r: any) => r.album_id);
    const albums = await fetchAlbumsForAlbumIds(pool, albumIds);
    const result: PlaylistWithAlbums = {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      created_at: playlist.created_at,
      albums,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error(`GET /api/playlists/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  try {
    const body = await request.json();
    const albumId = body?.albumId ?? null;
    if (!albumId) return NextResponse.json({ error: 'Missing albumId in body' }, { status: 400 });
    const pool = getPool();
    await pool.query('INSERT INTO playlist_albums (playlist_id, album_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [playlistId, albumId]);
    return NextResponse.json({ message: 'Album added to playlist' });
  } catch (error) {
    console.error(`POST /api/playlists/${id}/albums error:`, error);
    return NextResponse.json({ error: 'Failed to add album to playlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const playlistId = parseInt(id, 10);
  if (isNaN(playlistId)) return NextResponse.json({ error: 'Invalid playlist id' }, { status: 400 });
  try {
    const url = new URL(request.url);
    const albumIdParam = url.searchParams.get('albumId');
    if (!albumIdParam) return NextResponse.json({ error: 'Missing albumId query param' }, { status: 400 });
    const albumId = Number(albumIdParam);
    if (isNaN(albumId)) return NextResponse.json({ error: 'Invalid albumId' }, { status: 400 });
    const pool = getPool();
    const res = await pool.query('DELETE FROM playlist_albums WHERE playlist_id=$1 AND album_id=$2 RETURNING id', [playlistId, albumId]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Album not in playlist' }, { status: 404 });
    return NextResponse.json({ message: 'Album removed from playlist' });
  } catch (error) {
    console.error(`DELETE /api/playlists/${id}/albums error:`, error);
    return NextResponse.json({ error: 'Failed to remove album from playlist' }, { status: 500 });
  }
}
