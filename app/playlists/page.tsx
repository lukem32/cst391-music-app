// app/playlists/page.tsx
// Playlists listing page.
// Guests: read-only view
// Logged-in users: can create new playlists + see their own playlists' edit/delete
// Admins: can edit/delete any playlist

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import { Playlist } from '@/lib/types';

export default function PlaylistsPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === 'admin';

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const loadPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlaylists(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNewTitle('');
      setNewDesc('');
      setShowForm(false);
      await loadPlaylists();
    } catch (err) {
      alert('Failed to create playlist: ' + (err instanceof Error ? err.message : err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (playlistId: number) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      const res = await fetch(`/api/playlists?playlistId=${playlistId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : err));
    }
  };

  const canManage = (playlist: Playlist) =>
    isAdmin || playlist.user_email === session?.user?.email;

  return (
    <>
      <NavBar />
      <main className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h1>Playlists</h1>
          {isLoggedIn && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Cancel' : '+ New Playlist'}
            </button>
          )}
        </div>
        <p className="text-muted mb-4">Browse and manage playlists.</p>

        {/* Create playlist form */}
        {showForm && (
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Create New Playlist</h5>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-control"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Playlist title"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Optional description…"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create Playlist'}
                </button>
              </form>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p>Loading playlists…</p>}

        {!loading && playlists.length === 0 && (
          <p className="text-muted">No playlists yet.{isLoggedIn ? ' Create one above!' : ''}</p>
        )}

        {!loading && playlists.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {playlists.map((pl) => (
              <div className="col" key={pl.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="card-title mb-0">
                        <Link
                          href={`/playlists/${pl.id}`}
                          className="text-decoration-none text-dark"
                        >
                          {pl.title}
                        </Link>
                      </h5>
                      <span className="badge bg-secondary ms-2">
                        {pl.album_count ?? 0} albums
                      </span>
                    </div>
                    {pl.description && (
                      <p className="card-text text-muted small mt-1 flex-grow-1">
                        {pl.description}
                      </p>
                    )}
                    <div className="mt-auto pt-2 d-flex gap-2">
                      <Link
                        href={`/playlists/${pl.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </Link>
                      {canManage(pl) && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(pl.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
