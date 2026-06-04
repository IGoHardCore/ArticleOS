'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Bookmark, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', icon: Home, label: 'Feed' },
  { href: '/research', icon: FileText, label: 'Research' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/stats', icon: BarChart2, label: 'Insights' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex items-center justify-around bg-white/96 backdrop-blur-md border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors',
              active ? 'text-violet-600' : 'text-slate-400'
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
