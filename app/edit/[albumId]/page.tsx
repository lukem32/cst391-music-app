// app/edit/[albumId]/page.tsx
"use client";

import { get, put, post } from "@/lib/apiClient";
import { Album, Track } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NavBar from "@/app/components/NavBar";

export default function EditAlbumPage() {
  const router = useRouter();

  // Next.js params hook replaces useParams from react-router
  const params = useParams();
  const albumId = params?.albumId; // undefined under /new

  const defaultAlbum: Album = {
    id: 0,
    title: "",
    artist: "",
    description: "",
    year: 0,
    image: "",
    tracks: [] as Track[],
  };

  // Type safe use of defaultAlbum to initialize state
  // Rather than the ad hoc album object used previously, this ensures correct typing and calms TypeScript
  const [album, setAlbum] = useState<Album>(defaultAlbum);

  // Load album only when editing
  useEffect(() => {
    if (!albumId) return; // creation mode

    (async () => {
      const res = await get<Album>(`/albums/${albumId}`);
      setAlbum(res);
    })();
  }, [albumId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (albumId) {
      await put<Album, Album>(`/albums/${albumId}`, album);
    } else {
      await post<Album, Album>(`/albums`, album);
    }

    router.push("/");
  };

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
              value={album.year}
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
