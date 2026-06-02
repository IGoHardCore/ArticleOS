'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ExternalLink } from 'lucide-react';
import { Article } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { formatDate } from '@/lib/utils';

export function TopPick({ period }: { period: 'week' | 'month' }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles?mode=top-pick&period=${period}`)
      .then(r => r.json())
      .then(d => { setArticle(d.article); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
      <div className="h-6 bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-800 rounded w-full" />
    </div>
  );

  if (!article) return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-sm">
      <Trophy size={24} className="mx-auto mb-2 opacity-30" />
      Rate some articles to get your Top Pick of the {period}!
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500" />
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Top Pick This {period === 'week' ? 'Week' : 'Month'}</span>
        <span className="text-xs text-slate-500 ml-auto">{formatDate(article.published_at)}</span>
      </div>
      <Link href={`/article/${article.id}`}>
        <h2 className="text-lg font-bold text-slate-100 mb-2 hover:text-amber-300 transition-colors cursor-pointer">{article.title}</h2>
      </Link>
      {article.summary && <p className="text-sm text-slate-400 leading-relaxed mb-3">{article.summary}</p>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {article.tags?.map(tag => <Badge key={tag.id} color={tag.color}>{tag.name}</Badge>)}
        </div>
        <div className="flex items-center gap-3">
          <StarRating articleId={article.id} initialRating={article.user_rating} avgRating={article.avg_rating} ratingCount={article.rating_count} />
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-400 transition-colors"><ExternalLink size={16} /></a>
        </div>
      </div>
    </div>
  );
}
