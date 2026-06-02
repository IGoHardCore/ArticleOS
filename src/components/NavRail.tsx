'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, BarChart2, Settings, LayoutList, LayoutGrid,
  ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavRailProps {
  onViewChange?: (view: 'cards' | 'feed') => void;
  view?: 'cards' | 'feed';
}

function NavItem({ href, icon: Icon, label, active, expanded, onClick }: {
  href?: string; icon: React.ElementType; label: string; active: boolean;
  expanded: boolean; onClick?: () => void;
}) {
  const cls = cn(
    'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 w-full text-left',
    active
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'
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
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
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

  function handleAIGuidance() {
    window.dispatchEvent(new CustomEvent('articleos-open-ai'));
  }

  return (
    <motion.nav
      animate={{ width: expanded ? 200 : 64 }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="fixed left-0 top-0 h-screen bg-[#0B1437] flex flex-col py-4 z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center px-3.5 mb-6 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#0B1437] border-2 border-white ring-1 ring-white/30 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">Rx</span>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.14 }}
              className="ml-3 text-sm font-bold text-white whitespace-nowrap"
            >
              ArticleOS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Main nav */}
      <div className="flex flex-col gap-0.5 px-2 flex-1">
        {/* Feed */}
        <NavItem
          icon={Home}
          label="Feed"
          active={isFeedView}
          expanded={expanded}
          onClick={() => onViewChange?.('feed')}
        />

        {/* Research */}
        <NavItem
          href="/research"
          icon={FileText}
          label="Research"
          active={pathname === '/research'}
          expanded={expanded}
        />

        {/* Insights */}
        <NavItem
          href="/stats"
          icon={BarChart2}
          label="Insights"
          active={pathname === '/stats'}
          expanded={expanded}
        />

        {/* Settings */}
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          active={pathname === '/settings'}
          expanded={expanded}
        />

        {/* Divider + VIEWS label */}
        <div className="my-2">
          <div className="border-t border-white/10" />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="px-2.5 pt-2 pb-1"
              >
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Views</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feed View */}
        <NavItem
          icon={LayoutList}
          label="Feed View"
          active={isFeedView}
          expanded={expanded}
          onClick={() => onViewChange?.('feed')}
        />

        {/* Cards View */}
        <NavItem
          icon={LayoutGrid}
          label="Cards"
          active={isCardsView}
          expanded={expanded}
          onClick={() => onViewChange?.('cards')}
        />

        {/* Divider */}
        <div className="my-2 border-t border-white/10" />

        {/* AI Guidance */}
        <NavItem
          icon={Sparkles}
          label="AI Guidance"
          active={false}
          expanded={expanded}
          onClick={handleAIGuidance}
        />
      </div>

      {/* Collapse toggle */}
      <div className="px-2 flex-shrink-0">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-slate-500 hover:bg-white/[0.08] hover:text-slate-300 transition-all w-full text-left"
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
  );
}
