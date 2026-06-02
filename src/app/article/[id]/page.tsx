'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Clock, Building2, BookOpen } from 'lucide-react';
import { Article } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { Sidebar } from '@/components/Sidebar';
import { formatDate } from '@/lib/utils';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(r => r.json())
      .then(d => { setArticle(d.article); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors text-sm mb-6"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-1/4" />
              <div className="h-4 bg-slate-800 rounded w-full" />
            </div>
          ) : !article ? (
            <div className="text-center py-16 text-slate-500">Article not found</div>
          ) : (
            <article>
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span className="font-medium text-slate-400">{article.source}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{formatDate(article.published_at)}</span>
                </div>
                {article.author && (<><span>·</span><span>By {article.author}</span></>)}
              </div>

              <h1 className="text-2xl font-bold text-slate-100 mb-4 leading-tight">{article.title}</h1>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {article.tags.map(tag => <Badge key={tag.id} color={tag.color}>{tag.name}</Badge>)}
                </div>
              )}

              {article.summary && (
                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">AI Summary</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{article.summary}</p>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Rate this article</p>
                <StarRating
                  articleId={article.id}
                  initialRating={article.user_rating}
                  avgRating={article.avg_rating}
                  ratingCount={article.rating_count}
                />
                <p className="text-xs text-slate-600 mt-2">Your rating helps personalize your feed and find articles like this.</p>
              </div>

              {article.full_text && article.full_text.length > 100 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Article Excerpt</h2>
                  <div className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap line-clamp-[20]">
                    {article.full_text.slice(0, 2000)}
                    {article.full_text.length > 2000 && '...'}
                  </div>
                </div>
              )}

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <ExternalLink size={14} />
                Read Full Article
              </a>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
