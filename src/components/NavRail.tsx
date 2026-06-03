'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, BarChart2, Settings, LayoutList, LayoutGrid,
  ChevronRight, ChevronLeft, Sparkles, Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarBrand } from './SidebarBrand';

interface NavRailProps {
  onViewChange?: (view: 'cards' | 'feed') => void;
  view?: 'cards' | 'feed';
  expanded?: boolean;
  onToggle?: () => void;
  aiOpen?: boolean;
  onToggleAi?: () => void;
}

function NavItem({ href, icon: Icon, label, active, expanded, onClick }: {
  href?: string; icon: React.ElementType; label: string; active: boolean;
  expanded: boolean; onClick?: () => void;
}) {
  const cls = cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 w-full text-left',
    active
      ? 'bg-blue-600 text-white'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  );

  const content = (
    <>
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
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

export function NavRail({ onViewChange, view, expanded = true, onToggle, aiOpen = false, onToggleAi }: NavRailProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === '/';
  const isFeedView = isHome && view === 'feed';
  const isCardsView = isHome && view !== 'feed';

  function handleViewNav(v: 'cards' | 'feed') {
    if (onViewChange) {
      onViewChange(v);
    } else {
      localStorage.setItem('articleos_view', v);
      router.push('/');
    }
  }

  function handleAIGuidance() {
    if (onToggleAi) {
      onToggleAi();
    } else {
      window.dispatchEvent(new CustomEvent('articleos-open-ai'));
    }
  }

  const railWidth = expanded ? 200 : 56;

  return (
    <motion.nav
      animate={{ width: railWidth }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="fixed left-0 top-0 h-screen paper-surface border-r border-slate-100 flex flex-col py-4 z-30 overflow-visible"
      style={{ minWidth: 0 }}
    >
      {/* Brand */}
      <SidebarBrand expanded={expanded} />

      {/* Main nav */}
      <div className="flex flex-col gap-0.5 px-2 flex-1 overflow-hidden">
        <NavItem icon={Home} label="Feed" active={isFeedView} expanded={expanded} onClick={() => handleViewNav('feed')} />
        <NavItem href="/research" icon={FileText} label="Research" active={pathname === '/research'} expanded={expanded} />
        <NavItem href="/saved" icon={Bookmark} label="Saved" active={pathname === '/saved'} expanded={expanded} />
        <NavItem href="/stats" icon={BarChart2} label="Insights" active={pathname === '/stats'} expanded={expanded} />
        <NavItem href="/settings" icon={Settings} label="Settings" active={pathname === '/settings'} expanded={expanded} />

        {/* Divider + VIEWS label */}
        <div className="my-2">
          <div className="border-t border-slate-100" />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="px-3 pt-2 pb-1"
              >
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Views</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NavItem icon={LayoutList} label="Feed View" active={isFeedView} expanded={expanded} onClick={() => handleViewNav('feed')} />
        <NavItem icon={LayoutGrid} label="Board View" active={isCardsView} expanded={expanded} onClick={() => handleViewNav('cards')} />

        <div className="my-2 border-t border-slate-100" />

        <NavItem icon={Sparkles} label="AI Guidance" active={false} expanded={expanded} onClick={handleAIGuidance} />
      </div>

      {/* Blue circle toggle — sits on the right edge of the sidebar */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center transition-colors z-40"
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft size={13} strokeWidth={2.5} /> : <ChevronRight size={13} strokeWidth={2.5} />}
      </button>
    </motion.nav>
  );
}
