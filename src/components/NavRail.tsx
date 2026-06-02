'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, FlaskConical, BarChart2, Settings, LayoutList, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavRailProps {
  onViewChange?: (view: 'cards' | 'feed') => void;
  view?: 'cards' | 'feed';
}

const NAV_LINKS = [
  { href: '/', icon: Layers, label: 'Cards', matchExact: true },
  { href: '/?view=feed', icon: Newspaper, label: 'Feed', matchExact: false },
  { href: '/research', icon: FlaskConical, label: 'Research', matchExact: true },
  { href: '/stats', icon: BarChart2, label: 'Insights', matchExact: true },
  { href: '/settings', icon: Settings, label: 'Settings', matchExact: true },
];

function NavItem({ href, icon: Icon, label, active, expanded, onClick }: {
  href?: string; icon: React.ElementType; label: string; active: boolean;
  expanded: boolean; onClick?: () => void;
}) {
  const cls = cn(
    'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 w-full text-left',
    active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
  );

  const content = (
    <>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            className={cn('text-sm font-medium whitespace-nowrap overflow-hidden', active ? 'text-indigo-600' : '')}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (href && !onClick) {
    return <Link href={href} className={cls}>{content}</Link>;
  }
  return <button onClick={onClick} className={cls}>{content}</button>;
}

export function NavRail({ onViewChange, view }: NavRailProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  // Persist expanded state across route changes
  useEffect(() => {
    const saved = localStorage.getItem('navrail_expanded');
    if (saved === 'true') setExpanded(true);
  }, []);

  function toggleExpanded() {
    setExpanded(e => {
      const next = !e;
      localStorage.setItem('navrail_expanded', String(next));
      return next;
    });
  }

  const isHome = pathname === '/';
  const isFeedView = isHome && view === 'feed';
  const isCardsView = isHome && view !== 'feed';

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-20 md:hidden"
            onClick={toggleExpanded}
          />
        )}
      </AnimatePresence>

      <motion.nav
        animate={{ width: expanded ? 200 : 64 }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col py-4 z-30 shadow-sm overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center px-3.5 mb-5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
            <span className="text-white font-bold text-sm">Rx</span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14 }}
                className="ml-3 text-sm font-bold text-slate-800 whitespace-nowrap"
              >
                ArticleOS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Main nav */}
        <div className="flex flex-col gap-0.5 px-2 flex-1">
          {/* Cards view link */}
          <NavItem
            icon={Layers}
            label="Cards"
            active={isCardsView}
            expanded={expanded}
            onClick={() => onViewChange?.('cards')}
          />
          {/* Feed view link */}
          <NavItem
            icon={Newspaper}
            label="Feed"
            active={isFeedView}
            expanded={expanded}
            onClick={() => onViewChange?.('feed')}
          />

          <div className="my-1.5 border-t border-slate-100" />

          {/* Research / Stats / Settings */}
          {[
            { href: '/research', icon: FlaskConical, label: 'Research' },
            { href: '/stats', icon: BarChart2, label: 'Insights' },
            { href: '/settings', icon: Settings, label: 'Settings' },
          ].map(({ href, icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              active={pathname === href}
              expanded={expanded}
            />
          ))}
        </div>

        {/* Collapse toggle */}
        <div className="px-2">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all w-full text-left"
          >
            {expanded
              ? <ChevronLeft size={16} className="flex-shrink-0" />
              : <ChevronRight size={16} className="flex-shrink-0" />
            }
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className="text-xs text-slate-400 whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>
    </>
  );
}
