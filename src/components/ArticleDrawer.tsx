'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Bookmark, MoreHorizontal } from 'lucide-react';
import { Article } from '@/lib/db';
import { RatingBar } from './RatingBar';
import { formatDate } from '@/lib/utils';

interface ArticleDrawerProps {
  article: Article | null;
  onClose: () => void;
}

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

type Tab = 'summary' | 'article';

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  useEffect(() => {
    setActiveTab('summary');
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [article, onClose]);

  return (
    <AnimatePresence>
      {article && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal positioner — no pointer events so backdrop click-through works */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal box */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>

                {/* Source + date */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-semibold ${getSourceColor(article.source)}`}>
                    {article.source || 'Unknown'}
                  </span>
                  <span className="text-slate-300">·</span>
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-slate-400">{formatDate(article.published_at)}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                    <Bookmark size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex-shrink-0 flex border-b border-slate-100 px-6">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2.5 mr-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'summary'
                      ? 'border-indigo-500 text-indigo-600 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  AI Summary
                </button>
                <button
                  onClick={() => setActiveTab('article')}
                  className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'article'
                      ? 'border-indigo-500 text-indigo-600 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Full Article
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {article.tags.map(tag => (
                      <span
                        key={tag.id}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[tag.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 leading-snug mb-4">{article.title}</h2>

                {/* AI Summary tab */}
                {activeTab === 'summary' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Summary</span>
                    </div>
                    {article.summary ? (
                      <div className="space-y-3">
                        {article.summary.split('\n\n').filter(Boolean).map((para, i) => (
                          <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 leading-relaxed">No AI summary available for this article.</p>
                    )}
                  </div>
                )}

                {/* Full Article tab */}
                {activeTab === 'article' && (
                  article.full_text ? (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{article.full_text}</p>
                  ) : (
                    <p className="text-sm text-slate-500 leading-relaxed">Full article text not available.</p>
                  )
                )}
              </div>

              {/* Rating bar — fixed at bottom */}
              <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4">
                <RatingBar articleId={article.id} initialRating={article.user_rating} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
