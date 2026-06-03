'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function SidebarBrand({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex h-16 items-center px-3 flex-shrink-0">
      <div className={expanded ? 'flex items-center gap-2.5' : 'mx-auto flex items-center justify-center'}>
        <img
          src="/brand/articleos-mark-purple.svg"
          alt="ArticleOS"
          className="h-8 w-8 shrink-0"
        />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="brand-wordmark text-[18px] text-slate-950 whitespace-nowrap"
            >
              article<span className="text-violet-600">OS</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
