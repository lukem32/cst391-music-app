-- ============================================================
-- CST-391 Music App  –  Full schema (run once to reset)
-- ============================================================

-- Albums table
DROP TABLE IF EXISTS "albums" CASCADE;
CREATE TABLE "albums" (
  "id" SERIAL,
  "title" varchar(100) NOT NULL,
  "artist" varchar(100) NOT NULL,
  "year" integer NOT NULL,
  "image" varchar(300) DEFAULT NULL,
  "description" varchar(500) DEFAULT NULL,
  PRIMARY KEY ("id")
);

-- Insert albums
INSERT INTO "albums" VALUES
    (1,'Revolver','The Beatles',1966,'https://m.media-amazon.com/images/I/91ffeWzPNpL._SL1500_.jpg','Revolver is the seventh studio albums by the English rock band the Beatles.'),
    (3,'Rubber Soul','The Beatles',1965,'https://m.media-amazon.com/images/I/81EF5zXRFdL._SL1500_.jpg','Rubber Soul is the sixth studio albums by the English rock band the Beatles.'),
    (4,'Please Please Me','The Beatles',1963,'https://m.media-amazon.com/images/I/61LdKbic+wL.jpg','Please Please Me is the debut studio albums by the English rock band the Beatles.'),
    (5,'With the Beatles','The Beatles',1963,'https://upload.wikimedia.org/wikipedia/en/0/0a/Withthebeatlescover.jpg','With the Beatles is the second studio albums by the English rock band the Beatles.'),
    (6,'A Hard Day''s Night','The Beatles',1964,'https://upload.wikimedia.org/wikipedia/en/e/e6/HardDayUK.jpg','A Hard Day''s Night is the third studio albums by the English rock band the Beatles.'),
    (7,'Help!','The Beatles',1965,'https://upload.wikimedia.org/wikipedia/en/thumb/e/e7/Help%21_%28The_Beatles_album_-_cover_art%29.jpg/220px-Help%21_%28The_Beatles_album_-_cover_art%29.jpg','Help! is the fifth studio albums by English rock band the Beatles.'),
    (8,'Sgt. Pepper''s Lonely Hearts Club Band','The Beatles',1967,'https://upload.wikimedia.org/wikipedia/en/5/50/Sgt._Pepper%27s_Lonely_Hearts_Club_Band.jpg','Sgt. Pepper''s Lonely Hearts Club Band is the eighth studio albums by the English rock band the Beatles.'),
    (9,'Magical Mystery Tour','The Beatles',1967,'https://upload.wikimedia.org/wikipedia/en/e/e8/MagicalMysteryTourDoubleEPcover.jpg','Magical Mystery Tour is an albums by the English rock band the Beatles.'),
    (10,'The Beatles (White albums)','The Beatles',1968,'https://upload.wikimedia.org/wikipedia/commons/2/20/TheBeatles68LP.jpg','The Beatles, also known as "The White albums", is the ninth studio albums by the English rock band the Beatles.'),
    (11,'Yellow Submarine','The Beatles',1969,'https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/TheBeatles-YellowSubmarinealbumcover.jpg/220px-TheBeatles-YellowSubmarinealbumcover.jpg','Yellow Submarine is the tenth studio albums by English rock band the Beatles.'),
    (12,'Abbey Road','The Beatles',1969,'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg','Abbey Road is the eleventh studio albums by English rock band the Beatles.'),
    (13,'Let It Be','The Beatles',1970,'https://upload.wikimedia.org/wikipedia/en/2/25/LetItBe.jpg','Let It Be is the twelfth and final studio albums by the English rock band the Beatles.');

