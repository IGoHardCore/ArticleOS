'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
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

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[88vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={15} />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              {/* Meta */}
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`font-semibold ${getSourceColor(article.source)}`}>
                  {article.source || 'Unknown'}
                </span>
                <span className="text-slate-300">·</span>
                <Clock size={12} className="text-slate-400" />
                <span className="text-slate-400">{formatDate(article.published_at)}</span>
              </div>

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
              <h2 className="text-xl font-bold text-slate-900 leading-snug mb-5">{article.title}</h2>

              {/* AI Summary */}
              {article.summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Summary</span>
                  </div>
                  <div className="space-y-3">
                    {article.summary.split('\n\n').filter(Boolean).map((para, i) => (
                      <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Full text excerpt */}
              {article.full_text && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Full Article</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{article.full_text.slice(0, 1200)}{article.full_text.length > 1200 ? '…' : ''}</p>
                </div>
              )}

              {/* Rating */}
              <div className="pt-4 border-t border-slate-100">
                <RatingBar articleId={article.id} initialRating={article.user_rating} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
