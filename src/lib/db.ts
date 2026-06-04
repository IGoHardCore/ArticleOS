import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForDb = globalThis as unknown as { _supabase: SupabaseClient | undefined };

export const db = globalForDb._supabase ?? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

if (process.env.NODE_ENV !== 'production') globalForDb._supabase = db;

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
