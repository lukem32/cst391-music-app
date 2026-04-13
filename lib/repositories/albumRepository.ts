// lib/repositories/albumRepository.ts
// Data-access layer for albums and their tracks.
// All SQL lives here — services and routes stay SQL-free.

import { Pool } from 'pg';
import { Album, Track } from '../types';

export class AlbumRepository {
  constructor(private pool: Pool) {}

  /** Build an Album[] from raw DB rows, attaching tracks from a separate query. */
  private buildAlbumsWithTracks(albumRows: any[], trackRows: any[]): Album[] {
    const tracksByAlbum: Record<number, Track[]> = {};
    for (const t of trackRows) {
      (tracksByAlbum[t.album_id] ||= []).push({
        id: t.id,
        number: t.number,
        title: t.title,
        lyrics: t.lyrics,
        video: t.video_url,
      });
    }
    return albumRows.map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.artist,
      year: a.year,
      image: a.image,
      description: a.description,
      tracks: tracksByAlbum[a.id] || [],
    }));
  }

  async findAll(): Promise<Album[]> {
    const albumRes = await this.pool.query('SELECT * FROM albums ORDER BY title');
    if (albumRes.rows.length === 0) return [];
    const ids = albumRes.rows.map((a: any) => a.id);
    const trackRes = await this.pool.query(
      'SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number',
      [ids],
    );
    return this.buildAlbumsWithTracks(albumRes.rows, trackRes.rows);
  }

  async findById(id: number): Promise<Album | null> {
    const albumRes = await this.pool.query('SELECT * FROM albums WHERE id = $1', [id]);
    if (albumRes.rows.length === 0) return null;
    const trackRes = await this.pool.query(
      'SELECT * FROM tracks WHERE album_id = $1 ORDER BY number',
      [id],
    );
    return this.buildAlbumsWithTracks(albumRes.rows, trackRes.rows)[0];
  }

  async findByIds(ids: number[]): Promise<Album[]> {
    if (ids.length === 0) return [];
    const albumRes = await this.pool.query('SELECT * FROM albums WHERE id = ANY($1)', [ids]);
    const trackRes = await this.pool.query(
      'SELECT * FROM tracks WHERE album_id = ANY($1) ORDER BY number',
      [ids],
    );
    return this.buildAlbumsWithTracks(albumRes.rows, trackRes.rows);
  }

  async create(data: Omit<Album, 'id'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const albumRes = await client.query(
        `INSERT INTO albums (title, artist, description, year, image)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [data.title, data.artist, data.description ?? null, data.year, data.image ?? null],
      );
      const albumId: number = albumRes.rows[0].id;

      if (Array.isArray(data.tracks)) {
        for (const t of data.tracks as Track[]) {
          if (t.title == null || t.number == null) continue;
          await client.query(
            `INSERT INTO tracks (album_id, title, number, lyrics, video_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [albumId, t.title, t.number, t.lyrics ?? null, t.video ?? null],
          );
        }
      }

      await client.query('COMMIT');
      return albumId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: Partial<Album>): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE albums SET title=$1, artist=$2, description=$3, year=$4, image=$5 WHERE id=$6`,
        [data.title, data.artist, data.description ?? null, data.year, data.image ?? null, id],
      );

      if (Array.isArray(data.tracks)) {
        for (const t of data.tracks as Track[]) {
          if (t.id == null) continue;
          await client.query(
            `UPDATE tracks SET number=$1, title=$2, lyrics=$3, video_url=$4 WHERE id=$5 AND album_id=$6`,
            [t.number, t.title, t.lyrics ?? null, t.video ?? null, t.id, id],
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM tracks WHERE album_id = $1', [id]);
      const res = await client.query('DELETE FROM albums WHERE id = $1', [id]);
      await client.query('COMMIT');
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
