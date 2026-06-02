'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, BarChart2, Brain, ArrowRight } from 'lucide-react';

const FACTS = [
  'The average physician spends 28 hours/month keeping up with medical literature.',
  'Over 1 million medical research papers are published every year.',
  'Only 14% of new medical evidence reaches clinical practice within 17 years.',
];

const FEATURES = [
  {
    icon: Layers,
    title: 'Flash Feed',
    desc: 'One article at a time — focus on what matters, rate it, and move on.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart2,
    title: 'Rate & Learn',
    desc: 'Your ratings train a personal algorithm that surfaces your top picks each week.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Brain,
    title: 'AI Guidance',
    desc: 'Get a 2-paragraph AI summary for every article plus personalized research direction.',
    color: 'bg-purple-50 text-purple-600',
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
              {/* Left panel */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 flex flex-col justify-between md:w-56 flex-shrink-0">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                    <span className="text-white font-bold text-xl">Rx</span>
                  </div>
                  <h1 className="text-white font-bold text-2xl leading-tight mb-2">Article<br />OS</h1>
                  <p className="text-indigo-200 text-sm leading-relaxed">Your personal medical intelligence OS</p>
                </div>
                <div className="mt-8 space-y-3">
                  {FACTS.map((fact, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                      <p className="text-indigo-200 text-xs leading-relaxed">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div className="flex-1 p-8 flex flex-col">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, Doctor</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">Stay ahead of the curve. Here&apos;s what ArticleOS does for you:</p>

                <div className="space-y-3 flex-1">
                  {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                    <div key={title} className="flex gap-3 items-start">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={dismiss}
                  className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm transition-colors"
                >
                  Start Reading
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
