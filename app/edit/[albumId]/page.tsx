// app/edit/[albumId]/page.tsx
"use client";

import { get, put, post } from "@/lib/apiClient";
import { Album, Track } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NavBar from "@/app/components/NavBar";

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params?.albumId; // undefined under /new

  // All fields initialised to strings/numbers so React inputs stay controlled.
  // Never use null/undefined as a controlled input value.
  const defaultAlbum: Album = {
    id: 0,
    title: "",
    artist: "",
    description: "",
    year: new Date().getFullYear(),
    image: "",
    tracks: [] as Track[],
  };

  const [album, setAlbum] = useState<Album>(defaultAlbum);

  // Load album only when editing (not creating)
  useEffect(() => {
    if (!albumId) return;

    (async () => {
      // FIX: use ?albumId= query param so the main albums route handles it
      // (the [slug] route does artist-name search, not ID lookup)
      const res = await get<Album>(`/albums?albumId=${albumId}`);

      // Guard: ensure we got an Album object, not an error/empty payload
      if (!res || typeof res !== 'object' || Array.isArray(res) || !('title' in res)) {
        console.error('EditAlbumPage: unexpected response', res);
        return;
      }

      // Coerce nullable DB fields to empty strings so every input stays controlled
      setAlbum({
        ...res,
        title:       res.title       ?? "",
        artist:      res.artist      ?? "",
        description: res.description ?? "",
        image:       res.image       ?? "",
        year:        res.year        ?? new Date().getFullYear(),
        tracks:      res.tracks      ?? [],
      });
    })();
  }, [albumId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (albumId) {
      // Send albumId inside the body so the PUT handler can find the record
      await put<Album, Album & { albumId: number }>(`/albums`, {
        ...album,
        albumId: album.id,
      });
    } else {
      await post<Album, Album>(`/albums`, album);
    }

    router.push("/");
  };

  // Generic onChange: keeps every field as a plain string in state.
  // The year field is converted back to a number on submit via the Album type.
  const onChange =
    (key: keyof Album) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAlbum((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <NavBar />
      <main className="container mt-4">
        <h1 className="mb-3">{albumId ? "Edit Album" : "Create Album"}</h1>
        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-12">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              placeholder="Title"
              value={album.title}
              onChange={onChange("title")}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label">Artist</label>
            <input
              className="form-control"
              placeholder="Artist"
              value={album.artist}
              onChange={onChange("artist")}
              required
            />
          </div>
          <div className="col-6">
            <label className="form-label">Year</label>
            <input
              className="form-control"
              type="number"
              placeholder="Year"
              // Coerce to string so the number input always stays controlled
              value={album.year ?? ""}
              onChange={onChange("year")}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Description"
              value={album.description ?? ""}
              onChange={onChange("description")}
              rows={3}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Image URL</label>
            <input
              className="form-control"
              placeholder="Image URL"
              value={album.image ?? ""}
              onChange={onChange("image")}
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary me-2">
              {albumId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
