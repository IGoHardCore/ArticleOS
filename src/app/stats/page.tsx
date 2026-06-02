'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Tag, Newspaper } from 'lucide-react';
import { NavRail } from '@/components/NavRail';
import { AIAssistant } from '@/components/AIAssistant';

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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your reading habits and preferences</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse h-24" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={<Newspaper size={18} className="text-indigo-500" />}
                  label="Total Articles"
                  value={stats.totalArticles.toLocaleString()}
                  bg="bg-indigo-50"
                />
                <StatCard
                  icon={<TrendingUp size={18} className="text-emerald-500" />}
                  label="Articles Rated"
                  value={stats.ratedArticles.toLocaleString()}
                  sub={stats.totalArticles > 0 ? `${Math.round((stats.ratedArticles / stats.totalArticles) * 100)}% of total` : ''}
                  bg="bg-emerald-50"
                />
                <StatCard
                  icon={<BarChart3 size={18} className="text-amber-500" />}
                  label="Avg Rating"
                  value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} / 5` : '—'}
                  sub={stats.avgRating > 0 ? 'across all ratings' : 'Rate some articles!'}
                  bg="bg-amber-50"
                />
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={15} className="text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">Your Top Topics</h2>
                </div>
                {stats.topTags.length === 0 ? (
                  <p className="text-slate-400 text-sm">Rate articles to see your top topics.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topTags.map(tag => (
                      <div key={tag.name} className="flex items-center gap-3">
                        <div className="w-28 text-xs text-slate-500 text-right truncate">{tag.name}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(tag.count / maxCount) * 100}%`, backgroundColor: tag.color }}
                          />
                        </div>
                        <div className="w-16 text-xs text-slate-400 flex gap-2">
                          <span>{tag.count}</span>
                          {tag.avg_rating > 0 && <span className="text-amber-500">{tag.avg_rating.toFixed(1)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={15} className="text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">How Your Algorithm Works</h2>
                </div>
                <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                  <p><span className="text-slate-700 font-medium">1. Tag weights</span> — Articles you rate highly in a topic boost that topic&apos;s weight. Recent ratings matter more (decay over 7 days).</p>
                  <p><span className="text-slate-700 font-medium">2. Recency bonus</span> — Fresh articles (under 3 days) get boosted so new breakthroughs surface faster.</p>
                  <p><span className="text-slate-700 font-medium">3. Novelty</span> — Unrated articles get a small boost to diversify your feed.</p>
                  <p><span className="text-slate-700 font-medium">4. Top Pick</span> — Your highest-scored article from ratings in the selected period is pinned at the top.</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-400">Failed to load stats.</p>
          )}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>{icon}</div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
