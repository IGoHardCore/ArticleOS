import postgres from 'postgres';

// Global singleton prevents multiple connections during dev hot-reload
const globalForDb = globalThis as unknown as { sql: ReturnType<typeof postgres> | undefined };

export const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL!, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

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
