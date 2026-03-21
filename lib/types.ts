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
}

export interface PlaylistWithAlbums extends Playlist {
  albums?: Album[];
}