'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  articleId: number;
  initialRating?: number | null;
  avgRating?: number | null;
  ratingCount?: number;
  onRate?: (rating: number) => void;
}

export function StarRating({ articleId, initialRating, avgRating, ratingCount, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(initialRating || 0);
  const [loading, setLoading] = useState(false);

  async function handleRate(value: number) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });
      if (res.ok) { setRating(value); onRate?.(value); }
    } finally {
      setLoading(false);
    }
  }

  const display = hover || rating;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => handleRate(star)} onMouseEnter={() => setHover(star)} disabled={loading} className="p-0.5 transition-transform hover:scale-110 focus:outline-none" aria-label={`Rate ${star} stars`}>
            <Star size={18} className={cn('transition-colors', star <= display ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-600')} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {avgRating != null && avgRating > 0 && (
          <><span className="text-amber-400 font-semibold">{avgRating.toFixed(1)}</span>{ratingCount != null && ratingCount > 0 && <span>({ratingCount})</span>}</>
        )}
        {rating > 0 && <span className="text-indigo-400 font-medium">You: {rating}★</span>}
      </div>
    </div>
  );
}
