-- ChemLab AI database schema (NeonDB Postgres)

CREATE TABLE IF NOT EXISTS reaction_cache (
  pair_key   TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  source     TEXT NOT NULL DEFAULT 'ai',
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discovered_reactions (
  id            SERIAL PRIMARY KEY,
  student_name  VARCHAR(40) NOT NULL,
  pair_key      TEXT NOT NULL,
  equation      TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_name, pair_key)
);
CREATE INDEX IF NOT EXISTS idx_discovered_student ON discovered_reactions (student_name);

CREATE TABLE IF NOT EXISTS rate_limit (
  ip           TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INT NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, window_start)
);

CREATE TABLE IF NOT EXISTS lesson_content (
  id             SERIAL PRIMARY KEY,
  lesson_id      TEXT,
  owner_user_id  TEXT,
  grade          TEXT,
  subject        TEXT DEFAULT 'chemistry',
  source         TEXT NOT NULL DEFAULT 'ai',
  kind           TEXT NOT NULL DEFAULT 'lab',
  bundle_id      TEXT,
  file_name      TEXT,
  payload        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'lab';
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'chemistry';
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS bundle_id TEXT;
ALTER TABLE lesson_content ALTER COLUMN lesson_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson ON lesson_content (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_kind ON lesson_content (lesson_id, kind);
CREATE INDEX IF NOT EXISTS idx_lesson_content_owner ON lesson_content (owner_user_id, grade, subject, kind);
CREATE INDEX IF NOT EXISTS idx_lesson_content_bundle ON lesson_content (owner_user_id, bundle_id, kind);
