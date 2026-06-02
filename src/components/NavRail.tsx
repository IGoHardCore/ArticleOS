'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, FlaskConical, BarChart2, Settings, Sparkles, LayoutList, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
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
  { href: '/stats', icon: BarChart2, label: 'Insights' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function NavRail({ onAIToggle, aiOpen, onViewChange, view }: NavRailProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Backdrop when expanded on mobile */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-20 md:hidden"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        animate={{ width: expanded ? 200 : 64 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col py-4 z-30 shadow-sm overflow-hidden"
      >
        {/* Logo + collapse toggle */}
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
                transition={{ duration: 0.15 }}
                className="ml-3 text-sm font-bold text-slate-800 whitespace-nowrap"
              >
                ArticleOS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 px-2 flex-1">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 min-w-0',
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.13 }}
                      className={cn('text-sm font-medium whitespace-nowrap', active ? 'text-indigo-600' : '')}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          {/* View toggle — only on home */}
          {isHome && onViewChange && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-100 pt-2">
              {[
                { v: 'cards' as const, Icon: Layers, label: 'Flashcards' },
                { v: 'feed' as const, Icon: LayoutList, label: 'All Articles' },
              ].map(({ v, Icon, label }) => (
                <button
                  key={v}
                  onClick={() => onViewChange(v)}
                  className={cn(
                    'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all w-full text-left',
                    view === v ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  )}
                >
                  <Icon size={18} strokeWidth={view === v ? 2.2 : 1.8} className="flex-shrink-0" />
                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.13 }}
                        className={cn('text-sm font-medium whitespace-nowrap', view === v ? 'text-indigo-600' : '')}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: AI + expand toggle */}
        <div className="flex flex-col gap-0.5 px-2">
          {onAIToggle && (
            <button
              onClick={onAIToggle}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all w-full text-left',
                aiOpen ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:bg-slate-50 hover:text-purple-500'
              )}
            >
              <Sparkles size={18} strokeWidth={aiOpen ? 2.2 : 1.8} className="flex-shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.13 }}
                    className={cn('text-sm font-medium whitespace-nowrap', aiOpen ? 'text-purple-600' : '')}
                  >
                    AI Assistant
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Expand / collapse button */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all w-full text-left"
          >
            {expanded ? (
              <ChevronLeft size={16} className="flex-shrink-0" />
            ) : (
              <ChevronRight size={16} className="flex-shrink-0" />
            )}
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.13 }}
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
