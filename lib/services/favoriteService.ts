// lib/services/favoriteService.ts
// Business-logic layer for the favorites feature.

import { FavoriteRepository } from '../repositories/favoriteRepository';
import { AlbumRepository } from '../repositories/albumRepository';
import { Album, AdminFavoriteStat } from '../types';

export class FavoriteService {
  constructor(
    private favRepo: FavoriteRepository,
    private albumRepo: AlbumRepository,
  ) {}

  /** Return the list of albums the user has favorited. */
  async getUserFavorites(userEmail: string): Promise<Album[]> {
    return this.favRepo.getFavoriteAlbumsByUser(userEmail);
  }

  /** Return a Set of album IDs the user has favorited (for quick look-up in the UI). */
  async getUserFavoriteIds(userEmail: string): Promise<number[]> {
    return this.favRepo.getFavoriteAlbumIdsByUser(userEmail);
  }

  /**
   * Toggle a favorite.
   * Returns { action: 'added' | 'removed', albumId }.
   */
  async toggleFavorite(
    userEmail: string,
    albumId: number,
  ): Promise<{ action: 'added' | 'removed'; albumId: number }> {
    if (!albumId || isNaN(albumId)) throw new Error('Invalid albumId');

    // Verify the album actually exists before favoriting
    const album = await this.albumRepo.findById(albumId);
    if (!album) throw new Error('Album not found');

    const alreadyFavorited = await this.favRepo.isFavorited(userEmail, albumId);
    if (alreadyFavorited) {
      await this.favRepo.remove(userEmail, albumId);
      return { action: 'removed', albumId };
    } else {
      await this.favRepo.add(userEmail, albumId);
      return { action: 'added', albumId };
    }
  }

  async removeFavorite(userEmail: string, albumId: number): Promise<void> {
    if (!albumId || isNaN(albumId)) throw new Error('Invalid albumId');
    await this.favRepo.remove(userEmail, albumId);
  }

  // ---- Admin ----

  async getAdminStats(): Promise<{
    stats: AdminFavoriteStat[];
    totalFavUsers: number;
    totalFavorites: number;
  }> {
    const stats = await this.favRepo.getAdminStats();
    const totalFavUsers = await this.favRepo.getTotalFavUsers();
    const totalFavorites = stats.reduce((sum, s) => sum + s.favorite_count, 0);
    return { stats, totalFavUsers, totalFavorites };
  }
}
