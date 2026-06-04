'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ChevronDown, LayoutList, LayoutGrid, RefreshCw } from 'lucide-react';
import { Article } from '@/lib/db';
import { RatingBar } from './RatingBar';

const TAG_COLORS: Record<string, string> = {
  cancer: 'bg-red-50 text-red-600 border-red-100',
  cardiology: 'bg-rose-50 text-rose-600 border-rose-100',
  neurology: 'bg-purple-50 text-purple-600 border-purple-100',
  pharmacology: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'drug approval': 'bg-green-50 text-green-600 border-green-100',
  oncology: 'bg-red-50 text-red-600 border-red-100',
  diabetes: 'bg-orange-50 text-orange-600 border-orange-100',
  immunology: 'bg-teal-50 text-teal-600 border-teal-100',
  genetics: 'bg-violet-50 text-violet-600 border-violet-100',
  'clinical trial': 'bg-blue-50 text-blue-600 border-blue-100',
  surgery: 'bg-slate-50 text-slate-600 border-slate-200',
  psychiatry: 'bg-pink-50 text-pink-600 border-pink-100',
  pediatrics: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  'infectious disease': 'bg-amber-50 text-amber-600 border-amber-100',
  radiology: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  pharmacy: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  breakthrough: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  FDA: 'bg-blue-50 text-blue-700 border-blue-100',
  research: 'bg-slate-50 text-slate-600 border-slate-200',
  'public health': 'bg-lime-50 text-lime-700 border-lime-100',
};

const SOURCE_COLORS: Record<string, string> = {
  'NEJM': 'text-orange-600',
  'New England Journal of Medicine': 'text-orange-600',
  'JAMA': 'text-blue-600',
  'The Lancet': 'text-green-600',
  'Lancet': 'text-green-600',
  'BMJ': 'text-violet-600',
  'Nature': 'text-teal-600',
  'Science': 'text-teal-600',
};

function getSourceColor(source: string | null): string {
  if (!source) return 'text-slate-500';
  for (const [key, color] of Object.entries(SOURCE_COLORS)) {
    if (source.includes(key)) return color;
  }
  return 'text-slate-500';
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

interface AllFeedProps {
  onArticleClick: (article: Article) => void;
  mode?: 'recommended' | 'latest';
  onFetch?: () => void;
  fetching?: boolean;
}

export function AllFeed({ onArticleClick, mode = 'recommended', onFetch, fetching }: AllFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortMode, setSortMode] = useState<'recommended' | 'latest'>(mode ?? 'recommended');
  const [layout, setLayout] = useState<'list' | 'grid'>('grid');

  const fetchArticles = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?mode=${sortMode}&limit=20&offset=${currentOffset}`);
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
      setLoadingMore(false);
    }
  }, [sortMode, offset]);

  useEffect(() => {
    setOffset(0);
    fetchArticles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortMode]);

  const prevFetching = useRef(false);
  useEffect(() => {
    if (prevFetching.current && !fetching) fetchArticles(true);
    prevFetching.current = !!fetching;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetching]);

  return (
    <div>
      {/* Top bar */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Feed</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Personalized intelligence, updated continuously.</p>
          </div>

          {/* Controls — wrap naturally on mobile */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => setSortMode(prev => prev === 'recommended' ? 'latest' : 'recommended')}
              className={`flex items-center gap-1 px-3 py-2 border rounded-xl text-xs transition-colors font-medium min-h-[36px] ${
                sortMode === 'latest'
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {sortMode === 'latest' ? 'Latest' : 'For You'}
              <ChevronDown size={12} />
            </button>

            <button
              onClick={onFetch}
              disabled={fetching}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors flex-shrink-0 min-h-[36px]"
            >
              <RefreshCw size={11} className={fetching ? 'animate-spin' : ''} />
              {fetching ? 'Fetching…' : 'Fetch'}
            </button>

            {/* Layout toggle — hidden on mobile, show on sm+ */}
            <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
              <button
                onClick={() => setLayout('list')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  layout === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setLayout('grid')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  layout === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" />
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No articles yet</p>
          <p className="text-slate-400 text-sm mt-1">Tap Fetch to load the latest medical articles</p>
        </div>
      ) : layout === 'grid' ? (
        <>
          {/* Grid: 1 col on mobile, 2 col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => onArticleClick(article)}
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-xs font-semibold truncate max-w-[120px] ${getSourceColor(article.source)}`}>
                    {article.source || 'Unknown'}
                  </span>
                  <span className="text-slate-300 text-xs flex-shrink-0">·</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(article.published_at)}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-2">
                  {article.title}
                </h3>

                {(() => {
                  const desc = article.summary
                    ? article.summary.split('\n\n')[0]
                    : article.full_text?.slice(0, 200) || null;
                  return desc ? (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-2">{desc}</p>
                  ) : null;
                })()}

                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {article.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag.id}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tag.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2" onClick={e => e.stopPropagation()}>
                  <RatingBar articleId={article.id} initialRating={article.user_rating} compact />
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => fetchArticles(false)}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      ) : (
        /* List view */
        <div className="space-y-3">
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => onArticleClick(article)}
              className="bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-4 cursor-pointer hover:shadow-md active:scale-[0.995] transition-all group"
            >
              {/* Top row: source · time | tags */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                <span className={`text-xs font-semibold ${getSourceColor(article.source)}`}>
                  {article.source || 'Unknown'}
                </span>
                <span className="text-slate-300 text-xs">·</span>
                <span className="text-xs text-slate-400">{timeAgo(article.published_at)}</span>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {article.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag.id}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tag.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + description */}
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-1.5">
                  {article.title}
                </h3>
                {(() => {
                  const desc = article.summary
                    ? article.summary.split('\n\n')[0]
                    : article.full_text?.slice(0, 200) || null;
                  return desc ? (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{desc}</p>
                  ) : null;
                })()}
              </div>

              <div className="border-t border-slate-100 pt-2 sm:pt-3" onClick={e => e.stopPropagation()}>
                <RatingBar articleId={article.id} initialRating={article.user_rating} compact />
              </div>
            </motion.div>
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => fetchArticles(false)}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
