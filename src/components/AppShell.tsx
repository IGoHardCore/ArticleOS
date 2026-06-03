'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavRail } from './NavRail';
import { AIAssistant } from './AIAssistant';

interface AppShellProps {
  children: React.ReactNode;
  view?: 'cards' | 'feed';
  onViewChange?: (view: 'cards' | 'feed') => void;
}

export function AppShell({ children, view, onViewChange }: AppShellProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

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
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="flex-1 overflow-y-auto min-w-0"
      >
        {children}
      </motion.main>
      <AIAssistant open={aiOpen} onOpenChange={v => { setAiOpen(v); localStorage.setItem('articleos_ai_open', String(v)); }} />
    </div>
  );
}

