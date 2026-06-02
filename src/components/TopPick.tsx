'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Article } from '@/lib/db';
import { RatingBar } from '@/components/RatingBar';
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

interface TopPickProps {
  period: 'week' | 'month';
  onArticleClick?: (article: Article) => void;
}

export function TopPick({ period, onArticleClick }: TopPickProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles?mode=top-pick&period=${period}`)
      .then(r => r.json())
      .then(d => { setArticle(d.article); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-amber-100 rounded w-1/3 mb-3" />
      <div className="h-6 bg-amber-100 rounded w-3/4 mb-2" />
      <div className="h-4 bg-amber-100 rounded w-full" />
    </div>
  );

  if (!article) return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center text-slate-400 text-sm">
      <Trophy size={24} className="mx-auto mb-2 opacity-30 text-amber-400" />
      Rate some articles to get your Top Pick of the {period}!
    </div>
  );

  return (
    <div
      onClick={() => onArticleClick?.(article)}
      className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={15} className="text-amber-500" />
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
          Top Pick This {period === 'week' ? 'Week' : 'Month'}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{formatDate(article.published_at)}</span>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.tags.map(tag => (
            <span key={tag.id} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tag.name] || 'bg-white text-slate-600 border-slate-200'}`}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug">{article.title}</h2>
      {article.summary && <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">{article.summary.split('\n\n')[0]}</p>}

      <div onClick={e => e.stopPropagation()}>
        <RatingBar articleId={article.id} initialRating={article.user_rating} compact />
      </div>
    </div>
  );
}
