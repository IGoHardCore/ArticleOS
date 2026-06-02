'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Newspaper, Search, X } from 'lucide-react';
import { Article } from '@/lib/db';
import { NavRail } from '@/components/NavRail';
import { FlashCard } from '@/components/FlashCard';
import { ArticleDrawer } from '@/components/ArticleDrawer';
import { AIPanel } from '@/components/AIPanel';
import { OnboardingModal } from '@/components/OnboardingModal';
import { AllFeed } from '@/components/AllFeed';
import { TopPick } from '@/components/TopPick';
import { cn } from '@/lib/utils';

type FeedMode = 'recommended' | 'latest';
type View = 'cards' | 'feed';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FeedMode>('recommended');
  const [view, setView] = useState<View>('cards');
  const [drawerArticle, setDrawerArticle] = useState<Article | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topPickPeriod, setTopPickPeriod] = useState<'week' | 'month'>('week');
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const fetchArticles = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      let url = `/api/articles?mode=${mode}&limit=50&offset=0`;
      if (query.trim()) url = `/api/articles?q=${encodeURIComponent(query.trim())}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.articles || []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [mode, query]);

  useEffect(() => {
    fetchArticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (drawerArticle || view !== 'cards') return;
      if (e.key === 'ArrowRight' || e.key === 'j') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'k') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerArticle, view, index, articles.length]);

  function goNext() {
    if (index < articles.length - 1) {
      setDirection(1);
      setIndex(i => i + 1);
    }
  }

  function goPrev() {
    if (index > 0) {
      setDirection(-1);
      setIndex(i => i - 1);
    }
  }

  async function handleRefreshFeed() {
    setRefreshing(true);
    try {
      await fetch('/api/feed/refresh', { method: 'POST' });
      await fetchArticles();
    } finally {
      setRefreshing(false);
    }
  }

  const current = articles[index];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail
        onAIToggle={() => setAiOpen(o => !o)}
        aiOpen={aiOpen}
        onViewChange={setView}
        view={view}
      />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 ml-16 overflow-y-auto transition-all duration-300',
          aiOpen ? 'mr-80' : 'mr-0'
        )}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'recommended' ? 'For You' : 'Latest'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading…' : `${articles.length} articles`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => { setSearchActive(s => !s); if (searchActive) setQuery(''); }}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                  searchActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700'
                )}
              >
                {searchActive ? <X size={14} /> : <Search size={14} />}
              </button>

              {/* Mode toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
                <button
                  onClick={() => setMode('recommended')}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    mode === 'recommended' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <TrendingUp size={11} /> For You
                </button>
                <button
                  onClick={() => setMode('latest')}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    mode === 'latest' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Newspaper size={11} /> Latest
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchActive && (
              <div className="mb-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search articles…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            )}
          </AnimatePresence>

          {/* Flashcard view */}
          {view === 'cards' && (
            <>
              {/* Top pick */}
              {!query && mode === 'recommended' && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Top Pick</span>
                    <div className="flex items-center gap-0.5 ml-auto bg-white border border-slate-200 rounded-lg p-0.5">
                      {(['week', 'month'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setTopPickPeriod(p)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                            topPickPeriod === p ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-700'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <TopPick period={topPickPeriod} onArticleClick={setDrawerArticle} />
                </div>
              )}

              {/* Card */}
              {loading ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/4 mb-4" />
                  <div className="h-6 bg-slate-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              ) : articles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
                  <Newspaper size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 font-medium">No articles found</p>
                  <p className="text-slate-400 text-sm mt-1">Try refreshing the feed from the AI panel</p>
                </div>
              ) : (
                <div className="relative">
                  <AnimatePresence mode="wait" custom={direction}>
                    {current && (
                      <FlashCard
                        key={current.id}
                        article={current}
                        direction={direction}
                        onExpand={() => setDrawerArticle(current)}
                        onRate={() => {}}
                      />
                    )}
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-5">
                    <button
                      onClick={goPrev}
                      disabled={index === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors disabled:opacity-30 text-sm font-medium"
                    >
                      <ChevronLeft size={15} /> Prev
                    </button>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1">
                      {articles.slice(Math.max(0, index - 3), Math.min(articles.length, index + 4)).map((a, i) => {
                        const realIndex = Math.max(0, index - 3) + i;
                        return (
                          <button
                            key={a.id}
                            onClick={() => { setDirection(realIndex > index ? 1 : -1); setIndex(realIndex); }}
                            className={cn(
                              'rounded-full transition-all',
                              realIndex === index ? 'w-5 h-2 bg-indigo-500' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                            )}
                          />
                        );
                      })}
                    </div>

                    <button
                      onClick={goNext}
                      disabled={index >= articles.length - 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors disabled:opacity-30 text-sm font-medium"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>

                  <p className="text-center text-xs text-slate-400 mt-3">
                    {index + 1} / {articles.length} · Use ← → or J/K to navigate
                  </p>
                </div>
              )}
            </>
          )}

          {/* Feed view */}
          {view === 'feed' && (
            <AllFeed onArticleClick={setDrawerArticle} mode={mode} />
          )}
        </div>
      </main>

      {/* AI Panel */}
      <AIPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onRefreshFeed={handleRefreshFeed}
        refreshing={refreshing}
      />

      {/* Article Drawer */}
      <ArticleDrawer article={drawerArticle} onClose={() => setDrawerArticle(null)} />

      {/* Onboarding */}
      <OnboardingModal />
    </div>
  );
}
