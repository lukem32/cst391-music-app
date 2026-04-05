// app/page.tsx
// CHANGED: Next.js uses TypeScript and server/client separation.
// This component uses hooks and interactivity, so we must mark it as a Client Component.

"use client";

import { useState, useEffect } from "react";
import NavBar from "./components/NavBar";
import SearchAlbum from "./components/SearchAlbum";
import { useRouter } from "next/navigation"; // CHANGED: replace BrowserRouter + navigate() with Next.js router
import { get } from "@/lib/apiClient";
import { Album } from "@/lib/types";

// CHANGED: In Next.js, "App" is replaced by a route-level component called page.tsx
export default function Page() {
  const [searchPhrase, setSearchPhrase] = useState("");
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter(); // CHANGED: replaces BrowserRouter + navigate()

  // CHANGED: Load albums from API using the centralized apiClient
  const loadAlbums = async () => {
    try {
      // CHANGED: since the server and client are in the same Next.js app, we use relative paths
      const data = await get<Album[]>("/albums");
      console.log("Fetched albums:", data);
      setAlbumList(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load albums";
      console.error("Error loading albums:", message);
      setError(message);
    }
  };

  // CHANGED: Initialization logic still valid
  useEffect(() => {
    loadAlbums();
  }, []);

  const updateSearchResults = (phrase: string) => {
    console.log("phrase is " + phrase);
    setSearchPhrase(phrase);
  };

  // CHANGED: replace navigate() with router.push()
  const updateSingleAlbum = (albumId: number, uri: string) => {
    console.log("Update Single Album = ", albumId);
    const path = `${uri}${albumId}`;
    console.log("path", path);
    router.push(path); // CHANGED: use Next.js router
  };

  const renderedList = albumList.filter((album) => {
    if (
      (album.description ?? "")
        .toLowerCase()
        .includes(searchPhrase.toLowerCase()) ||
      searchPhrase === ""
    ) {
      return true;
    }
    return false;
  });

  return (
    <>
      <NavBar />
      <main className="container mt-4">
        <h1 className="mb-1">Luke Morton&apos;s Music App</h1>
        <p className="text-muted mb-4">Browse and manage your album collection.</p>

        {/* Error display — shown instead of the album list when an error occurs */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error loading albums:</strong> {error}
          </div>
        )}

        {/* Album list + search — shown only when albums have loaded successfully */}
        {!error && (
          <SearchAlbum
            albumList={renderedList}
            updateSearchResults={updateSearchResults}
            updateSingleAlbum={(albumId) => updateSingleAlbum(albumId, "/edit/")}
          />
        )}

        {/* Loading state */}
        {!error && albumList.length === 0 && <p>Loading albums...</p>}
      </main>
    </>
  );
}
