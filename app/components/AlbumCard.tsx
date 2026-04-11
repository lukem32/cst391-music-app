// A component to display individual album info, not included in Next.js routing
// app/components/AlbumCard.tsx

import { Album } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album, uri: string) => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Only logged-in users can see album buttons; only admins can edit
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="card h-100 shadow-sm">
      {album.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.image}
          className="card-img-top"
          alt={album.title}
          style={{ objectFit: "cover", height: "200px" }}
        />
      )}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{album.title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">
          {album.artist} ({album.year})
        </h6>
        <p className="card-text flex-grow-1">
          {album.description ?? "No description available."}
        </p>
        <div className="mt-auto d-flex gap-2">
          {/* View button: only visible when logged in */}
          {isLoggedIn && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onClick(album, "/show/")}
            >
              View
            </button>
          )}
          {/* Edit button: only visible to admins */}
          {isAdmin && (
            <button
              className="btn btn-sm btn-warning"
              onClick={() => router.push(`/edit/${album.id}`)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
