'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Circle, ThumbsUp, Star, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATINGS = [
  {
    value: 1,
    label: 'Skip',
    icon: X,
    inactiveClass: 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50',
    activeClass: 'bg-slate-100 border-slate-300 text-slate-600',
  },
  {
    value: 2,
    label: 'Okay',
    icon: Circle,
    inactiveClass: 'text-amber-500 border-slate-200 bg-white hover:bg-amber-50',
    activeClass: 'bg-amber-50 border-amber-200 text-amber-600',
  },
  {
    value: 3,
    label: 'Good',
    icon: ThumbsUp,
    inactiveClass: 'text-blue-500 border-slate-200 bg-white hover:bg-blue-50',
    activeClass: 'bg-blue-50 border-blue-200 text-blue-600',
  },
  {
    value: 4,
    label: 'Great',
    icon: Star,
    inactiveClass: 'text-teal-500 border-slate-200 bg-white hover:bg-teal-50',
    activeClass: 'bg-teal-50 border-teal-200 text-teal-600',
  },
  {
    value: 5,
    label: 'Must Read',
    icon: Bookmark,
    inactiveClass: 'text-red-500 border-slate-200 bg-white hover:bg-red-50',
    activeClass: 'bg-red-50 border-red-200 text-red-600',
  },
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
    // Icon-only pills in compact mode
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATINGS.map(r => {
          const Icon = r.icon;
          return (
            <motion.button
              key={r.value}
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); handleRate(r.value); }}
              title={r.label}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-150',
                rating === r.value ? r.activeClass : r.inactiveClass
              )}
            >
              <Icon size={12} />
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium mr-1">Rate:</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATINGS.map(r => {
          const Icon = r.icon;
          return (
            <motion.button
              key={r.value}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.04 }}
              onClick={e => { e.stopPropagation(); handleRate(r.value); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                rating === r.value ? r.activeClass + ' shadow-sm' : r.inactiveClass
              )}
            >
              <Icon size={12} />
              {r.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
