export interface Track {
  id?: number;
  number: number;
  title: string;
  lyrics?: string | null;
  video?: string | null;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  image?: string | null;
  description?: string | null;
  tracks?: Track[];
}

export interface Playlist {
  id: number;
  title: string;
  description?: string | null;
  created_at?: string;
  user_email?: string | null;
  album_count?: number;
}

export interface PlaylistWithAlbums extends Playlist {
  albums?: Album[];
}

// ---- Favorites ----

export interface Favorite {
  id: number;
  user_email: string;
  album_id: number;
  created_at?: string;
  album?: Album;
}

/** Shape returned by the admin /api/admin/favorites endpoint. */
export interface AdminFavoriteStat {
  album_id: number;
  title: string;
  artist: string;
  image?: string | null;
  favorite_count: number;
}
