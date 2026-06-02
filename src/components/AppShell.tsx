'use client';

import { useState } from 'react';
import { NavRail } from './NavRail';
import { AIAssistant } from './AIAssistant';

interface AppShellProps {
  children: React.ReactNode;
  view?: 'cards' | 'feed';
  onViewChange?: (view: 'cards' | 'feed') => void;
}

export function AppShell({ children, view, onViewChange }: AppShellProps) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail view={view} onViewChange={onViewChange} />
      <main className="flex-1 ml-16 overflow-y-auto min-w-0">
        {children}
      </main>
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
