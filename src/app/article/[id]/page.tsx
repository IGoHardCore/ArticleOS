'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Building2, BookOpen } from 'lucide-react';
import { Article } from '@/lib/db';
import { NavRail } from '@/components/NavRail';
import { AIAssistant } from '@/components/AIAssistant';
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

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [liveSummary, setLiveSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(r => r.json())
      .then(d => { setArticle(d.article); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!article || article.summary) return;
    setSummaryLoading(true);
    fetch(`/api/articles/${article.id}/summarize`, { method: 'POST' })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed');
        if (d.summary) setLiveSummary(d.summary);
      })
      .catch(err => setSummaryError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setSummaryLoading(false));
  }, [article]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-sm mb-6"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
            </div>
          ) : !article ? (
            <div className="text-center py-16 text-slate-400">Article not found</div>
          ) : (
            <article>
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-400 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span className="font-medium text-slate-500">{article.source}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{formatDate(article.published_at)}</span>
                </div>
                {article.author && (<><span>·</span><span>By {article.author}</span></>)}
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {article.tags.map(tag => (
                    <span key={tag.id} className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[tag.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{article.title}</h1>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors mb-6"
                >
                  Read Full Article →
                </a>
              )}

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                </div>
                {(article.summary || liveSummary) ? (
                  <div className="space-y-3">
                    {(article.summary || liveSummary)!.split('\n\n').filter(Boolean).map((para, i) => (
                      <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
                    ))}
                  </div>
                ) : summaryLoading ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-indigo-500 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span>Generating AI summary…</span>
                    </div>
                    <div className="h-3 bg-indigo-100 rounded animate-pulse w-full" />
                    <div className="h-3 bg-indigo-100 rounded animate-pulse w-5/6" />
                    <div className="h-3 bg-indigo-100 rounded animate-pulse w-4/5" />
                  </div>
                ) : summaryError ? (
                  <p className="text-sm text-slate-500">{summaryError.includes('API key') ? 'No API key configured — go to Settings.' : summaryError}</p>
                ) : (
                  <p className="text-sm text-slate-400">No summary available.</p>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Rate this article</p>
                <RatingBar articleId={article.id} initialRating={article.user_rating} />
                <p className="text-xs text-slate-400 mt-2">Your rating trains your personal recommendation algorithm.</p>
              </div>

              {article.full_text && article.full_text.length > 100 && (
                <div className="mb-6">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Article Excerpt</h2>
                  <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                    {article.full_text.slice(0, 2000)}
                    {article.full_text.length > 2000 && '…'}
                  </div>
                </div>
              )}

            </article>
          )}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}
