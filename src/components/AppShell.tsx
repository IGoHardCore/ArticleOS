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
    const saved = localStorage.getItem('navrail_expanded');
    if (saved === 'false') setSidebarExpanded(false);
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
        onToggleAi={() => setAiOpen(o => !o)}
      />
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="flex-1 overflow-y-auto min-w-0"
      >
        {children}
      </motion.main>
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

