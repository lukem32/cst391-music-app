// lib/services/playlistService.ts
// Business-logic layer for playlists.

import { PlaylistRepository } from '../repositories/playlistRepository';
import { Playlist, PlaylistWithAlbums } from '../types';

export class PlaylistService {
  constructor(private repo: PlaylistRepository) {}

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.repo.findAll();
  }

  async getPlaylistById(id: number): Promise<PlaylistWithAlbums | null> {
    if (!id || isNaN(id)) throw new Error('Invalid playlist id');
    return this.repo.findById(id);
  }

  async createPlaylist(
    title: string,
    description?: string | null,
    userEmail?: string | null,
  ): Promise<number> {
    if (!title?.trim()) throw new Error('Playlist title is required');
    return this.repo.create({ title, description, user_email: userEmail });
  }

  async updatePlaylist(
    id: number,
    title: string,
    description?: string | null,
  ): Promise<void> {
    if (!id || isNaN(id)) throw new Error('Invalid playlist id');
    await this.repo.update(id, { title, description });
  }

  async deletePlaylist(id: number): Promise<boolean> {
    if (!id || isNaN(id)) throw new Error('Invalid playlist id');
    return this.repo.delete(id);
  }

  async addAlbumToPlaylist(playlistId: number, albumId: number): Promise<void> {
    if (!playlistId || isNaN(playlistId)) throw new Error('Invalid playlistId');
    if (!albumId || isNaN(albumId)) throw new Error('Invalid albumId');
    await this.repo.addAlbum(playlistId, albumId);
  }

  async removeAlbumFromPlaylist(playlistId: number, albumId: number): Promise<boolean> {
    if (!playlistId || isNaN(playlistId)) throw new Error('Invalid playlistId');
    if (!albumId || isNaN(albumId)) throw new Error('Invalid albumId');
    return this.repo.removeAlbum(playlistId, albumId);
  }
}
