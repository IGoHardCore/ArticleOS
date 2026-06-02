'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Clock, Zap, MessageSquare, ArrowRight } from 'lucide-react';

const FACTS = [
  {
    icon: Info,
    text: 'Stay ahead of the curve. Over 30,000+ new medical articles published every day.',
  },
  {
    icon: Clock,
    text: 'Time is limited. Clinicians spend 19+ hours per week keeping up with medical literature.',
  },
  {
    icon: Zap,
    text: 'Signal is hard to find. Less than 20% of research is practice-changing, yet everything competes for your attention.',
  },
  {
    icon: MessageSquare,
    text: 'AI summaries help you understand faster and remember more.',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Flash Feed',
    desc: 'One article at a time. Rapidly scan high-impact research in a clean, focused experience.',
  },
  {
    icon: '☆',
    title: 'Rate & Learn',
    desc: 'Rate articles to train your AI and prioritize what deserves your time.',
  },
  {
    icon: '✦',
    title: 'AI Guidance',
    desc: 'AI summaries and insights help you understand faster and remember more.',
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('articleos_onboarded')) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem('articleos_onboarded', '1');
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.div
            key="onboarding-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">
              {/* Left panel — dark navy */}
              <div className="bg-[#0B1437] p-8 flex flex-col md:w-64 flex-shrink-0">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1437] border-2 border-white ring-1 ring-white/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">Rx</span>
                  </div>
                  <span className="text-white text-lg">✦</span>
                </div>

                <p className="text-white font-semibold text-base leading-snug mb-8">
                  Your personal medical intelligence OS
                </p>

                <div className="space-y-4 flex-1">
                  {FACTS.map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div className="flex-1 p-8 flex flex-col">
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  ArticleOS helps you cut through the noise and focus on what matters.
                </p>

                <div className="space-y-4 flex-1">
                  {FEATURES.map(({ icon, title, desc }) => (
                    <div key={title} className="flex gap-3 items-start">
                      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={dismiss}
                  className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-[#0B1437] hover:bg-[#0d1a4a] text-white rounded-2xl font-semibold text-sm transition-colors"
                >
                  Start Reading
                  <ArrowRight size={16} />
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Already have an account?{' '}
                  <button className="text-slate-600 underline hover:text-slate-900 transition-colors">Sign in</button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
