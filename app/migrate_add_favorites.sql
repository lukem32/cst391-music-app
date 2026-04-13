-- ============================================================
-- Migration: Add favorites feature to existing database
-- Run this if your database already has the albums/playlists
-- tables and you just need to add the new favorites table
-- and the user_email column to playlists.
-- ============================================================

-- 1. Add user_email to playlists (safe, nullable — won't break existing rows)
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS "user_email" varchar(255) DEFAULT NULL;

-- 2. Create the favorites table
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" SERIAL,
  "user_email" varchar(255) NOT NULL,
  "album_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT NOW(),
  PRIMARY KEY ("id"),
  CONSTRAINT fav_album_fk FOREIGN KEY ("album_id")
    REFERENCES "albums" ("id") ON DELETE CASCADE,
  CONSTRAINT unique_user_album_fav UNIQUE ("user_email", "album_id")
);

CREATE INDEX IF NOT EXISTS "fav_user_idx" ON "favorites" ("user_email");
CREATE INDEX IF NOT EXISTS "fav_album_idx" ON "favorites" ("album_id");
