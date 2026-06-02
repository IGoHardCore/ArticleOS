'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Clock, Building2 } from 'lucide-react';
import { Article } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { formatDate, truncate } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  highlight?: boolean;
  onTagClick?: (tag: string) => void;
}

export function ArticleCard({ article, highlight, onTagClick }: ArticleCardProps) {
  const [userRating, setUserRating] = useState(article.user_rating || null);

  return (
    <div className={`group relative bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 ${
      highlight ? 'border-amber-500/50 shadow-amber-500/10 shadow-md' : 'border-slate-800'
    }`}>
      {highlight && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400" />}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 size={12} />
            <span className="font-medium text-slate-400">{article.source || 'Unknown'}</span>
            <span>·</span>
            <Clock size={12} />
            <span>{formatDate(article.published_at)}</span>
          </div>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-400 transition-colors" onClick={e => e.stopPropagation()}>
            <ExternalLink size={14} />
          </a>
        </div>
        <Link href={`/article/${article.id}`}>
          <h3 className="text-base font-semibold text-slate-100 mb-2 leading-snug group-hover:text-indigo-300 transition-colors cursor-pointer">{article.title}</h3>
        </Link>
        {article.summary && <p className="text-sm text-slate-400 leading-relaxed mb-4">{truncate(article.summary, 200)}</p>}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.map(tag => <Badge key={tag.id} color={tag.color} onClick={() => onTagClick?.(tag.name)}>{tag.name}</Badge>)}
          </div>
        )}
        <StarRating articleId={article.id} initialRating={userRating} avgRating={article.avg_rating} ratingCount={article.rating_count} onRate={setUserRating} />
      </div>
    </div>
  );
}
