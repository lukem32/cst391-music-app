'use client';

// app/components/NavBar.tsx
// Role-aware navigation bar.
// Guest:  About, Sign In
// User:   Playlists, Favorites, About, Sign Out
// Admin:  New Album, Playlists, Favorites, Admin Dashboard, About, Sign Out

import Link from 'next/link';
import { useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function NavBar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const isLoggedIn = !!session;

  useEffect(() => {
    // @ts-expect-error: Bootstrap's JavaScript bundle lacks TypeScript definitions.
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      {/* Brand links to home page */}
      <Link href="/" className="navbar-brand">
        My Music
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div className="navbar-nav">

          {/* New Album — admin only */}
          {isAdmin && (
            <Link href="/new" className="nav-item nav-link">
              New Album
            </Link>
          )}

          {/* Playlists — visible to all logged-in users */}
          {isLoggedIn && (
            <Link href="/playlists" className="nav-item nav-link">
              Playlists
            </Link>
          )}

          {/* Favorites — visible to all logged-in users */}
          {isLoggedIn && (
            <Link href="/favorites" className="nav-item nav-link">
              ♥ Favorites
            </Link>
          )}

          {/* Admin Dashboard — admin only */}
          {isAdmin && (
            <Link href="/admin/favorites" className="nav-item nav-link">
              Admin Dashboard
            </Link>
          )}

          <Link href="/about" className="nav-item nav-link">
            About
          </Link>

          {/* Auth */}
          {session ? (
            <button
              className="nav-item nav-link btn btn-link"
              style={{ cursor: 'pointer' }}
              onClick={() => signOut()}
            >
              Sign Out ({session.user?.name})
            </button>
          ) : (
            <button
              className="nav-item nav-link btn btn-link"
              style={{ cursor: 'pointer' }}
              onClick={() => signIn('github')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
