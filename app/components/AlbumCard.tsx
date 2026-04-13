'use client';

import { Album } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FavoriteButton from "./FavoriteButton";

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album, uri: string) => void;
  favoritedIds?: Set<number>;
  onFavoriteToggle?: (albumId: number, newState: boolean) => void;
}

export default function AlbumCard({
  album,
  onClick,
  favoritedIds = new Set(),
  onFavoriteToggle,
}: AlbumCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";
  const isFavorited = favoritedIds.has(album.id);

  return (
    <div
      className="card h-100"
      style={{ borderTop: "3px solid #3b82f6", borderRadius: 12 }}
    >
      {/* Album artwork */}
      {album.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.image}
          className="card-img-top"
          alt={album.title}
          style={{ objectFit: "cover", height: 190 }}
        />
      ) : (
        /* Placeholder when no image */
        <div
          style={{
            height: 190,
            background: "linear-gradient(135deg, #0d1f3c 0%, #1e4480 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
            color: "#f5c518",
          }}
        >
          ♫
        </div>
      )}

      <div className="card-body d-flex flex-column" style={{ padding: "1rem 1.1rem" }}>
        {/* Title row with heart */}
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h5
            className="card-title mb-0"
            style={{ fontSize: ".96rem", fontWeight: 700, color: "#0d1f3c", lineHeight: 1.3 }}
          >
            {album.title}
          </h5>
          {isLoggedIn && (
            <FavoriteButton
              albumId={album.id}
              initialFavorited={isFavorited}
              onToggle={onFavoriteToggle}
              size="md"
            />
          )}
        </div>

        {/* Artist & year chip */}
        <div className="mb-2">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#dbeafe",
              color: "#1e4480",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: ".74rem",
              fontWeight: 600,
            }}
          >
            {album.artist} · {album.year}
          </span>
        </div>

        <p
          className="card-text flex-grow-1"
          style={{
            fontSize: ".81rem",
            color: "#5a6a82",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {album.description ?? "No description available."}
        </p>

        {/* Action row */}
        <div
          className="d-flex gap-2 align-items-center mt-2"
          style={{ borderTop: "1px solid #e8eef6", paddingTop: ".7rem" }}
        >
          {isLoggedIn && (
            <button
              className="btn btn-outline-primary btn-sm"
              style={{ fontSize: ".78rem", padding: ".3rem .8rem" }}
              onClick={() => onClick(album, "/show/")}
            >
              View
            </button>
          )}
          {isAdmin && (
            <button
              className="btn btn-warning btn-sm"
              style={{ fontSize: ".78rem", padding: ".3rem .8rem" }}
              onClick={() => router.push(`/edit/${album.id}`)}
            >
              ✎ Edit
            </button>
          )}
          {!isLoggedIn && (
            <span style={{ fontSize: ".78rem", color: "#94a3b8" }}>
              Sign in to interact
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
