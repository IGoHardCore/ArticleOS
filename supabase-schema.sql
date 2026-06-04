-- ArticleOS — Supabase Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → Paste & Run

CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  summary TEXT,
  source TEXT,
  author TEXT,
  image_url TEXT,
  published_at TEXT,
  scraped_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  full_text TEXT,
  bookmarked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clerk_user_id TEXT
);

CREATE TABLE IF NOT EXISTS research_notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'done', 'paused')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  tags TEXT DEFAULT '[]',
  linked_articles TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  clerk_user_id TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  clerk_user_id TEXT NOT NULL,
  article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, article_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  clerk_user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (clerk_user_id, key)
);

-- Disable RLS (app uses Clerk for auth, not Supabase Auth)
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_article ON ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(clerk_user_id);

-- Seed tags
INSERT INTO tags (name, color) VALUES
  ('cancer', '#ef4444'),
  ('cardiology', '#f97316'),
  ('neurology', '#a855f7'),
  ('pharmacology', '#3b82f6'),
  ('drug approval', '#06b6d4'),
  ('oncology', '#ec4899'),
  ('diabetes', '#84cc16'),
  ('immunology', '#f59e0b'),
  ('genetics', '#8b5cf6'),
  ('clinical trial', '#14b8a6'),
  ('surgery', '#f43f5e'),
  ('psychiatry', '#6366f1'),
  ('pediatrics', '#22c55e'),
  ('infectious disease', '#eab308'),
  ('radiology', '#64748b'),
  ('pharmacy', '#0ea5e9'),
  ('breakthrough', '#ff6b35'),
  ('FDA', '#dc2626'),
  ('research', '#7c3aed'),
  ('public health', '#059669')
ON CONFLICT (name) DO NOTHING;

-- ── Chat sessions (persistent AI conversation history) ────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT      NOT NULL,
  title       TEXT        NOT NULL DEFAULT 'New Chat',
  messages    JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON chat_sessions (clerk_user_id, updated_at DESC);
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
