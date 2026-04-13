// lib/repositories/favoriteRepository.ts
// Data-access layer for the user-favorites feature.
// All favorites SQL lives here.

import { Pool } from 'pg';
import { Album, AdminFavoriteStat } from '../types';

export class FavoriteRepository {
  constructor(private pool: Pool) {}

  /** Return album IDs that a user has favorited. */
  async getFavoriteAlbumIdsByUser(userEmail: string): Promise<number[]> {
    const res = await this.pool.query(
      'SELECT album_id FROM favorites WHERE user_email = $1',
      [userEmail],
    );
    return res.rows.map((r: any) => Number(r.album_id));
  }

  /** Return full album rows (with tracks) that a user has favorited. */
  async getFavoriteAlbumsByUser(userEmail: string): Promise<Album[]> {
    // Join to get album data directly
    const res = await this.pool.query(
      `SELECT a.*, f.created_at AS fav_created_at
       FROM favorites f
       JOIN albums a ON a.id = f.album_id
       WHERE f.user_email = $1
       ORDER BY f.created_at DESC`,
      [userEmail],
    );
    return res.rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      artist: a.artist,
      year: a.year,
      image: a.image,
      description: a.description,
    }));
  }

  /** Return true if the user has already favorited this album. */
  async isFavorited(userEmail: string, albumId: number): Promise<boolean> {
    const res = await this.pool.query(
      'SELECT 1 FROM favorites WHERE user_email = $1 AND album_id = $2',
      [userEmail, albumId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  /** Add a favorite; silently ignores duplicates (ON CONFLICT DO NOTHING). */
  async add(userEmail: string, albumId: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO favorites (user_email, album_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userEmail, albumId],
    );
  }

  /** Remove a favorite.  Returns true if a row was actually deleted. */
  async remove(userEmail: string, albumId: number): Promise<boolean> {
    const res = await this.pool.query(
      'DELETE FROM favorites WHERE user_email = $1 AND album_id = $2',
      [userEmail, albumId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  // ---- Admin queries ----

  /** Return aggregated favorite counts per album for the admin dashboard. */
  async getAdminStats(): Promise<AdminFavoriteStat[]> {
    const res = await this.pool.query(
      `SELECT a.id AS album_id, a.title, a.artist, a.image,
              COUNT(f.id)::int AS favorite_count
       FROM albums a
       LEFT JOIN favorites f ON f.album_id = a.id
       GROUP BY a.id, a.title, a.artist, a.image
       ORDER BY favorite_count DESC, a.title`,
    );
    return res.rows.map((r: any) => ({
      album_id: r.album_id,
      title: r.title,
      artist: r.artist,
      image: r.image,
      favorite_count: Number(r.favorite_count),
    }));
  }

  /** Return total unique users who have at least one favorite. */
  async getTotalFavUsers(): Promise<number> {
    const res = await this.pool.query(
      'SELECT COUNT(DISTINCT user_email)::int AS cnt FROM favorites',
    );
    return Number(res.rows[0]?.cnt ?? 0);
  }
}
