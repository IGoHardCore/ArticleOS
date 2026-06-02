'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Newspaper, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { Article } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { TopPick } from '@/components/TopPick';
import { cn } from '@/lib/utils';

type FeedMode = 'recommended' | 'latest';
type TopPickPeriod = 'week' | 'month';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FeedMode>('recommended');
  const [period, setPeriod] = useState<TopPickPeriod>('week');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchArticles = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      let url = `/api/articles?mode=${mode}&limit=20&offset=${currentOffset}`;
      if (query) url = `/api/articles?q=${encodeURIComponent(query)}&tag=${activeTag}`;
      else if (activeTag) url = `/api/articles?mode=by-tag&tag=${encodeURIComponent(activeTag)}&limit=20&offset=${currentOffset}`;
      const res = await fetch(url);
      const data = await res.json();
      const newArticles: Article[] = data.articles || [];
      if (reset) {
        setArticles(newArticles);
        setOffset(20);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setOffset(prev => prev + 20);
      }
      setHasMore(newArticles.length === 20);
    } finally {
      setLoading(false);
    }
  }, [mode, query, activeTag, offset]);

  useEffect(() => {
    setOffset(0);
    fetchArticles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query, activeTag]);

  function handleTagFilter(tag: string) {
    setActiveTag(tag);
    setQuery('');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onTagFilter={handleTagFilter} activeTag={activeTag} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {activeTag ? `#${activeTag}` : mode === 'recommended' ? 'For You' : 'Latest'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {activeTag ? `Articles tagged with "${activeTag}"` : mode === 'recommended' ? 'Personalized based on your ratings' : 'Most recent articles'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => { setMode('recommended'); setActiveTag(''); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  mode === 'recommended' && !activeTag ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <TrendingUp size={12} /> For You
              </button>
              <button
                onClick={() => { setMode('latest'); setActiveTag(''); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  mode === 'latest' && !activeTag ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Newspaper size={12} /> Latest
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveTag(''); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {!query && !activeTag && mode === 'recommended' && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal size={14} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top Pick</span>
                <div className="flex items-center gap-1 ml-auto bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {(['week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                        period === p ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <TopPick period={period} />
            </div>
          )}

          {loading && articles.length === 0 ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
                  <div className="h-3 bg-slate-800 rounded w-1/4 mb-3" />
                  <div className="h-5 bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-full mb-1" />
                  <div className="h-3 bg-slate-800 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper size={40} className="mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 text-lg font-medium">No articles yet</p>
              <p className="text-slate-600 text-sm mt-1">Click &quot;Refresh Feed&quot; in the sidebar to fetch articles</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} onTagClick={handleTagFilter} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => fetchArticles(false)}
                    disabled={loading}
                    className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
