// lib/services/albumService.ts
// Business-logic layer for albums.
// Validates inputs, enforces invariants, and delegates DB work to AlbumRepository.

import { AlbumRepository } from '../repositories/albumRepository';
import { Album } from '../types';

export class AlbumService {
  constructor(private repo: AlbumRepository) {}

  async getAllAlbums(): Promise<Album[]> {
    return this.repo.findAll();
  }

  async getAlbumById(id: number): Promise<Album | null> {
    if (!id || isNaN(id)) throw new Error('Invalid album id');
    return this.repo.findById(id);
  }

  async createAlbum(data: Omit<Album, 'id'>): Promise<number> {
    const { title, artist, year } = data;
    if (!title || !artist || year == null) {
      throw new Error('Missing required fields: title, artist, year');
    }
    return this.repo.create(data);
  }

  async updateAlbum(id: number, data: Partial<Album>): Promise<void> {
    if (!id || isNaN(id)) throw new Error('Invalid album id');
    await this.repo.update(id, data);
  }

  async deleteAlbum(id: number): Promise<boolean> {
    if (!id || isNaN(id)) throw new Error('Invalid album id');
    return this.repo.delete(id);
  }
}
