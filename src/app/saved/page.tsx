'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Clock, X } from 'lucide-react';
import { Article } from '@/lib/db';
import { AppShell } from '@/components/AppShell';
import { ArticleDrawer } from '@/components/ArticleDrawer';
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

export default function SavedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerArticle, setDrawerArticle] = useState<Article | null>(null);

  async function fetchSaved() {
    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      setArticles(data.articles || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSaved(); }, []);

  async function removeBookmark(article: Article) {
    setArticles(prev => prev.filter(a => a.id !== article.id));
    await fetch(`/api/articles/${article.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarked: false }),
    });
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Bookmark size={16} className="text-amber-600" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Saved</h1>
            <p className="text-sm text-slate-400">Your bookmarked articles</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" />
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <Bookmark size={20} className="text-amber-400" />
            </div>
            <p className="text-slate-600 font-medium">No saved articles yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Bookmark articles from the feed, or rate any article as &quot;Must Read&quot; to auto-save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <div
                key={article.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group relative"
                onClick={() => setDrawerArticle(article)}
              >
                <button
                  onClick={e => { e.stopPropagation(); removeBookmark(article); }}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <X size={13} />
                </button>

                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{article.source || 'Unknown'}</span>
                  <span className="text-slate-300">·</span>
                  <Clock size={11} />
                  <span>{formatDate(article.published_at)}</span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2 pr-8">
                  {article.title}
                </h3>

                {article.summary && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {article.summary.split('\n\n')[0]}
                  </p>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <ArticleDrawer article={drawerArticle} onClose={() => { setDrawerArticle(null); fetchSaved(); }} />
    </AppShell>
  );
}
