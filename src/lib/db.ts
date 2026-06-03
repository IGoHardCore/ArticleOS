import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'articleos.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      summary TEXT,
      source TEXT,
      author TEXT,
      image_url TEXT,
      published_at TEXT,
      scraped_at TEXT DEFAULT (datetime('now')),
      full_text TEXT,
      bookmarked INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS research_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'done', 'paused')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      tags TEXT DEFAULT '[]',
      linked_articles TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ratings_article ON ratings(article_id);
    CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
    CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);
  `);

  // Migrate: add bookmarked column to existing DBs
  try { db.exec('ALTER TABLE articles ADD COLUMN bookmarked INTEGER NOT NULL DEFAULT 0'); } catch { /* already exists */ }

  const tagColors: Record<string, string> = {
    cancer: '#ef4444',
    cardiology: '#f97316',
    neurology: '#a855f7',
    pharmacology: '#3b82f6',
    'drug approval': '#06b6d4',
    oncology: '#ec4899',
    diabetes: '#84cc16',
    immunology: '#f59e0b',
    genetics: '#8b5cf6',
    'clinical trial': '#14b8a6',
    surgery: '#f43f5e',
    psychiatry: '#6366f1',
    pediatrics: '#22c55e',
    'infectious disease': '#eab308',
    radiology: '#64748b',
    pharmacy: '#0ea5e9',
    'breakthrough': '#ff6b35',
    'FDA': '#dc2626',
    'research': '#7c3aed',
    'public health': '#059669',
  };

  const insertTag = db.prepare(
    'INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)'
  );
  for (const [name, color] of Object.entries(tagColors)) {
    insertTag.run(name, color);
  }
}

export interface Article {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  source: string | null;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  scraped_at: string;
  full_text: string | null;
  bookmarked?: number;
  tags?: Tag[];
  avg_rating?: number;
  rating_count?: number;
  user_rating?: number;
  score?: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface ResearchNote {
  id: number;
  title: string;
  content: string;
  status: 'active' | 'done' | 'paused';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  linked_articles: number[];
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}
