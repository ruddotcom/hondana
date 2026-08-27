-- honDana — Cloudflare D1 (SQLite) schema.
--
-- Apply it with:
--   npx wrangler d1 execute hondana --local  --file=./schema.sql
--   npx wrangler d1 execute hondana --remote --file=./schema.sql
--
-- Re-running is safe: every statement is CREATE ... IF NOT EXISTS.

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────── accounts ──
-- COLLATE NOCASE on email is what makes one address mean one account:
-- Bob@Example.com and bob@example.com collide on the UNIQUE index, so the
-- second signup is rejected by the database itself, not by app code that
-- someone might forget to run.
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,               -- uuid
  email              TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified     INTEGER NOT NULL DEFAULT 0,
  password_hash      TEXT,                           -- scrypt/argon2; NULL for OAuth-only
  username           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  country            TEXT NOT NULL DEFAULT 'United States',
  bio                TEXT,
  avatar_url         TEXT,
  avatar_color       TEXT,
  is_private         INTEGER NOT NULL DEFAULT 0,

  -- billing
  plan               TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  plan_interval      TEXT CHECK (plan_interval IN ('monthly','yearly')),
  auto_renew         INTEGER NOT NULL DEFAULT 1,
  current_period_end INTEGER,                        -- unix seconds
  stripe_customer_id TEXT UNIQUE,

  created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at       INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email COLLATE NOCASE);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE);

-- Sessions live in their own table so signing out of one device doesn't
-- sign you out everywhere, and so tokens can expire.
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,                       -- random 32+ bytes, hashed
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

-- Single-use, one hour, hashed. Never store the raw token.
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

CREATE TABLE IF NOT EXISTS email_verifications (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- ──────────────────────────────────────────────────────────────  catalogue ──
CREATE TABLE IF NOT EXISTS series (
  id           TEXT PRIMARY KEY,
  work         TEXT NOT NULL,                        -- links editions of one story
  edition      TEXT NOT NULL DEFAULT 'Standard',
  format       TEXT,
  title        TEXT NOT NULL,
  title_jp     TEXT,
  author       TEXT,
  publisher    TEXT,
  publisher_en TEXT,
  genres       TEXT,                                 -- pipe-separated
  volumes      INTEGER NOT NULL,
  en_volumes   INTEGER NOT NULL,
  status       TEXT,
  year         INTEGER,
  color        TEXT,
  blurb        TEXT,
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS series_work ON series(work);
CREATE INDEX IF NOT EXISTS series_title ON series(title);

CREATE TABLE IF NOT EXISTS volumes (
  isbn13    TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  volume    INTEGER NOT NULL,
  cover_key TEXT,                                    -- R2 key: 600/9781974709939.webp
  released  TEXT,
  UNIQUE (series_id, volume)
);

-- ──────────────────────────────────────────────────────────────── pricing ──
CREATE TABLE IF NOT EXISTS offers (
  isbn13     TEXT NOT NULL,
  country    TEXT NOT NULL,
  shop       TEXT NOT NULL,
  price      REAL NOT NULL,
  currency   TEXT NOT NULL,
  in_stock   INTEGER NOT NULL DEFAULT 1,
  url        TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  PRIMARY KEY (isbn13, country, shop)
);
CREATE INDEX IF NOT EXISTS offers_lookup ON offers(isbn13, country);

CREATE TABLE IF NOT EXISTS offer_history (
  isbn13  TEXT NOT NULL,
  country TEXT NOT NULL,
  day     TEXT NOT NULL,                             -- YYYY-MM-DD
  low     REAL NOT NULL,
  shop    TEXT NOT NULL,
  PRIMARY KEY (isbn13, country, day)
);

-- ───────────────────────────────────────────────────────────────── shelves ──
CREATE TABLE IF NOT EXISTS collection (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL,
  volume    INTEGER NOT NULL,
  status    TEXT NOT NULL CHECK (status IN ('owned','wishlist')),
  target    REAL,                                    -- premium price target
  added_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, series_id, volume, status)
);
CREATE INDEX IF NOT EXISTS collection_user ON collection(user_id);
CREATE INDEX IF NOT EXISTS collection_targets ON collection(status, target) WHERE target IS NOT NULL;

CREATE TABLE IF NOT EXISTS series_prefs (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id  TEXT NOT NULL,
  followed   INTEGER NOT NULL DEFAULT 0,
  cover_out  INTEGER,
  sort_index INTEGER,
  PRIMARY KEY (user_id, series_id)
);

CREATE TABLE IF NOT EXISTS favourites (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot      INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
  series_id TEXT NOT NULL,
  volume    INTEGER,                                 -- set on the favourite-volume row
  PRIMARY KEY (user_id, slot)
);

-- ────────────────────────────────────────────────────────────────── social ──
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX IF NOT EXISTS follows_followee ON follows(followee_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                          -- follow | release | price | export
  body       TEXT NOT NULL,
  actor_id   TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, read);
