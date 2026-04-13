// lib/repositories/playlistRepository.ts
// Data-access layer for playlists.

import { Pool } from 'pg';
import { Playlist, PlaylistWithAlbums, Album, Track } from '../types';

export class PlaylistRepository {
  constructor(private pool: Pool) {}

  async findAll(): Promise<Playlist[]> {
    const res = await this.pool.query(
      `SELECT p.id, p.title, p.description, p.created_at, p.user_email,
              COUNT(pa.album_id)::int AS album_count
       FROM playlists p
       LEFT JOIN playlist_albums pa ON pa.playlist_id = p.id
       GROUP BY p.id, p.title, p.description, p.created_at, p.user_email
       ORDER BY p.created_at DESC`,
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      created_at: r.created_at,
      user_email: r.user_email,
      album_count: Number(r.album_count ?? 0),
    }));
  }

  async findById(id: number): Promise<PlaylistWithAlbums | null> {
    const pRes = await this.pool.query(
      'SELECT id, title, description, created_at, user_email FROM playlists WHERE id=$1',
      [id],
    );
    if (pRes.rowCount === 0) return null;
    const playlist = pRes.rows[0];

    // Fetch albums in this playlist
    const paRes = await this.pool.query(
      'SELECT album_id FROM playlist_albums WHERE playlist_id=$1 ORDER BY id',
      [id],
    );
    const albumIds: number[] = paRes.rows.map((r: any) => r.album_id);

    let albums: Album[] = [];
    if (albumIds.length > 0) {
      const albumRes = await this.pool.query(
        'SELECT * FROM albums WHERE id = ANY($1)',
        [albumIds],
      );
      const trackRes = await this.pool.query(
        'SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number',
        [albumIds],
      );
      const tracksByAlbum: Record<number, Track[]> = {};
      for (const t of trackRes.rows) {
        (tracksByAlbum[t.album_id] ||= []).push({
          id: t.id,
          number: t.number,
          title: t.title,
          lyrics: t.lyrics,
          video: t.video_url,
        });
      }
      albums = albumRes.rows.map((a: any) => ({
        id: a.id,
        title: a.title,
        artist: a.artist,
        year: a.year,
        image: a.image,
        description: a.description,
        tracks: tracksByAlbum[a.id] || [],
      }));
    }

    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      created_at: playlist.created_at,
      user_email: playlist.user_email,
      albums,
    };
  }

  async create(data: { title: string; description?: string | null; user_email?: string | null }): Promise<number> {
    const res = await this.pool.query(
      `INSERT INTO playlists (title, description, user_email)
       VALUES ($1, $2, $3) RETURNING id`,
      [data.title, data.description ?? null, data.user_email ?? null],
    );
    return res.rows[0].id;
  }

  async update(id: number, data: { title?: string; description?: string | null }): Promise<void> {
    await this.pool.query(
      `UPDATE playlists SET title=$1, description=$2 WHERE id=$3`,
      [data.title, data.description ?? null, id],
    );
  }

  async delete(id: number): Promise<boolean> {
    // playlist_albums rows are cascade-deleted via FK constraint
    const res = await this.pool.query('DELETE FROM playlists WHERE id=$1 RETURNING id', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async addAlbum(playlistId: number, albumId: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO playlist_albums (playlist_id, album_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [playlistId, albumId],
    );
  }

  async removeAlbum(playlistId: number, albumId: number): Promise<boolean> {
    const res = await this.pool.query(
      'DELETE FROM playlist_albums WHERE playlist_id=$1 AND album_id=$2 RETURNING id',
      [playlistId, albumId],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
