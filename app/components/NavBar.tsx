'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function NavBar() {
  useEffect(() => {
    // @ts-expect-error: Bootstrap's JavaScript bundle lacks TypeScript definitions.
    // This dynamic import loads Bootstrap's collapse, dropdown, and modal functionality on the client.
    // Safe to ignore the type error because this runs only in the browser and does not affect SSR.
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <span className="navbar-brand">My Music</span>
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
          <Link href="/" className="nav-item nav-link">
            Main
          </Link>
          <Link href="/new" className="nav-item nav-link">
            New
          </Link>
          <Link href="/about" className="nav-item nav-link">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
