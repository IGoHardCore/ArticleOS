'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
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

interface FlashCardProps {
  article: Article;
  direction: number;
  onExpand: () => void;
  onRate?: (rating: number) => void;
}

export function FlashCard({ article, direction, onExpand, onRate }: FlashCardProps) {
  const summaryParagraphs = article.summary
    ? article.summary.split('\n\n').filter(Boolean).slice(0, 2)
    : [];

  return (
    <motion.div
      key={article.id}
      custom={direction}
      initial={{ opacity: 0, x: direction > 0 ? 80 : -80, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: direction > 0 ? -80 : 80, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-2xl mx-auto"
    >
      {/* Card body — click anywhere to open drawer */}
      <div
        className="px-6 pt-6 pb-4 cursor-pointer"
        onClick={onExpand}
      >
        {/* Meta row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-semibold ${getSourceColor(article.source)}`}>
              {article.source || 'Unknown'}
            </span>
            <span className="text-slate-300">·</span>
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-400">{formatDate(article.published_at)}</span>
          </div>
          {article.avg_rating && (
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              avg {article.avg_rating.toFixed(1)}
            </span>
          )}
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
        <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3">{article.title}</h2>

        {/* Summary — 2 paragraphs, each line-clamp-2 */}
        {summaryParagraphs.length > 0 && (
          <div className="space-y-2 mb-4">
            {summaryParagraphs.map((para, i) => (
              <p key={i} className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="px-6 py-4 border-t border-slate-100">
        <RatingBar articleId={article.id} initialRating={article.user_rating} onRate={onRate} />
      </div>
    </motion.div>
  );
}
