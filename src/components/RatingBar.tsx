'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const RATINGS = [
  { value: 1, label: 'Skip', color: 'text-slate-400 hover:bg-slate-100', activeColor: 'bg-slate-100 text-slate-600 border-slate-300' },
  { value: 2, label: 'Okay', color: 'text-blue-400 hover:bg-blue-50', activeColor: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 3, label: 'Good', color: 'text-emerald-500 hover:bg-emerald-50', activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { value: 4, label: 'Great', color: 'text-indigo-500 hover:bg-indigo-50', activeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { value: 5, label: 'Must Read', color: 'text-amber-500 hover:bg-amber-50', activeColor: 'bg-amber-50 text-amber-600 border-amber-200' },
];

interface RatingBarProps {
  articleId: number;
  initialRating?: number | null;
  onRate?: (rating: number) => void;
  compact?: boolean;
}

export function RatingBar({ articleId, initialRating, onRate, compact }: RatingBarProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [saving, setSaving] = useState(false);

  async function handleRate(value: number) {
    if (saving) return;
    setSaving(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });
      setRating(value);
      onRate?.(value);
    } finally {
      setSaving(false);
    }
  }

  if (compact) {
    const current = RATINGS.find(r => r.value === rating);
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATINGS.map(r => (
          <motion.button
            key={r.value}
            whileTap={{ scale: 0.88 }}
            onClick={e => { e.stopPropagation(); handleRate(r.value); }}
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-150',
              rating === r.value
                ? r.activeColor + ' border'
                : 'border-transparent ' + r.color
            )}
          >
            {r.label}
          </motion.button>
        ))}
        {current && <span className="text-[10px] text-slate-400 ml-0.5">saved</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium mr-1">Rate:</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATINGS.map(r => (
          <motion.button
            key={r.value}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.04 }}
            onClick={e => { e.stopPropagation(); handleRate(r.value); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
              rating === r.value
                ? r.activeColor + ' border shadow-sm'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 ' + r.color
            )}
          >
            {r.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
