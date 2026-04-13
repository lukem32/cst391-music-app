"use client";

import { useState, useEffect, useCallback } from "react";
import NavBar from "./components/NavBar";
import AlbumList from "./components/AlbumList";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { get } from "@/lib/apiClient";
import { Album } from "@/lib/types";

export default function Page() {
  const [searchPhrase, setSearchPhrase] = useState("");
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

  const router = useRouter();
  const { data: session } = useSession();

  const loadAlbums = useCallback(async () => {
    try {
      const data = await get<Album[]>("/albums");
      setAlbumList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load albums");
    }
  }, []);

  const loadFavoriteIds = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) return;
      const data = await res.json();
      setFavoritedIds(new Set<number>(data.ids ?? []));
    } catch { /* non-critical */ }
  }, [session?.user?.email]);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);
  useEffect(() => { loadFavoriteIds(); }, [loadFavoriteIds]);

  const handleFavoriteToggle = (albumId: number, newState: boolean) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (newState) next.add(albumId);
      else next.delete(albumId);
      return next;
    });
  };

  const renderedList = albumList.filter((album) =>
    (album.description ?? "").toLowerCase().includes(searchPhrase.toLowerCase()) ||
    album.title.toLowerCase().includes(searchPhrase.toLowerCase()) ||
    album.artist.toLowerCase().includes(searchPhrase.toLowerCase()) ||
    searchPhrase === ""
  );

  return (
    <>
      <NavBar />

      {/* ── Page header ──────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1f3c 0%, #163055 60%, #1e4480 100%)",
          borderBottom: "3px solid #f5c518",
          padding: "2.2rem 0 1.6rem",
          marginBottom: "2rem",
        }}
      >
        <div className="container">
          <h1 style={{ color: "#fff", marginBottom: ".25rem", fontSize: "1.9rem" }}>
            Luke Morton&apos;s Music App
          </h1>
          <p style={{ color: "rgba(255,255,255,.65)", margin: 0, fontSize: ".92rem" }}>
            {albumList.length > 0
              ? `${albumList.length} albums in your collection`
              : "Browse and manage your album collection."}
          </p>
        </div>
      </div>

      <main className="container" style={{ paddingBottom: "3rem" }}>
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <strong>Error loading albums:</strong> {error}
          </div>
        )}

        {/* ── Search bar ──────────────────────────── */}
        {!error && (
          <div className="mb-4" style={{ maxWidth: 520 }}>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "1rem",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                🔍
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, artist, or description…"
                style={{ paddingLeft: "2.5rem", height: 44 }}
                onChange={(e) => setSearchPhrase(e.target.value)}
              />
            </div>
            {searchPhrase && (
              <p style={{ fontSize: ".8rem", color: "#5a6a82", marginTop: ".4rem" }}>
                {renderedList.length} result{renderedList.length !== 1 ? "s" : ""} for &ldquo;{searchPhrase}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* ── Album grid ──────────────────────────── */}
        {!error && albumList.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#5a6a82" }}>
            <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>♫</div>
            <p>Loading albums…</p>
          </div>
        )}

        {!error && albumList.length > 0 && renderedList.length === 0 && (
          <p style={{ color: "#5a6a82" }}>No albums match your search.</p>
        )}

        {!error && renderedList.length > 0 && (
          <AlbumList
            albumList={renderedList}
            updateSingleAlbum={(id) => router.push(`/edit/${id}`)}
            favoritedIds={favoritedIds}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </main>
    </>
  );
}
