'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, FlaskConical, Settings, Tag, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagItem { id: number; name: string; color: string; weight: number; }
interface SidebarProps { onTagFilter?: (tag: string) => void; activeTag?: string; }

export function Sidebar({ onTagFilter, activeTag }: SidebarProps) {
  const pathname = usePathname();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(d => setTags(d.tags || []));
  }, []);

  async function triggerScrape() {
    setScraping(true);
    setScrapeMsg('');
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      setScrapeMsg(`+${data.added} new · ${data.analyzed} analyzed`);
    } catch {
      setScrapeMsg('Error scraping');
    } finally {
      setScraping(false);
    }
  }

  const navItems = [
    { href: '/', icon: Newspaper, label: 'Feed' },
    { href: '/research', icon: FlaskConical, label: 'Research' },
    { href: '/stats', icon: BarChart3, label: 'Insights' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const topTags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, 12);
  const restTags = tags.filter(t => !topTags.find(tt => tt.id === t.id));

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Rx</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">ArticleOS</h1>
            <p className="text-xs text-slate-500">Medical Intelligence</p>
          </div>
        </div>
      </div>
      <nav className="px-3 py-3 border-b border-slate-800">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
              pathname === href ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}>
              <Icon size={16} />{label}
            </div>
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Tag size={12} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Topics</span>
        </div>
        {topTags.length > 0 && (
          <div className="mb-1">
            {topTags.map(tag => (
              <button key={tag.id} onClick={() => onTagFilter?.(activeTag === tag.name ? '' : tag.name)}
                className={cn('w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors mb-0.5',
                  activeTag === tag.name ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </div>
                {tag.weight > 0 && <span className="text-slate-600 text-[10px]">{Math.round(tag.weight * 10) / 10}</span>}
              </button>
            ))}
          </div>
        )}
        {restTags.length > 0 && (
          <div className="border-t border-slate-800/50 mt-1 pt-1">
            {restTags.map(tag => (
              <button key={tag.id} onClick={() => onTagFilter?.(activeTag === tag.name ? '' : tag.name)}
                className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors mb-0.5',
                  activeTag === tag.name ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                )}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-3 border-t border-slate-800">
        <button onClick={triggerScrape} disabled={scraping}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-medium disabled:opacity-50">
          {scraping ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {scraping ? 'Fetching...' : 'Refresh Feed'}
        </button>
        {scrapeMsg && <p className="text-center text-xs text-slate-500 mt-1.5">{scrapeMsg}</p>}
      </div>
    </aside>
  );
}
