'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Search, X } from 'lucide-react';
import { Article } from '@/lib/db';
import { NavRail } from '@/components/NavRail';
import { FlashCard } from '@/components/FlashCard';
import { ArticleDrawer } from '@/components/ArticleDrawer';
import { AIAssistant } from '@/components/AIAssistant';
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
  const [topPickPeriod, setTopPickPeriod] = useState<'week' | 'month'>('week');
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const url = query.trim()
        ? `/api/articles?q=${encodeURIComponent(query.trim())}&limit=50`
        : `/api/articles?mode=${mode}&limit=50&offset=0`;
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.articles || []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [mode, query]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Keyboard nav for cards view
  useEffect(() => {
    if (view !== 'cards' || drawerArticle) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'j') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'k') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, drawerArticle, index, articles.length]);

  function goNext() {
    if (index < articles.length - 1) { setDirection(1); setIndex(i => i + 1); }
  }
  function goPrev() {
    if (index > 0) { setDirection(-1); setIndex(i => i - 1); }
  }

  const current = articles[index];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail view={view} onViewChange={setView} />

      <main className="flex-1 ml-16 overflow-y-auto">

        {/* ─── Top bar ─── */}
        <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 px-5 py-3 flex items-center gap-3 pr-24">
          {/* Mode toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              onClick={() => setMode('recommended')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                mode === 'recommended' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <TrendingUp size={11} /> For You
            </button>
            <button
              onClick={() => setMode('latest')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                mode === 'latest' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Clock size={11} /> Latest
            </button>
          </div>

          {/* Search */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {searchActive ? (
                <motion.div
                  key="search-input"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search articles…"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all"
                  />
                  <button onClick={() => { setSearchActive(false); setQuery(''); }} className="text-slate-400 hover:text-slate-700">
                    <X size={15} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSearchActive(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Search size={13} /> Search
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Cards View ─── */}
        {view === 'cards' && (
          <div className="max-w-xl mx-auto px-4 py-6">
            {/* Top Pick */}
            {!query && mode === 'recommended' && (
              <div className="mb-6">
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

            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-1/4 mb-5" />
                <div className="h-6 bg-slate-100 rounded w-4/5 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ) : articles.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
                <p className="text-slate-500 font-medium">No articles found</p>
                <p className="text-slate-400 text-sm mt-1">Try refreshing the feed or adjusting your search</p>
              </div>
            ) : (
              <>
                {/* Side arrows layout */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goPrev}
                    disabled={index === 0}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-25 shadow-sm flex-shrink-0"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait" custom={direction}>
                      {current && (
                        <FlashCard
                          key={current.id}
                          article={current}
                          direction={direction}
                          onExpand={() => setDrawerArticle(current)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={goNext}
                    disabled={index >= articles.length - 1}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-25 shadow-sm flex-shrink-0"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Progress counter + dots */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    {articles.slice(Math.max(0, index - 3), Math.min(articles.length, index + 4)).map((a, i) => {
                      const realIdx = Math.max(0, index - 3) + i;
                      return (
                        <button
                          key={a.id}
                          onClick={() => { setDirection(realIdx > index ? 1 : -1); setIndex(realIdx); }}
                          className={cn('rounded-full transition-all', realIdx === index ? 'w-5 h-2 bg-indigo-500' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300')}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400">
                    {index + 1} of {articles.length}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Feed View ─── */}
        {view === 'feed' && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <AllFeed onArticleClick={setDrawerArticle} mode={mode} />
          </div>
        )}
      </main>

      {/* Shared article drawer */}
      <ArticleDrawer article={drawerArticle} onClose={() => setDrawerArticle(null)} />

      {/* AI Assistant (fixed top-right) */}
      <AIAssistant />

      {/* Onboarding */}
      <OnboardingModal />
    </div>
  );
}
