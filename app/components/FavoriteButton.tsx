// app/components/FavoriteButton.tsx
// Heart toggle button for favoriting an album.
// Syncs with the parent's initialFavorited prop so that async-loaded
// favorite state (from page.tsx) is reflected after the button mounts.

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FavoriteButtonProps {
  albumId: number;
  initialFavorited: boolean;
  onToggle?: (albumId: number, newState: boolean) => void;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({
  albumId,
  initialFavorited,
  onToggle,
  size = 'sm',
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // KEY FIX: sync local state when the parent finishes loading favorites.
  // useState(initialFavorited) only uses the prop on first mount, so when
  // page.tsx asynchronously loads favorite IDs and re-renders with
  // initialFavorited=true, this effect picks that up.
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  // Only logged-in users see the favorite button
  if (!session?.user?.email) return null;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger card click
    if (loading) return;
    setLoading(true);
    setErrMsg(null);

    // Optimistic update
    const newState = !favorited;
    setFavorited(newState);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          detail = body?.error ?? detail;
        } catch { /* ignore */ }
        console.error(`Favorite toggle failed: ${detail}`);
        setErrMsg(detail);
        setFavorited(!newState); // revert
      } else {
        onToggle?.(albumId, newState);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('Favorite toggle error:', msg);
      setErrMsg(msg);
      setFavorited(!newState); // revert
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'sm' ? '1rem' : '1.25rem';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={errMsg ?? (favorited ? 'Remove from favorites' : 'Add to favorites')}
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        padding: '2px 4px',
        fontSize: iconSize,
        lineHeight: 1,
        color: errMsg ? '#dc3545' : favorited ? '#e0245e' : '#aaa',
        transition: 'color 0.15s, transform 0.1s',
        transform: loading ? 'scale(0.9)' : 'scale(1)',
      }}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {errMsg ? '⚠' : favorited ? '♥' : '♡'}
    </button>
  );
}
