// app/components/SearchAlbum.tsx
// Search bar + album list display.
// Filters albums client-side based on the search phrase.

"use client";

import { Album } from "@/lib/types";
import AlbumList from "./AlbumList";

interface SearchAlbumProps {
  albumList: Album[];
  updateSearchResults: (phrase: string) => void;
  updateSingleAlbum: (albumId: number, uri: string) => void;
  favoritedIds?: Set<number>;
  onFavoriteToggle?: (albumId: number, newState: boolean) => void;
}

export default function SearchAlbum({
  albumList,
  updateSearchResults,
  updateSingleAlbum,
  favoritedIds = new Set(),
  onFavoriteToggle,
}: SearchAlbumProps) {
  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search albums by description..."
          onChange={(e) => updateSearchResults(e.target.value)}
        />
      </div>
      <AlbumList
        albumList={albumList}
        updateSingleAlbum={updateSingleAlbum}
        favoritedIds={favoritedIds}
        onFavoriteToggle={onFavoriteToggle}
      />
    </div>
  );
}
