'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, FlaskConical, BarChart2, Settings, Sparkles, LayoutList, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavRailProps {
  onAIToggle?: () => void;
  aiOpen?: boolean;
  onViewChange?: (view: 'cards' | 'feed') => void;
  view?: 'cards' | 'feed';
}

const NAV_LINKS = [
  { href: '/', icon: Newspaper, label: 'Feed' },
  { href: '/research', icon: FlaskConical, label: 'Research' },
  { href: '/stats', icon: BarChart2, label: 'Stats' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function NavRail({ onAIToggle, aiOpen, onViewChange, view }: NavRailProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <nav className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-slate-100 flex flex-col items-center py-4 z-30 shadow-sm">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-md shadow-indigo-200 flex-shrink-0">
        <span className="text-white font-bold text-sm">Rx</span>
      </div>

      {/* Nav links */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
                active
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}

        {/* View toggle — only on home */}
        {isHome && onViewChange && (
          <div className="mt-2 flex flex-col gap-1">
            <button
              title="Flashcard view"
              onClick={() => onViewChange('cards')}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                view === 'cards' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <Layers size={18} strokeWidth={view === 'cards' ? 2.2 : 1.8} />
            </button>
            <button
              title="Feed view"
              onClick={() => onViewChange('feed')}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                view === 'feed' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <LayoutList size={18} strokeWidth={view === 'feed' ? 2.2 : 1.8} />
            </button>
          </div>
        )}
      </div>

      {/* AI button at bottom */}
      {onAIToggle && (
        <button
          title="AI Assistant"
          onClick={onAIToggle}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-2',
            aiOpen
              ? 'bg-purple-100 text-purple-600'
              : 'text-slate-400 hover:bg-slate-50 hover:text-purple-500'
          )}
        >
          <Sparkles size={18} strokeWidth={aiOpen ? 2.2 : 1.8} />
        </button>
      )}
    </nav>
  );
}
