// app/components/AlbumList.tsx
// Renders a grid of AlbumCard components for a given list of albums.

'use client';

import { Album } from "@/lib/types";
import AlbumCard from "./AlbumCard";

interface AlbumListProps {
  albumList: Album[];
  updateSingleAlbum: (albumId: number, uri: string) => void;
  favoritedIds?: Set<number>;
  onFavoriteToggle?: (albumId: number, newState: boolean) => void;
}

export default function AlbumList({
  albumList,
  updateSingleAlbum,
  favoritedIds = new Set(),
  onFavoriteToggle,
}: AlbumListProps) {
  if (albumList.length === 0) {
    return <p className="text-muted">No albums found.</p>;
  }

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
      {albumList.map((album) => (
        <div className="col" key={album.id}>
          <AlbumCard
            album={album}
            onClick={(a, uri) => updateSingleAlbum(a.id, uri)}
            favoritedIds={favoritedIds}
            onFavoriteToggle={onFavoriteToggle}
          />
        </div>
      ))}
    </div>
  );
}
