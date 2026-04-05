// A component to display individual album info, not included in Next.js routing
// app/components/AlbumCard.tsx

// Define the shape of props expected by the AlbumCard component.
// This interface acts as a contract, ensuring that any use of AlbumCard
// must provide exactly these props with the correct types.
import { Album } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AlbumCardProps {
  // The `album` prop must be an object of type Album.
  // This type is defined in lib/types.ts and describes the structure of an album.
  album: Album;

  // The `onClick` prop is a function that takes two arguments:
  // - an Album object
  // - a string representing a URI (e.g., "/show" or "/edit")
  // and returns nothing (void).
  // This ensures that any click handler passed to AlbumCard
  // adheres to this exact signature, preventing runtime errors.
  onClick: (album: Album, uri: string) => void;
}

// Export a functional React component named AlbumCard.
// The props are destructured directly in the parameter list,
// and their shape is validated against the AlbumCardProps interface.
export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  // In Next.js, useRouter() is universally available — no need to
  // thread routing callbacks through props like in plain React.
  const router = useRouter();

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
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onClick(album, "/show/")}
          >
            View
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => router.push(`/edit/${album.id}`)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
