'use client';

import { motion } from 'framer-motion';
import { Clock, Building2, ChevronDown } from 'lucide-react';
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

interface FlashCardProps {
  article: Article;
  direction: number;
  onExpand: () => void;
  onRate?: (rating: number) => void;
}

export function FlashCard({ article, direction, onExpand, onRate }: FlashCardProps) {
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
      {/* Card header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 size={12} />
            <span className="font-medium text-slate-500">{article.source || 'Unknown'}</span>
            <span>·</span>
            <Clock size={12} />
            <span>{formatDate(article.published_at)}</span>
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

        {/* Summary preview */}
        {article.summary && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">
            {article.summary.split('\n\n')[0]}
          </p>
        )}
      </div>

      {/* Expand button */}
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-center gap-1.5 py-3 px-6 text-xs text-indigo-500 font-semibold hover:bg-indigo-50 transition-colors border-y border-slate-100"
      >
        <ChevronDown size={14} />
        Read full summary
      </button>

      {/* Rating */}
      <div className="px-6 py-4">
        <RatingBar articleId={article.id} initialRating={article.user_rating} onRate={onRate} />
      </div>
    </motion.div>
  );
}
