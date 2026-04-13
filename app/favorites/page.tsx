'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import NavBar from '@/app/components/NavBar';
import { Album } from '@/lib/types';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/favorites');
      if (res.status === 401) { setError('auth'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFavorites(data.albums ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { setLoading(false); return; }
    loadFavorites();
  }, [session, status, loadFavorites]);

  const handleRemove = async (albumId: number) => {
    try {
      const res = await fetch(`/api/favorites?albumId=${albumId}`, { method: 'DELETE' });
      if (res.ok) setFavorites((prev) => prev.filter((a) => a.id !== albumId));
    } catch { alert('Failed to remove. Please try again.'); }
  };

  /* ── Guest view ───────────────────────────────────────── */
  if (status !== 'loading' && !session) {
    return (
      <>
        <NavBar />
        <div
          style={{
            textAlign: 'center',
            padding: '6rem 1rem',
            background: 'linear-gradient(180deg, #f4f7fc 0%, #fff 100%)',
            minHeight: 'calc(100vh - 65px)',
          }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: .35 }}>♡</div>
          <h2 style={{ color: '#0d1f3c', marginBottom: '.5rem' }}>Your Favorites</h2>
          <p style={{ color: '#5a6a82', marginBottom: '1.5rem', fontSize: '.95rem' }}>
            Sign in to save albums you love and access them anytime.
          </p>
          <button
            className="btn btn-primary"
            style={{ padding: '.6rem 1.8rem', fontSize: '.9rem' }}
            onClick={() => signIn('github')}
          >
            Sign In with GitHub
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />

      {/* ── Page header ──────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)',
          borderBottom: '3px solid #f5c518',
          padding: '2.2rem 0 1.6rem',
          marginBottom: '2rem',
        }}
      >
        <div className="container">
          <h1 style={{ color: '#fff', marginBottom: '.2rem', fontSize: '1.9rem' }}>
            ♥ Your Favorites
          </h1>
          <p style={{ color: 'rgba(255,255,255,.65)', margin: 0, fontSize: '.92rem' }}>
            {favorites.length > 0
              ? `${favorites.length} album${favorites.length !== 1 ? 's' : ''} saved`
              : 'Albums you love, all in one place'}
          </p>
        </div>
      </div>

      <main className="container" style={{ paddingBottom: '3rem' }}>
        {error && error !== 'auth' && <div className="alert alert-danger">{error}</div>}
        {loading && <p style={{ color: '#5a6a82' }}>Loading favorites…</p>}

        {/* ── Empty state ───────────────────────── */}
        {!loading && !error && favorites.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                margin: '0 auto 1.25rem',
              }}
            >
              ♡
            </div>
            <h4 style={{ color: '#0d1f3c', marginBottom: '.5rem' }}>No favorites yet</h4>
            <p style={{ color: '#5a6a82', fontSize: '.9rem', maxWidth: 320, margin: '0 auto 1.5rem' }}>
              Head to the home page and click the ♡ on any album to save it here.
            </p>
            <a href="/" className="btn btn-primary" style={{ padding: '.5rem 1.5rem' }}>
              Browse Albums
            </a>
          </div>
        )}

        {/* ── Favorites grid ────────────────────── */}
        {!loading && favorites.length > 0 && (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {favorites.map((album) => (
              <div className="col" key={album.id}>
                <div
                  className="card h-100"
                  style={{ borderTop: '3px solid #e11d48', borderRadius: 12 }}
                >
                  {album.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.image}
                      className="card-img-top"
                      alt={album.title}
                      style={{ objectFit: 'cover', height: 170 }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 170,
                        background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: '#fca5a5',
                      }}
                    >
                      ♫
                    </div>
                  )}
                  <div className="card-body d-flex flex-column" style={{ padding: '1rem 1.1rem' }}>
                    <h5
                      className="card-title"
                      style={{ fontSize: '.94rem', fontWeight: 700, color: '#0d1f3c' }}
                    >
                      {album.title}
                    </h5>
                    <p style={{ fontSize: '.78rem', color: '#5a6a82', margin: '0 0 .5rem' }}>
                      {album.artist} · {album.year}
                    </p>
                    <div className="mt-auto">
                      <button
                        className="btn btn-sm"
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: 6,
                          fontSize: '.78rem',
                          padding: '.3rem .9rem',
                          fontWeight: 600,
                          width: '100%',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.background = '#dc2626';
                          (e.target as HTMLButtonElement).style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.background = '#fef2f2';
                          (e.target as HTMLButtonElement).style.color = '#dc2626';
                        }}
                        onClick={() => handleRemove(album.id)}
                      >
                        ♥ Remove from Favorites
                      </button>
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
