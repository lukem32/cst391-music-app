import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Playlist } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    // Return playlists with album counts
    const res = await pool.query(
      `SELECT p.id, p.title, p.description, p.created_at, COUNT(pa.album_id) AS album_count
       FROM playlists p
       LEFT JOIN playlist_albums pa ON pa.playlist_id = p.id
       GROUP BY p.id ORDER BY p.created_at DESC`
    );
    const rows = res.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      created_at: r.created_at,
      album_count: Number(r.album_count || 0),
    }));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;
    if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO playlists (title, description) VALUES ($1, $2) RETURNING id`,
      [title, description ?? null]
    );
    return NextResponse.json({ id: res.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { playlistId, title, description } = body;
    if (!playlistId) return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 });
    const pool = getPool();
    await pool.query(`UPDATE playlists SET title=$1, description=$2 WHERE id=$3`, [title, description ?? null, playlistId]);
    return NextResponse.json({ message: 'Playlist updated' });
  } catch (error) {
    console.error('PUT /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const playlistIdParam = url.searchParams.get('playlistId');
    if (!playlistIdParam) return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 });
    const id = Number(playlistIdParam);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid playlistId' }, { status: 400 });
    const pool = getPool();
    const res = await pool.query(`DELETE FROM playlists WHERE id=$1 RETURNING id`, [id]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    return NextResponse.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('DELETE /api/playlists error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
