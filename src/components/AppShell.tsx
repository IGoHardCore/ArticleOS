'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavRail } from './NavRail';
import { AIAssistant } from './AIAssistant';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: React.ReactNode;
  view?: 'cards' | 'feed';
  onViewChange?: (view: 'cards' | 'feed') => void;
}

export function AppShell({ children, view, onViewChange }: AppShellProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const savedSidebar = localStorage.getItem('navrail_expanded');
    if (savedSidebar === 'false') setSidebarExpanded(false);
    const savedAi = localStorage.getItem('articleos_ai_open');
    if (savedAi === 'true') setAiOpen(true);
  }, []);

  function toggleSidebar() {
    setSidebarExpanded(e => {
      const next = !e;
      localStorage.setItem('navrail_expanded', String(next));
      return next;
    });
  }

  const sidebarWidth = sidebarExpanded ? 200 : 56;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <NavRail
          view={view}
          onViewChange={onViewChange}
          expanded={sidebarExpanded}
          onToggle={toggleSidebar}
          aiOpen={aiOpen}
          onToggleAi={() => {
            const next = !aiOpen;
            setAiOpen(next);
            localStorage.setItem('articleos_ai_open', String(next));
          }}
        />
      </div>

      <motion.main
        animate={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-0"
      >
        {children}
      </motion.main>

      <AIAssistant
        open={aiOpen}
        onOpenChange={v => {
          setAiOpen(v);
          localStorage.setItem('articleos_ai_open', String(v));
        }}
      />

      {/* Bottom tab bar — mobile only */}
      <MobileNav />
    </div>
  );
}
