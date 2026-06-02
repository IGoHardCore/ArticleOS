'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Star, Tag, Newspaper, TrendingUp } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface Stats {
  totalArticles: number;
  ratedArticles: number;
  avgRating: number;
  topTags: { name: string; color: string; count: number; avg_rating: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const maxCount = stats?.topTags.reduce((m, t) => Math.max(m, t.count), 1) || 1;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100">Insights</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your reading habits and preferences</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-24" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard icon={<Newspaper size={20} className="text-indigo-400" />} label="Total Articles" value={stats.totalArticles.toLocaleString()} />
                <StatCard icon={<Star size={20} className="text-amber-400" />} label="Articles Rated" value={stats.ratedArticles.toLocaleString()} sub={stats.totalArticles > 0 ? `${Math.round((stats.ratedArticles / stats.totalArticles) * 100)}% of total` : ''} />
                <StatCard icon={<TrendingUp size={20} className="text-emerald-400" />} label="Avg Rating" value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : '—'} sub={stats.avgRating > 0 ? 'out of 5' : 'Rate some articles!'} />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-300">Your Top Topics</h2>
                </div>
                {stats.topTags.length === 0 ? (
                  <p className="text-slate-600 text-sm">Rate articles to see your top topics.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topTags.map(tag => (
                      <div key={tag.name} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-slate-400 text-right">{tag.name}</div>
                        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(tag.count / maxCount) * 100}%`, backgroundColor: tag.color }} />
                        </div>
                        <div className="w-16 text-xs text-slate-500 flex gap-2">
                          <span>{tag.count}</span>
                          {tag.avg_rating > 0 && <span className="text-amber-400">{tag.avg_rating.toFixed(1)}★</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={16} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-300">How Your Algorithm Works</h2>
                </div>
                <div className="space-y-2 text-xs text-slate-500">
                  <p>1. <span className="text-slate-400">Tag weights</span> — Articles you rate highly in a topic boost that topic&apos;s weight. Recent ratings matter more (decay over 7 days).</p>
                  <p>2. <span className="text-slate-400">Recency bonus</span> — Fresh articles (under 3 days) get boosted so new breakthroughs surface faster.</p>
                  <p>3. <span className="text-slate-400">Novelty</span> — Unread (unrated) articles get a small boost to diversify your feed.</p>
                  <p>4. <span className="text-slate-400">Top Pick</span> — The highest-scored article from your ratings in the selected period is pinned at the top.</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Failed to load stats.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">{icon}<span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}
