// app/admin/favorites/page.tsx
// Admin-only dashboard: shows per-album favorite counts and engagement metrics.

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import { AdminFavoriteStat } from '@/lib/types';

interface AdminFavData {
  stats: AdminFavoriteStat[];
  totalFavUsers: number;
  totalFavorites: number;
}

export default function AdminFavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminFavData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect non-admins
    if (!session) {
      router.push('/');
      return;
    }
    if (session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetch('/api/admin/favorites')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  // Loading / redirect
  if (status === 'loading' || (!session && status !== 'loading')) {
    return (
      <>
        <NavBar />
        <main className="container mt-4">
          <p>Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="container mt-4">
        <h1 className="mb-1">Admin Dashboard</h1>
        <p className="text-muted mb-4">User engagement with favorites.</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p>Loading data…</p>}

        {!loading && data && (
          <>
            {/* Summary cards */}
            <div className="row g-3 mb-4">
              <div className="col-sm-4">
                <div className="card text-center border-0 bg-light">
                  <div className="card-body">
                    <h2 className="mb-0 text-danger">{data.totalFavorites}</h2>
                    <p className="text-muted mb-0 small">Total Favorites</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="card text-center border-0 bg-light">
                  <div className="card-body">
                    <h2 className="mb-0 text-primary">{data.totalFavUsers}</h2>
                    <p className="text-muted mb-0 small">Users with Favorites</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="card text-center border-0 bg-light">
                  <div className="card-body">
                    <h2 className="mb-0 text-success">
                      {data.stats.filter((s) => s.favorite_count > 0).length}
                    </h2>
                    <p className="text-muted mb-0 small">Albums Favorited</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-album table */}
            <h5 className="mb-3">Albums by Popularity</h5>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Album</th>
                    <th>Artist</th>
                    <th className="text-center">♥ Favorites</th>
                    <th>Popularity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats.map((stat, idx) => {
                    const maxCount = data.stats[0]?.favorite_count || 1;
                    const pct = Math.round((stat.favorite_count / maxCount) * 100);
                    return (
                      <tr key={stat.album_id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {stat.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={stat.image}
                                alt={stat.title}
                                width={36}
                                height={36}
                                style={{ objectFit: 'cover', borderRadius: 4 }}
                              />
                            )}
                            <span>{stat.title}</span>
                          </div>
                        </td>
                        <td>{stat.artist}</td>
                        <td className="text-center">
                          <span
                            className={`badge ${
                              stat.favorite_count > 0
                                ? 'bg-danger'
                                : 'bg-secondary'
                            }`}
                          >
                            {stat.favorite_count}
                          </span>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <div
                            className="progress"
                            style={{ height: 8 }}
                            title={`${pct}%`}
                          >
                            <div
                              className="progress-bar bg-danger"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