-- Tracks table
DROP TABLE IF EXISTS "tracks";
CREATE TABLE "tracks" (
  "id" SERIAL,
  "album_id" integer NOT NULL,
  "title" varchar(100) NOT NULL,
  "number" integer NOT NULL,
  "video_url" varchar(250) DEFAULT NULL,
  "lyrics" varchar(1000) DEFAULT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "albums_id_FK" FOREIGN KEY ("album_id") REFERENCES "albums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- (Insert your tracks here as before...)
-- skipping for brevity, keep your original INSERT INTO "tracks"

CREATE INDEX IF NOT EXISTS "album_id_FK_idx" ON "tracks" ("album_id");
SELECT setval('albums_id_seq', (SELECT COALESCE(MAX(id),1) FROM "albums"));
SELECT setval('tracks_id_seq', (SELECT COALESCE(MAX(id),1) FROM "tracks"));

-- ============================================================
-- Playlists
-- ============================================================
DROP TABLE IF EXISTS "playlist_albums";
DROP TABLE IF EXISTS "playlists";

CREATE TABLE IF NOT EXISTS "playlists" (
  "id" SERIAL,
  "title" varchar(200) NOT NULL,
  "description" varchar(500) DEFAULT NULL,
  "user_email" varchar(255) DEFAULT NULL,   -- NULL = legacy / seed data
  "created_at" timestamptz DEFAULT NOW(),
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "playlist_albums" (
  "id" SERIAL,
  "playlist_id" integer NOT NULL,
  "album_id" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT playlist_fk FOREIGN KEY ("playlist_id") REFERENCES "playlists" ("id") ON DELETE CASCADE,
  CONSTRAINT album_fk FOREIGN KEY ("album_id") REFERENCES "albums" ("id") ON DELETE CASCADE,
  CONSTRAINT unique_playlist_album UNIQUE ("playlist_id", "album_id")
);

CREATE INDEX IF NOT EXISTS "playlist_id_idx" ON "playlist_albums" ("playlist_id");
CREATE INDEX IF NOT EXISTS "album_id_idx" ON "playlist_albums" ("album_id");
SELECT setval('playlists_id_seq', (SELECT COALESCE(MAX(id),1) FROM "playlists"));
SELECT setval('playlist_albums_id_seq', (SELECT COALESCE(MAX(id),1) FROM "playlist_albums"));

-- Sample playlists (no user_email = shared/seed data)
INSERT INTO playlists (title, description) VALUES
  ('Best of The Beatles', 'Top hits from The Beatles'),
  ('Classic Albums', 'Essential Beatles albums to listen to'),
  ('Chill Beatles', 'Relaxing Beatles music');

-- Associate albums to playlists
INSERT INTO playlist_albums (playlist_id, album_id) VALUES
  (1,1), (1,3), (1,4), (1,5), (1,6),
  (2,7), (2,8), (2,9), (2,10), (2,11),
  (3,12), (3,13);

-- ============================================================
-- Favorites  (Milestone 2 / 5 new feature)
-- ============================================================
DROP TABLE IF EXISTS "favorites";

CREATE TABLE "favorites" (
  "id" SERIAL,
  "user_email" varchar(255) NOT NULL,
  "album_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT NOW(),
  PRIMARY KEY ("id"),
  CONSTRAINT fav_album_fk FOREIGN KEY ("album_id")
    REFERENCES "albums" ("id") ON DELETE CASCADE,
  -- A user can only favorite a given album once
  CONSTRAINT unique_user_album_fav UNIQUE ("user_email", "album_id")
);

CREATE INDEX IF NOT EXISTS "fav_user_idx" ON "favorites" ("user_email");
CREATE INDEX IF NOT EXISTS "fav_album_idx" ON "favorites" ("album_id");
SELECT setval('favorites_id_seq', (SELECT COALESCE(MAX(id),1) FROM "favorites"));

-- ============================================================
-- Migration: add user_email column to existing playlists table
-- (run only if applying to an already-existing database)
-- ============================================================
-- ALTER TABLE playlists ADD COLUMN IF NOT EXISTS "user_email" varchar(255) DEFAULT NULL;
