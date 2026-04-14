-- Migration: replace broken Amazon CDN URLs and thumbnail URLs with
-- full-size Wikipedia image URLs for all Beatles albums.
-- Run once against your live Neon/Postgres database.

UPDATE albums SET image = 'https://upload.wikimedia.org/wikipedia/en/0/04/Revolver.jpg'
  WHERE id = 1;

UPDATE albums SET image = 'https://upload.wikimedia.org/wikipedia/en/c/ce/Rubber_Soul.jpg'
  WHERE id = 3;

UPDATE albums SET image = 'https://upload.wikimedia.org/wikipedia/en/b/b9/PleasePleaseMe.jpg'
  WHERE id = 4;

UPDATE albums SET image = 'https://upload.wikimedia.org/wikipedia/en/e/e7/Help%21_%28The_Beatles_album_-_cover_art%29.jpg'
  WHERE id = 7;

UPDATE albums SET image = 'https://upload.wikimedia.org/wikipedia/en/a/ac/TheBeatles-YellowSubmarinealbumcover.jpg'
  WHERE id = 11;
