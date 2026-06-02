'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Building2, Newspaper } from 'lucide-react';
import { Article } from '@/lib/db';
import { RatingBar } from './RatingBar';
import { formatDate } from '@/lib/utils';

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

interface AllFeedProps {
  onArticleClick: (article: Article) => void;
  mode?: 'recommended' | 'latest';
}

export function AllFeed({ onArticleClick, mode = 'recommended' }: AllFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchArticles = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?mode=${mode}&limit=20&offset=${currentOffset}`);
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
  }, [mode, offset]);

  useEffect(() => {
    setOffset(0);
    fetchArticles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" />
            <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <Newspaper size={36} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No articles yet</p>
        <p className="text-slate-400 text-sm mt-1">Use the AI panel to refresh your feed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article, i) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          onClick={() => onArticleClick(article)}
          className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Building2 size={11} />
            <span className="font-medium text-slate-500">{article.source || 'Unknown'}</span>
            <span>·</span>
            <Clock size={11} />
            <span>{formatDate(article.published_at)}</span>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {article.tags.slice(0, 3).map(tag => (
                <span
                  key={tag.id}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tag.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2">
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
              {article.summary.split('\n\n')[0]}
            </p>
          )}

          <div onClick={e => e.stopPropagation()}>
            <RatingBar articleId={article.id} initialRating={article.user_rating} compact />
          </div>
        </motion.div>
      ))}

      {hasMore && (
        <div className="pt-2 text-center">
          <button
            onClick={() => fetchArticles(false)}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
