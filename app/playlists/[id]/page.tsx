// app/playlists/[id]/page.tsx
// Individual playlist detail page.
// Shows all albums in the playlist.
// Logged-in users can add albums; owners/admins can remove albums.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import { PlaylistWithAlbums, Album } from '@/lib/types';

export default function PlaylistDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const id = params?.id as string;

  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === 'admin';

  const [playlist, setPlaylist] = useState<PlaylistWithAlbums | null>(null);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAlbumId, setAddAlbumId] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const loadPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlaylist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAllAlbums = useCallback(async () => {
    try {
      const res = await fetch('/api/albums');
      if (!res.ok) return;
      const data = await res.json();
      setAllAlbums(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadPlaylist();
    if (isLoggedIn) loadAllAlbums();
  }, [loadPlaylist, loadAllAlbums, isLoggedIn]);

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const albumId = Number(addAlbumId);
    if (!albumId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddAlbumId('');
      await loadPlaylist();
    } catch (err) {
      alert('Failed to add album: ' + (err instanceof Error ? err.message : err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAlbum = async (albumId: number) => {
    if (!confirm('Remove this album from the playlist?')) return;
    try {
      const res = await fetch(`/api/playlists/${id}?albumId=${albumId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadPlaylist();
    } catch (err) {
      alert('Failed to remove album: ' + (err instanceof Error ? err.message : err));
    }
  };

  const canManage =
    isAdmin || (playlist?.user_email != null && playlist.user_email === session?.user?.email);

  // Albums not already in this playlist (for the add dropdown)
  const albumsInPlaylist = new Set((playlist?.albums ?? []).map((a) => a.id));
  const availableAlbums = allAlbums.filter((a) => !albumsInPlaylist.has(a.id));

  return (
    <>
      <NavBar />
      <main className="container mt-4">
        <div className="mb-3">
          <Link href="/playlists" className="text-muted small">
            ← Back to Playlists
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p>Loading playlist…</p>}

        {!loading && playlist && (
          <>
            <h1 className="mb-0">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-muted mb-1">{playlist.description}</p>
            )}
            <p className="small text-muted mb-4">
              {(playlist.albums ?? []).length} album{playlist.albums?.length !== 1 ? 's' : ''}
              {playlist.created_at &&
                ` · Created ${new Date(playlist.created_at).toLocaleDateString()}`}
            </p>

            {/* Add album form — visible to logged-in users */}
            {isLoggedIn && availableAlbums.length > 0 && (
              <form onSubmit={handleAddAlbum} className="d-flex gap-2 mb-4">
                <select
                  className="form-select form-select-sm"
                  value={addAlbumId}
                  onChange={(e) => setAddAlbumId(e.target.value)}
                  style={{ maxWidth: 320 }}
                >
                  <option value="">— Add an album —</option>
                  {availableAlbums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} – {a.artist}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-sm btn-success"
                  disabled={!addAlbumId || adding}
                >
                  {adding ? 'Adding…' : 'Add'}
                </button>
              </form>
            )}

            {/* Album grid */}
            {(playlist.albums ?? []).length === 0 ? (
              <p className="text-muted">
                This playlist has no albums yet.
                {isLoggedIn ? ' Use the dropdown above to add some!' : ''}
              </p>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
                {(playlist.albums ?? []).map((album) => (
                  <div className="col" key={album.id}>
                    <div className="card h-100 shadow-sm">
                      {album.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.image}
                          className="card-img-top"
                          alt={album.title}
                          style={{ objectFit: 'cover', height: '180px' }}
                        />
                      )}
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{album.title}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">
                          {album.artist} ({album.year})
                        </h6>
                        <p className="card-text flex-grow-1 small">
                          {album.description ?? ''}
                        </p>
                        {/* Remove button — owner or admin */}
                        {canManage && (
                          <div className="mt-auto pt-2">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveAlbum(album.id)}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
